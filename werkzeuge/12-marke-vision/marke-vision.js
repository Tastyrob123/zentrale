/* Marke & Vision · Tasty Studios (Neubau im Kleid, 07.11.2026). Umbau von Le Livre des Culinarium (vorlage/culinarium-demo/werkzeuge/livre/, livre.js):
   gleicher Aufbau (Kopf, Rand, Startbild mit Gruss, Lage mit drei Fächern, Kacheln mit Foto, Ansichten je Bereich, Leiste, Fenster, Meldung, Auftritte),
   statt Bildarchiv und Dateien erzählt Tasty Studios sich selbst in neun Kapiteln nach Roberts Gliederung (kapitel.js): Auftakt = Übersicht, 2 bis 7 = Kapitel, 8 = Annas Fragen, dazu Annas Fragen an Robert (api.py, Ablage daten/12-marke-vision/).
   Kleid aus /zentrale/oberflaeche/ (nie ändern). Jede Änderung zeigt eine Quittung mit vorher und nachher und «Rückgängig»; Löschen nur nach Rückfrage. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';   // wie Le Livre: kein «×», der Zurück-Pfeil
const ORDNER = '12-marke-vision', API = '/zentrale/api/' + ORDNER + '/';
const H = window.WO_HAUS || {};
/* Das Kleid kennt Werkzeug 12 noch nicht (namen und fotoJe enden bei 11): hier nur für diese Seite ergänzt, das Kleid bleibt unverändert (siehe UEBERGABE.md) */
if (H.namen && !H.namen[ORDNER]) H.namen[ORDNER] = 'Marke & Vision';
const NAME = (H.namen && H.namen[ORDNER]) || 'Marke & Vision';
const KAP = window.MV_KAPITEL || [], Q = window.MV_QUELLEN || {}, RA = window.MV_RAHMEN || { auftakt: { titel: 'Auftakt' }, fragen: { titel: 'Annas Fragen' } };
const GESAMT = KAP.length + 2;   // Auftakt + Kapitel + Annas Fragen
const FOTO = k => (H.fotos && H.fotos[k]) || H.foto;
/* Bild eines Bausteins: bild = echtes Haus (haeuser/), foto = Foto der Agentur-Seite aus dem Kleid */
const BILD = b => b.bild ? 'haeuser/' + b.bild + '.webp' : FOTO(b.foto);
const WEBSITE = (H.wege && H.wege.website) || 'https://tastyrob123.github.io/tastystudios/';
const MARKENBUCH = (H.wege && H.wege['11-markenbuch']) || '/zentrale/werkzeuge/11-markenbuch/';
const zahl = n => Number(n).toLocaleString('de-DE');
const datum = s => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(s || ''); return m ? `${+m[3]}.${+m[2]}.${m[1]}${m[4] ? ', ' + m[4] : ''}` : ''; };

/* ---------------------------------------------------------------- Zustand */
const S = { ansicht: 'start', fragen: [], probe: false, server: null, kapitelNamen: {} };
const ANSICHTEN = ['start', ...KAP.map(k => k.k), 'fragen'];
const kapVon = k => KAP.find(x => x.k === k);
const kapName = k => (kapVon(k) || {}).titel || (k === 'auftakt' ? RA.auftakt.titel : '') || S.kapitelNamen[k] || 'Allgemein';
const kapZiel = k => kapVon(k) ? k : k === 'auftakt' ? 'start' : 'fragen';
const GRUPPEN = [['warum', 'Warum'], ['wie', 'Woran man uns erkennt'], ['wohin', 'Wohin']];
const offen = () => S.fragen.filter(f => !f.antwort);
const WER = () => H.wer || 'Robert';

/* ---------------------------------------------------------------- Grundgerüst: Kopf, Rand, Leiste aus dem Paket */
function kopf() {
  const k = kapVon(S.ansicht);
  const titel = S.ansicht === 'start' ? RA.auftakt.titel : S.ansicht === 'fragen' ? RA.fragen.titel : k.titel;
  const o = offen().length;
  const st = `${GESAMT} Kapitel · ${o === 1 ? 'eine Frage offen' : (o ? zahl(o) : 'keine') + ' Fragen offen'}`;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: ORDNER, unter: 'Marke', titel, stand: st, anleitung: 'anleitung.html', pruefung: 'pruefung.html', website: WEBSITE, marke: 'data-gehe="start"', markeHref: '#start' });
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
}
function rand() {
  const e = (key, text, z = '') => ({ text, zahl: z, an: S.ansicht === key, attr: `data-gehe="${key}"` });
  const o = offen().length;
  $('#rand').innerHTML = WO.rand([
    { eintraege: [e('start', RA.auftakt.titel)] },
    ...GRUPPEN.map(([g, t]) => ({ titel: t, eintraege: KAP.filter(k => k.gruppe === g).map(k => e(k.k, k.titel)).concat(g === 'wohin' ? [e('fragen', RA.fragen.titel, o ? zahl(o) : '')] : []) }))
  ], { website: WEBSITE, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  $('#rand .wo-rand__wege').insertAdjacentHTML('afterbegin', `<a href="${H.wege && H.wege.zentrale || '/zentrale/'}">${esc(WO.name('zentrale'))}${WO.ic('haus')}</a><a href="${MARKENBUCH}">${esc((H.namen && H.namen['11-markenbuch']) || 'Markenbuch')}${WO.ic('pfeil')}</a>`);
  /* Der Rand steht ab dem ersten Bild still wie in Le Livre: bewegung.js des Kleids lässt die Einträge sonst hochschweben, dabei lagen sie kurz über den Gruppentiteln. */
  $$('#rand .wo-re, #rand .wo-zw, #rand h2, #rand h3').forEach(x => x.setAttribute('data-wo-bw-nie', ''));
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  if (window.MV_RUNDGANG_WEG) window.MV_RUNDGANG_WEG();
}
function leiste() {
  const k = kapVon(S.ansicht), o = offen().length, b = S.fragen.length - o;
  const titel = k ? `Frage zu «${k.titel}»` : S.ansicht === 'start' ? 'Frage zum Auftakt' : S.ansicht === 'fragen' ? `${o === 1 ? 'Eine' : o ? zahl(o) : 'Keine'} offen · ${b === 1 ? 'eine' : b ? zahl(b) : 'keine'} beantwortet` : 'Fragen an Robert';
  const satz = S.server === false ? 'Ohne den Server lassen sich keine Fragen speichern. Gezeigt werden die Beispiele.'
    : WER() === 'Anna' ? 'Was unklar ist, hier hinterlassen. Robert sieht es im Kapitel «Annas Fragen» und antwortet hier.'
    : 'Annas offene Fragen stehen im Kapitel «Annas Fragen», dort wird auch geantwortet.';
  $('#leiste').innerHTML = WO.leiste({ titel, satz, knoepfe: (S.ansicht !== 'fragen' ? WO.knopf('Alle Fragen', 'chat', 'glas', { klein: true, attr: 'data-gehe="fragen"' }) : '') + WO.knopf('Frage stellen', 'plus', 'gold', { klein: true, attr: 'data-neu' }) });
  $$('#leiste [data-gehe]').forEach(x => x.onclick = () => gehe(x.dataset.gehe));
  $$('#leiste [data-neu]').forEach(x => x.onclick = () => frageFenster(null, k ? k.k : S.ansicht === 'start' ? 'auftakt' : ''));
}

function gehe(a, still = false) {
  S.ansicht = a;
  try { localStorage.setItem('tasty-mv-ansicht', a); } catch (e) { /* privat */ }
  history.replaceState(null, '', location.pathname + location.search + '#' + a);
  kopf(); rand(); leiste(); zeichne(still);
  scrollTo({ top: 0 });
}

function zeichne(still = false) {
  const el = $('#ansicht'), a = S.ansicht;
  el.innerHTML = a === 'start' ? start() : a === 'fragen' ? fragenAnsicht() : kapitel(kapVon(a));
  $$('#ansicht [data-gehe]').forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe); });
  $$('#ansicht [data-neu]').forEach(b => b.onclick = () => frageFenster(null, b.dataset.neu || ''));
  if (a === 'fragen') fragenLeben();
  werkzeugLeben(el);
  sucheLeben(el); kapitelLeben(el);
  auftritte(el, still);
}

