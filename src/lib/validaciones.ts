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

export const negocioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Entre 2 y 80 caracteres')
    .max(80, 'Entre 2 y 80 caracteres'),
  descripcion_es: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  descripcion_en: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  email_contacto: z.string().trim().email('Correo no válido'),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ''))
    .pipe(
      z
        .string()
        .regex(/^\+?[0-9]{8,15}$/, 'Usá 8 a 15 dígitos, con + opcional')
        .or(z.literal('')),
    ),
  deposito_pct: z.coerce
    .number({ message: 'Ingresá un número' })
    .int('Debe ser un número entero')
    .min(10, 'Entre 10 y 100')
    .max(100, 'Entre 10 y 100'),
  horas_cancelacion: z.coerce
    .number({ message: 'Ingresá un número' })
    .int('Debe ser un número entero')
    .min(0, 'Entre 0 y 168')
    .max(168, 'Entre 0 y 168'),
  activo: z.boolean(),
});

/** Primer mensaje de error por campo, para mostrarlo junto a cada input. */
export function camposDeZod(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const campos: Record<string, string> = {};
  for (const i of error.issues) campos[String(i.path[0])] ??= i.message;
  return campos;
}

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
