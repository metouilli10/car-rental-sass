import { addMonths, differenceInDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import type {
  NotificationSeverity,
  NotificationStatus,
  ReminderType,
} from "@prisma/client";
import { DEFAULT_LEAD_DAYS, DEFAULT_LEAD_KM } from "./types";

// ─── Severity helpers ────────────────────────────────────────────────────────

function severityFromDays(daysLeft: number): NotificationSeverity {
  if (daysLeft <= 0) return "DUE";
  if (daysLeft <= 7) return "WARNING";
  return "INFO";
}

function severityFromKm(remainingKm: number): NotificationSeverity {
  if (remainingKm <= 0) return "DUE";
  if (remainingKm <= 100) return "WARNING";
  return "INFO";
}

// ─── Notification upsert helper ───────────────────────────────────────────────

async function upsertNotification(params: {
  agencyId: string;
  vehicleId: string;
  type: ReminderType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  dueAt?: Date | null;
  dueMileageKm?: number | null;
}) {
  const { agencyId, vehicleId, type, title, body, severity, dueAt, dueMileageKm } =
    params;

  // Check for existing notification
  const existing = await prisma.notification.findUnique({
    where: { agencyId_vehicleId_type: { agencyId, vehicleId, type } },
  });

  if (existing) {
    // Don't recreate if the user already marked it DONE or DISMISSED
    if (existing.status === "DONE" || existing.status === "DISMISSED") {
      // Update severity/body in case data changed significantly
      await prisma.notification.update({
        where: { id: existing.id },
        data: { title, body, severity, dueAt, dueMileageKm, updatedAt: new Date() },
      });
      return;
    }

    // If snoozed and still within snooze period, preserve SNOOZED status
    const now = new Date();
    const status: NotificationStatus =
      existing.status === "SNOOZED" &&
      existing.snoozedUntil != null &&
      existing.snoozedUntil > now
        ? "SNOOZED"
        : "OPEN";

    await prisma.notification.update({
      where: { id: existing.id },
      data: { title, body, severity, dueAt, dueMileageKm, status, updatedAt: new Date() },
    });
  } else {
    await prisma.notification.create({
      data: {
        agencyId,
        vehicleId,
        type,
        title,
        body,
        severity,
        dueAt: dueAt ?? null,
        dueMileageKm: dueMileageKm ?? null,
        status: "OPEN",
      },
    });
  }
}

// ─── Delete notification if condition no longer applies ───────────────────────

async function clearNotificationIfOpen(
  agencyId: string,
  vehicleId: string,
  type: ReminderType
) {
  const existing = await prisma.notification.findUnique({
    where: { agencyId_vehicleId_type: { agencyId, vehicleId, type } },
  });
  if (existing && existing.status === "OPEN") {
    await prisma.notification.delete({ where: { id: existing.id } });
  }
}

// ─── Per-type reminder checks ────────────────────────────────────────────────

async function checkOilChange(
  vehicle: {
    id: string;
    make: string;
    model: string;
    plate: string;
    currentKm: number | null;
    lastOilChangeMileageKm: number | null;
    lastOilChangeDate: Date | null;
    oilChangeIntervalKm: number | null;
    oilChangeIntervalMonths: number | null;
    nextOilChangeMileageKm: number | null;
    nextOilChangeDate: Date | null;
  },
  agencyId: string,
  leadKm: number[],
  leadDays: number[],
  now: Date
) {
  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.plate})`;

  // ── A1: Mileage-based check ──────────────────────────────────────────────
  let nextKm: number | null = null;

  if (vehicle.nextOilChangeMileageKm != null) {
    nextKm = vehicle.nextOilChangeMileageKm;
  } else if (
    vehicle.lastOilChangeMileageKm != null &&
    vehicle.oilChangeIntervalKm != null
  ) {
    nextKm = vehicle.lastOilChangeMileageKm + vehicle.oilChangeIntervalKm;
  }

  if (nextKm != null && vehicle.currentKm != null) {
    const remaining = nextKm - vehicle.currentKm;
    const triggered = leadKm.some((threshold) => remaining <= threshold);

    if (triggered) {
      const severity = severityFromKm(remaining);
      const dueLabel =
        remaining <= 0
          ? `Vidange dépassée de ${Math.abs(remaining).toLocaleString("fr-FR")} km`
          : `${remaining.toLocaleString("fr-FR")} km restants`;

      await upsertNotification({
        agencyId,
        vehicleId: vehicle.id,
        type: "OIL_CHANGE",
        title: "Vidange à prévoir",
        body: `${vehicleName} — ${dueLabel}`,
        severity,
        dueMileageKm: nextKm,
      });
      return; // mileage takes priority
    }
  }

  // ── A2: Date-based fallback ──────────────────────────────────────────────
  let nextDate: Date | null = null;

  if (vehicle.nextOilChangeDate != null) {
    nextDate = vehicle.nextOilChangeDate;
  } else if (
    vehicle.lastOilChangeDate != null &&
    vehicle.oilChangeIntervalMonths != null
  ) {
    nextDate = addMonths(vehicle.lastOilChangeDate, vehicle.oilChangeIntervalMonths);
  }

  if (nextDate != null) {
    const daysLeft = differenceInDays(nextDate, now);
    const triggered = leadDays.some((threshold) => daysLeft <= threshold);

    if (triggered) {
      const severity = severityFromDays(daysLeft);
      const dueLabel =
        daysLeft <= 0
          ? `Vidange dépassée de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}`
          : `Dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

      await upsertNotification({
        agencyId,
        vehicleId: vehicle.id,
        type: "OIL_CHANGE",
        title: "Vidange à prévoir",
        body: `${vehicleName} — ${dueLabel}`,
        severity,
        dueAt: nextDate,
      });
      return;
    }
  }

  // No condition triggered → clear any stale OPEN notification
  await clearNotificationIfOpen(agencyId, vehicle.id, "OIL_CHANGE");
}

