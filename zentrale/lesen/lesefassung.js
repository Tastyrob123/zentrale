#!/usr/bin/env node
/* Lesefassung der ganzen Zentrale für KI (ChatGPT, Gemini …): Kopie von sales-cockpit-online/lesefassung.js (Sales Cockpit, 16.11.2026),
   erweitert auf alle Werkzeuge der Zentrale (Robert 17.11.2026: «pdf lesefassung für chatgpt von dem gesamten projekt mit allen unterseiten
   und den dokumenten wie verträgen und co»).
   Öffnet die laufende Zentrale (http://localhost:9150) in einem unsichtbaren Browser, geht in jedem Werkzeug jede Ansicht der Seitenleiste durch
   (bei «Kunden» jede Ansicht und jedes Haus), nimmt den Inhalt als reinen Text, dazu die Dokumente (Vertrag, Auftragsverarbeitung, Freigabe,
   Briefe an die Häuser, Präsentationen als Text) und schreibt:
     zentrale/lesen/index.html                         alles auf einer Seite, mit Inhaltsverzeichnis
     zentrale/lesen/Tasty-Studios-Zentrale-komplett.pdf dieselbe Fassung als PDF zum Hochladen
   Aufruf: node zentrale/lesen/lesefassung.js   (der Server der Zentrale muss laufen) */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');

const B = 'http://localhost:9150';
const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = __dirname;
const PDF = 'Tasty-Studios-Zentrale-komplett.pdf';
/* Reihenfolge wie die Gruppen der Zentrale (zentrale.js GRUPPEN) */
const WERKZEUGE = [
  ['Verkaufen', ['13-sales-cockpit', '02-kundenliste', '04-haus-check', '09-ki-check']],
  ['Nach aussen', ['14-social-cockpit', '14-social-cockpit/plan', '10-newsletter', '01-feinschliff']],
  ['Marke', ['11-markenbuch', '12-marke-vision']]];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const anker = s => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/* Im Browser: den sichtbaren Inhalt einer Ansicht in schlichtes HTML verwandeln (wie die Vorlage, Quelle = <main>) */
