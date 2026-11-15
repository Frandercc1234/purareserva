import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Link as LinkI18n } from '@/i18n/routing';
import { botonClases } from '@/components/ui/Button';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Marca } from './Marca';

/**
 * Cabecera pública. En móvil: logo y nombre a la izquierda; "Soy operador" e idioma
 * compacto a la derecha. "Iniciar sesión" pasa al pie hasta los 640px.
 */
export function Header() {
  const t = useTranslations('Comun');
  return (
    <header className="sticky top-0 z-30 border-b border-borde bg-fondo/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <LinkI18n
          href="/"
          aria-label={t('inicio')}
          className="flex shrink-0 items-center gap-2 rounded-control font-semibold tracking-tight"
        >
          <Marca className="size-8" />
          <span className="text-base sm:text-lg">{t('nombreApp')}</span>
        </LinkI18n>
        <nav
          aria-label={t('principal')}
          className="flex items-center gap-1 sm:gap-2"
        >
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
              'px-2.5! text-sm whitespace-nowrap sm:px-3!',
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
