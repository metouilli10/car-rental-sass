"use client";

import Link from "next/link";
import { Banknote, CheckCircle, CreditCard, Loader2, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface ActionQuickActionsProps {
  type: "retard" | "paiement" | "caution";
  phoneHref: string;
  waLink: string;
  detailsHref: string;
  bookingId: string;
  isPending: boolean;
  clientName: string;
  vehicleName: string;
  plate: string;
  onMarkReturned: () => void;
}

export function ActionQuickActions({
  type,
  phoneHref,
  waLink,
  detailsHref,
  isPending,
  clientName,
  vehicleName,
  plate,
  onMarkReturned,
}: ActionQuickActionsProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-between">
      {/* ── Primary CTA ── */}
      {type === "retard" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              className="h-10 w-full gap-2 rounded-xl px-4 text-sm transition-all duration-200 active:scale-[0.98] sm:w-auto"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Marquer comme rendu</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer le retour</AlertDialogTitle>
              <AlertDialogDescription>
                Le véhicule{" "}
                <span className="font-medium text-foreground">{vehicleName}</span>{" "}
                (
                <span className="font-mono text-foreground">{plate}</span>) pour{" "}
                <span className="font-medium text-foreground">{clientName}</span>{" "}
                sera marqué comme rendu et le véhicule redeviendra disponible. Avez-vous
                effectué l&apos;inspection de retour ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onMarkReturned}>
                Confirmer le retour
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : type === "paiement" ? (
        <Button
          variant="default"
          className="h-10 w-full gap-2 rounded-xl px-4 text-sm transition-all duration-200 active:scale-[0.98] sm:w-auto"
          asChild
        >
          <Link href={detailsHref}>
            <CreditCard className="h-4 w-4" />
            <span>Encaisser</span>
          </Link>
        </Button>
      ) : (
        <Button
          variant="default"
          className="h-10 w-full gap-2 rounded-xl px-4 text-sm transition-all duration-200 active:scale-[0.98] sm:w-auto"
          asChild
        >
          <Link href={detailsHref}>
            <Banknote className="h-4 w-4" />
            <span>Libérer</span>
          </Link>
        </Button>
      )}

      <div className="flex items-center justify-end gap-2">
        {/* ── Phone ── */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl border-slate-200 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
          onClick={() => {
            window.location.href = phoneHref;
          }}
          aria-label="Appeler"
        >
          <Phone className="h-4 w-4" />
        </Button>

        {/* ── WhatsApp ── */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl border-slate-200 text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
          onClick={() => {
            window.open(waLink, "_blank", "noopener,noreferrer");
          }}
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
