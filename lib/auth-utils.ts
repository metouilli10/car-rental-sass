import { createHash, randomBytes, timingSafeEqual } from "crypto";

type HeaderLike = Headers | Record<string, unknown> | null | undefined;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getHeaderValue(headers: HeaderLike, name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const value = headers[name];
  return typeof value === "string" ? value : null;
}

export function normalizeClientIp(headers: HeaderLike): string {
  const xForwardedFor = getHeaderValue(headers, "x-forwarded-for");
  if (xForwardedFor && xForwardedFor.trim().length > 0) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = getHeaderValue(headers, "x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getPublicAppUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || "";

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be configured");
  }

  return appUrl.replace(/\/+$/, "");
}
