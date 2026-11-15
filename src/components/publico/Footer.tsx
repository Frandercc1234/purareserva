import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Link as LinkI18n } from '@/i18n/routing';
import { AUTOR, LINKEDIN_URL, REPO_URL } from '@/lib/sitio';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Marca } from './Marca';

const enlace =
  'inline-flex h-11 items-center text-sm text-primario underline-offset-4 hover:underline';

/** Pie público: marca e idioma, enlaces para turistas y para operadores, y autoría. */
export function Footer() {
  const t = useTranslations('Comun');
  const f = useTranslations('Footer');
  return (
    <footer className="mt-20 border-t border-borde bg-superficie">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 font-semibold">
            <Marca className="size-6" />
            {t('nombreApp')}
          </span>
          <p className="text-sm text-texto-suave">{t('lema')}</p>
          <div className="-ml-2">
            <LocaleSwitcher />
          </div>
        </div>
        <nav aria-label={f('turistas')} className="flex flex-col">
          <span className="mb-1 text-sm font-semibold">{f('turistas')}</span>
          <LinkI18n href="/#operadores" className={enlace}>
            {t('verTours')}
          </LinkI18n>
          <LinkI18n href="/#como-funciona" className={enlace}>
            {f('comoFunciona')}
          </LinkI18n>
          <LinkI18n href="/#como-funciona" className={enlace}>
            {f('politicaCancelacion')}
          </LinkI18n>
        </nav>
        <nav aria-label={f('operadores')} className="flex flex-col">
          <span className="mb-1 text-sm font-semibold">{f('operadores')}</span>
          <Link href="/registro" className={enlace}>
            {t('registrarNegocio')}
          </Link>
          <Link href="/login" className={enlace}>
            {t('iniciarSesion')}
          </Link>
        </nav>
      </div>
      <div className="border-t border-borde">
        <p className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 px-4 py-3 text-sm text-texto-suave">
          <span>{f('proyecto')}</span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={f('verLinkedin', { autor: AUTOR })}
            className="inline-flex h-11 items-center text-primario underline underline-offset-4"
          >
            {AUTOR}
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center text-primario underline underline-offset-4"
          >
            {f('repositorio')}
          </a>
        </p>
      </div>
    </footer>
  );
}
