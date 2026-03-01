"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Erreur Application</h1>
              <p className="text-gray-600">
                Une erreur inattendue s&apos;est produite. Veuillez réessayer.
              </p>
            </div>
            {error.message && (
              <div className="p-4 rounded-lg bg-gray-100 text-sm">
                <p className="font-mono text-xs break-all">{error.message}</p>
              </div>
            )}
            {error.digest && (
              <div className="p-4 rounded-lg bg-gray-100 text-sm">
                <p className="text-xs text-gray-500">Digest</p>
                <p className="font-mono text-xs break-all">{error.digest}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={reset}>Réessayer</Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
