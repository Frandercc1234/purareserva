'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { prepararReserva, prepararReservaBaseSchema } from './herramientas';

const entradaSchema = prepararReservaBaseSchema.extend({
  locale: z.enum(['es', 'en']),
});

/**
 * Botón "Reservar" de la tarjeta del chat: prepara el enlace a la página del tour con la
 * salida y las personas ya elegidas. No crea la reserva ni cobra: eso pasa en el
 * formulario del tour y en Stripe.
 */
export async function reservarDesdeChat(entrada: unknown) {
  const parsed = entradaSchema.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, motivo: 'SALIDA_NO_DISPONIBLE' } as const;
  }
  const { locale, ...datos } = parsed.data;
  return prepararReserva(createAdminClient(), datos, { locale });
}
