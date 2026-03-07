import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function withServerlessPoolTuning(url: string | undefined): string | undefined {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const usesSupabasePooler =
      parsed.hostname.includes("pooler.supabase.com") ||
      parsed.searchParams.get("pgbouncer") === "true";

    // Supabase pooler / pgbouncer needs a very small Prisma pool to avoid
    // exhausting "max clients" when many app queries execute in parallel.
    if (!usesSupabasePooler && process.env.NODE_ENV !== "production") {
      return url;
    }

    const defaultConnectionLimit = process.env.NODE_ENV === "production" ? "1" : "5";
    const defaultPoolTimeout = process.env.NODE_ENV === "production" ? "30" : "60";
    const configuredConnectionLimit = process.env.PRISMA_CONNECTION_LIMIT || defaultConnectionLimit;
    const configuredPoolTimeout = process.env.PRISMA_POOL_TIMEOUT || defaultPoolTimeout;

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", configuredConnectionLimit);
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", configuredPoolTimeout);
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
