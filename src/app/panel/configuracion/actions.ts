'use server';

import { revalidatePath } from 'next/cache';
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
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: camposDeZod(parsed.error),
      valores,
    };
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

  revalidatePath('/panel', 'layout');
  return { ok: true };
}
