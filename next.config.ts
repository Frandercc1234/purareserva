import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Las imágenes de tours pueden pesar hasta 2 MB.
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
};

export default withNextIntl(nextConfig);
