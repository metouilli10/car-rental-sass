import type {
  BookingDepositStatus,
  BookingPaymentStatus,
  BookingStatus,
  ExpenseCategory,
  InfractionStatus,
  InspectionType,
  NotificationStatus,
  PaymentType,
  ReminderType,
  VehicleStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { VehicleDocumentTypeValue } from "@/lib/validations/vehicle-document";
import { getVehicleFuelType } from "@/lib/vehicle-fuel-type";
import { getReminderSheetTypeFromReminderType } from "@/lib/vehicles/reminder-sheet";

export const VEHICLE_PROFILE_TABS = ["overview", "reservations", "tracking", "documents"] as const;

export type VehicleProfileTab = (typeof VEHICLE_PROFILE_TABS)[number];

export function isVehicleProfileTab(value: string | undefined): value is VehicleProfileTab {
  return Boolean(value && VEHICLE_PROFILE_TABS.includes(value as VehicleProfileTab));
}

const LEGACY_VEHICLE_PROFILE_TAB_MAP: Record<string, VehicleProfileTab> = {
  inspections: "tracking",
  maintenance: "tracking",
  infractions: "tracking",
  compliance: "documents",
};

export function normalizeVehicleProfileTab(value: string | undefined): VehicleProfileTab | undefined {
  if (isVehicleProfileTab(value)) {
    return value;
  }

  if (!value) {
    return undefined;
  }

  return LEGACY_VEHICLE_PROFILE_TAB_MAP[value];
}

export type ReminderHealth = "ok" | "soon" | "overdue" | "missing";

export interface VehicleComplianceItem {
  id: "insurance" | "technical-inspection" | "vignette" | "registration";
  type: VehicleDocumentTypeValue;
  label: string;
  documentId: string | null;
  reference: string | null;
  startDate: Date | null;
  expiryDate: Date | null;
  fileUrl: string | null;
  status: ReminderHealth;
  statusLabel: string;
  helperText: string;
}

export interface VehicleReminderItem {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  dueAt: Date | null;
  dueMileageKm: number | null;
  severity: "info" | "warning" | "due";
  status: NotificationStatus;
  updatedAt: Date;
}

export interface VehicleWorkspaceActionItem {
  id: string;
  label: string;
  tone: "danger" | "warning";
  helperText: string;
  actionLabel: string;
  href: string;
  group: "documents" | "vehicle" | "tracking";
}

export interface VehicleWorkspaceData {
  vehicleAvailabilityStatus: {
    status: VehicleStatus;
    label: string;
    tone: "success" | "info" | "warning" | "danger";
    detail: string;
  };
  complianceSummary: {
    status: ReminderHealth;
    label: string;
    blockedCount: number;
    warningCount: number;
    validCount: number;
    totalCount: number;
    summaryText: string;
  };
  missingCriticalItems: string[];
  expiringSoonItems: string[];
  documentIssueLabels: string[];
  nextBooking: VehicleReservationHistoryItem | null;
  lastInspection: VehicleInspectionHistoryItem | null;
  currentKilometrageKnown: boolean;
  openInfractionsCount: number;
  canGoOutToday: {
    value: boolean;
    label: string;
    helperText: string;
  };
  actionRequiredItems: VehicleWorkspaceActionItem[];
  actionStrip: {
    title: string;
    description: string;
    items: string[];
    primaryAction: {
      label: string;
      href: string;
    };
    secondaryAction: {
      label: string;
      href: string;
    } | null;
  } | null;
}

export interface VehicleReservationHistoryItem {
  id: string;
  customerName: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  paymentStatus: BookingPaymentStatus;
  depositStatus: BookingDepositStatus;
  status: BookingStatus;
  pickupLocation: string | null;
  returnLocation: string | null;
}

export interface VehicleInspectionHistoryItem {
  id: string;
  reportedAt: Date;
  inspectionType: InspectionType;
  bookingId: string;
  bookingStatus: BookingStatus;
  customerName: string;
  customerId: string;
  fuelLevel: string | null;
  cleanliness: string | null;
  totalDamageCost: number;
  damageCount: number;
  photosCount: number;
}

export interface VehicleInfractionItem {
  id: string;
  date: Date;
  type: string;
  status: InfractionStatus;
  amount: number | null;
  notes: string | null;
  bookingId: string | null;
  assignedClientName: string | null;
  customerId: string | null;
}

export interface VehicleActivityItem {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  href: string | null;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
}

export interface VehicleExpenseItem {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  method: PaymentType;
  note: string | null;
}

type ActivityTone = VehicleActivityItem["tone"];
type ReminderSeverity = VehicleReminderItem["severity"];

export interface VehicleProfileData {
  vehicle: {
    id: string;
    make: string;
    model: string;
    brandKey: string;
    year: number;
    plate: string;
    color: string;
    status: VehicleStatus;
    pricePerDay: number;
    depositAmount: number;
    gearbox: "AUTO" | "MANUAL";
    fuelType: "DIESEL" | "ESSENCE" | "HYBRID" | "ELECTRIC";
    seats: number;
    hasAC: boolean;
    category: string;
    photoUrl: string | null;
    publishedToWebsite: boolean;
    mileage: number | null;
    currentKm: number | null;
    maintenanceNotes: string | null;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceStartDate: Date | null;
    insuranceExpiryDate: Date | null;
    lastTechnicalInspectionDate: Date | null;
    nextTechnicalInspectionDate: Date | null;
    vignetteExpiryDate: Date | null;
    lastOilChangeMileageKm: number | null;
    lastOilChangeDate: Date | null;
    nextOilChangeMileageKm: number | null;
    nextOilChangeDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  currentReservation: VehicleReservationHistoryItem | null;
  nextReservation: VehicleReservationHistoryItem | null;
  reservations: VehicleReservationHistoryItem[];
  latestInspection: VehicleInspectionHistoryItem | null;
  inspections: VehicleInspectionHistoryItem[];
  reminders: {
    overdue: VehicleReminderItem[];
    open: VehicleReminderItem[];
    done: VehicleReminderItem[];
    nextOilChange: VehicleComplianceItem;
  };
  compliance: VehicleComplianceItem[];
  infractions: VehicleInfractionItem[];
  vehicleExpenses: VehicleExpenseItem[];
  activity: VehicleActivityItem[];
  workspace: VehicleWorkspaceData;
}

const OPEN_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "ACTIVE"];

const INFRACTION_OPEN_STATUSES: InfractionStatus[] = ["PENDING", "ASSIGNED", "CONTESTED"];

function isPrismaMissingVehicleDocumentsSchemaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2021", "P2022"].includes(error.code)
  );
}

