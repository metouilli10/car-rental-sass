"use server";

import { StorefrontDomainStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUserAccessOrThrow } from "@/lib/authz";
import { canManageVehicles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveStorefrontVerificationRecords,
  isInternalStorefrontHost,
  type StorefrontVerificationRecord,
} from "@/lib/storefront/domains";
import {
  auditStorefrontDnsRecords,
  buildStorefrontDnsAuditMessage,
} from "@/lib/storefront/dns-audit";
import { upsertWebsiteSettingsForAgency } from "@/lib/storefront/public";
import { getStorefrontPath } from "@/lib/storefront/routes";
import { mergeVerificationRecords } from "@/lib/storefront/verification-records";
import {
  addVercelProjectDomain,
  inspectVercelProjectDomain,
  removeVercelProjectDomain,
  verifyVercelProjectDomain,
} from "@/lib/storefront/vercel-domains";
import {
  storefrontDomainInputSchema,
  websiteSettingsSchema,
  type StorefrontDomainInput,
  type WebsiteSettingsFormData,
} from "@/lib/validations/website";

export type StorefrontDomainUiStatus =
  | "NOT_CONNECTED"
  | "PENDING"
  | "VERIFIED"
  | "ERROR";

export type StorefrontDomainFormValues = {
  hostname: string;
  status: StorefrontDomainUiStatus;
  verificationRecords: StorefrontVerificationRecord[];
  verifiedAt: Date | null;
  lastCheckedAt: Date | null;
  verificationError: string | null;
  isPrimary: boolean;
};

export type StorefrontDomainRefreshResult = {
  success: true;
  status: StorefrontDomainUiStatus;
  message: string;
  matchedCount: number;
  totalCount: number;
};

function getEmptyStorefrontDomainValues(): StorefrontDomainFormValues {
  return {
    hostname: "",
    status: "NOT_CONNECTED",
    verificationRecords: [],
    verifiedAt: null,
    lastCheckedAt: null,
    verificationError: null,
    isPrimary: true,
  };
}

function assertWebsiteManagementAccess() {
  return getCurrentUserAccessOrThrow().then((currentUser) => {
    if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
      throw new Error("Vous n'avez pas l'autorisation de gérer le site web.");
    }

    return currentUser;
  });
}

function normalizeDomainError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toStorefrontDomainValues(
  domain:
    | {
        hostname: string;
        status: StorefrontDomainStatus;
        verificationRecords: unknown;
        verifiedAt: Date | null;
        lastCheckedAt: Date | null;
        verificationError: string | null;
        isPrimary: boolean;
      }
    | null
    | undefined,
): StorefrontDomainFormValues {
  if (!domain) {
    return getEmptyStorefrontDomainValues();
  }

  return {
    hostname: domain.hostname,
    status: domain.status,
    verificationRecords: Array.isArray(domain.verificationRecords)
      ? (domain.verificationRecords as StorefrontVerificationRecord[])
      : [],
    verifiedAt: domain.verifiedAt,
    lastCheckedAt: domain.lastCheckedAt,
    verificationError: domain.verificationError,
    isPrimary: domain.isPrimary,
  };
}

function revalidateWebsitePaths(agencySlug: string) {
  revalidatePath("/settings/website");
  revalidatePath("/vehicles");
  revalidatePath(getStorefrontPath(agencySlug));
}

function getPendingDnsMessage() {
  return "Les enregistrements DNS ne sont pas encore vérifiés. Ajoutez les valeurs ci-dessous puis relancez la vérification.";
}

export async function saveWebsiteSettings(data: WebsiteSettingsFormData) {
  try {
    const currentUser = await assertWebsiteManagementAccess();
    const validated = websiteSettingsSchema.parse(data);
    const previousSettings = await prisma.websiteSettings.findUnique({
      where: { agencyId: currentUser.agencyId },
      select: { agencySlug: true },
    });

    await upsertWebsiteSettingsForAgency(currentUser.agencyId, validated);

    revalidateWebsitePaths(validated.agencySlug);
    if (previousSettings?.agencySlug && previousSettings.agencySlug !== validated.agencySlug) {
      revalidatePath(getStorefrontPath(previousSettings.agencySlug));
    }

    return { success: true as const };
  } catch (error) {
    console.error("saveWebsiteSettings error:", error);
    return {
      error: normalizeDomainError(error, "Impossible d'enregistrer les paramètres du site."),
    };
  }
}

