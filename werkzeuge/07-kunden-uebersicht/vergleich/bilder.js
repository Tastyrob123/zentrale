/* Bilder für werkzeuge/07-kunden-uebersicht/vergleich/: Vorlage (Le Registre, für Rahmen und Fenster Le Bureau, für die Prüfseite La Réception)
   und Neubau (Kunden-Übersicht), je Ansicht bei 1440 und 390 px.
   Neu aufnehmen: Vorlage voll klonen nach <ordner>/culinarium-demo (git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo),
   python3 -m http.server 9081 --bind 127.0.0.1 --directory <ordner>, python3 zentrale/server.py, dann node werkzeuge/07-kunden-uebersicht/vergleich/bilder.js
   Die Vorlage wird unter dem Namen vorlage.test geladen (auf 127.0.0.1 umgeleitet): ihre Vorführ-Weiche beantwortet Anfragen an 127.0.0.1 und localhost
   nicht mit den Beispielwerten, Le Bureau startet dort nicht. */
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:' + (process.env.VORLAGE_PORT || 9081) + '/culinarium-demo/werkzeuge/';
const VR = V + 'registre/uwerkzeuge/registre/index.html', VB = V + 'bureau/index.html';
const N = 'http://localhost:' + (process.env.PORT || 9100) + '/zentrale/werkzeuge/07-kunden-uebersicht/';
const NI = N + '?gruss=tag&wer=Robert';
/* [name, Vorlage-Adresse, was dort tun, Neubau-Adresse, was dort tun] */
const ANSICHTEN = [
  ['start', VR + '#start', 'top', NI + '#start', 'top'],
  ['start-zahlen', VR + '#start', '.zahlen', NI + '#start', '.zahlen'],
  ['liste', VR + '#besuche', '.eingang', NI + '#kunden', '.eingang'],
  ['seiten', VR + '#seiten', 'top', NI + '#seiten', 'top'],
  ['seiten-tabelle', VR + '#seiten', '.tabelle', NI + '#seiten', '.tabelle'],
  ['betreuung', VR + '#verlauf', '.tafel', NI + '#betreuung', '.band'],
  ['kosten', VR + '#herkunft', '.band', NI + '#kosten', '.band'],
  ['vertraege', VR + '#buchung', '.werte', NI + '#vertraege', '.werte'],
  ['so', VR + '#zaehlung', 'top', NI + '#so', 'top'],
  ['fenster', VB, 'bureau-fenster', NI + '#kunden', 'fenster'],
  ['rand', VR + '#start', 'rand', NI + '#start', 'rand'],
  ['anleitung', V + 'registre/uwerkzeuge/registre/anleitung.html', 'top', N + 'anleitung.html', 'top'],
  ['anleitung-kapitel', V + 'registre/uwerkzeuge/registre/anleitung.html', '#k03', N + 'anleitung.html', '#k03'],
  ['pruefung', V + 'reception/uwerkzeuge/reception/pruefung.html', 'top', N + 'pruefung.html', 'top'],
];
const nur = process.argv[2] ? process.argv[2].split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1', '--lang=de-DE'] });
  /* Probedaten frisch, damit die Bilder immer dieselben erfundenen Kunden zeigen */
  { const p = await b.newPage(); await p.goto(N); await p.evaluate(() => fetch('/zentrale/api/07-kunden-uebersicht/probedaten', { method: 'POST' })); await p.close(); }
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of ANSICHTEN) for (const [seite, url, wo] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
    if (nur && !nur.includes(name)) continue;
    const c = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', deviceScaleFactor: 1 });
    await c.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kunden-uebersicht', '1'); localStorage.setItem('rundgang-culinarium-registre', '1'); } catch (e) {} });
    await c.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
    const p = await c.newPage();
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(3200);
    if (wo === 'rand') { await p.click('[data-wo-rand-knopf]').catch(() => {}); }
    else if (wo === 'fenster') { if (breite < 500) await p.evaluate(() => { const e = document.querySelector('.detail [data-aendern="kosten"]'); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 200); }); await p.click('.detail [data-aendern="kosten"]'); }
    else if (wo === 'bureau-fenster') {
      if (breite < 500) await p.click('[data-wo-rand-knopf]').catch(() => {});
      await p.click('text=Startseite').catch(() => {}); await p.waitForTimeout(1600);
      await p.evaluate(() => { const e = document.querySelector('.ws-foto:not([disabled])'); if (e) e.click(); });   /* Fenster «Foto tauschen» */
    }
    else if (wo !== 'top') await p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, wo);
    await p.waitForTimeout(1800);
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 78 });
    await c.close();
  }
  await b.close();
})();
