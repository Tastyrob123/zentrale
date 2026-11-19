/* markenbuch.js · das Markenbuch von Tasty Studios, gebaut nach Le Bureau (vorlage/culinarium-demo/werkzeuge/bureau/werkzeuge/website/website.js).
   Aufbau und Ablauf wie dort: Kopf, Rand mit Gruppen, Übersicht mit Startbild, Lage (drei Fächer), «Häufig gebraucht» und Bereich-Liste,
   jede Ansicht mit eigener Bühne, darunter Karten; Leiste unten, Fenster, Quittung, Meldung mit «Was tun?», Fehler in den Browser (localStorage «ws-fehler»).
   Inhalt aus der ersten Fassung: Logo, Schriften, Farben, Bausteine, Bild und Sprache. Was die Website wirklich benutzt, liest api.py bei jedem Öffnen
   frisch aus den Stil-Dateien der Agentur-Seite (/zentrale/api/11-markenbuch/auslese); feste Inhalte aus den Grundlagen stehen in inhalt.js.
   Das Markenbuch ändert nichts und speichert nichts: «Speichern» meldet das, «Neu lesen» liest die Website noch einmal und quittiert vorher und nachher. */
(() => {
'use strict';
const W = '11-markenbuch';
const API = weg => '/zentrale/api/' + W + '/' + weg;
const I = window.INHALT;
const wname = k => (WO.haus.namen || {})[k] || WO.name(k);   // Namen der Werkzeuge an einer Stelle: kleid/tasty.js › namen
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>';
const WEB = ['Antonio', 'Instrument Sans', 'DM Mono', 'Cormorant Garamond'];
const ROLLEN = ['Titel', 'Zwischentitel', 'Fliesstext', 'Etikett'];
const SCHRIFT_SATZ = {
  'Antonio': 'Die schmale Titelschrift. Grosse Zeilen, Zahlen und Versalzeilen.',
  'Instrument Sans': 'Die Textschrift der Seite. Fliesstext, Knöpfe und ruhige Zwischentitel.',
  'DM Mono': 'Die Schreibmaschine der Seite. Kleine Versalzeilen mit weitem Abstand: Orte, Stand, Beschriftungen.',
  'Cormorant Garamond': 'Die Serifenschrift für die gezeigten Häuser: Hausnamen, Speisekarten, Zitate.',
  'Montserrat': 'Die Dokument-Schrift für Verträge, Angebote, Konzepte und Vereinbarungen. Sie steht nicht auf der Website.'
};
const PROBE_STIL = { 'Antonio': 'font-weight:700;text-transform:uppercase', 'DM Mono': 'letter-spacing:.08em;text-transform:uppercase', 'Cormorant Garamond': 'font-weight:600', 'Montserrat': 'font-weight:500', 'Instrument Sans': '' };

const Z = { a: null, ansicht: 'start', gelesen: null, stand: null, rolle: 'alle', filter: '', farbArt: 'alle', gesp: 0 };

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
  for (const k of kinder.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const leere = e => { e.textContent = ''; return e; };
const taste = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-taste', type: 'button', onclick: tun }, attrs), text);
const link = (text, tun, attrs = {}) => el('button', Object.assign({ class: 'ws-link', type: 'button', onclick: tun }, attrs), text);
const mono = text => el('span', { class: 'ws-mono' }, text);
const mz = (n, eins, viele) => n + ' ' + (n === 1 ? eins : viele);
const stellen = n => n === 1 ? 'einer Stelle' : n + ' Stellen';
const anf = t => '«' + t + '»';
const kurzName = n => n.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[^a-z0-9]+/g, '-');
const woKn = (text, zeichen, art, tun, attrs = {}) => el('button', Object.assign({ class: 'wo-kn wo-kn--' + art + (attrs.klein ? ' wo-kn--klein' : ''), type: 'button', onclick: tun, html: '<span>' + WO.esc(text) + '</span><i>' + WO.ic(zeichen) + '</i>' }, attrs.attr || {}));
const woA = (text, zeichen, art, href, attrs = {}) => el('a', Object.assign({ class: 'wo-kn wo-kn--' + art, href, html: '<span>' + WO.esc(text) + '</span><i>' + WO.ic(zeichen) + '</i>' }, attrs));
function uhr(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' Uhr'; }
function datum(d) { return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); }
function hell(hex) { const r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 140; }
function rgb(hex) { return 'rgb(' + [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)).join(', ') + ')'; }

