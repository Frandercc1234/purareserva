'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registrar, type EstadoForm } from '../actions';

function sugerirSlug(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default function RegistroPage() {
  const [estado, accion, pendiente] = useActionState<EstadoForm, FormData>(
    registrar,
    null,
  );
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);

  const campos = estado && !estado.ok ? (estado.campos ?? {}) : {};
  const errorSlug = campos.slug
    ? campos.slug === 'SLUG_EN_USO'
      ? 'Esa URL ya está en uso'
      : 'Usá 3 a 40 letras minúsculas, números y guiones'
    : undefined;
  const errorGeneral =
    estado && !estado.ok && !Object.keys(campos).length
      ? estado.error === 'DESCONOCIDO'
        ? 'No pudimos crear la cuenta. Revisá tu correo o intentá de nuevo.'
        : 'No pudimos crear la cuenta. Revisá los datos.'
      : null;

  if (estado?.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Revisá tu correo</h1>
        <p role="status" className="text-texto-suave">
          Te enviamos un enlace para confirmar tu cuenta. Al abrirlo entrás
          directo al panel y se crea tu negocio.
        </p>
        <p className="text-sm text-texto-suave">
          Si no lo ves en unos minutos, mirá la carpeta de spam.
        </p>
        <Link href="/login" className="text-primario underline">
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Registrá tu negocio</h1>
      <form action={accion} className="flex flex-col gap-4" noValidate>
        <Input
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={campos.email ? 'Correo no válido' : undefined}
        />
        <Input
          label="Contraseña (mínimo 8 caracteres)"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          error={campos.password ? 'Mínimo 8 caracteres' : undefined}
        />
        <Input
          label="Nombre del negocio"
          name="nombreNegocio"
          required
          onChange={(e) => {
            if (!slugEditado) setSlug(sugerirSlug(e.target.value));
          }}
          error={campos.nombreNegocio ? 'Entre 2 y 80 caracteres' : undefined}
        />
        <Input
          label="URL de tu página"
          name="slug"
          value={slug}
          required
          onChange={(e) => {
            setSlugEditado(true);
            setSlug(e.target.value);
          }}
          hint={`purareserva.com/es/${slug || 'tu-negocio'}`}
          error={errorSlug}
        />
        {errorGeneral && (
          <p role="alert" className="text-sm text-error">
            {errorGeneral}
          </p>
        )}
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="text-sm">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-primario underline">
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
