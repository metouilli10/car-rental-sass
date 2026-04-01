"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PriorityActionsList, type PriorityActionItem } from "./PriorityActionsList";

interface PriorityActionsClientProps {
  actions: PriorityActionItem[];
}

export function PriorityActionsClient({ actions }: PriorityActionsClientProps) {
  return (
    <section>
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="rounded-full border border-slate-200 bg-slate-50 p-4 text-slate-400">
            <ShieldCheck className="h-7 w-7 shrink-0" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-slate-900">Aucune action critique pour cette période</p>
            <p className="text-sm text-muted-foreground">Votre agence est sous contrôle.</p>
          </div>
          <Button asChild>
            <Link href="/bookings">Voir les réservations</Link>
          </Button>
        </div>
      ) : (
        <PriorityActionsList actions={actions} />
      )}
    </section>
  );
}
