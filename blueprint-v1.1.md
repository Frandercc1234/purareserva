# PuraReserva v1.1: mejoras

Complemento de `blueprint.md`. Se aplica sobre el proyecto ya construido (pasos 1 a 19 terminados). Todas las reglas de la sección 16 del blueprint original siguen vigentes.

Origen: revisión de la demo en producción (`purareserva.vercel.app`) en escritorio, en móvil a 375px y en inglés.

**Fuera de esta versión:** el asistente de IA. Se diseña en una versión posterior, con la v1.1 completa.

---

## Resumen de cambios

| # | Problema encontrado | Cambio | Paso |
|---|---|---|---|
| 1 | La landing no tiene ninguna imagen; el hero tiene la mitad derecha vacía y los operadores se muestran con una letra | Imagen en el hero y portada en cada tarjeta de operador | 4 |
| 2 | 28 salidas en una lista; el formulario empieza a ~1.850px (escritorio) y ~2.340px (móvil); la columna izquierda queda vacía al bajar | Selector por días, tarjeta fija en escritorio, barra de pago fija en móvil | 2 |
| 3 | Con el formulario vacío, "Elegí una salida" aparece lejos del botón y el foco no se mueve | Foco y scroll al primer error, resumen de errores junto al botón | 3 |
| 4 | "Registrar mi negocio" en el bloque verde tiene contraste bajo y parece deshabilitado | Variante de botón para fondos oscuros | 4 |
| 5 | La landing tiene 3 botones "Registrar mi negocio" y habla más al operador que al turista | Un solo bloque para operadores; el hero apunta al turista | 4 |
| 6 | "85,00 US$" es poco claro para turistas | `US$85` en español y `$85` en inglés; decimales solo si hacen falta | 5 |
| 7 | En móvil el header pierde el nombre y "Iniciar sesión" | Header móvil con logo, nombre, operador e idioma | 6 |
| 8 | "Catamarán al atardecer" sale a las 8:00 y 13:00 | Seed con horarios coherentes con cada tour | 1 |
| 9 | En inglés, el punto de encuentro sale en español | Campo `punto_encuentro_en` | 1 |
| 10 | La 404 es la de Next por defecto, en inglés y sin marca | 404 propia en ES y EN | 7 |
| 11 | Todas las páginas se titulan "PuraReserva"; sin imagen al compartir | Título, descripción, Open Graph y hreflang por página | 8 |
| 12 | Las imágenes de tours no tienen `alt` | `alt` con el nombre del tour en el idioma activo | 5 |
| 13 | Los campos no tienen `autocomplete` ni `required` | Atributos de autocompletado y validación nativa | 3 |
| 14 | El footer solo habla a operadores | Footer con idioma, enlaces para turistas, autor y repo | 6 |

---

## Pasos

Regla para todos los pasos con interfaz: al terminar, revisar con Playwright MCP a 375x812 y 1280x800, en `/es` y `/en`, sin errores en consola. Commit al terminar cada paso (`v1.1 paso N: …`).

### Paso 1. Datos: punto de encuentro en inglés y seed coherente (puntos 8 y 9)

- Crear `supabase/migrations/0002_punto_encuentro_en.sql`:
  ```sql
  alter table tours add column punto_encuentro_en text not null default '';
  ```
- Regenerar tipos: `supabase gen types typescript --local > src/types/database.ts`.
- `TourForm`: agregar el campo "Punto de encuentro" en la pestaña EN. Esquema Zod: opcional, máximo 200 caracteres.
- Parte pública: en `/en`, mostrar `punto_encuentro_en`; si está vacío, usar `punto_encuentro`.
- `supabase/seed.sql`: horarios coherentes con el nombre de cada tour (catamarán al atardecer: 16:30; snorkel: 8:00 y 10:30; el resto, según su tipo). Completar `punto_encuentro_en` en todos los tours.
- Aplicar en producción: `supabase db push`, y corregir los horarios de las salidas de demo en la base de producción con el mismo criterio.
- Aceptación: ningún tour de la demo tiene horarios que contradigan su nombre; en `/en` todos los puntos de encuentro salen en inglés.
- Verificar: `supabase db reset && npm run typecheck && npm run build` + Playwright MCP en un tour en `/en`.

### Paso 2. Selector de salidas y layout de reserva (punto 2)

- `SalidaPicker` se reemplaza por dos niveles:
  1. **Tira de días:** los próximos 14 días con salidas, mostrando 7 a la vez, con flechas anterior y siguiente. Cada día muestra el día de la semana, el número y un punto si tiene cupos. Los días sin salidas no aparecen. Se preselecciona el primer día con cupo.
  2. **Horarios del día elegido:** botones con hora y cupos libres. Los que no tienen cupo quedan deshabilitados con el texto "Agotado" / "Sold out".
