"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavLink } from "@/components/shared/nav-link";

const SIDEBAR_STORAGE_KEY = "locapro-sidebar-collapsed";
const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 76;

export interface DashboardSidebarProps {
  agencyName: string;
}

export function DashboardSidebar({ agencyName }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {
      // ignore localStorage errors
    }
  }, [mounted]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  // Avoid hydration mismatch: render expanded on server, then sync on client
  const isCollapsed = mounted ? collapsed : false;
  const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <aside
      className={cn(
        "hidden md:flex bg-white flex-col border-r border-border/30 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
      )}
      style={{ width }}
      suppressHydrationWarning
    >
      {/* Header: Logo + Toggle */}
      <div
        className={cn(
          "flex items-center shrink-0 border-b border-border/30",
          isCollapsed ? "justify-between gap-1 px-2 py-3.5" : "justify-between gap-2 px-4 pt-6 pb-4"
        )}
      >
        {!isCollapsed ? (
          <div className="relative w-36 h-10 overflow-hidden flex-1 min-w-0">
            <Image
              src="/assets/locapro-logo.png"
              alt="Locapro"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        ) : (
          <div className="relative h-8 w-8 rounded-lg bg-muted/40 border border-border/40 shrink-0 overflow-hidden">
            <Image
              src="/assets/locapro-favicon.png"
              alt="Locapro"
              fill
              className="object-contain p-1"
              sizes="32px"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="shrink-0 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label={isCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Nav — instant tooltips in collapsed mode */}
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <nav
          className={cn(
            "flex-1 px-3 py-5 space-y-2.5 overflow-x-hidden",
            isCollapsed && "px-2"
          )}
        >
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
              Menu Principal
            </p>
          )}
          <NavLink
            href="/dashboard"
            iconName="LayoutDashboard"
            label="Tableau de bord"
            collapsed={isCollapsed}
          />
          <NavLink href="/vehicles" iconName="Car" label="Véhicules" collapsed={isCollapsed} />
          <NavLink href="/catalogue" iconName="BookOpen" label="Catalogue" collapsed={isCollapsed} />
          <NavLink href="/customers" iconName="Users" label="Clients" collapsed={isCollapsed} />
          <NavLink href="/bookings" iconName="Calendar" label="Réservations" collapsed={isCollapsed} />
          <NavLink href="/calendrier" iconName="CalendarRange" label="Calendrier" collapsed={isCollapsed} />
          <NavLink href="/payments" iconName="CreditCard" label="Paiements" collapsed={isCollapsed} />
          <NavLink href="/damage-reports" iconName="ClipboardCheck" label="Inspections" collapsed={isCollapsed} />
          <NavLink href="/notifications" iconName="Bell" label="Notifications" collapsed={isCollapsed} />
        </nav>
      </TooltipProvider>

      {/* Footer */}
      <div
        className={cn(
          "py-4 pt-2 border-t border-border/30 space-y-1 shrink-0",
          isCollapsed ? "px-2 flex justify-center" : "px-4"
        )}
        title={isCollapsed ? agencyName : undefined}
      >
        {!isCollapsed ? (
          <>
            <p className="px-3 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              {agencyName}
            </p>
            <p className="px-3 text-[9px] text-muted-foreground/40">
              <a
                href="https://www.flaticon.com/uicons/interface-icons"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Icônes Flaticon
              </a>
            </p>
          </>
        ) : (
          <span className="text-[9px] text-muted-foreground/40" aria-hidden>
            …
          </span>
        )}
      </div>
    </aside>
  );
}
