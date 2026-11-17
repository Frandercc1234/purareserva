// Calcula la paleta de Hierro y comprueba su contraste (WCAG 2.x).
// Uso: node scripts/contraste-paleta.mjs   (sale con código 1 si algún par exigido falla)

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/** Mezcla dos colores (t = 0 devuelve a, t = 1 devuelve b). */
const mezcla = (a, b, t) =>
  '#' +
  [1, 3, 5]
    .map((i) => {
      const v = Math.round(
        parseInt(a.slice(i, i + 2), 16) * (1 - t) +
          parseInt(b.slice(i, i + 2), 16) * t,
      );
      return v.toString(16).padStart(2, '0');
    })
    .join('');

/** Desde `base`, se acerca a `meta` en pasos hasta cumplir `min` contra todos los fondos. */
function ajustar(base, meta, fondos, min) {
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const c = mezcla(base, meta, t);
    if (fondos.every((f) => ratio(c, f) >= min)) return c;
  }
  throw new Error(`Sin solución para ${base}`);
}

// Colores fijos (decisiones de diseño).
const CARBON = '#1B1410';
const LENA = '#2A2019';
const HUESO = '#F2EADB';
const SUPERFICIE = '#FBF8F1';
const BRASA = '#E8622A';
const CUERO = '#C98E52';

// Colores derivados: se calculan para cumplir el contraste.
const TEXTO_SUAVE = ajustar('#8A7A68', CARBON, [HUESO, SUPERFICIE], 4.8);
const BORDE_CONTROL = ajustar('#B8A98F', CARBON, [HUESO, SUPERFICIE], 3.2);
const BORDE = '#D8CBB4';
const HUESO_SUAVE = ajustar('#8E8272', HUESO, [CARBON, LENA], 4.8);
const CUERO_TEXTO = ajustar(CUERO, HUESO, [CARBON, LENA], 4.8); // etiquetas sobre carbón
const EXITO = ajustar('#4F8A5B', CARBON, [HUESO, SUPERFICIE, '#FFFFFF'], 5);
const AVISO = ajustar('#B8742A', CARBON, [HUESO, SUPERFICIE, '#FFFFFF'], 5);
const ERROR = ajustar('#C0392B', CARBON, [HUESO, SUPERFICIE, '#FFFFFF'], 5);
// Hover de la brasa: un paso más claro, con el texto carbón todavía por encima de 4.5.
let brasaHover = BRASA;
for (let t = 0.1; t < 0.5; t += 0.01) {
  const c = mezcla(BRASA, '#FFFFFF', t);
  if (ratio(c, CARBON) >= 6) {
    brasaHover = c;
    break;
  }
}

export const PALETA = {
  carbon: CARBON,
  lena: LENA,
  hueso: HUESO,
  superficie: SUPERFICIE,
  brasa: BRASA,
  'brasa-hover': brasaHover,
  cuero: CUERO,
  'texto-suave': TEXTO_SUAVE,
  'borde-control': BORDE_CONTROL,
  borde: BORDE,
  'hueso-suave': HUESO_SUAVE,
  'cuero-texto': CUERO_TEXTO,
  exito: EXITO,
  aviso: AVISO,
  error: ERROR,
};

// Pares exigidos: [descripción, texto, fondo, mínimo]
const PARES = [
  ['texto carbón sobre fondo hueso', CARBON, HUESO, 4.5],
  ['texto carbón sobre superficie', CARBON, SUPERFICIE, 4.5],
  ['texto suave sobre fondo hueso', TEXTO_SUAVE, HUESO, 4.5],
  ['texto suave sobre superficie', TEXTO_SUAVE, SUPERFICIE, 4.5],
  ['texto carbón sobre botón brasa', CARBON, BRASA, 4.5],
  ['texto carbón sobre brasa en hover', CARBON, brasaHover, 4.5],
  ['texto carbón sobre cuero (badge)', CARBON, CUERO, 4.5],
  ['texto hueso sobre carbón', HUESO, CARBON, 4.5],
  ['texto hueso sobre leña', HUESO, LENA, 4.5],
  ['texto hueso suave sobre carbón', HUESO_SUAVE, CARBON, 4.5],
  ['texto hueso suave sobre leña', HUESO_SUAVE, LENA, 4.5],
  ['etiqueta cuero sobre carbón', CUERO_TEXTO, CARBON, 4.5],
  ['etiqueta cuero sobre leña', CUERO_TEXTO, LENA, 4.5],
  ['superficie sobre carbón (botón carbón)', SUPERFICIE, CARBON, 4.5],
  ['borde de control sobre fondo hueso', BORDE_CONTROL, HUESO, 3],
  ['borde de control sobre superficie', BORDE_CONTROL, SUPERFICIE, 3],
  ['foco carbón sobre fondo hueso', CARBON, HUESO, 3],
  ['foco hueso sobre carbón', HUESO, CARBON, 3],
  ['brasa (botón) sobre fondo hueso, no texto', BRASA, HUESO, 2.5],
  ['éxito como texto sobre hueso', EXITO, HUESO, 4.5],
  ['éxito como fondo con texto blanco', '#FFFFFF', EXITO, 4.5],
  ['aviso como texto sobre hueso', AVISO, HUESO, 4.5],
  ['aviso como fondo con texto blanco', '#FFFFFF', AVISO, 4.5],
  ['error como texto sobre hueso', ERROR, HUESO, 4.5],
  ['error como fondo con texto blanco', '#FFFFFF', ERROR, 4.5],
];

let falla = false;
const filas = [];
for (const [nombre, fg, bg, min] of PARES) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) falla = true;
  filas.push(
    `| ${nombre} | \`${fg}\` | \`${bg}\` | ${r.toFixed(2)}:1 | ${min}:1 | ${ok ? 'cumple' : 'FALLA'} |`,
  );
}

if (process.argv.includes('--md')) {
  console.log('| Rol | Valor |\n|---|---|');
  for (const [k, v] of Object.entries(PALETA))
    console.log(`| ${k} | \`${v}\` |`);
  console.log(
    '\n| Par | Texto o elemento | Fondo | Contraste | Mínimo | Resultado |\n|---|---|---|---|---|---|',
  );
  console.log(filas.join('\n'));
} else {
  console.log(JSON.stringify(PALETA, null, 2));
  console.log(filas.join('\n'));
}
process.exit(falla ? 1 : 0);