function merke(text, stichwort) {
  try {
    const l = JSON.parse(localStorage.getItem('ws-fehler') || '[]');
    l.push({ zeit: new Date().toISOString(), text: String(text).slice(0, 400), stichwort: stichwort || '', wo: Z.ansicht, haus: 'tasty' });
    localStorage.setItem('ws-fehler', JSON.stringify(l.slice(-30)));
  } catch (e) { /* voller oder gesperrter Speicher: die Meldung steht trotzdem auf der Seite */ }
}
let unterwegs = 0;   // laufende Anfragen, steht als data-ws-laeuft am <html> (der Prüflauf wartet darauf)
function zaehle(n) { unterwegs += n; document.documentElement.setAttribute('data-ws-laeuft', unterwegs); }
async function ruf(methode, weg, daten) {
  let r, j = null;
  zaehle(1);
  try {
    const vorab = methode === 'GET' && !daten && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];   // die Seite holt die Auslese schon beim Laden (index.html)
    r = await (vorab || fetch(weg, { method: methode, headers: daten ? { 'Content-Type': 'application/json' } : {}, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' }));
    try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  } catch (e) { throw { stichwort: 'verbindung', fehler: 'Der Server des Werkzeugs antwortet nicht.' }; } finally { zaehle(-1); }
  if (!r.ok || j == null) throw Object.assign({ status: r.status, stichwort: 'auslese', fehler: 'Unerwartete Antwort des Servers (' + r.status + ').' }, j || {});
  return j;
}

// ---------------------------------------------------------------- Meldung, Quittung, Fenster (wie in der Vorlage)
function pruefLink(stichwort) { return 'pruefung.html' + (stichwort ? '#' + stichwort.toUpperCase() : ''); }
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
/* Quittung mit vorher und nachher wie in der Vorlage: die erste Zeile im Satz, dazu «Vorher/nachher ansehen» und «Rückgängig» */
function quittung(titel, zeilen_, ansehen, zurueck) {
  const z = zeilen_[0];
  const k = quit(titel, '', [ansehen ? taste('Vorher/nachher ansehen', () => { k.remove(); ansehen(); }) : null, zurueck ? taste('Rückgängig', () => zurueck(k)) : null], { 'data-ws-quittung': zeilen_.length });
  $('.ws-quit__t', k).append(z ? el('span', {}, z.was + ': «', el('span', { 'data-ws-q': 'vorher' }, z.vorher), '» wird «', el('span', { 'data-ws-q': 'nachher' }, z.nachher), '»',
    zeilen_.length > 1 ? ' und ' + mz(zeilen_.length - 1, 'weiterer Unterschied', 'weitere Unterschiede') : '') : el('span', {}, 'Alles wie vorher.'));
  return k;
}
/* Kennzahlen einer Auslese: daran sieht man, ob sich die Website verändert hat (so wird auch der Stand gespeichert) */
function kennzahlen(A) {
  const s = {}, p = {};
  (A.schriften || []).forEach(f => { s[f.familie] = f.anzahl; });
  A.farben.abgleich.forEach(b => { p[b.hex] = b.anzahl; });
  return { dateien: A.dateien.slice(), regeln: A.regeln, farben: A.farben.gesamt, schriften: s, palette: p, knoepfe: A.knoepfe.length, logo: (A.logo || []).length };
}
function unterschiede(a, b) {   // a vorher, b nachher, beides Kennzahlen; je Unterschied {was, vorher, nachher}
  if (!a || !b) return [];
  const z = [], st = n => n == null ? 'keine' : stellen(n).replace('einer Stelle', '1 Stelle');
  const zahl = (was, x, y, f = String) => { if (x !== y) z.push({ was, vorher: f(x), nachher: f(y) }); };
  zahl('Stil-Dateien', a.dateien.length, b.dateien.length);
  b.dateien.filter(d => a.dateien.indexOf(d) < 0).forEach(d => z.push({ was: 'Stil-Datei ' + d, vorher: 'fehlt', nachher: 'neu' }));
  a.dateien.filter(d => b.dateien.indexOf(d) < 0).forEach(d => z.push({ was: 'Stil-Datei ' + d, vorher: 'da', nachher: 'weg' }));
  zahl('Regeln', a.regeln, b.regeln);
  zahl('Farben', a.farben, b.farben);
  [...new Set(Object.keys(a.schriften).concat(Object.keys(b.schriften)))].forEach(n => zahl(n, a.schriften[n], b.schriften[n], st));
  [...new Set(Object.keys(a.palette).concat(Object.keys(b.palette)))].forEach(h => zahl(h, a.palette[h], b.palette[h], st));
  zahl('Knöpfe', a.knoepfe, b.knoepfe);
  zahl('Logo-Stellen', a.logo, b.logo);
  return z;
}
/* «Vorher/nachher ansehen»: alle Unterschiede in einem Fenster, links vorher, rechts nachher */
function vergleichFenster(vorherName, nachherName, z, knoepfe = []) {
  fenster('Vorher,', 'nachher.', el('div', { class: 'ws-form', 'data-ws-form': 'vergleich' },
    el('p', { class: 'ws-klein' }, z.length ? mz(z.length, 'Unterschied', 'Unterschiede') + ' zwischen ' + vorherName + ' und ' + nachherName + '.' : 'Kein Unterschied zwischen ' + vorherName + ' und ' + nachherName + '.'),
    z.length ? el('div', { class: 'mb-vgl' }, el('div', { class: 'mb-vgl__z mb-vgl__kopf' }, el('span', {}, 'Was'), el('span', {}, 'Vorher'), el('span', {}, 'Nachher')),
      z.map(x => el('div', { class: 'mb-vgl__z', 'data-mb-vgl': x.was }, el('span', {}, x.was), el('span', { class: 'ws-mono', 'data-ws-q': 'vorher' }, x.vorher), el('span', { class: 'ws-mono', 'data-ws-q': 'nachher' }, x.nachher)))) : null),
    [{ text: 'Schliessen' }].concat(knoepfe), { name: 'vergleich' });
}
function fenster(titel, akzent, inhalt, knoepfe, opt = {}) {
  const ort = $('#ws-fenster');
  const zu = () => { leere(ort); document.removeEventListener('keydown', taste_); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const blatt = el('div', { class: 'ws-fenster__blatt', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel + ' ' + akzent, 'data-ws-fenster': opt.name || '1' },
    el('h2', {}, titel + ' ', el('span', { class: 't-akzent' }, akzent)), inhalt,
    el('div', { class: 'ws-fenster__kn' }, knoepfe.filter(Boolean).map(k => k.haupt ? woKn(k.text, k.zeichen || 'pfeil', 'dunkel', () => k.tun(zu), { klein: true }) : link(k.text, () => (k.tun ? k.tun(zu) : zu())))));
  leere(ort).append(el('div', { class: 'ws-fenster' }, el('button', { class: 'ws-fenster__grund', type: 'button', 'aria-label': 'Schliessen', onclick: zu }), blatt));
  document.addEventListener('keydown', taste_);
  return zu;
}
function wahl2(optionen, wert, beiWahl, name, hell_) {
  const k = el('div', { class: 'ws-wahl2' + (hell_ ? ' ws-wahl2--hell' : ''), role: 'group', 'aria-label': name, 'data-ws-wahl': name });
  optionen.forEach(o => k.append(el('button', { type: 'button', 'aria-pressed': o.wert === wert ? 'true' : 'false', 'data-wert': o.wert, onclick: ev => {
    if (o.wert === wert) return;
    wert = o.wert;
    [...k.children].forEach(c => c.setAttribute('aria-pressed', c === ev.currentTarget ? 'true' : 'false'));
    beiWahl(o.wert);
  } }, o.text)));
  return k;
}

// ---------------------------------------------------------------- Kopieren und Laden
function kopiere(text, was) {
  const alt = () => {
    const t = el('textarea', { readonly: true, style: 'position:fixed;opacity:0;left:0;top:0' }); t.value = text;
    document.body.append(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* nichts */ }
    t.remove();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(alt); else alt();
  quit('Kopiert', (was ? was + ' ' : '') + anf(text.length > 80 ? text.slice(0, 79) + '…' : text) + ' liegt in der Zwischenablage.', [], { 'data-ws-kopiert': text });
}
function speichere(href, name) {
  const a = el('a', { href, download: name, style: 'display:none' }); document.body.append(a); a.click(); a.remove();
}
function speichereBlob(blob, name) {
  const url = URL.createObjectURL(blob); speichere(url, name); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function alleLogos(knopf) {
  const span = knopf && knopf.querySelector('span'), vorher = span ? span.textContent : '';
  if (knopf) { knopf.disabled = true; if (span) span.textContent = 'Wird gepackt'; }
  try {
    const dateien = await Promise.all(I.logos.map(l => fetch(I.logoPfad + encodeURIComponent(l.datei)).then(r => { if (!r.ok) throw { stichwort: 'logo', fehler: 'Die Logo-Datei ' + anf(l.datei) + ' fehlt.' }; return r.arrayBuffer(); })
      .then(b => ({ name: 'tasty-studios-logo/' + l.datei, daten: new Uint8Array(b) }))));
    speichereBlob(window.baueZip(dateien), 'tasty-studios-logo.zip');
    quit('Geladen', mz(dateien.length, 'Logo-Datei', 'Logo-Dateien') + ' in ' + anf('tasty-studios-logo.zip') + ', so wie sie in den Grundlagen liegen.', [], { 'data-ws-geladen': 'zip' });
  } catch (e) { fehler(e); }
  if (knopf) { knopf.disabled = false; if (span) span.textContent = vorher; }
}
function logoLaden(l) {
  speichere(I.logoPfad + encodeURIComponent(l.datei), l.datei);
  quit('Geladen', anf(l.datei) + ', unverändert aus den Grundlagen.', [], { 'data-ws-geladen': l.datei });
}

// ---------------------------------------------------------------- Ansichten, Namen, Gruppen
const TITEL = { start: 'Übersicht', zeichen: 'Fassungen', schutz: 'Schutzraum & Grösse', nie: 'Was man nie tut', schrift: 'Alle Schriften',
  's:Antonio': 'Antonio', 's:Instrument Sans': 'Instrument Sans', 's:DM Mono': 'DM Mono', 's:Cormorant Garamond': 'Cormorant Garamond', 's:Montserrat': 'Montserrat',
  farbe: 'Palette', webfarben: 'Website-Farben', abweichungen: 'Abweichungen', bausteine: 'Bausteine', bild: 'Bild', sprache: 'Sprache' };
const REIHE = Object.keys(TITEL);
const FOTO = { zeichen: 'studio', schutz: 'tafel', nie: 'zimmer', schrift: 'plan', farbe: 'speicherstadt', webfarben: 'haus', abweichungen: 'aussen', bausteine: 'bildschirm', bild: 'anleger', sprache: 'empfang' };
const ansichtName = a => TITEL[a] || '';
const fotoVon = a => WO.haus.fotos[FOTO[a] || (a.startsWith('s:') ? 'plan' : 'bar')];
const familie = n => (Z.a && Z.a.schriften || []).find(f => f.familie === n);

function abweichungen() {
  const A = Z.a; if (!A) return [];
  const liste = [];
  A.farben.abgleich.forEach(b => {
    if (!b.anzahl) liste.push({ hex: b.hex, text: b.hex + ' (' + b.rolle + ') steht im Branding, auf der Website aber nirgends.' + (b.nah ? ' Am nächsten kommt ' + b.nah.hex + '.' : '') });
    else if (b.anzahl <= 3) liste.push({ hex: b.hex, text: b.hex + ' (' + b.rolle.split(',')[0] + ') steht nur an ' + stellen(b.anzahl) + ' auf der Website.' });
  });
  A.farben.website.slice(0, 8).forEach(z => liste.push({ hex: z.hex, text: z.hex + (z.namen.length ? ' (' + z.namen.join(', ') + ')' : '') + ' steht ' + z.anzahl + ' Mal auf der Website, im Branding fehlt die Farbe.' }));
  return liste;
}

// ---------------------------------------------------------------- Kopf, Rand, Leiste
function kopf() {
  const k = $('#ws-kopf');
  k.innerHTML = WO.kopf({ werkzeug: W, unter: 'Marke', titel: ansichtName(Z.ansicht) || wname(W), stand: Z.a && Z.a.gespeichert ? 'Gespeicherter Stand' : Z.gelesen ? 'Gelesen ' + uhr(Z.gelesen) : 'Wird gelesen',
    pruefung: pruefLink(''), anleitung: 'anleitung.html', website: WO.haus.wege.website, marke: 'data-ws-marke', markeHref: '?ansicht=start' });
  const m = k.querySelector('[data-ws-marke]');
  if (m) m.addEventListener('click', ev => { ev.preventDefault(); if (Z.a) geh('start'); });
  const rk = k.querySelector('[data-wo-rand-knopf]'); if (rk) rk.setAttribute('aria-expanded', document.documentElement.classList.contains('wo-rand-auf') ? 'true' : 'false');
}
function rand() {
  const r = leere($('#ws-rand'));
  const nw = (a, zahl, extra) => ({ text: ansichtName(a), zahl: zahl || 0, an: Z.ansicht === a, attr: `data-ws-nav="${WO.esc(a)}"`, extra: extra ? `<em class="wo-rand__z">${WO.esc(extra)}</em>` : '' });
  const g = [{ eintraege: [nw('start')] },
    { titel: 'Das Zeichen', eintraege: [nw('zeichen'), nw('schutz'), nw('nie')] },
    { titel: 'Die Schrift', eintraege: [nw('schrift'), ...WEB.map(n => nw('s:' + n)), nw('s:Montserrat', 0, 'Dokumente')] },
    { titel: 'Die Farbe', eintraege: [nw('farbe'), nw('webfarben'), nw('abweichungen', abweichungen().length)] },
    { titel: 'Die Haltung', eintraege: [nw('bausteine'), nw('bild'), nw('sprache')] }];
  r.innerHTML = WO.rand(g, { website: WO.haus.wege.website, anleitung: 'anleitung.html', pruefung: pruefLink('') });
  r.querySelectorAll('button[data-ws-nav]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-ws-nav'))));
}
/* Stand: die zuletzt gespeicherten Kennzahlen. Weicht die Auslese davon ab, ist etwas offen (gelb), bis jemand speichert. */
const standName = () => !Z.stand ? '' : Z.stand.art === 'probe' ? 'Stand der Probedaten vom ' + datum(new Date(Z.stand.zeit)) : 'Stand vom ' + datum(new Date(Z.stand.zeit)) + ', ' + uhr(new Date(Z.stand.zeit));
const offen = () => Z.a && Z.stand ? unterschiede(Z.stand.kz, kennzahlen(Z.a)) : [];
function leiste() {
  const l = leere($('#ws-leiste')), A = Z.a;
  if (!A) return;
  const n = offen().length, gesp = !n && Z.gesp > Date.now();
  l.setAttribute('data-ws-offen', String(n));
  l.innerHTML = WO.leiste({
    titel: n ? mz(n, 'Unterschied', 'Unterschiede') + ' noch nicht gespeichert' : 'Nur zum Lesen',
    satz: n ? 'Die Website ist anders als im ' + standName() + '. Speichern merkt sich die neue Auslese.' :
      (A.gespeichert ? 'Gespeicherter Stand aus den Probedaten, der Server antwortet nicht.' : 'Frisch aus ' + mz(A.dateien.length, 'Stil-Datei', 'Stil-Dateien') + ' der Website gelesen, ' + uhr(Z.gelesen) + ', gleich wie der ' + standName() + '.') + ' Das Markenbuch ändert nichts an der Website.',
    knoepfe: WO.knopf('Neu lesen', 'verlauf', 'glas', { id: 'mb-neu', klein: true })
      + WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'ws-vgl', klein: true, disabled: !n })
      + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', n ? 'wartet' : gesp ? 'fertig' : 'glas', { id: 'ws-speichern', klein: true, attr: `data-ws-lage="${n ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` })
      + WO.knopf('Als PDF', 'pdf', 'gold', { id: 'mb-pdf', klein: true })
  });
  $('#ws-speichern').addEventListener('click', speichern);
  $('#ws-vgl').addEventListener('click', offenAnsehen);
  $('#mb-neu').addEventListener('click', neuLesen);
  $('#mb-pdf').addEventListener('click', alsPdf);
}
function allesNeu() { kopf(); rand(); leiste(); }
function offenAnsehen() {
  const z = offen();
  vergleichFenster('dem ' + standName(), 'der Auslese von ' + uhr(Z.gelesen), z, z.length ? [{ text: 'Speichern', haupt: true, zeichen: 'pfeil', tun: zu => { zu(); speichern(); } }] : []);
}
async function speichern() {
  const z = offen();
  if (!z.length) { melde('Nichts geändert, nichts gespeichert.', { mehr: 'Die Auslese ist gleich wie der ' + standName() + '. Logo, Schriften und Farben ändern sich in der Website und in den Grundlagen, nicht hier.' }); return; }
  if (Z.a.gespeichert || Z.stand.nurLesen) { fehler({ stichwort: 'verbindung', fehler: 'Ohne Server lässt sich nichts speichern.' }); return; }
  const vorName = 'dem ' + standName();
  let a;
  try { a = await ruf('POST', API('stand'), { kz: kennzahlen(Z.a) }); } catch (e) { return fehler(Object.assign({ stichwort: 'speichern' }, e)); }
  Z.stand = a.stand;
  Z.gesp = Date.now() + 2600;   // grün wie in der Vorlage, danach wieder grau
  setTimeout(leiste, 2700);
  allesNeu(); await zeichne({ halten: true });
  quittung('Gespeichert', z, () => vergleichFenster(vorName, 'dem neuen Stand', z), async k => {   // Rückgängig: der Stand vor diesem Speichern
    try { Z.stand = (await ruf('POST', API('stand_zurueck'), { vorher: a.vorher })).stand; } catch (e) { return fehler(Object.assign({ stichwort: 'speichern' }, e)); }
    k.remove(); Z.gesp = 0;
    allesNeu(); await zeichne({ halten: true });
    melde('Rückgängig gemacht', { mehr: 'Es gilt wieder der ' + standName() + '.' });
  });
}

