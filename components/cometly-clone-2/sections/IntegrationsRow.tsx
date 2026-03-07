import React from "react";
import { sectionHeadings } from "../data";
import { Button } from "@/components/ui/button";

export function IntegrationsRow() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
          {sectionHeadings.integrations.title}
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-16">
          {sectionHeadings.integrations.subtitle}
        </p>

        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 mb-12">
          {/* Placeholder Icons for Integrations */}
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square flex items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-4">
              <div className={`h-full w-full rounded-lg ${
                [
                  'bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 
                  'bg-cyan-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500',
                  'bg-red-500', 'bg-teal-500', 'bg-lime-500', 'bg-sky-500',
                  'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-emerald-500'
                ][i]
              } opacity-20`} />
            </div>
          ))}
        </div>

        <Button variant="outline" className="rounded-full px-8 h-12 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
          Browse Integrations
        </Button>
      </div>
    </section>
  );
}
