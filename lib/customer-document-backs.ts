import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const supportsCustomerDocumentBacks = cache(async () => {
  try {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customers'
        AND column_name IN ('passportPhotoBackUrl', 'licensePhotoBackUrl')
    `);

    const columns = new Set(rows.map((row) => row.column_name));
    return columns.has("passportPhotoBackUrl") && columns.has("licensePhotoBackUrl");
  } catch (error) {
    console.error("customer document backs support check failed:", error);
    return false;
  }
});
