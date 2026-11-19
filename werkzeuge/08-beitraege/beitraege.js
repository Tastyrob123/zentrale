/* beitraege.js · das Werkzeug «Beiträge» (Tasty Studios), gebaut aus Le Bureau der Vorlage (vorlage/culinarium-demo/werkzeuge/bureau/werkzeuge/website/website.js).
   Rahmen, Ablauf und Bausteine wie dort: Kopf, Rand mit Gruppen und Zahlen, Startbild, Lage mit drei Fächern, «Häufig gebraucht», Bereich-Kacheln,
   Arbeitsfläche mit Liste links und Vorschau rechts (wie Stellen und Seite), Leiste unten, Fenster, Quittung mit vorher, nachher und «Rückgängig».
   Inhalt aus der ersten Fassung (Auftrag 08): Haus wählen, Bilder vorher/nachher, Stichpunkte, Vorlage, Text in Abschnitten, Prüfung nach der
   Anti-KI-Checkliste (regeln.js), Vorschau wie ein LinkedIn-Beitrag, Grafik zum Speichern, Archiv mit Stand. Kein KI-Aufruf, nichts wird verschickt.

   Nichts speichert still: Eingaben bleiben in der Arbeitskopie (Z.e), die Leiste unten zählt sie, «Speichern» legt sie ab und antwortet mit einer
   Quittung (vorher, nachher, «Rückgängig»). Fehler landen zusätzlich im Browser (localStorage «bt-fehler»), dort liest sie die Prüfseite (pruefung.html). */
(() => {
'use strict';
const W = '08-beitraege';
const API = '/zentrale/api/' + W + '/';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>';
const WINKEL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
const STAND_NAME = { geplant: 'Geplant', entwurf: 'Entwurf', fertig: 'Fertig', veroeffentlicht: 'Veröffentlicht' };
const WER = (window.WO_HAUS && WO_HAUS.wer) || 'Robert';

const Z = { projekte: [], entwuerfe: [], ansicht: 'start', e: null, g: '', geraet: 'rechner', gesp: 0, zl: 0, wahl: null, grafik: '', lauf: 0, such: '', mehr: false, pr: null, prAuf: null };

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
const schmal = () => window.innerWidth < 1180;
const E = s => (window.WO ? WO.esc(s) : String(s));
function datum(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; }
function zeit(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso || ''); return m ? `${m[3]}.${m[2]}.${m[1]}, ${m[4]}:${m[5]} Uhr` : datum(iso); }
const projekt = id => Z.projekte.find(p => p.id === id) || null;
const hausName = e => { const p = e && projekt(e.projekt_id); return p ? p.name : 'Ohne Haus'; };
const artName = a => (ABSCHNITT_ARTEN[a] || { name: a }).name;
const zahlStand = s => Z.entwuerfe.filter(e => s === 'alle' || e.stand === s).length;
const ersteZeile = e => ((e.abschnitte.find(a => a.art === 'hook') || e.abschnitte[0] || {}).text || '').split('\n')[0];
const kopie = o => JSON.parse(JSON.stringify(o));
/* Echte Häuser (haeuser/haeuser.json, Stand 08.11.2026): Zahlen stehen nur da, wo sie belegt sind. Was fehlt, heisst «nicht belegt», nie geschätzt. */
const ohne = x => x === undefined || x === null || x === '';
const kurzAdresse = a => String(a || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
function hausSatz(p) {
  return [p.art + (p.seit ? ', seit ' + p.seit : '') + '.', p.fertig ? 'Seite neu seit ' + datum(p.fertig) + '.' : '', p.adresse ? kurzAdresse(p.adresse) + '.' : ''].filter(Boolean).join(' ');
}
const ZAHL_FELDER = [['dateien', 'Dateien beim Öffnen', ''], ['ladezeit', 'Sekunden bis zur Seite', ' s'], ['seiten', 'Seiten', ''], ['klicks_bis_tisch', 'Klicks bis zum Tisch', '']];
function hausZahlen(p) {
  const v = p.vorher || {}, n = p.nachher || {};
  const wert = (x, k, e) => ohne(x) ? 'nicht belegt' : k === 'seiten' && x === 0 ? 'keine Website' : x + e;
  return ZAHL_FELDER.filter(([k]) => !ohne(v[k]) || !ohne(n[k])).map(([k, was, e]) => ({ was, vorher: wert(v[k], k, e), nachher: wert(n[k], k, e) })).concat(p.zahlen || []);
}
const HERKUNFT_NAME = { uebernommen: 'Übernommen', neu: 'Neu gebaut', geplant: 'Als Nächstes' };
function herkunftText(e) {
  const h = e.herkunft || {};
  if (h.art === 'neu') return h.gelesen ? 'Neu gebaut, von Robert gelesen am ' + datum(h.gelesen) : 'Entwurf, von Robert noch nicht gelesen';
  if (h.art === 'uebernommen') return 'Übernommen aus dem LinkedIn-Archiv' + (h.text ? ', ' + h.text : '');
  if (h.art === 'geplant') return 'Als nächster Beitrag vorgemerkt, noch ohne Text';
  return '';
}
function herkunftZeile(e) {
  const t = herkunftText(e); if (!t) return null;
  const h = e.herkunft || {};
  return el('p', { class: 'bt-herkunft bt-herkunft--' + (h.art === 'neu' && !h.gelesen ? 'ungelesen' : h.art), 'data-bt-herkunft': h.art }, t);
}

function merke(text, stichwort) {
  try {
    const l = JSON.parse(localStorage.getItem('bt-fehler') || '[]');
    l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 400), stichwort: stichwort || '', wo: Z.ansicht });
    localStorage.setItem('bt-fehler', JSON.stringify(l.slice(-30)));
  } catch (e) { /* voller oder gesperrter Speicher: die Meldung steht trotzdem auf der Seite */ }
}
let unterwegs = 0;   // laufende Anfragen, steht als data-ws-laeuft am <html> (der Prüflauf wartet darauf)
function zaehle(n) { unterwegs += n; document.documentElement.setAttribute('data-ws-laeuft', unterwegs); }
async function ruf(methode, weg, daten) {
  let r, j = null;
  zaehle(1);
  try {
    const q = methode === 'GET' && daten ? '?' + new URLSearchParams(daten) : '';
    r = await fetch(API + weg + q, { method: methode, headers: methode !== 'GET' ? { 'Content-Type': 'application/json' } : {}, body: methode !== 'GET' ? JSON.stringify(daten || {}) : undefined, cache: 'no-store' });
    try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  } catch (e) { throw { stichwort: 'VERBINDUNG', fehler: 'Der Server des Werkzeugs antwortet nicht.' }; } finally { zaehle(-1); }
  if (!r.ok || j == null) throw Object.assign({ status: r.status, stichwort: r.status === 404 ? 'FEHLT' : 'SERVER', fehler: 'Unerwartete Antwort des Servers (' + r.status + ').' }, j || {});
  return j;
}

