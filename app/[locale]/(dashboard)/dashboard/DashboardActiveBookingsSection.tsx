import { getDashboardActiveBookingsV3 } from "@/lib/dashboard/v3-queries";
import { ActiveBookingsTabs } from "@/components/dashboard/ActiveBookingsTabs";

interface DashboardActiveBookingsSectionProps {
  agencyId: string;
  periodInput: {
    period?: string;
    start?: string;
    end?: string;
  };
}

export async function DashboardActiveBookingsSection({
  agencyId,
  periodInput,
}: DashboardActiveBookingsSectionProps) {
  const activeBookings = await getDashboardActiveBookingsV3({
    agencyId,
    periodInput,
  });

  return <ActiveBookingsTabs activeBookings={activeBookings} />;
}
