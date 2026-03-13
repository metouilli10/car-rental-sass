import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Bell,
  Mail,
  MessageCircleMore,
  Wrench,
  Shield,
  ClipboardCheck,
  Sticker,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReminderType } from "@prisma/client";

const REMINDER_TYPES: { type: ReminderType; label: string; Icon: React.ElementType }[] = [
  { type: "OIL_CHANGE", label: "Vidange", Icon: Wrench },
  { type: "INSURANCE_EXPIRY", label: "Assurance", Icon: Shield },
  { type: "TECH_INSPECTION", label: "Visite technique", Icon: ClipboardCheck },
  { type: "VIGNETTE", label: "Vignette", Icon: Sticker },
];

function ComingSoonBadge() {
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-semibold text-muted-foreground border-muted-foreground/30 px-2 py-0.5"
    >
      Bientôt disponible
    </Badge>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-muted/10">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{title}</p>
          {comingSoon && <ComingSoonBadge />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {/* Disabled toggle placeholder */}
      <div
        className="h-6 w-11 rounded-full bg-muted border border-border/50 shrink-0 cursor-not-allowed opacity-50"
        title="Disponible bientôt"
        aria-disabled="true"
      />
    </div>
  );
}

export default async function NotificationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agencyId = session.user.agencyId;

  // Load existing reminder rules for this agency
  const rules = await prisma.reminderRule.findMany({
    where: { agencyId },
  });

  const getRuleForType = (type: ReminderType) =>
    rules.find((r) => r.type === type);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Paramètres de notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configurez les rappels automatiques pour votre parc véhicules.
        </p>
      </div>

      {/* In-app notifications — active */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            Notifications dans l’application
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Les rappels apparaissent dans la cloche en haut à droite et sur la page Notifications.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {REMINDER_TYPES.map(({ type, label, Icon }) => {
            const rule = getRuleForType(type);
            const enabled = rule?.enabled ?? true;
            const leadDays = rule?.leadDays?.length ? rule.leadDays : [30, 15, 7];

            return (
              <div
                key={type}
                className="flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-white"
              >
                <div className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Rappels à : {leadDays.join(", ")} jours avant
                    </p>
                  </div>
                </div>
                <div
                  className={`h-6 w-11 rounded-full shrink-0 flex items-center transition-colors ${
                    enabled ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                >
                  <div className="h-5 w-5 rounded-full bg-white shadow-sm mx-0.5" />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-1">
            Pour modifier les seuils de rappel, mettez à jour les données du véhicule
            (champs &quot;Rappels avant expiration&quot; dans la section Entretien &amp; conformité).
          </p>
        </CardContent>
      </Card>

      {/* Email — coming soon */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5 text-primary" />
            Rappels par email
            <ComingSoonBadge />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Recevez des rappels par email avant les échéances de vos véhicules.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChannelCard
            icon={Mail}
            title="Activer les rappels email"
            description="Envoie un email à l'adresse de l'agence 30, 15 et 7 jours avant chaque échéance."
            comingSoon
          />
          <div className="p-3 rounded-xl border border-border/30 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong>Email expéditeur :</strong>{" "}
              <span className="font-mono text-muted-foreground/70">— (non configuré)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp — coming soon */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircleMore className="h-5 w-5 text-emerald-600" />
            Rappels WhatsApp
            <ComingSoonBadge />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Envoyez des rappels automatiques via WhatsApp Business API.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChannelCard
            icon={MessageCircleMore}
            title="Activer les rappels WhatsApp"
            description="Intégration avec WhatsApp Business API. Nécessite un compte WhatsApp Business vérifié."
            comingSoon
          />
          <div className="p-3 rounded-xl border border-border/30 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <strong>Numéro WhatsApp Business :</strong>{" "}
              <span className="font-mono text-muted-foreground/70">— (non configuré)</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
