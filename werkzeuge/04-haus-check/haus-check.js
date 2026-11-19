/* Haus-Check · Tasty Studios (Neubau im Kleid, 07.11.2026). Aufbau, Ansichten und Bedienung aus Le Registre (vorlage/culinarium-demo/werkzeuge/registre/,
   registre.js), Rahmen wie Le Bureau (Kopf mit Zentrale, Prüfung, Anleitung; Quittung und Fenster; Speichern in der Leiste grau, gelb, grün),
   Kleid aus zentrale/oberflaeche/ (kleid/tasty, nie hier ändern). Inhalt aus auftraege/04-haus-check.md und der ersten Fassung: Adresse eingeben,
   die Website lesen (pruefung.py über api.py), zehn Bereiche mit Ampel und einem Satz, Gesamturteil mit Potenzial; Check je Haus speichern, Verlauf
   je Haus mit «vorher», «In die Kundenliste» (Stand «geprüft»), Check entfernen und Haus in den Papierkorb nur nach Rückfrage, Zurückholen.
   Jede Änderung zeigt eine Quittung mit vorher, nachher und «Rückgängig». Daten nur über /api/04-haus-check/ (api.py, Ablage daten/04-haus-check/). */
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
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13"/></svg>';   /* Schliessen, wie Le Bureau */
const API = '/zentrale/api/04-haus-check/';
const WERKZEUG = '04-haus-check';
/* Die zehn Bereiche in der Reihenfolge von pruefung.py */
const PRUEF = [['bilder', 'Bilder'], ['texte', 'Texte'], ['handy', 'Handy'], ['ladegewicht', 'Ladegewicht'], ['buchung', 'Buchung'], ['speisekarte', 'Speisekarte'],
  ['impressum', 'Impressum'], ['sprachen', 'Sprachen'], ['alter', 'Alter der Seite'], ['ki', 'Lesbar für KI']];
const PNAME = Object.fromEntries(PRUEF);
const PWAS = { bilder: 'Anzahl, Grösse, Format und Bildtexte der Fotos', texte: 'Länge der Texte auf Startseite und Unterseiten', handy: 'Ansicht fürs Handy, Schriftgrösse, Knöpfe',
  ladegewicht: 'Gewicht von Seite, Bildern, Stilen und Skripten', buchung: 'Eigene Buchung oder nur ein Portal wie Booking.com', speisekarte: 'Karte als Text auf der Seite oder nur als PDF',
  impressum: 'Impressum und Datenschutz vorhanden und erreichbar', sprachen: 'Welche Sprachen die Seite anbietet', alter: 'Hinweise auf das Alter: Baukasten, Jahreszahlen, Technik',
  ki: 'robots.txt für KI-Leser, strukturierte Angaben, llms.txt' };
const AMPEL = { gruen: 'Grün', gelb: 'Gelb', rot: 'Rot' };
const AMPELWORT = { gruen: 'grün', gelb: 'gelb', rot: 'rot' };
const POT = { hoch: 'Potenzial hoch', mittel: 'Potenzial mittel', gering: 'Potenzial gering' };
const ROLLE = { start: 'Startseite', zimmer: 'Zimmer', speisekarte: 'Speisekarte', buchen: 'Buchen', kontakt: 'Kontakt', impressum: 'Impressum', ueber: 'Über das Haus', angebote: 'Angebote' };
const BEREICHE = [
  ['start', 'Übersicht', ''], ['', 'Finden'], ['finden', 'Kunden finden', 'finden'], ['', 'Prüfen'], ['pruefen', 'Neues Haus', 'neu'], ['', 'Die Häuser'], ['haeuser', 'Geprüfte Häuser', 'haeuser'], ['bereiche', 'Wo es fehlt', ''],
  ['verlauf', 'Verlauf', ''], ['papierkorb', 'Papierkorb', 'korb'], ['', 'Zum Gespräch'], ['kundenliste', 'Zur Kundenliste', ''], ['', 'Gut zu wissen'], ['geprueft', 'So wird geprüft', '']];
const TITEL = Object.fromEntries(BEREICHE.filter(x => x[0]).map(x => [x[0], x[1]]));
TITEL.haus = 'Geprüftes Haus';   /* eigene Seite je Haus (17.11.2026), steht nicht im Rand, dort leuchtet «Geprüfte Häuser» */
const S = { haeuser: [], korb: 0, korbListe: null, probe: [], d: null, ansicht: 'start', tage: 30, wahl: '', zeit: '', filter: 'alle', suche: '', zeige: 40,
  neu: null, neuGespeichert: false, laeuft: false, fehler: '', adresse: '', gruen: 0,
  kand: null, kandStand: null, f: { kat: 'alle', land: 'alle', stand: 'alle', sort: 'potenzial', suche: '', zeige: 30, wahl: '' } };

