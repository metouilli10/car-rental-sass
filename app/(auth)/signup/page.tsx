"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, CheckCircle2, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOwnerAccount } from "@/lib/actions/auth";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ContextPanel } from "@/components/onboarding/ContextPanel";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await registerOwnerAccount(form);
      if (result?.error) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Compte créé, mais connexion automatique impossible.");
        return;
      }

      router.push("/setup");
      router.refresh();
    } catch (signupError) {
      console.error("SignupPage error:", signupError);
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
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
              Cet email servira d&apos;identifiant de connexion.
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
      </div>
    </OnboardingShell>
  );
}
