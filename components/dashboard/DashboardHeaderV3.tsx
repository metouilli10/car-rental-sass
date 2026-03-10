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
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tableau de bord</h1>
          <p className="text-xs text-slate-500">Vue executive et operationnelle</p>
        </div>
        <PeriodTabs period={period} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          className="bg-[#2563EB] text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#1D4ED8] hover:shadow-md"
        >
          <Link href="/bookings/create">
            <Plus className="h-4 w-4" />
            Nouvelle reservation
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
            >
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
