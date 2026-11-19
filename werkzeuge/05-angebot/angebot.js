/* Angebot · Tasty Studios (Neubau im Kleid, 07.11.2026). Aufbau, Ansichten, Fenster und Quittungen aus La Réception (vorlage/culinarium-demo/werkzeuge/reception/,
   reception.js), Rahmen «Die Bühne» wie Le Bureau, Kleid aus zentrale/oberflaeche/. Inhalt aus der ersten Fassung (erste Fassung: index.html bis 07.11.2026):
   Haus wählen oder eintragen, Umfang anklicken, Preise nur aus preise.json (Abzug aus grundlagen/Angebot.md, mit Stand-Datum), Vorschau als A4-Blätter
   im Tastyrob Document Taste, PDF über das Druckfenster, Nummer, Datum, Gültigkeit, Verlauf je Haus.
   Ansichten wie in der Vorlage: Übersicht (Startbild, Lage, Kacheln, zwei Listen) · Angebote (= Eingang: Liste, Karte, darunter das Blatt) ·
   Häuser (= Die Abende: Karten je Haus) · Preise (= Das wurde gefragt: Zahlen, Auswahl, Gruppen). Server-Teil: api.py (/zentrale/api/05-angebot/…). Hier wird nichts verschickt. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
// Schliessen ohne «×» (wie in der Vorlage): der Zurück-Pfeil
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';
const ZEICHEN = '<img src="/zentrale/zentrale/oberflaeche/kleid/anker-zeichen.svg" width="1744" height="1688" alt="">';
const SYM = {
  buch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.2c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v9.6c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6z"/><path d="M8 3.8v9.6"/></svg>',
  korb: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  post: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  stift: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg>',
  haken: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>' };
const API = '/zentrale/api/05-angebot/';
const TASTY = { name: 'Tasty Studios', inhaber: 'Robert Reff', firma: 'TastyRob Commerce', strasse: 'Barmbeker Straße 26c', ort: '22303 Hamburg', mail: 'robert@tasty-studios.de' };
const WASSER = '/zentrale/zentrale/oberflaeche/kleid/anker/anker-wasserzeichen.png';
const PT = 96 / 72;                                   // Punkt in Bildschirmpunkte
const SEITE_INHALT = (841.9 - 144 - 4) * PT;          // nutzbare Höhe je Blatt, mit etwas Luft zum Rand
const WER = (window.WO_HAUS || {}).wer || '';
const Q = new URLSearchParams(location.search);
/* Fotos der Agentur-Seite (grundlagen/marke/fotos, über WO_HAUS.fotos): je Haus und je Bereich eines, kein Foto zweimal untereinander */
const F = (window.WO_HAUS || {}).fotos || {};
const ARTBILDER = { hotel: ['faehre', 'zimmer', 'empfang'], gasthaus: ['aussen', 'haus'], bar: ['bar', 'speicherstadt'], landhaus: ['terrasse', 'anleger'] };
const ALLE_BILDER = ['tafel', 'zimmer', 'bar', 'terrasse', 'empfang', 'aussen', 'haus', 'anleger', 'faehre', 'speicherstadt', 'studio', 'plan', 'bildschirm'];
const hashZahl = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
/* je Haus fest ein Foto, keines doppelt: zuerst eines, das zur Art passt, sonst das nächste freie */
const hausBild = h => {
  const H = S.haeuser || [], vergeben = {};
  for (const x of H) {
    const wunsch = (ARTBILDER[String(x.art || '').toLowerCase()] || []).concat(ALLE_BILDER);
    const k = wunsch.find(b => !vergeben[b]) || wunsch[hashZahl(x.id) % wunsch.length];
    vergeben[k] = x.id; if (h && x.id === h.id) return F[k] || F.studio;
  }
  return F[ALLE_BILDER[hashZahl(h && h.id) % ALLE_BILDER.length]] || F.studio;
};
const GRUPPENBILD = { website: 'bildschirm', werkzeuge: 'plan', betreuung: 'studio', drucksachen: 'tafel', feed: 'bar', schulung: 'empfang', backoffice: 'zimmer' };
const gruppenBild = g => F[GRUPPENBILD[g] || 'studio'] || F.studio;
const bild = (src, kl) => `<span class="${kl}" aria-hidden="true"><img src="${esc(src)}" alt="" width="900" height="675" decoding="async"></span>`;
const IMG = (src, kl) => `<span class="${kl}" aria-hidden="true"><img src="${esc(src)}" alt="" width="640" height="800" loading="lazy" decoding="async"></span>`;
/* Bühne je Ansicht: ein Foto der Agentur-Seite */
const SB_FOTO = { angebote: 'tafel', haeuser: 'empfang', preise: 'plan' };

const S = { ansicht: 'start', preise: null, haeuser: null, angebote: null, voll: {}, wahl: '', filter: 'alle', abt: 'alle', modus: 'blatt', pfilter: 'alle', E: null, letzteRueck: null };

/* ---------- Server ---------- */
async function api(methode, weg, daten) {
  let r;
  try {
    const vorab = methode === 'GET' && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];   // schon beim Laden der Seite geholt (index.html), nur einmal
    r = await (vorab || fetch(API + weg, { method: methode, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: daten ? JSON.stringify(daten) : undefined }));
  } catch (e) { throw new Error('VERBINDUNG · Keine Verbindung. Deine Eingabe ist noch da, bitte gleich noch einmal versuchen.'); }
  let d = {};
  try { d = await r.json(); } catch (e) { throw new Error('SERVER · Antwort nicht lesbar (' + r.status + ').'); }
  if (!r.ok) throw new Error(d.fehler ? 'SERVER · ' + d.fehler : ('SERVER · Fehler ' + r.status));
  return d;
}
function fehler(e) {
  const m = String((e && e.message) || e), st = (m.match(/^([A-ZÄÖÜ-]+) · /) || [])[1] || '';
  quit(m.replace(/^[A-ZÄÖÜ-]+ · /, ''), st ? 'Stichwort ' + st : '', [['Was tun?', () => window.open('pruefung.html#' + (st || 'SERVER'), '_blank', 'noopener')]], true, 12000);
}
function quit(titel, text, knoepfe = [], fehl = false, dauer = 7000) {
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text).replace(/\n/g, '<br>')}</span>` : ''}</div>`;
  knoepfe.forEach(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { f(); q.remove(); }; q.appendChild(b); });
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Schliessen'); x.innerHTML = ZU; x.onclick = () => q.remove(); q.appendChild(x);
  $('#meldung').appendChild(q);
  while ($('#meldung').children.length > 3) $('#meldung').firstChild.remove();
  if (dauer) setTimeout(() => q.remove(), dauer);
}
/* Quittung jeder Änderung: vorher, nachher und «Rückgängig» (CLAUDE.md: nie still speichern) */
function quittung(titel, vorher, nachher, rueck) {
  quit(titel, `Vorher: ${vorher || '–'}\nNachher: ${nachher || '–'}`, rueck ? [['Rückgängig', async () => {
    try { await api(rueck.methode, rueck.weg, rueck.daten); if (rueck.nach) await rueck.nach(); quit('Rückgängig gemacht', titel, [], false, 4000); } catch (e) { fehler(e); }
  }]] : [], false, 15000);
}
const zahl = n => new Intl.NumberFormat('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
const geld = (n, w) => w === 'CHF' ? zahl(n) + ' CHF' : zahl(n) + ' €';
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const datumLang = iso => { if (!iso) return ''; const [j, m, t] = iso.split('-').map(Number); return `${t}. ${MONATE[m - 1]} ${j}`; };
const datumKurz = iso => { if (!iso) return ''; const [j, m, t] = iso.split('-'); return `${t}.${m}.${j}`; };
const isoHeute = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const isoPlus = (iso, tage) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + tage); return d.toISOString().slice(0, 10); };
const tageBis = iso => { if (!iso) return null; return Math.round((new Date(iso + 'T12:00:00') - new Date(isoHeute() + 'T12:00:00')) / 864e5); };
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;
const hausVon = id => (S.haeuser || []).find(h => h.id === id) || null;
function position(id) { for (const g of S.preise.gruppen) for (const p of g.positionen) if (p.id === id) return { ...p, gruppe: g.id, gruppeName: g.name }; return null; }
/* Stand eines Angebots nach seiner Gültigkeit */
const stand = a => { const t = tageBis(a.gueltig_bis); return t == null ? 'gueltig' : t < 0 ? 'abgelaufen' : t <= 7 ? 'bald' : 'gueltig'; };
const STAND_T = { gueltig: 'Gültig', bald: 'Läuft bald ab', abgelaufen: 'Abgelaufen' };
function summenTeile(s) {
  if (!s || !s.betraege) return [];
  const teile = [];
  for (const [schl, wert] of Object.entries(s.betraege)) { const [w, art] = schl.split(' '); teile.push(geld(wert, w) + (art === 'monatlich' ? ' im Monat' : '')); }
  if (s.ohne_preis) teile.push(`${s.ohne_preis} ohne Preis`);
  return teile;
}
/* Summe als ein Satz; für Karten einzeln als Glieder, damit die Zeile am Handy umbrechen kann */
const summenText = s => summenTeile(s).join(' · ');
const ohnePreis = () => { const l = []; for (const g of S.preise.gruppen) for (const p of g.positionen) if (p.preis == null && !p.spanne && p.art !== 'enthalten') l.push({ ...p, gruppe: g.id, gruppeName: g.name }); return l; };

/* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
const TITEL = { start: 'Übersicht', angebote: 'Angebote', haeuser: 'Häuser', preise: 'Preise' };
const WEGE = { anleitung: 'anleitung.html', pruefung: 'pruefung.html' };
/* Knöpfe in Startbild und Bühne im Stil des Pakets (gleiche Ids und data-Attribute), wie in der Vorlage */
const woKn = h => String(h || '').replace(/class="kn kn--(gold|linie)( glanz-kn)?"/g, (m, a) => `class="wo-kn wo-kn--${a === 'gold' ? 'gold' : 'hell'}"`)
  .replace(/class="kn"/g, 'class="wo-kn wo-kn--hell"').replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>)([^<]+)<i>/g, '$1<span>$2</span><i>')
  .replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>(?:(?!<\/(?:a|button)>).)*?<i>)<svg (?![^>]*class=)/g, '$1<svg class="wo-ic" ');
