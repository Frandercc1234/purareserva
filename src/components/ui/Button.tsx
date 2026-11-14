import { cn } from './cn';

type Variante = 'primario' | 'secundario';

const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold transition-colors disabled:cursor-not-allowed';

const variantes: Record<Variante, string> = {
  primario:
    'bg-primario text-superficie hover:bg-primario-oscuro disabled:bg-borde disabled:text-texto-suave',
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
