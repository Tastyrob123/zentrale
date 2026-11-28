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

/* Seit 22.11.2026: Quelle ist der Server (die Wahrheit seit dem Umzug 19.11.), erreicht über den Schlüssel-Link; Speichern ist im Lauf gesperrt
   (jeder Aufruf ausser Lesen wird abgebrochen). ZENTRALE=mac nimmt die ältere Mac-Zentrale (:9150). */
const LINK = fs.readFileSync('/Users/robertreff/Desktop/Apps & Tools/zentrale-tor/link.txt', 'utf8').trim();
const B = process.env.ZENTRALE === 'mac' ? 'http://localhost:9150' : new URL(LINK).origin;
const SSH = ['-i', '/Users/robertreff/.ssh/zentrale_server', '-o', 'BatchMode=yes', 'root@31.70.192.57'];
const SRV = '/srv/zentrale/tasty-intern-fertig/';
const ls = (rel) => { try { return process.env.ZENTRALE === 'mac' ? fs.readdirSync(path.join(WURZEL, rel)) : execFileSync('ssh', SSH.concat(['ls ' + JSON.stringify(SRV + rel)]), { encoding: 'utf8' }).split('\n').filter(Boolean); } catch (e) { return []; } };
const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = __dirname;
const PDF = 'Tasty-Studios-Zentrale-komplett.pdf';
/* Reihenfolge wie die Gruppen der Zentrale (zentrale.js GRUPPEN) */
const WERKZEUGE = [
  ['Verkaufen', ['13-sales-cockpit', '02-kundenliste', '03-entwurf-besuche', '05-angebot', '07-kunden-uebersicht', '04-haus-check', '09-ki-check']],
  ['Nach aussen', ['14-social-cockpit', '14-social-cockpit/plan', '08-beitraege', '10-newsletter', '01-feinschliff']],
  ['Marke', ['11-markenbuch', '12-marke-vision', '15-drucksachen']]];
