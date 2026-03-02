"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ManagedUser } from "@/components/users/types";

type ResetPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  onSuccess?: () => void;
};

type ResetPasswordResponse = { success: true } | { error: string };

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [tempPassword, setTempPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTempPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;

    if (tempPassword.length < 8) {
      toast.error("Le mot de passe temporaire doit contenir au moins 8 caractères");
      return;
    }

    if (tempPassword !== confirmPassword) {
      toast.error("La confirmation du mot de passe ne correspond pas");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempPassword }),
      });

      const payload = (await response.json()) as ResetPasswordResponse;

      if (!response.ok || !("success" in payload)) {
        toast.error("error" in payload ? payload.error : "Réinitialisation impossible");
        return;
      }

      toast.success("Mot de passe réinitialisé");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réinitialiser mot de passe</DialogTitle>
          <DialogDescription>
            Définissez un nouveau mot de passe temporaire pour {user?.email}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-temp-password">Nouveau mot de passe temporaire</Label>
            <div className="relative">
              <Input
                id="reset-temp-password"
                type={showPassword ? "text" : "password"}
                value={tempPassword}
                onChange={(event) => setTempPassword(event.target.value)}
                placeholder="Minimum 8 caractères"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-temp-password-confirm">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="reset-temp-password-confirm"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Retapez le mot de passe"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Réinitialisation..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
