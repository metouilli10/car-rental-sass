"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./MobileMenu";

const navLinks = [
  { href: "#features", label: "Fonctionnalités" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#why-locaryx", label: "Pourquoi Locaryx" },
  { href: "#testimonials", label: "Témoignages" },
  { href: "#contact", label: "Contact" },
];

export function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center rounded-2xl transition-all duration-300 ${
              scrolled ? "" : "bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm"
            }`}
          >
            <Image
              src="/assets/locaryx logo new.png"
              alt="Locaryx"
              width={130}
              height={32}
              className="h-7 w-auto transition-all duration-300"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors px-4 py-2 ${
                scrolled
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]"
            >
              Demarrer gratuitement
            </Link>
          </div>

          {/* Mobile menu */}
          <MobileMenuButton scrolled={scrolled} />
        </div>
      </div>
    </nav>
  );
}
