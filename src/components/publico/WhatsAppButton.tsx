import { useTranslations } from 'next-intl';
import { botonClases } from '@/components/ui/Button';

export function WhatsAppButton({
  numero,
  mensaje,
}: {
  numero: string | null;
  mensaje?: string;
}) {
  const t = useTranslations('Comun');
  if (!numero) return null;
  const digitos = numero.replace(/\D/g, '');
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return (
    <a
      href={`https://wa.me/${digitos}${texto}`}
      target="_blank"
      rel="noopener noreferrer"
      className={botonClases('secundario')}
    >
      {t('whatsapp')}
    </a>
  );
}
