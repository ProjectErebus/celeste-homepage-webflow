/* CelesteOS /book: shared helpers (API base, fetch, time formatting, attribution read-through).
 * No storage logic here: anon id and UTMs come from window.celesteAttribution (js/celeste-attribution.js),
 * which only returns them after analytics consent. Without consent we send null / nothing.
 * API base: ?api=<url> override (tests), then data-api on <html> or <body>, then production. */
(function () {
  'use strict';
  var PROD_API = 'https://control.celeste7.ai';
  var MAIL = 'onboarding@celeste7.ai';

  /* The ?api= / data-api override is for local tests only: honoured solely on localhost / 127.0.0.1.
     On any real host the base is the production constant, so a crafted link cannot redirect form data. */
  function isLocalHost() { return location.hostname === 'localhost' || location.hostname === '127.0.0.1'; }
  function apiBase() {
    if (!isLocalHost()) return PROD_API;
    var base = '';
    try { base = new URLSearchParams(location.search).get('api') || ''; } catch (e) {}
    if (!base) {
      var el = document.documentElement.getAttribute('data-api') ? document.documentElement : document.body;
      base = (el && el.getAttribute('data-api')) || '';
    }
    return (base || PROD_API).replace(/\/+$/, '');
  }

  /* API-supplied links are rendered only if https (and, for manage links, on celeste7.ai). Else null. */
  function safeUrl(x, hosts) {
    try {
      var u = new URL(String(x));
      if (u.protocol !== 'https:') return null;
      if (hosts && hosts.indexOf(u.hostname) === -1) return null;
      return u.href;
    } catch (e) { return null; }
  }
  var MANAGE_HOSTS = ['celeste7.ai', 'www.celeste7.ai'];

  function call(method, path, body, base) {
    var opts = { method: method, mode: 'cors', credentials: 'omit', headers: {} };
    if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
    return fetch((base ? String(base).replace(/\/+$/, '') : apiBase()) + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data || {}, retryAfter: Number(res.headers.get('retry-after')) || 0 };
      });
    }, function () {
      return { ok: false, status: 0, data: { error: 'network' } };
    });
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  /* Read-only view of the attribution script's getters; safe if it is missing or consent is not given. */
  function attribution() {
    var out = { anonId: null, utm: { source: null, medium: null, campaign: null, term: null, content: null }, gclid: null };
    try {
      var a = window.celesteAttribution;
      if (!a) return out;
      out.anonId = a.anonId ? (a.anonId() || null) : null;
      var t = a.touch ? a.touch() : {};
      out.utm = {
        source: t.utm_source || null, medium: t.utm_medium || null, campaign: t.utm_campaign || null,
        term: t.utm_term || null, content: t.utm_content || null
      };
      out.gclid = t.gclid || null;
    } catch (e) {}
    return out;
  }

  /* Every time on the site is shown in Eastern Time (the host's zone, America/New_York), labelled ET. */
  var TZ = 'America/New_York';
  function withTz(o) { var r = {}; for (var k in o) r[k] = o[k]; r.timeZone = TZ; return r; }
  function localTime(iso) {
    return new Date(iso).toLocaleTimeString([], withTz({ hour: '2-digit', minute: '2-digit' }));
  }
  function localDay(iso, opts) {
    return new Date(iso).toLocaleDateString([], withTz(opts || { weekday: 'long', day: 'numeric', month: 'long' }));
  }
  function dayKey(iso) {
    return new Intl.DateTimeFormat('en-CA', withTz({ year: 'numeric', month: '2-digit', day: '2-digit' })).format(new Date(iso));
  }
  function visitorZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time'; } catch (e) { return 'your local time'; }
  }
  function organiserNow(tz) {
    try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz }); } catch (e) { return ''; }
  }
  /* "Thu 12 Nov, 10:00" in Eastern Time (popup done screen). */
  function shortWhen(iso) { return localDay(iso, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + ', ' + localTime(iso); }
  function fullWhen(iso) { return localDay(iso) + ' at ' + localTime(iso) + ' ET'; }

  /* Slot picker shared by /book and /book/manage. onPick(slot) gets the chosen {start,end}. */
  function renderSlots(root, slots, onPick) {
    root.innerHTML = '';
    if (!slots.length) { root.textContent = 'No times are open right now. Please check back soon, or email us.'; return; }
    var byDay = {}, order = [];
    slots.forEach(function (s) {
      var k = dayKey(s.start);
      if (!byDay[k]) { byDay[k] = []; order.push(k); }
      byDay[k].push(s);
    });
    var tabs = document.createElement('div'); tabs.className = 'bk-days'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Choose a day');
    var times = document.createElement('div'); times.className = 'bk-times'; times.setAttribute('role', 'group'); times.setAttribute('aria-label', 'Choose a time');
    root.appendChild(tabs); root.appendChild(times);
    function show(k) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-day') === k ? 'true' : 'false'); });
      times.innerHTML = '';
      byDay[k].forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bk-time'; b.textContent = localTime(s.start);
        b.setAttribute('data-start', s.start);
        b.setAttribute('aria-label', localDay(s.start) + ' at ' + localTime(s.start));
        b.addEventListener('click', function () { onPick(s); });
        times.appendChild(b);
      });
    }
    order.forEach(function (k, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-day'; b.setAttribute('data-day', k); b.setAttribute('aria-pressed', 'false');
      var first = byDay[k][0].start;
      b.innerHTML = '<span class="bk-day-w"></span><span class="bk-day-d"></span>';
      b.firstChild.textContent = localDay(first, { weekday: 'short' });
      b.lastChild.textContent = localDay(first, { day: 'numeric', month: 'short' });
      b.setAttribute('aria-label', localDay(first));
      b.addEventListener('click', function () { show(k); });
      tabs.appendChild(b);
      if (i === 0) show(k);
    });
  }

  var ZONE_NAMES = { 'America/New_York': 'Miami (ET)' };
  function zoneLine(tz) {
    return 'All times are Eastern Time (ET). It is now ' + organiserNow(TZ) + ' ET.';
  }

  /* Calm copy for the failure codes that share one message. */
  function softError(code) {
    if (code === 'rate_limited') return 'That is a lot of requests from one place. Please wait a little and try again.';
    if (code === 'booking_disabled') return 'Online booking is not available just now.';
    if (code === 'graph_unavailable') return 'We could not reach the calendar just now.';
    return 'Something went wrong on our side.';
  }
  function mailLink() { return 'Email us at <a href="mailto:' + MAIL + '">' + MAIL + '</a> and we will arrange a time.'; }

  window.celesteBook = {
    apiBase: apiBase, safeUrl: safeUrl, MANAGE_HOSTS: MANAGE_HOSTS, call: call, uuid: uuid, attribution: attribution, renderSlots: renderSlots, localDay: localDay,
    fullWhen: fullWhen, shortWhen: shortWhen, localTime: localTime, zoneLine: zoneLine, softError: softError, mailLink: mailLink, MAIL: MAIL
  };
})();
