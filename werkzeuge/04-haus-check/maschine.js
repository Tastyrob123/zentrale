/* Haus-Check als Kunden-Maschine (08.11.2026): Kundenblick im Check und der Reiter «Kunden finden».
   Lädt vor haus-check.js; nutzt dessen Helfer (S, esc, n, api, WO, finde …) erst beim Aufruf.
   Kundenblick: kundenblick.py über api.py (Bildmaterial, Text, Marke, Aussensicht, Bauweise und Partner, Aktualität, KI-Check, Potenzial 0–100).
   Kunden finden: kandidaten/kandidaten.json (kandidaten_bauen.py aus dem Kundenfinder von Robert) plus selbst gesehene Häuser.
   Ein Haus wandert: gefunden → geprüft (Haus-Check gespeichert) → in der Kundenliste (Werkzeug 02). */
'use strict';
const KAT = { familien: 'Schweizer Familien', luxus: 'Luxushotels', sterne: 'Sternegastronomie', eigene: 'Selbst gesehen' };
const KAT_KURZ = { familien: 'Familie', luxus: 'Luxushotel', sterne: 'Sterneküche', eigene: 'Selbst gesehen' };
const LAND = { CH: 'Schweiz', DE: 'Deutschland', AT: 'Österreich' };
const KB_WORT = { gruen: 'Grün', gelb: 'Gelb', rot: 'Rot', grau: 'Offen' };
const SORT = { potenzial: 'Potenzial', analyse: 'Analyse', name: 'Name' };
const LAPTOP = '/zentrale/zentrale/img/laptop.webp';

/* ---------- Aufnahme der Startseite im Blender-Laptop ---------- */
function geraet(o) {
  /* o: {datei (Aufnahme im Haus-Check), bild (Aufnahme aus dem Kundenfinder), name, zeile} */
  const schon = o.datei && AUFNAHMEN[o.datei];   /* vorab geladen (aufnahmenVorab): Bild steht sofort im Laptop, kein Nachladen */
  const innen = o.bild ? `<img src="${esc(o.bild)}" alt="Startseite von ${esc(o.name)}" decoding="async">`
    : schon ? `<img src="${schon}" alt="Startseite von ${esc(o.name)}" decoding="sync">`
    : `<span class="hc-geraet__name"><b>${esc(o.name)}</b><small>${esc(o.zeile || '')}</small></span>`;
  return `<figure class="hc-geraet"><span class="hc-geraet__schirm"${o.datei ? ` data-aufnahme="${esc(o.datei)}"` : ''}>${innen}</span>`
    + `<img class="hc-geraet__haus" src="${LAPTOP}" width="1600" height="1338" alt="" decoding="async"></figure>`;
}
const AUFNAHMEN = {};
/* Die Aufnahmen der zuletzt geprüften Häuser vor dem ersten Bild laden, damit Karten und Hausseite ihre Startseite sofort zeigen */
async function aufnahmenVorab(haeuser, wie_viele = 8) {
  const dateien = haeuser.slice(0, wie_viele).map(h => h.letzter && h.letzter.ergebnis.aufnahme).filter(d => d && !AUFNAHMEN[d]);
  await Promise.all(dateien.map(d => api('GET', 'aufnahme', { datei: d }).then(j => { AUFNAHMEN[d] = j.bild; }).catch(() => {})));
  await Promise.all(dateien.filter(d => AUFNAHMEN[d]).map(d => new Promise(ok => { const i = new Image(); i.onload = i.onerror = ok; i.src = AUFNAHMEN[d]; })));
}
function aufnahmenLaden(el) {
  $$('[data-aufnahme]', el).forEach(async s => {
    const datei = s.dataset.aufnahme; if (!datei) return;
    const setze = src => { s.innerHTML = `<img src="${src}" alt="Aufnahme der Startseite" decoding="async">`; };
    if (AUFNAHMEN[datei]) { setze(AUFNAHMEN[datei]); return; }
    try { const j = await api('GET', 'aufnahme', { datei }); AUFNAHMEN[datei] = j.bild; if (s.isConnected) setze(j.bild); }
    catch (e) { const sm = $('small', s); if (sm) sm.textContent = 'Aufnahme nicht mehr in der Ablage'; }
  });
}

