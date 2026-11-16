'use client';

import type { UIMessage } from 'ai';
import { useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import { Marca } from '@/components/publico/Marca';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { Badge } from '@/components/ui/Badge';
import { Button, botonClases } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Link } from '@/i18n/routing';
import type {
  ResultadoReserva,
  TourParaChat,
} from '@/lib/asistente/herramientas';
import { MensajeAsistente } from './MensajeAsistente';
import { TarjetaTourChat } from './TarjetaTourChat';
import NextLink from 'next/link';

const MAX_CARACTERES = 500;
const AVISO_DESDE = 400;

export type ContextoChat = { negocio_slug?: string; tour_slug?: string };
export type ErrorChat =
  { tipo: 'limite'; whatsapp: string | null } | { tipo: 'no-disponible' };

/** true en pantallas de menos de 640 px (el panel va a pantalla completa). */
function useEsMovil() {
  return useSyncExternalStore(
    (alCambiar) => {
      const m = window.matchMedia('(max-width: 639px)');
      m.addEventListener('change', alCambiar);
      return () => m.removeEventListener('change', alCambiar);
    },
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false,
  );
}

type ParteHerramienta = {
  type: string;
  state?: string;
  input?: { personas?: number };
  output?: unknown;
};

function Escribiendo({ etiqueta }: { etiqueta: string }) {
  return (
    <div
      role="status"
      className="flex h-9 w-fit items-center gap-1 rounded-tarjeta rounded-bl-sm border border-borde bg-superficie px-3"
    >
      <span className="sr-only">{etiqueta}</span>
      {[1, 0.6, 0.3].map((o) => (
        <i
          key={o}
          aria-hidden="true"
          style={{ opacity: o }}
          className="size-2 animate-pulse rounded-full bg-texto-suave"
        />
      ))}
    </div>
  );
}

