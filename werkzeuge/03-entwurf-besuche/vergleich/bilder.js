// Bilder für werkzeuge/03-entwurf-besuche/vergleich/: Vorlage (Le Registre) und Neubau (Wer hat den Entwurf geöffnet), je Ansicht bei 1440 und 390 px.
// Neu aufnehmen: python3 -m http.server 9081 --bind 127.0.0.1 --directory vorlage, python3 zentrale/server.py, dann node werkzeuge/03-entwurf-besuche/vergleich/bilder.js
// Vor dem Lauf daten/03-entwurf-besuche/geoeffnet.json löschen, sonst ist nichts «neu».
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/registre/uwerkzeuge/registre/index.html?beispiel=1';
const N = 'http://127.0.0.1:9100/werkzeuge/03-entwurf-besuche/?wer=Robert';
const VB = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/index.html';
const VA = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/registre/uwerkzeuge/registre/';
const NA = 'http://127.0.0.1:9100/werkzeuge/03-entwurf-besuche/';
// [name, vorlage-url, vorlage-tun, neubau-url, neubau-tun]
const ANSICHTEN = [
  ['start', V + '#start', null, N + '#start', null],
  ['liste', V + '#besuche', null, N + '#haeuser', null],
  ['besuch', V + '#besuche', p => p.click('#ansicht .liste .besuch >> nth=1').catch(() => {}), N + '#besuche', p => p.click('#ansicht .liste .besuch >> nth=1').catch(() => {})],
  ['haus', V + '#seiten', null, N + '#haeuser', p => p.click('#ansicht [data-gehe="haus"] >> nth=0').catch(() => {})],
  ['zaehlung', V + '#zaehlung', null, N + '#zaehlung', null],
  // Le Registre hat kein Feld-Fenster; das Fenster der Vorlage ist das von Le Bureau (website.js fenster()), hier mit dessen eigenem Stil in die Bureau-Seite gesetzt, weil Le Bureau ohne seinen Dienst nicht startet.
  ['fenster', VB, p => p.evaluate(() => { document.getElementById('ws-fenster').innerHTML = '<div class="ws-fenster"><button class="ws-fenster__grund" type="button"></button><div class="ws-fenster__blatt" role="dialog"><h2>Den ganzen Entwurf <span class="t-akzent">verwerfen?</span></h2><p>3 Änderungen gehen verloren. Die veröffentlichte Website bleibt, wie sie ist.</p><div class="ws-fenster__kn"><button class="ws-link" type="button">Abbrechen</button><button class="kn kn--d kn--klein" type="button"><span>Ja, verwerfen</span><i aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg></i></button></div></div></div>'; }), N + '#schluessel', p => p.click('#ansicht [data-schluessel] >> nth=0').catch(() => {})],
  ['rand', V + '#start', p => p.click('[data-wo-rand-knopf]').catch(() => {}), N + '#start', p => p.click('[data-wo-rand-knopf]').catch(() => {})],
  ['anleitung', VA + 'anleitung.html', null, NA + 'anleitung.html', null],
];
const nur = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const breite of [1440, 390]) for (const [name, vu, vt, nu, nt] of ANSICHTEN) {
    if (nur && !name.startsWith(nur)) continue;
    if (name === 'rand' && breite > 500) continue;
    for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
      const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      const fehler = [];
      p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
      p.on('pageerror', e => fehler.push(String(e)));
      await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.href), r => r.abort());
      await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-besuche', '1'); localStorage.setItem('rundgang-culinarium-registre', '1'); } catch (e) {} });
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
      await p.waitForSelector('html.auftakt-da, html:not(.auftakt)', { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1400);
      if (tun) { await tun(p); await p.waitForTimeout(900); }
      const ueber = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await p.screenshot({ path: ZIEL + `${name}-${breite}-${seite}.jpg`, type: 'jpeg', quality: 72 });
      console.log(name, breite, seite, 'überlauf', ueber, fehler.length ? 'FEHLER ' + fehler.join(' | ') : '');
      await p.close();
    }
  }
  await b.close();
})();
