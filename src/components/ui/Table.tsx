import { cn } from './cn';

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'bg-fondo px-3 py-3 font-normal text-texto-suave sm:px-4',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn('border-t border-borde px-3 py-3 sm:px-4', className)}
      {...props}
    />
  );
}
