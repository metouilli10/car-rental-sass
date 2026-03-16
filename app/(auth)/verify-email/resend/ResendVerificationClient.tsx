"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ContextPanel } from "@/components/onboarding/ContextPanel";

type ResendVerificationClientProps = {
  initialEmail: string;
};

export function ResendVerificationClient({ initialEmail }: ResendVerificationClientProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) {
        setError(result.error ?? "Impossible de renvoyer l'email.");
        return;
      }

      if (result.status === "account_rejected") {
        setError("Cette demande a été refusée. Contactez le support pour plus d'informations.");
        return;
      }

      if (result.status === "email_already_verified") {
        setInfo("Votre email est déjà vérifié. Votre demande reste en attente d'approbation.");
        return;
      }

      setInfo("Si cette demande existe, un email de vérification vient d'être envoyé.");
    } catch (submitError) {
      console.error("ResendVerificationPage error:", submitError);
      setError("Impossible de renvoyer l'email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingShell
      leftPanel={
        <ContextPanel
          badgeIcon={<Mail className="h-3.5 w-3.5" />}
          badgeText="Vérification email"
          title="Renvoyer le lien de vérification"
          subtitle="Saisissez l'adresse utilisée lors de l'inscription pour recevoir un nouveau lien de confirmation."
          steps={[
            "Recevoir un nouveau lien",
            "Confirmer votre email",
            "Attendre l'approbation de votre agence",
          ]}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12 bg-neutral-50"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {info ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700">
            {info}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={isLoading} className="h-12 rounded-xl">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Renvoyer l&apos;email
          </Button>
          <Button asChild type="button" variant="outline" className="h-12 rounded-xl">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </form>
    </OnboardingShell>
  );
}
