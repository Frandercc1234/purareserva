# PuraReserva: blueprint

Plano autocontenido. Quien lo lea tiene todo lo necesario para construir el proyecto sin hacer preguntas.

---

## 0. Antes de empezar

**Herramientas del constructor (Claude Code):**

| Herramienta | Para qué | Cómo se usa en este proyecto |
|---|---|---|
| Plugin de Figma (MCP oficial de Figma) | Diseñar el sistema visual y las pantallas antes de codear, y luego implementar desde el diseño | Paso 5 (diseño) y pasos 6-15 (implementar cada pantalla con su contexto de diseño) |
| Playwright MCP (`claude mcp add playwright npx @playwright/mcp@latest`) | Abrir la app en un navegador real, revisar pantallas y flujos | Al cerrar cada paso con interfaz: revisar a 375x812 y 1280x800 |
| `@playwright/test` | Pruebas end-to-end automatizadas | Paso 16 y CI |
| Supabase CLI | Base local con Docker, migraciones | Desde el paso 2 |
| Stripe CLI | Reenviar webhooks a local y disparar eventos de prueba | Pasos 11-14 |

Si el plugin de Figma no está disponible o no hay cuenta conectada, el paso 5 se reemplaza por la especificación de la sección 10 y se avisa al usuario. El resto del plan no cambia.

**Cuentas necesarias (todas gratis o en modo prueba):** Supabase, Stripe (modo prueba), Resend, Vercel, GitHub, Figma.

---

## 1. Resumen

PuraReserva es una plataforma de reservas para tour operadores de Guanacaste, Costa Rica. Cada negocio se registra, publica sus tours y programa salidas con cupo. Los turistas reservan sin crear cuenta, en español o inglés, y pagan un depósito online. El resto se paga en el lugar. El dueño ve su agenda, sus ingresos por depósitos y la ocupación de sus salidas.

Problema que resuelve: muchos operadores pequeños reservan por WhatsApp y llevan los cupos en papel. Eso genera sobreventa, reservas sin pagar que nunca llegan y cero visibilidad de cuánto venden.

Es un proyecto de portafolio con calidad de producto: tiene que funcionar de punta a punta en modo prueba y poder mostrarse a un negocio real.

---

## 2. Alcance

**MVP (dentro):**
1. Registro e inicio de sesión del dueño. El registro crea su negocio con una URL propia (`/es/<slug>`).
2. Configuración del negocio: nombre, descripción ES/EN, WhatsApp, correo de contacto, % de depósito y horas límite para cancelar con reembolso.
3. CRUD de tours: textos ES/EN, precio en USD por persona, duración, cupo por defecto, punto de encuentro, imagen y activo o inactivo.
4. Salidas: crear una por una o en lote (rango de fechas + días de la semana + hora).
5. Parte pública bilingüe: listado de negocios, página del negocio, detalle del tour con las salidas disponibles y formulario de reserva.
6. Reserva sin cuenta con retención de cupos por 30 minutos y pago del depósito con Stripe Checkout.
7. Confirmación por webhook de Stripe y correo de confirmación al turista (en su idioma) y al negocio.
8. Página de la reserva por enlace secreto: ver los datos y cancelar. Si se cancela antes del límite, el depósito se reembolsa automáticamente.
9. Panel del dueño: resumen (ingresos del mes, ocupación de los próximos 30 días, próximas salidas), reservas con filtros y botón de WhatsApp del negocio en la parte pública.

**Fuera de alcance (no construir):** Stripe Connect (pagos directos a cada negocio), empleados o múltiples usuarios por negocio, recordatorios automáticos, cancelación de salidas por el dueño, reseñas, cupones, otras monedas, API de WhatsApp, app móvil nativa, panel de superadministrador.

---

## 3. Usuarios y roles

| Rol | Cómo se identifica | Puede |
|---|---|---|
| Visitante o turista | Sin sesión | Ver negocios activos, tours activos y salidas futuras programadas. Crear una reserva. Ver y cancelar su reserva con el enlace secreto. |
| Dueño | Sesión de Supabase Auth (email + contraseña) | Todo sobre su propio negocio: configuración, tours, salidas, reservas y resumen. Nada sobre otros negocios. |
| Sistema | Service role, solo en el servidor | Crear reservas, confirmar o expirar pagos, cancelar y reembolsar, registrar eventos de Stripe. |

Un usuario tiene como máximo un negocio (restricción `unique` en `negocios.owner_id`).

---

## 4. Stack

| Tecnología | Versión mínima | Por qué |
|---|---|---|
| Node.js | 20 LTS | Requisito de Next.js 15 |
| Next.js (App Router) + React | 15 / 19 | Una sola app para la parte pública y el panel. Server Actions para la lógica |
| TypeScript | 5.6 | Tipos de punta a punta, también los generados desde Supabase |
| Tailwind CSS | 4 | Estilos consistentes y responsive sin CSS suelto |
| Supabase (Postgres 15, Auth, Storage) | `@supabase/supabase-js` 2, `@supabase/ssr` 0.5 | Base, autenticación, RLS e imágenes de tours |
| next-intl | 3.26 | Rutas `/es` y `/en` y textos traducidos |
| Stripe | `stripe` 17 | Checkout del depósito, webhooks y reembolsos |
| Resend | `resend` 4 | Correos transaccionales |
| Zod | 3.23 | Validación de todos los formularios y entradas del servidor |
| Vitest | 2 | Pruebas unitarias de la lógica pura |
| Playwright | `@playwright/test` 1.48 | Pruebas end-to-end y revisión visual |
| GitHub Actions | - | CI: lint, tipos, unitarias, build y e2e |
| Vercel | - | Deploy de la app |

No usar: NestJS, Prisma, Redux ni librerías de componentes completas (MUI, Chakra). Los componentes se hacen con Tailwind.

---

## 5. Estructura de carpetas

