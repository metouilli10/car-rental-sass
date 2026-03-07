import React from "react";
import { sectionHeadings } from "../data";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="bg-indigo-600 py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
          {sectionHeadings.cta.title}
        </h2>
        <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10">
          {sectionHeadings.cta.subtitle}
        </p>
        <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-full px-8 h-14 text-lg font-bold shadow-xl">
          Get Started
        </Button>
      </div>
    </section>
  );
}
