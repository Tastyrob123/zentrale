/* Kunden · Zahlen zählen hoch, sobald sie ins Bild kommen (wie im Sales Cockpit, raum.js Punkt 4, Stand 16.11.2026).
   Gilt für die grossen Zahlen der Lage («4 Häuser»), nicht für Daten. Nur der Text der Zahl ändert sich, die Zeile springt nicht. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const zaehle = b => {
    const t = b.firstChild, m = t && t.nodeType === 3 && /^(\d+)(\s.*)?$/.exec(t.nodeValue); if (!m) return;
    const ziel = +m[1], rest = m[2] || ''; if (!ziel) return;
    b.style.minWidth = b.getBoundingClientRect().width + 'px';
    const t0 = performance.now(), d = 900;
    const schritt = n => { const k = Math.min(1, (n - t0) / d), e = 1 - Math.pow(1 - k, 3); t.nodeValue = Math.round(ziel * e) + rest; if (k < 1) requestAnimationFrame(schritt); else b.style.minWidth = ''; };
    t.nodeValue = '0' + rest; requestAnimationFrame(schritt);
  };
  const io = new IntersectionObserver(l => l.forEach(x => { if (x.isIntersecting && x.target.offsetParent) { io.unobserve(x.target); zaehle(x.target); } }), { threshold: .4 });
  const beobachte = () => document.querySelectorAll('#ws-mitte .wo-lg > b:not([data-kl-z])').forEach(b => { b.setAttribute('data-kl-z', ''); io.observe(b); });
  const los = () => { const m = document.getElementById('ws-mitte'); if (m) new MutationObserver(beobachte).observe(m, { childList: true }); beobachte(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
