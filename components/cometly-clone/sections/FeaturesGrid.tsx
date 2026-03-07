import React from "react";
import { features, sectionHeadings } from "../data";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function FeaturesGrid() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            {sectionHeadings.features.title}
          </h2>
          <p className="text-lg text-slate-600">
            {sectionHeadings.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  {feature.isNew && (
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="flex items-center text-indigo-600 font-medium text-sm group/link cursor-pointer">
                  Learn more 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
