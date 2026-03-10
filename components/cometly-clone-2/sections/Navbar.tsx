import React from "react";
import { Button } from "@/components/ui/button";
import { navLinks } from "../data";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="clone2-navbar absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/locaryx-logo-white.png"
            alt="Locaryx"
            width={1193}
            height={345}
            className="h-8 w-auto md:h-9"
            priority
          />
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="group relative flex items-center gap-1.5 cursor-pointer"
            >
              <span className="clone2-nav-link">{link.label}</span>
              {link.hasDropdown && (
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180" />
              )}
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-5">
          <Link href="#" className="clone2-login-link">
            Connexion
          </Link>
          <Button className="clone2-book-demo-btn">Commencer</Button>
        </div>

        <div className="lg:hidden">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
