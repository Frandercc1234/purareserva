# PuraReserva v3: dirección de arte y movimiento

Complemento de `blueprint.md`, `blueprint-v1.1.md` y `blueprint-v2-asistente.md`. Se aplica sobre el proyecto en producción. Las reglas de la sección 16 del blueprint original siguen vigentes.

**Objetivo:** que PuraReserva deje de parecer una plantilla. Dirección de arte nueva para la parte pública y el flujo de reserva, pulido de la interfaz y movimiento con criterio.

**Origen:** revisión de `purareserva.vercel.app/es` el 16-nov. La landing repite el patrón de plantilla SaaS: hero verde azulado con onda SVG, tres cifras, collage de fotos, tarjetas genéricas, "Cómo funciona" con círculos numerados y banda de llamada a la acción. Inter en todo. Además se muestra un negocio de prueba ("viajes el pepe", 0 tours).

---

## 1. Alcance

**Dentro:**
- Dirección de arte nueva: tipografía, color, composición, fotografía y tono del texto. Reemplaza el mundo visual actual.
- Rediseño (taste + impeccable): inicio `/[locale]`, negocio `/[locale]/[negocio]`, tour `/[locale]/[negocio]/[tour]` con su formulario, reserva `/[locale]/reserva/[token]`, `gracias`, `cancelado`, la 404 y el asistente.
- Panel del dueño (`/panel/*`), login y registro: solo heredan los tokens nuevos y reciben pulido de impeccable y movimiento. **Sin taste y sin cambiar su estructura.**
- Movimiento en todo el sitio, con las skills de Emil Kowalski.
- Bug: ocultar negocios sin tours activos en la landing y en el sitemap.

**Fuera:**
- Funciones nuevas, cambios de base de datos, de rutas o de lógica de reserva y pago.
- Dependencias nuevas de animación (Motion, GSAP, etc.). Todo con CSS, transiciones de Tailwind y la View Transitions API si hace falta.
- Servicios pagos. Fuentes de Google por `next/font` y fotos con licencia gratuita (Unsplash o Pexels).
- Reseñas, testimonios, cifras de clientes o cualquier dato inventado.

---

## 2. Skills que usa el constructor

Instaladas de forma global para Claude Code. Antes del paso 1, confirmar que aparecen con `/skills`. Si alguna falta, avisar y parar.

| Skill | Para qué | Dónde se usa |
|---|---|---|
| `design-taste-frontend` (taste) | Dirección de arte anti-plantilla para páginas públicas. Trae un chequeo final (gate) en el navegador. | Pasos 3, 5 y 6. **Nunca en el panel.** |
| `impeccable` | Contexto del producto (PRODUCT.md, DESIGN.md), mundo visual, `critique`, `audit`, `polish`, `typeset`, `layout`, `adapt`, `harden`, `clarify` | Pasos 2 a 10 |
| `emil-design-eng` | Detalles de interacción: hover, press, popovers, transiciones | Pasos 4 a 9 |
| `improve-animations` | Auditoría del movimiento y planes en `plans/`. No edita código. | Paso 9 |
| `animation-vocabulary` | Nombrar efectos con precisión en los planes | Paso 9 |
| `apple-design` | Barra de pago fija en móvil, panel del asistente y movimiento con resortes, si se usa | Pasos 7 y 9 |
| `review-animations` | Revisión final del movimiento. Solo se activa a mano. | Paso 9: la corre Frander con `/review-animations` |

**Orden obligatorio:** dirección de arte → tokens → páginas → pulido → movimiento. El movimiento va al final para no afinar curvas sobre un diseño que todavía cambia.

**Prioridad cuando dos skills chocan:** el DESIGN.md aprobado gana. Después taste para páginas públicas, impeccable para el flujo de reserva y el panel, y Emil para todo lo que se mueve.

---

## 3. Modo de cada superficie

Según impeccable. Define cuánta expresión lleva cada pantalla.