```
purareserva/
  .github/workflows/ci.yml          CI: lint, typecheck, vitest, build, playwright
  messages/
    es.json                         textos públicos en español
    en.json                         textos públicos en inglés
  public/                           logo, favicon, imagen por defecto de tours
  src/
    app/
      [locale]/                     parte pública bilingüe
        layout.tsx                  proveedor de next-intl, header y footer públicos
        page.tsx                    landing: qué es y listado de negocios activos
        [negocio]/
          page.tsx                  página del negocio y sus tours activos
          [tour]/
            page.tsx                detalle del tour, salidas disponibles y formulario
            actions.ts              Server Action crearReserva
        reserva/
          [token]/
            page.tsx                estado de la reserva y botón cancelar
            actions.ts              Server Action cancelarReserva
          gracias/page.tsx          vuelta desde Stripe con éxito
          cancelado/page.tsx        vuelta desde Stripe sin pagar
      (auth)/
        login/page.tsx              inicio de sesión del dueño
        registro/page.tsx           alta de usuario y negocio
        actions.ts                  login, registro, logout
      panel/                        solo dueños con sesión, en español
        layout.tsx                  verifica sesión y negocio; sidebar
        page.tsx                    resumen: ingresos, ocupación, próximas salidas
        tours/
          page.tsx                  lista de tours
          nuevo/page.tsx            crear tour
          [id]/page.tsx             editar tour
          [id]/salidas/page.tsx     salidas del tour: crear una o en lote
          actions.ts                CRUD de tours y salidas
        reservas/page.tsx           lista de reservas con filtros
        configuracion/
          page.tsx                  datos del negocio y políticas
          actions.ts                actualizar negocio
      api/
        stripe/webhook/route.ts     webhook de Stripe
      layout.tsx                    html raíz y fuente
      globals.css                   Tailwind y variables de tema
    components/
      ui/                           Button, Input, Select, Textarea, Card, Badge, Dialog, Table, EmptyState, Spinner
      publico/                      TourCard, SalidaPicker, ReservaForm, LocaleSwitcher, WhatsAppButton
      panel/                        Sidebar, KpiCard, OcupacionBar, TourForm, SalidasLoteForm, ReservasTable
    lib/
      supabase/
        server.ts                   cliente con cookies, para Server Components y Actions
        client.ts                   cliente del navegador
        admin.ts                    cliente service role (solo servidor)
        middleware.ts               refresco de sesión
      stripe.ts                     instancia de Stripe y helpers de Checkout y reembolso
      email.ts                      envío con Resend y plantillas ES/EN
      tokens.ts                     generar token y su hash SHA-256
      dinero.ts                     centavos <-> texto en USD
      cancelacion.ts                política: ¿corresponde reembolso?
      salidas.ts                    generar fechas para salidas en lote
      validaciones.ts               esquemas Zod
      fechas.ts                     formateo en zona America/Costa_Rica
    i18n/
      routing.ts                    locales es y en, por defecto es
      request.ts                    carga de mensajes
    types/database.ts               tipos generados por Supabase CLI
    middleware.ts                   next-intl para rutas públicas + sesión de Supabase
  supabase/
    config.toml
    migrations/0001_init.sql        esquema, funciones y RLS
    seed.sql                        2 negocios, 4 tours y salidas de prueba
  tests/
    unit/                           vitest: cancelacion, salidas, dinero, tokens, validaciones
    e2e/                            playwright: reserva, cancelación, panel, aislamiento
  playwright.config.ts
  vitest.config.ts
  .env.example
  README.md
```

---

## 6. Modelo de datos

Dinero siempre en centavos de USD (`integer`). Fechas en `timestamptz`; se muestran en `America/Costa_Rica`.