export async function connectStorefrontDomain(data: StorefrontDomainInput) {
  try {
    const currentUser = await assertWebsiteManagementAccess();
    const validated = storefrontDomainInputSchema.parse(data);

    if (isInternalStorefrontHost(validated.hostname)) {
      return { error: "Ce domaine appartient déjà à Locaryx ou n'est pas autorisé." };
    }

    const [websiteSettings, existingDomain, conflictingDomain] = await Promise.all([
      prisma.websiteSettings.findUnique({
        where: { agencyId: currentUser.agencyId },
        select: { agencySlug: true },
      }),
      prisma.storefrontDomain.findUnique({
        where: { agencyId: currentUser.agencyId },
      }),
      prisma.storefrontDomain.findUnique({
        where: { hostname: validated.hostname },
        select: { agencyId: true },
      }),
    ]);

    if (!websiteSettings?.agencySlug) {
      return { error: "Enregistrez d'abord le slug public de la vitrine avant de connecter un domaine." };
    }

    if (conflictingDomain && conflictingDomain.agencyId !== currentUser.agencyId) {
      return { error: "Ce domaine est déjà connecté à une autre agence." };
    }

    const result = await addVercelProjectDomain(validated.hostname);
    const now = new Date();
    const previousHostname =
      existingDomain && existingDomain.hostname !== result.hostname ? existingDomain.hostname : null;

    await prisma.storefrontDomain.upsert({
      where: { agencyId: currentUser.agencyId },
      update: {
        hostname: result.hostname,
        status: result.verified ? StorefrontDomainStatus.VERIFIED : StorefrontDomainStatus.PENDING,
        verificationRecords: result.verificationRecords,
        verifiedAt: result.verified ? now : null,
        lastCheckedAt: now,
        verificationError: result.verified ? null : getPendingDnsMessage(),
        isPrimary: true,
      },
      create: {
        agencyId: currentUser.agencyId,
        hostname: result.hostname,
        status: result.verified ? StorefrontDomainStatus.VERIFIED : StorefrontDomainStatus.PENDING,
        verificationRecords: result.verificationRecords,
        verifiedAt: result.verified ? now : null,
        lastCheckedAt: now,
        verificationError: result.verified ? null : getPendingDnsMessage(),
        isPrimary: true,
      },
    });

    if (previousHostname) {
      try {
        await removeVercelProjectDomain(previousHostname);
      } catch (error) {
        console.warn("remove previous storefront domain error:", error);
      }
    }

    revalidateWebsitePaths(websiteSettings.agencySlug);
    return { success: true as const };
  } catch (error) {
    console.error("connectStorefrontDomain error:", error);
    return {
      error: normalizeDomainError(error, "Impossible de connecter le domaine pour le moment."),
    };
  }
}

export async function refreshStorefrontDomainStatus() {
  try {
    const currentUser = await assertWebsiteManagementAccess();
    const [websiteSettings, existingDomain] = await Promise.all([
      prisma.websiteSettings.findUnique({
        where: { agencyId: currentUser.agencyId },
        select: { agencySlug: true },
      }),
      prisma.storefrontDomain.findUnique({
        where: { agencyId: currentUser.agencyId },
      }),
    ]);

    if (!websiteSettings?.agencySlug) {
      return { error: "Le site public doit être configuré avant de vérifier un domaine." };
    }

    if (!existingDomain) {
      return { error: "Aucun domaine personnalisé n'est connecté." };
    }

    const now = new Date();
    let refreshOutcome: StorefrontDomainRefreshResult = {
      success: true,
      status: "PENDING",
      message: "Vérification en cours.",
      matchedCount: 0,
      totalCount: 0,
    };

    try {
      const result = await verifyVercelProjectDomain(existingDomain.hostname);
      const effectiveRecords = getEffectiveStorefrontVerificationRecords(
        existingDomain.hostname,
        result.verificationRecords,
      );
      const dnsAudit = await auditStorefrontDnsRecords(effectiveRecords);
      const dnsMessage = buildStorefrontDnsAuditMessage(dnsAudit);
      const isVerified = result.verified;
      const status = isVerified
        ? StorefrontDomainStatus.VERIFIED
        : dnsAudit.mismatchCount > 0
          ? StorefrontDomainStatus.ERROR
          : StorefrontDomainStatus.PENDING;
      const verificationError = isVerified ? null : dnsMessage;

      await prisma.storefrontDomain.update({
        where: { agencyId: currentUser.agencyId },
        data: {
          hostname: result.hostname,
          status,
          verificationRecords: dnsAudit.records,
          verifiedAt: isVerified ? now : null,
          lastCheckedAt: now,
          verificationError,
          isPrimary: true,
        },
      });

      refreshOutcome = {
        success: true,
        status: status === StorefrontDomainStatus.VERIFIED
          ? "VERIFIED"
          : status === StorefrontDomainStatus.ERROR
            ? "ERROR"
            : "PENDING",
        message: isVerified
          ? `Domaine vérifié. ${dnsAudit.matchedCount}/${dnsAudit.records.length} enregistrement(s) attendu(s) détecté(s).`
          : dnsMessage,
        matchedCount: dnsAudit.matchedCount,
        totalCount: dnsAudit.records.length,
      };
    } catch (error) {
      const inspection = await inspectVercelProjectDomain(existingDomain.hostname).catch(() => null);
      const existingRecords = Array.isArray(existingDomain.verificationRecords)
        ? (existingDomain.verificationRecords as StorefrontVerificationRecord[])
        : [];
      const fallbackRecords = mergeVerificationRecords(existingRecords, inspection?.verificationRecords);
      const effectiveRecords = getEffectiveStorefrontVerificationRecords(
        existingDomain.hostname,
        fallbackRecords,
      );
      const dnsAudit = await auditStorefrontDnsRecords(effectiveRecords);
      const dnsMessage = buildStorefrontDnsAuditMessage(dnsAudit);
      const status = inspection?.config?.misconfigured || dnsAudit.mismatchCount > 0
        ? StorefrontDomainStatus.ERROR
        : StorefrontDomainStatus.PENDING;
      const detailedError = normalizeDomainError(error, getPendingDnsMessage());

      await prisma.storefrontDomain.update({
        where: { agencyId: currentUser.agencyId },
        data: {
          status,
          verificationRecords: dnsAudit.records,
          verifiedAt: null,
          lastCheckedAt: now,
          verificationError: `${detailedError} ${dnsMessage}`.trim(),
        },
      });

      refreshOutcome = {
        success: true,
        status: status === StorefrontDomainStatus.ERROR ? "ERROR" : "PENDING",
        message: `${detailedError} ${dnsMessage}`.trim(),
        matchedCount: dnsAudit.matchedCount,
        totalCount: dnsAudit.records.length,
      };
    }

    revalidateWebsitePaths(websiteSettings.agencySlug);
    return refreshOutcome;
  } catch (error) {
    console.error("refreshStorefrontDomainStatus error:", error);
    return {
      error: normalizeDomainError(error, "Impossible de vérifier le domaine pour le moment."),
    };
  }
}

