/* =========================================================
   NEON ARCADE - SERVICE WORKER (OFFLINE PWA CACHE)
   ========================================================= */

const CACHE_NAME = 'neon-arcade-v18';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/audio.js',
  './js/particles.js',
  './js/daily.js',
  './js/leaderboard.js',
  './js/state.js',
  './js/cursor.js',
  './js/background.js',
  './js/visualizer.js',
  './js/gamepad.js',
  './js/shop.js',
  './js/share.js',
  './js/challenge.js',
  './js/ticker.js',
  './js/attract.js',
  './js/games/snake.js',
  './js/games/space.js',
  './js/games/breakout.js',
  './js/games/flap.js',
  './js/games/memory.js',
  './js/games/aim.js',
  './js/games/racer.js',
  './js/games/vortex.js',
  './js/games/slicer.js',
  './js/games/stacker.js',
  './js/main.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first with offline cache fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.status === 200 && e.request.method === 'GET') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
