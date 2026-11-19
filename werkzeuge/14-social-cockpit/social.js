/* Social Cockpit · Tasty Studios (12.11.2026). Robert: «für Anna im Stil des Sales Cockpits ein weiteres Tool … alle Plattformen, auf denen wir präsent sein wollen,
   im Überblick … Content planen … Strategien erstellen, wann wie was gepostet werden soll … wo gerade was wie draussen ist … wie die Interaktionen sind …
   Archive mit verschiedenen Posts … KI-Checks nach Rechtschreibung und Format und Ideen.»
   Gerüst aus dem Sales Cockpit (Kopf, Rand, Startbild, Lage, Spalte «Parat», Leiste, Quittung mit «Rückgängig»). Ansichten:
   start · strategie · planung · kanal:<id> · beitrag:<id> · wirkung · archiv · pruefung · material
   Daten über api.py; Prüfung der Texte mit pruefeText() aus /werkzeuge/08-beitraege/regeln.js plus den Regeln je Kanal. Postet nichts selbst, kostet nichts. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ORDNER = '14-social-cockpit', API = '/zentrale/api/' + ORDNER + '/', NAME = 'Social Cockpit';
const H = window.WO_HAUS || {};
if (H.namen && !H.namen[ORDNER]) H.namen[ORDNER] = NAME;   // das Kleid kennt Werkzeug 14 nicht: nur für diese Seite ergänzt (wie im Sales Cockpit)
const FOTO = k => (H.fotos && H.fotos[k]) || H.foto;
const WEBSITE = (H.wege && H.wege.website) || 'https://tastyrob123.github.io/tastystudios/';
const WER = () => H.wer || 'Robert';
const zahl = n => Number(n || 0).toLocaleString('de-CH');
const datum = s => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(s || ''); return m ? `${+m[3]}.${+m[2]}.${m[1]}${m[4] ? ', ' + m[4] : ''}` : ''; };
const kurz = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t; };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const jetzt = () => { const d = new Date(); return iso(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const kopie = o => JSON.parse(JSON.stringify(o == null ? null : o));
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const mz = (n, eins, viele) => (n === 1 ? 'ein' + (/e$/.test(eins) ? 'e' : '') : zahl(n)) + '\u00a0' + (n === 1 ? eins : viele);

/* ---------------------------------------------------------------- Kanäle: Grenzen und Masse (Stand Nov. 2026; Instagram/Facebook-Zahlen veröffentlicht Meta nicht, es sind die allgemein genannten) */
const GRENZE = {
  linkedin: { zeichen: 3000, sichtbar: 150, bild: '1200 × 1200 oder 1080 × 1350', ic: 'person', kurz: 'LI' },
  instagram: { zeichen: 2200, sichtbar: 125, bild: '1080 × 1350 (4:5), Reel 1080 × 1920', ic: 'foto', kurz: 'IG', bildPflicht: true, linkTot: true },
  tiktok: { zeichen: 2200, bild: '1080 × 1920 (9:16)', ic: 'auge', kurz: 'TT', bildPflicht: true, linkTot: true },
  facebook: { zeichen: 63206, bild: '1080 × 1350 (4:5)', ic: 'chat', kurz: 'FB' },
  pinterest: { zeichen: 500, titel: 100, bild: '1000 × 1500 (2:3)', ic: 'blatt', kurz: 'PI', bildPflicht: true },
  google: { zeichen: 1500, bild: '1200 × 900 (4:3)', ic: 'welt', kurz: 'GO' },
  newsletter: { ic: 'mail', kurz: 'NL', eigen: true }
};
const STAENDE = [['idee', 'Idee'], ['entwurf', 'Entwurf'], ['geprueft', 'Geprüft'], ['freigegeben', 'Freigegeben'], ['geplant', 'Geplant'], ['draussen', 'Draussen']];
const STAND = Object.fromEntries(STAENDE.concat([['verworfen', 'Verworfen']]));
const FOTO_JE = { start: 'bildschirm', strategie: 'plan', planung: 'bildschirm', wirkung: 'speicherstadt', archiv: 'zimmer', pruefung: 'tafel', material: 'haus' };
const KANAL_FOTO = { linkedin: 'studio', instagram: 'terrasse', tiktok: 'bar', facebook: 'empfang', pinterest: 'tafel', google: 'aussen', newsletter: 'faehre' };
const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/* ---------------------------------------------------------------- Zustand */
const S = { ansicht: 'start', d: null, entwurf: null, server: true, monat: null, filter: { kanal: '', stand: '', thema: '', suche: '', gruppe: '' }, reiter: '', bearbeiten: '' };
const kanaele = () => (S.d.reihe || Object.keys(S.d.kanaele)).map(k => S.d.kanaele[k]).filter(Boolean);
const kanal = id => S.d.kanaele[id];
const kname = id => (kanal(id) || {}).name || id;
const beitraege = () => Object.values(S.d.beitraege);
const beitrag = id => S.d.beitraege[id];
const themen = () => (S.d.strategie.themen || []);
const thema = k => (themen().find(t => t.k === k) || {}).t || '';
const heute = () => S.d.heute || iso(new Date());
const plusTage = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const wocheVon = s => { const d = new Date(s + 'T12:00'), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); };
const offenFuerAnna = () => beitraege().filter(b => b.stand === 'geprueft');
const imKanal = (b, k) => (b.kanaele || []).includes(k);
const bildVon = b => b.bild || '';
const textVon = (b, k) => (((b.fassungen || {})[k] || {}).text || '');
const ersterText = b => { for (const k of (b.kanaele || [])) { const t = textVon(b, k); if (t) return t; } return Object.values(b.fassungen || {}).map(f => f.text).find(Boolean) || ''; };
const summeI = z => ['likes', 'kommentare', 'geteilt', 'gespeichert'].reduce((n, k) => n + (+(z || {})[k] || 0), 0);

function gueltig(a) {
  if (!a) return false;
  if (['start', 'strategie', 'planung', 'wirkung', 'archiv', 'pruefung', 'material'].includes(a)) return true;
  if (/^kanal:/.test(a)) return !!kanal(a.slice(6));
  if (/^beitrag:/.test(a)) return !!beitrag(a.slice(8));
  return false;
}
const ansichtName = a => ({ start: 'Start', strategie: 'Strategie', planung: 'Planung', wirkung: 'Draussen und Wirkung', archiv: 'Archiv', pruefung: 'Prüfung', material: 'Material' }[a]
  || (/^kanal:/.test(a) ? kname(a.slice(6)) : /^beitrag:/.test(a) ? 'Werkstatt' : NAME));

/* ---------------------------------------------------------------- Kopf, Rand, Leiste */
function kopf() {
  const w = beitraege().filter(b => b.datum && b.datum >= wocheVon(heute()) && b.datum < plusTage(wocheVon(heute()), 7) && /^(freigegeben|geplant|draussen)$/.test(b.stand)).length;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: ORDNER, unter: 'Kommunikation', titel: ansichtName(S.ansicht), stand: w ? mz(w, 'Beitrag', 'Beiträge') + ' diese Woche' : 'Diese Woche nichts geplant', website: WEBSITE, marke: 'data-gehe="start"', markeHref: '#start' });
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
}
function rand() {
  /* ein Rand für das ganze Werkzeug, dieselbe Reihenfolge wie in der Planung (wege.js) */
  $('#rand').innerHTML = WO.rand(soWege(S.d, 'cockpit', /^beitrag:/.test(S.ansicht) ? '' : S.ansicht), {});
  soWegeSchmuck($('#rand'), 'cockpit', (H.wege && H.wege.zentrale) || '/zentrale/', WO.ic);
}
function leiste() {
  let titel, satz, kn;
  const b = /^beitrag:/.test(S.ansicht) ? beitrag(S.ansicht.slice(8)) : null;
  if (b) {
    const dirty = !!(S.entwurf && S.entwurf.geaendert);
    const p = pruefeBeitrag(S.entwurf ? S.entwurf.f : b);
    titel = dirty ? 'Beitrag nicht gespeichert' : `${STAND[b.stand] || 'Idee'} · ${p.fehler ? mz(p.fehler, 'Fehler', 'Fehler') : 'ohne Fehler'}`;
    satz = S.server ? (dirty ? 'Du hast am Beitrag etwas geändert. Speichern, damit es bleibt.' : 'Texte je Kanal links, die Vorschau rechts. Gepostet wird in der App des Kanals, hier steht alles fertig bereit.') : 'Ohne den Server lässt sich nichts speichern.';
    kn = WO.knopf('Text kopieren', 'kopie', 'glas', { klein: true, attr: 'data-kopieren' }) + WO.knopf('Speichern', 'haken', dirty ? 'gold' : 'glas', { klein: true, attr: 'data-speichern', disabled: !dirty || !S.server });
  } else if (S.bearbeiten) {
    titel = 'Änderungen nicht gespeichert'; satz = 'Speichern, damit es bleibt. Die Quittung hat «Rückgängig».';
    kn = WO.knopf('Verwerfen', 'x', 'glas', { klein: true, attr: 'data-verwerfen' }) + WO.knopf('Speichern', 'haken', 'gold', { klein: true, attr: 'data-form-speichern' });
  } else {
    const o = offenFuerAnna().length;
    titel = o ? (o === 1 ? 'Ein Beitrag wartet auf Freigabe' : o + ' Beiträge warten auf Freigabe') : 'Alles, was nach aussen geht';
    satz = 'Eine Idee aufschreiben, im Kalender einplanen, je Kanal schreiben und prüfen. Gepostet wird in der App des Kanals.';
    kn = WO.knopf('Kalender', 'uhr', 'glas', { klein: true, href: 'plan/#kalender' }) + WO.knopf('Neuer Beitrag', 'plus', 'gold', { klein: true, attr: 'data-neu' });
  }
  $('#leiste').innerHTML = WO.leiste({ titel, satz, knoepfe: kn });
  $$('#leiste [data-gehe]').forEach(x => x.onclick = () => gehe(x.dataset.gehe));
  $$('#leiste [data-neu]').forEach(x => x.onclick = () => neuerBeitrag({}));
  $$('#leiste [data-speichern]').forEach(x => x.onclick = speichernBeitrag);
  $$('#leiste [data-kopieren]').forEach(x => x.onclick = textKopieren);
  $$('#leiste [data-form-speichern]').forEach(x => x.onclick = () => { const f = $('#ansicht form[data-form]'); if (f) f.requestSubmit(); });
  $$('#leiste [data-verwerfen]').forEach(x => x.onclick = () => { S.bearbeiten = ''; neuZeichnen(); });
}

/* ---------------------------------------------------------------- Wege */
function gehe(a, oben = true) {
  if (a === 'planung' || a === 'strategie') { location.href = 'plan/#' + (a === 'planung' ? 'kalender' : 'thema:' + ((S.d.strategie.themen || [])[0] || {}).k); return; }   /* Kalender und Strategie leben seit 13.11.2026 in der Planung */
  if (!gueltig(a)) a = 'start';
  if ((S.entwurf && S.entwurf.geaendert || S.bearbeiten) && a !== S.ansicht && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem wechseln?')) return;
  S.ansicht = a; S.entwurf = null; S.bearbeiten = ''; S.reiter = '';
  try { localStorage.setItem('tasty-so-ansicht', a); } catch (e) { /* privat */ }
  history.replaceState(null, '', location.pathname + location.search + '#' + a);
  kopf(); rand(); leiste(); zeichne();
  if (oben) scrollTo({ top: 0 });
}
function neuZeichnen() { const y = scrollY; kopf(); rand(); leiste(); zeichne(); scrollTo({ top: y }); }
function zeichne() {
  const a = S.ansicht, el = $('#ansicht');
  el.innerHTML = a === 'start' ? start() : a === 'strategie' ? strategie() : a === 'planung' ? planung() : a === 'wirkung' ? wirkung() : a === 'archiv' ? archiv()
    : a === 'pruefung' ? pruefSeite() : a === 'material' ? material() : /^kanal:/.test(a) ? kanalMappe(kanal(a.slice(6))) : werkstatt(beitrag(a.slice(8)));
  $$('#ansicht [data-gehe]').forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe); });
  $$('#ansicht [data-sprung]').forEach(b => b.onclick = e => { e.preventDefault(); const z = document.getElementById(b.dataset.sprung); if (z) z.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'start' }); });
  $$('#ansicht [data-neu]').forEach(b => b.onclick = () => neuerBeitrag(b.dataset.neu ? JSON.parse(b.dataset.neu) : {}));
  $$('#ansicht [data-bearbeiten]').forEach(b => b.onclick = () => { S.bearbeiten = b.dataset.bearbeiten; neuZeichnen(); const f = $('#ansicht form[data-form]'); if (f) f.scrollIntoView({ block: 'start', behavior: RUHIG() ? 'auto' : 'smooth' }); });
  $$('#ansicht [data-abbrechen]').forEach(b => b.onclick = () => { S.bearbeiten = ''; neuZeichnen(); });
  formLeben(el);
  if (a === 'planung') planungLeben(el);
  if (a === 'start') ziehenLeben(el);
  if (a === 'archiv') archivLeben(el);
  if (a === 'wirkung' || /^kanal:/.test(a)) zahlenLeben(el);
  if (a === 'material') materialLeben(el);
  if (/^beitrag:/.test(a)) werkstattLeben(el, beitrag(a.slice(8)));
  auftritte(el);
}

/* Auftritte wie im Sales Cockpit: federnd aus 40 px, nur transform */
let IO = null;
function auftritte(r) {
  const alle = $$('[data-r]', r);
  if (IO) IO.disconnect();
  if (RUHIG()) { alle.forEach(x => x.classList.add('da', 'steht')); return; }
  const H0 = innerHeight; let n = 0;
  IO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { IO.unobserve(e.target); e.target.classList.add('da'); } }), { rootMargin: '0px 0px -2% 0px' }) : null;
  alle.forEach(x => {
    const b = x.getBoundingClientRect();
    if (b.top < H0 && b.bottom > 0 && n < 20) { x.style.setProperty('--i', Math.min(n++, 6)); requestAnimationFrame(() => requestAnimationFrame(() => x.classList.add('da'))); }
    else if (IO) IO.observe(x); else x.classList.add('da', 'steht');
  });
}

