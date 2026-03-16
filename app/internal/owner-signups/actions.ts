"use server";

import { ApprovalStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { INTERNAL_REVIEW_COOKIE, getInternalReviewToken, isInternalReviewAuthenticated } from "@/lib/internal-review-auth";
import {
  logOwnerApprovalAudit,
  setOwnerApprovalStatus,
} from "@/lib/owner-verification";

export async function loginInternalReview(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || token.trim() !== getInternalReviewToken()) {
    throw new Error("Token interne invalide");
  }

  const cookieStore = await cookies();
  cookieStore.set(INTERNAL_REVIEW_COOKIE, getInternalReviewToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  revalidatePath("/internal/owner-signups");
}

export async function logoutInternalReview() {
  const cookieStore = await cookies();
  cookieStore.delete(INTERNAL_REVIEW_COOKIE);
  revalidatePath("/internal/owner-signups");
}

export async function updateOwnerApproval(formData: FormData) {
  const isAuthenticated = await isInternalReviewAuthenticated();
  if (!isAuthenticated) {
    throw new Error("Session interne invalide");
  }

  const userId = formData.get("userId");
  const status = formData.get("status");

  if (typeof userId !== "string" || typeof status !== "string") {
    throw new Error("Paramètres invalides");
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Statut invalide");
  }

  const updatedUser = await setOwnerApprovalStatus({
    userId,
    approvalStatus: status as ApprovalStatus,
  });

  await logOwnerApprovalAudit({
    userId: updatedUser.id,
    agencyId: updatedUser.agencyId,
    email: updatedUser.email,
    approvalStatus: updatedUser.approvalStatus,
    reviewerLabel: "internal-review",
  });

  revalidatePath("/internal/owner-signups");
}
