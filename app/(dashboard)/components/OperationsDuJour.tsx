'use client';

import { useState, useEffect } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, ArrowUpRight, ArrowDownLeft, Clock, FileText, Camera, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, isSameDay, subDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";

type UpcomingDay = {
  date: Date;
  dateISO: string;
  departures: number;
  returns: number;
  total: number;
};

export function OperationsDuJour({ agencyId }: { agencyId: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDay[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    async function fetchOperations() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/operations?date=${format(selectedDate, 'yyyy-MM-dd')}`
        );
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error('Failed to fetch operations:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOperations();
  }, [selectedDate]);

  // Fetch upcoming operations when viewing today with no operations
  useEffect(() => {
    async function fetchUpcoming() {
      if (!isToday || loading || bookings.length > 0) {
        setUpcomingDays([]);
        return;
      }

      setLoadingUpcoming(true);
      try {
        const upcoming: UpcomingDay[] = [];
        const today = new Date();

        // Fetch next 7 days
        for (let i = 1; i <= 7; i++) {
          const date = addDays(today, i);
          const response = await fetch(
            `/api/operations?date=${format(date, 'yyyy-MM-dd')}`
          );
          const data = await response.json();
          const dayBookings = data.bookings || [];

          const dateString = date.toDateString();
          const departures = dayBookings.filter(
            (b: any) => new Date(b.startDate).toDateString() === dateString
          ).length;
          const returns = dayBookings.filter(
            (b: any) => new Date(b.endDate).toDateString() === dateString
          ).length;
          const total = departures + returns;

          if (total > 0) {
            upcoming.push({
              date,
              dateISO: format(date, 'yyyy-MM-dd'),
              departures,
              returns,
              total
            });
          }
        }

        setUpcomingDays(upcoming);
      } catch (error) {
        console.error('Failed to fetch upcoming operations:', error);
        setUpcomingDays([]);
      } finally {
        setLoadingUpcoming(false);
      }
    }

    fetchUpcoming();
  }, [isToday, loading, bookings.length]);

  const selectedDateString = selectedDate.toDateString();
  const todayBookings = bookings;

  // Helper to format relative dates
  const formatRelativeDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, tomorrow)) return "Demain";
    return format(date, "EEE dd/MM", { locale: fr });
  };

  const pickups = todayBookings.filter(
    (b) => new Date(b.startDate).toDateString() === selectedDateString
  );
  const returns = todayBookings.filter(
    (b) => new Date(b.endDate).toDateString() === selectedDateString
  );

  type OpType = "sortie" | "retour";
  const operations: { type: OpType; booking: (typeof todayBookings)[number]; time: Date }[] = [];
  for (const booking of todayBookings) {
    if (new Date(booking.startDate).toDateString() === selectedDateString) {
      operations.push({ type: "sortie", booking, time: new Date(booking.startDate) });
    }
    if (new Date(booking.endDate).toDateString() === selectedDateString) {
      operations.push({ type: "retour", booking, time: new Date(booking.endDate) });
    }
  }
  operations.sort((a, b) => a.time.getTime() - b.time.getTime());

  const totalOperations = operations.length;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">
                Opérations du Jour
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  title="Jour précédent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600 font-medium min-w-[120px] text-center">
                  {formatDate(selectedDate)}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  title="Jour suivant"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {!isToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="ml-2 h-6 text-xs px-2"
                  >
                    Aujourd&apos;hui
                  </Button>
                )}

                <span className="text-xs text-gray-500 ml-2">
                  • {totalOperations} opération{totalOperations > 1 ? "s" : ""}
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
        {loading ? (
          <div className="py-8 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <p className="text-gray-500 font-medium">
              Chargement des opérations...
            </p>
          </div>
        ) : totalOperations === 0 ? (
          <div className="py-6 px-6">
            {isToday && upcomingDays.length > 0 ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 font-medium">
                    Aucune opération aujourd&apos;hui
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Prochaines opérations
                    </p>
                  </div>

                  {upcomingDays.slice(0, 3).map((day) => (
                    <Link
                      key={day.dateISO}
                      href={`/bookings?date=${day.dateISO}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group"
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
                <p className="text-gray-500 font-medium">
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
          <div className="divide-y divide-blue-100">
            {operations.map((op, index) => {
              const { type, booking, time } = op;
              const isSortie = type === "sortie";
              const statusLabel = booking.status === "ACTIVE" ? "En cours" : "Confirmé";
              const statusVariant = booking.status === "ACTIVE" ? "success" : "info";

              return (
                <div
                  key={`${booking.id}-${type}-${index}`}
                  className="flex items-center gap-4 p-4 hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 text-left tabular-nums">
                    <p className="text-sm font-medium text-gray-700">
                      {formatTime(time)}
                    </p>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSortie ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    }`}
                    title={isSortie ? "Sortie" : "Retour"}
                  >
                    {isSortie ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <Link href={`/bookings/${booking.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {booking.customer.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {booking.vehicle.make} {booking.vehicle.model}{" "}
                      <span className="font-mono text-xs">{booking.vehicle.plate}</span>
                    </p>
                  </Link>

                  <Badge variant={statusVariant} className="text-xs shrink-0">
                    {statusLabel}
                  </Badge>

                  <div className="shrink-0">
                    {isSortie ? (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <Link href={`/contracts/${booking.id}`} title="Contrat">
                          <FileText className="w-4 h-4" />
                          Contrat
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        {booking.damageReport ? (
                          <Link
                            href={`/damage-reports/${booking.damageReport.id}`}
                            title="Dégâts"
                          >
                            <Camera className="w-4 h-4" />
                            Dégâts
                          </Link>
                        ) : (
                          <Link href="/damage-reports/new" title="Ajouter dégâts">
                            <Camera className="w-4 h-4" />
                            Dégâts
                          </Link>
                        )}
                      </Button>
                    )}
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
