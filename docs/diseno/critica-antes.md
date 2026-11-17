# Crítica antes (v3 paso 2)

Method: dual-agent (A: revisión de diseño sobre capturas y código · B: detector CLI y escaneo por URL). Fecha: 16-nov-2026. Superficies: inicio `/es`, tour `/es/aventuras-rincon/canopy-rincon`, gracias. Capturas en `docs/capturas/v3-antes/`.

## Puntaje de salud de diseño

| #   | Heurística              | Inicio (Persuade) | Tour      | Gracias           | Problema clave                                                                |
| --- | ----------------------- | ----------------- | --------- | ----------------- | ----------------------------------------------------------------------------- |
| 1   | Estado del sistema      | 3                 | 3         | 3                 |                                                                               |
| 2   | Lenguaje real           | 3                 | 3         | 3                 | "Operadores" como título para turistas es jerga del lado oferta               |
| 3   | Control y libertad      | 3                 | 3         | 2                 | Gracias sin salida al tour ni al negocio                                      |
| 4   | Consistencia            | 3                 | 3         | 3                 | "Español" activo es botón relleno y "English" es enlace: se lee como CTA      |
| 5   | Prevención de errores   | n/a               | 3         | n/a               |                                                                               |
| 6   | Reconocimiento          | 3                 | 3         | 1                 | Gracias no repite tour, fecha, hora, personas, depósito ni punto de encuentro |
| 7   | Flexibilidad            | n/a               | 2         | n/a               | Personas es campo de texto; el teléfono pide código de país a mano            |
| 8   | Minimalismo             | 2                 | 3         | 3                 | Hero, cifras, operadores, pasos y CTA pesan parecido                          |
| 9   | Recuperación de errores | n/a               | 2         | 2                 | Gracias "no confirmada": un párrafo y volver al inicio                        |
| 10  | Ayuda                   | n/a               | 3         | 1                 | Gracias sin contacto del negocio ni qué hacer si no llega el correo           |
|     | **Total**               | **17/24 (28/40)** | **28/40** | **18/32 (22/40)** | **Global 26/40: Aceptable**                                                   |

## Veredicto de especificidad

Mitad propio, mitad plantilla.

- **Propio:** fotos reales (canopy, catamarán), paleta turquesa y arena, SalidaPicker con puntos de disponibilidad, desglose Total / Depósito ahora / Saldo en el lugar, voseo.
- **Intercambiable:** hero con onda SVG, píldora "Guanacaste, Costa Rica", tres cifras, "Cómo funciona" con círculos numerados, CTA oscuro con checks en círculos, tarjetas de operador con flecha. La página Gracias es una Card genérica. Sin el logo, inicio y gracias podrían ser de cualquier plataforma. Casi todo el vocabulario SaaS que PRODUCT.md prohíbe está presente.
- **Detector (B):** 0 hallazgos en las fuentes TSX. En vivo: `overused-font` (Inter en el 100% del texto, en inicio y tour), `low-contrast` 4,2:1 contra 4,5:1 (#b45309 sobre #f8e9d3, número del paso 1 en "Cómo funciona"; puede pasar si el glifo califica como texto grande, verificar) y `straggler` ("papel." sola en la última línea del bloque oscuro; se arregla con `text-wrap: pretty`).

## Carga cognitiva

- Inicio, 1 fallo: jerarquía plana. Cuatro controles en el header antes de ver un tour.
- Tour, 2 fallos: a 1280 el botón flotante del asistente tapa "Pagar depósito"; fecha, hora, datos y personas en una sola tarjeta.
- Gracias, 1 fallo: no repite los datos de la reserva.

## Viaje emocional

El inicio arranca fuerte con foto y título y se enfría en cifras y pasos genéricos. En el tour el pico es la foto, el precio y el desglose, y el valle es el pago: el botón móvil dice "Reservar" y el de escritorio "Pagar depósito". Gracias es el final de máxima ansiedad con la respuesta más mínima: el peak-end queda plano.

## Lo que funciona

1. SalidaPicker: días con puntos de disponibilidad, horas con "12 cupos".
2. Desglose Total / Depósito / Saldo.
3. Fotos reales de Rincón de la Vieja y Tamarindo.

## Problemas prioritarios

1. **[P1] Gracias no confirma lo reservado.** Solo lee `estado`. Falta tour, fecha y hora, personas, depósito, saldo, punto de encuentro, aviso del correo y contacto del negocio. Fix: resumen tipo boleto. Comandos: `layout`, `clarify`. Nota de alcance: mostrar esos datos exige ampliar la consulta de lectura; no cambia reserva ni pago, pero se confirma en el paso 7.
2. **[P1] El botón del asistente tapa el pago.** A 1280 corta "Pagar depósito US$…"; en móvil flota sobre el texto de cancelación junto a la barra fija. Fix: botón compacto o reubicado en tour y reserva. Comando: `adapt`.
3. **[P2] Inicio con patrón SaaS.** Onda SVG, tres cifras, círculos numerados, checks en círculos. Fix: foto real a sangre, "cómo funciona" con otra composición, hechos como frases. Comandos: `bolder`, `layout`.
4. **[P2] Hero de 1280 con la mitad derecha vacía** (el collage de 3 fotos no aparece en la captura; puede ser el lazy o la animación de entrada; verificar en vivo, sube a P1 si es real). En 375 la foto atenuada al 85% casi desaparece. Comando: `harden`.
5. **[P3] Header.** "Español" relleno junto a "Soy operador" con contorno confunde roles. Fix: idiomas con el mismo estilo y "Soy operador" más discreto. Comando: `polish`.

## Personas

- **Casey (móvil):** la barra fija salta al formulario y el encabezado "Elegí tu salida" queda cortado. Personas debería ser un stepper. Lo accionable queda bajo la foto y los datos.
- **Jordan (primera vez):** "Operadores" y "Depósito" sin explicar, "Guardá el enlace" sin decir dónde, no se dice qué sigue tras pagar.
- **Turista de EE.UU., Canadá o Europa:** `/es` en español, selector de idioma ambiguo, placeholder +506 y "código de país" (esperan +1). Verificar `/en`.
- **Dueño de operadora:** el CTA promete "Cupos que no se venden dos veces" y la landing no muestra evidencia.

## Observaciones menores

- El enlace de regreso podría ser miga de pan.
- El resumen no muestra la salida elegida.
- El pie repite selector de idioma y enlaces del header.
- Gracias a 1280 tiene mucho aire vacío.
- La captura incluye "viajes el pepe" (0 tours), ya oculto desde el paso 1.
- Contraste del paso 1 de "Cómo funciona" y palabra suelta "papel.": ver detector.

## Preguntas para la dirección de arte

- ¿Sin el logo, alguien distinguiría este inicio del de cualquier SaaS?
- ¿Qué haría que solo pudiera ser Guanacaste?
- ¿Un hero de una frase y la foto del tour más fotogénico, sin cifras ni onda?
- ¿Gracias podría ser el recibo que el turista le muestra al guía?
- ¿El asistente flotante tiene que estar en la pantalla de pago?
- ¿El turista busca "operadores" o tours, playas y actividades?

## Notas de ejecución

Detector CLI corrido sobre fuentes y por URL. Sin overlay ni servidor en vivo (no hizo falta, el escaneo por URL devolvió la evidencia). Assessment A sin navegador en vivo: capturas y código. Preguntas finales omitidas: el blueprint v3 define el orden y las paradas.
