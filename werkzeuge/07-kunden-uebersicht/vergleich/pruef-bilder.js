/* Prüf-Chat 07.11.2026: Bilder für die Vergleichsseite neu, Vorlage und Neubau je Ansicht bei 1440 und 390 px.
   Start: python3 zentrale/server.py (9100) und python3 -m http.server 9300 --directory vorlage, dann
   node werkzeuge/07-kunden-uebersicht/vergleich/pruef-bilder.js [name,name]
   Die Vorlage läuft unter dem Namen vorlage.test (auf 127.0.0.1 umgeleitet): unter localhost startet ihre Vorführ-Fassung nicht ganz.
   Schreibt die Bilder nach vergleich/bilder/ und die Konsole-Meldungen des Neubaus nach vergleich/bilder/konsole.json. */
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:' + (process.env.VORLAGE_PORT || 9300) + '/culinarium-demo/werkzeuge/';
const VR = V + 'registre/uwerkzeuge/registre/index.html', VB = V + 'bureau/index.html';
const N = 'http://localhost:' + (process.env.PORT || 9100) + '/zentrale/werkzeuge/07-kunden-uebersicht/';
const NI = N + '?wer=Robert';
const zu = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, s);
const randAuf = async (p, w) => { if (w < 500) { await p.click('[data-wo-rand-knopf]').catch(() => {}); await p.waitForTimeout(700); } };
/* Neubau: Kosten des ersten Kunden ändern, im Fenster übernehmen */
async function nbAendern(p, w, nurFenster) {
  await p.evaluate(() => { const e = document.querySelector('.detail [data-aendern="kosten"]'); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 200); });
  await p.click('.detail [data-aendern="kosten"]'); await p.waitForTimeout(900);
  if (nurFenster) return;
  await p.fill('.kf-fenster__inhalt .kf-zeile [data-f="betrag"] >> nth=0', '31,50');
  await p.click('.kf-fenster__kn [data-k="1"]'); await p.waitForTimeout(900);
}
async function vbAngaben(p, w) { await randAuf(p, w); await p.click('.wo-rand >> text=Angaben des Hauses'); await p.waitForTimeout(1800);
  const f = p.locator('#ws-ang-strasse'); await f.fill('Haasemannstraße 15'); await f.blur(); await p.waitForTimeout(900); }
/* [name, Vorlage-Adresse, Vorlage-Tun, Neubau-Adresse, Neubau-Tun] */
const ANSICHTEN = [
  ['start', VR + '#start', null, NI + '#start', null],
  ['start-zahlen', VR + '#start', p => zu(p, '.zahlen'), NI + '#start', p => zu(p, '.zahlen')],
  ['liste', VR + '#besuche', p => zu(p, '.eingang'), NI + '#kunden', p => zu(p, '.eingang')],
  ['seiten', VR + '#seiten', null, NI + '#seiten', null],
  ['seiten-tabelle', VR + '#seiten', p => zu(p, '.tabelle'), NI + '#seiten', p => zu(p, '.tabelle')],
  ['betreuung', VR + '#verlauf', p => zu(p, '.band, .tafel'), NI + '#betreuung', p => zu(p, '.band')],
  ['kosten', VR + '#herkunft', p => zu(p, '.band'), NI + '#kosten', p => zu(p, '.band')],
  ['vertraege', VR + '#buchung', p => zu(p, '.werte'), NI + '#vertraege', p => zu(p, '.werte')],
  ['so', VR + '#zaehlung', null, NI + '#so', null],
  ['fenster', VB, async (p, w) => { await randAuf(p, w); await p.click('.wo-rand >> text=Startseite'); await p.waitForTimeout(1600); await p.evaluate(() => { const e = document.querySelector('.ws-foto:not([disabled])'); if (e) e.click(); }); },
    NI + '#kunden', (p, w) => nbAendern(p, w, true)],
  ['leiste-offen', VB, vbAngaben, NI + '#kunden', (p, w) => nbAendern(p, w)],
  ['quittung', VB, async (p, w) => { await vbAngaben(p, w); await p.click('#ws-speichern'); await p.waitForTimeout(500); },
    NI + '#kunden', async (p, w) => { await nbAendern(p, w); await p.click('#l-speichern'); await p.waitForTimeout(500); }],
  ['rundgang', VR + '#start', async (p, w) => { await randAuf(p, w); await p.click('text=Kurzer Rundgang'); await p.waitForTimeout(1200); },
    NI + '#start', async (p, w) => { await randAuf(p, w); await p.click('text=Kurzer Rundgang'); await p.waitForTimeout(1200); }],
  ['rand', VR + '#start', async p => { await p.click('[data-wo-rand-knopf]').catch(() => {}); }, NI + '#start', async p => { await p.click('[data-wo-rand-knopf]').catch(() => {}); }],
  ['anleitung', V + 'registre/uwerkzeuge/registre/anleitung.html', null, N + 'anleitung.html', null],
  ['anleitung-kapitel', V + 'registre/uwerkzeuge/registre/anleitung.html', p => zu(p, '#k03'), N + 'anleitung.html', p => zu(p, '#k03')],
  ['pruefung', V + 'reception/uwerkzeuge/reception/pruefung.html', null, N + 'pruefung.html', null],
];
const nur = process.argv[2] ? process.argv[2].split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1', '--lang=de-DE'] });
  const konsole = {};
  const frisch = async () => { const p = await b.newPage(); await p.goto(N); await p.evaluate(() => fetch('/zentrale/api/07-kunden-uebersicht/probedaten', { method: 'POST' })); await p.close(); };
  await frisch();
  for (const breite of [1440, 390]) for (const [name, vu, vt, nu, nt] of ANSICHTEN) for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
    if (nur && !nur.includes(name)) continue;
    const c = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', deviceScaleFactor: 1 });
    if (name !== 'rundgang') await c.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kunden-uebersicht', '1'); localStorage.setItem('rundgang-culinarium-registre', '1'); } catch (e) {} });
    await c.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
    const p = await c.newPage();
    const fehler = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(m.type() + ': ' + m.text()); });
    p.on('pageerror', e => fehler.push('Fehler: ' + e.message));
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(3000);
    if (tun) { try { await tun(p, breite); } catch (e) { fehler.push('Prüflauf: ' + e.message.split('\n')[0]); } }
    await p.waitForTimeout(name === 'quittung' ? 300 : 1500);
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 78 });
    if (seite === 'neubau') konsole[name + '-' + breite] = { fehler, ueberRand: ueber };
    await c.close();
    if (seite === 'neubau' && /leiste-offen|quittung/.test(name)) await frisch();
  }
  if (!nur) fs.writeFileSync(ZIEL + 'konsole.json', JSON.stringify(konsole, null, 1));
  else console.log(JSON.stringify(konsole, null, 1));
  await b.close();
})();