| Superficie | Modo | Qué significa |
|---|---|---|
| Inicio | Persuade | Expresión completa. Foto real a sangre, voz propia, un momento memorable. |
| Negocio | Persuade | Foto de portada, sus tours como protagonistas. |
| Tour (detalle + formulario) | Persuade arriba, Operate en el formulario | La foto y el nombre venden. El selector de salida y el formulario son precisos y sobrios. |
| Reserva, gracias, cancelado | Operate | Claridad, datos legibles, cero decoración que distraiga. |
| Asistente | Operate | Hereda tokens. Densidad cómoda en 375px. |
| Panel, login, registro | Operate | Solo tokens y pulido. |

---

## 4. Restricciones de calidad

- **Responsive:** todo se revisa a 375x812 y 1280x800, en `/es` y `/en`.
- **Rendimiento (móvil, Lighthouse en la URL de vista previa):** LCP < 2,5 s, CLS < 0,1, Performance ≥ 90. Imágenes con `next/image`, `sizes` correctos y `priority` solo en la foto del hero. Máximo 2 familias tipográficas, con `display: swap` y subset latino.
- **Movimiento:** solo `transform`, `opacity` y `clip-path`. Nada de `transition: all`. Todo respeta `prefers-reduced-motion`. Nada anima en acciones de teclado ni en cosas que se repiten mucho (escribir en el chat, cambiar de día en el selector).
- **Accesibilidad:** contraste AA en texto y botones, foco visible, objetivos táctiles de 44px como mínimo, `alt` en todas las fotos.
- **Texto:** se puede reescribir el texto de la landing con voz propia, siempre en `messages/es.json` y `messages/en.json` a la vez. Ninguna afirmación nueva que no sea verdad: nada de "miles de turistas", reseñas, premios ni testimonios.
- **Pruebas:** no cambiar `role`, `name` accesible ni `data-testid` que usen las pruebas e2e. Si un texto cambia y una prueba lo usa, se actualiza la prueba en el mismo commit.
- **Fotos:** con licencia gratuita, descargadas a `public/fotos/`, optimizadas (lado mayor ≤ 2400px) y con crédito en `docs/creditos-fotos.md`. Lugares reales de Guanacaste. Sin caras reconocibles en primer plano.

---

## 5. Rama y despliegue

- Todo el trabajo va en la rama `diseno-v3`. Vercel crea una URL de vista previa por cada push. Producción no se toca hasta el paso 11.
- Commit al terminar cada paso: `v3 paso N: …`. Push después de cada commit para que exista la vista previa.
- Pasos con **PARADA**: el constructor termina, deja la URL de vista previa y espera la aprobación de Frander antes de seguir.

---

## 6. Pasos

Regla para todos los pasos con interfaz: al terminar, revisar con Playwright MCP a 375x812 y 1280x800, en `/es` y `/en`, sin errores en consola. Correr `npm run lint`, `npm run typecheck` (o `npx tsc --noEmit`) y `npm test`.

### Paso 0. Preparación

- Crear la rama `diseno-v3`.
- Confirmar que las 7 skills de la sección 2 están disponibles.
- Capturas "antes" con Playwright en `docs/capturas/v3-antes/`: inicio, negocio, tour, gracias y asistente abierto, a 375 y 1280, en ES.
- **Criterio:** la rama existe y hay 10 capturas.
- **Verificación:** `git branch --show-current` devuelve `diseno-v3`; `ls docs/capturas/v3-antes | wc -l` devuelve 10.

### Paso 1. Ocultar negocios sin tours activos

- En la consulta de la landing (`src/app/[locale]/page.tsx`) y en `src/app/sitemap.ts`, mostrar solo negocios con al menos un tour activo.
- La página de un negocio sin tours activos sigue existiendo (el dueño la puede ver), pero no se enlaza desde la landing.
- Prueba unitaria o e2e: un negocio sin tours no aparece en la landing.
- **No borrar datos en producción.** Si hace falta borrar "viajes el pepe", lo decide Frander.
- **Criterio:** la landing muestra solo "Aventuras Rincón" y "Mar y Sol Tamarindo".
- **Verificación:** `npm test` y la prueba nueva en verde.

