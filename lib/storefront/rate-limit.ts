import { consumeRateLimit } from "@/lib/security/rate-limit-store";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 8;

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function assertPublicStorefrontRateLimit(slug: string, ip: string) {
  const result = await consumeRateLimit({
    scope: "public-storefront:booking-request",
    key: `${slug}:${ip}`,
    windowMs: envNumber("PUBLIC_STOREFRONT_WINDOW_MS", DEFAULT_WINDOW_MS),
    maxRequests: envNumber("PUBLIC_STOREFRONT_MAX_REQUESTS", DEFAULT_MAX_REQUESTS),
  });

  if (!result.allowed) {
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }
}
