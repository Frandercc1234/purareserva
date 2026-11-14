import { describe, expect, it } from 'vitest';
import {
  diaCR,
  formatearDia,
  formatearDuracion,
  formatearFechaHora,
  formatearHora,
} from '@/lib/fechas';

describe('fechas', () => {
  it('muestra la hora de Costa Rica, no la UTC', () => {
    // 14:00 UTC = 8:00 en Costa Rica
    expect(formatearHora('2026-03-02T14:00:00Z', 'en')).toMatch(/^8:00\s?AM$/);
    expect(formatearFechaHora('2026-03-02T14:00:00Z', 'en')).toContain('8:00');
  });

  it('diaCR no corre el día en horas nocturnas', () => {
    // 03:00 UTC del 3 de marzo = 21:00 del 2 de marzo en Costa Rica
    expect(diaCR('2026-03-03T03:00:00Z')).toBe('2026-03-02');
    expect(diaCR('2026-03-03T14:00:00Z')).toBe('2026-03-03');
  });

  it('formatea el día en cada idioma', () => {
    const es = formatearDia('2026-03-02T14:00:00Z', 'es');
    expect(es).toContain('lunes');
    expect(es).toContain('marzo');
    expect(formatearDia('2026-03-02T14:00:00Z', 'en')).toContain('Monday');
  });

  it('formatea la duración', () => {
    expect(formatearDuracion(150)).toBe('2 h 30 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(45)).toBe('45 min');
  });
});
