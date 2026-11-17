import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  SalidasLoteForm,
  SalidaUnicaForm,
} from '@/components/panel/SalidasLoteForm';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, Td, Th } from '@/components/ui/Table';
import { formatearCorto } from '@/lib/fechas';
import { contextoPanel } from '@/lib/panel';
import { eliminarSalida } from './actions';

export const metadata: Metadata = { title: 'Salidas del tour' };

export default async function SalidasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, negocio } = await contextoPanel();

  const { data: tour } = await supabase
    .from('tours')
    .select('id, nombre_es, cupo_default')
    .eq('id', id)
    .eq('negocio_id', negocio.id)
    .maybeSingle();
  if (!tour) notFound();

  const { data: salidas } = await supabase
    .from('salidas_ocupacion')
    .select('id, inicia_en, cupo, ocupados')
    .eq('tour_id', tour.id)
    .eq('negocio_id', negocio.id)
    .eq('estado', 'programada')
    .gt('inicia_en', new Date().toISOString())
    .order('inicia_en', { ascending: true })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/panel/tours"
          className="inline-flex h-11 items-center text-primario underline"
        >
          Volver a tours
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Salidas: {tour.nombre_es}
        </h1>
      </div>

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <SalidaUnicaForm tourId={tour.id} cupoDefault={tour.cupo_default} />
        <SalidasLoteForm tourId={tour.id} cupoDefault={tour.cupo_default} />
      </div>

      <h2 className="text-2xl font-semibold">Próximas salidas</h2>
      {!salidas?.length ? (
        <EmptyState titulo="Este tour no tiene salidas programadas" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Salida</Th>
              <Th>Ocupación</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {salidas.map((s) => {
              const ocupados = s.ocupados ?? 0;
              const conReservas = ocupados > 0;
              return (
                <tr key={s.id}>
                  <Td>{s.inicia_en ? formatearCorto(s.inicia_en) : ''}</Td>
                  <Td>
                    <Badge tono={conReservas ? 'aviso' : 'neutro'}>
                      {ocupados}/{s.cupo}
                    </Badge>
                  </Td>
                  <Td>
                    <form action={eliminarSalida}>
                      <input type="hidden" name="id" value={s.id ?? ''} />
                      <input type="hidden" name="tour_id" value={tour.id} />
                      <button
                        type="submit"
                        disabled={conReservas}
                        title={
                          conReservas
                            ? 'No se puede eliminar: tiene reservas'
                            : undefined
                        }
                        className="inline-flex h-11 items-center text-error underline disabled:cursor-not-allowed disabled:text-texto-suave disabled:no-underline"
                      >
                        Eliminar
                      </button>
                    </form>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