async function neuLesen() {
  const vorher = Z.a, vorherZeit = Z.gelesen;
  let neu;
  try { neu = await ruf('GET', API('auslese')); } catch (e) { return fehler(e); }
  Z.a = neu; Z.gelesen = new Date();
  allesNeu(); await zeichne({ halten: true });
  const verschieden = unterschiede(kennzahlen(vorher), kennzahlen(neu));
  const z = verschieden;   // ohne Unterschied sagt die Quittung «Alles wie vorher.»
  const namen = ['der Auslese von ' + uhr(vorherZeit), 'der von ' + uhr(Z.gelesen)];
  quittung(verschieden.length ? 'Neu gelesen, die Website hat sich verändert' : 'Neu gelesen, nichts verändert', z,
    () => vergleichFenster(namen[0], namen[1], verschieden),
    async k => {   // Rückgängig: wieder die Auslese von vorher zeigen
      k.remove();
      Z.a = vorher; Z.gelesen = vorherZeit;
      allesNeu(); await zeichne({ halten: true });
      melde('Rückgängig gemacht', { mehr: 'Das Markenbuch zeigt wieder die Auslese von ' + uhr(vorherZeit) + '.' });
    });
}

// ---------------------------------------------------------------- Navigation und Titel
async function geh(ansicht, opt = {}) {
  if (!TITEL[ansicht]) ansicht = 'start';
  Z.ansicht = ansicht; Z.filter = ''; Z.rolle = 'alle';
  try { localStorage.setItem('mb-ort', ansicht); } catch (e) { /* ohne Merken */ }
  try { const q = new URLSearchParams(location.search); q.set('ansicht', ansicht); history.replaceState(null, '', '?' + q.toString()); } catch (e) { /* ohne Adresse */ }
  allesNeu();
  await zeichne(opt);
  if (!opt.halten) window.scrollTo(0, 0);
}
function titel(klein, a, b, satz, knoepfe, ansicht) {   // Startbild des Kleids: Übersicht «voll», jede andere Ansicht «buehne» mit ihrem Foto
  const an = ansicht || Z.ansicht;
  const h = el('div', { class: 'ws-titel ws-titel--wo', html: WO.startbild({ werkzeug: W, zier: WO.esc(klein), h1: WO.esc(a ? a + ' ' : '') + (b ? '<em>' + WO.esc(b) + '</em>' : ''), satz: satz ? WO.esc(satz) : '',
    knoepfe: knoepfe && knoepfe.length ? ' ' : '', art: an === 'start' ? 'voll' : 'buehne', foto: an === 'start' ? WO.haus.fotos[WO.haus.fotoJe[W]] : fotoVon(an) }) });
  const kn = h.querySelector('.wo-sb__kn'); if (kn) { kn.textContent = ''; kn.append(...knoepfe); }
  return h;
}
const karte = (kopfTitel, zahl, ...inhalt) => el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, kopfTitel), zahl ? mono(zahl) : null), ...inhalt);
const quelle = text => el('p', { class: 'mb-quelle' }, text);
const zeilen = liste => el('ul', { class: 'mb-linien' }, liste.map(t => el('li', {}, t)));

