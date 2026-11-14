import { useId } from 'react';
import { cn } from './cn';
import { Field, controlClases, claseBorde } from './Field';

export function Input({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: React.ComponentProps<'input'> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const auto = useId();
  const campo = id ?? auto;
  return (
    <Field id={campo} label={label} error={error} hint={hint}>
      <input
        id={campo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${campo}-desc` : undefined}
        className={cn(controlClases, 'h-11', claseBorde(error), className)}
        {...props}
      />
    </Field>
  );
}
