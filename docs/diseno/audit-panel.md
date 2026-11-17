# Audit del panel, login y registro (v3 paso 8)

Páginas: `/panel`, `/panel/reservas`, `/panel/tours`, `/panel/configuracion`, `/panel/tours/nuevo`, `/login` y `/registro`, a 375x812 y 1280x800, contra un build local con la base de prueba (dueño del seed). Fecha: 17-nov-2026.

Método: detector de impeccable sobre las fuentes (`src/app/panel`, `src/app/(auth)`, `src/components/panel`) y sobre las páginas ya renderizadas con sesión (`detect --cdp`); medición en el navegador de objetivos táctiles menores de 44 px, desborde horizontal, controles sin nombre accesible, cantidad de `h1` y título de la pestaña; revisión de capturas. Sin taste y sin cambiar la estructura de las pantallas.

## Puntaje de salud

| #   | Dimensión                       | Antes             | Después               | Hallazgo principal                                                                                                        |
| --- | ------------------------------- | ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Accesibilidad                   | 3                 | 4                     | Mismo título de pestaña en todas las páginas; objetivos táctiles chicos                                                   |
| 2   | Rendimiento                     | 3                 | 3                     | Sin hallazgos. Puntuado solo con el tamaño del build (panel entre 106 y 110 kB de JS inicial); no se midió con Lighthouse |
| 3   | Tokens                          | 4                 | 4                     | Sin colores fijos; el panel hereda los tokens de Hierro                                                                   |
| 4   | Responsive                      | 2                 | 4                     | Las acciones de la tabla de tours quedaban fuera de pantalla a 375                                                        |
| 5   | Integridad de la implementación | 3                 | 4                     | El panel lateral del login seguía con fondo oscuro y ondas, contra DESIGN.md                                              |
|     | **Total**                       | **15/20 (Bueno)** | **19/20 (Excelente)** |                                                                                                                           |

Veredicto de integridad: pasa. El panel y la autenticación usan los tokens de DESIGN.md sin componentes propios de color. El detector no marcó nada en fuentes ni en páginas renderizadas.

## Hallazgos y resolución

Severidad alta (P0 o P1): ninguna quedó abierta.

| Sev. | Hallazgo                                                                                                                                                 | Dónde                                                                        | Resolución                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P1   | A 375, la tabla de tours cortaba "Activo" y dejaba "Editar" y "Salidas" fuera de pantalla (había que desplazarse)                                        | `src/app/panel/tours/page.tsx`                                               | Precio y cupo pasan bajo el nombre en móvil, la etiqueta de estado se oculta (el interruptor la expresa) y las acciones se apilan |
| P2   | Todas las páginas del panel y de autenticación tenían el título "PuraReserva – Tours en Guanacaste" (WCAG 2.4.2)                                         | páginas del panel, `(auth)/login`, `(auth)/registro`                         | Título propio en cada una ("Resumen", "Reservas", "Tours"...)                                                                     |
| P2   | Objetivos táctiles menores de 44 px: enlace del logo (32 px), "Editar" (38 px de ancho), teléfono en la lista móvil (18 px), selector de archivo (42 px) | `Sidebar`, tours, reservas, `TourForm`, `ConfiguracionForm`, `(auth)/layout` | Altos y anchos mínimos de 44 px                                                                                                   |
| P2   | Panel lateral del login en fondo oscuro con ondas SVG, contra "carbón solo en header, hero, pie y parte alta del tour" y la regla de no usar ondas       | `src/app/(auth)/layout.tsx`                                                  | Superficie clara con borde, texto carbón y sin ondas                                                                              |
| P2   | Interruptor de tour apagado: riel de 1.4:1 contra la superficie (WCAG 1.4.11)                                                                            | `src/app/panel/tours/page.tsx`                                               | Riel con el borde de control (3:1)                                                                                                |
| P3   | Las pestañas móviles del panel cortaban "Configuración"                                                                                                  | `Sidebar`                                                                    | Texto de 14 px en móvil; caben las cuatro                                                                                         |
| P3   | El riel de la barra de ocupación casi no se distinguía del fondo                                                                                         | `OcupacionBar`                                                               | Anillo con el borde de control                                                                                                    |

## Verificación posterior

Con el build corregido, a 375 y 1280: 0 objetivos táctiles menores de 44 px (salvo enlaces dentro de una frase, que la WCAG 2.5.8 exime), 0 desbordes horizontales, 0 controles sin nombre, 1 `h1` por página, títulos distintos y 0 hallazgos del detector.

## Fuera de alcance de este paso

- Rendimiento del panel con Lighthouse con sesión: no medido.
- Reorganizar pantallas, nuevas funciones y cambios de lógica: no se tocaron.
