"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const ACCORDION_ITEMS = [
  {
    id: "touchpoints",
    title: "Sans conflits de réservation",
    description:
      "Chaque réservation est synchronisée pour éviter les doubles locations et les erreurs.",
    image: "/assets/conflits de reservation.png",
  },
  {
    id: "revenue",
    title: "Visibilité complète de votre parc",
    description:
      "Voyez immédiatement quels véhicules sont disponibles, loués ou en maintenance sans passer d'un outil à l'autre.",
    image: "/assets/parc.png",
  },
  {
    id: "ai",
    title: "Tous vos clients au même endroit",
    description:
      "Contrats, documents, historique de location et informations clients sont centralisés pour retrouver chaque dossier sans friction.",
    image: "/assets/clients.png",
  },
  {
    id: "sync",
    title: "Paiements et cautions sous contrôle",
    description:
      "Suivez les paiements et les cautions sans erreurs ni oublis pour savoir ce qui est encaissé, dû ou à restituer.",
    image: "/assets/caution.png",
  },
] as const;

export function ScoreSection() {
  const [activeId, setActiveId] = useState<(typeof ACCORDION_ITEMS)[number]["id"]>(
    ACCORDION_ITEMS[0].id
  );

  const activeItem = useMemo(
    () => ACCORDION_ITEMS.find((item) => item.id === activeId) ?? ACCORDION_ITEMS[0],
    [activeId]
  );

  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <Badge className="mb-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            Pourquoi Locaryx ?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[42px] md:leading-[1.14]">
            <span className="block">Gardez votre agence</span>
            <span className="block">sous contrôle chaque jour.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 md:text-base">
            Moins d&apos;erreurs, plus de visibilité et moins de temps perdu sur l&apos;administratif.
            <span className="hidden md:inline"><br /></span>{" "}
            Locaryx organise les opérations essentielles de votre agence dans un seul outil clair.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-[1fr_1.02fr] lg:items-start lg:gap-8">
          <div className="relative lg:pt-16">
            <div className="absolute left-0 top-0 h-full w-px bg-slate-200" />
            <div className="space-y-1">
              {ACCORDION_ITEMS.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className="group relative block w-full rounded-xl px-8 py-5 text-left transition-colors"
                  >
                    <span
                      className={`absolute left-0 top-4 h-[calc(100%-2rem)] w-0.5 rounded-full transition-colors ${
                        isActive ? "bg-blue-600" : "bg-transparent"
                      }`}
                    />
                    <h3 className={`text-[20px] font-semibold leading-tight md:text-[22px] ${isActive ? "text-slate-900" : "text-slate-800"}`}>
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 md:text-[15px]">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:pt-4">
            <Image
              src={activeItem.image}
              alt={activeItem.title}
              width={1600}
              height={900}
              className="h-auto w-full transition-all duration-500"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