- La salida elegida se guarda en la URL (`?salida=<id>`), para que recargar la página o compartir el enlace la conserve.
- Escritorio (≥1024px): la tarjeta de reserva (salida + datos + resumen + botón) queda en la columna derecha con `position: sticky; top: 6rem`. La columna izquierda (imagen, descripción, duración, punto de encuentro, política de cancelación) acompaña al bajar.
- Móvil (<1024px): barra fija abajo con el depósito a pagar y el botón "Reservar" / "Book". Si el formulario está incompleto, el botón hace scroll al formulario y enfoca el primer campo vacío. Si está completo, envía. La barra no tapa contenido: el `main` tiene `padding-bottom` igual a su altura.
- Aceptación: en escritorio, el formulario es visible sin scroll a 1280x800; en móvil, el botón de pago está siempre visible; no hay espacios vacíos grandes al bajar.
- Verificar: `npm run build` + `npx playwright test` (actualizar `reserva.spec.ts` para el nuevo selector) + Playwright MCP.

### Paso 3. Errores y campos del formulario (puntos 3 y 13)

- Al fallar la validación (cliente o servidor):
  - Mover el foco al primer campo con error y hacer scroll hasta él. Si el error es de salida, el foco va al selector de días.
  - Mostrar un resumen de errores encima del botón de pago, con `role="alert"`: "Revisá: salida, teléfono" / "Check: departure, phone".
- Atributos de los campos:
  - Nombre: `autocomplete="name"`, `required`, `minLength=2`.
  - Correo: `type="email"`, `autocomplete="email"`, `required`.
  - Teléfono: `type="tel"`, `autocomplete="tel"`, `inputMode="tel"`, `required`, placeholder `+506 8888 8888`.
  - Personas: `type="number"`, `min=1`, `max` = cupos libres de la salida elegida, `inputMode="numeric"`.
- La validación del servidor con Zod sigue siendo la fuente de verdad.
- Aceptación: enviar el formulario vacío lleva al usuario al selector de salida con el error visible; el autocompletado del navegador llena nombre, correo y teléfono.
- Verificar: `npm run build` + Playwright MCP (enviar vacío y revisar `document.activeElement`) + agregar el caso a `reserva.spec.ts`.

### Paso 4. Landing orientada al turista (puntos 1, 4 y 5)

- Imágenes:
  - Columna `portada_url text` en `negocios` (migración `0003_negocio_portada.sql`), editable en `/panel/configuracion` con la misma subida que la imagen de tours. Si está vacía, se usa la imagen del primer tour activo del negocio, y si no hay, `public/placeholder-tour.jpg`.
  - Hero: imagen a la derecha en escritorio (composición de 3 fotos de tours activos con bordes redondeados) y de fondo atenuado en móvil. Usar `next/image` con `priority` en la primera.
  - Tarjetas de operador: portada arriba (proporción 16:9), nombre, descripción y cantidad de tours.
- Llamados a la acción:
  - Hero: "Ver tours" (scroll a operadores) como botón principal. Se quita "Registrar mi negocio" del hero.
  - Para operadores queda solo el bloque "¿Tenés un tour en Guanacaste?" y el enlace "Soy operador" del header.
- Botón sobre fondo oscuro: nueva variante `Button variant="onDark"` (fondo blanco, texto `--color-primario-oscuro`, borde blanco). Usarla en el bloque de operadores. Contraste mínimo AA.
- Aceptación: la landing tiene imágenes en el hero y en cada operador; hay un solo bloque para operadores; ningún botón queda bajo el contraste AA.
- Verificar: `npm run build` + Playwright MCP + revisar contraste del bloque de operadores (ratio ≥ 4.5:1).

### Paso 5. Precios e imágenes accesibles (puntos 6 y 12)

- `lib/dinero.ts → formatearUSD(cents, locale)`:
  - `es`: `US$85` y `US$21,25`.
  - `en`: `$85` y `$21.25`.
  - Sin decimales si los centavos son 0.
- Actualizar `tests/unit/dinero.test.ts` con esos 4 casos y reemplazar en toda la app.
- Todas las imágenes de tours y portadas: `alt` = nombre en el idioma activo. Las decorativas: `alt=""`.
- Aceptación: ningún precio se ve como `85,00 US$`; ninguna imagen de contenido tiene `alt` vacío.
- Verificar: `npm run test && npm run build` + en el navegador: `[...document.querySelectorAll('img')].filter(i => !i.alt).length` es 0 en las páginas de negocio y tour.

