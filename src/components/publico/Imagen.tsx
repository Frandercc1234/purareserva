import Image from 'next/image';

/**
 * Imagen que llena su contenedor (que debe tener `position: relative` y un tamaño).
 * Las de Storage son externas y se sirven tal cual; las locales las optimiza Next.
 */
export function Imagen({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? 'high' : undefined}
      unoptimized={src.startsWith('http')}
      className={className ?? 'object-cover'}
    />
  );
}
