import { describe, expect, it } from 'vitest';
import { evaluarCancelacion } from '@/lib/cancelacion';

const sale = new Date('2026-03-10T14:00:00Z');
const horas = (n: number) => n * 3_600_000;

describe('evaluarCancelacion', () => {
  it('reembolsa si se cancela antes del límite', () => {
    const ahora = new Date(sale.getTime() - horas(25));
    expect(evaluarCancelacion(sale, 24, ahora)).toEqual({ reembolso: true });
  });

  it('reembolsa justo en el límite', () => {
    const ahora = new Date(sale.getTime() - horas(24));
    expect(evaluarCancelacion(sale, 24, ahora)).toEqual({ reembolso: true });
  });

  it('no reembolsa un milisegundo después del límite', () => {
    const ahora = new Date(sale.getTime() - horas(24) + 1);
    expect(evaluarCancelacion(sale, 24, ahora)).toEqual({ reembolso: false });
  });

  it('no reembolsa si faltan menos horas que el límite', () => {
    const ahora = new Date(sale.getTime() - horas(3));
    expect(evaluarCancelacion(sale, 24, ahora)).toEqual({ reembolso: false });
  });

  it('con límite 0 reembolsa hasta el momento de la salida', () => {
    expect(
      evaluarCancelacion(sale, 0, new Date(sale.getTime() - 1)).reembolso,
    ).toBe(true);
    expect(evaluarCancelacion(sale, 0, sale).reembolso).toBe(true);
    expect(
      evaluarCancelacion(sale, 0, new Date(sale.getTime() + 1)).reembolso,
    ).toBe(false);
  });

  it('con el máximo de 168 horas (7 días)', () => {
    const justo = new Date(sale.getTime() - horas(168));
    expect(evaluarCancelacion(sale, 168, justo).reembolso).toBe(true);
    expect(
      evaluarCancelacion(sale, 168, new Date(justo.getTime() + 1)).reembolso,
    ).toBe(false);
  });
});
