"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ManagedUser } from "@/components/users/types";

type AddUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: ManagedUser) => void;
};

type CreateUserResponse =
  | {
      user: ManagedUser;
    }
  | {
      error: string;
    };

export function AddUserDialog({ open, onOpenChange, onCreated }: AddUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [tempPassword, setTempPassword] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [createdUser, setCreatedUser] = useState<ManagedUser | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [showSuccessPassword, setShowSuccessPassword] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && tempPassword.trim().length >= 8,
    [email, tempPassword],
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("EMPLOYEE");
    setTempPassword("");
    setForcePasswordChange(false);
    setShowPassword(false);
    setCreatedUser(null);
    setRevealedPassword(null);
    setShowSuccessPassword(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleCreate = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          role,
          tempPassword,
          forcePasswordChange,
        }),
      });

      const payload = (await response.json()) as CreateUserResponse;

      if (!response.ok || !("user" in payload)) {
        toast.error("error" in payload ? payload.error : "Création impossible");
        return;
      }

      onCreated(payload.user);
      setCreatedUser(payload.user);
      setRevealedPassword(tempPassword);
      setTempPassword("");
      toast.success("Utilisateur créé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!revealedPassword) return;
    try {
      await navigator.clipboard.writeText(revealedPassword);
      toast.success("Mot de passe copié");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de copier le mot de passe");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {!createdUser ? (
          <>
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
              <DialogDescription>
                Créez un compte d&apos;accès pour un membre de votre agence.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Nom</Label>
                <Input
                  id="new-user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nom complet (optionnel)"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="employe@agence.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-user-role">Rôle</Label>
                <select
                  id="new-user-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  disabled={isLoading}
                >
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employé</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-user-temp-password">Mot de passe temporaire</Label>
                <div className="relative">
                  <Input
                    id="new-user-temp-password"
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
                <p className="text-xs text-muted-foreground">
                  À partager avec l&apos;employé. Il pourra le changer plus tard.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-dashed border-border px-3 py-2">
                <Checkbox
                  id="new-user-force-password"
                  checked={forcePasswordChange}
                  onCheckedChange={(checked) => setForcePasswordChange(Boolean(checked))}
                  disabled={isLoading}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="new-user-force-password"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Forcer changement de mot de passe au prochain login
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Option placeholder prête pour une future activation.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={isLoading || !canSubmit}>
                {isLoading ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Utilisateur créé</DialogTitle>
              <DialogDescription>
                Le compte est prêt. Transmettez les informations ci-dessous.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{createdUser.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rôle</p>
                <p className="text-sm font-medium">{createdUser.role === "MANAGER" ? "Manager" : "Employé"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mot de passe temporaire
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      revealedPassword
                        ? showSuccessPassword
                          ? revealedPassword
                          : "••••••••••••"
                        : ""
                    }
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSuccessPassword((prev) => !prev)}
                  >
                    {showSuccessPassword ? "Masquer" : "Afficher"}
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                  Ce mot de passe est affiché une seule fois.
                </p>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setCreatedUser(null);
                  setRevealedPassword(null);
                  setShowSuccessPassword(false);
                  setEmail("");
                  setName("");
                  setRole("EMPLOYEE");
                  setForcePasswordChange(false);
                }}
              >
                Ajouter un autre
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
