import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Link as LinkI18n } from '@/i18n/routing';
import { botonClases } from '@/components/ui/Button';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Marca } from './Marca';

/** Cabecera pública: marca, acceso de operadores y selector de idioma. */
export function Header() {
  const t = useTranslations('Comun');
  return (
    <header className="sticky top-0 z-30 border-b border-borde bg-fondo/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <LinkI18n
          href="/"
          aria-label={t('inicio')}
          className="flex items-center gap-2 rounded-control font-semibold tracking-tight"
        >
          <Marca className="size-8" />
          <span className="hidden text-lg min-[400px]:inline">
            {t('nombreApp')}
          </span>
        </LinkI18n>
        <nav aria-label={t('principal')} className="flex items-center gap-1">
          <Link
            href="/login"
            className="hidden h-11 items-center rounded-control px-3 text-sm font-semibold text-texto transition-colors duration-150 hover:bg-borde/50 sm:inline-flex"
          >
            {t('iniciarSesion')}
          </Link>
          <Link
            href="/registro"
            className={botonClases(
              'secundario',
              'px-3 text-sm whitespace-nowrap',
            )}
          >
            {t('soyOperador')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
