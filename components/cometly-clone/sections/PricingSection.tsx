import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { pricingTiers } from "../data";

export function PricingSection() {
  return (
    <section className="bg-gray-50/50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-[#6D5EF7]">
            Tarifs
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Un prix simple. Pas de surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-gray-500">
            Commencez gratuitement. Évoluez quand votre agence en a besoin, sans engagement inutile.
          </p>
        </div>

        {/* Info box */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-gray-600">
            <Info className="h-4 w-4 text-[#6D5EF7]" />
            <span className="font-medium">Inclus :</span> Support, mises à jour et prise en main rapide
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                tier.popular
                  ? "border-[#6D5EF7] bg-white shadow-md shadow-[#6D5EF7]/10"
                  : "border-gray-200 bg-white shadow-sm"
              )}
            >
              {tier.popular && tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#6D5EF7] px-3 py-1 text-xs font-semibold text-white">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{tier.tagline}</p>
              </div>

              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="ml-1 text-sm text-gray-500">
                  {tier.currency}{tier.period}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={cn(
                  "mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                  tier.popular
                    ? "bg-[#6D5EF7] text-white hover:bg-[#5B4DD6]"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-400">
          Sans engagement · Annulable à tout moment · Support inclus
        </p>
      </div>
    </section>
  );
}
