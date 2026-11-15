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

/** Día calendario en Costa Rica ("2026-03-02"), útil para agrupar salidas. */
export function diaCR(fecha: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(fecha));
}

/** "lunes 18 de noviembre" / "Monday, November 18". */
export function formatearDia(fecha: Date | string, locale = 'es') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(fecha));
}

/** "8:00" / "8:00 AM" según el idioma. */
export function formatearHora(fecha: Date | string, locale = 'es') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: ZONA,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(fecha));
}

/** 150 -> "2 h 30 min", 60 -> "1 h", 45 -> "45 min". */
export function formatearDuracion(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Año y mes (1-12) del instante dado, vistos en Costa Rica. */
function anioMesCR(fecha: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(fecha);
  const n = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { y: n('year'), m: n('month') };
}

/** Rango [desde, hasta) del mes actual en hora de Costa Rica (UTC-6), como instantes UTC. */
export function rangoMesCR(ahora = new Date()) {
  const { y, m } = anioMesCR(ahora);
  return {
    desde: new Date(Date.UTC(y, m - 1, 1, 6)),
    hasta: new Date(Date.UTC(y, m, 1, 6)),
  };
}
