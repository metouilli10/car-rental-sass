"use client";

import { useState, useRef, useCallback } from "react";
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
import {
  Upload,
  X,
  ImagePlus,
  Check,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Car,
  BadgeCent,
} from "lucide-react";
import { RemindersSetupPanel } from "./reminders-setup-panel";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => Promise<void | { error: string }>;
  submitLabel: string;
}

const STEPS = [
  { number: 1, label: "Identité du véhicule", icon: Car },
  { number: 2, label: "Tarification & statut", icon: BadgeCent },
] as const;

const STATUS_DESCRIPTIONS: Record<string, string> = {
  AVAILABLE: "Visible et réservable par vos clients",
  RENTED: "Actuellement en location",
  MAINTENANCE: "Indisponible temporairement",
};

const STEP1_FIELDS = ["make", "model", "year", "plate", "color"] as const;

/* ─── Step Indicator ─────────────────────────────────────────────────── */

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav aria-label="Étapes du formulaire" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => {
          const isActive = currentStep === s.number;
          const isCompleted = currentStep > s.number;
          const Icon = s.icon;

          return (
            <li key={s.number} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isCompleted) onStepClick(s.number);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200",
                  isActive &&
                    "bg-primary/10 text-primary",
                  isCompleted &&
                    "text-primary cursor-pointer hover:bg-primary/5",
                  !isActive &&
                    !isCompleted &&
                    "text-slate-400 cursor-default"
                )}
                aria-current={isActive ? "step" : undefined}
                disabled={!isCompleted}
              >
                {/* Circle */}
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200 shrink-0",
                    isActive &&
                      "bg-primary text-white shadow-md shadow-primary/25",
                    isCompleted &&
                      "bg-primary text-white",
                    !isActive &&
                      !isCompleted &&
                      "border-2 border-slate-300 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    s.number
                  )}
                </span>

                {/* Label */}
                <span className="hidden sm:flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      isActive && "font-semibold"
                    )}
                  >
                    {s.label}
                  </span>
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1 rounded-full transition-colors duration-200",
                    currentStep > s.number ? "bg-primary" : "bg-slate-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Photo Dropzone ─────────────────────────────────────────────────── */

function PhotoDropzone({
  photoUrl,
  isUploading,
  isLoading,
  onFileSelect,
  onRemove,
}: {
  photoUrl: string | undefined;
  isUploading: boolean;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items?.length) setIsDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  };

  const disabled = isLoading || isUploading;

  if (photoUrl) {
    return (
      <div className="space-y-2">
        <Label>Photo du véhicule</Label>
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 group">
          <Image
            src={photoUrl}
            alt="Aperçu du véhicule"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleInputChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white text-slate-700 shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
              Remplacer
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white text-red-600 shadow-lg"
              onClick={onRemove}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Supprimer
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Upload en cours...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Photo du véhicule</Label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative w-full h-40 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-2",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-slate-300 bg-slate-50/50 hover:border-primary/50 hover:bg-primary/[0.02]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Zone de dépôt de photo"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />

        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Upload en cours...
          </div>
        ) : (
          <>
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isDragActive ? "bg-primary/10" : "bg-slate-100"
              )}
            >
              <Upload
                className={cn(
                  "h-5 w-5",
                  isDragActive ? "text-primary" : "text-slate-400"
                )}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 font-medium">
                {isDragActive
                  ? "Déposez la photo ici"
                  : "Glissez une photo ou cliquez pour parcourir"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                JPEG, PNG ou WebP · Max 5 Mo
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── FormField helper ───────────────────────────────────────────────── */

function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}

/* ─── Main Form ──────────────────────────────────────────────────────── */

