/* blatt.js · Startblatt des Feinschliffs in der Zentrale von Tasty Studios. Umgebaut aus website.js von Le Bureau (Culinarium-Werkzeuge,
   vorlage/culinarium-demo/werkzeuge/bureau/werkzeuge/website/website.js): gleicher Aufbau und Ablauf (Übersicht, die Seite Bereich für Bereich mit
   Stellen links und Seite rechts, Vorher/nachher, frühere Stände), gleiche Bausteine (Quittung, Fenster, Leiste, Auswahl, Wahl), Kleid aus
   zentrale/oberflaeche/ (kleid/tasty). Inhalt aus auftraege/01-feinschliff.md: Annas Änderungen und Wünsche zur Agentur-Seite, die der Dienst als
   Liste hält (daten/01-feinschliff/, gelesen und geschrieben über api.py mit denselben Regeln wie der Dienst).

   Nichts speichert still: Eingaben (Status, Antwort, «übernommen») warten in Z.offen (die Leiste unten zählt sie, Speichern gelb), «Speichern»
   schreibt sie und antwortet mit einer Quittung (vorher, nachher, «Rückgängig»). Zurücknehmen und Entfernen fragen vorher im Fenster nach.
   Fehler landen zusätzlich im Browser (localStorage «ws-fehler»), dort liest sie die Prüfseite (pruefung.html). */
