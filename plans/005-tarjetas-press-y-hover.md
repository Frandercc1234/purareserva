# 005 — Tarjetas: press, zoom de 300 ms y flecha con `motion-safe`

- **Status**: DONE
- **Commit**: 5a5d6dc
- **Severity**: MEDIUM
- **Category**: Propósito y accesibilidad
- **Estimated scope**: 2 archivos

## Problem

Las tarjetas de operador y de tour son enlaces que se tocan muchas veces, y no tienen estado de press. El zoom de la foto dura 500 ms (el límite de UI es 300 ms). La flecha de la tarjeta de operador se mueve en hover sin `motion-safe`.

```tsx
// src/components/publico/TourCard.tsx:29,36 — current
className =
  'group flex h-full flex-col … transition-[transform,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario motion-safe:hover:-translate-y-0.5';
className =
  'object-cover transition-transform duration-500 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]';
```

```tsx
// src/app/[locale]/page.tsx:130,137,153 — current
className =
  'group flex h-full flex-col … transition-[transform,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario motion-safe:hover:-translate-y-0.5';
className =
  'object-cover transition-transform duration-500 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]';
className =
  'ml-1 inline-block transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1';
```

## Target

- Tarjeta: agregar `motion-safe:active:scale-[0.98]` (más sutil que en botones por el tamaño).
- Zoom de la foto: `duration-300` en lugar de `duration-500`.
- Flecha: `motion-safe:group-hover:translate-x-1`.

## Repo conventions to follow

- Press en botones: `motion-safe:active:scale-[0.97]` en `src/components/ui/Button.tsx:6`.

## Steps

1. `TourCard.tsx`: añadir `motion-safe:active:scale-[0.98]` al enlace y cambiar `duration-500` por `duration-300` en la imagen.
2. `src/app/[locale]/page.tsx`: lo mismo en la tarjeta de operador, y `motion-safe:` en la flecha.

## Boundaries

- No cambiar marcado ni textos. No tocar otras transiciones.
- Si el código no coincide, detenerse y avisar.

## Verification

- **Mecánica**: `npm run lint && npm run typecheck`.
- **Feel check**: al presionar una tarjeta se hunde apenas (0.98); el zoom de la foto tarda 300 ms; con `prefers-reduced-motion` no hay zoom, ni lift, ni flecha, ni press.
- **Done when**: no queda `duration-500` en las tarjetas.
