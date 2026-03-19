"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-bold">Erreur de l’application</h1>
              <p className="text-gray-600">
                Une erreur inattendue s&apos;est produite. Veuillez réessayer.
              </p>
            </div>
            {error.message ? (
              <div className="rounded-lg bg-gray-100 p-4 text-sm">
                <p className="break-all font-mono text-xs">{error.message}</p>
              </div>
            ) : null}
            {error.digest ? (
              <div className="rounded-lg bg-gray-100 p-4 text-sm">
                <p className="text-xs text-gray-500">Identifiant technique</p>
                <p className="break-all font-mono text-xs">{error.digest}</p>
              </div>
            ) : null}
            <div className="flex justify-center gap-3">
              <Button onClick={reset}>Réessayer</Button>
              <Button onClick={() => window.location.assign("/")} variant="outline">
                Retour à l&apos;accueil
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