(() => {
'use strict';
const W = '01-feinschliff';
const API = '/zentrale/api/' + W + '/';
const A = (sie, du) => du;   // Tasty Studios duzt sich (WO_HAUS.anrede = 'du'), wie Culinarium
const wname = k => (WO.haus && WO.haus.namen && WO.haus.namen[k]) || WO.name(k);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';
const LUPE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>';
const WINKEL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
const H = window.WO_HAUS || {};
const FOTO = k => (H.fotos || {})[k] || H.foto;
/* Die Seiten der Agentur-Seite (seite/), wie im ersten Startblatt; je ein Foto der Agentur-Seite und ein Satz, was dort steht */
const SEITEN = [
  { datei: 'index.html', name: 'Startseite', foto: 'aussen', satz: 'Der Auftakt mit dem Satz über Hospitality, die vier Teile, Arbeiten und der Weg zum Gespräch.' },
  { datei: 'team.html', name: 'Team', foto: 'tafel', satz: 'Robert und Anna, wie sie arbeiten und mit wem.' },
  { datei: 'studio.html', name: 'Studio', foto: 'studio', satz: 'Das Studio in Hamburg, was es baut und wie ein Projekt abläuft.' },
  { datei: 'work.html', name: 'Arbeiten', foto: 'bildschirm', satz: 'Die Häuser, für die Tasty Studios gebaut hat, mit Bild und Satz.' },
  { datei: 'werkzeuge.html', name: 'Werkzeuge', foto: 'plan', satz: 'Die Werkzeuge, mit denen die Häuser ihre Website selbst führen.' },
  { datei: 'contact.html', name: 'Kontakt', foto: 'empfang', satz: 'Gespräch anfragen, Adresse und der Weg ins Studio.' },
  { datei: 'legal.html', name: 'Impressum', foto: 'haus', satz: 'Impressum und Datenschutz im Wortlaut.' }
];
const seiteVon = d => SEITEN.find(s => s.datei === d);
const ART = { text: 'Wörter', stil: 'Schrift', abstand: 'Abstand', reihenfolge: 'Reihenfolge' };
const STATUS = [{ wert: 'offen', text: 'Offen' }, { wert: 'besprochen', text: 'Besprochen' }, { wert: 'erledigt', text: 'Erledigt' }];

const Z = { d: null, ansicht: 'start', breite: 'rechner', offen: {}, vs: [], zl: 0, lauf: 0, gesp: 0, filter: 'offen', vgl: { seite: '', sicht: 'nachher' }, wahl: null };

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
const kurz = (t, n = 90) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
function ausschnitt(a, b, n) {   // vorher und nachher gekürzt, aber immer um die Stelle herum, die sich unterscheidet (wie in werkzeug/feinschliff.js)
  a = String(a || '').replace(/\s+/g, ' ').trim(); b = String(b || '').replace(/\s+/g, ' ').trim();
  if (a.length <= n && b.length <= n) return [a, b];
  let p = 0; const m = Math.min(a.length, b.length);
  while (p < m && a[p] === b[p]) p++;
  const w = a.lastIndexOf(' ', p - 1); p = w < 0 ? 0 : w + 1;
  let start = p - Math.min(p, 20);
  const w2 = a.indexOf(' ', start); if (start > 0 && w2 >= 0 && w2 < p) start = w2 + 1;
  const stueck = t => {
    let ende = Math.min(t.length, start + n - (start > 0 ? 1 : 0));
    if (ende < t.length) { const l = t.lastIndexOf(' ', ende - 1); if (l > start + n / 2) ende = l; }
    return (start > 0 ? '…' : '') + t.slice(start, ende).trim() + (ende < t.length ? '…' : '');
  };
  return [stueck(a), stueck(b)];
}
const anf = t => '«' + t + '»';
const schmal = () => window.innerWidth < 1180;
function zeit(iso) { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(iso || ''); if (!m) return iso || ''; const d = new Date(iso); return isNaN(d) ? `${m[3]}.${m[2]}.${m[1]}, ${m[4]}:${m[5]} Uhr` : d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ',') + ' Uhr'; }
const tag = iso => zeit(iso).split(',')[0];
const wer = () => H.wer || 'Robert';
const robert = () => wer() === 'Robert';
const doc = () => (Z.d && Z.d.doc) || { aenderungen: [], wuensche: [] };
const seiteName = s => (Z.d && Z.d.seiten && Z.d.seiten[s]) || (seiteVon(s) || {}).name || s;
const aend = () => doc().aenderungen.filter(a => a.status !== 'übernommen');      // warten auf Übernahme in die Quelle
const wue = () => doc().wuensche.filter(w => w.status !== 'erledigt');            // offen oder besprochen
const aufSeite = (l, d) => l.filter(x => x.seite === d);
function schluessel(w) { const s = ((Z.d && Z.d.schluessel) || []).find(x => x.wer === (w || wer())); return s ? s.schluessel : ''; }
const laeuft = () => !!(Z.d && Z.d.laeuft && Z.d.laeuft.seite);
/* Die Seite mit Annas Änderungen (Prüfstand, Port 8980, mit Schlüssel). Läuft der Prüfstand nicht, sagt die Vorschau das, statt eine halbe Seite zu zeigen. */
function seiteAdresse(datei, w) {
  if (window.FSB && FSB.lage()) return FSB.liveAdresse(datei || 'index.html');   // seit 17.11.2026: die Website selbst (oder ihre Probe-Kopie)
  const k = schluessel(w);
  // Mit «fs-modus=text»: die Seite startet gleich im Modus «Wörter», ein Klick auf einen Text bearbeitet ihn (Robert 08.11.2026: «das reagiert nicht»)
  return 'http://localhost:8980/' + (datei === 'index.html' ? '' : datei) + (k ? '?feinschliff=' + encodeURIComponent(k) + '&fs-modus=text' : '');
}

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
    const vorab = methode === 'GET' && !daten && window.__vorab && window.__vorab[weg]; if (vorab) delete window.__vorab[weg];
    r = await (vorab || fetch(weg, { method: methode, headers: daten ? { 'Content-Type': 'application/json' } : {}, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' }));
    try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  } catch (e) { throw { stichwort: 'keine-verbindung', fehler: 'Die Zentrale antwortet nicht.' }; } finally { zaehle(-1); }
  if (!r.ok || j == null) throw Object.assign({ status: r.status, stichwort: 'unerwartet', fehler: 'Unerwartete Antwort der Zentrale (' + r.status + ').' }, j || {});
  return j;
}

// ---------------------------------------------------------------- Meldung, Quittung, Fenster
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
function quittung(titel, zeilen, vorherDaten) {
  const z = zeilen[0];
  const wert = (t, q) => el('span', { 'data-ws-q': q }, kurz(t, 170) || 'nichts');
  const text = el('span', {}, z.was + (z.wo ? ' · ' + z.wo : '') + ': «', wert(z.vorher, 'vorher'), '» wird «', wert(z.nachher, 'nachher'), '»',
    zeilen.length > 1 ? ' und ' + mz(zeilen.length - 1, 'weitere Eingabe', 'weitere Eingaben') : '');
  const k = quit(titel, '', [
    taste('Vorher/nachher ansehen', () => { k.remove(); geh(String(z.key || '').startsWith('w|') ? 'wuensche' : 'aenderungen'); }),
    vorherDaten ? taste('Rückgängig', () => rueckgaengig(vorherDaten, k)) : null], { 'data-ws-quittung': zeilen.length });
  $('.ws-quit__t', k).append(text);
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
  const erstes = blatt.querySelector('textarea, input, [contenteditable]'); if (erstes) setTimeout(() => erstes.focus(), 30);
  return zu;
}

// ---------------------------------------------------------------- Auswahl und Wahl im Stil des Hauses (aus der Vorlage)
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
function textFeld(text, name, opt = {}) {
  const f = el('div', { class: 'ws-text', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': name, 'data-ws-feld': opt.id || name, spellcheck: 'true', lang: 'de' });
  f.textContent = text || '';
  if (opt.leer) f.setAttribute('data-leer', opt.leer);
  f.addEventListener('paste', ev => {   // eingefügt wird nur Text, nie fremde Gestaltung
    ev.preventDefault();
    const t = (ev.clipboardData || window.clipboardData).getData('text/plain'), s = getSelection();
    if (!s.rangeCount) return;
    const b = s.getRangeAt(0);
    b.deleteContents(); b.insertNode(document.createTextNode(t)); b.collapse(false);
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return f;
}
const feldText = f => (f.innerText || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();

// ---------------------------------------------------------------- Kopf, Rand, Leiste
const TITEL = { start: 'Übersicht', alle: 'Alle Seiten', wuensche: 'Wünsche', aenderungen: 'Entwurf', vergleich: 'Vorher & nachher', verlauf: 'Verlauf', uebernehmen: 'Verlauf', pruefstand: 'Ziel & Prüfung' };
function ansichtName(a) {
  if (a.startsWith('b:')) return (seiteVon(a.slice(2)) || {}).name || '';
  return TITEL[a] || '';
}
const offenZahl = () => Object.keys(Z.offen).length;
function kopf() {
  const L = window.FSB && FSB.lage(), a = L ? L.aenderungen.length : aend().length, k = $('#ws-kopf');
  const seite = Z.ansicht.startsWith('b:') ? Z.ansicht.slice(2) : 'index.html';
  k.innerHTML = WO.kopf({ werkzeug: W, unter: 'Agentur-Seite', titel: ansichtName(Z.ansicht) || wname(W), stand: a ? mz(a, 'Änderung im Entwurf', 'Änderungen im Entwurf') : (L ? 'Alles veröffentlicht' : ' '),
    pruefung: pruefLink(''), anleitung: 'anleitung.html', website: seiteAdresse(seite), marke: 'data-ws-marke', markeHref: '?ansicht=start' });
  const m = k.querySelector('[data-ws-marke]');
  if (m) m.addEventListener('click', ev => { ev.preventDefault(); if (Z.d) geh('start'); });
  const b = k.querySelector('.wo-marke-w b'); if (b) b.textContent = wname(W);
  const rk = k.querySelector('[data-wo-rand-knopf]'); if (rk) rk.setAttribute('aria-expanded', document.documentElement.classList.contains('wo-rand-auf') ? 'true' : 'false');
}
function rand() {
  const r = leere($('#ws-rand')), ae = aend(), wu = wue();
  const nw = (a, name, zahl, extra) => ({ text: name || ansichtName(a), zahl: zahl || 0, an: Z.ansicht === a, attr: `data-ws-nav="${a}"`, extra: extra ? `<em class="wo-rand__z">${WO.esc(extra)}</em>` : '' });
  const L = window.FSB && FSB.lage(), je = (L && L.je_seite) || {};
  const g = [{ eintraege: [nw('start')] },
    { titel: 'Die Agentur-Seite', eintraege: SEITEN.map(s => nw('b:' + s.datei, s.name, je[s.datei] || 0)) },
    { titel: 'Besprechen', eintraege: [nw('wuensche', '', wu.filter(w => w.status === 'offen').length)] },
    { titel: 'Veröffentlichen', eintraege: [nw('aenderungen', '', L ? L.aenderungen.length : 0), nw('vergleich'), nw('verlauf', '', 0, L && L.verlauf[0] && !L.verlauf[0].online ? 'prüft' : ''), nw('pruefstand', '', 0, L && L.ziel !== 'echt' ? 'Probe' : '')] }];
  r.innerHTML = WO.rand(g, { website: seiteAdresse('index.html'), pruefung: pruefLink(''), anleitung: 'anleitung.html' });
  r.querySelectorAll('button[data-ws-nav]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-ws-nav'))));
}
function leiste() {
  if (window.FSB) { if (FSB.lage()) FSB.leiste(); return; }   // Sichern, Entwurf, Veröffentlichen (bearbeiten.js); bis die Lage da ist, bleibt die Leiste leer statt einen alten Stand zu zeigen
  const l = leere($('#ws-leiste'));
  if (!Z.d) return;
  const n = offenZahl(), a = aend().length, gesp = !n && Z.gesp > Date.now();
  l.setAttribute('data-ws-offen', String(a));
  l.innerHTML = WO.leiste({
    titel: n ? mz(n, 'Eingabe', 'Eingaben') + ' noch nicht gespeichert' : a ? mz(a, 'Änderung wartet', 'Änderungen warten') + ' auf Robert' : 'Alles übernommen',
    satz: n ? 'Speichern legt sie in die Liste. Anna und Robert sehen sie dann auch auf der Seite.' : a ? 'Auf der Seite zu sehen, noch nicht in der Quelle.' + (wue().length ? ' ' + mz(wue().length, 'Wunsch ist', 'Wünsche sind') + ' offen.' : '') :
      'Die Seite zeigt sich wie gebaut.',
    entwurf: !!a && !n,
    knoepfe: WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'ws-vgl', klein: true, disabled: !(a || n) })
      + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', n ? 'wartet' : gesp ? 'fertig' : 'glas', { id: 'ws-speichern', klein: true, attr: `data-ws-lage="${n ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` })
      + WO.knopf('Seite öffnen', 'welt', 'gold', { id: 'ws-raus', klein: true, href: seiteAdresse(Z.ansicht.startsWith('b:') ? Z.ansicht.slice(2) : 'index.html'), neu: true })
  });
  const sp = $('#ws-speichern'); sp.querySelector('span').id = 'ws-speichern-text';
  sp.addEventListener('click', speichern);
  $('#ws-vgl').addEventListener('click', () => geh(n && Object.keys(Z.offen).some(k => /^(st|an|neu)\|/.test(k)) ? 'wuensche' : 'aenderungen'));
}
function allesNeu() { kopf(); rand(); leiste(); }

// ---------------------------------------------------------------- Vormerken, Speichern, Rückgängig, Konflikt
function vormerken(key, op) { Z.offen[key] = op; leiste(); }
function vergessen(key) { if (key in Z.offen) { delete Z.offen[key]; leiste(); } }
async function ladeStand() { Z.d = await ruf('GET', API + 'uebersicht'); allesNeu(); return Z.d; }

async function sende(ops, opt = {}) {
  let a;
  try {
    a = await ruf('POST', API + 'aendern', { ops, erwartet: Z.d.kennung, wer: wer() });
  } catch (e) {
    if (e.status === 409) return konflikt(ops, opt);
    fehler(e); return false;
  }
  Z.d = a.stand;
  if (opt.eingaben) Z.offen = {};
  Z.gesp = Date.now() + 6000;
  setTimeout(leiste, 6100);
  allesNeu();
  quittung(opt.titel || 'Gespeichert', a.quittung, a.vorher_daten);
  await zeichne({ halten: true });
  return true;
}
async function speichern() {
  const ops = Object.values(Z.offen);
  if (!ops.length) { melde('Nichts geändert, nichts gespeichert.'); return; }
  const leer = ops.find(o => (o.op === 'antwort' || o.op === 'wunsch') && !String(o.text || (o.w && o.w.text) || '').trim());
  if (leer) { melde('Ein Feld ist leer', { mehr: 'Eine leere Antwort oder ein leerer Wunsch wird nicht gespeichert. Schreib etwas hinein oder schliess das Feld.' }); return; }
  await sende(ops, { eingaben: true });
}
async function rueckgaengig(vorherDaten, karte) {
  try {
    await ruf('POST', API + 'zurueck', { daten: vorherDaten, erwartet: Z.d.kennung, wer: wer() });
  } catch (e) {
    if (e.status === 409) { await ladeStand(); melde('Inzwischen hat jemand anderes gespeichert.', { mehr: 'Rückgängig hätte dessen Änderung überschrieben und wurde deshalb nicht ausgeführt. Einzelnes nimmst du unter «Vorher & nachher» zurück.', stichwort: 'konflikt' }); return; }
    fehler(e); return;
  }
  if (karte) karte.remove();
  Z.gesp = 0;
  await ladeStand();
  melde('Rückgängig gemacht', { mehr: 'Die Liste ist wie vor diesem Speichern.' });
  await zeichne({ halten: true });
}
async function konflikt(ops, opt) {
  try { await ladeStand(); } catch (e) { fehler(e); return false; }
  const inhalt = el('div', { class: 'ws-form' },
    el('p', {}, 'Inzwischen hat jemand anderes gespeichert, zum Beispiel Anna auf der Seite. Deine Eingabe ist nicht verloren und nichts wurde überschrieben.'),
    el('p', {}, 'Du kannst sie auf den neuen Stand speichern, beides bleibt erhalten.'));
  return new Promise(fertig => {
    fenster('Zwei haben', 'gleichzeitig geändert.', inhalt, [
      { text: 'Meine Eingabe verwerfen', tun: zu => { zu(); if (opt.eingaben) Z.offen = {}; allesNeu(); zeichne({ halten: true }); fertig(false); } },
      { text: 'Meine Eingabe speichern', haupt: true, tun: async zu => { zu(); fertig(await sende(ops, opt)); } }], { name: 'konflikt' });
  });
}

// ---------------------------------------------------------------- Navigation und Titel
async function geh(ansicht, opt = {}) {
  $('#ws-rand').classList.remove('ws-offen');
  Z.ansicht = ansicht;
  Z.wahl = opt.zeige || null;
  if (opt.seite) Z.vgl.seite = opt.seite;
  try { localStorage.setItem('fs-ort', JSON.stringify({ a: Z.ansicht })); } catch (e) { /* ohne Merken */ }
  if (history.replaceState) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]ansicht=[^&]*/, '').replace(/^&/, '?') + (ansicht === 'start' ? '' : '#' + ansicht));
  allesNeu();
  await zeichne(opt);
  if (!opt.halten) window.scrollTo(0, 0);
}
function titel(klein, a, b, satz, knoepfe, foto) {
  const h = el('div', { class: 'ws-titel ws-titel--wo', html: WO.startbild({ werkzeug: W, zier: WO.esc(klein), h1: WO.esc(a ? a + ' ' : '') + (b ? '<em>' + WO.esc(b) + '</em>' : ''), satz: satz ? WO.esc(satz) : '',
    knoepfe: knoepfe && knoepfe.length ? ' ' : '', art: Z.ansicht === 'start' ? 'voll' : 'buehne', foto: foto || '' }) });
  const k = h.querySelector('.wo-sb__kn'); if (k && knoepfe) { k.textContent = ''; k.append(...knoepfe.filter(Boolean)); }
  return h;
}
const zweiteilig = name => { const m = /^(\S+)\s+(.*)$/.exec(name); return m ? [m[1], m[2]] : ['', name]; };

