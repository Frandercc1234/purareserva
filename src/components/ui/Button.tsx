import { cn } from './cn';

type Variante = 'primario' | 'secundario' | 'onDark';

const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold transition-[color,background-color,border-color,transform] duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100';

const variantes: Record<Variante, string> = {
  primario:
    'bg-primario text-superficie hover:bg-primario-oscuro disabled:bg-borde disabled:text-texto-suave',
  onDark:
    'border border-superficie bg-superficie text-primario-oscuro hover:bg-fondo disabled:border-borde disabled:bg-borde disabled:text-texto-suave',
  secundario:
    'border border-primario bg-superficie text-primario hover:border-primario-oscuro hover:bg-fondo hover:text-primario-oscuro disabled:border-borde disabled:text-texto-suave disabled:hover:bg-superficie',
};

/** Clases del botón, para usarlas también en enlaces (<Link>). */
export function botonClases(variante: Variante = 'primario', extra?: string) {
  return cn(base, variantes[variante], extra);
}

export function Button({
  variante = 'primario',
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { variante?: Variante }) {
  return (
    <button
      type={type}
      className={botonClases(variante, className)}
      {...props}
    />
  );
}
