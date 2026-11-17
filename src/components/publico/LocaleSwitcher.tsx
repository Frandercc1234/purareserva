'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, routing } from '@/i18n/routing';
import { cn } from '@/components/ui/cn';

/** Selector de idioma: "ES | EN" compacto en móvil y "Español / English" desde 640px. */
export function LocaleSwitcher() {
  const actual = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Comun');

  return (
    <nav aria-label={t('idioma')} className="flex items-center text-sm">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className="text-hueso-suave sm:hidden">
              |
            </span>
          )}
          <Link
            href={pathname}
            locale={l}
            hrefLang={l}
            aria-label={t(l)}
            aria-current={l === actual ? 'true' : undefined}
            className={cn(
              'inline-flex h-11 min-w-9 items-center justify-center rounded-control px-1.5 transition-colors duration-150 sm:ml-1 sm:px-3',
              l === actual
                ? 'font-semibold text-hueso underline decoration-2 underline-offset-8'
                : 'text-hueso-suave underline-offset-8 hover:text-hueso hover:underline',
            )}
          >
            <span aria-hidden="true" className="sm:hidden">
              {l.toUpperCase()}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {t(l)}
            </span>
          </Link>
        </span>
      ))}
    </nav>
  );
}
