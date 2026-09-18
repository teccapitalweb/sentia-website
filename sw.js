/* ═══════════════════════════════════════════════════════════════════════════
   SENTIA México · Service Worker
   Objetivo: que el sitio se pueda instalar como app y cargue rápido, sin que
   nadie llegue a ver contenido viejo.

   Estrategias:
     · Navegación (páginas)  → red primero; si no hay red, caché; si tampoco,
                               offline.html. Nunca se sirve HTML viejo teniendo
                               conexión.
     · Estáticos propios     → stale-while-revalidate: responde al instante con
                               lo cacheado y actualiza en segundo plano.
     · Otro origen           → NO se toca. Firebase, Firestore, Stripe, Bunny y
                               las fuentes de Google siempre van directo a la red.
   ═══════════════════════════════════════════════════════════════════════════ */

const VERSION = 'sentia-v3';
const CACHE_SHELL = VERSION + '-shell';
const CACHE_RUNTIME = VERSION + '-runtime';

/* Lo mínimo para que la app abra aunque el usuario esté sin datos. */
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './mobile.css',
  './script.js',
  './pwa.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* ── Instalación ─────────────────────────────────────────────────────────── */
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_SHELL).then((c) =>
      // Uno por uno: si un archivo faltara, no tumba toda la instalación.
      Promise.all(SHELL.map((url) => c.add(url).catch(() => {})))
    )
  );
});

/* ── Activación: fuera cachés de versiones anteriores ────────────────────── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_SHELL && k !== CACHE_RUNTIME)
            .map((k) => caches.delete(k))
      ))
      // Rehacemos el shell por si el navegador lo vació por falta de espacio:
      // c.add() vuelve a pedir solo lo que falte y es inofensivo si ya está.
      .then(() => caches.open(CACHE_SHELL))
      .then((c) => Promise.all(SHELL.map((url) => c.add(url).catch(() => {}))))
      .then(() => self.clients.claim())
  );
});

/* Mantiene la caché de uso acotada: si se pasa del tope, borra las entradas
   más antiguas (keys() las devuelve en orden de inserción). */
const TOPE_RUNTIME = 80;
function podar(cache) {
  return cache.keys().then((keys) => {
    if (keys.length <= TOPE_RUNTIME) return;
    return Promise.all(
      keys.slice(0, keys.length - TOPE_RUNTIME).map((k) => cache.delete(k))
    );
  }).catch(() => {});
}

/* ── Peticiones ──────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Solo gestionamos nuestro propio origen.
  if (url.origin !== self.location.origin) return;

  // ── Navegación: red primero ────────────────────────────────────────────
  // Aplica también a vip-panel / vip-admin: teniendo conexión SIEMPRE se sirve
  // el HTML recién publicado, así que actualizar el panel nunca se queda
  // atascado en una versión vieja. La copia en caché solo entra en juego
  // cuando no hay red.
  if (req.mode === 'navigate') {
    // Guardamos SIN query string. Si no, cada ?utm_source=…, ?fbclid=… o
    // ?source=pwa crearía una copia distinta de la misma página y la caché
    // crecería sin freno.
    const clave = url.origin + url.pathname;
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_RUNTIME)
              .then((c) => c.put(clave, copy).then(() => podar(c)))
              .catch(() => {});
          }
          return res;
        })
        // Sin red: la propia página si ya se visitó; si no, el aviso de
        // "sin conexión". NO devolvemos la portada en su lugar: sería
        // desconcertante ver el inicio con vip-panel.html en la barra.
        .catch(() =>
          caches.match(clave).then((r) => r || caches.match('./offline.html'))
        )
    );
    return;
  }

  // ── Estáticos: stale-while-revalidate ──────────────────────────────────
  if (/\.(css|js|png|jpg|jpeg|webp|svg|woff2?|ico|json)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_RUNTIME)
                .then((c) => c.put(req, copy).then(() => podar(c)))
                .catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // ── Resto: red con respaldo en caché ───────────────────────────────────
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
