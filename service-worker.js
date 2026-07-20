const CACHE_NAME = 'gakufu-v3';

// バージョン付きアセットのみキャッシュ（HTMLは常にネットワーク優先）
const PRECACHE = [
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/pdf-lib.min.js',
  './favicon.svg',
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
  const url = new URL(e.request.url);

  // Google API・Drive・フォントはSWを素通り
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    return;
  }

  // HTML ナビゲーションリクエスト → ネットワーク優先、失敗時だけキャッシュ
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // バージョン付きアセット（?v= 含む）→ キャッシュ優先
  if (url.search.includes('v=')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // vendor / favicon など静的アセット → キャッシュ優先
  if (url.pathname.startsWith('/philoscore/vendor/') || url.pathname.endsWith('.svg')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // それ以外 → ネットワーク（SW は介在しない）
});
