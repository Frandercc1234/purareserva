import { cn } from './cn';

export const controlClases =
  'w-full rounded-control border bg-superficie px-3 text-texto transition-[border-color,box-shadow] duration-150 ease-[var(--ease-out)] placeholder:text-texto-suave hover:border-primario focus-visible:border-primario disabled:cursor-not-allowed disabled:border-borde disabled:bg-fondo disabled:text-texto-suave disabled:hover:border-borde';

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-desc`} className="text-sm text-texto-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-desc`} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function claseBorde(error?: string) {
  return cn(error ? 'border-error' : 'border-borde-control');
}
