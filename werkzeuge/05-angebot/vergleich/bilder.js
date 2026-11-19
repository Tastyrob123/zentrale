// Bilder für werkzeuge/05-angebot/vergleich/ (Prüf-Chat, 07.11.2026): Vorlage (La Réception) und Neubau (Angebot), je Ansicht bei 1440 und 390 px.
// Vorlage voll klonen nach <ordner>/culinarium-demo (git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo), damit die Fotos da sind,
// python3 -m http.server 9301 --bind 127.0.0.1 --directory <ordner>, python3 zentrale/server.py, daten/05-angebot/ löschen (frische Probedaten),
// dann node werkzeuge/05-angebot/vergleich/bilder.js [ansicht,ansicht]. Die Demo der Vorlage biegt Anfragen nur um, wenn sie nicht von localhost
// kommt: darum der Name vorlage.test (im Browser auf 127.0.0.1 gelegt). Achtung: «quittung» speichert im Neubau wirklich (Probedaten).
const { chromium } = require('playwright');
const ZIEL = __dirname + '/bilder/';
const V = 'http://vorlage.test:9301/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/';
const N = 'http://localhost:9100/werkzeuge/05-angebot/';
const A = [
  ['start', V + 'index.html#start', 'top', N + '#start', 'top'],
  ['lage', V + 'index.html#start', '.wo-lage', N + '#start', '.wo-lage'],
  ['listen', V + 'index.html#start', '.re-start', N + '#start', '.re-start'],
  ['eingang', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|.re-eingang', N + '#angebote', '.re-eingang'],
  ['blatt', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|.re-post', N + '#angebote', '.re-post'],
  ['umfang', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:[data-akt="bearbeiten"]|.re-post', N + '#angebote', 'klick:[data-akt="umfang"]|.re-post'],
  ['offen', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:[data-akt="bearbeiten"]|tippe:#e-text|.re-post', N + '#angebote', 'klick:[data-akt="umfang"]|klick:.an-gr[open] .an-pos:not(.gewaehlt) input[type=checkbox]|.re-post'],
  ['quittung', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:#detail [data-akt="erledigt"]', N + '#angebote', 'klick:[data-akt="umfang"]|klick:.an-gr[open] .an-pos:not(.gewaehlt) input[type=checkbox]|klick:#detail [data-akt="speichern"]'],
  ['fenster', V + 'index.html#eingang', 'klick:.re-a:nth-of-type(3)|klick:#detail [data-akt="weg"]', N + '#angebote', 'klick:#detail [data-akt="weg"]'],
  ['karten', V + 'index.html#abende', 'top', N + '#haeuser', 'top'],
  ['karten-unten', V + 'index.html#abende', '.re-abende', N + '#haeuser', '.re-abende'],
  ['gruppen', V + 'index.html#gefragt', 'top', N + '#preise', 'top'],
  ['gruppen-unten', V + 'index.html#gefragt', '.re-zahlen', N + '#preise', '.re-zahlen'],
  ['rand', V + 'index.html#eingang', 'handy:[data-wo-rand-knopf]', N + '#angebote', 'handy:[data-wo-rand-knopf]'],
  ['anleitung', V + 'anleitung.html', 'top', N + 'anleitung.html', 'top'],
  ['pruefung', V + 'pruefung.html', 'top', N + 'pruefung.html', 'top'],
  ['rundgang', V + 'index.html?rundgang#start', 'warte:7000', N + '?rundgang#start', 'warte:7000'],
];
const nur = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--host-resolver-rules=MAP vorlage.test 127.0.0.1', '--disable-blink-features=AutomationControlled'] });
  const log = [];
  for (const breite of [1440, 390]) for (const [name, vu, vs, nu, ns] of A) for (const [seite, url, wo] of [['vorlage', vu, vs], ['neubau', nu, ns]]) {
    if (nur && !nur.split(',').includes(name)) continue;
    if (/handy:/.test(wo) && breite > 500) continue;
    const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, hasTouch: breite < 500, isMobile: breite < 500 });
    const p = await ctx.newPage();
    await p.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    const kons = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') kons.push(m.type() + ': ' + m.text()); });
    p.on('pageerror', e => kons.push('pageerror: ' + e.message));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r), r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(2200);
    for (const s of wo.split('|')) {
      if (s === 'top') continue;
      if (/^warte:/.test(s)) { await p.waitForTimeout(+s.slice(6)); continue; }
      if (/^tippe:/.test(s)) { await p.click(s.slice(6)).catch(() => kons.push('kein ' + s)); await p.keyboard.type(' Probe'); await p.waitForTimeout(800); continue; }
      if (/^(klick|handy):/.test(s)) { await p.click(s.replace(/^\w+:/, ''), { timeout: 5000 }).catch(e => kons.push('kein ' + s)); await p.waitForTimeout(1200); continue; }
      await p.evaluate(sel => { const e = document.querySelector(sel); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, s);
      await p.waitForTimeout(1400);
    }
    const ueber = await p.evaluate(() => { const w = innerWidth; const r = []; if (document.documentElement.scrollWidth > w) r.push('scrollWidth ' + document.documentElement.scrollWidth); document.querySelectorAll('body *').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && b.right > w + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('[hidden],.fenster[hidden]')) { let x = e, clip = false; while ((x = x.parentElement)) { const o = getComputedStyle(x).overflowX; if (o !== 'visible') { clip = true; break; } } if (!clip) r.push((e.className || e.tagName) + ' ' + Math.round(b.right)); } }); return r.slice(0, 6); });
    await p.screenshot({ path: ZIEL + name + '-' + breite + '-' + seite + '.jpg', type: 'jpeg', quality: 76 });
    log.push([name, breite, seite, kons.join(' || '), ueber.join(', ')].join(' | '));
    await ctx.close();
  }
  console.log(log.join('\n'));
  await b.close();
})();
