// Nachprüfung Runde 3: die drei Abweichungen aus PRUEFUNG.md (Runde 2) selbst bedienen, Bilder nach bilder/n3-*.jpg.
// Vorher daten/10-newsletter/ löschen und die Zentrale starten (PORT=9612 python3 zentrale/server.py). Aufruf: node werkzeuge/10-newsletter/vergleich/nach3.js
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = __dirname + '/bilder/';
const N = 'http://localhost:' + (process.env.PORT || 9612) + '/zentrale/werkzeuge/10-newsletter/';
const ABLAGE = __dirname + '/../../../daten/10-newsletter/';
const fehler = [];
const ok = (bed, satz) => { console.log((bed ? 'OK   ' : 'FEHLT') + ' ' + satz); if (!bed) process.exitCode = 1; };

async function seite(browser, breite) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) fehler.push(breite + ' ' + m.text()); });
  p.on('pageerror', e => fehler.push(breite + ' ' + e.message));
  return p;
}
const ueberlauf = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

async function haken(browser, breite) {
  const p = await seite(browser, breite);
  await p.goto(N + '#empfaenger'); await p.waitForSelector('[data-eneu]');
  await p.click('[data-eneu]'); await p.waitForSelector('.nl-haken input');
  const k = await p.$$eval('.nl-haken input', l => l.map(i => { const r = i.getBoundingClientRect(), z = i.closest('label').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), an: i.checked, zeilenhoehe: Math.round(z.height), app: getComputedStyle(i).appearance }; }));
  console.log(breite, JSON.stringify(k));
  ok(k.every(x => x.w <= 20 && x.h <= 20 && x.app !== 'none'), `${breite}: Haken sind echte Kästchen (höchstens 20 px)`);
  ok(k.every(x => x.zeilenhoehe <= 24), `${breite}: Listennamen stehen in einer Zeile`);
  await p.locator('.nl-haken label').nth(1).click();
  const an = await p.$$eval('.nl-haken input', l => l.map(i => i.checked));
  ok(an[0] && an[1] && !an[2], `${breite}: «Post aus dem Studio» und «Hotellerie Schweiz» gesetzt, die anderen nicht`);
  await (await p.$('.fenster__k')).screenshot({ path: ZIEL + `n3-haken-${breite}.jpg`, quality: 82 });
  ok(!(await ueberlauf(p)), `${breite}: kein Überlauf`);
  await p.context().close();
}

async function ausgabe(browser) {
  const p = await seite(browser, 1440);
  await p.goto(N + '#ausgaben'); await p.waitForSelector('.re-eingang');
  await p.click('#ansicht [data-neu]'); await p.waitForSelector('[data-akt="bausteine"]', { timeout: 5000 }).catch(() => {});
  if (await p.$('[data-akt="bausteine"]')) await p.click('[data-akt="bausteine"]');
  await p.waitForSelector('.nl-bausteine');
  await p.fill('#u-betreff', 'Prüfung leere Bausteine');
  await p.fill('#u-titel', 'Prüfung leere Bausteine');
  // erster Titel bleibt leer; Text füllen; ein leeres Zitat dazu
  await p.fill('.nl-b[data-i="1"] textarea', 'Ein Absatz mit Inhalt.');
  await p.click('.nl-neu [data-art="zitat"]');
  const hinweis = await p.textContent('#detail');
  ok(/2 Bausteine sind noch leer und fehlen in der Mail/.test(hinweis), 'Hinweis nennt 2 leere Bausteine');
  await p.click('#detail [data-akt="speichern"]'); await p.waitForTimeout(600);
  await p.click('#detail [data-akt="probe"]');
  ok(await p.waitForFunction(() => /Probemail liegt/.test(document.querySelector('#meldung').textContent), null, { timeout: 5000 }).then(() => true, () => false), 'Quittung der Probemail steht');
  await p.click('#detail [data-akt="versand"]'); await p.waitForSelector('#fenster:not([hidden]) .fenster__k');
  await p.waitForTimeout(1800);   // die grosse Zahl zählt hoch (bewegung.js im Kleid)
  const sichtbar = await p.$$eval('#meldung .quit', l => l.filter(q => q.offsetParent !== null).length);
  ok(sichtbar === 0, 'Versand-Rückfrage: keine Quittung darüber');
  await p.screenshot({ path: ZIEL + 'n3-versand-rueckfrage.jpg', quality: 82 });
  await p.click('#fenster [data-zu]');
  const zurueck = await p.$$eval('#meldung .quit', l => l.filter(q => q.offsetParent !== null).length);
  ok(zurueck === 1, 'nach «Zurück» ist die Quittung der Probemail wieder da');
  await p.screenshot({ path: ZIEL + 'n3-quittung-zurueck.jpg', quality: 82 });
  // jetzt wirklich (trocken) an die Liste
  await p.click('#detail [data-akt="versand"]'); await p.waitForSelector('#f-los');
  await p.click('#f-los'); await p.waitForTimeout(1200);
  ok(/raus/.test(await p.textContent('#meldung')), 'Versand-Quittung steht');
  // Mails im Postausgang: kein leeres h2, kein goldener Strich ohne Text
  const d = JSON.parse(fs.readFileSync(ABLAGE + 'daten.json', 'utf8'));
  const post = d.postausgang.filter(m => m.betreff === 'Prüfung leere Bausteine');
  let leerH2 = 0, strich = 0, n = 0;
  for (const m of post) {
    for (const x of [m.datei.replace(/\.eml$/, '.html')]) { const h = fs.readFileSync(ABLAGE + 'postausgang/' + x, 'utf8'); n++; leerH2 += (h.match(/<h2[^>]*>\s*<\/h2>/g) || []).length; strich += (h.match(/width="3"/g) || []).length; }
  }
  console.log('Mails geprüft:', n);
  ok(n > 0 && leerH2 === 0 && strich === 0, 'Mails im Postausgang ohne leeren Titel und ohne Zitat-Strich');
  // Archiv «Ansehen»
  await p.goto(N + '#archiv'); await p.waitForSelector('.re-zahlen');
  const knopf = p.locator('#ansicht button', { hasText: 'Ansehen' }).first();
  await knopf.click(); await p.waitForTimeout(800);
  await p.screenshot({ path: ZIEL + 'n3-archiv-ansehen.jpg', quality: 82 });
  await p.context().close();
}

(async () => {
  const browser = await chromium.launch();
  await haken(browser, 1440); await haken(browser, 390);
  await ausgabe(browser);
  await browser.close();
  ok(!fehler.length, 'Konsole leer' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
})();
