import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { SITIO_URL } from '@/lib/sitio';
import { createPublicClient } from '@/lib/supabase/public';

// Refleja los negocios y tours activos de cada momento.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const [{ data: negocios }, { data: tours }] = await Promise.all([
    supabase.from('negocios').select('slug'),
    supabase.from('tours').select('slug, negocios(slug)'),
  ]);

  const rutas = [
    '',
    ...(negocios ?? []).map((n) => `/${n.slug}`),
    ...(tours ?? []).flatMap((t) =>
      t.negocios ? [`/${t.negocios.slug}/${t.slug}`] : [],
    ),
  ];

  return rutas.flatMap((ruta) =>
    routing.locales.map((locale) => ({
      url: `${SITIO_URL}/${locale}${ruta}`,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITIO_URL}/${l}${ruta}`]),
        ),
      },
    })),
  );
}
