/* /book page logic. Contract: booking-api-contract.md v1. */
(function () {
  'use strict';
  var B = window.celesteBook;
  var $ = function (id) { return document.getElementById(id); };
  var status = $('bk-status'), chosen = null, tz = null, busy = false, attempt = null;

  function say(html, kind) { status.className = 'bk-status' + (kind ? ' bk-' + kind : ''); status.innerHTML = html; }
  function step(n) {
    [1, 2, 3].forEach(function (i) { $('bk-step' + i).hidden = i !== n; });
    var h = n === 3 ? $('bk-step3') : (n === 2 ? $('bk-name') : null);
    if (h) h.focus();
  }

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
        $('bk-chosen').textContent = B.fullWhen(s.start) + ', 30 minutes';
        say('');
        step(2);
      });
    });
  }

  $('bk-back').addEventListener('click', function () { step(1); say(''); });

  $('bk-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !chosen) return;
    var f = e.target;
    var name = f.name.value.trim(), email = f.email.value.trim(), company = f.company.value.trim(), role = f.role.value;
    if (!name || !email || !company || !role || !f.email.validity.valid) {
      say('Please fill in your name, a valid email, company and role.', 'err');
      (!name ? f.name : (!f.email.validity.valid || !email ? f.email : (!company ? f.company : f.role))).focus();
      return;
    }
    var a = B.attribution();
    var body = {
      slotStart: chosen.start, name: name, email: email,
      company: company || null, vessel: f.vessel.value.trim() || null, role: role,
      notes: f.notes.value.trim().slice(0, 500) || null,
      anonId: a.anonId, utm: a.utm, gclid: a.gclid,
      consent: { marketing: !!f.marketing.checked },
      website: f.website.value,
      idempotencyKey: null
    };
    /* Same slot + same form data = same attempt: reuse the key so a retry after a lost response is idempotent. */
    var sig = JSON.stringify(body);
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
          $('bk-invite').textContent = 'The Teams invite is on its way to ' + email + '.';
        }
        if (join) { $('bk-join-link').href = join; $('bk-join').hidden = false; }
        if (manage) { $('bk-manage-link').href = manage; $('bk-manage').hidden = false; }
        say('');
        step(3);
        return;
      }
      var code = r.data.error || 'network';
      if (code === 'slot_taken') {
        chosen = null; step(1);
        say('Sorry, that time was just taken by someone else. Here are the times that are still open.', 'err');
        loadSlots(true);
      } else if (code === 'invalid') {
        say('Please check your details and try again.', 'err');
      } else {
        say(B.softError(code) + ' ' + B.mailLink(), 'err');
      }
    });
  });

  loadSlots();
})();
