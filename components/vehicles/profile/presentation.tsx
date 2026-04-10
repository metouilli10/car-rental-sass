import type {
  BookingDepositStatus,
  BookingPaymentStatus,
  BookingStatus,
  InfractionStatus,
  InfractionType,
  NotificationStatus,
  ReminderType,
} from "@prisma/client";
import type { VehicleProfileData, VehicleWorkspaceActionItem, VehicleWorkspaceData } from "@/lib/vehicles/profile";

export const reminderTypeLabels: Record<ReminderType, string> = {
  OIL_CHANGE: "Vidange",
  INSURANCE_EXPIRY: "Assurance",
  TECH_INSPECTION: "Visite technique",
  VIGNETTE: "Vignette",
};

export const infractionTypeLabels: Record<InfractionType, string> = {
  SPEEDING: "Excès de vitesse",
  PARKING: "Stationnement",
  RED_LIGHT: "Feu rouge",
  TOLL: "Péage",
  OTHER: "Autre",
};

export const infractionStatusLabels: Record<InfractionStatus, string> = {
  PENDING: "À assigner",
  ASSIGNED: "Assignée",
  PAID: "Payée",
  CONTESTED: "Contestée",
};

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  OPEN: "À faire",
  SNOOZED: "Snoozé",
  DONE: "Terminé",
  DISMISSED: "Ignoré",
};

export const paymentStatusLabels: Record<BookingPaymentStatus, string> = {
  PENDING: "En attente",
  PARTIAL: "Partiel",
  PAID: "Payé",
};

export const depositStatusLabels: Record<BookingDepositStatus, string> = {
  PENDING: "En attente",
  RECEIVED: "Reçue",
  RETURNED: "Restituée",
};

export const bookingStatusLabels: Record<BookingStatus, string> = {
  DRAFT: "Brouillon",
  CONFIRMED: "Confirmée",
  ACTIVE: "En cours",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
};

export function getHealthBadgeClass(status: "ok" | "soon" | "overdue" | "missing") {
  switch (status) {
    case "ok":
      return "bg-emerald-50 text-emerald-700";
    case "soon":
      return "bg-amber-50 text-amber-700";
    case "overdue":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function getActivityToneClass(tone: "neutral" | "info" | "warning" | "danger" | "success") {
  switch (tone) {
    case "info":
      return "bg-blue-50 text-blue-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    case "danger":
      return "bg-red-50 text-red-700";
    case "success":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function getReminderSeverityClass(severity: "info" | "warning" | "due") {
  switch (severity) {
    case "due":
      return "bg-red-50 text-red-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function getWorkspaceToneClass(
  tone: VehicleWorkspaceData["vehicleAvailabilityStatus"]["tone"] | VehicleWorkspaceActionItem["tone"],
) {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700";
    case "info":
      return "bg-blue-50 text-blue-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-red-50 text-red-700";
  }
}

export function formatFuelType(fuelType: VehicleProfileData["vehicle"]["fuelType"]) {
  switch (fuelType) {
    case "DIESEL":
      return "Diesel";
    case "HYBRID":
      return "Hybride";
    case "ELECTRIC":
      return "Électrique";
    default:
      return "Essence";
  }
}

export function getInfractionStatusClass(status: InfractionStatus) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700";
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700";
    case "CONTESTED":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-red-50 text-red-700";
  }
}

export function formatDurationDays(startDate: Date, endDate: Date) {
  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return `${days} j`;
}
