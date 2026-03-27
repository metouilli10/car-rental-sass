import { notFound, redirect } from "next/navigation";
import { canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { updateVehicle } from "@/lib/actions/vehicles";
import { VehicleFormData } from "@/lib/validations/vehicle";
import { getVehicleFuelType } from "@/lib/vehicle-fuel-type";

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

  const [vehicle, fuelType] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        plate: true,
        color: true,
        pricePerDay: true,
        depositAmount: true,
        gearbox: true,
        mileage: true,
        currentKm: true,
        status: true,
        photoUrl: true,
      },
    }),
    getVehicleFuelType(id),
  ]);

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
          depositAmount: vehicle.depositAmount,
          gearbox: vehicle.gearbox,
          fuelType,
          mileage: vehicle.mileage ?? undefined,
          currentKm: vehicle.currentKm ?? undefined,
          status: vehicle.status,
          photoUrl: vehicle.photoUrl ?? undefined,
        }}
        onSubmit={handleUpdate}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