/* Werkzeug-Abschnitte: Klick auf eine Funktion zeigt ihren Bildschirm; am Rechner wählt auch das Scrollen durch die Liste die Funktion in der Mitte.
   «Film ansehen» spielt die Bedienung im Laptop, «Bilder» führt zurück. Es läuft immer nur ein Film. */
function werkzeugLeben(r) {
  const alle = $$('[data-wz]', r); if (!alle.length) return;
  const filme = () => $$('[data-wz] video', r);
  alle.forEach(sec => {
    const fs = $$('.mv-wz__f', sec), imgs = $$('.mv-geraet__schirm img', sec), vid = $('video', sec), was = $('.mv-wz__was', sec), kn = $('[data-wz-film]', sec);
    const knText = t => { const s = kn && kn.querySelector('span'); if (s) s.textContent = t; };
    const filmAus = () => { if (!sec.classList.contains('film')) return; sec.classList.remove('film'); vid.pause(); knText('Film ansehen'); const f = $('.mv-wz__f.an', sec); if (f) was.textContent = f.querySelector('b').textContent; };
    const waehle = (i, vonScroll) => {
      const f = fs[i]; if (!f) return; if (!vonScroll) filmAus(); else if (sec.classList.contains('film')) return;
      fs.forEach(x => x.classList.toggle('an', x === f)); was.textContent = f.querySelector('b').textContent;
      const b = f.dataset.bild; if (b) imgs.forEach(im => im.classList.toggle('an', im.dataset.b === b));
    };
    const hof = $('.mv-wz__hof', sec), schmal = () => !matchMedia('(min-width: 1000px)').matches;
    const zeigeHof = () => { if (schmal()) { const r = hof.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 90) hof.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'center' }); } };
    fs.forEach((f, i) => f.onclick = () => { waehle(i); zeigeHof(); });
    /* Klick auf den Bildschirm: die Aufnahme gross in einem neuen Fenster */
    $('.mv-geraet__schirm', sec).onclick = () => { if (sec.classList.contains('film')) return; const im = $('.mv-geraet__schirm img.an', sec); if (im) open(im.src, '_blank', 'noopener'); };
    if (kn) kn.onclick = e => { e.preventDefault();
      if (sec.classList.contains('film')) { filmAus(); return; }
      filme().forEach(v => { if (v !== vid) { v.pause(); v.closest('[data-wz]').classList.remove('film'); const k2 = v.closest('[data-wz]').querySelector('[data-wz-film] span'); if (k2) k2.textContent = 'Film ansehen'; } });
      if (!vid.src) vid.src = vid.dataset.film;
      sec.classList.add('film'); knText('Bilder'); was.textContent = 'Der Film: so wird es bedient'; vid.currentTime = 0; vid.play().catch(() => {}); zeigeHof(); };
    if ('IntersectionObserver' in window && matchMedia('(min-width: 1000px)').matches && !sec.closest('.hb-wz')) {   // im Handbuch wählt nur der Klick
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) waehle(fs.indexOf(e.target), true); }), { rootMargin: '-48% 0px -48% 0px' });
      fs.forEach(f => io.observe(f));
    }
    /* der Film hält an, sobald der Abschnitt aus dem Bild ist */
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && sec.classList.contains('film')) vid.pause(); else if (e.isIntersecting && sec.classList.contains('film')) vid.play().catch(() => {}); })).observe(sec);
  });
}

/* Auftritte wie Le Livre (R17): federnd, sobald im Bild, nur transform; deckend ab dem ersten Bild; was beim Scrollen nachkommt, steht sofort.
   Ausnahme hier: die grossen Fotos (Fenster) und die Kapitel-Titel kommen erst, wenn man hinscrollt, mit derselben Feder (Le Livre buch.js). */
