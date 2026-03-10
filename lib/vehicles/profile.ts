import type {
  BookingDepositStatus,
  BookingPaymentStatus,
  BookingStatus,
  InfractionStatus,
  InspectionType,
  NotificationStatus,
  ReminderType,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { VehicleDocumentTypeValue } from "@/lib/validations/vehicle-document";

export const VEHICLE_PROFILE_TABS = [
  "overview",
  "reservations",
  "inspections",
  "maintenance",
  "compliance",
  "infractions",
] as const;

export type VehicleProfileTab = (typeof VEHICLE_PROFILE_TABS)[number];

export function isVehicleProfileTab(value: string | undefined): value is VehicleProfileTab {
  return Boolean(value && VEHICLE_PROFILE_TABS.includes(value as VehicleProfileTab));
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
    seats: number;
    hasAC: boolean;
    category: string;
    photoUrl: string | null;
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
  activity: VehicleActivityItem[];
}

const OPEN_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "ACTIVE"];

const INFRACTION_OPEN_STATUSES: InfractionStatus[] = ["PENDING", "ASSIGNED", "CONTESTED"];

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
      return { statusLabel: "Valide", helperText: "Aucune action immédiate" };
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

export async function getVehicleProfile(agencyId: string, vehicleId: string): Promise<VehicleProfileData | null> {
  const now = new Date();
  const vehicleDocumentDelegate = (prisma as typeof prisma & {
    vehicleDocument?: {
      findMany: typeof prisma.vehicleDocument.findMany;
    };
  }).vehicleDocument;

  const [vehicle, reservationsRaw, inspectionsRaw, notificationsRaw, infractionsRaw, documentsRaw] =
    await Promise.all([
      prisma.vehicle.findFirst({
        where: { id: vehicleId, agencyId },
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
      vehicleDocumentDelegate
        ? vehicleDocumentDelegate.findMany({
            where: {
              agencyId,
              vehicleId,
            },
          })
        : Promise.resolve([]),
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
    type: notification.type,
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
      seats: vehicle.seats,
      hasAC: vehicle.hasAC,
      category: vehicle.category,
      photoUrl: vehicle.photoUrl,
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
    activity,
  };
}
