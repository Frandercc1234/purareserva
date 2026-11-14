import { cn } from './cn';

export function Spinner({
  etiqueta = 'Cargando',
  className,
}: {
  etiqueta?: string;
  className?: string;
}) {
  return (
    <svg
      role="status"
      aria-label={etiqueta}
      viewBox="0 0 24 24"
      className={cn('size-6 animate-spin text-primario', className)}
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