let IO = null;
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function auftritte(r, still) {
  const alle = $$('[data-r]', r).filter(x => !x.classList.contains('da'));
  if (IO) IO.disconnect();
  if (still || RUHIG()) { alle.forEach(x => x.classList.add('da', 'steht')); return; }
  const H0 = innerHeight; let n = 0;
  IO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { IO.unobserve(e.target); e.target.classList.add('da'); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  alle.forEach(x => {
    const b = x.getBoundingClientRect();
    if (b.top < H0 && b.bottom > 0 && n < 22) { x.style.setProperty('--i', Math.min(n++, 6)); requestAnimationFrame(() => requestAnimationFrame(() => x.classList.add('da'))); }
    else if (IO && x.hasAttribute('data-spaet')) IO.observe(x);
    else x.classList.add('da', 'steht');
  });
}

/* ---------------------------------------------------------------- Handbuch (Runde 3, 17.11.2026, Robert: «geiler, luxuriöser … dass es wirklich Mehrwert bieten kann»)
   Briefing: auftraege/12-marke-vision-runde3.md. Vom Lesebuch zum Handbuch: Startseite «Auf einen Blick» mit Suche, jedes Kapitel kurz
   (Kopf, «Das Wichtigste», «Wörtlich aus den Unterlagen», Einträge zum Aufklappen, höchstens eine Bildbühne), Werkzeuge als Auswahl mit Laptop.
   Der Inhalt bleibt unverändert in kapitel.js; hier wird er nur anders geordnet. Quellen je Kapitel stehen auf der Prüfseite. */
const zwei = t => `${esc(t[0])} <em>${esc(t[1] || '')}</em>`;
const ZT = t => (t || []).filter(Boolean).join(' ');
const ersterSatz = s => { s = String(s || ''); const m = /^(.+?[^\d\s][.!?»])(?=\s+[A-ZÄÖÜ«]|$)/.exec(s); return (m ? m[1] : s).trim(); };
const GRUPPE = g => (GRUPPEN.find(x => x[0] === g) || ['', ''])[1];
const PFEIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
/* Werkzeug-Namen, wie sie seit 09.11.2026 in jedem Haus heissen; dahinter die Schlüssel der Aufnahmen (haeuser/wz/) */
const WZ_NAME = { maison: 'Kontrollpanel', bureau: 'Website bearbeiten', carte: 'Karten & Preislisten', reception: 'Anfragen & Chat', livre: 'Markenbuch', registre: 'Besucher', imprimerie: 'Drucksachen & Feed' };
const wzAlle = () => ((kapVon('werkzeuge') || { teile: [] }).teile).filter(b => b.art === 'werkzeug');
const wzTeile = b => { const i = b.lead.search(/ Im [A-ZÄÖÜ]/); return i > 0 ? [b.lead.slice(0, i), b.lead.slice(i + 1)] : [b.lead, '']; };
S.wz = 'maison'; S.oeffne = null; S.wzF = null;

/* Ein Baustein aus kapitel.js wird zu einem Eintrag: Titel, ein Satz, aufgeklappt der ganze Inhalt. Fenster, So/Nie und Werkzeuge stehen woanders. */
function eintrag(b) {
  const lead = b.lead ? `<p class="hb-lead">${esc(b.lead)}</p>` : '';
  const vorschlag = b.hinweis ? `<p class="hb-vorschlag">${esc(b.hinweis)}: so im Strategiepapier, noch nicht entschieden.</p>` : '';
  const von = b.von ? `<small class="hb-von">${esc(b.von)}</small>` : '';
  const dl = rows => `<dl class="hb-dl">${rows.map(([a, c]) => `<div><dt>${esc(a)}</dt><dd>${esc(c)}</dd></div>`).join('')}</dl>`;
  switch (b.art) {
    case 'mk': return { titel: ZT(b.t), kurz: ersterSatz(b.lead), body: `<p class="hb-lead">${esc(b.lead)}</p>`, text: b.lead };
    case 'reihen': return { titel: ZT(b.t), kurz: b.lead ? ersterSatz(b.lead) : b.reihen.map(r => r[0]).join(' · '), body: lead + vorschlag + dl(b.reihen), text: (b.lead || '') + ' ' + b.reihen.flat().join(' ') };
    case 'karten': return { titel: ZT(b.t), kurz: b.lead ? ersterSatz(b.lead) : b.karten.map(c => c.b).join(' · '), body: lead + vorschlag + `<dl class="hb-dl hb-dl--mk">${b.karten.map(c => `<div><dt><small>${esc(c.m)}</small>${esc(c.b)}</dt><dd>${esc(c.p)}</dd></div>`).join('')}</dl>`, text: (b.lead || '') + ' ' + b.karten.map(c => c.m + ' ' + c.b + ' ' + c.p).join(' ') };
    case 'weg': return { titel: ZT(b.t), kurz: b.schritte.map(s => s[0]).join(' · '), body: vorschlag + `<ol class="hb-weg">${b.schritte.map(s => `<li><b>${esc(s[0])}</b><p>${esc(s[1])}</p>${s[2] ? `<span>${esc(s[2])}</span>` : ''}</li>`).join('')}</ol>`, text: b.schritte.flat().join(' ') };
    case 'preise': return { titel: ZT(b.t), kurz: ersterSatz(b.lead), body: lead + `<div class="hb-preise">${b.reihen.map(r => `<div><span><b>${esc(r[0])}</b><small>${esc(r[3])}</small></span><em>${esc(r[1])}</em><strong>${esc(r[2])}</strong></div>`).join('')}</div>`, text: (b.lead || '') + ' ' + b.reihen.flat().join(' ') };
    case 'zahlen': return { titel: ZT(b.t), kurz: b.zahlen.map(z => z[0] + ' ' + z[1]).join(' · '), body: lead + `<div class="hb-zahlen">${b.zahlen.map(z => `<div><b>${esc(z[0])}<small>${esc(z[1])}</small></b><p>${esc(z[2])}</p></div>`).join('')}</div>`, text: b.zahlen.flat().join(' ') };
    case 'beleg': return { mk: 'Am Haus · ' + b.haus, titel: b.b, kurz: ersterSatz(b.p), body: `<div class="hb-beleg${b.bild ? '' : ' hb-beleg--text'}">${b.bild ? `<img src="haeuser/${esc(b.bild)}.webp" alt="" loading="lazy" decoding="async">` : ''}<div><p class="hb-lead">${esc(b.p)}</p>${von}</div></div>`, text: b.haus + ' ' + b.p };
    case 'bilder':
      if (b.bilder.length > 4) return { titel: ZT(b.t), kurz: ersterSatz(b.lead), body: lead + `<div class="hb-kn">${WO.knopf('Zu den Werkzeugen', 'rechts', 'dunkel', { klein: true, attr: 'data-gehe="werkzeuge"' })}</div>`, text: b.lead || '' };
      return { titel: ZT(b.t), kurz: ersterSatz(b.lead), body: lead + `<div class="hb-bilder" style="--n:${b.bilder.length}">${b.bilder.map(([f, n]) => `<figure><img src="haeuser/${esc(f)}.webp" alt="${esc(n)}" loading="lazy" decoding="async"><figcaption>${esc(n)}</figcaption></figure>`).join('')}</div><small class="hb-von">${esc(b.haus)}</small>`, text: (b.lead || '') + ' ' + b.bilder.map(x => x[1]).join(' ') };
    case 'vh': return { titel: ZT(b.t), kurz: ersterSatz(b.lead), body: lead, text: b.lead || '' };
    case 'verweis': return { mk: 'Im Werkzeug ' + ((H.namen && H.namen[b.ziel]) || 'Markenbuch'), titel: b.b, kurz: b.p, body: `<p class="hb-lead">${esc(b.p)}</p><div class="hb-kn">${WO.knopf('Markenbuch öffnen', 'pfeil', 'dunkel', { klein: true, href: MARKENBUCH })}</div>`, text: b.p };
    default: return null;
  }
}
/* Welcher Baustein eines Kapitels trägt die Bildbühne (nur wo ein Bild etwas beweist: vorher/nachher, Abendfotos, Beleg am Haus) */
function buehneVon(k) {
  if (k.k === 'werkzeuge') return null;
  const vh = k.teile.find(b => b.art === 'vh'); if (vh) return { vh };
  const bilder = k.teile.find(b => b.art === 'bilder' && !b.geraet);
  const beleg = k.teile.find(b => b.art === 'beleg' && b.bild);
  if (!bilder && !beleg) return null;
  const imgs = [];
  if (bilder) bilder.bilder.forEach(([f, n]) => imgs.push(['haeuser/' + f + '.webp', n]));
  k.teile.forEach(b => { if ((b.art === 'beleg' || b.art === 'fenster') && b.bild) imgs.push(['haeuser/' + b.bild + '.webp', b.b || b.s]); });
  k.teile.forEach(b => { if (b.art === 'fenster' && b.foto) imgs.push([FOTO(b.foto), b.s]); });
  const einzig = imgs.filter((x, i) => imgs.findIndex(y => y[0] === x[0]) === i).slice(0, 4);
  return { bilder, beleg, imgs: einzig.length >= 2 ? einzig : null };
}
function eintraegeVon(k) {
  const bu = buehneVon(k) || {};
  return k.teile.map((b, i) => {
    if (b.art === 'werkzeug' || b.art === 'fenster' || b.art === 'sonie') return null;
    if (bu.vh === b || bu.bilder === b || (bu.beleg === b && bu.imgs)) return null;
    if (k.k === 'werkzeuge' && b.art === 'bilder') return null;
    const e = eintrag(b); if (!e) return null;
    return Object.assign(e, { id: k.k + '-' + i, k: k.k });
  }).filter(Boolean);
}
/* Suchindex über alle Kapitel und alle Funktionen der Werkzeuge */
let INDEX = null;
function index() {
  if (INDEX) return INDEX;
  INDEX = [];
  KAP.forEach(k => {
    INDEX.push({ k: k.k, titel: k.titel, kurz: k.kurz, text: k.satz + ' ' + k.lage.flat().join(' '), mk: 'Kapitel' });
    eintraegeVon(k).forEach(e => INDEX.push({ k: k.k, id: e.id, titel: e.titel, kurz: e.kurz, text: e.text, mk: k.titel }));
    k.teile.forEach(b => {
      if (b.art === 'fenster') INDEX.push({ k: k.k, titel: b.s, kurz: b.u || '', text: b.von || '', mk: k.titel + ' · Satz' });
      if (b.art === 'sonie') INDEX.push({ k: k.k, titel: 'Beispielsätze', kurz: b.so[0], text: b.so.concat(b.nie).join(' '), mk: k.titel });
    });
  });
  wzAlle().forEach(b => {
    INDEX.push({ k: 'werkzeuge', wz: b.k, titel: WZ_NAME[b.k], kurz: wzTeile(b)[0], text: b.lead, mk: 'Werkzeug' });
    b.f.forEach((f, i) => INDEX.push({ k: 'werkzeuge', wz: b.k, f: i, titel: f[0], kurz: ersterSatz(f[1]), text: f[1], mk: 'Werkzeug ' + WZ_NAME[b.k] }));
  });
  return INDEX;
}
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
function suche(q) {
  const w = norm(q).split(/\s+/).filter(x => x.length > 1); if (!w.length) return [];
  return index().map(x => { const t = norm(x.titel), a = norm(x.titel + ' ' + x.kurz + ' ' + x.text + ' ' + x.mk);
    if (!w.every(v => a.includes(v))) return null; return [w.reduce((s, v) => s + (t.includes(v) ? 3 : 1), 0) + (x.mk === 'Kapitel' ? 1 : 0), x]; })
    .filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 8).map(x => x[1]);
}
function oeffneTreffer(x) {
  S.oeffne = x.id || null;
  if (x.wz) { S.wz = x.wz; S.wzF = x.f == null ? null : x.f; }
  gehe(x.k);
}

