"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type ManagedUser } from "@/components/users/types";

type UpdateRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUser | null;
  onUpdated: (user: ManagedUser) => void;
};

type UpdateRoleResponse = { user: ManagedUser } | { error: string };

export function UpdateRoleDialog({
  open,
  onOpenChange,
  user,
  onUpdated,
}: UpdateRoleDialogProps) {
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const payload = (await response.json()) as UpdateRoleResponse;

      if (!response.ok || !("user" in payload)) {
        toast.error("error" in payload ? payload.error : "Mise à jour impossible");
        return;
      }

      onUpdated(payload.user);
      onOpenChange(false);
      toast.success("Rôle mis à jour");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du rôle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier rôle</DialogTitle>
          <DialogDescription>
            Ajustez les permissions de cet utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="user-role-select">Rôle</Label>
          <select
            id="user-role-select"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={isLoading}
          >
            <option value="MANAGER">Gestionnaire</option>
            <option value="EMPLOYEE">Employé</option>
          </select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
