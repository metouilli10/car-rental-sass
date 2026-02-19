"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, MessageCircleMore, PhoneCall, ShieldCheck, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PriorityActionItem {
  id: string;
  type: "retard" | "paiement" | "caution" | "rappel";
  clientName: string;
  vehicleName: string;
  plate: string;
  amountText?: string;
  detailsHref: string;
  actionLabel: string;
  actionHref: string;
  phoneHref?: string;
  waLink?: string;
  dueLabel: string;
  stripeColor: string;
}

interface PriorityActionsClientProps {
  periodLabel: string;
  actions: PriorityActionItem[];
}

const badgeStyles: Record<PriorityActionItem["type"], string> = {
  retard: "bg-red-100 text-red-700",
  paiement: "bg-amber-100 text-amber-700",
  caution: "bg-blue-100 text-blue-700",
  rappel: "bg-violet-100 text-violet-700",
};

const typeLabel: Record<PriorityActionItem["type"], string> = {
  retard: "Retard",
  paiement: "Paiement",
  caution: "Caution",
  rappel: "Rappel",
};

const sectionIconClass = "h-5 w-5 shrink-0";
const actionIconClass = "h-5 w-5 shrink-0";

export function PriorityActionsClient({ actions, periodLabel }: PriorityActionsClientProps) {
  const router = useRouter();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <AlertTriangle className={sectionIconClass} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Actions prioritaires</h2>
              <p className="text-xs text-muted-foreground">
                Liste opérationnelle ({periodLabel.toLowerCase()})
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {actions.length} action{actions.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

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
        <div className="divide-y divide-slate-100">
          {actions.map((action) => (
            <div
              key={action.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(action.detailsHref)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(action.detailsHref);
                }
              }}
              aria-label={`Action ${typeLabel[action.type]} — ${action.clientName}`}
              className="group flex cursor-pointer items-center gap-4 p-6 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset"
            >
              <div className={cn("h-16 w-1 rounded-full", action.stripeColor)} />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {action.type === "rappel" ? (
                      <span className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        {action.clientName}
                      </span>
                    ) : (
                      action.clientName
                    )}
                  </p>
                  <Badge className={cn("rounded-full", badgeStyles[action.type])}>
                    {typeLabel[action.type]}
                  </Badge>
                </div>
                <p className="truncate text-sm text-slate-600">
                  {action.vehicleName}{" "}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                    {action.plate}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{action.dueLabel}</p>
              </div>

              <div className="flex items-center gap-2">
                {action.amountText && (
                  <p className="hidden text-right text-sm font-semibold text-slate-900 sm:block">
                    {action.amountText}
                  </p>
                )}

                <Button
                  size="sm"
                  onClick={(event) => event.stopPropagation()}
                  className="h-9 rounded-lg px-3"
                  asChild
                >
                  <Link href={action.actionHref}>{action.actionLabel}</Link>
                </Button>

                {action.phoneHref && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.location.href = action.phoneHref!;
                    }}
                    aria-label="Appeler"
                    className="h-9 w-9 border-slate-200 text-muted-foreground hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                  >
                    <PhoneCall className={actionIconClass} />
                  </Button>
                )}

                {action.waLink && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.open(action.waLink, "_blank", "noopener,noreferrer");
                    }}
                    aria-label="Contacter sur WhatsApp"
                    className="h-9 w-9 border-slate-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                  >
                    <MessageCircleMore className={actionIconClass} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
