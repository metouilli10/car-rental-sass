"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, Shield, Check, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-blue-50/30 relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-48 -right-48 w-96 h-96 bg-gradient-to-br from-[#2c2cf2]/20 via-[#2c2cf2]/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-[#f5a938]/15 via-[#f5a938]/5 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#2c2cf2]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0/0.03)_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        <div className="hidden lg:block space-y-12 animate-fade-in-up">
          <div className="space-y-6">
            <div className="relative w-48 h-16">
              <Image
                src="/assets/locaryx-logo-dark.png"
                alt="Locaryx"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <div className="h-1 w-16 bg-gradient-to-r from-[#2c2cf2] to-[#f5a938] rounded-full" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight leading-[1.1]">
              Votre agence,
              <br />
              <span className="text-[#f5a938]">sous contrôle</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Gérez votre flotte, vos réservations et vos paiements en toute simplicité.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#2c2cf2]/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#2c2cf2]" />
              </div>
              <span className="text-foreground/80">Plateforme sécurisée SSL 256-bit</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#2c2cf2]/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#2c2cf2]" />
              </div>
              <span className="text-foreground/80">Données hébergées au Maroc</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#2c2cf2]/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#2c2cf2]" />
              </div>
              <span className="text-foreground/80">Support disponible 7j/7</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#2c2cf2]">100+</div>
              <div className="text-sm text-muted-foreground">Agences partenaires</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#2c2cf2]">5000+</div>
              <div className="text-sm text-muted-foreground">Véhicules gérés</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#2c2cf2]/20 via-transparent to-[#f5a938]/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/5 rounded-2xl p-8 md:p-10 space-y-8 animate-fade-in-up delay-200">
              <div className="lg:hidden flex items-center justify-center mb-2">
                <div className="relative w-40 h-12">
                  <Image
                    src="/assets/locaryx-logo-dark.png"
                    alt="Locaryx"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <div className="space-y-3 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2c2cf2]/8 border border-[#2c2cf2]/20 rounded-full text-xs font-medium text-[#2c2cf2]">
                  <Sparkles className="w-3.5 h-3.5" />
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
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-[#2c2cf2]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 h-12 border-border/50 focus:border-[#2c2cf2] focus:ring-[#2c2cf2]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-[#2c2cf2]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-10 h-12 border-border/50 focus:border-[#2c2cf2] focus:ring-[#2c2cf2]/20 transition-all"
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
                          className="font-medium text-[#2c2cf2] hover:text-[#2c2cf2]/80"
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
                      className="w-4 h-4 rounded border-border/50 text-[#2c2cf2] focus:ring-[#2c2cf2]/20 transition-colors"
                    />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      Se souvenir
                    </span>
                  </label>
                  <Link
                    href="#"
                    className="text-[#2c2cf2] hover:text-[#2c2cf2]/80 font-medium transition-colors"
                  >
                    Mot de passe oublié?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#2c2cf2] hover:bg-[#2c2cf2]/90 text-white font-medium rounded-xl shadow-lg shadow-[#2c2cf2]/20 transition-all hover:shadow-xl hover:shadow-[#2c2cf2]/25 active:scale-[0.99]"
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
                  <Shield className="w-3.5 h-3.5" />
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
