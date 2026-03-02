import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/lib/actions/vehicles";
import { prisma } from "@/lib/prisma";
import { canManageVehicles } from "@/lib/permissions";

export default async function AddVehiclePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageVehicles(session.user.role, currentUser?.permissionOverrides ?? null)) {
    redirect("/vehicles");
  }

  return (
    <div className="space-y-6 min-h-screen">
      <PageHeader
        title="Ajouter un véhicule"
        description="Enregistrer un nouveau véhicule dans votre parc"
      />

      <VehicleForm onSubmit={createVehicle} submitLabel="Ajouter le véhicule" />
    </div>
  );
}
