// public/sw.js - Nandi Billing Software Service Worker
const CACHE_NAME = 'nandi-billing-v1.0.1';
const APP_SHELL_CACHE = 'nandi-billing-shell-v1';

// Only cache essential files that definitely exist
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        // Use addAll but catch individual failures
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`Service Worker: Failed to cache ${url}`, error);
              // Don't fail the entire installation if one file fails
              return Promise.resolve();
            });
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
        // Even if caching fails, continue with installation
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation completed');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when available
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions and external domains
  if (event.request.url.startsWith('chrome-extension://')) return;
  if (!event.request.url.startsWith('https://nssbillingsoftware.vercel.app')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();

            // Cache successful responses (optional)
            caches.open(APP_SHELL_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // If it's a page request and both cache/network fail, serve offline page
            if (event.request.destination === 'document') {
              return caches.match('/')
                .then((cachedIndex) => {
                  return cachedIndex || new Response('You are offline', { 
                    status: 408,
                    headers: { 'Content-Type': 'text/html' }
                  });
                });
            }
            
            return new Response('Network error', { 
              status: 408 
            });
          });
      })
  );
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Loaded successfully');