export function AsistentePanel({
  mensajes,
  ocupado,
  error,
  contexto,
  onEnviar,
  onReintentar,
  onCerrar,
}: {
  mensajes: UIMessage[];
  /** El asistente está respondiendo. */
  ocupado: boolean;
  error: ErrorChat | null;
  contexto: ContextoChat;
  onEnviar: (texto: string) => void;
  onReintentar: () => void;
  onCerrar: () => void;
}) {
  const t = useTranslations('Asistente');
  const esMovil = useEsMovil();
  const [texto, setTexto] = useState('');
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const limite = error?.tipo === 'limite';
  const enTour = !!contexto.tour_slug;

  // Al abrir, el foco va a la entrada de texto.
  useEffect(() => {
    entradaRef.current?.focus();
  }, []);

  // Pantalla completa en móvil: la página de atrás no se desplaza.
  useEffect(() => {
    if (!esMovil) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [esMovil]);

  // Siempre se ve lo último.
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, ocupado, error]);

  const ultimo = mensajes[mensajes.length - 1];
  const respondiendoTexto =
    ultimo?.role === 'assistant' &&
    ultimo.parts.some((p) => p.type === 'text' && p.text.length > 0);
  const mostrarEscribiendo =
    ocupado && !(ultimo?.role === 'assistant' && respondiendoTexto);

  function enviar(valor: string) {
    const limpio = valor.trim();
    if (!limpio || ocupado || limite) return;
    onEnviar(limpio.slice(0, MAX_CARACTERES));
    setTexto('');
    if (entradaRef.current) entradaRef.current.style.height = '';
  }

  function alTeclear(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar(texto);
    }
  }

  const sugerencias = enTour
    ? [t('t1'), t('t2'), t('t3')]
    : [t('s1'), t('s2'), t('s3')];
  const verToursHref = contexto.negocio_slug
    ? `/${contexto.negocio_slug}`
    : '/#operadores';

  return (
    <div
      id="asistente-panel"
      role="dialog"
      aria-modal={esMovil}
      aria-label={t('titulo')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCerrar();
        }
      }}
      className="asistente-panel fixed inset-0 z-50 flex flex-col overflow-hidden bg-fondo sm:inset-auto sm:right-6 sm:bottom-24 sm:h-[560px] sm:w-[380px] sm:rounded-tarjeta sm:border sm:border-borde sm:shadow-[0_8px_28px_rgb(0_0_0/0.16)]"
    >
      <header className="flex items-center gap-2 border-b border-borde bg-superficie px-4 py-3">
        <Marca className="size-8 shrink-0" />
        <h2 className="flex-1 text-base leading-5 font-semibold">
          {t('titulo')}
        </h2>
        <Badge tono="destacado" className="px-2 py-0.5 text-xs">
          {t('beta')}
        </Badge>
        <button
          type="button"
          onClick={onCerrar}
          aria-label={t('cerrar')}
          className="-mr-3 inline-flex size-11 items-center justify-center rounded-control text-texto-suave transition-colors duration-150 hover:bg-fondo hover:text-texto"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {mensajes.length === 0 && (
          <>
            <div className="w-fit max-w-[85%] rounded-tarjeta rounded-bl-sm border border-borde bg-superficie px-3 py-2 text-[15px] leading-[22px]">
              {t('saludo')}
            </div>
            <div className="flex flex-col items-start gap-2">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="min-h-11 rounded-full border border-primario bg-superficie px-4 text-left text-sm text-primario transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-fondo motion-safe:active:scale-[0.97]"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {mensajes.map((m) =>
          m.role === 'user' ? (
            <div
              key={m.id}
              className="ml-auto max-w-[85%] rounded-tarjeta rounded-br-sm bg-primario px-3 py-2 text-[15px] leading-[22px] break-words text-superficie"
            >
              {m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}
            </div>
          ) : (
            <div key={m.id} className="flex flex-col gap-3">
              {m.parts.map((parte, i) => {
                if (parte.type === 'text') {
                  return parte.text ? (
                    <div
                      key={i}
                      className="w-fit max-w-[90%] rounded-tarjeta rounded-bl-sm border border-borde bg-superficie px-3 py-2 text-[15px] leading-[22px]"
                    >
                      <MensajeAsistente texto={parte.text} />
                    </div>
                  ) : null;
                }
                const h = parte as ParteHerramienta;
                if (h.state !== 'output-available') return null;
                if (h.type === 'tool-buscar_tours') {
                  const tours =
                    (h.output as { tours?: TourParaChat[] })?.tours ?? [];
                  return tours.map((tour) => (
                    <TarjetaTourChat
                      key={`${i}-${tour.url}`}
                      tour={tour}
                      personas={h.input?.personas ?? 1}
                      alNavegar={onCerrar}
                    />
                  ));
                }
                if (h.type === 'tool-preparar_reserva') {
                  const r = h.output as ResultadoReserva | undefined;
                  if (!r?.ok) return null;
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-3 text-sm leading-5"
                    >
                      <p>{r.resumen}</p>
                      <NextLink
                        href={r.url}
                        onClick={onCerrar}
                        className={botonClases('primario', 'w-full')}
                      >
                        {t('completarReserva')}
                      </NextLink>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ),
        )}

        {mostrarEscribiendo && <Escribiendo etiqueta={t('escribiendo')} />}

        {error?.tipo === 'limite' && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-control border border-aviso bg-fondo p-3 text-sm leading-5"
          >
            <p>{error.whatsapp ? t('limite') : t('limiteSinOperador')}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={verToursHref}
                onClick={onCerrar}
                className={botonClases('secundario', 'h-9 px-3 text-sm')}
              >
                {t('verTours')}
              </Link>
              {error.whatsapp && <WhatsAppButton numero={error.whatsapp} />}
            </div>
          </div>
        )}
        {error?.tipo === 'no-disponible' && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-control border border-error bg-fondo p-3 text-sm leading-5"
          >
            <p>{t('noDisponible')}</p>
            <Button
              type="button"
              variante="secundario"
              className="h-9 w-fit px-3 text-sm"
              onClick={onReintentar}
            >
              {t('reintentar')}
            </Button>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <p className="px-4 py-1.5 text-center text-xs leading-4 text-texto-suave">
        {t('avisoIa')}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex flex-col gap-1 border-t border-borde bg-superficie p-3"
      >
        {texto.length > AVISO_DESDE && (
          <span className="self-end text-xs text-aviso">
            {t('contador', { n: texto.length, max: MAX_CARACTERES })}
          </span>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={entradaRef}
            rows={1}
            value={texto}
            maxLength={MAX_CARACTERES}
            readOnly={ocupado}
            disabled={limite}
            placeholder={limite ? t('limiteEntrada') : t('placeholder')}
            aria-label={t('placeholder')}
            onChange={(e) => {
              setTexto(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
            }}
            onKeyDown={alTeclear}
            className={cn(
              'max-h-28 min-h-11 flex-1 resize-none rounded-control border border-borde bg-superficie px-3 py-2.5 text-[15px] leading-6 placeholder:text-texto-suave disabled:bg-fondo',
              ocupado && 'bg-fondo',
            )}
          />
          <button
            type="submit"
            aria-label={t('enviar')}
            disabled={!texto.trim() || ocupado || limite}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primario text-superficie transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primario-oscuro disabled:bg-borde motion-safe:active:scale-[0.97]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