```sql
-- supabase/migrations/0001_init.sql

create extension if not exists pgcrypto;

create type estado_salida  as enum ('programada', 'cancelada');
create type estado_reserva as enum ('pendiente_pago', 'confirmada', 'cancelada', 'reembolsada', 'expirada');
create type idioma         as enum ('es', 'en');

create table negocios (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null unique references auth.users(id) on delete cascade,
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  nombre             text not null check (length(nombre) between 2 and 80),
  descripcion_es     text not null default '',
  descripcion_en     text not null default '',
  email_contacto     text not null,
  whatsapp           text check (whatsapp ~ '^\+?[0-9]{8,15}$'),
  deposito_pct       integer not null default 30 check (deposito_pct between 10 and 100),
  horas_cancelacion  integer not null default 24 check (horas_cancelacion between 0 and 168),
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);

create table tours (
  id               uuid primary key default gen_random_uuid(),
  negocio_id       uuid not null references negocios(id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre_es        text not null check (length(nombre_es) between 2 and 100),
  nombre_en        text not null check (length(nombre_en) between 2 and 100),
  descripcion_es   text not null default '',
  descripcion_en   text not null default '',
  precio_cents     integer not null check (precio_cents between 100 and 1000000),
  duracion_min     integer not null check (duracion_min between 15 and 1440),
  cupo_default     integer not null check (cupo_default between 1 and 200),
  punto_encuentro  text not null default '',
  imagen_url       text,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  unique (negocio_id, slug)
);
create index tours_negocio_idx on tours(negocio_id);

create table salidas (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid not null references tours(id) on delete restrict,
  negocio_id  uuid not null references negocios(id) on delete cascade,  -- desnormalizado para RLS
  inicia_en   timestamptz not null,
  cupo        integer not null check (cupo between 1 and 200),
  estado      estado_salida not null default 'programada',
  creado_en   timestamptz not null default now(),
  unique (tour_id, inicia_en)
);
create index salidas_tour_fecha_idx on salidas(tour_id, inicia_en);
create index salidas_negocio_fecha_idx on salidas(negocio_id, inicia_en);

create table reservas (
  id                     uuid primary key default gen_random_uuid(),
  salida_id              uuid not null references salidas(id) on delete restrict,
  negocio_id             uuid not null references negocios(id) on delete cascade,
  nombre                 text not null check (length(nombre) between 2 and 100),
  email                  text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefono               text not null check (telefono ~ '^\+?[0-9 ]{8,20}$'),
  personas               integer not null check (personas between 1 and 50),
  idioma                 idioma not null default 'es',
  total_cents            integer not null check (total_cents >= 0),
  deposito_cents         integer not null check (deposito_cents >= 0),
  estado                 estado_reserva not null default 'pendiente_pago',
  token_hash             text not null unique,
  expira_en              timestamptz not null,
  stripe_session_id      text unique,
  stripe_payment_intent  text,
  confirmada_en          timestamptz,
  cancelada_en           timestamptz,
  creado_en              timestamptz not null default now()
);
create index reservas_salida_idx on reservas(salida_id, estado);
create index reservas_negocio_idx on reservas(negocio_id, creado_en desc);

-- Idempotencia del webhook: cada evento de Stripe se procesa una sola vez
create table eventos_stripe (
  id            text primary key,          -- event.id de Stripe
  tipo          text not null,
  procesado_en  timestamptz not null default now()
);

-- Cupos ocupados: confirmadas + pendientes que no vencieron
create or replace function cupos_disponibles(p_salida_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select s.cupo - coalesce((
    select sum(r.personas)::int from reservas r
    where r.salida_id = s.id
      and (r.estado = 'confirmada' or (r.estado = 'pendiente_pago' and r.expira_en > now()))
  ), 0)
  from salidas s where s.id = p_salida_id;
$$;

-- Crea la reserva sin sobreventa: bloquea la salida mientras cuenta
create or replace function crear_reserva(
  p_salida_id uuid, p_nombre text, p_email text, p_telefono text,
  p_personas integer, p_idioma idioma, p_token_hash text
) returns reservas language plpgsql security definer set search_path = public as $$
declare
  v_salida salidas;
  v_tour tours;
  v_negocio negocios;
  v_disponibles integer;
  v_total integer;
  v_reserva reservas;
begin
  select * into v_salida from salidas where id = p_salida_id for update;
  if not found then raise exception 'SALIDA_NO_EXISTE'; end if;
  if v_salida.estado <> 'programada' or v_salida.inicia_en <= now() + interval '1 hour' then
    raise exception 'SALIDA_NO_DISPONIBLE';
  end if;

  select * into v_tour from tours where id = v_salida.tour_id;
  select * into v_negocio from negocios where id = v_salida.negocio_id;
  if not v_tour.activo or not v_negocio.activo then raise exception 'SALIDA_NO_DISPONIBLE'; end if;

  v_disponibles := cupos_disponibles(p_salida_id);
  if p_personas > v_disponibles then raise exception 'SIN_CUPO'; end if;

  v_total := v_tour.precio_cents * p_personas;

  insert into reservas (salida_id, negocio_id, nombre, email, telefono, personas, idioma,
                        total_cents, deposito_cents, token_hash, expira_en)
  values (p_salida_id, v_salida.negocio_id, p_nombre, lower(p_email), p_telefono, p_personas, p_idioma,
          v_total, round(v_total * v_negocio.deposito_pct / 100.0)::int, p_token_hash,
          now() + interval '30 minutes')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

-- Solo el servidor (service role) puede llamar estas funciones
revoke execute on function crear_reserva(uuid, text, text, text, integer, idioma, text) from public, anon, authenticated;
grant execute on function cupos_disponibles(uuid) to anon, authenticated;

-- Crea el negocio al registrarse (lo llama la Server Action de registro con el usuario autenticado)
create or replace function crear_negocio(p_slug text, p_nombre text, p_email text)
returns negocios language sql security invoker set search_path = public as $$
  insert into negocios (owner_id, slug, nombre, email_contacto)
  values (auth.uid(), p_slug, p_nombre, p_email) returning *;
$$;
```

**Vista para el panel (ocupación de salidas):**

```sql
create or replace view salidas_ocupacion with (security_invoker = true) as
select s.*, t.nombre_es as tour_nombre,
       s.cupo - cupos_disponibles(s.id) as ocupados
from salidas s join tours t on t.id = s.tour_id;
```

**Storage:** bucket público `tours` para imágenes. Ruta: `<negocio_id>/<tour_id>.<ext>`. Máximo 2 MB, solo `image/jpeg`, `image/png` o `image/webp`.

---

## 7. Seguridad

**Autenticación**
- Dueños: Supabase Auth con email y contraseña (mínimo 8 caracteres). En local, confirmación de email desactivada. En producción, activada.
- Turistas: sin cuenta. Al reservar se genera un token de 32 bytes aleatorios (`crypto.randomBytes(32).toString('base64url')`). El turista recibe el token en su enlace y la base solo guarda su SHA-256 en `token_hash`. Para buscar la reserva se hashea el token recibido.
- `middleware.ts` refresca la sesión de Supabase en todas las rutas y redirige `/panel/*` a `/login` si no hay sesión.
- `panel/layout.tsx` vuelve a verificar la sesión en el servidor y que el usuario tenga negocio. Si no tiene, redirige a `/registro`.

**RLS (activar en las 5 tablas)**

```sql
alter table negocios enable row level security;
alter table tours enable row level security;
alter table salidas enable row level security;
alter table reservas enable row level security;
alter table eventos_stripe enable row level security;

-- negocios
create policy negocios_publico on negocios for select to anon, authenticated using (activo);
create policy negocios_dueno_select on negocios for select to authenticated using (owner_id = auth.uid());
create policy negocios_dueno_insert on negocios for insert to authenticated with check (owner_id = auth.uid());
create policy negocios_dueno_update on negocios for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- tours
create policy tours_publico on tours for select to anon, authenticated
  using (activo and exists (select 1 from negocios n where n.id = negocio_id and n.activo));
create policy tours_dueno on tours for all to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()))
  with check (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()));

-- salidas
create policy salidas_publico on salidas for select to anon, authenticated
  using (estado = 'programada' and inicia_en > now());
create policy salidas_dueno on salidas for all to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()))
  with check (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid())
              and exists (select 1 from tours t where t.id = tour_id and t.negocio_id = salidas.negocio_id));

-- reservas: el público no lee ni escribe; el dueño solo lee las suyas
create policy reservas_dueno_select on reservas for select to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()));

-- eventos_stripe: sin políticas = solo service role
```

