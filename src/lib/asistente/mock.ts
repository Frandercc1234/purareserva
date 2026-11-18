import { APICallError } from 'ai';
import { MockLanguageModelV2 } from 'ai/test';
import { diaCR } from '@/lib/fechas';

/**
 * Modelo simulado para pruebas y CI (ASISTENTE_MOCK=1): reemplaza solo al modelo. Las
 * herramientas corren de verdad contra la base, así que las tarjetas y los enlaces son
 * reales. No usa Groq ni gasta cuota.
 */

type Parte = { type: string; [clave: string]: unknown };
type Mensaje = { role: string; content: Parte[] | string };

const USO = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

const textoDe = (m: Mensaje | undefined) =>
  !m
    ? ''
    : typeof m.content === 'string'
      ? m.content
      : m.content
          .filter((p) => p.type === 'text')
          .map((p) => String(p.text))
          .join(' ');

/** Último resultado de una herramienta en la conversación. */
function resultadoDe(prompt: Mensaje[], nombre: string) {
  for (const m of [...prompt].reverse()) {
    if (m.role !== 'tool' || typeof m.content === 'string') continue;
    for (const p of m.content) {
      const salida = p.output as { type?: string; value?: unknown } | undefined;
      if (p.type === 'tool-result' && p.toolName === nombre)
        return salida?.value;
    }
  }
  return undefined;
}

function llamarHerramienta(toolName: string, input: object) {
  return [
    { type: 'stream-start', warnings: [] },
    {
      type: 'tool-call',
      toolCallId: `mock-${toolName}-${Date.now()}`,
      toolName,
      input: JSON.stringify(input),
    },
    { type: 'finish', finishReason: 'tool-calls', usage: USO },
  ];
}

function responderTexto(texto: string) {
  return [
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 'texto' },
    { type: 'text-delta', id: 'texto', delta: texto },
    { type: 'text-end', id: 'texto' },
    { type: 'finish', finishReason: 'stop', usage: USO },
  ];
}

/** Resume el resultado de la última herramienta con una frase corta. */
function resumir(ultimo: Parte[], es: boolean) {
  const llamada = ultimo.find((p) => p.type === 'tool-result');
  const valor =
    (llamada?.output as { value?: Record<string, unknown> })?.value ?? {};
  switch (llamada?.toolName) {
    case 'buscar_tours': {
      const tours = (valor.tours as { tour: string }[]) ?? [];
      if (!tours.length)
        return es
          ? 'No encontré tours con cupo para esa búsqueda.'
          : 'I found no tours with availability for that search.';
      return es
        ? `Encontré ${tours.length} ${tours.length === 1 ? 'opción' : 'opciones'}. Podés verlas o reservar desde las tarjetas.`
        : `I found ${tours.length} ${tours.length === 1 ? 'option' : 'options'}. You can view them or book from the cards.`;
    }
    case 'buscar_guia': {
      const fichas =
        (valor.fichas as { titulo: string; fuente_nombre: string }[]) ?? [];
      if (!fichas.length)
        return es
          ? 'No tengo esa información en la guía.'
          : "I don't have that information in the guide.";
      return es
        ? `${fichas[0].titulo}: mirá el detalle en la guía. Fuente: ${fichas[0].fuente_nombre}.`
        : `${fichas[0].titulo}: see the details in the guide. Source: ${fichas[0].fuente_nombre}.`;
    }
    case 'preparar_reserva':
      return valor.ok
        ? es
          ? 'Listo. Completá tus datos y pagá el depósito con el botón.'
          : 'Done. Enter your details and pay the deposit with the button.'
        : es
          ? 'No pude preparar esa reserva: la salida ya no está disponible.'
          : 'I could not prepare that booking: the departure is no longer available.';
    default:
      return es ? 'Listo.' : 'Done.';
  }
}

export function crearModeloSimulado(locale: 'es' | 'en') {
  const es = locale === 'es';
  return new MockLanguageModelV2({
    doStream: async ({ prompt, toolChoice }) => {
      const mensajes = prompt as unknown as Mensaje[];
      const ultimo = mensajes[mensajes.length - 1];
      let partes: Parte[];

      if (
        toolChoice?.type === 'tool' &&
        toolChoice.toolName === 'preparar_reserva'
      ) {
        // Paso forzado por prepareStep: se reserva la primera salida de la última búsqueda.
        const tours = (
          resultadoDe(mensajes, 'buscar_tours') as {
            tours?: { salidas: { id: string }[] }[];
          }
        )?.tours;
        const texto = textoDe(
          [...mensajes].reverse().find((m) => m.role === 'user'),
        ).toLowerCase();
        const personas = Number(
          texto.match(/(\d+)\s*(personas|people|guests)/)?.[1] ?? 1,
        );
        partes = llamarHerramienta('preparar_reserva', {
          salida_id: tours?.[0]?.salidas?.[0]?.id,
          personas,
        });
      } else if (
        ultimo?.role === 'tool' &&
        typeof ultimo.content !== 'string'
      ) {
        // Simula el 429 de Groq en el último paso, después de que la herramienta ya respondió.
        const ultimoUsuario = [...mensajes]
          .reverse()
          .find((m) => m.role === 'user');
        if (textoDe(ultimoUsuario).includes('simular-fallo'))
          throw new APICallError({
            message: 'Rate limit',
            url: 'https://mock',
            requestBodyValues: {},
            statusCode: 429,
            isRetryable: false,
          });
        partes = responderTexto(resumir(ultimo.content, es));
      } else {
        const texto = textoDe(ultimo).toLowerCase();
        const personas = Number(
          texto.match(/(\d+)\s*(personas|people|guests)/)?.[1] ?? 1,
        );
        if (/reserv|book/.test(texto)) {
          const tours = (
            resultadoDe(mensajes, 'buscar_tours') as {
              tours?: { salidas: { id: string }[] }[];
            }
          )?.tours;
          const salida = tours?.[0]?.salidas?.[0]?.id;
          partes = salida
            ? llamarHerramienta('preparar_reserva', {
                salida_id: salida,
                personas,
              })
            : responderTexto(
                es
                  ? 'Primero buscá un tour para elegir la salida.'
                  : 'First search for a tour to choose the departure.',
              );
        } else if (
          /playa|beach|clima|weather|season|temporada|parque|park|airport|aeropuerto|seca|dry/.test(
            texto,
          )
        ) {
          const consulta = /seca|dry|temporada|season|clima|weather/.test(texto)
            ? 'dry season in Guanacaste'
            : /aeropuerto|airport/.test(texto)
              ? 'Liberia airport'
              : 'beaches near Tamarindo';
          partes = llamarHerramienta('buscar_guia', { consulta_en: consulta });
        } else if (
          /tour|mañana|tomorrow|precio|price|cupo|snorkel|canopy|catamar/.test(
            texto,
          )
        ) {
          const manana = diaCR(new Date(Date.now() + 86_400_000));
          partes = llamarHerramienta('buscar_tours', {
            ...(/mañana|tomorrow/.test(texto)
              ? { fecha_desde: manana, fecha_hasta: manana }
              : {}),
            personas,
          });
        } else {
          partes = responderTexto(
            es
              ? 'Solo puedo ayudarte con turismo en Guanacaste.'
              : 'I can only help with tourism in Guanacaste.',
          );
        }
      }

      return {
        stream: new ReadableStream({
          start(controller) {
            for (const parte of partes) controller.enqueue(parte);
            controller.close();
          },
        }) as never,
      };
    },
  });
}
