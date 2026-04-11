import type {
  NotificationSeverity,
  NotificationStatus,
  ReminderType,
} from "@prisma/client";
import type { AppLocale } from "@/lib/i18n/config";

type NotificationVehicle = {
  make: string;
  model: string;
  plate: string;
};

type DateLike = Date | string;

export type NotificationPresentationInput = {
  locale: AppLocale;
  type: ReminderType;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  body: string;
  dueAt: DateLike | null;
  dueMileageKm: number | null;
  snoozedUntil: DateLike | null;
  updatedAt: DateLike;
  vehicle: NotificationVehicle;
};

const REMINDER_TYPES: ReminderType[] = [
  "OIL_CHANGE",
  "INSURANCE_EXPIRY",
  "TECH_INSPECTION",
  "VIGNETTE",
];

function isArabic(locale: AppLocale) {
  return locale === "ar";
}

function localeTag(locale: AppLocale) {
  return isArabic(locale) ? "ar-MA" : "fr-FR";
}

function isReminderType(type: ReminderType) {
  return REMINDER_TYPES.includes(type);
}

export function formatNotificationDate(
  locale: AppLocale,
  date: DateLike,
  withYear = true
) {
  const normalized = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(normalized);
}

export function formatNotificationKm(locale: AppLocale, value: number) {
  return new Intl.NumberFormat(localeTag(locale)).format(value);
}

export function getNotificationTypeLabel(
  locale: AppLocale,
  type: ReminderType
) {
  if (isArabic(locale)) {
    if (type === "OIL_CHANGE") return "تغيير الزيت";
    if (type === "INSURANCE_EXPIRY") return "التأمين";
    if (type === "TECH_INSPECTION") return "الفحص التقني";
    if (type === "VIGNETTE") return "الضريبة";
    return "انطلاق الحجز";
  }

  if (type === "OIL_CHANGE") return "Vidange";
  if (type === "INSURANCE_EXPIRY") return "Assurance";
  if (type === "TECH_INSPECTION") return "Visite technique";
  if (type === "VIGNETTE") return "Vignette";
  return "Depart de reservation";
}

export function getNotificationSeverityLabel(
  locale: AppLocale,
  severity: NotificationSeverity
) {
  if (isArabic(locale)) {
    if (severity === "INFO") return "معلومة";
    if (severity === "WARNING") return "تنبيه";
    return "عاجل";
  }

  if (severity === "INFO") return "Info";
  if (severity === "WARNING") return "Attention";
  return "Urgent";
}

export function getNotificationStatusLabel(
  locale: AppLocale,
  status: NotificationStatus
) {
  if (isArabic(locale)) {
    if (status === "OPEN") return "مطلوب";
    if (status === "SNOOZED") return "مؤجل";
    if (status === "DONE") return "مكتمل";
    return "تم تجاهله";
  }

  if (status === "OPEN") return "A faire";
  if (status === "SNOOZED") return "Snoozee";
  if (status === "DONE") return "Terminee";
  return "Ignoree";
}

export function getNotificationDueLabel(
  locale: AppLocale,
  dueAt: DateLike | null,
  dueMileageKm: number | null
) {
  if (dueAt) {
    const formattedDate = formatNotificationDate(locale, dueAt);
    return isArabic(locale)
      ? `تاريخ الاستحقاق ${formattedDate}`
      : `Echeance le ${formattedDate}`;
  }

  if (dueMileageKm != null) {
    const km = formatNotificationKm(locale, dueMileageKm);
    return isArabic(locale) ? `عند ${km} كم` : `A ${km} km`;
  }

  return null;
}

export function getNotificationStatusContextLabel(
  locale: AppLocale,
  status: NotificationStatus,
  snoozedUntil: DateLike | null,
  updatedAt: DateLike
) {
  if (status === "SNOOZED") {
    if (snoozedUntil) {
      return isArabic(locale)
        ? `الاستئناف في ${formatNotificationDate(locale, snoozedUntil)}`
        : `Reprise le ${formatNotificationDate(locale, snoozedUntil)}`;
    }
    return isArabic(locale) ? "تم التأجيل" : "Action reportee";
  }

  if (status === "DONE") {
    return isArabic(locale)
      ? `تمت المعالجة في ${formatNotificationDate(locale, updatedAt)}`
      : `Traite le ${formatNotificationDate(locale, updatedAt)}`;
  }

  if (status === "DISMISSED") {
    return isArabic(locale)
      ? `تم التجاهل في ${formatNotificationDate(locale, updatedAt)}`
      : `Ignoree le ${formatNotificationDate(locale, updatedAt)}`;
  }

  return isArabic(locale) ? "قيد المتابعة" : "A suivre";
}

export function getNotificationPrimaryActionLabel(
  locale: AppLocale,
  type: ReminderType
) {
  return isArabic(locale) ? "عرض المركبة" : "Voir le vehicule";
}

export function getNotificationDisplayCopy(
  input: NotificationPresentationInput
) {
  const dueLabel = getNotificationDueLabel(
    input.locale,
    input.dueAt,
    input.dueMileageKm
  );

  if (!isReminderType(input.type)) {
    return {
      title: input.title,
      body: input.body,
      dueLabel,
    };
  }

  const vehicleLabel = `${input.vehicle.make} ${input.vehicle.model} (${input.vehicle.plate})`;
  const reminderTitle = isArabic(input.locale)
    ? (() => {
        if (input.type === "OIL_CHANGE") return "تذكير تغيير الزيت";
        if (input.type === "INSURANCE_EXPIRY") return "تجديد التأمين";
        if (input.type === "TECH_INSPECTION") return "الفحص التقني";
        return "تجديد الضريبة";
      })()
    : (() => {
        if (input.type === "OIL_CHANGE") return "Vidange a prevoir";
        if (input.type === "INSURANCE_EXPIRY") return "Assurance a renouveler";
        if (input.type === "TECH_INSPECTION") return "Visite technique a prevoir";
        return "Vignette a renouveler";
      })();

  const fallbackBody = isArabic(input.locale) ? "إجراء مطلوب" : "Action requise";
  const reminderBody = `${vehicleLabel} - ${dueLabel ?? fallbackBody}`;

  return {
    title: reminderTitle,
    body: reminderBody,
    dueLabel,
  };
}
