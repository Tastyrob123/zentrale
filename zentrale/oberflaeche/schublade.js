/* Schublade: EINE Bewegung für jedes Auf- und Zuklappen, in jedem Werkzeug (Robert 16.11.2026: «jedes Aufklappen seitenweit luxuriös und edel
   nach den Vorbildern»; 17.11.2026 im KI-Check wieder eingefordert). Vorlage: schublade() im Sales Cockpit (werkzeuge/13-sales-cockpit/cockpit.js).
   Vorhang statt Überblendung: nichts blendet ein oder aus, nichts liegt übereinander. Eine Kante wandert nach unten, oberhalb ist der Inhalt zu sehen,
   alles darunter gleitet genau mit dieser Kante. Zu: dieselbe Bewegung rückwärts, das Layout springt erst ganz am Ende um (unsichtbar).
   Nur transform und clip-path, eine Dauer, eine Kurve.
   Aufruf: WO_SCHUBLADE([{ teil, huelle, setze(v) }, …], an, fertig)
     teil   = was auf- oder zugeht (Merker gegen Doppelklick)
     huelle = Fläche, die dabei wächst (wird an der wandernden Kante beschnitten)
     setze  = schaltet den Zustand um (true = offen), ohne Bewegung
   Mehrere Paare gleichzeitig (z. B. «Alle aufklappen») laufen in derselben Bewegung. */
(function () {
  const AUF = [900, 'cubic-bezier(.5,0,.15,1)'], ZU = [720, 'cubic-bezier(.65,0,.35,1)'];
  const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function unterDem(el) {
    const l = []; let e = el;
    while (e && e.id !== 'ansicht' && e !== document.body) { let n = e.nextElementSibling; while (n) { l.push(n); n = n.nextElementSibling; } e = e.parentElement; }
    return l;
  }
  function schublade(paare, an, fertig = () => {}) {
    paare = (paare || []).filter(p => p && p.huelle);
    if (!paare.length) { fertig(); return; }
    if (RUHIG()) { paare.forEach(p => p.setze(an)); fertig(); return; }
    if (paare.some(p => p.teil && p.teil._laeuft)) return;
    paare.forEach(p => { if (p.teil) p.teil._laeuft = true; });
    const mit = [...new Set(paare.flatMap(p => [p.huelle, ...unterDem(p.huelle)]))];
    const lese = () => mit.map(x => x.getBoundingClientRect().top), hoehe = () => paare.map(p => p.huelle.getBoundingClientRect().height);
    const alle = v => paare.forEach(p => p.setze(v));
    let zuT, zuH;
    if (an) { zuT = lese(); zuH = hoehe(); alle(true); }
    else { alle(false); zuT = lese(); zuH = hoehe(); alle(true); }
    const aufT = lese(), aufH = hoehe();
    const [D, E] = an ? AUF : ZU, anims = [], nah = y => y < innerHeight * 2.2 && y > -innerHeight;
    const lauf = (el, von, bis) => anims.push(el.animate(an ? [von, bis] : [bis, von], { duration: D, easing: E, fill: an ? 'none' : 'forwards' }));
    mit.forEach((x, i) => { const d = aufT[i] - zuT[i]; if (Math.abs(d) < 1 || (!nah(zuT[i]) && !nah(aufT[i]))) return;
      lauf(x, { transform: `translateY(${-d}px)` }, { transform: 'none' }); });
    paare.forEach((p, i) => { const H = aufH[i] - zuH[i]; if (H < 1) return;
      const r = getComputedStyle(p.huelle).borderBottomLeftRadius || '0px';
      lauf(p.huelle, { clipPath: `inset(0px 0px ${H}px 0px round 0px 0px ${r} ${r})` }, { clipPath: `inset(0px 0px 0px 0px round 0px 0px ${r} ${r})` }); });
    Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
      if (!an) { alle(false); anims.forEach(a => a.cancel()); }
      paare.forEach(p => { if (p.teil) p.teil._laeuft = false; });
      fertig();
    });
  }
  window.WO_SCHUBLADE = schublade;
})();
