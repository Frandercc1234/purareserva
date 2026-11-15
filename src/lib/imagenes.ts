/** Tipos y tamaño permitidos para las imágenes subidas (tours y portada). */
export const TIPOS_IMAGEN: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const MAX_IMAGEN = 2 * 1024 * 1024;

/** Imagen de respaldo cuando un tour o negocio no tiene ninguna. */
export const IMAGEN_RESPALDO = '/placeholder-tour.jpg';
