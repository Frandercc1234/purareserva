import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Table, Td, Th } from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
import { DialogDemo } from './DialogDemo';

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      <h1 className="text-3xl font-semibold">Sistema de UI</h1>

      <Seccion titulo="Button">
        <div className="flex flex-wrap gap-3">
          <Button>Reservar</Button>
          <Button variante="secundario">Reservar</Button>
          <Button disabled>Deshabilitado</Button>
          <Button variante="secundario" disabled>
            Deshabilitado
          </Button>
        </div>
        <p className="text-sm text-texto-suave">
          Hover y foco: pasá el mouse o usá Tab sobre los botones.
        </p>
      </Seccion>

      <Seccion titulo="Input, Select y Textarea">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Nombre completo" placeholder="Nombre completo" />
          <Input
            label="Con ayuda"
            placeholder="correo@ejemplo.com"
            hint="Te enviamos la confirmación acá"
          />
          <Input label="Con error" defaultValue="" error="Ingresá tu nombre" />
          <Input label="Deshabilitado" placeholder="No editable" disabled />
          <Select label="Personas" defaultValue="2">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </Select>
          <Select label="Select con error" error="Elegí una opción">
            <option value="">Elegir…</option>
          </Select>
          <Textarea label="Descripción" placeholder="Contanos del tour" />
          <Textarea label="Textarea con error" error="Es obligatorio" />
        </div>
      </Seccion>

      <Seccion titulo="Card y Badge">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-lg font-semibold">Título de la tarjeta</p>
            <p className="text-sm text-texto-suave">Contenido de la tarjeta</p>
          </Card>
          <div className="flex flex-wrap items-start gap-2">
            <Badge>Pendiente</Badge>
            <Badge tono="exito">Confirmada</Badge>
            <Badge tono="aviso">Por pagar</Badge>
            <Badge tono="error">Cancelada</Badge>
            <Badge tono="destacado">Popular</Badge>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Table">
        <Table>
          <thead>
            <tr>
              <Th>Salida</Th>
              <Th>Tour</Th>
              <Th>Nombre</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Lun 18, 8:00</Td>
              <Td>Canopy</Td>
              <Td>Ana Mora</Td>
              <Td>
                <Badge tono="exito">Confirmada</Badge>
              </Td>
            </tr>
            <tr>
              <Td>Lun 18, 13:00</Td>
              <Td>Termales</Td>
              <Td>John Smith</Td>
              <Td>
                <Badge tono="aviso">Por pagar</Badge>
              </Td>
            </tr>
          </tbody>
        </Table>
      </Seccion>

      <Seccion titulo="EmptyState, Spinner y Dialog">
        <EmptyState
          titulo="Todavía no hay reservas"
          descripcion="Cuando alguien reserve, la vas a ver acá."
          accion={<Button variante="secundario">Crear un tour</Button>}
        />
        <Spinner />
        <DialogDemo />
      </Seccion>
    </main>
  );
}
