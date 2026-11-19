/* bearbeiten.js · Website bearbeiten 1:1 (Robert 17.11.2026: «dass die Änderungen … direkt auf der Website auch greifen … ein richtig geiles,
   funktionierendes Tool»). Die Seite steht in voller Grösse im Werkzeug, jede Stelle lässt sich anklicken, rechts stehen ihre Einstellungen.
   Jede Änderung wird sofort in den Entwurf gesichert (web.py), «Veröffentlichen» prüft die geänderten Seiten bei Rechner- und Handybreite,
   legt sie in die Website und lädt sie danach von der Website zurück, bis sie dort angekommen ist. Verlauf mit «Zurück zu diesem Stand».
   Baut auf den Bausteinen des Startblatts auf (window.WSB aus blatt.js: Fenster, Quittung, Auswahl, Wahl, Navigation). */
(() => {
'use strict';
const B = window.WSB;
const { el, kn, taste, link, mono, quit, melde, fenster, auswahl, wahl2, kurz, mz, zeit, $, $$ } = B;
const API = '/zentrale/api/01-feinschliff/web/';
const ORT = '/zentrale/werkzeuge/01-feinschliff/';
const INLINE = new Set(['BR', 'EM', 'I', 'STRONG', 'B', 'SPAN', 'A', 'SMALL', 'SUP', 'SUB', 'U', 'S', 'MARK', 'WBR']);
const FARBEN = [['Nacht', '#111421'], ['Navy', '#1f213b'], ['Schiefer', '#1f212c'], ['Tinte', '#0b0c10'], ['Creme', '#ebdbce'], ['Sand', '#d6c2b1'],
  ['Taupe', '#9e947f'], ['Gold', '#c7b489'], ['Messing', '#a16832'], ['Weiss', '#ffffff'], ['Signalrot', '#ff3132']];
const SCHRIFT_NAME = { antonio: 'Antonio (Titel)', instrument: 'Instrument Sans (Text)', cormorant: 'Cormorant Garamond (Schild)', mono: 'DM Mono (Zeile)' };
const S = { lage: null, seite: null, frame: null, win: null, doc: null, quelle: null, wahl: null, edit: null, editStart: '', breite: 'voll', status: 'ruhig',
  zuletzt: null, kette: Promise.resolve(), offen: 0, warte: [], halten: null, stapel: [], hover: null, rand: null, tipp: null, vgl: null };

// ---------------------------------------------------------------- Verbindung zur Zentrale
async function ruf(methode, weg, daten) {
  const url = API + weg + (methode === 'GET' ? (weg.includes('?') ? '&' : '?') + 'wer=' + encodeURIComponent(B.wer()) : '');
  let r, j = null;
  try {
    r = await fetch(url, { method: methode, headers: daten ? { 'Content-Type': 'application/json' } : {}, cache: 'no-store',
      body: daten ? JSON.stringify(Object.assign({ wer: B.wer() }, daten)) : undefined });
  } catch (e) { throw { netz: true, stichwort: 'keine-verbindung', fehler: 'Die Zentrale antwortet nicht.' }; }
  try { j = await r.json(); } catch (e) { /* keine lesbare Antwort */ }
  if (!r.ok || !j) throw Object.assign({ status: r.status, stichwort: 'unerwartet', fehler: 'Unerwartete Antwort der Zentrale (' + r.status + ').' }, j || {});
  return j;
}
async function lade() {
  S.lage = await ruf('GET', 'lage');
  try { S.warte = JSON.parse(localStorage.getItem('fsb-warte') || '[]'); } catch (e) { S.warte = []; }
  if (S.warte.length) { S.status = 'fehler'; wiederholen(); }
  if (S.lage.ziel === 'echt') ruf('GET', 'abgleich').then(a => { if (a.neu.length || a.zusammenstoss.length) { lageNeu(); if (a.zusammenstoss.length) melde('Robert hat inzwischen an ' + a.zusammenstoss.map(seiteName).join(', ') + ' gearbeitet', { mehr: 'Dein Entwurf dieser Seiten bleibt. Veröffentlichen überschreibt dort Roberts neuen Stand nicht; verwirf deinen Entwurf dieser Seite oder sprich mit Robert.', stichwort: 'zusammenstoss' }); } }).catch(() => {});
  return S.lage;
}
const zeichen = l => l ? [l.aenderungen.length, l.aenderungen.map(a => a.nr + a.zeit).join(), (l.verlauf[0] || {}).sha, (l.verlauf[0] || {}).online, (l.verlauf[0] || {}).bild, l.ziel].join('|') : '';
async function lageNeu(still) {
  try { const vor = zeichen(S.lage); S.lage = await ruf('GET', 'lage'); if (!still || zeichen(S.lage) !== vor) B.allesNeu(); } catch (e) { /* nächstes Mal */ }
}
const seiteName = d => ((S.lage && S.lage.seiten.find(s => s.datei === d)) || {}).name || d;
const liveAdresse = d => (S.lage ? S.lage.adresse : '/') + (d === 'index.html' ? '' : d);
const uhr = d => (d || new Date()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
const warte = ms => new Promise(r => setTimeout(r, ms));
const normal = s => String(s || '').replace(/\s+/g, ' ').replace(/ data-fsb-[a-z]+="[^"]*"/g, '').trim();

// ---------------------------------------------------------------- Sichern: jede Änderung sofort, der Reihe nach, nie still verloren
function status(s) { S.status = s; B.leiste(); const p = $('#fsb-pille'); if (p) zeichnePille(p); }
function zeichnePille(p) {
  const t = { ruhig: S.zuletzt ? 'Gesichert ' + uhr(S.zuletzt) : 'Alles gesichert', laeuft: 'Wird gesichert …', fehler: 'Nicht gesichert', gesichert: 'Gesichert ' + uhr(S.zuletzt) }[S.status] || '';
  p.textContent = t; p.setAttribute('data-lage', S.status);
}
function sichere(op, opt = {}) {
  S.offen++; status('laeuft');
  const lauf = S.kette.then(async () => {
    try {
      const a = await ruf('POST', 'aendern', Object.assign({}, op, { erwartet: S.lage.stand[op.seite] }));
      S.lage.stand[op.seite] = a.stand;
      if (a.eintrag) {
        const l = S.lage.aenderungen, i = l.findIndex(x => x.nr === a.eintrag.nr);
        if (i >= 0) l[i] = a.eintrag; else l.push(a.eintrag);
        S.lage.je_seite[op.seite] = l.filter(x => x.seite === op.seite).length;
        if (!opt.still) quittung(a.eintrag);
      }
      S.zuletzt = new Date();
      await quelleHolen();
      return a;
    } catch (e) {
      if (e.netz) { S.warte.push(op); merkeWarte(); wiederholen(); throw e; }
      if (e.status === 409) melde('Die Seite lädt neu', { mehr: e.fehler, stichwort: e.stichwort || 'konflikt' });
      else melde(e.fehler || 'Nicht gesichert', { fehler: true, stichwort: e.stichwort || 'unerwartet' });
      await lageNeu(); neuLaden();
      throw e;
    } finally {
      S.offen--;
      if (!S.offen) status(S.warte.length ? 'fehler' : 'gesichert');
      B.kopf(); B.rand();
    }
  });
  S.kette = lauf.catch(() => {});
  return lauf;
}
function merkeWarte() { try { localStorage.setItem('fsb-warte', JSON.stringify(S.warte)); } catch (e) { /* ohne Speicher */ } }
let wieder = null;
function wiederholen() {
  status('fehler');
  if (wieder) return;
  wieder = setInterval(async () => {
    if (!S.warte.length) { clearInterval(wieder); wieder = null; return; }
    try { await ruf('GET', 'lage').then(l => { S.lage.stand = l.stand; }); } catch (e) { return; }
    const liste = S.warte.splice(0); merkeWarte();
    for (const op of liste) { try { await sichere(op, { still: true }); } catch (e) { if (e.netz) return; } }
    if (!S.warte.length) { clearInterval(wieder); wieder = null; status('gesichert'); melde('Alles gesichert', { mehr: 'Die Verbindung steht wieder, deine Eingaben liegen im Entwurf.' }); }
  }, 4000);
}
function quittung(a) {
  const k = quit('Gesichert', '', [taste('Rückgängig', () => { k.remove(); zuruecknehmen(a.nr); })], { 'data-fsb-quittung': a.nr });
  let ueber = false; k.addEventListener('mouseenter', () => { ueber = true; }); k.addEventListener('mouseleave', () => { ueber = false; });
  const weg = () => { if (!k.isConnected) return; if (ueber) { setTimeout(weg, 2000); return; } k.style.transition = 'opacity .4s'; k.style.opacity = '0'; setTimeout(() => k.remove(), 420); };
  setTimeout(weg, 9000);   // beim Arbeiten nicht im Weg: verschwindet von selbst, «Rückgängig» bleibt in der Leiste oben und unter «Entwurf»
  const t = $('.ws-quit__t', k);
  if (a.art === 'text') t.append(el('span', {}, (a.wo || 'Text') + ': «', el('s', {}, kurz(a.alt, 80)), '» wird «', el('b', {}, kurz(a.neu, 80)), '». Noch nicht online.'));
  else t.append(el('span', {}, (a.was || 'Geändert') + (a.wo ? ' · ' + a.wo : '') + '. Im Entwurf, noch nicht online.'));
}
async function zuruecknehmen(nr) {
  try {
    const a = await ruf('POST', 'zuruecknehmen', { nr });
    S.lage.stand[a.eintrag.seite] = a.stand;
    S.lage.aenderungen = S.lage.aenderungen.filter(x => x.nr !== nr);
    melde('Zurückgenommen', { mehr: (a.eintrag.wo || 'Die Stelle') + ' ist wieder wie vorher.' });
    await lageNeu();
    if (B.Z.ansicht.startsWith('b:')) neuLaden(); else B.zeichne({ halten: true });
  } catch (e) { melde(e.fehler || 'Nicht zurückgenommen', { fehler: true, stichwort: e.stichwort }); }
}
async function rueckLetzte() {
  const l = S.lage.aenderungen.filter(a => a.seite === S.seite);
  if (!l.length) { melde('Nichts zum Zurücknehmen', { mehr: 'Auf dieser Seite liegt keine Änderung im Entwurf.' }); return; }
  await S.kette;
  zuruecknehmen(l[l.length - 1].nr);
}

// ---------------------------------------------------------------- Leiste unten (ersetzt die Leiste des Startblatts in allen Ansichten)
function leiste() {
  const l = B.leer($('#ws-leiste'));
  if (!S.lage) return;
  const n = S.lage.aenderungen.length, wn = B.offenZahl(), f = S.lage.neue_fotos.length;
  const letzte = S.lage.verlauf[0];
  let titel, satz;
  if (S.status === 'fehler') { titel = 'Nicht gesichert'; satz = 'Keine Verbindung. Deine Eingaben warten hier.'; }
  else if (S.status === 'laeuft') { titel = 'Wird gesichert …'; satz = 'Geht in den Entwurf.'; }
  else if (S.unterwegs && !n) { const s = Math.round((Date.now() - S.unterwegs.start) / 1000); titel = 'Wird online gestellt'; satz = 'GitHub braucht etwa eine Minute (' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '). Weiterarbeiten geht.'; }
  else if (wn) { titel = mz(wn, 'Antwort', 'Antworten') + ' nicht gespeichert'; satz = 'Speichern legt sie zu den Wünschen.'; }
  else if (n || f) { titel = mz(n || f, 'Änderung', 'Änderungen') + ' im Entwurf'; satz = 'Gesichert, noch nicht online.'; }
  else { titel = 'Alles veröffentlicht'; satz = letzte ? 'Zuletzt ' + zeit(letzte.zeit).replace(' Uhr', '') + ', ' + letzte.wer + '.' : 'Die Website zeigt den neuesten Stand.'; }
  l.setAttribute('data-ws-offen', String(n));
  l.setAttribute('data-fsb-lage', S.status);
  l.innerHTML = WO.leiste({ titel, satz, entwurf: !!(n || f),
    knoepfe: (S.status === 'fehler' ? WO.knopf('Erneut versuchen', 'verlauf', 'wartet', { id: 'fsb-nochmal', klein: true }) : '')
      + (wn ? WO.knopf('Speichern', 'pfeil', 'wartet', { id: 'ws-speichern', klein: true }) : '')
      + WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'fsb-vgl', klein: true, disabled: !n })
      + WO.knopf('Veröffentlichen', 'welt', (n || f) ? 'gold' : 'glas', { id: 'fsb-raus', klein: true, disabled: !(n || f) || S.status !== 'ruhig' && S.status !== 'gesichert' })
      + WO.knopf('Website ansehen', 'pfeil', 'glas', { id: 'fsb-live', klein: true, href: liveAdresse(S.seite || 'index.html'), neu: true }) });
  const sp = $('#ws-speichern'); if (sp) sp.addEventListener('click', () => B.speichern());
  const no = $('#fsb-nochmal'); if (no) no.addEventListener('click', () => { if (wieder) { clearInterval(wieder); wieder = null; } wiederholen(); });
  $('#fsb-vgl').addEventListener('click', () => B.geh('vergleich'));
  $('#fsb-raus').addEventListener('click', veroeffentlichen);
}

// ---------------------------------------------------------------- Die Seite: 1:1 im Werkzeug, rechts die Einstellungen
function seite(datei) {
  ende();
  S.seite = datei; S.wahl = null; S.edit = null;
  document.documentElement.classList.add('fsb-an');
  const klappt = randZu(true);   // erst klappt die Leiste ein, dann lädt die Seite (nie beides gleichzeitig: Robert 17.11.2026 «sehr wackelig»)
  const m = B.leer($('#ws-mitte'));
  const pille = el('span', { class: 'fsb-pille', id: 'fsb-pille', role: 'status' }); zeichnePille(pille);
  const kopf = el('div', { class: 'fsb-kopf' },
    el('div', { class: 'fsb-kopf__l' }, el('span', { class: 'fsb-mk' }, 'Bearbeiten'), el('b', {}, seiteName(datei)), pille),
    wahl2([{ wert: 'voll', text: 'Rechner' }, { wert: 'handy', text: 'Handy' }], S.breite, x => { S.breite = x; passe(); }, 'Breite der Seite', true),
    el('div', { class: 'fsb-kopf__r' },
      rund('Letzte Änderung zurücknehmen', 'zurueck', rueckLetzte, 'fsb-rueck'),
      rund('Vorher, nachher', 'auge', () => B.geh('vergleich', { seite: datei })),
      el('a', { class: 'fsb-rund', href: liveAdresse(datei), target: '_blank', rel: 'noopener', title: 'Online ansehen', 'aria-label': 'Online ansehen', html: WO.ic('pfeil') })));
  const frame = el('iframe', { class: 'fsb-frame', title: 'Die Seite ' + seiteName(datei) + ' zum Bearbeiten', 'data-fsb-frame': datei });
  const lagen = el('div', { class: 'fsb-lade' }, mono('Seite wird geladen …'));
  const rahmen = el('div', { class: 'fsb-rahmen' }, frame, lagen);
  const insp = el('aside', { class: 'fsb-insp', id: 'fsb-insp', 'aria-label': 'Einstellungen der gewählten Stelle' });
  /* Die Bühne mit der Website federt nicht (data-sw + sw-ruhig: schweben.js lässt sie in Ruhe). Eine lebende Seite, die skaliert und
     gleichzeitig breiter wird, ruckelt; die Website erscheint stattdessen in einem Zug, sobald sie fertig ist (aufdecken). */
  m.append(el('div', { class: 'fsb', id: 'fsb' }, el('section', { class: 'fsb-buehne sw-da sw-ruhig', 'data-sw': '1' }, kopf, rahmen), insp));
  S.frame = frame; S.rahmen = rahmen; S.lagen = lagen;
  frame.addEventListener('load', verbinde);
  passe();
  inspektor();
  const src = ORT + 'ansicht/' + datei + '?bearbeiten=' + Date.now();
  klappt.then(() => { if (S.frame === frame) { passe(); frame.src = src; } });
}
function rund(name, ic, tun, id) { return el('button', { class: 'fsb-rund', type: 'button', title: name, 'aria-label': name, id: id || null, onclick: tun, html: WO.ic(ic) }); }
function passe() {
  const f = $('#fsb'); if (!f) return;
  const oben = f.getBoundingClientRect().top, leiste = ($('#ws-leiste') || {}).offsetHeight || 0;
  const h = Math.max(520, window.innerHeight - Math.max(0, oben) - leiste - 18);
  f.style.setProperty('--fsb-h', h + 'px');
  if (S.rahmen) S.rahmen.classList.toggle('fsb-rahmen--handy', S.breite === 'handy');
  if (S.vgl) S.vgl.classList.toggle('fsb-rahmen--handy', S.breite === 'handy');
}
window.addEventListener('resize', () => requestAnimationFrame(passe));
let randVorher = null;
const RAND_KEY = 'tasty-rand:' + location.pathname.replace(/index\.html$/, '');
function randZu(zu) {
  /* Für die Seite in voller Grösse klappt die Seitenleiste ein; beim Verlassen kommt sie so zurück, wie sie war */
  const html = document.documentElement;
  if (zu) {
    if (randVorher === null) randVorher = html.classList.contains('st-rand-zu');
    if (html.classList.contains('st-rand-zu') || innerWidth <= 900) return klappEnde();
    /* Gibt ein Versprechen zurück, das hält, sobald die Leiste fertig eingeklappt ist: erst dann lädt die Seite */
    return new Promise(fertig => {
      const t0 = performance.now();
      const such = () => {
        const k = document.querySelector('[data-st-rand-kn]');
        if (html.classList.contains('st-rand-zu')) { klappEnde().then(fertig); return; }
        if (!k) { if (performance.now() - t0 < 400) setTimeout(such, 16); else fertig(); return; }   // Knopf entsteht gleich nach dem Zeichnen
        k.click();
        try { localStorage.setItem(RAND_KEY, 'auf'); } catch (e) { /* privat */ }   // nur für die Arbeitsfläche eingeklappt, die Vorliebe bleibt «offen»
        klappEnde().then(fertig);
      };
      setTimeout(such, 0);   // Uhr statt Bildtakt: läuft auch, wenn das Fenster gerade im Hintergrund liegt
    });
  } else if (randVorher !== null) {
    const war = randVorher; randVorher = null;
    if (!war && html.classList.contains('st-rand-zu')) setTimeout(() => { const k = document.querySelector('[data-st-rand-kn]'); if (k && html.classList.contains('st-rand-zu')) k.click(); }, 60);
  }
}
function klappEnde() {
  /* wartet, bis die Leiste ihre Bewegung beendet hat (cockpit-stand.js setzt _laeuft), höchstens 1,2 s */
  return new Promise(fertig => {
    const t0 = performance.now();
    const sieh = () => { const r = document.querySelector('.wo-rand.st-rand'); if (!r || !r._laeuft || performance.now() - t0 > 1200) fertig(); else setTimeout(sieh, 16); };
    setTimeout(sieh, 16);
  });
}
async function seiteBereit(w, d) {
  /* Die Website wird erst gezeigt, wenn Schrift und alle Bilder im ersten Bild geladen sind (erster Blick komplett), höchstens 2,5 s */
  const bilder = [...d.images].filter(i => { const r = i.getBoundingClientRect(); return !i.complete && r.width && r.bottom > 0 && r.top < w.innerHeight; });
  const geladen = Promise.all(bilder.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })));
  await Promise.race([Promise.all([d.fonts ? d.fonts.ready : null, geladen]), warte(2500)]);
  await Promise.race([new Promise(r => w.requestAnimationFrame(() => w.requestAnimationFrame(r))), warte(150)]);
}
function aufdecken() {
  const l = S.lagen; if (!l || l.hidden || l.classList.contains('fsb-lade--weg')) return;
  l.classList.add('fsb-lade--weg');
  setTimeout(() => { l.hidden = true; l.classList.remove('fsb-lade--weg'); }, 620);
}
function ende() {
  /* beim Verlassen einer Seite: offene Eingabe sichern */
  if (S.edit) textFertig(true);
  S.frame = null; S.doc = null; S.win = null; S.wahl = null; S.vgl = null;
}
function verlassen() { ende(); document.documentElement.classList.remove('fsb-an'); randZu(false); }

