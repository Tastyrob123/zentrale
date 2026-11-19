/* Sales Cockpit · Tasty Studios (09.11.2026, Umbau nach Robert): «Bei einem Sales-Cockpit geht es erstmal nur darum, welche Kunden jetzt überhaupt noch
   akquiriert werden müssen … eine richtig geile Übersicht pro neu akquirierten Kunden … das ist die Website, diese Tools kommen dazu, das kann der Kunde damit
   machen … auf jeder Seite die wichtigsten Fragen beantwortet … Informationen eintragen … Angebotskonditionen parat … was in der Wartung passiert.»
   Also: nur Häuser ohne Vertrag; je Haus eine Gesprächsmappe (Website, Werkzeuge, Angebot, Ablauf, Fragen, Gespräch) mit der Spalte «Parat» daneben.
   Liest Häuser aus «Kunden» (bleibt, wie es ist), Adressen aus projekte.py, Werkzeuge aus Marke & Vision (kapitel.js), Wissen aus wissen.js (mit Quellen).
   Speichert nur Annas Gespräche (api.py); jede Änderung mit Quittung vorher und nachher und «Rückgängig». Keine Probedaten. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ORDNER = '13-sales-cockpit', API = '/zentrale/api/' + ORDNER + '/';
const H = window.WO_HAUS || {};
/* Das Kleid kennt Werkzeug 13 nicht (namen enden bei 11): nur für diese Seite ergänzt, das Kleid bleibt unverändert (wie Marke & Vision) */
if (H.namen && !H.namen[ORDNER]) H.namen[ORDNER] = 'Sales Cockpit';
const NAME = 'Sales Cockpit';
const W = window.SC_WISSEN || {};
const FOTO = k => (H.fotos && H.fotos[k]) || H.foto;
const WEBSITE = (H.wege && H.wege.website) || '/zentrale/seite/index.html';
const KUNDEN_WZ = '/zentrale/werkzeuge/02-kundenliste/';
const LAPTOP = '/zentrale/zentrale/img/laptop.webp';
const WZ_BILD = '/zentrale/werkzeuge/12-marke-vision/haeuser/wz/';
const zahl = n => Number(n).toLocaleString('de-CH');
const mz = (n, eins, viele) => (n === 1 ? (/^(Seite|Beigabe)$/.test(eins) ? 'eine' : 'ein') : zahl(n)) + '\u00a0' + (n === 1 ? eins : viele);
const datum = s => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/.exec(s || ''); return m ? `${+m[3]}.${+m[2]}.${m[1]}${m[4] ? ', ' + m[4] : ''}` : ''; };
const kurz = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + ' …' : t; };
const wirt = u => String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const lokal = u => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(u || '');
const norm = s => String(s || '').toLowerCase().replace(/[^a-zäöü]/g, '');
const satz1 = t => (String(t || '').match(/^.*?[.!?](\s|$)/) || [t || ''])[0].trim();
const WER = () => H.wer || 'Robert';
const pfeil = () => WO.ic('pfeil');

/* ---------------------------------------------------------------- Ordnung */
/* Offen = noch kein Vertrag (Robert: Culinarium, Wild Side und Co. fallen raus). Drei Stufen wie der Weg in der Zentrale. */
const offen = h => !/^(Vertrag|Pro bono|abgesagt)$/.test(h.stand || '');   // Pro bono: Culinarium (Robert 17.11.2026)
const STUFEN = [
  { k: 'gespraech', t: 'Im Gespräch', s: 'Gespräch oder Angebot', re: /^(Gespräch|Angebot)$/ },
  { k: 'draussen', t: 'Entwurf geschickt', s: 'Präsentation oder Entwurf beim Haus', re: /^(angeschrieben|Entwurf geschickt)$/ },
  { k: 'neu', t: 'Noch nicht angeschrieben', s: 'Designstudie gebaut, noch nichts verschickt', re: /^(offen|gefunden|geprüft)$/ }
];
const stufeVon = h => STUFEN.find(s => s.re.test(h.stand || '')) || STUFEN[2];
/* Die sieben Werkzeuge und ihre Namen in den Häusern (Marke & Vision, Kapitel «Unsere Werkzeuge», und die Werkzeug-Listen in «Kunden»; «Rezeption» aus projekte.py) */
const SIEBEN = [
  { k: 'maison', n: 'Kontrollpanel', z: 'haus', namen: ['Kontrollpanel', 'Kontrollpanel', 'Kontrollpanel', 'Kontrollpanel'] },
  { k: 'bureau', n: 'Website bearbeiten', z: 'welt', namen: ['Website bearbeiten', 'Carlton Control', 'Studio', 'Website bearbeiten', 'Website bearbeiten'] },
  { k: 'carte', n: 'Karten & Preislisten', z: 'karte', namen: ['Karten & Preislisten', 'Karten & Preislisten', 'Karten & Preislisten', 'Karten & Preislisten'] },
  { k: 'reception', n: 'Anfragen & Chat', z: 'chat', namen: ['Anfragen & Chat', 'Anfragen & Chat', 'Anfragen & Chat', 'Anfragen & Chat', 'Rezeption', 'Im Chat'] },
  { k: 'livre', n: 'Markenbuch', z: 'siegel', namen: ['Markenbuch', 'Markenbuch', 'Markenbuch', 'Markenbuch'] },
  { k: 'registre', n: 'Besucher', z: 'balken', namen: ['Besucher', 'Besucher', 'Besucher'] },
  { k: 'imprimerie', n: 'Drucksachen & Feed', z: 'druck', namen: ['Drucksachen & Feed', 'Drucksachen & Feed', 'Drucksachen & Feed', 'Drucksachen & Feed'] }
];
const apo = s => String(s || '').replace(/'/g, '’').trim();
const wzName = w => apo(typeof w === 'string' ? w : (w && w.name) || '');
const NACH_BAUPLAN = h => !/^(saltandsilver|txtme|angelina)$/.test(h.id);   // diese Häuser haben eigene Werkzeuge mit anderen Namen
const WZ_INFO = (() => { const o = {}; (window.MV_KAPITEL || []).forEach(k => (k.teile || []).forEach(b => { if (b.art === 'werkzeug') o[b.k] = b; })); return o; })();
const INTERN = /mail|prüf|geprüft|anleitung|kopieren/i;
/* Familien wie im Atelier der Agentur-Seite (seite/work.html, «Designstudien»), Sätze von dort; Chalet Rustica gehört seit 08.11.2026 zur Familie Zurbriggen */
const FAMILIEN = window.TASTY_FAMILIEN || [];   // Quelle: /werkzeuge/02-kundenliste/familien.js (eine Liste für «Kunden» und Cockpit)
const familieVon = h => FAMILIEN.find(f => f.ids.includes(h.id)) || null;
const SPARTEN = [['hotel', 'Hotellerie.', 'Hotels und Ferienwohnungen'], ['gastro', 'Gastronomie.', 'Restaurants und Bars'], ['weitere', 'Private Chef.', 'Private Chefs und Gastgeberinnen']]   // Reihenfolge und je zuerst Familien, dann einzelne Häuser: Robert 11.11.2026;
const sparte = h => /^(Hotel|Ferienwohnungen)$/.test(h.art || '') ? 'hotel' : /Restaurant|Bar/.test(h.art || '') ? 'gastro' : 'weitere';

/* ---------------------------------------------------------------- Zustand */
const S = { ansicht: 'start', d: null, entwurf: null, server: false, fortAuf: false, filter: 'alle', paratZu: false, schritt: {}, alle: true };   /* Mappe öffnet mit allem untereinander, die Schritte springen hin (Robert 11.11.2026) */
try { S.paratZu = localStorage.getItem('tasty-sc-parat') === 'zu'; } catch (e) { /* privat */ }
try { S.randZu = localStorage.getItem('tasty-sc-rand') === 'zu'; } catch (e) { /* privat */ }   /* Seitenleiste links ein- oder ausgeklappt (Robert 16.11.2026) */
document.documentElement.classList.toggle('sc-rand-zu', !!S.randZu);
/* Hält den sichtbaren Inhalt auf seiner Höhe, während sich die Breite ändert (Safari rückt sonst alles nach oben oder unten) */
function haltHoehe() {
  const h = $('#haupt'); if (!h) return { lauf() {}, ende() {} };
  const hb = h.getBoundingClientRect();
  let a = document.elementFromPoint(Math.min(hb.left + 60, innerWidth - 1), Math.round(innerHeight * .45));
  while (a && a.parentElement && a.parentElement !== h && a.parentElement.getBoundingClientRect().height < innerHeight * .8) a = a.parentElement;
  if (!a || !h.contains(a) || a === h) return { lauf() {}, ende() {} };
  const y0 = a.getBoundingClientRect().top, html = document.documentElement; html.style.overflowAnchor = 'none';
  const zieh = () => { const d = a.getBoundingClientRect().top - y0; if (Math.abs(d) > .5) scrollBy(0, d); };
  let an = true; const lauf = () => { if (!an) return; zieh(); requestAnimationFrame(lauf); };
  return { lauf() { requestAnimationFrame(lauf); }, ende() { an = false; zieh(); html.style.overflowAnchor = ''; } };
}
function randKlapp() {
  /* Seitenleiste (Robert 16.11.2026: «Aufklappen ebenso wie Zuklappen noch sehr hakelig»): eine einzige Bewegung, kein Ausblenden vorher, kein Einblenden danach.
     Die Spalte wird schmal oder breit, die weisse Fläche wird wie ein Vorhang an der rechten und unteren Kante beschnitten, der Inhalt der Leiste
     behält seine Breite (bricht nicht um), der Knopf gleitet mit. Der sichtbare Inhalt rechts bleibt auf seiner Höhe. */
  const r = $('#rand'), kn = $('#rand [data-rand-kn]'), app = document.body; if (!r || r._laeuft) return; r._laeuft = true;
  S.randZu = !S.randZu; try { localStorage.setItem('tasty-sc-rand', S.randZu ? 'zu' : 'auf'); } catch (e) { /* privat */ }
  const an = !S.randZu, html = document.documentElement, setze = v => html.classList.toggle('sc-rand-zu', !v);
  if (kn) kn.setAttribute('aria-expanded', an ? 'true' : 'false');
  if (RUHIG() || !matchMedia('(min-width:901px)').matches) { setze(an); r._laeuft = false; return; }
  const E = 'cubic-bezier(.65,0,.35,1)', D = 720;
  const spalten = () => getComputedStyle(app).gridTemplateColumns;
  const fest = [...r.querySelectorAll(':scope > .sc-rand-kopf, :scope > .sc-rand-inhalt')];
  const mitte = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  const halt = haltHoehe();
  /* Zustand A messen, Zustand B messen, Leiste im offenen Zustand halten (mit fester Innenbreite) und zwischen beiden bewegen */
  const sVor = spalten(), hVor = r.getBoundingClientRect().height, kVor = kn ? mitte(kn) : [0, 0];
  setze(an); const sNach = spalten(), hNach = r.getBoundingClientRect().height, kNach = kn ? mitte(kn) : [0, 0];
  setze(true);
  const hOffen = r.getBoundingClientRect().height;
  if (an) fest.forEach(x => { x.style.width = x.getBoundingClientRect().width + 'px'; });
  else fest.forEach(x => { x.style.width = x.getBoundingClientRect().width + 'px'; });
  const kOffen = kn ? mitte(kn) : [0, 0];
  const zuClip = `inset(0px 0px ${Math.max(0, hOffen - Math.min(hVor, hNach))}px 0px round 32px)`, aufClip = 'inset(0px 0px 0px 0px round 30px)';
  const anims = [app.animate([{ gridTemplateColumns: sVor }, { gridTemplateColumns: sNach }], { duration: D, easing: E, fill: 'forwards' }),
    r.animate([{ clipPath: an ? zuClip : aufClip }, { clipPath: an ? aufClip : zuClip }], { duration: D, easing: E, fill: 'forwards' })];
  if (kn) { const zu = an ? kVor : kNach, d = [zu[0] - kOffen[0], zu[1] - kOffen[1]], t = `translate(${d[0]}px,${d[1]}px)`;
    anims.push(kn.animate([{ transform: an ? t : 'none' }, { transform: an ? 'none' : t }], { duration: D, easing: E, fill: 'forwards' })); }
  if (!an) r.querySelectorAll(':scope > .sc-rand-kopf > .wo-mk, :scope > .sc-rand-inhalt').forEach(x =>   /* Schrift verschwindet, bevor die Kante sie erreicht (Robert 16.11.2026) */
    anims.push(x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.round(D * .26), easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })));
  halt.lauf();
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
    setze(an); fest.forEach(x => { x.style.width = ''; }); anims.forEach(a => a.cancel()); halt.ende(); r._laeuft = false;
  });
}
   /* Seitenblatt ein- oder ausgeklappt: je Gerät gemerkt */
/* Stand und Fortschritt beim Öffnen immer eingeklappt (Robert 11.11.2026) */
const kunden = () => (S.d && S.d.kunden) || [];
/* Paketpreis rechnet sich aus den Preisen der Häuser (Robert 16.11.2026: «wenn ich bei Preise ändern den Preis ändere, müsste sich der Preis im blauen Balken anpassen») */
function paketeRechnen() {
  (window.TASTY_FAMILIEN || []).forEach(f => { const l = f.ids.map(id => kunden().find(h => h.id === id)).filter(h => h && h.preis && h.preis.paket);
    const sum = l.reduce((a, h) => a + (+h.preis.betrag || 0), 0); l.forEach(h => { h.preis.paket.gesamt = sum; h.preis.paket.haeuser = l.length; }); });
}
const offene = () => kunden().filter(offen);
const haus = id => kunden().find(h => h.id === id);
/* Familien-Mappe: die Familie als «Haus» für Leitfaden, Gespräch und Speichern (Robert 16.11.2026: «bei den Familienhäusern genauso ein Gesprächsleitfaden»).
   Gespeichert unter familie-<k> in derselben Gesprächsablage. */
function famMappeHaus(f) {
  if (!f) return null;
  const l = f.ids.map(haus).filter(h => h && offen(h)), h0 = l[0] || {}, fs = familienStart(f);
  return Object.assign({}, h0, { id: 'familie-' + f.k, name: f.t[0].replace(/\.$/, ''), entwurf: fs ? fs[1] : '', kurz: f.s, famK: f.k, haeuser: l, adressen: [], pitch: null,
    ansprechpartner: { name: [...new Set(l.map(h => (h.ansprechpartner || {}).name).filter(x => x && x !== 'Anna Llorens'))].join(' · '), rolle: '', telefon: '', mail: '' } });
}
const aktH = () => /^haus:/.test(S.ansicht || '') ? haus(S.ansicht.slice(5)) : /^familie:/.test(S.ansicht || '') ? famMappeHaus(FAMILIEN.find(f => f.k === S.ansicht.slice(8))) : null;
const gespraech = id => ((S.d && S.d.gespraeche) || {})[id] || null;
const projektVon = h => {
  const n = norm(h.name), l = (S.d && S.d.projekte) || [];
  return l.find(p => norm(p.name) === n) || l.find(p => { const q = norm(p.name); return q.length > 4 && (n.includes(q) || q.includes(n)); }) || null;
};
const projektKey = k => ((S.d && S.d.projekte) || []).find(p => p.key === k) || null;
const online = p => { const o = S.d && S.d.online && S.d.online.projekte; return p && o && p.key in o ? o[p.key] : null; };
/* Adressen je Haus: zuerst die in «Kunden» eingetragenen (adressen: Website, Werkbank, Werkzeuge, Familienseite), dazu die aus projekte.py */
const links = h => { const a = (h.adressen || []).map(x => [x.name, x.url, x.zu || '', x.gruppe]), p = projektVon(h);
  return a.concat((p ? p.links : []).filter(l => !a.some(x => x[1] === l[1]))); };
const werkbank = h => (links(h).find(l => /^Werkbank/.test(l[0])) || [])[1] || '';
const familienseite = h => { const a = links(h).find(l => l[3] === 'Familie'); if (a) return a; const f = familieVon(h), p = f && f.projekt && projektKey(f.projekt); return p && p.url ? ['Gemeinsame Startseite der ' + f.t[0].replace(/\.$/, ''), p.url] : null; };
const familienStart = f => { const h = f.ids.map(haus).find(x => x && familienseite(x)); return h ? familienseite(h) : null; };
const istWerkzeug = l => SIEBEN.some(s => s.namen.includes(apo(l[0])) || l[2] === s.n);
/* Monatspreise aus «Kunden»: 1 = Betreuung der Website (preis.betreuung_website), 2 = Werkzeuge im Abo (preis.abo_werkzeuge).
   Ersetzen seit 11.11.2026 die Pakete «Sie pflegen selbst» / «Wir pflegen für Sie» (Robert: «Ja, ersetzen») */
const paketPreis = (h, n) => { const k = ((W.pakete || [])[n - 1] || {}).k; return (k && ((h && h.preis) || {})[k]) || ''; };
// Preis-Wert: Worte statt Zahl (z. B. «Nennt die Gruppe») duerfen umbrechen, Zahlen bleiben in einer Zeile
const wertB = t => `<b${/\d/.test(t) ? '' : ' class="sc-wort"'}>${esc(t)}</b>`;
const preisText = h => ((h.preis || {}).gross || '').trim() || (h.pitch ? ((h.preis || {}).monatlich || '').replace(/^Betreuung\s*/, '').trim() : '');
const offenesAngebot = h => h.preis && h.preis.betrag && offen(h);
const waehrung = h => (h.preis && (h.preis.waehrung || (/EUR|€/.test(h.preis.gross || '') ? 'EUR' : /CHF/.test(h.preis.gross || '') ? 'CHF' : ''))) || '';
/* Euro-Angebote in Franken umgerechnet (Robert 13.11.2026: «rechne die unter Schweizer Wechselkursen in CHF um und mit ein»).
   Kurs: Schweizerische Nationalbank, Devisenkurs EUR Monatsmittel Oktober 2026 (data.snb.ch, devkum, veröffentlicht 02.11.2026) */
const EUR_CHF = 0.92841;
const inChf = h => Math.round(((waehrung(h) || 'CHF') === 'EUR' ? EUR_CHF : 1) * h.preis.betrag);
const summe = l => l.length ? ['CHF ' + zahl(l.reduce((a, h) => a + inChf(h), 0))] : [];
/* Monatsbeträge in Franken, Euro zum selben Kurs (Korrektur 15.11.2026: Bareiss, Uncle Hung, Salt & Silver fehlten in der Monatsrechnung) */
const monChf = t => { const s = String(t || ''), v = betrag(s); return /CHF/.test(s) ? v : /€|EUR/.test(s) ? Math.round(v * EUR_CHF) : 0; };
/* Gültige Bedingungen aus Angebot.md (Abschnitt Designstudien): Zahlung und Dauer bis online, eine Quelle */
const bedingung = re => ((S.d.preise || {}).schweiz || []).filter(z => re.test(z)).map(z => ohneZitat(z).replace(/^[^:]{2,40}:\s*/, ''));
const zahlungListe = () => bedingung(/^(Zahlung|Betreuung und Werkzeuge laufen)/);
const dauerText = () => bedingung(/^Bis online/)[0] || W.ablaufFuss;
/* Werkzeuge eines Hauses nach Bauplan: je der sieben der Name im Haus (oder der Name im Bauplan) und die Adresse zum Ausprobieren */
const VORFUEHR = h => projektKey(/Restaurant|Bar/.test(h.art || '') ? 'taverne-zum-schaefli' : 'grand-beau-rivage');
function siebenFuer(h) {
  const eig = (h.werkzeuge || []).map(wzName), bau = NACH_BAUPLAN(h);
  const lk = links(h), vf = VORFUEHR(h), vfl = vf ? vf.links : [];
  return SIEBEN.map(s => {
    const im = bau ? eig.find(w => s.namen.includes(w)) : '';
    const eigen = lk.find(l => s.namen.includes(apo(l[0])) || l[2] === s.n);
    const demo = vfl.find(l => s.namen.includes(apo(l[0])));
    const SC = (S.d && S.d.schirme) || {}, sc = (SC[h.id] || {})[s.k];   // eigener Bildschirm des Hauses (schirme.json, Robert 11.11.2026)
    const vsc = !sc && !eigen && demo ? (SC[vf && vf.key === 'taverne-zum-schaefli' ? 'schaefli' : 'beau-rivage'] || {})[s.k] : null;   // Beispiel: Bildschirm des Vorführhauses, nicht Culinarium
    return { s, info: WZ_INFO[s.k] || { t: [s.n, ''], lead: '', f: [] }, name: im || s.n, gebaut: !!im || !!sc, bild: sc ? sc.bild : '', bildBsp: vsc ? vsc.bild : '',
      url: sc ? sc.url : eigen ? eigen[1] : demo ? demo[1] : '', amBeispiel: sc || eigen ? '' : demo ? vf.name : '' };
  });
}
const eigeneWerkzeuge = h => (h.werkzeuge || []).map(wzName).filter(w => !NACH_BAUPLAN(h) || !SIEBEN.some(s => s.namen.includes(w)));

/* ---------------------------------------------------------------- Grundgerüst */
const ANSICHT_NAME = { start: 'Offene Häuser', konditionen: 'Konditionen', antworten: 'Antworten', partnerschaft: 'Unser Start', kooperationen: 'Kooperationen', weiter: 'Wie es weitergeht' };
const famVon = k => FAMILIEN.find(f => f.k === k && f.ids.some(id => haus(id) && offen(haus(id))));
const gueltig = a => !!ANSICHT_NAME[a] || (/^familie:/.test(a || '') && !!famVon(a.slice(8))) || (/^haus:/.test(a || '') && !!haus(a.slice(5)) && offen(haus(a.slice(5))));
const ansichtName = a => /^haus:/.test(a) ? haus(a.slice(5)).name : /^familie:/.test(a) ? famVon(a.slice(8)).t[0].replace(/\.$/, '') : ANSICHT_NAME[a];
const themenVon = h => (h && h.pitch && h.pitch.themen) || W.themen || [];   // Häuser ohne Website-Auftrag (mappe: werkzeuge) haben eigene Gesprächspunkte
const besprochen = id => { const g = gespraech(id); return g && g.stand ? (g.stand.abgedeckt || []).length : 0; };
function kopf() {
  const o = offene().length;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: ORDNER, unter: 'Akquise', titel: ansichtName(S.ansicht) || NAME, stand: `${mz(o, 'Haus', 'Häuser')} offen`, website: WEBSITE, marke: 'data-gehe="start"', markeHref: '#start' });
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
}
function rand() {
  const e = (key, text, z = '') => ({ text, zahl: z, an: S.ansicht === key, attr: `data-gehe="${key}"` });
  const eintrag = h => e('haus:' + h.id, h.name, besprochen(h.id) ? besprochen(h.id) + '/' + themenVon(h).length : '');
  const gruppen = [];
  SPARTEN.forEach(([sp, titel]) => {
    const alleE = offene().filter(h => sparte(h) === sp && !familieVon(h)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const einzeln = alleE.filter(h => !h.pitch), nurWz = alleE.filter(h => h.pitch);
    const famDa = FAMILIEN.some(f => f.sparte === sp && f.ids.some(id => haus(id) && offen(haus(id))));
    if (famDa) gruppen.push({ titel: titel.replace(/\.$/, ''), eintraege: [] });   // Sparte als Überschrift, darunter Familien, dann einzelne Häuser
    FAMILIEN.filter(f => f.sparte === sp).forEach(f => { const l = f.ids.map(haus).filter(h => h && offen(h)); if (l.length) gruppen.push({ titel: f.t[0].replace(/\.$/, ''), eintraege: [e('familie:' + f.k, 'Alle Häuser im Überblick'), ...l.map(eintrag)] }); });
    if (einzeln.length) gruppen.push({ titel: famDa ? 'Einzelne Häuser' : titel.replace(/\.$/, ''), eintraege: einzeln.map(eintrag) });
    if (nurWz.length) gruppen.push({ titel: 'Nur Werkzeuge', eintraege: nurWz.map(eintrag) });
  });
  $('#rand').innerHTML = WO.rand([{ titel: 'Anna und Robert', eintraege: [e('partnerschaft', 'Unser Start', offeneFragen() ? zahl(offeneFragen()) : '')] }, { eintraege: [e('start', 'Offene Häuser', zahl(offene().length))] }, ...gruppen,
    { titel: 'Für jedes Gespräch', eintraege: [e('konditionen', 'Konditionen'), e('antworten', 'Antworten'), e('weiter', 'Wie es weitergeht')] },
    { titel: 'Netzwerk', eintraege: [e('kooperationen', 'Kooperationen', zahl(KOOP.length))] }], { website: WEBSITE });
  $('#rand .wo-rand__wege').insertAdjacentHTML('afterbegin', `<a href="${(H.wege && H.wege.zentrale) || '/zentrale/'}">${esc(WO.name('zentrale'))}${WO.ic('haus')}</a><a href="${KUNDEN_WZ}">${esc((H.namen && H.namen['02-kundenliste']) || 'Kunden')}${WO.ic('pfeil')}</a>`);
  $$('#rand .wo-rand__g').forEach(g => { if (!g.querySelector('li')) g.classList.add('sc-rand-sparte'); });
  {   /* Kopfzeile mit dem Knopf über dem rollenden Teil: der Knopf überdeckt nie einen Eintrag (Robert 16.11.2026: «der Kreis soll niemals da schneiden») */
    const rd = $('#rand'), inhalt = document.createElement('div'), kopf = document.createElement('div');
    inhalt.className = 'sc-rand-inhalt'; kopf.className = 'sc-rand-kopf';
    while (rd.firstChild) inhalt.appendChild(rd.firstChild);
    const erste = inhalt.querySelector('.wo-rand__g > .wo-mk'); if (erste) kopf.appendChild(erste);
    kopf.insertAdjacentHTML('beforeend', `<button type="button" class="sc-rand-kn" data-rand-kn aria-expanded="${S.randZu ? 'false' : 'true'}" aria-label="Seitenleiste ein- oder ausklappen" title="Seitenleiste ein- oder ausklappen"><i>${WO.ic('links')}</i><i>${WO.ic('menue')}</i></button>`);
    rd.append(kopf, inhalt);
  }
  $('#rand [data-rand-kn]').onclick = randKlapp;
  $$('#rand .wo-re, #rand .wo-zw, #rand h2, #rand h3').forEach(x => x.setAttribute('data-wo-bw-nie', ''));
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  /* die Leiste rollt in sich (rand-Höhe = Fenster); der gewählte Eintrag steht im Bild */
  const an = $('#rand [aria-current="page"], #rand .wo-an, #rand .an'); if (an && an.scrollIntoView) { const r = $('#rand .sc-rand-inhalt') || $('#rand'); const b = an.getBoundingClientRect(), rb = r.getBoundingClientRect(); if (b.top < rb.top || b.bottom > rb.bottom) r.scrollTop += b.top - rb.top - rb.height / 3; }
}
function leiste() {
  const h = aktH();
  let titel, satz, kn;
  if (h) {
    const dirty = !!(S.entwurf && S.entwurf.id === h.id && S.entwurf.geaendert);
    titel = dirty ? 'Gespräch nicht gespeichert' : `${h.name} · ${besprochen(h.id)} von ${themenVon(h).length} besprochen`;
    satz = S.server ? (dirty ? 'Du hast im Gespräch etwas eingetragen. Speichern, damit es bleibt.' : 'Was du im Gespräch erfährst, trägst du ganz unten unter «Das Gespräch» ein.') : 'Online lässt sich nichts speichern.';
    kn = WO.knopf('Zum Gespräch', 'stift', 'glas', { klein: true, attr: 'data-sprung-zu="gespraech"' }) + WO.knopf('Speichern', 'haken', dirty ? 'gold' : 'glas', { klein: true, attr: 'data-speichern', disabled: !dirty || !S.server });
  } else if (S.ansicht === 'partnerschaft') {
    const o = offeneFragen();
    titel = 'Unser Start · ' + (o === 1 ? 'eine offene Frage' : o ? o + ' offene Fragen' : 'keine offene Frage');
    satz = 'Fragen und Ergänzungen zum Vertrag und zum Ablauf trägst du ganz unten ein.';
    kn = WO.knopf('Vertrag', 'auge', 'glas', { klein: true, attr: 'data-sprung-zu="vertrag"' }) + WO.knopf('Frage eintragen', 'stift', 'gold', { klein: true, attr: 'data-sprung-zu="fragen"' });
  } else if (S.ansicht === 'weiter') {
    titel = 'Wie es weitergeht';
    satz = 'Korrekturen, Betreuung im Monat, Wartung und der Takt der Prüfungen.';
    kn = WO.knopf('Prüfungen', 'rechts', 'gold', { klein: true, attr: 'data-sprung-zu="takt"' }) + WO.knopf('Offene Häuser', 'links', 'glas', { klein: true, attr: 'data-gehe="start"' });
  } else if (S.ansicht === 'kooperationen') {
    titel = 'Kooperationen · ' + KOOP.length + ' Arten von Partnern';
    satz = 'Wer rund um die Gastronomie Türen öffnen könnte, was er davon hat und wen wir zuerst ansprechen.';
    kn = WO.knopf('Womit wir anfangen', 'rechts', 'gold', { klein: true, attr: 'data-sprung-zu="koop-anfang"' }) + WO.knopf('Offene Häuser', 'links', 'glas', { klein: true, attr: 'data-gehe="start"' });
  } else {
    titel = 'Für das Akquise-Gespräch'; satz = 'Hier stehen nur Häuser ohne Vertrag. Ein Klick auf ein Haus öffnet seine Mappe für das Gespräch.';
    kn = WO.knopf('Antworten', 'chat', 'glas', { klein: true, attr: 'data-gehe="antworten"' }) + WO.knopf('Konditionen', 'balken', 'gold', { klein: true, attr: 'data-gehe="konditionen"' });
  }
  const lz = $('#leiste'); lz.hidden = !h; document.documentElement.classList.toggle('sc-ohne-leiste', !h);
  lz.innerHTML = h ? WO.leiste({ titel, satz, knoepfe: kn }) : '';
  $$('#leiste [data-gehe]').forEach(x => x.onclick = () => gehe(x.dataset.gehe));
  $$('#leiste [data-sprung-zu]').forEach(x => x.onclick = () => springe(x.dataset.sprungZu));
  $$('#leiste [data-speichern]').forEach(x => x.onclick = speichern);
}
function springe(id) {
  const z = document.getElementById(id); if (!z) return;
  const teil = z.closest('[data-teil]'), h = aktH();
  if (teil && h && !S.alle && !teil.classList.contains('an')) return schrittZeigen(h, teil.dataset.teil, true);
  z.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'start' });
}
function schrittZeigen(h, k, nachOben) {
  S.schritt = S.schritt || {}; S.schritt[h.id] = k;
  $$('#ansicht [data-teil]').forEach(t => t.classList.toggle('an', t.dataset.teil === k));
  $$('#ansicht .sc-schritt').forEach(b => b.classList.toggle('an', b.dataset.schritt === k));
  const ziel = S.alle ? $(`#ansicht [data-teil="${k}"]`) : $('#ansicht .sc-schritte');
  if (ziel && nachOben) { const y = ziel.getBoundingClientRect().top + scrollY - 96; scrollTo({ top: Math.max(0, y), behavior: RUHIG() ? 'auto' : 'smooth' }); }
}
function gehe(a, oben = true) {
  if (!gueltig(a)) a = 'start';
  if (S.entwurf && S.entwurf.geaendert && a !== S.ansicht && !confirm('Das Gespräch mit ' + (haus(S.entwurf.id) || {}).name + ' ist nicht gespeichert. Trotzdem wechseln?')) return;
  S.ansicht = a; S.entwurf = null; S.mbAuf = {}; S.preisEdit = null;   // beim Wechsel in einen anderen Bereich alles wieder zu (Robert 16.11.2026)
  try { localStorage.setItem('tasty-sc-ansicht', a); } catch (e) { /* privat */ }
  history.replaceState(null, '', location.pathname + location.search + '#' + a);
  kopf(); rand(); leiste(); zeichne();
  if (oben) scrollTo({ top: 0 });
}
function zeichne() {
  const el = $('#ansicht'), a = S.ansicht;
  el.innerHTML = a === 'start' ? start() : a === 'konditionen' ? konditionen() : a === 'antworten' ? antworten() : a === 'partnerschaft' ? unserStart() : a === 'kooperationen' ? kooperationen() : a === 'weiter' ? wieWeiter() : /^familie:/.test(a) ? familieAnsicht(famVon(a.slice(8))) : mappe(haus(a.slice(5)));
  if (a === 'partnerschaft') bindeStart();
  if (a === 'start' || /^familie:/.test(a)) schwebeLaptops();
  $$('#ansicht [data-gehe]').forEach(b => b.onclick = e => { e.preventDefault(); gehe(b.dataset.gehe); });
  $$('#ansicht [data-sprung]').forEach(b => b.onclick = e => { e.preventDefault(); springe(b.dataset.sprung); });
  $$('#ansicht [data-preis-aendern]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); S.preisEdit = b.dataset.preisAendern; preisNeu(S.preisEdit);
    const i = $(`#ansicht [data-preis-form="${S.preisEdit}"] input`); if (i) { i.focus(); i.select(); } });
  $$('#ansicht [data-preis-form]').forEach(f => { f.onsubmit = e => { e.preventDefault(); preisSpeichern(f); };
    f.onclick = e => e.stopPropagation(); const ab = $('[data-preis-ab]', f); if (ab) ab.onclick = () => { const id = S.preisEdit; S.preisEdit = null; preisNeu(id); }; });
  /* der geklickte Knopf bleibt beim Auf- und Zuklappen an seiner Stelle, die Seite springt nicht (Robert 11.11.2026) */
  const halte = (b, tu) => { const y = b.getBoundingClientRect().top; tu(); const d = b.getBoundingClientRect().top - y; if (Math.abs(d) > 1) scrollBy(0, d); };
  /* aufgeklappt fliegt der Laptop nach oben, die Schrift rückt darunter (Robert 12.11.2026); nur transform, ein Takt */
  const flieg = (b, tu) => { const z = b.closest('.sc-zeile'), t = z ? [$('.sc-zeile__bild', z), $('.sc-zeile__text', z)].filter(Boolean) : [];
    const vor = t.map(e => e.getBoundingClientRect()); tu();
    if (!z || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    t.forEach((e, n) => { const r = e.getBoundingClientRect(), v = vor[n]; if (!r.width) return;
      const dx = v.left - r.left, dy = v.top - r.top, sk = v.width / r.width;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sk - 1) < .01) return;
      e.style.transformOrigin = '0 0';
      e.animate([{ transform: `translate(${dx}px,${dy}px) scale(${n ? 1 : sk})` }, { transform: 'none' }], { duration: 760, easing: 'cubic-bezier(.19,1,.22,1)' }); }); };
  $$('#ansicht [data-fort-auf]').forEach(b => b.onclick = () => {   // auf- und zuklappen, nur dieses Haus (Robert 11.11.2026), ruhig wie eine Schublade (16.11.2026)
    const k = b.closest('.sc-karte, .sc-zeile'); if (!k || k._laeuft) return;
    const reihe = k.classList.contains('sc-karte') && k.closest('.sc-karten') ? $$('.sc-karte', k.closest('.sc-karten')) : [k];   // Familie: die ganze Reihe gemeinsam (Robert 11.11.2026)
    const an = !k.classList.contains('auf');
    const setze = v => reihe.forEach(x => { x.classList.toggle('auf', v); const kn = $('[data-fort-auf]', x); if (kn) kn.setAttribute('aria-expanded', v ? 'true' : 'false'); });
    k._laeuft = true;
    hausKlapp(reihe, k.closest('.sc-karten') || k, an, () => { flieg(b, () => halte(b, () => setze(an))); if (an) zeigeGanz(k.closest('.sc-karten') || k); }, () => {
      if (an) reihe.forEach(x => x.dispatchEvent(new CustomEvent('sc-auf', { bubbles: true })));
      if (an) zeigeGanz(k.closest('.sc-karten') || k, true);
      k._laeuft = false;
    });
  });
  bindeThemen($('#ansicht'));
  document.querySelectorAll('#ansicht details.sc-mb > summary').forEach(sm => sm.addEventListener('click', e => mbKlappen(sm.parentElement, e)));
  $$('#ansicht [data-ann-auf]').forEach(b => b.onclick = () => {   // Aufschlüsselung unter der Zahlenzeile auf- und zuklappen
    const t = $('#sc-ann2'), lage = b.closest('.sc-lage'); if (!t || t._laeuft) return; t._laeuft = true;
    S.annAuf = !S.annAuf; const an = S.annAuf;
    const setze = v => { t.hidden = !v; lage.classList.toggle('auf', v); };
    schublade({ an, mit: unterDem(t), huelle: t, kante: () => t.getBoundingClientRect().top,
      setze, umschalt: () => setze(an), fertig: () => { t._laeuft = false; } });
    b.setAttribute('aria-expanded', an ? 'true' : 'false');
  });
  $$('#ansicht [data-filter]').forEach(b => b.onclick = () => {   // Filter oben: alle Häuser oder nur die, bei denen noch etwas unter 100 % steht
    if (S.filter === b.dataset.filter) return;
    const y = b.getBoundingClientRect().top; S.filter = b.dataset.filter; zeichne();
    const n = $('#ansicht [data-filter="' + S.filter + '"]'); if (n) { const d = n.getBoundingClientRect().top - y; if (Math.abs(d) > 1) scrollBy(0, d); }
  });
  const mp = $('#ansicht .sc-mappe2'); if (mp) mp.classList.toggle('sc-parat-zu', S.paratZu);
  $$('#ansicht [data-parat-auf]').forEach(b => b.onclick = () => {   // Seitenblatt «Parat im Gespräch» ein- und ausklappen (Robert 11.11.2026), seitlich wie das Missionboard (16.11.2026)
    const m2 = $('#ansicht .sc-mappe2'), pa = b.closest('.sc-parat'); if (!m2 || m2._laeuft) return; m2._laeuft = true;
    S.paratZu = !S.paratZu;
    const breit = matchMedia('(min-width:1101px)').matches;
    const setze = v => m2.classList.toggle('sc-parat-zu', !v);
    const teile = () => [b.querySelector('.wo-mk'), ...pa.querySelectorAll('.sc-parat__inhalt > *, .sc-parat__inhalt dl > div')].filter(x => x && x.getBoundingClientRect().height > 0 && !x.matches('.sc-parat__inhalt > dl'));
    if (breit) seitKlapp({ el: pa, an: !S.paratZu, setze, teile, von: 1, fertig: () => { m2._laeuft = false; } });
    else schublade({ an: !S.paratZu, mit: [...unterDem(pa)], teile, kante: () => b.getBoundingClientRect().bottom, setze, umschalt: () => setze(!S.paratZu), fertig: () => { m2._laeuft = false; } });
    b.setAttribute('aria-expanded', S.paratZu ? 'false' : 'true');
    try { localStorage.setItem('tasty-sc-parat', S.paratZu ? 'zu' : 'auf'); } catch (e) { /* privat */ }
  });
  const hS = aktH();
  $$('#ansicht [data-schritt]').forEach(b => b.onclick = () => { if (!hS) return; schrittZeigen(hS, b.dataset.schritt, true); });
  $$('#ansicht [data-schritt-alle]').forEach(b => b.onclick = () => { S.alle = !S.alle; const m3 = $('#ansicht .sc-mappe2'); if (m3) m3.classList.toggle('sc-alle', S.alle); b.textContent = S.alle ? 'Schritt für Schritt' : 'Alles zeigen'; });
  $$('#ansicht [data-abhaken]').forEach(b => b.onclick = () => {
    const f = $('#sc-form'), c = f && $(`input[name="abgedeckt"][value="${b.dataset.abhaken}"]`, f); if (!c) return;
    c.checked = !c.checked; f.dispatchEvent(new Event('input', { bubbles: true })); speichern();
  });
  $$('#ansicht [data-woche]').forEach(b => b.onclick = () => {   // Ablauf: Woche wählen, darunter steht, wer was macht
    const a = b.closest('.sc-ablauf'); if (!a) return;
    $$('[data-woche]', a).forEach(x => x.classList.toggle('an', x === b));
    $$('[data-woche-teil]', a).forEach(x => x.classList.toggle('an', x.dataset.wocheTeil === b.dataset.woche));
  });
  $$('#ansicht [data-fam-auf]').forEach(b => b.onclick = () => halte(b, () => {   // gemeinsame Startseite: eigener Schalter, nur dieser Überblick
    const w = b.closest('.sc-famstand'), an = !w.classList.contains('auf'); w.classList.toggle('auf', an); b.setAttribute('aria-expanded', an ? 'true' : 'false');
  }));
  $$('#ansicht [data-pruef]').forEach(b => {
    const auf = e => { if (e.target.closest('a')) return; e.preventDefault(); const [id, teil] = b.dataset.pruef.split(':'); pruefFenster(/^familie-/.test(id) ? famHaus(FAMILIEN.find(f => 'familie-' + f.k === id)) : haus(id), teil); };
    b.onclick = auf; b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') auf(e); };
  });
  werkzeugLeben(el);
  if (/^(haus|familie):/.test(a)) { const hz = aktH(); if (hz) { gespraechLeben(el, hz); memoLeben(el, hz); }; if (hz) $$('[data-teil]', el).forEach(t => t.classList.toggle('an', t.dataset.teil === schrittVon(hz))); }
  auftritte(el);
}

/* Auftritte wie Marke & Vision: federnd aus 40 px, nur transform, deckend ab dem ersten Bild */
let IO = null;
const RUHIG = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function auftritte(r) {
  const alle = $$('[data-r]', r);
  if (IO) IO.disconnect();
  if (RUHIG()) { alle.forEach(x => x.classList.add('da', 'steht')); return; }
  const H0 = innerHeight; let n = 0;
  IO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { IO.unobserve(e.target); e.target.classList.add('da'); } }), { rootMargin: '0px 0px -2% 0px' }) : null;
  alle.forEach(x => {
    const b = x.getBoundingClientRect();
    if (b.top < H0 && b.bottom > 0 && n < 20) { x.style.setProperty('--i', Math.min(n++, 6)); requestAnimationFrame(() => requestAnimationFrame(() => x.classList.add('da'))); }
    else if (IO) IO.observe(x); else x.classList.add('da', 'steht');
  });
}

/* ---------------------------------------------------------------- Bausteine */
/* Laptop-Bilder in der kleinen Fassung (900 px statt 2160 px): gezeigt werden sie nur ein paar hundert Pixel breit, das spart das Entpacken beim Scrollen (Robert 11.11.2026 «hakelig») */
const klein = u => /(\/schirm-[^/]+|\/schirme\/[^/]+)\.webp$/.test(u || '') && !/-900\.webp$/.test(u) ? u.replace(/\.webp$/, '-900.webp') : u;
const tipp = () => `<span class="sc-live__tipp"><span>Live ansehen</span><i>${WO.ic('auge')}</i></span>`;
function geraet(src, alt, klasse = '', href = '', live = '') {
  src = klein(src);
  const schirm = src ? `<img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" decoding="async">` : `<b>${esc(alt || '')}</b>`;
  const innen = `<span class="sc-geraet__schirm">${schirm}${live ? tipp() : ''}</span><img class="sc-geraet__haus" src="${LAPTOP}" alt="" decoding="async">`;
  if (live) return `<span class="sc-geraet ${klasse}" data-live="${esc(live)}" aria-label="${esc(alt || '')} live ansehen">${innen}</span>`;
  return href ? `<a class="sc-geraet ${klasse}" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(alt || '')} öffnen">${innen}</a>` : `<span class="sc-geraet ${klasse}">${innen}</span>`;
}
/* Ein Klick auf den Bildschirm lädt dort die echte Seite in 1440 px, verkleinert auf genau dieses Rechteck; das Foto bleibt stehen, bis sie steht.
   Nur mit Maus (wie die Werkbank); am Handy führt der Tipp wie bisher weiter. Immer nur ein Bildschirm lebt, die anderen schlafen (Flüssigkeit). */
const FEIN = matchMedia('(hover:hover) and (pointer:fine)').matches, LIVE_B = 1440;
let LIVE_RO = null;
function liveMass(g) { const s = $('.sc-geraet__schirm', g), f = $('.sc-live', g); if (!s || !f) return; const k = s.clientWidth / LIVE_B; f.style.height = (s.clientHeight / k).toFixed(1) + 'px'; f.style.transform = 'scale(' + k.toFixed(5) + ')'; }
function liveAus(g) { const f = $('.sc-live', g), z = $('.sc-live__zu', g); if (f) f.remove(); if (z) z.remove(); g.classList.remove('live', 'laedt'); }
function liveAn(g) {
  const u = g.dataset.live; if (!u || g.classList.contains('live')) return;
  $$('.sc-geraet.live').forEach(x => { if (x !== g) liveZu(x); });
  const s = $('.sc-geraet__schirm', g), f = document.createElement('iframe');
  f.className = 'sc-live'; f.setAttribute('aria-label', g.getAttribute('aria-label') || 'Seite'); f.loading = 'eager';   /* kein title: Safari zeigt ihn sonst als grauen Hinweis */
  f.onload = () => setTimeout(() => { f.classList.add('da'); g.classList.remove('laedt'); }, 600);
  g.classList.add('live', 'laedt'); s.appendChild(f); f.src = u; liveMass(g);
  const z = document.createElement('button'); z.type = 'button'; z.className = 'sc-live__zu'; z.setAttribute('aria-label', 'Bildschirm schliessen'); z.innerHTML = `<span>Beenden</span><i>${WO.ic('plus')}</i>`;
  z.onclick = e => { e.preventDefault(); e.stopPropagation(); liveZu(g); }; if (!g.closest('.sc-vorne')) g.appendChild(z);
  if ('ResizeObserver' in window) { if (!LIVE_RO) LIVE_RO = new ResizeObserver(es => es.forEach(e => liveMass(e.target))); LIVE_RO.observe(g); }
}
/* Laptop nach vorne (Robert 12.11.2026: «dass er nach vorne schwebt, der Bildschirm wird dunkel im Hintergrund, dass man halt in den Bildschirm drin scrollt»).
   Ein Klick in einen kleinen Bildschirm: der Laptop löst sich aus der Seite und schwebt gross in die Mitte, dahinter wird alles dunkel, die Seite steht still,
   gescrollt wird nur im Bildschirm. «Beenden» steht unter dem Laptop; Esc oder ein Klick ins Dunkle führen ebenso zurück. Bewegung nur transform/opacity. */
/* Im grossen Bildschirm die Fassung von diesem Mac zeigen, wenn sie läuft (Robert 12.11.2026: «die Bilder im Bildschirm selber laden nach»):
   die Seiten im Netz laden ihre Bilder erst beim Scrollen, die vom Mac sind sofort da. Läuft der Mac-Server nicht, bleibt es bei der Adresse im Netz. */
const LOKAL_FEST = [['https://doldenhorn.tastystudios.ch/', 'http://localhost:8916/'], ['https://ruedihus.tastystudios.ch/', 'http://localhost:8917/'],
  ['https://berghotel-gasterntal-entwurf.vercel.app/', 'http://localhost:8918/'], ['https://schloessli.tastystudios.ch/', 'http://localhost:8978/haus/Wirtschaft%20am%20Schl%C3%B6ssli%20Bottighofen/website/'], ['https://maeder.tastystudios.ch/', 'http://localhost:8978/haus/Familie%20Maeder%20%E2%80%94%20Landingpage/'],
  ['https://schaefli.tastystudios.ch/', 'http://localhost:8953/'], ['https://carlton.tastystudios.ch/', 'http://localhost:8912/'],
  ['https://grand-beau-rivage-entwurf.vercel.app/', 'http://localhost:8940/'], ['https://salt-and-silver-studie.vercel.app/', 'http://localhost:8866/'],
  ['https://tastystudios.vercel.app/einblick/monte-moro/', 'https://tastyrob123.github.io/monte-moro-entwurf/'],
  ['https://tastystudios.vercel.app/einblick/zermatt/', 'http://localhost:8978/haus/Zurbriggen%20Suitenhotel%20Zermatt/website/'],
  ['https://tastystudios.vercel.app/einblick/wellness/', 'https://tastyrob123.github.io/wellness-zurbriggen-entwurf/']];   // Werkzeug-Server mit Rahmen-Verbot: Durchgang in rahmen.py
function lokalVon(u) {
  const l = ((S.d && S.d.projekte) || []).filter(p => p.url && p.lokal && p.lokal !== 8978).map(p => [p.url, 'http://localhost:' + p.lokal + '/']);
  l.unshift(...LOKAL_FEST);   // die festen Mac-Fassungen zuerst: auf manchem alten Port läuft inzwischen eine andere Seite (Robert 14.11.2026)
  const t = l.find(([netz]) => u.startsWith(netz)); return t ? t[1] + u.slice(t[0].length) : '';
}
/* Die Weiche im Cockpit-Server (rahmen.py) sagt, welche Adresse sich im Bildschirm zeigen lässt: Mac-Fassung, Netz oder ein Durchgang ohne Rahmen-Verbot */
const rahmenFuer = u => fetch(API + 'rahmen?u=' + encodeURIComponent(u) + '&l=' + encodeURIComponent(lokalVon(u)), { cache: 'no-store' }).then(r => r.json()).then(d => d.url || null).catch(() => null);
function vorneAn(g) {
  $$('.sc-geraet.live').forEach(liveZu);
  const vor = g.getBoundingClientRect(), ratio = vor.height / vor.width;
  const w = Math.min(innerWidth * .66, 1080, (innerHeight - 190) / ratio), h = w * ratio;
  const o = document.createElement('div'); o.className = 'sc-vorne';
  o.innerHTML = `<div class="sc-vorne__dunkel"></div><div class="sc-vorne__platz"></div><div class="sc-vorne__knoepfe"><button type="button" class="sc-vorne__gross"><span>Vergrössern</span><i>${WO.ic('suche')}</i></button><button type="button" class="sc-vorne__zu"><span>Beenden</span><i>${WO.ic('plus')}</i></button></div>`;
  const k = g.cloneNode(true); k.classList.remove('sc-schweb', 'sc-schweb--da', 'live', 'laedt'); $$('.sc-live, .sc-live__zu, .sc-live__tipp', k).forEach(x => x.remove());
  k.removeAttribute('style'); k._quelle = g; k.style.width = w + 'px';
  $('.sc-vorne__platz', o).appendChild(k); document.body.appendChild(o);
  document.documentElement.classList.add('sc-vorne-an'); g.classList.add('sc-ist-vorne');
  const r = k.getBoundingClientRect();
  if (!RUHIG()) {
    k.style.transformOrigin = '0 0';
    k.animate([{ transform: `translate(${vor.left - r.left}px,${vor.top - r.top}px) scale(${vor.width / r.width})` }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.19,1,.22,1)' });
  }
  requestAnimationFrame(() => o.classList.add('da'));
  const zu = () => liveZu(k);
  $('.sc-vorne__zu', o).onclick = e => { e.preventDefault(); e.stopPropagation(); zu(); };
  $('.sc-vorne__dunkel', o).onclick = zu;
  /* Vergrössern (Robert 14.11.2026: «live ansehen … in den Bildschirm selber scrollen … nochmal die Möglichkeit haben, das zu vergrössern»):
     der Bildschirm wächst, bis er das ganze Fenster füllt, die Seite darin läuft weiter, wo sie war (nur transform, kein Neuladen) */
  const gb = $('.sc-vorne__gross', o);
  gb.onclick = e => { e.preventDefault(); e.stopPropagation();
    const an = !o.classList.contains('gross');
    if (an) { k.style.transform = ''; const s = $('.sc-geraet__schirm', k).getBoundingClientRect(), kr = k.getBoundingClientRect();
      const f = Math.min(innerWidth / s.width, innerHeight / s.height);
      const dx = innerWidth / 2 - (s.left + s.width / 2), dy = innerHeight / 2 - (s.top + s.height / 2);
      k.style.transformOrigin = `${s.left + s.width / 2 - kr.left}px ${s.top + s.height / 2 - kr.top}px`;
      k.style.transform = `translate(${dx}px,${dy}px) scale(${f})`;
    } else k.style.transform = '';
    o.classList.toggle('gross', an); $('span', gb).textContent = an ? 'Verkleinern' : 'Vergrössern'; };
  /* Mausrad: im Bildschirm scrollt die Seite darin; neben dem Laptop fliegt er zurück und die Mappe scrollt gleich weiter (Robert 12.11.2026) */
  o.addEventListener('wheel', e => {
    if (e.target.closest('.sc-geraet') || e.target.closest('.sc-vorne__knoepfe') || o.classList.contains('gross')) { if (!e.target.closest('.sc-geraet__schirm')) e.preventDefault(); return; }
    e.preventDefault(); document.documentElement.classList.remove('sc-vorne-an'); liveZu(k); scrollBy(0, e.deltaY);
  }, { passive: false });
  /* die echte Seite lädt erst, wenn der Laptop angekommen ist: der Flug bleibt flüssig, bis dahin steht das Foto im Bildschirm */
  const netz = g.dataset.live;
  Promise.all([rahmenFuer(netz), new Promise(r => setTimeout(r, RUHIG() ? 0 : 820))]).then(([u]) => {
    if (!o.isConnected || o.classList.contains('geht')) return;
    if (!u) {   // lässt sich nicht einbetten: das Foto bleibt stehen, darunter der Weg ins eigene Fenster, nie ein schwarzer Bildschirm
      const hw = document.createElement('p'); hw.className = 'sc-vorne__hinweis';
      hw.innerHTML = `Diese Seite lässt sich hier nicht live zeigen. <a href="${esc(netz)}" target="_blank" rel="noopener">Im eigenen Fenster öffnen</a>`;
      o.appendChild(hw); requestAnimationFrame(() => hw.classList.add('da')); return;
    }
    k.dataset.live = u; liveAn(k);
  });
}
function liveZu(g) {
  liveAus(g);
  const q = g._quelle, o = g.closest('.sc-vorne'); if (!q || !o || o.classList.contains('geht')) return;
  o.classList.add('geht'); o.classList.remove('da');
  const weg = () => { o.remove(); q.classList.remove('sc-ist-vorne'); if (!$('.sc-vorne')) document.documentElement.classList.remove('sc-vorne-an'); };
  if (RUHIG()) { weg(); return; }
  /* zurück an den Platz, der Platz wird jedes Bild neu gemessen: scrollt die Mappe dabei weiter, landet der Laptop trotzdem genau in seiner Karte */
  /* rb = wo der Laptop gerade zu sehen ist (auch vergrössert), r = sein Platz ohne Verschiebung */
  const rb = g.getBoundingClientRect(); g.style.transition = 'none'; g.style.transform = ''; g.style.transformOrigin = '0 0';
  const r = g.getBoundingClientRect(), t0 = performance.now(), dauer = 640;
  g.style.transform = `translate(${rb.left - r.left}px,${rb.top - r.top}px) scale(${rb.width / r.width})`;
  const schritt = jetzt => { const p = Math.min(1, (jetzt - t0) / dauer), e = 1 - Math.pow(1 - p, 4), v = q.getBoundingClientRect();
    const L = rb.left + (v.left - rb.left) * e, T = rb.top + (v.top - rb.top) * e, W = rb.width + (v.width - rb.width) * e;
    g.style.transform = `translate(${L - r.left}px,${T - r.top}px) scale(${W / r.width})`;
    if (p < 1) requestAnimationFrame(schritt); else weg(); };
  requestAnimationFrame(schritt);
}
document.addEventListener('click', e => {
  if (!FEIN || !e.target.closest || e.target.closest('.sc-live__zu, .sc-vorne__zu')) return;
  const g = e.target.closest('.sc-geraet[data-live]'); if (!g) return;
  e.preventDefault(); e.stopPropagation();
  if (g.classList.contains('live') || g.classList.contains('sc-ist-vorne')) return;
  vorneAn(g);   // überall gleich: Übersicht, Familien und Mappe (Robert 12.11.2026)
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.sc-geraet.live').forEach(liveZu); });
/* Ohne «Robert sagt/entscheidet» (Robert 09.11.2026: «wir versuchen das zusammen aufzubauen»): Zitate und Namen aus den Preiszeilen von Angebot.md nehmen */
const ohneZitat = z => String(z || '').replace(/;\s*Robert[^;:()]*:\s*«[^»]*»/g, '').replace(/\s*\(Robert[^()]*\)/g, '').replace(/\s+([.,;:])/g, '$1');
const zwei = (a, b) => `${esc(a)} <em>${esc(b || '')}</em>`;
const kopfBlock = (t, lead) => `<header class="sc-kopf" data-r><h2 class="sc-t">${zwei(t[0], t[1])}</h2>${lead ? `<p class="sc-lead">${esc(lead)}</p>` : ''}</header>`;
const lg = (mk, b, p) => `<div class="wo-lg"><span class="wo-mk">${esc(mk)}</span><b>${b}</b>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
const extraListe = () => (W.extra || []).concat(['Die KI rechnet der Anbieter direkt mit dem Haus ab, nach Verbrauch und mit einer Obergrenze je Monat.', 'Wünsche darüber hinaus, etwa ein weiterer Bereich: dafür gibt es vorher ein eigenes Angebot.']);
const OBSIDIAN = d => 'obsidian://open?path=' + encodeURIComponent('/Users/robertreff/Desktop/Second Brain/' + d);
const quellen = zeilen => `<section class="sc-quellen" aria-label="Quellen"><span class="wo-mk">Woher die Angaben kommen</span><ul>${zeilen.filter(Boolean).map(([t, x, u, l]) =>
  `<li><b>${esc(t)}</b><span>${esc(x)}</span>${u ? `<a href="${esc(u)}"${/^obsidian:/.test(u) ? '' : ' target="_blank" rel="noopener"'}><span>${esc(l || 'Öffnen')}</span><i>${WO.ic('pfeil')}</i></a>` : '<em></em>'}</li>`).join('')}</ul></section>`;
const qKunden = h => ['Haus und Stand', 'Werkzeug «Kunden»' + (h.quelle ? ', ' + h.quelle : ''), '/zentrale/werkzeuge/02-kundenliste/', 'Kundenliste'];
const qMarke = () => ['Werkzeuge', 'Marke & Vision, Kapitel «Unsere Werkzeuge»', '/zentrale/werkzeuge/12-marke-vision/', 'Marke & Vision'];
/* Schulung in der Mappe (Robert 12.11.2026, «Ja, einbauen»): vorher Fälle sammeln, ein Modul je Abteilung mit Vorlagen als Ergebnis, danach vier Wochen Begleitung und Nachmessen.
   Inhalt aus «Kunden» (pitch.schulung), gleich wie im Schulungsentwurf des Hauses. */
const schulungAufbau = S2 => {
  const reihe = (l, mk) => `<ol class="sc-wochen sc-wochen--reihe${l.length === 4 ? ' sc-wochen--zwei' : ''}" style="--n:${l.length}" data-r>${l.map(([t, p], i) => `<li><span class="wo-mk">${mk(i)}</span><b>${esc(t)}</b><p>${esc(p)}</p></li>`).join('')}</ol>`;
  return `<span class="wo-mk sc-unterkopf" data-r>So läuft sie ab</span>${reihe(S2.phasen, i => 'Phase ' + (i + 1))}
    <span class="wo-mk sc-unterkopf" data-r>Jedes Modul gleich aufgebaut</span>${reihe(S2.ablauf || [], i => 'Schritt ' + (i + 1))}
    <span class="wo-mk sc-unterkopf" data-r>Die Module, nach Nutzen geordnet</span>
    <div class="sc-module" data-r><ol>${(S2.module || []).map(([t, wer, dauer], i) => `<li><em>${i + 1}</em><b>${esc(t)}</b><span>${esc(wer || '')}</span><small>${esc(dauer || '')}</small></li>`).join('')}</ol>${S2.reihenfolge ? `<p>${esc(S2.reihenfolge)}</p>` : ''}</div>
    ${(S2.nutzen || []).length ? `<span class="wo-mk sc-unterkopf" data-r>Was das Haus davon hat</span><div class="sc-nutzen" data-r>${S2.nutzen.map(x => `<div><i>${WO.ic('haken')}</i><span>${esc(x)}</span></div>`).join('')}</div>` : ''}`;
};
const liste = (l, kl = '') => `<ul class="sc-punkte ${kl}">${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;

/* ---------------------------------------------------------------- Antworten auf die Fragen, die im Gespräch kommen (alles aus wissen.js und «Kunden») */
function preisAntwort(h) {
  const r = ((S.d.preise || {}).rahmen || []).map(ohneZitat);
  if (h && h.preis && Array.isArray(h.preis.zeilen) && h.preis.zeilen.length && !h.preis.betrag)   // eigenes Angebot (z. B. Salt & Silver: Betrag nennt die Gruppe)
    return h.preis.zeilen.map(z => `<p>${esc(z[0])}: <b>${esc(z[1])}</b>${z[2] ? ', ' + esc(z[2]) : ''}.</p>`).join('');
  if (h && preisText(h)) {
    const p1 = paketPreis(h, 1), p2 = paketPreis(h, 2);
    return `<p>Website und Werkzeuge: <b>${esc(preisText(h))}</b>, netto, einmalig.</p>${p1 || p2 ? `<p>Dazu im Monat: Betreuung der Website <b>${esc(p1 || 'offen')}</b>, Werkzeuge im Abo <b>${esc(p2 || 'offen')}</b>, beide monatlich kündbar.</p>` : ''}${h.preis.datum_text ? `<p class="sc-fein">${esc(String(h.preis.datum_text).replace(/\s*von Robert\b/, ''))}.</p>` : ''}`;
  }
  return `<p>${h ? 'Für ' + esc(h.name) + ' ist noch kein Betrag festgelegt; den überlegen wir gemeinsam.' : 'Den Betrag je Haus überlegen wir gemeinsam; er steht dann in der Mappe des Hauses.'} Als Rahmen gilt:</p>${liste(r.length ? r : ['Nicht gefunden in Angebot.md.'])}`;
}
function fragen(h) {
  const bureau = h ? siebenFuer(h).find(x => x.s.k === 'bureau') : null;
  const p = n => h ? paketPreis(h, n) : '';
  return [
    ['Was kostet das?', preisAntwort(h)],
    ['Was ist in der Betreuung drin?', (W.pakete || []).map((k, i) => `<p><b>${esc(k.name)}</b>${p(i + 1) ? ' · ' + esc(p(i + 1)) + ' im Monat' : ''}</p>${liste(k.punkte)}`).join('') + `<p class="sc-fein">${esc(W.paketeFuss)}</p>`],
    ['Brauchen wir die Betreuung, damit die Seite läuft?', `<p>${esc(W.laeuftAuchOhne || '')}</p>`],
    ['Was ist, wenn wir keine Betreuung nehmen?', liste(W.ohneBetreuung || [])],
    ['Wie lange dauert es, bis die Seite online ist?', `<p>${esc(dauerText())}</p>`],
    ['Wann zahlt das Haus?', liste(zahlungListe())],
    ['Was brauchen Sie von uns?', liste(W.braucht || [])],
    ['Können wir die Seite selbst ändern?', `<p>Ja. Mit ${esc(bureau ? bureau.name : 'Website bearbeiten')} ändert das Team Texte direkt in der Seite, tauscht Fotos und pflegt Telefon, Adresse und Öffnungstage an einer Stelle. Vor dem Umzug gibt es eine Stunde Schulung je Werkzeug.</p>`],
    ['Wem gehört die Website?', liste(W.gehoert || [])],
    ['Bleibt unser Buchungssystem?', '<p>Ja, das Buchungssystem bleibt, wie es ist. Wir binden es an die neue Seite an.</p>'],
    ['Was macht die KI, und was kostet sie?', `<p>${esc((W.ki || {}).satz)}</p>${liste(((W.ki || {}).stellen || []).map(s => s[0] + ' (' + s[1] + '): ' + s[2]))}`],
    ['Wie sicher ist die Seite?', liste(W.sicherheit || [])],
    ['Wie steht es um den Datenschutz?', liste(W.sicher || [])],
    ['Was kommt an Kosten noch dazu?', liste(extraListe())],
    ['Kommen Kosten für Server, Speicher oder viele Besucher dazu?', W.kosten ? `<p>${esc(W.kosten.satz)}</p>${liste(W.kosten.nie)}` : ''],
    ['Was passiert, wenn wir aufhören wollen?', '<p>Beide Arten der Betreuung sind monatlich kündbar. Alles gehört dem Haus; gehen wir getrennte Wege, nimmt das Haus alles mit. Die laufenden Kosten, etwa für die Domain, übernimmt das Haus dann selbst.</p>']
  ];
}
const fragenBlock = (h, offenErste) => `<div class="sc-fragen" data-r>${fragen(h).map(([q, a], i) => `<details class="sc-frage"${offenErste && i === 0 ? ' open' : ''}><summary><b>${esc(q)}</b><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a">${a}</div></details>`).join('')}</div>`;

/* ---------------------------------------------------------------- Drei Wege je Haus und der Bearbeitungsstand im Startbild
   (Robert 11.11.2026: «oben Verlinkung zur Werkbank und Bearbeitungsstand Website + Werkbank + Tools nebeneinander übersichtlich im Entrance»,
   in der Übersicht «Mappe öffnen, Website öffnen und Werkbank öffnen statt nur Mappe öffnen») */
const webAdresse = h => h.entwurf || (h.pitch ? h.website || '' : '');
function dreiWege(h, hellGrund) {
  const w = webAdresse(h), wb = werkbank(h), g = hellGrund ? 'hell' : 'glas';
  return `<div class="sc-wege">${WO.knopf('Mappe öffnen', 'rechts', 'dunkel', { klein: true, attr: `data-gehe="haus:${esc(h.id)}"` })}`
    + (w ? WO.knopf(h.entwurf ? 'Website öffnen' : 'Ihre Website', 'auge', 'gold', { klein: true, href: esc(w), neu: true }) : WO.knopf('Website folgt', 'auge', g, { klein: true, disabled: true }))
    + (wb ? WO.knopf('Werkbank öffnen', 'pfeil', g, { klein: true, href: esc(wb), neu: true }) : WO.knopf(h.werkbank_stand || 'Werkbank folgt', 'pfeil', g, { klein: true, disabled: true }))
    + '</div>';
}
/* Fortschritt je Haus (Robert 11.11.2026: «Prozentbalken pro Seite für Werkbank und Website nach Fortschritt, überall»).
   Feste Stufen, nur aus den Daten in «Kunden» und projekte.py:
   Website: gebaut · geprüft · online · verschickt (4 Stufen) · Werkbank: in Arbeit · gebaut · online (3 Stufen) · Werkzeuge: x von 7 nach Bauplan */
const DRAUSSEN = /^(angeschrieben|Entwurf geschickt|Angebot|Vertrag)$/;
/* von Robert abgenommen (Kunden › abgenommen): offene Demo-Punkte gelten als erledigt, mit seinem Vermerk (Robert 11.11.2026, Angelina) */
const abg = (h, teil, l) => h.abgenommen && h.abgenommen[teil] ? (l || []).map(x => x.ok === false && x.stufe !== 'final' ? Object.assign({}, x, { ok: true, detail: h.abgenommen[teil] }) : x) : (l || []);
function fortschritt(h) {
  const w = h.entwurf, wb = werkbank(h), pr = pruefungVon(h);
  const demo = l => (l || []).filter(x => x.stufe !== 'final' && x.ok !== null);
  const quote = pk => pk && pk.length ? Math.round(100 * pk.filter(x => x.ok).length / pk.length) : 0;
  let web = null;
  if (!h.pitch) {
    const pk = pr && pr.website && demo(abg(h, 'website', pr.website.punkte)), q = quote(pk), n = pk ? pk.filter(x => x.ok).length : 0;
    web = !w ? { p: 0, t: 'Nicht gebaut', teil: 'website' }
      : !lokal(w) ? { p: 100, t: 'Online', teil: 'website' }
      : pk && pk.length ? { p: q, t: q === 100 ? 'Demo geprüft, lokal' : n + ' von ' + pk.length + ' geprüft', teil: 'website' }
      : { p: 0, t: 'Noch nicht geprüft', teil: 'website' };
  }
  const ia = h.in_arbeit || {};   // von Hand: noch nicht fertig, noch kein Check (Robert 11.11.2026, Chalet Rustica)
  if (web && ia.website) web = ia.website_p ? { p: ia.website_p, t: ia.website, teil: 'website', arbeit: true, zahl: true } : { p: 0, t: ia.website, teil: 'website', arbeit: true, wort: ia.website_wort };
  const bpk = pr && pr.werkbank && demo(abg(h, 'werkbank', pr.werkbank.punkte)), bq = quote(bpk), bn = bpk ? bpk.filter(x => x.ok).length : 0;
  const bank = !wb ? { p: 0, t: h.werkbank_stand ? 'In Arbeit' : 'Noch keine', teil: 'werkbank' }
    : bpk && bpk.length ? { p: bq, t: bq === 100 ? (h.abgenommen && h.abgenommen.werkbank ? 'Abgenommen' : 'Demo geprüft') : bn + ' von ' + bpk.length + ' geprüft', teil: 'werkbank' }
    : { p: 0, t: 'Noch nicht geprüft', teil: 'werkbank' };
  const bankA = ia.werkbank ? (ia.werkbank_p ? { p: ia.werkbank_p, t: ia.werkbank, teil: 'werkbank', arbeit: true, zahl: true } : { p: 0, t: ia.werkbank, teil: 'werkbank', arbeit: true, wort: ia.werkbank_wort }) : bank;
  let wz;
  if (h.pitch) { const n = (h.werkzeuge || []).length, z = ((h.pitch.werkzeuge || []).length) || n; wz = { p: z ? Math.round(100 * Math.min(n, z) / z) : 0, t: n + ' von ' + z + ' gebaut' }; }
  else if (!NACH_BAUPLAN(h)) { const e = eigeneWerkzeuge(h).length; wz = { p: e ? 100 : 0, t: e ? mz(e, 'eigenes Werkzeug', 'eigene Werkzeuge') + ' gebaut' : 'Noch nicht gebaut' }; }
  else { const n = siebenFuer(h).filter(x => x.gebaut).length; wz = { p: Math.round(100 * n / 7), t: n + ' von 7 gebaut' }; }
  return { web, bank: bankA, wz };
}
/* verschickt: grüner Haken neben dem Namen statt eigener Prozentstufe */
/* Preise als eigene Kachel (Robert 11.11.2026): Website einmalig, Betreuung der Website im Monat, Werkzeuge im Abo; Häuser mit eigenem Angebot über preis.zeilen */
/* Akquise-Stufe mit Bedeutung: Namen und Sätze wie im Werkzeug «Kunden» (STAND_INFO), dazu Schritt x von 7 */
const AKQ = [['gefunden', 'Gefunden', 'Aufgefallen, noch nicht angesehen.'], ['geprüft', 'Geprüft', 'Website und Haus angesehen, passt.'], ['angeschrieben', 'Angeschrieben', 'Die Mail mit der Präsentation ist unterwegs.'],
  ['Entwurf geschickt', 'Entwurf', 'Der Entwurf liegt beim Haus.'], ['Gespräch', 'Gespräch', 'Wir reden miteinander.'], ['Angebot', 'Angebot', 'Das Angebot liegt vor.'], ['Vertrag', 'Kunde', 'Unterschrieben, wir bauen.']];
const akq = h => { let i = AKQ.findIndex(a => a[0] === h.stand); if (i >= 0 && i < 2 && versandDaten(h).length) i = 2;   // verschickt = mindestens «Angeschrieben» (16.11.2026)
  return i < 0 ? { i: -1, n: 'Offen', s: 'Übernommen, noch nicht eingeordnet.' } : { i, n: AKQ[i][1], s: AKQ[i][2] }; };
/* Versand-Zähler (Robert 16.11.2026: «ab dem Moment, wo wir verschicken, ein Timer von 0 bis 30 Tagen hoch, Leiste grün am Anfang, je näher an 30 desto roter, dazu die Daten»).
   Daten aus «Kunden», Station «Verschickt» (Datum und alle Daten im Ergebnis-Text). */
const isoVon = t => { const m = /(\d{4})-(\d\d)-(\d\d)/.exec(t || ''), n = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t || ''); return m ? m[0] : n ? `${n[3]}-${n[2].padStart(2, '0')}-${n[1].padStart(2, '0')}` : ''; };
const VERSAND_PROJEKT = { 'grand-beau-rivage': 'beau-rivage', 'salt-and-silver': 'saltandsilver' };
/* Quellen: Station «Verschickt» in «Kunden», die Liste verschickter Mails (Versand-Schutz), bei «Angebot» das Angebotsdatum aus dem Text */
const versandDaten = h => {
  if (h.versand_verbergen) return [];   // Familie Maeder: Links deaktiviert, Mails nicht angekommen, gilt als nicht verschickt (Robert 16.11.2026)
  const l = [], dazu = t => { const i = isoVon(t); if (i) l.push(i); };
  const v = (h.verlauf_weg || []).find(x => x.station === 'Verschickt');
  if (v && v.erledigt) { dazu(v.datum); String(v.ergebnis || '').replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, m => { dazu(m); return m; }); }
  ((S.d && S.d.versand) || []).forEach(m => { if (/LinkedIn|jede Mail/.test(m.an)) return;
    if ((VERSAND_PROJEKT[m.projekt] || m.projekt) === h.id || (m.an && h.name && m.an.includes(h.name))) dazu(m.datum); });
  const k = /(?:Angebot vom|verschickt am|Pitch am|angeschrieben am|Angeschrieben am)\s+(\d{1,2}\.\d{1,2}\.\d{4})/.exec(h.kurz || ''); if (k && /^(Angebot|Entwurf geschickt|angeschrieben)$/.test(h.stand || '')) dazu(k[1]);
  return [...new Set(l)].sort(); };
/* Geöffnet? (Robert 19.11.2026: «in das Sales Cockpit direkt in die Häuser rein, ob geöffnet wurde»). Quelle besuche_haeuser.py:
   nur Besuche, die nach den Regeln der Besuchs-Mails echt sind (gelesen, gescrollt, kein Rechenzentrum, nicht aus Asien). Die Regeln gelten seit 17.11.2026. */
const besuchVon = h => ((S.d && S.d.besuche && S.d.besuche.haeuser) || {})[h.id] || null;
const BES_SEIT = '17.11.';
function besuchText(h) {
  const b = besuchVon(h); if (!b || !b.letzter) return null;
  const l = b.letzter, d = new Date(l.iso), CH = { timeZone: 'Europe/Zurich' };   // Tag und Uhrzeit immer Schweizer Zeit, gleich wo Anna oder Robert sitzen
  const tg = x => x.toLocaleDateString('de-CH', CH), heute = tg(new Date()), gestern = tg(new Date(Date.now() - 864e5));
  const tag = tg(d) === heute ? 'Heute' : tg(d) === gestern ? 'Gestern' : d.toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric', ...CH });
  const zeit = d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
  const dauer = l.sek >= 60 ? Math.round(l.sek / 60) + ' Min' : l.sek + ' s';
  return { kopf: `${tag}, ${zeit} Uhr`, fein: [l.ort ? 'aus ' + l.ort : '', l.geraet, l.was, mz(l.seiten, 'Seite', 'Seiten'), dauer].filter(Boolean).join(' · ') + (b.anzahl > 1 ? ` · ${b.anzahl} Besuche` : '') };
}
function besuchTafel(h, klasse = 'sc-k') {
  const x = besuchText(h);
  return `<div class="${klasse} sc-geoeffnet${x ? ' an' : ''}"><dt>Geöffnet</dt><dd>${x ? `<b>${esc(x.kopf)}</b><small>${esc(x.fein)}</small>` : `<b>Noch nicht</b><small>Kein echter Besuch seit dem ${BES_SEIT}</small>`}</dd></div>`;
}
function versandTafel(h, klasse = 'sc-k') {
  const d = versandDaten(h);
  if (!d.length) return `<div class="${klasse} sc-versand"><dt>Seit dem Versand</dt><dd><b class="sc-versand__z" style="color:${versandFarbe(0)}">0<small>/ 30 Tage</small></b>
    <span class="sc-versand__b" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="30"><i style="width:3%;background:${versandFarbe(0)}"></i></span><small>Wartet auf Versand</small></dd></div>`;
  const L = versandLauf(d), tage = L.t, farbe = `hsl(${Math.round(125 * (1 - Math.min(tage, 30) / 30))} 58% 40%)`;
  return `<div class="${klasse} sc-versand"><dt>Seit dem ${L.alt.length ? 'Nachgang' : 'Versand'}</dt><dd><b class="sc-versand__z" style="color:${farbe}">${tage}<small>/ 30 ${tage === 1 ? 'Tag' : 'Tage'}</small></b>
    ${laufBalken(L, 'sc-versand__b', x => `hsl(${Math.round(125 * (1 - Math.min(x, 30) / 30))} 58% 40%)`)}
    <small>${L.alt.length ? esc(laufText(L, d)) : 'Verschickt am ' + d.map(datum).join(', noch einmal am ')}</small></dd></div>`;
}
function akqTafel(h) {
  const a = akq(h), nx = AKQ[a.i + 1];
  return `<div class="sc-k sc-k--akq"><dt>Akquise · ${a.i + 1} von ${AKQ.length}</dt><dd><b>${esc(a.n)}</b><span class="sc-akq__s">${esc(a.s)}${nx ? ` Als Nächstes: ${esc(nx[1])}.` : ''}</span>`
    + `<span class="sc-akq" aria-hidden="true">${AKQ.map((x, j) => `<i class="${j <= a.i ? 'an' : ''}" title="${esc(x[1])}"></i>`).join('')}</span></dd></div>`;
}
/* Preise ändern direkt in der Kachel (Robert 14.11.2026: «im Sales Cockpit … die Preise anpassen … und dann ändert sich der Preis automatisch auch
   auf der jeweiligen Werkbank und überall»). Speichern schreibt in «Kunden» und zieht Werkbank, Karte und PDF nach (api.py preis/<id>, _Preise/preise.py). */
const nurWerkzeuge = h => { const pr = h.preis || {}; return !pr.betrag && !pr.betreuung_website && Array.isArray(pr.zeilen) && pr.zeilen.length > 0; };
const preisZahl = t => { const m = String(t || '').replace(/[’']/g, '').match(/(\d[\d.]*)/); return m ? +m[1].replace(/\./g, '') : ''; };
function preisFelder(h) {
  const pr = h.preis || {}, zm = (pr.zeilen || []).find(x => /Monat/.test(String(x[2] || '')));
  if (nurWerkzeuge(h)) return [['abo', zm ? zm[0] : 'Werkzeuge mit Betreuung', 'im Monat', zm ? preisZahl(zm[1]) : '']];
  return [['website', pr.paket ? 'Website im Familienpaket' : 'Website', 'einmalig', pr.betrag || ''], ...(pr.paket ? [['einzeln', 'Website einzeln', 'ohne Paket, einmalig', pr.paket.einzeln || '']] : []),
    ['betreuung', /Wartung/.test(pr.monatlich || '') ? 'Wartung der Website' : 'Betreuung Website', 'im Monat', preisZahl(pr.betreuung_website)],
    ['abo', 'Werkzeuge im Abo', 'im Monat', preisZahl(pr.abo_werkzeuge)]];
}
const preisCur = h => { const pr = h.preis || {}, w = String(pr.waehrung || '').toUpperCase(); return w === 'EUR' || (!w && /€/.test([pr.gross, pr.monatlich].join(' '))) ? '€' : 'CHF'; };
/* Familienpaket (Robert 15.11.2026: «Verweis, dass der Preis Paketpreis für alle 4 + Landingpage ist, und einzeln bspw. 10k»): Daten in «Kunden» preis.paket */
const paketZeile = (h, kl = 'sc-preise__paket') => { const p = (h.preis || {}).paket; if (!p || !p.gesamt) return '';
  const cur = preisCur(h), f = v => cur === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  return `<p class="${kl}">Paketpreis für ${p.haeuser === 2 ? 'beide Häuser' : 'alle ' + p.haeuser + ' Häuser'} mit gemeinsamer Startseite: <b>${f(p.gesamt)}</b>${p.einzeln ? ` · einzeln <b>${f(p.einzeln)}</b>` : ''}</p>`; };
const paketReihen = h => { const p = (h.preis || {}).paket; if (!p || !p.gesamt) return '';
  const cur = preisCur(h), f = v => cur === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v), wer = p.haeuser === 2 ? 'beide Häuser' : 'alle ' + p.haeuser + ' Häuser';
  return `<ul class="sc-preise sc-preise--paket"><li><span>Paketpreis</span><b>${f(p.gesamt)}</b><small>${wer} mit gemeinsamer Startseite</small></li>${p.einzeln ? `<li><span>Einzeln</span><b>${f(p.einzeln)}</b><small>Website je Haus</small></li>` : ''}</ul>`; };
function preisTafel(h, imBlock) {
  const pr = h.preis || {};
  if (S.preisEdit === h.id) {
    const cur = preisCur(h);
    return `<div class="sc-k sc-k--preis"><dt>Preise ändern</dt><dd><form class="sc-preisform" data-preis-form="${esc(h.id)}" novalidate>
      ${preisFelder(h).map(([k, t, n, v]) => `<label class="sc-preisform__z"><span>${esc(t)}<small>${esc(n)}, netto</small></span><span class="sc-preisform__f"><i>${cur}</i><input name="${k}" type="text" inputmode="numeric" autocomplete="off" value="${esc(String(v))}" aria-label="${esc(t)} in ${cur}"></span></label>`).join('')}
      <p class="sc-preisform__hinweis">Gilt sofort in «Kunden», auf der Werkbank, in der Karte, im PDF und in den Präsentationen.${(h.preis || {}).paket ? ' Der Paketpreis der Familie rechnet sich neu.' : ''}</p>
      <div class="sc-preisform__kn"><button type="submit" class="sc-preisform__ok">Speichern</button><button type="button" class="sc-preisform__ab" data-preis-ab>Abbrechen</button></div></form></dd></div>`;
  }
  const z = Array.isArray(pr.zeilen) && pr.zeilen.length ? pr.zeilen
    : [['Website', (pr.gross || '').trim(), 'einmalig'], ['Betreuung Website', pr.betreuung_website, 'im Monat'], ['Werkzeuge im Abo', pr.abo_werkzeuge, 'im Monat']].filter(x => x[1]);
  const kn = S.server && (pr.betrag || pr.betreuung_website || nurWerkzeuge(h)) ? `<button type="button" class="sc-preis-kn" data-preis-aendern="${esc(h.id)}">Preise ändern</button>` : '';
  return `<div class="sc-k sc-k--preis"><dt>Preise</dt><dd>${z.length ? `<ul class="sc-preise">${z.map(([t, b, n]) => `<li><span>${esc(t)}</span><b>${esc(b)}</b><small>${esc(n || '')}</small></li>`).join('')}</ul>${imBlock ? '' : paketReihen(h)}` : 'Noch nicht festgelegt'}${kn}</dd></div>`;
}
/* nach dem Neuzeichnen bleibt die Karte des Hauses aufgeklappt, sonst verschwände das Formular wieder im zugeklappten Teil */
function preisNeu(id) {
  neuZeichnen();
  const x = $(`#ansicht [data-preis-form="${id}"], #ansicht [data-preis-aendern="${id}"]`), k = x && x.closest('.sc-karte, .sc-zeile'); if (!k) return;
  const reihe = k.classList.contains('sc-karte') && k.closest('.sc-karten') ? $$('.sc-karte', k.closest('.sc-karten')) : [k];
  reihe.forEach(r => { r.classList.add('auf'); const kn = $('[data-fort-auf]', r); if (kn) kn.setAttribute('aria-expanded', 'true'); });
}
async function preisSpeichern(f) {
  const id = f.dataset.preisForm, h = haus(id); if (!h) return;
  const w = {}; let falsch = '';
  $$('input[name]', f).forEach(i => { const v = i.value.replace(/[’'\s.]/g, ''); if (v === '') return; if (!/^\d+$/.test(v)) falsch = i.getAttribute('aria-label'); w[i.name] = +v; });
  if (falsch) { meldung('Bitte nur Zahlen eintragen: ' + falsch + '.', true); return; }
  const kn = $('[type="submit"]', f); if (kn) { kn.disabled = true; kn.textContent = 'Wird überall eingetragen …'; }
  try {
    const j = await api('PUT', 'preis/' + id, w);
    const vorher = h.preis; h.preis = j.nachher; paketeRechnen(); S.preisEdit = null; preisNeu(id); preisQuittung(h, vorher, j);
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); if (kn) { kn.disabled = false; kn.textContent = 'Speichern'; } }
}
function preisQuittung(h, vorher, j) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const alt = { preis: vorher || {} }, zeilen = preisFelder(h).map(([k, t, n, v]) => { const a = preisFelder(alt).find(x => x[0] === k); const av = a ? a[3] : '';
    const cur = preisCur(h), fmt = n => n === '' ? 'leer' : (cur === '€' ? Number(n).toLocaleString('de-DE') + ' €' : 'CHF ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’'));
    return String(av) !== String(v) ? `<li><b>${esc(t)}</b><span><s>${esc(fmt(av))}</s> → ${esc(fmt(v))}</span></li>` : ''; }).join('');
  const wo = j.werkbank && j.werkbank.length ? 'Werkbank, Karte und PDF sind nachgezogen.' : 'Auf der Werkbank stand der Preis schon so.';
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>Preise ${esc(h.name)} gespeichert</b><ul>${zeilen || '<li>Keine Änderung.</li>'}</ul><p>${esc(wo)}${(j.fehlt || []).length ? ' Noch offen: ' + esc(j.fehlt.join(', ')) : ''}</p></div><div class="sc-quit__kn">${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    const w = {}; preisFelder(alt).forEach(([k, , , v]) => { if (v !== '') w[k] = +v; });
    try { const r = await api('PUT', 'preis/' + h.id, w); h.preis = r.nachher; q.remove(); preisNeu(h.id); meldung('Rückgängig gemacht: die Preise davor gelten wieder, auch auf der Werkbank.'); }
    catch (e) { meldung('Rückgängig ging nicht: ' + e.message, true); }
  };
  m.appendChild(q); setTimeout(() => q.remove(), 16000);
}
const preisKurz = h => ((h.preis || {}).zeile || '').trim() || preisText(h);   // Übersicht: ganze Preiszeile (Angelina: Website und Werkzeuge im Monat)
const verschickt = h => { if (h.versand_verbergen) return false; const p = projektVon(h); return !!h.entwurf && (!!(p && p.mail) || /^(angeschrieben|Entwurf geschickt|Angebot)$/.test(h.stand || '')); };
const haken = h => verschickt(h) ? `<span class="sc-haken" title="Verschickt" aria-label="Verschickt">${WO.ic('haken')}</span>` : '';
const pruefungVon = h => ((S.d && S.d.pruefung && S.d.pruefung.haeuser) || {})[h.id] || null;
const ton = p => p >= 100 ? 'gruen' : p >= 50 ? 'gold' : 'rot';   // fertig · unterwegs · noch weit
const balken = (x, hell) => `<span class="sc-fs${hell ? ' sc-fs--hell' : ''}"><span class="sc-fs__z">${x.p}&#8239;%</span><span class="sc-balken${hell ? ' sc-balken--hell' : ''}" role="progressbar" aria-valuenow="${x.p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${x.p}%"></i></span><span class="sc-fs__t">${esc(x.t)}</span></span>`;
const tonX = x => x.arbeit && !x.zahl ? 'gold' : ton(x.p);
const istText = x => x.arbeit && !x.zahl;   // in Arbeit ohne Zahl: Wort statt Prozent
const wortX = x => x.wort || 'In Arbeit';
const fsFeld = (t, x, id) => `<button type="button" class="sc-fort__f sc-ton--${tonX(x)}${istText(x) ? ' sc-fort__f--arbeit' : ''}" data-pruef="${esc(id)}:${x.teil}" aria-label="${t}: was geprüft ist und was aussteht"><span class="sc-fort__mk">${t}</span>${istText(x) ? `<b class="sc-fort__arbeit">${esc(wortX(x))}</b>` : `<b data-zahl="${x.p}">${x.p}<small>&#8239;%</small></b>`}<span class="sc-fort__b" role="progressbar" aria-valuenow="${x.p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(x.p, 3)}%"></i></span><span class="sc-fort__t">${esc(x.t)}</span></button>`;
/* Häuser «Nur Werkzeuge»: die Werkzeuge als drittes Feld, ohne Prüffenster */
const wzFeld = x => `<div class="sc-fort__f sc-fort__f--still sc-ton--${ton(x.p)}"><span class="sc-fort__mk">Werkzeuge</span><b data-zahl="${x.p}">${x.p}<small>&#8239;%</small></b><span class="sc-fort__b" role="progressbar" aria-valuenow="${x.p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(x.p, 3)}%"></i></span><span class="sc-fort__t">${esc(x.t)}</span></div>`;
const fsZeilen = h => { const f = fortschritt(h);
  return `<div class="sc-fortreihe sc-k"><span class="sc-fortreihe__mk">Fortschritt · Demo-Check</span><div class="sc-fort">${f.web ? fsFeld('Website', f.web, h.id) : ''}${fsFeld('Werkbank', f.bank, h.id)}${h.pitch ? wzFeld(f.wz) : ''}</div></div>`; };
/* Gespräch zum Aufklappen (Robert 11.11.2026: «wo genau das Gespräch gerade steht»): jeder Gesprächspunkt mit Haken, dazu das letzte Gespräch */
function gsFeld(h, offen) {
  const T = themenVon(h), g = gespraech(h.id), st = (g && g.stand) || {}, ab = new Set(st.abgedeckt || []), b = T.filter(t => ab.has(t[0])).length;
  const zuletzt = st.ergebnis || st.datum ? (st.datum ? datum(st.datum) + ': ' : '') + (st.ergebnis || 'Gespräch eingetragen') : 'Noch kein Gespräch eingetragen';
  return `<div class="sc-gs sc-k" data-gs="${esc(h.id)}"><dt>Gespräch</dt><dd><details class="sc-gs__d"${offen ? ' open' : ''}><summary><span class="sc-gs__z"><b>${b}</b> von ${T.length} Punkten besprochen</span>`
    + `<span class="sc-gs__b" aria-hidden="true"><i style="width:${T.length ? Math.max(Math.round(100 * b / T.length), 2) : 2}%"></i></span><span class="sc-gs__auf">Wo das Gespräch steht<i>${WO.ic('hoch')}</i></span></summary>`
    + `<ol class="sc-gs__l">${T.map(([k, t]) => `<li class="${ab.has(k) ? 'ok' : ''}"><button type="button" data-thema="${esc(h.id)}:${esc(k)}" aria-pressed="${ab.has(k) ? 'true' : 'false'}"><i>${ab.has(k) ? WO.ic('haken') : ''}</i><span>${esc(t)}</span></button></li>`).join('')}</ol>`
    + `<p class="sc-gs__fuss"><span>Zuletzt</span>${esc(zuletzt)}</p>${st.vereinbart ? `<p class="sc-gs__fuss"><span>Vereinbart</span>${esc(st.vereinbart)}${st.vereinbart_datum ? ' · ' + esc(datum(st.vereinbart_datum)) : ''}</p>` : ''}`
    + `<button type="button" class="sc-gs__kn" data-gehe="${h.famK ? 'familie:' + esc(h.famK) : 'haus:' + esc(h.id)}">Mehr in der Mappe eintragen${pfeil()}</button></details></dd></div>`;
}
/* Abhaken: ein Klick setzt oder nimmt den Haken, gespeichert sofort wie in der Mappe (gleicher Weg, mit Quittung und «Rückgängig») */
/* Abhaken in «Alle Häuser im Überblick» gilt auch für jedes Haus der Familie (Robert 16.11.2026: «im Alle-Häuser-Gespräch alles abhaken, dann ist es in den Einzelhäusern auch besprochen»).
   Was in der Familie neu abgehakt oder weggenommen wurde, wird bei jedem Haus genauso gesetzt; alles andere am Gespräch des Hauses bleibt. */
async function famWeitergeben(fh, vorher, nachher) {
  if (!fh || !fh.famK || !fh.haeuser) return 0;
  const alt = new Set((vorher && vorher.abgedeckt) || []), neu = new Set((nachher && nachher.abgedeckt) || []);
  const dazu = [...neu].filter(k => !alt.has(k)), weg = [...alt].filter(k => !neu.has(k));
  if (!dazu.length && !weg.length) return 0;
  let n = 0;
  for (const h of fh.haeuser) {
    const keys = new Set(themenVon(h).map(t => t[0])), st = normiere((gespraech(h.id) || {}).stand), ab = new Set(st.abgedeckt || []), vor = ab.size + [...ab].join();
    dazu.filter(k => keys.has(k)).forEach(k => ab.add(k)); weg.forEach(k => ab.delete(k));
    if (ab.size + [...ab].join() === vor) continue;
    const j = await api('PUT', 'gespraech/' + h.id, { felder: Object.assign({}, st, { abgedeckt: [...ab].sort() }), wer: WER(), name: h.name });
    S.d.gespraeche = S.d.gespraeche || {};
    const g = S.d.gespraeche[h.id] || { verlauf: [] };
    g.stand = j.nachher; g.geaendert = jetzt(); g.wer = WER();
    g.verlauf = (g.verlauf || []).concat([{ wann: g.geaendert, wer: WER(), was: 'Aus dem Gespräch mit ' + fh.name + ': ' + (j.geaendert || []).join(', ') }]);
    S.d.gespraeche[h.id] = g; n++;
  }
  return n;
}
function bindeThemen(wurzel) {
  $$('[data-thema]', wurzel).forEach(b => b.onclick = async e => {
    e.preventDefault(); if (!S.server) return meldung('Online lässt sich nichts speichern.', true);
    const [id, k] = b.dataset.thema.split(':'), h = haus(id) || (/^familie-/.test(id) ? famMappeHaus(FAMILIEN.find(f => 'familie-' + f.k === id)) : null); if (!h) return;
    const st = normiere((gespraech(id) || {}).stand), ab = new Set(st.abgedeckt || []);
    if (ab.has(k)) ab.delete(k); else ab.add(k);
    b.disabled = true;
    try {
      const j = await api('PUT', 'gespraech/' + id, { felder: Object.assign({}, st, { abgedeckt: [...ab].sort() }), wer: WER(), name: h.name });
      S.d.gespraeche = S.d.gespraeche || {};
      const g = S.d.gespraeche[id] || { verlauf: [] };
      g.stand = j.nachher; g.geaendert = jetzt(); g.wer = WER();
      g.verlauf = (g.verlauf || []).concat([{ wann: g.geaendert, wer: WER(), was: (j.geaendert || []).join(', ') }]);
      S.d.gespraeche[id] = g;
      if (h.famK) { await famWeitergeben(h, j.vorher, j.nachher);
        h.haeuser.forEach(x => document.querySelectorAll('#ansicht [data-gs="' + x.id + '"]').forEach(alt => { const d = alt.querySelector('details'); const t = document.createElement('div'); t.innerHTML = gsFeld(x, d && d.open); const neu = t.firstElementChild; alt.replaceWith(neu); bindeThemen(neu); }));
        const f0 = FAMILIEN.find(f => f.k === h.famK); document.querySelectorAll('#ansicht details.sc-mb[data-mb="' + h.famK + '"]').forEach(alt => { const t = document.createElement('div'); t.innerHTML = famMission(f0); const neu = t.firstElementChild; neu.open = alt.open; neu.querySelector(':scope > summary').addEventListener('click', e => mbKlappen(neu, e)); alt.replaceWith(neu); bindeThemen(neu); }); }
      $$('#ansicht [data-gs="' + id + '"]').forEach(alt => { const d = alt.querySelector('details'); const t = document.createElement('div'); t.innerHTML = gsFeld(h, d && d.open); const neu = t.firstElementChild; alt.replaceWith(neu); bindeThemen(neu); });
      rand(); quittung(h, j.vorher, j.nachher);
      nachAbhaken(h, j.vorher, j.nachher);
    } catch (err) { meldung('Nicht gespeichert: ' + err.message, true); b.disabled = false; }
  });
}
/* Überblick der gemeinsamen Startseite einer Familie: nur die Website, der Preis ist in den Häusern enthalten */
/* gemeinsame Startseite als eigenes «Haus» für Prüfstand und Prüffenster (Robert 11.11.2026: «genauso wie bei den anderen … diese Übersicht»).
   Stand von Hand (familien.js › stand): unter 100 = in Arbeit mit Roberts Zahl, 100 = von Robert abgenommen */
const famHaus = f => { const fs = f && familienStart(f); if (!fs) return null; const st = f.stand;
  return { id: 'familie-' + f.k, name: 'Gemeinsame Startseite · ' + f.t[0].replace(/\.$/, ''), entwurf: fs[1], werkzeuge: [], adressen: [], art: '', versand_verbergen: true,
    in_arbeit: st && st.p < 100 ? { website: st.t, website_p: st.p } : null, abgenommen: st && st.p >= 100 ? { website: st.t } : null }; };
function famStand(f, link) {
  const ph = famHaus(f);
  const web = ph ? fsFeld('Gemeinsame Website', fortschritt(ph).web, ph.id)
    : '<div class="sc-fort__f sc-fort__f--still sc-ton--rot"><span class="sc-fort__mk">Gemeinsame Website</span><b class="sc-fort__arbeit">Noch keine</b><span class="sc-fort__t">Noch nicht gebaut</span></div>';
  /* Link und Schalter in einer Reihe mittig unter dem Laptop, darunter beginnt gleich die Linie zu den Häusern (Robert 11.11.2026) */
  return `<div class="sc-famstand"><div class="sc-baum__wege">${link}<button type="button" class="sc-baum__link sc-fam-auf" data-fam-auf aria-expanded="false"><span>Stand und Fortschritt</span><i>${WO.ic('hoch')}</i></button></div><div class="sc-fort">${web}`
    + `${famPaketFeld(f)}${famMonatFeld(f)}</div>${famBoard(f)}</div>`;
}
/* Missionboard der Familie (Robert 16.11.2026: «wenn ich Stand und Fortschritt aufklappe … Paketpreise, Bearbeitungsstand des Gesprächs, Mappe öffnen, Website öffnen») */
/* Missionboard der Familie (Robert 16.11.2026: «richtig geil, professionell, edel, luxuriös … kompletter Überblick, welche Phase, ohne Stand und Fortschritt öffnen zu müssen»;
   Familienpaket auf- und zuklappbar: «was im Paketpreis drin ist … nach Priorität, damit Anna dem Kunden direkt sagen kann, was er bekommt») */
const tageSeit = iso => Math.max(0, Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 864e5));
const versandFarbe = t => `hsl(${Math.round(125 * (1 - Math.min(t, 30) / 30))} 58% 44%)`;
/* Nachgang mit Meilenstein (Robert 17.11.2026: «wenn dieser balken da mit den tagen schon voll ist dann da einen meilenstein einbauen und weiterlaufen lassen
   ab heute nochmal 0 und grün aber bis heute rot lassen und die anzahl der tage lassen»). Versanddaten mehr als 3 Tage auseinander = neuer Lauf;
   der alte Lauf bleibt mit seiner Tageszahl und Farbe stehen, ab dem Nachgang zählt der Balken wieder von 0. */
const tageZw = (a, b) => Math.max(0, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5));
const versandLauf = d => { if (!d.length) return null; const alt = []; let letzt = d[0];
  for (let i = 1; i < d.length; i++) { const g = tageZw(d[i - 1], d[i]); if (g > 3) alt.push({ von: d[i - 1], bis: d[i], tage: tageZw(letzt, d[i]), erst: letzt }); letzt = d[i]; }
  return { alt, seit: d[d.length - 1], t: tageSeit(d[d.length - 1]) }; };
const laufBalken = (L, spur, farbe = versandFarbe) => { const t = L ? L.t : 0, neu = `<span class="${spur} sc-lauf__neu"><i style="width:${Math.max(100 * Math.min(t, 30) / 30, 3)}%;background:${farbe(t)}"></i></span>`;
  if (!L || !L.alt.length) return neu.replace(' sc-lauf__neu', '');
  return `<span class="sc-lauf">${L.alt.map(a => `<span class="${spur} sc-lauf__alt" title="${a.tage} Tage bis zum Nachgang am ${datum(a.bis)}"><i style="width:${Math.max(100 * Math.min(a.tage, 30) / 30, 3)}%;background:${farbe(a.tage)}"></i></span><b class="sc-lauf__ms" title="Nachgang am ${datum(a.bis)}" aria-label="Meilenstein: Nachgang am ${datum(a.bis)}"></b>`).join('')}${neu}</span>`; };
const laufText = (L, d) => !L ? 'Wartet auf Versand' : !L.alt.length ? 'Verschickt am ' + d.map(datum).join(', ') :
  L.alt.map(a => `${a.tage} Tage seit dem Versand am ${datum(a.erst)}, Nachgang am ${datum(a.bis)}`).join(' · ');
function paketInhalt(l, fs) {
  const n = l.length, seiten = l.reduce((a, h) => a + (+h.seiten || 0), 0), hat = re => l.filter(h => links(h).some(x => re.test(x[0])));
  const drucks = hat(/Unterlagen|Drucksachen|Kofferetikett|Karten/), feed = hat(/Feed/);
  return [
    [n + ' Websites', `Eine eigene Website je Haus, jede mit eigenem Gesicht${seiten ? ', zusammen ' + seiten + ' Seiten' : ''}. Am Handy so gut wie am Rechner, die Buchung jedes Hauses bleibt.`],
    ['Eine gemeinsame Startseite', 'Eine Adresse für die Familie, von der der Gast in sein Haus kommt.' + (fs ? '' : ' Noch nicht gebaut.')],
    [7 * n + ' Werkzeuge', `Die sieben Werkzeuge je Haus im Kleid des Hauses: Kontrollpanel, Website bearbeiten, Karten & Preislisten, Anfragen & Chat, Markenbuch, Besucher, Drucksachen & Feed. Laufend im Abo.`],
    [n + ' Werkbänke', 'Je Haus eine Werkbank: die heutige Seite mit Befund, der Entwurf, die Werkzeuge, die Unterlagen und die Preise an einem Ort.'],
    ...(drucks.length ? [['Unterlagen und Drucksachen', `Karten, Unterlagen und Drucksachen im neuen Stil, bei ${drucks.length === n ? 'allen Häusern' : drucks.map(h => h.name).join(', ')}.`]] : []),
    ...(feed.length ? [['Feed für Instagram', `Beiträge als Vorschau im Handy, bei ${feed.length === n ? 'allen Häusern' : feed.map(h => h.name).join(', ')}.`]] : []),
    ['Präsentationen', 'Ein Heft für die Familie und eines je Haus, als PDF zum Mitgeben.'],
    ['Der Umzug', 'Rechtstexte, Weiterleitungen, Google, ein Probelauf und die Einführung in die Werkzeuge für das Team jedes Hauses.']];
}
function famMission(f) {
  const fh = famMappeHaus(f); if (!fh || !fh.haeuser.length) return '';
  const l = fh.haeuser, h0 = l[0], n = l.length, fs = familienStart(f), x = HEFTE['familie-' + f.k], ph = famHaus(f);
  const pk = (h0.preis || {}).paket || {}, g = v => preisCur(h0) === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  const EG = [...new Set(l.map(h => ((h.preis || {}).paket || {}).einzeln).filter(Boolean))].sort((a, b) => b - a);
  const mon = monChf(paketPreis(h0, 1)) * n + monChf(paketPreis(h0, 2)) * n;
  const stufen = l.map(h => akq(h).i), pi = Math.max(0, Math.min(...stufen)), phase = AKQ[pi] || AKQ[0];
  const T = themenVon(fh).length, ab = besprochen(fh.id);
  const vd = [...new Set(l.flatMap(versandDaten))].sort(), vt = vd.length ? tageSeit(vd[vd.length - 1]) : null;
  const web = ph ? fortschritt(ph).web : null;
  const balken = (p, farbe) => `<span class="sc-mb__b"><i style="width:${Math.max(p, 3)}%${farbe ? ';background:' + farbe : ''}"></i></span>`;
  const zelle = (mk, gross, klein, extra = '') => `<div class="sc-mb__z"><span class="wo-mk">${esc(mk)}</span><b>${gross}</b>${extra}<small>${esc(klein)}</small></div>`;
  return `<details class="sc-mb" data-mb="${esc(f.k)}"${(S.mbAuf || {})[f.k] ? ' open' : ''} aria-label="Missionboard ${esc(fh.name)}">
    <summary class="sc-mb__kopf"><div><span class="wo-mk">Missionboard</span><h4>${esc(fh.name)}</h4><p>${esc(mz(n, 'Haus', 'Häuser'))} · ${esc([...new Set(l.map(h => (h.ort || '').split(' · ')[0].split(',')[0]))].join(' · '))}</p></div>
      <div class="sc-mb__phase"><span class="wo-mk">Phase der Familie · ${pi + 1} von ${AKQ.length}</span><b>${esc(phase[1])}</b><small>${esc(phase[2])}</small></div><i class="sc-mb__auf" aria-hidden="true">${WO.ic('plus')}</i></summary>
    <div class="sc-mb__inhalt">
    <ol class="sc-mb__weg">${AKQ.map((a, i) => { const z = stufen.filter(s => s === i).length; return `<li class="${i < pi ? 'ok' : i === pi ? 'an' : ''}"><i>${i < pi ? WO.ic('haken') : i + 1}</i><span>${esc(a[1])}</span>${z ? `<em>${z} ${z === 1 ? 'Haus' : 'Häuser'}</em>` : ''}</li>`; }).join('')}</ol>
    <div class="sc-mb__zahlen">
      ${zelle('Paketpreis', pk.gesamt ? esc(g(pk.gesamt)) : 'offen', (n === 2 ? 'Beide Häuser' : 'Alle ' + n + ' Häuser') + ' mit Startseite' + (EG.length ? ' · einzeln ' + EG.map(g).join(' oder ') : ''))}
      ${zelle('Im Monat', esc(g(mon)), 'je Haus ' + (paketPreis(h0, 1) || '–') + ' Betreuung und ' + (paketPreis(h0, 2) || '–') + ' Werkzeuge')}
      ${zelle('Gespräch', `${ab}<em> von ${T}</em>`, ab ? 'Punkte besprochen' : 'Noch kein Punkt besprochen', balken(T ? 100 * ab / T : 0, '#d9c89c'))}
      ${(() => { const L = versandLauf(vd); return zelle(L && L.alt.length ? 'Seit dem Nachgang' : 'Seit dem Versand', `<span style="color:${versandFarbe(L ? L.t : 0)}">${L ? L.t : 0}</span><em> / 30 Tage</em>`, laufText(L, vd), laufBalken(L, 'sc-mb__b')); })()}
      ${zelle('Gemeinsame Startseite', web ? `${web.p}<em> %</em>` : '–', web ? web.t : 'Noch nicht gebaut', web ? balken(web.p, web.p === 100 ? '#5aa36f' : '#d9c89c') : '')}
    </div>
    <div class="sc-mb__haeuser" role="table">${l.map(h => { const fo = fortschritt(h), a = akq(h), d = versandDaten(h), t = d.length ? tageSeit(d[d.length - 1]) : null, pr = h.preis || {};
      return `<div class="sc-mb__h" role="row"><button type="button" class="sc-mb__name" data-gehe="haus:${esc(h.id)}"><b>${esc(h.name)}</b><small>${esc((h.ort || '').split(' · ')[0])}</small></button>
        <span class="sc-mb__chip">${esc(a.n)}</span>
        <span class="sc-mb__mini"><small>Website ${fo.web ? fo.web.p : 0} %</small>${balken(fo.web ? fo.web.p : 0, fo.web && fo.web.p === 100 ? '#5aa36f' : '#d9c89c')}</span>
        <span class="sc-mb__mini"><small>Werkbank ${fo.bank ? fo.bank.p : 0} %</small>${balken(fo.bank ? fo.bank.p : 0, fo.bank && fo.bank.p === 100 ? '#5aa36f' : '#d9c89c')}</span>
        <span class="sc-mb__preis"><b>${pr.betrag ? esc(g(pr.betrag)) : '–'}</b><small>${pr.paket && pr.paket.einzeln ? 'einzeln ' + esc(g(pr.paket.einzeln)) : 'einmalig'}</small></span>
        <span class="sc-mb__vs">${t === null ? `<b style="color:${versandFarbe(0)}">0<em> / 30</em></b><small>Wartet auf Versand</small>` : `<b style="color:${versandFarbe(t)}">${t}<em> / 30</em></b><small>Tage seit Versand</small>`}</span></div>`; }).join('')}</div>
    <details class="sc-mb__paket"><summary><span class="wo-mk">Familienpaket · ${pk.gesamt ? esc(g(pk.gesamt)) : 'offen'}</span><b>Was im Paketpreis drin ist</b><i>${WO.ic('plus')}</i></summary>
      <ol>${paketInhalt(l, fs).map((p, i) => `<li><span>${i + 1}</span><div><b>${esc(p[0])}</b><p>${esc(p[1])}</p></div></li>`).join('')}</ol>
      <p class="sc-mb__monat">Dazu je Haus im Monat: ${esc(paketPreis(h0, 1) || '–')} Betreuung der Website und ${esc(paketPreis(h0, 2) || '–')} für die sieben Werkzeuge, monatlich kündbar. Alles netto.</p></details>
    <div class="sc-mb__kn">${WO.knopf('Mappe öffnen', 'rechts', 'gold', { klein: true, attr: `data-gehe="familie:${esc(f.k)}"` })}${fs ? WO.knopf('Gemeinsame Startseite', 'auge', 'glas', { klein: true, href: esc(fs[1]), neu: true }) : ''}${x ? WO.knopf('Präsentation', 'pdf', 'glas', { klein: true, href: x.pdf, neu: true }) : ''}</div>
    </div></details>`;
}
/* Aufklappen des Missionboards (Robert 16.11.2026: «viel luxuriöser und eleganter … so richtig das Gefühl: wow, hier passiert was»).
   Die helle Leiste wächst als dunkle Fläche zum Board (nur transform), ein goldener Glanz läuft darüber, dann treten Kopf, Phasen,
   Zahlen, Häuser und Knöpfe nacheinander herein, die Zahlen zählen hoch. Zuklappen läuft kurz rückwärts. Ruhig-Modus: sofort. */
const MB_EASE = 'cubic-bezier(.19,1,.22,1)';
function mbZaehlen(root) {
  root.querySelectorAll('.sc-mb__z > b, .sc-mb__preis > b, .sc-hb__z > b').forEach(b => {
    const t = [...b.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)) || (b.firstElementChild && [...b.firstElementChild.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)));
    if (!t) return; const roh = t.nodeValue, m = roh.match(/\d[\d’'.]*/); if (!m) return;
    const ziel = +m[0].replace(/[’'.]/g, ''); if (!ziel) return;
    const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’'), t0 = performance.now(), d = 1100;
    const lauf = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 4); t.nodeValue = roh.replace(m[0], fmt(Math.round(ziel * e))); if (k < 1) requestAnimationFrame(lauf); else t.nodeValue = roh; };
    requestAnimationFrame(lauf);
  });
}
function mbKlappen(d, e) {
  e.preventDefault();
  if (d._laeuft) return;
  const k = d.dataset.mb, auf = !d.open;
  S.mbAuf = S.mbAuf || {}; S.mbAuf[k] = auf;
  if (RUHIG()) { d.open = auf; return; }
  d._laeuft = true;
  const hinter = document.createElement('span'); hinter.className = 'sc-mb__hinter'; hinter.setAttribute('aria-hidden', 'true');
  const glanz = document.createElement('span'); glanz.className = 'sc-mb__glanz'; glanz.setAttribute('aria-hidden', 'true'); glanz.innerHTML = '<i></i>';
  const vorher = d.getBoundingClientRect();
  if (auf) {
    weichFolgen(unterDem(d), () => { d.open = true; }, 950); d.classList.add('sc-mb--lauf'); d.prepend(hinter); d.append(glanz);
    const nachher = d.getBoundingClientRect();
    const ins = r => `inset(${Math.max(0, r.top - nachher.top)}px ${Math.max(0, nachher.right - r.right)}px ${Math.max(0, nachher.bottom - r.bottom)}px ${Math.max(0, r.left - nachher.left)}px round 28px)`;
    hinter.animate([{ clipPath: ins(vorher) }, { clipPath: 'inset(0px 0px 0px 0px round 28px)' }], { duration: 950, easing: MB_EASE });
    const teile = [d.querySelector('.sc-mb__kopf'), ...d.querySelectorAll('.sc-mb__weg li'), ...d.querySelectorAll('.sc-mb__z'), ...d.querySelectorAll('.sc-mb__h'), d.querySelector('.sc-mb__paket'), d.querySelector('.sc-mb__kn')].filter(Boolean);
    teile.forEach((t, i) => t.animate([{ opacity: 0, transform: 'translateY(22px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 760, delay: 260 + i * 45, easing: MB_EASE, fill: 'backwards' }));
    glanz.firstChild.animate([{ transform: 'translateX(-120%) skewX(-18deg)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translateX(320%) skewX(-18deg)', opacity: 0 }], { duration: 1500, delay: 180, easing: 'cubic-bezier(.5,0,.2,1)' });
    setTimeout(() => mbZaehlen(d), 420);
    setTimeout(() => { hinter.remove(); glanz.remove(); d.classList.remove('sc-mb--lauf'); d._laeuft = false; }, 260 + teile.length * 45 + 800);
  } else {
    /* Zuklappen (Robert 16.11.2026: «viel dynamischer zurück, und der Übergang von der blauen Kachel zur weissen deutlich besser»):
       1. Inhalt und Kopf blenden aus. 2. Die Box schliesst sofort, alles darunter gleitet im selben Takt hoch, während die dunkle Fläche
       sich auf die Leiste zusammenzieht. 3. Blau blendet langsam in Weiss über, der Text der Leiste schwebt herein. */
    const sm = d.querySelector(':scope > summary'), kopf = [...sm.children];
    const teile = [...d.querySelectorAll('.sc-mb__inhalt > *')].reverse();
    /* Glatt (Robert 16.11.2026: «1-2 Stellen noch ein bisschen ruckelig»): Inhalt ist ganz ausgeblendet, bevor die Box schliesst (nichts verschwindet halb sichtbar),
       Fläche und alles darunter laufen mit derselben weichen Kurve ohne Ruck am Start, Weiss und Schatten blenden über, solange die Fläche noch zieht. */
    const N = teile.length, ZK = 'cubic-bezier(.45,0,.1,1)', ZD = 900;
    teile.forEach((t, i) => t.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 260, delay: i * 20, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }));
    kopf.forEach(t => t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, delay: 80 + N * 20, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }));
    const t0 = Math.max(260 + (N - 1) * 20, 300 + N * 20) + 20;
    setTimeout(() => requestAnimationFrame(() => {
      const offen = d.getBoundingClientRect();
      d.classList.add('sc-mb--lauf');
      kopf.forEach(t => { t.style.opacity = '0'; t.getAnimations().forEach(a => a.cancel()); });
      weichFolgen(unterDem(d), () => { d.open = false; teile.forEach(t => t.getAnimations().forEach(a => a.cancel())); }, ZD, ZK);
      const zu = d.getBoundingClientRect();
      hinter.style.cssText = `inset:auto;top:${offen.top - zu.top}px;left:${offen.left - zu.left}px;width:${offen.width}px;height:${offen.height}px`;
      sm.prepend(hinter);   // ein geschlossenes <details> zeigt nur die Leiste: die Fläche muss darin liegen
      const ins = `inset(${zu.top - offen.top}px ${offen.right - zu.right}px ${offen.bottom - zu.bottom}px ${zu.left - offen.left}px round ${Math.round(zu.height / 2)}px)`;
      hinter.animate([{ clipPath: 'inset(0px 0px 0px 0px round 28px)' }, { clipPath: ins }], { duration: ZD, easing: ZK, fill: 'forwards' });
      setTimeout(() => {
        d.classList.remove('sc-mb--lauf');
        hinter.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
        kopf.forEach((t, i) => { t.style.opacity = ''; t.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 60 + i * 60, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }); });
        setTimeout(() => { hinter.remove(); glanz.remove(); d._laeuft = false; }, 900);
      }, ZD - 260);
    }), t0);
  }
}
/* Mini-Missionboard je Haus (Robert 16.11.2026: «dass das auch alles einzelne Missionboards sind und genauso geil aufklappen») */
function hausBoard(h) {
  const fo = fortschritt(h), a = akq(h), d = versandDaten(h), t = d.length ? tageSeit(d[d.length - 1]) : 0, pr = h.preis || {}, T = themenVon(h).length, ab = besprochen(h.id);
  const cur = preisCur(h), g = v => cur === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  const monat = betrag(pr.betreuung_website) + betrag(pr.abo_werkzeuge), zm = (pr.zeilen || []).filter(z => /Monat/.test(String(z[2] || '')));
  const einmal = pr.betrag ? g(pr.betrag) : (pr.gross || ((pr.zeilen || [])[0] || [])[1] || 'offen');
  const balken = (p, farbe) => `<span class="sc-mb__b"><i style="width:${Math.max(p, 3)}%${farbe ? ';background:' + farbe : ''}"></i></span>`;
  const zelle = (mk, gross, klein, extra = '') => `<div class="sc-hb__z"><span class="wo-mk">${esc(mk)}</span><b>${gross}</b>${extra}<small>${esc(klein)}</small></div>`;
  const pz = (x, mk) => x ? zelle(mk, `${x.p}<em> %</em>`, x.t || '', balken(x.p, x.p === 100 ? '#5aa36f' : '#d9c89c')) : '';
  const ap = (h.ansprechpartner || {}).name;
  return `<section class="sc-hb" aria-label="Missionboard ${esc(h.name)}">
    <header class="sc-hb__kopf"><span class="wo-mk">Missionboard · Akquise ${a.i + 1} von ${AKQ.length}</span><b>${esc(a.n)}</b><small>${esc(a.s)}</small>
      <ol class="sc-hb__weg" aria-hidden="true">${AKQ.map((x, i) => `<li class="${i < a.i ? 'ok' : i === a.i ? 'an' : ''}"></li>`).join('')}</ol></header>
    <div class="sc-hb__zahlen">
      ${zelle('Website', esc(einmal), pr.paket && pr.paket.einzeln ? 'im Familienpaket · einzeln ' + g(pr.paket.einzeln) : 'einmalig, netto')}
      ${zelle('Im Monat', monat ? esc(g(monat)) : esc((zm[0] || [])[1] || '–'), monat ? (pr.betreuung_website || '') + ' Betreuung · ' + (pr.abo_werkzeuge || '') + ' Werkzeuge' : ((zm[0] || [])[0] || 'monatlich'))}
      ${(() => { const L = versandLauf(d); return zelle(L && L.alt.length ? 'Seit dem Nachgang' : 'Seit dem Versand', `<span style="color:${versandFarbe(t)}">${t}</span><em> / 30 Tage</em>`, laufText(L, d), laufBalken(L, 'sc-mb__b')); })()}
      ${zelle('Ansprechpartner', `<span class="sc-hb__ap">${esc(ap || 'Noch niemand')}</span>`, (h.ansprechpartner || {}).rolle || (ap ? '' : 'Wird im Gespräch eingetragen'))}
      ${pz(fo.web, 'Website')}${pz(fo.bank, 'Werkbank')}${h.pitch ? pz(fo.wz, 'Werkzeuge') : ''}
    </div>
    <dl class="sc-hb__gs">${gsFeld(h)}</dl>
    ${S.preisEdit === h.id ? `<dl class="sc-hb__preisform">${preisTafel(h, true)}</dl>` : (S.server && (pr.betrag || pr.betreuung_website || nurWerkzeuge(h)) ? `<button type="button" class="sc-preis-kn sc-hb__preis" data-preis-aendern="${esc(h.id)}">Preise ändern</button>` : '')}
  </section>`;
}
/* Auf- und Zuklappen der Häuser-Boards: aus dem Knopf «Stand und Fortschritt» heraus aufgedeckt, Inhalt tritt nacheinander herein, Zahlen zählen; zu ruhig rückwärts */
const MB_ZU = 'cubic-bezier(.65,0,.25,1)';
/* Häuser-Kacheln (Robert 16.11.2026: «noch eleganter nach unten aufgehen»): jede Kachel rollt sich von oben nach unten auf wie ein Vorhang,
   eine nach der anderen, Zu: dieselbe Bewegung rückwärts nach oben. */
function unterDem(el) {
  const l = []; let e = el;
  while (e && e.id !== 'ansicht' && e !== document.body) { let n = e.nextElementSibling; while (n) { l.push(n); n = n.nextElementSibling; } e = e.parentElement; }
  return l;
}
function weichFolgen(els, tu, dauer = 760, kurve = MB_EASE) {
  const vor = els.map(x => x.getBoundingClientRect().top);
  tu();
  if (RUHIG()) return;
  els.forEach((x, i) => { const r = x.getBoundingClientRect(), dy = vor[i] - r.top; if (Math.abs(dy) < 1 || r.top > innerHeight * 2.5) return;
    x.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: dauer, easing: kurve }); });
}
function hbTeile(karte) { return [...karte.querySelectorAll('.sc-klapp > .sc-k, .sc-klapp > div, .sc-klapp > .sc-fortreihe')].filter(x => x.getBoundingClientRect().height > 0); }
/* Häuser-Kacheln auf und zu (Robert 16.11.2026: «viel zu ruckelig und wackelig»): eine einzige Bewegung wie eine Schublade.
   Alle Kacheln kommen unter «Stand und Fortschritt» hervor und gleiten an ihren Platz, Knöpfe und alles darunter gleiten im selben Takt mit.
   Nur transform und opacity, eine Dauer, eine Kurve. Zu: dieselbe Bewegung rückwärts, erst ganz am Ende springt das Layout um (unsichtbar). */
/* Die Schublade: EINE Bewegung für jedes Auf- und Zuklappen der Seite (Robert 16.11.2026: «jedes Aufklappen seitenweit luxuriös und edel nach den Vorbildern»).
   Vorbild Häuser-Kacheln: Inhalt kommt unter der Kante hervor und gleitet an seinen Platz, alles darunter gleitet im selben Takt mit.
   Zu: dieselbe Bewegung rückwärts, das Layout springt erst ganz am Ende um (unsichtbar). Nur transform und opacity. */
const SCH_AUF = [900, 'cubic-bezier(.5,0,.15,1)'], SCH_ZU = [720, 'cubic-bezier(.65,0,.35,1)'];
function schublade({ an, mit, teile = () => [], kante, umschalt, setze, huelle, bezug, fertig = () => {} }) {
  /* Vorhang statt Überblendung (Robert 16.11.2026: «darauf achten, dass sowas nicht passiert mit solchen krassen Überblendungen von solchen Flächen»):
     Nichts blendet ein oder aus, nichts liegt übereinander. Eine Kante wandert: oberhalb ist der Inhalt zu sehen, unterhalb nicht,
     und alles darunter gleitet genau mit dieser Kante. Die Hülle (Fläche mit Hintergrund) wird an derselben Kante abgeschnitten. */
  if (RUHIG()) { umschalt(); fertig(); return; }
  const anims = [], nah = y => y < innerHeight * 2.2 && y > -innerHeight;
  const [D, E] = an ? SCH_AUF : SCH_ZU;
  const vor = mit.map(x => x.getBoundingClientRect().top), hv = huelle ? huelle.getBoundingClientRect().height : 0;
  let nach, hn;
  if (an) { umschalt(); nach = mit.map(x => x.getBoundingClientRect().top); hn = huelle ? huelle.getBoundingClientRect().height : 0; }
  else { setze(false); nach = mit.map(x => x.getBoundingClientRect().top); hn = huelle ? huelle.getBoundingClientRect().height : 0; setze(true); }
  const dy = new Map(mit.map((x, i) => [x, nach[i] - vor[i]]));
  const H0 = Math.abs([...dy.values()].find(v => Math.abs(v) > 1) || 0);
  const Hvon = x => { const b = bezug && bezug(x); return b && dy.has(b) ? Math.abs(dy.get(b)) : H0; };
  const lauf = (el, frames) => anims.push(el.animate(an ? frames : frames.slice().reverse().map(f => ({ ...f, offset: f.offset == null ? null : 1 - f.offset })), { duration: D, easing: E, fill: an ? 'none' : 'forwards' }));
  mit.forEach((x, i) => { const d = dy.get(x); if (Math.abs(d) < 1 || !nah(vor[i]) && !nah(nach[i])) return;
    lauf(x, [{ transform: `translateY(${an ? -d : d}px)`, offset: 0 }, { transform: 'none', offset: 1 }]); });
  if (huelle) { const Hh = Math.abs(hv - hn), r = getComputedStyle(huelle).borderBottomLeftRadius || '0px';
    if (Hh > 1) lauf(huelle, [{ clipPath: `inset(0px 0px ${Hh}px 0px round 0px 0px ${r} ${r})`, offset: 0 }, { clipPath: `inset(0px 0px 0px 0px round 0px 0px ${r} ${r})`, offset: 1 }]); }
  teile().forEach(x => { const r = x.getBoundingClientRect(); if (!nah(r.top)) return; const H = Hvon(x); if (H < 1) return;
    const t0 = r.top - kante(x), a = Math.min(Math.max(t0 / H, 0), .999), b = Math.min(Math.max((t0 + r.height) / H, a + .001), 1);
    const zu = 'inset(0px 0px 100% 0px)', auf = 'inset(0px 0px 0% 0px)';
    const f = [{ clipPath: zu, offset: 0 }]; if (a > 0) f.push({ clipPath: zu, offset: a }); f.push({ clipPath: auf, offset: b }); if (b < 1) f.push({ clipPath: auf, offset: 1 });
    lauf(x, f); });
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
    if (!an) { umschalt(); anims.forEach(a => a.cancel()); }
    fertig();
  });
}
/* Nach dem Aufklappen gleitet die Seite so, dass das aufgeklappte Haus oben unter der Kopfleiste beginnt */
function zeigeGanz(el, nach) {   /* oben auf derselben Höhe wie die Seitenleiste (96 px) */
  const oben = 96, b = el.getBoundingClientRect();
  if (nach) { if (el._hoch && Math.abs(b.top - oben) > 3) scrollTo({ top: Math.max(0, scrollY + b.top - oben), behavior: RUHIG() ? 'auto' : 'smooth' }); el._hoch = false; return; }
  if (b.top >= oben - 4 && b.bottom <= innerHeight) return;
  el._hoch = true; scrollTo({ top: Math.max(0, scrollY + b.top - oben), behavior: RUHIG() ? 'auto' : 'smooth' });
}
function hausKlapp(reihe, reiheEl, an, umschalt, fertig) {
  schublade({ an, umschalt, fertig,
    mit: [...unterDem(reiheEl), ...reihe.flatMap(x => [...x.querySelectorAll('.sc-wege, .sc-zeile__kn')])],
    teile: () => [...reihe.flatMap(x => hbTeile(x)), ...reiheEl.querySelectorAll(':scope > .sc-fampaket')].filter(x => x.getBoundingClientRect().height > 0),
    kante: x => { const kn = (x.closest('.sc-karte, .sc-zeile') || reihe[0]).querySelector('[data-fort-auf]'); return kn ? kn.getBoundingClientRect().bottom : x.getBoundingClientRect().top; },
    setze: v => reihe.forEach(x => x.classList.toggle('auf', v)),
    bezug: x => { const k = x.closest('.sc-karte, .sc-zeile'); return k ? k.querySelector('.sc-wege, .sc-zeile__kn') : null; } });
}
/* Jedes <details> der Seite (ausser dem grossen Missionboard) öffnet und schliesst als Schublade */
function detailsTeile(d) {
  const k = [...d.children].filter(x => x.tagName !== 'SUMMARY');
  return k.flatMap(x => (/^(OL|UL|DL)$/.test(x.tagName) || k.length === 1) && x.children.length ? [...x.children] : [x]).filter(x => x.getBoundingClientRect().height > 0);
}
function detailsKlapp(d) {
  if (d._laeuft) return; d._laeuft = true;
  const an = !d.open, sm = d.querySelector(':scope > summary');
  d.classList.toggle('sc-schliesst', !an);
  schublade({ an, mit: unterDem(d), huelle: d, kante: () => sm.getBoundingClientRect().bottom,
    setze: v => { d.open = v; },
    umschalt: () => { d.open = an; if (an) d.dispatchEvent(new Event('toggle')); },
    fertig: () => { d.classList.remove('sc-schliesst'); d._laeuft = false; } });
}
if (!window.__scKlapp) {
  window.__scKlapp = true;
  document.addEventListener('click', e => {
    const sm = e.target.closest && e.target.closest('#ansicht details > summary'); if (!sm) return;
    const d = sm.parentElement; if (d.classList.contains('sc-mb')) return;
    if (e.target.closest('a[href], input, select, textarea') && e.target !== sm) return;
    e.preventDefault(); detailsKlapp(d);
  }, true);
}
/* Seitlich auf und zu (Seitenblatt «Parat im Gespräch», Seitenleiste links): die Fläche wächst aus dem runden Knopf heraus zum Blatt,
   der Inhalt schwebt nacheinander von der Seite herein; zu: Inhalt tritt zurück, die Fläche zieht sich in den Knopf zusammen. */
function seitKlapp({ el, an, setze, teile, von = 1, fertig = () => {} }) {
  if (RUHIG() || !el) { setze(an); fertig(); return; }
  const E = 'cubic-bezier(.5,0,.15,1)', R = r => Math.round(Math.min(r.width, r.height) / 2);
  const ins = (r, g, rad) => `inset(${r.top - g.top}px ${g.right - r.right}px ${g.bottom - r.bottom}px ${r.left - g.left}px round ${rad}px)`;
  const rund = () => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 28;
  if (an) {
    const knopf = el.getBoundingClientRect(); setze(true); const voll = el.getBoundingClientRect(), r0 = rund();
    el.animate([{ clipPath: ins(knopf, voll, R(knopf)) }, { clipPath: `inset(0px 0px 0px 0px round ${r0}px)` }], { duration: 860, easing: E });
    const t = teile(); t.forEach((x, i) => x.animate([{ opacity: 0, transform: `translateX(${18 * von}px)` }, { opacity: 1, transform: 'none' }], { duration: 640, delay: 200 + i * 40, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    setTimeout(fertig, 860 + t.length * 40);
  } else {
    const t = teile().reverse(), voll = el.getBoundingClientRect(), r0 = rund();
    t.forEach((x, i) => x.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${14 * von}px)` }], { duration: 240, delay: Math.min(i, 10) * 14, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }));
    setze(false); const knopf = el.getBoundingClientRect(); setze(true);
    const a = el.animate([{ clipPath: `inset(0px 0px 0px 0px round ${r0}px)` }, { clipPath: ins(knopf, voll, R(knopf)) }], { duration: 640, delay: 200, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    a.finished.catch(() => {}).then(() => { setze(false); a.cancel(); t.forEach(x => x.getAnimations().forEach(b => b.cancel())); fertig(); });
  }
}
function famPaketFeld(f) {
  const fh = famMappeHaus(f), h0 = fh && fh.haeuser[0], pk = h0 && (h0.preis || {}).paket;
  if (!pk || !pk.gesamt) return '<div class="sc-fort__f sc-ton--tinte"><span class="sc-fort__mk">Paketpreis</span><b class="sc-fort__arbeit">Offen</b><span class="sc-fort__t">Noch nicht festgelegt</span></div>';
  const EG = [...new Set(fh.haeuser.map(h => ((h.preis || {}).paket || {}).einzeln).filter(Boolean))].sort((a, b) => b - a), g = v => preisCur(h0) === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  return `<div class="sc-fort__f sc-ton--tinte"><span class="sc-fort__mk">Paketpreis</span><b class="sc-fort__arbeit">${esc(g(pk.gesamt))}</b><span class="sc-fort__t">${esc(fh.haeuser.length === 2 ? 'Beide Häuser' : 'Alle ' + fh.haeuser.length + ' Häuser')} mit Startseite · einzeln ${esc(EG.map(g).join(' oder '))}</span></div>`;
}
function famMonatFeld(f) {
  const fh = famMappeHaus(f), h0 = fh && fh.haeuser[0]; if (!h0) return '';
  const n = fh.haeuser.length, sum = monChf(paketPreis(h0, 1)) * n + monChf(paketPreis(h0, 2)) * n;
  return `<div class="sc-fort__f sc-ton--tinte"><span class="sc-fort__mk">Im Monat</span><b class="sc-fort__arbeit">CHF ${zahlCh(sum)}</b><span class="sc-fort__t">${esc(n === 2 ? 'Beide Häuser' : 'Alle ' + n + ' Häuser')}: je ${esc(paketPreis(h0, 1))} Betreuung und ${esc(paketPreis(h0, 2))} Werkzeuge</span></div>`;
}
function famBoard(f) {
  const fh = famMappeHaus(f); if (!fh) return '';
  const fs = familienStart(f), h0 = fh.haeuser[0] || {};
  return `<div class="sc-famboard"><dl>${gsFeld(fh)}</dl>
    <div class="sc-wege">${WO.knopf('Mappe öffnen', 'rechts', 'dunkel', { klein: true, attr: `data-gehe="familie:${esc(f.k)}"` })}${fs ? WO.knopf('Website öffnen', 'auge', 'gold', { klein: true, href: esc(fs[1]), neu: true }) : ''}</div></div>`;
}
const aufKnopf = () => `<button type="button" class="sc-fort-auf" data-fort-auf aria-expanded="false"><span>Stand und Fortschritt</span><i>${WO.ic('hoch')}</i></button>`;
function standLeiste(h) {
  const w = h.entwurf, wb = werkbank(h);
  const ort = u => lokal(u) ? 'Lokal, noch nicht online' : 'Online';
  let web;
  if (h.pitch) web = { b: 'Bleibt', s: 'Bei ihrer Agentur', u: h.website, l: 'Ihre Website' };
  else web = w ? { b: lokal(w) ? 'Lokal' : 'Online', s: [h.seiten ? mz(h.seiten, 'Seite', 'Seiten') : '', ort(w)].filter(Boolean).join(' · '), u: w, l: 'Website öffnen' } : { b: 'Noch offen', s: 'Noch keine Website gebaut' };
  const bank = wb ? { b: fortschritt(h).bank.p === 100 ? 'Geprüft' : 'Gebaut', s: ort(wb), u: wb, l: 'Werkbank öffnen' } : { b: h.werkbank_stand ? 'In Arbeit' : 'Noch offen', s: h.werkbank_stand ? 'Wird gerade gebaut' : 'Noch keine Werkbank' };
  let wz;
  if (h.pitch) { const n = (h.werkzeuge || []).length; wz = { b: n ? n + ' gebaut' : 'Noch offen', s: n ? 'Eigens für das Haus' : 'Noch nicht gebaut' }; }
  else {
    const sieben = siebenFuer(h), n = sieben.filter(x => x.gebaut).length, e = eigeneWerkzeuge(h).length;
    wz = n ? { b: n + ' von 7', s: 'Gebaut, mit eigenen Namen' + (e ? ' · ' + mz(e, 'eigenes', 'eigene') + ' dazu' : '') }
      : e ? { b: mz(e, 'Werkzeug', 'Werkzeuge'), s: 'Eigens für das Haus gebaut' }
      : { b: 'Noch offen', s: 'Vorführen am Beispiel ' + ((VORFUEHR(h) || {}).name || 'Grand Beau-Rivage') };
    const ei = sieben.find(x => x.url && !x.amBeispiel), bs = sieben.find(x => x.url);   // «Werkzeuge öffnen» nur auf ein Werkzeug des Hauses, sonst ehrlich «Beispiel öffnen»
    if (ei) { wz.u = ei.url; wz.l = 'Werkzeuge öffnen'; } else if (bs) { wz.u = bs.url; wz.l = 'Beispiel öffnen'; }
  }
  const f = fortschritt(h);
  const tafel = (t, x, an, fs) => `<div class="sc-stand__t${an ? ' an' : ''}"${fs && fs.teil ? ` data-pruef="${esc(h.id)}:${fs.teil}" role="button" tabindex="0" aria-label="${t}: was geprüft ist und was aussteht"` : ''}><span class="sc-stand__mk">${t}${fs && !istText(fs) ? `<em class="sc-ton--${tonX(fs)}">${fs.p}&#8239;%</em>` : ''}</span><b>${esc(fs && fs.arbeit ? wortX(fs) : x.b)}</b>${fs ? `<span class="sc-balken sc-balken--hell sc-ton--${tonX(fs)}" role="progressbar" aria-valuenow="${fs.p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(fs.p, 3)}%"></i></span>` : ''}<small>${esc(fs && !(t === 'Website' && fs.p === 100) ? fs.t : x.s)}</small>`
    + (x.u ? `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.l)}${pfeil()}</a>` : '<span class="sc-stand__leer">Noch nichts zu öffnen</span>') + '</div>';
  return `<div class="sc-stand" aria-label="Bearbeitungsstand">${tafel('Website', web, !!web.u, f.web)}${tafel('Werkbank', bank, !!wb, f.bank)}${tafel('Werkzeuge', wz, /von|gebaut|Werkzeug/.test(wz.b), f.wz)}</div>`;
}
/* Startbild der Mappe: Knöpfe, darunter die drei Stände nebeneinander, alles im Startbild */
const mitStand = (sb, h) => sb.replace(/<\/div><\/section>$/, standLeiste(h) + '</div></section>');

/* ---------------------------------------------------------------- Übersicht: die offenen Häuser */
function hausZeile(h, i) {
  const g = gespraech(h.id), st = g && g.stand, T = themenVon(h).length, b = besprochen(h.id);
  const zuletzt = st && (st.ergebnis || st.datum) ? `${st.datum ? datum(st.datum) + ': ' : ''}${st.ergebnis || 'Gespräch eingetragen'}` : 'Noch kein Gespräch eingetragen';
  return `<article class="sc-zeile" data-r style="--i:${i % 4}">
    <div class="sc-zeile__bild"${FEIN && (h.entwurf || (h.pitch && werkbank(h))) ? '' : ` data-gehe="haus:${esc(h.id)}" role="button" tabindex="0" aria-label="Mappe ${esc(h.name)} öffnen"`}>${geraet(h.schirm, h.name, '', '', h.entwurf || (h.pitch ? werkbank(h) : ''))}</div>
    <div class="sc-zeile__text">
      <span class="wo-mk">${esc([h.art, h.ort].filter(Boolean).join(' · '))}${lokal(h.entwurf) ? ' · nur lokal' : ''}</span>
      <h3><button type="button" data-gehe="haus:${esc(h.id)}">${esc(h.name)}</button>${haken(h)}</h3>
      <p class="sc-klapp">${esc(kurz(h.kurz, 170))}</p>
      ${aufKnopf()}
      <div class="sc-zeile__kn">${dreiWege(h, true)}</div>
    </div>
    <dl class="sc-zeile__fakten sc-klapp">
      ${akqTafel(h)}${versandTafel(h)}${besuchTafel(h)}<div class="sc-k"><dt>Ansprechpartner</dt><dd>${esc((h.ansprechpartner || {}).name || 'Noch niemand')}</dd></div>
      ${preisTafel(h)}
      ${fsZeilen(h)}
      ${gsFeld(h)}
    </dl>
  </article>`;
}
/* Familie wie im Atelier der Agentur-Seite (seite/work.html): oben die gemeinsame Startseite im Laptop mit «Die gemeinsame Startseite ansehen»,
   darunter die Linien zu den Häusern der Familie (Robert 09.11.2026: «oberhalb die Familienseite und dann die Verbindung von den anderen Seiten darunter»).
   Bilder der Familienseiten: familien/schirm-familie-<k>.webp, aufgenommen 09.11.2026 aus den Familienseiten selbst. */
function familieBlock(f) {
  const l = f.ids.map(haus).filter(h => h && offen(h) && sichtbar(h)), fs = familienStart(f), T = (W.themen || []).length, pk = '';   // Familienpaket steht im Missionboard (16.11.2026)
  return `<div class="sc-familie" data-r>
    <header class="sc-familie__kopf"><h3>${zwei(f.t[0], f.t[1])}</h3><p>${esc(f.s)}</p></header>
    <div class="sc-baum">
      <div class="sc-baum__oben">${geraet('familien/schirm-familie-' + f.k + '.webp', 'Gemeinsame Startseite der ' + f.t[0].replace(/\.$/, ''), 'sc-baum__geraet', fs ? fs[1] : '', FEIN && fs ? fs[1] : '')}
        ${famMission(f)}</div>
      ${l.length === 1 ? `<div class="sc-karten sc-karten--eins" style="--n:1">${hausZeile(l[0], 0)}</div>` /* nur ein Haus (z. B. im Filter): als Zeile wie die einzelnen Häuser, nicht als riesige Karte */
      : `<div class="sc-karten${pk ? ' sc-karten--paket' : ''}" style="--n:${l.length}">${l.map((h, i) => { const b = besprochen(h.id);
        return `<article class="sc-karte" style="--c:${i + 1}">
          <div class="sc-karte__bild"${FEIN && (h.entwurf || (h.pitch && werkbank(h))) ? '' : ` data-gehe="haus:${esc(h.id)}" role="button" tabindex="0" aria-label="Mappe ${esc(h.name)} öffnen"`}>${geraet(h.schirm, h.name, '', '', h.entwurf || (h.pitch ? werkbank(h) : ''))}</div>
          <span class="wo-mk">${esc(h.ort || '')}${lokal(h.entwurf) ? ' · nur lokal' : ''}</span>
          <h4><button type="button" data-gehe="haus:${esc(h.id)}">${esc(h.name)}</button>${haken(h)}</h4>
          ${aufKnopf()}
          <dl class="sc-klapp">${akqTafel(h)}${versandTafel(h)}${besuchTafel(h)}${preisTafel(h, true)}
            ${fsZeilen(h)}
            ${gsFeld(h)}</dl>
          ${dreiWege(h, true)}
        </article>`; }).join('')}${pk}</div>`}
    </div>
  </div>`;
}
/* Familienpaket einmal je Familie unter den Karten statt in jeder Karte (Robert 15.11.2026: «nicht 4 × die Info … einmal Zusammenfassung für alle reicht», «bei allen, wo es so ist») */
function famPaket(l) {
  const mit = l.filter(h => h.preis && h.preis.paket && h.preis.paket.gesamt); if (!mit.length) return '';
  const p = mit[0].preis.paket, cur = preisCur(mit[0]), f = v => cur === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  const wer = p.haeuser === 2 ? 'Beide Häuser' : 'Alle ' + p.haeuser + ' Häuser';
  const G = new Map(); mit.forEach(h => { const e = h.preis.paket.einzeln; if (e) { if (!G.has(e)) G.set(e, []); G.get(e).push(h.name); } });
  const einzeln = G.size === 1 ? [['Einzeln', 'Website je Haus', [...G.keys()][0]]]
    : [...G.entries()].sort((a, b) => b[0] - a[0]).map(([e, n]) => ['Einzeln', n.join(', '), e]);
  return `<dl class="sc-k sc-fampaket"><dt>Familienpaket</dt><dd><ul class="sc-preise sc-fampaket__reihe"><li><span>Paketpreis</span><b>${f(p.gesamt)}</b><small>${wer} mit gemeinsamer Startseite</small></li>${einzeln.map(([t, s, v]) => `<li><span>${esc(t)}</span><b>${f(v)}</b><small>${esc(s)}</small></li>`).join('')}</ul></dd></dl>`;
}
/* Filter (Robert 11.11.2026): «alle Häuser nur anzeigen lassen, wo ich noch nicht bei 100 % bin bei irgendwas»
   Noch offen = Website, Werkbank oder (bei «Nur Werkzeuge») die Werkzeuge unter 100 %, in Arbeit, ungeprüft oder noch nicht da */
const nochOffen = h => { const f = fortschritt(h); return [f.web, f.bank, h.pitch ? f.wz : null].some(x => x && (x.arbeit || x.p < 100)); };
const sichtbar = h => S.filter !== 'offen' || nochOffen(h);
function filterLeiste(o) {
  const n = o.filter(nochOffen).length, an = k => S.filter === k || (k === 'alle' && S.filter !== 'offen');
  const kn = (k, t, z) => `<button type="button" class="sc-filter__kn${an(k) ? ' an' : ''}" data-filter="${k}" aria-pressed="${an(k) ? 'true' : 'false'}"><span>${t}</span><b>${z}</b></button>`;
  return `<div class="sc-filter" role="group" aria-label="Häuser filtern"><span class="sc-filter__mk">Anzeigen</span><div class="sc-filter__wahl">${kn('alle', 'Alle Häuser', o.length)}${kn('offen', 'Noch nicht bei 100 %', n)}</div>`
    + `<p class="sc-filter__satz">${S.filter === 'offen' ? `${mz(n, 'Haus', 'Häuser')}, bei denen Website, Werkbank oder Werkzeuge noch nicht bei 100 % stehen.` : 'Alle Häuser ohne Vertrag, nach Sparte und Familie.'}</p></div>`;
}
/* Monatlich wiederkehrend, wenn alle offenen Häuser Betreuung und Werkzeuge nehmen: je Teil getrennt, Beträge aus «Kunden».
   Werkzeuge: preis.abo_werkzeuge, bei «Nur Werkzeuge» die Zeile «Werkzeuge mit Betreuung». Häuser in Euro (Angelina) stehen getrennt dabei. */
const betrag = t => { const m = String(t || '').replace(/[’']/g, '').match(/(\d[\d.]*)/); return m ? +m[1].replace(/\./g, '') : 0; };
function monatsLage(o) {
  const web = o.filter(h => monChf((h.preis || {}).betreuung_website)), wz = o.map(h => { const pr = h.preis || {}; const z = (pr.zeilen || []).find(x => /Werkzeuge mit Betreuung/.test(x[0]));
    return pr.abo_werkzeuge && monChf(pr.abo_werkzeuge) ? [h, monChf(pr.abo_werkzeuge)] : z && monChf(z[1]) ? [h, monChf(z[1])] : null; }).filter(Boolean);
  const sw = web.reduce((a, h) => a + monChf(h.preis.betreuung_website), 0), sz = wz.reduce((a, x) => a + x[1], 0);
  return `${lg('Betreuung', 'CHF ' + zahl(sw), 'im Monat, ' + web.length + ' Häuser mit Website')}
      ${lg('Werkzeuge', 'CHF ' + zahl(sz), 'im Monat, ' + wz.length + ' Häuser')}
      ${lg('Zusammen', 'CHF ' + zahl(sw + sz), 'im Monat, rein rechnerisch')}`;
}
/* Grundannahmen zum Aufklappen (Robert 11.11.2026: «wie sich die Zahlen zusammensetzen bei einmalig, Betreuung, Werkzeuge»): je Zahl Anzahl × Betrag, mit den Häusern */
/* Wie sich die Zahlen zusammensetzen (Robert 11.11.2026: «übersichtlich, alles auf einer Höhe … der Bezug zu den darüberliegenden Feldern auf den ersten Blick»):
   dieselben sechs Spalten wie die Zahlenzeile darüber. Links (unter Offen und Fällig) die Gruppen, rechts je Gruppe Anzahl × Betrag genau unter Einmalig,
   Betreuung, Werkzeuge und Zusammen; die letzte Zeile ergibt die Zahl im Feld darüber. Geöffnet wird mit dem Pfeil mittig in der Zahlenzeile. */
/* Fussnote der Grundannahmen aus denselben Zahlen wie die Häuser (Robert 14.11.2026) */
const nurWzText = () => { const h = kunden().find(x => x.pitch && x.preis); const z = h && (h.preis.zeilen || []).find(x => /Werkzeug/.test(x[0])); return z ? z[1] : 'CHF 350'; };
function annahmenText() {
  const ho = segmentPreise('hotel') || { e: [10000, 10000], b: [350, 350], w: [500, 500] }, ga = segmentPreise('gastro') || { e: [5000, 5000], b: [350, 350], w: [500, 500] };
  const st = s => s ? spanneText(s) : 'offen', mon = v => `Betreuung ${st(v.b)} und Werkzeuge ${st(v.w)} im Monat`;
  return `Hotel ${st(ho.e)}, Restaurant ${st(ga.e)} einmalig; Hotel ${mon(ho)}, Restaurant ${mon(ga)} (Nur Werkzeuge ${nurWzText()})`;
}
/* Wer bei Einmalig, Betreuung und Werkzeuge nicht mitgezählt ist (Korrektur 15.11.2026: «19 offen, aber 16 / 17 / 18» verständlich machen) */
function werFehlt(o) {
  const ohne = (f, l) => { const n = o.filter(h => !f(h)).map(h => h.name); return n.length ? l + ' ohne ' + n.join(', ') : ''; };
  const pr = h => h.preis || {}, wzM = h => { const z = (pr(h).zeilen || []).find(x => /Werkzeuge mit Betreuung/.test(x[0])); return monChf(pr(h).abo_werkzeuge) || (z && monChf(z[1])); };
  const t = [ohne(h => offenesAngebot(h), 'Einmalig'), ohne(h => monChf(pr(h).betreuung_website), 'Betreuung'), ohne(wzM, 'Werkzeuge')].filter(Boolean);
  return t.length ? ' Von den ' + o.length + ' offenen Häusern nicht mitgezählt, weil dort für diesen Teil kein Betrag steht: ' + esc(t.join('; ')) + '.' : '';
}
function grundannahmen(o) {
  const chf = t => /CHF/.test(t || '');
  const wert = h => { const pr = h.preis || {}, z = (pr.zeilen || []).find(x => /Werkzeuge mit Betreuung/.test(x[0]));
    const eur = preisCur(h) === '€' ? { e: pr.betrag && offen(h) ? pr.betrag : 0, b: betrag(pr.betreuung_website), w: betrag(pr.abo_werkzeuge) } : null;   // Ursprungsbetrag in Euro (Robert 16.11.2026: «Preise in EUR klein dazu, sonst checkt man nicht»)
    return { e: pr.betrag && offen(h) ? inChf(h) : 0, b: monChf(pr.betreuung_website),
      w: pr.abo_werkzeuge && monChf(pr.abo_werkzeuge) ? monChf(pr.abo_werkzeuge) : z ? monChf(z[1]) : 0, eur }; };
  const art = h => h.pitch ? 'Nur Werkzeuge' : sparte(h) === 'gastro' ? 'Restaurants' : sparte(h) === 'hotel' ? 'Hotels' : 'Weitere';
  const G = new Map(), ohne = [];
  o.forEach(h => { const v = wert(h); if (!v.e && !v.b && !v.w) { ohne.push(h); return; } const k = [art(h), v.e, v.b, v.w].join('|'); if (!G.has(k)) G.set(k, { t: art(h), v, l: [] }); G.get(k).l.push(h); });
  const gr = [...G.values()].sort((a, b) => b.v.e - a.v.e || b.v.w - a.v.w);
  const sum = f => gr.reduce((a, g) => a + g.l.length * f(g.v), 0);
  const se = sum(v => v.e), sb = sum(v => v.b), sw = sum(v => v.w);
  const feld = (n, b, kl = '', eu) => b ? `<div class="sc-ann2__w ${kl}"><small>${n} × CHF ${zahl(b)}</small><b>CHF ${zahl(n * b)}</b>${eu ? `<small class="sc-ann2__eur">aus ${zahlCh(n * eu).replace(/’/g, '.')} €</small>` : ''}</div>` : `<div class="sc-ann2__w sc-ann2__w--leer ${kl}"><b>–</b></div>`;
  const reihe = (g, i) => { const n = g.l.length, namen = g.l.map(h => h.name).join(', ');
    return `<div class="sc-ann2__r${i % 2 ? ' sc-ann2__r--hell' : ''}"><div class="sc-ann2__k"><b>${esc(g.t)}<em>${n}</em></b><small title="${esc(namen)}">${esc(namen)}</small></div>`
      + feld(n, g.v.e, '', g.v.eur && g.v.eur.e) + feld(n, g.v.b, '', g.v.eur && g.v.eur.b) + feld(n, g.v.w, '', g.v.eur && g.v.eur.w) + feld(n, g.v.b + g.v.w, 'sc-ann2__w--zus', g.v.eur && (g.v.eur.b + g.v.eur.w)) + '</div>'; };
  const kopf = `<div class="sc-ann2__r sc-ann2__r--kopf"><div class="sc-ann2__k"><span>Gruppe · Häuser</span></div><div><span>Einmalig</span></div><div><span>Betreuung im Monat</span></div><div><span>Werkzeuge im Monat</span></div><div><span>Zusammen im Monat</span></div></div>`;
  const summe = `<div class="sc-ann2__r sc-ann2__r--summe"><div class="sc-ann2__k"><b>Summe</b><small>gleich den Feldern oben</small></div>`
    + `<div class="sc-ann2__w"><b>CHF ${zahl(se)}</b></div><div class="sc-ann2__w"><b>CHF ${zahl(sb)}</b></div><div class="sc-ann2__w"><b>CHF ${zahl(sw)}</b></div>`
    + `<div class="sc-ann2__w sc-ann2__w--zus"><b>CHF ${zahl(sb + sw)}</b><small>im Monat</small></div></div>`;
  /* Ergibt insgesamt (Robert 11.11.2026: «einen insgesamten Wert, mit dem wir starten können»): einmalig plus zwölf Monate Betreuung und Werkzeuge = erstes Jahr */
  const mon = sb + sw;
  const gesamt = `<div class="sc-ann2__r sc-ann2__r--gesamt"><div class="sc-ann2__k"><b>Rechnerisch zum Start</b><small>wenn alle zusagen; danach CHF ${zahl(mon)} im Monat</small></div>`
    + `<div class="sc-ann2__w"><small>einmalig</small><b>CHF ${zahl(se)}</b></div>`
    + `<div class="sc-ann2__w sc-ann2__w--breit"><small>+ Betreuung und Werkzeuge, erster Monat</small><b>+ CHF ${zahl(mon)}</b></div>`
    + `<div class="sc-ann2__w sc-ann2__w--zus"><small>zum Start</small><b>= CHF ${zahl(se + mon)}</b></div></div>`;
  /* Hinweis (Robert 11.11.2026: «rein hypothetische Zahlen … auf Grundlage von angenommenen Verkaufspreisen und Paketpreisen, die ich jetzt erstmal festgelegt habe») */
  const hinweis = `<p class="sc-ann2__hinweis"><b>Nur eine Rechnung</b>So viel käme zusammen, wenn jedes offene Haus zu den heute angenommenen Preisen zusagt. Das ist kein Ziel und keine Erwartung: Die Preise sind vorläufig und noch mit niemandem besprochen, und nicht jedes Haus wird zusagen. Die Tabelle zeigt nur, wie sich die Zahlen oben zusammensetzen.</p>`;
  return `<div class="sc-ann2" id="sc-ann2"${S.annAuf ? '' : ' hidden'}>${hinweis}${kopf}${gr.map(reihe).join('')}${summe}${gesamt}
    <p class="sc-ann2__fuss">Angenommene Preise: ${annahmenText()}, alles netto. Angebote in Euro, einmalig und im Monat, zum Kurs der Schweizerischen Nationalbank umgerechnet (1 EUR = CHF ${String(EUR_CHF).replace('.', ',')}).${werFehlt(o)}</p></div>`;
}
function start() {
  const o = offene(), heute = S.d.heute || '';
  const faellig = o.map(h => [h, gespraech(h.id)]).filter(([, g]) => g && g.stand && g.stand.vereinbart_datum && g.stand.vereinbart_datum <= heute);
  const mitPreis = o.filter(offenesAngebot);
  return `${WO.startbild({ werkzeug: ORDNER, art: 'voll', foto: FOTO('bildschirm'), h1: `${esc(WO.gruss().replace(/\.$/, ''))}, ${esc(WER())}. <em>Wen rufen wir heute an?</em>`, zier: esc('Sales Cockpit · ' + datum(heute)),
      satz: 'Alle Häuser, die noch kein Kunde sind. Je Haus eine Mappe für das Gespräch: die Website, die Werkzeuge und was das Haus damit kann, das Angebot, die Betreuung, der Ablauf und die Antworten auf die Fragen, die kommen.',
      knoepfe: WO.knopf('Zu den Häusern', 'rechts', 'gold', { attr: 'data-sprung="sc-haeuser"' }) + WO.knopf('Antworten', 'chat', 'glas', { attr: 'data-gehe="antworten"' }) })}
    <div class="wo-lage sc-lage sc-lage--eins${S.annAuf ? ' auf' : ''}" data-r>
      ${lg('Offen', zahl(o.length), 'ohne Vertrag')}
      ${lg('Fällig', zahl(faellig.length), faellig.length ? faellig.map(([h]) => h.name).join(', ') : 'Rückrufe heute')}
      ${lg('Einmalig', summe(mitPreis).join('<br>') || '–', mitPreis.length + ' Häuser mit festem Betrag')}
      ${monatsLage(o)}
      <button type="button" class="sc-lage__auf" data-ann-auf aria-expanded="${S.annAuf ? 'true' : 'false'}" aria-controls="sc-ann2" title="Wie sich die Zahlen zusammensetzen"><i>${WO.ic('hoch')}</i></button>
    </div>
    ${grundannahmen(o)}
    ${faellig.length ? `<section class="sc-block">${kopfBlock(['Heute', 'fällig.'], 'Was im Gespräch für heute oder früher vereinbart wurde.')}
      <ol class="sc-reihen" data-r>${faellig.map(([h, g]) => `<li><button type="button" data-gehe="haus:${esc(h.id)}"><span class="sc-reihen__wer"><b>${esc(h.name)}</b><small>${esc(datum(g.stand.vereinbart_datum))}</small></span><span class="sc-reihen__was">${esc(g.stand.vereinbart || 'Vereinbart im Gespräch')}</span><i>${pfeil()}</i></button></li>`).join('')}</ol></section>` : ''}
    <div id="sc-haeuser" class="sc-anker">${filterLeiste(o)}${S.filter === 'offen' && !o.some(nochOffen) ? '<p class="sc-filter__leer">Alles steht bei 100 %. Nichts mehr zu tun.</p>' : ''}${SPARTEN.map(([sp, titel, satz]) => { const alle = o.filter(h => sparte(h) === sp && sichtbar(h)); if (!alle.length) return '';
      const einzelnAlle = alle.filter(h => !familieVon(h)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
      const einzeln = einzelnAlle.filter(h => !h.pitch), nurWz = einzelnAlle.filter(h => h.pitch);   // Website bleibt beim Haus, es geht nur um die Werkzeuge
      const fam = FAMILIEN.filter(f => f.sparte === sp && f.ids.some(id => alle.some(h => h.id === id)));
      return `<section class="sc-block">${kopfBlock([titel, sp === 'weitere' ? (alle.length === 1 ? 'Eine Gastgeberin' : alle.length + ' Gastgeberinnen') : mz(alle.length, 'Haus', 'Häuser')], satz + (fam.length ? ', die Häuser einer Familie zusammen, wie im Atelier.' : '.'))}
        ${fam.map(familieBlock).join('')}
        ${einzeln.length ? `${fam.length ? '<p class="wo-mk sc-einzeln">Einzelne Häuser</p>' : ''}<div class="sc-liste">${einzeln.map(hausZeile).join('')}</div>` : ''}
        ${nurWz.length ? `<div class="sc-nurwz"><p class="wo-mk sc-einzeln">Nur Werkzeuge</p><p class="sc-nurwz__satz">Die Website des Hauses ist schon gut. Hier geht es um die Werkzeuge und die Zusammenarbeit.</p><div class="sc-liste">${nurWz.map(hausZeile).join('')}</div></div>` : ''}</section>`; }).join('')}</div>
    <p class="sc-quelle">Quelle: Werkzeug «Kunden» (alle Häuser ohne Vertrag) · Gespräche: im Sales Cockpit gespeichert</p>`;
}

/* ---------------------------------------------------------------- Die Präsentation als PDF (Robert 16.11.2026: «statt diesem Brief … PDF Dateien nach Vorbild Uncle Hung / Maeder»)
   Hefte baut heft/bau_hefte.py (Vorlage Uncle Hung praesi/heft.html), Verzeichnis heft/hefte.js (heft/verzeichnis.py). */
const HEFTE = window.TASTY_HEFTE || {}, WESEN = window.TASTY_WESEN || {};
const briefDa = h => !!(h && HEFTE[h.id]);
function heftBlock(x, name, online, id) {
  /* kompakt (Robert 16.11.2026: «zu viel Leerraum, die Präsentation muss nicht so krass gross und breit sein») */
  return `<section class="sc-block sc-praes" id="${id || 'brief'}">
          <div class="sc-praes__k" data-r>
            <a class="sc-praes__bild" href="${esc(x.pdf)}" target="_blank" rel="noopener" aria-label="Präsentation ${esc(name)} öffnen"><img src="${esc(x.bild)}" alt="Erste Seite der Präsentation ${esc(name)}" loading="lazy" decoding="async"></a>
            <div class="sc-praes__text"><span class="wo-mk">Die Präsentation · ${x.seiten} Seiten als PDF</span><h3>${esc(name)}</h3>
              <p>Vorab, die Website, die Werkzeuge, der Preis und der Weg zum Entwurf. ${online ? 'Der Code auf der letzten Seite führt direkt zum Entwurf.' : 'Der Code auf der letzten Seite folgt, sobald die Website online ist.'} Ansprechpartner und Wortlaut gehen wir vor dem Versand gemeinsam durch.</p>
              <div class="sc-brief__kn">${WO.knopf('Präsentation öffnen', 'pfeil', 'gold', { klein: true, href: x.pdf, neu: true })}${WO.knopf('Herunterladen', 'pdf', 'dunkel', { klein: true, href: x.pdf, attr: 'download' })}</div></div>
          </div>
        </section>`;
}
function briefBlock(h) {
  if (!briefDa(h)) return '';
  return heftBlock(HEFTE[h.id], h.name, /^https:/.test(h.entwurf || ''));
}
/* «Was ist das für ein Haus» am Anfang jeder Mappe, bei Familien «Wer gehört dazu» (Robert 16.11.2026), Texte in wesen.js */
function wesenBlock(key, haeuser) {
  const w = WESEN[key]; if (!w) return '';
  const unten = haeuser ? `<div class="sc-wesen__haeuser">${haeuser.map(h => `<button type="button" data-gehe="haus:${esc(h.id)}"><b>${esc(h.name)}</b><small>${esc([h.art, (h.ort || '').split(' · ')[0]].filter(Boolean).join(' · '))}</small><i>${WO.ic('rechts')}</i></button>`).join('')}</div>`
    : (w.f ? `<dl class="sc-wesen__f">${w.f.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>` : '');
  const G = window.TASTY_GESICHTER || {}, gesehen = new Set();
  const leute = (haeuser ? haeuser.map(h => h.id) : [key]).flatMap(id => G[id] || []).filter(x => !gesehen.has(x[1]) && gesehen.add(x[1]));
  const reihe = leute.length ? `<div class="sc-wesen__leute">${leute.map(([b, n, r]) => `<div class="sc-wesen__mensch"><img src="${esc(b)}" alt="${esc(n)}" loading="lazy" decoding="async"><span><b>${esc(n)}</b>${r ? `<small>${esc(r)}</small>` : ''}</span></div>`).join('')}</div>` : '';
  return `<section class="sc-block sc-wesen" id="wesen">
          <div class="sc-wesen__k" data-r><div class="sc-wesen__p"><span class="wo-mk">${haeuser ? 'Wer gehört dazu' : 'Was ist das für ein Haus'}</span><b>${esc(w.t)}</b>${w.p.map(x => `<p>${esc(x)}</p>`).join('')}</div>${unten}${reihe}</div>
        </section>`;
}

/* ---------------------------------------------------------------- Die Mappe eines Hauses */
/* Preise im Seitenblatt: je Zeile Bezeichnung, Betrag, wofür (gleiche Quelle wie die Kachel der Übersicht) */
function parPreise(h) {
  const pr = h.preis || {};
  const z = Array.isArray(pr.zeilen) && pr.zeilen.length ? pr.zeilen
    : [['Website', (pr.gross || '').trim(), 'netto, einmalig'], ['Betreuung Website', pr.betreuung_website, 'im Monat'], ['Werkzeuge im Abo', pr.abo_werkzeuge, 'im Monat']].filter(x => x[1]);
  return z.length ? `<ul class="sc-parpreise">${z.map(([t, b, n]) => `<li><span>${esc(t)}<small>${esc(n || '')}</small></span><b>${esc(b)}</b></li>`).join('')}</ul><small>Monatspreise monatlich kündbar</small>` : 'Noch nicht festgelegt';
}
function parat(h) {
  const ap = h.ansprechpartner || {}, g = gespraech(h.id), st = (g && g.stand) || {}, p1 = paketPreis(h, 1), p2 = paketPreis(h, 2), T = themenVon(h).length;
  const wb = werkbank(h), tel = st.telefon || ap.telefon;
  return `<aside class="sc-parat" aria-label="Parat im Gespräch">
    <button type="button" class="sc-parat__auf" data-parat-auf aria-expanded="${S.paratZu ? 'false' : 'true'}" aria-label="Parat im Gespräch ein- oder ausklappen"><span class="wo-mk">Parat im Gespräch</span><i>${WO.ic('hoch')}</i></button>
    <div class="sc-parat__inhalt">
    <dl>
      <div><dt>Akquise · ${akq(h).i + 1} von ${AKQ.length}</dt><dd>${esc(akq(h).n)}<small>${esc(akq(h).s)}</small></dd></div>
      ${versandTafel(h, 'sc-parat__versand')}
      <div><dt>Ansprechpartner</dt><dd>${esc(st.partner || ap.name || 'Noch niemand')}${ap.rolle && !st.partner ? `<small>${esc(ap.rolle)}</small>` : ''}${tel ? `<a href="tel:${esc(tel.replace(/\s/g, ''))}">${esc(tel)}</a>` : ''}${ap.mail ? `<a href="mailto:${esc(ap.mail)}">${esc(ap.mail)}</a>` : ''}</dd></div>
      <div class="sc-parat__preise"><dt>Preise</dt><dd>${parPreise(h)}</dd></div>
      ${(h.merken || []).length ? `<div class="sc-parat__merken"><dt>Im Gespräch beachten</dt><dd>${h.merken.map(m => `<small>${esc(m)}</small>`).join('')}</dd></div>` : ''}
      ${familieVon(h) ? `<div><dt>${esc(familieVon(h).t[0].replace(/\.$/, ''))}</dt><dd class="sc-parat__fam">${familieVon(h).ids.filter(x => x !== h.id).map(haus).filter(Boolean).map(x => `<button type="button" data-gehe="haus:${esc(x.id)}">${esc(x.name)}</button>`).join('')}</dd></div>` : ''}
      ${h.pitch ? `<div><dt>Die Website</dt><dd>Bei ihrer Agentur<small>neu seit Frühjahr 2026</small></dd></div>` : `<div><dt>Bis online</dt><dd>Ein bis zwei Wochen<small>je nachdem, wie schnell das Feedback des Hauses kommt</small></dd></div>`}
      <div><dt>Besprochen</dt><dd><span class="sc-balken sc-balken--hell" aria-hidden="true"><i style="width:${Math.round(100 * besprochen(h.id) / T)}%"></i></span>${besprochen(h.id)} von ${T}${st.vereinbart_datum ? `<small>Vereinbart für ${esc(datum(st.vereinbart_datum))}</small>` : ''}</dd></div>
    </dl>
    <div class="sc-parat__kn">${h.entwurf ? WO.knopf('Website zeigen', 'auge', 'gold', { klein: true, href: h.entwurf, neu: true }) : ''}${wb ? WO.knopf('Werkbank', 'pfeil', 'glas', { klein: true, href: wb, neu: true }) : ''}${familienseite(h) ? WO.knopf('Familie', 'haus', 'glas', { klein: true, href: familienseite(h)[1], neu: true }) : ''}${h.pitch && h.website ? WO.knopf('Ihre Website', 'auge', 'glas', { klein: true, href: h.website, neu: true }) : ''}</div>${!wb && h.werkbank_stand ? `<p class="sc-parat__fein">${esc(h.werkbank_stand)}</p>` : ''}
    <nav class="sc-parat__nav" aria-label="In der Mappe">${(h.pitch ? WZ_MAPPE_NAV : [['website', 'Die Website'], ['werkzeuge', 'Die Werkzeuge'], ['angebot', 'Das Angebot'], ['ablauf', 'Der Ablauf'], ['fragen', 'Fragen und Antworten'], ...(briefDa(h) ? [['brief', 'Die Präsentation']] : []), ['gespraech', 'Das Gespräch']]).map(([k, t]) => `<a href="#${k}" data-sprung="${k}">${esc(t)}${WO.ic('rechts')}</a>`).join('')}</nav>
    </div>
  </aside>`;
}
/* Mappe für Häuser ohne Website-Auftrag (Robert 09.11.2026, Europäischer Hof: «da nicht um Website geht, sondern … um die Tools …, um die Zusammenarbeit und das Netzwerk»).
   Inhalt aus «Kunden» (pitch), Werkzeuge und Antworten wie in der grossen Mappe, nur die Werkzeuge, die das Haus bekommt. */
const WZ_MAPPE_NAV = [['lage', 'Die Ausgangslage'], ['werkzeuge', 'Die Werkzeuge'], ['netzwerk', 'Zusammenarbeit'], ['angebot', 'Das Angebot'], ['ablauf', 'Der Ablauf'], ['fragen', 'Fragen und Antworten'], ['gespraech', 'Das Gespräch']];
function mappeWerkzeuge(h) {
  const P = h.pitch, wahl = (P.werkzeuge || []).map(w => w[0]), satz = k => ((P.werkzeuge || []).find(w => w[0] === k) || [])[1] || '';
  const drei = siebenFuer(h).filter(x => wahl.includes(x.s.k)).sort((a, b) => wahl.indexOf(a.s.k) - wahl.indexOf(b.s.k));
  const S2 = P.schulung || {}, N = P.netzwerk || {};
  const wahrSatz = (t, p) => `<div><b>${esc(t)}</b><p>${esc(p)}</p></div>`;
  return `${mitStand(WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: h.bild || FOTO('studio'), h1: esc(h.name), zier: esc([h.art, h.ort, h.stand].filter(Boolean).join(' · ')),
      satz: esc(h.kurz || 'Die Mappe für das Gespräch.'),
      knoepfe: WO.knopf('Die Werkzeuge', 'rechts', 'gold', { attr: 'data-sprung="werkzeuge"' }) + (werkbank(h) ? WO.knopf('Werkbank öffnen', 'pfeil', 'glas', { href: esc(werkbank(h)), neu: true }) : '') + WO.knopf('Gespräch eintragen', 'stift', 'glas', { attr: 'data-sprung="gespraech"' }) }), h)}
    <div class="sc-mappe2 sc-mappe2--schritte${S.alle ? ' sc-alle' : ''}">
      <div class="sc-mappe2__haupt">
        ${wesenBlock(h.id)}
        ${schrittLeiste(h)}

        <section class="sc-block sc-teil" data-teil="lage" id="lage">
          ${kopfBlock(['Die', 'Ausgangslage.'], 'Was du vor dem Gespräch wissen musst: Es geht um die Werkzeuge und die Zusammenarbeit.')}
          <div class="sc-pakete sc-lage2" data-r>${(P.lage || []).map(([t, p]) => wahrSatz(t, p)).join('')}</div>
          ${schrittFuss(h, 'lage')}
        </section>

        <section class="sc-block sc-teil sc-wz" data-teil="werkzeuge" id="werkzeuge" data-wz>
          ${kopfBlock(['Die', 'Werkzeuge.'], 'Diese drei bekommt das Haus. Links ein Werkzeug wählen, rechts stehen sein Bildschirm und was das Haus damit kann.')}
          <div class="sc-wz__buehne" data-r>
            <ol class="sc-wz__liste">${drei.map((x, i) => `<li><button type="button" class="sc-wz__f${i === 0 ? ' an' : ''}" data-i="${i}" data-url="${esc(x.url || '')}" data-name="${esc(x.name)}"><i>${WO.ic(x.s.z)}</i><span><b>${esc(x.name)}</b><small>${x.name !== x.s.n ? esc(x.s.n) + ' · ' : ''}${esc(satz(x.s.k))}</small></span></button></li>`).join('')}</ol>
            <div class="sc-wz__hof">
              <span class="sc-geraet sc-wz__geraet"${FEIN && drei[0] && drei[0].url ? ` data-live="${esc(drei[0].url)}" aria-label="${esc(drei[0].name)} live ansehen"` : ''}><span class="sc-geraet__schirm">${FEIN && drei[0] && drei[0].url ? tipp() : ''}${drei.map((x, i) => { const b = (x.info.f.find(f => f[2]) || [])[2], eig = (P.bilder || {})[x.s.k]; return eig || b ? `<img src="${eig ? esc(eig) : WZ_BILD + esc(b) + '.webp'}" data-i="${i}" class="${i === 0 ? 'an' : ''}" alt="${esc(x.s.n)}" loading="lazy" decoding="async">` : ''; }).join('')}<video muted playsinline loop preload="none"></video></span><img class="sc-geraet__haus" src="${LAPTOP}" alt="" decoding="async"></span>
              <div class="sc-wz__tafel">${drei.map((x, i) => `<div class="sc-wz__was${i === 0 ? ' an' : ''}" data-i="${i}">
                <span class="wo-mk">Das kann das Haus mit ${esc(x.name)}</span>
                <ul>${x.info.f.slice(0, 4).map(f => `<li><b>${esc(f[0])}</b><span>${esc(kurz(f[1], 140))}</span></li>`).join('')}</ul>
                <div class="sc-wz__kn">${x.url && (!x.amBeispiel || !(P.bilder || {})[x.s.k]) ? WO.knopf('Ausprobieren', 'pfeil', 'gold', { klein: true, href: x.url, neu: true }) : ''}</div>
                <small class="sc-wz__bsp">${(P.bilder || {})[x.s.k] || x.bild ? 'Bildschirm aus dem Werkzeug von ' + esc(h.name) : x.amBeispiel ? 'Am Beispiel ' + esc(x.amBeispiel) : 'Bildschirm am Beispiel'}${h.werkbank_stand ? ' · ' + esc(h.werkbank_stand) : ''}</small>
              </div>`).join('')}</div>
            </div>
          </div>
          ${schrittFuss(h, 'werkzeuge')}
        </section>

        ${/* Schulung ruht (Robert 13.11.2026: «wir schulen nicht am anfang … höchstens spannend für werkzeuge erstmal»); Inhalt bleibt in pitch.schulung */ ''}

        <section class="sc-block sc-teil" data-teil="netzwerk" id="netzwerk">
          ${kopfBlock(['Zusammenarbeit', 'und Netzwerk.'], N.lead || '')}
          <div class="sc-pakete sc-pakete--reihe" style="--n:${(N.punkte || []).length}" data-r>${(N.punkte || []).map(([t, p]) => wahrSatz(t, p)).join('')}</div>
          ${schrittFuss(h, 'netzwerk')}
        </section>

        <section class="sc-block sc-teil" data-teil="preis" id="angebot">
          ${kopfBlock(['Das', 'Angebot.'], 'Was das Haus bekommt und was ihm gehört.')}
          <div class="sc-preis" data-r><div><span class="wo-mk">${(h.preis || {}).gross ? 'Werkzeuge' : 'Betreuung im Monat'}</span><b>${esc(preisText(h) || 'Noch nicht festgelegt')}</b><p>${!preisText(h) ? 'Den Betrag überlegen wir gemeinsam.' : (h.preis || {}).gross ? 'Netto, einmalig.' : 'Netto, monatlich kündbar. Kein einmaliger Betrag.'}</p></div>
</div>
          <div class="sc-karten2 sc-karten2--hell" data-r>${karteListe('Was das Haus bekommt', P.bekommt || [], 'blatt')}${karteListe('Was dem Haus gehört', P.gehoert || [], 'haus')}</div>
          ${vertragHausBlock()}
          ${schrittFuss(h, 'preis')}
        </section>

        <section class="sc-block sc-teil" data-teil="ablauf" id="ablauf">
          ${kopfBlock(['Der', 'Ablauf.'], P.ablaufFuss || '')}
          ${ablaufBlock(P.ablauf || [])}
          ${schrittFuss(h, 'ablauf')}
        </section>

        <section class="sc-block sc-teil" data-teil="fragen" id="fragen">
          ${kopfBlock(['Fragen,', 'die kommen.'], 'Die Antworten, zugeschnitten auf dieses Haus. Ein Klick öffnet die Antwort.')}
          <div class="sc-fragen" data-r>${(P.fragen || []).map(([q, a], i) => `<details class="sc-frage"${i === 0 ? ' open' : ''}><summary><b>${esc(q)}</b><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a">${a}</div></details>`).join('')}</div>
          ${schrittFuss(h, 'fragen')}
        </section>

        ${briefBlock(h)}

        <section class="sc-block sc-teil" data-teil="weiter" id="gespraech">
          ${kopfBlock(['Das', 'Gespräch.'], 'Was du im Gespräch erfährst, trägst du hier ein. Gespeichert wird erst mit «Speichern», jede Änderung lässt sich rückgängig machen.')}
          ${memoBlock(h)}${gespraechForm(h)}
        </section>

        ${quellen([qKunden(h), qMarke(), ['Website des Hauses', 'Geprüft am 03.11.2026', h.website || h.url || '', 'Website']])}
      </div>
      ${parat(h)}
    </div>`;
}
/* Die Werkzeuge als Abschnitt der Mappe; in der Familien-Mappe am Beispiel des ersten Hauses (sh = Familie für Schrittfuss) */
function wzSektion(h, wzLead, sh) {
  const sieben = siebenFuer(h), eigen = eigeneWerkzeuge(h);
  return `<section class="sc-block sc-wz sc-teil" data-teil="werkzeuge" id="werkzeuge" data-wz>
          ${kopfBlock(['Die', 'Werkzeuge.'], wzLead)}
          <div class="sc-wz__buehne" data-r>
            <ol class="sc-wz__liste">${sieben.map((x, i) => `<li><button type="button" class="sc-wz__f${i === 0 ? ' an' : ''}" data-i="${i}" data-url="${esc(x.url || '')}" data-name="${esc(x.name)}"><i>${WO.ic(x.s.z)}</i><span><b>${esc(x.name)}</b><small>${x.name !== x.s.n ? esc(x.s.n) + ' · ' : ''}${esc(satz1(x.info.lead))}</small></span></button></li>`).join('')}</ol>
            <div class="sc-wz__hof">
              <span class="sc-geraet sc-wz__geraet"${FEIN && sieben[0] && sieben[0].url ? ` data-live="${esc(sieben[0].url)}" aria-label="${esc(sieben[0].name)} live ansehen"` : ''}><span class="sc-geraet__schirm">${FEIN && sieben[0] && sieben[0].url ? tipp() : ''}${sieben.map((x, i) => { const b = (x.info.f.find(f => f[2]) || [])[2]; const src = x.bild ? esc(klein(x.bild)) : x.bildBsp ? esc(klein(x.bildBsp)) : b ? WZ_BILD + esc(b) + '.webp' : ''; return src ? `<img src="${src}" data-i="${i}" class="${i === 0 ? 'an' : ''}" alt="${esc(x.name)}" loading="lazy" decoding="async">` : ''; }).join('')}<video muted playsinline loop preload="none"></video></span><img class="sc-geraet__haus" src="${LAPTOP}" alt="" decoding="async"></span>
              <div class="sc-wz__tafel">${sieben.map((x, i) => `<div class="sc-wz__was${i === 0 ? ' an' : ''}" data-i="${i}">
                <span class="wo-mk">Das kann das Haus mit ${esc(x.name)}</span>
                <ul>${x.info.f.slice(0, 4).map(f => `<li><b>${esc(f[0])}</b><span>${esc(kurz(f[1], 140))}</span></li>`).join('')}</ul>
                <div class="sc-wz__kn">${x.url ? WO.knopf(x.amBeispiel ? 'Am Beispiel ausprobieren' : 'Ausprobieren', 'pfeil', 'gold', { klein: true, href: x.url, neu: true }) : ''}</div>
                <small class="sc-wz__bsp">${x.bild ? 'Bildschirm aus dem Werkzeug von ' + esc(h.name) : x.amBeispiel ? 'Für ' + esc(h.name) + ' noch nicht gebaut · Bildschirm und Ausprobieren am Beispiel' + (x.amBeispiel ? ' ' + esc(x.amBeispiel) : '') : 'Bildschirm am Beispiel'}</small>
              </div>`).join('')}</div>
            </div>
          </div>
          ${eigen.length ? `<p class="sc-eigen" data-r><span class="wo-mk">Eigens für das Haus gebaut</span>${esc(eigen.join(' · '))}</p>` : ''}
          ${schrittFuss(sh || h, 'werkzeuge')}
        </section>`;
}
/* Die Mappe als Gesprächsleitfaden (Robert 11.11.2026: «so viele kleine Textstellen und Flächen, super unübersichtlich … im Gespräch übersichtlicher»).
   Acht Schritte in der Reihenfolge der Gesprächspunkte, immer nur einer offen; oben die Leiste, unten «Besprochen» und «Weiter». «Alles zeigen» legt alle untereinander. */
const SCHRITTE = [['website', 'Website'], ['werkzeuge', 'Werkzeuge'], ['preis', 'Preis'], ['ki', 'KI'], ['betreuung', 'Betreuung'], ['ablauf', 'Ablauf'], ['braucht', 'Vom Haus'], ['fragen', 'Fragen'], ['weiter', 'Nächster Schritt']];
const SCHRITTE_WZ = [['lage', 'Ausgangslage'], ['werkzeuge', 'Werkzeuge'], ['netzwerk', 'Zusammenarbeit'], ['preis', 'Angebot'], ['ablauf', 'Ablauf'], ['fragen', 'Fragen'], ['weiter', 'Nächster Schritt']];
const schritteVon = h => h && h.pitch ? SCHRITTE_WZ : SCHRITTE;
const schrittVon = h => (S.schritt || {})[h.id] || schritteVon(h)[0][0];
function schrittLeiste(h) {
  const ab = new Set(((gespraech(h.id) || {}).stand || {}).abgedeckt || []), an = schrittVon(h);
  const L = schritteVon(h), nAb = L.filter(([k]) => ab.has(k)).length;
  return `<nav class="sc-schritte" aria-label="Gesprächsschritte"><div class="sc-schritte__kopf"><span class="wo-mk">Gesprächsschritte · ${nAb} von ${L.length} besprochen</span><button type="button" class="sc-schritte__alle" data-schritt-alle>${S.alle ? 'Schritt für Schritt' : 'Alles zeigen'}</button></div>`
    + `<div class="sc-schritte__weg">${L.map(([k, t], i) => `<button type="button" class="sc-schritt${k === an ? ' an' : ''}${ab.has(k) ? ' ok' : ''}" data-schritt="${k}"><b>${ab.has(k) ? WO.ic('haken') : i + 1}</b><span>${esc(t)}</span></button>`).join('')}</div></nav>`;
}
function schrittFuss(h, k) {
  const L = schritteVon(h), ab = new Set(((gespraech(h.id) || {}).stand || {}).abgedeckt || []), i = L.findIndex(x => x[0] === k), nx = L[i + 1];
  const T = Object.fromEntries(themenVon(h));
  return `<div class="sc-schrittfuss"><button type="button" class="sc-abhaken${ab.has(k) ? ' ok' : ''}" data-abhaken="${k}"><i>${WO.ic('haken')}</i><span>${ab.has(k) ? 'Besprochen: ' : 'Als besprochen abhaken: '}${esc(T[k] || '')}</span></button>`
    + `${nx ? `<button type="button" class="sc-weiter" data-schritt="${nx[0]}" data-oben><span>Weiter: ${esc(nx[1])}</span><i>${WO.ic('rechts')}</i></button>` : ''}</div>`;
}
/* Ablauf: oben die acht Wochen als Kacheln, ein Klick wählt eine; darunter quer, was wir tun und was das Haus tut */
function ablaufBlock(l) {
  return `<div class="sc-ablauf" data-r><ol class="sc-wochen3" style="--n:${l.length}">${l.map((w, i) => `<li><button type="button" class="${i === 0 ? 'an' : ''}" data-woche="${i}"><span>${esc(w[0])}</span><b>${esc(w[1])}</b></button></li>`).join('')}</ol>`
    + `<div class="sc-woche">${l.map((w, i) => `<div class="sc-woche__teil${i === 0 ? ' an' : ''}" data-woche-teil="${i}"><div class="sc-woche__kopf"><span>${esc(w[0])}</span><b>${esc(w[1])}</b></div>`
    + `<div class="sc-woche__zwei"><div class="sc-woche__wir"><em>${WO.ic('person')}Wir</em><p>${esc(w[2])}</p></div><div class="sc-woche__haus"><em>${WO.ic('haus')}Das Haus</em><p>${esc(w[3])}</p></div></div></div>`).join('')}</div></div>`;
}
/* Liste als Karte: dunkles Kopfband mit Zeichen und Titel, darunter Zeilen mit Haken */
const karteListe = (titel, l, ic, zusatz = '') => `<div class="sc-karte2"><div class="sc-karte2__kopf"><i>${WO.ic(ic)}</i><b>${esc(titel)}</b>${zusatz}</div><ul>${l.map(x => `<li><i>${WO.ic('haken')}</i><span>${esc(x)}</span></li>`).join('')}</ul></div>`;
function mappe(h) {
  if (!h) return start();
  if (h.pitch) return mappeWerkzeuge(h);
  const p = projektVon(h), on = online(p), sieben = siebenFuer(h), eigen = eigeneWerkzeuge(h);
  const zeigen = links(h).filter(l => !INTERN.test(l[0]) && !istWerkzeug(l) && !/^(Website|Werkbank)/.test(l[0]) && l[3] !== 'Familie' && l[1] !== h.entwurf);
  const lokalWeb = (h.adressen || []).find(x => x.gruppe === 'Website' && x.url !== h.entwurf), fam = familienseite(h), wb = werkbank(h);
  const mail = !h.versand_verbergen && p && p.mail;
  const gebaut = sieben.filter(x => x.gebaut).length;
  const wzLead = (gebaut ? `Für ${h.name} schon gebaut, mit eigenen Namen.` : 'Diese sieben Werkzeuge kommen zur Website dazu.') + ' Links ein Werkzeug wählen, rechts stehen sein Bildschirm und was das Haus damit kann.';
  return `${mitStand(WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: h.bild || FOTO('studio'), h1: esc(h.name) + haken(h), zier: esc([h.art, h.ort, h.stand].filter(Boolean).join(' · ')),
      satz: esc(h.kurz || 'Die Mappe für das Gespräch.'),
      knoepfe: (h.entwurf ? WO.knopf('Website zeigen', 'auge', 'gold', { href: h.entwurf, neu: true }) : '') + (wb ? WO.knopf('Werkbank öffnen', 'pfeil', 'glas', { href: esc(wb), neu: true }) : '') + WO.knopf('Gespräch eintragen', 'stift', 'glas', { attr: 'data-sprung="gespraech"' }) }), h)}
    <div class="sc-mappe2 sc-mappe2--schritte${S.alle ? ' sc-alle' : ''}">
      <div class="sc-mappe2__haupt">

        ${wesenBlock(h.id)}
        ${schrittLeiste(h)}

        <section class="sc-block sc-teil" data-teil="website" id="website">
          ${kopfBlock(['Die', 'Website.'], h.entwurf ? (lokal(h.entwurf) ? 'Gebaut und lokal zu sehen, noch nicht online.' : 'Online als Entwurf, zum Zeigen im Gespräch.') : 'Noch keine Website gebaut.')}
          <div class="sc-web" data-r>
            ${geraet(h.schirm, h.name, 'sc-web__geraet', h.entwurf || (h.pitch ? werkbank(h) : ''), FEIN ? h.entwurf || (h.pitch ? werkbank(h) : '') : '')}
            <dl class="sc-web__fakten">
              <div><dt>Umfang</dt><dd>${h.seiten ? mz(h.seiten, 'Seite', 'Seiten') : 'Noch offen'}</dd></div>
              <div><dt>Adresse</dt><dd>${h.entwurf ? `<a href="${esc(h.entwurf)}" target="_blank" rel="noopener">${lokal(h.entwurf) ? 'Lokal ansehen' : esc(wirt(h.entwurf))}</a>${lokal(h.entwurf) ? '<small>Sobald sie online ist, steht hier die Adresse.</small>' : on === true ? '<small>Online, vom Wächter geprüft</small>' : on === false ? '<small>Gerade nicht erreichbar</small>' : ''}` : 'Noch keine'}</dd></div>
              ${lokalWeb ? `<div><dt>${lokal(lokalWeb.url) ? 'Lokal' : 'Website'}</dt><dd><a href="${esc(lokalWeb.url)}" target="_blank" rel="noopener">${esc(lokalWeb.name)}</a></dd></div>` : ''}
              <div><dt>Werkbank</dt><dd>${wb ? `<a href="${esc(wb)}" target="_blank" rel="noopener">Werkbank öffnen</a>${lokal(wb) ? '<small>Lokal, noch nicht online</small>' : ''}` : esc(h.werkbank_stand || 'Noch keine')}</dd></div>
              ${fam ? `<div><dt>Familie</dt><dd><a href="${esc(fam[1])}" target="_blank" rel="noopener">${esc(fam[0])}</a></dd></div>` : ''}
              <div><dt>Heutige Seite</dt><dd>${h.website ? `<a href="${esc(h.website)}" target="_blank" rel="noopener">${esc(wirt(h.website))}</a>` : 'Nicht hinterlegt'}</dd></div>
              <div><dt>Verschickt</dt><dd>${mail ? esc(mail.datum) + `<small>an ${esc(mail.an || '')}</small>` : 'Noch nichts verschickt'}</dd></div>
              ${(() => { const x = besuchText(h); return `<div class="sc-geoeffnet${x ? ' an' : ''}"><dt>Geöffnet</dt><dd>${x ? esc(x.kopf) + `<small>${esc(x.fein)}</small>` : `Noch nicht<small>Kein echter Besuch seit dem ${BES_SEIT}</small>`}</dd></div>`; })()}
            </dl>
          </div>
          ${zeigen.length ? `<div class="sc-dazu" data-r><span class="wo-mk">Was es zum Haus noch gibt</span><div>${zeigen.map(l => `<a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}${pfeil()}</a>`).join('')}</div></div>` : ''}
          ${briefBlock(h)}
          ${schrittFuss(h, 'website')}
        </section>

        ${wzSektion(h, wzLead)}

        <section class="sc-block sc-teil" data-teil="preis" id="angebot">
          ${kopfBlock(['Der', 'Preis.'], 'Einmal die Website mit den Werkzeugen, dazu zwei Teile im Monat. Beide monatlich kündbar, alles netto.')}
          <div class="sc-angebot sc-angebot--preis" data-r>
            <div class="sc-angebot__teil sc-angebot__teil--gross"><span class="wo-mk">Website und Werkzeuge</span>${wertB(preisText(h) || 'Noch offen')}<p>${preisText(h) ? 'Netto, einmalig.' : 'Den Betrag überlegen wir gemeinsam.'}${(() => { const pk = (h.preis || {}).paket; return pk && pk.gesamt && pk.einzeln && pk.einzeln !== (h.preis || {}).betrag ? `<small class="sc-angebot__summe">Paketpreis im Familienpaket · einzeln ${esc(preisCur(h) === '€' ? zahlCh(pk.einzeln) + ' €' : 'CHF ' + zahlCh(pk.einzeln))}</small>` : ''; })()}</p></div>
            ${(W.pakete || []).map((k, i) => `<div class="sc-angebot__teil"><span class="wo-mk">${esc(k.name)}</span>${wertB(paketPreis(h, i + 1) || 'Noch offen')}<p>${paketPreis(h, i + 1) ? 'Im Monat, monatlich kündbar.' : 'Preis noch nicht festgelegt.'}</p></div>`).join('')}
          </div>
          ${paketZeile(h, 'sc-fein')}
          ${zahlungListe().length ? `<p class="sc-fein"><b>Zahlung.</b> ${esc(zahlungListe().join(' '))}</p>` : ''}
          ${vertragHausBlock()}
          ${schrittFuss(h, 'preis')}
        </section>

        <section class="sc-block sc-teil" data-teil="ki" id="ki">
          ${kopfBlock(['KI und', 'ihre Kosten.'], 'Vier Stellen in den Werkzeugen nutzen Claude, das Sprachmodell von Anthropic. Was die KI dort tut und wie ihre Kosten geregelt sind.')}
          <div class="sc-karten2" data-r>${karteListe('Wo die KI arbeitet', ((W.ki || {}).stellen || []).map(s => s[0] + ' (' + s[1] + '): ' + s[2]), 'chat')}${karteListe('Was sie kostet', (W.ki || {}).kosten || [], 'balken')}</div>
          ${schrittFuss(h, 'ki')}
        </section>

        <section class="sc-block sc-teil" data-teil="betreuung" id="betreuung">
          ${kopfBlock(['Die', 'Betreuung.'], W.paketeFuss)}
          <div class="sc-karten2" data-r>${(W.pakete || []).map((k, i) => karteListe(k.name, k.punkte, i ? 'blatt' : 'welt', `<span class="sc-karte2__preis">${esc(paketPreis(h, i + 1) || 'Noch offen')}<small>im Monat</small></span>`).replace('<ul>', `<p class="sc-karte2__satz">${esc(k.satz)}</p><ul>`)).join('')}</div>
          <div class="sc-karten2 sc-karten2--hell" data-r>${karteListe('Was dem Haus gehört', W.gehoert || [], 'haus')}${karteListe('Gut zu wissen', extraListe(), 'schild')}</div>
          ${schrittFuss(h, 'betreuung')}
        </section>

        <section class="sc-block sc-teil" data-teil="ablauf" id="ablauf">
          ${kopfBlock(['Der', 'Ablauf.'], dauerText())}
          ${ablaufBlock(W.ablauf || [])}
          ${schrittFuss(h, 'ablauf')}
        </section>

        <section class="sc-block sc-teil" data-teil="braucht" id="braucht">
          ${kopfBlock(['Was wir', 'vom Haus brauchen.'], 'Das braucht es vom Haus, damit wir loslegen können.')}
          <ol class="sc-braucht2" data-r>${(W.braucht || []).map((t, i) => `<li><span>${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
          ${schrittFuss(h, 'braucht')}
        </section>

        <section class="sc-block sc-teil" data-teil="fragen" id="fragen">
          ${kopfBlock(['Fragen,', 'die kommen.'], 'Die Antworten, zugeschnitten auf ' + h.name + '. Ein Klick öffnet die Antwort.')}
          ${fragenBlock(h, true)}
          ${schrittFuss(h, 'fragen')}
        </section>

        <section class="sc-block sc-teil" data-teil="weiter" id="gespraech">
          ${kopfBlock(['Der nächste', 'Schritt.'], 'Was vereinbart ist, kommt hier hinein: einsprechen oder eintragen. Gespeichert wird erst mit «Speichern».')}
          ${memoBlock(h)}${gespraechForm(h)}
        </section>

        ${quellen([qKunden(h), ['Pakete, Ablauf, Antworten', W.quelleW, werkbank(haus('carlton') || {}), 'Öffnen'], ['Preise', 'Preisliste «Angebot» im Second Brain, Stand 08. und 09.11.2026', OBSIDIAN('00 Kontext/Angebot.md'), 'In Obsidian'], qMarke(),
          p ? ['Adressen der Seiten', 'Liste der Seiten, die online stehen und beobachtet werden', p.url || '', 'Website'] : null])}
      </div>
      ${parat(h)}
    </div>`;
}

/* ---------------------------------------------------------------- Fenster «Was geprüft ist und was aussteht» (Robert 11.11.2026) */
function pruefFenster(h, teil) {
  if (!h) return;
  const f = fortschritt(h), x = (teil === 'website' ? f.web : f.bank) || { p: 0, t: '' }, pr = pruefungVon(h), d = (pr && pr[teil]) || {}, b = (pr && pr.bericht) || { abschnitte: [] };
  const arbeit = !!x.arbeit;
  const pk = arbeit ? [] : abg(h, teil, d.punkte).filter(p => p.ok !== null), demo = pk.filter(p => p.stufe !== 'final'), fin = pk.filter(p => p.stufe === 'final');   // nur fertige Ergebnisse
  const url = teil === 'website' ? h.entwurf : werkbank(h), name = teil === 'website' ? 'Website' : 'Werkbank';
  const prozent = l => l.length ? Math.round(100 * l.filter(p => p.ok).length / l.length) : 0;
  /* Funde lesbar: je Fund eine Zeile, ohne Breite, Punktnummer und Code-Namen */
  const funde = t => String(t || '').split(/ · (?=\d{3,4} px)/).map(f => f.replace(/^\d{3,4} px\s*·\s*\d+[a-z]?\s*/i, '').replace(/\s*\(«[^»]{0,3}»\)/g, '').replace(/\s*(?:in|unter|von|bei)\s+[#.][^\s,.;)]*(?:\.[^\s,.;)]+)*/g, '').replace(/\s*\([^)]*[#.][\w-]+[^)]*\)/g, '').replace(/\s+\./g, '.').trim()).filter(f => f.length > 3);
  const detail = t => { const l = funde(t); return l.length > 1 ? `<ul class="sc-pf__funde">${l.slice(0, 10).map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : l.length ? `<small>${esc(l[0])}</small>` : ''; };
  const zust = p => p.ok === true ? 'ok' : p.ok === null ? 'laeuft' : 'offen';
  const zeile = p => `<li class="${zust(p)}"><i>${WO.ic(p.ok === true ? 'haken' : 'uhr')}</i><span><b>${esc(p.t)}</b>${p.detail ? detail(p.detail) : ''}${p.quelle ? `<small class="sc-pf__q">${/^https?:/.test(p.quelle) ? `<a href="${esc(p.quelle)}" target="_blank" rel="noopener">Prüfbericht öffnen</a>` : 'Laut ' + esc(p.quelle)}</small>` : ''}</span></li>`;
  const KURZ = { start: 'Erreichbar', seiten: 'Alle Seiten', bilder: 'Bilder', geraete: 'Rechner + Handy', links: 'Links + Knöpfe', bericht: 'Prüfbericht', skript: 'Prüfskript', fluessig: 'Flüssigkeit', texte: 'Texte', suche: 'Google' };
  /* Balken in Feldern (Robert 11.11.2026: «was zur 100 noch fehlt … visuell mit Balken»): je Prüfpunkt ein Feld, grün geprüft, rot fehlt, gold läuft */
  const seg = l => l.length ? `<div class="sc-seg" style="--n:${l.length}">${l.map(p => `<span class="sc-seg__s ${zust(p)}" title="${esc(p.t)}"><i></i><small>${esc(KURZ[p.k] || p.t)}</small></span>`).join('')}</div>` : '';
  const fehlt = l => { const o = l.filter(p => p.ok !== true); if (!o.length) return l.length ? '<p class="sc-fehlt sc-fehlt--gut">Alles geprüft. Nichts fehlt zur 100 %.</p>' : '';
    return `<div class="sc-fehlt"><b>Fehlt zur 100 %</b><ul>${o.map(p => `<li class="${zust(p)}"><span>${esc(KURZ[p.k] || p.t)}</span>${esc((funde(p.detail)[0] || (p.ok === null ? 'Läuft gerade' : p.t)))}${funde(p.detail).length > 1 ? ' (und ' + (funde(p.detail).length - 1) + ' weitere)' : ''}</li>`).join('')}</ul></div>`; };
  const punkte = l => `<ul class="sc-pf__liste">${l.slice().sort((a, c) => (a.ok === true) - (c.ok === true)).map(zeile).join('')}</ul>`;
  const stich = (t, l, satz) => l && l.length ? `<div class="sc-pf__stich"><h4>${esc(t)}</h4>${satz ? `<p>${esc(satz)}</p>` : ''}<ul>${l.map(z => `<li>${esc(z)}</li>`).join('')}</ul></div>` : '';
  const fuerWeb = a => /website|daten|suche|google/i.test(a.titel);
  const berichtTeile = arbeit ? [] : (b.abschnitte || []).filter(a => !a.offen && (teil === 'website' ? fuerWeb(a) : !/^(die )?website$/i.test(a.titel)));
  const offenBericht = arbeit ? [] : (b.abschnitte || []).filter(a => a.offen);
  const seiten = arbeit ? [] : (d.seiten || []).map(z => z.titel), funk = arbeit ? [] : d.funktionen || [], bereiche = arbeit ? [] : d.bereiche || [];
  const kopfSatz = arbeit ? (x.wort ? x.t + '.' : 'In Arbeit: ' + x.t + '.') + ' Der Demo-Check folgt, wenn alles fertig ist.' : !url ? (teil === 'website' ? 'Noch keine Website gebaut.' : 'Noch keine Werkbank gebaut.')
    : !pk.length ? 'Noch nicht durch den Prüfstand gelaufen.'
    : (teil === 'website' && !lokal(url) ? 'Online. ' : '') + `Demo-Check: ${demo.filter(p => p.ok).length} von ${demo.length} Punkten geprüft.` + (fin.length ? ` Final-Check: ${prozent(fin)} %.` : '');
  const geht = teil === 'website'
    ? stich('Was die Website kann', funk) + (seiten.length ? `<div class="sc-pf__stich"><h4>Gebaute Seiten (${seiten.length})</h4><p class="sc-pf__chips">${seiten.map(t => `<span>${esc(t)}</span>`).join('')}</p></div>` : '')
    : (bereiche.length ? `<div class="sc-pf__stich"><h4>Was in der Werkbank steht (${bereiche.length} Bereiche)</h4><p class="sc-pf__chips">${bereiche.map(t => `<span>${esc(t)}</span>`).join('')}</p></div>` : '');
  let dlg = $('#sc-pf');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'sc-pf'; dlg.className = 'sc-pf'; document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); }
  dlg.innerHTML = `<div class="sc-pf__innen sc-ton--${tonX(x)}">
    <header class="sc-pf__kopf"><span class="wo-mk">${esc(h.name)}${haken(h)}</span><h2>${name}<em>${istText(x) ? esc(wortX(x)) : x.p + '&#8239;%'}</em></h2>
      ${demo.length ? seg(demo) : istText(x) ? '' : `<span class="sc-pf__b"><i style="width:${Math.max(x.p, 3)}%"></i></span>`}<p>${esc(kopfSatz)}</p>
      <button type="button" class="sc-pf__zu" aria-label="Schliessen">${WO.ic('plus')}</button></header>
    <section class="sc-pf__teil"><div class="sc-pf__teilkopf"><span class="sc-pf__nr">1</span><div><h3>Demo-Check</h3><p>Was der Kunde in der Demo sieht und anfasst, und was alles geht.</p></div>${arbeit ? (x.zahl ? `<b class="sc-ton--${tonX(x)}">${x.p}&#8239;%</b>` : `<b class="sc-ton--gold">${esc(wortX(x))}</b>`) : `<b class="sc-ton--${ton(prozent(demo))}">${prozent(demo)}&#8239;%</b>`}</div>${arbeit ? `<p class="sc-fehlt">${esc(x.t)}. Noch nicht geprüft.</p>` : ''}
      ${demo.length ? fehlt(demo) + punkte(demo) : ''}
      ${geht}
      ${berichtTeile.length ? `<div class="sc-pf__bericht"><span class="wo-mk">Aus dem Prüfbericht${b.datum ? ' vom ' + esc(b.datum) : ''}</span>${berichtTeile.map(a => stich(a.titel, a.punkte, a.satz)).join('')}</div>` : ''}
    </section>
    ${url ? `<section class="sc-pf__teil sc-pf__teil--final"><div class="sc-pf__teilkopf"><span class="sc-pf__nr">2</span><div><h3>Final-Check · Auslieferung</h3><p>Die strengeren Punkte, bevor das Haus die Seite bekommt.</p></div>${fin.length ? `<b class="sc-ton--${ton(prozent(fin))}">${prozent(fin)}&#8239;%</b>` : ''}</div>
      ${fin.length ? seg(fin) + fehlt(fin) + punkte(fin) : ''}
      ${offenBericht.map(a => stich('Vor der Auslieferung zu klären (laut Prüfbericht)', a.punkte, a.satz)).join('')}
    </section>` : ''}
    <footer class="sc-pf__fuss"><small>${arbeit ? 'Noch kein Check' : pr && pr.zeit ? 'Geprüft am ' + esc(datum(pr.zeit.slice(0, 10))) + ', ' + esc(pr.zeit.slice(11)) + ' Uhr' : 'Noch kein Prüflauf'}</small>
      ${url ? WO.knopf(name + ' öffnen', teil === 'website' ? 'auge' : 'pfeil', 'dunkel', { klein: true, href: esc(url), neu: true }) : ''}</footer>
  </div>`;
  dlg.querySelector('.sc-pf__zu').onclick = () => dlg.close();
  if (!dlg.open) dlg.showModal();
}

/* ---------------------------------------------------------------- Das Gespräch: Annas Eintrag */
const FELDER = ['partner', 'telefon', 'datum', 'ergebnis', 'einwaende', 'vereinbart', 'vereinbart_datum', 'notiz'];
const leerStand = () => ({ abgedeckt: [], partner: '', telefon: '', datum: '', ergebnis: '', einwaende: '', vereinbart: '', vereinbart_datum: '', notiz: '' });
const normiere = s => { const o = Object.assign(leerStand(), s || {}); o.abgedeckt = (o.abgedeckt || []).slice().sort(); return o; };
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* Memo nach dem Gespräch (Robert 11.11.2026: «Memo-Funktion im Nachgang … reinsprechen, wie das Gespräch gelaufen ist … daraus ausgefüllt»).
   Einsprechen im Browser oder ein Sprachmemo vom Handy wählen; der Mac schreibt ab (whisper) und schlägt die Felder vor (Sprachmodell von macOS).
   Nichts verlässt den Mac, nichts kostet. Übernommen wird mit einem Klick ins Formular, gespeichert erst mit «Speichern». */
function memoBlock(h) {
  return `<div class="sc-memo" id="sc-memo" data-r>
    <div class="sc-memo__kopf"><span class="wo-mk">Memo nach dem Gespräch</span><p>Einsprechen, wie das Gespräch gelaufen ist. Der Mac schreibt es ab und füllt die Felder unten vor. Gespeichert wird erst mit «Speichern».</p></div>
    <div class="sc-memo__kn">
      <button type="button" class="sc-memo__auf" data-memo-auf><i><svg class="wo-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg></i><span>Einsprechen</span></button>
      <label class="sc-memo__datei"><input type="file" accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg" data-memo-datei hidden><span>Sprachmemo wählen</span></label>
      <button type="button" class="sc-memo__text" data-memo-tippen><span>Stattdessen tippen</span></button>
    </div>
    <div class="sc-memo__lauf" data-memo-lauf hidden><span class="sc-memo__punkt"></span><b data-memo-zeit>0:00</b><span>Aufnahme läuft</span><button type="button" class="sc-memo__stopp" data-memo-stopp>Fertig</button></div>
    <div class="sc-memo__tippen" data-memo-tippfeld hidden><textarea rows="4" placeholder="Wie ist das Gespräch gelaufen?"></textarea><button type="button" class="sc-memo__stopp" data-memo-senden>Auswerten</button></div>
    <p class="sc-memo__warte" data-memo-warte hidden>Der Mac schreibt ab und füllt vor …</p>
    <div class="sc-memo__erg" data-memo-erg hidden></div>
  </div>`;
}
const MEMO_FELD = { partner: 'Gesprächspartner', telefon: 'Telefon', ergebnis: 'Ergebnis', einwaende: 'Fragen und Einwände', vereinbart: 'Vereinbart', vereinbart_datum: 'Vereinbart für', notiz: 'Notiz', abgedeckt: 'Besprochen' };
function memoLeben(r, h) {
  const m = $('#sc-memo', r), f = $('#sc-form', r); if (!m || !h) return;
  const zeig = (k, an) => { const e = $(`[data-memo-${k}]`, m); if (e) e.hidden = !an; };
  let rec = null, stuecke = [], uhr = 0, start = 0;
  const auswerten = async daten => {
    zeig('warte', true); zeig('erg', false);
    try {
      const j = await api('POST', 'memo/' + h.id, Object.assign({ themen: themenVon(h), ergebnisse: W.ergebnisse || [], haus: h.name }, daten));
      zeig('warte', false);
      const v = j.vorschlag; const e = $('[data-memo-erg]', m);
      if (!v) { e.innerHTML = `<p class="sc-memo__leer">${esc(j.hinweis || 'Nichts zu verstehen.')}</p>`; zeig('erg', true); return; }
      const T = Object.fromEntries(themenVon(h));
      const wert = (k, x) => k === 'abgedeckt' ? x.map(t => T[t] || t).join(', ') : /datum/.test(k) ? datum(x) : x;
      const zeilen = Object.keys(MEMO_FELD).filter(k => k === 'abgedeckt' ? (v[k] || []).length : v[k]);
      e.innerHTML = `<span class="wo-mk">Vorschlag aus dem Memo</span>
        ${zeilen.length ? `<ul class="sc-memo__vor">${zeilen.map(k => `<li><label><input type="checkbox" data-memo-k="${k}" checked><i>${WO.ic('haken')}</i><span><b>${esc(MEMO_FELD[k])}</b>${esc(wert(k, v[k]))}</span></label></li>`).join('')}</ul>` : '<p class="sc-memo__leer">Im Memo stand nichts, was in die Felder passt.</p>'}
        <details class="sc-memo__abschrift"><summary>Abschrift lesen</summary><p>${esc(j.text)}</p></details>
        ${zeilen.length ? `<div class="sc-memo__fuss">${WO.knopf('In die Felder übernehmen', 'haken', 'gold', { klein: true, attr: 'data-memo-uebernehmen' })}<small>Danach prüfen und speichern.</small></div>` : ''}`;
      zeig('erg', true);
      const k = $('[data-memo-uebernehmen]', e);
      if (k) k.onclick = () => {
        $$('[data-memo-k]', e).filter(x => x.checked).forEach(x => {
          const n = x.dataset.memoK, w = v[n];
          if (n === 'abgedeckt') w.forEach(t => { const c = $(`input[name="abgedeckt"][value="${t}"]`, f); if (c) c.checked = true; });
          else if (n === 'ergebnis') { const c = $$('input[name="ergebnis"]', f).find(y => y.value === w); if (c) c.checked = true; }
          else { const c = $(`[name="${n}"]`, f); if (c) c.value = (n === 'einwaende' || n === 'notiz') && c.value.trim() && !c.value.includes(w) ? c.value.trim() + '\n' + w : w; }
        });
        const d = $('[name="datum"]', f); if (d && !d.value && v.datum) d.value = v.datum;
        f.dispatchEvent(new Event('input', { bubbles: true }));
        f.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'start' });
        meldung('Ins Formular übernommen. Bitte prüfen und speichern.');
      };
    } catch (err) { zeig('warte', false); meldung('Memo nicht ausgewertet: ' + err.message, true); }
  };
  const alsDaten = blob => new Promise((ok, nein) => { const rd = new FileReader(); rd.onload = () => ok(rd.result); rd.onerror = nein; rd.readAsDataURL(blob); });
  $('[data-memo-auf]', m).onclick = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) return meldung('Dieser Browser kann nicht aufnehmen. Ein Sprachmemo vom Handy geht über «Sprachmemo wählen».', true);
    try {
      const strom = await navigator.mediaDevices.getUserMedia({ audio: true });
      const typ = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      rec = new MediaRecorder(strom, typ ? { mimeType: typ } : undefined); stuecke = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) stuecke.push(e.data); };
      rec.onstop = async () => { strom.getTracks().forEach(t => t.stop()); clearInterval(uhr); zeig('lauf', false);
        const blob = new Blob(stuecke, { type: rec.mimeType || 'audio/webm' }); auswerten({ audio: await alsDaten(blob), typ: blob.type }); };
      rec.start(); start = Date.now(); zeig('lauf', true);
      uhr = setInterval(() => { const s2 = Math.floor((Date.now() - start) / 1000); $('[data-memo-zeit]', m).textContent = Math.floor(s2 / 60) + ':' + String(s2 % 60).padStart(2, '0'); }, 500);
    } catch (err) { meldung('Kein Zugriff aufs Mikrofon: ' + err.message, true); }
  };
  $('[data-memo-stopp]', m).onclick = () => { if (rec && rec.state !== 'inactive') rec.stop(); };
  $('[data-memo-datei]', m).onchange = async e => { const d = e.target.files && e.target.files[0]; if (d) auswerten({ audio: await alsDaten(d), typ: d.type || d.name }); e.target.value = ''; };
  $('[data-memo-tippen]', m).onclick = () => { zeig('tippfeld', true); $('[data-memo-tippfeld] textarea', m).focus(); };
  $('[data-memo-senden]', m).onclick = () => { const t = $('[data-memo-tippfeld] textarea', m).value.trim(); if (t) auswerten({ text: t }); };
}
function gespraechForm(h) {
  const g = gespraech(h.id) || {}, st = g.stand || {}, ab = new Set(st.abgedeckt || []);
  const ap = h.ansprechpartner || {};
  return `<form class="sc-form" id="sc-form" data-r autocomplete="off">
    <fieldset class="sc-form__themen"><legend class="wo-mk">Besprochen</legend>
      ${themenVon(h).map(([k, t]) => `<label class="sc-haken"><input type="checkbox" name="abgedeckt" value="${esc(k)}"${ab.has(k) ? ' checked' : ''}><i>${WO.ic('haken')}</i><span>${esc(t)}</span></label>`).join('')}
    </fieldset>
    <div class="sc-form__felder">
      <label class="sc-feld"><span>Gesprächspartner</span><input name="partner" value="${esc(st.partner || '')}" placeholder="${esc(ap.name || 'Name und Rolle')}"></label>
      <label class="sc-feld"><span>Telefon</span><input name="telefon" type="tel" value="${esc(st.telefon || '')}" placeholder="${esc(ap.telefon || 'Nummer')}"></label>
      <label class="sc-feld"><span>Gespräch am</span><input name="datum" type="date" value="${esc(st.datum || '')}"></label>
    </div>
    <fieldset class="sc-form__ergebnis"><legend class="wo-mk">Ergebnis</legend>
      ${(W.ergebnisse || []).map(e => `<label class="sc-wahl"><input type="radio" name="ergebnis" value="${esc(e)}"${st.ergebnis === e ? ' checked' : ''}><span>${esc(e)}</span></label>`).join('')}
    </fieldset>
    <label class="sc-feld sc-feld--breit"><span>Fragen und Einwände des Hauses</span><textarea name="einwaende" rows="3" placeholder="Was das Haus gefragt hat, was es zögern lässt">${esc(st.einwaende || '')}</textarea></label>
    <div class="sc-form__felder sc-form__felder--zwei">
      <label class="sc-feld"><span>Vereinbart</span><input name="vereinbart" value="${esc(st.vereinbart || '')}" placeholder="Etwa: Rückruf, Unterlagen schicken, Termin vor Ort"></label>
      <label class="sc-feld"><span>Für den</span><input name="vereinbart_datum" type="date" value="${esc(st.vereinbart_datum || '')}"></label>
    </div>
    <label class="sc-feld sc-feld--breit"><span>Notiz</span><textarea name="notiz" rows="4" placeholder="Alles, was beim nächsten Anruf wichtig ist">${esc(st.notiz || '')}</textarea></label>
    <div class="sc-form__fuss">
      <p>${g.geaendert ? `Zuletzt gespeichert: ${esc(datum(g.geaendert))}, ${esc(g.wer || '')}` : 'Noch nichts gespeichert.'}</p>
      ${WO.knopf('Speichern', 'haken', 'glas', { attr: 'data-speichern', disabled: true })}
    </div>
    ${(g.verlauf || []).length ? `<details class="sc-intern"><summary>Verlauf: ${mz(g.verlauf.length, 'Eintrag', 'Einträge')}</summary><ol class="sc-verlauf">${g.verlauf.slice().reverse().slice(0, 12).map(v => `<li><b>${esc(datum(v.wann))}</b><span>${esc(v.wer)} · ${esc(v.was)}</span></li>`).join('')}</ol></details>` : ''}
  </form>`;
}
function formWerte(f) {
  const d = new FormData(f), o = { abgedeckt: d.getAll('abgedeckt') };
  FELDER.forEach(k => { o[k] = String(d.get(k) || '').trim(); });
  return o;
}
function gespraechLeben(r, h) {
  const f = $('#sc-form', r); if (!f) return;
  const pruefe = () => {
    const war = !!(S.entwurf && S.entwurf.geaendert);
    const geaendert = !gleich(normiere(formWerte(f)), normiere((gespraech(h.id) || {}).stand));
    S.entwurf = { id: h.id, geaendert };
    const k = $('[data-speichern]', f); if (k) { k.disabled = !geaendert || !S.server; k.classList.toggle('wo-kn--gold', geaendert); k.classList.toggle('wo-kn--glas', !geaendert); }
    if (war !== geaendert) leiste();
  };
  f.addEventListener('input', pruefe); f.addEventListener('change', pruefe);
  f.addEventListener('submit', e => { e.preventDefault(); speichern(); });
  $('[data-speichern]', f).onclick = speichern;
  if (!S.server) $$('input,textarea', f).forEach(x => x.disabled = true);
}

async function api(methode, weg, daten) {
  const r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: daten ? JSON.stringify(daten) : undefined, cache: 'no-store' });
  let j = {}; try { j = await r.json(); } catch (e) { /* leer */ }
  if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
  return j;
}
const jetzt = () => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
function neuZeichnen() { const y = scrollY; kopf(); rand(); leiste(); zeichne(); scrollTo({ top: y }); }
let speichernLaeuft = false;
async function speichern() {
  const h = aktH(), f = $('#sc-form');
  if (!h || !f || speichernLaeuft || !(S.entwurf && S.entwurf.geaendert)) return;
  speichernLaeuft = true;
  try {
    const j = await api('PUT', 'gespraech/' + h.id, { felder: formWerte(f), wer: WER(), name: h.name });
    S.d.gespraeche = S.d.gespraeche || {};
    const g = S.d.gespraeche[h.id] || { verlauf: [] };
    g.stand = j.nachher; g.geaendert = jetzt(); g.wer = WER();
    g.verlauf = (g.verlauf || []).concat([{ wann: g.geaendert, wer: WER(), was: (j.geaendert || []).join(', ') }]);
    S.d.gespraeche[h.id] = g; S.entwurf = null;
    if (h.famK) await famWeitergeben(h, j.vorher, j.nachher);
    neuZeichnen();
    quittung(h, j.vorher, j.nachher);
    nachAbhaken(h, j.vorher, j.nachher);
  } catch (e) { meldung('Nicht gespeichert: ' + e.message, true); }
  finally { speichernLaeuft = false; }
}
/* Quittung mit vorher und nachher und «Rückgängig» (CLAUDE.md der internen Werkzeuge) */
const TXT = { abgedeckt: 'Besprochen', partner: 'Gesprächspartner', telefon: 'Telefon', datum: 'Gespräch am', ergebnis: 'Ergebnis', einwaende: 'Fragen und Einwände', vereinbart: 'Vereinbart', vereinbart_datum: 'Vereinbart für', notiz: 'Notiz' };
const zeigeWert = (k, v, h) => k === 'abgedeckt' ? ((v || []).length ? themenVon(h).filter(t => v.includes(t[0])).map(t => t[1]).join(', ') : 'nichts') : /datum/.test(k) ? (datum(v) || 'leer') : (kurz(v, 60) || 'leer');
function quittung(h, vorher, nachher) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const a = normiere(vorher), b = normiere(nachher);
  const zeilen = Object.keys(TXT).filter(k => !gleich(a[k], b[k])).map(k => `<li><b>${esc(TXT[k])}</b><span><s>${esc(zeigeWert(k, a[k], h))}</s> → ${esc(zeigeWert(k, b[k], h))}</span></li>`).join('');
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>Gespräch mit ${esc(h.name)} gespeichert</b><ul>${zeilen}</ul></div><div class="sc-quit__kn">${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    try {
      const j = await api('POST', 'gespraech/' + h.id + '/zurueck', { vorher, wer: WER() });
      const g = S.d.gespraeche[h.id]; g.stand = j.nachher; g.geaendert = jetzt(); g.verlauf = (g.verlauf || []).concat([{ wann: jetzt(), wer: WER(), was: 'Rückgängig gemacht' }]);
      q.remove(); S.entwurf = null; neuZeichnen(); meldung('Rückgängig gemacht: der Stand davor gilt wieder.');
    } catch (e) { meldung('Rückgängig ging nicht: ' + e.message, true); }
  };
  m.appendChild(q); setTimeout(() => q.remove(), 14000);
}
function meldung(text, fehl) {
  const m = $('#meldung'); const q = document.createElement('div'); q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(text)}</b></div><button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button>`;
  q.querySelector('button').onclick = () => q.remove(); m.appendChild(q); setTimeout(() => q.remove(), fehl ? 9000 : 3000);
}

/* In den Kundenstamm aufnehmen (Robert 16.11.2026: «wenn ein Kunde im Sales Cockpit alles abgeschlossen und abgehakt hat … eine kurze Abfrage: in den Kundenstamm aufnehmen, und dann wird er in den Bereich Kunden übertragen»).
   Sind alle Gesprächspunkte eines Hauses (oder einer Familie) abgehakt, fragt das Cockpit einmal. «Aufnehmen» setzt in «Kunden» den Stand «Vertrag»:
   das Haus verlässt die offenen Häuser und steht in «Kunden» unter «Unsere Kunden». «Rückgängig» legt den alten Stand zurück. */
const KUNDEN_API = '/zentrale/api/02-kundenliste/haeuser/';
const allesBesprochen = (h, st) => { const k = themenVon(h).map(t => t[0]), ab = new Set((st && st.abgedeckt) || []); return k.length > 0 && k.every(x => ab.has(x)); };
function nachAbhaken(h, vorher, nachher) {
  if (!h || allesBesprochen(h, vorher) || !allesBesprochen(h, nachher)) return;
  const liste = (h.famK ? (h.haeuser || []) : [h]).filter(x => x && haus(x.id) && offen(haus(x.id)));
  if (liste.length) setTimeout(() => kundenstammFrage(h, liste), 350);
}
async function kundenPut(id, daten) {
  const r = await fetch(KUNDEN_API + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ wer: WER() }, daten)), cache: 'no-store' });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.'); return j;
}
function kundenstammFrage(h, liste) {
  let dlg = $('#sc-ks');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'sc-ks'; dlg.className = 'sc-pf sc-ks'; document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); }
  const viele = liste.length > 1;
  dlg.innerHTML = `<div class="sc-pf__innen sc-ks__innen">
    <header class="sc-pf__kopf"><span class="wo-mk">${esc(h.name)} · alles besprochen</span><h2>In den Kundenstamm aufnehmen?</h2>
      <p>${viele ? `Alle ${liste.length} Häuser (${esc(liste.map(x => x.name).join(', '))}) wechseln` : `${esc(liste[0].name)} wechselt`} nach «Kunden» unter «Unsere Kunden» und ${viele ? 'stehen' : 'steht'} dann nicht mehr bei den offenen Häusern.</p>
      <button type="button" class="sc-pf__zu" aria-label="Schliessen">${WO.ic('plus')}</button></header>
    <footer class="sc-pf__fuss sc-ks__fuss">${WO.knopf('Noch nicht', 'links', 'hell', { klein: true, attr: 'data-ks-nein' })}${WO.knopf('Aufnehmen', 'haken', 'gold', { klein: true, attr: 'data-ks-ja' })}</footer>
  </div>`;
  dlg.querySelector('.sc-pf__zu').onclick = dlg.querySelector('[data-ks-nein]').onclick = () => dlg.close();
  dlg.querySelector('[data-ks-ja]').onclick = async e => {
    const b = e.currentTarget; b.disabled = true; const vorher = [];
    try {
      for (const x of liste) { const j = await kundenPut(x.id, { stand: 'Vertrag' }); vorher.push(j.vorher); const k = haus(x.id); if (k) k.stand = 'Vertrag'; }
      dlg.close();
      if (gueltig(S.ansicht)) neuZeichnen(); else gehe('start');
      aufgenommen(liste, vorher);
    } catch (err) {
      b.disabled = false; meldung('Nicht übernommen: ' + err.message, true);
    }
  };
  if (!dlg.open) dlg.showModal();
}
function aufgenommen(liste, vorher) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>In den Kundenstamm aufgenommen</b><ul>${liste.map(x => `<li><b>${esc(x.name)}</b><span>steht jetzt in «Kunden» unter «Unsere Kunden»</span></li>`).join('')}</ul></div>
    <div class="sc-quit__kn">${WO.knopf('In Kunden ansehen', 'pfeil', 'gold', { klein: true, href: KUNDEN_WZ + '?haus=' + encodeURIComponent(liste[0].id) })}${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    try {
      for (const v of vorher) {
        const r = await fetch(KUNDEN_API.replace(/haeuser\/$/, '') + 'wiederherstellen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ haus: v, wer: WER() }) });
        if (!r.ok) throw new Error('Fehler ' + r.status);
        const k = haus(v.id); if (k) k.stand = v.stand;
      }
      q.remove(); neuZeichnen(); meldung('Wieder bei den offenen Häusern.');
    } catch (err) { meldung('Nicht zurückgelegt: ' + err.message, true); }
  };
  m.appendChild(q);
}

/* Werkzeuge: Klick auf ein Werkzeug zeigt seinen Bildschirm und was das Haus damit kann; «Film ansehen» spielt die Bedienung im Laptop */
function werkzeugLeben(r) {
  $$('[data-wz]', r).forEach(sec => {
    const fs = $$('.sc-wz__f', sec), imgs = $$('.sc-geraet__schirm img', sec), was = $$('.sc-wz__was', sec), vid = $('video', sec);
    const filmAus = () => { sec.classList.remove('film'); vid.pause(); $$('[data-film] span', sec).forEach(s => s.textContent = 'Film ansehen'); };
    fs.forEach(f => f.onclick = () => {
      filmAus(); const i = f.dataset.i;
      const ger = $('.sc-wz__geraet', sec); if (ger && FEIN) { liveAus(ger); if (f.dataset.url) { ger.dataset.live = f.dataset.url; ger.setAttribute('aria-label', f.dataset.name + ' live ansehen'); } else delete ger.dataset.live; }
      fs.forEach(x => x.classList.toggle('an', x === f)); imgs.forEach(im => im.classList.toggle('an', im.dataset.i === i)); was.forEach(w => w.classList.toggle('an', w.dataset.i === i));
      if (!matchMedia('(min-width: 1000px)').matches) { const hof = $('.sc-wz__hof', sec), b = hof.getBoundingClientRect(); if (b.top < 70 || b.top > innerHeight * .5) hof.scrollIntoView({ behavior: RUHIG() ? 'auto' : 'smooth', block: 'start' }); }
    });
    $$('[data-film]', sec).forEach(k => k.onclick = e => {
      e.preventDefault();
      if (sec.classList.contains('film')) { filmAus(); return; }
      vid.poster = k.dataset.poster; vid.src = k.dataset.film; sec.classList.add('film'); k.querySelector('span').textContent = 'Bilder';
      vid.currentTime = 0; vid.play().catch(() => {});
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && sec.classList.contains('film')) vid.pause(); })).observe(sec);
  });
}

/* ---------------------------------------------------------------- Konditionen und Antworten (für jedes Gespräch) */
/* Ablauf als Karten (Robert 16.11.2026: «das muss viel schöner aussehen»): Nummer, Titel, Wir, Das Haus */
const wochen = () => `<ol class="sc-ablauf2" data-r>${(W.ablauf || []).map((w, i) => `<li class="sc-ablauf2__k" style="--i:${i % 4}"><span class="sc-ablauf2__nr">${i + 1}</span><b>${esc(w[1])}</b>
  <div class="sc-ablauf2__wer"><em>${WO.ic('person')}Wir</em><p>${esc(w[2])}</p></div><div class="sc-ablauf2__wer sc-ablauf2__wer--haus"><em>${WO.ic('haus')}Das Haus</em><p>${esc(w[3])}</p></div></li>`).join('')}</ol>`;
/* Preise nach Ebenen (Robert 17.11.2026: «bau Korridore in die Übersicht … damit Anna sieht, dass wir gerade auf vielen Ebenen versuchen zu erreichen»):
   oben die Spanne über alles, dann je Ebene eine Tafel mit ihrem Korridor (kleinster bis grösster Preis aus «Kunden»), darunter jedes Haus einzeln.
   Netzwerk (Angebot.md 03.11. und 17.11.2026): gilt für Betriebe, die uns im Bekanntenkreis empfohlen werden, hängt an keinem Haus. */
function preisEbenen() {
  const hat = t => /\d/.test(String(t || ''));
  const eur = h => preisCur(h) === '€';
  const zl = (h, re) => ((h.preis || {}).zeilen || []).filter(z => re.test(z[0]));
  const web = h => { const pr = h.preis || {}; if (pr.betrag) return [pr.betrag]; const z = zl(h, /^Website/).filter(z => hat(z[1])); return z.map(z => betrag(z[1])); };
  const einz = h => (((h.preis || {}).paket || {}).einzeln) || null;
  const bet = h => { const pr = h.preis || {}; return hat(pr.betreuung_website) ? [betrag(pr.betreuung_website)] : zl(h, /Betreuung|Wartung/).filter(z => hat(z[1])).map(z => betrag(z[1])); };
  const wz = h => { const pr = h.preis || {}; return hat(pr.abo_werkzeuge) ? [betrag(pr.abo_werkzeuge)] : zl(h, /Werkzeug/).filter(z => hat(z[1])).map(z => betrag(z[1])); };
  const hatPreis = h => !!h.preis && (web(h).length || bet(h).length || wz(h).length || zl(h, /^Website/).length);
  const zahlE = n => zahlCh(n).replace(/’/g, '.');
  const eins = (cur, n) => cur === '€' ? zahlE(n) + ' €' : 'CHF ' + zahlCh(n);
  const korr = (cur, l) => { if (!l.length) return ''; const a = Math.min(...l), b = Math.max(...l);
    return a === b ? eins(cur, a) : cur === '€' ? `${zahlE(a)} bis ${zahlE(b)} €` : `CHF ${zahlCh(a)} bis ${zahlCh(b)}`; };
  const alle = kunden().filter(h => offen(h));
  const mit = alle.filter(hatPreis), ohne = alle.filter(h => !hatPreis(h));
  const E = [
    { mk: 'Schweiz', t: 'Hotels', cur: 'CHF', l: mit.filter(h => !h.pitch && !eur(h) && sparte(h) === 'hotel') },
    { mk: 'Schweiz', t: 'Restaurants', cur: 'CHF', l: mit.filter(h => !h.pitch && !eur(h) && sparte(h) !== 'hotel') },
    { mk: 'Die Website bleibt beim Haus', t: 'Nur Werkzeuge', cur: 'CHF', l: mit.filter(h => h.pitch), nurWz: true },
    { mk: 'Deutschland', t: 'Hotels', cur: '€', l: mit.filter(h => !h.pitch && eur(h) && sparte(h) === 'hotel') },
    { mk: 'Deutschland', t: 'Kleine Betriebe', cur: '€', l: mit.filter(h => !h.pitch && eur(h) && sparte(h) !== 'hotel') }
  ].filter(e => e.l.length);
  const flach = (l, fn) => l.flatMap(fn);
  const NW = SEGMENTE.find(s => /Hannover/.test(s.t));
  /* Jede Tafel gleich gebaut (Robert 17.11.2026: «unübersichtlich» · Leerraum · Text lief über die Tafel): Marke, Titel, grosser Betrag mit Zeile darunter,
     zwei Felder (Bezeichnung über dem Wert, Wert darf umbrechen), Fuss. Spaltenzahl nach Anzahl, damit keine Reihe halb leer bleibt. */
  const tafel = (mk, t, gross, klein, zeilen, fuss) => `<article class="sc-ebene"><span class="wo-mk">${esc(mk)}</span><h3>${esc(t)}</h3>
      <p class="sc-ebene__gross${/ bis /.test(gross) ? ' sc-ebene__gross--spanne' : ''}"><b>${esc(gross)}</b><small>${esc(klein)}</small></p>
      <dl>${zeilen.map(z => `<div><dt>${esc(z[0])}</dt><dd>${esc(z[1])}</dd></div>`).join('')}</dl><p class="sc-ebene__fuss">${esc(fuss || '')}</p></article>`;
  const tafeln = E.map(e => {
    const ein = flach(e.l, h => [...web(h), ...(einz(h) ? [einz(h)] : [])]), b = flach(e.l, bet), w = flach(e.l, wz);
    if (e.nurWz) return tafel(e.mk, e.t, korr(e.cur, w) || 'offen', 'im Monat, einmalig nichts', [['Betreuung', 'enthalten'], ['Werkzeuge', korr(e.cur, w) + ' im Monat']], e.l.map(h => h.name).join(', '));
    const fehlt = e.l.filter(h => !web(h).length && zl(h, /^Website/).length).map(h => h.name + ' nennt den Betrag selbst');
    return tafel(e.mk, e.t, korr(e.cur, ein) || 'offen', 'einmalig je Haus', [['Betreuung', b.length ? korr(e.cur, b) + ' im Monat' : 'nicht vereinbart'], ['Werkzeuge', w.length ? korr(e.cur, w) + ' im Monat' : 'nicht vereinbart']],
      [mz(e.l.length, 'Haus', 'Häuser'), ...fehlt].join(' · '));
  });
  /* Netzwerk (Robert 17.11.2026): Empfehlungen im Bekanntenkreis, keine Vertriebspartner mit Provision */
  if (NW) { const m = NW.z.slice(2).map(z => betrag(z[1]));
    tafeln.push(tafel('Empfehlung im Bekanntenkreis', 'Netzwerk', NW.z[0][1], 'einmalig je Betrieb', [['Betreuung', NW.z[1][1]], ['Werkzeuge', korr('€', m) + ' im Monat']], 'Plus mit zwei, Komplett mit allen Werkzeugen')); }
  const spalten = n => n <= 4 ? n : n % 3 === 0 ? 3 : n % 4 === 0 ? 4 : 3;
  /* Spanne über alles: Euro zum Kurs der SNB verglichen, angezeigt in der Währung des Hauses */
  const punkte = (fn) => mit.flatMap(h => fn(h).map(v => ({ v, cur: preisCur(h), chf: preisCur(h) === '€' ? v * EUR_CHF : v })));
  const spanne = p => { if (!p.length) return 'offen'; const s = [...p].sort((a, b) => a.chf - b.chf); return `${eins(s[0].cur, s[0].v)} bis ${eins(s[s.length - 1].cur, s[s.length - 1].v)}`; };
  const band = `<div class="sc-kond__band" data-r>${[['Ebenen', String(tafeln.length), 'vom kleinen Betrieb bis zum Grandhotel'], ['Website einmalig', spanne(punkte(h => [...web(h), ...(einz(h) ? [einz(h)] : [])])), 'je Haus'],
      ['Werkzeuge im Abo', spanne(punkte(wz)), 'im Monat']].map(x => `<div><span class="wo-mk">${esc(x[0])}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div>`).join('')}</div>`;
  /* Jedes Haus, nach Ebene: die Werte genau so, wie sie in «Kunden» stehen */
  const txtWeb = h => { const pr = h.preis || {}; if (h.pitch) return 'nichts';
    if (pr.betrag) { const e = einz(h), g = eins(preisCur(h), pr.betrag); return e && e !== pr.betrag ? `${g} im Paket · einzeln ${eins(preisCur(h), e)}` : g; }
    const z = zl(h, /^Website/)[0]; return z ? z[1] : '–'; };
  const txtBet = h => { const pr = h.preis || {}; if (h.pitch) return 'enthalten'; if (pr.betreuung_website) return pr.betreuung_website; const z = zl(h, /Betreuung|Wartung/)[0];
    return z ? z[1] + (/optional/.test(z[2] || '') ? ', freiwillig' : '') : (h.pitch ? 'enthalten' : '–'); };
  const txtWz = h => { const pr = h.preis || {}; if (pr.abo_werkzeuge) return pr.abo_werkzeuge; const z = zl(h, /Werkzeug/); return z.length === 1 ? z[0][1] : z.length ? z.map(x => x[0] + ' ' + x[1]).join(' · ') : '–'; };
  /* Wartung Premium, zu besprechen (Robert 17.11.2026: «Website Wartung Premium für 700 CHF, das heisst wir machen auch alle Änderungen … der Preis für Luxushotels, die jetzt 350 haben.
     Pass das proportional auf die anderen an»): je Haus das Doppelte seiner Betreuung, nur hier in den Konditionen, nicht in «Kunden». */
  const premium = h => { if (h.pitch) return '–'; const b = bet(h); return b.length ? eins(preisCur(h), b[0] * 2) : '–'; };
  const zeile = (name, id, a, b, p, c) => `<div class="sc-kond__z">${id ? `<button type="button" data-gehe="haus:${esc(id)}">${esc(name)}</button>` : `<b>${esc(name)}</b>`}<span data-l="Website">${esc(a)}</span><span data-l="Betreuung">${esc(b)}</span><span data-l="Premium" class="sc-kond__prem">${esc(p)}</span><span data-l="Werkzeuge">${esc(c)}</span></div>`;
  const gruppe = (t, rows) => `<div class="sc-kond__g"><p class="wo-mk">${esc(t)}</p>${rows}</div>`;
  const tab = `<div class="sc-kond__tab" data-r><div class="sc-kond__z sc-kond__z--kopf"><b>Haus</b><span>Website einmalig</span><span>Betreuung im Monat</span><span class="sc-kond__prem">Premium im Monat<em>zu besprechen</em></span><span>Werkzeuge im Monat</span></div>
      ${E.map(e => gruppe(e.mk === 'Schweiz' || e.mk === 'Deutschland' ? `${e.t} ${e.mk === 'Schweiz' ? 'Schweiz' : 'Deutschland'}` : e.t, e.l.map(h => zeile(h.name, h.id, txtWeb(h), txtBet(h), premium(h), txtWz(h))).join(''))).join('')}
      ${NW ? gruppe('Netzwerk, auf Empfehlung im Bekanntenkreis', zeile('Jeder empfohlene Betrieb', '', NW.z[0][1], 'Basis ' + NW.z[1][1].replace(' im Monat', ''), eins('€', betrag(NW.z[1][1]) * 2), NW.z.slice(2).map(z => z[0].replace(/,.*/, '') + ' ' + z[1].replace(' im Monat', '') + (/zwei/i.test(z[0]) ? ' mit zwei' : ' mit allen')).join(' · '))) : ''}
      ${ohne.length ? gruppe('Ohne Preis', ohne.map(h => zeile(h.name, h.id, 'kein Preis', '–', '–', '–')).join('')) : ''}</div>`;
  return `${band}<div class="sc-ebenen" style="--sp:${spalten(tafeln.length)}" data-r>${tafeln.join('')}</div><h3 class="sc-offen__t" data-r>Jedes Haus</h3><p class="sc-kond__prem-satz" data-r><b>Wartung Premium, zu besprechen.</b> Wir übernehmen auch alle Änderungen an der Website. Je Haus das Doppelte der heutigen Betreuung, bei den Hotels CHF 700 statt CHF 350.</p>${tab}`;
}
/* Laufende Kosten (Robert 17.11.2026): Anbieter, was sie kosten, warum, was nie anfällt, was uns ein Haus kostet. Texte in wissen.js «kosten». */
function laufendeKosten() {
  const K = W.kosten; if (!K) return '';
  return `<section class="sc-block">${kopfBlock(['Laufende', 'Kosten.'], K.satz)}
      <div class="sc-karten2" data-r>${karteListe('Zwei Arten von Kosten', K.arten, 'blatt')}${karteListe('Was nie anfällt', K.nie, 'schild')}</div>
      <h3 class="sc-offen__t" data-r>Die Anbieter im Hintergrund</h3>
      <dl class="sc-themen" data-r>${K.anbieter.map(a => `<div><dt><b>${esc(a[0])}</b><small>${esc(a[1])}</small></dt><dd>${esc(a[2])}</dd></div>`).join('')}</dl>
      <h3 class="sc-offen__t" data-r>Warum so, und was bei einer Grenze passiert</h3>
      <div class="sc-karten2 sc-karten2--hell" data-r>${karteListe('Warum Cloudflare', K.warum, 'haus')}${karteListe('Grenzen', K.grenzen, 'welt')}</div>
      <h3 class="sc-offen__t" data-r>Was uns ein Haus kostet</h3>
      <div class="sc-kond__drei" data-r>${K.uns.map(x => `<div><span class="wo-mk">${esc(x[0])}</span><p>${esc(x[1])}</p></div>`).join('')}</div>
      <p class="sc-kond__prem-satz" data-r>${esc(K.unsSatz)}</p></section>`;
}
/* Konditionen neu (Robert 16.11.2026: «was ist das für ne Seite? sieht Müll aus, und inhaltlich?»): nur Festgelegtes, aus «Kunden», als Tafeln, ohne Leerflächen */
function konditionen() {
  const chfH = h => h.preis && h.preis.betrag && waehrung(h) === 'CHF' && !h.pitch;
  const einzelnVon = h => ((h.preis || {}).paket || {}).einzeln || h.preis.betrag;
  const haeufig = l => { const m = new Map(); l.forEach(v => m.set(v, (m.get(v) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]; };
  const seg = sp => { const l = kunden().filter(h => sparte(h) === sp && chfH(h)); if (!l.length) return null;
    const e = haeufig(l.map(einzelnVon)), b = haeufig(l.map(h => betrag(h.preis.betreuung_website)).filter(Boolean)), w = haeufig(l.map(h => betrag(h.preis.abo_werkzeuge)).filter(Boolean));
    return { e, b, w, aus: l.filter(h => einzelnVon(h) !== e).map(h => h.name + ' CHF ' + zahlCh(einzelnVon(h))) }; };
  const ho = seg('hotel'), ga = seg('gastro'), nw = kunden().find(h => h.pitch && offen(h));
  const tafel = (mk, t, gross, klein, zeilen, fuss) => `<article class="sc-kond__k"><span class="wo-mk">${esc(mk)}</span><h3>${esc(t)}</h3><p class="sc-kond__gross"><b>${esc(gross)}</b><small>${esc(klein)}</small></p>
      <dl>${zeilen.map(z => `<div><dt>${esc(z[0])}</dt><dd>${esc(z[1])}</dd></div>`).join('')}</dl>${fuss ? `<p class="sc-kond__fuss">${esc(fuss)}</p>` : ''}</article>`;
  const fams = FAMILIEN.map(f => { const l = f.ids.map(haus).filter(h => h && offen(h)), pk = l.length && (l[0].preis || {}).paket; if (!pk || !pk.gesamt) return '';
    const EG = [...new Set(l.map(h => (h.preis.paket || {}).einzeln).filter(Boolean))].sort((a, b) => b - a);
    return `<article class="sc-kond__f"><span class="wo-mk">${esc(mz(l.length, 'Haus', 'Häuser'))}</span><h4>${esc(f.t[0].replace(/\.$/, ''))}</h4><b>CHF ${zahlCh(pk.gesamt)}</b><small>mit gemeinsamer Startseite · einzeln ${EG.map(v => 'CHF ' + zahlCh(v)).join(' oder ')}</small><button type="button" class="sc-kond__auf" data-gehe="familie:${esc(f.k)}">Familien-Mappe${WO.ic('rechts')}</button></article>`; }).join('');
  const euro = kunden().filter(h => offen(h) && preisCur(h) === '€' && h.preis && /^(hotel|gastro)$/.test(sparte(h)));
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO('tafel'), h1: 'Die <em>Konditionen</em>', zier: esc('Für jedes Gespräch'),
      satz: 'Was eine Website mit Werkzeugen kostet, was die Betreuung enthält, was dem Haus gehört und wie es abläuft. Den Betrag für ein bestimmtes Haus findest du in seiner Mappe.',
      knoepfe: WO.knopf('Antworten', 'chat', 'gold', { attr: 'data-gehe="antworten"' }) + WO.knopf('Offene Häuser', 'links', 'glas', { attr: 'data-gehe="start"' }) })}
    <section class="sc-block">${kopfBlock(['Die', 'Preise.'], 'Sechs Ebenen, vom kleinen Betrieb bis zum Grandhotel. Alles netto, Betreuung und Werkzeuge monatlich kündbar.')}
      ${preisEbenen()}
      ${fams ? `<h3 class="sc-offen__t" data-r>Familienpakete</h3><div class="sc-kond__fams" style="--sp:${(fams.match(/<article/g) || []).length}" data-r>${fams}</div>` : ''}
    </section>
    <section class="sc-block">${kopfBlock(['Die', 'Betreuung.'], W.paketeFuss)}
      <div class="sc-karten2" data-r>${(W.pakete || []).map((k, i) => karteListe(k.name, k.punkte, i ? 'blatt' : 'welt').replace('<ul>', `<p class="sc-karte2__satz">${esc(k.satz)}</p><ul>`)).join('')}</div></section>
    <section class="sc-block">${kopfBlock(['Eigentum', 'und Extras.'], 'Was dem Haus gehört und welche Rechnungen beim Haus bleiben.')}
      <div class="sc-karten2 sc-karten2--hell" data-r>${karteListe('Was dem Haus gehört', W.gehoert || [], 'haus')}${karteListe('Gut zu wissen', extraListe(), 'schild')}</div></section>
    ${laufendeKosten()}
    <section class="sc-block">${kopfBlock(['Zahlung und', 'bis online.'], 'Wann das Haus zahlt und wann die Seite steht.')}
      <div class="sc-kond__drei" data-r>${[['Der einmalige Betrag', zahlungListe()[0]], ['Betreuung und Werkzeuge', zahlungListe()[1]], ['Bis online', dauerText()]].filter(x => x[1]).map(x => `<div><span class="wo-mk">${esc(x[0])}</span><p>${esc(x[1])}</p></div>`).join('')}</div></section>
    <section class="sc-block">${kopfBlock(['Der', 'Ablauf.'], 'Acht Schritte vom ersten Treffen bis zum Umzug. Je Schritt, was wir tun und was das Haus beiträgt.')}${wochen()}</section>
    <p class="sc-quelle">Preise aus «Kunden» · Betreuung, Eigentum, Ablauf: ${esc(W.quelleA)}</p>`;
}
function antworten() {
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO('empfang'), h1: 'Die <em>Antworten</em>', zier: esc('Für jedes Gespräch'),
      satz: 'Die Fragen, die im Gespräch kommen, mit den Antworten, die belegt sind. In der Mappe eines Hauses stehen dieselben Antworten mit seinem Preis und seinen Werkzeugen.',
      knoepfe: WO.knopf('Konditionen', 'balken', 'gold', { attr: 'data-gehe="konditionen"' }) + WO.knopf('Offene Häuser', 'links', 'glas', { attr: 'data-gehe="start"' }) })}
    <section class="sc-block">${kopfBlock(['Fragen,', 'die kommen.'], 'Ein Klick öffnet die Antwort.')}${fragenBlock(null, true)}</section>
    <section class="sc-block">${kopfBlock(['Wo die KI', 'arbeitet.'], (W.ki || {}).satz)}
      <dl class="sc-themen" data-r>${((W.ki || {}).stellen || []).map(s => `<div><dt><b>${esc(s[0])}</b><small>${esc(s[1])}</small></dt><dd>${esc(s[2])}</dd></div>`).join('')}</dl></section>
    <p class="sc-quelle">Quelle: ${esc(W.quelleW)} · ${esc(W.quelleA)} · Website bearbeiten: Marke &amp; Vision, Kapitel «Unsere Werkzeuge»</p>`;
}

/* ---------------------------------------------------------------- Unser Start (Robert 11.11.2026: «Annas Start im Vertrieb und den Vertrag … alles auf so einem richtig geilen Cockpit in so einer View»;
   «… auch die Möglichkeit haben, da Fragen einzutragen zum Vertrag oder Ergänzungen»). Alles als Ideen formuliert, auf Augenhöhe. */
const VERTRAG = 'start/vertrag.html', VERTRAG_PDF = 'start/Vertrag-Anna-Llorens-Entwurf.pdf';
/* Vertrag mit dem Haus beim Preis jeder Mappe, als Blatt wie der Vertrag in «Unser Start» (Robert 19.11.2026: «so eine PDF-Datei … dass man die erste Seite sieht … ein bisschen Text daneben rechts») */
const VERTRAG_HAUS = 'vertrag-haus/vorlage.html', VERTRAG_HAUS_PDF = 'vertrag-haus/Vertrag-Haus-Entwurf.pdf';
const vertragHausBlock = () => `<div class="sc-web sc-brief sc-brief--haus" data-r>
        <a class="sc-brief__blatt" href="${VERTRAG_HAUS_PDF}" target="_blank" rel="noopener" aria-label="Vertrag öffnen"><iframe src="${VERTRAG_HAUS}" title="Vertrag mit dem Haus, Entwurf" tabindex="-1" loading="lazy" scrolling="no"></iframe></a>
        <div class="sc-brief__rechts">
          <dl class="sc-web__fakten">
            <div><dt>Der Vertrag · Erster Entwurf</dt><dd><small>Vertrag über Website, Werkzeuge und Betreuung, eine Vorlage für alle Häuser. Er regelt Ablauf bis zur Übergabe, Mitwirkung des Hauses, Zahlung, Betreuung, Eigentum, Kosten Dritter, Datenschutz und Kündigung.</small></dd></div>
            <div><dt>Noch offen · grau markiert</dt><dd><small>Die Beträge, Steuern und Zahlungsziel, Haftung, Kündigungsfrist, Recht und Gerichtsstand.</small></dd></div>
          </dl>
          <div class="sc-brief__kn">${WO.knopf('Vertrag öffnen', 'pfeil', 'gold', { klein: true, href: VERTRAG_HAUS_PDF, neu: true })}${WO.knopf('Herunterladen', 'pdf', 'dunkel', { klein: true, href: VERTRAG_HAUS_PDF, attr: 'download' })}</div>
        </div>
      </div>`;
const START_THEMEN = ['Vertrag', 'Ablauf', 'Geld', 'Rechtsform', 'Sonstiges'];
const startNotizen = () => ((S.d && S.d.start && S.d.start.notizen) || []);
const offeneFragen = () => startNotizen().filter(n => !n.antwort).length;
const START_ABLAUF = [
  ['Tag 0 · Erster Anruf', 'Ein Anruf, der die Präsentation ankündigt', 'Mit der Schweizer Nummer herausfinden, wer im Haus entscheidet, und ankündigen, dass etwas kommt. Ein Anruf, der etwas ankündigt, wird vermutlich seltener abgewimmelt als ein Verkaufsanruf.'],
  ['Tag 1 · Präsentation', 'Die Präsentation als PDF per Mail', 'Die Mail könnte an die Person aus dem Anruf gehen. Der Code im PDF führt direkt auf die fertige Website des Hauses, das PDF liegt in der Mappe jedes Hauses.'],
  ['Geöffnet · Zweiter Anruf', 'Ein zweiter Anruf, sobald jemand die Seite öffnet', 'Das wäre ein guter Moment, 30 Minuten per Video vorzuschlagen. Dass wir das Öffnen gesehen haben, würden wir nicht erwähnen.'],
  ['Gespräch', 'Das Videogespräch', 'Wir zeigen die Werkzeuge und beantworten die Fragen des Hauses. Ob Anna das Gespräch allein führt oder Robert dabei ist, entscheidet sie selbst.'],
  ['Tag 7 und 14 · Nachfassen', 'Nachfassen, wenn niemand geöffnet hat', 'Ein Anruf nach einer und nach zwei Wochen wäre eine Möglichkeit. Als zweiter Anlass könnte der KI-Check dienen.'],
  ['Tag 30 · Designstudie', 'Das Haus wird Designstudie', 'Kommt nichts zustande, könnten wir das Haus in den Newsletter aufnehmen und den Entwurf als Designstudie zeigen.']
];
const START_WOCHEN = [
  ['Zuerst die drei stärksten Häuser?', 'Die erste Runde könnten wir mit den drei Häusern machen, die am besten zu uns passen. Danach vielleicht fünf Häuser pro Woche, damit das Nachfassen machbar bleibt.'],
  ['Dein Netzwerk als Anfang?', 'Leute aus dem Rivage, aus F&B und aus dem Eventbereich kennen dich und andere Häuser. Über so einen Weg kämen die ersten Kunden vermutlich schneller als über kalte Listen.'],
  ['Der KI-Check öffnet Türen', 'Annas Idee: Eine neue Website schiebt jedes Haus auf, falsche Auskünfte von ChatGPT an Gäste sind dagegen ein Problem von heute.'],
  ['Einmal pro Woche 30 Minuten?', 'Darin könnten wir durchgehen, wo jedes Haus steht, wer als Nächstes angerufen wird und was in den Gesprächen gefragt wurde.']
];
const START_GELD = [
  ['Das Haus sagt zu', 'Robert würde die Rechnung über Tasty Studios schreiben, für den Bau und für die monatliche Betreuung.'],
  ['Das Geld kommt an', 'Die Zahlung käme auf ein eigenes Konto nur für Tasty Studios.'],
  ['Annas Rechnung', 'Bis zum 10. jedes Monats bekäme Anna eine Abrechnung über den Vormonat mit jeder Zahlung und jeder Ausgabe. Darauf würde sie ihre Hälfte in Rechnung stellen, nach Abzug der Kosten vom gemeinsamen Betrag.'],
  ['Die Auszahlung', 'Annas Hälfte käme innerhalb von 14 Tagen nach ihrer Rechnung. Jeder würde seine Hälfte selbst versteuern, Anna in Spanien.']
];
const START_FORM = [
  ['Jetzt: Robert als Einzelunternehmen', 'Es braucht weder eine Gründung noch eine jährliche Bilanz. Anna arbeitet als freie Vertriebspartnerin, bekommt ihre Hälfte vom ersten Verkauf an und haftet für nichts.'],
  ['Später: eine UG oder GmbH', 'Dort haftet nur die Firma, nicht wir privat. Steuerlich lohnt sie sich laut gängigen Ratgebern ab etwa 60.000 bis 100.000 Euro Gewinn im Jahr. Die Gründung kostet laut Ratgebern grob 500 bis 1.000 Euro, dazu jedes Jahr die Bilanz. Beide Zahlen sind noch nicht von einer Steuerberatung geprüft.'],
  ['Warum wir die GbR auslassen würden', 'In einer GbR haften beide Partner mit ihrem Privatvermögen für alles, was die Firma schuldet. Dieses Risiko würden wir uns beiden gern ersparen.'],
  ['Was im Vertrag stehen sollte', 'Dass Anna als freie Vertriebspartnerin für einen Anteil arbeitet und wir keine Gesellschaft bilden. Sonst kann ungewollt eine GbR entstehen.']
];
const START_VERTRAG = [
  ['Vergütung', 'Die Hälfte aller Kundenzahlungen nach Abzug der gemeinsamen Kosten beider Seiten ab der Unterschrift (§ 4)'],
  ['Abrechnung', 'Monatlich, über ein eigenes Konto für Tasty Studios, mit Einsicht in Rechnungen und Zahlungseingänge (§ 5)'],
  ['Selbstständig', 'Keine festen Zeiten, kein Mindestumsatz, frei für andere Tätigkeiten, keine Haftung für Anna (§ 3, § 14)'],
  ['Gemeinsame Firma', 'UG oder GmbH zu gleichen Teilen, sobald es steuerlich am meisten Sinn macht (§ 11)'],
  ['Laufzeit', 'Gesetzliche Kündigungsfristen, im ersten Jahr ein Monat, Überprüfung im März 2027, nach dem Ende bis zu zwölf Monate Beteiligung (§ 12, § 13)']
];
const START_OFFEN = [
  ['§ 4', 'Wer zählt als Kunde?', 'Die Hälfte für alle neuen Kunden oder nur für Kunden, die über Anna kommen?', 'Alle neuen Kunden, egal wer sie bringt.'],
  ['§ 11', 'Ab wann die Firma?', 'Ab welcher Summe monatlicher Betreuung gründen wir die gemeinsame Firma?', 'Sobald es steuerlich am meisten Sinn macht. Den Zeitpunkt nennt uns die Steuerberatung, spätestens im März 2027 legen wir fest, wann wir gründen.'],
  ['§ 13', 'Die Fristen', 'Zwölf Monate Beteiligung nach Vertragsende und drei Monate Kündigungsfrist: passt das?', 'Es gelten die gesetzlichen Kündigungsfristen, nichts darüber hinaus: ein Monat im ersten Jahr, steigend bis sechs Monate nach fünf Jahren, jeweils zum Monatsende.'],
  ['§ 3', 'Andere Anbieter', 'Soll die Vermittlung vergleichbarer Leistungen anderer Anbieter ausgeschlossen sein?', 'Kein Ausschluss. Anna ist frei, auch für andere tätig zu sein.']
];
/* Der Vertrag in einfachen Worten für Anna (Robert 14.11.2026: «dass sie versteht, was genau die Intention war … wohlwollend ihr gegenüber formuliert,
   woher die Richtung kommt … ich bringe die kompletten Produkte und Systeme mit und sie bringt ihre Kompetenz mit»). Inhalt nur aus start/vertrag.html. */
const WARUM_MIT = [
  ['Was Robert mitbringt', 'Tasty Studios', ['Die vorgebauten Websites und Werkbänke für die Häuser hier im Cockpit', 'Die sieben Werkzeuge, die jedes Haus bekommt', 'Das Notion AI Backoffice und die Masterclass, die gerade entsteht', 'Die internen Werkzeuge, mit denen wir arbeiten, vom Sales Cockpit bis zur Kundenliste']],
  ['Was Anna mitbringt', 'Die Häuser', ['Ihre Erfahrung als stellvertretende Hoteldirektorin im Grand Beau-Rivage Interlaken, davor in F&B und im Eventmanagement', 'Den Blick von innen: wie ein Haus entscheidet und was Direktion und Eigentümer wirklich brauchen', 'Den Kontakt zu den Häusern und ihr Netzwerk in der Hotellerie', 'Den Vertrieb: Sie führt die Gespräche mit den Häusern und baut ihn so auf, wie sie es für richtig hält']]
];
const WARUM = [
  ['§ 4', 'Wer bekommt was, wenn ein Kunde zahlt?', 'Wir teilen alles, was unsere Kunden ab der Unterschrift zahlen, nach Abzug der Kosten zur Hälfte. Das gilt egal, wer den Kunden gebracht hat.'],
  ['§ 2 · § 3', 'Was erwarte ich von dir?', 'Keine festen Zeiten, keine Mindestzahl an Gesprächen, keinen Mindestumsatz. Wie du den Vertrieb aufbaust, entscheidest du selbst, und daneben darfst du für andere arbeiten. Ich suche eine Partnerin, keine Angestellte.'],
  ['§ 3', 'Was passiert bis März 2027?', 'Ich muss bis Ende März 2027 entscheiden, wie es beruflich für mich weitergeht. Deshalb steht unser gemeinsames Ziel im Vertrag: Bis dahin soll aus unserem Gewinn eine Existenz entstehen können. Eine Pflicht für dich wird daraus nicht. Im März setzen wir uns zusammen und schauen, wo wir stehen. Passt es für einen von uns dann nicht, kann jeder mit einem Monat Frist aussteigen, ohne Begründung. Was wir bis dahin verkauft haben, teilen wir trotzdem zur Hälfte, auch wenn das Geld später kommt.'],
  ['§ 4 · § 6', 'Wer zahlt die Kosten?', 'Was ich bis zur Unterschrift investiert habe, trage ich allein. Ab der Unterschrift teilen wir die laufenden Kosten beider Seiten: meine Abos für KI und Software, dein Telefon und deine Werkzeuge für den Vertrieb. Was vor der ersten Kundenzahlung anfällt, verrechnen wir mit den ersten Einnahmen. Ist ein Monat im Minus, trägst du davon nichts. Geräte wie Computer oder Handy zahlt bis zur Firma jeder selbst.'],
  ['§ 5', 'Wie siehst du, dass alles stimmt?', 'Bis zum 10. jedes Monats bekommst du eine Abrechnung, in der jede Zahlung und jede Ausgabe steht. In die Rechnungen, die Zahlungseingänge und alle Belege kannst du jederzeit hineinsehen. Das Geld läuft über ein Konto, das nur für Tasty Studios da ist.'],
  ['§ 10', 'Wem gehört, was wir aufbauen?', 'Websites, Werkzeuge und die digitalen Produkte liegen bis zur Firma bei Tasty Studios, damit die Kunden alle Rechte aus einer Hand bekommen. Verdient wird daran von Anfang an zur Hälfte. Bei der Gründung bringe ich alles ein, und meine Vorarbeit bringt mir keinen grösseren Anteil. Deine Kontakte bleiben deine.'],
  ['§ 11 · § 14', 'Wann wird daraus eine gemeinsame Firma?', 'Ich will diese Firma mit dir gründen: eine UG oder GmbH, die uns beiden zur Hälfte gehört. Spätestens im März 2027 legen wir gemeinsam fest, wann wir damit starten, den Zeitpunkt stimmen wir mit der Steuerberatung ab. Bis dahin bilden wir bewusst keine Gesellschaft: Für Schulden von Tasty Studios oder Mängel an einer Website haftest du nicht.'],
  ['§ 13', 'Was gilt, wenn sich unsere Wege trennen?', 'Ich gehe davon aus, dass es lange hält, aber wir regeln es schon jetzt. Kündige ich, bist du noch zwölf Monate zur Hälfte an allen laufenden Zahlungen und an den Verkäufen der digitalen Produkte beteiligt, damit dein Aufbau geschützt ist. Kündigst du, ist es ein Monat je Monat der Zusammenarbeit, höchstens sechs.']
];
/* Roberts persönliche Einschätzung (Robert 14.11.2026: «so als meine persönliche Einschätzung zum Vertrag, warum ich ihr das guten Gewissens vorlegen kann») */
const EINSCHAETZUNG = {
  /* Robert 17.11.2026: nicht verteidigen, was ich mitbringe; die vier Monate bis März als gemeinsame Zeit, um zu sehen, wie die Zusammenarbeit läuft;
     Freiheit ohne Mindestzeit und Mindestumsatz, aber die vier Monate werden genutzt */
  auftakt: 'Dieser Vertrag gilt für die Zeit, bis wir unsere gemeinsame Firma gründen. Wir starten mit fertigen Websites für die Häuser hier im Cockpit und mit den sieben Werkzeugen, die jedes Haus bekommt. Von dieser Ausgangslage gehen die Regeln aus, und so möchte ich sie verstanden wissen: als Rahmen für unseren Anfang.',
  teile: [
    ['Beim Geld von Anfang an gleich', 'Ab der Unterschrift bekommst du die Hälfte von allem, was unsere Kunden zahlen, nach Abzug der Kosten. Ist ein Monat im Minus, trägst du davon nichts, zuzahlen musst du nie. Endet die Zusammenarbeit, bist du noch eine Zeit lang an allen laufenden Einnahmen beteiligt, egal wer kündigt (§ 13).'],
    ['Die vier Monate bis März', 'Bis Ende März 2027 sind es vier Monate. In dieser Zeit sehen wir, wie wir wirklich zusammenarbeiten. Das wissen wir heute beide noch nicht, und das sollten wir uns offen sagen. Ob die Chemie stimmt, merkt man erst, wenn man gemeinsam Häuser anspricht und auf die ersten Zusagen und Absagen reagiert. Im März setzen wir uns zusammen und schauen, wo wir stehen.'],
    ['Warum vier Monate', 'Würden wir bei null anfangen, hätte ich einen längeren Zeitraum gewählt. Wir fangen aber mit Häusern an, für die die neue Website schon steht, und mit allem, was es für die Gespräche braucht. Damit lässt sich in vier Monaten viel bewegen. Und wenn wenig passiert, sehen wir das in derselben Zeit genauso deutlich.'],
    ['Was ich mir in dieser Zeit wünsche', 'Im Vertrag stehen keine festen Zeiten und kein Mindestumsatz. Diese Freiheit hast du dir gewünscht. Wir können sie so vereinbaren, wenn das Vertrauen auf einer Grundlage steht, die für uns beide passt. Die Grundlage für dieses Vertrauen sind die vier Monate: Ich wünsche mir, dass du sie für unseren Vertrieb nutzt, die Häuser anrufst und die Gespräche führst, in deinem Tempo und auf deine Art. Was jeder von uns in dieser Zeit beiträgt, ist im März unsere Grundlage für die Entscheidung. Passt es für uns beide, gründen wir. Passt es für einen von uns nicht, gehen wir fair auseinander: Was bis dahin verkauft ist, teilen wir weiter, und du bekommst alles, was dir gesetzlich zusteht.']
  ],
  schluss: 'Die Regeln zu Rechten und Haftung beschreiben den Stand, von dem wir heute ausgehen: Die Produkte gibt es schon, und gegenüber den Kunden haftet bis zur Gründung Tasty Studios. Sie sind für den Anfang gedacht. Spätestens im März legen wir gemeinsam fest, wann wir die Firma gründen, die uns beiden zur Hälfte gehört, und darauf freue ich mich. Dann fliesst alles, was bis dahin entstanden ist, dort hinein. Für diesen Anfang halte ich den Vertrag für richtig, und deshalb lege ich ihn dir guten Gewissens vor.'
};
const paraZ = t => { const n = String(t).replace(/§\s*/g, '').trim(); return /^§/.test(String(t).trim()) ? `<span class="sc-offen__p sc-offen__p--z${n.length > 2 ? ' sc-offen__p--viel' : ''}" aria-label="${esc(t)}"><i>§</i><em>${esc(n)}</em></span>` : `<span class="sc-offen__p">${esc(t)}</span>`; };
/* Unser Start in der Reihenfolge, in der Anna die Themen braucht (Robert 17.11.2026: «das Puzzle muss wirklich ganz genau nebeneinander aufbauen»):
   Was wir mitbringen → erste Wochen → Weg zum Kunden → Uhrzeiten → Zusammenarbeit → Geld → Kosten → Firma → Trennung → Einschätzung → Offen → Unterlagen → Fragen.
   Jedes Thema steht an einer Stelle; die Fragen aus WARUM stehen beim Kapitel, zu dem sie gehören. */
const warumKarten = (idx, eins) => `<div class="sc-offen${eins ? ' sc-offen--eins' : ''}" data-r data-start-sicht>${idx.map((n, i) => { const o = WARUM[n]; return `<div class="sc-offen__k sc-offen__k--para" style="--i:${i}">${paraZ(o[0])}<b>${esc(o[1])}</b><p>${esc(o[2])}</p></div>`; }).join('')}</div>`;
const mitbringenBlock = () => `<section class="sc-block sc-block--eng" id="wir-start">${kopfBlock(['Was wir', 'mitbringen.'], 'Was jeder von uns mitbringt, und warum wir deshalb von Anfang an zu gleichen Teilen arbeiten.')}
      <div class="sc-stufen" data-r data-start-sicht>
        <div class="sc-stufen__s"><span class="wo-mk">${esc(WARUM_MIT[0][0])}</span><b>${esc(WARUM_MIT[0][1])}</b>${liste(WARUM_MIT[0][2])}</div>
        <div class="sc-stufen__weg" aria-hidden="true"><span>zusammen</span></div>
        <div class="sc-stufen__s sc-stufen__s--dann"><span class="wo-mk">${esc(WARUM_MIT[1][0])}</span><b>${esc(WARUM_MIT[1][1])}</b>${liste(WARUM_MIT[1][2])}</div>
        <div class="sc-stufen__fuss"><p><b>Beides ist gleich viel wert.</b> Ohne Häuser, die zuhören, bleibt jede Website ein Entwurf. Ohne fertige Produkte gibt es nichts, was man einem Haus zeigen kann.</p><p><b>Deshalb gleiche Teile von Anfang an.</b> Die Regeln im Vertrag gleichen nur aus, dass einer von uns schon Produkte mitbringt und der andere gerade erst einsteigt.</p></div>
      </div>
    </section>`;
const zusammenarbeitBlock = () => `<section class="sc-block sc-block--eng" id="vertrag">${kopfBlock(['Wie wir', 'zusammenarbeiten.'], 'Die Grundlage ist der Entwurf unseres Partnerschafts- und Provisionsvertrags: gleiche Teile von Anfang an, frei in der Arbeit, mit dem Weg in eine gemeinsame Firma. Vor der Unterzeichnung prüfen wir ihn mit einer Rechts- und Steuerberatung. Die folgenden Abschnitte gehen ihn Thema für Thema durch, jeweils mit dem Paragrafen.')}
      <div class="sc-web sc-brief" data-r>
        <a class="sc-brief__blatt" href="${VERTRAG_PDF}" target="_blank" rel="noopener" aria-label="Vertrag öffnen"><iframe src="${VERTRAG}" title="Vertragsentwurf" tabindex="-1" loading="lazy" scrolling="no"></iframe></a>
        <div class="sc-brief__rechts">
          <dl class="sc-web__fakten">${[1, 2].map(n => `<div><dt>${esc(WARUM[n][0])} · ${esc(WARUM[n][1])}</dt><dd><small>${esc(WARUM[n][2])}</small></dd></div>`).join('')}</dl>
          <div class="sc-brief__kn">${WO.knopf('Vertrag öffnen', 'pfeil', 'gold', { klein: true, href: VERTRAG_PDF, neu: true })}${WO.knopf('Herunterladen', 'pdf', 'dunkel', { klein: true, href: VERTRAG_PDF, attr: 'download' })}</div>
        </div>
      </div>
    </section>`;
const firmaBlock = () => `<section class="sc-block sc-block--eng" id="form-start">${kopfBlock(['Über welche', 'Firma.'], 'Bis zur gemeinsamen Firma laufen die Verkäufe über Roberts Einzelunternehmen. Eine eigene Firma lohnt sich erst mit genug Gewinn.')}
      <div class="sc-stufen" data-r data-start-sicht>
        <div class="sc-stufen__s"><span class="wo-mk">Jetzt</span><b>Einzel­unternehmen</b>${liste(['Keine Gründung, keine Bilanz', 'Anna haftet für nichts', 'Die Hälfte ab dem ersten Verkauf'])}</div>
        <div class="sc-stufen__weg" aria-hidden="true"><i></i></div>
        <div class="sc-stufen__s sc-stufen__s--dann"><span class="wo-mk">Später</span><b>UG oder GmbH</b>${liste(['Sobald es steuerlich am meisten Sinn macht', 'Nur die Firma haftet', 'Lohnt sich laut Ratgebern ab etwa 60.000 bis 100.000 Euro Gewinn im Jahr', 'Gründung laut Ratgebern grob 500 bis 1.000 Euro'])}</div>
        <div class="sc-stufen__fuss"><p><b>Die GbR würden wir auslassen.</b> Dort haften beide Partner mit ihrem Privatvermögen für alles, was die Firma schuldet.</p><p><b>Die Verträge liegen vorerst bei Tasty Studios.</b> Solange es unsere Firma noch nicht gibt, schliesst Tasty Studios die Verträge mit den Kunden und haftet ihnen gegenüber für jede Website und jedes Werkzeug. Deshalb liegen die Verträge und die Rechte an den Produkten bis zur Gründung dort. Das ist eine Frage der Haftung. Mit der Gründung geht alles in unsere gemeinsame Firma über.</p></div>
      </div>
      ${warumKarten([5, 6])}
      <p class="sc-fein" data-r>Die Zahlen zur UG stammen aus Ratgebern und sind noch nicht von einer Steuerberatung geprüft. Deshalb stehen sie nicht im Vertrag. Den Zeitpunkt bestimmen wir mit der Steuerberatung.</p>
    </section>`;
const einschaetzungBlock = () => `<section class="sc-block sc-block--eng" id="warum">${kopfBlock(['Meine', 'Einschätzung.'], '')}
      <div class="sc-offen sc-offen--eins" data-r data-start-sicht><div class="sc-offen__k sc-offen__k--fest sc-offen__k--brief"><b>Warum ich dir diesen Vertrag guten Gewissens vorlege</b><p class="sc-offen__auftakt">${esc(EINSCHAETZUNG.auftakt)}</p><div class="sc-offen__absaetze">${EINSCHAETZUNG.teile.map(x => `<div><span class="wo-mk">${esc(x[0])}</span><p>${esc(x[1])}</p></div>`).join('')}</div><p class="sc-offen__auftakt">${esc(EINSCHAETZUNG.schluss)}</p></div></div>
      <p class="sc-fein" data-r>Diese Seite fasst den Vertrag nur zusammen. Im Zweifel gilt der Vertrag selbst, Paragraf für Paragraf.</p>
    </section>`;
const offenBlock = () => `<section class="sc-block sc-block--eng" id="offen">${kopfBlock(['Was noch', 'offen ist.'], 'Was wir noch gemeinsam festlegen und was wir vor der Unterschrift prüfen lassen.')}
      <div class="sc-offen" data-r data-start-sicht>${START_OFFEN.map((o, i) => o[3] ? `<div class="sc-offen__k sc-offen__k--fest sc-offen__k--para" style="--i:${i}">${paraZ(o[0])}<b>${esc(o[1])}</b><p>${esc(o[3])}</p><span class="sc-offen__fest"><i>${WO.ic('haken')}</i>Roberts Vorschlag</span></div>` : `<div class="sc-offen__k sc-offen__k--para" style="--i:${i}">${paraZ(o[0])}<b>${esc(o[1])}</b><p>${esc(o[2])}</p><button type="button" class="sc-offen__kn" data-vorlage="${i}">Antwort eintragen${WO.ic('rechts')}</button></div>`).join('')}</div>
      <p class="sc-fein" data-r>Nach dem Ende der Zusammenarbeit (§ 13): ${esc(WARUM[7][2].replace(/^Ich gehe davon aus[^.]*\.\s*/, ''))} Beim Ausstieg im März gilt stattdessen § 3 Absatz 6.</p>
      <div class="sc-pruefen sc-pruefen--edel" data-r>${START_PRUEFEN.map((g, gi) => `<div><span class="sc-pruefen__ic" aria-hidden="true">${WO.ic(gi ? 'balken' : 'siegel')}</span><span class="wo-mk">Prüfen lassen</span><b class="sc-pruefen__t">${esc(g[0])}</b><ul>${g[1].map(x => `<li>${WO.ic('haken')}<span>${esc(x)}</span></li>`).join('')}</ul></div>`).join('')}</div>
    </section>`;
/* AZAV als Perspektive im Rahmen der Masterclass (Robert 19.11.2026: «Hinterkopf behalten … kleinen Bereich … perspektivische Planung im Rahmen Masterclass aber großes Thema»).
   Inhalt nur aus Angebot.md (Ebene 0) und 02 Projekte/AZAV KI-Schulungen.md. */
const azavBlock = () => `<section class="sc-block sc-block--eng" id="azav">${kopfBlock(['Später, mit der', 'Masterclass.'], 'Ein grosses Thema für später: staatlich geförderte KI-Schulungen nach AZAV. Sie bauen auf der Masterclass auf und kommen erst, wenn sie fertig ist.')}
      <div class="sc-stufen" data-r data-start-sicht>
        <div class="sc-stufen__s"><span class="wo-mk">Worum es geht</span><b>Geförderte Schulungen</b>${liste(['Teilnehmer lösen einen Bildungsgutschein ein, der Staat zahlt 1.500 bis 4.000 Euro je Teilnehmer', 'Online und live, vier bis acht Halbtage, von überall durchführbar', 'Die Gastro-Kurse der Masterclass werden zu einem Kurs zusammengeführt, der über die Zertifizierung läuft', 'Am Ende bekommen die Teilnehmer ein anerkanntes Zertifikat'])}</div>
        <div class="sc-stufen__weg" aria-hidden="true"><i></i></div>
        <div class="sc-stufen__s sc-stufen__s--dann"><span class="wo-mk">Der Weg dorthin</span><b>Erst die Masterclass</b>${liste(['Die Masterclass fertigstellen', 'Danach einen Anbieter für die Zertifizierung beauftragen, Kosten 2.000 bis 4.000 Euro, Dauer drei bis fünf Monate, ganz aus der Ferne', 'Prüfung durch die Zertifizierungsstelle, dann das Zertifikat', 'Danach der Vertrieb an Gastronomiebetriebe: Den Kurs bekommen sie über ihren Bildungsgutschein'])}</div>
        <div class="sc-stufen__fuss"><p><b>Für Lizenz und Post braucht es eine Adresse in Deutschland.</b> Welche das wird, klären wir, wenn es so weit ist.</p><p><b>Im Vertrag steht dazu noch nichts.</b> Wie wir die Schulungen zwischen uns aufteilen, besprechen wir, wenn wir das Thema angehen.</p></div>
      </div>
    </section>`;
const KOSTEN_TEILE = { web: 'Websites und Werkzeuge', bo: 'Backoffice', mc: 'Masterclass' };
const KOSTEN_LOGO = n => `bilder/dienste/${n}`;
/* [Teil, Hinweis, Name, Betrag, ab Monat, Logo, bis Monat, Firma für die Gruppe] */
const KOSTEN_POSTEN = [
  ['web', '', 'Erstes Konto (Max 20x)', 214.20, 0, 'claude.svg', undefined, 'Claude'],
  ['web', '', 'Zweites Konto (Max 20x)', 214.20, 0, 'claude.svg', undefined, 'Claude'],
  ['web', 'für Claude Code, erweiterbar auf Max 5x oder Max 20x', 'Konto Anna (Pro)', 21.42, 0, 'claude.svg', undefined, 'Claude'],
  ['web', 'optional, gebucht erst wenn nötig, nicht in der Summe', 'Drittes Konto (Max 20x)', 214.20, 0, 'claude.svg', undefined, 'Claude', 1],
  ['web', '', 'Adresse Robert', 8.10, 0, 'workspace.svg', undefined, 'Google Workspace'],
  ['web', '', 'Adresse Anna', 8.10, 0, 'workspace.svg', undefined, 'Google Workspace'],
  ['web', '', 'Backblaze, Datensicherung', 9.46, 0, 'backblaze.png'],
  ['web', '', 'Higgsfield, Grundbetrag', 20.11, 0, 'higgsfield.png'],
  ['web', 'optional für Anna, nicht in der Summe', 'LinkedIn Premium Business', 51.62, 0, 'linkedin.svg', undefined, undefined, 1],
  ['web', 'nur bei Anna', 'Telefon, als Beispiel', 10.00, 0, 'digi.png'],
  ['web', 'einmalig, so wenig wie möglich', 'Logo-Design', 200.00, 0, 'anker-navy.svg', 0],
  ['bo', '', 'Notion mit KI, Business-Plan für zwei', 50.80, 0, 'notion.png'],
  ['bo', '', 'Canva Pro', 12.00, 0, 'canva.png'],
  ['mc', '', 'Super.so', 14.23, 1, 'superso.svg']];
/* [Logo, Name, Preis, Zusatz zum Preis, Erklärung, Hinweis] */
const KOSTEN_ERKL = {
  web: [['claude.svg', 'Claude', '214,20 €', 'je Max-Konto im Monat. Gerechnet sind zwei Max-Konten, dazu Annas Konto Pro für 21,42 € im Monat.', 'Die KI, mit der Websites, Werkbänke, Werkzeuge und Unterlagen entstehen und über die wir das ganze Business steuern. Max 20x ist der größte Plan. Jedes Konto hat eine Grenze pro Woche, deshalb arbeiten wir mit mehreren Konten.', 'Anna bekommt ihr eigenes Konto mit Claude Code, damit sie KI im Vertrieb und in ihren Unterlagen selbst nutzt. Arbeitet sie intensiver damit, erweitern wir auf Max 5x (107,10 €) oder Max 20x (214,20 €). Ein drittes Max-Konto ist optional und nicht eingerechnet.'],
    ['backblaze.png', 'Backblaze', '9,46 €', 'im Monat', 'Sichert alle Projekte und Kundendaten automatisch, damit nichts verloren geht.', ''],
    ['workspace.svg', 'Google Workspace', '8,10 €', 'je Person im Monat, ohne Steuer. Für Anna und Robert.', 'Die E-Mail-Adressen @tasty-studios.de, dazu Kalender und gemeinsame Dokumente.', ''],
    ['higgsfield.png', 'Higgsfield', '20,11 €', 'Grundbetrag im Monat (22,61 USD), dazu Verbrauch.', 'KI für Bilder und Videos, etwa wenn Fotos eines Hauses verbessert oder neue Bilder gebraucht werden.', ''],
    ['linkedin.svg', 'LinkedIn Premium Business', '51,62 €', 'im Monat, optional', 'Für die Ansprache von Häusern und ihren Entscheidern im Vertrieb.', 'Optional: Anna entscheidet, ob sie es im Vertrieb braucht. Dann hat nur sie das Konto und rechnet es als gemeinsame Kosten ab. Robert braucht kein LinkedIn Premium.'],
    ['digi.png', 'Telefon', '10,00 €', 'im Monat, als Beispiel', 'Annas Telefon und mobile Daten für die Gespräche mit Kunden. Als Beispiel der Tarif «IlimiTODO» von Digi in Spanien.', '']],
  bo: [['notion.png', 'Notion mit KI', '50,80 €', 'im Monat für zwei Plätze (48 USD)', 'Das Backoffice entsteht in Notion. Der Business-Plan bringt die KI-Funktionen mit, die auch unsere Kunden nutzen, und Guthaben für Tests.', ''],
    ['canva.png', 'Canva Pro', '12,00 €', 'im Monat', 'Für Grafiken und Unterlagen rund um das Backoffice.', ''],
    ['enthalten', 'Claude', 'Schon enthalten', 'in den Konten zum Start', 'Die Grundstrukturen des Backoffice bauen wir mit den Konten, die wir haben, und holen das Beste daraus. Ein weiteres Konto nur, wenn es wirklich nötig ist.', '']],
  mc: [['superso.svg', 'Super.so', '14,23 €', 'im Monat (16 USD)', 'Macht aus den Notion-Seiten der Masterclass eine Website mit eigenem Design.', ''],
    ['higgsfield.png', 'Mehr Higgsfield', 'nach Verbrauch', '', 'Bilder für die Lektionen der Masterclass.', ''],
    ['enthalten', 'Claude', 'Schon enthalten', 'in den Konten zum Start', 'Auch die Masterclass bauen wir mit den Konten, die wir haben, und holen das Beste daraus. Ein weiteres Konto nur, wenn es wirklich nötig ist.', '']]};
const KOSTEN_LINK = { 'Claude': 'https://www.anthropic.com/claude', 'Mehr Claude': 'https://www.anthropic.com/claude', 'Backblaze': 'https://www.backblaze.com/', 'Google Workspace': 'https://workspace.google.com/', 'Higgsfield': 'https://higgsfield.ai/', 'Mehr Higgsfield': 'https://higgsfield.ai/', 'LinkedIn Premium Business': 'https://premium.linkedin.com/', 'Telefon': 'https://www.digimobil.es/movil/ilimitodo', 'Notion mit KI': 'https://www.notion.com/product/ai', 'Canva Pro': 'https://www.canva.com/pro/', 'Super.so': 'https://super.so/' };
const KOSTEN_BANNER = {
  web: ['anker-creme.svg', 'Zum Start', 'Websites und Werkzeuge', 'Websites, Werkbänke und die sieben Werkzeuge für die Häuser. Damit starten wir.', 'im Monat', 505.59],
  bo: ['t-navy.svg', 'Sobald wir starten', 'Backoffice', 'Das Notion AI Backoffice für Betriebe, fertig oder individuell gebaut.', 'zusätzlich im Monat', 62.80],
  mc: ['hut-creme.svg', 'Sobald wir starten', 'Masterclass', 'Die Gastronomy AI Masterclass, der Online-Kurs für Gastronomen.', 'zusätzlich im Monat', 14.23] };
const kostenBanner = t => { const b = KOSTEN_BANNER[t]; return `<header class="sc-kosten__banner sc-kosten__banner--${t}"><img class="sc-kosten__banner-gross" src="${KOSTEN_LOGO(b[0])}" alt=""><span class="sc-kosten__banner-zeichen"><img src="${KOSTEN_LOGO(b[0])}" alt=""></span><div class="sc-kosten__banner-text"><span class="wo-mk">${esc(b[1])}</span><h4>${esc(b[2])}</h4><p>${esc(b[3])}</p></div><p class="sc-kosten__banner-preis"><b>${t === 'web' ? '' : 'plus '}${eur(b[5])}</b><small>${esc(b[4])}</small></p></header>`; };
const KOSTEN_EINMALIG = ['anker-navy.svg', 'Logo-Design', '200,00 €', 'einmalig im Dezember, eingeplant', 'Eingeplant sind 200 € für das Logo-Design. Je weniger wir davon brauchen, desto besser.'];
const kostenLogo = (n, cls) => n === 'enthalten' ? `<span class="sc-kosten__logo sc-kosten__logo--enthalten" aria-hidden="true">${WO.ic('haken')}</span>` : `<span class="sc-kosten__logo${/workspace|superso/.test(n) ? ' sc-kosten__logo--breit' : ''}${cls ? ' ' + cls : ''}"><img src="${KOSTEN_LOGO(n)}" alt=""></span>`;
const KOSTEN_CLAUDE = [
  ['Websites', 'Jede Website für ein Haus, Seite für Seite, für Rechner und Handy, mit Texten, Bildern und Bewegung.'],
  ['Werkbänke', 'Die Vorstellung für jedes Haus: Befund der heutigen Seite, Entwürfe, Werkzeuge, Unterlagen und Preise an einem Ort.'],
  ['Die sieben Werkzeuge', 'Kontrollpanel, Website bearbeiten, Karten & Preislisten, Anfragen & Chat, Markenbuch, Besucher, Drucksachen & Feed. Jedes Haus bekommt sie in seinem eigenen Kleid.'],
  ['Prüfungen', 'Jede Seite wird vor dem Zeigen geprüft: auf Rechner und Handy, jeder Knopf, jede Verbindung, die Ladezeit. Erst wenn alles besteht, sieht ein Kunde sie.'],
  ['Monatliche Wartung', 'Die Betreuung der Kunden-Websites: Aktualisierungen, Sicherungen, Änderungen bis zum nächsten Werktag und das Beheben von Fehlern.'],
  ['Werkzeuge und Verbindungen im Hintergrund', 'Der Melder, der zeigt, wann ein Haus seine Seite öffnet. Die Wache, die alle fünf Minuten prüft, ob jede verschickte Seite erreichbar ist. Die Anbindungen an Buchung und Reservierung der Häuser. Ohne sie läuft nichts so, wie es soll.'],
  ['Unterlagen und Drucksachen', 'Speisekarten, Preislisten, Angebote, Verträge und die Feeds für Social Media.'],
  ['Backoffice und Masterclass', 'Das Notion AI Backoffice und die Lektionen der Masterclass, sobald wir in diese Themen gehen.'],
  ['Die Steuerung des Business', 'Das Sales Cockpit, die Kundenliste, die Planung und alles, womit wir den Überblick behalten.']];
const KOSTEN_BISHER = [['August 2026', 'Claude, 2 Konten 428,40 € · Higgsfield 101,96 € · ChatGPT 7,77 € · Gemini 21,99 €', 560.12], ['September 2026', 'Claude, 2 Konten 322,91 € · ChatGPT 16,95 €', 339.86], ['Oktober 2026', 'Claude, 4 Konten', 833.94], ['November 2026', 'Claude, 3 Konten je 214,20 €', 642.60]];
const KOSTEN_BISHER_LOGOS = [['claude.svg', 'Claude'], ['higgsfield.png', 'Higgsfield'], ['chatgpt.svg', 'ChatGPT'], ['gemini.svg', 'Gemini']];
const KOSTEN_MONATE = [['Dezember 2026', 'Das Backoffice startet Mitte Dezember.', '', 'Im Dezember kommt einmalig das Logo-Design dazu.'], ['Januar 2027', '', 'Die Arbeit an der Masterclass beginnt.'], ['Februar 2027', '', ''], ['März 2027', '', '']];
const eur = n => n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '’') + ' €';
const halb = n => Math.round(Math.round(n * 100) / 2) / 100;
const kostenMonat = (i, w) => KOSTEN_POSTEN.filter(k => w[k[0]] && i >= k[4] && (k[6] === undefined || i <= k[6]));
const kostenSumme = (i, w) => Math.round(kostenMonat(i, w).filter(k => !k[8]).reduce((a, k) => a + k[3] * 100, 0)) / 100;
const kostenZeilen = z => { const out = []; z.forEach(k => { const g = out[out.length - 1]; if (k[7] && g && g.firma === k[7]) g.z.push(k); else out.push({ firma: k[7], z: [k] }); }); return out.map(g => g.firma
  ? `<li class="sc-kosten__gruppe"><span class="sc-kosten__slot">${kostenLogo(g.z[0][5], 'sc-kosten__logo--klein')}</span><div><b class="sc-kosten__firma">${esc(g.firma)}</b><ul>${g.z.map(k => `<li${k[8] ? ' class="sc-kosten__optional"' : ''}><span>${esc(k[2])}${k[1] ? `<small>${esc(k[1])}</small>` : ''}</span><b>${eur(k[3])}</b></li>`).join('')}</ul></div></li>`
  : `<li${g.z[0][8] ? ' class="sc-kosten__optional"' : ''}><span class="sc-kosten__slot">${kostenLogo(g.z[0][5], 'sc-kosten__logo--klein')}</span><span>${esc(g.z[0][2])}${g.z[0][1] ? `<small>${esc(g.z[0][1])}</small>` : ''}</span><b>${eur(g.z[0][3])}</b></li>`).join(''); };
const kostenMonatInhalt = (i, w) => { const m = KOSTEN_MONATE[i]; return `${[m[3], w.bo && m[1], w.mc && m[2]].filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('')}${Object.keys(KOSTEN_TEILE).map(t => { const z = kostenMonat(i, w).filter(k => k[0] === t); return z.length ? `<span class="wo-mk">${esc(KOSTEN_TEILE[t])}</span><ul class="sc-kosten__l">${kostenZeilen(z)}${t === 'web' ? `<li class="sc-kosten__frei"><span class="sc-kosten__slot"><span class="sc-kosten__plus" aria-hidden="true">+</span></span><span>Platz für Annas Werkzeuge<small>tragen wir ein, sobald wir sie gemeinsam festgelegt haben</small></span><b>offen</b></li>` : ''}</ul>` : ''; }).join('')}<p class="sc-kosten__z"><span>Zusammen</span><b>${eur(kostenSumme(i, w))}</b></p><p class="sc-kosten__z sc-kosten__z--p"><span>Davon trägt jeder von uns die Hälfte<small>verrechnet mit dem Umsatz: abgezogen, bevor geteilt wird</small></span><b>${eur(halb(kostenSumme(i, w)))}</b></p>`; };
const kostenListe = (w, offen = [true]) => `<div class="sc-fragen sc-kosten">${KOSTEN_MONATE.map((m, i) => `<details class="sc-frage" data-monat="${i}"${offen[i] ? ' open' : ''}><summary><b>${esc(m[0])}</b><span class="sc-kosten__s">${eur(kostenSumme(i, w))}<small>je Person ${eur(halb(kostenSumme(i, w)))}</small></span><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a">${offen[i] ? kostenMonatInhalt(i, w) : ''}</div></details>`).join('')}</div>
      <div class="sc-kosten__ges"><p><span>Dezember bis März zusammen</span><b>${eur(KOSTEN_MONATE.reduce((a, m, i) => a + kostenSumme(i, w), 0))}</b></p><p><span>Davon je Person<small>verrechnet mit dem Umsatz</small></span><b>${eur(KOSTEN_MONATE.reduce((a, m, i) => a + halb(kostenSumme(i, w)), 0))}</b></p><small>So funktioniert der Abzug: Die gemeinsamen Kosten werden von den Einnahmen abgezogen, bevor geteilt wird. Damit trägt jeder von uns die Hälfte, auch von den Kosten, die bei Anna anfallen. Was anfällt, bevor der erste Kunde zahlt, wird gesammelt und mit den ersten Einnahmen verrechnet (§ 4).</small></div>`;
/* KI-Anteil der laufenden Kosten (Robert 16.11.2026: «505 € sind nicht die KI-Kosten, da sind Google, Backblaze usw. schon drin»): Claude und Higgsfield, ohne Optionales, Monat ohne Einmaliges */
const KI_MONAT = () => Math.round(kostenMonat(1, { web: 1 }).filter(k => !k[8] && /claude|higgsfield/.test(k[5])).reduce((a, k) => a + k[3] * 100, 0)) / 100;
const kostenBlock = () => `<section class="sc-block sc-block--eng" id="kosten">${kopfBlock(['Die laufenden', 'Kosten.'], 'Wir starten mit den Websites und Werkzeugen. Backoffice und Masterclass kommen dazu, sobald wir in diese Themen gehen. Unten lässt sich beides zuschalten, damit man sieht, was es kostet.')}
      <div class="sc-kosten__grundsatz" data-r><span class="wo-mk">${esc(WARUM[3][0])} · ${esc(WARUM[3][1])}</span><p>${esc(WARUM[3][2])}</p></div>
      <h3 class="sc-offen__t" data-r>Was die einzelnen Posten sind</h3>
      <div class="sc-kosten__teile" data-r>${Object.keys(KOSTEN_TEILE).map(t => `<div class="sc-kosten__teil">${kostenBanner(t)}<div class="sc-kosten__karten" style="--n:${Math.max(1, KOSTEN_ERKL[t].filter(k => !k[5]).length)}">${[...KOSTEN_ERKL[t].filter(k => k[5]), ...KOSTEN_ERKL[t].filter(k => !k[5])].map(k => `<article class="sc-kosten__karte${k[5] ? ' sc-kosten__karte--lang' : ''}"><a class="sc-kosten__kopf" href="${KOSTEN_LINK[k[1]]}" target="_blank" rel="noopener">${kostenLogo(k[0])}<h4>${esc(k[1])}</h4><span class="sc-kosten__seite">Seite ansehen${WO.ic('rechts')}</span></a><p>${esc(k[4])}</p>${k[5] ? `<p class="sc-kosten__hinweis">${esc(k[5])}</p>` : ''}<p class="sc-kosten__preis"><b>${esc(k[2])}</b>${k[3] ? `<small>${esc(k[3])}</small>` : ''}</p></article>`).join('')}${t === 'web' ? `<article class="sc-kosten__karte sc-kosten__karte--breit"><div class="sc-kosten__kopf">${kostenLogo(KOSTEN_EINMALIG[0])}<h4>${esc(KOSTEN_EINMALIG[1])}</h4></div><p>${esc(KOSTEN_EINMALIG[4])}</p><p class="sc-kosten__preis"><b>${esc(KOSTEN_EINMALIG[2])}</b><small>${esc(KOSTEN_EINMALIG[3])}</small></p></article><article class="sc-kosten__karte sc-kosten__karte--breit sc-kosten__karte--frei"><div class="sc-kosten__kopf"><span class="sc-kosten__logo sc-kosten__logo--frei" aria-hidden="true">+</span><h4>Annas Werkzeuge</h4></div><p>Platz für die Werkzeuge, die Anna mitbringen möchte und mit denen sie im Vertrieb arbeitet. Wir tragen sie hier ein, sobald wir sie gemeinsam festgelegt haben.</p><button type="button" class="sc-offen__kn" data-werkzeug-vorschlag>Werkzeug vorschlagen${WO.ic('rechts')}</button></article>` : ''}</div></div>`).join('')}</div>
      <h3 class="sc-offen__t" data-r>Monat für Monat</h3>
      <div class="sc-kosten__wahl" data-r><span class="wo-mk">Womit rechnen wir?</span><div class="sc-rechner__knoepfe">
        <button type="button" class="sc-rechner__k an fest" aria-pressed="true" disabled><b>Websites und Werkzeuge</b><small>Damit starten wir</small></button>
        <button type="button" class="sc-rechner__k" aria-pressed="false" data-teil="bo"><b>Mit Backoffice</b><small>ab Mitte Dezember, plus ${eur(62.80)} im Monat</small></button>
        <button type="button" class="sc-rechner__k" aria-pressed="false" data-teil="mc"><b>Mit Masterclass</b><small>ab Januar, plus ${eur(14.23)} im Monat</small></button></div></div>
      <div class="sc-kosten__monate" data-r>${kostenListe({ web: 1 })}</div>
      <h3 class="sc-offen__t" data-r>Ich möchte hier nicht sparen, weil unser ganzes Business auf diesen Werkzeugen läuft</h3>
      <div class="sc-offen sc-offen--eins" data-r data-start-sicht><div class="sc-offen__k sc-offen__k--fest sc-offen__k--brief"><b>Viel Geld für KI, und trotzdem richtig</b><p class="sc-offen__auftakt">Ich weiß, das klingt erst einmal nach viel: ${eur(KI_MONAT())} im Monat allein für KI, also Claude und Higgsfield. Mit Google Workspace, Datensicherung und Telefon sind es ${eur(KOSTEN_BANNER.web[5])} im Monat zum Start, für jeden von uns ${eur(halb(KOSTEN_BANNER.web[5]))}. Wer das nicht kennt, erschrickt bei dieser Zahl, und das verstehe ich gut.</p><div class="sc-offen__absaetze"><div><span class="wo-mk">Was wir dafür bekommen</span><p>Alles, was du in den Werkbänken, Websites und Werkzeugen siehst, ist mit diesen Werkzeugen entstanden. Wir steuern darüber das ganze Business, vom ersten Entwurf bis zur Kundenliste. Ein einziger Auftrag über CHF 10’000 deckt alle Kosten von Dezember bis März, auch mit Backoffice und Masterclass.</p></div><div><span class="wo-mk">Warum ohne Grenze</span><p>Dieses Niveau erreicht man nicht, wenn man sich selbst begrenzt. Stoßen wir mitten in einem Auftrag an eine Wochengrenze, steht die Arbeit still, und das kostet uns mehr als ein weiteres Konto. Deshalb planen wir mit genug Spielraum.</p></div></div></div></div>
      <div class="sc-fragen sc-kosten__alles sc-kosten__einordnung" data-r><details class="sc-frage"><summary><b>Zur Einordnung: meine KI-Kosten bisher</b><span class="sc-kosten__anzahl">${eur(KOSTEN_BISHER.reduce((a, k) => a + (k[2] || 0), 0))} seit August</span><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a">
      <div class="sc-kosten sc-kosten--bisher"><p class="sc-kosten__ein">Das habe ich seit August für KI bezahlt. Ab August, weil ich da angefangen habe, die Werkzeuge, Websites und Werkbänke zu entwickeln. Ein Teil davon war durch Einnahmen gedeckt, notwendig war alles.</p><div class="sc-kosten__marken">${KOSTEN_BISHER_LOGOS.map(l => `<span>${kostenLogo(l[0], 'sc-kosten__logo--klein')}${esc(l[1])}</span>`).join('')}</div><p class="sc-kosten__ein">Neben Claude habe ich jeden Monat mit ChatGPT und Gemini gearbeitet: für Bilder, für die Prüfung von Code und als Vergleich. Das war wichtig, um die Grundlage zu bauen, auf der wir heute stehen. Künftig planen wir beide nicht ein, wir kommen erst einmal ohne sie aus.</p><ul class="sc-kosten__l">${KOSTEN_BISHER.map(k => `<li${k[2] == null ? ' class="sc-kosten__optional"' : ''}><span><b>${esc(k[0])}</b><small>${esc(k[1])}</small></span><b>${k[2] == null ? 'folgt' : eur(k[2])}</b></li>`).join('')}</ul><p class="sc-kosten__z"><span>August bis November zusammen</span><b>${eur(KOSTEN_BISHER.reduce((a, k) => a + (k[2] || 0), 0))}</b></p>
        <p class="sc-kosten__ein"><b>Warum wir mit mehreren Konten planen.</b> Über Claude bauen wir nicht nur Websites, wir steuern damit das ganze Business. Jedes Konto hat eine Grenze pro Woche. Ist sie erreicht, steht die Arbeit bis zur nächsten Woche still. Für die Vorbereitung im Oktober liefen deshalb vier Konten gleichzeitig. Gerechnet sind zwei Max-Konten und Annas eigenes Konto Pro. Ein drittes Max-Konto ist optional und nicht eingerechnet, gebucht wird es erst, wenn es nötig ist.</p>
        <p class="sc-kosten__ein">Dazu gehören auch die Wartung der Websites, die Prüfungen vor jeder Übergabe und alle Werkzeuge und Verbindungen, ohne die nichts so läuft, wie es soll.</p>
        <div class="sc-fragen sc-kosten__alles"><details class="sc-frage"><summary><b>Was wir alles mit Claude machen</b><span class="sc-kosten__anzahl">${KOSTEN_CLAUDE.length} Bereiche</span><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a"><button type="button" class="sc-offen__kn sc-kosten__alle" data-alle-claude>Alle aufklappen${WO.ic('rechts')}</button>
        <div class="sc-fragen sc-kosten__claude">${KOSTEN_CLAUDE.map(k => `<details class="sc-frage"><summary><b>${esc(k[0])}</b><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a"><p>${esc(k[1])}</p></div></details>`).join('')}</div></div></details></div>
        <p class="sc-kosten__ein">Deshalb planen wir lieber mit mehr Spielraum als mit zu wenig.</p></div></div></details></div>
      <div class="sc-pruefen sc-pruefen--breit" data-r><div><span class="wo-mk">Dazu kommt, was sich nicht planen lässt</span><ul><li>${WO.ic('haken')}<span>Higgsfield-Extras, wenn Bilder für Kunden oder für die Masterclass bearbeitet oder neu erzeugt werden.</span></li><li>${WO.ic('haken')}<span>Ein weiteres Claude-Konto nur, wenn es wirklich nötig ist.</span></li><li>${WO.ic('haken')}<span>Mehr Claude für Anna, wenn sie intensiver damit arbeitet: statt Pro (21,42 €) Max 5x für 107,10 € oder Max 20x für 214,20 € im Monat. Das legen wir gemeinsam fest.</span></li><li>${WO.ic('haken')}<span>Je tiefer wir in die Systeme gehen und je mehr Kunden, Produkte und Ebenen dazukommen, desto höher werden die KI-Kosten.</span></li></ul></div></div>
      <p class="sc-fein" data-r>Dollarbeträge umgerechnet mit dem Kurs vom 01.10.2026 (0,8894). Notion: Business-Plan 48 USD im Monat für zwei Plätze, mit Steuer 50,80 €. Google Workspace ohne Steuer. Der Telefonpreis ist ein Beispiel. Anteile je Person auf den Cent gerundet.</p>
    </section>`;
const START_PRUEFEN = [['Rechtsberatung', ['Gilt für uns das Handelsvertreterrecht, und welche Kündigungsfristen gelten damit?', 'Welches Recht gilt bei Wohnsitz in Spanien?', 'Wirkt die Anrechnung auf einen gesetzlichen Ausgleich (§ 13)?', 'Ist eine GbR sicher ausgeschlossen (§ 3, § 4)?', 'Ist der Ausstieg im März mit der kürzeren Beteiligung wirksam, auch wenn das Handelsvertreterrecht gilt (§ 3, § 13)?']],
  ['Steuerberatung', ['Umsatzsteuer auf Rechnungen in die Schweiz', 'Umsatzsteuer auf Annas Rechnungen von den Kanaren', 'Annas Anmeldung als autónoma', 'Ab wann sich eine UG steuerlich lohnt (§ 11)', 'Entsteht durch Annas Arbeit in Spanien eine Niederlassung?']]];
const START_BERATUNG = [
  'Rechtsberatung: ob für die Zusammenarbeit das Handelsvertreterrecht gilt und was das bei Vertragsende bedeutet.',
  'Rechtsberatung: welches Recht gilt, wenn Anna ihren Wohnsitz in Spanien hat.',
  'Steuerberatung: Rechnungen an Schweizer Betriebe, Annas Rechnung von den Kanaren und ihre Anmeldung als Selbstständige.',
  'Steuerberatung: die jährlichen Kosten einer UG als Grundlage für die Summe in § 11.'
];
function notizKarte(n) {
  const kopfZeile = [n.thema, n.stelle, n.wer, datum(n.wann)].filter(Boolean).join(' · ');
  return `<li class="sc-notiz${n.antwort ? ' sc-notiz--beantwortet' : ''}">
      <div class="sc-notiz__kopf"><span class="wo-mk">${esc(kopfZeile)}</span><span class="sc-notiz__stand">${n.antwort ? 'Beantwortet' : 'Offen'}</span></div>
      <p class="sc-notiz__text">${esc(n.text)}</p>
      ${n.antwort ? `<div class="sc-notiz__antwort"><span class="wo-mk">Antwort · ${esc(n.antwort_wer)} · ${esc(datum(n.antwort_wann))}</span><p>${esc(n.antwort)}</p></div>`
        : `<form class="sc-notiz__form" data-antwort="${esc(n.id)}"><label class="sc-feld sc-feld--breit"><span>Antwort</span><textarea name="antwort" rows="2" placeholder="Antwort oder Rückfrage"></textarea></label>${WO.knopf('Antwort speichern', 'haken', 'glas', { klein: true, attr: 'data-senden' })}</form>`}
    </li>`;
}
const UNTERLAGEN = [
  ['start/vertrag.html', 'start/Vertrag-Anna-Llorens-Entwurf.pdf', 'Zum Unterschreiben', 'Partnerschafts- und Provisionsvertrag', 'Gleiche Teile von Anfang an, frei in der Arbeit, mit dem Weg in eine gemeinsame Firma.'],
  ['start/auftragsverarbeitung.html', 'start/Auftragsverarbeitung-Anna-Llorens-Entwurf.pdf', 'Zum Unterschreiben', 'Vereinbarung zur Auftragsverarbeitung', 'Wie wir beide sorgsam mit den Kontaktdaten der Häuser umgehen.'],
  ['start/freigabe-name-bild.html', 'start/Freigabe-Name-Bild-Anna-Llorens-Entwurf.pdf', 'Zum Unterschreiben', 'Freigabe für Name und Bild', 'Wo Annas Name und Bild erscheinen dürfen, jederzeit änderbar.']
];
/* Wie Korrekturen für ein Haus aussehen (Robert 14.11.2026: «dieses Kulinarium bisher und neu … für sie zum Verständnis … wenn wir dann in Korrekturen gehen …
   mit so einem geteilten oder sogar Dreifachbildschirm»). Quelle: Culinarium _online/ONLINE.md (05.11.2026, Vergleichsseite), Bildschirme aufgenommen 14.11.2026. */
const VERGLEICH = 'https://tastyrob123.github.io/culinarium-entwurf/vergleich/';
const korrekturBlock = () => `<section class="sc-block" id="korrekturen">${kopfBlock(['Wenn es um', 'Korrekturen geht.'], 'So sieht es für ein Haus aus, wenn wir in die Korrekturen gehen, am Beispiel Culinarium. Am Rechner öffnen, dann stehen die Fassungen nebeneinander.')}
      <div class="sc-arb">${[
        ['Zwei Fenster', 'Bisher und neu', 'Links die Seite, wie sie war, rechts die neue. Jede Korrektur hat eine Nummer an ihrer Stelle, beide Fenster laufen beim Scrollen gemeinsam.', 'kunde-culinarium-vergleich'],
        ['Drei Fenster', 'Mit den Anmerkungen des Hauses', 'Ein Klick auf «Eure Anmerkungen» holt ein drittes Fenster dazu: die alte Seite mit den Anmerkungen des Hauses als Kacheln an ihren Stellen. Alle drei laufen gemeinsam.', 'kunde-culinarium-vergleich-drei']
      ].map((a, i) => `<article class="sc-arb__k" style="--i:${i}">
        <div class="sc-arb__buehne" data-r style="--i:${i}">${geraet('schirme/' + a[3] + '.webp', a[1], 'sc-arb__geraet', VERGLEICH, FEIN ? VERGLEICH : '')}</div>
        <div class="sc-arb__text" data-r style="--i:${i}"><span class="wo-mk">${esc(a[0])}</span><h3>${esc(a[1])}</h3><p>${esc(a[2])}</p>
          <a class="sc-arb__auf" href="${VERGLEICH}" target="_blank" rel="noopener"><span>Öffnen</span><i>${WO.ic('pfeil')}</i></a></div></article>`).join('')}</div>
    </section>`;
/* Nach dem Gespräch: Korrekturen, Betreuung im Monat, was Wartung für uns heisst, Prüfungen und ihr Takt (Robert 14.11.2026: «auf die monatliche Betreuung eingehen,
   was inklusive ist. Die Betreuung der Tools, was es für uns bedeutet, die Website zu warten, welche Prüfprotokolle wir haben, in welchen Zyklen»).
   Quellen: wissen.js (Pakete, ohneBetreuung, laeuftAuchOhne, aus Angebot.md 09./11.11.2026) · Angebot.md «Designstudien Schweiz» (CHF 350 und CHF 500, 11.11.2026)
   · Website-Bau Master 9c Punkt 6 (Google in der Betreuung) · Master 14.2, 14.3 und 14.8 (Cockpit, Fühler, Takte, Rückhol-Probe, Monatsbericht) · Versand-Schutz (wache.py alle 5 Minuten). */
/* Preise je Segment, nur aus Angebot.md: Designstudien Schweiz (08./11.11.2026), Nur Werkzeuge (11.11.2026), Netzwerkpreis Hannover (03.11.2026) */
const SEGMENTE = [
  { t: 'Hotels', wo: 'Schweiz', sp: 'hotel', z: [['Website einmalig', 'CHF 10’000'], ['Betreuung der Website', 'CHF 350 im Monat'], ['Werkzeuge im Abo', 'CHF 500 im Monat']] },
  { t: 'Restaurants', wo: 'Schweiz', sp: 'gastro', z: [['Website einmalig', 'CHF 5’000'], ['Betreuung der Website', 'CHF 350 im Monat'], ['Werkzeuge im Abo', 'CHF 500 im Monat']] },
  { t: 'Nur Werkzeuge', wo: 'Website bleibt beim Haus', z: [['Einmalig', 'nichts'], ['Werkzeuge im Abo', 'CHF 350 im Monat']] },
  { t: 'Gastronomie Hannover', wo: 'Kleiner Mittelstand, über Netzwerke', z: [['Website einmalig', '1’900 €'], ['Basis, monatlich kündbar', '59 € im Monat'], ['Plus, zwei Werkzeuge, 12 Monate', '129 € im Monat'], ['Komplett, alle Werkzeuge, 12 Monate', '199 € im Monat']] }
];
/* Hotels und Restaurants ziehen ihre Zahlen aus «Kunden» (Robert 14.11.2026: «der Auftrag war doch, dass das überall angepasst wird»).
   Korridor (Robert 14.11.2026: «da ist ein Eintrag … für 400, einer für 500. Dann steht da 4 bis 500»): je Sparte kleinster bis grösster Preis
   aller Schweizer Häuser mit Website; tragen alle denselben, steht eine Zahl. Die Werte in SEGMENTE oben sind nur der Rückfall ohne Daten. */
const spanneVon = l => l.length ? [Math.min(...l), Math.max(...l)] : null;
function segmentPreise(sp) {
  const chf = t => /CHF/.test(t || ''), l = kunden().filter(h => sparte(h) === sp && !h.pitch && h.preis && waehrung(h) === 'CHF' && h.preis.betrag);
  if (!l.length) return null;
  return { e: spanneVon(l.map(h => h.preis.betrag)), b: spanneVon(l.filter(h => chf(h.preis.betreuung_website)).map(h => betrag(h.preis.betreuung_website))),
    w: spanneVon(l.filter(h => chf(h.preis.abo_werkzeuge)).map(h => betrag(h.preis.abo_werkzeuge))) };
}
const zahlCh = n => Number(n).toLocaleString('de-CH').replace(/'/g, '’');
const spanneText = s => s[0] === s[1] ? 'CHF ' + zahlCh(s[0]) : `CHF ${zahlCh(s[0])} bis ${zahlCh(s[1])}`;
function segmentZeilen(g) {
  const v = g.sp && segmentPreise(g.sp); if (!v) return g.z;
  return [['Website einmalig', v.e ? spanneText(v.e) : g.z[0][1]], ['Betreuung der Website', v.b ? spanneText(v.b) + ' im Monat' : g.z[1][1]], ['Werkzeuge im Abo', v.w ? spanneText(v.w) + ' im Monat' : g.z[2][1]]];
}
const BETREUUNG_DAZU = [['Google gehört dazu', 'Der Eintrag bei Google Maps, gleiche Angaben zu Name, Adresse und Telefon auf Booking, Tripadvisor und Co., dazu ein Bericht aus der Google Search Console jeden Monat.'],
  ['Kein Versprechen auf Platz eins', 'Wir versprechen keine Platzierung bei Google, sondern eine saubere Seite, einen Umzug ohne Verlust und einen gepflegten Eintrag.']];
const WARTEN = [
  ['auge', 'Wir sehen es zuerst', 'Jede Adresse des Hauses wird laufend abgerufen: Website, jedes Werkzeug, jede verschickte Seite. Geht etwas nicht, wissen wir es, bevor das Haus anruft.'],
  ['schild', 'Für jedes Risiko liegt die Lösung bereit', 'Speicher, Zugänge, KI-Guthaben, Buchungssystem, Domain, Browser-Updates: Für jedes Thema gibt es einen Grenzwert und eine fertige Lösung. Gelb warnt, bevor etwas kaputtgeht.'],
  ['zurueck', 'Sicherungen, die wirklich zurückkommen', 'Jeder frühere Stand lässt sich zurückholen. Alle drei Monate proben wir das Zurückholen an einer Kopie, denn eine Sicherung, die nie zurückgeholt wurde, zählt nicht.'],
  ['blatt', 'Ein Bericht jeden Monat', 'Eine Seite im Stil des Hauses: wie oft die Seite erreichbar war, welche Prüfungen bestanden sind, Besuche und Herkunft, was wir gemacht haben und was ansteht.']
];
const TAKT = [
  ['Alle 5 Minuten', 'Erreichbar?', ['Ein kleines Programm ruft die Website, jedes Werkzeug und jede verschickte Seite ab, wie ein Besucher.', 'Ist etwas weg, kommt sofort eine Meldung.']],
  ['Täglich', 'Lebenszeichen', ['Server, Speicher, Buchungssystem, KI, Domain und Sicherung melden sich von selbst.', 'Bleibt eines stumm, kommt eine Meldung.']],
  ['Wöchentlich', 'Jeder Knopf gedrückt', ['Ein Programm bedient jedes Werkzeug und drückt jeden Knopf, wie ein Gast.', 'Dazu Technik, Pflicht-Liste, Google und Sicherheit der Website, in drei Browsern.']],
  ['Monatlich', 'Geld und Antworten', ['Kosten, Speicher und letzte Sicherung werden von selbst zusammengetragen.', 'Der Chat bekommt dieselben zehn Gästefragen, die Antworten werden mit dem Original verglichen.', 'Daraus entsteht der Monatsbericht für das Haus.']],
  ['Alle drei Monate', 'Zurückholen geprobt', ['Ein früherer Stand wird an einer Kopie zurückgeholt.', 'Die Sicherungen liegen zusätzlich ausserhalb des Servers, nicht nur beim Anbieter der Seite.']],
  ['Bei jedem Hochladen', 'Vorher und nachher', ['Jede Änderung wird vor dem Hochladen geprüft und danach live nachgesehen.', 'Was in einer verschickten Mail steckt, bleibt immer online.']]
];
function wieWeiter() {
  const pk = W.pakete || [];
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO('tafel'), h1: 'Wie es <em>weitergeht</em>', zier: esc('Nach dem Gespräch'),
      satz: 'Was nach einem guten Gespräch mit einem Haus kommt: die Korrekturen, die Betreuung im Monat, was Wartung für uns heisst und in welchem Takt wir prüfen.',
      knoepfe: WO.knopf('Korrekturen', 'rechts', 'gold', { attr: 'data-sprung="korrekturen"' }) + WO.knopf('Betreuung', 'rechts', 'glas', { attr: 'data-sprung="betreuung"' }) + WO.knopf('Prüfungen', 'rechts', 'glas', { attr: 'data-sprung="takt"' }) })}
    ${korrekturBlock()}
    <section class="sc-block" id="betreuung">${kopfBlock(['Die Betreuung', 'im Monat.'], 'Zwei Teile: die Betreuung der Website und die Werkzeuge im Abo. Die Seite läuft auch ohne Betreuung, die Werkzeuge gibt es nur im Abo.')}
      <div class="sc-karten2" data-r>${pk.map((k, i) => karteListe(k.name, k.punkte, i ? 'blatt' : 'welt').replace('<ul>', `<p class="sc-karte2__satz">${esc(k.satz)}</p><ul>`)).join('')}</div>
      <div class="sc-weiter2" data-r>${BETREUUNG_DAZU.map(x => `<div><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div>`).join('')}</div>
      <p class="sc-fein" data-r>${esc(W.paketeFuss || '')} Die Werkzeuge gibt es nie einmalig, nur im Abo.</p>
    </section>
    <section class="sc-block" id="warten">${kopfBlock(['Was Wartung', 'für uns heisst.'], 'Wartung ist mehr als ein Ansprechpartner. Wir sehen jeden Tag, ob beim Haus alles läuft, und haben die Antwort schon bereit, wenn etwas kommt.')}
      <div class="sc-warten">${WARTEN.map((w, i) => `<div class="sc-warten__k" data-r style="--i:${i % 2}"><i>${WO.ic(w[0])}</i><b>${esc(w[1])}</b><p>${esc(w[2])}</p></div>`).join('')}</div>
    </section>
    <section class="sc-block" id="takt">${kopfBlock(['Die Prüfungen', 'und ihr Takt.'], 'Das läuft alles von selbst, niemand klickt sich durch die Seiten. Gemeldet wird nur, wenn etwas gelb oder rot wird.')}
      <ol class="sc-takt">${TAKT.map((t, i) => `<li class="sc-takt__k" data-r style="--i:${i % 3}"><span class="wo-mk">${esc(t[0])}</span><b>${esc(t[1])}</b><ul>${t[2].map(x => `<li>${WO.ic('haken')}<span>${esc(x)}</span></li>`).join('')}</ul></li>`).join('')}</ol>
    </section>
    <section class="sc-block sc-block--eng" id="ohne">${kopfBlock(['Und', 'ohne Betreuung?'], W.laeuftAuchOhne || '')}
      <div class="sc-pruefen" data-r><div><span class="wo-mk">Das gilt immer</span><ul>${(W.gehoert || []).slice(0, 4).map(x => `<li>${WO.ic('haken')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
        <div><span class="wo-mk">Ohne Betreuung</span><ul>${(W.ohneBetreuung || []).map(x => `<li>${WO.ic('haken')}<span>${esc(x)}</span></li>`).join('')}</ul></div></div>
    </section>
    <p class="sc-quelle">Stand 16.11.2026 · Betreuung und Eigentum: Angebot.md (09.11.2026) · Wartung, Prüfungen und Takt: Website-Bau Master, Abschnitte 9c und 14 · Beispiel Korrekturen: Culinarium Hannover</p>`;
}
const unterlagenBlock = () => `<section class="sc-block sc-block--eng" id="unterlagen">${kopfBlock(['Die', 'Unterlagen.'], 'Die drei Dokumente zum Unterschreiben, jeweils als Entwurf zur gemeinsamen Besprechung. Ein Klick öffnet die DIN-A4-Seiten.')}
      <div class="sc-unterlagen" data-r>${UNTERLAGEN.map(u => `<article class="sc-unterlage">
        <a class="sc-unterlage__blatt" href="${u[1] || u[0]}" target="_blank" rel="noopener" aria-label="${esc(u[3])} öffnen"><iframe src="${u[0]}" title="${esc(u[3])}" tabindex="-1" loading="lazy" scrolling="no"></iframe></a>
        <div class="sc-unterlage__text"><span class="wo-mk">${esc(u[2])}</span><h3>${esc(u[3])}</h3><p>${esc(u[4])}</p>
          <div class="sc-unterlage__kn">${WO.knopf('Öffnen', 'pfeil', 'gold', { klein: true, href: u[1] || u[0], neu: true })}${u[1] ? WO.knopf('Herunterladen', 'pdf', 'dunkel', { klein: true, href: u[1], attr: 'download' }) : ''}</div></div>
      </article>`).join('')}</div>
    </section>`;
function unserStart() {
  const notizListe = startNotizen().slice().reverse();
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO('anleger'), h1: 'Unser <em>Start</em>', zier: esc('Erste Ideen, noch nichts entschieden'),
      satz: 'Wie wir die vorgebauten Häuser zu Kunden machen könnten, wie sich das Geld in den ersten Monaten aufteilen liesse und der Entwurf unseres Vertrags. Fragen und Ergänzungen tragen wir ganz unten ein.',
      knoepfe: WO.knopf('Alle Unterlagen', 'blatt', 'gold', { attr: 'data-sprung="unterlagen"' }) + WO.knopf('Vertrag ansehen', 'auge', 'glas', { attr: 'data-sprung="vertrag"' }) + WO.knopf('Frage eintragen', 'stift', 'glas', { attr: 'data-sprung="fragen"' }) })}
    ${mitbringenBlock()}
    ${startWochen()}
    ${startWeg()}
    ${startUhr()}
    ${zusammenarbeitBlock()}
    ${startGeld()}
    ${kostenBlock()}
    ${azavBlock()}
    ${firmaBlock()}
    ${einschaetzungBlock()}
    ${offenBlock()}
    ${unterlagenBlock()}
    <section class="sc-block sc-block--eng" id="fragen">${kopfBlock(['Fragen und', 'Ergänzungen.'], 'Alles, was beim Durchgehen auffällt: Fragen zum Vertrag, Ergänzungen zum Ablauf, eigene Ideen. Robert antwortet direkt am Eintrag.')}
      <form class="sc-form" id="sc-start-form" data-r autocomplete="off">
        <div class="sc-form__felder">
          <label class="sc-feld"><span>Thema</span><select name="thema">${START_THEMEN.map(t => `<option>${esc(t)}</option>`).join('')}</select></label>
          <label class="sc-feld"><span>Stelle, falls es eine gibt</span><input name="stelle" placeholder="Etwa § 4 oder Tag 7"></label>
          <label class="sc-feld"><span>Von</span><select name="wer"><option${WER() === 'Anna' ? ' selected' : ''}>Anna</option><option${WER() === 'Robert' ? ' selected' : ''}>Robert</option></select></label>
        </div>
        <label class="sc-feld sc-feld--breit"><span>Frage oder Ergänzung</span><textarea name="text" rows="4" placeholder="Was dir auffällt, was fehlt, was du anders sehen würdest"></textarea></label>
        <div class="sc-form__fuss"><p>${S.server ? 'Gespeichert wird mit «Eintragen», jeder Eintrag lässt sich rückgängig machen.' : 'Online lässt sich nichts speichern.'}</p>${WO.knopf('Eintragen', 'haken', 'gold', { attr: 'data-senden', disabled: !S.server })}</div>
      </form>
      ${notizListe.length ? `<ol class="sc-notizen" data-r>${notizListe.map(notizKarte).join('')}</ol>` : `<div class="sc-notizen__leer2" data-r><span aria-hidden="true">${WO.ic('chat')}</span><p><b>Noch keine Fragen eingetragen.</b>Der erste Eintrag erscheint hier, mit Platz für die Antwort darunter.</p></div>`}
    </section>
    <p class="sc-quelle">Stand 19.11.2026 · Vertrag: Entwurf auf Grundlage des Partnerschafts- und Provisionsvertrags von Tasty Studios · Zahlen zur Rechtsform aus Ratgebern, nicht geprüft</p>`;
}
function startQuittung(titel, vorher) {
  const m = $('#meldung'); while (m.children.length >= 3) m.firstChild.remove();
  const q = document.createElement('div'); q.className = 'quit sc-quit';
  q.innerHTML = `<div><b>${esc(titel)}</b></div><div class="sc-quit__kn">${WO.knopf('Rückgängig', 'zurueck', 'hell', { klein: true, attr: 'data-zurueck' })}<button type="button" class="sc-quit__zu" aria-label="Schliessen">${WO.ic('x')}</button></div>`;
  q.querySelector('.sc-quit__zu').onclick = () => q.remove();
  q.querySelector('[data-zurueck]').onclick = async () => {
    try { const j = await api('POST', 'start/zurueck', { vorher }); S.d.start = { notizen: j.nachher }; q.remove(); neuZeichnen(); meldung('Rückgängig gemacht: der Stand davor gilt wieder.'); }
    catch (e) { meldung('Rückgängig ging nicht: ' + e.message, true); }
  };
  m.appendChild(q); setTimeout(() => q.remove(), 14000);
}
function bindeStart() {
  startBewegung();
  $$('#ansicht [data-vorlage]').forEach(b => b.onclick = () => {
    const o = START_OFFEN[+b.dataset.vorlage], f = $('#sc-start-form'); if (!o || !f) return;
    f.querySelector('[name=thema]').value = 'Vertrag'; f.querySelector('[name=stelle]').value = o[0] + ' · ' + o[1];
    springe('fragen'); const t = f.querySelector('[name=text]'); t.placeholder = o[2]; setTimeout(() => t.focus({ preventScroll: true }), 500);
  });
  $$('#ansicht [data-alle-claude]').forEach(b => b.onclick = () => {
    const d = [...b.parentElement.querySelectorAll('.sc-kosten__claude details')], auf = d.some(x => !x.open);
    d.forEach(x => { x.open = auf; });
    b.firstChild.textContent = auf ? 'Alle zuklappen' : 'Alle aufklappen';
  });
  $$('#ansicht [data-werkzeug-vorschlag]').forEach(b => b.onclick = () => {
    const f = $('#sc-start-form'); if (!f) return;
    f.querySelector('[name=thema]').value = 'Geld'; f.querySelector('[name=stelle]').value = 'Laufende Kosten · Annas Werkzeuge';
    springe('fragen'); const t = f.querySelector('[name=text]'); t.placeholder = 'Welches Werkzeug, wofür, und was kostet es im Monat?'; setTimeout(() => t.focus({ preventScroll: true }), 500);
  });
  $$('#ansicht [data-senden]').forEach(b => b.onclick = () => { const f = b.closest('form'); if (f) f.requestSubmit(); });
  const f = $('#sc-start-form');
  if (f) f.onsubmit = async e => {
    e.preventDefault();
    const d = new FormData(f), text = String(d.get('text') || '').trim();
    if (!text) { meldung('Bitte eine Frage oder Ergänzung eintragen.', true); return; }
    try {
      const j = await api('POST', 'start/notiz', { thema: d.get('thema'), stelle: d.get('stelle'), text, wer: d.get('wer') });
      S.d.start = { notizen: j.nachher }; neuZeichnen(); springe('fragen'); startQuittung('Eingetragen: ' + kurz(text, 60), j.vorher);
    } catch (err) { meldung('Nicht gespeichert: ' + err.message, true); }
  };
  $$('#ansicht [data-antwort]').forEach(af => af.onsubmit = async e => {
    e.preventDefault();
    const antwort = String(new FormData(af).get('antwort') || '').trim();
    if (!antwort) { meldung('Bitte eine Antwort eintragen.', true); return; }
    try {
      const j = await api('PUT', 'start/notiz/' + af.dataset.antwort, { antwort, wer: WER() });
      S.d.start = { notizen: j.nachher }; neuZeichnen(); startQuittung('Antwort gespeichert', j.vorher);
    } catch (err) { meldung('Nicht gespeichert: ' + err.message, true); }
  });
}

/* Unser Start, sichtbar statt Textkacheln (Robert 11.11.2026: «super unübersichtlich mit diesen ganzen Textfeldern … nicht geil animiert, nicht edel»):
   Weg zum Kunden als Zeitleiste mit einer grossen Tafel, drei Uhren mit Zeitfenster, grosse Zahlen, Rechner für die Hälfte, Rechtsform als Weg in zwei Stufen. */
const WEG = [
  ['Tag 0', 'tel', 'Ein Anruf, der die Präsentation ankündigt', 'Herausfinden, wer im Haus entscheidet, und ankündigen, dass etwas kommt.'],
  ['Tag 1', 'mail', 'Die Präsentation per Mail', 'Das PDF geht an die Person aus dem Anruf. Der Code darin führt direkt auf die fertige Website des Hauses.'],
  ['Geöffnet', 'glocke', 'Ein zweiter Anruf', 'Öffnet jemand die Seite, wäre das der Moment, 30 Minuten per Video vorzuschlagen.'],
  ['Gespräch', 'chat', 'Das Videogespräch', 'Wir zeigen die Werkzeuge und beantworten die Fragen des Hauses. Ob Anna das Gespräch allein führt oder Robert dabei ist, entscheidet sie selbst.'],
  ['Tag 7 · 14', 'uhr', 'Nachfassen', 'Hat niemand geöffnet, ein Anruf nach einer und nach zwei Wochen, gern mit dem KI-Check als Anlass.'],
  ['Tag 30', 'blatt', 'Designstudie', 'Kommt nichts zustande, könnten wir den Entwurf als Designstudie auf unserer Website zeigen.']
];
const UHREN = [['Schweiz', 'das Haus', 10, 9], ['Kanaren', 'Anna', 9, 8], ['Philippinen', 'Robert', 17, 16]];
/* Die ersten Wochen als Fahrplan (Robert 16.11.2026: «so schnell es geht die bestehenden Häuser auf die Strasse bringen», Anna arbeitet sich parallel ein):
   je Woche, was Anna lernt, wer das Gespräch führt und welche Häuser rausgehen. Familien zählen als ein Gespräch. Häuser aus «Kunden»;
   abgeschlossene fallen raus, neue ohne Woche kommen in die letzte. */
const AGENDA_FOLGE = ['beau-rivage', 'seiler', 'saltandsilver', 'uncle-hung', 'angelina', 'carlton', 'doldenhorn', 'ruedihus', 'gasterntal', 'monte-moro', 'zermatt', 'wellness', 'rustica', 'gilles-varone', 'schaefli', 'schloessli', 'roots', 'bareiss', 'europaeischer-hof'];
const AGENDA_SCHRITTE = ['Den Häusern zeigen', 'Referenzen sammeln', 'Rückmeldungen holen', 'Darauf aufbauen'];
const AGENDA_ANNA = [
  ['Vertrieb', 'person', 'Wie wir über die fertigen Häuser hinaus neue Betriebe finden, ansprechen und gewinnen.'],
  ['Social Media', 'foto', 'Welche Kanäle wir bespielen und was wir dort von unserer Arbeit zeigen.'],
  ['Logo und Marke', 'siegel', 'Ein neues Logo und ein klares Bild davon, wer wir sind und wie wir nach aussen auftreten.']
];
const AGENDA_ROBERT = [
  ['Auswerten', 'balken', 'Die Referenzen und Erfahrungswerte aus den ersten Häusern auswerten.'],
  ['Werkzeuge und neue Häuser', 'haus', 'Die Werkzeuge weiterentwickeln und neue Häuser bauen.'],
  ['Backoffice und Infrastruktur', 'buch', 'Das Backoffice verkaufsbereit machen und die digitale Infrastruktur herstellen, mit der wir langfristig arbeiten wollen.']
];
const PLAN_BILD = '/zentrale/werkzeuge/13-sales-cockpit/bilder/plan/';
function agendaHaeuser() {
  const fam = window.TASTY_FAMILIEN || [], rang = id => { const i = AGENDA_FOLGE.indexOf(id); return i < 0 ? 999 : i; };
  const ids = offene().map(h => h.id).sort((x, y) => rang(x) - rang(y));
  const stuecke = [], fertig = new Set();
  ids.forEach(id => {
    if (fertig.has(id)) return;
    const f = fam.find(x => x.ids.includes(id)), l = f ? f.ids.filter(x => ids.includes(x)) : [id];
    l.forEach(x => fertig.add(x)); stuecke.push({ f: f && l.length > 1 ? f : null, haeuser: l.map(haus) });
  });
  return { stuecke, haeuser: ids.length };
}
/* Je Haus der Hero seiner Website (Robert 17.11.2026: «die Heros der Landingpages anzeigen … übersichtlicher, nicht so riesig»): alle Karten gleich gross */
const planBild = h => geraet(h.schirm || '', h.name, 'sc-plan__geraet');
const planFamBild = f => geraet('/zentrale/werkzeuge/13-sales-cockpit/familien/schirm-familie-' + f.k + '.webp', 'Gemeinsame Startseite ' + f.t[0].replace(/\.$/, ''), 'sc-plan__geraet');
/* Übersicht wie die Seitenleiste (Robert 17.11.2026: «immer noch super unübersichtlich»): eine Reihe Hotellerie, eine Reihe Gastronomie
   (mit Private Chef), alle Karten gleich klein. Gleich viele Plätze je Reihe: in der kürzeren Reihe werden Familien doppelt breit
   (zuerst die mit zwei Häusern, beide Heros nebeneinander). */
function planReihen(st) {
  const hotel = x => (x.f ? x.f.sparte : sparte(x.haeuser[0])) === 'hotel';
  const R = [{ t: 'Hotellerie', l: st.filter(hotel) }, { t: st.some(x => !hotel(x) && sparte(x.haeuser[0]) === 'weitere') ? 'Gastronomie und Private Chef' : 'Gastronomie', l: st.filter(x => !hotel(x)) }].filter(r => r.l.length);
  const C = Math.max(...R.map(r => r.l.length));
  R.forEach(r => {
    let fehlt = C - r.l.length;
    r.l.filter(x => x.f).sort((a, b) => (a.haeuser.length === 2 ? 0 : 1) - (b.haeuser.length === 2 ? 0 : 1)).forEach(x => { if (fehlt > 0) { x.breit = true; fehlt--; } });
    r.n = r.l.reduce((n, x) => n + x.haeuser.length, 0);
  });
  return { R, C: Math.min(C, 6) };
}
function planStueck(s, i) {
  if (s.f) return `<li class="sc-plan__haus sc-plan__haus--fam${s.breit ? ' sc-plan__haus--breit' : ''}" style="--i:${i}" data-gehe="familie:${esc(s.f.k)}" role="button" tabindex="0"><span class="sc-plan__bilder">${s.breit ? s.haeuser.slice(0, 2).map(planBild).join('') : planFamBild(s.f)}</span><span class="sc-plan__name"><small>${s.haeuser.length} Häuser</small><b>${esc(s.f.t[0].replace(/\.$/, ''))}</b></span></li>`;
  const h = s.haeuser[0];
  return `<li class="sc-plan__haus" style="--i:${i}" data-gehe="haus:${esc(h.id)}" role="button" tabindex="0"><span class="sc-plan__bilder">${planBild(h)}</span><span class="sc-plan__name"><small>${esc((h.ort || '').split(/[·,]/)[0].trim())}</small><b>${esc(h.name)}</b></span></li>`;
}
function planListe(st) {
  const { R, C } = planReihen(st); let i = 0;
  return `<div class="sc-plan__reihen" style="--c0:${C};--c2:${C % 3 === 0 ? 3 : 2}">${R.map(r => `<div class="sc-plan__reihe"><p class="sc-plan__rkopf"><b>${esc(r.t)}</b><span>${r.n === 1 ? '1 Haus' : r.n + ' Häuser'} · ${r.l.length === 1 ? '1 Gespräch' : r.l.length + ' Gespräche'}</span></p><ul class="sc-plan__liste">${r.l.map(x => planStueck(x, i++)).join('')}</ul></div>`).join('')}</div>`;
}
function agendaBlock() {
  const p = agendaHaeuser();
  return `
      <div class="sc-plan" data-r>
        <div class="sc-plan__vorrang" data-start-sicht>
          <div class="sc-plan__kopf">
            <span class="wo-mk">Zuerst, vor allem anderen</span>
            <h3>Die fertigen Websites verkaufen.</h3>
            <p>Für diese Häuser steht die neue Website schon. So schnell es geht zeigen wir sie den Häusern: Mit den ersten Verkäufen verdienen wir das Geld, aus dem heraus wir sicher weiterplanen.</p>
          </div>
          <div class="sc-plan__zahlen">
            <div><b data-zaehl="${p.haeuser}">${p.haeuser}</b><span>Häuser</span></div>
            <div><b data-zaehl="${p.stuecke.length}">${p.stuecke.length}</b><span>Gespräche</span></div>
          </div>
          <ol class="sc-plan__schritte" aria-label="So läuft es">${AGENDA_SCHRITTE.map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join('')}</ol>
          ${planListe(p.stuecke)}
        </div>
        <div class="sc-plan__neben">
          <div class="sc-plan__parallel" data-start-sicht>
            <div class="sc-plan__kopf">
              <span class="wo-mk">Parallel dazu</span>
              <h3>Annas Teil: unser Auftritt.</h3>
              <p>Die Marke einmal sauber nach aussen setzen: das sind wir, das sind unsere Kanäle, so verkaufen wir.</p>
            </div>
            <ul class="sc-plan__teile">${AGENDA_ANNA.map((t, i) => `<li style="--i:${i}"><span class="sc-plan__sym">${WO.ic(t[1])}</span><b>${esc(t[0])}</b><p>${esc(t[2])}</p></li>`).join('')}</ul>
          </div>
          <div class="sc-plan__parallel" data-start-sicht>
            <div class="sc-plan__kopf">
              <span class="wo-mk">Parallel dazu</span>
              <h3>Roberts Teil: unser Fundament.</h3>
              <p>Was die ersten Häuser zeigen, fliesst zurück: in die Werkzeuge, in neue Häuser und in alles, womit wir langfristig arbeiten.</p>
            </div>
            <ul class="sc-plan__teile">${AGENDA_ROBERT.map((t, i) => `<li style="--i:${i}"><span class="sc-plan__sym">${WO.ic(t[1])}</span><b>${esc(t[0])}</b><p>${esc(t[2])}</p></li>`).join('')}</ul>
          </div>
        </div>
      </div>
      <p class="sc-fein" data-r>Werkzeuge, Websites und die Arbeit mit KI lernt Anna dabei am echten Haus, Robert steht für jede Rückfrage bereit.</p>`;
}
/* Preise aus «Kunden», dieselbe Quelle wie die Preiskarten (Robert 14.11.2026: «Wo sind da jetzt die Korridore?»): je Knopf kleinster bis grösster Preis;
   Betreuung und Werkzeuge über Hotels und Restaurants zusammen. Die Zahlen hier sind nur der Rückfall ohne Daten. */
const RECHNER = [['Website Hotel', 10000, 'einmalig', ['hotel'], 'e'], ['Website Restaurant', 5000, 'einmalig', ['gastro'], 'e'], ['Betreuung', 350, 'im Monat', ['hotel', 'gastro'], 'b'], ['Werkzeuge im Abo', 500, 'im Monat', ['hotel', 'gastro'], 'w']];
const rechnerSpanne = r => { const s = r[3].map(sp => (segmentPreise(sp) || {})[r[4]]).filter(Boolean); return s.length ? [Math.min(...s.map(x => x[0])), Math.max(...s.map(x => x[1]))] : [r[1], r[1]]; };
const chfSpanne = (a, b) => a === b ? chf(a) : `${chf(a)} bis ${Math.round(b).toLocaleString('de-CH').replace(/[’']/g, '’')}`;
const FLUSS = [['Rechnung', 'Robert schreibt sie über Tasty Studios'], ['Zahlung', 'kommt auf das Konto nur für Tasty Studios'], ['Annas Rechnung', 'über ihre Hälfte, nach der Abrechnung bis zum 10. des Monats'], ['Auszahlung', 'innerhalb von 14 Tagen nach Annas Rechnung']];
const chf = n => 'CHF ' + Math.round(n).toLocaleString('de-CH').replace(/[’']/g, '’');
function uhrSvg(h, m) {
  const wh = ((h % 12) + m / 60) * 30, wm = m * 6;
  const striche = Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="6" x2="50" y2="${i % 3 ? 10 : 13}" transform="rotate(${i * 30} 50 50)"/>`).join('');
  return `<svg class="sc-uhr2__ziffer" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47"/><g class="sc-uhr2__striche">${striche}</g>
    <line class="sc-uhr2__h" x1="50" y1="50" x2="50" y2="27" style="--w:${wh}deg"/><line class="sc-uhr2__m" x1="50" y1="50" x2="50" y2="15" style="--w:${wm}deg"/><circle class="sc-uhr2__mitte" cx="50" cy="50" r="2.6"/></svg>`;
}
const startWeg = () => `
    <section class="sc-block sc-block--eng" id="ablauf-start">${kopfBlock(['Der Weg', 'zum Kunden.'], 'Eine Idee: Jedes Haus bekommt drei Wochen und einen festen Ablauf. Ein Klick auf einen Schritt zeigt ihn.')}
      <div class="sc-weg2" data-r data-start-weg>
        <ol class="sc-weg2__leiste" role="tablist">
          <i class="sc-weg2__spur" aria-hidden="true"><b></b></i>
          ${WEG.map((w, i) => `<li><button type="button" role="tab" class="sc-weg2__p${i === 0 ? ' an' : ''}" data-i="${i}" aria-selected="${i === 0}"><i>${WO.ic(w[1])}</i><span>${esc(w[0])}</span></button></li>`).join('')}
        </ol>
        <div class="sc-weg2__buehne">
          ${WEG.map((w, i) => `<div class="sc-weg2__tafel${i === 0 ? ' an' : ''}" data-i="${i}" role="tabpanel"><b class="sc-weg2__tag">${esc(w[0])}</b><div><h3>${esc(w[2])}</h3><p>${esc(w[3])}</p></div></div>`).join('')}
          <div class="sc-weg2__kn"><button type="button" class="sc-weg2__pf" data-weg="-1" aria-label="Schritt zurück">${WO.ic('links')}</button><span class="sc-weg2__zahl"><b>1</b> / ${WEG.length}</span><button type="button" class="sc-weg2__pf" data-weg="1" aria-label="Nächster Schritt">${WO.ic('rechts')}</button></div>
        </div>
      </div>
    </section>`;
const startUhr = () => `
    <section class="sc-block sc-block--eng" id="zeiten-start">${kopfBlock(['Die', 'Uhrzeiten.'], 'Für die ersten Gespräche zu zweit würde vormittags in der Schweiz für uns beide passen.')}
      <div class="sc-uhr2" data-r data-start-sicht>
        <div class="sc-uhr2__reihe">${UHREN.map(u => `<div class="sc-uhr2__ort">${uhrSvg(u[2], 0)}<b>${String(u[2]).padStart(2, '0')}:00</b><span>${esc(u[0])} · ${esc(u[1])}</span></div>`).join('')}</div>
        <div class="sc-uhr2__fenster">
          <span class="wo-mk">Das Fenster für Gespräche, 9 bis 12 Uhr in der Schweiz</span>
          ${UHREN.map(u => `<div class="sc-uhr2__zeile"><span>${esc(u[0])}</span><div class="sc-uhr2__spur"><i style="left:${(u[3] / 24 * 100).toFixed(3)}%"><em>${u[3]}–${u[3] + 3} Uhr</em></i></div></div>`).join('')}
          <div class="sc-uhr2__skala" aria-hidden="true"><span></span>${[0, 6, 12, 18, 24].map(z => `<small style="left:${z / 24 * 100}%">${z}</small>`).join('')}</div>
        </div>
      </div>
      <p class="sc-fein" data-r>Gilt in der Winterzeit. Ab dem 28. März 2027 ist es auf den Philippinen eine Stunde früher.</p>
    </section>`;
const startWochen = () => `
    <section class="sc-block sc-block--eng" id="wochen-start">${kopfBlock(['Die ersten', 'Wochen.'], 'Was fertig ist, kommt zuerst auf die Strasse. Alles andere wächst daneben.')}${agendaBlock()}
    </section>`;
const startGeld = () => `
    <section class="sc-block sc-block--eng" id="geld-start">${kopfBlock(['Das', 'Geld.'], 'Wir teilen alles, was die Kunden ab der Unterschrift zahlen, nach Abzug der Kosten zur Hälfte. Zum Ausprobieren:')}
      <div class="sc-rechner" data-r data-start-sicht>
        <div class="sc-rechner__wahl">
          <span class="wo-mk">Was das Haus bezahlt</span>
          <div class="sc-rechner__knoepfe" role="radiogroup">${RECHNER.map((r, i) => { const s = rechnerSpanne(r); return `<button type="button" role="radio" class="sc-rechner__k${i === 0 ? ' an' : ''}" aria-checked="${i === 0}" data-von="${s[0]}" data-bis="${s[1]}" data-wofuer="${esc(r[2])}"><b>${esc(r[0])}</b><small>${chfSpanne(s[0], s[1])} ${esc(r[2])}</small></button>`; }).join('')}</div>
          <label class="sc-rechner__kosten"><span class="wo-mk">Kosten, etwa Domain oder KI-Abos</span><span class="sc-rechner__feld"><em>CHF</em><input type="number" min="0" step="10" value="0" inputmode="numeric" data-kosten></span></label>
        </div>
        <div class="sc-rechner__ergebnis">
          <span class="wo-mk" data-rechner-wofuer>Website Hotel · einmalig</span>
          <b class="sc-rechner__summe" data-rechner-summe></b>
          <div class="sc-rechner__balken"><div class="sc-rechner__haelfte"><i></i><span>Anna</span><b data-rechner-anna></b></div><div class="sc-rechner__haelfte"><i></i><span>Robert</span><b data-rechner-robert></b></div></div>
          <small class="sc-rechner__fuss">Jeder versteuert seine Hälfte selbst, Anna in Spanien. Die Umsatzsteuer lassen wir von der Steuerberatung bestätigen.</small>
        </div>
      </div>
      <ol class="sc-fluss" data-r data-start-sicht>${FLUSS.map((f, i) => `<li style="--i:${i}"><i>${i + 1}</i><b>${esc(f[0])}</b><span>${esc(f[1])}</span></li>`).join('')}</ol>
      ${warumKarten([0, 4])}
    </section>`;
function startBewegung() {
  const ruhig = RUHIG();
  /* sichtbar → .an (Uhrzeiger drehen, Balken laufen, Zahlen zählen hoch) */
  const zaehle = el => { const ziel = +el.dataset.zaehl; if (ruhig || !ziel) return; const t0 = performance.now(); const s = n => { const k = Math.min(1, (n - t0) / 1100); el.textContent = String(Math.round(ziel * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(s); }; el.textContent = '0'; requestAnimationFrame(s); };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(l => l.forEach(x => { if (x.isIntersecting) { x.target.classList.add('an'); x.target.querySelectorAll('[data-zaehl]').forEach(zaehle); io.unobserve(x.target); } }), { threshold: .3 }) : null;
  $$('#ansicht [data-start-sicht]').forEach(el => io ? io.observe(el) : el.classList.add('an'));
  /* Weg zum Kunden: ein Schritt zur Zeit, läuft von selbst, bis jemand klickt */
  const weg = $('#ansicht [data-start-weg]');
  if (weg) {
    let i = 0, lauf = null;
    const zeige = n => {
      i = (n + WEG.length) % WEG.length;
      weg.querySelectorAll('.sc-weg2__p').forEach((b, k) => { b.classList.toggle('an', k === i); b.classList.toggle('vorbei', k < i); b.setAttribute('aria-selected', k === i); });
      weg.querySelectorAll('.sc-weg2__tafel').forEach((t, k) => t.classList.toggle('an', k === i));
      weg.style.setProperty('--weg', (i / (WEG.length - 1)).toFixed(3));
      const z = weg.querySelector('.sc-weg2__zahl b'); if (z) z.textContent = i + 1;
    };
    const halt = () => { if (lauf) { clearInterval(lauf); lauf = null; } };
    weg.querySelectorAll('.sc-weg2__p').forEach(b => b.onclick = () => { halt(); zeige(+b.dataset.i); });
    weg.querySelectorAll('[data-weg]').forEach(b => b.onclick = () => { halt(); zeige(i + +b.dataset.weg); });
    zeige(0);
    if (!ruhig && io) {
      const wio = new IntersectionObserver(l => l.forEach(x => { if (x.isIntersecting && !lauf && !weg.dataset.halt) lauf = setInterval(() => zeige(i + 1), 4200); else if (!x.isIntersecting) halt(); }), { threshold: .5 });
      wio.observe(weg);
      weg.addEventListener('pointerdown', () => { weg.dataset.halt = '1'; halt(); });
    }
  }
  /* Laufende Kosten: Backoffice und Masterclass zuschalten, die Monate rechnen neu */
  const kw = $('#ansicht .sc-kosten__wahl');
  if (kw) {
    const w = { web: 1, bo: 0, mc: 0 };
    const monate = () => $$('#ansicht .sc-kosten__monate details').forEach(d => d.addEventListener('toggle', () => { const a = d.querySelector('.sc-frage__a'); if (d.open && !a.innerHTML) a.innerHTML = kostenMonatInhalt(+d.dataset.monat, w); }));
    monate();
    kw.querySelectorAll('[data-teil]').forEach(b => b.onclick = () => {
      w[b.dataset.teil] = w[b.dataset.teil] ? 0 : 1;
      b.classList.toggle('an', !!w[b.dataset.teil]); b.setAttribute('aria-pressed', !!w[b.dataset.teil]);
      const ziel = $('#ansicht .sc-kosten__monate'), offen = [...ziel.querySelectorAll('details')].map(d => d.open);
      ziel.innerHTML = kostenListe(w, offen);
      monate();
    });
  }
  /* Rechner: Betrag wählen, direkte Kosten abziehen, Rest je zur Hälfte */
  const r = $('#ansicht .sc-rechner');
  if (r) {
    const b0 = r.querySelector('.sc-rechner__k');
    let von = +b0.dataset.von, bis = +b0.dataset.bis, wofuer = RECHNER[0][0] + ' · ' + RECHNER[0][2];
    const rechne = (still) => {
      const k = Math.max(0, +(r.querySelector('[data-kosten]').value || 0)), a = Math.max(0, von - k) / 2, z = Math.max(0, bis - k) / 2;
      r.classList.toggle('sc-rechner--spanne', von !== bis);
      r.querySelector('[data-rechner-summe]').textContent = chfSpanne(von, bis);
      r.querySelector('[data-rechner-wofuer]').textContent = wofuer + (k ? ' · abzüglich ' + chf(k) : '');
      r.querySelector('[data-rechner-anna]').textContent = chfSpanne(a, z);
      r.querySelector('[data-rechner-robert]').textContent = chfSpanne(a, z);
      if (still === true) return;
      r.classList.remove('neu'); void r.offsetWidth; r.classList.add('neu');
    };
    rechne(true);
    r.querySelectorAll('.sc-rechner__k').forEach(b => b.onclick = () => {
      r.querySelectorAll('.sc-rechner__k').forEach(x => { x.classList.toggle('an', x === b); x.setAttribute('aria-checked', x === b); });
      von = +b.dataset.von; bis = +b.dataset.bis; wofuer = b.querySelector('b').textContent + ' · ' + b.dataset.wofuer; rechne();
    });
    r.querySelector('[data-kosten]').oninput = rechne;
  }
}

/* Offene Häuser: die Laptops schweben beim Scrollen hoch und zoomen leicht heran, wie «Hochschweben» auf den Websites (Robert 11.11.2026).
   Nur was unter dem ersten Bildschirm liegt, nur transform und opacity, einmal je Laptop. */
function schwebeLaptops() {
  if (RUHIG() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(l => l.forEach(x => { if (x.isIntersecting) { x.target.classList.add('sc-schweb--da'); io.unobserve(x.target); } }), { threshold: 0, rootMargin: '0px 0px -2% 0px' });
  $$('#ansicht .sc-geraet').forEach(g => {
    if (g.getBoundingClientRect().top < innerHeight * .92) return;
    g.classList.add('sc-schweb'); io.observe(g);
  });
}


/* ---------------------------------------------------------------- Kooperationen (Robert 13.11.2026: «mögliche Kooperationen um Gastropartner herum … ein paar Infos, Bilder dazu, mögliche Kandidaten»).
   Alles als Ideen formuliert, noch niemand angesprochen. Kandidaten: bekannte Namen der Branche, Stand 13.11.2026, keine Kontakte. */
const KB = 'bilder/koop/', MF = '/zentrale/grundlagen/marke/fotos/';
const KOOP = [
  { k: 'steuer', fuer: 'Backoffice', bild: MF + 'k-kn-plan-900.webp', t: 'Steuerberater und Treuhand mit Gastro-Schwerpunkt',
    warum: 'Sie bekommen jeden Monat die Zahlen der Betriebe, oft unvollständig und spät. Mit dem Backoffice kämen sie sauber und geordnet an.',
    gewinn: 'Weniger Nacharbeit, zufriedenere Mandanten und eine Grundlage, auf der sie eigene Beratung anbieten können.',
    kand: ['ETL ADHOGA, der Gastro-Bereich der ETL-Gruppe (Deutschland)', 'Gastroconsult, Treuhand der GastroSuisse-Gruppe (Schweiz)', 'Kleinere Kanzleien mit vielen Gastro-Mandanten in Hamburg und Hannover'],
  },
  { k: 'kasse', fuer: 'Backoffice', bild: KB + 'kasse.webp', t: 'Kassensysteme und ihre Händler',
    warum: 'Sie sitzen bei jeder Eröffnung und jedem Systemwechsel mit am Tisch und verkaufen ohnehin Zusätze zur Kasse.',
    gewinn: 'Ein Backoffice, das an ihre Kasse anschliesst, macht ihr eigenes Angebot wertvoller.',
    kand: ['orderbird', 'Lightspeed Restaurant', 'ready2order', 'Örtliche Kassenhändler, die mehrere Systeme betreuen'] },
  { k: 'getraenke', fuer: 'Backoffice und Website', bild: KB + 'getraenke.webp', t: 'Getränkehandel, Brauereien und Grosshandel',
    warum: 'Ihr Aussendienst besucht jede Woche hunderte Betriebe. Brauereien finanzieren oft Pächter und wollen, dass sie lange durchhalten.',
    gewinn: 'Ein Betrieb mit Überblick über seine Zahlen und einer guten Website bleibt länger Kunde.',
    kand: ['Feldschlösschen (Schweiz)', 'Regionale Brauereien mit eigenen Pachtbetrieben', 'Transgourmet und Prodega', 'Regionale Getränke-Fachgrosshändler'] },
  { k: 'berater', fuer: 'Backoffice', bild: MF + 'k-tafel-900.webp', t: 'Gastro-Berater, Gründungs- und Sanierungsberater',
    warum: 'Sie bauen Konzepte und Abläufe, sind nach einigen Wochen aber wieder weg. Danach fehlt oft das Werkzeug, das ihre Arbeit im Betrieb hält.',
    gewinn: 'Ihre Empfehlungen leben im Backoffice weiter.',
    kand: ['Unabhängige Gastro-Berater mit eigenem Netzwerk', 'Gründungsberater der IHK und der Banken', 'Berater, die Betriebe in Schieflage begleiten'] },
  { k: 'foto', fuer: 'Website', bild: KB + 'foto.webp', t: 'Gastro-Fotografen und Filmer',
    warum: 'Ihre Bilder landen heute oft auf Seiten, die sie nicht gut zeigen. Sie empfehlen gern jemanden, der ihre Arbeit zur Geltung bringt.',
    gewinn: 'Ihre Bilder auf einer Seite, die sie stolz zeigen können und eine Nennung auf der Website.',
    kand: ['Fotografen, die auf den Seiten unserer Häuser als Urheber stehen', 'Food-Fotografen in Hamburg, Hannover und Zürich', 'Filmer für Hotel- und Restaurantfilme'] },
  { k: 'raum', fuer: 'Website', bild: KB + 'raum.webp', t: 'Innenarchitekten, Ladenbauer und Küchenplaner',
    warum: 'Sie wissen Monate vorher, wer neu eröffnet oder umbaut. Genau dann braucht ein Betrieb eine neue Website.',
    gewinn: 'Ihr Umbau wird auf der Website gezeigt, mit Nennung.',
    kand: ['Innenarchitekten mit Gastro- und Hotelprojekten', 'Ladenbauer für Bars und Restaurants', 'Planer für Profiküchen'] },
  { k: 'hotel', fuer: 'Website und Werkzeuge', bild: MF + 'k-empfang-900.webp', t: 'Hotelberater und Buchungssysteme',
    warum: 'Sie kennen die Häuser, die wir in der Schweiz ansprechen, und wissen, wo die Website Buchungen kostet.',
    gewinn: 'Eine Website, die ihr Buchungssystem gut einbindet, bringt mehr direkte Buchungen.',
    kand: ['Mews', 'protel', 'Seekda', 'Unabhängige Hotelberater in der Schweiz'] },
  { k: 'verband', fuer: 'Bühne', bild: MF + 'k-terrasse-900.webp', t: 'Verbände und Branchentreffen',
    warum: 'Sie verkaufen nichts, bringen aber viele Betriebe in einen Raum.',
    gewinn: 'Ein Vortrag über KI im Betrieb oder den KI-Check als Angebot für ihre Mitglieder. Eher später, wenn die ersten Häuser stehen.',
    kand: ['DEHOGA mit den Landesverbänden', 'GastroSuisse', 'HotellerieSuisse'] }
];
const KOOP_ANFANG = [
  ['Zuerst', 'Gastro-Steuerberater', 'Ein einziger kann dutzende Betriebe kennen, und er hat das Problem mit den Zahlen selbst.'],
  ['Danach', 'Fotografen und Innenarchitekten', 'Sie sitzen am Moment, in dem ein Betrieb eine neue Website braucht, und machen uns keine Konkurrenz.'],
  ['Später', 'Verbände als Bühne', 'Wenn die ersten Häuser stehen, mit einem Vortrag oder dem KI-Check für Mitglieder.']
];
function kooperationen() {
  const karte = (p, i) => `<article class="sc-koop__k" data-r style="--i:${i % 2}">
      <div class="sc-koop__bild"><img src="${p.bild}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="${i < 2 ? 'sync' : 'async'}"><span class="sc-koop__fuer">${esc(p.fuer)}</span></div>
      <div class="sc-koop__text">
        <h3>${esc(p.t)}</h3>
        <dl><div><dt>Warum sie mitmachen</dt><dd>${esc(p.warum)}</dd></div><div><dt>Was sie davon haben</dt><dd>${esc(p.gewinn)}</dd></div></dl>
        ${p.achtung ? `<p class="sc-koop__achtung">${esc(p.achtung)}</p>` : ''}
        <div class="sc-koop__kand"><span class="wo-mk">Mögliche Kandidaten</span><ul>${p.kand.map(x => `<li>${WO.ic('rechts')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
      </div></article>`;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: FOTO('terrasse'), h1: 'Partner rund um die <em>Gastronomie</em>', zier: esc('Ideen und Konzepte, noch niemand angesprochen'),
      satz: 'Wer mit Gastronomen ohnehin zusammenarbeitet, kann uns Türen öffnen und Empfehlungen aussprechen. Hier steht, wer dafür in Frage kommt, was er davon hat und wen wir zuerst ansprechen könnten.',
      knoepfe: WO.knopf('Womit wir anfangen', 'rechts', 'gold', { attr: 'data-sprung="koop-anfang"' }) + WO.knopf('Offene Häuser', 'links', 'glas', { attr: 'data-gehe="start"' }) })}
    <section class="sc-block">${kopfBlock(['Wer', 'passt.'], 'Für das Backoffice sind es Partner, die mit den Zahlen eines Betriebs arbeiten. Für Websites sind es die, die bei Eröffnung, Umbau oder Pächterwechsel dabei sind.')}
      <div class="sc-koop">${KOOP.map(karte).join('')}</div></section>
    <section class="sc-block sc-block--eng" id="koop-anfang">${kopfBlock(['Womit wir', 'anfangen.'], 'Ein Vorschlag für die Reihenfolge.')}
      <div class="sc-koop__weg" data-r>${KOOP_ANFANG.map(a => `<div><span class="wo-mk">${esc(a[0])}</span><b>${esc(a[1])}</b><p>${esc(a[2])}</p></div>`).join('')}</div></section>
    <section class="sc-block sc-block--eng">${kopfBlock(['Was ein Partner', 'in die Hand bekommt.'], 'Erste Ideen, noch nichts davon festgelegt.')}
      <div class="sc-weiter2" data-r><div><b>Ein Blatt mit dem Ablauf</b><p>Was wir für einen Betrieb bauen und wie es abläuft, zum Weitergeben.</p></div><div><b>Ein Beispiel zum Zeigen</b><p>Eine fertige Website eines Hauses, die der Partner selbst öffnen und zeigen kann.</p></div><div><b>Ein kurzer Weg zu uns</b><p>Er nennt den Betrieb, wir melden uns.</p></div></div></section>
    <p class="sc-quelle">Stand 16.11.2026 · Erste Ideen, noch niemand angesprochen · Kandidaten sind bekannte Namen der Branche</p>`;
}

/* «Unsere Kunden» ist seit 16.11.2026 in «Kunden» (Reiter «Was wir gemacht haben», Daten in /werkzeuge/02-kundenliste/arbeiten.js). */
/* Familien-Mappe (Robert 16.11.2026: «eine Mappe, wo alles zusammenläuft und Anna alle Häuser im Überblick hat, mit den Paketpreisen … die PDF für alle Häuser rein und in jedes Haus einzeln trotzdem eine eigene»).
   Oben wer dazugehört, dann der Familienblock der Übersicht (gemeinsame Startseite, Häuser, Familienpaket), dann die Präsentationen. */
function familieAnsicht(f) {
  if (!f) return start();
  const h = famMappeHaus(f), l = h.haeuser, h0 = l[0], fs = familienStart(f), x = HEFTE['familie-' + f.k];
  const einzelnH = l.filter(y => HEFTE[y.id]), n = l.length, nWort = n === 2 ? 'beide Häuser' : 'alle ' + n + ' Häuser';
  const pk = (h0.preis || {}).paket || {}, cur = preisCur(h0), g = v => cur === '€' ? zahlCh(v) + ' €' : 'CHF ' + zahlCh(v);
  const EG = new Map(); l.forEach(y => { const e = ((y.preis || {}).paket || {}).einzeln; if (e) { if (!EG.has(e)) EG.set(e, []); EG.get(e).push(y.name); } });
  const einzelnText = EG.size === 1 ? 'je Haus ' + g([...EG.keys()][0]) : [...EG.entries()].sort((a, b) => b[0] - a[0]).map(([e, nn]) => (nn.length > 2 ? 'je Hotel' : nn.join(' und ')) + ' ' + g(e)).join(', ');
  const b1 = paketPreis(h0, 1), b2 = paketPreis(h0, 2), sb = monChf(b1) * n, sw = monChf(b2) * n;
  const famFragen = [
    ['Müssen alle Häuser mitmachen?', `<p>Nein. Jedes Haus gibt es auch einzeln, ${esc(einzelnText)}. Der Paketpreis von ${esc(g(pk.gesamt || 0))} gilt, wenn ${esc(nWort)} zusammen kommen, die gemeinsame Startseite ist dann inklusive.</p>`],
    ['Was kostet es im Monat für alle Häuser?', `<p>Betreuung und Werkzeuge laufen je Haus: ${esc(b1)} und ${esc(b2)} im Monat, monatlich kündbar. Für ${esc(nWort)} zusammen sind das ${esc(g(sb))} Betreuung und ${esc(g(sw))} Werkzeuge im Monat.</p>`],
    ['Was ist die gemeinsame Startseite?', '<p>Eine Adresse für die Familie. Von dort wählt der Gast sein Haus und kommt auf dessen eigene Website. Im Paket ist sie inklusive.</p>'],
    ['Sehen die Websites gleich aus?', '<p>Nein. Jedes Haus hat seine eigene Website mit eigenem Gesicht und eigenen Bildern, die Häuser gleichen einander nicht.</p>'],
    ['Wer pflegt welche Website?', '<p>Jedes Haus bekommt seine sieben Werkzeuge im eigenen Kleid. Das Team des Hauses pflegt seine Seite selbst, ohne bei uns anzurufen.</p>']];
  const alleFragen = famFragen.concat(fragen(h0).filter(q => q[0] !== 'Was kostet das?'));
  const frage = (q, i) => `<details class="sc-frage"${i === 0 ? ' open' : ''}><summary><b>${esc(q[0])}</b><i>${WO.ic('plus')}</i></summary><div class="sc-frage__a">${q[1]}</div></details>`;
  const T = themenVon(h).length, ab = besprochen(h.id), gg = gespraech(h.id), st = (gg && gg.stand) || {};
  const famParat = `<aside class="sc-parat" aria-label="Parat im Gespräch">
    <button type="button" class="sc-parat__auf" data-parat-auf aria-expanded="${S.paratZu ? 'false' : 'true'}" aria-label="Parat im Gespräch ein- oder ausklappen"><span class="wo-mk">Parat im Gespräch</span><i>${WO.ic('hoch')}</i></button>
    <div class="sc-parat__inhalt"><dl>
      <div><dt>Ansprechpartner</dt><dd>${esc(st.partner || h.ansprechpartner.name || 'Noch niemand')}</dd></div>
      <div class="sc-parat__preise"><dt>Preise</dt><dd><ul class="sc-parpreise"><li><span>Paket, ${esc(nWort)}<small>netto, einmalig</small></span><b>${esc(g(pk.gesamt || 0))}</b></li><li><span>Einzeln<small>wenn nur ein Haus kommt</small></span><b>${esc(g(Math.max(...EG.keys(), 0)))}</b></li>${EG.size > 1 ? `<li class="sc-parpreise__notiz">${esc(einzelnText.charAt(0).toUpperCase() + einzelnText.slice(1))}</li>` : ''}<li><span>Betreuung<small>je Haus im Monat</small></span><b>${esc(b1)}</b></li><li><span>Werkzeuge im Abo<small>je Haus im Monat</small></span><b>${esc(b2)}</b></li></ul><small>Monatspreise monatlich kündbar</small></dd></div>
      <div><dt>Die Häuser</dt><dd class="sc-parat__fam">${l.map(y => `<button type="button" data-gehe="haus:${esc(y.id)}">${esc(y.name)}</button>`).join('')}</dd></div>
      <div><dt>Heutige Seiten</dt><dd class="sc-parat__fam">${[...new Map(l.filter(y => y.website).map(y => [y.website, y])).values()].map(y => `<a href="${esc(y.website)}" target="_blank" rel="noopener">${esc(wirt(y.website))}</a>`).join('') || 'Nicht hinterlegt'}</dd></div>
      <div><dt>Bis online</dt><dd>Ein bis zwei Wochen<small>je nachdem, wie schnell das Feedback kommt</small></dd></div>
      <div><dt>Besprochen</dt><dd><span class="sc-balken sc-balken--hell" aria-hidden="true"><i style="width:${Math.round(100 * ab / T)}%"></i></span>${ab} von ${T}${st.vereinbart_datum ? `<small>Vereinbart für ${esc(datum(st.vereinbart_datum))}</small>` : ''}</dd></div>
    </dl>
    <div class="sc-parat__kn">${fs ? WO.knopf('Gemeinsame Startseite', 'auge', 'gold', { klein: true, href: fs[1], neu: true }) : ''}${x ? WO.knopf('Präsentation', 'pfeil', 'glas', { klein: true, href: x.pdf, neu: true }) : ''}</div>
    <nav class="sc-parat__nav" aria-label="In der Mappe">${[['website', 'Die Websites'], ['werkzeuge', 'Die Werkzeuge'], ['angebot', 'Der Preis'], ['ablauf', 'Der Ablauf'], ['fragen', 'Fragen und Antworten'], ['gespraech', 'Das Gespräch']].map(([k, t]) => `<a href="#${k}" data-sprung="${k}">${esc(t)}${WO.ic('rechts')}</a>`).join('')}</nav>
    </div></aside>`;
  return `${WO.startbild({ werkzeug: ORDNER, art: 'buehne', foto: (h0 && h0.bild) || FOTO('studio'), h1: esc(h.name), zier: esc(mz(n, 'Haus', 'Häuser') + ' · ' + [...new Set(l.map(y => (y.ort || '').split(' · ')[0].split(',')[0]))].join(' · ')),
      satz: esc(f.s),
      knoepfe: (fs ? WO.knopf('Gemeinsame Startseite', 'auge', 'gold', { href: fs[1], neu: true }) : '') + (x ? WO.knopf('Präsentation öffnen', 'pfeil', 'glas', { href: x.pdf, neu: true }) : '') + WO.knopf('Gespräch eintragen', 'stift', 'glas', { attr: 'data-sprung="gespraech"' }) })}
    <div class="sc-mappe2 sc-mappe2--schritte${S.alle ? ' sc-alle' : ''}">
      <div class="sc-mappe2__haupt">
        ${wesenBlock('familie-' + f.k, l)}
        ${schrittLeiste(h)}

        <section class="sc-block sc-teil" data-teil="website" id="website">
          ${kopfBlock(['Die', 'Websites.'], 'Eine gemeinsame Startseite für die Familie, darunter jedes Haus mit eigener Website. Ein Klick auf einen Bildschirm zeigt die Seite live.')}
          <div id="sc-haeuser" class="sc-anker">${familieBlock(f)}</div>
          ${x ? heftBlock(x, h.name, /^https:/.test(fs ? fs[1] : ''), 'praesentationen') : ''}
          ${einzelnH.length ? `<div class="sc-hefte" data-r style="--n:${einzelnH.length}">${einzelnH.map(y => { const z = HEFTE[y.id]; return `<article class="sc-heft">
            <a class="sc-heft__bild" href="${esc(z.pdf)}" target="_blank" rel="noopener" aria-label="Präsentation ${esc(y.name)} öffnen"><img src="${esc(z.bild)}" alt="" loading="lazy" decoding="async"></a>
            <span class="wo-mk">Einzeln · ${esc((y.ort || '').split(' · ')[0])}</span><h4><button type="button" data-gehe="haus:${esc(y.id)}">${esc(y.name)}</button></h4>
            <div class="sc-heft__kn">${WO.knopf('Öffnen', 'pfeil', 'gold', { klein: true, href: z.pdf, neu: true })}${WO.knopf('PDF', 'pdf', 'dunkel', { klein: true, href: z.pdf, attr: 'download' })}</div></article>`; }).join('')}</div>` : ''}
          ${schrittFuss(h, 'website')}
        </section>

        ${wzSektion(h0, 'Jedes Haus bekommt die sieben Werkzeuge in seinem eigenen Kleid. Hier am Beispiel ' + h0.name + ', die Bildschirme der anderen Häuser liegen in ihren Mappen.', h)}

        <section class="sc-block sc-teil" data-teil="preis" id="angebot">
          ${kopfBlock(['Der', 'Preis.'], 'Ein Paketpreis für ' + nWort + ' mit gemeinsamer Startseite, dazu je Haus zwei Teile im Monat. Beide monatlich kündbar, alles netto.')}
          <div class="sc-angebot sc-angebot--preis sc-angebot--vier" data-r>
            <div class="sc-angebot__teil sc-angebot__teil--gross"><span class="wo-mk">Paket, ${esc(nWort)}</span><b>${esc(g(pk.gesamt || 0))}</b><p>Netto, einmalig, mit gemeinsamer Startseite.</p></div>
            <div class="sc-angebot__teil"><span class="wo-mk">Einzeln</span><b>${esc(g(Math.max(...EG.keys(), 0)))}</b><p>Je Haus, wenn nur ein Haus kommt.</p></div>
            ${(W.pakete || []).map((k, i) => `<div class="sc-angebot__teil"><span class="wo-mk">${esc(k.name)}</span>${wertB(paketPreis(h0, i + 1) || 'Noch offen')}<p>Je Haus im Monat, monatlich kündbar.<small class="sc-angebot__summe">${esc(n === 2 ? 'Beide Häuser' : 'Alle ' + n + ' Häuser')}: ${esc(g(monChf(paketPreis(h0, i + 1)) * n))} im Monat</small></p></div>`).join('')}
            <p class="sc-angebot__fuss">${EG.size > 1 ? 'Einzeln ' + esc(einzelnText) + '. ' : ''}Im Monat für ${esc(nWort)} zusammen: ${esc(g(sb))} Betreuung und ${esc(g(sw))} Werkzeuge.</p>
          </div>
          ${zahlungListe().length ? `<p class="sc-fein"><b>Zahlung.</b> ${esc(zahlungListe().join(' '))}</p>` : ''}
          ${vertragHausBlock()}
          ${schrittFuss(h, 'preis')}
        </section>

        <section class="sc-block sc-teil" data-teil="ki" id="ki">
          ${kopfBlock(['KI und', 'ihre Kosten.'], 'Vier Stellen in den Werkzeugen nutzen Claude, das Sprachmodell von Anthropic. Was die KI dort tut und wie ihre Kosten geregelt sind, in jedem Haus gleich.')}
          <div class="sc-karten2" data-r>${karteListe('Wo die KI arbeitet', ((W.ki || {}).stellen || []).map(s => s[0] + ' (' + s[1] + '): ' + s[2]), 'chat')}${karteListe('Was sie kostet', (W.ki || {}).kosten || [], 'balken')}</div>
          ${schrittFuss(h, 'ki')}
        </section>

        <section class="sc-block sc-teil" data-teil="betreuung" id="betreuung">
          ${kopfBlock(['Die', 'Betreuung.'], (W.paketeFuss || '') + ' Betreuung und Werkzeuge laufen je Haus.')}
          <div class="sc-karten2" data-r>${(W.pakete || []).map((k, i) => karteListe(k.name, k.punkte, i ? 'blatt' : 'welt', `<span class="sc-karte2__preis">${esc(paketPreis(h0, i + 1) || 'Noch offen')}<small>je Haus im Monat</small></span>`).replace('<ul>', `<p class="sc-karte2__satz">${esc(k.satz)}</p><ul>`)).join('')}</div>
          <div class="sc-karten2 sc-karten2--hell" data-r>${karteListe('Was den Häusern gehört', W.gehoert || [], 'haus')}${karteListe('Gut zu wissen', extraListe(), 'schild')}</div>
          ${schrittFuss(h, 'betreuung')}
        </section>

        <section class="sc-block sc-teil" data-teil="ablauf" id="ablauf">
          ${kopfBlock(['Der', 'Ablauf.'], dauerText())}
          ${ablaufBlock(W.ablauf || [])}
          ${schrittFuss(h, 'ablauf')}
        </section>

        <section class="sc-block sc-teil" data-teil="braucht" id="braucht">
          ${kopfBlock(['Was wir', 'von der Familie brauchen.'], 'Das braucht es von jedem Haus, damit wir loslegen können.')}
          <ol class="sc-braucht2" data-r>${(W.braucht || []).map((t, i) => `<li><span>${i + 1}</span>${esc(t)}</li>`).join('')}</ol>
          ${schrittFuss(h, 'braucht')}
        </section>

        <section class="sc-block sc-teil" data-teil="fragen" id="fragen">
          ${kopfBlock(['Fragen,', 'die kommen.'], 'Zuerst die Fragen zu mehreren Häusern, dann die allgemeinen. Ein Klick öffnet die Antwort.')}
          <div class="sc-fragen" data-r>${alleFragen.map(frage).join('')}</div>
          ${schrittFuss(h, 'fragen')}
        </section>

        <section class="sc-block sc-teil" data-teil="weiter" id="gespraech">
          ${kopfBlock(['Der nächste', 'Schritt.'], 'Was vereinbart ist, kommt hier hinein: einsprechen oder eintragen. Gespeichert wird erst mit «Speichern».')}
          ${memoBlock(h)}${gespraechForm(h)}
        </section>
      </div>
      ${famParat}
    </div>`;
}
/* ---------------------------------------------------------------- Start */
function startfehler(grund) {
  document.documentElement.classList.remove('sc-wartet');
  $('#ansicht').innerHTML = `<div class="sc-tuer-zu" role="alert"><h1>${esc(NAME)} startet nicht.</h1><p>${esc(grund)}</p><p>Läuft die Zentrale? Starten mit <code>python3 zentrale/server.py</code>, dann neu laden.</p>${WO.knopf('Neu laden', 'zurueck', 'dunkel', { attr: 'data-neu-laden' })}</div>`;
  const b = $('#ansicht [data-neu-laden]'); if (b) b.onclick = () => location.reload();
}
/* Erster Blick komplett: Schrift, Startfoto und Laptop sind da, bevor die Seite sichtbar wird (höchstens 1,2 s) */
function bereit(srcs) {
  const bilder = srcs.filter(Boolean).map(src => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; }));
  return Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, ...bilder]), new Promise(r => setTimeout(r, 1200))]);
}
const FOTO_JE = { start: 'bildschirm', konditionen: 'tafel', antworten: 'empfang', partnerschaft: 'anleger', kooperationen: 'terrasse', weiter: 'tafel' };
addEventListener('beforeunload', e => { if (S.entwurf && S.entwurf.geaendert) { e.preventDefault(); e.returnValue = ''; } });
(async function () {
  try {
    if (!window.WO) throw new Error('Das Kleid (oberflaeche.js) fehlt.');
    const r = await (window.__vorab || fetch(API + 'stand', { cache: 'no-store' }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.fehler || 'Der Server antwortete mit Fehler ' + r.status + '.');
    S.d = j; paketeRechnen();
    let a = decodeURIComponent(location.hash.slice(1));
    if (!gueltig(a)) { try { const l = localStorage.getItem('tasty-sc-ansicht'); a = gueltig(l) && !H.imRahmen ? l : 'start'; } catch (e) { a = 'start'; } }
    S.ansicht = a;
    const h = /^haus:/.test(a) ? haus(a.slice(5)) : null;
    await bereit([h ? h.bild : FOTO(FOTO_JE[a]), LAPTOP, h ? h.schirm : '']);
    kopf(); rand(); leiste(); zeichne();
    document.documentElement.classList.remove('sc-wartet');
    document.body.classList.add('sc-bereit');
  } catch (e) { return startfehler(String(e && e.message || e).slice(0, 200)); }
  addEventListener('hashchange', () => { const z = decodeURIComponent(location.hash.slice(1)); if (gueltig(z) && z !== S.ansicht) gehe(z); });
})();
