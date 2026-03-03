import type { NextRequest } from "next/server";

type UploadRateState = {
  windowStartMs: number;
  requestCount: number;
  bytesUsed: number;
};

type UploadRateLimitResult =
  | { allowed: true }
  | { allowed: false; status: number; message: string; retryAfterSec: number };

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_MAX_BYTES_PER_WINDOW = 50 * 1024 * 1024; // 50 MB

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const FEATURE_UPLOAD_RATE_LIMIT = envFlag("FEATURE_UPLOAD_RATE_LIMIT");
const UPLOAD_RATE_LIMIT_WINDOW_MS = envNumber(
  "UPLOAD_RATE_LIMIT_WINDOW_MS",
  DEFAULT_WINDOW_MS,
);
const UPLOAD_RATE_LIMIT_MAX_REQUESTS = envNumber(
  "UPLOAD_RATE_LIMIT_MAX_REQUESTS",
  DEFAULT_MAX_REQUESTS,
);
const UPLOAD_MAX_BYTES_PER_WINDOW = envNumber(
  "UPLOAD_MAX_BYTES_PER_WINDOW",
  DEFAULT_MAX_BYTES_PER_WINDOW,
);

const globalForUploadRateLimit = globalThis as typeof globalThis & {
  uploadRateLimitMap?: Map<string, UploadRateState>;
};

const uploadRateLimitMap =
  globalForUploadRateLimit.uploadRateLimitMap ?? new Map<string, UploadRateState>();

if (process.env.NODE_ENV !== "production") {
  globalForUploadRateLimit.uploadRateLimitMap = uploadRateLimitMap;
}

function normalizeClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function buildKey(agencyId: string, clientIp: string, scope: string): string {
  return `${agencyId}::${clientIp}::${scope}`;
}

function getOrCreateState(key: string, nowMs: number): UploadRateState {
  const existing = uploadRateLimitMap.get(key);
  if (existing) {
    if (nowMs - existing.windowStartMs > UPLOAD_RATE_LIMIT_WINDOW_MS) {
      const reset: UploadRateState = {
        windowStartMs: nowMs,
        requestCount: 0,
        bytesUsed: 0,
      };
      uploadRateLimitMap.set(key, reset);
      return reset;
    }
    return existing;
  }

  const created: UploadRateState = {
    windowStartMs: nowMs,
    requestCount: 0,
    bytesUsed: 0,
  };
  uploadRateLimitMap.set(key, created);
  return created;
}

export function enforceUploadRateLimit(params: {
  request: NextRequest;
  agencyId: string;
  scope: "vehicles" | "damage-reports" | "customers" | "agencies" | "bookings";
  incomingBytes: number;
}): UploadRateLimitResult {
  if (!FEATURE_UPLOAD_RATE_LIMIT) {
    return { allowed: true };
  }

  const { request, agencyId, scope, incomingBytes } = params;
  const nowMs = Date.now();
  const clientIp = normalizeClientIp(request);
  const key = buildKey(agencyId, clientIp, scope);
  const state = getOrCreateState(key, nowMs);
  const windowEndMs = state.windowStartMs + UPLOAD_RATE_LIMIT_WINDOW_MS;
  const retryAfterSec = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));

  if (state.requestCount + 1 > UPLOAD_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      status: 429,
      message: "Trop de fichiers envoyés. Réessayez plus tard.",
      retryAfterSec,
    };
  }

  if (state.bytesUsed + incomingBytes > UPLOAD_MAX_BYTES_PER_WINDOW) {
    return {
      allowed: false,
      status: 429,
      message: "Quota de transfert temporaire dépassé. Réessayez plus tard.",
      retryAfterSec,
    };
  }

  state.requestCount += 1;
  state.bytesUsed += incomingBytes;
  uploadRateLimitMap.set(key, state);

  return { allowed: true };
}
