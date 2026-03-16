"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOwnerAccount } from "@/lib/actions/auth";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ContextPanel } from "@/components/onboarding/ContextPanel";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "verification_sent">("idle");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const result = await registerOwnerAccount(form);
      if (result?.status !== "verification_sent") {
        setError(result.error);
        return;
      }

      setSubmittedEmail(form.email.trim().toLowerCase());
      setStatus("verification_sent");
    } catch (signupError) {
      console.error("SignupPage error:", signupError);
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;

    setIsResending(true);
    setError("");
    setInfo("");

    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: submittedEmail }),
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
        setInfo("Votre email est déjà vérifié. Votre demande est en attente d'approbation.");
        return;
      }

      setInfo("Un nouvel email de vérification a été envoyé.");
    } catch (resendError) {
      console.error("SignupPage resend error:", resendError);
      setError("Impossible de renvoyer l'email de vérification.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <OnboardingShell
      leftPanel={
        <ContextPanel
          badgeIcon={<Rocket className="h-3.5 w-3.5" />}
          badgeText="Nouveau compte"
          title="Créez votre agence"
          subtitle="Commencez avec votre compte propriétaire, puis configurez votre agence en moins de 2 minutes."
          steps={[
            "Créer le compte propriétaire",
            "Configurer votre agence",
            "Accéder au tableau de bord",
          ]}
          tip={{
            icon: <CheckCircle2 className="h-4 w-4" />,
            title: "Mise en route rapide",
            description:
              "Aucun document requis pour démarrer. Nom, email et mot de passe suffisent.",
          }}
        />
      }
    >
      <div className="space-y-6">
        {/* Section header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Informations du propriétaire
          </p>
          <p className="text-sm text-slate-600">
            Créez votre accès sécurisé. Vous configurerez ensuite le profil de
            l&apos;agence.
          </p>
        </div>

        {status === "verification_sent" ? (
          <div className="space-y-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-900">
                  Vérification requise
                </p>
                <p className="text-sm text-emerald-800">
                  Un email de vérification a été envoyé à <strong>{submittedEmail}</strong>.
                  Vérifiez votre adresse, puis votre demande restera en attente d&apos;approbation
                  avant l&apos;accès à l&apos;application.
                </p>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {info ? (
              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 text-sm text-emerald-800">
                {info}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isResending}
                onClick={handleResend}
                className="h-12 rounded-xl"
              >
                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Renvoyer l&apos;email
              </Button>
              <Button asChild className="h-12 rounded-xl">
                <Link href={`/verify-email/resend?email=${encodeURIComponent(submittedEmail)}`}>
                  Changer d&apos;email
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Déjà vérifié ?{" "}
              <Link href="/login" className="font-semibold text-[#2c2cf2]">
                Retour à la connexion
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Nom complet</Label>
              <Input
                id="signup-name"
                className="h-12 bg-neutral-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2c2cf2]/30"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                className="h-12 bg-neutral-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2c2cf2]/30"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Cet email servira d&apos;identifiant de connexion et devra être vérifié.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Mot de passe</Label>
                <Input
                  id="signup-password"
                  type="password"
                  className="h-12 bg-neutral-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2c2cf2]/30"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirmer</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  className="h-12 bg-neutral-50 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2c2cf2]/30"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link href="/login" className="font-semibold text-[#2c2cf2]">
                  Se connecter
                </Link>
              </p>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl shadow-sm transition-all hover:shadow-md sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Créer mon compte
              </Button>
            </div>
          </form>
        )}
      </div>
    </OnboardingShell>
  );
}
