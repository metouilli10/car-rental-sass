"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PhoneCall, MessageCircleMore, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markPaymentReceived, updateDepositStatus } from "@/lib/actions/payments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PriorityActionItem } from "./PriorityActionsList";

interface PriorityActionRowProps {
  action: PriorityActionItem;
}

const statusByType: Record<PriorityActionItem["type"], string> = {
  retard: "Retour en retard",
  paiement: "Paiement en attente",
  caution: "Caution à libérer",
  rappel: "Rappel véhicule",
};

export function PriorityActionRow({ action }: PriorityActionRowProps) {
  const router = useRouter();
  const [isActionPending, setIsActionPending] = useState(false);

  const handleOpenDetails = () => {
    router.push(action.detailsHref);
  };

  const handlePaymentAction = async () => {
    if (!(action.type === "paiement" && action.paymentId)) return;
    setIsActionPending(true);
    try {
      const result = await markPaymentReceived(action.paymentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Paiement encaissé");
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'encaissement");
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDepositRelease = async () => {
    if (!(action.type === "caution" && action.depositId)) return;
    setIsActionPending(true);
    try {
      const result = await updateDepositStatus(action.depositId, "RETURNED");
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Caution libérée");
      router.refresh();
    } catch {
      toast.error("Erreur lors de la libération de la caution");
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (action.type === "paiement") {
      await handlePaymentAction();
      return;
    }
    router.push(action.actionHref);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors hover:bg-muted/40">
      <div className={cn("h-10 w-0.5 shrink-0 rounded-full", action.stripeColor)} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{action.clientName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {action.vehicleName} • {statusByType[action.type]}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {action.type === "caution" && action.depositId ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-md px-3" disabled={isActionPending}>
                {action.actionLabel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la libération de caution</AlertDialogTitle>
                <AlertDialogDescription>
                  La caution de{" "}
                  <span className="font-medium text-foreground">{action.clientName}</span> pour{" "}
                  <span className="font-medium text-foreground">{action.vehicleName}</span>{" "}
                  (<span className="font-mono text-foreground">{action.plate}</span>) sera marquée
                  comme restituée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDepositRelease}>
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            size="sm"
            className="h-8 rounded-md px-3"
            onClick={handlePrimaryAction}
            disabled={isActionPending}
          >
            {action.actionLabel}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Plus d'actions pour ${action.clientName}`}
              className="h-8 w-8 rounded-md"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleOpenDetails}>
              <Eye className="mr-2 h-4 w-4" />
              Voir le dossier
            </DropdownMenuItem>

            {action.phoneHref ? (
              <DropdownMenuItem onClick={() => (window.location.href = action.phoneHref!)}>
                <PhoneCall className="mr-2 h-4 w-4" />
                Appeler
              </DropdownMenuItem>
            ) : null}

            {action.waLink ? (
              <DropdownMenuItem onClick={() => window.open(action.waLink, "_blank", "noopener,noreferrer")}>
                <MessageCircleMore className="mr-2 h-4 w-4" />
                WhatsApp
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
