"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, VehicleFormData } from "@/lib/validations/vehicle";
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

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  submitLabel: string;
}

export function VehicleForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: defaultValues || {
      status: "AVAILABLE",
    },
  });

  const status = watch("status");

  const onFormSubmit = async (data: VehicleFormData) => {
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

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Marque *</Label>
              <Input
                id="make"
                {...register("make")}
                placeholder="Dacia, Renault, Peugeot..."
                disabled={isLoading}
              />
              {errors.make && (
                <p className="text-sm text-red-600">{errors.make.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modèle *</Label>
              <Input
                id="model"
                {...register("model")}
                placeholder="Logan, Clio, 208..."
                disabled={isLoading}
              />
              {errors.model && (
                <p className="text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Année *</Label>
              <Input
                id="year"
                type="number"
                {...register("year")}
                placeholder="2023"
                disabled={isLoading}
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate">Plaque d'immatriculation *</Label>
              <Input
                id="plate"
                {...register("plate")}
                placeholder="A-12345-20"
                disabled={isLoading}
              />
              {errors.plate && (
                <p className="text-sm text-red-600">{errors.plate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Couleur *</Label>
              <Input
                id="color"
                {...register("color")}
                placeholder="Blanc, Noir, Rouge..."
                disabled={isLoading}
              />
              {errors.color && (
                <p className="text-sm text-red-600">{errors.color.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Prix par jour (MAD) *</Label>
              <Input
                id="pricePerDay"
                type="number"
                step="0.01"
                {...register("pricePerDay")}
                placeholder="250.00"
                disabled={isLoading}
              />
              {errors.pricePerDay && (
                <p className="text-sm text-red-600">
                  {errors.pricePerDay.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mileage">Kilométrage</Label>
              <Input
                id="mileage"
                type="number"
                {...register("mileage")}
                placeholder="15000"
                disabled={isLoading}
              />
              {errors.mileage && (
                <p className="text-sm text-red-600">{errors.mileage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as VehicleFormData["status"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="RENTED">Loué</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : submitLabel}
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
