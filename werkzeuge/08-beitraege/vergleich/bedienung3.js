/* Nachbesserung nach der dritten Prüfung (07.11.2026): jede Funktion noch einmal selbst bedient, bei 1440 und 390 px.
   Start: python3 zentrale/server.py, rm -rf daten/08-beitraege, dann node werkzeuge/08-beitraege/vergleich/bedienung3.js
   Was gespeichert wird, wird mit «Rückgängig» zurückgenommen. Liest die Ablage über /api/08-beitraege/entwuerfe mit. */
const { chromium } = require('playwright');
const N = 'http://localhost:9100/werkzeuge/08-beitraege/', ID = 'e-20261105-fernsicht-frage';
const out = [];
const soll = (ja, was) => out.push((ja ? 'ok    ' : 'FEHLT ') + was);
const ablage = async p => p.evaluate(async () => (await (await fetch('/zentrale/api/08-beitraege/entwuerfe')).json()));
const finde = (a, id) => (Array.isArray(a) ? a : (a.entwuerfe || a.archiv || a.liste || [])).find(x => x.id === id);
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
    const p = await ctx.newPage();
    const fehler = [];
    p.on('console', m => m.type() === 'error' && fehler.push(m.text())); p.on('pageerror', e => fehler.push(String(e)));
    p.on('dialog', d => d.accept());
    const knopf = t => p.locator('button, a', { hasText: t });
    // Übersicht: sieben Kacheln, jede führt woanders hin
    await p.goto(N + '?ansicht=start', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    const kacheln = await p.locator('#ws-mitte .wo-ag').count();
    soll(kacheln === 7, w + ' sieben Kacheln «Häufig gebraucht» (' + kacheln + ')');
    for (let i = 0; i < kacheln; i++) {
      await p.goto(N + '?ansicht=start', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
      const vor = await p.evaluate(() => location.search + document.title);
      await p.locator('#ws-mitte .wo-ag').nth(i).click(); await p.waitForTimeout(1100);
      const nach = await p.evaluate(() => location.search + ' | ' + document.title);
      soll(nach !== vor, w + ' Kachel ' + (i + 1) + ' führt nach ' + nach);
      const fenster = p.locator('.wo-fenster, dialog[open]');
      if (await fenster.count()) { const ab = knopf('Abbrechen'); if (await ab.count()) await ab.first().click(); }
    }
    // Stand ändern: Entwurf → Fertig, speichern, Rückgängig
    await p.goto(N + '?ansicht=angaben&entwurf=' + ID, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.locator('[data-bt-form="stand"] button', { hasText: 'Fertig' }).first().click(); await p.waitForTimeout(500);
    let a = await ablage(p);
    soll(finde(a, ID)?.stand === 'entwurf', w + ' Stand gewählt, Ablage noch «entwurf» vor dem Speichern');
    await p.click('#ws-speichern'); await p.waitForTimeout(1300);
    a = await ablage(p);
    soll(finde(a, ID)?.stand === 'fertig', w + ' nach Speichern «fertig» in der Ablage');
    soll(await knopf('Rückgängig').count() > 0, w + ' Quittung mit «Rückgängig»');
    await knopf('Rückgängig').first().click(); await p.waitForTimeout(1300);
    a = await ablage(p);
    soll(finde(a, ID)?.stand === 'entwurf', w + ' Rückgängig: wieder «entwurf»');
    // Text kopieren
    await p.goto(N + '?ansicht=angaben&entwurf=' + ID, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.locator('[data-bt-form="stand"] button', { hasText: 'Text kopieren' }).first().click(); await p.waitForTimeout(700);
    const zw = await p.evaluate(() => navigator.clipboard.readText());
    soll(zw.length > 300, w + ' Text kopieren legt ' + zw.length + ' Zeichen in die Zwischenablage');
    await p.locator('#ws-quittung button[aria-label="Schliessen"]').first().click(); await p.waitForTimeout(500);
    // Löschen nur mit Rückfrage, dann Rückgängig
    await p.locator('[data-bt-form="stand"] button, [data-bt-form="stand"] a', { hasText: 'Beitrag löschen' }).first().click(); await p.waitForTimeout(700);
    a = await ablage(p);
    soll(!!finde(a, ID), w + ' Rückfrage offen, Beitrag noch in der Ablage');
    await knopf('Ja, löschen').first().click(); await p.waitForTimeout(1400);
    a = await ablage(p);
    soll(!finde(a, ID), w + ' nach «Ja, löschen» aus der Ablage');
    await knopf('Rückgängig').first().click(); await p.waitForTimeout(1400);
    a = await ablage(p);
    soll(!!finde(a, ID), w + ' Rückgängig: Beitrag wieder da');
    // Grafik quadratisch als PNG
    await p.goto(N + '?ansicht=bild&entwurf=' + ID, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    await p.locator('[data-bt-grafik] [role="radio"], [data-bt-grafik] button', { hasText: 'Quadrat' }).first().click(); await p.waitForTimeout(1200);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-bt-grafik-speichern]')]);
    const pfad = await dl.path();
    const kopf = require('fs').readFileSync(pfad);
    soll(kopf.slice(1, 4).toString() === 'PNG' && kopf.readUInt32BE(16) === 1080 && kopf.readUInt32BE(20) === 1080, w + ' Grafik quadratisch als PNG ' + kopf.readUInt32BE(16) + ' × ' + kopf.readUInt32BE(20));
    // Verwerfen beim Wechsel ändert die Ablage nicht
    await p.goto(N + '?ansicht=bild&entwurf=' + ID, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    const ver = await p.evaluate(() => document.querySelector('.wo-fenster, dialog[open]') ? 1 : 0);
    if (ver) { const vw = knopf('Verwerfen'); if (await vw.count()) await vw.first().click(); await p.waitForTimeout(800); }
    a = await ablage(p);
    soll((finde(a, ID)?.grafik || 'quer') === 'quer', w + ' Grafik-Format ungespeichert, Ablage unverändert');
    // Anleitung, Prüfseite, Zentrale
    await p.goto(N + 'anleitung.html', { waitUntil: 'networkidle' });
    soll(await p.locator('.an-schritt').count() === 7, w + ' Anleitung mit sieben Schritten');
    await p.goto(N + 'pruefung.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    soll(await p.locator('body').innerText().then(t => t.includes('Ist alles in Ordnung') || t.toUpperCase().includes('IST ALLES IN ORDNUNG')), w + ' Prüfseite läuft');
    await p.goto('http://localhost:9100/#08-beitraege', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
    const rahmen = p.frames().find(f => f.url().includes('/zentrale/werkzeuge/08-beitraege/'));
    soll(!!rahmen, w + ' in der Zentrale im Rahmen geladen');
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    soll(ueber <= 0, w + ' Zentrale ohne Überlauf');
    soll(fehler.length === 0, w + ' Konsole leer ' + JSON.stringify(fehler));
    await ctx.close();
  }
  await b.close();
  console.log(out.join('\n'));
})();
