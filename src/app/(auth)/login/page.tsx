'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { iniciarSesion, type EstadoForm } from '../actions';

function Formulario() {
  const errorEnlace = useSearchParams().get('error') === 'confirmacion';
  const [estado, accion, pendiente] = useActionState<EstadoForm, FormData>(
    iniciarSesion,
    null,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <form action={accion} className="flex flex-col gap-4" noValidate>
        <Input
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {errorEnlace && !estado && (
          <p role="alert" className="text-sm text-error">
            El enlace de confirmación no es válido o venció. Iniciá sesión o
            registrate de nuevo.
          </p>
        )}
        {estado && !estado.ok && (
          <p role="alert" className="text-sm text-error">
            Correo o contraseña incorrectos
          </p>
        )}
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className="text-sm">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-primario underline">
          Registrá tu negocio
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
