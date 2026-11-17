---
name: PuraReserva
description: Reservas de tours de operadores locales de Guanacaste, con la dirección de arte Hierro.
colors:
  carbon: "#1B1410"
  lena: "#2A2019"
  hueso: "#F2EADB"
  superficie: "#FBF8F1"
  brasa: "#E8622A"
  brasa-hover: "#EA723F"
  cuero: "#C98E52"
  texto-suave: "#706354"
  borde-control: "#8C7F6B"
  borde: "#D8CBB4"
  hueso-suave: "#988C7D"
  exito: "#426D48"
  aviso: "#8A5822"
  error: "#B43629"
typography:
  display:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "clamp(3.5rem, 9vw, 7rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0.005em"
  titulo:
    fontFamily: "Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "0.01em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
rounded:
  control: "4px"
  tarjeta: "4px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brasa}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.brasa-hover}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.control}"
    height: "44px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.tarjeta}"
    padding: "16px"
---

# Design System: PuraReserva

## Overview

**Creative North Star: "El hierro y la sabana"**

Guanacaste es tierra de sabana: ganado, madera quemada, cuero y un sol seco. PuraReserva toma de ahí un lenguaje firme y local. Carbón y hueso como pareja de tinta y papel, mayúsculas condensadas para los títulos, un solo color de brasa para actuar y fotos reales de la costa y el campo, a sangre.

Es cálida y confiable, no un marketplace genérico ni una agencia de lujo. Nada de olas, degradados, cifras en círculos ni palmeras de stock. Lo oscuro es poco y está elegido: el header, el hero de la landing, el pie y la parte de arriba del detalle del tour. Todo lo que se opera (selector de salida, formularios, barra de pago, reserva, gracias, cancelado, asistente y panel) vive sobre hueso claro con texto carbón.

**Key Characteristics:**
- Carbón y hueso, con brasa como único color de acción.
- Títulos en Big Shoulders mayúsculas; todo lo demás en Hanken Grotesk.
- Foto real a sangre en el hero, con el bloque carbón encima (en 375 la foto va arriba y el bloque debajo, sin texto sobre la foto).
- Esquinas casi rectas (4px) y bordes finos en lugar de sombras.
- Sin marcas nuevas por operador: no se dibujan hierros ni logos.

## Colors

Una paleta de madera quemada y papel de sabana. Los valores se calculan con `scripts/contraste-paleta.mjs` (`npm run diseno:contraste`), que comprueba cada par con WCAG 2.x. Los valores de la maqueta `docs/diseno/direcciones.html` no se reutilizaron tal cual: cada derivado (texto suave, bordes, tonos de estado) se recalculó.

