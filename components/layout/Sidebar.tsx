"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { UserRole } from "@prisma/client";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EffectivePermissions } from "@/lib/permissions";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarSection } from "./SidebarSection";
import { SidebarItem } from "./SidebarItem";

const SIDEBAR_STORAGE_KEY = "locapro-sidebar-collapsed";
const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export interface SidebarProps {
  agencyName: string;
  role: UserRole;
  permissions: EffectivePermissions;
  onboarding?: {
    eligible: boolean;
    completed: boolean;
    completedCount: number;
    totalCount: number;
  };
}

export function Sidebar({ agencyName, role, permissions, onboarding }: SidebarProps) {
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
  const showOperations =
    permissions["bookings.view"] ||
    permissions["calendar.view"] ||
    permissions["customers.view"] ||
    permissions["vehicles.view"] ||
    permissions["catalogue.view"];
  const showFinance = permissions["caisse.view"] || permissions["finance.view"];
  const showControl = permissions["inspections.view"] || permissions["infractions.view"];
  const showSystem = permissions["notifications.view"] || role === "OWNER";

  return (
    <aside
      className="hidden min-h-screen shrink-0 flex-col overflow-hidden border-r border-subtle bg-white transition-[width] duration-200 ease-in-out md:flex"
      style={{ width }}
      suppressHydrationWarning
    >
      {/* ─── Header: Logo + Toggle ─── */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-subtle",
          isCollapsed
            ? "justify-center gap-1 px-2 py-3"
            : "justify-between gap-2 px-4 py-4"
        )}
      >
        {!isCollapsed ? (
          <div className="relative h-10 min-w-0 flex-1 overflow-hidden">
            <Image
              src="/assets/locaryx-logo-dark.png"
              alt="Locaryx"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        ) : (
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-subtle bg-slate-50">
            <Image
              src="/assets/locaryx-icon-dark.png"
              alt="Locaryx"
              fill
              className="object-contain p-0.5"
              sizes="32px"
            />
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "shrink-0 rounded-md p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900",
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
            {onboarding?.eligible && !onboarding.completed ? (
              <SidebarItem
                href="/getting-started"
                iconName="Rocket"
                label="Démarrage guidé"
                collapsed={isCollapsed}
                emphasized={!onboarding.completed}
                badge={!onboarding.completed ? `${onboarding.completedCount}/${onboarding.totalCount}` : undefined}
              />
            ) : null}
          </SidebarSection>

          {/* OPÉRATIONS */}
          {showOperations ? (
            <SidebarSection label="Opérations" collapsed={isCollapsed}>
              {permissions["bookings.view"] ? (
                <SidebarItem href="/bookings" iconName="CalendarCheck" label="Réservations" collapsed={isCollapsed} />
              ) : null}
              {permissions["calendar.view"] ? (
                <SidebarItem href="/calendrier" iconName="Calendar" label="Calendrier" collapsed={isCollapsed} />
              ) : null}
              {permissions["customers.view"] ? (
                <SidebarItem href="/customers" iconName="Users" label="Clients" collapsed={isCollapsed} />
              ) : null}
              {permissions["vehicles.view"] ? (
                <SidebarItem href="/vehicles" iconName="Car" label="Véhicules" collapsed={isCollapsed} />
              ) : null}
              {permissions["catalogue.view"] ? (
                <SidebarItem href="/catalogue" iconName="Grid2x2" label="Catalogue" collapsed={isCollapsed} />
              ) : null}
            </SidebarSection>
          ) : null}

          {/* FINANCE */}
          {showFinance ? (
            <SidebarSection label="Finance" collapsed={isCollapsed}>
              {permissions["caisse.view"] ? (
                <SidebarItem href="/caisse" iconName="Wallet" label="Caisse" collapsed={isCollapsed} />
              ) : null}
              {permissions["finance.view"] ? (
                <SidebarItem href="/finance" iconName="BarChart3" label="Finance" collapsed={isCollapsed} />
              ) : null}
            </SidebarSection>
          ) : null}

          {/* CONTRÔLE */}
          {showControl ? (
            <SidebarSection label="Contrôle" collapsed={isCollapsed}>
              {permissions["inspections.view"] ? (
                <SidebarItem href="/damage-reports" iconName="ClipboardCheck" label="Inspections" collapsed={isCollapsed} />
              ) : null}
              {permissions["infractions.view"] ? (
                <SidebarItem href="/infractions" iconName="ShieldAlert" label="Infractions" collapsed={isCollapsed} />
              ) : null}
            </SidebarSection>
          ) : null}

          {/* SYSTÈME */}
          {showSystem ? (
            <SidebarSection label="Système" collapsed={isCollapsed}>
              {permissions["notifications.view"] ? (
                <SidebarItem href="/notifications" iconName="Bell" label="Notifications" collapsed={isCollapsed} />
              ) : null}
              {role === "OWNER" && (
                <SidebarItem href="/users" iconName="UserCog" label="Utilisateurs" collapsed={isCollapsed} />
              )}
            </SidebarSection>
          ) : null}
        </nav>
      </TooltipProvider>

      {/* ─── Footer ─── */}
      <div
        className={cn(
          "shrink-0 border-t border-subtle py-3",
          isCollapsed ? "px-2 flex justify-center" : "px-4"
        )}
        title={isCollapsed ? agencyName : undefined}
      >
        {!isCollapsed ? (
          <>
            <p className="truncate px-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {agencyName}
            </p>
          </>
        ) : (
          <span className="text-[9px] text-slate-400" aria-hidden>
            ...
          </span>
        )}
      </div>
    </aside>
  );
}
