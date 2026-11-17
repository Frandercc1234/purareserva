'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from '@/i18n/routing';
import { AsistenteBoton } from './AsistenteBoton';
import {
  AsistentePanel,
  type ContextoChat,
  type ErrorChat,
} from './AsistentePanel';

const CLAVE_SESION = 'asistente:conversacion';

/** Negocio y tour que el turista está viendo, según la ruta (sin el prefijo de idioma). */
function contextoDeRuta(ruta: string): ContextoChat {
  const [negocio, tour] = ruta.split('/').filter(Boolean);
  if (!negocio || negocio === 'reserva') return {};
  return { negocio_slug: negocio, ...(tour ? { tour_slug: tour } : {}) };
}

/** Interpreta el error del servidor ({ error: 'LIMITE' | … }) o de red. */
function interpretarError(error: Error | undefined): ErrorChat | null {
  if (!error) return null;
  try {
    const cuerpo = JSON.parse(error.message) as {
      error?: string;
      whatsapp?: string | null;
    };
    if (cuerpo.error === 'LIMITE')
      return { tipo: 'limite', whatsapp: cuerpo.whatsapp ?? null };
  } catch {
    // No era JSON: error de red o del servidor.
  }
  return { tipo: 'no-disponible' };
}

/** Chat flotante del asistente: botón, panel y conversación (vive mientras dure la sesión). */
export function Asistente({
  abiertoInicial = false,
}: {
  abiertoInicial?: boolean;
}) {
  const locale = useLocale();
  const ruta = usePathname();
  const contexto = useMemo(() => contextoDeRuta(ruta), [ruta]);
  const [abierto, setAbierto] = useState(abiertoInicial);
  const botonRef = useRef<HTMLButtonElement>(null);

  // El transporte lee el idioma y el contexto más recientes en cada pedido.
  const actual = useRef({ locale, contexto });
  useEffect(() => {
    actual.current = { locale, contexto };
  }, [locale, contexto]);
  const [transporte] = useState(
    () =>
      new DefaultChatTransport({
        api: '/api/asistente',
        body: () => ({
          locale: actual.current.locale,
          contexto: actual.current.contexto,
        }),
      }),
  );
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    setMessages,
    clearError,
  } = useChat({ transport: transporte });

  // La conversación se conserva al cambiar de página y al recargar; se borra al cerrar la pestaña.
  useEffect(() => {
    try {
      const guardada = sessionStorage.getItem(CLAVE_SESION);
      if (guardada) setMessages(JSON.parse(guardada));
    } catch {
      // Sin almacenamiento disponible: la conversación vive solo en memoria.
    }
  }, [setMessages]);
  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') return;
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(messages));
    } catch {
      // Ídem.
    }
  }, [messages, status]);

  function cerrar() {
    setAbierto(false);
    // Devuelve el foco al botón una vez que vuelve a mostrarse.
    setTimeout(() => botonRef.current?.focus(), 0);
  }

  return (
    <>
      <AsistenteBoton
        ref={botonRef}
        abierto={abierto}
        onClick={() => setAbierto((a) => !a)}
      />
      {abierto && (
        <AsistentePanel
          mensajes={messages}
          ocupado={status === 'submitted' || status === 'streaming'}
          error={interpretarError(error)}
          contexto={contexto}
          onEnviar={(texto) => {
            clearError();
            void sendMessage({ text: texto });
          }}
          onReintentar={() => {
            clearError();
            void regenerate();
          }}
          onCerrar={cerrar}
        />
      )}
    </>
  );
}
