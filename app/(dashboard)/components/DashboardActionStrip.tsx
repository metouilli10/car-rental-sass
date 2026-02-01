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

export type ActiveRentalForWhatsApp = {
  id: string;
  customer: { name: string; phone: string };
  vehicle: { make: string; model: string };
};

interface DashboardActionStripProps {
  activeRentals: ActiveRentalForWhatsApp[];
}

function formatWhatsAppLink(phone: string, clientName: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("212")
    ? cleanPhone
    : `212${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
  const message = `Bonjour ${encodeURIComponent(clientName)}`;
  return `https://wa.me/${fullPhone}?text=${message}`;
}

export function DashboardActionStrip({ activeRentals }: DashboardActionStripProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Button asChild className="shrink-0">
        <Link href="/bookings?action=new">
          <Plus className="w-4 h-4" />
          Nouvelle réservation
        </Link>
      </Button>

      <div className="h-6 w-px bg-border shrink-0" aria-hidden />

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/contracts/new">
          <FileText className="w-4 h-4" />
          Créer contrat
        </Link>
      </Button>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/damage-reports/new">
          <Camera className="w-4 h-4" />
          Ajouter dégâts
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 hover:text-green-600 hover:border-green-200 hover:bg-green-50/50"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Clients actifs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activeRentals.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Aucune location active
            </div>
          ) : (
            activeRentals.map((rental) => (
              <DropdownMenuItem key={rental.id} asChild>
                <a
                  href={formatWhatsAppLink(
                    rental.customer.phone,
                    rental.customer.name
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {rental.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {rental.vehicle.make} {rental.vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
