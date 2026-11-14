'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { contextoPanel } from '@/lib/panel';
import { slugify } from '@/lib/slug';
import { camposDeZod, tourSchema } from '@/lib/validaciones';

export type EstadoTour = {
  ok: boolean;
  error?: 'VALIDACION' | 'DESCONOCIDO';
  campos?: Record<string, string>;
  valores?: Record<string, string>;
} | null;

const TIPOS_IMAGEN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_IMAGEN = 2 * 1024 * 1024;

async function slugLibre(
  supabase: Awaited<ReturnType<typeof contextoPanel>>['supabase'],
  negocioId: string,
  nombre: string,
) {
  const base = slugify(nombre, 60) || 'tour';
  const { data } = await supabase
    .from('tours')
    .select('slug')
    .eq('negocio_id', negocioId)
    .like('slug', `${base}%`);
  const usados = new Set((data ?? []).map((t) => t.slug));
  if (!usados.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
  }
}

export async function guardarTour(
  _prev: EstadoTour,
  formData: FormData,
): Promise<EstadoTour> {
  const valores: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string') valores[k] = v;
  }

  const parsed = tourSchema.safeParse({
    ...valores,
    activo: formData.get('activo') === 'on',
  });
  const campos = parsed.success ? {} : camposDeZod(parsed.error);

  const archivo = formData.get('imagen');
  const imagen = archivo instanceof File && archivo.size > 0 ? archivo : null;
  if (imagen) {
    if (!TIPOS_IMAGEN[imagen.type])
      campos.imagen = 'Usá una imagen JPG, PNG o WebP';
    else if (imagen.size > MAX_IMAGEN)
      campos.imagen = 'La imagen pesa más de 2 MB';
  }

  if (!parsed.success || Object.keys(campos).length) {
    return { ok: false, error: 'VALIDACION', campos, valores };
  }

  const { supabase, negocio } = await contextoPanel();
  const { precio, ...resto } = parsed.data;
  const datos = { ...resto, precio_cents: precio };
  const id = valores.id || null;

  let tourId = id;
  if (id) {
    const { data, error } = await supabase
      .from('tours')
      .update(datos)
      .eq('id', id)
      .eq('negocio_id', negocio.id)
      .select('id');
    if (error || !data?.length)
      return { ok: false, error: 'DESCONOCIDO', valores };
  } else {
    const slug = await slugLibre(supabase, negocio.id, resto.nombre_es);
    const { data, error } = await supabase
      .from('tours')
      .insert({ ...datos, slug, negocio_id: negocio.id })
      .select('id')
      .single();
    if (error || !data) return { ok: false, error: 'DESCONOCIDO', valores };
    tourId = data.id;
  }

  if (imagen && tourId) {
    const ruta = `${negocio.id}/${tourId}.${TIPOS_IMAGEN[imagen.type]}`;
    const { error } = await supabase.storage
      .from('tours')
      .upload(ruta, imagen, { upsert: true, contentType: imagen.type });
    if (error) {
      return {
        ok: false,
        error: 'VALIDACION',
        campos: { imagen: 'No pudimos subir la imagen. Intentá de nuevo.' },
        valores,
      };
    }
    const { data } = supabase.storage.from('tours').getPublicUrl(ruta);
    await supabase
      .from('tours')
      .update({ imagen_url: `${data.publicUrl}?v=${Date.now()}` })
      .eq('id', tourId)
      .eq('negocio_id', negocio.id);
  }

  revalidatePath('/panel/tours');
  if (!id) redirect('/panel/tours');
  return { ok: true };
}

export async function cambiarEstadoTour(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const activo = formData.get('activo') === 'true';
  if (!id) return;
  const { supabase, negocio } = await contextoPanel();
  await supabase
    .from('tours')
    .update({ activo })
    .eq('id', id)
    .eq('negocio_id', negocio.id);
  revalidatePath('/panel/tours');
}