/* ---------------------------------------------------------------- Bausteine */
const zwei = (a, b) => `${esc(a)} <em>${esc(b || '')}</em>`;
const kopfBlock = (t, lead, id) => `<header class="sc-kopf" data-r${id ? ` id="${id}"` : ''}><h2 class="sc-t">${zwei(t[0], t[1])}</h2>${lead ? `<p class="sc-lead">${esc(lead)}</p>` : ''}</header>`;
const lg = (mk, b, p) => `<div class="wo-lg"><span class="wo-mk">${esc(mk)}</span><b>${b}</b>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
const standMarke = s => `<span class="so-stand so-stand--${esc(s || 'idee')}">${esc(STAND[s] || 'Idee')}</span>`;
const kanalMarken = l => soLogos(l);
const quelle = t => `<p class="sc-quelle">${esc(t)}</p>`;

/* Zeile eines Beitrags: Bild (falls vorhanden), Titel, Stand, Kanäle, Datum */
/* Bildkarte: jedes Stück zeigt ein Bild. Hat ein Beitrag keins, steht eine Schriftkarte im Ton seines Themas (Titel in Antonio, das Zeichen klein), nie eine leere Fläche. */
const TON = { haeuser: 'nacht', styleguide: 'papier', schaukasten: 'schiefer', beweis: 'tief', notion: 'taupe', kurse: 'papier', studio: 'nacht' };
const cover = (b, kl = '') => soGrafik(b, kl);
const hauptKanal = b => (b.kanaele || [])[0] || 'newsletter';
const welt = k => (window.SO_WELT || {})[k] || {};
const kStil = k => `--k:${welt(k).farbe};--kt:${welt(k).tief};--kh:${welt(k).hell};--kg:${welt(k).grad}`;
const tagName = s => { const d = new Date(s + 'T12:00'); return TAGE[(d.getDay() + 6) % 7]; };
const datumKurz = s => { const d = new Date(s + 'T12:00'); return `${d.getDate()}. ${MONATE[d.getMonth()]}`; };
/* Agenda: Woche für Woche, je Beitrag eine breite Karte mit Tag, Bild, Kanal in seiner Farbe und Text */
function agenda(l, o = {}) {
  if (!l.length) return `<p class="so-hinweis" data-r>${esc(o.leer || 'In diesem Zeitraum ist nichts geplant.')}</p>`;
  const wochen = {}; l.forEach(b => { const w = wocheVon(b.datum); (wochen[w] = wochen[w] || []).push(b); });
  return `<div class="so-ag" data-r>${Object.keys(wochen).sort().map(w => `<div class="so-ag__woche"><p class="so-ag__kopf"><b>Woche ${KW(w)}</b><span>${esc(datumKurz(w))} bis ${esc(datumKurz(plusTage(w, 6)))}</span></p>
    ${wochen[w].sort((a, b) => a.datum.localeCompare(b.datum)).map(b => { const k = hauptKanal(b);
      return `<button type="button" class="so-ag__b${b.datum === heute() ? ' heute' : ''}" style="${kStil(k)}" data-gehe="beitrag:${esc(b.id)}">
        <span class="so-ag__tag"><b>${esc(tagName(b.datum).slice(0, 2))}</b><span>${new Date(b.datum + 'T12:00').getDate()}</span><small>${esc(MONATE[new Date(b.datum + 'T12:00').getMonth()].slice(0, 3))}</small></span>
        <span class="so-ag__bild">${bild(b)}</span>
        <span class="so-ag__t"><span class="so-ag__k">${kanalMarken(b.kanaele)}<em>${(b.kanaele || []).map(kname).join(' und ')}</em></span><b>${esc(b.titel)}</b><small>${esc(kurz(ersterText(b) || b.notiz || '', o.kurz ? 90 : 160))}</small></span>
        ${/^(freigegeben|geplant|draussen)$/.test(b.stand) ? `<span class="so-ag__m"><em class="so-ag__st">${esc(STAND[b.stand])}</em></span>` : ''}</button>`; }).join('')}</div>`).join('')}</div>`;
}
const bild = (b, kl = '') => bildVon(b) ? `<img class="${kl}" src="${esc(bildVon(b))}" alt="" loading="lazy" decoding="async">` : cover(b, kl);
const vorschlagMarke = () => '';   /* «Vorschlag»-Marke raus (Robert 17.11.2026: keine kleinen Textfelder, die überall herumschweben) */

/* Zeile eines Beitrags: Bild oder Schriftkarte, Titel, Stand, Kanäle, Datum */
function zeile(b, o = {}) {
  const t = ersterText(b);
  return `<li class="so-z" style="${kStil(hauptKanal(b))}"><button type="button" data-gehe="beitrag:${esc(b.id)}">
    <span class="so-z__b">${bild(b)}</span>
    <span class="so-z__t"><span class="so-z__k">${kanalMarken(b.kanaele)}<em>${(b.kanaele || []).map(kname).join(' · ')}</em></span><b>${esc(b.titel)}</b><small>${esc(o.satz != null ? o.satz : kurz(t || b.notiz || thema(b.thema) || '', 120))}</small></span>
    <span class="so-z__m">${vorschlagMarke(b)}${standMarke(b.stand)}${b.datum ? `<em>${esc(tagName(b.datum).slice(0, 2))}, ${esc(datumKurz(b.datum))}</em>` : ''}</span>
    <i class="so-z__p">${WO.ic('rechts')}</i></button></li>`;
}
/* Karte eines Beitrags für Raster und Kalender: Bild oben, darunter Kanal, Zeit, Titel */
function karteB(b, o = {}) {
  return `<button type="button" class="so-bk" style="${kStil(hauptKanal(b))}" data-gehe="beitrag:${esc(b.id)}"${o.ziehen ? ` draggable="true" data-ziehen="${esc(b.id)}"` : ''}>
    <span class="so-bk__bild">${bild(b)}<span class="so-bk__lg">${kanalMarken(b.kanaele)}</span></span>
    <span class="so-bk__t"><b>${esc(kurz(b.titel, o.lang || 56))}</b>${b.datum && o.datum !== false ? `<small>${esc(tagName(b.datum))}, ${esc(datumKurz(b.datum))}</small>` : `<small>${esc((b.kanaele || []).map(kname).join(' · ') || 'Idee')}</small>`}</span></button>`;
}
const fueller = (n, sp, text, attr) => n % sp ? `<button type="button" class="so-fueller${n % 3 ? '' : ' so-fueller--nur-gross'}" style="--r6:${sp - n % sp};--r3:${(3 - n % 3) % 3 || 1}" ${attr}><span>${esc(text)}</span>${WO.ic('rechts')}</button>` : '';
const liste = (l, o) => l.length ? `<ol class="so-liste" data-r>${l.map(b => zeile(b, o)).join('')}</ol>` : '';

/* Bühne der Woche: sieben Tage als Spalten, je Beitrag eine Bildkarte; ziehen auf einen anderen Tag verlegt ihn */
/* ---------------------------------------------------------------- Übersicht */
function start() {
  /* schlank (Robert 17.11.2026): keine Schritte-Karten, keine Zahlenleiste, keine Quellenzeile; nur, womit Anna heute arbeitet */
  const h = heute(), alle = beitraege();
  S.genutzt = new Set();
  const naechste = alle.filter(b => b.datum >= h && b.stand !== 'verworfen').sort((a, b) => a.datum.localeCompare(b.datum));
  const r = (S.d.strategie.rhythmus || []).filter(x => x.kanal).sort((a, b) => TAGE.indexOf(a.tag) - TAGE.indexOf(b.tag));
  const takt = r.length ? `Der Rhythmus: ${r.map(x => x.tag + ' ' + kname(x.kanal)).join(', ').replace(/, ([^,]*)$/, ' und $1')}.` : 'Noch ist kein Wochenrhythmus festgelegt.';
  return `${WO.startbild({ werkzeug: ORDNER, art: 'voll', foto: FOTO(FOTO_JE.start), h1: `${esc(WO.gruss().replace(/\.$/, ''))}, ${esc(WER())}. <em>Was geht heute raus?</em>`, zier: esc(NAME + ' · ' + datum(h)),
      satz: takt + ' Jeder Beitrag wird hier geschrieben und geprüft, gepostet wird in der App des Kanals.',
      knoepfe: WO.knopf('Zum Kalender', 'rechts', 'gold', { href: 'plan/#kalender' }) + WO.knopf('Neuer Beitrag', 'plus', 'glas', { attr: 'data-neu' }) })}
    <section class="sc-block">${kopfBlock(['Die nächsten', 'zwei Wochen.'], 'Ein Klick öffnet den Beitrag zum Schreiben und Prüfen.')}
      ${agenda(naechste.filter(b => b.datum < plusTage(h, 14)), { kurz: true, leer: 'In den nächsten zwei Wochen ist nichts geplant.' })}
      <div class="so-mehr" data-r>${WO.knopf('Ganzer Kalender', 'rechts', 'dunkel', { klein: true, href: 'plan/#kalender' })}</div></section>
    <section class="sc-block" id="kanaele">${kopfBlock(['Die', 'Kanäle.'], 'Ein Klick öffnet den Feed, so wie er dort aussieht.')}
      <div class="so-kw-raster" data-r>${kanaele().map(kanalKachel).join('')}</div></section>`;
}
/* Die vier Schritte: was es ist, was gerade dort liegt, ein Knopf hinein (Robert 13.11.2026: «besser und einfacher erklärt und erreichbar») */
function schritte() {
  const h = heute(), s = S.d.strategie, B = beitraege().filter(b => b.stand !== 'verworfen'), E = window.SO_ERKLAERT || {};
  const ph = (s.phasen || []).find(p => h <= p.bis) || (s.phasen || [])[0];
  const offen = (s.fragen || []).filter(f => !f.a).length, plan = B.filter(b => b.datum && b.datum >= h).length, ideen = B.filter(b => !b.datum && !/^Feed-Entwurf/.test(b.gruppe || '')).length;
  const draussen = B.filter(b => b.stand === 'draussen').length, arbeit = B.filter(b => /^(entwurf|geprueft)$/.test(b.stand) && b.datum && b.datum >= h).length;
  const karte = (n, titel, satz, fakten, knopf) => `<article class="so-sr"><span class="so-sr__n">${n}</span><h3>${esc(titel)}</h3><p>${esc(satz)}</p><ul>${fakten.map(f => `<li>${f}</li>`).join('')}</ul>${knopf}</article>`;
  return `<section class="sc-block so-schritte-block" data-r><header class="sc-kopf"><h2 class="sc-t">So arbeitest du <em>hier.</em></h2><p class="sc-lead">Vier Schritte, von der Grundlage bis zur Auswertung. Jeder Schritt hat links im Rand seinen eigenen Teil.</p></header>
    <div class="so-schritte">
      ${karte(1, 'Grundlage', E.grundlage, [`<b>${zahl((s.themen || []).length)}</b> Themen · <b>${zahl((s.formate || []).length)}</b> Formate`, `<b>${zahl(offen)}</b> offene Fragen`], WO.knopf('Zu den Themen', 'rechts', 'dunkel', { klein: true, href: 'plan/#thema:' + esc(((s.themen || [])[0] || {}).k || '') }))}
      ${karte(2, 'Planen', E.planen, [`<b>${zahl(plan)}</b> Beiträge ab heute im Kalender`, `<b>${zahl(ideen)}</b> Ideen noch ohne Tag`], WO.knopf('Zum Kalender', 'rechts', 'dunkel', { klein: true, href: 'plan/#kalender' }))}
      ${karte(3, 'Kanäle und Texte', E.kanaele, [`<b>${zahl(kanaele().length)}</b> Kanäle`, `<b>${zahl(arbeit)}</b> geplante Beiträge noch im Entwurf`], WO.knopf('Zu den Kanälen', 'rechts', 'dunkel', { klein: true, attr: 'data-sprung="kanaele"' }))}
      ${karte(4, 'Auswerten', E.auswerten, [`<b>${zahl(draussen)}</b> Beiträge draussen`, `<b>${zahl(B.length)}</b> im Archiv`], WO.knopf('Draussen und Wirkung', 'rechts', 'dunkel', { klein: true, attr: 'data-gehe="wirkung"' }))}
    </div></section>`;
}
function kanalKachel(k) {
  const g = GRENZE[k.id] || {}, l = beitraege().filter(b => imKanal(b, k.id) && b.stand !== 'verworfen');
  const n = l.filter(b => b.datum >= heute()).sort((a, b) => a.datum.localeCompare(b.datum))[0];
  const arb = l.filter(b => /^(entwurf|geprueft|freigegeben|geplant)$/.test(b.stand)).length, geplant = l.filter(b => b.datum >= heute()).length;
  return `<button type="button" class="so-kk so-kk--${esc(k.id)} so-kk--${esc(standKlasse(k.stand))}" style="${kStil(k.id)}" data-gehe="kanal:${esc(k.id)}">
    <span class="so-kk__kopf">${soLogo(k.id, 'so-lg--l so-lg--hell')}<span><b>${esc(k.name)}</b><small>${esc(k.handle || 'Noch kein Konto')}</small></span></span>
    ${g.eigen ? `<span class="so-kk__n"><span class="so-kk__satz">Ausgaben, Empfänger und Versand im Werkzeug «Post aus dem Studio».</span></span>`
      : n ? `<span class="so-kk__n"><span class="so-kk__bild">${bild(n, 'so-mini')}</span><span><small>Als Nächstes · ${esc(tagName(n.datum).slice(0, 2))}, ${esc(datumKurz(n.datum))}</small><b>${esc(kurz(n.titel, 48))}</b></span></span>`
      : `<span class="so-kk__n"><span class="so-kk__satz">${esc(arb ? arb + (arb === 1 ? ' Entwurf' : ' Entwürfe') + ', noch ohne Tag.' : kurz(k.notiz ? k.notiz + ' ' + k.rolle : k.rolle || 'Noch nichts geplant.', 110))}</span></span>`}
    <span class="so-kk__z">${g.eigen ? '' : `<em><b>${zahl(geplant)}</b> geplant</em><em><b>${zahl(arb)}</b> in Arbeit</em>`}</span></button>`;
}
const standKlasse = s => /angelegt|läuft|eigen/.test(s || '') ? 'da' : /fehlt/.test(s || '') ? 'fehlt' : 'plan';

/* ---------------------------------------------------------------- Kanal-Mappe */
/* Kanal: in seiner Welt. Oben der Kopf in den Farben der Plattform, darunter der Feed im Look der Plattform, rechts der Steckbrief. */
function kanalMappe(k) {
  const g = GRENZE[k.id] || {}, l = beitraege().filter(b => imKanal(b, k.id) && b.stand !== 'verworfen'), z = S.d.zahlen[k.id] || [];
  const edit = S.bearbeiten === 'kanal:' + k.id;
  const n = l.filter(b => b.datum >= heute()).sort((a, b) => a.datum.localeCompare(b.datum))[0];
  const fakt = (t, v) => `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>`;
  return `<section class="so-kw so-kw--${esc(k.id)}" style="${kStil(k.id)}" aria-label="${esc(k.name)}">
      <div class="so-kw__hero">
        <div class="so-kw__marke">${soLogo(k.id, 'so-lg--xl so-lg--hell')}<div><p class="so-kw__s">${esc(k.stand || '')}</p><h1>${esc(k.name)}</h1><p class="so-kw__h">${esc(k.handle || 'Noch kein Konto')}</p></div></div>
        <p class="so-kw__rolle">${esc(k.rolle || '')}</p>
        <div class="so-kw__kn">${k.url ? `<a class="so-kw__knopf so-kw__knopf--voll" href="${esc(k.url)}"${g.eigen ? '' : ' target="_blank" rel="noopener"'}>${g.eigen ? 'Werkzeug öffnen' : 'Kanal öffnen'}${WO.ic('pfeil')}</a>` : ''}
          ${g.eigen ? '' : `<button type="button" class="so-kw__knopf" data-neu='${esc(JSON.stringify({ kanaele: [k.id], stand: 'entwurf' }))}'>Neuer Beitrag${WO.ic('plus')}</button><a class="so-kw__knopf" href="maschine/?kanal=${esc(k.id)}">Grafik bauen${WO.ic('stift')}</a>`}
          <button type="button" class="so-kw__knopf" data-bearbeiten="kanal:${esc(k.id)}">Bearbeiten${WO.ic('stift')}</button></div>
        <dl class="so-kw__fakten">${fakt('Takt', esc(k.takt || 'noch offen'))}${g.zeichen ? fakt('Text', 'bis ' + zahl(g.zeichen) + ' Zeichen' + (g.sichtbar ? `<small>${g.sichtbar} vor «mehr»</small>` : '')) : ''}${g.bild ? fakt('Bild', esc(g.bild.split(',')[0])) : ''}
          ${fakt('Als Nächstes', n ? `<button type="button" class="so-link" data-gehe="beitrag:${esc(n.id)}">${esc(tagName(n.datum).slice(0, 2))}, ${esc(datumKurz(n.datum))}</button>` : 'nichts geplant')}</dl>
      </div>
      ${edit ? kanalForm(k) : ''}
      <div class="so-kw__raster">
        <div class="so-kw__feed" data-r>${feed(k, l)}</div>
        <aside class="so-kw__brief" aria-label="Steckbrief">
          <p class="wo-mk">Steckbrief</p>
          <dl>${fakt('Formate', (k.formate || '').split('\n').filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('') || 'noch offen')}${g.zeichen ? fakt('Hashtags', 'zwei bis fünf') : ''}${fakt('Zugang', esc(k.zugang || 'noch nicht eingetragen'))}
            ${g.eigen ? '' : fakt('Beiträge', `${zahl(l.filter(b => b.datum >= heute()).length)} geplant · ${zahl(l.filter(b => !b.datum && b.stand !== 'idee').length)} ohne Tag · ${zahl(l.filter(b => b.stand === 'idee').length)} Ideen`)}</dl>
          ${k.konzept ? `<div class="so-kw__konzept"><p class="wo-mk">Konzept</p><p>${esc(k.konzept)}</p></div>` : ''}
          ${k.notiz ? `<p class="so-kw__notiz">${esc(k.notiz)}</p>` : ''}
          ${g.eigen ? '' : `<div class="so-kw__brief-kn">${WO.knopf('Alle im Archiv', 'rechts', 'dunkel', { klein: true, attr: `data-gehe="archiv" data-filter-kanal="${esc(k.id)}"` })}${WO.knopf('Zahlen', 'balken', 'dunkel', { klein: true, attr: 'data-sprung="zahlen"' })}</div>`}
        </aside>
      </div>
    </section>
    ${g.eigen ? '' : `<section class="sc-block" id="zahlen">${kopfBlock(['Die', 'Zahlen.'], 'Follower und Reichweite über die Zeit. Von Hand eintragen oder die Export-Datei des Kanals laden.')}${zahlenBlock(k, z)}</section>`}
    ${quelle('Quelle: ' + (k.quelle || 'im Social Cockpit') + (k.geaendert ? ' · zuletzt geändert ' + datum(k.geaendert) + ' von ' + (k.wer || '') : ''))}`;
}
/* Feed im Look der Plattform. Reihenfolge wie im echten Profil: das zuletzt Geplante oben, danach Entwürfe. */
function feedFolge(l) {
  const mit = l.filter(b => b.datum).sort((a, b) => b.datum.localeCompare(a.datum));
  const ohne = l.filter(b => !b.datum && b.stand !== 'idee').sort((a, b) => (a.reihe || '').localeCompare(b.reihe || ''));
  return mit.concat(ohne);
}
const tagKurz = b => b.datum ? `${new Date(b.datum + 'T12:00').getDate()}. ${MONATE[new Date(b.datum + 'T12:00').getMonth()].slice(0, 3)}` : 'Entwurf';
function feed(k, l) {
  const kk = kanal(k.id) || {}, f = feedFolge(l), bio = (kk.bio || '').split('\n').filter(Boolean), id = k.id;
  const av = `<span class="so-av">${WO.zeichen()}</span>`;
  const mehr = (n, alle) => alle > n ? `<button type="button" class="so-fd__mehr" data-gehe="archiv" data-filter-kanal="${esc(id)}">Alle ${zahl(alle)} im Archiv${WO.ic('rechts')}</button>` : '';
  if (id === 'instagram' || id === 'tiktok') {
    const n = Math.min(f.length - f.length % 3, 24), reel = b => (b.kanaele || []).includes('tiktok');
    return `<div class="so-fd so-fd--${id}">
      <div class="so-fd__profil"><span class="so-fd__ring">${av}</span><div><b>${esc(kk.handle || '')}</b>
        <p class="so-fd__zahlen"><span><b>${zahl(f.filter(b => b.datum).length)}</b> geplant</span><span><b>${zahl(f.filter(b => !b.datum).length)}</b> Entwürfe</span></p>
        ${(bio.length ? bio : [kk.rolle || '']).map((x, i) => `<p class="so-fd__bio${i === 0 && bio.length ? ' stark' : ''}">${esc(x)}</p>`).join('')}</div></div>
      <div class="so-fd__reiter"><span class="an">${WO.ic('menue')}${id === 'tiktok' ? 'Videos' : 'Beiträge'}</span><span>${WO.ic('auge')}Reels</span></div>
      ${n ? `<div class="so-fd__raster">${f.slice(0, n).map(b => `<button type="button" data-gehe="beitrag:${esc(b.id)}" class="${b.datum ? 'mit' : ''}">${bild(b)}${reel(b) || id === 'tiktok' ? `<span class="so-fd__play">${WO.ic('rechts')}</span>` : ''}<em>${esc(tagKurz(b))}</em></button>`).join('')}</div>${mehr(n, f.length)}`
        : `<p class="so-fd__ruhig">Noch keine Beiträge mit Bild für ${esc(k.name)}.</p>`}</div>`;
  }
  if (id === 'linkedin' || id === 'facebook') {
    const quelle = id === 'facebook' && !f.length ? feedFolge(beitraege().filter(b => imKanal(b, 'instagram') && b.stand !== 'verworfen')) : f;
    const posts = quelle.slice(0, 5);
    const kopf = `<div class="so-fd__seite"><span class="so-fd__banner"></span><div class="so-fd__seitenkopf">${av}<div><b>Tasty Studios</b><p>${esc(id === 'linkedin' ? (bio[0] || '') : 'Digital Hospitality Studio · Hamburg')}</p></div></div></div>`;
    return `<div class="so-fd so-fd--${id}">${kopf}
      ${id === 'facebook' && !f.length ? `<p class="so-fd__hinweis">Die Seite ist noch nicht angelegt. So sähe sie aus, wenn Instagram mitgespiegelt wird.</p>` : ''}
      ${posts.map(b => { const t = textVon(b, id) || ersterText(b);
        return `<button type="button" class="so-fd__post" data-gehe="beitrag:${esc(b.id)}"><span class="so-fd__pk">${av}<span><b>Tasty Studios</b><small>${esc(b.datum ? tagName(b.datum) + ', ' + datumKurz(b.datum) : 'Entwurf, noch ohne Tag')}</small></span>${vorschlagMarke(b)}</span>
          <span class="so-fd__text">${esc(kurz(t, 230))}${t.length > 230 ? '<i> … mehr</i>' : ''}</span><span class="so-fd__medien">${bild(b)}</span>
          <span class="so-fd__aktion"><span>Gefällt mir</span><span>Kommentieren</span><span>Teilen</span>${id === 'linkedin' ? '<span>Senden</span>' : ''}</span></button>`; }).join('')}
      ${mehr(posts.length, quelle.length)}</div>`;
  }
  if (id === 'pinterest') {
    return `<div class="so-fd so-fd--pinterest"><div class="so-fd__mitte">${av}<b>Tasty Studios</b><p>Pinnwand «Websites» · ${zahl(f.length)} Pins</p></div>
      <div class="so-fd__pins">${f.slice(0, 12 - (Math.min(f.length, 12) % 3)).map((b, i) => `<button type="button" class="so-fd__pin" data-gehe="beitrag:${esc(b.id)}"><span>${bild(b)}</span><b>${esc(kurz(((b.fassungen || {}).pinterest || {}).titel || b.titel, 50))}</b><small>${esc(tagKurz(b))}</small></button>`).join('')}</div>${mehr(12, f.length)}</div>`;
  }
  if (id === 'google') {
    const gb = welt('google').bunt || [];
    return `<div class="so-fd so-fd--google"><div class="so-fd__gkopf"><span class="so-fd__gname">${['T', 'a', 's', 't', 'y'].map((c, i) => `<i style="color:${gb[i % 4]}">${c}</i>`).join('')} Studios</span><p>Hamburg · Websites für Hotels und Restaurants</p>
      <div class="so-fd__greiter"><span>Übersicht</span><span class="an">Neuigkeiten</span><span>Fotos</span></div></div>
      <div class="so-fd__gposts">${f.slice(0, 6).map(b => `<button type="button" class="so-fd__gpost" data-gehe="beitrag:${esc(b.id)}"><span>${bild(b)}</span><span class="so-fd__gt"><small>${esc(b.datum ? datumKurz(b.datum) : 'Entwurf')}</small><b>${esc(kurz(textVon(b, 'google') || b.titel, 110))}</b><em>Mehr erfahren</em></span></button>`).join('')}</div>${mehr(6, f.length)}</div>`;
  }
  return `<div class="so-fd so-fd--newsletter"><div class="so-fd__brief"><p class="wo-mk">Post aus dem Studio</p><b>Der Newsletter von Tasty Studios</b><p>${esc(kk.rolle || '')}</p>${WO.knopf('Werkzeug öffnen', 'pfeil', 'gold', { klein: true, href: '/zentrale/werkzeuge/10-newsletter/' })}</div></div>`;
}
function profil(k, l) {
  const bio = (k.bio || '').split('\n').filter(Boolean);
  const mitBild = l.filter(b => b.bild && b.stand !== 'verworfen').sort((a, b) => (a.reihe || '').localeCompare(b.reihe || '')).slice(0, 9);
  if (k.id === 'instagram' || k.id === 'tiktok' || k.id === 'pinterest') {
    return `<div class="so-profil so-profil--bild" data-r><div class="so-profil__kopf"><span class="so-av">${WO.zeichen()}</span><div><b>${esc(k.handle || k.name)}</b>${bio.map(x => `<small>${esc(x)}</small>`).join('') || `<small>${esc(k.rolle || '')}</small>`}</div></div>
      ${mitBild.length >= 3 ? `<div class="so-raster">${mitBild.slice(0, mitBild.length - mitBild.length % 3).map(b => `<button type="button" data-gehe="beitrag:${esc(b.id)}"><img src="${esc(b.bild)}" alt="${esc(b.titel)}" loading="lazy" decoding="async"></button>`).join('')}</div><p class="so-profil__fuss">Oben die ersten Kacheln aus dem Plan, so wie sie im Raster stehen würden.</p>` : `<p class="so-profil__fuss">Noch keine Beiträge mit Bild für diesen Kanal. Sobald welche geplant sind, steht hier das Raster.</p>`}</div>`;
  }
  return `<div class="so-profil" data-r><div class="so-profil__kopf"><span class="so-av">${WO.zeichen()}</span><div><b>${esc(k.handle || k.name)}</b><small>${esc(k.url ? k.url.replace(/^https?:\/\//, '') : (k.stand || ''))}</small></div></div>
    ${bio.length ? `<div class="so-profil__bio">${bio.map(x => `<p>${esc(x)}</p>`).join('')}</div>` : `<div class="so-profil__bio"><p>${esc(k.rolle || '')}</p></div>`}</div>`;
}
function kanalParat(k, l, z) {
  const g = GRENZE[k.id] || {}, letzte = z.slice(-1)[0], vor = z.slice(-2)[0];
  const naechster = l.filter(b => b.datum >= heute() && /^(freigegeben|geplant)$/.test(b.stand)).sort((a, b) => a.datum.localeCompare(b.datum))[0];
  return `<aside class="sc-parat so-parat" aria-label="Parat zum Kanal"><div class="sc-parat__inhalt"><span class="wo-mk">Parat für ${esc(k.name)}</span>
    <dl>
      <div><dt>Stand</dt><dd>${esc(k.stand || '')}${k.handle ? `<small>${esc(k.handle)}</small>` : ''}</dd></div>
      ${g.zeichen ? `<div><dt>Text</dt><dd>höchstens ${zahl(g.zeichen)} Zeichen${g.sichtbar ? `<small>die ersten ${g.sichtbar} sind ohne «mehr» sichtbar</small>` : ''}</dd></div>` : ''}
      ${g.titel ? `<div><dt>Titel</dt><dd>höchstens ${g.titel} Zeichen</dd></div>` : ''}
      ${g.bild ? `<div><dt>Bild</dt><dd>${esc(g.bild)}</dd></div>` : ''}
      ${g.zeichen ? `<div><dt>Hashtags</dt><dd>zwei bis fünf</dd></div>` : ''}
      <div><dt>Nächster Beitrag</dt><dd>${naechster ? `<button type="button" class="so-link" data-gehe="beitrag:${esc(naechster.id)}">${esc(kurz(naechster.titel, 40))}</button><small>${esc(datum(naechster.datum))}</small>` : 'Noch keiner freigegeben'}</dd></div>
      ${letzte ? `<div><dt>Zuletzt gezählt</dt><dd>${letzte.follower ? zahl(letzte.follower) + ' Follower' : (letzte.reichweite ? zahl(letzte.reichweite) + ' erreicht' : '–')}<small>${esc(datum(letzte.datum))}${vor && vor !== letzte && letzte.follower && vor.follower ? ' · ' + (letzte.follower - vor.follower >= 0 ? '+' : '') + zahl(letzte.follower - vor.follower) : ''}</small></dd></div>` : ''}
    </dl>
    <div class="sc-parat__kn">${k.url ? WO.knopf(g.eigen ? 'Öffnen' : 'Kanal öffnen', 'pfeil', 'gold', { klein: true, href: esc(k.url), neu: !g.eigen }) : ''}${WO.knopf('Bearbeiten', 'stift', 'glas', { klein: true, attr: `data-bearbeiten="kanal:${esc(k.id)}"` })}</div>
    <nav class="sc-parat__nav" aria-label="In der Mappe">${[['profil', 'Das Profil'], ['rolle', 'Rolle und Formate'], ...(g.eigen ? [] : [['beitraege', 'Die Beiträge'], ['zahlen', 'Die Zahlen']])].map(([a, t]) => `<a href="#${a}" data-sprung="${a}">${esc(t)}${WO.ic('rechts')}</a>`).join('')}</nav>
  </div></aside>`;
}
const feld = (name, titel, wert, o = {}) => `<label class="sc-feld${o.breit ? ' so-breit' : ''}"><span>${esc(titel)}</span>${o.zeilen ? `<textarea name="${name}" rows="${o.zeilen}"${o.spell ? ' spellcheck="true" lang="de"' : ''}>${esc(wert || '')}</textarea>` : `<input name="${name}" value="${esc(wert || '')}"${o.typ ? ` type="${o.typ}"` : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}>`}</label>`;
function kanalForm(k) {
  return `<form class="sc-form so-form" data-form="kanal:${esc(k.id)}" data-r id="bearbeiten"><span class="wo-mk">${esc(k.name)} bearbeiten</span>
    <div class="so-felder">${feld('handle', 'Name im Kanal', k.handle)}${feld('url', 'Adresse', k.url, { ph: 'https://…' })}${feld('stand', 'Stand', k.stand, { ph: 'angelegt, geplant, fehlt …' })}
    ${feld('takt', 'Takt', k.takt, { ph: 'z. B. zweimal die Woche' })}${feld('zugang', 'Zugang', k.zugang, { ph: 'Wer postet dort?' })}</div>
    ${feld('bio', 'Bio', k.bio, { zeilen: 5, spell: true, breit: true })}${feld('rolle', 'Rolle', k.rolle, { zeilen: 3, spell: true, breit: true })}
    ${feld('formate', 'Formate (eine Zeile je Format)', k.formate, { zeilen: 3, breit: true })}${feld('konzept', 'Konzept', k.konzept, { zeilen: 4, spell: true, breit: true })}${feld('notiz', 'Notiz', k.notiz, { zeilen: 2, breit: true })}
    <div class="so-form__fuss">${WO.knopf('Abbrechen', 'x', 'dunkel', { klein: true, attr: 'data-abbrechen' })}${WO.knopf('Speichern', 'haken', 'gold', { klein: true, attr: 'type="submit"' }).replace('type="button" type="submit"', 'type="submit"')}</div></form>`;
}

/* ---------------------------------------------------------------- Zahlen: Verlauf, Eingabe, Export-Datei */
const ZFELDER = [['follower', 'Follower'], ['reichweite', 'Erreicht'], ['impressionen', 'Impressionen'], ['likes', 'Gefällt'], ['kommentare', 'Kommentare'], ['geteilt', 'Geteilt'], ['gespeichert', 'Gespeichert'], ['klicks', 'Klicks']];
function verlaufLinie(z, feldname) {
  const p = z.filter(r => r[feldname] != null && r[feldname] !== '');
  if (p.length < 2) return '';
  const w = 520, h = 120, min = Math.min(...p.map(r => +r[feldname])), max = Math.max(...p.map(r => +r[feldname])), sp = max - min || 1;
  const pt = p.map((r, i) => [Math.round(i / (p.length - 1) * (w - 16) + 8), Math.round(h - 12 - (r[feldname] - min) / sp * (h - 28))]);
  return `<svg class="so-linie" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(feldname)} von ${esc(datum(p[0].datum))} bis ${esc(datum(p[p.length - 1].datum))}"><polyline points="${pt.map(x => x.join(',')).join(' ')}"/>${pt.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === pt.length - 1 ? 4 : 2.5}"><title>${esc(datum(p[i].datum))}: ${zahl(p[i][feldname])}</title></circle>`).join('')}</svg>`;
}
/* Beispiel, solange es keine Zahlen gibt: zeigt nur die Form des Verlaufs, ausdrücklich als Beispiel beschriftet, nie gespeichert */
const BEISPIEL = [12, 14, 13, 17, 19, 18, 23, 26, 25, 30, 34, 37];
function beispielLinie(t) {
  const w = 520, h = 120, max = 40, pt = BEISPIEL.map((v, i) => [Math.round(i / (BEISPIEL.length - 1) * (w - 16) + 8), Math.round(h - 12 - v / max * (h - 28))]);
  return `<figure class="so-beispiel"><svg class="so-linie so-linie--beispiel" viewBox="0 0 ${w} ${h}" role="img" aria-label="Beispiel eines Verlaufs"><polygon points="8,${h - 12} ${pt.map(x => x.join(',')).join(' ')} ${w - 8},${h - 12}"/><polyline points="${pt.map(x => x.join(',')).join(' ')}"/></svg><figcaption><b>Beispiel</b>${esc(t)}</figcaption></figure>`;
}
function zahlenBlock(k, z) {
  const letzte = z.slice(-1)[0];
  const feldDa = ZFELDER.filter(([f]) => z.some(r => r[f] != null));
  return `${z.length ? `<div class="so-zahlen" data-r>
      <div class="so-zahlen__kopf">${feldDa.slice(0, 4).map(([f, t]) => `<div><span class="wo-mk">${esc(t)}</span><b>${zahl(letzte[f] || 0)}</b><small>${esc(datum(letzte.datum))}</small></div>`).join('')}</div>
      ${verlaufLinie(z, feldDa[0] ? feldDa[0][0] : 'follower')}
      <details class="so-tabelle"><summary>Alle ${zahl(z.length)} Einträge<i>${WO.ic('plus')}</i></summary><div class="so-scroll"><table><thead><tr><th>Datum</th>${feldDa.map(([, t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${z.slice().reverse().map(r => `<tr><td>${esc(datum(r.datum))}</td>${feldDa.map(([f]) => `<td>${r[f] != null ? zahl(r[f]) : '–'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details></div>`
    : `<div class="so-zahlen so-zahlen--ohne" data-r><p class="so-zahlen__satz">Noch keine Zahlen für ${esc(k.name)}. Am einfachsten einmal im Monat: in der App unter «Statistiken» die Export-Datei laden und hier einlesen, oder die wichtigsten Zahlen von Hand eintragen.</p>${beispielLinie('So sieht der Verlauf aus, sobald die ersten Zahlen da sind.')}</div>`}
    <form class="sc-form so-form so-zform" data-zahlen="${esc(k.id)}" data-r><span class="wo-mk">Zahlen eintragen</span>
      <div class="so-felder so-felder--z">${feld('datum', 'Datum', heute(), { typ: 'date' })}${ZFELDER.slice(0, 4).map(([f, t]) => feld(f, t, '', { typ: 'number' })).join('')}</div>
      <div class="so-form__fuss"><label class="wo-kn wo-kn--dunkel wo-kn--klein so-datei"><span>Export-Datei laden</span><i>${WO.ic('hoch')}</i><input type="file" accept=".csv,text/csv" data-csv="${esc(k.id)}"></label>${WO.knopf('Zahlen speichern', 'haken', 'gold', { klein: true, attr: 'type="submit"' }).replace('type="button" type="submit"', 'type="submit"')}</div>
      <p class="so-fein">Gelesen werden Spalten wie Datum, Follower, Reichweite oder Reach, Impressionen, Likes, Kommentare, Geteilt oder Shares, Gespeichert oder Saves, Klicks. Gleiches Datum ersetzt den alten Wert.</p></form>`;
}
const SPALTEN = { datum: /^(datum|date|tag|day)/i, follower: /follower|abonnent|fans/i, reichweite: /reich|reach|erreich/i, impressionen: /impress|aufruf|views|ansicht/i, likes: /like|gefäll|reaktion|reaction/i, kommentare: /komment|comment/i, geteilt: /geteilt|share|repost|teilen/i, gespeichert: /gespeich|save/i, klicks: /klick|click/i };
function leseCsv(text) {
  const zeilen = text.replace(/\r/g, '').split('\n').filter(z => z.trim());
  if (zeilen.length < 2) return [];
  const trenn = (zeilen[0].match(/;/g) || []).length > (zeilen[0].match(/,/g) || []).length ? ';' : ',';
  const teile = z => { const o = []; let cur = '', q = false; for (const c of z) { if (c === '"') q = !q; else if (c === trenn && !q) { o.push(cur); cur = ''; } else cur += c; } o.push(cur); return o.map(x => x.trim()); };
  let kopfI = zeilen.findIndex(z => SPALTEN.datum.test(teile(z)[0] || '') || teile(z).some(x => SPALTEN.datum.test(x)));
  if (kopfI < 0) kopfI = 0;
  const kopfZ = teile(zeilen[kopfI]), map = {};
  kopfZ.forEach((t, i) => { for (const [f, re] of Object.entries(SPALTEN)) if (map[f] == null && re.test(t)) { map[f] = i; break; } });
  if (map.datum == null) return [];
  const tag = s => { let m; if ((m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s))) return m[1] + '-' + m[2] + '-' + m[3]; if ((m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s))) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) return m[3] + '-' + m[1].padStart(2, '0') + '-' + m[2].padStart(2, '0'); return ''; };
  return zeilen.slice(kopfI + 1).map(z => { const t = teile(z), r = { datum: tag(t[map.datum] || '') }; Object.keys(map).forEach(f => { if (f !== 'datum' && t[map[f]] !== undefined) r[f] = t[map[f]]; }); return r; }).filter(r => r.datum);
}
function zahlenLeben(r) {
  $$('form[data-zahlen]', r).forEach(f => {
    const kid = f.dataset.zahlen;
    f.onsubmit = async e => { e.preventDefault(); const fd = new FormData(f), z = { datum: fd.get('datum') };
      ZFELDER.forEach(([k]) => { if (fd.get(k)) z[k] = fd.get(k); });
      if (Object.keys(z).length < 2) return meldung('Mindestens eine Zahl eintragen.', true);
      await zahlenSpeichern(kid, [z]); };
    const inp = $('input[data-csv]', f);
    if (inp) inp.onchange = async () => { const d = inp.files[0]; if (!d) return; const zl = leseCsv(await d.text()); inp.value = '';
      if (!zl.length) return meldung('In der Datei steht keine Spalte mit einem Datum. Bitte die Export-Datei der Statistik nehmen.', true);
      await zahlenSpeichern(kid, zl); };
  });
}
async function zahlenSpeichern(kid, zeilen) {
  try {
    const j = await api('POST', 'zahlen/' + kid, { zeilen, wer: WER() });
    S.d.zahlen[kid] = j.nachher; neuZeichnen();
    quittung(`Zahlen ${kname(kid)} gespeichert`, [[`Einträge`, `${j.vorher.length} → ${j.nachher.length}`]], { art: 'zahlen', id: kid, vorher: j.vorher }, x => { S.d.zahlen[kid] = x; });
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
}

/* ---------------------------------------------------------------- Strategie */
function strategie() {
  const s = S.d.strategie, edit = S.bearbeiten === 'strategie';
  const zaehl = k => beitraege().filter(b => b.thema === k && b.stand !== 'verworfen').length;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.strategie), h1: 'Die <em>Strategie.</em>', zier: esc('Tasty Studios · ' + NAME),
      satz: esc(s.haltung || ''), knoepfe: WO.knopf('Bearbeiten', 'stift', 'gold', { attr: 'data-bearbeiten="strategie"' }) + WO.knopf('Zum Wochenrhythmus', 'rechts', 'glas', { attr: 'data-sprung="rhythmus"' }) })}
    ${edit ? strategieForm(s) : ''}
    <section class="sc-block">${kopfBlock(['Worüber wir', 'sprechen.'], 'Die Themen von Tasty Studios. Jeder Beitrag gehört zu einem davon, so bleibt sichtbar, ob eines zu kurz kommt.')}
      <ol class="so-themen" data-r>${themen().map(t => `<li><b>${esc(t.t)}</b><p>${esc(t.s || '')}</p><span>${zahl(zaehl(t.k))} ${zaehl(t.k) === 1 ? 'Beitrag' : 'Beiträge'}${t.anteil ? ' · Ziel ' + esc(t.anteil) : ''}</span></li>`).join('')}</ol></section>
    <section class="sc-block" id="rhythmus">${kopfBlock(['Wann was', 'kommt.'], 'Der Wochenrhythmus: welcher Tag, welcher Kanal, welches Format.')}
      ${(s.rhythmus || []).length ? `<div class="so-rhythmus" data-r>${TAGE.map(t => { const l = s.rhythmus.filter(r => r.tag === t); return `<div class="so-rtag"><b>${t.slice(0, 2)}</b>${l.length ? l.map(r => `<span><em>${esc(kname(r.kanal))}</em>${esc(r.format || '')}${r.thema ? `<small>${esc(thema(r.thema) || r.thema)}</small>` : ''}</span>`).join('') : '<span class="so-rtag__frei">frei</span>'}</div>`; }).join('')}</div>`
        : `<div class="so-konzept" data-r><span class="wo-mk">Noch kein Rhythmus</span><p>Unter «Bearbeiten» je Zeile Tag, Kanal, Format und Thema eintragen, etwa «Dienstag · LinkedIn · Befund einer Hotelseite». Der Rhythmus erscheint dann hier als Woche.</p>${WO.knopf('Rhythmus eintragen', 'stift', 'dunkel', { klein: true, attr: 'data-bearbeiten="strategie"' })}</div>`}</section>
    <section class="sc-block">${kopfBlock(['Die', 'Ziele.'], 'Was wir je Zeitraum erreichen wollen und wo wir stehen.')}
      ${(s.ziele || []).length ? `<ol class="so-ziele" data-r>${s.ziele.map(z => { const p = +z.ziel ? Math.min(100, Math.round(100 * (+z.ist || 0) / +z.ziel)) : 0; return `<li><span class="wo-mk">${esc(z.zeitraum || '')}${z.kanal ? ' · ' + esc(kname(z.kanal)) : ''}</span><b>${esc(z.t || '')}</b><span class="sc-balken"><i style="width:${p}%"></i></span><small>${esc(z.ist || 0)} von ${esc(z.ziel || '–')}</small></li>`; }).join('')}</ol>`
        : `<div class="so-konzept" data-r><span class="wo-mk">Noch keine Ziele</span><p>Ein Ziel hat einen Zeitraum, eine Zahl und einen Ist-Wert, etwa «1. Quartal 2027 · 500 Follower auf LinkedIn». Unter «Bearbeiten» eintragen.</p>${WO.knopf('Ziel eintragen', 'stift', 'dunkel', { klein: true, attr: 'data-bearbeiten="strategie"' })}</div>`}</section>
    <section class="sc-block">${kopfBlock(['Die', 'Regeln.'], 'Wie aus einer Idee die Fassungen für die Kanäle werden.')}
      <ul class="sc-punkte so-regeln" data-r>${(s.regeln || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      ${s.notiz ? `<div class="so-konzept" data-r><span class="wo-mk">Notiz</span><p>${esc(s.notiz)}</p></div>` : ''}</section>
    ${quelle('Quelle: ' + (s.quelle || '') + (s.geaendert ? ' · zuletzt geändert ' + datum(s.geaendert) + ' von ' + (s.wer || '') : ''))}`;
}
function strategieForm(s) {
  const kOpt = v => kanaele().filter(k => !(GRENZE[k.id] || {}).eigen).map(k => `<option value="${esc(k.id)}"${k.id === v ? ' selected' : ''}>${esc(k.name)}</option>`).join('');
  const tOpt = v => `<option value="">–</option>` + themen().map(t => `<option value="${esc(t.k)}"${t.k === v ? ' selected' : ''}>${esc(t.t)}</option>`).join('');
  const dOpt = v => TAGE.map(t => `<option${t === v ? ' selected' : ''}>${t}</option>`).join('');
  const rz = r => `<div class="so-reihe" data-zeile="rhythmus"><select name="tag">${dOpt(r.tag)}</select><select name="kanal">${kOpt(r.kanal)}</select><input name="format" value="${esc(r.format || '')}" placeholder="Format"><select name="thema">${tOpt(r.thema)}</select><button type="button" class="so-weg" data-weg aria-label="Zeile entfernen">${WO.ic('x')}</button></div>`;
  const zz = z => `<div class="so-reihe so-reihe--ziel" data-zeile="ziele"><input name="zeitraum" value="${esc(z.zeitraum || '')}" placeholder="Zeitraum"><input name="t" value="${esc(z.t || '')}" placeholder="Ziel"><input name="ziel" value="${esc(z.ziel || '')}" placeholder="Zahl" inputmode="numeric"><input name="ist" value="${esc(z.ist || '')}" placeholder="Ist" inputmode="numeric"><select name="kanal"><option value="">alle</option>${kOpt(z.kanal)}</select><button type="button" class="so-weg" data-weg aria-label="Zeile entfernen">${WO.ic('x')}</button></div>`;
  const tz = t => `<div class="so-reihe so-reihe--thema" data-zeile="themen"><input type="hidden" name="k" value="${esc(t.k || '')}"><input name="t" value="${esc(t.t || '')}" placeholder="Thema"><input name="s" value="${esc(t.s || '')}" placeholder="Worum es geht"><input name="anteil" value="${esc(t.anteil || '')}" placeholder="Anteil"><button type="button" class="so-weg" data-weg aria-label="Zeile entfernen">${WO.ic('x')}</button></div>`;
  return `<form class="sc-form so-form" data-form="strategie" data-r id="bearbeiten"><span class="wo-mk">Strategie bearbeiten</span>
    ${feld('haltung', 'Haltung', s.haltung, { zeilen: 3, spell: true, breit: true })}
    <fieldset><legend class="wo-mk">Themen</legend><div data-liste="themen">${themen().map(tz).join('')}</div><button type="button" class="so-dazu" data-dazu="themen">${WO.ic('plus')}<span>Thema dazu</span></button></fieldset>
    <fieldset><legend class="wo-mk">Wochenrhythmus</legend><div data-liste="rhythmus">${(s.rhythmus || []).map(rz).join('')}</div><button type="button" class="so-dazu" data-dazu="rhythmus">${WO.ic('plus')}<span>Zeile dazu</span></button></fieldset>
    <fieldset><legend class="wo-mk">Ziele</legend><div data-liste="ziele">${(s.ziele || []).map(zz).join('')}</div><button type="button" class="so-dazu" data-dazu="ziele">${WO.ic('plus')}<span>Ziel dazu</span></button></fieldset>
    ${feld('regeln', 'Regeln (eine Zeile je Regel)', (s.regeln || []).join('\n'), { zeilen: 6, spell: true, breit: true })}${feld('notiz', 'Notiz', s.notiz, { zeilen: 3, spell: true, breit: true })}
    <template data-vorlage="rhythmus">${rz({ tag: 'Dienstag', kanal: 'linkedin' })}</template><template data-vorlage="ziele">${zz({})}</template><template data-vorlage="themen">${tz({})}</template>
    <div class="so-form__fuss">${WO.knopf('Abbrechen', 'x', 'dunkel', { klein: true, attr: 'data-abbrechen' })}${WO.knopf('Speichern', 'haken', 'gold', { klein: true, attr: 'type="submit"' }).replace('type="button" type="submit"', 'type="submit"')}</div></form>`;
}
function formLeben(r) {
  const f = $('form[data-form]', r); if (!f) return;
  $$('[data-dazu]', f).forEach(b => b.onclick = () => { const t = $(`template[data-vorlage="${b.dataset.dazu}"]`, f); $(`[data-liste="${b.dataset.dazu}"]`, f).insertAdjacentHTML('beforeend', t.innerHTML); });
  f.addEventListener('click', e => { const w = e.target.closest('[data-weg]'); if (w) w.closest('.so-reihe').remove(); });
  f.onsubmit = async e => {
    e.preventDefault();
    const art = f.dataset.form, fd = new FormData(f);
    try {
      if (art === 'strategie') {
        const reihen = n => $$(`[data-zeile="${n}"]`, f).map(z => Object.fromEntries($$('input,select', z).map(i => [i.name, i.value.trim()]))).filter(x => Object.entries(x).some(([k, v]) => v && !['tag', 'kanal', 'k'].includes(k)));
        const th = reihen('themen').map(t => Object.assign(t, { k: t.k || t.t.toLowerCase().replace(/[^a-zäöü0-9]+/g, '-').slice(0, 30) }));
        const felder = { haltung: fd.get('haltung'), notiz: fd.get('notiz'), regeln: String(fd.get('regeln') || '').split('\n').map(x => x.trim()).filter(Boolean), themen: th, rhythmus: reihen('rhythmus'), ziele: reihen('ziele') };
        const j = await api('PUT', 'strategie', { felder, wer: WER() });
        S.d.strategie = j.nachher; S.bearbeiten = ''; neuZeichnen();
        quittung('Strategie gespeichert', unterschiede(j.vorher, j.nachher, { haltung: 'Haltung', themen: 'Themen', rhythmus: 'Wochenrhythmus', ziele: 'Ziele', regeln: 'Regeln', notiz: 'Notiz' }), { art: 'strategie', id: 'strategie', vorher: j.vorher }, x => { S.d.strategie = x; });
      } else if (/^kanal:/.test(art)) {
        const id = art.slice(6), felder = Object.fromEntries(['handle', 'url', 'stand', 'takt', 'zugang', 'bio', 'rolle', 'formate', 'konzept', 'notiz'].map(k => [k, String(fd.get(k) || '').trim()]));
        const j = await api('PUT', 'kanal/' + id, { felder, wer: WER() });
        S.d.kanaele[id] = j.nachher; S.bearbeiten = ''; neuZeichnen();
        quittung(kname(id) + ' gespeichert', unterschiede(j.vorher, j.nachher, { handle: 'Name', url: 'Adresse', stand: 'Stand', takt: 'Takt', zugang: 'Zugang', bio: 'Bio', rolle: 'Rolle', formate: 'Formate', konzept: 'Konzept', notiz: 'Notiz' }), { art: 'kanal', id, vorher: j.vorher }, x => { S.d.kanaele[id] = x; });
      }
    } catch (x) { meldung('Nicht gespeichert: ' + x.message, true); }
  };
  f.addEventListener('input', () => { if (!S.bearbeiten) return; leiste(); }, { once: true });
}
function unterschiede(a, b, namen) {
  const wert = v => Array.isArray(v) ? (v.length + (v.length === 1 ? ' Eintrag' : ' Einträge')) : kurz(v, 50) || 'leer';
  const ohneLeer = v => JSON.parse(JSON.stringify(v == null ? '' : v, (k, x) => (x === '' && k ? undefined : x)));   /* leere Felder zählen nicht als Änderung */
  return Object.keys(namen).filter(k => !gleich(ohneLeer((a || {})[k]), ohneLeer((b || {})[k]))).map(k => [namen[k], `${wert((a || {})[k])} → ${wert((b || {})[k])}`]);
}

/* ---------------------------------------------------------------- Planung: Kalender als Bildbühne (Woche, Monat, Raster) und Ideenspeicher */
/* ---------------------------------------------------------------- Planung: Monat und Agenda, Filter je Kanal (Robert 12.11.2026: «klarer, was wo auf welchem Kanal ist … keine Uhrzeiten … auf einen Monat verteilen») */
const KW = s => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const j = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - j) / 864e5 - 3 + ((j.getDay() + 6) % 7)) / 7); };
const imFilter = b => !S.kf || !S.kf.length || (b.kanaele || []).some(k => S.kf.includes(k));
function planung() {
  const h = heute(), art = S.kal === 'agenda' ? 'agenda' : 'monat', alle = beitraege().filter(b => b.stand !== 'verworfen');
  const m = S.monat || h.slice(0, 7), [y, mo] = m.split('-').map(Number);
  const imMonat = alle.filter(b => (b.datum || '').slice(0, 7) === m);
  const ideen = alle.filter(b => b.stand === 'idee');
  const ohneTag = alle.filter(b => !b.datum && /^(entwurf|geprueft|freigegeben)$/.test(b.stand) && !/^Feed-Entwurf/.test(b.gruppe || '') && imFilter(b));
  const gruppen = [...new Set(ideen.map(b => b.gruppe || 'Ohne Gruppe'))];
  const ks = kanaele().filter(k => !(GRENZE[k.id] || {}).eigen);
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.planung), h1: 'Der <em>Kalender.</em>', zier: esc(mz(alle.filter(b => b.datum >= h).length, 'Beitrag', 'Beiträge') + ' ab heute geplant'),
      satz: 'Höchstens ein Beitrag am Tag. Jeder trägt das Zeichen und die Farbe seines Kanals. Oben nach Kanal filtern, einen Beitrag auf einen anderen Tag ziehen, ein freier Tag legt mit einem Klick einen neuen an.',
      knoepfe: WO.knopf('Content-Plan ansehen', 'auge', 'gold', { href: 'plan/' }) + WO.knopf('Neue Idee', 'plus', 'glas', { attr: 'data-sprung="idee-neu"' }) + WO.knopf('Content-Maschine', 'stift', 'glas', { href: 'maschine/' }) })}
    <section class="sc-block" id="kalender">
      <div class="so-kalkopf" data-r>
        <div class="so-kalkopf__t"><button type="button" class="so-pfeil" data-monat="${iso(new Date(y, mo - 2, 1)).slice(0, 7)}" aria-label="Monat davor">${WO.ic('links')}</button><h2 class="sc-t">${zwei(MONATE[mo - 1], String(y))}</h2><button type="button" class="so-pfeil" data-monat="${iso(new Date(y, mo, 1)).slice(0, 7)}" aria-label="Monat danach">${WO.ic('rechts')}</button>
          ${m !== h.slice(0, 7) ? `<button type="button" class="so-heute" data-monat="${h.slice(0, 7)}">Heute</button>` : ''}</div>
        <div class="so-schalter" role="tablist">${[['monat', 'Monat'], ['agenda', 'Agenda']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === art}" class="${k === art ? 'an' : ''}" data-kal="${k}">${t}</button>`).join('')}</div>
      </div>
      <div class="so-filterk" data-r role="group" aria-label="Nach Kanal filtern">${ks.map(k => { const an = !S.kf || !S.kf.length || S.kf.includes(k.id), n = imMonat.filter(b => imKanal(b, k.id)).length;
        return `<button type="button" class="so-fk${an ? ' an' : ''}" style="${kStil(k.id)}" data-kf="${esc(k.id)}" aria-pressed="${an}">${soLogo(k.id, 'so-lg--s')}<span>${esc(k.name.replace('-Unternehmensprofil', ''))}</span><b>${zahl(n)}</b></button>`; }).join('')}
        ${S.kf && S.kf.length ? `<button type="button" class="so-link so-fk__alle" data-kf="">Alle zeigen</button>` : ''}</div>
      ${art === 'monat' ? monatsBuehne(m) : agenda(imMonat.filter(imFilter), { leer: 'In diesem Monat ist für diese Kanäle nichts geplant.' })}
    </section>
    ${ohneTag.length ? `<section class="sc-block">${kopfBlock(['Noch ohne', 'Tag.'], 'Entwürfe, die auf einen Tag warten. Auf einen Tag im Kalender ziehen oder in der Werkstatt ein Datum setzen.')}
      <div class="so-streifen" data-r>${ohneTag.map(b => karteB(b, { ziehen: true })).join('')}</div></section>` : ''}
    <section class="sc-block" id="ideen">${kopfBlock(['Der', 'Ideenspeicher.'], 'Alles, was einmal ein Beitrag werden kann, nach Gruppen. Ein Klick öffnet die Idee in der Werkstatt.')}
      <form class="sc-form so-form so-neu" id="idee-neu" data-r><span class="wo-mk">Neue Idee</span><div class="so-felder so-felder--neu">${feld('titel', 'Worum geht es?', '', { ph: 'z. B. Vorher und nachher: Taverne zum Schäfli' })}
        <label class="sc-feld"><span>Thema</span><select name="thema">${themen().map(t => `<option value="${esc(t.k)}">${esc(t.t)}</option>`).join('')}</select></label></div>
        <fieldset class="so-kwahl"><legend class="wo-mk">Für welche Kanäle?</legend>${ks.map(k => `<label style="${kStil(k.id)}"><input type="checkbox" name="kanaele" value="${esc(k.id)}">${soLogo(k.id, 'so-lg--s')}<span>${esc(k.name)}</span></label>`).join('')}</fieldset>
        <div class="so-form__fuss">${WO.knopf('Idee speichern', 'plus', 'gold', { klein: true, attr: 'type="submit"' }).replace('type="button" type="submit"', 'type="submit"')}</div></form>
      ${gruppen.map(g => { const l = ideen.filter(b => (b.gruppe || 'Ohne Gruppe') === g); return `<div class="so-gruppe" data-r><p class="wo-mk">${esc(g)} · ${zahl(l.length)}</p><div class="so-ideen">${l.map(b => karteB(b, { lang: 64 })).join('')}</div></div>`; }).join('')}</section>
    ${quelle('Kalender: Vorschlag aus dem vorhandenen Material, anpassen oder verwerfen · Ideen aus der Content-Zuordnung (Vault) · Instagram aus dem Feed-Entwurf v2')}`;
}
function monatsBuehne(m) {
  const h = heute(), [y, mo] = m.split('-').map(Number), erster = new Date(y, mo - 1, 1), s0 = new Date(erster); s0.setDate(1 - ((erster.getDay() + 6) % 7));
  const wochen = Math.ceil((((erster.getDay() + 6) % 7) + new Date(y, mo, 0).getDate()) / 7), alle = beitraege().filter(b => b.stand !== 'verworfen' && imFilter(b));
  let tage = [...Array(wochen * 7)].map((_, i) => { const d = new Date(s0); d.setDate(s0.getDate() + i); return iso(d); });
  /* im laufenden Monat beginnt der Kalender mit dieser Woche; vergangene Wochen auf Wunsch (Robert: übersichtlich, keine Leerflächen) */
  const w0 = wocheVon(h), weg = m === h.slice(0, 7) && !S.vergangene ? tage.filter(t => t < w0).length / 7 : 0;
  if (weg) tage = tage.filter(t => t >= w0);
  return `${weg ? `<button type="button" class="so-mo__vorher" data-vergangene>${weg === 1 ? 'Vergangene Woche' : weg + ' vergangene Wochen'} zeigen${WO.ic('hoch')}</button>` : m === h.slice(0, 7) && S.vergangene ? `<button type="button" class="so-mo__vorher" data-vergangene>Vergangene Wochen ausblenden${WO.ic('hoch')}</button>` : ''}<div class="so-mo" data-r><div class="so-mo__kopf">${TAGE.map(t => `<span>${t.slice(0, 2)}</span>`).join('')}</div><div class="so-mo__tage">${tage.map(t => {
    const l = alle.filter(b => b.datum === t), b = l[0], d = new Date(t + 'T12:00'), aus = t.slice(0, 7) !== m;
    return `<div class="so-mo__t${aus ? ' aus' : ''}${t === h ? ' an' : ''}${t < h ? ' vorbei' : ''}" data-tag="${t}"${b ? ` style="${kStil(hauptKanal(b))}"` : ''}>
      <span class="so-mo__z">${d.getDate()}${l.length > 1 ? `<em>+${l.length - 1}</em>` : ''}</span>
      ${b ? `<button type="button" class="so-mo__b" draggable="true" data-ziehen="${esc(b.id)}" data-gehe="beitrag:${esc(b.id)}"><span class="so-mo__bild">${bild(b)}<span class="so-mo__lg">${kanalMarken(b.kanaele)}</span></span><b>${esc(kurz(b.titel, 44))}</b></button>`
        : aus || t < h ? '<span class="so-mo__ruhe"></span>' : `<button type="button" class="so-mo__neu" data-neu='${esc(JSON.stringify({ datum: t, stand: 'entwurf' }))}' aria-label="Neuer Beitrag am ${esc(datum(t))}">${WO.ic('plus')}</button>`}</div>`; }).join('')}</div></div>`;
}
function planungLeben(r) {
  const halte = tu => { const k = $('#kalender'), y = k ? k.getBoundingClientRect().top + scrollY - 96 : scrollY; tu(); zeichne(); scrollTo({ top: y }); };
  $$('[data-monat]', r).forEach(b => b.onclick = () => halte(() => { S.monat = b.dataset.monat; }));
  $$('[data-kal]', r).forEach(b => b.onclick = () => halte(() => { S.kal = b.dataset.kal; }));
  $$('[data-vergangene]', r).forEach(b => b.onclick = () => halte(() => { S.vergangene = !S.vergangene; }));
  $$('[data-kf]', r).forEach(b => b.onclick = () => halte(() => {
    const k = b.dataset.kf; if (!k) { S.kf = []; return; }
    const alle = kanaele().filter(x => !(GRENZE[x.id] || {}).eigen).map(x => x.id), jetzt = S.kf && S.kf.length ? S.kf.slice() : [];
    S.kf = !jetzt.length ? [k] : jetzt.includes(k) ? jetzt.filter(x => x !== k) : jetzt.concat(k);
    if (S.kf.length === alle.length) S.kf = [];
  }));
  const f = $('#idee-neu', r);
  if (f) f.onsubmit = e => { e.preventDefault(); const fd = new FormData(f); const titel = String(fd.get('titel') || '').trim(); if (!titel) return meldung('Bitte kurz schreiben, worum es geht.', true);
    neuerBeitrag({ titel, thema: fd.get('thema'), kanaele: fd.getAll('kanaele'), stand: 'idee', gruppe: 'Neu im Cockpit' }, true); };
  ziehenLeben(r);
}
/* Ziehen auf einen Tag (Woche, Monat, Übersicht): setzt das Datum, ohne den Stand zu ändern; Quittung mit «Rückgängig» */
function ziehenLeben(r) {
  $$('[data-tag-auf]', r).forEach(b => b.onclick = () => { S.tagAuf = b.dataset.tagAuf; const y = scrollY; zeichne(); scrollTo({ top: y }); });
  $$('[data-ziehen]', r).forEach(c => c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', c.dataset.ziehen); e.dataTransfer.effectAllowed = 'move'; c.classList.add('zieht'); }));
  $$('[data-ziehen]', r).forEach(c => c.addEventListener('dragend', () => c.classList.remove('zieht')));
  $$('[data-tag]', r).forEach(t => {
    t.addEventListener('dragover', e => { e.preventDefault(); t.classList.add('ziel'); });
    t.addEventListener('dragleave', () => t.classList.remove('ziel'));
    t.addEventListener('drop', async e => { e.preventDefault(); t.classList.remove('ziel'); const id = e.dataTransfer.getData('text/plain'), b = beitrag(id); if (!b || b.datum === t.dataset.tag) return;
      await beitragAendern(id, { datum: t.dataset.tag, stand: b.stand === 'freigegeben' ? 'geplant' : b.stand }, `«${kurz(b.titel, 40)}» auf ${datum(t.dataset.tag)} gelegt`); });
  });
}

/* ---------------------------------------------------------------- Werkstatt: ein Beitrag, Fassungen je Kanal, Vorschau, Prüfung */
function werkstatt(b) {
  if (!S.entwurf || S.entwurf.id !== b.id) S.entwurf = { id: b.id, f: kopie(b), geaendert: false };
  const f = S.entwurf.f, ks = (f.kanaele || []).filter(k => GRENZE[k] && !GRENZE[k].eigen);
  if (!S.reiter || !ks.includes(S.reiter)) S.reiter = ks[0] || '';
  const k = S.reiter, fa = (f.fassungen || {})[k] || {}, g = GRENZE[k] || {};
  const iStand = STAENDE.findIndex(x => x[0] === f.stand);
  return `<section class="so-ws" aria-label="Werkstatt">
    <header class="so-ws__kopf" data-r><button type="button" class="so-zur" data-gehe="${f.stand === 'idee' ? 'planung' : 'archiv'}">${WO.ic('links')}<span>${f.stand === 'idee' ? 'Planung' : 'Archiv'}</span></button>
      <h1 class="sc-t">${esc(f.titel || 'Ohne Titel')}</h1><p class="so-ws__q">${esc(f.quelle || '')}${f.geaendert ? ' · zuletzt geändert ' + esc(datum(f.geaendert)) + (f.wer ? ' von ' + esc(f.wer) : '') : ''}</p>
      <ol class="so-pfad" aria-label="Stand">${STAENDE.map(([s, t], i) => `<li><button type="button" class="${i < iStand ? 'ok' : ''}${i === iStand ? ' an' : ''}" data-stand="${s}"><b>${i < iStand ? WO.ic('haken') : i + 1}</b><span>${t}</span></button></li>`).join('')}</ol></header>
    <div class="so-ws__raster">
      <div class="so-ws__links">
        <div class="sc-form so-form" data-r>
          <div class="so-felder so-felder--ws">${feld('titel', 'Titel', f.titel)}<label class="sc-feld"><span>Thema</span><select name="thema"><option value="">–</option>${themen().map(t => `<option value="${esc(t.k)}"${t.k === f.thema ? ' selected' : ''}>${esc(t.t)}</option>`).join('')}</select></label>
            ${feld('datum', 'Datum', f.datum, { typ: 'date' })}</div>
          <fieldset class="so-kwahl"><legend class="wo-mk">Kanäle</legend>${kanaele().filter(x => !(GRENZE[x.id] || {}).eigen).map(x => `<label style="${kStil(x.id)}"><input type="checkbox" name="kanaele" value="${esc(x.id)}"${(f.kanaele || []).includes(x.id) ? ' checked' : ''}>${soLogo(x.id, 'so-lg--s')}<span>${esc(x.name)}</span></label>`).join('')}</fieldset>
          <div class="so-bildwahl">${f.bild ? `<img src="${esc(f.bild)}" alt="Bild des Beitrags" decoding="async">` : ''}<div>${feld('bild', 'Bild (Pfad oder Adresse)', f.bild, { ph: 'aus dem Material wählen' })}<div class="so-bildwahl__kn">${WO.knopf('Aus dem Material', 'foto', 'dunkel', { klein: true, attr: 'data-material-wahl' })}${f.werkstatt ? WO.knopf('Bild vorher/nachher in «Beiträge»', 'pfeil', 'dunkel', { klein: true, href: esc(f.werkstatt), neu: true }) : ''}</div></div></div>
          ${feld('notiz', 'Notiz', f.notiz, { zeilen: 2 })}
        </div>
        ${ks.length ? `<div class="so-reiter" role="tablist" data-r>${ks.map(x => `<button type="button" role="tab" aria-selected="${x === k}" class="${x === k ? 'an' : ''}" data-reiter="${x}" style="${kStil(x)}">${soLogo(x, 'so-lg--s')}${esc(kname(x))}<em>${((f.fassungen || {})[x] || {}).text ? zahl((((f.fassungen || {})[x] || {}).text || '').length) : 'leer'}</em></button>`).join('')}</div>
        <div class="sc-form so-form so-fassung" data-r>
          ${k === 'pinterest' ? feld('f_titel', 'Titel des Pins', fa.titel) : ''}
          <label class="sc-feld so-breit"><span>Text für ${esc(kname(k))}</span><textarea name="f_text" rows="12" spellcheck="true" lang="de">${esc(fa.text || '')}</textarea></label>
          <div class="so-felder so-felder--zwei">${feld('f_tags', 'Hashtags', fa.tags, { ph: '#Hotellerie #Webdesign' })}${feld('f_link', k === 'linkedin' ? 'Link für den ersten Kommentar' : 'Link', fa.link, { ph: 'https://…' })}</div>
          <div class="so-zaehler"><span data-zaehler>${zahl((fa.text || '').length)}</span> von ${zahl(g.zeichen || 0)} Zeichen${g.sichtbar ? ` · sichtbar ohne «mehr»: ${g.sichtbar}` : ''}</div>
          ${ks.filter(x => x !== k && ((f.fassungen || {})[x] || {}).text).length ? `<div class="so-uebernehmen"><span class="wo-mk">Übernehmen aus</span>${ks.filter(x => x !== k && ((f.fassungen || {})[x] || {}).text).map(x => `<button type="button" data-uebernehmen="${x}">${esc(kname(x))}</button>`).join('')}<small>Eine Idee wird umgebaut, nicht kopiert: danach für ${esc(kname(k))} kürzen oder neu setzen.</small></div>` : ''}
        </div>` : `<div class="so-konzept" data-r><span class="wo-mk">Noch kein Kanal</span><p>Oben mindestens einen Kanal wählen. Dann erscheint je Kanal ein eigenes Feld für den Text, die Vorschau und die Prüfung.</p></div>`}
        ${f.stand === 'draussen' || (f.kanaele || []).some(x => (f.live || {})[x]) ? liveBlock(f, ks) : ''}
        <div class="so-ws__fuss" data-r>${WO.knopf('Wiederverwenden', 'kopie', 'dunkel', { klein: true, attr: 'data-wieder' })}${f.stand !== 'verworfen' ? WO.knopf('Verwerfen', 'aus', 'dunkel', { klein: true, attr: 'data-stand="verworfen"' }) : ''}${WO.knopf('Löschen', 'x', 'dunkel', { klein: true, attr: 'data-loeschen' })}</div>
      </div>
      <div class="so-ws__rechts">
        <div class="so-vorschau" data-r data-vorschau>${k ? vorschau(f, k) : ''}</div>
        <div class="so-pruef" data-r data-pruef>${k ? pruefBlock(f, k) : ''}</div>
      </div>
    </div></section>`;
}
function liveBlock(f, ks) {
  return `<div class="sc-form so-form so-live" data-r><span class="wo-mk">Draussen</span>${ks.map(x => { const z = (f.zahlen || {})[x] || {}; return `<div class="so-live__k"><b>${esc(kname(x))}</b>
    ${feld('live_' + x, 'Link zum Beitrag', (f.live || {})[x], { ph: 'https://…' })}<div class="so-felder so-felder--z">${ZFELDER.slice(1, 7).map(([zf, t]) => feld('z_' + x + '_' + zf, t, z[zf], { typ: 'number' })).join('')}</div></div>`; }).join('')}
    <p class="so-fein">Die Zahlen des Beitrags nach ein paar Tagen aus der App übernehmen. Sie fliessen in «Draussen und Wirkung» ein.</p></div>`;
}
function werkstattLeben(r, b) {
  const E = S.entwurf, f = E.f;
  const markiere = () => { const war = E.geaendert; E.geaendert = !gleich(normB(f), normB(b)); if (war !== E.geaendert) leiste(); else { const k = $('#leiste [data-speichern]'); if (k) k.disabled = !E.geaendert; } };
  const aktualisiere = () => { const k = S.reiter; const v = $('[data-vorschau]', r), p = $('[data-pruef]', r); if (k && v) v.innerHTML = vorschau(f, k); if (k && p) p.innerHTML = pruefBlock(f, k); const z = $('[data-zaehler]', r); if (z) z.textContent = zahl(((f.fassungen[k] || {}).text || '').length); bindePruefFunde(r); };
  let takt = 0;
  const ws = $('.so-ws', r); if (!ws) return;   /* Zuhörer am Abschnitt, der bei jedem Zeichnen neu entsteht (am #ansicht würden sie sich stapeln) */
  ws.addEventListener('input', e => {
    const t = e.target, n = t.name; if (!n || !t.closest('.so-ws')) return;
    f.fassungen = f.fassungen || {}; f.live = f.live || {}; f.zahlen = f.zahlen || {};
    if (n === 'kanaele') { f.kanaele = $$('input[name="kanaele"]:checked', r).map(x => x.value); markiere(); return zeichneWerkstatt(); }
    if (/^f_/.test(n)) { const k = S.reiter; f.fassungen[k] = f.fassungen[k] || { text: '', tags: '', link: '' }; f.fassungen[k][n.slice(2)] = t.value; }
    else if (/^live_/.test(n)) f.live[n.slice(5)] = t.value;
    else if (/^z_/.test(n)) { const [, k, zf] = n.split('_'); f.zahlen[k] = f.zahlen[k] || {}; if (t.value === '') delete f.zahlen[k][zf]; else f.zahlen[k][zf] = t.value; }
    else f[n] = t.value;
    markiere();
    clearTimeout(takt); takt = setTimeout(aktualisiere, 80);   /* kurz gesammelt, damit schnelles Tippen nicht jede Taste neu rechnet */
  });
  ws.addEventListener('change', e => { if (e.target.name === 'bild' || e.target.name === 'thema') zeichneWerkstatt(); });
  $$('[data-reiter]', r).forEach(x => x.onclick = () => { S.reiter = x.dataset.reiter; zeichneWerkstatt(); });
  $$('[data-stand]', r).forEach(x => x.onclick = () => standSetzen(x.dataset.stand));
  $$('[data-uebernehmen]', r).forEach(x => x.onclick = () => { const k = S.reiter, von = f.fassungen[x.dataset.uebernehmen] || {}; if ((f.fassungen[k] || {}).text && !confirm('Den Text für ' + kname(k) + ' ersetzen?')) return; f.fassungen[k] = Object.assign({}, f.fassungen[k] || {}, { text: von.text || '', tags: von.tags || '' }); markiere(); zeichneWerkstatt(); });
  $$('[data-wieder]', r).forEach(x => x.onclick = () => neuerBeitrag({ titel: f.titel + ' (neu)', thema: f.thema, kanaele: f.kanaele, fassungen: kopie(f.fassungen), bild: f.bild, stand: 'entwurf', gruppe: f.gruppe, quelle: 'Wiederverwendet aus «' + f.titel + '»' }));
  $$('[data-loeschen]', r).forEach(x => x.onclick = loeschen);
  $$('[data-material-wahl]', r).forEach(x => x.onclick = () => materialFenster(src => { f.bild = src; markiere(); zeichneWerkstatt(); }));
  bindePruefFunde(r);
}
function zeichneWerkstatt() { const y = scrollY; zeichne(); leiste(); scrollTo({ top: y }); }
function bindePruefFunde(r) {
  $$('[data-fund]', r).forEach(x => x.onclick = () => { const ta = $('textarea[name="f_text"]', r); if (!ta) return; const [v, bis] = x.dataset.fund.split(':').map(Number); ta.focus(); ta.setSelectionRange(v, bis); const zeile = ta.value.slice(0, v).split('\n').length; ta.scrollTop = Math.max(0, (zeile - 3) * 22); });
}
const normB = b => { const o = kopie(b); delete o.geaendert; delete o.wer; return o; };
function standSetzen(s) {
  const f = S.entwurf.f;
  if (s === 'geprueft' || s === 'freigegeben' || s === 'geplant') {
    const p = pruefeBeitrag(f);
    if (p.fehler) return meldung(`Erst die ${p.fehler === 1 ? 'Fehlerstelle' : p.fehler + ' Fehlerstellen'} in der Prüfung beheben, dann ${STAND[s].toLowerCase()}.`, true);
    if (!(f.kanaele || []).length) return meldung('Erst mindestens einen Kanal wählen.', true);
  }
  if (s === 'geplant' && !f.datum) return meldung('Für «Geplant» braucht der Beitrag ein Datum.', true);
  if (s === 'draussen' && !f.datum) f.datum = heute();
  f.stand = s; S.entwurf.geaendert = !gleich(normB(f), normB(beitrag(f.id))); speichernBeitrag();
}

/* Vorschau je Kanal: so, wie der Beitrag dort ungefähr erscheint (Text bis «mehr», Bild im Format des Kanals) */
function vorschau(f, k) {
  const fa = (f.fassungen || {})[k] || {}, g = GRENZE[k] || {}, text = fa.text || '', tags = fa.tags || '';
  const sicht = g.sichtbar && text.length > g.sichtbar ? esc(text.slice(0, g.sichtbar).replace(/\s+\S*$/, '')) + '<span class="so-mehr-l"> … mehr</span>' : esc(text);
  const kopfz = `<div class="so-vk__kopf"><span class="so-av">${WO.zeichen()}</span><span><b>${esc(k === 'linkedin' ? 'Tasty Studios' : (kanal(k) || {}).handle || 'Tasty Studios')}</b><small>${esc(f.datum ? tagName(f.datum) + ', ' + datumKurz(f.datum) : 'noch ohne Datum')}</small></span></div>`;
  const bild = f.bild ? `<div class="so-vk__bild so-vk__bild--${k}"><img src="${esc(f.bild)}" alt="" decoding="async"></div>` : (g.bildPflicht ? `<div class="so-vk__bild so-vk__bild--${k} so-vk__ohne"><span>Hier fehlt noch das Bild</span></div>` : '');
  const leer = text ? '' : '<p class="so-vk__ruhig">Noch kein Text für diesen Kanal.</p>';
  let innen;
  if (k === 'linkedin') innen = `${kopfz}<div class="so-vk__text">${sicht.replace(/\n/g, '<br>')}${leer}</div>${tags ? `<p class="so-vk__tags">${esc(tags)}</p>` : ''}${bild}${fa.link ? `<p class="so-vk__kom"><b>Erster Kommentar</b>${esc(fa.link)}</p>` : ''}`;
  else if (k === 'instagram' || k === 'facebook') innen = `${kopfz}${bild}<div class="so-vk__text"><b>${esc((kanal(k) || {}).handle || 'tasty_studios')}</b> ${sicht.replace(/\n/g, '<br>')}${leer}</div>${tags ? `<p class="so-vk__tags">${esc(tags)}</p>` : ''}`;
  else if (k === 'tiktok') innen = `<div class="so-vk__hoch">${f.bild ? `<img src="${esc(f.bild)}" alt="" decoding="async">` : '<span>Hier fehlt noch das Video oder Bild</span>'}<div class="so-vk__ueber"><b>${esc((kanal(k) || {}).handle || '')}</b><p>${esc(kurz(text, 150))}</p>${tags ? `<small>${esc(tags)}</small>` : ''}</div></div>`;
  else if (k === 'pinterest') innen = `${bild}<div class="so-vk__text"><b class="so-vk__pt">${esc(fa.titel || 'Titel des Pins fehlt')}</b>${esc(text)}${leer}</div>`;
  else innen = `${kopfz}${bild}<div class="so-vk__text">${esc(text).replace(/\n/g, '<br>')}${leer}</div>${fa.link ? `<p class="so-vk__kn">Mehr erfahren</p>` : ''}`;
  return `<div class="so-vk__mk" style="${kStil(k)}">${soLogo(k, 'so-lg--s')}<span class="wo-mk">Vorschau ${esc(kname(k))}</span><small>ungefähr so, wie es dort erscheint</small></div><div class="so-vk so-vk--${k}">${innen}</div>`;
}

/* Prüfung: Regeln aus «Beiträge» (pruefeText) plus Regeln je Kanal und Wertigkeit. Kein KI-Aufruf. */
const WERTIG = /\b(fliessband|fließband|abfertig\w*|massenware|x-mal|im akkord|am laufenden band|friss)\b/gi;
function pruefeKanal(f, k) {
  const fa = (f.fassungen || {})[k] || {}, g = GRENZE[k] || {}, text = fa.text || '', voll = text + (fa.tags ? '\n\n' + fa.tags : '');
  const nurLinkedIn = /^(Keine Frage am Ende|Erste Zeile hat)/;
  let r = { funde: [], zeichen: voll.length };
  if (typeof pruefeText === 'function' && text) {
    r = pruefeText(voll, [], fa.tags ? text.length + 2 : -1);
    r.funde = r.funde.filter(x => !(/^\d[\d.]* Zeichen$/.test(x.titel)) && (k === 'linkedin' || !nurLinkedIn.test(x.titel)));
  }
  const add = (stufe, titel, tipp, von = 0, bis = 0) => r.funde.push({ stufe, titel, tipp, von, bis, zitat: '' });
  if (!text) add('fehler', 'Noch kein Text', 'Für ' + kname(k) + ' fehlt der Text.');
  if (g.zeichen && voll.length > g.zeichen) add('fehler', `${zahl(voll.length)} Zeichen`, `${kname(k)} nimmt höchstens ${zahl(g.zeichen)} Zeichen.`, g.zeichen, voll.length);
  if (g.sichtbar && text) { const erste = text.split('\n').find(z => z.trim()) || ''; if (erste.length > g.sichtbar && k !== 'linkedin') add('hinweis', `Erste Zeile hat ${erste.length} Zeichen`, `${kname(k)} zeigt etwa ${g.sichtbar} Zeichen, dann kommt «mehr». Die Aussage gehört davor.`, 0, erste.length); }
  if (g.titel && !fa.titel) add('pruefen', 'Titel fehlt', 'Ein Pin braucht einen Titel, er steht in der Suche ganz oben.');
  if (g.titel && (fa.titel || '').length > g.titel) add('fehler', 'Titel zu lang', `Höchstens ${g.titel} Zeichen.`);
  if (g.bildPflicht && !f.bild) add('pruefen', 'Bild fehlt', `Auf ${kname(k)} geht ohne Bild oder Video nichts raus.`);
  if (g.linkTot && /https?:\/\/|www\./i.test(text)) add('hinweis', 'Link im Text', `Links sind auf ${kname(k)} im Text nicht anklickbar. Besser «Link in der Bio».`);
  const tags = (voll.match(/#[\p{L}\p{N}_]+/gu) || []); if (tags.length > 5 && !r.funde.some(x => /Hashtags$/.test(x.titel))) add('hinweis', `${tags.length} Hashtags`, 'Zwei bis fünf, eher drei gut gewählte.');
  let m; WERTIG.lastIndex = 0; while ((m = WERTIG.exec(text))) add('fehler', 'Klingt nach Masse', 'Jeder Satz muss das Haus aufwerten: Sorgfalt, Handarbeit, der einzelne Gast. Nie Menge oder Abfertigung.', m.index, m.index + m[0].length);
  const dopp = /\b(\p{L}{2,})\s+\1\b/giu; while ((m = dopp.exec(text))) add('pruefen', 'Wort doppelt', '«' + m[1] + ' ' + m[1] + '»: vermutlich ein Tippfehler.', m.index, m.index + m[0].length);
  const lz = / {2,}/g; while ((m = lz.exec(text))) { add('hinweis', 'Doppeltes Leerzeichen', 'Ein Leerzeichen reicht.', m.index, m.index + m[0].length); break; }
  if (f.bild) { const andere = beitraege().filter(x => x.id !== f.id && x.bild === f.bild && /^(geplant|draussen)$/.test(x.stand) && Math.abs(new Date((x.datum || heute()) + 'T12:00') - new Date((f.datum || heute()) + 'T12:00')) < 28 * 864e5); if (andere.length) add('pruefen', 'Bild kurz hintereinander', 'Dasselbe Bild steht auch in «' + kurz(andere[0].titel, 40) + '» innerhalb von vier Wochen.'); }
  const ord = { fehler: 0, pruefen: 1, hinweis: 2 }; r.funde.sort((a, b) => ord[a.stufe] - ord[b.stufe] || a.von - b.von);
  r.anzahl = { fehler: r.funde.filter(x => x.stufe === 'fehler').length, pruefen: r.funde.filter(x => x.stufe === 'pruefen').length, hinweis: r.funde.filter(x => x.stufe === 'hinweis').length };
  return r;
}
function pruefeBeitrag(f) {
  const ks = (f.kanaele || []).filter(k => GRENZE[k] && !GRENZE[k].eigen);
  if (f.stand === 'idee') return { fehler: 0, pruefen: 0, je: {} };
  const je = {}; let fehler = 0, pruefen = 0;
  ks.forEach(k => { je[k] = pruefeKanal(f, k); fehler += je[k].anzahl.fehler; pruefen += je[k].anzahl.pruefen; });
  return { fehler, pruefen, je };
}
const STUFE = { fehler: 'Raus damit', pruefen: 'Ansehen', hinweis: 'Hinweis' };
function pruefBlock(f, k) {
  const r = pruefeKanal(f, k), a = r.anzahl;
  return `<div class="so-pruef__kopf"><span class="wo-mk">Prüfung ${esc(kname(k))}</span><div class="so-pruef__z"><span class="f">${a.fehler}<small>Fehler</small></span><span class="p">${a.pruefen}<small>ansehen</small></span><span class="h">${a.hinweis}<small>Hinweise</small></span></div></div>
    ${r.funde.length ? `<ol class="so-funde">${r.funde.slice(0, 14).map(x => `<li class="so-fund--${x.stufe}"><button type="button"${x.bis > x.von ? ` data-fund="${x.von}:${x.bis}"` : ''}><em>${STUFE[x.stufe]}</em><b>${esc(x.titel)}</b>${x.zitat ? `<q>${esc(kurz(x.zitat, 60))}</q>` : ''}<small>${esc(x.tipp)}</small></button></li>`).join('')}</ol>${r.funde.length > 14 ? `<p class="so-fein">und ${r.funde.length - 14} weitere</p>` : ''}`
      : `<p class="so-pruef__gut">${WO.ic('haken')}<span>Nichts gefunden. Rechtschreibung: Wörter, die der Browser rot unterstreicht, noch einmal ansehen.</span></p>`}
    <p class="so-fein">Geprüft nach der Anti-KI-Checkliste und dem Schreibstil (dieselben Regeln wie in «Beiträge»), den Grenzen von ${esc(kname(k))} und der Wertigkeit. Ein Klick auf einen Fund markiert die Stelle im Text.</p>`;
}

/* ---------------------------------------------------------------- Speichern, Neu, Löschen */
async function api(methode, weg, daten) {
  const r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' });
  let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
  if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
  return j;
}
const B_NAMEN = { titel: 'Titel', stand: 'Stand', thema: 'Thema', datum: 'Datum', zeit: 'Uhrzeit', kanaele: 'Kanäle', bild: 'Bild', notiz: 'Notiz' };
function beitragUnterschiede(a, b) {
  const z = [];
  Object.keys(B_NAMEN).forEach(k => { if (!gleich(a[k] || '', b[k] || '')) z.push([B_NAMEN[k], k === 'stand' ? `${STAND[a[k]] || '–'} → ${STAND[b[k]] || '–'}` : k === 'kanaele' ? `${(a[k] || []).map(kname).join(', ') || 'keine'} → ${(b[k] || []).map(kname).join(', ') || 'keine'}` : k === 'datum' ? `${datum(a[k]) || 'leer'} → ${datum(b[k]) || 'leer'}` : `${kurz(a[k], 40) || 'leer'} → ${kurz(b[k], 40) || 'leer'}`]); });
  const ks = new Set(Object.keys(a.fassungen || {}).concat(Object.keys(b.fassungen || {})));
  const nf = o => ({ text: o.text || '', tags: o.tags || '', link: o.link || '', titel: o.titel || '' });
  ks.forEach(k => { const x = nf((a.fassungen || {})[k] || {}), y = nf((b.fassungen || {})[k] || {}); if (!gleich(x, y)) z.push(['Text ' + kname(k), `${zahl((x.text || '').length)} → ${zahl((y.text || '').length)} Zeichen`]); });
  if (!gleich(a.live || {}, b.live || {})) z.push(['Links draussen', 'geändert']);
  if (!gleich(a.zahlen || {}, b.zahlen || {})) z.push(['Zahlen des Beitrags', 'geändert']);
  return z;
}
let laeuft = false;
async function speichernBeitrag() {
  const E = S.entwurf; if (!E || !E.geaendert || laeuft) return;
  laeuft = true;
  try {
    const j = await api('PUT', 'beitrag/' + E.id, { felder: E.f, wer: WER() });
    S.d.beitraege[E.id] = j.nachher; S.entwurf = null; neuZeichnen();
    quittung('Beitrag gespeichert', beitragUnterschiede(j.vorher, j.nachher), { art: 'beitrag', id: E.id, vorher: j.vorher }, x => { S.d.beitraege[E.id] = x; S.entwurf = null; });
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
  finally { laeuft = false; }
}
async function beitragAendern(id, felder, titel) {
  try {
    const j = await api('PUT', 'beitrag/' + id, { felder, wer: WER() });
    S.d.beitraege[id] = j.nachher; neuZeichnen();
    quittung(titel, beitragUnterschiede(j.vorher, j.nachher), { art: 'beitrag', id, vorher: j.vorher }, x => { S.d.beitraege[id] = x; });
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
}
async function neuerBeitrag(f, bleiben) {
  const felder = Object.assign({ titel: 'Neuer Beitrag', stand: 'entwurf', kanaele: ['linkedin'], thema: (themen()[0] || {}).k || '' }, f);
  try {
    const j = await api('POST', 'beitrag', { felder, wer: WER() });
    S.d.beitraege[j.nachher.id] = j.nachher;
    if (bleiben) neuZeichnen(); else gehe('beitrag:' + j.nachher.id);
    quittung((felder.stand === 'idee' ? 'Idee' : 'Beitrag') + ' angelegt', [['Titel', felder.titel]], { art: 'beitrag', id: j.nachher.id, vorher: null }, () => { delete S.d.beitraege[j.nachher.id]; if (S.ansicht === 'beitrag:' + j.nachher.id) { S.ansicht = 'planung'; } });
  } catch (e) { meldung('Nicht angelegt: ' + e.message, true); }
}
async function loeschen() {
  const E = S.entwurf; if (!E) return;
  if (!confirm('«' + E.f.titel + '» löschen? Die Quittung danach hat «Rückgängig».')) return;
  try {
    const j = await api('DELETE', 'beitrag/' + E.id);
    delete S.d.beitraege[E.id]; S.entwurf = null; gehe('archiv');
    quittung('Beitrag gelöscht', [['Titel', j.vorher.titel]], { art: 'beitrag', id: E.id, vorher: j.vorher }, x => { S.d.beitraege[E.id] = x; });
  } catch (e) { meldung('Nicht gelöscht: ' + e.message, true); }
}
function textKopieren() {
  const E = S.entwurf; if (!E) return;
  const fa = (E.f.fassungen || {})[S.reiter] || {}, t = [fa.titel, fa.text, fa.tags].filter(Boolean).join('\n\n');
  if (!t) return meldung('Für diesen Kanal steht noch kein Text da.', true);
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => meldung('Text für ' + kname(S.reiter) + ' kopiert. In der App einfügen.'), () => meldung('Kopieren ging nicht. Text im Feld markieren und kopieren.', true));
}
/* Quittung mit vorher und nachher und «Rückgängig» (CLAUDE.md der internen Werkzeuge) */
function quittung(titel, zeilen, zurueck, setze) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>${esc(titel)}</b>${zeilen && zeilen.length ? `<ul>${zeilen.slice(0, 8).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}</div><div class="sc-quit__kn">${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    try { const j = await api('POST', 'zurueck', Object.assign({ wer: WER() }, zurueck)); setze(j.nachher); q.remove(); S.entwurf = null; if (!gueltig(S.ansicht)) gehe('planung'); else neuZeichnen(); meldung('Rückgängig gemacht: der Stand davor gilt wieder.'); }
    catch (e) { meldung('Rückgängig ging nicht: ' + e.message, true); }
  };
  m.appendChild(q); setTimeout(() => q.remove(), 14000);
}
function meldung(text, fehl) {
  const m = $('#meldung'), q = document.createElement('div'); q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(text)}</b></div><button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button>`;
  q.querySelector('button').onclick = () => q.remove(); m.appendChild(q); setTimeout(() => q.remove(), fehl ? 9000 : 3200);
}

/* ---------------------------------------------------------------- Draussen und Wirkung */
function wirkung() {
  const dr = beitraege().filter(b => b.stand === 'draussen').sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  const mitZ = dr.filter(b => Object.values(b.zahlen || {}).some(z => summeI(z) || +z.reichweite));
  const thSum = {}; mitZ.forEach(b => { const s = Object.values(b.zahlen).reduce((n, z) => n + summeI(z), 0); const t = b.thema || ''; thSum[t] = thSum[t] || { n: 0, s: 0 }; thSum[t].n++; thSum[t].s += s; });
  const rang = Object.entries(thSum).map(([t, x]) => [t, x.s / x.n, x.n]).sort((a, b) => b[1] - a[1]);
  const kz = kanaele().filter(k => !(GRENZE[k.id] || {}).eigen);
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.wirkung), h1: 'Draussen und <em>Wirkung.</em>', zier: esc(mz(dr.length, 'Beitrag', 'Beiträge') + ' draussen'),
      satz: 'Was live ist, je Kanal mit Link und Zahlen. Dazu der Verlauf der Kanäle und welches Thema am meisten Antworten bekommt.',
      knoepfe: WO.knopf('Zahlen eintragen', 'balken', 'gold', { attr: 'data-sprung="kanalzahlen"' }) + WO.knopf('Zum Archiv', 'rechts', 'glas', { attr: 'data-gehe="archiv"' }) })}
    <div class="wo-lage sc-lage so-lage" data-r>
      ${lg('Draussen', zahl(dr.length), 'Beiträge insgesamt')}
      ${lg('Mit Zahlen', zahl(mitZ.length), dr.length ? 'von ' + dr.length + ' ausgewertet' : 'noch nichts ausgewertet')}
      ${lg('Antworten', zahl(mitZ.reduce((n, b) => n + Object.values(b.zahlen).reduce((m, z) => m + summeI(z), 0), 0)), 'Gefällt, Kommentare, Geteilt, Gespeichert')}
      ${lg('Bestes Thema', rang[0] ? esc(thema(rang[0][0]) || '–') : '–', rang[0] ? 'im Schnitt ' + zahl(Math.round(rang[0][1])) + ' Antworten' : 'sobald Zahlen da sind')}
    </div>
    <section class="sc-block">${kopfBlock(['Was gerade', 'draussen ist.'], dr.length ? 'Neueste zuerst. Ein Klick öffnet den Beitrag, dort stehen Link und Zahlen je Kanal.' : 'Noch kein Beitrag ist als draussen eingetragen.')}
      ${dr.length ? `<ol class="so-liste" data-r>${dr.slice(0, 30).map(b => zeile(b, { satz: (b.kanaele || []).map(k => { const z = (b.zahlen || {})[k] || {}; return kname(k) + (summeI(z) || z.reichweite ? ': ' + [z.reichweite ? zahl(z.reichweite) + ' erreicht' : '', summeI(z) ? zahl(summeI(z)) + ' Antworten' : ''].filter(Boolean).join(', ') : ''); }).join(' · ') })).join('')}</ol>`
        : `<div class="so-konzept" data-r><span class="wo-mk">So kommt ein Beitrag hierher</span><p>Ist ein Beitrag gepostet, in der Werkstatt auf «Draussen» stellen und den Link aus der App eintragen. Nach ein paar Tagen die Zahlen des Beitrags dazuschreiben. Ab dann steht er hier und zählt für das beste Thema.</p>${WO.knopf('Zur Planung', 'rechts', 'dunkel', { klein: true, attr: 'data-gehe="planung"' })}</div>`}</section>
    ${rang.length ? `<section class="sc-block">${kopfBlock(['Was am besten', 'ankommt.'], 'Antworten je Beitrag im Schnitt, nach Thema.')}<ol class="so-rang" data-r>${rang.map(([t, s, n]) => `<li><b>${esc(thema(t) || 'Ohne Thema')}</b><span class="sc-balken"><i style="width:${Math.round(100 * s / rang[0][1])}%"></i></span><small>${zahl(Math.round(s))} im Schnitt · ${mz(n, 'Beitrag', 'Beiträge')}</small></li>`).join('')}</ol></section>` : ''}
    <section class="sc-block" id="kanalzahlen">${kopfBlock(['Die Kanäle', 'im Verlauf.'], 'Follower und Reichweite je Kanal. Die Zahlen kommen von Hand oder aus der Export-Datei der Statistik.')}
      <div class="so-kverlauf" data-r>${kz.map(k => { const z = S.d.zahlen[k.id] || [], l = z.slice(-1)[0];
        return `<div class="so-kv"><div class="so-kv__kopf"><b>${esc(k.name)}</b>${WO.knopf('Eintragen', 'stift', 'dunkel', { klein: true, attr: `data-gehe="kanal:${esc(k.id)}"` })}</div>${l ? `<p class="so-kv__z"><b>${zahl(l.follower || l.reichweite || 0)}</b><small>${l.follower ? 'Follower' : 'erreicht'} · ${esc(datum(l.datum))}</small></p>${verlaufLinie(z, l.follower != null ? 'follower' : 'reichweite')}` : `<p class="so-kv__s">Noch keine Zahlen.</p>${beispielLinie('so sieht es mit Zahlen aus')}`}</div>`; }).join('')}</div>
      <p class="so-fein" data-r>Automatisch abholen geht später: die Kanäle bieten das für Firmenkonten an, jeder mit einer eigenen Freischaltung. Bis dahin reicht die Export-Datei einmal im Monat.</p></section>
    ${quelle('Zahlen: im Social Cockpit eingetragen oder aus den Export-Dateien der Kanäle')}`;
}

/* ---------------------------------------------------------------- Archiv */
function archivTreffer() {
  const F = S.filter, q = F.suche.toLowerCase();
  return beitraege().filter(b => (!F.kanal || imKanal(b, F.kanal)) && (!F.stand || b.stand === F.stand) && (!F.thema || b.thema === F.thema) && (!F.gruppe || b.gruppe === F.gruppe)
    && (!q || (b.titel + ' ' + ersterText(b) + ' ' + (b.notiz || '')).toLowerCase().includes(q)))
    .sort((a, b) => (b.datum || '').localeCompare(a.datum || '') || (b.geaendert || '').localeCompare(a.geaendert || '') || (a.reihe || '').localeCompare(b.reihe || ''));
}
function archiv() {
  const F = S.filter, l = archivTreffer(), sel = (n, opts, v) => `<label class="sc-feld"><span>${n}</span><select data-f="${n === 'Kanal' ? 'kanal' : n === 'Stand' ? 'stand' : n === 'Thema' ? 'thema' : 'gruppe'}"><option value="">alle</option>${opts.map(([k, t]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const gruppen = [...new Set(beitraege().map(b => b.gruppe).filter(Boolean))].map(g => [g, g]);
  const n = Math.min(l.length, S.archivN || 48), ansicht = S.archivArt || 'kacheln';
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.archiv), h1: 'Das <em>Archiv.</em>', zier: esc(mz(beitraege().length, 'Beitrag', 'Beiträge') + ' und Ideen'),
      satz: 'Alles, was je geplant, geschrieben oder gepostet wurde, mit Text, Bild, Kanal und Zahlen. Filtern, öffnen, wiederverwenden.', knoepfe: WO.knopf('Neuer Beitrag', 'plus', 'gold', { attr: 'data-neu' }) })}
    <section class="sc-block"><form class="so-filter" data-r onsubmit="return false">
      <label class="sc-feld so-suche"><span>Suche</span><input type="search" data-f="suche" value="${esc(F.suche)}" placeholder="Titel, Text oder Notiz"></label>
      ${sel('Kanal', kanaele().filter(k => !(GRENZE[k.id] || {}).eigen).map(k => [k.id, k.name]), F.kanal)}${sel('Stand', Object.entries(STAND), F.stand)}${sel('Thema', themen().map(t => [t.k, t.t]), F.thema)}${sel('Gruppe', gruppen, F.gruppe)}</form>
      <div class="so-treffer" data-r><span>${mz(l.length, 'Treffer', 'Treffer')}${Object.values(F).some(Boolean) ? ` · <button type="button" class="so-link" data-f-weg>Filter zurücksetzen</button>` : ''}</span>
        <div class="so-schalter so-schalter--hell" role="tablist">${[['kacheln', 'Kacheln'], ['liste', 'Liste']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === ansicht}" class="${k === ansicht ? 'an' : ''}" data-archiv-art="${k}">${t}</button>`).join('')}</div></div>
      ${l.length ? (ansicht === 'kacheln' ? `<div class="so-kacheln" data-r>${l.slice(0, n).map(b => `<div class="so-kachel">${karteB(b, { zeit: false, lang: 70 })}<span class="so-kachel__m">${vorschlagMarke(b)}${standMarke(b.stand)}${b.datum ? `<em>${esc(datum(b.datum))}</em>` : ''}</span></div>`).join('')}<button type="button" class="so-kachel-neu" data-neu><i>${WO.ic('plus')}</i><b>Neuer Beitrag</b><small>leer anlegen oder eine Idee aufschreiben</small></button></div>` : `<ol class="so-liste" data-r>${l.slice(0, n).map(b => zeile(b)).join('')}</ol>`)
        + (l.length > n ? `<div class="so-mehr" data-r>${WO.knopf('Weitere ' + zahl(Math.min(48, l.length - n)) + ' zeigen', 'plus', 'dunkel', { klein: true, attr: 'data-mehr' })}<span class="so-mehr__s">${zahl(n)} von ${zahl(l.length)}</span></div>` : '')
        : `<p class="so-hinweis" data-r>Kein Beitrag passt zu diesem Filter.</p>`}</section>
    ${quelle('Bestand: Content-Zuordnung, LinkedIn-Archiv, «Beiträge», Feed-Entwurf v2 · alles Weitere im Social Cockpit angelegt')}`;
}
function archivLeben(r) {
  let t = 0;
  $$('[data-f]', r).forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => { S.filter[i.dataset.f] = i.value; S.archivN = 48; clearTimeout(t); t = setTimeout(() => { const y = scrollY, fokus = document.activeElement && document.activeElement.dataset.f; zeichne(); scrollTo({ top: y }); if (fokus) { const n = $(`[data-f="${fokus}"]`); if (n) { n.focus(); if (n.setSelectionRange && n.type === 'search') n.setSelectionRange(n.value.length, n.value.length); } } }, i.tagName === 'SELECT' ? 0 : 220); }));
  $$('[data-f-weg]', r).forEach(b => b.onclick = () => { S.filter = { kanal: '', stand: '', thema: '', suche: '', gruppe: '' }; zeichne(); });
  $$('[data-mehr]', r).forEach(b => b.onclick = () => { S.archivN = (S.archivN || 48) + 48; const y = scrollY; zeichne(); scrollTo({ top: y }); });
  $$('[data-archiv-art]', r).forEach(b => b.onclick = () => { S.archivArt = b.dataset.archivArt; const y = scrollY; zeichne(); scrollTo({ top: y }); });
}
/* Knöpfe mit Filter (data-filter-kanal / -stand) setzen ihn vor dem Wechsel ins Archiv */
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-filter-kanal],[data-filter-stand]'); if (!b) return; S.filter = { kanal: b.dataset.filterKanal || '', stand: b.dataset.filterStand || '', thema: '', suche: '', gruppe: '' }; }, true);

/* ---------------------------------------------------------------- Prüfung: alle offenen Texte auf einen Blick */
function pruefSeite() {
  const offen = beitraege().filter(b => /^(entwurf|geprueft|freigegeben|geplant)$/.test(b.stand)).map(b => [b, pruefeBeitrag(b)]);
  const mitF = offen.filter(([, p]) => p.fehler).sort((a, b) => b[1].fehler - a[1].fehler);
  const sauber = offen.filter(([, p]) => !p.fehler);
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.pruefung), h1: 'Die <em>Prüfung.</em>', zier: esc(mz(offen.length, 'Text', 'Texte') + ' in Arbeit'),
      satz: 'Jeder Text wird je Kanal geprüft: Stimme und Schreibstil, Länge und Format des Kanals, Wertigkeit, doppelte Wörter. Erst ohne Fehler lässt sich ein Beitrag freigeben.',
      knoepfe: WO.knopf(mitF.length ? 'Zu den Fehlern' : 'Zum Archiv', 'rechts', 'gold', { attr: mitF.length ? 'data-sprung="fehler"' : 'data-gehe="archiv"' }) })}
    <div class="wo-lage sc-lage so-lage" data-r>${lg('In Arbeit', zahl(offen.length), 'Entwürfe bis Geplant')}${lg('Mit Fehlern', zahl(mitF.length), 'müssen vor der Freigabe ran')}${lg('Sauber', zahl(sauber.length), 'ohne Fehler')}${lg('Zum Ansehen', zahl(offen.reduce((n, [, p]) => n + p.pruefen, 0)), 'Stellen, oft richtig, manchmal nicht')}</div>
    ${mitF.length ? `<section class="sc-block" id="fehler">${kopfBlock(['Mit', 'Fehlern.'], 'Die meisten Fehler zuerst. In der Werkstatt markiert ein Klick auf den Fund die Stelle im Text.')}<ol class="so-liste" data-r>${mitF.slice(0, 30).map(([b, p]) => zeile(b, { satz: mz(p.fehler, 'Fehler', 'Fehler') + (p.pruefen ? ', ' + p.pruefen + ' zum Ansehen' : '') + ' · ' + (b.kanaele || []).map(kname).join(', ') })).join('')}</ol></section>` : ''}
    <section class="sc-block">${kopfBlock(['Was geprüft', 'wird.'], 'Ohne KI-Aufruf, mit festen Regeln. So kostet die Prüfung nichts und sagt jedes Mal dasselbe.')}
      <div class="so-zwei so-zwei--drei" data-r>
        <div class="so-feldblatt"><span class="wo-mk">Stimme und Schreibstil</span><p>Die Anti-KI-Checkliste und die Verbotsliste aus dem Schreibstil, dieselben Regeln wie im Werkzeug «Beiträge»: kein Emoji, kein Gedankenstrich als Satztrenner, keine Marketing-Wörter, keine künstliche Dringlichkeit, keine Floskel am Anfang, lange Sätze und Absätze.</p></div>
        <div class="so-feldblatt"><span class="wo-mk">Format des Kanals</span><p>Höchstlänge je Kanal, was vor «mehr» sichtbar ist, Titel bei Pinterest, Bild bei Instagram, TikTok und Pinterest, Links, die dort nicht anklickbar sind, zwei bis fünf Hashtags.</p></div>
        <div class="so-feldblatt"><span class="wo-mk">Wertigkeit und Tippfehler</span><p>Nichts, was nach Masse oder Abfertigung klingt. Doppelte Wörter und Leerzeichen. Dasselbe Bild kurz hintereinander. Die Rechtschreibung prüft der Browser im Textfeld mit, rot unterstrichen.</p></div>
      </div>
      <div class="so-konzept" data-r><span class="wo-mk">Ideen und Umformulierungen per KI</span><p>Noch nicht angeschaltet. Sie kämen als Vorschlag neben den Text, nie als stiller Austausch, und erst nach einer Kostenrunde mit unserem gemeinsamen Ja.</p></div></section>
    ${quelle('Regeln: /werkzeuge/08-beitraege/regeln.js (Anti-KI-Checkliste aus «Meine LinkedIn-Stimme», Schreibstil) · Grenzen der Kanäle Stand November 2026')}`;
}

