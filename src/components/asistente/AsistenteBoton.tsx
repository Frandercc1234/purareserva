'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/components/ui/cn';

/**
 * Botón flotante. En móvil (<640 px) es redondo, de 56 px, solo con ícono; desde 640 px
 * es una pastilla con el texto. El nombre accesible es siempre el mismo.
 */
export function AsistenteBoton({
  abierto,
  onClick,
  ref,
}: {
  abierto: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const t = useTranslations('Asistente');
  return (
    <button
      ref={ref}
      type="button"
      aria-label={t('boton')}
      aria-expanded={abierto}
      aria-controls="asistente-panel"
      aria-haspopup="dialog"
      onClick={onClick}
      className={cn(
        'asistente-boton fixed right-4 bottom-4 z-40 inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-primario font-semibold text-superficie shadow-[0_4px_12px_rgb(0_0_0/0.18)] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-primario-oscuro motion-safe:active:scale-[0.97] sm:right-6 sm:bottom-6 sm:w-auto sm:px-5',
        abierto && 'max-sm:hidden',
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6 shrink-0 fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />
      </svg>
      <span aria-hidden="true" className="hidden sm:inline">
        {t('boton')}
      </span>
    </button>
  );
}
