export function EmptyState({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-tarjeta border border-dashed border-borde bg-superficie px-4 py-12 text-center">
      <p className="text-lg font-semibold">{titulo}</p>
      {descripcion && <p className="text-texto-suave">{descripcion}</p>}
      {accion}
    </div>
  );
}
