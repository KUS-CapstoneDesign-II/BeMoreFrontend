const CACHE_NAME = 'bemore-v1';
const RUNTIME_CACHE = 'bemore-runtime-v1';

// 캐시할 정적 파일 목록
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💾 Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 처리: HTML은 Network-first with fallback, JSON은 SWR, 기타는 Cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 캐싱하지 않음
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return;
  }

  // GET 요청만 캐싱
  if (request.method !== 'GET') {
    return;
  }

  if (request.destination === 'document') {
    // Network-first: 실패 시 캐시된 index.html
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (request.headers.get('accept')?.includes('application/json')) {
    // Stale-While-Revalidate for JSON
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Default cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return caches.open(RUNTIME_CACHE).then((cache) => fetch(request).then((response) => {
        if (response && response.status === 200) cache.put(request, response.clone());
        return response;
      }));
    })
  );
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
