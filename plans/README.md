# Auditoría de movimiento y planes (v3 paso 9)

Commit auditado: `5a5d6dc`. Esfuerzo: estándar sobre todo el repositorio. Auditado con el catálogo de `improve-animations` (8 categorías). La auditoría y la revisión del código las hizo una sola pasada en esta sesión, sin subagentes.

## Recon

- **Stack:** Next.js 15, React 19, Tailwind 4. Sin librerías de animación (regla del blueprint). Todo es CSS: utilidades de transición de Tailwind y 2 `@keyframes` (`entrar`, `panel-asistente`) en `src/app/globals.css`.
- **Tokens:** `--ease-out`, `--ease-in-out`, `--duration-rapida` (150ms), `--duration-base` (200ms), `--duration-lenta` (320ms) y `--duration-entrada` (520ms), en `src/app/globals.css`.
- **Personalidad:** firme y sobria (Hierro). Movimiento corto, nada de rebotes.
- **Frecuencia:**
  - Muchas veces al día: botones, selector de día y hora, tarjetas con hover, campos de formulario, panel del dueño.
  - Ocasional: apertura del asistente, diálogo de cancelar, barra de pago móvil.
  - Rara: entrada de la landing y de login/registro.

## Hallazgos

| #   | Severidad | Categoría                   | Ubicación                                                                        | Hallazgo                                                                                                                                                                                  | Resumen del arreglo                                                                                                           |
| --- | --------- | --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | HIGH      | Rendimiento                 | `src/app/panel/tours/page.tsx:93`                                                | La perilla del interruptor usa `transition-all` y anima `left` (propiedad de layout)                                                                                                      | Mover con `transform: translateX` y transición solo de `transform`                                                            |
| 2   | MEDIUM    | Interrumpibilidad y origen  | `src/app/globals.css:130-143`, `AsistentePanel.tsx`                              | El panel del asistente entra con `@keyframes` (se reinician si se abre y se cierra rápido), no tiene salida y no nace desde el botón. En móvil es una hoja y no sube desde abajo          | Transiciones con `@starting-style`, origen en el botón, salida más corta que la entrada y hoja que sube con la curva de cajón |
| 3   | MEDIUM    | Física y accesibilidad      | `src/app/globals.css`, `ReservaForm.tsx:218`                                     | La barra de pago móvil queda fija encima de los campos cuando se abre el teclado                                                                                                          | Deslizarla fuera mientras un campo tiene el foco (transición de `transform`)                                                  |
| 4   | MEDIUM    | Coreografía y accesibilidad | `src/app/globals.css:97-117`, `src/app/panel/layout.tsx:24`                      | La entrada de la landing dura 730 ms (520 ms + 3 retrasos de 70 ms), pasa del tope de 600 ms. En movimiento reducido se apaga toda la entrada. El panel anima todo su contenido al cargar | Entrada de 400 ms con retrasos de 60 ms (580 ms), versión de solo opacidad en movimiento reducido y sin entrada en el panel   |
| 5   | MEDIUM    | Propósito y accesibilidad   | `src/components/publico/TourCard.tsx:29-36`, `src/app/[locale]/page.tsx:127-153` | Las tarjetas (se tocan decenas de veces al día) no tienen estado de press; el zoom de la foto dura 500 ms (límite de UI: 300 ms); la flecha se mueve en hover sin `motion-safe`           | Press `scale(0.98)`, zoom de 300 ms y flecha con `motion-safe`                                                                |
| 6   | LOW       | Accesibilidad               | `AsistentePanel.tsx:82`                                                          | Los puntos de "escribiendo" pulsan sin reposo con movimiento reducido                                                                                                                     | `motion-reduce:animate-none`                                                                                                  |
| 7   | LOW       | Oportunidad                 | `src/app/[locale]/reserva/gracias/page.tsx`                                      | El cambio de "Confirmando…" a "Tu reserva está confirmada" teletransporta                                                                                                                 | Entrada de opacidad en el bloque confirmado                                                                                   |

Despejado: botones (`scale(0.97)` con `ease-out` de 150 ms, bien), selector de día (los cambios de día no animan layout), hover solo en dispositivos con hover (Tailwind 4 lo aplica en `hover:`), sin `scale(0)`, sin `ease-in`.

## Oportunidades perdidas

1. La confirmación en `gracias` (hallazgo 7). No se ejecuta (LOW).
2. Nada más grounded: el resto de los cambios de estado ya son instantáneos y no resultan bruscos.

## Plan

| Plan                                         | Título                                                     | Severidad | Estado |
| -------------------------------------------- | ---------------------------------------------------------- | --------- | ------ |
| [001](001-interruptor-con-transform.md)      | Interruptor de tour sin `transition-all`                   | HIGH      | DONE   |
| [002](002-panel-asistente-transiciones.md)   | Panel del asistente: transiciones, origen, salida y hoja   | MEDIUM    | DONE   |
| [003](003-barra-de-pago-y-teclado.md)        | Barra de pago fuera de la vista con el teclado abierto     | MEDIUM    | DONE   |
| [004](004-entradas-y-movimiento-reducido.md) | Entrada de la landing en 580 ms y movimiento reducido      | MEDIUM    | DONE   |
| [005](005-tarjetas-press-y-hover.md)         | Tarjetas: press, zoom de 300 ms y flecha con `motion-safe` | MEDIUM    | DONE   |

Los hallazgos 6 y 7 (LOW) quedan sin plan, a pedido del blueprint (solo prioridad alta y media).

Orden de ejecución: 004 (tokens), 001, 005, 002, 003. Sin dependencias duras; 002 y 003 comparten `globals.css`.
