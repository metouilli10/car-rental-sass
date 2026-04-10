import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ElementType } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Shield,
  Sticker,
  Wrench,
} from "lucide-react";
import type {
  NotificationSeverity,
  NotificationStatus,
  ReminderType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { type AppLocale, isValidLocale, withLocalePath } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { NotificationActions } from "./notification-actions-client";
import { NotificationFiltersClient } from "./notification-filters-client";

const TYPE_LABELS: Record<ReminderType, string> = {
  OIL_CHANGE: "Vidange",
  INSURANCE_EXPIRY: "Assurance",
  TECH_INSPECTION: "Visite technique",
  VIGNETTE: "Vignette",
};

const TYPE_ICONS: Record<ReminderType, ElementType> = {
  OIL_CHANGE: Wrench,
  INSURANCE_EXPIRY: Shield,
  TECH_INSPECTION: ClipboardCheck,
  VIGNETTE: Sticker,
};

const TYPE_TONES: Record<ReminderType, string> = {
  OIL_CHANGE: "bg-amber-50 text-amber-700",
  INSURANCE_EXPIRY: "bg-blue-50 text-blue-700",
  TECH_INSPECTION: "bg-sky-50 text-sky-700",
  VIGNETTE: "bg-emerald-50 text-emerald-700",
};

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { label: string; badgeClassName: string; accentClassName: string }
> = {
  INFO: {
    label: "Info",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    accentClassName: "bg-blue-500",
  },
  WARNING: {
    label: "Attention",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    accentClassName: "bg-amber-500",
  },
  DUE: {
    label: "Urgent",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    accentClassName: "bg-red-500",
  },
};

const STATUS_CONFIG: Record<
  NotificationStatus,
  { label: string; badgeClassName: string; accentClassName: string }
> = {
  OPEN: {
    label: "À faire",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    accentClassName: "bg-slate-900",
  },
  SNOOZED: {
    label: "Snoozée",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    accentClassName: "bg-amber-400",
  },
  DONE: {
    label: "Terminée",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accentClassName: "bg-emerald-500",
  },
  DISMISSED: {
    label: "Ignorée",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-500",
    accentClassName: "bg-slate-300",
  },
};

const GROUP_ORDER = ["URGENT", "TODO", "SNOOZED", "DONE", "DISMISSED"] as const;
type NotificationGroupKey = (typeof GROUP_ORDER)[number];

const GROUP_CONFIG: Record<
  NotificationGroupKey,
  { label: string; subtitle: string }
> = {
  URGENT: {
    label: "Urgent",
    subtitle: "À traiter en priorité",
  },
  TODO: {
    label: "À faire",
    subtitle: "Actions à suivre rapidement",
  },
  SNOOZED: {
    label: "Snoozées",
    subtitle: "Replanifiées pour plus tard",
  },
  DONE: {
    label: "Terminées",
    subtitle: "Actions déjà traitées",
  },
  DISMISSED: {
    label: "Ignorées",
    subtitle: "Éléments masqués de la file active",
  },
};

const SUMMARY_ITEMS = [
  {
    key: "urgent",
    label: "Urgentes",
    subtitle: "Priorité immédiate",
    icon: AlertTriangle,
    tone: "bg-red-50 text-red-700",
  },
  {
    key: "open",
    label: "Ouvertes",
    subtitle: "Total à traiter",
    icon: Bell,
    tone: "bg-slate-100 text-slate-700",
  },
  {
    key: "snoozed",
    label: "Snoozées",
    subtitle: "Reportées",
    icon: Clock3,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    key: "done",
    label: "Terminées",
    subtitle: "Déjà traitées",
    icon: CheckCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
] as const;

type PageSearchParams = Promise<{
  status?: string;
  severity?: string;
  type?: string;
  q?: string;
}>;

type PageStatusFilter = "ALL" | NotificationStatus;
type PageSeverityFilter = "ALL" | NotificationSeverity;
type PageTypeFilter = "ALL" | ReminderType;

type PageParams = Promise<{
  locale: string;
}>;

type RawNotification = Awaited<ReturnType<typeof fetchNotifications>>[number];

type NotificationViewModel = {
  id: string;
  vehicleId: string | null;
  title: string;
  body: string;
  severity: NotificationSeverity;
  severityLabel: string;
  status: NotificationStatus;
  stateLabel: string;
  typeLabel: string;
  groupKey: NotificationGroupKey;
  primaryActionLabel: string;
  vehicleName: string;
  plate: string;
  dueLabel: string | null;
  statusContextLabel: string | null;
  metaLines: string[];
  accentClassName: string;
  iconToneClassName: string;
  updatedAt: Date;
  snoozedUntil: Date | null;
  dueAt: Date | null;
  dueMileageKm: number | null;
  raw: RawNotification;
};

function parseStatus(value?: string): PageStatusFilter {
  return value === "OPEN" || value === "SNOOZED" || value === "DONE" || value === "DISMISSED"
    ? value
    : "ALL";
}

function parseSeverity(value?: string): PageSeverityFilter {
  return value === "INFO" || value === "WARNING" || value === "DUE" ? value : "ALL";
}

function parseType(value?: string): PageTypeFilter {
  return value === "OIL_CHANGE" ||
    value === "INSURANCE_EXPIRY" ||
    value === "TECH_INSPECTION" ||
    value === "VIGNETTE"
    ? value
    : "ALL";
}

function getGroupKey(notification: RawNotification): NotificationGroupKey {
  if (notification.status === "OPEN" && notification.severity === "DUE") {
    return "URGENT";
  }

  if (notification.status === "OPEN") {
    return "TODO";
  }

  if (notification.status === "SNOOZED") {
    return "SNOOZED";
  }

  if (notification.status === "DONE") {
    return "DONE";
  }

  return "DISMISSED";
}

function formatShortDate(date: Date) {
  return format(date, "d MMM yyyy", { locale: fr });
}

function formatDateOrKm(notification: RawNotification) {
  if (notification.dueAt) {
    return `Échéance le ${formatShortDate(notification.dueAt)}`;
  }

  if (notification.dueMileageKm) {
    return `À ${notification.dueMileageKm.toLocaleString("fr-FR")} km`;
  }

  return null;
}

function getStatusContext(notification: RawNotification) {
  if (notification.status === "SNOOZED") {
    return notification.snoozedUntil
      ? `Reprise le ${formatShortDate(notification.snoozedUntil)}`
      : "Action reportée";
  }

  if (notification.status === "DONE") {
    return `Traité le ${formatShortDate(notification.updatedAt)}`;
  }

  if (notification.status === "DISMISSED") {
    return `Ignorée le ${formatShortDate(notification.updatedAt)}`;
  }

  return "À suivre";
}

function toViewModel(notification: RawNotification): NotificationViewModel {
  const vehicleName = `${notification.vehicle.make} ${notification.vehicle.model}`;
  const dueLabel = formatDateOrKm(notification);
  const statusContextLabel = getStatusContext(notification);
  const metaLines = [vehicleName, notification.vehicle.plate];

  if (dueLabel) {
    metaLines.push(dueLabel);
  }

  if (statusContextLabel && (notification.status !== "OPEN" || !dueLabel)) {
    metaLines.push(statusContextLabel);
  }

  return {
    id: notification.id,
    vehicleId: notification.vehicle.id,
    title: notification.title,
    body: notification.body,
    severity: notification.severity,
    severityLabel: SEVERITY_CONFIG[notification.severity].label,
    status: notification.status,
    stateLabel: STATUS_CONFIG[notification.status].label,
    typeLabel: TYPE_LABELS[notification.type],
    groupKey: getGroupKey(notification),
    primaryActionLabel: "Voir le véhicule",
    vehicleName,
    plate: notification.vehicle.plate,
    dueLabel,
    statusContextLabel,
    metaLines,
    accentClassName:
      notification.status === "OPEN"
        ? SEVERITY_CONFIG[notification.severity].accentClassName
        : STATUS_CONFIG[notification.status].accentClassName,
    iconToneClassName: TYPE_TONES[notification.type],
    updatedAt: notification.updatedAt,
    snoozedUntil: notification.snoozedUntil,
    dueAt: notification.dueAt,
    dueMileageKm: notification.dueMileageKm,
    raw: notification,
  };
}

function compareDueRelevance(a: NotificationViewModel, b: NotificationViewModel) {
  if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
  if (a.dueAt) return -1;
  if (b.dueAt) return 1;

  if (a.dueMileageKm != null && b.dueMileageKm != null) {
    return a.dueMileageKm - b.dueMileageKm;
  }
  if (a.dueMileageKm != null) return -1;
  if (b.dueMileageKm != null) return 1;

  return 0;
}

function sortWithinGroup(a: NotificationViewModel, b: NotificationViewModel) {
  if (a.groupKey === "URGENT" || a.groupKey === "TODO") {
    const severityDelta =
      (a.severity === "DUE" ? 3 : a.severity === "WARNING" ? 2 : 1) -
      (b.severity === "DUE" ? 3 : b.severity === "WARNING" ? 2 : 1);
    if (severityDelta !== 0) return severityDelta > 0 ? -1 : 1;

    const dueDelta = compareDueRelevance(a, b);
    if (dueDelta !== 0) return dueDelta;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  }

  if (a.groupKey === "SNOOZED") {
    const aTime = a.snoozedUntil?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.snoozedUntil?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;

    return b.updatedAt.getTime() - a.updatedAt.getTime();
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

function groupNotifications(notifications: RawNotification[]) {
  const buckets = new Map<NotificationGroupKey, NotificationViewModel[]>();

  for (const key of GROUP_ORDER) {
    buckets.set(key, []);
  }

  for (const notification of notifications) {
    const model = toViewModel(notification);
    buckets.get(model.groupKey)?.push(model);
  }

  return GROUP_ORDER.map((key) => ({
    key,
    ...GROUP_CONFIG[key],
    items: (buckets.get(key) ?? []).sort(sortWithinGroup),
  })).filter((group) => group.items.length > 0);
}

async function fetchNotifications(input: {
  agencyId: string;
  status: PageStatusFilter;
  severity: PageSeverityFilter;
  type: PageTypeFilter;
  query: string;
}) {
  const normalizedQuery = input.query.trim();

  return prisma.notification.findMany({
    where: {
      agencyId: input.agencyId,
      ...(input.status !== "ALL" ? { status: input.status } : {}),
      ...(input.severity !== "ALL" ? { severity: input.severity } : {}),
      ...(input.type !== "ALL" ? { type: input.type } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { body: { contains: normalizedQuery, mode: "insensitive" } },
              { vehicle: { make: { contains: normalizedQuery, mode: "insensitive" } } },
              { vehicle: { model: { contains: normalizedQuery, mode: "insensitive" } } },
              { vehicle: { plate: { contains: normalizedQuery, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, plate: true } },
    },
    orderBy: [{ severity: "desc" }, { updatedAt: "desc" }],
  });
}

function buildBaseWhere(input: {
  agencyId: string;
  severity: PageSeverityFilter;
  type: PageTypeFilter;
  query: string;
}) {
  const normalizedQuery = input.query.trim();

  return {
    agencyId: input.agencyId,
    ...(input.severity !== "ALL" ? { severity: input.severity } : {}),
    ...(input.type !== "ALL" ? { type: input.type } : {}),
    ...(normalizedQuery
      ? {
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" as const } },
            { body: { contains: normalizedQuery, mode: "insensitive" as const } },
            { vehicle: { make: { contains: normalizedQuery, mode: "insensitive" as const } } },
            { vehicle: { model: { contains: normalizedQuery, mode: "insensitive" as const } } },
            { vehicle: { plate: { contains: normalizedQuery, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
}

async function fetchCounts(input: {
  agencyId: string;
  severity: PageSeverityFilter;
  type: PageTypeFilter;
  query: string;
}) {
  const where = buildBaseWhere(input);
  const [grouped, urgentCount] = await Promise.all([
    prisma.notification.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
    prisma.notification.count({
      where: {
        ...where,
        status: "OPEN",
        severity: "DUE",
      },
    }),
  ]);

  const counts: Record<PageStatusFilter, number> & { urgentCount: number } = {
    ALL: 0,
    OPEN: 0,
    SNOOZED: 0,
    DONE: 0,
    DISMISSED: 0,
    urgentCount,
  };

  for (const row of grouped) {
    counts[row.status] = row._count.status;
    counts.ALL += row._count.status;
  }

  return counts;
}

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        cfg.badgeClassName,
      )}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        cfg.badgeClassName,
      )}
    >
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: ReminderType }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
      {TYPE_LABELS[type]}
    </span>
  );
}

function NotificationCard({ notification }: { notification: NotificationViewModel }) {
  const Icon = TYPE_ICONS[notification.raw.type];
  const isQuiet = notification.status === "DONE" || notification.status === "DISMISSED";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-[1px] hover:shadow-card-hover",
        isQuiet
          ? "border-slate-200/80 bg-slate-50/40"
          : "border-subtle hover:border-slate-300/80",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", notification.accentClassName)} />

      <div className="flex flex-col gap-4 sm:pl-1 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              notification.iconToneClassName,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={notification.severity} />
              <StatusBadge status={notification.status} />
              <TypeBadge type={notification.raw.type} />
            </div>

            <div className="mt-3 space-y-1.5">
              <h2
                className={cn(
                  "text-sm font-semibold tracking-tight text-slate-950 sm:text-[15px]",
                  isQuiet && "text-slate-700",
                )}
              >
                {notification.title}
              </h2>
              <p
                className={cn(
                  "max-w-3xl text-sm leading-6 text-slate-600",
                  isQuiet && "text-slate-500",
                )}
              >
                {notification.body}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{notification.vehicleName}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600">
                {notification.plate}
              </span>
              {notification.dueLabel ? <span>{notification.dueLabel}</span> : null}
              {notification.statusContextLabel &&
              (notification.status !== "OPEN" || !notification.dueLabel) ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    notification.status === "DONE" && "text-emerald-600",
                    notification.status === "SNOOZED" && "text-amber-600",
                    notification.status === "DISMISSED" && "text-slate-400",
                  )}
                >
                  {notification.status === "DONE" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : notification.status === "SNOOZED" ? (
                    <Clock3 className="h-3.5 w-3.5" />
                  ) : null}
                  {notification.statusContextLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <NotificationActions
          id={notification.id}
          vehicleId={notification.vehicleId}
          status={notification.status}
          primaryLabel={notification.primaryActionLabel}
        />
      </div>
    </article>
  );
}

function SummaryStrip({
  urgentCount,
  openCount,
  snoozedCount,
  doneCount,
}: {
  urgentCount: number;
  openCount: number;
  snoozedCount: number;
  doneCount: number;
}) {
  const values = {
    urgent: urgentCount,
    open: openCount,
    snoozed: snoozedCount,
    done: doneCount,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <section
            key={item.key}
            className="rounded-2xl border border-subtle bg-white px-4 py-3 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {values[item.key]}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", item.tone)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyState({
  label,
  description,
  resetHref,
}: {
  label: string;
  description: string;
  resetHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-subtle bg-white px-6 py-14 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <CheckCheck className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{label}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {resetHref ? (
        <Button asChild variant="ghost" size="sm" className="mt-5 rounded-xl text-slate-600">
          <Link href={resetHref}>
            Revenir à toutes les actions
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export default async function NotificationsPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!session.user.agencyId) redirect("/setup");

  const [{ locale: localeParam }, rawParams] = await Promise.all([params, searchParams]);
  const locale: AppLocale = isValidLocale(localeParam) ? localeParam : "fr";
  const status = parseStatus(rawParams.status);
  const severity = parseSeverity(rawParams.severity);
  const type = parseType(rawParams.type);
  const query = rawParams.q?.trim() ?? "";

  const [notifications, counts, summaryCounts] = await Promise.all([
    fetchNotifications({
      agencyId: session.user.agencyId,
      status,
      severity,
      type,
      query,
    }),
    fetchCounts({
      agencyId: session.user.agencyId,
      severity,
      type,
      query,
    }),
    fetchCounts({
      agencyId: session.user.agencyId,
      severity: "ALL",
      type: "ALL",
      query: "",
    }),
  ]);

  const groupedNotifications = groupNotifications(notifications);
  const notificationsHref = withLocalePath(locale, "/notifications");
  const settingsHref = withLocalePath(locale, "/settings/notifications");
  const hasActiveFilters =
    status !== "ALL" || severity !== "ALL" || type !== "ALL" || query.length > 0;

  const emptyLabel =
    status === "SNOOZED"
      ? "Aucune notification snoozée."
      : status === "DONE"
      ? "Tout est à jour dans cette vue."
      : status === "DISMISSED"
      ? "Aucune notification ignorée."
      : severity === "DUE" || status === "OPEN"
      ? "Aucune action urgente pour le moment."
      : "Tout est à jour dans cette vue.";

  const emptyDescription = hasActiveFilters
    ? "Aucune action ne correspond aux filtres actifs. Élargissez la vue pour retrouver l’ensemble des alertes."
    : "Cette vue ne demande aucune intervention immédiate. Les prochaines alertes apparaîtront ici automatiquement.";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Centre d&apos;actions
          </h1>
          <p className="text-sm text-slate-500">
            Suivez les alertes, échéances et actions à traiter pour votre parc
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="rounded-xl border-subtle">
            <Link href={settingsHref}>Paramètres de notifications</Link>
          </Button>
          {hasActiveFilters ? (
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-slate-600">
              <Link href={notificationsHref}>Réinitialiser</Link>
            </Button>
          ) : null}
        </div>
      </section>

      <SummaryStrip
        urgentCount={summaryCounts.urgentCount}
        openCount={summaryCounts.OPEN}
        snoozedCount={summaryCounts.SNOOZED}
        doneCount={summaryCounts.DONE}
      />

      <NotificationFiltersClient
        activeStatus={status}
        search={query}
        severity={severity}
        type={type}
        counts={{
          ALL: counts.ALL,
          OPEN: counts.OPEN,
          SNOOZED: counts.SNOOZED,
          DONE: counts.DONE,
          DISMISSED: counts.DISMISSED,
        }}
      />

      {groupedNotifications.length === 0 ? (
        <EmptyState
          label={emptyLabel}
          description={emptyDescription}
          resetHref={hasActiveFilters ? notificationsHref : undefined}
        />
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-950">
                    {group.label}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{group.subtitle}</p>
                </div>
                <span className="rounded-full border border-subtle bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
