/**
 * Indexa la guía de Guanacaste: lee contenido/guia/*.md, valida cada ficha, genera el
 * embedding de `titulo_en + contenido_en` con la función `embed` y hace upsert por slug.
 *
 * Uso (con `supabase start` y `supabase functions serve embed` corriendo):
 *   npm run guia:indexar
 * Contra otra base (por ejemplo producción): agregar --remoto y cargar sus variables.
 */
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { generarEmbedding } from '../src/lib/asistente/embeddings';

const CARPETA = 'contenido/guia';

const frontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  tipo: z.enum(['playa', 'pueblo', 'parque', 'clima', 'transporte', 'consejo']),
  titulo_es: z.string().min(2),
  titulo_en: z.string().min(2),
  fuente_nombre: z.string().min(2),
  fuente_url: z.string().regex(/^https:\/\//, 'La fuente debe ser https://'),
  revisado: z.boolean(),
});

const textoSchema = z.string().min(100).max(2500);

/** Separa el cuerpo en las secciones "## es" y "## en". */
function secciones(cuerpo: string) {
  const partes = cuerpo.split(/^## (es|en)\s*$/m);
  const salida: Record<string, string> = {};
  for (let i = 1; i < partes.length; i += 2)
    salida[partes[i]] = partes[i + 1].trim();
  return salida;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave)
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY',
    );
  const esLocal = /127\.0\.0\.1|localhost/.test(url);
  if (!esLocal && !process.argv.includes('--remoto'))
    throw new Error(
      `La base ${url} no es local. Si es a propósito, agregá --remoto.`,
    );

  const archivos = readdirSync(CARPETA)
    .filter((f) => f.endsWith('.md'))
    .sort();
  const fichas = archivos.map((archivo) => {
    const { data, content } = matter(
      readFileSync(path.join(CARPETA, archivo), 'utf8'),
    );
    const meta = frontmatterSchema.parse(data);
    if (`${meta.slug}.md` !== archivo)
      throw new Error(
        `${archivo}: el slug (${meta.slug}) no coincide con el nombre`,
      );
    const { es, en } = secciones(content);
    return {
      ...meta,
      contenido_es: textoSchema.parse(es),
      contenido_en: textoSchema.parse(en),
    };
  });

  const slugs = new Set(fichas.map((f) => f.slug));
  if (slugs.size !== fichas.length) throw new Error('Hay slugs repetidos');

  const db = createClient(url, clave, { auth: { persistSession: false } });
  for (const ficha of fichas) {
    const embedding = await generarEmbedding(
      `${ficha.titulo_en}. ${ficha.contenido_en}`,
    );
    const { error } = await db.from('guia').upsert(
      {
        ...ficha,
        embedding: JSON.stringify(embedding),
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'slug' },
    );
    if (error) throw new Error(`${ficha.slug}: ${error.message}`);
    console.log(`ok  ${ficha.slug}${ficha.revisado ? '  (revisada)' : ''}`);
  }

  const revisadas = fichas.filter((f) => f.revisado).length;
  console.log(
    `\n${fichas.length} fichas indexadas (${revisadas} revisadas). El asistente solo usa las revisadas.`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
