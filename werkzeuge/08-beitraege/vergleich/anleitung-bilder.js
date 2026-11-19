/* Nachbesserung nach der dritten Prüfung (07.11.2026): die Bildschirme der Anleitung (anleitung/*.webp) neu vom heutigen Stand des Werkzeugs.
   Aus dem Stamm des Repos:
     python3 zentrale/server.py
     rm -rf daten/08-beitraege   (Probedaten frisch)
     node werkzeuge/08-beitraege/vergleich/anleitung-bilder.js
   Fenster 1440 × 900 wie bisher. Die Quittung kommt zuletzt, damit «geändert am» in den anderen Bildern der Probestand ist. Was zum Bild gespeichert wird (Quittung), wird danach mit «Rückgängig» zurückgenommen.
   Prüft je Bild: Konsole leer, nichts über den Rand. Die Bilder gehen als PNG in den Notizordner und werden mit Pillow zu WebP. */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const N = 'http://localhost:9100/werkzeuge/08-beitraege/';
const ID = 'e-20261105-fernsicht-frage';
const ZIEL = path.join(__dirname, '..', 'anleitung');
const TMP = process.env.TMPDIR_BILDER || fs.mkdtempSync('/tmp/anleitung-');
const zu = (sel, ab) => async p => { await p.evaluate(([s, a]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - a); }, [sel, ab]); await p.waitForTimeout(1500); };
const BILDER = [
  ['uebersicht', N + '?ansicht=start', zu('#ws-mitte .wo-ag', 420)],
  ['angaben', N + '?ansicht=angaben&entwurf=' + ID, zu('#ws-mitte .ws-karte__kopf', 130)],
  ['text', N + '?ansicht=text&entwurf=' + ID, async p => { await p.click('#ws-gruppen [data-g="text"] .ws-st >> nth=0'); await p.waitForTimeout(900); }],
  ['bild', N + '?ansicht=bild&entwurf=' + ID, zu('#ws-mitte .ws-karte__kopf', 130)],
  ['archiv', N + '?ansicht=l:alle', null],
  ['quittung', N + '?ansicht=text&entwurf=' + ID, async p => {
    await p.click('#ws-gruppen [data-g="text"] .ws-st >> nth=1'); await p.waitForTimeout(900);
    await p.click('.ws-ed textarea'); await p.keyboard.press('ControlOrMeta+A'); await p.keyboard.type('Vorher brauchte ein Gast sechs Klicks bis zum Tisch. Jetzt sind es zwei.'); await p.waitForTimeout(700);
    await p.click('#ws-speichern'); await p.waitForTimeout(1600);
  }, async p => { await p.locator('button', { hasText: 'Rückgängig' }).first().click(); await p.waitForTimeout(1500); }],
];
(async () => {
  const b = await chromium.launch();
  const bericht = [];
  for (const [name, url, tun, danach] of BILDER) {
    const s = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await s.newPage();
    const fehler = [];
    p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
    p.on('pageerror', e => fehler.push(String(e)));
    await p.route(u => !/^http:\/\/localhost:9100\//.test(u.toString()) && !u.toString().startsWith('data:') && !u.toString().startsWith('blob:'), r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    if (tun) await tun(p);
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const png = path.join(TMP, name + '.png');
    await p.screenshot({ path: png });
    if (danach) await danach(p);
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=82,method=6)', png, path.join(ZIEL, name + '.webp')]);
    bericht.push({ name, fehler, ueber });
    await s.close();
  }
  await b.close();
  console.log(JSON.stringify(bericht, null, 1));
  console.log('PNG in', TMP);
})();
