import { cn } from './cn';

type Variante = 'primario' | 'secundario' | 'onDark';

const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-5 font-semibold transition-[color,background-color,border-color,transform] duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100';

/**
 * primario: la acción (brasa con texto carbón), el único color de acción del sitio.
 * secundario: contorno carbón sobre claro. onDark: contorno hueso sobre carbón.
 */
const variantes: Record<Variante, string> = {
  primario:
    'bg-accion text-texto hover:bg-accion-hover disabled:bg-borde disabled:text-texto-suave',
  onDark:
    'border border-hueso bg-transparent text-hueso hover:bg-hueso hover:text-carbon disabled:border-hueso-suave disabled:text-hueso-suave disabled:hover:bg-transparent',
  secundario:
    'border border-primario bg-superficie text-primario hover:bg-primario hover:text-superficie disabled:border-borde disabled:bg-superficie disabled:text-texto-suave disabled:hover:bg-superficie disabled:hover:text-texto-suave',
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
