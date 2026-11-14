'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
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

const MENSAJES: Record<string, string> = {
  SLUG_EN_USO: 'Esa URL ya está en uso',
};

export default function RegistroPage() {
  const [estado, accion, pendiente] = useActionState<EstadoForm, FormData>(
    registrar,
    null,
  );
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);

  const campos = estado && !estado.ok ? (estado.campos ?? {}) : {};
  const errorSlug = campos.slug
    ? (MENSAJES[campos.slug] ??
      'Usá 3 a 40 letras minúsculas, números y guiones')
    : null;
  const errorGeneral =
    estado && !estado.ok && !Object.keys(campos).length
      ? estado.error === 'DESCONOCIDO'
        ? 'No pudimos crear la cuenta. Revisá tu correo o intentá de nuevo.'
        : 'No pudimos crear la cuenta. Revisá los datos.'
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Registrá tu negocio</h1>
      <form action={accion} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
          {campos.email && (
            <span className="text-red-700">Correo no válido</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña (mínimo 8 caracteres)
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
          {campos.password && (
            <span className="text-red-700">Mínimo 8 caracteres</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nombre del negocio
          <input
            name="nombreNegocio"
            required
            onChange={(e) => {
              if (!slugEditado) setSlug(sugerirSlug(e.target.value));
            }}
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
          {campos.nombreNegocio && (
            <span className="text-red-700">Entre 2 y 80 caracteres</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          URL de tu página
          <input
            name="slug"
            value={slug}
            required
            aria-describedby="slug-url"
            aria-invalid={!!errorSlug}
            onChange={(e) => {
              setSlugEditado(true);
              setSlug(e.target.value);
            }}
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
          <span id="slug-url" className="text-gray-500">
            purareserva.com/es/{slug || 'tu-negocio'}
          </span>
          {errorSlug && <span className="text-red-700">{errorSlug}</span>}
        </label>
        {errorGeneral && (
          <p role="alert" className="text-sm text-red-700">
            {errorGeneral}
          </p>
        )}
        <button
          type="submit"
          disabled={pendiente}
          className="h-11 rounded-lg bg-teal-700 font-medium text-white disabled:opacity-60"
        >
          {pendiente ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="text-sm">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-teal-700 underline">
          Iniciar sesión
        </Link>
      </p>
    </main>
  );
}