async function getVehicleDocumentsSafe(params: {
  agencyId: string;
  vehicleId: string;
}) {
  const vehicleDocumentDelegate = (prisma as typeof prisma & {
    vehicleDocument?: {
      findMany: typeof prisma.vehicleDocument.findMany;
    };
  }).vehicleDocument;

  if (!vehicleDocumentDelegate) {
    return [];
  }

  try {
    return await vehicleDocumentDelegate.findMany({
      where: {
        agencyId: params.agencyId,
        vehicleId: params.vehicleId,
      },
    });
  } catch (error) {
    if (isPrismaMissingVehicleDocumentsSchemaError(error)) {
      console.warn(
        "Vehicle documents table/columns unavailable while loading vehicle profile; continuing without documents.",
      );
      return [];
    }

    throw error;
  }
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function getReminderHealth(date: Date | null, soonDays = 30): VehicleComplianceItem["status"] {
  if (!date) return "missing";
  const today = startOfToday();
  const soon = addDays(today, soonDays);
  if (date < today) return "overdue";
  if (date <= soon) return "soon";
  return "ok";
}

function toHealthCopy(status: ReminderHealth): Pick<VehicleComplianceItem, "statusLabel" | "helperText"> {
  switch (status) {
    case "ok":
      return { statusLabel: "Conforme", helperText: "Aucune action immédiate" };
    case "soon":
      return { statusLabel: "Expire bientôt", helperText: "À surveiller prochainement" };
    case "overdue":
      return { statusLabel: "Expiré", helperText: "Action requise" };
    default:
      return { statusLabel: "À renseigner", helperText: "Information manquante" };
  }
}

function mapReservation(
  item: {
    id: string;
    customer: { id: string; name: string };
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    paymentStatus: BookingPaymentStatus;
    depositStatus: BookingDepositStatus;
    status: BookingStatus;
    pickupLocation: string | null;
    returnLocation: string | null;
  },
): VehicleReservationHistoryItem {
  return {
    id: item.id,
    customerName: item.customer.name,
    customerId: item.customer.id,
    startDate: item.startDate,
    endDate: item.endDate,
    totalPrice: item.totalPrice,
    paymentStatus: item.paymentStatus,
    depositStatus: item.depositStatus,
    status: item.status,
    pickupLocation: item.pickupLocation,
    returnLocation: item.returnLocation,
  };
}

function formatDateLabel(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getHealthPriority(status: ReminderHealth) {
  switch (status) {
    case "overdue":
      return 4;
    case "missing":
      return 3;
    case "soon":
      return 2;
    default:
      return 1;
  }
}

function getWorstHealthStatus(statuses: ReminderHealth[]): ReminderHealth {
  return statuses.reduce<ReminderHealth>((worst, current) => {
    return getHealthPriority(current) > getHealthPriority(worst) ? current : worst;
  }, "ok");
}

function getComplianceSummaryCopy(status: ReminderHealth) {
  switch (status) {
    case "overdue":
      return "Bloquant";
    case "missing":
      return "À renseigner";
    case "soon":
      return "À surveiller";
    default:
      return "Tout est à jour";
  }
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count > 1 ? plural : singular}`;
}

function buildComplianceSummaryText(blockedCount: number, warningCount: number) {
  if (blockedCount > 0) {
    return `${formatCountLabel(blockedCount, "élément à compléter", "éléments à compléter")}`;
  }

  if (warningCount > 0) {
    return `${formatCountLabel(warningCount, "élément expire bientôt", "éléments expirent bientôt")}`;
  }

  return "Tous les éléments sont conformes";
}

function buildReminderSheetHref(vehicleId: string, reminderType?: ReminderType) {
  if (!reminderType) {
    return `/vehicles/${vehicleId}?tab=tracking&sheet=1`;
  }

  return `/vehicles/${vehicleId}?tab=tracking&sheet=1&reminder=${getReminderSheetTypeFromReminderType(reminderType)}`;
}

function getAvailabilityTone(status: VehicleStatus): VehicleWorkspaceData["vehicleAvailabilityStatus"]["tone"] {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "RENTED":
      return "info";
    case "MAINTENANCE":
      return "warning";
    default:
      return "danger";
  }
}

function buildAvailabilityDetail(
  vehicleStatus: VehicleStatus,
  currentReservation: VehicleReservationHistoryItem | null,
  nextReservation: VehicleReservationHistoryItem | null,
) {
  if (vehicleStatus === "RENTED" && currentReservation) {
    return `En location jusqu’au ${formatDateLabel(currentReservation.endDate)}`;
  }

  if (vehicleStatus === "AVAILABLE" && nextReservation) {
    return `Prochaine réservation le ${formatDateLabel(nextReservation.startDate)}`;
  }

  if (vehicleStatus === "MAINTENANCE") {
    return "Intervention en cours avant remise en service";
  }

  if (vehicleStatus === "UNAVAILABLE") {
    return "Véhicule hors service";
  }

  return "Aucune contrainte opérationnelle immédiate";
}

export function deriveVehicleWorkspace(input: {
  vehicle: VehicleProfileData["vehicle"];
  currentReservation: VehicleReservationHistoryItem | null;
  nextReservation: VehicleReservationHistoryItem | null;
  latestInspection: VehicleInspectionHistoryItem | null;
  reminders: VehicleProfileData["reminders"];
  compliance: VehicleComplianceItem[];
  infractions: VehicleInfractionItem[];
}): VehicleWorkspaceData {
  const { vehicle, currentReservation, nextReservation, latestInspection, reminders, compliance, infractions } = input;
  const openInfractionsCount = infractions.filter((item) =>
    INFRACTION_OPEN_STATUSES.includes(item.status),
  ).length;
  const currentKilometrageKnown = vehicle.currentKm != null;
  const overdueComplianceItems = compliance.filter((item) => item.status === "overdue");
  const missingComplianceItems = compliance.filter((item) => item.status === "missing");
  const soonComplianceItems = compliance.filter((item) => item.status === "soon");
  const overdueReminders = reminders.overdue;
  const hasOverdueOilChange = reminders.nextOilChange.status === "overdue";
  const hasSoonOilChange = reminders.nextOilChange.status === "soon";
  const blockedItems = [
    ...overdueComplianceItems.map((item) => `${item.label} expiré`),
    ...missingComplianceItems.map((item) => `${item.label} à renseigner`),
    ...(currentKilometrageKnown ? [] : ["Kilométrage non mis à jour"]),
    ...(hasOverdueOilChange ? ["Vidange en retard"] : []),
    ...overdueReminders.map((item) => item.title),
  ];
  const expiringSoonItems = [
    ...soonComplianceItems.map((item) => `${item.label} expire bientôt`),
    ...(hasSoonOilChange ? ["Vidange à planifier bientôt"] : []),
  ];
  const documentIssueLabels = [
    ...missingComplianceItems.map((item) => item.label),
    ...overdueComplianceItems.map((item) => item.label),
    ...soonComplianceItems.map((item) => item.label),
  ];
  const complianceStatuses = compliance.map((item) => item.status);
  const complianceSummaryStatus = getWorstHealthStatus(complianceStatuses);
  const blockedCount = overdueComplianceItems.length + missingComplianceItems.length;
  const warningCount = soonComplianceItems.length;
  const complianceSummary = {
    status: complianceSummaryStatus,
    label: getComplianceSummaryCopy(complianceSummaryStatus),
    blockedCount,
    warningCount,
    validCount: compliance.filter((item) => item.status === "ok").length,
    totalCount: compliance.length,
    summaryText: buildComplianceSummaryText(blockedCount, warningCount),
  };
  const primaryBlocker =
    blockedItems[0] ??
    (vehicle.status !== "AVAILABLE"
      ? buildAvailabilityDetail(vehicle.status, currentReservation, nextReservation)
      : null);
  const canGoOutToday =
    vehicle.status === "AVAILABLE" &&
    currentReservation == null &&
    blockedItems.length === 0;

  const actionRequiredItems: VehicleWorkspaceActionItem[] = [
    ...missingComplianceItems.map((item) => ({
      id: `missing-${item.id}`,
      label: item.label,
      tone: "danger" as const,
      helperText: item.helperText,
      actionLabel: item.id === "insurance" ? "Ajouter assurance" : "Ajouter document",
      href: `/vehicles/${vehicle.id}?tab=documents`,
      group: "documents" as const,
    })),
    ...overdueComplianceItems.map((item) => ({
      id: `overdue-${item.id}`,
      label: item.label,
      tone: "danger" as const,
      helperText: item.expiryDate
        ? `Échéance dépassée depuis le ${formatDateLabel(item.expiryDate)}`
        : "Document expiré",
      actionLabel: "Ajouter document",
      href: `/vehicles/${vehicle.id}?tab=documents`,
      group: "documents" as const,
    })),
    ...(!currentKilometrageKnown
      ? [
          {
            id: "missing-current-km",
            label: "Kilométrage non mis à jour",
            tone: "danger" as const,
            helperText: "Mettez à jour le kilométrage avant la prochaine sortie.",
            actionLabel: "Mettre à jour kilométrage",
            href: `/vehicles/${vehicle.id}/edit`,
            group: "vehicle" as const,
          },
        ]
      : []),
    ...(hasOverdueOilChange
      ? [
          {
            id: "overdue-oil-change",
            label: "Vidange en retard",
            tone: "danger" as const,
            helperText: "La prochaine échéance de vidange est dépassée.",
            actionLabel: "Ajouter un rappel",
            href: buildReminderSheetHref(vehicle.id, "OIL_CHANGE"),
            group: "tracking" as const,
          },
        ]
      : []),
    ...overdueReminders.map((item) => ({
      id: `reminder-${item.id}`,
      label: item.title,
      tone: "danger" as const,
      helperText: item.body,
      actionLabel: "Voir les rappels",
      href: buildReminderSheetHref(vehicle.id, item.type),
      group: "tracking" as const,
    })),
    ...(blockedItems.length === 0
      ? [
          ...soonComplianceItems.map((item) => ({
            id: `soon-${item.id}`,
            label: item.label,
            tone: "warning" as const,
            helperText: item.expiryDate
              ? `À renouveler avant le ${formatDateLabel(item.expiryDate)}`
              : item.helperText,
            actionLabel: "Voir documents",
            href: `/vehicles/${vehicle.id}?tab=documents`,
            group: "documents" as const,
          })),
          ...(hasSoonOilChange
            ? [
                {
                  id: "soon-oil-change",
                  label: "Vidange à planifier",
                  tone: "warning" as const,
                  helperText: "Préparez la prochaine échéance d’entretien.",
                  actionLabel: "Ajouter un rappel",
                  href: buildReminderSheetHref(vehicle.id, "OIL_CHANGE"),
                  group: "tracking" as const,
                },
              ]
            : []),
        ]
      : []),
  ];
  const hasDocumentIssues = documentIssueLabels.length > 0;
  const hasNonDocumentIssues = actionRequiredItems.some((item) => item.group !== "documents");
  const vehicleAction = actionRequiredItems.find((item) => item.group === "vehicle");
  const trackingAction = actionRequiredItems.find((item) => item.group === "tracking");
  const actionStrip =
    actionRequiredItems.length > 0
      ? {
          title: blockedItems.length > 0 ? "Action requise" : "À surveiller",
          description:
            blockedItems.length > 0
              ? "Des éléments bloquent la sortie ou demandent une action immédiate."
              : "Anticipez les prochaines échéances avant qu’elles ne deviennent bloquantes.",
          items: actionRequiredItems.slice(0, 4).map((item) => item.label),
          primaryAction: {
            label: "Compléter les informations",
            href:
              vehicleAction?.href ??
              (hasNonDocumentIssues
                ? trackingAction?.href ?? `/vehicles/${vehicle.id}/edit`
                : `/vehicles/${vehicle.id}?tab=documents`),
          },
          secondaryAction:
            hasDocumentIssues && hasNonDocumentIssues
              ? {
                  label: "Voir les documents",
                  href: `/vehicles/${vehicle.id}?tab=documents`,
                }
              : null,
        }
      : null;

  return {
    vehicleAvailabilityStatus: {
      status: vehicle.status,
      label:
        vehicle.status === "AVAILABLE"
          ? "Disponible"
          : vehicle.status === "RENTED"
          ? "Loué"
          : vehicle.status === "MAINTENANCE"
          ? "Maintenance"
          : "Indisponible",
      tone: getAvailabilityTone(vehicle.status),
      detail: buildAvailabilityDetail(vehicle.status, currentReservation, nextReservation),
    },
    complianceSummary,
    missingCriticalItems: blockedItems,
    expiringSoonItems,
    documentIssueLabels,
    nextBooking: nextReservation,
    lastInspection: latestInspection,
    currentKilometrageKnown,
    openInfractionsCount,
    canGoOutToday: {
      value: canGoOutToday,
      label: canGoOutToday ? "Prêt à sortir" : "À sécuriser avant départ",
      helperText: canGoOutToday
        ? "Aucun blocage opérationnel détecté aujourd’hui."
        : primaryBlocker ?? "Une vérification manuelle est requise.",
    },
    actionRequiredItems,
    actionStrip,
  };
}

export async function getVehicleProfile(agencyId: string, vehicleId: string): Promise<VehicleProfileData | null> {
  const now = new Date();

  const [
    vehicle,
    reservationsRaw,
    inspectionsRaw,
    notificationsRaw,
    infractionsRaw,
    documentsRaw,
    fuelType,
    vehicleExpensesRaw,
  ] =
    await Promise.all([
      prisma.vehicle.findFirst({
        where: { id: vehicleId, agencyId },
        select: {
          id: true,
          make: true,
          model: true,
          brandKey: true,
          year: true,
          plate: true,
          color: true,
          status: true,
          pricePerDay: true,
          depositAmount: true,
          gearbox: true,
          seats: true,
          hasAC: true,
          category: true,
          photoUrl: true,
          publishedToWebsite: true,
          mileage: true,
          currentKm: true,
          maintenanceNotes: true,
          insuranceProvider: true,
          insurancePolicyNumber: true,
          insuranceStartDate: true,
          insuranceExpiryDate: true,
          lastTechnicalInspectionDate: true,
          nextTechnicalInspectionDate: true,
          vignetteExpiryDate: true,
          lastOilChangeMileageKm: true,
          lastOilChangeDate: true,
          nextOilChangeMileageKm: true,
          nextOilChangeDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          agencyId,
          vehicleId,
          status: { not: "CANCELED" },
        },
        orderBy: { startDate: "desc" },
        include: {
          customer: { select: { id: true, name: true } },
        },
      }),
      prisma.damageReport.findMany({
        where: {
          booking: {
            agencyId,
            vehicleId,
          },
        },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              customer: { select: { id: true, name: true } },
            },
          },
          sections: {
            select: {
              id: true,
              status: true,
            },
          },
          damagePhotos: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { reportedAt: "desc" },
      }),
      prisma.notification.findMany({
        where: {
          agencyId,
          vehicleId,
          type: {
            in: ["OIL_CHANGE", "INSURANCE_EXPIRY", "TECH_INSPECTION", "VIGNETTE"],
          },
        },
        orderBy: [
          { severity: "desc" },
          { updatedAt: "desc" },
        ],
      }),
      prisma.infraction.findMany({
        where: {
          agencyId,
          vehicleId,
        },
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      getVehicleDocumentsSafe({ agencyId, vehicleId }),
      getVehicleFuelType(vehicleId),
      prisma.expense.findMany({
        where: {
          agencyId,
          vehicleId,
        },
        select: {
          id: true,
          date: true,
          category: true,
          amount: true,
          method: true,
          note: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

  if (!vehicle) {
    return null;
  }

  const documentsByType = new Map(documentsRaw.map((document) => [document.type, document]));

  const reservations = reservationsRaw.map(mapReservation);
  const currentReservation =
    reservations.find(
      (reservation) =>
        OPEN_BOOKING_STATUSES.includes(reservation.status) &&
        reservation.startDate <= now &&
        reservation.endDate >= now,
    ) ?? null;

  const nextReservation =
    reservations
      .filter((reservation) => reservation.endDate >= now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .find((reservation) => reservation.id !== currentReservation?.id) ?? null;

  const inspections = inspectionsRaw.map((inspection) => ({
    id: inspection.id,
    reportedAt: inspection.reportedAt,
    inspectionType: inspection.inspectionType,
    bookingId: inspection.booking.id,
    bookingStatus: inspection.booking.status,
    customerName: inspection.booking.customer.name,
    customerId: inspection.booking.customer.id,
    fuelLevel: inspection.fuelLevel,
    cleanliness: inspection.cleanliness,
    totalDamageCost: inspection.totalDamageCost,
    damageCount: inspection.sections.filter((section) => section.status === "DAMAGE").length,
    photosCount: inspection.damagePhotos.length,
  }));

  const reminders: VehicleReminderItem[] = notificationsRaw.map((notification) => ({
    id: notification.id,
    type: notification.type as ReminderType,
    title: notification.title,
    body: notification.body,
    dueAt: notification.dueAt,
    dueMileageKm: notification.dueMileageKm,
    severity: (
      notification.severity === "DUE"
        ? "due"
        : notification.severity === "WARNING"
        ? "warning"
        : "info"
    ) as ReminderSeverity,
    status: notification.status,
    updatedAt: notification.updatedAt,
  }));

  const insuranceExpiryDate = documentsByType.get("INSURANCE")?.expiryDate ?? vehicle.insuranceExpiryDate;
  const technicalInspectionExpiryDate =
    documentsByType.get("TECHNICAL_INSPECTION")?.expiryDate ?? vehicle.nextTechnicalInspectionDate;
  const vignetteExpiryDate = documentsByType.get("VIGNETTE")?.expiryDate ?? vehicle.vignetteExpiryDate;
  const registrationExpiryDate = documentsByType.get("REGISTRATION")?.expiryDate ?? null;

  const insuranceHealth = getReminderHealth(insuranceExpiryDate);
  const inspectionHealth = getReminderHealth(technicalInspectionExpiryDate);
  const vignetteHealth = getReminderHealth(vignetteExpiryDate);
  const registrationHealth = getReminderHealth(registrationExpiryDate);
  const oilHealth =
    getReminderHealth(vehicle.nextOilChangeDate) === "missing" && !vehicle.nextOilChangeMileageKm
      ? "missing"
      : vehicle.nextOilChangeDate && getReminderHealth(vehicle.nextOilChangeDate) === "overdue"
      ? "overdue"
      : vehicle.nextOilChangeMileageKm && vehicle.currentKm && vehicle.currentKm >= vehicle.nextOilChangeMileageKm
      ? "overdue"
      : vehicle.nextOilChangeDate && getReminderHealth(vehicle.nextOilChangeDate) === "soon"
      ? "soon"
      : vehicle.nextOilChangeMileageKm &&
        vehicle.currentKm &&
        vehicle.nextOilChangeMileageKm - vehicle.currentKm <= 1000
      ? "soon"
      : "ok";

  const compliance: VehicleComplianceItem[] = [
    {
      id: "insurance",
      type: "INSURANCE",
      label: "Assurance",
      documentId: documentsByType.get("INSURANCE")?.id ?? null,
      reference: documentsByType.get("INSURANCE")?.reference ?? vehicle.insurancePolicyNumber,
      startDate: documentsByType.get("INSURANCE")?.startDate ?? vehicle.insuranceStartDate,
      expiryDate: insuranceExpiryDate,
      fileUrl: documentsByType.get("INSURANCE")?.fileUrl ?? null,
      status: insuranceHealth,
      ...toHealthCopy(insuranceHealth),
    },
    {
      id: "technical-inspection",
      type: "TECHNICAL_INSPECTION",
      label: "Visite technique",
      documentId: documentsByType.get("TECHNICAL_INSPECTION")?.id ?? null,
      reference: documentsByType.get("TECHNICAL_INSPECTION")?.reference ?? null,
      startDate:
        documentsByType.get("TECHNICAL_INSPECTION")?.startDate ?? vehicle.lastTechnicalInspectionDate,
      expiryDate:
        technicalInspectionExpiryDate,
      fileUrl: documentsByType.get("TECHNICAL_INSPECTION")?.fileUrl ?? null,
      status: inspectionHealth,
      ...toHealthCopy(inspectionHealth),
    },
    {
      id: "vignette",
      type: "VIGNETTE",
      label: "Vignette",
      documentId: documentsByType.get("VIGNETTE")?.id ?? null,
      reference: documentsByType.get("VIGNETTE")?.reference ?? null,
      startDate: documentsByType.get("VIGNETTE")?.startDate ?? null,
      expiryDate: vignetteExpiryDate,
      fileUrl: documentsByType.get("VIGNETTE")?.fileUrl ?? null,
      status: vignetteHealth,
      ...toHealthCopy(vignetteHealth),
    },
    {
      id: "registration",
      type: "REGISTRATION",
      label: "Carte grise",
      documentId: documentsByType.get("REGISTRATION")?.id ?? null,
      reference: documentsByType.get("REGISTRATION")?.reference ?? vehicle.plate,
      startDate: documentsByType.get("REGISTRATION")?.startDate ?? null,
      expiryDate: registrationExpiryDate,
      fileUrl: documentsByType.get("REGISTRATION")?.fileUrl ?? null,
      status: registrationHealth,
      ...toHealthCopy(registrationHealth),
    },
  ];

  const nextOilChange: VehicleComplianceItem = {
    id: "technical-inspection",
    type: "TECHNICAL_INSPECTION",
    label: "Prochaine vidange",
    documentId: null,
    reference: vehicle.nextOilChangeMileageKm ? `${vehicle.nextOilChangeMileageKm} km` : null,
    startDate: vehicle.lastOilChangeDate,
    expiryDate: vehicle.nextOilChangeDate,
    fileUrl: null,
    status: oilHealth,
    ...toHealthCopy(oilHealth),
  };

  const openReminders = reminders.filter((item) => item.status === "OPEN");
  const overdueReminders = openReminders.filter(
    (item) =>
      (item.dueAt && item.dueAt < now) ||
      (item.dueMileageKm != null && vehicle.currentKm != null && vehicle.currentKm >= item.dueMileageKm),
  );

  const infractions = infractionsRaw.map((infraction) => ({
    id: infraction.id,
    date: infraction.date,
    type: infraction.type,
    status: infraction.status,
    amount: infraction.amount,
    notes: infraction.notes,
    bookingId: infraction.bookingId,
    assignedClientName: infraction.clientName ?? infraction.customer?.name ?? null,
    customerId: infraction.customerId,
  }));

  const activity: VehicleActivityItem[] = [
    {
      id: `vehicle-created-${vehicle.id}`,
      timestamp: vehicle.createdAt,
      title: "Véhicule ajouté",
      description: `${vehicle.make} ${vehicle.model} a été ajouté au parc.`,
      href: null,
      tone: "success" as ActivityTone,
    },
    ...reservations.slice(0, 4).map((reservation) => ({
      id: `booking-${reservation.id}`,
      timestamp: reservation.startDate,
      title: "Réservation liée",
      description: `${reservation.customerName} · ${reservation.status.toLowerCase()}`,
      href: `/bookings/${reservation.id}`,
      tone: (reservation.status === "ACTIVE" ? "info" : "neutral") as ActivityTone,
    })),
    ...inspections.slice(0, 4).map((inspection) => ({
      id: `inspection-${inspection.id}`,
      timestamp: inspection.reportedAt,
      title: `Inspection ${inspection.inspectionType === "DEPART" ? "départ" : "retour"}`,
      description: inspection.damageCount > 0
        ? `${inspection.damageCount} dommage(s) signalé(s)`
        : "Aucun dommage signalé",
      href: `/damage-reports/${inspection.id}`,
      tone: (inspection.damageCount > 0 ? "warning" : "success") as ActivityTone,
    })),
    ...reminders.slice(0, 4).map((reminder) => ({
      id: `reminder-${reminder.id}`,
      timestamp: reminder.updatedAt,
      title: "Rappel véhicule",
      description: reminder.title,
      href: "/notifications",
      tone: (
        reminder.status === "DONE" ? "success" : reminder.severity === "due" ? "warning" : "neutral"
      ) as ActivityTone,
    })),
    ...infractions.slice(0, 4).map((infraction) => ({
      id: `infraction-${infraction.id}`,
      timestamp: infraction.date,
      title: "Infraction enregistrée",
      description: infraction.assignedClientName ?? "À assigner",
      href: `/infractions/${infraction.id}`,
      tone: (INFRACTION_OPEN_STATUSES.includes(infraction.status) ? "danger" : "neutral") as ActivityTone,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const vehicleExpenses: VehicleExpenseItem[] = vehicleExpensesRaw.map((expense) => ({
    id: expense.id,
    date: expense.date,
    category: expense.category,
    amount: Number(expense.amount),
    method: expense.method,
    note: expense.note,
  }));

  return {
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      brandKey: vehicle.brandKey,
      year: vehicle.year,
      plate: vehicle.plate,
      color: vehicle.color,
      status: vehicle.status,
      pricePerDay: vehicle.pricePerDay,
      depositAmount: vehicle.depositAmount,
      gearbox: vehicle.gearbox,
      fuelType,
      seats: vehicle.seats,
      hasAC: vehicle.hasAC,
      category: vehicle.category,
      photoUrl: vehicle.photoUrl,
      publishedToWebsite: vehicle.publishedToWebsite,
      mileage: vehicle.mileage,
      currentKm: vehicle.currentKm,
      maintenanceNotes: vehicle.maintenanceNotes,
      insuranceProvider: vehicle.insuranceProvider,
      insurancePolicyNumber: vehicle.insurancePolicyNumber,
      insuranceStartDate: vehicle.insuranceStartDate,
      insuranceExpiryDate: vehicle.insuranceExpiryDate,
      lastTechnicalInspectionDate: vehicle.lastTechnicalInspectionDate,
      nextTechnicalInspectionDate: vehicle.nextTechnicalInspectionDate,
      vignetteExpiryDate: vehicle.vignetteExpiryDate,
      lastOilChangeMileageKm: vehicle.lastOilChangeMileageKm,
      lastOilChangeDate: vehicle.lastOilChangeDate,
      nextOilChangeMileageKm: vehicle.nextOilChangeMileageKm,
      nextOilChangeDate: vehicle.nextOilChangeDate,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    },
    currentReservation,
    nextReservation,
    reservations,
    latestInspection: inspections[0] ?? null,
    inspections,
    reminders: {
      overdue: overdueReminders,
      open: openReminders,
      done: reminders.filter((item) => item.status === "DONE"),
      nextOilChange,
    },
    compliance,
    infractions,
    vehicleExpenses,
    activity,
    workspace: deriveVehicleWorkspace({
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        brandKey: vehicle.brandKey,
        year: vehicle.year,
        plate: vehicle.plate,
        color: vehicle.color,
        status: vehicle.status,
        pricePerDay: vehicle.pricePerDay,
        depositAmount: vehicle.depositAmount,
        gearbox: vehicle.gearbox,
        fuelType,
        seats: vehicle.seats,
        hasAC: vehicle.hasAC,
        category: vehicle.category,
        photoUrl: vehicle.photoUrl,
        publishedToWebsite: vehicle.publishedToWebsite,
        mileage: vehicle.mileage,
        currentKm: vehicle.currentKm,
        maintenanceNotes: vehicle.maintenanceNotes,
        insuranceProvider: vehicle.insuranceProvider,
        insurancePolicyNumber: vehicle.insurancePolicyNumber,
        insuranceStartDate: vehicle.insuranceStartDate,
        insuranceExpiryDate: vehicle.insuranceExpiryDate,
        lastTechnicalInspectionDate: vehicle.lastTechnicalInspectionDate,
        nextTechnicalInspectionDate: vehicle.nextTechnicalInspectionDate,
        vignetteExpiryDate: vehicle.vignetteExpiryDate,
        lastOilChangeMileageKm: vehicle.lastOilChangeMileageKm,
        lastOilChangeDate: vehicle.lastOilChangeDate,
        nextOilChangeMileageKm: vehicle.nextOilChangeMileageKm,
        nextOilChangeDate: vehicle.nextOilChangeDate,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      },
      currentReservation,
      nextReservation,
      latestInspection: inspections[0] ?? null,
      reminders: {
        overdue: overdueReminders,
        open: openReminders,
        done: reminders.filter((item) => item.status === "DONE"),
        nextOilChange,
      },
      compliance,
      infractions,
    }),
  };
}
