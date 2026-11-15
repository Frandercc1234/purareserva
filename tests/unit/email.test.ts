import { describe, expect, it } from 'vitest';
import {
  cancelacionNegocio,
  cancelacionTurista,
  confirmacionNegocio,
  confirmacionTurista,
  escapar,
  sinCupoTurista,
  type DatosCorreo,
} from '@/lib/email-plantillas';

const base: DatosCorreo = {
  idioma: 'es',
  nombre: 'Ana Mora',
  email: 'ana@example.com',
  telefono: '+50688887777',
  personas: 2,
  tour: 'Canopy en el Rincón',
  fecha: 'domingo, 15 de noviembre de 2026, 8:00',
  puntoEncuentro: 'Entrada principal',
  negocio: 'Aventuras Rincón',
  negocioEmail: 'dueno1@test.com',
  negocioWhatsapp: '+50688887777',
  total: 'US$130',
  deposito: 'US$39',
  saldo: 'US$91',
  enlace: 'http://localhost:3000/es/reserva/abc123',
};

describe('plantillas de correo', () => {
  it('escapa HTML en los textos del usuario', () => {
    expect(escapar('<script>alert("x")</script> & \'y\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    );
    const c = confirmacionTurista({ ...base, nombre: '<img src=x onerror=1>' });
    expect(c.html).not.toContain('<img src=x');
    expect(c.html).toContain('&lt;img src=x onerror=1&gt;');
  });

  it('la confirmación al turista sale en su idioma', () => {
    const es = confirmacionTurista(base);
    expect(es.asunto).toBe('Reserva confirmada – Canopy en el Rincón');
    expect(es.html).toContain('Ver o cancelar mi reserva');

    const en = confirmacionTurista({
      ...base,
      idioma: 'en',
      tour: 'Rincon Canopy',
    });
    expect(en.asunto).toBe('Booking confirmed – Rincon Canopy');
    expect(en.html).toContain('View or cancel my booking');
    expect(en.html).not.toContain('Ver o cancelar');
  });

  it('incluye el enlace secreto, los montos y el punto de encuentro', () => {
    const { html } = confirmacionTurista(base);
    expect(html).toContain('href="http://localhost:3000/es/reserva/abc123"');
    expect(html).toContain('US$39');
    expect(html).toContain('US$91');
    expect(html).toContain('Entrada principal');
  });

  it('el correo al negocio va en español con los datos del cliente y sin enlace secreto', () => {
    const c = confirmacionNegocio({ ...base, idioma: 'en' });
    expect(c.asunto).toContain('Nueva reserva');
    expect(c.html).toContain('ana@example.com');
    expect(c.html).toContain('+50688887777');
    expect(c.html).toContain('Inglés');
    expect(c.html).not.toContain('/reserva/abc123');
  });

  it('la cancelación distingue reembolso y sin reembolso', () => {
    expect(cancelacionTurista(base, true).html).toContain(
      'Te reembolsamos el depósito',
    );
    expect(cancelacionTurista(base, false).html).toContain(
      'el depósito no se reembolsa',
    );
    expect(cancelacionTurista({ ...base, idioma: 'en' }, true).html).toContain(
      'We refunded',
    );
    expect(cancelacionNegocio(base, true).html).toContain('Sí, se reembolsó');
    expect(cancelacionNegocio(base, false).html).toContain('fuera de plazo');
  });

  it('avisa al turista cuando pagó tarde y no había cupo', () => {
    expect(sinCupoTurista(base).html).toContain(
      'reembolsamos el depósito completo',
    );
    expect(sinCupoTurista({ ...base, idioma: 'en' }).asunto).toContain(
      "couldn't confirm",
    );
  });
});