### Paso 2. Contexto del producto

- Correr el setup de impeccable (`impeccable context`) y después `impeccable init` para escribir `PRODUCT.md` con este contenido:
  - Producto: reservas de tours de operadores locales de Guanacaste, Costa Rica. Depósito en línea, el resto en el lugar. Proyecto de portafolio con calidad de producto.
  - Usuarios: turistas (sobre todo de EE.UU., Canadá y Europa, en el teléfono, a veces ya en Costa Rica) y dueños de operadoras pequeñas que hoy reservan por WhatsApp.
  - Tarea principal del turista: encontrar un tour, ver si hay cupo el día que quiere y pagar el depósito en menos de 2 minutos.
  - Personalidad: local, cálida y confiable. No es un marketplace genérico ni una agencia de lujo.
  - Anti-referencias: plantillas SaaS (hero con onda, tres cifras, círculos numerados), estética de agencia de viajes con stock genérico de palmeras, degradados morados de IA.
  - Modos por superficie: la tabla de la sección 3.
- Correr `impeccable critique` sobre inicio, tour y gracias, y guardar el resultado en `docs/diseno/critica-antes.md`.
- **Criterio:** existen `PRODUCT.md` y `docs/diseno/critica-antes.md`.
- **Verificación:** `test -f PRODUCT.md && test -f docs/diseno/critica-antes.md`.

### Paso 3. Dirección de arte (PARADA)

- Con taste y el flujo de mundo visual nuevo de impeccable (`new-work-world`), proponer **3 direcciones distintas** de verdad: cambia la tipografía, el color, cómo se usan las fotos y la composición. No son variaciones de color del mismo layout.
- Para cada una, una maqueta estática en `docs/diseno/direcciones.html` (un solo archivo, sin dependencias externas salvo Google Fonts), con:
  - Hero de la landing a 375 y 1280.
  - Tarjeta de tour.
  - Parte de arriba del detalle del tour con el selector de salida.
  - Paleta con contraste AA comprobado, tipografías y una línea de texto de ejemplo en ES y EN.
  - Una nota de 3 líneas: idea, por qué encaja con Guanacaste y PuraReserva, y riesgo.
- Fotos: elegir las del hero y las portadas de los negocios en Unsplash o Pexels, guardarlas en `public/fotos/` y anotar los créditos.
- **PARADA:** commit, push y dejar la URL de vista previa de `docs/diseno/direcciones.html` (copiar el archivo a `public/diseno/direcciones.html` para que Vercel lo sirva en la rama). Esperar a que Frander elija una dirección o pida una mezcla concreta.
- **Criterio:** 3 direcciones visibles en la URL de vista previa, a 375 y 1280.
- **Verificación:** abrir `<url-preview>/diseno/direcciones.html`.

### Paso 4. DESIGN.md y tokens

- Con la dirección aprobada, escribir `DESIGN.md` (impeccable `document`): tipografías y escala, paleta con roles, espaciado, radios, sombras, fotografía (encuadre, tratamiento, cuándo usar a sangre), iconos, tono del texto, y curvas y duraciones de movimiento como tokens (`--ease-*`, `--duration-*`).
- Pasar los tokens a `src/app/globals.css` (`@theme`). Mantener los nombres actuales (`primario`, `acento`, `fondo`, `superficie`, `texto`, etc.) y cambiar sus valores, para que el panel herede sin tocar sus componentes. Agregar solo los tokens nuevos que hagan falta.
- Fuentes con `next/font` en `src/app/layout.tsx`.
- Rehacer los componentes de `src/components/ui/` (Button, Card, Input, Select, Textarea, Badge, Field, Dialog, EmptyState, Table) con los tokens nuevos y los detalles de `emil-design-eng`: estado de press, hover solo con `@media (hover: hover)`, foco visible, disabled claro.
- Borrar `public/diseno/direcciones.html` (la maqueta queda en `docs/`).
- **Criterio:** el sitio entero usa la tipografía y la paleta nuevas. El panel funciona igual que antes.
- **Verificación:** `npm run build` y las pruebas e2e (`npx playwright test`) en verde.

