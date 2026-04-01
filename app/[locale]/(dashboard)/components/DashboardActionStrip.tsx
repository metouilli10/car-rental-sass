"use client";

import { Plus, FileText, Camera, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatWhatsAppLink } from "@/lib/utils";

export type ActiveRentalForWhatsApp = {
  id: string;
  customer: { name: string; phone: string };
  vehicle: { make: string; model: string };
};

interface DashboardActionStripProps {
  activeRentals: ActiveRentalForWhatsApp[];
}

export function DashboardActionStrip({ activeRentals }: DashboardActionStripProps) {
  const rentalsWithPhone = activeRentals.filter((rental) => Boolean(rental.customer.phone));
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Button asChild className="shrink-0">
        <Link href="/bookings/create">
          <Plus className="w-4 h-4" />
          Nouvelle réservation
        </Link>
      </Button>

      <div className="h-5 w-px bg-border/50 shrink-0" aria-hidden />

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/damage-reports/new">
          <Camera className="w-4 h-4" />
          Inspection
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Clients actifs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {rentalsWithPhone.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground/70">
              Aucune location active
            </div>
          ) : (
            rentalsWithPhone.map((rental) => (
              <DropdownMenuItem key={rental.id} asChild>
                <a
                  href={formatWhatsAppLink(
                    rental.customer.phone,
                    `Bonjour ${rental.customer.name}`
                  ) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {rental.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground/70 truncate">
                        {rental.vehicle.make} {rental.vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {rental.customer.phone}
                      </p>
                    </div>
                    <Send className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                  </div>
                </a>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
