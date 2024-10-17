const CACHE_NAME = 'my-app-cache-v3';
   const urlsToCache = [
     '/',
     '/manifest.json',
     '/mastercard.svg',
     '/icons/192.png',
     '/icons/512.png'
   ];

   self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  console.log("Service worker activating.")
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                    return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
  console.log("Service worker fetching.")
  if (event.request.url.includes('/api/convert')) {
    // For API requests, bypass the cache and always go to network
    return event.respondWith(
      fetch(event.request.clone(), { cache: 'no-store' })
        .catch(error => {
          console.error('Fetch error in service worker:', error);
          throw error;
        })
    );
  }
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }
  
          // Clone the request because it's a stream and can only be consumed once
          const fetchRequest = event.request.clone();
  
          return fetch(fetchRequest).then(
            (response) => {
              // Check if we received a valid response
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
  
              // Check if the URL scheme is supported for caching
              const url = new URL(event.request.url);
              if (!['http:', 'https:'].includes(url.protocol)) {
                return response;
              }
  
              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = response.clone();
  
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
  
              return response;
            }
          );
        })
        .catch(() => {
          // If both cache and network fail, show a generic fallback
          return caches.match('/offline.html');
        })
    );
});