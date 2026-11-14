-- PuraReserva: esquema, funciones, RLS y storage

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
  id            text primary key,
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

revoke execute on function crear_reserva(uuid, text, text, text, integer, idioma, text) from public, anon, authenticated;
grant execute on function cupos_disponibles(uuid) to anon, authenticated;

-- Crea el negocio al registrarse (lo llama la Server Action de registro con el usuario autenticado)
create or replace function crear_negocio(p_slug text, p_nombre text, p_email text)
returns negocios language sql security invoker set search_path = public as $$
  insert into negocios (owner_id, slug, nombre, email_contacto)
  values (auth.uid(), p_slug, p_nombre, p_email) returning *;
$$;

-- Vista para el panel (ocupación de salidas)
create or replace view salidas_ocupacion with (security_invoker = true) as
select s.*, t.nombre_es as tour_nombre,
       s.cupo - cupos_disponibles(s.id) as ocupados
from salidas s join tours t on t.id = s.tour_id;

-- RLS
alter table negocios enable row level security;
alter table tours enable row level security;
alter table salidas enable row level security;
alter table reservas enable row level security;
alter table eventos_stripe enable row level security;

create policy negocios_publico on negocios for select to anon, authenticated using (activo);
create policy negocios_dueno_select on negocios for select to authenticated using (owner_id = auth.uid());
create policy negocios_dueno_insert on negocios for insert to authenticated with check (owner_id = auth.uid());
create policy negocios_dueno_update on negocios for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy tours_publico on tours for select to anon, authenticated
  using (activo and exists (select 1 from negocios n where n.id = negocio_id and n.activo));
create policy tours_dueno on tours for all to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()))
  with check (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()));

create policy salidas_publico on salidas for select to anon, authenticated
  using (estado = 'programada' and inicia_en > now());
create policy salidas_dueno on salidas for all to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()))
  with check (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid())
              and exists (select 1 from tours t where t.id = tour_id and t.negocio_id = salidas.negocio_id));

create policy reservas_dueno_select on reservas for select to authenticated
  using (exists (select 1 from negocios n where n.id = negocio_id and n.owner_id = auth.uid()));

-- Storage: bucket público para imágenes de tours (2 MB, jpeg/png/webp)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tours', 'tours', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy tours_img_publico on storage.objects for select using (bucket_id = 'tours');
create policy tours_img_dueno on storage.objects for insert to authenticated
  with check (bucket_id = 'tours' and (storage.foldername(name))[1] in
    (select id::text from negocios where owner_id = auth.uid()));
create policy tours_img_dueno_upd on storage.objects for update to authenticated
  using (bucket_id = 'tours' and (storage.foldername(name))[1] in
    (select id::text from negocios where owner_id = auth.uid()));