/* ---------- Potenzial als grosse Zahl in einer Tafel ---------- */
function zahlBlatt(zahl, wort, satz, unter) {
  const w = wort || (zahl == null ? '' : zahl >= 60 ? 'hoch' : zahl >= 35 ? 'mittel' : 'gering');
  return `<div class="hc-zahlblatt hc-zahlblatt--${esc(w || 'offen')}"><span class="mono">Potenzial als Kunde</span>
    <b>${zahl == null ? '–' : n(zahl)}</b><small>${zahl == null ? 'noch nicht geprüft' : 'von 100 · ' + esc(w)}</small>${satz ? `<p>${esc(satz)}</p>` : ''}${unter ? `<em>${esc(unter)}</em>` : ''}</div>`;
}
function faktorenListe(f) {
  if (!(f || []).length) return '';
  return `<ol class="hc-faktoren">${f.map((x, i) => {
    const neg = x.punkte < 0, w = neg ? Math.min(1, -x.punkte / 20) : x.max ? x.punkte / x.max : 0;
    return `<li style="--i:${i}" class="${neg ? 'neg' : ''}"><span class="hc-faktoren__n"><b>${esc(x.name)}</b><small>${esc(x.satz)}</small></span>
      <span class="rang__b"><i style="--w:${Math.max(neg || x.punkte ? .03 : 0, w).toFixed(3)}"></i></span><em>${neg ? '−' + n(-x.punkte) : '+' + n(x.punkte)}${x.max ? `<small>/${n(x.max)}</small>` : ''}</em></li>`;
  }).join('')}</ol>`;
}

