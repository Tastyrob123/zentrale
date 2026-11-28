/* kundenliste.js · das Werkzeug «Kundenliste» von Tasty Studios (07.11.2026, Neubau im Kleid).
   Umgebaut aus website.js von «Website bearbeiten» (vorlage/culinarium-demo/werkzeuge/bureau/werkzeuge/website/website.js): dieselben Bausteine
   (Kopf, Rand, Startbild, Lage, «Häufig gebraucht», Bereich-Kacheln, Leiste, Quittung, Fenster, Auswahl, Umschalter), derselbe Ablauf:
   Eingaben warten gelb in Z.offen (die Leiste unten zählt sie), «Speichern» legt sie ab und antwortet mit einer Quittung (vorher, nachher, «Rückgängig»).
   Inhalt aus auftraege/02-kundenliste.md und der ersten Fassung: jedes Haus mit Ort, Art, Ansprechpartner, Website, Entwurf, Stand, nächstem Schritt,
   Notizen mit Verlauf, Kürzel für «Besuche auf dem Entwurf» (Werkzeug 03). Liste (sortierbar, filterbar) und Brett (Stände als Spalten, Karten ziehen).
   Server: api.py unter /api/02-kundenliste/…; die Zentrale liest /api/02-kundenliste/heute.
   Fehler landen zusätzlich im Browser (localStorage «kl-fehler»), dort liest sie die Prüfung (pruefung.html).
   Umbau 17.11.2026 (Robert: «mit dem Sales Cockpit als Hauptcockpit starten und die Kundendatenbank ist dann quasi ein begleitendes Instrument»):
   Das Sales Cockpit führt jedes Haus bis zur Unterschrift. «Kunden» zeigt nur noch Häuser mit Stand «Vertrag», als Akte: Stammdaten, Vertrag,
   Ablage (Verträge, Angebote, Rechnungen …), Rechnungen mit bezahlt/offen (ab 17.11.2026, zusätzlich in Google Drive), Termine. Brett, Stände und
   «Heute fällig» sind raus (Sicherung *.vor-kundenstamm-2026-11-17). Anna darf Kunden selbst anlegen. Dieselbe Datei haeuser.json für beide Werkzeuge. */
(() => {
'use strict';
const W = '02-kundenliste';
const X = weg => '/zentrale/api/' + W + '/' + weg;
const H = window.WO_HAUS || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const HAKEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const WINKEL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';

const STAENDE = ['offen', 'gefunden', 'geprüft', 'angeschrieben', 'Entwurf geschickt', 'Gespräch', 'Angebot', 'Vertrag', 'Pro bono', 'abgesagt'];
const FELDNAME = { name: 'Name', ort: 'Ort', art: 'Art', ansprechpartner: 'Ansprechperson', website: 'Website', entwurf: 'Entwurf', stand: 'Stand', naechster_schritt: 'Nächster Schritt', kuerzel: 'Kürzel', stammdaten: 'Stammdaten', vertrag: 'Vertrag' };
const TEILNAME = { text: 'Schritt', datum: 'Datum', name: 'Name', rolle: 'Rolle', mail: 'Mail', telefon: 'Telefon', firma: 'Firma', adresse: 'Rechnungsadresse', steuernummer: 'Steuernummer',
  rechnung_mail: 'Rechnungen an', domains: 'Domains', zugaenge: 'Zugänge liegen bei', unterschrieben: 'Unterschrieben am', beginn: 'Beginn', einmalig: 'Einmalig', betreuung: 'Betreuung im Monat', abo: 'Werkzeuge im Monat', kuendigung: 'Kündigung', notiz: 'Notiz' };
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const Z = { d: null, ansicht: 'start', offen: {}, gesp: 0, zl: 0, filter: { q: '', sort: 'reihe', rechnung: 'offen' }, letzte: null };

// ---------------------------------------------------------------- kleine Helfer (wie in der Vorlage)
function el(tag, attrs, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const leere = e => { e.textContent = ''; return e; };
const kn = (text, tun, art = '', attrs = {}) => el('button', Object.assign({ class: 'kn ' + art, type: 'button', onclick: tun }, attrs), el('span', {}, text), el('i', { 'aria-hidden': 'true', html: PF }));
const taste = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-taste', type: 'button', onclick: tun }, attrs), text);
const link = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-link', type: 'button', onclick: tun }, attrs), text);
const mono = text => el('span', { class: 'ws-mono' }, text);
const mz = (n, eins, viele) => n + ' ' + (n === 1 ? eins : viele);
const kurz = (t, n = 90) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const anf = t => '«' + t + '»';
function zeit(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}, ${m[4]}:${m[5]} Uhr` : datumZeigen(iso); }
function datumZeigen(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || ''); }
const wer = () => H.wer || 'Robert';
const E = s => WO.esc(s);
const foto = k => (H.fotos || {})[k] || H.foto;

function merke(text, stichwort) {
  try {
    const l = JSON.parse(localStorage.getItem('kl-fehler') || '[]');
    l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 400), stichwort: stichwort || '', wo: Z.ansicht });
    localStorage.setItem('kl-fehler', JSON.stringify(l.slice(-30)));
  } catch (e) { /* voller oder gesperrter Speicher: die Meldung steht trotzdem auf der Seite */ }
}
let unterwegs = 0;   // laufende Anfragen, steht als data-ws-laeuft am <html> (der Prüflauf wartet darauf)
function zaehle(n) { unterwegs += n; document.documentElement.setAttribute('data-ws-laeuft', unterwegs); }
async function ruf(methode, weg, daten) {
  let r, j = null;
  zaehle(1);
  try {
    const vorab = methode === 'GET' && !daten && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];
    r = await (vorab || fetch(weg, { method: methode, headers: daten ? { 'Content-Type': 'application/json' } : {}, body: daten ? JSON.stringify(Object.assign({ wer: wer() }, daten)) : undefined, cache: 'no-store' }));
    try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  } catch (e) { throw { stichwort: 'keine-verbindung', fehler: 'Der Server des Werkzeugs antwortet nicht.' }; } finally { zaehle(-1); }
  if (!r.ok || j == null) throw Object.assign({ status: r.status, stichwort: r.status === 404 ? 'nicht-gefunden' : r.status === 400 ? 'eingabe' : 'unerwartet', fehler: 'Unerwartete Antwort des Servers (' + r.status + ').' }, j || {});
  return j;
}

// ---------------------------------------------------------------- Daten und Zeiten
const haeuser = () => (Z.d ? Z.d.haeuser : []);
const haus = id => haeuser().find(h => h.id === id);
const heute = () => (Z.d && Z.d.heute) || new Date().toISOString().slice(0, 10);
/* Ein Haus, wie es nach den offenen Eingaben aussähe (für Anzeige und Sortierung) */
function sicht(h) {
  const v = JSON.parse(JSON.stringify(h));
  Object.entries(Z.offen).forEach(([k, op]) => {
    const [id, feld, teil] = k.split('|');
    if (id !== h.id) return;
    if (teil) v[feld] = Object.assign({}, v[feld], { [teil]: op });
    else v[feld] = op;
  });
  return v;
}
function langDatum(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); if (!m) return ''; const d = new Date(+m[1], +m[2] - 1, +m[3]); return TAGE[d.getDay()] + ', ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear(); }
function feldText(feld, w) {
  if (w && typeof w === 'object') {
    if (feld === 'naechster_schritt') return [w.text, w.datum ? 'bis ' + datumZeigen(w.datum) : ''].filter(Boolean).join(' ');
    return [w.name, w.rolle, w.mail, w.telefon].filter(Boolean).join(', ');
  }
  return String(w || '');
}

// ---------------------------------------------------------------- Meldung, Quittung, Fenster (wie in der Vorlage)
function pruefLink(stichwort) { return 'pruefung.html' + (stichwort ? '#lex-' + stichwort : ''); }
function quit(titel, text, knoepfe = [], attrs = {}) {
  const k = el('div', Object.assign({ class: 'ws-quit', role: 'status' }, attrs),
    el('div', { class: 'ws-quit__t' }, el('b', {}, titel), text ? el('span', {}, text) : null), knoepfe,
    el('button', { class: 'ws-rund', type: 'button', 'aria-label': 'Schliessen', html: ZU, onclick: () => k.remove() }));
  leere($('#ws-quittung')).append(k);
  return k;
}
function melde(text, opt = {}) {
  return quit(text, opt.mehr || '', opt.stichwort ? [el('a', { class: 'ws-taste', href: pruefLink(opt.stichwort) }, 'Was tun?')] : [], { 'data-ws-meldung': opt.stichwort || 'hinweis', role: opt.fehler ? 'alert' : 'status' });
}
function fehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke(text, e && e.stichwort);
  melde(text, { fehler: true, stichwort: (e && e.stichwort) || 'unerwartet' });
}
/* Quittung: «Was · Wo: «vorher» wird «nachher»» und die Zahl weiterer Stellen; «Vorher/nachher ansehen» und «Rückgängig» */
function quittung(titel, zeilen, rueck, ziel) {
  const z = zeilen[0];
  const wert = (t, q) => el('span', { 'data-ws-q': q }, kurz(t, 170) || 'nichts');
  const text = z ? el('span', {}, z.was + ' · ' + z.wo + ': «', wert(z.vorher, 'vorher'), '» wird «', wert(z.nachher, 'nachher'), '»',
    zeilen.length > 1 ? ' und ' + mz(zeilen.length - 1, 'weitere Änderung', 'weitere Änderungen') : '') : null;
  const k = quit(titel, '', [
    zeilen.length ? taste('Vorher/nachher ansehen', () => vergleichFenster(zeilen)) : null,
    ziel ? taste('Ansehen', () => { k.remove(); geh(ziel); }) : null,
    rueck ? taste('Rückgängig', () => rueckgaengig(rueck, k)) : null], { 'data-ws-quittung': zeilen.length || 1 });
  if (text) $('.ws-quit__t', k).append(text);
  return k;
}
function fenster(titel, akzent, inhalt, knoepfe, opt = {}) {
  const ort = $('#ws-fenster');
  const zu = () => { leere(ort); document.removeEventListener('keydown', taste_); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const blatt = el('div', { class: 'ws-fenster__blatt', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel + ' ' + akzent, 'data-ws-fenster': opt.name || '1' },
    el('h2', {}, titel + ' ', el('span', { class: 't-akzent' }, akzent)), inhalt,
    el('div', { class: 'ws-fenster__kn' }, knoepfe.filter(Boolean).map(k => k.haupt ? kn(k.text, () => k.tun(zu), 'kn--d kn--klein', k.attrs || {}) : link(k.text, () => (k.tun ? k.tun(zu) : zu()), k.attrs || {}))));
  leere(ort).append(el('div', { class: 'ws-fenster' }, el('button', { class: 'ws-fenster__grund', type: 'button', 'aria-label': 'Schliessen', onclick: zu }), blatt));
  document.addEventListener('keydown', taste_);
  const erst = blatt.querySelector('input,textarea,select'); if (erst) setTimeout(() => erst.focus(), 30);
  return zu;
}

// ---------------------------------------------------------------- Auswahl und Wahl im Stil des Hauses (wie in der Vorlage)
function auswahl(optionen, wert, beiWahl, name, dunkel) {
  const jetzt = () => optionen.find(o => o.wert === wert) || optionen[0] || { text: '' };
  const kopf_ = el('span', {}, jetzt().text);
  const knopf = el('button', { class: 'ws-auswahl__knopf', type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-label': name }, kopf_, el('span', { html: WINKEL, 'aria-hidden': 'true' }));
  const liste = el('div', { class: 'ws-auswahl__liste', role: 'listbox', hidden: true, 'aria-label': name });
  const k = el('div', { class: 'ws-auswahl' + (dunkel ? ' ws-auswahl--dunkel' : ''), 'data-ws-auswahl': name }, knopf, liste);
  let zeiger = -1;
  const zeig = i => { zeiger = Math.max(0, Math.min(optionen.length - 1, i)); [...liste.children].forEach((c, n) => c.classList.toggle('ws-zeiger', n === zeiger)); liste.children[zeiger].scrollIntoView({ block: 'nearest' }); };
  const zu = () => { liste.hidden = true; knopf.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', aussen, true); };
  const aussen = ev => { if (!k.contains(ev.target)) zu(); };
  const waehle = i => { const o = optionen[i]; zu(); knopf.focus(); if (o.wert !== wert) { wert = o.wert; kopf_.textContent = o.text; beiWahl(o.wert); } };
  const auf = () => {
    leere(liste);
    optionen.forEach((o, i) => liste.append(el('div', { role: 'option', 'aria-selected': o.wert === wert ? 'true' : 'false', 'data-wert': o.wert, onclick: () => waehle(i) },
      el('span', {}, o.text), o.zusatz ? mono(o.zusatz) : null)));
    liste.hidden = false; knopf.setAttribute('aria-expanded', 'true');
    zeig(Math.max(0, optionen.findIndex(o => o.wert === wert)));
    document.addEventListener('click', aussen, true);
  };
  knopf.addEventListener('click', () => (liste.hidden ? auf() : zu()));
  k.addEventListener('keydown', ev => {
    if (liste.hidden) { if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); auf(); } return; }
    if (ev.key === 'Escape') { ev.stopPropagation(); zu(); knopf.focus(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); zeig(zeiger + 1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); zeig(zeiger - 1); }
    else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); waehle(zeiger); }
  });
  return k;
}
function wahl2(optionen, wert, beiWahl, name, hell) {
  const k = el('div', { class: 'ws-wahl2' + (hell ? ' ws-wahl2--hell' : ''), role: 'group', 'aria-label': name, 'data-ws-wahl': name });
  optionen.forEach(o => k.append(el('button', { type: 'button', 'aria-pressed': o.wert === wert ? 'true' : 'false', 'data-wert': o.wert, onclick: ev => {
    if (o.wert === wert) return;
    wert = o.wert;
    [...k.children].forEach(c => c.setAttribute('aria-pressed', c === ev.currentTarget ? 'true' : 'false'));
    beiWahl(o.wert);
  } }, o.text)));
  return k;
}
/* Datum im Stil des Hauses (wie die Termine der Vorlage): Tag, Monat, Jahr als Auswahl, nie die des Betriebssystems; dazu «kein Datum» */
function datumWahl(iso, beiWahl) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || '');
  const jetzt = new Date(heute());
  let t = m ? +m[3] : 0, mo = m ? +m[2] : jetzt.getMonth() + 1, j = m ? +m[1] : jetzt.getFullYear();
  const melde_ = () => { if (!t) return beiWahl(''); const max = new Date(j, mo, 0).getDate(); if (t > max) t = max; beiWahl(`${j}-${String(mo).padStart(2, '0')}-${String(t).padStart(2, '0')}`); };
  const jahre = [jetzt.getFullYear() - 1, jetzt.getFullYear(), jetzt.getFullYear() + 1, jetzt.getFullYear() + 2];
  return el('div', { class: 'cu-datum' },
    auswahl([{ wert: 0, text: 'kein' }].concat(Array.from({ length: 31 }, (_, i) => ({ wert: i + 1, text: (i + 1) + '.' }))), t, x => { t = x; melde_(); }, 'Tag'),
    auswahl(MONATE.map((n, i) => ({ wert: i + 1, text: n })), mo, x => { mo = x; melde_(); }, 'Monat'),
    auswahl(jahre.map(x => ({ wert: x, text: String(x) })), j, x => { j = x; melde_(); }, 'Jahr'));
}

// ---------------------------------------------------------------- Kopf, Rand, Leiste (wie in der Vorlage)
const TITEL = { start: 'Übersicht', liste: 'Alle Kunden', personen: 'Personen', rechnungen: 'Rechnungen' };   /* Termine, Frühere Änderungen und Bestand übernehmen raus (Robert 17.11.2026) */
function ansichtName(a) {
  if (a.startsWith('haus:')) return (haus(a.slice(5)) || {}).name || '';
  if (a.startsWith('pflege:')) return ((haus(a.slice(7)) || {}).name || '') + ' bearbeiten';
  if (a.startsWith('backoffice:')) return 'Backoffice · ' + ((personen().find(p => p.id === a.slice(11)) || {}).name || '');
  return TITEL[a] || '';
}
const offenZahl = () => Object.keys(Z.offen).length;
function kopf() {
  const k = $('#ws-kopf'), n = kunden().length, f = offeneRechnungen().length;
  k.innerHTML = WO.kopf({ werkzeug: W, unter: 'Kunden', titel: ansichtName(Z.ansicht) || WO.name(W), stand: mz(n, 'Kunde', 'Kunden') + (f ? ' · ' + mz(f, 'Rechnung offen', 'Rechnungen offen') : ''),
    pruefung: pruefLink(''), anleitung: 'anleitung.html', website: (H.wege || {}).website || '/zentrale/', marke: 'data-ws-marke', markeHref: '?ansicht=start' });
  const m = k.querySelector('[data-ws-marke]');
  if (m) m.addEventListener('click', ev => { ev.preventDefault(); if (Z.d) geh('start'); });
  const rk = k.querySelector('[data-wo-rand-knopf]'); if (rk) rk.setAttribute('aria-expanded', document.documentElement.classList.contains('wo-rand-auf') ? 'true' : 'false');
}
/* Seitenleiste ein- oder ausgeklappt, je Gerät gemerkt (Kopie aus dem Sales Cockpit, cockpit.js randKlapp, Stand 16.11.2026) */
try { Z.randZu = localStorage.getItem('tasty-kl-rand') === 'zu'; } catch (e) { /* privat */ }
document.documentElement.classList.toggle('kl-rand-zu', !!Z.randZu);
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Hält den sichtbaren Inhalt auf seiner Höhe, während sich die Breite ändert (Safari rückt sonst alles nach oben oder unten) */
function haltHoehe() {
  const h = $('#ws-mitte'); if (!h) return { lauf() {}, ende() {} };
  const hb = h.getBoundingClientRect();
  let a = document.elementFromPoint(Math.min(hb.left + 60, innerWidth - 1), Math.round(innerHeight * .45));
  while (a && a.parentElement && a.parentElement !== h && a.parentElement.getBoundingClientRect().height < innerHeight * .8) a = a.parentElement;
  if (!a || !h.contains(a) || a === h) return { lauf() {}, ende() {} };
  const y0 = a.getBoundingClientRect().top, html = document.documentElement; html.style.overflowAnchor = 'none';
  const zieh = () => { const d = a.getBoundingClientRect().top - y0; if (Math.abs(d) > .5) scrollBy(0, d); };
  let an = true; const lauf = () => { if (!an) return; zieh(); requestAnimationFrame(lauf); };
  return { lauf() { requestAnimationFrame(lauf); }, ende() { an = false; zieh(); html.style.overflowAnchor = ''; } };
}
/* Eine einzige Bewegung: die Spalte wird schmal oder breit, die weisse Fläche wird wie ein Vorhang beschnitten, der Inhalt behält seine Breite, der Knopf gleitet mit */
function randKlapp() {
  const r = $('#ws-rand'), kn = $('#ws-rand [data-rand-kn]'), app = document.body; if (!r || r._laeuft) return; r._laeuft = true;
  Z.randZu = !Z.randZu; try { localStorage.setItem('tasty-kl-rand', Z.randZu ? 'zu' : 'auf'); } catch (e) { /* privat */ }
  const an = !Z.randZu, html = document.documentElement, setze = v => html.classList.toggle('kl-rand-zu', !v);
  if (kn) kn.setAttribute('aria-expanded', an ? 'true' : 'false');
  if (RUHIG() || !matchMedia('(min-width:901px)').matches) { setze(an); r._laeuft = false; return; }
  const EA = 'cubic-bezier(.65,0,.35,1)', D = 720;
  const spalten = () => getComputedStyle(app).gridTemplateColumns;
  const fest = [...r.querySelectorAll(':scope > .kl-rand-kopf, :scope > .kl-rand-inhalt')];
  const mitte = x => { const b = x.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  const halt = haltHoehe();
  const sVor = spalten(), hVor = r.getBoundingClientRect().height, kVor = kn ? mitte(kn) : [0, 0];
  setze(an); const sNach = spalten(), hNach = r.getBoundingClientRect().height, kNach = kn ? mitte(kn) : [0, 0];
  setze(true);
  const hOffen = r.getBoundingClientRect().height;
  fest.forEach(x => { x.style.width = x.getBoundingClientRect().width + 'px'; });
  const kOffen = kn ? mitte(kn) : [0, 0];
  const zuClip = `inset(0px 0px ${Math.max(0, hOffen - Math.min(hVor, hNach))}px 0px round 32px)`, aufClip = 'inset(0px 0px 0px 0px round 18px)';
  const anims = [app.animate([{ gridTemplateColumns: sVor }, { gridTemplateColumns: sNach }], { duration: D, easing: EA, fill: 'forwards' }),
    r.animate([{ clipPath: an ? zuClip : aufClip }, { clipPath: an ? aufClip : zuClip }], { duration: D, easing: EA, fill: 'forwards' })];
  if (kn) { const zu = an ? kVor : kNach, d = [zu[0] - kOffen[0], zu[1] - kOffen[1]], t = `translate(${d[0]}px,${d[1]}px)`;
    anims.push(kn.animate([{ transform: an ? t : 'none' }, { transform: an ? 'none' : t }], { duration: D, easing: EA, fill: 'forwards' })); }
  if (!an) r.querySelectorAll(':scope > .kl-rand-kopf > .wo-mk, :scope > .kl-rand-inhalt').forEach(x =>   /* Schrift verschwindet, bevor die Kante sie erreicht */
    anims.push(x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.round(D * .26), easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })));
  halt.lauf();
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
    setze(an); fest.forEach(x => { x.style.width = ''; }); anims.forEach(a => a.cancel()); halt.ende(); r._laeuft = false;
  });
}
function rand() {
  const r = leere($('#ws-rand')), hs = haeuser().map(sicht);
  const nw = (a, name, zahl, extra) => ({ text: name || ansichtName(a), zahl: zahl || 0, an: Z.ansicht === a, attr: `data-ws-nav="${a}"`, extra: extra ? `<em class="wo-rand__z">${E(extra)}</em>` : '' });
  const kd = hs.filter(istKunde);
  const g = [{ eintraege: [nw('start')] },
    kd.length ? { titel: 'Unsere Kunden', eintraege: kd.map(h => nw('haus:' + h.id, h.name, 0, String(arbeitenZahl(h)))) } : null,
    /* Robert 17.11.2026: eigene Kategorie Backoffice, Rudi «in Arbeit» */
    personen().some(p => p.backoffice) ? { titel: 'Backoffice', eintraege: personen().filter(p => p.backoffice).map(p => nw('backoffice:' + p.id, /«([^»]*)»/.test(p.name) ? p.name.replace(/^.*«([^»]*)»\s*/, '$1 ') : p.name, 0, p.backoffice.stand)) } : null,
    { titel: 'Kundenstamm', eintraege: [nw('liste', '', 0, String(kd.length)), nw('personen', '', 0, String(personen().length)), nw('rechnungen', '', offeneRechnungen().length)] }];
  r.innerHTML = WO.rand(g.filter(Boolean), { website: (H.wege || {}).website || '/zentrale/', pruefung: pruefLink(''), anleitung: 'anleitung.html' });
  {   /* Seitenleiste ein- und ausklappbar wie im Sales Cockpit (16.11.2026): Kopfzeile mit dem Knopf steht, nur der Teil darunter rollt */
    const inhalt = el('div', { class: 'kl-rand-inhalt' }), rk = el('div', { class: 'kl-rand-kopf' });
    while (r.firstChild) inhalt.appendChild(r.firstChild);
    rk.append(el('p', { class: 'wo-mk' }, WO.name(W)));
    rk.insertAdjacentHTML('beforeend', `<button type="button" class="kl-rand-kn" data-rand-kn aria-expanded="${Z.randZu ? 'false' : 'true'}" aria-label="Seitenleiste ein- oder ausklappen" title="Seitenleiste ein- oder ausklappen"><i>${WO.ic('links')}</i><i>${WO.ic('menue')}</i></button>`);
    r.append(rk, inhalt);
    rk.querySelector('[data-rand-kn]').addEventListener('click', randKlapp);
    r.querySelectorAll('.wo-re, .wo-zw, h2, h3').forEach(x => x.setAttribute('data-wo-bw-nie', ''));   /* Einträge stehen ruhig, nichts schiebt sich beim Laden übereinander (wie im Cockpit) */
    const an = r.querySelector('[aria-current="true"], .wo-an'); if (an) { const b = an.getBoundingClientRect(), rb = inhalt.getBoundingClientRect(); if (b.top < rb.top || b.bottom > rb.bottom) inhalt.scrollTop += b.top - rb.top - rb.height / 3; }
  }
  r.querySelectorAll('button[data-ws-nav]').forEach(b => b.addEventListener('click', () => { const a = b.getAttribute('data-ws-nav'), h = /^haus:/.test(a) && haus(a.slice(5)); geh(a, h && ARBEITEN[h.id] ? { zu: 'arbeiten' } : {}); }));
}
/* Unsere Kunden = Häuser mit Vertrag (Robert 16.11.2026: «bei Kunden sind Bestandskunden»); ihre Arbeiten aus arbeiten.js, übernommen aus dem Sales Cockpit */
const ARBEITEN = window.KUNDEN_ARBEITEN || {};
const istKunde = h => h.stand === 'Vertrag' || h.stand === 'Pro bono';   // Pro bono: Website ohne Honorar fürs Netzwerk, Kosten trägt das Haus (Culinarium, Robert 17.11.2026)
const kunden = () => haeuser().filter(istKunde);
/* Personen (Robert 17.11.2026): eigene Liste neben den Kunden, je Person die Häuser, zu denen sie gehört */
const personen = () => (Z.personen || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
const personenVon = h => { const ap = ((h.ansprechpartner || {}).name || '').trim(); return personen().filter(p => (p.haeuser || []).includes(h.id)).sort((a, b) => (b.name === ap) - (a.name === ap)); };   /* die Ansprechperson des Hauses zuerst */
async function personenLaden() { try { Z.personen = (await ruf('GET', X('personen'))).personen || []; } catch (e) { Z.personen = Z.personen || []; } }
/* Termine und Rechnungen der Kunden (Kundenstamm 17.11.2026) */
function tagLage(d) {
  if (!d) return 'ohne';
  const t = heute(); if (d < t) return 'ueber'; if (d === t) return 'heute';
  return (new Date(d) - new Date(t)) / 864e5 <= 7 ? 'bald' : 'spaeter';
}
function tagWann(d) {
  if (!d) return 'ohne Datum';
  const tage = Math.round((new Date(heute()) - new Date(d)) / 864e5);
  if (tage > 0) return 'seit ' + mz(tage, 'Tag', 'Tagen') + ' überfällig';
  if (tage === 0) return 'heute'; if (tage === -1) return 'morgen';
  return 'in ' + mz(-tage, 'Tag', 'Tagen');
}
const termineVon = h => (h.termine || []).map(t => Object.assign({ haus: h, lage: t.erledigt ? 'erledigt' : tagLage(t.datum) }, t));
const alleTermine = () => kunden().flatMap(termineVon).filter(t => !t.erledigt).sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999'));
const rechnungenVon = h => (h.ablage || []).filter(d => d.art === 'Rechnung').map(d => Object.assign({ haus: h }, d)).sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
const alleRechnungen = () => kunden().flatMap(rechnungenVon).sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
const offeneRechnungen = () => alleRechnungen().filter(r => !(r.rechnung || {}).bezahlt);
const groesse = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const arbeitenZahl = h => { const k = ARBEITEN[h.id]; return k ? k.arbeiten.length + (k.buehne ? 1 : 0) + (k.ausserdem || []).length : (Array.isArray(h.adressen) ? h.adressen.length : 0); };
function leiste() {
  const l = $('#ws-leiste');
  if (!Z.d) return;
  const n = offenZahl(), gesp = !n && Z.gesp > Date.now(), z = Z.letzte;
  l.setAttribute('data-ws-offen', String(n));
  l.innerHTML = WO.leiste({
    titel: n ? mz(n, 'Eingabe', 'Eingaben') + ' noch nicht gespeichert' : gesp ? 'Gespeichert' : 'Alles ist gespeichert',
    satz: n ? 'Speichern legt sie in die Liste, mit Quittung und «Rückgängig». Cmd + S geht auch.' : z ? 'Zuletzt ' + z.was + ', ' + zeit(z.wann) + ' von ' + z.wer + '.' : 'Jede Änderung zeigt eine Quittung mit vorher und nachher.',
    entwurf: false,
    knoepfe: (n ? WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'ws-vgl', klein: true }) + WO.knopf('Verwerfen', 'zurueck', 'glas', { id: 'ws-verwerfen', klein: true }) : '')   // wie die Vorlage (leiste_klar): ohne Offenes nur «Speichern»
      + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', n ? 'wartet' : gesp ? 'fertig' : 'glas', { id: 'ws-speichern', klein: true, attr: `data-ws-lage="${n ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` })
  });
  $('#ws-speichern').addEventListener('click', speichern);
  if ($('#ws-vgl')) $('#ws-vgl').addEventListener('click', () => vergleichFenster(offeneZeilen()));
  if ($('#ws-verwerfen')) $('#ws-verwerfen').addEventListener('click', verwerfen);
}
function allesNeu() { kopf(); rand(); leiste(); }

