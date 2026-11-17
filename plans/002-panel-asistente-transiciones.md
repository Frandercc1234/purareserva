# 002 — Panel del asistente: transiciones, origen, salida y hoja

- **Status**: DONE
- **Commit**: 5a5d6dc
- **Severity**: MEDIUM
- **Category**: Interrumpibilidad y origen
- **Estimated scope**: 2 archivos (`src/app/globals.css`, `src/components/asistente/AsistentePanel.tsx`)

## Problem

El panel entra con `@keyframes` (se reinician desde cero si se abre y se cierra rápido), no tiene animación de salida y no nace desde el botón. En móvil es una hoja inferior que aparece con un fundido de 8 px en vez de subir.

```css
/* src/app/globals.css:130-143 — current */
@keyframes panel-asistente {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.asistente-panel {
  animation: panel-asistente var(--duration-base) var(--ease-out) both;
}
@media (prefers-reduced-motion: reduce) {
  .asistente-panel {
    animation: none;
  }
}
```

El cierre es inmediato: `onClick={onCerrar}` en el telón, la X y los enlaces (`AsistentePanel.tsx:169,195`), y `onCerrar()` con Escape (`AsistentePanel.tsx:180`).

## Target

Tokens nuevos (en `@theme` de `src/app/globals.css`):

```css
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

Estilos (reemplazan los `@keyframes`):

```css
/* Transiciones: se pueden interrumpir y retoman desde el estado actual. */
.asistente-panel {
  transform-origin: bottom right;
  transition:
    transform var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
}
@starting-style {
  .asistente-panel {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
}
.asistente-panel[data-saliendo] {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
  transition-duration: var(--duration-rapida);
}
/* Móvil: hoja que sube desde abajo (curva de cajón) y sale más rápido. */
@media (max-width: 639px) {
  .asistente-panel {
    transform-origin: bottom center;
    transition:
      transform var(--duration-lenta) var(--ease-drawer),
      opacity var(--duration-base) var(--ease-out);
  }
  @starting-style {
    .asistente-panel {
      opacity: 1;
      transform: translateY(100%);
    }
  }
  .asistente-panel[data-saliendo] {
    opacity: 1;
    transform: translateY(100%);
    transition-duration: var(--duration-base);
  }
}
/* Telón del móvil: aparece y se va con la hoja. */
.asistente-telon {
  transition: opacity var(--duration-base) var(--ease-out);
}
@starting-style {
  .asistente-telon {
    opacity: 0;
  }
}
.asistente-telon[data-saliendo] {
  opacity: 0;
  transition-duration: var(--duration-rapida);
}
/* Movimiento reducido: solo opacidad, sin desplazamiento ni escala. */
@media (prefers-reduced-motion: reduce) {
  .asistente-panel,
  .asistente-panel[data-saliendo] {
    transform: none;
  }
  @starting-style {
    .asistente-panel {
      transform: none;
    }
  }
}
```

En `AsistentePanel.tsx`: un estado `saliendo`; una función `cerrar()` que, si hay animación, pone `data-saliendo` en el panel y en el telón y llama a `onCerrar()` a los 150 ms (sin animación con `prefers-reduced-motion`, llama de inmediato). Los clics en enlaces y tarjetas que navegan siguen llamando `onCerrar` directo (la página cambia).

## Repo conventions to follow

- Tokens de curvas y duraciones en `@theme` de `src/app/globals.css` (`--ease-out`, `--duration-base`).
- El panel ya depende de `esMovil` (`useEsMovil`) en `AsistentePanel.tsx`.

## Steps

1. Agregar `--ease-drawer` al `@theme`.
2. Reemplazar los `@keyframes panel-asistente` y la regla `.asistente-panel` de `globals.css` por el bloque Target.
3. Agregar la clase `asistente-telon` al telón del móvil en `AsistentePanel.tsx` y `data-saliendo` a ambos elementos cuando `saliendo` es verdadero.
4. Crear `cerrar()` y usarla en la X, el telón y Escape.
5. (Revisado en el paso 10b) En las páginas de tour el botón y el panel van siempre a la derecha: la tarjeta de reserva ocupa todo el ancho y el botón de pago queda en la columna izquierda.

## Boundaries

- No tocar la lógica del chat, el prompt ni las herramientas.
- No agregar dependencias. No cambiar el marcado más allá de los atributos indicados.
- Si el código no coincide, detenerse y avisar.

## Verification

- **Mecánica**: `npm run lint && npm run typecheck && npx playwright test tests/e2e/asistente.spec.ts` en verde.
- **Feel check**: abrir el asistente a 375 y a 1280. En móvil la hoja sube desde abajo en 320 ms y el telón se desvanece; en escritorio el panel crece desde el botón. Cerrarlo es más rápido que abrirlo. Abrir y cerrar varias veces seguidas no reinicia desde cero. Con `prefers-reduced-motion` solo cambia la opacidad.
- **Done when**: no queda `@keyframes panel-asistente`.
