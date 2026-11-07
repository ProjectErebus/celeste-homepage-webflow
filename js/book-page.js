/* /book page logic. Contract: booking-api-contract.md v1 + v1.4 (form-first lead, IMO resolver).
 * Steps: 1 lead (IMO, role, name, email) -> 2 slot picker -> 3 confirm -> done. */
(function () {
  'use strict';
  var B = window.celesteBook;
  var $ = function (id) { return document.getElementById(id); };
  var status = $('bk-status'), chosen = null, tz = null, busy = false, attempt = null;
  var leadToken = null, leadEmail = '', leadBody = null, imoLookup = 0;
  var SEC = ['bk-step1', 'bk-step2', 'bk-step3', 'bk-done'];

  function say(html, kind) { status.className = 'bk-status' + (kind ? ' bk-' + kind : ''); status.innerHTML = html; }
  function track(name, props) { try { if (window.celesteEvents) window.celesteEvents.track(name, props); } catch (e) {} }
  var STEP_EVENT = { 1: 'lead', 2: 'slot', 3: 'confirm' };
  function step(n, focus) {
    SEC.forEach(function (id, i) { $(id).hidden = i + 1 !== n; });
    var h = n === 4 ? $('bk-done') : (n === 3 ? $('bk-step3') : (n === 1 && focus ? $('bk-name') : null));
    if (h) h.focus();
    if (STEP_EVENT[n]) track('book_step', { step: STEP_EVENT[n] });
  }

  /* ---- IMO (contract v1.4): strip "IMO" prefix + whitespace, 7 digits, check digit (d1*7+...+d6*2)%10 === d7 ---- */
  function cleanImo(v) { return String(v || '').replace(/^\s*imo[\s:#-]*/i, '').replace(/\s+/g, ''); }
  function imoValid(v) {
    var s = cleanImo(v);
    if (!/^\d{7}$/.test(s)) return false;
    var sum = 0;
    for (var i = 0; i < 6; i++) sum += Number(s.charAt(i)) * (7 - i);
    return sum % 10 === Number(s.charAt(6));
  }
  window.celesteBookImo = { valid: imoValid, clean: cleanImo };

  /* On a valid IMO, look the vessel up (same-origin POST /api/imo-lookup, SERVER04) and show it for the visitor to confirm.
     not_found / 400 / 429 / 503 / network error = silent: the typed IMO is kept and the visitor moves on. Particulars only; never MMSI or position. */
  var note = $('bk-imo-note'), gt = $('bk-imo-gt'), cands = $('bk-imo-cands');
  function unk(v, f) { return v === null || v === undefined || v === '' ? null : f(v); }
  function describe(v) {
    v = v || {};
    return [
      'M/Y ' + (unk(v.name, String) || 'name unknown'),
      unk(typeof v.length_m === 'number' && isFinite(v.length_m) && v.length_m > 0 ? v.length_m : null, function (n) { return Math.round(n) + ' m'; }) || 'length unknown',
      unk(v.flag, String) || 'flag unknown'
    ].join(' \u00b7 ');
  }
  function clearNote() { note.textContent = ''; note.className = 'bk-vessel'; gt.textContent = ''; gt.hidden = true; cands.textContent = ''; }
  function showVessel(v, ask, elig) {
    note.textContent = describe(v) + '. ' + ask;
    if (elig === 'over_limit' && v && v.gross_tonnage) {
      gt.textContent = GT_COPY.replace('{gross_tonnage}', String(v.gross_tonnage)); gt.hidden = false; /* never blocks the lead */
    }
  }
  var GT_COPY = (window.celesteBookCopy && window.celesteBookCopy.gt) || "Our records show {gross_tonnage} GT. Tell us if that's wrong.";
  function lookup() {
    var raw = $('bk-imo').value, mine = ++imoLookup;
    clearNote();
    if (!raw.trim()) return;
    if (!imoValid(raw)) {
      if (cleanImo(raw).length >= 7) { note.textContent = 'That IMO number does not look right. Please check the 7 digits.'; note.className = 'bk-vessel bk-err'; }
      return;
    }
    var imo = cleanImo(raw);
    var p;
    try {
      p = fetch('/api/imo-lookup', { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imo: imo }) })
        .then(function (res) { return res.ok ? res.json().catch(function () { return null; }) : null; }, function () { return null; });
    } catch (e) { return; }
    p.then(function (d) {
      if (mine !== imoLookup || !d) return; /* stale, or non-200 / network error: silent */
      if (d.status === 'found' && d.vessel) {
        track('imo_resolved', { found: true });
        showVessel(d.vessel, 'Is this your vessel?', d.eligibility);
      } else if (d.status === 'name_mismatch' && d.vessel) {
        track('imo_resolved', { found: true });
        showVessel(d.vessel, 'Is this yours?', d.eligibility);
      } else if (d.status === 'ambiguous' && Array.isArray(d.candidates) && d.candidates.length) {
        track('imo_resolved', { found: true });
        note.textContent = 'Which of these is yours?';
        d.candidates.slice(0, 5).forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'bk-cand'; b.textContent = describe(c);
          b.addEventListener('click', function () {
            cands.textContent = '';
            if (c.imo && imoValid(String(c.imo))) $('bk-imo').value = cleanImo(String(c.imo));
            showVessel(c, 'Selected.', c.eligibility || d.eligibility);
          });
          cands.appendChild(b);
        });
      } else if (d.status === 'not_found') {
        track('imo_resolved', { found: false });
      }
    });
  }
  /* digits only, max 7 (strips an 'IMO ' prefix or spaces, also on paste) */
  function digits7(v) { return cleanImo(v).replace(/\D/g, '').slice(0, 7); }
  $('bk-imo').addEventListener('input', function () { var el = $('bk-imo'), d = digits7(el.value); if (el.value !== d) el.value = d; });
  $('bk-imo').addEventListener('paste', function (e) {
    try { var t = (e.clipboardData || window.clipboardData).getData('text'); e.preventDefault(); $('bk-imo').value = digits7(t); $('bk-imo').dispatchEvent(new Event('input')); } catch (x) {}
  });
  $('bk-imo').addEventListener('input', lookup);

  function loadSlots(keepMessage) {
    $('bk-slots').setAttribute('aria-busy', 'true');
    if (!keepMessage) say('');
    return B.call('GET', '/api/book/slots?days=14').then(function (r) {
      $('bk-slots').setAttribute('aria-busy', 'false');
      if (!r.ok) {
        $('bk-slots').textContent = '';
        var code = r.data.error || 'network';
        say(B.softError(code) + ' ' + B.mailLink(), 'err');
        return;
      }
      tz = r.data.timezone || null;
      $('bk-zone').textContent = B.zoneLine(tz);
      B.renderSlots($('bk-slots'), r.data.slots || [], function (s) {
        chosen = s;
        $('bk-chosen').textContent = B.fullWhen(s.start) + ', 25 minutes';
        say('');
        step(3);
      });
    });
  }

  $('bk-back').addEventListener('click', function () { step(2); say(''); });

  /* ---- step 1: lead ---- */
  $('bk-lead').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var f = e.target;
    var name = f.name.value.trim(), email = f.email.value.trim(), role = f.role.value, imoRaw = f.imo.value.trim();
    if (!imoRaw || !imoValid(imoRaw)) {
      say(imoRaw ? 'That IMO number does not look right. Please check the 7 digits.' : 'Please enter your vessel\'s 7-digit IMO number.', 'err'); f.imo.focus(); return;
    }
    if (!name || !email || !role || !f.email.validity.valid) {
      say('Please fill in your role, name and a valid email.', 'err');
      (!role ? f.role : (!name ? f.name : f.email)).focus();
      return;
    }
    var a = B.attribution();
    var body = {
      imo: imoRaw ? cleanImo(imoRaw) : null, role: role, name: name, email: email, source: 'book',
      consent: { marketing: !!f.marketing.checked }, anonId: a.anonId, utm: a.utm, gclid: a.gclid, website: f.website.value
    };
    leadBody = body; /* kept in memory only, so an expired token can be renewed silently */
    busy = true; $('bk-lead-submit').disabled = true; say('One moment&hellip;');
    B.call('POST', '/api/book/lead', body).then(function (r) {
      busy = false; $('bk-lead-submit').disabled = false;
      if (r.ok && r.data && r.data.leadToken) {
        leadToken = r.data.leadToken; leadEmail = email; /* in memory only */
        try { localStorage.setItem('celeste_lead_submitted', '1'); } catch (x) {}
        say('');
        step(2);
        loadSlots();
        return;
      }
      var code = r.data.error || 'network';
      if (code === 'invalid') say('Please check your details and try again.', 'err');
      else say(B.softError(code) + ' ' + B.mailLink(), 'err');
    });
  });

  /* ---- step 3: confirm ---- */
  $('bk-submit').addEventListener('click', function () { book(false); });

  function book(renewed) {
    if (busy || !chosen || !leadToken) return;
    var body = { slotStart: chosen.start, leadToken: leadToken, idempotencyKey: null };
    /* Same slot + same lead = same attempt: reuse the key so a retry after a lost response is idempotent. */
    var sig = chosen.start + '|' + leadToken;
    if (!attempt || attempt.sig !== sig) attempt = { sig: sig, key: B.uuid() };
    body.idempotencyKey = attempt.key;
    busy = true; $('bk-submit').disabled = true; say('Booking your call&hellip;');
    B.call('POST', '/api/book', body).then(function (r) {
      busy = false; $('bk-submit').disabled = false;
      if (r.ok) {
        $('bk-when').textContent = B.fullWhen(r.data.start || chosen.start);
        var join = B.safeUrl(r.data.joinUrl), manage = B.safeUrl(r.data.manageUrl, B.MANAGE_HOSTS);
        if (r.data.dryRun === true) {
          $('bk-h3').textContent = 'Test booking only';
          $('bk-invite').textContent = 'This is a test booking: no invite has been sent and no call is scheduled. If you meant to book a real call, please email ' + B.MAIL + '.';
          join = null;
        } else {
          $('bk-invite').textContent = 'The Teams invite is on its way to ' + leadEmail + '.';
        }
        if (join) { $('bk-join-link').href = join; $('bk-join').hidden = false; }
        if (manage) { $('bk-manage-link').href = manage; $('bk-manage').hidden = false; }
        say('');
        step(4);
        return;
      }
      var code = r.data.error || 'network';
      if (code === 'token_expired' && !renewed && leadBody) {
        /* Lead token is valid 24 h: re-submit the same lead silently, then retry the booking once. */
        busy = true; say('Booking your call&hellip;');
        B.call('POST', '/api/book/lead', leadBody).then(function (lr) {
          busy = false;
          if (lr.ok && lr.data && lr.data.leadToken) { leadToken = lr.data.leadToken; book(true); return; }
          say(B.softError(lr.data.error || 'network') + ' ' + B.mailLink(), 'err');
        });
        return;
      }
      if (code === 'slot_taken') {
        chosen = null; step(2);
        say('Sorry, that time was just taken by someone else. Here are the times that are still open.', 'err');
        loadSlots(true);
      } else if (code === 'invalid' || code === 'bad_token' || code === 'token_expired') {
        say('We could not use your details (they may have expired). Please reload the page and start again.', 'err');
      } else {
        say(B.softError(code) + ' ' + B.mailLink(), 'err');
      }
    });
  }

  track('book_step', { step: 'lead' });
})();
