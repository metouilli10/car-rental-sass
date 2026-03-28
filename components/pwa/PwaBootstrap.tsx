"use client";

import { useEffect } from "react";

const PWA_READY_EVENT = "locaryx:pwa-ready";

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const shouldRegister =
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" || !isLocalhost);

    if (!shouldRegister) {
      return;
    }

    let cancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        if (!cancelled) {
          window.dispatchEvent(
            new CustomEvent(PWA_READY_EVENT, {
              detail: { registration },
            })
          );
        }
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    void registerServiceWorker();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
