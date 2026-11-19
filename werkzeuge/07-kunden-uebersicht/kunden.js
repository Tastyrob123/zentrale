/* Kunden-Übersicht · Tasty Studios (Werkzeug 07, Neubau im Kleid 07.11.2026). Für jeden Kunden mit fertiger Website auf einen Blick:
   läuft die Seite (Abruf und Verlauf), was kostet sie uns im Monat (Posten mit Quelle, nie geschätzt), was steht bei der Betreuung an (Termine, offene Wünsche),
   was sagt der Vertrag (Beginn, Laufzeit, Betreuungsmodell). Damit lässt sich laufende Betreuung verkaufen und belegen.
   Aufbau, Ansichten, Grössen und Bewegung aus der Vorlage Le Registre (vorlage/culinarium-demo/werkzeuge/registre/, registre.js), Rahmen wie Le Bureau
   (Kopf mit Prüfung und Anleitung, Leiste mit Speichern grau/gelb/grün, Feld-Fenster, Quittung mit vorher, nachher und «Rückgängig»).
   Kleid aus zentrale/oberflaeche/ (kleid/tasty.js und tasty.css), hier nie eigene Farben. Daten über /api/07-kunden-uebersicht/ (api.py, Ablage daten/07-kunden-uebersicht/).
   Was die Zentrale unter «Heute» zeigt, liefert api.py (heute), nicht diese Datei. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
const SYM = {
  laden: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.8 7.6 8 10.8l3.2-3.2M3 13.5h10"/></svg>',
  hoch: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2.5M2.8 5.6 6 2.4l3.2 3.2"/></svg>',
  runter: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2v7.5M2.8 6.4 6 9.6l3.2-3.2"/></svg>' };
const W = '07-kunden-uebersicht', API = '/zentrale/api/' + W + '/';
const BEREICHE = [
  ['start', 'Übersicht', ''], ['', 'Die Kunden'], ['kunden', 'Kunden', 'achtung'], ['seiten', 'Erreichbarkeit', 'aus'], ['betreuung', 'Betreuung', 'faellig'],
  ['', 'Das Geld'], ['kosten', 'Kosten', ''], ['vertraege', 'Verträge', ''], ['', 'Gut zu wissen'], ['so', 'So wird gerechnet', '']];
const TITEL = Object.fromEntries(BEREICHE.filter(x => x[0]).map(x => [x[0], x[1]]));
const NAME = WO.name(W), ZENTRALE = WO.name('zentrale');
const F = WO_HAUS.fotos;
const S = { kunden: [], heute: '', ansicht: 'start', tage: 30, filter: 'alle', wahl: null, zeige: 40, offen: {}, gesp: 0, laeuft: false };
const STAND_W = ['offen', 'in Arbeit', 'wartet auf das Haus', 'erledigt'];
const WAEHRUNG = ['EUR', 'CHF', 'USD'];

/* ---------- Helfer ---------- */
const n = x => Number(x || 0).toLocaleString('de-DE');
const mal = (z, eins, viele) => z === 1 ? eins : n(z) + ' ' + viele;
const datum = iso => { const t = String(iso || '').slice(0, 10).split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : ''; };
const kurzDatum = iso => iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.';
const uhr = iso => String(iso || '').slice(11, 16);
function tageBis(iso) { if (!iso) return null; return Math.round((new Date(String(iso).slice(0, 10) + 'T12:00:00') - new Date(S.heute + 'T12:00:00')) / 864e5); }
function tagWort(iso, lang) {
  const d = tageBis(iso);
  if (d === 0) return 'Heute'; if (d === -1) return 'Gestern'; if (d === 1) return 'Morgen';
  return new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('de-DE', lang ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: '2-digit', month: '2-digit' });
}
function schiebe(iso, tage) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + tage); return d.toISOString().slice(0, 10); }
function geld(b, w) {
  if (b == null || b === '') return 'offen';
  try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: w || 'EUR' }).format(b); } catch (e) { return Number(b).toFixed(2) + ' ' + (w || ''); }
}
const geldListe = summen => Object.keys(summen).length ? Object.entries(summen).map(([w, b]) => geld(b, w)).join(' und ') : 'offen';
/* Für die grossen Zahlen (Vorlage: alle Kennzahlen gleich gross, eine Zeile): der Betrag in Euro gross, weitere Währungen klein darunter, nie umgerechnet */
function geldGross(summen) {
  const e = Object.entries(summen).sort((a, b) => (a[0] !== 'EUR') - (b[0] !== 'EUR'));
  return e.length ? { haupt: geld(e[0][1], e[0][0]), rest: e.slice(1).map(([w, b]) => geld(b, w)).join(' und ') } : { haupt: 'offen', rest: '' };
}
function prozent(x, stellen = 1) { return x == null ? '–' : Number(x).toLocaleString('de-DE', { maximumFractionDigits: stellen }) + '&nbsp;%'; }
const zusammen = t => { const w = esc(t).split(' '); return w.length < 3 ? w.join(' ') : w.slice(0, -2).join(' ') + ' <span style="white-space:nowrap">' + w.slice(-2).join(' ') + '</span>'; };
const wer = () => WO_HAUS.wer || '';

/* Bild je Kunde (Vorlage: jede Liste zeigt zu jedem Eintrag sein Bild): ein Foto aus dem Kleid nach der Art des Hauses, nie ein erzeugtes */
function fotoVon(k) {
  const a = String((k && k.art) || '').toLowerCase();
  return F[/hotel|pension|zimmer/.test(a) ? 'zimmer' : /restaurant|gasthaus|wirtschaft|küche/.test(a) ? 'tafel' : /bar|café|cafe/.test(a) ? 'bar' : /shop|laden|handel/.test(a) ? 'bildschirm' : 'aussen'];
}
const kbild = k => `<img class="sbild" src="${esc(fotoVon(k))}" alt="" width="104" height="78" decoding="async">`;
const mitBild = k => `<span class="mit-bild">${kbild(k)}<span>${esc(k.name)}</span></span>`;

