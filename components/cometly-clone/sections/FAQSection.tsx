"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { faqItems } from "../data";

function FAQItem({
  question,
  answer,
  defaultOpen,
}: {
  question: string;
  answer: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100">
      <button
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        {open ? (
          <Minus className="h-5 w-5 shrink-0 text-[#6D5EF7]" />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-40 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-gray-500">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-[#6D5EF7]">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Les questions avant de se lancer
          </h2>
        </div>

        <div className="mt-12">
          {faqItems.map((item) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              defaultOpen={item.defaultOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