/* ---------------------------------------------------------------- Startseite «Auf einen Blick» */
function gruss() { const g = WO.gruss().replace(/\.$/, ''); return `${g}, ${WER()}.`; }
function start() {
  const sechs = KAP.filter(k => k.k !== 'werkzeuge');
  const wk = kapVon('werkzeuge');
  const tafel = (k, i) => `<button type="button" class="hb-tafel" data-gehe="${k.k}" data-r data-spaet style="--i:${i}">
      <span class="wo-mk">${esc(GRUPPE(k.gruppe))}</span><b class="hb-t">${esc(k.titel)}</b><span class="hb-tafel__s">${esc(k.kurz)}</span>
      <dl class="hb-mini">${k.lage.map(([a, c]) => `<div><dt>${esc(a)}</dt><dd>${esc(c)}</dd></div>`).join('')}</dl>
      <span class="hb-oeffnen">Öffnen ${WO.ic('rechts')}</span></button>`;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', h1: 'Tasty Studios is a <em>Digital Hospitality Studio.</em>', zier: esc(`${gruss()} ${RA.auftakt.titel}`),
      satz: esc(KAP[0].satz), knoepfe: WO.knopf('Lesen', 'rechts', 'gold', { attr: `data-gehe="${KAP[0].k}"` }) + WO.knopf('Anleitung', 'buch', 'glas', { href: 'anleitung.html', neu: true }) })}
    <div class="hb-suche platte" data-r data-spaet>
      <label for="hb-q"><span class="wo-mk">Nachschlagen</span><b class="hb-t">Was suchst du?</b></label>
      <div class="hb-suche__feld"><input id="hb-q" type="search" autocomplete="off" placeholder="Zum Beispiel Preis, Werkbank, Zielgruppe, Licht, Karten" aria-describedby="hb-qh"><small id="hb-qh">Sucht in allen Kapiteln und in jeder Funktion der Werkzeuge.</small></div>
      <ul class="hb-treffer" id="hb-treffer" hidden></ul>
    </div>
    <div class="hb-raster">${sechs.map(tafel).join('')}</div>
    <section class="hb-wzs" data-r data-spaet>
      <header class="hb-wzs__k"><div><span class="wo-mk">${esc(GRUPPE(wk.gruppe))}</span><b class="hb-t hb-t--gross">Unsere <em>Werkzeuge.</em></b></div>
        <p>Sieben Werkzeuge für jedes Haus, in jedem Haus mit demselben Namen. Fahr über ein Werkzeug, dann zeigt der Laptop seinen echten Bildschirm. Ein Klick öffnet alle Funktionen mit Film.</p></header>
      <div class="hb-wzs__b">
        <ol class="hb-wzs__l">${wzAlle().map((b, i) => `<li><button type="button" data-wzk="${b.k}" data-wzs="${b.k}" class="${i ? '' : 'an'}"><span class="hb-wzs__n">${String(i + 1).padStart(2, '0')}</span><span class="hb-wzs__x"><b>${esc(WZ_NAME[b.k])}</b><small>${esc(wzTeile(b)[0])}</small></span>${WO.ic('rechts')}</button></li>`).join('')}</ol>
        <div class="hb-wzs__hof">
          <span class="mv-geraet hb-wzs__geraet"><span class="mv-geraet__schirm">${wzAlle().map((b, i) => `<img src="haeuser/wz/${esc(b.k)}-start.webp" data-wzb="${esc(b.k)}" class="${i ? '' : 'an'}" alt="${esc(WZ_NAME[b.k])}, Startseite am Beispiel Culinarium" decoding="async">`).join('')}</span><img class="mv-geraet__haus" src="/zentrale/zentrale/img/laptop.webp" alt="" decoding="async"></span>
          <div class="hb-wzs__fuss"><p><small>Am Beispiel Culinarium</small><b class="hb-wzs__was">${esc(WZ_NAME[wzAlle()[0].k])}</b></p>${WO.knopf('Alle Funktionen', 'rechts', 'gold', { attr: `data-wzk="${wzAlle()[0].k}" data-wzs-auf` })}</div>
        </div>
      </div>
    </section>`;
}
function sucheLeben(r) {
  const q = $('#hb-q', r), ul = $('#hb-treffer', r); if (!q) return;
  let liste = [];
  const zeige = () => {
    liste = suche(q.value);
    if (!q.value.trim()) { ul.hidden = true; ul.innerHTML = ''; return; }
    ul.hidden = false;
    ul.innerHTML = liste.length ? liste.map((x, i) => `<li><button type="button" data-t="${i}"><span class="wo-mk">${esc(x.mk)}</span><b>${esc(x.titel)}</b><span>${esc(x.kurz)}</span></button></li>`).join('')
      : `<li class="hb-treffer__leer">Nichts gefunden. Ein anderes Wort probieren, oder Robert unten eine Frage stellen.</li>`;
    $$('[data-t]', ul).forEach(b => b.onclick = () => oeffneTreffer(liste[+b.dataset.t]));
  };
  q.oninput = zeige;
  q.onkeydown = e => { if (e.key === 'Enter' && liste[0]) { e.preventDefault(); oeffneTreffer(liste[0]); } };
}

/* ---------------------------------------------------------------- Kapitel */
function satzZahl(k) { const so = k.teile.find(b => b.art === 'sonie'); return k.teile.filter(b => b.art === 'fenster').length + (so ? so.so.length : 0); }
function satzTafel(k, dazu = '') {
  const saetze = k.teile.filter(b => b.art === 'fenster').map(b => [b.s + (b.u ? ' ' + b.u : ''), b.von]);
  const sonie = k.teile.find(b => b.art === 'sonie');
  if (sonie) sonie.so.forEach(s => saetze.push([s, '']));
  if (saetze.length < 2) return '';
  return `<div class="hb-saetze platte" data-r data-spaet style="--i:1"><span class="wo-mk">Wörtlich aus den Unterlagen</span>
    <ul>${saetze.slice(0, 4).map(([s, v]) => `<li><p>${esc(s)}</p>${v ? `<small>${esc(v)}</small>` : ''}</li>`).join('')}</ul>
    ${sonie && sonie.nie.length ? `<div class="hb-nie"><span class="wo-mk">Nie</span>${sonie.nie.map(s => `<s>${esc(s)}</s>`).join('')}</div>` : ''}${dazu}</div>`;
}
function eintragHtml(e) {
  return `<article class="hb-e" id="e-${esc(e.id)}">
    <button type="button" class="hb-e__k" aria-expanded="false" aria-controls="eb-${esc(e.id)}"><span class="hb-e__t">${e.mk ? `<small>${esc(e.mk)}</small>` : ''}<b>${esc(e.titel)}</b></span><span class="hb-e__s">${esc(e.kurz)}</span><i>${PFEIL}</i></button>
    <div class="hb-e__b" id="eb-${esc(e.id)}" hidden><div class="hb-e__in">${e.body}</div></div></article>`;
}
function buehneHtml(k) {
  const bu = buehneVon(k); if (!bu) return '';
  if (bu.vh) {
    const b = bu.vh, p = b.paare[0];
    return `<section class="hb-bu hb-bu--vh" data-r data-spaet data-vh>
      <div class="hb-bu__bilder" style="--n:2"><figure><img src="haeuser/${esc(p[0])}.webp" alt="Vorher" loading="lazy" decoding="async" data-vh-alt><em>Vorher</em></figure><figure><img src="haeuser/${esc(p[1])}.webp" alt="Nachher" loading="lazy" decoding="async" data-vh-neu><em>Nachher</em></figure></div>
      <div class="hb-bu__tafel"><span class="wo-mk">Am Haus · ${esc(b.haus)}</span><b class="hb-t">${zwei(b.t)}</b><p>${esc(b.lead)}</p>
        <div class="hb-vhwahl">${b.paare.map((x, i) => `<button type="button" data-vhi="${i}" class="${i ? '' : 'an'}">${esc(x[2])}</button>`).join('')}</div></div></section>`;
  }
  if (!bu.imgs) return '';
  const t = bu.beleg ? { mk: 'Am Haus · ' + bu.beleg.haus, b: bu.beleg.b, p: bu.beleg.p, v: bu.beleg.von } : { mk: bu.bilder.haus, b: ZT(bu.bilder.t), p: bu.bilder.lead, v: '' };
  return `<section class="hb-bu" data-r data-spaet>
    <div class="hb-bu__bilder" style="--n:${bu.imgs.length}">${bu.imgs.map(([src, n]) => `<figure><img src="${esc(src)}" alt="${esc(n || '')}" loading="lazy" decoding="async"></figure>`).join('')}</div>
    <div class="hb-bu__tafel"><span class="wo-mk">${esc(t.mk)}</span><b class="hb-t">${esc(t.b)}</b><p>${esc(t.p)}</p>${t.v ? `<small class="hb-von">${esc(t.v)}</small>` : ''}</div></section>`;
}
function wzHtml() {
  const alle = wzAlle(), b = alle.find(x => x.k === S.wz) || alle[0], [was, haeuser] = wzTeile(b);
  const erstes = (b.f.find(x => x[2]) || [])[2], bilder = [...new Set(b.f.map(x => x[2]).filter(Boolean))];
  return `<div class="hb-wz__reiter" role="tablist" aria-label="Werkzeuge">${alle.map((x, i) => `<button type="button" role="tab" aria-selected="${x === b}" data-wzk="${x.k}" class="${x === b ? 'an' : ''}"><small>${String(i + 1).padStart(2, '0')}</small><b>${esc(WZ_NAME[x.k])}</b></button>`).join('')}</div>
    <div class="hb-wz__kopf"><div class="hb-wz__name"><span class="wo-mk">Werkzeug ${alle.indexOf(b) + 1} von ${alle.length} · ${b.f.length} Funktionen</span><h2 class="hb-t hb-t--gross">${esc(WZ_NAME[b.k])}</h2></div>
      <div class="hb-wz__was"><p class="hb-lead">${esc(was)} Ein Klick auf eine Funktion zeigt ihren echten Bildschirm, «Film ansehen» die Bedienung.</p>${haeuser ? `<small class="hb-von">${esc(haeuser)}</small>` : ''}</div></div>
    <section class="mv-wz hb-wz__fn" data-wz="${esc(b.k)}">
      <div class="mv-wz__buehne">
        <ol class="mv-wz__liste">${b.f.map(([t, p, bild], i) => `<li><button type="button" class="mv-wz__f${i === 0 ? ' an' : ''}" data-i="${i}" data-bild="${esc(bild || '')}"><b>${esc(t)}</b><span>${esc(p)}</span></button></li>`).join('')}</ol>
        <div class="mv-wz__hof hb-wz__hof"><div class="hb-wz__klebt">
          <span class="mv-geraet mv-wz__geraet"><span class="mv-geraet__schirm">${bilder.map(f => `<img src="haeuser/wz/${esc(f)}.webp" data-b="${esc(f)}" class="${f === erstes ? 'an' : ''}" alt="" decoding="async">`).join('')}<video muted playsinline loop preload="none" poster="haeuser/wz/${esc(b.k)}-film.webp" data-film="haeuser/wz/${esc(b.k)}.mp4"></video></span><img class="mv-geraet__haus" src="/zentrale/zentrale/img/laptop.webp" alt="" decoding="async"></span>
          <div class="mv-wz__fuss"><p><small>Am Beispiel Culinarium</small><b class="mv-wz__was">${esc(b.f[0][0])}</b></p>${WO.knopf('Film ansehen', 'rechts', 'gold', { attr: 'data-wz-film' })}</div>
        </div></div>
      </div></section>`;
}
function wzLeben(r) {
  const box = $('.hb-wz', r); if (!box) return;
  $$('[data-wzk]', box).forEach(x => x.onclick = () => {
    S.wz = x.dataset.wzk; S.wzF = null; box.innerHTML = wzHtml(); werkzeugLeben(box); wzLeben(r);
    const top = box.getBoundingClientRect().top; if (top < 60 || top > innerHeight * .5) box.scrollIntoView({ block: 'start', behavior: RUHIG() ? 'auto' : 'smooth' });
  });
}
function kapitel(k) {
  const i = KAP.indexOf(k), naechst = KAP[i + 1], fr = S.fragen.filter(f => f.kapitel === k.k).length;
  const es = eintraegeVon(k), saetzeKurz = satzZahl(k) <= 2;
  const inhalt = es.length ? `<div class="hb-inhalt hb-inhalt--hell"><span class="wo-mk">In diesem Kapitel</span><ul>${es.map(e => `<li><button type="button" data-oeffne="${esc(e.id)}">${esc(e.titel)}${WO.ic('rechts')}</button></li>`).join('')}</ul></div>` : '';
  const saetze = satzTafel(k, saetzeKurz ? inhalt : '');
  const mk = k.teile.filter(b => b.art === 'mk').map(b => ZT(b.t)).concat(k.teile.filter(b => b.art === 'fenster').map(b => b.s + (b.u ? ' ' + b.u : '')));
  const zitat = !saetze && mk.length ? `<p class="hb-wichtig__z">«${esc(mk[0])}»</p>` : '';
  const wichtig = `<div class="hb-wichtig" data-r data-spaet><span class="wo-mk">Das Wichtigste</span><p class="hb-wichtig__s">${esc(k.kurz)}</p>
      <dl class="hb-dl hb-dl--hell">${k.lage.map(([a, c]) => `<div><dt>${esc(a)}</dt><dd>${esc(c)}</dd></div>`).join('')}</dl>${zitat}
      ${saetze && es.length && !saetzeKurz ? `<div class="hb-inhalt"><span class="wo-mk">In diesem Kapitel</span><ul>${es.map(e => `<li><button type="button" data-oeffne="${esc(e.id)}">${esc(e.titel)}${WO.ic('rechts')}</button></li>`).join('')}</ul></div>` : ''}</div>`;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(k.foto), h1: zwei(k.h1), zier: esc(`Kapitel ${i + 2} von ${GESAMT} · ${GRUPPE(k.gruppe)}${fr ? ' · ' + (fr === 1 ? 'eine Frage' : zahl(fr) + ' Fragen') : ''}`), satz: esc(k.satz),
      knoepfe: WO.knopf('Frage stellen', 'plus', 'gold', { attr: `data-neu="${k.k}"` }) + (naechst ? WO.knopf('Nächstes Kapitel', 'rechts', 'glas', { attr: `data-gehe="${naechst.k}"`, titel: 'Weiter: ' + naechst.titel }) : WO.knopf(RA.fragen.titel, 'chat', 'glas', { attr: 'data-gehe="fragen"' })) })}
    ${k.k === 'werkzeuge' ? `<section class="hb-wz" data-r data-spaet>${wzHtml()}</section>` : `<div class="hb-zwei${saetze ? '' : ' hb-zwei--eins'}">${wichtig}${saetze}</div>`}
    ${es.length ? `<div class="hb-liste" data-r data-spaet><header class="hb-liste__k"><b class="hb-t">${k.k === 'werkzeuge' ? 'Mehr zu den Werkzeugen' : 'Nachschlagen'}</b><span class="wo-mk">${es.length === 1 ? 'Ein Eintrag' : zahl(es.length) + ' Einträge'} zum Aufklappen</span></header>${es.map(eintragHtml).join('')}</div>` : ''}
    ${buehneHtml(k)}
    <nav class="hb-weiter">${naechst ? `<button type="button" data-gehe="${naechst.k}"><small>Weiter</small><b>${esc(naechst.titel)}</b>${WO.ic('rechts')}</button>`
      : `<button type="button" data-gehe="fragen"><small>Weiter</small><b>${esc(RA.fragen.titel)}</b>${WO.ic('rechts')}</button>`}</nav>`;
}
function eintragAuf(art, auf) {
  const kn = $('.hb-e__k', art), b = $('.hb-e__b', art); if (!kn || !b) return;
  const jetzt = auf == null ? kn.getAttribute('aria-expanded') !== 'true' : auf;
  kn.setAttribute('aria-expanded', String(jetzt)); b.hidden = !jetzt; art.classList.toggle('auf', jetzt);
}
function kapitelLeben(r) {
  $$('.hb-e', r).forEach(a => $('.hb-e__k', a).onclick = () => eintragAuf(a));
  $$('[data-oeffne]', r).forEach(b => b.onclick = () => { const a = document.getElementById('e-' + b.dataset.oeffne); if (!a) return; eintragAuf(a, true); a.scrollIntoView({ block: 'center', behavior: RUHIG() ? 'auto' : 'smooth' }); });
  const vh = $('[data-vh]', r);
  if (vh) { const b = (kapVon(S.ansicht) || { teile: [] }).teile.find(x => x.art === 'vh');
    $$('[data-vhi]', vh).forEach(x => x.onclick = () => { const p = b.paare[+x.dataset.vhi]; $('[data-vh-alt]', vh).src = 'haeuser/' + p[0] + '.webp'; $('[data-vh-neu]', vh).src = 'haeuser/' + p[1] + '.webp'; $$('[data-vhi]', vh).forEach(y => y.classList.toggle('an', y === x)); }); }
  $$('.hb-wzs [data-wzk]', r).forEach(x => x.onclick = () => { S.wz = x.dataset.wzk; S.wzF = null; gehe('werkzeuge'); });
  const wzs = $('.hb-wzs', r);
  if (wzs) {   // Startseite: Fahren oder Fokus auf ein Werkzeug zeigt seinen Bildschirm im Laptop
    const zeige = k => { $$('[data-wzs]', wzs).forEach(b => b.classList.toggle('an', b.dataset.wzs === k)); $$('[data-wzb]', wzs).forEach(im => im.classList.toggle('an', im.dataset.wzb === k));
      $('.hb-wzs__was', wzs).textContent = WZ_NAME[k]; $('[data-wzs-auf]', wzs).dataset.wzk = k; };
    $$('[data-wzs]', wzs).forEach(b => { b.onmouseenter = () => zeige(b.dataset.wzs); b.onfocus = () => zeige(b.dataset.wzs); });
  }
  wzLeben(r);
  if (S.oeffne) { const a = document.getElementById('e-' + S.oeffne); S.oeffne = null;
    if (a) { eintragAuf(a, true); a.classList.add('hier'); setTimeout(() => a.classList.remove('hier'), 2400); requestAnimationFrame(() => a.scrollIntoView({ block: 'center' })); } }
  if (S.wzF != null) { const f = $$('.hb-wz .mv-wz__f', r)[S.wzF]; S.wzF = null; if (f) { f.click(); requestAnimationFrame(() => $('.hb-wz', r).scrollIntoView({ block: 'start' })); } }
}

