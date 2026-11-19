/* Post aus dem Studio · Tasty Studios (Neubau im Kleid, 07.11.2026). Aufbau, Ansichten, Fenster und Quittungen aus La Réception (vorlage/culinarium-demo/werkzeuge/reception/,
   reception.js), Rahmen «Die Bühne» wie Le Bureau, Kleid aus zentrale/oberflaeche/. Inhalt aus der ersten Fassung (app.js bis 07.11.2026): Empfänger und Listen,
   Import und Export als CSV, Dubletten, Anmeldung mit Bestätigung, Ausgaben aus Bausteinen mit Vorschau Rechner/Handy, Probemail, Versand an eine Liste mit Rückfrage,
   Postausgang, Versandweg, Archiv.
   Ansichten wie in der Vorlage: Übersicht (Startbild, Lage, Kacheln, zwei Listen) · Ausgaben (= Eingang: Liste, Karte, darunter die Mail) · Empfänger und Archiv
   (= Das wurde gefragt: Zahlen, Auswahl, Gruppen) · Listen (= Die Abende: Karten je Liste) · Versand (Versandweg und Postausgang).
   Server-Teil: api.py (/zentrale/api/10-newsletter/…). Hier wird nichts verschickt: jede Mail liegt als Datei im Postausgang, solange der Versand trocken ist. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
// Schliessen ohne «×» (wie in der Vorlage): der Zurück-Pfeil
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';
const ZEICHEN = '<img src="/zentrale/zentrale/oberflaeche/kleid/anker-zeichen.svg" width="1744" height="1688" alt="">';
const SYM = {
  korb: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  post: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  stift: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg>',
  haken: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  kopie: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 5.5h7v8h-7zM3.5 10.5v-8h7"/></svg>',
  hoch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>',
  runter: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
  runterladen: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
  hochladen: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10.5v-8M4.5 6 8 2.5 11.5 6M3 13.5h10"/></svg>' };
const API = '/zentrale/api/10-newsletter/';
const WER = (window.WO_HAUS || {}).wer || '';
const Q = new URLSearchParams(location.search);
/* Fotos der Agentur-Seite (grundlagen/marke/fotos, über WO_HAUS.fotos): je Ausgabe, je Liste und je Bereich eines */
const F = (window.WO_HAUS || {}).fotos || {};
const ALLE_BILDER = ['faehre', 'studio', 'tafel', 'bar', 'terrasse', 'empfang', 'zimmer', 'aussen', 'haus', 'anleger', 'speicherstadt', 'plan', 'bildschirm'];
const hashZahl = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const LISTENBILD = { 'l-post': 'studio', 'l-hotel': 'zimmer', 'l-gastro': 'bar', 'l-kicheck': 'bildschirm' };
const listenBild = id => F[LISTENBILD[id] || ALLE_BILDER[hashZahl(id) % ALLE_BILDER.length]] || F.studio;
/* je Ausgabe fest ein Foto: das erste Bild der Ausgabe, wenn es von der Agentur-Seite kommt, sonst eines nach Nummer */
const ausgabeBild = a => { const b = (a && a.bausteine || []).find(x => ['kopfbild', 'bild', 'meldung'].includes(x.art) && /^\/grundlagen\//.test(x.link || '')); return b ? b.link : F[ALLE_BILDER[(Number(a && a.nummer) || 0) % ALLE_BILDER.length]] || F.faehre; };
const HERKUNFTBILD = { Website: 'bildschirm', 'Gespräch': 'tafel', 'KI-Check': 'plan' };
const bild = (src, kl) => `<span class="${kl}" aria-hidden="true"><img src="${esc(src)}" alt="" width="900" height="675" decoding="async"></span>`;
const IMG = (src, kl) => `<span class="${kl}" aria-hidden="true"><img src="${esc(src)}" alt="" width="640" height="800" loading="lazy" decoding="async"></span>`;
/* Bühne je Ansicht: ein Foto der Agentur-Seite */
const SB_FOTO = { ausgaben: 'faehre', empfaenger: 'empfang', listen: 'anleger', archiv: 'speicherstadt', versand: 'bildschirm' };
const ARTEN = { titel: 'Überschrift', text: 'Text', bild: 'Bild', zitat: 'Zitat', knopf: 'Knopf', projekt: 'Projekt aus dem Atelier', kopfbild: 'Kopfbild', meldung: 'Neuigkeit', termin: 'Termin', gruss: 'Gruss' };
const STAND_T = { 'bestätigt': 'Bestätigt', angemeldet: 'Noch nicht bestätigt', abgemeldet: 'Abgemeldet' };
const ARTNAME = { probe: 'Probemail', ausgabe: 'Ausgabe', bestaetigung: 'Bestätigung' };

const S = { ansicht: 'start', D: null, wahl: '', filter: 'alle', abt: 'alle', modus: 'vorschau', geraet: 'rechner', E: null, efilter: 'alle', eliste: 'alle', such: '', vorschau: null };

/* ---------- Server ---------- */
async function api(methode, weg, daten) {
  let r;
  try {
    const vorab = methode === 'GET' && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];   // schon beim Laden der Seite geholt (index.html), nur einmal
    r = await (vorab || fetch(API + weg, { method: methode, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: methode === 'GET' ? undefined : JSON.stringify(daten || {}) }));
  } catch (e) { throw new Error('VERBINDUNG · Keine Verbindung. Deine Eingabe ist noch da, bitte gleich noch einmal versuchen.'); }
  let d = {};
  try { d = await r.json(); } catch (e) { throw new Error('SERVER · Antwort nicht lesbar (' + r.status + ').'); }
  if (!r.ok) throw new Error(d.fehler ? 'SERVER · ' + d.fehler : ('SERVER · Fehler ' + r.status));
  /* Abweisungen, die zur Bedienung gehören (Dublette, gesperrt), kommen mit Status 200 und «fehler» (api.py) */
  if (d.fehler) { const f = new Error((d.gesperrt ? 'GESPERRT · ' : /Mail-Adresse/.test(d.fehler) ? 'EINGABE · ' : d.vorhanden ? 'DUBLETTE · ' : 'EINGABE · ') + d.fehler); f.antwort = d; throw f; }
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
  /* eine Quittung zur Zeit, wie in Le Bureau: die neue ersetzt die alte, damit nichts den Inhalt zudeckt und kein überholtes «Rückgängig» stehen bleibt */
  $('#meldung').replaceChildren(q);
  if (dauer) setTimeout(() => q.remove(), dauer);
}
/* Quittung jeder Änderung: vorher, nachher und «Rückgängig» (CLAUDE.md: nie still speichern). rueck ist eine Funktion, die alles zurücknimmt. */
function quittung(titel, vorher, nachher, rueck, extra = []) {
  quit(titel, `Vorher: ${vorher || '–'}\nNachher: ${nachher || '–'}`, (rueck ? [['Rückgängig', async () => {
    try { await rueck(); await frisch(); quit('Rückgängig gemacht', titel, [], false, 4000); } catch (e) { fehler(e); }
  }]] : []).concat(extra), false, 15000);
}
/* nur die Zeilen, die sich geändert haben: [[Bezeichnung, vorher, nachher], …] → «vorher» und «nachher» je als Text */
function unterschied(paare) {
  const p = paare.filter(x => String(x[1] || '') !== String(x[2] || ''));
  if (!p.length) return ['nichts geändert', 'nichts geändert'];
  return [p.map(x => `${x[0]} ${x[1] || 'leer'}`).join(' · '), p.map(x => `${x[0]} ${x[2] || 'leer'}`).join(' · ')];
}
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const datumLang = iso => { if (!iso) return ''; const [j, m, t] = iso.slice(0, 10).split('-').map(Number); return `${t}. ${MONATE[m - 1]} ${j}`; };
const datumKurz = iso => { if (!iso) return ''; const [j, m, t] = iso.slice(0, 10).split('-'); return `${t}.${m}.${j}`; };
const zeit = s => s ? datumKurz(s) + (s.length > 10 ? ', ' + s.slice(11, 16) + ' Uhr' : '') : '';
const isoHeute = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const tageSeit = iso => iso ? Math.round((new Date(isoHeute() + 'T12:00:00') - new Date(iso.slice(0, 10) + 'T12:00:00')) / 864e5) : null;
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;
const D = () => S.D;
const listeVon = id => D().listen.find(l => l.id === id) || null;
const listenName = id => (listeVon(id) || {}).name || id || 'ohne Liste';
const ausgabeVon = id => D().ausgaben.find(a => a.id === id) || null;
const empfVon = id => D().empfaenger.find(e => e.id === id) || null;
const inListe = id => D().empfaenger.filter(e => (e.listen || []).includes(id));
const bestaetigt = () => D().empfaenger.filter(e => e.stand === 'bestätigt');
const wartend = () => D().empfaenger.filter(e => e.stand === 'angemeldet');
const entwuerfe = () => D().ausgaben.filter(a => a.stand !== 'versendet').sort((a, b) => (b.nummer || 0) - (a.nummer || 0));
const archiv = () => D().ausgaben.filter(a => a.stand === 'versendet').sort((a, b) => (b.versendet_am || '').localeCompare(a.versendet_am || '') || (b.nummer || 0) - (a.nummer || 0));
const ausgabenSortiert = () => D().ausgaben.slice().sort((a, b) => (b.nummer || 0) - (a.nummer || 0));
/* mögliche Dubletten: gleicher Name (ohne Gross/Klein) oder gleicher Teil vor dem @ (gleiche Adressen fängt der Server ab) */
function dubletten() {
  const ids = {}, nachName = {}, nachKopf = {};
  D().empfaenger.forEach(e => {
    const n = (e.name || '').toLowerCase().replace(/\s+/g, ' ').trim(), k = (e.mail || '').split('@')[0].toLowerCase();
    if (n) (nachName[n] = nachName[n] || []).push(e.id);
    if (k) (nachKopf[k] = nachKopf[k] || []).push(e.id);
  });
  [nachName, nachKopf].forEach(g => Object.values(g).forEach(l => { if (l.length > 1) l.forEach(id => { ids[id] = true; }); }));
  return ids;
}

/* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
const TITEL = { start: 'Übersicht', ausgaben: 'Ausgaben', empfaenger: 'Empfänger', listen: 'Listen', archiv: 'Archiv', versand: 'Versand' };
const WEGE = { anleitung: 'anleitung.html', pruefung: 'pruefung.html' };
/* Knöpfe in Startbild und Bühne im Stil des Pakets (gleiche Ids und data-Attribute), wie in der Vorlage */
const woKn = h => String(h || '').replace(/class="kn kn--(gold|linie)( glanz-kn)?"/g, (m, a) => `class="wo-kn wo-kn--${a === 'gold' ? 'gold' : 'hell'}"`)
  .replace(/class="kn"/g, 'class="wo-kn wo-kn--hell"').replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>)([^<]+)<i>/g, '$1<span>$2</span><i>')
  .replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>(?:(?!<\/(?:a|button)>).)*?<i>)<svg (?![^>]*class=)/g, '$1<svg class="wo-ic" ');
function kopfLeiste() {
  const n = wartend().length;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: '10-newsletter', unter: 'Newsletter', titel: TITEL[S.ansicht] || WO.name('10-newsletter'),
    stand: D().versand.scharf ? 'Versand ist scharf' : mal(bestaetigt().length, 'Ein Empfänger bestätigt', 'Empfänger bestätigt') + '',
    pruefung: WEGE.pruefung, anleitung: WEGE.anleitung, website: (WO_HAUS.wege || {}).website || '/zentrale/seite/index.html', marke: 'data-gehe="start"' });
  /* Das Kleid legt im Kopf die Werkzeug-Leiste des Culinarium an (im Rahmen «Die Bühne» ausgeblendet). Sie gehört nicht hierher: weg damit, auch für Bildschirmleser. */
  const wz = $('#kopf .wo-kopf__wz'); if (wz) wz.remove();
  const r = $('#kopf .wo-kopf__r');
  if (r) r.insertAdjacentHTML('afterbegin', WO.knopf('Neue Ausgabe', 'plus', 'hell', { id: 'k-neu', klein: true }) + '<span class="wo-trenn"></span>');
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
  const kn = $('#k-neu'); if (kn) kn.onclick = neueAusgabe;
}
function rand() {
  const an = S.ansicht;
  const e = (key, text, zahl = 0) => ({ text, zahl, an: an === key, attr: `data-gehe="${key}"` });
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('start', 'Übersicht')] },
    { titel: 'Die Post', eintraege: [e('ausgaben', 'Ausgaben', entwuerfe().length)] },
    { titel: 'Wer sie bekommt', eintraege: [e('empfaenger', 'Empfänger'), e('listen', 'Listen')] },
    { titel: 'Für Robert und Anna', eintraege: [e('versand', 'Versand', D().postausgang.length)] }], WEGE);
  const w = $('#rand .wo-rand__wege'), pf = WO.ic('pfeil');
  if (w) {   // Wege: die Anmeldung auf der Agentur-Seite, die Zentrale; dazu «Neue Ausgabe» fürs Handy
    w.insertAdjacentHTML('afterbegin', `<a href="${esc((WO_HAUS.wege || {}).website || '/zentrale/seite/index.html')}#arbeiten" target="_blank" rel="noopener">Anmeldung auf der Agentur-Seite${pf}</a>`);
    w.insertAdjacentHTML('beforeend', `<a href="${esc((WO_HAUS.wege || {}).zentrale || '/zentrale/')}">${esc(WO.name('zentrale'))}${pf}</a><button class="wo-rand__probe" type="button" data-neu>Neue Ausgabe${WO.ic('plus')}</button>`);
  }
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  $$('#rand [data-neu]').forEach(b => b.onclick = neueAusgabe);
  kopfLeiste();
}
/* Leiste unten: Speichern grau (nichts offen), gelb (Änderung wartet), grün (gespeichert) */
function leiste() {
  const E = S.ansicht === 'ausgaben' ? S.E : null, wartet = !!(E && E.wartet), gesp = !!E && !wartet && S.gesp > Date.now();   // grün nur einige Sekunden nach dem Speichern (wie Le Bureau)
  const titel = !E ? mal(entwuerfe().length, 'Ein Entwurf', 'Entwürfe') + ', ' + mal(archiv().length, 'eine Ausgabe', 'Ausgaben') + ' im Archiv'
    : wartet ? 'Nr. ' + E.nummer + ': Änderung wartet' : gesp ? 'Nr. ' + E.nummer + ' ist gespeichert' : 'Nr. ' + E.nummer + ': nichts offen';
  const satz = !E ? (D().versand.scharf ? 'Der Versand ist scharf: Mails gehen wirklich raus.' : 'Der Versand ist trocken: jede Mail liegt als Datei im Postausgang, verschickt wird nichts.')
    : wartet ? 'Noch nicht gespeichert. Probemail und Versand nehmen immer den gespeicherten Stand.' : E.stand === 'versendet' ? 'Verschickt am ' + datumKurz(E.versendet_am) + ' an ' + mal(E.empfaenger_zahl, 'einen Empfänger', 'Empfänger') + '.' : 'Entwurf für «' + listenName(E.liste) + '».';
  $('#leiste').innerHTML = WO.leiste({ titel, satz,
    knoepfe: WO.knopf('Neue Ausgabe', 'plus', 'glas', { id: 'l-neu', klein: true }) +
      (wartet ? WO.knopf('Speichern', 'pfeil', 'wartet', { id: 'l-speichern', klein: true }) : gesp ? WO.knopf('Gespeichert', 'haken', 'fertig', { id: 'l-speichern', klein: true, disabled: true }) : WO.knopf('Speichern', 'pfeil', 'glas', { id: 'l-speichern', klein: true, disabled: true })) });
  $('#l-neu').onclick = neueAusgabe;
  const sp = $('#l-speichern'); if (sp && wartet) sp.onclick = () => speichern().catch(fehler);
}
function kopf(mono, titel, satz, knoepfe = '', foto = '') {   // Bühne jeder Ansicht = Startbild «buehne» des Pakets mit dem Foto der Ansicht
  return WO.startbild({ werkzeug: '10-newsletter', art: 'buehne', zier: esc(WO.name('10-newsletter') + ' · ' + mono), h1: titel, satz, knoepfe: woKn(knoepfe),
    foto: foto || F[SB_FOTO[S.ansicht]] || F.faehre });
}
function gehe(ziel, wahl = '') {
  if (S.E && S.E.wartet && (ziel !== 'ausgaben' || (wahl && wahl !== S.wahl))) return fragen(() => gehe(ziel, wahl));
  if (ziel === 'archiv') { ziel = 'ausgaben'; S.filter = 'versendet'; }   // das Archiv ist seit dem Schreibtisch der Stapel «Verschickt»
  if (ziel === 'ausgaben' && S.ansicht === 'ausgaben' && wahl && $('#blatt')) return tischWechsel(wahl);
  popZu();
  S.ansicht = ziel;
  if (ziel === 'ausgaben' && wahl) waehle(wahl);
  if (ziel === 'empfaenger') { S.efilter = ['angemeldet', 'bestätigt', 'abgemeldet', 'dubletten'].includes(wahl) ? wahl : 'alle'; if (wahl && listeVon(wahl)) { S.eliste = wahl; S.efilter = 'alle'; } else if (!wahl) S.eliste = 'alle'; }
  if (ziel === 'listen') S.wahlListe = wahl;
  try { localStorage.setItem('newsletter-ansicht', ziel); } catch (e) { /* privat */ }
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', location.pathname + location.search + '#' + ziel);
  rand(); leiste(); zeichne(); window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
async function ladeAlles() { S.D = await api('GET', 'stand'); }
async function frisch(meldung = false) {
  try {
    await ladeAlles();
    if (S.E && !S.E.wartet) { const a = ausgabeVon(S.E.id); if (a) setzeE(a); else { S.E = null; S.wahl = ''; } }
    rand(); leiste(); zeichne(); if (meldung) quit('Neu geladen', '', [], false, 2500);
  } catch (e) { fehler(e); }
}

/* ---------- Ansichten ---------- */
function randPruefen() {
  const wurzel = document.documentElement;
  if (S.ansicht === 'ausgaben' && innerWidth > 1100 && !S.randSelbst && !wurzel.classList.contains('st-rand-zu')) { wurzel.classList.add('st-rand-zu'); S.randAuto = true; }
  else if (S.ansicht !== 'ausgaben' && S.randAuto) { wurzel.classList.remove('st-rand-zu'); S.randAuto = false; }
}
function zeichne() {
  const el = $('#ansicht');
  if (S.ansicht === 'archiv') { S.ansicht = 'ausgaben'; S.filter = 'versendet'; }
  document.body.classList.toggle('nl-tisch', S.ansicht === 'ausgaben');
  /* Am Schreibtisch braucht die Mail ihre volle Breite: der Rand klappt von selbst zu und öffnet sich mit seinem Knopf wie immer */
  randPruefen();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { randPruefen(); tischMass(); }, { once: true });   // die Leiste liest beim Laden ihren alten Stand und klappt sonst wieder auf
  try {
    if (S.ansicht === 'start') { el.innerHTML = start(); startVorschau(); }
    else if (S.ansicht === 'ausgaben') { el.innerHTML = eingang(); verbindeEingang(); }
    else if (S.ansicht === 'empfaenger') { el.innerHTML = empfaengerS(); verbindeEmpfaenger(); }
    else if (S.ansicht === 'listen') { el.innerHTML = listenS(); verbindeListen(); }
    else if (S.ansicht === 'versand') { el.innerHTML = versandS(); verbindeVersand(); }
    $$('#ansicht [data-gehe]').forEach(b => { if (!b.onclick) b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || ''); });
    $$('#ansicht [data-neu]').forEach(b => b.onclick = neueAusgabe);
    $$('#ansicht [data-mail]').forEach(b => b.onclick = () => zeigMail(b.dataset.mail));
    $$('#ansicht .re-n').forEach((x, i) => { x.classList.add('re-auf'); x.style.setProperty('--i', Math.min(i, 12)); });
  } catch (e) { fehler(e); }
}

