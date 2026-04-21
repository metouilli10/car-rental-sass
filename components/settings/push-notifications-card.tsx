"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Loader2, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushClientState,
  sendTestPushNotification,
  type PushClientState,
} from "@/lib/push/client";

type PushNotificationsCardProps = {
  activeSubscriptionsCount: number;
  pushConfigured: boolean;
};

function StatusBadge({
  state,
  pushConfigured,
}: {
  state: PushClientState | null;
  pushConfigured: boolean;
}) {
  if (!pushConfigured) {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
        Configuration incomplète
      </Badge>
    );
  }

  if (!state) {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        Vérification...
      </Badge>
    );
  }

  if (state.status === "enabled") {
    return (
      <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
        Notifications activées
      </Badge>
    );
  }

  if (state.status === "denied") {
    return (
      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
        Autorisation refusée
      </Badge>
    );
  }

  if (state.status === "unsupported") {
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        Non pris en charge
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
      Notifications désactivées
    </Badge>
  );
}

function getStateDescription(state: PushClientState | null, pushConfigured: boolean) {
  if (!pushConfigured) {
    return "La configuration VAPID est absente sur cet environnement. Les boutons restent désactivés tant que le push web n'est pas configuré côté serveur.";
  }

  if (!state) {
    return "Vérification de la prise en charge des notifications sur cet appareil.";
  }

  if (state.status === "enabled") {
    return "Les alertes importantes peuvent être reçues sur cet appareil installé.";
  }

  if (state.status === "denied") {
    return "L'autorisation a été refusée par le navigateur. Réactivez-la dans les réglages du navigateur ou de l'appareil.";
  }

  if (state.status === "unsupported") {
    return "Ce navigateur ne prend pas en charge les notifications push pour cette application.";
  }

  return "Recevoir les alertes importantes sur ce téléphone ou cet ordinateur, sans remplacer les notifications dans l'application.";
}

export function PushNotificationsCard({
  activeSubscriptionsCount,
  pushConfigured,
}: PushNotificationsCardProps) {
  const router = useRouter();
  const [state, setState] = useState<PushClientState | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const nextState = await getPushClientState();
        if (!cancelled) {
          setState(nextState);
        }
      } catch (error) {
        console.error("push state load failed", error);
        if (!cancelled) {
          setState({
            status: "unsupported",
            permission: "unsupported",
            subscription: null,
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshState = async () => {
    const nextState = await getPushClientState();
    setState(nextState);
  };

  const handleEnable = () => {
    startTransition(async () => {
      try {
        const result = await enablePushNotifications();
        if (!result.success) {
          toast.error(result.message);
        } else {
          toast.success(result.message);
        }
        await refreshState();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Activation impossible.");
      }
    });
  };

  const handleDisable = () => {
    startTransition(async () => {
      try {
        const result = await disablePushNotifications();
        if (!result.success) {
          toast.error(result.message);
        } else {
          toast.success(result.message);
        }
        await refreshState();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Désactivation impossible.");
      }
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      try {
        const result = await sendTestPushNotification();
        toast.success(result.message);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Envoi du test impossible.");
      }
    });
  };

  const isEnabled = state?.status === "enabled";
  const isUnsupported = state?.status === "unsupported";
  const isDenied = state?.status === "denied";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-5 w-5 text-primary" />
          Notifications push
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Canal urgent pour les alertes prioritaires sur cet appareil.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/30 bg-white p-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">État actuel</p>
              <StatusBadge state={state} pushConfigured={pushConfigured} />
            </div>
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
              {getStateDescription(state, pushConfigured)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {activeSubscriptionsCount} appareil
              {activeSubscriptionsCount > 1 ? "s actifs" : " actif"}
              {" "}pour votre compte
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleEnable}
              disabled={!pushConfigured || isPending || isUnsupported}
              className="rounded-xl"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Activer les notifications push
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDisable}
              disabled={!pushConfigured || isPending || (!isEnabled && !isDenied)}
              className="rounded-xl"
            >
              Désactiver
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleTest}
              disabled={!pushConfigured || isPending || !isEnabled}
              className="rounded-xl"
            >
              <Send className="h-4 w-4" />
              Envoyer une notification de test
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Conseil pour iPhone</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Installez Locaryx sur l&apos;écran d&apos;accueil, ouvrez l&apos;application installée,
                puis activez les notifications depuis cette page.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
