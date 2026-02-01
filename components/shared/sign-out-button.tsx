"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/login" })}
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Déconnexion
    </Button>
  );
}
