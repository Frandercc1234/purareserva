export type Idioma = 'es' | 'en';

/** Datos ya formateados de una reserva, listos para mostrarse en un correo. */
export type DatosCorreo = {
  idioma: Idioma;
  nombre: string;
  email: string;
  telefono: string;
  personas: number;
  tour: string;
  fecha: string;
  puntoEncuentro: string;
  negocio: string;
  negocioEmail: string;
  negocioWhatsapp: string | null;
  total: string;
  deposito: string;
  saldo: string;
  /** Enlace secreto a la página de la reserva. */
  enlace: string;
};

export type Correo = { asunto: string; html: string };

export function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fila(etiqueta: string, valor: string) {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;vertical-align:top">${escapar(etiqueta)}</td><td style="padding:6px 0;color:#1F2937">${escapar(valor)}</td></tr>`;
}

function envolver(titulo: string, intro: string, filas: string, extra = '') {
  return `<!doctype html><html><body style="margin:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;color:#1F2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px">
<tr><td style="padding:24px">
<p style="margin:0 0 4px;color:#0E7C86;font-weight:600">PuraReserva</p>
<h1 style="margin:0 0 12px;font-size:22px">${escapar(titulo)}</h1>
<p style="margin:0 0 16px;line-height:1.5">${intro}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${filas}</table>
${extra}
</td></tr></table></td></tr></table></body></html>`;
}

function boton(texto: string, enlace: string) {
  return `<p style="margin:24px 0 0"><a href="${escapar(enlace)}" style="display:inline-block;background:#0E7C86;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escapar(texto)}</a></p>
<p style="margin:12px 0 0;font-size:12px;color:#6B7280;word-break:break-all">${escapar(enlace)}</p>`;
}

const T = {
  es: {
    reservaConfirmada: 'Reserva confirmada',
    hola: (n: string) =>
      `Hola ${escapar(n)}, recibimos tu pago y tu reserva está confirmada.`,
    tour: 'Tour',
    fecha: 'Fecha y hora',
    personas: 'Personas',
    total: 'Total',
    deposito: 'Depósito pagado',
    saldo: 'Saldo a pagar en el lugar',
    punto: 'Punto de encuentro',
    operador: 'Operador',
    verReserva: 'Ver o cancelar mi reserva',
    cancelada: 'Reserva cancelada',
    canceladaConReembolso: (n: string) =>
      `Hola ${escapar(n)}, tu reserva fue cancelada. Te reembolsamos el depósito: lo vas a ver en tu tarjeta en unos días.`,
    canceladaSinReembolso: (n: string) =>
      `Hola ${escapar(n)}, tu reserva fue cancelada. Como la cancelación fue fuera del plazo, el depósito no se reembolsa.`,
    sinCupo: 'No pudimos confirmar tu reserva',
    sinCupoTexto: (n: string) =>
      `Hola ${escapar(n)}, tu pago llegó cuando el cupo de esta salida ya se había ocupado. Te reembolsamos el depósito completo: lo vas a ver en tu tarjeta en unos días. Podés elegir otra salida.`,
    asuntoConfirmada: (t: string) => `Reserva confirmada – ${t}`,
    asuntoCancelada: (t: string) => `Reserva cancelada – ${t}`,
    asuntoSinCupo: (t: string) => `No pudimos confirmar tu reserva – ${t}`,
  },
  en: {
    reservaConfirmada: 'Booking confirmed',
    hola: (n: string) =>
      `Hi ${escapar(n)}, we received your payment and your booking is confirmed.`,
    tour: 'Tour',
    fecha: 'Date and time',
    personas: 'Guests',
    total: 'Total',
    deposito: 'Deposit paid',
    saldo: 'Balance to pay at the meeting point',
    punto: 'Meeting point',
    operador: 'Operator',
    verReserva: 'View or cancel my booking',
    cancelada: 'Booking cancelled',
    canceladaConReembolso: (n: string) =>
      `Hi ${escapar(n)}, your booking was cancelled. We refunded your deposit: it should appear on your card in a few days.`,
    canceladaSinReembolso: (n: string) =>
      `Hi ${escapar(n)}, your booking was cancelled. Because it was cancelled after the refund deadline, the deposit is not refunded.`,
    sinCupo: "We couldn't confirm your booking",
    sinCupoTexto: (n: string) =>
      `Hi ${escapar(n)}, your payment arrived after the spots on this departure were already taken. We refunded your full deposit: it should appear on your card in a few days. You can pick another departure.`,
    asuntoConfirmada: (t: string) => `Booking confirmed – ${t}`,
    asuntoCancelada: (t: string) => `Booking cancelled – ${t}`,
    asuntoSinCupo: (t: string) => `We couldn't confirm your booking – ${t}`,
  },
} as const;

