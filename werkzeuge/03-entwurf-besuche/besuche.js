/* Wer hat den Entwurf geöffnet (Werkzeug 03) · Tasty Studios. Robert sieht, ob ein möglicher Kunde seinen Entwurf geöffnet hat:
   «Nein, noch niemand vom Haus» oder «Ja: wer, wann, welche Seiten, wie lange, wie tief». Maschinen und unsere eigenen Aufrufe zählen nie.
   Aufbau, Ansichten, Grössen und Bewegung aus Le Registre (vorlage/culinarium-demo/werkzeuge/registre/uwerkzeuge/registre/registre.js), Rahmen wie Le Bureau
   (Kopf mit Zentrale, Prüfung und Anleitung), Kleid aus zentrale/oberflaeche/ (kleid/tasty.js und tasty.css). Inhalt aus der ersten Fassung:
   Daten nur über /api/03-entwurf-besuche/… (api.py liest den Dienst tasty-besuche oder die Probedaten, rechnet Zeilen, Wege und «neu»), hier wird nichts gezählt.
   Jede Änderung (gesehen, Schlüssel) zeigt eine Quittung mit vorher und nachher und «Rückgängig»; Entfernen nur nach Rückfrage im Fenster. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const API = '/zentrale/api/03-entwurf-besuche/';
const W = '03-entwurf-besuche';
const ZURUECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';
const LADEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.8 7.6 8 10.8l3.2-3.2M3 13.5h10"/></svg>';   /* Zeichen «sichern» aus der Vorlage (SYM.laden) */
const ZT = '<svg class="zt" viewBox="0 0 1744 1688" aria-hidden="true"><use href="#zeichen"/></svg>';   /* das T aus dem Kleid (WO_HAUS.zeichen) */
const SPRACHE = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', nl: 'Niederländisch', es: 'Spanisch', pt: 'Portugiesisch' };
const BEREICHE = [
  ['start', 'Übersicht', ''], ['', 'Die Entwürfe'], ['haeuser', 'Alle Häuser', 'neu'], ['besuche', 'Besuche', 'besuche'],
  ['', 'Gut zu wissen'], ['zaehlung', 'So wird gezählt', ''], ['schluessel', 'Der Schlüssel', '']];
const TITEL = Object.fromEntries(BEREICHE.filter(x => x[0]).map(x => [x[0], x[1]]));
TITEL.haus = 'Ein Haus';   /* erreichbar über die Häuser, im Rand steht dann «Alle Häuser» */
const AB = new URLSearchParams(location.search);
const WER = (window.WO_HAUS && WO_HAUS.wer) || AB.get('wer') || '';
const S = { d: null, ansicht: 'start', haus: '', tage: 30, wahl: 0, filter: 'alle', sicht: 'alle', zeige: 40, erstes: true, gesehen: '' };

/* ---------- Helfer ---------- */
const n = x => Number(x || 0).toLocaleString('de-DE');
const mal = (z, eins, viele) => z === 1 ? eins : n(z) + ' ' + viele;
function dauer(sek, kurz) {
  if (!sek) return kurz ? 'unter 1 Sek.' : 'unter einer Sekunde';
  if (sek < 60) return sek + (kurz ? ' Sek.' : (sek === 1 ? ' Sekunde' : ' Sekunden'));
  const m = Math.floor(sek / 60), s = sek % 60;
  if (kurz || m < 10) return m + ' Min.' + (s ? ' ' + s + ' Sek.' : '');
  return m + ' Minuten';
}
function heuteHier() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function schiebe(iso, tage) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + tage); return d.toISOString().slice(0, 10); }
function tagWort(iso, lang) {
  const d = new Date(iso + 'T12:00:00'), h = new Date(heuteHier() + 'T12:00:00'), diff = Math.round((h - d) / 864e5);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  return d.toLocaleDateString('de-DE', lang ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: '2-digit', month: '2-digit' });
}
const datum = iso => { const t = String(iso || '').slice(0, 10).split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : ''; };
const kurzDatum = iso => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.';
function datumZeit(t) { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; }
const werText = w => w.name || (w.code ? 'Link ' + w.code : 'Ohne Empfänger-Link');
const werKlein = w => w.name ? [w.rolle, w.code ? 'Link ' + w.code : ''].filter(Boolean).join(' · ') : (w.code ? 'Empfänger unbekannt' : 'Aufruf ohne Link-Code');
function ausgeblendet(a) {
  const t = [];
  if (a && a.maschinen) t.push(mal(a.maschinen, 'eine Maschine', 'Maschinen'));
  if (a && a.eigene) t.push(mal(a.eigene, 'ein eigener Aufruf', 'eigene Aufrufe'));
  return t.length ? t.join(' und ') + ' ausgeblendet' : '';
}
/* Foto je Haus (Listen zeigen zu jedem Eintrag ein Bild, wie die Vorlage): ein Foto aus dem Kleid, fest nach der Reihe der Häuser.
   Die Entwürfe selbst haben hier keine Bilder; das Foto ist nur das Erkennungszeichen des Hauses in den Listen. */
const FOTO_REIHE = ['haus', 'aussen', 'zimmer', 'terrasse', 'bar', 'tafel', 'empfang', 'anleger', 'faehre', 'speicherstadt'];
function hausFoto(k) {
  const l = ((S.d && S.d.zeilen) || []).map(z => z.kuerzel).sort(), i = Math.max(0, l.indexOf(k));
  return WO_HAUS.fotos[FOTO_REIHE[i % FOTO_REIHE.length]];
}
function sbild(k) { return k ? `<img class="sbild" src="${esc(hausFoto(k))}" alt="" width="104" height="78" loading="lazy" decoding="async">` : '<i class="sbild sbild--leer" aria-hidden="true"></i>'; }
const mitBild = (k, name) => `<span class="mit-bild">${sbild(k)}<span>${esc(name)}</span></span>`;
const zeile_ = k => ((S.d && S.d.zeilen) || []).find(z => z.kuerzel === k);
/* Tor 30.10.2026 (Vorlage): die letzten zwei Wörter bleiben zusammen */
const zusammen = t => { const w = esc(t).split(' '); return w.length < 3 ? w.join(' ') : w.slice(0, -2).join(' ') + ' <span style="white-space:nowrap">' + w.slice(-2).join(' ') + '</span>'; };

