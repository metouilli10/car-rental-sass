import { prisma } from "@/lib/prisma";
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

interface QuickActionBarProps {
  agencyId: string;
}

export async function QuickActionBar({ agencyId }: QuickActionBarProps) {
  // Fetch last 5 clients with active rentals for WhatsApp dropdown
  const activeRentals = await prisma.booking.findMany({
    where: {
      agencyId,
      status: "ACTIVE",
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
    take: 5,
  });

  const formatWhatsAppLink = (phone: string, clientName: string) => {
    // Remove non-digit characters and ensure Morocco country code
    const cleanPhone = phone.replace(/\D/g, "");

    // Add 212 prefix if not present (Morocco)
    const fullPhone = cleanPhone.startsWith("212")
      ? cleanPhone
      : `212${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;

    const message = `Bonjour ${encodeURIComponent(clientName)}`;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  return (
    <>
      {/* Desktop: Top-right fixed position */}
      <div className="hidden md:block fixed top-20 right-6 z-40">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-xl p-2 shadow-lg">
          {/* Primary: New Reservation */}
          <Button asChild className="shadow-sm">
            <Link href="/bookings/create">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle réservation
            </Link>
          </Button>

          {/* Add Damage Report */}
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/damage-reports/new">
              <Camera className="w-4 h-4 mr-2" />
              Ajouter dégâts
            </Link>
          </Button>

          {/* WhatsApp Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
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
      </div>

      {/* Mobile: Bottom fixed position */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-2xl p-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {/* Primary: New Reservation (spans 2 columns) */}
            <Button asChild className="col-span-2 shadow-sm h-12">
              <Link href="/bookings/create">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle réservation
              </Link>
            </Button>

            {/* Add Damage (spans 2 columns) */}
            <Button asChild variant="outline" size="sm" className="col-span-2 shadow-sm">
              <Link href="/damage-reports/new">
                <Camera className="w-4 h-4 mr-1.5" />
                <span className="text-xs">Ajouter dégâts</span>
              </Link>
            </Button>

            {/* WhatsApp Dropdown (spans 2 columns) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="col-span-2 shadow-sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter client (WhatsApp)
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-72 mb-2">
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
        </div>
      </div>
    </>
  );
}
