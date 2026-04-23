"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const headerIconClass = "h-5 w-5 shrink-0";

export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue exécutive + opérationnelle de l&apos;agence
        </p>
      </div>

      <div className="flex items-center gap-2 border-l border-slate-200 pl-0 lg:pl-6">
        <Button asChild>
          <Link href="/reservations/new">
            <Plus className={headerIconClass} />
            Nouvelle réservation
          </Link>
        </Button>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/customers/add"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            Ajouter client
          </Link>
          <Link
            href="/vehicles/add"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            Ajouter véhicule
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-foreground transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 sm:hidden"
              aria-label="Plus d'actions rapides"
            >
              <MoreHorizontal className={`${headerIconClass} text-muted-foreground`} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/customers/add">Ajouter client</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/vehicles/add">Ajouter véhicule</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