/* ---------- Kundenblick in der Karte eines Checks ---------- */
function kundenblickBlatt(e) {
  const kb = e.kundenblick;
  const name = (e.haus && e.haus.name) || hostVon(e.adresse);
  const laptop = geraet({ datei: e.aufnahme, name, zeile: e.probe ? 'Probehaus, erfunden: keine echte Seite zum Aufnehmen' : (e.aufnahme_fehler || 'Aufnahme wird geladen') });
  if (!kb) {
    return `<div class="hc-kb"><div class="hc-kb__oben">${laptop}${zahlBlatt(null, '', 'Dieser Check ist älter und hat noch keinen Kundenblick.', '«Neu prüfen» ergänzt ihn.')}</div></div>`;
  }
  const p = kb.potenzial, t = kb.teile;
  const band = `<div class="hc-ampelband" role="img" aria-label="${esc(t.map(x => x.name + ': ' + KB_WORT[x.ampel]).join(', '))}">${t.map(x => `<span class="hc-ampelband__s hc-a--${esc(x.ampel)}"><i></i><small>${esc(x.name)}</small></span>`).join('')}</div>`;
  const zeilen = t.map((x, i) => `<li style="--i:${i}" class="hc-a--${esc(x.ampel)}"><span class="hc-kbz__n"><i class="hc-kbz__p"></i><b>${esc(x.name)}</b><small>${esc(KB_WORT[x.ampel])}</small></span>
    <div><p>${esc(x.satz)}</p>${(x.belege || []).length ? `<details class="hc-mehr"><summary>Belege</summary><ul class="hc-hinweise">${x.belege.map(b => `<li>${esc(b)}</li>`).join('')}</ul></details>` : ''}</div></li>`).join('');
  const ansatz = (p.ansatz || []).length ? `<div class="hc-ansatz"><span class="mono">Wo wir ansetzen</span><ul>${p.ansatz.map(a => `<li class="hc-a--${esc(a.ampel)}"><i></i>${esc(a.satz)}</li>`).join('')}</ul></div>` : '';
  const b = kb.bauweise || {}, au = kb.aussen || {}, ki = kb.ki || {};
  const zeile = (dt, dd) => dd ? `<div><dt>${esc(dt)}</dt><dd>${dd}</dd></div>` : '';
  const bau = `<dl class="angaben hc-angaben">${zeile('System', esc((b.systeme || []).join(', ') || 'kein bekanntes System im Quelltext'))}
    ${zeile('Agentur', (b.agentur || []).length ? b.agentur.map(a => esc(a.name + (a.host && a.name.toLowerCase().indexOf(a.host) < 0 ? ' · ' + a.host : '') + ' (' + a.wo + ')')).join('<br>') : 'keine sichtbar')}
    ${zeile('Buchung', esc([b.buchung && b.buchung['eigene Buchungsstrecke'], b.buchung && b.buchung['Reservierungsdienst']].filter(Boolean).join(', ') || 'keine eigene Buchungsstrecke'))}
    ${zeile('Portale', esc((b.buchung && b.buchung['Portale verlinkt']) || 'keine verlinkt'))}
    ${zeile('Verbünde und Führer', esc((b.gruppen || []).map(g => g.name).join(', ') || 'keine genannt'))}
    ${zeile('Werkzeuge', esc((b.werkzeuge || []).join(', ') || 'keine erkannt'))}</dl>`;
  const aussen = `${(au.quellen || []).map(q => `<div class="hc-quelle"><b>${esc(q.name)}</b>${q.url ? ` <a class="link-i" href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.satz)}</a>` : `<small>${esc(q.satz)}</small>`}${(q.zeilen || []).length ? `<ul class="hc-hinweise">${q.zeilen.map(z => `<li>${esc(z)}</li>`).join('')}</ul>` : ''}</div>`).join('')}
    ${(au.offen || []).length ? `<ul class="hc-offen">${au.offen.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}`;
  const kiListe = (ki.bereiche || []).length ? `<ol class="hc-ki">${ki.bereiche.map(x => `<li class="hc-a--${esc(x.ampel)}"><i></i><b>${esc(x.titel)}</b><span>${esc(x.befund)}</span></li>`).join('')}</ol>` : '<p class="nichts">Der KI-Check ist nicht gelaufen.</p>';
  return `<div class="hc-kb">
    <div class="hc-kb__oben">${laptop}${zahlBlatt(p.zahl, p.wort, p.satz)}</div>
    <h3 class="wegtitel">Macht das Haus <em>für uns Sinn?</em></h3>
    ${band}
    <ol class="hc-kbz">${zeilen}</ol>
    <h3 class="wegtitel">Kleine <em>Potenzialanalyse</em></h3>
    ${faktorenListe(p.faktoren)}
    ${ansatz}
    <details class="hc-mehr hc-mehr--gross"><summary>Bauweise, Agentur und Partner</summary>${bau}</details>
    <details class="hc-mehr hc-mehr--gross"><summary>Was ausserhalb der Seite steht</summary>${aussen}</details>
    <details class="hc-mehr hc-mehr--gross"><summary>KI-Check im Einzelnen${ki.note ? ' · ' + n(ki.note.punkte) + ' von 100' : ''}</summary>${kiListe}</details>
  </div>`;
}

/* ---------- Kandidaten ---------- */
async function kandidatenLaden(neu) {
  if (S.kand && !neu) return S.kand;
  try { const j = await api('GET', 'kandidaten'); S.kand = (j.kandidaten || []).filter(k => !k.in_arbeit);   /* schon in Arbeit = schon bei den Kunden, gehört nicht mehr in «Kunden finden» (Robert 08.11.2026) */ S.kandStand = j.stand || {}; }
  catch (e) { S.kand = S.kand || []; }
  return S.kand;
}
const kandKennungen = k => [k.kennung].concat((k.haeuser || []).map(h => h.kennung));
function kandStand(k) {
  const hs = kandKennungen(k).map(finde).filter(Boolean).sort((a, b) => String(b.letzter.zeit).localeCompare(String(a.letzter.zeit)));
  return { haeuser: hs, haus: hs[0] || null, kundenliste: hs.find(h => h.kundenliste) || null };
}
function kandZahl(k) {
  const h = kandStand(k).haus, z = h && h.letzter.ergebnis.gesamt.potenzial_zahl;
  return z != null ? z : k.potenzial;
}
function kandStufe(k) { const st = kandStand(k); return st.kundenliste ? 2 : st.haus ? 1 : 0; }
const STUFE_WORT = ['Gefunden', 'Geprüft', 'In der Kundenliste'];
function kandGefiltert() {
  const f = S.f, q = f.suche.trim().toLowerCase();
  let l = (S.kand || []).filter(k => (f.kat === 'alle' || k.kategorie === f.kat) && (f.land === 'alle' || k.land === f.land)
    && (f.stand === 'alle' || (f.stand === 'offen' ? kandStufe(k) === 0 : f.stand === 'geprueft' ? kandStufe(k) === 1 : kandStufe(k) === 2))
    && (!q || [k.name, k.ort, k.web, k.wer, k.klasse, (k.haeuser || []).map(h => h.name).join(' ')].join(' ').toLowerCase().includes(q)));
  const z = k => { const x = kandZahl(k); return x == null ? -1 : x; };
  const analyse = k => kandStufe(k) * 1000 + (kandStand(k).haus ? 500 : k.hand && k.hand.fall ? 300 : k.hand ? 200 : 0) + z(k);
  if (f.sort === 'name') l.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  else if (f.sort === 'analyse') l.sort((a, b) => analyse(b) - analyse(a) || a.name.localeCompare(b.name, 'de'));
  else l.sort((a, b) => z(b) - z(a) || a.name.localeCompare(b.name, 'de'));
  return l;
}
function karteKand(k, aktiv) {
  const z = kandZahl(k), st = kandStufe(k), amp = z == null ? 'grau' : z >= 60 ? 'rot' : z >= 35 ? 'gelb' : 'gruen';
  const unter = [KAT_KURZ[k.kategorie], k.klasse, [k.ort, LAND[k.land]].filter(Boolean).join(', ')].filter(Boolean);
  return `<button class="besuch rg-a hc-kk${z >= 60 ? ' gold' : ''}${aktiv ? ' aktiv' : ''}" type="button" data-kand="${esc(k.id)}" aria-pressed="${aktiv}">
    <span class="besuch__b"><span class="sbild note-bild note--${amp}" aria-hidden="true"><b>${z == null ? '–' : n(z)}</b></span><span class="besuch__l">${esc(k.land || '–')}</span></span>
    <span class="besuch__n"><b>${esc(k.name)}</b><small><i class="besuch__r">${unter.map(x => `<i class="besuch__s">${esc(x)}</i>`).join('')}</i></small></span>
    <span class="besuch__z">${esc(STUFE_WORT[st])}<small>${k.in_arbeit ? 'schon in Arbeit' : k.hand ? (k.hand.fall ? 'von Hand: Fall' : 'von Hand angesehen') : k.kategorie === 'eigene' ? 'selbst gesehen' : 'nur Maschine'}</small></span></button>`;
}
function wegSchritte(k) {
  const st = kandStand(k), h = st.haus;
  const s = [
    ['Gefunden', k.kategorie === 'eigene' ? 'selbst eingetragen' : (k.hand ? 'von Hand angesehen ' + (k.hand.am || '') : 'von der Maschine vorgeschlagen'), true],
    ['Geprüft', h ? 'Haus-Check vom ' + datum(h.letzter.zeit) + (st.haeuser.length > 1 ? ' (' + n(st.haeuser.length) + ' Häuser)' : '') : 'noch nicht', !!h],
    ['In der Kundenliste', st.kundenliste ? 'gemeldet am ' + datum(st.kundenliste.kundenliste.zeit) : 'noch nicht', !!st.kundenliste]];
  return `<ol class="hc-schritte">${s.map(([t, u, an], i) => `<li class="${an ? 'an' : ''}" style="--i:${i}"><i>${i + 1}</i><b>${esc(t)}</b><small>${esc(u)}</small></li>`).join('')}</ol>`;
}
function detailKand(k) {
  if (!k) return `<div class="blatt hc-kand"><p class="nichts">In dieser Auswahl steht kein Haus. Filter lockern oder unten ein eigenes Haus eintragen.</p></div>`;
  const st = kandStand(k), h = st.haus, g = h && h.letzter.ergebnis.gesamt;
  const zahl = kandZahl(k);
  const unter = h ? 'aus dem Haus-Check vom ' + datum(h.letzter.zeit) : k.potenzial == null ? '' : 'vor dem Haus-Check, aus den Daten des Kundenfinders';
  const faktoren = h && h.letzter.ergebnis.kundenblick ? h.letzter.ergebnis.kundenblick.potenzial.faktoren : k.faktoren;
  const zeile = (dt, dd) => dd ? `<div><dt>${esc(dt)}</dt><dd>${dd}</dd></div>` : '';
  const haeuser = (k.haeuser || []).length > 1 ? `<h3 class="wegtitel">${n(k.haeuser.length)} Häuser <em>der Gruppe</em></h3><ol class="hc-gruppe">${k.haeuser.map(x => {
    const hx = finde(x.kennung);
    return `<li><span><b>${esc(x.name)}</b><small>${esc([x.ort, x.klasse, x.zimmer ? n(x.zimmer) + ' Zimmer' : '', x.preis ? 'Doppelzimmer ' + x.preis : ''].filter(Boolean).join(' · '))}</small>
      <a class="link-i" href="${esc(x.web)}" target="_blank" rel="noopener">${esc(hostVon(x.web))}</a>${x.alt ? '<em>Maschine: alt</em>' : ''}</span>
      ${hx ? `<button class="link" type="button" data-zum-haus="${esc(x.kennung)}">Check ansehen · ${hx.letzter.ergebnis.gesamt.potenzial_zahl != null ? n(hx.letzter.ergebnis.gesamt.potenzial_zahl) : POT[hx.letzter.ergebnis.gesamt.potential]}</button>`
        : `<button class="link" type="button" data-kand-pruef="${esc(k.id)}" data-web="${esc(x.web)}">Prüfen</button>`}</li>`;
  }).join('')}</ol>` : '';
  const taten = (h ? WO.knopf('Check ansehen', 'rechts', 'dunkel', { klein: true, attr: `data-zum-haus="${esc(h.kennung)}"` }) : WO.knopf('Haus prüfen', 'suche', 'dunkel', { klein: true, attr: `data-kand-pruef="${esc(k.id)}" data-web="${esc(k.web)}"` }))
    + (h && !st.kundenliste ? WO.knopf('In die Kundenliste', 'plus', 'gold', { klein: true, attr: `data-kl="${esc(h.kennung)}"` }) : '')
    + (h ? WO.knopf('Neu prüfen', 'verlauf', 'hell', { klein: true, attr: `data-kand-pruef="${esc(k.id)}" data-web="${esc(h.adresse || k.web)}"` }) : '')
    + (k.kategorie === 'eigene' ? `<button class="link" type="button" data-kand-weg="${esc(k.id)}">Aus «Selbst gesehen» entfernen</button>` : '');
  return `<article class="blatt besuchsblatt hc-kand">
    <div class="besuchsblatt__kopf"><div><span class="mono">${esc(KAT[k.kategorie] || '')}${k.land ? ' · ' + esc(LAND[k.land]) : ''}</span><h2>${esc(k.name)}</h2></div><span class="siegel">${esc(STUFE_WORT[kandStufe(k)])}</span></div>
    <div class="hc-kb__oben">${geraet({ bild: k.bild, name: k.name, zeile: k.bild ? '' : 'Noch keine Aufnahme: «Haus prüfen» nimmt die Startseite auf' })}${zahlBlatt(zahl, g ? g.potential : '', h ? g.urteil : '', unter)}</div>
    ${k.in_arbeit ? `<p class="hc-schon">Schon in Arbeit: ${esc(k.in_arbeit)}.</p>` : ''}
    <p class="hc-kand__satz">${esc(k.satz || '')}</p>
    ${wegSchritte(k)}
    <dl class="angaben">
      ${zeile('Klasse', esc(k.klasse || '–'))}${zeile('Zimmer', k.zimmer ? n(k.zimmer) : '')}
      ${zeile('Ort', esc([k.ort, LAND[k.land]].filter(Boolean).join(', ') || '–'))}
      ${zeile('Website', k.web ? `<a class="link-i" href="${esc(k.web)}" target="_blank" rel="noopener">${esc(hostVon(k.web))}</a>` : '')}
      ${zeile('Wer dahinter steht', esc(k.wer || ''))}
      ${zeile('Urteil von Hand', k.hand ? esc(k.hand.wort + (k.hand.am ? ', ' + k.hand.am : '')) : k.kategorie === 'eigene' ? '' : 'noch nicht angesehen')}
      ${zeile('Maschine', (k.maschine || {}).zeichen && k.maschine.zeichen.length ? esc(k.maschine.zeichen.slice(0, 3).join(', ')) : '')}
      ${k.gault ? zeile('GaultMillau', `<a class="link-i" href="${esc(k.gault)}" target="_blank" rel="noopener">Eintrag ansehen</a>`) : ''}
    </dl>
    ${faktoren && faktoren.length ? `<h3 class="wegtitel">Wie die Zahl <em>zustande kommt</em></h3>${faktorenListe(faktoren)}` : ''}
    ${haeuser}
    <div class="hc-taten">${taten}</div>
    <p class="fein">${esc(k.quelle || '')}</p>
  </article>`;
}
function eigenBlatt() {
  const land = Object.keys(LAND).map(c => `<option value="${c}">${esc(LAND[c])}</option>`).join('');
  return `<section class="blatt hc-eigen" id="eigen"><header><h3>Ein Haus, das du <em>gesehen hast</em></h3><p>Steht ab sofort unter «Selbst gesehen» und lässt sich wie jedes andere prüfen.</p></header>
    <form class="hc-eigen__form" data-eigen-form autocomplete="off">
      <label class="wo-feld"><span>Name</span><input type="text" name="name" maxlength="80" placeholder="Hotel Beispiel" aria-label="Name des Hauses"></label>
      <label class="wo-feld"><span>Website</span><input type="text" name="web" inputmode="url" spellcheck="false" required placeholder="www.beispielhotel.ch" aria-label="Website des Hauses"></label>
      <label class="wo-feld"><span>Ort</span><input type="text" name="ort" maxlength="60" placeholder="Interlaken" aria-label="Ort"></label>
      <label class="wo-feld"><span>Land</span><select name="land" aria-label="Land"><option value="">offen</option>${land}</select></label>
      <label class="wo-feld"><span>Art</span><select name="art" aria-label="Art"><option value="">offen</option><option>Hotel</option><option>Restaurant</option></select></label>
      <label class="wo-feld hc-eigen__notiz"><span>Was dir aufgefallen ist</span><input type="text" name="notiz" maxlength="240" placeholder="Schönes Haus, Seite wirkt alt" aria-label="Notiz"></label>
      ${WO.knopf('Aufnehmen', 'plus', 'dunkel', { klein: true, attr: 'type="submit" data-eigen-los' }).replace('type="button" ', '')}
    </form></section>`;
}
/* Der Weg: gefunden → geprüft → in der Kundenliste, als Band mit drei Tafeln (Übersicht und Kunden finden) */
function wegBand(mitKnopf) {
  const alle = S.kand || [];
  /* Geprüft und Kundenliste zählen alle geprüften Häuser, auch die, die nicht aus dem Kundenfinder kommen (sonst stand «0 geprüft» neben zwei geprüften Häusern) */
  const st = [alle.length, S.haeuser.length, S.haeuser.filter(h => h.kundenliste).length];
  const unter = ['aus dem Kundenfinder und selbst gesehen', 'mit gespeichertem Haus-Check', 'als «geprüft» an die Kundenliste gemeldet'];
  return `<section class="blatt hc-wegband" aria-label="Der Weg eines Hauses">
    ${mitKnopf ? `<header><h3>Der Weg <em>eines Hauses</em></h3><button class="link" type="button" data-gehe="finden">Kunden finden</button></header>` : ''}
    <div class="hc-wegband__stufen">${['Gefunden', 'Geprüft', 'In der Kundenliste'].map((t, i) => `<div class="hc-wegband__s"><span class="mono">${i + 1} · ${t}</span><b>${n(st[i])}</b><span class="rang__b"><i style="--w:${Math.max(st[i] ? .02 : 0, st[i] / Math.max(1, st[0])).toFixed(3)}"></i></span><small>${unter[i]}</small></div>`).join('')}</div></section>`;
}
function finden() {
  const alle = S.kand || [];
  const zaehl = (feld, wert) => alle.filter(k => k[feld] === wert).length;
  let aus = kopf('Kunden finden', 'Wer als Nächstes <em>Kunde wird.</em>', 'Die Suchmaschine von Robert in einem Reiter: Schweizer Familien mit mehreren Häusern, Luxushotels und Sternegastronomie, dazu eigene Funde. Jedes Haus lässt sich von hier prüfen und wandert weiter in die Kundenliste.');
  if (!S.kand) { kandidatenLaden().then(() => { if (S.ansicht === 'finden') { rand(); zeichne(true); } }); return aus + `<div class="blatt hc-laeuft" role="status"><span class="mono">Lädt</span><b>Kandidaten</b><div class="lade-platz" aria-hidden="true"><i></i><i></i></div></div>`; }
  aus += wegBand();
  const f = S.f;
  const seg = (feld, werte, name) => `<div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="${esc(name)}">${werte.map(([k, t, z]) => `<button type="button" data-f-${feld}="${k}" class="${f[feld] === k ? 'an' : ''}" aria-pressed="${f[feld] === k}">${esc(t)}${z != null ? ' · ' + n(z) : ''}</button>`).join('')}</div>`;
  aus += `<div class="hc-filter hc-finden-filter">
    ${seg('kat', [['alle', 'Alle', alle.length], ['familien', 'Familien', zaehl('kategorie', 'familien')], ['luxus', 'Luxushotels', zaehl('kategorie', 'luxus')], ['sterne', 'Sterneküche', zaehl('kategorie', 'sterne')]].concat(zaehl('kategorie', 'eigene') ? [['eigene', 'Selbst gesehen', zaehl('kategorie', 'eigene')]] : []), 'Kategorie')}
    ${seg('land', [['alle', 'D · A · CH', null], ['DE', 'Deutschland', zaehl('land', 'DE')], ['AT', 'Österreich', zaehl('land', 'AT')], ['CH', 'Schweiz', zaehl('land', 'CH')]], 'Land')}
    ${seg('sort', Object.entries(SORT).map(([k, t]) => [k, 'Nach ' + t, null]), 'Sortierung')}
    <label class="wo-such hc-such">${WO.ic('suche')}<input type="search" data-f-suche placeholder="Haus, Ort, Familie" aria-label="Kandidaten suchen" value="${esc(f.suche)}"></label>
    ${seg('stand', [['alle', 'Jeder Stand', null], ['offen', 'Noch nicht geprüft', null], ['geprueft', 'Geprüft', null], ['kundenliste', 'In der Kundenliste', null]], 'Stand')}
  </div>`;
  const l = kandGefiltert();
  if (!l.some(k => k.id === f.wahl)) f.wahl = l.length ? l[0].id : '';
  const liste = l.slice(0, f.zeige).map(k => karteKand(k, k.id === f.wahl)).join('');
  aus += `<p class="hc-treffer" aria-live="polite">${n(l.length)} ${l.length === 1 ? 'Haus' : 'Häuser'} · ${esc(f.sort === 'analyse' ? 'geprüfte zuerst, dann von Hand angesehene, dann die Vorschläge der Maschine' : f.sort === 'name' ? 'nach Name' : 'höchstes Potenzial zuerst')}</p>
    <div class="eingang">
      <div class="liste">${liste || '<p class="nichts">Kein Haus in dieser Auswahl.</p>'}${l.length > f.zeige ? `<button class="link weitere" type="button" data-f-mehr>Weitere ${n(Math.min(40, l.length - f.zeige))} zeigen</button>` : ''}</div>
      <div class="detail rg-detail">${detailKand(l.find(k => k.id === f.wahl))}</div>
    </div>
    ${eigenBlatt()}
    <p class="fein">Quelle: Kundenfinder von Robert (${esc(String((S.kandStand || {}).gebaut || '').slice(0, 10).split('-').reverse().join('.'))} übernommen) und die Familien-Übersicht. Das Potenzial vor dem Check ist eine Rechnung aus dem Urteil von Hand, dem Alter der Seite, der Klasse und der Grösse; nach dem Haus-Check gilt dessen Zahl. Neu einlesen: <code>python3 kandidaten_bauen.py</code>.</p>`;
  return aus;
}
function verbindeFinden(el) {
  const neu = (feld, wert) => { S.f[feld] = wert; S.f.zeige = 30; zeichne(true); };
  ['kat', 'land', 'stand', 'sort'].forEach(feld => $$(`[data-f-${feld}]`, el).forEach(b => b.onclick = () => neu(feld, b.getAttribute('data-f-' + feld))));
  $$('[data-f-mehr]', el).forEach(b => b.onclick = () => { S.f.zeige += 40; zeichne(true); });
  const s = $('[data-f-suche]', el);
  if (s) s.oninput = () => { S.f.suche = s.value; S.f.zeige = 30; const pos = s.selectionStart; zeichne(true); const t = $('[data-f-suche]'); t.focus(); try { t.setSelectionRange(pos, pos); } catch (e) { /* */ } };
  $$('[data-kand]', el).forEach(b => b.onclick = () => {
    S.f.wahl = b.dataset.kand;
    $$('#ansicht .liste [data-kand]').forEach(a => { const an = a.dataset.kand === S.f.wahl; a.classList.toggle('aktiv', an); a.setAttribute('aria-pressed', an); });
    const fach = $('#ansicht .detail'); if (!fach) return;
    fach.innerHTML = detailKand((S.kand || []).find(k => k.id === S.f.wahl)); verbinde(fach);
    if (matchMedia('(max-width:1180px)').matches && fach.getBoundingClientRect().top < 0) window.scrollBy({ top: fach.getBoundingClientRect().top - 90, behavior: 'instant' });
  });
  $$('[data-kand-pruef]', el).forEach(b => b.onclick = () => { S.adresse = hostVon(b.dataset.web); pruefe({ adresse: b.dataset.web, kandidat: b.dataset.kandPruef }); });
  $$('[data-kand-weg]', el).forEach(b => b.onclick = async () => {
    try { const j = await api('DELETE', 'kandidat', { id: b.dataset.kandWeg }); await kandidatenLaden(true); zeichne(true); quittung(j.quittung, 'Kunden finden'); } catch (e) { fehler(e); }
  });
  $$('[data-eigen-form]', el).forEach(f => f.onsubmit = async ev => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries()); d.wer = WO_HAUS.wer;
    if (!d.web.trim()) { $('[name=web]', f).focus(); return; }
    try {
      const j = await api('POST', 'kandidat', d);
      await kandidatenLaden(true);
      Object.assign(S.f, { kat: 'eigene', land: 'alle', stand: 'alle', suche: '', wahl: j.kandidat.id, zeige: 30 });
      rand(); zeichne(true); window.scrollTo(0, 0);
      quittung(j.quittung, 'Kunden finden');
    } catch (e) { fehler(e); }
  });
}
