import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { botonClases } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, Td, Th } from '@/components/ui/Table';
import { formatearUSD } from '@/lib/dinero';
import { contextoPanel } from '@/lib/panel';
import { cambiarEstadoTour } from './actions';

export const metadata: Metadata = { title: 'Tours' };

export default async function ToursPage() {
  const { supabase, negocio } = await contextoPanel();
  const { data: tours } = await supabase
    .from('tours')
    .select('id, nombre_es, precio_cents, cupo_default, activo')
    .eq('negocio_id', negocio.id)
    .order('creado_en', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Tours</h1>
        {!!tours?.length && (
          <Link href="/panel/tours/nuevo" className={botonClases()}>
            Nuevo tour
          </Link>
        )}
      </div>

      {!tours?.length ? (
        <EmptyState
          titulo="Creá tu primer tour"
          descripcion="Los tours que publiques aparecen en la página de tu negocio."
          accion={
            <Link href="/panel/tours/nuevo" className={botonClases()}>
              Nuevo tour
            </Link>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th className="hidden sm:table-cell">Precio</Th>
              <Th className="hidden sm:table-cell">Cupo</Th>
              <Th>Activo</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t.id}>
                <Td className="font-semibold">
                  {t.nombre_es}
                  <span className="block text-sm font-normal text-texto-suave sm:hidden">
                    {formatearUSD(t.precio_cents, 'en')} · cupo {t.cupo_default}
                  </span>
                </Td>
                <Td className="hidden sm:table-cell">
                  {formatearUSD(t.precio_cents, 'en')}
                </Td>
                <Td className="hidden sm:table-cell">{t.cupo_default}</Td>
                <Td>
                  <form
                    action={cambiarEstadoTour}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <input
                      type="hidden"
                      name="activo"
                      value={String(!t.activo)}
                    />
                    <button
                      type="submit"
                      role="switch"
                      aria-checked={t.activo}
                      aria-label={`${t.activo ? 'Desactivar' : 'Activar'} ${t.nombre_es}`}
                      className="inline-flex h-11 items-center"
                    >
                      <span
                        className={cn(
                          'relative inline-block h-6 w-11 rounded-full transition-colors',
                          t.activo ? 'bg-primario' : 'bg-borde-control',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 left-0.5 size-5 rounded-full bg-superficie shadow transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
                            t.activo && 'translate-x-[22px]',
                          )}
                        />
                      </span>
                    </button>
                    <Badge
                      tono={t.activo ? 'exito' : 'neutro'}
                      className="hidden sm:inline-flex"
                    >
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </form>
                </Td>
                <Td>
                  <div className="flex flex-col sm:flex-row sm:gap-3">
                    <Link
                      href={`/panel/tours/${t.id}`}
                      className="inline-flex h-11 min-w-11 items-center text-primario underline"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/panel/tours/${t.id}/salidas`}
                      className="inline-flex h-11 min-w-11 items-center text-primario underline"
                    >
                      Salidas
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
