// Service Worker for Spotify Analyzer PWA
// Enables offline functionality and app-like experience

const CACHE_NAME = 'spotify-analyzer-v1';
const ASSETS_TO_CACHE = [
    'spotify_analyzer_PWA.html',
    'manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('📂 Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('🌐 Fetching from network:', event.request.url);
                return fetch(event.request).then((response) => {
                    // Don't cache POST requests or non-successful responses
                    if (event.request.method !== 'GET' || !response || response.status !== 200) {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the fetched response for future use
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
            .catch((error) => {
                console.error('❌ Fetch failed:', error);
                // Could return a custom offline page here
            })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Background sync (for future features)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('🔄 Background sync triggered');
        // Add background sync logic here if needed
    }
});

console.log('🎵 Spotify Analyzer Service Worker loaded');
