import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { botonClases } from '@/components/ui/Button';
import { Marca } from './Marca';

/** Contenido de la página 404 pública (el idioma lo pone el proveedor de next-intl). */
export function NoEncontrada() {
  const t = useTranslations('NotFound');
  const c = useTranslations('Comun');
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <Marca className="size-14" />
      <p className="text-sm font-semibold tracking-wide text-aviso uppercase">
        {t('codigo')}
      </p>
      <h1 className="titulo-hero text-5xl md:text-6xl">{t('titulo')}</h1>
      <p className="text-texto-suave">{t('texto')}</p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/#operadores" className={botonClases('primario')}>
          {c('verTours')}
        </Link>
        <Link href="/" className={botonClases('secundario')}>
          {t('irInicio')}
        </Link>
      </div>
    </main>
  );
}