export async function removeStorefrontDomain() {
  try {
    const currentUser = await assertWebsiteManagementAccess();
    const [websiteSettings, existingDomain] = await Promise.all([
      prisma.websiteSettings.findUnique({
        where: { agencyId: currentUser.agencyId },
        select: { agencySlug: true },
      }),
      prisma.storefrontDomain.findUnique({
        where: { agencyId: currentUser.agencyId },
      }),
    ]);

    if (!websiteSettings?.agencySlug) {
      return { error: "Le site public doit être configuré avant de gérer un domaine." };
    }

    if (!existingDomain) {
      return { success: true as const };
    }

    try {
      await removeVercelProjectDomain(existingDomain.hostname);
    } catch (error) {
      const message = normalizeDomainError(error, "Impossible de supprimer le domaine de Vercel.");
      if (!message.toLowerCase().includes("not found")) {
        throw error;
      }
    }

    await prisma.storefrontDomain.delete({
      where: { agencyId: currentUser.agencyId },
    });

    revalidateWebsitePaths(websiteSettings.agencySlug);
    return { success: true as const };
  } catch (error) {
    console.error("removeStorefrontDomain error:", error);
    return {
      error: normalizeDomainError(error, "Impossible de supprimer le domaine personnalisé."),
    };
  }
}

export async function getWebsiteSettingsFormValues(agencyId: string) {
  const [agency, websiteSettings, storefrontDomain] = await Promise.all([
    prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
      },
    }),
    prisma.websiteSettings.findUnique({
      where: { agencyId },
    }),
    prisma.storefrontDomain.findUnique({
      where: { agencyId },
    }),
  ]);

  return {
    website: {
      agencySlug: websiteSettings?.agencySlug ?? "",
      siteTitle: websiteSettings?.siteTitle ?? agency?.name ?? "",
      heroTitle: websiteSettings?.heroTitle ?? agency?.name ?? "",
      heroSubtitle: websiteSettings?.heroSubtitle ?? "Louez votre prochaine voiture en quelques clics.",
      heroImageUrl: websiteSettings?.heroImageUrl ?? "",
      contactPhone: websiteSettings?.contactPhone ?? agency?.phone ?? "",
      whatsappPhone: websiteSettings?.whatsappPhone ?? agency?.phone ?? "",
      contactEmail: websiteSettings?.contactEmail ?? agency?.email ?? "",
      address: websiteSettings?.address ?? agency?.address ?? "",
      pickupLocations: websiteSettings?.pickupLocations ?? [],
      isWebsiteEnabled: websiteSettings?.isWebsiteEnabled ?? false,
    } satisfies WebsiteSettingsFormData,
    domain: toStorefrontDomainValues(storefrontDomain),
  };
}