function saeubernImBrowser() {
  const quelle = document.querySelector('main') || document.body;
  const c = quelle.cloneNode(true);
  c.querySelectorAll('script,style,svg,canvas,video,audio,iframe,noscript,input,textarea,select,[aria-hidden="true"],.sc-live,.sc-vorne').forEach(e => e.remove());
  c.querySelectorAll('img').forEach(i => { const alt = (i.getAttribute('alt') || '').trim(); if (alt) i.replaceWith(document.createTextNode(' [Bild: ' + alt + '] ')); else i.remove(); });
  c.querySelectorAll('button,label,summary').forEach(b => { const s = document.createElement(b.tagName === 'SUMMARY' ? 'p' : 'span'); s.innerHTML = b.innerHTML; b.replaceWith(s); });
  c.querySelectorAll('*').forEach(e => {
    const href = e.tagName === 'A' ? e.getAttribute('href') : null;
    [...e.attributes].forEach(a => e.removeAttribute(a.name));
    if (href && !/^#/.test(href)) { try { e.setAttribute('href', new URL(href, location.href).href); } catch (x) { /* */ } }
  });
  for (let runde = 0; runde < 6; runde++) c.querySelectorAll('div,span,p,li,ul,ol,section,article,a,strong,em,b,i,small,h1,h2,h3,h4,h5,h6,dl,dt,dd,figure,figcaption,details,header,footer,nav,aside').forEach(e => { if (!e.textContent.trim()) e.remove(); });
  for (let runde = 0; runde < 4; runde++) c.querySelectorAll('span').forEach(s => { if (!s.querySelector('div,p,ul,ol,h1,h2,h3,h4,h5,h6,section')) s.replaceWith(' ', ...s.childNodes, ' '); });   // Leerzeichen, sonst kleben Knöpfe und Angaben zusammen («Entwurf ansehenNotiz»)
  c.querySelectorAll('b,strong,em,small,a,dt,dd').forEach(e => { e.before(' '); e.after(' '); });
  return c.innerHTML.replace(/\n\s*\n+/g, '\n').replace(/>\s+</g, '>\n<');
}
/* Einträge der Seitenleiste, die im Werkzeug bleiben (keine Wege nach aussen, kein Klapp-Knopf) */
function eintraege() {
  return [...document.querySelectorAll('.wo-rand :is(button,a)')].filter(e => !e.closest('.wo-rand__wege') && !e.matches('[data-st-rand-kn],[data-rand-kn]'));
}

function seite(titel, inhalt) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titel)}</title>
<style>body{font:15px/1.55 -apple-system,system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px 80px;color:#111;background:#fff;overflow-wrap:anywhere}
h1{font-size:30px;line-height:1.15}h2{font-size:24px;margin-top:48px;border-top:1px solid #ddd;padding-top:24px}h3{font-size:19px}h4,h5,h6{font-size:16px}a{color:#1f213b}
.werkzeug{break-before:page}.werkzeug>h2{font-size:28px;border-top:3px solid #1f213b}.ansicht{margin-top:40px}.ansicht>h3{font-size:21px;border-bottom:1px solid #ddd;padding-bottom:6px}
.hinweis{background:#f4f1ec;padding:12px 16px;border-radius:8px}pre{white-space:pre-wrap;font:13px/1.5 ui-monospace,monospace;background:#faf8f5;padding:12px;border-radius:6px}
table{display:block;max-width:100%;overflow-x:auto}</style></head>
<body>
${inhalt}
</body></html>
`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(page.url() + ': ' + String(e)));
  const hole = async (url, warten = 1800) => { await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(warten); await page.evaluate(() => scrollTo(0, 0)); return page.evaluate(saeubernImBrowser); };

  /* Zentrale: der Empfang */
  const zentrale = await hole(B + '/', 2500);

  /* Werkzeuge */
  const teile = [];
  for (const [gruppe, ordner] of WERKZEUGE) {
    for (const w of ordner) {
      /* ?einzeln: ohne den Zusatz leitet jedes Werkzeug auf die Zentrale um (dann fehlten alle Ansichten, 17.11.2026) */
      const start = B + '/zentrale/werkzeuge/' + w + '/?einzeln';
      let name = w;
      try { name = JSON.parse(fs.readFileSync(path.join(WURZEL, 'werkzeuge', w.split('/')[0], 'werkzeug.json'), 'utf8')).name || w; } catch (e) { /* */ }
      if (w.endsWith('/plan')) name += ' · Plan';
      /* Jeden Eintrag der Seitenleiste anklicken und den Inhalt gleich mitnehmen (17.11.2026): «Kunden» wechselt die Ansicht ohne Adresse,
         das Sales Cockpit über #…; so kommen beide vollständig hinein. Gleicher Inhalt zweimal (Doppel-Einträge in der Leiste) zählt einmal. */
      const stuecke = [], gesehen = new Set();
      const nimm = async (t) => { await page.waitForTimeout(900); await page.evaluate(() => scrollTo(0, 0));
        if (/^Alle Häuser/.test(t)) { const h = await page.evaluate(() => ((document.querySelector('main h1') || {}).innerText || '').replace(/\s+/g, ' ').trim()); if (h) t = t + ' · ' + h; } const html = await page.evaluate(saeubernImBrowser);
        const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), k = text.length + '|' + text.slice(0, 400);
        if (gesehen.has(k)) return; gesehen.add(k); if (text.length < 80) fehler.push('Ansicht fast leer: ' + name + ' · ' + t); stuecke.push({ u: page.url(), i: stuecke.length, t, html }); };
      await page.goto(start, { waitUntil: 'load' }); await page.waitForTimeout(2500);
      await nimm('Start');
      const n = await page.evaluate(() => [...document.querySelectorAll('.wo-rand :is(button,a)')].filter(e => !e.closest('.wo-rand__wege') && !e.matches('[data-st-rand-kn],[data-rand-kn]')).length);
      for (let i = 0; i < n; i++) {
        if (!page.url().startsWith(start)) { await page.goto(start, { waitUntil: 'load' }); await page.waitForTimeout(2000); }
        const t = await page.evaluate(i => { const l = [...document.querySelectorAll('.wo-rand :is(button,a)')].filter(e => !e.closest('.wo-rand__wege') && !e.matches('[data-st-rand-kn],[data-rand-kn]')); const e = l[i]; if (!e) return null;
          const href = e.getAttribute('href'); if (href && !/^[#?]/.test(href)) return null; const t = e.textContent.trim().replace(/\s+/g, ' ').replace(/\s*\d+$/, ''); e.click(); return t; }, i).catch(() => null);
        if (t === null) continue;
        await nimm(t);
      }
      teile.push({ gruppe, w, name, start, stuecke });
      console.error(name + ': ' + stuecke.length + ' Ansichten');
    }
  }

  /* Dokumente */
  const dokumente = [];
  const htmlText = async url => { await page.goto(url); await page.waitForTimeout(500);
    return page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script,style,svg,img').forEach(e => e.remove());
      [...c.querySelectorAll('*')].forEach(e => [...e.attributes].forEach(x => { if (x.name !== 'href') e.removeAttribute(x.name); }));
      return c.innerHTML.replace(/\n\s*\n+/g, '\n'); }); };
  const SC = 'werkzeuge/13-sales-cockpit/';
  for (const [n, t] of [['start/vertrag.html', 'Vertrag Anna Llorens (Entwurf)'], ['start/auftragsverarbeitung.html', 'Auftragsverarbeitung Anna Llorens (Entwurf)'], ['start/freigabe-name-bild.html', 'Freigabe Name und Bild Anna Llorens (Entwurf)']])
    if (fs.existsSync(path.join(WURZEL, SC, n))) dokumente.push({ art: 'Unser Start', titel: t, url: B + '/' + SC + n, html: await htmlText(B + '/' + SC + n) });
  for (const n of fs.readdirSync(path.join(WURZEL, SC, 'brief')).filter(x => x.endsWith('.html') && x !== 'vorlage.html').sort()) {
    const url = B + '/' + SC + 'brief/' + n; const html = await htmlText(url);
    dokumente.push({ art: 'Brief an das Haus', titel: (await page.title()) || n, url, html });
  }
  for (const n of fs.readdirSync(path.join(WURZEL, SC, 'heft', 'pdf')).filter(x => x.endsWith('.pdf')).sort()) {
    let text = ''; try { text = execFileSync('/opt/homebrew/bin/pdftotext', ['-layout', path.join(WURZEL, SC, 'heft', 'pdf', n), '-'], { encoding: 'utf8' }); } catch (e) { fehler.push('PDF nicht lesbar: ' + n); }
    dokumente.push({ art: 'Präsentation', titel: n.replace(/\.pdf$/, '').replace(/_/g, ' · ').replace(/-/g, ' '), url: B + '/' + SC + 'heft/pdf/' + n, html: '<pre>' + esc(text.replace(/\f/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()) + '</pre>' });
  }

  /* Zusammensetzen */
  const zaehl = teile.reduce((a, t) => a + t.stuecke.length, 0);
  const verzeichnis = teile.map(t => `<li><a href="#${anker(t.w)}">${esc(t.name)}</a> (${t.stuecke.length} Ansichten)<ol>${t.stuecke.map(s => `<li><a href="#${anker(t.w + '-' + s.i)}">${esc(s.t)}</a></li>`).join('')}</ol></li>`).join('\n');
  const dokListe = dokumente.map((d, i) => `<li>${esc(d.art)}: <a href="#dok-${i}">${esc(d.titel)}</a></li>`).join('\n');
  const gesamt = `<h1>Zentrale · Tasty Studios</h1>
<p class="hinweis">Lesefassung der internen Zentrale von Tasty Studios: derselbe Inhalt wie in der Zentrale und ihren Werkzeugen (lokal unter ${B}/), als reiner Text, damit ihn jedes Programm vollständig lesen kann. Enthalten sind alle Werkzeuge mit jeder Ansicht ihrer Seitenleiste (${teile.length} Werkzeuge, ${zaehl} Ansichten), dazu ${dokumente.length} Dokumente: Vertrag, Auftragsverarbeitung und Freigabe für Anna, die Briefe an die Häuser und die Präsentationen je Haus und Familie. Bilder stehen als [Bild: Beschreibung]. Stand: ${new Date().toLocaleDateString('de-CH')}.</p>
<h2>Inhalt</h2>
<ol>
<li><a href="#zentrale">Zentrale (Empfang)</a></li>
${verzeichnis}
<li><a href="#dokumente">Dokumente</a><ul>${dokListe}</ul></li>
</ol>
<section class="werkzeug" id="zentrale"><h2>Zentrale (Empfang)</h2>${zentrale}</section>
${teile.map(t => `<section class="werkzeug" id="${anker(t.w)}">
<h2>${esc(t.name)}</h2>
<p>Bereich «${esc(t.gruppe)}» · ${esc(t.start)}</p>
${t.stuecke.map(s => `<section class="ansicht" id="${anker(t.w + '-' + s.i)}">\n<h3>${esc(t.name)} · ${esc(s.t)}</h3>\n<p>${esc(s.u)}</p>\n${s.html}\n</section>`).join('\n')}
</section>`).join('\n')}
<section class="werkzeug" id="dokumente"><h2>Dokumente</h2>
${dokumente.map((d, i) => `<section class="ansicht" id="dok-${i}">\n<h3>${esc(d.art)}: ${esc(d.titel)}</h3>\n<p>${esc(d.url)}</p>\n${d.html}\n</section>`).join('\n')}
</section>`;
  fs.writeFileSync(path.join(ZIEL, 'index.html'), seite('Zentrale · Tasty Studios · Lesefassung', gesamt));

  await page.goto(B + '/zentrale/zentrale/lesen/');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(ZIEL, PDF), format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">Zentrale · Tasty Studios · Lesefassung · Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>' });
  await browser.close();
  const kb = Math.round(fs.statSync(path.join(ZIEL, PDF)).size / 1024);
  console.log(`Lesefassung: ${teile.length} Werkzeuge, ${zaehl} Ansichten, ${dokumente.length} Dokumente, PDF ${kb} KB` + (fehler.length ? '\nHINWEISE:\n' + fehler.join('\n') : ''));
})().catch(e => { console.error(e); process.exit(1); });
