// Bilder für werkzeuge/10-newsletter/vergleich/: Vorlage (La Réception) und Neubau (Post aus dem Studio), je Ansicht, bei 1440 und 390 px.
// Neu aufnehmen: python3 -m http.server 9812 --bind 127.0.0.1 --directory vorlage, python3 zentrale/server.py, node werkzeuge/10-newsletter/vergleich/bilder.js
// Die Demo der Vorlage biegt Anfragen nur um, wenn sie nicht von localhost kommt: darum der Name vorlage.test (im Browser auf 127.0.0.1 gelegt).
// Mit «anleitung» als Argument nimmt das Skript stattdessen die Bilder der Anleitung auf (bilder/nl-*.jpg, 1440 px). Vorher daten/10-newsletter/ löschen,
// danach wieder: die Aufnahme legt eine Probemail und einen trockenen Versand an.
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:' + (process.env.VPORT || 9812) + '/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/';
const N = 'http://localhost:' + (process.env.PORT || 9612) + '/zentrale/werkzeuge/10-newsletter/';
// [name, Vorlage-Adresse, was dort tun, Neubau-Adresse, was dort tun]
const ANSICHTEN = [
  ['start', V + 'index.html#start', 'top', N + '#start', 'top'],
  ['lage', V + 'index.html#start', '.wo-lage', N + '#start', '.wo-lage'],
  ['listen', V + 'index.html#start', '.re-start', N + '#start', '.re-start'],
  ['eingang', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|.re-eingang', N + '#ausgaben', '.re-eingang'],
  ['brief', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|.re-post', N + '#ausgaben', '.re-post'],
  ['text', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:[data-akt="bearbeiten"]|.re-post', N + '#ausgaben', 'klick:[data-akt="bausteine"]|.re-post'],
  ['fenster', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:#detail [data-akt="weg"]', N + '#ausgaben', 'klick:#detail [data-akt="weg"]'],
  ['karten', V + 'index.html#abende', 'top', N + '#listen', 'top'],
  ['karten-unten', V + 'index.html#abende', '.re-abende', N + '#listen', '.re-abende'],
  ['gruppen', V + 'index.html#gefragt', 'top', N + '#empfaenger', 'top'],
  ['gruppen-unten', V + 'index.html#gefragt', '.re-zahlen', N + '#empfaenger', '.re-zahlen'],
  ['archiv', V + 'index.html#gefragt', '.re-zahlen', N + '#archiv', '.re-zahlen'],
  ['versand', V + 'index.html#nachgetragen', 'top', N + '#versand', 'top'],
  ['rand', V + 'index.html#eingang', 'handy:[data-wo-rand-knopf]', N + '#ausgaben', 'handy:[data-wo-rand-knopf]'],
  ['anleitung', V + 'anleitung.html', 'top', N + 'anleitung.html', 'top'],
  ['pruefung', V + 'pruefung.html', 'top', N + 'pruefung.html', 'top'],
];
const ANLEITUNG = [
  ['nl-uebersicht', '#start', 'top'],
  ['nl-bausteine', '#ausgaben', 'klick:[data-akt="bausteine"]|.re-post'],
  ['nl-vorschau', '#ausgaben', '.re-post'],
  ['nl-quittung', '#ausgaben', 'klick:[data-akt="bausteine"]|tippe:.nl-bausteine input[data-k="text"]| Ausgabe|klick:#l-speichern|.re-eingang'],
  ['nl-versand', '#ausgaben', 'klick:[data-akt="probe"]|klick:[data-akt="versand"]'],
  ['nl-empfaenger', '#empfaenger', '.re-zahlen'],
  ['nl-listen', '#listen', '.re-abende'],
  ['nl-archiv', '#versand', '.nl-weg'],
];
const nur = process.argv[2];
async function tu(p, wo, name) {
  for (const s of wo.split('|')) {
    if (s === 'top' || !s) continue;
    if (/^(klick|handy):/.test(s)) { await p.click(s.replace(/^\w+:/, '')).catch(() => console.log(name, 'kein', s)); await p.waitForTimeout(1200); continue; }
    if (/^tippe:/.test(s)) { p._tippe = s.slice(6); continue; }
    if (p._tippe) { await p.focus(p._tippe).catch(() => {}); await p.keyboard.press('End'); await p.keyboard.type(s); p._tippe = ''; await p.waitForTimeout(300); continue; }
    await p.evaluate(sel => { const e = document.querySelector(sel); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, s);
    await p.waitForTimeout(1400);
  }
}
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  if (nur === 'anleitung') {
    for (const [name, h, wo] of ANLEITUNG) {
      const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
      await p.goto(N + h, { waitUntil: 'networkidle' }); await p.waitForTimeout(2200);
      await tu(p, wo, name);
      await p.screenshot({ path: __dirname + '/../bilder/' + name + '.jpg', type: 'jpeg', quality: 78 });
      await p.close();
    }
    return b.close();
  }
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of ANSICHTEN) for (const [seite, url, wo] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
    if (nur && name !== nur) continue;
    if (/handy:/.test(wo) && breite > 500) continue;
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    p.on('pageerror', e => { if (seite === 'neubau') console.log(name, breite, 'FEHLER', e.message); });
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(2200);
    await tu(p, wo, name + ' ' + seite + ' ' + breite);
    if (seite === 'neubau') { const u = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (u > 0) console.log(name, breite, 'UEBERLAUF', u); }
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 76 });
    await p.close();
  }
  await b.close();
})();
