/* KI-Check · Tasty Studios (Neubau im Kleid, 07.11.2026). Aufbau, Ansichten und Bedienung aus Le Registre (vorlage/culinarium-demo/werkzeuge/registre/,
   registre.js), Rahmen wie Le Bureau (Kopf mit Zentrale, Prüfung, Anleitung; Quittung und Fenster), Kleid aus zentrale/oberflaeche/ (kleid/tasty).
   Inhalt aus auftraege/09-ki-check.md und der ersten Fassung: Liste aller Checks mit Haus, Mail, Ergebnis, Datum; Einzelansicht mit allen neun
   Bereichen; Mail-Vorlage an den Gast (nie verschickt); «In die Kundenliste»; Löschen mit Rückfrage; Probedaten laden und herausnehmen.
   Jede Änderung zeigt eine Quittung mit vorher, nachher und «Rückgängig». Daten nur über /api/09-ki-check/ (api.py, Ablage daten/09-ki-check/). */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const ZT = '<span class="zt" aria-hidden="true"></span>';   /* das T des Studios (WO_HAUS.zeichen) als Maske, Farbe aus der Schrift */
const SYM = {
  hoch: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2.5M2.8 5.6 6 2.4l3.2 3.2"/></svg>',
  laden: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.8 7.6 8 10.8l3.2-3.2M3 13.5h10"/></svg>',
  runter: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v7.5M2.8 6.4 6 9.6l3.2-3.2"/></svg>' };
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';   /* Kreuz wie Le Bureau (website.js), nicht der Pfeil von «Rückgängig» */
const API = '/zentrale/api/09-ki-check/';
const WERKZEUG = '09-ki-check';
/* Die neun Prüfbereiche in der Reihenfolge von pruefung.py, mit Gewicht (Punkte von 100) */
const PRUEF = [['roboter', 'Dürfen KI-Dienste lesen?', 15], ['struktur', 'Strukturierte Angaben zum Haus', 20], ['angaben', 'Das Wichtigste als Text', 15],
  ['angebot', 'Speisekarte, Zimmer und Preise als Text', 15], ['lesbar', 'Lesbar ohne Skripte', 15], ['llms', 'Ein Text für KI-Leser', 5],
  ['sprachen', 'Sprachen', 5], ['bewertungen', 'Bewertungen verlinkt', 5], ['ladezeit', 'Ladezeit', 5]];
const PNAME = Object.fromEntries(PRUEF.map(x => [x[0], x[1]]));
const NOTEN = ['Sehr gut', 'Gut', 'Ordentlich', 'Lückenhaft', 'Schwach'];
const AMPEL = { gut: 'Gut', mittel: 'Teilweise', schwach: 'Fehlt' };
const WERT = { gut: 1, mittel: .5, schwach: 0 };
const BEREICHE = [
  ['start', 'Übersicht', ''], ['', 'Die Häuser'], ['checks', 'Alle Checks', 'offen'], ['herkunft', 'Herkunft', ''], ['zeit', 'Zeit', ''],
  ['', 'Die Prüfung'], ['verlauf', 'Verlauf', ''], ['gespraech', 'Zur Kundenliste', ''], ['', 'Gut zu wissen'], ['geprueft', 'So wird geprüft', '']];
const TITEL = Object.fromEntries(BEREICHE.filter(x => x[0]).map(x => [x[0], x[1]]));
const WTAG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const OEFFENTLICH = 'check.html';
const S = { alle: [], d: null, grenzen: null, ansicht: 'start', tage: 30, wahl: '', filter: 'alle', zeige: 40, akte: '' };
/* Land eines Hauses: aus der Endung der Website, bei Probehäusern (lokale Adresse) aus der Endung der Mail */
const LAENDER = { ch: 'Schweiz', de: 'Deutschland', at: 'Österreich', li: 'Liechtenstein', it: 'Italien', fr: 'Frankreich', nl: 'Niederlande', dk: 'Dänemark' };
const SPRACHE = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', es: 'Spanisch', nl: 'Niederländisch', da: 'Dänisch' };

/* ---------- Helfer ---------- */
const n = x => Number(x || 0).toLocaleString('de-DE');
const mal = (z, eins, viele) => z === 1 ? eins : n(z) + ' ' + viele;
const tagIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const heuteIso = () => tagIso(new Date());
function schiebe(iso, tage) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + tage); return tagIso(d); }
function tagWort(iso, lang) {
  const d = new Date(iso + 'T12:00:00'), h = new Date(heuteIso() + 'T12:00:00'), diff = Math.round((h - d) / 864e5);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  return d.toLocaleDateString('de-DE', lang ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: '2-digit', month: '2-digit' });
}
const datum = iso => { const t = String(iso || '').slice(0, 10).split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : ''; };
const kurzDatum = iso => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.';
const uhr = c => String(c.zeit || '').slice(11, 16);
const ampelVon = p => p >= 70 ? 'gut' : p >= 50 ? 'mittel' : 'schwach';
const probe = c => /-p\d{3}$/.test(c.id || '');
const host = c => c.host && !/^www\./.test(c.host) ? c.host : String(c.url || c.adresse || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
function endung(c) {
  let h = ''; try { h = new URL(c.url || c.adresse || '').hostname; } catch (e) { /* */ }
  if (!h || /^(localhost|127\.|\d+\.\d+)/.test(h)) h = String(c.mail || '').split('@')[1] || '';
  const t = h.split('.').pop().toLowerCase(); return t && /^[a-z]{2,}$/.test(t) ? t : '';
}
function land(c) { const t = endung(c); return LAENDER[t] || (t === 'com' || t === 'net' || t === 'org' ? 'Ohne Landesendung' : t ? 'Endung .' + t : 'Nicht bekannt'); }
const bereich = (c, k) => (c.bereiche || []).find(x => x.schluessel === k) || null;
function prozent(x, stellen = 0) { return Number(x).toLocaleString('de-DE', { maximumFractionDigits: stellen }) + '&nbsp;%'; }

/* ---------- Server ---------- */
async function api(methode, weg, daten) {
  const opt = { method: methode, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (daten && methode !== 'GET') opt.body = JSON.stringify(daten);
  if (daten && methode === 'GET') weg += '?' + new URLSearchParams(daten).toString();
  let r, j = null;
  try { r = await fetch(API + weg, opt); } catch (e) { throw { stichwort: 'NETZ', fehler: 'Der Server antwortet nicht.' }; }
  try { j = await r.json(); } catch (e) { /* unten */ }
  if (!r.ok || !j) throw { stichwort: r.status === 404 ? 'CHECK' : 'SERVER', fehler: (j && j.fehler) || 'Unerwartete Antwort des Servers (' + r.status + ').' };
  return j;
}

/* ---------- Daten: alle Checks, daraus die Zahlen des Zeitraums ---------- */
async function lade() {
  const j = await api('GET', 'checks');
  S.alle = (j.checks || []).filter(c => c && c.id && c.note);
  if (!S.grenzen) { try { S.grenzen = (await api('GET', 'grenzen')).grenzen; } catch (e) { S.grenzen = null; } }
  rechne();
}
function rechne() {
  const bis = heuteIso(), von = schiebe(bis, -(S.tage - 1)), vvon = schiebe(von, -S.tage), vbis = schiebe(von, -1);
  const imZeitraum = (c, a, b) => { const t = String(c.zeit).slice(0, 10); return t >= a && t <= b; };
  const liste = S.alle.filter(c => imZeitraum(c, von, bis)).sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  const vorher = S.alle.filter(c => imZeitraum(c, vvon, vbis));
  const summe = l => ({ checks: l.length, punkte: l.length ? Math.round(l.reduce((a, c) => a + c.note.punkte, 0) / l.length) : null,
    offen: l.filter(c => !c.kundenliste).length, kundenliste: l.filter(c => c.kundenliste).length, sehrgut: l.filter(c => c.note.punkte >= 85).length,
    unter: l.filter(c => c.note.punkte < 70).length, heute: l.filter(c => String(c.zeit).slice(0, 10) === bis).length });
  const tage = []; for (let t = von; t <= bis; t = schiebe(t, 1)) tage.push(t);
  const je = l => tage.map((t, i) => { const v = l.filter(c => String(c.zeit).slice(0, 10) === t); return { tag: t, checks: v.length, kundenliste: v.filter(c => c.kundenliste).length }; });
  const vtage = tage.map(t => schiebe(t, -S.tage));
  const vor_tag = vtage.map(t => vorher.filter(c => String(c.zeit).slice(0, 10) === t).length);
  const zaehle = (l, f) => { const m = {}; l.forEach(c => { const k = f(c); if (k != null) m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(k => ({ k, n: m[k] })).sort((a, b) => b.n - a.n); };
  const fehlt = [];
  PRUEF.forEach(([k]) => { const z = liste.filter(c => (c.bereiche || []).some(b => b.schluessel === k && b.ampel !== 'gut')).length; if (z) fehlt.push({ k, n: z }); });
  fehlt.sort((a, b) => b.n - a.n);
  const ber = PRUEF.map(([k, name, g]) => {
    const z = { gut: 0, mittel: 0, schwach: 0 };
    liste.forEach(c => { const b = (c.bereiche || []).find(x => x.schluessel === k); if (b && z[b.ampel] != null) z[b.ampel]++; });
    const alle = z.gut + z.mittel + z.schwach;
    return { k, name, g, ...z, alle, anteil: alle ? z.gut / alle : 0, punkte: alle ? Math.round(g * (z.gut + z.mittel / 2) / alle * 10) / 10 : null };
  });
  /* Herkunft und Zeit (wie Le Registre): Länder, Sprachen der Website, Uhrzeit und Wochentag der Checks */
  const sprachen = {}; let einsprachig = 0, mehrsprachig = 0, ohneSprache = 0;
  liste.forEach(c => { const b = bereich(c, 'sprachen'), l = (b && b.details && b.details.sprachen) || [];
    l.forEach(x => { sprachen[x] = (sprachen[x] || 0) + 1; }); if (!l.length) ohneSprache++; else if (l.length === 1) einsprachig++; else mehrsprachig++; });
  const stunden = Array(24).fill(0), raster = Array.from({ length: 7 }, () => Array(24).fill(0));
  liste.forEach(c => { const z = String(c.zeit), h = +z.slice(11, 13), w = (new Date(z.slice(0, 10) + 'T12:00:00').getDay() + 6) % 7; if (h >= 0 && h < 24) { stunden[h]++; raster[w][h]++; } });
  const eigen = liste.filter(c => { const m = String(c.mail || '').split('@')[1] || '', h = String(c.url || '').replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    return m && h && !/^(localhost|127\.)/.test(h) ? h.endsWith(m) || m.endsWith(h) : !/^(gmail|gmx|web|t-online|bluewin|hotmail|outlook|yahoo|icloud|me|aol|freenet|posteo|proton)\./.test(m); }).length;
  S.d = { von, bis, tage: S.tage, vorher: Object.assign(summe(vorher), { von: vvon, bis: vbis }), summe: summe(liste), checks: liste, je_tag: je(liste), vor_tag,
    noten: NOTEN.map(w => ({ k: w, n: liste.filter(c => c.note.wort === w).length })).filter(x => x.n),
    arten: zaehle(liste, c => c.art || 'Haus'), laender: zaehle(liste, land), endungen: zaehle(liste, c => endung(c) ? '.' + endung(c) : null),
    sprachen: Object.keys(sprachen).map(k => ({ k, n: sprachen[k] })).sort((a, b) => b.n - a.n), umfang: [{ k: 'Mehrere Sprachen', n: mehrsprachig }, { k: 'Eine Sprache', n: einsprachig }, { k: 'Keine Sprache angegeben', n: ohneSprache }].filter(x => x.n),
    mails: [{ k: 'Adresse des Hauses', n: eigen }, { k: 'Andere Adresse', n: liste.length - eigen }].filter(x => x.n), stunden, raster, fehlt, ber, wochen: wochenAus(je(liste)), leer: !liste.length, probe: S.alle.some(probe), gesamt: S.alle.length };
}
function wochenAus(jt) {   /* wie registre.js: Woche Montag bis Sonntag, angebrochene am Rand */
  const w = [];
  jt.forEach(t => {
    const d = new Date(t.tag + 'T12:00:00'), mo = schiebe(t.tag, -((d.getDay() + 6) % 7)), x = w.length && w[w.length - 1].mo === mo ? w[w.length - 1] : null;
    if (x) { x.bis = t.tag; x.tage++; x.checks += t.checks; x.kundenliste += t.kundenliste; }
    else w.push({ mo, von: t.tag, bis: t.tag, tage: 1, checks: t.checks, kundenliste: t.kundenliste });
  });
  return w.map(({ mo, ...x }) => x);
}

/* ---------- Rahmen ---------- */
/* Kopf, Rand, Leiste und Startbild aus dem gemeinsamen Kleid (zentrale/oberflaeche/oberflaeche.js), Name nur aus WO_HAUS.namen */
const NAME = WO.name(WERKZEUG), ZENTRALE = WO.name('zentrale');
function kopfLeiste() {
  const u = S.d.summe;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: WERKZEUG, unter: 'Interessenten', titel: TITEL[S.ansicht] || NAME,
    stand: S.d.probe ? 'Probedaten · erfundene Häuser' : !S.d.gesamt ? 'Noch kein Check da' : u.offen ? mal(u.offen, 'Ein Check wartet', 'Checks warten') + ' auf die Kundenliste' : u.checks ? 'Alle Checks in der Kundenliste' : 'Im Zeitraum kein Check',
    pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WO_HAUS.wege.website, markeHref: '#start', marke: `data-gehe="start" aria-label="${esc(NAME)}, Übersicht"` });
  $$('#kopf [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
}
function rand() {
  const u = S.d.summe, an = S.ansicht, gruppen = [];
  BEREICHE.forEach(([key, name, zahl]) => {
    if (!key) { gruppen.push({ titel: name, eintraege: [] }); return; }
    if (!gruppen.length) gruppen.push({ titel: '', eintraege: [] });
    gruppen[gruppen.length - 1].eintraege.push({ text: name, an: an === key, zahl: zahl === 'offen' && u.offen ? n(u.offen) : 0, attr: `data-gehe="${key}"` });
  });
  gruppen.push({ titel: 'Wege', eintraege: [{ text: ZENTRALE, href: WO_HAUS.wege.zentrale, attr: 'data-weg' }, { text: 'Öffentliche Seite', href: OEFFENTLICH, attr: 'data-weg target="_blank" rel="noopener"' }, { text: 'Kurzer Rundgang', attr: 'data-weg data-rundgang' }] });
  $('#rand').innerHTML = WO.rand(gruppen, { website: WO_HAUS.wege.website, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  $$('#rand [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
  $$('#rand [data-rundgang]').forEach(a => a.onclick = () => { if (window.rundgang) window.rundgang(); });
  kopfLeiste();
}
function leiste() {
  const d = S.d, u = d.summe;
  const satz = !d.gesamt ? 'Noch kein Check da. Sobald jemand auf der öffentlichen Seite prüft, steht er hier.'
    : d.leer ? 'In den letzten ' + n(d.tage) + ' Tagen kam kein Check.'
      : 'Letzte ' + n(d.tage) + ' Tage: ' + mal(u.checks, 'ein Check', 'Checks') + ', Note im Schnitt ' + n(u.punkte) + ' von 100, ' + (u.kundenliste === 1 ? 'einer' : u.kundenliste ? n(u.kundenliste) : 'keiner') + ' in der Kundenliste.';
  const kn = (d.gesamt ? WO.knopf('Als Tabelle sichern', 'kopie', 'glas', { klein: true, id: 'l-export', titel: 'Alle Checks des Zeitraums als Tabelle (CSV, öffnet in Excel und Numbers)', attr: 'aria-label="Als Tabelle sichern"' }) : '')
    + (d.gesamt ? WO.knopf('Neu laden', 'verlauf', 'gold', { klein: true, id: 'l-neu', attr: 'aria-label="Neu laden"' }) : WO.knopf('Probedaten laden', 'plus', 'gold', { klein: true, id: 'l-probe' }));
  $('#leiste').innerHTML = WO.leiste({ titel: d.probe ? 'Du siehst Probedaten' : !d.gesamt ? 'Noch kein Check' : u.offen ? mal(u.offen, 'Ein Check wartet', 'Checks warten') : 'Alles in der Kundenliste',
    satz: d.probe ? 'Erfunden, damit du siehst, wie der KI-Check mit Anfragen aussieht.' : satz, entwurf: false, knoepfe: kn });
  if ($('#l-export')) $('#l-export').onclick = () => sichern();
  if ($('#l-neu')) $('#l-neu').onclick = () => frisch(true);
  if ($('#l-probe')) $('#l-probe').onclick = () => probedaten(true);
}
/* Bühne: je Ansicht ein eigenes Foto des Studios (WO_HAUS.fotos, nur Bilder der Agentur-Seite); die Übersicht «voll» mit dem Foto des Werkzeugs */
const BUEHNE = { start: [WO_HAUS.fotoJe[WERKZEUG], '50% 50%'], checks: ['bildschirm', '50% 45%'], verlauf: ['faehre', '50% 50%'],
  gespraech: ['empfang', '50% 40%'], geprueft: ['studio', '50% 50%'], herkunft: ['anleger', '50% 50%'], zeit: ['speicherstadt', '50% 50%'] };
function kopf(mono, titel, satz, rechts = '', chips = '') {
  const [bild, lage] = BUEHNE[S.ansicht] || BUEHNE.start, voll = S.ansicht === 'start';
  return WO.startbild({ werkzeug: WERKZEUG, art: voll ? 'voll' : 'buehne', foto: WO_HAUS.fotos[bild] || WO_HAUS.foto, zier: mono, h1: titel, satz,
    knoepfe: (voll ? WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) : '') + chips + rechts })
    .replace('<section class="wo-sb', `<section style="--wo-foto-pos:${lage}" class="buehne wo-sb`);
}
function chipsStart(d) {
  const u = d.summe; if (d.leer) return '';
  return `<ul class="buehne__chips"><li><b>${n(u.checks)}</b><span>Checks</span></li><li><b>${n(u.offen)}</b><span>warten</span></li><li><b>${u.punkte == null ? '–' : n(u.punkte)}</b><span>Schnitt</span></li><li><b>${n(u.kundenliste)}</b><span>Kundenliste</span></li></ul>`;
}
function zeitraum() {
  const k = t => `<button type="button" data-tage="${t}" class="${S.tage === t ? 'an' : ''}" aria-pressed="${S.tage === t}">${t} Tage</button>`;
  return `<div class="wahl3 wo-seg zeitraum" role="group" aria-label="Zeitraum">${k(7)}${k(30)}${k(90)}</div>`;
}
function hinweisProbe() {
  return S.d.probe ? `<p class="bsp-band"><b>Probedaten.</b> Die Häuser sind erfunden und zeigen, wie der KI-Check mit Anfragen aussieht. <button class="link-i" type="button" data-probe-raus>Probedaten herausnehmen</button></p>` : '';
}
function gehe(ziel, wahl) {
  if (ziel === 'bereiche') ziel = 'geprueft';
  if (!TITEL[ziel]) ziel = 'start';
  if (S.akte) akteZu();
  const neu = ziel !== S.ansicht;
  S.ansicht = ziel;
  if (wahl !== undefined) S.wahl = wahl;
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]check=[^&]*/, '').replace(/^&/, '?') + '#' + ziel);
  rand(); zeichne();
  if (neu) window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
const finde = id => S.alle.find(c => c.id === id);
async function frisch(sagen = false, ruhig = false) {
  try {
    await lade();
    rand(); leiste(); zeichne(ruhig);
    if (S.akte && finde(S.akte) && S.d.checks.some(c => c.id === S.akte)) akteAuf(S.akte, true); else if (S.akte) akteZu();
    if (sagen) melde('Neu geladen', mal(S.alle.length, 'ein Check', 'Checks') + ' in der Ablage.');
  } catch (e) { fehler(e); }
}

/* ---------- Quittung, Meldung, Fenster (wie Le Bureau) ---------- */
function quitt(titel, text, knoepfe = [], fehl = false) {
  const ort = $('#quittung');
  const k = document.createElement('div');
  k.className = 'kc-quit' + (fehl ? ' fehl' : ''); k.setAttribute('role', fehl ? 'alert' : 'status');
  k.innerHTML = `<div class="kc-quit__t"><b>${esc(titel)}</b>${text ? `<span>${text}</span>` : ''}</div>`;
  knoepfe.forEach(x => k.appendChild(x));
  const zu = document.createElement('button'); zu.type = 'button'; zu.className = 'kc-rund'; zu.setAttribute('aria-label', 'Schliessen'); zu.innerHTML = ZU; zu.onclick = () => k.remove(); k.appendChild(zu);
  ort.innerHTML = ''; ort.appendChild(k);
  return k;
}
function taste(text, tun, href) {
  const b = document.createElement(href ? 'a' : 'button'); b.className = 'kc-taste';
  if (href) b.href = href; else { b.type = 'button'; b.onclick = tun; }
  b.textContent = text; return b;
}
function melde(titel, text, zeit = 4000) { const k = quitt(titel, esc(text)); if (zeit) setTimeout(() => k.remove(), zeit); }
function fehler(e) {
  const st = (e && e.stichwort) || 'SERVER', t = (e && (e.fehler || e.message)) || String(e);
  quitt(st + ' · ' + t, 'Nichts wurde geändert.', [taste('Was tun?', null, 'pruefung.html#' + st)], true);
}
/* Quittung einer Änderung: was, wo, vorher, nachher, und «Rückgängig» (CLAUDE.md) */
function quittung(titel, was, vorher, nachher, zurueck) {
  const text = `${esc(was)}: «<span data-q="vorher">${esc(vorher)}</span>» wird «<span data-q="nachher">${esc(nachher)}</span>»`;
  const k = quitt(titel, text, zurueck ? [taste('Rückgängig', async () => { k.remove(); try { await zurueck(); } catch (e) { fehler(e); } })] : []);
  k.dataset.quittung = '1';
  return k;
}
function fenster(titel, akzent, inhalt, knoepfe, name) {
  const ort = $('#fenster');
  const zu = () => { ort.innerHTML = ''; document.removeEventListener('keydown', taste_); if (vorher && vorher.focus) vorher.focus(); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const vorher = document.activeElement;
  ort.innerHTML = `<div class="kc-fenster"><button class="kc-fenster__grund" type="button" aria-label="Schliessen"></button>
    <div class="kc-fenster__blatt" role="dialog" aria-modal="true" aria-label="${esc(titel + ' ' + akzent)}" data-fenster="${esc(name || '1')}"><h2>${esc(titel)} <em>${esc(akzent)}</em></h2>${inhalt}<div class="kc-fenster__kn"></div></div></div>`;
  $('.kc-fenster__grund', ort).onclick = zu;
  const kn = $('.kc-fenster__kn', ort);
  knoepfe.forEach(k => {
    const b = document.createElement('div'); b.innerHTML = k.haupt ? WO.knopf(k.text, k.zeichen || 'haken', 'dunkel', { klein: true }) : `<button class="link" type="button">${esc(k.text)}</button>`;
    const el = b.firstElementChild; el.onclick = () => (k.tun ? k.tun(zu) : zu()); kn.appendChild(el);
  });
  document.addEventListener('keydown', taste_);
  const erst = $('.kc-fenster__kn .wo-kn', ort) || $('.kc-fenster__kn button', ort); if (erst) erst.focus();
  return zu;
}

/* ---------- Änderungen ---------- */
async function kundenliste(id) {
  const c = finde(id); if (!c) return;
  const war = !!c.kundenliste, wort = x => x ? 'vorgemerkt' : 'nicht vorgemerkt';
  try {
    await api('POST', 'kundenliste', { id, zurueck: war });
    await frisch(false, true);
    quittung(war ? 'Aus der Kundenliste genommen' : 'In die Kundenliste übernommen', 'Kundenliste · ' + c.haus, wort(war), wort(!war), async () => {
      await api('POST', 'kundenliste', { id, zurueck: !war }); await frisch(false, true);
      melde('Rückgängig gemacht', c.haus + ' ist wieder ' + wort(war) + '.');
    });
  } catch (e) { fehler(e); }
}
function loeschenFragen(id) {
  const c = finde(id); if (!c) return;
  fenster('Check', 'löschen?', `<p class="kc-fenster__satz">Der Check von <b>${esc(c.haus)}</b> vom ${esc(datum(c.zeit))} (${esc(c.note.wort)}, ${n(c.note.punkte)} von 100) verschwindet aus der Liste. Direkt danach lässt er sich mit «Rückgängig» zurückholen.</p>`,
    [{ text: 'Abbrechen' }, { text: 'Ja, löschen', zeichen: 'haken', haupt: true, tun: zu => { zu(); loeschen(id); } }], 'loeschen');
}
async function loeschen(id) {
  const c = finde(id); if (!c) return;
  try {
    const j = await api('DELETE', 'check', { id });
    if (S.wahl === id) S.wahl = '';
    if (S.akte === id) akteZu();
    await frisch(false, true);
    quittung('Check gelöscht', c.haus, 'Check vom ' + datum(c.zeit), 'gelöscht', async () => {
      await api('POST', 'wiederherstellen', { check: j.geloescht }); S.wahl = id; await frisch(false, true);
      melde('Rückgängig gemacht', 'Der Check von ' + c.haus + ' ist wieder da.');
    });
  } catch (e) { fehler(e); }
}
async function probedaten(rein) {
  const vorher = S.alle.length;
  try {
    const j = await api('POST', 'probedaten', rein ? {} : { zurueck: true });
    await frisch();
    quittung(rein ? 'Probedaten geladen' : 'Probedaten herausgenommen', 'Checks in der Ablage', mal(vorher, 'ein Check', 'Checks'), mal(S.alle.length, 'ein Check', 'Checks'), async () => {
      await api('POST', 'probedaten', rein ? { zurueck: true } : {}); await frisch();
      melde('Rückgängig gemacht', rein ? 'Die Probedaten sind wieder draussen.' : 'Die Probedaten sind wieder da.');
    });
    if (!j.anzahl) melde('Nichts geändert', rein ? 'Die Probedaten waren schon da.' : 'Es waren keine Probedaten da.');
  } catch (e) { fehler(e); }
}
async function mailZeigen(id) {
  const c = finde(id); if (!c) return;
  let m;
  try { m = (await api('GET', 'mail', { id })).mail; } catch (e) { fehler(e); return; }
  const text = 'Betreff: ' + m.betreff + '\n\n' + m.text;
  fenster('Mail', 'an den Gast', `<p class="kc-fenster__satz">Fertige Vorlage mit dem Ergebnis. Sie wird hier <b>nicht verschickt</b>; ein Versand ist in diesem Werkzeug nicht eingebaut.</p>
    <dl class="angaben angaben--mail"><div><dt>An</dt><dd>${esc(m.an)}</dd></div><div><dt>Betreff</dt><dd>${esc(m.betreff)}</dd></div></dl>
    <pre class="kc-mail" tabindex="0">${esc(m.text)}</pre>`,
    [{ text: 'Schliessen' }, { text: 'Text kopieren', zeichen: 'kopie', haupt: true, tun: async zu => {
      try { await navigator.clipboard.writeText(text); zu(); melde('Text kopiert', 'Mail an ' + m.an + ' · nicht verschickt.'); }
      catch (e) { const r = document.createRange(); r.selectNodeContents($('.kc-mail')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); melde('Text markiert', 'Mit Strg+C oder ⌘C kopieren.'); }
    } }], 'mail');
}

/* ---------- Datenexport: alle Checks des Zeitraums als Tabelle ---------- */
function zelle(x) {
  let t = String(x == null ? '' : x);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;   /* keine Formeln in Excel (CSV-Einschleusung) */
  return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function tabelle(liste) {
  const kopf = ['Haus', 'Art', 'Website', 'Mail', 'Ansprechpartner', 'Tag', 'Uhrzeit', 'Note', 'Punkte', 'Kundenliste'].concat(PRUEF.map(x => x[1]));
  const zeilen = liste.map(c => [c.haus, c.art, c.url, c.mail, c.name, datum(c.zeit), uhr(c), c.note.wort, c.note.punkte, c.kundenliste ? 'vorgemerkt ' + datum(c.kundenliste) : 'nein']
    .concat(PRUEF.map(([k]) => { const b = (c.bereiche || []).find(x => x.schluessel === k); return b ? AMPEL[b.ampel] || b.ampel : ''; })));
  return '﻿' + [kopf].concat(zeilen).map(z => z.map(zelle).join(';')).join('\r\n') + '\r\n';
}
function sichern() {
  const d = S.d;
  try {
    const name = 'ki-checks-' + d.von + '-bis-' + d.bis + (d.probe ? '-mit-probedaten' : '') + '.csv';
    const url = URL.createObjectURL(new Blob([tabelle(d.checks)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    melde('Als Tabelle gesichert', name + ' · ' + mal(d.checks.length, 'ein Check', 'Checks'), 6000);
  } catch (e) { fehler({ stichwort: 'TABELLE', fehler: 'Die Tabelle liess sich nicht sichern.' }); }
}

/* ---------- Bausteine ---------- */
function balken(liste, name, klein, gesamt) {   /* Rangliste: Name, Balken, Zahl, Anteil. Der Balken wächst nur über transform. */
  if (!liste.length) return '<p class="nichts">Noch nichts gezählt.</p>';
  const max = Math.max(...liste.map(x => x.n)), ges = gesamt || liste.reduce((a, x) => a + x.n, 0);
  return `<ol class="rang">${liste.map((x, i) => `<li style="--i:${i}"><span class="rang__n">${name(x)}${klein ? `<small>${klein(x)}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, x.n / max).toFixed(3)}"></i></span><b>${n(x.n)}</b><em>${Math.round(100 * x.n / (ges || 1))}&nbsp;%</em></li>`).join('')}</ol>`;
}
function vergleich(jetzt, vorher, umgekehrt) {
  if (jetzt == null || !vorher) return '<small class="vgl">&nbsp;</small>';
  const p = Math.round(100 * (jetzt - vorher) / vorher);
  if (!p) return '<small class="vgl">gleich wie davor</small>';
  const gut = umgekehrt ? p < 0 : p > 0;
  return `<small class="vgl ${gut ? 'gut' : 'weniger'}">${p > 0 ? SYM.hoch : SYM.runter}${p > 0 ? '+' : '−'}${Math.abs(p)}&nbsp;% zu davor</small>`;
}
function saeulen(werte, beschrift, tip, klasse = '', vorher) {
  const max = Math.max(1, ...werte, ...(vorher || []));
  return `<div class="saeulen ${klasse}" style="--n:${werte.length}" role="img" aria-label="${esc(tip.label)}">
    ${werte.map((z, i) => `<div class="s" style="--i:${Math.round(i * 30 / werte.length)}" data-t="${esc(tip(i, z))}">${vorher ? `<u style="--h:${(vorher[i] / max).toFixed(3)}"></u>` : ''}<i style="--h:${z ? Math.max(.025, z / max).toFixed(3) : 0}"></i>${beschrift(i) ? `<span>${beschrift(i)}</span>` : ''}</div>`).join('')}
  </div>`;
}
/* ---------- Zeile eines Checks (Neuordnung 17.11.2026): Prüfsiegel mit Note, Haus, Zeichen der neun Bereiche, Zeit, Stand. Ein Klick öffnet die Prüfakte. ---------- */
/* ---------- Prüfsiegel (Robert 17.11.2026): die neun Bereiche als Zifferblatt um die Note. Jeder Bogen so lang, wie der Bereich zählt;
   voll = erfüllt, halb = teilweise, rote Linie = fehlt. Gross in der Prüfakte mit Zeichen je Bereich, Zeiger und Punkte-Kranz. ---------- */
const ICON = {
  roboter: '<rect x="3" y="5" width="10" height="8" rx="2.2"/><path d="M8 5V2.4M6.1 9h.01M9.9 9h.01"/>',
  struktur: '<path d="M6 2.5c-1.5 0-1.5 1-1.5 2.5v1.2c0 .9-.6 1.8-1.5 1.8.9 0 1.5.9 1.5 1.8V11c0 1.5 0 2.5 1.5 2.5M10 2.5c1.5 0 1.5 1 1.5 2.5v1.2c0 .9.6 1.8 1.5 1.8-.9 0-1.5.9-1.5 1.8V11c0 1.5 0 2.5-1.5 2.5"/>',
  angaben: '<path d="M3 4h10M3 8h10M3 12h6"/>',
  angebot: '<path d="M2.5 8.6V3.2c0-.4.3-.7.7-.7h5.4l5 5-6.1 6.1z"/><circle cx="5.6" cy="5.6" r="1"/>',
  lesbar: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  llms: '<path d="M8 2l1.4 4.6L14 8l-4.6 1.4L8 14l-1.4-4.6L2 8l4.6-1.4z"/>',
  sprachen: '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c1.8 1.8 1.8 9.2 0 11M8 2.5c-1.8 1.8-1.8 9.2 0 11"/>',
  bewertungen: '<path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z"/>',
  ladezeit: '<path d="M9 1.8 3.8 9h4l-1 5.2L12.2 7h-4z"/>'
};
const ikon = k => `<svg viewBox="0 0 16 16" aria-hidden="true">${ICON[k] || ''}</svg>`;
const POL = (m, r, a) => [m + r * Math.sin(a * Math.PI / 180), m - r * Math.cos(a * Math.PI / 180)];
const BOGEN = (m, r, a1, a2) => { const [x1, y1] = POL(m, r, a1), [x2, y2] = POL(m, r, a2); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
function boegen(luecke) {
  const frei = 360 - PRUEF.length * luecke; let a = luecke / 2;
  return PRUEF.map(([k, name, g]) => { const s = g / 100 * frei, b = { k, name, g, a1: a, a2: a + s, m: a + s / 2 }; a += s + luecke; return b; });
}
function siegel(c, gross) {
  const W = gross ? 340 : 200, m = W / 2, r = gross ? 112 : 82, sw = gross ? 15 : 16, B = boegen(gross ? 3.4 : 5.5);
  const ampel = k => (bereich(c, k) || {}).ampel || 'schwach';
  const bahn = B.map(b => `<path class="sg__b" d="${BOGEN(m, r, b.a1, b.a2)}" stroke-width="${sw}"/>`).join('');
  const teile = B.map((b, i) => { const a = ampel(b.k);
    const d = a === 'gut' ? `<path class="sg__f" d="${BOGEN(m, r, b.a1, b.a2)}" stroke-width="${sw}"/>`
      : a === 'mittel' ? `<path class="sg__f sg__f--m" d="${BOGEN(m, r, b.a1, b.a1 + (b.a2 - b.a1) / 2)}" stroke-width="${sw}"/>`
      : `<path class="sg__x" d="${BOGEN(m, r, b.a1 + .4, b.a2 - .4)}" stroke-width="${gross ? 2 : 4}"/>`;
    return `<g class="sg__s sg__s--${a}" data-k="${i}" data-m="${b.m.toFixed(2)}">${d}</g>`; }).join('');
  if (!gross) return `<span class="sg sg--klein sg--${ampelVon(c.note.punkte)}" aria-hidden="true"><svg viewBox="0 0 ${W} ${W}">${bahn}${teile}</svg><b>${n(c.note.punkte)}</b></span>`;
  const ri = r - sw / 2 - 9;
  const strich = (j, cls) => { const lang = j % 10 === 0, [x1, y1] = POL(m, ri, j * 3.6), [x2, y2] = POL(m, ri - (lang ? 9 : 4.5), j * 3.6); return `<line class="${cls}${lang ? ' lang' : ''}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`; };
  const ticks = Array.from({ length: 100 }, (_, j) => strich(j, 'sg__t')).join('');
  const lichter = Array.from({ length: 100 }, (_, j) => strich(j, 'sg__l')).join('');
  const zeichen = B.map((b, i) => { const a = ampel(b.k), [x, y] = POL(m, r + 34, b.m);
    return `<g class="sg__z sg__z--${a}" data-k="${i}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><g class="sg__zi"><title>${esc(b.name)}: ${esc(AMPEL[a])}</title><circle r="15"/><g transform="translate(-7 -7) scale(.875)">${ICON[b.k]}</g></g></g>`; }).join('');
  const ra = r + sw / 2 + 6, rn = ri - 12, [ax, ay] = POL(m, ra, -16), [bx, by] = POL(m, rn, -16);
  const zeiger = `<g class="sg__zeiger" style="transform-origin:${m}px ${m}px"><path class="sg__keil" d="M${bx.toFixed(2)} ${by.toFixed(2)}L${ax.toFixed(2)} ${ay.toFixed(2)}A${ra} ${ra} 0 0 1 ${m} ${m - ra}L${m} ${m - rn}A${rn} ${rn} 0 0 0 ${bx.toFixed(2)} ${by.toFixed(2)}Z"/><line class="sg__nadel" x1="${m}" y1="${m - rn}" x2="${m}" y2="${m - ra}"/></g>`;
  return `<div class="sg sg--gross"><svg viewBox="0 0 ${W} ${W}">
      <circle class="sg__kranz" cx="${m}" cy="${m}" r="${r + sw / 2 + 12}" style="transform-origin:${m}px ${m}px"/>
      <circle class="sg__hof" cx="${m}" cy="${m}" r="${r + sw / 2 + 5}"/>
      ${ticks}<g class="sg__lichter">${lichter}</g>${zeiger}${bahn}${teile}${zeichen}</svg>
    <span class="sg__mitte"><span class="mono">Punkte</span><b data-summe>${n(c.note.punkte)}</b><small>von 100</small></span></div>
    <p class="sg-cap" aria-live="polite"><span class="mono" data-cap-k>Neun Bereiche</span><b data-cap>Auf ein Zeichen tippen, um den Bereich zu öffnen</b></p>`;
}
/* Zeichen der neun Bereiche als Reihe für die Liste: erfüllt dunkel, teilweise mit Ring, fehlt rot. */
function zeichenReihe(c) {
  return `<span class="kc-zr" role="img" aria-label="${PRUEF.map(([k, name]) => name + ': ' + AMPEL[(bereich(c, k) || {}).ampel || 'schwach']).join(', ')}">${PRUEF.map(([k, name]) => { const a = (bereich(c, k) || {}).ampel || 'schwach';
    return `<i class="kc-zr__i kc-zr__i--${a}" data-t="${esc(name)} · ${esc(AMPEL[a])}">${ikon(k)}</i>`; }).join('')}</span>`;
}
const luecken = c => (c.bereiche || []).filter(b => b.ampel !== 'gut').sort((a, b) => b.gewicht * (1 - (WERT[b.ampel] || 0)) - a.gewicht * (1 - (WERT[a.ampel] || 0)));
const KURZ = { roboter: 'KI-Leser gesperrt', struktur: 'Strukturierte Angaben', angaben: 'Angaben als Text', angebot: 'Karte und Zimmer', lesbar: 'Lesbar ohne Skripte',
  llms: 'llms.txt', sprachen: 'Sprachen', bewertungen: 'Bewertungen', ladezeit: 'Antwortzeit' };
function alter(c) {
  const d = Math.round((new Date(heuteIso() + 'T12:00:00') - new Date(String(c.zeit).slice(0, 10) + 'T12:00:00')) / 864e5);
  return d <= 0 ? 'heute' : d === 1 ? 'gestern' : 'vor ' + n(d) + ' Tagen';
}
function seit(c) {
  const d = Math.round((new Date(heuteIso() + 'T12:00:00') - new Date(String(c.zeit).slice(0, 10) + 'T12:00:00')) / 864e5);
  return d <= 0 ? 'Seit heute' : d === 1 ? 'Seit gestern' : 'Seit ' + n(d) + ' Tagen';
}
function stand(c) {
  if (c.kundenliste) return ['kl', 'Kundenliste'];
  return c.note.punkte < 70 ? ['anlass', 'Gesprächsanlass'] : ['warten', 'Wartet'];
}
function zeile(c, o = {}) {
  const [sk, sw] = stand(c);
  return `<div class="kc-z${S.akte === c.id ? ' aktiv' : ''}" role="button" tabindex="0" data-akte="${esc(c.id)}" aria-label="Prüfakte ${esc(c.haus)} öffnen">
    <span class="kc-note kc-note--${ampelVon(c.note.punkte)}"><b>${n(c.note.punkte)}</b><small>von 100</small></span>
    <span class="kc-z__haus"><b>${esc(c.haus)}</b><small>${esc(c.art || 'Haus')} · ${esc(host(c))}</small></span>
    ${farbLeiste(c)}
    <span class="kc-z__wann">${o.seit ? `<b>${esc(seit(c))}</b><small>${esc(tagWort(String(c.zeit).slice(0, 10)))}, ${esc(uhr(c))} Uhr</small>` : `<b>${esc(tagWort(String(c.zeit).slice(0, 10)))}</b><small>${esc(uhr(c))} Uhr</small>`}</span>
    <span class="kc-stand kc-stand--${sk}">${esc(sw)}</span>
    <i class="kc-z__pfeil" aria-hidden="true">${WO.ic('rechts')}</i>
    ${fehltListe(c)}</div>`;
}
/* Leiste rot – gelb – grün mit Marker an der Note, darunter aufklappbar, was noch fehlt (Robert 17.11.2026). */
function farbLeiste(c) {
  const p = Math.max(0, Math.min(100, c.note.punkte)), L = luecken(c);
  return `<span class="kc-z__pruef kc-fl">
      <span class="kc-fl__bahn" role="img" aria-label="${n(p)} von 100 Punkten"><i class="kc-fl__m" style="left:calc(${p}% - ${(p * .18).toFixed(1)}px)"></i></span>
      <span class="kc-fl__skala" aria-hidden="true"><i>0</i><i>50</i><i>100</i></span>
      ${L.length ? `<button class="kc-fl__auf" type="button" data-fehlt aria-expanded="false">Was noch fehlt <b>${n(L.length)}</b>${PFEIL_RUNTER}</button>` : '<span class="kc-fl__voll">Alle neun Bereiche erfüllt</span>'}
    </span>`;
}
const PFEIL_RUNTER = '<svg class="kc-fl__pf" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.6 6 7.6l3-3"/></svg>';
function fehltListe(c) {
  const L = luecken(c); if (!L.length) return '';
  return `<div class="kc-fehlt" hidden><ul>${L.map(b => { const weg = Math.round(b.gewicht * (1 - (WERT[b.ampel] || 0)) * 10) / 10;
    return `<li class="kc-fehlt__i kc-fehlt__i--${esc(b.ampel)}"><span class="kc-fehlt__z" aria-hidden="true">${ikon(b.schluessel)}</span>
      <span class="kc-fehlt__t"><b>${esc(PNAME[b.schluessel] || b.titel)}</b><small>${esc(b.befund || '')}</small></span>
      <span class="kc-fehlt__p"><b>${b.ampel === 'mittel' ? 'Teilweise' : 'Fehlt'}</b><small>kostet ${n(weg)} Punkte</small></span></li>`; }).join('')}</ul></div>`;
}
function zeilenTage(l) {
  let letzter = '', aus = '';
  l.forEach(x => { const t = String(x.zeit).slice(0, 10);
    if (t !== letzter) { const z = l.filter(y => String(y.zeit).slice(0, 10) === t).length; aus += `<p class="kc-tag"><b>${esc(tagWort(t, true))}</b><span>${mal(z, 'ein Check', 'Checks')}</span></p>`; letzter = t; }
    aus += zeile(x); });
  return aus;
}
function leer() {
  const nichts = !S.d.gesamt;
  return `<div class="leer blatt">${ZT}<b>${nichts ? 'Noch kein Check da.' : 'In diesem Zeitraum kein Check.'}</b>
    <p>${nichts ? 'Sobald ein Hotel oder Restaurant auf der öffentlichen Seite seine Website prüft, steht der Check hier: mit Haus, Mail, Note und allen neun Bereichen.' : 'Ein längerer Zeitraum zeigt ältere Checks.'}</p>
    ${nichts ? `<button class="kn kn--linie" type="button" data-probe-rein>Probedaten laden<i>${PF}</i></button>` : ''}</div>`;
}

/* ---------- Ansichten ---------- */
function zeichne(ruhig) {
  const el = $('#ansicht');
  const f = { checks, herkunft, zeit, verlauf, gespraech, geprueft }[S.ansicht] || start;
  el.innerHTML = f();
  verbinde(el);
  document.title = (TITEL[S.ansicht] || NAME) + ' · ' + NAME + ' · ' + WO_HAUS.name;
  schweben(el, ruhig);
}
function verbinde(el) {
  $$('[data-gehe]', el).forEach(b => b.onclick = e => { e.preventDefault(); if (b.dataset.filterSetze) { S.filter = b.dataset.filterSetze; S.zeige = 40; } gehe(b.dataset.gehe, b.dataset.wahl); });
  $$('[data-akte]', el).forEach(b => { b.onclick = e => { if (e.target.closest('.kc-fehlt, [data-fehlt]')) return; e.preventDefault(); akteAuf(b.dataset.akte); };
    if (b.tagName !== 'BUTTON') b.onkeydown = e => { if (e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); akteAuf(b.dataset.akte); } }; });
  /* Aufklappen als Schublade wie im Sales Cockpit (Robert 16./17.11.2026: jedes Aufklappen seitenweit luxuriös), gemeinsam aus /zentrale/oberflaeche/schublade.js */
  $$('[data-fehlt]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const z = b.closest('.kc-z'), f = $('.kc-fehlt', z);
    WO_SCHUBLADE([{ teil: f, huelle: z, setze: v => { f.hidden = !v; b.setAttribute('aria-expanded', v); z.classList.toggle('offen', v); } }], f.hidden); });
  $$('[data-tage]', el).forEach(b => b.onclick = () => { if (S.tage === +b.dataset.tage) return; S.tage = +b.dataset.tage; S.zeige = 40; try { localStorage.setItem('tasty-ki-check-tage', S.tage); } catch (e) { /* privat */ } rechne(); rand(); leiste(); zeichne(); });
  $$('[data-probe-rein]', el).forEach(b => b.onclick = () => probedaten(true));
  $$('[data-probe-raus]', el).forEach(b => b.onclick = () => probedaten(false));
  $$('[data-sichern]', el).forEach(b => b.onclick = () => sichern());
  $$('[data-filter]', el).forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.zeige = 40; zeichne(true); });
  $$('[data-mehr]', el).forEach(b => b.onclick = () => { S.zeige += 60; zeichne(true); });
  $$('[data-kl]', el).forEach(b => b.onclick = () => kundenliste(b.dataset.kl));
  $$('[data-mail]', el).forEach(b => b.onclick = () => mailZeigen(b.dataset.mail));
  $$('[data-weg-loeschen]', el).forEach(b => b.onclick = () => loeschenFragen(b.dataset.wegLoeschen));
}
/* Schweben (Rezeptur aus Le Registre): sobald ein Blatt am unteren Rand auftaucht, schwebt es an seinen Platz (.rg-da); Balken und Säulen wachsen,
   wenn ihr Blatt gut zur Hälfte im Bild ist (.rg-los). Nur transform und opacity. */
let IO = null, IO_LOS = null;
function schweben(el, still) {
  if (IO) IO.disconnect();
  if (IO_LOS) IO_LOS.disconnect();
  const ziele = [];
  const nimm = (sel, reihe) => $$(sel, el).forEach(x => { if (x.dataset.r) return; x.dataset.r = '1'; x.style.setProperty('--i', reihe ? Math.min([...x.parentNode.children].indexOf(x), 3) : 0); ziele.push(x); });
  nimm('.bsp-band, .kc-filter, .band, .tabelle, .leer, .zw, .mehr, .wenig, #ansicht > .blatt:not(.kc-liste), #ansicht > .tafel, #ansicht > .wo-lage, #ansicht > .gp-nie, #ansicht > .fein, .vl-wochen', false);
  nimm('.kc-liste > .kc-z, .kc-liste > .kc-tag, .kc-liste > .weitere', true);
  nimm('.zahlen > .blatt, .zwei > .blatt, .stapel > .blatt, .werte > .wert, .vks > .vk, .gps > .gp, .gp-wissen > .blatt', true);
  const ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (still) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los', 'rg-ruhig')); return; }
  if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los')); return; }
  IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-da'); IO.unobserve(e.target); } }), { rootMargin: '0px 0px 8% 0px' });
  IO_LOS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-los'); IO_LOS.unobserve(e.target); } }), { threshold: .45 });
  const WACHS = '.saeulen .s i,.rang__b i,.trichter li i,.vk__b i,.ws__s i,.gp-band i,.kc-weg__st i,.gp-skala__p';
  ziele.filter(x => x.querySelector(WACHS)).forEach(x => IO_LOS.observe(x));
  ziele.filter(x => !x.querySelector(WACHS)).forEach(x => x.classList.add('rg-los'));
  ziele.forEach(x => IO.observe(x));
}

function start() {
  const d = S.d, u = d.summe, v = d.vorher;
  const gruss = /[?&]gruss=tag/.test(location.search) ? 'Guten Tag.' : WO.gruss();
  const satzS = 'Jeder KI-Check, den ein Hotel oder Restaurant auf der öffentlichen Seite macht: wie gut ChatGPT und andere KI-Dienste das Haus finden, was fehlt, und wer schon in der Kundenliste steht.';
  let aus = kopf(esc(NAME + ' · ' + WO_HAUS.name), `${gruss}<br><em>Wer hat geprüft?</em>`, satzS, zeitraum(), chipsStart(d)) + hinweisProbe();
  if (d.leer) return aus + leer();
  const viele = d.je_tag.length, schritt = viele <= 7 ? 1 : viele <= 31 ? 5 : 15;
  aus += `<div class="zahlen">
      <div class="blatt"><span class="mono">Checks</span><b>${n(u.checks)}</b>${vergleich(u.checks, v.checks)}</div>
      <div class="blatt"><span class="mono">Note im Schnitt</span><b>${u.punkte == null ? '–' : n(u.punkte)}</b><small>Punkte von 100</small></div>
      <div class="blatt"><span class="mono">Warten</span><b>${n(u.offen)}</b><small>noch nicht in der Kundenliste</small></div>
      <div class="blatt"><span class="mono">In der Kundenliste</span><b>${n(u.kundenliste)}</b><small>${u.checks ? prozent(100 * u.kundenliste / u.checks) + ' der Checks' : '&nbsp;'}</small></div>
    </div>
    <section class="blatt tafel">
      <header><h3>Checks je Tag</h3><p>${esc(datum(d.von))} bis ${esc(datum(d.bis))}<span style="white-space:nowrap">&nbsp;· <button class="link" type="button" data-gehe="verlauf">Verlauf</button></span></p></header>
      ${saeulen(d.je_tag.map(t => t.checks), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(d.je_tag[i].tag) : '', Object.assign((i, z) => tagWort(d.je_tag[i].tag) + ': ' + mal(z, 'ein Check', 'Checks'), { label: 'Checks je Tag' }))}
    </section>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Wie die Häuser abschneiden</h3><button class="link" type="button" data-gehe="checks">Alle Checks</button></header>
          ${balken(d.noten, x => esc(x.k), null, u.checks)}</section>
        <section class="blatt"><header><h3>Hotel oder Restaurant</h3></header>${balken(d.arten, x => esc(x.k), null, u.checks)}</section>
      </div>
      <section class="blatt"><header><h3>Was am häufigsten fehlt</h3><button class="link" type="button" data-gehe="geprueft">Alle Bereiche</button></header>
        ${balken(d.fehlt.slice(0, 7), x => esc(PNAME[x.k]), x => 'zählt ' + (PRUEF.find(p => p[0] === x.k) || [])[2] + ' von 100 Punkten', u.checks)}</section>
    </div>
    <h2 class="zw">Zuletzt <em>geprüft</em></h2>
    <section class="blatt kc-liste kc-liste--start">${d.checks.slice(0, 5).map(c => zeile(c)).join('')}</section>
    <p class="mehr">${WO.knopf('Alle Checks', 'rechts', 'hell', { klein: true, attr: 'data-gehe="checks"' })}</p>`;
  return aus;
}

function checks() {
  const d = S.d, u = d.summe;
  let aus = kopf('Alle Checks', 'Jeder Check, <em class="kc-zeile">Punkt für Punkt.</em>', 'Jede Anfrage von der öffentlichen Seite als eine Zeile. Ein Klick öffnet die Prüfakte des Hauses: was der KI-Leser geöffnet hat, was er gefunden hat, und warum es zählt.', zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const alle = d.checks;
  const nach = { alle, offen: alle.filter(c => !c.kundenliste), anlass: alle.filter(c => !c.kundenliste && c.note.punkte < 70), kundenliste: alle.filter(c => c.kundenliste), hotel: alle.filter(c => c.art === 'Hotel'), restaurant: alle.filter(c => c.art === 'Restaurant') };
  const l = nach[S.filter] || alle;
  const f = (k, name) => `<button type="button" data-filter="${k}" class="${S.filter === k ? 'an' : ''}" aria-pressed="${S.filter === k}">${name}<b>${n(nach[k].length)}</b></button>`;
  aus += `<div class="wo-lage kc-lage">
      <div class="wo-lg"><span class="wo-mk">Heute neu</span><b>${n(u.heute)}</b><p>${u.heute ? mal(u.heute, 'ein Haus hat', 'Häuser haben') + ' heute geprüft' : 'Heute noch kein Check'}</p></div>
      <div class="wo-lg"><span class="wo-mk">Warten</span><b>${n(u.offen)}</b><p>noch nicht in der Kundenliste</p></div>
      <div class="wo-lg"><span class="wo-mk">Gesprächsanlass</span><b>${n(nach.anlass.length)}</b><p>warten und stehen unter «Gut»</p></div>
      <div class="wo-lg"><span class="wo-mk">Note im Schnitt</span><b>${u.punkte == null ? '–' : n(u.punkte)}</b><p>Punkte von 100</p></div>
    </div>
    <div class="kc-filter"><div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle')}${f('offen', 'Warten')}${f('anlass', 'Gesprächsanlass')}${f('kundenliste', 'Kundenliste')}${f('hotel', 'Hotels')}${f('restaurant', 'Restaurants')}</div></div>`;
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Check in dieser Auswahl.</b> In diesem Zeitraum ging noch niemand diesen Weg.</div>`;
  aus += `<section class="blatt kc-liste">${zeilenTage(l.slice(0, S.zeige))}${l.length > S.zeige ? `<button class="link weitere" type="button" data-mehr>Weitere ${n(Math.min(60, l.length - S.zeige))} zeigen</button>` : ''}</section>`;
  return aus;
}

/* ---------- Die Prüfakte eines Hauses (Neuordnung 17.11.2026) ----------
   Öffnet als Blatt von rechts über der Liste. Links: das Prüfsiegel (neun Bögen um die Note, Zeichen je Bereich, Zeiger während der Prüfung). Rechts: die neun
   Prüfungen laufen nacheinander ab (prüft → Ergebnis), jede lässt sich aufklappen: was gefunden wurde, woran gemessen wird, warum es zählt.
   Nur transform und opacity bewegen sich. */
const LESER = { GPTBot: 'ChatGPT', 'ChatGPT-User': 'ChatGPT Nachschlagen', 'OAI-SearchBot': 'ChatGPT Suche', ClaudeBot: 'Claude', 'Claude-User': 'Claude Nachschlagen',
  'anthropic-ai': 'Claude (älter)', PerplexityBot: 'Perplexity', 'Perplexity-User': 'Perplexity Nachschlagen', 'Google-Extended': 'Gemini', 'Applebot-Extended': 'Apple',
  'Meta-ExternalAgent': 'Meta AI', Amazonbot: 'Alexa', CCBot: 'Common Crawl', Bytespider: 'TikTok' };
const FELD = { name: 'Name', adresse: 'Adresse', telefon: 'Telefon', oeffnungszeiten: 'Öffnungszeiten', preise: 'Preise', speisekarte: 'Speisekarte', zimmer: 'Zimmer', bewertung: 'Bewertungen', bild: 'Bild', lage: 'Lage' };
/* Woran gemessen wird: wörtlich die Regeln aus pruefung.py, in Alltagssprache */
const MASS = {
  roboter: 'Gut, wenn keiner der 14 KI-Leser gesperrt ist (ChatGPT, Claude, Perplexity, Gemini, Apple, Meta und weitere). Teilweise, wenn einzelne gesperrt sind. Fehlt, wenn drei der sechs wichtigsten oder alle gesperrt sind. Gibt es keine robots.txt, dürfen alle lesen.',
  struktur: 'Gut, wenn der Datensatz das Haus als Hotel oder Restaurant ausweist und mindestens vier von sechs Angaben trägt: Name, Adresse, Telefon, Öffnungszeiten, Preise, Zimmer oder Speisekarte. Teilweise, wenn das Haus hinterlegt ist, aber weniger dasteht. Fehlt, wenn es keinen Datensatz gibt.',
  angaben: 'Gut, wenn mindestens vier von fünf Angaben als Text auf der Startseite stehen: Adresse, Telefon, Öffnungszeiten, Preise, Zimmer oder Speisekarte. Teilweise bei zwei oder drei.',
  angebot: 'Hotel: gut, wenn eine Zimmerseite mit Text und Preisen da ist. Restaurant: gut, wenn die Karte als Text mit Preisen dasteht. Eine Karte nur als PDF zählt halb, weil KI-Leser sie oft nicht öffnen.',
  lesbar: 'Gut ab 250 Wörtern lesbarem Text, mit Titel und Hauptüberschrift. Teilweise ab 120 Wörtern. Fehlt, wenn die Seite erst im Browser entsteht und ohne Skripte fast leer ist.',
  llms: 'Gut, wenn unter /llms.txt eine Vorstellung des Hauses in Worten liegt (mindestens zehn Wörter). Sonst fehlt sie.',
  sprachen: 'Gut ab zwei Sprachen, die sauber ausgezeichnet sind. Teilweise, wenn nur eine Sprache angegeben ist. Fehlt, wenn die Seite keine Sprache nennt.',
  bewertungen: 'Gut, wenn ein Bewertungsportal von der Seite aus verlinkt ist (Google, Tripadvisor, Booking.com, HolidayCheck und weitere). Teilweise, wenn nur Sterne im Datensatz stehen.',
  ladezeit: 'Gut, wenn die Startseite in unter 1,2 Sekunden antwortet und unter 400 KB wiegt. Teilweise unter 3 Sekunden und 1,5 MB. Gemessen wird nur die Seite selbst, ohne Bilder.' };
/* Was der KI-Leser öffnet: sechs Quellen, jeder Prüfbereich liest aus einer davon */
const QUELLEN = [['robots.txt', 'Hausordnung für Leser'], ['Datensatz', 'Hinter der Startseite'], ['Startseite', 'Text, Links, Sprachen'], ['Karte und Zimmer', 'Die Unterseite mit dem Angebot'], ['llms.txt', 'Vorstellung für KI-Dienste'], ['Server', 'Antwortzeit und Gewicht']];
const QUELLE_VON = { roboter: 0, struktur: 1, angaben: 2, angebot: 3, lesbar: 2, llms: 4, sprachen: 2, bewertungen: 2, ladezeit: 5 };
const ZEICHEN = { gut: '<svg viewBox="0 0 16 16"><path d="M3.5 8.4 6.6 11.4 12.5 4.8"/></svg>', mittel: '<svg viewBox="0 0 16 16"><path d="M4 8h8"/></svg>', schwach: '<svg viewBox="0 0 16 16"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>' };
const ja = (w, text) => `<li class="ak-ja ak-ja--${w ? 'ja' : 'nein'}"><i>${ZEICHEN[w ? 'gut' : 'schwach']}</i>${esc(text)}</li>`;
const pfad = (u, c) => { try { const x = new URL(u); return x.pathname === '/' ? host(c) : x.pathname.replace(/\/$/, '').split('/').slice(-2).join('/'); } catch (e) { return String(u || ''); } };
function messbalken(wert, ziel, max, text, umgekehrt) {
  const w = Math.min(1, wert / max), z = Math.min(1, ziel / max), ok = umgekehrt ? wert <= ziel : wert >= ziel;
  return `<div class="ak-mess"><div class="ak-mess__b"><i class="${ok ? 'ok' : ''}" style="--w:${w.toFixed(3)}"></i><u style="left:${(z * 100).toFixed(1)}%"></u></div><p>${text}</p></div>`;
}
function gefunden(b, c) {
  const d = b.details || {};
  switch (b.schluessel) {
    case 'roboter': {
      if (d.vorhanden === false) return '<p class="ak-satz">Keine robots.txt gefunden. Damit dürfen alle KI-Leser die Seite lesen.</p>';
      const g = new Set(d.gesperrt || []);
      return `<ul class="ak-chips">${Object.keys(LESER).map(k => `<li class="${g.has(k) ? 'nein' : 'ja'}" title="${esc(k)}">${esc(LESER[k])}</li>`).join('')}</ul>
        <p class="ak-satz">${g.size ? n(g.size) + ' von 14 Lesern gesperrt (rot).' : 'Alle 14 Leser dürfen lesen.'}</p>`;
    }
    case 'struktur': {
      if (!d.vorhanden) return '<p class="ak-satz">Hinter der Startseite liegt kein Datensatz zum Haus. KI-Dienste müssen Name, Adresse und Zeiten aus dem Fliesstext raten.</p>';
      const f = d.felder || {}, wes = (d.da || []).concat(d.fehlt || []), extra = ['bewertung', 'bild', 'lage'].filter(k => k in f);
      return `<p class="ak-satz">Hinterlegt als <b>${esc(d.typ || d.art || 'Haus')}</b>${d.name ? ', Name «' + esc(d.name) + '»' : ''}.</p>
        <ul class="ak-liste">${wes.map(k => ja(!!f[k], FELD[k] || k)).join('')}${extra.map(k => ja(!!f[k], FELD[k] + ' (Zusatz)')).join('')}</ul>`;
    }
    case 'angaben': { const f = d.felder || {}; return `<ul class="ak-liste">${Object.keys(f).map(k => ja(!!f[k], FELD[k] || k)).join('')}</ul>`; }
    case 'angebot': {
      const z = [], form = { seite: 'eigene Seite mit Text', text: 'als Text', text_pdf: 'Gerichte als Text, Preise als PDF', teils: 'teilweise als Text', pdf: 'nur als PDF', leer: 'Seite ohne Inhalt', keine: 'nicht gefunden' };
      if (d.karte_form || d.karte_link) z.push(`<li><span>Speisekarte</span><b>${esc(form[d.karte_form] || d.karte_form || 'gefunden')}</b>${d.karte_link ? `<a class="link-i" href="${esc(d.karte_link)}" target="_blank" rel="noopener">${esc(pfad(d.karte_link, c))}</a>` : ''}</li>`);
      if ('zimmer_link' in d || 'zimmer_text' in d) z.push(`<li><span>Zimmerseite</span><b>${d.zimmer_link ? (d.zimmer_text ? 'mit Text' : 'kaum Text') : 'nicht gefunden'}</b>${d.zimmer_link ? `<a class="link-i" href="${esc(d.zimmer_link)}" target="_blank" rel="noopener">${esc(pfad(d.zimmer_link, c))}</a>` : ''}</li>`);
      if ('zimmer_preise' in d) z.push(`<li><span>Zimmerpreise</span><b>${d.zimmer_preise ? 'stehen da' : 'fehlen'}</b>${d.preis_link ? `<a class="link-i" href="${esc(d.preis_link)}" target="_blank" rel="noopener">${esc(pfad(d.preis_link, c))}</a>` : ''}</li>`);
      return z.length ? `<ul class="ak-zeilen">${z.join('')}</ul>` : '';
    }
    case 'lesbar': return `${messbalken(d.woerter || 0, 250, 500, `<b>${n(d.woerter || 0)} Wörter</b> lesbarer Text · gut ab 250`)}
      <ul class="ak-liste">${ja(!!d.titel, 'Titel der Seite')}${ja(!!d.h1, 'Hauptüberschrift')}${ja(!!d.beschreibung, 'Kurzbeschreibung für Suchmaschinen')}</ul>${d.titel ? `<p class="ak-zitat">«${esc(d.titel)}»</p>` : ''}`;
    case 'llms': return `<ul class="ak-liste">${ja(!!d.vorhanden, d.vorhanden ? 'llms.txt vorhanden, rund ' + n(d.woerter) + ' Wörter' : 'Keine llms.txt unter ' + host(c) + '/llms.txt')}</ul>`;
    case 'sprachen': return `<ul class="ak-chips">${(d.namen || []).map(x => `<li class="ja">${esc(x)}</li>`).join('') || '<li class="nein">Keine Sprache angegeben</li>'}</ul>
      <ul class="ak-liste">${ja(!!d.hreflang, 'Sprachfassungen sauber verknüpft')}</ul>`;
    case 'bewertungen': return `<ul class="ak-chips">${(d.namen || []).map(x => `<li class="ja">${esc(x)}</li>`).join('') || '<li class="nein">Kein Portal verlinkt</li>'}</ul>
      <ul class="ak-liste">${ja(!!d.rating, 'Sterne im Datensatz')}</ul>`;
    case 'ladezeit': return `${messbalken(d.sekunden || 0, 1.2, 4, `<b>${String(d.sekunden).replace('.', ',')} Sekunden</b> · gut unter 1,2`, true)}
      ${messbalken(d.kb || 0, 400, 1600, `<b>${n(d.kb)} KB</b> · gut unter 400`, true)}`;
  }
  return '';
}
function akteSchritt(b, i, c, gast) {
  const p = Math.round(b.gewicht * (WERT[b.ampel] || 0) * 10) / 10, g = gefunden(b, c);
  return `<li class="ak-s ak-s--${esc(b.ampel)}" data-s="${i}" style="--i:${i}">
    <button class="ak-s__kopf" type="button" aria-expanded="false">
      <span class="ak-s__z" aria-hidden="true"><i class="ak-s__dreh"></i><i class="ak-s__erg">${ikon(b.schluessel)}</i></span>
      <span class="ak-s__t"><b>${esc(b.titel)}</b><small>${esc(b.befund)}</small>${gast.includes(b.schluessel) ? '<em class="ak-gast">Hat der Gast gesehen</em>' : ''}</span>
      <span class="ak-s__p"><b>${esc(AMPEL[b.ampel] || b.ampel)}</b><small>${n(p)} von ${n(b.gewicht)} Punkten</small></span>
      <i class="ak-s__auf" aria-hidden="true">${WO.ic('plus')}</i></button>
    <div class="ak-s__mehr" hidden>
      <div class="ak-s__teil"><span class="mono">Gefunden · ${esc(QUELLEN[QUELLE_VON[b.schluessel]][0])}</span>${g || `<p class="ak-satz">${esc(b.befund)}</p>`}</div>
      <div class="ak-s__teil"><span class="mono">Gemessen an</span><p class="ak-satz">${esc(MASS[b.schluessel] || '')}</p></div>
      ${b.warum ? `<div class="ak-s__teil ak-s__warum"><span class="mono">Warum es zählt</span><p class="ak-satz">${esc(b.warum)}</p><button class="link" type="button" data-kopiere="${esc(b.warum)}">Satz kopieren</button></div>` : ''}
    </div></li>`;
}
function akteHtml(c) {
  const l = S.d.checks, i = l.findIndex(x => x.id === c.id), gast = (c.gast || []).map(g => g.schluessel);
  const bs = PRUEF.map(([k]) => bereich(c, k)).filter(Boolean);
  const [sk, sw] = stand(c);
  return `<div class="ak" id="akte" role="dialog" aria-modal="true" aria-label="Prüfakte ${esc(c.haus)}">
    <button class="ak__grund" type="button" aria-label="Prüfakte schliessen" data-akte-zu></button>
    <article class="ak__blatt" tabindex="-1">
      <header class="ak__kopf">
        <div class="ak__leiste"><span class="mono">Prüfakte${i >= 0 ? ' · ' + n(i + 1) + ' von ' + n(l.length) : ''}</span>
          <span class="ak__nav"><button class="kc-rund" type="button" data-akte-schritt="-1" aria-label="Vorheriger Check"${i <= 0 ? ' disabled' : ''}>${WO.ic('links')}</button><button class="kc-rund" type="button" data-akte-schritt="1" aria-label="Nächster Check"${i < 0 || i >= l.length - 1 ? ' disabled' : ''}>${WO.ic('rechts')}</button><button class="kc-rund" type="button" data-akte-zu aria-label="Schliessen">${ZU}</button></span></div>
        <div class="ak__haupt">
          <div class="ak__titel"><span class="mono">${esc(tagWort(String(c.zeit).slice(0, 10), true))} · ${esc(uhr(c))} Uhr${c.dauer ? ' · geprüft in ' + esc(String(c.dauer).replace('.', ',')) + ' s' : ''}</span>
            <h2>${esc(c.haus)}</h2><p>${esc(c.art || 'Haus')} · <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(host(c))}</a></p></div>
          <div class="ak__note"><b data-zaehler="${n(c.note.punkte)}">${n(c.note.punkte)}</b><span>von 100</span><em>${esc(c.note.wort)}</em></div>
        </div>
        <dl class="ak__kontakt">
          <div><dt>Ansprechpartner</dt><dd>${esc(c.name || '–')}</dd></div>
          <div><dt>Mail</dt><dd>${esc(c.mail || '–')}</dd></div>
          <div><dt>Stand</dt><dd class="ak__stand"><span class="kc-stand kc-stand--${sk}">${esc(sw)}</span><small>${c.kundenliste ? 'vorgemerkt am ' + esc(datum(c.kundenliste)) : 'geprüft ' + esc(alter(c))}</small></dd></div>
          <div><dt>Der Gast hat gesehen</dt><dd>${gast.length ? mal(gast.length, 'einen Punkt', 'Punkte') + ' mit Begründung' : 'Note und Zusammenfassung'}</dd></div>
        </dl>
        <div class="ak__taten">${WO.knopf(c.kundenliste ? 'Aus der Kundenliste' : 'In die Kundenliste', c.kundenliste ? 'zurueck' : 'plus', c.kundenliste ? 'glas' : 'gold', { klein: true, attr: `data-kl="${esc(c.id)}"` })}
          ${WO.knopf('Mail an den Gast', 'mail', 'glas', { klein: true, attr: `data-mail="${esc(c.id)}"` })}
          ${WO.knopf('Website öffnen', 'welt', 'glas', { klein: true, href: esc(c.url), neu: true })}
          <button class="link ak__weg" type="button" data-weg-loeschen="${esc(c.id)}">Check löschen</button></div>
      </header>
      <section class="ak__pruef">
        <aside class="ak__leser">
          <span class="mono">Prüfsiegel</span>
          ${siegel(c, true)}
          <button class="kn kn--linie ak__nochmal" type="button" data-akte-nochmal>Prüfung abspielen<i>${WO.ic('verlauf')}</i></button>
        </aside>
        <div class="ak__rechts">
          <header class="ak__rk"><h3>Die neun Prüfungen</h3><button class="link" type="button" data-akte-alle>Alle aufklappen</button></header>
          <ol class="ak-ss">${bs.map((b, j) => akteSchritt(b, PRUEF.findIndex(p => p[0] === b.schluessel), c, gast)).join('')}</ol>
          <p class="fein">Geprüft wird ohne bezahlte KI-Dienste, so wie KI-Leser die Seite sehen. «Gemessen an» nennt die Regel, nach der jeder Bereich bewertet wird; teilweise erfüllt zählt halb.</p>
        </div>
      </section>
    </article></div>`;
}
let AK_UHR = [];
function akteSpielen(still) {
  const el = $('#akte'); if (!el) return;
  AK_UHR.forEach(clearTimeout); AK_UHR = [];
  const c = finde(S.akte); if (!c) return;
  const ss = $$('.ak-s', el), seg = $$('.sg--gross .sg__s', el), zz = $$('.sg--gross .sg__z', el), li = $$('.sg__l', el), summe = $('[data-summe]', el),
    zeiger = $('.sg__zeiger', el), cap = $('[data-cap]', el), capK = $('[data-cap-k]', el);
  const ruhig = still || matchMedia('(prefers-reduced-motion:reduce)').matches;
  const licht = v => li.forEach((l, j) => l.classList.toggle('an', j < Math.round(v)));
  let tok = 0;
  const zaehle = (von, bis) => { const t0 = performance.now(), dau = 520, ich = ++tok; const f = t => { if (ich !== tok) return; const k = Math.min(1, (t - t0) / dau), e = 1 - Math.pow(1 - k, 3), v = von + (bis - von) * e; summe.textContent = n(Math.round(v * 10) / 10); licht(v); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const ende = () => { AK_UHR.push(setTimeout(() => { tok++; summe.textContent = n(c.note.punkte); licht(c.note.punkte); }, 560)); el.classList.remove('ak--laeuft'); el.classList.add('ak--fertig'); capK.textContent = 'Neun Bereiche geprüft'; cap.textContent = 'Auf ein Zeichen tippen, um den Bereich zu öffnen'; };
  let stand_ = 0;
  if (ruhig) { ss.forEach(s => s.classList.add('fertig')); seg.forEach(s => s.classList.add('an')); zz.forEach(z => z.classList.add('an')); licht(c.note.punkte); summe.textContent = n(c.note.punkte); ende(); return; }
  el.classList.remove('ak--fertig'); el.classList.add('ak--laeuft');
  ss.forEach(s => s.classList.remove('fertig', 'prueft')); seg.forEach(s => s.classList.remove('an')); zz.forEach(z => z.classList.remove('an', 'liest')); licht(0); summe.textContent = '0';
  capK.textContent = 'Prüft'; cap.textContent = '…';
  const takt = 460;
  ss.forEach((s, j) => {
    const k = +s.dataset.s, b = bereich(c, PRUEF[k][0]), g = seg[k], z = zz[k];
    AK_UHR.push(setTimeout(() => { zeiger.style.transform = `rotate(${g ? g.dataset.m : 0}deg)`; zz.forEach(x => x.classList.remove('liest')); if (z) z.classList.add('liest'); s.classList.add('prueft'); capK.textContent = 'Prüft ' + n(j + 1) + ' von ' + n(ss.length); cap.textContent = PRUEF[k][1]; }, 420 + j * takt));
    AK_UHR.push(setTimeout(() => {
      s.classList.remove('prueft'); s.classList.add('fertig'); if (g) g.classList.add('an'); if (z) { z.classList.remove('liest'); z.classList.add('an'); }
      const neu = stand_ + b.gewicht * (WERT[b.ampel] || 0); zaehle(stand_, neu); stand_ = neu;
      if (j === ss.length - 1) AK_UHR.push(setTimeout(ende, 420));
    }, 420 + j * takt + 320));
  });
}
function akteAuf(id, ruhig) {
  const c = finde(id); if (!c) return;
  const war = !!$('#akte');
  S.akte = id;
  const ort = $('#akte-ort'); ort.innerHTML = akteHtml(c);
  const el = $('#akte');
  document.documentElement.classList.add('akte-auf');
  const q = new URLSearchParams(location.search); q.set('check', id); history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
  $$('.kc-z', $('#ansicht')).forEach(z => z.classList.toggle('aktiv', z.dataset.akte === id));
  $$('[data-akte-zu]', el).forEach(b => b.onclick = () => akteZu());
  $$('[data-akte-schritt]', el).forEach(b => b.onclick = () => akteSchritt_(+b.dataset.akteSchritt));
  const schritt = st => { const m = $('.ak-s__mehr', st), k = $('.ak-s__kopf', st); return { teil: m, huelle: st, setze: v => { m.hidden = !v; k.setAttribute('aria-expanded', v); } }; };
  const alleKn = $('[data-akte-alle]', el), alleWort = () => { alleKn.textContent = $$('.ak-s__mehr[hidden]', el).length ? 'Alle aufklappen' : 'Alle zuklappen'; };
  $('[data-akte-nochmal]', el).onclick = () => { const offen = $$('.ak-s', el).filter(st => !$('.ak-s__mehr', st).hidden);
    WO_SCHUBLADE(offen.map(schritt), false, () => { alleWort(); akteSpielen(false); }); };
  alleKn.onclick = () => { const auf = $$('.ak-s__mehr[hidden]', el).length > 0;
    WO_SCHUBLADE($$('.ak-s', el).filter(st => $('.ak-s__mehr', st).hidden === auf).map(schritt), auf, alleWort); };
  $$('.sg--gross .sg__z', el).forEach(z => z.onclick = () => { const st = $(`.ak-s[data-s="${z.dataset.k}"]`, el); if (!st) return;
    const zeige = () => { st.scrollIntoView({ behavior: 'smooth', block: 'center' }); st.classList.add('blitz'); setTimeout(() => st.classList.remove('blitz'), 1200); };
    if ($('.ak-s__mehr', st).hidden) WO_SCHUBLADE([schritt(st)], true, () => { alleWort(); zeige(); }); else zeige(); });
  $$('.ak-s__kopf', el).forEach(k => k.onclick = () => { const st = k.closest('.ak-s'); WO_SCHUBLADE([schritt(st)], $('.ak-s__mehr', st).hidden, alleWort); });
  $$('[data-kopiere]', el).forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.kopiere); melde('Satz kopiert', 'Zum Einfügen in Mail oder Gespräch.'); } catch (e) { melde('Nicht kopiert', 'Den Satz bitte markieren und mit ⌘C kopieren.'); } });
  verbinde(el);
  if (!war && !ruhig) { el.classList.add('ak--rein'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('ak--rein'))); }
  else el.classList.add('ak--steht');
  akteSpielen(ruhig);
  if (!war) { AK_VORHER = document.activeElement; $('.ak__blatt', el).focus({ preventScroll: true }); }
}
let AK_VORHER = null;
function akteZu() {
  const el = $('#akte'); if (!el) return;
  AK_UHR.forEach(clearTimeout); AK_UHR = [];
  S.akte = '';
  const q = new URLSearchParams(location.search); q.delete('check'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  $$('.kc-z.aktiv').forEach(z => z.classList.remove('aktiv'));
  el.classList.add('ak--raus'); document.documentElement.classList.remove('akte-auf');
  setTimeout(() => { if ($('#akte') === el) $('#akte-ort').innerHTML = ''; }, 420);
  if (AK_VORHER && AK_VORHER.focus && document.contains(AK_VORHER)) AK_VORHER.focus({ preventScroll: true });
}
function akteSchritt_(r) {
  const l = S.d.checks, i = l.findIndex(x => x.id === S.akte), z = l[i + r];
  if (z) { akteAuf(z.id); $('.ak__blatt').scrollTop = 0; }
}
document.addEventListener('keydown', e => {
  if (!$('#akte') || $('#fenster').innerHTML) return;
  if (e.key === 'Escape') akteZu();
  else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) akteSchritt_(e.key === 'ArrowRight' ? 1 : -1);
});

function herkunft() {
  const d = S.d;
  let aus = kopf('Herkunft', 'Woher <em>die Häuser kommen.</em>', 'Das Land nennt die Endung der Website (bei Probehäusern die der Mail), die Sprachen stehen so auf der geprüften Seite. So siehst du, aus welcher Gegend die Anfragen kommen und wie viele Häuser schon mehrsprachig sind.', zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const ges = d.summe.checks, ch = d.laender.find(x => x.k === 'Schweiz'), de = d.laender.find(x => x.k === 'Deutschland');
  const mehr = (d.umfang.find(x => x.k === 'Mehrere Sprachen') || {}).n || 0;
  aus += `<div class="band blatt"><div><span class="mono">Aus der Schweiz</span><b>${ch ? prozent(100 * ch.n / ges) : '–'}</b></div>
      <div><span class="mono">Aus Deutschland</span><b>${de ? prozent(100 * de.n / ges) : '–'}</b></div>
      <div><span class="mono">Länder</span><b>${n(d.laender.filter(x => Object.values(LAENDER).includes(x.k)).length)}</b></div>
      <div><span class="mono">Mehrsprachig</span><b>${prozent(100 * mehr / ges)}</b></div></div>
    <p class="fein">Land: aus der Endung der Adresse (.ch Schweiz, .de Deutschland, .at Österreich). Mehrsprachig: die Seite nennt mehr als eine Sprache.</p>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Länder</h3></header>${balken(d.laender.slice(0, 10), x => esc(x.k), null, ges)}</section>
        <section class="blatt"><header><h3>Hotel oder Restaurant</h3></header>${balken(d.arten, x => esc(x.k), null, ges)}</section>
        <section class="blatt"><header><h3>Mail-Adresse</h3></header>${balken(d.mails, x => esc(x.k), null, ges)}</section>
      </div>
      <div class="stapel">
        <section class="blatt"><header><h3>Sprachen der Website</h3></header>${balken(d.sprachen, x => esc(SPRACHE[x.k] || x.k), null, ges)}</section>
        <section class="blatt"><header><h3>Wie viele Sprachen</h3></header>${balken(d.umfang, x => esc(x.k), null, ges)}</section>
      </div>
    </div>`;
  return aus;
}

function zeit() {
  const d = S.d;
  let aus = kopf('Zeit', 'Wann Häuser <em>ihre Website prüfen.</em>', 'Zu welcher Stunde und an welchem Wochentag die Checks kommen. Uhrzeit in Hamburg. So siehst du, wann ein Rückruf oder die Mail mit dem Ergebnis am ehesten auf offene Ohren trifft.', zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const st = d.stunden, wt = d.raster.map(r => r.reduce((a, x) => a + x, 0));
  const spitze = st.indexOf(Math.max(...st)), wspitze = wt.indexOf(Math.max(...wt));
  const abend = st.slice(18).reduce((a, x) => a + x, 0), ges = st.reduce((a, x) => a + x, 0) || 1;
  aus += `<div class="band blatt"><div><span class="mono">Meiste Checks</span><b>${spitze}–${spitze + 1} Uhr</b></div>
      <div><span class="mono">Stärkster Tag</span><b>${WTAG[wspitze]}</b></div>
      <div><span class="mono">Ab 18 Uhr</span><b>${prozent(100 * abend / ges)}</b></div>
      <div><span class="mono">Am Wochenende</span><b>${prozent(100 * (wt[5] + wt[6]) / ges)}</b></div></div>
    <section class="blatt tafel">
      <header><h3>Zu welcher Uhrzeit</h3><p>Beginn des Checks</p></header>
      ${saeulen(st, i => i % 3 === 0 ? i + ' Uhr' : '', Object.assign((i, z) => i + ' bis ' + (i + 1) + ' Uhr: ' + mal(z, 'ein Check', 'Checks'), { label: 'Checks nach Uhrzeit' }), 'saeulen--uhr')}
    </section>
    <section class="blatt tafel">
      <header><h3>Wochentag und Stunde</h3><p>Je dunkler, desto mehr Checks</p></header>
      ${raster(d.raster)}
    </section>
    <section class="blatt tafel">
      <header><h3>Nach Wochentag</h3></header>
      ${balken(wt.map((z, i) => ({ k: i, n: z })), x => WTAG[x.k])}
    </section>`;
  return aus;
}
function raster(r) {
  const max = Math.max(1, ...r.flat());
  const kopfzeile = '<span></span>' + Array.from({ length: 24 }, (_, h) => `<span class="raster__h">${h % 3 === 0 ? h : ''}</span>`).join('');
  return `<div class="raster" role="img" aria-label="Checks nach Wochentag und Stunde">${kopfzeile}
    ${r.map((zeile, w) => `<span class="raster__w">${WTAG[w].slice(0, 2)}</span>` + zeile.map((z, h) => `<i style="--a:${(z / max).toFixed(3)}" data-t="${WTAG[w]}, ${h}–${h + 1} Uhr: ${mal(z, 'ein Check', 'Checks')}"></i>`).join('')).join('')}</div>`;
}

function verlauf() {
  const d = S.d, u = d.summe, v = d.vorher;
  let aus = kopf('Verlauf', 'Wie sich die Checks <em>entwickeln.</em>', `Die letzten ${n(d.tage)} Tage neben den ${n(d.tage)} Tagen davor (${esc(datum(v.von))} bis ${esc(datum(v.bis))}).`, zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const viele = d.je_tag.length, schritt = viele <= 7 ? 1 : viele <= 31 ? 5 : 15;
  const karte = (name, a, b, umgekehrt, einheit = '') => {
    const max = Math.max(1, a || 0, b || 0), p = a != null && b ? Math.round(100 * (a - b) / b) : null, gut = p == null || !p ? '' : (umgekehrt ? p < 0 : p > 0) ? 'gut' : 'weniger';
    return `<div class="vk blatt"><span class="mono">${name}</span>
      <div class="vk__z"><b>${a == null ? '–' : n(a)}${einheit}</b><span class="vk__d ${gut}">${p == null ? 'neu' : !p ? 'gleich' : (p > 0 ? '+' : '−') + Math.abs(p) + '&nbsp;%'}</span></div>
      <div class="vk__b"><span>Jetzt</span><i class="jetzt" style="--w:${((a || 0) / max).toFixed(3)}"></i><em>${a == null ? '–' : n(a)}</em></div>
      <div class="vk__b"><span>Davor</span><i class="davor" style="--w:${((b || 0) / max).toFixed(3)}"></i><em>${b == null ? '–' : n(b)}</em></div></div>`;
  };
  aus += `<section class="blatt tafel vl-tafel">
      <header><h3>Checks je Tag</h3><p><span class="punkt"></span>dieser Zeitraum <span class="punkt punkt--hell"></span>davor, am selben Tag</p></header>
      ${saeulen(d.je_tag.map(t => t.checks), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(d.je_tag[i].tag) : '', Object.assign((i, z) => tagWort(d.je_tag[i].tag) + ': ' + mal(z, 'ein Check', 'Checks') + ' · davor ' + n(d.vor_tag[i]), { label: 'Checks je Tag im Vergleich zum Zeitraum davor' }), 'saeulen--vgl', d.vor_tag)}
    </section>
    <h2 class="zw">Neben dem <em>Zeitraum davor</em></h2>
    <div class="vks">
      ${karte('Checks', u.checks, v.checks)}${karte('Note im Schnitt', u.punkte, v.punkte)}${karte('In der Kundenliste', u.kundenliste, v.kundenliste)}
      ${karte('Sehr gut', u.sehrgut, v.sehrgut)}${karte('Unter «Gut»', u.unter, v.unter, true)}${karte('Warten', u.offen, v.offen, true)}
    </div>
    <p class="fein">Grün heisst besser als davor. Bei «Unter Gut» und «Warten» ist weniger besser.</p>
    <section class="blatt vl-wochen"><header><h3>Woche für Woche</h3><p>Checks und davon in der Kundenliste</p></header>${wochen(d.wochen)}</section>`;
  return aus;
}
function wochen(w) {
  const max = Math.max(1, ...w.map(x => x.checks));
  return `<div class="wo-saeulen" style="--n:${w.length}" role="img" aria-label="Checks je Woche">${w.map((x, i) => `<div class="ws" style="--i:${i}" data-t="${kurzDatum(x.von)}–${kurzDatum(x.bis)}: ${mal(x.checks, 'ein Check', 'Checks')}, ${n(x.kundenliste)} in der Kundenliste">
      <b>${n(x.checks)}</b><div class="ws__s"><i style="--h:${(x.checks / max).toFixed(3)}"></i><u style="--h:${(x.kundenliste / max).toFixed(3)}"></u></div><span>${kurzDatum(x.von)}<small>${x.tage < 7 ? x.tage + (x.tage === 1 ? ' Tag' : ' Tage') : 'bis ' + kurzDatum(x.bis)}</small></span></div>`).join('')}</div>
    <p class="fein"><span class="punkt"></span>Checks <span class="punkt punkt--gold"></span>davon in der Kundenliste. Woche Montag bis Sonntag, angebrochene Wochen am Rand.</p>`;
}

function gespraech() {
  const d = S.d, u = d.summe;
  let aus = kopf('Zur Kundenliste', 'Wie oft ein Check <em>zum Gespräch führt.</em>', 'Der KI-Check ist der Einstieg ins Gespräch. Oben der Weg vom Check in die Kundenliste, darunter alle, die noch warten: die mit dem grössten Gesprächsanlass zuerst.', zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const C = d.checks, offen = C.filter(c => !c.kundenliste);
  const anlass = offen.filter(c => c.note.punkte < 70), alt = offen.filter(c => String(c.zeit).slice(0, 10) <= schiebe(d.bis, -7));
  const mit = C.filter(c => c.note.punkte < 85).length;
  const stufen = [['Checks', u.checks, 'Häuser haben ihre Website geprüft'], ['Mit Hinweisen', mit, 'stehen unter «Sehr gut»'], ['In der Kundenliste', u.kundenliste, 'sind vorgemerkt fürs Gespräch']];
  aus += `<div class="wo-lage kc-lage kc-lage--drei">
      <div class="wo-lg"><span class="wo-mk">Vom Check in die Kundenliste</span><b>${u.checks ? prozent(100 * u.kundenliste / u.checks) : '–'}</b><p>${n(u.kundenliste)} von ${n(u.checks)} Checks</p></div>
      <div class="wo-lg"><span class="wo-mk">Gesprächsanlass offen</span><b>${n(anlass.length)}</b><p>warten und stehen unter «Gut»</p></div>
      <div class="wo-lg"><span class="wo-mk">Wartet über eine Woche</span><b>${n(alt.length)}</b><p>von ${n(offen.length)} wartenden Checks</p></div>
    </div>
    <section class="blatt kc-weg"><header><h3>Der Weg zum Gespräch</h3><p>${esc(datum(d.von))} bis ${esc(datum(d.bis))}</p></header>
      <ol class="kc-weg__stufen">${stufen.map(([name, z, satz], i) => `<li style="--i:${i}">${i ? `<span class="kc-weg__pfeil"><b>${prozent(100 * z / (stufen[i - 1][1] || 1))}</b><small>davon</small></span>` : ''}
        <div class="kc-weg__st"><b>${n(z)}</b><span>${name}</span><small>${satz}</small><i style="--w:${Math.max(.03, z / (u.checks || 1)).toFixed(3)}"></i></div></li>`).join('')}</ol>
      <p class="fein">Auch Häuser mit «Sehr gut» können in die Kundenliste; darum kann die letzte Stufe grösser sein als die mittlere.</p></section>
    <h2 class="zw">Wer noch <em>wartet</em></h2>`;
  const reihe = offen.slice().sort((a, b) => (a.note.punkte < 70 ? 0 : 1) - (b.note.punkte < 70 ? 0 : 1) || a.note.punkte - b.note.punkte || String(a.zeit).localeCompare(String(b.zeit)));
  aus += reihe.length ? `<section class="blatt kc-liste">${reihe.slice(0, 12).map(c => zeile(c, { seit: true })).join('')}
      ${reihe.length > 12 ? `<button class="link weitere" type="button" data-gehe="checks" data-filter-setze="offen">Alle ${n(reihe.length)} wartenden Checks</button>` : ''}</section>`
    : '<div class="leer-hinweis"><b>Niemand wartet.</b> Jeder Check des Zeitraums steht in der Kundenliste.</div>';
  return aus;
}

function geprueft() {
  const g = S.grenzen || { je_adresse: 3, je_mail: 5, gesamt: 200 }, d = S.d;
  const warum = k => { for (const c of S.alle) { const b = bereich(c, k); if (b && b.warum) return b.warum; } return ''; };
  let auf = 0;
  const band = PRUEF.map(([k, name, gw], i) => { const s = auf; auf += gw; return `<li style="--i:${i};flex:${gw} 1 0" data-t="${esc(name)}: ${gw} Punkte"><i></i><b>${gw}</b><span>${esc(KURZ[k])}</span></li>`; }).join('');
  const karte = ([k, name, gw], i) => { const b = (d.ber || []).find(x => x.k === k) || { alle: 0 }, fehlt = b.alle ? b.mittel + b.schwach : 0, w = warum(k);
    return `<article class="gp blatt" style="--i:${i}">
      <header class="gp__k"><span class="gp__g"><b>${gw}</b><small>Punkte</small></span><div><span class="mono">${esc(QUELLEN[QUELLE_VON[k]][0])}</span><h3>${esc(name)}</h3></div></header>
      <p class="gp__m">${esc(MASS[k])}</p>
      ${w ? `<p class="gp__w"><span class="mono">Warum es zählt</span>${esc(w)}</p>` : ''}
      <div class="gp__f"><span>${b.alle ? `Fehlt oder halb bei <b>${n(fehlt)} von ${n(b.alle)}</b> Häusern` : 'Im Zeitraum noch nicht geprüft'}</span><span class="rang__b"><i style="--w:${b.alle ? Math.max(.02, fehlt / b.alle).toFixed(3) : 0}"></i></span></div>
    </article>`; };
  const C = d.checks || [], zaehl = {};
  const punkte = C.map(c => { const p = c.note.punkte, k = Math.round(p / 2), h = zaehl[k] = (zaehl[k] || 0) + 1; return `<button class="gp-skala__p gp-skala__p--${ampelVon(p)}" type="button" data-akte="${esc(c.id)}" style="left:${p}%;--h:${h - 1}" data-t="${esc(c.haus)}: ${n(p)} Punkte" aria-label="${esc(c.haus)}, ${n(p)} Punkte"></button>`; }).join('');
  const zonen = [['Schwach', 0, 30], ['Lückenhaft', 30, 50], ['Ordentlich', 50, 70], ['Gut', 70, 85], ['Sehr gut', 85, 100]];
  return kopf('So wird geprüft', `Was der KI-Check <em>prüft und was nie.</em>`, NAME + ' liest eine Website so, wie ChatGPT, Claude und Perplexity sie lesen: ohne Skripte, ohne bezahlte Dienste, in wenigen Sekunden. Neun Bereiche, zusammen 100 Punkte.') + hinweisProbe() + `
  <section class="blatt gp-hundert"><header><h3>Die 100 Punkte</h3><p>Jedes Stück so breit, wie der Bereich in der Note zählt</p></header>
    <ol class="gp-band">${band}</ol></section>
  <h2 class="zw">Die neun <em>Bereiche</em></h2>
  <div class="gps">${PRUEF.map(karte).join('')}</div>
  <p class="fein">«Fehlt oder halb» zählt die Häuser im gewählten Zeitraum (${esc(datum(d.von))} bis ${esc(datum(d.bis))}), die den Bereich nicht ganz erfüllen. Was oft fehlt, ist der beste Einstieg ins Gespräch.</p>
  <section class="blatt gp-skala"><header><h3>Von der Punktzahl zur Note</h3><p>Jeder Punkt ein Haus im Zeitraum, ein Klick öffnet die Prüfakte</p></header>
    <div class="gp-skala__flaeche">${punkte}</div>
    <ol class="gp-skala__zonen">${zonen.map(([w, a, b]) => `<li style="flex:${b - a} 1 0"><b>${w}</b><small>${a ? 'ab ' + a : 'unter 30'}</small></li>`).join('')}</ol>
    <p class="fein">Teilweise erfüllt zählt halb. Die Grenzen gelten für jedes Haus gleich, ob Hotel oder Restaurant.</p></section>
  <section class="gp-nie"><header><span class="mono">Was nie passiert</span><h3>Fünf Dinge, die der KI-Check <em>nie tut.</em></h3></header>
    <ul>
      <li><b>Kein bezahlter KI-Dienst</b><span>Geprüft wird die Seite selbst: robots.txt, Datensatz, Text, llms.txt, Sprachen, Bewertungen, Antwortzeit.</span></li>
      <li><b>Keine Mail geht raus</b><span>Die Mail an den Gast ist eine fertige Vorlage zum Kopieren.</span></li>
      <li><b>Keine Weitergabe</b><span>Haus, Mail und Ergebnis liegen nur in der Ablage dieses Werkzeugs.</span></li>
      <li><b>Kein Cookie, keine Zählung</b><span>Die öffentliche Seite merkt sich nichts über den Besucher.</span></li>
      <li><b>Nichts verschwindet still</b><span>Gelöscht wird nur nach Rückfrage, direkt danach geht es mit «Rückgängig» zurück.</span></li>
    </ul></section>
  <div class="gp-wissen">
    <section class="blatt"><span class="mono">Für den Gast</span><p>Die öffentliche Seite zeigt die Note und drei bis fünf Punkte, je mit dem Satz, warum es zählt, dazu «Gespräch vereinbaren».</p></section>
    <section class="blatt"><span class="mono">Schutz vor Missbrauch</span><p>Je Website ${n(g.je_adresse)}, je Mail-Adresse ${n(g.je_mail)} und insgesamt ${n(g.gesamt)} Checks am Tag.</p></section>
    <section class="blatt"><span class="mono">Datenschutz</span><p>Unter dem Formular steht, wofür die Mail-Adresse gebraucht wird; ohne Einverständnis startet kein Check.</p></section>
    <section class="blatt"><span class="mono">Kundenliste</span><p>«In die Kundenliste» merkt Haus, Website, Kontakt und Note für die Kundenliste vor.</p></section>
  </div>`;
}

/* ---------- Start ---------- */
(async function () {
  $('#tuer h1').textContent = NAME + ' startet nicht.'; document.title = NAME + ' · ' + WO_HAUS.name; $('#rand').setAttribute('aria-label', 'Bereiche: ' + NAME);
  try { const t = +localStorage.getItem('tasty-ki-check-tage'); if (t === 7 || t === 30 || t === 90) S.tage = t; } catch (e) { /* privat */ }
  let h = location.hash.slice(1); if (h === 'bereiche') h = 'geprueft'; if (TITEL[h]) S.ansicht = h;
  const q = new URLSearchParams(location.search).get('check'); if (q && !TITEL[h]) S.ansicht = 'checks';
  try { await lade(); }
  catch (e) {
    $('#tuer').hidden = false; $('#tuer-t').textContent = (e.fehler || e.message || String(e)) + ' (Stichwort ' + (e.stichwort || 'SERVER') + ')'; $('#ansicht').innerHTML = '';
    $('#tuer').insertAdjacentHTML('beforeend', `<p class="tuer-zu__kn">${WO.knopf('Neu laden', 'verlauf', 'gold', { attr: 'data-neu' })}${WO.knopf('Prüfung öffnen', 'schild', 'hell', { href: 'pruefung.html#' + (e.stichwort || 'SERVER') })}</p>`);
    $('#tuer [data-neu]').onclick = () => location.reload();
    return;
  }
  if (q && finde(q) && S.d.checks.every(c => c.id !== q)) { S.tage = 90; rechne(); }
  rand(); leiste(); zeichne();
  if (q && finde(q)) akteAuf(q, true);
  const gerollt = () => document.body.classList.toggle('rg-gerollt', scrollY > 40); addEventListener('scroll', gerollt, { passive: true }); gerollt();
  window.addEventListener('hashchange', () => { let z = location.hash.slice(1); if (z === 'bereiche') z = 'geprueft'; if (TITEL[z] && z !== S.ansicht) gehe(z); });
  window.KI_CHECK = 1;
  window.KI_CHECK_STAND = () => JSON.parse(JSON.stringify(S.d));   /* nur lesen: was gerade angezeigt wird (Prüfläufe) */
})();
