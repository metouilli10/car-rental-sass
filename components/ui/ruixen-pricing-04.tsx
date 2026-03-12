"use client";

import Link from "next/link";
import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPlan = "monthly" | "annually";

export type RuixenPricingPlan = {
  id: string;
  title: string;
  desc: string;
  monthlyPrice: number;
  annuallyMonthlyPrice: number;
  annuallyBillingLabel: string;
  badge?: string;
  buttonText: string;
  features: string[];
  link?: string;
};

type RuixenPricing04Props = {
  title: string;
  subtitle: string;
  plans: RuixenPricingPlan[];
  trustLine?: string;
  ctaHelperLines?: string[];
  yearlySaveBadge?: string;
};

export default function RuixenPricing04({
  title,
  subtitle,
  plans,
  trustLine,
  ctaHelperLines = [],
  yearlySaveBadge,
}: RuixenPricing04Props) {
  const [billPlan, setBillPlan] = useState<BillingPlan>("monthly");

  const handleSwitch = () => {
    setBillPlan((prev) => (prev === "monthly" ? "annually" : "monthly"));
  };

  return (
    <section className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-20 lg:px-8 lg:py-24">
      <div className="flex max-w-2xl flex-col items-center justify-center">
        <div className="flex max-w-2xl flex-col items-center text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <span className="text-base font-medium text-slate-700">Mensuel</span>
          <button
            type="button"
            onClick={handleSwitch}
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/30"
            aria-label="Basculer entre mensuel et annuel"
          >
            <div className="h-6 w-12 rounded-full bg-[#2563eb] shadow-md transition" />
            <div
              className={cn(
                "absolute left-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white transition-all duration-500 ease-in-out",
                billPlan === "annually" ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-base font-medium text-slate-700">Annuel</span>
          {yearlySaveBadge ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {yearlySaveBadge}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 pt-8 lg:grid-cols-2 lg:gap-6 lg:pt-12">
        {plans.map((plan) => (
          <PricingPlanCard key={plan.id} plan={plan} billPlan={billPlan} ctaHelperLines={ctaHelperLines} />
        ))}
      </div>

      {trustLine ? (
        <p className="mt-10 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
          {trustLine}
        </p>
      ) : null}
    </section>
  );
}

function PricingPlanCard({
  plan,
  billPlan,
  ctaHelperLines,
}: {
  plan: RuixenPricingPlan;
  billPlan: BillingPlan;
  ctaHelperLines: string[];
}) {
  const isHighlighted = Boolean(plan.badge);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-start overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all lg:rounded-3xl",
        isHighlighted && "border-[#2563eb] shadow-[0_16px_44px_rgba(37,99,235,0.12)]"
      )}
    >
      <div className="relative flex w-full flex-col items-start rounded-t-2xl p-5 md:p-8 lg:rounded-t-3xl">
        {plan.badge ? (
          <span className="mb-3 rounded-full bg-[#2563eb] px-3 py-1 text-xs font-semibold text-white">
            {plan.badge}
          </span>
        ) : null}

        <h3 className="pt-2 text-xl font-semibold text-slate-900">{plan.title}</h3>

        <div className="mt-3 flex items-end gap-1 text-slate-900">
          <span className="text-2xl font-bold md:text-5xl">
            <NumberFlow value={billPlan === "monthly" ? plan.monthlyPrice : plan.annuallyMonthlyPrice} />
          </span>
          <span className="pb-1 text-sm font-medium text-slate-600 md:text-base">DH/mois</span>
        </div>

        <p className="mt-2 text-sm text-slate-600 md:text-base">{plan.desc}</p>
      </div>

      <div className="flex w-full flex-col items-start px-5 py-2 md:px-8">
        <Button asChild size="lg" className="w-full">
          <Link href={plan.link ?? "/signup"}>{plan.buttonText}</Link>
        </Button>

        <div className="h-14 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={billPlan}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-3 text-center text-sm text-slate-500"
            >
              {billPlan === "monthly" ? "Facturé mensuellement" : plan.annuallyBillingLabel}
            </motion.div>
          </AnimatePresence>
          {ctaHelperLines.length > 0 ? (
            <div className="mt-1 text-center text-xs leading-relaxed text-slate-500">
              {ctaHelperLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-4 ml-1 flex w-full flex-col items-start gap-y-2 p-5">
        <span className="mb-2 text-base text-left font-medium text-slate-800">Inclus :</span>
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center justify-start gap-2 text-slate-700">
            <div className="flex items-center justify-center text-emerald-600">
              <CheckIcon className="size-5" />
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
