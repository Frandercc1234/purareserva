'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
