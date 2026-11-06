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
  var PREVIEW = false; try { PREVIEW = new URLSearchParams(location.search).get('popup') === 'preview'; } catch (e) {}
  /* POST helper. In ?popup=preview mode nothing is sent: a fake success lets reviewers click through both steps. */
  function post(path, body) {
    if (PREVIEW) return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ leadToken: 'preview' }); } });
    return fetch(apiBase() + path, { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  /* PLACEHOLDER COPY: price, offer and magnet wording are undecided. SITE01 / founder fill these in. */
  var COPY = {
    'heading': 'Placeholder heading: the offer goes here',
    'body': 'Placeholder text: one line on what the visitor gets.',
    'imo-hint': 'Vessel IMO number',
    'consent': 'Send me occasional CelesteOS updates by email. Optional; you can unsubscribe at any time.',
    'submit': 'Placeholder button',
    'success-heading': 'Thank you',
    'success-body': 'We have your details. If you would like to talk it through, book a short call.',
    'book': 'Book a call',
    'step2-heading': 'One more step: who are you on board?',
    'step2-body': 'Two quick details so we send what fits your role. You can skip this.',
    'step2-submit': 'Finish',
    'step1-label': 'Step 1 of 2',
    'step2-label': 'Step 2 of 2'
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
  var dlg = null, submitted = false, opener = null, shownOnce = false, leadToken = null, bar = null, barFill = null, barLabel = null;
  /* Progress bar (endowed-progress technique): opens at 30%, step 2 at 70%, done at 100%. */
  function progress(pct, label, slotName) {
    if (!bar) return;
    if (slotName) barLabel.setAttribute('data-copy-slot', slotName); else barLabel.removeAttribute('data-copy-slot');
    barFill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    barLabel.textContent = label;
  }
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
    bar = el('div', 'cp-progress', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '30', 'aria-label': 'Progress' });
    barFill = el('span', 'cp-progress-fill'); bar.appendChild(barFill);
    barLabel = el('span', 'cp-progress-label'); bar.appendChild(barLabel);
    dlg.appendChild(bar);
    progress(30, COPY['step1-label'], 'step1-label');
    var split = el('div', 'cp-split');
    /* Image slot (left on desktop, top strip on phones). Decorative. Default: the hull photo, cropped so no bow lettering shows.
       If /img/popup-lifestyle.webp exists it replaces it; the include line can also set data-image="/img/x.webp" on the script tag. */
    var fig = el('div', 'cp-figure', { 'data-image-slot': '', 'aria-hidden': 'true' });
    var override = script && script.getAttribute('data-image');
    var img = el('img', 'cp-img', { src: override || IMG_DEFAULT, alt: '', width: '1920', height: '1153', decoding: 'async', 'data-crop': override ? 'custom' : 'hull' });
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
    var imo = el('input', null, { type: 'text', id: uid + '-imo', name: 'imo', inputmode: 'numeric', autocomplete: 'off', maxlength: '12', required: '', 'aria-required': 'true' });
    form.appendChild(field(imoL, imo));
    var emailL = el('label', null, { 'for': uid + '-email' }, 'Email');
    var email = el('input', null, { type: 'email', id: uid + '-email', name: 'email', autocomplete: 'email', required: '', maxlength: '254' });
    form.appendChild(field(emailL, email));

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
      if (!imoRaw || !imoValid(imoRaw)) { msg.textContent = imoRaw ? 'That IMO number does not look right. Check the 7 digits.' : 'Enter your vessel\'s 7-digit IMO number.'; imo.focus(); return; }
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
        imo: cleanImo(imoRaw), role: null, name: null, email: em, source: 'popup',
        consent: { marketing: !!form.marketing.checked }, anonId: a.anonId, utm: a.utm, gclid: a.gclid, website: form.website.value
      };
      busy = true; submit.disabled = true;
      post('/api/book/lead', body)
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d || {} }; }); },
              function () { return { ok: false, data: {} }; })
        .then(function (r) {
          busy = false; submit.disabled = false;
          if (!r.ok) { msg.textContent = 'Sorry, that did not go through. Please try again in a moment.'; return; }
          submitted = true;                 /* step 1 alone is a saved lead */
          if (!PREVIEW) remember(K_LEAD, '1');
          leadToken = (r.data && typeof r.data.leadToken === 'string') ? r.data.leadToken : null;
          track('popup_submit');
          if (leadToken) step2(panel, form); else success(panel, form);
        });
    });
  }

  /* Step 2 (enrichment): name + role. Optional; skipping still leaves the step-1 lead saved. */
  var ROLES = [['chief_engineer', 'Chief engineer'], ['eto', 'ETO'], ['captain', 'Captain'], ['manager', 'Yacht / fleet manager'], ['owner', 'Owner or owner\u2019s rep'], ['other', 'Other']];
  function step2(panel, form1) {
    form1.hidden = true;
    progress(70, COPY['step2-label'], 'step2-label');
    var f = el('form', 'cp-form', { novalidate: '' });
    f.appendChild(slot('h2', 'step2-heading', 'cp-h', { id: uid + '-h2' }));
    dlg.setAttribute('aria-labelledby', uid + '-h2'); dlg.setAttribute('aria-describedby', uid + '-b2');
    f.appendChild(slot('p', 'step2-body', 'cp-p', { id: uid + '-b2' }));
    var nL = el('label', null, { 'for': uid + '-name' }, 'Your name');
    var n = el('input', null, { type: 'text', id: uid + '-name', name: 'name', autocomplete: 'name', maxlength: '120' });
    f.appendChild(field(nL, n));
    var rL = el('label', null, { 'for': uid + '-role' }, 'Your role');
    var r = el('select', null, { id: uid + '-role', name: 'role' });
    r.appendChild(el('option', null, { value: '' }, 'Choose\u2026'));
    ROLES.forEach(function (o) { r.appendChild(el('option', null, { value: o[0] }, o[1])); });
    f.appendChild(field(rL, r));
    var m = el('p', 'cp-msg', { role: 'alert' }); f.appendChild(m);
    var b = slot('button', 'step2-submit', 'cp-btn', { type: 'submit' }); f.appendChild(b);
    var skip = el('button', 'cp-link cp-no', { type: 'button' }, 'Skip');
    skip.addEventListener('click', function () { success(panel, f); });
    f.appendChild(skip);
    panel.appendChild(f);
    n.focus();
    var busy2 = false;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy2) return;
      var nv = n.value.trim(), rv = r.value;
      if (!nv && !rv) { success(panel, f); return; }       /* nothing to add = same as skip */
      busy2 = true; b.disabled = true;
      post('/api/book/lead/enrich', { leadToken: leadToken, name: nv || null, role: rv || null })
        .then(function () {}, function () {})            /* enrichment is best-effort: the lead is already saved */
        .then(function () { busy2 = false; b.disabled = false; success(panel, f); });
    });
  }

  function success(panel, form) {
    progress(100, 'Done');
    form.hidden = true;
    var box = el('div', 'cp-done');
    box.appendChild(slot('h2', 'success-heading', 'cp-h', { id: uid + '-h3' }));
    box.appendChild(slot('p', 'success-body', 'cp-p', { id: uid + '-b3' }));
    dlg.setAttribute('aria-labelledby', uid + '-h3'); dlg.setAttribute('aria-describedby', uid + '-b3');
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
      /* known technique (ouibounce): mouseleave on <html>, pointer within 20px of the top edge. Fast movements skip y=0. */
      on(document.documentElement, 'mouseleave', function (e) {
        if (e.clientY <= 20 && Date.now() - t0 >= EXIT_DELAY) show();
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

  /* preview for review: ?popup=preview shows it immediately, without the frequency cap and without recording a view */
  function preview() {
    try { if (new URLSearchParams(location.search).get('popup') !== 'preview') return false; } catch (e) { return false; }
    shownOnce = true; opener = document.activeElement; build();
    if (typeof dlg.showModal === 'function') dlg.showModal();
    return true;
  }
  function boot() { if (!preview()) start(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  /* test hook: lets tests assert the guard decision without waiting; read-only */
  window.celestePopup = { eligible: eligible, imoValid: imoValid };
})();
