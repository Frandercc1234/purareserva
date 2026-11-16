# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Turistas, sobre todo de EE.UU., Canadá y Europa. Usan el teléfono y a veces ya están en Costa Rica. Reservan sin cuenta, en español o inglés.
- Dueños de operadoras pequeñas de Guanacaste que hoy reservan por WhatsApp y llevan los cupos en papel.

Tarea principal del turista: encontrar un tour, ver si hay cupo el día que quiere y pagar el depósito en menos de 2 minutos.

## Product Purpose

Plataforma de reservas de tours de operadores locales de Guanacaste, Costa Rica. El turista paga un depósito en línea y el resto en el lugar. El dueño ve su agenda, sus ingresos por depósitos y la ocupación de sus salidas. Es un proyecto de portafolio con calidad de producto: tiene que funcionar de punta a punta y poder mostrarse a un negocio real.

## Positioning

Reservas con cupo real y sin sobreventa para operadores pequeños, con depósito en línea y bilingüe de origen. Local y cálido, no un marketplace genérico ni una agencia de lujo.

## Capabilities and Constraints

- Reserva sin cuenta con retención de cupos por 30 minutos y depósito con Stripe Checkout (modo prueba).
- Cancelación por enlace secreto, con reembolso automático antes del límite del negocio.
- Asistente de IA (beta) para tours, playas, clima y transporte, sin lógica de pago propia.
- Panel del dueño: resumen, tours, salidas, reservas y configuración.
- Zona horaria America/Costa_Rica, moneda USD, idiomas es y en.
- Fuera de alcance de esta etapa: funciones nuevas, cambios de base de datos, rutas o lógica de reserva y pago.

## Brand Commitments

- Personalidad: local, cálida y confiable.
- Anti-referencias: plantillas SaaS (hero con onda, tres cifras, círculos numerados), estética de agencia de viajes con stock genérico de palmeras, degradados morados de IA.
- Texto: sin afirmaciones que no sean verdad. Nada de "miles de turistas", reseñas, premios ni testimonios.
- Fuentes por `next/font` y fotos con licencia gratuita (Unsplash o Pexels) de lugares reales de Guanacaste.

## Surface modes (definidos por el blueprint v3)

| Superficie | Modo |
|---|---|
| Inicio | Persuade |
| Negocio | Persuade |
| Tour (detalle y formulario) | Persuade arriba, Operate en el formulario |
| Reserva, gracias, cancelado | Operate |
| Asistente | Operate |
| Panel, login, registro | Operate |

## Evidence on Hand

- Dos negocios de demostración en producción (Aventuras Rincón, Mar y Sol Tamarindo) con tours y salidas de prueba.
- No hay reseñas, testimonios, cifras de clientes ni premios. No se deben inventar.

## Product Principles

1. Claridad antes que decoración en todo lo que toca reservar y pagar.
2. Honestidad: solo se afirma lo que es verdad hoy.
3. Móvil primero, bilingüe de verdad (es y en con el mismo cuidado).
4. Lo local se ve y se siente local: lugares reales de Guanacaste, voz propia.
5. Cada animación tiene un motivo y respeta a quien pide menos movimiento.

## Accessibility & Inclusion

Contraste AA en texto y botones, foco visible, objetivos táctiles de 44px como mínimo, `alt` en todas las fotos y respeto de `prefers-reduced-motion`.