// ---------------------------------------------------------------- Übersicht
function bauStart() {
  const A = Z.a, ab = abweichungen(), F = WO.haus.fotos, E = WO.esc;
  const AUFG = [
    ['zeichen', 'Logo-Datei laden', 'Jede Fassung einzeln, so wie sie geliefert ist.', 'foto', 'studio'],
    ['farbe', 'Farbwert kopieren', 'Auf die Farbe klicken, der Wert liegt in der Zwischenablage.', 'kopie', 'speicherstadt'],
    ['schrift', 'Schriftmuster laden', 'Je Schrift eine Datei mit allen Proben.', 'blatt', 'plan'],
    ['nie', 'Was man nie tut', 'Die Regeln für das Logo auf einen Blick.', 'schild', 'tafel'],
    ['sprache', 'So schreiben wir', 'Ton, Ansprache und was wir vermeiden.', 'chat', 'empfang'],
    ['s:Antonio', 'Die Titelschrift', 'Antonio, so wie sie auf der Website steht.', 'stift', 'bildschirm'],
    ['pdf', 'Als PDF', 'Das ganze Markenbuch, Blatt für Blatt.', 'pdf', 'faehre']];
  const BER = [
    ['zeichen', 'Das Zeichen', mz(I.logos.length, 'Fassung', 'Fassungen'), 'Alle Logo-Dateien auf dunkel und hell, mit der Datei zum Laden.'],
    ['schutz', 'Schutzraum & Grösse', 'Vorschlag', 'Wie viel Luft das Zeichen braucht und wie klein es werden darf.'],
    ['nie', 'Was man nie tut', mz(I.nie.length, 'Regel', 'Regeln'), 'Was mit dem Logo nie geschieht.'],
    ['schrift', 'Die Schrift', '4 auf der Website, 1 für Dokumente', 'Antonio, Instrument Sans, DM Mono, Cormorant Garamond und Montserrat.'],
    ['farbe', 'Die Farbe', mz(A.farben.abgleich.length, 'Farbe', 'Farben') + ' im Branding', 'Die Palette mit dem Abgleich gegen die Website, Werte zum Kopieren.'],
    ['bausteine', 'Bausteine', mz(A.knoepfe.length, 'Knopf', 'Knöpfe') + ', ' + mz(A.masse.length, 'Mass', 'Masse'), 'Knöpfe, Abstände, Rundungen und Bewegung der Website.'],
    ['bild', 'Bild', mz(I.bild.length, 'Grundsatz', 'Grundsätze'), 'Warmes Licht im Dunkeln, echte Orte, niemand posiert.'],
    ['sprache', 'Sprache', 'Du, nicht Sie', 'Wie Tasty Studios schreibt und benennt.']];
  const kopfTitel = titel(wname(W) + ' · ' + WO.haus.name, WO.gruss(), 'Was suchst du heute?',
    'Der Arbeitsbereich zum Markenbuch: das Logo in allen Fassungen, die Schriften und Farben, so wie sie auf der Website wirklich stehen, dazu Bausteine, Bild und Sprache. Jeder Wert lässt sich kopieren, jede Datei laden.',
    [woA('Markenbuch lesen', 'buch', 'gold', 'index.html', { 'data-ws-buch': '1' }), woA('Anleitung', 'buch', 'glas', 'anleitung.html', { 'data-ws-anleitung': '1' }), el('a', { class: 'wo-kn', href: pruefLink(''), html: '<span>Prüfung</span><i>' + WO.ic('schild') + '</i>' })], 'start');
  const rest = el('div', { class: 'ws-wo-start', html:
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('welt')}</i><span class="wo-mk">Website</span><b>${offen().length ? 'Verändert' : A.gespeichert ? 'Gespeicherter Stand' : 'Frisch gelesen'}</b><p>${E(mz(A.dateien.length, 'Stil-Datei', 'Stil-Dateien') + ', ' + A.regeln + ' Regeln, ' + A.farben.gesamt + ' Farben.')}</p><a class="wo-lk" href="${E(WO.haus.wege.website)}" target="_blank" rel="noopener">Website öffnen</a></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('auge')}</i><span class="wo-mk">Abgleich</span><b>${ab.length ? E(mz(ab.length, 'Abweichung', 'Abweichungen')) : 'Alles gleich'}</b><p>Zwischen Branding und Website. Nur festgestellt, nichts angeglichen.</p><button class="wo-lk" type="button" data-gehe="abweichungen">Ansehen</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('foto')}</i><span class="wo-mk">Logo</span><b>${E(mz(I.logos.length, 'Fassung', 'Fassungen'))}</b><p>Vektor, Weiss, Emblem, Wasserzeichen, Metall und Raum.</p><button class="wo-lk" type="button" data-zip="1">Alle laden</button></div>
    </div>
    <h2 class="wo-zw">Häufig <em>gebraucht</em></h2>
    <div class="wo-aufg ws-aufgaben">${AUFG.map(([ziel, tt, s, z, f]) => `<button class="wo-ag ws-ag" type="button" data-gehe="${E(ziel)}"><span class="wo-ag__b"><img src="${E(F[f])}" alt="" loading="lazy" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(z)}</i><b>${E(tt)}</b><span>${E(s)}</span></span></button>`).join('')}</div>
    <h2 class="wo-zw">Das Markenbuch, <em>Blatt für Blatt</em></h2>
    <div class="wo-ber ws-bereiche">${BER.map(([k, n, zahl, s]) => `<button class="wo-bk ws-bk" type="button" title="${E(s)}" data-ws-bk="${E(k)}" data-gehe="${E(k)}"><span class="wo-bk__b"><img src="${E(fotoVon(k))}" alt="" loading="lazy" decoding="async"></span><span class="wo-bk__t"><b>${E(n)}</b><small>${E(zahl)}</small><span>${E(s)}</span></span><i class="wo-bk__p">${WO.ic('pfeil')}</i></button>`).join('')}</div>` });
  rest.querySelectorAll('[data-gehe]').forEach(b => b.addEventListener('click', () => b.getAttribute('data-gehe') === 'pdf' ? alsPdf() : geh(b.getAttribute('data-gehe'))));
  rest.querySelector('[data-zip]').addEventListener('click', ev => alleLogos(ev.currentTarget));
  return [kopfTitel, rest];
}

// ---------------------------------------------------------------- Das Zeichen: Fassungen, Schutzraum und Grösse, was man nie tut
function logoFlaeche(l, grund, gross) {
  const art = l[grund], src = I.logoPfad + encodeURIComponent(l.datei), g = gross ? ' mb-flaeche--gross' : '';
  if (!art) return el('div', { class: 'mb-flaeche mb-flaeche--leer' + g }, el('span', {}, 'nicht auf ' + (grund === 'dunkel' ? 'dunklem' : 'hellem') + ' Grund'));
  if (art === 'maske') return el('div', { class: 'mb-flaeche mb-flaeche--' + grund + g }, el('span', { class: 'mb-maske', style: `-webkit-mask-image:url('${src}');mask-image:url('${src}')`, role: 'img', 'aria-label': 'Zeichen hell auf Dunkel' }), el('small', {}, 'so setzt die Website es ein'));
  if (art === 'wasser') return el('div', { class: 'mb-flaeche mb-flaeche--papier' + g }, el('img', { class: 'mb-wasser', src, alt: 'Wasserzeichen mit 6 Prozent Deckkraft' }), el('small', {}, '6 Prozent Deckkraft, wie im Dokument'));
  if (art === 'ganz') return el('div', { class: 'mb-flaeche mb-flaeche--ganz' + g }, el('img', { src, alt: l.name }));
  return el('div', { class: 'mb-flaeche mb-flaeche--' + grund + g }, el('img', { src, alt: l.name }));
}
function logoFenster(l) {
  fenster(l.name, 'gross.', el('div', { class: 'ws-form', 'data-ws-form': 'logo' },
    el('p', { class: 'ws-klein' }, l.satz),
    el('div', { class: 'mb-fassung__bilder' }, logoFlaeche(l, 'dunkel', true), logoFlaeche(l, 'hell', true)),
    el('p', { class: 'ws-klein' }, mono(l.datei), ' · aus zentrale/oberflaeche/kleid/anker/, unverändert. Nie nachzeichnen oder verändern.')),
    [{ text: 'Schliessen' }, { text: 'Datei laden', haupt: true, zeichen: 'pfeil', tun: zu => { zu(); logoLaden(l); } }], { name: 'logo' });
}
function bauZeichen() {
  const k = karte('Fassungen', mz(I.logos.length, 'Datei', 'Dateien'));
  I.logos.forEach(l => {
    const b = el('button', { class: 'mb-fassung__bilder', type: 'button', 'aria-label': l.name + ' gross ansehen', 'data-mb-logo': l.datei, onclick: () => logoFenster(l) }, logoFlaeche(l, 'dunkel'), logoFlaeche(l, 'hell'));
    k.append(el('div', { class: 'mb-fassung' }, el('div', { class: 'mb-fassung__t' }, el('b', {}, l.name), el('p', {}, l.satz),
      el('div', { class: 'ws-reihe' }, link('Gross ansehen', () => logoFenster(l)), link(l.datei + ' laden', () => logoLaden(l), { 'data-mb-laden': l.datei }))), b));
  });
  return [titel('Das Zeichen', 'Sechs', 'Fassungen.', 'Kantiger Anker aus scharfen, facettierten Flächen, mit Raute als Ring und geteiltem Schaft. Reduziert, markant, technisch. Jede Fassung auf dunkel und hell, ein Klick zeigt sie gross.',
    [woKn('Alle Logo-Dateien laden', 'pfeil', 'gold', ev => alleLogos(ev.currentTarget), { attr: { 'data-zip': '1' } })]), k];
}
function bauSchutz() {
  const A = Z.a, t = I.logoPfad + 'anker.svg';
  const klein = (A.logo || []).filter(s => /px$/.test(s.breite)).map(s => parseFloat(s.breite));
  const min = klein.length ? Math.min(...klein) : 15;
  const maske = px => el('span', { class: 'mb-maske', style: (px ? 'width:' + px + 'px;' : '') + `-webkit-mask-image:url('${t}');mask-image:url('${t}')` });
  return [titel('Das Zeichen', 'Schutzraum', '& Grösse.', 'Wie viel Luft das Zeichen um sich braucht und wie klein es werden darf. Der Schutzraum ist ein Vorschlag, die Mindestgrösse kommt aus der Website.'),
    el('div', { class: 'mb-zwei' },
      karte('Schutzraum', 'Vorschlag', el('div', { class: 'mb-schutz' }, el('div', { class: 'mb-schutz__rahmen' }, maske(88))),
        el('p', {}, 'Rund um das Zeichen bleibt mindestens ein Viertel seiner Breite frei. Kein Text, keine Kante und kein anderes Bild rückt näher.'),
        quelle('Vorschlag: In den Grundlagen ist kein Schutzraum festgelegt. Robert entscheidet.')),
      karte('Mindestgrösse', min + ' px', el('div', { class: 'mb-mindest' }, [min, 24, 48].map(px => el('figure', {}, maske(px), el('figcaption', {}, px + ' px')))),
        el('p', {}, 'Kleiner als ' + min + ' Pixel breit wird das Zeichen nicht gesetzt. Das ist die kleinste Stelle auf der Website.'),
        quelle('Für Druck gibt es in den Grundlagen keine Angabe.'))),
    karte('Wo die Website das Zeichen setzt', mz((A.logo || []).length, 'Stelle', 'Stellen'),
      ...(A.logo || []).map(s => el('div', { class: 'ws-zl mb-zl' }, mono(s.datei), el('span', { class: 'mb-wert' }, s.selektor), el('span', { class: 'mb-wert mb-wert--r' }, s.breite))))];
}
function bauNie() {
  return [titel('Das Zeichen', 'Was man', 'nie tut.', 'Das Logo wird immer so verwendet, wie es geliefert ist. Diese Regeln gelten für jede Datei, jede Grösse und jeden Grund.'),
    karte('Nie', mz(I.nie.length, 'Regel', 'Regeln'), zeilen(I.nie), quelle('Quelle: ' + I.nieQuelle))];
}

// ---------------------------------------------------------------- Die Schrift
function stilCss(s, fam) {
  const g = s.groesse && !/cq|var\(/.test(s.groesse) ? 'min(' + s.groesse + ',64px)' : '';
  return "font-family:'" + fam + "'," + (fam === 'Cormorant Garamond' ? 'Georgia,serif' : fam === 'DM Mono' ? 'ui-monospace,monospace' : 'system-ui,sans-serif') + ';' + (g ? 'font-size:' + g + ';' : '') + (s.staerke ? 'font-weight:' + s.staerke + ';' : '') +
    (s.zeile ? 'line-height:' + s.zeile + ';' : '') + (s.abstand ? 'letter-spacing:' + s.abstand + ';' : '') +
    (s.versal ? 'text-transform:uppercase;' : '') + (s.kursiv ? 'font-style:italic;' : '');
}
function werte(s) {
  const w = ['Grösse ' + (s.groesse || 'geerbt')];
  if (s.staerke) w.push('Stärke ' + s.staerke);
  if (s.zeile) w.push('Zeile ' + s.zeile);
  if (s.abstand) w.push('Abstand ' + s.abstand);
  if (s.versal) w.push('Versalien');
  if (s.kursiv) w.push('kursiv');
  return w.join(' · ');
}
function cssText(s, fam) {
  return ["font-family: '" + fam + "';", s.groesse ? 'font-size: ' + s.groesse + ';' : '', s.staerke ? 'font-weight: ' + s.staerke + ';' : '', s.zeile ? 'line-height: ' + s.zeile + ';' : '',
    s.abstand ? 'letter-spacing: ' + s.abstand + ';' : '', s.versal ? 'text-transform: uppercase;' : '', s.kursiv ? 'font-style: italic;' : ''].filter(Boolean).join('\n');
}
function schriftKnoepfe(n) {
  const f = familie(n);
  return [
    f && f.datei ? woA('Schriftdatei laden', 'pfeil', 'gold', '/zentrale/grundlagen/marke/schriften/' + f.datei, { download: f.datei }) :
      woA('Bei Google Fonts', 'welt', 'gold', 'https://fonts.google.com/specimen/' + n.replace(/ /g, '+'), { target: '_blank', rel: 'noopener' }),
    woKn('Schriftmuster laden', 'blatt', 'glas', () => schriftmuster(n), { attr: { 'data-muster': n } })];
}
function bauSchriften() {
  const A = Z.a;
  const k = karte('Fünf Schriften', '4 Website · 1 Dokumente');
  WEB.concat(['Montserrat']).forEach(n => {
    const f = familie(n);
    k.append(el('button', { class: 'mb-schrift', type: 'button', 'data-gehe': 's:' + n, onclick: () => geh('s:' + n) },
      el('span', { class: 'mb-schrift__probe', style: "font-family:'" + n + "'," + (n === 'Cormorant Garamond' ? 'Georgia,serif' : 'system-ui,sans-serif') + ';' + PROBE_STIL[n] }, n),
      el('span', { class: 'mb-schrift__t' }, SCHRIFT_SATZ[n], el('small', {}, n === 'Montserrat' ? 'nicht auf der Website, nur in Dokumenten' : f ? stellen(f.anzahl) + ' auf der Website' : 'auf der Website nicht gefunden')),
      el('i', { class: 'wo-bk__p', html: WO.ic('pfeil') })));
  });
  const andere = (A.schriften || []).filter(f => WEB.indexOf(f.familie) < 0);
  return [titel('Die Schrift', 'Alle', 'Schriften.', 'Vier Schriften stehen auf der Website, eine fünfte gilt für Dokumente. Gezählt ist jede Stelle in den Stil-Dateien, an der eine Schrift gesetzt wird. Ein Klick öffnet ihr Blatt.'), k,
    andere.length ? karte('Vereinzelt gefunden', mz(andere.length, 'Schrift', 'Schriften'), zeilen(andere.map(f => el('span', {}, el('b', {}, f.familie), ' an ' + stellen(f.anzahl) + ', in ' + Object.keys(f.dateien).join(', ')))),
      quelle('Diese Schriften stehen nicht im Branding. Sie gehören meist zu einem gezeigten Beispiel-Haus.')) : null,
    karte('Haltung', 'Branding', zeilen(I.typo), quelle('Quelle: Branding.md, Typografie'))].filter(Boolean);
}
function probeFenster(s, n) {
  fenster(n, s.rolle + '.', el('div', { class: 'ws-form', 'data-ws-form': 'probe' },
    el('div', { class: 'mb-probe__gross' }, el('p', { style: stilCss(s, n) }, I.muster[s.rolle] || n)),
    el('p', { class: 'ws-klein' }, mono(werte(s))),
    el('pre', { class: 'mb-css' }, cssText(s, n)),
    el('div', {}, mono(mz(s.anzahl, 'Stelle', 'Stellen') + ' in den Stil-Dateien'), el('ul', { class: 'mb-linien mb-linien--klein' }, s.stellen.slice(0, 8).map(st => el('li', {}, st.selektor + ' ', el('span', { class: 'ws-leise' }, st.datei + (st.medien ? ' · ' + st.medien : ''))))),
      s.seiten.length ? el('p', { class: 'ws-klein' }, 'Zu sehen auf: ' + s.seiten.join(', ') + '.') : null)),
    [{ text: 'Schliessen' }, { text: 'CSS kopieren', haupt: true, zeichen: 'kopie', tun: zu => { zu(); kopiere(cssText(s, n), 'Die Werte von ' + n + ','); } }], { name: 'probe' });
}
/* Suchbeispiel aus den Stellen dieser Schrift: ein Selektor, eine Datei und eine Seite, die es wirklich gibt (jedes Beispiel findet etwas) */
function suchBeispiel(f) {
  const st = f.stile.filter(s => s.groesse), s0 = st[0] || f.stile[0], x = s0.stellen[0];
  const sel = (x.selektor.match(/[.#]?[a-z][\w-]*/i) || [x.selektor])[0];
  const datei = x.datei.split('/').pop();
  const seite = (st.find(s => s.seiten.length) || { seiten: [] }).seiten[0];
  return 'zum Beispiel ' + [sel, datei, seite].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
}
function bauSchrift(n) {
  const f = familie(n), teile = n.split(' ');
  const kopfTitel = titel('Die Schrift', teile.length > 1 ? teile[0] : '', (teile.length > 1 ? teile.slice(1).join(' ') : n) + '.', SCHRIFT_SATZ[n] + (f ? ' ' + (f.anzahl === 1 ? 'Eine Stelle' : f.anzahl + ' Stellen') + ' in ' + mz(Object.keys(f.dateien).length, 'Stil-Datei', 'Stil-Dateien') + ', Stärken ' + Object.keys(f.staerken).join(', ') + '.' : ''), schriftKnoepfe(n));
  if (!f) return [kopfTitel, el('p', { class: 'kuhle ws-leer' }, 'Auf der Website nicht gefunden.')];
  const ort = el('div', { class: 'mb-stapel' });
  const roll = ROLLEN.filter(r => f.stile.some(s => s.rolle === r && s.groesse));
  const such = el('input', { type: 'text', value: Z.filter, placeholder: suchBeispiel(f), autocomplete: 'off', id: 'ws-suche', 'aria-label': 'In den Stellen dieser Schrift suchen' });
  function baue() {
    leere(ort);
    const q = Z.filter.toLowerCase();
    let gefunden = 0;
    roll.forEach(r => {
      if (Z.rolle !== 'alle' && Z.rolle !== r) return;
      const stile = f.stile.filter(s => s.rolle === r && s.groesse && (!q || (s.stellen.map(x => x.selektor + ' ' + x.datei).join(' ') + ' ' + s.seiten.join(' ') + ' ' + werte(s)).toLowerCase().includes(q)));
      if (!stile.length) return;
      const summe = f.stile.filter(s => s.rolle === r).reduce((a, s) => a + s.anzahl, 0);
      const k = karte(r, summe === 1 ? '1 Stelle' : summe + ' Stellen');
      stile.slice(0, q ? 12 : 4).forEach(s => {
        gefunden++;
        const st = s.stellen[0];
        k.append(el('button', { class: 'mb-probe', type: 'button', 'data-mb-probe': r, onclick: () => probeFenster(s, n) },
          el('span', { class: 'mb-probe__text', style: stilCss(s, n) }, I.muster[r]),
          mono(werte(s)),
          el('span', { class: 'mb-probe__wo' }, st.selektor + ' in ' + st.datei + (s.seiten.length ? ', zu sehen auf: ' + s.seiten.slice(0, 3).join(', ') : '') + (s.anzahl > 1 ? ' · ' + s.anzahl + ' gleiche Stellen' : ''))));
      });
      ort.append(k);
    });
    if (!gefunden) ort.append(el('p', { class: 'kuhle ws-leer' }, 'Nichts gefunden.'));
  }
  such.addEventListener('input', () => { Z.filter = such.value; baue(); });
  baue();
  const alle = karte('Alle Fassungen', mz(f.stile.length, 'Fassung', 'Fassungen'), el('details', { class: 'mb-alle' }, el('summary', {}, 'Tabelle zeigen'),
    el('div', { class: 'mb-tabelle' }, el('table', {}, el('thead', {}, el('tr', {}, ['Rolle', 'Grösse', 'Stärke', 'Zeile', 'Abstand', 'Wo', 'Mal'].map(x => el('th', {}, x)))),
      el('tbody', {}, f.stile.map(s => el('tr', {}, el('td', {}, s.rolle), el('td', { class: 'ws-mono' }, s.groesse || 'geerbt'), el('td', { class: 'ws-mono' }, s.staerke), el('td', { class: 'ws-mono' }, s.zeile),
        el('td', { class: 'ws-mono' }, s.abstand + (s.versal ? ' Versal' : '')), el('td', {}, s.stellen[0].selektor + ' ', el('span', { class: 'ws-leise' }, s.stellen[0].datei)), el('td', { class: 'ws-mono' }, s.anzahl))))))));
  return [kopfTitel, el('div', { class: 'ws-mitte-reihe' },
    wahl2([{ wert: 'alle', text: 'Alle' }].concat(roll.map(r => ({ wert: r, text: r }))), Z.rolle, x => { Z.rolle = x; baue(); }, 'Rolle'),
    el('label', { class: 'ws-suche', style: 'margin:0;width:min(320px,100%)' }, el('span', { html: LUPE }), such)), ort, alle];
}
function bauMontserrat() {
  const M = I.montserrat, PX = 4 / 3;
  const zeile = z => {
    const st = "font-family:'Montserrat',system-ui,sans-serif;font-size:" + Math.round(z.pt * PX) + 'px;font-weight:' + z.staerke + ';line-height:1.15;color:#000;text-align:' + (z.mitte ? 'center' : 'left');
    const p = el('p', { style: st }, z.nummer ? el('span', { style: 'font-weight:500' }, z.nummer + ' ') : null, z.text, z.rest ? el('span', { style: 'font-size:' + Math.round(11 * PX) + 'px;font-weight:400' }, ' ' + z.rest) : null);
    return el('div', { class: 'mb-doc' }, p, el('span', { class: 'mb-doc__mass' + (z.mitte ? ' mb-doc__mass--mitte' : '') }, z.rolle + ' · ' + z.pt + ' pt · ' + z.staerke));
  };
  return [titel('Die Schrift', 'Montserrat', 'für Dokumente.', SCHRIFT_SATZ.Montserrat + ' Google Fonts, Schnitte 300, 400 und 500.', schriftKnoepfe('Montserrat')),
    karte('Schnitte', mz(M.schnitte.length, 'Schnitt', 'Schnitte'), ...M.schnitte.map(s => el('div', { class: 'mb-probe mb-probe--still' },
      el('span', { class: 'mb-probe__text', style: "font-family:'Montserrat',system-ui,sans-serif;font-weight:" + s.staerke + ';font-size:30px' }, 'Montserrat ' + s.name), mono('Stärke ' + s.staerke), el('span', { class: 'mb-probe__wo' }, s.wofuer)))),
    el('div', { class: 'mb-zwei' }, karte('Vertrag', 'Probe', el('div', { class: 'mb-papier' }, M.vertrag.map(zeile))), karte('Fachdokument', 'Probe', el('div', { class: 'mb-papier' }, M.fach.map(zeile)))),
    karte('Regeln', mz(M.regeln.length, 'Regel', 'Regeln'), zeilen(M.regeln), quelle('Quelle: ' + M.quelle + '. Die Proben sind in Pixel umgerechnet (1 pt = 1,33 px).'))];
}

/* Schriftmuster: eine einzelne HTML-Datei, die die Schrift mitbringt (eigene Dateien eingebettet, Google-Schriften verlinkt). Aus der ersten Fassung. */
function schriftmuster(n) {
  const f = familie(n), eigen = f && f.datei;
  let proben = [];
  if (n === 'Montserrat') proben = I.montserrat.schnitte.map(s => ({ css: 'font-weight:' + s.staerke + ';font-size:40px', werte: s.name + ' · ' + s.staerke, text: 'Montserrat ' + s.name }));
  else if (f) ROLLEN.forEach(r => f.stile.filter(s => s.rolle === r && s.groesse).slice(0, 2).forEach(s => proben.push({ css: stilCss(s, n), werte: r + ' · ' + werte(s), text: I.muster[r] })));
  const schnitt = n === 'Montserrat' ? 'Montserrat:wght@300;400;500' : 'Cormorant+Garamond:wght@500;600';
  const esc = WO.esc;
  const fertig = fontCss => {
    const html = '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Schriftmuster ' + esc(n) + ' · Tasty Studios</title>' + fontCss +
      '<style>body{margin:0;padding:56px;background:#111421;color:#f3ece2;font-family:\'' + n + '\',sans-serif}h1{font-size:96px;margin:0 0 8px;font-weight:' + (n === 'Antonio' ? 700 : 500) + '}' +
      '.z{border-top:1px solid rgba(243,236,226,.14);padding:24px 0}.w{font:13px/1.4 ui-monospace,monospace;color:rgba(243,236,226,.6);margin-top:8px}p{margin:0}' +
      '.abc{font-size:28px;line-height:1.4;margin:24px 0 32px;word-break:break-word}</style></head><body><h1>' + esc(n) + '</h1>' +
      '<p class="w">Schriftmuster aus dem Markenbuch von Tasty Studios, ' + datum(new Date()) + '</p>' +
      '<p class="abc">ABCDEFGHIJKLMNOPQRSTUVWXYZ ÄÖÜ<br>abcdefghijklmnopqrstuvwxyz äöüß<br>0123456789 · «» ? ! &amp; @ €</p>' +
      proben.map(p => '<div class="z"><p style="' + p.css.replace(/"/g, "'") + '">' + esc(p.text) + '</p><p class="w">' + esc(p.werte) + '</p></div>').join('') + '</body></html>';
    speichereBlob(new Blob([html], { type: 'text/html' }), 'schriftmuster-' + kurzName(n) + '.html');
    quit('Geladen', 'Schriftmuster ' + n + ' als ' + anf('schriftmuster-' + kurzName(n) + '.html') + ', mit ' + mz(proben.length, 'Probe', 'Proben') + '.', [], { 'data-ws-geladen': 'muster' });
  };
  if (eigen) {
    fetch('/zentrale/grundlagen/marke/schriften/' + f.datei).then(r => { if (!r.ok) throw 0; return r.blob(); }).then(b => {
      const fr = new FileReader();
      fr.onload = () => fertig("<style>@font-face{font-family:'" + n + "';src:url(" + fr.result + ") format('woff2');font-weight:100 900}</style>");
      fr.readAsDataURL(b);
    }).catch(() => fehler({ stichwort: 'schrift', fehler: 'Die Schriftdatei ' + anf(f.datei) + ' liess sich nicht lesen.' }));
  } else fertig('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' + schnitt + '&display=block">');
}

// ---------------------------------------------------------------- Die Farbe
function farbFenster(hex, titel_, mehr) {
  fenster('Die Farbe', hex + '.', el('div', { class: 'ws-form', 'data-ws-form': 'farbe' },
    el('p', { class: 'ws-klein' }, el('b', {}, titel_)),
    el('div', { class: 'mb-farbe__gross', style: 'background:' + hex + ';color:' + (hell(hex) ? '#111421' : '#f3ece2') }, mono(hex)),
    el('dl', { class: 'mb-werte' }, [['Hex', hex], ['RGB', rgb(hex)]].map(([a, b]) => [el('dt', {}, a), el('dd', {}, el('button', { class: 'ws-link', type: 'button', onclick: () => kopiere(b, a) }, b))])),
    mehr), [{ text: 'Schliessen' }, { text: 'Wert kopieren', haupt: true, zeichen: 'kopie', tun: zu => { zu(); kopiere(hex, 'Die Farbe'); } }], { name: 'farbe' });
}
function farbFeld(hex, titel_, unter, mehr) {
  return el('div', { class: 'mb-farbe', 'data-mb-farbe': hex },
    el('button', { class: 'mb-farbe__flaeche', type: 'button', style: 'background:' + hex + ';color:' + (hell(hex) ? '#111421' : '#f3ece2'), 'aria-label': hex + ' kopieren', onclick: () => kopiere(hex, 'Die Farbe') }, mono(hex), el('small', {}, 'kopieren')),
    el('div', { class: 'mb-farbe__t' }, el('b', {}, titel_), el('span', {}, unter), link('Mehr', () => farbFenster(hex, titel_, mehr), { 'data-mb-mehr': hex })));
}
function bauFarbe() {
  const A = Z.a;
  const ort = el('div', { class: 'mb-farben' });
  const k = karte('Palette laut Branding', mz(A.farben.abgleich.length, 'Farbe', 'Farben'), ort, quelle('Quelle: Branding.md, verbindliche Palette vom 16.06.2026. Gezählt sind deckende und durchscheinende Stellen.'));
  const baue = () => {
    leere(ort);
    A.farben.abgleich.filter(b => Z.farbArt === 'alle' || b.gruppe === Z.farbArt).forEach(b => {
      const auf = b.anzahl ? 'auf der Website an ' + stellen(b.anzahl) + (b.namen.length ? ', als ' + b.namen.join(', ') : '') : 'auf der Website nicht gefunden';
      ort.append(farbFeld(b.hex, b.rolle, b.gruppe + ' · ' + auf, el('div', {}, el('p', { class: 'ws-klein' }, b.gruppe + '. ' + auf.charAt(0).toUpperCase() + auf.slice(1) + '.'),
        b.nah && b.anzahl <= 3 ? el('p', { class: 'ws-klein' }, 'Ähnlich auf der Website: ' + b.nah.hex + ' an ' + stellen(b.nah.anzahl) + (b.nah.namen.length ? ' (' + b.nah.namen.join(', ') + ')' : '') + '.') : null)));
    });
  };
  baue();
  const gruppen = [...new Set(A.farben.abgleich.map(b => b.gruppe))];
  return [titel('Die Farbe', 'Die', 'Palette.', 'Dunkle, ruhige Flächen, Weiss und warme Akzente. Rot nur als Punkt, nie als Fläche. Ein Klick auf eine Farbe kopiert ihren Wert, «Mehr» zeigt, wo sie auf der Website steht.'),
    el('div', { class: 'ws-mitte-reihe' }, wahl2([{ wert: 'alle', text: 'Alle' }].concat(gruppen.map(g => ({ wert: g, text: g }))), Z.farbArt, x => { Z.farbArt = x; baue(); }, 'Gruppe')), k];
}
function bauWebfarben() {
  const A = Z.a;
  const ort = el('div', { class: 'mb-farben' });
  const such = el('input', { type: 'text', value: Z.filter, placeholder: 'zum Beispiel #c7b489, --gold, main.css', autocomplete: 'off', id: 'ws-suche', 'aria-label': 'In den Farben der Website suchen' });
  const k = karte('Auf der Website, nicht im Branding', 'häufigste zuerst', ort);
  const baue = () => {
    leere(ort);
    const q = Z.filter.toLowerCase();
    const zz = A.farben.website.filter(z => !q || (z.hex + ' ' + z.namen.join(' ') + ' ' + Object.keys(z.dateien).join(' ')).toLowerCase().includes(q));
    zz.forEach(z => ort.append(farbFeld(z.hex, z.namen.length ? z.namen.join(', ') : 'ohne Namen', stellen(z.anzahl) + ' · ' + Object.keys(z.dateien).slice(0, 3).join(', '),
      el('ul', { class: 'mb-linien mb-linien--klein' }, Object.entries(z.dateien).map(([d, n]) => el('li', {}, d + ' ', el('span', { class: 'ws-leise' }, '· ' + stellen(n))))))));
    if (!zz.length) ort.append(el('p', { class: 'kuhle ws-leer' }, 'Nichts gefunden.'));
  };
  such.addEventListener('input', () => { Z.filter = such.value; baue(); });
  baue();
  return [titel('Die Farbe', 'Website-', 'Farben.', 'Farben, die in den Stil-Dateien der Website stehen, im Branding aber fehlen. Vieles davon gehört zu den gezeigten Beispiel-Häusern. ' + A.farben.gesamt + ' verschiedene Farben an ' + A.farben.vorkommen + ' Stellen.'),
    el('div', { class: 'ws-mitte-reihe' }, el('label', { class: 'ws-suche', style: 'margin:0;width:min(420px,100%)' }, el('span', { html: LUPE }), such)), k];
}
function bauAbweichungen() {
  const ab = abweichungen();
  return [titel('Die Farbe', 'Abweichungen', 'zum Branding.', 'Wo Branding und Website nicht dasselbe sagen. Nur festgestellt, nichts angeglichen: was gilt, entscheidet Robert.'),
    karte('Branding und Website', mz(ab.length, 'Abweichung', 'Abweichungen'), ...ab.map(x => el('div', { class: 'ws-zl mb-zl mb-zl--ab' },
      el('span', { class: 'mb-muster', style: 'background:' + x.hex, 'aria-hidden': 'true' }), el('span', { class: 'mb-wert' }, x.text), link('Kopieren', () => kopiere(x.hex, 'Die Farbe')))),
      quelle('Insgesamt ' + Z.a.farben.gesamt + ' verschiedene Farben an ' + Z.a.farben.vorkommen + ' Stellen.'))];
}

// ---------------------------------------------------------------- Die Haltung: Bausteine, Bild, Sprache
function bauBausteine() {
  const A = Z.a;
  const kk = karte('Knöpfe', mz(A.knoepfe.length, 'Knopf', 'Knöpfe'), el('div', { class: 'mb-knoepfe' }, A.knoepfe.map(k => {
    let st = Object.keys(k.stil).filter(p => !/cq/.test(k.stil[p])).map(p => p + ':' + k.stil[p]).join(';');
    const bg = (k.stil.background || k.stil['background-color'] || '').match(/#[0-9a-f]{6}/i);
    const grund = bg && hell(bg[0]) ? 'dunkel' : 'hell';
    if (!k.stil.color) st += ';color:' + (bg && hell(bg[0]) ? '#111421' : '#f3ece2');
    return el('div', { class: 'mb-knopf' }, el('div', { class: 'mb-flaeche mb-flaeche--' + grund + ' mb-flaeche--knopf' }, el('span', { class: 'mb-webknopf', style: st }, k.text || 'Knopf')),
      mono(k.selektor), el('span', { class: 'mb-probe__wo' }, k.datei + (k.seiten.length ? ' · ' + k.seiten.slice(0, 2).join(', ') : '')));
  })), quelle('Knöpfe der Agentur-Seite und der darin gezeigten Beispiel-Häuser. Beschriftung aus der Seite; wo keine steht, heisst die Probe «Knopf».'));
  const km = karte('Masse', mz(A.masse.length, 'Wert', 'Werte'), el('div', { class: 'mb-masse' }, A.masse.map(m => {
    let bild = null;
    if (/^--r-/.test(m.name)) bild = el('span', { class: 'mb-rund', style: 'border-radius:' + m.wert });
    else if (/^--(e\d|feder)/.test(m.name)) bild = el('span', { class: 'mb-bahn' }, el('span', { class: 'mb-bahn__p', style: 'transition-timing-function:' + m.wert }));
    return el('div', { class: 'mb-mass' }, bild, el('div', {}, el('b', {}, m.was), el('button', { class: 'ws-link mb-mass__wert', type: 'button', onclick: () => kopiere(m.wert, m.was) }, m.wert), mono(m.name)));
  })), quelle('Aus assets/css/main.css. Ein Klick auf den Wert kopiert ihn; die Bewegungen laufen beim Darüberfahren.'));
  return [titel('Die Haltung', 'Die', 'Bausteine.', 'Knöpfe, Abstände, Rundungen und Bewegung, wie sie in den Stil-Dateien der Website stehen.'), kk, km,
    karte('Aufbau', 'Branding', el('dl', { class: 'mb-woerter' }, I.layout.map(l => [el('dt', {}, l.wort), el('dd', {}, l.satz)])), quelle('Quelle: Branding.md, Layout-Prinzipien'))];
}
function bauBild() {
  return [titel('Die Haltung', 'Das', 'Bild.', 'Warmes Licht im Dunkeln, echte Orte, Menschen, die nicht posieren. Die Bildsprache ist die Schicht unter der Gestaltung und ändert die Farben und das Logo nicht.'),
    karte('Bildsprache', mz(I.bild.length, 'Grundsatz', 'Grundsätze'), el('dl', { class: 'mb-woerter' }, I.bild.map(b => [el('dt', {}, b.wort), el('dd', {}, b.satz)])), quelle('Quelle: ' + I.bildQuelle))];
}
function bauSprache() {
  const S = I.sprache;
  return [titel('Die Haltung', 'Die', 'Sprache.', S.grundton),
    el('div', { class: 'mb-zwei' }, karte('Ansprache', '', el('p', { class: 'mb-satz' }, S.ansprache)), karte('Prinzip', '', el('p', { class: 'mb-satz' }, S.prinzip))),
    karte('Was wir vermeiden', mz(S.vermeiden.length, 'Punkt', 'Punkte'), zeilen(S.vermeiden)),
    karte('Wie wir benennen', mz(S.benennung.length, 'Regel', 'Regeln'), zeilen(S.benennung), el('p', { class: 'ws-klein' }, 'Nie im Namen: ' + S.verboten + '.'), quelle('Quelle: ' + S.quelle))];
}

// ---------------------------------------------------------------- Zeichnen, PDF und Start
function bau(a) {
  if (a === 'start') return bauStart();
  if (a === 'zeichen') return bauZeichen();
  if (a === 'schutz') return bauSchutz();
  if (a === 'nie') return bauNie();
  if (a === 'schrift') return bauSchriften();
  if (a === 's:Montserrat') return bauMontserrat();
  if (a.startsWith('s:')) return bauSchrift(a.slice(2));
  if (a === 'farbe') return bauFarbe();
  if (a === 'webfarben') return bauWebfarben();
  if (a === 'abweichungen') return bauAbweichungen();
  if (a === 'bausteine') return bauBausteine();
  if (a === 'bild') return bauBild();
  if (a === 'sprache') return bauSprache();
  return bauStart();
}
async function zeichne(opt = {}) {
  const a = Z.ansicht, m = $('#ws-mitte'), oben = window.scrollY;
  m.removeAttribute('data-ws-bereit');
  m.setAttribute('data-ws-ansicht', a);
  try { leere(m).append(...bau(a)); } catch (e) { fehler(e); }   // ein Fehler beim Zeichnen steht auf der Seite, nie nur in der Konsole
  if (opt.halten) window.scrollTo(0, oben);
  m.setAttribute('data-ws-bereit', a);
}
/* Als PDF: alle Blätter untereinander in einen eigenen Teil der Seite, dann der Druckdialog des Browsers («Als PDF sichern»). Nichts wird verschickt.
   Jedes Blatt kommt auf genau eine A4-Seite: es wird vorher in einem unsichtbaren Rahmen von Seitenbreite (186 mm, dieselben Breiten-Regeln wie im Druck)
   ausgemessen und mit zoom so weit verkleinert, dass es in die Seitenhöhe (273 mm) passt. */
const SEITE = { breite: '186mm', hoehe: 273 * 96 / 25.4 - 14 };   // Höhe in px, mit etwas Luft gegen Rundung
async function einpassen(d) {
  const rahmen = el('iframe', { 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;left:-10000px;top:0;width:' + SEITE.breite + ';height:1200px;border:0;visibility:hidden' });
  document.body.append(rahmen);
  try {
    const stile = $$('link[rel="stylesheet"],style', document.head).map(s => s.outerHTML).join('');
    const doc = rahmen.contentDocument;
    doc.open();
    doc.write('<!doctype html><html lang="de" class="mb-drucken"><head><meta charset="utf-8"><base href="' + WO.esc(location.href) + '">' + stile +
      '</head><body class="ws wo-app" style="margin:0;padding:0;background:#f5eee6"><div class="mb-druck" style="display:block">' + d.innerHTML + '</div></body></html>');
    doc.close();
    await new Promise(ok => { if (doc.readyState === 'complete') ok(); else rahmen.addEventListener('load', ok, { once: true }); setTimeout(ok, 3000); });
    try { await Promise.race([doc.fonts.ready, new Promise(ok => setTimeout(ok, 1500))]); } catch (e) { /* ohne Schrift-Warten */ }
    await Promise.race([Promise.all([...doc.images].map(i => i.decode ? i.decode().catch(() => {}) : null)), new Promise(ok => setTimeout(ok, 1500))]);
    const echt = $$('.mb-druck__blatt', d);
    [...doc.querySelectorAll('.mb-druck__blatt')].forEach((b, i) => {
      let z = 1;
      while (z > 0.3 && b.getBoundingClientRect().height > SEITE.hoehe) { z = Math.round((z - 0.02) * 100) / 100; b.style.zoom = z; }
      if (z < 1 && echt[i]) { echt[i].style.zoom = z; echt[i].setAttribute('data-mb-zoom', z); }
    });
  } finally { rahmen.remove(); }
}
async function alsPdf() {
  const d = leere($('#mb-druck')), merk = { rolle: Z.rolle, filter: Z.filter, farbArt: Z.farbArt, ansicht: Z.ansicht };
  Z.rolle = 'alle'; Z.filter = ''; Z.farbArt = 'alle';
  REIHE.forEach(a => {
    Z.ansicht = a;
    try { d.append(el('section', { class: 'mb-druck__blatt', 'data-mb-blatt': a }, ...bau(a))); } catch (e) { merke('PDF: ' + a + ': ' + (e.message || e), 'pdf'); }
  });
  Object.assign(Z, merk);
  $$('img', d).forEach(i => i.removeAttribute('loading'));   // im Druck sofort alle Bilder, nicht erst beim Scrollen
  try { await einpassen(d); } catch (e) { merke('PDF einpassen: ' + (e.message || e), 'pdf'); }
  document.documentElement.classList.add('mb-drucken');
  const fertig = () => { document.documentElement.classList.remove('mb-drucken'); leere(d); window.removeEventListener('afterprint', fertig); };
  window.addEventListener('afterprint', fertig);
  const bilder = $$('img', d).map(i => i.decode ? i.decode().catch(() => {}) : null);
  await Promise.race([Promise.all(bilder), new Promise(ok => setTimeout(ok, 1500))]);
  quit('Als PDF', 'Im Druckdialog «Als PDF sichern» wählen. ' + REIHE.length + ' Blätter, jedes auf genau einer Seite.', [], { 'data-ws-geladen': 'pdf' });
  window.print();
}
function startFehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke('Start: ' + text, e && e.stichwort);
  $('#ws-rand').hidden = true;
  $('#ws-kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Marke', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: pruefLink(e && e.stichwort), website: WO.haus.wege.website });
  $('#ws-leiste').innerHTML = WO.leiste({ titel: 'Das Werkzeug startet nicht', satz: 'Nichts ist verloren: das Markenbuch liest nur, die Website und die Grundlagen sind unberührt.', knoepfe: WO.knopf('Speichern', 'pfeil', 'glas', { klein: true, disabled: true }) });
  leere($('#ws-mitte')).append(el('div', { class: 'platte ws-karte ws-form', style: 'max-width:640px;margin-top:40px', 'data-ws-startfehler': (e && e.stichwort) || 'unerwartet' },
    mono('Das Werkzeug startet nicht'), el('h2', {}, text),
    el('p', {}, 'Die Prüfung läuft unabhängig vom Werkzeug und sagt, woran es liegt.'),
    el('div', { class: 'ws-reihe' }, woA('Prüfung öffnen', 'schild', 'dunkel', pruefLink(e && e.stichwort)), taste('Noch einmal versuchen', () => location.reload()))));
}
async function standLaden() {
  try { return await ruf('GET', API('stand')); } catch (e) {
    const r = await fetch('probedaten/stand.json', { cache: 'no-store' }).catch(() => null);   // ohne Server: der Stand der Probedaten, nur zum Ansehen
    if (!r || !r.ok) return null;
    const d = await r.json(); d.art = 'probe'; d.nurLesen = true; return d;
  }
}
async function laden() {
  try { return await ruf('GET', API('auslese')); } catch (e) {
    merke('Auslese: ' + ((e && e.fehler) || e), 'verbindung');
    const r = await fetch('probedaten/auslese.json', { cache: 'no-store' }).catch(() => null);   // ohne Server: der gespeicherte Stand
    if (!r || !r.ok) throw e;
    const d = await r.json(); d.gespeichert = true; return d;
  }
}
async function start() {
  window.addEventListener('error', ev => merke(ev.message || 'Fehler im Werkzeug', 'unerwartet'));
  window.addEventListener('unhandledrejection', ev => merke((ev.reason && (ev.reason.fehler || ev.reason.message)) || 'Fehler im Werkzeug', (ev.reason && ev.reason.stichwort) || 'unerwartet'));
  document.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's' && Z.a) { ev.preventDefault(); speichern(); } });
  try {
    Z.a = await laden();
    Z.gelesen = new Date();
    Z.stand = await standLaden();
    const q = new URLSearchParams(location.search);
    let a = q.get('ansicht') || (location.hash && TITEL[decodeURIComponent(location.hash.slice(1))] ? decodeURIComponent(location.hash.slice(1)) : '');
    if (!a) { try { a = localStorage.getItem('mb-ort') || ''; } catch (e) { /* ohne Merken */ } }   // dort weitermachen, wo man zuletzt war
    if (a && TITEL[a]) Z.ansicht = a;
    allesNeu();
    await zeichne({});
    if (Z.a.gespeichert) melde('Gespeicherter Stand', { mehr: 'Der Server antwortet nicht. Gezeigt wird die Auslese aus den Probedaten.', stichwort: 'verbindung' });
    else if (Z.a.hinweis) { merke(Z.a.hinweis, 'auslese'); melde('Gespeicherter Stand', { mehr: Z.a.hinweis, stichwort: 'auslese' }); }
  } catch (e) { startFehler(e); }
}
window.MB = { geh, ansichten: REIHE, alsPdf };   // für Rundgang und Prüflauf
start();
})();
