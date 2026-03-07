import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ScoreSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <Badge variant="secondary" className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-medium">
              Better Attribution
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              Smarter AI. Stronger Results.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Track every touchpoint, enrich every conversion, and let Cometly’s attribution engine power AI that works for you — delivering insights and recommendations to help you scale faster.
            </p>
            
            <ul className="space-y-5">
              {[
                "Capture Every Touchpoint: From ad clicks to CRM events.",
                "Know What’s Really Driving Revenue: Go beyond surface-level metrics.",
                "Get Recommendations From AI: Identify high-performing ads.",
                "Feed Ad Platform AI Better Data: Improve targeting and ROI."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-indigo-600 shrink-0" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Content - Match Score Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 blur-2xl" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Attribution Match Rate</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-bold text-slate-900">93%</span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+24% vs Pixel</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: "Facebook Ads", value: 92, color: "bg-blue-600" },
                  { label: "Google Ads", value: 96, color: "bg-red-500" },
                  { label: "TikTok Ads", value: 88, color: "bg-black" },
                  { label: "Email", value: 98, color: "bg-yellow-500" },
                  { label: "Organic", value: 100, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="text-slate-900">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color}`} 
                        style={{ width: `${item.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>Last 30 Days</span>
                <span className="flex items-center gap-1 text-indigo-600 font-medium cursor-pointer hover:underline">
                  View Report <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
