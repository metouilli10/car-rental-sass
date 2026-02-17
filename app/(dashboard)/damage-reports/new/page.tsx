import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { InspectionForm } from "@/components/damage-reports/inspection-form";
import { getBookingsForInspection } from "@/lib/actions/damage-reports";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle inspection"
        description="Remplissez le formulaire d'inspection section par section"
      />
      <InspectionForm
        bookings={JSON.parse(JSON.stringify(bookings))}
        preselectedBookingId={params.bookingId}
      />
    </div>
  );
}
