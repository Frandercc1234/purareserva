-- Datos de prueba: 2 dueños (contraseña Prueba123!), 2 negocios, 4 tours, salidas por 14 días

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'dueno1@test.com', extensions.crypt('Prueba123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'dueno2@test.com', extensions.crypt('Prueba123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u where u.email in ('dueno1@test.com', 'dueno2@test.com');

insert into negocios (id, owner_id, slug, nombre, descripcion_es, descripcion_en, email_contacto, whatsapp, deposito_pct, horas_cancelacion)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aventuras-rincon',
   'Aventuras Rincón', 'Tours de aventura en el Rincón de la Vieja.', 'Adventure tours at Rincón de la Vieja.',
   'dueno1@test.com', '+50688887777', 30, 24),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'mar-y-sol-tamarindo',
   'Mar y Sol Tamarindo', 'Experiencias en el mar frente a Tamarindo.', 'Ocean experiences off Tamarindo.',
   'dueno2@test.com', '+50687776666', 25, 48);

insert into tours (id, negocio_id, slug, nombre_es, nombre_en, descripcion_es, descripcion_en,
                   precio_cents, duracion_min, cupo_default, punto_encuentro, punto_encuentro_en, imagen_url)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'canopy-rincon',
   'Canopy en el Rincón', 'Rincón Canopy', 'Tirolesa entre el bosque tropical.', 'Zip line through the tropical forest.',
   6500, 150, 12, 'Entrada principal del parque', 'Park main entrance', '/tours/canopy.jpg'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aguas-termales',
   'Aguas termales y barro', 'Hot springs and mud', 'Relax en aguas termales volcánicas.', 'Relax in volcanic hot springs.',
   4500, 180, 20, 'Recepción de las termales', 'Hot springs reception', '/tours/termales.jpg'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'catamaran-atardecer',
   'Catamarán al atardecer', 'Sunset catamaran', 'Navegá la costa con bebidas incluidas.', 'Sail the coast, drinks included.',
   8500, 180, 25, 'Muelle de Tamarindo', 'Tamarindo pier', '/tours/catamaran.jpg'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'snorkel-bahia',
   'Snorkel en la bahía', 'Bay snorkeling', 'Snorkel con guía y equipo incluido.', 'Guided snorkeling, gear included.',
   5500, 120, 10, 'Playa Tamarindo, torre de salvavidas', 'Tamarindo Beach, lifeguard tower', '/tours/snorkel.jpg');

-- Horarios por tour (hora de Costa Rica), coherentes con cada actividad
insert into salidas (tour_id, negocio_id, inicia_en, cupo)
select t.id, t.negocio_id,
       ((current_date + d)::text || ' ' || h.hora)::timestamp at time zone 'America/Costa_Rica',
       t.cupo_default
from tours t
join (values
  ('canopy-rincon', '08:00'), ('canopy-rincon', '10:30'), ('canopy-rincon', '13:00'),
  ('aguas-termales', '09:00'), ('aguas-termales', '14:00'),
  ('catamaran-atardecer', '16:30'),
  ('snorkel-bahia', '08:00'), ('snorkel-bahia', '10:30')
) as h(slug, hora) on h.slug = t.slug
cross join generate_series(1, 14) d;
