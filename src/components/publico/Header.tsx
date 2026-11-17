import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Link as LinkI18n } from '@/i18n/routing';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Marca } from './Marca';

/**
 * Cabecera pública. En móvil: logo y nombre a la izquierda; "Soy operador" e idioma
 * compacto a la derecha. "Iniciar sesión" pasa al pie hasta los 640px.
 */
export function Header() {
  const t = useTranslations('Comun');
  return (
    <header className="sobre-carbon sticky top-0 z-30 bg-carbon text-hueso">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <LinkI18n
          href="/"
          aria-label={t('inicio')}
          className="flex shrink-0 items-center gap-2 rounded-control font-semibold tracking-tight"
        >
          <Marca className="size-8" sobreCarbon />
          <span className="text-base max-[359px]:hidden sm:text-lg">
            {t('nombreApp')}
          </span>
        </LinkI18n>
        <nav
          aria-label={t('principal')}
          className="flex items-center gap-1 sm:gap-2"
        >
          <Link
            href="/login"
            className="hidden h-11 items-center rounded-control px-3 text-sm font-semibold text-hueso underline-offset-4 hover:underline sm:inline-flex"
          >
            {t('iniciarSesion')}
          </Link>
          <Link
            href="/registro"
            className="inline-flex h-11 items-center rounded-control px-2.5 text-sm font-semibold whitespace-nowrap text-hueso-suave underline-offset-4 hover:text-hueso hover:underline sm:px-3"
          >
            {t('soyOperador')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
