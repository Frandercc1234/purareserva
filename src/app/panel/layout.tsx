import { redirect } from 'next/navigation';
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
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="font-semibold">{negocio.nombre}</span>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="h-11 px-3 text-sm text-teal-700 underline"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <div className="p-4">{children}</div>
    </div>
  );
}
