# Lighthouse móvil: `/es` (v3)

Mediciones locales contra `next start` (build de `diseno-v3`), perfil móvil de Lighthouse con la simulación de red de 4G lenta y CPU 4x, foto del hero en caché del optimizador de imágenes. Cada cifra es la mediana de 3 corridas. Fecha: 17-nov-2026.

**Objetivo del blueprint:** LCP menor de 2,5 s, CLS menor de 0,1 y Performance de 90 o más.

## Resultado

| Métrica                                 | Valor (mediana de 3)                      | Objetivo                       |
| --------------------------------------- | ----------------------------------------- | ------------------------------ |
| Performance                             | 93                                        | 90 o más (cumple)              |
| CLS                                     | 0                                         | menor de 0,1 (cumple)          |
| TBT                                     | 99 ms                                     |                                |
| **LCP simulado**                        | **3,06 s** (corridas: 2,76 / 3,06 / 3,16) | **menor de 2,5 s (no cumple)** |
| LCP real (sin simulación de red ni CPU) | 0,22 s                                    |                                |

El LCP simulado queda por encima del objetivo. El elemento LCP es la foto del hero (`img.object-cover` dentro de la primera sección, ya con `priority` y `fetchpriority="high"`).

## Desglose observado del LCP (sin simulación)

Tiempo hasta el primer byte 153 ms, retraso de carga del recurso 41 ms, descarga 26 ms y retraso de pintado 111 ms. La foto no tarda: lo que alarga el LCP simulado es el ancho de banda que comparten los demás recursos antes de pintarla.

## Qué pesa antes de pintar el hero

| Recurso                | Transferido          | Nota                                                                       |
| ---------------------- | -------------------- | -------------------------------------------------------------------------- |
| Documento HTML         | 20 KB                | 62 KB sin comprimir, con el payload de React Server Components             |
| JavaScript             | 142 KB en 11 scripts | unos 100 KB son React y Next; un chunk de 18 KB es el runtime de next-intl |
| Fuentes                | 49 KB (antes 91 KB)  | Hanken Grotesk 34 KB y Big Shoulders 15 KB                                 |
| Foto del hero a 375 px | 43 KB                | variante `w=750`, calidad 75                                               |
| CSS                    | 9 KB                 | bloquea el render (162 ms)                                                 |

## Experimentos (mediana o corrida única, LCP simulado)

| Corrida                                     | LCP                           |
| ------------------------------------------- | ----------------------------- |
| Base (fuentes variables, antes del recorte) | 3,04 s (3 corridas)           |
| Sin JS                                      | 2,45 s                        |
| Sin fuentes                                 | 2,44 s                        |
| Sin fuentes ni JS                           | 2,26 s                        |
| Sin las imágenes de las tarjetas            | sin mejora (dentro del ruido) |
| Sin el chunk de next-intl (18 KB)           | 2,82 s (3 corridas)           |
| Sin simulación (real)                       | 0,22 s                        |

El ruido entre corridas es de unos 0,2 s.

## Cambios hechos en esta iteración

1. **Fuentes estáticas:** Big Shoulders pasó de variable (57 KB, con eje de tamaño óptico) a un solo peso estático 800 (15 KB). Hanken ya era estático (pesos 400 y 600). Las fuentes bajaron de 91 KB a 49 KB. Como Big Shoulders quedó bajo 25 KB, no hizo falta `next/font/local` con subconjunto. `display: swap` no se tocó y el CLS sigue en 0. Visualmente el título queda algo más ancho que con la variable, y a 375 px sigue sin desbordar.
2. **JS:** el chunk de 18 KB es el runtime de next-intl (proveedor de cliente y navegación). Lo usan el selector de idioma del header, que está arriba del pliegue, y el proveedor del layout. Diferirlo exigiría reescribir el selector de idioma y mover el proveedor de next-intl a cada página con componentes de cliente, un cambio de estructura de i18n que no cabe en una iteración "sin cambiar comportamiento". Quitarlo del todo, que ya sería lo más que se puede, solo baja el LCP simulado a unos 2,8 s. No se difirió nada.
3. **Foto del hero:** sin cambios (calidad 75, `w=750`), por decisión de no bajar la calidad.

## Conclusión

Con las fuentes recortadas y sin posibilidad de diferir JS dentro del alcance, el LCP simulado se queda en unos 3,0 s. Ni quitando todo el JS (2,45 s) ni todas las fuentes (2,44 s) por separado se baja de 2,4 s en el modelo simulado; el LCP real es de 0,22 s. Para pasar de 2,5 s harían falta cambios de arquitectura (sacar next-intl del cliente y partir el bundle) que quedan fuera de este paso. Se sigue con el paso 10.

## Medición del paso 10 (inicio y tour, contra `next start` local)

Mediana de 3 corridas, perfil móvil, con las fuentes estáticas ya aplicadas. La vista previa de Vercel no se midió (está protegida): la medición sobre producción queda para el paso 11.

| Página                                    | Performance | Accesibilidad | Mejores prácticas | SEO | LCP simulado (corridas)     | CLS    | TBT    |
| ----------------------------------------- | ----------- | ------------- | ----------------- | --- | --------------------------- | ------ | ------ |
| Inicio `/es`                              | 95          | 100           | 100               | 100 | 2,88 s (3,07 / 2,88 / 2,84) | 0      | 56 ms  |
| Tour `/es/aventuras-rincon/canopy-rincon` | 90          | 100           | 100               | 100 | 3,04 s (3,18 / 2,65 / 3,04) | 0,0001 | 229 ms |

El elemento LCP es la foto de la parte alta en las dos páginas (`img.object-cover` de la sección en carbón). Performance, accesibilidad, mejores prácticas, SEO y CLS cumplen el blueprint. El LCP simulado queda sobre 2,5 s en ambas, por las razones y los experimentos de arriba (el LCP real, sin simulación, es de 0,22 s en inicio).

## Pendiente

- Medir Lighthouse sobre producción (`https://purareserva.vercel.app`, sin protección) en el paso 11, después del merge, y agregarlo aquí.