// ---------------------------------------------------------------- Vorschau: die Agentur-Seite im Rahmen (wie die Vorschau der Vorlage, 1440 px breit, verkleinert)
function vorschau(zustand, datei, kopfzeile) {
  const orig = !!(Z.d && Z.d.laeuft && Z.d.laeuft.original);
  const adr = zustand === 'vorher' ? (orig ? 'http://localhost:8982/' + (datei === 'index.html' ? '' : datei) : 'about:blank') : (laeuft() ? seiteAdresse(datei) : 'about:blank');
  const frame = el('iframe', { title: (zustand === 'vorher' ? 'Wie gebaut: ' : 'Mit Annas Änderungen: ') + seiteName(datei), 'data-ws-frame': zustand });
  const lage = el('div', { class: 'ws-vorschau__lage' }, el('span', { class: 'ws-mono' }, 'Seite wird gesetzt …'));
  const rahmen = el('div', { class: 'ws-rahmen' }, frame, lage);
  const k = el('section', { class: 'ws-vorschau', 'aria-label': 'Vorschau der Seite' }, kopfzeile || null, rahmen);
  const v = { k, frame, zustand, seite: datei, bereit: false, nach: null };
  v.passe = () => {
    const handy = schmal() || Z.breite === 'handy';
    rahmen.classList.toggle('ws-rahmen--handy', handy && !schmal());
    const b = rahmen.clientWidth, h = rahmen.clientHeight;
    if (!b || !h) return;
    const m = handy ? 1 : Math.min(1, b / 1440);
    frame.style.width = (handy ? b : 1440) + 'px';
    frame.style.height = Math.round(h / m) + 'px';
    frame.style.transform = m === 1 ? 'none' : 'scale(' + m + ')';
  };
  v.lade = () => {
    lage.hidden = false;
    if (zustand === 'vorher' && !(Z.d.laeuft || {}).original) lage.firstChild.textContent = 'Der Prüfstand läuft nicht. Starten mit python3 werkzeuge/01-feinschliff/probe.py';
    else if (zustand !== 'vorher' && !laeuft()) lage.firstChild.textContent = 'Der Prüfstand läuft nicht. Starten mit python3 werkzeuge/01-feinschliff/probe.py, dann steht hier die Seite zum Bearbeiten.';
    frame.addEventListener('load', () => { v.bereit = true; if (zustand === 'vorher' ? (Z.d.laeuft || {}).original : laeuft()) lage.hidden = true; if (v.nach) { const f = v.nach; v.nach = null; f(); } }, { once: true });
    frame.src = adr;
  };
  requestAnimationFrame(() => { v.passe(); v.lade(); });
  return v;
}
window.addEventListener('resize', () => Z.vs.forEach(v => v.passe()));

// ---------------------------------------------------------------- Was eine Änderung tut, in Worten (vorher, nachher)
function werteText(a) {
  const w = a.werte || {}, t = [];
  if (a.art === 'text') return { vorher: a.vorher || '', nachher: a.nachher || '' };
  if (a.art === 'stil') {
    if (w.schrift) t.push(w.schrift);
    if (w.groesse && w.groesse !== 100) t.push('Grösse ' + w.groesse + ' %');
    if (w.gewicht) t.push('Stärke ' + w.gewicht);
    if (w.zeilen) t.push('Zeilen ' + w.zeilen);
    if (w.laufweite !== undefined && w.laufweite !== null) t.push('Buchstaben ' + w.laufweite + ' em');
    return { vorher: 'Schrift wie gebaut', nachher: t.join(' · ') || 'wie im Original' };
  }
  if (a.art === 'abstand') { const px = v => { v = v || 0; return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) + ' px'; }; return { vorher: 'Abstand wie gebaut', nachher: 'oben ' + px(w.oben) + ', unten ' + px(w.unten) }; }
  if (a.art === 'reihenfolge') return { vorher: 'Reihenfolge wie gebaut', nachher: 'neue Reihenfolge, zuletzt bewegt: ' + anf(kurz(a.abschnitt, 50)) };
  return { vorher: '', nachher: '' };
}
function umfang(a) {
  if (a.art !== 'stil') return '';
  return a.umfang === 'element' ? 'nur dieser Text' : a.umfang === 'seite' ? 'alle gleichen auf der Seite' : 'alle gleichen auf allen Seiten';
}
function werte(a) {
  const t = werteText(a);
  return el('div', { class: 'ws-zwei-werte' },
    el('div', {}, mono('Vorher'), el('div', { class: 'ws-wert', 'data-ws-vorher': '1' }, t.vorher || '(nichts)')),
    el('div', {}, mono('Nachher'), el('div', { class: 'ws-wert ws-wert--neu', 'data-ws-nachher': '1' }, t.nachher || '(nichts)')));
}

