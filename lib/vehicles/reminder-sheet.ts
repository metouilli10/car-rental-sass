import type { ReminderType } from "@prisma/client";

export type ReminderSheetType = "oil" | "insurance" | "inspection" | "vignette" | "other";

const REMINDER_TYPE_TO_SHEET_TYPE: Record<ReminderType, Exclude<ReminderSheetType, "other">> = {
  OIL_CHANGE: "oil",
  INSURANCE_EXPIRY: "insurance",
  TECH_INSPECTION: "inspection",
  VIGNETTE: "vignette",
};

export function getReminderSheetTypeFromReminderType(type: ReminderType): ReminderSheetType {
  return REMINDER_TYPE_TO_SHEET_TYPE[type];
}

export function normalizeReminderSheetType(value: string | null | undefined): ReminderSheetType | null {
  if (!value) {
    return null;
  }

  switch (value) {
    case "oil":
    case "vidange":
      return "oil";
    case "insurance":
    case "assurance":
      return "insurance";
    case "inspection":
    case "technical-inspection":
    case "visite-technique":
      return "inspection";
    case "vignette":
      return "vignette";
    case "other":
    case "autre":
      return "other";
    default:
      return null;
  }
}
