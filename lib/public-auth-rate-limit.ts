import { consumeRateLimit } from "@/lib/security/rate-limit-store";

type ActionName = "signup" | "resend";

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig(action: ActionName) {
  if (action === "signup") {
    return {
      windowMs: envNumber("PUBLIC_SIGNUP_WINDOW_MS", DEFAULT_WINDOW_MS),
      maxRequests: envNumber("PUBLIC_SIGNUP_MAX_ATTEMPTS", DEFAULT_MAX_REQUESTS),
    };
  }

  return {
    windowMs: envNumber("PUBLIC_RESEND_WINDOW_MS", DEFAULT_WINDOW_MS),
    maxRequests: envNumber("PUBLIC_RESEND_MAX_ATTEMPTS", DEFAULT_MAX_REQUESTS),
  };
}

function getKey(action: ActionName, email: string, ip: string): string {
  return `${action}:${email}:${ip}`;
}

export async function assertPublicAuthRateLimit(
  action: ActionName,
  email: string,
  ip: string,
): Promise<void> {
  const { maxRequests, windowMs } = getConfig(action);
  const result = await consumeRateLimit({
    scope: `public-auth:${action}`,
    key: getKey(action, email, ip),
    windowMs,
    maxRequests,
  });

  if (!result.allowed) {
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }
}
