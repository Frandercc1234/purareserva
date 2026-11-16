import { groq } from '@ai-sdk/groq';
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { crearHerramientas } from '@/lib/asistente/herramientas';
import {
  claveVisitante,
  ipDe,
  registrarMensaje,
} from '@/lib/asistente/limites';
import { construirPrompt } from '@/lib/asistente/prompt';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_CARACTERES = 500;
const MAX_MENSAJES = 6;
const MODELO_POR_DEFECTO = 'openai/gpt-oss-120b';

const entradaSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        parts: z.array(z.looseObject({ type: z.string() })),
      }),
    )
    .min(1)
    .max(100),
  locale: z.enum(['es', 'en']),
  contexto: z
    .object({
      negocio_slug: z.string().max(60).optional(),
      tour_slug: z.string().max(60).optional(),
    })
    .optional(),
});

const error = (codigo: string, status: number) =>
  NextResponse.json({ error: codigo }, { status });

/** Texto de los mensajes del usuario (para validar su largo; no se registra). */
function textoDe(mensaje: { parts: { type: string; text?: unknown }[] }) {
  return mensaje.parts
    .filter((p) => p.type === 'text')
    .map((p) => String(p.text ?? ''))
    .join('');
}

/** 429 y 5xx del proveedor se avisan como "no disponible"; el resto, como error. */
function codigoDeError(e: unknown) {
  const estado = APICallError.isInstance(e) ? e.statusCode : undefined;
  console.error('asistente: error del modelo', estado ?? 'sin código');
  return estado === 429 || (estado !== undefined && estado >= 500)
    ? 'NO_DISPONIBLE'
    : 'DESCONOCIDO';
}

async function modelo(locale: 'es' | 'en') {
  if (process.env.ASISTENTE_MOCK === '1') {
    const { crearModeloSimulado } = await import('@/lib/asistente/mock');
    return crearModeloSimulado(locale);
  }
  return groq(process.env.GROQ_MODEL || MODELO_POR_DEFECTO);
}

export async function POST(request: Request) {
  const mock = process.env.ASISTENTE_MOCK === '1';

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error('VALIDACION', 400);
  }
  const parsed = entradaSchema.safeParse(cuerpo);
  if (!parsed.success) return error('VALIDACION', 400);
  const { locale, contexto } = parsed.data;
  const mensajes = parsed.data.messages.slice(-MAX_MENSAJES);

  const ultimo = mensajes[mensajes.length - 1];
  if (ultimo.role !== 'user') return error('VALIDACION', 400);
  if (
    mensajes.some(
      (m) => m.role === 'user' && textoDe(m).length > MAX_CARACTERES,
    )
  ) {
    return error('VALIDACION', 400);
  }

  // Sin mock: control de uso por visitante y global del día.
  if (!mock) {
    if (!process.env.GROQ_API_KEY) {
      console.error('asistente: falta GROQ_API_KEY');
      return error('NO_DISPONIBLE', 503);
    }
    try {
      const permitido = await registrarMensaje(claveVisitante(ipDe(request)));
      if (!permitido) return error('LIMITE', 429);
    } catch (e) {
      console.error(
        'asistente: falló el control de uso',
        e instanceof Error ? e.message : 'error',
      );
      return error('DESCONOCIDO', 500);
    }
  }

  // Contexto de la página: el asistente prioriza ese negocio y tour.
  const db = createAdminClient();
  let negocio: { nombre: string; whatsapp: string | null } | undefined;
  let tour: { nombre: string } | undefined;
  if (contexto?.negocio_slug) {
    const { data } = await db
      .from('negocios')
      .select('id, nombre, whatsapp')
      .eq('slug', contexto.negocio_slug)
      .eq('activo', true)
      .maybeSingle();
    if (data) {
      negocio = { nombre: data.nombre, whatsapp: data.whatsapp };
      if (contexto.tour_slug) {
        const { data: t } = await db
          .from('tours')
          .select('nombre_es, nombre_en')
          .eq('negocio_id', data.id)
          .eq('slug', contexto.tour_slug)
          .eq('activo', true)
          .maybeSingle();
        if (t) tour = { nombre: locale === 'en' ? t.nombre_en : t.nombre_es };
      }
    }
  }

  const herramientas = crearHerramientas(
    {
      locale,
      negocioSlug: negocio ? contexto?.negocio_slug : undefined,
    },
    db,
  );
  const resultado = streamText({
    model: await modelo(locale),
    system: construirPrompt({ locale, negocio, tour }),
    // Con `tools`, el historial también usa la vista reducida de cada resultado.
    messages: await convertToModelMessages(mensajes as UIMessage[], {
      tools: herramientas,
    }),
    tools: herramientas,
    // Por defecto el SDK imprime el error completo (con el texto enviado): el único
    // registro es codigoDeError, que solo guarda el código de estado.
    onError: () => undefined,
    // Solo números: sirve para ajustar el límite global según la cuota de tokens.
    onFinish: ({ totalUsage }) =>
      console.log(
        `asistente: tokens entrada=${totalUsage.inputTokens} salida=${totalUsage.outputTokens}`,
      ),
    stopWhen: stepCountIs(4),
    temperature: 0.3,
    maxOutputTokens: 600,
    // gpt-oss razona antes de responder: con esfuerzo bajo gasta menos cuota.
    providerOptions: { groq: { reasoningEffort: 'low' } },
  });

  // Se espera el primer fragmento: si el proveedor falla de entrada (429 o 5xx), se
  // responde 503 en vez de un stream con error.
  const lector = resultado
    .toUIMessageStream({ onError: codigoDeError })
    .getReader();
  const inicio: UIMessageChunk[] = [];
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    if (value.type === 'error') {
      return value.errorText === 'NO_DISPONIBLE'
        ? error('NO_DISPONIBLE', 503)
        : error('DESCONOCIDO', 500);
    }
    inicio.push(value);
    if (value.type !== 'start' && value.type !== 'start-step') break;
  }

  const stream = new ReadableStream<UIMessageChunk>({
    start(controlador) {
      for (const fragmento of inicio) controlador.enqueue(fragmento);
    },
    async pull(controlador) {
      const { done, value } = await lector.read();
      if (done) controlador.close();
      else controlador.enqueue(value);
    },
    cancel: (motivo) => lector.cancel(motivo),
  });
  return createUIMessageStreamResponse({ stream });
}
