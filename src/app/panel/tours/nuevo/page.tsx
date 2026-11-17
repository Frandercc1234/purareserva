import type { Metadata } from 'next';
import { TourForm } from '@/components/panel/TourForm';

export const metadata: Metadata = { title: 'Nuevo tour' };

export default function NuevoTourPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nuevo tour</h1>
      <TourForm />
    </div>
  );
}
