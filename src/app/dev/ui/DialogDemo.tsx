'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

export function DialogDemo() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <div>
        <Button variante="secundario" onClick={() => setAbierto(true)}>
          Abrir diálogo
        </Button>
      </div>
      <Dialog
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Cancelar reserva"
      >
        <p className="text-texto-suave">
          Se te reembolsará el depósito porque cancelás antes del límite.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setAbierto(false)}>
            Volver
          </Button>
          <Button onClick={() => setAbierto(false)}>Confirmar</Button>
        </div>
      </Dialog>
    </>
  );
}
