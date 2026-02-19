"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, PhoneCall, MessageCircleMore, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
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

  const handleOpenDetails = () => {
    router.push(action.detailsHref);
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
        <Button size="sm" className="h-8 rounded-md px-3" asChild>
          <Link href={action.actionHref}>{action.actionLabel}</Link>
        </Button>

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
