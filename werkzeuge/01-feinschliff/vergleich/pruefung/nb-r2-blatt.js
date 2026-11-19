// Nachbesserung 3 (Startblatt): auch «Zurücknehmen» (Rückfrage und Quittung), «Vorher & nachher» und «In die Quelle» zeigen bei langen Texten die geänderte Stelle.
// Voraussetzung: nb-r2.js ist gelaufen (Änderung «… Ganz am Ende390» liegt in der Liste; erster Unterschied zum Original: «das System» → «alles»). node vergleich/pruefung/nb-r2-blatt.js  (Port über ZENTRALE)
const { chromium } = require('playwright');
const B = __dirname + '/../bilder/';
const Z = process.env.ZENTRALE || '9100';
const pruefe = (name, ja, x = '') => { console.log((ja ? 'OK    ' : 'FEHLER') + ' ' + name + (x ? ' — ' + x : '')); if (!ja) process.exitCode = 1; };
(async () => {
  const doc = (await (await fetch(`http://localhost:${Z}/api/01-feinschliff/uebersicht`)).json()).doc;
  const a = doc.aenderungen.filter(x => x.art === 'text' && /Ganz am Ende390/.test(x.nachher)).pop();
  pruefe('lange Änderung liegt vor', !!a, a ? a.nachher.length + ' Zeichen' : '');
  const b = await chromium.launch();
  for (const breite of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    const log = []; p.on('console', m => { if (m.type() === 'error') log.push(m.text() + ' ' + (m.location().url || '')); }); p.on('pageerror', e => log.push(e.message));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r), r => r.abort());
    await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-feinschliff', '1'); } catch (e) {} });
    for (const [ans, sel] of [['aenderungen', '[data-ws-vgl-liste] .ws-zl__wert'], ['uebernehmen', '.ws-quelle__t']]) {
      await p.goto(`http://localhost:${Z}/werkzeuge/01-feinschliff/?wer=Robert#${ans}`, { waitUntil: 'load' }); await p.waitForTimeout(2500);
      if (ans === 'aenderungen') { const w = p.locator('[data-ws-wahl] button', { hasText: /^Startseite/ }); if (await w.count()) { await w.first().click(); await p.waitForTimeout(800); } }
      const t = await p.evaluate(s => [...document.querySelectorAll(s)].map(e => e.textContent).find(x => /das System/.test(x) && /alles dahinter/.test(x)) || '', sel);
      pruefe(`${breite} px: ${ans}: die geänderte Stelle steht da`, !!t, t.replace(/\s+/g, ' '));
      const el = p.locator(sel, { hasText: 'alles dahinter' }).first();
      if (await el.count()) { await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: B + `nb-blatt-${ans}-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 }); }
    }
    await p.goto(`http://localhost:${Z}/werkzeuge/01-feinschliff/?wer=Robert#b:index.html`, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.click(`.ws-st[data-ws-id="${a.id}"]`); await p.waitForTimeout(500);
    await p.locator('button', { hasText: /^Zurücknehmen$/ }).first().click(); await p.waitForTimeout(500);
    const f = await p.locator('[role=dialog] .ws-form p').first().innerText().catch(() => '');
    pruefe(`${breite} px: Rückfrage nennt die Stelle`, /alles dahinter/.test(f) && /das System/.test(f), f);
    await p.screenshot({ path: B + `nb-blatt-zuruecknehmen-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    await p.locator('button', { hasText: 'Ja, zurücknehmen' }).click(); await p.waitForTimeout(1200);
    const v = await p.locator('[data-ws-q=vorher]').last().innerText().catch(() => ''), n = await p.locator('[data-ws-q=nachher]').last().innerText().catch(() => '');
    pruefe(`${breite} px: Quittung vorher und nachher verschieden`, v && n && v !== n && /alles dahinter/.test(v) && /das System/.test(n), '«' + v + '» → «' + n + '»');
    await p.screenshot({ path: B + `nb-blatt-quittung-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    await p.locator('.ws-quit button', { hasText: 'Rückgängig' }).last().click(); await p.waitForTimeout(1200);
    const da = (await (await fetch(`http://localhost:${Z}/api/01-feinschliff/uebersicht`)).json()).doc.aenderungen.some(x => x.id === a.id);
    pruefe(`${breite} px: Rückgängig holt die Änderung zurück`, da);
    pruefe(`${breite} px: nichts läuft über den Rand`, await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    pruefe(`${breite} px: Konsole leer`, !log.filter(x => !/fonts\.g/.test(x)).length, log.join(' | '));
    await p.close();
  }
  await b.close();
})();
