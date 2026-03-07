import React from "react";
import { Button } from "@/components/ui/button";
import { heroData } from "../data";
import { PlayCircle, ArrowRight } from "lucide-react";
import { ProductPreview } from "./ProductPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-32 pb-20 lg:pt-40 lg:pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="container relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.1]">
            Smarter Marketing Attribution. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Use AI to Turn Data Into Action.
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400 max-w-2xl mx-auto">
            {heroData.subheading}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-indigo-500/20">
              {heroData.ctaPrimary}
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 bg-transparent text-white hover:bg-white/5 hover:text-white rounded-full px-8 h-12 text-base font-semibold">
              <PlayCircle className="mr-2 h-5 w-5 text-indigo-400" />
              {heroData.ctaSecondary}
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-950 bg-slate-800" />
              ))}
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-medium text-slate-400">4.9/5 on G2 & Capterra</span>
          </div>
        </div>

        {/* Product Preview Mockup */}
        <div className="mt-16 lg:mt-24 relative mx-auto max-w-6xl">
           <ProductPreview />
        </div>
      </div>
    </section>
  );
}
