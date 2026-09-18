(function () {
  'use strict';

  function delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function list(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function MembershipTour(config) {
    this.config = config || {};
    this.steps = list(this.config.steps);
    this.active = false;
    this.current = -1;
    this.anchor = null;
    this.root = null;
    this.previousFocus = null;
    this.autoStartedAt = Date.now();
    this.autoTimer = null;
    this.resizeTimer = null;
    this.boundReposition = this.reposition.bind(this);
    this.boundResize = this.onResize.bind(this);
    this.boundKeydown = this.onKeydown.bind(this);
    this.install();
  }

  MembershipTour.prototype.identity = function () {
    var raw = typeof this.config.identity === 'function' ? this.config.identity() : this.config.identity;
    return String(raw || '').trim().toLowerCase();
  };

  MembershipTour.prototype.storageKey = function () {
    return [this.config.namespace || 'membership', 'onboarding', this.config.version || 'v1', encodeURIComponent(this.identity())].join(':');
  };

  MembershipTour.prototype.wasSeen = function () {
    if (!this.identity()) return false;
    try { return !!localStorage.getItem(this.storageKey()); } catch (_) { return false; }
  };

  MembershipTour.prototype.markSeen = function () {
    if (!this.identity()) return;
    try { localStorage.setItem(this.storageKey(), JSON.stringify({ completedAt: new Date().toISOString() })); } catch (_) {}
  };

  MembershipTour.prototype.isReady = function () {
    if (document.visibilityState === 'hidden') return false;
    if (typeof this.config.ready === 'function' && !this.config.ready()) return false;
    return !!this.identity();
  };

  MembershipTour.prototype.isVisible = function (el) {
    if (!el || !el.isConnected || !el.getClientRects().length) return false;
    var style = getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 2 && rect.height > 2;
  };

  MembershipTour.prototype.hasBlockingDialog = function () {
    var self = this;
    return Array.prototype.some.call(document.querySelectorAll('[role="dialog"],#name-modal,#splash-bienvenida,#splash-completado,#cancel-success-splash,.modal-backdrop,.splash-bnv,.splash-cmp,.welcome-splash'), function (el) {
      return el !== self.root && !el.closest('.membership-tour') && self.isVisible(el) && el.getAttribute('aria-hidden') !== 'true';
    });
  };

  MembershipTour.prototype.install = function () {
    var self = this;
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-tour-restart]');
      if (!trigger) return;
      event.preventDefault();
      self.start(true);
    });
    if (this.config.readyEvent) window.addEventListener(this.config.readyEvent, function () { self.queueAuto(); }, { once: true });
    this.queueAuto();
  };

  MembershipTour.prototype.queueAuto = function () {
    var self = this;
    clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(function tick() {
      if (self.active || self.wasSeen()) return;
      if (self.isReady() && !self.hasBlockingDialog()) {
        self.start(false);
        return;
      }
      if (Date.now() - self.autoStartedAt < (self.config.autoWait || 60000)) self.autoTimer = setTimeout(tick, 350);
    }, this.config.autoDelay || 1200);
  };

  MembershipTour.prototype.build = function () {
    if (this.root) return;
    var root = document.createElement('div');
    root.className = 'membership-tour';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="membership-tour__shade" data-tour-shade="top"></div>' +
      '<div class="membership-tour__shade" data-tour-shade="left"></div>' +
      '<div class="membership-tour__shade" data-tour-shade="right"></div>' +
      '<div class="membership-tour__shade" data-tour-shade="bottom"></div>' +
      '<div class="membership-tour__spotlight" aria-hidden="true"></div>' +
      '<div class="membership-tour__guard" aria-hidden="true"></div>' +
      '<section class="membership-tour__dialog" role="dialog" aria-modal="true" aria-labelledby="membership-tour-title" aria-describedby="membership-tour-copy" tabindex="-1">' +
        '<div class="membership-tour__head"><div class="membership-tour__brand"><span class="membership-tour__brand-mark"></span><span data-tour-brand></span></div><button class="membership-tour__skip" type="button" data-tour-skip>Omitir</button></div>' +
        '<div class="membership-tour__progress"><div class="membership-tour__track"><div class="membership-tour__bar"></div></div><span class="membership-tour__count"></span></div>' +
        '<h2 class="membership-tour__title" id="membership-tour-title"></h2>' +
        '<p class="membership-tour__copy" id="membership-tour-copy"></p>' +
        '<div class="membership-tour__actions"><button class="membership-tour__button membership-tour__button--back" type="button" data-tour-back>Anterior</button><button class="membership-tour__button membership-tour__button--next" type="button" data-tour-next>Siguiente</button></div>' +
      '</section>';
    document.body.appendChild(root);
    this.root = root;
    this.dialog = root.querySelector('.membership-tour__dialog');
    this.spotlight = root.querySelector('.membership-tour__spotlight');
    this.guard = root.querySelector('.membership-tour__guard');
    this.title = root.querySelector('.membership-tour__title');
    this.copy = root.querySelector('.membership-tour__copy');
    this.count = root.querySelector('.membership-tour__count');
    this.bar = root.querySelector('.membership-tour__bar');
    this.backButton = root.querySelector('[data-tour-back]');
    this.nextButton = root.querySelector('[data-tour-next]');
    root.querySelector('[data-tour-brand]').textContent = this.config.brand || 'Recorrido guiado';
    root.querySelector('[data-tour-skip]').addEventListener('click', this.finish.bind(this, true));
    this.backButton.addEventListener('click', this.previous.bind(this));
    this.nextButton.addEventListener('click', this.next.bind(this));
  };

  MembershipTour.prototype.isMobile = function () {
    return window.matchMedia('(max-width:' + (this.config.mobileBreakpoint || 900) + 'px)').matches;
  };

  MembershipTour.prototype.setDrawer = async function (open) {
    if (!this.isMobile()) open = false;
    var drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;
    var isOpen = drawer.classList.contains('is-open');
    if (open && !isOpen) {
      var trigger = document.getElementById('mobile-nav-more');
      if (trigger) trigger.click();
      else { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); }
      await delay(330);
    } else if (!open && isOpen) {
      if (typeof window.cerrarDrawerMovil === 'function') window.cerrarDrawerMovil();
      else {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      await delay(70);
    }
  };

  MembershipTour.prototype.findAnchor = function (step) {
    var selectors = this.isMobile() ? (step.mobileSelectors || step.selectors) : (step.desktopSelectors || step.selectors);
    var self = this;
    var found = null;
    list(selectors).some(function (selector) {
      return Array.prototype.some.call(document.querySelectorAll(selector), function (el) {
        if (!self.isVisible(el)) return false;
        found = el;
        return true;
      });
    });
    return found;
  };

  MembershipTour.prototype.start = function (force) {
    if (this.active || !this.steps.length || (!force && this.wasSeen())) return;
    this.build();
    this.active = true;
    this.previousFocus = document.activeElement;
    this.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('membership-tour-open');
    window.addEventListener('resize', this.boundResize, { passive: true });
    window.addEventListener('scroll', this.boundReposition, { passive: true, capture: true });
    document.addEventListener('keydown', this.boundKeydown);
    this.show(0, 1);
  };

  MembershipTour.prototype.show = async function (index, direction) {
    if (!this.active) return;
    var nextIndex = index;
    var step, anchor;
    while (nextIndex >= 0 && nextIndex < this.steps.length) {
      step = this.steps[nextIndex];
      await this.setDrawer(!!step.mobileDrawer);
      anchor = this.findAnchor(step);
      if (anchor) break;
      nextIndex += direction;
    }
    if (!anchor) { this.finish(true); return; }
    if (this.anchor) this.anchor.removeAttribute('data-membership-tour-active');
    this.current = nextIndex;
    this.anchor = anchor;
    anchor.setAttribute('data-membership-tour-active', 'true');
    var rect = anchor.getBoundingClientRect();
    if (rect.top < 10 || rect.bottom > window.innerHeight - 10) {
      anchor.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      await delay(240);
    }
    this.title.textContent = step.title;
    this.copy.textContent = step.copy;
    this.count.textContent = 'Paso ' + (nextIndex + 1) + ' de ' + this.steps.length;
    this.bar.style.width = (((nextIndex + 1) / this.steps.length) * 100) + '%';
    this.backButton.disabled = nextIndex === 0;
    this.nextButton.textContent = nextIndex === this.steps.length - 1 ? 'Finalizar' : 'Siguiente';
    this.reposition();
    this.nextButton.focus({ preventScroll: true });
  };

  MembershipTour.prototype.next = function () {
    if (this.current >= this.steps.length - 1) this.finish(true);
    else this.show(this.current + 1, 1);
  };

  MembershipTour.prototype.previous = function () {
    if (this.current > 0) this.show(this.current - 1, -1);
  };

  MembershipTour.prototype.reposition = function () {
    if (!this.active || !this.anchor || !this.isVisible(this.anchor)) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var source = this.anchor.getBoundingClientRect();
    var pad = 7;
    var left = clamp(source.left - pad, 6, vw - 12);
    var top = clamp(source.top - pad, 6, vh - 12);
    var right = clamp(source.right + pad, 12, vw - 6);
    var bottom = clamp(source.bottom + pad, 12, vh - 6);
    var width = Math.max(6, right - left);
    var height = Math.max(6, bottom - top);
    var shades = {};
    Array.prototype.forEach.call(this.root.querySelectorAll('[data-tour-shade]'), function (el) { shades[el.dataset.tourShade] = el; });
    Object.assign(shades.top.style, { left: '0px', top: '0px', width: vw + 'px', height: top + 'px' });
    Object.assign(shades.left.style, { left: '0px', top: top + 'px', width: left + 'px', height: height + 'px' });
    Object.assign(shades.right.style, { left: right + 'px', top: top + 'px', width: Math.max(0, vw - right) + 'px', height: height + 'px' });
    Object.assign(shades.bottom.style, { left: '0px', top: bottom + 'px', width: vw + 'px', height: Math.max(0, vh - bottom) + 'px' });
    [this.spotlight, this.guard].forEach(function (el) { Object.assign(el.style, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' }); });

    this.dialog.style.left = '12px';
    this.dialog.style.top = '12px';
    this.dialog.style.bottom = 'auto';
    var dialogRect = this.dialog.getBoundingClientRect();
    var gap = 17;
    var dialogLeft, dialogTop;
    if (this.isMobile()) {
      dialogLeft = 12;
      dialogTop = source.top > vh / 2 ? 12 : Math.max(12, vh - dialogRect.height - 12);
    } else if (right + gap + dialogRect.width <= vw - 12) {
      dialogLeft = right + gap;
      dialogTop = clamp(top, 12, Math.max(12, vh - dialogRect.height - 12));
    } else if (left - gap - dialogRect.width >= 12) {
      dialogLeft = left - gap - dialogRect.width;
      dialogTop = clamp(top, 12, Math.max(12, vh - dialogRect.height - 12));
    } else if (bottom + gap + dialogRect.height <= vh - 12) {
      dialogLeft = clamp((left + right - dialogRect.width) / 2, 12, vw - dialogRect.width - 12);
      dialogTop = bottom + gap;
    } else {
      dialogLeft = clamp((left + right - dialogRect.width) / 2, 12, vw - dialogRect.width - 12);
      dialogTop = Math.max(12, top - gap - dialogRect.height);
    }
    this.dialog.style.left = Math.round(dialogLeft) + 'px';
    this.dialog.style.top = Math.round(dialogTop) + 'px';
  };

  MembershipTour.prototype.onResize = function () {
    var self = this;
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(function () {
      if (self.active) self.show(self.current, 1);
    }, 120);
  };

  MembershipTour.prototype.onKeydown = function (event) {
    if (!this.active) return;
    if (event.key === 'Escape') { event.preventDefault(); this.finish(true); return; }
    if (event.key === 'ArrowRight') { event.preventDefault(); this.next(); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); this.previous(); return; }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.filter.call(this.dialog.querySelectorAll('button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'), this.isVisible.bind(this));
    if (!focusable.length) { event.preventDefault(); this.dialog.focus(); return; }
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  MembershipTour.prototype.finish = async function (remember) {
    if (!this.active) return;
    if (remember) this.markSeen();
    this.active = false;
    if (this.anchor) this.anchor.removeAttribute('data-membership-tour-active');
    this.anchor = null;
    this.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('membership-tour-open');
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('scroll', this.boundReposition, true);
    document.removeEventListener('keydown', this.boundKeydown);
    await this.setDrawer(false);
    if (this.previousFocus && this.previousFocus.isConnected && typeof this.previousFocus.focus === 'function') this.previousFocus.focus({ preventScroll: true });
  };

  window.MembershipTour = MembershipTour;
})();
