import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  Car,
  Wrench,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format, isBefore, isToday, isTomorrow, isPast } from "date-fns";
import { fr } from "date-fns/locale";

type VehicleStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE";

interface VehicleCard {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: VehicleStatus;
  // For rented vehicles
  clientName?: string;
  returnDate?: Date;
  isOverdue?: boolean;
}

export async function VehicleStatusGrid({
  agencyId,
}: {
  agencyId: string;
}) {
  const now = new Date();

  // Fetch all vehicles with active bookings for rented ones
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId },
    include: {
      bookings: {
        where: {
          status: "ACTIVE",
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { endDate: "asc" },
        take: 1, // Get the current active booking
      },
    },
    orderBy: [{ status: "asc" }, { make: "asc" }, { model: "asc" }],
  });

  // Group vehicles by status
  const available: VehicleCard[] = [];
  const rented: VehicleCard[] = [];
  const maintenance: VehicleCard[] = [];
  const unavailable: VehicleCard[] = []; // For future use

  vehicles.forEach((vehicle) => {
    const activeBooking = vehicle.bookings[0];

    const card: VehicleCard = {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      plate: vehicle.plate,
      status: vehicle.status,
    };

    if (vehicle.status === "AVAILABLE") {
      available.push(card);
    } else if (vehicle.status === "RENTED" && activeBooking) {
      const returnDate = new Date(activeBooking.endDate);
      const isOverdue = isPast(returnDate);

      rented.push({
        ...card,
        clientName: activeBooking.customer.name,
        returnDate,
        isOverdue,
      });
    } else if (vehicle.status === "MAINTENANCE") {
      maintenance.push(card);
    }
  });

  const statusColumns = [
    {
      id: "available",
      label: "Disponible",
      icon: CheckCircle2,
      dot: "bg-emerald-500",
      borderColor: "border-emerald-200",
      bgColor: "bg-emerald-50/50",
      count: available.length,
      vehicles: available,
    },
    {
      id: "rented",
      label: "En location",
      icon: Car,
      dot: "bg-blue-500",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50/50",
      count: rented.length,
      vehicles: rented,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      dot: "bg-amber-500",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50/50",
      count: maintenance.length,
      vehicles: maintenance,
    },
    {
      id: "unavailable",
      label: "Indisponible",
      icon: XCircle,
      dot: "bg-red-500",
      borderColor: "border-red-200",
      bgColor: "bg-red-50/50",
      count: unavailable.length,
      vehicles: unavailable,
    },
  ];

  const getReturnTimeDisplay = (returnDate: Date) => {
    if (isToday(returnDate)) {
      return `Retour ${format(returnDate, "HH'h'mm")}`;
    }
    if (isTomorrow(returnDate)) {
      return "Retour demain";
    }
    return `Retour ${format(returnDate, "dd MMM", { locale: fr })}`;
  };

  const maxVisible = 5;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Car className="w-5 h-5 text-muted-foreground" />
          Flotte - État des véhicules
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop: Horizontal columns */}
        <div className="hidden md:grid md:grid-cols-4">
          {statusColumns.map((column) => {
            const Icon = column.icon;
            const visibleVehicles = column.vehicles.slice(0, maxVisible);
            const remainingCount = Math.max(
              0,
              column.vehicles.length - maxVisible
            );

            return (
              <div
                key={column.id}
                className={`border-r last:border-r-0 ${column.borderColor} ${column.bgColor}`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {column.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold text-gray-900">
                      {column.count}
                    </span>
                  </div>
                </div>

                {/* Vehicle Cards */}
                <div className="p-3 space-y-2">
                  {visibleVehicles.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Aucun véhicule
                    </p>
                  ) : (
                    <>
                      {visibleVehicles.map((vehicle) => (
                        <Link
                          key={vehicle.id}
                          href={`/vehicles/${vehicle.id}`}
                          className="block p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                          {/* Vehicle Model & Plate */}
                          <div className="mb-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {vehicle.plate}
                            </p>
                          </div>

                          {/* Rented: Client & Return Info */}
                          {vehicle.status === "RENTED" &&
                            vehicle.clientName &&
                            vehicle.returnDate && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-700 truncate mb-1">
                                  {vehicle.clientName}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  {vehicle.isOverdue ? (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      En retard
                                    </Badge>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {getReturnTimeDisplay(vehicle.returnDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </Link>
                      ))}

                      {remainingCount > 0 && (
                        <Link
                          href={`/vehicles?status=${column.id.toUpperCase()}`}
                          className="block p-2 text-center text-xs font-medium text-primary hover:underline"
                        >
                          +{remainingCount} autre{remainingCount > 1 ? "s" : ""}
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical stack with horizontal scroll option */}
        <div className="md:hidden overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {statusColumns.map((column) => {
              const Icon = column.icon;
              const visibleVehicles = column.vehicles.slice(0, maxVisible);
              const remainingCount = Math.max(
                0,
                column.vehicles.length - maxVisible
              );

              return (
                <div
                  key={column.id}
                  className={`flex-shrink-0 w-64 rounded-lg border-2 ${column.borderColor} ${column.bgColor}`}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${column.dot}`}
                      />
                      <h3 className="text-sm font-semibold text-gray-900">
                        {column.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-bold text-gray-900">
                        {column.count}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Cards */}
                  <div className="p-3 space-y-2">
                    {visibleVehicles.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Aucun véhicule
                      </p>
                    ) : (
                      <>
                        {visibleVehicles.map((vehicle) => (
                          <Link
                            key={vehicle.id}
                            href={`/vehicles/${vehicle.id}`}
                            className="block p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all"
                          >
                            {/* Vehicle Model & Plate */}
                            <div className="mb-1.5">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground">
                                {vehicle.plate}
                              </p>
                            </div>

                            {/* Rented: Client & Return Info */}
                            {vehicle.status === "RENTED" &&
                              vehicle.clientName &&
                              vehicle.returnDate && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <p className="text-xs text-gray-700 truncate mb-1">
                                    {vehicle.clientName}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    {vehicle.isOverdue ? (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        En retard
                                      </Badge>
                                    ) : (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {getReturnTimeDisplay(
                                          vehicle.returnDate
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </Link>
                        ))}

                        {remainingCount > 0 && (
                          <Link
                            href={`/vehicles?status=${column.id.toUpperCase()}`}
                            className="block p-2 text-center text-xs font-medium text-primary hover:underline"
                          >
                            +{remainingCount} autre
                            {remainingCount > 1 ? "s" : ""}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
