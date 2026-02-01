import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function TodayActivity({ agencyId }: { agencyId: string }) {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const todayDateString = new Date().toDateString();

  const todayBookings = await prisma.booking.findMany({
    where: {
      agencyId,
      OR: [
        { startDate: { gte: todayStart, lt: todayEnd } },
        { endDate: { gte: todayStart, lt: todayEnd } },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      customer: { select: { name: true } },
      vehicle: { select: { make: true, model: true, plate: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="animate-fade-in-up delay-200">
      <Card className="border-2 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">Activité d'aujourd'hui</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {todayBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                Aucune activité prévue aujourd'hui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map((booking, index) => {
                const isPickup =
                  new Date(booking.startDate).toDateString() === todayDateString;
                const isReturn =
                  new Date(booking.endDate).toDateString() === todayDateString;

                return (
                  <div
                    key={booking.id}
                    className="group relative flex items-center justify-between p-4 border-2 border-border rounded-xl hover:border-primary/50 transition-all duration-300 hover-lift"
                  >
                    <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    <div className="relative z-10 space-y-2 flex-1">
                      <p className="font-semibold text-lg">{booking.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.vehicle.make} {booking.vehicle.model} · {booking.vehicle.plate}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        {isPickup && (
                          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-700 font-semibold text-xs">
                            📍 Départ
                          </span>
                        )}
                        {isReturn && (
                          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 font-semibold text-xs">
                            🏁 Retour
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                      <StatusBadge status={booking.status} />
                      <Button asChild size="sm" variant="outline" className="rounded-lg font-medium">
                        <Link href={`/bookings/${booking.id}`}>Voir détails</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
