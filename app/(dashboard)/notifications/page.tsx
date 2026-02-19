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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NotificationActions } from "./notification-actions-client";
import type { ReminderType, NotificationSeverity, NotificationStatus } from "@prisma/client";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── Notification card ─────────────────────────────────────────────────────

function NotificationCard({
  notif,
}: {
  notif: Awaited<ReturnType<typeof fetchNotifications>>[0];
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
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
        notif.status === "OPEN"
          ? "bg-white border-border/40 hover:bg-muted/10"
          : "bg-muted/20 border-border/20"
      }`}
    >
      {/* Icon */}
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colorCls}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-semibold ${
              notif.status !== "OPEN" ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {notif.title}
          </p>
          <SeverityBadge severity={notif.severity} />
          <span className="text-[10px] text-muted-foreground bg-muted/60 border border-border/30 px-1.5 py-0.5 rounded-full">
            {TYPE_LABELS[notif.type]}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground/70 font-medium">
            {notif.vehicle.make} {notif.vehicle.model} · {notif.vehicle.plate}
          </span>
          {dueLine && (
            <span className="text-xs text-muted-foreground">{dueLine}</span>
          )}
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

      {/* Actions */}
      <NotificationActions
        id={notif.id}
        vehicleId={notif.vehicle.id}
        status={notif.status}
      />
    </div>
  );
}

// ─── Data fetching ─────────────────────────────────────────────────────────

async function fetchNotifications(
  agencyId: string,
  statusFilter?: NotificationStatus | "ALL"
) {
  return prisma.notification.findMany({
    where: {
      agencyId,
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
    },
    include: {
      vehicle: { select: { id: true, make: true, model: true, plate: true } },
    },
    orderBy: [
      { severity: "desc" },
      { updatedAt: "desc" },
    ],
  });
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-4">
        <Bell className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Les rappels s&apos;activent lors de l&apos;enregistrement des véhicules.
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agencyId = session.user.agencyId;

  const [all, open, snoozed, done] = await Promise.all([
    fetchNotifications(agencyId, "ALL"),
    fetchNotifications(agencyId, "OPEN"),
    fetchNotifications(agencyId, "SNOOZED"),
    fetchNotifications(agencyId, "DONE"),
  ]);

  const openCount = open.length;
  const snoozedCount = snoozed.length;
  const doneCount = done.length;

  const TabBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold">
        {count}
      </span>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Rappels d&apos;entretien et de conformité pour votre parc véhicules.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open">
        <TabsList className="bg-muted/40 border border-border/30">
          <TabsTrigger value="all">
            Tous
            <TabBadge count={all.length} />
          </TabsTrigger>
          <TabsTrigger value="open">
            À faire
            <TabBadge count={openCount} />
          </TabsTrigger>
          <TabsTrigger value="snoozed">
            Snoozées
            <TabBadge count={snoozedCount} />
          </TabsTrigger>
          <TabsTrigger value="done">
            Terminées
            <TabBadge count={doneCount} />
          </TabsTrigger>
        </TabsList>

        {/* All */}
        <TabsContent value="all" className="mt-4 space-y-2">
          {all.length === 0 ? (
            <EmptyState label="Aucune notification" />
          ) : (
            all.map((n) => <NotificationCard key={n.id} notif={n} />)
          )}
        </TabsContent>

        {/* Open */}
        <TabsContent value="open" className="mt-4 space-y-2">
          {open.length === 0 ? (
            <EmptyState label="Aucune action requise — tout est à jour !" />
          ) : (
            open.map((n) => <NotificationCard key={n.id} notif={n} />)
          )}
        </TabsContent>

        {/* Snoozed */}
        <TabsContent value="snoozed" className="mt-4 space-y-2">
          {snoozed.length === 0 ? (
            <EmptyState label="Aucune notification snoozée" />
          ) : (
            snoozed.map((n) => <NotificationCard key={n.id} notif={n} />)
          )}
        </TabsContent>

        {/* Done */}
        <TabsContent value="done" className="mt-4 space-y-2">
          {done.length === 0 ? (
            <EmptyState label="Aucune notification terminée" />
          ) : (
            done.map((n) => <NotificationCard key={n.id} notif={n} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
