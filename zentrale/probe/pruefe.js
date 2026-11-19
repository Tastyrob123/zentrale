// Prüfstand der Zentrale: node zentrale/probe/pruefe.js [Bilderordner]. Vorher python3 zentrale/probe/start.py starten.
// Prüft Konsole, Überlauf und Bedienung bei 1440 und 390 px und legt Bilder im Bilderordner ab (Standard: Temp-Ordner).
const { chromium } = require('playwright');
const fs = require('fs');
const AUS = process.argv[2] || require('os').tmpdir() + '/zentrale-bilder';
fs.mkdirSync(AUS, { recursive: true });
const URL = 'http://localhost:9100/';

(async () => {
  const browser = await chromium.launch();
  const fehler = [];
  for (const [name, breite, hoehe] of [['rechner', 1440, 900], ['handy', 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1, locale: 'de-DE' });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(name + ' konsole: ' + m.text()); });
    page.on('pageerror', e => fehler.push(name + ' fehler: ' + e.message));
    page.on('requestfailed', r => fehler.push(name + ' anfrage: ' + r.url()));
    page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/heute')) fehler.push(name + ' ' + r.status() + ': ' + r.url()); });

    const ueberlauf = async (wo) => {
      const o = await page.evaluate(() => {
        const d = document.documentElement;
        const breit = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).map(e => e.tagName + '.' + e.className).slice(0, 5);
        return { sw: d.scrollWidth, iw: innerWidth, breit };
      });
      if (o.sw > o.iw || o.breit.length) fehler.push(name + ' überlauf bei ' + wo + ': ' + JSON.stringify(o));
    };

    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.documentElement.classList.contains('wartet'));
    await page.screenshot({ path: `${AUS}/${name}-1-start.png` });
    await ueberlauf('start');
    const punkte = await page.locator('.punkt').count();
    const zeilen = await page.locator('.werkzeug-zeile').count();
    console.log(name, 'heute-punkte:', punkte, 'werkzeuge:', zeilen, 'gruss:', await page.locator('.gruss').textContent());

    // Punkt aus «Heute» anklicken: öffnet das Werkzeug an der Stelle
    await page.locator('.punkt').first().click();
    await page.waitForFunction(() => { const f = document.getElementById('rahmen'); return !f.hidden && f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentDocument.querySelector('.zeile, .haus'); });
    await page.waitForTimeout(300);
    console.log(name, 'rahmen:', await page.locator('#rahmen').getAttribute('src'), 'titel:', await page.locator('#titel').textContent());
    await page.screenshot({ path: `${AUS}/${name}-2-werkzeug.png` });
    await ueberlauf('werkzeug');

    // Schnellsuche: ⌘K, tippen, Enter
    await page.keyboard.press('Control+k');
    await page.waitForSelector('#suche:not([hidden])');
    await page.keyboard.type('kund');
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${AUS}/${name}-3-suche.png` });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('titel').textContent === 'Kundenliste');
    console.log(name, 'suche öffnet:', await page.locator('#titel').textContent(), await page.locator('#rahmen').getAttribute('src'));

    // Tastenkürzel aus dem Rahmen heraus
    await page.waitForTimeout(400);
    await page.frameLocator('#rahmen').locator('body').click();
    await page.keyboard.press('Control+k');
    await page.waitForSelector('#suche:not([hidden])');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#suche[hidden]', { state: 'attached' });
    console.log(name, 'kürzel aus dem rahmen: ok');

    // Wer umschalten: Quittung und Rahmen neu mit ?wer=Anna
    await page.locator('[data-wer="Anna"]').click();
    await page.waitForFunction(() => (document.getElementById('rahmen').src || '').includes('wer=Anna'));
    await page.waitForTimeout(350);
    console.log(name, 'quittung:', (await page.locator('#quittungText').textContent()).trim());
    await page.screenshot({ path: `${AUS}/${name}-4-wer.png` });
    await page.locator('#quittungZurueck').click();
    await page.waitForFunction(() => (document.getElementById('rahmen').src || '').includes('wer=Robert'));
    console.log(name, 'rückgängig: wer=Robert');
    await page.locator('[data-wer="Anna"]').click();

    // Neu laden: zuletzt offenes Werkzeug und Person bleiben
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.documentElement.classList.contains('wartet'));
    console.log(name, 'nach neuladen:', await page.locator('#titel').textContent(), await page.locator('.wer .an').textContent(), location = await page.evaluate(() => location.hash));

    // Zurück zum Start über die Leiste
    await page.locator('.eintrag', { hasText: 'Start' }).click();
    await page.waitForSelector('#start:not([hidden])');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${AUS}/${name}-5-start-anna.png` });
    await ueberlauf('start anna');
    await ctx.close();
  }
  await browser.close();
  console.log(fehler.length ? 'FEHLER:\n' + fehler.join('\n') : 'keine Fehler, kein Überlauf');
})();
