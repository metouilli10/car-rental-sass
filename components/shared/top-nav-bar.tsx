"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Wrench,
  Shield,
  ClipboardCheck,
  Sticker,
  Rocket,
  Building2,
} from "lucide-react";
import type { ReminderType, NotificationSeverity } from "@prisma/client";

const SearchOverlay = dynamic(
  () => import("@/components/shared/search-overlay").then((mod) => mod.SearchOverlay),
  { ssr: false }
);

interface NotifItem {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  vehicle: { id: string; make: string; model: string; plate: string };
}

interface TopNavBarProps {
  userName: string;
  userEmail: string;
  agencyName: string;
  agencyLogoUrl?: string | null;
  notifCount?: number;
  topNotifs?: NotifItem[];
}

const TYPE_ICONS: Record<ReminderType, React.ElementType> = {
  OIL_CHANGE: Wrench,
  INSURANCE_EXPIRY: Shield,
  TECH_INSPECTION: ClipboardCheck,
  VIGNETTE: Sticker,
};

const SEVERITY_COLORS: Record<
  NotificationSeverity,
  { icon: string; bg: string; dot: string }
> = {
  INFO: { icon: "text-blue-500", bg: "bg-blue-50", dot: "bg-blue-400" },
  WARNING: { icon: "text-amber-500", bg: "bg-amber-50", dot: "bg-amber-400" },
  DUE: { icon: "text-red-500", bg: "bg-red-50", dot: "bg-red-500" },
};

export function TopNavBar({
  userName,
  userEmail,
  agencyName,
  agencyLogoUrl,
  notifCount = 0,
  topNotifs = [],
}: TopNavBarProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd/Ctrl+K shortcut to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm sm:px-6">
        {/* ── Zone B: Center spacer ─────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Zone C: Right — Search + Bell + Profile ───────────── */}
        <div className="flex-none flex items-center gap-2 sm:gap-2.5">
          {/* Search shell */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher (Ctrl+K)"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">Recherche</span>
            <span className="sr-only">Ctrl+K</span>
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} actives)` : ""}`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="fixed left-4 right-4 top-[4.5rem] z-50 w-auto max-w-none overflow-hidden rounded-2xl border border-border bg-popover shadow-card-lg animate-scale-in origin-top-right sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Rappels &amp; alertes
                  </h3>
                  {notifCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {notifCount} active{notifCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto sm:max-h-80">
                  {topNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                      <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Aucun rappel urgent
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Tout est à jour !
                      </p>
                    </div>
                  ) : (
                    topNotifs.map((notif) => {
                      const Icon = TYPE_ICONS[notif.type];
                      const colors = SEVERITY_COLORS[notif.severity];
                      return (
                        <button
                          key={notif.id}
                          onClick={() => {
                            setNotifOpen(false);
                            router.push(`/notifications`);
                          }}
                          className="flex w-full items-start gap-3.5 bg-transparent px-5 py-3.5 text-left transition-colors duration-150 hover:bg-muted/40"
                        >
                          <div
                            className={`mt-0.5 h-9 w-9 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}
                          >
                            <Icon className={`h-4 w-4 ${colors.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {notif.title}
                              </p>
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${colors.dot}`}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {notif.vehicle.make} {notif.vehicle.model} ·{" "}
                              {notif.vehicle.plate}
                            </p>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                              {notif.body}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-border px-5 py-3">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      router.push("/notifications");
                    }}
                    className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-0.5 h-6 w-px bg-border/80" />

          {/* Profile Section */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              aria-label="Menu profil"
              aria-expanded={profileOpen}
              className="flex min-h-[40px] items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-colors duration-200 hover:border-border hover:bg-muted/40 sm:gap-2.5 sm:px-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-white shadow-sm">
                {agencyLogoUrl ? (
                  <Image
                    src={agencyLogoUrl}
                    alt={agencyName}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {agencyName}
                </p>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-card-lg animate-scale-in origin-top-right">
                <div className="border-b border-border px-4 py-3.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1.5">
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 transition-colors duration-150 hover:bg-muted/40 hover:text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profil
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/dashboard?getting-started=1");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 transition-colors duration-150 hover:bg-muted/40 hover:text-foreground"
                  >
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                    Getting Started
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings/agency");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 transition-colors duration-150 hover:bg-muted/40 hover:text-foreground"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Agence
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings/notifications");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 transition-colors duration-150 hover:bg-muted/40 hover:text-foreground"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Paramètres
                  </button>
                </div>
                <div className="border-t border-border py-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500/80 transition-colors duration-150 hover:bg-red-50/70 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search overlay — rendered outside header to avoid stacking context issues */}
      {searchOpen ? <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
