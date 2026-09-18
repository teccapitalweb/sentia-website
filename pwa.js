/* ═══════════════════════════════════════════════════════════════════════════
   SENTIA México · Capa PWA
   1. Registra el service worker (sw.js) en todas las páginas que lo carguen.
   2. Solo en la portada: ofrece instalar el sitio como app.
      · Android / Chrome / Edge → botón nativo vía beforeinstallprompt
      · iPhone / iPad (Safari)  → instrucción "Compartir → Añadir a inicio",
                                  que es la única vía que permite iOS.
   El aviso no reaparece si el usuario lo cierra, ni si ya está instalada.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Service worker ─────────────────────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* silencioso: sin SW el sitio funciona igual, solo sin modo offline */
      });
    });
  }

  /* ── 2. Invitación a instalar (solo portada) ───────────────────────────── */

  var enPortada = /(^\/?$|\/index\.html$)/.test(location.pathname);
  if (!enPortada) return;

  var CLAVE = 'sentia_install_cerrado';
  var yaInstalada =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (yaInstalada) return;
  try { if (localStorage.getItem(CLAVE)) return; } catch (e) { /* modo privado */ }

  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var promptDiferido = null;

  function estilos() {
    if (document.getElementById('bn-install-css')) return;
    var s = document.createElement('style');
    s.id = 'bn-install-css';
    s.textContent = [
      '#bn-install{position:fixed;left:12px;right:12px;z-index:60;',
      '  bottom:calc(12px + env(safe-area-inset-bottom,0px));',
      '  display:flex;align-items:center;gap:12px;padding:12px 14px;',
      '  background:rgba(255,255,255,.97);border:1px solid #dce5f1;border-radius:18px;',
      '  box-shadow:0 18px 44px rgba(3,10,28,.18);',
      '  font-family:Inter,system-ui,sans-serif;color:#0f172a;',
      '  transform:translateY(140%);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
      '#bn-install.bn-visible{transform:translateY(0)}',
      '#bn-install img{width:42px;height:42px;border-radius:12px;flex:0 0 auto;object-fit:cover}',
      '#bn-install .bn-txt{flex:1;min-width:0}',
      '#bn-install strong{display:block;font-size:.94rem;font-weight:800;line-height:1.25}',
      '#bn-install span{display:block;font-size:.8rem;color:#5b6b88;line-height:1.35;margin-top:2px}',
      '#bn-install button{font-family:inherit;cursor:pointer;border:none;border-radius:12px}',
      '#bn-install .bn-ok{min-height:44px;padding:0 16px;font-weight:800;font-size:.9rem;',
      '  color:#fff;background:linear-gradient(135deg,#06b6d4,#0891b2);flex:0 0 auto}',
      '#bn-install .bn-no{min-width:44px;min-height:44px;background:none;color:#5b6b88;',
      '  font-size:1.5rem;line-height:1;flex:0 0 auto}',
      '@media (min-width:781px){#bn-install{left:auto;right:18px;max-width:400px}}',
      '@media (prefers-reduced-motion:reduce){#bn-install{transition:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function cerrar(banner) {
    banner.classList.remove('bn-visible');
    document.body.classList.remove('bn-con-banner');
    try { localStorage.setItem(CLAVE, '1'); } catch (e) {}
    setTimeout(function () { banner.remove(); }, 400);
  }

  function mostrar(titulo, detalle, textoBoton, alPulsar) {
    estilos();
    var b = document.createElement('div');
    b.id = 'bn-install';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Instalar SENTIA México');

    var icono = document.createElement('img');
    icono.src = 'icon-192.png';
    icono.alt = '';

    var txt = document.createElement('div');
    txt.className = 'bn-txt';
    var t = document.createElement('strong'); t.textContent = titulo;
    var d = document.createElement('span'); d.textContent = detalle;
    txt.appendChild(t); txt.appendChild(d);

    b.appendChild(icono);
    b.appendChild(txt);

    if (textoBoton) {
      var ok = document.createElement('button');
      ok.className = 'bn-ok';
      ok.type = 'button';
      ok.textContent = textoBoton;
      ok.addEventListener('click', function () { alPulsar(b); });
      b.appendChild(ok);
    }

    var no = document.createElement('button');
    no.className = 'bn-no';
    no.type = 'button';
    no.setAttribute('aria-label', 'Cerrar');
    no.textContent = '×';
    no.addEventListener('click', function () { cerrar(b); });
    b.appendChild(no);

    document.body.appendChild(b);
    // Avisa al CSS para que el botón flotante de WhatsApp suba y no quede
    // debajo del aviso (ver mobile.css). Publicamos la altura real del aviso
    // porque cambia según cuánto ocupe el texto en cada pantalla.
    document.body.style.setProperty('--bn-banner-h', b.offsetHeight + 'px');
    document.body.classList.add('bn-con-banner');
    // setTimeout en vez de requestAnimationFrame: si la pestaña está en
    // segundo plano rAF no se ejecuta y el aviso se quedaría escondido
    // fuera de pantalla. Basta un instante para que el elemento ya esté
    // en el DOM y la transición se vea.
    setTimeout(function () { b.classList.add('bn-visible'); }, 60);
  }

  /* Android / escritorio: el navegador avisa cuando la app es instalable */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptDiferido = e;
    mostrar(
      'Instala SENTIA México',
      'Ábrelo desde tu pantalla de inicio, como una app.',
      'Instalar',
      function (banner) {
        banner.classList.remove('bn-visible');
        promptDiferido.prompt();
        promptDiferido.userChoice.then(function () {
          try { localStorage.setItem(CLAVE, '1'); } catch (e) {}
          banner.remove();
          promptDiferido = null;
        });
      }
    );
  });

  /* iOS no expone beforeinstallprompt: solo queda explicar el gesto */
  if (esIOS) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (document.getElementById('bn-install')) return;
        mostrar(
          'Añádelo a tu pantalla de inicio',
          'Toca Compartir y luego "Añadir a pantalla de inicio".',
          null,
          null
        );
      }, 2500);
    });
  }

  /* Si termina instalándose, no volvemos a insistir */
  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem(CLAVE, '1'); } catch (e) {}
    var b = document.getElementById('bn-install');
    if (b) b.remove();
  });
})();