// ---------------------------------------------------------------- Meldung, Quittung, Fenster
function pruefLink(stichwort) { return 'pruefung.html' + (stichwort ? '#' + stichwort : ''); }
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
  melde(text, { fehler: true, stichwort: (e && e.stichwort) || 'SERVER' });
}
/* Quittung: zeilen [{was, vorher, nachher}], rueck {aktion, vorher, nachher} für «Rückgängig» */
function quittung(titel, zeilen, rueck) {
  const z = zeilen[0] || { was: 'Beitrag', vorher: '', nachher: '' };
  const text = el('span', {}, z.was + ': «', el('span', { 'data-ws-q': 'vorher' }, kurz(z.vorher, 120) || 'nichts'), '» wird «', el('span', { 'data-ws-q': 'nachher' }, kurz(z.nachher, 120) || 'nichts'), '»',
    zeilen.length > 1 ? ' und ' + mz(zeilen.length - 1, 'weitere Änderung', 'weitere Änderungen') : '');
  const k = quit(titel, '', [
    taste('Vorher/nachher ansehen', () => vorherNachherFenster(titel, zeilen)),
    rueck ? taste('Rückgängig', () => rueckgaengig(rueck, k)) : null], { 'data-ws-quittung': zeilen.length });
  $('.ws-quit__t', k).append(text);
}
function vorherNachherFenster(titel, zeilen) {
  fenster(titel, 'vorher, nachher.', el('div', { class: 'ws-form bt-vn' }, zeilen.map(z => el('section', {}, mono(z.was), werte(z)))), [{ text: 'Schliessen' }], { name: 'vorher-nachher' });
}
function fenster(titel, akzent, inhalt, knoepfe, opt = {}) {
  const ort = $('#ws-fenster');
  const zu = () => { leere(ort); document.removeEventListener('keydown', taste_); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const blatt = el('div', { class: 'ws-fenster__blatt', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel + ' ' + akzent, 'data-ws-fenster': opt.name || '1' },
    el('h2', {}, titel + ' ', el('span', { class: 't-akzent' }, akzent)), inhalt,
    el('div', { class: 'ws-fenster__kn' }, knoepfe.filter(Boolean).map(k => k.haupt ? kn(k.text, () => k.tun(zu), 'kn--d kn--klein') : link(k.text, () => (k.tun ? k.tun(zu) : zu())))));
  leere(ort).append(el('div', { class: 'ws-fenster' }, el('button', { class: 'ws-fenster__grund', type: 'button', 'aria-label': 'Schliessen', onclick: zu }), blatt));
  document.addEventListener('keydown', taste_);
  const erstes = $('input, textarea, .ws-auswahl__knopf', blatt); if (erstes) erstes.focus();
  return zu;
}
function werte(a) {
  return el('div', { class: 'ws-zwei-werte' },
    el('div', {}, mono('Vorher'), el('div', { class: 'ws-wert', 'data-ws-vorher': '1' }, a.vorher || '(nichts)')),
    el('div', {}, mono('Nachher'), el('div', { class: 'ws-wert ws-wert--neu', 'data-ws-nachher': '1' }, a.nachher || '(nichts)')));
}

// ---------------------------------------------------------------- Auswahl und Wahl (wie in der Vorlage)
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

// ---------------------------------------------------------------- Gesamttext, Unterschiede
function gesamttext(e) {
  const teile = [], lagen = [];
  let pos = 0;
  (e.abschnitte || []).forEach((a, i) => {
    const t = (a.text || '').trim();
    if (!t) return;
    if (teile.length) pos += 2;
    lagen.push({ i, art: a.art, von: pos, bis: pos + t.length });
    teile.push(t);
    pos += t.length;
  });
  let text = teile.join('\n\n'), hashtagsVon = -1;
  const h = (e.hashtags || '').trim();
  if (h) { hashtagsVon = text.length + (text ? 2 : 0); text = text ? text + '\n\n' + h : h; }
  return { text, lagen, hashtagsVon };
}
function bildText(b) { return !b ? 'kein Bild' : b.art === 'ablage' ? 'Bild in der Ablage' : /\/haeuser\/bilder\//.test(b.wert) ? 'Bild vom Haus' : b.wert; }
/* Was sich zwischen zwei Fassungen eines Beitrags unterscheidet, Zeile für Zeile mit vorher und nachher */
function unterschiede(v, n) {
  if (!v && !n) return [];
  if (!v) return [{ was: 'Beitrag', vorher: 'noch nicht angelegt', nachher: hausName(n) + ', ' + STAND_NAME[n.stand] }];
  if (!n) return [{ was: 'Beitrag', vorher: hausName(v) + ', ' + STAND_NAME[v.stand], nachher: 'gelöscht' }];
  const z = [];
  if (v.projekt_id !== n.projekt_id) z.push({ was: 'Haus', vorher: hausName(v), nachher: hausName(n) });
  if (v.stand !== n.stand) z.push({ was: 'Stand', vorher: STAND_NAME[v.stand], nachher: STAND_NAME[n.stand] });
  if (v.vorlage !== n.vorlage) z.push({ was: 'Vorlage', vorher: vorlage(v.vorlage).name, nachher: vorlage(n.vorlage).name });
  const len = Math.max(v.abschnitte.length, n.abschnitte.length);
  for (let i = 0; i < len; i++) {
    const a = v.abschnitte[i], b = n.abschnitte[i];
    if (a && b && a.art === b.art && a.text === b.text) continue;
    z.push({ was: b ? artName(b.art) : 'Abschnitt ' + (i + 1), vorher: a ? (a.art !== (b && b.art) ? artName(a.art) + ': ' : '') + a.text : '', nachher: b ? b.text : '' });
  }
  if ((v.herkunft || {}).gelesen !== (n.herkunft || {}).gelesen) z.push({ was: 'Gelesen', vorher: herkunftText(v), nachher: herkunftText(n) });
  if (JSON.stringify(v.stichpunkte) !== JSON.stringify(n.stichpunkte)) z.push({ was: n.stand === 'geplant' ? 'Eckdaten' : 'Was anders ist', vorher: v.stichpunkte.join(' · '), nachher: n.stichpunkte.join(' · ') });
  if ((v.hashtags || '') !== (n.hashtags || '')) z.push({ was: 'Hashtags', vorher: v.hashtags, nachher: n.hashtags });
  for (const s of ['vorher', 'nachher']) if (JSON.stringify(v.bilder[s] || null) !== JSON.stringify(n.bilder[s] || null)) z.push({ was: 'Bild ' + s, vorher: bildText(v.bilder[s]), nachher: bildText(n.bilder[s]) });
  if (v.grafik !== n.grafik) z.push({ was: 'Format der Grafik', vorher: v.grafik === 'quadrat' ? 'Quadrat 1080 × 1080' : 'Quer 1200 × 628', nachher: n.grafik === 'quadrat' ? 'Quadrat 1080 × 1080' : 'Quer 1200 × 628' });
  return z;
}
function sauber(e) { const k = kopie(e); delete k.neu; delete k.geaendert; delete k.erstellt; k.abschnitte = k.abschnitte.map(a => ({ art: a.art, text: a.text })); return k; }
const gespeichert = () => (Z.g ? JSON.parse(Z.g) : null);
const offenListe = () => (Z.e ? unterschiede(gespeichert(), sauber(Z.e)) : []);
const offenZahl = () => offenListe().length;

// ---------------------------------------------------------------- Kopf, Rand, Leiste
const TITEL = { start: 'Übersicht', 'l:geplant': 'Als Nächstes', 'l:entwurf': 'Im Entwurf', 'l:fertig': 'Fertig zum Posten', 'l:veroeffentlicht': 'Veröffentlicht', 'l:alle': 'Alle Beiträge',
  text: 'Text & Vorschau', bild: 'Bild vorher/nachher', angaben: 'Haus, Vorlage, Stand', vergleich: 'Vorher, nachher', vorlagen: 'Vorlagen', regeln: 'Prüfregeln' };
const BEITRAG = ['text', 'bild', 'angaben', 'vergleich'];
function ansichtName(a) {
  if (a.startsWith('h:')) return (projekt(a.slice(2)) || {}).name || '';
  if (BEITRAG.includes(a) && !Z.e) return '';
  return TITEL[a] || '';
}
function lageText() {
  const n = zahlStand('entwurf'), f = zahlStand('fertig'), g = zahlStand('geplant');
  return n || f || g ? [n ? n + ' im Entwurf' : '', f ? f + ' fertig' : '', g ? g + ' geplant' : ''].filter(Boolean).join(' · ') : 'Alles veröffentlicht';
}
function kopf() {
  const k = $('#ws-kopf');
  k.innerHTML = WO.kopf({ werkzeug: W, unter: 'LinkedIn', titel: ansichtName(Z.ansicht) || WO.name(W), stand: Z.e && BEITRAG.includes(Z.ansicht) ? hausName(Z.e) + ' · ' + STAND_NAME[Z.e.stand] : lageText(),
    pruefung: pruefLink(''), anleitung: 'anleitung.html', website: WO_HAUS.wege.website, marke: 'data-ws-marke', markeHref: '?ansicht=start' });
  const m = k.querySelector('[data-ws-marke]');
  if (m) m.addEventListener('click', ev => { ev.preventDefault(); geh('start'); });
  const rk = k.querySelector('[data-wo-rand-knopf]'); if (rk) rk.setAttribute('aria-expanded', document.documentElement.classList.contains('wo-rand-auf') ? 'true' : 'false');
}
function rand() {
  const r = leere($('#ws-rand'));
  const nw = (a, name, zahl, extra) => ({ text: name || ansichtName(a), zahl: zahl || 0, an: Z.ansicht === a, attr: `data-ws-nav="${a}"`, extra: extra ? `<em class="wo-rand__z">${E(extra)}</em>` : '' });
  const g = [{ eintraege: [nw('start')] },
    { titel: 'Die Beiträge', eintraege: [nw('l:geplant', '', 0, String(zahlStand('geplant'))), nw('l:entwurf', '', zahlStand('entwurf')), nw('l:fertig', '', zahlStand('fertig')), nw('l:veroeffentlicht', '', 0, String(zahlStand('veroeffentlicht'))), nw('l:alle')] }];
  if (Z.e) g.push({ titel: Z.e.neu ? 'Neuer Beitrag' : 'Offen: ' + hausName(Z.e), eintraege: [nw('text', '', offenZahl()), nw('bild'), nw('angaben'), nw('vergleich')] });
  g.push({ titel: 'Die Häuser', eintraege: Z.projekte.map(p => nw('h:' + p.id, p.name, 0, mz(Z.entwuerfe.filter(e => e.projekt_id === p.id).length, 'Beitrag', 'Beiträge'))) });
  g.push({ titel: 'Hilfe beim Schreiben', eintraege: [nw('vorlagen', '', 0, String(VORLAGEN.length)), nw('regeln')] });
  r.innerHTML = WO.rand(g, { website: WO_HAUS.wege.website, pruefung: pruefLink(''), anleitung: 'anleitung.html' });
  r.querySelectorAll('button[data-ws-nav]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-ws-nav'))));
}
function leiste() {
  const l = $('#ws-leiste'), n = offenZahl(), gesp = !n && Z.gesp > Date.now();
  l.setAttribute('data-ws-offen', String(n));
  const f = zahlStand('fertig');
  l.innerHTML = WO.leiste({
    titel: n ? mz(n, 'Eingabe', 'Eingaben') + ' noch nicht gespeichert' : Z.e ? (Z.e.neu ? 'Neuer Beitrag' : 'Beitrag gespeichert') : 'Alles gespeichert',
    satz: n ? 'Speichern legt sie ab. Posten machst du selbst auf LinkedIn, mit «Text kopieren».' : Z.e ? hausName(Z.e) + ' · ' + STAND_NAME[Z.e.stand] + (Z.e.geaendert ? ' · zuletzt ' + zeit(Z.e.geaendert) : '') + '.' :
      mz(Z.entwuerfe.length, 'Beitrag', 'Beiträge') + ' im Archiv' + (f ? ', ' + f + ' fertig zum Posten' : '') + '.',
    entwurf: !!(Z.e && Z.e.stand === 'entwurf' && !n),
    knoepfe: (n ? WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'ws-vgl', klein: true }) : '')
      + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', n ? 'wartet' : gesp ? 'fertig' : 'glas', { id: 'ws-speichern', klein: true, attr: `data-ws-lage="${n ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` })
      + (Z.e && !n ? WO.knopf('Text kopieren', 'kopie', 'gold', { id: 'ws-raus', klein: true, titel: 'Den fertigen Text für LinkedIn in die Zwischenablage legen' }) : '')
  });
  const sp = $('#ws-speichern'); sp.querySelector('span').id = 'ws-speichern-text';
  sp.addEventListener('click', speichern);
  if ($('#ws-vgl')) $('#ws-vgl').addEventListener('click', () => geh('vergleich'));
  if ($('#ws-raus')) $('#ws-raus').addEventListener('click', kopieren);
}
function allesNeu() { kopf(); rand(); leiste(); }
/* Nach jeder Eingabe: Leiste, Zahl im Rand und Stand im Kopf, ohne die Ansicht neu zu zeichnen */
function eingabe() { leiste(); rand(); }

// ---------------------------------------------------------------- Navigation und Titel
function merkOrt() {   // Ansicht und offener Beitrag: in der Adresse (Neuladen, Link aus «Heute») und im Browser (nächstes Öffnen)
  try { localStorage.setItem('bt-ort', JSON.stringify({ a: Z.ansicht, id: Z.e && !Z.e.neu ? Z.e.id : '' })); } catch (e) { /* ohne Merken */ }
  const u = new URLSearchParams(location.search);
  u.set('ansicht', Z.ansicht);
  if (Z.e && !Z.e.neu && BEITRAG.includes(Z.ansicht)) u.set('entwurf', Z.e.id); else u.delete('entwurf');
  history.replaceState(null, '', location.pathname + '?' + u);
}
async function geh(ansicht, opt = {}) {
  if (BEITRAG.includes(ansicht) && !Z.e) ansicht = 'start';
  Z.ansicht = ansicht;
  merkOrt();
  allesNeu();
  await zeichne(opt);
  if (!opt.halten) window.scrollTo(0, 0);
}
function titel(klein, a, b, satz, knoepfe, foto) {
  const h = el('div', { class: 'ws-titel ws-titel--wo', html: WO.startbild({ werkzeug: W, zier: E(klein), h1: E(a ? a + ' ' : '') + (b ? '<em>' + E(b) + '</em>' : ''), satz: satz ? E(satz) : '',
    knoepfe: knoepfe && knoepfe.length ? ' ' : '', art: Z.ansicht === 'start' ? 'voll' : 'buehne', foto: foto || '' }) });
  const k = h.querySelector('.wo-sb__kn'); if (k) { k.textContent = ''; k.append(...knoepfe.filter(Boolean)); }
  return h;
}
const FOTO = { start: 'terrasse', l: 'bildschirm', h: 'haus', text: 'studio', bild: 'plan', angaben: 'empfang', vergleich: 'tafel', vorlagen: 'bar', regeln: 'speicherstadt' };
const foto = k => WO_HAUS.fotos[FOTO[k]] || WO_HAUS.foto;
const knWo = (text, z, art, tun, attrs = {}) => { const b = el('button', Object.assign({ class: 'wo-kn wo-kn--' + art, type: 'button', html: '<span>' + E(text) + '</span><i>' + WO.ic(z) + '</i>' }, attrs)); b.addEventListener('click', tun); return b; };
const aWo = (text, z, art, href) => el('a', { class: 'wo-kn' + (art ? ' wo-kn--' + art : ''), href, target: '_blank', rel: 'noopener', html: '<span>' + E(text) + '</span><i>' + WO.ic(z) + '</i>' });

// ---------------------------------------------------------------- Beitrag öffnen, neu, verlassen
function wennFrei(weiter) {
  /* Ungespeicherte Eingaben gehen nie still verloren: erst fragen */
  if (!offenZahl()) return weiter();
  fenster('Ungespeicherte', 'Eingaben.', el('p', {}, mz(offenZahl(), 'Eingabe ist', 'Eingaben sind') + ' am offenen Beitrag zu ' + hausName(Z.e) + ' noch nicht gespeichert.'), [
    { text: 'Abbrechen' },
    { text: 'Verwerfen', tun: zu => { zu(); Z.e = null; Z.g = ''; weiter(); } },
    { text: 'Speichern', haupt: true, tun: async zu => { zu(); if (await speichern()) weiter(); } }], { name: 'ungespeichert' });
}
function oeffneBeitrag(id, ansicht = 'text') {
  if (Z.e && Z.e.id === id) return geh(ansicht);
  wennFrei(() => {
    const e = Z.entwuerfe.find(x => x.id === id);
    if (!e) { melde('Diesen Beitrag gibt es nicht mehr', { stichwort: 'FEHLT' }); return geh('l:alle'); }
    Z.e = kopie(e); Z.g = JSON.stringify(sauber(e)); Z.wahl = null; Z.mehr = false;
    geh(ansicht);
  });
}
function neuerBeitrag(projektId, vorlageId) {
  wennFrei(() => {
    const p = projekt(projektId) || Z.projekte[0];
    const e = { id: 'e-' + new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + Math.random().toString(16).slice(2, 6),
      projekt_id: p ? p.id : '', vorlage: vorlageId || 'zahl', stand: 'entwurf', erstellt: '', geaendert: '', veroeffentlicht_am: '', bearbeiter: WER,
      stichpunkte: p ? (p.anders || []).slice() : [], abschnitte: [], hashtags: '',
      bilder: hausBilder(p), grafik: 'quer', hinweis: '', herkunft: { art: '', text: '', quelle: '', gelesen: '' }, neu: true };
    e.abschnitte = baueAbschnitte(e.vorlage, werteAusHaus(p, e.stichpunkte));
    Z.e = e; Z.g = ''; Z.wahl = null; Z.mehr = false;
    geh('text');
    quit('Neuer Beitrag zu ' + hausName(e), 'Aus der Vorlage ' + anf(vorlage(e.vorlage).name) + ' gebaut. Noch nicht gespeichert: Lücken füllen, dann «Speichern».');
  });
}
function hausBilder(p) {
  const b = {};
  if (p) ['vorher', 'nachher'].forEach(s => { if (p[s] && p[s].bild) b[s] = { art: 'pfad', wert: p[s].bild }; });
  return b;
}
const werteJetzt = () => werteAusHaus(projekt(Z.e.projekt_id), Z.e.stichpunkte);