```sql
-- storage: el dueño sube solo a su carpeta
create policy tours_img_publico on storage.objects for select using (bucket_id = 'tours');
create policy tours_img_dueno on storage.objects for insert to authenticated
  with check (bucket_id = 'tours' and (storage.foldername(name))[1] in
    (select id::text from negocios where owner_id = auth.uid()));
create policy tours_img_dueno_upd on storage.objects for update to authenticated
  using (bucket_id = 'tours' and (storage.foldername(name))[1] in
    (select id::text from negocios where owner_id = auth.uid()));
```

**Service role:** `lib/supabase/admin.ts` usa `SUPABASE_SERVICE_ROLE_KEY` y empieza con `import 'server-only'`. Se usa solo en: `crearReserva`, `cancelarReserva`, el webhook y la página `/reserva/[token]`.

**Validación de entradas:** toda Server Action valida con Zod antes de tocar la base. Los errores vuelven como `{ ok: false, error: '<CODIGO>' }` y la interfaz los traduce. Nunca se confía en precios, depósitos ni negocio_id que vengan del cliente: se calculan en la base.

**Webhook:** se verifica la firma con `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`. Sin firma válida responde 400.

---

## 8. API y lógica

Todas las Server Actions devuelven `{ ok: true, data } | { ok: false, error: CodigoError }`.
Códigos: `VALIDACION`, `NO_AUTORIZADO`, `SLUG_EN_USO`, `SALIDA_NO_EXISTE`, `SALIDA_NO_DISPONIBLE`, `SIN_CUPO`, `RESERVA_NO_EXISTE`, `NO_CANCELABLE`, `STRIPE_ERROR`, `DESCONOCIDO`.

### Auth (`app/(auth)/actions.ts`)

| Acción | Entrada | Hace | Salida |
|---|---|---|---|
| `registrar` | email, password, nombreNegocio, slug | `auth.signUp`, luego `rpc('crear_negocio')` con la sesión nueva | redirect `/panel` o `SLUG_EN_USO` / `VALIDACION` |
| `iniciarSesion` | email, password | `auth.signInWithPassword` | redirect `/panel` o error |
| `cerrarSesion` | - | `auth.signOut` | redirect `/login` |

### Panel

| Acción | Entrada | Hace |
|---|---|---|
| `actualizarNegocio` | nombre, descripciones ES/EN, email_contacto, whatsapp, deposito_pct, horas_cancelacion, activo | update con cliente de usuario (RLS) |
| `guardarTour` | id opcional, campos del tour, imagen opcional | upsert; si hay imagen, sube a Storage y guarda la URL pública. Slug generado del nombre_es, único por negocio |
| `cambiarEstadoTour` | id, activo | update |
| `crearSalida` | tour_id, fecha (YYYY-MM-DD), hora (HH:mm), cupo | inserta con `inicia_en` en hora de Costa Rica (UTC-6) |
| `crearSalidasLote` | tour_id, desde, hasta, dias (0-6), hora, cupo | `lib/salidas.ts` genera fechas (máx. 90 días y 200 salidas); inserta ignorando duplicados (`on conflict do nothing`); devuelve cuántas creó |
| `eliminarSalida` | id | solo si no tiene reservas confirmadas o pendientes vigentes; si no, `NO_CANCELABLE` |

### Reserva pública

**`crearReserva`** (`app/[locale]/[negocio]/[tour]/actions.ts`)
1. Valida con Zod: salida_id (uuid), nombre (2-100), email, telefono (8-20 dígitos con `+` opcional), personas (1-50), idioma (`es` o `en`).
2. Genera el token y su hash (`lib/tokens.ts`).
3. `admin.rpc('crear_reserva', …)`. Traduce `SIN_CUPO`, `SALIDA_NO_DISPONIBLE` y `SALIDA_NO_EXISTE`.
4. Crea la sesión de Stripe Checkout:
   - `mode: 'payment'`, `currency: 'usd'`, una línea "Depósito – <nombre del tour> – <fecha>" con `unit_amount = deposito_cents` y `quantity = 1`.
   - `customer_email`, `locale` = idioma, `expires_at = ahora + 30 min`.
   - `metadata: { reserva_id, negocio_id }`.
   - `success_url = SITE_URL/<locale>/reserva/gracias?t=<token>` y `cancel_url = SITE_URL/<locale>/reserva/cancelado?t=<token>`.
5. Guarda `stripe_session_id` en la reserva.
6. `redirect(session.url)`.

Si Stripe falla después de crear la reserva, se marca `expirada` y se devuelve `STRIPE_ERROR`.

**Webhook** (`app/api/stripe/webhook/route.ts`, `runtime = 'nodejs'`)
1. Verifica la firma. Inserta `event.id` en `eventos_stripe`. Si ya existía (conflicto), responde 200 sin hacer nada.
2. `checkout.session.completed`: busca la reserva por `metadata.reserva_id`. Si está en `pendiente_pago`, la pasa a `confirmada` y guarda `confirmada_en` y `stripe_payment_intent`. Envía los correos (paso 13).
3. `checkout.session.expired`: si sigue `pendiente_pago`, la pasa a `expirada`.
4. Otros eventos: 200 sin acción.
5. Errores internos: 500, para que Stripe reintente.

