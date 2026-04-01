import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleImportPageClient } from "@/components/vehicles/vehicle-import-page-client";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function VehicleImportPage({
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
    <div className="space-y-6">
      <PageHeader title={pv.importTitle} description={pv.importDescription} />
      <VehicleImportPageClient />
    </div>
  );
}
