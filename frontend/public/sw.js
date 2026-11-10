const C = 'bydoor-v2';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['/', '/logo.png']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api')) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request).then(m => m || caches.match('/'))));
});

// ---- Push notifications (new order alerts for the admin) ----
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const code = d.orderId || '';
  e.waitUntil(self.registration.showNotification(d.title || ('🛒 New order' + (code ? ' #' + code : '')), {
    body: d.body || (d.total ? 'Total: Rs ' + Number(d.total).toLocaleString('en-US') : 'Open the admin panel'),
    icon: '/icon-192.png', badge: '/favicon.png', tag: 'order-' + (code || Date.now()), renotify: true, requireInteraction: true,
    vibrate: [300, 120, 300, 120, 600], timestamp: Date.now(), data: { url: d.url || '/bd-admin' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || '/bd-admin';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.includes('/bd-admin') && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
