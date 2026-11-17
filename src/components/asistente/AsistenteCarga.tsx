'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AsistenteBoton } from './AsistenteBoton';

const precargar = () => import('./Asistente').then((m) => m.Asistente);

// El chat (useChat, el cliente de IA y el panel) se descarga al primer toque, no con la página.
const Asistente = dynamic(precargar, {
  ssr: false,
  loading: () => <AsistenteBoton abierto={false} onClick={() => {}} />,
});

/** Muestra solo el botón; al tocarlo (o al acercarse a él) carga el asistente completo. */
export function AsistenteCarga() {
  const [pedido, setPedido] = useState(false);
  if (pedido) return <Asistente abiertoInicial />;
  return (
    <AsistenteBoton
      abierto={false}
      onClick={() => setPedido(true)}
      onPrecarga={() => void precargar()}
    />
  );
}
