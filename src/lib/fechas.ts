export const ZONA = 'America/Costa_Rica';

/** "lunes, 18 de noviembre de 2026, 8:00" en hora de Costa Rica. */
export function formatearFechaHora(fecha: Date | string, locale = 'es') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: ZONA,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(fecha));
}

/** "lun 18 nov, 8:00" para listas compactas. */
export function formatearCorto(fecha: Date | string, locale = 'es') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: ZONA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(fecha));
}
