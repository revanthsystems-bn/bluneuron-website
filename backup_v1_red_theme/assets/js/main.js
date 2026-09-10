/* =====================================================================
   Bluneuron — Official Website
   Shared behaviour: mobile nav, glass-header state, spec accordions,
   scroll reveal, inline sign-up / newsletter forms, and a light
   pointer-parallax on the hero product image.
   No dependencies. Progressive — the site is fully readable without JS.
   ===================================================================== */

(function () {
  'use strict';
  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = doc.getElementById('navToggle');
  var nav = doc.getElementById('primaryNav');
  var header = doc.getElementById('siteHeader');

  if (toggle && nav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) setNav(false);
    });
  }

  /* ---------- Sticky / glass header state ---------- */
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  /* ---------- Accordions (specs table + FAQs) ---------- */
  doc.querySelectorAll('.accordion__trigger').forEach(function (btn) {
    var panel = doc.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var inner = panel.firstElementChild;

    var apply = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      panel.style.maxHeight = open
        ? (inner ? inner.scrollHeight : panel.scrollHeight) + 'px'
        : '0px';
    };

    if (btn.getAttribute('aria-expanded') === 'true') apply(true);

    btn.addEventListener('click', function () {
      apply(btn.getAttribute('aria-expanded') !== 'true');
    });

    window.addEventListener('resize', function () {
      if (btn.getAttribute('aria-expanded') === 'true' && inner) {
        panel.style.maxHeight = inner.scrollHeight + 'px';
      }
    });
  });

  window.addEventListener('load', function () {
    doc.querySelectorAll('.accordion__trigger[aria-expanded="true"]').forEach(function (btn) {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      if (panel && panel.firstElementChild) {
        panel.style.maxHeight = panel.firstElementChild.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Scroll reveal (fade-up / scale-in) ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero product image: subtle pointer parallax ---------- */
  doc.querySelectorAll('.hero-stage').forEach(function (stage) {
    var img = stage.querySelector('.hero-stage__img');
    if (!img || reduceMotion) return;
    var raf = null;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        img.style.transform =
          'perspective(1000px) rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' +
          (-py * 7).toFixed(2) + 'deg) translateY(' + (py * -8).toFixed(2) + 'px)';
      });
    });
    stage.addEventListener('pointerleave', function () { img.style.transform = ''; });
  });

  /* ---------- Inline sign-up / newsletter forms ----------
     Front-end only: no data leaves the page. Wire form.action to a real
     endpoint (or a service like Mailchimp / Formspree) when ready. */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  doc.querySelectorAll('form[data-signup]').forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var success = form.parentNode.querySelector('[data-signup-success]');

    if (input) {
      input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!input || !EMAIL.test(input.value.trim())) {
        if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
        return;
      }
      form.hidden = true;
      if (success) {
        success.hidden = false;
        var focusable = success.querySelector('a, button');
        if (focusable) focusable.focus();
      }
    });
  });
})();
