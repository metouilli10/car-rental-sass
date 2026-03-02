import type { Prisma, UserRole } from "@prisma/client";

type PermissionGroup = "operations" | "finance" | "control" | "system";

type PermissionDefinition = {
  key: string;
  label: string;
  description: string;
  group: PermissionGroup;
};

export const PERMISSION_CATALOG = [
  {
    key: "dashboard.view",
    label: "Tableau de bord",
    description: "Voir le tableau de bord",
    group: "operations",
  },
  {
    key: "bookings.view",
    label: "Reservations",
    description: "Voir les reservations",
    group: "operations",
  },
  {
    key: "bookings.manage",
    label: "Gestion reservations",
    description: "Creer et modifier les reservations",
    group: "operations",
  },
  {
    key: "calendar.view",
    label: "Calendrier",
    description: "Voir le calendrier",
    group: "operations",
  },
  {
    key: "customers.view",
    label: "Clients",
    description: "Voir les clients",
    group: "operations",
  },
  {
    key: "customers.manage",
    label: "Gestion clients",
    description: "Creer et modifier les clients",
    group: "operations",
  },
  {
    key: "customers.delete",
    label: "Suppression clients",
    description: "Supprimer des clients",
    group: "operations",
  },
  {
    key: "vehicles.view",
    label: "Vehicules",
    description: "Voir les vehicules",
    group: "operations",
  },
  {
    key: "vehicles.manage",
    label: "Gestion vehicules",
    description: "Creer et modifier les vehicules",
    group: "operations",
  },
  {
    key: "catalogue.view",
    label: "Catalogue",
    description: "Voir le catalogue",
    group: "operations",
  },
  {
    key: "finance.view",
    label: "Finance",
    description: "Voir la finance",
    group: "finance",
  },
  {
    key: "caisse.view",
    label: "Caisse",
    description: "Voir la caisse",
    group: "finance",
  },
  {
    key: "inspections.view",
    label: "Inspections",
    description: "Voir les inspections",
    group: "control",
  },
  {
    key: "infractions.view",
    label: "Infractions",
    description: "Voir les infractions",
    group: "control",
  },
  {
    key: "notifications.view",
    label: "Notifications",
    description: "Voir les notifications",
    group: "system",
  },
  {
    key: "users.manage",
    label: "Gestion utilisateurs",
    description: "Gerer les utilisateurs",
    group: "system",
  },
] as const satisfies readonly PermissionDefinition[];

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];
export type PermissionOverrides = Partial<Record<PermissionKey, boolean>>;
export type EffectivePermissions = Record<PermissionKey, boolean>;
export type PermissionMatrixState = "inherit" | "allow" | "deny";
export type PermissionGroupKey = (typeof PERMISSION_CATALOG)[number]["group"];

const PERMISSION_KEYS = PERMISSION_CATALOG.map((item) => item.key);
const PERMISSION_KEY_SET = new Set<string>(PERMISSION_KEYS);

function buildPermissionRecord(value: boolean): EffectivePermissions {
  return Object.fromEntries(
    PERMISSION_KEYS.map((key) => [key, value]),
  ) as EffectivePermissions;
}

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEY_SET.has(value);
}

export function getPermissionDefinition(key: PermissionKey) {
  return PERMISSION_CATALOG.find((item) => item.key === key) ?? null;
}

export function getPermissionGroups(): Array<{
  key: PermissionGroupKey;
  label: string;
  items: readonly (typeof PERMISSION_CATALOG)[number][];
}> {
  const labels: Record<PermissionGroupKey, string> = {
    operations: "Operations",
    finance: "Finance",
    control: "Controle",
    system: "Systeme",
  };

  return (Object.keys(labels) as PermissionGroupKey[]).map((group) => ({
    key: group,
    label: labels[group],
    items: PERMISSION_CATALOG.filter((item) => item.group === group),
  }));
}

