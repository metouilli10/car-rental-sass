import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ActionCenterRow } from "./ActionCenterRow";
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
            <ActionCenterRow key={item.id} item={item} />
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
