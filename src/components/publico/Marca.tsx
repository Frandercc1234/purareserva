/** Marca de PuraReserva: una ola dentro de un círculo turquesa. */
export function Marca({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <circle cx="16" cy="16" r="16" fill="#0E7C86" />
      <circle cx="22" cy="10" r="3" fill="#F2A541" />
      <path
        d="M5 19c2.5-3 5-3 7.5 0s5 3 7.500 0 4-2.500 6.500-1"
        stroke="#fff"
        strokeWidth="2.200"
        strokeLinecap="round"
      />
      <path
        d="M5 24c2.500-3 5-3 7.500 0s5 3 7.500 0 4-2.500 6.500-1"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="2.200"
        strokeLinecap="round"
      />
    </svg>
  );
}
