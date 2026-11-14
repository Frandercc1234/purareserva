-- Confirma una reserva cuando Stripe avisa el pago, sin sobreventa.
-- Resultados: 'confirmada', 'ya_confirmada', 'sin_cupo', 'no_aplica', 'no_existe'.
-- Con 'sin_cupo' no se cambia nada: el webhook reembolsa y marca la reserva.
create or replace function confirmar_reserva_pago(p_reserva_id uuid, p_payment_intent text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_r reservas;
  v_libres integer;
begin
  select * into v_r from reservas where id = p_reserva_id for update;
  if not found then return 'no_existe'; end if;
  if v_r.estado = 'confirmada' then return 'ya_confirmada'; end if;
  if v_r.estado in ('cancelada', 'reembolsada') then return 'no_aplica'; end if;

  -- Bloquea la salida mientras cuenta, igual que crear_reserva.
  perform 1 from salidas where id = v_r.salida_id for update;

  v_libres := cupos_disponibles(v_r.salida_id);
  -- Si esta reserva sigue vigente, sus personas ya están contadas.
  if v_r.estado = 'pendiente_pago' and v_r.expira_en > now() then
    v_libres := v_libres + v_r.personas;
  end if;
  if v_libres < v_r.personas then return 'sin_cupo'; end if;

  update reservas
     set estado = 'confirmada', confirmada_en = now(), stripe_payment_intent = p_payment_intent
   where id = p_reserva_id;
  return 'confirmada';
end;
$$;

revoke execute on function confirmar_reserva_pago(uuid, text) from public, anon, authenticated;
