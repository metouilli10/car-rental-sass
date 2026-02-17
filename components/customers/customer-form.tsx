"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormData } from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, User, Building2 } from "lucide-react";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void | { error: string }>;
  submitLabel: string;
  /** If provided, Cancel button calls this instead of history.back() (e.g. when used in a modal). */
  onCancel?: () => void;
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseFileInputRef = useRef<HTMLInputElement>(null);

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
      ...defaultValues,
    },
  });

  const customerType = watch("customerType");
  const isPersonnePhysique = customerType === "PERSONNE_PHYSIQUE";
  const passportPhotoUrl = watch("passportPhotoUrl");
  const licensePhotoUrl = watch("licensePhotoUrl");

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
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
      setValue("passportPhotoUrl", data.documentUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveDocument = () => {
    setValue("passportPhotoUrl", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLicenseUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
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
      setValue("licensePhotoUrl", data.documentUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'upload"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveLicense = () => {
    setValue("licensePhotoUrl", undefined);
    if (licenseFileInputRef.current) licenseFileInputRef.current.value = "";
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
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="flex flex-wrap gap-4"
            >
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="PERSONNE_PHYSIQUE" id="type-physique" />
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Personne physique</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-border/60 px-4 py-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
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

          <div className="grid grid-cols-2 gap-4">
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

          {!isPersonnePhysique && (
            <div className="grid grid-cols-2 gap-4">
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
              Numéro de passeport ou carte d'identité nationale
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
            {passportPhotoUrl ? (
              <div className="relative inline-block">
                {passportPhotoUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <span>Document PDF enregistré</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDocument}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative h-32 w-48 overflow-hidden rounded-xl bg-muted/30">
                    <Image
                      src={passportPhotoUrl}
                      alt="Document"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleRemoveDocument}
                      disabled={isLoading}
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleDocumentUpload}
                  disabled={isLoading || isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="w-fit"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading
                    ? "Envoi en cours..."
                    : "Télécharger une photo ou un scan"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP ou PDF. Max 5 Mo.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Permis de conduire</Label>
            {licensePhotoUrl ? (
              <div className="relative inline-block">
                {licensePhotoUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <span>Document PDF enregistré</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLicense}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative h-32 w-48 overflow-hidden rounded-xl bg-muted/30">
                    <Image
                      src={licensePhotoUrl}
                      alt="Permis de conduire"
                      fill
                      className="object-contain"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleRemoveLicense}
                      disabled={isLoading}
                      className="absolute right-1 top-1 h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  ref={licenseFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleLicenseUpload}
                  disabled={isLoading || isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => licenseFileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="w-fit"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading
                    ? "Envoi en cours..."
                    : "Télécharger le permis de conduire"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP ou PDF. Max 5 Mo.
                </p>
              </div>
            )}
          </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => (onCancel ? onCancel() : window.history.back())}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
