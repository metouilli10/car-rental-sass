"use client";

import Image from "next/image";
import { Vehicle, Gearbox } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Wind, 
  Settings2, 
  Share2, 
  Info,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { buildOfferWhatsAppLink } from "@/lib/whatsapp";
import { BookingDrawer } from "./BookingDrawer";
import { useState } from "react";
import { toast } from "sonner";

function VehicleImage({
  src,
  alt,
  className,
  placeholder,
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder: React.ReactNode;
}) {
  const [error, setError] = useState(false);
  if (error || !src) return <>{placeholder}</>;
  // Use Next Image with unoptimized for local /assets/ so static files are served correctly
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      unoptimized={src.startsWith("/")}
      onError={() => setError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
    />
  );
}

interface VehicleCardProps {
  vehicle: Vehicle & {
    availability: {
      status: "AVAILABLE" | "UNAVAILABLE" | "RETURNING_TODAY";
      time?: Date;
    };
  };
  startDate: Date;
  endDate: Date;
}

export function VehicleCard({ vehicle, startDate, endDate }: VehicleCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleShare = () => {
    const link = buildOfferWhatsAppLink({
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      plate: vehicle.plate,
      pricePerDay: vehicle.pricePerDay,
      depositAmount: vehicle.depositAmount,
      startDate,
      endDate,
    });
    window.open(link, "_blank");
    toast.success("Lien WhatsApp généré");
  };

  return (
    <Card className="overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300" suppressHydrationWarning>
      <div className="relative aspect-[16/10] bg-muted overflow-hidden" suppressHydrationWarning>
        {vehicle.photoUrl ? (
          <VehicleImage
            src={vehicle.photoUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
            placeholder={
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                    <Settings2 className="w-8 h-8 opacity-20" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider opacity-50">Pas de photo</span>
                </div>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                <Settings2 className="w-8 h-8 opacity-20" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider opacity-50">Pas de photo</span>
            </div>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-col gap-2" suppressHydrationWarning>
          {vehicle.availability.status === "AVAILABLE" && (
            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-none backdrop-blur-md">
              Disponible
            </Badge>
          )}
          {vehicle.availability.status === "RETURNING_TODAY" && (
            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-none backdrop-blur-md gap-1">
              <Clock className="w-3 h-3" />
              Retour {vehicle.availability.time ? format(vehicle.availability.time, "HH:mm") : "18:00"}
            </Badge>
          )}
          {vehicle.availability.status === "UNAVAILABLE" && (
            <Badge variant="secondary" className="bg-slate-500/90 text-white border-none backdrop-blur-md">
              Indisponible
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-md border-none font-mono text-[10px]">
            {vehicle.plate}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-0" suppressHydrationWarning>
        <div className="flex justify-between items-start" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <h3 className="font-bold text-lg leading-tight">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {vehicle.category} • {vehicle.year}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {vehicle.pricePerDay} <span className="text-xs font-normal text-muted-foreground">MAD/j</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Caution: {vehicle.depositAmount} MAD
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1" suppressHydrationWarning>
        <div className="flex flex-wrap gap-2" suppressHydrationWarning>
          <Badge variant="outline" className="bg-muted/30 border-none text-[10px] gap-1 h-6">
            <Settings2 className="w-3 h-3" />
            {vehicle.gearbox === "AUTO" ? "Auto" : "Manuel"}
          </Badge>
          <Badge variant="outline" className="bg-muted/30 border-none text-[10px] gap-1 h-6">
            <Users className="w-3 h-3" />
            {vehicle.seats} places
          </Badge>
          {vehicle.hasAC && (
            <Badge variant="outline" className="bg-muted/30 border-none text-[10px] gap-1 h-6">
              <Wind className="w-3 h-3" />
              Clim
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2" suppressHydrationWarning>
        <Button 
          className="flex-1" 
          disabled={vehicle.availability.status === "UNAVAILABLE"}
          onClick={() => setIsDrawerOpen(true)}
        >
          Réserver
        </Button>
        <Button variant="outline" size="icon" onClick={handleShare} title="Partager sur WhatsApp">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Détails du véhicule">
          <Info className="h-4 w-4" />
        </Button>
      </CardFooter>

      <BookingDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        vehicle={vehicle}
        startDate={startDate}
        endDate={endDate}
      />
    </Card>
  );
}
