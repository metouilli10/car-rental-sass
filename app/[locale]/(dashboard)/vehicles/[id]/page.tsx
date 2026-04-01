import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Info, Wrench } from "lucide-react";
import Link from "next/link";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { canDeleteVehicles, canManageVehicles } from "@/lib/permissions";
import {
  getVehicleProfile,
  isVehicleProfileTab,
  type VehicleProfileTab,
} from "@/lib/vehicles/profile";
import { VehicleProfileHeader } from "@/components/vehicles/profile/vehicle-profile-header";
import { VehicleSummaryCards } from "@/components/vehicles/profile/vehicle-summary-cards";
import { VehicleTabs } from "@/components/vehicles/profile/vehicle-tabs";
import { VehicleOverviewTab } from "@/components/vehicles/profile/vehicle-overview-tab";
import { VehicleReservationsPanel } from "@/components/vehicles/profile/vehicle-reservations-panel";
import { VehicleInspectionHistory } from "@/components/vehicles/profile/vehicle-inspection-history";
import { VehicleRemindersPanel } from "@/components/vehicles/profile/vehicle-reminders-panel";
import { VehicleCompliancePanel } from "@/components/vehicles/profile/vehicle-compliance-panel";
import { VehicleInfractionsPanel } from "@/components/vehicles/profile/vehicle-infractions-panel";
import { VehicleReminderSheet } from "@/components/vehicles/profile/vehicle-reminder-sheet";
import { isValidLocale, type AppLocale, withLocalePath } from "@/lib/i18n/config";

type VehiclePageSearchParams = {
  tab?: string;
  sheet?: string;
};

export default async function VehicleProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<VehiclePageSearchParams>;
}) {
  const currentUser = await getCurrentUserAccessForPage();

  const [{ locale: localeParam, id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!isValidLocale(localeParam)) {
    notFound();
  }
  const locale: AppLocale = localeParam;

  const currentTab: VehicleProfileTab = isVehicleProfileTab(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab
    : "overview";

  const profile = await getVehicleProfile(currentUser.agencyId, id);

  if (!profile) {
    notFound();
  }

  const canManageVehicle = canManageVehicles(
    currentUser.role,
    currentUser.permissions,
  );
  const canDeleteVehicle = canDeleteVehicles(
    currentUser.role,
    currentUser.permissions,
  );

  const currentOrNextBookingId = profile.currentReservation?.id ?? profile.nextReservation?.id ?? null;
  const inspectionDisabledReason = currentOrNextBookingId
    ? null
    : "Une réservation active ou à venir est nécessaire pour lancer une inspection.";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href={withLocalePath(locale, "/vehicles")} className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Retour aux véhicules
        </Link>
      </div>

      <VehicleProfileHeader
        vehicle={profile.vehicle}
        currentOrNextBookingId={currentOrNextBookingId}
        inspectionLabel={inspectionDisabledReason}
        canManageVehicle={canManageVehicle}
        canDeleteVehicle={canDeleteVehicle}
      />

      <VehicleSummaryCards data={profile} locale={locale} />
      <VehicleTabs vehicleId={profile.vehicle.id} currentTab={currentTab} locale={locale} />

      {currentTab === "overview" ? <VehicleOverviewTab data={profile} locale={locale} /> : null}
      {currentTab === "reservations" ? (
        <VehicleReservationsPanel reservations={profile.reservations} locale={locale} />
      ) : null}
      {currentTab === "inspections" ? (
        <VehicleInspectionHistory inspections={profile.inspections} locale={locale} />
      ) : null}
      {currentTab === "maintenance" ? (
        <VehicleRemindersPanel
          vehicleId={profile.vehicle.id}
          overdue={profile.reminders.overdue}
          open={profile.reminders.open}
          done={profile.reminders.done}
          locale={locale}
        />
      ) : null}
      {currentTab === "compliance" ? (
        <VehicleCompliancePanel vehicleId={profile.vehicle.id} items={profile.compliance} editable />
      ) : null}
      {currentTab === "infractions" ? (
        <VehicleInfractionsPanel vehicleId={profile.vehicle.id} infractions={profile.infractions} locale={locale} />
      ) : null}
      <VehicleReminderSheet
        vehicleId={profile.vehicle.id}
        defaultOpen={resolvedSearchParams.sheet === "1"}
        currentTab={currentTab}
        defaults={{
          nextOilChangeDate: toDateInputValue(profile.vehicle.nextOilChangeDate),
          nextOilChangeMileageKm: profile.vehicle.nextOilChangeMileageKm?.toString() ?? "",
          insuranceExpiryDate: toDateInputValue(profile.vehicle.insuranceExpiryDate),
          nextTechnicalInspectionDate: toDateInputValue(profile.vehicle.nextTechnicalInspectionDate),
          vignetteExpiryDate: toDateInputValue(profile.vehicle.vignetteExpiryDate),
          maintenanceNotes: profile.vehicle.maintenanceNotes ?? "",
        }}
      />
    </div>
  );
}

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}
