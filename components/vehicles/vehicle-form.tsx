"use client";

import { useState, useRef } from "react";
import Image from "next/image";
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
import { Upload, X } from "lucide-react";
import { RemindersSetupPanel } from "./reminders-setup-panel";

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => Promise<void | { error: string }>;
  submitLabel: string;
}

export function VehicleForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: VehicleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: "AVAILABLE",
      photoUrl: defaultValues?.photoUrl ?? "",
      insuranceReminderDays: [30, 15, 7],
      technicalInspectionReminderDays: [30, 15, 7],
      vignetteReminderDays: [30, 15, 7],
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const status = watch("status");
  const photoUrl = watch("photoUrl");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/vehicles/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setValue("photoUrl", data.photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setValue("photoUrl", undefined);
    fileInputRef.current?.value && (fileInputRef.current.value = "");
  };

  const onFormSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await onSubmit(data);
      if (result && "error" in result) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* ── Main vehicle info card ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50/60 text-red-600 p-4 rounded-xl border-l-4 border-l-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Photo du véhicule</Label>
            <p className="text-xs text-muted-foreground mb-2">
              La photo apparaîtra dans le catalogue. JPEG, PNG ou WebP, max 5 Mo.
            </p>
            <div className="flex items-start gap-4">
              <div className="relative w-40 h-28 rounded-xl bg-muted/50 overflow-hidden flex items-center justify-center">
                {photoUrl ? (
                  <>
                    <Image
                      src={photoUrl}
                      alt="Aperçu"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemovePhoto}
                      disabled={isLoading || isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-8 w-8 opacity-50" />
                    <span className="text-xs">Aucune photo</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                >
                  {isUploading ? "Upload..." : photoUrl ? "Changer" : "Ajouter une photo"}
                </Button>
              </div>
            </div>
          </div>

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
              <Label htmlFor="plate">Plaque d&apos;immatriculation *</Label>
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

      {/* ── Reminders setup panel (replaces old collapsible) ──────────── */}
      <RemindersSetupPanel form={form} isLoading={isLoading} />
    </form>
  );
}
