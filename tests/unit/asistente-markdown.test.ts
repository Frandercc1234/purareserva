import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MensajeAsistente } from '@/components/asistente/MensajeAsistente';

const html = (texto: string) =>
  renderToStaticMarkup(createElement(MensajeAsistente, { texto }));

describe('Markdown del chat', () => {
  it('muestra negrita y listas', () => {
    expect(html('Hola **mundo**')).toContain('<strong>mundo</strong>');
    const lista = html('- uno\n- dos');
    expect(lista).toContain('<ul');
    expect(lista).toContain('<li>uno</li>');
    expect(html('1. primero\n2. segundo')).toContain('<ol');
  });

  it('convierte enlaces internos, también los sueltos', () => {
    expect(html('[Ver tour](/es/aventuras-rincon/canopy-rincon)')).toContain(
      'href="/es/aventuras-rincon/canopy-rincon"',
    );
    expect(
      html(
        'Completá aquí: /es/aventuras-rincon/canopy-rincon?salida=1&personas=2',
      ),
    ).toContain(
      'href="/es/aventuras-rincon/canopy-rincon?salida=1&amp;personas=2"',
    );
  });

  it('no crea enlaces a sitios externos ni a rutas con doble barra', () => {
    expect(html('[malo](https://evil.example)')).not.toContain('<a');
    expect(html('[malo](//evil.example)')).not.toContain('href="//evil');
  });

  it('escapa el HTML crudo', () => {
    const salida = html(
      '<script>alert(1)</script> <img src=x onerror=alert(1)>',
    );
    expect(salida).not.toContain('<script');
    expect(salida).not.toContain('<img');
    expect(salida).toContain('&lt;script&gt;');
  });
});
