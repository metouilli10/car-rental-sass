export type StorefrontVerificationRecord = {
  type: string;
  domain: string;
  value: string;
  reason?: string | null;
  source?: "verification" | "config";
  status?: "unchecked" | "verified" | "mismatch" | "missing";
  observedValues?: string[];
};

const HOSTNAME_REGEX =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const COMPOUND_PUBLIC_SUFFIX_PREFIXES = new Set([
  "ac",
  "co",
  "com",
  "edu",
  "gov",
  "net",
  "org",
]);

function normalizeHostLikeValue(input: string): string {
  return input.trim().toLowerCase().replace(/\.+$/, "");
}

export function stripPortFromHost(input: string): string {
  const normalized = normalizeHostLikeValue(input);

  if (normalized.startsWith("[")) {
    const end = normalized.indexOf("]");
    if (end >= 0) {
      return normalized.slice(0, end + 1);
    }
  }

  return normalized.replace(/:\d+$/, "");
}

export function normalizeStorefrontHostname(input: string): string {
  const normalized = input.trim().toLowerCase();
  const withoutProtocol = normalized.replace(/^[a-z]+:\/\//, "");
  const [host] = withoutProtocol.split(/[/?#]/, 1);
  return stripPortFromHost(host || "");
}

export function isValidStorefrontHostname(input: string): boolean {
  const hostname = normalizeStorefrontHostname(input);
  return HOSTNAME_REGEX.test(hostname);
}

export function getRegistrableStorefrontDomain(input: string): string {
  const hostname = normalizeStorefrontHostname(input);
  const labels = hostname.split(".").filter(Boolean);

  if (labels.length <= 2) {
    return hostname;
  }

  const secondLevel = labels.at(-2);
  const topLevel = labels.at(-1);
  const hasCompoundSuffix = Boolean(
    secondLevel &&
    topLevel &&
    topLevel.length === 2 &&
    COMPOUND_PUBLIC_SUFFIX_PREFIXES.has(secondLevel),
  );

  return hasCompoundSuffix
    ? labels.slice(-3).join(".")
    : labels.slice(-2).join(".");
}

export function getDnsProviderHostValue(domainHostname: string, recordDomain: string): string {
  const zone = getRegistrableStorefrontDomain(domainHostname);
  const normalizedRecordDomain = normalizeStorefrontHostname(recordDomain);

  if (!normalizedRecordDomain) {
    return "";
  }

  if (normalizedRecordDomain === zone) {
    return "@";
  }

  if (normalizedRecordDomain.endsWith(`.${zone}`)) {
    return normalizedRecordDomain.slice(0, -(zone.length + 1));
  }

  return normalizedRecordDomain;
}

export function getEffectiveStorefrontVerificationRecords(
  hostname: string,
  records: StorefrontVerificationRecord[],
): StorefrontVerificationRecord[] {
  const normalizedHostname = normalizeStorefrontHostname(hostname);
  const registrableDomain = getRegistrableStorefrontDomain(normalizedHostname);
  const isApexHostname = normalizedHostname === registrableDomain;

  const preferredConfigType = records.some(
    (record) =>
      record.source === "config" &&
      normalizeStorefrontHostname(record.domain) === normalizedHostname &&
      record.type.toUpperCase() === (isApexHostname ? "A" : "CNAME"),
  )
    ? (isApexHostname ? "A" : "CNAME")
    : null;

  return records.filter((record) => {
    if (record.source !== "config") {
      return true;
    }

    if (normalizeStorefrontHostname(record.domain) !== normalizedHostname) {
      return true;
    }

    if (!preferredConfigType) {
      return true;
    }

    return record.type.toUpperCase() === preferredConfigType;
  });
}

function hostnameFromUrl(input: string | undefined): string | null {
  if (!input?.trim()) return null;

  try {
    return normalizeStorefrontHostname(new URL(input).hostname);
  } catch {
    return normalizeStorefrontHostname(input);
  }
}

export function getInternalStorefrontHosts(): Set<string> {
  const hosts = new Set<string>(["localhost", "127.0.0.1", "[::1]"]);
  const appUrlHost = hostnameFromUrl(process.env.NEXT_PUBLIC_APP_URL);
  const authUrlHost = hostnameFromUrl(process.env.NEXTAUTH_URL);
  const primaryHost = hostnameFromUrl(process.env.PRIMARY_APP_DOMAIN);

  if (appUrlHost) hosts.add(appUrlHost);
  if (authUrlHost) hosts.add(authUrlHost);
  if (primaryHost) hosts.add(primaryHost);

  return hosts;
}

export function isInternalStorefrontHost(input: string): boolean {
  const hostname = normalizeStorefrontHostname(input);
  if (!hostname) return true;

  if (hostname.endsWith(".vercel.app")) {
    return true;
  }

  return getInternalStorefrontHosts().has(hostname);
}

export function getCustomDomainUrl(hostname: string, pathname = "/"): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${normalizeStorefrontHostname(hostname)}${normalizedPath}`;
}
