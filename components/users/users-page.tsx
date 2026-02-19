"use client";

import { useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { UpdateRoleDialog } from "@/components/users/update-role-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { UserActionsMenu } from "@/components/users/user-actions-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  invitedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

type UsersPageProps = {
  initialUsers: ManagedUser[];
  currentUserId: string;
};

function getUserStatus(user: ManagedUser): "invite" | "disabled" | "active" {
  if (!user.isActive) {
    return "disabled";
  }

  if (user.invitedAt && !user.lastLoginAt) {
    return "invite";
  }

  return "active";
}

function roleLabel(role: UserRole): string {
  if (role === "OWNER") return "Propriétaire";
  if (role === "MANAGER") return "Manager";
  return "Employé";
}

function roleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" {
  if (role === "OWNER") return "default";
  if (role === "MANAGER") return "secondary";
  return "outline";
}

function statusLabel(status: ReturnType<typeof getUserStatus>): string {
  if (status === "invite") return "Invité";
  if (status === "disabled") return "Désactivé";
  return "Actif";
}

function statusBadgeVariant(
  status: ReturnType<typeof getUserStatus>,
): "default" | "secondary" | "outline" {
  if (status === "invite") return "secondary";
  if (status === "disabled") return "outline";
  return "default";
}

export function UsersPage({ initialUsers, currentUserId }: UsersPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [roleDialogUser, setRoleDialogUser] = useState<ManagedUser | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<ManagedUser | null>(null);
  const [statusDialogUser, setStatusDialogUser] = useState<ManagedUser | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const aIsOwner = a.role === "OWNER" ? 1 : 0;
        const bIsOwner = b.role === "OWNER" ? 1 : 0;
        if (aIsOwner !== bIsOwner) return bIsOwner - aIsOwner;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [users],
  );

  const upsertUser = (nextUser: ManagedUser) => {
    setUsers((prev) => {
      const index = prev.findIndex((user) => user.id === nextUser.id);
      if (index === -1) return [nextUser, ...prev];
      const copy = [...prev];
      copy[index] = nextUser;
      return copy;
    });
  };

  const handleToggleStatus = async () => {
    if (!statusDialogUser) return;

    setIsStatusLoading(true);
    try {
      const response = await fetch(`/api/users/${statusDialogUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json()) as
        | { user: ManagedUser }
        | { error: string };

      if (!response.ok || !("user" in payload)) {
        toast.error("error" in payload ? payload.error : "Action impossible");
        return;
      }

      upsertUser(payload.user);
      setStatusDialogUser(null);
      toast.success(payload.user.isActive ? "Utilisateur réactivé" : "Utilisateur désactivé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les accès à votre agence
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>Ajouter un utilisateur</Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-border/70 bg-muted/20">
              <tr>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Nom
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Rôle
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Statut
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Dernière connexion
                </th>
                <th className="px-5 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedUsers.map((user) => {
                const status = getUserStatus(user);
                const isSelf = user.id === currentUserId;

                return (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {isSelf ? (
                          <Badge variant="outline" className="text-[10px]">
                            Moi
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-4">
                      <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Jamais connecté"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <UserActionsMenu
                        user={user}
                        isSelf={isSelf}
                        onChangeRole={setRoleDialogUser}
                        onResetPassword={setPasswordDialogUser}
                        onToggleStatus={setStatusDialogUser}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreated={(user) => upsertUser(user)}
      />

      <UpdateRoleDialog
        open={Boolean(roleDialogUser)}
        onOpenChange={(open) => {
          if (!open) setRoleDialogUser(null);
        }}
        user={roleDialogUser}
        onUpdated={upsertUser}
      />

      <ResetPasswordDialog
        open={Boolean(passwordDialogUser)}
        onOpenChange={(open) => {
          if (!open) setPasswordDialogUser(null);
        }}
        user={passwordDialogUser}
      />

      <AlertDialog
        open={Boolean(statusDialogUser)}
        onOpenChange={(open) => {
          if (!open) setStatusDialogUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialogUser?.isActive ? "Désactiver cet utilisateur ?" : "Réactiver cet utilisateur ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialogUser?.isActive
                ? "L'utilisateur ne pourra plus se connecter tant que son compte est désactivé."
                : "L'utilisateur pourra à nouveau se connecter à la plateforme."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isStatusLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isStatusLoading}
              className={
                statusDialogUser?.isActive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {isStatusLoading
                ? "Mise à jour..."
                : statusDialogUser?.isActive
                  ? "Désactiver"
                  : "Réactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
