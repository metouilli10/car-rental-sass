"use client";

import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  Car,
  Users,
  Wallet,
} from "lucide-react";

const HERO_FEATURES = [
  { icon: CalendarCheck, label: "Réservations" },
  { icon: Calendar, label: "Calendrier" },
  { icon: Car, label: "Véhicules" },
  { icon: Users, label: "Clients" },
  { icon: Wallet, label: "Paiements" },
  { icon: BarChart3, label: "Statistiques" },
];

export function Hero() {
  return (
    <section className="hero-section relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-24">
      <StarsBackground className="opacity-55" />
      <ShootingStars />

      <div
        className="hero-glow absolute left-1/2 top-[190px] -translate-x-1/2 w-[980px] h-[640px] rounded-full blur-[145px] pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1240px] text-center px-6 lg:px-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/60 bg-[#0a1435]/85 pl-2.5 pr-4 py-2 text-sm text-white shadow-[0_0_0_1px_rgba(29,78,216,0.3)_inset,0_8px_30px_rgba(37,99,235,0.2)]">
          <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold leading-none tracking-wide">
            NEW
          </span>
          <span className="font-medium">Use AI to chat with your ads data</span>
          <ArrowRight className="h-4 w-4 text-blue-200" />
        </div>

        <h1 className="hero-title mt-10">
          <span className="hero-title-line">Gérez votre agence de location</span>
          <span className="hero-title-line">depuis une seule plateforme.</span>
        </h1>

        <p className="hero-subtitle">
          Réservations, véhicules, clients, paiements et documents tout votre business au même endroit.
        </p>

        <Button className="hero-cta">Essayer gratuitement</Button>

        <div className="hero-feature-row mt-12">
          {HERO_FEATURES.map((feature) => (
            <div key={feature.label} className="hero-feature-item transition-all duration-200 hover:-translate-y-0.5">
              <feature.icon className="h-[15px] w-[15px] text-slate-200" />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>

        <div className="hero-dashboard mt-8 md:mt-10">
          <img src="/screenshots/dashboard.png" alt="Cometly dashboard preview" />
        </div>
      </div>
    </section>
  );
}
