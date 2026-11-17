# Crítica después (v3 paso 10)

Method: dual-agent (A: revisión de diseño sobre capturas y código · B: detector CLI y por URL). Fecha: 17-nov-2026. Superficies: inicio, tour y gracias (más negocio y asistente en las capturas). Capturas en `docs/capturas/v3-despues/`; las de antes, en `docs/capturas/v3-antes/`. Comparación contra `critica-antes.md`.

## Puntaje de salud de diseño

| Superficie        | Antes                 | Después                              | Cambio |
| ----------------- | --------------------- | ------------------------------------ | ------ |
| Inicio (Persuade) | 28/40                 | 30/40 (18/24, con 2 heurísticas n/a) | +2     |
| Tour              | 28/40                 | 28/40                                | 0      |
| Gracias (Operate) | 22/40                 | 30/40 (24/32, con 2 heurísticas n/a) | +8     |
| **Global**        | **26/40 (Aceptable)** | **29/40 (Bueno)**                    | **+3** |

| #   | Heurística              | Inicio | Tour | Gracias | Problema clave                                                  |
| --- | ----------------------- | ------ | ---- | ------- | --------------------------------------------------------------- |
| 1   | Estado del sistema      | 3      | 3    | 3       | La barra móvil muestra el depósito en vivo                      |
| 2   | Lenguaje real           | 3      | 3    | 3       | "Elegí un operador" sigue siendo vocabulario del lado oferta    |
| 3   | Control y libertad      | 3      | 3    | 3       | Gracias no vuelve al tour ni al inicio (solo el logo)           |
| 4   | Consistencia            | 3      | 3    | 3       | ES y EN con el mismo trato                                      |
| 5   | Prevención de errores   | n/a    | 3    | n/a     | Personas sigue siendo campo de texto                            |
| 6   | Reconocimiento          | 3      | 3    | 4       | Gracias repite todo lo que el turista necesita                  |
| 7   | Flexibilidad            | n/a    | 2    | n/a     | Sin stepper de personas; chips de día bajo 44 px                |
| 8   | Minimalismo             | 3      | 3    | 3       | Tour a 1280 deja la columna izquierda vacía bajo la descripción |
| 9   | Recuperación de errores | n/a    | 2    | 2       | Sin evidencia nueva                                             |
| 10  | Ayuda                   | n/a    | 3    | 3       | Falta "qué hago si no llega el correo"                          |

El tour no se movió: lo que lo arrastra (stepper de personas, teléfono, chips pequeños) quedó fuera de los pasos 1 a 9, que fueron un rediseño visual.

## Veredicto de especificidad

Ahora se siente propio de PuraReserva, con una salvedad (75% propio, antes 50/50).

- **Propio:** Big Shoulders 800 en mayúsculas con el contraste carbón y hueso; la costa a sangre con el bloque carbón y el filo de cuero; la voz ("Tours con el cupo a la vista", voseo, "El resto, en el lugar"); el tour como ficha (carbón arriba, hueso para operar); gracias como boleto; el pie honesto.
- **Intercambiable:** la grilla de tarjetas de operador, "Cómo funciona" en tres columnas, el bloque de operadores con tres líneas y el pie de tres columnas. Sin el logo, el tramo entre el hero y el pie podría ser de cualquier directorio de reservas.
- **Desaparecieron:** onda SVG, píldora, tres cifras, círculos numerados y checks en círculos.
- **Detector (B):** 0 hallazgos en las fuentes. Por URL (5 páginas), un único hallazgo repetido: `cream-palette` sobre el fondo hueso #F2EADB. Es una elección fijada por el dueño del proyecto, deliberada, no un defecto.

## Estado de los 5 problemas del ANTES

