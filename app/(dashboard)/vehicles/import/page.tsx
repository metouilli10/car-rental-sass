import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleImportPageClient } from "@/components/vehicles/vehicle-import-page-client";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";

export default async function VehicleImportPage() {
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    redirect("/vehicles");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importer des vehicules"
        description="Chargez votre fichier Excel, mappez les colonnes puis importez ou mettez a jour votre parc automatiquement."
      />
      <VehicleImportPageClient />
    </div>
  );
}
