'use server';

import { revalidatePath } from 'next/cache';
import { MAX_IMAGEN, TIPOS_IMAGEN } from '@/lib/imagenes';
import { createClient } from '@/lib/supabase/server';
import { camposDeZod, negocioSchema } from '@/lib/validaciones';

export type EstadoConfig = {
  ok: boolean;
  error?: 'VALIDACION' | 'NO_AUTORIZADO' | 'DESCONOCIDO';
  campos?: Record<string, string>;
  valores?: Record<string, string>;
} | null;

export async function actualizarNegocio(
  _prev: EstadoConfig,
  formData: FormData,
): Promise<EstadoConfig> {
  const valores: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === 'string') valores[k] = v;
  }

  const parsed = negocioSchema.safeParse({
    ...valores,
    activo: formData.get('activo') === 'on',
  });
  const campos = parsed.success ? {} : camposDeZod(parsed.error);

  const archivo = formData.get('portada');
  const portada = archivo instanceof File && archivo.size > 0 ? archivo : null;
  if (portada) {
    if (!TIPOS_IMAGEN[portada.type])
      campos.portada = 'Usá una imagen JPG, PNG o WebP';
    else if (portada.size > MAX_IMAGEN)
      campos.portada = 'La imagen pesa más de 2 MB';
  }

  if (!parsed.success || Object.keys(campos).length) {
    return { ok: false, error: 'VALIDACION', campos, valores };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'NO_AUTORIZADO', valores };

  const { whatsapp, ...resto } = parsed.data;
  const { data, error } = await supabase
    .from('negocios')
    .update({ ...resto, whatsapp: whatsapp || null })
    .eq('owner_id', user.id)
    .select('id');

  if (error || !data?.length)
    return { ok: false, error: 'DESCONOCIDO', valores };

  if (portada) {
    const ruta = `${data[0].id}/portada.${TIPOS_IMAGEN[portada.type]}`;
    const { error: errorSubida } = await supabase.storage
      .from('tours')
      .upload(ruta, portada, { upsert: true, contentType: portada.type });
    if (errorSubida) {
      return {
        ok: false,
        error: 'VALIDACION',
        campos: { portada: 'No pudimos subir la imagen. Intentá de nuevo.' },
        valores,
      };
    }
    const { data: publica } = supabase.storage.from('tours').getPublicUrl(ruta);
    await supabase
      .from('negocios')
      .update({ portada_url: `${publica.publicUrl}?v=${Date.now()}` })
      .eq('id', data[0].id);
  }

  revalidatePath('/panel', 'layout');
  return { ok: true };
}
