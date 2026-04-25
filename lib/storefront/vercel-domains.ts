import "server-only";

import { normalizeStorefrontHostname } from "@/lib/storefront/domains";
import type { StorefrontVerificationRecord } from "@/lib/storefront/domains";
import { mergeVerificationRecords } from "@/lib/storefront/verification-records";

type VercelDomainVerification = {
  type: string;
  domain: string;
  value: string;
  reason?: string | null;
};

type VercelProjectDomainResponse = {
  name: string;
  verified: boolean;
  verification?: VercelDomainVerification[];
};

type VercelDomainConfigResponse = {
  configuredBy?: string | null;
  misconfigured?: boolean;
  recommendedIPv4?: Array<{ value: string[] }>;
  recommendedCNAME?: Array<{ value: string }>;
};

function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const teamSlug = process.env.VERCEL_TEAM_SLUG?.trim();

  if (!token || !projectId) {
    throw new Error("La configuration Vercel des domaines est incomplète.");
  }

  return { token, projectId, teamId, teamSlug };
}

function withTeamScope(url: URL, config: ReturnType<typeof getVercelConfig>) {
  if (config.teamId) {
    url.searchParams.set("teamId", config.teamId);
  }
  if (config.teamSlug) {
    url.searchParams.set("slug", config.teamSlug);
  }
}

async function vercelRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getVercelConfig();
  const url = new URL(`https://api.vercel.com${path}`);
  withTeamScope(url, config);

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Vercel a refusé la requête de domaine.";

    try {
      const payload = await response.json() as { error?: { message?: string } };
      if (payload.error?.message) {
        message = payload.error.message;
      }
    } catch {
      // Ignore JSON parsing failures and fall back to the default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function toVerificationRecords(
  hostname: string,
  verification?: VercelDomainVerification[],
  config?: VercelDomainConfigResponse,
): StorefrontVerificationRecord[] {
  const records: StorefrontVerificationRecord[] = [];

  for (const item of verification || []) {
    records.push({
      type: item.type,
      domain: item.domain,
      value: item.value,
      reason: item.reason ?? null,
      source: "verification",
    });
  }

  for (const item of config?.recommendedIPv4 || []) {
    for (const value of item.value || []) {
      records.push({
        type: "A",
        domain: hostname,
        value,
        reason: "Ajoutez cet enregistrement A chez votre fournisseur DNS.",
        source: "config",
      });
    }
  }

  for (const item of config?.recommendedCNAME || []) {
    records.push({
      type: "CNAME",
      domain: hostname,
      value: item.value,
      reason: "Ajoutez ce CNAME chez votre fournisseur DNS.",
      source: "config",
    });
  }

  return records;
}

export async function addVercelProjectDomain(hostname: string) {
  const normalizedHostname = normalizeStorefrontHostname(hostname);
  const { projectId } = getVercelConfig();

  const added = await vercelRequest<VercelProjectDomainResponse>(
    `/v10/projects/${encodeURIComponent(projectId)}/domains`,
    {
      method: "POST",
      body: JSON.stringify({ name: normalizedHostname }),
    },
  );

  const config = await getVercelDomainConfig(normalizedHostname);

  return {
    hostname: added.name,
    verified: added.verified,
    verificationRecords: mergeVerificationRecords(
      toVerificationRecords(normalizedHostname, added.verification, config),
    ),
    config,
  };
}

export async function getVercelDomainConfig(hostname: string) {
  return vercelRequest<VercelDomainConfigResponse>(
    `/v6/domains/${encodeURIComponent(normalizeStorefrontHostname(hostname))}/config`,
  );
}

export async function verifyVercelProjectDomain(hostname: string) {
  const normalizedHostname = normalizeStorefrontHostname(hostname);
  const { projectId } = getVercelConfig();

  const verified = await vercelRequest<VercelProjectDomainResponse>(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(normalizedHostname)}/verify`,
    {
      method: "POST",
    },
  );

  const config = await getVercelDomainConfig(normalizedHostname);

  return {
    hostname: verified.name,
    verified: verified.verified,
    verificationRecords: mergeVerificationRecords(
      toVerificationRecords(normalizedHostname, verified.verification, config),
    ),
    config,
  };
}

export async function inspectVercelProjectDomain(hostname: string) {
  const normalizedHostname = normalizeStorefrontHostname(hostname);
  const config = await getVercelDomainConfig(normalizedHostname);

  return {
    hostname: normalizedHostname,
    verificationRecords: mergeVerificationRecords(
      toVerificationRecords(normalizedHostname, undefined, config),
    ),
    config,
  };
}

export async function removeVercelProjectDomain(hostname: string) {
  const normalizedHostname = normalizeStorefrontHostname(hostname);
  const { projectId } = getVercelConfig();

  await vercelRequest(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(normalizedHostname)}`,
    {
      method: "DELETE",
    },
  );
}
