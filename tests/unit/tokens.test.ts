import { describe, expect, it } from 'vitest';
import { generarToken, hashToken } from '@/lib/tokens';

describe('tokens', () => {
  it('genera tokens base64url de 32 bytes (43 caracteres)', () => {
    const t = generarToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('no repite tokens', () => {
    const set = new Set(Array.from({ length: 200 }, generarToken));
    expect(set.size).toBe(200);
  });

  it('el hash es SHA-256 hexadecimal y es determinista', () => {
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('tokens distintos tienen hashes distintos', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});