export function getRoleDefaultPermissions(role: UserRole): EffectivePermissions {
  if (role === "OWNER") {
    return buildPermissionRecord(true);
  }

  const base = buildPermissionRecord(false);

  const allowedKeys =
    role === "MANAGER"
      ? ([
          "dashboard.view",
          "bookings.view",
          "bookings.manage",
          "calendar.view",
          "customers.view",
          "customers.manage",
          "customers.delete",
          "vehicles.view",
          "vehicles.manage",
          "catalogue.view",
          "inspections.view",
          "infractions.view",
          "notifications.view",
        ] satisfies PermissionKey[])
      : ([
          "dashboard.view",
          "bookings.view",
          "bookings.manage",
          "calendar.view",
          "customers.view",
          "customers.manage",
          "vehicles.view",
          "catalogue.view",
          "inspections.view",
          "notifications.view",
        ] satisfies PermissionKey[]);

  for (const key of allowedKeys) {
    base[key] = true;
  }

  return base;
}

export function normalizePermissionOverrides(value: Prisma.JsonValue | unknown): PermissionOverrides | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const normalized: PermissionOverrides = {};

  for (const [key, rawValue] of entries) {
    if (!isPermissionKey(key) || typeof rawValue !== "boolean") {
      continue;
    }
    normalized[key] = rawValue;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function sanitizePermissionOverridePatch(
  overrides: Record<string, boolean | null | undefined>,
): {
  normalized: PermissionOverrides | null;
  changedKeys: string[];
  invalidKeys: string[];
} {
  const next: PermissionOverrides = {};
  const changedKeys: string[] = [];
  const invalidKeys: string[] = [];

  for (const [key, value] of Object.entries(overrides)) {
    if (!isPermissionKey(key)) {
      invalidKeys.push(key);
      continue;
    }

    changedKeys.push(key);

    if (typeof value === "boolean") {
      next[key] = value;
    }
  }

  return {
    normalized: Object.keys(next).length > 0 ? next : null,
    changedKeys,
    invalidKeys,
  };
}

export function getEffectivePermissions(
  role: UserRole,
  overrides?: PermissionOverrides | Prisma.JsonValue | null,
): EffectivePermissions {
  if (role === "OWNER") {
    return buildPermissionRecord(true);
  }

  const effective = { ...getRoleDefaultPermissions(role) };
  const normalizedOverrides = normalizePermissionOverrides(overrides);

  if (!normalizedOverrides) {
    return effective;
  }

  for (const key of PERMISSION_KEYS) {
    if (typeof normalizedOverrides[key] === "boolean") {
      effective[key] = normalizedOverrides[key] as boolean;
    }
  }

  return effective;
}

export function getPermissionState(
  overrides: PermissionOverrides | null | undefined,
  key: PermissionKey,
): PermissionMatrixState {
  if (!overrides || typeof overrides[key] !== "boolean") {
    return "inherit";
  }

  return overrides[key] ? "allow" : "deny";
}

export function mapPermissionStateToOverride(state: PermissionMatrixState): boolean | null {
  if (state === "inherit") return null;
  return state === "allow";
}

export function countPermissionOverrides(overrides: PermissionOverrides | null | undefined): number {
  return overrides ? Object.keys(overrides).length : 0;
}

export function hasPermission(
  user: { role: UserRole; permissionOverrides?: PermissionOverrides | Prisma.JsonValue | null },
  permissionKey: PermissionKey,
): boolean {
  return getEffectivePermissions(user.role, user.permissionOverrides ?? null)[permissionKey];
}

export function canDeleteCustomer(
  role: UserRole,
  overrides?: PermissionOverrides | Prisma.JsonValue | null,
): boolean {
  return getEffectivePermissions(role, overrides)["customers.delete"];
}

export function canManageCustomers(
  role: UserRole,
  overrides?: PermissionOverrides | Prisma.JsonValue | null,
): boolean {
  return getEffectivePermissions(role, overrides)["customers.manage"];
}

export function canManageVehicles(
  role: UserRole,
  overrides?: PermissionOverrides | Prisma.JsonValue | null,
): boolean {
  return getEffectivePermissions(role, overrides)["vehicles.manage"];
}
