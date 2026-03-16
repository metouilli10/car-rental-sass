import { cookies } from "next/headers";
import { safeEqual } from "@/lib/auth-utils";

export const INTERNAL_REVIEW_COOKIE = "internal-review-session";

export function getInternalReviewToken(): string {
  const token = process.env.INTERNAL_REVIEW_TOKEN?.trim();
  if (!token) {
    throw new Error("INTERNAL_REVIEW_TOKEN must be configured");
  }

  return token;
}

export async function isInternalReviewAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(INTERNAL_REVIEW_COOKIE)?.value;
  if (!cookieValue) {
    return false;
  }

  return safeEqual(cookieValue, getInternalReviewToken());
}
