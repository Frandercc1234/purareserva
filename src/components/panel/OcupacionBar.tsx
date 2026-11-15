/** Barra de ocupación: ocupados / cupo con el porcentaje redondeado. */
export function porcentaje(ocupados: number, cupo: number) {
  return cupo > 0 ? Math.round((ocupados / cupo) * 100) : 0;
}

export function OcupacionBar({
  nombre,
  ocupados,
  cupo,
}: {
  nombre: string;
  ocupados: number;
  cupo: number;
}) {
  const pct = porcentaje(ocupados, cupo);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-texto-suave">{nombre}</span>
        <span>
          {pct}% · {ocupados}/{cupo}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={nombre}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 overflow-hidden rounded-full bg-borde"
      >
        <div
          className="h-full rounded-full bg-primario"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
