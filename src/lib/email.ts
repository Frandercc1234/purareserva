import 'server-only';
import { Resend } from 'resend';
import { formatearUSD } from '@/lib/dinero';
import {
  cancelacionNegocio,
  cancelacionTurista,
  confirmacionNegocio,
  confirmacionTurista,
  sinCupoTurista,
  type Correo,
  type DatosCorreo,
} from '@/lib/email-plantillas';
import { formatearFechaHora } from '@/lib/fechas';
import { createAdminClient } from '@/lib/supabase/admin';

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Envía un correo. Nunca lanza: si Resend falla se registra el error y se sigue,
 * para que un problema de correo no rompa el pago ni el webhook.
 */
export async function enviarCorreo(
  para: string,
  correo: Correo,
): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave || !clave.startsWith('re_') || clave.length < 10) {
    console.error('Correo no enviado: RESEND_API_KEY no está configurada');
    return false;
  }
  try {
    const { data, error } = await new Resend(clave).emails.send({
      from: process.env.EMAIL_FROM ?? 'PuraReserva <onboarding@resend.dev>',
      to: para,
      subject: correo.asunto,
      html: correo.html,
    });
    if (error) {
      console.error('Correo no enviado (Resend):', error.name, error.message);
      return false;
    }
    console.log('Correo enviado:', data?.id);
    return true;
  } catch (e) {
    console.error('Correo no enviado (excepción):', e);
    return false;
  }
}

/** Carga la reserva y arma los datos formateados para las plantillas. */
async function datosDeReserva(admin: Admin, reservaId: string, token: string) {
  const { data: r } = await admin
    .from('reservas')
    .select(
      'nombre, email, telefono, personas, idioma, total_cents, deposito_cents, salidas(inicia_en, tours(nombre_es, nombre_en, punto_encuentro, negocios(nombre, email_contacto, whatsapp)))',
    )
    .eq('id', reservaId)
    .maybeSingle();
  const tour = r?.salidas?.tours;
  const negocio = tour?.negocios;
  if (!r || !r.salidas || !tour || !negocio) return null;

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const datos: DatosCorreo = {
    idioma: r.idioma,
    nombre: r.nombre,
    email: r.email,
    telefono: r.telefono,
    personas: r.personas,
    tour: r.idioma === 'en' ? tour.nombre_en : tour.nombre_es,
    fecha: formatearFechaHora(r.salidas.inicia_en, r.idioma),
    puntoEncuentro: tour.punto_encuentro,
    negocio: negocio.nombre,
    negocioEmail: negocio.email_contacto,
    negocioWhatsapp: negocio.whatsapp,
    total: formatearUSD(r.total_cents, r.idioma),
    deposito: formatearUSD(r.deposito_cents, r.idioma),
    saldo: formatearUSD(r.total_cents - r.deposito_cents, r.idioma),
    enlace: `${sitio}/${r.idioma}/reserva/${token}`,
  };
  return datos;
}

/** Pago confirmado: correo al turista (su idioma) y al negocio. */
export async function notificarConfirmacion(
  admin: Admin,
  reservaId: string,
  token: string,
) {
  const d = await datosDeReserva(admin, reservaId, token);
  if (!d) return;
  await Promise.all([
    enviarCorreo(d.email, confirmacionTurista(d)),
    enviarCorreo(d.negocioEmail, confirmacionNegocio(d)),
  ]);
}

/** Reserva cancelada por el turista: correo a ambos. */
export async function notificarCancelacion(
  admin: Admin,
  reservaId: string,
  token: string,
  reembolso: boolean,
) {
  const d = await datosDeReserva(admin, reservaId, token);
  if (!d) return;
  await Promise.all([
    enviarCorreo(d.email, cancelacionTurista(d, reembolso)),
    enviarCorreo(d.negocioEmail, cancelacionNegocio(d, reembolso)),
  ]);
}

/** Pagó tarde sin cupo: se reembolsó y se le avisa al turista. */
export async function notificarSinCupo(
  admin: Admin,
  reservaId: string,
  token: string,
) {
  const d = await datosDeReserva(admin, reservaId, token);
  if (!d) return;
  await enviarCorreo(d.email, sinCupoTurista(d));
}
