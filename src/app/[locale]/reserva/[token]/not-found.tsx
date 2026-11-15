// Este componente no conoce el idioma de la ruta, por eso el texto va en ambos.
export default function ReservaNoEncontrada() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Reserva no encontrada</h1>
      <p className="text-texto-suave">Booking not found</p>
    </main>
  );
}
