import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MensajeAsistente } from '@/components/asistente/MensajeAsistente';
import {
  quitarCodigoYJson,
  reservaEscrita,
} from '@/lib/asistente/reserva-escrita';

const ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';
const BLOQUE = `**Reserve now:**\n\`\`\`json\n{"personas": 2, "salida_id": "${ID}"}\n\`\`\``;

const html = (texto: string) =>
  renderToStaticMarkup(createElement(MensajeAsistente, { texto }));

describe('reserva escrita como texto por el modelo', () => {
  it('quita del texto los bloques de código y el JSON con salida_id', () => {
    const salida = html(`Great news! ${BLOQUE}\nSee you there.`);
    expect(salida).not.toContain('```');
    expect(salida).not.toContain('salida_id');
    expect(salida).not.toContain(ID);
    expect(salida).toContain('Great news!');
    expect(salida).toContain('See you there.');

    expect(html(`Listo {"salida_id":"${ID}","personas":2} gracias`)).not.toContain(
      'salida_id',
    );
    // Bloque a medio escribir (streaming).
    expect(quitarCodigoYJson('Hola\n```json\n{"personas": 2, "sal').trim()).toBe(
      'Hola',
    );
    expect(quitarCodigoYJson('Hola {"personas": 2, "sali')).not.toContain(
      'personas',
    );
  });

  it('recupera la reserva solo si el JSON es válido', () => {
    expect(reservaEscrita(BLOQUE)).toEqual({ salida_id: ID, personas: 2 });
    expect(
      reservaEscrita(`{"salida_id": "${ID}", "personas": 20}`)?.personas,
    ).toBe(20);
    expect(reservaEscrita(`{"salida_id": "${ID}", "personas": 21}`)).toBeNull();
    expect(reservaEscrita(`{"salida_id": "${ID}", "personas": 0}`)).toBeNull();
    expect(reservaEscrita(`{"salida_id": "${ID}", "personas": "2"}`)).toBeNull();
    expect(reservaEscrita('{"salida_id": "abc", "personas": 2}')).toBeNull();
    expect(reservaEscrita('{"salida_id": "<uuid>", "personas": 2}')).toBeNull();
    expect(reservaEscrita('Sin ningún JSON')).toBeNull();
    expect(reservaEscrita(`{"salida_id": "${ID}", "personas": }`)).toBeNull();
  });
});
