import { useId } from 'react';
import { cn } from './cn';
import { Field, controlClases, claseBorde } from './Field';

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: React.ComponentProps<'textarea'> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const auto = useId();
  const campo = id ?? auto;
  return (
    <Field id={campo} label={label} error={error} hint={hint}>
      <textarea
        id={campo}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${campo}-desc` : undefined}
        className={cn(controlClases, 'py-2', claseBorde(error), className)}
        {...props}
      />
    </Field>
  );
}
