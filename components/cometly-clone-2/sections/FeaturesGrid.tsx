import React from "react";
import { features } from "../data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FeaturesGrid() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16 xl:gap-20">
          <div>
            <Badge className="mb-5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
              Fonctionnalités
            </Badge>
            <h2 className="max-w-[380px] text-[28px] font-semibold tracking-tight text-slate-900 lg:text-[34px] lg:leading-[1.18]">
              <span className="block">Gérez toute votre agence</span>
              <span className="block">depuis une seule plateforme</span>
            </h2>
            <p className="mt-4 max-w-[360px] text-[16px] leading-relaxed text-slate-600">
              LocaPro centralise les réservations, les véhicules, les clients et les paiements dans un seul outil. Simplifiez votre gestion quotidienne et gagnez du temps sur chaque opération.
            </p>
            <Button className="mt-6 h-11 rounded-lg bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-700">
              Commencer
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-y-14 lg:col-span-2 lg:gap-x-12 lg:gap-y-12">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <feature.icon className="h-5 w-5 text-slate-700" />
                <div className="mt-4 transition-transform duration-200 group-hover:translate-x-1">
                  <h3 className="text-[22px] font-semibold leading-tight text-slate-900 lg:text-[24px]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[300px] text-[16px] leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                  <a
                    href="#"
                    className="mt-4 inline-flex items-center text-[20px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
                  >
                    {feature.linkLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
