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
     Saves to localStorage and fires a `bluneuron:signup` event on the
     form (bubbles) so a backend integration can listen without touching
     this file. Wire a real endpoint by adding `action`/`method` to the
     <form> or a fetch() call where noted below. */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var STORE_KEY = 'bluneuron_waitlist';

  doc.querySelectorAll('form[data-vip]').forEach(function (form) {
    var wrap = form.closest('[data-vip-wrap]') || form.parentNode;
    var nameEl = form.querySelector('[name="name"]');
    var emailEl = form.querySelector('[name="email"]');
    var phoneEl = form.querySelector('[name="phone"]');
    var success = wrap.querySelector('[data-vip-success]');

    [nameEl, emailEl, phoneEl].forEach(function (el) {
      if (el) el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!emailEl || !EMAIL.test(emailEl.value.trim())) {
        if (emailEl) { emailEl.setAttribute('aria-invalid', 'true'); emailEl.focus(); }
        return;
      }

      var entry = {
        name: (nameEl && nameEl.value.trim()) || '',
        email: emailEl.value.trim(),
        phone: (phoneEl && phoneEl.value.trim()) || '',
        ts: new Date().toISOString()
      };

      try {
        var list = JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]');
        list.push(entry);
        window.localStorage.setItem(STORE_KEY, JSON.stringify(list));
      } catch (err) { /* storage blocked — still confirm to the visitor */ }

      // Backend hook — listen for this anywhere, or POST here:
      // fetch('/api/waitlist', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry) });
      form.dispatchEvent(new CustomEvent('bluneuron:signup', { detail: entry, bubbles: true }));

      form.hidden = true;
      if (success) success.hidden = false;
    });
  });
})();
