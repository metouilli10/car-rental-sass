import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: session.user.agencyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Véhicules"
        description="Gérez votre parc automobile"
        action={{
          label: "Ajouter un véhicule",
          href: "/vehicles/add",
        }}
      />

      {vehicles.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">Aucun véhicule enregistré</p>
          <Button asChild>
            <Link href="/vehicles/add">Ajouter votre premier véhicule</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Couleur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix/Jour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{vehicle.make}</div>
                      <div className="text-sm text-gray-500">{vehicle.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vehicle.plate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vehicle.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(vehicle.pricePerDay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={vehicle.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/vehicles/${vehicle.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Link>
                        </Button>
                        <DeleteVehicleButton vehicleId={vehicle.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