/* ---------- Helfer ---------- */
const n = x => Number(x || 0).toLocaleString('de-DE');
const mal = (z, eins, viele) => z === 1 ? eins : n(z) + ' ' + viele;
const vonH = (z, ges) => n(z) + ' von ' + n(ges) + (ges === 1 ? ' Haus' : ' Häusern');   /* «1 von 1 Haus», «2 von 3 Häusern» */
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
const uhr = iso => String(iso || '').slice(11, 16);
const tag = iso => String(iso || '').slice(0, 10);
const hostVon = a => String(a || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
function prozent(x, stellen = 0) { return Number(x).toLocaleString('de-DE', { maximumFractionDigits: stellen }) + '&nbsp;%'; }
const sek = x => Number(x || 0).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------- Server ---------- */
async function api(methode, weg, daten) {
  const opt = { method: methode, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (daten && methode !== 'GET') opt.body = JSON.stringify(daten);
  if (daten && methode === 'GET') weg += '?' + new URLSearchParams(daten).toString();
  let r, j = null;
  try { r = await fetch(API + weg, opt); } catch (e) { throw { stichwort: 'NETZ', fehler: 'Der Server antwortet nicht.' }; }
  try { j = await r.json(); } catch (e) { /* unten */ }
  if (!r.ok || !j) throw { stichwort: r.status === 404 ? 'HAUS' : r.status === 400 ? 'EINGABE' : 'SERVER', fehler: (j && j.fehler) || 'Unerwartete Antwort des Servers (' + r.status + ').' };
  return j;
}

/* ---------- Daten: alle Häuser mit ihren Checks, daraus die Zahlen ---------- */
async function lade() {
  const j = await api('GET', 'haeuser');
  S.korb = j.papierkorb || 0;
  const voll = await Promise.all((j.haeuser || []).map(h => api('GET', 'haus', { kennung: h.kennung }).then(x => x.haus).catch(() => null)));
  S.haeuser = voll.filter(h => h && (h.checks || []).length).map(h => Object.assign(h, { letzter: h.checks[h.checks.length - 1] }));
  S.haeuser.sort((a, b) => String(b.letzter.zeit).localeCompare(String(a.letzter.zeit)));
  if (!S.probe.length) { try { S.probe = (await api('GET', 'probehaeuser')).haeuser || []; } catch (e) { S.probe = []; } }
  if (S.korbListe) { try { S.korbListe = (await api('GET', 'papierkorb')).haeuser || []; } catch (e) { /* bleibt */ } }
  await Promise.all([kandidatenLaden(), aufnahmenVorab(S.haeuser)]);
  rechne();
}
const alleChecks = () => S.haeuser.flatMap(h => h.checks.map(c => ({ h, c })));
function rechne() {
  const bis = heuteIso(), von = schiebe(bis, -(S.tage - 1)), vvon = schiebe(von, -S.tage), vbis = schiebe(von, -1);
  const checks = alleChecks();
  const im = (x, a, b) => { const t = tag(x.c.zeit); return t >= a && t <= b; };
  const liste = checks.filter(x => im(x, von, bis)), vorher = checks.filter(x => im(x, vvon, vbis));
  const H = S.haeuser, ges = e => e.ergebnis.gesamt;
  const summe = { haeuser: H.length, checks: checks.length, hoch: H.filter(h => ges(h.letzter).potential === 'hoch').length,
    kundenliste: H.filter(h => h.kundenliste).length, offen: H.filter(h => !h.kundenliste).length,
    rot: H.length ? Math.round(10 * H.reduce((a, h) => a + (ges(h.letzter).rot || 0), 0) / H.length) / 10 : null,
    heute: checks.filter(x => tag(x.c.zeit) === bis).length };
  const zeitraum = l => ({ checks: l.length, haeuser: new Set(l.map(x => x.h.kennung)).size, hoch: l.filter(x => ges(x.c).potential === 'hoch').length,
    rot: l.length ? Math.round(10 * l.reduce((a, x) => a + (ges(x.c).rot || 0), 0) / l.length) / 10 : null,
    kundenliste: l.filter(x => x.h.kundenliste && tag(x.h.kundenliste.zeit) >= tag(x.c.zeit)).length });
  const tage = []; for (let t = von; t <= bis; t = schiebe(t, 1)) tage.push(t);
  const je_tag = tage.map(t => { const v = liste.filter(x => tag(x.c.zeit) === t); return { tag: t, checks: v.length, hoch: v.filter(x => ges(x.c).potential === 'hoch').length }; });
  const vor_tag = tage.map(t => vorher.filter(x => tag(x.c.zeit) === schiebe(t, -S.tage)).length);
  const zaehle = f => { const m = {}; H.forEach(h => { const k = f(h); if (k != null) m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(k => ({ k, n: m[k] })).sort((a, b) => b.n - a.n); };
  const ber = PRUEF.map(([k, name]) => {
    const z = { gruen: 0, gelb: 0, rot: 0 };
    H.forEach(h => { const b = (h.letzter.ergebnis.bereiche || []).find(x => x.schluessel === k); if (b && z[b.ampel] != null) z[b.ampel]++; });
    const alle = z.gruen + z.gelb + z.rot;
    return { k, name, ...z, alle, anteil: alle ? z.rot / alle : 0, gut: alle ? z.gruen / alle : 0 };
  });
  const fehlt = ber.filter(b => b.rot + b.gelb).map(b => ({ k: b.k, n: b.rot, gelb: b.gelb })).filter(x => x.n).sort((a, b) => b.n - a.n || b.gelb - a.gelb);
  S.d = { von, bis, tage: S.tage, summe, jetzt: zeitraum(liste), vorher: Object.assign(zeitraum(vorher), { von: vvon, bis: vbis }), je_tag, vor_tag, ber, fehlt,
    potential: ['hoch', 'mittel', 'gering'].map(p => ({ k: p, n: H.filter(h => ges(h.letzter).potential === p).length })).filter(x => x.n),
    arten: zaehle(h => h.art || (h.letzter.ergebnis.haus || {}).art || 'Haus'), wochen: wochenAus(je_tag), leer: !H.length,
    probe: H.length > 0 && H.every(h => /^probe-/.test(h.kennung)) };
}
function wochenAus(jt) {   /* wie registre.js: Woche Montag bis Sonntag, angebrochene am Rand */
  const w = [];
  jt.forEach(t => {
    const d = new Date(t.tag + 'T12:00:00'), mo = schiebe(t.tag, -((d.getDay() + 6) % 7)), x = w.length && w[w.length - 1].mo === mo ? w[w.length - 1] : null;
    if (x) { x.bis = t.tag; x.tage++; x.checks += t.checks; x.hoch += t.hoch; }
    else w.push({ mo, von: t.tag, bis: t.tag, tage: 1, checks: t.checks, hoch: t.hoch });
  });
  return w.map(({ mo, ...x }) => x);
}
const finde = k => S.haeuser.find(h => h.kennung === k);

/* ---------- Rahmen ---------- */
/* Kopf, Rand, Leiste und Startbild aus dem gemeinsamen Kleid (zentrale/oberflaeche/oberflaeche.js), Name nur aus WO_HAUS.namen */
const NAME = WO.name(WERKZEUG), ZENTRALE = WO.name('zentrale');
function standText() {
  const u = S.d.summe;
  if (S.neu && !S.neuGespeichert) return 'Ein Check ist noch nicht gespeichert';
  if (S.d.probe) return 'Probedaten · erfundene Häuser';
  return u.haeuser ? mal(u.haeuser, 'Ein Haus geprüft', 'Häuser geprüft') + (u.hoch ? ', ' + n(u.hoch) + ' mit hohem Potenzial' : '') : 'Noch kein Haus geprüft';
}
function kopfLeiste() {
  $('#kopf').innerHTML = WO.kopf({ werkzeug: WERKZEUG, unter: 'Interessenten', titel: TITEL[S.ansicht] || NAME, stand: standText(),
    pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WO_HAUS.wege.website, markeHref: '#start', marke: `data-gehe="start" aria-label="${esc(NAME)}, Übersicht"` });
  $$('#kopf [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
}
function rand() {
  const u = S.d.summe, an = S.ansicht, gruppen = [];
  const zahl = z => z === 'haeuser' ? (u.haeuser ? n(u.haeuser) : 0) : z === 'korb' ? (S.korb ? n(S.korb) : 0) : z === 'neu' && S.neu && !S.neuGespeichert ? '1' : z === 'finden' && S.kand ? n(S.kand.length) : 0;
  BEREICHE.forEach(([key, name, z]) => {
    if (!key) { gruppen.push({ titel: name, eintraege: [] }); return; }
    if (!gruppen.length) gruppen.push({ titel: '', eintraege: [] });
    gruppen[gruppen.length - 1].eintraege.push({ text: name, an: an === key || (an === 'haus' && key === 'haeuser'), zahl: zahl(z), attr: `data-gehe="${key}"` });
  });
  gruppen.push({ titel: 'Wege', eintraege: [{ text: ZENTRALE, href: WO_HAUS.wege.zentrale, attr: 'data-weg' }, { text: 'Kurzer Rundgang', attr: 'data-weg data-rundgang' }] });
  $('#rand').innerHTML = WO.rand(gruppen, { website: WO_HAUS.wege.website, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  $$('#rand [data-gehe]').forEach(a => a.onclick = e => { e.preventDefault(); gehe(a.dataset.gehe); });
  $$('#rand [data-rundgang]').forEach(a => a.onclick = () => { if (window.rundgang) window.rundgang(); });
  kopfLeiste();
}
/* Leiste wie in Le Bureau: links was gilt, rechts Speichern grau (nichts offen) / gelb (ein Check wartet) / grün (eben gespeichert, 2,6 s) */
function leiste() {
  const d = S.d, u = d.summe, offen = S.neu && !S.neuGespeichert;
  let titel, satz;
  if (offen) { titel = 'Ein Check wartet'; satz = (S.neu.haus && S.neu.haus.name || hostVon(S.neu.adresse)) + ' ist geprüft, aber noch nicht gespeichert.'; }
  else if (S.gruen) { titel = 'Gespeichert'; satz = 'Der Check steht im Verlauf des Hauses.'; }
  else if (d.probe) { titel = 'Du siehst Probedaten'; satz = 'Erfunden, damit du siehst, wie der ' + NAME + ' mit geprüften Häusern aussieht.'; }
  else if (!u.haeuser) { titel = 'Noch kein Haus gespeichert'; satz = 'Adresse eingeben, prüfen, dann speichern. Oder erst die Probehäuser ansehen.'; }
  else { titel = mal(u.haeuser, 'Ein Haus', 'Häuser') + ' geprüft'; satz = mal(u.checks, 'ein Check', 'Checks') + ' im Verlauf, ' + n(u.hoch) + ' mit hohem Potenzial, ' + (u.kundenliste === 1 ? 'eines' : u.kundenliste ? n(u.kundenliste) : 'keines') + ' in der Kundenliste.'; }
  const speichern = offen ? WO.knopf('Check speichern', 'haken', 'wartet', { klein: true, id: 'l-speichern' })
    : S.gruen ? WO.knopf('Gespeichert', 'haken', 'fertig', { klein: true, id: 'l-speichern', disabled: true })
      : WO.knopf('Speichern', 'haken', 'glas', { klein: true, id: 'l-speichern', disabled: true, titel: 'Nichts offen: jeder Check wird hier gespeichert, sobald er geprüft ist.' });
  const kn = (u.haeuser ? WO.knopf('Als Tabelle sichern', 'kopie', 'glas', { klein: true, id: 'l-export', titel: 'Alle Häuser mit dem letzten Check als Tabelle (CSV, öffnet in Excel und Numbers)', attr: 'aria-label="Als Tabelle sichern"' }) : '')
    + (!u.haeuser && !offen ? WO.knopf('Probedaten laden', 'plus', 'gold', { klein: true, id: 'l-probe' }) : '') + speichern;
  $('#leiste').innerHTML = WO.leiste({ titel, satz, entwurf: false, knoepfe: kn });
  if ($('#l-export')) $('#l-export').onclick = () => sichern();
  if ($('#l-probe')) $('#l-probe').onclick = () => probedaten(true);
  if (offen) $('#l-speichern').onclick = () => speichereNeu();
}
/* Bühne: je Ansicht ein eigenes Foto des Studios (WO_HAUS.fotos, nur Bilder der Agentur-Seite); die Übersicht «voll» mit dem Foto des Werkzeugs */
const BUEHNE = { start: [WO_HAUS.fotoJe[WERKZEUG], '50% 50%'], finden: ['terrasse', '50% 50%'], pruefen: ['bildschirm', '50% 45%'], haeuser: ['aussen', '50% 50%'], bereiche: ['plan', '50% 50%'],
  verlauf: ['faehre', '50% 50%'], papierkorb: ['speicherstadt', '50% 50%'], kundenliste: ['empfang', '50% 40%'], geprueft: ['studio', '50% 50%'] };
function kopf(mono, titel, satz, rechts = '', chips = '') {
  const [bild, lage] = BUEHNE[S.ansicht] || BUEHNE.start, voll = S.ansicht === 'start';
  return WO.startbild({ werkzeug: WERKZEUG, art: voll ? 'voll' : 'buehne', foto: WO_HAUS.fotos[bild] || WO_HAUS.foto, zier: mono, h1: titel, satz,
    knoepfe: (voll ? WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) : '') + chips + rechts })
    .replace('<section class="wo-sb', `<section style="--wo-foto-pos:${lage}" class="buehne wo-sb`);
}
function chipsStart(d) {
  const u = d.summe; if (d.leer) return '';
  return `<ul class="buehne__chips"><li><b>${n(u.haeuser)}</b><span>Häuser</span></li><li><b>${n(u.checks)}</b><span>Checks</span></li><li><b>${n(u.hoch)}</b><span>Potenzial hoch</span></li><li><b>${n(u.kundenliste)}</b><span>Kundenliste</span></li></ul>`;
}
function zeitraum() {
  const k = t => `<button type="button" data-tage="${t}" class="${S.tage === t ? 'an' : ''}" aria-pressed="${S.tage === t}">${t} Tage</button>`;
  return `<div class="wahl3 wo-seg zeitraum" role="group" aria-label="Zeitraum">${k(7)}${k(30)}${k(90)}</div>`;
}
function hinweisProbe() {
  return S.d.probe ? `<p class="bsp-band"><b>Probedaten.</b> Die Häuser sind erfunden und zeigen, wie der ${esc(NAME)} mit geprüften Häusern aussieht. <button class="link-i" type="button" data-probe-raus>Probedaten herausnehmen</button></p>` : '';
}
/* Eingabe der Adresse: ein Blatt unter dem Startbild, darunter die Probehäuser zum Ausprobieren */
function pruefblatt() {
  return `<form class="blatt hc-pruef" data-pruef-form autocomplete="off">
    <label class="wo-feld hc-pruef__feld"><span>Adresse der Website</span><input type="text" inputmode="url" spellcheck="false" data-adresse placeholder="www.beispielhotel.de" value="${esc(S.adresse)}" aria-label="Adresse der Website"></label>
    ${WO.knopf(S.laeuft ? 'Liest die Seite' : 'Prüfen', 'suche', 'dunkel', { attr: 'type="submit" data-pruef-los' + (S.laeuft ? ' disabled' : '') }).replace('type="button" ', '')}
    ${S.probe.length ? `<p class="hc-pruef__probe"><span>Zum Ausprobieren:</span>${S.probe.map(p => `<button class="link" type="button" data-probehaus="${esc(p.ordner)}" title="${esc(p.kurz || '')}">${esc(p.name)}</button>`).join('')}</p>` : ''}
  </form>`;
}
function gehe(ziel, wahl) {
  if (!TITEL[ziel]) ziel = 'start';
  if (ziel === 'haus' && !finde(wahl === undefined ? S.wahl : wahl)) ziel = 'haeuser';
  const neu = ziel !== S.ansicht || (ziel === 'haus' && wahl !== undefined && wahl !== S.wahl);
  S.ansicht = ziel;
  if (wahl !== undefined) { S.wahl = wahl; S.zeit = ''; }
  const hash = ziel === 'haus' ? 'haus/' + encodeURIComponent(S.wahl) : ziel;
  /* neuer Eintrag im Verlauf des Browsers: «Zurück» führt vom Haus wieder zur Liste */
  if (location.hash.slice(1) !== hash) history.pushState(null, '', location.pathname + location.search + '#' + hash);
  rand(); zeichne();
  if (neu) { window.scrollTo(0, 0); const f = $('#flaeche'); if (f) f.scrollTop = 0; }
  $('#rand').classList.remove('auf');
}
/* Adresse lesen: #haus/<kennung> öffnet die Seite eines Hauses, sonst der Name der Ansicht */
function ausHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith('haus/')) return ['haus', h.slice(5)];
  return [TITEL[h] ? h : '', undefined];
}
async function frisch(sagen = false, ruhig = false) {
  try {
    await lade();
    rand(); leiste(); zeichne(ruhig);
    if (sagen) melde('Neu geladen', mal(S.haeuser.length, 'ein Haus', 'Häuser') + ' in der Ablage.');
  } catch (e) { fehler(e); }
}

/* ---------- Quittung, Meldung, Fenster (wie Le Bureau) ---------- */
function quitt(titel, text, knoepfe = [], fehl = false) {
  const ort = $('#quittung');
  const k = document.createElement('div');
  k.className = 'hc-quit' + (fehl ? ' fehl' : ''); k.setAttribute('role', fehl ? 'alert' : 'status');
  k.innerHTML = `<div class="hc-quit__t"><b>${esc(titel)}</b>${text ? `<span>${text}</span>` : ''}</div>`;
  knoepfe.forEach(x => k.appendChild(x));
  const zu = document.createElement('button'); zu.type = 'button'; zu.className = 'hc-rund'; zu.setAttribute('aria-label', 'Schliessen'); zu.innerHTML = ZU; zu.onclick = () => k.remove(); k.appendChild(zu);
  ort.innerHTML = ''; ort.appendChild(k);
  return k;
}
function taste(text, tun, href) {
  const b = document.createElement(href ? 'a' : 'button'); b.className = 'hc-taste';
  if (href) b.href = href; else { b.type = 'button'; b.onclick = tun; }
  b.textContent = text; return b;
}
function melde(titel, text, zeit = 4000) { const k = quitt(titel, esc(text)); if (zeit) setTimeout(() => k.remove(), zeit); }
function fehler(e) {
  const st = (e && e.stichwort) || 'SERVER', t = (e && (e.fehler || e.message)) || String(e);
  quitt(st + ' · ' + t, 'Nichts wurde geändert.', [taste('Was tun?', null, 'pruefung.html#' + st)], true);
}
/* Quittung einer Änderung aus der Antwort von api.py: was, vorher, nachher, und «Rückgängig» mit genau dem Aufruf, den der Server nennt (CLAUDE.md) */
function quittung(q, was) {
  if (!q) return null;
  const text = `${esc(was)}: «<span data-q="vorher">${esc(q.vorher)}</span>» wird «<span data-q="nachher">${esc(q.nachher)}</span>»`
    + (q.hinweis ? `<span class="hc-quit__h" data-q="hinweis">${esc(q.hinweis)}</span>` : '');
  const r = q.rueckgaengig;
  const k = quitt(q.text, text, [taste('Vorher/nachher ansehen', () => vorherNachher(was, q.vorher, q.nachher, r ? () => { k.remove(); zurueck(r, was); } : null)),
    r ? taste('Rückgängig', () => { k.remove(); zurueck(r, was); }) : null].filter(Boolean));
  k.dataset.quittung = '1';
  return k;
}
async function zurueck(r, was) {
  try { const j = await api(r.methode, r.rest, r.daten); if (r.rest === 'kandidat') await kandidatenLaden(true); await frisch(false, true); quittung(j.quittung, was); }
  catch (e) { fehler(e); }
}
/* Vorher/nachher als Fenster (Le Bureau zeigt dafür den Entwurf; der Haus-Check hat keinen, darum beide Stände nebeneinander) */
function vorherNachher(was, vorher, nachher, rueck) {
  fenster('Vorher', 'und nachher', `<p class="hc-fenster__satz">${esc(was)}</p>
    <div class="hc-vn"><div><span class="mono">Vorher</span><p data-q="vorher">${esc(vorher || 'nichts')}</p></div><div><span class="mono">Nachher</span><p data-q="nachher">${esc(nachher || 'nichts')}</p></div></div>`,
    [{ text: 'Schliessen' }].concat(rueck ? [{ text: 'Rückgängig', zeichen: 'zurueck', haupt: true, tun: zu => { zu(); rueck(); } }] : []), 'vorher-nachher');
}
function fenster(titel, akzent, inhalt, knoepfe, name) {
  const ort = $('#fenster');
  const zu = () => { ort.innerHTML = ''; document.removeEventListener('keydown', taste_); if (vorher && vorher.focus) vorher.focus(); };
  const taste_ = ev => { if (ev.key === 'Escape') zu(); };
  const vorher = document.activeElement;
  ort.innerHTML = `<div class="hc-fenster"><button class="hc-fenster__grund" type="button" aria-label="Schliessen"></button>
    <div class="hc-fenster__blatt" role="dialog" aria-modal="true" aria-label="${esc(titel + ' ' + akzent)}" data-fenster="${esc(name || '1')}"><h2>${esc(titel)} <em>${esc(akzent)}</em></h2>${inhalt}<div class="hc-fenster__kn"></div></div></div>`;
  $('.hc-fenster__grund', ort).onclick = zu;
  const kn = $('.hc-fenster__kn', ort);
  knoepfe.forEach(k => {
    const b = document.createElement('div'); b.innerHTML = k.haupt ? WO.knopf(k.text, k.zeichen || 'haken', 'dunkel', { klein: true }) : `<button class="link" type="button">${esc(k.text)}</button>`;
    const el = b.firstElementChild; el.onclick = () => (k.tun ? k.tun(zu) : zu()); kn.appendChild(el);
  });
  document.addEventListener('keydown', taste_);
  const erst = $('.hc-fenster__kn .wo-kn', ort) || $('.hc-fenster__kn button', ort); if (erst) erst.focus();
  return zu;
}

/* ---------- Prüfen und Speichern ---------- */
async function pruefe(daten) {
  if (S.laeuft) return;
  S.laeuft = true; S.fehler = ''; S.neu = null; S.neuGespeichert = false;
  if (S.ansicht !== 'pruefen') gehe('pruefen'); else { rand(); zeichne(true); }
  leiste();
  try {
    const j = await api('POST', 'pruefen', Object.assign({ wer: WO_HAUS.wer }, daten));
    const e = j.ergebnis;
    if (e.fehler) S.fehler = e.fehler + ' (' + hostVon(e.adresse) + ')';
    else { S.neu = e; S.adresse = hostVon(e.adresse); await korbLesen(); }
  } catch (e) { S.fehler = (e && e.fehler) || String(e); }
  S.laeuft = false;
  rand(); leiste(); zeichne(true);
  window.scrollTo(0, 0);
}
async function speichereNeu() {
  const e = S.neu; if (!e || S.neuGespeichert) return;
  try {
    const j = await api('POST', 'speichern', { ergebnis: e, wer: WO_HAUS.wer });
    S.neuGespeichert = true; S.wahl = e.kennung; S.zeit = e.geprueft_am;
    gruen();
    await frisch(false, true);
    quittung(j.quittung, (e.haus && e.haus.name) || hostVon(e.adresse));
    return j;
  } catch (x) { fehler(x); throw x; }
}
function gruen() { S.gruen = 1; clearTimeout(gruen.t); gruen.t = setTimeout(() => { S.gruen = 0; if (S.d) leiste(); }, 2600); }
/* Kundenliste: ist der gezeigte Check noch nicht gespeichert, wird er zuerst gespeichert (wie die erste Fassung) */
async function kundenliste(kennung) {
  try {
    if (S.neu && !S.neuGespeichert && S.neu.kennung === kennung) await speichereNeu();
    const h = finde(kennung), name = (h && h.name) || kennung;
    const j = await api('POST', 'kundenliste', { kennung, wer: WO_HAUS.wer });
    await frisch(false, true);
    if (j.quittung) quittung(j.quittung, 'Kundenliste · ' + name); else melde('Nichts geändert', j.hinweis || '');
  } catch (e) { if (e && e.stichwort) fehler(e); }
}
async function kundenlisteZurueck(kennung) {
  try {
    const h = finde(kennung), name = (h && h.name) || kennung;
    const j = await api('DELETE', 'kundenliste', { kennung });
    await frisch(false, true);
    if (j.quittung) quittung(j.quittung, 'Kundenliste · ' + name); else melde('Nichts geändert', j.hinweis || '');
  } catch (e) { fehler(e); }
}
/* Papierkorb frisch lesen: liegt dort schon eine ältere Fassung desselben Hauses, sagen Prüfergebnis und Rückfragen das */
async function korbLesen() { try { S.korbListe = (await api('GET', 'papierkorb')).haeuser || []; } catch (e) { /* bleibt */ } return S.korbListe || []; }
const imKorb = kennung => (S.korbListe || []).find(x => x.kennung === kennung);
function korbSatz(kennung) {
  const k = imKorb(kennung); if (!k) return '';
  return ` Im Papierkorb liegt schon eine ältere Fassung dieses Hauses mit ${k.anzahl === 1 ? 'einem Check' : n(k.anzahl) + ' Checks'}; beide liegen dann dort zusammen, kein Check geht verloren.`;
}
async function checkFragen(kennung, zeit) {
  const h = finde(kennung); if (!h) return;
  await korbLesen();
  const c = h.checks.find(x => x.zeit === zeit); if (!c) return;
  /* Der einzige Check: ohne ihn bliebe vom Haus nichts in der Liste. Darum geht das Haus mit diesem Check in den Papierkorb (api.py, check_loeschen), und die Rückfrage sagt das. */
  const einziger = h.checks.length === 1, wer = `<b>${esc(h.name || kennung)}</b>`, wann = `${esc(datum(zeit))}, ${esc(uhr(zeit))} Uhr (${esc(POT[c.ergebnis.gesamt.potential] || '')})`;
  const satz = einziger
    ? `Der Check vom ${wann} ist der einzige von ${wer}. Ohne ihn bliebe vom Haus nichts in der Liste: Das Haus kommt darum mit diesem Check in den Papierkorb.${korbSatz(kennung)} Von dort lässt es sich zurückholen; endgültig gelöscht wird nichts.${h.kundenliste ? ' In der Kundenliste bleibt es als «geprüft» gemeldet.' : ''}`
    : `Der Check von ${wer} vom ${wann} wird aus dem Verlauf genommen. Direkt danach holt ihn «Rückgängig» zurück.`;
  fenster('Check', 'entfernen?', `<p class="hc-fenster__satz">${satz}</p>`,
    [{ text: 'Abbrechen' }, { text: einziger ? 'In den Papierkorb' : 'Ja, entfernen', zeichen: 'x', haupt: true, tun: async zu => {
      zu();
      try { const j = await api('DELETE', 'check', { kennung, zeit }); S.zeit = ''; if (j.papierkorb && S.wahl === kennung) S.wahl = ''; await frisch(false, true); quittung(j.quittung, h.name || kennung); } catch (e) { fehler(e); }
    } }], 'check-entfernen');
}
async function hausFragen(kennung) {
  const h = finde(kennung); if (!h) return;
  await korbLesen();
  fenster('Haus', 'in den Papierkorb?', `<p class="hc-fenster__satz"><b>${esc(h.name || kennung)}</b> kommt mit ${h.checks.length === 1 ? 'seinem Check' : 'allen ' + n(h.checks.length) + ' Checks'} in den Papierkorb.${korbSatz(kennung)} Von dort lässt es sich zurückholen; endgültig gelöscht wird nichts.${h.kundenliste ? ' In der Kundenliste bleibt es als «geprüft» gemeldet.' : ''}</p>`,
    [{ text: 'Abbrechen' }, { text: 'In den Papierkorb', zeichen: 'x', haupt: true, tun: async zu => {
      zu();
      try { const j = await api('DELETE', 'haus', { kennung }); if (S.wahl === kennung) { S.wahl = ''; if (S.ansicht === 'haus') { S.ansicht = 'haeuser'; history.replaceState(null, '', location.pathname + location.search + '#haeuser'); } } await frisch(false, true); quittung(j.quittung, h.name || kennung); } catch (e) { fehler(e); }
    } }], 'haus-weg');
}
async function zurueckholen(kennung) {
  try { const j = await api('POST', 'haus-zurueck', { kennung }); await frisch(false, true); quittung(j.quittung, (j.haus && j.haus.name) || kennung); } catch (e) { fehler(e); }
}
/* Probedaten: die drei erfundenen Häuser aus probedaten/ prüfen und speichern (dieselben Wege wie jeder Check); herausnehmen legt sie in den Papierkorb.
   Liegt ein Probehaus schon im Papierkorb, holt «laden» genau dieses zurück (mit seinem Verlauf und seiner Meldung an die Kundenliste) statt es neu zu prüfen.
   «Rückgängig» betrifft nur die Häuser, die eben bewegt wurden: nach «herausnehmen» kommen sie aus dem Papierkorb zurück, nach «laden» gehen sie wieder hinein. */
async function probedaten(rein, nur) {
  const vorher = S.haeuser.length, bewegt = [];
  try {
    if (rein) {
      const korb = (await api('GET', 'papierkorb')).haeuser || [];
      for (const p of S.probe) {
        const k = 'probe-' + p.ordner;
        if ((nur && !nur.includes(k)) || finde(k)) continue;
        if (korb.some(x => x.kennung === k)) { await api('POST', 'haus-zurueck', { kennung: k }); bewegt.push(k); continue; }
        const e = (await api('POST', 'pruefen', { probe: p.ordner, wer: WO_HAUS.wer })).ergebnis;
        if (!e.fehler) { await api('POST', 'speichern', { ergebnis: e, wer: WO_HAUS.wer }); bewegt.push(e.kennung || k); }
      }
    } else {
      for (const h of S.haeuser.filter(x => /^probe-/.test(x.kennung) && (!nur || nur.includes(x.kennung)))) { await api('DELETE', 'haus', { kennung: h.kennung }); bewegt.push(h.kennung); }
    }
    await frisch();
    const vt = mal(vorher, 'ein Haus', 'Häuser'), nt = mal(S.haeuser.length, 'ein Haus', 'Häuser');
    const rueck = () => { k.remove(); probedaten(!rein, bewegt); };
    const k = quitt(rein ? 'Probedaten geladen' : 'Probedaten herausgenommen', `Häuser in der Liste: «<span data-q="vorher">${esc(vt)}</span>» wird «<span data-q="nachher">${esc(nt)}</span>»`,
      bewegt.length ? [taste('Vorher/nachher ansehen', () => vorherNachher('Häuser in der Liste', vt, nt, rueck)), taste('Rückgängig', rueck)] : []);
    k.dataset.quittung = '1';
  } catch (e) { fehler(e); }
}

/* ---------- Datenexport: alle Häuser mit dem letzten Check als Tabelle ---------- */
function zelle(x) {
  let t = String(x == null ? '' : x);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;   /* keine Formeln in Excel (CSV-Einschleusung) */
  return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function tabelle(liste) {
  const kopf = ['Haus', 'Art', 'Ort', 'Website', 'Geprüft', 'Potenzial (0–100)', 'Potenzial', 'Urteil', 'Rot', 'Gelb', 'Grün', 'Checks', 'Kundenliste'].concat(PRUEF.map(x => x[1]));
  const zeilen = liste.map(h => { const e = h.letzter.ergebnis, g = e.gesamt;
    return [h.name, h.art, h.ort, h.adresse, datum(h.letzter.zeit) + ' ' + uhr(h.letzter.zeit), g.potenzial_zahl != null ? g.potenzial_zahl : '', POT[g.potential] || g.potential, g.urteil, g.rot, g.gelb, g.gruen, h.checks.length,
      h.kundenliste ? 'gemeldet ' + datum(h.kundenliste.zeit) : 'nein'].concat(PRUEF.map(([k]) => { const b = (e.bereiche || []).find(x => x.schluessel === k); return b ? AMPEL[b.ampel] || b.ampel : ''; })); });
  return '﻿' + [kopf].concat(zeilen).map(z => z.map(zelle).join(';')).join('\r\n') + '\r\n';
}
function sichern() {
  try {
    const name = 'haus-checks-' + heuteIso() + (S.d.probe ? '-probedaten' : '') + '.csv';
    const url = URL.createObjectURL(new Blob([tabelle(S.haeuser)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    melde('Als Tabelle gesichert', name + ' · ' + mal(S.haeuser.length, 'ein Haus', 'Häuser'), 6000);
  } catch (e) { fehler({ stichwort: 'TABELLE', fehler: 'Die Tabelle liess sich nicht sichern.' }); }
}

/* ---------- Bausteine ---------- */
function balken(liste, name, klein, gesamt, leerText) {   /* Rangliste: Name, Balken, Zahl, Anteil. Der Balken wächst nur über transform. */
  if (!liste.length) return `<p class="nichts">${leerText || 'Noch nichts geprüft.'}</p>`;
  const max = Math.max(...liste.map(x => x.n)), ges = gesamt || liste.reduce((a, x) => a + x.n, 0);
  return `<ol class="rang">${liste.map((x, i) => `<li style="--i:${i}"><span class="rang__n">${name(x)}${klein ? `<small>${klein(x)}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, x.n / (max || 1)).toFixed(3)}"></i></span><b>${n(x.n)}</b><em>${Math.round(100 * x.n / (ges || 1))}&nbsp;%</em></li>`).join('')}</ol>`;
}
function vergleich(jetzt, vorher, umgekehrt) {
  if (jetzt == null || !vorher) return '<small class="vgl vgl--leer">&nbsp;</small>';   /* nichts zu vergleichen: am Rechner hält die Zelle die Spalte, am Handy fällt die Zeile weg */
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
/* Statt des Seitenbilds der Vorlage: die Zahl der roten Bereiche als Kachel (dunkel, Zahl in der Titelschrift, Kante oben in der Ampel des Hauses) */
/* Seit dem Kundenblick: die Zahl ist das Potenzial (0–100), die Kante zeigt hoch (rot), mittel (taupe), gering (grün); ältere Checks zeigen die roten Bereiche */
function ampelBild(g) {
  if (g.potenzial_zahl != null) return `<span class="sbild note-bild note--${({ hoch: 'rot', mittel: 'gelb', gering: 'gruen' })[g.potential] || 'gelb'}" aria-hidden="true"><b>${n(g.potenzial_zahl)}</b></span>`;
  return `<span class="sbild note-bild note--${esc(g.ampel)}" aria-hidden="true"><b>${n(g.rot)}</b></span>`;
}
function karteHaus(h, aktiv) {
  const e = h.letzter.ergebnis, g = e.gesamt, art = h.art || (e.haus || {}).art || 'Haus';
  return `<button class="besuch rg-a${g.potential === 'hoch' ? ' gold' : ''}${aktiv ? ' aktiv' : ''}" type="button" data-gehe="haeuser" data-wahl="${esc(h.kennung)}" aria-pressed="${aktiv}">
    <span class="besuch__b">${ampelBild(g)}<span class="besuch__l">${esc(art.slice(0, 1))}</span></span>
    <span class="besuch__n"><b>${esc(h.name || hostVon(h.adresse))}</b><small><i class="besuch__w">${esc(tagWort(tag(h.letzter.zeit)) + ', ' + uhr(h.letzter.zeit) + ' Uhr').replace(/ /g, ' ')}</i><i class="besuch__t"> · </i><i class="besuch__r">${[art + (h.ort ? ' in ' + h.ort : ''), hostVon(h.adresse)].map(x => `<i class="besuch__s">${esc(x)}</i>`).join('')}</i></small></span>
    <span class="besuch__z">${esc(POT[g.potential] || '')}<small>${h.kundenliste ? 'In der Kundenliste' : g.potenzial_zahl != null ? n(g.potenzial_zahl) + ' von 100' : n(g.rot) + ' rot · ' + n(g.gelb) + ' gelb'}</small></span></button>`;
}
function leer() {
  return `<div class="leer blatt">${ZT}<b>Noch kein Haus geprüft.</b>
    <p>Adresse oben eingeben und prüfen. Gespeicherte Checks stehen hier: mit Ampel je Bereich, Urteil, Potenzial und dem Verlauf je Haus.</p>
    <button class="kn kn--linie" type="button" data-probe-rein>Probedaten laden<i>${PF}</i></button></div>`;
}
/* Ein Check als Karte (wie die Besuchskarte der Vorlage): Kopf mit Tag, Haus und Siegel (die Uhrzeit steht wie «Gekommen» der Vorlage in den Angaben), Angaben, die zehn Bereiche als Weg, Gelesene Seiten, Taten */
function checkBlatt(e, o) {
  const g = e.gesamt, haus = e.haus || {}, vor = o.vorher;
  const schritte = (e.bereiche || []).map((b, i) => {
    const alt = vor && (vor.bereiche || []).find(x => x.schluessel === b.schluessel);
    const zahlen = (b.zahlen || []).length ? `<dl class="hc-zahlen">${b.zahlen.map(z => `<div><dt>${esc(z.name)}</dt><dd>${esc(z.wert)}</dd></div>`).join('')}</dl>` : '';
    const hinweise = (b.hinweise || []).length ? `<ul class="hc-hinweise">${b.hinweise.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
    return `<li style="--i:${Math.min(i, 12)}" class="hc-b hc-b--${esc(b.ampel)}"><time>${esc(AMPEL[b.ampel] || b.ampel)}</time><div><b>${esc(b.name)}</b>
      <p class="hc-b__befund">${esc(b.urteil)}</p>${alt && alt.ampel !== b.ampel ? `<p><span class="ereignis">vorher ${esc(AMPELWORT[alt.ampel])}</span></p>` : ''}
      ${zahlen || hinweise ? `<details class="hc-mehr"><summary>Zahlen und Hinweise</summary>${zahlen}${hinweise}</details>` : ''}</div><em></em></li>`;
  }).join('');
  const seiten = (e.seiten || []).map(p => `<li><span>${esc(ROLLE[p.rolle] || p.rolle)}</span><a class="link-i" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.titel || hostVon(p.url))}</a><em>${n(p.woerter)} Wörter · ${sek(p.dauer)} s</em></li>`).join('');
  return `<article class="blatt besuchsblatt hc-check">
    <div class="besuchsblatt__kopf"><div><span class="mono">Check · ${esc(tagWort(tag(e.geprueft_am), true))}</span><h2>${esc(haus.name || hostVon(e.adresse))}</h2></div>
      <span class="siegel">${esc(o.siegel)}</span></div>
    ${e.kundenblick ? '' : `<div class="hc-gesamt hc-gesamt--${esc(g.ampel)}"><b>${esc(POT[g.potential] || g.potential)}</b><p>${esc(g.urteil)}</p></div>`}
    ${kundenblickBlatt(e)}
    <dl class="angaben">
      <div><dt>Website</dt><dd><a class="link-i" href="${esc(e.adresse)}" target="_blank" rel="noopener">${esc(hostVon(e.adresse))}</a></dd></div>
      <div><dt>Art und Ort</dt><dd>${esc([haus.art && haus.art !== 'unklar' ? haus.art : '', haus.ort].filter(Boolean).join(' in ') || '–')}</dd></div>
      <div><dt>Ampel der Website</dt><dd>${n(g.rot)} rot · ${n(g.gelb)} gelb · ${n(g.gruen)} grün</dd></div>
      ${g.urteil_website ? `<div><dt>Die Website</dt><dd>${esc(g.urteil_website)}</dd></div>` : ''}
      ${gefundenUeber(e)}
      <div><dt>Geprüft</dt><dd>${esc(datum(e.geprueft_am))}, <span class="hc-zeit">${esc(uhr(e.geprueft_am))}&nbsp;Uhr</span>${e.wer ? ' von ' + esc(e.wer) : ''}</dd></div>
      <div><dt>Dauer</dt><dd>${e.dauer >= .1 ? sek(e.dauer) + ' Sekunden' : 'unter einer Sekunde'}</dd></div>
      <div><dt>Schwach</dt><dd>${esc((g.schwach || []).slice(0, 3).join(', ') || 'nichts')}${(g.schwach || []).length > 3 ? ' und ' + n(g.schwach.length - 3) + ' weitere' : ''}</dd></div>
    </dl>
    ${o.verlauf || ''}
    <h3 class="wegtitel">Die Website <em>in zehn Bereichen</em></h3>
    <ol class="weg">${schritte}</ol>
    ${seiten ? `<h3 class="wegtitel">Gelesene Seiten</h3><ol class="hc-seiten">${seiten}</ol>` : ''}
    <div class="hc-taten">${o.taten || ''}</div>
    <p class="fein">Geprüft ohne bezahlte Dienste: die Seite selbst, ihre wichtigsten Unterseiten, robots.txt, llms.txt, die Sitemap, der KI-Check, der Kundenfinder und Wikipedia.${e.probe ? ' Probedaten: ein erfundenes Haus aus dem Ordner probedaten/.' : ''}</p>
  </article>`;
}
function gefundenUeber(e) {
  const k = e.kandidat && (S.kand || []).find(x => x.id === e.kandidat);
  return k ? `<div><dt>Gefunden über</dt><dd><button class="link-i" type="button" data-zum-kand="${esc(k.id)}">${esc(KAT[k.kategorie] + ': ' + k.name)}</button></dd></div>` : '';
}
function detailHaus(h) {
  if (!h) return '';
  const checks = h.checks, c = checks.find(x => x.zeit === S.zeit) || h.letzter, i = checks.indexOf(c), vorher = i > 0 ? checks[i - 1].ergebnis : null;
  const verlauf = `<div class="hc-verlauf"><span class="mono">Verlauf · ${mal(checks.length, 'ein Check', 'Checks')}</span><div>${checks.slice().reverse().map(x =>
    `<button type="button" class="hc-vk${x === c ? ' an' : ''}" data-check="${esc(x.zeit)}" aria-pressed="${x === c}"><i class="hc-punkt hc-punkt--${esc(x.ergebnis.gesamt.ampel)}"></i>${esc(datum(x.zeit))}, ${esc(uhr(x.zeit))}${x.wer ? ' · ' + esc(x.wer) : ''}</button>`).join('')}</div></div>`;
  const taten = WO.knopf(h.kundenliste ? 'Aus der Kundenliste' : 'In die Kundenliste', h.kundenliste ? 'zurueck' : 'plus', h.kundenliste ? 'hell' : 'gold', { klein: true, attr: `data-kl${h.kundenliste ? '-raus' : ''}="${esc(h.kennung)}"` })
    + WO.knopf('Neu prüfen', 'verlauf', 'hell', { klein: true, attr: `data-neu-pruefen="${esc(h.kennung)}"` })
    + `<button class="link" type="button" data-check-weg="${esc(c.zeit)}" data-kennung="${esc(h.kennung)}">Diesen Check entfernen</button>`
    + `<button class="link" type="button" data-haus-weg="${esc(h.kennung)}">Haus in den Papierkorb</button>`;
  return checkBlatt(c.ergebnis, { vorher, verlauf, taten, siegel: h.kundenliste ? 'In der Kundenliste' : POT[c.ergebnis.gesamt.potential] || 'Geprüft' });
}

/* ---------- Ansichten ---------- */
function zeichne(ruhig) {
  const el = $('#ansicht');
  const f = { finden, pruefen, haeuser, bereiche, verlauf, papierkorb, kundenlisteAnsicht, geprueft, haus: hausAnsicht }[S.ansicht === 'kundenliste' ? 'kundenlisteAnsicht' : S.ansicht] || start;
  el.innerHTML = f();
  verbinde(el);
  document.title = (TITEL[S.ansicht] || NAME) + ' · ' + NAME + ' · ' + WO_HAUS.name;
  schweben(el, ruhig);
}
function verbinde(el) {
  $$('[data-gehe]', el).forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe, b.dataset.wahl); });
  $$('[data-tage]', el).forEach(b => b.onclick = () => { if (S.tage === +b.dataset.tage) return; S.tage = +b.dataset.tage; try { localStorage.setItem('tasty-haus-check-tage', S.tage); } catch (e) { /* privat */ } rechne(); rand(); leiste(); zeichne(); });
  $$('[data-probe-rein]', el).forEach(b => b.onclick = () => probedaten(true));
  $$('[data-probe-raus]', el).forEach(b => b.onclick = () => probedaten(false));
  $$('[data-sichern]', el).forEach(b => b.onclick = () => sichern());
  $$('[data-filter]', el).forEach(b => b.onclick = () => { S.filter = b.dataset.filter; S.zeige = 40; zeichne(true); });
  $$('[data-mehr]', el).forEach(b => b.onclick = () => { S.zeige += 60; zeichne(true); });
  $$('[data-kl]', el).forEach(b => b.onclick = () => kundenliste(b.dataset.kl));
  $$('[data-kl-raus]', el).forEach(b => b.onclick = () => kundenlisteZurueck(b.dataset.klRaus));
  $$('[data-check]', el).forEach(b => b.onclick = () => { S.zeit = b.dataset.check; zeichne(true); });
  $$('[data-haus]', el).forEach(b => b.onclick = e => { e.preventDefault(); gehe('haus', b.dataset.haus); });
  $$('[data-check-weg]', el).forEach(b => b.onclick = () => checkFragen(b.dataset.kennung, b.dataset.checkWeg));
  $$('[data-haus-weg]', el).forEach(b => b.onclick = () => hausFragen(b.dataset.hausWeg));
  $$('[data-zurueckholen]', el).forEach(b => b.onclick = () => zurueckholen(b.dataset.zurueckholen));
  $$('[data-neu-pruefen]', el).forEach(b => b.onclick = () => { const h = finde(b.dataset.neuPruefen); if (!h) return; const e = h.letzter.ergebnis; S.adresse = hostVon(h.adresse); pruefe(e.probe ? { probe: e.probe } : { adresse: h.adresse }); });
  $$('[data-neu-speichern]', el).forEach(b => b.onclick = () => speichereNeu().catch(() => {}));
  $$('[data-probehaus]', el).forEach(b => b.onclick = () => { const p = S.probe.find(x => x.ordner === b.dataset.probehaus); S.adresse = hostVon(p ? p.adresse : ''); pruefe({ probe: b.dataset.probehaus }); });
  $$('[data-pruef-form]', el).forEach(f => f.onsubmit = ev => { ev.preventDefault(); const i = $('[data-adresse]', f), a = i.value.trim(); if (!a) { i.focus(); return; } S.adresse = a; pruefe({ adresse: a }); });
  $$('[data-adresse]', el).forEach(i => i.oninput = () => { S.adresse = i.value; });
  $$('[data-zum-haus]', el).forEach(b => b.onclick = () => gehe('haus', b.dataset.zumHaus));
  $$('[data-zum-kand]', el).forEach(b => b.onclick = () => { Object.assign(S.f, { kat: 'alle', land: 'alle', stand: 'alle', suche: '', wahl: b.dataset.zumKand, zeige: 400 }); gehe('finden'); });
  verbindeFinden(el);
  aufnahmenLaden(el);
  const s = $('[data-suche]', el);
  if (s) s.oninput = () => { S.suche = s.value; const pos = s.selectionStart; zeichne(true); const t = $('[data-suche]'); t.focus(); try { t.setSelectionRange(pos, pos); } catch (e) { /* */ } };
}
/* Schweben (Rezeptur aus Le Registre): sobald ein Blatt am unteren Rand auftaucht, schwebt es an seinen Platz (.rg-da); Balken und Säulen wachsen,
   wenn ihr Blatt gut zur Hälfte im Bild ist (.rg-los). Nur transform und opacity. */
let IO = null, IO_LOS = null;
function schweben(el, still) {
  if (IO) IO.disconnect();
  if (IO_LOS) IO_LOS.disconnect();
  const ziele = [];
  const nimm = (sel, reihe) => $$(sel, el).forEach(x => { if (x.dataset.r) return; x.dataset.r = '1'; x.style.setProperty('--i', reihe ? Math.min([...x.parentNode.children].indexOf(x), 3) : 0); ziele.push(x); });
  nimm('.bsp-band, .hc-filter, .band, .tabelle, .leer, .zw, .mehr, .wenig, #ansicht > .blatt, #ansicht > .tafel', false);
  nimm('.zahlen > .blatt, .zwei > .blatt, .stapel > .blatt, .werte > .wert, .liste .besuch', true);
  /* neue Ansichten (17.11.2026): Tafeln, Karten und Zeilen schweben herein, der Kopf eines Hauses steht sofort */
  nimm('.hd-teil:not(.hd-stapel), .hd-stapel > .hd-tafel, .hd-gruppe, .hd-abschnitt, .hd-blicke, .hd-bereiche--still', false);
  nimm('.hd-karten > .hd-karte, .hd-reihe > .hd-zeile', true);
  const ruhig = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (still) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los', 'rg-ruhig')); return; }
  if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(x => x.classList.add('rg-da', 'rg-los')); return; }
  IO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-da'); IO.unobserve(e.target); } }), { rootMargin: '0px 0px 8% 0px' });
  IO_LOS = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rg-los'); IO_LOS.unobserve(e.target); } }), { threshold: .45 });
  ziele.filter(x => x.querySelector('.saeulen .s i,.rang__b i,.trichter li i')).forEach(x => IO_LOS.observe(x));
  ziele.filter(x => !x.querySelector('.saeulen .s i,.rang__b i,.trichter li i')).forEach(x => x.classList.add('rg-los'));
  ziele.forEach(x => IO.observe(x));
}

function start() {
  const d = S.d, u = d.summe;
  const gruss = /[?&]gruss=tag/.test(location.search) ? 'Guten Tag.' : WO.gruss();
  const satzS = 'Adresse eines Hotels oder Restaurants eingeben und in einer Minute sehen, wo die Website schwach ist und ob sich das Haus als Kunde lohnt. Grundlage für die Potenzialanalyse.';
  let aus = kopf(esc(NAME + ' · ' + WO_HAUS.name), `${gruss}<br><em>Welches Haus prüfen wir?</em>`, satzS, '', chipsStart(d)) + hinweisProbe();
  aus += pruefblatt() + wegBand(true);
  if (d.leer) return aus + leer();
  aus += zuletztGeprueft();
  return aus;
}

function pruefen() {
  let aus = kopf('Neues Haus', 'Ein Haus <em>in einer Minute.</em>', 'Die Website in zehn Bereichen, dazu der Kundenblick: genug Bilder, Text und Marke? Wer baut die Seite, wie oft wird sie gepflegt, wie lesen ChatGPT und Co. sie, was steht ausserhalb? Am Ende das Potenzial als Zahl.') + pruefblatt();
  if (S.laeuft) return aus + `<div class="blatt hc-laeuft" role="status"><span class="mono">Liest die Seite</span><b>${esc(S.adresse || 'Die Website')}</b><p>Startseite, Unterseiten und Bilder, dann Sitemap, KI-Check, Kundenfinder und Wikipedia, dazu eine Aufnahme der Startseite. Das dauert bis zu einer Minute.</p><div class="lade-platz" aria-hidden="true"><i></i><i></i></div></div>`;
  if (S.fehler) return aus + `<div class="leer-hinweis"><b>Das ging nicht.</b> ${esc(S.fehler)} <a class="link-i" href="pruefung.html#LESEN" target="_blank" rel="noopener">Was tun?</a></div>`;
  if (!S.neu) return aus + `<div class="leer blatt">${ZT}<b>Noch nichts geprüft.</b><p>Adresse eingeben, ein Probehaus wählen oder unter «Kunden finden» ein Haus aussuchen. Geprüft wird die Website in zehn Bereichen und ob das Haus für uns als Kunde Sinn macht.</p></div>`;
  const e = S.neu, h = finde(e.kennung), vorher = h ? h.checks.filter(c => c.zeit < e.geprueft_am).pop() : null;
  const taten = (S.neuGespeichert ? '' : WO.knopf('Check speichern', 'haken', 'dunkel', { klein: true, attr: 'data-neu-speichern' }))
    + (h && h.kundenliste ? '' : WO.knopf('In die Kundenliste', 'plus', 'gold', { klein: true, attr: `data-kl="${esc(e.kennung)}"`, titel: S.neuGespeichert ? '' : 'Der Check wird zuerst gespeichert, dann gemeldet.' }))
    + (S.neuGespeichert ? WO.knopf('Zum Haus', 'rechts', 'hell', { klein: true, attr: `data-zum-haus="${esc(e.kennung)}"` }) : '');
  const korb = !h && imKorb(e.kennung);
  const verlauf = korb ? `<p class="hc-schon">${esc(korb.name || e.kennung)} liegt mit ${korb.anzahl === 1 ? 'einem älteren Check' : n(korb.anzahl) + ' älteren Checks'} im Papierkorb. Speichern legt diesen Check neu an; <button class="link" type="button" data-zurueckholen="${esc(e.kennung)}">Zurückholen</button> holt die älteren Checks dazu. Verloren geht keiner.</p>`
    : h ? `<p class="hc-schon">${esc(h.name || e.kennung)} ist schon ${h.checks.length === 1 ? 'einmal' : n(h.checks.length) + ' Mal'} geprüft. ${vorher ? 'Was sich seit dem ' + esc(datum(vorher.zeit)) + ' geändert hat, steht an jedem Bereich als «vorher».' : ''}</p>` : '';
  return aus + `<div class="hc-ergebnis">${dossier(e, { h, vorher: vorher && vorher.ergebnis, taten, hinweis: verlauf ? `<div class="hd-hinweis">${verlauf}</div>` : '',
    mono: (S.neuGespeichert ? 'Gespeichert · ' : 'Noch nicht gespeichert · ') + wannE(e.geprueft_am),
    verlauf: h ? `<p class="hd-unter">${mal(h.checks.length, 'Ein gespeicherter Check', 'gespeicherte Checks')}. <button class="link" type="button" data-zum-haus="${esc(e.kennung)}">Zum Haus</button></p>` : '' })}</div>`;
}

function haeuser() {
  let aus = kopf('Geprüfte Häuser', 'Jedes Haus <em>auf einen Blick.</em>', 'Alle gespeicherten Häuser mit ihrer Startseite und dem letzten Check. Ein Klick öffnet die ganze Seite des Hauses.') + hinweisProbe();
  if (S.d.leer) return aus + leer();
  return aus + haeuserListe() + `<p class="mehr sichern"><button class="kn kn--linie" type="button" data-sichern>Alle Häuser als Tabelle sichern<i>${SYM.laden}</i></button></p>`;
}

function bereiche() {
  let aus = kopf('Wo es fehlt', 'Wo es bei jedem Haus <em>fehlt.</em>', 'Je Haus nur die Bereiche, die nicht grün sind: rot zuerst, dann gelb. Das ist der Stoff für das erste Gespräch. Ein Klick öffnet das ganze Haus.') + hinweisProbe();
  if (S.d.leer) return aus + leer();
  return aus + fehltListe();
}

function verlauf() {
  const d = S.d, u = d.jetzt, v = d.vorher;
  let aus = kopf('Verlauf', 'Wie die Checks <em>zusammenkommen.</em>', `Die letzten ${n(d.tage)} Tage neben den ${n(d.tage)} Tagen davor (${esc(datum(v.von))} bis ${esc(datum(v.bis))}). Hell im Hintergrund: derselbe Tag im Zeitraum davor.`, zeitraum()) + hinweisProbe();
  if (d.leer) return aus + leer();
  const viele = d.je_tag.length, schritt = viele <= 7 ? 1 : viele <= 31 ? 5 : 15;
  const zeile = (name, a, b, fmt = n, umgekehrt) => `<div class="vz"><span>${name}</span><b>${a == null ? '–' : fmt(a)}</b><em>${b == null ? '–' : fmt(b)}</em>${vergleich(a, b, umgekehrt)}</div>`;
  const geaendert = S.haeuser.filter(h => h.checks.length > 1).map(h => {
    const a = h.checks[h.checks.length - 2].ergebnis, b = h.letzter.ergebnis;
    const w = (b.bereiche || []).filter(x => { const y = (a.bereiche || []).find(z => z.schluessel === x.schluessel); return y && y.ampel !== x.ampel; });
    return { h, w };
  });
  aus += `<section class="blatt tafel">
      <header><h3>Checks je Tag</h3><p><span class="punkt"></span>dieser Zeitraum <span class="punkt punkt--hell"></span>davor</p></header>
      ${saeulen(d.je_tag.map(t => t.checks), i => (viele - 1 - i) % schritt === 0 ? kurzDatum(d.je_tag[i].tag) : '', Object.assign((i, z) => tagWort(d.je_tag[i].tag) + ': ' + mal(z, 'ein Check', 'Checks') + ' · davor ' + n(d.vor_tag[i]), { label: 'Checks je Tag im Vergleich zum Zeitraum davor' }), 'saeulen--vgl', d.vor_tag)}
    </section>
    <div class="zwei zwei--fuell">
      <section class="blatt vergleich"><header><h3>Neben dem Zeitraum davor</h3></header>
        <div class="vz vz--kopf"><span></span><b>Jetzt</b><em>Davor</em><small></small></div>
        ${zeile('Checks', u.checks, v.checks)}${zeile('Geprüfte Häuser', u.haeuser, v.haeuser)}${zeile('Potenzial hoch', u.hoch, v.hoch)}
        ${zeile('Rot je Check', u.rot, v.rot, x => Number(x).toLocaleString('de-DE'), true)}
      </section>
      <section class="blatt"><header><h3>Woche für Woche</h3></header>
        ${wochen(d.wochen)}
      </section>
    </div>
    <section class="blatt tafel"><header><h3>Was sich geändert hat</h3><p>Häuser mit mehr als einem Check</p></header>
      ${geaendert.length ? `<ol class="hc-wandel">${geaendert.map(({ h, w }) => `<li><button class="hc-l" type="button" data-zum-haus="${esc(h.kennung)}">${esc(h.name || h.kennung)}</button>
        <span>${w.length ? w.map(x => esc(x.name) + ' jetzt ' + esc(AMPELWORT[x.ampel])).join(' · ') : 'Seit dem letzten Check unverändert'}</span><em>${mal(h.checks.length, 'ein Check', 'Checks')}</em></li>`).join('')}</ol>`
        : '<p class="nichts">Noch kein Haus zweimal geprüft. «Neu prüfen» beim Haus legt den nächsten Check daneben.</p>'}
    </section>`;
  return aus;
}
function wochen(w) {
  const max = Math.max(1, ...w.map(x => x.checks / x.tage));
  return `<ol class="wochen">${w.map((x, i) => `<li style="--i:${i}"><span>${kurzDatum(x.von)}–${kurzDatum(x.bis)}${x.tage < 7 ? `<small>${x.tage} ${x.tage === 1 ? 'Tag' : 'Tage'}</small>` : ''}</span>
    <span class="rang__b"><i style="--w:${Math.max(.02, (x.checks / x.tage) / max).toFixed(3)}"></i></span><b>${n(x.checks)}</b><em>${n(x.hoch)}&nbsp;Potenzial&nbsp;hoch</em></li>`).join('')}</ol>
    <p class="fein">Montag bis Sonntag. Angebrochene Wochen am Rand: der Balken zeigt den Schnitt je Tag.</p>`;
}

function papierkorb() {
  let aus = kopf('Papierkorb', 'Was <em>beiseitegelegt ist.</em>', 'Häuser, die aus der Liste genommen wurden, mit allen ihren Checks. Endgültig gelöscht wird hier nichts; ein Klick holt ein Haus zurück.');
  if (!S.korbListe) { S.korbListe = []; api('GET', 'papierkorb').then(j => { S.korbListe = j.haeuser || []; if (S.ansicht === 'papierkorb') zeichne(true); }).catch(fehler); }
  const l = S.korbListe;
  if (!l.length) return aus + `<div class="leer blatt">${ZT}<b>Der Papierkorb ist leer.</b><p>Nimmt man ein Haus aus der Liste, liegt es hier, bis es zurückgeholt wird.</p></div>`;
  return aus + `<section class="blatt tabelle hc-korb">
    <div class="zeile zeile--kopf"><span>Haus</span><span>Checks</span><span aria-hidden="true"></span><span>Zuletzt</span><span></span></div>
    ${l.map((h, i) => `<div class="zeile" style="--i:${Math.min(i, 20)}"><span class="zeile__n"><b>${esc(h.name || h.kennung)}</b><small>${esc(hostVon(h.adresse))}</small></span><span class="zeile__z">${n(h.anzahl)}</span>
      <span aria-hidden="true"></span><span>${h.letzter ? esc(POT[h.letzter.potential] || '') : '–'}</span><span><button class="link" type="button" data-zurueckholen="${esc(h.kennung)}">Zurückholen</button></span></div>`).join('')}
  </section>
  <p class="fein">Zurückgeholte Häuser stehen wieder unter «Geprüfte Häuser», mit dem ganzen Verlauf.</p>`;
}

function kundenlisteAnsicht() {
  let aus = kopf('Zur Kundenliste', 'Welche Häuser <em>sich lohnen.</em>', 'Was ein Gespräch lohnt, was schon in der Kundenliste steht und was eher kein Kunde ist. «In die Kundenliste» legt das Haus dort mit dem Stand «geprüft» an.') + hinweisProbe();
  if (S.d.leer) return aus + leer();
  return aus + kundenGruppen();
}
function trichter(u) {
  const s = u.haeuser || 1, lohnt = S.haeuser.filter(h => h.letzter.ergebnis.gesamt.potential !== 'gering').length, kl = Math.min(s, u.kundenliste);
  const stufen = [['Geprüfte Häuser', u.haeuser], ['Potenzial hoch oder mittel', lohnt], ['In der Kundenliste', kl]];
  return `<ol class="trichter">${stufen.map(([name, z], i) => `<li style="--i:${i};--w:${Math.max(.04, z / s).toFixed(3)}"><i></i><span>${name}</span><b>${n(z)}</b>${i ? `<em>${prozent(100 * z / (stufen[i - 1][1] || 1))} davon</em>` : '<em>&nbsp;</em>'}</li>`).join('')}</ol>
    <p class="fein">Auch Häuser mit geringem Potenzial können in die Kundenliste; darum kann die letzte Stufe grösser sein als die mittlere.</p>`;
}

function geprueft() {
  return kopf('So wird geprüft', `Drei Blicke, <em>eine Zahl.</em>`, NAME + ' liest eine Website so, wie ein Gast und ein KI-Dienst sie sehen: ohne bezahlte Dienste, ohne Anmeldung, in weniger als einer Minute. Am Ende steht das Potenzial als Kunde.') + geprueftInhalt();
}

/* ---------- Start ---------- */
(async function () {
  $('#tuer h1').textContent = NAME + ' startet nicht.'; document.title = NAME + ' · ' + WO_HAUS.name; $('#rand').setAttribute('aria-label', 'Bereiche: ' + NAME);
  try { const t = +localStorage.getItem('tasty-haus-check-tage'); if (t === 7 || t === 30 || t === 90) S.tage = t; } catch (e) { /* privat */ }
  const [ah, aw] = ausHash(); if (ah) { S.ansicht = ah; if (aw !== undefined) S.wahl = aw; }
  const q = new URLSearchParams(location.search).get('haus'); if (q) { S.ansicht = 'haus'; S.wahl = q; }
  try { await lade(); }
  catch (e) {
    $('#tuer').hidden = false; $('#tuer-t').textContent = (e.fehler || e.message || String(e)) + ' (Stichwort ' + (e.stichwort || 'SERVER') + ')'; $('#ansicht').innerHTML = '';
    $('#tuer').insertAdjacentHTML('beforeend', `<p class="tuer-zu__kn">${WO.knopf('Neu laden', 'verlauf', 'gold', { attr: 'data-neu' })}${WO.knopf('Prüfung öffnen', 'schild', 'hell', { href: 'pruefung.html#' + (e.stichwort || 'SERVER') })}</p>`);
    $('#tuer [data-neu]').onclick = () => location.reload();
    return;
  }
  if (S.ansicht === 'haus' && !finde(S.wahl)) S.ansicht = 'haeuser';
  rand(); leiste(); zeichne();
  const gerollt = () => document.body.classList.toggle('rg-gerollt', scrollY > 40); addEventListener('scroll', gerollt, { passive: true }); gerollt();
  window.addEventListener('popstate', () => { const [z, w] = ausHash(); if (z && (z !== S.ansicht || (w !== undefined && w !== S.wahl))) gehe(z, w); });
  window.addEventListener('hashchange', () => { const [z, w] = ausHash(); if (z && (z !== S.ansicht || (w !== undefined && w !== S.wahl))) gehe(z, w); });
  /* Ungespeicherter Check: vor dem Verlassen fragt der Browser nach (nie still verwerfen) */
  window.addEventListener('beforeunload', e => { if (S.neu && !S.neuGespeichert) { e.preventDefault(); e.returnValue = ''; } });
  window.HAUS_CHECK = 1;
  window.HAUS_CHECK_STAND = () => JSON.parse(JSON.stringify({ d: S.d, haeuser: S.haeuser.length, neu: !!S.neu, gespeichert: S.neuGespeichert }));   /* nur lesen (Prüfläufe) */
})();

/* Lange Karten (aus Le Registre): ist die Karte eines Hauses höher als der Platz zwischen Kopf und Leiste, klebt sie so, dass ihr Ende über der Leiste steht. */
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
