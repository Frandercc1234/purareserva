const MS_POR_HORA = 3_600_000;

/**
 * Política de cancelación: hay reembolso si se cancela hasta `horasLimite`
 * horas antes de la salida (inclusive). Con límite 0, hasta el momento de salir.
 */
export function evaluarCancelacion(
  iniciaEn: Date,
  horasLimite: number,
  ahora: Date,
): { reembolso: boolean } {
  const limite = iniciaEn.getTime() - horasLimite * MS_POR_HORA;
  return { reembolso: ahora.getTime() <= limite };
}
