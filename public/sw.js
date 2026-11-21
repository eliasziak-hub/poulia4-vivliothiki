/* POULIA4 · Βιβλιοθήκη Ορνιθολογίας — Service Worker.
   Αύξησε το VERSION κάθε φορά που ανεβάζεις νέα αρχεία (και νέα δεδομένα), ώστε οι εγκατεστημένες εφαρμογές να ενημερωθούν. */
const VERSION = '1.0.0';
const SHELL_CACHE = 'p4lib-shell-' + VERSION;
const DATA_CACHE = 'p4lib-data-v1';
const IMG_CACHE = 'p4lib-img-v1';
const IMG_LIMIT = 2600;
const ICONS = ['apple-touch-icon.png', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon.svg'].map(n => 'icons/' + n);
const SHELL = ['./', 'index.html', 'app.css', 'library.js', 'linker.js', 'portraits.js', 'data/index.js', 'manifest.webmanifest'].concat(ICONS);
const IMG_HOSTS = /(^|\.)(googleusercontent\.com|ggpht\.com|bp\.blogspot\.com)$/;

async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL.map(async u => {
      const res = await fetch(new Request(u, { cache: 'reload' }));
      if (!res.ok) throw new Error('precache ' + u + ' ' + res.status);
      await cache.put(u, await clean(res));
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('p4lib-shell-') && k !== SHELL_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  else if (d.type === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: VERSION });
});

async function trimImages(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - IMG_LIMIT; i++) await cache.delete(keys[i]);
}

async function imageStrategy(request) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(request.url);
  if (hit) return hit;
  try {
    const res = await fetch(new Request(request.url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' }));
    if (res.ok) cache.put(request.url, res.clone()).then(() => trimImages(cache)).catch(() => {});
    return res;
  } catch (e) {
    try { return await fetch(request); } catch (e2) { return Response.error(); }
  }
}

async function dataStrategy(request) {            // stale-while-revalidate για τα τμήματα άρθρων
  const cache = await caches.open(DATA_CACHE);
  const hit = await cache.match(request.url);
  const net = fetch(request).then(res => { if (res.ok) cache.put(request.url, res.clone()); return res; }).catch(() => null);
  if (hit) { net.catch(() => {}); return hit; }
  const res = await net;
  return res || new Response('offline', { status: 503 });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (IMG_HOSTS.test(url.hostname)) { event.respondWith(imageStrategy(req)); return; }
  if (url.origin !== location.origin) return;
  if (/\/data\/b\d+\.json$/.test(url.pathname)) { event.respondWith(dataStrategy(req)); return; }
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const key = req.mode === 'navigate' ? './' : url.pathname.replace(/^.*\//, '') || './';
    let hit = await cache.match(req.mode === 'navigate' ? './' : req.url, { ignoreSearch: true });
    if (!hit && req.mode !== 'navigate') hit = await cache.match(key, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); } catch (e) { return (await cache.match('./')) || Response.error(); }
  })());
});
