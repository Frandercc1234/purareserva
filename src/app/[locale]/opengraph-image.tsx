import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'PuraReserva';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagen por defecto al compartir un enlace: marca, titular y fondo carbón. */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28,
        padding: 90,
        background: '#1B1410',
        color: '#F2EADB',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width="96" height="96" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="#F2EADB" />
          <circle cx="22" cy="10" r="3" fill="#C98E52" />
          <path
            d="M5 19c2.5-3 5-3 7.5 0s5 3 7.5 0 4-2.5 6.5-1"
            stroke="#1B1410"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M5 24c2.5-3 5-3 7.5 0s5 3 7.5 0 4-2.5 6.5-1"
            stroke="#1B1410"
            strokeOpacity=".55"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 48, fontWeight: 700 }}>PuraReserva</div>
      </div>
      <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>
        {t('ogTitulo')}
      </div>
      <div style={{ fontSize: 38, color: '#C98E52' }}>{t('ogSubtitulo')}</div>
    </div>,
    size,
  );
}