// ---------------------------------------------------------------- Speichern, Rückgängig, Löschen, Kopieren
async function speichern() {
  if (!Z.e || !offenZahl()) { melde('Nichts geändert, nichts gespeichert.'); return false; }
  const neu = !!Z.e.neu, daten = sauber(Z.e);
  daten.bearbeiter = WER;
  let a;
  try { a = neu ? await ruf('POST', 'entwurf', daten) : await ruf('PUT', 'entwurf', daten); } catch (e) { fehler(e); return false; }
  await ladeArchiv();
  const vorher = a.quittung.vorher;
  Z.e = kopie(a.entwurf); Z.g = JSON.stringify(sauber(a.entwurf));
  Z.gesp = Date.now() + 6000; setTimeout(leiste, 6100);
  merkOrt(); allesNeu();
  quittung(neu ? 'Angelegt' : 'Gespeichert', unterschiede(vorher && sauber(vorher), sauber(a.entwurf)), { aktion: neu ? 'anlegen' : 'speichern', vorher, nachher: a.entwurf });
  await zeichne({ halten: true });
  return true;
}
async function rueckgaengig(q, karte) {
  try {
    if (q.aktion === 'speichern') {
      const a = await ruf('PUT', 'entwurf', q.vorher);
      await ladeArchiv();
      if (Z.e && Z.e.id === a.entwurf.id) { Z.e = kopie(a.entwurf); Z.g = JSON.stringify(sauber(a.entwurf)); }
      if (karte) karte.remove();
      allesNeu(); await zeichne({ halten: true });
      quittung('Zurückgenommen', unterschiede(sauber(q.nachher), sauber(a.entwurf)), { aktion: 'speichern', vorher: q.nachher, nachher: a.entwurf });
    } else if (q.aktion === 'anlegen') {
      await ruf('DELETE', 'entwurf', { id: q.nachher.id });
      await ladeArchiv();
      if (Z.e && Z.e.id === q.nachher.id) { Z.e = null; Z.g = ''; }
      if (karte) karte.remove();
      await geh(BEITRAG.includes(Z.ansicht) ? 'l:alle' : Z.ansicht);
      quittung('Zurückgenommen', unterschiede(sauber(q.nachher), null), { aktion: 'loeschen', vorher: q.nachher, nachher: null });
    } else if (q.aktion === 'loeschen') {
      const a = await ruf('POST', 'entwurf', q.vorher);
      await ladeArchiv();
      if (karte) karte.remove();
      allesNeu(); await zeichne({ halten: true });
      quittung('Wiederhergestellt', unterschiede(null, sauber(a.entwurf)), { aktion: 'anlegen', vorher: null, nachher: a.entwurf });
    }
  } catch (e) { fehler(e); }
}
function loeschen() {
  if (!Z.e) return;
  if (Z.e.neu) {
    fenster('Neuen Beitrag', 'verwerfen?', el('p', {}, 'Er ist noch nicht gespeichert und verschwindet ganz.'), [{ text: 'Abbrechen' },
      { text: 'Ja, verwerfen', haupt: true, tun: zu => { zu(); Z.e = null; Z.g = ''; geh('l:alle'); melde('Verworfen', { mehr: 'Der neue Beitrag ist nicht angelegt worden.' }); } }], { name: 'verwerfen' });
    return;
  }
  fenster('Diesen Beitrag', 'löschen?', el('div', { class: 'ws-form' }, el('p', {}, 'Der Beitrag zu ' + hausName(Z.e) + ' (' + STAND_NAME[Z.e.stand] + ') wird aus dem Archiv genommen.'),
    el('p', { class: 'ws-klein' }, anf(kurz(ersteZeile(Z.e), 140))), el('p', { class: 'ws-klein' }, 'In der Quittung danach lässt er sich mit «Rückgängig» zurückholen.')), [
    { text: 'Abbrechen' },
    { text: 'Ja, löschen', haupt: true, tun: async zu => {
      zu();
      let a;
      try { a = await ruf('DELETE', 'entwurf', { id: Z.e.id }); } catch (e) { return fehler(e); }
      await ladeArchiv();
      Z.e = null; Z.g = '';
      await geh('l:alle');
      quittung('Gelöscht', unterschiede(sauber(a.quittung.vorher), null), { aktion: 'loeschen', vorher: a.quittung.vorher, nachher: null });
    } }], { name: 'loeschen' });
}
async function kopieren() {
  if (!Z.e) return;
  const t = gesamttext(Z.e).text;
  try { await navigator.clipboard.writeText(t); quit('Text kopiert', t.length.toLocaleString('de-DE') + ' Zeichen in der Zwischenablage. Auf LinkedIn einfügen, Grafik dazu, Link in den ersten Kommentar. Danach den Stand auf «Veröffentlicht» stellen.', [taste('Stand ändern', () => geh('angaben'))], { 'data-ws-kopiert': t.length }); }
  catch (x) { melde('Kopieren ging nicht', { mehr: 'Den Text in der Vorschau markieren und mit der Tastatur kopieren.', stichwort: 'KOPIEREN' }); }
}

