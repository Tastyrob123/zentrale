// Prüft jedes Heft: nichts ragt in die Fusszeile, nichts über den Seitenrand, kein Text läuft über. Aufruf: node pruefen.js
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
(async () => {
  const dirs = fs.readdirSync(__dirname).filter(d => fs.existsSync(path.join(__dirname, d, 'heft.html')));
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1123, height: 794 } })).newPage();
  let fehler = 0;
  for (const d of dirs) {
    await p.goto('file://' + path.join(__dirname, d, 'heft.html').split('/').map(encodeURIComponent).join('/'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('section.seite').forEach((s, i) => {
        const sr = s.getBoundingClientRect(), f = s.querySelector('.fuss'), fr = f && f.getBoundingClientRect();
        s.querySelectorAll('*').forEach(e => {
          if (f && (e === f || f.contains(e))) return;
          if (e.closest('.streifen,.tal,.bilder,.foto') && e.tagName === 'IMG') return;
          const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const er = e.getBoundingClientRect(); if (!er.width || !er.height) return;
          const eigenText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          const flaeche = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && er.height < sr.height * .9;
          if (!eigenText && !flaeche && !['IMG', 'svg'].includes(e.tagName)) return;
          const t = (e.className || e.tagName) + ' «' + (e.innerText || '').slice(0, 30).replace(/\s+/g, ' ') + '»';
          if (er.right > sr.right + 1 || er.bottom > sr.bottom + 1 || er.left < sr.left - 1) out.push(`S${i + 1} über den Rand: ${t}`);
          else if (fr && er.bottom > fr.top - 2 && er.top < fr.top && !e.contains(f) && !e.closest('.streifen,.tal,.bilder,.foto,.titel')) out.push(`S${i + 1} in der Fusszeile: ${t}`);
          if ((e.scrollWidth > e.clientWidth + 2 && cs.overflow !== 'visible' && e.clientWidth > 0 && !['IMG'].includes(e.tagName))) out.push(`S${i + 1} läuft quer über: ${t}`);
        });
      });
      return [...new Set(out)];
    });
    if (r.length) { fehler += r.length; console.log('✗', d); r.slice(0, 12).forEach(x => console.log('   ', x)); } else console.log('✓', d);
  }
  await b.close(); console.log(fehler ? 'DURCHGEFALLEN ' + fehler : 'BESTANDEN');
})();