async function checkDateBasedReminder(
  vehicle: { id: string; make: string; model: string; plate: string },
  agencyId: string,
  type: ReminderType,
  expiryDate: Date | null,
  leadDays: number[],
  now: Date,
  labels: { title: string; dueSuffix: string; overdueSuffix: string }
) {
  if (expiryDate == null) {
    await clearNotificationIfOpen(agencyId, vehicle.id, type);
    return;
  }

  const daysLeft = differenceInDays(expiryDate, now);
  const triggered = leadDays.some((threshold) => daysLeft <= threshold);

  if (!triggered) {
    await clearNotificationIfOpen(agencyId, vehicle.id, type);
    return;
  }

  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.plate})`;
  const severity = severityFromDays(daysLeft);
  const dueLabel =
    daysLeft <= 0
      ? `${labels.overdueSuffix} de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}`
      : `${labels.dueSuffix} dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

  await upsertNotification({
    agencyId,
    vehicleId: vehicle.id,
    type,
    title: labels.title,
    body: `${vehicleName} — ${dueLabel}`,
    severity,
    dueAt: expiryDate,
  });
}

// ─── Main compute function ────────────────────────────────────────────────────

export async function computeVehicleReminders(
  vehicleId: string,
  agencyId: string
): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return;

  // Load agency reminder rules (use defaults if not configured)
  const dbRules = await prisma.reminderRule.findMany({ where: { agencyId } });

  const getRuleDefaults = (type: ReminderType) => {
    const rule = dbRules.find((r) => r.type === type);
    return {
      enabled: rule?.enabled ?? true,
      leadDays: rule?.leadDays?.length ? rule.leadDays : DEFAULT_LEAD_DAYS,
      leadKm: rule?.leadKm?.length ? rule.leadKm : DEFAULT_LEAD_KM,
    };
  };

  const now = new Date();

  // ── OIL_CHANGE ────────────────────────────────────────────────────────────
  const oilRule = getRuleDefaults("OIL_CHANGE");
  if (oilRule.enabled) {
    await checkOilChange(vehicle, agencyId, oilRule.leadKm, oilRule.leadDays, now);
  }

  // ── INSURANCE_EXPIRY ──────────────────────────────────────────────────────
  const insuranceRule = getRuleDefaults("INSURANCE_EXPIRY");
  if (insuranceRule.enabled) {
    const leadDays =
      vehicle.insuranceReminderDays?.length
        ? vehicle.insuranceReminderDays
        : insuranceRule.leadDays;
    await checkDateBasedReminder(
      vehicle,
      agencyId,
      "INSURANCE_EXPIRY",
      vehicle.insuranceExpiryDate,
      leadDays,
      now,
      {
        title: "Assurance à renouveler",
        dueSuffix: "Expire",
        overdueSuffix: "Assurance expirée",
      }
    );
  }

  // ── TECH_INSPECTION ───────────────────────────────────────────────────────
  const techRule = getRuleDefaults("TECH_INSPECTION");
  if (techRule.enabled) {
    const leadDays =
      vehicle.technicalInspectionReminderDays?.length
        ? vehicle.technicalInspectionReminderDays
        : techRule.leadDays;
    await checkDateBasedReminder(
      vehicle,
      agencyId,
      "TECH_INSPECTION",
      vehicle.nextTechnicalInspectionDate,
      leadDays,
      now,
      {
        title: "Visite technique à prévoir",
        dueSuffix: "Prévue",
        overdueSuffix: "Visite technique dépassée",
      }
    );
  }

  // ── VIGNETTE ──────────────────────────────────────────────────────────────
  const vignetteRule = getRuleDefaults("VIGNETTE");
  if (vignetteRule.enabled) {
    const leadDays =
      vehicle.vignetteReminderDays?.length
        ? vehicle.vignetteReminderDays
        : vignetteRule.leadDays;
    await checkDateBasedReminder(
      vehicle,
      agencyId,
      "VIGNETTE",
      vehicle.vignetteExpiryDate,
      leadDays,
      now,
      {
        title: "Vignette à renouveler",
        dueSuffix: "Expire",
        overdueSuffix: "Vignette expirée",
      }
    );
  }
}
