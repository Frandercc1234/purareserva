import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/panel/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { cerrarSesion } from '../(auth)/actions';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: negocio } = await supabase
    .from('negocios')
    .select('nombre')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!negocio) redirect('/registro');

  return (
    <div className="min-h-screen md:flex">
      <Sidebar nombre={negocio.nombre} cerrarSesion={cerrarSesion} />
      <div className="min-w-0 flex-1 px-4 py-6 md:p-8">{children}</div>
    </div>
  );
}
