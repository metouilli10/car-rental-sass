import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ANALYTICS_IMAGES = [
  {
    src: "/analytics/682e538239aebdbdbcb40d2f_Leads & Purchases By Source - Final - 2-p-2000.png",
    alt: "Leads and purchases by source report",
  },
  {
    src: "/analytics/682e4c4d544585a6af7ca05a_Ad Metrics - Chart-p-2000.png",
    alt: "Ad metrics chart report",
  },
  {
    src: "/analytics/682e53cc4c58b513672f73d3_CREATIVE-1-p-2000.png",
    alt: "Creative report table",
  },
  {
    src: "/analytics/682e4faa825c8f0aef8481fd_Start Trial Metrics-p-2000.png",
    alt: "Sign up and trial metrics chart",
  },
];

export function AnalyticsSection() {
  return (
    <section className="bg-white py-24 lg:py-28">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            Tableaux de bord puissants
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.12]">
            Gardez une vue claire sur toute votre agence
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-slate-600">
            Suivez vos réservations, vos véhicules, vos revenus et vos clients depuis un tableau de bord simple et puissant.
            <span className="hidden md:inline"><br /></span>{" "}
            Prenez de meilleures décisions grâce à des données claires.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Découvrir les fonctionnalités
            </Button>
            <Button className="h-11 rounded-xl bg-[#2563eb] px-6 text-base font-semibold text-white hover:bg-[#1d4ed8]">
              Commencer
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-7 md:grid-cols-2">
          {ANALYTICS_IMAGES.map((image) => (
            <div
              key={image.src}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={1400}
                height={900}
                className="h-auto w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