**`cancelarReserva`** (`app/[locale]/reserva/[token]/actions.ts`)
1. Hashea el token y busca la reserva con su salida y negocio (admin).
2. Si no está `confirmada` → `NO_CANCELABLE`.
3. `lib/cancelacion.ts → evaluarCancelacion(iniciaEn, horasLimite, ahora)` devuelve `{ reembolso: boolean }`. Hay reembolso si `ahora <= iniciaEn - horasLimite`.
4. Con reembolso: `stripe.refunds.create({ payment_intent })` → estado `reembolsada`. Sin reembolso: estado `cancelada`. En ambos casos se guarda `cancelada_en`.
5. Envía un correo de cancelación al turista y al negocio.

### Consultas del panel (Server Components, cliente de usuario con RLS)

- **Ingresos del mes:** `sum(deposito_cents)` de reservas `confirmada` con `confirmada_en` en el mes actual (hora de Costa Rica).
- **Reservas del mes:** cantidad de reservas confirmadas y cantidad de personas.
- **Ocupación próximos 30 días:** por tour, `sum(ocupados) / sum(cupo)` desde `salidas_ocupacion` con salidas programadas.
- **Próximas salidas:** las 10 siguientes con tour, hora y `ocupados/cupo`.
- **Reservas:** listado paginado (20 por página) con filtros de estado, tour y rango de fechas de salida.

### Lógica pura (`src/lib`, cubierta con Vitest)

- `dinero.ts`: `formatearUSD(cents, locale)` → `$45.00`; `aCentavos('45.5')` → `4550`.
- `cancelacion.ts`: `evaluarCancelacion(iniciaEn: Date, horasLimite: number, ahora: Date)`.
- `salidas.ts`: `generarFechas({ desde, hasta, dias, hora, zona: 'America/Costa_Rica' })` → `Date[]` en UTC. Lanza error si pasa de 200.
- `tokens.ts`: `generarToken()` y `hashToken(token)`.
- `validaciones.ts`: esquemas Zod de negocio, tour, salida, salidas en lote, reserva y registro.

---

## 9. Pantallas

Todas responsive y probadas a 375px y 1280px. Cada pantalla tiene estados de cargando (`loading.tsx` con esqueleto), vacío y error (`error.tsx` con botón de reintentar).

### Públicas (ES/EN, selector de idioma en el header)

| Ruta | Muestra | Componentes | Vacío / error |
|---|---|---|---|
| `/[locale]` | Hero con propuesta para turistas, listado de negocios activos con su cantidad de tours | Header, LocaleSwitcher, Card | "Todavía no hay operadores publicados" |
| `/[locale]/[negocio]` | Nombre, descripción, botón WhatsApp y grilla de tours activos (imagen, nombre, precio por persona, duración) | TourCard, WhatsAppButton | 404 si el slug no existe o está inactivo; "Este operador no tiene tours disponibles" |
| `/[locale]/[negocio]/[tour]` | Imagen, descripción, precio, duración, punto de encuentro. SalidaPicker agrupado por día con cupos libres. ReservaForm con nombre, email, teléfono y personas (máximo = cupos libres). Resumen con total, depósito a pagar ahora y saldo en el lugar. Política de cancelación en texto | SalidaPicker, ReservaForm | "No hay salidas disponibles en los próximos días" + WhatsApp. Errores del servidor traducidos sobre el formulario (`SIN_CUPO`: "Ya no quedan suficientes cupos en esta salida") |
| `/[locale]/reserva/gracias?t=` | "Recibimos tu pago". Mientras el webhook no confirma: "Confirmando…" con refresco cada 3 s, hasta 30 s. Después, enlace a la reserva | Spinner | Si no confirma en 30 s: "Te enviaremos un correo apenas se confirme" |
| `/[locale]/reserva/cancelado?t=` | "No se completó el pago. Tus cupos se liberan en 30 minutos" + volver al tour | Card | - |
| `/[locale]/reserva/[token]` | Estado (badge), tour, fecha y hora, personas, total, depósito, saldo, punto de encuentro, contacto del negocio. Botón Cancelar con diálogo que dice si habrá reembolso o no | Badge, Dialog | Token inválido: 404 "Reserva no encontrada" |

### Auth (español)

| Ruta | Muestra |
|---|---|
| `/login` | Email, contraseña, enlace a registro. Error: "Correo o contraseña incorrectos" |
| `/registro` | Email, contraseña, nombre del negocio, slug (se sugiere del nombre y se muestra la URL final en vivo). Error de slug en uso en el campo |

### Panel (español, con sidebar que en móvil se vuelve menú superior)

| Ruta | Muestra | Vacío |
|---|---|---|
| `/panel` | 3 KpiCard: ingresos del mes, reservas del mes, ocupación de los próximos 30 días. Barra de ocupación por tour. Tabla de próximas salidas. Enlace "Ver mi página pública" | Sin tours: guía de 3 pasos (configurar negocio, crear tour, crear salidas) |
| `/panel/tours` | Tabla: nombre, precio, cupo, activo (switch), acciones (editar, salidas) | "Creá tu primer tour" |
| `/panel/tours/nuevo` y `/panel/tours/[id]` | TourForm con pestañas ES/EN para textos, precio en USD, duración, cupo, punto de encuentro e imagen con vista previa | - |
| `/panel/tours/[id]/salidas` | Formulario de salida única y SalidasLoteForm con vista previa de cuántas salidas se crearán. Lista de próximas salidas con ocupación y botón eliminar (deshabilitado si tiene reservas) | "Este tour no tiene salidas programadas" |
| `/panel/reservas` | ReservasTable: fecha de salida, tour, nombre, personas, depósito, estado, teléfono (enlace a WhatsApp). Filtros y paginación | "Todavía no hay reservas" |
| `/panel/configuracion` | Datos del negocio, % de depósito con ejemplo calculado, horas de cancelación, activo o inactivo | - |

---

## 10. UI

La fuente de verdad visual es el archivo de Figma del paso 5. Si no hay Figma, rige esta sección.

