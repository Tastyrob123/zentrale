/* Bilder für die Anleitung (anleitung.html): ein Bildschirmfoto je Kapitel aus dem echten Werkzeug mit Probedaten, 1512 × 900 → 1200 px breit (JPEG).
   Wie anleitung_bilder.js des Le Registre. Server muss laufen (python3 zentrale/server.py), die Marken in daten/03-entwurf-besuche/ vorher löschen,
   damit es Neues gibt.   node werkzeuge/03-entwurf-besuche/anleitung_bilder.js [basis]   (braucht Playwright und python3 mit PIL) */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const A = process.argv[2] || 'http://localhost:9100/werkzeuge/03-entwurf-besuche/';
const AUS = path.join(__dirname, 'anleitung');
const K = [
  ['k01', 'start', 0, null], ['k02', 'start', 560, null], ['k03', 'haeuser', 380, null], ['k04', 'haus=kranich', 0, null],
  ['k05', 'besuche', 520, null], ['k06', 'start', 0, async p => { await p.click('#l-gesehen'); await p.waitForTimeout(1600); }],
  ['k07', 'schluessel', 0, async p => { await p.click('#ansicht [data-schluessel]'); await p.waitForTimeout(900); }], ['k08', 'zaehlung', 380, null]];
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(AUS, { recursive: true });
  for (const [id, v, y, vor] of K) {
    const c = await b.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1 }); const p = await c.newPage();
    await p.goto(A + '?gruss=tag#' + v); await p.waitForFunction(() => window.TASTY_BESUCHE === 1 && document.documentElement.classList.contains('auftakt-da')); await p.waitForTimeout(3800);
    if (y) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(3600); }
    if (vor) await vor(p);
    await p.screenshot({ path: path.join(AUS, id + '.png') });
    if (id === 'k06') { await p.click('#meldung [data-rueck]'); await p.waitForTimeout(800); }   /* «gesehen» zurücknehmen, damit die nächsten Bilder Neues zeigen */
    await c.close();
  }
  await b.close();
  for (const [id] of K) {
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;i=Image.open(sys.argv[1]).convert("RGB");i.resize((1200,round(i.height*1200/i.width)),Image.LANCZOS).save(sys.argv[2],quality=82)', path.join(AUS, id + '.png'), path.join(AUS, id + '.jpg')]);
    fs.unlinkSync(path.join(AUS, id + '.png'));
  }
  console.log('Bilder:', fs.readdirSync(AUS).join(' '));
})();
