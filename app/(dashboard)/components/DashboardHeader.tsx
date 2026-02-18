"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue hybride executive + opérationnelle de l&apos;agence
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/reservations/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/customers/add"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            Ajouter client
          </Link>
          <Link
            href="/vehicles/add"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            Ajouter véhicule
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-muted/40 sm:hidden"
              aria-label="Plus d'actions rapides"
            >
              <MoreHorizontal className="h-4 w-4" />
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
