import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { canDeleteVehicles, canManageVehicles } from "@/lib/permissions";
import {
  getVehicleProfile,
  normalizeVehicleProfileTab,
  type VehicleProfileTab,
} from "@/lib/vehicles/profile";
import { VehicleActionRequiredStrip } from "@/components/vehicles/profile/vehicle-action-required-strip";
import { VehicleProfileHeader } from "@/components/vehicles/profile/vehicle-profile-header";
import { VehicleTabs } from "@/components/vehicles/profile/vehicle-tabs";
import { VehicleOverviewTab } from "@/components/vehicles/profile/vehicle-overview-tab";
import { VehicleReservationsPanel } from "@/components/vehicles/profile/vehicle-reservations-panel";
import { VehicleCompliancePanel } from "@/components/vehicles/profile/vehicle-compliance-panel";
import { VehicleReminderSheet } from "@/components/vehicles/profile/vehicle-reminder-sheet";
import { VehicleTrackingTab } from "@/components/vehicles/profile/vehicle-tracking-tab";

type VehiclePageSearchParams = {
  tab?: string;
  sheet?: string;
  reminder?: string;
};

export default async function VehicleProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<VehiclePageSearchParams>;
}) {
  const currentUser = await getCurrentUserAccessForPage();

  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const currentTab: VehicleProfileTab = normalizeVehicleProfileTab(resolvedSearchParams.tab) ?? "overview";

  const profile = await getVehicleProfile(currentUser.agencyId, id);

  if (!profile) {
    notFound();
  }

  const canManageVehicle = canManageVehicles(currentUser.role, currentUser.permissions);
  const canDeleteVehicle = canDeleteVehicles(currentUser.role, currentUser.permissions);

  const currentOrNextBookingId = profile.currentReservation?.id ?? profile.nextReservation?.id ?? null;
  const inspectionDisabledReason = currentOrNextBookingId
    ? null
    : "Une réservation active ou à venir est nécessaire pour lancer une inspection.";

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/vehicles" className="inline-flex items-center gap-2 hover:text-slate-900">
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
      <VehicleActionRequiredStrip workspace={profile.workspace} />

      <VehicleTabs vehicleId={profile.vehicle.id} currentTab={currentTab} />

      {currentTab === "overview" ? (
        <VehicleOverviewTab
          data={profile}
          currentOrNextBookingId={currentOrNextBookingId}
          inspectionLabel={inspectionDisabledReason}
        />
      ) : null}
      {currentTab === "reservations" ? (
        <VehicleReservationsPanel vehicleId={profile.vehicle.id} reservations={profile.reservations} />
      ) : null}
      {currentTab === "tracking" ? (
        <VehicleTrackingTab
          data={profile}
          currentOrNextBookingId={currentOrNextBookingId}
          inspectionLabel={inspectionDisabledReason}
        />
      ) : null}
      {currentTab === "documents" ? (
        <VehicleCompliancePanel vehicleId={profile.vehicle.id} items={profile.compliance} editable />
      ) : null}
      <VehicleReminderSheet
        vehicleId={profile.vehicle.id}
        defaultOpen={resolvedSearchParams.sheet === "1"}
        currentTab={currentTab}
        defaultReminderType={resolvedSearchParams.reminder}
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