async function quelleHolen() {
  if (!S.seite) return;
  try { const t = await (await fetch(ORT + 'ansicht/' + S.seite + '?q=' + Date.now(), { cache: 'no-store' })).text(); S.quelle = new DOMParser().parseFromString(t, 'text/html'); }
  catch (e) { /* bleibt beim alten */ }
}
const STIL_SEITE = `
[data-fsb-hover]{cursor:pointer!important}
[data-fsb-wahl][contenteditable]{outline:none!important;cursor:text!important;caret-color:#a16832;-webkit-user-select:text!important;user-select:text!important}
.fsb-box{position:fixed;z-index:2147483646;pointer-events:none;border-radius:4px;display:none;box-sizing:border-box}
.fsb-box--hover{border:1px solid rgba(199,137,74,.85);background:rgba(161,104,50,.05)}
.fsb-box--wahl{border:2px solid #a16832;box-shadow:0 0 0 1px rgba(255,255,255,.55),0 0 0 4px rgba(161,104,50,.18)}
.fsb-box--wahl.fsb-box--schreibt{border-width:2px;background:transparent;box-shadow:0 0 0 1px rgba(255,255,255,.55),0 0 0 6px rgba(161,104,50,.22)}
[data-fsb-blitz]{animation:fsbBlitz 1.2s ease-out 1!important}
@keyframes fsbBlitz{0%{outline:3px solid #a16832;outline-offset:6px}100%{outline:3px solid rgba(161,104,50,0);outline-offset:-2px}}
.fsb-schild{position:fixed;z-index:2147483647;pointer-events:none;font:500 11px/1 'DM Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;
  background:#111421;color:#ebdbce;padding:6px 9px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.25);white-space:nowrap;transition:opacity .12s}
.fsb-schild b{color:#fff;font-weight:500}.fsb-schild i{font-style:normal;color:#c7b489}`;
async function verbinde() {
  const f = S.frame; if (!f) return;
  let w, d;
  try { w = f.contentWindow; d = w.document; } catch (e) { return; }
  if (!d || !d.body || !/\/ansicht\//.test(w.location.pathname)) {   // Klick auf einen Link zu einer anderen Seite: zurück in den Entwurf
    melde('Diese Seite lässt sich hier nicht bearbeiten', { mehr: 'Bearbeitet werden die sieben Seiten links in der Leiste.' }); f.src = ORT + 'ansicht/' + S.seite; return;
  }
  const datei = w.location.pathname.split('/ansicht/')[1] || 'index.html';
  if (datei !== S.seite && S.lage.seiten.some(s => s.datei === datei)) { B.geh('b:' + datei); return; }
  S.win = w; S.doc = d;
  d.head.append(Object.assign(d.createElement('style'), { textContent: STIL_SEITE, id: 'fsb-stil' }));
  S.schild = Object.assign(d.createElement('div'), { className: 'fsb-schild' }); S.schild.style.opacity = '0'; d.body.append(S.schild);
  /* Rahmen um die gewählte und die gezeigte Stelle: eigene Ebene über allem (auch über Bildflächen), folgt der Stelle in jedem Bild, auch beim Scrollen */
  S.boxW = Object.assign(d.createElement('div'), { className: 'fsb-box fsb-box--wahl' }); S.boxH = Object.assign(d.createElement('div'), { className: 'fsb-box fsb-box--hover' });
  d.body.append(S.boxH, S.boxW);
  rahmenLauf();
  d.addEventListener('click', klick, true);
  d.addEventListener('mousemove', schweben, true);
  d.addEventListener('mouseleave', () => hover(null), true);
  d.addEventListener('keydown', tasten, true);
  d.addEventListener('dragstart', ev => ev.preventDefault(), true);
  d.addEventListener('submit', ev => ev.preventDefault(), true);
  w.addEventListener('scroll', () => { schildZu(); }, { passive: true });
  await Promise.all([quelleHolen(), S.lagen.hidden ? null : seiteBereit(w, d)]);
  if (S.frame !== f) return;
  const h = S.halten; S.halten = null;
  if (h) { w.scrollTo(0, h.y); await warte(80); w.scrollTo(0, h.y); if (h.id) { const e = d.querySelector(`[data-fs="${h.id}"]`); if (e) waehle(e, { ohneText: true }); } }
  aufdecken();
  wiederfinden();
}
function neuLaden() {
  if (!S.frame || !S.win) return;
  S.halten = { y: S.win.scrollY, id: S.wahl && S.wahl.getAttribute('data-fs') };
  if (S.edit) { S.edit.removeAttribute('contenteditable'); S.edit = null; }
  S.frame.src = ORT + 'ansicht/' + S.seite + '?bearbeiten=' + Date.now();
}
function wiederfinden() {
  /* Text, der getippt, aber nie gesichert wurde (Fenster zu, Absturz): anbieten, statt ihn still zu verlieren */
  const vorne = 'fsb-tipp:' + S.seite + ':';
  let gef = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(vorne)) gef.push(k); } } catch (e) { return; }
  gef = gef.filter(k => { const e = S.doc.querySelector(`[data-fs="${k.slice(vorne.length)}"]`), q = qEl(e); if (!e || !q || normal(q.innerHTML) === normal(localStorage.getItem(k))) { localStorage.removeItem(k); return false; } return true; });
  if (!gef.length) return;
  const k = quit('Ungesicherter Text gefunden', mz(gef.length, 'Stelle wurde', 'Stellen wurden') + ' getippt, aber nicht gesichert.', [
    taste('Wiederherstellen', async () => { k.remove(); for (const key of gef) { const id = key.slice(vorne.length), e = S.doc.querySelector(`[data-fs="${id}"]`); if (!e) continue; const html_ = localStorage.getItem(key); e.innerHTML = html_; localStorage.removeItem(key); try { await sichere({ op: 'text', seite: S.seite, id, html: html_, wo: ortName(e), was: 'Text wiederhergestellt' }); } catch (x) { /* steht als Meldung */ } } }),
    taste('Verwerfen', () => { gef.forEach(key => localStorage.removeItem(key)); k.remove(); })]);
}

