"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-2 rounded-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Quelque chose s&apos;est mal passé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Une erreur inattendue s&apos;est produite lors du chargement de cette page.
          </p>
          {error.message && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-mono text-xs break-all">{error.message}</p>
            </div>
          )}
          {error.digest && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-xs text-muted-foreground">Identifiant technique</p>
              <p className="font-mono text-xs break-all">{error.digest}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="rounded-lg"
            >
              Réessayer
            </Button>
            <Button
              onClick={() => window.location.href = "/dashboard"}
              variant="outline"
              className="rounded-lg"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
