import { cn } from './cn';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-tarjeta border border-borde bg-superficie p-4 shadow-tarjeta',
        className,
      )}
      {...props}
    />
  );
}