// ---------------------------------------------------------------- Was wo ist: Namen, Stapel unter dem Zeiger, Text oder nicht
const qEl = e => (e && S.quelle && e.getAttribute) ? S.quelle.querySelector(`[data-fs="${e.getAttribute('data-fs')}"]`) : null;
function istText(e) {
  const q = qEl(e);
  if (!q || !q.textContent.trim() || q.tagName === 'BODY') return false;
  return [...q.querySelectorAll('*')].every(x => INLINE.has(x.tagName));
}
function istKnopf(e) { return e.tagName === 'BUTTON' || (e.tagName === 'A' && /(^|\s)(kn|btn|knopf|wo-kn|cta|r-kn)/.test(e.className || '')); }
function name(e) {
  const t = e.tagName;
  if (t === 'IMG' || t === 'PICTURE') return 'Foto';
  if (t === 'VIDEO') return 'Film';
  if (t === 'H1' || t === 'H2') return 'Überschrift';
  if (/^H[3-6]$/.test(t)) return 'Zwischentitel';
  if (t === 'A') return istKnopf(e) ? 'Knopf' : 'Link';
  if (t === 'BUTTON') return 'Knopf';
  if (t === 'P') return 'Text';
  if (t === 'LI') return 'Listenpunkt';
  if (t === 'UL' || t === 'OL') return 'Liste';
  if (t === 'FIGCAPTION') return 'Bildzeile';
  if (t === 'FIGURE') return 'Bild';
  if (t === 'BLOCKQUOTE') return 'Zitat';
  if (t === 'SECTION') return 'Abschnitt';
  if (t === 'HEADER') return 'Kopf';
  if (t === 'FOOTER') return 'Fuss';
  if (t === 'NAV') return 'Menü';
  if (INLINE.has(t)) return istText(e) ? 'Textstück' : 'Zeile';
  return istText(e) ? 'Text' : 'Fläche';
}
function abschnitt(e) { return e.closest('section, header, footer, nav, main > div, body > div'); }
function abschnittName(e) {
  const s = abschnitt(e); if (!s) return '';
  const h = s.querySelector('h1, h2, h3');
  return h ? kurz((h.innerText || h.textContent).replace(/\s+/g, ' '), 34) : name(s);
}
function ortName(e) {
  const s = abschnitt(e), h = s && s.querySelector('h1, h2, h3');
  const ht = h ? kurz((h.innerText || h.textContent).replace(/\s+/g, ' '), 40) : '';
  if (h && (h === e || h.contains(e))) return name(e) + ' «' + kurz((e.innerText || e.textContent).replace(/\s+/g, ' '), 40) + '»';
  if (h && e.contains(h)) return name(e) + ' «' + ht + '»';
  const a = abschnittName(e); return name(e) + (a && s !== e ? ' · ' + a : '');
}
function sichtbar(e) {
  /* Robert 17.11.2026: «komische Textfelder …, die nicht existieren». Stellen, die gerade unsichtbar sind (durchsichtig, ausgeblendet,
     erst beim Scrollen eingeblendet), sind nicht wählbar: nur was man in der Seite sieht, lässt sich anklicken. */
  const w = S.win; if (!w) return true;
  if (w.getComputedStyle(e).visibility === 'hidden') return false;
  let o = 1;
  for (let x = e; x && x.nodeType === 1; x = x.parentElement) {
    const c = w.getComputedStyle(x);
    if (c.display === 'none') return false;
    o *= parseFloat(c.opacity); if (!(o >= 0.08)) return false;
  }
  return true;
}
function stapelBei(x, y) {
  if (!S.doc) return [];
  const aus = [];
  for (const k of S.doc.elementsFromPoint(x, y)) {
    if (k.classList && k.classList.contains('fsb-box')) continue;
    const e = k.closest && k.closest('[data-fs]');
    if (e && !aus.includes(e) && e !== S.schild && sichtbar(e)) aus.push(e);
  }
  return aus;
}
function ganzerText(e) {   // Zeilen und Wörter einer Überschrift gehören zusammen: der äusserste Text gewinnt (die Überschrift, nicht ihre Zeile)
  let p = eltern(e);
  while (p && istText(p) && !/^(LI|TD|BODY)$/.test(e.tagName)) { e = p; p = eltern(e); }
  return e;
}
function aufText(e, x, y) {   // liegt der Zeiger wirklich auf Buchstaben (nicht nur in der Fläche eines Absatzes)?
  const w = S.doc.createTreeWalker(e, NodeFilter.SHOW_TEXT), r = S.doc.createRange();
  let n;
  while ((n = w.nextNode())) {
    if (!n.textContent.trim()) continue;
    r.selectNodeContents(n);
    for (const q of r.getClientRects()) if (x >= q.left - 4 && x <= q.right + 4 && y >= q.top - 4 && y <= q.bottom + 4) return true;
  }
  return false;
}
function bevorzugt(stapel, x, y) {
  const bi = stapel.findIndex(e => e.tagName === 'IMG' || e.tagName === 'VIDEO');
  const ti = stapel.findIndex(e => istText(e) && (x == null || aufText(e, x, y)));
  if (ti >= 0 && (bi < 0 || ti < bi)) return ganzerText(stapel[ti]);   // auf Buchstaben: der Text gewinnt, auch in Bildfenstern unter durchsichtigen Flächen
  if (bi >= 0) return stapel[bi];                                       // daneben: das Foto darunter
  return stapel[0] || null;
}
function eltern(e) { let p = e.parentElement; while (p && !p.hasAttribute('data-fs')) p = p.parentElement; return p && p.tagName !== 'BODY' ? p : null; }

function rahmenLauf() {
  const d = S.doc;
  const setze = (box, e, luft) => {
    if (!e || !e.isConnected) { box.style.display = 'none'; return; }
    const r = e.getBoundingClientRect();
    if (!r.width && !r.height) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.style.transform = `translate(${r.left - luft}px,${r.top - luft}px)`;
    box.style.width = (r.width + luft * 2) + 'px'; box.style.height = (r.height + luft * 2) + 'px';
    box.style.left = '0'; box.style.top = '0';
  };
  const lauf = () => {
    if (S.doc !== d || !S.boxW) return;
    setze(S.boxW, S.wahl, S.edit === S.wahl && S.wahl ? 6 : 0);
    S.boxW.classList.toggle('fsb-box--schreibt', !!(S.edit && S.edit === S.wahl));
    setze(S.boxH, S.hover && S.hover !== S.wahl ? S.hover : null, 0);
    requestAnimationFrame(lauf);
  };
  requestAnimationFrame(lauf);
}

// ---------------------------------------------------------------- Zeigen und wählen in der Seite
let hoverPlan = 0;
function schweben(ev) {
  if (hoverPlan) return;
  const x = ev.clientX, y = ev.clientY;
  hoverPlan = requestAnimationFrame(() => { hoverPlan = 0; const st = stapelBei(x, y); hover(bevorzugt(st, x, y)); });
}
function hover(e) {
  if (S.hover === e) return;
  if (S.hover) S.hover.removeAttribute('data-fsb-hover');
  S.hover = e;
  if (!e || e === S.edit) { schildZu(); return; }
  if (e !== S.wahl) e.setAttribute('data-fsb-hover', '');
  schildZeigen(e, e === S.wahl ? (istText(e) ? 'Klicken und schreiben' : 'Nochmal klicken: das Drumherum') : (istText(e) ? 'Klicken und schreiben' : 'Klicken zum Einstellen'));
}
function schildZeigen(e, zusatz) {
  if (!S.schild) return;
  const r = e.getBoundingClientRect(), w = S.win.innerWidth;
  S.schild.innerHTML = '<b>' + WO.esc(name(e)) + '</b>' + (abschnittName(e) && abschnitt(e) !== e ? ' · ' + WO.esc(abschnittName(e)) : '') + (zusatz ? ' <i>· ' + WO.esc(zusatz) + '</i>' : '');
  const top = r.top > 34 ? r.top - 30 : Math.min(r.bottom + 6, S.win.innerHeight - 30);
  S.schild.style.top = Math.max(4, top) + 'px';
  S.schild.style.left = Math.max(6, Math.min(r.left, w - S.schild.offsetWidth - 6)) + 'px';
  S.schild.style.opacity = '1';
}
function schildZu() { if (S.schild) S.schild.style.opacity = '0'; }
function klick(ev) {
  ev.preventDefault(); ev.stopPropagation();   // Links und Knöpfe der Seite tun im Bearbeiten nichts
  if (S.edit && S.edit.contains(ev.target)) return;   // Klick in den Text, den man gerade schreibt: setzt nur den Cursor
  const st = stapelBei(ev.clientX, ev.clientY);
  let z = bevorzugt(st, ev.clientX, ev.clientY);
  if (z && S.wahl === z && !istText(z)) z = eltern(z) || z;   // zweiter Klick: das Drumherum
  S.stapel = st;
  waehle(z, { punkt: [ev.clientX, ev.clientY] });
}
function waehle(e, opt = {}) {
  if (S.edit && S.edit !== e) textFertig(true);
  if (S.wahl) S.wahl.removeAttribute('data-fsb-wahl');
  S.wahl = e || null;
  if (S.hover) { S.hover.removeAttribute('data-fsb-hover'); S.hover = null; }
  schildZu();
  if (e) {
    e.setAttribute('data-fsb-wahl', '');
    if (!opt.ohneText && istText(e) && S.edit !== e) textBeginn(e, opt.punkt);
  }
  inspektor();
}
function zeige(id, seite_) {
  if (seite_ && seite_ !== S.seite) { B.geh('b:' + seite_).then(() => { S.halten = { y: 0, id }; }); return; }
  const e = S.doc && S.doc.querySelector(`[data-fs="${id}"]`);
  if (!e) { melde('Diese Stelle ist gerade nicht zu sehen', { mehr: 'Sie ist ausgeblendet oder entsteht erst beim Laden der Seite.' }); return; }
  e.scrollIntoView({ block: 'center', behavior: 'smooth' });
  waehle(e, { ohneText: true });
  e.setAttribute('data-fsb-blitz', ''); setTimeout(() => e.removeAttribute('data-fsb-blitz'), 1300);
}

