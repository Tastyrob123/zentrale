// Prüf-Aufnahmen 02-kundenliste (Prüf-Chat 07.11.2026, Nachbesserung: Ansicht «import» dazu): Vorlage (Le Bureau, Prüfseite nach La Carte) und Neubau je Ansicht bei 1440 und 390 px.
// Start: python3 zentrale/server.py ; python3 -m http.server 9300 --directory vorlage ; node werkzeuge/02-kundenliste/vergleich/pruefung-aufnahme.js
// Die Vorlage lädt nur unter dem Namen vorlage.test (Chromium bildet ihn auf 127.0.0.1 ab), nicht unter localhost. Schreibt nur nach vergleich/bilder/.
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = '/home/user/tasty-studios-intern/werkzeuge/02-kundenliste/vergleich/bilder/';
const VB = 'http://vorlage.test:9300/culinarium-demo/werkzeuge/';
const V = VB + 'bureau/uwerkzeuge/bureau/index.html';
const N = 'http://localhost:9100/werkzeuge/02-kundenliste/';
const A = 'http://localhost:9100/api/02-kundenliste/';
const nav = a => async p => {
  if ((p.viewportSize() || {}).width < 900) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(600); }
  await p.click(`#ws-rand [data-ws-nav="${a}"]`); await p.waitForTimeout(1600);
};
const warte = ms => async p => p.waitForTimeout(ms);
const standOffen = async p => { await p.locator('.cu-t .ws-auswahl__knopf').first().click(); await p.locator('.ws-auswahl__liste [data-wert="Angebot"]').first().click(); await p.waitForTimeout(700); };
const ANSICHTEN = [
  // name, Vorlage-URL, Schritte, Neubau-URL, Schritte, {handy, voll, rundgang}
  ['start', V, [], N + '?ansicht=start', []],
  ['start-ganz', V, [], N + '?ansicht=start', [], { voll: true }],
  ['liste', V, [nav('e:termine')], N + '?ansicht=liste', []],
  ['brett', V, [nav('b:start')], N + '?ansicht=brett', []],
  ['heute', V, [nav('e:termine')], N + '?ansicht=heute', []],
  ['stand', V, [nav('b:abend')], N + '?ansicht=stand:Gespräch', []],
  ['haus', V, [nav('angaben')], N + '?haus=alpenblick-grindelwald', []],
  ['bestand', V, [nav('hinweis')], N + '?ansicht=bestand', []],
  ['import', V, [nav('hinweis')], N + '?ansicht=bestand', [async p => { await p.click('[data-kl-import]'); await p.waitForTimeout(2200); }]],
  ['verlauf', V, [nav('verlauf')], N + '?ansicht=verlauf', []],
  ['fenster', V, [nav('b:start'), async p => { await p.evaluate(() => document.querySelector('.ws-foto').click()); await p.waitForTimeout(1800); }], N + '?ansicht=start', [async p => { await p.click('[data-aufgabe="neu"]'); await p.waitForTimeout(900); }]],
  ['offen', V, [nav('angaben'), async p => { await p.fill('[data-ws-angabe]', '+49 40 000 000'); await p.waitForTimeout(700); }], N + '?ansicht=liste', [standOffen]],
  ['quittung', V, [nav('angaben'), async p => { await p.fill('[data-ws-angabe]', '+49 40 000 000'); await p.click('#ws-speichern'); await p.waitForTimeout(1500); }], N + '?ansicht=liste', [standOffen, async p => { await p.click('#ws-speichern'); await p.waitForTimeout(1500); }]],
  ['anleitung', V.replace('index.html', 'anleitung.html'), [], N + 'anleitung.html', []],
  ['pruefung', VB + 'carte/uwerkzeuge/carte/pruefung.html', [warte(1500)], N + 'pruefung.html', [warte(1500)]],
  ['rundgang', V + '?rundgang', [warte(2500)], N + '?rundgang', [warte(2500)], { rundgang: true }],
  ['rand', V, [async p => { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(800); }], N + '?ansicht=start', [async p => { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(800); }], { handy: true }],
];
(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const bericht = [];
  const nur = process.argv[2];
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns, o = {}] of ANSICHTEN) {
    if (nur && nur !== name) continue;
    if (o.handy && breite > 900) continue;
    for (const [seite, url, schritte] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
      if (seite === 'neubau') await (await b.newContext()).request.post(A + 'probedaten', { data: { wer: 'Prüfung' } });
      const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      const p = await ctx.newPage();
      const konsole = [];
      p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') konsole.push(m.type() + ': ' + m.text() + ' ' + ((m.location() || {}).url || '')); });
      p.on('pageerror', e => konsole.push('pageerror: ' + e.message));
      await p.route(r => !/^https?:\/\/(vorlage\.test|127\.0\.0\.1|localhost)/.test(r), r => r.abort());
      if (!o.rundgang) await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kundenliste', '1'); localStorage.setItem('rundgang-culinarium-bureau', '1'); } catch (e) {} });
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(e => konsole.push('goto: ' + e.message.split('\n')[0]));
      await p.waitForTimeout(2600);
      for (const s of schritte) { try { await s(p); } catch (e) { konsole.push('Schritt: ' + e.message.split('\n')[0]); } }
      await p.waitForTimeout(900);
      const ueber = await p.evaluate(() => {
        const w = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth, raus = [];
        document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > w + 1 && getComputedStyle(e).position !== 'fixed') { let x = e.parentElement, scroll = false; while (x) { const ov = getComputedStyle(x).overflowX; if (ov === 'auto' || ov === 'scroll' || ov === 'hidden' || ov === 'clip') { scroll = true; break; } x = x.parentElement; } if (!scroll) raus.push(e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '') + ' ' + Math.round(r.right)); } });
        return { sw, w, raus: raus.slice(0, 6) };
      });
      await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 76, fullPage: !!o.voll });
      bericht.push({ name, breite, seite, konsole: seite === 'neubau' ? konsole : konsole.filter(k => !/404|besuch|verweil/.test(k)), ueber });
      await ctx.close();
    }
  }
  await (await b.newContext()).request.post(A + 'probedaten', { data: { wer: 'Prüfung' } });
  await b.close();
  
  bericht.filter(x => x.seite === 'neubau').forEach(x => console.log(x.name, x.breite, 'sw', x.ueber.sw, '/', x.ueber.w, x.ueber.raus.join(','), x.konsole.join(' | ')));
})();
