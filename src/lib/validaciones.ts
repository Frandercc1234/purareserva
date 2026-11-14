import { z } from 'zod';
import { aCentavos } from './dinero';

/** Rutas que no pueden ser el slug de un negocio. */
const SLUGS_RESERVADOS = [
  'reserva',
  'panel',
  'login',
  'registro',
  'api',
  'dev',
  'es',
  'en',
];

export const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .refine((s) => !SLUGS_RESERVADOS.includes(s));

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

const entero = (min: number, max: number) =>
  z.coerce
    .number({ message: 'Ingresá un número' })
    .int('Debe ser un número entero')
    .min(min, `Entre ${min} y ${max}`)
    .max(max, `Entre ${min} y ${max}`);

export const tourSchema = z.object({
  nombre_es: z
    .string()
    .trim()
    .min(2, 'Entre 2 y 100 caracteres')
    .max(100, 'Entre 2 y 100 caracteres'),
  nombre_en: z
    .string()
    .trim()
    .min(2, 'Entre 2 y 100 caracteres')
    .max(100, 'Entre 2 y 100 caracteres'),
  descripcion_es: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  descripcion_en: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  precio: z.string().transform((v, ctx) => {
    const c = aCentavos(v);
    if (c === null || c < 100 || c > 1_000_000) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ingresá un precio entre $1.00 y $10000.00',
      });
      return z.NEVER;
    }
    return c;
  }),
  duracion_min: entero(15, 1440),
  cupo_default: entero(1, 200),
  punto_encuentro: z.string().trim().max(200, 'Máximo 200 caracteres'),
  activo: z.boolean(),
});

/** UUID por formato (acepta también los ids fijos del seed). */
export const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elegí una fecha');
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Elegí una hora');
const cupoOpcional = z
  .union([z.literal(''), entero(1, 200)])
  .transform((v) => (v === '' ? null : v));

export const salidaSchema = z.object({
  tour_id: uuid,
  fecha,
  hora,
  cupo: cupoOpcional,
});

export const salidasLoteSchema = z.object({
  tour_id: uuid,
  desde: fecha,
  hasta: fecha,
  dias: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, 'Elegí al menos un día'),
  hora,
  cupo: cupoOpcional,
});

export const reservaSchema = z.object({
  salida_id: uuid,
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{8,20}$/),
  personas: z.coerce.number().int().min(1).max(50),
  idioma: z.enum(['es', 'en']),
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