### Paso 6. Header móvil y footer (puntos 7 y 14)

- Header a menos de 640px: logo + "PuraReserva" a la izquierda; a la derecha, "Soy operador" (texto corto) y un selector compacto "ES | EN". "Iniciar sesión" pasa al footer en móvil. Nada se superpone a 375px.
- Footer, en 3 columnas (1 en móvil):
  - PuraReserva: descripción de una línea y selector de idioma.
  - Turistas: "Ver tours", "Cómo funciona", "Política de cancelación" (ancla a "Cómo funciona").
  - Operadores: "Registrar mi negocio", "Iniciar sesión".
  - Línea final: "Proyecto de portafolio de Frander Centeno" con enlace a LinkedIn (`https://www.linkedin.com/in/frander-centeno-6a1982323`) y al repositorio. La URL del repo sale de `git remote get-url origin`. Ambas van como constantes en `src/lib/sitio.ts`.
- Todos los textos del header y del footer en `messages/es.json` y `messages/en.json`.
- Aceptación: a 375px se ven el logo, el nombre, "Soy operador" y el idioma; el footer tiene enlaces para turistas y operadores en ambos idiomas.
- Verificar: `npm run build` + Playwright MCP a 375 y 1280.

### Paso 7. Página 404 propia (punto 10)

- Crear `app/[locale]/not-found.tsx` con la marca, el mensaje "No encontramos esta página" / "We couldn't find this page" y los botones "Ver tours" e "Ir al inicio". Usa el header y el footer públicos.
- Crear `app/not-found.tsx` como respaldo para rutas fuera de `[locale]`: redirige a `/es` o muestra la misma página en español.
- Las páginas de negocio, tour y reserva que no existen llaman `notFound()` y muestran esta página.
- Aceptación: `/es/no-existe`, `/en/no-existe` y `/es/mar-y-sol-tamarindo/no-existe` muestran la 404 propia en su idioma, con estado HTTP 404.
- Verificar: `npm run build` + `curl -s -o /dev/null -w "%{http_code}" <url>/es/no-existe` devuelve 404 + Playwright MCP.

### Paso 8. Títulos, descripciones y Open Graph (punto 11)

- En el layout raíz: `metadataBase = new URL(NEXT_PUBLIC_SITE_URL)`, título por defecto "PuraReserva – Tours en Guanacaste" y plantilla `%s | PuraReserva`.
- `generateMetadata` en cada ruta pública:
  - Landing: "Tours en Guanacaste con depósito en línea" / "Guanacaste tours with online deposit".
  - Negocio: `<nombre del negocio>`, descripción del negocio, imagen de portada.
  - Tour: `<nombre del tour> – <negocio>`, primeros 155 caracteres de la descripción, precio en la descripción, imagen del tour.
  - Reserva: título genérico y `robots: { index: false }`.
- `alternates.languages` con `es` y `en` en cada página pública (hreflang).
- Imagen OG por defecto: `app/[locale]/opengraph-image.tsx` con `ImageResponse` de 1200x630 (logo, "Tours en Guanacaste" y fondo turquesa).
- Agregar `app/sitemap.ts` (landing, negocios y tours activos en los dos idiomas) y `app/robots.ts` (bloquea `/panel`, `/api` y `/reserva`).
- Aceptación: cada página tiene título propio; compartir el enlace de un tour muestra su foto, nombre y precio.
- Verificar: `npm run build` + `curl -s <url de un tour> | grep -E 'og:(title|image)'` muestra los valores del tour + abrir `/sitemap.xml`.

### Paso 9. Cierre

- Actualizar las pruebas e2e afectadas (selector de salidas, errores, 404, precios) y correr la suite completa.
- Deploy a producción y repetir la revisión con Playwright MCP sobre `purareserva.vercel.app`: landing, negocio, tour, error de formulario, 404 y `/en`, a 375 y 1280.
- Actualizar el README: capturas nuevas y una línea "v1.1: mejoras de experiencia, SEO y accesibilidad".
- Aceptación: los 14 puntos de la tabla resueltos en producción.
- Verificar: `npm run lint && npm run typecheck && npm run test && npx playwright test` en verde, y CI en verde en GitHub.

---

## Reglas

1. Seguir el orden. No pasar de paso sin su verificación.
2. No agregar funciones fuera de esta tabla. El asistente de IA queda para después.
3. Mantener la estructura de carpetas y los componentes existentes; extenderlos, no duplicarlos.
4. Todo texto nuevo, en `messages/es.json` y `messages/en.json`.
5. Al terminar cada paso, reportar en 2-3 líneas: qué cambió y cómo se verificó.
6. Responder en español.
