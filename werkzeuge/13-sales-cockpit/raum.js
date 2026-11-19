/* raum.js · Bewegung im Glasraum des Sales Cockpits (Robert 11.11.2026, «Glass-Tile-Parallax-Raum»).
   1 Lichtraum hinter allem: verschiebt sich beim Scrollen langsamer als die Seite (Parallaxe), mit der Maus ein Hauch mit. Eine Ebene, nur transform, ein Takt.
   2 Fortschrittsfelder kippen unter der Maus in die Tiefe, die Zahl liegt vorne, ein Lichtpunkt folgt.
   3 (Lichtplatte der Seitenleiste entfernt, 11.11.2026)
   4 Zahlen zählen hoch, sobald ein Feld sichtbar wird.
   5 Gespräch: in einer Familie klappen alle Häuser zugleich auf, damit die Reihen auf einer Höhe bleiben. */
(function () {
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fein = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* 1 Lichtraum */
  const raum = document.createElement('div');
  raum.className = 'sc-raum'; raum.setAttribute('aria-hidden', 'true');
  raum.innerHTML = '<i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i><b></b>';
  document.body.prepend(raum);
  let mx = 0, my = 0, takt = 0;
  const setze = () => {
    takt = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const y = -(scrollY / max) * innerHeight * 0.1;   // höchstens ein Zehntel Bildschirm über die ganze Seite
    raum.style.transform = `translate3d(${(mx * 14).toFixed(1)}px,${(y + my * 14).toFixed(1)}px,0)`;
  };
  const anstossen = () => { if (!takt) takt = requestAnimationFrame(setze); };
  if (!ruhig) {
    /* kein Mitlaufen beim Scrollen: beim Scrollen bewegt sich nur der Inhalt (Regel 55, Robert 11.11.2026 «hakelig») */
    addEventListener('resize', anstossen);
    /* Hintergrund folgt der Maus nicht mehr: ein bildschirmgrosses Feld, das sich ständig bewegt, flackert in Safari (Robert 11.11.2026) */
    setze();
  }

  /* 2 Felder kippen: abgeschaltet, 3D-Tiefe flackert in Safari beim Scrollen (Robert 11.11.2026) */
  if (false) {
    let feld = null, kt = 0, ev = null;
    const kipp = () => {
      kt = 0; if (!feld || !ev) return;
      const r = feld.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      feld.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
      feld.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg');
      feld.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      feld.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    };
    document.addEventListener('pointermove', e => {
      const f = e.target.closest && e.target.closest('.sc-fort__f');
      if (f !== feld) { if (feld) { feld.classList.remove('kippt'); feld.style.removeProperty('--rx'); feld.style.removeProperty('--ry'); } feld = f; if (feld) feld.classList.add('kippt'); }
      ev = e; if (feld && !kt) kt = requestAnimationFrame(kipp);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { if (feld) { feld.classList.remove('kippt'); feld.style.removeProperty('--rx'); feld.style.removeProperty('--ry'); feld = null; } });
  }

  /* 3 (entfernt 11.11.2026, Robert: die mitgezogene Lichtplatte in der Seitenleiste «sieht ein bisschen panne aus») */

  /* 3b Schrittleiste der Mappe wie der Kopf einer Website: beim Runterscrollen weg, beim Hochscrollen wieder da (Robert 11.11.2026).
        Liegen alle Schritte untereinander, leuchtet in der Leiste der Schritt, der gerade im Bild ist. */
  let altY = scrollY, lt = 0;
  const leiste = () => {
    lt = 0;
    const bar = document.querySelector('.sc-schritte'); if (!bar) { altY = scrollY; return; }
    const y = scrollY, d = y - altY;
    /* nur weggleiten, wenn die Leiste oben angeheftet ist; steht sie noch mitten in der Seite, bleibt sie (Robert 16.11.2026: «verschwindet einfach so nach oben weg») */
    const cs = getComputedStyle(bar), oben = parseFloat(cs.top) || 88, vor = bar.previousElementSibling;
    const frei = vor ? vor.getBoundingClientRect().bottom + (parseFloat(cs.marginTop) || 0) > oben + 2 : false;   // natürlicher Platz der Leiste liegt noch unter dem Kopf: nicht angeheftet
    if (d > 6 && y > 320 && !frei) bar.classList.add('sc-weg');
    else if (d < -6 || y <= 320 || frei) bar.classList.remove('sc-weg');
    altY = y;
    const m = bar.closest('.sc-mappe2');
    if (m && m.classList.contains('sc-alle')) {
      let akt = null;
      document.querySelectorAll('.sc-mappe2 [data-teil]').forEach(t => { if (t.getBoundingClientRect().top < innerHeight * .35) akt = t.dataset.teil; });
      if (akt) bar.querySelectorAll('.sc-schritt').forEach(b => b.classList.toggle('an', b.dataset.schritt === akt));
    }
  };
  addEventListener('scroll', () => { if (!lt) lt = requestAnimationFrame(leiste); }, { passive: true });

  /* 4 Zahlen zählen hoch */
  const zaehle = b => {
    if (b.dataset.gezaehlt) return; b.dataset.gezaehlt = '1';
    const ziel = +b.dataset.zahl || 0, t = b.firstChild; if (!t || t.nodeType !== 3 || ruhig || !ziel) return;
    const t0 = performance.now(), d = 900;
    const schritt = n => { const k = Math.min(1, (n - t0) / d), e = 1 - Math.pow(1 - k, 3); t.nodeValue = String(Math.round(ziel * e)); if (k < 1) requestAnimationFrame(schritt); };
    t.nodeValue = '0'; requestAnimationFrame(schritt);
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(l => l.forEach(x => { if (x.isIntersecting && x.target.offsetParent) { zaehle(x.target); io.unobserve(x.target); } }), { threshold: .4 }) : null;
  const beobachte = () => document.querySelectorAll('.sc-fort__f b[data-zahl]:not([data-gezaehlt])').forEach(b => io ? io.observe(b) : zaehle(b));
  const ansicht = document.getElementById('ansicht');
  if (ansicht) new MutationObserver(beobachte).observe(ansicht, { childList: true, subtree: false });
  document.addEventListener('sc-auf', e => e.target.querySelectorAll('.sc-fort__f b[data-zahl]').forEach(b => { delete b.dataset.gezaehlt; if (io) io.observe(b); else zaehle(b); }));   // ein Haus aufgeklappt: seine Zahlen zählen hoch
  beobachte();

  /* 5 Gespräch: Familie klappt gemeinsam */
  document.addEventListener('toggle', e => {
    const d = e.target; if (!d.classList || !d.classList.contains('sc-gs__d')) return;
    const reihe = d.closest('.sc-karten'); if (!reihe) return;
    reihe.querySelectorAll('.sc-gs__d').forEach(x => { if (x !== d && x.open !== d.open) x.open = d.open; });
  }, true);
})();
