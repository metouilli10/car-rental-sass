import React from "react";
import { howItWorksSteps, sectionHeadings } from "../data";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  return (
    <section className="bg-slate-900 py-24 text-white">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              {sectionHeadings.howItWorks.title}
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-lg">
              {sectionHeadings.howItWorks.subtitle}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Personalized onboarding and support
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Hands-on help connecting your stack
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Works with any tool in your tech stack
              </div>
            </div>
            <Button className="mt-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 h-12 text-base font-semibold">
              Get Started
            </Button>
          </div>

          <div className="space-y-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors">
                    <step.icon className="h-6 w-6" />
                  </div>
                  {index !== howItWorksSteps.length - 1 && (
                    <div className="w-px h-full bg-slate-800 my-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
