// Prüfung 11-markenbuch (07.11.2026): Bilder für vergleich/index.html, Vorlage Le Bureau links, Markenbuch rechts, je 1440 und 390 px.
// Starten: python3 zentrale/server.py   und   python3 -m http.server 9300 --directory vorlage
//   dann node werkzeuge/11-markenbuch/vergleich/aufnahme.js
// Die Vorlage läuft unter dem Namen vorlage.test (auf 127.0.0.1 umgelenkt): unter localhost hängt ihre Demo-Weiche.
// Schreibt vergleich/bilder/<ansicht>-<breite>-<vorlage|neubau>.jpg und vergleich/befund.json (Konsole, Überlauf je Bild).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ZIEL = path.join(__dirname, 'bilder') + '/';
const VB = 'http://vorlage.test:9300/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/';
const VR = 'http://vorlage.test:9300/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/';
const N = 'http://127.0.0.1:9100/werkzeuge/11-markenbuch/';
const tu = f => p => p.evaluate(f);
const klick = s => tu(`(() => { const e = document.querySelector(${JSON.stringify(s)}); if (e) e.click(); return !!e; })()`);
const warte = ms => p => p.waitForTimeout(ms);
const randAuf = p => p.evaluate(() => { const b = document.querySelector('[data-wo-rand-knopf]'); if (b && getComputedStyle(b).display !== 'none') b.click(); });
// Vorlage: einen Text der Startseite ändern (gelb), dann Speichern (grün, Quittung)
const vText = [klick('[data-ws-nav="b:start"]'), warte(2500), klick('.ws-st[data-h="0cf803fee6"]'), warte(2000),
  tu(`(() => { const t = document.querySelector('.ws-ed .ws-text'); t.innerHTML = 'Culinarium in'; t.dispatchEvent(new Event('input', { bubbles: true })); })()`)];
const ANSICHTEN = [
  // [name, titel, vorlage-url, vorlage-schritte, neubau-url, neubau-schritte]
  ['start', 'Start: Übersicht mit Gruss und Foto', VB + 'index.html', [], N + '?ansicht=start', []],
  ['start-unten', 'Übersicht weiter unten: Häufig gebraucht, Bereiche', VB + 'index.html', [tu('scrollTo(0, 900)')], N + '?ansicht=start', [tu('scrollTo(0, 900)')]],
  ['bereich', 'Hauptbereich 1: Startseite / Das Zeichen', VB + 'index.html?ansicht=b:start', [], N + '?ansicht=zeichen', []],
  ['schrift', 'Hauptbereich 2: Angaben des Hauses / Die Schrift', VB + 'index.html?ansicht=angaben', [], N + '?ansicht=schrift', []],
  ['schriftblatt', 'Hauptbereich 2b: Google-Texte / Antonio', VB + 'index.html?ansicht=google', [], N + '?ansicht=s:Antonio', []],
  ['farbe', 'Hauptbereich 3: Zeiten & Preise / Die Farbe', VB + 'index.html?ansicht=zahlen', [], N + '?ansicht=farbe', []],
  ['haltung', 'Hauptbereich 4: Hinweis für Gäste / Die Haltung', VB + 'index.html?ansicht=hinweis', [], N + '?ansicht=bausteine', []],
  ['fenster', 'Offenes Fenster: Foto / Logo', VB + 'index.html', [klick('.wo-bk'), warte(3500), klick('.ws-foto')], N + '?ansicht=zeichen', [klick('[data-mb-logo]')]],
  ['fenster-farbe', 'Offenes Fenster: Foto / Farbe', VB + 'index.html', [klick('.wo-bk'), warte(3500), klick('.ws-foto')], N + '?ansicht=farbe', [klick('[data-mb-mehr]')]],
  ['leiste-gelb', 'Leiste gelb: etwas offen', VB + 'index.html', vText, N + '?ansicht=start', []],
  ['quittung', 'Quittung: vorher, nachher, Rückgängig', VB + 'index.html', [...vText, warte(1200), klick('#ws-speichern')], N + '?ansicht=start', [klick('#mb-neu')]],
  ['gespeichert', 'Speichern: grün mit Quittung', VB + 'index.html', [...vText, warte(1200), klick('#ws-speichern')], N + '?ansicht=start', [klick('#ws-speichern'), warte(300)]],
  // Neubau: erst speichern (danach ist nichts mehr offen), Quittung schliessen, dann noch einmal Speichern = «Nichts geändert»
  ['meldung', 'Speichern ohne Änderung', VB + 'index.html', [klick('#ws-speichern')], N + '?ansicht=start', [klick('#ws-speichern'), warte(3000), tu("document.querySelectorAll('.ws-quit').forEach(q => q.remove())"), klick('#ws-speichern')]],
  ['rand', 'Rand am Handy aufgeklappt', VB + 'index.html', [randAuf], N + '?ansicht=start', [randAuf]],
  ['rundgang', 'Rundgang', VB + 'index.html?rundgang', [], N + '?ansicht=start&rundgang', []],
  ['anleitung', 'Anleitung', VB + 'anleitung.html', [], N + 'anleitung.html', []],
  ['pruefung', 'Prüfseite (Vorlage: La Réception)', VR + 'pruefung.html', [], N + 'pruefung.html', []],
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const befund = {};
  async function bild(url, schritte, breite, datei, neubau) {
    // jede Neubau-Aufnahme beginnt beim Stand der Probedaten (eine frühere Aufnahme kann gespeichert haben)
    if (neubau) fs.rmSync(path.join(__dirname, '..', '..', '..', 'daten', '11-markenbuch', 'stand.json'), { force: true });
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
    const fehler = [];
    p.on('pageerror', e => fehler.push('Seitenfehler: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && (neubau || !/404|besuch|verweil/.test(m.text()))) fehler.push(m.text() + ' ' + (m.location().url || '')); });
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test|fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(r), r => r.abort());
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await p.waitForTimeout(3200);
    for (const s of schritte) { await s(p); await p.waitForTimeout(1600); }
    await p.waitForTimeout(1200);
    await p.screenshot({ path: datei, type: 'jpeg', quality: 78 });
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.close();
    return { fehler, ueber };
  }
  for (const breite of [1440, 390]) for (const [name, , vu, vs, nu, ns] of ANSICHTEN.filter(a => !process.env.NUR || a[0] === process.env.NUR)) for (const [seite, url, s] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
    const r = await bild(url, s, breite, ZIEL + name + '-' + breite + '-' + seite + '.jpg', seite === 'neubau');
    befund[name + '-' + breite + '-' + seite] = r;
    console.log(name, breite, seite, JSON.stringify(r));
  }
  fs.rmSync(path.join(__dirname, '..', '..', '..', 'daten', '11-markenbuch', 'stand.json'), { force: true });
  fs.writeFileSync(path.join(__dirname, 'befund.json'), JSON.stringify({ ansichten: ANSICHTEN.map(a => [a[0], a[1]]), befund }, null, 1));
  await b.close();
})();
