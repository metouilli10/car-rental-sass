import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { sectionHeadings } from "../data";

export function FinalCTA() {
  return (
    <section className="bg-white pt-16 pb-20 md:pt-20 md:pb-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white px-6 py-20 text-center md:px-10 lg:px-14">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-slate-800 md:text-5xl">
            {sectionHeadings.cta.title}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-xl leading-relaxed text-slate-600">
            {sectionHeadings.cta.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-xl bg-[#2563eb] px-7 text-base font-semibold text-white hover:bg-[#1d4ed8]">
              <Link href="/signup">Commencer gratuitement</Link>
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-300 bg-white px-7 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voir une démo
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Essai gratuit — aucune carte bancaire requise.
          </p>
        </div>
      </div>
    </section>
  );
}
