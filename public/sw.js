const CACHE_VERSION = "locaryx-pwa-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  OFFLINE_URL,
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/icon-512-maskable.png",
  "/pwa/apple-touch-icon.png",
];

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/vehicles",
  "/customers",
  "/finance",
  "/payments",
  "/caisse",
  "/catalogue",
  "/calendrier",
  "/damage-reports",
  "/infractions",
  "/settings",
  "/notifications",
  "/users",
];

const DEFAULT_NOTIFICATION_URL = "/notifications";
const DEFAULT_NOTIFICATION_TITLE = "Locaryx";
const DEFAULT_NOTIFICATION_ICON = "/pwa/icon-192.png";
const DEFAULT_NOTIFICATION_BADGE = "/pwa/icon-192.png";

function normalizePushPayload(payload) {
  const safePayload =
    payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const title =
    typeof safePayload.title === "string" && safePayload.title.trim()
      ? safePayload.title.trim()
      : DEFAULT_NOTIFICATION_TITLE;
  const body =
    typeof safePayload.body === "string" && safePayload.body.trim()
      ? safePayload.body.trim()
      : "Vous avez une nouvelle alerte Locaryx.";
  const url =
    typeof safePayload.url === "string" && safePayload.url.trim()
      ? safePayload.url.trim()
      : DEFAULT_NOTIFICATION_URL;
  const tag =
    typeof safePayload.tag === "string" && safePayload.tag.trim()
      ? safePayload.tag.trim()
      : "locaryx-notification";
  const kind =
    typeof safePayload.kind === "string" && safePayload.kind.trim()
      ? safePayload.kind.trim()
      : "GENERIC";
  const agencyId =
    typeof safePayload.agencyId === "string" && safePayload.agencyId.trim()
      ? safePayload.agencyId.trim()
      : undefined;
  const entityId =
    typeof safePayload.entityId === "string" && safePayload.entityId.trim()
      ? safePayload.entityId.trim()
      : undefined;

  return {
    title,
    body,
    url: url.startsWith("/") ? url : `/${url}`,
    tag,
    kind,
    agencyId,
    entityId,
  };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  const payloadPromise = (async () => {
    if (!event.data) {
      return normalizePushPayload(null);
    }

    try {
      return normalizePushPayload(event.data.json());
    } catch (error) {
      console.warn("Push payload JSON parsing failed", error);
      try {
        const textBody = await event.data.text();
        return normalizePushPayload({
          body: textBody,
        });
      } catch (textError) {
        console.warn("Push payload text parsing failed", textError);
        return normalizePushPayload(null);
      }
    }
  })();

  event.waitUntil(
    payloadPromise.then((payload) =>
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: DEFAULT_NOTIFICATION_ICON,
        badge: DEFAULT_NOTIFICATION_BADGE,
        tag: payload.tag,
        data: {
          url: payload.url,
          kind: payload.kind,
          agencyId: payload.agencyId,
          entityId: payload.entityId,
        },
      }),
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification?.data?.url || DEFAULT_NOTIFICATION_URL,
    self.location.origin,
  ).toString();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) {
          continue;
        }

        if ("navigate" in client) {
          await client.navigate(targetUrl);
        }

        return client.focus();
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  if (request.mode === "navigate") {
    if (!APP_ROUTE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      return;
    }

    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return cache.match(OFFLINE_URL) || Response.error();
      })
    );
    return;
  }

  if (url.pathname === "/manifest.webmanifest" || url.pathname.startsWith("/pwa/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || Response.error();
}
