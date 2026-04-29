/* Herling Analytics — Service Worker
   Strategy: stale-while-revalidate for same-origin GETs.
   - Serves from cache immediately (instant load + offline support)
   - Refreshes the cache in the background from network
   - Network-only for cross-origin (Gist API, fonts, etc.) so live data
     never gets stale-cached.
   Bump CACHE_NAME when shipping a new release to invalidate old caches. */

const CACHE_NAME = 'herling-v3';

const PRECACHE_URLS = [
  './',
  './herling_analytics_home.html',
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
