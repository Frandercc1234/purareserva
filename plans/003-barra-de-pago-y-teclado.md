# 003 — Barra de pago fuera de la vista con el teclado abierto

- **Status**: DONE
- **Commit**: 5a5d6dc
- **Severity**: MEDIUM
- **Category**: Física y accesibilidad
- **Estimated scope**: 1 archivo (`src/app/globals.css`)

## Problem

En móvil la barra de pago es fija abajo. Con el teclado abierto (el layout se reduce por `interactiveWidget: 'resizes-content'`) la barra se queda pegada encima del teclado y tapa el campo que se está escribiendo.

```tsx
// src/components/publico/ReservaForm.tsx:218 — current
<div
  id="barra-reserva"
  className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-borde bg-superficie px-4 py-3 lg:hidden"
>
```

## Target

La barra baja fuera de la vista mientras un campo del formulario tiene el foco **y** la ventana mide 600 px de alto o menos (teclado abierto). Si el teclado se cierra pero el campo conserva el foco, la altura vuelve y la barra reaparece. Solo `transform`, con la curva de salida:

```css
@media (max-width: 1023px) {
  #barra-reserva {
    transition: transform var(--duration-base) var(--ease-out);
  }
  body:has(#tarjeta-reserva :is(input, select, textarea):focus) #barra-reserva {
    transform: translateY(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  #barra-reserva {
    transition: opacity var(--duration-base) var(--ease-out);
  }
  body:has(#tarjeta-reserva :is(input, select, textarea):focus) #barra-reserva {
    transform: none;
    opacity: 0;
    pointer-events: none;
  }
}
```

## Repo conventions to follow

- Los selectores `body:has(#barra-reserva) …` ya viven en `globals.css` para ajustar el pie y el botón del asistente.

## Steps

1. Agregar el bloque Target a `src/app/globals.css`, junto a las reglas que ya usan `#barra-reserva`.

## Boundaries

- No cambiar `ReservaForm.tsx` ni la lógica del formulario.
- La barra no debe bloquear el envío: el botón del formulario sigue accesible al salir del campo.
- Si el código no coincide, detenerse y avisar.

## Verification

- **Mecánica**: `npx playwright test tests/e2e/reserva.spec.ts` en verde (mobile).
- **Feel check**: a 375, tocar un campo: la barra baja sin saltos en 200 ms; al salir del campo vuelve. Con `prefers-reduced-motion` se desvanece sin moverse. Probar en un teléfono real con el teclado.
- **Done when**: la barra no tapa el campo enfocado.
