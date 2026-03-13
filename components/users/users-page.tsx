"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import {
  countPermissionOverrides,
  getPermissionGroups,
  getPermissionState,
  getRoleDefaultPermissions,
  mapPermissionStateToOverride,
  type PermissionKey,
  type PermissionMatrixState,
} from "@/lib/permissions";
import type {
  ManagedUser,
  UserActivityItem,
  UserActivityResponse,
} from "@/components/users/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/users/add-user-dialog";
import { UpdateRoleDialog } from "@/components/users/update-role-dialog";
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog";
import { UserActionsMenu } from "@/components/users/user-actions-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  if (role === "MANAGER") return "Gestionnaire";
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

function actionLabel(action: string): string {
  if (action === "USER_CREATED") return "Création";
  if (action === "USER_ROLE_UPDATE") return "Rôle";
  if (action === "USER_STATUS_UPDATE") return "Statut";
  if (action === "USER_PASSWORD_RESET") return "Mot de passe";
  if (action === "USER_PERMISSIONS_UPDATE") return "Permissions";
  return action;
}

function outcomeBadgeVariant(outcome: UserActivityItem["outcome"]): "default" | "secondary" | "outline" {
  if (outcome === "SUCCESS") return "default";
  if (outcome === "DENIED") return "secondary";
  return "outline";
}

function outcomeLabel(outcome: UserActivityItem["outcome"]): string {
  if (outcome === "SUCCESS") return "Succès";
  if (outcome === "DENIED") return "Refusé";
  return "Échec";
}

function detailsSummary(item: UserActivityItem): string {
  if (!item.details) {
    return "Aucun détail";
  }

  const entries = Object.entries(item.details);
  if (entries.length === 0) {
    return "Aucun détail";
  }

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" | ");
}

function toOverrideSignature(user: ManagedUser | null): string {
  return JSON.stringify(user?.permissionOverrides ?? {});
}

function cloneOverrides(user: ManagedUser | null) {
  return user?.permissionOverrides ? { ...user.permissionOverrides } : {};
}

