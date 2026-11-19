/* Echte Aufnahmen für den Feed von Tasty Studios (Robert 13.11.2026: «richtig professionelle Footage und Content … nicht einfach nur die KI-Bilder»).
   Quelle ist nur eigene Arbeit: die Tasty-Studios-Seite, das Beispielhaus «Ihr Haus» (Website, Markenbuch) und seine sieben Werkzeuge.
   Keine Kundenhäuser, keine KI-Szenen. Geräte: Blender-MacBook und -iPhone aus Carlton-Europe/_werkbank/geraet (Bildschirm ausgespart).
   1) node aufnahmen.js schirm   → roh/<name>-d.png (1440×932 @2x) und roh/<name>-m.png (390×844 @2x)
   2) node aufnahmen.js bild     → <name>.webp (1080×1350) in der Komposition aus STUECKE */
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const fs = require('fs'), path = require('path');
const HIER = __dirname, ROH = path.join(HIER, 'roh');
const GER = '/Users/robertreff/Desktop/Website-Projekte/Carlton-Europe Interlaken/_werkbank/geraet/';
const K = 'http://localhost:8978/haus/', TS = K + 'Tasty%20Studios%20Website/_online/', IH = K + 'Ihr%20Haus/';
/* name, Adresse, Komposition (laptop | paar | handy | detail), Grund (nacht | creme | schiefer), Zeile unten, für die Desktop-Aufnahme ein Stück weiter unten (px) */
const STUECKE = [
  ['ih-start', IH + 'index.html', 'paar', 'schiefer', 'Ihr Haus · Startseite', 0],
  ['ih-zimmer', IH + 'zimmer.html', 'handy', 'creme', 'Ihr Haus · Zimmer', 0],
  ['ih-tafel', IH + 'tafel.html', 'laptop', 'nacht', 'Ihr Haus · Die Tafel', 0],
  ['ih-anreise', IH + 'anreise.html', 'handy', 'nacht', 'Ihr Haus · Anreise', 0],
  ['ih-marke', IH + 'marke/markenbuch.html', 'laptop', 'schiefer', 'Ihr Haus · Markenbuch', 0],
  ['wz-giebel', TS + 'werkzeuge/giebel/', 'laptop', 'nacht', 'Der Giebel · Kontrollpanel', 0],
  ['wz-kontor', TS + 'werkzeuge/kontor/', 'laptop', 'creme', 'Das Kontor · Website', 0],
  ['wz-lagerbuch', TS + 'werkzeuge/lagerbuch/', 'laptop', 'schiefer', 'Das Lagerbuch · Karten', 0],
  ['wz-winde', TS + 'werkzeuge/winde/', 'paar', 'nacht', 'Die Winde · Anfragen', 0],
  ['wz-musterkammer', TS + 'werkzeuge/musterkammer/', 'laptop', 'creme', 'Die Musterkammer · Markenbuch', 0],
  ['wz-logbuch', TS + 'werkzeuge/logbuch/', 'laptop', 'nacht', 'Das Logbuch · Besucher', 0],
  ['wz-werkstatt', TS + 'werkzeuge/werkstatt/', 'laptop', 'schiefer', 'Die Werkstatt · Drucksachen', 0],
];
const WZ = '/Users/robertreff/Desktop/Apps & Tools/tasty-intern-fertig/';
const MONO = fs.readFileSync(WZ + 'grundlagen/marke/schriften/DMMono-normal-400.woff2').toString('base64'), ANTONIO = fs.readFileSync(WZ + 'grundlagen/marke/schriften/Antonio-normal-100_700.woff2').toString('base64'), ANKER = fs.readFileSync(WZ + 'zentrale/oberflaeche/kleid/anker-zeichen.svg').toString('base64');
const LJ = JSON.parse(fs.readFileSync(GER + 'laptop.json')), HJ = JSON.parse(fs.readFileSync(GER + 'handy.json'));

async function schirm(b, nur) {
  fs.mkdirSync(ROH, { recursive: true });
  for (const [name, url, art, , , y] of STUECKE) {
    if (nur && !nur.includes(name)) continue;
    for (const [w, h, end] of art === 'handy' ? [[390, 844, 'm']] : art === 'paar' ? [[1440, 932, 'd'], [390, 844, 'm']] : [[1440, 932, 'd']]) {
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: end === 'm', hasTouch: end === 'm' });
      try {
        await p.goto(url + (url.includes('?') ? '&' : '?') + 'gruss=tag&probe', { waitUntil: 'networkidle', timeout: 45000 });
        await p.waitForTimeout(3500);
        await p.evaluate(() => { document.documentElement.classList.remove('warte', 'sc-wartet'); document.querySelectorAll('.wo-leiste,.meldung,[class*="cookie"]').forEach(x => x.style.visibility = 'hidden'); });
        if (y) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(1500); }
        await p.screenshot({ path: path.join(ROH, `${name}-${end}.png`) });
        console.log('aufgenommen', name, end);
      } catch (e) { console.log('FEHLER', name, end, e.message.split('\n')[0]); }
      await p.close();
    }
  }
}

