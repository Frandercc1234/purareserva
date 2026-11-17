'use client';

import { useEffect, useId, useRef } from 'react';

export function Dialog({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      aria-labelledby={tituloId}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-tarjeta border border-borde bg-superficie p-6 text-texto shadow-tarjeta backdrop:bg-carbon/60"
    >
      <h2 id={tituloId} className="text-lg font-semibold">
        {titulo}
      </h2>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </dialog>
  );
}
