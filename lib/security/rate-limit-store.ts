import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConsumeRateLimitParams = {
  scope: string;
  key: string;
  windowMs: number;
  maxRequests: number;
  lockoutMs?: number;
};

export type ConsumeRateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
  count: number;
};

type BucketRow = {
  id: string;
  count: number;
  windowStartAt: Date;
  lockedUntil: Date | null;
};

const SERIALIZATION_RETRY_CODES = new Set(["P2034"]);

function computeRetryAfterSec(until: Date, nowMs: number): number {
  return Math.max(1, Math.ceil((until.getTime() - nowMs) / 1000));
}

async function withSerializableRetry<T>(callback: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        !SERIALIZATION_RETRY_CODES.has(error.code) ||
        attempt === maxAttempts
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function consumeRateLimit(
  params: ConsumeRateLimitParams,
): Promise<ConsumeRateLimitResult> {
  const { scope, key, windowMs, maxRequests, lockoutMs } = params;
  const now = new Date();
  const nowMs = now.getTime();

  return withSerializableRetry(async () =>
    prisma.$transaction(
      async (tx) => {
        const bucket = await tx.rateLimitBucket.findUnique({
          where: {
            scope_key: { scope, key },
          },
          select: {
            id: true,
            count: true,
            windowStartAt: true,
            lockedUntil: true,
          },
        });

        if (!bucket) {
          await tx.rateLimitBucket.create({
            data: {
              scope,
              key,
              count: 1,
              windowStartAt: now,
            },
          });

          return {
            allowed: true,
            retryAfterSec: 0,
            count: 1,
          };
        }

        if (bucket.lockedUntil && bucket.lockedUntil.getTime() > nowMs) {
          return {
            allowed: false,
            retryAfterSec: computeRetryAfterSec(bucket.lockedUntil, nowMs),
            count: bucket.count,
          };
        }

        const isWindowExpired = nowMs - bucket.windowStartAt.getTime() > windowMs;
        const nextCount = isWindowExpired ? 1 : bucket.count + 1;
        const nextWindowStartAt = isWindowExpired ? now : bucket.windowStartAt;

        if (!isWindowExpired && bucket.count >= maxRequests) {
          const lockedUntil = lockoutMs ? new Date(nowMs + lockoutMs) : null;

          await tx.rateLimitBucket.update({
            where: { id: bucket.id },
            data: {
              count: bucket.count,
              lockedUntil,
            },
          });

          return {
            allowed: false,
            retryAfterSec: lockedUntil
              ? computeRetryAfterSec(lockedUntil, nowMs)
              : computeRetryAfterSec(new Date(bucket.windowStartAt.getTime() + windowMs), nowMs),
            count: bucket.count,
          };
        }

        await tx.rateLimitBucket.update({
          where: { id: bucket.id },
          data: {
            count: nextCount,
            windowStartAt: nextWindowStartAt,
            lockedUntil: null,
          },
        });

        return {
          allowed: true,
          retryAfterSec: 0,
          count: nextCount,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

export async function resetRateLimit(scope: string, key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({
    where: { scope, key },
  });
}

export async function clearExpiredRateLimits(referenceDate = new Date()): Promise<number> {
  const result = await prisma.rateLimitBucket.deleteMany({
    where: {
      OR: [
        {
          lockedUntil: {
            not: null,
            lt: referenceDate,
          },
          windowStartAt: {
            lt: new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000),
          },
        },
        {
          lockedUntil: null,
          windowStartAt: {
            lt: new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  return result.count;
}