/* ---------- Lage eines Kunden (alles aus den Daten von api.py, nichts geschätzt) ---------- */
const istAus = k => !!(k.erreichbarkeit.zuletzt && !k.erreichbarkeit.zuletzt.ok);
const nieAbgerufen = k => !k.erreichbarkeit.zuletzt;
const termine = k => ((k.betreuung || {}).termine || []).slice().sort((a, b) => (a.wann || '9999').localeCompare(b.wann || '9999'));
const ueberfaellig = k => termine(k).filter(t => t.wann && tageBis(t.wann) < 0);
const bald = k => termine(k).filter(t => t.wann && tageBis(t.wann) >= 0 && tageBis(t.wann) <= S.tage);
const wuensche = k => ((k.betreuung || {}).wuensche || []).filter(w => w.stand !== 'erledigt');
const endetBald = k => k.vertragsende != null && tageBis(k.vertragsende) >= 0 && tageBis(k.vertragsende) <= 30;
const achtung = k => istAus(k) || ueberfaellig(k).length > 0 || endetBald(k);
const imZeitraum = k => (k.abrufe || []).filter(a => tageBis(a.zeit) > -S.tage);
function anteil(k) { const a = imZeitraum(k); return a.length ? 100 * a.filter(x => x.ok).length / a.length : null; }
function ausfaelle(k) { let z = 0, vor = true; imZeitraum(k).forEach(a => { if (vor && !a.ok) z++; vor = a.ok; }); return z; }
function antwortMs(k) { const a = imZeitraum(k).filter(x => x.ok && x.dauer_ms != null); return a.length ? Math.round(a.reduce((s, x) => s + x.dauer_ms, 0) / a.length) : null; }
function summe(liste, wert) { const s = {}; liste.forEach(x => { const v = wert(x); if (v && v.b != null) s[v.w || 'EUR'] = Math.round(((s[v.w || 'EUR'] || 0) + v.b) * 100) / 100; }); return s; }
const kostenSumme = ks => { const s = {}; ks.forEach(k => Object.entries(k.kosten_summe.summen).forEach(([w, b]) => { s[w] = Math.round(((s[w] || 0) + b) * 100) / 100; })); return s; };
const betreuungSumme = ks => summe(ks, k => k.vertrag && k.vertrag.betrag != null ? { b: k.vertrag.betrag, w: k.vertrag.waehrung } : null);
const probe = () => S.kunden.some(k => /\/probedaten\/seiten\//.test(k.adresse || ''));
function zustandText(k) { return nieAbgerufen(k) ? 'Nie abgerufen' : istAus(k) ? 'Antwortet nicht' : 'Erreichbar'; }

function quit(titel, text, fehl = false, zeit = 5000, stichwort = '') {   /* Meldung (Hinweis oder Fehler); «Was tun?» führt ins Lexikon der Prüfseite */
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : ''); q.setAttribute('role', fehl ? 'alert' : 'status');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}${stichwort ? `<a class="link" href="pruefung.html#${esc(stichwort)}" target="_blank" rel="noopener">Was tun?</a>` : ''}</div>`;
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Schliessen'); x.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>'; x.onclick = () => q.remove(); q.appendChild(x);
  $('#meldung').replaceChildren(q);   /* wie Le Bureau: immer nur eine Meldung, die neue ersetzt die alte */
  if (zeit) setTimeout(() => q.remove(), zeit);
}

/* ---------- Daten ---------- */
async function api(weg, methode = 'GET', daten) {
  let r;
  try { r = await fetch(API + weg, { method: methode, cache: 'no-store', headers: daten ? { 'Content-Type': 'application/json' } : {}, body: daten ? JSON.stringify(daten) : undefined }); }
  catch (e) { throw Object.assign(new Error('Der Server-Teil antwortet nicht.'), { stichwort: 'VERBINDUNG' }); }
  let d = {}; try { d = await r.json(); } catch (e) { /* leer */ }
  if (!r.ok) throw Object.assign(new Error(d.fehler || ('Unerwartete Antwort des Servers (' + r.status + ').')), { stichwort: r.status === 404 ? 'KUNDE' : 'EINGABE' });
  return d;
}
async function lade() {
  const d = await api('kunden?tage=30');
  S.kunden = d.kunden; S.heute = d.heute;
  if (S.wahl && !S.kunden.some(k => k.id === S.wahl)) S.wahl = null;
}
const kunde = id => S.kunden.find(k => k.id === id);
/* Was im Fenster übernommen, aber noch nicht gespeichert ist, steht in S.offen (Schlüssel «id|feld»). Die Ansichten zeigen den Kunden so, wie er nach dem Speichern wäre. */
function sicht(k) {
  if (!k) return k;
  const o = Object.values(S.offen).filter(x => x.id === k.id);
  if (!o.length) return k;
  const v = Object.assign({}, k);
  o.forEach(x => { if (x.feld === 'stammdaten') Object.assign(v, x.wert); else v[x.feld] = x.wert; });
  if (o.some(x => x.feld === 'kosten')) { const s = {}; let offen = 0; v.kosten.forEach(p => { if (p.betrag == null || p.betrag === '') offen++; else s[p.waehrung || 'EUR'] = Math.round(((s[p.waehrung || 'EUR'] || 0) + Number(p.betrag)) * 100) / 100; }); v.kosten_summe = { summen: s, offen, posten: v.kosten.length }; }
  return v;
}
const offenZahl = () => Object.keys(S.offen).length;
const offenBei = (id, feld) => !!S.offen[id + '|' + feld];

/* ---------- Rahmen (wie Le Bureau: Kopf mit Zentrale, Prüfung, Anleitung; Rand mit Gruppen und Zahlen; Leiste mit Speichern) ---------- */
function kopfLeiste() {
  const aus = S.kunden.filter(istAus).length, ks = S.kunden.length;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: W, unter: 'Kunden', titel: TITEL[S.ansicht] || NAME,
    stand: (probe() ? 'Probedaten · ' : '') + (!ks ? 'Noch kein Kunde' : aus ? mal(aus, 'eine Seite antwortet nicht', 'Seiten antworten nicht') : 'Alle Seiten erreichbar'),
    pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WO_HAUS.wege.website, markeHref: '#start', marke: `data-gehe="start" aria-label="${esc(NAME)}, Übersicht"` });
  $$('#kopf [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
}
function rand() {
  const an = S.ansicht, gruppen = [];
  const zahl = { achtung: S.kunden.filter(achtung).length, aus: S.kunden.filter(istAus).length, faellig: S.kunden.reduce((s, k) => s + ueberfaellig(k).length + bald(k).filter(t => tageBis(t.wann) <= 7).length, 0) };
  BEREICHE.forEach(([key, name, z]) => {
    if (!key) { gruppen.push({ titel: name, eintraege: [] }); return; }
    if (!gruppen.length) gruppen.push({ titel: '', eintraege: [] });
    gruppen[gruppen.length - 1].eintraege.push({ text: name, an: an === key, zahl: z && zahl[z] ? n(zahl[z]) : 0, attr: `data-gehe="${key}"` });
  });
  gruppen.push({ titel: 'Wege', eintraege: [{ text: ZENTRALE, href: WO_HAUS.wege.zentrale, attr: 'data-weg' }, { text: 'Kurzer Rundgang', attr: 'data-weg data-rundgang' }] });
  $('#rand').innerHTML = WO.rand(gruppen, { website: WO_HAUS.wege.website, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  $$('#rand [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
  $$('#rand [data-rundgang]').forEach(a => a.onclick = () => { if (window.rundgang) window.rundgang(); });
  kopfLeiste();
}
function leiste() {
  const o = offenZahl(), gesp = !o && S.gesp > Date.now();
  const titel = o ? n(o) + (o === 1 ? ' Eingabe' : ' Eingaben') + ' noch nicht gespeichert' : gesp ? 'Gespeichert' : probe() ? 'Du siehst Probedaten' : 'Alles ist gespeichert';
  const satz = o ? 'Erst «Speichern» schreibt sie in die Ablage. «Vorher, nachher» zeigt jede einzeln.'
    : gesp ? 'Die Quittung zeigt vorher und nachher, «Rückgängig» nimmt es zurück.'
    : probe() ? 'Erfundene Kunden, damit sich alles gefahrlos ausprobieren lässt.' : mal(S.kunden.length, 'Ein Kunde', 'Kunden') + ' mit fertiger Website.';
  /* «Als Tabelle sichern» steht wie in Le Registre in jeder Ansicht in der Leiste. «Speichern» ist wie in Le Bureau nie gesperrt: grau, gelb (offen), grün (gespeichert), immer voll deckend. */
  const kn = WO.knopf('Als Tabelle sichern', 'kopie', 'glas', { klein: true, id: 'l-export', titel: 'Alle Kunden mit Stand, Kosten, Vertrag und Betreuung als Tabelle (CSV, öffnet in Excel und Numbers)', attr: 'aria-label="Als Tabelle sichern"' })
    + WO.knopf('Vorher, nachher', 'auge', 'glas', { klein: true, id: 'l-vn', disabled: !o })
    + WO.knopf(gesp ? 'Gespeichert' : 'Speichern', gesp ? 'haken' : 'pfeil', o ? 'wartet' : gesp ? 'fertig' : 'glas', { klein: true, id: 'l-speichern', attr: `data-lage="${o ? 'offen' : gesp ? 'gespeichert' : 'ruhig'}"` });
  $('#leiste').innerHTML = WO.leiste({ titel, satz, entwurf: false, knoepfe: kn });
  $('#l-export').onclick = () => sichern();
  $('#l-vn').onclick = () => vorherNachher();
  $('#l-speichern').onclick = () => speichern();
}
/* Bühne: Kopf jeder Ansicht im Startbild des Kleids; Übersicht «voll» mit dem Foto des Werkzeugs, jede andere Ansicht «buehne» mit ihrem eigenen Foto */
const BUEHNE = { start: ['aussen', '50% 50%'], kunden: ['empfang', '50% 45%'], seiten: ['bildschirm', '50% 50%'], betreuung: ['plan', '50% 50%'], kosten: ['tafel', '50% 50%'], vertraege: ['haus', '50% 50%'], so: ['speicherstadt', '50% 50%'] };
function kopf(mono, titel, satz, rechts = '', chips = '') {
  const [bild, lage] = BUEHNE[S.ansicht] || BUEHNE.start, voll = S.ansicht === 'start';
  return WO.startbild({ werkzeug: W, art: voll ? 'voll' : 'buehne', foto: F[bild], zier: mono, h1: titel, satz,
    knoepfe: (voll ? WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) : '') + chips + rechts })
    .replace('<section class="wo-sb', `<section style="--wo-foto-pos:${lage}" class="buehne wo-sb`);
}
function chipsStart() {
  const ks = S.kunden; if (!ks.length) return '';
  const da = ks.filter(k => !istAus(k) && !nieAbgerufen(k)).length, f = ks.reduce((s, k) => s + ueberfaellig(k).length + bald(k).length, 0);
  return `<ul class="buehne__chips"><li><b>${n(ks.length)}</b><span>Kunden</span></li><li><b>${n(da)}</b><span>erreichbar</span></li><li><b>${n(f)}</b><span>Termine</span></li><li><b>${n(ks.reduce((s, k) => s + wuensche(k).length, 0))}</b><span>Wünsche</span></li></ul>`;
}
function zeitraum() {
  const k = t => `<button type="button" data-tage="${t}" class="${S.tage === t ? 'an' : ''}" aria-pressed="${S.tage === t}">${t} Tage</button>`;
  return `<div class="wahl3 wo-seg zeitraum" role="group" aria-label="Zeitraum">${k(7)}${k(14)}${k(30)}</div>`;
}
function hinweisProbe() {
  return probe() ? `<p class="bsp-band"><b>Probedaten.</b> Diese Kunden sind erfunden und zeigen, wie die ${esc(NAME)} mit echten Häusern aussieht. Echte Kunden kommen mit «Kunde anlegen» dazu; «So wird gerechnet» setzt die Probe zurück.</p>` : '';
}
function gehe(ziel, wahl) {
  if (!TITEL[ziel]) ziel = 'start';
  /* Kunden in der Liste wählen: nur die Karte rechts wechselt, die Seite bleibt, wo sie ist (wie in der Vorlage) */
  const fach = $('#ansicht .detail');
  if (ziel === 'kunden' && S.ansicht === 'kunden' && wahl && fach && kunde(wahl)) {
    S.wahl = wahl; adresse();
    $$('#ansicht .liste .besuch').forEach(a => { const an = a.dataset.wahl === S.wahl; a.classList.toggle('aktiv', an); a.setAttribute('aria-pressed', an); });
    fach.innerHTML = detail(sicht(kunde(S.wahl))); verdrahte(fach);
    document.documentElement.classList.remove('wo-rand-auf');
    if (matchMedia('(max-width:1180px)').matches && fach.getBoundingClientRect().top < 0) window.scrollBy({ top: fach.getBoundingClientRect().top - 90, behavior: 'instant' });
    return;
  }
  const neu = ziel !== S.ansicht;
  S.ansicht = ziel;
  if (wahl) S.wahl = wahl;
  adresse();
  rand(); zeichne();
  if (neu) window.scrollTo(0, 0);
  document.documentElement.classList.remove('wo-rand-auf');
}
function adresse() {   /* Direktlink wie in der ersten Fassung: ?kunde=<id> öffnet den Kunden (die Zentrale verlinkt so aus «Heute») */
  const u = new URL(location.href);
  if (S.ansicht === 'kunden' && S.wahl) u.searchParams.set('kunde', S.wahl); else u.searchParams.delete('kunde');
  u.hash = S.ansicht;
  history.replaceState(null, '', u);
}
async function frisch(sagen = false) {
  try { await lade(); rand(); leiste(); zeichne(true); if (sagen) quit('Neu geladen', '', false, 2500); }
  catch (e) { quit('Die ' + NAME + ' ist gerade nicht abrufbar', e.message, true, 0, e.stichwort); }
}

/* ---------- Fenster (wie Le Bureau): Feld-Fenster über dem Werkzeug, Esc oder Klick daneben schliesst, nichts wird ohne «Übernehmen» geändert ---------- */
function fenster(titel, akzent, inhalt, knoepfe, name = '1') {
  const ort = $('#fenster');
  const zu = () => { ort.innerHTML = ''; document.removeEventListener('keydown', taste); document.documentElement.classList.remove('kf-fenster-auf'); };
  const taste = e => { if (e.key === 'Escape') zu(); };
  ort.innerHTML = `<div class="kf-fenster"><button class="kf-fenster__grund" type="button" aria-label="Schliessen"></button>
    <div class="kf-fenster__blatt" role="dialog" aria-modal="true" aria-label="${esc(titel + ' ' + akzent)}" data-fenster="${esc(name)}"><h2>${esc(titel)} <em>${esc(akzent)}</em></h2>
    <div class="kf-fenster__inhalt">${inhalt}</div><div class="kf-fenster__kn">${knoepfe.map((k, i) => WO.knopf(k.text, k.zeichen || (k.haupt ? 'haken' : 'x'), k.haupt ? 'dunkel' : 'hell', { klein: true, attr: `data-k="${i}"` })).join('')}</div></div></div>`;
  $('.kf-fenster__grund', ort).onclick = zu;
  $$('[data-k]', ort).forEach(b => b.onclick = () => { const k = knoepfe[+b.dataset.k]; if (k.tun) k.tun(zu); else zu(); });
  document.addEventListener('keydown', taste);
  document.documentElement.classList.add('kf-fenster-auf');
  const erst = $('.kf-fenster__inhalt input, .kf-fenster__inhalt textarea', ort); if (erst) erst.focus({ preventScroll: true }); else { const b = $('[data-k]:last-child', ort); if (b) b.focus({ preventScroll: true }); }
  return zu;
}
const feld = (name, wert, titel, extra = '', klasse = '') => `<label class="wo-feld${klasse ? ' ' + klasse : ''}"><span>${esc(titel)}</span><input data-f="${esc(name)}" value="${esc(wert == null ? '' : wert)}" autocomplete="off"${extra}></label>`;
const textfeld = (name, wert, titel) => `<label class="wo-feld kf-voll"><span>${esc(titel)}</span><textarea data-f="${esc(name)}" rows="3">${esc(wert || '')}</textarea></label>`;
const wahl = (name, liste, wert, titel) => `<div class="wo-feld"><span>${esc(titel)}</span><div class="wo-wahl" role="group" data-f="${esc(name)}" data-wert="${esc(wert)}">${liste.map(x => `<button type="button" data-w="${esc(x)}" aria-pressed="${x === wert}">${esc(x)}</button>`).join('')}</div></div>`;
const auswahl = (name, liste, wert) => `<select data-f="${esc(name)}">${liste.map(x => `<option${x === wert ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
function wahlVerdrahten(r) { $$('.wo-wahl', r).forEach(g => $$('button', g).forEach(b => b.onclick = () => { g.dataset.wert = b.dataset.w; $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b)); })); }
const lies = el => el.classList.contains('wo-wahl') ? el.dataset.wert : el.value;

const FELDNAME = { stammdaten: 'Angaben', kosten: 'Kosten', vertrag: 'Vertrag', betreuung: 'Betreuung', kunde: 'Kunde', name: 'Name', ort: 'Ort', art: 'Art', adresse: 'Adresse', online_seit: 'Online seit', ansprechpartner: 'Ansprechpartner', besuche_kuerzel: 'Kürzel für Werkzeug 03', notiz: 'Notiz', beginn: 'Beginn', laufzeit: 'Laufzeit', modell: 'Betreuungsmodell', betrag: 'Betreuung im Monat', waehrung: 'Währung' };
const kopie = o => JSON.parse(JSON.stringify(o));

