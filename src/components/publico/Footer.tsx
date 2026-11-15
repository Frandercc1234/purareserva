import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Marca } from './Marca';

/** Pie público: lema y acceso de operadores (también en móvil, donde la cabecera lo oculta). */
export function Footer() {
  const t = useTranslations('Comun');
  return (
    <footer className="mt-20 border-t border-borde bg-superficie">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 font-semibold">
            <Marca className="size-6" />
            {t('nombreApp')}
          </span>
          <p className="text-sm text-texto-suave">{t('lema')}</p>
        </div>
        <nav aria-label={t('operadoresPie')} className="flex flex-col gap-1">
          <span className="text-sm font-semibold">{t('operadoresPie')}</span>
          <Link
            href="/registro"
            className="inline-flex h-11 items-center text-sm text-primario underline-offset-4 hover:underline"
          >
            {t('registrarNegocio')}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center text-sm text-primario underline-offset-4 hover:underline"
          >
            {t('iniciarSesion')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
