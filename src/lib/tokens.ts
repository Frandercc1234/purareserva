import { createHash, randomBytes } from 'node:crypto';

/** Token secreto de la reserva: 32 bytes aleatorios en base64url. */
export function generarToken() {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 en hexadecimal. En la base solo se guarda este hash. */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
