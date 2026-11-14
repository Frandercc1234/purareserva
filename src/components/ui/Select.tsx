import { useId } from 'react';
import { cn } from './cn';
import { Field, controlClases, claseBorde } from './Field';

export function Select({
  label,
  error,
  hint,
  className,
  id,
  children,
  ...props
}: React.ComponentProps<'select'> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const auto = useId();
  const campo = id ?? auto;
  return (
    <Field id={campo} label={label} error={error} hint={hint}>
      <select
        id={campo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${campo}-desc` : undefined}
        className={cn(controlClases, 'h-11', claseBorde(error), className)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
