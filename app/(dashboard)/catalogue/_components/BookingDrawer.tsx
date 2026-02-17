"use client";

import { useState, useEffect } from "react";
import { Vehicle, PaymentType } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { createCatalogueBooking } from "@/lib/actions/catalogue";
import { toast } from "sonner";
import { Loader2, MessageSquare, Zap } from "lucide-react";
import { buildConfirmationWhatsAppLink } from "@/lib/whatsapp";

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  startDate: Date;
  endDate: Date;
}

export function BookingDrawer({
  isOpen,
  onClose,
  vehicle,
  startDate,
  endDate,
}: BookingDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [isRapidMode, setIsRapidMode] = useState(true);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Agence");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [notes, setNotes] = useState("");

  const days = Math.max(1, differenceInDays(endDate, startDate));
  const totalPrice = days * vehicle.pricePerDay;

  const handleSubmit = async (withWhatsApp = false) => {
    if (!customerName || !customerPhone) {
      toast.error("Le nom et le téléphone sont requis");
      return;
    }

    setLoading(true);
    try {
      const result = await createCatalogueBooking({
        vehicleId: vehicle.id,
        startDate,
        endDate,
        customerName,
        customerPhone,
        pricePerDay: vehicle.pricePerDay,
        totalPrice,
        depositAmount: vehicle.depositAmount,
        pickupLocation,
        paymentType,
        notes,
        isRapidMode,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.booking) {
        toast.success(isRapidMode ? "Brouillon créé" : "Réservation confirmée");
        
        if (withWhatsApp) {
          const waLink = buildConfirmationWhatsAppLink({
            vehicleName: `${vehicle.make} ${vehicle.model}`,
            plate: vehicle.plate,
            startDate,
            endDate,
            totalPrice,
            depositAmount: vehicle.depositAmount,
            phone: customerPhone,
          });
          window.open(waLink, "_blank");
        }
        
        onClose();
        // Reset form
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[450px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl">Nouvelle Réservation</SheetTitle>
          <SheetDescription>
            {vehicle.make} {vehicle.model} ({vehicle.plate})
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Dates Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Période</span>
              <span className="font-medium">
                {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Durée</span>
              <span className="font-medium">{days} jour(s)</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{totalPrice} MAD</span>
            </div>
          </div>

          {/* Rapid Mode Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <div className="space-y-0.5">
                <Label htmlFor="rapid-mode" className="text-sm font-semibold">Mode rapide</Label>
                <p className="text-[10px] text-muted-foreground">Uniquement nom + téléphone (Statut: Brouillon)</p>
              </div>
            </div>
            <Checkbox 
              id="rapid-mode" 
              checked={isRapidMode} 
              onCheckedChange={(checked) => setIsRapidMode(!!checked)}
            />
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du client *</Label>
              <Input 
                id="name" 
                placeholder="Ex: Ahmed Alaoui" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input 
                id="phone" 
                placeholder="Ex: 0661234567" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {!isRapidMode && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label>Lieu de récupération</Label>
                <Select value={pickupLocation} onValueChange={setPickupLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agence">Agence</SelectItem>
                    <SelectItem value="Aéroport">Aéroport</SelectItem>
                    <SelectItem value="Hôtel">Hôtel</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Mode de paiement</Label>
                <RadioGroup 
                  value={paymentType} 
                  onValueChange={(v) => setPaymentType(v as PaymentType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CASH" id="cash" />
                    <Label htmlFor="cash" className="font-normal">Espèces</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CARD" id="card" />
                    <Label htmlFor="card" className="font-normal">Carte</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="TRANSFER" id="transfer" />
                    <Label htmlFor="transfer" className="font-normal">Virement</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  placeholder="Notes optionnelles..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Créer réservation
          </Button>
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            size="lg"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            <MessageSquare className="w-4 h-4" />
            Créer & WhatsApp
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
