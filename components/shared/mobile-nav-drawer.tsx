"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { UserRole } from "@prisma/client";
import {
  Bell,
  Calendar,
  CalendarCheck,
  Car,
  ClipboardCheck,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Settings,
  ShieldAlert,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { EffectivePermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { withLocalePath } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/i18n-context";

type DrawerItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  allowed: boolean;
};

interface MobileNavDrawerProps {
  agencyName: string;
  role: UserRole;
  permissions: EffectivePermissions;
  userName: string;
}

export function MobileNavDrawer({
  agencyName,
  role,
  permissions,
  userName,
}: MobileNavDrawerProps) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const p = (path: string) => withLocalePath(locale, path);

  const mainItems: DrawerItem[] = [
    { href: p("/dashboard"), label: t("shell.sidebar.dashboard"), icon: LayoutDashboard, allowed: true },
    { href: p("/bookings"), label: t("shell.sidebar.bookings"), icon: CalendarCheck, allowed: permissions["bookings.view"] },
    { href: p("/calendrier"), label: t("shell.sidebar.calendar"), icon: Calendar, allowed: permissions["calendar.view"] },
    { href: p("/customers"), label: t("shell.sidebar.customers"), icon: Users, allowed: permissions["customers.view"] },
    { href: p("/vehicles"), label: t("shell.sidebar.vehicles"), icon: Car, allowed: permissions["vehicles.view"] },
    { href: p("/catalogue"), label: t("shell.sidebar.catalogue"), icon: Grid2x2, allowed: permissions["catalogue.view"] },
  ];

  const operationsItems: DrawerItem[] = [
    { href: p("/caisse"), label: t("shell.sidebar.cashRegister"), icon: Wallet, allowed: permissions["caisse.view"] },
    { href: p("/infractions"), label: t("shell.sidebar.infractions"), icon: ShieldAlert, allowed: permissions["infractions.view"] },
    { href: p("/damage-reports"), label: t("shell.sidebar.inspections"), icon: ClipboardCheck, allowed: permissions["inspections.view"] },
    { href: p("/notifications"), label: t("shell.sidebar.notifications"), icon: Bell, allowed: permissions["notifications.view"] },
  ];

  const systemItems: DrawerItem[] = [
    { href: p("/settings/agency"), label: t("shell.mobileNav.agencySettings"), icon: Settings, allowed: true },
    { href: p("/settings/notifications"), label: t("shell.mobileNav.notificationSettings"), icon: Bell, allowed: permissions["notifications.view"] },
    { href: p("/users"), label: t("shell.sidebar.users"), icon: UserCog, allowed: role === "OWNER" },
  ];

  const visibleMainItems = mainItems.filter((item) => item.allowed);
  const visibleOperationsItems = operationsItems.filter((item) => item.allowed);
  const visibleSystemItems = systemItems.filter((item) => item.allowed);

  async function handleLogout() {
    setOpen(false);
    await signOut({ callbackUrl: "/login" });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("shell.mobileNav.openMenu")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-subtle bg-slate-50 text-slate-600 transition-colors hover:bg-white hover:text-slate-900 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" hideCloseButton className="w-[86vw] max-w-[360px] border-r border-slate-200 bg-white p-0 pt-safe-top pb-safe-bottom md:hidden">
        <SheetTitle className="sr-only">{t("shell.mobileNav.navigationTitle")}</SheetTitle>
        <SheetDescription className="sr-only">
          {t("shell.mobileNav.navigationDescription")}
        </SheetDescription>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{agencyName}</p>
              <p className="truncate text-xs text-slate-500">{userName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("shell.mobileNav.closeMenu")}
              className="inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="sr-only">{t("shell.mobileNav.close")}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <DrawerSection label={t("shell.mobileNav.main")} items={visibleMainItems} isActive={isActive} onNavigate={() => setOpen(false)} />
            <DrawerSection label={t("shell.mobileNav.operations")} items={visibleOperationsItems} isActive={isActive} onNavigate={() => setOpen(false)} />
            <DrawerSection label={t("shell.mobileNav.system")} items={visibleSystemItems} isActive={isActive} onNavigate={() => setOpen(false)} />
            <div className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                {t("shell.mobileNav.account")}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                {t("shell.mobileNav.signOut")}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerSection({
  label,
  items,
  isActive,
  onNavigate,
}: {
  label: string;
  items: DrawerItem[];
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-900"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