// ---------------------------------------------------------------- Formulare zu einer Stelle (direkt unter ihrer Zeile, wie in der Vorlage)
function edZu() { $$('.ws-ed').forEach(x => x.remove()); $$('[aria-pressed="true"].ws-st').forEach(x => x.setAttribute('aria-pressed', 'false')); }
function hochholen(zeile, ed) {
  const liste = zeile.closest('.ws-stellen'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fahrt = still ? 'auto' : 'smooth';
  if (liste && liste.scrollHeight > liste.clientHeight + 2) {
    const such = $('.ws-suche', liste), luft = (such ? such.offsetHeight : 0) + 26;
    liste.scrollTo({ top: Math.max(0, zeile.getBoundingClientRect().top - liste.getBoundingClientRect().top + liste.scrollTop - luft), behavior: fahrt });
  }
  [zeile, ed].forEach(x => { if (!x) return; x.classList.remove('ws-leuchtet'); void x.offsetWidth; x.classList.add('ws-leuchtet'); setTimeout(() => x.classList.remove('ws-leuchtet'), 1700); });
}
function wunschForm(w, knopf) {
  /* Antworten und Status eines Wunsches. Beides wartet in Z.offen, bis gespeichert wird. */
  edZu();
  const kSt = 'st|' + w.id, kAn = 'an|' + w.id;
  const ed = el('div', { class: 'ws-ed', 'data-ws-form': 'wunsch', 'data-ws-wahl': w.id });
  const status = (Z.offen[kSt] || {}).status || w.status;
  const antwort = textFeld((Z.offen[kAn] || {}).text || '', 'Antwort an ' + (w.wer === wer() ? (wer() === 'Anna' ? 'Robert' : 'Anna') : w.wer), { id: 'antwort', leer: 'Antwort schreiben …' });
  antwort.addEventListener('input', () => { const t = feldText(antwort); if (t) vormerken(kAn, { op: 'antwort', id: w.id, text: t }); else vergessen(kAn); markiere(); });
  const markiere = () => { if (!knopf) return; const offen = kSt in Z.offen || kAn in Z.offen; knopf.classList.toggle('ws-offen', offen); const s = $('small', knopf); if (s) s.textContent = s.textContent.replace(' · nicht gespeichert', '') + (offen ? ' · nicht gespeichert' : ''); };
  ed.append(...[mono('Wunsch · ' + seiteName(w.seite) + (w.name ? ' · ' + kurz(w.name, 50) : '') + ' · ' + w.wer + ', ' + tag(w.zeit)),
    el('p', { class: 'ws-wunsch__text' }, w.text),
    (w.antworten || []).length ? el('div', { class: 'ws-antworten' }, w.antworten.map(x => el('div', { class: 'ws-antwort' }, el('p', {}, x.text), mono(x.wer + ' · ' + zeit(x.zeit))))) : null,
    el('div', { class: 'ws-ed__status' }, el('span', { class: 'ws-klein' }, 'Stand'), wahl2(STATUS, status, s => { if (s === w.status) vergessen(kSt); else vormerken(kSt, { op: 'wunsch_status', id: w.id, status: s }); markiere(); }, 'Stand des Wunsches', true)),
    antwort,
    el('div', { class: 'ws-ed__z' },
      w.abschnitt && w.seite !== '*' ? el('a', { class: 'ws-link', href: seiteAdresse(w.seite), target: '_blank', rel: 'noopener' }, 'Auf der Seite') : null,
      (w.wer === wer() || robert()) ? link('Wunsch entfernen', () => wunschWeg(w)) : null,
      link('Schliessen', () => { edZu(); Z.wahl = null; }))].filter(Boolean));
  if (knopf) { knopf.after(ed); knopf.setAttribute('aria-pressed', 'true'); hochholen(knopf, ed); }
  return ed;
}
function wunschWeg(w) {
  fenster('Diesen Wunsch', 'entfernen?', el('div', { class: 'ws-form' }, el('p', {}, anf(kurz(w.text, 200))),
    el('p', {}, (w.antworten || []).length ? 'Mit ihm gehen ' + mz(w.antworten.length, 'Antwort', 'Antworten') + '. ' : '', 'Rückgängig ist danach noch einmal möglich, in der Quittung unten.')), [
    { text: 'Abbrechen' },
    { text: 'Ja, entfernen', haupt: true, tun: zu => { zu(); vergessen('st|' + w.id); vergessen('an|' + w.id); sende([{ op: 'wunsch_weg', id: w.id }], { titel: 'Entfernt' }); } }], { name: 'wunsch-weg' });
}
function aenderungForm(a, knopf) {
  edZu();
  const kUe = 'ue|' + a.id;
  const ed = el('div', { class: 'ws-ed', 'data-ws-form': 'aenderung', 'data-ws-wahl': a.id });
  ed.append(mono(ART[a.art] + ' · ' + seiteName(a.seite) + (umfang(a) ? ' · ' + umfang(a) : '') + ' · ' + a.wer + ', ' + tag(a.zeit)), werte(a));
  if (a.status !== 'übernommen' && robert()) {
    const sch = el('button', { class: 'ws-schalter', type: 'button', role: 'switch', 'aria-checked': kUe in Z.offen ? 'true' : 'false', 'data-ws-uebernommen': a.id,
      onclick: () => { const an = !(kUe in Z.offen); sch.setAttribute('aria-checked', an ? 'true' : 'false'); if (an) vormerken(kUe, { op: 'uebernommen', ids: [a.id] }); else vergessen(kUe); if (knopf) knopf.classList.toggle('ws-offen', an); } },
      'Steht fest in der Quelle: als übernommen markieren');
    ed.append(el('div', { class: 'ws-ed__z' }, sch));
  }
  ed.append(el('div', { class: 'ws-ed__z' },
    a.seite !== '*' ? el('a', { class: 'ws-link', href: seiteAdresse(a.seite), target: '_blank', rel: 'noopener' }, 'Auf der Seite zeigen') : null,
    a.status !== 'übernommen' ? link('Zurücknehmen', () => zuruecknehmen(a)) : null,
    link('Schliessen', () => { edZu(); Z.wahl = null; })));
  if (a.status === 'übernommen') ed.append(el('p', { class: 'ws-vorher' }, el('b', {}, 'Übernommen: '), zeit(a.uebernommen) || 'ja'));
  if (knopf) { knopf.after(ed); knopf.setAttribute('aria-pressed', 'true'); hochholen(knopf, ed); }
  return ed;
}
function zuruecknehmen(a) {
  const t = werteText(a), vn = ausschnitt(t.vorher, t.nachher, 120);
  fenster('Diese Änderung', 'zurücknehmen?', el('div', { class: 'ws-form' },
    el('p', {}, ART[a.art] + ' · ' + seiteName(a.seite) + ': ' + anf(vn[1]) + ' wird wieder ' + anf(vn[0]) + '.'),
    el('p', { class: 'ws-klein' }, 'Auf der Seite gilt danach wieder, was gebaut ist. Rückgängig geht noch einmal, in der Quittung unten.')), [
    { text: 'Abbrechen' },
    { text: 'Ja, zurücknehmen', haupt: true, tun: zu => { zu(); vergessen('ue|' + a.id); sende([{ op: 'entfernen', id: a.id }], { titel: 'Zurückgenommen' }); } }], { name: 'zuruecknehmen' });
}
function neuerWunsch(seite) {
  /* allgemeiner Wunsch zur Seite (Wünsche zu einem Abschnitt schreibt Anna direkt auf der Seite, dort kennt die Leiste den Abschnitt) */
  const kNeu = 'neu|' + seite;
  const feld = textFeld((Z.offen[kNeu] && Z.offen[kNeu].w.text) || '', 'Wunsch', { id: 'wunsch', leer: 'Was soll anders werden? Was soll die Seite können, zeigen oder weglassen?' });
  let ziel = seite;
  const wahl = auswahl([{ wert: '*', text: 'Alle Seiten' }].concat(SEITEN.map(s => ({ wert: s.datei, text: s.name }))), ziel, x => { ziel = x; }, 'Zu welcher Seite');
  fenster('Ein Wunsch', 'für Robert und Anna.', el('div', { class: 'ws-form' },
    el('p', {}, 'Für Umbauten, die mehr sind als Wörter und Abstände. Robert und Anna antworten darauf und setzen den Stand.'),
    el('div', { class: 'feld' }, el('label', {}, 'Zu welcher Seite'), wahl), feld), [
    { text: 'Abbrechen' },
    { text: 'Vormerken', haupt: true, tun: zu => {
      const t = feldText(feld);
      if (!t) { melde('Der Wunsch ist leer', { mehr: 'Schreib in ein, zwei Sätzen, was anders werden soll.' }); return; }
      zu(); vergessen(kNeu); vormerken('neu|' + ziel, { op: 'wunsch', w: { seite: ziel, abschnitt: '', name: '', text: t } });
      melde('Vorgemerkt', { mehr: 'Speichern unten legt den Wunsch in die Liste.' }); zeichne({ halten: true });
    } }], { name: 'wunsch' });
}

// ---------------------------------------------------------------- Übersicht
function zeichneStart() {
  /* Übersicht (17.11.2026): Bearbeiten 1:1, Entwurf, Veröffentlichen mit Prüfung, Verlauf. Aufbau wie in Le Bureau: Startbild, Lage, Häufig gebraucht, Bereiche. */
  const m = leere($('#ws-mitte')), wu = wue(), E = WO.esc, L = FSB.lage(), n = L.aenderungen.length, letzte = L.verlauf[0];
  const wOffen = wu.filter(w => w.status === 'offen').length;
  const AUFG = [
    ['b:index.html', 'Wörter ändern', 'Auf der Seite einen Text anklicken und direkt schreiben.', 'stift', 'tafel'],
    ['b:werkzeuge.html', 'Foto tauschen', 'Foto anklicken, rechts ein anderes wählen oder hochladen.', 'foto', 'plan'],
    ['b:studio.html', 'Abstände und Reihenfolge', 'Zweimal klicken wählt den Abschnitt: Abstände, nach oben, ausblenden.', 'ziehen', 'studio'],
    ['vergleich', 'Vorher, nachher', 'Mit dem Schieber über der Seite vergleichen.', 'auge', 'bildschirm'],
    ['aenderungen', 'Veröffentlichen', 'Geprüft bei Rechner- und Handybreite, dann online.', 'welt', 'aussen'],
    ['verlauf', 'Früheren Stand zurückholen', 'Jede Veröffentlichung mit Bild, ein Klick holt sie zurück.', 'verlauf', 'speicherstadt']];
  m.append(titel(wname(W) + ' · Agentur-Seite', WO.gruss(), 'Was ändern wir heute?',
    'Du arbeitest direkt in der Agentur-Seite, in voller Grösse: Text anklicken und schreiben, Fotos tauschen, Abstände und Reihenfolge setzen. Jede Eingabe ist sofort gesichert. «Veröffentlichen» prüft die Seiten und stellt sie online, ein früherer Stand kommt mit einem Klick zurück.',
    [kn('Seite bearbeiten', () => geh('b:index.html'), 'kn--d'),
     el('a', { class: 'wo-kn wo-kn--gold', href: 'anleitung.html', target: '_blank', rel: 'noopener', 'data-ws-anleitung': '1', html: '<span>Anleitung</span><i>' + WO.ic('buch') + '</i>' })], FOTO((H.fotoJe || {})[W] || 'plan')));
  const rest = el('div', { class: 'ws-wo-start', html:
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('stift')}</i><span class="wo-mk">Entwurf</span><b>${n ? E(mz(n, 'Änderung', 'Änderungen')) : 'Leer'}</b><p>${n ? 'Gesichert, noch nicht online.' : 'Was du auf der Seite änderst, sammelt sich hier, gesichert nach jeder Eingabe.'}</p>${n ? '<button class="wo-lk" type="button" data-gehe="aenderungen">Ansehen und veröffentlichen</button>' : '<button class="wo-lk" type="button" data-gehe="b:index.html">Seite bearbeiten</button>'}</div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('welt')}</i><span class="wo-mk">${L.ziel === 'echt' ? 'Online' : 'Online · Probe'}</span><b>${letzte ? (letzte.online ? 'Geprüft' : 'Wird geprüft') : 'Wie gebaut'}</b><p>${letzte ? E('Zuletzt ' + zeit(letzte.zeit) + ', ' + letzte.wer + '.') : 'Noch nichts über das Werkzeug veröffentlicht.'}</p><button class="wo-lk" type="button" data-gehe="verlauf">Zum Verlauf</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('chat')}</i><span class="wo-mk">Wünsche</span><b>${wOffen ? E(mz(wOffen, 'Wunsch offen', 'Wünsche offen')) : wu.length ? E(mz(wu.length, 'Wunsch besprochen', 'Wünsche besprochen')) : 'Keine offen'}</b><p>${E(mz(wu.length, 'Wunsch', 'Wünsche') + ' noch nicht erledigt, ' + mz(doc().wuensche.length - wu.length, 'erledigt', 'erledigt') + '.')}</p><button class="wo-lk" type="button" data-gehe="wuensche">Wünsche ansehen</button></div>
    </div>
    <h2 class="wo-zw">Häufig <em>gebraucht</em></h2>
    <div class="wo-aufg ws-aufgaben">${AUFG.map(([ziel, tt, s, ic, f]) => `<button class="wo-ag ws-ag" type="button" data-gehe="${E(ziel)}"><span class="wo-ag__b"><img src="${E(FOTO(f))}" alt="" loading="lazy" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(ic)}</i><b>${E(tt)}</b><span>${E(s)}</span></span></button>`).join('')}</div>
    <h2 class="wo-zw">Die Seite, <em>Bereich für Bereich</em></h2>
    <div class="wo-ber ws-bereiche">${SEITEN.map(s => { const o = L.je_seite[s.datei] || 0, w = aufSeite(wu, s.datei).length;
      return `<button class="wo-bk ws-bk" type="button" title="${E(s.satz)}" data-ws-bk="${E(s.datei)}" data-gehe="b:${E(s.datei)}"><span class="wo-bk__b"><img src="${E(FOTO(s.foto))}" alt="" loading="lazy" decoding="async"></span><span class="wo-bk__t"><b>${E(s.name)}</b><small>${o || w ? [o ? mz(o, 'Änderung im Entwurf', 'Änderungen im Entwurf') : '', w ? mz(w, 'Wunsch', 'Wünsche') : ''].filter(Boolean).join(' · ') : 'wie online'}</small><span>${E(s.satz)}</span></span><i class="wo-bk__p">${WO.ic('pfeil')}</i></button>`; }).join('')}</div>` });
  rest.querySelectorAll('[data-gehe]').forEach(b => b.addEventListener('click', () => geh(b.getAttribute('data-gehe'))));
  m.append(rest);
}

// ---------------------------------------------------------------- Eine Seite: Stellen links (Wünsche, Änderungen nach Abschnitt), Seite rechts
function stZeile(x, art) {
  const offen = art === 'w' ? ('st|' + x.id in Z.offen || 'an|' + x.id in Z.offen) : ('ue|' + x.id in Z.offen);
  const t = art === 'w' ? x.text : werteText(x).nachher;
  const klein = art === 'w' ? 'Wunsch · ' + x.status + ' · ' + x.wer + ((x.antworten || []).length ? ' · ' + mz(x.antworten.length, 'Antwort', 'Antworten') : '')
    : ART[x.art] + (x.status === 'übernommen' ? ' · übernommen' : ' · ' + x.wer + ', ' + tag(x.zeit)) + (umfang(x) ? ' · ' + umfang(x) : '');
  const k = el('button', { type: 'button', class: 'ws-st' + (art === 'a' && x.status !== 'übernommen' ? ' ws-geaendert' : '') + (art === 'w' && x.status === 'offen' ? ' ws-geaendert' : '') + (offen ? ' ws-offen' : ''),
    'data-ws-id': x.id, 'data-such': suchText(x, art), 'aria-pressed': 'false', onclick: ev => (art === 'w' ? wunschForm(x, ev.currentTarget) : aenderungForm(x, ev.currentTarget)) },
    el('small', {}, klein + (offen ? ' · nicht gespeichert' : '')), el('span', { 'data-ws-zeigt': '1' }, t));
  return k;
}
function gruppenListe(ort, datei) {
  const d = doc(), ws = d.wuensche.filter(w => w.seite === datei).slice().reverse(), as = d.aenderungen.filter(a => a.seite === datei).slice().reverse();
  leere(ort);
  ort.append(el('details', { class: 'ws-gr', open: true, 'data-g': 'wuensche' },
    el('summary', {}, el('b', {}, 'Wünsche'), el('small', {}, ws.length ? mz(ws.filter(w => w.status !== 'erledigt').length, 'offen', 'offen') + ' · ' + ws.length + ' insgesamt' : 'keine')),
    ws.map(w => stZeile(w, 'w')),
    el('div', { class: 'ws-gr__fuss' }, link('Neuer Wunsch zu dieser Seite', () => neuerWunsch(datei)))));
  const nachAbschnitt = new Map();
  as.forEach(a => { const k = a.abschnitt || 'Ohne Abschnitt'; if (!nachAbschnitt.has(k)) nachAbschnitt.set(k, []); nachAbschnitt.get(k).push(a); });
  if (!as.length) ort.append(el('details', { class: 'ws-gr', open: true, 'data-g': 'leer' }, el('summary', {}, el('b', {}, 'Änderungen'), el('small', {}, 'keine')),
    el('div', { class: 'ws-gr__text' }, el('p', {}, 'Auf dieser Seite ist noch nichts geändert. Rechts auf einen Text klicken und schreiben, Enter speichert. Schrift und Abstände unten in der Leiste unter «Schrift» und «Abschnitte».'))));
  [...nachAbschnitt.entries()].forEach(([name, l], gi) => {
    const offen = l.filter(a => a.status !== 'übernommen').length;
    ort.append(el('details', { class: 'ws-gr', open: gi < 3 || offen > 0, 'data-g': 'a' + gi },
      el('summary', {}, el('b', {}, name), el('small', {}, mz(l.length, 'Änderung', 'Änderungen') + (offen !== l.length ? ' · ' + (l.length - offen) + ' übernommen' : ''))),
      l.map(a => stZeile(a, 'a'))));
  });
}
function suchText(x, art) {   // was die Suche je Zeile durchsucht: neuer und alter Wortlaut, Abschnitt, Antworten (ohne Auszeichnung)
  const ohne = t => String(t || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const w = art === 'w' ? [x.text, x.abschnitt, x.name, ...(x.antworten || []).map(a => a.text)] : [werteText(x).vorher, werteText(x).nachher, x.abschnitt, x.beispiel];
  return ohne(w.filter(Boolean).join(' ')).toLowerCase();
}
function suche(q) {
  q = q.trim().toLowerCase();
  let alle = 0;
  $$('#ws-gruppen .ws-gr').forEach(g => {
    let treffer = 0;
    const name = ($('summary b', g) || {}).textContent || '';
    $$('.ws-st', g).forEach(x => { const ja = !q || (x.textContent + ' ' + (x.getAttribute('data-such') || '') + ' ' + name).toLowerCase().includes(q); x.hidden = !ja; if (ja) treffer++; });
    g.hidden = !!q && !treffer;
    if (q && treffer) g.open = true;
    alle += treffer;
  });
  const ort = $('#ws-gruppen'), alt = $('#ws-gruppen > .ws-leer');
  if (alt) alt.remove();
  if (ort && q && !alle) ort.append(el('p', { class: 'kuhle ws-leer' }, 'Nichts gefunden.'));
}
function zeichneSeite(opt) {
  const datei = Z.ansicht.slice(2), s = seiteVon(datei) || SEITEN[0], m = $('#ws-mitte');
  if (opt.halten && m.getAttribute('data-ws-web') === datei && $('#ws-gruppen') && Z.vs[0]) {   // nach dem Speichern: Liste erneuern, die Seite bleibt an ihrer Stelle stehen
    const liste = $('.ws-stellen'), oben = liste.scrollTop, w = Z.wahl;
    gruppenListe($('#ws-gruppen'), datei);
    suche($('#ws-such').value);
    liste.scrollTop = oben;
    if (w) { const z = $(`#ws-gruppen .ws-st[data-ws-id="${w}"]`); if (z) z.click(); }
    return;
  }
  m.setAttribute('data-ws-web', datei);
  const vs = vorschau('nachher', datei, el('div', { class: 'ws-vorschau__k' }, el('span', { class: 'ws-mono' }, s.name + (laeuft() ? ' · als ' + wer() : ' · Prüfstand aus')),
    schmal() ? null : wahl2([{ wert: 'rechner', text: 'Rechner' }, { wert: 'handy', text: 'Handy' }], Z.breite, x => { Z.breite = x; vs.passe(); }, 'Breite der Vorschau'),
    el('a', { href: seiteAdresse(datei), target: '_blank', rel: 'noopener' }, 'Gross öffnen')));
  Z.vs = [vs];
  const [a1, a2] = zweiteilig(s.name);
  leere(m).append(titel('Bereich · ' + s.name, a1, a2, s.satz + (schmal() ? ' Oben arbeitest du direkt in der Seite, darunter stehen ihre Änderungen und Wünsche.' : ' Rechts arbeitest du direkt in der Seite, links stehen ihre Änderungen und Wünsche.'),
      null, FOTO(s.foto)),
    el('div', { class: 'ws-arbeit' },
      el('div', { class: 'platte ws-stellen' },
        el('label', { class: 'ws-suche' }, el('span', { html: LUPE }), el('input', { type: 'text', id: 'ws-such', placeholder: 'In Änderungen und Wünschen suchen', autocomplete: 'off', 'aria-label': 'In Änderungen und Wünschen suchen', oninput: ev => suche(ev.target.value) })),
        el('div', { id: 'ws-gruppen' })),
      vs.k));
  gruppenListe($('#ws-gruppen'), datei);
  if (Z.wahl) { const z = $(`#ws-gruppen .ws-st[data-ws-id="${Z.wahl}"]`); if (z) z.click(); }
}

