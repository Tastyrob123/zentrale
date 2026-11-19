/* Content-Plan · Arbeitsfläche (13.11.2026). Robert: «entwirf den ganzen Bereich nochmal, so dass sie das auch wirklich als Arbeitsgrundlage nehmen kann
   und alles manuell bearbeiten kann … Kalender soll verknüpft sein mit den Bereichen selber … professionelles, hochwertiges Bearbeitungswerkzeug mit dem Feed».
   Aufbau: Kleid des Social Cockpits (Kopf, Rand, Leiste, Quittung mit «Rückgängig»). Rand = die Bereiche (Phasen, Themen, Formate, Kanäle, Rhythmus, Ziele,
   Grundlage, Zum Weiterdenken, Ideen). Jede Ansicht: oben der Bereich zum Bearbeiten, darunter derselbe Kalender (Bereich hervorgehoben), rechts der Feed.
   Ein Klick auf einen Beitrag öffnet ihn rechts in der Schublade: Bild, Titel, Tag, Phase, Thema, Format, Kanäle, Stand, Texte je Kanal mit Vorschau.
   Daten: api.py (cockpit.json), dieselbe Quelle wie das Cockpit. Postet nichts, kostet nichts. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ORDNER = '14-social-cockpit', API = '/zentrale/api/' + ORDNER + '/';
const H = window.WO_HAUS || {};
if (H.namen) H.namen[ORDNER] = 'Social Cockpit';   /* ein Werkzeug: Cockpit und Planung tragen denselben Namen und denselben Rand */
const WER = () => H.wer || 'Anna';
const zahl = n => Number(n || 0).toLocaleString('de-CH');
const kurz = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const kopie = o => JSON.parse(JSON.stringify(o == null ? null : o));
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const HANDY = () => matchMedia('(max-width: 900px)').matches;
const mz = (n, eins, viele) => (n === 1 ? 'ein' + (/e$/.test(eins) ? 'e' : '') : zahl(n)) + ' ' + (n === 1 ? eins : viele);
const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const dObj = s => new Date(s + 'T12:00');
const plusTage = (s, n) => { const d = dObj(s); d.setDate(d.getDate() + n); return iso(d); };
const wocheVon = s => { const d = dObj(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
const datumLang = s => s ? `${TAGE[(dObj(s).getDay() + 6) % 7]}, ${dObj(s).getDate()}. ${MONATE[dObj(s).getMonth()]}` : '';
const datumKurz = s => s ? `${dObj(s).getDate()}. ${MONATE[dObj(s).getMonth()].slice(0, 3)}` : '';
const datumZahl = s => s ? `${dObj(s).getDate()}.${dObj(s).getMonth() + 1}.${dObj(s).getFullYear()}` : '';
const FARBEN = ['#c9a376', '#a07a52', '#9e947f', '#6f6656', '#5f7f8a', '#3e4a6b', '#1f213b', '#7d8a5a', '#a4473d', '#b08aa0'];
const GRENZE = { linkedin: { zeichen: 3000, sichtbar: 150 }, instagram: { zeichen: 2200, sichtbar: 125, bildPflicht: true }, tiktok: { zeichen: 2200, bildPflicht: true },
  facebook: { zeichen: 63206 }, pinterest: { zeichen: 500, titel: 100, bildPflicht: true }, google: { zeichen: 1500 }, newsletter: { eigen: true } };
const STAENDE = [['idee', 'Idee'], ['entwurf', 'Entwurf'], ['geprueft', 'Geprüft'], ['freigegeben', 'Freigegeben'], ['geplant', 'Geplant'], ['draussen', 'Draussen']];
const STAND = Object.fromEntries(STAENDE.concat([['verworfen', 'Verworfen']]));
const FEEDS = ['instagram', 'tiktok', 'linkedin', 'pinterest', 'google'];
const ZU = '<svg class="wo-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/* ---------------------------------------------------------------- Zustand */
const S = { d: null, ansicht: 'kalender', monat: '', kal: '', kf: [], feed: 'instagram', vergangene: false, offen: '', e: null, b: null, bildwahl: false, reiter: '' };
const ST = () => S.d.strategie;
const phasen = () => (ST().phasen || []);
const themen = () => (ST().themen || []);
const formate = () => (ST().formate || []);
const kanaele = () => (S.d.reihe || Object.keys(S.d.kanaele)).map(k => S.d.kanaele[k]).filter(Boolean);
const kanal = id => S.d.kanaele[id];
const kname = id => ((kanal(id) || {}).name || id).replace('-Unternehmensprofil', '');
const beitraege = () => Object.values(S.d.beitraege).filter(b => b.stand !== 'verworfen');
const beitrag = id => S.d.beitraege[id];
const heute = () => S.d.heute || iso(new Date());
const thema = k => themen().find(t => t.k === k);
const format = k => formate().find(f => f.k === k);
const phase = id => phasen().find(p => p.id === id);
const phaseVon = s => s ? phasen().find(p => p.von && p.bis && s >= p.von && s <= p.bis) : null;
const geplant = () => beitraege().filter(b => b.datum);
const imPlan = () => geplant().filter(b => b.datum >= heute());
const ohneTag = () => beitraege().filter(b => !b.datum && !/^Feed-Entwurf/.test(b.gruppe || ''));
const welt = k => (window.SO_WELT || {})[k] || {};
const kStil = k => `--k:${welt(k).farbe || '#1f213b'}`;
const tFarbe = b => (thema(b.thema) || {}).farbe || '#9e947f';
const textVon = (b, k) => (((b.fassungen || {})[k] || {}).text || '');
const ersterText = b => { for (const k of (b.kanaele || [])) { const t = textVon(b, k); if (t) return t; } return Object.values(b.fassungen || {}).map(f => f.text).find(Boolean) || b.notiz || ''; };
const bild = (b, art, kl = '') => b.bild ? `<img class="${kl}" src="${esc(b.bild)}?${art}" alt="" loading="lazy" decoding="async" draggable="false">` : soGrafik(b, kl);

/* Welcher Bereich ist gerade offen, und welche Beiträge gehören dazu (die Verknüpfung zwischen Bereich, Kalender und Feed) */
function bereich() {
  const a = S.ansicht, i = a.indexOf(':');
  return i < 0 ? { art: a, id: '' } : { art: a.slice(0, i), id: a.slice(i + 1) };
}
function passt(b) {
  const { art, id } = bereich();
  if (S.kf.length && !(b.kanaele || []).some(k => S.kf.includes(k))) return false;
  if (art === 'phase') { const p = phase(id); return !!(p && b.datum && b.datum >= p.von && b.datum <= p.bis); }
  if (art === 'thema') return b.thema === id;
  if (art === 'format') return b.format === id;
  if (art === 'kanal') return (b.kanaele || []).includes(id);
  return true;
}
const hervor = () => ['phase', 'thema', 'format', 'kanal'].includes(bereich().art) || S.kf.length > 0;

function gueltig(a) {
  /* schlank (Robert 17.11.2026): Themen, Formate, Ziele, Fragen, Phasen sind keine eigenen Seiten mehr, alte Adressen landen im Kalender */
  return ['kalender', 'rhythmus', 'ideen'].includes(a);
}
function ansichtName(a) {
  const { art, id } = bereich();
  if (art === 'phase') { const p = phase(id); return p ? `${p.name} · ${p.titel}` : 'Phase'; }
  if (art === 'thema') return (thema(id) || {}).t || 'Thema';
  if (art === 'format') return (format(id) || {}).t || 'Format';
  if (art === 'kanal') return kname(id);
  return { kalender: 'Kalender', rhythmus: 'Rhythmus', ideen: 'Ideen' }[a] || 'Social Cockpit';
}

/* ---------------------------------------------------------------- Kopf, Rand, Leiste */
function kopf() {
  const p = imPlan(), letzt = p.reduce((m, b) => b.datum > m ? b.datum : m, ''), w = p.length ? Math.floor((dObj(letzt) - dObj(wocheVon(heute()))) / 6048e5) + 1 : 0;
  const z = p.length ? `${mz(p.length, 'Beitrag', 'Beiträge')} in ${mz(w, 'Woche', 'Wochen')}` : 'Noch nichts geplant';
  $('#kopf').innerHTML = WO.kopf({ werkzeug: ORDNER, unter: 'Kommunikation', titel: ansichtName(S.ansicht), stand: z, website: (H.wege && H.wege.website) || '/zentrale/seite/index.html', markeHref: '../#start' });
}
function rand() {
  $('#rand').innerHTML = WO.rand(soWege(S.d, 'plan', S.ansicht), {});
  soWegeSchmuck($('#rand'), 'plan', (H.wege && H.wege.zentrale) || '/zentrale/', WO.ic);
}
function leiste() {
  let titel, satz, kn;
  const offenGeaendert = S.e && S.e.geaendert, bereichGeaendert = S.b && S.b.geaendert;
  if (offenGeaendert || bereichGeaendert) {
    titel = offenGeaendert ? 'Beitrag nicht gespeichert' : 'Bereich nicht gespeichert';
    satz = 'Speichern, damit es bleibt. Danach steht die Quittung mit «Rückgängig» unten.';
    kn = WO.knopf('Verwerfen', 'x', 'glas', { klein: true, attr: 'data-verwerfen' }).replace(WO.ic('x'), ZU) + WO.knopf('Speichern', 'haken', 'gold', { klein: true, attr: 'data-alles-speichern' });
  } else {
    const n = imPlan().filter(b => b.datum >= heute()).sort((a, b) => a.datum.localeCompare(b.datum))[0];
    titel = n ? 'Als Nächstes: ' + kurz(n.titel, 48) : 'Content-Plan';
    satz = n ? `${datumLang(n.datum)} · ${(n.kanaele || []).map(kname).join(' und ')}` : 'Einen Beitrag anlegen und auf einen Tag legen.';
    kn = (n ? WO.knopf('Öffnen', 'stift', 'glas', { klein: true, attr: `data-oeffne="${esc(n.id)}"` }) : '') + WO.knopf('Neuer Beitrag', 'plus', 'gold', { klein: true, attr: 'data-neu' });
  }
  $('#leiste').innerHTML = WO.leiste({ titel, satz, knoepfe: kn });
  $$('#leiste [data-neu]').forEach(x => x.onclick = () => neuerBeitrag(vorlageNeu()));
  $$('#leiste [data-oeffne]').forEach(x => x.onclick = () => oeffne(x.dataset.oeffne));
  $$('#leiste [data-alles-speichern]').forEach(x => x.onclick = allesSpeichern);
  $$('#leiste [data-verwerfen]').forEach(x => x.onclick = () => { if (S.e && S.e.geaendert) { S.e = null; S.offen = ''; schublade(); } if (S.b) { S.b = null; } neuZeichnen(); });
}
function allesSpeichern() { if (S.e && S.e.geaendert) return speichereBeitrag(); if (S.b && S.b.geaendert) return speichereBereich(); }

/* ---------------------------------------------------------------- Wege */
function gehe(a, oben = true) {
  if (/^kanal:/.test(a || '')) { location.href = '../#' + a; return; }   /* die Kanäle leben im Cockpit */
  if (!gueltig(a)) a = 'kalender';
  if (S.b && S.b.geaendert && a !== S.ansicht && !confirm('Am Bereich ist etwas nicht gespeichert. Trotzdem wechseln?')) return;
  S.ansicht = a; S.b = null;
  const { art, id } = bereich();
  if (art === 'phase') S.monat = (phase(id).von || heute()).slice(0, 7);
  else if (['thema', 'format', 'kanal'].includes(art)) { const f = imPlan().filter(passt).sort((x, y) => x.datum.localeCompare(y.datum))[0]; S.monat = (f ? f.datum : heute()).slice(0, 7); }
  if (art === 'kanal' && FEEDS.includes(id)) S.feed = id;
  history.replaceState(null, '', location.pathname + '#' + a);
  try { localStorage.setItem('tasty-plan-ansicht', a); } catch (e) { /* privat */ }
  kopf(); rand(); leiste(); zeichne();
  if (oben) scrollTo({ top: 0 });
}
function neuZeichnen() { const y = scrollY; kopf(); rand(); leiste(); zeichne(); scrollTo({ top: y }); }
function zeichne() {
  /* schlank (Robert 17.11.2026: «Kalender … mit diesem Feed daneben macht keinen Sinn»): der Kalender allein, volle Breite; Ideen als eigene Seite */
  const { art } = bereich();
  $('#ansicht').innerHTML = art === 'ideen' ? `<div class="ap-oben" data-ap-ein>${ideenKopf()}</div>`
    : `${art === 'rhythmus' ? `<div class="ap-oben" data-ap-ein>${rhythmusKopf()}</div>` : ''}<div class="ap-flaeche ap-flaeche--voll">${kalender()}${ablage()}</div>`;
  leben($('#ansicht'));
  auftritte();
}
/* Was unterhalb des Bildschirms liegt, schwebt beim Scrollen herein (nur transform/opacity) */
let rvBeob = null;
function auftritte() {
  if (RUHIG() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('ap-rv');
  if (!rvBeob) rvBeob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('da'); rvBeob.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('#ansicht .ap-ablage, #ansicht .ap-wo__w, #ansicht .ap-gruppe').forEach(x => {
    if (x.getBoundingClientRect().top > innerHeight) { x.classList.add('ap-rvb'); rvBeob.observe(x); }
  });
}

/* ---------------------------------------------------------------- Bausteine oben: je Bereich */
const stat = (z, t) => `<div class="ap-st"><b>${z}</b><span>${esc(t)}</span></div>`;
const zeitstrahl = () => {
  const ph = phasen().filter(p => p.von && p.bis); if (!ph.length) return '';
  const a = ph[0].von, z = ph[ph.length - 1].bis, lang = Math.max(1, (dObj(z) - dObj(a)) / 864e5 + 1), h = heute();
  const pos = s => Math.min(100, Math.max(0, (dObj(s) - dObj(a)) / 864e5 / lang * 100));
  return `<div class="ap-zeit" role="list">${ph.map(p => { const n = geplant().filter(b => b.datum >= p.von && b.datum <= p.bis).length, an = S.ansicht === 'phase:' + p.id;
    return `<button type="button" role="listitem" class="ap-zeit__p${an ? ' an' : ''}" style="--c:${esc(p.farbe)};left:${pos(p.von)}%;width:${pos(plusTage(p.bis, 1)) - pos(p.von)}%" data-gehe="phase:${esc(p.id)}">
      <b>${esc(p.name)} · ${esc(p.titel)}</b><small>${datumKurz(p.von)} bis ${datumKurz(p.bis)} · ${mz(n, 'Beitrag', 'Beiträge')}</small></button>`; }).join('')}
    ${h >= a && h <= z ? `<span class="ap-zeit__heute" style="left:${pos(h)}%"><em>Heute</em></span>` : ''}
    <div class="ap-zeit__punkte">${geplant().filter(b => b.datum >= a && b.datum <= z).map(b => `<i style="left:${pos(b.datum)}%;--c:${esc(tFarbe(b))}" title="${esc(datumKurz(b.datum) + ' · ' + b.titel)}"></i>`).join('')}</div></div>`;
};
function ueberblick() {
  const p = imPlan(), offen = (ST().fragen || []).filter(f => !f.a).length;
  const ist = themen().map(t => [t, p.filter(b => b.thema === t.k).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  return `<section class="ap-kopf ap-kopf--platte">
    <div class="ap-kopf__t"><p class="wo-mk">Schritt 2 · Planen</p><h1 class="ap-h">Der <em>Kalender.</em></h1>
      <p class="ap-satz">Hier liegt jeder Beitrag auf seinem Tag. Ein Klick öffnet ihn zum Ändern, Ziehen legt ihn auf einen anderen Tag, das Plus auf einem freien Tag legt einen neuen an.</p>
      <div class="ap-kopf__kn">${WO.knopf('Neuer Beitrag', 'plus', 'gold', { klein: true, attr: 'data-neu' })}</div></div>
    <div class="ap-sts">${stat(zahl(p.length), 'Beiträge ab heute')}${stat(zahl(ohneTag().length), 'Ideen ohne Tag')}${stat(zahl(offen), 'offene Fragen')}</div>
    <p class="ap-zwi">Die Themen im Plan <span>· worüber die Beiträge sprechen, ein Klick zeigt sie im Kalender</span></p>
    <div class="ap-mix">${ist.map(([t, n]) => `<button type="button" class="ap-mix__t" style="flex:${n}" data-gehe="thema:${esc(t.k)}" title="${esc(t.t)}: ${n}"><span>${esc(t.t)}</span><b>${n}</b></button>`).join('')}</div>
  </section>`;
}
/* Formular eines Bereichs: Felder ändern S.b (Entwurf), «Speichern» schreibt die Strategie oder den Kanal */
function bereichEntwurf(feld, liste) {
  if (!S.b || S.b.feld !== feld) S.b = { feld, f: kopie(liste), geaendert: false };
  return S.b.f;
}
const fld = (name, titel, wert, o = {}) => `<label class="ap-f${o.breit ? ' ap-f--breit' : ''}"><span>${esc(titel)}</span>${o.zeilen ? `<textarea name="${name}" rows="${o.zeilen}" spellcheck="true" lang="de">${esc(wert || '')}</textarea>`
  : `<input name="${name}" value="${esc(wert || '')}"${o.typ ? ` type="${o.typ}"` : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}>`}</label>`;
const farbwahl = (name, wert) => `<div class="ap-f ap-f--farbe"><span>Farbe</span><div class="ap-farben" role="radiogroup">${FARBEN.map(c => `<button type="button" role="radio" aria-checked="${c === wert}" class="${c === wert ? 'an' : ''}" style="--c:${c}" data-farbe-feld="${name}" data-farbe="${c}" aria-label="Farbe ${c}"></button>`).join('')}</div></div>`;
const bkn = (titel, extra = '') => `<div class="ap-bkn">${WO.knopf('Speichern', 'haken', S.b && S.b.geaendert ? 'gold' : 'dunkel', { klein: true, attr: 'data-bereich-speichern', disabled: !(S.b && S.b.geaendert) })}${extra.replace(/wo-kn--glas/g, 'wo-kn--dunkel')}</div>`;
const mixBalken = l => { const ist = themen().map(t => [t, l.filter(b => b.thema === t.k).length]).filter(x => x[1]); return ist.length ? `<div class="ap-mix ap-mix--klein">${ist.map(([t, n]) => `<span class="ap-mix__t" style="--c:${esc(t.farbe)};flex:${n}" title="${esc(t.t)}: ${n}"><span>${esc(t.t)}</span><b>${n}</b></span>`).join('')}</div>` : ''; };
const kanalZahl = l => { const c = {}; l.forEach(b => (b.kanaele || []).forEach(k => { c[k] = (c[k] || 0) + 1; })); return `<div class="ap-kz">${Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span>${soLogo(k, 'so-lg--s')}<b>${n}</b></span>`).join('') || '<small>noch keine</small>'}</div>`; };

function wechsler(art) {
  const l = art === 'phase' ? phasen().map(p => [p.id, `${p.name} · ${p.titel}`]) : art === 'thema' ? themen().map(t => [t.k, t.t]) : art === 'format' ? formate().map(f => [f.k, f.t])
    : kanaele().filter(k => !(GRENZE[k.id] || {}).eigen).map(k => [k.id, kname(k.id)]);
  const id = bereich().id;
  return `<nav class="ap-wechsel" aria-label="Auswahl">${l.map(([k, t]) => `<button type="button" class="${k === id ? 'an' : ''}" data-gehe="${art}:${esc(k)}">${art === 'kanal' ? soLogo(k, 'so-lg--s') : ''}${esc(t)}</button>`).join('')}</nav>`;
}
function phaseKopf() {
  const id = bereich().id, l = bereichEntwurf('phasen', phasen()), i = l.findIndex(p => p.id === id), p = l[i] || {};
  const drin = geplant().filter(b => b.datum >= p.von && b.datum <= p.bis);
  return `<section class="ap-kopf" style="--c:${esc(p.farbe)}">${wechsler('phase')}<form class="ap-form" data-liste="phasen" data-i="${i}">
    <div class="ap-kopf__t"><p class="wo-mk"><i class="ap-pkt" style="--c:${esc(p.farbe)}"></i>${esc(p.name)} von ${phasen().length} · ${datumZahl(p.von)} bis ${datumZahl(p.bis)}</p><h1 class="ap-h">${esc(p.titel || 'Ohne Titel')}</h1><p class="ap-satz">Eine Phase ist ein Zeitraum von einigen Wochen mit einem gemeinsamen Ziel. Jeder Beitrag, dessen Tag in diesen Zeitraum fällt, gehört automatisch dazu.</p></div>
    <div class="ap-raster">${fld('name', 'Name', p.name)}${fld('titel', 'Titel', p.titel)}${fld('von', 'Von', p.von, { typ: 'date' })}${fld('bis', 'Bis', p.bis, { typ: 'date' })}
      ${fld('ziel', 'Was diese Phase erreichen soll', p.ziel, { zeilen: 3, breit: true })}</div>
    <div class="ap-kopf__fuss"><div class="ap-sts ap-sts--klein">${stat(zahl(drin.length), 'Beiträge')}${stat(zahl(Math.round((dObj(p.bis) - dObj(p.von)) / 864e5 + 1) || 0), 'Tage')}</div>${kanalZahl(drin)}${mixBalken(drin)}</div>
    ${bkn('Phase', WO.knopf('Neue Phase', 'plus', 'glas', { klein: true, attr: 'data-neue-phase' }) + (l.length > 1 ? WO.knopf('Phase entfernen', 'x', 'glas', { klein: true, attr: 'data-weg="phasen"' }).replace(WO.ic('x'), ZU) : ''))}
  </form>${zeitstrahl()}</section>`;
}
function themaKopf() {
  const id = bereich().id, l = bereichEntwurf('themen', themen()), i = l.findIndex(t => t.k === id), t = l[i] || {};
  const p = imPlan(), drin = p.filter(b => b.thema === id), ist = p.length ? Math.round(drin.length / p.length * 100) : 0, ziel = +t.anteil || 0;
  return `<section class="ap-kopf" style="--c:${esc(t.farbe)}">${wechsler('thema')}<form class="ap-form" data-liste="themen" data-i="${i}">
    <div class="ap-kopf__t"><p class="wo-mk"><i class="ap-pkt" style="--c:${esc(t.farbe)}"></i>Thema · ${mz(drin.length, 'Beitrag', 'Beiträge')} ab heute</p><h1 class="ap-h">${esc(t.t || 'Ohne Namen')}</h1><p class="ap-satz">Ein Thema sagt, worüber ein Beitrag spricht. Jeder Beitrag hat eines. Den gewünschten Anteil eintragen, dann zeigt der Balken, ob das Thema zu kurz kommt.</p></div>
    <div class="ap-raster">${fld('t', 'Name', t.t)}${fld('anteil', 'Gewünschter Anteil in Prozent', t.anteil, { typ: 'number', ph: 'z. B. 20' })}${fld('s', 'Worum es geht', t.s, { zeilen: 3, breit: true })}</div>
    <div class="ap-kopf__fuss"><div class="ap-anteil"><div class="ap-anteil__bar"><i style="width:${ist}%"></i>${ziel ? `<em style="left:${Math.min(100, ziel)}%" title="Gewünscht ${ziel} %"></em>` : ''}</div>
      <p><b>${ist} %</b> des Plans${ziel ? `, gewünscht ${ziel} %${Math.abs(ist - ziel) > 4 ? ist > ziel ? ' · mehr als gewünscht' : ' · weniger als gewünscht' : ' · passt'}` : ''}</p></div>${kanalZahl(drin)}</div>
    ${bkn('Thema', WO.knopf('Neues Thema', 'plus', 'glas', { klein: true, attr: 'data-neu-eintrag="themen"' }) + WO.knopf('Thema entfernen', 'x', 'glas', { klein: true, attr: 'data-weg="themen"' }).replace(WO.ic('x'), ZU))}
  </form></section>`;
}
function formatKopf() {
  const id = bereich().id, l = bereichEntwurf('formate', formate()), i = l.findIndex(f => f.k === id), f = l[i] || {};
  const drin = imPlan().filter(b => b.format === id), ks = kanaele().filter(k => !(GRENZE[k.id] || {}).eigen);
  return `<section class="ap-kopf" style="--c:${esc(f.farbe)}">${wechsler('format')}<form class="ap-form" data-liste="formate" data-i="${i}">
    <div class="ap-kopf__t"><p class="wo-mk"><i class="ap-pkt" style="--c:${esc(f.farbe)}"></i>Format · ${mz(drin.length, 'Beitrag', 'Beiträge')} ab heute</p><h1 class="ap-h">${esc(f.t || 'Ohne Namen')}</h1><p class="ap-satz">Ein Format sagt, wie ein Beitrag aussieht: ein Bild, ein kurzes Video, ein Text. Jeder Beitrag hat eines.</p></div>
    <div class="ap-raster">${fld('t', 'Name', f.t)}<div class="ap-f"><span>Für welche Kanäle</span><div class="ap-kwahl">${ks.map(k => { const an = (f.kanaele || []).includes(k.id);
      return `<button type="button" class="${an ? 'an' : ''}" style="${kStil(k.id)}" data-kanal-feld="kanaele" data-kanal="${esc(k.id)}" aria-pressed="${an}">${soLogo(k.id, 'so-lg--s')}<span>${esc(kname(k.id))}</span></button>`; }).join('')}</div></div>
      ${fld('s', 'Wie das Format aussieht', f.s, { zeilen: 3, breit: true })}</div>
    <div class="ap-kopf__fuss"><div class="ap-sts ap-sts--klein">${stat(zahl(drin.length), 'Beiträge')}</div>${kanalZahl(drin)}${mixBalken(drin)}</div>
    ${bkn('Format', WO.knopf('Neues Format', 'plus', 'glas', { klein: true, attr: 'data-neu-eintrag="formate"' }) + WO.knopf('Format entfernen', 'x', 'glas', { klein: true, attr: 'data-weg="formate"' }).replace(WO.ic('x'), ZU))}
  </form></section>`;
}
function kanalKopf() {
  const id = bereich().id, k = kanal(id) || {};
  if (!S.b || S.b.feld !== 'kanal:' + id) S.b = { feld: 'kanal:' + id, f: kopie(k), geaendert: false };
  const f = S.b.f, drin = imPlan().filter(b => (b.kanaele || []).includes(id));
  return `<section class="ap-kopf ap-kopf--kanal" style="${kStil(id)}">${wechsler('kanal')}<form class="ap-form" data-kanal-form="${esc(id)}">
    <div class="ap-kopf__t ap-kopf__t--logo">${soLogo(id, 'so-lg--l')}<div><p class="wo-mk">${esc(f.handle || '')} · ${esc(f.stand || '')}</p><h1 class="ap-h">${esc(kname(id))}</h1></div></div>
    <div class="ap-raster">${fld('rolle', 'Rolle im Plan', f.rolle, { zeilen: 3, breit: true })}${fld('takt', 'Takt', f.takt)}${fld('formate', 'Formate', f.formate)}${fld('konzept', 'Konzept', f.konzept, { zeilen: 3, breit: true })}</div>
    <div class="ap-kopf__fuss"><div class="ap-sts ap-sts--klein">${stat(zahl(drin.length), 'Beiträge ab heute')}</div>${mixBalken(drin)}</div>
    ${bkn('Kanal', WO.knopf('Kanal im Cockpit', 'pfeil', 'glas', { klein: true, href: '../#kanal:' + encodeURIComponent(id) }))}
  </form></section>`;
}
function zeilenListe(feld, felder, titel, satz, neuText) {
  const l = bereichEntwurf(feld, ST()[feld] || []);
  return `<section class="ap-kopf"><div class="ap-kopf__t"><p class="wo-mk">Grundlage</p><h1 class="ap-h">${titel}</h1><p class="ap-satz">${esc(satz)}</p></div>
    <form class="ap-form" data-zeilen="${feld}"><div class="ap-zeilen">${l.map((r, i) => `<div class="ap-zeile" data-i="${i}">${felder.map(([n, t, o]) => o && o.wahl ? `<label class="ap-f"><span>${esc(t)}</span><select name="${n}">${o.wahl().map(([v, x]) => `<option value="${esc(v)}"${v === (r[n] || '') ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` : fld(n, t, r[n], o || {})).join('')}
      <button type="button" class="ap-zeile__weg" data-zeile-weg="${i}" aria-label="Zeile entfernen">${ZU}</button></div>`).join('') || '<p class="ap-ruhig">Noch nichts eingetragen.</p>'}</div>
    ${bkn(titel, WO.knopf(neuText, 'plus', 'glas', { klein: true, attr: `data-zeile-neu="${feld}"` }))}</form></section>`;
}
const wahlKanal = () => [['', 'frei']].concat(kanaele().filter(k => !(GRENZE[k.id] || {}).eigen).map(k => [k.id, kname(k.id)]));
const wahlThema = () => [['', '–']].concat(themen().map(t => [t.k, t.t]));
const wahlFormat = () => [['', '–']].concat(formate().map(f => [f.k, f.t]));
function rhythmusKopf() {
  /* sieben feste Tage; im Kalender stehen freie Tage mit ihrem Rhythmus als leiser Platzhalter, ein Klick legt den Beitrag an */
  const alt = ST().rhythmus || [];
  if (!S.b || S.b.feld !== 'rhythmus') S.b = { feld: 'rhythmus', f: TAGE.map(t => Object.assign({ tag: t, kanal: '', format: '', thema: '' }, alt.find(r => r.tag === t) || {})), geaendert: false };
  const l = S.b.f, h = heute(), w0 = wocheVon(h);
  const treffer = l.filter(r => r.kanal).map(r => { const n = [0, 1, 2, 3].map(w => plusTage(w0, w * 7 + TAGE.indexOf(r.tag))).filter(t => t >= h); const voll = n.filter(t => geplant().some(b => b.datum === t)); return [r, n.length, voll.length]; });
  return `<section class="ap-kopf"><div class="ap-kopf__t"><p class="wo-mk">Kalender · die Woche</p><h1 class="ap-h">Rhythmus</h1><p class="ap-satz">Welcher Tag welchem Kanal gehört. Im Kalender wartet an diesen Tagen ein leerer Platz, ein Klick legt dort den Beitrag an.</p></div>
    <form class="ap-form" data-rhythmus><div class="ap-woche">${l.map((r, i) => `<div class="ap-wt${r.kanal ? ' an' : ''}" data-i="${i}" style="${r.kanal ? kStil(r.kanal) : ''}"><b>${r.tag.slice(0, 2)}</b>${r.kanal ? soLogo(r.kanal, 'so-lg--s') : '<i class="ap-wt__frei"></i>'}
      <label class="ap-f"><span>Kanal</span><select name="kanal">${wahlKanal().map(([v, x]) => `<option value="${esc(v)}"${v === r.kanal ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="ap-f"><span>Format</span><input name="format" value="${esc(r.format || '')}" placeholder="z. B. Reel"></label>
      <label class="ap-f"><span>Thema</span><select name="thema">${wahlThema().map(([v, x]) => `<option value="${esc(v)}"${v === r.thema ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label></div>`).join('')}</div>
    <div class="ap-kopf__fuss"><div class="ap-kz">${treffer.map(([r, n, v]) => `<span title="${esc(r.tag)}">${soLogo(r.kanal, 'so-lg--s')}<b>${v}/${n}</b></span>`).join('')}<small>belegt in den nächsten vier Wochen</small></div></div>
    ${bkn('Rhythmus')}</form></section>`;
}
const zieleKopf = () => zeilenListe('ziele', [['t', 'Ziel'], ['zeitraum', 'Bis wann', { ph: 'z. B. Ende Phase 2' }], ['kanal', 'Kanal', { wahl: wahlKanal }], ['ziel', 'Woran wir es merken', { breit: true }]],
  'Ziele', 'Was der Plan erreichen soll und woran man es sieht. Bewusst ohne erfundene Zahlen: eintragen, was wir gemeinsam festlegen.', 'Neues Ziel');
function grundlageKopf() {
  if (!S.b || S.b.feld !== 'grundlage') S.b = { feld: 'grundlage', f: { haltung: ST().haltung || '', regeln: kopie(ST().regeln || []) }, geaendert: false };
  const f = S.b.f;
  const teile = [['phase:' + ((phasen()[0] || {}).id || ''), 'Phasen', 'Zeiträume von einigen Wochen, jeder mit einem Ziel.', phasen().map(p => p.titel).join(' · ')],
    ['thema:' + ((themen()[0] || {}).k || ''), 'Themen', 'Worüber die Beiträge sprechen.', mz(themen().length, 'Thema', 'Themen')],
    ['format:' + ((formate()[0] || {}).k || ''), 'Formate', 'Wie ein Beitrag aussieht: Bild, Video, Text.', formate().map(f => f.t).slice(0, 4).join(' · ')],
    ['rhythmus', 'Rhythmus', 'Welcher Wochentag welchem Kanal gehört.', (ST().rhythmus || []).filter(r => r.kanal).map(r => r.tag.slice(0, 2) + ' ' + kname(r.kanal)).join(' · ') || 'noch frei'],
    ['ziele', 'Ziele', 'Was der Plan erreichen soll.', (ST().ziele || []).length ? mz((ST().ziele || []).length, 'Ziel', 'Ziele') : 'noch keine eingetragen'],
    ['fragen', 'Offene Fragen', 'Was wir noch gemeinsam klären.', mz((ST().fragen || []).filter(x => !x.a).length, 'Frage offen', 'Fragen offen')]];
  return `<section class="ap-kopf"><div class="ap-kopf__t"><p class="wo-mk">Schritt 1 · Grundlage</p><h1 class="ap-h">Die <em>Grundlage.</em></h1><p class="ap-satz">Worum es geht und wann. Einmal festlegen, danach richtet sich jeder Beitrag im Kalender danach. Ein Klick öffnet den Teil zum Bearbeiten.</p></div>
    <div class="ap-teile">${teile.map(([k, t, s, w], i) => `<a class="ap-teil" href="#${esc(k)}"><span class="ap-teil__n">${i + 1}</span><b>${esc(t)}</b><span>${esc(s)}</span><small>${esc(w)}</small></a>`).join('')}</div>
    <h2 class="ap-h2">Haltung und Regeln</h2><p class="ap-satz">Woran sich jeder Beitrag hält. Gilt für alle Kanäle.</p>
    <form class="ap-form" data-grundlage><div class="ap-raster">${fld('haltung', 'Haltung', f.haltung, { zeilen: 4, breit: true })}</div>
    <div class="ap-zeilen">${f.regeln.map((r, i) => `<div class="ap-zeile ap-zeile--eins" data-i="${i}"><span class="ap-zeile__n">${String(i + 1).padStart(2, '0')}</span><label class="ap-f ap-f--breit"><span>Regel</span><textarea name="regel" rows="2" spellcheck="true" lang="de">${esc(r)}</textarea></label><button type="button" class="ap-zeile__weg" data-regel-weg="${i}" aria-label="Regel entfernen">${ZU}</button></div>`).join('')}</div>
    ${bkn('Grundlage', WO.knopf('Neue Regel', 'plus', 'glas', { klein: true, attr: 'data-regel-neu' }))}</form></section>`;
}
const fragenKopf = () => zeilenListe('fragen', [['t', 'Frage'], ['s', 'Worum es geht', { breit: true }], ['a', 'Was wir entschieden haben', { zeilen: 2, breit: true, ph: 'noch offen' }]],
  'Zum Weiterdenken', 'Was wir gemeinsam klären. Sobald etwas entschieden ist, die Antwort eintragen: die Frage zählt dann nicht mehr als offen.', 'Neue Frage');
function ideenKopf() {
  const l = ohneTag().filter(passt).sort((a, b) => (a.stand === 'idee') - (b.stand === 'idee') || (a.gruppe || '').localeCompare(b.gruppe || ''));
  const gruppen = [...new Set(l.map(b => b.gruppe || 'Ohne Gruppe'))];
  return `<section class="ap-kopf"><div class="ap-kopf__t"><p class="wo-mk">Speicher · ${mz(l.length, 'Beitrag', 'Beiträge')}</p><h1 class="ap-h">Ideen</h1><p class="ap-satz">Alles, was noch keinen Tag hat. Öffnen und einen Tag setzen, dann steht es im Kalender.</p></div>
    ${WO.knopf('Neue Idee', 'plus', 'gold', { klein: true, attr: 'data-neu-idee' })}
    ${gruppen.map(g => { const x = l.filter(b => (b.gruppe || 'Ohne Gruppe') === g); return `<div class="ap-gruppe"><p class="wo-mk">${esc(g)} · ${zahl(x.length)}</p><div class="ap-il">${x.map((b, i) => ideeZeile(b, Math.min(i, 24))).join('')}</div></div>`; }).join('')}</section>`;
}

/* Idee als Zeile über die ganze Breite (nie eine halb leere Reihe): Bild, Titel, erster Satz, Kanäle */
function ideeZeile(b, i) {
  return `<button type="button" class="ap-iz${S.offen === b.id ? ' offen' : ''}" style="--i:${i}" data-oeffne="${esc(b.id)}">
    <span class="ap-iz__b${b.bild ? '' : ' ap-iz__b--zeichen'}">${b.bild ? bild(b, 't') : soLogo((b.kanaele || [])[0] || 'newsletter', 'so-lg--s')}</span>
    <span class="ap-iz__t"><b>${esc(kurz(b.titel, 90))}</b><small>${esc(kurz(ersterText(b), 150))}</small></span>
    <span class="ap-iz__k">${soLogos(b.kanaele)}</span><i class="ap-iz__p">${WO.ic('rechts')}</i></button>`;
}

/* ---------------------------------------------------------------- Karten */
function karte(b, art, o = {}) {
  const k = (b.kanaele || [])[0] || 'newsletter', aus = hervor() && !passt(b), f = format(b.format);
  return `<button type="button" class="ap-k${aus ? ' aus' : ''}${S.offen === b.id ? ' offen' : ''}${b.vorschlag ? ' vorschlag' : ''}" style="${kStil(k)};--t:${esc(tFarbe(b))}${o.i != null ? ';--i:' + o.i : ''}" draggable="true" data-ziehen="${esc(b.id)}" data-oeffne="${esc(b.id)}">
    <span class="ap-k__bild">${bild(b, art)}<span class="ap-k__lg">${soLogos(b.kanaele)}</span></span>
    <span class="ap-k__t"><b>${esc(kurz(b.titel, o.lang || 54))}</b>${/^(freigegeben|geplant|draussen)$/.test(b.stand) ? `<small class="ap-k__stz">${esc(STAND[b.stand])}</small>` : ''}</span></button>`;
}

/* ---------------------------------------------------------------- Kalender */
function kalender() {
  const h = heute(), m = S.monat || h.slice(0, 7), [y, mo] = m.split('-').map(Number), art = S.kal || (HANDY() ? 'wochen' : 'monat');
  const ks = kanaele().filter(k => !(GRENZE[k.id] || {}).eigen), imMonat = geplant().filter(b => b.datum.slice(0, 7) === m);
  const mv = iso(new Date(y, mo - 2, 1)).slice(0, 7), mn = iso(new Date(y, mo, 1)).slice(0, 7);
  return `<div class="ap-kal" id="kalender" role="region" aria-label="Kalender">
    <div class="ap-kal__kopf">
      <div class="ap-kal__monat"><button type="button" class="ap-rund" data-monat="${mv}" aria-label="Monat davor">${WO.ic('links')}</button><h2><b>${MONATE[mo - 1]}</b> ${y}</h2><button type="button" class="ap-rund" data-monat="${mn}" aria-label="Monat danach">${WO.ic('rechts')}</button>
        ${m !== h.slice(0, 7) ? `<button type="button" class="ap-heute" data-monat="${h.slice(0, 7)}">Heute</button>` : ''}<span class="ap-kal__n">${mz(imMonat.length, 'Beitrag', 'Beiträge')}</span></div>
      <div class="ap-kal__rechts">${WO.knopf('Neuer Beitrag', 'plus', 'gold', { klein: true, attr: 'data-neu' })}<div class="ap-schalter" role="tablist">${[['monat', 'Monat'], ['wochen', 'Wochen']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === art}" class="${k === art ? 'an' : ''}" data-kal="${k}">${t}</button>`).join('')}</div></div>
    </div>
    ${takt()}
    <div class="ap-kal__filter" role="group" aria-label="Nach Kanal filtern">${ks.filter(k => S.kf.includes(k.id) || imMonat.some(b => (b.kanaele || []).includes(k.id))).map(k => { const an = S.kf.includes(k.id), n = imMonat.filter(b => (b.kanaele || []).includes(k.id)).length;
      return `<button type="button" class="ap-fk${an ? ' an' : ''}" style="${kStil(k.id)}" data-kf="${esc(k.id)}" aria-pressed="${an}">${soLogo(k.id, 'so-lg--s')}<span>${esc(kname(k.id))}</span><b>${n}</b></button>`; }).join('')}
      ${S.kf.length ? `<button type="button" class="ap-link" data-kf="">Alle</button>` : ''}
</div>
    ${art === 'monat' ? monat(m) : wochen(m)}
  </div>`;
}
/* Der Rhythmus als eine Zeile: welcher Tag welchem Kanal gehört, «Ändern» klappt die Woche auf */
function takt() {
  const r = (ST().rhythmus || []).filter(x => x.kanal).sort((a, b) => TAGE.indexOf(a.tag) - TAGE.indexOf(b.tag));
  const n = r.length, an = bereich().art === 'rhythmus';
  const wort = ['', 'Ein Beitrag', 'Zwei Beiträge', 'Drei Beiträge', 'Vier Beiträge', 'Fünf Beiträge', 'Sechs Beiträge', 'Sieben Beiträge'][n];
  return `<div class="ap-takt${S.gezeigt ? '' : ' erst'}"><span class="ap-takt__n">${n ? wort + ' pro Woche' : 'Noch kein Rhythmus'}</span>
    <span class="ap-takt__l">${r.map(x => `<span class="ap-takt__t" style="${kStil(x.kanal)}">${soLogo(x.kanal, 'so-lg--s')}<b>${esc(x.tag.slice(0, 2))}</b>${esc(kname(x.kanal))}</span>`).join('')}</span>
    <button type="button" class="ap-link" data-gehe="${an ? 'kalender' : 'rhythmus'}">${an ? 'Fertig' : 'Ändern'}${WO.ic(an ? 'haken' : 'stift')}</button></div>`;
}
function tageImMonat(m) {
  const h = heute(), [y, mo] = m.split('-').map(Number), erster = new Date(y, mo - 1, 1), s0 = new Date(erster); s0.setDate(1 - ((erster.getDay() + 6) % 7));
  const wochen = Math.ceil((((erster.getDay() + 6) % 7) + new Date(y, mo, 0).getDate()) / 7);
  let tage = [...Array(wochen * 7)].map((_, i) => { const d = new Date(s0); d.setDate(s0.getDate() + i); return iso(d); });
  const w0 = wocheVon(h), weg = m === h.slice(0, 7) && !S.vergangene ? tage.filter(t => t < w0).length / 7 : 0;
  if (weg) tage = tage.filter(t => t >= w0);
  return { tage, weg };
}
const rhythmusAm = t => (ST().rhythmus || []).find(r => r.tag === TAGE[(dObj(t).getDay() + 6) % 7] && r.kanal);
const vorher = (m, weg) => weg ? `<button type="button" class="ap-vorher" data-vergangene>${weg === 1 ? 'Vergangene Woche' : weg + ' vergangene Wochen'} zeigen${WO.ic('hoch')}</button>`
  : m === heute().slice(0, 7) && S.vergangene ? `<button type="button" class="ap-vorher" data-vergangene>Vergangene Wochen ausblenden${WO.ic('hoch')}</button>` : '';
function leerTag(t, aus) {
  if (t < heute()) return '<span class="ap-ruhe"></span>';   /* Tage des Nachbarmonats sind gedämpft, aber belegbar (kein leeres Feld) */
  const r = rhythmusAm(t);
  return r ? `<button type="button" class="ap-geist" style="${kStil(r.kanal)}" data-neu-tag="${t}" data-rhythmus="1" title="Beitrag nach dem Rhythmus anlegen">${soLogo(r.kanal, 'so-lg--s')}<span>${esc(r.format || kname(r.kanal))}</span>${WO.ic('plus')}</button>`
    : `<button type="button" class="ap-plus" data-neu-tag="${t}" aria-label="Neuer Beitrag am ${esc(datumZahl(t))}">${WO.ic('plus')}</button>`;
}
/* Monatswechsel: einmal in Richtung des Pfeils hereingleiten, danach ruhig */
const richtung = () => { const r = S.richtung, erst = !S.gezeigt; S.richtung = 0; S.gezeigt = true;   /* Auftritt nur beim ersten Bild und beim Monatswechsel, nicht bei jedem Speichern */
  return (r > 0 ? ' von-rechts' : r < 0 ? ' von-links' : '') + (erst ? ' erst' : ''); };
function monat(m) {
  const h = heute(), { tage, weg } = tageImMonat(m);
  return `${vorher(m, weg)}<div class="ap-mo${richtung()}"><div class="ap-mo__kopf">${TAGE.map(t => `<span>${t.slice(0, 2)}</span>`).join('')}</div><div class="ap-mo__tage">${tage.map((t, i) => {
    const l = geplant().filter(b => b.datum === t).sort((a, b) => a.id.localeCompare(b.id)), aus = t.slice(0, 7) !== m, p = phaseVon(t);
    return `<div class="ap-tag${aus ? ' aus' : ''}${t === h ? ' heute' : ''}${t < h ? ' vorbei' : ''}${l.length > 1 ? ' doppelt' : ''}" data-tag="${t}" style="--i:${i}">
      <span class="ap-tag__z"><b>${dObj(t).getDate()}</b>${l.length > 1 ? `<i title="Mehr als ein Beitrag an diesem Tag">${l.length}</i>` : ''}</span>
      ${l.length ? karte(l[0], 'k') + l.slice(1).map(b => `<button type="button" class="ap-mehr${hervor() && !passt(b) ? ' aus' : ''}" draggable="true" data-ziehen="${esc(b.id)}" data-oeffne="${esc(b.id)}">${soLogos(b.kanaele)}<span>${esc(kurz(b.titel, 30))}</span></button>`).join('') : leerTag(t, aus)}</div>`; }).join('')}</div></div>`;
}
function wochen(m) {
  const h = heute(), { tage, weg } = tageImMonat(m), w = [];
  for (let i = 0; i < tage.length; i += 7) w.push(tage.slice(i, i + 7));
  return `${vorher(m, weg)}<div class="ap-wo${richtung()}">${w.map(wo => { const p = phaseVon(wo[0]) || phaseVon(wo[6]);
    return `<div class="ap-wo__w" style="${p ? `--p:${esc(p.farbe)}` : ''}"><p class="ap-wo__kopf"><b>Woche ab ${datumKurz(wo[0])}</b></p>
      <div class="ap-wo__tage">${wo.filter(t => S.vergangene || t >= h || HANDY() === false).map(t => { const l = geplant().filter(b => b.datum === t), aus = t.slice(0, 7) !== m;
        return `<div class="ap-wo__t${t === h ? ' heute' : ''}${t < h ? ' vorbei' : ''}" data-tag="${t}"><span class="ap-wo__d"><b>${TAGE[(dObj(t).getDay() + 6) % 7].slice(0, 2)}</b>${dObj(t).getDate()}.</span>
          <div class="ap-wo__l">${l.length ? l.map(b => karte(b, 'k', { phase: false })).join('') : leerTag(t, aus)}</div></div>`; }).join('')}</div></div>`; }).join('')}</div>`;
}
function ablage() {
  const l = ohneTag().filter(b => b.stand !== 'idee').sort((a, b) => (a.gruppe || '').localeCompare(b.gruppe || ''));
  const ideen = ohneTag().filter(b => b.stand === 'idee').length;
  return `<section class="ap-ablage" data-tag="">
    <div class="ap-ablage__kopf"><p class="wo-mk">Entwürfe ohne Tag · ${zahl(l.length)}</p><span>Auf einen Tag im Kalender ziehen. Zurück hierher gezogen, verliert ein Beitrag seinen Tag.</span>
      <button type="button" class="ap-link" data-gehe="ideen">Alle ${zahl(ideen + l.length)} Ideen${WO.ic('rechts')}</button></div>
    <div class="ap-ablage__l">${l.map(b => karte(b, 't', { lang: 40 })).join('') || '<p class="ap-ruhig">Alle Entwürfe haben einen Tag.</p>'}</div></section>`;
}

/* ---------------------------------------------------------------- Feed: so, wie der Plan auf dem Kanal aussähe */
function feed() {
  const id = S.feed, kk = kanal(id) || {}, alle = beitraege().filter(b => (b.kanaele || []).includes(id));
  const mit = alle.filter(b => b.datum && b.datum >= heute()).sort((a, b) => b.datum.localeCompare(a.datum)), ohne = alle.filter(b => !b.datum && b.bild && b.stand !== 'idee').sort((a, b) => (b.reihe || '').localeCompare(a.reihe || ''));
  const kach = (b, art) => `<button type="button" class="ap-fd__k${hervor() && !passt(b) ? ' aus' : ''}${S.offen === b.id ? ' offen' : ''}${b.datum ? ' mit' : ''}" draggable="true" data-ziehen="${esc(b.id)}" data-feld="${esc(b.id)}" data-oeffne="${esc(b.id)}" style="--t:${esc(tFarbe(b))}">
    ${bild(b, art)}${b.datum ? `<em>${esc(datumKurz(b.datum))}</em>` : '<em class="ent">Entwurf</em>'}${(b.kanaele || []).includes('tiktok') || b.format === 'reel' ? `<span class="ap-fd__play">${WO.ic('rechts')}</span>` : ''}</button>`;
  let innen;
  if (id === 'instagram' || id === 'tiktok') {
    const l = mit.concat(ohne.slice(0, Math.max(0, 3 - mit.length % 3) % 3 + 6));
    innen = `<div class="ap-fd__profil"><span class="ap-fd__ring"><span class="so-av">${WO.zeichen()}</span></span><div><b>${esc(kk.handle || 'tasty_studios')}</b><p><span><b>${zahl(mit.length)}</b> geplant</span><span><b>${zahl(ohne.length)}</b> Entwürfe</span></p></div></div>
      <p class="ap-fd__bio">${esc(kurz((kk.bio || kk.rolle || '').split('\n')[0], 90))}</p>
      <div class="ap-fd__raster ap-fd__raster--${id}">${l.map(b => kach(b, 'f')).join('')}</div>`;
  } else if (id === 'pinterest') {
    innen = `<div class="ap-fd__mitte"><span class="so-av">${WO.zeichen()}</span><b>Tasty Studios</b><p>Pinnwand «Websites» · ${zahl(alle.length)} Pins</p></div><div class="ap-fd__pins">${mit.concat(ohne).slice(0, 12).map(b => kach(b, 'f')).join('')}</div>`;
  } else {
    const l = mit.slice().reverse().concat(ohne).slice(0, 8);
    innen = `<div class="ap-fd__seite"><span class="so-av">${WO.zeichen()}</span><div><b>Tasty Studios</b><p>${esc(id === 'google' ? 'Hamburg · Websites für Hotels und Restaurants' : kurz((kk.bio || kk.rolle || '').split('\n')[0], 70))}</p></div></div>
      ${l.map(b => `<button type="button" class="ap-fd__post${hervor() && !passt(b) ? ' aus' : ''}${S.offen === b.id ? ' offen' : ''}" data-oeffne="${esc(b.id)}" data-ziehen="${esc(b.id)}" draggable="true" style="--t:${esc(tFarbe(b))}">
        <span class="ap-fd__pk"><span class="so-av">${WO.zeichen()}</span><span><b>Tasty Studios</b><small>${esc(b.datum ? datumLang(b.datum) : 'Entwurf, noch ohne Tag')}</small></span></span>
        <span class="ap-fd__text">${esc(kurz(textVon(b, id) || ersterText(b) || b.titel, 150))}</span><span class="ap-fd__medien">${bild(b, 'f')}</span></button>`).join('') || '<p class="ap-ruhig">Für diesen Kanal ist noch nichts geplant.</p>'}`;
  }
  return `<section class="ap-feed" style="${kStil(id)}">
    <div class="ap-feed__kopf"><p class="wo-mk">Der Feed</p><div class="ap-feed__reiter" role="tablist">${FEEDS.map(k => `<button type="button" role="tab" aria-selected="${k === id}" class="${k === id ? 'an' : ''}" data-feed="${k}" title="${esc(kname(k))}">${soLogo(k, 'so-lg--s')}</button>`).join('')}</div></div>
    <div class="ap-handy"><div class="ap-handy__in ap-fd ap-fd--${id}">${innen}</div></div>
    <p class="ap-feed__fuss">${id === 'instagram' || id === 'tiktok' ? 'Neuester Beitrag oben links. Eine Kachel auf eine andere ziehen tauscht ihre Tage.' : 'So stünden die nächsten Beiträge auf der Seite. Ein Klick öffnet den Beitrag.'}</p>
  </section>`;
}

/* ---------------------------------------------------------------- Schublade: ein Beitrag zum Bearbeiten */
function oeffne(id) {
  if (S.e && S.e.geaendert && S.e.id !== id && !confirm('Am offenen Beitrag ist etwas nicht gespeichert. Trotzdem wechseln?')) return;
  const b = beitrag(id); if (!b) return;
  S.offen = id; S.e = { id, f: kopie(b), geaendert: false }; S.bildwahl = false; S.reiter = (b.kanaele || [])[0] || '';
  schublade(); markiereOffen();
}
function schliesse() {
  if (S.e && S.e.geaendert && !confirm('Am Beitrag ist etwas nicht gespeichert. Trotzdem schliessen?')) return;
  S.offen = ''; S.e = null; schublade(); markiereOffen(); leiste();
}
function markiereOffen() { $$('[data-oeffne]').forEach(x => x.classList.toggle('offen', x.dataset.oeffne === S.offen)); }
function schublade() {
  const el = $('#schub'), grund = $('#schub-grund');
  if (!S.e) { el.classList.remove('auf'); grund.classList.remove('auf'); setTimeout(() => { if (!S.e) { el.hidden = true; grund.hidden = true; el.innerHTML = ''; } }, RUHIG() ? 0 : 380); document.documentElement.classList.remove('ap-schub-auf'); return; }
  /* schon offen (Wechsel von Kanal, Stand, Reiter): nichts fliegt neu herein, nur beim ersten Öffnen (Robert 17.11.2026) */
  el.classList.toggle('ruhig', el.classList.contains('auf') && !el.hidden);
  const f = S.e.f, p = phaseVon(f.datum), ks = kanaele().filter(k => !(GRENZE[k.id] || {}).eigen);
  if (!(f.kanaele || []).includes(S.reiter)) S.reiter = (f.kanaele || [])[0] || '';
  const r = S.reiter, fa = (f.fassungen || {})[r] || {}, g = GRENZE[r] || {}, lang = (fa.text || '').length + (fa.tags ? fa.tags.length + 2 : 0);
  el.innerHTML = `<div class="ap-sch__kopf"><span class="ap-sch__lg">${soLogos(f.kanaele)}</span><div><p class="wo-mk">Beitrag · ${esc(STAND[f.stand] || 'Idee')}${S.e.geaendert ? ' · nicht gespeichert' : ''}</p><b>${esc(kurz(f.titel || 'Ohne Titel', 60))}</b></div>
      <button type="button" class="ap-rund" data-schliessen aria-label="Schliessen">${ZU}</button></div>
    <div class="ap-sch__inhalt"><div class="ap-sch__links">
      <div class="ap-sch__bild" style="--t:${esc(tFarbe(f))}">${f.bild ? `<img src="${esc(f.bild)}?e" alt="" decoding="async">` : soGrafik(f)}
        <div class="ap-sch__bildkn"><button type="button" class="ap-pille" data-bildwahl>${WO.ic('foto')}${S.bildwahl ? 'Bildwahl schliessen' : 'Bild wählen'}</button>${f.bild ? `<button type="button" class="ap-pille" data-bild-weg>${ZU}Ohne Bild</button>` : ''}</div></div>
      ${S.bildwahl ? bildwahl(f) : ''}
      <label class="ap-f ap-f--gross"><span>Titel</span><input name="titel" value="${esc(f.titel || '')}" data-e="titel"></label>
      <div class="ap-sch__tag"><label class="ap-f"><span>Tag</span><span class="ap-datum${f.datum ? '' : ' leer'}"><input type="date" name="datum" value="${esc(f.datum || '')}" data-e="datum"${f.datum ? '' : ' required'}><em>Noch ohne Tag</em></span></label>${f.datum ? `<button type="button" class="ap-link" data-ohne-tag>Tag entfernen</button>` : ''}</div>
      <div class="ap-f"><span>Stand</span><div class="ap-stand">${STAENDE.map(([k, t], i) => `<button type="button" class="${k === f.stand ? 'an' : ''}${STAENDE.findIndex(x => x[0] === f.stand) > i ? ' durch' : ''}" data-stand="${k}"><i>${i + 1}</i>${t}</button>`).join('')}</div></div>
      <div class="ap-f"><span>Kanäle</span><div class="ap-kwahl">${ks.map(k => { const an = (f.kanaele || []).includes(k.id); return `<button type="button" class="${an ? 'an' : ''}" style="${kStil(k.id)}" data-e-kanal="${esc(k.id)}" aria-pressed="${an}">${soLogo(k.id, 'so-lg--s')}<span>${esc(kname(k.id))}</span></button>`; }).join('')}</div></div>
      <div class="ap-f"><span>Thema</span><div class="ap-chips">${themen().map(t => `<button type="button" class="${t.k === f.thema ? 'an' : ''}" style="--c:${esc(t.farbe)}" data-e-thema="${esc(t.k)}"><i class="ap-pkt" style="--c:${esc(t.farbe)}"></i>${esc(t.t)}</button>`).join('')}</div></div>
      <div class="ap-f"><span>Format</span><div class="ap-chips">${formate().map(x => `<button type="button" class="${x.k === f.format ? 'an' : ''}" style="--c:${esc(x.farbe)}" data-e-format="${esc(x.k)}"><i class="ap-pkt" style="--c:${esc(x.farbe)}"></i>${esc(x.t)}</button>`).join('')}</div></div>
      <label class="ap-f"><span>Notiz</span><textarea data-e="notiz" rows="3" spellcheck="true" lang="de">${esc(f.notiz || '')}</textarea></label>
      ${f.quelle ? `<p class="ap-quelle">Herkunft: ${esc(f.quelle)}</p>` : ''}
    </div><div class="ap-sch__rechts">
      ${(f.kanaele || []).length ? `<div class="ap-sch__texte"><div class="ap-reiter" role="tablist">${(f.kanaele || []).map(k => `<button type="button" role="tab" aria-selected="${k === r}" class="${k === r ? 'an' : ''}" style="${kStil(k)}" data-reiter="${esc(k)}">${soLogo(k, 'so-lg--s')}${esc(kname(k))}</button>`).join('')}</div>
        ${r === 'pinterest' ? `<label class="ap-f"><span>Titel des Pins</span><input data-fa="titel" value="${esc(fa.titel || '')}"></label>` : ''}
        <label class="ap-f"><span>Text für ${esc(kname(r))}</span><textarea data-fa="text" rows="7" spellcheck="true" lang="de">${esc(fa.text || '')}</textarea></label>
        <div class="ap-sch__zwei"><label class="ap-f"><span>Schlagwörter</span><input data-fa="tags" value="${esc(fa.tags || '')}" placeholder="#Webdesign #Hotellerie"></label><label class="ap-f"><span>${r === 'linkedin' ? 'Erster Kommentar oder Link' : 'Link'}</span><input data-fa="link" value="${esc(fa.link || '')}"></label></div>
        <p class="ap-zaehl${g.zeichen && lang > g.zeichen ? ' zu' : ''}">${zahl(lang)}${g.zeichen ? ' von ' + zahl(g.zeichen) : ''} Zeichen${g.sichtbar ? ` · die ersten ${g.sichtbar} sind ohne «mehr» sichtbar` : ''}${g.bildPflicht && !f.bild ? ' · hier fehlt noch das Bild' : ''}</p>
        ${andereTexte(f, r)}
        <div class="ap-sch__vorschau">${vorschau(f, r)}</div></div>` : '<p class="ap-ruhig">Einen Kanal wählen, dann steht hier das Textfeld mit der Vorschau.</p>'}
    </div></div>
    <div class="ap-sch__fuss">${WO.knopf('Speichern', 'haken', S.e.geaendert ? 'gold' : 'glas', { klein: true, attr: 'data-e-speichern', disabled: !S.e.geaendert })}
      ${WO.knopf('Duplizieren', 'kopie', 'glas', { klein: true, attr: 'data-e-doppel' })}${WO.knopf('Text schreiben und prüfen', 'pfeil', 'glas', { klein: true, href: '../#beitrag:' + encodeURIComponent(f.id) })}
      <button type="button" class="ap-link ap-link--weg" data-e-loeschen>Löschen</button></div>`;
  el.hidden = false; grund.hidden = false; document.documentElement.classList.add('ap-schub-auf');
  requestAnimationFrame(() => { el.classList.add('auf'); grund.classList.add('auf'); });
  schubLeben(el);
}
function andereTexte(f, r) {
  const quellen = (f.kanaele || []).filter(k => k !== r && textVon(f, k));
  return quellen.length ? `<p class="ap-uebernehmen">Text übernehmen aus ${quellen.map(k => `<button type="button" class="ap-link" data-uebernehmen="${esc(k)}">${esc(kname(k))}</button>`).join(' · ')}</p>` : '';
}
function bildwahl(f) {
  const seen = new Set(), l = [];
  Object.values(S.d.beitraege).forEach(b => { if (b.bild && !seen.has(b.bild)) { seen.add(b.bild); l.push(b); } });
  const vergeben = new Set(geplant().filter(b => b.id !== f.id).map(b => b.bild));
  return `<div class="ap-bildwahl"><p class="wo-mk">Bilder aus dem Bestand · ${zahl(l.length)}</p><div class="ap-bildwahl__l">${l.map(b => `<button type="button" class="${b.bild === f.bild ? 'an' : ''}${vergeben.has(b.bild) ? ' vergeben' : ''}" data-bild="${esc(b.bild)}" title="${esc(vergeben.has(b.bild) ? 'Schon an einem anderen Tag eingeplant' : b.titel)}"><img src="${esc(b.bild)}?w" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>
    <p class="ap-ruhig">Gedämpfte Bilder sind schon an einem anderen Tag eingeplant. Eigene Grafiken baut die <a href="../maschine/">Content-Maschine</a>.</p></div>`;
}
function vorschau(f, k) {
  const fa = (f.fassungen || {})[k] || {}, g = GRENZE[k] || {}, text = fa.text || '', tags = fa.tags || '';
  const sicht = g.sichtbar && text.length > g.sichtbar ? esc(text.slice(0, g.sichtbar).replace(/\s+\S*$/, '')) + '<span class="ap-vk__mehr"> … mehr</span>' : esc(text);
  const kopfz = `<div class="ap-vk__kopf"><span class="so-av">${WO.zeichen()}</span><span><b>${esc(k === 'linkedin' ? 'Tasty Studios' : (kanal(k) || {}).handle || 'Tasty Studios')}</b><small>${esc(f.datum ? datumLang(f.datum) : 'noch ohne Tag')}</small></span></div>`;
  const bildB = f.bild ? `<div class="ap-vk__bild ap-vk__bild--${k}"><img src="${esc(f.bild)}?v" alt="" decoding="async"></div>` : `<div class="ap-vk__bild ap-vk__bild--${k}">${soGrafik(f)}</div>`;
  const leer = text ? '' : '<span class="ap-vk__ruhig">Noch kein Text für diesen Kanal.</span>';
  let innen;
  if (k === 'linkedin') innen = `${kopfz}<div class="ap-vk__text">${sicht.replace(/\n/g, '<br>')}${leer}</div>${tags ? `<p class="ap-vk__tags">${esc(tags)}</p>` : ''}${bildB}`;
  else if (k === 'tiktok') innen = `<div class="ap-vk__hoch">${f.bild ? `<img src="${esc(f.bild)}?v" alt="" decoding="async">` : soGrafik(f)}<div class="ap-vk__ueber"><b>${esc((kanal(k) || {}).handle || '')}</b><p>${esc(kurz(text, 150))}</p>${tags ? `<small>${esc(tags)}</small>` : ''}</div></div>`;
  else if (k === 'pinterest') innen = `${bildB}<div class="ap-vk__text"><b>${esc(fa.titel || 'Titel des Pins fehlt')}</b><br>${esc(text)}${leer}</div>`;
  else innen = `${kopfz}${bildB}<div class="ap-vk__text">${k === 'instagram' || k === 'facebook' ? `<b>${esc((kanal(k) || {}).handle || 'tasty_studios')}</b> ` : ''}${sicht.replace(/\n/g, '<br>')}${leer}</div>${tags ? `<p class="ap-vk__tags">${esc(tags)}</p>` : ''}`;
  return `<p class="wo-mk">${soLogo(k, 'so-lg--s')}Vorschau ${esc(kname(k))}</p><div class="ap-vk ap-vk--${k}">${innen}</div>`;
}
function eAendern(tu, neu = true) {
  tu(S.e.f); S.e.geaendert = !gleich(S.e.f, beitrag(S.e.id));
  if (neu) { const y = $('#schub .ap-sch__inhalt') ? $('#schub .ap-sch__inhalt').scrollTop : 0; schublade(); const n = $('#schub .ap-sch__inhalt'); if (n) n.scrollTop = y; }
  else {
    const k = $('#schub [data-e-speichern]'); if (k) { k.disabled = !S.e.geaendert; k.className = k.className.replace(/wo-kn--(gold|glas)/, 'wo-kn--' + (S.e.geaendert ? 'gold' : 'glas')); }
    const mk = $('#schub .ap-sch__kopf .wo-mk'); if (mk) mk.textContent = 'Beitrag · ' + (STAND[S.e.f.stand] || 'Idee') + (S.e.geaendert ? ' · nicht gespeichert' : '');
    const z = $('#schub .ap-zaehl'), fa = ((S.e.f.fassungen || {})[S.reiter] || {}), g = GRENZE[S.reiter] || {};
    if (z) { const n = (fa.text || '').length + (fa.tags ? fa.tags.length + 2 : 0); z.firstChild.textContent = zahl(n) + (g.zeichen ? ' von ' + zahl(g.zeichen) : '') + ' Zeichen' + (g.sichtbar ? ` · die ersten ${g.sichtbar} sind ohne «mehr» sichtbar` : '') + (g.bildPflicht && !S.e.f.bild ? ' · hier fehlt noch das Bild' : ''); z.classList.toggle('zu', !!(g.zeichen && n > g.zeichen)); }
  }
  leiste();
}
function schubLeben(el) {
  $$('[data-schliessen]', el).forEach(b => b.onclick = schliesse);
  $$('[data-e]', el).forEach(i => {
    i.addEventListener('input', () => eAendern(f => { f[i.dataset.e] = i.value; }, i.type === 'date'));
    if (i.type !== 'date') i.addEventListener('change', () => schubKopf());
  });
  $$('[data-fa]', el).forEach(i => i.addEventListener('input', () => eAendern(f => { f.fassungen = f.fassungen || {}; f.fassungen[S.reiter] = Object.assign({}, f.fassungen[S.reiter] || {}, { [i.dataset.fa]: i.value }); }, false)));
  $$('[data-fa]', el).forEach(i => i.addEventListener('change', () => { const y = $('.ap-sch__inhalt', el).scrollTop; schublade(); $('#schub .ap-sch__inhalt').scrollTop = y; }));
  $$('[data-stand]', el).forEach(b => b.onclick = () => eAendern(f => { f.stand = b.dataset.stand; }));
  $$('[data-e-kanal]', el).forEach(b => b.onclick = () => eAendern(f => { const k = b.dataset.eKanal, l = f.kanaele || []; f.kanaele = l.includes(k) ? l.filter(x => x !== k) : l.concat(k); if (!l.includes(k)) S.reiter = k; }));
  $$('[data-e-thema]', el).forEach(b => b.onclick = () => eAendern(f => { f.thema = b.dataset.eThema; }));
  $$('[data-e-format]', el).forEach(b => b.onclick = () => eAendern(f => { f.format = f.format === b.dataset.eFormat ? '' : b.dataset.eFormat; const fm = format(f.format); if (fm && !(f.kanaele || []).length) f.kanaele = (fm.kanaele || []).slice(); }));
  $$('[data-reiter]', el).forEach(b => b.onclick = () => { S.reiter = b.dataset.reiter; const y = $('.ap-sch__inhalt', el).scrollTop; schublade(); $('#schub .ap-sch__inhalt').scrollTop = y; });
  $$('[data-uebernehmen]', el).forEach(b => b.onclick = () => eAendern(f => { const q = (f.fassungen || {})[b.dataset.uebernehmen] || {}; f.fassungen[S.reiter] = Object.assign({}, f.fassungen[S.reiter] || {}, { text: q.text || '', tags: q.tags || '' }); }));
  $$('[data-bildwahl]', el).forEach(b => b.onclick = () => { S.bildwahl = !S.bildwahl; schublade(); });
  $$('[data-bild]', el).forEach(b => b.onclick = () => { S.bildwahl = false; eAendern(f => { f.bild = b.dataset.bild; }); });
  $$('[data-bild-weg]', el).forEach(b => b.onclick = () => eAendern(f => { f.bild = ''; }));
  $$('[data-ohne-tag]', el).forEach(b => b.onclick = () => eAendern(f => { f.datum = ''; }));
  $$('[data-e-speichern]', el).forEach(b => b.onclick = speichereBeitrag);
  $$('[data-e-doppel]', el).forEach(b => b.onclick = () => { const f = kopie(S.e.f); ['id', 'erstellt', 'geaendert', 'wer', 'live', 'zahlen'].forEach(k => delete f[k]); f.titel = f.titel + ' (Kopie)'; f.datum = ''; f.vorschlag = false; f.stand = f.stand === 'draussen' ? 'entwurf' : f.stand; neuerBeitrag(f); });
  $$('[data-e-loeschen]', el).forEach(b => b.onclick = loescheBeitrag);
}
function schubKopf() { const b = $('#schub .ap-sch__kopf b'); if (b && S.e) b.textContent = kurz(S.e.f.titel || 'Ohne Titel', 60); }

/* ---------------------------------------------------------------- Speichern, Quittung, Rückgängig */
async function api(methode, weg, daten) {
  const r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' });
  let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
  if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
  return j;
}
const B_NAMEN = { titel: 'Titel', stand: 'Stand', thema: 'Thema', format: 'Format', datum: 'Tag', kanaele: 'Kanäle', bild: 'Bild', notiz: 'Notiz' };
function unterschiede(a, b) {
  const z = [];
  Object.keys(B_NAMEN).forEach(k => {
    if (gleich(a[k] || '', b[k] || '')) return;
    const w = (x) => k === 'stand' ? STAND[x] || '–' : k === 'kanaele' ? (x || []).map(kname).join(', ') || 'keine' : k === 'datum' ? datumZahl(x) || 'ohne Tag' : k === 'thema' ? (thema(x) || {}).t || '–' : k === 'format' ? (format(x) || {}).t || '–' : k === 'bild' ? (x ? 'Bild' : 'ohne') : kurz(x, 40) || 'leer';
    z.push([B_NAMEN[k], `${w(a[k])} → ${w(b[k])}`]);
  });
  const ks = new Set(Object.keys(a.fassungen || {}).concat(Object.keys(b.fassungen || {})));
  ks.forEach(k => { const x = (a.fassungen || {})[k] || {}, y = (b.fassungen || {})[k] || {}; if (!gleich([x.text || '', x.tags || '', x.link || '', x.titel || ''], [y.text || '', y.tags || '', y.link || '', y.titel || ''])) z.push(['Text ' + kname(k), `${zahl((x.text || '').length)} → ${zahl((y.text || '').length)} Zeichen`]); });
  return z;
}
let laeuft = false;
async function speichereBeitrag() {
  const E = S.e; if (!E || !E.geaendert || laeuft) return;
  laeuft = true;
  try {
    const j = await api('PUT', 'beitrag/' + E.id, { felder: E.f, wer: WER() });
    S.d.beitraege[E.id] = j.nachher; S.e = { id: E.id, f: kopie(j.nachher), geaendert: false };
    neuZeichnen(); schublade();
    quittung('Beitrag gespeichert', unterschiede(j.vorher, j.nachher), [{ art: 'beitrag', id: E.id, vorher: j.vorher }]);
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
  finally { laeuft = false; }
}
async function aendere(id, felder, titel) {
  try {
    const j = await api('PUT', 'beitrag/' + id, { felder, wer: WER() });
    S.d.beitraege[id] = j.nachher; if (S.e && S.e.id === id && !S.e.geaendert) S.e.f = kopie(j.nachher);
    neuZeichnen(); if (S.e) schublade();
    quittung(titel, unterschiede(j.vorher, j.nachher), [{ art: 'beitrag', id, vorher: j.vorher }]);
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
}
async function tausche(a, b) {
  const x = beitrag(a), y = beitrag(b); if (!x || !y || !x.datum || !y.datum || a === b) return;
  try {
    const j1 = await api('PUT', 'beitrag/' + a, { felder: { datum: y.datum }, wer: WER() }), j2 = await api('PUT', 'beitrag/' + b, { felder: { datum: x.datum }, wer: WER() });
    S.d.beitraege[a] = j1.nachher; S.d.beitraege[b] = j2.nachher; neuZeichnen();
    quittung('Im Feed getauscht', [[kurz(x.titel, 34), `${datumZahl(x.datum)} → ${datumZahl(y.datum)}`], [kurz(y.titel, 34), `${datumZahl(y.datum)} → ${datumZahl(x.datum)}`]], [{ art: 'beitrag', id: a, vorher: j1.vorher }, { art: 'beitrag', id: b, vorher: j2.vorher }]);
  } catch (e) { meldung('Nicht getauscht: ' + e.message, true); }
}
function vorlageNeu(t) {
  const r = t ? rhythmusAm(t) : null, f = r ? formate().find(x => (x.kanaele || [])[0] === r.kanal || (x.kanaele || []).includes(r.kanal)) : null;
  const { art, id } = bereich();
  return {
    titel: 'Neuer Beitrag', stand: 'entwurf', datum: t || '',
    kanaele: r ? [r.kanal] : art === 'kanal' ? [id] : art === 'format' ? ((format(id) || {}).kanaele || []).slice() : ['instagram'],
    thema: r && r.thema ? r.thema : art === 'thema' ? id : (themen()[0] || {}).k || '',
    format: art === 'format' ? id : f ? f.k : '', gruppe: 'Im Content-Plan angelegt'
  };
}
async function neuerBeitrag(f) {
  try {
    const j = await api('POST', 'beitrag', { felder: f, wer: WER() });
    S.d.beitraege[j.nachher.id] = j.nachher; S.e = null; neuZeichnen(); oeffne(j.nachher.id);
    quittung(f.stand === 'idee' ? 'Idee angelegt' : 'Beitrag angelegt', [['Titel', f.titel], ['Tag', datumZahl(f.datum) || 'ohne Tag']], [{ art: 'beitrag', id: j.nachher.id, vorher: null }]);
    const t = $('#schub [data-e="titel"]'); if (t) { t.focus(); t.select(); }
  } catch (e) { meldung('Nicht angelegt: ' + e.message, true); }
}
async function loescheBeitrag() {
  const E = S.e; if (!E) return;
  if (!confirm('«' + (E.f.titel || 'Beitrag') + '» löschen? Die Quittung danach hat «Rückgängig».')) return;
  try {
    const j = await api('DELETE', 'beitrag/' + E.id);
    delete S.d.beitraege[E.id]; S.e = null; S.offen = ''; schublade(); neuZeichnen();
    quittung('Beitrag gelöscht', [['Titel', j.vorher.titel]], [{ art: 'beitrag', id: E.id, vorher: j.vorher }]);
  } catch (e) { meldung('Nicht gelöscht: ' + e.message, true); }
}
async function speichereBereich() {
  const B = S.b; if (!B || !B.geaendert || laeuft) return;
  laeuft = true;
  try {
    if (/^kanal:/.test(B.feld)) {
      const id = B.feld.slice(6), felder = {}; ['rolle', 'takt', 'formate', 'konzept'].forEach(k => { felder[k] = B.f[k] || ''; });
      const j = await api('PUT', 'kanal/' + id, { felder, wer: WER() });
      S.d.kanaele[id] = j.nachher; S.b = null; neuZeichnen();
      quittung(kname(id) + ' gespeichert', ['rolle', 'takt', 'formate', 'konzept'].filter(k => (j.vorher[k] || '') !== (j.nachher[k] || '')).map(k => [k[0].toUpperCase() + k.slice(1), kurz(j.nachher[k], 50) || 'leer']), [{ art: 'kanal', id, vorher: j.vorher }]);
    } else {
      const felder = B.feld === 'grundlage' ? { haltung: B.f.haltung, regeln: B.f.regeln.filter(x => x.trim()) } : { [B.feld]: B.f };
      const j = await api('PUT', 'strategie', { felder, wer: WER() });
      S.d.strategie = j.nachher; const feld = B.feld; S.b = null;
      if (!gueltig(S.ansicht)) gehe(feld === 'phasen' && phasen()[0] ? 'phase:' + phasen()[0].id : 'kalender'); else neuZeichnen();
      quittung({ phasen: 'Phasen', themen: 'Themen', formate: 'Formate', rhythmus: 'Rhythmus', ziele: 'Ziele', grundlage: 'Haltung und Regeln', fragen: 'Fragen' }[feld] + ' gespeichert', listenUnterschiede(feld, j.vorher, j.nachher), [{ art: 'strategie', id: '', vorher: j.vorher }]);
    }
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
  finally { laeuft = false; }
}
const F_NAMEN = { name: 'Name', titel: 'Titel', ziel: 'Ziel', von: 'Von', bis: 'Bis', farbe: 'Farbe', t: 'Name', s: 'Beschreibung', anteil: 'Anteil', kanaele: 'Kanäle', a: 'Antwort', kanal: 'Kanal', format: 'Format', thema: 'Thema', zeitraum: 'Bis wann', haltung: 'Haltung', regeln: 'Regeln' };
function listenUnterschiede(feld, va, na) {
  const z = [], w = (k, x) => k === 'von' || k === 'bis' ? datumZahl(x) || 'leer' : k === 'kanaele' ? (x || []).map(kname).join(', ') || 'keine' : k === 'kanal' ? (x ? kname(x) : 'frei') : k === 'farbe' ? 'neu' : kurz(Array.isArray(x) ? x.length + ' Einträge' : x, 34) || 'leer';
  if (feld === 'grundlage') { ['haltung', 'regeln'].forEach(k => { if (!gleich(va[k], na[k])) z.push([F_NAMEN[k], k === 'regeln' ? `${(va[k] || []).length} → ${(na[k] || []).length} Regeln` : 'geändert']); }); return z; }
  const a = va[feld] || [], b = na[feld] || [];
  if (a.length !== b.length) z.push(['Anzahl', `${a.length} → ${b.length}`]);
  b.forEach((x, i) => { const y = a[i] || {}; Object.keys(Object.assign({}, x, y)).forEach(k => { if (!gleich(x[k] || '', y[k] || '') && F_NAMEN[k] && z.length < 8) z.push([`${F_NAMEN[k]}${b.length > 1 ? ' · ' + (x.titel || x.t || x.tag || x.name || i + 1) : ''}`, `${w(k, y[k])} → ${w(k, x[k])}`]); }); });
  return z;
}
function quittung(titel, zeilen, zurueck) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>${esc(titel)}</b>${zeilen && zeilen.length ? `<ul>${zeilen.slice(0, 8).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}</div><div class="sc-quit__kn">${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${ZU}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    try {
      for (const z of zurueck) {
        const j = await api('POST', 'zurueck', Object.assign({ wer: WER() }, z));
        if (z.art === 'beitrag') { if (j.nachher) S.d.beitraege[z.id] = j.nachher; else delete S.d.beitraege[z.id]; }
        else if (z.art === 'strategie') S.d.strategie = j.nachher;
        else if (z.art === 'kanal') S.d.kanaele[z.id] = j.nachher;
      }
      q.remove(); S.b = null;
      if (S.e && !beitrag(S.e.id)) { S.e = null; S.offen = ''; } else if (S.e) S.e = { id: S.e.id, f: kopie(beitrag(S.e.id)), geaendert: false };
      if (!gueltig(S.ansicht)) gehe('kalender'); else neuZeichnen();
      schublade(); meldung('Rückgängig gemacht: der Stand davor gilt wieder.');
    } catch (e) { meldung('Rückgängig ging nicht: ' + e.message, true); }
  };
  m.appendChild(q); setTimeout(() => q.remove(), 14000);
}
function meldung(text, fehl) {
  const m = $('#meldung'), q = document.createElement('div'); q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(text)}</b></div><button type="button" class="sc-quit__zu" aria-label="Schliessen">${ZU}</button>`;
  q.querySelector('button').onclick = () => q.remove(); m.appendChild(q); setTimeout(() => q.remove(), 6000);
}

/* ---------------------------------------------------------------- Leben: Klicks, Formulare, Ziehen */
function bAendern(tu, zeichnen = false) {
  tu(S.b.f);
  const { art, id } = bereich();
  const alt = /^kanal:/.test(S.b.feld) ? kanal(S.b.feld.slice(6)) : S.b.feld === 'grundlage' ? { haltung: ST().haltung || '', regeln: ST().regeln || [] }
    : S.b.feld === 'rhythmus' ? TAGE.map(t => Object.assign({ tag: t, kanal: '', format: '', thema: '' }, (ST().rhythmus || []).find(r => r.tag === t) || {})) : ST()[S.b.feld] || [];
  S.b.geaendert = !gleich(S.b.f, alt);
  if (zeichnen) { const y = scrollY; zeichne(); scrollTo({ top: y }); }
  else { const k = $('[data-bereich-speichern]'); if (k) { k.disabled = !S.b.geaendert; k.className = k.className.replace(/wo-kn--(gold|glas|dunkel)/, 'wo-kn--' + (S.b.geaendert ? 'gold' : 'dunkel')); } }
  leiste();
}
function leben(r) {
  $$('[data-gehe]', r).forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe); });
  $$('[data-oeffne]', r).forEach(b => b.onclick = () => oeffne(b.dataset.oeffne));
  const halte = tu => { const k = $('#kalender'), y0 = k ? k.getBoundingClientRect().top : 0; tu(); zeichne(); const k2 = $('#kalender'); if (k2) scrollBy({ top: k2.getBoundingClientRect().top - y0 }); };
  $$('[data-monat]', r).forEach(b => b.onclick = () => halte(() => { const alt = S.monat || heute().slice(0, 7); S.richtung = b.dataset.monat > alt ? 1 : b.dataset.monat < alt ? -1 : 0; S.monat = b.dataset.monat; }));
  $$('[data-kal]', r).forEach(b => b.onclick = () => halte(() => { S.kal = b.dataset.kal; }));
  $$('[data-vergangene]', r).forEach(b => b.onclick = () => halte(() => { S.vergangene = !S.vergangene; }));
  $$('[data-kf]', r).forEach(b => b.onclick = () => halte(() => { const k = b.dataset.kf; S.kf = !k ? [] : S.kf.includes(k) ? S.kf.filter(x => x !== k) : S.kf.concat(k); }));
  $$('[data-feed]', r).forEach(b => b.onclick = () => { S.feed = b.dataset.feed; const f = $('.ap-feed'); f.outerHTML = feed(); leben($('.ap-rechts')); });
  $$('[data-neu-tag]', r).forEach(b => b.onclick = () => neuerBeitrag(vorlageNeu(b.dataset.neuTag)));
  $$('[data-neu]', r).forEach(b => b.onclick = () => neuerBeitrag(vorlageNeu()));
  $$('[data-neu-idee]', r).forEach(b => b.onclick = () => neuerBeitrag(Object.assign(vorlageNeu(), { stand: 'idee', titel: 'Neue Idee' })));
  /* Bereich bearbeiten */
  $$('form[data-liste]', r).forEach(f => {
    const feld = f.dataset.liste, i = +f.dataset.i;
    f.onsubmit = e => { e.preventDefault(); speichereBereich(); };
    $$('input,textarea', f).forEach(x => x.addEventListener('input', () => bAendern(l => { l[i][x.name] = x.value; })));
    $$('input[type=date]', f).forEach(x => x.addEventListener('change', () => bAendern(() => {}, true)));
    $$('[data-farbe]', f).forEach(b => b.onclick = () => bAendern(l => { l[i].farbe = b.dataset.farbe; }, true));
    $$('[data-kanal-feld]', f).forEach(b => b.onclick = () => bAendern(l => { const k = b.dataset.kanal, x = l[i].kanaele || []; l[i].kanaele = x.includes(k) ? x.filter(y => y !== k) : x.concat(k); }, true));
    $$('[data-weg]', f).forEach(b => b.onclick = () => {
      const x = S.b.f[i], n = feld === 'themen' ? beitraege().filter(y => y.thema === x.k).length : feld === 'formate' ? beitraege().filter(y => y.format === x.k).length : 0;
      if (!confirm(`«${x.titel || x.t || x.name}» entfernen?${n ? ` ${mz(n, 'Beitrag trägt', 'Beiträge tragen')} es noch, sie behalten ihre Angabe, bis du sie änderst.` : ''} Nach dem Speichern hat die Quittung «Rückgängig».`)) return;
      S.b.f.splice(i, 1); S.b.geaendert = true; speichereBereich();
    });
  });
  $$('[data-neue-phase]', r).forEach(b => b.onclick = () => {
    const l = S.b.f, letzte = l[l.length - 1] || { bis: heute() }, n = l.length + 1, id = 'p' + (Math.max(0, ...l.map(p => +String(p.id).replace(/\D/g, '') || 0)) + 1);
    l.push({ id, name: 'Phase ' + n, titel: 'Neue Phase', ziel: '', von: plusTage(letzte.bis, 1), bis: plusTage(letzte.bis, 28), farbe: FARBEN[(n + 3) % FARBEN.length] });
    S.b.geaendert = true; speichereBereich().then(() => gehe('phase:' + id));
  });
  $$('[data-neu-eintrag]', r).forEach(b => b.onclick = () => {
    const feld = b.dataset.neuEintrag, l = S.b.f, k = (feld === 'themen' ? 'thema-' : 'format-') + Date.now().toString(36);
    l.push(feld === 'themen' ? { k, t: 'Neues Thema', s: '', anteil: '', farbe: FARBEN[l.length % FARBEN.length] } : { k, t: 'Neues Format', s: '', kanaele: [], farbe: FARBEN[l.length % FARBEN.length] });
    S.b.geaendert = true; speichereBereich().then(() => gehe((feld === 'themen' ? 'thema:' : 'format:') + k));
  });
  $$('form[data-kanal-form]', r).forEach(f => { f.onsubmit = e => { e.preventDefault(); speichereBereich(); }; $$('input,textarea', f).forEach(x => x.addEventListener('input', () => bAendern(o => { o[x.name] = x.value; }))); });
  $$('form[data-zeilen]', r).forEach(f => {
    const feld = f.dataset.zeilen; f.onsubmit = e => { e.preventDefault(); speichereBereich(); };
    $$('.ap-zeile', f).forEach(z => $$('input,textarea,select', z).forEach(x => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', () => bAendern(l => { l[+z.dataset.i][x.name] = x.value; }))));
    $$('[data-zeile-weg]', f).forEach(b => b.onclick = () => bAendern(l => { l.splice(+b.dataset.zeileWeg, 1); }, true));
    $$('[data-zeile-neu]', f).forEach(b => b.onclick = () => bAendern(l => { l.push(feld === 'fragen' ? { t: '', s: '', a: '' } : { t: '', zeitraum: '', kanal: '', ziel: '' }); }, true));
  });
  $$('form[data-rhythmus]', r).forEach(f => {
    f.onsubmit = e => { e.preventDefault(); speichereBereich(); };
    $$('.ap-wt', f).forEach(z => $$('input,select', z).forEach(x => x.addEventListener(x.tagName === 'SELECT' ? 'change' : 'input', () => bAendern(l => { l[+z.dataset.i][x.name] = x.value; }, x.tagName === 'SELECT'))));
  });
  $$('form[data-grundlage]', r).forEach(f => {
    f.onsubmit = e => { e.preventDefault(); speichereBereich(); };
    const h = $('[name=haltung]', f); if (h) h.addEventListener('input', () => bAendern(o => { o.haltung = h.value; }));
    $$('.ap-zeile', f).forEach(z => { const t = $('textarea', z); t.addEventListener('input', () => bAendern(o => { o.regeln[+z.dataset.i] = t.value; })); });
    $$('[data-regel-weg]', f).forEach(b => b.onclick = () => bAendern(o => { o.regeln.splice(+b.dataset.regelWeg, 1); }, true));
    $$('[data-regel-neu]', f).forEach(b => b.onclick = () => bAendern(o => { o.regeln.push(''); }, true));
  });
  $$('[data-bereich-speichern]', r).forEach(b => b.onclick = speichereBereich);
  ziehen(r);
}
/* Ziehen: auf einen Tag legen, in die Ablage (ohne Tag), im Feed auf eine andere Kachel (Tage tauschen) */
function ziehen(r) {
  $$('[data-ziehen]', r).forEach(c => {
    c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', c.dataset.ziehen); e.dataTransfer.effectAllowed = 'move'; c.classList.add('zieht'); document.documentElement.classList.add('ap-zieht'); });
    c.addEventListener('dragend', () => { c.classList.remove('zieht'); document.documentElement.classList.remove('ap-zieht'); });
  });
  $$('[data-tag]', r).forEach(t => {
    t.addEventListener('dragover', e => { e.preventDefault(); t.classList.add('ziel'); });
    t.addEventListener('dragleave', e => { if (!t.contains(e.relatedTarget)) t.classList.remove('ziel'); });
    t.addEventListener('drop', async e => {
      e.preventDefault(); t.classList.remove('ziel');
      const id = e.dataTransfer.getData('text/plain'), b = beitrag(id), ziel = t.dataset.tag; if (!b || (b.datum || '') === ziel) return;
      await aendere(id, { datum: ziel, stand: ziel && b.stand === 'idee' ? 'entwurf' : b.stand }, ziel ? `«${kurz(b.titel, 40)}» auf ${datumZahl(ziel)} gelegt` : `«${kurz(b.titel, 40)}» hat keinen Tag mehr`);
    });
  });
  $$('[data-feld]', r).forEach(t => {
    t.addEventListener('dragover', e => { e.preventDefault(); t.classList.add('ziel'); });
    t.addEventListener('dragleave', () => t.classList.remove('ziel'));
    t.addEventListener('drop', async e => { e.preventDefault(); e.stopPropagation(); t.classList.remove('ziel'); const id = e.dataTransfer.getData('text/plain'); if (id && id !== t.dataset.feld) await tausche(id, t.dataset.feld); });
  });
}

/* ---------------------------------------------------------------- Start */
function startfehler(grund) {
  document.documentElement.classList.remove('sc-wartet');
  $('#ansicht').innerHTML = `<div class="sc-tuer-zu" role="alert"><h1>Der Content-Plan startet nicht.</h1><p>${esc(grund)}</p><p>Läuft die Zentrale? Starten mit <code>python3 zentrale/server.py</code>, dann neu laden.</p></div>`;
}
function bereit() {
  const srcs = $$('#ansicht img').slice(0, 24).filter(i => i.getBoundingClientRect().top < innerHeight).map(i => i.src);
  return Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, ...srcs.map(s => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = s; }))]), new Promise(r => setTimeout(r, 1300))]);
}
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); allesSpeichern(); }
  if (e.key === 'Escape' && S.e && !document.documentElement.classList.contains('wo-rand-auf')) schliesse();
});
$('#schub-grund').addEventListener('click', schliesse);
addEventListener('beforeunload', e => { if ((S.e && S.e.geaendert) || (S.b && S.b.geaendert)) { e.preventDefault(); e.returnValue = ''; } });
(async function () {
  try {
    if (!window.WO) throw new Error('Das Kleid (oberflaeche.js) fehlt.');
    const r = await (window.__vorab || fetch(API + 'stand', { cache: 'no-store' }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
    S.d = j;
    const sg = Object.values(j.beitraege).filter(b => b.thema === 'styleguide').sort((a, b) => a.id.localeCompare(b.id)); window.SO_FOLGE = b => { const i = sg.findIndex(x => x.id === b.id); return i < 0 ? '' : i + 1; };
    let a = decodeURIComponent(location.hash.slice(1));
    if (!gueltig(a)) { try { const l = localStorage.getItem('tasty-plan-ansicht'); a = gueltig(l) ? l : 'kalender'; } catch (e) { a = 'kalender'; } }
    if (/^kanal:/.test(a)) { location.replace('../#' + a); return; }
    S.ansicht = a; const { art, id } = bereich();
    if (art === 'phase') S.monat = phase(id).von.slice(0, 7);
    kopf(); rand(); leiste(); zeichne();
    await bereit();
    document.documentElement.classList.remove('sc-wartet');
    document.body.classList.add('sc-bereit');
  } catch (e) { return startfehler(String(e && e.message || e).slice(0, 200)); }
  addEventListener('hashchange', () => { const z = decodeURIComponent(location.hash.slice(1)); if (gueltig(z) && z !== S.ansicht) gehe(z); });
})();