/* ---------- Quittung (Meldung unten rechts wie in der Vorlage, dazu vorher, nachher und «Rückgängig» wie in Le Bureau) ---------- */
function quit(titel, text, fehl = false, zeit = 5000, o = {}) {
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.setAttribute('role', fehl ? 'alert' : 'status');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}`
    + (o.vorher != null ? `<dl class="quit__vn"><div><dt>Vorher</dt><dd>${esc(o.vorher)}</dd></div><div><dt>Nachher</dt><dd>${esc(o.nachher)}</dd></div></dl>` : '')
    + (o.rueck ? '<button class="link quit__rueck" type="button" data-rueck>Rückgängig</button>' : '') + '</div>';
  const x = document.createElement('button'); x.type = 'button'; x.className = 'quit__zu'; x.setAttribute('aria-label', 'Schliessen'); x.innerHTML = ZURUECK; x.onclick = () => q.remove(); q.appendChild(x);
  if (o.rueck) $('[data-rueck]', q).onclick = () => { q.remove(); o.rueck(); };
  $('#meldung').appendChild(q);
  while ($('#meldung').children.length > 3) $('#meldung').firstChild.remove();
  if (zeit) setTimeout(() => q.remove(), zeit);
  return q;
}

/* ---------- Fenster (Feld-Fenster wie in Le Bureau: Blatt über abgedunkeltem Grund, Esc und Klick daneben schliessen) ---------- */
function fenster(titel, akzent, inhalt, knoepfe, name) {
  const ort = $('#fenster'), vorher = document.activeElement;
  const zu = () => { ort.innerHTML = ''; document.removeEventListener('keydown', taste); if (vorher && vorher.isConnected && vorher.focus) vorher.focus(); };
  const taste = e => { if (e.key === 'Escape') zu(); };
  ort.innerHTML = `<div class="fenster"><button class="fenster__grund" type="button" aria-label="Schliessen"></button>
    <div class="fenster__blatt" role="dialog" aria-modal="true" aria-label="${esc(titel + ' ' + akzent)}" data-fenster="${esc(name || '1')}">
      <h2>${esc(titel)} <span class="t-akzent">${esc(akzent)}</span></h2>${inhalt}
      <div class="fenster__kn">${knoepfe.map((k, i) => k.haupt ? WO.knopf(esc(k.text), k.zeichen || 'haken', 'gold', { klein: true, attr: `data-kn="${i}"` }) : `<button class="fenster__link" type="button" data-kn="${i}">${esc(k.text)}</button>`).join('')}</div></div></div>`;
  $('.fenster__grund', ort).onclick = zu;
  knoepfe.forEach((k, i) => { $(`[data-kn="${i}"]`, ort).onclick = () => (k.tun ? k.tun(zu) : zu()); });
  document.addEventListener('keydown', taste);
  const f = $('input', ort) || $('[data-kn]', ort); if (f) f.focus();
  return zu;
}

/* ---------- Daten ---------- */
async function hole(weg, art = 'GET', daten) {
  const o = { method: art, cache: 'no-store', headers: {} };
  if (daten) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(daten); }
  let r, d = {};
  try { r = await fetch(API + weg, o); } catch (e) { throw new Error('Der Server antwortet nicht. Läuft python3 zentrale/server.py?'); }
  try { d = await r.json(); } catch (e) { throw new Error('Die Antwort war nicht lesbar (' + r.status + ').'); }
  if (!r.ok || d.ok === false) throw new Error(d.fehler || ('Fehler ' + r.status));
  return d;
}
async function lade() {
  /* Das erste Laden zählt als Öffnen des Werkzeugs (api.py: mehrere Aufrufe innerhalb von 30 Minuten gelten als ein Öffnen) */
  const d = await hole('haeuser?tage=' + S.tage + '&' + (S.erstes ? 'oeffnen=1&' : '') + 'wer=' + encodeURIComponent(WER));   /* Zeitraum 7, 30 oder 90 Tage wie Le Registre */
  S.erstes = false;
  d.probe = d.quelle === 'probe';
  d.neu = d.zeilen.reduce((a, z) => a + z.neu, 0);
  d.offen = d.zeilen.filter(z => z.geoeffnet).length;
  d.besuche = d.besuche || [];
  if (S.d && d.tage && d.tage !== S.tage) return false;   /* schnell umgeschaltet: eine ältere Antwort überschreibt nie den neueren Zeitraum */
  S.d = d;
}

/* ---------- Rahmen ---------- */
/* Kopf, Rand, Leiste und Startbild kommen aus der Oberfläche (zentrale/oberflaeche/, Kleid tasty), kein eigener Kopf und kein eigenes Startbild.
   Rahmen wie Le Bureau: rund Zentrale, Prüfung und Anleitung, dazu «Website ansehen» (die Agentur-Seite). */
const NAME = WO.name(W), STUBE = WO_HAUS.wege.zentrale, STUBE_N = WO.name('zentrale');
function standText() {
  const d = S.d;
  if (d.probe) return 'Probedaten · keine echten Besuche';
  if (d.quelle === 'dienst-alt') return 'Letzter abgerufener Stand';
  return d.neu ? mal(d.neu, 'Ein neuer Besuch', 'neue Besuche') : 'Nichts Neues seit dem letzten Öffnen';
}
function kopfLeiste() {
  $('#kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Entwürfe', titel: S.ansicht === 'haus' && zeile_(S.haus) ? zeile_(S.haus).name : (TITEL[S.ansicht] || NAME),
    stand: standText(), pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WO_HAUS.wege.website, markeHref: '#start', marke: `data-gehe="start" aria-label="${esc(NAME)}, Übersicht"` });
  $$('#kopf [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
}
function rand() {
  const d = S.d, an = S.ansicht === 'haus' ? 'haeuser' : S.ansicht, gruppen = [];
  BEREICHE.forEach(([key, name, zahl]) => {
    if (!key) { gruppen.push({ titel: name, eintraege: [] }); return; }
    if (!gruppen.length) gruppen.push({ titel: '', eintraege: [] });
    const z = zahl === 'neu' ? d.zeilen.filter(x => x.neu).length : zahl === 'besuche' ? d.neu : 0;
    gruppen[gruppen.length - 1].eintraege.push({ text: name, an: an === key, zahl: z ? n(z) : 0, attr: `data-gehe="${key}"` });
  });
  gruppen.push({ titel: 'Wege', eintraege: [{ text: STUBE_N, href: STUBE, attr: 'data-weg' }, { text: 'Kurzer Rundgang', attr: 'data-weg data-rundgang' }] });
  $('#rand').innerHTML = WO.rand(gruppen, { website: WO_HAUS.wege.website, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  $$('#rand [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
  $$('#rand [data-rundgang]').forEach(a => a.onclick = () => { if (window.rundgang) window.rundgang(); });
  kopfLeiste();
}
/* Leiste: links der Stand, rechts «Neu laden» und der Knopf für «gesehen» in den Farben des Speichern-Knopfs der Vorlage:
   gelb (wo-kn--wartet) solange Neues offen ist, grün (wo-kn--fertig) gleich nach dem Markieren, sonst grau (glas, gesperrt). */
function leiste() {
  const d = S.d;
  const titel = d.probe ? 'Du siehst Probedaten' : d.neu ? mal(d.neu, 'Ein neuer Besuch', 'neue Besuche') : 'Nichts Neues';
  const satz = (d.probe ? 'Erfunden, im Format des Dienstes. ' : '') + 'Letzte ' + n(S.tage) + ' Tage: '
    + (d.neu ? mal(d.zeilen.filter(z => z.neu).length, 'Ein Haus hat', 'Häuser haben') + ' seit dem letzten Öffnen den Entwurf angesehen.'
      : n(d.offen) + ' von ' + n(d.zeilen.length) + ' Häusern haben ihren Entwurf geöffnet.');
  const art = S.gesehen === 'fertig' ? 'fertig' : d.neu ? 'wartet' : 'glas';
  const text = S.gesehen === 'fertig' ? 'Gesehen' : d.neu ? 'Als gesehen markieren' : 'Alles gesehen';
  const kn = WO.knopf('Als Tabelle sichern', 'kopie', 'glas', { klein: true, id: 'l-export', titel: 'Alle Besuche des gewählten Zeitraums als Tabelle (CSV, öffnet in Excel und Numbers)', attr: 'aria-label="Als Tabelle sichern"' })
    + WO.knopf('Neu laden', 'verlauf', 'glas', { klein: true, id: 'l-neu', attr: 'aria-label="Neu laden"' })
    + WO.knopf(text, 'haken', art, { klein: true, id: 'l-gesehen', disabled: art === 'glas', titel: 'Neue Besuche nicht mehr hervorheben (mit Rückgängig)' });
  $('#leiste').innerHTML = WO.leiste({ titel, satz, entwurf: false, knoepfe: kn });
  $('#l-export').onclick = () => sichern();
  $('#l-neu').onclick = () => frisch(true);
  $('#l-gesehen').onclick = () => gesehen();
}
/* Bühne: Kopf jeder Ansicht im Rahmen der Oberfläche; in der Übersicht die Kennzahlen als Schilder. Je Ansicht ein eigenes Foto aus dem Kleid. */
const BUEHNE = { start: [WO_HAUS.fotoJe[W], '50% 46%'], haeuser: ['aussen', '50% 45%'], besuche: ['plan', '50% 45%'], haus: ['anleger', '50% 50%'], zaehlung: ['empfang', '50% 45%'], schluessel: ['studio', '50% 50%'] };
function kopf(mono, titel, satz, rechts = '', chips = '') {
  const [bild, lage] = BUEHNE[S.ansicht] || BUEHNE.start, voll = S.ansicht === 'start';
  return WO.startbild({ werkzeug: W, art: voll ? 'voll' : 'buehne', foto: WO_HAUS.fotos[bild], zier: mono, h1: titel, satz,
    knoepfe: (voll ? WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) : '') + chips + rechts })
    .replace('<section class="wo-sb', `<section style="--wo-foto-pos:${lage}" class="buehne wo-sb`);
}
function chipsStart(d) {
  return `<ul class="buehne__chips"><li><b>${n(d.zeilen.length)}</b><span>Häuser</span></li><li><b>${n(d.offen)}</b><span>geöffnet</span></li><li><b>${n(d.neu)}</b><span>neu</span></li><li><b>${n(d.besuche.length)}</b><span>Besuche</span></li></ul>`;
}
function zeitraum() {   /* aus der Vorlage: Wahl 7 / 30 / 90 Tage im Startbild jeder Ansicht mit Besuchen */
  const k = t => `<button type="button" data-tage="${t}" class="${S.tage === t ? 'an' : ''}" aria-pressed="${S.tage === t}">${t} Tage</button>`;
  return `<div class="wahl3 wo-seg zeitraum" role="group" aria-label="Zeitraum">${k(7)}${k(30)}${k(90)}</div>`;
}
function hinweisBeispiel() {
  const d = S.d;
  if (d.probe) return `<p class="bsp-band"><b>Probedaten.</b> ${d.hinweis ? esc(d.hinweis) + '. ' : ''}Diese Häuser und Besuche sind erfunden, im Format des Dienstes tasty-besuche. Echte Besuche erscheinen, sobald unter «Der Schlüssel» der Schlüssel des Dienstes hinterlegt ist.</p>`;
  if (d.quelle === 'dienst-alt') return `<p class="bsp-band"><b>Letzter abgerufener Stand.</b> ${d.hinweis ? esc(d.hinweis.replace(/,.*$/, '')) : 'Der Dienst war gerade nicht erreichbar'}. Gezeigt wird der Stand vom ${esc(datumZeit(d.stand))}. <a class="link" href="pruefung.html#lex-dienst">Was tun?</a></p>`;
  return d.hinweis ? `<p class="bsp-band"><b>Hinweis.</b> ${esc(d.hinweis)}.</p>` : '';
}
function gehe(ziel, wahl) {
  if (ziel === 'haus' && wahl !== undefined && !/^\d+$/.test(String(wahl))) { S.haus = String(wahl); wahl = undefined; S.wahl = -1; }
  if (!TITEL[ziel] || (ziel === 'haus' && !zeile_(S.haus))) ziel = ziel === 'haus' ? 'haeuser' : 'start';
  /* Besuch in der Liste wählen: nur die Karte rechts wechselt, die Seite bleibt, wo sie ist (Vorlage) */
  const fach = $('#ansicht .detail');
  if ((ziel === 'besuche' || ziel === 'haus') && S.ansicht === ziel && wahl !== undefined && fach && S.d.besuche[+wahl]) {
    S.wahl = +wahl;
    $$('#ansicht .liste .besuch').forEach(a => { const an = +a.dataset.wahl === S.wahl; a.classList.toggle('aktiv', an); a.setAttribute('aria-pressed', an); });
    fach.innerHTML = detail(S.d.besuche[S.wahl]);
    if (matchMedia('(max-width:1180px)').matches && fach.getBoundingClientRect().top < 0) window.scrollBy({ top: fach.getBoundingClientRect().top - 90, behavior: 'instant' });
    return;
  }
  if (ziel !== S.ansicht) { S.filter = 'alle'; S.zeige = 40; }
  S.ansicht = ziel;
  if (wahl !== undefined) S.wahl = +wahl || 0;
  const h = ziel === 'haus' ? 'haus=' + encodeURIComponent(S.haus) : ziel;
  if (location.hash.slice(1) !== h) history.replaceState(null, '', location.pathname + location.search.replace(/([?&])haus=[^&]*&?/, '$1').replace(/[?&]$/, '') + '#' + h);
  rand(); zeichne();
  window.scrollTo(0, 0);
}
async function frisch(sagen = false) {
  try {
    if (await lade() === false) return;
    if (S.wahl >= S.d.besuche.length) S.wahl = 0;
    if (S.ansicht === 'haus' && !zeile_(S.haus)) S.ansicht = 'haeuser';
    rand(); leiste(); zeichne(true);
    if (sagen) quit('Neu geladen', standText(), false, 2500);
  } catch (e) { quit(NAME + ' ist gerade nicht abrufbar', e.message, true, 0); }
}

