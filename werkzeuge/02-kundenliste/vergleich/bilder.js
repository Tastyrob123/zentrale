// Bilder für werkzeuge/02-kundenliste/vergleich/: Vorlage (Website bearbeiten) und Kundenliste, je Ansicht bei 1440 und 390 px.
// Neu aufnehmen:
//   git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo /tmp/vorlage-voll   (sonst geht auch der Ordner vorlage/ im Repo)
//   mkdir -p /tmp/vv && ln -sfn /tmp/vorlage-voll /tmp/vv/culinarium-demo && python3 -m http.server 9300 --bind 127.0.0.1 --directory /tmp/vv
//   python3 zentrale/server.py ; node werkzeuge/02-kundenliste/vergleich/bilder.js
// Die Vorlage läuft nur unter einem eigenen Namen (vorlage.test), nicht unter 127.0.0.1: ihre Demo-Weiche leitet Anfragen an 127.0.0.1/localhost anders um.
// Danach legt das Skript die Bilder der Anleitung (anleitung/*.webp) aus den Aufnahmen bei 1440 px ab (python3 mit Pillow).
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:9300/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/index.html';
const N = 'http://localhost:9100/werkzeuge/02-kundenliste/';
const A = 'http://localhost:9100/api/02-kundenliste/';
const nav = a => async p => {
  if ((p.viewportSize() || {}).width < 900) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(500); }
  await p.click(`#ws-rand [data-ws-nav="${a}"]`); await p.waitForTimeout(1600);
};
const ANSICHTEN = [
  // [name, Vorlage: url und Schritte, Neubau: url und Schritte, nur Handy]
  ['start', V, [], N + '?ansicht=start', []],
  ['liste', V, [nav('e:termine')], N + '?ansicht=liste', []],
  ['brett', V, [nav('b:start')], N + '?ansicht=brett', []],
  ['tafel', V, [nav('angaben')], N + '?haus=alpenblick-grindelwald', []],
  ['fenster', V, [nav('b:start'), async p => { await p.evaluate(() => document.querySelector('.ws-foto').click()); await p.waitForTimeout(1800); }], N + '?ansicht=start', [async p => { await p.click('[data-aufgabe="neu"]'); await p.waitForTimeout(800); }]],
  ['offen', V, [nav('angaben'), async p => { await p.fill('[data-ws-angabe]', '+49 40 000 000'); await p.waitForTimeout(600); }],
    N + '?ansicht=liste', [async p => { await p.locator('.cu-t .ws-auswahl__knopf').first().click(); await p.locator('.ws-auswahl__liste [data-wert="Angebot"]').first().click(); await p.waitForTimeout(600); }]],
  ['quittung', V, [nav('angaben'), async p => { await p.fill('[data-ws-angabe]', '+49 40 000 000'); await p.click('#ws-speichern'); await p.waitForTimeout(1500); }],
    N + '?ansicht=liste', [async p => { await p.locator('.cu-t .ws-auswahl__knopf').first().click(); await p.locator('.ws-auswahl__liste [data-wert="Angebot"]').first().click(); await p.click('#ws-speichern'); await p.waitForTimeout(1500); }]],
  ['verlauf', V, [nav('verlauf')], N + '?ansicht=verlauf', []],
  ['heute', V, [nav('entwurf')], N + '?ansicht=heute', []],
  ['anleitung', V.replace('index.html', 'anleitung.html'), [], N + 'anleitung.html', []],
  ['rand', V, [async p => { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(700); }], N + '?ansicht=start', [async p => { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(700); }], true],
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const nur = process.argv[2];
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns, handy] of ANSICHTEN) {
    if (nur && nur !== name) continue;
    if (handy && breite > 900) continue;
    for (const [seite, url, schritte] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
      if (seite === 'neubau') await (await b.newContext()).request.post(A + 'probedaten', { data: { wer: 'Vergleich' } });
      const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      const p = await ctx.newPage();
      await p.route(r => !/^https?:\/\/(vorlage\.test|127\.0\.0\.1|localhost)/.test(r), r => r.abort());
      await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kundenliste', '1'); localStorage.setItem('rundgang-culinarium-bureau', '1'); } catch (e) {} });
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(2600);
      for (const s of schritte) { try { await s(p); } catch (e) { console.log(name, seite, breite, 'Schritt:', e.message.split('\n')[0]); } }
      await p.waitForTimeout(900);
      await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 76 });
      await ctx.close();
    }
  }
  await (await b.newContext()).request.post(A + 'probedaten', { data: { wer: 'Vergleich' } });
  await b.close();
  // Bilder der Anleitung: echte Bildschirme der Kundenliste bei 1440 px
  const AN = { uebersicht: 'start', liste: 'liste', brett: 'brett', haus: 'tafel', neu: 'fenster', quittung: 'quittung', heute: 'heute' };
  for (const [an, v] of Object.entries(AN)) {
    try { execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],"WEBP",quality=78)', ZIEL + v + '-1440-neubau.jpg', __dirname + '/../anleitung/' + an + '.webp']); } catch (e) { console.log('Anleitung', an, e.message.split('\n')[0]); }
  }
})();
