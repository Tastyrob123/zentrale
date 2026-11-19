/* Bewegung für den Content-Plan als Impuls (Robert 12.11.2026: «mehr geile Animations»). Nur transform/opacity, nur was im Bild ist. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var d = document.documentElement; d.classList.add('bw');
  function seen(els, fn, m) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }); }, { rootMargin: m || '0px 0px -12% 0px', threshold: 0.01 });
    [].forEach.call(els, function (e) { io.observe(e); });
  }
  // Überschriften in Zeilen legen
  document.querySelectorAll('section.blk:not(#start) h2').forEach(function (h) {
    var soft = h.querySelector('.soft'), vorn = document.createElement('span'), z1 = document.createElement('span');
    z1.className = 'zl';
    while (h.firstChild && h.firstChild !== soft) vorn.appendChild(h.firstChild);
    z1.appendChild(vorn); h.insertBefore(z1, h.firstChild);
    if (soft) { var z2 = document.createElement('span'); z2.className = 'zl'; z2.style.setProperty('--zd', '.14s'); h.insertBefore(z2, soft); z2.appendChild(soft); }
  });
  seen(document.querySelectorAll('section.blk:not(#start) h2'), function (h) { h.classList.add('an'); });
  // Fragen-Karten und Kanal-Karten klappen hoch
  document.querySelectorAll('.fragen').forEach(function (g) { [].forEach.call(g.children, function (c, i) { c.classList.add('kn'); c.style.setProperty('--d', (i % 3) * 0.1 + Math.floor(i / 3) * 0.16 + 's'); }); });
  seen(document.querySelectorAll('.kn'), function (c) { c.classList.add('an'); });
  // Fragen zum Weiterdenken
  seen(document.querySelectorAll('.denk'), function (c) { c.classList.add('an'); }, '0px 0px -8% 0px');
  // Kalender: Tage nacheinander
  document.querySelectorAll('.mon').forEach(function (m) {
    var n = 0; [].forEach.call(m.querySelectorAll('.cd:not(.pad)'), function (c) { c.style.setProperty('--cd', Math.min(n++, 31) * 0.022 + 's'); });
  });
  seen(document.querySelectorAll('.mon'), function (m) { m.classList.add('an'); }, '0px 0px -6% 0px');
  // Feed im Handy: so weit laufen, wie er länger ist als der Bildschirm; aus, wenn nicht im Bild
  var g = document.querySelector('.phone3d .ph-grid'), s = document.querySelector('.phone3d .ph-scr'), p = document.querySelector('.phone3d');
  if (g && s) {
    var mass = function () { var ueber = g.scrollHeight - (s.clientHeight - g.offsetTop); g.style.setProperty('--fl', -Math.max(0, ueber) + 'px'); };
    mass(); addEventListener('load', mass); addEventListener('resize', mass);
    new IntersectionObserver(function (es) { es.forEach(function (e) { [p, g].forEach(function (x) { x.classList.toggle('bw-aus', !e.isIntersecting); }); }); }).observe(p);
  }
})();