- **Estilo:** limpio, luminoso y confiable, con aire de turismo costero. Nada recargado.
- **Paleta (variables CSS en `globals.css` y en Figma):**
  - `--color-primario` #0E7C86 (turquesa océano): botones, enlaces y foco.
  - `--color-primario-oscuro` #095B63: hover.
  - `--color-acento` #F2A541 (arena atardecer): precio y badges destacados, con moderación.
  - `--color-fondo` #FAFAF7, `--color-superficie` #FFFFFF, `--color-borde` #E5E7EB.
  - `--color-texto` #1F2937, `--color-texto-suave` #6B7280.
  - Estados: éxito #15803D, aviso #B45309, error #B91C1C.
- **Tipografía:** Inter (`next/font`). Títulos 600, cuerpo 400. Escala: 14 / 16 / 18 / 24 / 32 / 40 px.
- **Espaciado:** múltiplos de 4. Radio de 12px en tarjetas y 8px en controles. Sombras suaves solo en tarjetas.
- **Responsive:** móvil primero. Grilla de tours de 1 columna (<640), 2 (≥640) y 3 (≥1024). En móvil, el formulario de reserva va debajo del detalle y el botón de pagar queda fijo abajo.
- **Accesibilidad:** contraste AA, `label` en cada campo, foco visible, objetivos táctiles de al menos 44px, `alt` en imágenes, errores asociados con `aria-describedby`.
- **Formato:** precios con `Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })`. Fechas con `Intl.DateTimeFormat(locale, { timeZone: 'America/Costa_Rica', dateStyle: 'full', timeStyle: 'short' })`.

---

## 11. Variables de entorno

`.env.example` (copiar a `.env.local`):

| Variable | Ejemplo | Dónde se obtiene |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL de la app (en Vercel, el dominio de producción) |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | `supabase status` en local; Project Settings → API en la nube |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Igual que la anterior |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Igual. Solo servidor, nunca con `NEXT_PUBLIC_` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard (modo prueba) → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | En local: salida de `stripe listen`. En la nube: el endpoint del webhook en el Dashboard |
| `RESEND_API_KEY` | `re_...` | Resend → API Keys |
| `EMAIL_FROM` | `PuraReserva <onboarding@resend.dev>` | Remitente de prueba de Resend o dominio verificado |

---

## 12. Orden de construcción

Regla para cada paso con interfaz: al terminarlo, abrir las pantallas con **Playwright MCP** a 375x812 y 1280x800, revisar que no haya desbordes, textos sin traducir ni errores en consola, y compararlas con su frame de Figma.

**Paso 1. Proyecto base**
- Crear: `npx create-next-app@latest purareserva --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`. Agregar Prettier, `vitest.config.ts` y scripts `typecheck` (`tsc --noEmit`) y `test` (`vitest run`). Crear `.env.example`.
- Aceptación: la app arranca y los scripts corren.
- Verificar: `npm run lint && npm run typecheck && npm run build`

**Paso 2. Base de datos local**
- Crear: `supabase init`, `supabase/migrations/0001_init.sql` con todo el SQL de las secciones 6 y 7, el bucket `tours` y `supabase/seed.sql`. El seed tiene 2 usuarios dueños (`dueno1@test.com` y `dueno2@test.com`, contraseña `Prueba123!`), 2 negocios, 2 tours por negocio y salidas diarias a las 8:00 y 13:00 por 14 días. Generar tipos: `supabase gen types typescript --local > src/types/database.ts`.
- Aceptación: la migración y el seed se aplican sin errores; `cupos_disponibles` devuelve el cupo completo en una salida sin reservas.
- Verificar: `supabase db reset && supabase db lint`, y luego `psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -c "select count(*) from salidas;"` devuelve más de 0.

**Paso 3. Clientes de Supabase y autenticación**
- Crear: `lib/supabase/*`, `middleware.ts` (solo sesión por ahora), `(auth)/login`, `(auth)/registro`, `(auth)/actions.ts` y un `panel/layout.tsx` y `panel/page.tsx` mínimos.
- Aceptación: registrar un dueño nuevo crea su negocio y entra a `/panel`; sin sesión, `/panel` redirige a `/login`; cerrar sesión funciona.
- Verificar: `npm run build` + Playwright MCP: registro → panel → logout → `/panel` redirige.

**Paso 4. Internacionalización**
- Crear: `i18n/routing.ts`, `i18n/request.ts`, `messages/es.json`, `messages/en.json`, `app/[locale]/layout.tsx` y `LocaleSwitcher`. Combinar en `middleware.ts` next-intl (solo rutas públicas, excluyendo `/panel`, `/login`, `/registro`, `/api` y estáticos) con el refresco de sesión.
- Aceptación: `/` redirige a `/es`; `/en` muestra textos en inglés; el selector conserva la ruta actual.
- Verificar: `npm run build` + Playwright MCP en `/es` y `/en`.

**Paso 5. Diseño en Figma**
- Con el plugin de Figma: crear el archivo "PuraReserva". Definir variables (colores, tipografía, espaciado y radios de la sección 10) y los componentes base (Button, Input, Card, Badge, TourCard, KpiCard). Diseñar en móvil (375) y escritorio (1280): landing, página del negocio, detalle del tour con formulario, página de la reserva, resumen del panel y lista de reservas.
- Aceptación: el archivo tiene la página de variables y componentes y 12 frames (6 pantallas x 2 tamaños), todos usando las variables.
- Verificar: compartir el enlace del archivo con el usuario y esperar su visto bueno antes del paso 6.

**Paso 6. Sistema de UI**
- Crear: variables en `globals.css`, fuente Inter y `components/ui/*`, implementados desde Figma con el contexto de diseño del plugin.
- Aceptación: todos los componentes tienen estados hover, foco, deshabilitado y error. Una página temporal `/dev/ui` muestra todos (se borra en el paso 18).
- Verificar: `npm run build` + Playwright MCP en `/dev/ui` a 375 y 1280, comparado con Figma.

