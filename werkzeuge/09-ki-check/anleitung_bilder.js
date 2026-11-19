/* Bilder für die Anleitung (anleitung.html): ein Bildschirmfoto je Kapitel aus dem echten Werkzeug mit Probedaten, 1512 × 900 → 1200 × 714 (JPEG).
   Aus Le Registre (anleitung_bilder.js). Server muss laufen (python3 zentrale/server.py), Probedaten geladen.
   node werkzeuge/09-ki-check/anleitung_bilder.js [basis]   (verkleinert mit Python/Pillow) */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const A = process.argv[2] || 'http://localhost:9100/werkzeuge/09-ki-check/';
const AUS = path.join(__dirname, 'anleitung');
const K = [
  ['k01', 'start', 0, null], ['k02', 'start', 560, null], ['k03', 'checks', 520, null],
  ['k04', 'checks', 360, async p => { await p.click('[data-filter="anlass"]'); await p.waitForTimeout(600); }],
  ['k05', 'checks', 0, async p => { await p.click('[data-mail]'); await p.waitForTimeout(1200); }],
  ['k06', 'herkunft', 420, null], ['k07', 'zeit', 470, null],
  ['k08', 'bereiche', 420, null], ['k09', 'verlauf', 470, null], ['k10', 'gespraech', 470, null], ['k11', 'geprueft', 380, null],
  ['k12', '../pruefung.html', 0, null]];
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(AUS, { recursive: true });
  for (const [id, v, y, vor] of K) {
    const c = await b.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await c.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-ki-check', '1'); } catch (e) {} });
    const p = await c.newPage();
    await p.goto(v.startsWith('../') ? A + v.slice(3) : A + '?gruss=tag#' + v); await p.waitForTimeout(2600);
    if (y) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(900); }
    if (vor) await vor(p);
    const png = path.join(AUS, id + '.png');
    await p.screenshot({ path: png });
    await c.close();
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").resize((1200,714),Image.LANCZOS).save(sys.argv[2],quality=82)', png, png.replace('.png', '.jpg')]);
    fs.unlinkSync(png);
  }
  await b.close();
  console.log('Bilder:', fs.readdirSync(AUS).join(' '));
})();
