/* SeaNet · M/Y Euphoria pages.
   1. Sequenced SVG animations: any element inside svg.anim with data-in="0.2" fades in at 20% of the
      svg's data-dur cycle and out at data-out (default 0.94). Reduced motion: everything shown, all paused.
   2. initDeck(): slide navigation (buttons, arrow keys, swipe, #n deep links) for the overview deck. */

(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function sequence(svg) {
    var dur = (svg.getAttribute('data-dur') || '9') + 's';
    svg.querySelectorAll('[data-in]').forEach(function (el) {
      if (reduce) return;
      var a = parseFloat(el.getAttribute('data-in'));
      var o = parseFloat(el.getAttribute('data-out') || '0.94');
      var b = Math.min(a + 0.04, o - 0.01);
      if (a <= 0) { a = 0; b = 0.01; }
      el.setAttribute('opacity', '0');
      var an = document.createElementNS(NS, 'animate');
      an.setAttribute('attributeName', 'opacity');
      an.setAttribute('dur', dur);
      an.setAttribute('repeatCount', 'indefinite');
      an.setAttribute('values', '0;0;1;1;0');
      an.setAttribute('keyTimes', '0;' + a + ';' + b + ';' + o + ';1');
      el.appendChild(an);
    });
    if (reduce && svg.pauseAnimations) svg.pauseAnimations();
  }

  window.restartAnims = function (root) {
    if (reduce) return;
    (root || document).querySelectorAll('svg.anim').forEach(function (svg) {
      if (svg.setCurrentTime) svg.setCurrentTime(0);
    });
  };

  document.querySelectorAll('svg.anim').forEach(sequence);

  window.initDeck = function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    var total = slides.length, current = 0;
    var num = document.getElementById('slide-num');
    var fill = document.getElementById('progress-fill');
    var prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function show(i, silent) {
      current = Math.max(0, Math.min(total - 1, i));
      slides.forEach(function (s, k) { s.classList.toggle('active', k === current); });
      num.textContent = pad(current + 1) + ' / ' + pad(total);
      fill.style.width = ((current + 1) / total * 100) + '%';
      prev.disabled = current === 0; next.disabled = current === total - 1;
      slides[current].scrollTop = 0;
      window.restartAnims(slides[current]);
      if (!silent && history.replaceState) history.replaceState(null, '', '#' + (current + 1));
    }
    window.go = function (d) { show(current + d); };

    window.addEventListener('keydown', function (e) {
      if (document.getElementById('seanet-gate').style.display !== 'none') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    });

    var x0 = null, y0 = null;
    var stage = document.getElementById('stage');
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });

    function fromHash() {
      var h = parseInt((location.hash || '').slice(1), 10);
      show(h >= 1 && h <= total ? h - 1 : 0, true);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  };
})();
