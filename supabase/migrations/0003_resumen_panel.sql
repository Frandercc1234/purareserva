-- Agregados del resumen del panel. Son security invoker: se aplican las políticas RLS
-- del dueño, y además se filtra por negocio (salidas tiene una política pública de lectura).

-- Ingresos por depósitos y reservas confirmadas en un rango (el mes en hora de Costa Rica).
create or replace function resumen_ingresos(p_negocio_id uuid, p_desde timestamptz, p_hasta timestamptz)
returns table (ingresos bigint, reservas bigint, personas bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(deposito_cents), 0)::bigint,
         count(*)::bigint,
         coalesce(sum(personas), 0)::bigint
  from reservas
  where negocio_id = p_negocio_id
    and estado = 'confirmada'
    and confirmada_en >= p_desde
    and confirmada_en < p_hasta;
$$;

-- Ocupación por tour de las salidas programadas de los próximos N días.
create or replace function ocupacion_por_tour(p_negocio_id uuid, p_dias integer default 30)
returns table (tour_id uuid, tour_nombre text, cupo bigint, ocupados bigint)
language sql stable security invoker set search_path = public as $$
  select o.tour_id, o.tour_nombre,
         sum(o.cupo)::bigint,
         sum(o.ocupados)::bigint
  from salidas_ocupacion o
  where o.negocio_id = p_negocio_id
    and o.estado = 'programada'
    and o.inicia_en > now()
    and o.inicia_en <= now() + make_interval(days => p_dias)
  group by o.tour_id, o.tour_nombre
  order by o.tour_nombre;
$$;

grant execute on function resumen_ingresos(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function ocupacion_por_tour(uuid, integer) to authenticated;
revoke execute on function resumen_ingresos(uuid, timestamptz, timestamptz) from anon;
revoke execute on function ocupacion_por_tour(uuid, integer) from anon;
