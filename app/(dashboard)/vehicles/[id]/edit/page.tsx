import { notFound, redirect } from "next/navigation";
import { canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
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
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    redirect("/vehicles");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, agencyId: currentUser.agencyId },
  });

  if (!vehicle) {
    notFound();
  }

  const handleUpdate = async (data: VehicleFormData) => {
    "use server";
    return updateVehicle(id, data);
  };

  return (
    <div className="space-y-6 min-h-screen">
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