// ---------------------------------------------------------------- Text direkt in der Seite schreiben
function textBeginn(e, punkt) {
  const q = qEl(e); if (!q) return;
  if (normal(e.innerHTML) !== normal(q.innerHTML)) e.innerHTML = q.innerHTML;   // was ein Skript beim Laden umgebaut hat, gilt nicht als Text
  e.setAttribute('contenteditable', 'true'); e.setAttribute('spellcheck', 'true');
  S.edit = e; S.editStart = e.innerHTML;
  e.addEventListener('input', textTippen); e.addEventListener('paste', textEinfuegen); e.addEventListener('blur', textBlur);
  e.focus({ preventScroll: true });
  const d = S.doc, sel = d.getSelection();
  if (punkt && d.caretRangeFromPoint) { const r = d.caretRangeFromPoint(punkt[0], punkt[1]); if (r && e.contains(r.startContainer)) { sel.removeAllRanges(); sel.addRange(r); return; } }
  const r = d.createRange(); r.selectNodeContents(e); r.collapse(false); sel.removeAllRanges(); sel.addRange(r);
}
function textTippen() {
  const e = S.edit; if (!e) return;
  try { localStorage.setItem('fsb-tipp:' + S.seite + ':' + e.getAttribute('data-fs'), e.innerHTML); } catch (x) { /* ohne Speicher */ }
  clearTimeout(S.tipp); S.tipp = setTimeout(() => textSichern(), 1600);   // kurze Pause beim Schreiben: gesichert
  status(S.status === 'fehler' ? 'fehler' : 'ruhig');
  const p = $('#fsb-pille'); if (p && S.status !== 'fehler') { p.textContent = 'Schreibt …'; p.setAttribute('data-lage', 'laeuft'); }
}
function textEinfuegen(ev) {
  ev.preventDefault();   // eingefügt wird nur Text, nie fremde Gestaltung
  const t = (ev.clipboardData || window.clipboardData).getData('text/plain');
  S.doc.execCommand('insertText', false, t.replace(/\s*\n\s*/g, ' '));
}
function textBlur() { setTimeout(() => { if (S.edit && S.doc && S.doc.activeElement !== S.edit) textSichern(); }, 0); }
function textSichern() {
  clearTimeout(S.tipp);
  const e = S.edit; if (!e) return Promise.resolve();
  const jetzt = e.innerHTML;
  if (normal(jetzt) === normal(S.editStart)) { try { localStorage.removeItem('fsb-tipp:' + S.seite + ':' + e.getAttribute('data-fs')); } catch (x) { /* */ } status(S.warte.length ? 'fehler' : 'ruhig'); return Promise.resolve(); }
  if (!e.textContent.trim()) { melde('Ein Text darf nicht leer sein', { mehr: 'Blende die Stelle rechts unter «Anordnung» aus, wenn sie wegsoll.', stichwort: 'leer' }); e.innerHTML = S.editStart; return Promise.resolve(); }
  S.editStart = jetzt;
  const id = e.getAttribute('data-fs');
  return sichere({ op: 'text', seite: S.seite, id, html: jetzt, wo: ortName(e), was: 'Text geändert' })
    .then(() => { try { localStorage.removeItem('fsb-tipp:' + S.seite + ':' + id); } catch (x) { /* */ } if (S.wahl === e) inspektor(); })
    .catch(() => {});
}
function textFertig(sichern) {
  const e = S.edit; if (!e) return;
  if (sichern) textSichern(); else { e.innerHTML = S.editStart; try { localStorage.removeItem('fsb-tipp:' + S.seite + ':' + e.getAttribute('data-fs')); } catch (x) { /* */ } }
  e.removeAttribute('contenteditable'); e.removeAttribute('spellcheck');
  e.removeEventListener('input', textTippen); e.removeEventListener('paste', textEinfuegen); e.removeEventListener('blur', textBlur);
  S.edit = null;
  status(S.warte.length ? 'fehler' : S.offen ? 'laeuft' : 'ruhig');
}
function tasten(ev) {
  const z = (ev.metaKey || ev.ctrlKey);
  if (S.edit) {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); textFertig(true); inspektor(); return; }
    if (ev.key === 'Enter' && ev.shiftKey) { ev.preventDefault(); S.doc.execCommand('insertLineBreak'); return; }
    if (ev.key === 'Escape') { ev.preventDefault(); textFertig(false); inspektor(); return; }
    if (z && ev.key.toLowerCase() === 's') { ev.preventDefault(); textSichern(); return; }
    return;
  }
  if (ev.key === 'Escape') { ev.preventDefault(); if (S.wahl) waehle(null); return; }
  if (z && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); rueckLetzte(); return; }
  if (ev.key === 'ArrowUp' && ev.altKey && S.wahl) { ev.preventDefault(); const p = eltern(S.wahl); if (p) waehle(p, { ohneText: true }); }
}
document.addEventListener('keydown', ev => {   // dieselben Tasten, wenn der Fokus im Werkzeug statt in der Seite liegt
  if (!B.Z.ansicht.startsWith('b:') || /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.isContentEditable || $('#ws-fenster').childElementCount) return;
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); rueckLetzte(); }
  if (ev.key === 'Escape' && S.wahl) waehle(null);
});

// ---------------------------------------------------------------- Rechts: die Einstellungen der gewählten Stelle
function gruppe(titel, ...inhalt) { return el('section', { class: 'fsb-gr', 'data-fsb-gruppe': titel }, el('h3', { class: 'fsb-gr__t' }, titel), ...inhalt.flat().filter(Boolean)); }
function zeile(label, ...rechts) { return el('div', { class: 'fsb-z' }, el('span', { class: 'fsb-z__l' }, label), el('div', { class: 'fsb-z__r' }, ...rechts.filter(Boolean))); }
function inspektor() {
  const k = $('#fsb-insp'); if (!k) return;
  const oben = k.scrollTop;
  B.leer(k);
  if (!S.wahl) { k.append(...seiteUebersicht()); return; }
  const e = S.wahl, q = qEl(e), cs = S.win.getComputedStyle(e);
  const pfad = []; let p = e; while (p && pfad.length < 5) { pfad.unshift(p); p = eltern(p); }
  k.append(el('div', { class: 'fsb-insp__kopf' },
    el('div', { class: 'fsb-pfad' }, pfad.map((x, i) => el('button', { type: 'button', class: x === e ? 'an' : '', onclick: () => waehle(x, { ohneText: x !== e }) }, name(x) + (i < pfad.length - 1 ? '' : '')))),
    el('h2', {}, name(e)), abschnittName(e) && abschnitt(e) !== e ? el('p', { class: 'fsb-insp__ort' }, 'im Abschnitt «' + abschnittName(e) + '»') : null,
    el('div', { class: 'fsb-insp__kn' },
      eltern(e) ? taste('Drumherum wählen', () => waehle(eltern(e), { ohneText: true })) : null,
      taste('Fertig', () => waehle(null)))));
  if (S.stapel.length > 1 && S.stapel.includes(e)) {
    k.append(el('div', { class: 'fsb-stapel' }, mono('An dieser Stelle liegen auch'), el('div', {}, S.stapel.filter(x => x !== e).slice(0, 5).map(x => taste(name(x), () => waehle(x, { ohneText: !istText(x) }))))));
  }
  if (!q) {
    k.append(gruppe('Nicht bearbeitbar', el('p', { class: 'fsb-satz' }, 'Diese Stelle entsteht erst beim Laden aus dem Code der Seite (zum Beispiel der Fuss oder bewegte Teile). Hier lässt sie sich nicht ändern. Schreib einen Wunsch, Robert baut es um.'),
      taste('Wunsch zu dieser Stelle', () => wunsch(e))));
    return;
  }
  if (istText(e)) {
    k.append(gruppe('Text', el('p', { class: 'fsb-satz' }, S.edit === e ? 'Du schreibst direkt in der Seite. Enter sichert, Shift und Enter macht eine neue Zeile, Esc verwirft, was noch nicht gesichert ist.' : 'Klick in den Text und schreib. Er wird beim Schreiben gesichert.'),
      S.edit !== e ? taste('Text schreiben', () => { textBeginn(e); inspektor(); }) : null));
  }
  if (e.tagName === 'IMG') k.append(fotoGruppe(e, q));
  const a = e.tagName === 'A' ? e : (e.closest('a[data-fs]'));
  if (a && qEl(a)) k.append(linkGruppe(a));
  if (istText(e) || /^(LI|A|BUTTON|FIGCAPTION|BLOCKQUOTE)$/.test(e.tagName) && e.textContent.trim()) k.append(schriftGruppe(e, cs));
  k.append(platzGruppe(e, cs), anordnung(e));
  const hier = S.lage.aenderungen.filter(x => x.seite === S.seite && (x.ziel === e.getAttribute('data-fs') || x.id === e.getAttribute('data-fs')));
  if (hier.length) k.append(gruppe('Änderungen an dieser Stelle', hier.slice().reverse().map(x => aenderungZeile(x, true))));
  k.append(el('div', { class: 'fsb-insp__fuss' }, link('Wunsch zu dieser Stelle schreiben', () => wunsch(e))));
  k.scrollTop = oben;
}
function seiteUebersicht() {
  const l = S.lage.aenderungen.filter(a => a.seite === S.seite);
  const aus = S.quelle ? [...S.quelle.querySelectorAll('[data-fs-aus]')] : [];
  return [el('div', { class: 'fsb-insp__kopf' }, mono('Bearbeiten · ' + seiteName(S.seite)), el('h2', {}, 'Klick auf eine Stelle der Seite.'),
      el('div', { class: 'fsb-tipps' },
        tipp('Text', 'Anklicken und schreiben. Gesichert wird beim Schreiben.'),
        tipp('Foto', 'Anklicken, rechts tauschen oder den Ausschnitt setzen.'),
        tipp('Abschnitt', 'Ein zweiter Klick wählt das Drumherum: Abstände, Reihenfolge, ausblenden.'))),
    gruppe('Änderungen auf dieser Seite', l.length ? l.slice().reverse().map(a => aenderungZeile(a)) : el('p', { class: 'fsb-satz' }, 'Noch keine. Was du änderst, steht hier, mit vorher und nachher.')),
    aus.length ? gruppe('Ausgeblendet', aus.map(q => { const id = q.getAttribute('data-fs'); return el('div', { class: 'fsb-ae' }, el('span', {}, kurz(q.textContent, 60) || q.tagName.toLowerCase()), taste('Wieder zeigen', () => sichere({ op: 'ein', seite: S.seite, id, was: 'Wieder gezeigt', wo: kurz(q.textContent, 40) }).then(neuLaden).catch(() => {}))); })) : null,
    el('div', { class: 'fsb-insp__fuss' }, link('Wünsche zu dieser Seite', () => B.geh('wuensche')), link('Neuer Wunsch', () => B.neuerWunsch(S.seite)))].filter(Boolean);
}
function tipp(t, s) { return el('div', { class: 'fsb-tipp' }, el('b', {}, t), el('span', {}, s)); }
function aenderungZeile(a, kurzForm) {
  const text = a.art === 'text' ? el('span', {}, el('s', {}, kurz(a.alt, 60)), ' → ', el('b', {}, kurz(a.neu, 60))) : el('span', {}, a.was || a.art);
  return el('div', { class: 'fsb-ae', 'data-fsb-nr': a.nr },
    el('div', { class: 'fsb-ae__t' }, kurzForm ? null : mono((a.wo || seiteName(a.seite)) + ' · ' + a.wer + ', ' + zeit(a.zeit).split(', ')[1]), text),
    el('div', { class: 'fsb-ae__kn' }, !kurzForm && B.Z.ansicht === 'b:' + a.seite ? taste('Zeigen', () => zeige(a.id)) : null,
      !kurzForm && B.Z.ansicht !== 'b:' + a.seite ? taste('Auf der Seite', () => zeige(a.id, a.seite)) : null,
      taste('Zurücknehmen', () => zuruecknehmen(a.nr))));
}

