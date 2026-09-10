/* =====================================================================
   Bluneuron — "Launching Soon" landing page
   Minimal behaviour: current year, early-access modal, and a VIP
   sign-up form saved to localStorage. No dependencies.
   The page is still usable without JS (see the <noscript> fallback).
   ===================================================================== */

(function () {
  'use strict';
  var doc = document;

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Live countdown ---------- */
  var cd = doc.getElementById('countdown');
  if (cd) {
    var target = Date.parse(cd.getAttribute('data-launch') || '');
    if (isNaN(target)) {
      var fb = new Date();
      fb.setDate(fb.getDate() + 30);
      target = fb.getTime();
    }
    var slot = {
      days: cd.querySelector('[data-cd="days"]'),
      hours: cd.querySelector('[data-cd="hours"]'),
      minutes: cd.querySelector('[data-cd="minutes"]'),
      seconds: cd.querySelector('[data-cd="seconds"]')
    };
    var liveEl = doc.querySelector('[data-cd-live]');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var cdTimer = null;
    var renderCountdown = function () {
      var diff = target - Date.now();
      if (diff <= 0) {
        cd.classList.add('is-live');
        Object.keys(slot).forEach(function (k) { if (slot[k]) slot[k].textContent = '00'; });
        if (liveEl) liveEl.hidden = false;
        if (cdTimer) clearInterval(cdTimer);
        return;
      }
      var s = Math.floor(diff / 1000);
      if (slot.days) slot.days.textContent = pad(Math.floor(s / 86400));
      if (slot.hours) slot.hours.textContent = pad(Math.floor(s / 3600) % 24);
      if (slot.minutes) slot.minutes.textContent = pad(Math.floor(s / 60) % 60);
      if (slot.seconds) slot.seconds.textContent = pad(s % 60);
    };
    renderCountdown();
    cdTimer = setInterval(renderCountdown, 1000);
  }

  /* ---------- Early-access modal ---------- */
  var modal = doc.getElementById('earlyAccess');
  if (modal) {
    var lastFocus = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    var openModal = function () {
      lastFocus = doc.activeElement;
      modal.hidden = false;
      void modal.offsetWidth;               // force reflow so the transition runs
      modal.classList.add('is-open');
      doc.body.classList.add('modal-open');
      var el = modal.querySelector('input, button');
      if (el) setTimeout(function () { el.focus(); }, 70);
    };
    var closeModal = function () {
      modal.classList.remove('is-open');
      doc.body.classList.remove('modal-open');
      setTimeout(function () { modal.hidden = true; }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    doc.querySelectorAll('[data-modal-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(); });
    });
    modal.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = modal.querySelectorAll(FOCUSABLE);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- VIP sign-up form ----------
     Submits to the form's `action` (save.php by default), which appends
     the row to data/leads.csv on the server. Also keeps a local copy in
     localStorage as a safety net and fires a bubbling `bluneuron:signup`
     event for any other integration. */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var STORE_KEY = 'bluneuron_waitlist';

  doc.querySelectorAll('form[data-vip]').forEach(function (form) {
    var wrap = form.closest('[data-vip-wrap]') || form.parentNode;
    var nameEl = form.querySelector('[name="name"]');
    var emailEl = form.querySelector('[name="email"]');
    var phoneEl = form.querySelector('[name="phone"]');
    var hpEl = form.querySelector('[name="company"]');       // honeypot
    var success = wrap.querySelector('[data-vip-success]');
    var errorEl = form.querySelector('[data-vip-error]');
    var submitBtn = form.querySelector('[type="submit"]');
    var endpoint = form.getAttribute('action') || 'save.php';

    [nameEl, emailEl, phoneEl].forEach(function (el) {
      if (el) el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); });
    });

    var showSuccess = function (entry) {
      try {
        var list = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
        list.push(entry);
        window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
      } catch (err) { /* storage blocked — ignore */ }
      form.dispatchEvent(new CustomEvent('bluneuron:signup', { detail: entry, bubbles: true }));
      form.hidden = true;
      if (success) success.hidden = false;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;

      if (!emailEl || !EMAIL.test(emailEl.value.trim())) {
        if (emailEl) { emailEl.setAttribute('aria-invalid', 'true'); emailEl.focus(); }
        return;
      }

      var entry = {
        name: (nameEl && nameEl.value.trim()) || '',
        email: emailEl.value.trim(),
        phone: (phoneEl && phoneEl.value.trim()) || '',
        company: (hpEl && hpEl.value) || '',
        ts: new Date().toISOString()
      };

      if (submitBtn) { submitBtn.disabled = true; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(entry)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        showSuccess(entry);
      }).catch(function () {
        // network / server error — keep a local copy and let the visitor retry or email us
        try {
          var list = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
          list.push(entry);
          window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
        } catch (err) {}
        if (submitBtn) { submitBtn.disabled = false; }
        if (errorEl) { errorEl.hidden = false; }
        else { showSuccess(entry); }
      });
    });
  });
})();
