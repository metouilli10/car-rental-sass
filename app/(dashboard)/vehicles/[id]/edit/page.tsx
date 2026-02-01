import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { updateVehicle } from "@/lib/actions/vehicles";
import { VehicleFormData } from "@/lib/validations/vehicle";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle || vehicle.agencyId !== session.user.agencyId) {
    notFound();
  }

  const handleUpdate = async (data: VehicleFormData) => {
    "use server";
    return updateVehicle(id, data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier le véhicule"
        description={`${vehicle.make} ${vehicle.model} - ${vehicle.plate}`}
      />

      <VehicleForm
        defaultValues={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          plate: vehicle.plate,
          color: vehicle.color,
          pricePerDay: vehicle.pricePerDay,
          mileage: vehicle.mileage || undefined,
          status: vehicle.status,
          photoUrl: vehicle.photoUrl ?? undefined,
        }}
        onSubmit={handleUpdate}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