/* ---------- Gesehen (mit Quittung und Rückgängig) ---------- */
async function gesehen() {
  const vorherNeu = S.d.neu;
  if (!vorherNeu) return;
  try {
    const d = await hole('gesehen', 'POST', { wer: WER });
    S.gesehen = 'fertig';
    await frisch();
    setTimeout(() => { S.gesehen = ''; if (S.d) leiste(); }, 2600);
    quit('Als gesehen markiert', 'Neue Besuche werden nicht mehr hervorgehoben.', false, 12000, {
      vorher: mal(vorherNeu, 'ein neuer Besuch', 'neue Besuche'), nachher: 'nichts Neues',
      rueck: async () => {
        try { await hole('gesehen', 'POST', { zurueck: d.vorher }); S.gesehen = ''; await frisch(); quit('Zurückgenommen', '', false, 6000, { vorher: 'nichts Neues', nachher: mal(vorherNeu, 'ein neuer Besuch wieder hervorgehoben', 'neue Besuche wieder hervorgehoben') }); }
        catch (e) { quit('Nicht zurückgenommen', e.message, true, 0); }
      } });
  } catch (e) { quit('Nicht gespeichert', e.message, true, 0); }
}

/* ---------- Schlüssel (einmal eingeben, liegt nur in der Ablage, nie im Repo; Entfernen nur nach Rückfrage) ---------- */
let merkSchluessel = '';   /* nur im Arbeitsspeicher dieser Seite, für «Rückgängig» nach dem Entfernen */
function schluesselFenster() {
  fenster('Schlüssel', 'eingeben', `<p class="fenster__satz">Den Schlüssel des Dienstes tasty-besuche einmal eintragen. Er liegt danach nur in der Ablage des Werkzeugs auf diesem Rechner, nie im Repo, und kommt nie zurück in die Oberfläche.</p>
    <label class="feld"><span>Schlüssel</span><input type="password" name="k" autocomplete="off" spellcheck="false" placeholder="Schlüssel des Dienstes"></label><p class="feld__fehl" hidden></p>`,
  [{ text: 'Abbrechen' }, { text: 'Hinterlegen', haupt: true, zeichen: 'haken', tun: async zu => {
    const i = $('#fenster input'), k = i.value.trim(), f = $('#fenster .feld__fehl');
    if (!k) { f.hidden = false; f.textContent = 'Bitte den Schlüssel eintragen.'; i.focus(); return; }
    try { await schluesselSetzen(k); zu(); } catch (e) { f.hidden = false; f.textContent = e.message; }
  } }], 'schluessel');
  $('#fenster input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#fenster [data-kn="1"]').click(); });
}
async function schluesselSetzen(k, still) {
  await hole('schluessel', 'POST', { schluessel: k });
  merkSchluessel = k;
  await frisch();
  /* Quittung sagt nur, was wirklich geschah (Prüfung 07.11.2026): antwortet der Dienst nicht, steht das da, und die Probedaten bleiben genannt */
  const d = S.d, da = d.quelle === 'dienst';
  const text = da ? 'Die Besuche kommen jetzt vom Dienst.' : (d.hinweis ? d.hinweis.replace(/^./, c => c.toUpperCase()) + '.' : 'Der Dienst antwortet gerade nicht.');
  const nachher = 'Schlüssel in der Ablage, ' + (da ? 'Besuche vom Dienst' : d.probe ? 'weiter Probedaten' : 'letzter abgerufener Stand');
  if (!still) quit('Schlüssel hinterlegt', text, !da, 12000, { vorher: 'kein Schlüssel, Probedaten', nachher, rueck: () => schluesselWeg(true) });
  else quit('Schlüssel wieder hinterlegt', '', false, 6000, { vorher: 'kein Schlüssel', nachher: 'Schlüssel in der Ablage' });
}
function schluesselFrage() {
  fenster('Schlüssel', 'entfernen?', '<p class="fenster__satz">Danach zeigt das Werkzeug wieder Probedaten. Für echte Besuche musst du den Schlüssel neu eintragen; gleich danach geht es noch mit «Rückgängig».</p>',
    [{ text: 'Nein, behalten' }, { text: 'Ja, entfernen', haupt: true, zeichen: 'x', tun: async zu => { zu(); await schluesselWeg(false); } }], 'frage');
}
async function schluesselWeg(still) {
  try {
    await hole('schluessel', 'DELETE');
    await frisch();
    const k = merkSchluessel;
    quit(still ? 'Schlüssel wieder entfernt' : 'Schlüssel entfernt', still ? '' : 'Das Werkzeug zeigt wieder Probedaten.', false, 12000,
      { vorher: 'Schlüssel in der Ablage', nachher: 'kein Schlüssel, Probedaten', rueck: !still && k ? () => schluesselSetzen(k, true) : null });
  } catch (e) { quit('Schlüssel nicht entfernt', e.message, true, 0); }
}

