/**
 * Evaluación del asistente: corre los casos de tests/asistente/casos.json contra la API
 * (con Groq real), revisa las herramientas llamadas y el texto con las reglas de cada
 * caso e imprime una tabla y el porcentaje aprobado. No corre en CI para no gastar cuota.
 *
 * Uso (con la app corriendo y `ASISTENTE_MOCK=0`):
 *   npm run asistente:evaluar
 *   npm run asistente:evaluar -- --url https://purareserva.vercel.app --muestra 5
 *   npm run asistente:evaluar -- --casos 11,21,25 --pausa 20
 *
 * Para correrlo local sin chocar con los límites de uso del día, arrancar la app con
 * ASISTENTE_LIMITE_VISITANTE=100 y ASISTENTE_LIMITE_GLOBAL=100.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

type Reglas = {
  herramienta?: string;
  sinHerramientas?: boolean;
  personas?: number;
  datosEnResultado?: boolean;
  soloNegocio?: string;
  citaFuente?: boolean;
  reservaOk?: boolean;
  maxPalabras?: number;
  texto?: { contiene?: string[]; contieneAlguno?: string[] };
  noContiene?: string[];
};
type Caso = {
  id: number;
  tipo: string;
  idioma: 'es' | 'en';
  mensajes: string[];
  contexto?: { negocio_slug?: string; tour_slug?: string };
  reglas: Reglas;
};
type Llamada = {
  nombre: string;
  input: Record<string, unknown>;
  output: unknown;
};
type Parte = Record<string, unknown>;
type MensajeUI = { id: string; role: 'user' | 'assistant'; parts: Parte[] };

const args = process.argv.slice(2);
const opcion = (nombre: string) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const URL_BASE = (opcion('url') ?? 'http://localhost:3000').replace(/\/$/, '');
const PAUSA_MS = Number(opcion('pausa') ?? 15) * 1000;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Un turno: envía la conversación y arma texto y llamadas a herramientas. */
async function turno(caso: Caso, mensajes: MensajeUI[]) {
  for (let intento = 0; intento < 3; intento++) {
    const respuesta = await fetch(`${URL_BASE}/api/asistente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: caso.idioma,
        messages: mensajes,
        contexto: caso.contexto,
      }),
    });
    if (respuesta.status === 429)
      throw new Error('LIMITE: la app llegó al límite de mensajes del día');
    if (!respuesta.ok) {
      // Cuota de Groq por minuto o caída pasajera: se espera y se reintenta.
      await espera(35_000);
      continue;
    }
    let texto = '';
    const partes: Parte[] = [];
    const llamadas: Llamada[] = [];
    for (const linea of (await respuesta.text()).split('\n')) {
      if (!linea.startsWith('data: ')) continue;
      let d: Record<string, unknown>;
      try {
        d = JSON.parse(linea.slice(6));
      } catch {
        continue;
      }
      if (d.type === 'text-delta') texto += String(d.delta);
      if (d.type === 'tool-input-available') {
        partes.push({
          type: `tool-${d.toolName}`,
          toolCallId: d.toolCallId,
          state: 'input-available',
          input: d.input,
        });
        llamadas.push({
          nombre: String(d.toolName),
          input: d.input as Record<string, unknown>,
          output: undefined,
        });
      }
      if (d.type === 'tool-output-available') {
        const p = partes.find((x) => x.toolCallId === d.toolCallId);
        if (p) {
          p.state = 'output-available';
          p.output = d.output;
        }
        const l = llamadas[partes.indexOf(p as Parte)];
        if (l) l.output = d.output;
      }
    }
    return { texto, partes, llamadas };
  }
  throw new Error('El asistente no respondió (no disponible)');
}

// ---- Reglas ----

/** Minutos desde medianoche de una hora como "8:00", "16:30", "9 AM" o "4:30 PM". */
function aMinutos(h: string, m: string | undefined, ampm: string | undefined) {
  let hora = Number(h);
  const sufijo = ampm?.toLowerCase().replace(/\./g, '');
  if (sufijo === 'pm' && hora < 12) hora += 12;
  if (sufijo === 'am' && hora === 12) hora = 0;
  return hora * 60 + Number(m ?? 0);
}
function horasDe(texto: string) {
  const salida = new Set<number>();
  for (const m of texto.matchAll(
    /\b(\d{1,2})(?::(\d{2}))?\s?(a\.?m\.?|p\.?m\.?)?(?![\d:])/gi,
  )) {
    if (m[2] === undefined && m[3] === undefined) continue; // un número suelto no es una hora
    salida.add(aMinutos(m[1], m[2], m[3]));
  }
  return salida;
}
function preciosDe(texto: string) {
  return new Set(
    [...texto.matchAll(/(?:US)?\$\s?(\d+(?:[.,]\d+)?)/g)].map((m) =>
      Number(m[1].replace(',', '.')),
    ),
  );
}

function evaluar(
  caso: Caso,
  texto: string,
  llamadas: Llamada[],
  previas: Llamada[],
) {
  const r = caso.reglas;
  const fallas: string[] = [];
  const re = (s: string) => new RegExp(s, 'i');

  if (r.herramienta && !llamadas.some((l) => l.nombre === r.herramienta))
    fallas.push(`no llamó a ${r.herramienta}`);
  if (r.sinHerramientas && llamadas.length > 0)
    fallas.push(`llamó a ${llamadas.map((l) => l.nombre).join(', ')}`);
  if (r.personas !== undefined) {
    const l = llamadas.find((x) => x.nombre === r.herramienta);
    if (l && l.input.personas !== r.personas)
      fallas.push(
        `personas=${String(l.input.personas)} (esperaba ${r.personas})`,
      );
  }

  const tours = llamadas
    .filter((l) => l.nombre === 'buscar_tours')
    .flatMap(
      (l) =>
        (l.output as { tours?: Record<string, unknown>[] } | undefined)
          ?.tours ?? [],
    );
  if (r.datosEnResultado) {
    const preciosOk = new Set<number>();
    const horasOk = new Set<number>();
    for (const t of tours) {
      for (const p of preciosDe(String(t.precio_texto))) preciosOk.add(p);
      for (const s of (t.salidas as { fecha_hora_texto: string }[]) ?? [])
        for (const h of horasDe(s.fecha_hora_texto)) horasOk.add(h);
    }
    for (const p of preciosDe(texto))
      if (!preciosOk.has(p))
        fallas.push(`precio $${p} que no está en el resultado`);
    for (const h of horasDe(texto))
      if (!horasOk.has(h))
        fallas.push(
          `hora ${Math.floor(h / 60)}:${String(h % 60).padStart(2, '0')} que no está en el resultado`,
        );
  }
  if (r.soloNegocio) {
    const ajenos = tours.filter((t) => t.negocio !== r.soloNegocio);
    if (!tours.length) fallas.push('sin tours en el resultado');
    if (ajenos.length)
      fallas.push(
        `tours de otro negocio: ${ajenos.map((t) => String(t.negocio)).join(', ')}`,
      );
  }
  if (r.citaFuente) {
    const nombres = llamadas
      .filter((l) => l.nombre === 'buscar_guia')
      .flatMap(
        (l) =>
          (l.output as { fichas?: { fuente_nombre: string }[] } | undefined)
            ?.fichas ?? [],
      )
      .map((f) => f.fuente_nombre);
    if (!nombres.length) fallas.push('la guía no devolvió fichas');
    else if (
      !/(fuente|source)/i.test(texto) ||
      !nombres.some((n) => texto.includes(n))
    )
      fallas.push('no nombra la fuente exacta');
  }
  if (r.reservaOk) {
    const l = llamadas.find((x) => x.nombre === 'preparar_reserva');
    const salida = l?.output as { ok?: boolean } | undefined;
    if (!salida?.ok) fallas.push('preparar_reserva no devolvió ok');
    const ids = previas
      .filter((p) => p.nombre === 'buscar_tours')
      .flatMap((p) =>
        (
          (p.output as { tours?: { salidas: { id: string }[] }[] })?.tours ?? []
        ).flatMap((t) => t.salidas.map((s) => s.id)),
      );
    if (l && !ids.includes(String(l.input.salida_id)))
      fallas.push('usó un id de salida que no vino de la búsqueda');
  }
  if (r.maxPalabras && texto.trim().split(/\s+/).length > r.maxPalabras)
    fallas.push(`más de ${r.maxPalabras} palabras`);
  for (const s of r.texto?.contiene ?? [])
    if (!re(s).test(texto)) fallas.push(`falta "${s}"`);
  if (
    r.texto?.contieneAlguno &&
    !r.texto.contieneAlguno.some((s) => re(s).test(texto))
  )
    fallas.push(`no dice ninguna de: ${r.texto.contieneAlguno.join(' | ')}`);
  for (const s of r.noContiene ?? [])
    if (re(s).test(texto)) fallas.push(`contiene lo que no debía: "${s}"`);
  return fallas;
}

// ---- Ejecución ----

async function main() {
  const todos: Caso[] = JSON.parse(
    readFileSync('tests/asistente/casos.json', 'utf8'),
  ).casos;
  let casos = todos;
  const ids = opcion('casos');
  const muestra = Number(opcion('muestra') ?? 0);
  if (ids) {
    const lista = ids.split(',').map(Number);
    casos = todos.filter((c) => lista.includes(c.id));
  } else if (muestra > 0 && muestra < todos.length) {
    // Muestra repartida en todos los tipos de caso.
    const paso = todos.length / muestra;
    casos = Array.from(
      { length: muestra },
      (_, i) => todos[Math.floor(i * paso)],
    );
  }

  console.log(`Evaluando ${casos.length} casos contra ${URL_BASE}\n`);
  const resultados: {
    id: number;
    tipo: string;
    idioma: string;
    ok: boolean;
    fallas: string[];
    herramientas: string[];
    respuesta: string;
  }[] = [];

  for (const caso of casos) {
    const mensajes: MensajeUI[] = [];
    let previas: Llamada[] = [];
    let ultimo = { texto: '', llamadas: [] as Llamada[] };
    try {
      for (const [i, texto] of caso.mensajes.entries()) {
        mensajes.push({
          id: `u${i}`,
          role: 'user',
          parts: [{ type: 'text', text: texto }],
        });
        const t = await turno(caso, mensajes);
        mensajes.push({
          id: `a${i}`,
          role: 'assistant',
          parts: [...t.partes, { type: 'text', text: t.texto }],
        });
        if (i < caso.mensajes.length - 1) previas = [...previas, ...t.llamadas];
        ultimo = t;
        await espera(PAUSA_MS);
      }
    } catch (e) {
      const motivo = e instanceof Error ? e.message : String(e);
      resultados.push({
        id: caso.id,
        tipo: caso.tipo,
        idioma: caso.idioma,
        ok: false,
        fallas: [motivo],
        herramientas: [],
        respuesta: '',
      });
      console.log(
        `${String(caso.id).padStart(2)}  ${caso.idioma}  ${caso.tipo.padEnd(9)}  FALLA  ${motivo}`,
      );
      if (motivo.startsWith('LIMITE')) break;
      continue;
    }
    const fallas = evaluar(caso, ultimo.texto, ultimo.llamadas, previas);
    resultados.push({
      id: caso.id,
      tipo: caso.tipo,
      idioma: caso.idioma,
      ok: fallas.length === 0,
      fallas,
      herramientas: ultimo.llamadas.map((l) => l.nombre),
      respuesta: ultimo.texto,
    });
    console.log(
      `${String(caso.id).padStart(2)}  ${caso.idioma}  ${caso.tipo.padEnd(9)}  ${fallas.length ? 'FALLA' : 'ok   '}  ${fallas.join('; ')}`,
    );
  }

  const aprobados = resultados.filter((r) => r.ok).length;
  const pct = Math.round((aprobados / resultados.length) * 100);
  console.log('\nPor tipo:');
  for (const tipo of [...new Set(resultados.map((r) => r.tipo))]) {
    const del = resultados.filter((r) => r.tipo === tipo);
    console.log(
      `  ${tipo.padEnd(10)} ${del.filter((r) => r.ok).length}/${del.length}`,
    );
  }
  console.log(
    `\nAprobados: ${aprobados}/${resultados.length} (${pct} %). Meta: 90 %.`,
  );

  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    'test-results/asistente-evaluacion.json',
    JSON.stringify(
      { url: URL_BASE, aprobados, total: resultados.length, resultados },
      null,
      2,
    ),
  );
  console.log(
    'Detalle (con las respuestas): test-results/asistente-evaluacion.json',
  );
  if (pct < 90) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
