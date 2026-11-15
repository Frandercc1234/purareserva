import Link from 'next/link';
import { KpiCard } from '@/components/panel/KpiCard';
import { OcupacionBar, porcentaje } from '@/components/panel/OcupacionBar';
import { Badge } from '@/components/ui/Badge';
import { botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatearUSD } from '@/lib/dinero';
import { formatearCorto, rangoMesCR } from '@/lib/fechas';
import { contextoPanel } from '@/lib/panel';

const PASOS = [
  {
    href: '/panel/configuracion',
    texto: 'Configurá tu negocio',
    detalle: 'Descripción, WhatsApp, depósito y plazo de cancelación.',
  },
  {
    href: '/panel/tours/nuevo',
    texto: 'Creá tu primer tour',
    detalle: 'Textos en español e inglés, precio e imagen.',
  },
  {
    href: '/panel/tours',
    texto: 'Programá las salidas',
    detalle: 'Desde la lista de tours, elegí "Salidas" y creá fechas con cupo.',
  },
];

export default async function PanelPage() {
  const { supabase, negocio } = await contextoPanel();
  const mes = rangoMesCR();

  const [{ count: totalTours }, ingresos, ocupacion, proximas] =
    await Promise.all([
      supabase
        .from('tours')
        .select('id', { count: 'exact', head: true })
        .eq('negocio_id', negocio.id),
      supabase.rpc('resumen_ingresos', {
        p_negocio_id: negocio.id,
        p_desde: mes.desde.toISOString(),
        p_hasta: mes.hasta.toISOString(),
      }),
      supabase.rpc('ocupacion_por_tour', {
        p_negocio_id: negocio.id,
        p_dias: 30,
      }),
      supabase
        .from('salidas_ocupacion')
        .select('id, inicia_en, cupo, ocupados, tour_nombre')
        .eq('negocio_id', negocio.id)
        .eq('estado', 'programada')
        .gt('inicia_en', new Date().toISOString())
        .order('inicia_en', { ascending: true })
        .limit(10),
    ]);

  if (!totalTours) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Resumen</h1>
        <Card className="flex max-w-2xl flex-col gap-4">
          <h2 className="text-lg font-semibold">Empecemos en tres pasos</h2>
          <ol className="flex flex-col gap-3">
            {PASOS.map((p, i) => (
              <li key={p.href} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primario font-semibold text-superficie">
                  {i + 1}
                </span>
                <div>
                  <Link
                    href={p.href}
                    className="font-semibold text-primario underline"
                  >
                    {p.texto}
                  </Link>
                  <p className="text-sm text-texto-suave">{p.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    );
  }

  const resumen = ingresos.data?.[0];
  const porTour = ocupacion.data ?? [];
  const cupoTotal = porTour.reduce((s, t) => s + Number(t.cupo), 0);
  const ocupadosTotal = porTour.reduce((s, t) => s + Number(t.ocupados), 0);
  const salidas = proximas.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Resumen</h1>
        <Link
          href={`/es/${negocio.slug}`}
          target="_blank"
          className={botonClases('secundario')}
        >
          Ver mi página pública
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          etiqueta="Ingresos del mes"
          valor={formatearUSD(Number(resumen?.ingresos ?? 0), 'en')}
          detalle="Depósitos de reservas confirmadas"
        />
        <KpiCard
          etiqueta="Reservas del mes"
          valor={String(resumen?.reservas ?? 0)}
          detalle={`${resumen?.personas ?? 0} personas`}
        />
        <KpiCard
          etiqueta="Ocupación próx. 30 días"
          valor={`${porcentaje(ocupadosTotal, cupoTotal)}%`}
          detalle={`${ocupadosTotal} de ${cupoTotal} cupos`}
        />
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Ocupación por tour</h2>
        {porTour.length ? (
          porTour.map((t) => (
            <OcupacionBar
              key={t.tour_id}
              nombre={t.tour_nombre}
              ocupados={Number(t.ocupados)}
              cupo={Number(t.cupo)}
            />
          ))
        ) : (
          <p className="text-texto-suave">
            No hay salidas programadas en los próximos 30 días.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Próximas salidas</h2>
        {salidas.length ? (
          <ul className="flex flex-col">
            {salidas.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 border-t border-borde py-3 first:border-t-0"
              >
                <span>
                  <span className="font-semibold">{s.tour_nombre}</span>
                  <span className="block text-sm text-texto-suave">
                    {s.inicia_en ? formatearCorto(s.inicia_en) : ''}
                  </span>
                </span>
                <Badge tono={(s.ocupados ?? 0) > 0 ? 'aviso' : 'neutro'}>
                  {s.ocupados ?? 0}/{s.cupo}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-texto-suave">No hay salidas programadas.</p>
        )}
      </Card>
    </div>
  );
}
