import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/panel/Sidebar';
import { negocioDelDueno } from '@/lib/panel';
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

  const negocio = await negocioDelDueno(supabase, user);
  if (!negocio) redirect('/registro');

  return (
    <div className="min-h-screen md:flex">
      <Sidebar nombre={negocio.nombre} cerrarSesion={cerrarSesion} />
      <div className="entrar min-w-0 flex-1 px-4 py-6 md:p-10">{children}</div>
    </div>
  );
}