/* ---------------------------------------------------------------- Fragen an Robert */
function fragenAnsicht() {
  const o = offen(), b = S.fragen.filter(f => f.antwort);
  const satz = WER() === 'Anna' ? 'Was beim Lesen unklar war, steht hier. Robert antwortet direkt darunter. Ändern und Löschen geht, solange du willst; Löschen fragt vorher nach.'
    : 'Annas Fragen und Notizen zu den Kapiteln. Offene zuerst. Die Antwort steht direkt unter der Frage.';
  const karte = (f, i) => `<article class="mv-fr${f.antwort ? '' : ' mv-fr--offen'}" id="fragen-${esc(f.id)}" data-r data-spaet style="--i:${i}">
      <header><button type="button" class="mv-fr__kap" data-gehe="${esc(kapZiel(f.kapitel))}">${esc(kapName(f.kapitel))}</button><span>${esc(f.von)} · ${esc(datum(f.zeit))}</span>${f.antwort ? '' : '<em>offen</em>'}</header>
      <p class="mv-fr__t">${esc(f.text)}</p>
      ${f.antwort ? `<div class="mv-fr__a"><span>Robert · ${esc(datum(f.antwort_zeit))}</span><p>${esc(f.antwort)}</p></div>` : ''}
      <div class="mv-fr__kn">${WER() === 'Robert' ? WO.knopf(f.antwort ? 'Antwort ändern' : 'Antworten', 'chat', f.antwort ? 'hell' : 'gold', { klein: true, attr: `data-antwort="${esc(f.id)}"`, disabled: S.server === false }) : ''}
        ${WO.knopf('Ändern', 'stift', 'hell', { klein: true, attr: `data-aendern="${esc(f.id)}"`, disabled: S.server === false })}${WO.knopf('Löschen', 'zurueck', 'hell', { klein: true, attr: `data-loeschen="${esc(f.id)}"`, disabled: S.server === false })}</div>
    </article>`;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(RA.fragen.foto), h1: 'Annas <em>Fragen</em>', zier: esc(`Kapitel ${GESAMT} von ${GESAMT} · Wohin`), satz: esc(satz),
      knoepfe: WO.knopf('Frage stellen', 'plus', 'gold', { attr: 'data-neu=""' }) + WO.knopf('Zum Auftakt', 'links', 'glas', { attr: 'data-gehe="start"' }) })}
    <div class="wo-lage li-lage mv-lage" data-r><div class="wo-lg"><span class="wo-mk">Offen</span><b>${zahl(o.length)}</b></div><div class="wo-lg"><span class="wo-mk">Beantwortet</span><b>${zahl(b.length)}</b></div><div class="wo-lg"><span class="wo-mk">Du arbeitest als</span><b>${esc(WER())}</b></div></div>
    ${S.probe ? `<p class="mv-probe">${S.server === false ? 'Ohne den Server: Das sind die Beispiele aus den Probedaten, Speichern geht nicht. Starten mit python3 zentrale/server.py.' : 'Noch keine eigenen Fragen: Das sind Beispiele. Mit der ersten gespeicherten Frage werden sie zu deinem Stand.'}</p>` : ''}
    ${S.fragen.length ? `<h2 class="wo-zw">Offen</h2><div class="mv-frl">${o.map(karte).join('') || '<p class="mv-leer">Keine offene Frage.</p>'}</div>
      <h2 class="wo-zw">Beantwortet</h2><div class="mv-frl">${b.map((f, i) => karte(f, i + o.length)).join('') || '<p class="mv-leer">Noch keine Antwort.</p>'}</div>`
      : '<p class="mv-leer">Noch keine Frage. Unten rechts oder am Ende jedes Kapitels: «Frage stellen».</p>'}`;
}
function fragenLeben() {
  $$('[data-antwort]').forEach(b => b.onclick = () => antwortFenster(S.fragen.find(f => f.id === b.dataset.antwort)));
  $$('[data-aendern]').forEach(b => b.onclick = () => frageFenster(S.fragen.find(f => f.id === b.dataset.aendern)));
  $$('[data-loeschen]').forEach(b => b.onclick = () => loeschFrage(S.fragen.find(f => f.id === b.dataset.loeschen)));
}
function zeigeFrage(id) {
  const el = document.getElementById('fragen-' + id); if (!el) return;
  el.scrollIntoView({ block: 'center' }); el.classList.add('mv-fr--hier'); setTimeout(() => el.classList.remove('mv-fr--hier'), 2400);
}

/* ---------------------------------------------------------------- Server */
async function api(methode, weg, daten) {
  const r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' });
  let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
  if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
  return j;
}
async function ladeFragen() {
  try { const j = await api('GET', 'fragen'); S.fragen = j.fragen || []; S.probe = !!j.probe; S.kapitelNamen = j.kapitel || {}; S.server = true; }
  catch (e) {
    S.server = false;
    try { const r = await fetch('probedaten/fragen.json', { cache: 'no-store' }); S.fragen = r.ok ? await r.json() : []; } catch (x) { S.fragen = []; }
    S.probe = true;
  }
}
function neuZeichnen() { kopf(); rand(); leiste(); zeichne(true); }

/* ---------------------------------------------------------------- Fenster: Frage stellen, ändern, beantworten */
let VORHER_FOKUS = null;
function fenster(html, label) {
  const f = $('#fenster');
  VORHER_FOKUS = document.activeElement;
  f.innerHTML = `<div class="fenster__k mv-fk" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="wo-kn wo-kn--rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false; document.body.classList.add('li-zu');
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
}
function fensterZu() {
  $('#fenster').hidden = true; $('#fenster').innerHTML = ''; document.body.classList.remove('li-zu');
  if (VORHER_FOKUS && VORHER_FOKUS.focus && document.contains(VORHER_FOKUS)) VORHER_FOKUS.focus({ preventScroll: true });
}
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu(); });

