import { cn } from './cn';

export const controlClases =
  'w-full rounded-control border bg-superficie px-3 text-texto placeholder:text-texto-suave disabled:bg-fondo disabled:text-texto-suave';

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
      <label htmlFor={id} className="text-sm">
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
  return cn(error ? 'border-error' : 'border-borde');
}
