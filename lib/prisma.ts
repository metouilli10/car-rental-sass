import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function withServerlessPoolTuning(url: string | undefined): string | undefined {
  if (!url) return url;
  // In serverless environments, keep Prisma's internal pool tiny and wait longer.
  // This avoids pool checkout starvation when many short-lived lambdas run concurrently.
  if (process.env.NODE_ENV !== "production") return url;

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const tunedDatabaseUrl = withServerlessPoolTuning(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(tunedDatabaseUrl
      ? {
          datasources: {
            db: { url: tunedDatabaseUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
