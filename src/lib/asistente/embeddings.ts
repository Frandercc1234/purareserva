import 'server-only';
import { z } from 'zod';

export const DIMENSIONES = 384;
const MAX_CARACTERES = 2000;

const respuestaSchema = z.object({
  embedding: z.array(z.number()).length(DIMENSIONES),
});

/**
 * Convierte un texto en un vector de 384 valores llamando a la Edge Function `embed`
 * (modelo gte-small de Supabase). Solo se usa desde el servidor.
 */
export async function generarEmbedding(texto: string): Promise<number[]> {
  const respuesta = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ texto: texto.slice(0, MAX_CARACTERES) }),
    },
  );
  if (!respuesta.ok) {
    throw new Error(`embed respondió ${respuesta.status}`);
  }
  return respuestaSchema.parse(await respuesta.json()).embedding;
}
