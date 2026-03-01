import { PrismaClient } from "@prisma/client";
import { brandKeyFromMake } from "../lib/brands";

const prisma = new PrismaClient();

async function main() {
  const agencyId = process.env.AGENCY_ID?.trim() || undefined;
  const batchSize = 200;
  let cursor: string | undefined;
  let scanned = 0;
  let updated = 0;

  console.log(
    agencyId
      ? `Backfilling vehicle brand keys for agency ${agencyId}`
      : "Backfilling vehicle brand keys for all agencies",
  );

  while (true) {
    const vehicles = await prisma.vehicle.findMany({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      select: {
        id: true,
        agencyId: true,
        make: true,
        brandKey: true,
      },
    });

    if (vehicles.length === 0) {
      break;
    }

    for (const vehicle of vehicles) {
      scanned += 1;
      const nextBrandKey = brandKeyFromMake(vehicle.make);

      if (vehicle.brandKey === nextBrandKey) {
        continue;
      }

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { brandKey: nextBrandKey },
      });

      updated += 1;
    }

    cursor = vehicles[vehicles.length - 1]?.id;
  }

  console.log(`Scanned ${scanned} vehicles`);
  console.log(`Updated ${updated} vehicles`);
}

main()
  .catch((error) => {
    console.error("Vehicle brand key backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
