"use server";

import { ApprovalStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { safeEqual } from "@/lib/auth-utils";
import { parseDateInputValue } from "@/lib/internal-agency-admin";
import { INTERNAL_REVIEW_COOKIE, getInternalReviewToken, isInternalReviewAuthenticated } from "@/lib/internal-review-auth";
import { prisma } from "@/lib/prisma";
import {
  logAgencyDeletionAudit,
  logAgencySubscriptionAudit,
  logOwnerApprovalAudit,
  setOwnerApprovalStatus,
} from "@/lib/owner-verification";

export async function loginInternalReview(formData: FormData) {
  const token = formData.get("token");
  if (
    typeof token !== "string" ||
    !safeEqual(token.trim(), getInternalReviewToken())
  ) {
    throw new Error("Token interne invalide");
  }

  const cookieStore = await cookies();
  cookieStore.set(INTERNAL_REVIEW_COOKIE, getInternalReviewToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/internal",
    maxAge: 8 * 60 * 60,
  });

  revalidatePath("/internal/owner-signups");
}

export async function updateAgencySubscription(formData: FormData) {
  const isAuthenticated = await isInternalReviewAuthenticated();
  if (!isAuthenticated) {
    throw new Error("Session interne invalide");
  }

  const agencyId = formData.get("agencyId");

  if (typeof agencyId !== "string" || !agencyId.trim()) {
    throw new Error("Agence invalide");
  }

  const paidValues = formData.getAll("subscriptionPaid");
  const subscriptionPaid = paidValues.some((value) => value === "true");
  const subscriptionEndsAt = parseDateInputValue(formData.get("subscriptionEndsAt"));

  const agency = await prisma.agency.update({
    where: { id: agencyId },
    data: {
      subscriptionPaid,
      subscriptionEndsAt,
    },
    select: {
      id: true,
      name: true,
      subscriptionPaid: true,
      subscriptionEndsAt: true,
    },
  });

  await logAgencySubscriptionAudit({
    agencyId: agency.id,
    agencyName: agency.name,
    subscriptionPaid: agency.subscriptionPaid,
    subscriptionEndsAt: agency.subscriptionEndsAt,
    reviewerLabel: "internal-review",
  });

  revalidatePath("/internal/owner-signups");
}

export async function deleteAgency(formData: FormData) {
  const isAuthenticated = await isInternalReviewAuthenticated();
  if (!isAuthenticated) {
    throw new Error("Session interne invalide");
  }

  const agencyId = formData.get("agencyId");
  const agencyName = formData.get("agencyName");
  const confirmName = formData.get("confirmName");

  if (
    typeof agencyId !== "string" ||
    typeof agencyName !== "string" ||
    typeof confirmName !== "string" ||
    !agencyId.trim() ||
    !agencyName.trim()
  ) {
    throw new Error("Paramètres invalides");
  }

  if (confirmName.trim() !== agencyName.trim()) {
    throw new Error("Le nom de confirmation ne correspond pas");
  }

  const deletedAgency = await prisma.agency.delete({
    where: { id: agencyId },
    select: {
      id: true,
      name: true,
    },
  });

  await logAgencyDeletionAudit({
    agencyId: deletedAgency.id,
    agencyName: deletedAgency.name,
    reviewerLabel: "internal-review",
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
