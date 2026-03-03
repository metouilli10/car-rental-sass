"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-6 text-left group"
      >
        <span className="text-base font-semibold pr-8 text-gray-900 group-hover:text-blue-600 transition-colors">
          {q}
        </span>
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open ? "bg-blue-600 border-blue-600 rotate-45" : "border-gray-300 bg-white group-hover:border-blue-600"}`}>
          <Plus className={`w-3.5 h-3.5 transition-colors ${open ? "text-white" : "text-gray-400 group-hover:text-blue-600"}`} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-40 pb-6" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 leading-relaxed text-[15px]">{a}</p>
      </div>
    </div>
  );
}
