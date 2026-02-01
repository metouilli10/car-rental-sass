import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Car, DollarSign, Calendar, AlertCircle } from "lucide-react";

export async function MetricsCards({ agencyId }: { agencyId: string }) {
  const [
    totalVehicles,
    availableVehicles,
    rentedVehicles,
    depositsHeld,
    pendingPayments,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { agencyId } }),
    prisma.vehicle.count({ where: { agencyId, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { agencyId, status: "RENTED" } }),
    prisma.deposit.aggregate({
      where: { booking: { agencyId }, status: "HELD" },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { booking: { agencyId }, status: "PENDING" },
    }),
  ]);

  const depositsHeldAmount = depositsHeld._sum.amount || 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up delay-100">
      <div className="group relative p-6 rounded-2xl border-2 border-border bg-card hover-lift overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div className="px-2 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
              Actif
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{rentedVehicles}</p>
          <p className="text-sm font-medium text-foreground mb-1">Voitures louées</p>
          <p className="text-xs text-muted-foreground">sur {totalVehicles} véhicules</p>
        </div>
      </div>

      <div className="group relative p-6 rounded-2xl border-2 border-border bg-card hover-lift overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
            <div className="px-2 py-1 rounded-full bg-green-500/10 text-xs font-semibold text-green-700">
              Disponible
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{availableVehicles}</p>
          <p className="text-sm font-medium text-foreground mb-1">Disponibles</p>
          <p className="text-xs text-muted-foreground">Prêts à louer</p>
        </div>
      </div>

      <div className="group relative p-6 rounded-2xl border-2 border-border bg-card hover-lift overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">{formatCurrency(depositsHeldAmount)}</p>
          <p className="text-sm font-medium text-foreground mb-1">Cautions retenues</p>
          <p className="text-xs text-muted-foreground">En sécurité</p>
        </div>
      </div>

      <div className="group relative p-6 rounded-2xl border-2 border-border bg-card hover-lift overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="px-2 py-1 rounded-full bg-orange-500/10 text-xs font-semibold text-orange-700">
              En attente
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{pendingPayments}</p>
          <p className="text-sm font-medium text-foreground mb-1">Paiements en attente</p>
          <p className="text-xs text-muted-foreground">À encaisser</p>
        </div>
      </div>
    </div>
  );
}