/* ---------------------------------------------------------------- Material */
const HAUSBILDER = ['culinarium', 'wildside', 'txtme', 'angelina', 'rivage', 'maeder', 'zurbriggen', 'schaefli', 'schloessli'];
function materialBilder() {
  const feed = beitraege().filter(b => /^Feed-Entwurf/.test(b.gruppe || '') && b.bild).sort((a, b) => (a.reihe || '').localeCompare(b.reihe || '')).map(b => [b.bild, b.titel]);
  return { feed, haeuser: HAUSBILDER.map(h => ['/zentrale/werkzeuge/08-beitraege/haeuser/bilder/' + h + '.webp', h]) };
}
function material() {
  const m = materialBilder(), feed = m.feed;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO(FOTO_JE.material), h1: 'Das <em>Material.</em>', zier: esc(zahl(m.feed.length + m.haeuser.length) + ' Bilder'),
      satz: 'Bilder der fertigen Häuser, der Feed-Entwurf und die Marke. Ein Klick auf ein Bild legt damit einen neuen Beitrag an.', knoepfe: WO.knopf('Zum Markenbuch', 'pfeil', 'gold', { href: '/zentrale/werkzeuge/11-markenbuch/' }) })}
    <section class="sc-block">${kopfBlock(['Die', 'Häuser.'], 'Die fertigen Websites, so wie sie im Werkzeug «Beiträge» als nachher stehen.')}
      <div class="so-galerie so-galerie--haus" data-r><div class="so-galerie__text"><b>${zahl(m.haeuser.length)} Häuser</b><span>aus dem Werkzeug «Beiträge», je die fertige Website</span></div>${m.haeuser.map(([src, n]) => `<button type="button" data-bild="${esc(src)}" title="Neuer Beitrag mit diesem Bild"><img src="${esc(src)}" alt="${esc(n)}" loading="lazy" decoding="async"></button>`).join('')}</div></section>
    <section class="sc-block">${kopfBlock(['Der', 'Feed-Entwurf.'], 'Die Kacheln aus dem Feed-Entwurf für Instagram, in der Reihenfolge des Rasters.')}
      <div class="so-galerie" data-r>${feed.map(([src, n]) => `<button type="button" data-bild="${esc(src)}" title="${esc(n)}"><img src="${esc(src)}" alt="${esc(n)}" loading="lazy" decoding="async"></button>`).join('')}${fueller(feed.length, 6, 'Zum Instagram-Plan', 'data-gehe="planung"')}</div></section>
    <section class="sc-block">${kopfBlock(['Die', 'Marke.'], 'Logo, Schriften und Farben liegen im Markenbuch, mit Dateien zum Laden.')}
      <div class="so-zwei" data-r><div class="so-feldblatt"><span class="wo-mk">Markenbuch</span><p>Logo, Schriften und Farben von Tasty Studios, so wie sie auf der Website wirklich stehen.</p>${WO.knopf('Markenbuch öffnen', 'pfeil', 'dunkel', { klein: true, href: '/zentrale/werkzeuge/11-markenbuch/' })}</div>
        <div class="so-feldblatt"><span class="wo-mk">Marke und Vision</span><p>Wofür Tasty Studios steht, für wen wir arbeiten und wie wir klingen. Die Grundlage für jeden Text.</p>${WO.knopf('Marke und Vision öffnen', 'pfeil', 'dunkel', { klein: true, href: '/zentrale/werkzeuge/12-marke-vision/' })}</div></div></section>
    ${quelle('Bilder: Werkzeug «Beiträge» (Häuser) · Feed-Entwurf v2 @tasty_studios2026')}`;
}
function materialLeben(r) {
  $$('[data-bild]', r).forEach(b => b.onclick = () => neuerBeitrag({ titel: 'Beitrag mit Bild', bild: b.dataset.bild, kanaele: ['instagram'], stand: 'entwurf' }));
}
function materialFenster(wahl) {
  const m = materialBilder(), o = document.createElement('div'); o.className = 'so-fenster'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Bild aus dem Material wählen');
  o.innerHTML = `<div class="so-fenster__blatt"><div class="so-fenster__kopf"><b>Bild wählen</b><button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>
    <div class="so-fenster__inhalt"><p class="wo-mk">Häuser</p><div class="so-galerie so-galerie--klein">${m.haeuser.map(([s, n]) => `<button type="button" data-w="${esc(s)}"><img src="${esc(s)}" alt="${esc(n)}" loading="lazy"></button>`).join('')}</div>
    <p class="wo-mk">Feed-Entwurf</p><div class="so-galerie so-galerie--klein">${m.feed.map(([s, n]) => `<button type="button" data-w="${esc(s)}" title="${esc(n)}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div></div></div>`;
  const zu = () => o.remove();
  o.onclick = e => { if (e.target === o || e.target.closest('.sc-quit__zu')) return zu(); const b = e.target.closest('[data-w]'); if (b) { wahl(b.dataset.w); zu(); } };
  document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { zu(); document.removeEventListener('keydown', esc_); } });
  document.body.appendChild(o);
}