const baldZahl = () => (S.angebote || []).filter(a => stand(a) === 'bald').length;
function kopfLeiste() {
  const n = baldZahl();
  $('#kopf').innerHTML = WO.kopf({ werkzeug: '05-angebot', unter: 'Angebote', titel: TITEL[S.ansicht] || WO.name('05-angebot'),
    stand: n ? mal(n, 'Eines läuft bald ab', 'laufen bald ab') : mal((S.angebote || []).length, 'Ein Angebot', 'Angebote'),
    pruefung: WEGE.pruefung, anleitung: WEGE.anleitung, website: (WO_HAUS.wege || {}).website || '/zentrale/seite/index.html', marke: 'data-gehe="start"' });
  const r = $('#kopf .wo-kopf__r');
  if (r) r.insertAdjacentHTML('afterbegin', WO.knopf('Neues Angebot', 'plus', 'hell', { id: 'k-neu', klein: true }) + '<span class="wo-trenn"></span>');
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
  const kn = $('#k-neu'); if (kn) kn.onclick = neuFenster;
}
function rand() {
  const an = S.ansicht;
  const e = (key, text, zahl = 0) => ({ text, zahl, an: an === key, attr: `data-gehe="${key}"` });
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('start', 'Übersicht')] },
    { titel: 'Für Robert und Anna', eintraege: [e('angebote', 'Angebote', baldZahl()), e('haeuser', 'Häuser'), e('preise', 'Preise', S.preise ? ohnePreis().length : 0)] }], WEGE);
  const w = $('#rand .wo-rand__wege'), pf = WO.ic('pfeil');
  if (w) {   // Wege: die Preise in den Grundlagen stehen in Angebot.md; dazu die Zentrale und «Neues Angebot» fürs Handy
    w.insertAdjacentHTML('beforeend', `<a href="${esc((WO_HAUS.wege || {}).zentrale || '/zentrale/')}">${esc(WO.name('zentrale'))}${pf}</a><button class="wo-rand__probe" type="button" data-neu>Neues Angebot${WO.ic('plus')}</button>`);
  }
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  $$('#rand [data-neu]').forEach(b => b.onclick = neuFenster);
  kopfLeiste();
}
/* Leiste unten: Speichern grau (nichts offen), gelb (Änderung wartet), grün (gespeichert) */
function leiste() {
  const E = S.E, wartet = !!(E && E.geaendert), neu = E && !E.nummer;
  const titel = !E ? (S.angebote && S.angebote.length ? mal(S.angebote.length, 'Ein Angebot', 'Angebote') + ' gespeichert' : 'Noch kein Angebot')
    : wartet ? (neu ? 'Neues Angebot wartet' : E.nummer + ': Änderung wartet') : neu ? 'Neues Angebot, noch leer' : E.nummer + ' ist gespeichert';
  const satz = !E ? 'Ein Angebot entsteht über «Neues Angebot» oder in einem Haus.' + (S.preise ? ' Preise aus den Grundlagen, Stand ' + datumKurz(S.preise.stand) + '.' : '')
    : wartet ? 'Noch nicht gespeichert. Erst «Speichern» legt es mit Nummer im Verlauf des Hauses ab.' : (hausVon(E.haus_id) || {}).name ? 'Für ' + hausVon(E.haus_id).name + ', gültig bis ' + (datumKurz(E.gueltig_bis) || 'offen') + '.' : '';
  $('#leiste').innerHTML = WO.leiste({ titel, satz,
    knoepfe: WO.knopf('Neues Angebot', 'plus', 'glas', { id: 'l-neu', klein: true }) +
      (wartet ? WO.knopf('Speichern', 'haken', 'wartet', { id: 'l-speichern', klein: true }) : E && E.nummer ? WO.knopf('Gespeichert', 'haken', 'fertig', { id: 'l-speichern', klein: true, disabled: true }) : WO.knopf('Speichern', 'haken', 'glas', { id: 'l-speichern', klein: true, disabled: true })) });
  $('#l-neu').onclick = neuFenster;
  const sp = $('#l-speichern'); if (sp && wartet) sp.onclick = speichern;
}
function kopf(mono, titel, satz, knoepfe = '', foto = '') {   // Bühne jeder Ansicht = Startbild «buehne» des Pakets mit dem Foto der Ansicht
  return WO.startbild({ werkzeug: '05-angebot', art: 'buehne', zier: esc(WO.name('05-angebot') + ' · ' + mono), h1: titel, satz, knoepfe: woKn(knoepfe),
    foto: foto || F[SB_FOTO[S.ansicht]] || F.tafel });
}
function gehe(ziel, wahl = '') {
  if (S.E && S.E.geaendert && ziel === 'angebote' && wahl && wahl !== S.wahl) return fragen(() => gehe(ziel, wahl));
  if (ziel === 'angebote' && S.ansicht === 'angebote' && wahl && $('#detail')) {   // im Eingang nur das Angebot wechseln, die Liste bleibt stehen
    return waehle(wahl).then(() => {
      $$('.re-a.aktiv').forEach(k => k.classList.remove('aktiv'));
      const k = $(`.re-a[data-wahl="${CSS.escape(wahl)}"]`); if (k) k.classList.add('aktiv');
      ruhigTauschen($('#detail'), detail()); verbindeDetail();
      if (innerWidth <= 1180) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(fehler);
  }
  S.ansicht = ziel; if (ziel === 'angebote' && wahl) S.wahl = wahl; if (ziel === 'preise') S.pfilter = wahl === 'fehlt' ? 'fehlt' : 'alle'; if (ziel === 'haeuser') S.wahlHaus = wahl;
  if (ziel === 'angebote' && wahl === '' && S.E && !S.E.nummer) S.wahl = 'neu';
  try { localStorage.setItem('angebot-ansicht', ziel); } catch (e) { /* privat */ }
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', location.pathname + location.search + '#' + ziel);
  rand(); leiste(); zeichne(); window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
async function ladeAlles(neu = false) {
  if (!S.preise) S.preise = await api('GET', 'preise');
  if (!S.haeuser || neu) S.haeuser = await api('GET', 'haeuser');
  if (!S.angebote || neu) S.angebote = await api('GET', 'angebote');
}
async function frisch(neu = false) {
  try { await ladeAlles(true); S.voll = {}; rand(); leiste(); await zeichne(); if (neu) quit('Neu geladen', '', [], false, 2500); } catch (e) { fehler(e); }
}

/* ---------- Ansichten ---------- */
async function zeichne() {
  const el = $('#ansicht');
  try {
    await ladeAlles();
    if (S.ansicht === 'start') el.innerHTML = start();
    else if (S.ansicht === 'angebote') { if (S.wahl && S.wahl !== 'neu' && !S.voll[S.wahl]) await waehle(S.wahl); el.innerHTML = eingang(); verbindeEingang(); }
    else if (S.ansicht === 'haeuser') { el.innerHTML = haeuserS(); verbindeHaeuser(); }
    else if (S.ansicht === 'preise') { el.innerHTML = preiseS(); }
    $$('#ansicht [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || ''));
    $$('#ansicht [data-neu]').forEach(b => b.onclick = () => neuFenster(b.dataset.neu || ''));
    $$('#ansicht .re-n').forEach((x, i) => { x.classList.add('re-auf'); x.style.setProperty('--i', Math.min(i, 12)); });
  } catch (e) { fehler(e); }
}

function start() {
  const A = S.angebote, bald = A.filter(a => stand(a) === 'bald'), fehlt = ohnePreis(), gruss = WO.gruss();
  const neueste = A.slice(0, 4);
  return WO.startbild({ werkzeug: '05-angebot', art: 'voll', foto: F.tafel, h1: `${gruss} <em>Wem schreiben wir ein Angebot?</em>`,
    satz: 'Hier entsteht ein fertiges Angebot für ein Haus in Minuten statt Stunden: Haus wählen, Umfang anklicken, die Preise kommen aus den Grundlagen. Jedes Angebot bekommt eine Nummer, ein Datum und eine Gültigkeit, liegt im Verlauf des Hauses und lässt sich als PDF speichern. Verschickt wird hier nichts.',
    knoepfe: WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) }) +
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('blatt')}</i><span class="wo-mk">Angebote</span><b>${A.length ? mal(A.length, 'Ein Angebot', 'Angebote') : 'Noch keines'}</b><p>${A.length ? 'Für ' + mal(new Set(A.map(a => a.haus_id)).size, 'ein Haus', 'Häuser') + '. Zuletzt am ' + datumKurz(A[0].datum) + '.' : 'Sobald ein Angebot gespeichert ist, steht es hier.'}</p><button class="wo-lk" type="button" data-gehe="angebote">Alle Angebote</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Läuft bald ab</span><b>${bald.length ? mal(bald.length, 'Ein Angebot', 'Angebote') : 'Keines'}</b><p>${bald.length ? 'Gültig nur noch bis ' + datumKurz(bald[0].gueltig_bis) + '. Nachfragen oder verlängern.' : 'Kein Angebot läuft in den nächsten sieben Tagen ab.'}</p><button class="wo-lk" type="button" data-gehe="angebote"${bald.length ? ` data-wahl="${esc(bald[0].nummer)}"` : ''}>${bald.length ? 'Ansehen' : 'Zu den Angeboten'}</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('suche')}</i><span class="wo-mk">Preise</span><b>${fehlt.length ? mal(fehlt.length, 'Ein Preis fehlt', 'Preise fehlen') : 'Alle Preise da'}</b><p>Aus den Grundlagen, Stand ${datumKurz(S.preise.stand)}. Was fehlt, bleibt im Angebot leer und ist markiert.</p><button class="wo-lk" type="button" data-gehe="preise"${fehlt.length ? ' data-wahl="fehlt"' : ''}>Preise ansehen</button></div>
    </div>
    ${S.haeuser.length ? haeuserKacheln() : ''}
    <div class="re-start">
      <section class="re-start__sp"><h2 class="wo-zw">Zuletzt <em>geschrieben</em></h2>
        ${neueste.length ? `<div class="re-liste">${neueste.map((a, i) => karteAngebot(a, i + 1)).join('')}</div><button class="link re-mehr" type="button" data-gehe="angebote">Alle ${A.length} Angebote</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Angebot.</b><p>Über «Neues Angebot» ein Haus wählen, den Umfang anklicken und speichern.</p></div>`}
      </section>
      <section class="re-start__sp"><h2 class="wo-zw">Preis <em>fehlt</em></h2>
        ${fehlt.length ? `<div class="re-liste re-qliste">${fehlt.slice(0, 4).map(preisKarte).join('')}</div><button class="link re-mehr" type="button" data-gehe="preise" data-wahl="fehlt">Alle ${fehlt.length} ohne Preis</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Kein Preis fehlt.</b><p>Jede Position in den Grundlagen hat einen Preis.</p></div>`}
      </section>
    </div>`;
}
/* Die Häuser als Kacheln mit Foto (wo-aufg des Pakets), wie viele Angebote je Haus */
function haeuserKacheln() {
  const Z = { hotel: 'haus', gasthaus: 'karte', bar: 'chat', landhaus: 'blatt' };
  return `<h2 class="wo-zw">Nach <em>Haus</em></h2><div class="wo-aufg">${S.haeuser.slice(0, 4).map(h => { const l = S.angebote.filter(a => a.haus_id === h.id), g = l.filter(a => stand(a) !== 'abgelaufen').length;
    return `<button class="wo-ag" type="button" data-gehe="haeuser" data-wahl="${esc(h.id)}"><span class="wo-ag__b"><img src="${esc(hausBild(h))}" alt="" width="900" height="675" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(Z[String(h.art || '').toLowerCase()] || 'haus')}</i><b>${esc(h.name)}</b><span>${l.length ? mal(l.length, 'ein Angebot', 'Angebote') + (g ? ' · ' + g + ' gültig' : '') : 'noch keines'}</span></span></button>`; }).join('')}</div>`;
}
function preisKarte(p) {
  return `<button class="re-a re-q re-q--offen" type="button" data-gehe="preise" data-wahl="fehlt">
    <span class="re-a__bild" aria-hidden="true"><img src="${esc(gruppenBild(p.gruppe))}" alt="" width="900" height="675" decoding="async"></span>
    <span class="re-a__n"><span class="re-a__k"><i class="re-q__sp">${esc(p.waehrung || 'EUR')}</i>${esc(p.gruppeName)}</span><b>${esc(p.name)}</b><small>${esc(p.kurz || '')}</small></span>
    <span class="re-a__st">Preis fehlt<small>${esc(p.art === 'monatlich' ? 'monatlich' : 'einmalig')}</small></span></button>`;
}

/* ---------- Angebote (wie der Eingang der Vorlage) ---------- */
function glieder(l) { return l.filter(Boolean).map(x => `<span class="re-gl">${x}</span>`).join(''); }
function karteAngebot(a, i = 0) {
  const st = stand(a), h = hausVon(a.haus_id) || { id: a.haus_id, name: a.haus_name };
  return `<button class="re-a${st === 'bald' ? ' neu' : ''}${st === 'abgelaufen' ? ' erledigt' : ''}${S.wahl === a.nummer && S.ansicht === 'angebote' ? ' aktiv' : ''}" style="--i:${i}" type="button" data-gehe="angebote" data-wahl="${esc(a.nummer)}">
    ${bild(hausBild(h), 're-a__bild')}
    <span class="re-a__n"><span class="re-a__k re-gl-r">${glieder([esc(a.nummer), esc(datumKurz(a.datum)), esc(h.ort || '')])}</span><b>${esc(a.haus_name || h.name || 'Ohne Haus')}</b><small class="re-gl-r">${glieder([esc(a.untertitel || a.titel || ''), mal(a.positionen_anzahl, 'eine Position', 'Positionen')])}</small><em class="re-a__hinw re-gl-r">${glieder(summenTeile(a.summen).length ? summenTeile(a.summen).map(esc) : ['ohne Summe'])}</em></span>
    <span class="re-a__st">${STAND_T[st]}</span></button>`;
}
function karteNeu() {
  const h = hausVon(S.E.haus_id) || {};
  return `<button class="re-a neu${S.wahl === 'neu' ? ' aktiv' : ''}" type="button" data-gehe="angebote" data-wahl="neu">
    ${bild(hausBild(h), 're-a__bild')}
    <span class="re-a__n"><span class="re-a__k re-gl-r">${glieder(['Neu', esc(datumKurz(S.E.datum))])}</span><b>${esc(h.name || 'Neues Angebot')}</b><small>Noch ohne Nummer</small></span>
    <span class="re-a__st">Ungespeichert</span></button>`;
}
function monatVon(iso) { const t = tageBis(iso); if (t != null && t > -7) return 'Diese Woche'; const [j, m] = String(iso || '').split('-').map(Number); return j ? MONATE[m - 1] + ' ' + j : 'Früher'; }
function eingang() {
  const jede = S.angebote, f = S.filter, alle = S.abt === 'alle' ? jede : jede.filter(a => a.haus_id === S.abt);
  const l = f === 'alle' ? alle : alle.filter(a => stand(a) === f);
  const neu = S.E && !S.E.nummer && (S.abt === 'alle' || S.E.haus_id === S.abt);
  if ((!S.wahl || (S.wahl !== 'neu' && !l.some(a => a.nummer === S.wahl)) || (S.wahl === 'neu' && !neu)) && l.length) { S.wahl = l[0].nummer; if (!S.voll[S.wahl]) { waehle(S.wahl).then(() => { zeichne(); }); return ''; } setzeE(S.voll[S.wahl]); }
  else if (S.wahl === 'neu' && !neu) S.wahl = '';
  const gruppen = []; l.forEach(x => { const t = monatVon(x.datum); const g = gruppen.find(y => y.t === t); g ? g.l.push(x) : gruppen.push({ t, l: [x] }); });
  let n = 0;
  const zahlF = k => k === 'alle' ? alle.length : alle.filter(a => stand(a) === k).length;
  const gueltigIn = id => jede.filter(a => stand(a) !== 'abgelaufen' && (id === 'alle' || a.haus_id === id)).length;
  const hatDetail = S.wahl && (S.wahl === 'neu' ? neu : !!S.voll[S.wahl]);
  return kopf('Angebote', 'Angebote <em>für die Häuser.</em>',
    'Jedes Angebot mit Nummer, Datum und Gültigkeit, nach Haus geordnet. Links wählen, rechts stehen Haus, Summe und Hinweise, darunter das Angebot selbst: als Blatt so, wie es als PDF herauskommt, oder als Liste zum Anklicken mit den Preisen aus den Grundlagen. Gespeichert wird nur, was du selbst speicherst.',
    `<button class="kn kn--gold" type="button" data-neu="">Neues Angebot<i>${SYM.plus}</i></button>`) +
    (jede.length || neu ? `<div class="re-eingang"><div class="re-spalte">
        <div class="re-abt" role="group" aria-label="Haus">${[['alle', 'Alle', 'Jedes Haus']].concat(S.haeuser.map(h => [h.id, h.name.replace(/^(Gasthaus|Hotel|Bar|Landhaus) /, ''), h.name])).map(([k, t, s]) => `<button type="button" data-abt="${esc(k)}" aria-pressed="${S.abt === k}" title="${esc(s)}"><span>${esc(t)}</span><i${gueltigIn(k) ? ' class="da"' : ''}>${gueltigIn(k)}</i></button>`).join('')}</div>
        <div class="wahl2 re-filter" role="group" aria-label="Auswahl">${[['alle', 'Alle'], ['gueltig', 'Gültig'], ['bald', 'Bald'], ['abgelaufen', 'Vorbei']].map(([k, t]) => `<button type="button" data-filter="${k}" aria-pressed="${f === k}">${t}<i>${zahlF(k)}</i></button>`).join('')}</div>
        <div class="re-liste">${neu ? `<p class="re-tag"><span>In Arbeit</span></p>${karteNeu()}` : ''}${gruppen.map(g => `<p class="re-tag"><span>${esc(g.t)}</span></p>${g.l.map(x => karteAngebot(x, n++)).join('')}`).join('') || (neu ? '' : '<p class="re-tag"><span>Nichts in dieser Auswahl</span></p>')}</div></div>
        <div class="re-detail" id="detail">${hatDetail ? detail() : ''}</div></div>`
      : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Angebot.</b><p>Über «Neues Angebot» ein Haus wählen, den Umfang anklicken und speichern. Dann steht es hier, mit Nummer und Verlauf.</p></div>`);
}
/* Das gewählte Angebot laden und zum Bearbeiten bereitlegen */
async function waehle(nr) {
  if (nr === 'neu') { S.wahl = 'neu'; return; }
  if (!S.voll[nr]) S.voll[nr] = await api('GET', 'angebote/' + encodeURIComponent(nr));
  S.wahl = nr; setzeE(S.voll[nr]);
}
function setzeE(a) {
  if (S.E && S.E.nummer === a.nummer && S.E.geaendert) return;
  const gew = {}; for (const p of a.positionen || []) gew[p.id] = { menge: p.menge || 1, preis_hand: p.von_hand ? p.preis : null };
  S.E = { nummer: a.nummer, haus_id: a.haus_id, datum: a.datum || '', gueltig_bis: a.gueltig_bis || '', titel: a.titel || 'Angebot', untertitel: a.untertitel || '',
    einleitung: a.einleitung || '', schluss: a.schluss || '', gewaehlt: gew, angelegt: a.angelegt || '', von: a.von || '', geaendert: false };
  leiste();
}
function neuesE(hausId) {
  const h = hausVon(hausId);
  S.E = { nummer: '', haus_id: hausId, datum: isoHeute(), gueltig_bis: isoPlus(isoHeute(), 30), titel: 'Angebot', untertitel: '',
    einleitung: h ? `Danke für das Gespräch. Hier steht, was Tasty Studios für ${h.name} baut, was es kostet und wie es weitergeht.` : '',
    schluss: h && h.anrede === 'sie' ? 'Wenn das passt, besprechen wir als Nächstes den Zeitplan. Melden Sie sich einfach.' : 'Wenn das passt, besprechen wir als Nächstes den Zeitplan. Melde dich einfach.',
    gewaehlt: {}, angelegt: '', von: WER, geaendert: false };
  S.wahl = 'neu'; S.modus = 'umfang';
}
function untertitelAuto(E) {
  const namen = [];
  for (const g of S.preise.gruppen) if (g.positionen.some(p => E.gewaehlt[p.id])) namen.push(g.name);
  if (!namen.length) return '';
  return namen.length === 1 ? namen[0] : namen.slice(0, -1).join(', ') + ' und ' + namen[namen.length - 1];
}
function positionenAusgewaehlt(E) {
  const liste = [];
  for (const g of S.preise.gruppen) for (const p of g.positionen) {
    const w = E.gewaehlt[p.id]; if (!w) continue;
    const hand = w.preis_hand != null && w.preis_hand !== '';
    liste.push({ id: p.id, gruppe: g.id, name: p.name, text: p.text, waehrung: p.waehrung, art: p.art, einheit: p.einheit || '', spanne: p.spanne || null, quelle: p.quelle,
      preis: hand ? Number(w.preis_hand) : (p.preis ?? null), menge: p.menge ? (Number(w.menge) || 1) : 1, von_hand: hand });
  }
  return liste;
}
function angebotAus(E) {
  const h = hausVon(E.haus_id);
  return { haus_id: E.haus_id, haus: h ? { ...h } : null, datum: E.datum, gueltig_bis: E.gueltig_bis, nummer: E.nummer,
    titel: (E.titel || '').trim() || 'Angebot', untertitel: (E.untertitel || '').trim() || untertitelAuto(E),
    einleitung: (E.einleitung || '').trim(), schluss: (E.schluss || '').trim(), positionen: positionenAusgewaehlt(E), von: E.von || WER, angelegt: E.angelegt || undefined };
}
function summen(positionen) {
  const s = {}; let offen = 0, spannen = 0;
  for (const p of positionen) {
    if (p.art === 'enthalten') continue;
    if (p.preis == null) { if (p.spanne) spannen++; else offen++; continue; }
    const k = p.waehrung + ' ' + p.art; s[k] = (s[k] || 0) + p.preis * (p.menge || 1);
  }
  return { betraege: s, ohne_preis: offen, spannen };
}
function warnungen(a) {
  const s = summen(a.positionen), w = [];
  if (s.ohne_preis) w.push(['allergie', `${mal(s.ohne_preis, 'Eine Position hat', 'Positionen haben')} keinen Preis in den Grundlagen. Im Angebot steht dann «wird nach dem Gespräch festgelegt».`]);
  if (s.spannen) w.push(['termin', `${mal(s.spannen, 'Eine Position hat', 'Positionen haben')} nur eine Preisspanne. Betrag für dieses Angebot unter «Umfang und Text» eintragen.`]);
  const waehr = new Set(a.positionen.filter(p => p.art !== 'enthalten' && p.preis != null).map(p => p.waehrung));
  if (a.haus && waehr.size && !waehr.has(a.haus.waehrung)) w.push(['gruppe', `Das Haus rechnet in ${a.haus.waehrung}, die Preise liegen nur in ${[...waehr].join(' und ')} vor.`]);
  else if (waehr.size > 1) w.push(['gruppe', 'Euro und Franken sind gemischt.']);
  for (const p of a.positionen) if (p.von_hand && p.spanne && (p.preis < p.spanne[0] || p.preis > p.spanne[1])) w.push(['ticket', `${p.name}: Betrag ${geld(p.preis, p.waehrung)} liegt ausserhalb der Spanne ${zahl(p.spanne[0])} bis ${zahl(p.spanne[1])}.`]);
  const t = tageBis(a.gueltig_bis); if (a.nummer && t != null && t < 0) w.push(['ruhetag', 'Die Gültigkeit ist abgelaufen.']); else if (a.nummer && t != null && t <= 7) w.push(['ruhetag', `Läuft ${t === 0 ? 'heute' : t === 1 ? 'morgen' : 'in ' + t + ' Tagen'} ab.`]);
  return w;
}
const HINW_ZEICHEN = { ruhetag: 'uhr', termin: 'uhr', gruppe: 'person', allergie: 'blatt', ticket: 'karte' };
function detail() {
  const E = S.E; if (!E) return '';
  const a = angebotAus(E), h = a.haus || {}, s = summen(a.positionen), w = warnungen(a), um = S.modus === 'umfang';
  const betraege = Object.entries(s.betraege);
  return `<section class="re-d re-auf" style="--i:0">
      <div class="re-d__kopf">${bild(hausBild(h), 're-d__bild')}
        <div class="re-d__n"><span class="re-d__k re-gl-r">${glieder([E.nummer ? 'Angebot ' + esc(E.nummer) : 'Neues Angebot', esc(datumKurz(E.datum)), E.von ? 'von ' + esc(E.von) : ''])}</span><h2>${esc(h.name || 'Ohne Haus')}</h2></div>
        <div class="re-d__kn">${E.nummer ? `<button class="rund" type="button" data-akt="weg" data-tip="Löschen" aria-label="Angebot löschen">${SYM.korb}</button>` : ''}
        <button class="kn kn--klein kn--gold" type="button" data-akt="haus">Haus ändern<i>${SYM.stift}</i></button></div></div>
      <p class="re-woher mono">${glieder([esc(h.art || 'Haus'), esc([h.plz, h.ort].filter(Boolean).join(' ')), esc(h.land || ''), h.waehrung === 'CHF' ? 'Preise in Franken' : 'Preise in Euro', h.anrede === 'sie' ? 'per Sie' : 'per Du'])}</p>
      <dl class="re-angaben re-angaben--wann re-angaben--drei"><div><dt>Nummer</dt><dd>${esc(E.nummer || 'beim Speichern')}</dd></div><div><dt>Datum</dt><dd>${esc(datumKurz(E.datum) || 'offen')}</dd></div><div><dt>Gültig bis</dt><dd>${esc(datumKurz(E.gueltig_bis) || 'offen')}</dd></div></dl>
      <dl class="re-angaben re-angaben--gast"><div><dt>Mail</dt><dd><span class="re-mail">${esc(h.mail || 'nicht eingetragen')}</span></dd></div><div><dt>Ansprechperson</dt><dd>${esc(h.ansprech || 'nicht eingetragen')}</dd></div><div><dt>Umfang</dt><dd>${esc(mal(a.positionen.length, 'eine Position', 'Positionen'))}</dd></div></dl>
      ${w.length ? `<ul class="re-hinw" aria-label="Hinweise">${w.map(([art, t]) => `<li class="re-hinw__p re-hinw--${art}">${WO.ic(HINW_ZEICHEN[art] || 'blatt')}<span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
      <div class="re-zus${betraege.length ? ' re-zus--fest' : ''}"><div class="re-zus__t"><span class="mono">Summe, netto</span>${betraege.length ? betraege.map(([k, v]) => { const [wa, art] = k.split(' '); return `<b>${esc(geld(v, wa))}${art === 'monatlich' ? ' im Monat' : ' einmalig'}</b>`; }).join('') : '<b>Noch keine</b>'}<p>${s.spannen || s.ohne_preis ? 'Ohne die Positionen mit Spanne oder ohne Preis.' : 'Zuzüglich der gesetzlichen Mehrwertsteuer.'}</p></div>
        <div class="re-zus__kn"><button class="kn kn--klein kn--linie" type="button" data-akt="umfang">Umfang ändern<i>${SYM.stift}</i></button></div></div>
      ${h.notiz ? `<blockquote class="re-anliegen">${esc(h.notiz)}</blockquote>` : ''}
      <details class="re-gespraech"><summary><span>Verlauf dieses Hauses</span><i>${mal(S.angebote.filter(x => x.haus_id === E.haus_id).length, 'ein Angebot', 'Angebote')}</i></summary><div class="re-gespraech__l">${S.angebote.filter(x => x.haus_id === E.haus_id).map(x => `<p class="haus"><small>${esc(x.nummer)} · ${esc(datumKurz(x.datum))} · ${esc(STAND_T[stand(x)])}</small>${esc(summenText(x.summen) || 'ohne Summe')} <button class="link" type="button" data-gehe="angebote" data-wahl="${esc(x.nummer)}">Öffnen</button></p>`).join('') || '<p class="haus">Noch kein gespeichertes Angebot.</p>'}</div></details>
    </section>
    <section class="re-post re-auf" style="--i:1">
      <div class="re-post__kopf"><div><span class="mono">Für ${esc(h.name || 'das Haus')}</span><h2>Das <em>Angebot</em></h2></div>
        <div class="wahl2 re-modus" role="group" aria-label="Ansicht"><button type="button" data-akt="blatt" aria-pressed="${!um}">Blatt</button><button type="button" data-akt="umfang" aria-pressed="${um}">Umfang und Text</button></div></div>
      ${um ? umfangBrief(E) : `<div class="gs-flaeche an-flaeche"><p class="gs-hinweis"><span>So kommt es als PDF heraus: A4, Montserrat, Deckblatt mit dem Tasty-Logo.</span><span class="gs-werk__stand">${E.geaendert ? 'Wartet' : E.nummer ? 'Gespeichert' : 'Neu'}</span></p><div class="an-blatt" id="blattRahmen"><div class="dokument" id="dokument"></div></div></div>`}
      <div class="re-post__unten">
        <aside class="re-notiz">
          <span class="mono">Vor dem Speichern</span>
          <b>${!a.positionen.length ? 'Noch nichts ausgewählt' : s.ohne_preis || s.spannen ? mal(s.ohne_preis + s.spannen, 'Eine Stelle', 'Stellen') + ' ' + (s.ohne_preis + s.spannen === 1 ? 'ist' : 'sind') + ' offen' : 'Das Angebot ist vollständig'}</b>
          <p>${!a.positionen.length ? 'Unter «Umfang und Text» anklicken, was ins Angebot soll.' : s.ohne_preis || s.spannen ? 'Positionen ohne festen Preis stehen im Angebot mit «wird nach dem Gespräch festgelegt». Einen Betrag nur nach Roberts Wort eintragen.' : 'Lies es einmal durch. Danach speichern und als PDF sichern.'}</p>
          ${w.length ? `<ul>${w.map(([, t]) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        </aside>
        <div class="re-post__kn">
          <button class="kn kn--gold" type="button" data-akt="pdf">Als PDF speichern<i>${SYM.post}</i></button>
          <button class="kn" type="button" data-akt="speichern"${E.geaendert ? '' : ' disabled'}>${E.geaendert ? 'Speichern' : E.nummer ? 'Gespeichert' : 'Speichern'}<i>${SYM.haken}</i></button>
          ${E.geaendert && E.nummer ? '<button class="link" type="button" data-akt="verwerfen">Änderung verwerfen</button>' : ''}
          <p class="re-hinweis">«Als PDF speichern» öffnet das Druckfenster: dort «Als PDF sichern» wählen und die Ränder auf «Keine» stellen, das Blatt bringt die 2,54 cm selbst mit. Verschickt wird hier nichts, und es öffnet sich kein Mailprogramm.</p>
        </div>
      </div>
    </section>`;
}
/* «Umfang und Text»: Daten, Texte und die Positionen aus der Preisdatei zum Anklicken, auf dem Briefpapier der Vorlage */
function preisText(p, w) {
  const hand = w && w.preis_hand != null && w.preis_hand !== '';
  if (hand) return geld(Number(w.preis_hand), p.waehrung) + (p.art === 'monatlich' ? ' im Monat' : '') + (p.einheit ? ' ' + p.einheit : '');
  if (p.art === 'enthalten') return 'in der Betreuung';
  if (p.preis == null && p.spanne) return `${zahl(p.spanne[0])} bis ${geld(p.spanne[1], p.waehrung)}${p.einheit ? ' ' + p.einheit : ''}`;
  if (p.preis == null) return 'Preis fehlt';
  return geld(p.preis, p.waehrung) + (p.art === 'monatlich' ? ' im Monat' : '') + (p.einheit ? ' ' + p.einheit : '');
}
function umfangBrief(E) {
  const feld = (id, t, wert, typ = 'text', extra = '') => `<label class="feld"><span>${t}</span><input id="u-${id}" type="${typ}" value="${esc(wert)}"${extra}></label>`;
  return `<article class="brief brief--bearb an-umfang">
    <div class="an-felder an-felder--drei">${feld('datum', 'Datum', E.datum, 'date')}${feld('gueltig', 'Gültig bis', E.gueltig_bis, 'date')}${feld('titel', 'Titel', E.titel)}</div>
    ${feld('untertitel', 'Untertitel', E.untertitel, 'text', ` placeholder="${esc(untertitelAuto(E) || 'wird aus dem Umfang gebildet')}"`)}
    <label class="feld"><span>Einleitung</span><textarea id="u-einleitung" rows="3">${esc(E.einleitung)}</textarea></label>
    <label class="feld"><span>Schluss</span><textarea id="u-schluss" rows="2">${esc(E.schluss)}</textarea></label>
    <p class="an-umfang__k mono">Umfang · Preise aus den Grundlagen, Stand ${esc(datumKurz(S.preise.stand))}, netto</p>
    ${S.preise.gruppen.map(g => `<details class="an-gr"${g.positionen.some(p => E.gewaehlt[p.id]) || g.id === 'website' ? ' open' : ''}><summary><b>${esc(g.name)}</b><small>${mal(g.positionen.filter(p => E.gewaehlt[p.id]).length, 'eine gewählt', 'gewählt')}</small></summary>${g.hinweis ? `<p class="an-gr__h">${esc(g.hinweis)}</p>` : ''}` + g.positionen.map(p => {
      const w = E.gewaehlt[p.id], brauchtBetrag = p.preis == null && p.art !== 'enthalten';
      const fehlt = brauchtBetrag && !(w && w.preis_hand != null && w.preis_hand !== '');
      return `<label class="an-pos${w ? ' gewaehlt' : ''}${fehlt ? ' fehlt' : ''}" data-id="${esc(p.id)}">
        <input type="checkbox"${w ? ' checked' : ''}>
        <span class="an-pos__n"><b>${esc(p.name)}</b><small>${esc(p.kurz || '')}</small></span>
        <span class="an-pos__p">${esc(preisText(p, w))}</span>
        <span class="an-pos__mehr">
          ${p.menge ? `<span>Menge <input type="number" min="1" step="1" class="menge" value="${w ? w.menge : 1}"> ${esc(p.einheit || '')}</span>` : ''}
          ${brauchtBetrag ? `<span>Betrag für dieses Angebot <input type="number" min="0" step="0.01" class="hand" value="${w && w.preis_hand != null ? w.preis_hand : ''}" placeholder="${p.spanne ? zahl(p.spanne[0]) + ' bis ' + zahl(p.spanne[1]) : 'kein Preis'}"> ${p.waehrung === 'CHF' ? 'CHF' : '€'}</span>${p.spanne ? '' : '<em>Preis fehlt in den Grundlagen, Betrag nur nach Roberts Wort eintragen.</em>'}` : ''}
          <small>Woher: ${esc(p.quelle || '')}</small>
        </span>
      </label>`; }).join('') + '</details>').join('')}
  </article>`;
}
function verbindeEingang() {
  $$('.re-filter [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; zeichne(); });
  $$('.re-abt [data-abt]').forEach(b => b.onclick = () => { S.abt = b.dataset.abt; zeichne(); });
  verbindeDetail();
}
function verbindeDetail() {
  if (!S.E || !$('#detail')) return;
  $$('#detail [data-akt]').forEach(b => b.onclick = () => aktion(b.dataset.akt));
  $$('#detail [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || ''));
  if ($('#dokument')) { blatt(); }
  const u = $('.an-umfang'); if (!u) return;
  const E = S.E;
  const geaendert = () => { if (!E.geaendert) { E.geaendert = true; leiste(); const k = $('#detail [data-akt="speichern"]'); if (k) { k.disabled = false; k.firstChild.textContent = 'Speichern'; } } };
  [['datum', 'datum'], ['gueltig', 'gueltig_bis'], ['titel', 'titel'], ['untertitel', 'untertitel'], ['einleitung', 'einleitung'], ['schluss', 'schluss']].forEach(([id, k]) => {
    const el = $('#u-' + id); if (el) el.addEventListener('input', () => { E[k] = el.value; geaendert(); });
  });
  $$('textarea', u).forEach(t => { const hoch = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 4 + 'px'; }; t.addEventListener('input', hoch); hoch(); });
  u.addEventListener('change', e => {
    const lab = e.target.closest('.an-pos'); if (!lab) return;
    const id = lab.dataset.id, p = position(id);
    if (e.target.type === 'checkbox') { if (e.target.checked) E.gewaehlt[id] = E.gewaehlt[id] || { menge: 1, preis_hand: null }; else delete E.gewaehlt[id]; }
    else if (e.target.classList.contains('menge')) (E.gewaehlt[id] || (E.gewaehlt[id] = { menge: 1, preis_hand: null })).menge = Math.max(1, parseInt(e.target.value) || 1);
    else if (e.target.classList.contains('hand')) {
      const v = e.target.value.trim();
      if (v !== '' && p.spanne && (Number(v) < p.spanne[0] || Number(v) > p.spanne[1])) quit('Ausserhalb der Spanne', `Der Betrag liegt ausserhalb von ${zahl(p.spanne[0])} bis ${zahl(p.spanne[1])}. Er bleibt stehen, bitte prüfen.`, [], true, 6000);
      (E.gewaehlt[id] || (E.gewaehlt[id] = { menge: 1, preis_hand: null })).preis_hand = v === '' ? null : Number(v);
    }
    const w = E.gewaehlt[id], fehlt = p.preis == null && p.art !== 'enthalten' && !(w && w.preis_hand != null && w.preis_hand !== '');
    lab.classList.toggle('gewaehlt', !!w); lab.classList.toggle('fehlt', fehlt); lab.querySelector('.an-pos__p').textContent = preisText(p, w);
    const gr = lab.closest('.an-gr'); if (gr) gr.querySelector('summary small').textContent = mal($$('.an-pos.gewaehlt', gr).length, 'eine gewählt', 'gewählt');
    geaendert();
  });
  /* Klicks im Bereich «mehr» (Menge, Betrag, Quelle) schalten das Häkchen nicht um */
  u.addEventListener('click', e => { if (e.target.closest('.an-pos__mehr') && e.target.tagName !== 'INPUT') e.preventDefault(); });
}
/* Ruhig tauschen (aus der Vorlage): Scrollstand bleibt, die Fläche schrumpft nicht unter die alte Höhe, nichts blendet neu ein */
function ruhigTauschen(el, html) {
  const y = scrollY, h = el.offsetHeight;
  el.style.minHeight = h + 'px';
  el.innerHTML = html;
  $$('.re-auf', el).forEach(x => x.classList.add('still'));
  if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' });
  requestAnimationFrame(() => { if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' }); setTimeout(() => { el.style.minHeight = ''; }, 400); });
}
function neuDetail() { if ($('#detail')) { ruhigTauschen($('#detail'), detail()); verbindeDetail(); } }
async function aktion(akt) {
  const E = S.E;
  try {
    if (akt === 'blatt' || akt === 'umfang') { S.modus = akt; neuDetail(); if (akt === 'umfang' && innerWidth <= 1180) { const p = $('.re-post'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
    if (akt === 'speichern') return speichern();
    if (akt === 'pdf') return pdf();
    if (akt === 'haus') return hausFenster(hausVon(E.haus_id));
    if (akt === 'verwerfen') { E.geaendert = false; setzeE(S.voll[E.nummer]); neuDetail(); leiste(); return quit('Verworfen', 'Das Angebot steht wieder wie zuletzt gespeichert.', [], false, 3500); }
    if (akt === 'weg') return fenster(`<h2>Angebot <em>löschen?</em></h2><p>${esc(E.nummer)} für ${esc((hausVon(E.haus_id) || {}).name || 'dieses Haus')} wird aus dem Verlauf entfernt. Über die Quittung lässt es sich gleich danach zurückholen.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Behalten</button><button class="kn kn--gefahr" type="button" id="f-los">Löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try {
          const nr = E.nummer, r = await api('DELETE', 'angebote/' + encodeURIComponent(nr));
          delete S.voll[nr]; S.E = null; S.wahl = ''; await ladeAlles(true); rand(); leiste(); zeichne();
          quittung('Angebot ' + nr + ' gelöscht', angebotText(r.geloescht), 'kein Angebot', { methode: 'POST', weg: 'angebote', daten: r.geloescht, nach: async () => { await ladeAlles(true); S.wahl = nr; S.ansicht = 'angebote'; rand(); leiste(); zeichne(); } });
        } catch (e) { fehler(e); }
      });
  } catch (e) { fehler(e); }
}
const angebotText = a => a ? `${mal((a.positionen || []).length, 'eine Position', 'Positionen')}, ${summenText(a.summen) || 'ohne Summe'}, gültig bis ${datumKurz(a.gueltig_bis) || 'offen'}` : '';
async function speichern() {
  const E = S.E; if (!E) return;
  const a = angebotAus(E);
  if (!a.haus_id) return quit('Kein Haus', 'Zuerst ein Haus wählen oder anlegen.', [], true);
  if (!a.positionen.length) return quit('Noch nichts ausgewählt', 'Erst den Umfang anklicken, dann speichern.', [['Umfang', () => { S.modus = 'umfang'; neuDetail(); }]], true);
  try {
    if (E.nummer) {
      const r = await api('PUT', 'angebote/' + encodeURIComponent(E.nummer), a);
      S.voll[r.angebot.nummer] = r.angebot; E.geaendert = false; setzeE(r.angebot); await ladeAlles(true);
      quittung('Angebot ' + r.angebot.nummer + ' gespeichert', angebotText(r.vorher), angebotText(r.angebot), { methode: 'PUT', weg: 'angebote/' + encodeURIComponent(r.angebot.nummer), daten: r.vorher,
        nach: async () => { delete S.voll[r.angebot.nummer]; S.E = null; await ladeAlles(true); await waehle(r.angebot.nummer); rand(); leiste(); zeichne(); } });
    } else {
      const r = await api('POST', 'angebote', a);
      S.voll[r.angebot.nummer] = r.angebot; S.E = null; S.wahl = r.angebot.nummer; setzeE(r.angebot); await ladeAlles(true);
      quittung('Angebot ' + r.angebot.nummer + ' angelegt', 'kein Angebot', angebotText(r.angebot), { methode: 'DELETE', weg: 'angebote/' + encodeURIComponent(r.angebot.nummer),
        nach: async () => { delete S.voll[r.angebot.nummer]; S.E = null; S.wahl = ''; await ladeAlles(true); rand(); leiste(); zeichne(); } });
    }
    S.modus = 'blatt'; rand(); leiste(); if (S.ansicht === 'angebote') zeichne();
  } catch (e) { fehler(e); }
}
/* Wechsel mit wartender Änderung: nie still speichern, nie still verwerfen. Fragen. */
function fragen(weiter) {
  fenster(`<h2>Änderung <em>speichern?</em></h2><p>Am Angebot ${esc(S.E.nummer || 'für ' + ((hausVon(S.E.haus_id) || {}).name || 'das Haus'))} wartet eine Änderung, die noch nicht gespeichert ist.</p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Zurück</button><button class="kn kn--linie" type="button" id="f-weg">Verwerfen<i>${ZU}</i></button><button class="kn kn--gold" type="button" id="f-los">Speichern<i>${SYM.haken}</i></button></div>`, true, async () => { fensterZu(); await speichern(); if (S.E && !S.E.geaendert) weiter(); });
  $('#f-weg').onclick = () => { fensterZu(); const nr = S.E.nummer; S.E.geaendert = false; if (nr && S.voll[nr]) setzeE(S.voll[nr]); else S.E = null; leiste(); weiter(); };
}

/* ---------- Das Blatt (Tastyrob Document Taste, Fachdokument), aus der ersten Fassung ---------- */
function bloecke(a) {
  const h = a.haus || {}, b = [];
  const B = (cls, html, oben, unten, halten) => b.push({ cls, html, oben, unten, halten: !!halten });
  B('kapitel', `Was Tasty Studios für ${esc(h.name || 'das Haus')} baut`, 24, 6, true);
  if (a.einleitung) B('einleitung', esc(a.einleitung), 12, 12, true);
  const pos = a.positionen;
  pos.forEach((p, i) => {
    B('abschnitt', `<span class="nr">1.${i + 1}</span> ${esc(p.name)}`, 18, 4, true);
    if (p.text) B('absatz', esc(p.text), 12, 12);
    B('absatz', `<span class="lead">Preis:</span> ${esc(preisSatz(p))}`, 12, 12);
  });
  if (!pos.length) B('absatz', 'Noch nichts ausgewählt. Der Umfang wird unter «Umfang und Text» angeklickt.', 12, 12);
  B('kapitel', 'Preise', 24, 6, true);
  B('einleitung', 'Alle Preise netto, zuzüglich der gesetzlichen Mehrwertsteuer.', 12, 12, true);
  for (const p of pos) B('zeile', `<span>${esc(p.name)}${p.menge > 1 ? ', ' + p.menge + ' × ' + esc(p.einheit.replace(/^je /, '')) : ''}</span><span class="betrag">${esc(preisKurz(p))}</span>`, 12, 12);
  const s = summen(pos);
  for (const [k, wert] of Object.entries(s.betraege)) {
    const [w, art] = k.split(' ');
    B('zeile', `<span class="mittel">${art === 'monatlich' ? 'Monatlich' : 'Einmalig'}</span><span class="betrag mittel">${esc(geld(wert, w))}${art === 'monatlich' ? ' im Monat' : ''}</span>`, 12, 12);
  }
  if (s.spannen) B('absatz', 'Positionen mit einer Preisspanne sind in den Summen nicht enthalten. Der Betrag wird nach dem Gespräch festgelegt.', 12, 12);
  if (s.ohne_preis) B('absatz', 'Für Positionen ohne Preis wird der Betrag nach dem Gespräch festgelegt.', 12, 12);
  B('kapitel', 'Rahmen', 24, 6, true);
  B('einleitung', a.gueltig_bis ? `Dieses Angebot gilt bis zum ${datumLang(a.gueltig_bis)}.` : 'Dieses Angebot gilt bis auf Widerruf.', 12, 12, true);
  if (pos.some(p => p.art === 'monatlich')) B('absatz', 'Die Betreuung läuft monatlich. Kündbarkeit und Laufzeit stehen bei der jeweiligen Position. Den Verbrauch der KI zahlt das Haus direkt beim Anbieter.', 12, 12);
  if (a.schluss) B('absatz', esc(a.schluss), 12, 12);
  B('absatz', `${esc(TASTY.inhaber)}<br>${esc(TASTY.name)}, ${esc(TASTY.ort)}<br>${esc(TASTY.mail)}`, 12, 12);
  return b;
}
function preisSatz(p) {
  if (p.art === 'enthalten') return 'in der Betreuung enthalten.';
  if (p.preis == null && p.spanne) return `${zahl(p.spanne[0])} bis ${geld(p.spanne[1], p.waehrung)}${p.einheit ? ' ' + p.einheit : ''}, netto. Der Betrag wird nach dem Gespräch festgelegt.`;
  if (p.preis == null) return 'wird nach dem Gespräch festgelegt.';
  let s = geld(p.preis, p.waehrung) + (p.art === 'monatlich' ? ' im Monat' : ' einmalig') + (p.einheit ? ' ' + p.einheit : '') + ', netto.';
  if (p.menge > 1) s += ` Bei ${p.menge} ${p.einheit.replace(/^je /, '')}: ${geld(p.preis * p.menge, p.waehrung)}${p.art === 'monatlich' ? ' im Monat' : ''}.`;
  return s;
}
function preisKurz(p) {
  if (p.art === 'enthalten') return 'enthalten';
  if (p.preis == null && p.spanne) return `${zahl(p.spanne[0])} bis ${geld(p.spanne[1], p.waehrung)}`;
  if (p.preis == null) return 'offen';
  return geld(p.preis * (p.menge || 1), p.waehrung) + (p.art === 'monatlich' ? ' im Monat' : '');
}
function deckblatt(a) {
  const h = a.haus || {};
  const meta = [a.nummer ? 'Angebot ' + a.nummer : 'Angebotsnummer folgt beim Speichern', datumLang(a.datum), a.gueltig_bis ? 'gültig bis ' + datumLang(a.gueltig_bis) : ''].filter(Boolean).join(' · ');
  return `<div class="seite deckblatt"><img class="wasser" src="${WASSER}" alt="">
    <img class="logo" src="${WASSER}" alt="Tasty Studios">
    <p class="titel">${esc(a.titel || 'Angebot')}</p>
    <p class="untertitel">${esc(a.untertitel || '')}${a.untertitel && h.name ? '<br>' : ''}${esc(h.name || '')}</p>
    <p class="verbinder">für</p>
    <p class="partei"><span class="mittel">${esc(h.name || 'Haus')}</span>${h.ansprech ? '<br>' + esc(h.ansprech) : ''}${h.strasse ? '<br>' + esc(h.strasse) : ''}${(h.plz || h.ort) ? '<br>' + esc([h.plz, h.ort].filter(Boolean).join(' ')) : ''}</p>
    <p class="verbinder">von</p>
    <p class="partei"><span class="mittel">${esc(TASTY.name)}</span><br>${esc(TASTY.inhaber)}<br>${esc(TASTY.strasse)}<br>${esc(TASTY.ort)}<br>${esc(TASTY.mail)}</p>
    <p class="meta">${esc(meta)}</p></div>`;
}
function seiten(a) {
  const liste = bloecke(a), mess = $('#mess');
  mess.innerHTML = liste.map((b, i) => `<p class="${b.cls}" data-i="${i}" style="margin:0">${b.html}</p>`).join('');
  const hoehen = [...mess.children].map(el => el.getBoundingClientRect().height);
  mess.innerHTML = '';
  const seiten = []; let cur = [], y = 0, prevUnten = 0;
  liste.forEach((b, i) => {
    const h = hoehen[i];
    let gap = cur.length ? Math.max(prevUnten, b.oben) * PT : 0;
    let bedarf = gap + h;
    for (let j = i; liste[j].halten && liste[j + 1]; j++) bedarf += Math.max(liste[j].unten, liste[j + 1].oben) * PT + hoehen[j + 1];   // Überschrift bleibt bei dem, was folgt
    if (cur.length && y + bedarf > SEITE_INHALT) { seiten.push(cur); cur = []; y = 0; gap = 0; }
    cur.push(b); y += gap + h; prevUnten = b.unten;
  });
  if (cur.length) seiten.push(cur);
  return deckblatt(a) + seiten.map(s => `<div class="seite"><img class="wasser" src="${WASSER}" alt=""><div class="inhalt">` +
    s.map((b, i) => `<p class="${b.cls}${i === 0 ? ' erst' : ''}">${b.html}</p>`).join('') + '</div></div>').join('');
}
function blatt() {
  const d = $('#dokument'); if (!d || !S.E) return;
  d.innerHTML = seiten(angebotAus(S.E)); skaliere();
}
function skaliere() {
  const rahmen = $('#blattRahmen'), dok = $('#dokument'); if (!rahmen || !dok) return;
  const s = Math.min(1, rahmen.clientWidth / (595.3 * PT));
  dok.style.transform = `scale(${s})`;
  rahmen.style.height = (dok.scrollHeight * s) + 'px';
}
addEventListener('resize', skaliere);
function pdf() {
  const a = angebotAus(S.E);
  if (!a.positionen.length) return quit('Noch nichts ausgewählt', 'Erst den Umfang anklicken.', [], true);
  $('#druck').innerHTML = `<div class="dokument seite-doc">${seiten(a)}</div>`;
  quit('Druckfenster', 'Dort «Als PDF sichern» wählen. Das Blatt ist A4, die Ränder sind schon drin: Ränder auf «Keine» stellen.', [], false, 8000);
  setTimeout(() => window.print(), 150);
}
addEventListener('afterprint', () => { $('#druck').innerHTML = ''; });

/* ---------- Häuser (wie «Die Abende» der Vorlage: eine Karte je Haus) ---------- */
function haeuserS() {
  const H = S.haeuser, mit = H.filter(h => S.angebote.some(a => a.haus_id === h.id)), ohne = H.filter(h => !S.angebote.some(a => a.haus_id === h.id));
  const zeile = a => `<li><button type="button" data-gehe="angebote" data-wahl="${esc(a.nummer)}"><b>${esc(a.nummer)}</b><span>${esc(datumKurz(a.datum))}</span><em>${esc(summenText(a.summen) || 'ohne Summe')} · ${esc(STAND_T[stand(a)])}</em></button></li>`;
  const karte = (h, i) => {
    const l = S.angebote.filter(a => a.haus_id === h.id), g = l.filter(a => stand(a) === 'gueltig').length, b = l.filter(a => stand(a) === 'bald').length, x = l.filter(a => stand(a) === 'abgelaufen').length;
    return `<article class="re-ab${l.length ? '' : ' voll'} re-auf" style="--i:${i}" id="haus-${esc(h.id)}">
      <header class="re-ab__k"><span class="mono">${esc(h.art || 'Haus')} · ${esc(h.ort || '')}</span><h3>${esc(h.name)}</h3><b class="re-ab__frei">${l.length ? `<i>${l.length}</i> ${l.length === 1 ? 'Angebot' : 'Angebote'}` : 'Noch keines'}</b></header>
      <div class="re-ab__b" role="img" aria-label="${l.length} Angebote: ${g} gültig, ${b} laufen bald ab, ${x} abgelaufen">${'<span class="t"></span>'.repeat(g)}${'<span class="f"></span>'.repeat(b)}${'<span></span>'.repeat(x)}</div>
      <dl class="re-ab__z"><div><dt><i class="t"></i>Gültig</dt><dd>${g}</dd></div><div><dt><i class="f"></i>Bald ab</dt><dd>${b}</dd></div><div><dt><i></i>Abgelaufen</dt><dd>${x}</dd></div></dl>
      <p class="re-ab__u mono">${esc([h.ansprech, h.waehrung === 'CHF' ? 'Franken' : 'Euro', h.anrede === 'sie' ? 'per Sie' : 'per Du'].filter(Boolean).join(' · '))}</p>
      ${l.length ? `<ul class="re-ab__l">${l.map(zeile).join('')}</ul>` : '<p class="re-ab__leer">Noch kein Angebot für dieses Haus.</p>'}
      <p class="re-ab__kn"><button class="kn kn--klein kn--gold" type="button" data-neu="${esc(h.id)}">Neues Angebot<i>${SYM.plus}</i></button><button class="kn kn--klein kn--linie" type="button" data-haus="${esc(h.id)}">Ändern<i>${SYM.stift}</i></button></p>
    </article>`;
  };
  return kopf('Häuser', 'Die <em>Häuser</em>', 'Jedes Haus auf einen Blick: Ansprechperson, Währung, Anrede und alle Angebote, die es bekommen hat, mit ihrem Stand. Ein neues Haus wird hier eingetragen, ein neues Angebot entsteht direkt in seiner Karte.',
    `<button class="kn kn--gold" type="button" data-haus="">Neues Haus<i>${SYM.plus}</i></button>`) +
    (mit.length ? `<div class="re-abende">${mit.map(karte).join('')}</div>` : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Haus mit Angebot.</b><p>Sobald ein Angebot gespeichert ist, steht das Haus hier mit seinem Verlauf.</p></div>`) +
    (ohne.length ? `<section class="re-ab-ohne"><h2 class="wo-zw">Noch <em>ohne Angebot</em></h2><p class="leise">Eingetragene Häuser, die noch kein Angebot bekommen haben.</p>
      <ul class="re-ab__l re-ab__l--ohne">${ohne.map(h => `<li><button type="button" data-haus="${esc(h.id)}"><b>${esc(h.name)}</b><span>${esc(h.ort || '')}</span><em>${esc([h.art, h.ansprech].filter(Boolean).join(' · '))}</em></button></li>`).join('')}</ul></section>` : '');
}
function verbindeHaeuser() {
  $$('#ansicht [data-haus]').forEach(b => b.onclick = () => hausFenster(hausVon(b.dataset.haus)));
  if (S.wahlHaus) { const k = $('#haus-' + CSS.escape(S.wahlHaus)); if (k) k.scrollIntoView({ block: 'center' }); S.wahlHaus = ''; }
}
const FELDER_HAUS = ['name', 'art', 'ansprech', 'strasse', 'plz', 'ort', 'land', 'waehrung', 'anrede', 'mail', 'notiz'];
const hausText = h => h ? [h.name, h.ansprech, h.strasse, [h.plz, h.ort].filter(Boolean).join(' '), h.land, h.waehrung].filter(Boolean).join(', ') : '';
function hausFenster(h) {
  const v = k => esc(h ? (h[k] || '') : k === 'land' ? 'Deutschland' : '');
  const f = (k, t, extra = '') => `<label class="feld"><span>${t}</span><input id="h-${k}" value="${v(k)}"${extra}></label>`;
  const sel = (k, t, o) => `<label class="feld"><span>${t}</span><select id="h-${k}">${o.map(([w, n]) => `<option value="${w}"${(h ? h[k] : o[0][0]) === w ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  fenster(`<h2>${h ? 'Haus <em>ändern.</em>' : 'Neues <em>Haus.</em>'}</h2><p>${h ? 'Die Angaben stehen auf dem Deckblatt jedes neuen Angebots. Gespeicherte Angebote behalten ihren Stand.' : 'Name genügt für den Anfang. Der Rest steht später auf dem Deckblatt.'}</p>
    <div class="an-felder">${f('name', 'Name des Hauses', ' required')}${f('art', 'Art', ' placeholder="Hotel, Gasthaus, Bar"')}</div>
    <div class="an-felder">${f('ansprech', 'Ansprechperson')}${f('mail', 'Mail', ' type="email"')}</div>
    ${f('strasse', 'Strasse')}
    <div class="an-felder an-felder--drei">${f('plz', 'PLZ')}${f('ort', 'Ort')}${f('land', 'Land')}</div>
    <div class="an-felder">${sel('waehrung', 'Währung', [['EUR', 'Euro'], ['CHF', 'Franken']])}${sel('anrede', 'Anrede', [['du', 'Du'], ['sie', 'Sie']])}</div>
    <label class="feld"><span>Notiz</span><textarea id="h-notiz" rows="2">${v('notiz')}</textarea></label>
    <div class="fenster__kn">${h ? `<button class="link" type="button" id="h-weg">Haus löschen</button>` : ''}<button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">${h ? 'Speichern' : 'Haus anlegen'}<i>${SYM.haken}</i></button></div>`, false, async () => {
      const d = {}; FELDER_HAUS.forEach(k => { d[k] = $('#h-' + k).value; });
      if (!d.name.trim()) { $('#h-name').focus(); return quit('Name fehlt', 'Ein Haus braucht einen Namen.', [], true, 4000); }
      try {
        if (h) {
          const r = await api('PUT', 'haeuser/' + encodeURIComponent(h.id), d); fensterZu(); await ladeAlles(true); nachHaus();
          quittung('Haus «' + r.haus.name + '» geändert', hausText(r.vorher), hausText(r.haus), { methode: 'PUT', weg: 'haeuser/' + encodeURIComponent(r.haus.id), daten: r.vorher, nach: async () => { await ladeAlles(true); nachHaus(); } });
        } else {
          const r = await api('POST', 'haeuser', d); fensterZu(); await ladeAlles(true); nachHaus();
          quittung('Haus «' + r.haus.name + '» angelegt', 'kein Haus', hausText(r.haus), { methode: 'DELETE', weg: 'haeuser/' + encodeURIComponent(r.haus.id), nach: async () => { await ladeAlles(true); nachHaus(); } });
          if (S.nachHausNeu) { const w = S.nachHausNeu; S.nachHausNeu = null; w(r.haus.id); }
        }
      } catch (e) { fehler(e); }
    });
  const weg = $('#h-weg');
  if (weg) weg.onclick = () => {
    const n = S.angebote.filter(a => a.haus_id === h.id).length;
    if (n) return quit('Haus hat noch Angebote', `${h.name} hat ${mal(n, 'ein Angebot', 'Angebote')}. Erst die Angebote löschen, dann das Haus.`, [], true, 7000);
    fenster(`<h2>Haus <em>löschen?</em></h2><p>«${esc(h.name)}» wird aus der Liste entfernt. Über die Quittung lässt es sich gleich danach zurückholen.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Behalten</button><button class="kn kn--gefahr" type="button" id="f-los">Löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try { const r = await api('DELETE', 'haeuser/' + encodeURIComponent(h.id)); await ladeAlles(true); nachHaus();
          quittung('Haus «' + h.name + '» gelöscht', hausText(r.geloescht), 'kein Haus', { methode: 'POST', weg: 'haeuser', daten: r.geloescht, nach: async () => { await ladeAlles(true); nachHaus(); } });
        } catch (e) { fehler(e); }
      });
  };
}
function nachHaus() { rand(); leiste(); if (S.ansicht === 'angebote' && S.E) neuDetail(); else zeichne(); }
/* Neues Angebot: Haus wählen (oder neu eintragen), dann gleich der Umfang */
function neuFenster(hausId) {
  if (S.E && S.E.geaendert) return fragen(() => neuFenster(hausId));
  const los = id => { neuesE(id); S.ansicht = 'angebote'; S.abt = 'alle'; S.filter = 'alle'; history.replaceState(null, '', location.pathname + location.search + '#angebote'); rand(); leiste(); zeichne().then(() => { const p = $('.re-post'); if (p && innerWidth <= 1180) p.scrollIntoView({ block: 'start' }); }); };
  if (typeof hausId === 'string' && hausId) return los(hausId);
  let zuletzt = ''; try { zuletzt = localStorage.getItem('angebot.haus') || ''; } catch (e) { /* privat */ }
  fenster(`<h2>Neues <em>Angebot.</em></h2><p>Für welches Haus? Danach den Umfang anklicken, die Preise kommen aus den Grundlagen.</p>
    <label class="feld"><span>Haus</span><select id="n-haus">${S.haeuser.map(h => `<option value="${esc(h.id)}"${h.id === zuletzt ? ' selected' : ''}>${esc(h.name)}${h.ort ? ', ' + esc(h.ort) : ''}</option>`).join('')}</select></label>
    <div class="fenster__kn"><button class="link" type="button" id="n-hausneu">Neues Haus eintragen</button><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los"${S.haeuser.length ? '' : ' disabled'}>Weiter<i>${PF}</i></button></div>`, true, () => {
      const id = $('#n-haus').value; try { localStorage.setItem('angebot.haus', id); } catch (e) { /* privat */ } fensterZu(); los(id);
    });
  $('#n-hausneu').onclick = () => { S.nachHausNeu = los; hausFenster(null); };
}

/* ---------- Preise (wie «Das wurde gefragt» der Vorlage) ---------- */
function preiseS() {
  const G = S.preise.gruppen, alle = G.reduce((n, g) => n + g.positionen.length, 0), fehlt = ohnePreis(), spannen = G.reduce((n, g) => n + g.positionen.filter(p => p.preis == null && p.spanne).length, 0);
  const nurFehlt = S.pfilter === 'fehlt';
  const zeile = (g, p) => { const f = p.preis == null && !p.spanne && p.art !== 'enthalten';
    return `<div class="re-f an-preis${f ? ' luecke' : ''}" data-id="${esc(p.id)}">${IMG(gruppenBild(g.id), 're-f__bild')}
      <div class="re-f__k"><span class="mono">${esc([p.art === 'monatlich' ? 'monatlich' : p.art === 'enthalten' ? 'in der Betreuung' : 'einmalig', p.waehrung || 'EUR', p.einheit || ''].filter(Boolean).join(' · '))}</span>
        <em>${f ? 'Preis fehlt' : p.spanne && p.preis == null ? 'Spanne' : esc(preisText(p))}</em></div>
      <p class="re-f__q">${esc(p.name)}</p>
      <details class="re-f__antw"><summary>Woher der Preis kommt</summary><div class="re-chat-antwort"><span class="re-chat-antwort__k mono">${ZEICHEN}Grundlagen, Angebot.md</span><p>${esc(p.quelle || '')}</p>${p.text ? `<p>${esc(p.text)}</p>` : ''}</div></details>
    </div>`; };
  const reihe = G.map(g => ({ g, l: g.positionen.filter(p => !nurFehlt || (p.preis == null && !p.spanne && p.art !== 'enthalten')) })).filter(x => x.l.length);
  return kopf('Preise', 'Was es <em>kostet.</em>',
    `Alle Positionen aus den Grundlagen (Angebot.md), Stand ${esc(datumKurz(S.preise.stand))}, netto. ${fehlt.length ? `<b>${mal(fehlt.length, 'Ein Preis fehlt', 'Preise fehlen')},</b> weil die Grundlagen keinen nennen. Im Angebot bleibt das Feld leer und ist markiert. Festlegen kann ihn nur Robert, eingetragen wird er in der Preisdatei.` : 'Jede Position hat einen Preis.'}`) +
    `<div class="re-zahlen platte"><div><b>${alle}</b><span>Positionen</span></div><div><b>${fehlt.length}</b><span>Preis fehlt</span></div><div><b>${spannen}</b><span>mit Spanne</span></div><div><b>${G.length}</b><span>Bereiche</span></div></div>
    <div class="filter"><div class="wahl2" role="group" aria-label="Auswahl"><button type="button" data-gehe="preise" aria-pressed="${!nurFehlt}">Alle Preise</button><button type="button" data-gehe="preise" data-wahl="fehlt" aria-pressed="${nurFehlt}">Preis fehlt${fehlt.length ? ' · ' + fehlt.length : ''}</button></div></div>
    ${reihe.length ? reihe.map(({ g, l }) => `<details class="gr re-gr" open><summary><b>${esc(g.name)}</b><small>${mal(l.length, 'eine Position', 'Positionen')}${l.filter(p => p.preis == null && !p.spanne && p.art !== 'enthalten').length ? ' · ' + l.filter(p => p.preis == null && !p.spanne && p.art !== 'enthalten').length + ' ohne Preis' : ''}</small></summary>${g.hinweis ? `<p class="re-gr__h">${esc(g.hinweis)}</p>` : ''}${l.map(p => zeile(g, p)).join('')}</details>`).join('')
      : `<div class="re-leer platte">${ZEICHEN}<b>Kein Preis fehlt.</b><p>Jede Position in den Grundlagen hat einen Preis.</p></div>`}`;
}

/* ---------- Fenster ---------- */
function fenster(html, schmal = false, los = null) {
  const f = $('#fenster');
  f.innerHTML = `<div class="fenster__k${schmal ? ' schmal' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false;
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  if (los && $('#f-los')) $('#f-los').onclick = los;
  const erst = $('input, select', f); if (erst) erst.focus({ preventScroll: true });
}
function fensterZu() { $('#fenster').hidden = true; $('#fenster').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu(); });

/* ---------- Start ---------- */
(async function () {
  try { await Promise.race([ladeAlles(), new Promise((_, nein) => setTimeout(() => nein(new Error('SERVER · Der Server-Teil antwortet nicht.')), 12000))]); }
  catch (e) { $('#tuer').hidden = false; $('#tuer-t').textContent = /^VERBINDUNG · /.test(e.message || '') ? 'Keine Verbindung zum Server-Teil. Bitte gleich neu laden.' : String(e.message || e).replace(/^[A-ZÄÖÜ]+ · /, ''); return; }
  await (document.fonts ? document.fonts.ready : Promise.resolve());   // das Blatt misst mit Montserrat
  const h = location.hash.slice(1), nr = Q.get('angebot');
  if (nr && S.angebote.some(a => a.nummer === nr)) { S.ansicht = 'angebote'; S.wahl = nr; }   // aus «Heute» der Zentrale: das Angebot direkt öffnen
  else { try { S.ansicht = TITEL[h] ? h : (localStorage.getItem('angebot-ansicht') || 'start'); } catch (e) { S.ansicht = 'start'; } }
  if (!TITEL[S.ansicht]) S.ansicht = 'start';
  rand(); leiste(); await zeichne();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
})();
/* Nichts geht beim Verlassen still verloren: wartet eine Änderung, fragt der Browser nach */
addEventListener('beforeunload', ev => { if (S.E && S.E.geaendert) { ev.preventDefault(); ev.returnValue = ''; } });
