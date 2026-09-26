/* Banner de consentimiento de cookies del sitio público SENTIA (sentiamx.com).
   Informativo: el sitio usa almacenamiento esencial para preferencias.
   Se muestra una vez; al aceptar, se recuerda en localStorage (por dominio). */
(function () {
  var KEY = 'sentia_cookies_ok';
  var PRIV = 'https://club.sentiamx.com/privacidad.html';
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { /* sin storage: se mostrará siempre */ }

  function montar() {
    if (document.getElementById('sentia-cookies')) return;

    var wrap = document.createElement('div');
    wrap.id = 'sentia-cookies';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Aviso de cookies');
    wrap.innerHTML =
      '<div class="sc-box">' +
        '<div class="sc-txt">Usamos cookies y almacenamiento <b>esenciales</b> para el funcionamiento del sitio y recordar tus preferencias. No usamos cookies de publicidad. ' +
        'Consulta nuestro <a href="' + PRIV + '" target="_blank" rel="noopener">Aviso de Privacidad</a>.</div>' +
        '<button type="button" class="sc-btn" id="sc-ok">Entendido</button>' +
      '</div>';

    var st = document.createElement('style');
    st.textContent =
      '#sentia-cookies{position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:14px;display:flex;justify-content:center;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#sentia-cookies .sc-box{pointer-events:auto;max-width:720px;width:100%;display:flex;gap:14px;align-items:center;flex-wrap:wrap;' +
        'background:#0f1d38;color:#e6eeff;border:1px solid #1e2f52;border-radius:14px;padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.45)}' +
      '#sentia-cookies .sc-txt{flex:1;min-width:220px;font-size:13px;line-height:1.5;color:#c7d4ee}' +
      '#sentia-cookies .sc-txt a{color:#3aa0ff}' +
      '#sentia-cookies .sc-btn{flex:0 0 auto;border:0;border-radius:10px;padding:10px 20px;font-size:13.5px;font-weight:700;cursor:pointer;' +
        'background:linear-gradient(135deg,#1b5df0,#3aa0ff);color:#fff}' +
      '#sentia-cookies .sc-btn:hover{filter:brightness(1.07)}' +
      '@media(max-width:520px){#sentia-cookies .sc-btn{width:100%}}';

    document.head.appendChild(st);
    document.body.appendChild(wrap);
    document.getElementById('sc-ok').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      wrap.remove();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
