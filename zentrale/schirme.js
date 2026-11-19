// schirme.js · Bilder für die Laptops in den Sälen der Zentrale: je Werkzeug EINE Ansicht (Robert 08.11.2026: nie zwei Fenster übereinander),
// aufgenommen bei 1440 × 932 (Bildschirm des Laptops aus laptop.json), 1,5-fach, abgelegt als zentrale/img/geraet-<ordner>.webp.
// Ändert nichts in den Werkzeugen (nur ansehen und eine Ansicht wählen). Am besten in einer Kopie mit Probedaten aufnehmen.
//   python3 zentrale/server.py   und dann   node zentrale/schirme.js [ordner …]      (braucht playwright und cwebp)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const ZIEL = path.join(__dirname, 'img');
const BASIS = process.env.ZENTRALE || 'http://localhost:9100';
const A = {   // welche Ansicht je Werkzeug: Klick auf einen Text, oder eine eigene Adresse und eine Scrollhöhe
  '01-feinschliff': { url: 'http://localhost:8980/?feinschliff=probe-anna-feinschliff', klick: ['Wörter'], y: 5200 },
  '04-haus-check': { klick: ['Seehotel Lindenhof'] },
  '08-beitraege': {},
  '10-newsletter': { klick: ['Ausgaben'] }
};
const NUR = process.argv.slice(2);
(async () => {
  const liste = await (await fetch(BASIS + '/zentrale/api/werkzeuge')).json();
  const b = await chromium.launch();
  for (const { ordner } of liste) {
    if (NUR.length && !NUR.includes(ordner)) continue;
    const a = A[ordner] || {};
    const k = await b.newContext({ viewport: { width: 1440, height: 932 }, deviceScaleFactor: 1.5 });
    await k.addInitScript(() => { try { localStorage.setItem('tasty-wer', 'Robert'); } catch (e) {} });
    const p = await k.newPage();
    await p.goto(a.url || BASIS + '/zentrale/werkzeuge/' + ordner + '/?wer=Robert&rundgang=0', { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(1800); await p.keyboard.press('Escape');
    for (const t of a.klick || []) { try { await p.getByText(t, { exact: true }).first().click({ timeout: 4000 }); await p.waitForTimeout(1800); } catch (e) { console.log(ordner + ': «' + t + '» nicht erreicht'); } }
    await p.evaluate(y => scrollTo(0, y), a.y || 0); await p.waitForTimeout(1200);
    const png = path.join(os.tmpdir(), 'geraet-' + ordner + '.png');
    await p.screenshot({ path: png });
    execFileSync('cwebp', ['-quiet', '-q', '80', png, '-o', path.join(ZIEL, 'geraet-' + ordner + '.webp')]); fs.unlinkSync(png);
    console.log(ordner + ' aufgenommen'); await k.close();
  }
  await b.close();
})();
