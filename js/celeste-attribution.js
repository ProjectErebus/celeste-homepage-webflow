/* CelesteOS first-party attribution (ADR-014 in celeste-business-control).
 * Sends landing / booking_click / lead_submit to the CelesteOS control plane ledger, ONLY after the visitor
 * opted in to analytics in /js/cookie-consent.js. Before consent: nothing stored, nothing sent.
 *
 *  - anon_id: random id in localStorage (celeste_anon), created only after consent. Never linked to a person
 *    unless that person submits a form (lead_submit carries the email they typed).
 *  - first touch (celeste_ft) is written once; last touch (celeste_lt) is replaced whenever a visit arrives with
 *    campaign params / click ids or from another site.
 *  - Withdrawal (analytics off) deletes all three keys.
 *  - Microsoft Bookings does not carry custom query params into the appointment, so booking links are NOT
 *    rewritten; a booking_click event with the anon_id is recorded instead.
 *
 *  - Ad conversions (advertising consent only, never with GPC): booking_click and lead_submit also fire the Meta
 *    Pixel standard event "Lead" and a Google Ads conversion, both carrying THE SAME event_id that the collector
 *    receives (Meta eventID / Google transaction_id), so a server-side copy (Meta Conversions API, Google offline
 *    upload) of the same event is de-duplicated against the browser one. With advertising consent the collector
 *    payload also carries fbp / fbc (Meta browser + click ids) and gclid (from the URL or Google's _gcl_aw cookie).
 *    Analytics and advertising are separate choices: without analytics consent nothing goes to the collector; without
 *    advertising consent no pixel / conversion fires and no fbp / fbc is read.
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
  /* Collector event -> ad conversions. Meta: standard event on dataset 1845508213271128 ("CelesteOS Website").
     Google Ads customer 8326890666: "Submit lead form" (7497044767) and "Lead / demo booking" (7883612794). */
  var ADS_CONVERSIONS = {
    lead_submit:   { meta: 'Lead', content: 'lead_form',    gads: 'AW-17947526022/yLTgCJ-m7_YbEIaHhu5C' },
    booking_click: { meta: 'Lead', content: 'demo_booking', gads: 'AW-17947526022/DpOzCPrEma8dEIaHhu5C' }
  };

  function consent() {
    try { return window.celesteConsent && window.celesteConsent.get ? window.celesteConsent.get() : null; } catch (e) { return null; }
  }
  function allowed() { var c = consent(); return !!(c && c.analytics); }
  function adsAllowed(c) { return !!(c && c.ads && !c.gpc); }

  function cookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }
  /* Meta browser id (_fbp, set by the pixel) and click id (_fbc, or built from ?fbclid= in Meta's format). */
  function metaIds() {
    var out = {}, fbp = cookie('_fbp'), fbc = cookie('_fbc');
    if (/^fb\.\d\.\d+\.\d+$/.test(fbp)) out.fbp = fbp;
    if (!fbc) { var id = currentParams().fbclid; if (id) fbc = 'fb.1.' + Date.now() + '.' + id; }
    if (fbc && fbc.length <= 256) out.fbc = fbc;
    return out;
  }
  /* gclid stored by Google's conversion linker (_gcl_aw = GCL.<ts>.<gclid>) after advertising consent. */
  function gclAw() {
    var v = cookie('_gcl_aw'), parts = v ? v.split('.') : [];
    return parts.length >= 3 && parts[0] === 'GCL' ? parts.slice(2).join('.').slice(0, 120) : '';
  }

  /* Browser-side ad conversions for a lead/booking event, de-duplicated with the server by event_id. */
  function fireAdConversions(name, eventId) {
    var conv = ADS_CONVERSIONS[name];
    if (!conv) return;
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', conv.meta, { content_name: conv.content, content_category: 'demo' }, { eventID: eventId });
      }
    } catch (e) {}
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', { send_to: conv.gads, value: 1.0, currency: 'USD', transaction_id: eventId });
      }
    } catch (e) {}
  }

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

  function send(name, extra) {
    var c = consent();
    if (!c) return false;
    var eventId = uuid();
    var ads = adsAllowed(c);
    if (ads) fireAdConversions(name, eventId);
    if (!c.analytics) return ads;
    var p = currentParams();
    if (ads) {
      var m = metaIds();
      if (m.fbp) p.fbp = m.fbp;
      if (m.fbc) p.fbc = m.fbc;
      if (!p.gclid) { var g = gclAw(); if (g) p.gclid = g; }
    }
    var ev = {
      event_id: eventId, event: name, anon_id: anonId(), ts: Date.now(),
      page: location.origin + location.pathname, referrer: document.referrer || '',
      first_touch: parse(get(K.ft)) || undefined, last_touch: parse(get(K.lt)) || undefined,
      consent: { analytics: true, ads: ads }
    };
    for (var k in p) ev[k] = p[k];
    for (var x in (extra || {})) ev[x] = extra[x];
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