/* Speichern-Knopf wie im Paket (R09): grau ohne Eingabe, gelb mit offener Eingabe, grün «Gespeichert» */
function speicherKnopf(knopf, zustand) {
  knopf.classList.remove('wo-kn--glas', 'wo-kn--wartet', 'wo-kn--fertig');
  knopf.classList.add(zustand === 'fertig' ? 'wo-kn--fertig' : zustand === 'wartet' ? 'wo-kn--wartet' : 'wo-kn--glas');
  knopf.disabled = zustand !== 'wartet';
  knopf.querySelector('span').textContent = zustand === 'fertig' ? 'Gespeichert' : 'Speichern';
}
function feldFenster({ kopfMk, kopfB, feldName, wert, mitKapitel, kapitel, hilfe, speichere }) {
  const wahl = mitKapitel ? `<label class="wo-feld"><span>Kapitel</span><select data-kap><option value="auftakt"${kapitel === 'auftakt' ? ' selected' : ''}>${esc(RA.auftakt.titel)}</option>${KAP.map(k => `<option value="${k.k}"${k.k === kapitel ? ' selected' : ''}>${esc(k.titel)}</option>`).join('')}<option value="allgemein"${!kapitel || kapitel === 'allgemein' ? ' selected' : ''}>Allgemein</option></select></label>` : '';
  fenster(`<div class="wo-fe mv-fe"><div class="wo-fe__kopf"><span class="wo-mk">${esc(kopfMk)}</span><b>${esc(kopfB)}</b></div>
      ${wahl}<label class="wo-feld"><span>${esc(feldName)}</span><textarea data-text rows="6" maxlength="2000">${esc(wert || '')}</textarea></label>
      <p class="mv-fe__hilfe">${esc(hilfe)}</p>
      <div class="wo-fe__reihe wo-fe__reihe--u"><span></span><div class="wo-fe__kn">${WO.knopf('Abbrechen', 'zurueck', 'hell', { klein: true, attr: 'data-zu' })}${WO.knopf('Speichern', 'haken', 'glas', { klein: true, attr: 'data-sp', disabled: true })}</div></div></div>`, kopfMk);
  const f = $('#fenster'), ta = $('[data-text]', f), sel = $('[data-kap]', f), kn = $('[data-sp]', f);
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  const anfang = [ta.value.trim(), sel ? sel.value : ''].join('|');
  const pruef = () => speicherKnopf(kn, ta.value.trim() && [ta.value.trim(), sel ? sel.value : ''].join('|') !== anfang && S.server !== false ? 'wartet' : 'glas');
  ta.oninput = pruef; if (sel) sel.onchange = pruef;
  kn.onclick = async () => {
    kn.disabled = true;
    try { await speichere(ta.value.trim(), sel ? sel.value : ''); speicherKnopf(kn, 'fertig'); setTimeout(fensterZu, 900); }
    catch (e) { melde(e.message, true); pruef(); }
  };
  setTimeout(() => ta.focus({ preventScroll: true }), 60);
}
function frageFenster(f, kapitel) {
  if (S.server === false) return melde('Ohne den Server lässt sich nichts speichern. Starten mit python3 zentrale/server.py.', true);
  if (f) return feldFenster({ kopfMk: 'Frage ändern', kopfB: kapName(f.kapitel), feldName: 'Deine Frage oder Notiz', wert: f.text, mitKapitel: true, kapitel: f.kapitel,
    hilfe: 'Nach dem Speichern siehst du vorher und nachher und kannst es rückgängig machen.',
    speichere: async (text, kap) => { const j = await api('PUT', 'fragen/' + f.id, { text, kapitel: kap, wer: WER() }); nachAenderung(j.frage, j.vorher, 'Frage geändert'); } });
  feldFenster({ kopfMk: 'Frage an Robert', kopfB: kapitel ? kapName(kapitel) : 'Neue Frage', feldName: 'Deine Frage oder Notiz', wert: '', mitKapitel: true, kapitel,
    hilfe: 'Robert sieht sie im Kapitel «Annas Fragen» und antwortet dort.',
    speichere: async (text, kap) => { const j = await api('POST', 'fragen', { text, kapitel: kap, wer: WER() }); nachNeu(j.frage); } });
}
function antwortFenster(f) {
  if (!f) return;
  feldFenster({ kopfMk: f.antwort ? 'Antwort ändern' : 'Antwort an ' + f.von, kopfB: f.text.length > 90 ? f.text.slice(0, 88) + ' …' : f.text, feldName: 'Antwort', wert: f.antwort, mitKapitel: false,
    hilfe: `${f.von} sieht die Antwort direkt unter der Frage.`,
    speichere: async text => { const j = await api('PUT', 'fragen/' + f.id, { antwort: text, wer: WER() }); nachAenderung(j.frage, j.vorher, f.antwort ? 'Antwort geändert' : 'Antwort gespeichert'); } });
}
function loeschFrage(f) {
  if (!f) return;
  fenster(`<div class="mv-rueck"><span class="wo-mk">Wirklich löschen?</span><b>${esc(kapName(f.kapitel))}</b><p>«${esc(f.text)}»</p>${f.antwort ? `<p class="mv-rueck__a">Die Antwort von Robert geht mit.</p>` : ''}
    <div class="wo-fe__kn">${WO.knopf('Behalten', 'zurueck', 'hell', { klein: true, attr: 'data-zu' })}${WO.knopf('Löschen', 'haken', 'dunkel', { klein: true, attr: 'data-ja' })}</div></div>`, 'Löschen');
  $$('#fenster [data-zu]').forEach(b => b.onclick = fensterZu);
  $('#fenster [data-ja]').onclick = async () => {
    try { const j = await api('DELETE', 'fragen/' + f.id); fensterZu(); S.fragen = S.fragen.filter(x => x.id !== f.id); neuZeichnen();
      quittung('Frage gelöscht', `«${kurz(f.text)}» ist gelöscht.`, { vorher: f, nachher: null }, async () => { const w = await api('POST', 'fragen/' + f.id + '/zurueck', { frage: j.weg }); S.fragen.push(w.frage); await ladeFragen(); neuZeichnen(); melde('Zurückgeholt'); }); }
    catch (e) { melde(e.message, true); }
  };
}
const kurz = (t, n = 60) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + ' …' : t; };
async function nachNeu(f) {
  await ladeFragen(); neuZeichnen(); if (S.ansicht === 'fragen') zeigeFrage(f.id);
  quittung('Frage gespeichert', `Zu «${kapName(f.kapitel)}». Robert sieht sie in der Zentrale.`, { vorher: null, nachher: f }, async () => { await api('DELETE', 'fragen/' + f.id); await ladeFragen(); neuZeichnen(); melde('Rückgängig gemacht'); });
}
async function nachAenderung(f, vorher, titel) {
  await ladeFragen(); neuZeichnen(); if (S.ansicht === 'fragen') zeigeFrage(f.id);
  quittung(titel, `«${kurz(f.text)}»`, { vorher, nachher: f }, async () => {
    await api('PUT', 'fragen/' + f.id, { text: vorher.text, kapitel: vorher.kapitel, antwort: vorher.antwort, wer: WER() }); await ladeFragen(); neuZeichnen(); melde('Rückgängig gemacht');
  });
}

