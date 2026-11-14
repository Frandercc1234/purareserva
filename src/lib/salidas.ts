/** Costa Rica está en UTC-6 todo el año (sin horario de verano). */
const OFFSET_CR_HORAS = 6;

export type ErrorSalidas =
  'RANGO_INVALIDO' | 'RANGO_MUY_LARGO' | 'MUCHAS_SALIDAS';

export class SalidasError extends Error {
  constructor(public codigo: ErrorSalidas) {
    super(codigo);
  }
}

function partes(fecha: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) throw new SalidasError('RANGO_INVALIDO');
  return { y: +m[1], mo: +m[2], d: +m[3] };
}

/** "2026-03-02" + "08:00" en hora de Costa Rica -> instante UTC. */
export function aFechaCR(fecha: string, hora: string): Date {
  const { y, mo, d } = partes(fecha);
  const h = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (!h) throw new SalidasError('RANGO_INVALIDO');
  return new Date(Date.UTC(y, mo - 1, d, +h[1] + OFFSET_CR_HORAS, +h[2]));
}

export type OpcionesLote = {
  desde: string;
  hasta: string;
  /** Días de la semana, 0 = domingo ... 6 = sábado. */
  dias: number[];
  hora: string;
  zona?: 'America/Costa_Rica';
  maxDias?: number;
  maxSalidas?: number;
};

/** Fechas (UTC) de todas las salidas del lote, ordenadas y sin repetir. */
export function generarFechas({
  desde,
  hasta,
  dias,
  hora,
  maxDias = 90,
  maxSalidas = 200,
}: OpcionesLote): Date[] {
  const a = partes(desde);
  const b = partes(hasta);
  const inicio = Date.UTC(a.y, a.mo - 1, a.d);
  const fin = Date.UTC(b.y, b.mo - 1, b.d);
  if (fin < inicio) throw new SalidasError('RANGO_INVALIDO');

  const DIA = 86_400_000;
  // Rango inclusivo: desde = hasta son 1 día.
  if ((fin - inicio) / DIA + 1 > maxDias)
    throw new SalidasError('RANGO_MUY_LARGO');

  const permitidos = new Set(dias);
  const fechas: Date[] = [];
  for (let t = inicio; t <= fin; t += DIA) {
    const dia = new Date(t);
    if (!permitidos.has(dia.getUTCDay())) continue;
    const texto = dia.toISOString().slice(0, 10);
    fechas.push(aFechaCR(texto, hora));
    if (fechas.length > maxSalidas) throw new SalidasError('MUCHAS_SALIDAS');
  }
  return fechas;
}
