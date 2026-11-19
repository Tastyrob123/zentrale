// Prüfstand (Playwright, Node): node werkzeuge/09-ki-check/pruefstand.js <ordner für Bilder>. Server muss laufen, Probedaten geladen.
const { chromium } = require('playwright');
const B = 'http://localhost:9100/werkzeuge/09-ki-check/';
const OUT = process.argv[2] || '.';
(async () => {
  const browser = await chromium.launch();
  const fehler = [];
  async function seite(breite, hoehe) {
    const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(`[${breite}] konsole ${m.type()}: ${m.text()}`); });
    p.on('pageerror', e => fehler.push(`[${breite}] pageerror: ${e.message}`));
    p.on('requestfailed', r => fehler.push(`[${breite}] request failed: ${r.url()}`));
    p.on('response', r => { if (r.status() >= 400) fehler.push(`[${breite}] ${r.status()} ${r.url()}`); });
    return p;
  }
  async function ueberlauf(p, name) {
    const w = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    if (w[0] > w[1]) fehler.push(`${name}: waagrechter Überlauf ${w[0]} > ${w[1]}`);
    const breit = await p.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && getComputedStyle(e).position !== 'fixed').slice(0, 5).map(e => e.tagName + '.' + e.className));
    if (breit.length) fehler.push(`${name}: über den Rand: ${breit.join(', ')}`);
  }
  for (const [breite, hoehe] of [[1440, 900], [390, 844]]) {
    // öffentliche Seite
    let p = await seite(breite, hoehe);
    await p.goto(B + 'check.html', { waitUntil: 'networkidle' });
    await p.screenshot({ path: `${OUT}/check-${breite}-leer.png`, fullPage: true });
    await p.fill('input[name=adresse]', 'localhost:9100/werkzeuge/09-ki-check/probedaten/haeuser/zur-linde/');
    await p.fill('input[name=mail]', 'hartmann@linde-woerth.de');
    await p.click('#los');
    await p.waitForSelector('#fehler:not([hidden])');
    await p.check('input[name=einverstanden]');
    await p.click('#los');
    await p.waitForSelector('#ergebnis:not([hidden])');
    await p.waitForTimeout(900);
    await ueberlauf(p, `check ${breite}`);
    await p.screenshot({ path: `${OUT}/check-${breite}-ergebnis.png`, fullPage: true });
    // Fehlerfall
    await p.fill('input[name=adresse]', 'localhost:9100/gibt-es-nicht/');
    await p.click('#los');
    await p.waitForSelector('#fehler:not([hidden])');
    console.log(breite, 'Fehlertext:', await p.textContent('#fehler'));
    await p.context().close();
    // intern
    p = await seite(breite, hoehe);
    await p.goto(B + '?wer=Robert', { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/intern-${breite}-liste.png`, fullPage: true });
    await ueberlauf(p, `intern-liste ${breite}`);
    await p.click('tr.zeile');
    await p.waitForSelector('#m-text:not(:empty)');
    await ueberlauf(p, `intern-detail ${breite}`);
    await p.screenshot({ path: `${OUT}/intern-${breite}-detail.png`, fullPage: true });
    await p.click('#d-kundenliste');
    await p.waitForSelector('.quittung.da');
    await p.screenshot({ path: `${OUT}/intern-${breite}-quittung.png` });
    console.log(breite, 'Quittung:', await p.textContent('#q-text'));
    await p.click('#q-zurueck');
    await p.waitForTimeout(400);
    console.log(breite, 'Rückgängig:', await p.textContent('#q-text'));
    await p.context().close();
  }
  // Rahmen wie in der Zentrale
  const p = await seite(1440, 900);
  await p.setContent(`<body style="margin:0;background:#111421"><iframe src="${B}?wer=Robert" style="position:fixed;left:260px;top:0;width:calc(100% - 260px);height:100%;border:0"></iframe></body>`);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/intern-rahmen.png` });
  await browser.close();
  console.log(fehler.length ? 'FEHLER:\n' + fehler.join('\n') : 'Keine Fehler in Konsole, keine Überläufe.');
})();
