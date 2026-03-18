import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  Wrench,
  Shield,
  ClipboardCheck,
  Sticker,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationActions } from "./notification-actions-client";
import { NotificationFiltersClient } from "./notification-filters-client";
import type {
  NotificationSeverity,
  NotificationStatus,
  ReminderType,
} from "@prisma/client";

const TYPE_LABELS: Record<ReminderType, string> = {
  OIL_CHANGE: "Vidange",
  INSURANCE_EXPIRY: "Assurance",
  TECH_INSPECTION: "Visite technique",
  VIGNETTE: "Vignette",
};

const TYPE_ICONS: Record<ReminderType, React.ElementType> = {
  OIL_CHANGE: Wrench,
  INSURANCE_EXPIRY: Shield,
  TECH_INSPECTION: ClipboardCheck,
  VIGNETTE: Sticker,
};

const TYPE_COLORS: Record<ReminderType, string> = {
  OIL_CHANGE: "text-amber-600 bg-amber-50",
  INSURANCE_EXPIRY: "text-blue-600 bg-blue-50",
  TECH_INSPECTION: "text-violet-600 bg-violet-50",
  VIGNETTE: "text-emerald-600 bg-emerald-50",
};

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { label: string; className: string }
> = {
  INFO: { label: "Info", className: "bg-blue-50 text-blue-700 border-blue-200" },
  WARNING: { label: "Attention", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DUE: { label: "Urgent", className: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_LABELS: Record<NotificationStatus, string> = {
  OPEN: "À faire",
  SNOOZED: "Snoozée",
  DONE: "Terminée",
  DISMISSED: "Ignorée",
};

type PageSearchParams = Promise<{
  status?: string;
  severity?: string;
  type?: string;
  q?: string;
}>;

type PageStatusFilter = "ALL" | NotificationStatus;
type PageSeverityFilter = "ALL" | NotificationSeverity;
type PageTypeFilter = "ALL" | ReminderType;

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

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const tone =
    status === "OPEN"
      ? "bg-slate-900 text-white"
      : status === "SNOOZED"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : status === "DONE"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
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

async function fetchStatusCounts(agencyId: string) {
  const grouped = await prisma.notification.groupBy({
    by: ["status"],
    where: { agencyId },
    _count: { status: true },
  });

  const counts: Record<PageStatusFilter, number> = {
    ALL: 0,
    OPEN: 0,
    SNOOZED: 0,
    DONE: 0,
    DISMISSED: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count.status;
    counts.ALL += row._count.status;
  }

  return counts;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
        <Bell className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground/60">
        Ajustez les filtres ou revenez à une vue plus large.
      </p>
    </div>
  );
}

function NotificationCard({
  notif,
}: {
  notif: Awaited<ReturnType<typeof fetchNotifications>>[number];
}) {
  const Icon = TYPE_ICONS[notif.type];
  const colorCls = TYPE_COLORS[notif.type];

  const dueLine = notif.dueAt
    ? `Échéance : ${format(notif.dueAt, "d MMMM yyyy", { locale: fr })}`
    : notif.dueMileageKm
    ? `À : ${notif.dueMileageKm.toLocaleString("fr-FR")} km`
    : null;

  const snoozeLine =
    notif.status === "SNOOZED" && notif.snoozedUntil
      ? `Snoozé jusqu'au ${format(notif.snoozedUntil, "d MMM yyyy", { locale: fr })}`
      : null;

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        notif.status === "OPEN"
          ? "border-border/40 bg-white hover:bg-muted/10"
          : "border-border/20 bg-muted/20"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorCls}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              notif.status !== "OPEN" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {notif.title}
          </p>
          <SeverityBadge severity={notif.severity} />
          <StatusBadge status={notif.status} />
          <span className="rounded-full border border-border/30 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {TYPE_LABELS[notif.type]}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">{notif.body}</p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground/70">
            {notif.vehicle.make} {notif.vehicle.model} · {notif.vehicle.plate}
          </span>
          {dueLine && <span className="text-xs text-muted-foreground">{dueLine}</span>}
          {snoozeLine && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Clock className="h-3 w-3" />
              {snoozeLine}
            </span>
          )}
          {notif.status === "DONE" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Terminé
            </span>
          )}
        </div>
      </div>

      <NotificationActions id={notif.id} vehicleId={notif.vehicle.id} status={notif.status} />
    </div>
  );
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!session.user.agencyId) redirect("/setup");

  const params = await searchParams;
  const status = parseStatus(params.status);
  const severity = parseSeverity(params.severity);
  const type = parseType(params.type);
  const query = params.q?.trim() ?? "";

  const [notifications, counts] = await Promise.all([
    fetchNotifications({
      agencyId: session.user.agencyId,
      status,
      severity,
      type,
      query,
    }),
    fetchStatusCounts(session.user.agencyId),
  ]);

  const emptyLabel =
    status === "OPEN"
      ? "Aucune action requise"
      : status === "SNOOZED"
      ? "Aucune notification snoozée"
      : status === "DONE"
      ? "Aucune notification terminée"
      : status === "DISMISSED"
      ? "Aucune notification ignorée"
      : "Aucune notification";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Rappels d&apos;entretien et de conformité pour votre parc véhicules.
        </p>
      </div>

      <NotificationFiltersClient
        activeStatus={status}
        search={query}
        severity={severity}
        type={type}
        counts={counts}
      />

      {notifications.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <NotificationCard key={notif.id} notif={notif} />
          ))}
        </div>
      )}
    </div>
  );
}