function regler(label, min, max, schritt, wert, einheit, beiInput, beiFertig, zurueck) {
  const anz = el('output', { class: 'fsb-wert' }, formatiere(wert, einheit));
  const r = el('input', { type: 'range', min, max, step: schritt, value: wert, 'aria-label': label });
  r.addEventListener('input', () => { anz.textContent = formatiere(+r.value, einheit); beiInput(+r.value); });
  r.addEventListener('change', () => beiFertig(+r.value));
  const minus = el('button', { type: 'button', class: 'fsb-pm', 'aria-label': label + ' kleiner', onclick: () => { r.value = Math.max(min, +r.value - schritt * (einheit === '%' ? 5 : 2)); r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); } }, '−');
  const plus = el('button', { type: 'button', class: 'fsb-pm', 'aria-label': label + ' grösser', onclick: () => { r.value = Math.min(max, +r.value + schritt * (einheit === '%' ? 5 : 2)); r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change')); } }, '+');
  return zeile(label, el('div', { class: 'fsb-regler' }, minus, r, plus, anz), zurueck ? el('button', { type: 'button', class: 'fsb-zurueck', title: 'Wie gebaut', 'aria-label': label + ' wie gebaut', onclick: zurueck, html: WO.ic('zurueck') }) : null);
}
function formatiere(v, e) { return e === '%' ? Math.round(v) + ' %' : e === 'px' ? Math.round(v) + ' px' : e === 'em' ? (v >= 0 ? '' : '−') + Math.abs(v).toFixed(2) : (+v).toFixed(2); }
function stil(e, props, was, wert) {
  Object.entries(props).forEach(([k, v]) => { if (v) e.style.setProperty(k, v); else e.style.removeProperty(k); });
  return sichere({ op: 'stil', seite: S.seite, id: e.getAttribute('data-fs'), stil: props, wo: ortName(e), was, neu_wert: wert || '' }).catch(() => {});
}
const eigen = (e, prop) => { const q = qEl(e); return q ? (q.style.getPropertyValue(prop) || '') : ''; };

function schriftGruppe(e, cs) {
  const fs = parseFloat(cs.fontSize) || 16;
  const zoom = parseFloat(eigen(e, 'zoom')) || 1;
  const lh = cs.lineHeight === 'normal' ? 1.2 : parseFloat(cs.lineHeight) / fs;
  const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / fs;
  const fam = Object.entries(S.lage.schriften).find(([, v]) => eigen(e, 'font-family').replace(/"/g, "'") === v);
  const optionen = [{ wert: '', text: 'Wie gebaut' }].concat(Object.keys(S.lage.schriften).map(k => ({ wert: k, text: SCHRIFT_NAME[k] || k })));
  const farbe = eigen(e, 'color');
  return gruppe('Schrift',
    zeile('Schriftart', auswahl(optionen, fam ? fam[0] : '', k => stil(e, { 'font-family': k ? S.lage.schriften[k] : '' }, 'Schriftart', k ? SCHRIFT_NAME[k] : 'wie gebaut'), 'Schriftart')),
    regler('Grösse', 40, 250, 1, Math.round(zoom * 100), '%', v => e.style.setProperty('zoom', v / 100), v => stil(e, { zoom: v === 100 ? '' : String(v / 100) }, 'Grösse', v + ' %'),
      eigen(e, 'zoom') ? () => stil(e, { zoom: '' }, 'Grösse', 'wie gebaut').then(inspektor) : null),
    zeile('Stärke', wahl2([{ wert: '300', text: 'Leicht' }, { wert: '400', text: 'Normal' }, { wert: '500', text: 'Mittel' }, { wert: '700', text: 'Kräftig' }], eigen(e, 'font-weight') || '',
      v => stil(e, { 'font-weight': v }, 'Stärke', v), 'Stärke', true)),
    regler('Zeilenabstand', 0.8, 2.6, 0.02, +lh.toFixed(2), '', v => e.style.setProperty('line-height', v), v => stil(e, { 'line-height': String(+v.toFixed(2)) }, 'Zeilenabstand', v.toFixed(2)),
      eigen(e, 'line-height') ? () => stil(e, { 'line-height': '' }, 'Zeilenabstand', 'wie gebaut').then(inspektor) : null),
    regler('Buchstaben', -0.1, 0.4, 0.005, +ls.toFixed(3), 'em', v => e.style.setProperty('letter-spacing', v + 'em'), v => stil(e, { 'letter-spacing': (+v.toFixed(3)) + 'em' }, 'Buchstabenabstand', v.toFixed(3)),
      eigen(e, 'letter-spacing') ? () => stil(e, { 'letter-spacing': '' }, 'Buchstabenabstand', 'wie gebaut').then(inspektor) : null),
    zeile('Ausrichtung', wahl2([{ wert: 'left', text: 'Links' }, { wert: 'center', text: 'Mitte' }, { wert: 'right', text: 'Rechts' }], eigen(e, 'text-align') || '',
      v => stil(e, { 'text-align': v }, 'Ausrichtung', { left: 'links', center: 'Mitte', right: 'rechts' }[v]), 'Ausrichtung', true)),
    zeile('Schreibweise', wahl2([{ wert: 'none', text: 'Normal' }, { wert: 'uppercase', text: 'GROSS' }], eigen(e, 'text-transform') || '',
      v => stil(e, { 'text-transform': v }, 'Schreibweise', v === 'uppercase' ? 'gross' : 'normal'), 'Schreibweise', true),
      eigen(e, 'text-transform') || eigen(e, 'font-weight') || eigen(e, 'text-align') ? el('button', { type: 'button', class: 'fsb-zurueck', title: 'Stärke, Ausrichtung, Schreibweise wie gebaut', 'aria-label': 'Stärke, Ausrichtung und Schreibweise wie gebaut',
        onclick: () => stil(e, { 'font-weight': '', 'text-align': '', 'text-transform': '' }, 'Schrift wie gebaut', '').then(inspektor), html: WO.ic('zurueck') }) : null),
    zeile('Farbe', el('div', { class: 'fsb-farben', role: 'group', 'aria-label': 'Farbe aus der Marke' },
      el('button', { type: 'button', class: 'fsb-farbe fsb-farbe--wie' + (farbe ? '' : ' an'), title: 'Wie gebaut', 'aria-label': 'Farbe wie gebaut', onclick: () => stil(e, { color: '' }, 'Farbe', 'wie gebaut').then(inspektor) }, 'A'),
      FARBEN.map(([n, h]) => el('button', { type: 'button', class: 'fsb-farbe' + (farbe.toLowerCase() === h ? ' an' : ''), style: '--f:' + h, title: n, 'aria-label': 'Farbe ' + n,
        onclick: () => stil(e, { color: h }, 'Farbe', n).then(inspektor) })))));
}

function platzGruppe(e, cs) {
  const block = /^(SECTION|HEADER|FOOTER|NAV|MAIN)$/.test(e.tagName) || parseFloat(cs.paddingTop) > 12;
  const art = block ? 'padding' : 'margin';
  const oben = parseFloat(cs[art + 'Top']) || 0, unten = parseFloat(cs[art + 'Bottom']) || 0;
  const breit = v => v <= 0 ? '0' : `clamp(${Math.round(v * 0.45)}px, ${(v / 14.4).toFixed(2)}vw, ${Math.round(v)}px)`;   // bei 1440 genau so, auf dem Handy anteilig kleiner
  const max = Math.max(240, Math.round(Math.max(oben, unten) * 1.6 / 10) * 10);
  return gruppe('Platz',
    el('p', { class: 'fsb-satz fsb-satz--klein' }, block ? 'Luft innen, über und unter dem Inhalt.' : 'Abstand zum Nachbarn darüber und darunter.'),
    regler('Oben', 0, max, 1, Math.round(oben), 'px', v => e.style.setProperty(art + '-top', breit(v)), v => stil(e, { [art + '-top']: breit(v) }, 'Abstand oben', Math.round(v) + ' px'),
      eigen(e, art + '-top') ? () => stil(e, { [art + '-top']: '' }, 'Abstand oben', 'wie gebaut').then(inspektor) : null),
    regler('Unten', 0, max, 1, Math.round(unten), 'px', v => e.style.setProperty(art + '-bottom', breit(v)), v => stil(e, { [art + '-bottom']: breit(v) }, 'Abstand unten', Math.round(v) + ' px'),
      eigen(e, art + '-bottom') ? () => stil(e, { [art + '-bottom']: '' }, 'Abstand unten', 'wie gebaut').then(inspektor) : null));
}

function anordnung(e) {
  const id = e.getAttribute('data-fs'), q = qEl(e), p = q && q.parentElement;
  const geschw = p ? [...p.children].filter(x => x.hasAttribute('data-fs')) : [];
  const i = geschw.indexOf(q);
  const schieb = r => {
    sichere({ op: 'schieben', seite: S.seite, id, richtung: r, wo: ortName(e), was: r < 0 ? 'Nach oben geschoben' : 'Nach unten geschoben' }).then(() => {
      const n = S.doc.querySelector(`[data-fs="${geschw[i + r].getAttribute('data-fs')}"]`);
      if (n) { if (r < 0) n.before(e); else n.after(e); e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      inspektor();
    }).catch(() => {});
  };
  return gruppe('Anordnung',
    el('div', { class: 'fsb-reihe' },
      el('button', { type: 'button', class: 'fsb-kn', disabled: i <= 0, onclick: () => schieb(-1), html: WO.ic('hoch') + '<span>Nach oben</span>' }),
      el('button', { type: 'button', class: 'fsb-kn', disabled: i < 0 || i >= geschw.length - 1, onclick: () => schieb(1), html: '<span style="transform:rotate(180deg);display:inline-flex">' + WO.ic('hoch') + '</span><span>Nach unten</span>' }),
      el('button', { type: 'button', class: 'fsb-kn', onclick: () => {
        const wo = ortName(e);
        sichere({ op: 'aus', seite: S.seite, id, wo, was: 'Ausgeblendet' }).then(a => { e.style.display = 'none'; waehle(null); }).catch(() => {});
      }, html: WO.ic('aus') + '<span>Ausblenden</span>' })),
    el('p', { class: 'fsb-satz fsb-satz--klein' }, 'Ausblenden löscht nichts. Links unter «Ausgeblendet» holst du die Stelle zurück.'));
}

function linkGruppe(a) {
  const q = qEl(a), alt = q.getAttribute('href') || '';
  const f = el('input', { type: 'text', value: alt, class: 'fsb-feld', 'aria-label': 'Ziel des Links', spellcheck: 'false', autocomplete: 'off' });
  const hin = el('p', { class: 'fsb-satz fsb-satz--klein' }, 'Eine Seite der Website (team.html), eine Adresse mit https://, mailto: oder tel:.');
  const gut = v => /^(https:\/\/\S+|mailto:\S+@\S+|tel:\+?[\d ]+|#[\w-]*|[\w./-]+\.html(#[\w-]*)?)$/.test(v);
  const los = () => {
    const v = f.value.trim();
    if (v === alt) return;
    if (!gut(v)) { f.setAttribute('aria-invalid', 'true'); hin.textContent = 'So geht das Ziel nicht. Es beginnt mit https://, mailto: oder tel:, oder ist eine Seite wie team.html.'; return; }
    f.removeAttribute('aria-invalid');
    a.setAttribute('href', v);
    sichere({ op: 'link', seite: S.seite, id: a.getAttribute('data-fs'), href: v, wo: ortName(a), was: 'Ziel des Links', alt_wert: alt, neu_wert: v }).then(inspektor).catch(() => {});
  };
  f.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); los(); } });
  f.addEventListener('change', los);
  const seiten = el('div', { class: 'fsb-chips' }, S.lage.seiten.map(s => taste(s.name, () => { f.value = s.datei; los(); })));
  return gruppe(istKnopf(a) ? 'Knopf führt zu' : 'Link führt zu', f, hin, seiten);
}

function fotoGruppe(e, q) {
  const src = q.getAttribute('src') || '';
  const pos = (eigen(e, 'object-position') || S.win.getComputedStyle(e).objectPosition || '50% 50%').split(' ').map(v => parseFloat(v));
  const vorschau = el('div', { class: 'fsb-foto', title: 'Klicken oder ziehen: diese Stelle des Fotos bleibt immer zu sehen' },
    el('img', { src: ORT + 'ansicht/' + src, alt: '' }), el('i', { class: 'fsb-foto__punkt', style: `left:${pos[0] || 50}%;top:${pos[1] || 50}%` }));
  const punkt = $('.fsb-foto__punkt', vorschau);
  let zieht = false;
  const setze = (ev, fertig) => {
    const r = vorschau.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100))), y = Math.round(Math.max(0, Math.min(100, (ev.clientY - r.top) / r.height * 100)));
    punkt.style.left = x + '%'; punkt.style.top = y + '%';
    e.style.objectPosition = x + '% ' + y + '%';
    if (fertig) stil(e, { 'object-position': x + '% ' + y + '%' }, 'Ausschnitt des Fotos', x + ' % / ' + y + ' %');
  };
  vorschau.addEventListener('pointerdown', ev => { zieht = true; vorschau.setPointerCapture(ev.pointerId); setze(ev); });
  vorschau.addEventListener('pointermove', ev => { if (zieht) setze(ev); });
  vorschau.addEventListener('pointerup', ev => { if (zieht) { zieht = false; setze(ev, true); } });
  const alt = el('input', { type: 'text', class: 'fsb-feld', value: q.getAttribute('alt') || '', 'aria-label': 'Beschreibung des Fotos', placeholder: 'Was ist zu sehen? (für Google und Vorleseprogramme)' });
  alt.addEventListener('change', () => sichere({ op: 'alt', seite: S.seite, id: e.getAttribute('data-fs'), alt: alt.value, wo: ortName(e), was: 'Beschreibung des Fotos', neu_wert: alt.value }).catch(() => {}));
  const fit = S.win.getComputedStyle(e).objectFit;
  return gruppe('Foto', vorschau,
    el('p', { class: 'fsb-satz fsb-satz--klein' }, fit === 'cover' ? 'Klick ins Foto setzt den Punkt, der auf jeder Breite zu sehen bleibt.' : 'Das Foto wird ganz gezeigt; der Ausschnitt wirkt erst, wo es beschnitten wird.'),
    el('div', { class: 'fsb-reihe' }, kn('Foto tauschen', () => fotoWahl(e), 'kn--d kn--klein'), eigen(e, 'object-position') ? taste('Ausschnitt wie gebaut', () => stil(e, { 'object-position': '' }, 'Ausschnitt', 'wie gebaut').then(inspektor)) : null),
    zeile('Beschreibung', alt));
}