function aendern(feldName, id) {
  const k = sicht(kunde(id)); if (!k) return;
  let inhalt = '', lesen;
  if (feldName === 'stammdaten') {
    inhalt = `<div class="wo-fe kf-fe"><div class="wo-fe__reihe">${feld('name', k.name, 'Name')}${feld('ort', k.ort, 'Ort')}</div>
      <div class="wo-fe__reihe">${feld('art', k.art, 'Art', ' placeholder="Hotel, Restaurant, Bar, Webshop"')}${feld('online_seit', k.online_seit, 'Online seit', ' type="date"')}</div>
      <div class="wo-fe__reihe">${feld('adresse', k.adresse, 'Adresse der Seite', ' placeholder="https://" inputmode="url"', 'kf-voll')}</div>
      <div class="wo-fe__reihe">${feld('ansprechpartner', k.ansprechpartner, 'Ansprechpartner', ' placeholder="Name, Rolle, Mail oder Telefon"', 'kf-voll')}</div>
      <div class="wo-fe__reihe">${feld('besuche_kuerzel', k.besuche_kuerzel, 'Kürzel für Werkzeug 03')}</div>
      <div class="wo-fe__reihe">${textfeld('notiz', k.notiz, 'Notiz')}</div></div>`;
    lesen = r => { const w = {}; $$('[data-f]', r).forEach(i => { w[i.dataset.f] = lies(i).trim(); }); return w; };
  } else if (feldName === 'vertrag') {
    const v = k.vertrag || {};
    inhalt = `<div class="wo-fe kf-fe"><div class="wo-fe__reihe">${feld('beginn', v.beginn, 'Beginn', ' type="date"')}${feld('laufzeit', v.laufzeit, 'Laufzeit', ' placeholder="12 Monate, danach monatlich kündbar"')}</div>
      <div class="wo-fe__reihe wo-fe__reihe--u">${feld('betrag', v.betrag == null ? '' : String(v.betrag).replace('.', ','), 'Betreuung im Monat', ' placeholder="offen" inputmode="decimal"')}${wahl('waehrung', WAEHRUNG, v.waehrung || 'EUR', 'Währung')}</div>
      <div class="wo-fe__reihe">${textfeld('modell', v.modell, 'Betreuungsmodell, in eigenen Worten')}</div>
      <p class="fein">Ein Ende rechnet das Werkzeug nur aus, wenn Beginn und Laufzeit in Monaten dastehen. Betrag leer heisst «offen».</p></div>`;
    lesen = r => { const w = {}; $$('[data-f]', r).forEach(i => { w[i.dataset.f] = lies(i).trim(); }); w.betrag = w.betrag === '' ? null : w.betrag.replace(',', '.'); return w; };
  } else if (feldName === 'kosten') {
    const zeile = (p, i) => `<div class="kf-zeile" data-i="${i}">${feld('posten', p.posten, 'Posten', ' placeholder="Hosting"')}${feld('betrag', p.betrag == null ? '' : String(p.betrag).replace('.', ','), 'Im Monat', ' placeholder="offen" inputmode="decimal"', 'kf-schmal')}
      <label class="wo-feld kf-schmal"><span>Währung</span>${auswahl('waehrung', WAEHRUNG, p.waehrung || 'EUR')}</label>${feld('quelle', p.quelle, 'Quelle', ' placeholder="Rechnung, Vertrag, Anbieter"')}${feld('stand', p.stand, 'Stand', ' type="date"', 'kf-schmal')}
      <button class="link kf-weg" type="button" data-weg="${i}">Entfernen</button></div>`;
    let liste = kopie(k.kosten || []);
    const neuZeichnen = r => { $('.kf-zeilen', r).innerHTML = liste.map(zeile).join('') || '<p class="nichts">Noch kein Posten.</p>'; $$('[data-weg]', r).forEach(b => b.onclick = () => { liste = lesen(r); liste.splice(+b.dataset.weg, 1); neuZeichnen(r); }); };
    inhalt = `<div class="kf-fe"><div class="kf-zeilen"></div><p><button class="link" type="button" data-plus>Posten hinzufügen</button></p>
      <p class="fein">Betrag leer lassen heisst «offen». Nie schätzen: die Quelle sagt, woher die Zahl kommt (Rechnung, Vertrag, Anbieter).</p></div>`;
    lesen = r => $$('.kf-zeile', r).map(z => { const p = {}; $$('[data-f]', z).forEach(i => { p[i.dataset.f] = lies(i).trim(); }); p.betrag = p.betrag === '' ? null : p.betrag.replace(',', '.'); return p; });
    setTimeout(() => { const r = $('.kf-fenster__inhalt'); if (!r) return; neuZeichnen(r); $('[data-plus]', r).onclick = () => { liste = lesen(r); liste.push({ posten: '', betrag: null, waehrung: 'EUR', quelle: '', stand: '' }); neuZeichnen(r); const z = $$('.kf-zeile', r).pop(); if (z) $('input', z).focus(); }; });
  } else if (feldName === 'betreuung') {
    let b = kopie(k.betreuung || { termine: [], wuensche: [] });
    const zt = (t, i) => `<div class="kf-zeile kf-zeile--t" data-i="${i}">${feld('wann', t.wann, 'Wann', ' type="date"', 'kf-schmal')}${feld('was', t.was, 'Was ist zu tun')}<button class="link kf-weg" type="button" data-weg="t${i}">Entfernen</button></div>`;
    const zw = (w, i) => `<div class="kf-zeile kf-zeile--w" data-i="${i}">${feld('text', w.text, 'Wunsch des Hauses')}${feld('seit', w.seit, 'Seit', ' type="date"', 'kf-schmal')}<label class="wo-feld kf-schmal"><span>Stand</span>${auswahl('stand', STAND_W, w.stand || 'offen')}</label><button class="link kf-weg" type="button" data-weg="w${i}">Entfernen</button></div>`;
    lesen = r => ({ termine: $$('.kf-zeile--t', r).map(z => { const p = {}; $$('[data-f]', z).forEach(i => { p[i.dataset.f] = lies(i).trim(); }); return p; }),
      wuensche: $$('.kf-zeile--w', r).map(z => { const p = {}; $$('[data-f]', z).forEach(i => { p[i.dataset.f] = lies(i).trim(); }); return p; }) });
    const neuZeichnen = r => {
      $('.kf-termine', r).innerHTML = b.termine.map(zt).join('') || '<p class="nichts">Kein Termin.</p>';
      $('.kf-wuensche', r).innerHTML = b.wuensche.map(zw).join('') || '<p class="nichts">Kein Wunsch.</p>';
      $$('[data-weg]', r).forEach(x => x.onclick = () => { b = lesen(r); const l = x.dataset.weg[0] === 't' ? b.termine : b.wuensche; l.splice(+x.dataset.weg.slice(1), 1); neuZeichnen(r); });
    };
    inhalt = `<div class="kf-fe"><h3 class="wegtitel">Termine</h3><div class="kf-termine"></div><p><button class="link" type="button" data-plus="t">Termin hinzufügen</button></p>
      <h3 class="wegtitel">Offene Wünsche</h3><div class="kf-wuensche"></div><p><button class="link" type="button" data-plus="w">Wunsch hinzufügen</button></p></div>`;
    setTimeout(() => { const r = $('.kf-fenster__inhalt'); if (!r) return; neuZeichnen(r); $$('[data-plus]', r).forEach(p => p.onclick = () => { b = lesen(r); if (p.dataset.plus === 't') b.termine.push({ wann: '', was: '' }); else b.wuensche.push({ text: '', seit: S.heute, stand: 'offen' }); neuZeichnen(r); const z = $$(p.dataset.plus === 't' ? '.kf-zeile--t' : '.kf-zeile--w', r).pop(); if (z) $('input', z).focus(); }); });
  }
  const zu = fenster(FELDNAME[feldName], k.name, inhalt, [{ text: 'Abbrechen' }, { text: 'Übernehmen', haupt: true, tun: z => {
    const r = $('.kf-fenster__inhalt'), wert = lesen(r);
    const orig = kunde(id), vorher = feldName === 'stammdaten' ? Object.fromEntries(Object.keys(wert).map(f => [f, orig[f] || ''])) : kopie(orig[feldName]);
    if (feldName === 'stammdaten' && !wert.name) { quit('Ein Name muss sein', 'Ohne Namen lässt sich der Kunde nicht finden.', true, 5000, 'NAME'); return; }
    const bad = feldName === 'kosten' ? wert.find(p => p.betrag != null && isNaN(Number(p.betrag))) : feldName === 'vertrag' && wert.betrag != null && isNaN(Number(wert.betrag)) ? wert : null;
    if (bad) { quit('Der Betrag ist keine Zahl', 'Nur Ziffern, Komma für die Cent (etwa 20 oder 1,25). Leer heisst «offen».', true, 6000, 'BETRAG'); return; }
    if (feldName === 'kosten') wert.forEach(p => { if (p.betrag != null) p.betrag = Number(p.betrag); });
    if (feldName === 'vertrag' && wert.betrag != null) wert.betrag = Number(wert.betrag);
    const gleich = JSON.stringify(normal(feldName, vorher)) === JSON.stringify(normal(feldName, wert));
    if (gleich) delete S.offen[id + '|' + feldName]; else S.offen[id + '|' + feldName] = { id, feld: feldName, wert, vorher, name: orig.name };
    z(); rand(); leiste(); zeichne(true);
    quit(gleich ? 'Nichts geändert' : 'Übernommen, noch nicht gespeichert', gleich ? '' : 'Unten «Speichern» schreibt es in die Ablage.', false, 3500);
  } }], 'aendern-' + feldName);
  setTimeout(() => wahlVerdrahten($('#fenster')));
  return zu;
}
function normal(feldName, w) {   /* zum Vergleichen: so, wie api.py es ablegen würde */
  if (feldName === 'kosten') return (w || []).map(p => ({ posten: p.posten || '', betrag: p.betrag == null || p.betrag === '' ? null : Number(p.betrag), waehrung: p.waehrung || 'EUR', quelle: p.quelle || '', stand: p.stand || '' }));
  if (feldName === 'vertrag') return { beginn: w.beginn || '', laufzeit: w.laufzeit || '', modell: w.modell || '', betrag: w.betrag == null || w.betrag === '' ? null : Number(w.betrag), waehrung: w.waehrung || 'EUR' };
  if (feldName === 'betreuung') return { termine: (w.termine || []).map(t => ({ wann: t.wann || '', was: t.was || '' })).sort((a, b) => (a.wann || '9999').localeCompare(b.wann || '9999')), wuensche: (w.wuensche || []).map(x => ({ text: x.text || '', seit: x.seit || '', stand: x.stand || 'offen' })) };
  return Object.fromEntries(Object.keys(w).sort().map(k => [k, String(w[k] || '')]));
}