// ---------------------------------------------------------------- Vormerken, Speichern, Rückgängig
function vormerken(key, wert, gleichWie) {
  if (JSON.stringify(wert) === JSON.stringify(gleichWie)) delete Z.offen[key]; else Z.offen[key] = wert;
  leiste(); rand();
}
function offeneZeilen() {
  return Object.entries(Z.offen).map(([k, neu]) => {
    const [id, feld, teil] = k.split('|'), h = haus(id) || {};
    const alt = teil ? (h[feld] || {})[teil] : h[feld];
    const istDatum = ['datum', 'unterschrieben', 'beginn'].includes(teil);
    return { was: FELDNAME[feld] + (teil ? ' · ' + (TEILNAME[teil] || teil) : ''), wo: h.name || id, vorher: istDatum ? datumZeigen(alt) : teil ? String(alt || '') : feldText(feld, alt), nachher: istDatum ? datumZeigen(neu) : teil ? String(neu || '') : feldText(feld, neu), id };
  });
}
async function speichern() {
  const ops = Object.entries(Z.offen);
  if (!ops.length) { melde('Nichts geändert, nichts gespeichert.'); return; }
  const je = {};
  ops.forEach(([k, v]) => {
    const [id, feld, teil] = k.split('|');
    je[id] = je[id] || {};
    if (teil) je[id][feld] = Object.assign({}, je[id][feld] || {}, { [teil]: v }); else je[id][feld] = v;
  });
  const vorher = [], zeilen = [];
  for (const [id, felder] of Object.entries(je)) {
    let a;
    try { a = await ruf('PUT', X('haeuser/' + encodeURIComponent(id)), felder); } catch (e) { fehler(e); await neuLaden(); return; }
    vorher.push(a.vorher);
    a.aenderungen.forEach(x => zeilen.push({ was: x.feld, wo: a.nachher.name, vorher: x.vorher, nachher: x.nachher, id }));
    Object.keys(Z.offen).filter(k => k.startsWith(id + '|')).forEach(k => delete Z.offen[k]);
  }
  Z.gesp = Date.now() + 6000; setTimeout(leiste, 6100);
  await neuLaden();
  quittung('Gespeichert', zeilen, { haeuser: vorher }, zeilen.length && Z.ansicht !== 'haus:' + zeilen[0].id ? 'haus:' + zeilen[0].id : null);
}
function verwerfen() {
  const n = offenZahl();
  fenster('Eingaben', 'verwerfen?', el('div', { class: 'ws-form' }, el('p', {}, mz(n, 'Eingabe ist', 'Eingaben sind') + ' noch nicht gespeichert. Verwerfen stellt jedes Feld zurück, wie es gespeichert ist.')),
    [{ text: 'Behalten' }, { text: 'Verwerfen', haupt: true, tun: zu => { zu(); Z.offen = {}; allesNeu(); zeichne({ halten: true }); melde('Verworfen', { mehr: 'Alle Felder stehen wieder wie gespeichert.' }); } }], { name: 'verwerfen' });
}
/* Rückgängig: {haeuser: [vorher …]} legt Häuser zurück, {weg: id} löscht ein eben angelegtes, {alle: […], quelle} ersetzt die ganze Liste */
async function rueckgaengig(r, karte) {
  try {
    if (r.haeuser) for (const h of r.haeuser) await ruf('POST', X('wiederherstellen'), { haus: h });
    if (r.weg) await ruf('DELETE', X('haeuser/' + encodeURIComponent(r.weg)), {});
    if (r.alle) await ruf('POST', X('alle'), { haeuser: r.alle, quelle: r.quelle });
  } catch (e) { fehler(e); return; }
  if (karte) karte.remove();
  Z.gesp = 0;
  await neuLaden();
  melde('Rückgängig gemacht', { mehr: 'Die Liste ist wie vor dieser Änderung.' });
}
function vergleichFenster(zeilen) {
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'vergleich' },
    zeilen.length ? zeilen.map(z => el('section', { class: 'kl-vgl' }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, z.was), mono(z.wo)), werte(z)))
      : el('p', {}, 'Nichts wartet. Sobald du ein Feld änderst, steht hier vorher und nachher.'));
  fenster('Vorher,', 'nachher.', inhalt, [{ text: 'Schliessen' }], { name: 'vergleich' });
}
function werte(a) {
  return el('div', { class: 'ws-zwei-werte' },
    el('div', {}, mono('Vorher'), el('div', { class: 'ws-wert', 'data-ws-vorher': '1' }, a.vorher || '(nichts)')),
    el('div', {}, mono('Nachher'), el('div', { class: 'ws-wert ws-wert--neu', 'data-ws-nachher': '1' }, a.nachher || '(nichts)')));
}
async function neuLaden() {
  try { Z.d = await ruf('GET', X('haeuser')); } catch (e) { fehler(e); return; }
  await personenLaden();
  letzteAenderung();
  allesNeu();
  await zeichne({ halten: true });
}
function letzteAenderung() {
  let z = null;
  kunden().forEach(h => (h.verlauf || []).concat((h.notizen || []).map(n => ({ wann: n.wann, wer: n.wer, was: 'Notiz' }))).forEach(v => { if (!z || v.wann > z.wann) z = { wann: v.wann, wer: v.wer, was: v.was + ' bei ' + h.name, id: h.id }; }));
  if (z) z.was = kurz(z.was, 60);
  Z.letzte = z;
}