export function VehicleForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: VehicleFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    trigger,
  } = form;

  const status = watch("status");
  const photoUrl = watch("photoUrl");

  /* ── Photo handlers ──────────────────────────────────────────────── */

  const handleFileSelect = useCallback(
    async (file: File) => {
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
        setError(
          err instanceof Error ? err.message : "Erreur lors de l'upload"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [setValue]
  );

  const handleRemovePhoto = useCallback(() => {
    setValue("photoUrl", undefined);
  }, [setValue]);

  /* ── Step navigation ─────────────────────────────────────────────── */

  const goToNextStep = async () => {
    const valid = await trigger(STEP1_FIELDS as unknown as (keyof VehicleFormData)[]);
    if (valid) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevStep = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Submit ──────────────────────────────────────────────────────── */

  const onFormSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await onSubmit(data);
      if (result && "error" in result) {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur s'est produite"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* ── Step Indicator ─────────────────────────────────────────── */}
      <StepIndicator currentStep={step} onStepClick={setStep} />

      {/* ── Global Error ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50/80 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm flex items-start gap-2">
          <X className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 1 — Identité du véhicule
          ══════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              Identité du véhicule
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Informations de base pour identifier le véhicule dans votre parc
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Photo dropzone */}
            <PhotoDropzone
              photoUrl={photoUrl}
              isUploading={isUploading}
              isLoading={isLoading}
              onFileSelect={handleFileSelect}
              onRemove={handleRemovePhoto}
            />

            {/* Fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
              <FormField
                label="Marque"
                htmlFor="make"
                required
                error={errors.make?.message}
                hint="Ex : Dacia, Renault, Peugeot"
              >
                <Input
                  id="make"
                  {...register("make")}
                  placeholder="Dacia"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Modèle"
                htmlFor="model"
                required
                error={errors.model?.message}
                hint="Ex : Logan, Clio, 208"
              >
                <Input
                  id="model"
                  {...register("model")}
                  placeholder="Logan"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Année"
                htmlFor="year"
                required
                error={errors.year?.message}
              >
                <Input
                  id="year"
                  type="number"
                  {...register("year")}
                  placeholder="2024"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Plaque d'immatriculation"
                htmlFor="plate"
                required
                error={errors.plate?.message}
                hint="Format marocain : 4 chiffres, 1 lettre, 2 chiffres (ex. 1234 A 56)"
              >
                <Input
                  id="plate"
                  {...register("plate")}
                  placeholder="1234 A 56"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Couleur"
                htmlFor="color"
                required
                error={errors.color?.message}
              >
                <Input
                  id="color"
                  {...register("color")}
                  placeholder="Blanc"
                  disabled={isLoading}
                />
              </FormField>

              <FormField
                label="Kilométrage"
                htmlFor="mileage"
                error={errors.mileage?.message}
                hint="Optionnel — pour le suivi d'entretien"
              >
                <Input
                  id="mileage"
                  type="number"
                  {...register("mileage")}
                  placeholder="15 000"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>

          {/* Step 1 Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.history.back()}
              disabled={isLoading}
              className="text-slate-500"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={isLoading}
              className="gap-1.5"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2 — Tarification & statut
          ══════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BadgeCent className="h-4 w-4 text-primary" />
                Tarification & statut
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Définir le prix de location et la disponibilité du véhicule
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Price field with InputGroup */}
              <div className="space-y-1.5">
                <Label htmlFor="pricePerDay">
                  Prix par jour
                  <span className="text-red-400 ml-0.5">*</span>
                </Label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-border/60 bg-slate-50 text-sm font-medium text-slate-500 select-none">
                    MAD
                  </span>
                  <Input
                    id="pricePerDay"
                    type="number"
                    step="0.01"
                    {...register("pricePerDay")}
                    placeholder="250.00"
                    disabled={isLoading}
                    className="rounded-none border-x-0 focus-visible:z-10 relative"
                  />
                  <span className="inline-flex items-center px-3.5 rounded-r-xl border border-l-0 border-border/60 bg-slate-50 text-sm text-slate-400 select-none">
                    / jour
                  </span>
                </div>
                {errors.pricePerDay ? (
                  <p className="text-xs text-red-500 mt-0.5">
                    {errors.pricePerDay.message}
                  </p>
                ) : (
                  <div className="flex items-start gap-1.5 mt-2 px-3 py-2 bg-amber-50/60 border border-amber-200/50 rounded-lg">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Astuce : Vous pourrez créer des tarifs saisonniers plus
                      tard.
                    </p>
                  </div>
                )}
              </div>

              {/* Status field */}
              <div className="space-y-1.5">
                <Label htmlFor="status">
                  Statut
                  <span className="text-red-400 ml-0.5">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setValue("status", value as VehicleFormData["status"])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                    <SelectItem value="RENTED">Loué</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status ? (
                  <p className="text-xs text-red-500 mt-0.5">
                    {errors.status.message}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {STATUS_DESCRIPTIONS[status] || "Sélectionnez un statut"}
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goToPrevStep}
                disabled={isLoading}
                className="text-slate-500 gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-1.5">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>

          {/* ── Reminders setup panel ────────────────────────────────── */}
          <RemindersSetupPanel form={form} isLoading={isLoading} />
        </>
      )}
    </form>
  );
}
