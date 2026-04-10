import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { VehicleReservationHistoryItem } from "@/lib/vehicles/profile";
import { bookingStatusLabels, depositStatusLabels, formatDurationDays, paymentStatusLabels } from "./presentation";

export function VehicleReservationsPanel({
  vehicleId,
  reservations,
}: {
  vehicleId: string;
  reservations: VehicleReservationHistoryItem[];
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historique réservations</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6">
            <p className="text-sm font-semibold text-slate-950">Aucune réservation à venir</p>
            <p className="mt-1 text-sm text-slate-500">
              Créez une réservation pour affecter ce véhicule à un nouveau client.
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href={`/bookings/create?vehicleId=${vehicleId}`}>
                Créer une réservation
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{reservation.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{bookingStatusLabels[reservation.status]}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{formatDurationDays(reservation.startDate, reservation.endDate)}</span>
                    <span>{formatCurrency(reservation.totalPrice)}</span>
                    <span>{paymentStatusLabels[reservation.paymentStatus]}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="mt-2 px-0 text-blue-600 hover:text-blue-700">
                    <Link href={`/bookings/${reservation.id}`}>
                      Voir la réservation
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Dates</th>
                    <th className="pb-3 pr-4">Durée</th>
                    <th className="pb-3 pr-4">Montant</th>
                    <th className="pb-3 pr-4">Paiement</th>
                    <th className="pb-3 pr-4">Caution</th>
                    <th className="pb-3 pr-4">Statut</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="py-4 pr-4 text-sm font-medium text-slate-900">{reservation.customerName}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">
                        {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-600">
                        {formatDurationDays(reservation.startDate, reservation.endDate)}
                      </td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{formatCurrency(reservation.totalPrice)}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{paymentStatusLabels[reservation.paymentStatus]}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{depositStatusLabels[reservation.depositStatus]}</td>
                      <td className="py-4 pr-4 text-sm text-slate-600">{bookingStatusLabels[reservation.status]}</td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/bookings/${reservation.id}`}>Voir</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
