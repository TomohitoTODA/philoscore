const CACHE_NAME = 'gakufu-v1';

// オフライン時に提供するアセット（vendor + フォントは除く）
const PRECACHE = [
  './',
  './index.html',
  './script.js',
  './favicon.svg',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/pdf-lib.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Google API・Drive・gsi はネットワーク優先（キャッシュしない）
  const url = e.request.url;
  if (url.includes('googleapis.com') || url.includes('accounts.google.com') || url.includes('fonts.')) {
    return;
  }

  // キャッシュファースト戦略
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // 成功したレスポンスをキャッシュに追加
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // オフライン時に index.html を返す（ナビゲーションリクエストのみ）
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