// ---------------------------------------------------------------- Übersicht
function zeichneStart() {
  const m = leere($('#ws-mitte'));
  const nE = zahlStand('entwurf'), nF = zahlStand('fertig'), nV = zahlStand('veroeffentlicht'), nG = zahlStand('geplant');
  const letzter = Z.entwuerfe.filter(e => e.stand === 'veroeffentlicht').sort((a, b) => (b.veroeffentlicht_am || '').localeCompare(a.veroeffentlicht_am || ''))[0];
  const weiter = Z.entwuerfe.find(e => e.stand === 'entwurf'), fertig = Z.entwuerfe.find(e => e.stand === 'fertig');
  const neuestes = Z.projekte.slice().sort((a, b) => (b.fertig || '').localeCompare(a.fertig || ''))[0];
  m.append(titel(WO.name(W) + ' · ' + WO_HAUS.name, WO.gruss(), 'Was schreiben wir heute?',
    'Aus jedem fertigen Haus wird ein Beitrag für LinkedIn, in deiner Stimme: Vorlage mit Lücken, Prüfung gegen die Anti-KI-Liste, Vorschau wie auf LinkedIn und die Grafik vorher/nachher. Gepostet wird von Hand, nichts geht von selbst hinaus.',
    [aWo('Anleitung', 'buch', 'gold', 'anleitung.html'), aWo('Prüfung', 'schild', '', pruefLink(''))]));
  /* Immer sieben Kacheln wie in der Vorlage (die erste doppelt breit, Regel für genau sieben in beitraege.css, Nachbesserung 1 der Prüfung 2):
     ohne offenen oder fertigen Beitrag führt die Kachel in ihre Liste statt ins Leere. */
  const zumBild = weiter || fertig || Z.entwuerfe.slice().sort((a, b) => (b.geaendert || '').localeCompare(a.geaendert || ''))[0];
  const AUFG = [
    ['neu', 'Neuer Beitrag', neuestes ? 'Zum neuesten Haus: ' + neuestes.name + '.' : 'Haus wählen, Vorlage bauen.', 'plus'],
    weiter ? ['e:' + weiter.id, 'Weiterschreiben', hausName(weiter) + ': ' + kurz(ersteZeile(weiter), 60), 'stift'] : ['l:entwurf', 'Weiterschreiben', 'Gerade ist nichts angefangen. Was du anfängst, sammelt sich hier.', 'stift'],
    fertig ? ['e:' + fertig.id + ':angaben', 'Fertig zum Posten', hausName(fertig) + ': Text kopieren, posten, Stand ändern.', 'hoch'] : ['l:fertig', 'Fertig zum Posten', 'Gerade wartet keiner. Fertige Beiträge warten hier aufs Posten.', 'hoch'],
    zumBild ? ['e:' + zumBild.id + ':bild', 'Bild vorher/nachher', 'Die Grafik für den Beitrag bauen und speichern.', 'foto'] : ['neu', 'Bild vorher/nachher', 'Erst einen Beitrag anlegen, dann die Grafik bauen.', 'foto'],
    ['regeln', 'Was die Prüfung meldet', 'Die Anti-KI-Liste: verbotene Wörter, Satzlängen, Gedankenstriche, Floskeln.', 'schild'],
    ['vorlagen', 'Vorlagen ansehen', VORLAGEN.length + ' feste Aufbauten mit Lücken, von der eigenen Zahl bis zum kurzen Beitrag.', 'buch'],
    ['l:alle', 'Alle Beiträge', 'Das Archiv: ' + mz(Z.entwuerfe.length, 'Beitrag', 'Beiträge') + ', jeder mit Stand Entwurf, fertig oder veröffentlicht.', 'verlauf']];
  const FOTOS = ['terrasse', 'bildschirm', 'tafel', 'plan', 'speicherstadt', 'bar', 'empfang'].map(k => WO_HAUS.fotos[k]);
  const rest = el('div', { class: 'ws-wo-start', html:
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('stift')}</i><span class="wo-mk">Entwurf</span><b>${nE ? E(mz(nE, 'Beitrag', 'Beiträge')) : 'Nichts offen'}</b><p>${nE ? 'Angefangen, Lücken oder Prüfung offen.' : 'Was du anfängst, sammelt sich hier.'}${nG ? ' ' + E(mz(nG, 'weiterer Beitrag ist', 'weitere Beiträge sind')) + ' als Nächstes vorgemerkt.' : ''}</p>${nE ? '<button class="wo-lk" type="button" data-gehe="l:entwurf">Weiterschreiben</button>' : nG ? '<button class="wo-lk" type="button" data-gehe="l:geplant">Als Nächstes</button>' : ''}</div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('haken')}</i><span class="wo-mk">Fertig</span><b>${nF ? E(mz(nF, 'Beitrag wartet', 'Beiträge warten')) : 'Keiner wartet'}</b><p>${nF ? 'Geprüft und bereit. Posten machst du selbst auf LinkedIn.' : 'Fertige Beiträge warten hier aufs Posten.'}</p>${nF ? '<button class="wo-lk" type="button" data-gehe="l:fertig">Ansehen und posten</button>' : ''}</div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('welt')}</i><span class="wo-mk">LinkedIn</span><b>${nV ? E(mz(nV, 'Beitrag', 'Beiträge')) + ' online' : 'Noch keiner online'}</b><p>${letzter ? 'Zuletzt am ' + E(datum(letzter.veroeffentlicht_am)) + ': ' + E(hausName(letzter)) + '.' : 'Nach dem Posten den Stand auf «Veröffentlicht» stellen.'}</p>${nV ? '<button class="wo-lk" type="button" data-gehe="l:veroeffentlicht">Archiv öffnen</button>' : ''}</div>
    </div>
    <h2 class="wo-zw">Häufig <em>gebraucht</em></h2>
    <div class="wo-aufg ws-aufgaben">${AUFG.map(([ziel, tt, s, ic], n) => `<button class="wo-ag ws-ag" type="button" data-gehe="${E(ziel)}"><span class="wo-ag__b"><img src="${E(FOTOS[n % FOTOS.length])}" alt="" loading="lazy" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(ic)}</i><b>${E(tt)}</b><span>${E(s)}</span></span></button>`).join('')}</div>
    <h2 class="wo-zw">Die Häuser, <em>eins nach dem anderen</em></h2>
    <div class="wo-ber ws-bereiche">${Z.projekte.map(p => { const n = Z.entwuerfe.filter(e => e.projekt_id === p.id), g = n.filter(e => e.stand === 'geplant').length, o = n.filter(e => e.stand === 'entwurf' || e.stand === 'fertig').length;
      const bs = [(p.vorher || {}).bild, (p.nachher || {}).bild].filter(Boolean);
      return `<button class="wo-bk ws-bk" type="button" title="${E(p.art + ', ' + p.ort)}" data-ws-bk="${E(p.id)}" data-gehe="h:${E(p.id)}"><span class="wo-bk__b${bs.length > 1 ? ' bt-paar' : ''}">${bs.map(b => `<img src="${E(b)}" alt="" loading="lazy" decoding="async">`).join('')}</span><span class="wo-bk__t"><b>${E(p.name)}</b><small>${g && !o ? 'Als Nächstes vorgemerkt' : E(mz(n.length - g, 'Beitrag', 'Beiträge')) + (o ? ' · ' + o + ' offen' : '')}</small><span>${E(p.art + ', ' + p.ort + '.' + (p.fertig ? ' Seite neu seit ' + datum(p.fertig) + '.' : ''))}</span></span><i class="wo-bk__p">${WO.ic('pfeil')}</i></button>`; }).join('')}</div>` });
  rest.querySelectorAll('[data-gehe]').forEach(b => b.addEventListener('click', () => springe(b.getAttribute('data-gehe'))));
  m.append(rest);
}
function springe(ziel) {
  if (ziel === 'neu') { const p = Z.projekte.slice().sort((a, b) => (b.fertig || '').localeCompare(a.fertig || ''))[0]; return neuerBeitrag(p && p.id); }
  if (ziel.startsWith('e:')) { const [, id, a] = ziel.split(':'); return oeffneBeitrag(id, a || 'text'); }
  geh(ziel);
}

// ---------------------------------------------------------------- Beiträge nach Stand (Archiv)
const LISTE_SATZ = { geplant: 'Beiträge, die als Nächstes anstehen: noch ohne Text, mit den belegten Eckdaten des Hauses. Öffnen, dann unter «Haus, Vorlage, Stand» den Text aus einer Vorlage bauen.',
  entwurf: 'Angefangene Beiträge. Lücken füllen, die Prüfung durchgehen, dann auf «Fertig» stellen.',
  fertig: 'Geprüft und bereit. «Text kopieren», auf LinkedIn posten, Grafik dazu, danach den Stand auf «Veröffentlicht» stellen.',
  veroeffentlicht: 'Was schon auf LinkedIn steht, mit dem Tag, an dem es gepostet wurde.', alle: 'Jeder Beitrag mit seinem Stand, der neueste zuerst.' };
/* Das Bild der Karte (wie das Plakat in den Terminen der Vorlage): vorher und nachher ganz, übereinander (zwei Bilder 3:2 ergeben genau das Hochformat 3:4,
   nichts wird abgeschnitten, Nachbesserung 2). Gibt es nur eines, steht es ganz in der Mitte; ohne Bild der Tag in gross. */
const MONATE_K = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
function kartenBild(e) {
  const bs = ['vorher', 'nachher'].map(s => e.bilder && e.bilder[s]).filter(b => b && b.wert);
  const tag = new Date(((e.stand === 'veroeffentlicht' && e.veroeffentlicht_am) || e.geaendert || e.erstellt || '').slice(0, 10) + 'T12:00:00');
  const ort = el('figure', { class: 'bt-karte__bild', 'aria-hidden': 'true', onclick: () => oeffneBeitrag(e.id, 'bild') });
  const ohne = () => { ort.classList.remove('bt-paar'); leere(ort).append(el('b', {}, isNaN(tag) ? '–' : tag.getDate() + '.'), el('span', {}, isNaN(tag) ? '' : MONATE_K[tag.getMonth()])); };
  if (!bs.length) ohne();
  else Promise.all(bs.map(bildAdresse)).then(adr => {
    adr = adr.filter(Boolean); if (!adr.length) return ohne();
    ort.classList.add('bt-paar');
    leere(ort).append(...adr.map(a => { const im = el('img', { src: a, alt: '', loading: 'eager', decoding: 'async' }); im.onerror = () => { im.remove(); if (!ort.querySelector('img')) ohne(); }; return im; }));
  });
  return ort;
}
function beitragKarte(e) {
  const wann = e.stand === 'veroeffentlicht' && e.veroeffentlicht_am ? 'veröffentlicht am ' + datum(e.veroeffentlicht_am) : 'geändert am ' + datum(e.geaendert) + (e.bearbeiter ? ' von ' + e.bearbeiter : '');
  const g = gesamttext(e), p = pruefeText(g.text, g.lagen, g.hashtagsVon), plan = e.stand === 'geplant' && !g.text;
  const offen = p.funde.filter(f => f.stufe === 'fehler').length;
  return el('section', { class: 'platte ws-karte bt-karte' + (Z.e && Z.e.id === e.id ? ' bt-karte--offen' : ''), 'data-bt-beitrag': e.id },
    kartenBild(e),
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, hausName(e)), el('span', { class: 'bt-marke bt-marke--' + e.stand }, STAND_NAME[e.stand])),
    herkunftZeile(e),
    plan ? el('div', { class: 'ws-liste-klein bt-eckdaten' }, e.stichpunkte.map(t => el('p', {}, t))) : el('p', { class: 'bt-karte__hook' }, ersteZeile(e) || 'Noch kein Text'),
    e.hinweis ? el('p', { class: 'ws-klein bt-hinweis' }, el('b', {}, 'Vorher klären: '), e.hinweis) : null,
    el('p', { class: 'ws-klein' }, (plan ? ['vorgemerkt am ' + datum(e.erstellt), mz(e.stichpunkte.length, 'Eckdatum', 'Eckdaten')] : [vorlage(e.vorlage).name, wann, g.text.length.toLocaleString('de-DE') + ' Zeichen', offen ? mz(offen, 'Stelle muss raus', 'Stellen müssen raus') : 'Prüfung ohne Fehler']).join(' · ')),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Öffnen', () => oeffneBeitrag(e.id)), taste('Bild vorher/nachher', () => oeffneBeitrag(e.id, 'bild')), taste('Stand ändern', () => oeffneBeitrag(e.id, 'angaben'))));
}
function zeichneListe(stand) {
  const m = leere($('#ws-mitte'));
  const liste = Z.entwuerfe.filter(e => stand === 'alle' || e.stand === stand);
  m.append(titel('Die Beiträge', ansichtName('l:' + stand) + '.', '', LISTE_SATZ[stand] + ' ' + mz(liste.length, 'Beitrag', 'Beiträge') + '.',
    [knWo('Neuer Beitrag', 'plus', 'gold', () => springe('neu'))], foto('l')));
  if (!liste.length) {
    m.append(el('p', { class: 'kuhle ws-leer' }, stand === 'fertig' ? 'Gerade wartet kein Beitrag aufs Posten.' : stand === 'entwurf' ? 'Kein Beitrag im Entwurf.' : stand === 'geplant' ? 'Nichts als Nächstes vorgemerkt.' : 'Noch nichts hier.'));
    return;
  }
  liste.forEach(e => m.append(beitragKarte(e)));
}

// ---------------------------------------------------------------- Ein Haus
function zeichneHaus(id) {
  const m = leere($('#ws-mitte')), p = projekt(id);
  if (!p) return geh('start');
  const v = p.vorher || {}, n = p.nachher || {};
  m.append(titel('Haus · ' + p.ort, p.name + '.', '', hausSatz(p),
    [knWo('Neuer Beitrag zu diesem Haus', 'plus', 'gold', () => neuerBeitrag(p.id)), p.adresse ? aWo('Website ansehen', 'welt', 'glas', p.adresse) : null], foto('h')));
  m.append(el('section', { class: 'platte ws-karte', 'data-bt-haus': 'stand' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Stand'), mono(p.fokus ? 'fertiges Haus' : 'als Nächstes')),
    el('p', {}, p.stand), p.offen ? el('p', { class: 'ws-klein bt-hinweis' }, el('b', {}, 'Vorher klären: '), p.offen) : null));
  const zahlen = hausZahlen(p);
  const zahl = z => el('div', { class: 'ws-zl bt-zahl' }, mono(z.was), el('span', { class: 'bt-zahl__w' }, z.vorher + '  →  ' + z.nachher));
  m.append(el('section', { class: 'platte ws-karte', 'data-bt-haus': 'zahlen' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Vorher und nachher'), mono(zahlen.length ? 'belegt' : 'nicht gemessen')),
    zahlen.length ? zahlen.map(zahl) : el('p', { class: 'ws-klein' }, 'Für dieses Haus sind keine Zahlen vorher und nachher belegt.'),
    v.stand ? el('p', { class: 'ws-klein', style: 'padding-top:12px' }, 'Vorher: ' + v.stand + '.') : null,
    p.messung ? el('p', { class: 'ws-klein' }, 'Quelle: ' + p.messung) : null));
  if (p.familie && p.familie.length) m.append(el('section', { class: 'platte ws-karte', 'data-bt-haus': 'familie' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Die Häuser'), mono(mz(p.familie.length, 'Haus', 'Häuser'))),
    p.familie.map(h => el('div', { class: 'ws-zl bt-zahl' }, mono(h.name), el('span', { class: 'bt-zahl__w' }, h.art + ', ' + h.ort + ' · ' + (ohne(h.seiten) ? 'Seitenzahl nicht belegt' : mz(h.seiten, 'Seite', 'Seiten')))))));
  const bilder = ['vorher', 'nachher'].filter(s => (p[s] || {}).bild);
  if (bilder.length) m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Bilder des Hauses'), mono('aus dem Projektordner')),
    el('div', { class: 'bt-bilder' }, bilder.map(s => el('figure', { class: 'bt-bild' }, el('div', { class: 'bt-bild__r' }, el('img', { src: p[s].bild, alt: s === 'vorher' ? 'Vorher' : 'Nachher' })), el('figcaption', {}, mono(s), p[s].bild_text ? el('span', { class: 'ws-klein' }, ' ' + p[s].bild_text) : null))))));
  if ((p.anders || []).length) m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Was anders ist'), mono(mz(p.anders.length, 'Punkt', 'Punkte'))),
    el('div', { class: 'ws-liste-klein' }, p.anders.map(t => el('p', {}, t)))));
  if ((p.quellen || []).length) m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Quellen'), mono(mz(p.quellen.length, 'Datei', 'Dateien'))),
    el('div', { class: 'ws-liste-klein bt-quellen' }, p.quellen.map(t => el('p', {}, t)))));
  const bs = Z.entwuerfe.filter(e => e.projekt_id === p.id);
  m.append(el('h2', { class: 'ws-zw' }, 'Beiträge ', el('em', {}, 'zu diesem Haus')));
  if (!bs.length) m.append(el('p', { class: 'kuhle ws-leer' }, 'Noch kein Beitrag zu ' + p.name + '.'));
  bs.forEach(e => m.append(beitragKarte(e)));
}

// ---------------------------------------------------------------- Text & Vorschau: Abschnitte links, Beitrag rechts (wie Stellen und Seite)
function zeichneText(opt) {
  const m = $('#ws-mitte'), e = Z.e;
  if (opt.halten && $('#bt-arbeit')) { gruppen(); post(); if (Z.wahl != null) { const z = $(`#ws-gruppen .ws-st[data-bt-i="${Z.wahl}"]`); if (z) oeffneAbschnitt(Z.wahl, z); } return; }
  const vs = el('section', { class: 'ws-vorschau', 'aria-label': 'Vorschau des Beitrags' },
    el('div', { class: 'ws-vorschau__k' }, mono(hausName(e)),
      schmal() ? null : wahl2([{ wert: 'rechner', text: 'Rechner' }, { wert: 'handy', text: 'Handy' }], Z.geraet, x => { Z.geraet = x; post(); }, 'Breite der Vorschau'),
      el('a', { href: 'vorschau.html' + (e.neu ? '' : '?entwurf=' + encodeURIComponent(e.id)), target: '_blank', id: 'bt-gross', onclick: ev => { ev.preventDefault(); window.open(ev.currentTarget.href, '_blank'); } }, 'Gross öffnen')),
    el('div', { class: 'ws-rahmen bt-feed', id: 'bt-feed' }));
  leere(m).append(titel('Beitrag · ' + hausName(e), 'Text', '& Vorschau.', 'Links der Text in Abschnitten und was die Prüfung findet, rechts der Beitrag, wie er auf LinkedIn steht. Klick auf einen Abschnitt oder eine markierte Stelle, um zu schreiben.',
    [knWo('Text kopieren', 'kopie', 'gold', kopieren), knWo('Bild vorher/nachher', 'foto', 'glas', () => geh('bild'))], foto('text')),
    el('div', { class: 'ws-arbeit', id: 'bt-arbeit' },
      el('div', { class: 'platte ws-stellen' },
        el('label', { class: 'ws-suche' }, el('span', { html: LUPE }), el('input', { type: 'text', id: 'ws-such', value: Z.such, placeholder: 'Im Text suchen', autocomplete: 'off', 'aria-label': 'Im Text suchen', oninput: ev => { Z.such = ev.target.value; suche(); } })),
        el('div', { id: 'ws-gruppen' })),
      vs));
  const hk = herkunftKarte(e); if (hk) $('#bt-arbeit').before(hk);
  gruppen();
  post();
  suche();
}
/* Woher der Text stammt und was vor dem Posten zu klären ist: über der Arbeitsfläche und unter «Haus, Vorlage, Stand» */
function herkunftKarte(e, mitKnopf) {
  const h = e.herkunft || {}, z = herkunftZeile(e);
  if (!z && !e.hinweis) return null;
  const k = el('section', { class: 'platte ws-karte bt-hk' + ((alt => alt && (alt.herkunft || {}).gelesen !== h.gelesen)(gespeichert()) ? ' bt-karte--offen' : ''), 'data-bt-form': 'herkunft' },
    el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Herkunft'), mono(HERKUNFT_NAME[h.art] || 'Beitrag')),
    z, h.quelle ? el('p', { class: 'ws-klein' }, h.quelle) : null,
    e.stand === 'geplant' && !(e.abschnitte || []).length ? el('p', { class: 'ws-klein' }, 'Eckdaten stehen unter «Haus, Vorlage, Stand». Dort baut «Text aus der Vorlage bauen» den ersten Entwurf.') : null,
    e.hinweis ? el('p', { class: 'ws-klein bt-hinweis' }, el('b', {}, 'Vorher klären: '), e.hinweis) : null);
  if (mitKnopf && h.art === 'neu') k.append(el('div', { class: 'ws-reihe' }, h.gelesen
    ? link('Wieder als ungelesen markieren', () => { Z.e.herkunft = Object.assign({}, h, { gelesen: '' }); eingabe(); zeichne({ halten: true }); })
    : taste('Als gelesen markieren', () => { Z.e.herkunft = Object.assign({}, h, { gelesen: new Date().toISOString().slice(0, 10) }); eingabe(); zeichne({ halten: true }); }, { 'data-bt-gelesen': '1' }),
    el('span', { class: 'ws-klein' }, 'Gilt erst nach «Speichern».')));
  return k;
}
function pruefung() {
  const g = gesamttext(Z.e), p = pruefeText(g.text, g.lagen, g.hashtagsVon);
  return Object.assign(p, { lagen: g.lagen, text: g.text, hashtagsVon: g.hashtagsVon });
}
function pruefGruppe(p) {
  const stufe = f => f.stufe === 'fehler' ? 'raus' : f.stufe === 'pruefen' ? 'prüfen' : 'Hinweis';
  const wo = f => { const l = p.lagen.find(x => f.von >= x.von && f.von < x.bis); return f.von >= p.hashtagsVon && p.hashtagsVon >= 0 ? 'Hashtags' : l ? artName(l.art) : ''; };
  const zahl = [p.anzahl.fehler ? p.anzahl.fehler + ' raus' : '', p.anzahl.pruefen ? p.anzahl.pruefen + ' prüfen' : '', p.anzahl.hinweis ? mz(p.anzahl.hinweis, 'Hinweis', 'Hinweise') : ''].filter(Boolean).join(' · ') || 'nichts gefunden';
  const dp = el('details', { class: 'ws-gr bt-pr', 'data-g': 'pruefung', open: Z.prAuf == null ? !!p.anzahl.fehler : Z.prAuf },
    el('summary', {}, el('b', {}, 'Prüfung'), el('small', {}, zahl)),
    el('p', { class: 'ws-klein bt-pr__laenge' }, p.zeichen.toLocaleString('de-DE') + ' Zeichen, ' + p.woerter.toLocaleString('de-DE') + ' Wörter. ' + p.laengeText),
    p.funde.length ? p.funde.map((f, i) => el('button', { type: 'button', class: 'ws-st bt-fund bt-fund--' + f.stufe, 'data-bt-fund': i, onclick: () => zeigeFund(i) },
      el('small', {}, stufe(f) + (wo(f) ? ' · ' + wo(f) : '')), el('span', {}, f.titel + (f.zitat ? ': ' + anf(kurz(f.zitat, 60)) : '')), el('em', { class: 'bt-fund__tipp' }, f.tipp)))
      : el('p', { class: 'ws-klein bt-pr__gut' }, p.text ? 'Nichts gefunden. Lies ihn trotzdem einmal laut.' : 'Noch kein Text.'));
  dp.addEventListener('toggle', () => { Z.prAuf = dp.open; });
  return dp;
}
function gruppen() {
  const ort = leere($('#ws-gruppen')), e = Z.e, p = pruefung(), alt = gespeichert();
  Z.pr = p;
  ort.append(pruefGruppe(p));
  // Abschnitte
  const d = el('details', { class: 'ws-gr', 'data-g': 'text', open: true },
    el('summary', {}, el('b', {}, 'Der Text'), el('small', {}, mz(e.abschnitte.length, 'Abschnitt', 'Abschnitte'))));
  e.abschnitte.forEach((a, i) => {
    const war = alt && alt.abschnitte[i], geaendert = !war || war.text !== a.text || war.art !== a.art;
    const n = p.funde.filter(f => { const l = p.lagen.find(x => x.i === i); return l && f.von >= l.von && f.von < l.bis; }).length;
    d.append(el('button', { type: 'button', class: 'ws-st' + (geaendert ? ' ws-offen' : ''), 'data-bt-i': i, 'aria-pressed': 'false', onclick: ev => oeffneAbschnitt(i, ev.currentTarget, { rollen: true }) },
      el('small', {}, artName(a.art) + (n ? ' · ' + mz(n, 'Fund', 'Funde') : '') + (geaendert ? ' · nicht gespeichert' : '')),
      el('span', { 'data-ws-zeigt': '1' }, a.text || '(leer)')));
  });
  const art = { wert: 'koerper' };
  d.append(el('div', { class: 'ws-gr__fuss bt-neu' }, auswahl(Object.keys(ABSCHNITT_ARTEN).map(k => ({ wert: k, text: artName(k) })), art.wert, x => { art.wert = x; }, 'Art des neuen Abschnitts'),
    link('Abschnitt hinzufügen', () => {
      const v = vorlage(e.vorlage);
      e.abschnitte.push({ art: art.wert, fassung: 0, text: v.abschnitte[art.wert] ? fuelle(v.abschnitte[art.wert][0], werteJetzt()) : '' });
      Z.wahl = e.abschnitte.length - 1;
      eingabe(); zeichne({ halten: true });
    })));
  ort.append(d);
  // Hashtags
  const hOffen = !alt || (alt.hashtags || '') !== (e.hashtags || '');
  const h = el('details', { class: 'ws-gr', 'data-g': 'hashtags', open: !!e.hashtags },
    el('summary', {}, el('b', {}, 'Hashtags'), el('small', {}, e.hashtags ? (e.hashtags.match(/#/g) || []).length + ' Stück' : 'keine')),
    el('button', { type: 'button', class: 'ws-st' + (hOffen ? ' ws-offen' : ''), 'data-bt-i': 'h', 'aria-pressed': 'false', onclick: ev => oeffneAbschnitt('h', ev.currentTarget, { rollen: true }) },
      el('small', {}, 'Unter dem Text, höchstens drei' + (hOffen ? ' · nicht gespeichert' : '')), el('span', { 'data-ws-zeigt': '1' }, e.hashtags || '(keine)')));
  ort.append(h);
}
function suche() {
  const q = (Z.such || '').trim().toLowerCase();
  $$('#ws-gruppen .ws-gr').forEach(g => {
    let treffer = 0;
    $$('.ws-st', g).forEach(x => { const ja = !q || x.textContent.toLowerCase().includes(q); x.hidden = !ja; if (ja) treffer++; });
    g.hidden = !!q && !treffer;
    if (q && treffer) g.open = true;
  });
}
function edZu() { $$('.ws-ed').forEach(x => x.remove()); $$('[aria-pressed="true"].ws-st').forEach(x => x.setAttribute('aria-pressed', 'false')); }
/* Die Stelle zum Schreiben, direkt unter ihrer Zeile (wie in der Vorlage). i = Nummer des Abschnitts oder 'h' für die Hashtags. */
function oeffneAbschnitt(i, knopf, opt = {}) {
  edZu();
  const e = Z.e, hash = i === 'h', a = hash ? null : e.abschnitte[i];
  if (!hash && !a) return;
  Z.wahl = i;
  const ed = el('div', { class: 'ws-ed', 'data-ws-form': 'abschnitt', 'data-bt-ed': i });
  const feld = el(hash ? 'input' : 'textarea', { class: 'ws-text bt-feld', 'aria-label': hash ? 'Hashtags' : artName(a.art), spellcheck: 'true', lang: 'de', rows: hash ? null : 3, type: hash ? 'text' : null, placeholder: hash ? '#Gastronomie #Hotellerie' : null });
  feld.value = hash ? (e.hashtags || '') : a.text;
  const hoehe = () => { if (!hash) { feld.style.height = 'auto'; feld.style.height = (feld.scrollHeight + 2) + 'px'; } };
  ed.append(mono(hash ? 'Hashtags' : artName(a.art) + (a.fassung ? ' · Fassung ' + (a.fassung + 1) : '')), feld,
    el('p', { class: 'ws-klein' }, hash ? 'Höchstens drei, am Ende des Beitrags.' : (ABSCHNITT_ARTEN[a.art] || {}).hinweis || ''));
  const zeile_ = el('div', { class: 'ws-ed__z' });
  if (!hash) zeile_.append(...[
    link('Andere Fassung', () => { const n = naechsteFassung(e.vorlage, a.art, a.fassung, werteJetzt()); if (n.anzahl < 2 && n.text === a.text) { melde('Für diesen Abschnitt hat die Vorlage nur eine Fassung.'); return; } a.fassung = n.fassung; a.text = n.text; feld.value = a.text; hoehe(); tippe(); }),
    i > 0 ? link('Nach oben', () => tausche(i, i - 1)) : null,
    i < e.abschnitte.length - 1 ? link('Nach unten', () => tausche(i, i + 1)) : null,
    link('Entfernen', () => entferne(i))].filter(Boolean));
  zeile_.append(link('Schliessen', () => { edZu(); Z.wahl = null; post(); }));
  ed.append(zeile_);
  const alt = gespeichert(), war = alt && (hash ? alt.hashtags : alt.abschnitte[i] && alt.abschnitte[i].text);
  if (alt && war != null && war !== (hash ? e.hashtags : a.text)) ed.append(el('p', { class: 'ws-vorher' }, el('b', {}, 'Gespeichert: '), kurz(war, 400) || '(leer)'));
  function tippe() {
    if (hash) e.hashtags = feld.value; else a.text = feld.value;
    const t = $('[data-ws-zeigt]', knopf); if (t) t.textContent = feld.value || '(leer)';
    /* Wie in der Vorlage: die Zeile zeigt sofort «nicht gespeichert» und den farbigen Rand */
    const gs = gespeichert(), wa = gs ? (hash ? (gs.hashtags || '') : gs.abschnitte[i] && gs.abschnitte[i].text) : null;
    const gleich = !!gs && wa != null && wa === feld.value && (hash || gs.abschnitte[i].art === a.art);
    knopf.classList.toggle('ws-offen', !gleich);
    const s = $('small', knopf); if (s) s.textContent = s.textContent.replace(' · nicht gespeichert', '') + (gleich ? '' : ' · nicht gespeichert');
    eingabe(); post();
    gruppenPruefungNeu();
  }
  feld.addEventListener('input', () => { hoehe(); tippe(); });
  knopf.after(ed);
  knopf.setAttribute('aria-pressed', 'true');
  hoehe();
  if (opt.markiere) { feld.focus({ preventScroll: true }); feld.setSelectionRange(opt.markiere[0], opt.markiere[1]); }
  if (opt.rollen || opt.markiere) hochholen(knopf, ed);
  post();
  return ed;
}
function gruppenPruefungNeu() {
  /* Nur die Prüfung neu zeichnen, die offene Stelle zum Schreiben bleibt stehen */
  const alt = $('#ws-gruppen [data-g="pruefung"]'); if (!alt) return;
  const p = pruefung(); Z.pr = p;
  const neu = pruefGruppe(p);
  neu.hidden = alt.hidden;
  alt.replaceWith(neu);
}
function hochholen(zeile, ed) {
  const liste = zeile.closest('.ws-stellen'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (liste && liste.scrollHeight > liste.clientHeight + 2) {
    const such = $('.ws-suche', liste), luft = (such ? such.offsetHeight : 0) + 26;
    liste.scrollTo({ top: Math.max(0, zeile.offsetTop - luft), behavior: still ? 'auto' : 'smooth' });
  } else zeile.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
  if (!still) { zeile.classList.add('ws-leuchtet'); ed.classList.add('ws-leuchtet'); setTimeout(() => { zeile.classList.remove('ws-leuchtet'); ed.classList.remove('ws-leuchtet'); }, 1400); }
}
function tausche(i, j) { const a = Z.e.abschnitte; [a[i], a[j]] = [a[j], a[i]]; Z.wahl = j; eingabe(); zeichne({ halten: true }); }
function entferne(i) {
  const a = Z.e.abschnitte[i];
  const weg = () => { Z.e.abschnitte.splice(i, 1); Z.wahl = null; eingabe(); zeichne({ halten: true }); };
  if (!a.text.trim()) return weg();
  fenster('Abschnitt', 'entfernen?', el('div', { class: 'ws-form' }, el('p', {}, anf(artName(a.art)) + ' kommt aus dem Text. Bis du speicherst, holt «Vorher, nachher» ihn zurück.'), el('p', { class: 'ws-klein' }, anf(kurz(a.text, 160)))), [
    { text: 'Abbrechen' }, { text: 'Entfernen', haupt: true, tun: zu => { zu(); weg(); } }], { name: 'abschnitt-weg' });
}
function zeigeFund(i) {
  const f = Z.pr && Z.pr.funde[i]; if (!f) return;
  const l = Z.pr.lagen.find(x => f.von >= x.von && f.von < x.bis);
  if (!l) { const z = $('#ws-gruppen .ws-st[data-bt-i="h"]'); if (z) { z.closest('details').open = true; oeffneAbschnitt('h', z, { rollen: true }); } return; }
  const z = $(`#ws-gruppen .ws-st[data-bt-i="${l.i}"]`); if (!z) return;
  const text = Z.e.abschnitte[l.i].text, versatz = text.indexOf(text.trim());
  z.closest('details').open = true;
  oeffneAbschnitt(l.i, z, { markiere: [versatz + f.von - l.von, versatz + Math.min(f.bis, l.bis) - l.von] });
  Z.mehr = true; post();
  const mk = $(`#bt-feed mark[data-fund="${i}"]`); if (mk) mk.classList.add('ist-markiert');
}
/* Der Beitrag, wie er auf LinkedIn steht: Kopf, Text mit markierten Funden, «mehr anzeigen», Grafik, Fuss */
function post() {
  const ort = $('#bt-feed'); if (!ort) return;
  const p = (Z.pr = pruefung()), handy = schmal() || Z.geraet === 'handy';
  ort.classList.toggle('ws-rahmen--handy', handy && !schmal());
  const marken = p.funde.map((f, i) => Object.assign({ i }, f)).filter(f => f.bis > f.von && f.von < p.text.length).sort((a, b) => a.von - b.von || b.bis - a.bis);
  const text = el('div', { class: 'bt-post__text' + (Z.mehr ? '' : ' ist-zu') });
  let pos = 0;
  const offen = Z.wahl != null && Z.wahl !== 'h' ? p.lagen.find(l => l.i === Z.wahl) : null;
  marken.forEach(f => {
    if (f.von < pos) return;
    text.append(p.text.slice(pos, f.von));
    text.append(el('mark', { class: 'm-' + f.stufe, 'data-fund': f.i, title: f.titel, onclick: () => zeigeFund(f.i) }, p.text.slice(f.von, f.bis)));
    pos = f.bis;
  });
  text.append(p.text.slice(pos));
  if (!p.text) text.append(el('span', { class: 'bt-post__leer' }, 'Noch kein Text. Wähl eine Vorlage unter «Haus, Vorlage, Stand».'));
  const mehr = el('button', { class: 'bt-post__mehr', type: 'button', onclick: () => { Z.mehr = !Z.mehr; post(); } }, Z.mehr ? 'weniger anzeigen' : '…mehr anzeigen');
  const da = Z.grafik && Z.grafikSig === grafikSig();
  const bild = el('figure', { class: 'bt-post__grafik' }, da ? el('img', { src: Z.grafik, alt: 'Vorher und nachher' }) : null);
  leere(ort).append(el('article', { class: 'bt-post', 'aria-label': 'So steht der Beitrag auf LinkedIn' },
    el('header', { class: 'bt-post__kopf' }, el('span', { class: 'bt-post__bild', 'aria-hidden': 'true' }, 'RR'),
      el('span', { class: 'bt-post__wer' }, el('b', {}, 'Robert Reff'), el('span', {}, 'Tasty Studios · Websites und Backoffice für Gastronomie und Hotellerie'), el('small', {}, 'Jetzt · Für alle sichtbar'))),
    text, p.text.length > 140 ? mehr : null, bild,
    el('footer', { class: 'bt-post__fuss' }, el('span', {}, 'Gefällt mir'), el('span', {}, 'Kommentieren'), el('span', {}, 'Teilen'))));
  if (offen) { const mk = $$('mark', text).find(x => { const f = p.funde[+x.dataset.fund]; return f && f.von >= offen.von && f.von < offen.bis; }); if (mk) mk.classList.add('ist-nah'); }
  if (!da) baueGrafik().then(g => { const f = $('#bt-feed .bt-post__grafik'); if (f && g && !f.firstChild) f.append(el('img', { src: g, alt: 'Vorher und nachher' })); });
}

// ---------------------------------------------------------------- Bild vorher/nachher und Grafik
const bilderCache = {}, ablageAdressen = {};
function bildLaden(adresse) {
  if (!adresse) return Promise.resolve(null);
  if (bilderCache[adresse]) return Promise.resolve(bilderCache[adresse]);
  return new Promise(res => { const im = new Image(); im.onload = () => { bilderCache[adresse] = im; res(im); }; im.onerror = () => res(null); im.src = adresse; });
}
async function bildAdresse(b) {
  if (!b || !b.wert) return '';
  if (b.art !== 'ablage') return b.wert;
  if (!ablageAdressen[b.wert]) { try { ablageAdressen[b.wert] = (await ruf('GET', 'bild', { id: b.wert })).daten; } catch (e) { return ''; } }
  return ablageAdressen[b.wert];
}
let grafikLauf = 0;
const grafikSig = () => Z.e ? JSON.stringify([Z.e.bilder, Z.e.grafik, Z.e.projekt_id]) : '';
async function baueGrafik() {
  /* Die Grafik vorher/nachher aus den beiden Bildern, als PNG (Quer 1200 × 628 oder Quadrat 1080 × 1080). Farben und Schrift aus dem Kleid. */
  const e = Z.e; if (!e) return '';
  const sig = grafikSig();
  if (Z.grafik && Z.grafikSig === sig) return Z.grafik;
  const lauf = ++grafikLauf;
  const p = projekt(e.projekt_id);
  const [av, an] = await Promise.all([bildAdresse(e.bilder.vorher), bildAdresse(e.bilder.nachher)]);
  const [iv, inn, logo] = await Promise.all([bildLaden(av), bildLaden(an), bildLaden('/zentrale/zentrale/oberflaeche/kleid/anker/anker-weiss.png')]);
  try { await Promise.all([document.fonts.load('600 48px "Antonio"'), document.fonts.load('400 20px "DM Mono"'), document.fonts.load('400 22px "Instrument Sans"')]); } catch (x) { /* Ersatzschrift reicht */ }
  if (lauf !== grafikLauf) return Z.grafik;
  const quer = e.grafik !== 'quadrat', B = quer ? 1200 : 1080, H = quer ? 628 : 1080;
  const c = document.createElement('canvas'); c.width = B; c.height = H;
  const k = c.getContext('2d'), st = getComputedStyle(document.documentElement), farbe = n => st.getPropertyValue(n).trim();
  k.fillStyle = farbe('--wo-tief'); k.fillRect(0, 0, B, H);
  const rnd = quer ? 36 : 48, kopf_ = quer ? 84 : 120, fuss = quer ? 54 : 72, luecke = quer ? 20 : 24;
  k.fillStyle = farbe('--wo-g1'); k.textBaseline = 'alphabetic';
  k.font = `600 ${quer ? 40 : 54}px "Antonio", "Instrument Sans", sans-serif`;
  k.fillText((p ? p.name : 'Vorher und nachher').toUpperCase(), rnd, quer ? 56 : 82);
  k.font = `400 ${quer ? 15 : 18}px "DM Mono", monospace`; k.fillStyle = farbe('--wo-g2');
  k.textAlign = 'right'; k.fillText(p ? `${p.ort}${p.fertig ? ' · Seite neu seit ' + datum(p.fertig) : ''}`.toUpperCase() : '', B - rnd, quer ? 56 : 82); k.textAlign = 'left';
  const felder = [], iB = B - 2 * rnd, iH = H - kopf_ - fuss;
  if (quer) { const b = (iB - luecke) / 2; felder.push({ x: rnd, y: kopf_, w: b, h: iH }, { x: rnd + b + luecke, y: kopf_, w: b, h: iH }); }
  else { const h = (iH - luecke) / 2; felder.push({ x: rnd, y: kopf_, w: iB, h }, { x: rnd, y: kopf_ + h + luecke, w: iB, h }); }
  [[iv, 'VORHER'], [inn, 'NACHHER']].forEach(([im, name], i) => {
    const f = felder[i], etikett = quer ? 34 : 40, bh = f.h - etikett;
    k.save(); k.beginPath(); k.roundRect(f.x, f.y, f.w, bh, 14); k.clip();
    k.fillStyle = farbe('--wo-schiefer'); k.fillRect(f.x, f.y, f.w, bh);
    if (im) { const s = Math.max(f.w / im.width, bh / im.height); k.drawImage(im, f.x, f.y, im.width * s, im.height * s); }   // oben links verankert: bei Bildschirmfotos steht dort das Wichtige
    else { k.fillStyle = farbe('--wo-taupe'); k.font = '400 18px "Instrument Sans", sans-serif'; k.textAlign = 'center'; k.fillText('Kein Bild', f.x + f.w / 2, f.y + bh / 2); k.textAlign = 'left'; }
    k.restore();
    k.strokeStyle = farbe('--wo-linie-d'); k.lineWidth = 1; k.beginPath(); k.roundRect(f.x + .5, f.y + .5, f.w - 1, bh - 1, 14); k.stroke();
    k.fillStyle = i ? farbe('--wo-g2') : farbe('--wo-taupe'); k.font = `400 ${quer ? 14 : 16}px "DM Mono", monospace`;
    k.fillText(name.split('').join(String.fromCharCode(8202)), f.x, f.y + bh + (quer ? 24 : 28));
  });
  k.fillStyle = farbe('--wo-taupe'); k.font = `400 ${quer ? 13 : 15}px "DM Mono", monospace`;
  k.fillText('TASTY STUDIOS'.split('').join(String.fromCharCode(8202)), rnd, H - (quer ? 20 : 26));
  if (logo) { const g = quer ? 26 : 32; const r = logo.width / logo.height; k.drawImage(logo, B - rnd - g * r, H - (quer ? 20 : 26) - g + 4, g * r, g); }
  Z.grafik = c.toDataURL('image/png'); Z.grafikSig = sig;
  return Z.grafik;
}
const grafikName = () => { const p = projekt(Z.e.projekt_id); return `${p ? p.id : 'haus'}-vorher-nachher-${Z.e.grafik === 'quadrat' ? '1080x1080' : '1200x628'}.png`; };
async function zeichneBild(opt) {
  const m = $('#ws-mitte'), e = Z.e, p = projekt(e.projekt_id), alt = gespeichert();
  const oben = window.scrollY;
  const karten = await Promise.all(['vorher', 'nachher'].map(async s => {
    const b = e.bilder[s], adr = await bildAdresse(b), geaendert = alt && JSON.stringify(alt.bilder[s] || null) !== JSON.stringify(b || null);
    const datei = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif', hidden: true, 'data-bt-datei': s });
    datei.addEventListener('change', () => hochladen(s, datei));
    return el('section', { class: 'platte ws-karte bt-bildkarte' + (geaendert ? ' bt-karte--offen' : ''), 'data-bt-bild': s },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, s === 'vorher' ? 'Vorher' : 'Nachher'), mono(bildText(b) + (geaendert ? ' · nicht gespeichert' : ''))),
      el('div', { class: 'bt-bild__r' }, adr ? el('img', { src: adr, alt: s === 'vorher' ? 'Vorher' : 'Nachher' }) : el('span', { class: 'ws-mono' }, 'Kein Bild')),
      el('div', { class: 'ws-reihe', style: 'padding-top:14px' },
        p && (p[s] || {}).bild ? taste('Vom Haus', () => bildSetzen(s, { art: 'pfad', wert: p[s].bild })) : null,
        el('label', { class: 'ws-taste bt-hoch' }, 'Hochladen', datei),
        taste('Verlinken', () => verlinkenFenster(s))));
  }));
  if (!opt.gilt()) return;
  const gl = await baueGrafik();
  if (!opt.gilt()) return;
  leere(m).append(titel('Beitrag · ' + hausName(e), 'Bild', 'vorher/nachher.', 'Ein Bild der alten und eines der neuen Seite, vom Haus, hochgeladen oder verlinkt. Daraus baut das Werkzeug die Grafik unter dem Beitrag, zum Speichern als PNG.',
    [el('a', { class: 'wo-kn wo-kn--gold', href: gl, download: grafikName(), 'data-bt-grafik-speichern': '1', html: '<span>Grafik speichern</span><i>' + WO.ic('hoch') + '</i>' }), knWo('Zum Text', 'stift', 'glas', () => geh('text'))], foto('bild')),
    el('div', { class: 'bt-bilder' }, karten),
    el('section', { class: 'platte ws-karte', 'data-bt-grafik': e.grafik },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Die Grafik'), mono(e.grafik === 'quadrat' ? 'Quadrat 1080 × 1080' : 'Quer 1200 × 628')),
      el('div', { class: 'ws-reihe', style: 'padding:6px 0 16px' },
        wahl2([{ wert: 'quer', text: 'Quer 1200 × 628' }, { wert: 'quadrat', text: 'Quadrat 1080 × 1080' }], e.grafik, async x => { e.grafik = x; eingabe(); zeichne({ halten: true }); }, 'Format der Grafik', true)),
      el('figure', { class: 'bt-grafik' + (e.grafik === 'quadrat' ? ' bt-grafik--quadrat' : '') }, el('img', { src: gl, alt: 'Grafik vorher und nachher' })),
      el('div', { class: 'ws-reihe', style: 'padding-top:14px' }, el('a', { class: 'ws-taste', href: gl, download: grafikName() }, 'Als PNG speichern'), el('span', { class: 'ws-klein' }, 'Die Datei landet im Ordner «Downloads». Auf LinkedIn mit dem Text zusammen posten.'))));
  if (opt.halten) window.scrollTo(0, oben);
}
async function bildSetzen(s, b) {
  if (JSON.stringify(Z.e.bilder[s] || null) === JSON.stringify(b)) { melde('Dieses Bild ist schon gesetzt.'); return; }
  Z.e.bilder[s] = b;
  eingabe(); await zeichne({ halten: true });
  quit('Bild ' + s + ' gesetzt', 'Noch nicht gespeichert. «Speichern» unten legt es ab, «Vorher, nachher» zeigt den Unterschied.');
}
function dateiAlsAdresse(datei) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(datei); }); }
async function hochladen(s, inp) {
  const datei = inp.files[0]; if (!datei) return;
  quit('Bild wird abgelegt …', datei.name);
  try { const a = await ruf('POST', 'bild', { name: datei.name, daten: await dateiAlsAdresse(datei) }); await bildSetzen(s, { art: 'ablage', wert: a.id }); }
  catch (x) { fehler(Object.assign({ stichwort: 'BILD' }, x)); }
  inp.value = '';
}
function verlinkenFenster(s) {
  const url = el('input', { type: 'url', id: 'bt-url', placeholder: 'https://… oder /seite/…', autocomplete: 'off' });
  fenster('Bild ' + s, 'verlinken.', el('div', { class: 'ws-form' },
    el('div', { class: 'feld' }, el('label', { for: 'bt-url' }, 'Adresse des Bildes'), url),
    el('p', { class: 'ws-klein' }, 'Eine öffentliche Adresse oder ein Pfad im eigenen Haus (/zentrale/seite/…, /grundlagen/marke/…). Das Werkzeug holt das Bild einmal und legt es ab.')), [
    { text: 'Abbrechen' },
    { text: 'Holen', haupt: true, tun: async zu => {
      const u = url.value.trim(); if (!u) { url.focus(); return; }
      zu(); quit('Bild wird geholt …', u);
      try { const a = await ruf('POST', 'bild-holen', { url: u }); await bildSetzen(s, { art: 'ablage', wert: a.id }); }
      catch (x) { fehler(Object.assign({ stichwort: 'LINK' }, x)); }
    } }], { name: 'verlinken' });
}

