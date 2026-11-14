'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const actual = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Comun');

  return (
    <nav aria-label={t('idioma')} className="flex gap-1 text-sm">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === actual ? 'true' : undefined}
          className={`inline-flex h-11 items-center rounded-lg px-3 ${
            l === actual ? 'bg-teal-700 text-white' : 'text-teal-700 underline'
          }`}
        >
          {t(l)}
        </Link>
      ))}
    </nav>
  );
}
