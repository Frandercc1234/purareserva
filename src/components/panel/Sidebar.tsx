'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <aside className="border-b border-borde bg-superficie md:min-h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-2 md:flex-col md:items-stretch md:gap-1 md:py-6">
        <span className="font-semibold text-primario">{nombre}</span>
        <form action={cerrarSesion}>
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
        className="flex gap-1 overflow-x-auto px-4 pb-2 md:flex-col md:pb-6"
      >
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo(e.href) ? 'page' : undefined}
            className={cn(
              'inline-flex h-11 shrink-0 items-center rounded-control px-3',
              activo(e.href)
                ? 'bg-primario text-superficie'
                : 'text-texto hover:bg-fondo',
            )}
          >
            {e.texto}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