/* ---------- Vorher, nachher und Quittung ---------- */
const postenText = p => `${p.posten || 'ohne Namen'} ${geld(p.betrag, p.waehrung)}${p.quelle ? ' (' + p.quelle + ')' : ''}`;
const terminText = t => `${t.wann ? datum(t.wann) : 'ohne Datum'}: ${t.was}`;
const wunschText = w => `${w.text} (${w.stand || 'offen'})`;
const wort = (f, v) => v == null || v === '' ? 'leer' : f === 'betrag' ? String(v).replace('.', ',') : f === 'beginn' || f === 'online_seit' ? datum(v) : String(v);
function listenDiff(a0, b0, text) {
  const a = (a0 || []).map(text), b = (b0 || []).map(text), z = [];
  b.forEach((x, i) => { if (!a.includes(x)) z.push(a[i] != null && !b.includes(a[i]) ? [a[i], x] : ['neu', x]); });
  a.forEach((x, i) => { if (!b.includes(x) && !(b[i] != null && !a.includes(b[i]))) z.push([x, 'entfernt']); });
  return z;
}
function zeilen(feldName, v, nach) {   /* [vorher, nachher] je geänderter Stelle */
  if (feldName === 'kunde') return v == null ? [['kein Kunde', 'Kunde angelegt']] : [['Kunde mit allen Angaben', 'entfernt']];
  if (feldName === 'stammdaten' || feldName === 'vertrag') { const ks = Object.keys(Object.assign({}, v, nach)); return ks.filter(k => wort(k, v && v[k]) !== wort(k, nach && nach[k])).map(k => [FELDNAME[k] + ': ' + wort(k, v && v[k]), wort(k, nach && nach[k])]); }
  if (feldName === 'kosten') return listenDiff(v, nach, postenText);
  if (feldName === 'betreuung') return listenDiff(v && v.termine, nach && nach.termine, terminText).concat(listenDiff(v && v.wuensche, nach && nach.wuensche, wunschText));
  return [[wort(feldName, v), wort(feldName, nach)]];
}
const vnListe = z => `<ul class="kf-vn">${z.map(([a, b]) => `<li><s>${esc(a)}</s><em>${esc(b)}</em></li>`).join('') || '<li>Keine Änderung.</li>'}</ul>`;
function vorherNachher() {
  const o = Object.values(S.offen);
  if (!o.length) { quit('Nichts offen', 'Was du im Fenster übernimmst, steht hier, bis du speicherst.', false, 3000); return; }
  fenster('Vorher,', 'nachher', o.map(x => `<section class="kf-vn-blatt"><header><b>${esc(FELDNAME[x.feld])} · ${esc(x.name)}</b><button class="link" type="button" data-zurueck="${esc(x.id + '|' + x.feld)}">Zurücknehmen</button></header>${vnListe(zeilen(x.feld, x.vorher, x.wert))}</section>`).join(''),
    [{ text: 'Schliessen' }, { text: 'Speichern', haupt: true, tun: z => { z(); speichern(); } }], 'vorher-nachher');
  $$('[data-zurueck]').forEach(b => b.onclick = () => { delete S.offen[b.dataset.zurueck]; b.closest('.kf-vn-blatt').remove(); rand(); leiste(); zeichne(true); if (!offenZahl()) { $('#fenster').innerHTML = ''; quit('Alles zurückgenommen', 'Nichts wurde gespeichert.', false, 3000); } });
}
async function speichern() {
  const o = Object.values(S.offen); if (!o.length) { quit('Nichts geändert, nichts gespeichert', '', false, 3000); return; }   /* wie Le Bureau */
  const qs = [];
  try {
    for (const x of o) {
      const d = await api('kunden/' + encodeURIComponent(x.id), 'PUT', { feld: x.feld, wert: x.wert, wer: wer() });
      delete S.offen[x.id + '|' + x.feld];
      if (d.quittung) qs.push(d.quittung);
    }
  } catch (e) { quit('Nicht gespeichert', e.message, true, 0, e.stichwort); }
  await lade(); S.gesp = Date.now() + 4000; setTimeout(() => leiste(), 4100);
  rand(); leiste(); zeichne(true);
  if (qs.length) quittung(qs);
}
function quittung(qs, titel) {   /* Quittung des Kleids (wo-quittung): was sich geändert hat, «Vorher, nachher» und «Rückgängig» */
  const alle = qs.map(q => ({ q, z: zeilen(q.feld, q.vorher, q.nachher) }));
  const eins = alle[0], z0 = eins.z[0] || ['', ''];
  const satz = (eins.q.feld === 'kunde' ? (eins.q.vorher == null ? 'Angelegt: ' : 'Entfernt: ') + eins.q.kunde_name : FELDNAME[eins.q.feld] + ' · ' + eins.q.kunde_name + ': «' + z0[0] + '» wird «' + z0[1] + '»')
    + (alle.length > 1 ? ' und ' + mal(alle.length - 1, 'eine weitere Änderung', 'weitere Änderungen') : '');
  const el = document.createElement('div');
  el.className = 'wo-quittung'; el.setAttribute('role', 'status'); el.dataset.quittung = qs.map(q => q.quittung).join(',');
  el.innerHTML = `<i>${WO.ic('haken')}</i><span><b>${esc(titel || (qs[0].rueckgaengig_von ? 'Rückgängig gemacht' : 'Gespeichert'))}</b>${esc(satz)}</span><a href="#" data-vn>Vorher, nachher</a>${qs[0].rueckgaengig_von ? '' : '<a href="#" data-rueck>Rückgängig</a>'}<button type="button" aria-label="Schliessen">${WO.ic('x')}</button>`;
  $('button', el).onclick = () => el.remove();
  $('[data-vn]', el).onclick = e => { e.preventDefault(); fenster('Vorher,', 'nachher', alle.map(x => `<section class="kf-vn-blatt"><header><b>${esc(FELDNAME[x.q.feld])} · ${esc(x.q.kunde_name)}</b><small>${esc(datum(x.q.zeit))}, ${esc(uhr(x.q.zeit))}${x.q.wer ? ' · ' + esc(x.q.wer) : ''}</small></header>${vnListe(x.z)}</section>`).join(''), [{ text: 'Schliessen' }], 'quittung'); };
  const r = $('[data-rueck]', el);
  if (r) r.onclick = async e => {
    e.preventDefault(); el.remove();
    try {
      const neu = [];
      for (const q of qs.slice().reverse()) { const d = await api('rueckgaengig', 'POST', { quittung: q.quittung, wer: wer() }); neu.push(d.quittung); }
      await lade(); rand(); leiste(); zeichne(true); quittung(neu, 'Rückgängig gemacht');
    } catch (x) { quit('Liess sich nicht zurücknehmen', x.message, true, 0, 'QUITTUNG'); }
  };
  $('#meldung').replaceChildren(el);   /* die Quittung ersetzt jede ältere Meldung («Übernommen, noch nicht gespeichert») */
  setTimeout(() => el.remove(), 15000);
}

/* ---------- Abruf, Anlegen, Entfernen, Probedaten ---------- */
async function abrufen(id) {
  if (S.laeuft) return;
  S.laeuft = true; $$('[data-abruf]').forEach(b => { b.disabled = true; $('span', b).textContent = 'Ruft ab …'; });
  try {
    const d = await api('pruefen', 'POST', id ? { id } : { alle: true });
    await lade();
    const e = Object.values(d.ergebnisse), aus = e.filter(x => !x.ok).length;
    quit(id ? (e[0].ok ? 'Erreichbar' : 'Antwortet nicht') : mal(e.length, 'Eine Seite', 'Seiten') + ' abgerufen',
      id ? (e[0].ok ? 'Antwort ' + e[0].status + ' in ' + n(e[0].dauer_ms) + ' ms.' : e[0].fehler) : aus ? mal(aus, 'eine antwortet nicht', 'antworten nicht') + '.' : 'Alle erreichbar.', !!aus, 5000, aus ? 'ABRUF' : '');
  } catch (x) { quit('Abruf ging nicht', x.message, true, 0, x.stichwort); }
  S.laeuft = false; rand(); leiste(); zeichne(true);
}
function neuerKunde() {
  fenster('Kunde', 'anlegen', `<div class="wo-fe kf-fe"><div class="wo-fe__reihe">${feld('name', '', 'Name')}${feld('ort', '', 'Ort')}</div>
    <div class="wo-fe__reihe">${feld('art', '', 'Art', ' placeholder="Hotel, Restaurant, Bar, Webshop"')}${feld('adresse', '', 'Adresse der Seite', ' placeholder="https://" inputmode="url"')}</div>
    <p class="fein">Kosten, Vertrag und Betreuung trägst du danach beim Kunden ein. Die Quittung nimmt das Anlegen wieder zurück.</p></div>`,
  [{ text: 'Abbrechen' }, { text: 'Anlegen', haupt: true, zeichen: 'plus', tun: async z => {
    const w = {}; $$('.kf-fenster__inhalt [data-f]').forEach(i => { w[i.dataset.f] = i.value.trim(); });
    if (!w.name) { quit('Ein Name muss sein', '', true, 4000, 'NAME'); return; }
    try { const d = await api('kunden', 'POST', Object.assign(w, { wer: wer() })); z(); await lade(); S.wahl = d.kunde.id; neuInListe(); rand(); leiste(); quittung([d.quittung], 'Angelegt'); }
    catch (x) { quit('Nicht angelegt', x.message, true, 0, x.stichwort); }
  } }], 'neu');
}
/* Nach dem Anlegen die ganze Ansicht Kunden neu zeichnen: Liste und Auswahl («Alle · 6») zeigen den neuen Kunden sofort, nicht erst nach dem Neuladen.
   gehe() wechselt bei offener Ansicht Kunden nur die Karte rechts, darum hier nicht über gehe() */
function neuInListe() {
  const neu = S.ansicht !== 'kunden';
  S.ansicht = 'kunden'; S.filter = 'alle';
  adresse(); rand(); zeichne(true);
  if (neu) window.scrollTo(0, 0);
  document.documentElement.classList.remove('wo-rand-auf');
}
function entfernen(id) {
  const k = kunde(id); if (!k) return;
  fenster('Kunden', 'entfernen?', `<p>«${esc(k.name)}» verschwindet aus der Übersicht, mit Kosten, Terminen, Wünschen und Vertrag. Der Verlauf der Abrufe bleibt in der Ablage.</p>
    <p class="fein">Die Quittung danach holt den Kunden mit «Rückgängig» vollständig zurück.</p>`,
  [{ text: 'Behalten' }, { text: 'Entfernen', haupt: true, zeichen: 'x', tun: async z => {
    try { const d = await api('kunden/' + encodeURIComponent(id), 'DELETE', { wer: wer() }); z(); Object.keys(S.offen).forEach(x => { if (x.startsWith(id + '|')) delete S.offen[x]; }); S.wahl = null; await lade(); rand(); leiste(); zeichne(true); adresse(); quittung([d.quittung], 'Entfernt'); }
    catch (x) { quit('Nicht entfernt', x.message, true, 0, x.stichwort); }
  } }], 'entfernen');
}
function probedaten() {
  fenster('Probedaten', 'zurücksetzen?', `<p>Die Ablage wird auf die fünf erfundenen Kunden zurückgesetzt. Alles, was hier eingetragen wurde, und die Liste der Quittungen gehen dabei verloren; das lässt sich <b>nicht</b> rückgängig machen.</p>
    <p class="fein">Gedacht zum Ausprobieren. Mit echten Kunden nicht drücken.</p>`,
  [{ text: 'Behalten' }, { text: 'Zurücksetzen', haupt: true, zeichen: 'verlauf', tun: async z => {
    try { await api('probedaten', 'POST', {}); z(); S.offen = {}; S.wahl = null; await lade(); rand(); leiste(); zeichne(true); quit('Probedaten zurückgesetzt', mal(S.kunden.length, 'Ein Kunde', 'Kunden') + ' in der Übersicht.', false, 5000); }
    catch (x) { quit('Ging nicht', x.message, true, 0, x.stichwort); }
  } }], 'probedaten');
}