async function fotoWahl(e) {
  let fotos = [];
  const raster = el('div', { class: 'fsb-raster' }, mono('Fotos werden geladen …'));
  const suche = el('input', { type: 'search', class: 'fsb-feld', placeholder: 'Fotos der Website durchsuchen', 'aria-label': 'Fotos durchsuchen' });
  const datei = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', hidden: true });
  const lageHoch = el('p', { class: 'fsb-satz fsb-satz--klein' }, 'Eigenes Foto: mindestens 900 Pixel breit, höchstens 25 MB. Es wird für jede Bildschirmgrösse passend gespeichert.');
  let zu = null;
  const nimm = (src, srcset) => {
    zu && zu();
    const q = qEl(e);
    sichere({ op: 'bild', seite: S.seite, id: e.getAttribute('data-fs'), src, srcset: srcset || '', wo: ortName(e), was: 'Foto getauscht', alt_wert: q ? q.getAttribute('src') : '', neu_wert: src.split('/').pop() })
      .then(() => { e.removeAttribute('srcset'); e.removeAttribute('sizes'); if (srcset) { e.setAttribute('srcset', srcset); e.setAttribute('sizes', '100vw'); } e.src = src; e.style.removeProperty('object-position'); inspektor(); }).catch(() => {});
  };
  const zeichne = () => {
    const s = suche.value.trim().toLowerCase();
    const l = fotos.filter(f => !s || f.src.toLowerCase().includes(s)).slice(0, 240);
    B.leer(raster).append(...(l.length ? l.map(f => el('button', { type: 'button', class: 'fsb-raster__f', title: f.src, onclick: () => nimm(f.src) },
      el('img', { src: ORT + 'ansicht/' + f.src, alt: '', loading: 'lazy', decoding: 'async' }), el('span', {}, f.name.slice(0, 26) + ' · ' + f.w + ' px'))) : [el('p', { class: 'fsb-satz' }, 'Nichts gefunden.')]));
  };
  suche.addEventListener('input', zeichne);
  datei.addEventListener('change', async () => {
    const f = datei.files[0]; if (!f) return;
    if (f.size > 25 * 1024 * 1024) { lageHoch.textContent = 'Das Foto ist grösser als 25 MB. Nimm eine kleinere Fassung.'; return; }
    lageHoch.textContent = 'Wird hochgeladen und vorbereitet …';
    const daten = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
    try { const a = await ruf('POST', 'foto', { name: f.name, daten }); nimm(a.src, a.srcset); }
    catch (x) { lageHoch.textContent = x.fehler || 'Das Hochladen ging nicht.'; }
  });
  const inhalt = el('div', { class: 'ws-form fsb-fotowahl' },
    el('div', { class: 'fsb-reihe' }, suche, kn('Eigenes Foto hochladen', () => datei.click(), 'kn--klein'), datei), lageHoch, raster);
  inhalt.addEventListener('dragover', ev => { ev.preventDefault(); inhalt.classList.add('fsb-drauf'); });
  inhalt.addEventListener('dragleave', () => inhalt.classList.remove('fsb-drauf'));
  inhalt.addEventListener('drop', ev => { ev.preventDefault(); inhalt.classList.remove('fsb-drauf'); if (ev.dataTransfer.files[0]) { const dt = new DataTransfer(); dt.items.add(ev.dataTransfer.files[0]); datei.files = dt.files; datei.dispatchEvent(new Event('change')); } });
  zu = fenster('Foto', 'tauschen.', inhalt, [{ text: 'Abbrechen' }], { name: 'foto' });
  try { fotos = (await ruf('GET', 'fotos')).fotos; zeichne(); } catch (x) { B.leer(raster).append(el('p', { class: 'fsb-satz' }, x.fehler || 'Die Fotos liessen sich nicht laden.')); }
}

function wunsch(e) {
  const feld = el('textarea', { class: 'fsb-feld', rows: 4, 'aria-label': 'Wunsch', placeholder: 'Was soll an dieser Stelle anders werden?' });
  fenster('Ein Wunsch', 'zu dieser Stelle.', el('div', { class: 'ws-form' }, el('p', {}, ortName(e) + ' · ' + seiteName(S.seite)), feld), [
    { text: 'Abbrechen' },
    { text: 'Wunsch speichern', haupt: true, tun: async zu => {
      const t = feld.value.trim();
      if (!t) { melde('Der Wunsch ist leer', { mehr: 'Schreib in ein, zwei Sätzen, was anders werden soll.' }); return; }
      zu(); await B.sende([{ op: 'wunsch', w: { seite: S.seite, abschnitt: abschnittName(e), name: ortName(e), text: t } }], { titel: 'Wunsch gespeichert' });
    } }], { name: 'wunsch' });
}

// ---------------------------------------------------------------- Vorher, nachher: ein Schieber über der echten Seite
function vergleich(opt = {}) {
  ende();
  document.documentElement.classList.add('fsb-an');
  randZu(true);
  const l = S.lage.aenderungen, mit = [...new Set(l.map(a => a.seite))];
  const datei = opt.seite || (B.Z.vgl && B.Z.vgl.seite) || mit[0] || 'index.html';
  B.Z.vgl.seite = datei; S.seite = datei;
  const m = B.leer($('#ws-mitte'));
  const unten = el('iframe', { class: 'fsb-frame', title: 'Vorher: online', 'data-fsb-vgl': 'vorher' });
  const oben = el('iframe', { class: 'fsb-frame fsb-frame--oben', title: 'Nachher: Entwurf', 'data-fsb-vgl': 'nachher' });
  const griff = el('div', { class: 'fsb-griff', role: 'slider', tabindex: '0', 'aria-label': 'Vorher und nachher verschieben', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '50' }, el('i', { html: WO.ic('ziehen') }));
  const innen = el('div', { class: 'fsb-innen' }, unten, oben, griff, el('span', { class: 'fsb-vgl-l' }, 'Vorher · online'), el('span', { class: 'fsb-vgl-r' }, 'Nachher · Entwurf'));
  const rahmen = el('div', { class: 'fsb-rahmen fsb-rahmen--vgl', style: '--x:50%' }, innen);
  const optionen = S.lage.seiten.map(s => ({ wert: s.datei, text: s.name, zusatz: S.lage.je_seite[s.datei] ? String(S.lage.je_seite[s.datei]) : '' }));
  const kopf = el('div', { class: 'fsb-kopf' },
    el('div', { class: 'fsb-kopf__l' }, el('span', { class: 'fsb-mk' }, 'Vorher, nachher'), auswahl(optionen, datei, d => B.geh('vergleich', { seite: d }), 'Seite')),
    wahl2([{ wert: 'voll', text: 'Rechner' }, { wert: 'handy', text: 'Handy' }], S.breite, x => { S.breite = x; passe(); }, 'Breite', true),
    el('div', { class: 'fsb-kopf__r' }, rund('Zum Bearbeiten', 'stift', () => B.geh('b:' + datei))));
  const liste = l.filter(a => a.seite === datei);
  const insp = el('aside', { class: 'fsb-insp' }, el('div', { class: 'fsb-insp__kopf' }, mono('Entwurf · ' + seiteName(datei)), el('h2', {}, liste.length ? mz(liste.length, 'Änderung', 'Änderungen') + ' auf dieser Seite.' : 'Auf dieser Seite ist nichts geändert.')),
    liste.length ? gruppe('Im Entwurf', liste.slice().reverse().map(a => aenderungZeile(a))) : el('p', { class: 'fsb-satz' }, 'Beide Hälften zeigen dieselbe Seite. Sobald du etwas änderst, siehst du hier, was online steht und was neu ist.'),
    el('div', { class: 'fsb-tipps' },
      tipp('Schieber', 'In der Mitte über die Seite ziehen, mit den Pfeiltasten in kleinen Schritten.'),
      tipp('Scrollen', 'Beide Hälften laufen zusammen mit, egal in welcher du scrollst.'),
      tipp('Zurück', 'Jede Änderung einzeln zurücknehmen, oder alles verwerfen.')),
    el('div', { class: 'fsb-insp__fuss' }, l.length ? kn('Veröffentlichen', veroeffentlichen, 'kn--d kn--klein') : kn('Seite bearbeiten', () => B.geh('b:' + datei), 'kn--d kn--klein'), l.length ? link('Alles verwerfen', verwerfen) : null));
  m.append(el('div', { class: 'fsb', id: 'fsb' }, el('section', { class: 'fsb-buehne' }, kopf, rahmen), insp));
  S.vgl = rahmen;
  const setze = x => { x = Math.max(0, Math.min(100, x)); rahmen.style.setProperty('--x', x + '%'); griff.setAttribute('aria-valuenow', String(Math.round(x))); };
  let zieht = false;
  griff.addEventListener('pointerdown', ev => { zieht = true; griff.setPointerCapture(ev.pointerId); rahmen.classList.add('fsb-zieht'); });
  griff.addEventListener('pointermove', ev => { if (!zieht) return; const r = innen.getBoundingClientRect(); setze((ev.clientX - r.left) / r.width * 100); });
  griff.addEventListener('pointerup', () => { zieht = false; rahmen.classList.remove('fsb-zieht'); });
  griff.addEventListener('keydown', ev => { const x = parseFloat(rahmen.style.getPropertyValue('--x')); if (ev.key === 'ArrowLeft') setze(x - 5); if (ev.key === 'ArrowRight') setze(x + 5); });
  let gleich = false;
  const koppeln = (a, b) => { try { a.contentWindow.addEventListener('scroll', () => { if (gleich) return; gleich = true; b.contentWindow.scrollTo(0, a.contentWindow.scrollY); requestAnimationFrame(() => { gleich = false; }); }, { passive: true }); } catch (e) { /* */ } };
  let geladen = 0;
  const fertig = () => { if (++geladen < 2) return; koppeln(oben, unten); koppeln(unten, oben); [oben, unten].forEach(f => { try { f.contentWindow.document.addEventListener('click', ev => { ev.preventDefault(); }, true); } catch (e) { /* */ } }); };
  oben.addEventListener('load', fertig, { once: true }); unten.addEventListener('load', fertig, { once: true });
  unten.src = ORT + 'ansicht/' + datei + '?v=' + Date.now();
  oben.src = ORT + 'ansicht/' + datei + '?v=' + Date.now();
  requestAnimationFrame(passe);
}

