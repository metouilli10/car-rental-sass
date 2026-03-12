"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { heroData } from "../data";

const CARD_POSITIONS = [
  "hero-floating-card hero-floating-card-left",
  "hero-floating-card hero-floating-card-top",
  "hero-floating-card hero-floating-card-right",
];

export function Hero() {
  return (
    <section className="hero-section relative overflow-hidden pt-28 pb-14 md:pt-32 md:pb-16">
      <Particles
        className="absolute inset-0 z-[1] opacity-45"
        quantity={70}
        ease={90}
        staticity={45}
        size={0.8}
        color="#94a3b8"
        vx={0.02}
        vy={0.01}
        refresh
      />

      <div className="relative z-10 mx-auto max-w-[1240px] px-6 text-center lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <p className="hero-eyebrow">{heroData.eyebrow}</p>

          <h1 className="hero-title mt-6">
            <span className="block md:whitespace-nowrap">Gérez toute votre agence de location</span>
            <span className="block md:whitespace-nowrap">depuis un seul tableau de bord.</span>
          </h1>

          <p className="hero-subtitle">{heroData.subheading}</p>

          <div className="hero-cta-stack">
            <div className="hero-cta-row">
              <Button asChild className="hero-cta-primary">
                <Link href="/signup">{heroData.ctaPrimary}</Link>
              </Button>
              <div className="hero-cta-subrow">
                <span>ou</span>
                <Link href="#" className="hero-cta-secondary">
                  {heroData.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-proof-row items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
            <p>{heroData.reviewText}</p>
          </div>
        </div>

        <div className="hero-dashboard-wrap">
          <div className="hero-dashboard">
            <Image
              src="/screenshots/dashboard.png"
              alt="Locaryx dashboard preview"
              width={1120}
              height={680}
              priority
              className="hero-dashboard-image"
            />

            {heroData.stats.map((stat, index) => (
              <article
                key={stat.title}
                className={`${CARD_POSITIONS[index]} hero-floating-card-${stat.tone}`}
              >
                <div className="hero-floating-card-label">{stat.title}</div>
                <div className="hero-floating-card-value">{stat.value}</div>
                <div className="hero-floating-card-detail">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{stat.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