/* ---------- Als Tabelle sichern (wie in der Vorlage): alle Kunden mit Stand, Kosten, Vertrag und Betreuung als CSV, öffnet in Excel und Numbers ---------- */
function zelle(x) { let t = String(x == null ? '' : x); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
function sichern() {
  const kopfz = ['Kunde', 'Ort', 'Art', 'Adresse', 'Online seit', 'Stand der Seite', 'Erreichbar in ' + S.tage + ' Tagen (%)', 'Ausfälle', 'Kosten für uns im Monat', 'Posten offen', 'Betreuung im Monat', 'Beginn', 'Laufzeit', 'Endet', 'Betreuungsmodell', 'Nächster Termin', 'Offene Wünsche'];
  const z = S.kunden.map(k => { const t = termine(k).find(x => x.wann && tageBis(x.wann) >= -365); const a = anteil(k);
    return [k.name, k.ort, k.art, k.adresse, datum(k.online_seit), zustandText(k), a == null ? '' : String(Math.round(a * 10) / 10).replace('.', ','), ausfaelle(k), geldListe(k.kosten_summe.summen), k.kosten_summe.offen,
      k.vertrag && k.vertrag.betrag != null ? geld(k.vertrag.betrag, k.vertrag.waehrung) : 'offen', datum(k.vertrag && k.vertrag.beginn), k.vertrag && k.vertrag.laufzeit, datum(k.vertragsende), k.vertrag && k.vertrag.modell,
      t ? datum(t.wann) + ': ' + t.was : '', wuensche(k).map(w => w.text).join(' | ')]; });
  const name = 'kunden-uebersicht-' + S.heute + (probe() ? '-probedaten' : '') + '.csv';
  const url = URL.createObjectURL(new Blob(['﻿' + [kopfz].concat(z).map(r => r.map(zelle).join(';')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  quit('Als Tabelle gesichert', name + ' · ' + mal(S.kunden.length, 'ein Kunde', 'Kunden'));
}

/* ---------- Bausteine ---------- */
function balken(liste, name, klein, gesamt, zahlText, anteilText) {   /* Rangliste: Name, Balken, Zahl, Anteil. Der Balken wächst nur über transform. */
  liste = liste.filter(x => x.n > 0);
  if (!liste.length) return '<p class="nichts">Noch nichts eingetragen.</p>';
  const max = Math.max(...liste.map(x => x.n)), ges = gesamt || liste.reduce((a, x) => a + x.n, 0);
  return `<ol class="rang">${liste.map((x, i) => `<li style="--i:${i}"><span class="rang__n">${name(x)}${klein ? `<small>${klein(x)}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, x.n / max).toFixed(3)}"></i></span><b>${zahlText ? zahlText(x) : n(x.n)}</b><em>${anteilText ? anteilText(x) : Math.round(100 * x.n / ges) + '&nbsp;%'}</em></li>`).join('')}</ol>`;
}
function saeulen(werte, beschrift, tip, klasse = '') {
  const max = Math.max(1, ...werte);
  return `<div class="saeulen ${klasse}" style="--n:${werte.length}" role="img" aria-label="${esc(tip.label)}">
    ${werte.map((z, i) => `<div class="s" style="--i:${Math.round(i * 30 / werte.length)}" data-t="${esc(tip(i, z))}"><i style="--h:${z ? Math.max(.025, z / max).toFixed(3) : 0}"></i>${beschrift(i) ? `<span>${beschrift(i)}</span>` : ''}</div>`).join('')}
  </div>`;
}
function tage() { const l = []; for (let i = S.tage - 1; i >= 0; i--) l.push(schiebe(S.heute, -i)); return l; }
function jeTag() {   /* je Tag: Abrufe aller Kunden, davon erreichbar */
  const t = tage(), m = Object.fromEntries(t.map(x => [x, { alle: 0, ok: 0 }]));
  S.kunden.forEach(k => (k.abrufe || []).forEach(a => { const d = String(a.zeit).slice(0, 10); if (m[d]) { m[d].alle++; if (a.ok) m[d].ok++; } }));
  return t.map(x => Object.assign({ tag: x }, m[x]));
}
function striche(k) {   /* Verlauf der Abrufe im Zeitraum als feine Striche: erreichbar dunkel, Ausfall rot */
  const a = imZeitraum(k).slice(-60);
  if (!a.length) return '<span class="kf-striche kf-striche--leer" aria-label="Noch kein Abruf"><i></i></span>';
  return `<span class="kf-striche" role="img" aria-label="${a.filter(x => x.ok).length} von ${a.length} Abrufen erreichbar">${a.map(x => `<i class="${x.ok ? '' : 'aus'}" title="${esc(datum(x.zeit) + ', ' + uhr(x.zeit))}: ${x.ok ? 'erreichbar' : esc(x.fehler || 'antwortet nicht')}"></i>`).join('')}</span>`;
}
function karteKunde(k0, aktiv) {
  const k = sicht(k0), t = ueberfaellig(k)[0] || bald(k)[0] || termine(k).find(x => x.wann && tageBis(x.wann) >= 0), w = wuensche(k).length;
  const marke = istAus(k) ? 'Antwortet nicht' : nieAbgerufen(k) ? 'Nie abgerufen' : 'Erreichbar';
  const zeit = t ? (tageBis(t.wann) < 0 ? 'überfällig seit ' + datum(t.wann) : tagWort(t.wann) + ': ' + t.was) : 'nichts angesetzt';
  return `<button class="besuch rg-a${achtung(k) ? ' gold' : ''}${aktiv ? ' aktiv' : ''}" type="button" data-gehe="kunden" data-wahl="${esc(k.id)}" aria-pressed="${aktiv}">
    <span class="besuch__b">${kbild(k)}<span class="besuch__l">${esc((k.art || 'Haus').slice(0, 2).toUpperCase())}</span></span>
    <span class="besuch__n"><b>${zusammen(k.name)}</b><small><i class="besuch__w">${esc(zeit)}</i><i class="besuch__t"> · </i><i class="besuch__r">${[k.ort, geldListe(k.kosten_summe.summen) + ' im Monat'].concat(w ? [mal(w, 'ein Wunsch', 'Wünsche')] : []).filter(Boolean).map(x => `<i class="besuch__s">${esc(x).replace(/ /g, ' ')}</i>`).join('')}</i></small></span>
    <span class="besuch__z">${esc(marke)}<small>${esc(k.art || '')}</small></span></button>`;
}
function leer() {
  return `<div class="leer blatt">${WO.zeichen()}<b>Noch kein Kunde.</b>
    <p>Sobald eine Website fertig ist, kommt der Kunde hierher: mit Adresse, Kosten, Vertrag und dem, was bei der Betreuung ansteht.</p>
    <button class="kn kn--linie" type="button" data-neu>Kunde anlegen<i>${PF}</i></button></div>`;
}

/* ---------- Ansichten ---------- */
function zeichne(ruhig) {
  const el = $('#ansicht');
  const f = { kunden: kundenAnsicht, seiten, betreuung, kosten, vertraege, so }[S.ansicht] || start;
  el.innerHTML = f();
  verdrahte(el);
  document.title = (TITEL[S.ansicht] || NAME) + ' · ' + NAME + ' · ' + WO_HAUS.name;
  schweben(el, ruhig);
}
function verdrahte(el) {
  $$('[data-gehe]', el).forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe, b.dataset.wahl); });
  $$('[data-tage]', el).forEach(b => b.onclick = () => { if (S.tage === +b.dataset.tage) return; S.tage = +b.dataset.tage; try { localStorage.setItem('tasty-kunden-tage', S.tage); } catch (e) { /* privat */ } rand(); zeichne(true); });
  $$('[data-filter]', el).forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.wahl = null; zeichne(true); adresse(); });
  $$('[data-aendern]', el).forEach(b => b.onclick = () => aendern(b.dataset.aendern, b.dataset.id || S.wahl));
  $$('[data-abruf]', el).forEach(b => b.onclick = () => abrufen(b.dataset.abruf || null));
  $$('[data-neu]', el).forEach(b => b.onclick = () => neuerKunde());
  $$('[data-entfernen]', el).forEach(b => b.onclick = () => entfernen(b.dataset.entfernen));
  $$('[data-probe]', el).forEach(b => b.onclick = () => probedaten());
  $$('[data-sichern]', el).forEach(b => b.onclick = () => sichern());
  $$('[data-vn]', el).forEach(b => b.onclick = e => { e.preventDefault(); vorherNachher(); });
}
/* Schweben (wie in der Vorlage): sobald ein Blatt am unteren Rand auftaucht, schwebt es an seinen Platz (.rg-da); Balken und Säulen wachsen, wenn ihr Blatt gut zur Hälfte im Bild ist (.rg-los) */
let IO = null, IO_LOS = null;
function schweben(el, still) {
  if (IO) IO.disconnect();
  if (IO_LOS) IO_LOS.disconnect();
  const ziele = [];
  const nimm = (sel, reihe) => $$(sel, el).forEach(x => { if (x.dataset.r) return; x.dataset.r = '1'; x.style.setProperty('--i', reihe ? Math.min([...x.parentNode.children].indexOf(x), 3) : 0); ziele.push(x); });
  nimm('.bsp-band, .wahl3--filter, .band, .tabelle, .leer, .zw, .mehr, .wo-lage, #ansicht > .blatt, #ansicht > .tafel', false);
  nimm('.zahlen > .blatt, .zwei > .blatt, .stapel > .blatt, .werte > .wert, .liste .besuch, .wo-aufg > .wo-ag', true);
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
  const ks = S.kunden.map(sicht);
  const gruss = /[?&]gruss=tag/.test(location.search) ? 'Guten Tag.' : WO.gruss();
  const satzS = 'Jeder Kunde mit fertiger Website auf einen Blick: läuft die Seite, was kostet sie uns im Monat, was steht bei der Betreuung an. So lässt sich laufende Betreuung belegen.';
  let aus = kopf(esc(NAME + ' · ' + WO_HAUS.name), `<span data-wo-gruss>${gruss}</span><br><em>Läuft alles?</em>`, satzS,
    zeitraum() + WO.knopf('Alle Seiten abrufen', 'verlauf', 'glas', { klein: true, attr: 'data-abruf=""' }), chipsStart()) + hinweisProbe();
  /* Lage mit drei Fächern (wie Le Bureau) */
  const aus_ = ks.filter(istAus), f = ks.reduce((s, k) => s + ueberfaellig(k).length, 0), b7 = ks.reduce((s, k) => s + bald(k).filter(t => tageBis(t.wann) <= 7).length, 0), o = offenZahl();
  aus += `<div class="wo-lage">
    <div class="wo-lg"><i class="wo-lg__z">${WO.ic('welt')}</i><span class="wo-mk">Seiten</span><b>${aus_.length ? mal(aus_.length, 'Eine antwortet nicht', 'antworten nicht') : ks.length ? 'Alle erreichbar' : 'Noch keine'}</b><p>${aus_.length ? esc(aus_.map(k => k.name).join(', ')) : 'Zuletzt abgerufen ' + esc(letzterAbruf())}</p><button class="wo-lk" type="button" data-gehe="seiten">Erreichbarkeit</button></div>
    <div class="wo-lg"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Betreuung</span><b>${f ? mal(f, 'Ein Termin überfällig', 'Termine überfällig') : b7 ? mal(b7, 'Ein Termin diese Woche', 'Termine diese Woche') : 'Nichts fällig'}</b><p>${f || b7 ? 'In den nächsten sieben Tagen und was schon drüber ist.' : 'In den nächsten sieben Tagen steht nichts an.'}</p><button class="wo-lk" type="button" data-gehe="betreuung">Betreuung</button></div>
    <div class="wo-lg"><i class="wo-lg__z">${WO.ic('stift')}</i><span class="wo-mk">Eingaben</span><b>${o ? mal(o, 'Eine wartet', 'warten') : 'Nichts offen'}</b><p>${o ? 'Übernommen, noch nicht gespeichert.' : 'Was du änderst, sammelt sich hier bis «Speichern».'}</p>${o ? '<button class="wo-lk" type="button" data-vn>Vorher, nachher</button>' : ''}</div></div>`;
  /* Häufig gebraucht (Kacheln mit Foto, wie Le Bureau) */
  const erst = (ks.find(achtung) || ks[0] || {}).id || '';
  const kachel = (t, s, z, foto, attr) => `<button class="wo-ag" type="button" ${attr}><span class="wo-ag__b"><img src="${esc(F[foto])}" alt=""></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(z)}</i><b>${t}</b><span>${s}</span></span></button>`;
  aus += `<h2 class="zw">Häufig <em>gebraucht</em></h2><div class="wo-aufg">
    ${kachel('Seiten abrufen', 'Jetzt nachsehen, ob jede Seite antwortet.', 'verlauf', 'bildschirm', 'data-abruf=""')}
    ${kachel('Kosten eintragen', 'Hosting, Domain, Dienste, jeder mit Quelle.', 'karte', 'tafel', erst ? `data-aendern="kosten" data-id="${esc(erst)}"` : 'data-neu')}
    ${kachel('Termin ansetzen', 'Was bei der Betreuung als Nächstes ansteht.', 'uhr', 'plan', erst ? `data-aendern="betreuung" data-id="${esc(erst)}"` : 'data-neu')}
    ${kachel('Kunde anlegen', 'Sobald eine Website fertig ist.', 'plus', 'empfang', 'data-neu')}</div>`;
  if (!ks.length) return aus + leer();
  const ksum = kostenSumme(ks), bsum = betreuungSumme(ks), offenP = ks.reduce((s, k) => s + k.kosten_summe.offen, 0);
  const alleA = ks.reduce((s, k) => s + imZeitraum(k).length, 0), okA = ks.reduce((s, k) => s + imZeitraum(k).filter(x => x.ok).length, 0);
  const t = jeTag(), viele = t.length, schritt = viele <= 7 ? 1 : viele <= 14 ? 2 : 5;
  const kg = geldGross(ksum), bg = geldGross(bsum), ohneB = ks.filter(k => !k.vertrag || k.vertrag.betrag == null).length;
  aus += `<div class="zahlen">
      <div class="blatt"><span class="mono">Kunden</span><b>${n(ks.length)}</b><small>${ks.filter(achtung).length ? mal(ks.filter(achtung).length, 'einer braucht Aufmerksamkeit', 'brauchen Aufmerksamkeit') : 'alle in Ordnung'}</small></div>
      <div class="blatt"><span class="mono">Erreichbar</span><b>${alleA ? prozent(100 * okA / alleA) : '–'}</b><small>${n(okA)} von ${n(alleA)} Abrufen, ${n(S.tage)} Tage</small></div>
      <div class="blatt"><span class="mono">Kosten für uns</span><b>${esc(kg.haupt)}</b><small>${kg.rest ? 'und ' + esc(kg.rest) + ', ' : ''}${offenP ? mal(offenP, 'ein Posten offen', 'Posten offen') : 'im Monat, jeder Posten belegt'}</small></div>
      <div class="blatt"><span class="mono">Betreuung</span><b>${esc(bg.haupt)}</b><small>${bg.rest ? 'und ' + esc(bg.rest) + ' ' : ''}im Monat${ohneB ? ', ' + mal(ohneB, 'einer ohne Betrag', 'ohne Betrag') : ', alle mit Betrag'}</small></div>
    </div>
    <section class="blatt tafel">
      <header><h3>Erreichbar je Tag</h3><p>${esc(datum(t[0].tag))} bis ${esc(datum(t[viele - 1].tag))}<span style="white-space:nowrap">&nbsp;· <button class="link" type="button" data-gehe="seiten">Erreichbarkeit</button></span></p></header>
      ${saeulen(t.map(x => x.alle ? Math.round(100 * x.ok / x.alle) : 0), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(t[i].tag) : '', Object.assign((i, z) => tagWort(t[i].tag) + ': ' + (t[i].alle ? n(t[i].ok) + ' von ' + n(t[i].alle) + ' Abrufen erreichbar' : 'kein Abruf'), { label: 'Anteil erreichbarer Abrufe je Tag' }))}
    </section>
    <div class="zwei zwei--fuell">
      <div class="stapel">
        <section class="blatt"><header><h3>Kosten für uns je Kunde</h3><button class="link" type="button" data-gehe="kosten">Alle Posten</button></header>
          ${balken(ks.map(k => ({ k, n: Object.values(k.kosten_summe.summen).reduce((a, b) => a + b, 0) })).sort((a, b) => b.n - a.n), x => esc(x.k.name), null, 0, x => esc(geldListe(x.k.kosten_summe.summen)), x => x.k.kosten_summe.offen ? 'offen' : '')}</section>
        <section class="blatt"><header><h3>Offene Wünsche</h3><button class="link" type="button" data-gehe="betreuung">Betreuung</button></header>${balken(ks.map(k => ({ k, n: wuensche(k).length })).sort((a, b) => b.n - a.n), x => esc(x.k.name))}</section>
        <section class="blatt"><header><h3>Art der Häuser</h3></header>${balken(Object.entries(ks.reduce((m, k) => { m[k.art || 'ohne Art'] = (m[k.art || 'ohne Art'] || 0) + 1; return m; }, {})).map(([k, z]) => ({ k, n: z })).sort((a, b) => b.n - a.n), x => esc(x.k))}</section>
      </div>
      <section class="blatt"><header><h3>Erreichbar in ${n(S.tage)} Tagen</h3><button class="link" type="button" data-gehe="seiten">Alle Seiten</button></header>
        ${balken(ks.map(k => ({ k, n: anteil(k) || 0 })).sort((a, b) => a.n - b.n), x => mitBild(x.k), x => esc(zustandText(x.k)) + (ausfaelle(x.k) ? ', ' + mal(ausfaelle(x.k), 'ein Ausfall', 'Ausfälle') : ''), 100, x => prozent(x.n), () => '')}</section>
    </div>
    <h2 class="zw">Wer zuerst <em>dran ist</em></h2>
    <div class="liste liste--start">${ks.slice().sort(rangfolge).slice(0, 5).map(k => karteKunde(kunde(k.id), false)).join('')}</div>
    <p class="mehr">${WO.knopf('Alle Kunden', 'rechts', 'hell', { klein: true, attr: 'data-gehe="kunden"' })}</p>`;
  return aus;
}
function letzterAbruf() { const z = S.kunden.map(k => k.erreichbarkeit.zuletzt && k.erreichbarkeit.zuletzt.zeit).filter(Boolean).sort().pop(); return z ? (tagWort(z) + ', ' + uhr(z) + ' Uhr').replace(/^(Heute|Gestern|Morgen)/, m => m.toLowerCase()) : 'noch nie'; }
function rangfolge(a, b) {   /* wer Aufmerksamkeit braucht, steht oben; dann nach dem nächsten Termin, dann nach Name */
  const g = k => (istAus(k) ? 0 : ueberfaellig(k).length ? 1 : endetBald(k) ? 2 : 3);
  const nt = k => (termine(k).find(t => t.wann && tageBis(t.wann) >= 0) || {}).wann || '9999';
  return g(a) - g(b) || nt(a).localeCompare(nt(b)) || a.name.localeCompare(b.name, 'de');
}

function kundenAnsicht() {
  let aus = kopf('Kunden', 'Jeder Kunde, <em>auf einer Karte.</em>', 'Links alle Häuser mit fertiger Website, rechts der gewählte Kunde: die Seite, Kosten, Vertrag und was ansteht. «Ändern» öffnet ein Fenster, «Speichern» unten schreibt es fest.', zeitraum()) + hinweisProbe();
  if (!S.kunden.length) return aus + leer();
  const alle = S.kunden.map(sicht).sort(rangfolge);
  const nach = { alle, aus: alle.filter(istAus), faellig: alle.filter(k => ueberfaellig(k).length || bald(k).filter(t => tageBis(t.wann) <= 7).length), wunsch: alle.filter(k => wuensche(k).length), ende: alle.filter(endetBald) };
  const l = nach[S.filter] || alle;
  if (!l.some(k => k.id === S.wahl)) S.wahl = l.length ? l[0].id : null;
  const f = (k, name) => `<button type="button" data-filter="${k}" class="${S.filter === k ? 'an' : ''}" aria-pressed="${S.filter === k}">${name} · ${n(nach[k].length)}</button>`;
  aus += `<div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle')}${f('aus', 'Antwortet nicht')}${f('faellig', 'Termin fällig')}${f('wunsch', 'Wunsch offen')}${f('ende', 'Vertrag endet bald')}</div>`;
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Kunde in dieser Auswahl.</b> Gerade trifft das auf keinen zu.</div>`;
  let letzter = '';
  const liste = l.map(k => { const g = achtung(k) ? 'Braucht Aufmerksamkeit' : 'Läuft'; const z = g !== letzter ? `<p class="tagzeile">${g}</p>` : ''; letzter = g; return z + karteKunde(kunde(k.id), k.id === S.wahl); }).join('');
  aus += `<div class="eingang">
    <div class="liste">${liste}</div>
    <div class="detail rg-detail">${S.wahl ? detail(sicht(kunde(S.wahl))) : ''}</div></div>
    <p class="mehr sichern"><button class="kn kn--linie" type="button" data-sichern>Alle Kunden als Tabelle sichern<i>${SYM.laden}</i></button> <button class="kn kn--linie" type="button" data-neu>Kunde anlegen<i>${PF}</i></button></p>`;
  return aus;
}
function detail(k) {
  if (!k) return '';
  const e = k.erreichbarkeit, z = e.zuletzt, v = k.vertrag || {}, a = anteil(k);
  const ae = (feldName, text = 'Ändern') => `<button class="link kf-aendern${offenBei(k.id, feldName) ? ' kf-offen' : ''}" type="button" data-aendern="${feldName}" data-id="${esc(k.id)}">${offenBei(k.id, feldName) ? 'Geändert, nicht gespeichert' : text}</button>`;
  const letzte = (k.abrufe || []).slice(-5).reverse();
  const kosten = (k.kosten || []).map((p, i) => `<li style="--i:${i}"><time>${p.stand ? kurzDatum(p.stand) : '–'}</time><div><b>${esc(p.posten || 'ohne Namen')}</b><p class="kf-quelle">${p.quelle ? esc(p.quelle) : '<span class="kf-offen-t">Quelle offen</span>'}</p></div><em class="${p.betrag == null ? 'kf-offen-t' : ''}">${esc(geld(p.betrag, p.waehrung))}</em></li>`).join('');
  const ts = termine(k), ws = (k.betreuung || {}).wuensche || [];
  return `<article class="blatt besuchsblatt" data-kunde="${esc(k.id)}">
    <div class="besuchsblatt__kopf"><div><span class="mono">${esc([k.art, k.ort].filter(Boolean).join(' · ') || 'Kunde')}</span><h2>${esc(k.name)}</h2></div>
      <span class="siegel${istAus(k) ? ' siegel--aus' : ''}">${esc(zustandText(k))}</span></div>
    <dl class="angaben">
      <div><dt>Adresse</dt><dd>${k.adresse ? `<a class="kf-adr" href="${esc(k.adresse)}" target="_blank" rel="noopener">${esc(k.adresse.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : '<span class="kf-offen-t">offen</span>'}</dd></div>
      <div><dt>Online seit</dt><dd>${k.online_seit ? datum(k.online_seit) : '<span class="kf-offen-t">offen</span>'}</dd></div>
      <div><dt>Besucher</dt><dd><span class="kf-offen-t">offen</span></dd></div>
      <div class="kf-breit"><dt>Ansprechpartner</dt><dd>${k.ansprechpartner ? esc(k.ansprechpartner) : '<span class="kf-offen-t">offen</span>'}</dd></div>
      <div><dt>Kürzel für 03</dt><dd>${k.besuche_kuerzel ? esc(k.besuche_kuerzel) : '<span class="kf-offen-t">offen</span>'}</dd></div>
    </dl>
    <p class="kf-zeile-r">${ae('stammdaten', 'Angaben ändern')}</p>
    <h3 class="wegtitel">Die Seite</h3>
    <div class="kf-seite"><div><b class="kf-gross${istAus(k) ? ' kf-aus' : ''}">${esc(zustandText(k))}</b><small>${z ? (e.seit ? 'seit ' + esc(datum(e.seit)) + ', ' + esc(uhr(e.seit)) + ' Uhr · ' : '') + 'zuletzt ' + esc(tagWort(z.zeit).toLowerCase() + ', ' + uhr(z.zeit)) + ' Uhr' + (z.ok && z.dauer_ms != null ? ', Antwort in ' + n(z.dauer_ms) + ' ms' : z.fehler ? ' · ' + esc(z.fehler) : '') : 'Noch kein Abruf.'}</small></div>
      ${WO.knopf('Jetzt abrufen', 'verlauf', 'hell', { klein: true, attr: `data-abruf="${esc(k.id)}"`, disabled: S.laeuft })}</div>
    ${striche(k)}
    <p class="fein kf-nah">${a == null ? 'In den letzten ' + n(S.tage) + ' Tagen kein Abruf.' : 'Letzte ' + n(S.tage) + ' Tage: ' + (ausfaelle(k) ? mal(ausfaelle(k), 'ein Ausfall', 'Ausfälle') : 'kein Ausfall') + ', ' + prozent(a) + ' von ' + n(imZeitraum(k).length) + ' Abrufen erreichbar.'}</p>
    ${letzte.length ? `<ol class="weg">${letzte.map((x, i) => `<li style="--i:${i}"><time>${esc(uhr(x.zeit))}</time><div><b>${esc(tagWort(x.zeit, true))}</b>${x.probe ? '<small>Probe</small>' : ''}</div><em class="${x.ok ? '' : 'kf-aus'}">${x.ok ? 'erreichbar' + (x.dauer_ms != null ? ', ' + n(x.dauer_ms) + ' ms' : '') : esc(x.fehler || 'antwortet nicht')}</em></li>`).join('')}</ol>` : ''}
    <div class="kf-abschnitt"><h3 class="wegtitel">Kosten für uns im Monat</h3>${ae('kosten')}</div>
    ${kosten ? `<ol class="weg kf-kosten">${kosten}</ol>` : '<p class="nichts">Noch kein Posten. Hosting, Domain, Dienste: jeder mit Betrag und Quelle.</p>'}
    <p class="kf-summe"><span>Zusammen</span><b class="${k.kosten_summe.offen || !Object.keys(k.kosten_summe.summen).length ? 'kf-offen-t' : ''}">${esc(geldListe(k.kosten_summe.summen))}${k.kosten_summe.offen ? ', ' + mal(k.kosten_summe.offen, 'ein Posten offen', 'Posten offen') : ''}</b></p>
    <div class="kf-abschnitt"><h3 class="wegtitel">Vertrag</h3>${ae('vertrag')}</div>
    <dl class="angaben kf-vertrag">
      <div><dt>Betreuung im Monat</dt><dd>${v.betrag == null ? '<span class="kf-offen-t">offen</span>' : esc(geld(v.betrag, v.waehrung))}</dd></div>
      <div><dt>Beginn</dt><dd>${v.beginn ? datum(v.beginn) : '<span class="kf-offen-t">offen</span>'}</dd></div>
      <div><dt>Endet</dt><dd>${k.vertragsende ? datum(k.vertragsende) + (endetBald(k) ? ` <span class="kf-aus">in ${n(tageBis(k.vertragsende))} Tagen</span>` : '') : '–'}</dd></div>
      <div class="kf-breit"><dt>Laufzeit</dt><dd>${v.laufzeit ? esc(v.laufzeit) : '<span class="kf-offen-t">offen</span>'}</dd></div>
      <div class="kf-ganz"><dt>Betreuungsmodell</dt><dd class="kf-text">${v.modell ? esc(v.modell) : '<span class="kf-offen-t">offen</span>'}</dd></div>
    </dl>
    <div class="kf-abschnitt"><h3 class="wegtitel">Anstehende Betreuung</h3>${ae('betreuung')}</div>
    ${ts.length ? `<ol class="weg">${ts.map((t, i) => { const d = t.wann ? tageBis(t.wann) : null; return `<li style="--i:${i}"><time>${t.wann ? kurzDatum(t.wann) : '–'}</time><div><b>${esc(t.was || 'ohne Text')}</b>${d != null && d < 0 ? '<p><span class="ereignis gold">überfällig</span></p>' : d === 0 ? '<p><span class="ereignis gold">heute</span></p>' : ''}</div><em>${d == null ? 'ohne Datum' : d < 0 ? 'vor ' + n(-d) + ' T.' : d === 0 ? 'heute' : 'in ' + n(d) + ' T.'}</em></li>`; }).join('')}</ol>` : '<p class="nichts">Kein Termin.</p>'}
    ${ws.length ? `<ol class="weg kf-wuensche">${ws.map((w, i) => `<li style="--i:${i}"><time>${w.seit ? kurzDatum(w.seit) : '–'}</time><div><b>${esc(w.text || 'ohne Text')}</b></div><em>${esc(w.stand || 'offen')}</em></li>`).join('')}</ol>` : '<p class="nichts">Kein offener Wunsch.</p>'}
    ${k.notiz ? `<h3 class="wegtitel">Notiz</h3><p class="kf-text">${esc(k.notiz)}</p>` : ''}
    <p class="fein">Besucher liefert später das Werkzeug 03 über das Kürzel; bis dahin steht hier «offen», nie eine geschätzte Zahl. <button class="link kf-entfernen" type="button" data-entfernen="${esc(k.id)}">Kunden entfernen</button></p>
  </article>`;
}

function seiten() {
  let aus = kopf('Erreichbarkeit', 'Läuft jede Seite <em>gerade?</em>', 'Jede Kundenseite wird abgerufen und muss in acht Sekunden antworten. Hier steht, ob sie es zuletzt tat, wie oft sie im Zeitraum ausfiel und wie schnell sie antwortet.', zeitraum() + WO.knopf('Alle Seiten abrufen', 'verlauf', 'glas', { klein: true, attr: 'data-abruf=""' })) + hinweisProbe();
  if (!S.kunden.length) return aus + leer();
  const ks = S.kunden, aus_ = ks.filter(istAus).length, alleA = ks.reduce((s, k) => s + imZeitraum(k).length, 0), okA = ks.reduce((s, k) => s + imZeitraum(k).filter(x => x.ok).length, 0);
  const ms = ks.map(antwortMs).filter(x => x != null);
  aus += `<div class="band blatt"><div><span class="mono">Gerade erreichbar</span><b>${n(ks.length - aus_ - ks.filter(nieAbgerufen).length)} von ${n(ks.length)}</b></div>
      <div><span class="mono">Ausfälle</span><b>${n(ks.reduce((s, k) => s + ausfaelle(k), 0))}</b></div>
      <div><span class="mono">Erreichbar</span><b>${alleA ? prozent(100 * okA / alleA) : '–'}</b></div>
      <div><span class="mono">Antwort im Schnitt</span><b>${ms.length ? n(Math.round(ms.reduce((a, b) => a + b, 0) / ms.length)) + '&nbsp;ms' : '–'}</b></div></div>
    <p class="fein">Ausfall: eine Folge von Abrufen ohne Antwort zählt einmal. Zuletzt abgerufen ${esc(letzterAbruf())}.</p>`;
  const t = jeTag(), viele = t.length, schritt = viele <= 7 ? 1 : viele <= 14 ? 2 : 5;
  aus += `<section class="blatt tafel"><header><h3>Erreichbar je Tag</h3><p>Anteil der Abrufe, die eine Antwort bekamen</p></header>
      ${saeulen(t.map(x => x.alle ? Math.round(100 * x.ok / x.alle) : 0), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(t[i].tag) : '', Object.assign((i, z) => tagWort(t[i].tag) + ': ' + (t[i].alle ? z + ' %, ' + n(t[i].ok) + ' von ' + n(t[i].alle) : 'kein Abruf'), { label: 'Anteil erreichbarer Abrufe je Tag' }))}
    </section>
    <section class="blatt tabelle">
    <div class="zeile zeile--kopf"><span>Kunde</span><span>Erreichbar</span><span>Verlauf</span><span>Antwort</span><span>Ausfälle</span></div>
    ${ks.slice().sort(rangfolge).map((k, i) => `<div class="zeile" style="--i:${Math.min(i, 20)}"><span class="zeile__n"><b><button class="kf-zl" type="button" data-gehe="kunden" data-wahl="${esc(k.id)}">${mitBild(k)}<small class="kf-zl-ms">${antwortMs(k) != null ? n(antwortMs(k)) + ' ms im Schnitt' : 'noch keine Antwort'}</small></button></b></span><span class="zeile__z${istAus(k) ? ' kf-aus' : ''}">${anteil(k) == null ? '–' : prozent(anteil(k), 0)}</span>
      <span class="kf-zverlauf">${striche(k)}</span><span>${antwortMs(k) != null ? n(antwortMs(k)) + ' ms' : '–'}</span><span>${istAus(k) ? '<b class="kf-aus">jetzt aus</b>' : ausfaelle(k) ? n(ausfaelle(k)) : '–'}</span></div>`).join('')}
  </section>
  <p class="fein">Abgerufen wird auf Knopfdruck («Alle Seiten abrufen» oder beim Kunden «Jetzt abrufen»). Erst wird nur kurz angefragt; lehnt die Seite das ab, wird sie ganz geladen. Die Probeseiten liegen in diesem Werkzeug und antworten lokal; eine Adresse ist absichtlich tot.</p>`;
  return aus;
}

function betreuung() {
  let aus = kopf('Betreuung', 'Was bei der Betreuung <em>ansteht.</em>', `Termine und offene Wünsche aller Kunden an einem Ort: was überfällig ist, was in den nächsten ${n(S.tage)} Tagen kommt und welche Verträge bald enden.`, zeitraum()) + hinweisProbe();
  if (!S.kunden.length) return aus + leer();
  const ks = S.kunden.map(sicht);
  const alleT = []; ks.forEach(k => termine(k).forEach(t => alleT.push({ k, t })));
  const ueb = alleT.filter(x => x.t.wann && tageBis(x.t.wann) < 0), kommt = alleT.filter(x => x.t.wann && tageBis(x.t.wann) >= 0 && tageBis(x.t.wann) <= S.tage);
  const ws = []; ks.forEach(k => wuensche(k).forEach(w => ws.push({ k, w })));
  aus += `<div class="band blatt"><div><span class="mono">Überfällig</span><b>${n(ueb.length)}</b></div>
      <div><span class="mono">In ${n(S.tage)} Tagen</span><b>${n(kommt.length)}</b></div>
      <div><span class="mono">Wünsche offen</span><b>${n(ws.length)}</b></div>
      <div><span class="mono">Verträge enden</span><b>${n(ks.filter(endetBald).length)}</b></div></div>`;
  const zeileT = ({ k, t }, i) => { const d = tageBis(t.wann); return `<li style="--i:${Math.min(i, 12)}"><time>${kurzDatum(t.wann)}</time><div><b><button class="kf-zl" type="button" data-gehe="kunden" data-wahl="${esc(k.id)}">${mitBild(k)}</button></b><p class="kf-quelle">${esc(t.was)}</p></div><em class="${d < 0 ? 'kf-aus' : ''}">${d < 0 ? 'vor ' + n(-d) + ' T.' : d === 0 ? 'heute' : d === 1 ? 'morgen' : 'in ' + n(d) + ' T.'}</em></li>`; };
  aus += `<div class="zwei zwei--fuell">
    <section class="blatt"><header><h3>Termine</h3><p>überfällig und die nächsten ${n(S.tage)} Tage</p></header>
      ${ueb.length + kommt.length ? `<ol class="weg">${ueb.concat(kommt).sort((a, b) => a.t.wann.localeCompare(b.t.wann)).map(zeileT).join('')}</ol>` : '<p class="nichts">Nichts angesetzt.</p>'}</section>
    <div class="stapel">
      <section class="blatt"><header><h3>Offene Wünsche</h3></header>
        ${ws.length ? `<ol class="weg kf-wuensche">${ws.sort((a, b) => (a.w.seit || '').localeCompare(b.w.seit || '')).map(({ k, w }, i) => `<li style="--i:${Math.min(i, 12)}"><time>${w.seit ? kurzDatum(w.seit) : '–'}</time><div><b>${esc(w.text)}</b><p class="kf-quelle"><button class="link" type="button" data-gehe="kunden" data-wahl="${esc(k.id)}">${esc(k.name)}</button></p></div><em>${esc(w.stand || 'offen')}</em></li>`).join('')}</ol>` : '<p class="nichts">Kein offener Wunsch.</p>'}</section>
      <section class="blatt"><header><h3>Verträge</h3><button class="link" type="button" data-gehe="vertraege">Alle Verträge</button></header>
        ${balken(ks.filter(k => k.vertragsende).map(k => ({ k, n: Math.max(1, 400 - Math.max(0, tageBis(k.vertragsende))) })).sort((a, b) => b.n - a.n), x => esc(x.k.name), x => 'endet ' + datum(x.k.vertragsende), 0, x => 'in ' + n(tageBis(x.k.vertragsende)) + ' T.', () => '')}
        <p class="fein">Ein Ende steht nur da, wo Beginn und Laufzeit in Monaten eingetragen sind. «Monatlich kündbar» hat kein Ende.</p></section>
    </div></div>`;
  return aus;
}

function kosten() {
  let aus = kopf('Kosten', 'Was uns jede Seite <em>im Monat kostet.</em>', 'Hosting, Domain und Dienste je Kunde, jeder Posten mit Betrag und Quelle. Fehlt ein Betrag, steht «offen»: geschätzt wird nie.') + hinweisProbe();
  if (!S.kunden.length) return aus + leer();
  const ks = S.kunden.map(sicht), alle = []; ks.forEach(k => (k.kosten || []).forEach(p => alle.push({ k, p })));
  const sum = kostenSumme(ks), ohneQ = alle.filter(x => !x.p.quelle).length, offen = alle.filter(x => x.p.betrag == null).length;
  const sg = geldGross(sum);
  aus += `<div class="band blatt"><div><span class="mono">Im Monat</span><b>${esc(sg.haupt)}</b>${sg.rest ? `<small class="kf-band-rest">und ${esc(sg.rest)}</small>` : ''}</div>
      <div><span class="mono">Posten</span><b>${n(alle.length)}</b></div>
      <div><span class="mono">Betrag offen</span><b>${n(offen)}</b></div>
      <div><span class="mono">Ohne Quelle</span><b>${n(ohneQ)}</b></div></div>
    <p class="fein">Summen je Währung, nie umgerechnet. Die Kosten von Vercel werden hier nicht abgerufen: die Beträge kommen von Hand, jeder mit Quelle.</p>`;
  const nachPosten = {}; alle.forEach(({ p }) => { const k = p.posten || 'ohne Namen'; nachPosten[k] = nachPosten[k] || { k, n: 0, s: {} }; nachPosten[k].n++; if (p.betrag != null) nachPosten[k].s[p.waehrung || 'EUR'] = Math.round(((nachPosten[k].s[p.waehrung || 'EUR'] || 0) + p.betrag) * 100) / 100; });
  aus += `<div class="zwei zwei--fuell">
    <div class="stapel">
      <section class="blatt"><header><h3>Je Kunde</h3></header>
        ${balken(ks.map(k => ({ k, n: Object.values(k.kosten_summe.summen).reduce((a, b) => a + b, 0) || .0001 })).sort((a, b) => b.n - a.n), x => mitBild(x.k), x => x.k.kosten_summe.offen ? mal(x.k.kosten_summe.offen, 'ein Posten offen', 'Posten offen') : mal(x.k.kosten_summe.posten, 'ein Posten', 'Posten'), 0, x => esc(geldListe(x.k.kosten_summe.summen)), () => '')}</section>
      <section class="blatt"><header><h3>Nach Posten</h3></header>${balken(Object.values(nachPosten).sort((a, b) => b.n - a.n), x => esc(x.k), x => esc(geldListe(x.s)), 0, x => mal(x.n, '1×', '×'))}</section>
    </div>
    <section class="blatt"><header><h3>Jeder Posten</h3></header>
      <ol class="weg kf-kosten">${alle.map(({ k, p }, i) => `<li style="--i:${Math.min(i, 12)}"><time>${p.stand ? kurzDatum(p.stand) : '–'}</time><div><b>${esc(p.posten || 'ohne Namen')} · <button class="link" type="button" data-gehe="kunden" data-wahl="${esc(k.id)}">${esc(k.name)}</button></b><p class="kf-quelle">${p.quelle ? esc(p.quelle) : '<span class="kf-offen-t">Quelle offen</span>'}</p></div><em class="${p.betrag == null ? 'kf-offen-t' : ''}">${esc(geld(p.betrag, p.waehrung))}</em></li>`).join('')}</ol>
    </section></div>`;
  return aus;
}

function vertraege() {
  let aus = kopf('Verträge', 'Was die Betreuung <em>einbringt.</em>', 'Je Kunde der Betrag im Monat, Beginn, Laufzeit und das Betreuungsmodell in eigenen Worten. Daneben, was uns die Seite kostet: so lässt sich die Betreuung belegen.') + hinweisProbe();
  if (!S.kunden.length) return aus + leer();
  const ks = S.kunden.map(sicht).sort(rangfolge);
  aus += `<div class="werte">${ks.map(k => { const v = k.vertrag || {}; return `<div class="wert blatt"><span class="mono">${esc(k.name)}</span><b>${v.betrag == null ? 'offen' : esc(geld(v.betrag, v.waehrung))}</b><p>${esc([v.laufzeit || 'Laufzeit offen', v.beginn ? 'seit ' + datum(v.beginn) : '', k.vertragsende ? 'endet ' + datum(k.vertragsende) : ''].filter(Boolean).join(', '))}. ${v.modell ? esc(v.modell) : 'Betreuungsmodell offen.'} <button class="link" type="button" data-aendern="vertrag" data-id="${esc(k.id)}">${offenBei(k.id, 'vertrag') ? 'Geändert, nicht gespeichert' : 'Ändern'}</button></p></div>`; }).join('')}</div>`;
  const zeile = k => { const v = k.vertrag || {}, ks_ = k.kosten_summe.summen, w = v.waehrung || 'EUR', kw = ks_[w], rest = v.betrag != null && Object.keys(ks_).every(x => x === w) && !k.kosten_summe.offen ? v.betrag - (kw || 0) : null;
    return `<div class="vz"><span>${esc(k.name)}</span><b>${v.betrag == null ? 'offen' : esc(geld(v.betrag, w))}</b><em>${esc(geldListe(ks_))}</em><small class="vgl ${rest != null ? 'gut' : ''}">${rest != null ? 'bleibt ' + esc(geld(rest, w)) : 'nicht vergleichbar'}</small></div>`; };
  aus += `<div class="zwei zwei--fuell">
    <section class="blatt vergleich"><header><h3>Betreuung neben den Kosten</h3></header>
      <div class="vz vz--kopf"><span></span><b>Betreuung</b><em>Kosten</em><small></small></div>${ks.map(zeile).join('')}
      <p class="fein">«Nicht vergleichbar», wenn ein Posten offen ist oder Betrag und Kosten in verschiedenen Währungen stehen. Umgerechnet wird nicht.</p></section>
    <section class="blatt"><header><h3>Betreuung im Monat</h3></header>
      ${balken(ks.map(k => ({ k, n: (k.vertrag && k.vertrag.betrag) || 0 })).sort((a, b) => b.n - a.n), x => mitBild(x.k), x => esc(x.k.vertrag.waehrung || 'EUR'), 0, x => esc(geld(x.k.vertrag.betrag, x.k.vertrag.waehrung)), () => '')}
      <p class="fein">Ohne Betrag: ${esc(ks.filter(k => !k.vertrag || k.vertrag.betrag == null).map(k => k.name).join(', ') || 'keiner')}.</p></section>
  </div>`;
  return aus;
}

function so() {   /* ohne Hinweis «Probedaten», wie «So wird gezählt» in der Vorlage */
  return kopf('So wird gerechnet', 'Was die Übersicht <em>weiss und was nicht.</em>', 'Die ' + NAME + ' zeigt nur, was eingetragen oder abgerufen ist. Fehlt eine Zahl, steht «offen». Nichts wird geschätzt, nichts verschickt, nichts kostet etwas.') + `
  <div class="zwei">
    <section class="blatt liste-txt"><h3>Was die Übersicht weiss</h3><ul>
      <li>Ob eine Seite antwortet: ein Abruf auf Knopfdruck (erst nur kurz angefragt, sonst die ganze Seite), acht Sekunden Frist; jeder Abruf landet im Verlauf (höchstens 600 je Kunde)</li>
      <li>Kosten für uns im Monat: jeder Posten mit Betrag, Währung, Quelle und Stand, so wie er eingetragen ist</li>
      <li>Vertrag: Beginn, Laufzeit, Betrag im Monat und das Betreuungsmodell in eigenen Worten; ein Ende nur, wenn die Laufzeit in Monaten dasteht</li>
      <li>Betreuung: Termine mit Datum und offene Wünsche mit ihrem Stand</li>
      <li>Wer etwas geändert hat (Robert oder Anna, aus der Zentrale) und was vorher dastand</li></ul></section>
    <section class="blatt liste-txt"><h3>Was sie nie tut</h3><ul>
      <li>Keine Zahl schätzen: ein leerer Betrag bleibt «offen», Summen stehen je Währung und werden nie umgerechnet</li>
      <li>Nichts still speichern: jede Änderung wartet bis «Speichern» und zeigt danach eine Quittung mit vorher, nachher und «Rückgängig»</li>
      <li>Nichts endgültig löschen ohne Rückfrage; ein entfernter Kunde kommt über die Quittung vollständig zurück</li>
      <li>Nichts verschicken und keinen bezahlten Dienst fragen; Kosten von Vercel werden hier nicht abgerufen</li>
      <li>Keine Besucherzahl erfinden: sie kommt später aus Werkzeug 03, bis dahin steht «offen»</li></ul></section>
  </div>
  <section class="blatt liste-txt"><h3>Gut zu wissen</h3><ul>
    <li><b>Ablage:</b> auf diesem Rechner im Ordner daten/07-kunden-uebersicht: die Kunden, der Verlauf der Abrufe und jede Quittung. Sie wird nirgends hochgeladen.</li>
    <li hidden></li>
    <li><b>Zeitraum:</b> 7, 14 oder 30 Tage gilt für Verlauf, Ausfälle und die anstehenden Termine.</li>
    <li><b>Probedaten:</b> fünf erfundene Kunden; vier Probeseiten antworten lokal, eine Adresse ist absichtlich tot. <button class="link" type="button" data-probe>Probedaten zurücksetzen</button></li>
    <li><b>Prüfung:</b> der Schild-Knopf oben öffnet die Prüfseite mit Lexikon; jede Meldung mit «Was tun?» führt dorthin.</li></ul></section>`;
}

/* ---------- Start ---------- */
(async function () {
  $('#tuer h1').textContent = 'Die ' + NAME + ' startet nicht.'; document.title = NAME + ' · ' + WO_HAUS.name; $('#rand').setAttribute('aria-label', 'Bereiche: ' + NAME);
  try { const t = +localStorage.getItem('tasty-kunden-tage'); if (t === 7 || t === 14 || t === 30) S.tage = t; } catch (e) { /* privat */ }
  const q = new URLSearchParams(location.search), h = location.hash.slice(1);
  if (TITEL[h]) S.ansicht = h;
  if (q.get('kunde')) { S.ansicht = 'kunden'; S.wahl = q.get('kunde'); }
  try { await lade(); }
  catch (e) {
    $('#tuer').hidden = false; $('#tuer-t').textContent = e.message; $('#ansicht').innerHTML = '';
    $('#tuer').insertAdjacentHTML('beforeend', `<p class="tuer-zu__kn">${WO.knopf('Neu laden', 'verlauf', 'gold', { attr: 'data-neu-laden' })}${WO.knopf('Prüfung öffnen', 'schild', 'hell', { href: 'pruefung.html#VERBINDUNG' })}</p>`);
    $('#tuer [data-neu-laden]').onclick = () => location.reload();
    kopfLeiste(); $('#leiste').innerHTML = WO.leiste({ titel: 'Die ' + NAME + ' startet nicht', satz: 'Nichts ist verloren: die Daten liegen in der Ablage auf dem Rechner.', knoepfe: '' });
    return;
  }
  rand(); leiste(); zeichne(); adresse();
  const gerollt = () => document.body.classList.toggle('rg-gerollt', scrollY > 40); addEventListener('scroll', gerollt, { passive: true }); gerollt();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
  window.addEventListener('beforeunload', e => { if (offenZahl()) { e.preventDefault(); e.returnValue = ''; } });   /* nicht gespeicherte Eingaben gehen nie still verloren */
  window.KF_BEREIT = 1;
})();

/* Lange Karten (wie in der Vorlage): ist die Karte des Kunden höher als der Platz zwischen Kopf und Leiste, klebt sie so, dass ihr Ende über der Leiste steht. Nur am Rechner, nur über top. */
(function () {
  let w = 0;
  function passe() {
    w = 0; const f = $('#ansicht .detail'); if (!f) return;
    if (!matchMedia('(min-width:1181px)').matches) { f.style.top = ''; return; }
    const h = f.offsetHeight, frei = innerHeight - 188;
    f.style.top = h > frei ? Math.round(innerHeight - 96 - h) + 'px' : '';
  }
  const bald_ = () => { if (!w) w = requestAnimationFrame(passe); };
  new MutationObserver(bald_).observe($('#ansicht'), { childList: true, subtree: true });
  addEventListener('resize', bald_);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bald_);
})();