// ---------------------------------------------------------------- Entwurf: alle Änderungen aller Seiten
function entwurf() {
  verlassen();
  const m = B.leer($('#ws-mitte')), l = S.lage.aenderungen;
  m.append(B.titel('Entwurf', 'Was noch', 'nicht online ist.', l.length ? mz(l.length, 'Änderung liegt', 'Änderungen liegen') + ' im Entwurf, gesichert, noch nicht auf der Website. Jede lässt sich einzeln zurücknehmen.' : 'Der Entwurf ist leer: Die Website zeigt alles, was geändert wurde.',
    l.length ? [kn('Veröffentlichen', veroeffentlichen, 'kn--d kn--klein'), taste('Vorher, nachher', () => B.geh('vergleich'))] : [kn('Seite bearbeiten', () => B.geh('b:index.html'), 'kn--klein')], B.foto('bildschirm')));
  const nach = new Map(); l.forEach(a => { if (!nach.has(a.seite)) nach.set(a.seite, []); nach.get(a.seite).push(a); });
  const ort = el('div', { class: 'fsb-entwurf' });
  [...nach.entries()].forEach(([s, liste]) => ort.append(el('section', { class: 'platte fsb-karte' }, el('div', { class: 'fsb-karte__k' }, el('h3', {}, seiteName(s)), mono(mz(liste.length, 'Änderung', 'Änderungen')), taste('Bearbeiten', () => B.geh('b:' + s))),
    liste.slice().reverse().map(a => aenderungZeile(a)))));
  if (l.length) ort.append(el('div', { class: 'fsb-entwurf__fuss' }, link('Alle Änderungen verwerfen', verwerfen)));
  m.append(ort);
  anstoss();
}
function verwerfen() {
  const n = S.lage.aenderungen.length;
  fenster('Den Entwurf', 'verwerfen?', el('div', { class: 'ws-form' }, el('p', {}, mz(n, 'Änderung geht', 'Änderungen gehen') + ' zurück auf den Stand, der online ist. Die Website selbst bleibt, wie sie ist.'),
    el('p', { class: 'fsb-satz fsb-satz--klein' }, 'Rückgängig geht danach noch einmal, in der Quittung unten.')), [
    { text: 'Abbrechen' },
    { text: 'Ja, verwerfen', haupt: true, tun: async zu => {
      zu();
      try {
        const a = await ruf('POST', 'verwerfen', {});
        await lageNeu();
        const k = quit('Verworfen', 'Der Entwurf ist wieder wie online.', [taste('Rückgängig', async () => { k.remove(); await ruf('POST', 'verwerfen', { rueck: a.sicherung }); await lageNeu(); B.zeichne({ halten: true }); melde('Zurückgeholt', { mehr: 'Der Entwurf ist wieder da.' }); })]);
        B.zeichne({ halten: true });
      } catch (e) { melde(e.fehler || 'Nicht verworfen', { fehler: true, stichwort: e.stichwort }); }
    } }], { name: 'verwerfen' });
}