const GRUND = {
  nacht: 'radial-gradient(120% 80% at 50% 108%,rgba(201,163,118,.34),transparent 58%),radial-gradient(90% 60% at 50% 0%,rgba(61,68,110,.55),transparent 70%),linear-gradient(180deg,#1f213b,#111421)',
  schiefer: 'radial-gradient(120% 80% at 50% 105%,rgba(235,219,206,.22),transparent 60%),linear-gradient(170deg,#3a3f52,#1f212c)',
  creme: 'radial-gradient(110% 70% at 50% 100%,rgba(201,163,118,.38),transparent 62%),linear-gradient(175deg,#f5eee6,#e3d3c2)'
};
function seite(name, art, grund, zeile) {
  const hell = grund === 'creme', d = `file://${ROH}/${name}-d.png`, m = `file://${ROH}/${name}-m.png`;
  const lap = (breite, links, oben) => { const s = LJ.schirm, H0 = breite * LJ.groesse[1] / LJ.groesse[0];
    return `<div class="g" style="left:${links}px;top:${oben}px;width:${breite}px;height:${H0}px"><img class="s" src="${d}" style="left:${s[0] * 100}%;top:${s[1] * 100}%;width:${s[2] * 100}%;height:${s[3] * 100}%;border-radius:${breite * LJ.radius}px ${breite * LJ.radius}px 0 0"><img class="r" src="file://${GER}laptop.png"></div>`; };
  const han = (breite, links, oben, quelle) => { const s = HJ.schirm, H0 = breite * HJ.groesse[1] / HJ.groesse[0];
    return `<div class="g" style="left:${links}px;top:${oben}px;width:${breite}px;height:${H0}px"><img class="s" src="${quelle || m}" style="left:${s[0] * 100}%;top:${s[1] * 100}%;width:${s[2] * 100}%;height:${s[3] * 100}%;border-radius:${breite * s[2] * 0.12}px"><img class="r" src="file://${GER}handy.png"></div>`; };
  const innen = art === 'laptop' ? lap(1000, 40, 340) : art === 'paar' ? lap(900, 30, 380) + han(350, 690, 590) : han(560, 260, 300);
  const [titel, unter] = zeile.split(' · ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mono;src:url(data:font/woff2;base64,${MONO}) format('woff2')}
@font-face{font-family:Antonio;font-weight:100 700;src:url(data:font/woff2;base64,${ANTONIO}) format('woff2')}
html,body{margin:0;width:1080px;height:1350px;overflow:hidden}
body{position:relative;background:${GRUND[grund]}}
body::before{content:'';position:absolute;inset:0;background:linear-gradient(${hell ? 'rgba(17,20,33,.05)' : 'rgba(235,219,206,.05)'} 1px,transparent 1px) 0 0/60px 60px,linear-gradient(90deg,${hell ? 'rgba(17,20,33,.05)' : 'rgba(235,219,206,.05)'} 1px,transparent 1px) 0 0/60px 60px}
.g{position:absolute;filter:drop-shadow(0 50px 60px rgba(0,0,0,${hell ? '.28' : '.55'}))}
.g img{position:absolute}.g .r{inset:0;width:100%;height:100%}.g .s{object-fit:cover;object-position:top}
.z{position:absolute;left:64px;top:64px;display:flex;align-items:center;gap:16px;font:400 24px/1 Mono;letter-spacing:.16em;text-transform:uppercase;color:${hell ? '#6f6656' : '#c9a376'}}
.z i{width:30px;height:30px;background:currentColor;-webkit-mask:url(data:image/svg+xml;base64,${ANKER}) center/contain no-repeat}
.t{position:absolute;left:64px;top:128px;margin:0;white-space:nowrap;font:700 92px/1.08 Antonio;text-transform:uppercase;letter-spacing:.01em;color:${hell ? '#0b0c10' : '#fff'}}
.t em{font-style:normal;font-weight:300;color:${hell ? '#6f6656' : '#c9a376'}}
</style></head><body><div class="z"><i></i>Tasty Studios</div><h1 class="t">${titel} <em>${unter || ''}</em></h1>${innen}<script>const h=document.querySelector('.t');let s=92;while(h.scrollWidth>952&&s>50){s-=2;h.style.fontSize=s+'px'}</script></body></html>`;
}
async function bild(b, nur) {
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (const [name, , art, grund, zeile] of STUECKE) {
    if (nur && !nur.includes(name)) continue;
    const f = path.join(HIER, `_${name}.html`);
    fs.writeFileSync(f, seite(name, art, grund, zeile));
    await p.goto('file://' + f, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(HIER, `${name}.png`) });
    fs.unlinkSync(f);
    console.log('gebaut', name);
  }
  await p.close();
}
(async () => {
  const was = process.argv[2], nur = process.argv.slice(3);
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (was === 'schirm' || was === 'alles') await schirm(b, nur.length ? nur : null);
  if (was === 'bild' || was === 'alles') await bild(b, nur.length ? nur : null);
  await b.close();
})();