export function UsersPage({ initialUsers, currentUserId }: UsersPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [activeTab, setActiveTab] = useState("users");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [roleDialogUser, setRoleDialogUser] = useState<ManagedUser | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<ManagedUser | null>(null);
  const [statusDialogUser, setStatusDialogUser] = useState<ManagedUser | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftOverrides, setDraftOverrides] = useState<Record<string, boolean>>({});
  const [baselineOverridesSignature, setBaselineOverridesSignature] = useState("{}");
  const [isPermissionSaving, setIsPermissionSaving] = useState(false);

  const [activityItems, setActivityItems] = useState<UserActivityItem[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [hasLoadedActivity, setHasLoadedActivity] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityUserFilter, setActivityUserFilter] = useState<string>("all");
  const [activityActionFilter, setActivityActionFilter] = useState<string>("all");
  const [activityReloadToken, setActivityReloadToken] = useState(0);

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

  const editableUsers = useMemo(
    () => sortedUsers.filter((user) => user.role !== "OWNER"),
    [sortedUsers],
  );

  const selectedUser =
    sortedUsers.find((user) => user.id === selectedUserId) ??
    editableUsers[0] ??
    sortedUsers[0] ??
    null;

  const isPermissionsDirty = useMemo(
    () => JSON.stringify(draftOverrides) !== baselineOverridesSignature,
    [baselineOverridesSignature, draftOverrides],
  );

  const effectivePreview = useMemo(
    () =>
      selectedUser
        ? {
            ...getRoleDefaultPermissions(selectedUser.role),
            ...draftOverrides,
          }
        : null,
    [draftOverrides, selectedUser],
  );

  useEffect(() => {
    if (!selectedUserId && (editableUsers[0] ?? sortedUsers[0])) {
      setSelectedUserId((editableUsers[0] ?? sortedUsers[0]).id);
    }
  }, [editableUsers, selectedUserId, sortedUsers]);

  useEffect(() => {
    if (!selectedUser) {
      setDraftOverrides({});
      setBaselineOverridesSignature("{}");
      return;
    }

    const nextSignature = toOverrideSignature(selectedUser);
    if (!isPermissionSaving && !isPermissionsDirty && nextSignature !== baselineOverridesSignature) {
      setDraftOverrides(cloneOverrides(selectedUser));
      setBaselineOverridesSignature(nextSignature);
    }
  }, [
    baselineOverridesSignature,
    isPermissionSaving,
    isPermissionsDirty,
    selectedUser,
  ]);

  useEffect(() => {
    if (activeTab !== "activity") {
      return;
    }

    void loadActivityPage(true);
  }, [activeTab, activityActionFilter, activityReloadToken, activityUserFilter]);

  const markActivityStale = () => {
    setActivityReloadToken((prev) => prev + 1);
  };

  const upsertUser = (nextUser: ManagedUser) => {
    setUsers((prev) => {
      const index = prev.findIndex((user) => user.id === nextUser.id);
      if (index === -1) return [nextUser, ...prev];
      const copy = [...prev];
      copy[index] = nextUser;
      return copy;
    });
  };

  const handleUserMutation = (nextUser: ManagedUser) => {
    upsertUser(nextUser);
    markActivityStale();
  };

  async function loadActivityPage(reset = false) {
    setIsActivityLoading(true);
    setActivityError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "25");
      if (!reset && activityCursor) {
        params.set("cursor", activityCursor);
      }
      if (activityUserFilter !== "all") {
        params.set("userId", activityUserFilter);
      }
      if (activityActionFilter !== "all") {
        params.set("action", activityActionFilter);
      }

      const response = await fetch(`/api/users/activity?${params.toString()}`);
      const payload = (await response.json()) as UserActivityResponse | { error: string };

      if (!response.ok || !("items" in payload)) {
        throw new Error("error" in payload ? payload.error : "Chargement impossible");
      }

      setActivityItems((prev) => (reset ? payload.items : [...prev, ...payload.items]));
      setActivityCursor(payload.nextCursor);
      setHasLoadedActivity(true);
    } catch (error) {
      console.error(error);
      setActivityError(error instanceof Error ? error.message : "Erreur de chargement");
      if (reset) {
        setActivityItems([]);
        setActivityCursor(null);
      }
    } finally {
      setIsActivityLoading(false);
    }
  }

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

      handleUserMutation(payload.user);
      setStatusDialogUser(null);
      toast.success(payload.user.isActive ? "Utilisateur reactive" : "Utilisateur desactive");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise a jour du statut");
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleSelectUser = (nextUserId: string) => {
    if (nextUserId === selectedUser?.id) {
      return;
    }

    if (isPermissionsDirty) {
      const shouldContinue = window.confirm(
        "Des changements de permissions non enregistres seront perdus. Continuer ?",
      );

      if (!shouldContinue) {
        return;
      }
    }

    const nextUser = sortedUsers.find((user) => user.id === nextUserId) ?? null;
    setSelectedUserId(nextUserId);
    setDraftOverrides(cloneOverrides(nextUser));
    setBaselineOverridesSignature(toOverrideSignature(nextUser));
  };

  const handlePermissionStateChange = (key: PermissionKey, state: PermissionMatrixState) => {
    setDraftOverrides((prev) => {
      const next = { ...prev };
      const overrideValue = mapPermissionStateToOverride(state);

      if (overrideValue === null) {
        delete next[key];
      } else {
        next[key] = overrideValue;
      }

      return next;
    });
  };

  const handleResetPermissionDraft = () => {
    setDraftOverrides(cloneOverrides(selectedUser));
    setBaselineOverridesSignature(toOverrideSignature(selectedUser));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || selectedUser.role === "OWNER") {
      return;
    }

    setIsPermissionSaving(true);
    try {
      const patch: Record<string, boolean | null> = {};

      for (const group of getPermissionGroups()) {
        for (const item of group.items) {
          const currentValue =
            Object.prototype.hasOwnProperty.call(draftOverrides, item.key)
              ? draftOverrides[item.key]
              : null;
          patch[item.key] = typeof currentValue === "boolean" ? currentValue : null;
        }
      }

      const response = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides: patch }),
      });

      const payload = (await response.json()) as
        | { user: ManagedUser }
        | { error: string };

      if (!response.ok || !("user" in payload)) {
        toast.error("error" in payload ? payload.error : "Enregistrement impossible");
        return;
      }

      handleUserMutation(payload.user);
      setDraftOverrides(cloneOverrides(payload.user));
      setBaselineOverridesSignature(toOverrideSignature(payload.user));
      toast.success("Permissions mises a jour");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise a jour des permissions");
    } finally {
      setIsPermissionSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les accès, les permissions et l&apos;historique de votre agence.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>Ajouter un utilisateur</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
            <Table className="min-w-[960px]">
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="px-5">Nom</TableHead>
                  <TableHead className="px-5">Email</TableHead>
                  <TableHead className="px-5">Rôle</TableHead>
                  <TableHead className="px-5">Statut</TableHead>
                  <TableHead className="px-5">Dérogations</TableHead>
                  <TableHead className="px-5">Dernière connexion</TableHead>
                  <TableHead className="px-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => {
                  const status = getUserStatus(user);
                  const isSelf = user.id === currentUserId;
                  const overrideCount = countPermissionOverrides(user.permissionOverrides);

                  return (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell className="px-5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          {isSelf ? (
                            <Badge variant="outline" className="text-[10px]">
                              Moi
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="px-5">
                        <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="px-5">
                        <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
                      </TableCell>
                      <TableCell className="px-5">
                        <Badge variant={overrideCount > 0 ? "secondary" : "outline"}>
                          {overrideCount} dérogation{overrideCount > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 text-muted-foreground">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Jamais connecté"}
                      </TableCell>
                      <TableCell className="px-5 text-right">
                        <UserActionsMenu
                          user={user}
                          isSelf={isSelf}
                          onChangeRole={setRoleDialogUser}
                          onResetPassword={setPasswordDialogUser}
                          onToggleStatus={setStatusDialogUser}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-0">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Utilisateurs</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sélectionnez un compte pour ajuster les dérogations.
                </p>
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                {sortedUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const overrideCount = countPermissionOverrides(user.permissionOverrides);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user.id)}
                      className={`flex w-full items-start justify-between gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors ${
                        isSelected ? "bg-muted/40" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                          <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={overrideCount > 0 ? "secondary" : "outline"}>
                        {overrideCount}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {selectedUser ? `Matrice de ${selectedUser.name}` : "Matrice de permissions"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Base par rôle + dérogations explicites.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetPermissionDraft}
                    disabled={!selectedUser || !isPermissionsDirty || isPermissionSaving}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSavePermissions}
                    disabled={
                      !selectedUser ||
                      selectedUser.role === "OWNER" ||
                      !isPermissionsDirty ||
                      isPermissionSaving
                    }
                  >
                    {isPermissionSaving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>

              {!selectedUser ? (
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  Aucun utilisateur disponible.
                </div>
              ) : selectedUser.role === "OWNER" ? (
                <div className="px-4 py-8">
                  <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    Le propriétaire conserve toutes les permissions. Aucune dérogation n&apos;est modifiable.
                  </div>
                </div>
              ) : (
                <div className="space-y-6 px-4 py-4">
                  {getPermissionGroups().map((group) => {
                    const roleDefaults = getRoleDefaultPermissions(selectedUser.role);

                    return (
                      <div key={group.key} className="space-y-3">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border/60">
                          <Table>
                            <TableHeader className="bg-muted/20">
                              <TableRow>
                                <TableHead>Permission</TableHead>
                                <TableHead>Défaut du rôle</TableHead>
                                <TableHead>Dérogation</TableHead>
                                <TableHead>Effectif</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.items.map((item) => {
                                const state = getPermissionState(draftOverrides, item.key);
                                const effectiveValue = effectivePreview?.[item.key] ?? false;

                                return (
                                  <TableRow key={item.key}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-foreground">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={roleDefaults[item.key] ? "default" : "outline"}>
                                        {roleDefaults[item.key] ? "Autorisé" : "Refusé"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <select
                                        value={state}
                                        onChange={(event) =>
                                          handlePermissionStateChange(
                                            item.key,
                                            event.target.value as PermissionMatrixState,
                                          )
                                        }
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                      >
                                        <option value="inherit">Hériter</option>
                                        <option value="allow">Autoriser</option>
                                        <option value="deny">Refuser</option>
                                      </select>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={effectiveValue ? "default" : "outline"}>
                                        {effectiveValue ? "Autorisé" : "Refusé"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Journal d&apos;activité</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Actions critiques liées à la gestion des utilisateurs.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => void loadActivityPage(true)}
                disabled={isActivityLoading}
              >
                Rafraîchir
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Utilisateur cible</label>
                <select
                  value={activityUserFilter}
                  onChange={(event) => setActivityUserFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Tous</option>
                  {sortedUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Action</label>
                <select
                  value={activityActionFilter}
                  onChange={(event) => setActivityActionFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Toutes</option>
                  <option value="USER_CREATED">Création</option>
                  <option value="USER_ROLE_UPDATE">Rôle</option>
                  <option value="USER_STATUS_UPDATE">Statut</option>
                  <option value="USER_PASSWORD_RESET">Mot de passe</option>
                  <option value="USER_PERMISSIONS_UPDATE">Permissions</option>
                </select>
              </div>
            </div>

            {activityError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {activityError}
              </div>
            ) : null}

            {!hasLoadedActivity && isActivityLoading ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                Chargement...
              </div>
            ) : activityItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                Aucun événement pour ce filtre.
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table className="min-w-[860px]">
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Acteur</TableHead>
                        <TableHead>Cible</TableHead>
                        <TableHead>Résultat</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityItems.map((item) => {
                        const targetUser =
                          sortedUsers.find((user) => user.id === item.target.entityId) ?? null;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>{formatDateTime(item.occurredAt)}</TableCell>
                            <TableCell>{actionLabel(item.action)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {item.actor.email ?? "Système"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.actor.role ?? "n/a"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{targetUser?.name ?? item.target.entityId}</TableCell>
                            <TableCell>
                              <Badge variant={outcomeBadgeVariant(item.outcome)}>
                                {outcomeLabel(item.outcome)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                              {detailsSummary(item)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {activityCursor ? (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => void loadActivityPage(false)}
                      disabled={isActivityLoading}
                    >
                      {isActivityLoading ? "Chargement..." : "Charger plus"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreated={(user) => handleUserMutation(user)}
      />

      <UpdateRoleDialog
        open={Boolean(roleDialogUser)}
        onOpenChange={(open) => {
          if (!open) setRoleDialogUser(null);
        }}
        user={roleDialogUser}
        onUpdated={(user) => handleUserMutation(user)}
      />

      <ResetPasswordDialog
        open={Boolean(passwordDialogUser)}
        onOpenChange={(open) => {
          if (!open) setPasswordDialogUser(null);
        }}
        user={passwordDialogUser}
        onSuccess={markActivityStale}
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
              {statusDialogUser?.isActive
                ? "Desactiver cet utilisateur ?"
                : "Reactiver cet utilisateur ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialogUser?.isActive
                ? "L'utilisateur ne pourra plus se connecter tant que son compte est desactive."
                : "L'utilisateur pourra a nouveau se connecter a la plateforme."}
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
                ? "Mise a jour..."
                : statusDialogUser?.isActive
                  ? "Desactiver"
                  : "Reactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