| #   | Problema                                 | Estado                  | Evidencia                                                                                                    |
| --- | ---------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Gracias no confirma lo reservado (P1)    | Resuelto                | Ahora muestra tour, fecha, personas, punto, total, depósito, saldo, aviso del correo y contacto del operador |
| 2   | El botón del asistente tapa el pago (P1) | Resuelto                | En el tour a 1280 el botón pasa a la izquierda; en 375 queda sobre la barra de pago                          |
| 3   | Inicio con patrón SaaS (P2)              | Resuelto, con remanente | Sin onda ni cifras; queda la composición en tres columnas                                                    |
| 4   | Hero de 1280 con la mitad vacía (P2)     | Resuelto                | Foto a sangre con el bloque encima; en 375, la foto arriba y el bloque debajo                                |
| 5   | Header ambiguo (P3)                      | Resuelto                | Idiomas con el mismo estilo; "Soy operador" discreto                                                         |

## Problemas restantes

1. **[P2] Chips de día y flechas del selector bajo 44 px** (unos 36 a 38 px de ancho). Fix: ancho mínimo de 44 px o dos filas en móvil, y flechas de 44 px. Comando: `adapt`. No se hizo: el selector es una pieza de lógica de reserva y el ancho disponible en la tarjeta no alcanza para 7 días de 44 px.
2. **[P2] Tour a 1280: unos 600 px de columna izquierda vacía** bajo la descripción. Fix: subir la política de cancelación y el punto de encuentro, o sumar una segunda foto. Comando: `layout`.
3. **[P2] Personas como campo de texto y el teléfono pide +506.** Fuera de alcance de esta etapa (cambia el formulario). Comando: `harden`.
4. **[P3] "Elegí un operador" es vocabulario del lado oferta.** Comando: `clarify`.
5. **[P3] El hero en 375 es bajo** (foto de unos 130 px). Comando: `layout`.
6. **[P3] Gracias sin salida clara al tour o al inicio.** Comando: `clarify`.
7. **[P3] Remanentes de SaaS en el medio del inicio** (tres columnas, tres líneas con filete). Comando: `bolder`.
8. **[P3] La foto del catamarán (del seed, `public/tours/catamaran.jpg`, no de Unsplash)** muestra una marca legible en la vela. Verificar su licencia o recortarla.

Corregido durante el QA: a 320 px el header corría 16 px fuera de pantalla (el documento medía 336 px); ahora el nombre del logo se oculta bajo 360 px y el documento mide 320 px.

## Gate de taste (inicio, negocio y tour, contra el build local)

El gate dejó 39 FAIL en inicio, 29 en negocio y 32 en tour. Casi todos son reglas estructurales que contradicen el DESIGN.md aprobado, que gana según la prioridad del blueprint: hero a una pantalla (`hero-screen`, `hero-fill`), una sección por pantalla (`one-section`, `section-height`), sin "momento" (`moment-none`), y los márgenes del contenedor (`container-edges`, que mide 208 contra 224 px entre la caja y su contenido). Los revisados uno a uno:

- **Real, corregido:** `off-viewport` a 320 px (el header). Verificado: documento de 320 px en inicio, negocio y tour.
- **Falso positivo:** `focus-visible` del selector de hora. El anillo de 2 px carbón está en el `label` (`has-[:focus-visible]`); el campo de radio es `sr-only`. Medido: `outline: solid 2px rgb(27, 20, 16)`.
- **Falso positivo:** `cut-text` de la barra de pago. Es una barra fija que vive dentro del DOM de la tarjeta de reserva.
- **Dato de demostración:** `phone-number` (el WhatsApp del seed).
- **Decisión de diseño:** `cta` en el tour y el negocio (el hero no tiene botón por regla de DESIGN.md: la acción vive en el formulario).

## Notas de ejecución

Evaluación dual con dos subagentes aislados. El subagente A trabajó sobre capturas y código, sin navegador en vivo, así que no pudo comprobar estados de error ni el comportamiento de los elementos `fixed`. Preguntas finales omitidas: el blueprint v3 define el orden y las paradas.
