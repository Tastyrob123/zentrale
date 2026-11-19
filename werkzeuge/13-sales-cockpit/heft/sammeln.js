// Sammelt je Haus von der Mac-Fassung der Website: Startseite am Rechner und am Handy, Menüpunkte, Fotos aller Seiten.
// Aufruf: python3 haeuser_liste.py > /tmp/l.json; node sammeln.js /tmp/l.json [id …]  → _quelle/<id>/{rechner.jpg,handy.jpg,seite.json}
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const liste = JSON.parse(fs.readFileSync(process.argv[2])), nur = process.argv.slice(3);
const warte = ms => new Promise(r => setTimeout(r, ms));

async function bilderDerSeite(p) {
  // ganz durchscrollen, damit nachgeladene Bilder kommen
  await p.evaluate(async () => { const h = () => document.documentElement.scrollHeight; for (let y = 0; y < h(); y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
  await warte(500);
  return p.evaluate(() => {
    const aus = [];
    document.querySelectorAll('img').forEach(i => { const u = i.currentSrc || i.src; if (u && i.naturalWidth) aus.push({ u, b: i.naturalWidth, h: i.naturalHeight }); });
    document.querySelectorAll('*').forEach(e => { const bg = getComputedStyle(e).backgroundImage; if (bg && bg.startsWith('url(')) { const m = bg.match(/url\("?([^")]+)"?\)/); if (m) aus.push({ u: new URL(m[1], location.href).href, b: 0, h: 0 }); } });
    const srcset = []; document.querySelectorAll('img[srcset],source[srcset]').forEach(s => s.srcset.split(',').forEach(x => { const t = x.trim().split(/\s+/); if (t[0]) srcset.push({ u: new URL(t[0], location.href).href, w: parseInt(t[1]) || 0 }); }));
    return { bilder: aus, srcset, h1: (document.querySelector('h1') || {}).innerText || '', titel: document.title };
  });
}

(async () => {
  const br = await chromium.launch();
  for (const h of liste) {
    if (nur.length && !nur.includes(h.id)) continue;
    const ziel = path.join(__dirname, '_quelle', h.id); fs.mkdirSync(ziel, { recursive: true });
    const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    try { await p.goto(h.url, { waitUntil: 'load', timeout: 45000 }); } catch (e) { console.log('FEHLER', h.id, e.message.slice(0, 80)); await ctx.close(); continue; }
    await warte(3500);
    await p.screenshot({ path: path.join(ziel, 'rechner.jpg'), type: 'jpeg', quality: 90 });
    const start = await bilderDerSeite(p);
    const menue = await p.evaluate(() => {
      const ich = new URL(location.href); const seen = new Set(), aus = [];
      const kand = [...document.querySelectorAll('header a, nav a, .nav a, [class*=menu] a, [class*=Menu] a')];
      for (const a of kand) {
        const t = (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim(); if (!t || t.length > 24 || t.length < 2) continue;
        let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { continue; }
        if (u.origin !== ich.origin || u.hash && u.pathname === ich.pathname) continue;
        const k = u.pathname.replace(/index\.html$/, ''); if (seen.has(k) || k === ich.pathname.replace(/index\.html$/, '')) continue;
        if (/agb|datenschutz|impressum|werkbank|_werkzeuge|studio|maison/i.test(k)) continue;
        seen.add(k); aus.push({ t, u: u.href });
      }
      return aus.slice(0, 10);
    });
    const seiten = [];
    for (const m of menue) {
      try { await p.goto(m.u, { waitUntil: 'load', timeout: 30000 }); await warte(1200); const s = await bilderDerSeite(p); seiten.push({ ...m, h1: s.h1, titel: s.titel, bilder: s.bilder, srcset: s.srcset }); }
      catch (e) { seiten.push({ ...m, fehler: e.message.slice(0, 60) }); }
    }
    await ctx.close();
    const hc = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const hp = await hc.newPage();
    try { await hp.goto(h.url, { waitUntil: 'load', timeout: 45000 }); await warte(3500); await hp.screenshot({ path: path.join(ziel, 'handy.jpg'), type: 'jpeg', quality: 88 }); } catch (e) { console.log('HANDY', h.id, e.message.slice(0, 60)); }
    await hc.close();
    fs.writeFileSync(path.join(ziel, 'seite.json'), JSON.stringify({ url: h.url, start, menue: seiten }, null, 1));
    console.log(h.id, 'menü', seiten.map(s => s.t).join(' | '));
  }
  await br.close();
})();
