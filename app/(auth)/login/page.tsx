"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Lock, Mail, TrendingUp, Car } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        setError("Email ou mot de passe incorrect");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 grid-dots-dark opacity-20" />

        <div className="relative z-10 flex flex-col items-start justify-center px-20 text-background">
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center mb-8">
              <div className="relative w-64 h-20 overflow-hidden">
                <Image 
                  src="/assets/locapro-logo.png" 
                  alt="Locapro Logo" 
                  fill
                  className="object-contain object-left brightness-0 invert"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Bienvenue sur
                <br />
                votre plateforme
              </h1>
              <p className="text-lg text-background/80 max-w-md">
                Votre agence, sous contrôle.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">100+</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-background/70">Agences partenaires</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">5000+</span>
                  <Car className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-background/70">Véhicules gérés</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up delay-200">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center mb-8">
            <div className="relative w-48 h-14 overflow-hidden">
              <Image 
                src="/assets/locapro-logo.png" 
                alt="Locapro Logo" 
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Connexion</h2>
            <p className="text-muted-foreground">
              Accédez à votre espace de gestion
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-input" />
                <span className="text-muted-foreground">Se souvenir de moi</span>
              </label>
              <Link href="#" className="text-primary hover:underline">
                Mot de passe oublié?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full group"
              disabled={isLoading}
            >
              {isLoading ? (
                "Connexion en cours..."
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte?{" "}
              <Link href="#" className="text-primary hover:underline font-medium">
                Contactez-nous
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <div className="w-8 h-px bg-border" />
              <span>Sécurisé et confidentiel</span>
              <div className="w-8 h-px bg-border" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
