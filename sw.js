/* SENTIA · sw.js de retiro (kill-switch)
   El club se movió a club.sentiamx.com. Este SW reemplaza al anterior en los
   navegadores que ya lo tenían instalado: borra sus cachés, se desregistra y
   recarga las pestañas abiertas para que vean el sitio fresco.
   Déjalo publicado 4-6 semanas y después puedes borrarlo. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});
