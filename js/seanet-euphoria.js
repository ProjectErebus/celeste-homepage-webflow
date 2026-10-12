/* SeaNet · M/Y Euphoria pages.
   Scenes (.scene) play once: elements marked .st Settle in (0.7s, staggered by --d), S3 draws its chain.
   Nothing loops. The page adds .js-anim to <html> before paint; without it, or under reduced motion,
   every scene renders its terminal frame (see css/seanet-euphoria.css).
   initDeck(): slide navigation (buttons, arrow keys, swipe, #n deep links); a slide's scenes replay on entry.
   initDoc(): long-form proposal; scroll progress, current-section label, each scene plays once in view. */

(function () {
  function play(scene) {
    scene.classList.remove('go');
    void scene.offsetWidth;
    requestAnimationFrame(function () { setTimeout(function () { scene.classList.add('go'); }, 200); });
  }

  window.initDeck = function () {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    var total = slides.length, current = 0;
    var num = document.getElementById('slide-num');
    var bar = document.getElementById('progress-bar');
    var prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function show(i, silent) {
      current = Math.max(0, Math.min(total - 1, i));
      slides.forEach(function (s, k) {
        s.classList.toggle('active', k === current);
        if (k !== current) s.querySelectorAll('.scene').forEach(function (sc) { sc.classList.remove('go'); });
      });
      num.textContent = pad(current + 1) + ' / ' + pad(total);
      bar.style.width = ((current + 1) / total * 100) + '%';
      prev.disabled = current === 0; next.disabled = current === total - 1;
      slides[current].scrollTop = 0;
      slides[current].querySelectorAll('.scene').forEach(play);
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

  window.initDoc = function () {
    var bar = document.getElementById('progress-bar');
    var where = document.getElementById('where');
    var secs = Array.prototype.slice.call(document.querySelectorAll('[data-title]'));
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
      var label = '';
      secs.forEach(function (s) { if (s.getBoundingClientRect().top < 140) label = s.getAttribute('data-title'); });
      if (where.textContent !== label) where.textContent = label;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var scenes = document.querySelectorAll('.scene');
    if (!('IntersectionObserver' in window)) { scenes.forEach(function (s) { s.classList.add('go'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { play(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    scenes.forEach(function (s) { io.observe(s); });
  };
})();