// ---------------------------------------------------------------- Für alle Seiten
function zeichneAlle() {
  const m = leere($('#ws-mitte')), d = doc();
  Z.vs = [];
  const as = d.aenderungen.filter(a => a.seite === '*' || a.umfang === 'alle'), ws = d.wuensche.filter(w => w.seite === '*');
  m.append(titel('Für alle Seiten', 'Alle', 'Seiten.', 'Schrift, die Anna für alle gleichen Texte auf allen Seiten gewählt hat, und Wünsche zur Seite als Ganzes.',
    [kn('Neuer Wunsch', () => neuerWunsch('*'), 'kn--klein')], FOTO('speicherstadt')));
  const liste = el('div', { class: 'platte ws-stellen ws-stellen--frei' }, el('div', { id: 'ws-gruppen' }));
  m.append(liste);
  const ort = $('#ws-gruppen', liste);
  ort.append(el('details', { class: 'ws-gr', open: true }, el('summary', {}, el('b', {}, 'Wünsche zur ganzen Seite'), el('small', {}, ws.length ? String(ws.length) : 'keine')),
    ws.slice().reverse().map(w => stZeile(w, 'w')), el('div', { class: 'ws-gr__fuss' }, link('Neuer Wunsch für alle Seiten', () => neuerWunsch('*')))));
  ort.append(el('details', { class: 'ws-gr', open: true }, el('summary', {}, el('b', {}, 'Schrift auf allen Seiten'), el('small', {}, as.length ? String(as.length) : 'keine')),
    as.length ? as.slice().reverse().map(a => stZeile(a, 'a')) : el('div', { class: 'ws-gr__text' }, el('p', {}, 'Noch keine. Auf der Seite unter «Schrift» heisst das «alle gleichen auf allen Seiten».'))));
  if (Z.wahl) { const z = $(`#ws-gruppen .ws-st[data-ws-id="${Z.wahl}"]`); if (z) z.click(); }
}

