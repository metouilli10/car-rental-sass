import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/lib/actions/vehicles";

export default function AddVehiclePage() {
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
