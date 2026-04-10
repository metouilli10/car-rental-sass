import Link from "next/link";
import { AlertTriangle, Clock3 } from "lucide-react";
import type { VehicleWorkspaceData } from "@/lib/vehicles/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VehicleActionRequiredStripProps {
  workspace: VehicleWorkspaceData;
}

export function VehicleActionRequiredStrip({
  workspace,
}: VehicleActionRequiredStripProps) {
  if (!workspace.actionStrip) {
    return null;
  }

  const isUrgent = workspace.actionStrip.title === "Action requise";

  return (
    <section
      className={cn(
        "rounded-[24px] border px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:px-6",
        isUrgent
          ? "border-red-200/80 bg-red-50/70"
          : "border-amber-200/80 bg-amber-50/60",
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isUrgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
              )}
            >
              {isUrgent ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{workspace.actionStrip.title}</p>
              <p className="mt-1 text-sm text-slate-600">{workspace.actionStrip.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px] text-sm text-slate-700">
            {workspace.actionStrip.items.map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end lg:self-center">
          <Button asChild>
            <Link href={workspace.actionStrip.primaryAction.href}>
              {workspace.actionStrip.primaryAction.label}
            </Link>
          </Button>

          {workspace.actionStrip.secondaryAction ? (
            <Button variant="ghost" asChild>
              <Link href={workspace.actionStrip.secondaryAction.href}>
                {workspace.actionStrip.secondaryAction.label}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