// ---------------------------------------------------------------- Wünsche (wie «Entwurf» der Vorlage: eine Karte je Wunsch)
function zeichneWuensche() {
  const m = leere($('#ws-mitte')), d = doc();
  Z.vs = [];
  const alle = d.wuensche.slice().reverse(), zahl = s => alle.filter(w => s === 'alle' || (s === 'offen' ? w.status !== 'erledigt' : w.status === s)).length;
  const neu = Object.values(Z.offen).filter(o => o.op === 'wunsch');
  m.append(titel('Besprechen', 'Wünsche', 'und Antworten.', 'Grössere Umbauten, die mehr sind als Wörter und Abstände. Anna schreibt sie zum Abschnitt, Robert antwortet und setzt den Stand: offen, besprochen, erledigt.',
    [kn('Neuer Wunsch', () => neuerWunsch('*'), 'kn--klein ws-kn-metall')]));
  m.append(el('div', { class: 'ws-reiter', style: 'margin-top:0' },
    wahl2([{ wert: 'offen', text: 'Noch offen' }, { wert: 'erledigt', text: 'Erledigt' }, { wert: 'alle', text: 'Alle' }], Z.filter, x => { Z.filter = x; zeichne({ halten: true }); }, 'Welche Wünsche'),
    el('span', { class: 'ws-leise' }, mz(zahl(Z.filter), 'Wunsch', 'Wünsche'))));
  neu.forEach(o => m.append(el('section', { class: 'platte ws-karte ws-karte--offen', 'data-ws-neu': o.w.seite },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Neuer Wunsch'), mono(seiteName(o.w.seite) + ' · nicht gespeichert')), el('p', {}, o.w.text))));
  const l = alle.filter(w => Z.filter === 'alle' || (Z.filter === 'offen' ? w.status !== 'erledigt' : w.status === Z.filter));
  if (!l.length) {
    m.append(el('p', { class: 'kuhle ws-leer' }, Z.filter === 'offen' ? 'Kein Wunsch offen. Auf der Seite unten «Wünsche» wählen und einen Abschnitt anklicken.' : 'Hier steht noch nichts.'));
    if (!alle.length) m.append(el('section', { class: 'platte ws-karte ws-karte--beispiel', 'data-ws-beispiel': 'wunsch' },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Ein Abschnitt …'), mono('Beispiel · so steht ein Wunsch hier')),
      el('p', {}, 'Anna schreibt, was der Abschnitt können, zeigen oder weglassen soll. Darunter stehen die Antworten, rechts der Stand.')));
    return;
  }
  l.forEach(w => {
    const k = el('section', { class: 'platte ws-karte' + ('st|' + w.id in Z.offen || 'an|' + w.id in Z.offen ? ' ws-karte--offen' : ''), 'data-ws-wunsch': w.id },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, w.name || (w.seite === '*' ? 'Die ganze Seite' : seiteName(w.seite))), mono(seiteName(w.seite) + ' · ' + w.wer + ', ' + tag(w.zeit) + ' · ' + w.status)),
      el('p', { class: 'ws-wunsch__text' }, w.text),
      (w.antworten || []).length ? el('div', { class: 'ws-antworten' }, w.antworten.map(x => el('div', { class: 'ws-antwort' }, el('p', {}, x.text), mono(x.wer + ' · ' + zeit(x.zeit))))) : null);
    const ort = el('div', {});
    const knopf = taste('Antworten und Stand', () => { if ($('.ws-ed', ort)) { edZu(); return; } const ed = wunschForm(w, null); ort.append(ed); ed.classList.add('ws-ed--karte'); }, { 'data-ws-antworten': w.id });
    k.append(el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, knopf, w.seite !== '*' ? taste('In der Seite', () => geh('b:' + w.seite, { zeige: w.id })) : null), ort);
    m.append(k);
    if (Z.wahl === w.id) knopf.click();
  });
}

