/* CelesteOS footer newsletter sign-up (double opt-in).
 *
 * Injects an email field + "Subscribe" button with the approved consent text into the site footer
 * (the "Get in touch" column of footer.c7f / footer.footer, else the end of the footer), so every page
 * that has a footer gets it without editing its HTML. Loaded by /js/celeste-attribution.js, which every
 * page with a footer already includes; it can also be included directly:
 *   <script src="/js/celeste-newsletter.js" defer></script>
 *
 * Sends ONE event to the CelesteOS control plane, the same collector lead_submit uses:
 *   { event_id, event: "newsletter_signup", anon_id, email, page, consent: { analytics, ads } }
 * Analytics consent is not required for this event (the visitor asked for it). anon_id is the stored
 * celeste_anon id when analytics consent exists, otherwise a fresh id for this request that is never stored.
 * The control plane sends the confirmation email; the browser never sends email and never stores the address.
 *
 * API: window.celesteNewsletter.subscribe(email) -> Promise<number HTTP status, 0 on network error>
 */
(function () {
  'use strict';
  if (window.celesteNewsletter) return;

  var ENDPOINT = 'https://control.celeste7.ai/api/collect/web';
  var CONSENT_TEXT = 'Send me CelesteOS updates (no more than 2 a week, unsubscribe anytime).';
  var MSG_OK = 'Check your inbox to confirm your subscription.';
  var MSG_RATE = 'Please try again later';
  var MSG_INVALID = 'Please enter a valid email address.';
  var MSG_ERR = 'That did not go through. Please check the address and try again.';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function uuid() {
    try { if (window.celesteAttribution && window.celesteAttribution.uuid) return window.celesteAttribution.uuid(); } catch (e) {}
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function consent() {
    try { return window.celesteConsent && window.celesteConsent.get ? window.celesteConsent.get() : null; } catch (e) { return null; }
  }
  /* Stored anon id only with analytics consent (celeste-attribution.js decides); otherwise a one-off id. */
  function anonId(c) {
    try { if (c && c.analytics && window.celesteAttribution && window.celesteAttribution.anonId) return window.celesteAttribution.anonId(); } catch (e) {}
    return uuid();
  }

  function subscribe(email) {
    var c = consent();
    var body = JSON.stringify({
      event_id: uuid(),
      event: 'newsletter_signup',
      anon_id: anonId(c),
      email: String(email || '').trim().slice(0, 254),
      page: location.origin + location.pathname,
      consent: { analytics: !!(c && c.analytics), ads: !!(c && c.ads && !c.gpc) }
    });
    try {
      /* JSON as text/plain = CORS "simple" request (no preflight), same as celeste-attribution.js. */
      return fetch(ENDPOINT, { method: 'POST', body: body, mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } })
        .then(function (r) { return r.status; }, function () { return 0; });
    } catch (e) { return Promise.resolve(0); }
  }

  var CSS =
    '.c7nl{margin-top:1.6rem;max-width:26rem}' +
    '.c7nl-h{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 .8rem}' +
    '.c7nl-row{display:flex;gap:.5rem}' +
    '.c7nl-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}' +
    '.c7nl-in{flex:1;min-width:0;box-sizing:border-box;height:44px;padding:0 .9rem;background:#0C0B0A;border:1px solid rgba(255,255,255,.16);border-radius:2px;color:rgba(255,255,255,.92);font-family:"DM Sans",system-ui,sans-serif;font-size:.88rem;font-weight:300}' +
    '.c7nl-in::placeholder{color:rgba(255,255,255,.4)}' +
    '.c7nl-in:focus{outline:none;border-color:#5AABCC}' +
    '.c7nl-btn{flex:none;height:44px;padding:0 1.1rem;border:1px solid #2A5068;border-radius:2px;background:#1A3040;color:#5AABCC;font-family:"DM Sans",system-ui,sans-serif;font-size:.88rem;font-weight:500;cursor:pointer}' +
    '.c7nl-btn:hover{background:#2A5068}' +
    '.c7nl-btn:focus-visible{outline:2px solid #5AABCC;outline-offset:2px}' +
    '.c7nl-btn[disabled]{opacity:.6;cursor:default}' +
    'footer .c7nl-consent{font-family:"DM Sans",system-ui,sans-serif;font-size:.78rem;font-weight:300;line-height:1.55;color:rgba(255,255,255,.55);margin:.6rem 0 0}' +
    'footer .c7nl-consent a{display:inline;padding:0;font-size:inherit;color:rgba(255,255,255,.75);text-decoration:underline;text-underline-offset:2px}' +
    'footer .c7nl-consent a:hover{color:#5AABCC}' +
    '.c7nl-status{min-height:1.3em;font-family:"DM Sans",system-ui,sans-serif;font-size:.82rem;line-height:1.5;color:rgba(255,255,255,.75);margin:.5rem 0 0}' +
    '.c7nl-status.is-err{color:#E0A08F}' +
    '@media (max-width:560px){.c7nl{max-width:none}.c7nl-row{flex-direction:column}.c7nl-in{flex:none;width:100%}.c7nl-btn{width:100%}}';

  function build(footer) {
    if (footer.querySelector('.c7nl')) return;
    if (!document.getElementById('c7nl-css')) {
      var st = document.createElement('style'); st.id = 'c7nl-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var host = footer.querySelector('.c7f-contact, .fcol-contact') || footer.querySelector('.c7f-in, .footer-inner') || footer;
    var wrap = document.createElement('form');
    wrap.className = 'c7nl';
    wrap.id = 'newsletter';
    wrap.setAttribute('novalidate', '');
    wrap.setAttribute('aria-labelledby', 'c7nl-h');
    wrap.innerHTML =
      '<p class="c7nl-h" id="c7nl-h">Newsletter</p>' +
      '<div class="c7nl-row">' +
        '<label class="c7nl-sr" for="c7nl-email">Email address</label>' +
        '<input class="c7nl-in" id="c7nl-email" type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" required placeholder="you@example.com" aria-describedby="c7nl-consent c7nl-status">' +
        '<button class="c7nl-btn" type="submit">Subscribe</button>' +
      '</div>' +
      '<p class="c7nl-consent" id="c7nl-consent"></p>' +
      '<p class="c7nl-status" id="c7nl-status" role="status" aria-live="polite"></p>';
    var consentEl = wrap.querySelector('.c7nl-consent');
    consentEl.appendChild(document.createTextNode(CONSENT_TEXT + ' '));
    var pp = document.createElement('a'); pp.href = '/privacy-policy#newsletter'; pp.textContent = 'Privacy Policy';
    consentEl.appendChild(pp);
    host.appendChild(wrap);

    var input = wrap.querySelector('input'), btn = wrap.querySelector('button'), status = wrap.querySelector('.c7nl-status');
    function say(text, err) { status.textContent = text; status.className = 'c7nl-status' + (err ? ' is-err' : ''); }
    wrap.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!EMAIL_RE.test(email)) { say(MSG_INVALID, true); input.focus(); return; }
      btn.disabled = true; say('');
      subscribe(email).then(function (code) {
        btn.disabled = false;
        if (code === 202 || code === 200) { input.value = ''; say(MSG_OK, false); }
        else if (code === 429) say(MSG_RATE, true);
        else say(MSG_ERR, true);
      });
    });
    if (location.hash === '#newsletter') { try { wrap.scrollIntoView({ block: 'center' }); } catch (e) {} }
  }

  function init() {
    var footer = document.querySelector('footer');
    if (footer) build(footer);
  }

  window.celesteNewsletter = { subscribe: subscribe };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