// ---------------------------------------------------------------- Haus, Vorlage, Stand
const STAND_SATZ = { veroeffentlicht: 'Das Werkzeug stellt nichts online, das machst du auf LinkedIn. Hier steht nur, dass es passiert ist.',
  fertig: 'Fertig heisst: geprüft und bereit. Nach dem Posten auf LinkedIn den Stand auf «Veröffentlicht» stellen.',
  entwurf: 'Ein Entwurf. Lücken füllen, Prüfung durchgehen, dann auf «Fertig» stellen.' };
function zeichneAngaben(opt) {
  const m = $('#ws-mitte'), e = Z.e, p = projekt(e.projekt_id), alt = gespeichert(), oben = window.scrollY;
  const neu = (feld, wert) => alt && JSON.stringify(alt[feld]) !== JSON.stringify(wert);
  const stich = el('textarea', { class: 'ws-text bt-feld', id: 'bt-stich', rows: 5, spellcheck: 'true', lang: 'de', 'aria-label': 'Was anders ist, ein Punkt je Zeile' });
  stich.value = e.stichpunkte.join('\n');
  const hoehe = () => { stich.style.height = 'auto'; stich.style.height = (stich.scrollHeight + 2) + 'px'; };
  stich.addEventListener('input', () => { hoehe(); e.stichpunkte = stich.value.split('\n').map(x => x.trim()).filter(Boolean); eingabe(); });
  const zl = p ? hausZahlen(p) : [];
  leere(m).append(titel('Beitrag · ' + hausName(e), 'Haus, Vorlage,', 'Stand.', 'Für welches Haus, aus welcher Vorlage, mit welchen Punkten, und wie weit der Beitrag ist. Jede Änderung wartet, bis du speicherst.',
    [knWo('Zum Text', 'stift', 'gold', () => geh('text'))], foto('angaben')),
    el('section', { class: 'platte ws-karte ws-form' + (neu('projekt_id', e.projekt_id) ? ' bt-karte--offen' : ''), 'data-bt-form': 'haus' },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Das Haus'), mono(p ? p.ort : '')),
      auswahl(Z.projekte.map(x => ({ wert: x.id, text: x.name, zusatz: x.ort })), e.projekt_id, x => hausWechsel(x), 'Haus'),
      p ? el('div', {}, el('p', { class: 'ws-klein' }, hausSatz(p)),
        el('p', { class: 'ws-klein' }, zl.length ? zl.map(z => z.was + ' ' + z.vorher + ' → ' + z.nachher).join(' · ') : 'Zahlen vorher und nachher: nicht belegt.')) : null),
    herkunftKarte(e, true) || '',
    el('section', { class: 'platte ws-karte ws-form' + (neu('stichpunkte', e.stichpunkte) ? ' bt-karte--offen' : ''), 'data-bt-form': 'stichpunkte' },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, e.stand === 'geplant' ? 'Eckdaten' : 'Was anders ist'), mono('ein Punkt je Zeile')), stich,
      el('div', { class: 'ws-reihe' }, p && (p.anders || []).length ? taste('Vom Haus übernehmen', () => { stich.value = p.anders.join('\n'); stich.dispatchEvent(new Event('input')); }) : null,
        el('span', { class: 'ws-klein' }, 'Die Punkte landen als Zeilen im Abschnitt «Was anders ist», wenn du den Text aus der Vorlage baust.'))),
    el('section', { class: 'platte ws-karte ws-form' + (neu('vorlage', e.vorlage) ? ' bt-karte--offen' : ''), 'data-bt-form': 'vorlage' },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Vorlage'), mono(vorlage(e.vorlage).name)),
      el('div', { class: 'bt-vorlagen', role: 'radiogroup', 'aria-label': 'Vorlage' }, VORLAGEN.map(x => el('button', { type: 'button', role: 'radio', class: 'bt-vl', 'aria-checked': x.id === e.vorlage ? 'true' : 'false', 'data-bt-vorlage': x.id,
        onclick: () => { e.vorlage = x.id; eingabe(); zeichne({ halten: true }); } }, el('b', {}, x.name), el('span', {}, x.kurz)))),
      el('div', { class: 'ws-reihe' }, taste('Text aus der Vorlage bauen', bauen), el('span', { class: 'ws-klein' }, 'Der Aufbau ist fest: erste Zeile, zweite Zeile, Problem, was anders ist, Schlusssatz, Frage. Lücken in eckigen Klammern füllst du.'))),
    el('section', { class: 'platte ws-karte ws-form' + (neu('stand', e.stand) ? ' bt-karte--offen' : ''), 'data-bt-form': 'stand' },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Stand'), mono(e.stand === 'veroeffentlicht' && e.veroeffentlicht_am ? 'veröffentlicht am ' + datum(e.veroeffentlicht_am) : STAND_NAME[e.stand])),
      wahl2(Object.keys(STAND_NAME).map(k => ({ wert: k, text: STAND_NAME[k] })), e.stand, x => { e.stand = x; eingabe(); zeichne({ halten: true }); }, 'Stand', true),
      el('p', { class: 'ws-klein' }, STAND_SATZ[e.stand]),
      el('div', { class: 'ws-reihe' }, taste('Text kopieren', kopieren), link(e.neu ? 'Neuen Beitrag verwerfen' : 'Beitrag löschen', loeschen))));
  hoehe();
  if (opt.halten) window.scrollTo(0, oben);
}
function hausWechsel(id) {
  const e = Z.e, p = projekt(id);
  e.projekt_id = id; eingabe();
  zeichne({ halten: true });
  if (!p) return;
  fenster('Bilder und Punkte', 'übernehmen?', el('p', {}, 'Bilder vorher/nachher und «Was anders ist» von ' + p.name + ' übernehmen? Der Text bleibt, wie er ist.'), [
    { text: 'Nein, nur das Haus' },
    { text: 'Übernehmen', haupt: true, tun: zu => { zu(); e.stichpunkte = (p.anders || []).slice(); e.bilder = hausBilder(p); eingabe(); zeichne({ halten: true }); } }], { name: 'haus' });
}
function bauen() {
  const e = Z.e, mach = () => { e.abschnitte = baueAbschnitte(e.vorlage, werteJetzt()); Z.wahl = null; eingabe(); geh('text'); quit('Text gebaut', 'Aus der Vorlage ' + anf(vorlage(e.vorlage).name) + '. Noch nicht gespeichert.'); };
  if (!e.abschnitte.some(a => a.text.trim())) return mach();
  fenster('Text neu', 'bauen?', el('p', {}, 'Den Text neu aus der Vorlage ' + anf(vorlage(e.vorlage).name) + ' bauen? Der jetzige Text wird ersetzt. Gespeichertes bleibt, bis du speicherst, und «Vorher, nachher» zeigt den Unterschied.'), [
    { text: 'Abbrechen' }, { text: 'Neu bauen', haupt: true, tun: zu => { zu(); mach(); } }], { name: 'bauen' });
}

