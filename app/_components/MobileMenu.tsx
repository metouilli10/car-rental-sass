"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X as CloseIcon } from "lucide-react";

export function MobileMenuButton() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 text-gray-700"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 pb-5 px-5 space-y-3 pt-4 animate-in slide-in-from-top-2 duration-200">
          <a href="#features" className="block text-sm py-2 text-gray-600 font-medium">Fonctionnalités</a>
          <a href="#pricing" className="block text-sm py-2 text-gray-600 font-medium">Tarifs</a>
          <a href="#faq" className="block text-sm py-2 text-gray-600 font-medium">FAQ</a>
          <Link href="/login" className="block text-sm py-2 text-gray-600 font-medium">Connexion</Link>
          <Link href="/login" className="block text-center px-5 py-3 bg-[#2563EB] text-white text-sm font-semibold rounded-full mt-2">
            Essai gratuit
          </Link>
        </div>
      )}
    </>
  );
}
