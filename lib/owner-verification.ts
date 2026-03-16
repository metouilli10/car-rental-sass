import { ApprovalStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security/audit-log";
import {
  createOpaqueToken,
  getPublicAppUrl,
  hashOpaqueToken,
} from "@/lib/auth-utils";
import { sendOwnerVerificationEmail } from "@/lib/mail";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

type OwnerUser = {
  id: string;
  name: string;
  email: string;
  agencyId: string;
  role: string;
  approvalStatus: ApprovalStatus;
  emailVerifiedAt: Date | null;
};

export async function createOwnerVerificationToken(userId: string) {
  const rawToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function sendOwnerVerificationEmailForUser(user: OwnerUser) {
  const token = await createOwnerVerificationToken(user.id);
  const verificationUrl = `${getPublicAppUrl()}/verify-email?token=${token}`;

  await sendOwnerVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl,
  });
}

export async function resendOwnerVerificationEmailByEmail(params: {
  email: string;
  ip: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: params.email },
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

  if (!user || user.role !== "OWNER") {
    return { status: "verification_sent" as const };
  }

  if (user.approvalStatus === "REJECTED") {
    return { status: "account_rejected" as const };
  }

  if (user.emailVerifiedAt) {
    return { status: "email_already_verified" as const };
  }

  const latestToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      createdAt: true,
    },
  });

  if (latestToken && Date.now() - latestToken.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { status: "verification_sent" as const };
  }

  await sendOwnerVerificationEmailForUser(user);

  await logSecurityAudit({
    actor: {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    context: {
      agencyId: user.agencyId,
      ip: params.ip,
    },
    event: {
      action: "OWNER_SIGNUP_VERIFICATION_RESENT",
      entityType: "USER",
      entityId: user.id,
      outcome: "SUCCESS",
      details: {
        email: user.email,
      },
    },
  });

  return { status: "verification_sent" as const };
}

export async function consumeOwnerVerificationToken(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);

  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          agencyId: true,
          approvalStatus: true,
          emailVerifiedAt: true,
        },
      },
    },
  });

  if (!token || token.user.role !== "OWNER") {
    return { status: "verification_expired" as const };
  }

  if (token.consumedAt || token.expiresAt.getTime() < Date.now()) {
    return { status: "verification_expired" as const, email: token.user.email };
  }

  if (token.user.emailVerifiedAt) {
    return {
      status:
        token.user.approvalStatus === "REJECTED"
          ? ("account_rejected" as const)
          : ("email_already_verified" as const),
      email: token.user.email,
    };
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    return tx.user.update({
      where: { id: token.user.id },
      data: { emailVerifiedAt: new Date() },
      select: {
        id: true,
        email: true,
        role: true,
        agencyId: true,
        approvalStatus: true,
      },
    });
  });

  await prisma.emailVerificationToken.updateMany({
    where: {
      userId: user.id,
      id: { not: token.id },
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await logSecurityAudit({
    actor: {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    context: {
      agencyId: user.agencyId,
    },
    event: {
      action: "OWNER_SIGNUP_EMAIL_VERIFIED",
      entityType: "USER",
      entityId: user.id,
      outcome: "SUCCESS",
      details: {
        approvalStatus: user.approvalStatus,
      },
    },
  });

  if (user.approvalStatus === "REJECTED") {
    return { status: "account_rejected" as const, email: user.email };
  }

  return { status: "awaiting_approval" as const, email: user.email };
}

export async function setOwnerApprovalStatus(params: {
  userId: string;
  approvalStatus: ApprovalStatus;
}) {
  const isApproved = params.approvalStatus === "APPROVED";

  return prisma.user.update({
    where: { id: params.userId },
    data: {
      approvalStatus: params.approvalStatus,
      isActive: isApproved,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      agencyId: true,
      approvalStatus: true,
      emailVerifiedAt: true,
      isActive: true,
      createdAt: true,
      agency: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function getOwnerSignupQueue() {
  return prisma.user.findMany({
    where: {
      role: "OWNER",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      agencyId: true,
      createdAt: true,
      isActive: true,
      approvalStatus: true,
      emailVerifiedAt: true,
      agency: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function logOwnerApprovalAudit(params: {
  userId: string;
  agencyId: string;
  email: string;
  approvalStatus: ApprovalStatus;
  reviewerLabel: string;
}) {
  await logSecurityAudit({
    actor: {
      userId: params.reviewerLabel,
      role: "INTERNAL_REVIEW",
    },
    context: {
      agencyId: params.agencyId,
    },
    event: {
      action:
        params.approvalStatus === "APPROVED"
          ? "OWNER_SIGNUP_APPROVED"
          : "OWNER_SIGNUP_REJECTED",
      entityType: "USER",
      entityId: params.userId,
      outcome: "SUCCESS",
      details: {
        email: params.email,
        reviewer: params.reviewerLabel,
      },
    },
  });
}

export function isPrismaMissingColumnError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2011", "P2021", "P2022"].includes(error.code)
  );
}
