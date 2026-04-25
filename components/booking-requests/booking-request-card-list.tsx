import type { BookingRequestListItem } from "@/lib/storefront/queries";
import { BookingRequestCard } from "@/components/booking-requests/booking-request-card";

interface BookingRequestCardListProps {
  requests: BookingRequestListItem[];
  locale: "fr" | "ar";
  highlightedRequestId?: string;
}

export function BookingRequestCardList({
  requests,
  locale,
  highlightedRequestId,
}: BookingRequestCardListProps) {
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <BookingRequestCard
          key={request.id}
          request={request}
          locale={locale}
          highlighted={highlightedRequestId === request.id}
        />
      ))}
    </div>
  );
}
