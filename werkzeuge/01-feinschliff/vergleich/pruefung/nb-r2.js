// Nachbesserung 3 und 4: Quittung bei langen Texten zeigt die geänderte Stelle; Suche findet alten Wortlaut, sonst «Nichts gefunden.»
// node vergleich/pruefung/nb-r2.js   Ports über ZENTRALE, SEITE, DIENST (Vorgabe 9100, 8980, 8981); Bilder in vergleich/bilder/nb-*.jpg
const { chromium } = require('playwright');
const B = __dirname + '/../bilder/';
const Z = process.env.ZENTRALE || '9100', S = process.env.SEITE || '8980', D = process.env.DIENST || '8981';
const pruefe = (name, ja, x = '') => { console.log((ja ? 'OK    ' : 'FEHLER') + ' ' + name + (x ? ' — ' + x : '')); if (!ja) process.exitCode = 1; };
async function seite(b, breite) {
  const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
  p.log = [];
  p.on('console', m => { if (m.type() === 'error') p.log.push(m.text() + ' ' + (m.location().url || '')); });
  p.on('pageerror', e => p.log.push('pageerror ' + e.message));
  await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r), r => r.abort());
  // die Seite fragt fest bei 8980/8981; in der Probe auf die freien Ports umleiten
  await p.route(/localhost:(8980|8981)\//, r => r.continue({ url: r.request().url().replace(':8980/', ':' + S + '/').replace(':8981/', ':' + D + '/') }));
  await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-feinschliff', '1'); } catch (e) {} });
  return p;
}
const ueber = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
(async () => {
  await fetch(`http://localhost:${Z}/api/01-feinschliff/probedaten`, { method: 'POST', body: JSON.stringify({ bestaetigt: true }) });
  const b = await chromium.launch();
  // 3. Quittung auf der Agentur-Seite
  for (const breite of [1440, 390]) {
    const p = await seite(b, breite);
    await p.goto(`http://localhost:${S}/?feinschliff=probe-anna-feinschliff`, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    await p.click('.fs-leiste [data-modus=text]'); await p.waitForTimeout(400);
    const ziel = await p.evaluateHandle(() => [...document.querySelectorAll('main p')].find(e => e.innerText.trim().length > 110 && !e.querySelector('a') && e.getBoundingClientRect().width > 0));
    const alt = (await ziel.evaluate(e => e.innerText)).replace(/\s+/g, ' ').trim();
    await ziel.evaluate(e => e.scrollIntoView({ block: 'center' }));
    await ziel.click({ force: true }); await p.waitForTimeout(300);
    await p.keyboard.press('End'); await p.keyboard.type(' Ganz am Ende' + breite);
    await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
    const s = await p.locator('.fs-toast s').first().innerText().catch(() => ''), n = await p.locator('.fs-toast s + span').first().innerText().catch(() => '');
    pruefe(breite + ' px: Quittung, vorher und nachher verschieden', s && n && s !== n, '«' + s + '» → «' + n + '»');
    pruefe(breite + ' px: Quittung zeigt die neue Stelle', n.includes('Ganz am Ende' + breite));
    pruefe(breite + ' px: langer Text (' + alt.length + ' Zeichen)', alt.length > 60);
    pruefe(breite + ' px: nichts läuft über den Rand', (await ueber(p)) <= 0);
    await p.screenshot({ path: B + `nb-seite-quittung-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    // auch in der Liste «Änderungen» steht die Stelle
    await p.click('.fs-leiste [data-modus=liste]'); await p.waitForTimeout(700);
    const letzte = (await (await fetch(`http://localhost:${D}/api/feinschliff?k=probe-robert-feinschliff`)).json()).doc.aenderungen.filter(a => a.art === 'text').pop();
    const zeile = await p.evaluate(id => { const e = document.querySelector(`.fs-eintrag[data-id="${id}"] .fs-vn`); if (!e) return ''; const s = e.querySelector('s').textContent, n = e.querySelector('s + span').textContent; return s !== n ? s + ' → ' + n : ''; }, letzte.id);
    await p.screenshot({ path: B + `nb-seite-liste-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    pruefe(breite + ' px: Liste: vorher und nachher verschieden (Stelle des ersten Unterschieds zum Original)', !!zeile, zeile);
    const f1 = p.log.filter(x => !/status of 404|fonts\.g/.test(x)); pruefe(breite + ' px: Konsole leer (ausser 404 der Bilder, die im Repo fehlen, und gesperrten Google Fonts)', !f1.length, f1.join(' | '));
    await p.close();
  }
  // 4. Suche im Startblatt
  for (const breite of [1440, 390]) {
    const p = await seite(b, breite);
    await p.goto(`http://localhost:${Z}/werkzeuge/01-feinschliff/?wer=Robert#b:index.html`, { waitUntil: 'load' }); await p.waitForTimeout(3500);
    const sicht = () => p.locator('#ws-gruppen .ws-st:visible').count();
    const z0 = await sicht();
    await p.fill('#ws-such', 'Hospitality'); await p.waitForTimeout(500);
    const z1 = await sicht();
    const txt = z1 ? await p.locator('#ws-gruppen .ws-st:visible').first().innerText() : '';
    pruefe(breite + ' px: «Hospitality» (alter Wortlaut) findet die Änderung', z1 > 0 && z1 < z0, z0 + ' → ' + z1 + ' · ' + txt.replace(/\s+/g, ' ').slice(0, 80));
    pruefe(breite + ' px: kein «Nichts gefunden.» bei Treffern', await p.locator('#ws-gruppen .ws-leer').count() === 0);
    await p.locator('#ws-such').evaluate((e, b) => e.scrollIntoView({ block: b > 500 ? 'nearest' : 'start' }), breite);
    await p.screenshot({ path: B + `nb-suche-treffer-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    await p.fill('#ws-such', 'Gastfreundschaft'); await p.waitForTimeout(500);
    pruefe(breite + ' px: neuer Wortlaut weiter gefunden', (await sicht()) > 0);
    await p.fill('#ws-such', 'xqzwort'); await p.waitForTimeout(500);
    pruefe(breite + ' px: ohne Treffer «Nichts gefunden.»', (await sicht()) === 0 && (await p.locator('#ws-gruppen .ws-leer').innerText().catch(() => '')) === 'Nichts gefunden.');
    await p.locator('#ws-such').evaluate((e, b) => e.scrollIntoView({ block: b > 500 ? 'nearest' : 'start' }), breite); await p.waitForTimeout(300);
    await p.screenshot({ path: B + `nb-suche-leer-${breite}-neubau.jpg`, type: 'jpeg', quality: 80 });
    await p.fill('#ws-such', ''); await p.waitForTimeout(400);
    pruefe(breite + ' px: leeres Feld zeigt wieder alles', (await sicht()) === z0 && (await p.locator('#ws-gruppen .ws-leer').count()) === 0);
    pruefe(breite + ' px: nichts läuft über den Rand', (await ueber(p)) <= 0);
    const f2 = p.log.filter(x => !/fonts\.g/.test(x)); pruefe(breite + ' px: Konsole leer (ausser gesperrten Google Fonts)', !f2.length, f2.join(' | '));
    await p.close();
  }
  await b.close();
})();