/* ---------------------------------------------------------------- Start */
function startfehler(grund) {
  document.documentElement.classList.remove('sc-wartet');
  $('#ansicht').innerHTML = `<div class="sc-tuer-zu" role="alert"><h1>${esc(NAME)} startet nicht.</h1><p>${esc(grund)}</p><p>Läuft die Zentrale? Starten mit <code>python3 zentrale/server.py</code>, dann neu laden.</p>${WO.knopf('Neu laden', 'zurueck', 'dunkel', { attr: 'data-neu-laden' })}</div>`;
  const b = $('#ansicht [data-neu-laden]'); if (b) b.onclick = () => location.reload();
}
function bereit(srcs) {
  const bilder = srcs.filter(Boolean).map(src => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; }));
  return Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, ...bilder]), new Promise(r => setTimeout(r, 1200))]);
}
addEventListener('beforeunload', e => { if ((S.entwurf && S.entwurf.geaendert) || S.bearbeiten) { e.preventDefault(); e.returnValue = ''; } });
/* Zurück aus dem Speicher des Browsers: an der alten Stelle bleiben (Prüfpunkt 12) */
addEventListener('pagehide', () => { try { sessionStorage.setItem('tasty-so-y', String(scrollY)); } catch (e) { /* privat */ } });
addEventListener('pageshow', e => { if (!e.persisted) return; try { const y = +sessionStorage.getItem('tasty-so-y'); if (y) scrollTo({ top: y }); } catch (x) { /* privat */ } });
(async function () {
  try {
    if (!window.WO) throw new Error('Das Kleid (oberflaeche.js) fehlt.');
    const r = await (window.__vorab || fetch(API + 'stand', { cache: 'no-store' }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
    S.d = j;
    const sg = Object.values(j.beitraege).filter(b => b.thema === 'styleguide').sort((a, b) => a.id.localeCompare(b.id)); window.SO_FOLGE = b => { const i = sg.findIndex(x => x.id === b.id); return i < 0 ? '' : i + 1; };
    let a = decodeURIComponent(location.hash.slice(1));
    if (!gueltig(a)) { try { const l = localStorage.getItem('tasty-so-ansicht'); a = gueltig(l) && !H.imRahmen ? l : 'start'; } catch (e) { a = 'start'; } }
    if (a === 'planung' || a === 'strategie') { location.replace('plan/#' + (a === 'planung' ? 'kalender' : 'thema:' + ((j.strategie.themen || [])[0] || {}).k)); return; }
    S.ansicht = a;
    const k = /^kanal:/.test(a) ? a.slice(6) : '';
    await bereit([FOTO(k ? KANAL_FOTO[k] : FOTO_JE[a] || 'bildschirm')]);
    kopf(); rand(); leiste(); zeichne();
    document.documentElement.classList.remove('sc-wartet');
    document.body.classList.add('sc-bereit');
  } catch (e) { return startfehler(String(e && e.message || e).slice(0, 200)); }
  addEventListener('hashchange', () => { const z = decodeURIComponent(location.hash.slice(1)); if (gueltig(z) && z !== S.ansicht) gehe(z); });
})();
