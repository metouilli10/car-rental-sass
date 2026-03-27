import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/lib/actions/vehicles";
import { canManageVehicles } from "@/lib/permissions";

export default async function AddVehiclePage() {
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
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
