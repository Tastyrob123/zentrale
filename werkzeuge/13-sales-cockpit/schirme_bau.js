// Bildschirme der eigenen Werkzeuge je Haus (Robert 11.11.2026: «für alle Hotels … die Werkzeuge schon spezifisch für das Hotel entwickelt. Warum sollten wir da was anderes anzeigen?»)
// Adressen: Links der Werkbank je Haus, dazu die in «Kunden» eingetragenen. Ergebnis: werkzeuge/13-sales-cockpit/schirme/<haus>-<k>.webp + schirme.json
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ZIEL = '/Users/robertreff/Desktop/Apps & Tools/tasty-intern-fertig/werkzeuge/13-sales-cockpit/schirme';
const KS = ['maison', 'bureau', 'carte', 'reception', 'livre', 'registre', 'imprimerie'];
const WB = JSON.parse(fs.readFileSync(__dirname + '/wb_links.json', 'utf8')), DATEN = JSON.parse(fs.readFileSync(__dirname + '/wz_liste.json', 'utf8'));
const EXTRA = { saltandsilver: { maison: 'https://saltandsilver.tastystudios.ch/hafen/', carte: 'https://saltandsilver.tastystudios.ch/hafen/karte/', imprimerie: 'https://saltandsilver.tastystudios.ch/hafen/druckerei/' } };
const karte = {};
for (const h of DATEN) {
  if (h.id === 'angelina') continue;   // eigene Werkzeuge mit anderen Namen, bleiben wie bisher
  const m = {};
  for (const [k, , u] of h.wz) if (u && u !== 'BEISPIEL') m[k] = u;
  const links = Array.isArray(WB[h.id]) ? WB[h.id].map(x => x[0]) : [];
  for (const k of KS) {
    const u = links.find(l => new RegExp('/_?werkzeuge/' + k + '/(\\?gruss=tag)?$').test(l.replace(/[?&](wb|wy)=[^&]*/g, '').replace(/\?$/, '')));
    if (u) m[k] = u.replace(/[?&](wb|wy)=[^&]*/g, '').replace(/\?$/, '').replace(/\?&/, '?');
  }
  Object.assign(m, EXTRA[h.id] || {});
  if (Object.keys(m).length) karte[h.id] = m;
}
(async () => {
  fs.mkdirSync(ZIEL, { recursive: true });
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 932 }, deviceScaleFactor: 1 })).newPage();
  const aus = {};
  for (const [id, m] of Object.entries(karte)) {
    aus[id] = {};
    for (const [k, u] of Object.entries(m)) {
      try {
        const r = await p.goto(u, { waitUntil: 'load', timeout: 30000 });
        if (!r || r.status() >= 400) { console.log('✗', id, k, r && r.status(), u); continue; }
        await p.waitForTimeout(3500);
        const png = path.join(ZIEL, `${id}-${k}.png`), webp = png.replace(/\.png$/, '.webp');
        await p.screenshot({ path: png });
        execFileSync('python3', ['-c', `from PIL import Image; Image.open(${JSON.stringify(png)}).convert('RGB').save(${JSON.stringify(webp)}, quality=82, method=6)`]);
        fs.unlinkSync(png);
        aus[id][k] = { url: u, bild: `schirme/${id}-${k}.webp`, titel: await p.title() };
        console.log('✓', id, k, await p.title());
      } catch (e) { console.log('✗', id, k, e.message.slice(0, 80)); }
    }
  }
  fs.writeFileSync(path.join(path.dirname(ZIEL), 'schirme.json'), JSON.stringify(aus, null, 1));
  console.log('fertig'); await b.close();
})();
