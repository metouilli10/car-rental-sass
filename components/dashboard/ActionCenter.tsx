import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { PriorityActionItem } from "@/lib/dashboard/types";

interface ActionCenterProps {
  pendingCollections: PriorityActionItem[];
  depositsToRelease: PriorityActionItem[];
  lateReturns: PriorityActionItem[];
}

function ActionSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: PriorityActionItem[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <Badge variant={items.length > 0 ? "warning" : "secondary"}>{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.customerName} - {item.vehicleLabel}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.plate} - {item.dueLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.amount ? (
                  <Badge variant="outline" className="rounded-full">
                    {formatCurrency(item.amount)}
                  </Badge>
                ) : null}
                <Button asChild size="sm" className="rounded-lg">
                  <Link href={item.primaryHref}>
                    {item.primaryAction}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Button asChild size="sm" variant="ghost" className="justify-self-start md:justify-self-end">
                <Link href={item.detailsHref}>Details</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionCenter({
  pendingCollections,
  depositsToRelease,
  lateReturns,
}: ActionCenterProps) {
  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:translate-y-0 hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Actions prioritaires
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ActionSection
          title="A encaisser"
          items={pendingCollections}
          emptyLabel="Aucun encaissement en attente."
        />
        <Separator />
        <ActionSection
          title="Caution a liberer"
          items={depositsToRelease}
          emptyLabel="Aucune caution a liberer."
        />
        <Separator />
        <ActionSection
          title="Retours en retard"
          items={lateReturns}
          emptyLabel="Aucun retour en retard."
        />
      </CardContent>
    </Card>
  );
}
