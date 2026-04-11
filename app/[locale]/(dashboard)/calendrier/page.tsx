import { Suspense } from "react";
import { getCalendarData } from "@/lib/actions/calendar";
import { BookingTimeline } from "@/components/calendar/BookingTimeline";
import { CalendarSkeleton } from "./loading-skeleton";

interface CalendrierPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendrierPage({ searchParams }: CalendrierPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendrierContent weekParam={params.week} />
    </Suspense>
  );
}

async function CalendrierContent({ weekParam }: { weekParam?: string }) {
  const data = await getCalendarData(weekParam);

  return (
    <BookingTimeline
      vehicles={data.vehicles}
      bookings={data.bookings}
      weekStart={data.weekStart}
      weekEnd={data.weekEnd}
      currentUserRole={data.currentUserRole}
    />
  );
}
