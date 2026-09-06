/* Herling Analytics — Service Worker
   Twee strategieën, bewust verschillend:

   - Het document zelf (index.html): NETWERK EERST, cache als terugval.
     Stale-while-revalidate gaf je na een deploy nog één keer de vorige
     versie. Dat is niet alleen ongemak: je werkt dan in een oude app die
     wél naar dezelfde Drive schrijft, dus met bugs die al gerepareerd
     zijn. Alles zit in dit ene bestand, dus dit is de hele app.
   - De rest (icoon, manifest): stale-while-revalidate, want dat verandert
     zelden en mag direct uit de cache komen.

   Cross-origin (Google, fonts, iCal) raken we niet aan.
   Bump CACHE_NAME when shipping a new release to invalidate old caches. */

const CACHE_NAME = 'herling-v18';

const PRECACHE_URLS = [
  './',
  './index.html',
  './herling-icon.svg',
  './manifest.json'
];

/* Install — pre-cache the shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* Activate — purge old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* Fetch — stale-while-revalidate for same-origin GETs */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Only cache same-origin assets — never the GitHub API */
  if (url.origin !== location.origin) return;

  /* Skip API-style URLs even on same-origin (defensive) */
  if (url.pathname.includes('/api/')) return;

  /* Het document: netwerk eerst. Lukt dat niet (offline), dan alsnog de
     cache -- daarmee blijft de app offline bruikbaar zonder dat je na een
     deploy in een oude versie belandt. */
  const isDocument = req.mode === 'navigate' ||
    url.pathname === '/' || url.pathname.endsWith('/index.html');
  if (isDocument) {
    e.respondWith(
      fetch(req).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match(req).then(cached =>
        cached || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(resp => {
        /* Update cache with the fresh response in the background */
        if (resp && resp.ok && resp.type === 'basic') {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, respClone));
        }
        return resp;
      }).catch(() => cached); /* Offline → fall back to whatever's cached */

      /* Return cached immediately if we have it; otherwise wait for network */
      return cached || fetchPromise;
    })
  );
});
