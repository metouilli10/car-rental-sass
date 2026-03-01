import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { DashboardV3ResolvedPeriod } from "@/lib/dashboard/types";
import { PeriodTabs } from "./PeriodTabs";

interface DashboardHeaderV3Props {
  period: DashboardV3ResolvedPeriod;
}

export function DashboardHeaderV3({ period }: DashboardHeaderV3Props) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="text-xs text-muted-foreground">Vue executive et operationnelle</p>
        </div>
        <PeriodTabs period={period} />
      </div>

      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/bookings/create">
            <Plus className="h-4 w-4" />
            Nouvelle reservation
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              Ajouter
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/customers/add">Ajouter client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vehicles/add">Ajouter vehicule</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
