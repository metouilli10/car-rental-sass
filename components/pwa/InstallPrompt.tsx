"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "locaryx-install-prompt-dismissed-at";
const INSTALLED_KEY = "locaryx-install-prompt-installed";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function wasDismissedRecently() {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) {
    return false;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && Date.now() - parsed < DISMISS_TTL_MS;
}

function isInstalledSuppressed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(INSTALLED_KEY) === "true";
}

function isIosSafari() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isIosDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);

  return isIosDevice && isSafari;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isStandaloneMode() || isInstalledSuppressed()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (wasDismissedRecently()) {
        return;
      }

      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const shouldShowIosHint =
      isIosSafari() && !isStandaloneMode() && !isInstalledSuppressed() && !wasDismissedRecently();

    setShowIosHint(shouldShowIosHint);

    if (shouldShowIosHint) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!visible || (promptEvent == null && !showIosHint)) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setPromptEvent(null);
  };

  const triggerInstall = async () => {
    if (!promptEvent) {
      return;
    }

    setInstalling(true);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALLED_KEY, "true");
        setVisible(false);
      } else {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    } finally {
      setInstalling(false);
      setPromptEvent(null);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:px-6">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-sm rounded-[1.25rem] border border-subtle bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl",
          showIosHint ? "max-w-xs" : "max-w-sm"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#002e5d]/8 text-[#002e5d]">
            {showIosHint ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Installer Locaryx</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {showIosHint
                    ? "Ouvrez Partager, puis choisissez Sur l’écran d’accueil pour lancer Locaryx comme une app."
                    : "Ajoutez Locaryx à votre écran d’accueil pour ouvrir directement le tableau de bord."}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Masquer l’invitation d’installation"
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {showIosHint ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    <Share2 className="h-3 w-3" />
                    Partager
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    <Smartphone className="h-3 w-3" />
                    Sur l’écran d’accueil
                  </span>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void triggerInstall()}
                    disabled={installing}
                    className="rounded-xl bg-[#002e5d] hover:bg-[#001f40]"
                  >
                    {installing ? "Ouverture..." : "Installer"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={dismiss} className="rounded-xl">
                    Plus tard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
