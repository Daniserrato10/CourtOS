// CourtOS — service worker mínimo: hace la app instalable y la abre aunque no haya señal.
// Estrategia: primero la red (así siempre ves la versión más nueva) y, si falla, la copia guardada.
const VERSION = 'courtos-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Firebase, fuentes, etc. van directo a la red
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req.mode === 'navigate' ? '/' : req, copia)); }
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? '/' : req).then((r) => r || caches.match('/')))
  );
});
