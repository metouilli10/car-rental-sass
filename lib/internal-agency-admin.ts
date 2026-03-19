export type AgencySubscriptionState =
  | {
      tone: "unpaid";
      label: "Unpaid";
      description: string;
    }
  | {
      tone: "active";
      label: "Active";
      description: string;
    }
  | {
      tone: "expired";
      label: "Expired";
      description: string;
    };

function startOfDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function formatDateInputValue(value: Date | null): string {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(rawValue: FormDataEntryValue | null): Date | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date de fin invalide");
  }

  return parsed;
}

export function getAgencySubscriptionState(params: {
  subscriptionPaid: boolean;
  subscriptionEndsAt: Date | null;
  now?: Date;
}): AgencySubscriptionState {
  const { subscriptionPaid, subscriptionEndsAt } = params;

  if (!subscriptionPaid) {
    return {
      tone: "unpaid",
      label: "Unpaid",
      description: subscriptionEndsAt
        ? `Marked unpaid. Previous end: ${subscriptionEndsAt.toLocaleDateString("fr-FR")}`
        : "No paid subscription recorded.",
    };
  }

  if (!subscriptionEndsAt) {
    return {
      tone: "active",
      label: "Active",
      description: "Paid with no end date set.",
    };
  }

  const today = startOfDay(params.now ?? new Date());
  const endDate = startOfDay(subscriptionEndsAt);

  if (endDate < today) {
    return {
      tone: "expired",
      label: "Expired",
      description: `Ended on ${subscriptionEndsAt.toLocaleDateString("fr-FR")}`,
    };
  }

  return {
    tone: "active",
    label: "Active",
    description: `Paid until ${subscriptionEndsAt.toLocaleDateString("fr-FR")}`,
  };
}
