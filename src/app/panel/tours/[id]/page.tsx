import { notFound } from 'next/navigation';
import { TourForm } from '@/components/panel/TourForm';
import { centavosATexto } from '@/lib/dinero';
import { contextoPanel } from '@/lib/panel';

export default async function EditarTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, negocio } = await contextoPanel();

  // Se filtra por negocio: la política pública también deja ver tours ajenos activos.
  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .eq('negocio_id', negocio.id)
    .maybeSingle();
  if (!tour) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Editar tour</h1>
      <TourForm
        tour={{
          id: tour.id,
          nombre_es: tour.nombre_es,
          nombre_en: tour.nombre_en,
          descripcion_es: tour.descripcion_es,
          descripcion_en: tour.descripcion_en,
          precio: centavosATexto(tour.precio_cents),
          duracion_min: tour.duracion_min,
          cupo_default: tour.cupo_default,
          punto_encuentro: tour.punto_encuentro,
          imagen_url: tour.imagen_url,
          activo: tour.activo,
        }}
      />
    </div>
  );
}
