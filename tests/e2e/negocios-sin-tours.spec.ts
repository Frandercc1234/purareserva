import { expect, test } from '@playwright/test';
import { db, unico } from './helpers';

test('un negocio sin tours activos no sale en la landing ni en el sitemap', async ({
  page,
}) => {
  const sufijo = unico('sin-tours').toLowerCase();
  const slug = `negocio-${sufijo}`;
  const nombre = `Negocio vacío ${sufijo}`;
  const { data: usuario, error: e1 } = await db.auth.admin.createUser({
    email: `${sufijo}@example.com`,
    password: 'Prueba123!',
    email_confirm: true,
  });
  if (e1 || !usuario.user) throw new Error(`Sin usuario: ${e1?.message}`);
  const duenoId = usuario.user.id;

  try {
    const { error: e2 } = await db.from('negocios').insert({
      owner_id: duenoId,
      slug,
      nombre,
      email_contacto: `${sufijo}@example.com`,
    });
    if (e2) throw new Error(`Sin negocio: ${e2.message}`);

    await page.goto('/es');
    await expect(page.getByText('Aventuras Rincón').first()).toBeVisible();
    await expect(page.getByText('Mar y Sol Tamarindo').first()).toBeVisible();
    await expect(page.getByText(nombre)).toHaveCount(0);

    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).not.toContain(slug);

    // Su página sigue existiendo.
    const propia = await page.goto(`/es/${slug}`);
    expect(propia?.status()).toBe(200);
  } finally {
    // Borrar el usuario borra el negocio (on delete cascade).
    await db.auth.admin.deleteUser(duenoId);
  }
});
