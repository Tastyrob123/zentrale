// Bilder für werkzeuge/01-feinschliff/vergleich/: Vorlage (Le Bureau, Culinarium) und Neubau (Feinschliff), je Ansicht bei 1440 und 390 px.
// Neu aufnehmen (kostet nichts, alles lokal):
//   git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo <ordner>/culinarium-demo   (sonst reicht vorlage/ im Repo nicht: Teile der Demo-Daten fehlen)
//   ein beliebiger Datei-Server auf <ordner>, Port 9371 (python3 -m http.server 9371 --bind 127.0.0.1 --directory <ordner>)
//   python3 zentrale/server.py, python3 werkzeuge/01-feinschliff/probe.py (Probedaten eingespielt), dann: node werkzeuge/01-feinschliff/vergleich/bilder.js
// Die Demo der Vorlage biegt Wege nur richtig um, wenn sie nicht unter 127.0.0.1/localhost läuft: darum der Name vorlage.test (auf 127.0.0.1 umgeleitet).
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:9371/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/';
const N = 'http://localhost:9100/werkzeuge/01-feinschliff/';
const klick = s => `(() => { const e = document.querySelector('${s}'); if (e) e.click(); })()`;
const rolle = s => `(() => { const e = document.querySelector('${s}'); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); })()`;
// [schlüssel, vorlage-adresse, vorlage-schritte, neubau-adresse, neubau-schritte]
const ANSICHTEN = [
  ['start', V + 'index.html', [], N + '?wer=Robert#start', []],
  ['haeufig', V + 'index.html', [rolle('.wo-aufg')], N + '?wer=Robert#start', [rolle('.wo-aufg')]],
  ['bereiche', V + 'index.html', [rolle('.wo-ber')], N + '?wer=Robert#start', [rolle('.wo-ber')]],
  ['bereich', V + 'index.html', [klick('[data-ws-nav="b:start"]'), 'warte'], N + '?wer=Robert#b:index.html', ['warte']],
  ['stelle', V + 'index.html', [klick('[data-ws-nav="b:start"]'), 'warte', klick('#ws-gruppen .ws-st'), rolle('.ws-ed')], N + '?wer=Robert#b:team.html', ['warte', klick('#ws-gruppen .ws-st'), rolle('.ws-ed')]],
  ['entwurf', V + 'index.html', [klick('[data-ws-nav="entwurf"]')], N + '?wer=Robert#aenderungen', []],
  ['fenster', V + 'index.html', [klick('[data-ws-nav="b:start"]'), 'warte', klick('#ws-gruppen .ws-foto')], N + '?wer=Robert#wuensche', [klick('.wo-sb__kn .kn')]],
  ['verlauf', V + 'index.html', [klick('[data-ws-nav="verlauf"]')], N + '?wer=Robert#pruefstand', []],
  ['rand', V + 'index.html', [klick('[data-wo-rand-knopf]')], N + '?wer=Robert#start', [klick('[data-wo-rand-knopf]')]],
  ['anleitung', V + 'anleitung.html', [], N + 'anleitung.html', []],
  ['pruefung', 'http://vorlage.test:9371/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/pruefung.html', [], N + 'pruefung.html', []]
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const nur = process.argv[2];
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of ANSICHTEN) {
    if (nur && nur !== name) continue;
    for (const [seite, url, schritte] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
      const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
      await p.addInitScript(() => { try { ['rundgang-culinarium-bureau', 'rundgang-tasty-feinschliff'].forEach(k => localStorage.setItem(k, '1')); localStorage.removeItem('fs-ort'); } catch (e) {} });
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(2400);
      for (const s of schritte) { if (s === 'warte') await p.waitForTimeout(3500); else { await p.evaluate(s); await p.waitForTimeout(1200); } }
      await p.waitForTimeout(1600);
      await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 78 });
      await p.close();
    }
  }
  await b.close();
})();
