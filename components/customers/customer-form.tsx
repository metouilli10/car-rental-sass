"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerFormData } from "@/lib/validations/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  submitLabel: string;
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  const onFormSubmit = async (data: CustomerFormData) => {
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
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Mohammed Alami"
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
