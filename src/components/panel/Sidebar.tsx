'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Marca } from '@/components/publico/Marca';
import { cn } from '@/components/ui/cn';

const ENLACES = [
  { href: '/panel', texto: 'Resumen' },
  { href: '/panel/tours', texto: 'Tours' },
  { href: '/panel/reservas', texto: 'Reservas' },
  { href: '/panel/configuracion', texto: 'Configuración' },
];

export function Sidebar({
  nombre,
  cerrarSesion,
}: {
  nombre: string;
  cerrarSesion: () => Promise<void>;
}) {
  const pathname = usePathname();
  const activo = (href: string) =>
    href === '/panel' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 z-20 border-b border-borde bg-superficie md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:flex-col md:items-stretch md:gap-4 md:px-5 md:py-6">
        <Link
          href="/panel"
          className="flex min-h-11 items-center gap-2 font-semibold"
        >
          <Marca className="size-8" />
          PuraReserva
        </Link>
        <p className="hidden truncate rounded-control bg-primario/10 px-3 py-2 text-sm font-semibold text-primario-oscuro md:block">
          {nombre}
        </p>
        <form action={cerrarSesion} className="md:hidden">
          <button
            type="submit"
            className="inline-flex h-11 items-center text-sm text-texto-suave underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
      <nav
        aria-label="Panel"
        className="flex gap-1 overflow-x-auto px-4 pb-2 md:flex-col md:px-3 md:pb-6"
      >
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo(e.href) ? 'page' : undefined}
            className={cn(
              'inline-flex h-11 shrink-0 items-center rounded-control px-2.5 text-sm font-semibold transition-[background-color,color] duration-150 md:px-3 md:text-base',
              activo(e.href)
                ? 'bg-primario text-superficie'
                : 'text-texto-suave hover:bg-fondo hover:text-texto',
            )}
          >
            {e.texto}
          </Link>
        ))}
      </nav>
      <form
        action={cerrarSesion}
        className="absolute inset-x-0 bottom-0 hidden border-t border-borde p-3 md:block"
      >
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center rounded-control px-3 text-sm text-texto-suave transition-colors duration-150 hover:bg-fondo hover:text-texto"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