// ---------------------------------------------------------------- Vorher & nachher (wie «Entwurf & Vergleich» der Vorlage)
function beispielEntwurf(m) {
  m.append(el('p', { class: 'ws-satz ws-beispiel-satz' }, 'So steht eine Änderung hier, sobald Anna auf der Seite etwas ändert. Die Werte unter «Vorher» stehen heute auf der Seite.'),
    el('div', { class: 'ws-beispiele', 'data-ws-beispiel': 'entwurf' }, [['Startseite · Auftakt', 'Hospitality, digital neu gedacht.'], ['Team', 'Wie wir zusammenarbeiten']].map(([wo, t]) =>
      el('section', { class: 'platte ws-karte ws-karte--beispiel' }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Wörter'), mono('Beispiel · ' + wo)), werte({ art: 'text', vorher: t, nachher: 'Annas neuer Text' })))));
}
function zeichneAenderungen() {
  const m = leere($('#ws-mitte')), ae = aend();
  Z.vs = [];
  m.append(titel('Übernehmen', 'Vorher,', 'nachher.', ae.length ? mz(ae.length, 'Änderung wartet', 'Änderungen warten') + ' auf Robert. Jede einzeln zurücknehmen, unten Seite für Seite vergleichen.' : 'Alle Änderungen stehen fest in der Quelle, oder es gibt noch keine.',
    ae.length ? [robert() ? kn('In die Quelle übernehmen', () => geh('uebernehmen'), 'kn--klein ws-kn-metall') : null] : null));
  if (!ae.length) return beispielEntwurf(m);
  ae.slice().reverse().forEach(a => {
    m.append(el('section', { class: 'platte ws-karte' + ('ue|' + a.id in Z.offen ? ' ws-karte--offen' : ''), 'data-ws-aenderung': a.id },
      el('div', { class: 'ws-karte__kopf' }, el('b', {}, ART[a.art] + ' · ' + kurz(a.abschnitt || 'ohne Abschnitt', 60)), mono(seiteName(a.seite) + ' · ' + a.wer + ', ' + tag(a.zeit))), werte(a),
      umfang(a) ? el('p', { class: 'ws-klein', style: 'padding-top:10px' }, 'Gilt für ' + umfang(a) + (a.beispiel ? ', zum Beispiel ' + anf(kurz(a.beispiel, 60)) : '') + '.') : null,
      el('div', { class: 'ws-reihe', style: 'padding-top:12px' },
        a.seite !== '*' ? taste('In der Seite', () => geh('b:' + a.seite, { zeige: a.id })) : taste('Für alle Seiten', () => geh('alle', { zeige: a.id })),
        taste('Zurücknehmen', () => zuruecknehmen(a)),
        robert() ? taste('ue|' + a.id in Z.offen ? 'Nicht übernommen' : 'Als übernommen markieren', () => { const k = 'ue|' + a.id; if (k in Z.offen) vergessen(k); else vormerken(k, { op: 'uebernommen', ids: [a.id] }); zeichne({ halten: true }); }, { 'data-ws-ue': a.id }) : null)));
  });
  // Seite für Seite
  const mit = [...new Set(ae.map(a => a.seite).filter(s => s && s !== '*'))];
  if (!mit.length) return;
  if (!mit.includes(Z.vgl.seite)) Z.vgl.seite = mit[0];
  const hier = ae.filter(a => a.seite === Z.vgl.seite);
  const vor = vorschau('vorher', Z.vgl.seite), nach = vorschau('nachher', Z.vgl.seite);
  Z.vs = [vor, nach];
  const spVor = el('div', { 'data-ws-spalte': 'vorher' }, el('span', { class: 'ws-mono ws-leise' }, 'Vorher · wie gebaut'), vor.k);
  const spNach = el('div', { 'data-ws-spalte': 'nachher' }, el('span', { class: 'ws-mono ws-leise' }, 'Nachher · mit Annas Änderungen'), nach.k);
  const zeigeSicht = () => { if (schmal()) { spVor.hidden = Z.vgl.sicht !== 'vorher'; spNach.hidden = Z.vgl.sicht !== 'nachher'; requestAnimationFrame(() => Z.vs.forEach(v => v.passe())); } };
  m.append(el('h2', { class: 'ws-zw', id: 'ws-vergleich' }, 'Seite für Seite ', el('em', {}, 'vergleichen')),
    el('div', { class: 'ws-reiter', style: 'margin-top:0' },
      auswahl(mit.map(s => ({ wert: s, text: seiteName(s), zusatz: String(aufSeite(ae, s).length) })), Z.vgl.seite, x => { Z.vgl.seite = x; zeichne({ halten: true }); }, 'Seite'),
      schmal() ? wahl2([{ wert: 'vorher', text: 'Vorher' }, { wert: 'nachher', text: 'Nachher' }], Z.vgl.sicht, x => { Z.vgl.sicht = x; zeigeSicht(); }, 'Vorher oder nachher') : null,
      el('span', { class: 'ws-leise', 'data-ws-vgl-zahl': hier.length }, mz(hier.length, 'Änderung', 'Änderungen') + ' auf dieser Seite')),
    el('div', { class: 'platte ws-karte', style: 'padding-top:10px;padding-bottom:10px', 'data-ws-vgl-liste': '1' }, hier.map(a => {
      const t = werteText(a), vn = ausschnitt(t.vorher, t.nachher, 80);
      return el('div', { class: 'ws-zl', style: 'grid-template-columns:minmax(0,1fr)' }, mono(ART[a.art] + ' · ' + kurz(a.abschnitt, 50)),
        el('a', { class: 'ws-zl__wert', href: seiteAdresse(a.seite), target: '_blank', rel: 'noopener' }, (vn[0] || '(nichts)') + '  →  ' + (vn[1] || '(nichts)')));
    })),
    el('div', { class: 'ws-zwei' }, spVor, spNach));
  zeigeSicht();
}

// ---------------------------------------------------------------- In die Quelle übernehmen (Robert)
function zeichneUebernehmen() {
  const m = leere($('#ws-mitte')), ae = aend(), d = doc();
  Z.vs = [];
  m.append(titel('Übernehmen', 'In die', 'Quelle.', robert() ? 'Annas Änderungen übernimmst du von Hand in texte.py und bau.py. Diese Liste je Seite ist die Grundlage. Was fest in der Quelle steht, markierst du hier als übernommen und speicherst.' :
    'Das macht Robert: er übernimmt deine Änderungen in die Quelle der Seite und markiert sie hier. Danach werden sie nicht mehr darübergelegt, sie stehen fest auf der Seite.', null));
  m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Als Liste zum Abarbeiten'), mono('im Terminal, im Ordner des Repos')),
    el('pre', { class: 'ws-befehl' }, 'python3 werkzeuge/01-feinschliff/uebernehmen.py --wuensche > uebernahme.md'),
    el('p', { class: 'ws-klein' }, 'Gibt alle noch nicht übernommenen Änderungen je Seite aus (Stelle, vorher, nachher; Schrift; Abstände; Reihenfolge), mit «--wuensche» auch die offenen Wünsche.')));
  if (!ae.length) { m.append(el('p', { class: 'kuhle ws-leer' }, 'Nichts wartet. Jede Änderung steht fest in der Quelle.')); }
  const nachSeite = new Map();
  ae.forEach(a => { if (!nachSeite.has(a.seite)) nachSeite.set(a.seite, []); nachSeite.get(a.seite).push(a); });
  [...nachSeite.entries()].sort((x, y) => (x[0] === '*' ? -1 : 0) - (y[0] === '*' ? -1 : 0)).forEach(([s, l]) => {
    const alleDa = l.every(a => 'ue|' + a.id in Z.offen);
    m.append(el('section', { class: 'platte ws-karte', 'data-ws-quelle': s },
      el('div', { class: 'ws-karte__kopf' }, el('h2', {}, seiteName(s)), mono(mz(l.length, 'Änderung', 'Änderungen'))),
      l.map(a => {
        const t = werteText(a), k = 'ue|' + a.id, vn = ausschnitt(t.vorher, t.nachher, 140);
        return el('div', { class: 'ws-zl ws-zl--quelle' },
          el('div', {}, mono(ART[a.art] + ' · ' + kurz(a.abschnitt, 60) + (umfang(a) ? ' · ' + umfang(a) : '')), el('p', { class: 'ws-quelle__t' }, el('s', {}, vn[0] || '(nichts)'), ' → ', el('span', {}, vn[1]))),
          robert() ? el('button', { class: 'ws-schalter', type: 'button', role: 'switch', 'aria-checked': k in Z.offen ? 'true' : 'false', 'data-ws-uebernommen': a.id,
            onclick: ev => { const an = !(k in Z.offen); ev.currentTarget.setAttribute('aria-checked', an ? 'true' : 'false'); if (an) vormerken(k, { op: 'uebernommen', ids: [a.id] }); else vergessen(k); } }, 'übernommen') : null);
      }),
      robert() ? el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste(alleDa ? 'Keine markieren' : 'Alle dieser Seite markieren', () => { l.forEach(a => { const k = 'ue|' + a.id; if (alleDa) delete Z.offen[k]; else Z.offen[k] = { op: 'uebernommen', ids: [a.id] }; }); leiste(); zeichne({ halten: true }); })) : null));
  });
  const fertig = d.aenderungen.filter(a => a.status === 'übernommen');
  if (fertig.length) m.append(el('h2', { class: 'ws-zw' }, 'Schon ', el('em', {}, 'übernommen')),
    el('div', { class: 'ws-liste-klein platte ws-karte' }, fertig.slice().reverse().map(a => el('p', {}, seiteName(a.seite) + ' · ' + ART[a.art] + ' · ' + anf(kurz(werteText(a).nachher, 90)) + ' · ' + tag(a.uebernommen)))));
}

// ---------------------------------------------------------------- Prüfstand und Probedaten (wie «Frühere Fassungen» der Vorlage, mit Protokoll)
function zeichnePruefstand() {
  const m = leere($('#ws-mitte')), l = Z.d.laeuft || {}, d = doc();
  Z.vs = [];
  m.append(titel('Übernehmen', 'Prüfstand', 'und Probedaten.', 'Hier läuft die Seite mit dem Werkzeug, so wie Anna sie später online öffnet. Alles bleibt im Studio: nichts geht online, nichts wird verschickt.', null));
  const zeile = (an, t) => el('div', { class: 'ws-stand' }, el('i', { class: an ? 'an' : '' }), el('span', {}, t));
  m.append(el('section', { class: 'platte ws-karte', 'data-ws-pruefstand': l.seite && l.dienst ? 'laeuft' : 'aus' },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, l.seite && l.dienst ? 'Läuft' : 'Nicht gestartet'), mono('Seite und Dienst')),
    zeile(l.seite, 'Seite auf 8980: ' + (l.seite ? 'läuft' : 'nicht gestartet')), zeile(l.dienst, 'Dienst auf 8981: ' + (l.dienst ? 'läuft' : 'nicht gestartet')),
    l.seite && l.dienst ? null : el('pre', { class: 'ws-befehl' }, 'python3 werkzeuge/01-feinschliff/probe.py'),
    el('p', { class: 'ws-klein' }, 'Gespeichert wird in daten/01-feinschliff/. Der Browser merkt sich den Schlüssel; «?feinschliff=aus» an der Adresse vergisst ihn.'),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, ['Anna', 'Robert'].map(w => el('a', { class: 'ws-taste', href: laeuft() ? seiteAdresse('index.html', w) : '#', target: '_blank', rel: 'noopener', 'aria-disabled': laeuft() ? null : 'true', 'data-ws-als': w }, 'Seite öffnen als ' + w)))));
  m.append(el('section', { class: 'platte ws-karte', 'data-ws-probe': Z.d.sicherung_da ? 'eingespielt' : 'eigen' },
    el('div', { class: 'ws-karte__kopf' }, el('b', {}, 'Probedaten'), mono(Z.d.sicherung_da ? 'eingespielt · eigene Liste gesichert' : 'erfunden, aber glaubwürdig')),
    el('p', {}, 'Erfundene Änderungen und Wünsche, damit sich alles ohne echte Daten bedienen lässt. Die eigene Liste wird beim ersten Einspielen gesichert und lässt sich zurückholen; was die Liste ersetzt, fragt vorher nach.'),
    el('div', { class: 'ws-reihe', style: 'padding-top:12px' }, taste('Probedaten einspielen', () => probedaten(), { 'data-ws-probedaten': '1' }), Z.d.sicherung_da ? taste('Eigene Liste zurückholen', () => probeZurueck(), { 'data-ws-zurueckholen': '1' }) : null)));
  // Protokoll: wer, wann, was
  const ev = [];
  d.aenderungen.forEach(a => { ev.push([a.zeit, a.wer, ART[a.art] + ' geändert · ' + seiteName(a.seite) + ' · ' + kurz(a.abschnitt, 50)]); if (a.uebernommen) ev.push([a.uebernommen, 'Robert', 'In die Quelle übernommen · ' + seiteName(a.seite)]); });
  d.wuensche.forEach(w => { ev.push([w.zeit, w.wer, 'Wunsch · ' + seiteName(w.seite) + ' · ' + kurz(w.text, 60)]); (w.antworten || []).forEach(x => ev.push([x.zeit, x.wer, 'Antwort · ' + kurz(x.text, 60)])); });
  ev.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  m.append(el('section', { class: 'platte ws-karte' }, el('div', { class: 'ws-karte__kopf' }, el('h2', {}, 'Protokoll'), mono('wer, wann, was')),
    el('div', { class: 'ws-liste-klein', 'data-ws-protokoll': '1' }, ev.length ? ev.slice(0, 40).map(e => el('p', {}, zeit(e[0]) + ' · ' + e[2] + ' · ' + e[1])) : el('p', {}, 'Noch nichts. Sobald Anna auf der Seite etwas ändert, steht es hier.'))));
}
const zahlText = z => mz(z.aenderungen_offen || 0, 'Änderung', 'Änderungen') + ', ' + mz((z.wuensche_offen || 0) + (z.wuensche_besprochen || 0), 'Wunsch', 'Wünsche');
// Quittung der Probedaten: vorher/nachher als Zahlen, «Rückgängig» stellt Liste und Sicherung wie davor her
function probeQuittung(titel, j, sicherung, name) {
  const k = quit(titel, '', [taste('Rückgängig', () => probeRueckgaengig(j.vorher_daten, sicherung, k))], { 'data-ws-quittung': name });
  $('.ws-quit__t', k).append(el('span', {}, 'Liste: «', el('span', { 'data-ws-q': 'vorher' }, zahlText(j.vorher)), '» wird «', el('span', { 'data-ws-q': 'nachher' }, zahlText(j.nachher)), '»'));
}
async function probeSchritt(weg, bestaetigt) {
  try { return await ruf('POST', API + weg, { bestaetigt, erwartet: Z.d.kennung }); } catch (e) {
    if (e.status === 409) { await ladeStand(); zeichne({ halten: true }); melde('Inzwischen hat jemand anderes gespeichert.', { mehr: 'Nichts wurde ersetzt. Schau die Liste an und versuch es noch einmal.', stichwort: 'konflikt' }); return null; }
    fehler(e); return null;
  }
}
async function probedaten(bestaetigt = false) {
  const j = await probeSchritt('probedaten', bestaetigt);
  if (!j) return;
  if (j.rueckfrage) {   // schon eingespielt und seither etwas dazugekommen: erst fragen
    fenster('Probedaten', 'noch einmal einspielen?', el('div', { class: 'ws-form', 'data-ws-rueckfrage': 'probedaten' },
      el('p', {}, 'Seit dem letzten Einspielen ' + (j.dazu === 1 ? 'ist 1 Eintrag' : 'sind ' + j.dazu + ' Einträge') + ' dazugekommen oder geändert. Die gehen mit dem neuen Einspielen weg: jetzt «' + zahlText(j.jetzt) + '».'),
      el('p', { class: 'ws-klein' }, 'Deine eigene Liste von vor den Probedaten bleibt gesichert und lässt sich weiter zurückholen. Rückgängig geht noch einmal, in der Quittung unten.')), [
      { text: 'Abbrechen' },
      { text: 'Ja, neu einspielen', haupt: true, tun: zu => { zu(); probedaten(true); } }], { name: 'probedaten' });
    return;
  }
  Z.d = j.stand; allesNeu();
  probeQuittung('Probedaten eingespielt', j, j.sicherung_neu ? 'weg' : 'bleibt', 'probe');
  zeichne({ halten: true });
}
async function probeZurueck(bestaetigt = false) {
  const j = await probeSchritt('probedaten/zurueck', bestaetigt === true);
  if (!j) return;
  if (j.rueckfrage) {   // ersetzt die aktuelle Liste: immer erst fragen
    fenster('Eigene Liste', 'zurückholen?', el('div', { class: 'ws-form', 'data-ws-rueckfrage': 'zurueckholen' },
      el('p', {}, 'Die Liste jetzt, «' + zahlText(j.jetzt) + '», wird ersetzt durch deine eigene Liste von vor den Probedaten, «' + zahlText(j.eigen) + '».'),
      j.dazu ? el('p', {}, (j.dazu === 1 ? '1 Eintrag ist' : j.dazu + ' Einträge sind') + ' seit dem Einspielen dazugekommen oder geändert. ' + (j.dazu === 1 ? 'Er geht' : 'Sie gehen') + ' dabei weg.') : null,
      el('p', { class: 'ws-klein' }, 'Rückgängig geht noch einmal, in der Quittung unten: dann sind die Probedaten wieder da und die eigene Liste wieder gesichert.')), [
      { text: 'Abbrechen' },
      { text: 'Ja, zurückholen', haupt: true, tun: zu => { zu(); probeZurueck(true); } }], { name: 'zurueckholen' });
    return;
  }
  Z.d = j.stand; allesNeu();
  probeQuittung('Eigene Liste zurückgeholt', j, 'jetzt', 'zurueckgeholt');
  zeichne({ halten: true });
}
async function probeRueckgaengig(daten, sicherung, karte) {
  let j;
  try { j = await ruf('POST', API + 'probedaten/rueckgaengig', { daten, sicherung, erwartet: Z.d.kennung }); } catch (e) {
    if (e.status === 409) { await ladeStand(); zeichne({ halten: true }); melde('Inzwischen hat jemand anderes gespeichert.', { mehr: 'Rückgängig hätte dessen Änderung überschrieben und wurde deshalb nicht ausgeführt.', stichwort: 'konflikt' }); return; }
    return fehler(e);
  }
  if (karte) karte.remove();
  Z.d = j.stand; allesNeu();
  melde('Rückgängig gemacht', { mehr: 'Die Liste ist wieder wie davor: ' + zahlText(j.nachher) + '.' });
  zeichne({ halten: true });
}

