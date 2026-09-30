// Offline copy of Choo Choo! for the home-screen app (made by app/build.js).
// The pages come from the network when there is one (so an update shows on the next reload), falling back to the
// saved copy after 2.5 s or when offline; icons and the rest come from the saved copy. Every file is saved with
// cache: 'reload', never out of the browser's HTTP cache: GitHub Pages lets that keep a page for 10 minutes, and an
// early version saved a stale page under a new version's name, so the iPad never saw the update.
const CACHE = 'choochoo-a8f5967f21a1';
const FILES = ["./","index.html","builder.html","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","manifest.webmanifest"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode !== 'navigate'){
    e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true })).then(hit => hit || fetch(r)));
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(CACHE), url = r.url.split('?')[0].split('#')[0], saved = await c.match(url);
    const net = fetch(url, { cache: 'no-cache' }).then(res => {
      if (res.redirected) return Response.redirect(res.url, 302); // Safari won't show a redirected page from a worker
      if (res.ok) c.put(url, res.clone());
      return res;
    });
    net.catch(() => {});
    if (!saved) return net;
    try { return await Promise.race([net, new Promise((_, no) => setTimeout(no, 2500))]); }
    catch (_) { return saved; }
  })());
});