// ---------------------------------------------------------------- Vorher, nachher (ungespeicherte Eingaben)
function zeichneVergleich() {
  const m = leere($('#ws-mitte')), z = offenListe();
  m.append(titel('Beitrag · ' + hausName(Z.e), 'Vorher,', 'nachher.', z.length ? mz(z.length, 'Eingabe wartet', 'Eingaben warten') + '. Links steht, was gespeichert ist, rechts deine Eingabe. Speichern legt alles ab.' : 'Alles ist gespeichert, nichts wartet.',
    z.length ? [knWo('Speichern', 'pfeil', 'gold', speichern), knWo('Alle Eingaben verwerfen', 'zurueck', 'glas', verwerfen)] : [knWo('Zum Text', 'stift', 'gold', () => geh('text'))], foto('vergleich')));
  if (!z.length) {
    m.append(el('p', { class: 'ws-satz ws-beispiel-satz' }, 'So steht eine Eingabe hier, sobald du etwas änderst. Die Werte unter «Vorher» sind gespeichert.'));
    const ort = el('div', { class: 'ws-beispiele', 'data-ws-beispiel': 'vergleich' });
    Z.e.abschnitte.slice(0, 3).forEach(a => ort.append(el('section', { class: 'platte ws-karte ws-karte--beispiel' }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, artName(a.art)), mono('Beispiel · ' + kurz(hausName(Z.e), 40))), werte({ vorher: kurz(a.text, 160), nachher: 'deine neue Fassung' }))));
    m.append(ort);
    return;
  }
  z.forEach(x => m.append(el('section', { class: 'platte ws-karte', 'data-ws-aenderung': x.was }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, x.was), mono(Z.e.neu ? 'neu' : 'nicht gespeichert')), werte(x))));
}
function verwerfen() {
  fenster('Alle Eingaben', 'verwerfen?', el('p', {}, mz(offenZahl(), 'Eingabe geht', 'Eingaben gehen') + ' verloren. Der gespeicherte Beitrag bleibt, wie er ist.'), [
    { text: 'Abbrechen' },
    { text: 'Ja, verwerfen', haupt: true, tun: zu => {
      zu();
      if (Z.e.neu) { Z.e = null; Z.g = ''; geh('l:alle'); melde('Verworfen', { mehr: 'Der neue Beitrag ist nicht angelegt worden.' }); return; }
      Z.e = kopie(Z.entwuerfe.find(x => x.id === Z.e.id)); Z.wahl = null;
      geh('text'); melde('Verworfen', { mehr: 'Der Beitrag steht, wie er gespeichert ist.' });
    } }], { name: 'verwerfen' });
}

