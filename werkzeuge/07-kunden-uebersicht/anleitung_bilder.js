/* Bilder für die Anleitung (anleitung.html, wie anleitung_bilder.js der Vorlage Le Registre): ein Bildschirmfoto je Kapitel aus dem echten Werkzeug,
   Probedaten, 1440×900 → 1200×750 px, JPEG.
   node werkzeuge/07-kunden-uebersicht/anleitung_bilder.js [basis]   (python3 zentrale/server.py muss laufen, Port 9100) */
const path = require('path'), fs = require('fs');
const PW = require('playwright');
const A = process.argv[2] || 'http://localhost:9100/werkzeuge/07-kunden-uebersicht/';
const AUS = path.join(__dirname, 'anleitung');
const K = [
  ['k01', 'start', 0, null], ['k02', 'start', 760, null],
  ['k03', 'kunden', 420, null], ['k04', 'kunden', 420, async p => { await p.click('[data-filter="aus"]'); await p.waitForTimeout(600); }],
  ['k05', 'seiten', 470, null], ['k06', 'betreuung', 470, null],
  ['k07', 'kosten', 470, null], ['k08', 'vertraege', 470, null],
  ['k09', 'kunden', 0, async p => { await p.click('.detail [data-aendern="kosten"]'); await p.waitForTimeout(900); }],
  ['k10', 'so', 380, null]];
(async () => {
  const b = await PW.chromium.launch({ args: ['--lang=de-DE'] }); fs.mkdirSync(AUS, { recursive: true });
  /* Probedaten frisch, damit die Bilder immer dieselben erfundenen Kunden zeigen */
  { const c = await b.newContext(); const p = await c.newPage(); await p.goto(A); await p.evaluate(u => fetch(u, { method: 'POST' }), '/zentrale/api/07-kunden-uebersicht/probedaten'); await c.close(); }
  for (const [id, v, y, vor] of K) {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1200 / 1440, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
    await c.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kunden-uebersicht', '1'); } catch (e) {} });
    await c.route(u => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u.href), r => r.abort());
    const p = await c.newPage();
    await p.goto(A + '?gruss=tag&wer=Robert#' + v); await p.waitForFunction(() => window.KF_BEREIT === 1 && document.documentElement.classList.contains('auftakt-da')); await p.waitForTimeout(2600);
    if (y) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(2400); }
    if (vor) await vor(p);
    await p.screenshot({ path: path.join(AUS, id + '.jpg'), type: 'jpeg', quality: 82 });
    await c.close();
  }
  await b.close();
  console.log('Bilder:', fs.readdirSync(AUS).join(' '));
})();
