// Prüf-Chat 07.11.2026: Bilder für vergleich/index.html, Vorlage (Le Registre, Prüfseite von La Carte, Fenster von Le Bureau) und Neubau nebeneinander bei 1440 und 390 px.
// Vorlage: volle Fassung (mit Fotos) unter 127.0.0.1:9082, sonst der Ordner im Repo unter 127.0.0.1:9081
//   git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo /tmp/vorlage-voll/culinarium-demo
//   python3 -m http.server 9082 --bind 127.0.0.1 --directory /tmp/vorlage-voll
// Neubau: python3 zentrale/server.py (9100). Vor dem Lauf daten/03-entwurf-besuche/geoeffnet.json löschen, sonst ist nichts «neu».
// Lauf: node werkzeuge/03-entwurf-besuche/vergleich/pruefung-bilder.js  → bilder/*.jpg und bilder/messung.json
// Le Registre hängt unter localhost und 127.0.0.1 beim Laden: die Demo-Weiche (demo/shim.js, norm()) hängt bei diesen Namen den Pfad von
//   /culinarium-demo/besuch.js endlos an. Deshalb ruft der Testbrowser die Vorlage unter localhost.vorlage auf (zeigt per Regel auf 127.0.0.1):
//   VORLAGE=http://localhost.vorlage:9713 (Nachbesserung r2-52, 07.11.2026).
const { chromium } = require('playwright');
const fs = require('fs');
const ZIEL = __dirname + '/bilder/';
const VP = process.env.VORLAGE || 'http://127.0.0.1:9082';
const V = VP + '/culinarium-demo/werkzeuge/registre/uwerkzeuge/registre/';
const VB = VP + '/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/index.html';
const VC = VP + '/culinarium-demo/werkzeuge/carte/uwerkzeuge/carte/';
const N = (process.env.NEUBAU || 'http://127.0.0.1:9100') + '/zentrale/werkzeuge/03-entwurf-besuche/';   // Nachbesserung: NEUBAU=http://127.0.0.1:9607 VORLAGE=http://127.0.0.1:9807
const NQ = N + '?wer=Robert';
const warte = ms => p => p.waitForTimeout(ms);
const klick = sel => async p => { await p.click(sel, { timeout: 4000 }).catch(e => console.log('  klick fehlt', sel)); };
// Fenster von Le Bureau (website.js fenster()) mit dessen eigenem Stil, weil Le Bureau ohne seinen Dienst nicht startet
const bureauFenster = p => p.evaluate(() => { const o = document.getElementById('ws-fenster') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'ws-fenster' })); o.innerHTML = '<div class="ws-fenster"><button class="ws-fenster__grund" type="button"></button><div class="ws-fenster__blatt" role="dialog"><h2>Den ganzen Entwurf <span class="t-akzent">verwerfen?</span></h2><p>3 Änderungen gehen verloren. Die veröffentlichte Website bleibt, wie sie ist.</p><div class="ws-fenster__kn"><button class="ws-link" type="button">Abbrechen</button><button class="kn kn--d kn--klein" type="button"><span>Ja, verwerfen</span><i aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg></i></button></div></div></div>'; });
// [name, titel, vorlage-url, vorlage-tun, neubau-url, neubau-tun, nurBreite]
const ANSICHTEN = [
  ['start', 'Start (Übersicht)', V + 'index.html?beispiel=1#start', null, NQ + '#start', null],
  ['start-unten', 'Start, nach unten gescrollt', V + 'index.html?beispiel=1#start', p => p.evaluate(() => scrollTo(0, 900)), NQ + '#start', p => p.evaluate(() => scrollTo(0, 900))],
  ['besuche', 'Besuche, ein Besuch offen', V + 'index.html?beispiel=1#besuche', klick('#ansicht .liste .besuch >> nth=1'), NQ + '#besuche', klick('#ansicht .liste .besuch >> nth=1')],
  ['liste', 'Hauptliste mit Bildern (Vorlage Seiten, Neubau Alle Häuser)', V + 'index.html?beispiel=1#seiten', null, NQ + '#haeuser', null],
  ['haus', 'Ein Haus mit Zeitleiste (Vorlage: Weg eines Besuchs)', V + 'index.html?beispiel=1#besuche', klick('#ansicht .liste .besuch >> nth=0'), NQ + '#haeuser', klick('#ansicht [data-gehe="haus"] >> nth=0')],
  ['zaehlung', 'So wird gezählt', V + 'index.html?beispiel=1#zaehlung', null, NQ + '#zaehlung', null],
  ['schluessel', 'Der Schlüssel (Vorlage ohne Gegenstück: Herkunft)', V + 'index.html?beispiel=1#herkunft', null, NQ + '#schluessel', null],
  ['fenster', 'Offenes Fenster (Vorlage: Le Bureau)', VB, bureauFenster, NQ + '#schluessel', klick('#ansicht [data-schluessel] >> nth=0')],
  ['zeitraum', 'Zeitraum 7 Tage gewählt', V + 'index.html?beispiel=1#start', klick('#ansicht .zeitraum button[data-tage="7"]'), NQ + '#start', klick('#ansicht .zeitraum button[data-tage="7"]')],
  ['quittung', 'Quittung «Als Tabelle sichern»', V + 'index.html?beispiel=1#start', klick('#l-export'), NQ + '#start', klick('#l-export')],
  ['sichern', 'Besuche, unten «Alle Besuche als Tabelle sichern»', V + 'index.html?beispiel=1#besuche', p => p.evaluate(() => document.querySelector('[data-sichern]').scrollIntoView({ block: 'center' })), NQ + '#besuche', p => p.evaluate(() => document.querySelector('[data-sichern]').scrollIntoView({ block: 'center' }))],
  ['gesehen', 'Quittung «Als gesehen markieren» (Vorlage: Le Registre, kein Gegenstück, daneben die Übersicht)', V + 'index.html?beispiel=1#start', null, NQ + '#haeuser', async p => { await klick('#l-gesehen')(p); await p.waitForTimeout(300); }],
  ['leiste', 'Leiste unten (Vorlage: Le Bureau, Speichern grau)', VB, null, NQ + '#start', null],
  ['rundgang', 'Kurzer Rundgang', V + 'index.html?beispiel=1#start', p => p.evaluate(() => window.rundgang && window.rundgang()), NQ + '#start', p => p.evaluate(() => window.rundgang && window.rundgang())],
  ['rand', 'Handy mit offenem Rand', V + 'index.html?beispiel=1#start', klick('[data-wo-rand-knopf]'), NQ + '#start', klick('[data-wo-rand-knopf]'), 390],
  ['anleitung', 'Anleitung', V + 'anleitung.html', null, N + 'anleitung.html', null],
  ['pruefseite', 'Prüfseite mit Lexikon (Vorlage: La Carte)', VC + 'pruefung.html', null, N + 'pruefung.html', null],
];
const nur = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP localhost.vorlage 127.0.0.1'] });
  const mess = {};
  for (const breite of [1440, 390]) for (const [name, titel, vu, vt, nu, nt, nb] of ANSICHTEN) {
    if (nur && !name.startsWith(nur)) continue;
    if (nb && nb !== breite) continue;
    for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
      if (seite === 'neubau') fs.rmSync(__dirname + '/../../../daten/03-entwurf-besuche/geoeffnet.json', { force: true });
      const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
      const fehler = [];
      p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push(m.text()); });
      p.on('pageerror', e => fehler.push(String(e)));
      p.on('response', r => { if (r.status() >= 400) fehler.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
      await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.href), r => r.abort());
      await p.addInitScript(() => { try { localStorage.removeItem('tasty-besuche-tage'); localStorage.removeItem('culinarium-registre-tage'); localStorage.setItem('rundgang-tasty-besuche', '1'); localStorage.setItem('rundgang-culinarium-registre', '1'); } catch (e) {} });
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(e => fehler.push('laden: ' + e.message.split('\n')[0]));
      await p.waitForSelector('html.auftakt-da, html:not(.auftakt)', { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1500);
      if (tun) { await tun(p); await p.waitForTimeout(1000); }
      const m = await p.evaluate(() => {
        const r = s => { const e = document.querySelector(s); if (!e) return null; const k = e.getBoundingClientRect(); return { b: Math.round(k.width), h: Math.round(k.height) }; };
        const fs_ = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontSize + ' ' + getComputedStyle(e).fontFamily.split(',')[0] : null; };
        const breit = document.documentElement.clientWidth;
        const raus = [...document.querySelectorAll('body *')].filter(e => { const k = e.getBoundingClientRect(); if (!k.width || k.right <= breit + 1) return false; const st = getComputedStyle(e); if (st.position === 'fixed' && (st.visibility === 'hidden' || +st.opacity === 0)) return false; for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && x !== e) return false; if (s.visibility === 'hidden') return false; } return true; }).slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' ' + Math.round(e.getBoundingClientRect().right));
        return { ueber: document.documentElement.scrollWidth - breit, raus, kopf: r('#kopf, .wo-kopf'), rand: r('#rand, .wo-rand'), leiste: r('#leiste, .wo-leiste'), startbild: r('.wo-sb'), h1: fs_('.wo-sb h1, main h1, h1'), fenster: r('.fenster__blatt, .ws-fenster__blatt'), quit: r('.quit'), hoehe: document.documentElement.scrollHeight };
      });
      m.fehler = fehler;
      mess[`${name}-${breite}-${seite}`] = m;
      await p.screenshot({ path: ZIEL + `${name}-${breite}-${seite}.jpg`, type: 'jpeg', quality: 74 });
      console.log(name, breite, seite, JSON.stringify(m));
      await p.close();
    }
  }
  // Nur Neubau: Haus direkt geöffnet am Handy (gleich beim Sichtbarwerden und 1 s später) und die Zeile «Besuche je Tag»
  if (!nur || nur === 'extra') {
    fs.rmSync(__dirname + '/../../../daten/03-entwurf-besuche/geoeffnet.json', { force: true });
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.href), r => r.abort());
    const t0 = Date.now();
    await p.goto(N + '?haus=seeblick&wer=Robert', { waitUntil: 'commit' });
    await p.waitForSelector('html.auftakt-da', { timeout: 8000 });
    const ms = Date.now() - t0, y1 = await p.$eval('.wo-sb h1', e => Math.round(e.getBoundingClientRect().top));
    await p.screenshot({ path: ZIEL + 'haus-tief-390-neubau.jpg', type: 'jpeg', quality: 74 });
    await p.waitForTimeout(1000);
    const y2 = await p.$eval('.wo-sb h1', e => Math.round(e.getBoundingClientRect().top));
    await p.screenshot({ path: ZIEL + 'haus-tief-390-neubau-spaeter.jpg', type: 'jpeg', quality: 74 });
    mess['haus-tief-390-neubau'] = { sichtbarNachMs: ms, titelOben: y1, titelObenSpaeter: y2 };
    console.log('haus-tief', JSON.stringify(mess['haus-tief-390-neubau']));
    await p.setViewportSize({ width: 1440, height: 900 }); await p.goto(NQ + '#start'); await p.waitForSelector('html.auftakt-da'); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector('.tafel').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
    await p.screenshot({ path: ZIEL + 'saeulen-1440-neubau.jpg', type: 'jpeg', quality: 74 });
    // Zentrale am Handy mit dem Werkzeug im Rahmen (Nachbesserung r2-52); bei 1440 px nimmt pruefung-bedienen.js das Bild auf
    await p.setViewportSize({ width: 390, height: 844 }); await p.goto((process.env.NEUBAU || 'http://127.0.0.1:9100') + '/'); await p.waitForTimeout(2000);
    await p.click('.wo-ag[data-oeffne="03-entwurf-besuche"]').catch(() => console.log('  klick fehlt Zentrale 390')); await p.waitForTimeout(2500);
    await p.screenshot({ path: ZIEL + 'zentrale-390-neubau.jpg', type: 'jpeg', quality: 74 });
    await p.close();
  }
  fs.writeFileSync(ZIEL + 'messung.json', JSON.stringify(mess, null, 1));
  await b.close();
})();