// ---------------------------------------------------------------- Vorlagen und Prüfregeln
/* Lücken der Vorlage in Alltagssprache zeigen: {dateien_vorher} wird [Zahl der Dateien beim Öffnen, vorher] */
const lesbar = t => String(t).replace(/\{(\w+)\}/g, (x, k) => '[' + (LUECKEN_NAMEN[k] || k.replace(/_/g, ' ')) + ']');
function zeichneVorlagen() {
  const m = leere($('#ws-mitte'));
  m.append(titel('Hilfe beim Schreiben', 'Vorlagen.', '', 'Feste Aufbauten mit Lücken nach dem LinkedIn-Regelwerk: erste Zeile vor «mehr anzeigen», zweite Zeile, Problem, was anders ist, Schlusssatz, eine konkrete Frage. Kein KI-Aufruf: das Werkzeug füllt nur ein, was es vom Haus weiss.',
    [knWo('Neuer Beitrag', 'plus', 'gold', () => springe('neu'))], foto('vorlagen')));
  VORLAGEN.forEach(v => m.append(el('section', { class: 'platte ws-karte', 'data-bt-vorlage-karte': v.id },
    el('div', { class: 'ws-karte__kopf' }, el('h2', {}, v.name), mono(mz(Object.keys(v.abschnitte).length, 'Abschnitt', 'Abschnitte'))),
    el('p', {}, v.kurz),
    el('div', { class: 'ws-liste-klein' }, Object.keys(v.abschnitte).map(a => el('p', {}, el('b', {}, artName(a) + ': '), lesbar(v.abschnitte[a][0]) + (v.abschnitte[a].length > 1 ? ' (' + v.abschnitte[a].length + ' Fassungen)' : '')))),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Mit dieser Vorlage anfangen', () => { const p = Z.projekte.slice().sort((a, b) => (b.fertig || '').localeCompare(a.fertig || ''))[0]; neuerBeitrag(p && p.id, v.id); })))));
  m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Was die Lücken heissen'), mono('in eckigen Klammern')),
    el('p', {}, 'Das Werkzeug setzt ein, was es vom Haus weiss. Was es nicht weiss, bleibt als Lücke stehen und die Prüfung meldet es.'),
    el('div', { class: 'ws-liste-klein' }, [...new Set(Object.values(LUECKEN_NAMEN))].map(n => el('p', {}, '[' + n + ']')))));
}
function zeichneRegeln() {
  const m = leere($('#ws-mitte'));
  m.append(titel('Hilfe beim Schreiben', 'Prüfregeln.', '', 'Was die Prüfung am Text sucht, aus der Anti-KI-Checkliste in «Meine LinkedIn-Stimme» und der Negativliste in «Schreibstil». «Raus» steht so in der Liste, «prüfen» ist oft falsch und manchmal richtig, «Hinweis» betrifft Länge und Mechanik.',
    Z.e ? [knWo('Zum Text', 'stift', 'gold', () => geh('text'))] : [], foto('regeln')));
  [['fehler', 'Raus damit'], ['pruefen', 'Ansehen'], ['hinweis', 'Hinweise']].forEach(([s, name]) => {
    const r = MUSTER.filter(x => x.stufe === s);
    m.append(el('section', { class: 'platte ws-karte', 'data-bt-regeln': s }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, name), mono(mz(r.length, 'Regel', 'Regeln'))),
      el('div', { class: 'ws-liste-klein' }, r.map(x => el('p', {}, el('b', {}, x.titel + ': '), x.tipp)))));
  });
  m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Aufbau und Länge'), mono('aus dem Regelwerk')),
    el('div', { class: 'ws-liste-klein' }, ['Die erste Zeile steht allein vor «mehr anzeigen», höchstens etwa 150 Zeichen.', 'Am Ende eine konkrete Frage, die Optionen oder eine Situation nennt.',
      'Kurze Sätze und kurze Absätze, eine Leerzeile dazwischen.', 'Keine Links im Text: der Link kommt in den ersten Kommentar.', 'Höchstens drei Hashtags, am Ende.', 'Floskeln am Anfang («Heute möchte ich …») fliegen raus.'].map(t => el('p', {}, t)))));
}

