import { describe, expect, it } from 'vitest';
import { aCentavos, centavosATexto, formatearUSD } from '@/lib/dinero';

describe('dinero', () => {
  it('formatea centavos como USD', () => {
    expect(formatearUSD(4500, 'en')).toBe('$45.00');
    expect(formatearUSD(5, 'en')).toBe('$0.05');
  });

  it('convierte texto a centavos', () => {
    expect(aCentavos('45')).toBe(4500);
    expect(aCentavos('45.5')).toBe(4550);
    expect(aCentavos('45,50')).toBe(4550);
    expect(aCentavos(' 0.99 ')).toBe(99);
  });

  it('evita errores de punto flotante', () => {
    expect(aCentavos('19.99')).toBe(1999);
    expect(aCentavos('1.15')).toBe(115);
  });

  it('rechaza valores inválidos', () => {
    expect(aCentavos('')).toBeNull();
    expect(aCentavos('abc')).toBeNull();
    expect(aCentavos('-5')).toBeNull();
    expect(aCentavos('1.234')).toBeNull();
  });

  it('centavos a texto editable', () => {
    expect(centavosATexto(4500)).toBe('45.00');
    expect(centavosATexto(1999)).toBe('19.99');
  });
});