/* Unterseiten je Werkzeug (Anleitungen, Werkstatt, Check …); Prüfseiten, Briefings für Bau-Chats und Abmelde-Seiten bleiben draussen */
const UNTERSEITEN = { '09-ki-check': ['check.html'], '11-markenbuch': ['werkstatt.html'], '14-social-cockpit': ['plan/impuls.html'], '08-beitraege': ['vorschau.html'] };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const anker = s => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/* Im Browser: den sichtbaren Inhalt einer Ansicht in schlichtes HTML verwandeln (wie die Vorlage, Quelle = <main>) */
function saeubernImBrowser() {
  const quelle = document.querySelector('main') || document.body;
  /* nur Sichtbares (22.11.2026): versteckte Hinweise wie «… startet nicht» und verborgene Ansichten bleiben draussen */
  quelle.querySelectorAll('*').forEach(e => { if (e.checkVisibility && !e.checkVisibility() && !e.closest('[data-lf-weg]')) e.setAttribute('data-lf-weg', ''); });
  const c = quelle.cloneNode(true);
  quelle.querySelectorAll('[data-lf-weg]').forEach(e => e.removeAttribute('data-lf-weg'));
  c.querySelectorAll('[data-lf-weg]').forEach(e => e.remove());
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
  const gesperrt = [];
  await ctx.route('**/*', r => { const m = r.request().method(); if (m !== 'GET' && m !== 'HEAD') { gesperrt.push(m + ' ' + r.request().url().replace(/k=[^&]+/, 'k=…')); return r.abort(); } return r.continue(); });
  const page = await ctx.newPage();
  const fehler = [];
  if (process.env.ZENTRALE !== 'mac') { await page.goto(LINK, { waitUntil: 'load' }); await page.waitForTimeout(1500); }
  /* Werkzeug-Namen vom Server */
  let LISTE = []; try { LISTE = await page.evaluate(async () => (await fetch('/zentrale/api/werkzeuge')).json()); } catch (e) { /* */ }
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
      const eintrag = LISTE.find(x => x.ordner === w.split('/')[0]); if (eintrag) name = eintrag.name; else try { name = JSON.parse(fs.readFileSync(path.join(WURZEL, 'werkzeuge', w.split('/')[0], 'werkzeug.json'), 'utf8')).name || w; } catch (e) { /* */ }
      const kurz = eintrag ? eintrag.kurz || '' : '';
      if (w.endsWith('/plan')) name += ' · Plan';
      /* Jeden Eintrag der Seitenleiste anklicken und den Inhalt gleich mitnehmen (17.11.2026): «Kunden» wechselt die Ansicht ohne Adresse,
         das Sales Cockpit über #…; so kommen beide vollständig hinein. Gleicher Inhalt zweimal (Doppel-Einträge in der Leiste) zählt einmal. */
      const stuecke = [], gesehen = new Set();
      const nimm = async (t) => { await page.waitForTimeout(900);
        /* Bricht ein Abruf über die Leitung zum Server ab, zeigt das Werkzeug «startet nicht» / «liessen sich nicht laden»: neu laden, bis zu vier Mal */
        const kaputt = () => page.evaluate(() => /startet nicht|liessen sich nicht laden|liess sich nicht laden/.test(document.body.innerText)).catch(() => false);
        for (let v = 1; v <= 4 && await kaputt(); v++) { await page.waitForTimeout(3000 * v); await page.reload({ waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(2500); }
        if (await kaputt()) fehler.push('Ansicht lädt nicht: ' + name + ' · ' + t);
        /* alles Aufklappbare im Inhalt öffnen (Speichern ist gesperrt): <details> und Knöpfe mit aria-expanded="false" */
        const vorher = page.url();
        await page.evaluate(() => { document.querySelectorAll('main details').forEach(d => { d.open = true; });
          [...document.querySelectorAll('main button[aria-expanded="false"]')].filter(b => !b.closest('.wo-rand')).slice(0, 60).forEach(b => { try { b.click(); } catch (e) { /* */ } }); }).catch(() => {});
        await page.waitForTimeout(700);
        if (page.url() !== vorher) { await page.goto(vorher, { waitUntil: 'load' }); await page.waitForTimeout(1500); }
        await page.evaluate(() => scrollTo(0, 0));
        if (/^Alle Häuser/.test(t)) { const h = await page.evaluate(() => (([...document.querySelectorAll('main h1')].find(e => e.checkVisibility()) || {}).innerText || '').replace(/\s+/g, ' ').trim()); if (h) t = t + ' · ' + h; } const html = await page.evaluate(saeubernImBrowser);
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
      for (const u of ['anleitung.html'].concat(UNTERSEITEN[w] || [])) {
        if (w.endsWith('/plan')) break;
        const url = B + '/zentrale/werkzeuge/' + w + '/' + u;
        const r = await page.goto(url, { waitUntil: 'load' }).catch(() => null); if (!r || r.status() >= 400) continue;
        await page.waitForTimeout(1500); await nimm(u === 'anleitung.html' ? 'Anleitung' : (await page.title()) || u);
      }
      teile.push({ gruppe, w, name, kurz, start, stuecke });
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
    if (ls(SC + 'start').includes(n.split('/')[1])) dokumente.push({ art: 'Unser Start', titel: t, url: B + '/' + SC + n, html: await htmlText(B + '/' + SC + n) });
  if (ls(SC + 'vertrag-haus').includes('vorlage.html')) dokumente.push({ art: 'Vertrag mit den Häusern', titel: 'Vertrag Haus (Erster Entwurf, offene Punkte grau)', url: B + '/' + SC + 'vertrag-haus/vorlage.html', html: await htmlText(B + '/' + SC + 'vertrag-haus/vorlage.html') });
  for (const n of ls(SC + 'brief').filter(x => x.endsWith('.html') && x !== 'vorlage.html').sort()) {
    const url = B + '/' + SC + 'brief/' + n; const html = await htmlText(url);
    dokumente.push({ art: 'Brief an das Haus', titel: (await page.title()) || n, url, html });
  }
  for (const n of ls(SC + 'heft/pdf').filter(x => x.endsWith('.pdf')).sort()) {
    let text = ''; try { const roh = await page.request.get(B + '/' + SC + 'heft/pdf/' + encodeURIComponent(n)); const tmp = path.join(require('os').tmpdir(), 'lesefassung-' + n); fs.writeFileSync(tmp, await roh.body());
      text = execFileSync('/opt/homebrew/bin/pdftotext', ['-layout', tmp, '-'], { encoding: 'utf8' }); fs.unlinkSync(tmp); } catch (e) { fehler.push('PDF nicht lesbar: ' + n); }
    dokumente.push({ art: 'Präsentation', titel: n.replace(/\.pdf$/, '').replace(/_/g, ' · ').replace(/-/g, ' '), url: B + '/' + SC + 'heft/pdf/' + n, html: '<pre>' + esc(text.replace(/\f/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()) + '</pre>' });
  }

  /* Rundgang: die Erklärungen aus der Rundführung (fuehrung.js), je Station Titel und Text, geordnet nach Kapitel */
  const fq = fs.readFileSync(path.join(WURZEL, 'zentrale', 'fuehrung.js'), 'utf8');
  const stationen = []; const re = /kap:\s*'([^']*)'[\s\S]*?titel:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?text:\s*'((?:[^'\\]|\\.)*)'/g; let mm;
  while ((mm = re.exec(fq))) stationen.push({ kap: mm[1], titel: mm[2].replace(/\\'/g, "'"), text: mm[3].replace(/\\'/g, "'") });
  let rundgang = '', kapAlt = '';
  stationen.forEach(st => { if (st.kap !== kapAlt) { rundgang += `<h3>${esc(st.kap)}</h3>`; kapAlt = st.kap; } rundgang += `<p><strong>${esc(st.titel)}.</strong> ${esc(st.text)}</p>`; });

  /* Zusammensetzen */
  const zaehl = teile.reduce((a, t) => a + t.stuecke.length, 0);
  const verzeichnis = teile.map(t => `<li><a href="#${anker(t.w)}">${esc(t.name)}</a> (${t.stuecke.length} Ansichten)<ol>${t.stuecke.map(s => `<li><a href="#${anker(t.w + '-' + s.i)}">${esc(s.t)}</a></li>`).join('')}</ol></li>`).join('\n');
  const dokListe = dokumente.map((d, i) => `<li>${esc(d.art)}: <a href="#dok-${i}">${esc(d.titel)}</a></li>`).join('\n');
  const gesamt = `<h1>Zentrale · Tasty Studios</h1>
<p class="hinweis">Lesefassung der internen Zentrale von Tasty Studios: derselbe Inhalt wie in der Zentrale und ihren Werkzeugen (Stand des Servers, auf dem Robert und Anna arbeiten), als reiner Text, damit ihn jedes Programm vollständig lesen kann. Enthalten sind die Erklärungen des Rundgangs, alle Werkzeuge mit jeder Ansicht ihrer Seitenleiste, aufgeklappt, und ihren Anleitungen (${teile.length} Werkzeuge, ${zaehl} Ansichten), dazu ${dokumente.length} Dokumente: Vertrag, Auftragsverarbeitung und Freigabe für Anna, die Briefe an die Häuser und die Präsentationen je Haus und Familie. Bilder stehen als [Bild: Beschreibung]. Stand: ${new Date().toLocaleDateString('de-CH')}.</p>
<h2>Inhalt</h2>
<ol>
<li><a href="#rundgang">So funktioniert die Zentrale (Rundgang)</a></li>
<li><a href="#zentrale">Zentrale (Empfang)</a></li>
${verzeichnis}
<li><a href="#dokumente">Dokumente</a><ul>${dokListe}</ul></li>
</ol>
<section class="werkzeug" id="rundgang"><h2>So funktioniert die Zentrale (Rundgang)</h2><p>Die Erklärungen der Rundführung durch die Zentrale, Station für Station.</p>${rundgang}</section>
<section class="werkzeug" id="zentrale"><h2>Zentrale (Empfang)</h2>${zentrale}</section>
${teile.map(t => `<section class="werkzeug" id="${anker(t.w)}">
<h2>${esc(t.name)}</h2>
<p>Bereich «${esc(t.gruppe)}»${t.kurz ? ' · ' + esc(t.kurz) : ''}</p>
${t.stuecke.map(s => `<section class="ansicht" id="${anker(t.w + '-' + s.i)}">\n<h3>${esc(t.name)} · ${esc(s.t)}</h3>\n<p>${esc(s.u)}</p>\n${s.html}\n</section>`).join('\n')}
</section>`).join('\n')}
<section class="werkzeug" id="dokumente"><h2>Dokumente</h2>
${dokumente.map((d, i) => `<section class="ansicht" id="dok-${i}">\n<h3>${esc(d.art)}: ${esc(d.titel)}</h3>\n<p>${esc(d.url)}</p>\n${d.html}\n</section>`).join('\n')}
</section>`;
  const sauber = gesamt.split(B).join('https://zentrale').replace(/[?&]k=[A-Za-z0-9_-]+/g, '');
  fs.writeFileSync(path.join(ZIEL, 'index.html'), seite('Zentrale · Tasty Studios · Lesefassung', sauber));
  /* dieselbe Fassung als reiner Text (für KI-Programme mit Grenzen bei PDF) */
  fs.writeFileSync(path.join(ZIEL, 'Tasty-Studios-Zentrale-komplett.txt'), await (async () => { const pp = await ctx.newPage(); await pp.setContent(seite('x', sauber), { waitUntil: 'domcontentloaded', timeout: 0 }); const t = await pp.evaluate(() => document.body.innerText); await pp.close(); return t; })());

  await page.setContent(fs.readFileSync(path.join(ZIEL, 'index.html'), 'utf8'), { waitUntil: 'domcontentloaded', timeout: 0 });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(ZIEL, PDF), format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">Zentrale · Tasty Studios · Lesefassung · Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>' });
  await browser.close();
  const kb = Math.round(fs.statSync(path.join(ZIEL, PDF)).size / 1024);
  console.log(`Lesefassung: ${teile.length} Werkzeuge, ${zaehl} Ansichten, ${dokumente.length} Dokumente, PDF ${kb} KB` + (gesperrt.length ? '\nGESPERRT (nicht gespeichert): ' + gesperrt.length + '\n' + [...new Set(gesperrt)].slice(0, 20).join('\n') : '') + (fehler.length ? '\nHINWEISE:\n' + fehler.join('\n') : ''));
})().catch(e => { console.error(e); process.exit(1); });
