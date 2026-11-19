// Prüf-Chat 07.11.2026: Vergleichsbilder Vorlage (Le Livre) gegen Neubau (Marke & Vision), 1440 und 390 px.
// Neu aufnehmen: python3 zentrale/server.py; python3 -m http.server 9081 --bind 127.0.0.1 --directory vorlage;
// node werkzeuge/12-marke-vision/vergleich/bilder.js
// Die Vorlage hängt unter localhost:9300 (Schleife in demo/shim.js), unter 127.0.0.1:9081 läuft sie.
// Prüfseite der Vorlage: Le Livre hat keine eigene, verglichen wird mit der von La Réception (mit Lexikon).
const { chromium } = require('playwright');
const ZIEL = process.argv[2] || __dirname + '/bilder/';
const V = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/livre/uwerkzeuge/livre/';
const VR = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/';
const N = 'http://localhost:9100/werkzeuge/12-marke-vision/';
const A = [ // name, vorlage url, vorlage tun, neubau url, neubau tun
  ['start', V+'index.html#start','', N+'?wer=Anna#start',''],
  ['start-tiefer', V+'index.html#start','tiefer', N+'?wer=Anna#start','tiefer'],
  ['bereich-fotos-warum', V+'index.html#bilder','', N+'?wer=Anna#warum',''],
  ['bereich-tiefer', V+'index.html#bilder','tiefer', N+'?wer=Anna#warum','tiefer'],
  ['bereich-dateien-glaube', V+'index.html#dateien','', N+'?wer=Anna#glaube',''],
  ['bereich-pruefung-kunden', V+'index.html#pruefung','', N+'?wer=Anna#kunden',''],
  ['buch-erkennen', V+'buch.html','', N+'?wer=Anna#erkennen',''],
  ['buch-tiefer-bauen', V+'buch.html','tiefer', N+'?wer=Anna#bauen','vh'],
  ['bereich-wohin', V+'index.html#dateien','tiefer', N+'?wer=Anna#wohin',''],
  ['liste-fragen', V+'index.html#dateien','', N+'?wer=Anna#fragen',''],
  ['fenster', V+'index.html#bilder','fenster', N+'?wer=Anna#warum','fenster'],
  ['anleitung', V+'anleitung.html','', N+'anleitung.html',''],
  ['rundgang', V+'index.html#start','rundgang', N+'?wer=Anna#start','rundgang'],
  ['pruefseite', VR+'pruefung.html','', N+'pruefung.html',''],
  ['handy-rand', V+'index.html#start','rand', N+'?wer=Anna#start','rand'],
];
(async () => {
  const b = await chromium.launch();
  const bericht = [];
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of A) {
    if (name === 'handy-rand' && breite > 500) continue;
    for (const [seite, url, wo] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
      const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('wo-rundgang-gesehen','1'); } catch(e){} });
      const p = await ctx.newPage();
      const fehler = [];
      p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') fehler.push(m.text().slice(0,160)); });
      p.on('pageerror', e => fehler.push('JS: ' + e.message.slice(0,160)));
      await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.toString()), r => r.abort());
      await p.goto(url, { waitUntil: 'load', timeout: 20000 }).catch(e => fehler.push('goto ' + e.message.slice(0,60)));
      await p.waitForTimeout(2500);
      const hin = async sel => p.evaluate(s => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, sel);
      try {
        if (wo === 'tiefer') await p.evaluate(() => scrollTo(0, innerHeight * 1.05));
        else if (wo === 'vh') await hin('.mv-vh');
        else if (wo === 'fenster') {
          if (seite === 'vorlage') await p.evaluate(() => { const e = document.querySelector('#ansicht [data-k], #ansicht figure button, #ansicht .bild button, #ansicht button[data-bild], #ansicht [data-id]'); if (e) e.click(); });
          else await p.click('#leiste [data-neu]');
        } else if (wo === 'rundgang') await p.evaluate(() => { const e = [...document.querySelectorAll('a,button')].find(x => /Kurzer Rundgang/.test(x.textContent)); if (e) e.click(); });
        else if (wo === 'rand') await p.click('#kopf button:has-text("Bereiche"), header button:has-text("Bereiche")');
      } catch (e) { fehler.push('tun ' + e.message.slice(0,80)); }
      await p.waitForTimeout(1800);
      const ueber = await p.evaluate(() => { const w = document.documentElement.clientWidth; const raus = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.right > w + 1 && cs.position !== 'fixed' && !e.closest('[hidden],.wo-rand:not(.offen)'); }).slice(0,4).map(e => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '') + ' r=' + Math.round(e.getBoundingClientRect().right)); return { sw: document.documentElement.scrollWidth, w, raus }; });
      await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 76 });
      bericht.push([seite, breite, name, ueber.sw > ueber.w ? 'UEBERLAUF ' + ueber.sw : 'ok', JSON.stringify(ueber.raus), fehler.filter(f => !/ERR_FAILED|ERR_TUNNEL|404|ERR_ABORTED/.test(f)).join(' | ')].join(' ; '));
      await ctx.close();
    }
  }
  console.log(bericht.join('\n'));
  await b.close();
})();
