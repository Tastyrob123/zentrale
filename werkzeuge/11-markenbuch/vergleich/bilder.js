// Bilder für werkzeuge/11-markenbuch/vergleich/ (Vorlage Le Bureau links, Markenbuch rechts, je 1440 und 390 px) und für die Anleitung (anleitung/*.webp).
// Neu aufnehmen: Vorlage voll klonen (git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo <ordner>/culinarium-demo),
//   python3 -m http.server 9081 --bind 127.0.0.1 --directory <ordner>   und   python3 zentrale/server.py,
//   dann node werkzeuge/11-markenbuch/vergleich/bilder.js   (braucht Python mit PIL für die webp-Bilder der Anleitung).
// Die Vorlage läuft unter dem Namen vorlage.test (auf 127.0.0.1 umgelenkt): ihre Demo-Weiche biegt Anfragen nur ausserhalb von localhost auf die Beispielwerte um.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const ZIEL = path.join(__dirname, 'bilder') + '/';
const AN = path.join(__dirname, '..', 'anleitung') + '/';
const VB = 'http://vorlage.test:9081/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/';
const VR = 'http://vorlage.test:9081/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/';
const N = 'http://127.0.0.1:9100/werkzeuge/11-markenbuch/';
const klick = s => p => p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, s);
const warte = ms => p => p.waitForTimeout(ms);
const ANSICHTEN = [
  ['start', VB + 'index.html', [], N + '?ansicht=start', []],
  ['bereich', VB + 'index.html', [klick('.wo-bk')], N + '?ansicht=zeichen', []],
  ['liste', VB + 'index.html?ansicht=zahlen', [], N + '?ansicht=farbe', []],
  ['karten', VB + 'index.html?ansicht=google', [], N + '?ansicht=s:Antonio', []],
  ['fenster', VB + 'index.html', [klick('.wo-bk'), warte(3500), klick('.ws-foto')], N + '?ansicht=zeichen', [klick('[data-mb-logo]')]],
  ['meldung', VB + 'index.html', [klick('#ws-speichern')], N + '?ansicht=start', [klick('#ws-speichern')]],
  ['rand', VB + 'index.html', [klick('[data-wo-rand-knopf]')], N + '?ansicht=start', [klick('[data-wo-rand-knopf]')]],
  ['rundgang', VB + 'index.html?rundgang', [], N + '?ansicht=start&rundgang', []],
  ['anleitung', VB + 'anleitung.html', [], N + 'anleitung.html', []],
  ['pruefung', VR + 'pruefung.html', [], N + 'pruefung.html', []],
];
const ANLEITUNG = [
  ['uebersicht', N + '?ansicht=start', []],
  ['zeichen', N + '?ansicht=zeichen', []],
  ['logo', N + '?ansicht=zeichen', [klick('[data-mb-logo]')]],
  ['schrift', N + '?ansicht=s:Antonio', []],
  ['farbe', N + '?ansicht=farbe', [klick('.mb-farbe__flaeche')]],
  ['abweichungen', N + '?ansicht=abweichungen', []],
  ['neu-lesen', N + '?ansicht=start', [klick('#mb-neu')]],
];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1'] });
  async function bild(url, schritte, breite, datei) {
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
    const fehler = [];
    p.on('pageerror', e => fehler.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && /127\.0\.0\.1:9100|markenbuch/.test(m.location().url || '')) fehler.push(m.text()); });
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test|fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(r), r => r.abort());
    await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.evaluate(() => { try { localStorage.removeItem('mb-ort'); localStorage.removeItem('ws-ort-culinarium'); } catch (e) {} });
    await p.waitForTimeout(3200);
    for (const s of schritte) { await s(p); await p.waitForTimeout(1600); }
    await p.waitForTimeout(1200);
    await p.screenshot({ path: datei, type: datei.endsWith('.jpg') ? 'jpeg' : 'png', quality: datei.endsWith('.jpg') ? 78 : undefined });
    const ueber = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.close();
    return { fehler, ueber };
  }
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of ANSICHTEN.filter(a => !process.env.NUR || a[0] === process.env.NUR)) for (const [seite, url, s] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
    const r = await bild(url, s, breite, ZIEL + name + '-' + breite + '-' + seite + '.jpg');
    console.log(name, breite, seite, seite === 'neubau' ? JSON.stringify(r) : '');
  }
  if (!process.env.OHNE_ANLEITUNG) for (const [name, url, s] of ANLEITUNG) {
    const png = AN + name + '.png';
    await bild(url, s, 1440, png);
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.convert("RGB").save(sys.argv[2],"WEBP",quality=80)', png, AN + name + '.webp']);
    require('fs').unlinkSync(png);
    console.log('anleitung', name);
  }
  await b.close();
})();
