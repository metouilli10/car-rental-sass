import { BookingRequestStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { getEffectivePermissions } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { BookingRequestDetailCard } from "@/components/booking-requests/booking-request-detail-card";
import { BookingRequestsTable } from "@/components/booking-requests/booking-requests-table";
import { markBookingRequestAsRead } from "@/lib/notifications/booking-requests";
import { getBookingRequestsForAgency } from "@/lib/storefront/queries";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

const statusOptions: Array<{ value: BookingRequestStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "CONVERTED", label: "Converties" },
];

export default async function BookingRequestsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ status?: string; q?: string; requestId?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  const currentUser = await getCurrentUserAccessForPage();
  const permissions = getEffectivePermissions(currentUser.role, currentUser.permissions);

  if (!permissions["bookings.view"]) {
    redirect(withLocalePath(locale, "/dashboard"));
  }

  const filters = await searchParams;
  const requestId = filters.requestId?.trim() || "";
  const status = statusOptions.some((option) => option.value === filters.status)
    ? (filters.status as BookingRequestStatus | "ALL")
    : "ALL";

  if (requestId) {
    await markBookingRequestAsRead(requestId, currentUser.agencyId);
  }

  const requests = await getBookingRequestsForAgency(currentUser.agencyId, {
    status,
    search: filters.q,
    requestId,
  });
  const highlightedRequest = requestId
    ? requests.find((request) => request.id === requestId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes de réservation"
        description="Centralisez les demandes reçues depuis le site web avant de les convertir manuellement en réservation."
      />

      <form className="grid gap-4 rounded-2xl border border-subtle bg-white p-4 shadow-card md:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">Statut</label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="q" className="text-sm font-medium text-slate-700">Recherche</label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Client, email, téléphone, voiture..."
            className="flex h-10 w-full rounded-xl border border-border/60 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="h-10">Filtrer</Button>
        </div>
      </form>

      {highlightedRequest ? (
        <BookingRequestDetailCard request={highlightedRequest} locale={locale} />
      ) : null}

      <BookingRequestsTable requests={requests} locale={locale} highlightedRequestId={requestId || undefined} />
    </div>
  );
}
