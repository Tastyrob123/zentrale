/* wege.js · Social Cockpit: EIN Rand für das ganze Werkzeug (Robert 13.11.2026: «zusammenlegen und alles … deutlich besser und einfacher erklärt
   und erreichbar und übersichtlicher»). Das Cockpit (index.html) und die Planung (plan/) zeigen denselben Rand in derselben Reihenfolge,
   in vier Schritten: Grundlage → Planen → Kanäle → Auswerten. Jeder Eintrag ist ein Link; auf derselben Seite wechselt nur die Ansicht. */
(function () {
  const ZIEL = { start: 'c', wirkung: 'c', archiv: 'c', pruefung: 'c', material: 'c', kanal: 'c',
    grundlage: 'p', phase: 'p', thema: 'p', format: 'p', rhythmus: 'p', ziele: 'p', fragen: 'p', kalender: 'p', ideen: 'p' };
  window.SO_ERKLAERT = {
    grundlage: 'Worüber wir posten, in welcher Form und an welchem Wochentag. Dazu die Ziele und was wir noch klären.',
    planen: 'Jeder Beitrag bekommt einen Tag im Kalender. Was noch keinen Tag hat, wartet bei den Ideen.',
    kanaele: 'Je Kanal der Feed, so wie er dort aussähe, und die Texte, fertig zum Kopieren in die App.',
    auswerten: 'Was draussen ist, wie es läuft, und alles, was es schon gab.'
  };
  window.soWege = function (d, ort, aktiv) {
    const h = d.heute, B = Object.values(d.beitraege || {}).filter(b => b.stand !== 'verworfen'), s = d.strategie || {};
    const url = (key) => { const z = ZIEL[key.split(':')[0]]; return (z === 'c' ? (ort === 'plan' ? '../' : '') : (ort === 'plan' ? '' : 'plan/')) + '#' + key; };
    const art = String(aktiv || '').split(':')[0];
    const n = x => x ? String(x) : '';
    const e = (key, text, zahl, an, extra) => ({ text, zahl: n(zahl), an, href: url(key), attr: extra || '' });
        const kanaele = (d.reihe || Object.keys(d.kanaele || {})).map(k => d.kanaele[k]).filter(Boolean);
    const inArbeit = k => B.filter(b => (b.kanaele || []).includes(k) && /^(entwurf|geprueft|freigegeben|geplant)$/.test(b.stand)).length;
    /* schlank (Robert 17.11.2026: «super unübersichtlich … eher ein Showcase … nicht praktikabel»): nur noch, womit gearbeitet wird */
    return [
      { eintraege: [e('start', 'Diese Woche', '', art === 'start'),
        e('kalender', 'Kalender', B.filter(b => b.datum && b.datum >= h).length, art === 'kalender' || art === 'rhythmus'),
        e('ideen', 'Ideen', B.filter(b => !b.datum && !/^Feed-Entwurf/.test(b.gruppe || '')).length, art === 'ideen')] },
      { titel: 'Kanäle', eintraege: kanaele.map(k => e('kanal:' + k.id, (k.name || k.id).replace('-Unternehmensprofil', ''), k.id === 'newsletter' ? '' : inArbeit(k.id), aktiv === 'kanal:' + k.id, `data-kanal="${k.id}"`)) },
      { titel: 'Rückblick', eintraege: [e('wirkung', 'Draussen und Wirkung', '', art === 'wirkung'), e('archiv', 'Archiv', B.length, art === 'archiv')] }
    ];
  };
  /* nach WO.rand(): Kanalzeichen vor die Kanäle, Wege unten (Maschine, Impuls-Seite, Kontrollpanel) */
  window.soWegeSchmuck = function (rand, ort, zentrale, ic) {
    rand.querySelectorAll('[data-kanal]').forEach(x => { x.classList.add('so-re-k'); x.insertAdjacentHTML('afterbegin', window.soLogo(x.dataset.kanal, 'so-lg--s')); });
    rand.querySelectorAll('.wo-re').forEach(x => x.setAttribute('data-wo-bw-nie', ''));
    const vor = ort === 'plan' ? '../' : '';
    let w = rand.querySelector('.wo-rand__wege');
    if (!w) { rand.insertAdjacentHTML('beforeend', '<div class="wo-rand__wege"></div>'); w = rand.querySelector('.wo-rand__wege'); }
    w.innerHTML = `<a href="${vor}maschine/">Content-Maschine: Grafiken bauen${ic('pfeil')}</a><a href="${zentrale || '/zentrale/'}">Kontrollpanel${ic('haus')}</a>`;
    const an = rand.querySelector('.wo-an');
    if (an) { const rb = rand.getBoundingClientRect(), b = an.getBoundingClientRect(); if (b.top < rb.top || b.bottom > rb.bottom) rand.scrollTop += b.top - rb.top - rb.height / 3; }
  };
})();
