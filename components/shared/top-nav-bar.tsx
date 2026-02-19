"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { SearchOverlay } from "@/components/shared/search-overlay";
import type { ReminderType, NotificationSeverity } from "@prisma/client";

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
      <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-4 sm:px-6 shrink-0">
        {/* ── Zone B: Center spacer ─────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Zone C: Right — Search + Bell + Profile ───────────── */}
        <div className="flex-none flex items-center gap-1.5 sm:gap-2">
          {/* Search icon button */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher (Ctrl+K)"
            className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-[#F3F4F6] text-muted-foreground hover:bg-gray-200/70 hover:text-foreground transition-all duration-200"
          >
            <Search className="h-4 w-4" />
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
              className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-[#F3F4F6] text-muted-foreground hover:bg-gray-200/70 hover:text-foreground hover:scale-105 active:scale-100 transition-all duration-200"
            >
              <Bell className="h-[18px] w-[18px]" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-card-lg border border-border/30 overflow-hidden animate-scale-in origin-top-right">
                <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Rappels &amp; alertes
                  </h3>
                  {notifCount > 0 && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {notifCount} active{notifCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
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
                          className="w-full flex items-start gap-3.5 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-muted/40 bg-primary/[0.02]"
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

                <div className="px-5 py-3 border-t border-border/30">
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
          <div className="h-6 w-px bg-border/50 mx-0.5" />

          {/* Profile Section */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              aria-label="Menu profil"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 sm:gap-2.5 rounded-xl px-2 sm:px-2.5 py-1.5 min-h-[36px] hover:bg-muted/50 transition-all duration-200"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {initials}
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
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-lg border border-border/30 overflow-hidden animate-scale-in origin-top-right">
                <div className="px-4 py-3.5 border-b border-border/30">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {userEmail}
                  </p>
                </div>
                <div className="py-1.5">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/40 hover:text-foreground transition-colors duration-150">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profil
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings/notifications");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/40 hover:text-foreground transition-colors duration-150"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Paramètres
                  </button>
                </div>
                <div className="border-t border-border/30 py-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500/80 hover:bg-red-50/50 hover:text-red-600 transition-colors duration-150"
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
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
