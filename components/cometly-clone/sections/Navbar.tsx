import React from "react";
import { Button } from "@/components/ui/button";
import { navLinks } from "../data";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tight">cometly</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <div key={link.label} className="group relative flex items-center gap-1 cursor-pointer">
              <span className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                {link.label}
              </span>
              {link.hasDropdown && (
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180" />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="#" className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
            Login
          </Link>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 font-medium h-10">
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
