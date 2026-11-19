/* Bilder der Anleitung neu aufnehmen (Playwright, Server läuft auf 9100): node werkzeuge/12-marke-vision/anleitung-bilder.js
   Legt anleitung/k01.jpg bis k06.jpg an (1200 auf 714). Arbeitet mit einer Probe-Frage und nimmt sie danach wieder heraus. */
const { chromium } = require('playwright');
const path = require('path');
const U = 'http://localhost:9100/werkzeuge/12-marke-vision/';
const ZIEL = path.join(__dirname, 'anleitung');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 857 }, deviceScaleFactor: 1 });
  const bild = async n => { await p.waitForTimeout(1900); await p.screenshot({ path: path.join(ZIEL, n + '.jpg'), type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1440, height: 857 } }); };
  await p.goto(U + '?wer=Anna#start'); await bild('k01-gross');
  await p.goto(U + '?wer=Anna#glaube'); await p.waitForTimeout(1200); await p.evaluate(() => scrollTo(0, 1900)); await bild('k02-gross');
  await p.goto(U + '?wer=Anna#erkennen'); await p.waitForTimeout(1500); await p.click('#leiste [data-neu]'); await p.fill('#fenster [data-text]', 'Gilt das auch für Mails an die Häuser?'); await bild('k03-gross');
  await p.click('#fenster [data-sp]'); await p.waitForTimeout(1600); await bild('k04-gross');
  await p.goto(U + '?wer=Robert#fragen'); await bild('k05-gross');
  const ids = await p.evaluate(() => fetch('/zentrale/api/12-marke-vision/fragen').then(r => r.json()).then(j => j.fragen.filter(f => /Mails an die Häuser/.test(f.text)).map(f => f.id)));
  for (const id of ids) await p.evaluate(id => fetch('/zentrale/api/12-marke-vision/fragen/' + id, { method: 'DELETE' }), id);
  await p.goto(U + 'pruefung.html'); await bild('k06-gross');
  await b.close();
  /* auf 1200 auf 714 verkleinern */
  const { execFileSync } = require('child_process');
  execFileSync('python3', ['-c', `
import glob
from PIL import Image
for f in glob.glob('${ZIEL}/k0*-gross.jpg'):
    Image.open(f).convert('RGB').resize((1200, 714), Image.LANCZOS).save(f.replace('-gross', ''), quality=82)
`]);
  execFileSync('sh', ['-c', `rm -f '${ZIEL}'/k0*-gross.jpg`]);
})();