**Paso 7. Configuración del negocio**
- Crear: `panel/layout.tsx` completo con Sidebar, `panel/configuracion/*` y esquema Zod del negocio.
- Aceptación: el dueño edita y guarda sus datos; los errores de validación aparecen en cada campo; el dueño 2 no ve ni puede editar el negocio del dueño 1.
- Verificar: `npm run build` + Playwright MCP.

**Paso 8. Tours**
- Crear: `panel/tours/*`, TourForm con pestañas ES/EN, subida de imagen y `cambiarEstadoTour`.
- Aceptación: crear, editar, activar y desactivar tours; la imagen se ve; el slug es único por negocio.
- Verificar: `npm run build` + Playwright MCP.

**Paso 9. Salidas**
- Crear: `lib/salidas.ts` y `tests/unit/salidas.test.ts` (rango con días seleccionados, hora local a UTC, límite de 200, duplicados), y `panel/tours/[id]/salidas/*`.
- Aceptación: crear una salida y un lote de "lunes a sábado 8:00 por 30 días" genera 25-26 salidas; repetir el lote no duplica; no se puede eliminar una salida con reservas.
- Verificar: `npm run test && npm run build` + Playwright MCP.

**Paso 10. Parte pública**
- Crear: `app/[locale]/page.tsx`, `[negocio]/page.tsx`, `[negocio]/[tour]/page.tsx` (sin enviar todavía), TourCard, SalidaPicker, WhatsAppButton y `lib/dinero.ts` y `lib/fechas.ts` con sus pruebas.
- Aceptación: las páginas muestran los datos del seed en ES y EN; las salidas pasadas o con menos de 1 hora no aparecen; los cupos libres se muestran correctamente.
- Verificar: `npm run test && npm run build` + Playwright MCP en las 3 rutas, en ambos idiomas.

**Paso 11. Crear reserva y pagar**
- Crear: `lib/tokens.ts` (con prueba), `lib/stripe.ts`, ReservaForm y `crearReserva`.
- Aceptación: con `stripe listen --forward-to localhost:3000/api/stripe/webhook` corriendo, reservar redirige a Stripe Checkout; en la base queda una reserva `pendiente_pago` con depósito correcto (precio x personas x %); pedir más personas que cupos devuelve `SIN_CUPO`. Prueba de concurrencia: 2 reservas simultáneas por el último cupo crean solo 1.
- Verificar: `npm run test && npm run build` y un script `scripts/concurrencia.ts` (`npx tsx scripts/concurrencia.ts`) que llama 10 veces en paralelo a `crear_reserva` sobre una salida con cupo 3 y comprueba que se crean exactamente 3 reservas de 1 persona.

**Paso 12. Webhook**
- Crear: `app/api/stripe/webhook/route.ts` y las páginas `gracias` y `cancelado`.
- Aceptación: al pagar con la tarjeta de prueba `4242 4242 4242 4242`, la reserva pasa a `confirmada`; reenviar el mismo evento no hace nada; una sesión expirada marca la reserva como `expirada` y libera los cupos.
- Verificar: `stripe trigger checkout.session.completed` no rompe nada (sin metadata, se ignora) + flujo real con la tarjeta de prueba + consulta SQL del estado.

**Paso 13. Correos**
- Crear: `lib/email.ts` con plantillas de confirmación y de cancelación en ES y EN (HTML simple con los datos de la reserva y el enlace `SITE_URL/<idioma>/reserva/<token>`), enviadas al turista y a `email_contacto`.
- Aceptación: al confirmar llegan 2 correos; con idioma `en`, el del turista llega en inglés. Si Resend falla, se registra el error y el webhook igual responde 200.
- Verificar: reserva de prueba + revisar los envíos en el panel de Resend.

**Paso 14. Ver y cancelar la reserva**
- Crear: `lib/cancelacion.ts` con pruebas (antes del límite, justo en el límite, después y límite 0), `reserva/[token]/page.tsx` y `cancelarReserva`.
- Aceptación: antes del límite se reembolsa en Stripe y queda `reembolsada`; después queda `cancelada` sin reembolso; el diálogo avisa correctamente cuál de los dos casos aplica; un token falso da 404.
- Verificar: `npm run test && npm run build` + flujo con Playwright MCP + reembolso visible en el Dashboard de Stripe.

**Paso 15. Panel: resumen y reservas**
- Crear: `panel/page.tsx` completo (KpiCard, OcupacionBar, próximas salidas, guía si está vacío) y `panel/reservas/page.tsx` con filtros y paginación.
- Aceptación: los números coinciden con una consulta SQL hecha a mano sobre los mismos datos; los filtros funcionan; el dueño 2 ve cero reservas del dueño 1.
- Verificar: `npm run build` + Playwright MCP + consulta SQL de control.

**Paso 16. Pruebas end-to-end**
- Crear: `playwright.config.ts` (proyectos desktop 1280x800 y mobile con `devices['iPhone 13']`; `webServer` con `npm run build && npm run start`) y en `tests/e2e/`:
  - `reserva.spec.ts`: el turista reserva → Stripe Checkout de prueba (completar con la tarjeta 4242) → gracias → confirmada.
  - `cancelacion.spec.ts`: cancelar antes del límite → reembolsada.
  - `panel.spec.ts`: login → crear tour → crear salidas en lote → ver en la página pública.
  - `aislamiento.spec.ts`: el dueño 2 no puede abrir `/panel/tours/<id del dueño 1>` (404) ni ver sus reservas.
  - `i18n.spec.ts`: las rutas `/en` no muestran claves sin traducir.
- Aceptación: todo en verde en los dos proyectos.
- Verificar: `npx playwright test` (con `supabase start` y `stripe listen` corriendo).

