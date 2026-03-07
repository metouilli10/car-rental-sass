import React from "react";
import { sectionHeadings } from "../data";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AnalyticsSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              {sectionHeadings.analytics.title}
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              {sectionHeadings.analytics.subtitle}
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 h-12 text-base font-semibold">
              Get Started
            </Button>
          </div>
          <div className="hidden lg:block">
            {/* Optional: Additional text or empty space */}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Leads & Purchases Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Leads & Purchases By Source</h3>
              <div className="text-sm text-slate-500">Last 30 Days</div>
            </div>
            <div className="space-y-4">
              {[
                { source: "Facebook Ads", leads: 1245, purchases: 432, value: "$45,230" },
                { source: "Google Ads", leads: 982, purchases: 312, value: "$32,150" },
                { source: "Email Marketing", leads: 856, purchases: 289, value: "$28,900" },
                { source: "Organic Search", leads: 654, purchases: 198, value: "$19,800" },
                { source: "Direct Traffic", leads: 432, purchases: 145, value: "$14,500" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3 w-1/3">
                    <div className={`h-2 w-2 rounded-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-cyan-500'}`} />
                    <span className="font-medium text-slate-700">{row.source}</span>
                  </div>
                  <div className="text-slate-500">{row.leads} Leads</div>
                  <div className="text-slate-500">{row.purchases} Sales</div>
                  <div className="font-semibold text-slate-900 text-right w-20">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Chart Visual */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-slate-900">Revenue Growth</h3>
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-xs text-slate-500">Attributed</span>
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span className="text-xs text-slate-500">Unattributed</span>
              </div>
            </div>
            <div className="flex-1 flex items-end justify-between gap-2 h-64 px-2">
              {[35, 45, 40, 55, 65, 60, 75, 85, 80, 95, 90, 100].map((h, i) => (
                <div key={i} className="w-full bg-indigo-50 rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-indigo-500 rounded-t-sm transition-all duration-1000 group-hover:bg-indigo-600"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-slate-400">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
