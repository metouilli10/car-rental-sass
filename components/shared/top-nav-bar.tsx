"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Calendar,
  Car,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { SearchOverlay } from "@/components/shared/search-overlay";

interface TopNavBarProps {
  userName: string;
  userEmail: string;
  agencyName: string;
}

const mockNotifications = [
  {
    id: 1,
    icon: Calendar,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    title: "Nouveau retour prévu",
    description: "Véhicule AB-123-CD attendu aujourd'hui à 14h",
    time: "Il y a 12 min",
    unread: true,
  },
  {
    id: 2,
    icon: AlertCircle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    title: "Retour en retard",
    description: "Réservation #1042 — retour prévu hier",
    time: "Il y a 1h",
    unread: true,
  },
  {
    id: 3,
    icon: CreditCard,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    title: "Paiement reçu",
    description: "2 400 MAD reçu pour réservation #1038",
    time: "Il y a 3h",
    unread: false,
  },
  {
    id: 4,
    icon: Car,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Véhicule disponible",
    description: "Dacia Logan est maintenant disponible",
    time: "Hier",
    unread: false,
  },
];

export function TopNavBar({ userName, userEmail, agencyName }: TopNavBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter((n) => n.unread).length;
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
            {/* Keyboard hint — desktop only */}
            <span className="sr-only">Ctrl+K</span>
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-[#F3F4F6] text-muted-foreground hover:bg-gray-200/70 hover:text-foreground hover:scale-105 active:scale-100 transition-all duration-200"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-card-lg border border-border/30 overflow-hidden animate-scale-in origin-top-right">
                <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <button
                        key={notif.id}
                        className={`w-full flex items-start gap-3.5 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-muted/40 ${
                          notif.unread ? "bg-primary/[0.02]" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-9 w-9 rounded-xl ${notif.iconBg} flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`h-4 w-4 ${notif.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm truncate ${
                                notif.unread
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/80"
                              }`}
                            >
                              {notif.title}
                            </p>
                            {notif.unread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notif.description}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-border/30">
                  <button className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors">
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
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/40 hover:text-foreground transition-colors duration-150">
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