/* Übersicht (Robert 17.11.2026: «kein Kacheln reingeklatscht … ein richtig geiles, luxuriöses Interface»): eine Bühne mit dem, was als Nächstes rausgeht, gross mit der echten Mail; darunter das Regal der verschickten Ausgaben als Blätter und eine Zeile, wer auf die Bestätigung wartet */
function start() {
  const E = entwuerfe(), A = archiv(), W = wartend(), B = bestaetigt(), gruss = WO.gruss(), n = E[0];
  const zahl = n ? zusammen(n) : null;
  const punkte = n ? [[!!(n.betreff || '').trim(), 'Betreff', (n.betreff || '').trim() ? 'steht: «' + n.betreff + '»' : 'fehlt noch, er steht im Postfach als erste Zeile'],
    [!!n.probe_am, 'Probemail', n.probe_am ? 'zuletzt ' + zeit(n.probe_am) : 'noch keine geschickt, erst ansehen, dann abschicken'],
    [zahl.bestaetigt > 0, 'Empfänger', `${listenName(n.liste)}, ${mal(zahl.bestaetigt, 'eine bestätigte Adresse', 'bestätigte Adressen')}`]] : [];
  const offen = punkte.filter(p => !p[0]).length;
  const held = WO.startbild({ werkzeug: '10-newsletter', art: 'voll', foto: F.faehre,
    h1: `${gruss} <em>${n ? 'Nr. ' + esc(n.nummer) + ' wartet auf Sie.' : 'Zeit für die nächste Post.'}</em>`,
    satz: n ? `«${esc(n.titel || 'Ohne Titel')}» ist in Arbeit${offen ? ', ' + (offen === 1 ? 'ein Schritt fehlt' : offen + ' Schritte fehlen') + ' bis zum Abschicken' : ' und bereit zum Abschicken'}. ${mal(B.length, 'Eine bestätigte Adresse wartet', 'bestätigte Adressen warten')} auf die nächste Ausgabe.`
      : `${mal(B.length, 'Eine bestätigte Adresse wartet', 'bestätigte Adressen warten')} auf die nächste Ausgabe. Eine Vorlage wählen und direkt hineinschreiben.`,
    knoepfe: n ? WO.knopf('Weiterschreiben', 'stift', 'gold', { attr: `data-gehe="ausgaben" data-wahl="${esc(n.id)}"` }) : WO.knopf('Neue Ausgabe', 'plus', 'gold', { attr: 'data-neu' }) });
  const naechste = n ? `<section class="ue-next">
      <button class="ue-blatt ue-blatt--gross" type="button" data-gehe="ausgaben" data-wahl="${esc(n.id)}" aria-label="Nr. ${esc(n.nummer)} öffnen"><iframe data-ue-mail="${esc(n.id)}" tabindex="-1" title="Nr. ${esc(n.nummer)}" aria-hidden="true"></iframe></button>
      <div class="ue-next__t">
        <p class="ue-mk">Als Nächstes · Nr. ${esc(n.nummer)} · ${esc(datumKurz(n.geaendert))}</p>
        <h2>${esc(n.titel || 'Ohne Titel')}</h2>
        <p class="ue-next__satz">${esc(n.vorschau || 'Noch ohne Vorschautext.')}</p>
        <ol class="ue-schritte">${punkte.map(([ok, t, s]) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? SYM.haken : ''}</i><b>${t}</b><span>${esc(s)}</span></li>`).join('')}</ol>
        <div class="ue-next__kn">${WO.knopf('Weiterschreiben', 'stift', 'gold', { attr: `data-gehe="ausgaben" data-wahl="${esc(n.id)}"` })}${E.length > 1 ? `<p>Auch in Arbeit: ${E.slice(1, 3).map(x => `<button class="link" type="button" data-gehe="ausgaben" data-wahl="${esc(x.id)}">Nr. ${esc(x.nummer)}, ${esc(x.titel || 'ohne Titel')}</button>`).join(' ')}</p>` : ''}</div>
      </div>
    </section>` : '';
  const R = A.slice(0, 3);
  const regal = R.length ? `<section class="ue-regal-k"><h2 class="wo-zw">Zuletzt <em>verschickt</em></h2><button class="link" type="button" data-gehe="ausgaben" data-wahl="${esc(R[0].id)}">Alle ${A.length} im Stapel</button></section>
    <div class="ue-regal" style="--n:${R.length}">${R.map(a => `<button class="ue-r" type="button" data-gehe="ausgaben" data-wahl="${esc(a.id)}">
      <span class="ue-blatt"><iframe data-ue-mail="${esc(a.id)}" tabindex="-1" title="Nr. ${esc(a.nummer)}" aria-hidden="true"></iframe></span>
      <span class="ue-r__t"><small>Nr. ${esc(a.nummer)} · ${esc(datumKurz(a.versendet_am))} · an ${esc(mal(a.empfaenger_zahl, 'einen Empfänger', 'Empfänger'))}</small><b>${esc(a.titel || 'Ohne Titel')}</b></span></button>`).join('')}</div>` : '';
  const warten = `<div class="ue-warten ruhig"><b>${B.length}</b><span><em>${B.length === 1 ? 'Empfänger bekommt' : 'Empfänger bekommen'} die nächste Ausgabe</em>${W.length ? (W.length === 1 ? 'Eine weitere Adresse hat' : W.length + ' weitere Adressen haben') + ' den Link in der Anmelde-Mail noch nicht angeklickt. Ihr müsst nichts tun.' : 'Alle Angemeldeten haben bestätigt.'}</span></div>`;
  return held + naechste + regal + warten;
}
/* die echten Mails als Blätter, auf die Breite des Rahmens verkleinert */
function startVorschau() {
  const skal = () => $$('#ansicht .ue-blatt').forEach(b => { const k = b.clientWidth / 600, fr = $('iframe', b); b.style.setProperty('--sk', k); if (fr && k) fr.style.height = Math.ceil(b.clientHeight / k) + 'px'; });   // der Rahmen bleibt so hoch wie das Blatt, nie länger
  skal(); if (!S.ueSkal) { S.ueSkal = true; addEventListener('resize', () => { if (S.ansicht === 'start') skal(); }); }
  $$('#ansicht [data-ue-mail]').forEach(async fr => {
    const a = ausgabeVon(fr.dataset.ueMail); if (!a) return;
    try { const v = await api('POST', 'vorschau', { ausgabe: ausgabeDaten(a), bearbeiten: false }); fr.onload = () => { try { nurLesen(fr.contentDocument); fr.classList.add('da'); } catch (e) { /* fremd */ } }; fr.srcdoc = v.html; } catch (e) { /* Vorschau ist Zugabe */ }
  });
}
function listenKacheln() {
  const L = D().listen; if (!L.length) return '';
  const Z = { 'l-post': 'mail', 'l-hotel': 'haus', 'l-gastro': 'karte', 'l-kicheck': 'suche' };
  return `<h2 class="wo-zw">Nach <em>Liste</em></h2><div class="wo-aufg">${L.slice(0, 4).map(l => { const d = inListe(l.id), b = d.filter(e => e.stand === 'bestätigt').length;
    return `<button class="wo-ag" type="button" data-gehe="empfaenger" data-wahl="${esc(l.id)}"><span class="wo-ag__b"><img src="${esc(listenBild(l.id))}" alt="" width="900" height="675" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(Z[l.id] || 'person')}</i><b>${esc(l.name)}</b><span>${d.length ? mal(b, 'eine bestätigt', 'bestätigt') + ' · ' + mal(d.length, 'eine Adresse', 'Adressen') : 'noch leer'}</span></span></button>`; }).join('')}</div>`;
}
function empfKarte(e) {
  const offen = e.stand === 'angemeldet';
  return `<button class="re-a re-q${offen ? ' re-q--offen' : ''}" type="button" data-gehe="empfaenger"${offen ? ' data-wahl="angemeldet"' : ''}>
    <span class="re-a__bild" aria-hidden="true"><img src="${esc(F[HERKUNFTBILD[e.herkunft]] || F.studio)}" alt="" width="900" height="675" decoding="async"></span>
    <span class="re-a__n"><span class="re-a__k"><i class="re-q__sp">${esc(e.herkunft || 'Website')}</i>${esc(e.haus || 'ohne Haus')}</span><b>${esc(e.name || e.mail)}</b><small>${esc(e.mail)} · ${esc((e.listen || []).map(listenName).join(', ') || 'in keiner Liste')}</small></span>
    <span class="re-a__st">${esc(STAND_T[e.stand] || e.stand)}<small>${esc(datumKurz(e.einwilligung))}</small></span></button>`;
}

/* ---------- Ausgaben: der Schreibtisch (Robert 17.11.2026, BRIEFING-SCHREIBTISCH.md) ----------
   Ein Bildschirm, eine Mail. Links der Stapel (Abzüge der Ausgaben), in der Mitte die Mail selbst zum Hineinschreiben (dieselbe Mail, die rausgeht:
   api.py im Bearbeiten-Modus), rechts der Umschlag (Postfach-Zeile, Liste, Probemail, Abschicken). Gespeichert wird von selbst, mit «Gespeichert · Rückgängig».
   Ersetzt Eingang, Karte, Reiter Vorschau/Bausteine und die Leiste unten (Sicherung: newsletter.js.vor-schreibtisch-2026-11-17). */
function glieder(l) { return l.filter(Boolean).map(x => `<span class="re-gl">${x}</span>`).join(''); }
function karteAusgabe(a, i = 0) {
  const vers = a.stand === 'versendet';
  return `<button class="re-a${vers ? ' erledigt' : ' neu'}" style="--i:${i}" type="button" data-gehe="ausgaben" data-wahl="${esc(a.id)}">
    ${bild(ausgabeBild(a), 're-a__bild')}
    <span class="re-a__n"><span class="re-a__k re-gl-r">${glieder(['Nr. ' + esc(a.nummer), esc(datumKurz(vers ? a.versendet_am : a.geaendert)), esc(listenName(a.liste))])}</span><b>${esc(a.titel || 'Ohne Titel')}</b><small>${esc(a.betreff || 'ohne Betreff')} · ${mal((a.bausteine || []).length, 'ein Baustein', 'Bausteine')}</small></span>
    <span class="re-a__st">${vers ? 'Verschickt' : 'Entwurf'}</span></button>`;
}
function monatVon(iso) { const t = tageSeit(iso); if (t != null && t < 7) return 'Diese Woche'; const [j, m] = String(iso || '').split('-').map(Number); return j ? MONATE[m - 1] + ' ' + j : 'Früher'; }

function abzug(a) {
  const vers = a.stand === 'versendet';
  return `<button class="tisch-abzug${S.wahl === a.id ? ' aktiv' : ''}${vers ? ' vers' : ''}" type="button" data-wahl="${esc(a.id)}">
    <span class="tisch-abzug__bild"><img src="${esc(ausgabeBild(a))}" alt="" width="900" height="675" decoding="sync"></span>
    <span class="tisch-abzug__t"><small>Nr. ${esc(a.nummer)} · ${vers ? 'verschickt' : 'Entwurf'}</small><b>${esc(a.titel || 'Ohne Titel')}</b><em>${vers ? esc(datumKurz(a.versendet_am)) + ' · an ' + esc(mal(a.empfaenger_zahl, 'einen Empfänger', 'Empfänger')) : esc(listenName(a.liste))}</em></span></button>`;
}
function stapelListe() {
  const f = S.filter, jede = ausgabenSortiert();
  const l = f === 'alle' ? jede : jede.filter(a => (f === 'versendet') === (a.stand === 'versendet'));
  return l.map(abzug).join('') || `<p class="tisch-band__leer">${f === 'versendet' ? 'Noch nichts verschickt.' : 'Kein Entwurf offen. Über das Plus eine neue Ausgabe anfangen.'}</p>`;
}
/* Der Schreibtisch (Robert 17.11.2026, zweite Fassung): oben das Band mit allen Ausgaben, darunter die Mail als volle dunkle Fläche, rechts der Umschlag.
   Am Rechner füllt der Tisch genau den Bildschirm, jede Fläche reicht bis unten, Mail und Umschlag rollen in sich. */
function eingang() {
  const jede = ausgabenSortiert();
  if (!jede.length) return `<div class="tisch tisch--leer"><div class="re-leer platte">${ZEICHEN}<b>Noch keine Ausgabe.</b><p>Über «Neue Ausgabe» eine Vorlage wählen und hineinschreiben.</p><p>${WO.knopf('Neue Ausgabe', 'plus', 'gold', { attr: 'data-neu' })}</p></div></div>`;
  if (!S.wahl || !ausgabeVon(S.wahl)) {
    const f = S.filter, l = f === 'alle' ? jede : jede.filter(a => (f === 'versendet') === (a.stand === 'versendet'));
    waehle((l[0] || jede[0]).id);
  }
  const f = S.filter;
  return `<div class="tisch" id="tisch">
    <nav class="tisch-band" aria-label="Ausgaben">
      <div class="tisch-band__kopf">
        <div class="tisch-band__zeile"><h2>Die <em>Post</em></h2><button class="tisch-neu" type="button" data-neu aria-label="Neue Ausgabe" title="Neue Ausgabe">${SYM.plus}</button></div>
        <p class="tisch-band__satz">${esc(mal(entwuerfe().length, 'Ein Entwurf', 'Entwürfe'))} in Arbeit, ${esc(mal(archiv().length, 'eine Ausgabe', 'Ausgaben'))} verschickt.</p>
        <div class="wahl2 tisch-filter" role="group" aria-label="Auswahl">${[['entwurf', 'Entwürfe'], ['versendet', 'Verschickt'], ['alle', 'Alle']].map(([k, t]) => `<button type="button" data-filter="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div>
      </div>
      <div class="tisch-band__l" id="stapel">${stapelListe()}</div>
    </nav>
    <section class="tisch-blatt" id="blatt">${blatt()}</section>
    <aside class="tisch-umschlag" id="umschlag" aria-label="Umschlag">${umschlag()}</aside>
  </div>`;
}
function blatt() {
  const h = S.geraet === 'handy', vers = S.E && S.E.stand === 'versendet';
  return `<div class="tisch-blatt__kopf"><div class="tisch-geraet" role="group" aria-label="Gerät"><button type="button" data-geraet="rechner" aria-pressed="${!h}">Rechner</button><button type="button" data-geraet="handy" aria-pressed="${h}">Handy</button></div>
      <p>${vers ? 'So ist sie rausgegangen. Verschickte Post bleibt, wie sie war.' : 'Direkt hineinschreiben, gespeichert wird von selbst.'}</p></div>
    <div class="tisch-papier${h ? ' handy' : ''}" id="papier"><iframe id="v-mail" title="Die Mail zum Hineinschreiben"></iframe></div>`;
}
const KOPF_DA = () => !!(S.E && S.E.bausteine[0] && S.E.bausteine[0].art === 'kopfbild');
function umschlag() {
  const E = S.E; if (!E) return '';
  const vers = E.stand === 'versendet', z = zusammen(E), v = D().versand, ro = vers ? ' readonly' : '';
  const palette = vers ? '' : `<p class="tisch-u__mk">Baustein ans Ende setzen</p>
    <div class="tisch-palette">${ARTEN_WAHL.map(([k, t]) => `<button type="button" data-palette="${k}" title="${k === 'kopfbild' && KOPF_DA() ? 'Kopfbild tauschen' : esc(t) + ' einsetzen'}"><svg viewBox="0 0 64 44" aria-hidden="true">${ABBILD[k]}</svg><b>${esc(k === 'titel' ? 'Titel' : t)}</b></button>`).join('')}</div>`;
  const handy = vers ? `<div class="tisch-u__handy"><p class="tisch-u__mk">So kam sie auf dem Handy an</p><div class="tisch-u__tel" id="u-tel"><iframe title="Die Mail auf dem Handy" tabindex="-1"></iframe></div></div>` : '';
  return `<div class="tisch-u">
    <p class="tisch-u__k">Nr. ${esc(E.nummer)} · ${vers ? 'verschickt am ' + esc(datumKurz(E.versendet_am)) : 'Entwurf'}</p>
    <textarea class="tisch-u__name" id="u-titel" rows="1" placeholder="Name der Ausgabe" aria-label="Name der Ausgabe"${ro}>${esc(E.titel)}</textarea>
    <div class="tisch-pf">
      <span class="tisch-pf__av" aria-hidden="true">T</span>
      <div class="tisch-pf__t"><span class="tisch-pf__von"><b>${esc(v.absender_name || 'Tasty Studios')}</b><small>so steht sie im Postfach</small></span>
        <input id="u-betreff" value="${esc(E.betreff)}" placeholder="Betreff hier eintragen" aria-label="Betreff"${ro}>
        <textarea id="u-vorschau" rows="2" placeholder="Vorschautext, der Satz neben dem Betreff" aria-label="Vorschautext"${ro}>${esc(E.vorschau)}</textarea></div></div>
    <div class="tisch-u__an">
      <label class="tisch-sel"><span class="sr">An</span><select id="u-liste" aria-label="An"${vers ? ' disabled' : ''}>${D().listen.map(l => `<option value="${esc(l.id)}"${l.id === E.liste ? ' selected' : ''}>An ${esc(l.name)}</option>`).join('')}</select></label>
      <p><b>${vers ? esc(E.empfaenger_zahl) : z.bestaetigt}</b><span>${vers ? (E.empfaenger_zahl === 1 ? 'Empfänger hat sie bekommen' : 'Empfänger haben sie bekommen') : (z.bestaetigt === 1 ? 'Empfänger bekommt sie' : 'Empfänger bekommen sie')}${!vers ? (E.probe_am ? '. Letzte Probemail ' + esc(zeit(E.probe_am)) : '. Noch keine Probemail') : ''}.</span></p>
    </div>
    <div class="tisch-u__kn">${vers ? WO.knopf('Als Vorlage nehmen', 'plus', 'gold', { attr: 'data-akt="kopie"' })
      : WO.knopf('Probemail', 'mail', 'hell', { attr: 'data-akt="probe"' }) + WO.knopf('Abschicken', 'pfeil', 'gold', { attr: 'data-akt="versand"', disabled: !z.bestaetigt })}</div>
    ${palette}${handy}
    <div class="tisch-u__fuss">
      <p class="tisch-u__gesp" id="u-gesp" aria-live="polite">${gespText()}</p>
      <div class="tisch-u__wege"><button class="link" type="button" data-akt="fenster">In eigenem Fenster</button><button class="link" type="button" data-akt="weg">Löschen</button></div>
    </div>
  </div>`;
}
/* Am Rechner füllt der Tisch genau die Höhe unter dem Kopf */
const FEST = () => matchMedia('(min-width:1101px)').matches;
function tischMass() {
  const t = $('#tisch'); if (!t) return;
  if (!FEST()) { t.style.height = ''; return; }
  const oben = t.getBoundingClientRect().top + scrollY;
  t.style.height = Math.max(600, innerHeight - oben - 22) + 'px';
  const fr = $('#v-mail'); if (fr) fr.style.height = '';
  telMass();
}
function telMass() {
  const tel = $('#u-tel'), fr = tel && $('iframe', tel); if (!fr) return;
  const k = tel.clientWidth / 390; fr.style.transform = `scale(${k})`; fr.style.height = Math.ceil(tel.clientHeight / k) + 'px';
}
addEventListener('resize', () => {
  if (S.ansicht !== 'ausgaben') return;
  randPruefen(); tischMass(); hoehe();
});

/* ---------- Auswahl, Stand, Speichern von selbst ---------- */
function waehle(id) {
  const a = ausgabeVon(id); if (!a) return;
  if (S.E && S.E.id !== id && S.E.wartet) speichern().catch(fehler);
  S.wahl = id; setzeE(a); S.vorschau = null;
}
function setzeE(a) {
  S.E = JSON.parse(JSON.stringify(a)); S.E.wartet = false; S.Eorig = JSON.stringify(a);
  S.zuletzt = INHALT(a);
  const erster = (a.bausteine || []).find(b => b.art === 'titel');
  S.titelFolgt = !a.titel || a.titel === 'Neue Ausgabe' || (erster && erster.text === a.titel);
  leiste();
}
const ausgabeDaten = E => { const a = JSON.parse(JSON.stringify(E)); delete a.wartet; return a; };
function zusammen(E) { const d = inListe(E.liste); return { alle: d.length, bestaetigt: d.filter(e => e.stand === 'bestätigt').length, warten: d.filter(e => e.stand === 'angemeldet').length, ab: d.filter(e => e.stand === 'abgemeldet').length }; }
const ausgabeText = a => a ? `«${a.titel || 'ohne Titel'}», ${mal((a.bausteine || []).length, 'ein Baustein', 'Bausteine')}, Betreff «${a.betreff || 'leer'}», ${a.stand === 'versendet' ? 'verschickt' : 'Entwurf'}` : '';
const INHALT = a => JSON.parse(JSON.stringify({ titel: a.titel || '', betreff: a.betreff || '', vorschau: a.vorschau || '', liste: a.liste || '', bausteine: a.bausteine || [] }));
S.ver = 0; S.rueck = [];
let sUhr = 0;
function gespText() {
  const E = S.E;
  if (!E || E.stand === 'versendet') return 'Verschickte Post bleibt, wie sie rausging.';
  if (S.speichert) return 'Speichert …';
  if (E.wartet) return 'Noch nicht gespeichert';
  if (S.gespZeit) return `Gespeichert ${esc(S.gespZeit)}${S.rueck.some(r => r.id === E.id) ? ' · <button class="link" type="button" data-rueck>Rückgängig</button>' : ''}`;
  return 'Alles gespeichert';
}
function gespZeigen() {
  const g = $('#u-gesp'); if (!g) return;
  g.innerHTML = gespText();
  const r = $('[data-rueck]', g); if (r) r.onclick = () => zurueck().catch(fehler);
}
/* jede Eingabe: merken, nach einer kurzen Pause von selbst speichern */
function geaendert() {
  const E = S.E; if (!E || E.stand === 'versendet') return;
  S.ver++; E.wartet = true; gespZeigen();
  clearTimeout(sUhr); sUhr = setTimeout(() => speichern().catch(fehler), 1100);
}
async function speichern() {
  clearTimeout(sUhr);
  const E = S.E; if (!E || !E.wartet) return;
  if (S.speichert) { await S.speichert; return E.wartet ? speichern() : undefined; }
  const v0 = S.ver, vorher = S.zuletzt, daten = ausgabeDaten(E);
  S.speichert = (async () => {
    gespZeigen();
    const r = await api('PUT', 'ausgaben/' + encodeURIComponent(E.id), daten);
    const n = D().ausgaben.findIndex(a => a.id === r.ausgabe.id); if (n >= 0) D().ausgaben[n] = r.ausgabe;
    S.rueck.push({ id: E.id, inhalt: vorher }); if (S.rueck.length > 40) S.rueck.shift();
    S.zuletzt = INHALT(daten); S.Eorig = JSON.stringify(r.ausgabe); E.geaendert = r.ausgabe.geaendert;
    if (S.ver === v0) E.wartet = false;
    const d = new Date(); S.gespZeit = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    abzugFrisch(E.id); rand();
  })();
  try { await S.speichert; } finally { S.speichert = null; gespZeigen(); }
  if (E.wartet && S.ver !== v0) { clearTimeout(sUhr); sUhr = setTimeout(() => speichern().catch(fehler), 1100); }
}
/* «Rückgängig»: der Stand vor dem letzten Speichern. Nimmt nur den Inhalt zurück, nie Stand, Probemail oder Versand. */
async function zurueck() {
  const E = S.E; if (!E) return;
  let i = S.rueck.length - 1; while (i >= 0 && S.rueck[i].id !== E.id) i--;
  if (i < 0) return;
  if (S.speichert) await S.speichert;
  const [eintrag] = S.rueck.splice(i, 1), jetzt = INHALT(E);
  await ladeAlles();
  const srv = ausgabeVon(E.id);
  if (!srv) throw new Error('KONFLIKT · Die Ausgabe gibt es inzwischen nicht mehr. Rückgängig wurde nicht ausgeführt.');
  if (srv.stand === 'versendet') throw new Error('KONFLIKT · Die Ausgabe ist inzwischen verschickt. Rückgängig hätte das Archiv überschrieben und wurde nicht ausgeführt.');
  const r = await api('PUT', 'ausgaben/' + encodeURIComponent(E.id), Object.assign(JSON.parse(JSON.stringify(srv)), eintrag.inhalt));
  await ladeAlles(); setzeE(r.ausgabe); S.gespZeit = '';
  tischNeu();
  const [v, n] = unterschied([['Name', jetzt.titel, r.ausgabe.titel], ['Betreff', jetzt.betreff, r.ausgabe.betreff], ['Bausteine', jetzt.bausteine.length, r.ausgabe.bausteine.length]]);
  quit('Rückgängig gemacht', `Vorher: ${v === 'nichts geändert' ? 'Text geändert' : v}\nNachher: ${n === 'nichts geändert' ? 'Text wie zuvor' : n}`, [], false, 5000);
}
function abzugFrisch(id) {
  const k = $(`#stapel .tisch-abzug[data-wahl="${CSS.escape(id)}"]`), a = ausgabeVon(id); if (!k || !a) return;
  const t = document.createElement('div'); t.innerHTML = abzug(Object.assign({}, a, S.E && S.E.id === id ? { titel: S.E.titel } : {})).trim();
  const n = t.firstChild; n.onclick = () => tischWechsel(id); k.replaceWith(n);
}
/* eine andere Ausgabe auf den Tisch legen: der Stapel bleibt stehen */
function tischWechsel(id) {
  if (id === S.wahl) return;
  waehle(id);
  $$('#stapel .tisch-abzug').forEach(k => k.classList.toggle('aktiv', k.dataset.wahl === id));
  $('#blatt').innerHTML = blatt(); $('#umschlag').innerHTML = umschlag(); verbindeTisch(false);
  const k = $(`#stapel .tisch-abzug[data-wahl="${CSS.escape(id)}"]`); if (k) k.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  if (!FEST()) $('#blatt').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function tischNeu() {
  if (S.ansicht !== 'ausgaben' || !$('#blatt')) return zeichne();
  $('#stapel').innerHTML = stapelListe(); $('#blatt').innerHTML = blatt(); $('#umschlag').innerHTML = umschlag(); verbindeTisch(true);
}

function verbindeEingang() { verbindeTisch(true); }
function verbindeTisch(stapelAuch) {
  if (stapelAuch) {
    $$('.tisch-filter [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; $$('.tisch-filter [data-filter]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#stapel').innerHTML = stapelListe(); verbindeStapel(); });
    verbindeStapel();
  }
  if (!S.E) return;
  $$('#blatt [data-akt]').forEach(b => b.onclick = () => aktion(b.dataset.akt));
  $$('#blatt [data-geraet]').forEach(b => b.onclick = () => { S.geraet = b.dataset.geraet; $$('#blatt [data-geraet]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#papier').classList.toggle('handy', S.geraet === 'handy'); setTimeout(hoehe, 520); hoehe(); });
  verbindeUmschlag();
  tischMass(); requestAnimationFrame(tischMass);
  blattLaden();
}
function verbindeStapel() { $$('#stapel .tisch-abzug').forEach(k => k.onclick = () => tischWechsel(k.dataset.wahl)); }

/* ---------- Die Mail auf dem Tisch ---------- */
let vUhr = 0;
function blattLaden(nachher) {
  clearTimeout(vUhr);
  vUhr = setTimeout(async () => {
    const fr = $('#v-mail'); if (!fr || !S.E) return;
    const ed = S.E.stand !== 'versendet', pap = $('#papier');
    try {
      const v = await api('POST', 'vorschau', { ausgabe: ausgabeDaten(S.E), bearbeiten: ed });
      if ($('#v-mail') !== fr) return;
      const y = scrollY, iy = (() => { try { return fr.contentWindow.scrollY || 0; } catch (e) { return 0; } })(); if (!FEST()) pap.style.minHeight = pap.offsetHeight + 'px';
      fr.onload = () => {
        try { const d = fr.contentDocument; ed ? schreibbar(d) : nurLesen(d); hoehe(); $$('img', d).forEach(i => { if (!i.complete) i.addEventListener('load', hoehe); }); if (iy) fr.contentWindow.scrollTo(0, iy); if (nachher) nachher(d); } catch (e) { fehler(e); }
        pap.style.minHeight = ''; if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' });
      };
      fr.srcdoc = v.html;
      const tel = $('#u-tel iframe'); if (tel && !ed) { tel.onload = () => { nurLesen(tel.contentDocument); telMass(); }; tel.srcdoc = v.html; }
    } catch (e) { fehler(e); }
  }, 40);
}
function hoehe() { const fr = $('#v-mail'); if (!fr) return; if (FEST()) { fr.style.height = ''; return; } try { fr.style.height = fr.contentDocument.documentElement.scrollHeight + 'px'; } catch (e) { /* fremd */ } }
function nurLesen(d) { d.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true); }
const TISCH_CSS = `
.nb{position:relative}
.nb-inhalt{position:relative}
[data-k]{outline:0;white-space:pre-wrap;cursor:text;border-radius:6px;transition:box-shadow .25s}
[data-k]:hover{box-shadow:0 0 0 7px rgba(199,180,137,.07)}
[data-k]:focus{box-shadow:0 0 0 7px rgba(199,180,137,.13)}
[data-k][data-leer]::before{content:attr(data-ph);color:rgba(243,236,226,.34);pointer-events:none}
[data-mehr]:not(:has(p)){margin:0 0 18px;font-family:'Instrument Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#e6dfd3}
.nb-bildleer,[data-wahl=projekt]{cursor:pointer}
.nb-bildleer{display:grid;place-items:center;background:repeating-linear-gradient(135deg,rgba(243,236,226,.05) 0 10px,rgba(243,236,226,.02) 10px 20px);box-shadow:inset 0 0 0 1px rgba(199,180,137,.35)}
.nb-bildleer::after{content:'Bild wählen';font:400 11px/1 'DM Mono',Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#c7b489}
div[data-wahl=projekt].nb-bildleer::after{content:'Projekt wählen'}
img[data-bild]{cursor:pointer;transition:filter .25s}
img[data-bild]:hover{filter:brightness(1.08)}
[data-ziel]{cursor:pointer}
.nb-g{position:absolute;left:-34px;top:0;display:flex;flex-direction:column;gap:5px;opacity:0;transition:opacity .2s;z-index:3}
.nb:hover>.nb-g,.nb:focus-within>.nb-g{opacity:1}
.nb[data-art=kopfbild]>.nb-g{left:14px;top:14px;flex-direction:row}
.nb-g button{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:50%;cursor:pointer;color:#f3ece2;background:rgba(45,50,80,.92);box-shadow:0 0 0 1px rgba(235,219,206,.2),0 6px 12px -6px rgba(0,0,0,.8)}
.nb-g button:hover{background:#c7b489;color:#111421}
.nb-g .nb-z{cursor:grab}
.nb-g svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.nb.zieht{opacity:.45}
.nb-linie{position:absolute;left:0;right:0;top:0;height:2px;border-radius:2px;background:#c7b489;pointer-events:none;z-index:4}
.nb-plus{position:relative;height:0;z-index:2}
.nb-plus::after{content:'';position:absolute;left:0;right:0;top:-11px;height:22px}
.nb-plus>span{position:absolute;left:0;right:0;top:0;height:1px;background:rgba(199,180,137,.5);opacity:0;transition:opacity .2s}
.nb-plus>button{position:absolute;left:50%;top:-12px;z-index:3;display:grid;place-items:center;width:24px;height:24px;margin-left:-12px;padding:0;border:0;border-radius:50%;cursor:pointer;color:#111421;background:#c7b489;box-shadow:0 6px 12px -6px rgba(0,0,0,.8);opacity:0;transform:scale(.7);transition:opacity .2s,transform .25s cubic-bezier(.2,.9,.25,1.2)}
.nb-plus:hover>span,.nb-plus:hover>button{opacity:1}
.nb-plus:hover>button{transform:scale(1)}
.nb-plus svg,.nb-ende svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round}
.nb-ende{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin:0 0 22px;padding:14px;border:0;border-radius:14px;cursor:pointer;font:400 11px/1 'DM Mono',Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(199,180,137,.75);background:none;box-shadow:inset 0 0 0 1px rgba(199,180,137,.22);transition:color .2s,box-shadow .2s}
.nb-ende:hover{color:#c7b489;box-shadow:inset 0 0 0 1px rgba(199,180,137,.6)}
@media (max-width:620px){.nb-g{left:-23px}.nb-g button{width:20px;height:20px}}
`;
const leerSetzen = el => el.toggleAttribute('data-leer', !el.textContent.trim());
const ZIEHEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5v.01M10 3.5v.01M6 8v.01M10 8v.01M6 12.5v.01M10 12.5v.01" stroke-width="2.4"/></svg>';
const KETTE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 9a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.8.8M9 7a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.8-.8"/></svg>';
/* Die Mail im Rahmen beschreibbar machen: jedes gekennzeichnete Feld nimmt Text an, Bausteine bekommen am Rand Verschieben und Entfernen, dazwischen ein Plus */
function schreibbar(d) {
  const E = S.E;
  const st = d.createElement('style'); st.textContent = TISCH_CSS; d.head.appendChild(st);
  d.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true);
  d.addEventListener('pointerdown', e => { if (!e.target.closest('.nb-plus, .nb-ende, [data-bild], [data-wahl], [data-ziel], .nb-k')) popZu(); });
  $$('[data-k]', d).forEach(el => {
    el.contentEditable = 'plaintext-only'; if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    const nb = el.closest('.nb'), i = +nb.dataset.b, k = el.dataset.k, mehr = !!el.dataset.mehr;
    if (mehr && !el.textContent.trim()) el.innerHTML = '';
    leerSetzen(el);
    el.addEventListener('input', () => {
      const b = E.bausteine[i]; if (!b) return;
      const t = (mehr ? el.innerText.replace(/\n{3,}/g, '\n\n') : el.innerText.replace(/\s*\n+\s*/g, ' ')).replace(/\s+$/, '');
      b[k] = t; leerSetzen(el);
      if (b.art === 'titel' && k === 'text' && S.titelFolgt && E.bausteine.find(x => x.art === 'titel') === b) { E.titel = t; const n = $('#u-titel'); if (n) n.value = t; }
      geaendert(); hoehe();
    });
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      if (!mehr) { e.preventDefault(); el.blur(); }
      else if (!e.shiftKey) { e.preventDefault(); d.execCommand('insertText', false, '\n\n'); }
    });
    el.addEventListener('paste', e => { if (el.contentEditable === 'plaintext-only') return; e.preventDefault(); d.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
  });
  $$('[data-bild]', d).forEach(el => el.addEventListener('click', () => bildPop(+el.closest('.nb').dataset.b, el)));
  $$('[data-wahl=projekt]', d).forEach(el => el.addEventListener('click', e => { e.preventDefault(); projektPop(+el.closest('.nb').dataset.b, el); }));
  $$('[data-ziel]', d).forEach(el => { if (!el.dataset.k) el.addEventListener('click', () => zielPop(+el.closest('.nb').dataset.b, el.dataset.ziel, el)); });
  const inhalt = $('.nb-inhalt', d);
  $$('.nb', d).forEach(nb => {
    const i = +nb.dataset.b, art = nb.dataset.art, g = d.createElement('div'); g.className = 'nb-g';
    g.innerHTML = (art !== 'kopfbild' ? `<button type="button" class="nb-z" title="Ziehen zum Verschieben" aria-label="Verschieben">${ZIEHEN}</button>` : '') +
      (art === 'knopf' ? `<button type="button" class="nb-k" title="Ziel des Knopfs" aria-label="Ziel des Knopfs">${KETTE}</button>` : '') +
      `<button type="button" class="nb-x" title="Entfernen" aria-label="Baustein entfernen">${SYM.korb}</button>`;
    nb.appendChild(g);
    $('.nb-x', g).onclick = () => bausteinWeg(i);
    const kk = $('.nb-k', g); if (kk) kk.onclick = () => zielPop(i, 'link', kk);
    const z = $('.nb-z', g); if (z) ziehbar(z, nb, inhalt, d);
  });
  if (!inhalt) return;
  /* Plus vor jedem Baustein im Inhalt und eines am Ende */
  $$(':scope > .nb', inhalt).forEach(nb => {
    const p = d.createElement('div'); p.className = 'nb-plus';
    p.innerHTML = `<span></span><button type="button" aria-label="Baustein hier einfügen" title="Baustein einfügen">${SYM.plus}</button>`;
    inhalt.insertBefore(p, nb);
    $('button', p).onclick = () => einfuegenPop(+nb.dataset.b, $('button', p));
  });
  const ende = d.createElement('button'); ende.type = 'button'; ende.className = 'nb-ende'; ende.innerHTML = SYM.plus + 'Baustein hinzufügen';
  inhalt.appendChild(ende); ende.onclick = () => einfuegenPop(E.bausteine.length, ende);
}
function ziehbar(z, nb, inhalt, d) {
  z.addEventListener('pointerdown', ev => {
    ev.preventDefault(); popZu();
    z.setPointerCapture(ev.pointerId);
    const linie = d.createElement('div'); linie.className = 'nb-linie'; inhalt.appendChild(linie); nb.classList.add('zieht');
    const bl = () => $$(':scope > .nb', inhalt);
    let ziel = bl().indexOf(nb);
    const bewegt = e => {
      const l = bl(); let n = l.length;
      for (let k = 0; k < l.length; k++) { const r = l[k].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { n = k; break; } }
      ziel = n;
      const ref = l[n], top = ref ? ref.offsetTop - 6 : l.length ? l[l.length - 1].offsetTop + l[l.length - 1].offsetHeight + 2 : 0;
      linie.style.transform = `translate3d(0,${top}px,0)`;
    };
    bewegt(ev);
    const los = () => {
      z.removeEventListener('pointermove', bewegt); z.removeEventListener('pointerup', los); z.removeEventListener('pointercancel', los);
      linie.remove(); nb.classList.remove('zieht');
      const l = bl(), von = l.indexOf(nb); if (ziel === von || ziel === von + 1) return;
      const idx = l.map(x => +x.dataset.b), vonI = +nb.dataset.b;
      let nach = ziel < idx.length ? idx[ziel] : S.E.bausteine.length;
      const [x] = S.E.bausteine.splice(vonI, 1); if (nach > vonI) nach--;
      S.E.bausteine.splice(nach, 0, x); geaendert(); blattLaden();
    };
    z.addEventListener('pointermove', bewegt); z.addEventListener('pointerup', los); z.addEventListener('pointercancel', los);
  });
}
function bausteinWeg(i) {
  const E = S.E, alt = E.bausteine.splice(i, 1)[0]; if (!alt) return;
  popZu(); geaendert(); blattLaden();
  quit((ARTEN[alt.art] || 'Baustein') + ' entfernt', `Vorher: ${ARTEN[alt.art] || alt.art} an Stelle ${i + 1}\nNachher: nicht mehr in der Ausgabe`, [['Rückgängig', () => { E.bausteine.splice(i, 0, alt); geaendert(); blattLaden(); }]], false, 10000);
}

/* ---------- kleine Tafeln neben der Mail (Baustein einfügen, Bild, Projekt, Ziel) ---------- */
function popZu() { $$('.tisch-pop').forEach(p => p.remove()); document.removeEventListener('pointerdown', popAussen, true); }
function popAussen(e) { if (!e.target.closest('.tisch-pop')) popZu(); }
function pop(anker, html, wire, breit = 0) {
  popZu();
  const fr = $('#v-mail'), fr_r = fr.getBoundingClientRect(), r = anker.getBoundingClientRect();
  const p = document.createElement('div'); p.className = 'tisch-pop'; if (breit) p.style.width = breit + 'px';
  p.innerHTML = html; document.body.appendChild(p);
  const w = p.offsetWidth, x = fr_r.left + r.left + r.width / 2 - w / 2;
  p.style.left = Math.round(Math.max(16, Math.min(x, innerWidth - w - 16))) + 'px';
  const h = p.offsetHeight; let y = fr_r.top + r.bottom + 12;
  if (FEST() && y + h > innerHeight - 16) y = fr_r.top + r.top - 12 - h >= 16 ? fr_r.top + r.top - 12 - h : Math.max(16, innerHeight - h - 16);
  p.style.top = Math.round(y + scrollY) + 'px';
  wire(p);
  setTimeout(() => document.addEventListener('pointerdown', popAussen, true), 0);
  if (!FEST()) { const unten = y + h + 24 - innerHeight; if (unten > 0) scrollBy({ top: unten, behavior: 'smooth' }); }
  else { try { const w = fr.contentWindow, y0 = w.scrollY, weg = () => { if (Math.abs(w.scrollY - y0) > 40) { w.removeEventListener('scroll', weg); popZu(); } }; w.addEventListener('scroll', weg); } catch (e) { /* fremd */ } }
}
const ARTEN_WAHL = [['titel', 'Überschrift'], ['text', 'Text'], ['bild', 'Bild'], ['zitat', 'Zitat'], ['knopf', 'Knopf'], ['kopfbild', 'Kopfbild'], ['projekt', 'Projekt'], ['meldung', 'Neuigkeit'], ['termin', 'Termin'], ['gruss', 'Gruss']];
/* gezeichnete Abbilder der Bausteine statt Wörter */
const ABBILD = {
  titel: '<rect x="10" y="17" width="44" height="9" rx="2" fill="#f3ece2"/>',
  text: '<rect x="10" y="12" width="44" height="3" rx="1.5" fill="#a59f94"/><rect x="10" y="19" width="40" height="3" rx="1.5" fill="#a59f94"/><rect x="10" y="26" width="44" height="3" rx="1.5" fill="#a59f94"/><rect x="10" y="33" width="26" height="3" rx="1.5" fill="#a59f94"/>',
  bild: '<rect x="10" y="9" width="44" height="27" rx="4" fill="#2d3250"/><path d="M14 32l10-11 8 8 5-5 13 8z" fill="#c7b489"/><circle cx="44" cy="16" r="3" fill="#f3ece2"/>',
  zitat: '<rect x="12" y="11" width="2" height="22" fill="#c7b489"/><rect x="19" y="14" width="34" height="4" rx="2" fill="#f3ece2"/><rect x="19" y="22" width="26" height="4" rx="2" fill="#f3ece2"/><rect x="19" y="30" width="14" height="2" rx="1" fill="#a59f94"/>',
  knopf: '<rect x="14" y="16" width="36" height="13" rx="6.5" fill="#f3ece2"/><rect x="21" y="21" width="22" height="3" rx="1.5" fill="#111421"/>',
  projekt: '<rect x="9" y="8" width="46" height="29" rx="5" fill="#2d3250"/><rect x="14" y="13" width="12" height="2" rx="1" fill="#c7b489"/><rect x="14" y="18" width="24" height="5" rx="1.5" fill="#f3ece2"/><rect x="14" y="27" width="34" height="2.5" rx="1.2" fill="#a59f94"/>',
  meldung: '<rect x="9" y="11" width="16" height="13" rx="2.5" fill="#c7b489"/><rect x="29" y="12" width="24" height="4" rx="2" fill="#f3ece2"/><rect x="29" y="20" width="20" height="2.5" rx="1.2" fill="#a59f94"/><rect x="9" y="28" width="16" height="7" rx="2" fill="#2d3250"/><rect x="29" y="30" width="22" height="2.5" rx="1.2" fill="#a59f94"/>',
  termin: '<rect x="9.5" y="8.5" width="45" height="28" rx="5" fill="none" stroke="#c7b489"/><rect x="15" y="14" width="22" height="5" rx="1.5" fill="#f3ece2"/><rect x="15" y="24" width="8" height="2" rx="1" fill="#c7b489"/><rect x="26" y="24" width="18" height="2" rx="1" fill="#a59f94"/><rect x="15" y="29" width="8" height="2" rx="1" fill="#c7b489"/><rect x="26" y="29" width="12" height="2" rx="1" fill="#a59f94"/>',
  gruss: '<rect x="10" y="15" width="24" height="3" rx="1.5" fill="#a59f94"/><rect x="10" y="23" width="34" height="7" rx="2" fill="#f3ece2"/>',
  kopfbild: '<rect x="2" y="6" width="60" height="22" fill="#2d3250"/><path d="M2 28l16-12 12 9 9-6 23 9z" fill="#c7b489"/><rect x="10" y="32" width="30" height="4" rx="2" fill="#f3ece2"/>'
};
function einsetzen(art, an) {
  const E = S.E; if (!E || E.stand === 'versendet') return;
  if (art === 'kopfbild' && KOPF_DA()) {   // es gibt schon eins: tauschen statt ein zweites
    const d = $('#v-mail').contentDocument, nb = d && $('.nb[data-b="0"]', d), bi = nb && $('[data-bild], [data-wahl]', nb);
    if (bi) { nb.scrollIntoView({ block: 'nearest' }); bildPop(0, bi); }
    return;
  }
  const v = D().versand, n = { art };
  if (art === 'projekt') n.projekt = D().projekte[0] ? D().projekte[0].id : '';
  if (art === 'knopf') { n.text = ''; n.link = v.seite || ''; }
  if (art === 'gruss') { n.text = 'Herzliche Grüsse'; n.von = v.absender_name || ''; }
  const stelle = art === 'kopfbild' ? 0 : Math.max(an, KOPF_DA() ? 1 : 0);
  E.bausteine.splice(stelle, 0, n); geaendert();
  if (art === 'kopfbild') { $('#umschlag').innerHTML = umschlag(); verbindeUmschlag(); }
  blattLaden(d => {
    const nb = $(`.nb[data-b="${stelle}"]`, d); if (!nb) return;
    nb.scrollIntoView({ block: 'center' });
    const f = $('[data-k]', nb), bi = $('[data-bild], [data-wahl]', nb);
    if (['bild', 'kopfbild'].includes(art) && bi) setTimeout(() => bildPop(stelle, bi), 60);
    else if (f) f.focus();
  });
}
/* aus der Palette: ans Ende, vor einen Gruss am Schluss */
function palette(art) {
  const B = (S.E || {}).bausteine || [], letzter = B[B.length - 1];
  einsetzen(art, art !== 'gruss' && letzter && letzter.art === 'gruss' ? B.length - 1 : B.length);
}
function einfuegenPop(an, anker) {
  const E = S.E, mitKopf = !(E.bausteine[0] && E.bausteine[0].art === 'kopfbild');
  const l = ARTEN_WAHL.filter(([k]) => k !== 'kopfbild' || mitKopf);
  pop(anker, `<p class="tisch-pop__k">Baustein einfügen</p><div class="tisch-wahl tisch-wahl--${l.length}">${l.map(([k, t]) => `<button type="button" data-art="${k}"><svg viewBox="0 0 64 44" aria-hidden="true">${ABBILD[k]}</svg><b>${t}</b></button>`).join('')}</div>`, p => {
    $$('[data-art]', p).forEach(b => b.onclick = () => { popZu(); einsetzen(b.dataset.art, an); });
  }, l.length === 10 ? 470 : 330);
}
const BILDWAHL = ['faehre', 'studio', 'tafel', 'bar', 'terrasse', 'empfang', 'zimmer', 'aussen', 'anleger', 'speicherstadt', 'plan', 'bildschirm'];
function bildPop(i, anker) {
  const b = S.E.bausteine[i]; if (!b) return;
  pop(anker, `<p class="tisch-pop__k">Bild wählen</p><div class="tisch-bilder">${BILDWAHL.filter(k => F[k]).map(k => `<button type="button" data-f="${esc(F[k])}"${b.link === F[k] ? ' aria-pressed="true"' : ''}><img src="${esc(F[k])}" alt="" width="900" height="675" loading="lazy"></button>`).join('')}</div>
    <label class="tisch-pop__feld"><span>Oder eine Bildadresse</span><input id="pop-link" value="${esc(/^\/grundlagen\//.test(b.link || '') ? '' : b.link || '')}" placeholder="https://…"></label>
    <div class="tisch-pop__kn"><button class="link" type="button" data-zu>Abbrechen</button>${WO.knopf('Übernehmen', 'haken', 'gold', { klein: true, attr: 'data-ok' })}</div>`, p => {
    const setze = link => { b.link = link; popZu(); geaendert(); blattLaden(); };
    $$('[data-f]', p).forEach(x => x.onclick = () => setze(x.dataset.f));
    $('[data-zu]', p).onclick = popZu;
    $('[data-ok]', p).onclick = () => { const v = $('#pop-link', p).value.trim(); if (v) setze(v); else popZu(); };
    $('#pop-link', p).onkeydown = e => { if (e.key === 'Enter') $('[data-ok]', p).click(); };
  }, 400);
}
function projektPop(i, anker) {
  const b = S.E.bausteine[i]; if (!b) return;
  pop(anker, `<p class="tisch-pop__k">Projekt aus dem Atelier</p><div class="tisch-liste">${D().projekte.map(x => `<button type="button" data-p="${esc(x.id)}"${x.id === b.projekt ? ' aria-pressed="true"' : ''}><b>${esc(x.name)}</b><small>${esc(x.haus)}</small></button>`).join('')}</div>`, p => {
    $$('[data-p]', p).forEach(x => x.onclick = () => { b.projekt = x.dataset.p; popZu(); geaendert(); blattLaden(); });
  }, 340);
}
function zielPop(i, k, anker) {
  const b = S.E.bausteine[i]; if (!b) return;
  pop(anker, `<p class="tisch-pop__k">${k === 'link' ? 'Wohin der Knopf führt' : 'Wohin «Mehr dazu» führt'}</p>
    <label class="tisch-pop__feld"><span>Adresse</span><input id="pop-ziel" value="${esc(b[k] || '')}" placeholder="https://…"></label>
    <div class="tisch-pop__kn"><button class="link" type="button" data-zu>Abbrechen</button>${WO.knopf('Übernehmen', 'haken', 'gold', { klein: true, attr: 'data-ok' })}</div>`, p => {
    const f = $('#pop-ziel', p); f.focus(); f.select();
    $('[data-zu]', p).onclick = popZu;
    $('[data-ok]', p).onclick = () => { b[k] = f.value.trim(); popZu(); geaendert(); blattLaden(); };
    f.onkeydown = e => { if (e.key === 'Enter') $('[data-ok]', p).click(); };
  }, 340);
}

/* ---------- Knöpfe im Umschlag ---------- */
async function aktion(akt) {
  const E = S.E;
  try {
    if (akt === 'speichern') return await speichern();
    if (akt === 'fenster') {
      const w = window.open('', '_blank');
      const v = await api('POST', 'vorschau', { ausgabe: ausgabeDaten(E) });
      if (w) { w.document.write(v.html); w.document.close(); }
      return;
    }
    if (akt === 'probe') return await probemail();
    if (akt === 'versand') return await abschicken();
    if (akt === 'kopie') {
      if (E.wartet) await speichern();
      const r = await api('POST', 'ausgaben/' + encodeURIComponent(E.id) + '/kopie'); await ladeAlles();
      S.filter = 'entwurf'; waehle(r.ausgabe.id); rand(); zeichne();
      return quittung('Neue Ausgabe Nr. ' + r.ausgabe.nummer + ' aus Nr. ' + E.nummer, 'keine Nr. ' + r.ausgabe.nummer, ausgabeText(r.ausgabe), () => api('DELETE', 'ausgaben/' + encodeURIComponent(r.ausgabe.id)));
    }
    if (akt === 'weg') return fenster(`<h2>Ausgabe <em>löschen?</em></h2><p>Nr. ${esc(E.nummer)} «${esc(E.titel || 'ohne Titel')}» verschwindet${E.stand === 'versendet' ? ' auch aus dem Stapel «Verschickt»' : ''}. Über die Quittung lässt sie sich gleich danach zurückholen.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Behalten</button><button class="kn kn--gefahr" type="button" id="f-los">Löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try {
          clearTimeout(sUhr);
          const r = await api('DELETE', 'ausgaben/' + encodeURIComponent(E.id));
          S.E = null; S.wahl = ''; await ladeAlles(); rand(); zeichne();
          quittung('Ausgabe Nr. ' + E.nummer + ' gelöscht', ausgabeText(r.ausgabe), 'keine Ausgabe', () => api('POST', 'ausgaben', r.ausgabe));
        } catch (e) { fehler(e); }
      });
  } catch (e) { fehler(e); }
}
/* Wechsel mit wartender Änderung: es wird gespeichert, dann geht es weiter (nie still verworfen) */
function fragen(weiter) { speichern().then(weiter).catch(fehler); }

/* ---------- Neue Ausgabe: fertig gestaltete Vorlagen ---------- */
/* Vier Vorlagen, jede als fertig geschriebene Ausgabe zum Abwandeln (Robert 17.11.2026: «wenn du schon Ideenvorlagen reinbringst, dann machst du wenigstens richtig») */
const VORL_FO = '/zentrale/grundlagen/marke/fotos/', VORL_SEITE = () => D().versand.seite || 'https://tastystudios.vercel.app';
const VORL_GRUSS = () => ({ art: 'gruss', text: 'Herzliche Grüsse aus Hamburg', von: D().versand.absender_name || '' });
const VORLAGEN = [
  { k: 'brief', name: 'Der Brief', satz: 'Ein persönlicher Text mit Bild und Gruss, wie ein Brief aus dem Studio.',
    b: () => [{ art: 'titel', text: 'Ein Jahr Studio' },
      { art: 'text', text: 'Seit Dezember 2025 gibt es Tasty Studios. Am Anfang stand eine Frage aus der Gastronomie: Warum sollen nur grosse Ketten etwas von der neuen Technik haben, während kleine Häuser weiter Preislisten von Hand abtippen?\n\nEin Jahr später wissen wir, wo die Arbeit wirklich liegt. Fast nie bei dem, was der Gast sieht. Sie liegt bei der Karte, die an vier Orten stimmen muss, bei der Anfrage um Mitternacht, bei der Preisliste vom Vorjahr, die noch im Netz steht.' },
      { art: 'bild', link: VORL_FO + 'k-morgen-900.webp', alt: 'Morgen im Studio', zeile: 'Die meisten Ausgaben entstehen morgens, bevor das Telefon klingelt.' },
      { art: 'text', text: 'Daran bauen wir weiter. Mit Werkzeugen, die das Team im Haus selbst bedient, und mit Seiten, die so ruhig sind wie ein gutes Haus am Abend.\n\nDanke, dass Sie dabei sind. Wenn Sie eine Frage haben oder etwas, das bei Ihnen jede Woche Zeit frisst: antworten Sie einfach auf diese Mail. Wir lesen jede Antwort selbst.' },
      VORL_GRUSS()] },
  { k: 'atelier', name: 'Aus dem Atelier', satz: 'Ein Projekt gross: Kopfbild, die Geschichte dahinter, Bild, Projektkarte, ein Knopf.',
    b: () => { const p = D().projekte.find(x => x.id === 'p-culinarium') || D().projekte[0] || {};
      return [{ art: 'kopfbild', link: VORL_FO + 'k-tafel-900.webp', alt: 'Ein gedeckter Tisch am Abend' },
        { art: 'titel', text: 'Ein Abend bekommt seine Seite' },
        { art: 'text', text: 'Rudi lädt in Hannover zu Food-Pairing-Abenden ein. Bisher lief alles über Nachrichten: Wann ist der nächste Abend, was gibt es, ist noch ein Platz frei?\n\nJetzt hat jeder Abend seine eigene Seite. Termin, Menü und freie Plätze stehen auf einen Blick, reserviert wird direkt dort. Rudi pflegt die Abende selbst, ohne uns anzurufen.' },
        { art: 'bild', link: VORL_FO + 'k-bar-900.webp', alt: 'Die Bar am Abend', zeile: 'Die Seite zeigt den Abend so, wie er sich anfühlt: dunkel, warm, mit Platz für das Menü.' },
        { art: 'projekt', projekt: p.id || '' },
        { art: 'zitat', text: 'Eine Seite für einen Abend sollte nicht mehr versprechen, als der Abend hält.', von: 'Tasty Studios' },
        { art: 'knopf', text: 'Die Seite ansehen', link: p.link || VORL_SEITE() },
        VORL_GRUSS()]; } },
  { k: 'kurz', name: 'Kurz notiert', satz: 'Drei Neuigkeiten untereinander, je mit Bild, Zeile und Link.',
    b: () => [{ art: 'kopfbild', link: VORL_FO + 'fen-speicherstadt-900.webp', alt: 'Hamburg am Abend' },
      { art: 'titel', text: 'Kurz notiert' },
      { art: 'text', text: 'Drei Dinge aus dem Studio, jedes in einer Minute gelesen.' },
      { art: 'meldung', link: VORL_FO + 'k-m-papier-900.webp', text: 'Karten aus einer Quelle', zeile: 'Die Küche schreibt die Gerichte einmal. Tisch, Tür, Seite und PDF stimmen danach von selbst.', ziel: VORL_SEITE() + '/werkzeuge.html' },
      { art: 'meldung', link: VORL_FO + 'k-empfang-900.webp', text: 'Die Rezeption im Chat', zeile: 'Antwortet nachts aus dem, was das Haus selbst geschrieben hat, und legt offene Fragen dem Team hin.', ziel: VORL_SEITE() + '/#betreuung' },
      { art: 'meldung', link: VORL_FO + 'k-kn-bildschirm-900.webp', text: 'Der KI-Check', zeile: 'Was ChatGPT über Ihr Haus erzählt, neben dem, was stimmt. Auf einer Seite.', ziel: VORL_SEITE() + '/contact.html?anliegen=ki-check' },
      { art: 'knopf', text: 'Alle Werkzeuge ansehen', link: VORL_SEITE() + '/werkzeuge.html' },
      VORL_GRUSS()] },
  { k: 'einladung', name: 'Die Einladung', satz: 'Ein Termin mit Ort und Zeit, dazu ein Knopf zum Zusagen.',
    b: () => [{ art: 'kopfbild', link: VORL_FO + 'fen-anleger-900.webp', alt: 'Der Anleger am Abend' },
      { art: 'titel', text: 'Ein Abend im Studio' },
      { art: 'text', text: 'Einmal im Jahr machen wir die Tür auf. Sie sehen die Werkzeuge so, wie Ihr Team sie benutzen würde: eine Karte ändern, eine Anfrage beantworten, eine Ausgabe wie diese schreiben.\n\nEs gibt etwas zu essen, kein Programm und keine Vorträge. Wer eine Frage zu seinem Haus mitbringt, geht mit einer Antwort.' },
      { art: 'termin', text: 'Offenes Studio', wann: 'Donnerstag, 3. Dezember 2026, ab 18 Uhr', wo: 'Tasty Studios, Hamburg' },
      { art: 'bild', link: VORL_FO + 'k-studio-900.webp', alt: 'Das Studio', zeile: 'Wenige Plätze, damit für jedes Haus Zeit bleibt.' },
      { art: 'knopf', text: 'Ich komme', link: VORL_SEITE() + '/contact.html?anliegen=studio' },
      VORL_GRUSS()] }
];
async function neueAusgabe() {
  if (S.E && S.E.wartet) { try { await speichern(); } catch (e) { return fehler(e); } }
  vorlagenZu();
  const fruehere = archiv().slice(0, 3);
  const ov = document.createElement('div'); ov.className = 'tisch-vorlagen'; ov.id = 'vorlagen';
  ov.innerHTML = `<div class="tisch-vorlagen__k" role="dialog" aria-modal="true" aria-label="Neue Ausgabe">
    <button class="rund tisch-vorlagen__zu" type="button" data-zu aria-label="Zurück">${ZU}</button>
    <p class="tisch-u__k">Post aus dem Studio · Neue Ausgabe</p>
    <h2>Womit <em>fangen wir an?</em></h2>
    <div class="tisch-vorlagen__l">${VORLAGEN.map(v => `<button class="tv" type="button" data-vorlage="${v.k}"><span class="tv__blatt"><iframe tabindex="-1" title="${esc(v.name)}" aria-hidden="true"></iframe></span><span class="tv__t"><b>${esc(v.name)}</b><small>${esc(v.satz)}</small></span></button>`).join('')}</div>
    <div class="tisch-vorlagen__unten"><button class="link" type="button" data-leer>Mit einem leeren Blatt anfangen</button>${fruehere.length ? `<span>Oder eine frühere Ausgabe als Vorlage:</span>${fruehere.map(a => `<button class="link" type="button" data-frueher="${esc(a.id)}">Nr. ${esc(a.nummer)} · ${esc(a.titel || 'ohne Titel')}</button>`).join('')}` : ''}</div>
  </div>`;
  document.body.appendChild(ov);
  document.documentElement.classList.add('tisch-zu');
  /* die Abzüge zeigen die echte Mail in 600 px, verkleinert auf die Breite der Karte */
  const skal = () => $$('.tv__blatt', ov).forEach(b => b.style.setProperty('--sk', b.clientWidth / 600));
  skal(); addEventListener('resize', skal); ov._skal = skal;
  $$('[data-zu]', ov).forEach(b => b.onclick = vorlagenZu);
  ov.onclick = e => { if (e.target === ov) vorlagenZu(); };
  VORLAGEN.forEach(async v => {
    try {
      const r = await api('POST', 'vorschau', { ausgabe: { titel: v.name, liste: 'l-post', bausteine: v.b() }, bearbeiten: true });
      const fr = $(`[data-vorlage="${v.k}"] iframe`, ov); if (!fr) return;
      fr.onload = () => { try { const d = fr.contentDocument, st = d.createElement('style'); st.textContent = TISCH_CSS + '[data-k]{cursor:default}'; d.head.appendChild(st); $$('[data-k]', d).forEach(el => { if (el.dataset.mehr && !el.textContent.trim()) el.innerHTML = ''; leerSetzen(el); }); } catch (e) { /* fremd */ } };
      fr.srcdoc = r.html;
    } catch (e) { fehler(e); }
  });
  const anlegen = async (bausteine, titel = 'Neue Ausgabe') => {
    try {
      const r = await api('POST', 'ausgaben', { titel, liste: 'l-post', bausteine });
      vorlagenZu(); await ladeAlles();
      S.ansicht = 'ausgaben'; S.filter = 'entwurf'; waehle(r.ausgabe.id);
      history.replaceState(null, '', location.pathname + location.search + '#ausgaben'); rand(); leiste(); zeichne(); window.scrollTo(0, 0);
      quittung('Ausgabe Nr. ' + r.ausgabe.nummer + ' angelegt', 'keine Nr. ' + r.ausgabe.nummer, ausgabeText(r.ausgabe), async () => { S.E = null; S.wahl = ''; await api('DELETE', 'ausgaben/' + encodeURIComponent(r.ausgabe.id)); });
      setTimeout(() => blattLaden(d => { const f = $('[data-k]', d); if (f) f.focus(); }), 120);
    } catch (e) { fehler(e); }
  };
  $$('[data-vorlage]', ov).forEach(b => b.onclick = () => anlegen(VORLAGEN.find(v => v.k === b.dataset.vorlage).b()));
  $('[data-leer]', ov).onclick = () => anlegen([{ art: 'titel', text: '' }, { art: 'text', text: '' }]);
  $$('[data-frueher]', ov).forEach(b => b.onclick = () => { const a = ausgabeVon(b.dataset.frueher); if (a) anlegen(JSON.parse(JSON.stringify(a.bausteine || [])), a.titel || 'Neue Ausgabe'); });
}
function vorlagenZu() { const o = $('#vorlagen'); if (o) { if (o._skal) removeEventListener('resize', o._skal); o.remove(); } document.documentElement.classList.remove('tisch-zu'); }

/* Probemail an Robert: liegt als Datei im Postausgang (trocken) */
async function probemail(id) {
  if (!id && S.E && S.E.wartet) await speichern();
  const aid = id || S.E.id, alt = ausgabeVon(aid);
  const r = await api('POST', 'ausgaben/' + encodeURIComponent(aid) + '/probemail');
  await ladeAlles();
  if (S.E && S.E.id === aid) { S.E.probe_am = r.ausgabe.probe_am; const n = D().ausgaben.findIndex(a => a.id === aid); if (n >= 0) D().ausgaben[n] = r.ausgabe; }
  rand(); if (S.ansicht === 'ausgaben' && $('#umschlag')) { $('#umschlag').innerHTML = umschlag(); verbindeUmschlag(); } else zeichne();
  quit('Probemail liegt im Postausgang', `An ${r.mail.an}, «${r.mail.betreff}»\nVorher: ${alt && alt.probe_am ? 'letzte Probe ' + zeit(alt.probe_am) : 'noch keine Probemail'}\nNachher: Probe ${zeit(r.ausgabe.probe_am)}, ${r.mail.trocken ? 'nicht verschickt, der Versand ist trocken' : r.mail.gesendet ? 'verschickt' : 'Fehler: ' + r.mail.fehler}`,
    [['Ansehen', () => zeigMail(r.mail.id)]], !!r.mail.fehler, 15000);
}
function verbindeUmschlag() {
  const merk = S.E; if (!merk) return;
  $$('#umschlag [data-akt]').forEach(b => b.onclick = () => aktion(b.dataset.akt));
  [['titel', 'titel'], ['betreff', 'betreff'], ['vorschau', 'vorschau'], ['liste', 'liste']].forEach(([id, k]) => {
    const el = $('#u-' + id); if (!el || merk.stand === 'versendet') return;
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { merk[k] = el.value; if (k === 'titel') S.titelFolgt = false; geaendert(); if (k === 'liste') { $('#umschlag').innerHTML = umschlag(); verbindeUmschlag(); } });
  });
  $$('#umschlag [data-palette]').forEach(b => b.onclick = () => palette(b.dataset.palette));
  ['#u-vorschau', '#u-titel'].forEach(s => { const vt = $(s); if (!vt) return; const hoch = () => { if (!vt.offsetWidth) return; vt.style.height = 'auto'; vt.style.height = vt.scrollHeight + 'px'; }; vt.addEventListener('input', hoch); requestAnimationFrame(hoch); setTimeout(hoch, 400); if (document.fonts) document.fonts.ready.then(hoch); });
  const nm = $('#u-titel'); if (nm) nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });
  gespZeigen();
}

/* ---------- Abschicken als Moment: ruhiges Fenster, abgeschickt wird mit Gedrückthalten ---------- */
async function abschicken(liste) {
  if (S.E.wartet) await speichern();
  const E = S.E, lid = liste || E.liste, a = ausgabeVon(E.id), v = D().versand;
  const r = await api('POST', 'ausgaben/' + encodeURIComponent(E.id) + '/versand', { liste: lid }), z = r.zusammenfassung;
  const alt = $('#siegel'); if (alt) alt.remove();
  const bilderOhne = (a.bausteine || []).some(b => ['bild', 'kopfbild', 'meldung'].includes(b.art) && b.link && !/^https:\/\//.test(b.link));
  const ov = document.createElement('div'); ov.className = 'tisch-siegel'; ov.id = 'siegel';
  ov.innerHTML = `<div class="tisch-siegel__k" role="dialog" aria-modal="true" aria-label="Abschicken">
    <button class="rund tisch-siegel__zu" type="button" data-zu aria-label="Zurück">${ZU}</button>
    <div class="tisch-siegel__mail"><iframe tabindex="-1" title="Die Mail" aria-hidden="true"></iframe></div>
    <div class="tisch-siegel__t">
      <p class="tisch-u__k">Post aus dem Studio · Nr. ${esc(a.nummer)}</p>
      <h2>An ${z.anzahl === 1 ? 'einen' : esc(z.anzahl)} <em>${z.anzahl === 1 ? 'Bestätigten' : 'Bestätigte'}</em></h2>
      <label class="tisch-sel"><select id="sg-liste" aria-label="Liste">${D().listen.map(l => `<option value="${esc(l.id)}"${l.id === lid ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
      <dl class="tisch-siegel__dl"><div><dt>Betreff</dt><dd>${esc(z.betreff)}</dd></div><div><dt>Von</dt><dd>${esc(v.absender_name)} · ${esc(v.absender_mail)}</dd></div><div><dt>Probemail</dt><dd>${a.probe_am ? esc(zeit(a.probe_am)) : 'noch keine'}</dd></div></dl>
      <p class="tisch-siegel__h">${z.trocken ? 'Der Versand ist trocken: die Mails landen als Dateien im Postausgang, es geht nichts raus.' : 'Der Versand ist scharf: es geht wirklich raus und lässt sich nicht zurücknehmen.'}${z.ohne_bestaetigung || z.abgemeldet ? ' Wer nicht bestätigt oder abgemeldet ist, bekommt nichts.' : ''}${bilderOhne ? ' Bilder der Agentur-Seite brauchen vor dem echten Versand eine öffentliche Adresse.' : ''}</p>
      <button class="tisch-halten" type="button"${z.anzahl ? '' : ' disabled'}><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"/><circle class="f" cx="22" cy="22" r="19"/></svg><span>${z.anzahl ? 'Zum Abschicken halten' : 'Niemand bestätigt'}</span></button>
    </div></div>`;
  document.body.appendChild(ov); document.documentElement.classList.add('tisch-zu');
  requestAnimationFrame(() => ov.classList.add('auf'));
  const zu = () => { ov.classList.remove('auf'); setTimeout(() => { ov.remove(); document.documentElement.classList.remove('tisch-zu'); }, 320); };
  $('[data-zu]', ov).onclick = zu; ov.onclick = e => { if (e.target === ov) zu(); };
  $('#sg-liste', ov).onchange = () => abschicken($('#sg-liste', ov).value).catch(fehler);
  api('POST', 'vorschau', { ausgabe: ausgabeDaten(E) }).then(p => { const f = $('.tisch-siegel__mail iframe', ov); if (f) f.srcdoc = p.html; }).catch(() => {});
  const kn = $('.tisch-halten', ov); let uhr = 0, fertig = false;
  const an = e => { if (kn.disabled || fertig) return; if (e) e.preventDefault(); kn.classList.add('haelt'); clearTimeout(uhr); uhr = setTimeout(los, 1600); };
  const ab = () => { if (fertig) return; kn.classList.remove('haelt'); clearTimeout(uhr); };
  kn.addEventListener('pointerdown', an); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => kn.addEventListener(t, ab));
  kn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) an(e); });
  kn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') ab(); });
  async function los() {
    fertig = true; kn.classList.add('fertig'); $('span', kn).textContent = 'Wird abgeschickt';
    try {
      const w = await api('POST', 'ausgaben/' + encodeURIComponent(E.id) + '/versand', { liste: z.liste, bestaetigt: true }), ver = w.versendung;
      zu();
      await ladeAlles(); S.filter = 'versendet'; waehle(E.id); rand(); zeichne();
      const k = $(`#stapel .tisch-abzug[data-wahl="${CSS.escape(E.id)}"]`); if (k) k.classList.add('gelandet');
      quittung('Nr. ' + a.nummer + ' ist an ' + mal(ver.anzahl, 'einen Empfänger', 'Empfänger') + ' raus', 'Entwurf', 'verschickt am ' + datumKurz(w.ausgabe.versendet_am) + ' an «' + ver.liste_name + '»' + (ver.trocken ? ', trocken, liegt im Postausgang' : '') + (ver.fehler.length ? ', ' + mal(ver.fehler.length, 'ein Fehler', 'Fehler') : ''),
        ver.trocken ? () => api('DELETE', 'versendungen/' + encodeURIComponent(ver.id)) : null);
    } catch (e) { fertig = false; kn.classList.remove('haelt', 'fertig'); $('span', kn).textContent = 'Zum Abschicken halten'; fehler(e); }
  }
}
document.addEventListener('click', e => {
  if (!S.randAuto || !e.target.closest('[data-st-rand-kn]')) return;
  e.stopPropagation(); e.preventDefault(); document.documentElement.classList.remove('st-rand-zu'); S.randAuto = false; S.randSelbst = true; setTimeout(tischMass, 760);
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { popZu(); vorlagenZu(); const s = $('#siegel'); if (s) $('[data-zu]', s).click(); } });

/* ---------- Empfänger (wie «Das wurde gefragt» der Vorlage) ---------- */
function empfaengerS() {
  /* Empfänger als ruhige Liste wie ein Gästebuch (Robert 17.11.2026, BRIEFING-SCHREIBTISCH.md): oben Suche, Liste, Stand, zwei leise Knöpfe für die Datei; Wartende als eine Zeile */
  const alle = D().empfaenger, dub = dubletten(), dz = Object.keys(dub).length, f = S.efilter, li = S.eliste, such = S.such.trim().toLowerCase();
  const passt = e => (li === 'alle' || (e.listen || []).includes(li)) && (f === 'alle' || (f === 'dubletten' ? dub[e.id] : e.stand === f)) && (!such || (e.name + ' ' + e.mail + ' ' + (e.haus || '')).toLowerCase().includes(such));
  const l = alle.filter(passt).sort((a, b) => (b.einwilligung || '').localeCompare(a.einwilligung || '') || a.name.localeCompare(b.name));
  const W = wartend();
  const zeile = e => `<div class="gb-z${e.stand === 'angemeldet' ? ' wartet' : ''}${e.stand === 'abgemeldet' ? ' gb-ab' : ''}" data-id="${esc(e.id)}">
      <div class="gb-z__n"><b>${esc(e.name || e.mail)}</b><span>${esc(e.haus || 'ohne Haus')}</span></div>
      <div class="gb-z__m"><span>${esc(e.mail)}</span><small>${esc((e.listen || []).map(listenName).join(', ') || 'in keiner Liste')}</small></div>
      <div class="gb-z__s"><span class="gb-st gb-st--${e.stand === 'bestätigt' ? 'ja' : e.stand === 'angemeldet' ? 'wartet' : 'ab'}">${esc(STAND_T[e.stand] || e.stand)}${dub[e.id] ? ' · Dublette?' : ''}</span><small>${esc(e.herkunft || 'Website')} · ${esc(datumKurz(e.einwilligung))}</small></div>
      <button class="gb-z__k" type="button" data-e="${esc(e.id)}" aria-label="${esc(e.name || e.mail)} ändern" title="Ändern">${SYM.stift}</button>
    </div>`;
  return `<section class="gb">
    <div class="gb-kopf">
      <div><p class="tisch-u__k">Post aus dem Studio · Empfänger</p><h1>Wer die <em>Post bekommt.</em></h1>
        <p class="gb-satz">${mal(alle.length, 'Eine Adresse', 'Adressen')}, ${bestaetigt().length} davon bekommen die Post. Wer sich anmeldet, bestätigt selbst mit einem Klick in seiner Mail, Abgemeldete bleiben gesperrt.</p></div>
      <div class="gb-kopf__kn">${WO.knopf('Neuer Empfänger', 'plus', 'gold', { attr: 'data-eneu' })}${WO.knopf('Anmeldung durchspielen', 'pfeil', 'hell', { attr: 'data-anmeldung' })}<div class="gb-datei"><button class="link" type="button" data-import>Datei einlesen</button><button class="link" type="button" data-export>Als Datei sichern</button></div></div>
    </div>
    ${W.length ? `<p class="gb-ruhig"><b>${W.length}</b><span>${W.length === 1 ? 'Eine Adresse hat' : W.length + ' Adressen haben'} den Link in der Anmelde-Mail noch nicht angeklickt. Ihr müsst nichts tun: Wer klickt, bekommt ab dann die Post. Wer nie klickt, bekommt nichts.</span></p>` : ''}
    <div class="gb-werk">
      <label class="gb-such"><span class="sr">Suchen</span><input id="e-such" type="search" value="${esc(S.such)}" placeholder="Name, Mail oder Haus suchen"></label>
      <label class="tisch-sel gb-liste"><select id="e-liste" aria-label="Liste"><option value="alle">Alle Listen</option>${D().listen.map(x => `<option value="${esc(x.id)}"${li === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <div class="wahl2 gb-stand" role="group" aria-label="Stand">${[['alle', 'Alle'], ['bestätigt', 'Bestätigt'], ['angemeldet', 'Unbestätigt'], ['abgemeldet', 'Abgemeldet']].concat(dz ? [['dubletten', 'Dubletten']] : []).map(([k, t]) => `<button type="button" data-ef="${k}" aria-pressed="${f === k}">${t}</button>`).join('')}</div>
    </div>
    <div class="gb-buch" id="e-treffer">${l.length ? l.map(zeile).join('') : `<div class="gb-leer"><b>Niemand in dieser Auswahl.</b><p>Andere Liste oder anderen Stand wählen, oder die Suche leeren.</p></div>`}</div>
  </section>`;
}
function verbindeEmpfaenger() {
  $$('#ansicht [data-ef]').forEach(b => b.onclick = () => { S.efilter = b.dataset.ef; zeichne(); });
  $('#e-liste').onchange = () => { S.eliste = $('#e-liste').value; zeichne(); };
  const s = $('#e-such');
  s.oninput = () => { S.such = s.value; const p = s.selectionStart; zeichne(); const n = $('#e-such'); n.focus(); n.setSelectionRange(p, p); };
  $$('#ansicht [data-e]').forEach(b => b.onclick = () => empfFenster(empfVon(b.dataset.e)));
  $$('#ansicht [data-eneu]').forEach(b => b.onclick = () => empfFenster(null));
  $$('#ansicht [data-import]').forEach(b => b.onclick = importFenster);
  $$('#ansicht [data-export]').forEach(b => b.onclick = exportieren);
  $$('#ansicht [data-anmeldung]').forEach(b => b.onclick = anmeldungFenster);
}
const FELDER_E = ['name', 'mail', 'haus', 'herkunft', 'einwilligung', 'stand', 'notiz'];
const empfText = e => e ? [e.name, e.mail, e.haus, STAND_T[e.stand], (e.listen || []).map(listenName).join(', ')].filter(Boolean).join(', ') : '';
function empfFenster(e) {
  const v = k => esc(e ? (e[k] || '') : k === 'herkunft' ? 'Gespräch' : k === 'einwilligung' ? D().heute : k === 'stand' ? 'bestätigt' : '');
  const f = (k, t, extra = '') => `<label class="feld"><span>${t}</span><input id="e-${k}" value="${v(k)}"${extra}></label>`;
  const sel = (k, t, o) => `<label class="feld"><span>${t}</span><select class="sel" id="e-${k}">${o.map(w => `<option value="${esc(w)}"${(e ? e[k] : k === 'herkunft' ? 'Gespräch' : 'bestätigt') === w ? ' selected' : ''}>${esc(k === 'stand' ? STAND_T[w] : w)}</option>`).join('')}</select></label>`;
  const drin = e ? e.listen || [] : [S.eliste !== 'alle' ? S.eliste : 'l-post'];
  fenster(`<h2>${e ? esc(e.name || 'Empfänger') + ' <em>ändern.</em>' : 'Neuer <em>Empfänger.</em>'}</h2><p>${e ? 'Jede Änderung zeigt danach eine Quittung mit vorher und nachher.' : 'Wer nach einem Gespräch dazukommt. Wer sich über die Seite anmeldet, kommt selbst hinein und bestätigt per Link.'}</p>
    <div class="an-felder">${f('name', 'Name', ' required')}${f('mail', 'Mail', ' type="email" required')}</div>
    <div class="an-felder">${f('haus', 'Haus')}${sel('herkunft', 'Herkunft', ['Website', 'Gespräch', 'KI-Check'])}</div>
    <div class="an-felder">${f('einwilligung', 'Datum der Einwilligung', ' type="date"')}${sel('stand', 'Stand', ['angemeldet', 'bestätigt', 'abgemeldet'])}</div>
    <p class="nl-hinw" id="e-standh"></p>
    <div class="feld"><span>Listen</span><div class="nl-haken">${D().listen.map(l => `<label><input type="checkbox" value="${esc(l.id)}"${drin.includes(l.id) ? ' checked' : ''}> ${esc(l.name)}</label>`).join('')}</div></div>
    <label class="feld"><span>Notiz</span><textarea id="e-notiz" rows="2">${v('notiz')}</textarea></label>
    <div class="fenster__kn">${e ? `<button class="link" type="button" id="e-weg">Löschen</button>` : ''}<button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">${e ? 'Speichern' : 'Anlegen'}<i>${SYM.haken}</i></button></div>`, false, async () => {
      const d = {}; FELDER_E.forEach(k => { d[k] = $('#e-' + k).value.trim(); }); d.listen = $$('.nl-haken input:checked').map(i => i.value);
      if (!d.name || !d.mail) return quit('Name und Mail fehlen', 'Beides muss da sein.', [], true, 4000);
      try {
        if (e) {
          const r = await api('PUT', 'empfaenger/' + encodeURIComponent(e.id), d); fensterZu(); await frisch();
          const [vo, na] = unterschied([['Name', e.name, r.empfaenger.name], ['Mail', e.mail, r.empfaenger.mail], ['Haus', e.haus, r.empfaenger.haus], ['Herkunft', e.herkunft, r.empfaenger.herkunft], ['Einwilligung', datumKurz(e.einwilligung), datumKurz(r.empfaenger.einwilligung)],
            ['Stand', STAND_T[e.stand], STAND_T[r.empfaenger.stand]], ['Listen', (e.listen || []).map(listenName).join(', '), (r.empfaenger.listen || []).map(listenName).join(', ')], ['Notiz', e.notiz, r.empfaenger.notiz]]);
          quittung(r.empfaenger.name + ' gespeichert', vo, na, () => api('PUT', 'empfaenger/' + encodeURIComponent(e.id), e));
        } else {
          const r = await api('POST', 'empfaenger', d); fensterZu(); await frisch();
          quittung(r.empfaenger.name + ' ist neu dabei', 'nicht in der Liste', empfText(r.empfaenger), () => api('DELETE', 'empfaenger/' + encodeURIComponent(r.empfaenger.id)));
        }
      } catch (x) { fehler(x); }
    });
  const sh = () => { const s = $('#e-stand').value; $('#e-standh').textContent = s === 'abgemeldet' ? 'Abgemeldete bleiben gesperrt: eine neue Anmeldung über die Seite wird abgewiesen, Versand geht nicht an sie.' : e && e.stand === 'abgemeldet' ? 'Die Sperre aufheben geht nur hier, bewusst und mit Quittung.' : s === 'angemeldet' ? 'Ohne Bestätigung bekommt die Adresse keine Ausgabe.' : ''; };
  $('#e-stand').onchange = sh; sh();
  const weg = $('#e-weg');
  if (weg) weg.onclick = () => fenster(`<h2>${esc(e.name)} <em>löschen?</em></h2><p>${esc(e.mail)} verschwindet aus allen Listen. Über die Quittung kommt die Adresse gleich danach zurück. ${e.stand === 'abgemeldet' ? '<b>Achtung:</b> eine gelöschte Abmeldung ist keine Sperre mehr. Besser abgemeldet stehen lassen.' : ''}</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Behalten</button><button class="kn kn--gefahr" type="button" id="f-los">Löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try { const r = await api('DELETE', 'empfaenger/' + encodeURIComponent(e.id)); await frisch();
          quittung(e.name + ' gelöscht', empfText(e), 'nicht mehr in der Liste', () => api('PUT', 'empfaenger/' + encodeURIComponent(e.id), r.empfaenger));
        } catch (x) { fehler(x); }
      });
}
/* Import als CSV: erst Vorschau (neu, Dubletten, gesperrt, fehlerhaft), dann Übernahme mit Quittung */
function importFenster() {
  fenster(`<h2>Empfänger <em>importieren.</em></h2><p>Eine CSV-Datei mit Kopfzeile, zum Beispiel <b>Name;E-Mail;Haus;Herkunft;Einwilligung;Stand</b>. Erst kommt eine Vorschau, übernommen wird danach. Eine Beispieldatei liegt in probedaten/beispiel-import.csv.</p>
    <label class="feld"><span>Datei</span><input id="i-datei" type="file" accept=".csv,text/csv,text/plain"></label>
    <label class="feld"><span>Oder hier einfügen</span><textarea id="i-csv" rows="5" placeholder="Name;E-Mail;Haus;Herkunft;Einwilligung;Stand"></textarea></label>
    <label class="feld"><span>In Liste</span><select class="sel" id="i-liste">${D().listen.map(l => `<option value="${esc(l.id)}"${l.id === (S.eliste !== 'alle' ? S.eliste : 'l-post') ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Prüfen<i>${PF}</i></button></div>`, false, async () => {
      const d = $('#i-datei').files[0], liste = $('#i-liste').value;
      const text = d ? await d.text() : $('#i-csv').value.trim();
      if (!text) return quit('Keine Daten', 'Eine Datei wählen oder Zeilen einfügen.', [], true, 4000);
      try {
        const v = await api('POST', 'empfaenger/import', { csv: text, liste });
        const zl = z => `<li><b>${esc(z.name || z.mail)}</b><span>${esc(z.mail)}${z.grund ? ' · ' + esc(z.grund) : ''}</span></li>`;
        const teil = (l, eins, viele, satz) => l.length ? `<p><b>${esc(mal(l.length, eins, viele))}</b> ${satz}</p><ul class="nl-namen">${l.map(zl).join('')}</ul>` : '';
        const html = teil(v.neu, 'Eine neue Adresse kommt', 'neue Adressen kommen', 'in «' + esc(listenName(liste)) + '»:') + teil(v.doppelt, 'Eine Dublette wird', 'Dubletten werden', 'übersprungen:') + (v.gesperrt.length ? `<p><b>${esc(v.gesperrt.length === 1 ? 'Eine Adresse ist abgemeldet' : v.gesperrt.length + ' Adressen sind abgemeldet')}</b> und ${v.gesperrt.length === 1 ? 'bleibt' : 'bleiben'} gesperrt:</p><ul class="nl-namen">${v.gesperrt.map(zl).join('')}</ul>` : '') + teil(v.fehlerhaft, 'Eine Zeile ist', 'Zeilen sind', 'fehlerhaft:');
        if (!v.neu.length) return fenster(`<h2>Nichts zu <em>übernehmen.</em></h2>${html || '<p>Keine Zeile gelesen.</p>'}<div class="fenster__kn"><button class="kn kn--gold" type="button" data-zu>Verstanden<i>${SYM.haken}</i></button></div>`, false);
        fenster(`<h2>Import <em>prüfen.</em></h2>${html}<div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">${esc(mal(v.neu.length, 'Eine Adresse übernehmen', 'Adressen übernehmen'))}<i>${SYM.haken}</i></button></div>`, false, async () => {
          fensterZu();
          try {
            const vorher = inListe(liste).length, w = await api('POST', 'empfaenger/import', { csv: text, liste, anwenden: true }); await frisch();
            quittung(mal(w.ids.length, 'Eine Adresse übernommen', 'Adressen übernommen'), '«' + listenName(liste) + '» mit ' + mal(vorher, 'einer Adresse', 'Adressen'), '«' + listenName(liste) + '» mit ' + mal(inListe(liste).length, 'einer Adresse', 'Adressen'),
              async () => { for (const id of w.ids) await api('DELETE', 'empfaenger/' + encodeURIComponent(id)); });
          } catch (e) { fehler(e); }
        });
      } catch (e) { fehler(e); }
    });
}
async function exportieren() {
  try {
    const liste = S.eliste === 'alle' ? '' : S.eliste, stand = ['alle', 'dubletten'].includes(S.efilter) ? '' : S.efilter;
    const a = await api('GET', 'empfaenger/export?liste=' + encodeURIComponent(liste) + '&stand=' + encodeURIComponent(stand));
    const blob = new Blob(['﻿' + a.csv], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), l = document.createElement('a');
    l.href = url; l.download = a.dateiname; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    quit('Datei ' + a.dateiname + ' gespeichert', mal(a.anzahl, 'Eine Adresse', 'Adressen') + (liste ? ' aus «' + listenName(liste) + '»' : '') + (stand ? ', nur ' + STAND_T[stand] : '') + '. Am Bestand ändert das nichts.', [], false, 7000);
  } catch (e) { fehler(e); }
}
/* Anmeldung durchspielen: so wie später von der Agentur-Seite (doppelte Einwilligung) */
function anmeldungFenster() {
  fenster(`<h2>Anmeldung <em>durchspielen.</em></h2><p>So läuft es später von der Agentur-Seite aus: die Adresse wird als «ohne Bestätigung» eingetragen und bekommt eine Bestätigungsmail. Erst der Klick auf den Link darin macht sie «bestätigt».</p>
    <div class="an-felder"><label class="feld"><span>Name</span><input id="a-name" required></label><label class="feld"><span>Mail</span><input id="a-mail" type="email" required></label></div>
    <div class="an-felder"><label class="feld"><span>Haus</span><input id="a-haus"></label><label class="feld"><span>In Liste</span><select class="sel" id="a-liste">${D().listen.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}</select></label></div>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Anmelden<i>${PF}</i></button></div>`, false, async () => {
      const d = { name: $('#a-name').value.trim(), mail: $('#a-mail').value.trim(), haus: $('#a-haus').value.trim(), herkunft: 'Website', liste: $('#a-liste').value };
      if (!d.mail) return quit('Mail fehlt', 'Ohne Mail keine Anmeldung.', [], true, 4000);
      const vorher = D().empfaenger.find(e => e.mail.toLowerCase() === d.mail.toLowerCase());
      try {
        const a = await api('POST', 'anmeldung', d); await frisch();
        if (a.schon_dabei) { fensterZu(); return quit('Schon dabei', a.hinweis, [], false, 6000); }
        fenster(`<h2>Bestätigungsmail liegt <em>im Postausgang.</em></h2><p>${esc(a.empfaenger.name || a.empfaenger.mail)} steht jetzt als <b>ohne Bestätigung</b> in der Liste. Verschickt wurde nichts, die Mail liegt als Datei im Postausgang.</p><p>Der Link in der Mail:</p><p class="nl-link"><a href="${esc(a.bestaetigen_link)}" target="_blank" rel="noopener">${esc(a.bestaetigen_link)}</a></p><p>Klick ihn an, dann wird die Adresse bestätigt, so wie der Empfänger es später tun würde.</p>
          <div class="fenster__kn"><button class="link" type="button" id="a-ansehen">Mail ansehen</button><button class="kn kn--gold" type="button" data-zu>Verstanden<i>${SYM.haken}</i></button></div>`, false);
        $('#a-ansehen').onclick = () => zeigMail(a.mail.id);
        quittung((a.empfaenger.name || a.empfaenger.mail) + ' angemeldet', vorher ? empfText(vorher) : 'nicht in der Liste', 'ohne Bestätigung, Bestätigungsmail im Postausgang', vorher ? () => api('PUT', 'empfaenger/' + encodeURIComponent(vorher.id), vorher) : () => api('DELETE', 'empfaenger/' + encodeURIComponent(a.empfaenger.id)));
      } catch (e) { fehler(e); }
    });
}

/* ---------- Listen (wie «Die Abende» der Vorlage: eine Karte je Liste) ---------- */
function listenS() {
  /* Listen als volle Zeilen (Robert 17.11.2026): je Liste nur, wie viele die Post bekommen und aus welchem Bereich, keine Namen, kein «wartet/abgemeldet» */
  const L = D().listen, BEREICH = { 'l-hotel': 'aus der Hotellerie', 'l-gastro': 'aus der Gastronomie' };
  const zeile = (l, i) => {
    const d = inListe(l.id).filter(e => e.stand === 'bestätigt'), zuletzt = archiv().find(a => a.liste === l.id);
    const teile = BEREICH[l.id] ? [] : Object.keys(BEREICH).map(k => [d.filter(e => (e.listen || []).includes(k)).length, BEREICH[k]]).filter(([z]) => z);
    const rest = d.length - teile.reduce((s, [z]) => s + z, 0);
    const satz = teile.length ? teile.map(([z, t]) => z + ' ' + t).concat(rest > 0 ? [rest + ' weitere'] : []).join(', ') : (BEREICH[l.id] ? 'Alle ' + BEREICH[l.id] + '.' : '');
    return `<article class="lb-z" style="--i:${i}" id="liste-${esc(l.id)}">
      <span class="lb-z__bild" aria-hidden="true"><img src="${esc(listenBild(l.id))}" alt="" width="900" height="675" decoding="sync"></span>
      <div class="lb-z__n"><small>${esc(zuletzt ? 'Zuletzt Nr. ' + zuletzt.nummer + ', ' + datumKurz(zuletzt.versendet_am) : 'Noch keine Ausgabe')}</small><h3>${esc(l.name)}</h3><p>${esc(l.kurz || 'Ohne Beschreibung')}</p></div>
      <div class="lb-z__st"><b>${d.length}</b><span>${d.length === 1 ? 'Empfänger bekommt die Post' : 'Empfänger bekommen die Post'}</span>${satz ? `<small>${esc(satz)}</small>` : ''}</div>
      <div class="lb-z__kn">${WO.knopf('Anzeigen', 'pfeil', 'gold', { klein: true, attr: `data-gehe="empfaenger" data-wahl="${esc(l.id)}"` })}<div><button class="link" type="button" data-lum="${esc(l.id)}">Umbenennen</button><button class="link" type="button" data-lweg="${esc(l.id)}">Löschen</button></div></div>
    </article>`;
  };
  return kopf('Listen', 'Die <em>Listen</em>', 'Jede Liste auf einen Blick: wie viele Empfänger die Post bekommen und aus welchem Bereich sie kommen. Eine Adresse kann in mehreren Listen stehen.',
    `<button class="kn kn--gold" type="button" data-lneu>Neue Liste<i>${SYM.plus}</i></button>`) +
    (L.length ? `<div class="lb">${L.map(zeile).join('')}</div>` : `<div class="re-leer platte">${ZEICHEN}<b>Noch keine Liste.</b><p>Über «Neue Liste» die erste anlegen.</p></div>`);
}
function verbindeListen() {
  $$('#ansicht [data-lneu]').forEach(b => b.onclick = () => listeFenster(null));
  $$('#ansicht [data-lum]').forEach(b => b.onclick = () => listeFenster(listeVon(b.dataset.lum)));
  $$('#ansicht [data-ezeig]').forEach(b => b.onclick = () => empfFenster(empfVon(b.dataset.ezeig)));
  $$('#ansicht [data-lweg]').forEach(b => b.onclick = () => {
    const l = listeVon(b.dataset.lweg), drin = inListe(l.id).map(e => JSON.parse(JSON.stringify(e)));
    fenster(`<h2>«${esc(l.name)}» <em>löschen?</em></h2><p>Die Liste verschwindet. ${drin.length ? (drin.length === 1 ? 'Die eine Adresse darin bleibt' : 'Die ' + drin.length + ' Adressen darin bleiben') + ' erhalten, nur die Zuordnung zu dieser Liste fällt weg.' : 'Es steht niemand darin.'} Über die Quittung kommt alles gleich danach zurück.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Behalten</button><button class="kn kn--gefahr" type="button" id="f-los">Liste löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
        fensterZu();
        try { await api('DELETE', 'listen/' + encodeURIComponent(l.id)); await frisch();
          quittung('Liste «' + l.name + '» gelöscht', '«' + l.name + '» mit ' + mal(drin.length, 'einer Adresse', 'Adressen'), 'keine Liste, die Adressen bleiben', async () => { await api('POST', 'listen', l); for (const e of drin) await api('PUT', 'empfaenger/' + encodeURIComponent(e.id), e); });
        } catch (e) { fehler(e); }
      });
  });
  if (S.wahlListe) { const k = $('#liste-' + CSS.escape(S.wahlListe)); if (k) k.scrollIntoView({ block: 'center' }); S.wahlListe = ''; }
}
function listeFenster(l) {
  fenster(`<h2>${l ? 'Liste <em>umbenennen.</em>' : 'Neue <em>Liste.</em>'}</h2><p>${l ? 'Name und Beschreibung. Die Adressen in der Liste bleiben.' : 'Noch leer. Empfänger kommen über «Ändern», die Anmeldung oder den Import hinein.'}</p>
    <label class="feld"><span>Name</span><input id="l-name" value="${esc(l ? l.name : '')}" placeholder="zum Beispiel Gastronomie Zürich"></label>
    <label class="feld"><span>Beschreibung</span><input id="l-kurz" value="${esc(l ? l.kurz : '')}"></label>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">${l ? 'Speichern' : 'Anlegen'}<i>${SYM.haken}</i></button></div>`, true, async () => {
      const d = { name: $('#l-name').value.trim(), kurz: $('#l-kurz').value.trim() };
      if (!d.name) return quit('Name fehlt', 'Die Liste braucht einen Namen.', [], true, 4000);
      try {
        if (l) { const r = await api('PUT', 'listen/' + encodeURIComponent(l.id), d); fensterZu(); await frisch(); const [vo, na] = unterschied([['Name', l.name, r.liste.name], ['Beschreibung', l.kurz, r.liste.kurz]]); quittung('Liste gespeichert', vo, na, () => api('PUT', 'listen/' + encodeURIComponent(l.id), l)); }
        else { const r = await api('POST', 'listen', d); fensterZu(); await frisch(); quittung('Liste «' + r.liste.name + '» angelegt', 'keine Liste', '«' + r.liste.name + '», noch leer', () => api('DELETE', 'listen/' + encodeURIComponent(r.liste.id))); }
      } catch (e) { fehler(e); }
    });
}

/* ---------- Archiv (wie «Das wurde gefragt»: Zahlen, Gruppen je Jahr) ---------- */
function archivS() {
  const A = archiv(), summe = A.reduce((n, a) => n + (a.empfaenger_zahl || 0), 0);
  const gruppen = []; A.forEach(a => { const t = monatVon(a.versendet_am); const g = gruppen.find(y => y.t === t); g ? g.l.push(a) : gruppen.push({ t, l: [a] }); });
  const zeile = a => `<div class="re-f nl-ar" data-id="${esc(a.id)}">${IMG(ausgabeBild(a), 're-f__bild')}
      <div class="re-f__k"><span class="mono">${esc(['Nr. ' + a.nummer, datumLang(a.versendet_am), listenName(a.liste)].join(' · '))}</span><em>${esc(mal(a.empfaenger_zahl, 'ein Empfänger', 'Empfänger'))}</em></div>
      <p class="re-f__q">${esc(a.titel)}</p>
      <p class="nl-e__m">${esc(a.betreff)}</p>
      <div class="re-f__kn"><button class="kn kn--klein kn--gold" type="button" data-ansehen="${esc(a.id)}">Ansehen<i>${PF}</i></button><button class="kn kn--klein kn--linie" type="button" data-gehe="ausgaben" data-wahl="${esc(a.id)}">Öffnen<i>${SYM.stift}</i></button><button class="kn kn--klein kn--linie" type="button" data-kopie="${esc(a.id)}">Als neue Ausgabe<i>${SYM.kopie}</i></button></div>
    </div>`;
  return kopf('Archiv', 'Alle <em>Ausgaben.</em>', 'Jede verschickte Ausgabe mit Datum, Liste und Empfängerzahl. «Ansehen» zeigt die Mail so, wie sie rausging, «Als neue Ausgabe» legt eine Kopie als Entwurf an.') +
    `<div class="re-zahlen platte"><div><b>${A.length}</b><span>Ausgaben verschickt</span></div><div><b>${summe}</b><span>Mails insgesamt</span></div><div><b>${A.length ? Math.round(summe / A.length) : 0}</b><span>Empfänger je Ausgabe</span></div><div><b>${entwuerfe().length}</b><span>Entwürfe in Arbeit</span></div></div>
    ${gruppen.length ? gruppen.map(g => `<details class="gr re-gr" open><summary><b>${esc(g.t)}</b><small>${mal(g.l.length, 'eine Ausgabe', 'Ausgaben')}</small></summary>${g.l.map(zeile).join('')}</details>`).join('')
      : `<div class="re-leer platte">${ZEICHEN}<b>Noch nichts verschickt.</b><p>Sobald eine Ausgabe an eine Liste gegangen ist, steht sie hier mit Datum und Empfängerzahl.</p></div>`}`;
}
function verbindeArchiv() {
  $$('#ansicht [data-ansehen]').forEach(b => b.onclick = async () => {
    const a = ausgabeVon(b.dataset.ansehen);
    try { const v = await api('POST', 'vorschau', { ausgabe: a }); zeigMailHtml(v.html, v.betreff, 'Verschickt am ' + datumKurz(a.versendet_am) + ' an ' + mal(a.empfaenger_zahl, 'einen Empfänger', 'Empfänger') + ' der Liste «' + listenName(a.liste) + '»'); } catch (e) { fehler(e); }
  });
  $$('#ansicht [data-kopie]').forEach(b => b.onclick = async () => {
    try { const r = await api('POST', 'ausgaben/' + encodeURIComponent(b.dataset.kopie) + '/kopie'); await ladeAlles(); S.ansicht = 'ausgaben'; S.filter = 'alle'; S.abt = 'alle'; waehle(r.ausgabe.id); history.replaceState(null, '', location.pathname + location.search + '#ausgaben'); rand(); leiste(); zeichne(); window.scrollTo(0, 0);
      quittung('Kopie als Nr. ' + r.ausgabe.nummer + ' angelegt', 'keine Nr. ' + r.ausgabe.nummer, ausgabeText(r.ausgabe), () => { S.E = null; S.wahl = ''; return api('DELETE', 'ausgaben/' + encodeURIComponent(r.ausgabe.id)); });
    } catch (e) { fehler(e); }
  });
}

/* ---------- Versand: Versandweg und Postausgang ---------- */
/* Versand (Robert 17.11.2026: «unübersichtlich … verstehe ich noch nicht ganz»): oben in Sätzen, was gilt und was noch fehlt, drei Tafeln mit Stand, die Felder erst im Fenster «Ändern» */
function versandS() {
  const v = D().versand, P = D().postausgang.slice().reverse();
  const pw = v.weg === 'dienst' ? !!v.dienst.schluessel_gesetzt : !!v.postfach.passwort_gesetzt;
  const lokal = /localhost|127\.0\.0\.1/.test(v.basis || '');
  const fehlt = [!pw && (v.weg === 'dienst' ? 'der Schlüssel für den Versanddienst' : 'das Passwort für das Postfach'), lokal && 'eine öffentliche Adresse für die Links zum Bestätigen und Abmelden'].filter(Boolean);
  const satz = v.scharf ? 'Der Versand ist scharf: Probemails und Ausgaben gehen wirklich raus.'
    : 'Noch geht keine Mail wirklich raus. Jede Mail, auch die Probemail, landet als Datei im Postausgang weiter unten, so lässt sich alles in Ruhe ausprobieren.' + (fehlt.length ? ' Bis die Post wirklich verschickt werden kann, fehlt noch ' + fehlt.join(' und ') + '. Danach schaltet Robert den Versand scharf.' : ' Alles ist eingerichtet, scharf schaltet Robert.');
  const tafel = (k, mk, gross, zeile, liste, gut, stand) => `<article class="vs-t">
      <p class="vs-t__mk">${mk}</p><b class="vs-t__g">${esc(gross)}</b><p class="vs-t__z">${esc(zeile)}</p>
      <dl class="vs-t__dl">${liste.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${esc(dd || 'nicht eingetragen')}</dd></div>`).join('')}</dl>
      <div class="vs-t__fuss"><span class="vs-st${gut ? ' gut' : ''}">${stand}</span><button class="link" type="button" data-vs-aendern="${k}">Ändern</button></div>
    </article>`;
  const zeile = m => `<div class="re-f nl-pa${m.fehler ? ' luecke' : ''}">${IMG(F[m.art === 'bestaetigung' ? 'empfang' : m.art === 'probe' ? 'studio' : 'faehre'] || F.studio, 're-f__bild')}
      <div class="re-f__k"><span class="mono">${esc(zeit(m.zeit))} · ${esc(ARTNAME[m.art] || m.art)}</span><em>${m.fehler ? 'Fehler' : m.gesendet ? 'verschickt' : 'nur als Datei'}</em></div>
      <p class="re-f__q">${esc(m.betreff)}</p>
      <p class="nl-e__m">An ${esc(m.name ? m.name + ' <' + m.an + '>' : m.an)}${m.fehler ? ' · ' + esc(m.fehler) : ''}</p>
      <div class="re-f__kn"><button class="kn kn--klein kn--gold" type="button" data-mail="${esc(m.id)}">Ansehen<i>${PF}</i></button></div></div>`;
  const gr = {}; P.forEach(m => { (gr[m.art] = gr[m.art] || []).push(m); });
  return kopf('Versand', 'Wie die Post <em>rausgeht.</em>', satz) +
    `<div class="vs-lage">
      ${tafel('absender', 'Wer als Absender steht', v.absender_name || 'Tasty Studios', v.absender_mail || '', [['Antworten gehen an', v.antwort_an], ['Probemails gehen an', v.probe_an]], !!(v.absender_name && v.absender_mail), v.absender_name && v.absender_mail ? 'Eingetragen' : 'Fehlt noch')}
      ${tafel('weg', 'Wie die Mails rausgehen', v.weg === 'dienst' ? 'Über einen Versanddienst' : 'Über das eigene Postfach', v.weg === 'dienst' ? (v.dienst.adresse || '') : 'zum Beispiel iCloud, wie das Kontaktformular der Agentur-Seite', v.weg === 'dienst' ? [['Dienst', v.dienst.adresse], ['Schlüssel', v.dienst.schluessel_gesetzt ? 'hinterlegt' : 'fehlt noch']] : [['Mailserver', v.postfach.host], ['Passwort', v.postfach.passwort_gesetzt ? 'hinterlegt' : 'fehlt noch']], pw, pw ? 'Eingerichtet' : (v.weg === 'dienst' ? 'Schlüssel fehlt noch' : 'Passwort fehlt noch'))}
      ${tafel('links', 'Wohin die Links führen', lokal ? 'Noch auf diesen Rechner' : 'Öffentlich erreichbar', 'Bestätigen und Abmelden müssen beim Empfänger funktionieren.', [['Bestätigen, Abmelden', v.basis], ['Schriften und Knöpfe', v.seite]], !lokal, lokal ? 'Öffentliche Adresse fehlt' : 'Eingerichtet')}
    </div>` +
    (P.length ? `<div class="re-zahlen platte nl-zahlen"><div><b>${P.length}</b><span>Mails im Postausgang</span></div><div><b>${(gr.probe || []).length}</b><span>Probemails</span></div><div><b>${(gr.bestaetigung || []).length}</b><span>Bestätigungen</span></div><div><b>${(gr.ausgabe || []).length}</b><span>Mails von Ausgaben</span></div></div>` : '') +
    `<h2 class="wo-zw nl-pa__t">Der <em>Postausgang</em></h2>
    ${P.length ? Object.keys(ARTNAME).filter(k => gr[k]).map(k => `<details class="gr re-gr"${k === 'probe' ? ' open' : ''}><summary><b>${esc(ARTNAME[k] === 'Ausgabe' ? 'Ausgaben' : ARTNAME[k] === 'Probemail' ? 'Probemails' : 'Bestätigungen')}</b><small>${mal(gr[k].length, 'eine Mail', 'Mails')}</small></summary>${gr[k].slice(0, 40).map(zeile).join('')}${gr[k].length > 40 ? `<p class="re-gr__h">und ${gr[k].length - 40} ältere</p>` : ''}</details>`).join('')
      : `<div class="re-leer platte nl-pa-leer">${ZEICHEN}<b>Der Postausgang ist leer.</b><p>Probemails, Bestätigungen und Ausgaben liegen hier als Dateien, solange der Versand nicht scharf ist.</p></div>`}`;
}
function versandFenster(teil) {
  const v = D().versand;
  const f = (id, t, wert, extra = '') => `<label class="feld"><span>${t}</span><input id="w-${id}" value="${esc(wert == null ? '' : wert)}"${extra}></label>`;
  fenster(`<h2>Versand <em>ändern.</em></h2><p>Was hier steht, gilt für jede Probemail, jede Bestätigung und jede Ausgabe.</p>
    <section class="vs-f" id="vs-absender"><p class="vs-f__mk">Wer als Absender steht</p>
      <div class="vs-2">${f('absender_name', 'Absender', v.absender_name)}${f('absender_mail', 'Absender-Adresse', v.absender_mail, ' type="email"')}${f('antwort_an', 'Antworten gehen an', v.antwort_an, ' type="email"')}${f('probe_an', 'Probemails gehen an', v.probe_an, ' type="email"')}</div></section>
    <section class="vs-f" id="vs-weg"><p class="vs-f__mk">Wie die Mails rausgehen</p>
      <label class="feld"><span>Verschicken über</span><select class="sel" id="w-weg"><option value="postfach"${v.weg === 'postfach' ? ' selected' : ''}>Das eigene Postfach (zum Beispiel iCloud)</option><option value="dienst"${v.weg === 'dienst' ? ' selected' : ''}>Einen Versanddienst</option></select></label>
      <div id="w-postfach"${v.weg === 'postfach' ? '' : ' hidden'}><div class="vs-2">${f('host', 'Mailserver', v.postfach.host)}${f('port', 'Port', v.postfach.port)}${f('benutzer', 'Benutzer', v.postfach.benutzer)}${f('passwort', 'Passwort', '', ' type="password" autocomplete="new-password"')}</div>
        <p class="nl-hinw">${v.postfach.passwort_gesetzt ? 'Ein Passwort ist hinterlegt. Leer lassen heisst: behalten.' : 'Noch kein Passwort hinterlegt. Für iCloud ist das ein App-spezifisches Passwort, nicht das Passwort der Apple-ID.'}</p></div>
      <div id="w-dienst"${v.weg === 'dienst' ? '' : ' hidden'}><div class="vs-2">${f('adresse', 'Adresse des Dienstes', v.dienst.adresse)}${f('schluessel', 'Schlüssel', '', ' type="password" autocomplete="new-password"')}</div><p class="nl-hinw">${v.dienst.schluessel_gesetzt ? 'Ein Schlüssel ist hinterlegt. Leer lassen heisst: behalten.' : 'Noch kein Schlüssel hinterlegt.'}</p></div></section>
    <section class="vs-f" id="vs-links"><p class="vs-f__mk">Wohin die Links führen</p>
      <div class="vs-2">${f('basis', 'Adresse für Bestätigen und Abmelden', v.basis)}${f('seite', 'Agentur-Seite (Schriften, Knöpfe)', v.seite)}</div>
      <p class="nl-hinw">Damit Bestätigen und Abmelden bei Empfängern funktionieren, braucht das Werkzeug später eine öffentliche Adresse. Bis dahin zeigen die Links auf diesen Rechner.</p></section>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Speichern<i>${SYM.haken}</i></button></div>`, false, versandSpeichern);
  $('#w-weg').onchange = () => { $('#w-postfach').hidden = $('#w-weg').value !== 'postfach'; $('#w-dienst').hidden = $('#w-weg').value !== 'dienst'; };
  const z = $('#vs-' + teil); if (z) { z.classList.add('vs-f--an'); z.scrollIntoView({ block: 'nearest' }); const i = $('input, select', z); if (i) i.focus({ preventScroll: true }); }
}
function verbindeVersand() {
  $$('#ansicht [data-vs-aendern]').forEach(b => b.onclick = () => versandFenster(b.dataset.vsAendern));
}
async function versandSpeichern() {
  const alt = JSON.parse(JSON.stringify(D().versand)), g = id => $('#w-' + id).value.trim();
  const neu = { absender_name: g('absender_name'), absender_mail: g('absender_mail'), antwort_an: g('antwort_an'), probe_an: g('probe_an'), weg: g('weg'), seite: g('seite'), basis: g('basis'),
    postfach: { host: g('host'), port: g('port'), benutzer: g('benutzer'), passwort: $('#w-passwort').value }, dienst: { adresse: g('adresse'), schluessel: $('#w-schluessel').value } };
  try {
    const r = await api('PUT', 'versand', neu), n = r.versand, WEG = { postfach: 'Postfach', dienst: 'Dienst' }; fensterZu(); await frisch();
    const [vo, na] = unterschied([['Absender', alt.absender_name, n.absender_name], ['Absender-Adresse', alt.absender_mail, n.absender_mail], ['Antworten an', alt.antwort_an, n.antwort_an], ['Probemails an', alt.probe_an, n.probe_an], ['Weg', WEG[alt.weg], WEG[n.weg]],
      ['Mailserver', alt.postfach.host, n.postfach.host], ['Port', String(alt.postfach.port || ''), String(n.postfach.port || '')], ['Benutzer', alt.postfach.benutzer, n.postfach.benutzer], ['Passwort', alt.postfach.passwort_gesetzt ? 'hinterlegt' : 'keins', n.postfach.passwort_gesetzt ? 'hinterlegt' : 'keins'],
      ['Dienst', alt.dienst.adresse, n.dienst.adresse], ['Schlüssel', alt.dienst.schluessel_gesetzt ? 'hinterlegt' : 'keiner', n.dienst.schluessel_gesetzt ? 'hinterlegt' : 'keiner'], ['Seite', alt.seite, n.seite], ['Adresse des Werkzeugs', alt.basis, n.basis]]);
    quittung('Versand gespeichert', vo, na, () => { const z = JSON.parse(JSON.stringify(alt)); z.postfach = { host: alt.postfach.host, port: alt.postfach.port, benutzer: alt.postfach.benutzer, passwort_loeschen: !alt.postfach.passwort_gesetzt }; z.dienst = { adresse: alt.dienst.adresse, schluessel_loeschen: !alt.dienst.schluessel_gesetzt }; return api('PUT', 'versand', z); });
  } catch (e) { fehler(e); }
}
/* Eine Mail aus dem Postausgang ansehen */
async function zeigMail(id) {
  try { const a = await api('GET', 'postausgang/' + encodeURIComponent(id)); zeigMailHtml(a.html, a.mail.betreff, 'An ' + (a.mail.name ? a.mail.name + ' <' + a.mail.an + '>' : a.mail.an) + ' · ' + zeit(a.mail.zeit) + ' · Datei ' + a.mail.datei); } catch (e) { fehler(e); }
}
function zeigMailHtml(html, betreff, zeile) {
  fenster(`<h2>${esc(betreff)}</h2><p class="nl-zeile">${esc(zeile)}</p><div class="nl-rahmen nl-rahmen--fenster"><iframe title="Mail"></iframe></div>
    <div class="fenster__kn"><button class="kn kn--gold" type="button" data-zu>Schliessen<i>${ZU}</i></button></div>`, false);
  $('#fenster iframe').srcdoc = html;
}

/* ---------- Fenster ---------- */
function fenster(html, schmal = false, los = null) {
  const f = $('#fenster');
  f.innerHTML = `<div class="fenster__k${schmal ? ' schmal' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false;
  /* eine stehende Quittung (etwa die der Probemail) tritt zurück, solange das Fenster offen ist, damit sie nichts darin zudeckt; neue Meldungen aus dem Fenster (Dublette, Fehler) erscheinen wie immer */
  $$('#meldung .quit').forEach(q => { q.hidden = true; });
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  if (los && $('#f-los')) $('#f-los').onclick = los;
  const erst = $('input:not([type=file]), select, textarea', f); if (erst) erst.focus({ preventScroll: true });
}
function fensterZu() { $('#fenster').hidden = true; $('#fenster').innerHTML = ''; $$('#meldung .quit').forEach(q => { q.hidden = false; }); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu(); });

