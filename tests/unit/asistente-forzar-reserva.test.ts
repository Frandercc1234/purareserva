import { describe, expect, it } from 'vitest';
import { debeForzarReserva } from '@/lib/asistente/forzar-reserva';

const salida = (id: string) => ({ id, fecha_hora_texto: 'sáb', cupos: 8 });
const tour = (salidas: ReturnType<typeof salida>[]) => ({
  tour: 'Sunset catamaran',
  salidas,
});

const busqueda = (
  tours: ReturnType<typeof tour>[],
  input: Record<string, unknown> = { personas: 2 },
) => ({
  toolCalls: [{ toolName: 'buscar_tours', input }],
  toolResults: [{ toolName: 'buscar_tours', output: { tours } }],
});

const TEXTO = 'Book 2 places for Saturday';

describe('debeForzarReserva', () => {
  it('fuerza preparar_reserva con intención, personas y una sola salida', () => {
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [busqueda([tour([salida('s1')])])],
      }),
    ).toBe(true);
    expect(
      debeForzarReserva({
        textoUsuario: 'Quiero reservar para el sábado',
        pasos: [busqueda([tour([salida('s1')])])],
      }),
    ).toBe(true);
  });

  it('deja decidir al modelo con varias salidas o varios tours', () => {
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [busqueda([tour([salida('s1'), salida('s2')])])],
      }),
    ).toBe(false);
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [busqueda([tour([salida('s1')]), tour([salida('s2')])])],
      }),
    ).toBe(false);
    expect(
      debeForzarReserva({ textoUsuario: TEXTO, pasos: [busqueda([])] }),
    ).toBe(false);
  });

  it('no fuerza si faltan las personas', () => {
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [busqueda([tour([salida('s1')])], {})],
      }),
    ).toBe(false);
  });

  it('no fuerza sin intención de reservar', () => {
    expect(
      debeForzarReserva({
        textoUsuario: 'What tours are there on Saturday?',
        pasos: [busqueda([tour([salida('s1')])])],
      }),
    ).toBe(false);
  });

  it('no fuerza si no hubo búsqueda o ya se llamó preparar_reserva', () => {
    expect(debeForzarReserva({ textoUsuario: TEXTO, pasos: [] })).toBe(false);
    const ya = {
      toolCalls: [{ toolName: 'preparar_reserva', input: {} }],
      toolResults: [{ toolName: 'preparar_reserva', output: { ok: true } }],
    };
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [busqueda([tour([salida('s1')])]), ya],
      }),
    ).toBe(false);
  });

  it('no fuerza si la herramienta falló', () => {
    expect(
      debeForzarReserva({
        textoUsuario: TEXTO,
        pasos: [
          {
            toolCalls: [{ toolName: 'buscar_tours', input: { personas: 2 } }],
            toolResults: [
              { toolName: 'buscar_tours', output: { error: 'NO_DISPONIBLE' } },
            ],
          },
        ],
      }),
    ).toBe(false);
  });
});
