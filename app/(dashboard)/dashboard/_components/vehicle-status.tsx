import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/shared/status-badge";
import { Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function VehicleStatus({ agencyId }: { agencyId: string }) {
  const vehiclesByStatus = await prisma.vehicle.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { id: true },
  });

  return (
    <div className="animate-fade-in-up delay-300">
      <Card className="border-2 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-warm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">État du parc</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {vehiclesByStatus.map((group, index) => (
              <div
                key={group.status}
                className="group relative flex items-center justify-between p-6 border-2 border-border rounded-xl hover-lift overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
                <div className="relative z-10 space-y-3">
                  <StatusBadge status={group.status} />
                  <p className="text-4xl font-bold">{group._count.id}</p>
                </div>
                <Car className="relative z-10 h-12 w-12 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
