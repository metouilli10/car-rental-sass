"use client";

import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ManagedUser } from "@/components/users/users-page";

type UserActionsMenuProps = {
  user: ManagedUser;
  isSelf: boolean;
  onChangeRole: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
};

export function UserActionsMenu({
  user,
  isSelf,
  onChangeRole,
  onResetPassword,
  onToggleStatus,
}: UserActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions utilisateur">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onChangeRole(user)}>Modifier rôle</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user)}>Réinitialiser mot de passe</DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onToggleStatus(user)}
          disabled={isSelf}
          className={user.isActive ? "text-destructive focus:text-destructive" : undefined}
        >
          {user.isActive ? "Désactiver" : "Réactiver"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
