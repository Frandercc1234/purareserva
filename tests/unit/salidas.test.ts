import { describe, expect, it } from 'vitest';
import { aFechaCR, generarFechas, SalidasError } from '@/lib/salidas';

describe('aFechaCR', () => {
  it('convierte hora de Costa Rica (UTC-6) a UTC', () => {
    expect(aFechaCR('2026-03-02', '08:00').toISOString()).toBe(
      '2026-03-02T14:00:00.000Z',
    );
  });

  it('pasa al día siguiente en UTC cuando corresponde', () => {
    expect(aFechaCR('2026-03-02', '20:30').toISOString()).toBe(
      '2026-03-03T02:30:00.000Z',
    );
  });

  it('rechaza fechas y horas inválidas', () => {
    expect(() => aFechaCR('02/03/2026', '08:00')).toThrow(SalidasError);
    expect(() => aFechaCR('2026-03-02', '25:00')).toThrow(SalidasError);
  });
});

describe('generarFechas', () => {
  it('solo incluye los días de la semana elegidos', () => {
    // 2026-03-02 es lunes
    const f = generarFechas({
      desde: '2026-03-02',
      hasta: '2026-03-08',
      dias: [1, 3, 5],
      hora: '08:00',
    });
    expect(f.map((d) => d.toISOString())).toEqual([
      '2026-03-02T14:00:00.000Z',
      '2026-03-04T14:00:00.000Z',
      '2026-03-06T14:00:00.000Z',
    ]);
  });

  it('lunes a sábado por 30 días genera 25 o 26 salidas', () => {
    const f = generarFechas({
      desde: '2026-03-02',
      hasta: '2026-03-31',
      dias: [1, 2, 3, 4, 5, 6],
      hora: '08:00',
    });
    expect(f.length).toBeGreaterThanOrEqual(25);
    expect(f.length).toBeLessThanOrEqual(26);
  });

  it('un solo día cuenta como rango válido', () => {
    const f = generarFechas({
      desde: '2026-03-02',
      hasta: '2026-03-02',
      dias: [1],
      hora: '13:00',
    });
    expect(f).toHaveLength(1);
  });

  it('no repite fechas si los días vienen duplicados', () => {
    const f = generarFechas({
      desde: '2026-03-02',
      hasta: '2026-03-08',
      dias: [1, 1, 1],
      hora: '08:00',
    });
    expect(f).toHaveLength(1);
  });

  it('rechaza un rango invertido', () => {
    expect(() =>
      generarFechas({
        desde: '2026-03-10',
        hasta: '2026-03-02',
        dias: [1],
        hora: '08:00',
      }),
    ).toThrowError('RANGO_INVALIDO');
  });

  it('rechaza rangos de más de 90 días', () => {
    expect(() =>
      generarFechas({
        desde: '2026-01-01',
        hasta: '2026-04-15',
        dias: [1],
        hora: '08:00',
      }),
    ).toThrowError('RANGO_MUY_LARGO');
    // 90 días exactos sí se permite
    expect(
      generarFechas({
        desde: '2026-01-01',
        hasta: '2026-03-31',
        dias: [0, 1, 2, 3, 4, 5, 6],
        hora: '08:00',
      }),
    ).toHaveLength(90);
  });

  it('lanza error al pasar el máximo de salidas', () => {
    expect(() =>
      generarFechas({
        desde: '2026-03-01',
        hasta: '2026-03-31',
        dias: [0, 1, 2, 3, 4, 5, 6],
        hora: '08:00',
        maxSalidas: 20,
      }),
    ).toThrowError('MUCHAS_SALIDAS');
  });

  it('no se corre un día por la zona horaria en horas tardías', () => {
    const f = generarFechas({
      desde: '2026-03-02',
      hasta: '2026-03-02',
      dias: [1],
      hora: '23:30',
    });
    expect(f[0].toISOString()).toBe('2026-03-03T05:30:00.000Z');
  });
});
