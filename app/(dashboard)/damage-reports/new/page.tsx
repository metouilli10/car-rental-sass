import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { InspectionWizardV2 } from "@/components/inspections/InspectionWizardV2";
import {
  getBookingsForInspection,
  getInspectionsForBooking,
} from "@/lib/actions/damage-reports";
import type { DepartureData } from "@/components/inspections/types";

export default async function NewInspectionPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const bookings = await getBookingsForInspection();

  // Build departure inspection lookup for "Retour" reference cards
  const departureInspections: Record<string, DepartureData> = {};
  for (const booking of bookings) {
    const inspections = await getInspectionsForBooking(booking.id);
    const departure = inspections.find((i) => i.inspectionType === "DEPART");
    if (departure) {
      departureInspections[booking.id] = {
        fuelLevel: departure.fuelLevel || "",
        sections: departure.sections.map((s) => ({
          sectionType: s.sectionType,
          status: s.status,
          damageCost: s.damageCost,
        })),
      };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle inspection"
        description="Remplissez le formulaire d'inspection en 4 étapes"
      />
      <InspectionWizardV2
        bookings={JSON.parse(JSON.stringify(bookings))}
        preselectedBookingId={params.bookingId}
        departureInspections={departureInspections}
      />
    </div>
  );
}
