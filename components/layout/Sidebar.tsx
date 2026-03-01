"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { UserRole } from "@prisma/client";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarSection } from "./SidebarSection";
import { SidebarItem } from "./SidebarItem";

const SIDEBAR_STORAGE_KEY = "locapro-sidebar-collapsed";
const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export interface SidebarProps {
  agencyName: string;
  role: UserRole;
}

export function Sidebar({ agencyName, role }: SidebarProps) {
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

  const isCollapsed = mounted ? collapsed : false;
  const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <aside
      className="hidden min-h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card shadow-sm transition-[width] duration-200 ease-in-out md:flex"
      style={{ width }}
      suppressHydrationWarning
    >
      {/* ─── Header: Logo + Toggle ─── */}
      <div
        className={cn(
          "flex items-center shrink-0 border-b border-border",
          isCollapsed
            ? "justify-center gap-1 px-2 py-3"
            : "justify-between gap-2 px-4 py-4"
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
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
            <Image
              src="/assets/locapro-favicon.png"
              alt="Locapro"
              fill
              className="object-contain p-0.5"
              sizes="32px"
            />
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
            isCollapsed && "mt-0"
          )}
          aria-label={isCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* ─── Navigation ─── */}
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden px-2 py-2",
            isCollapsed && "px-1.5"
          )}
        >
          {/* MENU PRINCIPAL */}
          <SidebarSection label="Menu principal" collapsed={isCollapsed}>
            <SidebarItem
              href="/dashboard"
              iconName="LayoutDashboard"
              label="Tableau de bord"
              collapsed={isCollapsed}
            />
          </SidebarSection>

          {/* OPÉRATIONS */}
          <SidebarSection label="Opérations" collapsed={isCollapsed}>
            <SidebarItem href="/bookings" iconName="Calendar" label="Réservations" collapsed={isCollapsed} />
            <SidebarItem href="/calendrier" iconName="CalendarRange" label="Calendrier" collapsed={isCollapsed} />
            <SidebarItem href="/customers" iconName="Users" label="Clients" collapsed={isCollapsed} />
            <SidebarItem href="/vehicles" iconName="Car" label="Véhicules" collapsed={isCollapsed} />
            <SidebarItem href="/catalogue" iconName="BookOpen" label="Catalogue" collapsed={isCollapsed} />
          </SidebarSection>

          {/* FINANCE */}
          <SidebarSection label="Finance" collapsed={isCollapsed}>
            <SidebarItem href="/caisse" iconName="Wallet" label="Caisse" collapsed={isCollapsed} />
            <SidebarItem href="/finance" iconName="CreditCard" label="Finance" collapsed={isCollapsed} />
          </SidebarSection>

          {/* CONTRÔLE */}
          <SidebarSection label="Contrôle" collapsed={isCollapsed}>
            <SidebarItem href="/damage-reports" iconName="ClipboardCheck" label="Inspections" collapsed={isCollapsed} />
            <SidebarItem href="/infractions" iconName="ShieldAlert" label="Infractions" collapsed={isCollapsed} />
          </SidebarSection>

          {/* SYSTÈME */}
          <SidebarSection label="Système" collapsed={isCollapsed}>
            <SidebarItem href="/notifications" iconName="Bell" label="Notifications" collapsed={isCollapsed} />
            {role === "OWNER" && (
              <SidebarItem href="/users" iconName="Users" label="Utilisateurs" collapsed={isCollapsed} />
            )}
          </SidebarSection>
        </nav>
      </TooltipProvider>

      {/* ─── Footer ─── */}
      <div
        className={cn(
          "shrink-0 border-t border-border py-3",
          isCollapsed ? "px-2 flex justify-center" : "px-4"
        )}
        title={isCollapsed ? agencyName : undefined}
      >
        {!isCollapsed ? (
          <>
            <p className="truncate px-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
              {agencyName}
            </p>
            <p className="mt-0.5 px-1 text-[9px] text-muted-foreground/60">
              <a
                href="https://www.flaticon.com/uicons/interface-icons"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground hover:underline"
              >
                Icônes Flaticon
              </a>
            </p>
          </>
        ) : (
          <span className="text-[9px] text-muted-foreground/60" aria-hidden>
            ...
          </span>
        )}
      </div>
    </aside>
  );
}
