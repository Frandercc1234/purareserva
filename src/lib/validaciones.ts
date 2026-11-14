import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registroSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nombreNegocio: z.string().trim().min(2).max(80),
  slug: slugSchema,
});

export type CodigoError =
  | 'VALIDACION'
  | 'NO_AUTORIZADO'
  | 'SLUG_EN_USO'
  | 'SALIDA_NO_EXISTE'
  | 'SALIDA_NO_DISPONIBLE'
  | 'SIN_CUPO'
  | 'RESERVA_NO_EXISTE'
  | 'NO_CANCELABLE'
  | 'STRIPE_ERROR'
  | 'DESCONOCIDO';

export type Resultado<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: CodigoError; campos?: Record<string, string> };