function filasReserva(d: DatosCorreo) {
  const t = T[d.idioma];
  return [
    fila(t.tour, d.tour),
    fila(t.fecha, d.fecha),
    fila(t.personas, String(d.personas)),
    fila(t.total, d.total),
    fila(t.deposito, d.deposito),
    fila(t.saldo, d.saldo),
    d.puntoEncuentro ? fila(t.punto, d.puntoEncuentro) : '',
    fila(t.operador, d.negocio),
  ].join('');
}

/** Correo al turista cuando se confirma el pago (en su idioma). */
export function confirmacionTurista(d: DatosCorreo): Correo {
  const t = T[d.idioma];
  return {
    asunto: t.asuntoConfirmada(d.tour),
    html: envolver(
      t.reservaConfirmada,
      t.hola(d.nombre),
      filasReserva(d),
      boton(t.verReserva, d.enlace),
    ),
  };
}

/** Correo al negocio (siempre en español, como el panel). */
export function confirmacionNegocio(d: DatosCorreo): Correo {
  const filas =
    fila('Cliente', d.nombre) +
    fila('Correo', d.email) +
    fila('Teléfono', d.telefono) +
    fila('Tour', d.tour) +
    fila('Fecha y hora', d.fecha) +
    fila('Personas', String(d.personas)) +
    fila('Depósito cobrado', d.deposito) +
    fila('Saldo en el lugar', d.saldo) +
    fila('Idioma del cliente', d.idioma === 'en' ? 'Inglés' : 'Español');
  return {
    asunto: `Nueva reserva – ${d.tour} – ${d.fecha}`,
    html: envolver(
      'Nueva reserva confirmada',
      'Un turista pagó el depósito de su reserva.',
      filas,
    ),
  };
}

/** Correo al turista cuando se cancela su reserva. */
export function cancelacionTurista(d: DatosCorreo, reembolso: boolean): Correo {
  const t = T[d.idioma];
  const intro = reembolso
    ? t.canceladaConReembolso(d.nombre)
    : t.canceladaSinReembolso(d.nombre);
  return {
    asunto: t.asuntoCancelada(d.tour),
    html: envolver(t.cancelada, intro, filasReserva(d)),
  };
}

/** Correo al negocio cuando un turista cancela. */
export function cancelacionNegocio(d: DatosCorreo, reembolso: boolean): Correo {
  const filas =
    fila('Cliente', d.nombre) +
    fila('Teléfono', d.telefono) +
    fila('Tour', d.tour) +
    fila('Fecha y hora', d.fecha) +
    fila('Personas', String(d.personas)) +
    fila('Depósito', d.deposito) +
    fila(
      'Reembolso',
      reembolso
        ? 'Sí, se reembolsó el depósito'
        : 'No, cancelación fuera de plazo',
    );
  return {
    asunto: `Reserva cancelada – ${d.tour} – ${d.fecha}`,
    html: envolver(
      'Reserva cancelada',
      'Un turista canceló su reserva.',
      filas,
    ),
  };
}

/** Correo al turista cuando pagó tarde y no quedaba cupo (se reembolsó). */
export function sinCupoTurista(d: DatosCorreo): Correo {
  const t = T[d.idioma];
  return {
    asunto: t.asuntoSinCupo(d.tour),
    html: envolver(t.sinCupo, t.sinCupoTexto(d.nombre), filasReserva(d)),
  };
}
