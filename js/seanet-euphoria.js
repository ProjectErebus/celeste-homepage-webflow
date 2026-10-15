/* SeaNet · M/Y Euphoria pages.
   1. Sequenced SVG animations: any element inside svg.anim with data-in="0.2" fades in at 20% of the
      svg's data-dur cycle and out at data-out (default 0.94). SVGs without data-in carry their own SMIL.
      Reduced motion: every animation is shown at its finished frame and paused, never its first frame;
      short pulse loops (dots, marching dashes) are removed so their elements rest at full value.
   2. initDeck(): slide navigation (buttons, arrow keys, swipe, #n deep links) for the overview deck.
   3. initDoc(): scroll progress, current-section label and restart-on-view for the technical proposal. */

(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TERMINAL = 0.92;         // point in the cycle treated as the finished frame (before the 0.94 resets)
  var DEFAULT_DUR = 9;         // seconds, when an svg has no data-dur
  var DEFAULT_OUT = 0.94;

  // A pulse is a loop with no keyTimes (dots breathing, dashes marching); a reveal has keyTimes.
  function isPulse(an) {
    return an.getAttribute('repeatCount') === 'indefinite' && !an.hasAttribute('keyTimes');
  }

  // Cycle length: data-dur for sequenced SVGs, otherwise the longest reveal animation inside.
  function cycleSeconds(svg) {
    if (svg.hasAttribute('data-dur')) return parseFloat(svg.getAttribute('data-dur'));
    var longest = 0;
    svg.querySelectorAll('animate, animateMotion, animateTransform').forEach(function (an) {
      var d = parseFloat(an.getAttribute('dur'));
      if (!isPulse(an) && d > longest) longest = d;
    });
    return longest || DEFAULT_DUR;
  }

  function sequence(svg) {
    var seconds = cycleSeconds(svg);
    svg.querySelectorAll('[data-in]').forEach(function (el) {
      var a = parseFloat(el.getAttribute('data-in'));
      var o = parseFloat(el.getAttribute('data-out') || DEFAULT_OUT);
      if (reduce) {
        el.setAttribute('opacity', a <= TERMINAL && o > TERMINAL ? '1' : '0');
        return;
      }
      var b = Math.min(a + 0.04, o - 0.01);
      if (a <= 0) { a = 0; b = 0.01; }
      el.setAttribute('opacity', '0');
      var an = document.createElementNS(NS, 'animate');
      an.setAttribute('attributeName', 'opacity');
      an.setAttribute('dur', seconds + 's');
      an.setAttribute('repeatCount', 'indefinite');
      var gone = Math.min(o + 0.03, 1);
      an.setAttribute('values', gone < 1 ? '0;0;1;1;0;0' : '0;0;1;1;0');
      an.setAttribute('keyTimes', '0;' + a + ';' + b + ';' + o + ';' + gone + (gone < 1 ? ';1' : ''));
      el.appendChild(an);
    });
    if (reduce) {
      // Replace each pulse with its end state so nothing freezes mid-pulse: a draw (values a;…;z with
      // a ≠ z, or from/to) rests at its last value; a breathing loop (a;…;a) rests at its drawn value.
      svg.querySelectorAll('animate').forEach(function (an) {
        if (!isPulse(an)) return;
        var attr = an.getAttribute('attributeName');
        var vals = (an.getAttribute('values') || '').split(';');
        var end = an.getAttribute('to') || (vals.length > 1 && vals[0] !== vals[vals.length - 1] ? vals[vals.length - 1] : null);
        if (attr && end !== null) an.parentNode.setAttribute(attr, end.trim());
        an.parentNode.removeChild(an);
      });
      svg.querySelectorAll('animateMotion, animateTransform').forEach(function (an) {
        if (isPulse(an)) an.parentNode.removeChild(an);
      });
      // An SVG's timeline starts at document load and would reset an earlier seek, so seek after load.
      var settle = function () {
        if (svg.setCurrentTime) svg.setCurrentTime(seconds * TERMINAL);
        if (svg.pauseAnimations) svg.pauseAnimations();
      };
      if (document.readyState === 'complete') settle(); else window.addEventListener('load', settle);
    }
  }

  function restartAnims(root) {
    if (reduce) return;
    (root || document).querySelectorAll('svg.anim').forEach(function (svg) {
      if (svg.setCurrentTime) svg.setCurrentTime(0);
    });
  }

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
      slides.forEach(function (s, k) {
        var on = k === current;
        s.classList.toggle('active', on);
        // Hidden slides leave the tab order and the accessibility tree.
        s.inert = !on;
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      num.textContent = pad(current + 1) + ' / ' + pad(total);
      fill.style.width = ((current + 1) / total * 100) + '%';
      prev.disabled = current === 0; next.disabled = current === total - 1;
      slides[current].scrollTop = 0;
      restartAnims(slides[current]);
      if (!silent && history.replaceState) history.replaceState(null, '', '#' + (current + 1));
    }
    window.go = function (d) { show(current + d); };

    window.addEventListener('keydown', function (e) {
      if (document.getElementById('seanet-gate').style.display !== 'none') return;
      var target = e.target && e.target.closest ? e.target : null;
      // Typing fields keep every key. Links and buttons keep Space and Enter; arrows still turn the slide.
      if (target && target.closest('input, textarea, select')) return;
      if (target && (e.key === ' ' || e.key === 'Enter') && target.closest('a, button, summary')) return;
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

  window.initDoc = function () {
    var fill = document.getElementById('progress-fill');
    var where = document.getElementById('where');
    var secs = Array.prototype.slice.call(document.querySelectorAll('[data-title]'));
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
      var label = '';
      secs.forEach(function (s) { if (s.getBoundingClientRect().top < 140) label = s.getAttribute('data-title'); });
      if (where.textContent !== label) where.textContent = label;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Each animation restarts from its first frame when it scrolls into view.
    if (!reduce && typeof window.IntersectionObserver === 'function') {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && e.target.setCurrentTime) e.target.setCurrentTime(0);
        });
      }, { threshold: 0.35 });
      document.querySelectorAll('svg.anim').forEach(function (svg) { io.observe(svg); });
    }
  };
})();
