const CACHE_NAME = 'arcbridge-v2';
const SHELL_ASSETS = ['./', './index.html', './logic.js', './storage.js', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        SHELL_ASSETS.map(async (asset) => {
          try {
            const res = await fetch(asset);
            if (res.ok) await cache.put(asset, res);
          } catch {
            // Skip missing optional asset during install
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isShell =
    event.request.mode === 'navigate' ||
    SHELL_ASSETS.some((asset) => event.request.url.endsWith(asset.replace('./', '')));

  if (isShell) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
