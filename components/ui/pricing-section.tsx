"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: ReactNode
  ctaLabel?: string
  displayPrice?: {
    monthly: string
    yearly: string
    yearlyBilling?: string
  }
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
  title?: string
  subtitle?: string
  monthlyLabel?: string
  yearlyLabel?: string
  monthlyPeriodLabel?: string
  yearlyPeriodLabel?: string
  yearlySaveBadge?: string
  trustLine?: string
  ctaHelperLines?: string[]
}

function PricingSection({
  tiers,
  className,
  title = "Simple, transparent pricing",
  subtitle,
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  monthlyPeriodLabel = "month",
  yearlyPeriodLabel = "year",
  yearlySaveBadge,
  trustLine,
  ctaHelperLines = [],
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  const buttonStyles = {
    default: cn(
      "h-12 bg-[#2563eb]",
      "hover:bg-[#1d4ed8]",
      "text-white",
      "border border-[#2563eb]",
      "hover:border-[#1d4ed8]",
      "shadow-sm hover:shadow-md hover:shadow-[#2563eb]/25",
      "text-sm font-medium"
    ),
    highlight: cn(
      "h-12 bg-[#2563eb]",
      "hover:bg-[#1d4ed8]",
      "text-white",
      "shadow-[0_1px_15px_rgba(37,99,235,0.25)]",
      "hover:shadow-[0_1px_20px_rgba(37,99,235,0.35)]",
      "font-semibold text-base"
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-zinc-900 dark:bg-zinc-100",
    "text-white dark:text-zinc-900",
    "border-none shadow-lg"
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className
      )}
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {subtitle && (
            <p className="max-w-2xl text-center text-zinc-600 dark:text-zinc-300">
              {subtitle}
            </p>
          )}
          <div className="inline-flex items-center p-1.5 bg-white dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {[monthlyLabel, yearlyLabel].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === yearlyLabel)}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  (period === yearlyLabel) === isYearly
                    ? "bg-[#2563eb] text-white shadow-lg"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {period}
              </button>
            ))}
          </div>
          {yearlySaveBadge && (
            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
              {yearlySaveBadge}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-zinc-100/80 to-transparent dark:from-zinc-400/[0.15]"
                  : "bg-white dark:bg-zinc-800/50",
                "border",
                tier.highlight
                  ? "scale-[1.03] border-2 border-[#2563eb] shadow-xl"
                  : "border-zinc-200 dark:border-zinc-700 shadow-md",
                "hover:translate-y-0 hover:shadow-lg"
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                      {isYearly
                        ? (tier.displayPrice?.yearly ?? `$${tier.price.yearly}`)
                        : (tier.displayPrice?.monthly ?? `$${tier.price.monthly}`)}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      /{isYearly ? yearlyPeriodLabel : monthlyPeriodLabel}
                    </span>
                  </div>
                  {isYearly && tier.displayPrice?.yearlyBilling && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {tier.displayPrice.yearlyBilling}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-600"
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {feature.name}
                        </div>
                        {feature.description ? (
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {feature.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  className={cn(
                    "w-full relative transition-all duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.highlight ? (
                      <>
                        {tier.ctaLabel ?? "Commencer"}
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        {tier.ctaLabel ?? "Commencer"}
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
                {ctaHelperLines.length > 0 && (
                  <div className="mt-3 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {ctaHelperLines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {trustLine && (
          <p className="mt-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
            {trustLine}
          </p>
        )}
      </div>
    </section>
  )
}

export { PricingSection }
export type { PricingTier }
