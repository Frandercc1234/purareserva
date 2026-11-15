import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Button, botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, Td, Th } from '@/components/ui/Table';
import { formatearUSD } from '@/lib/dinero';
import { formatearCorto } from '@/lib/fechas';
import { contextoPanel } from '@/lib/panel';
import { aFechaCR } from '@/lib/salidas';
import { uuid } from '@/lib/validaciones';

const POR_PAGINA = 20;

const ESTADOS = {
  pendiente_pago: { texto: 'Pendiente de pago', tono: 'aviso' },
  confirmada: { texto: 'Confirmada', tono: 'exito' },
  cancelada: { texto: 'Cancelada', tono: 'error' },
  reembolsada: { texto: 'Reembolsada', tono: 'neutro' },
  expirada: { texto: 'Expirada', tono: 'neutro' },
} as const satisfies Record<string, { texto: string; tono: TonoBadge }>;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const filtrosSchema = z.object({
  estado: z
    .enum([
      'pendiente_pago',
      'confirmada',
      'cancelada',
      'reembolsada',
      'expirada',
    ])
    .optional()
    .catch(undefined),
  tour: uuid.optional().catch(undefined),
  desde: fecha.optional().catch(undefined),
  hasta: fecha.optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).catch(1),
});

function whatsapp(telefono: string) {
  return `https://wa.me/${telefono.replace(/\D/g, '')}`;
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const primero = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const f = filtrosSchema.parse({
    estado: primero(crudos.estado) || undefined,
    tour: primero(crudos.tour) || undefined,
    desde: primero(crudos.desde) || undefined,
    hasta: primero(crudos.hasta) || undefined,
    pagina: primero(crudos.pagina) ?? 1,
  });

  const { supabase, negocio } = await contextoPanel();
  const { data: tours } = await supabase
    .from('tours')
    .select('id, nombre_es')
    .eq('negocio_id', negocio.id)
    .order('nombre_es');

  let consulta = supabase
    .from('reservas')
    .select(
      'id, nombre, telefono, personas, deposito_cents, estado, salidas!inner(inicia_en, tour_id, tours(nombre_es))',
      { count: 'exact' },
    )
    .eq('negocio_id', negocio.id);
  if (f.estado) consulta = consulta.eq('estado', f.estado);
  if (f.tour) consulta = consulta.eq('salidas.tour_id', f.tour);
  if (f.desde)
    consulta = consulta.gte(
      'salidas.inicia_en',
      aFechaCR(f.desde, '00:00').toISOString(),
    );
  if (f.hasta) {
    // "hasta" incluye todo ese día: se compara contra el inicio del día siguiente.
    const finDia = new Date(aFechaCR(f.hasta, '00:00').getTime() + 86_400_000);
    consulta = consulta.lt('salidas.inicia_en', finDia.toISOString());
  }

  const desdeFila = (f.pagina - 1) * POR_PAGINA;
  const {
    data: reservas,
    count,
    error,
  } = await consulta
    .order('creado_en', { ascending: false })
    .range(desdeFila, desdeFila + POR_PAGINA - 1);

  // Página fuera de rango: se vuelve a la primera conservando los filtros.
  if (error && f.pagina > 1) {
    const q = new URLSearchParams();
    for (const k of ['estado', 'tour', 'desde', 'hasta'] as const)
      if (f[k]) q.set(k, f[k]!);
    redirect(`/panel/reservas${q.size ? `?${q}` : ''}`);
  }

  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hayFiltros = !!(f.estado || f.tour || f.desde || f.hasta);

  const enlacePagina = (n: number) => {
    const q = new URLSearchParams();
    for (const k of ['estado', 'tour', 'desde', 'hasta'] as const)
      if (f[k]) q.set(k, f[k]!);
    q.set('pagina', String(n));
    return `/panel/reservas?${q}`;
  };

  const filas = (reservas ?? []).map((r) => ({
    id: r.id,
    salida: r.salidas?.inicia_en ? formatearCorto(r.salidas.inicia_en) : '',
    tour: r.salidas?.tours?.nombre_es ?? '',
    nombre: r.nombre,
    personas: r.personas,
    deposito: formatearUSD(r.deposito_cents, 'en'),
    estado: ESTADOS[r.estado],
    telefono: r.telefono,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Reservas</h1>

      <Card>
        <form
          method="get"
          action="/panel/reservas"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <Select label="Estado" name="estado" defaultValue={f.estado ?? ''}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([valor, e]) => (
              <option key={valor} value={valor}>
                {e.texto}
              </option>
            ))}
          </Select>
          <Select label="Tour" name="tour" defaultValue={f.tour ?? ''}>
            <option value="">Todos</option>
            {(tours ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre_es}
              </option>
            ))}
          </Select>
          <Input
            label="Salida desde"
            name="desde"
            type="date"
            defaultValue={f.desde ?? ''}
          />
          <Input
            label="Salida hasta"
            name="hasta"
            type="date"
            defaultValue={f.hasta ?? ''}
          />
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            {hayFiltros && (
              <Link
                href="/panel/reservas"
                className={botonClases('secundario')}
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </Card>

      {!filas.length ? (
        <EmptyState
          titulo={
            hayFiltros
              ? 'No hay reservas con esos filtros'
              : 'Todavía no hay reservas'
          }
          descripcion={
            hayFiltros ? undefined : 'Cuando alguien reserve, la vas a ver acá.'
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <thead>
                <tr>
                  <Th>Salida</Th>
                  <Th>Tour</Th>
                  <Th>Nombre</Th>
                  <Th>Personas</Th>
                  <Th>Depósito</Th>
                  <Th>Estado</Th>
                  <Th>Teléfono</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.id}>
                    <Td>{r.salida}</Td>
                    <Td>{r.tour}</Td>
                    <Td className="font-semibold">{r.nombre}</Td>
                    <Td>{r.personas}</Td>
                    <Td>{r.deposito}</Td>
                    <Td>
                      <Badge tono={r.estado.tono}>{r.estado.texto}</Badge>
                    </Td>
                    <Td>
                      <a
                        href={whatsapp(r.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center text-primario underline"
                      >
                        {r.telefono}
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {filas.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold">{r.nombre}</span>
                    <Badge tono={r.estado.tono}>{r.estado.texto}</Badge>
                  </div>
                  <p className="text-sm text-texto-suave">
                    {r.salida} · {r.tour} · {r.personas} personas
                  </p>
                  <p className="text-sm text-texto-suave">
                    Depósito {r.deposito} ·{' '}
                    <a
                      href={whatsapp(r.telefono)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primario underline"
                    >
                      {r.telefono}
                    </a>
                  </p>
                </Card>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Paginación"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-texto-suave">
              {total} {total === 1 ? 'reserva' : 'reservas'} · Página {f.pagina}{' '}
              de {paginas}
            </p>
            <div className="flex gap-2">
              {f.pagina > 1 && (
                <Link
                  href={enlacePagina(f.pagina - 1)}
                  className={botonClases('secundario')}
                >
                  Anterior
                </Link>
              )}
              {f.pagina < paginas && (
                <Link
                  href={enlacePagina(f.pagina + 1)}
                  className={botonClases('secundario')}
                >
                  Siguiente
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