/* ---------- Start ---------- */
(async function () {
  try { await Promise.race([ladeAlles(), new Promise((_, nein) => setTimeout(() => nein(new Error('SERVER · Der Server-Teil antwortet nicht.')), 12000))]); }
  catch (e) { $('#tuer').hidden = false; $('#tuer-t').textContent = /^VERBINDUNG · /.test(e.message || '') ? 'Keine Verbindung zum Server-Teil. Bitte gleich neu laden.' : String(e.message || e).replace(/^[A-ZÄÖÜ]+ · /, ''); return; }
  const h = location.hash.slice(1), aid = Q.get('ausgabe');
  if (aid && ausgabeVon(aid)) { S.ansicht = 'ausgaben'; waehle(aid); }
  else if (Q.get('ansicht') === 'empfaenger' || h === 'warten') { S.ansicht = 'empfaenger'; S.efilter = 'angemeldet'; }   // aus «Heute» der Zentrale: wer auf die Bestätigung wartet
  else { try { S.ansicht = TITEL[h] ? h : ((window.top === window.self && localStorage.getItem('newsletter-ansicht')) || 'start');   /* in der Zentrale immer die Übersicht (Robert 17.11.2026) */ } catch (e) { S.ansicht = 'start'; } }
  if (!TITEL[S.ansicht]) S.ansicht = 'start';
  rand(); leiste(); zeichne();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
})();
/* Nichts geht beim Verlassen still verloren: wartet eine Änderung, fragt der Browser nach */
addEventListener('beforeunload', ev => { if (S.E && S.E.wartet) { ev.preventDefault(); ev.returnValue = ''; } });
