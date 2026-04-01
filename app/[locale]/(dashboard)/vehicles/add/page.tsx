import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/lib/actions/vehicles";
import { canManageVehicles } from "@/lib/permissions";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function AddVehiclePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  const ui = getMessages(locale);
  const pv = ui.pageChrome.vehicles;
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    redirect(withLocalePath(locale, "/vehicles"));
  }

  return (
    <div className="space-y-6 min-h-screen">
      <PageHeader title={pv.addTitle} description={pv.addDescription} />

      <VehicleForm onSubmit={createVehicle} submitLabel={pv.addSubmit} />
    </div>
  );
}