/* ---------- Datenexport (aus der Vorlage): alle Besuche des gewählten Zeitraums als Tabelle, ohne uns und ohne Maschinen ----------
   Nur Angaben, die das Werkzeug ohnehin zeigt. Probedaten sind im Dateinamen und in der ersten Spalte gekennzeichnet. */
function zelle(x) {
  let t = String(x == null ? '' : x);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;   /* keine Formeln in Excel (CSV-Einschleusung) */
  return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function tabelle(liste, bsp) {
  const kopf = ['Art', 'Haus', 'Tag', 'Uhrzeit', 'Wer', 'Rolle', 'Empfänger-Link', 'Von wo', 'Gerät', 'Sprache des Browsers', 'Gekommen über', 'Geblieben (Sekunden)', 'Seiten', 'Wie tief (Prozent)', 'Neu', 'Weg durch den Entwurf'];
  const zeilen = liste.map(b => [bsp ? 'Probe' : 'Besuch', b.hausname, datum(b.tag), b.z, b.wer.name || '', b.wer.rolle || '', b.wer.code || '', b.von, b.geraet || '', SPRACHE[b.sprache] || b.sprache || '', b.herkunft || '',
    b.dauer, b.seiten, b.tief, b.neu ? 'ja' : 'nein', b.weg.map(x => x.seite + ' (' + x.sek + ' s)').join(' > ')]);
  return '\ufeff' + [kopf].concat(zeilen).map(z => z.map(zelle).join(';')).join('\r\n') + '\r\n';
}
function sichern() {
  const d = S.d, bsp = d.probe;
  try {
    const name = 'besuche-entwuerfe-' + d.von + '-bis-' + d.bis + (bsp ? '-probedaten' : '') + '.csv';
    const url = URL.createObjectURL(new Blob([tabelle(d.besuche, bsp)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    quit('Als Tabelle gesichert', name + ' · ' + mal(d.besuche.length, 'ein Besuch', 'Besuche') + (bsp ? ' · Probedaten' : ''));
  } catch (e) { quit('Die Tabelle liess sich nicht sichern', e.message, true, 0); }
}

/* ---------- Bausteine ---------- */
function balken(liste, name, klein, gesamt) {   /* Rangliste: Name, Balken, Zahl, Anteil. Der Balken wächst nur über transform. */
  if (!liste.length) return '<p class="nichts">Noch nichts gezählt.</p>';
  const max = Math.max(...liste.map(x => x.n)), ges = gesamt || liste.reduce((a, x) => a + x.n, 0);
  return `<ol class="rang">${liste.map((x, i) => `<li style="--i:${i}"><span class="rang__n">${name(x)}${klein ? `<small>${klein(x)}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, x.n / max).toFixed(3)}"></i></span><b>${n(x.n)}</b><em>${Math.round(100 * x.n / (ges || 1))}&nbsp;%</em></li>`).join('')}</ol>`;
}
function saeulen(werte, beschrift, tip, klasse = '') {
  const max = Math.max(1, ...werte);
  return `<div class="saeulen ${klasse}" style="--n:${werte.length}" role="img" aria-label="${esc(tip.label)}">
    ${werte.map((z, i) => `<div class="s" style="--i:${Math.round(i * 30 / werte.length)}" data-t="${esc(tip(i, z))}"><i style="--h:${z ? Math.max(.025, z / max).toFixed(3) : 0}"></i>${beschrift(i) ? `<span>${beschrift(i)}</span>` : ''}</div>`).join('')}
  </div>`;
}
function karteBesuch(b, i, aktiv) {
  const marke = b.neu ? 'Neu' : esc(b.geraet || '');
  return `<button class="besuch rg-a${b.neu ? ' gold' : ''}${aktiv ? ' aktiv' : ''}" type="button" data-gehe="${S.ansicht === 'haus' ? 'haus' : 'besuche'}" data-wahl="${i}" aria-pressed="${aktiv}">
    <span class="besuch__b">${sbild(b.haus)}<span class="besuch__l">${esc(b.l || '–')}</span></span>
    <span class="besuch__n"><b>${zusammen(b.hausname)}</b><small><i class="besuch__w">${esc(tagWort(b.tag) + ', ' + b.z + ' Uhr').replace(/ /g, ' ')}</i><i class="besuch__t"> · </i><i class="besuch__r">${[werText(b.wer), mal(b.seiten, 'eine Seite', 'Seiten'), dauer(b.dauer, true)].map(x => `<i class="besuch__s">${esc(x).replace(/ /g, ' ')}</i>`).join('')}</i></small></span>
    <span class="besuch__z">${marke}<small>${esc(b.von)}</small></span></button>`;
}
function leer(text) {
  return `<div class="leer blatt">${ZT}<b>${esc(text || 'Noch niemand hat einen Entwurf geöffnet.')}</b>
    <p>Sobald jemand vom Haus den Entwurf öffnet, steht der Besuch hier: wer, wann, von wo, welche Seiten in welcher Reihenfolge und wie lange.</p></div>`;
}

/* ---------- Ansichten ---------- */
function zeichne(ruhig) {
  const el = $('#ansicht');
  const f = { haeuser, besuche, haus, zaehlung, schluessel }[S.ansicht] || start;
  el.innerHTML = f();
  $$('[data-gehe]', el).forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe, b.dataset.haus || b.dataset.wahl); });
  $$('[data-tage]', el).forEach(b => b.onclick = () => { if (S.tage === +b.dataset.tage) return; S.tage = +b.dataset.tage; S.wahl = S.ansicht === 'haus' ? -1 : 0; S.zeige = 40; try { localStorage.setItem('tasty-besuche-tage', S.tage); } catch (e) { /* privat */ } frisch(); });
  $$('[data-sichern]', el).forEach(b => b.onclick = () => sichern());
  $$('[data-filter]', el).forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.wahl = -1; S.zeige = 40; zeichne(true); });
  $$('[data-sicht]', el).forEach(b => b.onclick = () => { S.sicht = b.dataset.sicht; zeichne(true); });
  $$('[data-mehr]', el).forEach(b => b.onclick = () => { S.zeige += 60; zeichne(true); });
  $$('[data-schluessel]', el).forEach(b => b.onclick = () => (S.d.schluessel ? schluesselFrage() : schluesselFenster()));
  document.title = (S.ansicht === 'haus' && zeile_(S.haus) ? zeile_(S.haus).name : TITEL[S.ansicht] || NAME) + ' · ' + NAME + ' · ' + WO.haus.name;
  schweben(el, ruhig);
}
/* Schweben (Rezeptur der Vorlage): sobald ein Blatt am unteren Rand auftaucht, schwebt es nach der Uhr an seinen Platz (.rg-da).
   Balken und Säulen wachsen erst, wenn ihr Blatt gut zur Hälfte im Bild ist (.rg-los). */
let IO = null, IO_LOS = null;
function schweben(el, still) {
  if (IO) IO.disconnect();
  if (IO_LOS) IO_LOS.disconnect();
  const ziele = [];
  const nimm = (sel, reihe) => $$(sel, el).forEach(x => { if (x.dataset.r) return; x.dataset.r = '1'; x.style.setProperty('--i', reihe ? Math.min([...x.parentNode.children].indexOf(x), 3) : 0); ziele.push(x); });
  nimm('.bsp-band, .wahl3--filter, .band, .tabelle, .leer, .zw, .mehr, .wenig, #ansicht > .blatt, #ansicht > .tafel, #ansicht > .fein', false);
  nimm('.zahlen > .blatt, .zwei > .blatt, .stapel > .blatt, .liste .besuch', true);
  const ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (still) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los', 'rg-ruhig')); return; }
  if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los')); return; }
  IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-da'); IO.unobserve(e.target); } }), { rootMargin: '0px 0px 8% 0px' });
  IO_LOS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-los'); IO_LOS.unobserve(e.target); } }), { threshold: .45 });
  ziele.filter(x => x.querySelector('.saeulen .s i,.rang__b i')).forEach(x => IO_LOS.observe(x));
  ziele.filter(x => !x.querySelector('.saeulen .s i,.rang__b i')).forEach(x => x.classList.add('rg-los'));
  ziele.forEach(x => IO.observe(x));
}

function start() {
  const d = S.d, bs = d.besuche;
  const gruss = /[?&]gruss=tag/.test(location.search) ? 'Guten Tag.' : WO.gruss();
  const satzS = 'Ob ein möglicher Kunde seinen Entwurf geöffnet hat: wer, wann, von wo, welche Seiten in welcher Reihenfolge und wie lange. Maschinen und unsere eigenen Aufrufe zählen nie.';
  let aus = kopf(esc(NAME + ' · ' + WO.haus.name), `${gruss}<br><em>Wer hat geöffnet?</em>`, satzS, zeitraum(), chipsStart(d)) + hinweisBeispiel();
  if (!d.zeilen.length) return aus + leer('Noch kein Haus bekannt.');
  const mitDauer = bs.filter(b => b.dauer > 0), mittel = mitDauer.length ? Math.round(mitDauer.reduce((a, b) => a + b.dauer, 0) / mitDauer.length) : null;
  /* Besuche je Tag: die letzten 7, 30 oder 90 Tage bis heute (Zeitraum oben) */
  const h = heuteHier(), T = S.tage, tage = Array.from({ length: T }, (_, i) => schiebe(h, i - T + 1)), schritt = T <= 7 ? 1 : T <= 30 ? 5 : 15, je = tage.map(t => bs.filter(b => b.tag === t).length);
  const geraete = Object.entries(bs.reduce((a, b) => (a[b.geraet || 'Nicht bekannt'] = (a[b.geraet || 'Nicht bekannt'] || 0) + 1, a), {})).map(([k, z]) => ({ k, n: z })).sort((a, b) => b.n - a.n);
  const leute = [];
  bs.forEach(b => { const k = b.haus + '|' + (b.wer.code || ''); const x = leute.find(y => y.id === k); if (x) x.n++; else leute.push({ id: k, w: b.wer, haus: b.hausname, k: b.haus, n: 1 }); });
  leute.sort((a, b) => b.n - a.n);
  aus += `<div class="zahlen">
      <div class="blatt"><span class="mono">Häuser</span><b>${n(d.zeilen.length)}</b><small>mit Entwurf</small></div>
      <div class="blatt"><span class="mono">Geöffnet</span><b>${n(d.offen)}</b><small>${d.zeilen.length - d.offen ? mal(d.zeilen.length - d.offen, 'ein Haus noch nicht', 'Häuser noch nicht') : 'alle Häuser'}</small></div>
      <div class="blatt"><span class="mono">Neue Besuche</span><b>${n(d.neu)}</b><small>seit dem letzten Öffnen</small></div>
      <div class="blatt"><span class="mono">Zeit je Besuch</span><b>${mittel != null ? Math.floor(mittel / 60) + ':' + String(mittel % 60).padStart(2, '0') : '–'}</b><small>Minuten im Schnitt</small></div>
    </div>
    <section class="blatt tafel">
      <header><h3>Besuche je Tag</h3><p>${esc(datum(tage[0]))} bis ${esc(datum(h))}<span class="tafel__weiter"><span aria-hidden="true">·</span><button class="link" type="button" data-gehe="besuche">Alle Besuche</button></span></p></header>
      ${saeulen(je, i => (T - 1 - i) % schritt === 0 ? kurzDatum(tage[i]) : '', Object.assign((i, z) => tagWort(tage[i]) + ': ' + mal(z, 'ein Besuch', 'Besuche'), { label: 'Besuche je Tag' }))}
    </section>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Welche Häuser geöffnet haben</h3><button class="link" type="button" data-gehe="haeuser">Alle Häuser</button></header>
          ${balken(d.zeilen.filter(z => z.besuche).map(z => ({ name: z.name, ort: z.ort, n: z.besuche })).slice(0, 5), x => esc(x.name), x => esc(x.ort), bs.length)}</section>
        <section class="blatt"><header><h3>Handy oder Rechner</h3></header>${balken(geraete, x => esc(x.k), null, bs.length)}</section>
      </div>
      <section class="blatt"><header><h3>Wer geöffnet hat</h3><button class="link" type="button" data-gehe="besuche">Alle Besuche</button></header>
        ${balken(leute.slice(0, 6), x => mitBild(x.k, werText(x.w)), x => esc(x.haus) + (x.w.rolle ? ' · ' + esc(x.w.rolle) : ''), bs.length)}</section>
    </div>
    <h2 class="zw">Zuletzt <em>geöffnet</em></h2>
    <div class="liste liste--start">${bs.slice(0, 5).map((b, i) => karteBesuch(b, i, false)).join('') || leer()}</div>
    <p class="mehr">${WO.knopf('Alle Besuche', 'rechts', 'hell', { klein: true, attr: 'data-gehe="besuche"' })}</p>`;
  return aus;
}

/* Alle Häuser: je Haus eine Zeile (Tabelle wie «Seiten» der Vorlage), Auswahl oben, Klick öffnet das Haus */
function haeuser() {
  const d = S.d;
  let aus = kopf('Alle Häuser', 'Je Haus <em>eine Zeile.</em>', 'Geöffnet oder noch niemand, der letzte Besuch, von wo, wer über welchen Empfänger-Link, welche Seiten in welcher Reihenfolge und wie lange. Ein Klick zeigt den Weg jedes Besuchers.', zeitraum()) + hinweisBeispiel();
  if (!d.zeilen.length) return aus + leer('Noch kein Haus bekannt.');
  const nach = { alle: d.zeilen, offen: d.zeilen.filter(z => z.geoeffnet), zu: d.zeilen.filter(z => !z.geoeffnet), neu: d.zeilen.filter(z => z.neu) };
  const l = nach[S.sicht] || d.zeilen;
  const f = (k, name) => `<button type="button" data-sicht="${k}" class="${S.sicht === k ? 'an' : ''}" aria-pressed="${S.sicht === k}">${name} · ${n(nach[k].length)}</button>`;
  aus += `<div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle Häuser')}${f('offen', 'Geöffnet')}${f('zu', 'Noch niemand')}${f('neu', 'Neu')}</div>`;
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Haus in dieser Auswahl.</b> ${S.sicht === 'neu' ? 'Seit dem letzten Öffnen kam kein neuer Besuch.' : ''}</div>`;
  aus += `<section class="blatt tabelle tabelle--haus">
    <div class="zeile zeile--haus zeile--kopf"><span>Haus</span><span>Stand</span><span>Letzter Besuch</span><span>Wer</span><span>Seiten, in dieser Reihenfolge</span><span>Wie lange</span></div>
    ${l.map((z, i) => { const b = z.letzter;
      return `<button type="button" class="zeile zeile--haus${z.neu ? ' gold' : ''}${z.geoeffnet ? '' : ' zu'}" style="--i:${Math.min(i, 20)}" data-gehe="haus" data-haus="${esc(z.kuerzel)}">
      <span class="zeile__n"><span class="mit-bild">${sbild(z.kuerzel)}<span><b>${esc(z.name)}</b><small>${esc([z.ort, z.land].filter(Boolean).join(', '))}</small></span></span></span>
      <span class="zeile__st"><b>${z.geoeffnet ? 'Geöffnet' : 'Noch niemand'}</b><small>${z.geoeffnet ? mal(z.besuche, 'ein Besuch', 'Besuche') + (z.neu ? ' · ' + mal(z.neu, 'einer neu', 'neu') : '') : esc(ausgeblendet(z.ausgeblendet) || 'kein einziger Aufruf')}</small></span>
      <span class="zeile__w">${b ? `<b>${esc(tagWort(b.tag) + ', ' + b.z + ' Uhr')}</b><small>${esc(b.von)}${b.geraet ? ' · ' + esc(b.geraet) : ''}</small>` : '<b>–</b>'}</span>
      <span class="zeile__p">${b ? `<b>${esc(werText(b.wer))}</b><small>${esc(werKlein(b.wer))}${z.besucher.length > 1 ? ' · ' + z.besucher.length + ' Personen' : ''}</small>` : '<b>–</b>'}</span>
      <span class="zeile__s">${b ? `<b>${b.weg.map(x => esc(x.seite)).join(' <i>›</i> ')}</b><small>${mal(b.seiten, 'eine Seite', 'Seiten')}</small>` : '<b>–</b>'}</span>
      <span class="zeile__d">${b ? `<b>${esc(dauer(b.dauer, true))}</b><small>bis ${b.tief}&nbsp;% gescrollt</small>` : '<b>–</b>'}</span></button>`; }).join('')}
  </section>
  <p class="fein">${esc(ausgeblendet(d.ausgeblendet) ? 'Maschinen und eigene Aufrufe zählen nie: ' + ausgeblendet(d.ausgeblendet) + '.' : 'Maschinen und eigene Aufrufe zählen nie.')} Neue Besuche seit dem letzten Öffnen stehen zuerst.</p>`;
  return aus;
}

/* Liste und Karte: alle Besuche (Ansicht «Besuche») oder die eines Hauses (Ansicht «haus»), Karte mit dem Weg als Zeitleiste */
function eingang(alle, filterLeiste) {
  const d = S.d;
  const nach = { alle, neu: alle.filter(x => x[0].neu), rechner: alle.filter(x => x[0].geraet === 'Rechner'), handy: alle.filter(x => x[0].geraet === 'Handy' || x[0].geraet === 'Tablet') };
  const l = nach[S.filter] || alle;
  if (!l.some(x => x[1] === S.wahl)) S.wahl = l.length ? l[0][1] : -1;
  const b = d.besuche[S.wahl];
  const f = (k, name) => `<button type="button" data-filter="${k}" class="${S.filter === k ? 'an' : ''}" aria-pressed="${S.filter === k}">${name} · ${n(nach[k].length)}</button>`;
  let aus = filterLeiste ? `<div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle')}${f('neu', 'Neu')}${f('rechner', 'Am Rechner')}${f('handy', 'Am Handy')}</div>` : '';
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Besuch in dieser Auswahl.</b> Niemand hat den Entwurf auf diesem Weg geöffnet.</div>`;
  let letzter = '';
  const liste = l.slice(0, S.zeige).map(([x, i]) => { const k = x.tag !== letzter ? `<p class="tagzeile">${esc(tagWort(x.tag, true))}</p>` : ''; letzter = x.tag; return k + karteBesuch(x, i, i === S.wahl); }).join('');
  aus += `<div class="eingang">
    <div class="liste">${liste}${l.length > S.zeige ? `<button class="link weitere" type="button" data-mehr>Weitere ${n(Math.min(60, l.length - S.zeige))} zeigen</button>` : ''}</div>
    <div class="detail rg-detail">${b ? detail(b) : ''}</div></div>${filterLeiste ? `
    <p class="mehr sichern"><button class="kn kn--linie" type="button" data-sichern>Alle Besuche als Tabelle sichern<i>${LADEN}</i></button></p>` : ''}`;
  return aus;
}
function besuche() {
  const d = S.d;
  const aus = kopf('Besuche', 'Jeder Besuch, <em>Seite für Seite.</em>', 'Wann jemand vom Haus kam, von wo, über welchen Empfänger-Link, welche Seiten er in welcher Reihenfolge ansah, wie lange und wie tief er scrollte.', zeitraum()) + hinweisBeispiel();
  if (!d.besuche.length) return aus + leer();
  return aus + eingang(d.besuche.map((b, i) => [b, i]), true);
}
function haus() {
  const d = S.d, z = zeile_(S.haus);
  const ort = [z.ort, z.land].filter(Boolean).join(', ');
  const satz = (ort ? esc(ort) + '. ' : '') + (z.geoeffnet
    ? mal(z.besuche, 'Ein Besuch', 'Besuche') + ' von ' + mal(z.besucher.length, 'einer Person', 'Personen') + (z.neu ? ', davon ' + mal(z.neu, 'einer neu', 'neu') : '') + '.'
    : 'Noch niemand vom Haus hat den Entwurf geöffnet.') + (ausgeblendet(z.ausgeblendet) ? ' ' + esc(ausgeblendet(z.ausgeblendet).replace(/^./, c => c.toUpperCase())) + '.' : '');
  const kn = WO.knopf('Alle Häuser', 'links', 'glas', { attr: 'data-gehe="haeuser"' }) + (z.entwurf ? WO.knopf('Entwurf ansehen', 'pfeil', 'gold', { href: esc(z.entwurf), neu: true }) : '');
  let aus = kopf(esc('Ein Haus · ' + (ort || NAME)), `${esc(z.name)}<br><em>${z.geoeffnet ? 'Geöffnet.' : 'Noch niemand.'}</em>`, satz, kn + zeitraum()) + hinweisBeispiel();
  aus += `<div class="band blatt"><div><span class="mono">Stand</span><b>${z.geoeffnet ? 'Geöffnet' : 'Noch niemand'}</b></div>
      <div><span class="mono">Besuche</span><b>${n(z.besuche)}</b></div>
      <div><span class="mono">Personen</span><b>${n(z.besucher.length)}</b></div>
      <div><span class="mono">Neu</span><b>${n(z.neu)}</b></div></div>
    ${z.entwurf ? `<p class="fein">Entwurf unter <a class="link" href="${esc(z.entwurf)}" target="_blank" rel="noopener">${esc(z.entwurf.replace(/^https?:\/\//, ''))}</a></p>` : ''}`;
  const alle = d.besuche.map((b, i) => [b, i]).filter(x => x[0].haus === S.haus);
  if (!alle.length) return aus + leer(ausgeblendet(z.ausgeblendet) ? 'Nur Maschinen oder wir selbst.' : 'Noch kein einziger Aufruf.');
  return aus + '<h2 class="zw">Der Weg <em>jedes Besuchers</em></h2>' + eingang(alle, false);
}
function detail(b) {
  const schritte = b.weg.map((x, i) => `<li style="--i:${Math.min(i, 12)}"><time>${esc(x.z)}</time><div><b>${esc(x.seite)}</b><small>bis ${x.tief}&nbsp;% gesehen</small>
      <span class="tief" aria-hidden="true"><i style="--t:${(x.tief / 100).toFixed(2)}"></i></span></div><em>${dauer(x.sek, true)}</em></li>`).join('');
  return `<article class="blatt besuchsblatt">
    <div class="besuchsblatt__kopf"><div><span class="mono">Besuch · ${esc(tagWort(b.tag, true))}</span><h2>${esc(werText(b.wer))}</h2><p class="besuchsblatt__wer">${esc([werKlein(b.wer), b.hausname].filter(Boolean).join(' · '))}</p></div>
      ${b.neu ? '<span class="siegel">Neu</span>' : ''}</div>
    <dl class="angaben">
      <div><dt>Gekommen</dt><dd>${esc(b.z)} Uhr</dd></div>
      <div><dt>Geblieben</dt><dd>${dauer(b.dauer, true)}</dd></div>
      <div><dt>Seiten</dt><dd>${n(b.seiten)}</dd></div>
      <div><dt>Von wo</dt><dd>${esc(b.von)}</dd></div>
      <div><dt>Gerät</dt><dd>${esc(b.geraet || '–')}</dd></div>
      <div><dt>Wie tief</dt><dd>bis ${b.tief}&nbsp;%</dd></div>
    </dl>
    <h3 class="wegtitel">Der Weg durch den Entwurf</h3>
    <ol class="weg">${schritte}</ol>
    <figure class="besuch__buehne" aria-hidden="true"><img src="${esc(hausFoto(b.haus))}" alt="" loading="lazy" decoding="async"></figure>
    <p class="fein">Die Zeit zählt nur, solange die Seite im Vordergrund war. «Wie tief»: wie weit auf der Seite gescrollt wurde. Uhrzeit in Hamburg.${b.sprache ? ' Sprache des Browsers: ' + esc(SPRACHE[b.sprache] || b.sprache) + '.' : ''}${b.herkunft ? ' Gekommen über: ' + esc(b.herkunft) + '.' : ''}</p>
  </article>`;
}

function zaehlung() {
  return kopf('So wird gezählt', 'Was das Werkzeug <em>weiss und was nicht.</em>', 'Es zählt nicht selbst: es liest den Dienst tasty-besuche, der jeden Aufruf eines Entwurfs festhält, und lässt alles weg, was kein Mensch vom Haus ist.') + `
  <div class="zwei">
    <section class="blatt liste-txt"><h3>Was zählt</h3><ul>
      <li>Jeder Aufruf eines Entwurfs durch einen Menschen: wann, von wo (Ort und Land der Verbindung) und mit welchem Gerät</li>
      <li>Wer: der Empfänger-Link-Code aus dem Link, den das Haus bekommen hat. Steht der Code in der Liste der Empfänger, erscheint der Name</li>
      <li>Welche Seiten in welcher Reihenfolge, wie lange jede im Vordergrund war und wie tief darauf gescrollt wurde</li>
      <li>Aufrufe mit höchstens 30 Minuten Pause gehören zu einem Besuch</li></ul></section>
    <section class="blatt liste-txt"><h3>Was nie zählt</h3><ul>
      <li>Maschinen: Vorschauen von WhatsApp und Mail, Suchmaschinen, Prüfdienste, Aufrufe aus Rechenzentren und auffällige Schwärme</li>
      <li>Unsere eigenen Aufrufe: Links mit den Codes robert, tasty oder anna, Probe-Aufrufe und alles von localhost</li>
      <li>Kein Name, den das Haus nicht selbst über seinen Link mitbringt; keine Adresse der Verbindung</li></ul></section>
  </div>
  <section class="blatt liste-txt"><h3>Gut zu wissen</h3><ul>
    <li><b>Neu:</b> was seit dem vorletzten Öffnen dieses Werkzeugs dazukam. Mehrere Aufrufe innerhalb von 30 Minuten gelten als ein Öffnen, damit ein Neuladen nichts löscht. «Als gesehen markieren» nimmt die Hervorhebung weg, mit «Rückgängig».</li>

    <li><b>Probedaten:</b> ohne Schlüssel zeigt das Werkzeug erfundene Häuser im Format des Dienstes; ihre Tage rücken auf heute.</li>
    <li><b>Dienst nicht erreichbar:</b> dann steht der letzte abgerufene Stand da, mit Datum.</li>
    <li><b>Uhrzeit:</b> alle Zeiten in Hamburger Zeit.</li></ul></section>`;
}

function schluessel() {
  const d = S.d;
  const quelle = d.probe ? 'Probedaten' : d.quelle === 'dienst-alt' ? 'Letzter Stand' : 'Dienst';
  const kn = (art, klein) => WO.knopf(d.schluessel ? 'Schlüssel entfernen' : 'Schlüssel eingeben', d.schluessel ? 'x' : 'plus', art, { klein, attr: 'data-schluessel' });
  return kopf('Der Schlüssel', 'Der Schlüssel <em>zum Dienst.</em>', 'Einmal eintragen, dann kommen die echten Besuche. Er liegt nur in der Ablage auf diesem Rechner, nie im Repo, und kommt nie zurück in die Oberfläche.', kn('gold', false)) + hinweisBeispiel() + `
  <div class="band blatt"><div><span class="mono">Schlüssel</span><b>${d.schluessel ? 'Hinterlegt' : 'Keiner'}</b></div>
    <div><span class="mono">Quelle</span><b>${esc(quelle)}</b></div>
    <div><span class="mono">Stand</span><b>${esc(datum(d.stand))}</b></div>
    <div><span class="mono">Ausgeblendet</span><b>${n((d.ausgeblendet.maschinen || 0) + (d.ausgeblendet.eigene || 0))}</b></div></div>
  <div class="zwei">
    <section class="blatt liste-txt"><h3>Wie es jetzt läuft</h3><ul>
      <li>${d.schluessel ? 'Ein Schlüssel ist hinterlegt. Die Besuche kommen vom Dienst tasty-besuche (letzte ' + S.tage + ' Tage).' : 'Kein Schlüssel hinterlegt. Das Werkzeug zeigt Probedaten, damit es ohne echte Daten bedienbar ist.'}</li>
      <li>Stand: ${esc(datumZeit(d.stand) || d.stand)}.${d.hinweis ? ' ' + esc(d.hinweis) + '.' : ''}</li>
      <li>${esc(ausgeblendet(d.ausgeblendet) ? ausgeblendet(d.ausgeblendet).replace(/^./, c => c.toUpperCase()) + '.' : 'Nichts ausgeblendet.')}</li></ul></section>
    <section class="blatt liste-txt"><h3>Sicher aufbewahrt</h3><ul>
      <li>Der Schlüssel liegt nur in daten/03-entwurf-besuche/ auf diesem Rechner, nicht in Git</li>
      <li>Abgefragt wird nur mit Schlüssel; ohne geht kein Aufruf nach aussen</li>
      <li>Entfernen nur nach Rückfrage, gleich danach mit «Rückgängig»</li></ul>
      <p class="mehr">${kn('hell', true)}</p></section>
  </div>`;
}

/* ---------- Start ---------- */
async function zeichenLaden() {   /* das T aus dem Kleid (WO_HAUS.zeichen), einmal geladen, überall per <use>; Füllung aus der Schriftfarbe */
  try { const r = await fetch(WO_HAUS.zeichen); const t = await r.text(); const m = t.match(/<svg[^>]*>([\s\S]*)<\/svg>/); if (m) $('#zeichen').innerHTML = m[1].replace(/<!--[\s\S]*?-->/g, '').replace(/\sfill="[^"]*"/g, ''); } catch (e) { /* ohne Zeichen geht alles weiter */ }
}
function ausAdresse() {
  const h = location.hash.slice(1), k = AB.get('haus');
  if (/^haus=/.test(h)) { S.haus = decodeURIComponent(h.slice(5)); return 'haus'; }
  if (k && !h) { S.haus = k; return 'haus'; }
  return TITEL[h] && h !== 'haus' ? h : 'start';
}
(async function () {
  $('#tuer h1').textContent = NAME + ' startet nicht.'; document.title = NAME + ' · ' + WO.haus.name; $('#rand').setAttribute('aria-label', 'Bereiche: ' + NAME);
  S.ansicht = ausAdresse();
  try { const t = +localStorage.getItem('tasty-besuche-tage'); if (t === 7 || t === 30 || t === 90) S.tage = t; } catch (e) { /* privat */ }
  const zeichen = zeichenLaden();
  try { await lade(); }
  catch (e) {
    $('#tuer').hidden = false; $('#tuer-t').textContent = e.message; $('#ansicht').innerHTML = '';
    $('#kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Entwürfe', titel: 'Startet nicht', stand: 'Prüfung öffnen', pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WO_HAUS.wege.website });
    if (!$('#tuer [data-neu]')) { $('#tuer').insertAdjacentHTML('beforeend', `<p class="tuer-zu__kn">${WO.knopf('Neu laden', 'verlauf', 'gold', { attr: 'data-neu' })}${WO.knopf('Prüfung öffnen', 'schild', 'hell', { href: 'pruefung.html' })}${WO.knopf(STUBE_N, 'haus', 'hell', { href: STUBE })}</p>`); $('#tuer [data-neu]').onclick = () => location.reload(); }
    return;
  }
  await zeichen;
  if (S.ansicht === 'haus' && !zeile_(S.haus)) S.ansicht = 'haeuser';
  if (S.ansicht === 'haus') S.wahl = -1;
  rand(); leiste(); zeichne();
  const gerollt = () => document.body.classList.toggle('rg-gerollt', scrollY > 40); addEventListener('scroll', gerollt, { passive: true }); gerollt();
  window.addEventListener('hashchange', () => { const z = ausAdresse(); if (z !== S.ansicht || z === 'haus') gehe(z, z === 'haus' ? S.haus : undefined); });
  window.TASTY_BESUCHE = 1;
  window.TASTY_BESUCHE_STAND = () => JSON.parse(JSON.stringify(S.d));   /* nur lesen: was gerade angezeigt wird (Prüfläufe) */
})();

/* Lange Besuche (aus der Vorlage): ist die Karte höher als der Platz zwischen Kopf und Leiste, klebt sie so, dass ihr Ende über der Leiste steht. Nur am Rechner, nur über top. */
(function () {
  let w = 0;
  function passe() {
    w = 0; const f = $('#ansicht .detail'); if (!f) return;
    if (!matchMedia('(min-width:1181px)').matches) { f.style.top = ''; return; }
    const h = f.offsetHeight, frei = innerHeight - 188;
    f.style.top = h > frei ? Math.round(innerHeight - 96 - h) + 'px' : '';
  }
  const bald = () => { if (!w) w = requestAnimationFrame(passe); };
  new MutationObserver(bald).observe($('#ansicht'), { childList: true, subtree: true });
  addEventListener('resize', bald);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bald);
})();