// ---------------------------------------------------------------- Zeichnen und Start
async function zeichne(opt = {}) {
  const lauf = ++Z.zl, a = Z.ansicht, m = $('#ws-mitte');
  opt = Object.assign({}, opt, { gilt: () => lauf === Z.zl });
  m.removeAttribute('data-ws-bereit');
  m.setAttribute('data-ws-ansicht', a);
  try {
    if (a === 'start') zeichneStart();
    else if (a.startsWith('l:')) zeichneListe(a.slice(2));
    else if (a.startsWith('h:')) zeichneHaus(a.slice(2));
    else if (a === 'text') zeichneText(opt);
    else if (a === 'bild') await zeichneBild(opt);
    else if (a === 'angaben') zeichneAngaben(opt);
    else if (a === 'vergleich') zeichneVergleich();
    else if (a === 'vorlagen') zeichneVorlagen();
    else if (a === 'regeln') zeichneRegeln();
  } catch (e) { fehler(e); }   // ein Fehler beim Zeichnen steht auf der Seite, nie nur in der Konsole
  if (opt.gilt()) m.setAttribute('data-ws-bereit', a);
}
async function ladeArchiv() { Z.entwuerfe = (await ruf('GET', 'entwuerfe')).entwuerfe; }
function startFehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke('Start: ' + text, e && e.stichwort);
  $('#ws-rand').hidden = true;
  $('#ws-kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'LinkedIn', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: pruefLink(e && e.stichwort), website: WO_HAUS.wege.website });
  $('#ws-leiste').innerHTML = WO.leiste({ titel: 'Das Werkzeug startet nicht', satz: 'Nichts ist verloren: die Beiträge liegen auf dem Server.', knoepfe: WO.knopf('Speichern', 'pfeil', 'glas', { id: 'ws-speichern', klein: true, disabled: true }) });
  leere($('#ws-mitte')).append(el('div', { class: 'platte ws-karte ws-form', style: 'max-width:640px;margin-top:40px', 'data-ws-startfehler': (e && e.stichwort) || 'SERVER' },
    mono('Das Werkzeug startet nicht'), el('h2', {}, text),
    el('p', {}, 'Die Prüfung läuft unabhängig vom Werkzeug und sagt, woran es liegt. Meist ist der Server nicht gestartet: python3 zentrale/server.py'),
    el('div', { class: 'ws-reihe' }, el('a', { class: 'kn kn--d kn--klein', href: pruefLink(e && e.stichwort) }, el('span', {}, 'Prüfung öffnen'), el('i', { 'aria-hidden': 'true', html: PF })), taste('Noch einmal versuchen', () => location.reload()))));
}
async function start() {
  window.addEventListener('beforeunload', ev => { if (offenZahl()) { ev.preventDefault(); ev.returnValue = ''; } });
  window.addEventListener('error', ev => merke(ev.message || 'Fehler im Werkzeug', 'SERVER'));
  window.addEventListener('unhandledrejection', ev => merke((ev.reason && (ev.reason.fehler || ev.reason.message)) || 'Fehler im Werkzeug', (ev.reason && ev.reason.stichwort) || 'SERVER'));
  window.addEventListener('resize', () => { if (Z.ansicht === 'text') post(); });
  document.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); speichern(); } });
  try {
    const [p] = await Promise.all([ruf('GET', 'projekte'), ladeArchiv()]);
    Z.projekte = p.projekte;
    const q = new URLSearchParams(location.search);
    let a = q.get('ansicht'), id = q.get('entwurf');
    let o = null; try { o = JSON.parse(localStorage.getItem('bt-ort') || 'null'); } catch (e) { /* ohne Merken */ }
    if (o && !a && !id) { a = o.a; id = o.id; }   // dort weitermachen, wo man zuletzt war
    else if (o && !id && BEITRAG.includes(a)) id = o.id;
    const e = id && Z.entwuerfe.find(x => x.id === id);
    if (e) { Z.e = kopie(e); Z.g = JSON.stringify(sauber(e)); if (!a || !BEITRAG.includes(a)) a = 'text'; }
    if (a && (ansichtName(a) || a === 'start')) Z.ansicht = a;
    allesNeu();
    await zeichne({});
  } catch (e) { startFehler(e); }
}
start();
})();