// ---------------------------------------------------------------- Veröffentlichen: prüfen, hineinlegen, online nachsehen
function ladeVerdeckt(adresse, breite) {
  const f = el('iframe', { 'aria-hidden': 'true', tabindex: '-1', style: `position:fixed;left:-30000px;top:0;width:${breite}px;height:900px;border:0;visibility:hidden` });
  document.body.append(f);
  return new Promise(r => { let fertig = false; const los = () => { if (!fertig) { fertig = true; setTimeout(() => r(f), 900); } }; f.onload = los; f.src = adresse; setTimeout(los, 15000); });
}
const pfadVon = e => { const p = []; while (e && e.parentElement && e.tagName !== 'BODY') { p.unshift([...e.parentElement.children].indexOf(e)); e = e.parentElement; } return p; };
const perPfad = (d, p) => p.reduce((e, i) => e && e.children[i], d.body);
function probleme(e, w) {
  /* was an einer Stelle nicht passt: Text läuft über seine Fläche, Text ragt über den Bildschirm, Überschrift leer */
  const aus = new Set();
  if (!e) return aus;
  const cs = w.getComputedStyle(e);
  if (cs.display === 'none' || e.closest('[data-fs-aus]')) return aus;
  const r = e.getBoundingClientRect(); if (!r.width && !r.height) return aus;
  if (e.tagName === 'IMG') return aus;
  if (e.textContent.trim()) {
    if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 4 && !/auto|scroll/.test(cs.overflowX)) aus.add('ueber');
    if (r.right > w.innerWidth + 2 || r.left < -2) aus.add('rand');
  }
  if (/^H[1-4]$/.test(e.tagName) && !e.textContent.trim()) aus.add('leer');
  return aus;
}
const PROBLEM = { ueber: 'Text läuft über den Rand seiner Fläche', rand: 'Text ragt über den Bildschirmrand', leer: 'ist leer' };
async function pruefeSeite(datei, breite, ids) {
  /* geprüft wird der Entwurf gegen die Seite, wie sie online steht: es zählt nur, was durch die Änderung neu dazukommt */
  const t = Date.now();
  const [fe, fs] = await Promise.all([ladeVerdeckt(ORT + 'ansicht/' + datei + '?pruefung=' + t, breite), ladeVerdeckt(ORT + 'ansicht/' + datei + '?pruefung=' + t, breite)]);
  const funde = [];
  try {
    const we = fe.contentWindow, de = we.document, ws = fs.contentWindow, ds = ws.document;
    const ue = Math.round(de.documentElement.scrollWidth - we.innerWidth), us = Math.round(ds.documentElement.scrollWidth - ws.innerWidth);
    if (ue > 1 && ue > us + 1) funde.push({ text: 'Die Seite wird ' + ue + ' px breiter als der Bildschirm' });
    for (const id of ids) {
      const e = de.querySelector(`[data-fs="${id}"]`); if (!e) continue;
      const vorher = probleme(perPfad(ds, pfadVon(e)), ws);
      probleme(e, we).forEach(p => { if (!vorher.has(p)) funde.push({ id, text: name(e) + ': ' + PROBLEM[p] }); });
      if (e.tagName === 'IMG') {
        const ok = await new Promise(res => { const b = new Image(); b.onload = () => res(b.naturalWidth > 0); b.onerror = () => res(false); b.src = e.currentSrc || e.src; setTimeout(() => res(true), 8000); });
        if (!ok) funde.push({ id, text: 'Foto lädt nicht' });
      }
    }
  } catch (x) { funde.push({ text: 'Die Seite liess sich nicht prüfen' }); }
  fe.remove(); fs.remove();
  return funde;
}
async function veroeffentlichen() {
  if (S.edit) textFertig(true);
  await S.kette;
  if (S.status === 'fehler') { melde('Erst muss alles gesichert sein', { mehr: 'Die Verbindung zur Zentrale fehlt. Sobald sie steht, sichert das Werkzeug deine Eingaben, dann geht Veröffentlichen.', stichwort: 'keine-verbindung' }); return; }
  try { S.lage = await ruf('GET', 'lage'); } catch (e) { melde(e.fehler, { fehler: true, stichwort: e.stichwort }); return; }
  const l = S.lage.aenderungen, seiten = S.lage.geaendert;
  if (!seiten.length && !S.lage.neue_fotos.length) { melde('Nichts geändert, nichts veröffentlicht.'); return; }
  const notiz = el('input', { type: 'text', class: 'fsb-feld', placeholder: 'Wofür? (freiwillig, steht im Verlauf)', 'aria-label': 'Notiz zur Veröffentlichung', maxlength: '120' });
  const schritte = el('ol', { class: 'fsb-schritte', hidden: true });
  const probe = S.lage.ziel !== 'echt';
  const inhalt = el('div', { class: 'ws-form fsb-raus' },
    el('p', {}, mz(l.length, 'Änderung', 'Änderungen') + ' auf ' + (seiten.length === 1 ? seiteName(seiten[0]) : mz(seiten.length, 'Seite', 'Seiten') + ' (' + seiten.map(seiteName).join(', ') + ')') + ' gehen auf die Website.'),
    el('ul', { class: 'fsb-raus__l' }, l.slice(0, 8).map(a => el('li', {}, mono(seiteName(a.seite)), ' ', a.art === 'text' ? '«' + kurz(a.neu, 70) + '»' : (a.was || a.art) + (a.wo ? ' · ' + a.wo : ''))), l.length > 8 ? el('li', {}, '… und ' + (l.length - 8) + ' weitere') : null),
    probe ? el('p', { class: 'fsb-satz fsb-satz--klein fsb-probe' }, 'Probe-Betrieb: Veröffentlicht wird in eine Probe-Kopie der Website auf diesem Mac. Auf die echte Website schaltet Robert um.') : null,
    notiz, schritte);
  let zuMachen = null;
  const schritt = (text) => { const li = el('li', { 'data-lage': 'laeuft' }, el('i', {}), el('span', {}, text)); schritte.append(li); return { gut: t => { li.setAttribute('data-lage', 'gut'); if (t) li.lastChild.textContent = t; }, schlecht: t => { li.setAttribute('data-lage', 'schlecht'); if (t) li.lastChild.textContent = t; }, text: t => { li.lastChild.textContent = t; } }; };
  zuMachen = fenster('Veröffentlichen', 'auf die Website.', inhalt, [{ text: 'Abbrechen' }, { text: 'Prüfen und veröffentlichen', haupt: true, tun: async () => {
    const kn_ = $('.ws-fenster__kn'); if (kn_) kn_.hidden = true;
    schritte.hidden = false; notiz.disabled = true;
    // 1 Prüfen bei Rechner- und Handybreite (nur was neu dazukommt, zählt)
    const p = schritt('Prüfe die Seiten bei Rechner- und Handybreite …');
    const funde = [];
    p.text('Prüfe ' + seiten.map(seiteName).join(', ') + ' bei Rechner- und Handybreite …');
    await Promise.all(seiten.flatMap(s => {   // alle Seiten und beide Breiten gleichzeitig: ein paar Sekunden statt einer Kette
      const ids = [...new Set(l.filter(a => a.seite === s).flatMap(a => [a.id, a.ziel]))];
      return [1440, 390].map(b => pruefeSeite(s, b, ids).then(f => f.forEach(x => funde.push(Object.assign({ seite: s, breite: b }, x)))));
    }));
    if (funde.length) {
      p.schlecht(mz(funde.length, 'Stelle passt', 'Stellen passen') + ' noch nicht. Nichts veröffentlicht.');
      schritte.after(el('div', { class: 'fsb-funde' }, funde.slice(0, 12).map(x => el('div', { class: 'fsb-ae' }, el('div', { class: 'fsb-ae__t' }, mono(seiteName(x.seite) + ' · ' + (x.breite === 1440 ? 'Rechner' : 'Handy')), el('span', {}, x.text)),
        x.id ? taste('Zeigen', () => { zuMachen(); if (x.breite === 390) S.breite = 'handy'; zeige(x.id, x.seite); if (B.Z.ansicht === 'b:' + x.seite) passe(); }) : null)),
        el('div', { class: 'fsb-reihe' }, kn('Schliessen', () => zuMachen(), 'kn--klein'))));
      return;
    }
    p.gut('Geprüft: nichts läuft über den Rand, Fotos laden, keine Überschrift ist leer.');
    // 2 In die Website legen
    const h = schritt('Lege die Änderungen in die Website …');
    let e;
    try { e = await ruf('POST', 'veroeffentlichen', { notiz: notiz.value }); }
    catch (x) { h.schlecht(x.fehler || 'Nicht veröffentlicht. Die Website ist unverändert.'); schritte.after(el('div', { class: 'fsb-reihe' }, kn('Schliessen', () => zuMachen(), 'kn--klein'))); return; }
    h.gut('In die Website gelegt' + (probe ? ' (Probe-Kopie).' : '.'));
    await lageNeu();
    // 3 Nicht warten müssen (Robert 17.11.2026, nach 1:03 Warten: «inakzeptabel»): das Fenster schliesst, das Werkzeug sieht im Hintergrund nach und meldet sich
    B.allesNeu();
    if (B.Z.ansicht.startsWith('b:')) inspektor();
    setTimeout(() => { zuMachen(); if (!B.Z.ansicht.startsWith('b:')) B.zeichne({ halten: true }); }, 900);
    imHintergrund(e);
  } }], { name: 'veroeffentlichen' });
}
function imHintergrund(e) {
  /* GitHub baut die ganze Website nach jeder Änderung neu (gemessen 68 bis 75 s, unabhängig von der Grösse der Änderung). Weiterarbeiten geht sofort,
     die Leiste zeigt «Wird online gestellt», am Ende kommt «Online, geprüft» mit Link. */
  const probe = S.lage.ziel !== 'echt';
  S.unterwegs = { sha: e.sha, start: Date.now() }; leiste();
  const k = quit('Veröffentlicht', probe ? 'Die Probe-Website zeigt es gleich.' : 'GitHub stellt es in etwa einer Minute online. Du kannst weiterarbeiten, das Werkzeug meldet sich.', [], { 'data-fsb-unterwegs': e.sha });
  setTimeout(() => { if (k.isConnected) { k.style.transition = 'opacity .4s'; k.style.opacity = '0'; setTimeout(() => k.remove(), 420); } }, 7000);
  const uhrLauf = setInterval(() => { if (S.unterwegs) leiste(); else clearInterval(uhrLauf); }, 5000);
  onlineWarten(e.sha, () => {}).then(ok => {
    S.unterwegs = null; clearInterval(uhrLauf); leiste();
    if (ok) quit('Online, geprüft ' + uhr(new Date()), e.seiten.map(seiteName).join(', ') + ' zeigt jetzt den neuen Stand.', [el('a', { class: 'ws-taste', href: liveAdresse(e.seiten[0] || 'index.html'), target: '_blank', rel: 'noopener' }, 'Seite ansehen')]);
    else melde('Noch nicht online angekommen', { mehr: 'GitHub braucht länger als sonst. Das Werkzeug sieht im Verlauf weiter nach.', stichwort: 'hochladen' });
    if (B.Z.ansicht === 'verlauf') verlauf();
  });
}
async function onlineWarten(sha, zeigeZeit) {
  const t0 = Date.now(), probe = S.lage.ziel !== 'echt';
  while (Date.now() - t0 < 6 * 60 * 1000) {
    try { const r = await ruf('GET', 'online?sha=' + sha); if (r.online) { await lageNeu(); return true; } } catch (e) { /* weiter */ }
    const s = Math.round((Date.now() - t0) / 1000);
    zeigeZeit(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
    await warte(probe ? 1500 : 6000);
  }
  return false;
}

// ---------------------------------------------------------------- Verlauf: jede Veröffentlichung, zurückholbar
let verlaufUhr = null;
function verlauf() {
  verlassen();
  const m = B.leer($('#ws-mitte')), v = S.lage.verlauf;
  m.append(B.titel('Verlauf', 'Was online', 'gegangen ist.', 'Jede Veröffentlichung mit Bild, wer, wann und was. Ein früherer Stand kommt mit einem Klick zurück, als neue Veröffentlichung, nichts geht verloren.',
    [el('a', { class: 'wo-kn wo-kn--gold', href: liveAdresse('index.html'), target: '_blank', rel: 'noopener', html: '<span>Website ansehen</span><i>' + WO.ic('welt') + '</i>' })], B.foto('speicherstadt')));
  const ort = el('div', { class: 'fsb-verlauf' });
  if (!v.length) ort.append(el('div', { class: 'platte fsb-karte' }, el('p', { class: 'fsb-satz' }, 'Noch nichts veröffentlicht. Die erste Veröffentlichung steht hier mit Bild und allen Änderungen.')));
  v.forEach((e, i) => {
    const bild = e.bild ? el('img', { src: ORT + e.bild + '?v=' + e.sha.slice(0, 7), alt: '', loading: 'lazy' }) : el('img', { src: B.foto('plan'), alt: '', loading: 'lazy', class: 'fsb-verlauf__ersatz' });
    const lage = e.online ? el('span', { class: 'fsb-marke fsb-marke--gut' }, 'Online, geprüft ' + zeit(e.online).split(', ')[1]) : i === 0 ? el('span', { class: 'fsb-marke fsb-marke--warte', 'data-fsb-warte': e.sha }, 'Wird geprüft …') : null;
    ort.append(el('article', { class: 'platte fsb-v', 'data-fsb-sha': e.sha.slice(0, 7) },
      el('div', { class: 'fsb-v__b' }, bild),
      el('div', { class: 'fsb-v__t' },
        el('div', { class: 'fsb-v__k' }, mono(zeit(e.zeit) + ' · ' + e.wer + (e.ziel === 'echt' ? '' : ' · Probe')), lage, i === 0 ? el('span', { class: 'fsb-marke' }, 'Jetzt online') : null),
        el('h3', {}, e.titel),
        e.aenderungen.length ? el('details', {}, el('summary', {}, mz(e.aenderungen.length, 'Änderung', 'Änderungen') + ' · ' + e.seiten.map(seiteName).join(', ')),
          el('ul', {}, e.aenderungen.map(a => el('li', {}, mono(seiteName(a.seite)), ' ', a.art === 'text' ? el('span', {}, el('s', {}, kurz(a.alt, 60)), ' → ', kurz(a.neu, 60)) : (a.was || a.art) + (a.wo ? ' · ' + a.wo : ''))))) : el('p', { class: 'fsb-satz fsb-satz--klein' }, e.seiten.map(seiteName).join(', ')),
        el('div', { class: 'fsb-reihe' }, el('a', { class: 'ws-taste', href: liveAdresse(e.seiten[0] || 'index.html'), target: '_blank', rel: 'noopener' }, 'Seite ansehen'),
          i > 0 ? taste('Zurück zu diesem Stand', () => zurueckholen(e)) : null))));
  });
  m.append(ort);
  clearInterval(verlaufUhr);
  const offen = v.slice(0, 1).filter(e => !e.online);
  if (offen.length) verlaufUhr = setInterval(async () => {
    if (B.Z.ansicht !== 'verlauf') { clearInterval(verlaufUhr); return; }
    for (const e of offen) { try { const r = await ruf('GET', 'online?sha=' + e.sha); if (r.online) { await lageNeu(); if (B.Z.ansicht === 'verlauf') verlauf(); return; } } catch (x) { /* */ } }
  }, 6000);
  anstoss();
}
function zurueckholen(e) {
  fenster('Zurück zum Stand', 'vom ' + zeit(e.zeit) + '?', el('div', { class: 'ws-form' },
    el('p', {}, 'Die Website zeigt danach wieder, was ' + e.wer + ' am ' + zeit(e.zeit) + ' veröffentlicht hat: ' + e.seiten.map(seiteName).join(', ') + '.'),
    el('p', { class: 'fsb-satz fsb-satz--klein' }, 'Das ist selbst eine Veröffentlichung: Der heutige Stand bleibt im Verlauf und kommt genauso zurück.')), [
    { text: 'Abbrechen' },
    { text: 'Ja, zurückholen', haupt: true, tun: async zu => {
      zu();
      try {
        const n = await ruf('POST', 'zurueckholen', { sha: e.sha });
        await lageNeu(); B.zeichne({ halten: true });
        melde('Stand zurückgeholt', { mehr: 'Das Werkzeug sieht nach, bis er online ist.' });
        onlineWarten(n.sha, () => {}).then(ok => { if (B.Z.ansicht === 'verlauf') verlauf(); if (ok) melde('Online, geprüft ' + uhr(new Date()), { mehr: n.titel + '.' }); });
      } catch (x) { melde(x.fehler || 'Nicht zurückgeholt', { fehler: true, stichwort: x.stichwort }); }
    } }], { name: 'zurueckholen' });
}

// ---------------------------------------------------------------- Ziel und Prüfung
function ziel() {
  verlassen();
  const m = B.leer($('#ws-mitte')), echt = S.lage.ziel === 'echt';
  m.append(B.titel('Ziel', echt ? 'Veröffentlicht wird' : 'Probe-Betrieb:', echt ? 'auf die Website.' : 'alles auf diesem Mac.',
    echt ? 'Veröffentlichen legt die Seiten in die Website (GitHub, kostenlos). Nach etwa einer Minute sind sie online, das Werkzeug prüft es selbst.' :
      'Veröffentlichen legt die Seiten in eine Probe-Kopie der Website auf diesem Mac und prüft dort, ob sie ankommen. Alles funktioniert wie später online. Auf die echte Website schaltet Robert um.',
    [el('a', { class: 'wo-kn wo-kn--gold', href: liveAdresse('index.html'), target: '_blank', rel: 'noopener', html: '<span>' + (echt ? 'Website ansehen' : 'Probe-Website ansehen') + '</span><i>' + WO.ic('welt') + '</i>' })], B.foto('empfang')));
  m.append(el('div', { class: 'wo-lage' },
    el('div', { class: 'wo-lg' }, el('i', { class: 'wo-lg__z', html: WO.ic('stift') }), el('span', { class: 'wo-mk' }, 'Entwurf'), el('b', {}, S.lage.aenderungen.length ? mz(S.lage.aenderungen.length, 'Änderung', 'Änderungen') : 'Leer'), el('p', {}, 'Gesichert nach jeder Eingabe, noch nicht online.')),
    el('div', { class: 'wo-lg' }, el('i', { class: 'wo-lg__z', html: WO.ic('welt') }), el('span', { class: 'wo-mk' }, 'Ziel'), el('b', {}, echt ? 'Website (GitHub)' : 'Probe-Kopie'), el('p', {}, echt ? 'tastyrob123.github.io/tastystudios' : 'Auf diesem Mac, wie online.')),
    el('div', { class: 'wo-lg' }, el('i', { class: 'wo-lg__z', html: WO.ic('verlauf') }), el('span', { class: 'wo-mk' }, 'Verlauf'), el('b', {}, mz(S.lage.verlauf.length, 'Veröffentlichung', 'Veröffentlichungen')), el('p', {}, 'Jede kommt mit einem Klick zurück.'))));
  anstoss();
}

function anstoss() {   /* schweben.js markiert beim nächsten Neuzeichnen: so schweben auch Ansichten herein, die gezeichnet wurden, bevor es lief */
  requestAnimationFrame(() => { const m = $('#ws-mitte'); if (!m) return; const x = document.createElement('i'); x.hidden = true; m.append(x); requestAnimationFrame(() => x.remove()); });
}
window.FSB = { lade, lageNeu, leiste, seite, vergleich, entwurf, verlauf, ziel, verlassen, veroeffentlichen, offen: () => S.offen + S.warte.length + (S.edit && normal(S.edit.innerHTML) !== normal(S.editStart) ? 1 : 0),
  lage: () => S.lage, liveAdresse, jetzt: () => textSichern() };
})();
