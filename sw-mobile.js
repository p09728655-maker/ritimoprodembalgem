// Service worker mínimo do RitmoProd Mobile.
// Objetivo: tornar o app instalável (atalho na tela inicial / PWA).
// Estratégia network-first: sempre tenta buscar a versão mais nova online
// e só usa o cache como reserva quando estiver offline. Assim os deploys
// novos aparecem normalmente, sem ficar preso em versão antiga.

const CACHE = 'ritmoprod-mobile-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
