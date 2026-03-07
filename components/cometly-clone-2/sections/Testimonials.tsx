import React from "react";
import Image from "next/image";
import { testimonials, sectionHeadings } from "../data";
import { Star } from "lucide-react";

const TRUSTED_COMPANY_LOGOS = [
  { name: "Avis", src: "/trusted companies/Avis-Logo.png", width: 110, height: 36 },
  { name: "Budget", src: "/trusted companies/Budget-Logo.png", width: 110, height: 36 },
  { name: "Enterprise", src: "/trusted companies/Enterprise-Rent-A-Car-Logo.png", width: 132, height: 32 },
  { name: "Hertz", src: "/trusted companies/Hertz-logo.png", width: 110, height: 36 },
  { name: "National", src: "/trusted companies/National-Car-Rental-Logo.png", width: 128, height: 34 },
  { name: "Ronart", src: "/trusted companies/Ronart-Logo.png", width: 110, height: 36 },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonials() {
  return (
    <section className="bg-[#f8fafc] py-24">
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {sectionHeadings.testimonials.title}
          </h2>
          <p className="text-lg text-slate-600">
            {sectionHeadings.testimonials.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article key={index} className="flex min-h-[430px] flex-col rounded-[14px] bg-[#f1f5f9] p-7 transition-all hover:shadow-lg">
              <div className="mb-6 flex gap-1">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="flex-1 max-w-[280px] text-[16px] leading-relaxed text-slate-800">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="mt-8 border-t border-slate-200 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {getInitials(testimonial.name)}
                  </div>
                  <div>
                    <div className="text-[19px] font-semibold leading-tight text-slate-900">{testimonial.name}</div>
                    <div className="mt-0.5 text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Image
                    src={TRUSTED_COMPANY_LOGOS[index % TRUSTED_COMPANY_LOGOS.length].src}
                    alt={`${TRUSTED_COMPANY_LOGOS[index % TRUSTED_COMPANY_LOGOS.length].name} logo`}
                    width={TRUSTED_COMPANY_LOGOS[index % TRUSTED_COMPANY_LOGOS.length].width}
                    height={TRUSTED_COMPANY_LOGOS[index % TRUSTED_COMPANY_LOGOS.length].height}
                    className="h-7 w-auto object-contain opacity-90"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
