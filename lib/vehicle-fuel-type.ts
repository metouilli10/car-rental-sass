import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma, VehicleStatus } from "@prisma/client";

export type VehicleFuelType = "DIESEL" | "ESSENCE" | "HYBRID" | "ELECTRIC";
type RawExecutor = Pick<typeof prisma, "$executeRaw" | "$executeRawUnsafe">;
type VehicleCompatSelect = { id?: true; plate?: true };
type VehicleCompatCreateData = Omit<Prisma.VehicleUncheckedCreateInput, "fuelType">;
type VehicleCompatUpdateData = Omit<Prisma.VehicleUncheckedUpdateInput, "fuelType">;
type VehicleWriteValue = string | number | boolean | Date | null | number[];

function isPlainObject(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

let cachedHasFuelTypeColumn: boolean | null = null;

function vehicleColumnCast(column: string) {
  switch (column) {
    case "status":
      return '::"VehicleStatus"';
    case "gearbox":
      return '::"Gearbox"';
    case "insuranceReminderDays":
    case "technicalInspectionReminderDays":
    case "vignetteReminderDays":
      return "::int[]";
    default:
      return "";
  }
}

function buildReturningClause(select?: VehicleCompatSelect) {
  const columns = Object.entries(select ?? { id: true })
    .filter(([, enabled]) => enabled)
    .map(([column]) => `"${column}"`);

  return columns.length > 0 ? columns : ['"id"'];
}

function normalizeVehicleUpdateData(data: VehicleCompatUpdateData) {
  const normalizedEntries = Object.entries(data).filter(([, value]) => {
    if (value === undefined) {
      return false;
    }

    if (value === null || value instanceof Date || Array.isArray(value)) {
      return true;
    }

    return !isPlainObject(value);
  });

  return Object.fromEntries(normalizedEntries) as Record<string, VehicleWriteValue>;
}

function normalizeVehicleCreateData(data: VehicleCompatCreateData) {
  const normalizedEntries = Object.entries(data).filter(([, value]) => {
    if (value === undefined) {
      return false;
    }

    if (value === null || value instanceof Date || Array.isArray(value)) {
      return true;
    }

    return !isPlainObject(value);
  });

  return Object.fromEntries(normalizedEntries) as Record<string, VehicleWriteValue>;
}

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

export async function createVehicleCompat<T extends Record<string, unknown>>(
  data: VehicleCompatCreateData,
  select?: VehicleCompatSelect,
) {
  if (await hasVehicleFuelTypeColumn()) {
    return prisma.vehicle.create({
      data,
      select: select ?? { id: true },
    }) as unknown as Promise<T>;
  }

  const now = new Date();
  const createData = {
    ...normalizeVehicleCreateData(data),
    id: data.id ?? randomUUID(),
    createdAt: now,
    updatedAt: now,
  } satisfies Record<string, VehicleWriteValue>;

  const columns = Object.keys(createData);
  const values = Object.values(createData);
  const placeholders = columns.map((column, index) => `$${index + 1}${vehicleColumnCast(column)}`);
  const returningClause = buildReturningClause(select).join(", ");
  const query = `
    INSERT INTO "vehicles" (${columns.map((column) => `"${column}"`).join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING ${returningClause}
  `;

  const rows = await prisma.$queryRawUnsafe<Array<T>>(query, ...values);
  return rows[0];
}

export async function updateVehicleCompat<T extends Record<string, unknown>>(
  vehicleId: string,
  data: VehicleCompatUpdateData,
  select?: VehicleCompatSelect,
) {
  if (await hasVehicleFuelTypeColumn()) {
    return prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      select: select ?? { id: true },
    }) as unknown as Promise<T>;
  }

  const updateData = {
    ...normalizeVehicleUpdateData(data),
    updatedAt: new Date(),
  };
  const columns = Object.keys(updateData);
  const values = Object.values(updateData);

  if (columns.length === 0) {
    const returningClause = buildReturningClause(select).join(", ");
    const rows = await prisma.$queryRawUnsafe<Array<T>>(
      `SELECT ${returningClause} FROM "vehicles" WHERE "id" = $1 LIMIT 1`,
      vehicleId,
    );
    return rows[0];
  }

  const assignments = columns.map(
    (column, index) => `"${column}" = $${index + 1}${vehicleColumnCast(column)}`,
  );
  const returningClause = buildReturningClause(select).join(", ");
  const query = `
    UPDATE "vehicles"
    SET ${assignments.join(", ")}
    WHERE "id" = $${columns.length + 1}
    RETURNING ${returningClause}
  `;

  const rows = await prisma.$queryRawUnsafe<Array<T>>(query, ...values, vehicleId);
  return rows[0];
}

export async function updateVehicleStatusCompat(
  executor: RawExecutor,
  vehicleId: string,
  status: VehicleStatus,
  hasFuelTypeColumn?: boolean,
) {
  const resolvedHasFuelTypeColumn =
    typeof hasFuelTypeColumn === "boolean"
      ? hasFuelTypeColumn
      : await hasVehicleFuelTypeColumn();

  if (resolvedHasFuelTypeColumn) {
    await executor.$executeRaw`
      UPDATE "vehicles"
      SET "status" = CAST(${status} AS "VehicleStatus")
      WHERE id = ${vehicleId}
    `;
    return;
  }

  await executor.$executeRawUnsafe(
    'UPDATE "vehicles" SET "status" = $1::"VehicleStatus" WHERE id = $2',
    status,
    vehicleId,
  );
}
