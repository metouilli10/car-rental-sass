"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-subtle bg-white/90 px-4 backdrop-blur-sm sm:px-6">
        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard"
            aria-label="Aller au tableau de bord"
            className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/50 md:hidden"
          >
            <Image
              src="/assets/locaryx-logo-dark.png"
              alt="Locaryx"
              width={120}
              height={28}
              className="h-6 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* ── Zone C: Right — Search + Bell + Profile ───────────── */}
        <div className="flex-none flex items-center gap-2 sm:gap-2.5">
          {/* Search shell */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher (Ctrl+K)"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-subtle bg-slate-50 px-3 text-sm text-slate-500 transition-colors duration-200 hover:bg-white hover:text-slate-900"
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
              }}
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} actives)` : ""}`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-subtle bg-slate-50 text-slate-500 transition-colors duration-200 hover:bg-white hover:text-slate-900"
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
          <div className="mx-0.5 h-5 w-px bg-slate-200" />

          {/* Profile Section */}
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                setNotifOpen(false);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Menu profil"
                className="flex min-h-[36px] items-center gap-2 rounded-xl border border-transparent px-2 py-1 transition-colors duration-200 hover:bg-slate-50 sm:gap-2.5 sm:px-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-950 text-xs font-semibold text-white">
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
                  <p className="text-sm font-medium leading-tight text-slate-950">
                    {userName}
                  </p>
                  <p className="text-[11px] leading-tight text-slate-500">
                    {agencyName}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-card-lg"
            >
              <DropdownMenuLabel className="border-b border-border px-4 py-3.5">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="mt-0.5 text-xs font-normal text-muted-foreground truncate">
                  {userEmail}
                </p>
              </DropdownMenuLabel>
              <div className="p-1.5">
                <DropdownMenuItem
                  onSelect={() => router.push("/settings/agency")}
                  className="gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push("/getting-started")}
                  className="gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80"
                >
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                  Démarrage guidé
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push("/settings/agency")}
                  className="gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Agence
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push("/settings/notifications")}
                  className="gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Paramètres
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="p-1.5 pt-0">
                <DropdownMenuItem
                  onSelect={() => {
                    void signOut({ callbackUrl: "/login" });
                  }}
                  className="gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 focus:bg-red-50 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search overlay — rendered outside header to avoid stacking context issues */}
      {searchOpen ? <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
