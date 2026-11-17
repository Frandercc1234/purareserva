# 004 — Entrada de la landing en 580 ms y movimiento reducido

- **Status**: DONE
- **Commit**: 5a5d6dc
- **Severity**: MEDIUM
- **Category**: Coreografía y accesibilidad
- **Estimated scope**: 2 archivos (`src/app/globals.css`, `src/app/panel/layout.tsx`)

## Problem

La coreografía del hero dura 730 ms (520 ms de animación y hasta 3 × 70 ms de retraso), por encima del tope de 600 ms del blueprint. Con `prefers-reduced-motion` se apaga toda la entrada en vez de dejar solo opacidad. El panel del dueño anima su contenido al cargar, una zona de uso constante.

```css
/* src/app/globals.css — current */
--duration-entrada: 520ms;
.entrar {
  animation: entrar var(--duration-entrada) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@media (prefers-reduced-motion: reduce) {
  .entrar {
    animation: none;
  }
}
```

```tsx
// src/app/panel/layout.tsx:24 — current
<div className="entrar min-w-0 flex-1 px-4 py-6 md:p-10">{children}</div>
```

## Target

```css
--duration-entrada: 400ms;
.entrar {
  animation: entrar var(--duration-entrada) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 60ms);
}
@keyframes entrar-reducido {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .entrar {
    animation: entrar-reducido var(--duration-base) ease both;
    animation-delay: 0ms;
  }
}
```

Total: 400 ms + 3 × 60 ms = 580 ms. En el panel, quitar la clase `entrar` del contenedor.

## Repo conventions to follow

- Tokens `--duration-*` y `--ease-*` en `@theme`.

## Steps

1. En `globals.css`: `--duration-entrada: 400ms`, retraso de 60 ms, y reemplazar el bloque `prefers-reduced-motion` de `.entrar` por la versión de solo opacidad.
2. En `src/app/panel/layout.tsx`: quitar `entrar` del `div` del contenido.

## Boundaries

- No tocar `panel-asistente` (plan 002) ni otras reglas.
- No agregar animación por scroll.
- Si el código no coincide, detenerse y avisar.

## Verification

- **Mecánica**: `npm run lint && npm run typecheck`; `npx playwright test` en verde.
- **Feel check**: recargar `/es`: kicker, título, subtítulo y botón entran escalonados en menos de 600 ms. Con movimiento reducido solo hay un fundido corto. El panel carga sin entrada.
- **Done when**: `--duration-entrada` es 400ms y `/panel` no usa `entrar`.