// ---------------------------------------------------------------- Zeichnen und Start
async function zeichne(opt = {}) {
  const lauf = ++Z.zl, a = Z.ansicht, m = $('#ws-mitte');
  opt = Object.assign({}, opt, { gilt: () => lauf === Z.zl });
  m.removeAttribute('data-ws-bereit');
  m.setAttribute('data-ws-ansicht', a);
  if (!a.startsWith('b:')) { m.removeAttribute('data-ws-web'); }
  try {
    if (a.startsWith('b:')) { if (!(opt.halten && $('#fsb [data-fsb-frame="' + a.slice(2) + '"]'))) FSB.seite(a.slice(2)); }
    else if (a === 'vergleich') FSB.vergleich(opt);
    else if (a === 'aenderungen') FSB.entwurf();
    else if (a === 'verlauf' || a === 'uebernehmen') FSB.verlauf();
    else if (a === 'pruefstand') FSB.ziel();
    else {
      FSB.verlassen();
      if (a === 'start') zeichneStart();
      else if (a === 'alle') zeichneAlle();
      else if (a === 'wuensche') zeichneWuensche();
    }
  } catch (e) { fehler(e); }   // ein Fehler beim Zeichnen steht auf der Seite, nie nur in der Konsole
  if (opt.gilt()) m.setAttribute('data-ws-bereit', a);
}
function startFehler(e) {
  const text = (e && e.fehler) || (e && e.message) || String(e);
  merke('Start: ' + text, e && e.stichwort);
  $('#ws-rand').hidden = true;
  $('#ws-kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Agentur-Seite', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: pruefLink(e && e.stichwort), website: '/zentrale/seite/index.html' });
  leere($('#ws-leiste')).innerHTML = WO.leiste({ titel: 'Das Werkzeug startet nicht', satz: 'Nichts ist verloren: Annas Änderungen liegen in der Ablage.', knoepfe: WO.knopf('Speichern', 'pfeil', 'glas', { id: 'ws-speichern', klein: true, disabled: true }) });
  leere($('#ws-mitte')).append(el('div', { class: 'platte ws-karte ws-form', style: 'max-width:640px;margin-top:40px', 'data-ws-startfehler': (e && e.stichwort) || 'unerwartet' },
    mono('Das Werkzeug startet nicht'), el('h2', {}, text),
    el('p', {}, 'Die Prüfung läuft unabhängig vom Werkzeug und sagt, woran es liegt.'),
    el('div', { class: 'ws-reihe' }, el('a', { class: 'kn kn--d kn--klein', href: pruefLink(e && e.stichwort) }, el('span', {}, 'Prüfung öffnen'), el('i', { 'aria-hidden': 'true', html: PF })), taste('Noch einmal versuchen', () => location.reload()))));
}
async function start() {
  window.addEventListener('beforeunload', ev => { if (offenZahl() || (window.FSB && FSB.offen())) { ev.preventDefault(); ev.returnValue = ''; } });
  window.addEventListener('error', ev => merke(ev.message || 'Fehler im Werkzeug', 'unerwartet'));
  window.addEventListener('unhandledrejection', ev => merke((ev.reason && (ev.reason.fehler || ev.reason.message)) || 'Fehler im Werkzeug', (ev.reason && ev.reason.stichwort) || 'unerwartet'));
  document.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's' && Z.d) { ev.preventDefault(); if (offenZahl()) speichern(); else { FSB.jetzt(); melde('Alles gesichert', { mehr: 'Jede Änderung wird beim Schreiben gesichert. Online geht sie mit «Veröffentlichen».' }); } } });
  try {
    while (!window.FSB) await new Promise(r => setTimeout(r, 20));
    await Promise.all([ladeStand(), FSB.lade()]);
    const q = new URLSearchParams(location.search), h = location.hash.slice(1);
    let a = q.get('ansicht') || h;
    if (!a && window.top === window.self) { try { const o = JSON.parse(localStorage.getItem('fs-ort') || 'null'); if (o && ansichtName(o.a)) a = o.a; } catch (e) { /* ohne Merken */ } }
    if (a && ansichtName(a)) Z.ansicht = a;
    allesNeu();
    await zeichne({});
    setInterval(async () => {   // leise nachladen, wenn Anna auf der Seite arbeitet; nie mitten in einer Eingabe
      if (offenZahl() || $('.ws-ed') || $('#ws-fenster').childElementCount || document.hidden) return;
      try { const k = Z.d.kennung; const n = await ruf('GET', API + 'uebersicht'); if (n.kennung !== k) { Z.d = n; allesNeu(); if (Z.ansicht === 'wuensche' || Z.ansicht === 'start') zeichne({ halten: true }); } } catch (e) { /* still: nächstes Mal */ }
      if (FSB.offen()) return;
      const vor = FSB.lage(), sig = l => l ? [l.aenderungen.length, l.aenderungen.map(a => a.nr + a.zeit).join(), (l.verlauf[0] || {}).sha, (l.verlauf[0] || {}).online, (l.verlauf[0] || {}).bild].join('|') : '';
      try { const s0 = sig(vor); await FSB.lageNeu(true); if (sig(FSB.lage()) !== s0 && ['start', 'aenderungen', 'verlauf', 'pruefstand'].includes(Z.ansicht)) zeichne({ halten: true }); } catch (e) { /* still */ }
    }, 3000);   // alle 3 s: was Anna rechts in der Seite ändert, steht gleich links in der Liste (Robert 08.11.2026)
  } catch (e) { startFehler(e); }
}
window.WSB = { el, kn, taste, link, mono, quit, melde, fehler, fenster, auswahl, wahl2, kurz, mz, zeit, $, $$, leer: leere, Z,
  wer, offenZahl, speichern: () => speichern(), sende: (ops, opt) => sende(ops, opt), neuerWunsch: s => neuerWunsch(s), geh: (a, o) => geh(a, o),
  zeichne: o => zeichne(o), allesNeu: () => allesNeu(), kopf: () => kopf(), rand: () => rand(), leiste: () => leiste(),
  titel: (klein, a, b, satz, knoepfe, foto) => titel(klein, a, b, satz, knoepfe, foto), foto: k => FOTO(k) };
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && ansichtName(h) && h !== Z.ansicht) geh(h); });
start();
})();
