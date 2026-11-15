import { redirect } from 'next/navigation';
import { ConfiguracionForm } from '@/components/panel/ConfiguracionForm';
import { createClient } from '@/lib/supabase/server';

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: negocio } = await supabase
    .from('negocios')
    .select(
      'nombre, descripcion_es, descripcion_en, email_contacto, whatsapp, deposito_pct, horas_cancelacion, activo, slug, portada_url',
    )
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!negocio) redirect('/registro');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
      <ConfiguracionForm negocio={negocio} />
    </div>
  );
}
