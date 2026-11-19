/* Prüf-Chat 07.11.2026 (zweite Prüfung: dazu «haeufig» und «haeuser»): Bilder für werkzeuge/08-beitraege/vergleich/, Vorlage (Le Bureau) und Neubau (Beiträge), je Ansicht bei 1440 und 390 px.
   Neu aufnehmen (aus dem Stamm des Repos):
     git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo <ordner>/culinarium-demo   (voll, mit Fotos und Anleitung)
     python3 -m http.server 9301 --directory <ordner>
     python3 zentrale/server.py
     rm -rf daten/08-beitraege   (Probedaten frisch)
     node werkzeuge/08-beitraege/vergleich/bilder.js
   Die Vorlage läuft über den Namen vorlage.test (ihre Demo-Weiche antwortet localhost nicht). Fremdaufrufe werden abgefangen.
   Jede Aufnahme schreibt Konsole und Überlauf nach bilder/protokoll.json. Wo der Neubau speichert, wird es sofort zurückgenommen. */
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = __dirname + '/bilder/';
const VW = 'http://vorlage.test:9301/culinarium-demo/werkzeuge/';
const V = VW + 'bureau/uwerkzeuge/bureau/index.html';
const N = 'http://localhost:9100/werkzeuge/08-beitraege/';
const ID = 'e-20261105-fernsicht-frage';
const T = N + '?ansicht=text&entwurf=' + ID;
const warte = ms => p => p.waitForTimeout(ms);
const vFeld = async p => { await p.click('#ws-gruppen .ws-st >> nth=2'); await p.waitForTimeout(800); };
const nFeld = async p => { await p.click('#ws-gruppen [data-g="text"] .ws-st >> nth=0'); await p.waitForTimeout(800); };
const vTipp = async p => { await vFeld(p); await p.click('.ws-ed .ws-text'); await p.keyboard.press('End'); await p.keyboard.type(' neu'); await p.waitForTimeout(700); };
const nTipp = async p => { await nFeld(p); await p.click('.ws-ed textarea'); await p.keyboard.press('End'); await p.keyboard.type(' neu'); await p.waitForTimeout(700); };
const randAuf = async p => { const k = p.locator('[data-wo-rand-knopf]'); if (await k.isVisible()) { await k.click(); await p.waitForTimeout(900); } };
const navi = text => async p => { await randAuf(p); await p.locator('#ws-rand button', { hasText: text }).first().click(); await p.waitForTimeout(1500); };
const zu = sel => async p => { await p.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 140); }, sel); await p.waitForTimeout(1500); };
const ANSICHTEN = [
  ['start', 'Übersicht', V + '?ansicht=start', null, N + '?ansicht=start', null],
  ['haeufig', 'Kacheln «Häufig gebraucht»', V + '?ansicht=start', zu('#ws-mitte .wo-ag'), N + '?ansicht=start', zu('#ws-mitte .wo-ag')],
  ['haeuser', 'Bereich-Kacheln (Die Website / Die Häuser)', V + '?ansicht=start', zu('#ws-mitte .wo-bk'), N + '?ansicht=start', zu('#ws-mitte .wo-bk')],
  ['rand', 'Rand aufgeklappt (Handy)', V + '?ansicht=start', randAuf, N + '?ansicht=start', randAuf],
  ['arbeit', 'Arbeitsfläche (Bereich Startseite / Text & Vorschau)', V + '?ansicht=b:start', null, T, null],
  ['feld', 'Offenes Feld unter seiner Zeile', V + '?ansicht=b:start', vFeld, T, nFeld],
  ['eingabe', 'Eingabe offen: Leiste gelb', V + '?ansicht=b:start', vTipp, T, nTipp],
  ['quittung', 'Quittung nach dem Speichern', V + '?ansicht=b:start', async p => { await vTipp(p); await p.click('#ws-speichern'); await p.waitForTimeout(1500); },
    T, async p => { await nTipp(p); await p.click('#ws-speichern'); await p.waitForTimeout(1500); }],
  ['vergleich', 'Vorher, nachher (mit offener Eingabe)', V + '?ansicht=b:start', async p => { await vTipp(p); const k = p.locator('#ws-vgl'); if (await k.count()) await k.click(); else await p.goto(V + '?ansicht=entwurf'); await p.waitForTimeout(1500); },
    T, async p => { await nTipp(p); await p.click('#ws-vgl'); await p.waitForTimeout(1500); }],
  ['karten', 'Liste aus Karten (Termine / Alle Beiträge)', V + '?ansicht=e:termine', null, N + '?ansicht=l:alle', null],
  ['stand', 'Gefilterte Liste (Archiv der Abende / Im Entwurf)', V + '?ansicht=start', navi('Archiv der Abende'), N + '?ansicht=l:entwurf', null],
  ['haus', 'Ein Bereich der Lage (Das Haus / ein Haus)', V + '?ansicht=start', navi('Angaben des Hauses'), N + '?ansicht=h:landhaus-fernsicht', null],
  ['formular', 'Angaben (Zeiten & Preise / Haus, Vorlage, Stand)', V + '?ansicht=zahlen', null, N + '?ansicht=angaben&entwurf=' + ID, null],
  ['bild', 'Fotos (Bereich «Der Abend» / Bild vorher-nachher)', V + '?ansicht=b:abend', null, N + '?ansicht=bild&entwurf=' + ID, null],
  ['fenster', 'Offenes Fenster (Foto tauschen / Bild verlinken)', V + '?ansicht=b:abend', async p => { await p.evaluate(() => document.querySelectorAll('#ws-gruppen details').forEach(d => { d.open = true; })); await p.locator('.ws-foto:not([disabled])').first().click(); await p.waitForTimeout(1500); },
    N + '?ansicht=bild&entwurf=' + ID, async p => { await p.click('[data-bt-bild="vorher"] >> text=Verlinken'); await p.waitForTimeout(900); }],
  ['hilfe1', 'Textbereich (Google-Texte / Vorlagen)', V + '?ansicht=google', null, N + '?ansicht=vorlagen', null],
  ['hilfe2', 'Satz-Bereich (Hinweis für Gäste / Prüfregeln)', V + '?ansicht=hinweis', null, N + '?ansicht=regeln', null],
  ['verlauf', 'Frühere Fassungen / Veröffentlicht', V + '?ansicht=verlauf', null, N + '?ansicht=l:veroeffentlicht', null],
  ['rundgang', 'Kurzer Rundgang (erzwungen mit ?rundgang)', V + '?ansicht=start&rundgang', warte(1500), N + '?ansicht=start&rundgang', warte(1500)],
  ['pruefung', 'Prüfseite mit Lexikon', VW + 'reception/uwerkzeuge/reception/pruefung.html', null, N + 'pruefung.html', null],
  ['anleitung', 'Anleitung', VW + 'bureau/uwerkzeuge/bureau/anleitung.html', null, N + 'anleitung.html', null],
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  const nur = process.argv[2] ? process.argv[2].split(',') : null;
  const protokoll = fs.existsSync(ZIEL + 'protokoll.json') ? JSON.parse(fs.readFileSync(ZIEL + 'protokoll.json')) : {};
  for (const breite of [1440, 390]) for (const [name, , vu, vt, nu, nt] of ANSICHTEN) for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
    if (nur && !nur.includes(name)) continue;
    if (name === 'rand' && breite > 500) continue;
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    const log = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
    p.on('pageerror', e => log.push('pageerror: ' + e.message));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(2600);
    if (tun) await tun(p).catch(e => log.push('ablauf: ' + e.message.split('\n')[0]));
    await p.waitForTimeout(900);
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 78 });
    protokoll[name + '-' + breite + '-' + seite] = { konsole: log, ueberlauf: ueber };
    if (name === 'quittung' && seite === 'neubau') { await p.click('.ws-quit >> text=Rückgängig').catch(() => {}); await p.waitForTimeout(800); }
    await p.close();
  }
  fs.writeFileSync(ZIEL + 'protokoll.json', JSON.stringify(protokoll, null, 1));
  await b.close();
})();
module.exports = { ANSICHTEN };
