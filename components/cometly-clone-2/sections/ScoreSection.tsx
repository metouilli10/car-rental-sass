"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const ACCORDION_ITEMS = [
  {
    id: "touchpoints",
    title: "Toutes vos réservations au même endroit",
    description:
      "Créez, modifiez et suivez chaque réservation depuis une seule interface. Consultez la disponibilité de vos véhicules en temps réel et évitez les erreurs de planification.",
    image: "/features/682e54b71245b7690d67d956_TOUCHPOINTS-1 (2)-p-2000.png",
  },
  {
    id: "revenue",
    title: "Zéro double réservation",
    description:
      "Le calendrier intelligent de Locaryx détecte automatiquement les conflits et empêche les doubles réservations. Votre planning reste toujours fiable et à jour.",
    image: "/features/682cc4dba83f447ba3b3d56f_21.png",
  },
  {
    id: "ai",
    title: "Suivi complet de votre flotte",
    description:
      "Visualisez tous vos véhicules, leur disponibilité, leur historique et leur statut en un coup d'œil. Gérez votre flotte plus efficacement sans passer d'un outil à l'autre.",
    image: "/features/682e59f81245b7690d6b722a_Chat-Bot-UI-Final-p-2000.png",
  },
  {
    id: "sync",
    title: "Clients, paiements et cautions centralisés",
    description:
      "Accédez instantanément aux informations clients, suivez les paiements et gérez les cautions directement depuis Locaryx. Tout votre business reste organisé au même endroit.",
    image: "/features/682e5861ca7159e8997cc307_match-score-p-2000.png",
  },
] as const;

export function ScoreSection() {
  const [activeId, setActiveId] = useState(ACCORDION_ITEMS[0].id);

  const activeItem = useMemo(
    () => ACCORDION_ITEMS.find((item) => item.id === activeId) ?? ACCORDION_ITEMS[0],
    [activeId]
  );

  return (
    <section className="bg-white py-14 md:py-16">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <Badge className="mb-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            Pourquoi Locaryx ?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[42px] md:leading-[1.14]">
            <span className="block">Gérez votre agence plus simplement.</span>
            <span className="block">Plus vite. Sans erreurs.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 md:text-base">
            Locaryx centralise vos réservations, vos véhicules, vos clients et vos paiements
            <span className="hidden md:inline"><br /></span>{" "}
            dans une seule plateforme. Automatisez votre gestion quotidienne et gardez
            <span className="hidden md:inline"><br /></span>{" "}
            toujours une vue claire sur votre activité.
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
