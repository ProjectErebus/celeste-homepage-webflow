/* /book/manage?id=&t= : cancel or reschedule. Contract: booking-api-contract.md v1. */
(function () {
  'use strict';
  var B = window.celesteBook;
  var $ = function (id) { return document.getElementById(id); };
  var status = $('bk-status');
  var q = new URLSearchParams(location.search), id = q.get('id') || '', token = q.get('t') || '';
  var busy = false;

  function say(html, kind) { status.className = 'bk-status' + (kind ? ' bk-' + kind : ''); status.innerHTML = html; }
  function done() { $('bk-choice').hidden = true; $('bk-slotstep').hidden = true; }
  function path(action) { return '/api/book/' + encodeURIComponent(id) + '/' + action; }

  function fail(r) {
    var code = (r.data && r.data.error) || 'network';
    if (r.status === 403 || code === 'bad_token') { done(); say('This link is not valid. Please use the link from your booking email, or email us at <a href="mailto:' + B.MAIL + '">' + B.MAIL + '</a>.', 'err'); }
    else if (r.status === 404 || code === 'not_found') { done(); say('We could not find that booking. ' + B.mailLink(), 'err'); }
    else if (r.status === 410 || code === 'already_cancelled') { done(); say('This booking has already been cancelled. You can <a href="/book">book a new time</a>.', 'ok'); }
    else if (code === 'slot_taken') { say('Sorry, that time was just taken. Here are the times that are still open.', 'err'); loadSlots(true); }
    else { say(B.softError(code) + ' ' + B.mailLink(), 'err'); }
  }

  if (!id || !token) {
    done();
    say('This link is incomplete. Please use the link from your booking email, or email us at <a href="mailto:' + B.MAIL + '">' + B.MAIL + '</a>.', 'err');
    return;
  }

  $('bk-cancel').addEventListener('click', function () { $('bk-choice-actions').hidden = true; $('bk-confirm-cancel').hidden = false; $('bk-cancel-yes').focus(); });
  $('bk-cancel-no').addEventListener('click', function () { $('bk-confirm-cancel').hidden = true; $('bk-choice-actions').hidden = false; $('bk-cancel').focus(); });
  $('bk-cancel-yes').addEventListener('click', function () {
    if (busy) return; busy = true; say('Cancelling&hellip;');
    B.call('POST', path('cancel'), { token: token }).then(function (r) {
      busy = false;
      if (r.ok) { done(); say('Your booking is cancelled. Nothing more to do. You can <a href="/book">book a new time</a> whenever you like.', 'ok'); }
      else fail(r);
    });
  });

  function loadSlots(keep) {
    $('bk-choice').hidden = true; $('bk-slotstep').hidden = false;
    $('bk-slots').setAttribute('aria-busy', 'true');
    if (!keep) say('');
    return B.call('GET', '/api/book/slots?days=14').then(function (r) {
      $('bk-slots').setAttribute('aria-busy', 'false');
      if (!r.ok) { $('bk-slots').textContent = ''; say(B.softError(r.data.error) + ' ' + B.mailLink(), 'err'); return; }
      $('bk-zone').textContent = B.zoneLine(r.data.timezone);
      B.renderSlots($('bk-slots'), r.data.slots || [], function (s) {
        if (busy) return; busy = true; say('Moving your booking&hellip;');
        B.call('POST', path('reschedule'), { token: token, slotStart: s.start }).then(function (rr) {
          busy = false;
          if (rr.ok) { done(); say('Done. Your call is now ' + B.fullWhen(rr.data.start || s.start) + '. A fresh invite is on its way.', 'ok'); }
          else fail(rr);
        });
      });
    });
  }
  $('bk-resched').addEventListener('click', function () { loadSlots(false); });
  $('bk-slots-back').addEventListener('click', function () { $('bk-slotstep').hidden = true; $('bk-choice').hidden = false; say(''); });
})();
