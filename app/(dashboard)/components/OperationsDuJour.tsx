import { formatDate, formatTime } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Clock, FileText, Camera, ArrowRight, ChevronRight } from "lucide-react";
import { FlatIcon } from "@/components/shared/flat-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { OperationsDateNav } from "./OperationsDateNav";

type OperationBooking = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  customer: { name: string; phone: string };
  vehicle: { make: string; model: string; plate: string; color: string };
  damageReports: { id: string }[];
};

export async function OperationsDuJour({ agencyId, date }: { agencyId: string; date?: string }) {
  const selectedDate = date ? new Date(date) : new Date();
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const isToday = isSameDay(selectedDate, new Date());

  // Server-side data fetching -- no client round-trip needed
  const bookings: OperationBooking[] = await prisma.booking.findMany({
    where: {
      agencyId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
      OR: [
        { startDate: { gte: dayStart, lte: dayEnd } },
        { endDate: { gte: dayStart, lte: dayEnd } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { make: true, model: true, plate: true, color: true } },
      damageReports: { select: { id: true }, take: 1, orderBy: { reportedAt: "desc" } },
    },
    orderBy: { startDate: "asc" },
  });

  // Fetch upcoming days only if today has no operations
  let upcomingDays: { date: Date; dateISO: string; departures: number; returns: number; total: number }[] = [];
  if (isToday && bookings.length === 0) {
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfRange = new Date(startOfTomorrow);
    endOfRange.setDate(endOfRange.getDate() + 7);
    endOfRange.setHours(23, 59, 59, 999);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        agencyId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        OR: [
          { startDate: { gte: startOfTomorrow, lte: endOfRange } },
          { endDate: { gte: startOfTomorrow, lte: endOfRange } },
        ],
      },
      select: { startDate: true, endDate: true },
    });

    const dayMap: Record<string, { departures: number; returns: number }> = {};
    const tomorrowStr = startOfTomorrow.toISOString().split("T")[0];
    for (const b of upcomingBookings) {
      const startKey = b.startDate.toISOString().split("T")[0];
      const endKey = b.endDate.toISOString().split("T")[0];
      if (startKey >= tomorrowStr) {
        if (!dayMap[startKey]) dayMap[startKey] = { departures: 0, returns: 0 };
        dayMap[startKey].departures++;
      }
      if (endKey >= tomorrowStr) {
        if (!dayMap[endKey]) dayMap[endKey] = { departures: 0, returns: 0 };
        dayMap[endKey].returns++;
      }
    }

    upcomingDays = Object.entries(dayMap)
      .map(([d, counts]) => ({
        date: new Date(d + "T00:00:00"),
        dateISO: d,
        departures: counts.departures,
        returns: counts.returns,
        total: counts.departures + counts.returns,
      }))
      .filter((d) => d.total > 0)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }

  // Compute operations from server-fetched bookings
  const selectedDateString = selectedDate.toDateString();
  const pickups = bookings.filter((b) => b.startDate.toDateString() === selectedDateString);
  const returns = bookings.filter((b) => b.endDate.toDateString() === selectedDateString);

  type OpType = "sortie" | "retour";
  const operations: { type: OpType; booking: OperationBooking; time: Date }[] = [];
  for (const booking of bookings) {
    if (booking.startDate.toDateString() === selectedDateString) {
      operations.push({ type: "sortie", booking, time: booking.startDate });
    }
    if (booking.endDate.toDateString() === selectedDateString) {
      operations.push({ type: "retour", booking, time: booking.endDate });
    }
  }
  operations.sort((a, b) => a.time.getTime() - b.time.getTime());
  const totalOperations = operations.length;

  const formatRelativeDate = (d: Date): string => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    if (isSameDay(d, today)) return "Aujourd'hui";
    if (isSameDay(d, tomorrow)) return "Demain";
    return format(d, "EEE dd/MM", { locale: fr });
  };

  return (
    <Card className="bg-white shadow-lg transition-all duration-200">
      <CardHeader className="pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FlatIcon name="schedule" size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Opérations du Jour
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <OperationsDateNav currentDate={format(selectedDate, "yyyy-MM-dd")} />
                <span className="text-xs text-muted-foreground/60 ml-2">
                  &bull; {totalOperations} opération{totalOperations > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              {pickups.length} départ{pickups.length > 1 ? "s" : ""}
            </Badge>
            <Badge variant="info" className="text-xs">
              {returns.length} retour{returns.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {totalOperations === 0 ? (
          <div className="py-6 px-6">
            {isToday && upcomingDays.length > 0 ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground/75 font-medium">
                    Aucune opération aujourd&apos;hui
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <FlatIcon name="booking" size={18} />
                    <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      Prochaines opérations
                    </p>
                  </div>

                  {upcomingDays.slice(0, 3).map((day) => (
                    <Link
                      key={day.dateISO}
                      href={`/bookings?date=${day.dateISO}`}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {formatRelativeDate(day.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3 text-xs">
                          {day.departures > 0 && (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              {day.departures} départ{day.departures > 1 ? "s" : ""}
                            </span>
                          )}
                          {day.returns > 0 && (
                            <span className="text-blue-600 flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3" />
                              {day.returns} retour{day.returns > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Button variant="link" size="sm" className="text-blue-600" asChild>
                    <Link href="/bookings">
                      Voir le calendrier complet
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-muted-foreground/75 font-medium">
                  Aucune opération prévue {isToday ? "cette semaine" : "ce jour"}
                </p>
                <Button variant="link" size="sm" className="mt-4 text-blue-600" asChild>
                  <Link href="/bookings">
                    Voir le calendrier
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {operations.map((op, index) => {
              const { type, booking, time } = op;
              const isSortie = type === "sortie";
              const statusLabel = booking.status === "ACTIVE" ? "En cours" : "Confirmé";

              return (
                <div
                  key={`${booking.id}-${type}-${index}`}
                  className="flex items-center gap-4 px-5 py-7 rounded-xl hover:bg-muted/40 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex-shrink-0 w-12 pl-1 text-left tabular-nums border-l border-border/15">
                    <p className="text-sm font-medium text-muted-foreground/50">
                      {formatTime(time)}
                    </p>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                      isSortie ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    }`}
                    title={isSortie ? "Sortie" : "Retour"}
                  >
                    {isSortie ? (
                      <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>

                  <Link href={`/bookings/${booking.id}`} className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {booking.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground/55 truncate">
                      {booking.vehicle.make} {booking.vehicle.model}{" "}
                      <span className="font-mono text-xs">{booking.vehicle.plate}</span>
                    </p>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0 ml-auto">
                    <Badge
                      className={
                        booking.status === "ACTIVE"
                          ? "border border-emerald-300/60 bg-emerald-200 text-emerald-800 font-semibold px-2.5 py-0.5"
                          : "border border-blue-300/60 bg-blue-200 text-blue-800 font-semibold px-2.5 py-0.5"
                      }
                    >
                      {statusLabel}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      {isSortie ? (
                        <Link href={`/bookings/${booking.id}`} title="Voir réservation">
                          <FileText className="w-4 h-4" />
                          Détails
                        </Link>
                      ) : booking.damageReports.length > 0 ? (
                        <Link
                          href={`/damage-reports/${booking.damageReports[0].id}`}
                          title="Inspection"
                        >
                          <Camera className="w-4 h-4" />
                          Inspection
                        </Link>
                      ) : (
                        <Link href={`/damage-reports/new?bookingId=${booking.id}`} title="Nouvelle inspection">
                          <Camera className="w-4 h-4" />
                          Inspection
                        </Link>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
