import { cn } from './cn';

export type TonoBadge = 'neutro' | 'exito' | 'aviso' | 'error' | 'destacado';

const tonos: Record<TonoBadge, string> = {
  neutro: 'bg-borde text-texto',
  exito: 'bg-exito text-superficie',
  aviso: 'bg-aviso text-superficie',
  error: 'bg-error text-superficie',
  destacado: 'bg-acento text-texto',
};

export function Badge({
  tono = 'neutro',
  className,
  ...props
}: React.ComponentProps<'span'> & { tono?: TonoBadge }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}
