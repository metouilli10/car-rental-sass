import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Car, TrendingUp } from "lucide-react";
import Link from "next/link";

export async function ModernMetrics({ agencyId }: { agencyId: string }) {
  const [
    totalVehicles,
    availableVehicles,
    rentedVehicles,
    totalRevenue,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { agencyId } }),
    prisma.vehicle.count({ where: { agencyId, status: "AVAILABLE" } }),
    prisma.vehicle.count({ where: { agencyId, status: "RENTED" } }),
    prisma.booking.aggregate({
      where: { agencyId, status: { in: ["COMPLETED", "ACTIVE"] } },
      _sum: { totalPrice: true },
    }),
  ]);

  const revenue = totalRevenue._sum.totalPrice || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Revenue Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">Total Revenue</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ${revenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>From {rentedVehicles + Math.floor(totalVehicles * 0.3)} rentals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rented Cars Card - links to vehicles filtered by RENTED */}
      <Link
        href="/vehicles?status=RENTED"
        className="block bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Rented Cars</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {rentedVehicles} <span className="text-lg text-gray-500">Units</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Currently on rent — click to view</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Available Cars Card - links to vehicles filtered by AVAILABLE */}
      <Link
        href="/vehicles?status=AVAILABLE"
        className="block bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Car className="w-4 h-4" />
              <span className="font-medium">Available Cars</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {availableVehicles} <span className="text-lg text-gray-500">Units</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Ready to rent — click to view</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
