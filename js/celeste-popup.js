/* CelesteOS exit popup: self-contained drop-in. ONE line on any page (after cookie-consent.js is fine, not required):
 *   <script src="/js/celeste-popup.js" defer data-api="https://control.celeste7.ai"></script>
 * Uses the native <dialog> + showModal() (focus trap, Esc, backdrop come from the browser). No libraries.
 * Contract: booking-api-contract.md v1.4 (POST /api/book/lead with source=popup).
 *
 * Shown at most once per visitor per 30 days, never on /book*, never after a lead was submitted.
 * Storage is fail-closed: if localStorage throws, the popup does not show.
 * Image: data-image-slot; default /img/hull-light.webp (cropped clear of the bow lettering), /img/popup-lifestyle.webp if it exists,
 * or data-image="/img/x.webp" on the script tag.
 * Optional tuning attributes on the script tag: data-exit-delay (ms on page before exit intent counts, default 8000),
 * data-mobile-fallback (ms before the mobile timer trigger, default 30000), data-mobile-scroll (fraction, default 0.5).
 * Copy lives in elements marked data-copy-slot="..." (heading, body, imo-hint, consent, submit, success-heading,
 * success-body, book): edit COPY below, or override at runtime with window.celestePopupCopy before this script runs.
 */
(function () {
  'use strict';
  if (window.__celestePopup) return;
  window.__celestePopup = true;

  var script = document.currentScript;
  var PROD_API = 'https://control.celeste7.ai';
  var IMG_DEFAULT = '/img/hull-light.webp', IMG_LIFESTYLE = '/img/popup-lifestyle.webp';
  var K_SHOWN = 'celeste_popup_shown', K_LEAD = 'celeste_lead_submitted';
  var DAY = 864e5, WINDOW_MS = 30 * DAY;

  /* PLACEHOLDER COPY: price, offer and magnet wording are undecided. SITE01 / founder fill these in. */
  var COPY = {
    'heading': 'Placeholder heading: the offer goes here',
    'body': 'Placeholder text: one line on what the visitor gets.',
    'imo-hint': 'IMO number (optional)',
    'consent': 'Send me occasional CelesteOS updates by email. Optional; you can unsubscribe at any time.',
    'submit': 'Placeholder button',
    'success-heading': 'Thank you',
    'success-body': 'We have your details. If you would like to talk it through, book a short call.',
    'book': 'Book a call'
  };
  try { var o = window.celestePopupCopy; if (o) for (var ck in o) if (ck in COPY) COPY[ck] = String(o[ck]); } catch (e) {}

  function num(attr, dflt) { var v = script && script.getAttribute(attr); var n = v === null || v === undefined ? NaN : Number(v); return isFinite(n) && n >= 0 ? n : dflt; }
  var EXIT_DELAY = num('data-exit-delay', 8000), MOBILE_FALLBACK = num('data-mobile-fallback', 30000), SCROLL_AT = num('data-mobile-scroll', 0.5);

  /* The data-api override is honoured only on localhost (tests); on a real host the base is production. */
  function apiBase() {
    var h = location.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1') return PROD_API;
    var b = (script && script.getAttribute('data-api')) || '';
    return (b || PROD_API).replace(/\/+$/, '');
  }

  /* Self-contained: pull in its own stylesheet and the events wrapper (same site root as this script) if the page lacks them. */
  try {
    var src = (script && script.src) || '', base = src.replace(/\/js\/[^\/]*$/, '');
    if (src && !document.querySelector('link[href*="celeste-popup.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + '/css/celeste-popup.css'; document.head.appendChild(l);
    }
    if (src && !window.celesteEvents && !document.querySelector('script[src*="celeste-events.js"]')) {
      var s2 = document.createElement('script'); s2.src = base + '/js/celeste-events.js'; s2.defer = true; document.head.appendChild(s2);
    }
  } catch (e) {}

  function track(name) { try { if (window.celesteEvents) window.celesteEvents.track(name); } catch (e) {} }

  /* ---- guards (all fail closed) ---- */
  function onBookPage() { return /^\/book(\/|$)/.test(location.pathname) || /^\/book\.html$/.test(location.pathname); }
  function eligible() {
    if (onBookPage()) return false;
    try {
      if (localStorage.getItem(K_LEAD)) return false;
      var t = Date.parse(localStorage.getItem(K_SHOWN) || '');
      if (!isNaN(t) && Date.now() - t < WINDOW_MS) return false;
      /* prove storage is writable before showing: otherwise it would reappear on every page view */
      localStorage.setItem('celeste_popup_probe', '1'); localStorage.removeItem('celeste_popup_probe');
    } catch (e) { return false; }
    return true;
  }
  function remember(key, val) { try { localStorage.setItem(key, val); return true; } catch (e) { return false; } }

  /* ---- IMO (contract v1.4): 7 digits, check digit (d1*7+...+d6*2)%10 === d7 ---- */
  function cleanImo(v) { return String(v || '').replace(/^\s*imo[\s:#-]*/i, '').replace(/\s+/g, ''); }
  function imoValid(v) {
    var s = cleanImo(v);
    if (!/^\d{7}$/.test(s)) return false;
    var sum = 0; for (var i = 0; i < 6; i++) sum += Number(s[i]) * (7 - i);
    return sum % 10 === Number(s[6]);
  }

  /* ---- DOM ---- */
  var dlg = null, submitted = false, opener = null, shownOnce = false;
  var uid = 'cp' + Math.random().toString(36).slice(2, 7);

  function el(tag, cls, attrs, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    for (var a in (attrs || {})) n.setAttribute(a, attrs[a]);
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function slot(tag, name, cls, attrs) {
    var a = attrs || {}; a['data-copy-slot'] = name;
    return el(tag, cls, a, COPY[name]);
  }
  function field(label, input) {
    var w = el('div', 'cp-field'); w.appendChild(label); w.appendChild(input); return w;
  }

  function build() {
    dlg = el('dialog', 'cp-dialog', { 'aria-labelledby': uid + '-h', 'aria-describedby': uid + '-b' });
    var split = el('div', 'cp-split');
    /* Image slot (left on desktop, top strip on phones). Decorative. Default: the hull photo, cropped so no bow lettering shows.
       If /img/popup-lifestyle.webp exists it replaces it; the include line can also set data-image="/img/x.webp" on the script tag. */
    var fig = el('div', 'cp-figure', { 'data-image-slot': '', 'aria-hidden': 'true' });
    var override = script && script.getAttribute('data-image');
    var img = el('img', 'cp-img', { src: override || IMG_DEFAULT, alt: '', width: '1920', height: '1153', loading: 'lazy', decoding: 'async', 'data-crop': override ? 'custom' : 'hull' });
    fig.appendChild(img); split.appendChild(fig);
    if (!override) {
      var probe = new Image();
      probe.onload = function () { img.src = IMG_LIFESTYLE; img.setAttribute('data-crop', 'custom'); };
      probe.src = IMG_LIFESTYLE;
    }
    var panel = el('div', 'cp-panel');
    split.appendChild(panel);
    var close = el('button', 'cp-close', { type: 'button', 'aria-label': 'Close' }, '\u00d7');
    close.addEventListener('click', function () { dlg.close(); });
    split.appendChild(close);

    var form = el('form', 'cp-form', { novalidate: '' });
    form.appendChild(slot('h2', 'heading', 'cp-h', { id: uid + '-h' }));
    form.appendChild(slot('p', 'body', 'cp-p', { id: uid + '-b' }));

    var imoL = slot('label', 'imo-hint', null, { 'for': uid + '-imo' });
    var imo = el('input', null, { type: 'text', id: uid + '-imo', name: 'imo', inputmode: 'numeric', autocomplete: 'off', maxlength: '12' });
    form.appendChild(field(imoL, imo));
    var emailL = el('label', null, { 'for': uid + '-email' }, 'Email');
    var email = el('input', null, { type: 'email', id: uid + '-email', name: 'email', autocomplete: 'email', required: '', maxlength: '254' });
    form.appendChild(field(emailL, email));
    var nameL = el('label', null, { 'for': uid + '-name' }, 'Name (optional)');
    var name = el('input', null, { type: 'text', id: uid + '-name', name: 'name', autocomplete: 'name', maxlength: '120' });
    var nameBox = field(nameL, name); nameBox.hidden = true;
    var addName = el('button', 'cp-link', { type: 'button', 'aria-expanded': 'false' }, 'Add your name (optional)');
    addName.addEventListener('click', function () { nameBox.hidden = false; addName.hidden = true; addName.setAttribute('aria-expanded', 'true'); name.focus(); });
    form.appendChild(addName); form.appendChild(nameBox);

    var hp = el('div', 'cp-hp', { 'aria-hidden': 'true' });
    hp.appendChild(el('label', null, { 'for': uid + '-web' }, 'Website'));
    hp.appendChild(el('input', null, { type: 'text', id: uid + '-web', name: 'website', tabindex: '-1', autocomplete: 'off' }));
    form.appendChild(hp);

    var cl = el('label', 'cp-check');
    cl.appendChild(el('input', null, { type: 'checkbox', name: 'marketing' }));
    cl.appendChild(slot('span', 'consent'));
    form.appendChild(el('div', 'cp-field'));
    form.lastChild.appendChild(cl);

    var msg = el('p', 'cp-msg', { role: 'alert' });
    form.appendChild(msg);
    var submit = slot('button', 'submit', 'cp-btn', { type: 'submit' });
    form.appendChild(submit);
    var no = el('button', 'cp-link cp-no', { type: 'button' }, 'No thanks');
    no.addEventListener('click', function () { dlg.close(); });
    form.appendChild(no);
    panel.appendChild(form);
    dlg.appendChild(split);
    document.body.appendChild(dlg);

    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); /* backdrop tap */
    dlg.addEventListener('close', function () {
      if (!submitted) track('popup_dismissed');
      try { if (opener && opener.focus) opener.focus(); } catch (e) {}
    });

    var busy = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      msg.textContent = '';
      var em = email.value.trim(), imoRaw = imo.value.trim();
      if (!em || !email.validity.valid) { msg.textContent = 'Please enter a valid email.'; email.focus(); return; }
      if (imoRaw && !imoValid(imoRaw)) { msg.textContent = 'That IMO number does not look right. Check the 7 digits, or leave it blank.'; imo.focus(); return; }
      var a = { anonId: null, utm: { source: null, medium: null, campaign: null, term: null, content: null }, gclid: null };
      try {
        var A = window.celesteAttribution;
        if (A) {
          a.anonId = A.anonId ? (A.anonId() || null) : null;
          var t = A.touch ? A.touch() : {};
          a.utm = { source: t.utm_source || null, medium: t.utm_medium || null, campaign: t.utm_campaign || null, term: t.utm_term || null, content: t.utm_content || null };
          a.gclid = t.gclid || null;
        }
      } catch (x) {}
      var body = {
        imo: imoRaw ? cleanImo(imoRaw) : null, role: 'other', name: name.value.trim() || null, email: em, source: 'popup',
        consent: { marketing: !!form.marketing.checked }, anonId: a.anonId, utm: a.utm, gclid: a.gclid, website: form.website.value
      };
      busy = true; submit.disabled = true;
      fetch(apiBase() + '/api/book/lead', { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d || {} }; }); },
              function () { return { ok: false, data: {} }; })
        .then(function (r) {
          busy = false; submit.disabled = false;
          if (!r.ok) { msg.textContent = 'Sorry, that did not go through. Please try again in a moment.'; return; }
          submitted = true;
          remember(K_LEAD, '1');
          track('popup_submit');
          success(panel, form);
        });
    });
  }

  function success(panel, form) {
    form.hidden = true;
    var box = el('div', 'cp-done');
    box.appendChild(slot('h2', 'success-heading', 'cp-h', { id: uid + '-h' }));
    box.appendChild(slot('p', 'success-body', 'cp-p', { id: uid + '-b' }));
    var link = slot('a', 'book', 'cp-btn', { href: '/book' });
    box.appendChild(link);
    panel.appendChild(box);
    link.focus();
  }

  function show() {
    if (shownOnce || !eligible()) return;
    shownOnce = true; detach();
    if (!remember(K_SHOWN, new Date().toISOString())) return; /* cannot record = do not show (fail closed) */
    opener = document.activeElement;
    build();
    if (typeof dlg.showModal !== 'function') return; /* very old browser: skip rather than render a broken box */
    dlg.showModal();
    track('popup_shown');
    var first = dlg.querySelector('input'); if (first) first.focus();
  }

  /* ---- triggers ---- */
  var t0 = Date.now(), timer = null, cleanup = [];
  function on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); cleanup.push(function () { target.removeEventListener(ev, fn, opt); }); }
  function detach() { cleanup.forEach(function (f) { f(); }); cleanup = []; if (timer) clearTimeout(timer); }

  function start() {
    if (!eligible()) return;
    var touch = false;
    try { touch = window.matchMedia('(hover: none), (pointer: coarse)').matches; } catch (e) {}
    if (!touch) {
      /* desktop exit intent: pointer leaves through the top edge, after EXIT_DELAY on the page */
      on(document, 'mouseout', function (e) {
        if (e.relatedTarget === null && e.clientY <= 0 && Date.now() - t0 >= EXIT_DELAY) show();
      });
    } else {
      function depth() {
        var d = document.documentElement, max = d.scrollHeight - window.innerHeight;
        if (max <= 0) return 0;
        return (window.pageYOffset || d.scrollTop || 0) / max;
      }
      on(window, 'scroll', function () { if (depth() >= SCROLL_AT) show(); }, { passive: true });
      timer = setTimeout(show, MOBILE_FALLBACK);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  /* test hook: lets tests assert the guard decision without waiting; read-only */
  window.celestePopup = { eligible: eligible, imoValid: imoValid };
})();
