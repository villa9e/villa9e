// villa9e Service Worker — PWA offline support + smart caching
const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `villa9e-static-${CACHE_VERSION}`;
const API_CACHE     = `villa9e-api-${CACHE_VERSION}`;

const PRECACHE = [
  '/',
  '/offline',
  '/logo.svg',
  '/manifest.json',
];

// Install — precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API routes — network first, no cache
  if (url.pathname.startsWith('/api/')) return;

  // _next/static — cache first (immutable files)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(res => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Pages — network first, fallback to cache, then offline page
  event.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached ?? caches.match('/offline')))
  );
});

// Push notifications (via OneSignal — they install their own SW, this is additive)
self.addEventListener('push', event => {
  if (!event.data) return;
  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title ?? 'villa9e', {
      body:    body ?? '',
      icon:    '/logo.svg',
      badge:   '/logo.svg',
      data:    { url: url ?? '/' },
      actions: [{ action: 'open', title: 'Open' }],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
