/**
 * PlumberPass Service Worker
 * Handles offline caching, background audio, and push notifications
 * @version 1.0.0
 * @module ServiceWorker
 */

const CACHE_NAME = 'plumberpass-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/onyx-theme.css',
  '/js/app.js',
  '/js/audio-engine.js',
  '/js/srs-engine.js',
  '/js/quiz-engine.js',
  '/data/questions.js',
  '/manifest.json'
];

// ============================================
// INSTALL: Cache static assets
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Cache failed:', err))
  );
});

// ============================================
// ACTIVATE: Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH: Serve from cache, fallback to network
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // API calls: Network first, cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Static assets: Cache first, network fallback
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-first strategy for static assets
 * Fastest load times for CSS/JS/HTML
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>}
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Refresh cache in background
    fetch(request)
      .then((response) => cache.put(request, response))
      .catch(() => {});
    return cached;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline - Content not cached', { status: 503 });
  }
}

/**
 * Network-first strategy for API calls
 * Ensures fresh data when online, fallback when offline
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>}
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Return empty data structure for offline API calls
    return new Response(
      JSON.stringify({ offline: true, data: [] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================
// BACKGROUND SYNC: Queue progress updates
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressToServer());
  }
});

/**
 * Sync quiz progress to server when connection returns
 * @returns {Promise<void>}
 */
async function syncProgressToServer() {
  console.log('[SW] Syncing progress to server...');
  // Implementation: Read from IndexedDB queue and POST to server
}

// ============================================
// PUSH NOTIFICATIONS: Study reminders
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'study-reminder',
      requireInteraction: data.requireInteraction || false,
      actions: [
        { action: 'start-session', title: 'Start Review' },
        { action: 'dismiss', title: 'Later' }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'start-session') {
    event.waitUntil(
      clients.openWindow('/?mode=audio')
    );
  }
});

// ============================================
// MESSAGE HANDLING: From main app
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
