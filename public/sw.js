const VERSION = 'v1.2.0';
const CACHE_NAME = `bemore-${VERSION}`;
const RUNTIME_CACHE = `bemore-runtime-${VERSION}`;
const IMAGE_CACHE = `bemore-images-${VERSION}`;
const ASSETS_CACHE = `bemore-assets-${VERSION}`;

// Cache size limits (in bytes)
const CACHE_LIMITS = {
  images: 50 * 1024 * 1024, // 50MB
  assets: 100 * 1024 * 1024, // 100MB
  runtime: 20 * 1024 * 1024, // 20MB
};

// 캐시할 정적 파일 목록
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(STATIC_CACHE_URLS);
      console.log('💾 Caching static assets');
    } catch (e) {
      // 일부 에셋 실패는 무시
      console.warn('⚠️ Static cache failed for some assets', e);
    }
  })());
  self.skipWaiting();
});

// Utility: Clean cache when it exceeds size limit
async function cleanCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let totalSize = 0;

  for (const request of keys) {
    const response = await cache.match(request);
    if (response && response.ok) {
      const buffer = await response.arrayBuffer();
      totalSize += buffer.byteLength;
    }
  }

  if (totalSize > maxSize) {
    // Delete oldest entries (FIFO)
    for (const request of keys) {
      await cache.delete(request);
      totalSize = 0; // Reset and let next check determine if we need more cleanup
      const remaining = await cache.keys();
      if (remaining.length === 0) break;
    }
  }
}

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME &&
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== IMAGE_CACHE &&
                   cacheName !== ASSETS_CACHE;
          })
          .map((cacheName) => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Clean up oversized caches
  event.waitUntil(
    Promise.all([
      cleanCache(IMAGE_CACHE, CACHE_LIMITS.images),
      cleanCache(ASSETS_CACHE, CACHE_LIMITS.assets),
      cleanCache(RUNTIME_CACHE, CACHE_LIMITS.runtime),
    ])
  );

  self.clients.claim();
});

// 네트워크 요청 처리: HTML은 Network-first with fallback, JSON은 SWR, 이미지는 Cache-first, 기타는 Cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP(S) schemes and extension requests (e.g., chrome-extension:)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API 요청과 WebSocket은 캐싱하지 않음 (실시간 데이터 필요)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return;
  }

  // GET 요청만 캐싱
  if (request.method !== 'GET') {
    return;
  }

  // HTML 문서 처리: Network-first
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with new version
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 이미지 처리: Cache-first with network fallback
  if (request.headers.get('accept')?.includes('image/')) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
        console.warn('❌ Image fetch failed:', request.url);
        throw e;
      }
    })());
    return;
  }

  // JSON 처리: Stale-While-Revalidate (prefer cached but update in background)
  if (request.headers.get('accept')?.includes('application/json')) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);

      // Return cached immediately, update in background
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cached); // Fall back to cached if network fails

      return cached || fetchPromise;
    })());
    return;
  }

  // 스크립트, 스타일시트 등 에셋: Cache-first with network fallback
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (e) {
        console.warn('⚠️ Asset fetch failed:', request.url);
        // Return offline indicator or empty response
        return new Response('Asset unavailable offline', { status: 503 });
      }
    })());
    return;
  }

  // 기타 리소스: Cache-first as default
  event.respondWith((async () => {
    const cache = await caches.open(ASSETS_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (e) {
      console.warn('⚠️ Resource fetch failed:', request.url);
      // Try to match any cached version
      const fallback = await cache.match(request);
      if (fallback) return fallback;
      throw e;
    }
  })());
});

// 주기적인 백그라운드 동기화 (향후 확장용)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    event.waitUntil(
      // 향후 세션 데이터 동기화 로직
      Promise.resolve()
    );
  }
  if (event.tag === 'sync-queued') {
    event.waitUntil(
      (async () => {
        // IndexedDB에 큐된 요청을 재전송하는 로직을 여기에 구현할 수 있습니다.
      })()
    );
  }
});

// Push 알림 (향후 확장용)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || '새로운 알림이 있습니다',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: '확인',
      },
      {
        action: 'close',
        title: '닫기',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('BeMore', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
  if (event.action === 'close') {
    // no-op
  }
});
