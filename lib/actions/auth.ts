"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeClientIp, normalizeEmail } from "@/lib/auth-utils";
import { logSecurityAudit } from "@/lib/security/audit-log";
import { assertPublicAuthRateLimit } from "@/lib/public-auth-rate-limit";
import {
  isPrismaMissingColumnError,
  sendOwnerVerificationEmailForUser,
} from "@/lib/owner-verification";
import {
  registerOwnerSchema,
  type RegisterOwnerFormData,
} from "@/lib/validations/auth";

export async function registerOwnerAccount(data: RegisterOwnerFormData) {
  try {
    const validated = registerOwnerSchema.parse(data);
    const email = normalizeEmail(validated.email);
    const requestHeaders = await headers();
    const clientIp = normalizeClientIp(requestHeaders);

    assertPublicAuthRateLimit("signup", email, clientIp);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { status: "already_exists" as const, error: "Cet email est déjà utilisé" };
    }

    const hashedPassword = await hash(validated.password, 10);

    const createdOwner = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: "Nouvelle agence",
          city: "",
          address: null,
          phone: null,
          email,
          setupCompletedAt: null,
          onboardingVehicleAdded: false,
          onboardingReservationCreated: false,
          onboardingPaymentRecorded: false,
          onboardingDashboardExplored: false,
          onboardingCompleted: false,
          onboardingDismissed: false,
        },
        select: { id: true },
      });

      return tx.user.create({
        data: {
          name: validated.name,
          email,
          password: hashedPassword,
          role: "OWNER",
          isActive: false,
          approvalStatus: "PENDING",
          emailVerifiedAt: null,
          agencyId: agency.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          agencyId: true,
          approvalStatus: true,
          emailVerifiedAt: true,
        },
      });
    });

    await sendOwnerVerificationEmailForUser(createdOwner);

    await logSecurityAudit({
      actor: {
        userId: createdOwner.id,
        role: createdOwner.role,
        email: createdOwner.email,
      },
      context: {
        agencyId: createdOwner.agencyId,
        ip: clientIp,
        userAgent: requestHeaders.get("user-agent"),
      },
      event: {
        action: "OWNER_SIGNUP_REGISTERED",
        entityType: "USER",
        entityId: createdOwner.id,
        outcome: "SUCCESS",
        details: {
          email: createdOwner.email,
        },
      },
    });

    return { status: "verification_sent" as const };
  } catch (error) {
    console.error("registerOwnerAccount error:", error);
    if (
      error instanceof Error &&
      error.message === "Trop de tentatives. Réessayez plus tard."
    ) {
      return { status: "rate_limited" as const, error: error.message };
    }

    if (
      error instanceof Error &&
      [
        "RESEND_API_KEY must be configured",
        "RESEND_FROM_EMAIL must be configured",
        "NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be configured",
      ].includes(error.message)
    ) {
      return {
        status: "mail_unavailable" as const,
        error: "Le service d'email n'est pas disponible pour le moment.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002"].includes(error.code)
    ) {
      return { status: "already_exists" as const, error: "Cet email est déjà utilisé" };
    }

    if (isPrismaMissingColumnError(error)) {
      return {
        status: "db_outdated" as const,
        error:
          "La base de données n'est pas à jour. Exécutez la migration Prisma de l'onboarding avant de créer un compte.",
      };
    }

    return { status: "error" as const, error: "Erreur lors de la création du compte" };
  }
}
