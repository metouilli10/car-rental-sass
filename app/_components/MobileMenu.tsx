"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X as CloseIcon } from "lucide-react";

export function MobileMenuButton({ scrolled = true }: { scrolled?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        className={`lg:hidden p-2 transition-colors ${
          scrolled || mobileMenuOpen ? "text-gray-700" : "text-white"
        }`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <CloseIcon className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-lg pb-6 px-6 space-y-1 pt-4 animate-in slide-in-from-top-2 duration-200">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Fonctionnalités
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Tarifs
          </a>
          <a
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            Témoignages
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
          >
            FAQ
          </a>
          <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
            <Link
              href="/login"
              className="block text-sm py-2.5 text-gray-600 font-medium"
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="block text-center px-5 py-3 bg-amber-500 text-white text-sm font-semibold rounded-full hover:bg-amber-400 transition-colors"
            >
              Demarrer gratuitement
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
