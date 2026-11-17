# 001 — Interruptor de tour sin `transition-all`

- **Status**: DONE
- **Commit**: 5a5d6dc
- **Severity**: HIGH
- **Category**: Rendimiento
- **Estimated scope**: 1 archivo, 3 líneas

## Problem

La perilla anima todas las propiedades y mueve `left` (layout):

```tsx
// src/app/panel/tours/page.tsx:91-96 — current
<span
  className={cn(
    'absolute top-0.5 size-5 rounded-full bg-superficie shadow transition-all',
    t.activo ? 'left-[22px]' : 'left-0.5',
  )}
/>
```

## Target

```tsx
<span
  className={cn(
    'absolute top-0.5 left-0.5 size-5 rounded-full bg-superficie shadow transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
    t.activo && 'translate-x-[22px]',
  )}
/>
```

El riel (`transition-colors`) queda igual.

## Repo conventions to follow

- Curva y duración: `ease-[var(--ease-out)]` y `duration-150`, como en `src/components/ui/Button.tsx:6`.

## Steps

1. En `src/app/panel/tours/page.tsx`, reemplazar el `className` de la perilla por el del Target (`left-0.5` fijo, `translate-x-[22px]` cuando está activo).

## Boundaries

- No tocar el riel ni el botón `role="switch"`. No cambiar el marcado.
- No agregar dependencias.
- Si el código no coincide con el fragmento, detenerse y avisar.

## Verification

- **Mecánica**: `npm run lint && npm run typecheck` sin errores.
- **Feel check**: en `/panel/tours` alternar un tour; la perilla se desliza 22 px en 150 ms sin saltos. Con Animations al 10 % solo se anima `transform`. Con `prefers-reduced-motion` la perilla cambia sin deslizar.
- **Done when**: no queda `transition-all` en `src/`.
