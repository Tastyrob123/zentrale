/* Bilder für werkzeuge/09-ki-check/vergleich/ (Prüfung 2, 07.11.2026): Vorlage und KI-Check, je Ansicht bei 1440 und 390 px.
   Vorlage: Le Registre; Fenster, Leiste gelb und Quittung aus Le Bureau; Prüfseite aus La Réception.
   Prüfstand:
     python3 zentrale/server.py                                   (KI-Check, Probedaten geladen)
     python3 -m http.server 9300 --directory vorlage              (Vorlage aus dem Repo)
   Die Demo-Weiche der Vorlage friert unter «localhost» ein und biegt unter 127.0.0.1 alle Wege nach GitHub um. Darum ruft Chromium die Vorlage
   unter dem Namen vorlage.test auf (auf 127.0.0.1 umgelenkt). Für Fotos die volle Vorlage auf VPORT legen:
     git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo <ordner>/culinarium-demo
     python3 -m http.server 9301 --directory <ordner>
   VPORT=9301 node werkzeuge/09-ki-check/vergleich/bilder.js   (ohne VPORT: 9300)
   Schreibt bilder/*.jpg und bilder/protokoll.json (Konsole und Breite je Bild). */
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = __dirname + '/bilder/';
const VP = process.env.VPORT || '9300';
const VB = `http://vorlage.test:${VP}/culinarium-demo/werkzeuge/`;
const V = VB + 'registre/uwerkzeuge/registre/index.html';
const VA = VB + 'registre/uwerkzeuge/registre/';
const B = VB + 'bureau/uwerkzeuge/bureau/index.html';
const VR = VB + 'reception/uwerkzeuge/reception/';
const N = 'http://localhost:9100/werkzeuge/09-ki-check/';

const zweiter = async p => { const l = p.locator('#ansicht .besuch'); await l.nth(1).click(); await p.waitForTimeout(600); await p.locator('#ansicht .detail, #ansicht article').first().scrollIntoViewIfNeeded().catch(() => {}); };
const rand = async p => { const k = p.locator('#kopf .wo-kopf__ber'); if (await k.isVisible()) await k.click(); };

const bureauTermine = async p => { await p.click('text=Neuer Abend'); await p.waitForTimeout(1800); };
const bureauFenster = async p => { await bureauTermine(p); await p.locator('main .wo-kn', { hasText: 'Neuer Abend' }).first().click(); };
const bureauQuittung = async p => { await bureauFenster(p); await p.waitForTimeout(1200); await p.click('#ws-speichern', { force: true }); await p.waitForTimeout(1200); };
const bureauFrage = async p => { await bureauTermine(p); await p.locator('main .ws-link', { hasText: 'Von der Seite nehmen' }).first().click(); };
const mail = async p => { await p.waitForTimeout(5000); await p.click('#ansicht [data-mail]'); };
const loeschenFrage = async p => { await p.waitForTimeout(5000); await p.click('#ansicht [data-weg-loeschen]'); };
const kundenliste = async p => { const k = p.locator('#ansicht [data-kl]').first(); await k.scrollIntoViewIfNeeded(); await k.click(); await p.waitForTimeout(900); };
const zurueck = async p => { const r = p.locator('#quittung button', { hasText: /Rückgängig/i }).first(); if (await r.count()) await r.click(); await p.waitForTimeout(800); };

// [name, vorlage-url, vorlage-tun, neubau-url, neubau-tun, neubau-danach]; tun: 'top' | 'unten' | Zahl (scrollen) | Funktion
const ANSICHTEN = [
  ['start', V + '?gruss=tag#start', 'top', N + '?gruss=tag#start', 'top'],
  ['start-zahlen', V + '?gruss=tag#start', 640, N + '?gruss=tag#start', 640],
  ['start-unten', V + '?gruss=tag#start', 'unten', N + '?gruss=tag#start', 'unten'],
  ['liste', V + '#besuche', 'top', N + '#checks', 'top'],
  ['liste-karte', V + '#besuche', 560, N + '#checks', 560],
  ['karte-gewaehlt', V + '#besuche', zweiter, N + '#checks', zweiter],
  ['herkunft', V + '#herkunft', 420, N + '#herkunft', 420],
  ['zeit', V + '#zeit', 420, N + '#zeit', 420],
  ['tabelle', V + '#seiten', 420, N + '#bereiche', 420],
  ['verlauf', V + '#verlauf', 480, N + '#verlauf', 480],
  ['kundenliste', V + '#buchung', 480, N + '#gespraech', 480],
  ['so-wird-geprueft', V + '#zaehlung', 300, N + '#geprueft', 300],
  ['rand-offen', V + '#start', rand, N + '#start', rand],
  ['rundgang', V + '?rundgang#start', 'top', N + '?rundgang#start', 'top'],
  ['fenster', B, bureauFenster, N + '#checks', mail],
  ['fenster-loeschen', B, bureauFrage, N + '#checks', loeschenFrage],
  ['leiste-offen', B, bureauFenster, N + '#checks', 'top'],
  ['quittung', B, bureauFrage, N + '#checks', kundenliste, zurueck],
  ['anleitung', VA + 'anleitung.html', 'top', N + 'anleitung.html', 'top'],
  ['anleitung-kapitel', VA + 'anleitung.html#k03', 'top', N + 'anleitung.html#k03', 'top'],
  ['pruefung', VR + 'pruefung.html', 'top', N + 'pruefung.html', 'top'],
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const nur = process.argv[2], protokoll = [];
  for (const breite of [1440, 390]) for (const [name, vu, vt, nu, nt, danach] of ANSICHTEN) {
    if (nur && name !== nur) continue;
    for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
      const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
      const p = await ctx.newPage(), konsole = [];
      p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') konsole.push(m.type() + ': ' + m.text()); });
      p.on('pageerror', e => konsole.push('Seitenfehler: ' + e.message));
      await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)[:/]/.test(r), r => r.abort());
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(3200);
      let fehler = '';
      if (tun === 'unten') await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      else if (typeof tun === 'number') await p.evaluate(y => scrollTo(0, y), tun);
      else if (typeof tun === 'function') await tun(p).catch(e => { fehler = e.message.split('\n')[0]; });
      await p.waitForTimeout(2600);
      await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 74 });
      const breit = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      if (seite === 'neubau' && danach) await danach(p).catch(() => {});
      protokoll.push({ name, breite, seite, url, konsole, ueberlauf: breit[0] > breit[1] ? breit : null, fehler });
      await ctx.close();
    }
  }
  if (!nur || nur === 'alle') fs.writeFileSync(ZIEL + 'protokoll.json', JSON.stringify(protokoll, null, 1));
  else console.log(JSON.stringify(protokoll, null, 1));
  await b.close();
})();
