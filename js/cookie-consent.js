/* CelesteOS consent manager: UK/EU PECR + ePrivacy + GDPR, US CCPA/CPRA (incl. Global Privacy Control).
 * Vanilla, no dependencies. Load it SYNCHRONOUSLY in <head> (no defer/async) and with no other tag
 * snippet: this file is the only place any third-party measurement script is ever requested.
 *
 * Guarantees
 *  1. Nothing third-party is fetched before opt-in. gtag.js (googletagmanager.com) and Contentsquare/
 *     Hotjar are injected dynamically, and only for the categories the visitor granted.
 *  2. Google Consent Mode v2 signals are set BEFORE any Google script loads: 'default' all denied,
 *     then an 'update' carrying exactly the granted categories.
 *  3. Global Privacy Control (navigator.globalPrivacyControl === true) is an opt-out of sale/sharing/
 *     targeted advertising: Google Ads is never loaded and ad_storage / ad_user_data /
 *     ad_personalization stay denied whatever the banner says. Analytics stays a separate opt-in.
 *  4. Categories: strictly necessary (always on), analytics (GA4 + Contentsquare/Hotjar),
 *     advertising (Google Ads). First layer has equal-prominence "Reject all" / "Accept all".
 *  5. The choice is stored with CONSENT_VERSION; bump it when the Privacy Policy / Cookie Notice
 *     changes materially and every visitor is asked again.
 *  6. Withdrawal (via any [data-privacy-choices] link, e.g. the footer "Your Privacy Choices", or
 *     window.celesteCookieSettings()) deletes the _ga / _gcl / Hotjar / Contentsquare cookies we can
 *     reach and reloads, so scripts already in memory stop; nothing is loaded again until opt-in.
 *
 * Public API: window.celesteCookieSettings()  opens the preferences panel
 *             window.celesteConsent.get()     current { analytics, ads, gpc, version } or null
 */