/* ---------------------------------------------------------------- Quittung (vorher, nachher, Rückgängig) und Meldung */
function quittung(titel, satz, vn, zurueck) {
  const m = $('#meldung'); while (m.children.length >= 2) m.firstChild.remove();
  const q = document.createElement('div');
  q.className = 'wo-quittung'; q.setAttribute('role', 'status');
  q.innerHTML = `<i>${WO.ic('haken')}</i><span><b>${esc(titel)}</b>${esc(satz)}</span><a href="#" data-vn>Vorher, nachher</a><a href="#" data-rg>Rückgängig</a><button type="button" aria-label="Schliessen">${WO.ic('x')}</button>`;
  let zeit = setTimeout(() => q.remove(), 12000);
  q.onmouseenter = () => clearTimeout(zeit);
  q.querySelector('button').onclick = () => q.remove();
  q.querySelector('[data-vn]').onclick = e => { e.preventDefault(); vorherNachher(titel, vn); };
  q.querySelector('[data-rg]').onclick = async e => { e.preventDefault(); q.remove(); try { await zurueck(); } catch (x) { melde(x.message, true); } };
  m.appendChild(q);
}
function vorherNachher(titel, { vorher, nachher }) {
  const teil = (f, leer) => f ? `<p class="mv-vn__kap">${esc(kapName(f.kapitel))}</p><p>${esc(f.text)}</p>${f.antwort ? `<p class="mv-vn__a"><span>Antwort</span>${esc(f.antwort)}</p>` : ''}` : `<p class="mv-vn__leer">${esc(leer)}</p>`;
  fenster(`<div class="mv-vn"><span class="wo-mk">${esc(titel)}</span><div class="mv-vn__zwei"><div><b>Vorher</b>${teil(vorher, 'Noch nicht da.')}</div><div><b>Nachher</b>${teil(nachher, 'Gelöscht.')}</div></div></div>`, 'Vorher, nachher');
}
function melde(text, fehl = false) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(text)}</b></div><button type="button" aria-label="Schliessen">${ZU}</button>`;
  q.querySelector('button').onclick = () => q.remove();
  m.appendChild(q);
  setTimeout(() => q.remove(), fehl ? 9000 : 2600);
}

/* ---------------------------------------------------------------- Start */
function startfehler(grund) {
  window.MV_BEREIT = true; clearTimeout(window.MV_LADE);
  document.documentElement.classList.remove('mv-wartet');
  $('#ansicht').innerHTML = `<div class="platte li-tuer" role="alert"><h1>${esc(NAME)} startet nicht.</h1><p class="li-tuer__g">${esc(grund)}</p><p>Hilft «Neu laden» nicht: die Anleitung öffnen oder Robert Bescheid geben.</p>
    <div class="li-tuer__kn">${WO.knopf('Neu laden', 'zurueck', 'dunkel', { attr: 'data-neu-laden' })}${WO.knopf('Anleitung', 'buch', 'hell', { href: 'anleitung.html', neu: true })}</div></div>`;
  const b = $('#ansicht [data-neu-laden]'); if (b) b.onclick = () => location.reload();
}
/* Auftakt wie Le Livre (R02): warten, bis die Schriften und das Foto der ersten Bühne da sind, höchstens 1,2 s, dann alles auf einmal */
function bereit(ansicht) {
  const k = kapVon(ansicht), src = ansicht === 'start' ? H.foto : ansicht === 'fragen' ? FOTO(RA.fragen.foto) : FOTO(k.foto);
  const bild = new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; if (i.decode) i.decode().then(r, r); });
  return Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, bild]), new Promise(r => setTimeout(r, 1200))]);
}
function ansichtAusHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (/^fragen-/.test(h)) return { a: 'fragen', id: h.slice(7) };
  return ANSICHTEN.includes(h) ? { a: h } : null;
}
(async function () {
  try {
    if (!KAP.length || !window.WO) throw new Error(!KAP.length ? 'Der Inhalt der Kapitel (kapitel.js) fehlt.' : 'Das Kleid (oberflaeche.js) fehlt.');
    document.title = `${NAME} · Tasty Studios`;
    let ziel = ansichtAusHash();
    if (!ziel) { try { const l = localStorage.getItem('tasty-mv-ansicht'); ziel = { a: ANSICHTEN.includes(l) && !H.imRahmen ? l : 'start' }; } catch (e) { ziel = { a: 'start' }; } }
    S.ansicht = ziel.a;
    await Promise.all([bereit(S.ansicht), ladeFragen()]);
    clearTimeout(window.MV_LADE);
    kopf(); rand(); leiste(); zeichne();
    document.documentElement.classList.remove('mv-wartet');
    if (ziel.id) setTimeout(() => zeigeFrage(ziel.id), 400);
    document.body.classList.add('li-bereit'); window.MV_BEREIT = true;
  } catch (e) { return startfehler(String(e && e.message || e).slice(0, 200)); }
  addEventListener('hashchange', () => { const z = ansichtAusHash(); if (!z) return; if (z.a !== S.ansicht) gehe(z.a); if (z.id) setTimeout(() => zeigeFrage(z.id), 300); });
})();
