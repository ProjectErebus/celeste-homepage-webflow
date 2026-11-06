/* CelesteOS funnel events for /book and the exit popup (contract v1.4 "Tracking events").
 * js/celeste-attribution.js exposes no generic event method (only lead()), so this is the smallest wrapper:
 * it posts to the SAME collector, in the SAME shape and transport as attribution.js send(), behind the SAME
 * consent gate (celesteConsent.get().analytics). No analytics consent = nothing stored, nothing sent.
 * It never reads or sets storage itself; anon_id comes from celesteAttribution.anonId() (null if absent / no consent).
 *
 *   window.celesteEvents.track('book_step', { step: 'lead' })
 * Allowed events and their only permitted props (anything else is dropped, so no PII can ride along):
 *   book_step {step: lead|slot|confirm} · popup_shown · popup_dismissed · popup_submit · imo_resolved {found: boolean}
 */
(function () {
  'use strict';
  if (window.celesteEvents) return;
  var ENDPOINT = 'https://control.celeste7.ai/api/collect/web';
  var STEPS = ['lead', 'slot', 'confirm'];
  var SHAPES = {
    book_step: function (p) { return STEPS.indexOf(p && p.step) === -1 ? null : { step: p.step }; },
    popup_shown: function () { return {}; },
    popup_dismissed: function () { return {}; },
    popup_submit: function () { return {}; },
    imo_resolved: function (p) { return { found: !!(p && p.found) }; }
  };

  function consent() {
    try { return window.celesteConsent && window.celesteConsent.get ? window.celesteConsent.get() : null; } catch (e) { return null; }
  }
  function uuid() {
    if (window.celesteAttribution && window.celesteAttribution.uuid) return window.celesteAttribution.uuid();
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }

  function track(name, props) {
    var c = consent();
    if (!(c && c.analytics)) return false;
    var shape = SHAPES[name];
    var extra = shape ? shape(props) : null;
    if (!extra) return false;
    var anon = null;
    try { anon = window.celesteAttribution && window.celesteAttribution.anonId ? window.celesteAttribution.anonId() : null; } catch (e) {}
    var ev = {
      event_id: uuid(), event: name, anon_id: anon, ts: Date.now(),
      page: location.origin + location.pathname,
      consent: { analytics: true, ads: !!(c.ads && !c.gpc) }
    };
    for (var k in extra) ev[k] = extra[k];
    var body = JSON.stringify(ev);
    try {
      /* text/plain = CORS "simple" request: no preflight, survives navigation. */
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return true;
    } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
    return true;
  }

  window.celesteEvents = { track: track };
})();