(function () {
  'use strict';

  var CONSENT_VERSION = '2026-10-15';            // bump on material policy change → re-prompt
  var KEY = 'celeste_consent';                    // JSON { v, analytics, ads, ts }
  var LEGACY_KEYS = ['celeste_cookie_consent_v1'];
  var GA4_ID = 'G-230QN4JY4P';
  var ADS_ID = 'AW-17947526022';
  var GTAG_SRC = 'https://www.googletagmanager.com/gtag/js?id=';
  var CS_SRC = 'https://t.contentsquare.net/uxa/9a0fb681c240a.js';
  var POLICY_URL = '/privacy-policy#cookies';

  var gpc = (function () { try { return navigator.globalPrivacyControl === true; } catch (e) { return false; } })();

  /* ── Consent Mode v2 defaults: queued in dataLayer before any Google script can exist ── */
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }
  var gtag = window.gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted'
  });
  gtag('set', 'ads_data_redaction', true);

  /* ── Storage ── */
  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var c = JSON.parse(raw);
      if (!c || c.v !== CONSENT_VERSION) return null;      // policy changed → ask again
      return { analytics: c.analytics === true, ads: c.ads === true && !gpc };
    } catch (e) { return null; }
  }
  function write(c) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: CONSENT_VERSION, analytics: c.analytics, ads: c.ads, gpc: gpc, ts: new Date().toISOString() }));
      for (var i = 0; i < LEGACY_KEYS.length; i++) localStorage.removeItem(LEGACY_KEYS[i]);
    } catch (e) {}
  }
  try { if (!localStorage.getItem(KEY)) for (var l = 0; l < LEGACY_KEYS.length; l++) localStorage.removeItem(LEGACY_KEYS[l]); } catch (e) {}

  /* ── Loaders (each runs at most once per page) ── */
  var loaded = { gtag: false, ga4: false, ads: false, cs: false };
  function inject(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    (document.head || document.documentElement).appendChild(s);
  }
  function loadGoogle(c) {
    if (!c.analytics && !c.ads) return;
    if (!loaded.gtag) {
      loaded.gtag = true;
      gtag('js', new Date());
      inject(GTAG_SRC + (c.analytics ? GA4_ID : ADS_ID));
    }
    if (c.analytics && !loaded.ga4) { loaded.ga4 = true; gtag('config', GA4_ID); }
    if (c.ads && !gpc && !loaded.ads) { loaded.ads = true; gtag('config', ADS_ID); }
  }
  function loadContentsquare() {
    if (loaded.cs) return;
    loaded.cs = true;
    inject(CS_SRC);
  }

  function apply(c) {
    var ads = c.ads && !gpc;
    gtag('consent', 'update', {
      analytics_storage:  c.analytics ? 'granted' : 'denied',
      ad_storage:         ads ? 'granted' : 'denied',
      ad_user_data:       ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied'
    });
    gtag('set', 'ads_data_redaction', !ads);
    loadGoogle({ analytics: c.analytics, ads: ads });
    if (c.analytics) loadContentsquare();
  }

  /* ── Withdrawal: delete what we can reach, then reload so in-memory scripts stop ── */
  var COOKIE_RE = /^(_ga|_ga_.*|_gid|_gat.*|_gcl_.*|_gac_.*|__gads|__gpi|_hj.*|_cs_.*|_uetsid|_uetvid)$/;
  function clearTrackingCookies() {
    var names = document.cookie.split(';').map(function (p) { return p.split('=')[0].trim(); })
      .filter(function (n) { return COOKIE_RE.test(n); });
    var parts = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) {
      var d = parts.slice(i).join('.');
      domains.push('; domain=' + d, '; domain=.' + d);
    }
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
    try {
      [localStorage, sessionStorage].forEach(function (st) {
        for (var k = st.length - 1; k >= 0; k--) {
          var key = st.key(k);
          if (key && /^(_hj|_cs_|_uxa|_ga)/.test(key)) st.removeItem(key);
        }
      });
    } catch (e) {}
  }

  /* ── UI ── */
  var CSS = [
    '.cc-banner,.cc-panel{position:fixed;z-index:2147483000;box-sizing:border-box;font-family:"DM Sans",system-ui,-apple-system,sans-serif;',
    'background:var(--_colors---surface,#ffffff);border:1px solid var(--_colors---border,rgba(0,0,0,.12));box-shadow:0 10px 30px rgba(0,0,0,.16);color:#1f1f1f;}',
    '.cc-banner{left:50%;transform:translateX(-50%);bottom:1rem;width:min(720px,calc(100vw - 2rem));display:flex;flex-wrap:wrap;gap:.9rem 1.25rem;',
    'align-items:center;justify-content:space-between;padding:1rem 1.15rem;border-radius:12px;}',
    '.cc-text{margin:0;flex:1 1 320px;font-size:.86rem;line-height:1.5;color:var(--_colors---color-6,#525252);}',
    '.cc-banner a,.cc-panel a{color:var(--_colors---accent,#2B7BA3);text-decoration:underline;font-weight:500;}',
    '.cc-actions{display:flex;flex-wrap:wrap;gap:.6rem;flex:0 0 auto;align-items:center;}',
    '.cc-btn{font-family:inherit;font-size:.82rem;font-weight:500;padding:.6rem 1.1rem;border-radius:8px;cursor:pointer;line-height:1;',
    'border:1px solid var(--_colors---accent,#2B7BA3);background:var(--_colors---accent,#2B7BA3);color:#fff;min-width:7.5rem;}',
    '.cc-btn:hover{filter:brightness(1.06);}',
    '.cc-btn:focus-visible,.cc-link:focus-visible,.cc-panel input:focus-visible{outline:2px solid #2B7BA3;outline-offset:2px;}',
    '.cc-link{font-family:inherit;font-size:.82rem;background:none;border:0;padding:.4rem .2rem;cursor:pointer;color:var(--_colors---accent,#2B7BA3);text-decoration:underline;}',
    '.cc-panel{left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 2rem));max-height:calc(100vh - 2rem);overflow:auto;padding:1.25rem 1.35rem;border-radius:14px;}',
    '.cc-panel h2{margin:0 0 .5rem;font-size:1.05rem;font-weight:600;}',
    '.cc-panel p{margin:0 0 .8rem;font-size:.84rem;line-height:1.5;color:#525252;}',
    '.cc-cat{display:flex;gap:.8rem;align-items:flex-start;padding:.75rem 0;border-top:1px solid rgba(0,0,0,.08);}',
    '.cc-cat input{margin-top:.2rem;width:1.05rem;height:1.05rem;flex:0 0 auto;}',
    '.cc-cat label{font-size:.88rem;font-weight:600;}',
    '.cc-cat span{display:block;font-size:.8rem;font-weight:400;color:#525252;line-height:1.45;margin-top:.15rem;}',
    '.cc-gpc{margin:.2rem 0 0;padding:.5rem .7rem;border-radius:8px;background:rgba(43,123,163,.08);font-size:.8rem;color:#1f1f1f;}',
    '.cc-panel .cc-actions{margin-top:.9rem;justify-content:flex-end;}',
    '.cc-scrim{position:fixed;inset:0;z-index:2147482999;background:rgba(0,0,0,.35);}',
    '@media(max-width:560px){.cc-banner{flex-direction:column;align-items:stretch;}.cc-actions{justify-content:stretch;}.cc-actions .cc-btn{flex:1 1 0;}}'
  ].join('');

  var styled = false, bannerEl = null, panelEl = null, scrimEl = null, lastFocus = null;
  function ensureStyle() {
    if (styled) return; styled = true;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function remove(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  function choose(c) {
    var before = read();
    var next = { analytics: !!c.analytics, ads: !!c.ads && !gpc };
    write(next);
    remove(bannerEl); bannerEl = null;
    closePanel();
    var withdrew = before && ((before.analytics && !next.analytics) || (before.ads && !next.ads));
    var anyLoaded = loaded.gtag || loaded.cs;
    if (withdrew) {
      gtag('consent', 'update', {
        analytics_storage: next.analytics ? 'granted' : 'denied',
        ad_storage: next.ads ? 'granted' : 'denied',
        ad_user_data: next.ads ? 'granted' : 'denied',
        ad_personalization: next.ads ? 'granted' : 'denied'
      });
      clearTrackingCookies();
      if (anyLoaded) { location.reload(); return; }
    }
    apply(next);
  }

  function showBanner() {
    ensureStyle();
    if (bannerEl) return;
    bannerEl = document.createElement('div');
    bannerEl.className = 'cc-banner';
    bannerEl.setAttribute('role', 'region');
    bannerEl.setAttribute('aria-label', 'Cookie consent');
    bannerEl.innerHTML =
      '<p class="cc-text">We use optional cookies to measure how the site is used (analytics) and how our ads perform (advertising). ' +
      'Strictly necessary cookies are always on. Optional cookies stay off unless you accept them. ' +
      '<a href="' + POLICY_URL + '">Cookie details</a>.' +
      (gpc ? ' Your browser’s Global Privacy Control signal is honored: advertising cookies stay off.' : '') + '</p>' +
      '<div class="cc-actions">' +
      '<button type="button" class="cc-link" data-cc="manage">Manage preferences</button>' +
      '<button type="button" class="cc-btn" data-cc="reject">Reject all</button>' +
      '<button type="button" class="cc-btn" data-cc="accept">Accept all</button>' +
      '</div>';
    bannerEl.querySelector('[data-cc="accept"]').addEventListener('click', function () { choose({ analytics: true, ads: true }); });
    bannerEl.querySelector('[data-cc="reject"]').addEventListener('click', function () { choose({ analytics: false, ads: false }); });
    bannerEl.querySelector('[data-cc="manage"]').addEventListener('click', function () { openPanel(); });
    document.body.appendChild(bannerEl);
  }

  function closePanel() {
    remove(panelEl); remove(scrimEl); panelEl = scrimEl = null;
    document.removeEventListener('keydown', onKey, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }
  function onKey(e) {
    if (!panelEl) return;
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); if (!read()) showBanner(); return; }
    if (e.key === 'Tab') {                                   // keep focus inside the dialog
      var f = panelEl.querySelectorAll('button, input:not([disabled]), a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openPanel() {
    ensureStyle();
    if (panelEl) return;
    lastFocus = document.activeElement;
    var cur = read() || { analytics: false, ads: false };
    scrimEl = document.createElement('div');
    scrimEl.className = 'cc-scrim';
    scrimEl.addEventListener('click', function () { closePanel(); if (!read()) showBanner(); });
    panelEl = document.createElement('div');
    panelEl.className = 'cc-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', 'cc-title');
    panelEl.innerHTML =
      '<h2 id="cc-title">Your Privacy Choices</h2>' +
      '<p>Choose which optional cookies we may use. You can change or withdraw your choice at any time from the ' +
      '“Your Privacy Choices” link in the footer. Withdrawing deletes our analytics and advertising cookies from this browser. ' +
      'California residents: turning off advertising opts you out of the “sale” or “sharing” of personal information for targeted advertising. ' +
      '<a href="' + POLICY_URL + '">Cookie details</a>.</p>' +
      '<div class="cc-cat"><input type="checkbox" id="cc-necessary" checked disabled>' +
      '<label for="cc-necessary">Strictly necessary<span>Required for the site to work (security, routing, remembering this choice). Always on.</span></label></div>' +
      '<div class="cc-cat"><input type="checkbox" id="cc-analytics"' + (cur.analytics ? ' checked' : '') + '>' +
      '<label for="cc-analytics">Analytics<span>Google Analytics 4 and Contentsquare (Hotjar) help us understand how the site is used.</span></label></div>' +
      '<div class="cc-cat"><input type="checkbox" id="cc-ads"' + (cur.ads && !gpc ? ' checked' : '') + (gpc ? ' disabled aria-describedby="cc-gpc"' : '') + '>' +
      '<label for="cc-ads">Advertising<span>Google Ads measures how our advertising performs (conversion and advertising cookies).</span>' +
      (gpc ? '<span class="cc-gpc" id="cc-gpc" data-cc="gpc-note">Global Privacy Control signal honored: your browser asked us not to sell or share your data, so advertising stays off.</span>' : '') +
      '</label></div>' +
      '<div class="cc-actions">' +
      '<button type="button" class="cc-btn" data-cc="reject">Reject all</button>' +
      '<button type="button" class="cc-btn" data-cc="accept">Accept all</button>' +
      '<button type="button" class="cc-btn" data-cc="save">Save choices</button>' +
      '</div>';
    panelEl.querySelector('[data-cc="accept"]').addEventListener('click', function () { choose({ analytics: true, ads: true }); });
    panelEl.querySelector('[data-cc="reject"]').addEventListener('click', function () { choose({ analytics: false, ads: false }); });
    panelEl.querySelector('[data-cc="save"]').addEventListener('click', function () {
      choose({ analytics: panelEl.querySelector('#cc-analytics').checked, ads: panelEl.querySelector('#cc-ads').checked });
    });
    remove(bannerEl); bannerEl = null;
    document.body.appendChild(scrimEl);
    document.body.appendChild(panelEl);
    document.addEventListener('keydown', onKey, true);
    panelEl.querySelector('#cc-analytics').focus();
  }

  window.celesteCookieSettings = function () {
    if (document.body) openPanel();
    else document.addEventListener('DOMContentLoaded', openPanel);
  };
  window.celesteConsent = {
    version: CONSENT_VERSION,
    gpc: gpc,
    get: function () { var c = read(); return c ? { analytics: c.analytics, ads: c.ads, gpc: gpc, version: CONSENT_VERSION } : null; }
  };

  // Footer "Your Privacy Choices" links (no-JS fallback: their href goes to the cookie section).
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-privacy-choices]') : null;
    if (!t) return;
    e.preventDefault();
    openPanel();
  });

  /* ── Boot ── */
  var prior = read();
  if (prior) { apply(prior); return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
  else showBanner();
})();
