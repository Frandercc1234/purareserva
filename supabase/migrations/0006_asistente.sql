-- v2: asistente de IA (guía de Guanacaste con pgvector y control de uso)
create extension if not exists vector with schema extensions;

create type tipo_guia as enum ('playa', 'pueblo', 'parque', 'clima', 'transporte', 'consejo');

create table guia (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  tipo           tipo_guia not null,
  titulo_es      text not null,
  titulo_en      text not null,
  contenido_es   text not null check (length(contenido_es) between 100 and 2500),
  contenido_en   text not null check (length(contenido_en) between 100 and 2500),
  fuente_nombre  text not null,
  fuente_url     text not null check (fuente_url ~ '^https://'),
  revisado       boolean not null default false,
  embedding      extensions.vector(384),
  actualizado_en timestamptz not null default now()
);
create index guia_embedding_idx on guia using hnsw (embedding extensions.vector_cosine_ops);

-- Uso diario. clave = hash del visitante, o '__global__' para el total
create table uso_asistente (
  clave     text not null,
  dia       date not null default (now() at time zone 'America/Costa_Rica')::date,
  mensajes  integer not null default 0,
  primary key (clave, dia)
);

alter table guia enable row level security;
alter table uso_asistente enable row level security;
-- Sin políticas: solo service role.

-- Búsqueda semántica: solo fichas revisadas y con similitud mínima
create or replace function buscar_guia(p_embedding extensions.vector(384), p_limite int default 4, p_similitud_min float default 0.78)
returns table (slug text, titulo_es text, titulo_en text, contenido_es text, contenido_en text,
               fuente_nombre text, fuente_url text, similitud float)
language sql stable security definer set search_path = public, extensions as $$
  select slug, titulo_es, titulo_en, contenido_es, contenido_en, fuente_nombre, fuente_url,
         1 - (embedding <=> p_embedding) as similitud
  from guia
  where revisado and embedding is not null and 1 - (embedding <=> p_embedding) >= p_similitud_min
  order by embedding <=> p_embedding
  limit least(p_limite, 6);
$$;

-- Suma un mensaje al visitante y al global. Devuelve false si alguno pasó su límite (y no suma)
create or replace function registrar_mensaje_asistente(p_clave text, p_limite_visitante int, p_limite_global int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Costa_Rica')::date;
  v_visitante int;
  v_global int;
begin
  insert into uso_asistente (clave, dia) values (p_clave, v_dia), ('__global__', v_dia)
    on conflict do nothing;
  select mensajes into v_global from uso_asistente where clave = '__global__' and dia = v_dia for update;
  select mensajes into v_visitante from uso_asistente where clave = p_clave and dia = v_dia for update;
  if v_visitante >= p_limite_visitante or v_global >= p_limite_global then
    return false;
  end if;
  update uso_asistente set mensajes = mensajes + 1 where dia = v_dia and clave in (p_clave, '__global__');
  return true;
end;
$$;

revoke execute on function buscar_guia(extensions.vector, int, float) from public, anon, authenticated;
revoke execute on function registrar_mensaje_asistente(text, int, int) from public, anon, authenticated;
