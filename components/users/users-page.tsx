"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import {
  countPermissionOverrides,
  getPermissionGroups,
  type PermissionKey,
  type UserPermissions,
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
import { Switch } from "@/components/ui/switch";
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
import { useI18n } from "@/components/i18n/i18n-context";

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toPermissionsSignature(user: ManagedUser | null): string {
  return JSON.stringify(user?.permissions ?? user?.effectivePermissions ?? {});
}

function clonePermissions(user: ManagedUser | null): UserPermissions | Record<string, boolean> {
  if (user?.permissions) {
    return { ...user.permissions };
  }

  if (user?.effectivePermissions) {
    return { ...user.effectivePermissions };
  }

  return {};
}

export function UsersPage({ initialUsers, currentUserId }: UsersPageProps) {
  const { t } = useI18n();
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [activeTab, setActiveTab] = useState("users");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [roleDialogUser, setRoleDialogUser] = useState<ManagedUser | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<ManagedUser | null>(null);
  const [statusDialogUser, setStatusDialogUser] = useState<ManagedUser | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, boolean>>({});
  const [baselinePermissionsSignature, setBaselinePermissionsSignature] = useState("{}");
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
    () => JSON.stringify(draftPermissions) !== baselinePermissionsSignature,
    [baselinePermissionsSignature, draftPermissions],
  );

  useEffect(() => {
    if (!selectedUserId && (editableUsers[0] ?? sortedUsers[0])) {
      setSelectedUserId((editableUsers[0] ?? sortedUsers[0]).id);
    }
  }, [editableUsers, selectedUserId, sortedUsers]);

  useEffect(() => {
    if (!selectedUser) {
      setDraftPermissions({});
      setBaselinePermissionsSignature("{}");
      return;
    }

    const nextSignature = toPermissionsSignature(selectedUser);
    if (!isPermissionSaving && !isPermissionsDirty && nextSignature !== baselinePermissionsSignature) {
      setDraftPermissions(clonePermissions(selectedUser));
      setBaselinePermissionsSignature(nextSignature);
    }
  }, [
    baselinePermissionsSignature,
    isPermissionSaving,
    isPermissionsDirty,
    selectedUser,
  ]);

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

  const loadActivityPage = useCallback(async (reset = false) => {
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
  }, [activityActionFilter, activityCursor, activityUserFilter]);

  useEffect(() => {
    if (activeTab !== "activity") {
      return;
    }

    void loadActivityPage(true);
  }, [activeTab, activityActionFilter, activityReloadToken, activityUserFilter, loadActivityPage]);

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
    setDraftPermissions(clonePermissions(nextUser));
    setBaselinePermissionsSignature(toPermissionsSignature(nextUser));
  };

  const handlePermissionToggle = (key: PermissionKey, checked: boolean) => {
    setDraftPermissions((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleResetPermissionDraft = () => {
    setDraftPermissions(clonePermissions(selectedUser));
    setBaselinePermissionsSignature(toPermissionsSignature(selectedUser));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || selectedUser.role === "OWNER") {
      return;
    }

    setIsPermissionSaving(true);
    try {
      const permissions = { ...draftPermissions };

      for (const group of getPermissionGroups()) {
        for (const item of group.items) {
          permissions[item.key] = Boolean(draftPermissions[item.key]);
        }
      }

      const response = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      const payload = (await response.json()) as
        | { user: ManagedUser }
        | { error: string };

      if (!response.ok || !("user" in payload)) {
        toast.error("error" in payload ? payload.error : "Enregistrement impossible");
        return;
      }

      handleUserMutation(payload.user);
      setDraftPermissions(clonePermissions(payload.user));
      setBaselinePermissionsSignature(toPermissionsSignature(payload.user));
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("users.management.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("users.management.pageSubtitle")}
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
          {t("users.management.addUser")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="users" className="px-2 text-xs sm:text-sm">
            {t("users.management.tabLabel")}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="px-2 text-xs sm:text-sm">
            {t("users.management.tabPermissions")}
          </TabsTrigger>
          <TabsTrigger value="activity" className="px-2 text-xs sm:text-sm">
            {t("users.management.tabActivity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
            <div className="space-y-3 p-4 md:hidden">
              {sortedUsers.map((user) => {
                const status = getUserStatus(user);
                const isSelf = user.id === currentUserId;
                const overrideCount = countPermissionOverrides(user.permissions, user.role);

                return (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{user.name}</p>
                          {isSelf ? (
                            <Badge variant="outline" className="text-[10px]">
                              Moi
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <UserActionsMenu
                        user={user}
                        isSelf={isSelf}
                        onChangeRole={setRoleDialogUser}
                        onResetPassword={setPasswordDialogUser}
                        onToggleStatus={setStatusDialogUser}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                      <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
                      <Badge variant={overrideCount > 0 ? "secondary" : "outline"}>
                        {overrideCount} dérogation{overrideCount > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="mt-3 grid gap-2 rounded-xl bg-muted/20 p-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Dernière connexion</span>
                        <span className="text-right text-foreground">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Jamais connecté"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Créé le</span>
                        <span className="text-right text-foreground">
                          {formatDateTime(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
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
                    const overrideCount = countPermissionOverrides(user.permissions, user.role);

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
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-0">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("users.management.sectionHeading")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("users.management.permissionsSectionHint")}
                </p>
              </div>
              <div className="px-4 py-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedUsers.map((user) => {
                    const isSelected = selectedUser?.id === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user.id)}
                        className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-border/60 bg-white hover:border-primary/30 hover:bg-muted/10"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                            <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {selectedUser ? `Permissions de ${selectedUser.name}` : "Permissions"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Activez ou retirez les accès utilisateur permission par permission.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={handleResetPermissionDraft}
                    disabled={!selectedUser || !isPermissionsDirty || isPermissionSaving}
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
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
                  <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                    Le propriétaire conserve toutes les permissions. Aucune modification n&apos;est disponible pour ce compte.
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 px-4 py-4 xl:grid-cols-2">
                  {getPermissionGroups().map((group) => (
                    <section key={group.key} className="overflow-hidden rounded-2xl border border-border/60">
                      <div className="border-b border-border/60 bg-muted/10 px-4 py-3">
                        <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                      </div>
                      <div className="divide-y divide-border/60">
                        {group.items.map((item) => {
                          const isEnabled = Boolean(draftPermissions[item.key]);

                          return (
                            <div
                              key={item.key}
                              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{item.label}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:justify-end">
                                <span className="text-xs text-muted-foreground">
                                  {isEnabled ? "Autorisé" : "Refusé"}
                                </span>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(item.key, checked)
                                  }
                                  aria-label={item.label}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
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
                className="w-full sm:w-auto"
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
                <div className="space-y-3 md:hidden">
                  {activityItems.map((item) => {
                    const targetUser =
                      sortedUsers.find((user) => user.id === item.target.entityId) ?? null;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border/60 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={outcomeBadgeVariant(item.outcome)}>
                            {outcomeLabel(item.outcome)}
                          </Badge>
                          <Badge variant="outline">{actionLabel(item.action)}</Badge>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-muted-foreground">Date</span>
                            <span className="text-right text-foreground">
                              {formatDateTime(item.occurredAt)}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-muted-foreground">Acteur</span>
                            <div className="text-right">
                              <p className="text-foreground">{item.actor.email ?? "Système"}</p>
                              <p className="text-muted-foreground">{item.actor.role ?? "n/a"}</p>
                            </div>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-muted-foreground">Cible</span>
                            <span className="text-right text-foreground">
                              {targetUser?.name ?? item.target.entityId}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 rounded-lg bg-muted/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Détails
                          </p>
                          <p className="mt-1 text-xs leading-5 text-foreground">
                            {detailsSummary(item)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
                  <div className="overflow-x-auto">
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
