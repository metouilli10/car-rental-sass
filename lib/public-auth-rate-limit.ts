type RateLimitState = {
  count: number;
  windowStartMs: number;
};

type ActionName = "signup" | "resend";

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;

const globalRateLimiter = globalThis as typeof globalThis & {
  publicAuthRateLimiter?: Map<string, RateLimitState>;
};

const rateLimiter = globalRateLimiter.publicAuthRateLimiter ?? new Map<string, RateLimitState>();
if (process.env.NODE_ENV !== "production") {
  globalRateLimiter.publicAuthRateLimiter = rateLimiter;
}

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

export function assertPublicAuthRateLimit(action: ActionName, email: string, ip: string): void {
  const { maxRequests, windowMs } = getConfig(action);
  const now = Date.now();
  const key = getKey(action, email, ip);
  const current = rateLimiter.get(key);

  if (!current || now - current.windowStartMs > windowMs) {
    rateLimiter.set(key, { count: 1, windowStartMs: now });
    return;
  }

  if (current.count >= maxRequests) {
    throw new Error("Trop de tentatives. Réessayez plus tard.");
  }

  current.count += 1;
  rateLimiter.set(key, current);
}
