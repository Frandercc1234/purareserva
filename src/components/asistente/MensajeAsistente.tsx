import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Markdown limitado y seguro: negrita, listas y enlaces internos. Nada de HTML crudo:
 * todo se construye con elementos de React, que escapan el texto.
 */

// **negrita**, [texto](/ruta) y rutas internas sueltas como /es/negocio/tour?salida=…
const INLINE =
  /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)\s]*\)|\/(?:es|en)\/[\w\-/?=&%.]+)/g;

function inline(texto: string, clave: string): ReactNode[] {
  return texto.split(INLINE).map((parte, i) => {
    if (!parte) return null;
    const k = `${clave}-${i}`;
    if (parte.startsWith('**') && parte.endsWith('**'))
      return <strong key={k}>{parte.slice(2, -2)}</strong>;
    const md = parte.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (md && !md[2].startsWith('//'))
      return (
        <Link key={k} href={md[2]} className="text-primario underline">
          {md[1]}
        </Link>
      );
    if (/^\/(?:es|en)\//.test(parte))
      return (
        <Link key={k} href={parte} className="text-primario underline">
          {parte}
        </Link>
      );
    return parte;
  });
}

type Bloque =
  { tipo: 'p'; texto: string } | { tipo: 'ul' | 'ol'; items: string[] };

function bloques(markdown: string): Bloque[] {
  const salida: Bloque[] = [];
  for (const linea of markdown.split('\n')) {
    if (!linea.trim()) continue;
    const item = linea.match(/^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      const tipo = item[1] ? 'ul' : 'ol';
      const ultimo = salida[salida.length - 1];
      if (ultimo && ultimo.tipo === tipo) ultimo.items.push(item[3]);
      else salida.push({ tipo, items: [item[3]] });
    } else {
      salida.push({ tipo: 'p', texto: linea.trim() });
    }
  }
  return salida;
}

export function MensajeAsistente({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col gap-2 break-words">
      {bloques(texto).map((b, i) =>
        b.tipo === 'p' ? (
          <p key={i}>{inline(b.texto, `p${i}`)}</p>
        ) : b.tipo === 'ul' ? (
          <ul key={i} className="list-disc pl-5">
            {b.items.map((t, j) => (
              <li key={j}>{inline(t, `u${i}-${j}`)}</li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="list-decimal pl-5">
            {b.items.map((t, j) => (
              <li key={j}>{inline(t, `o${i}-${j}`)}</li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
