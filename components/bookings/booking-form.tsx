"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingFormData } from "@/lib/validations/booking";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomerForBooking } from "@/lib/actions/customers";
import type { CustomerFormData } from "@/lib/validations/customer";
import { formatCurrency } from "@/lib/utils";
import { UserPlus } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  pricePerDay: number;
  status: string;
}

interface BookingFormProps {
  customers: Customer[];
  vehicles: Vehicle[];
  onSubmit: (data: BookingFormData) => Promise<void>;
}

const NEW_CLIENT_VALUE = "__new_client__";

export function BookingForm({ customers: initialCustomers, vehicles, onSubmit }: BookingFormProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      paymentType: "CASH",
    },
  });

  const customerId = watch("customerId");
  const vehicleId = watch("vehicleId");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const pricePerDay = watch("pricePerDay");
  const paymentType = watch("paymentType");

  // Auto-fill price per day when vehicle is selected
  useEffect(() => {
    if (vehicleId) {
      const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
      if (selectedVehicle) {
        setValue("pricePerDay", selectedVehicle.pricePerDay);
      }
    }
  }, [vehicleId, vehicles, setValue]);

  // Calculate number of days and total price
  useEffect(() => {
    if (startDate && endDate && pricePerDay) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setNumberOfDays(diffDays);

      if (diffDays > 0) {
        const total = diffDays * Number(pricePerDay);
        setValue("totalPrice", total);
      }
    }
  }, [startDate, endDate, pricePerDay, setValue]);

  const handleNewClientSubmit = useCallback(async (data: CustomerFormData) => {
    const newCustomer = await createCustomerForBooking(data);
    setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    setValue("customerId", newCustomer.id);
    setNewClientOpen(false);
  }, [setValue]);

  const onFormSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const totalPrice = watch("totalPrice") || 0;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Client *</Label>
              <Select
                value={customerId === NEW_CLIENT_VALUE ? "" : customerId}
                onValueChange={(value) => {
                  if (value === NEW_CLIENT_VALUE) {
                    setNewClientOpen(true);
                    return;
                  }
                  setValue("customerId", value);
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_CLIENT_VALUE} className="border-t mt-1 pt-2 font-medium text-primary">
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Nouveau client
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-600">
                  {errors.customerId.message}
                </p>
              )}
              <Sheet open={newClientOpen} onOpenChange={setNewClientOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Ajouter un client</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CustomerForm
                      submitLabel="Ajouter et sélectionner"
                      onSubmit={handleNewClientSubmit}
                      onCancel={() => setNewClientOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleId">Véhicule *</Label>
              <Select
                value={vehicleId}
                onValueChange={(value) => setValue("vehicleId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p className="text-sm text-red-600">
                  {errors.vehicleId.message}
                </p>
              )}
              {availableVehicles.length === 0 && (
                <p className="text-sm text-yellow-600">
                  Aucun véhicule disponible
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                disabled={isLoading}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {numberOfDays > 0 && (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              Durée: <strong>{numberOfDays} jour(s)</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Prix par jour (MAD) *</Label>
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                {...register("pricePerDay")}
                disabled={isLoading}
              />
              {errors.pricePerDay && (
                <p className="text-sm text-red-600">
                  {errors.pricePerDay.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">Prix total (MAD) *</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                {...register("totalPrice")}
                disabled={isLoading}
                className="font-bold"
              />
              {errors.totalPrice && (
                <p className="text-sm text-red-600">
                  {errors.totalPrice.message}
                </p>
              )}
              {totalPrice > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(totalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Caution (MAD) *</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                {...register("depositAmount")}
                placeholder="500.00"
                disabled={isLoading}
              />
              {errors.depositAmount && (
                <p className="text-sm text-red-600">
                  {errors.depositAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">Mode de paiement *</Label>
              <Select
                value={paymentType}
                onValueChange={(value) =>
                  setValue("paymentType", value as BookingFormData["paymentType"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="CARD">Carte bancaire</SelectItem>
                  <SelectItem value="TRANSFER">Virement</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentType && (
                <p className="text-sm text-red-600">
                  {errors.paymentType.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              {...register("notes")}
              placeholder="Remarques particulières..."
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer la réservation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => window.history.back()}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