**Paso 17. CI**
- Crear: `.github/workflows/ci.yml`. Job `calidad` (Node 20, `npm ci`, lint, typecheck, `npm run test`, build) y job `e2e` (depende de `calidad`; `supabase/setup-cli`, `supabase start`, `supabase db reset`, variables desde los secretos de GitHub `STRIPE_SECRET_KEY` y `RESEND_API_KEY`, `npx playwright install --with-deps`, `npx playwright test`). En CI, el webhook se simula: las pruebas e2e que dependen del webhook llaman un endpoint solo de pruebas, o se saltean con `test.skip(!!process.env.CI)` y quedan anotadas como pruebas locales.
- Aceptación: un push a `main` deja los dos jobs en verde.
- Verificar: `gh run watch` sobre el último run.

**Paso 18. Deploy**
- Crear proyecto en Supabase Cloud: `supabase link` + `supabase db push`, y crear el bucket. En Vercel: importar el repo, cargar las variables de la sección 11 con la URL de producción y deployar. En Stripe (modo prueba): crear el endpoint `https://<dominio>/api/stripe/webhook` con los eventos `checkout.session.completed` y `checkout.session.expired`, y cargar su secreto en Vercel. En Supabase Auth: Site URL y Redirect URLs al dominio. Borrar `/dev/ui`.
- Aceptación: el flujo completo funciona en producción con la tarjeta de prueba.
- Verificar: Playwright MCP sobre el dominio de producción: reserva, pago, confirmación y cancelación.

**Paso 19. README**
- Crear: `README.md` con qué es, demo (enlace y 2 usuarios de prueba), capturas desde Figma y de la app, stack, decisiones (sin sobreventa, multi-tenant con RLS, depósito con Stripe), cómo correrlo local y cómo correr las pruebas. Oraciones cortas, sin emojis.
- Aceptación: alguien sin contexto lo corre en local siguiendo solo el README.
- Verificar: clonar en una carpeta limpia y seguir el README de punta a punta.

---

## 13. Pruebas

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarias | Vitest | `cancelacion`, `salidas`, `dinero`, `tokens`, `fechas` y esquemas de `validaciones`, con casos borde (zona horaria, límite exacto, 200 salidas) |
| Base de datos | Script `scripts/concurrencia.ts` + consultas SQL | Sin sobreventa en concurrencia; `cupos_disponibles` con pendientes vencidas y vigentes |
| Seguridad | Playwright (`aislamiento.spec.ts`) + prueba manual con el cliente anon | El dueño 2 no accede a datos del 1; anon no puede leer `reservas` ni llamar `crear_reserva` |
| End-to-end | Playwright (desktop y mobile) | Reserva y pago, cancelación con reembolso, gestión desde el panel, idiomas |
| Visual | Playwright MCP | Cada pantalla a 375 y 1280 contra Figma, sin errores en consola |
| Webhook | Stripe CLI | Idempotencia (evento repetido) y expiración |

---

## 14. Despliegue

1. `supabase link --project-ref <ref>` y `supabase db push`.
2. En Supabase Cloud: crear el bucket público `tours`, configurar Auth (Site URL = dominio de Vercel; confirmación de email activa) y correr `seed.sql` solo si se quieren datos de demo.
3. Vercel: importar el repo de GitHub, framework Next.js, y cargar las 8 variables de la sección 11 para Production y Preview.
4. Stripe Dashboard (modo prueba) → Developers → Webhooks → nuevo endpoint `https://<dominio>/api/stripe/webhook` con los eventos `checkout.session.completed` y `checkout.session.expired`. Copiar el secreto a `STRIPE_WEBHOOK_SECRET` en Vercel y redeployar.
5. Resend: usar `onboarding@resend.dev` o verificar un dominio propio.
6. Revisar el paso 18 de la sección 12.

---

## 15. Supuestos y riesgos

**Supuestos**
- Todo opera en modo prueba de Stripe; no se cobra dinero real.
- Todos los negocios están en Costa Rica: zona `America/Costa_Rica` (UTC-6, sin horario de verano) y moneda USD.
- El depósito lo cobra la cuenta de Stripe de la plataforma. Distribuirlo a cada negocio queda fuera de alcance (Stripe Connect).
- Un dueño tiene un solo negocio.
- Los nombres de los plugins de Figma y Playwright pueden variar según la versión de Claude Code; se usa el disponible que cumpla esa función.

**Riesgos y mitigación**
- **Pago completado justo cuando vence la retención:** Stripe no permite pagar una sesión expirada, y la sesión vence al mismo tiempo que la retención (30 min). Si igual llega `completed` de una reserva ya `expirada`, se confirma solo si hay cupo. Si no lo hay, se reembolsa automáticamente y se avisa al turista.
- **El webhook no llega:** Stripe reintenta hasta 3 días. La página de gracias informa que se confirmará por correo.
- **Correos en spam con el remitente de prueba:** aceptable en la demo; con dominio propio se resuelve.
- **Límites del plan gratuito de Supabase y Vercel:** suficientes para una demo de portafolio.

---

## 16. Reglas para el constructor

1. Seguir el orden de la sección 12. No empezar un paso sin que el anterior pase su verificación.
2. No agregar funciones fuera de la sección 2. Si algo parece necesario y no está, preguntarle al usuario.
3. Código simple y organizado según la sección 5. Sin abstracciones prematuras, sin librerías no listadas en la sección 4 salvo utilidades chicas y justificadas.
4. Nunca calcular precios ni depósitos en el cliente. Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` ni `STRIPE_SECRET_KEY`.
5. Cada pantalla: responsive, con estados de cargando, vacío y error, revisada con Playwright MCP a 375 y 1280.
6. Implementar la interfaz desde Figma con el plugin. Si algo de Figma contradice la sección 10, gana Figma, salvo en accesibilidad.
7. Probar cada paso antes de seguir y reportar al usuario en 2-3 líneas: qué se hizo y cómo se verificó.
8. Hacer commit al terminar cada paso con un mensaje claro (`paso 7: configuración del negocio`).
9. Responder siempre en español.
