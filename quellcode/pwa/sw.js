// SilentBoard – Copyright (C) 2026 ostalbweb.de
// SPDX-License-Identifier: GPL-3.0-or-later
/* SilentBoard – Service Worker: macht die App offline nutzbar.
 * Die Seite selbst wird zuerst aus dem Netz geholt (damit Updates ankommen),
 * ohne Internet aus dem Zwischenspeicher. Lichess-Anfragen laufen unverändert durch. */
const CACHE = 'silentboard-@@VERSION@@';
const FILES = [
  './', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('silentboard-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return res; })
        .catch(() => caches.match('./'))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
