"use client";

import type { PushSubscribeRequest, PushUnsubscribeRequest } from "@/lib/push/schemas";

export type PushClientStatus =
  | "enabled"
  | "disabled"
  | "unsupported"
  | "denied";

export type PushClientState = {
  status: PushClientStatus;
  permission: NotificationPermission | "unsupported";
  subscription: PushSubscription | null;
};

type PushClientResult = {
  success: boolean;
  message: string;
};

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function getPublicVapidKey() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!key) {
    throw new Error("La clé publique VAPID n'est pas configurée.");
  }
  return key;
}

function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return "iOS";
  }
  if (userAgent.includes("android")) {
    return "Android";
  }
  if (userAgent.includes("mac")) {
    return "macOS";
  }
  if (userAgent.includes("windows")) {
    return "Windows";
  }
  return "Web";
}

function buildDeviceLabel() {
  return `Appareil ${detectPlatform()}`;
}

async function getServiceWorkerRegistration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function postJson<TResponse>(url: string, payload?: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload == null ? undefined : JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Erreur serveur");
  }

  return data as TResponse;
}

export async function getPushClientState(): Promise<PushClientState> {
  if (!isPushSupported()) {
    return {
      status: "unsupported",
      permission: "unsupported",
      subscription: null,
    };
  }

  const permission = Notification.permission;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  if (permission === "denied") {
    return {
      status: "denied",
      permission,
      subscription,
    };
  }

  return {
    status: subscription ? "enabled" : "disabled",
    permission,
    subscription,
  };
}

export async function enablePushNotifications(): Promise<PushClientResult> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: "Ce navigateur ne prend pas en charge les notifications push.",
    };
  }

  const registration = await getServiceWorkerRegistration();
  const permission = await Notification.requestPermission();

  if (permission === "denied") {
    return {
      success: false,
      message: "Autorisation refusée.",
    };
  }

  if (permission !== "granted") {
    return {
      success: false,
      message: "Autorisation non accordée.",
    };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getPublicVapidKey()),
    });
  }

  const subscriptionJson = subscription.toJSON();
  const requestPayload: PushSubscribeRequest = {
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh ?? "",
        auth: subscriptionJson.keys?.auth ?? "",
      },
    },
    deviceLabel: buildDeviceLabel(),
    platform: detectPlatform(),
  };

  await postJson("/api/push/subscribe", requestPayload);

  return {
    success: true,
    message: "Notifications activées.",
  };
}

export async function disablePushNotifications(): Promise<PushClientResult> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: "Ce navigateur ne prend pas en charge les notifications push.",
    };
  }

  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.getRegistration());
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  if (subscription) {
    const payload: PushUnsubscribeRequest = {
      endpoint: subscription.endpoint,
    };
    await postJson("/api/push/unsubscribe", payload);
    await subscription.unsubscribe();
  }

  return {
    success: true,
    message: "Notifications désactivées.",
  };
}

export async function sendTestPushNotification(): Promise<PushClientResult> {
  await postJson("/api/push/test");

  return {
    success: true,
    message: "Notification de test envoyée.",
  };
}