### Paso 5. Landing (PARADA)

- Rediseñar `/[locale]` con taste y la dirección aprobada. Superficie Persuade.
- Quitar los patrones de plantilla: onda SVG, bloque de tres cifras, círculos numerados, banda verde de llamada a la acción. Si "cómo funciona" sigue haciendo falta, se resuelve con otra composición.
- Un solo llamado principal para el turista arriba. El bloque para operadores queda abajo, una sola vez (regla de la v1.1).
- Un momento memorable como máximo, que no frene la carga (LCP).
- Header y footer públicos (`Header.tsx`, `Footer.tsx`, `Marca.tsx`, `LocaleSwitcher.tsx`) en la misma dirección.
- Correr el gate de taste y `impeccable polish` sobre la landing.
- **PARADA:** commit, push y URL de vista previa. Frander revisa (o pide la revisión a Cowork) antes de seguir.
- **Criterio:** gate de taste aprobado; Lighthouse móvil cumple la sección 4.
- **Verificación:** `npx playwright test`; Lighthouse sobre `<url-preview>/es`.

### Paso 6. Negocio, tour y formulario

- `/[locale]/[negocio]`: portada con foto, descripción y sus tours. Persuade.
- `/[locale]/[negocio]/[tour]`: foto y datos arriba con la dirección nueva. El selector de días (`SalidaPicker`), el formulario (`ReservaForm`), la tarjeta fija en escritorio y la barra de pago fija en móvil se tratan como Operate: `impeccable layout`, `typeset` y `clarify`. **No cambia la lógica**: retención de cupos, validación, foco al primer error y Stripe siguen igual.
- `TourCard` y `Imagen` con el tratamiento de fotos de DESIGN.md.
- Probar con datos extremos: nombre de tour largo, descripción vacía, 0 salidas en la semana, 1 cupo.
- **Criterio:** el flujo completo de reserva en modo prueba funciona (tour → salida → datos → Stripe Checkout de prueba → gracias).
- **Verificación:** `npx playwright test` (incluye el e2e de reserva).

### Paso 7. Reserva, gracias, cancelado, 404 y asistente

- `/[locale]/reserva/[token]`, `gracias`, `cancelado` y `NoEncontrada`: Operate. Datos legibles, estado claro (confirmada, pendiente, cancelada), acción principal visible.
- Arreglar de paso el detalle pendiente de la v1.1: en la 404 de `/en` el título de la pestaña sale en español.
- Asistente (`src/components/asistente/*`): tokens nuevos, burbujas, tarjetas de tour y botón "Completar reserva" con la misma dirección. El panel en móvil se revisa con `apple-design` (hoja que sube, zona segura de abajo, teclado abierto).
- **No tocar** la lógica del asistente, el prompt ni las herramientas.
- **Criterio:** el e2e del asistente con modelo simulado pasa. La 404 en EN tiene título en inglés.
- **Verificación:** `ASISTENTE_MOCK=1 npx playwright test tests/e2e/asistente.spec.ts` y abrir `<url-preview>/en/no-existe`.

### Paso 8. Panel, login y registro

- Sin taste. Solo `impeccable audit` y `impeccable polish` sobre `/panel`, `/panel/reservas`, `/panel/tours`, `/panel/configuracion`, `/login` y `/registro`.
- Arreglar lo que salga del audit que sea de tokens, espaciado, contraste, estados vacíos y responsive. No reorganizar pantallas.
- **Criterio:** el audit no deja hallazgos de severidad alta.
- **Verificación:** `npx playwright test` y `docs/diseno/audit-panel.md` con el resultado.

