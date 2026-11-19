// Blender-Geräte für die Hefte (Vorlage: Uncle Hung praesi/geraete.js). Gehäuse aus der Carlton-Werkbank, nur gelesen.
// Aufruf: node geraete.js auftrag.json   (Liste von {aus, rechner, handy?, breite?} → PNG mit Transparenz)
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const GER = path.join(process.env.HOME, 'Desktop/Website-Projekte/Carlton-Europe Interlaken/_werkbank/geraet');
const LJ = JSON.parse(fs.readFileSync(path.join(GER, 'laptop.json'))), HJ = JSON.parse(fs.readFileSync(path.join(GER, 'handy.json')));
const url = u => 'file://' + u.split('/').map(encodeURIComponent).join('/');
const [lx, ly, lb, lh] = LJ.schirm.map(v => v * 100), [hx, hy, hb, hh] = HJ.schirm.map(v => v * 100);
const kopf = (b, h) => `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:transparent}
.o{position:relative;width:${b}px;height:${h}px;overflow:hidden}.o>*{position:absolute}
.lap,.han{filter:drop-shadow(0 26px 24px rgba(0,0,0,.42))}
.lap{aspect-ratio:${LJ.groesse[0]}/${LJ.groesse[1]}}.han{aspect-ratio:${HJ.groesse[0]}/${HJ.groesse[1]}}
.s{position:absolute;overflow:hidden;background:#0b0d16}.han .s{border-radius:4.5% / 2.1%}
.s img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block}
.g{position:absolute;inset:0;width:100%;height:100%}
</style><div class="o" id="o">`;
const lap = (bild, stil) => `<div class="lap" style="${stil}"><div class="s" style="left:${lx}%;top:${ly}%;width:${lb}%;height:${lh}%"><img src="${url(bild)}"></div><img class="g" src="${url(path.join(GER, 'laptop.png'))}"></div>`;
const han = (bild, stil) => `<div class="han" style="${stil}"><div class="s" style="left:${hx}%;top:${hy}%;width:${hb}%;height:${hh}%"><img src="${url(bild)}"></div><img class="g" src="${url(path.join(GER, 'handy.png'))}"></div>`;

(async () => {
  const auftrag = JSON.parse(fs.readFileSync(process.argv[2]));
  const br = await chromium.launch();
  for (const a of auftrag) {
    const mitHandy = !!a.handy;
    const b = mitHandy ? 1160 : 960, h = 860;
    const html = kopf(b, h) + lap(a.rechner, mitHandy ? 'left:40px;top:20px;width:860px' : 'left:40px;top:20px;width:880px') + (mitHandy ? han(a.handy, 'right:40px;top:200px;height:580px') : '') + '</div>';
    const f = path.join(path.dirname(a.aus), '_g.html'); fs.mkdirSync(path.dirname(a.aus), { recursive: true }); fs.writeFileSync(f, html);
    const ctx = await br.newContext({ viewport: { width: b, height: h }, deviceScaleFactor: a.dpr || 1 });
    const p = await ctx.newPage(); await p.goto(url(f), { waitUntil: 'load' });
    await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => 0))));
    await (await p.$('#o')).screenshot({ path: a.aus, omitBackground: true });
    await ctx.close(); fs.unlinkSync(f);
  }
  await br.close();
  console.log('geräte', auftrag.length);
})();
