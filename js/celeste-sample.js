/* CelesteOS sample-pack request form (C3).
 *
 * Every link marked  data-sample-pack  keeps its mailto:contact@celeste7.ai href as the no-JS fallback. With JS,
 * a click opens a small modal form instead (native <dialog>; browsers without it follow the mailto as before).
 * The dialog is built on the first click; nothing is sent until the visitor presses the submit button.
 *
 * Sends ONE event to the CelesteOS control plane (same collector and text/plain JSON send as the newsletter):
 *   { event_id, event: "sample_request", anon_id, email, page, consent: { analytics, ads },
 *     role?, vessel_count?, vessel_name?, marketing?: true }
 * anon_id is the stored celeste_anon id when analytics consent exists, otherwise a one-off id that is never stored
 * (celeste-attribution.js decides). The email is never written to storage or the URL.
 *
 * Load after celeste-attribution.js:  <script src="/js/celeste-sample.js" defer></script>
 */
(function () {
  'use strict';
  if (window.celesteSample) return;

  var ENDPOINT = 'https://control.celeste7.ai/api/collect/web';
  var CONSENT_TEXT = 'Send me CelesteOS updates (no more than 2 a week, unsubscribe anytime).';
  var FALLBACK = 'mailto:contact@celeste7.ai?subject=CelesteOS%20sample%20pack';
  var ROLES = [
    ['', 'Select (optional)'],
    ['engineer', 'Chief Engineer / ETO'],
    ['captain', 'Captain'],
    ['fleet_manager', 'Fleet or technical manager'],
    ['owner_rep', "Owner's representative"],
    ['other', 'Other']
  ];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MSG_INVALID = 'Please enter a valid email address.';
  var MSG_COUNT = 'Number of vessels must be a whole number from 1 to 500.';
  var MSG_RATE = 'Please try again later.';
  var MSG_ERR = 'That did not go through. Please try again, or email contact@celeste7.ai.';

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
  function anonId(c) {
    try { if (c && c.analytics && window.celesteAttribution && window.celesteAttribution.anonId) return window.celesteAttribution.anonId() || uuid(); } catch (e) {}
    return uuid();
  }

  /* fields: { email, role?, vessel_count?, vessel_name?, marketing? } -> Promise<HTTP status, 0 on network error> */
  function request(fields) {
    var c = consent();
    var ev = {
      event_id: uuid(),
      event: 'sample_request',
      anon_id: anonId(c),
      email: String(fields.email || '').trim().slice(0, 254),
      page: location.origin + location.pathname,
      consent: { analytics: !!(c && c.analytics), ads: !!(c && c.ads && !c.gpc) }
    };
    if (fields.role) ev.role = fields.role;
    if (fields.vessel_count) ev.vessel_count = fields.vessel_count;
    if (fields.vessel_name) ev.vessel_name = String(fields.vessel_name).slice(0, 80);
    if (fields.marketing) ev.marketing = true;
    try {
      return fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(ev), mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } })
        .then(function (r) { return r.status; }, function () { return 0; });
    } catch (e) { return Promise.resolve(0); }
  }

  var CSS =
    '.c7sp{width:min(30rem,calc(100vw - 32px));max-height:calc(100dvh - 32px);box-sizing:border-box;margin:auto;padding:1.8rem 1.6rem 1.5rem;background:var(--surface,#141311);color:var(--txt,rgba(255,255,255,.92));border:1px solid var(--teal-bd,rgba(90,171,204,.35));border-radius:3px;font-family:var(--font-body,"DM Sans",system-ui,sans-serif);overflow:auto}' +
    '.c7sp::backdrop{background:rgba(0,0,0,.7)}' +
    '.c7sp *{box-sizing:border-box}' +
    '.c7sp-x{position:absolute;top:.6rem;right:.6rem;width:44px;height:44px;border:0;background:none;color:var(--txt2,rgba(255,255,255,.7));font-size:1.5rem;line-height:1;cursor:pointer}' +
    '.c7sp-x:focus-visible,.c7sp-btn:focus-visible{outline:2px solid var(--teal,#5AABCC);outline-offset:2px}' +
    '.c7sp-h{font-size:1.25rem;font-weight:500;margin:0 2.5rem .4rem 0}' +
    '.c7sp-p{font-size:.9rem;font-weight:300;color:var(--txt2,rgba(255,255,255,.7));margin:0 0 1.2rem}' +
    '.c7sp-l{display:block;font-size:.8rem;color:var(--txt2,rgba(255,255,255,.7));margin:0 0 .3rem}' +
    '.c7sp-in{display:block;width:100%;height:44px;margin:0 0 .9rem;padding:0 .9rem;background:var(--bg,#0C0B0A);border:1px solid var(--border,rgba(255,255,255,.16));border-radius:2px;color:var(--txt,rgba(255,255,255,.92));font-family:inherit;font-size:.92rem}' +
    '.c7sp-in:focus{outline:none;border-color:var(--teal,#5AABCC)}' +
    '.c7sp-row{display:flex;gap:.8rem}.c7sp-row>div{flex:1;min-width:0}' +
    '.c7sp-opt{display:flex;align-items:flex-start;gap:.6rem;margin:.1rem 0 .9rem;font-size:.82rem;font-weight:300;line-height:1.5;color:var(--txt2,rgba(255,255,255,.7));cursor:pointer}' +
    '.c7sp-opt input{flex:none;width:18px;height:18px;margin:.1rem 0 0;accent-color:var(--teal,#5AABCC)}' +
    '.c7sp-btn{width:100%;min-height:48px;border:0;border-radius:2px;background:var(--teal,#5AABCC);color:var(--bg,#0C0B0A);font-family:inherit;font-weight:600;font-size:.95rem;cursor:pointer}' +
    '.c7sp-btn[disabled]{opacity:.6;cursor:default}' +
    '.c7sp-status{min-height:1.3em;font-size:.85rem;line-height:1.5;margin:.7rem 0 0}.c7sp-status.is-err{color:#E0A08F}' +
    '.c7sp-alt{font-size:.78rem;color:var(--txt3,rgba(255,255,255,.5));margin:.6rem 0 0}.c7sp-alt a{color:var(--teal,#5AABCC)}' +
    '.c7sp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '@media (max-width:480px){.c7sp{padding:1.5rem 1rem 1.2rem}.c7sp-row{flex-direction:column;gap:0}}';

  var dlg = null, opener = null;

  function build() {
    var st = document.createElement('style'); st.id = 'c7sp-css'; st.textContent = CSS; document.head.appendChild(st);
    dlg = document.createElement('dialog');
    dlg.className = 'c7sp';
    dlg.id = 'sample-pack';
    dlg.setAttribute('aria-labelledby', 'c7sp-h');
    var opts = ROLES.map(function (r) { return '<option value="' + r[0] + '">' + r[1].replace(/'/g, '&#39;') + '</option>'; }).join('');
    dlg.innerHTML =
      '<button type="button" class="c7sp-x" aria-label="Close">&times;</button>' +
      '<h2 class="c7sp-h" id="c7sp-h">Get a sample pack</h2>' +
      '<p class="c7sp-p">We&#39;ll email the sample pack to you.</p>' +
      '<form novalidate>' +
        '<input class="c7sp-hp" id="c7sp-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<label class="c7sp-l" for="c7sp-email">Email</label>' +
        '<input class="c7sp-in" id="c7sp-email" type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" required>' +
        '<label class="c7sp-l" for="c7sp-role">Role</label>' +
        '<select class="c7sp-in" id="c7sp-role" name="role">' + opts + '</select>' +
        '<div class="c7sp-row">' +
          '<div><label class="c7sp-l" for="c7sp-vessel">Vessel name</label>' +
          '<input class="c7sp-in" id="c7sp-vessel" type="text" name="vessel_name" maxlength="80" autocomplete="off"></div>' +
          '<div><label class="c7sp-l" for="c7sp-count">Number of vessels</label>' +
          '<input class="c7sp-in" id="c7sp-count" type="number" name="vessel_count" min="1" max="500" step="1" inputmode="numeric"></div>' +
        '</div>' +
        '<label class="c7sp-opt" for="c7sp-mkt"><input type="checkbox" id="c7sp-mkt" name="marketing" value="1"><span></span></label>' +
        '<button class="c7sp-btn" type="submit">Send me the sample pack</button>' +
        '<p class="c7sp-status" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<p class="c7sp-alt">Prefer email? <a href="' + FALLBACK + '">contact@celeste7.ai</a></p>';
    dlg.querySelector('.c7sp-opt span').textContent = CONSENT_TEXT;
    document.body.appendChild(dlg);

    var form = dlg.querySelector('form'), btn = dlg.querySelector('.c7sp-btn'), status = dlg.querySelector('.c7sp-status');
    var email = dlg.querySelector('#c7sp-email'), count = dlg.querySelector('#c7sp-count'), hp = dlg.querySelector('#c7sp-hp');
    var role = dlg.querySelector('#c7sp-role'), vessel = dlg.querySelector('#c7sp-vessel'), mktBox = dlg.querySelector('#c7sp-mkt');
    function say(t, err) { status.textContent = t; status.className = 'c7sp-status' + (err ? ' is-err' : ''); }

    dlg.querySelector('.c7sp-x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); /* backdrop click */
    dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (hp.value) return; /* bot: drop silently */
      var em = email.value.trim();
      if (!EMAIL_RE.test(em)) { say(MSG_INVALID, true); email.focus(); return; }
      var n = null, raw = count.value.trim();
      if (raw) {
        n = Number(raw);
        if (!/^\d+$/.test(raw) || n < 1 || n > 500) { say(MSG_COUNT, true); count.focus(); return; }
      }
      var mkt = mktBox.checked;
      btn.disabled = true; say('');
      request({ email: em, role: role.value, vessel_count: n, vessel_name: vessel.value.trim(), marketing: mkt }).then(function (code) {
        btn.disabled = false;
        if (code === 202 || code === 200) {
          form.reset();
          say('Thanks. We’ll email the sample pack to you.' + (mkt ? ' Check your inbox to confirm your subscription.' : ''), false);
          try { if (typeof window.gtag === 'function') window.gtag('event', 'sample_request', {}); } catch (err) {}
        } else if (code === 429) say(MSG_RATE, true);
        else say(MSG_ERR, true);
      });
    });
  }

  function open(link) {
    if (!dlg) build();
    opener = link || null;
    dlg.querySelector('.c7sp-status').textContent = '';
    dlg.showModal();
    dlg.querySelector('#c7sp-email').focus();
  }

  var supported = typeof window.HTMLDialogElement === 'function' && 'showModal' in document.createElement('dialog');
  document.addEventListener('click', function (e) {
    if (!supported || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[data-sample-pack]') : null;
    if (!a) return;
    e.preventDefault();
    open(a);
  });

  window.celesteSample = { open: open, request: request };
})();
