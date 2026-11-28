#!/usr/bin/env node
/* Nachtrag zur Lesefassung (22.11.2026): die Agentur-Website https://tastystudios.vercel.app mit allen Seiten als eigenes Kapitel vor den Dokumenten,
   danach PDF und Textfassung neu. Aufruf nach lesefassung.js: node zentrale/lesen/nachtrag-website.js */
const fs = require('fs'), path = require('path');
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const W = 'https://tastystudios.vercel.app';
const SEITEN = [['/', 'Hotel (Startseite)'], ['/restaurant.html', 'Restaurant'], ['/work.html', 'Atelier'], ['/werkzeuge.html', 'Werkzeuge'], ['/team.html', 'Team'], ['/studio.html', 'Studio'], ['/contact.html', 'Projekt starten (Kontakt)'], ['/legal.html', 'Impressum und Datenschutz']];
const ZIEL = __dirname, PDF = 'Tasty-Studios-Zentrale-komplett.pdf';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  let teil = '', liste = '';
  for (const [u, t] of SEITEN) {
    await p.goto(W + u, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.waitForTimeout(800);
    const text = await p.evaluate(() => { document.querySelectorAll('img[alt]').forEach(i => { if (i.alt.trim() && i.checkVisibility()) i.insertAdjacentText('afterend', ' [Bild: ' + i.alt.trim() + '] '); }); return document.body.innerText; });
    const absaetze = text.split(/\n+/).map(z => z.trim()).filter(Boolean);
    const id = 'web-' + SEITEN.findIndex(x => x[0] === u);
    liste += `<li><a href="#${id}">${esc(t)}</a></li>`;
    teil += `<section class="ansicht" id="${id}">\n<h3>Agentur-Website · ${esc(t)}</h3>\n<p>${esc(W + u)}</p>\n${absaetze.map(a => '<p>' + esc(a) + '</p>').join('\n')}\n</section>\n`;
    console.error(t + ': ' + absaetze.length + ' Absätze');
  }
  const datei = path.join(ZIEL, 'index.html'); let h = fs.readFileSync(datei, 'utf8');
  if (h.includes('id="agentur-website"')) throw new Error('Kapitel steht schon drin');
  h = h.replace('<li><a href="#dokumente">', `<li><a href="#agentur-website">Agentur-Website tastystudios.vercel.app</a> (${SEITEN.length} Seiten)<ol>${liste}</ol></li>\n<li><a href="#dokumente">`);
  h = h.replace('<section class="werkzeug" id="dokumente">', `<section class="werkzeug" id="agentur-website"><h2>Agentur-Website tastystudios.vercel.app</h2><p>Die Website von Tasty Studios, die Anna über «Website bearbeiten» ändert, mit allen Seiten als Text.</p>\n${teil}</section>\n<section class="werkzeug" id="dokumente">`);
  h = h.replace('dazu ', 'dazu die Agentur-Website mit allen Seiten und ');
  fs.writeFileSync(datei, h);
  await p.setContent(h, { waitUntil: 'domcontentloaded', timeout: 0 }); p.setDefaultTimeout(0);
  fs.writeFileSync(path.join(ZIEL, 'Tasty-Studios-Zentrale-komplett.txt'), await p.evaluate(() => document.body.innerText));
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(ZIEL, PDF), format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' }, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">Zentrale · Tasty Studios · Lesefassung · Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>' });
  await b.close(); console.log('Nachtrag Website fertig, PDF ' + Math.round(fs.statSync(path.join(ZIEL, PDF)).size / 1024) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });
