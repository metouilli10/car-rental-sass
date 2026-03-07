import React from "react";
import { heroData } from "../data";

export function LogosRow() {
  return (
    <section className="bg-white py-12 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 mb-8">
          {heroData.trustText}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Placeholder Logos - Using text for now as requested, styled to look like logos */}
          {["ClickFunnels", "Trainual", "Instantly", "Venly", "SkinnyFit", "Arcads"].map((logo) => (
            <div key={logo} className="flex items-center gap-2 group cursor-default">
              <div className="h-8 w-8 rounded bg-slate-200 group-hover:bg-indigo-100 transition-colors" />
              <span className="text-xl font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{logo}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
