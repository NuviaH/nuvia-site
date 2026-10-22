/* Nuvia service worker: the site works offline after the first visit.
   Pages are fetched fresh when online, so updates appear straight away.
   The form files in /forms are big and rarely change, so they are fetched once, kept, and reused.
   If a file in /forms is ever replaced, change FORMS below (for example to 'nuvia-forms-v2'). */
const CACHE = 'nuvia-v2';
const FORMS = 'nuvia-forms-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/fira-sans-latin-400.woff2', 'fonts/fira-sans-latin-500.woff2', 'fonts/fira-sans-latin-600.woff2', 'fonts/fira-sans-latin-700.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FORMS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.indexOf('/forms/') !== -1) {
    // forms: use the kept copy if there is one, otherwise fetch it once and keep it
    e.respondWith(caches.open(FORMS).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r).then(m => m || caches.match(r.mode === 'navigate' ? 'index.html' : r)))
  );
});