// ---------------------------------------------------------------- Navigation und Titel (wie in der Vorlage)
async function geh(ansicht, opt = {}) {
  Z.ansicht = ansicht;
  try { localStorage.setItem('kl-ort', ansicht); } catch (e) { /* ohne Merken */ }
  try { const u = new URL(location.href); u.searchParams.delete('haus'); u.searchParams.delete('ansicht'); u.searchParams.delete('rundgang'); history.replaceState(null, '', u.pathname + u.search); } catch (e) { /* ohne Adresse */ }
  allesNeu();
  await zeichne(opt);
  if (!opt.halten) window.scrollTo(0, 0);
}
function titel(klein, a, b, satz, knoepfe, art, bildFoto) {
  const h = el('div', { class: 'ws-titel ws-titel--wo', html: WO.startbild({ werkzeug: W, zier: E(klein), h1: E(a ? a + ' ' : '') + (b ? '<em>' + E(b) + '</em>' : ''), satz: satz ? E(satz) : '',
    knoepfe: knoepfe && knoepfe.length ? ' ' : '', art: art || (Z.ansicht === 'start' ? 'voll' : 'buehne'), foto: bildFoto || foto(H.fotoJe && H.fotoJe[W]) }) });
  const k = h.querySelector('.wo-sb__kn'); if (k) { k.textContent = ''; k.append(...knoepfe.filter(Boolean)); }
  return h;
}
/* Knöpfe im Startbild wie in der Vorlage: Links (der erste golden, die weiteren leise), Klick bleibt im Werkzeug */
const woKn = (text, z, art, tun, attrs = {}) => el('a', Object.assign({ class: 'wo-kn' + (art ? ' wo-kn--' + art : ''), href: '#', role: 'button', html: '<span>' + E(text) + '</span><i>' + WO.ic(z) + '</i>', onclick: ev => { ev.preventDefault(); tun(ev); } }, attrs));

