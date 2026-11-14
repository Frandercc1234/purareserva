import { TourForm } from '@/components/panel/TourForm';

export default function NuevoTourPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Nuevo tour</h1>
      <TourForm />
    </div>
  );
}
