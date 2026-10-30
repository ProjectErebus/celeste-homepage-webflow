/* CelesteOS first-party attribution (ADR-014 in celeste-business-control).
 * Sends landing / booking_click / lead_submit to the CelesteOS control plane ledger, ONLY after the visitor
 * opted in to analytics in /js/cookie-consent.js. Before consent: nothing stored, nothing sent.
 * With advertising consent, lead_submit / booking_click also dispatch 'celeste:conversion' {event, event_id} (the Meta
 * Pixel fires there, same event id) and the collector event carries _fbp / _fbc for the server-side copy.
 *
 *  - anon_id: random id in localStorage (celeste_anon), created only after consent. Never linked to a person
 *    unless that person submits a form (lead_submit carries the email they typed).
 *  - first touch (celeste_ft) is written once; last touch (celeste_lt) is replaced whenever a visit arrives with
 *    campaign params / click ids or from another site.
 *  - Withdrawal (analytics off) deletes all three keys.
 *  - Microsoft Bookings does not carry custom query params into the appointment, so booking links are NOT
 *    rewritten; a booking_click event with the anon_id is recorded instead.
 *
 * Load after cookie-consent.js:  <script src="/js/celeste-attribution.js" defer></script>
 * API: window.celesteAttribution.lead(email)  call after a successful form submit
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://control.celeste7.ai/api/collect/web';
  /* Any Microsoft Bookings page (shared booking page URL changes with the tenant / mailbox name). */
  var BOOKING_RE = /^https:\/\/(?:outlook\.office\.com|bookings\.cloud\.microsoft)\/book\//i;
  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'li_fat_id'];
  var K = { anon: 'celeste_anon', ft: 'celeste_ft', lt: 'celeste_lt', sent: 'celeste_landing_sent' };

  function consent() {
    try { return window.celesteConsent && window.celesteConsent.get ? window.celesteConsent.get() : null; } catch (e) { return null; }
  }
  function allowed() { var c = consent(); return !!(c && c.analytics); }

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function forget() {
    try { localStorage.removeItem(K.anon); localStorage.removeItem(K.ft); localStorage.removeItem(K.lt); sessionStorage.removeItem(K.sent); } catch (e) {}
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function anonId() {
    var id = get(K.anon);
    if (!id) { id = uuid(); set(K.anon, id); }
    return id;
  }

  function currentParams() {
    var out = {}, q;
    try { q = new URLSearchParams(location.search); } catch (e) { return out; }
    PARAMS.forEach(function (k) { var v = q.get(k); if (v) out[k] = v.slice(0, 120); });
    return out;
  }
  function externalReferrer() {
    try { var r = document.referrer ? new URL(document.referrer) : null; return r && r.hostname.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '') ? r.origin : ''; }
    catch (e) { return ''; }
  }
  function parse(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  /* Update first/last touch for this page view (after consent only). */
  function recordTouch() {
    var p = currentParams(), ref = externalReferrer();
    var isTouch = Object.keys(p).length > 0 || !!ref;
    var t = { page: location.origin + location.pathname, referrer: ref, ts: new Date().toISOString() };
    for (var k in p) t[k] = p[k];
    if (!get(K.ft)) set(K.ft, JSON.stringify(t));
    if (isTouch || !get(K.lt)) set(K.lt, JSON.stringify(t));
  }

  function cookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* One event id per conversion: the Pixel (advertising consent, via cookie-consent.js) and the collector (analytics
     consent) carry the same id, so Meta deduplicates the browser and server copies. */
  function send(name, extra) {
    var c = consent();
    if (!c || (!c.analytics && !c.ads)) return false;
    var id = uuid();
    if (c.ads && (name === 'lead_submit' || name === 'booking_click')) {
      try { document.dispatchEvent(new CustomEvent('celeste:conversion', { detail: { event: name, event_id: id } })); } catch (e) {}
    }
    if (!c.analytics) return true;
    var p = currentParams();
    var ev = {
      event_id: id, event: name, anon_id: anonId(), ts: Date.now(),
      page: location.origin + location.pathname, referrer: document.referrer || '',
      first_touch: parse(get(K.ft)) || undefined, last_touch: parse(get(K.lt)) || undefined,
      consent: { analytics: true, ads: !!c.ads }
    };
    for (var k in p) ev[k] = p[k];
    for (var x in (extra || {})) ev[x] = extra[x];
    if (c.ads) { var fbp = cookie('_fbp'), fbc = cookie('_fbc'); if (fbp) ev.fbp = fbp; if (fbc) ev.fbc = fbc; }
    var body = JSON.stringify(ev);
    try {
      /* text/plain = CORS "simple" request: no preflight, survives navigation. */
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return true;
    } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
    return true;
  }

  function onConsented() {
    if (!allowed()) { var c = consent(); if (c && !c.analytics) forget(); return; }
    recordTouch();
    var sent = null; try { sent = sessionStorage.getItem(K.sent); } catch (e) {}
    /* one landing per session, plus one per arrival that carries campaign params / click ids */
    if (!sent || Object.keys(currentParams()).length) {
      send('landing');
      try { sessionStorage.setItem(K.sent, '1'); } catch (e) {}
    }
  }

  /* Booking CTA: record the click (link opens Bookings in a new tab, or navigates; the beacon survives either). */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && BOOKING_RE.test(a.href)) send('booking_click');
  }, true);

  /* Consent given or changed on this page (cookie-consent.js dispatches celeste:consent). */
  document.addEventListener('celeste:consent', onConsented);

  window.celesteAttribution = {
    lead: function (email) { return send('lead_submit', { email: String(email || '').slice(0, 254) }); },
    forget: forget
  };

  onConsented();
})();
