import type { MetadataRoute } from 'next';
import { SITIO_URL } from '@/lib/sitio';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Las rutas de reserva viven bajo el prefijo de cada idioma.
      disallow: ['/panel', '/api', '/reserva', '/es/reserva', '/en/reserva'],
    },
    sitemap: `${SITIO_URL}/sitemap.xml`,
  };
}
