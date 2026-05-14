// Lambert Service Worker — PWA + Push Notifications
// Place this file at: public/sw.js

const CACHE_NAME = "lambert-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// ── Install: cache shell ──────────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: network-first, fall back to cache ─────────────────────────────────
self.addEventListener("fetch", (e) => {
  // Only handle GET requests for same-origin or CDN assets
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return; // never cache API calls

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});

// ── Push: receive notification from server ───────────────────────────────────
self.addEventListener("push", (e) => {
  let payload = {
    title: "Lambert",
    body: "Check your habits.",
    tag: "lambert-general",
    url: "/",
  };

  try {
    if (e.data) payload = { ...payload, ...e.data.json() };
  } catch (_) {}

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: payload.tag, // replaces duplicate notifications of same type
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: payload.url || "/" },
    actions: [
      { action: "log", title: "📝 Log Now" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  e.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── Notification click: open app ─────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  const target =
    e.action === "dismiss" ? null : e.notification.data?.url || "/";
  if (!target) return;

  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => w.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(target);
        } else {
          clients.openWindow(target);
        }
      }),
  );
});
