/** Marca de PuraReserva: una ola dentro de un círculo. Sobre carbón se invierte (círculo hueso). */
export function Marca({
  className,
  sobreCarbon = false,
}: {
  className?: string;
  sobreCarbon?: boolean;
}) {
  const circulo = sobreCarbon ? '#F2EADB' : '#1B1410';
  const ola = sobreCarbon ? '#1B1410' : '#F2EADB';
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <circle cx="16" cy="16" r="16" fill={circulo} />
      <circle cx="22" cy="10" r="3" fill="#C98E52" />
      <path
        d="M5 19c2.5-3 5-3 7.5 0s5 3 7.500 0 4-2.500 6.500-1"
        stroke={ola}
        strokeWidth="2.200"
        strokeLinecap="round"
      />
      <path
        d="M5 24c2.500-3 5-3 7.500 0s5 3 7.500 0 4-2.500 6.500-1"
        stroke={ola}
        strokeOpacity=".55"
        strokeWidth="2.200"
        strokeLinecap="round"
      />
    </svg>
  );
}
