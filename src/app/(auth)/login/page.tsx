'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { iniciarSesion, type EstadoForm } from '../actions';

export default function LoginPage() {
  const [estado, accion, pendiente] = useActionState<EstadoForm, FormData>(
    iniciarSesion,
    null,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
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
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
        </label>
        {estado && !estado.ok && (
          <p role="alert" className="text-sm text-red-700">
            Correo o contraseña incorrectos
          </p>
        )}
        <button
          type="submit"
          disabled={pendiente}
          className="h-11 rounded-lg bg-teal-700 font-medium text-white disabled:opacity-60"
        >
          {pendiente ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="text-sm">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-teal-700 underline">
          Registrá tu negocio
        </Link>
      </p>
    </main>
  );
}
