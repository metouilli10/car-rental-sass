"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, Shield, BadgeCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isVerificationError = error === "Email non verifie";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "Compte désactivé"
            ? "Compte désactivé"
            : result.error === "Email non verifie"
              ? "Email non verifie"
              : result.error === "En attente d'approbation"
                ? "Votre email est vérifié, mais votre agence attend encore notre approbation."
                : result.error === "Compte refuse"
                  ? "Cette demande a été refusée. Contactez le support."
                  : "Email ou mot de passe incorrect",
        );
      } else {
        router.push("/post-login");
        router.refresh();
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="public-shell relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-80 w-80 rounded-full bg-primary/[0.09] blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      <div className="absolute inset-0 grid-dots opacity-[0.24]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div className="hidden lg:block space-y-10">
          <div className="space-y-5">
            <div className="relative w-48 h-16">
              <Image
                src="/assets/locaryx logo new.png"
                alt="Locaryx"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="h-1 w-16 rounded-full bg-[hsl(var(--public-primary))]" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Shield className="h-3.5 w-3.5" />
              Espace de gestion Locaryx
            </div>
            <h1 className="text-5xl font-semibold tracking-tight leading-[1.05] text-[hsl(var(--public-ink))]">
              Votre agence,
              <br />
              <span className="text-primary">sous contrôle</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-slate-600">
              Retrouvez votre tableau de bord, vos opérations et vos demandes en cours dans une
              interface pensée pour aller vite sans perdre en rigueur.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <span className="text-foreground/80">Accès protégé et validation propriétaire</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <span className="text-foreground/80">Suivi clair de la flotte, des réservations et des paiements</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <span className="text-foreground/80">Expérience optimisée pour ordinateur, mobile et app installée</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/[0.08] blur-2xl opacity-80" />

            <div className="relative space-y-8 rounded-[28px] border border-white/70 bg-white/88 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
              <div className="lg:hidden flex items-center justify-center mb-2">
                <div className="relative w-40 h-12">
                  <Image
                    src="/assets/locaryx logo new.png"
                    alt="Locaryx"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <div className="space-y-3 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-medium text-primary">
                  <Shield className="w-3.5 h-3.5" />
                  Espace de gestion
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Connexion</h2>
                <p className="text-muted-foreground text-sm">
                  Accédez à votre tableau de bord
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 border-border/60 bg-white pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 border-border/60 bg-white pl-10"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                    <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                    {isVerificationError ? (
                      <p className="mt-2 text-center text-sm">
                        <Link
                          href={`/verify-email/resend?email=${encodeURIComponent(email.trim())}`}
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          Renvoyer l&apos;email de vérification
                        </Link>
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/20 transition-colors"
                    />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      Se souvenir
                    </span>
                  </label>
                  <span className="text-xs text-muted-foreground">Accès réservé aux comptes validés</span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl"
                >
                  {isLoading ? (
                    "Connexion..."
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary/70" />
                  <span>Vos données sont protégées et chiffrées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
