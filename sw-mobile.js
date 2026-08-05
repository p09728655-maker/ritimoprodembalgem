// Service worker mínimo do RitmoProd Mobile.
// Objetivo: tornar o app instalável (atalho na tela inicial / PWA).
// Estratégia network-first: sempre tenta buscar a versão mais nova online
// e só usa o cache como reserva quando estiver offline. Assim os deploys
// novos aparecem normalmente, sem ficar preso em versão antiga.

// Controle de versão: este número tem que subir junto com o APP_VER do
// `ritmoprod_mobile.html`. É a troca do nome do cache que faz o navegador
// instalar o SW novo — e é isso que dispara o aviso "Nova versão disponível"
// para quem está com o app instalado.
const CACHE = 'ritmoprod-mobile-v9';   // APP_VER 1.7.0

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
  // Só o que é do próprio site (HTML/ícones/manifest). As chamadas ao Apps Script
  // (JSONP) ficam de fora: cacheadas, poderiam devolver produção antiga como se
  // fosse a de agora.
  if (new URL(e.request.url).origin !== self.location.origin) return;
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
