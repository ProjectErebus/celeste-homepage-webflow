/* CelesteOS exit popup: self-contained drop-in. ONE line on any page (after cookie-consent.js is fine, not required):
 *   <script src="/js/celeste-popup.js" defer data-api="https://control.celeste7.ai"></script>
 * Uses the native <dialog> + showModal() (focus trap, Esc, backdrop come from the browser). No libraries.
 * Contract: booking-api-contract.md v1.6. ONE screen, two clicks: pick a time, enter IMO + email, "Book this call".
 * The click chains POST /api/book/lead (IMO + email, source=popup) -> POST /api/book {slotStart, leadToken, idempotencyKey}.
 * After booking, an optional name + role form saves through /api/book/lead/enrich.
 * Slot list/helpers come from js/celeste-book.js (loaded on demand, same site root).
 *
 * Shown at most once per visitor per 30 days, never on /book*, never after a lead was submitted.
 * Storage is fail-closed: if localStorage throws, the popup does not show.
 * Image: data-image-slot; default /img/hull-light.webp (cropped clear of the bow lettering), /img/popup-lifestyle.webp if it exists,
 * or data-image="/img/x.webp" on the script tag. Hidden on phones.
 * Optional tuning attributes on the script tag: data-exit-delay (ms on page before exit intent counts, default 8000),
 * data-mobile-fallback (ms before the mobile timer trigger, default 30000), data-mobile-scroll (fraction, default 0.5).
 * Copy lives in elements marked data-copy-slot="...": edit COPY below, or override at runtime with window.celestePopupCopy before this script runs.
 * ?popup=preview shows it at once and fakes slots, lead, booking and enrichment (nothing is sent).
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
  /* Every call goes through req(): preview mode fakes the responses so reviewers can click through; nothing is sent. */
  function previewSlots() {
    var out = [], base = new Date(); base.setUTCHours(0, 0, 0, 0);
    for (var d = 2; d < 5; d++) [14, 15, 17].forEach(function (h) {
      var t = new Date(base.getTime() + d * 864e5 + h * 36e5);
      out.push({ start: t.toISOString().replace('.000', ''), end: new Date(t.getTime() + 18e5).toISOString().replace('.000', '') });
    });
    return out;
  }
  function fake(method, path, body) {
    var d = {};
    if (path.indexOf('/api/book/slots') === 0) d = { timezone: 'America/New_York', slotMinutes: 30, slots: previewSlots() };
    else if (path === '/api/book/lead') d = { leadToken: 'preview' };
    else if (path === '/api/book') d = { start: body && body.slotStart, dryRun: false };
    else d = { ok: true };
    return { ok: true, status: 200, data: d, retryAfter: 0 };
  }
  function req(method, path, body) {
    if (PREVIEW) return Promise.resolve(fake(method, path, body));
    return loadBook().then(function (B) { return B.call(method, path, body, apiBase()); },
      function () { return { ok: false, status: 0, data: { error: 'network' }, retryAfter: 0 }; });
  }
  var bookReady = null;
  function loadBook() {
    if (window.celesteBook) return Promise.resolve(window.celesteBook);
    if (bookReady) return bookReady;
    bookReady = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = ((script && script.src) || '').replace(/\/js\/[^\/]*$/, '') + '/js/celeste-book.js';
      sc.onload = function () { window.celesteBook ? res(window.celesteBook) : rej(); };
      sc.onerror = function () { rej(); };
      document.head.appendChild(sc);
    });
    return bookReady;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* PLACEHOLDER COPY: price, offer and magnet wording are undecided. SITE01 / founder fill these in. */
  var COPY = {
    'heading': 'Book a 30-minute call',
    'slots-label': 'Next free times (your time):',
    'more': 'More times \u203a',
    'zone-note': 'Organiser in Miami (ET)',
    'imo-hint': 'Vessel IMO number',
    'consent': 'Send me occasional CelesteOS updates by email. Optional; you can unsubscribe at any time.',
    'submit': 'Book this call',
    'enrich-label': 'Optional: helps us prepare.'
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
  /* Handoff to /book (same origin, sessionStorage): the leadToken is a bearer secret, so it never goes in a URL. */
  var K_HANDOFF = 'celeste_lead_handoff', handoff = null;
  function saveHandoff(patch) {
    try {
      handoff = Object.assign(handoff || {}, patch);
      sessionStorage.setItem(K_HANDOFF, JSON.stringify(handoff));
    } catch (e) {}
  }
  function bookHref() {
    var h = '/book?from=popup', b = apiBase();
    if (b !== PROD_API) h += '&api=' + encodeURIComponent(b); /* localhost test override only (apiBase is production elsewhere) */
    return h;
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
  var dlg = null, submitted = false, opener = null, shownOnce = false, bar = null, barFill = null;
  /* Progress fills live as the form is completed: time 33, valid IMO +33, valid email +24 (= 90), booked 100. */
  function progress(pct) {
    if (!bar) return;
    barFill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
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
  var ROLES = [['chief_engineer', 'Chief engineer'], ['eto', 'ETO'], ['captain', 'Captain'], ['manager', 'Yacht / fleet manager'], ['owner', 'Owner or owner’s rep'], ['other', 'Other']];
  var MAIL = 'onboarding@celeste7.ai';
  function mailHtml(lead) { return (lead ? lead + ' ' : '') + 'Email <a href="mailto:' + MAIL + '">' + MAIL + '</a> and we will arrange a time.'; }

  function build() {
    dlg = el('dialog', 'cp-dialog', { 'aria-labelledby': uid + '-h' });
    bar = el('div', 'cp-progress', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', 'aria-label': 'Progress' });
    barFill = el('span', 'cp-progress-fill'); bar.appendChild(barFill);
    dlg.appendChild(bar);
    progress(0);
    var split = el('div', 'cp-split');
    /* Image slot (left on desktop, hidden on phones). Decorative. Default: the hull photo, cropped so no bow lettering shows. */
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
    var close = el('button', 'cp-close', { type: 'button', 'aria-label': 'Close' }, '×');
    close.addEventListener('click', function () { dlg.close(); });
    split.appendChild(close);

    var form = el('form', 'cp-form', { novalidate: '' });
    form.appendChild(slot('h2', 'heading', 'cp-h', { id: uid + '-h' }));

    /* time picker: soonest 3, then "More times" expands a compact day/time list inline */
    form.appendChild(slot('p', 'slots-label', 'cp-label', { id: uid + '-sl' }));
    var quick = el('div', 'cp-quick', { role: 'group', 'aria-labelledby': uid + '-sl', 'aria-busy': 'true' });
    form.appendChild(quick);
    var moreBtn = slot('button', 'more', 'cp-link cp-more', { type: 'button', 'aria-expanded': 'false' }); moreBtn.hidden = true;
    form.appendChild(moreBtn);
    var moreBox = el('div', 'cp-more-box'); moreBox.hidden = true; form.appendChild(moreBox);
    form.appendChild(slot('p', 'zone-note', 'cp-zone'));

    var row = el('div', 'cp-row');
    var imoL = slot('label', 'imo-hint', null, { 'for': uid + '-imo' });
    var imo = el('input', null, { type: 'text', id: uid + '-imo', name: 'imo', inputmode: 'numeric', autocomplete: 'off', maxlength: '12', required: '', 'aria-required': 'true' });
    row.appendChild(field(imoL, imo));
    var emailL = el('label', null, { 'for': uid + '-email' }, 'Email');
    var email = el('input', null, { type: 'email', id: uid + '-email', name: 'email', autocomplete: 'email', required: '', maxlength: '254' });
    row.appendChild(field(emailL, email));
    form.appendChild(row);

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
    var submit = slot('button', 'submit', 'cp-btn', { type: 'submit', disabled: '' });
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

    var chosen = null, busy = false, lead = null, renewed = false, attempt = null, B = null;

    function emailOk() { return !!email.value.trim() && email.validity.valid; }
    function imoOk() { return !!imo.value.trim() && imoValid(imo.value); }
    function refresh() {
      progress((chosen ? 33 : 0) + (imoOk() ? 33 : 0) + (emailOk() ? 24 : 0));
      submit.disabled = busy || !(chosen && imoOk() && emailOk());
    }
    imo.addEventListener('input', function () {
      var raw = imo.value.trim();
      if (!imoOk() && cleanImo(raw).length >= 7) say('That IMO number does not look right. Check the 7 digits.'); else if (msg.textContent.indexOf('IMO') !== -1) say('');
      refresh();
    });
    email.addEventListener('input', refresh);
    function say(text, html) { if (html !== undefined) msg.innerHTML = html; else msg.textContent = text || ''; }

    /* ---- times ---- */
    function fmtSlot(iso) {
      var d = new Date(iso);
      return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.getDate() + ' · ' + B.localTime(iso);
    }
    function pick(s) {
      chosen = s;
      Array.prototype.forEach.call(form.querySelectorAll('[data-start]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-start') === s.start ? 'true' : 'false'); });
      refresh();
    }
    function loadTimes(note) {
      quick.setAttribute('aria-busy', 'true'); chosen = null; refresh();
      return req('GET', '/api/book/slots?days=14').then(function (r) {
        quick.setAttribute('aria-busy', 'false');
        return loadBook().then(function (b) { B = b; return r; }, function () { return r; });
      }).then(function (r) {
        quick.textContent = ''; moreBox.textContent = ''; moreBtn.hidden = true;
        var list = (r.ok && r.data.slots) || [];
        if (!r.ok || !B) { say('', mailHtml('We could not load the times.')); return; }
        if (!list.length) { say('', mailHtml('No times are open right now.')); return; }
        if (note) say(note); else if (msg.textContent.indexOf('Email') === -1) say('');
        list.slice(0, 3).forEach(function (s) {
          var b = el('button', 'cp-slotbtn', { type: 'button', 'data-start': s.start, 'aria-pressed': 'false' }, fmtSlot(s.start));
          b.addEventListener('click', function () { pick(s); });
          quick.appendChild(b);
        });
        if (list.length > 3) {
          moreBtn.hidden = false;
          B.renderSlots(moreBox, list, pick);
        }
      });
    }
    moreBtn.addEventListener('click', function () {
      var open = moreBox.hidden; moreBox.hidden = !open; moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    loadTimes();

    /* ---- one click: lead -> book ---- */
    function attribution() {
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
      return a;
    }
    function ensureLead() {
      var em = email.value.trim(), im = cleanImo(imo.value), mk = !!form.marketing.checked;
      var sig = em + '|' + im + '|' + mk;
      if (lead && lead.sig === sig) return Promise.resolve(lead);
      var a = attribution();
      var body = {
        imo: im, role: null, name: null, email: em, source: 'popup',
        consent: { marketing: mk }, anonId: a.anonId, utm: a.utm, gclid: a.gclid, website: form.website.value
      };
      return req('POST', '/api/book/lead', body).then(function (r) {
        if (!r.ok || !r.data || typeof r.data.leadToken !== 'string') return { error: (r.data && r.data.error) || 'network' };
        submitted = true;                 /* a saved lead */
        if (!PREVIEW) remember(K_LEAD, '1');
        track('popup_submit');
        lead = { sig: sig, token: r.data.leadToken, body: body, email: em };
        renewed = false;
        return lead;
      });
    }
    function done(d) {
      progress(100);
      form.hidden = true;
      var when = B.shortWhen((d && d.start) || chosen.start);
      var box = el('div', 'cp-done');
      var test = d && d.dryRun === true;
      box.appendChild(el('h2', 'cp-h', { id: uid + '-h2', tabindex: '-1' }, test ? 'Test booking only' : 'Booked: ' + when + ' your time.'));
      box.appendChild(el('p', 'cp-p cp-booked', { id: uid + '-b2' }, test
        ? when + ' your time. This was a test: nothing was sent and no call is scheduled. If you meant to book a real call, email ' + MAIL + '.'
        : 'The Teams invite is on its way to ' + lead.email + '.'));
      var manage = B.safeUrl(d && d.manageUrl, B.MANAGE_HOSTS);
      if (manage) box.appendChild(el('a', 'cp-link cp-manage', { href: manage, rel: 'noopener' }, 'Need to change it? Cancel or pick a new time'));
      /* optional enrichment: no skip button, just close */
      var f = el('form', 'cp-enrich', { novalidate: '' });
      f.appendChild(slot('p', 'enrich-label', 'cp-label'));
      var n = el('input', null, { type: 'text', id: uid + '-name', name: 'name', autocomplete: 'name', maxlength: '120' });
      f.appendChild(field(el('label', null, { 'for': uid + '-name' }, 'Your name'), n));
      var r = el('select', null, { id: uid + '-role', name: 'role' });
      r.appendChild(el('option', null, { value: '' }, 'Choose…'));
      ROLES.forEach(function (o) { r.appendChild(el('option', null, { value: o[0] }, o[1])); });
      f.appendChild(field(el('label', null, { 'for': uid + '-role' }, 'Your role'), r));
      var em2 = el('p', 'cp-msg', { role: 'status' }); f.appendChild(em2);
      var sv = el('button', 'cp-btn', { type: 'submit' }, 'Save'); f.appendChild(sv);
      var saving = false;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (saving) return;
        var nv = n.value.trim(), rv = r.value;
        if (!nv && !rv) return;
        saving = true; sv.disabled = true;
        req('POST', '/api/book/lead/enrich', { leadToken: lead.token, name: nv || null, role: rv || null }).then(function (x) {
          if (x.ok) { f.textContent = ''; f.appendChild(el('p', 'cp-p', { role: 'status' }, 'Thanks.')); }
          else { saving = false; sv.disabled = false; em2.textContent = 'Could not save that just now. No problem, the call is booked.'; }
        });
      });
      box.appendChild(f);
      dlg.setAttribute('aria-labelledby', uid + '-h2'); dlg.setAttribute('aria-describedby', uid + '-b2');
      panel.appendChild(box);
      box.firstChild.focus();
    }
    function fail() { busy = false; refresh(); }
    function handle(r, tries) {
      if (r.ok) { busy = false; done(r.data); return Promise.resolve(); }
      var code = (r.data && r.data.error) || 'network';
      if (code === 'in_progress' && tries < 4) return wait(Math.max(1, r.retryAfter || 2) * 1000).then(function () { return attemptBook(tries + 1); });
      if ((code === 'token_expired' || code === 'bad_token') && !renewed && lead) {
        renewed = true;                 /* re-submit the same lead once, then retry the booking */
        return req('POST', '/api/book/lead', lead.body).then(function (lr) {
          if (lr.ok && lr.data && typeof lr.data.leadToken === 'string') { lead.token = lr.data.leadToken; attempt = null; return attemptBook(tries); }
          say('', mailHtml('Something went wrong on our side.')); fail();
        });
      }
      if (code === 'slot_taken') { fail(); return loadTimes('That time just went. Here are the next ones.'); }
      if (code === 'already_booked') say('You already have a call booked. Check your email.');
      else if (code === 'in_progress') say('That is still being processed. Please wait a moment and try again.');
      else if (code === 'rate_limited') say('That is a lot of requests from one place. Please wait a little and try again.');
      else say('', mailHtml(code === 'booking_disabled' ? 'Online booking is not available just now.' : 'Something went wrong on our side.'));
      fail();
      return Promise.resolve();
    }
    function attemptBook(tries) {
      var sig = chosen.start + '|' + lead.token;
      if (!attempt || attempt.sig !== sig) attempt = { sig: sig, key: B.uuid() };
      return req('POST', '/api/book', { slotStart: chosen.start, leadToken: lead.token, idempotencyKey: attempt.key }).then(function (r) { return handle(r, tries); });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || submit.disabled || !chosen) return;
      busy = true; submit.disabled = true; say('Booking your call…');
      ensureLead().then(function (l) {
        if (l.error) {
          say(l.error === 'invalid' ? 'Please check your IMO number and email.' : '', l.error === 'invalid' ? undefined : mailHtml('Sorry, that did not go through. Please try again in a moment.'));
          fail(); return;
        }
        return attemptBook(0);
      });
    });
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
    var first = dlg.querySelector('input[name=imo]'); if (first) first.focus();
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
