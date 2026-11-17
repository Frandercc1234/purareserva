import Link from 'next/link';
import { Marca } from '@/components/publico/Marca';

const PUNTOS = [
  'Cupos que no se venden dos veces',
  'Depósito cobrado antes de la salida',
  'Panel con tus reservas e ingresos',
];

/** Marco de las pantallas de acceso: panel de marca a la izquierda y formulario a la derecha. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden border-r border-borde bg-superficie text-texto lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link
          href="/es"
          className="flex min-h-11 w-fit items-center gap-2 rounded-control text-lg font-semibold"
        >
          <Marca className="size-8" />
          PuraReserva
        </Link>
        <div className="relative z-10 flex flex-col gap-6">
          <h2 className="max-w-sm text-4xl leading-tight font-semibold tracking-tight text-balance">
            Tus tours de Guanacaste, con el cupo bajo control.
          </h2>
          <ul className="flex flex-col gap-3">
            {PUNTOS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-acento text-sm font-semibold text-texto"
                >
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex flex-col px-4 py-6">
        <Link
          href="/es"
          className="flex min-h-11 w-fit items-center gap-2 rounded-control font-semibold lg:hidden"
        >
          <Marca className="size-8" />
          PuraReserva
        </Link>
        <div className="flex flex-1 items-center justify-center py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
