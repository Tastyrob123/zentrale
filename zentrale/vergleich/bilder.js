// Nachbesserung 00-zentrale (07.11.2026, nach der Prüfung): Bilder für zentrale/vergleich/, Vorlage (Kontrollpanel) und Neubau (Zentrale) je Ansicht bei 1440 und 390 px.
// Vorbereitung: Vorlage voll klonen nach <ordner>/culinarium-demo (git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo),
// python3 -m http.server 9081 --bind 127.0.0.1 --directory <ordner>   (Kontrollpanel leitet auf jedem anderen Port nach GitHub um)
// python3 zentrale/server.py, dann: node zentrale/vergleich/bilder.js
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/maison/uwerkzeuge/maison/index.html';
const VB = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/bureau/index.html';
const N = 'http://localhost:9100/';

// Jede Ansicht: Name, was sie zeigt, und je Seite (Vorlage, Neubau) Adresse und Handgriff vor dem Bild.
const nach = sel => async p => { await p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY); }, sel); await p.waitForTimeout(1500); };
const unten = async p => { for (let y = 0; y < 30; y++) { await p.mouse.wheel(0, 900); await p.waitForTimeout(60); } await p.waitForTimeout(1500); };
const mitte = sel => async p => { await p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight / 2 + e.offsetHeight / 2); }, sel); await p.waitForTimeout(1500); };
const tuerZu = async p => { await p.waitForTimeout(400); };
const ANSICHTEN = [
  ['start', 'Startbild', V, null, N, null],
  ['band', 'Laufband', V, mitte('.m-band'), N, mitte('.m-band')],
  ['saal-hell', 'Werkzeug-Saal hell', V, nach('#bureau'), N, nach('#w-02-kundenliste')],
  ['saal-dunkel', 'Werkzeug-Saal dunkel', V, nach('#carte'), N, nach('#w-01-feinschliff')],
  ['saal-tafel', 'Saal, Tafel «So geht’s» und Zahlen', V, mitte('#bureau .m-tafel'), N, mitte('#w-02-kundenliste .m-tafel')],
  ['weg', 'Zahlenzeile', V, mitte('#registre .m-weg'), N, mitte('#w-02-kundenliste .m-weg')],
  ['heute', 'Heute (nur Zentrale, Auftrag 00)', V, nach('#bureau'), N, nach('#heute')],
  ['fuss', 'Fuss', V, unten, N, unten],
  ['tuer', 'Werkzeug offen', VB, null, N, async p => { await p.click('#tueren .m-f5__k'); await p.waitForTimeout(3000); }],
  ['fenster', 'Offenes Fenster (Vorlage: Rundgang, Neubau: Suche)', V + '?rundgang', async p => { await p.waitForTimeout(1500); }, N, async p => { await p.keyboard.press('Control+k'); await p.waitForTimeout(800); }],
  ['rundgang', 'Rundgang mit ?rundgang', V + '?rundgang', async p => { await p.waitForTimeout(2500); }, N + '?rundgang', async p => { await p.waitForTimeout(4500); }],
  ['rundgang-5', 'Rundgang, letzter Schritt', V + '?rundgang', async p => { await p.waitForTimeout(2500); for (let i = 0; i < 4; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(900); } }, N + '?rundgang', async p => { await p.waitForTimeout(4500); for (let i = 0; i < 4; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(900); } }],
  ['anleitung', 'Knopf «Anleitungen» oben links angeklickt', V, async p => { await p.click('.m-oben__ecke--l:visible, .m-oben a[href="#fuss"]'); await p.waitForTimeout(2000); }, N, async p => { await p.click('.m-oben__ecke--l:visible, .m-oben a[href="#fuss"]').catch(() => p.evaluate(() => document.getElementById('fuss').scrollIntoView())); await p.waitForTimeout(2000); }],
  ['quittung', 'Quittung nach Personenwechsel, «Vorher, nachher» offen', VB, null, N + '#02-kundenliste', async p => { await p.click('#leiste [data-wer-wechsel]'); await p.mouse.move(700, 200); await p.waitForTimeout(800); await p.click('[data-q-vn]'); await p.waitForTimeout(500); }],
  ['startfehler', 'Startfehler-Tür (Programm der Seite blockiert)', V, tuerZu, N, tuerZu],
  ['pruefung', 'Prüfseite mit Lexikon (Vorlage: Website bearbeiten, wohin «Prüfung öffnen» führt)', VB, null, 'http://localhost:9100/zentrale/pruefung.html', null],
];

(async () => {
  const b = await chromium.launch();
  const fehler = {};
  for (const breite of [1440, 390]) for (const [name, , vu, vh, nu, nh] of ANSICHTEN.filter(a => !process.argv[2] || process.argv.slice(2).includes(a[0]))) for (const [seite, url, handgriff] of [['vorlage', vu, vh], ['neubau', nu, nh]]) {
    const kontext = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    const p = await kontext.newPage();
    const log = (fehler[seite + '-' + name + '-' + breite] = []);
    p.on('console', m => { if (m.type() === 'error') log.push(m.text()); });
    p.on('pageerror', e => log.push('Skriptfehler: ' + e.message));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r) || (name === 'startfehler' && /\/(maison|zentrale)\.js/.test(r)), r => r.abort());
    // Rundgang der Vorlage zeigt sich Prüfprogrammen nicht (navigator.webdriver); für die Bilder ausblenden
    await p.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); try { if (!/rundgang/.test(location.search)) { localStorage.setItem('rundgang-culinarium-maison', '1'); localStorage.setItem('rundgang-tasty-zentrale', '1'); } localStorage.removeItem('zentrale.offen'); } catch (e) {} });
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(2600);
    if (handgriff) await handgriff(p).catch(e => log.push('Handgriff: ' + e.message.split('\n')[0]));
    const breit = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (breit > 0) log.push('läuft ' + breit + ' px über den Rand');
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 78 });
    await kontext.close();
  }
  await b.close();
  if (!process.argv[2]) require('fs').writeFileSync(__dirname + '/bilder/konsole.json', JSON.stringify(fehler, null, 1));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(fehler).filter(([k, v]) => v.length && k.startsWith('neubau'))), null, 1));
})();
