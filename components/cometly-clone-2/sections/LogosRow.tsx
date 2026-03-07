import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { heroData } from "../data";

const TRUSTED_LOGOS = [
  { name: "Avis", src: "/trusted companies/Avis-Logo.png", width: 170, height: 56 },
  { name: "Budget", src: "/trusted companies/Budget-Logo.png", width: 180, height: 54 },
  { name: "Enterprise", src: "/trusted companies/Enterprise-Rent-A-Car-Logo.png", width: 218, height: 50 },
  { name: "Hertz", src: "/trusted companies/Hertz-logo.png", width: 156, height: 56 },
  { name: "National", src: "/trusted companies/National-Car-Rental-Logo.png", width: 208, height: 52 },
  { name: "Ronart", src: "/trusted companies/Ronart-Logo.png", width: 170, height: 56 },
];

export function LogosRow() {
  return (
    <section className="bg-white py-12 md:py-16 border-b border-slate-100">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 mb-10">
          {heroData.trustText}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10 opacity-75 grayscale transition-all duration-500 hover:grayscale-0">
          {TRUSTED_LOGOS.map((logo) => (
            <div key={logo.name} className="flex h-14 items-center justify-center">
              <Image
                src={logo.src}
                alt={`${logo.name} logo`}
                width={logo.width}
                height={logo.height}
                className="h-auto w-auto max-h-12 object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-5xl rounded-3xl bg-slate-50 px-6 py-10 md:px-12 md:py-12">
          <div className="mb-7 flex items-center justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <blockquote className="mx-auto max-w-4xl text-center text-[22px] font-medium leading-[1.55] text-slate-900 md:text-[24px]">
            &ldquo;Cometly gave us confidence in our data. We used to struggle with attribution across platforms, especially with iOS
            tracking limitations. Now we know exactly what&rsquo;s working and we optimize in real time with smarter budget decisions.&rdquo;
          </blockquote>

          <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-5 border-t border-slate-200 pt-7 md:flex-row md:gap-8 md:pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                JP
              </div>
              <div className="text-left">
                <div className="text-[28px] font-semibold leading-none text-slate-900 md:text-[30px]">John Parkes</div>
                <div className="mt-1 text-sm text-slate-600">CMO at ClickFunnels</div>
              </div>
            </div>
            <div className="hidden h-11 w-px bg-slate-200 md:block" />
            <div className="text-[36px] font-bold tracking-tight text-slate-900 md:text-[38px]">ClickFunnels</div>
          </div>
        </div>
      </div>
    </section>
  );
}
