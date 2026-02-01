import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, TrendingUp, Shield, Zap } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 grid-dots opacity-40" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
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
          <Link href="/login">
            <Button variant="outline">
              Se connecter
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="max-w-6xl mx-auto text-center space-y-12 py-20">
          {/* Main Heading */}
          <div className="space-y-6 animate-fade-in-up">
            <div className="inline-block">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Gestion intelligente</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              Gérez votre
              <span className="block mt-2 text-primary">
                agence de location
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Votre agence, sous contrôle. La plateforme complète pour les agences de location.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
            <Link href="/login">
              <Button size="lg" className="text-base px-8">
                Accéder au tableau de bord
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8">
              En savoir plus
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-12 animate-fade-in-up delay-300">
            <div className="group p-6 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Optimisez vos revenus avec des analyses en temps réel
              </p>
            </div>

            <div className="group p-6 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sécurité</h3>
              <p className="text-sm text-muted-foreground">
                Vos données et transactions protégées à 100%
              </p>
            </div>

            <div className="group p-6 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Simplicité</h3>
              <p className="text-sm text-muted-foreground">
                Interface intuitive, formation rapide, efficacité garantie
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 animate-fade-in delay-500">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-12 h-px bg-border" />
              <span>Fait avec excellence au Maroc</span>
              <div className="w-12 h-px bg-border" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