### Paso 9. Movimiento

- Correr `improve-animations` sobre todo el repo. Deja la auditoría y los planes en `plans/` (no edita código).
- Ejecutar los planes de prioridad alta y media. Usar `animation-vocabulary` para nombrar cada efecto en los commits.
- Guía mínima:
  - Entradas de la landing: una sola coreografía corta al cargar, escalonada, ≤ 600 ms en total. Nada de animar cada sección al hacer scroll.
  - Tarjetas y botones: press con `scale(0.97)` y hover sutil solo en dispositivos con hover.
  - Selector de días: el día elegido cambia sin animar el layout.
  - Panel del asistente: entra desde el botón (origen correcto), interrumpible, sale más rápido de lo que entra.
  - Barra de pago en móvil: aparece sin tapar contenido ni saltar al abrir el teclado.
  - Todo con `prefers-reduced-motion: reduce` resuelto (sin movimiento, solo opacidad si hace falta).
- **PARADA:** commit y push. Frander corre `/review-animations` en Claude Code (esta skill solo se activa a mano) y se aplican sus hallazgos.
- **Criterio:** `review-animations` sin hallazgos bloqueantes.
- **Verificación:** `npx playwright test` y revisión a 375px con la emulación de movimiento reducido activada.

### Paso 10. QA final

- `impeccable audit` sobre las páginas públicas. `impeccable critique` sobre inicio, tour y gracias, y guardar en `docs/diseno/critica-despues.md` con la comparación contra `critica-antes.md`.
- Gate de taste sobre inicio, negocio y tour.
- Lighthouse móvil sobre inicio y tour en la URL de vista previa: anotar los 4 puntajes en `docs/diseno/lighthouse.md`.
- Capturas "después" en `docs/capturas/v3-despues/` con los mismos 10 encuadres del paso 0.
- README: reemplazar las capturas por las nuevas y agregar una línea sobre la dirección de arte.
- **Criterio:** todo en verde, Lighthouse cumple la sección 4 y no hay errores en consola.
- **Verificación:** `npm run lint && npm run build && npm test && npx playwright test`.

### Paso 11. Merge y despliegue

- Abrir un PR de `diseno-v3` a `main` con: resumen, enlace a la vista previa, capturas antes y después, y los puntajes de Lighthouse.
- Merge cuando Frander apruebe. Vercel despliega producción.
- Revisar producción a 375 y 1280, en ES y EN.
- **Criterio:** producción muestra el diseño nuevo y el CI está en verde.
- **Verificación:** abrir `https://purareserva.vercel.app/es` y `/en`.

---

## 7. Supuestos y riesgos

- **Supuesto:** las skills están instaladas de forma global para Claude Code. Si una no aparece, se instala con `npx skills add <repo>` (los repos: `emilkowalski/skills`, `pbakaus/impeccable`, `Leonxlnx/taste-skill`).
- **Riesgo:** el gate de taste corre al terminar cada respuesta mientras la skill está activa. En pasos donde no aplica (panel, lógica) puede frenar al constructor. Activar taste solo en los pasos 3, 5 y 6.
- **Riesgo:** taste e impeccable pueden proponer cosas distintas. Gana DESIGN.md aprobado (sección 2).
- **Riesgo:** fotos pesadas que bajan el LCP. Se controla con el presupuesto de la sección 4.
- **Riesgo:** cambios de texto que rompen pruebas e2e. Se actualizan en el mismo commit.
- **Supuesto:** "viajes el pepe" es una cuenta de prueba. Se oculta por consulta y no se borra.

---

## 8. Reglas para el constructor

- Seguir el orden. No saltar las paradas.
- Nada fuera del alcance de la sección 1.
- Código simple y organizado. Sin abstracciones nuevas si un componente basta.
- Probar cada paso con su verificación antes de seguir.
- Responder en español.