// ---------------------------------------------------------------- Übersicht (Kundenstamm 17.11.2026): nur Kunden mit Vertrag, die Akte statt des Verkaufs
function zeichneStart() {
  const m = leere($('#ws-mitte')), kd = kunden().map(sicht), h = new Date().getHours();
  const gruss = h >= 5 && h < 11 ? 'Guten Morgen.' : h >= 11 && h < 18 ? 'Guten Tag.' : 'Guten Abend.';
  const tm = alleTermine(), naechst = tm[0];
  const offen = offeneRechnungen(), ueberR = offen.filter(r => tagLage((r.rechnung || {}).faellig) === 'ueber');
  const z = Z.letzte;
  m.append(titel(WO.name(W) + ' · ' + H.name, gruss, 'Unser Kundenstamm.',
    'Hier steht jeder Kunde von Tasty Studios mit allem, was wir für ihn gemacht haben, dazu Stammdaten, Personen, Ablage und Rechnungen. Neue Häuser beginnen im Sales Cockpit und kommen hierher, sobald alles besprochen ist.',
    [el('a', { class: 'wo-kn wo-kn--gold', href: 'anleitung.html', 'data-ws-anleitung': '1', html: '<span>Anleitung</span><i>' + WO.ic('buch') + '</i>' }),
     el('a', { class: 'wo-kn', href: '/zentrale/werkzeuge/13-sales-cockpit/', html: '<span>Sales Cockpit</span><i>' + WO.ic('pfeil') + '</i>' })]));
  const AUFG = [
    ['neu', 'Kunde anlegen', 'Neu oder aus dem Sales Cockpit übernehmen.', 'plus', 'empfang'],
    ['liste', 'Kunde suchen', 'Nach Name, Ort oder Person.', 'suche', 'bildschirm'],
    ['notiz', 'Notiz schreiben', 'Was besprochen wurde, mit Name und Zeit.', 'stift', 'tafel'],
    ['schritt', 'Nächsten Schritt setzen', 'Was als Nächstes kommt und bis wann.', 'uhr', 'terrasse'],
    ['datei', 'Datei ablegen', 'Vertrag, Angebot, Freigabe oder Mail.', 'kopie', 'studio'],
    ['rechnung', 'Rechnung ablegen', 'Mit Betrag, Fälligkeit und bezahlt oder offen.', 'haken', 'plan'],
    ['rechnungen', 'Offene Rechnungen', offen.length ? mz(offen.length, 'Rechnung wartet', 'Rechnungen warten') + ' auf Zahlung.' : alleRechnungen().length ? 'Alles bezahlt.' : 'Ab Beginn der Zusammenarbeit.', 'glocke', 'aussen'],
    ['personen', 'Personen', 'Wer bei unseren Kunden unser Gegenüber ist, mit Mail und Telefon.', 'person', 'speicherstadt']];
  const rest = el('div', { class: 'ws-wo-start', html:
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Als Nächstes</span><b>${naechst ? E(naechst.datum ? tagWann(naechst.datum) : naechst.haus.name) : 'Nichts geplant'}</b><p>${naechst ? (naechst.datum ? E(naechst.haus.name) + ': ' : '') + E(kurz(naechst.text, 80)) : 'Bei keinem Kunden steht etwas an.'}</p>${naechst ? `<button class="wo-lk" type="button" data-gehe="haus:${E(naechst.haus.id)}">Zum Kunden</button>` : ''}</div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('glocke')}</i><span class="wo-mk">Rechnungen</span><b>${offen.length ? E(mz(offen.length, 'offen', 'offen')) : alleRechnungen().length ? 'Alles bezahlt' : 'Noch keine'}</b><p>${offen.length ? (ueberR.length ? E(mz(ueberR.length, 'davon überfällig', 'davon überfällig')) + '. ' : '') + 'Bezahlt setzt du direkt in der Liste.' : alleRechnungen().length ? E(mz(alleRechnungen().length, 'Rechnung', 'Rechnungen')) + ' abgelegt, keine offen.' : 'Ab Beginn der Zusammenarbeit. Laufende Posten gibt es noch nicht.'}</p><button class="wo-lk" type="button" data-gehe="rechnungen">Zu den Rechnungen</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('verlauf')}</i><span class="wo-mk">Zuletzt</span><b>${z ? E(zeit(z.wann).split(',')[0]) : 'Noch nichts'}</b><p>${z ? E(z.was) + ' (' + E(z.wer) + ').' : 'Jede Änderung steht im Verlauf des Kunden.'}</p>${z ? `<button class="wo-lk" type="button" data-gehe="haus:${E(z.id)}">Zum Kunden</button>` : ''}</div>
    </div>
    <h2 class="wo-zw">Häufig <em>gebraucht</em></h2>
    <div class="wo-aufg ws-aufgaben">${AUFG.map(([ziel, tt, s, ic, fk]) => `<button class="wo-ag ws-ag" type="button" data-aufgabe="${E(ziel)}"><span class="wo-ag__b"><img src="${E(foto(fk))}" alt="" loading="lazy" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(ic)}</i><b>${E(tt)}</b><span>${E(s)}</span></span></button>`).join('')}</div>
    <h2 class="wo-zw">Unsere <em>Kunden</em></h2>` });
  rest.querySelectorAll('[data-gehe]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-gehe'))));
  rest.querySelectorAll('[data-aufgabe]').forEach(b => b.addEventListener('click', () => aufgabe(b.getAttribute('data-aufgabe'))));
  const ort = el('div', { class: 'cu-liste', 'data-kl-liste': '1' });
  kundenKarten(kd, ort);
  rest.append(ort);
  m.append(rest);
}
function kundenKarten(liste, ort, nachReihe = true) {
  if (!liste.length) { ort.append(el('p', { class: 'kuhle ws-leer' }, kunden().length ? 'Kein Kunde passt zu dieser Auswahl.' : 'Noch kein Kunde. «Kunde anlegen» legt den ersten an oder übernimmt ein Haus aus dem Sales Cockpit.')); return; }
  const gezeigt = new Set();
  liste.forEach(h => {
    if (gezeigt.has(h.id)) return;
    const f = nachReihe ? familieVon(h) : null;
    if (!f) { gezeigt.add(h.id); ort.append(karte(haus(h.id))); return; }
    const mit = liste.filter(x => f.ids.includes(x.id));
    mit.forEach(x => gezeigt.add(x.id));
    ort.append(familieBlock(f, mit));
  });
}
function aufgabe(a) {
  if (a === 'neu') return kundeAnlegen();
  if (a === 'notiz' || a === 'schritt' || a === 'datei' || a === 'rechnung') {
    const t = { notiz: 'Notiz', schritt: 'Nächster Schritt', datei: 'Datei', rechnung: 'Rechnung' }[a];
    return hausWaehlen(t, 'für welchen Kunden?', id => {
      const h = haus(id);
      if (a === 'notiz') notizFenster(h); else if (a === 'schritt') terminFenster(h); else dateiFenster(h, a === 'rechnung' ? 'Rechnung' : 'Vertrag');
    });
  }
  return geh(a);
}
function hausWaehlen(t, akzent, weiter) {
  const kd = kunden().slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
  if (!kd.length) { melde('Noch kein Kunde', { mehr: '«Kunde anlegen» legt den ersten an.' }); return; }
  let id = kd[0].id;
  const inhalt = el('div', { class: 'ws-form' }, el('div', { class: 'feld' }, el('span', {}, 'Kunde'),
    auswahl(kd.map(h => ({ wert: h.id, text: h.name, zusatz: h.ort })), id, x => { id = x; }, 'Kunde')));
  fenster(t, akzent, inhalt, [{ text: 'Abbrechen' }, { text: 'Weiter', haupt: true, tun: zu => { zu(); weiter(id); } }], { name: 'haus-waehlen' });
}

// ---------------------------------------------------------------- Ein Haus als Karte (wie die Termine der Vorlage: links die Tafel, rechts die Felder)
// Statt der Datums-Tafel: die Startseite des Hauses im Blender-Laptop (Robert 08.11.2026: «schnelleren Grip als … leere Kacheln»)
function geraetKlein(h, sofort) {   // sofort: in den Familienblöcken gleich laden, kein leerer Bildschirm beim Hinscrollen
  const laden = sofort ? 'eager' : 'lazy';
  return el('button', { type: 'button', class: 'kl-mini', title: h.name + ' öffnen', 'aria-label': h.name + ' öffnen', onclick: () => geh('haus:' + h.id) },
    el('span', { class: 'kl-mini__schirm' }, h.schirm ? el('img', { src: h.schirm, alt: '', loading: laden, decoding: 'async' }) : el('b', {}, h.name)),
    el('img', { class: 'kl-mini__haus', src: '/zentrale/zentrale/img/laptop.webp', alt: '', loading: laden, decoding: 'async' }));
}
function karte(h0) {
  const h = sicht(h0), offen = Object.keys(Z.offen).some(k => k.startsWith(h.id + '|'));
  const t = termineVon(h).filter(x => !x.erledigt).sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999'))[0], l = t ? t.lage : 'ohne';
  const ro = rechnungenVon(h).filter(r => !(r.rechnung || {}).bezahlt);
  const k = el('article', { class: 'cu-t kl-t' + (offen ? ' cu-t--offen' : ''), 'data-kl-haus': h.id },
    el('div', { class: 'cu-t__bild' }, geraetKlein(h)),
    el('div', { class: 'cu-t__felder' },
      el('div', { class: 'cu-t__kopf' }, el('h3', { class: 'cu-t__wann' }, el('button', { class: 'kl-name', type: 'button', onclick: () => geh('haus:' + h.id) }, h.name)),
        l === 'ueber' || l === 'heute' ? el('span', { class: 'cu-t__marke kl-marke--' + l }, l === 'ueber' ? 'überfällig' : 'heute') : null, h.probe ? el('span', { class: 'cu-t__marke kl-marke--probe' }, 'Probe') : null),
      el('p', { class: 'cu-t__frei' }, [h.ort, h.art, (h.ansprechpartner || {}).name].filter(Boolean).join(' · ')),
      el('div', { class: 'cu-t__reihe kl-reihe' },
        el('div', { class: 'cu-f kl-f--schritt' }, el('span', { class: 'cu-f__l' }, 'Als Nächstes'),
          el('span', { class: 'kl-schritt' + (l === 'ueber' ? ' kl-schritt--ueber' : '') }, t ? kurz(t.text, 120) + (t.datum ? ', ' + tagWann(t.datum) : '') : 'Nichts geplant.')),
        el('div', { class: 'cu-f' }, el('span', { class: 'cu-f__l' }, 'Rechnungen'),
          el('span', { class: 'kl-schritt' + (ro.some(r => tagLage((r.rechnung || {}).faellig) === 'ueber') ? ' kl-schritt--ueber' : '') }, ro.length ? mz(ro.length, 'offen', 'offen') : rechnungenVon(h).length ? 'Alles bezahlt' : 'Ab Beginn der Zusammenarbeit'))),
      el('div', { class: 'cu-t__kn' },
        link('Öffnen', () => geh('haus:' + h.id)), link('Notiz', () => notizFenster(h0)), link('Datei ablegen', () => dateiFenster(h0, 'Vertrag')),
        h.entwurf ? el('a', { class: 'ws-link', href: h.entwurf, target: '_blank', rel: 'noopener' }, 'Entwurf ansehen') : null)));
  return k;
}
function neuKarte(id) { const alt = $(`[data-kl-haus="${CSS.escape(id)}"]`); if (!alt) return; if (alt.classList.contains('cu-t')) alt.replaceWith(karte(haus(id))); else if (alt.classList.contains('kl-ast')) alt.replaceWith(spalte(haus(id))); }

// Familien wie im Atelier (Robert 09.11.2026: «dass man sieht, wie die Zusammenhänge zwischen den jeweiligen Häusern sind»):
// oben die gemeinsame Startseite im Laptop, darunter die Linie hinunter zu jedem Haus der Familie. Liste der Familien: familien.js
const FAMILIEN = window.TASTY_FAMILIEN || [];
const familieVon = h => FAMILIEN.find(f => f.ids.includes(h.id)) || null;
function familienStart(f) {
  const a = f.ids.map(haus).filter(Boolean).map(h => (h.adressen || []).find(x => x.gruppe === 'Familie')).find(Boolean);
  return a ? a.url : (f.start || '');
}
// Ein Haus der Familie als Spalte unter der gemeinsamen Startseite (wie im Atelier: Laptop, Ort, Name, darunter Stand und Knöpfe)
function spalte(h0) {
  const h = sicht(h0), offen = Object.keys(Z.offen).some(k => k.startsWith(h.id + '|'));
  const t = termineVon(h).filter(x => !x.erledigt).sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999'))[0];
  const ro = rechnungenVon(h).filter(r => !(r.rechnung || {}).bezahlt).length;
  return el('article', { class: 'kl-ast' + (offen ? ' kl-ast--offen' : ''), 'data-kl-haus': h.id },
    geraetKlein(h, true),
    el('span', { class: 'kl-ast__ort' }, h.ort || h.art || ''),
    el('h4', { class: 'kl-ast__name' }, el('button', { class: 'kl-name', type: 'button', onclick: () => geh('haus:' + h.id) }, h.name)),
    el('p', { class: 'kl-ast__schritt' }, t ? kurz(t.text, 110) + (t.datum ? ', ' + tagWann(t.datum) : '') : 'Nichts geplant.'),
    el('div', { class: 'cu-f kl-ast__stand' }, el('span', { class: 'cu-f__l' }, 'Rechnungen'), el('span', { class: 'kl-schritt' }, ro ? mz(ro, 'offen', 'offen') : rechnungenVon(h).length ? 'Alles bezahlt' : 'Ab Beginn der Zusammenarbeit')),
    el('div', { class: 'kl-ast__kn' },
      link('Öffnen', () => geh('haus:' + h.id)), link('Notiz', () => notizFenster(h0)),
      h.entwurf ? el('a', { class: 'ws-link', href: h.entwurf, target: '_blank', rel: 'noopener' }, 'Entwurf') : null));
}
function familieBlock(f, mitglieder) {
  const start = familienStart(f), name = f.t[0].replace(/\.$/, '');
  const laptop = [el('span', { class: 'kl-mini__schirm' }, el('img', { src: '/zentrale/werkzeuge/13-sales-cockpit/familien/schirm-familie-' + f.k + '.webp', alt: 'Gemeinsame Startseite ' + name, loading: 'eager', decoding: 'async' })),
    el('img', { class: 'kl-mini__haus', src: '/zentrale/zentrale/img/laptop.webp', alt: '', loading: 'eager', decoding: 'async' })];
  return el('section', { class: 'kl-fam', 'data-kl-familie': f.k },
    el('header', { class: 'kl-fam__kopf' },
      el('h3', { class: 'kl-fam__titel' }, el('span', {}, f.t[0]), el('span', { class: 'kl-fam__gold' }, f.t[1] || '')),
      el('p', { class: 'kl-fam__satz' }, f.s)),
    el('div', { class: 'kl-fam__oben' },
      start ? el('a', { class: 'kl-mini kl-fam__geraet', href: start, target: '_blank', rel: 'noopener', title: 'Gemeinsame Startseite ' + name + ' öffnen' }, ...laptop)
            : el('span', { class: 'kl-mini kl-fam__geraet' }, ...laptop),
      start ? el('a', { class: 'kl-fam__link', href: start, target: '_blank', rel: 'noopener' }, el('span', {}, 'Die gemeinsame Startseite'), el('span', {}, 'ansehen'), el('i', { 'aria-hidden': 'true', html: PF }))
            : el('span', { class: 'kl-fam__link' }, el('span', {}, 'Die gemeinsame Startseite'))),
    el('div', { class: 'kl-fam__haeuser', 'data-n': String(mitglieder.length), style: '--n:' + mitglieder.length }, ...mitglieder.map(h => spalte(haus(h.id)))));
}

// ---------------------------------------------------------------- Liste: alle Häuser, filterbar und sortierbar
function gefiltert(vor) {
  const f = Object.assign({}, Z.filter, vor || {}), q = f.q.trim().toLowerCase();
  let l = kunden().map(sicht).filter(h =>
    (!q || [h.name, h.ort, h.art, (h.ansprechpartner || {}).name, h.kuerzel, (h.stammdaten || {}).firma].join(' ').toLowerCase().includes(q)));
  // Unsere Reihenfolge (Robert 08.11.2026): Angelina, Culinarium, Wild Side, Salt & Silver, Rivage, Familie Maeder, Familie Zurbriggen, Schlössli, Schäfli; Neue danach
  const REIHE = ['angelina', 'culinarium', 'wildside', 'saltandsilver', 'beau-rivage', 'carlton', 'doldenhorn', 'ruedihus', 'gasterntal', 'monte-moro', 'zermatt', 'wellness', 'schloessli', 'schaefli'];
  const platz = h => { const i = REIHE.indexOf(h.id); return i < 0 ? 999 : i; };
  const nach = {
    reihe: (a, b) => platz(a) - platz(b) || a.name.localeCompare(b.name, 'de'),
    seit: (a, b) => (b.kunde_seit || '').localeCompare(a.kunde_seit || '') || a.name.localeCompare(b.name, 'de'),
    name: (a, b) => a.name.localeCompare(b.name, 'de'), ort: (a, b) => (a.ort || '').localeCompare(b.ort || '', 'de') || a.name.localeCompare(b.name, 'de'),
    geaendert: (a, b) => (b.geaendert || '').localeCompare(a.geaendert || '')
  };
  return l.sort(nach[f.sort] || nach.reihe);
}
function zeichneListe(vor, kopfText) {
  const m = leere($('#ws-mitte'));
  const fest = vor || {};
  const ort = el('div', { class: 'cu-liste', 'data-kl-liste': '1' });
  const zahl = el('span', { class: 'ws-leise kl-zahl' });
  const fuelle = () => {
    const l = gefiltert(fest);
    leere(ort);
    zahl.textContent = mz(l.length, 'Kunde', 'Kunden');
    kundenKarten(l, ort, Z.filter.sort === 'reihe');
  };
  const such = el('input', { type: 'search', id: 'kl-such', class: 'kl-such', placeholder: 'Kunde, Ort oder Person suchen', value: Z.filter.q, autocomplete: 'off', 'aria-label': 'Suchen' });
  such.addEventListener('input', () => { Z.filter.q = such.value; fuelle(); });
  const reiter = el('div', { class: 'ws-reiter kl-reiter' }, such,
    auswahl([{ wert: 'reihe', text: 'Unsere Reihenfolge' }, { wert: 'name', text: 'Nach Name' }, { wert: 'ort', text: 'Nach Ort' }, { wert: 'seit', text: 'Neueste Kunden zuerst' }, { wert: 'geaendert', text: 'Zuletzt geändert' }], Z.filter.sort, x => { Z.filter.sort = x; fuelle(); }, 'Sortierung', true),
    zahl);
  m.append(kopfText, reiter, ort);
  fuelle();
}
function knNeu() { return woKn('Kunde anlegen', 'plus', 'gold', kundeAnlegen, { 'data-kl-neu': '1' }); }

// ---------------------------------------------------------------- Ein Kunde bearbeiten: Haus, Ansprechperson, Stammdaten, Vertrag (Kundenstamm 17.11.2026)
function zeichneHaus(id, opt) {
  const m = leere($('#ws-mitte')), h0 = haus(id);
  if (!h0) { m.append(titel('Kunden', 'Diesen Kunden', 'gibt es nicht.', 'Vielleicht wurde er gelöscht. Die Liste zeigt alle, die es gibt.', [woKn('Zur Liste', 'menue', 'gold', () => geh('liste'))])); return; }
  const h = sicht(h0);
  m.append(titel((h.art || 'Kunde') + (h.ort ? ' · ' + h.ort : ''), h.name, 'bearbeiten.', 'Was du änderst, wartet gelb, bis du unten speicherst. Die Quittung zeigt vorher und nachher und nimmt es auf Wunsch zurück.',
    [woKn('Zurück zur Akte', 'links', 'gold', () => geh('haus:' + id)), woKn('Notiz schreiben', 'stift', '', () => notizFenster(h0))]));
  const feld = (label, wert, key, alt, art = 'text', hilfe, platz) => {
    const f = el(art === 'lang' ? 'textarea' : 'input', Object.assign({ id: 'kl-' + key.replace(/\|/g, '-'), autocomplete: 'off', spellcheck: 'false', 'data-kl-feld': key, placeholder: platz || '' }, art === 'lang' ? { rows: 3 } : { type: art, value: wert || '' }));
    if (art === 'lang') f.value = wert || '';
    f.addEventListener('input', () => { vormerken(id + '|' + key, f.value.trim(), alt || ''); f.closest('.ws-ang__zeile').classList.toggle('kl-offen', (id + '|' + key) in Z.offen); });
    return el('div', { class: 'ws-ang__zeile feld' + ((id + '|' + key) in Z.offen ? ' kl-offen' : '') }, el('label', { for: f.id }, label), f, hilfe ? el('p', { class: 'ws-klein ws-ang__lage' }, hilfe) : null);
  };
  const zeile = (label, inhalt, key) => el('div', { class: 'ws-ang__zeile feld' + (key && Object.keys(Z.offen).some(k => k.startsWith(id + '|' + key)) ? ' kl-offen' : '') }, el('span', { class: 'kl-l' }, label), inhalt);
  const ap = h.ansprechpartner || {}, ap0 = h0.ansprechpartner || {}, sd = h.stammdaten || {}, sd0 = h0.stammdaten || {}, v = h.vertrag || {}, v0 = h0.vertrag || {};
  const karteForm = (name, titelText, rechts, ...felder) => el('section', { class: 'platte ws-karte ws-form ws-ang kl-ang', 'data-ws-form': name, id: 'kl-form-' + name }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, titelText), rechts || null), ...felder);
  const angaben = karteForm('angaben', 'Das Haus', mono(h.kunde_seit ? 'Kunde seit ' + datumZeigen(h.kunde_seit) : (h.quelle || '')),
    feld('Name', h.name, 'name', h0.name), feld('Ort', h.ort, 'ort', h0.ort), feld('Art', h.art, 'art', h0.art, 'text', '', 'zum Beispiel: Hotel, Restaurant, Bar'),
    feld('Website', h.website, 'website', h0.website, 'url'), feld('Link zum Entwurf', h.entwurf, 'entwurf', h0.entwurf, 'url'),
    feld('Kürzel', h.kuerzel, 'kuerzel', h0.kuerzel, 'text', 'Damit findet der Besucherzähler die Besuche auf dem Entwurf dieses Hauses.'));
  const person = karteForm('person', 'Ansprechperson', ap.mail ? el('a', { class: 'ws-link', href: 'mailto:' + ap.mail }, 'Mail schreiben') : null,
    el('p', { class: 'ws-klein' }, 'Mit wem wir beim Kunden sprechen. Wohin Rechnungen gehen, steht unter «Stammdaten».'),
    feld('Name', ap.name, 'ansprechpartner|name', ap0.name), feld('Rolle', ap.rolle, 'ansprechpartner|rolle', ap0.rolle),
    feld('Mail', ap.mail, 'ansprechpartner|mail', ap0.mail, 'email'), feld('Telefon', ap.telefon, 'ansprechpartner|telefon', ap0.telefon, 'tel'));
  const stamm = karteForm('stammdaten', 'Stammdaten', mono('für Rechnung und Kontakt'),
    feld('Firma', sd.firma, 'stammdaten|firma', sd0.firma, 'text', '', 'wie sie auf der Rechnung steht'),
    feld('Rechnungsadresse', sd.adresse, 'stammdaten|adresse', sd0.adresse, 'lang'),
    feld('Rechnungsempfänger', sd.empfaenger, 'stammdaten|empfaenger', sd0.empfaenger),
    feld('Kundennummer', sd.kundennummer, 'stammdaten|kundennummer', sd0.kundennummer),
    feld('Steuernummer', sd.steuernummer, 'stammdaten|steuernummer', sd0.steuernummer, 'text', '', 'USt-IdNr., KvK oder MWST-Nummer'),
    feld('Umsatzsteuer', sd.umsatzsteuer, 'stammdaten|umsatzsteuer', sd0.umsatzsteuer, 'text', '', 'zum Beispiel: Reverse Charge'),
    feld('Rechnungen an', sd.rechnung_mail, 'stammdaten|rechnung_mail', sd0.rechnung_mail, 'email'),
    feld('Mail der Firma', sd.firmen_mail, 'stammdaten|firmen_mail', sd0.firmen_mail, 'email'),
    feld('Betrieb', sd.betrieb, 'stammdaten|betrieb', sd0.betrieb, 'lang', '', 'Adresse des Betriebs, wenn sie von der Rechnungsadresse abweicht'),
    feld('Telefon', sd.telefon, 'stammdaten|telefon', sd0.telefon, 'tel'),
    feld('Instagram', sd.instagram, 'stammdaten|instagram', sd0.instagram),
    feld('Buchung heute', sd.buchung, 'stammdaten|buchung', sd0.buchung),
    feld('Noch offen', sd.offen, 'stammdaten|offen', sd0.offen, 'lang', '', 'was wir vom Kunden noch brauchen'),
    feld('Domains', sd.domains, 'stammdaten|domains', sd0.domains, 'text', '', 'zum Beispiel: haus.ch, haus.de'),
    feld('Zugänge liegen bei', sd.zugaenge, 'stammdaten|zugaenge', sd0.zugaenge, 'text', 'Nur wo die Zugänge liegen, nie das Passwort selbst.', 'zum Beispiel: Passwörter-App, Eintrag «Haus»'));
  const pc = v.preis_cockpit, preisJetzt = h0.preis && (h0.preis.gross || h0.preis.betrag || h0.preis.betreuung_website || h0.preis.abo_werkzeuge);
  const vertrag = karteForm('vertrag', 'Laufende Verträge', pc ? mono('Preis festgehalten am ' + datumZeigen(v.preis_festgehalten)) : null,
    zeile('Unterschrieben am', datumWahl(v.unterschrieben, x => vormerken(id + '|vertrag|unterschrieben', x, v0.unterschrieben || '')), 'vertrag|unterschrieben'),
    zeile('Beginn', datumWahl(v.beginn, x => vormerken(id + '|vertrag|beginn', x, v0.beginn || '')), 'vertrag|beginn'),
    feld('Einmalig', v.einmalig, 'vertrag|einmalig', v0.einmalig, 'text', '', 'zum Beispiel: Website CHF 10’000 netto'),
    feld('Betreuung im Monat', v.betreuung, 'vertrag|betreuung', v0.betreuung),
    feld('Werkzeuge im Monat', v.abo, 'vertrag|abo', v0.abo),
    feld('Kündigung', v.kuendigung, 'vertrag|kuendigung', v0.kuendigung, 'text', '', 'zum Beispiel: monatlich kündbar'),
    feld('Notiz zum Vertrag', v.notiz, 'vertrag|notiz', v0.notiz, 'lang'),
    !pc && preisJetzt ? el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Preis aus dem Sales Cockpit eintragen', () => {
      const p = h0.preis, b = betrag(p);
      if (b) vormerken(id + '|vertrag|einmalig', b, v0.einmalig || '');
      if (p.betreuung_website) vormerken(id + '|vertrag|betreuung', String(p.betreuung_website), v0.betreuung || '');
      if (p.abo_werkzeuge) vormerken(id + '|vertrag|abo', String(p.abo_werkzeuge), v0.abo || '');
      zeichneHaus(id, { halten: true });
    })) : null);
  const stand = el('section', { class: 'platte ws-karte kl-weg' },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Stand'), mono(h.stand)),
    el('p', {}, 'Kunden haben den Stand «Vertrag». Ein anderer Stand legt das Haus zurück ins Sales Cockpit, alles hier bleibt erhalten.'),
    zeile('Stand', auswahl(STAENDE.map(x => ({ wert: x, text: x })), h.stand, x => { vormerken(id + '|stand', x, h0.stand); zeichneHaus(id, { halten: true }); }, 'Stand'), 'stand'),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Kunde löschen …', () => loeschen(h0))));
  m.append(el('div', { class: 'kl-tafel' }, el('div', { class: 'kl-tafel__l' }, angaben, person, stand), el('div', { class: 'kl-tafel__r' }, stamm, vertrag)));
  if (opt && opt.zeige) setTimeout(() => { const z = $('#kl-form-' + opt.zeige); if (z) z.scrollIntoView({ block: 'start' }); }, 60);
}

// ---------------------------------------------------------------- Ein Kunde auf einen Blick (Robert 08.11.2026): Website im Laptop, Weg der Zusammenarbeit,
// Werkzeuge, Preis, nächster Schritt. Keine Felder und Auswahllisten; gepflegt wird unter «Bearbeiten» (Ansicht pflege:<id>).
const laeuft = h => { const v = h.vertrag || {}; return !!(v.unterschrieben || v.beginn || v.betreuung || v.abo); };
function vertragSatz(h) {
  const v = h.vertrag || {};
  return [v.unterschrieben ? 'Unterschrieben am ' + datumZeigen(v.unterschrieben) : '', v.betreuung ? 'Betreuung ' + v.betreuung + ' im Monat' : '', v.abo ? 'Werkzeuge ' + v.abo + ' im Monat' : '',
    !v.unterschrieben && v.preis_cockpit ? 'Preis aus dem Sales Cockpit vom ' + datumZeigen(v.preis_festgehalten) : ''].filter(Boolean).join(' · ');
}
function betrag(p) {
  if (p && p.gross) return p.gross;
  if (!p || p.betrag == null || p.betrag === '') return '';
  const z = Number(p.betrag); const t = Number.isFinite(z) ? z.toLocaleString('de-CH', { maximumFractionDigits: 0 }).replace(/,/g, '’') : String(p.betrag);
  return (p.waehrung ? p.waehrung + ' ' : '') + t;
}
function zeichneUeberblick(id, opt) {
  const m = leere($('#ws-mitte')), h0 = haus(id);
  if (!h0) { m.append(titel('Die Häuser', 'Dieses Haus', 'gibt es nicht.', 'Vielleicht wurde es gelöscht. Die Liste zeigt alle, die es gibt.', [woKn('Zur Liste', 'menue', 'gold', () => geh('liste'))])); return; }
  const h = sicht(h0), ap = h.ansprechpartner || {};
  const satz = h.kurz || (h.partner ? 'Partner von Tasty Studios.' : '') ;
  m.append(titel((h.partner ? 'Partner' : (h.art || 'Haus')) + (h.ort ? ' · ' + h.ort : ''), h.name, '', satz || 'Die Zusammenarbeit auf einen Blick.',
    [woKn('Datei ablegen', 'kopie', 'gold', () => dateiFenster(h0, 'Vertrag')), woKn('Notiz schreiben', 'stift', 'hell', () => notizFenster(h0)), woKn('Bearbeiten', 'menue', '', () => geh('pflege:' + id)),
     h.entwurf ? el('a', { class: 'wo-kn', href: h.entwurf, target: '_blank', rel: 'noopener', html: '<span>Entwurf ansehen</span><i>' + WO.ic('auge') + '</i>' }) : null], 'buehne', h.bild || undefined));

  // 1 Bühne: die Website im Laptop, daneben Website, Preis und Werkzeuge
  const geraet = el('figure', { class: 'kl-ue__geraet' },
    h.schirm ? el('span', { class: 'kl-ue__schirm' }, el('img', { src: h.schirm, alt: 'Website von ' + h.name, loading: 'lazy', decoding: 'async' }))
             : el('span', { class: 'kl-ue__schirm kl-ue__schirm--leer' }, el('b', {}, 'Noch keine Website'), el('small', {}, h.website ? 'Heute: ' + h.website.replace(/^https?:\/\//, '') : '')),
    el('img', { class: 'kl-ue__haus', src: '/zentrale/zentrale/img/laptop.webp', alt: '', loading: 'lazy', decoding: 'async' }));
  const wz = Array.isArray(h.werkzeuge) ? h.werkzeuge : [];
  const bg = Array.isArray(h.beigaben) ? h.beigaben : [];

  const angaben = el('div', { class: 'kl-ue__angaben' },
    el('div', { class: 'kl-ue__block' }, el('span', { class: 'kl-ue__k' }, 'Die Website'),
      el('b', { class: 'kl-ue__gross' }, h.schirm ? (h.seiten ? mz(h.seiten, 'Seite', 'Seiten') : 'Gebaut') : 'Noch nicht gebaut'),
      el('div', { class: 'kl-ue__links' },
        h.live ? el('a', { href: h.live, target: '_blank', rel: 'noopener' }, 'Online ansehen') : null,
        h.entwurf ? el('a', { href: h.entwurf, target: '_blank', rel: 'noopener' }, 'Entwurf') : null,
        h.website ? el('a', { href: h.website, target: '_blank', rel: 'noopener' }, 'Heutige Seite') : null)),
    el('div', { class: 'kl-ue__block' }, el('span', { class: 'kl-ue__k' }, 'Laufende Verträge'),
      el('b', { class: 'kl-ue__mittel' }, laeuft(h) ? 'Läuft' : 'Keine'),
      el('p', { class: 'kl-ue__fein' }, laeuft(h) ? vertragSatz(h) : 'Sobald ein Vertrag läuft, steht er hier.')),
    el('div', { class: 'kl-ue__block kl-ue__zwei' },
      el('div', {}, el('span', { class: 'kl-ue__k' }, wz.length ? mz(wz.length, 'Werkzeug', 'Werkzeuge') : 'Werkzeuge'),
        wz.length ? el('ul', { class: 'kl-ue__wz' }, ...wz.map(w => el('li', {}, typeof w === 'string' ? w : w.name)))
                  : el('p', { class: 'kl-ue__fein' }, 'Noch keine Werkzeuge gebaut.')),
      el('div', {}, el('span', { class: 'kl-ue__k' }, bg.length ? mz(bg.length, 'Beigabe', 'Beigaben') : 'Beigaben'),
        bg.length ? el('ul', { class: 'kl-ue__wz kl-ue__wz--leise' }, ...bg.map(w => el('li', {}, w)))
                  : el('p', { class: 'kl-ue__fein' }, 'Noch keine Beigaben.'))));
  const buehne = el('section', { class: 'kl-ue', 'aria-label': 'Website, Preis und Werkzeuge' }, geraet, angaben);

  // 2 Als Nächstes über die ganze Breite, darunter Ansprechpersonen und Zuletzt (Robert 17.11.2026: «deutlich übersichtlicher»)
  const notizen = (h0.notizen || []).slice(-3).reverse();
  const offenT = termineVon(h0).filter(x => !x.erledigt).sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999') || (b.wann || '').localeCompare(a.wann || ''));
  const leute = personenVon(h0);
  const unten = el('section', { class: 'kl-ue__unten2' },
    el('div', { class: 'kl-ue__block kl-ue__block--rahmen kl-ue__naechst' }, el('span', { class: 'kl-ue__k' }, 'Als Nächstes'),
      offenT.length ? el('ul', { class: 'kl-tm__liste' }, ...offenT.map(x => terminZeile(h0, x))) : el('p', { class: 'kl-ue__fein' }, 'Nichts geplant.'),
      el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => terminFenster(h0) }, 'Nächsten Schritt setzen'))),
    /* untereinander, jede Tafel so hoch wie ihr Inhalt (Robert 17.11.2026: «riesige, ekelhafte Leerräume» bei «Zuletzt» neben den Personen) */
    el('div', { class: 'kl-untereinander' },
      el('div', { class: 'kl-ue__block kl-ue__block--rahmen' }, el('span', { class: 'kl-ue__k' }, leute.length > 1 ? 'Ansprechpersonen' : 'Ansprechperson'),
        leute.length ? el('ul', { class: 'kl-pp kl-pp--reihe', 'data-n': String(Math.min(leute.length, 3)) }, ...leute.map(personKurz)) : el('b', { class: 'kl-ue__mittel' }, ap.name || 'Noch offen'),
        el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => geh('personen') }, 'Alle Personen'))),
      el('div', { class: 'kl-ue__block kl-ue__block--rahmen' }, el('span', { class: 'kl-ue__k' }, 'Zuletzt'),
        notizen.length ? el('ul', { class: 'kl-ue__notizen kl-ue__notizen--ruhig' }, ...notizen.map(n => el('li', {}, el('small', {}, zeit(n.wann) + (n.wer ? ' · ' + n.wer : '')), el('span', {}, n.text))))
                       : el('p', { class: 'kl-ue__fein' }, 'Noch keine Notiz.'),
        el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => notizFenster(h0) }, 'Notiz schreiben')))));
  // Eine lange Seite (Robert 08.11.2026: «nach unten scrollen … die Informationen direkt alle haben … der Balken wandert automatisch mit»)
  const TEILE = [['ueberblick', 'Überblick', () => [buehne, seitenBlock(h), unten].filter(Boolean)], ...(ARBEITEN[id] ? [['arbeiten', 'Was wir gemacht haben', () => reiterArbeiten(h, ARBEITEN[id])]] : []),
    ['stamm', 'Stammdaten', () => [reiterStamm(h)]], ['vertrag', 'Laufende Verträge', () => [reiterVertrag(h)]], ['ablage', 'Ablage', () => [reiterAblage(h0)]], ['rechnungen', 'Rechnungen', () => [reiterRechnungen(h0)]],
    ['weg', 'Von Anfang bis Ende', () => [reiterWeg(h)]], ['besuche', 'Besuche', () => [reiterBesuche(h)]], ['notizen', 'Notizen', () => [reiterNotizen(h0)]]];
  const knoepfe = {};
  const KURZ = { arbeiten: 'Arbeiten', weg: 'Verlauf' };   /* Reiter in einer Zeile: kurze Namen im Reiter, der volle Titel steht über dem Abschnitt */
  const leiste = el('nav', { class: 'kl-tabs', 'aria-label': 'Bereiche dieses Kunden' }, ...TEILE.map(([k, t]) => (knoepfe[k] = el('button', { type: 'button', class: k === 'ueberblick' ? 'an' : '', title: t, onclick: () => {
    const z = document.getElementById('kl-teil-' + k); if (z) window.scrollTo({ top: z.getBoundingClientRect().top + scrollY - 150, behavior: 'smooth' }); } }, KURZ[k] || t))));
  m.append(leiste);
  TEILE.forEach(([k, t, bau], n) => m.append(el('section', { class: 'kl-teil', id: 'kl-teil-' + k, 'aria-label': t }, n ? el('h2', { class: 'kl-teil__titel' }, t) : null, ...bau())));
  const markiere = () => {
    let jetzt = 'ueberblick';
    TEILE.forEach(([k]) => { const z = document.getElementById('kl-teil-' + k); if (z && z.getBoundingClientRect().top < 220) jetzt = k; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) jetzt = TEILE[TEILE.length - 1][0];
    Object.entries(knoepfe).forEach(([k, b]) => { b.classList.toggle('an', k === jetzt); b.setAttribute('aria-current', k === jetzt ? 'true' : 'false'); });
  };
  if (Z.markiere) removeEventListener('scroll', Z.markiere);
  Z.markiere = markiere; addEventListener('scroll', markiere, { passive: true }); markiere();
  if (opt && opt.zu) requestAnimationFrame(() => requestAnimationFrame(() => { const z = document.getElementById('kl-teil-' + opt.zu); if (z) window.scrollTo({ top: z.getBoundingClientRect().top + scrollY - 150 }); markiere(); }));
}
/* Was wir gemacht haben: Sales-Unterlagen (wenn es sie gibt) und jede Arbeit im Laptop, ein Klick öffnet sie */
function laptop(src, alt, href) {
  return el('a', { class: 'kl-ue__geraet kl-arb__geraet', href, target: '_blank', rel: 'noopener', 'aria-label': alt + ' öffnen' },
    el('span', { class: 'kl-ue__schirm' }, el('img', { src, alt, loading: 'lazy', decoding: 'async' })),
    el('img', { class: 'kl-ue__haus', src: '/zentrale/zentrale/img/laptop.webp', alt: '', loading: 'lazy', decoding: 'async' }));
}
function oeffnen(href) { return el('a', { class: 'kl-arb__auf', href, target: '_blank', rel: 'noopener', html: '<span>Öffnen</span><i>' + WO.ic('pfeil') + '</i>' }); }
function reiterArbeiten(h, K) {
  const B = K.buehne, teile = [];
  if (B) teile.push(el('section', { class: 'kl-arb__sales kl-breit', 'aria-label': B.k || 'Sales-Unterlagen' },
    laptop(B.bild.replace(/\.webp$/, '-900.webp'), B.t.join(''), B.url),
    el('div', { class: 'kl-arb__text' }, el('span', { class: 'kl-ue__k' }, B.k || 'Sales-Unterlagen'), el('h3', {}, B.t.join('')), el('p', {}, B.lead),
      el('ul', { class: 'kl-arb__teile' }, ...B.teile.map(t => el('li', {}, el('a', { href: B.url + t[2], target: '_blank', rel: 'noopener' }, el('b', {}, t[1]), el('small', {}, t[0]))))),
      oeffnen(B.url))));
  /* Nach Art geordnet (Robert 17.11.2026: «alles vermischt … untereinander läuft der Scheiß durch»): erst die Website, dann Werkbank und Werkzeuge, dann der Rest */
  const GRUPPE = { 'Website': 'Die Website', 'Website und Shop': 'Die Website', 'Vergleich': 'Die Website', 'Landingpage': 'Die Website', 'Drops': 'Die Website',
    'Werkbank': 'Werkbank und Werkzeuge', 'Werkzeug': 'Werkbank und Werkzeuge', 'Event': 'Events', 'Sales-Unterlagen': 'Sales-Unterlagen' };
  const gruppen = [];
  K.arbeiten.forEach(a => { const g = GRUPPE[a[0]] || 'Ausserdem'; let x = gruppen.find(y => y.t === g); if (!x) gruppen.push(x = { t: g, l: [] }); x.l.push(a); });
  gruppen.forEach(g => {
    const klein = g.l.length > 2;
    teile.push(el('section', { class: 'kl-arb__gruppe kl-breit' },
      el('h3', { class: 'kl-arb__gt' }, g.t, el('small', {}, String(g.l.length))),
      el('div', { class: 'kl-arb' + (klein ? ' kl-arb--klein' : ''), 'data-n': String(g.l.length) }, ...g.l.map(a => el('article', { class: 'kl-arb__k' },
        el('div', { class: 'kl-arb__buehne' }, laptop('/zentrale/werkzeuge/02-kundenliste/arbeiten/kunde-' + a[4] + '-900.webp', a[1], a[3])),
        el('div', { class: 'kl-arb__text' }, klein ? null : el('span', { class: 'kl-ue__k' }, a[0]), el('h3', {}, a[1]), el('p', {}, a[2]), oeffnen(a[3])))))));
  });
  if ((K.ausserdem || []).length) teile.push(el('div', { class: 'kl-arb__dazu kl-breit' }, el('span', { class: 'kl-ue__k' }, 'Ausserdem'), ...K.ausserdem.map(x => el('span', { class: 'kl-arb__chip' }, x))));
  return teile;
}
// Alle Seiten eines Hauses mit Adresse (Robert 09.11.2026: «Die Seiten müssen … auch noch in die Sales-Folder … und Kundenübersichten»): Website, Werkbank, Werkzeuge, Familienseite
function seitenBlock(h) {
  const a = Array.isArray(h.adressen) ? h.adressen : [];
  if (!a.length && !h.werkbank_stand) return null;
  const zeile = x => el('li', {}, el('a', { href: x.url, target: '_blank', rel: 'noopener' }, el('b', {}, x.name), el('small', {}, x.zu || x.url.replace(/^https?:\/\//, '').replace(/\/(index\.html)?$/, ''))));
  const gr = g => a.filter(x => x.gruppe === g);
  const haupt = gr('Website').concat(gr('Werkbank'), gr('Familie'));
  const wz = gr('Werkzeug');
  return el('section', { class: 'kl-seiten', 'aria-label': 'Alle Seiten' },
    el('span', { class: 'kl-ue__k' }, 'Alle Seiten'),
    el('ul', { class: 'kl-seiten__liste' }, ...haupt.map(zeile),
      !gr('Werkbank').length && h.werkbank_stand ? el('li', { class: 'kl-seiten__bald' }, el('span', {}, el('b', {}, 'Werkbank'), el('small', {}, h.werkbank_stand))) : null),
    wz.length ? el('span', { class: 'kl-ue__k kl-seiten__k2' }, mz(wz.length, 'Werkzeug', 'Werkzeuge')) : null,
    wz.length ? el('ul', { class: 'kl-seiten__liste kl-seiten__liste--wz' }, ...wz.map(zeile)) : null);
}
// Von Anfang bis Ende: jede Station mit Ergebnis und Datum der Unterlage (aus dem Projektordner, echte_kunden.py)
function reiterWeg(h) {
  const st = Array.isArray(h.verlauf_weg) ? h.verlauf_weg : [];
  if (!st.length) return el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit' }, el('span', { class: 'kl-ue__k' }, 'Von Anfang bis Ende'), el('p', { class: 'kl-ue__fein' }, 'Für dieses Haus sind noch keine Schritte hinterlegt.'));
  const fertig = st.filter(x => x.erledigt).length;
  return el('section', { class: 'kl-zeit kl-breit', 'aria-label': 'Schritte der Zusammenarbeit' },
    el('div', { class: 'kl-zeit__kopf' }, el('span', { class: 'kl-ue__k' }, 'Von Anfang bis Ende'), el('b', { class: 'kl-ue__mittel' }, fertig + ' von ' + st.length + ' Schritten erledigt')),
    /* Schritt nicht erledigt, aber ein späterer schon: nicht «Noch offen», sondern was belegt ist (Robert 22.11.2026: «die Punkte bauen doch aufeinander auf») */
    el('ol', { class: 'kl-zeit__liste' }, ...st.map((x, i) => { const weiter = !x.erledigt && st.slice(i + 1).some(y => y.erledigt); return el('li', { class: x.erledigt ? 'da' : weiter ? 'weg' : '' },
      el('i', { class: 'kl-zeit__punkt' }, x.erledigt ? el('span', { html: WO.ic('haken') }) : weiter ? '–' : String(i + 1)),
      el('div', { class: 'kl-zeit__t' }, el('b', {}, x.station), el('p', {}, x.erledigt ? (x.ergebnis || 'Erledigt') : weiter ? (x.ergebnis || 'Keine Unterlage dazu') : 'Noch offen')),
      el('div', { class: 'kl-zeit__r' }, x.datum ? el('small', {}, datumZeigen(x.datum)) : null, x.link ? el('a', { href: x.link, target: '_blank', rel: 'noopener' }, 'Ansehen') : null)); })),
    el('p', { class: 'kl-ue__fein kl-zeit__fuss' }, 'Gelesen aus den Unterlagen im Projektordner des Hauses. Das Datum ist der Stand der jeweiligen Unterlage.'),
    gespraecheBlock(h));
}
/* Was im Sales Cockpit besprochen wurde, bleibt nachlesbar (nur gelesen, nie kopiert) */
function gespraecheBlock(h) {
  const box = el('div', { class: 'kl-gespraech', 'data-kl-gespraech': h.id });
  fetch(X('gespraeche/' + encodeURIComponent(h.id)), { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
    const g = d.gespraech; if (!g) return;
    const st = g.stand || {}, z = [['Gesprächspartner', st.partner], ['Gespräch am', datumZeigen(st.datum)], ['Ergebnis', st.ergebnis], ['Fragen und Einwände', st.einwaende], ['Vereinbart', st.vereinbart], ['Notiz', st.notiz]].filter(x => x[1]);
    const vl = (g.verlauf || []).slice(-6).reverse();
    if (!z.length && !vl.length) return;
    box.append(el('span', { class: 'kl-ue__k' }, 'Aus dem Sales Cockpit'),
      z.length ? el('dl', { class: 'kl-dl' }, ...z.flatMap(x => [el('dt', {}, x[0]), el('dd', {}, x[1])])) : null,
      vl.length ? el('ul', { class: 'kl-ue__notizen' }, ...vl.map(v => el('li', {}, el('small', {}, zeit(v.wann) + ' · ' + (v.wer || '')), el('span', {}, v.was)))) : null);
  }).catch(() => {});
  return box;
}
function reiterVertrag(h) {   /* Robert 17.11.2026: «die Stelle heisst … laufende Verträge», nichts hinterlegen, wo es keinen gibt */
  const v = h.vertrag || {}, vertraege = (h.ablage || []).filter(d => d.art === 'Vertrag');
  const zeilen = laeuft(h) ? [['Unterschrieben am', datumZeigen(v.unterschrieben)], ['Beginn', datumZeigen(v.beginn)], ['Betreuung im Monat', v.betreuung], ['Werkzeuge im Monat', v.abo], ['Kündigung', v.kuendigung]].filter(z => z[1]) : [];
  return el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit' }, el('span', { class: 'kl-ue__k' }, 'Laufende Verträge'),
    zeilen.length ? el('dl', { class: 'kl-dl' }, ...zeilen.flatMap(z => [el('dt', {}, z[0]), el('dd', {}, z[1])])) : el('b', { class: 'kl-ue__mittel' }, 'Keine laufenden Verträge'),
    el('p', { class: 'kl-ue__fein' }, zeilen.length ? (v.notiz || ' ') : 'Sobald ein Vertrag läuft, steht er hier, mit Beginn, Betrag im Monat und Kündigung.'),
    vertraege.length ? el('ul', { class: 'kl-ue__notizen' }, ...vertraege.map(d => el('li', {}, el('small', {}, datumZeigen(d.datum) + ' · Vertrag'), el('button', { type: 'button', class: 'kl-dok__auf', onclick: () => dateiOeffnen(h, d) }, d.titel)))) : null,
    el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => geh('pflege:' + h.id, { zeige: 'vertrag' }) }, 'Vertrag eintragen'), el('button', { type: 'button', onclick: () => dateiFenster(haus(h.id), 'Vertrag') }, 'Vertrag ablegen')));
}
function reiterStamm(h) {   /* Robert 17.11.2026: «viel mehr Informationen», aus Rechnungen, Verträgen und Projektordnern */
  const sd = h.stammdaten || {};
  const firma = [['Firma', sd.firma], ['Rechnungsadresse', sd.adresse], ['Empfänger', sd.empfaenger], ['Kundennummer', sd.kundennummer], ['Steuernummer', sd.steuernummer], ['Umsatzsteuer', sd.umsatzsteuer], ['Rechnungen an', sd.rechnung_mail], ['Noch offen', sd.offen]].filter(z => z[1]);
  const betrieb = [['Betrieb', sd.betrieb], ['Ort', !sd.betrieb ? h.ort : ''], ['Art', h.art], ['Telefon', sd.telefon], ['Mail', sd.firmen_mail], ['Instagram', sd.instagram], ['Buchung heute', sd.buchung]].filter(z => z[1]);
  const technik = [['Website heute', h.website || 'Keine'], ['Entwurf', h.entwurf], ['Domains', sd.domains], ['Zugänge liegen bei', sd.zugaenge], ['Kunde seit', datumZeigen(h.kunde_seit)]].filter(z => z[1]);
  const dl = z => el('dl', { class: 'kl-dl' }, ...z.flatMap(x => [el('dt', {}, x[0]), el('dd', {}, /^https?:/.test(x[1]) ? el('a', { href: x[1], target: '_blank', rel: 'noopener' }, x[1].replace(/^https?:\/\//, '').replace(/\/$/, '')) : x[1])]));
  const bearbeiten = () => el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => geh('pflege:' + h.id, { zeige: 'stammdaten' }) }, 'Stammdaten bearbeiten'));
  const block = (k, z, leer) => el('div', { class: 'kl-ue__block kl-ue__block--rahmen' }, el('span', { class: 'kl-ue__k' }, k), z.length ? dl(z) : el('p', { class: 'kl-ue__fein' }, leer), bearbeiten());
  const leute = personenVon(h);
  return el('section', { class: 'kl-zwei kl-breit kl-stamm' },
    block('Firma und Rechnung', firma, 'Noch keine Firmenangaben eingetragen.'),
    block('Betrieb und Kontakt', betrieb, 'Noch nichts eingetragen.'),
    block('Website und Zugänge', technik, 'Noch nichts eingetragen.'),
    el('div', { class: 'kl-ue__block kl-ue__block--rahmen' }, el('span', { class: 'kl-ue__k' }, 'Personen'),
      leute.length ? el('ul', { class: 'kl-pp kl-pp--reihe', 'data-n': String(Math.min(leute.length, 3)) }, ...leute.map(personKurz)) : el('p', { class: 'kl-ue__fein' }, 'Noch keine Person eingetragen.'),
      el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => personFenster(null, h.id) }, 'Person anlegen'), el('button', { type: 'button', onclick: () => geh('personen') }, 'Alle Personen'))));
}
/* Eine Person kurz: Name, Rolle, Mail und Telefon als Links */
/* Foto der Person (Robert 17.11.2026: «Bilder einfügen»); ohne belegtes Foto die Anfangsbuchstaben */
function personBild(p) {
  return p.bild ? el('img', { class: 'kl-pbild', src: p.bild, alt: p.name, width: 120, height: 120, decoding: 'sync' })
    : el('span', { class: 'kl-pbild kl-pbild--zeichen', 'aria-hidden': 'true' }, (p.name || '?').replace(/«[^»]*»/g, '').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase());
}
function personKurz(p) {
  return el('li', { class: 'kl-pp__z' }, personBild(p), el('div', { class: 'kl-pp__text' }, el('b', {}, p.name), p.rolle ? el('span', {}, p.rolle) : null,
    (p.mail || p.telefon) ? el('small', {}, ...[p.mail ? el('a', { href: 'mailto:' + p.mail }, p.mail) : null, p.mail && p.telefon ? ' · ' : null, p.telefon ? el('a', { href: 'tel:' + p.telefon.replace(/[^+\d]/g, '') }, p.telefon) : null].filter(Boolean)) : null));
}
// Datei öffnen: der Server gibt sie als Text zurück, der Browser zeigt sie in einem neuen Fenster (Dateien liegen nie in einem öffentlichen Ordner)
async function dateiOeffnen(h, d) {
  const w = window.open('', '_blank');
  try {
    const j = await ruf('GET', X('datei/' + encodeURIComponent(h.id) + '/' + encodeURIComponent(d.id)));
    const bin = atob(j.inhalt), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([b], { type: j.typ || 'application/octet-stream' }));
    if (w) w.location.href = url; else location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { if (w) w.close(); fehler(e); }
}
const ARTEN_DATEI = ['Vertrag', 'Angebot', 'Rechnung', 'Freigabe', 'Briefing', 'Mail', 'Sonstiges'];
function dokZeile(h, d, mitHaus) {
  const r = d.rechnung;
  return el('li', { class: 'kl-dok', 'data-kl-datei': d.id },
    el('span', { class: 'kl-dok__art' }, d.art),
    el('div', { class: 'kl-dok__t' }, el('button', { type: 'button', class: 'kl-dok__auf', onclick: () => dateiOeffnen(h, d) }, d.titel),
      el('small', {}, [mitHaus ? h.name : '', datumZeigen(d.datum), d.groesse ? groesse(d.groesse) : '', d.wer ? 'von ' + d.wer : ''].filter(Boolean).join(' · '))),
    r ? el('span', { class: 'cu-t__marke ' + (r.bezahlt ? 'kl-marke--bezahlt' : tagLage(r.faellig) === 'ueber' ? 'kl-marke--ueber' : 'kl-marke--heute') }, r.bezahlt ? 'bezahlt' : 'offen') : null,
    el('button', { type: 'button', class: 'ws-rund kl-dok__weg', 'aria-label': d.titel + ' aus der Ablage nehmen', title: 'Aus der Ablage nehmen', html: ZU, onclick: () => dateiWeg(h, d) }));
}
function reiterAblage(h) {
  const a = (h.ablage || []).slice().sort((x, y) => (y.datum || '').localeCompare(x.datum || ''));
  const box = el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit kl-ablage', 'data-kl-ablage': h.id },
    el('span', { class: 'kl-ue__k' }, a.length ? mz(a.length, 'Datei', 'Dateien') : 'Ablage'),
    a.length ? el('ul', { class: 'kl-dok__liste' }, ...a.map(d => dokZeile(h, d))) : el('p', { class: 'kl-ue__fein' }, 'Noch nichts abgelegt. Verträge, Angebote, Rechnungen, Freigaben und wichtige Mails gehören hierher.'));
  box.append(abwurf(h, 'Vertrag'));
  return box;
}
/* Abwurf-Fläche: Datei hineinziehen oder anklicken, dann fragt das Fenster nach Art, Titel und Datum */
function abwurf(h, art) {
  const f = el('div', { class: 'kl-abwurf', role: 'button', tabindex: '0', onclick: () => dateiFenster(h, art), onkeydown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); dateiFenster(h, art); } } },
    el('i', { 'aria-hidden': 'true', html: WO.ic('kopie') }), el('b', {}, art === 'Rechnung' ? 'Rechnung hierher ziehen' : 'Datei hierher ziehen'), el('span', {}, 'oder klicken und auswählen'));
  f.addEventListener('dragover', ev => { ev.preventDefault(); f.classList.add('kl-abwurf--ziel'); });
  f.addEventListener('dragleave', () => f.classList.remove('kl-abwurf--ziel'));
  f.addEventListener('drop', ev => { ev.preventDefault(); f.classList.remove('kl-abwurf--ziel'); const d = ev.dataTransfer.files && ev.dataTransfer.files[0]; if (d) dateiFenster(h, art, d); });
  return f;
}
function rechnungZeile(h, d, mitHaus) {
  const r = d.rechnung || {}, l = r.bezahlt ? 'bezahlt' : tagLage(r.faellig);
  return el('li', { class: 'kl-re' + (r.bezahlt ? ' kl-re--bezahlt' : l === 'ueber' ? ' kl-re--ueber' : ''), 'data-kl-rechnung': d.id },
    el('div', { class: 'kl-re__t' }, el('button', { type: 'button', class: 'kl-dok__auf', onclick: () => dateiOeffnen(h, d) }, (r.nummer ? 'Nr. ' + r.nummer : d.titel)),
      el('small', {}, [mitHaus ? h.name : '', 'vom ' + datumZeigen(d.datum), r.faellig && !r.bezahlt ? 'fällig ' + datumZeigen(r.faellig) + ' (' + tagWann(r.faellig) + ')' : '', r.bezahlt && r.bezahlt_am ? 'bezahlt am ' + datumZeigen(r.bezahlt_am) : ''].filter(Boolean).join(' · '))),
    el('b', { class: 'kl-re__betrag' }, r.betrag || '–'),
    d.drive ? el('a', { class: 'kl-re__drive', href: d.drive.link, target: '_blank', rel: 'noopener', title: 'In Google Drive öffnen' }, 'Drive')
      : el('button', { type: 'button', class: 'kl-re__drive kl-re__drive--fehlt', title: d.drive_fehler || 'Noch nicht in Google Drive', onclick: () => nachDrive(h, d) }, 'Nach Drive'),
    wahl2([{ wert: 'offen', text: 'Offen' }, { wert: 'bezahlt', text: 'Bezahlt' }], r.bezahlt ? 'bezahlt' : 'offen', x => bezahltSetzen(h, d, x === 'bezahlt'), 'Bezahlt ' + (r.nummer || d.titel), true));
}
function reiterRechnungen(h) {
  const l = rechnungenVon(h), offen = l.filter(r => !(r.rechnung || {}).bezahlt);
  return el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit', 'data-kl-rechnungen': h.id },
    el('span', { class: 'kl-ue__k' }, l.length ? mz(l.length, 'Rechnung', 'Rechnungen') + (offen.length ? ', ' + offen.length + ' offen' : ', alle bezahlt') : 'Rechnungen'),
    l.length ? el('ul', { class: 'kl-re__liste' }, ...l.map(d => rechnungZeile(h, d))) : el('p', { class: 'kl-ue__fein' }, 'Rechnungen ab Beginn der Zusammenarbeit, sobald wir gemeinsam arbeiten und die Gewinne geteilt werden. Laufende Posten gibt es noch nicht.'),
    abwurf(h, 'Rechnung'));
}
function reiterTermine(h) {
  const t = termineVon(h).sort((a, b) => Number(a.erledigt) - Number(b.erledigt) || (a.datum || '9999').localeCompare(b.datum || '9999'));
  return el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit', 'data-kl-termine': h.id },
    el('span', { class: 'kl-ue__k' }, t.length ? mz(t.filter(x => !x.erledigt).length, 'Termin offen', 'Termine offen') : 'Termine'),
    t.length ? el('ul', { class: 'kl-tm__liste' }, ...t.map(x => terminZeile(h, x))) : el('p', { class: 'kl-ue__fein' }, 'Noch kein Termin. Zum Beispiel Abnahme, Rechnung, Verlängerung oder ein Gespräch im Jahr.'),
    el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => terminFenster(h) }, 'Nächsten Schritt setzen')));
}
function terminZeile(h, t, mitHaus) {
  return el('li', { class: 'kl-tm' + (t.erledigt ? ' kl-tm--erledigt' : t.lage === 'ueber' ? ' kl-tm--ueber' : ''), 'data-kl-termin': t.id },
    el('button', { type: 'button', class: 'kl-tm__haken', 'aria-pressed': t.erledigt ? 'true' : 'false', 'aria-label': (t.erledigt ? 'Wieder offen: ' : 'Erledigt: ') + t.text, html: HAKEN, onclick: () => terminSetzen(h, t, { erledigt: !t.erledigt }) }),
    el('div', { class: 'kl-tm__t' }, el('b', {}, t.text), el('small', {}, [mitHaus ? h.name : '', t.datum ? langDatum(t.datum) + (t.erledigt ? '' : ' · ' + tagWann(t.datum)) : 'ohne Datum', t.wer ? 'von ' + t.wer : ''].filter(Boolean).join(' · '))),
    mitHaus ? el('button', { type: 'button', class: 'ws-link', onclick: () => geh('haus:' + h.id, { zu: 'termine' }) }, 'Öffnen') : el('button', { type: 'button', class: 'ws-rund kl-dok__weg', 'aria-label': 'Termin löschen', title: 'Termin löschen', html: ZU, onclick: () => terminWeg(h, t) }));
}
// Besuche auf dem Entwurf: aus dem Besucherzähler (früher eigenes Werkzeug), gefunden über das Kürzel des Hauses
function reiterBesuche(h) {
  const box = el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit' }, el('span', { class: 'kl-ue__k' }, 'Wer hat den Entwurf geöffnet'), el('p', { class: 'kl-ue__fein' }, 'Einen Moment …'));
  fetch('/zentrale/api/03-entwurf-besuche/haeuser', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
    const z = (d.zeilen || []).find(x => x.kuerzel === h.kuerzel || (x.name || '').toLowerCase() === h.name.toLowerCase());
    const kopf = el('span', { class: 'kl-ue__k' }, 'Wer hat den Entwurf geöffnet');
    if (!z) { box.replaceChildren(kopf, el('b', { class: 'kl-ue__mittel' }, 'Noch keine Besuche erfasst'), el('p', { class: 'kl-ue__fein' }, d.quelle === 'probe' ? 'Der Besucherzähler ist noch nicht mit den echten Entwürfen verbunden; bis dahin gibt es hier keine Zahlen.' : 'Für den Entwurf dieses Hauses ist noch kein Besuch gezählt.')); return; }
    const l = z.letzter || {};
    box.replaceChildren(kopf, el('b', { class: 'kl-ue__gross kl-dunkel' }, z.geoeffnet ? mz(z.besuche || 0, 'Besuch', 'Besuche') : 'Noch niemand'),
      l.wer ? el('p', { class: 'kl-ue__fein' }, 'Zuletzt ' + (l.tagwort || '') + ' ' + (l.z || '') + ' · ' + (l.wer.name || '') + (l.von ? ', ' + l.von : '') + ' · ' + (l.seiten || 0) + ' Seiten') : null,
      l.weg ? el('ol', { class: 'kl-besuch' }, ...l.weg.map(w => el('li', {}, el('small', {}, w.z), el('span', {}, w.seite)))) : null);
  }).catch(() => box.replaceChildren(el('span', { class: 'kl-ue__k' }, 'Wer hat den Entwurf geöffnet'), el('p', { class: 'kl-ue__fein' }, 'Der Besucherzähler antwortet gerade nicht.')));
  return box;
}
function reiterNotizen(h0) {
  const n = (h0.notizen || []).slice().reverse();
  return el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit' }, el('span', { class: 'kl-ue__k' }, mz(n.length, 'Notiz', 'Notizen')),
    n.length ? el('ul', { class: 'kl-ue__notizen' }, ...n.map(x => el('li', {}, el('small', {}, zeit(x.wann) + ' · ' + (x.wer || '')), el('span', {}, x.text)))) : el('p', { class: 'kl-ue__fein' }, 'Noch keine Notiz.'),
    el('div', { class: 'kl-ue__links' }, el('button', { type: 'button', onclick: () => notizFenster(h0) }, 'Notiz schreiben')));
}

// ---------------------------------------------------------------- Fenster: Kunde anlegen, Datei, Termin, Notiz, Löschen
/* Kunde anlegen (Robert 17.11.2026: Anna darf Kunden selbst anlegen): neu, oder ein Haus aus dem Sales Cockpit übernehmen (Stand «Vertrag») */
function kundeAnlegen() {
  const offenImCockpit = haeuser().filter(h => !/^(Vertrag|Pro bono|abgesagt)$/.test(h.stand || '')).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  let weg = 'neu', aus = (offenImCockpit[0] || {}).id;
  const name = el('input', { type: 'text', id: 'kl-neu-name', autocomplete: 'off', placeholder: 'zum Beispiel: Hotel Sonne', 'data-ws-feld': 'name' });
  const ort = el('input', { type: 'text', id: 'kl-neu-ort', autocomplete: 'off', placeholder: 'zum Beispiel: Hamburg', 'data-ws-feld': 'ort' });
  const art = el('input', { type: 'text', id: 'kl-neu-art', autocomplete: 'off', placeholder: 'zum Beispiel: Hotel, Restaurant, Bar', 'data-ws-feld': 'art' });
  const person = el('input', { type: 'text', id: 'kl-neu-person', autocomplete: 'off', placeholder: 'Name der Ansprechperson', 'data-ws-feld': 'person' });
  const warn = el('p', { class: 'ws-ang__warn', role: 'alert', hidden: true });
  const teilNeu = el('div', { class: 'ws-form kl-anlegen__teil' },
    el('div', { class: 'feld' }, el('label', { for: name.id }, 'Name des Kunden'), name, warn),
    el('div', { class: 'feld' }, el('label', { for: ort.id }, 'Ort'), ort),
    el('div', { class: 'feld' }, el('label', { for: art.id }, 'Art'), art),
    el('div', { class: 'feld' }, el('label', { for: person.id }, 'Ansprechperson'), person));
  const teilAus = el('div', { class: 'ws-form kl-anlegen__teil', hidden: true },
    offenImCockpit.length ? el('div', { class: 'feld' }, el('span', {}, 'Haus im Sales Cockpit'),
      auswahl(offenImCockpit.map(h => ({ wert: h.id, text: h.name, zusatz: h.stand })), aus, x => { aus = x; }, 'Haus im Sales Cockpit')) : el('p', {}, 'Im Sales Cockpit ist gerade kein Haus offen.'),
    el('p', { class: 'ws-klein' }, 'Das Haus bekommt den Stand «Vertrag», verlässt die offenen Häuser im Cockpit und steht dann hier. Der Preis aus dem Cockpit wird im Vertrag festgehalten.'));
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'neu' },
    wahl2([{ wert: 'neu', text: 'Neuer Kunde' }, { wert: 'aus', text: 'Aus dem Sales Cockpit' }], weg, x => { weg = x; teilNeu.hidden = x !== 'neu'; teilAus.hidden = x !== 'aus'; }, 'Wie', true),
    el('p', { class: 'ws-klein' }, 'Name genügt. Stammdaten, Vertrag und Dateien lassen sich danach in der Akte nachtragen.'), teilNeu, teilAus);
  fenster('Kunde', 'anlegen.', inhalt, [{ text: 'Abbrechen' }, { text: 'Anlegen', haupt: true, attrs: { 'data-kl-anlegen': '1' }, tun: async zu => {
    let a;
    if (weg === 'aus') {
      if (!aus) return;
      try { a = await ruf('PUT', X('haeuser/' + encodeURIComponent(aus)), { stand: 'Vertrag' }); } catch (e) { return fehler(e); }
      zu(); await neuLaden();
      return quittung('In den Kundenstamm übernommen', [{ was: 'Stand', wo: a.nachher.name, vorher: a.vorher.stand, nachher: 'Vertrag' }], { haeuser: [a.vorher] }, 'haus:' + aus);
    }
    if (!name.value.trim()) { warn.hidden = false; warn.textContent = 'Ein Kunde braucht einen Namen.'; name.focus(); return; }
    try { a = await ruf('POST', X('haeuser'), { name: name.value.trim(), ort: ort.value.trim(), art: art.value.trim() || 'Hotel', stand: 'Vertrag', ansprechpartner: { name: person.value.trim() } }); } catch (e) { return fehler(e); }
    zu();
    await neuLaden();
    quittung('Angelegt', [{ was: 'Neuer Kunde', wo: a.haus.name, vorher: '', nachher: a.haus.name + (a.haus.ort ? ', ' + a.haus.ort : '') }], { weg: a.haus.id }, 'haus:' + a.haus.id);
  } }], { name: 'neu' });
}
const lies64 = datei => new Promise((ja, nein) => { const r = new FileReader(); r.onload = () => ja(String(r.result)); r.onerror = () => nein({ fehler: 'Die Datei liess sich nicht lesen.' }); r.readAsDataURL(datei); });
/* Datei ablegen: Art, Titel, Datum; bei Rechnungen Nummer, Betrag, fällig und bezahlt. Rechnungen gehen zusätzlich nach Google Drive. */
function dateiFenster(h, art0, vorDatei) {
  if (!h) return;
  let art = art0 || 'Vertrag', datum = heute(), faellig = '', bezahlt = 'offen', datei = vorDatei || null;
  const titelF = el('input', { type: 'text', id: 'kl-datei-titel', autocomplete: 'off', placeholder: 'zum Beispiel: Vertrag Website und Betreuung', 'data-ws-feld': 'titel' });
  const nummer = el('input', { type: 'text', id: 'kl-re-nummer', autocomplete: 'off', placeholder: 'zum Beispiel: 2026-014', 'data-ws-feld': 'nummer' });
  const betragF = el('input', { type: 'text', id: 'kl-re-betrag', autocomplete: 'off', placeholder: 'zum Beispiel: CHF 5’000', 'data-ws-feld': 'betrag' });
  const wahlF = el('input', { type: 'file', id: 'kl-datei', hidden: true, 'data-ws-feld': 'datei' });
  const name = el('span', { class: 'kl-datei__name' }, datei ? datei.name + ' · ' + groesse(datei.size) : 'Noch keine Datei gewählt');
  const warn = el('p', { class: 'ws-ang__warn', role: 'alert', hidden: true });
  const setze = d => { datei = d; name.textContent = d.name + ' · ' + groesse(d.size); if (!titelF.value) titelF.value = d.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); warn.hidden = true; };
  if (datei) setze(datei);
  wahlF.addEventListener('change', () => { if (wahlF.files[0]) setze(wahlF.files[0]); });
  const feld_re = el('div', { class: 'kl-re__felder', hidden: art !== 'Rechnung' },
    el('div', { class: 'feld' }, el('label', { for: nummer.id }, 'Rechnungsnummer'), nummer),
    el('div', { class: 'feld' }, el('label', { for: betragF.id }, 'Betrag'), betragF),
    el('div', { class: 'feld' }, el('span', {}, 'Fällig am'), datumWahl('', x => { faellig = x; })),
    el('div', { class: 'feld' }, el('span', {}, 'Bezahlt'), wahl2([{ wert: 'offen', text: 'Offen' }, { wert: 'bezahlt', text: 'Bezahlt' }], bezahlt, x => { bezahlt = x; }, 'Bezahlt', true)),
    el('p', { class: 'ws-klein' }, 'Die Rechnung geht zusätzlich in den Ordner des Kunden in Google Drive.'));
  const zone = el('div', { class: 'kl-abwurf kl-abwurf--klein', role: 'button', tabindex: '0', onclick: () => wahlF.click(), onkeydown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); wahlF.click(); } } },
    el('i', { 'aria-hidden': 'true', html: WO.ic('kopie') }), el('b', {}, 'Datei wählen'), name);
  zone.addEventListener('dragover', ev => { ev.preventDefault(); zone.classList.add('kl-abwurf--ziel'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('kl-abwurf--ziel'));
  zone.addEventListener('drop', ev => { ev.preventDefault(); zone.classList.remove('kl-abwurf--ziel'); if (ev.dataTransfer.files[0]) setze(ev.dataTransfer.files[0]); });
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'datei' },
    el('p', { class: 'ws-klein' }, h.name + '. Die Datei liegt nur hier auf dem Rechner, nie online.'),
    zone, wahlF, warn,
    el('div', { class: 'feld' }, el('span', {}, 'Art'), auswahl(ARTEN_DATEI.map(x => ({ wert: x, text: x })), art, x => { art = x; feld_re.hidden = x !== 'Rechnung'; }, 'Art der Datei')),
    el('div', { class: 'feld' }, el('label', { for: titelF.id }, 'Titel'), titelF),
    el('div', { class: 'feld' }, el('span', {}, 'Datum'), datumWahl(datum, x => { datum = x || heute(); })),
    feld_re);
  fenster(art === 'Rechnung' ? 'Rechnung' : 'Datei', 'ablegen.', inhalt, [{ text: 'Abbrechen' }, { text: 'Ablegen', haupt: true, attrs: { 'data-kl-ablegen': '1' }, tun: async zu => {
    if (!datei) { warn.hidden = false; warn.textContent = 'Bitte zuerst eine Datei wählen.'; return; }
    if (datei.size > 15 * 1048576) { warn.hidden = false; warn.textContent = 'Die Datei ist grösser als 15 MB.'; return; }
    let a;
    try {
      a = await ruf('POST', X('haeuser/' + encodeURIComponent(h.id) + '/datei'), { art, titel: titelF.value.trim() || datei.name, datum, name: datei.name, typ: datei.type, inhalt: await lies64(datei),
        rechnung: art === 'Rechnung' ? { nummer: nummer.value.trim(), betrag: betragF.value.trim(), faellig, bezahlt: bezahlt === 'bezahlt' } : undefined });
    } catch (e) { return fehler(e); }
    zu(); await neuLaden();
    const e = a.eintrag;
    quittung(art + ' abgelegt', [{ was: 'Ablage', wo: h.name, vorher: '', nachher: e.titel + (e.rechnung ? ' · ' + (e.rechnung.bezahlt ? 'bezahlt' : 'offen') + (e.drive ? ' · in Google Drive' : e.drive_fehler ? ' · noch nicht in Google Drive (Knopf «Nach Drive» in der Liste)' : '') : '') }], { haeuser: [a.vorher] }, Z.ansicht !== 'haus:' + h.id ? 'haus:' + h.id : null);
  } }], { name: 'datei' });
}
async function dateiWeg(h, d) {
  fenster('Aus der Ablage', 'nehmen?', el('div', { class: 'ws-form' }, el('p', {}, anf(d.titel) + ' verschwindet aus der Ablage von ' + h.name + '. Die Quittung danach hat «Rückgängig».')),
    [{ text: 'Behalten' }, { text: 'Herausnehmen', haupt: true, tun: async zu => {
      let a; try { a = await ruf('DELETE', X('haeuser/' + encodeURIComponent(h.id) + '/datei/' + encodeURIComponent(d.id)), {}); } catch (e) { return fehler(e); }
      zu(); await neuLaden();
      quittung('Herausgenommen', [{ was: 'Ablage', wo: h.name, vorher: d.titel, nachher: '' }], { haeuser: [a.vorher] });
    } }], { name: 'datei-weg' });
}
async function bezahltSetzen(h, d, ja) {
  let a; try { a = await ruf('PUT', X('haeuser/' + encodeURIComponent(h.id) + '/datei/' + encodeURIComponent(d.id)), { rechnung: { bezahlt: ja } }); } catch (e) { return fehler(e); }
  await neuLaden();
  quittung('Gespeichert', [{ was: 'Rechnung', wo: h.name, vorher: (d.rechnung || {}).bezahlt ? 'bezahlt' : 'offen', nachher: ja ? 'bezahlt' : 'offen' }], { haeuser: [a.vorher] });
}
async function nachDrive(h, d) {
  let a; try { a = await ruf('POST', X('haeuser/' + encodeURIComponent(h.id) + '/drive/' + encodeURIComponent(d.id)), {}); } catch (e) { return fehler(e); }
  await neuLaden();
  if (a.eintrag.drive) melde('In Google Drive abgelegt', { mehr: 'Im Ordner von ' + h.name + '.' }); else melde('Noch nicht in Google Drive', { mehr: a.eintrag.drive_fehler || '' });
}
function terminFenster(h) {
  if (!h) return;
  let datum = '';
  const text = el('input', { type: 'text', id: 'kl-termin-text', autocomplete: 'off', placeholder: 'zum Beispiel: Abnahme der Website, Rechnung schicken', 'data-ws-feld': 'termin' });
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'termin' }, el('p', { class: 'ws-klein' }, h.name + '. Was als Nächstes kommt und bis wann.'),
    el('div', { class: 'feld' }, el('label', { for: text.id }, 'Was steht an'), text),
    el('div', { class: 'feld' }, el('span', {}, 'Bis wann'), datumWahl('', x => { datum = x; })));
  fenster('Nächster', 'Schritt.', inhalt, [{ text: 'Abbrechen' }, { text: 'Setzen', haupt: true, attrs: { 'data-kl-termin-setzen': '1' }, tun: async zu => {
    if (!text.value.trim()) { text.focus(); return; }
    let a; try { a = await ruf('POST', X('haeuser/' + encodeURIComponent(h.id) + '/termin'), { text: text.value.trim(), datum }); } catch (e) { return fehler(e); }
    zu(); await neuLaden();
    quittung('Gesetzt', [{ was: 'Termin', wo: h.name, vorher: '', nachher: text.value.trim() + (datum ? ' bis ' + datumZeigen(datum) : '') }], { haeuser: [a.vorher] }, Z.ansicht !== 'haus:' + h.id ? 'haus:' + h.id : null);
  } }], { name: 'termin' });
}
async function terminSetzen(h, t, felder) {
  let a; try { a = await ruf('PUT', X('haeuser/' + encodeURIComponent(h.id) + '/termin/' + encodeURIComponent(t.id)), felder); } catch (e) { return fehler(e); }
  await neuLaden();
  quittung('Gespeichert', [{ was: 'Termin', wo: h.name, vorher: t.erledigt ? 'erledigt' : 'offen', nachher: felder.erledigt ? 'erledigt' : 'offen' }], { haeuser: [a.vorher] });
}
async function terminWeg(h, t) {
  let a; try { a = await ruf('DELETE', X('haeuser/' + encodeURIComponent(h.id) + '/termin/' + encodeURIComponent(t.id)), {}); } catch (e) { return fehler(e); }
  await neuLaden();
  quittung('Gelöscht', [{ was: 'Termin', wo: h.name, vorher: t.text, nachher: '' }], { haeuser: [a.vorher] });
}
function notizFenster(h) {
  const t = el('textarea', { id: 'kl-notiz', rows: 5, placeholder: 'Was wurde besprochen? Wer hat angerufen?', 'data-ws-feld': 'notiz' });
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'notiz' }, el('p', { class: 'ws-klein' }, h.name + '. Die Notiz steht mit deinem Namen (' + wer() + ') und der Zeit im Haus.'),
    el('div', { class: 'feld' }, el('label', { for: t.id }, 'Notiz'), t));
  fenster('Notiz', 'schreiben.', inhalt, [{ text: 'Abbrechen' }, { text: 'Speichern', haupt: true, attrs: { 'data-kl-notiz-speichern': '1' }, tun: async zu => {
    if (!t.value.trim()) { t.focus(); return; }
    let a;
    try { a = await ruf('POST', X('haeuser/' + encodeURIComponent(h.id) + '/notiz'), { text: t.value.trim() }); } catch (e) { return fehler(e); }
    zu();
    Z.gesp = Date.now() + 6000; setTimeout(leiste, 6100);
    await neuLaden();
    quittung('Notiz gespeichert', [{ was: 'Notiz', wo: h.name, vorher: '', nachher: t.value.trim() }], { haeuser: [a.vorher] }, Z.ansicht !== 'haus:' + h.id ? 'haus:' + h.id : null);
  } }], { name: 'notiz' });
}
function loeschen(h) {
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'loeschen' },
    el('p', {}, anf(h.name) + ' mit ' + mz((h.notizen || []).length, 'Notiz', 'Notizen') + ', ' + mz((h.ablage || []).length, 'Datei', 'Dateien') + ' und dem ganzen Verlauf wird gelöscht, auch im Sales Cockpit.'),
    el('p', { class: 'ws-klein' }, 'Die Quittung danach hat «Rückgängig». Die Dateien selbst bleiben auf dem Rechner liegen.'));
  fenster('Kunde', 'löschen?', inhalt, [{ text: 'Behalten' }, { text: 'Löschen', haupt: true, attrs: { 'data-kl-loeschen': '1' }, tun: async zu => {
    let a;
    try { a = await ruf('DELETE', X('haeuser/' + encodeURIComponent(h.id)), {}); } catch (e) { return fehler(e); }
    zu();
    Object.keys(Z.offen).filter(k => k.startsWith(h.id + '|')).forEach(k => delete Z.offen[k]);
    Z.ansicht = 'liste';
    await neuLaden();
    quittung('Gelöscht', [{ was: 'Kunde', wo: h.name, vorher: h.name, nachher: '' }], { haeuser: [a.vorher] });
  } }], { name: 'loeschen' });
}

// ---------------------------------------------------------------- Frühere Änderungen: der Verlauf aller Häuser (wie «Frühere Fassungen» der Vorlage)
function zeichneVerlauf() {
  const m = leere($('#ws-mitte'));
  const alle = [];
  kunden().forEach(h => (h.verlauf || []).forEach(v => alle.push(Object.assign({ haus: h }, v))));
  kunden().forEach(h => (h.notizen || []).forEach(n => alle.push({ haus: h, wann: n.wann, wer: n.wer, was: 'Notiz: ' + kurz(n.text, 120) })));
  alle.sort((a, b) => (b.wann || '').localeCompare(a.wann || ''));
  m.append(titel('Bestand', 'Frühere', 'Änderungen.', 'Jede Änderung und jede Notiz bei den Kunden, mit Name und Zeit, die neueste zuerst. Ein Klick öffnet den Kunden. Zurücknehmen geht mit der Quittung gleich nach dem Speichern.', []));
  if (!alle.length) { m.append(el('p', { class: 'kuhle ws-leer' }, 'Noch keine Änderung. Sobald etwas gespeichert ist, steht es hier.')); return; }
  const tage = {};
  alle.slice(0, 120).forEach(v => { const t = (v.wann || '').slice(0, 10); (tage[t] = tage[t] || []).push(v); });
  Object.entries(tage).forEach(([t, l]) => m.append(el('section', { class: 'platte ws-karte', 'data-kl-tag': t },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, langDatum(t) || 'ohne Datum'), mono(mz(l.length, 'Eintrag', 'Einträge'))),
    l.map(v => el('div', { class: 'cu-vl__z' }, el('b', {}, (zeit(v.wann).split(', ')[1] || '').replace(' Uhr', '') || '–'),
      el('p', {}, el('button', { class: 'ws-link', type: 'button', onclick: () => geh('haus:' + v.haus.id) }, v.haus.name), ': ' + v.was), mono(v.wer || ''))))));
}

// ---------------------------------------------------------------- Bestand: echte Häuser übernehmen, Probedaten
function zeichneBestand() {
  const m = leere($('#ws-mitte')), hs = haeuser(), probe = hs.filter(h => h.probe).length;
  m.append(titel('Bestand', 'Echte Häuser', 'übernehmen.', 'Einmal aus den Unterlagen von Tasty Studios: Projektliste, verschickte Briefe und Projekte. Ein Stand wird nur gesetzt, wo er belegt ist; sonst steht «offen». Nichts wird geraten.',
    [woKn('Echte Häuser übernehmen', 'kopie', 'gold', importieren, { 'data-kl-import': '1' })]));
  m.append(el('section', { class: 'platte ws-karte', 'data-kl-bestand': '1' },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Was gerade in der Liste steht'), mono(Z.d.quelle === 'probedaten' ? 'Probedaten' : 'eigene Daten')),
    el('p', {}, mz(hs.length, 'Haus', 'Häuser') + (probe ? ', davon ' + mz(probe, 'erfundenes Probehaus', 'erfundene Probehäuser') + ' zum Ausprobieren' : '') + '.'),
    el('p', { class: 'ws-klein' }, 'Beim Übernehmen fallen die Probehäuser weg; was von Hand angelegt ist, bleibt. Danach zeigt ein Bericht, was übernommen ist und was die Unterlagen nicht hergeben.')),
    el('section', { class: 'platte ws-karte', id: 'kl-bericht', hidden: true }),
    el('section', { class: 'platte ws-karte' },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Probedaten laden'), mono('ersetzt die ganze Liste')),
      el('p', {}, 'Zehn erfundene, glaubwürdige Häuser, damit sich alles gefahrlos ausprobieren lässt. Die jetzige Liste lässt sich mit der Quittung zurückholen.'),
      el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Probedaten laden …', probedaten))));
}
async function importieren() {
  let a;
  try { a = await ruf('POST', X('import'), {}); } catch (e) { return fehler(e); }
  await neuLaden();
  if (Z.ansicht !== 'bestand') await geh('bestand');
  const b = $('#kl-bericht');
  if (b) { b.hidden = false; leere(b).append(el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Bericht'), mono(mz(a.neu, 'Haus neu', 'Häuser neu'))), el('div', { class: 'ws-liste-klein' }, (a.bericht || []).map(t => el('p', {}, t)))); }
  quittung('Übernommen', [{ was: 'Bestand', wo: 'Kundenliste', vorher: mz(a.vorher_alle.length, 'Haus', 'Häuser'), nachher: mz(haeuser().length, 'Haus', 'Häuser') }], { alle: a.vorher_alle, quelle: a.vorher_quelle });
}
function probedaten() {
  fenster('Probedaten', 'laden?', el('div', { class: 'ws-form' }, el('p', {}, 'Die Liste wird durch zehn erfundene Häuser ersetzt. Mit «Rückgängig» in der Quittung kommt die jetzige Liste zurück.')),
    [{ text: 'Abbrechen' }, { text: 'Laden', haupt: true, attrs: { 'data-kl-probe': '1' }, tun: async zu => {
      let a;
      try { a = await ruf('POST', X('probedaten'), {}); } catch (e) { return fehler(e); }
      zu(); Z.offen = {};
      await neuLaden();
      quittung('Probedaten geladen', [{ was: 'Bestand', wo: 'Kundenliste', vorher: mz(a.vorher_alle.length, 'Haus', 'Häuser'), nachher: mz(a.anzahl, 'Probehaus', 'Probehäuser') }], { alle: a.vorher_alle, quelle: a.vorher_quelle });
    } }], { name: 'probedaten' });
}

// ---------------------------------------------------------------- Rechnungen und Termine aller Kunden
function zeichneRechnungen() {
  const m = leere($('#ws-mitte')), alle = alleRechnungen(), offen = alle.filter(r => !(r.rechnung || {}).bezahlt);
  m.append(titel('Kundenstamm', 'Die', 'Rechnungen.', 'Rechnungen ab Beginn der Zusammenarbeit, sobald wir gemeinsam arbeiten und die Gewinne geteilt werden, mit bezahlt oder offen und einer Kopie im Ordner des Kunden in Google Drive.',
    [woKn('Rechnung ablegen', 'plus', 'gold', () => aufgabe('rechnung')), woKn('Ordner in Drive', 'pfeil', '', driveOrdner)]));
  const ort = el('div', { class: 'kl-breit' });
  const fuelle = () => {
    const l = Z.filter.rechnung === 'offen' ? offen : Z.filter.rechnung === 'bezahlt' ? alle.filter(r => (r.rechnung || {}).bezahlt) : alle;
    leere(ort).append(l.length ? el('ul', { class: 'kl-re__liste platte ws-karte' }, ...l.map(d => rechnungZeile(d.haus, d, true)))
      : el('p', { class: 'kuhle ws-leer' }, alle.length ? (Z.filter.rechnung === 'offen' ? 'Keine Rechnung offen. Alles bezahlt.' : 'Keine Rechnung in dieser Auswahl.') : 'Laufende Posten gibt es noch nicht.'));
  };
  m.append(el('div', { class: 'ws-reiter kl-reiter' }, wahl2([{ wert: 'offen', text: 'Offen (' + offen.length + ')' }, { wert: 'bezahlt', text: 'Bezahlt' }, { wert: 'alle', text: 'Alle' }], Z.filter.rechnung, x => { Z.filter.rechnung = x; fuelle(); }, 'Rechnungen'),
    el('span', { class: 'ws-leise kl-zahl' }, mz(alle.length, 'Rechnung', 'Rechnungen'))), ort);
  fuelle();
}
async function driveOrdner() {
  let a; try { a = await ruf('POST', X('drive/ordner'), {}); } catch (e) { return fehler(e); }
  if (a.ordner) { window.open(a.ordner.wurzel, '_blank', 'noopener'); melde('Ordner in Google Drive bereit', { mehr: 'Je Kunde ein Ordner unter «Tasty Studios · Rechnungen an Kunden».' }); }
  else melde('Google Drive antwortet nicht', { mehr: a.fehler || '' });
}
function zeichneTermine() {
  const m = leere($('#ws-mitte')), t = alleTermine();
  m.append(titel('Kundenstamm', 'Die', 'Termine.', 'Was bei unseren Kunden als Nächstes kommt, das Früheste zuerst. Ein Haken setzt einen Termin auf erledigt.', [woKn('Nächsten Schritt setzen', 'plus', 'gold', () => aufgabe('schritt'))]));
  m.append(t.length ? el('ul', { class: 'kl-tm__liste platte ws-karte kl-breit' }, ...t.map(x => terminZeile(x.haus, x, true))) : el('p', { class: 'kuhle ws-leer' }, 'Kein offener Termin bei den Kunden.'));
}

// ---------------------------------------------------------------- Personen (Robert 17.11.2026): jede Person mit ihren Kunden, Kontakt und Notiz
/* Backoffice (Robert 17.11.2026): wer mit uns gerade ein Backoffice entwickelt, mit Stand */
function zeichneBackoffice(id) {
  const m = leere($('#ws-mitte')), p = personen().find(x => x.id === id && x.backoffice);
  if (!p) { Z.ansicht = 'start'; return zeichneStart(); }
  const b = p.backoffice, h = b.haus && haus(b.haus);
  const rufname = /«([^»]*)»/.test(p.name) ? p.name.replace(/^.*«([^»]*)».*$/, '$1') : p.name.split(/\s+/)[0];
  m.append(titel('Backoffice', rufname + 's', 'Backoffice.', 'Robert entwickelt mit ' + rufname + ' gerade ein Backoffice, zuerst die Kalkulation.',
    [woKn('Zur Person', 'pfeil', 'gold', () => { geh('personen'); })]));
  const zeilen = [['Stand', b.stand], ['Projekt', b.was ? '«' + b.was + '»' : ''], ['Projektanlage', b.seit ? datumZeigen(b.seit) : ''], ['Mail', p.mail], ['Telefon', p.telefon]].filter(z => z[1]);
  m.append(el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit kl-bo' },
    el('span', { class: 'kl-ue__k' }, 'Stand'),
    el('div', { class: 'kl-bo__innen' },
      el('div', { class: 'kl-pp__z' }, personBild(p), el('div', { class: 'kl-pp__text' }, el('b', {}, p.name), p.rolle ? el('span', {}, p.rolle) : null,
        h ? el('button', { type: 'button', class: 'ws-link', onclick: () => geh('haus:' + h.id) }, h.name) : null)),
      el('dl', { class: 'kl-dl' }, ...zeilen.flatMap(z => [el('dt', {}, z[0]), el('dd', {}, z[0] === 'Stand' ? el('b', { class: 'kl-bo__stand' }, z[1]) : z[1])])))));
  /* Micropage und Logo (Robert 19.11.2026: «die Micropage, die ich für Rudi gemacht hatte … Plus das Logo … in seiner Persona») */
  if (b.micropage) m.append(el('section', { class: 'kl-arb__sales kl-breit kl-bo', 'aria-label': 'Die Micropage' },
    laptop(b.micropage.bild, 'Micropage ' + rufname, b.micropage.url),
    el('div', { class: 'kl-arb__text' }, el('span', { class: 'kl-ue__k' }, 'Die Micropage'), el('h3', {}, 'Rudi San'), el('p', {}, b.micropage.satz), oeffnen(b.micropage.url))));
  if (b.logo) m.append(el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit kl-bo' },
    el('span', { class: 'kl-ue__k' }, 'Das Logo'),
    el('p', { class: 'kl-bo__satz' }, b.logo.satz),
    el('div', { class: 'kl-bo__logos' },
      el('a', { class: 'kl-bo__logo kl-bo__logo--dunkel', href: b.logo.url, target: '_blank', rel: 'noopener' }, el('img', { src: b.logo.dunkel, alt: 'Logo auf dunkel', loading: 'lazy', decoding: 'async' }), el('span', {}, 'Logo auf dunkel')),
      el('a', { class: 'kl-bo__logo kl-bo__logo--hell', href: b.logo.url, target: '_blank', rel: 'noopener' }, el('img', { src: b.logo.hell, alt: 'Logo auf hell', loading: 'lazy', decoding: 'async' }), el('span', {}, 'Logo auf hell'))),
    el('div', { class: 'kl-bo__auf' }, oeffnen(b.logo.url))));
  if (b.schritte && b.schritte.length) m.append(el('section', { class: 'kl-ue__block kl-ue__block--rahmen kl-breit kl-bo' },
    el('span', { class: 'kl-ue__k' }, 'Die Kalkulation'),
    b.worum ? el('p', { class: 'kl-bo__satz' }, b.worum) : null,
    el('ol', { class: 'kl-bo__kette', style: '--n:' + b.schritte.length }, ...b.schritte.map(s => el('li', {}, s))),
    b.jetzt ? el('p', { class: 'kl-bo__jetzt' }, b.jetzt) : null));
}
function zeichnePersonen() {
  const m = leere($('#ws-mitte')), l = personen();
  m.append(titel('Kundenstamm', 'Die', 'Personen.', 'Wer bei unseren Kunden unser Gegenüber ist: Rolle, Mail, Telefon und was wir über die Zusammenarbeit wissen.',
    [woKn('Person anlegen', 'plus', 'gold', () => personFenster(null))]));
  m.append(l.length ? el('ul', { class: 'kl-pl platte ws-karte kl-breit' }, ...l.map(personZeile)) : el('p', { class: 'kuhle ws-leer' }, 'Noch keine Person. «Person anlegen» legt die erste an.'));
}
function personZeile(p) {
  const hs = (p.haeuser || []).map(haus).filter(Boolean);
  const kontakt = [p.mail ? el('a', { href: 'mailto:' + p.mail }, p.mail) : null, p.telefon ? el('a', { href: 'tel:' + p.telefon.replace(/[^+\d]/g, '') }, p.telefon) : null, p.instagram ? el('span', {}, p.instagram) : null, p.adresse ? el('span', {}, p.adresse) : null].filter(Boolean);
  return el('li', { class: 'kl-pl__z', 'data-kl-person': p.id },
    el('div', { class: 'kl-pl__kopf' }, personBild(p), el('div', { class: 'kl-pp__text' }, el('b', {}, p.name), p.rolle ? el('span', {}, p.rolle) : null)),
    el('div', { class: 'kl-pl__mitte' },
      hs.length ? el('div', { class: 'kl-pl__haeuser' }, ...hs.map(h => el('button', { type: 'button', class: 'ws-link', onclick: () => geh('haus:' + h.id) }, h.name))) : null,
      kontakt.length ? el('div', { class: 'kl-pl__kontakt' }, ...kontakt) : null,
      p.notiz ? el('p', {}, p.notiz) : null),
    el('div', { class: 'kl-pl__kn' }, link('Bearbeiten', () => personFenster(p)), el('button', { type: 'button', class: 'ws-rund kl-dok__weg', 'aria-label': p.name + ' löschen', title: 'Person löschen', html: ZU, onclick: () => personWeg(p) })));
}
function personFenster(p, hausId) {
  const neu = !p, x = p || { name: '', rolle: '', haeuser: hausId ? [hausId] : [], mail: '', telefon: '', adresse: '', instagram: '', notiz: '' };
  const f = {};
  const feldP = (k, label, art = 'text', platz = '') => { const i = el(art === 'lang' ? 'textarea' : 'input', Object.assign({ id: 'kl-p-' + k, autocomplete: 'off', placeholder: platz }, art === 'lang' ? { rows: 3 } : { type: art, value: x[k] || '' })); if (art === 'lang') i.value = x[k] || ''; f[k] = i; return el('div', { class: 'feld' }, el('label', { for: i.id }, label), i); };
  const wahl = new Set(x.haeuser || []);
  const haeuserWahl = el('div', { class: 'kl-pp__wahl' }, ...kunden().map(h => { const b = el('button', { type: 'button', class: 'kl-chip' + (wahl.has(h.id) ? ' an' : ''), 'aria-pressed': wahl.has(h.id) ? 'true' : 'false' }, h.name);
    b.addEventListener('click', () => { wahl.has(h.id) ? wahl.delete(h.id) : wahl.add(h.id); b.classList.toggle('an', wahl.has(h.id)); b.setAttribute('aria-pressed', wahl.has(h.id) ? 'true' : 'false'); }); return b; }));
  const inhalt = el('div', { class: 'ws-form', 'data-ws-form': 'person' }, feldP('name', 'Name'), feldP('rolle', 'Rolle', 'text', 'zum Beispiel: Ansprechpartner, Küche'),
    el('div', { class: 'feld' }, el('span', {}, 'Gehört zu'), haeuserWahl),
    feldP('mail', 'Mail', 'email'), feldP('telefon', 'Telefon', 'tel'), feldP('adresse', 'Adresse'), feldP('instagram', 'Instagram'), feldP('notiz', 'Notiz', 'lang'));
  fenster(neu ? 'Neue' : x.name, neu ? 'Person.' : 'bearbeiten.', inhalt, [{ text: 'Abbrechen' }, { text: neu ? 'Anlegen' : 'Speichern', haupt: true, tun: async zu => {
    const d = { haeuser: [...wahl] }; Object.keys(f).forEach(k => { d[k] = f[k].value.trim(); });
    if (!d.name) { f.name.focus(); melde('Die Person braucht einen Namen.'); return; }
    let a; try { a = await ruf(neu ? 'POST' : 'PUT', X(neu ? 'personen' : 'personen/' + encodeURIComponent(x.id)), d); } catch (e) { fehler(e); return; }
    zu(); await neuLaden();
    melde(neu ? 'Person angelegt' : 'Gespeichert', { mehr: d.name });
  } }], { name: 'person' });
}
function personWeg(p) {
  fenster(p.name, 'löschen?', el('div', { class: 'ws-form' }, el('p', {}, 'Die Person verschwindet aus der Liste. Die Quittung danach holt sie zurück.')),
    [{ text: 'Behalten' }, { text: 'Löschen', haupt: true, tun: async zu => {
      let a; try { a = await ruf('DELETE', X('personen/' + encodeURIComponent(p.id)), {}); } catch (e) { fehler(e); return; }
      zu(); await neuLaden();
      quit('Gelöscht', p.name, [taste('Rückgängig', async () => { try { await ruf('POST', X('personen/wiederherstellen'), { person: a.vorher }); } catch (e) { fehler(e); return; } await neuLaden(); melde('Zurückgeholt', { mehr: p.name }); })], { 'data-ws-meldung': 'person-weg', role: 'status' });
    } }], { name: 'person-weg' });
}

// ---------------------------------------------------------------- Zeichnen und Start (wie in der Vorlage)
async function zeichne(opt = {}) {
  const lauf = ++Z.zl, a = Z.ansicht, m = $('#ws-mitte');
  m.removeAttribute('data-ws-bereit');
  m.setAttribute('data-ws-ansicht', a);
  try {
    if (a === 'start') zeichneStart();
    else if (a === 'liste') zeichneListe(null, titel('Kundenstamm', 'Alle', 'Kunden.', 'Jeder Kunde mit dem, was als Nächstes kommt, und seinen Rechnungen. Häuser ohne Vertrag stehen im Sales Cockpit.', [knNeu(), woKn('Sales Cockpit', 'pfeil', '', () => { location.href = '/zentrale/werkzeuge/13-sales-cockpit/'; })]));
    else if (a === 'rechnungen') zeichneRechnungen();
    else if (a === 'personen') zeichnePersonen();
    else if (a.startsWith('backoffice:')) zeichneBackoffice(a.slice(11));
    else if (a.startsWith('haus:')) { if (Z.reiterHaus !== a) { Z.reiter = 'ueberblick'; Z.reiterHaus = a; } zeichneUeberblick(a.slice(5), opt); }
    else if (a.startsWith('pflege:')) zeichneHaus(a.slice(7), opt);
    else { Z.ansicht = 'start'; zeichneStart(); }   /* alte Adressen (Termine, Bestand, Verlauf) führen zur Übersicht */
  } catch (e) { fehler(e); }
  if (lauf === Z.zl) m.setAttribute('data-ws-bereit', a);
}
function startFehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke('Start: ' + text, e && e.stichwort);
  $('#ws-rand').hidden = true;
  $('#ws-kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Kunden', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: pruefLink(e && e.stichwort), website: (H.wege || {}).website || '/zentrale/' });
  leere($('#ws-leiste')).innerHTML = WO.leiste({ titel: 'Das Werkzeug startet nicht', satz: 'Nichts ist verloren: die Liste liegt auf dem Server.', knoepfe: WO.knopf('Speichern', 'pfeil', 'glas', { id: 'ws-speichern', klein: true, disabled: true }) });
  leere($('#ws-mitte')).append(el('div', { class: 'platte ws-karte ws-form', style: 'max-width:640px;margin-top:40px', 'data-ws-startfehler': (e && e.stichwort) || 'unerwartet' },
    mono('Das Werkzeug startet nicht'), el('h2', {}, text),
    el('p', {}, 'Die Prüfung läuft unabhängig vom Werkzeug und sagt, woran es liegt.'),
    el('div', { class: 'ws-reihe' }, el('a', { class: 'kn kn--d kn--klein', href: pruefLink(e && e.stichwort) }, el('span', {}, 'Prüfung öffnen'), el('i', { 'aria-hidden': 'true', html: PF })), taste('Noch einmal versuchen', () => location.reload()))));
}
async function start() {
  window.addEventListener('beforeunload', ev => { if (offenZahl()) { ev.preventDefault(); ev.returnValue = ''; } });
  window.addEventListener('error', ev => merke(ev.message || 'Fehler im Werkzeug', 'unerwartet'));
  window.addEventListener('unhandledrejection', ev => merke((ev.reason && (ev.reason.fehler || ev.reason.message)) || 'Fehler im Werkzeug', (ev.reason && ev.reason.stichwort) || 'unerwartet'));
  document.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's' && Z.d) { ev.preventDefault(); speichern(); } });
  document.documentElement.setAttribute('data-haus', 'tasty');
  try {
    Z.d = await ruf('GET', X('haeuser'));
    await personenLaden();
    if (Array.isArray(Z.d.staende) && Z.d.staende.length) STAENDE.splice(0, STAENDE.length, ...Z.d.staende);
    letzteAenderung();
    const q = new URLSearchParams(location.search);
    let a = q.get('ansicht');
    if (q.get('haus') && haus(q.get('haus'))) a = 'haus:' + q.get('haus');   // Direktlink aus «Heute» der Zentrale
    if (!a && !q.has('rundgang') && window.top === window.self) {   /* in der Zentrale immer die Übersicht (Robert 17.11.2026) */ try { a = localStorage.getItem('kl-ort'); } catch (e) { /* ohne Merken */ } }
    if (a && (ansichtName(a) || a === 'start')) Z.ansicht = a;
    allesNeu();
    await zeichne({});
  } catch (e) { startFehler(e); }
}
window.KL = { geh, zustand: () => Z };   // für Rundgang und Prüflauf
start();
})();
