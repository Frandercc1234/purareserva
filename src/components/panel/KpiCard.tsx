import { Card } from '@/components/ui/Card';

export function KpiCard({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <Card className="flex flex-col gap-1 px-5 py-4">
      <p className="text-sm text-texto-suave">{etiqueta}</p>
      <p className="text-3xl font-semibold">{valor}</p>
      {detalle && <p className="text-sm text-texto-suave">{detalle}</p>}
    </Card>
  );
}
