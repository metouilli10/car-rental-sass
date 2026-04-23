"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormData } from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void | { error: string }>;
  submitLabel: string;
  /** If provided, Cancel button calls this instead of history.back() (e.g. when used in a modal). */
  onCancel?: () => void;
  presentation?: "default" | "mobile-sheet";
}

type DocumentFieldName =
  | "passportPhotoUrl"
  | "passportPhotoBackUrl"
  | "licensePhotoUrl"
  | "licensePhotoBackUrl";

export function CustomerForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  presentation = "default",
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileBackInputRef = useRef<HTMLInputElement>(null);
  const licenseFileInputRef = useRef<HTMLInputElement>(null);
  const licenseBackFileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: "PERSONNE_PHYSIQUE",
      nationality: "Marocaine",
      ...defaultValues,
    },
  });

  const customerType = watch("customerType");
  const isPersonnePhysique = customerType === "PERSONNE_PHYSIQUE";
  const passportPhotoUrl = watch("passportPhotoUrl");
  const passportPhotoBackUrl = watch("passportPhotoBackUrl");
  const licensePhotoUrl = watch("licensePhotoUrl");
  const licensePhotoBackUrl = watch("licensePhotoBackUrl");
  const isMobileSheet = presentation === "mobile-sheet";

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: DocumentFieldName,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/customers/upload-document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setValue(field, data.documentUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const clearDocument = (
    field: DocumentFieldName,
    ref: React.RefObject<HTMLInputElement | null>,
  ) => {
    setValue(field, undefined);
    if (ref.current) ref.current.value = "";
  };

  const onFormSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await onSubmit(data);
      if (result && "error" in result) {
        setError(result.error);
      }
    } catch (err) {
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card className={cn(isMobileSheet ? "overflow-hidden rounded-[28px] border-border/70 shadow-sm" : "")}>
        <CardHeader className={cn(isMobileSheet ? "border-b border-border/60 bg-white/90 pb-4" : "")}>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-4", isMobileSheet ? "space-y-5 bg-white/80 px-4 pb-5 pt-5" : "")}>
          {error && (
            <div className="bg-red-50/60 text-red-600 p-4 rounded-xl border-l-4 border-l-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label>Type de client *</Label>
            <RadioGroup
              value={customerType}
              onValueChange={(value) =>
                setValue("customerType", value as CustomerFormData["customerType"])
              }
              className={isMobileSheet ? "grid grid-cols-1 gap-3" : "flex flex-wrap gap-4"}
            >
              <label className={cn(
                "flex items-center gap-2 cursor-pointer rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                isMobileSheet ? "min-h-14 justify-start" : "",
              )}>
                <RadioGroupItem value="PERSONNE_PHYSIQUE" id="type-physique" />
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Personne physique</span>
              </label>
              <label className={cn(
                "flex items-center gap-2 cursor-pointer rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                isMobileSheet ? "min-h-14 justify-start" : "",
              )}>
                <RadioGroupItem value="PERSONNE_MORALE" id="type-morale" />
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Personne morale</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {isPersonnePhysique ? "Nom complet *" : "Raison sociale *"}
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={isPersonnePhysique ? "Mohammed Alami" : "SARL Example"}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (WhatsApp) *</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+212661234567"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="client@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationalité *</Label>
            <Input
              id="nationality"
              {...register("nationality")}
              placeholder="Marocaine"
              disabled={isLoading}
            />
            {errors.nationality && (
              <p className="text-sm text-red-600">{errors.nationality.message}</p>
            )}
          </div>

          {!isPersonnePhysique && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ice">ICE *</Label>
                <Input
                  id="ice"
                  {...register("ice")}
                  placeholder="001234567000089"
                  disabled={isLoading}
                />
                {errors.ice && (
                  <p className="text-sm text-red-600">{errors.ice.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Identifiant Commun de l&apos;Entreprise
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc">Registre de commerce (RC)</Label>
                <Input
                  id="rc"
                  {...register("rc")}
                  placeholder="12345"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!isPersonnePhysique && (
            <>
              <div className="space-y-2">
                <Label htmlFor="representativeName">Nom du représentant</Label>
                <Input
                  id="representativeName"
                  {...register("representativeName")}
                  placeholder="Mohammed Alami"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="123 Rue Example, Casablanca"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {isPersonnePhysique && (
            <>
          <div className="space-y-2">
            <Label htmlFor="passportOrCIN">Passeport ou CIN *</Label>
            <Input
              id="passportOrCIN"
              {...register("passportOrCIN")}
              placeholder="AB123456 ou CIN123456"
              disabled={isLoading}
            />
            {errors.passportOrCIN && (
              <p className="text-sm text-red-600">
                {errors.passportOrCIN.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Numéro de passeport ou carte d&apos;identité nationale
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportOrCINExpiry">
              Date de validité du passeport ou CIN
            </Label>
            <Input
              id="passportOrCINExpiry"
              type="date"
              {...register("passportOrCINExpiry")}
              disabled={isLoading}
            />
            {errors.passportOrCINExpiry && (
              <p className="text-sm text-red-600">
                {errors.passportOrCINExpiry.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Photo du passeport ou CIN</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentUploadField
                label="Recto"
                value={passportPhotoUrl}
                inputRef={fileInputRef}
                onSelect={() => fileInputRef.current?.click()}
                onChange={(event) => handleDocumentUpload(event, "passportPhotoUrl")}
                onRemove={() => clearDocument("passportPhotoUrl", fileInputRef)}
                disabled={isLoading || isUploading}
                isUploading={isUploading}
                buttonLabel="Télécharger le recto"
                previewAlt="Passeport ou CIN recto"
                fullWidth={isMobileSheet}
              />
              <DocumentUploadField
                label="Verso"
                value={passportPhotoBackUrl}
                inputRef={fileBackInputRef}
                onSelect={() => fileBackInputRef.current?.click()}
                onChange={(event) => handleDocumentUpload(event, "passportPhotoBackUrl")}
                onRemove={() => clearDocument("passportPhotoBackUrl", fileBackInputRef)}
                disabled={isLoading || isUploading}
                isUploading={isUploading}
                buttonLabel="Télécharger le verso"
                previewAlt="Passeport ou CIN verso"
                fullWidth={isMobileSheet}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP ou PDF. Max 5 Mo par fichier.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Permis de conduire</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <DocumentUploadField
                label="Recto"
                value={licensePhotoUrl}
                inputRef={licenseFileInputRef}
                onSelect={() => licenseFileInputRef.current?.click()}
                onChange={(event) => handleDocumentUpload(event, "licensePhotoUrl")}
                onRemove={() => clearDocument("licensePhotoUrl", licenseFileInputRef)}
                disabled={isLoading || isUploading}
                isUploading={isUploading}
                buttonLabel="Télécharger le recto"
                previewAlt="Permis de conduire recto"
                fullWidth={isMobileSheet}
              />
              <DocumentUploadField
                label="Verso"
                value={licensePhotoBackUrl}
                inputRef={licenseBackFileInputRef}
                onSelect={() => licenseBackFileInputRef.current?.click()}
                onChange={(event) => handleDocumentUpload(event, "licensePhotoBackUrl")}
                onRemove={() => clearDocument("licensePhotoBackUrl", licenseBackFileInputRef)}
                disabled={isLoading || isUploading}
                isUploading={isUploading}
                buttonLabel="Télécharger le verso"
                previewAlt="Permis de conduire verso"
                fullWidth={isMobileSheet}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Si le document a deux faces, ajoutez recto et verso séparément.
            </p>
          </div>
            </>
          )}

          <div className={cn("flex gap-3 pt-4", isMobileSheet ? "sticky bottom-0 -mx-4 border-t border-border/70 bg-white/95 px-4 pb-1 pt-4 backdrop-blur" : "")}>
            <Button type="submit" disabled={isLoading} className={cn(isMobileSheet ? "min-h-12 flex-1" : "")}>
              {isLoading ? "Enregistrement..." : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => (onCancel ? onCancel() : window.history.back())}
              className={cn(isMobileSheet ? "min-h-12 flex-1" : "")}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function DocumentUploadField({
  label,
  value,
  inputRef,
  onSelect,
  onChange,
  onRemove,
  disabled,
  isUploading,
  buttonLabel,
  previewAlt,
  fullWidth,
}: {
  label: string;
  value?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  disabled: boolean;
  isUploading: boolean;
  buttonLabel: string;
  previewAlt: string;
  fullWidth: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      {value ? (
        value.toLowerCase().endsWith(".pdf") ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span className="flex-1">Document PDF enregistré</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted/30">
            <Image
              src={value}
              alt={previewAlt}
              fill
              className="object-contain"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="absolute right-1 top-1 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={onChange}
            disabled={disabled}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onSelect}
            disabled={disabled}
            className={cn(fullWidth ? "w-full justify-center" : "w-fit")}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Envoi en cours..." : buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
