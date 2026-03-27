import { prisma } from "@/lib/prisma";

export type VehicleFuelType = "DIESEL" | "ESSENCE" | "HYBRID" | "ELECTRIC";

let cachedHasFuelTypeColumn: boolean | null = null;

export async function hasVehicleFuelTypeColumn() {
  if (cachedHasFuelTypeColumn != null) return cachedHasFuelTypeColumn;

  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'vehicles'
        AND column_name = 'fuelType'
    ) AS "exists"
  `;

  cachedHasFuelTypeColumn = rows[0]?.exists ?? false;
  return cachedHasFuelTypeColumn;
}

export async function getVehicleFuelType(vehicleId: string): Promise<VehicleFuelType> {
  if (!(await hasVehicleFuelTypeColumn())) {
    return "ESSENCE";
  }

  const rows = await prisma.$queryRaw<Array<{ fuelType: VehicleFuelType | null }>>`
    SELECT "fuelType"::text AS "fuelType"
    FROM "vehicles"
    WHERE id = ${vehicleId}
    LIMIT 1
  `;

  return rows[0]?.fuelType ?? "ESSENCE";
}

export async function persistVehicleFuelType(vehicleId: string, fuelType: VehicleFuelType) {
  if (!(await hasVehicleFuelTypeColumn())) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "vehicles"
    SET "fuelType" = CAST(${fuelType} AS "FuelType")
    WHERE id = ${vehicleId}
  `;
}