### Primary
- **Carbón** (#1B1410): tinta de marca. Texto, enlaces, estados activos y seleccionados, anillo de foco y fondo de las superficies oscuras.

### Secondary
- **Brasa** (#E8622A, hover #EA723F): único color de acción. Botón principal con texto carbón (5.38:1). No va en texto, enlaces, íconos, bordes ni decoración. Sobre hueso el botón se identifica por su etiqueta y su forma, no solo por el color (2.83:1 contra el fondo).

### Tertiary
- **Cuero** (#C98E52): destacados (badges y números con texto carbón, etiquetas sobre carbón). Nunca texto sobre claro.

### Neutral
- **Hueso** (#F2EADB): fondo de página y texto sobre carbón.
- **Superficie** (#FBF8F1): tarjetas, controles y diálogos.
- **Leña** (#2A2019): segundo nivel oscuro (bloques sobre carbón).
- **Texto suave** (#706354): texto secundario sobre hueso y superficie (4.88:1 y 5.50:1).
- **Hueso suave** (#988C7D): texto secundario sobre carbón y leña.
- **Borde** (#D8CBB4): divisores y bordes decorativos de tarjetas.
- **Borde de control** (#8C7F6B): borde de inputs, selects y selectores (3:1 mínimo).
- **Éxito** (#426D48), **Aviso** (#8A5822), **Error** (#B43629): estados, como texto sobre hueso y como fondo con texto blanco, todos sobre 5:1.

### Named Rules
**La regla de la brasa.** Brasa es el color de la acción. Si algo no se puede pulsar para avanzar (pagar, reservar, enviar), no va en brasa.
**La regla de lo oscuro.** Carbón solo en header, hero de la landing, pie y parte de arriba del tour. Lo que se opera va sobre hueso.

### Contraste calculado

| Rol | Valor |
|---|---|
| carbon | `#1B1410` |
| lena | `#2A2019` |
| hueso | `#F2EADB` |
| superficie | `#FBF8F1` |
| brasa | `#E8622A` |
| brasa-hover | `#ea723f` |
| cuero | `#C98E52` |
| texto-suave | `#706354` |
| borde-control | `#8c7f6b` |
| borde | `#D8CBB4` |
| hueso-suave | `#988c7d` |
| cuero-texto | `#c98e52` |
| exito | `#426d48` |
| aviso | `#8a5822` |
| error | `#b43629` |

| Par | Texto o elemento | Fondo | Contraste | Mínimo | Resultado |
|---|---|---|---|---|---|
| texto carbón sobre fondo hueso | `#1B1410` | `#F2EADB` | 15.22:1 | 4.5:1 | cumple |
| texto carbón sobre superficie | `#1B1410` | `#FBF8F1` | 17.15:1 | 4.5:1 | cumple |
| texto suave sobre fondo hueso | `#706354` | `#F2EADB` | 4.88:1 | 4.5:1 | cumple |
| texto suave sobre superficie | `#706354` | `#FBF8F1` | 5.50:1 | 4.5:1 | cumple |
| texto carbón sobre botón brasa | `#1B1410` | `#E8622A` | 5.38:1 | 4.5:1 | cumple |
| texto carbón sobre brasa en hover | `#1B1410` | `#ea723f` | 6.05:1 | 4.5:1 | cumple |
| texto carbón sobre cuero (badge) | `#1B1410` | `#C98E52` | 6.48:1 | 4.5:1 | cumple |
| texto hueso sobre carbón | `#F2EADB` | `#1B1410` | 15.22:1 | 4.5:1 | cumple |
| texto hueso sobre leña | `#F2EADB` | `#2A2019` | 13.32:1 | 4.5:1 | cumple |
| texto hueso suave sobre carbón | `#988c7d` | `#1B1410` | 5.53:1 | 4.5:1 | cumple |
| texto hueso suave sobre leña | `#988c7d` | `#2A2019` | 4.84:1 | 4.5:1 | cumple |
| etiqueta cuero sobre carbón | `#c98e52` | `#1B1410` | 6.48:1 | 4.5:1 | cumple |
| etiqueta cuero sobre leña | `#c98e52` | `#2A2019` | 5.67:1 | 4.5:1 | cumple |
| superficie sobre carbón (botón carbón) | `#FBF8F1` | `#1B1410` | 17.15:1 | 4.5:1 | cumple |
| borde de control sobre fondo hueso | `#8c7f6b` | `#F2EADB` | 3.28:1 | 3:1 | cumple |
| borde de control sobre superficie | `#8c7f6b` | `#FBF8F1` | 3.69:1 | 3:1 | cumple |
| foco carbón sobre fondo hueso | `#1B1410` | `#F2EADB` | 15.22:1 | 3:1 | cumple |
| foco hueso sobre carbón | `#F2EADB` | `#1B1410` | 15.22:1 | 3:1 | cumple |
| brasa (botón) sobre fondo hueso, no texto | `#E8622A` | `#F2EADB` | 2.83:1 | 2.5:1 | cumple |
| éxito como texto sobre hueso | `#426d48` | `#F2EADB` | 5.00:1 | 4.5:1 | cumple |
| éxito como fondo con texto blanco | `#FFFFFF` | `#426d48` | 5.98:1 | 4.5:1 | cumple |
| aviso como texto sobre hueso | `#8a5822` | `#F2EADB` | 5.02:1 | 4.5:1 | cumple |
| aviso como fondo con texto blanco | `#FFFFFF` | `#8a5822` | 6.00:1 | 4.5:1 | cumple |
| error como texto sobre hueso | `#b43629` | `#F2EADB` | 5.02:1 | 4.5:1 | cumple |
| error como fondo con texto blanco | `#FFFFFF` | `#b43629` | 6.00:1 | 4.5:1 | cumple |


## Typography

**Display Font:** Big Shoulders (variable, con eje de tamaño óptico), con Arial Narrow de respaldo
**Body Font:** Hanken Grotesk, con system-ui de respaldo

**Character:** una condensada de rótulo, fuerte y compacta, contra una grotesca humanista y legible. La condensada pone el carácter; la grotesca hace el trabajo.

### Hierarchy
- **Display** (800, clamp(3.5rem, 9vw, 7rem), 0.92): h1 del hero y de las portadas. Clase `titulo-hero`.
- **Título** (800, 2.5rem a 4rem, 0.98): h2 y el nombre del tour en tarjetas y detalle. Clase `titulo`. Siempre en mayúsculas.
- **Body** (400, 16px, 24px): texto corrido, máximo 65 a 75 caracteres por línea.
- **Label** (600, 14px, sin mayúsculas forzadas): etiquetas de campo, datos, botones, tabs.

### Named Rules
**La regla de las mayúsculas.** Big Shoulders en mayúsculas solo para títulos (h1, h2 y el nombre del tour). Botones, etiquetas, datos, formularios, el asistente y todo el panel van en Hanken Grotesk, sin mayúsculas forzadas.
**Prueba de largo.** El nombre de tour más largo del seed ("Aguas termales y barro", "Catamarán al atardecer") ocupa como máximo 3 líneas a 375px.

## Layout

Móvil primero. Contenedor central de hasta 64rem con 16px de margen lateral en móvil y 48px desde 1024px. Ritmo vertical en múltiplos de 8px, con más aire arriba de un título que debajo. La foto del hero va a sangre; en 375 va arriba y el bloque carbón debajo. La barra de reserva fija en móvil y la tarjeta fija en escritorio se mantienen.

## Elevation & Depth

Plano por defecto. La jerarquía sale del contraste carbón y hueso y de bordes finos de 1px, no de sombras. La única sombra es una línea inferior casi invisible en tarjetas (`0 1px 0 rgb(27 20 16 / 0.08)`).

### Named Rules
**La regla del plano.** Nada flota ni brilla. Las sombras difusas, los degradados y el vidrio esmerilado no se usan.

## Shapes

Esquinas casi rectas: 4px en controles y tarjetas. Bordes finos de 1px. Los selectores de día y hora son rectángulos, no píldoras. Las fotos a sangre van sin redondeo.

## Components

### Buttons
- **Shape:** 44px de alto, radio 4px, etiqueta en Hanken 600.
- **Primary:** fondo brasa, texto carbón. Hover un paso más claro. Press con `scale(0.97)`. Disabled en borde con texto suave.
- **Secondary:** contorno carbón sobre superficie. Hover lo rellena de carbón.
- **On dark:** contorno hueso sobre carbón. Hover lo rellena de hueso.

### Inputs / Fields
- **Style:** borde de control 1px, fondo superficie, radio 4px, 44px de alto, etiqueta encima en 600.
- **Focus:** anillo carbón de 2px con desfase de 2px (hueso sobre carbón). Hover y foco oscurecen el borde.
- **Error / Disabled:** borde y texto de error; deshabilitado en fondo hueso con cursor bloqueado.

### Cards / Containers
- **Corner Style:** 4px. **Background:** superficie sobre hueso. **Border:** 1px borde. **Padding:** 16px.

### Badge
Píldora con estado: éxito, aviso y error con texto blanco; destacado en cuero con texto carbón; neutro en borde.

## Motion

Solo `transform`, `opacity` y `clip-path`; nunca `transition: all`; todo respeta `prefers-reduced-motion`.

- `--ease-out`: cubic-bezier(0.23, 1, 0.32, 1), para entradas y respuestas.
- `--ease-in-out`: cubic-bezier(0.77, 0, 0.175, 1), para movimientos entre posiciones.
- `--duration-rapida`: 150ms (hover, press). `--duration-base`: 200ms (paneles). `--duration-lenta`: 320ms. `--duration-entrada`: 520ms (coreografía de carga).
- Hover solo en dispositivos con hover (las variantes `hover:` de Tailwind 4 ya lo aplican).

## Photography

Fotos reales de Guanacaste (ver `docs/creditos-fotos.md`), sin caras reconocibles en primer plano. A sangre en el hero y en la parte de arriba del tour; en tarjetas, 4:3 con recorte centrado. Sin filtros ni degradados encima: el bloque carbón es sólido. El hero usa `tamarindo-aerea.jpg` o `costa-nicoya.jpg`; `cascada.jpg` y `atardecer-playa.jpg` no se usan en la landing hasta confirmar su lugar. Alt descriptivo en cada una.

## Icons

Sin íconos decorativos. Los pocos funcionales (cerrar, flechas del selector, chat) son trazos simples de carbón. El ícono de la tarjeta del operador se quita; no se dibujan marcas por operador.

## Tone of voice

Local, directo, en voseo en español y plano en inglés. Frases cortas que dicen lo que pasa: cupo a la vista, depósito en línea, el resto en el lugar. Nada de "miles de turistas", reseñas, premios ni testimonios.

## Do's and Don'ts

### Do:
- **Do** usar brasa solo en el botón de acción principal.
- **Do** poner carbón solo en header, hero, pie y parte alta del tour; el resto, sobre hueso.
- **Do** probar cada color nuevo con `npm run diseno:contraste` antes de usarlo.
- **Do** poner el foco en hueso sobre superficies carbón (clase `sobre-carbon`).

### Don't:
- **Don't** usar degradados, vidrio, sombras difusas ni ondas SVG.
- **Don't** usar mayúsculas forzadas fuera de los títulos.
- **Don't** dibujar marcas o hierros nuevos por operador.
- **Don't** mostrar cifras de clientes, reseñas ni testimonios.
- **Don't** poner texto sobre la foto en 375: el bloque carbón va debajo.
