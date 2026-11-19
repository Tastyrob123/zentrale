/* Haus-Check · Dossier je Haus und die neuen Ansichten (Robert 17.11.2026: «die gesamte Klickdynamik muss deutlicher sein und mehr Sinn machen»,
   «viel luxuriöser und edler, übersichtlicher», «nicht nur untereinander geklatschte Textbereiche»).
   Ein Klick auf ein Haus öffnet immer seine eigene Seite (#haus/<kennung>), nie mehr eine Karte unter der Liste. Karten zeigen die Startseite des Hauses
   (Aufnahme im Blender-Laptop) statt einer Zahl. «Wo es fehlt» und «Zur Kundenliste» zeigen je Haus, was gilt, ohne Häuser gegeneinander zu rechnen.
   Braucht die Helfer aus haus-check.js (esc, n, S, …) und maschine.js (geraet, aufnahmenLaden); wird vor haus-check.js geladen, ruft sie erst beim Zeichnen auf. */
'use strict';

/* ---------- Saubere Angaben aus gespeicherten Checks (ältere Checks tragen noch die alten Sätze) ---------- */
const POT_WORT = { hoch: 'Hoch', mittel: 'Mittel', gering: 'Gering' };
function nameH(h) {
  const roh = (h && (h.name || (h.letzter && (h.letzter.ergebnis.haus || {}).name))) || hostVon(h && h.adresse);
  return String(roh).split(/\s+(?:[|·–]|l)\s+/)[0].trim() || roh;   /* «Golfhotel … & SPA l Saanenmöser»: der Teil nach dem Trenner ist der Ort */
}
function artE(e, h) {
  const a = (h && h.art) || (e.haus || {}).art || '';
  if (a && a !== 'unklar') return a;
  const k = (e.bereiche || []).find(b => b.schluessel === 'speisekarte'), z = (e.bereiche || []).find(b => b.schluessel === 'buchung');
  if (k && /Karte steht als Text|nur als PDF|nur als Bild|Karten-Seite/.test(k.urteil + ' ' + (k.zahlen || []).map(x => x.name).join(' '))) return 'Restaurant';
  if (z && /Bestell|Lieferando|Wolt|Tische/.test(z.urteil)) return 'Restaurant';
  return '';
}
const ortE = (e, h) => (h && h.ort) || (e.haus || {}).ort || '';
const sysE = s => String(s || '').replace(/\s+[0-9a-f]{6,}$/i, '');
function satzE(t) {
  return String(t || '')
    .replace(', ein Gespräch lohnt sich.', '.')
    .replace('Das Haus gehört zu eigenes Franchise-System: die Website kommt meist von der Kette, nicht vom Haus.', 'Das Haus ist Teil eines eigenen Franchise-Systems: die Website kommt von der Zentrale, nicht vom Haus.')
    .replace(/\bkette\b/g, 'Kette').replace(/\((framer|webflow|next\.js|nuxt|gatsby)\)/gi, (m, x) => '(' + x.charAt(0).toUpperCase() + x.slice(1) + ')')
    .replace(/Gebaut mit (\S+) [0-9a-f]{6,}/i, 'Gebaut mit $1')
    .replace('Neue Bildsprache: grosse, echte Fotos statt kleiner Bilder', 'Neue Bildsprache mit grossen, echten Fotos')   /* ältere Checks: keine «X statt Y»-Sätze, keine Floskel */
    .replace('Eigene Buchung statt Provision an Portale', 'Eigene Buchung auf der Website, ohne Provision an Portale')
    .replace('Neuer Auftritt aus einem Guss', 'Neue Website nach heutigem Stand');
}
function bereichSatz(b, art) {
  if (b.schluessel === 'buchung' && art === 'Restaurant') {
    const m = /^Buchen geht nur über (.+), jede Buchung kostet Provision\.$/.exec(b.urteil || '');
    if (m && /^(Lieferando|Wolt|Uber Eats|Deliveroo)(, (Lieferando|Wolt|Uber Eats|Deliveroo))*$/.test(m[1])) return 'Bestellt wird nur über ' + m[1] + ', jede Bestellung kostet Provision. Eine eigene Reservierung gibt es nicht.';
  }
  return satzE(b.urteil);
}
const potE = e => { const g = e.gesamt || {}; return { zahl: g.potenzial_zahl, wort: g.potential || 'mittel', satz: satzE((e.kundenblick && e.kundenblick.potenzial.satz) || g.urteil) }; };
const wannE = iso => tagWort(tag(iso)) + ', ' + uhr(iso) + ' Uhr';

/* ---------- Bausteine ---------- */
function potMarke(e, gross) {
  const p = potE(e);
  return `<span class="hd-pot hd-pot--${esc(p.wort)}${gross ? ' hd-pot--gross' : ''}"><b>${p.zahl == null ? '–' : n(p.zahl)}</b><span><small>von 100</small><em>${esc(POT_WORT[p.wort] || '')}</em></span></span>`;
}
function laptopE(e, h) {
  return geraet({ datei: e.aufnahme, name: h ? nameH(h) : (e.haus || {}).name || hostVon(e.adresse), zeile: e.probe ? 'Probehaus, erfunden' : (e.aufnahme_fehler ? 'Keine Aufnahme' : 'Aufnahme wird geladen') });
}
function zeileOrt(e, h) { return [artE(e, h), ortE(e, h)].filter(Boolean).join(' · '); }

/* Grosse Karte: Bühne mit der Startseite im Laptop, darunter Name, Art, Ort, Satz und Potenzial (Übersicht, «Zuletzt geprüft») */
function karteGross(h) {
  const e = h.letzter.ergebnis;
  return `<button class="hd-karte rg-a" type="button" data-haus="${esc(h.kennung)}" aria-label="${esc(nameH(h))} öffnen">
    <span class="hd-karte__buehne">${laptopE(e, h)}</span>
    <span class="hd-karte__text"><span class="mono">${esc(wannE(h.letzter.zeit))}${h.kundenliste ? ' · in der Kundenliste' : ''}</span>
      <b class="hd-karte__name">${esc(nameH(h))}</b><small>${esc(zeileOrt(e, h) || hostVon(h.adresse))}</small>
      <span class="hd-karte__satz">${esc(potE(e).satz)}</span></span>
    <span class="hd-karte__fuss">${potMarke(e)}<span class="hd-oeffnen">Öffnen<i>${PF}</i></span></span>
  </button>`;
}
/* Breite Zeile: kleiner Laptop links, Text in der Mitte (mit freiem Platz für Inhalt der Ansicht), Potenzial und Knöpfe rechts */
function karteZeile(h, o = {}) {
  const e = h.letzter.ergebnis;
  return `<article class="hd-zeile rg-a${o.klasse ? ' ' + o.klasse : ''}">
    <button class="hd-zeile__bild" type="button" data-haus="${esc(h.kennung)}" aria-label="${esc(nameH(h))} öffnen">${laptopE(e, h)}</button>
    <div class="hd-zeile__text"><span class="mono">${esc(o.mono || wannE(h.letzter.zeit))}</span>
      <button class="hd-zeile__name" type="button" data-haus="${esc(h.kennung)}">${esc(nameH(h))}</button>
      <small>${esc([zeileOrt(e, h), hostVon(h.adresse)].filter(Boolean).join(' · '))}</small>
      ${o.inhalt != null ? o.inhalt : `<p class="hd-zeile__satz">${esc(potE(e).satz)}</p>`}</div>
    <div class="hd-zeile__rechts">${potMarke(e)}<div class="hd-zeile__tun">${o.tun || ''}<button class="hd-oeffnen" type="button" data-haus="${esc(h.kennung)}">Öffnen<i>${PF}</i></button></div></div>
  </article>`;
}
/* Spaltenzahl nach Anzahl der Stücke: nie eine halb leere Reihe (1, 2, 3 nebeneinander, 4 als 2 + 2) */
const spalten = z => z >= 4 ? (z % 3 === 0 ? 3 : 2) : z;

/* ---------- Das Haus als Lagebild (Robert 17.11.2026: «keine 1000 Kacheln mit kleinen Strichen oben, sondern eine übersichtliche grafische Aufarbeitung,
   damit man schnell und direkt versteht, was hier Phase ist»; Laptops nie auf einer dunklen Kachel).
   Aufbau: Kopf frei auf dem Papier (Name, Adresse, Knöpfe, Laptop) · Potenzial als Rechnung in Balken · Website als Ring mit zehn Teilen und was fehlt ·
   Für uns als Leiste mit sieben Teilen und Bauweise · KI als Halbkreis mit den Prüfpunkten · Verlauf als Zeitleiste. ---------- */
const AMP3 = { gut: 'gruen', mittel: 'gelb', schwach: 'rot' };
const ampN = a => AMP3[a] || a;
const proz = v => Math.max(0, Math.min(100, v)).toFixed(2) + '%';

/* Potenzial auf einer Skala von 0 bis 100 (Robert 17.11.2026: «warum kann man das nicht einfach auf einer normalen Skala von 0 bis 100 greifen?
   … nicht mit plus 31 und minus 55»). Oben die Zahl auf der Skala mit den Zonen gering, mittel, hoch. Darunter jeder Grund mit seiner eigenen
   Skala 0 bis 100: wie stark er bei diesem Haus zutrifft. Keine Plus- und Minuszahlen, keine Rechnung. */
const POT_KLAR = {
  'Schwache Website': ['Die Website hat Lücken', 35],
  'Selten gepflegt': ['Die Seite wird selten gepflegt', 10],
  'Lücke bei KI': ['ChatGPT und Co. lesen das Haus schlecht', 10],
  'Material zum Bauen': ['Genug Material zum Bauen', 15],
  'Klasse des Hauses': ['Klasse des Hauses', 20],
  'Bindung': ['Gebunden an Kette, Agentur oder eine neu gebaute Seite', 63]
};
/* Balkenfarbe nach den drei Abschnitten der Skala (Robert 17.11.2026: «je weiter das ganze in seinem Abschnitt geht, desto dunkler … bei 35 ist gelb aber hell»).
   0–35 rot, 35–60 gelb, 60–100 grün; bei «Spricht dagegen» umgekehrt, dort ist viel schlecht. Am Anfang eines Abschnitts hell, am Ende satt. */
function balkenFarbe(s, gegen) {
  const ab = s < 35 ? [0, 35, 0] : s < 60 ? [35, 60, 1] : [60, 100, 2];
  const t = Math.min(1, (s - ab[0]) / (ab[1] - ab[0]));
  const farben = ['var(--wo-punkt)', '#d9a01c', 'var(--wo-gut)'];
  const f = farben[gegen ? 2 - ab[2] : ab[2]];
  return `color-mix(in srgb,${f} ${Math.round(30 + 70 * t)}%,var(--wo-blatt))`;
}
function potRechnung(kb, p) {
  const f = kb.potenzial.faktoren || [];
  const klar = x => (POT_KLAR[x.name] || [x.name])[0];
  const stark = x => { const m = x.max > 0 ? x.max : (POT_KLAR[x.name] || [0, 0])[1]; return m ? Math.round(Math.min(1, Math.abs(x.punkte || 0) / m) * 100) : 0; };
  const gegen = x => (x.punkte || 0) < 0 || x.name === 'Bindung';
  const dafuer = f.filter(x => !gegen(x)).sort((a, b) => stark(b) - stark(a)), dagegen = f.filter(gegen);
  const zahl = p.zahl == null ? 0 : p.zahl;
  const skala = `<div class="hd-skala hd-pot--${esc(p.wort)}">
    <div class="hd-skala__bahn"><span class="hd-skala__zone" style="left:0;width:35%"><small>gering</small></span><span class="hd-skala__zone" style="left:35%;width:25%"><small>mittel</small></span><span class="hd-skala__zone" style="left:60%;width:40%"><small>hoch</small></span>
      <i class="hd-skala__marke" style="left:${proz(zahl)}" title="${n(zahl)} von 100"></i></div>
    <div class="hd-skala__achse" aria-hidden="true"><span>0</span><span style="left:35%">35</span><span style="left:60%">60</span><span style="left:100%">100</span></div>
  </div>`;
  const zeile = (x, art) => { const s = stark(x); return `<li class="hd-gr--${art}${s ? '' : ' hd-gr--null'}"><span class="hd-gr__text"><b>${esc(klar(x))}${s ? '' : '<span class="hd-gr__nicht">trifft nicht zu</span>'}</b><small>${esc(satzE(x.satz))}</small></span>
    <span class="hd-gr__bahn"><i style="width:${proz(s)};background:${balkenFarbe(s, art === 'dagegen')}"></i></span><em>${n(s)}</em></li>`; };
  const gruppe = (titel, satz, l, art) => l.length ? `<div class="hd-gr"><h4 class="hd-zwischen">${titel}<span>${satz}</span></h4><ul>${l.map(x => zeile(x, art)).join('')}</ul></div>` : '';
  return skala + `<div class="hd-gruende2">
    ${gruppe('Spricht dafür', 'je voller, desto eher ein Kunde', dafuer, 'dafuer')}
    ${gruppe('Spricht dagegen', 'je voller, desto weniger ein Kunde', dagegen, 'dagegen')}</div>`;
}

/* Website als Ring: zehn Teile in Ampelfarbe, aussen beschriftet, innen wie viele grün sind */
function bereichRing(bereiche, g) {
  const cx = 240, cy = 170, r = 108, R = 152, z = bereiche.length || 10, schritt = 360 / z, luecke = 3.2;
  const pt = (rad, w) => [cx + rad * Math.cos(w * Math.PI / 180), cy + rad * Math.sin(w * Math.PI / 180)];
  const teile = bereiche.map((b, i) => {
    const a = -90 + i * schritt + luecke / 2, e = a + schritt - luecke, m = (a + e) / 2;
    const [x1, y1] = pt(r, a), [x2, y2] = pt(r, e), [lx, ly] = pt(R, m), c = Math.cos(m * Math.PI / 180);
    const anker = c > .25 ? 'start' : c < -.25 ? 'end' : 'middle';
    return `<g class="hd-a--${esc(b.ampel)}"><path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}"><title>${esc(b.name)}: ${esc(AMPEL[b.ampel] || '')}</title></path>
      <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anker}">${esc(b.name)}</text></g>`;
  }).join('');
  return `<figure class="hd-ring"><svg viewBox="0 0 480 340" role="img" aria-label="${n(g.gruen)} von ${n(z)} Bereichen grün, ${n(g.gelb)} gelb, ${n(g.rot)} rot">${teile}
    <text class="hd-ring__zahl" x="${cx}" y="${cy + 10}" text-anchor="middle">${n(g.gruen)}<tspan dx="4">/ ${n(z)}</tspan></text>
    <text class="hd-ring__wort" x="${cx}" y="${cy + 40}" text-anchor="middle">grün</text></svg>
    <figcaption><span class="hd-a--rot"><i></i>${n(g.rot)} rot</span><span class="hd-a--gelb"><i></i>${n(g.gelb)} gelb</span><span class="hd-a--gruen"><i></i>${n(g.gruen)} grün</span></figcaption></figure>`;
}

/* KI als Halbkreis 0 bis 100 */
function kiBogen(note) {
  const v = Math.max(0, Math.min(100, note.punkte || 0)), w = Math.PI * (1 - v / 100);
  const x = 130 + 104 * Math.cos(w), y = 128 - 104 * Math.sin(w);
  const amp = v >= 75 ? 'gruen' : v >= 45 ? 'gelb' : 'rot';
  return `<figure class="hd-bogen hd-a--${amp}"><svg viewBox="0 0 260 150" aria-hidden="true"><path class="hd-bogen__bahn" d="M26 128A104 104 0 0 1 234 128"/>${v > 0 ? `<path class="hd-bogen__wert" d="M26 128A104 104 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}"/>` : ''}</svg>
    <figcaption><b>${n(v)}</b><small>von 100 · ${esc(note.wort || '')}</small></figcaption></figure>`;
}

function dossier(e, o) {
  const g = e.gesamt || {}, kb = e.kundenblick, h = o.h, art = artE(e, h), name = h ? nameH(h) : nameH({ name: (e.haus || {}).name, adresse: e.adresse });
  const p = potE(e), vor = o.vorher, bereiche = e.bereiche || [];
  const kand = (() => { const k = e.kandidat && (S.kand || []).find(x => x.id === e.kandidat); return k ? `<button class="hd-kopf__kand" type="button" data-zum-kand="${esc(k.id)}">Gefunden unter «Kunden finden»: ${esc(KAT[k.kategorie] || '')}</button>` : ''; })();
  /* Kopf: frei auf dem Papier, der Laptop steht ohne Fläche dahinter */
  const kopfD = `<div class="hd-kopf">
    <div class="hd-kopf__text">
      <span class="mono">${esc(o.mono || ('Check · ' + wannE(e.geprueft_am) + (e.wer ? ' · ' + e.wer : '')))}</span>
      <h1>${esc(name)}</h1>
      <p class="hd-kopf__zeile">${esc(zeileOrt(e, h))}${zeileOrt(e, h) ? '<i>·</i>' : ''}<a href="${esc(e.adresse)}" target="_blank" rel="noopener">${esc(hostVon(e.adresse))}<span aria-hidden="true">${PF}</span></a></p>
      ${kand}
      <div class="hd-kopf__tun">${o.taten || ''}</div>
    </div>
    <div class="hd-kopf__geraet">${laptopE(e, h)}</div>
  </div>`;
  /* 1 · Potenzial: Zahl, Satz und die Rechnung dahinter */
  const potD = `<div class="hd-teil hd-tafel hd-lage">
    <div class="hd-lage__kopf"><span class="hd-gross hd-pot--${esc(p.wort)}"><b>${p.zahl == null ? '–' : n(p.zahl)}</b><span><small>von 100</small><em>Potenzial ${esc((POT_WORT[p.wort] || '').toLowerCase())}</em></span></span>
      <p><span class="mono">Lohnt sich das Haus als Kunde?</span>${esc(p.satz)}</p></div>
    ${kb ? `${potRechnung(kb, p)}` : '<p class="hd-unter">Dieser Check ist älter und hat noch keine Rechnung. «Neu prüfen» ergänzt sie.</p>'}
  </div>`;
  /* 2 · Website: Ring links, rechts was fehlt und was wir dort tun */
  const ansatz = kb ? (kb.potenzial.ansatz || []) : [];
  const schwach = bereiche.filter(b => b.ampel !== 'gruen').sort((a, b) => (a.ampel === 'rot' ? 0 : 1) - (b.ampel === 'rot' ? 0 : 1));
  const gut = bereiche.filter(b => b.ampel === 'gruen');
  const vorherW = b => { const alt = vor && (vor.bereiche || []).find(x => x.schluessel === b.schluessel); return alt && alt.ampel !== b.ampel ? ' · vorher ' + AMPELWORT[alt.ampel] : ''; };
  const fehlt = schwach.length ? `<ol class="hd-fehlt">${schwach.map(b => { const a = ansatz.find(x => x.schluessel === b.schluessel);
      const tun = a ? (b.schluessel === 'buchung' && art === 'Restaurant' ? 'Eigene Reservierung und Bestellung auf der Website, ohne Provision an Portale' : satzE(a.satz)) : '';
      return `<li class="hd-a--${esc(b.ampel)}"><span class="mono"><i></i>${esc(b.name)} · ${esc(AMPELWORT[b.ampel])}${esc(vorherW(b))}</span>${tun ? `<b>${esc(tun)}</b>` : ''}<p>${esc(bereichSatz(b, art))}</p></li>`; }).join('')}</ol>`
    : '<p class="hd-unter">Alle zehn Bereiche sind grün. Auf der Website selbst gibt es keinen Ansatz.</p>';
  const messwerte = `<details class="hd-messwerte"><summary>Messwerte aller zehn Bereiche</summary><table><tbody>${bereiche.map(b => `<tr class="hd-a--${esc(b.ampel)}"><th><i></i>${esc(b.name)}</th><td>${esc(bereichSatz(b, art))}${(b.zahlen || []).length ? `<small>${b.zahlen.map(z => esc(z.name) + ': ' + esc(z.wert)).join(' · ')}</small>` : ''}</td></tr>`).join('')}</tbody></table></details>`;
  const webD = `<div class="hd-teil hd-tafel">
    <div class="hd-tafel__kopf"><h2 class="hd-h">Die Website <em>in zehn Bereichen</em></h2><p class="hd-unter">${esc(satzE(g.urteil_website || (kb ? '' : g.urteil)))}</p></div>
    <div class="hd-web">${bereichRing(bereiche, g)}
      <div class="hd-web__rechts"><h3 class="hd-zwischen">${schwach.length ? 'Wo wir ansetzen' : 'Kein Ansatz'}</h3>${fehlt}
        ${gut.length ? `<p class="hd-gut"><span class="mono">In Ordnung</span>${gut.map(b => `<span><i></i>${esc(b.name)}</span>`).join('')}</p>` : ''}</div></div>
    ${messwerte}
  </div>`;
  let kundeD = '', kiD = '';
  if (kb) {
    const b = kb.bauweise || {}, au = kb.aussen || {}, ki = kb.ki || {};
    const leiste = `<ol class="hd-leiste" style="--z:${kb.teile.length}">${kb.teile.map(t => `<li class="hd-a--${esc(t.ampel)}"><i></i><b>${esc(t.name)}</b><small>${esc(AMPEL[t.ampel] || '')}</small></li>`).join('')}</ol>`;
    const grund = kb.teile.filter(t => t.ampel !== 'gruen' && t.name !== 'KI-Check');
    const zeile = (dt, dd) => `<div><dt>${esc(dt)}</dt><dd>${esc(dd)}</dd></div>`;
    const quellen = (au.quellen || []).map(q => `<li>${esc(q.name)}${q.satz ? ': ' + esc(q.satz) : ''}</li>`).join('') + (au.offen || []).map(x => `<li class="hd-liste--offen">${esc(x)}</li>`).join('');
    kundeD = `<div class="hd-teil hd-tafel">
      <div class="hd-tafel__kopf"><h2 class="hd-h">Macht das Haus <em>für uns Sinn?</em></h2><p class="hd-unter">Material zum Bauen, Marke, wer die Seite baut und wie oft sie gepflegt wird.</p></div>
      ${leiste}
      ${grund.length ? `<ul class="hd-grund">${grund.map(t => `<li class="hd-a--${esc(t.ampel)}"><i></i><b>${esc(t.name)}</b><span>${esc(satzE(t.satz))}</span></li>`).join('')}</ul>` : ''}
      <dl class="hd-dl">
        ${zeile('Gebaut mit', (b.systeme || []).map(sysE).join(', ') || 'kein bekanntes System erkannt')}
        ${zeile('Agentur', (b.agentur || []).map(a => a.name + ' (' + a.wo + ')').join(', ') || 'keine sichtbar')}
        ${zeile(art === 'Restaurant' ? 'Reservierung' : 'Buchung', [b.buchung && b.buchung['eigene Buchungsstrecke'], b.buchung && b.buchung['Reservierungsdienst']].filter(Boolean).join(', ') || 'kein eigener Weg')}
        ${zeile('Portale', (b.buchung && b.buchung['Portale verlinkt']) || 'keine verlinkt')}
        ${zeile('Verbünde und Führer', (b.gruppen || []).map(x => x.name).join(', ') || 'keine genannt')}
        ${zeile('Werkzeuge', (b.werkzeuge || []).join(', ') || 'keine erkannt')}</dl>
      ${quellen ? `<details class="hd-messwerte"><summary>Ausserhalb der Seite</summary><ul class="hd-liste">${quellen}</ul></details>` : ''}
    </div>`;
    const kiL = (ki.bereiche || []);
    kiD = `<div class="hd-teil hd-tafel">
      <div class="hd-tafel__kopf"><h2 class="hd-h">Wie ChatGPT und Co. <em>das Haus lesen</em></h2></div>
      <div class="hd-kiwahl">${ki.note ? kiBogen(ki.note) : '<p class="hd-unter">Der KI-Check ist nicht gelaufen.</p>'}
        <div class="hd-kiwahl__satz"><p>${esc(satzE(((kb.teile || []).find(t => t.name === 'KI-Check') || {}).satz || ''))}</p>
          ${kiL.length ? `<p class="hd-kizahl">${['gruen', 'gelb', 'rot'].map(a => `<span class="hd-a--${a}"><i></i>${n(kiL.filter(x => ampN(x.ampel) === a).length)} ${AMPELWORT[a]}</span>`).join('')}</p>` : ''}</div></div>
        ${kiL.length ? `<ol class="hd-kipunkte" style="--sp:${spalten(kiL.length)}">${kiL.map(x => `<li class="hd-a--${esc(ampN(x.ampel))}"><span><i></i><b>${esc(x.titel)}</b></span><small>${esc(x.befund)}</small></li>`).join('')}</ol>` : ''}
    </div>`;
  }
  const seiten = (e.seiten || []).map(s => `<li><span class="mono">${esc(ROLLE[s.rolle] || s.rolle)}</span><a class="link-i" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.titel || hostVon(s.url))}</a><em>${n(s.woerter)} Wörter</em></li>`).join('');
  const fuss = `<div class="hd-teil hd-tafel">
    <div class="hd-tafel__kopf"><h2 class="hd-h">Verlauf <em>des Hauses</em></h2></div>
    ${o.verlauf || '<p class="hd-unter">Noch nicht gespeichert.</p>'}
    ${seiten ? `<details class="hd-messwerte"><summary>Gelesene Seiten · ${n((e.seiten || []).length)}</summary><ol class="hd-seiten">${seiten}</ol></details>` : ''}
    ${o.klein ? `<div class="hd-klein">${o.klein}</div>` : ''}
  </div>
  <p class="hd-fein hd-fein--ende">Geprüft in ${e.dauer >= .1 ? sek(e.dauer) + ' Sekunden' : 'unter einer Sekunde'}, ohne bezahlte Dienste: die Seite selbst, ihre wichtigsten Unterseiten, robots.txt, llms.txt, die Sitemap, der KI-Check, der Kundenfinder und Wikipedia.${e.probe ? ' Probedaten: ein erfundenes Haus.' : ''}</p>`;
  return `<div class="hd">${o.oben || ''}${kopfD}${o.hinweis || ''}${potD}${webD}${kundeD}${kiD}${fuss}</div>`;
}

/* Das Dossier eines gespeicherten Hauses: Weg zurück, Nachbarn, Verlauf und Taten */
function hausAnsicht() {
  const h = finde(S.wahl);
  if (!h) return `<div class="hd"><nav class="hd-weg"><button class="hd-zurueck" type="button" data-gehe="haeuser"><i>${PF}</i>Alle geprüften Häuser</button></nav><div class="leer blatt">${ZT}<b>Dieses Haus gibt es nicht mehr.</b><p>Es liegt vielleicht im Papierkorb.</p></div></div>`;
  const reihe = S.haeuser, i = reihe.indexOf(h), vorH = reihe[i - 1], nachH = reihe[i + 1];
  const c = h.checks.find(x => x.zeit === S.zeit) || h.letzter, j = h.checks.indexOf(c), vorher = j > 0 ? h.checks[j - 1].ergebnis : null;
  const weg = `<nav class="hd-weg"><button class="hd-zurueck" type="button" data-gehe="haeuser"><i>${PF}</i>Alle geprüften Häuser</button>
    <span class="hd-weg__nachbarn">${vorH ? `<button class="link" type="button" data-haus="${esc(vorH.kennung)}">Voriges Haus</button>` : ''}<span class="mono">${n(i + 1)} von ${n(reihe.length)}</span>${nachH ? `<button class="link" type="button" data-haus="${esc(nachH.kennung)}">Nächstes Haus</button>` : ''}</span></nav>`;
  const verlauf = `<div class="hd-verlauf hd-zeitleiste">${h.checks.slice().reverse().map(x => `<button type="button" class="hd-vk${x === c ? ' an' : ''}" data-check="${esc(x.zeit)}" aria-pressed="${x === c}"><i class="hd-a--${esc(({ hoch: 'rot', mittel: 'gelb', gering: 'grau' })[x.ergebnis.gesamt.potential] || 'gelb')}"></i><b>${esc(datum(x.zeit))}, ${esc(uhr(x.zeit))}</b><small>${x.ergebnis.gesamt.potenzial_zahl != null ? n(x.ergebnis.gesamt.potenzial_zahl) + ' von 100' : esc(POT[x.ergebnis.gesamt.potential] || '')}${x.wer ? ' · ' + esc(x.wer) : ''}</small></button>`).join('')}</div>`;
  const taten = WO.knopf(h.kundenliste ? 'Aus der Kundenliste' : 'In die Kundenliste', h.kundenliste ? 'zurueck' : 'plus', h.kundenliste ? 'hell' : 'gold', { klein: true, attr: `data-kl${h.kundenliste ? '-raus' : ''}="${esc(h.kennung)}"` })
    + WO.knopf('Neu prüfen', 'verlauf', 'hell', { klein: true, attr: `data-neu-pruefen="${esc(h.kennung)}"` });
  const klein = `<button class="link" type="button" data-check-weg="${esc(c.zeit)}" data-kennung="${esc(h.kennung)}">Diesen Check entfernen</button><button class="link" type="button" data-haus-weg="${esc(h.kennung)}">Haus in den Papierkorb</button>`;
  const mono = (c === h.letzter ? 'Letzter Check · ' : 'Check vom ') + wannE(c.zeit) + (c.wer ? ' · ' + c.wer : '') + (h.kundenliste ? ' · in der Kundenliste seit ' + datum(h.kundenliste.zeit) : '');
  return dossier(c.ergebnis, { h, vorher, verlauf, taten, klein, mono, oben: weg });
}

/* ---------- Ansichten ---------- */
function zuletztGeprueft() {
  const l = S.haeuser.slice(0, 4);
  if (!l.length) return '';
  const inhalt = l.length === 1 ? `<div class="hd-reihe">${karteZeile(l[0])}</div>` : `<div class="hd-karten" style="--sp:${spalten(l.length)}">${l.map(karteGross).join('')}</div>`;
  return `<h2 class="hd-h hd-abschnitt">Zuletzt <em>geprüft</em></h2>${inhalt}
    ${S.haeuser.length > l.length ? `<p class="mehr">${WO.knopf('Alle ' + n(S.haeuser.length) + ' Häuser', 'rechts', 'hell', { klein: true, attr: 'data-gehe="haeuser"' })}</p>` : ''}`;
}
function haeuserListe() {
  const q = S.suche.trim().toLowerCase();
  const alle = S.haeuser.filter(h => !q || [nameH(h), h.adresse, h.ort, h.art].join(' ').toLowerCase().includes(q));
  const pot = p => alle.filter(h => h.letzter.ergebnis.gesamt.potential === p);
  const nach = { alle, hoch: pot('hoch'), mittel: pot('mittel'), gering: pot('gering'), kundenliste: alle.filter(h => h.kundenliste) };
  const l = nach[S.filter] || alle;
  const f = (k, name) => `<button type="button" data-filter="${k}" class="${S.filter === k ? 'an' : ''}" aria-pressed="${S.filter === k}">${name} · ${n(nach[k].length)}</button>`;
  let aus = `<div class="hc-filter"><div class="wahl3 wo-seg wahl3--filter" role="group" aria-label="Auswahl">${f('alle', 'Alle')}${f('hoch', 'Potenzial hoch')}${f('mittel', 'Mittel')}${f('gering', 'Gering')}${f('kundenliste', 'In der Kundenliste')}</div>
    <label class="wo-such hc-such">${WO.ic('suche')}<input type="search" data-suche placeholder="Haus, Ort oder Adresse" aria-label="Suchen" value="${esc(S.suche)}"></label></div>`;
  if (!l.length) return aus + `<div class="leer-hinweis"><b>Kein Haus in dieser Auswahl.</b> ${q ? 'Zu «' + esc(S.suche) + '» passt nichts.' : 'Noch kein Haus mit diesem Stand.'}</div>`;
  let letzter = '';
  aus += `<div class="hd-reihe">${l.slice(0, S.zeige).map(h => { const t = tag(h.letzter.zeit); const k = t !== letzter ? `<p class="tagzeile">${esc(tagWort(t, true))}</p>` : ''; letzter = t; return k + karteZeile(h); }).join('')}
    ${l.length > S.zeige ? `<button class="link weitere" type="button" data-mehr>Weitere ${n(Math.min(60, l.length - S.zeige))} zeigen</button>` : ''}</div>`;
  return aus;
}
/* Wo es fehlt: je Haus nur seine Lücken, rot zuerst. Kein Vergleich zwischen den Häusern. */
function fehltListe() {
  return `<div class="hd-reihe">${S.haeuser.map(h => {
    const e = h.letzter.ergebnis, art = artE(e, h), schwach = (e.bereiche || []).filter(b => b.ampel !== 'gruen').sort((a, b) => (a.ampel === 'rot' ? 0 : 1) - (b.ampel === 'rot' ? 0 : 1));
    const inhalt = schwach.length ? `<ol class="hd-luecken">${schwach.map(b => `<li class="hd-a--${esc(b.ampel)}"><i></i><b>${esc(b.name)}</b><span>${esc(bereichSatz(b, art))}</span></li>`).join('')}</ol>`
      : '<p class="hd-zeile__satz">Keine Lücke: alle zehn Bereiche sind grün.</p>';
    return karteZeile(h, { inhalt, mono: n(schwach.filter(b => b.ampel === 'rot').length) + ' rot · ' + n(schwach.filter(b => b.ampel === 'gelb').length) + ' gelb · ' + wannE(h.letzter.zeit) });
  }).join('')}</div>`;
}
/* Zur Kundenliste: drei klare Gruppen, je Haus der Knopf direkt daneben */
function kundenGruppen() {
  const H = S.haeuser, pot = h => h.letzter.ergebnis.gesamt.potential, zahl = h => h.letzter.ergebnis.gesamt.potenzial_zahl || 0;
  const lohnt = H.filter(h => !h.kundenliste && pot(h) !== 'gering').sort((a, b) => zahl(b) - zahl(a));
  const drin = H.filter(h => h.kundenliste);
  const eher = H.filter(h => !h.kundenliste && pot(h) === 'gering').sort((a, b) => zahl(b) - zahl(a));
  const rein = h => WO.knopf('In die Kundenliste', 'plus', 'gold', { klein: true, attr: `data-kl="${esc(h.kennung)}"` });
  const gruppe = (titel, satz, l, o, leerSatz) => `<section class="hd-gruppe"><header class="hd-gruppe__kopf"><h2 class="hd-h">${titel}</h2><span class="hd-gruppe__z">${n(l.length)}</span><p>${satz}</p></header>
    ${l.length ? `<div class="hd-reihe">${l.map(h => karteZeile(h, o(h))).join('')}</div>` : `<p class="hd-leer">${leerSatz}</p>`}</section>`;
  return gruppe('Lohnt ein <em>Gespräch</em>', 'Potenzial hoch oder mittel, noch nicht in der Kundenliste. Das stärkste Haus zuerst.', lohnt, h => ({ tun: rein(h) }), 'Gerade wartet kein Haus mit hohem oder mittlerem Potenzial.')
    + gruppe('Schon in der <em>Kundenliste</em>', 'Mit dem Stand «geprüft» an die Kundenliste gemeldet.', drin, h => ({ mono: 'In der Kundenliste seit ' + datum(h.kundenliste.zeit) + (h.kundenliste.weg === 'ablage' ? ' · vorgemerkt' : ''),
      tun: WO.knopf('Aus der Kundenliste', 'zurueck', 'hell', { klein: true, attr: `data-kl-raus="${esc(h.kennung)}"` }) }), 'Noch kein Haus gemeldet.')
    + gruppe('Eher <em>kein Kunde</em>', 'Potenzial gering. Der Grund steht dabei; wer trotzdem passt, geht mit einem Klick in die Kundenliste.', eher, h => ({ tun: rein(h) }), 'Kein Haus mit geringem Potenzial.');
}
function geprueftInhalt() {   /* edler gesetzt (Robert 17.11.2026: «edler, luxuriöser und eleganter»), Inhalt unverändert */
  const blicke = [
    ['auge', 'Was der Gast sieht', 'Die Website', 'Zehn Bereiche mit Ampel und einem Satz: so, wie ein Gast die Seite erlebt.', 'Bilder, Texte, Handy, Ladegewicht, Buchung, Speisekarte, Impressum, Sprachen, Alter, KI'],
    ['person', 'Was wir brauchen', 'Der Kundenblick', 'Ob das Haus für uns Sinn macht: Material zum Bauen, Marke, wer die Seite baut und wie oft sie gepflegt wird.', 'Bilder, Text, Marke, Bauweise, Aktualität, Aussensicht'],
    ['schild', 'Was die KI liest', 'Der KI-Check', 'Wie gut ChatGPT und Co. das Haus lesen und empfehlen können, als Zahl von 0 bis 100.', 'derselbe Check wie im Werkzeug KI-Check']];
  const ZB = { bilder: 'auge', texte: 'blatt', handy: 'tel', ladegewicht: 'balken', buchung: 'haus', speisekarte: 'buch', impressum: 'siegel', sprachen: 'chat', alter: 'uhr', ki: 'schild' };
  const faktoren = [['Schwache Website', '35', 'je roter Bereich zwei Punkte, je gelber einer'], ['Klasse des Hauses', '20', 'aus dem Kundenfinder, sonst ohne Punkte'], ['Material zum Bauen', '15', 'genug Bilder, Text und Marke'],
    ['Selten gepflegt', '10', 'lange keine Änderung an der Seite'], ['Lücke bei KI', '10', 'je weniger Punkte im KI-Check, desto mehr hier'], ['Bindung', 'bis −63', 'Kette −15, Agentur −8, neu gebaute und gepflegte Seite −40']];
  const nie = ['Kein bezahlter Dienst, kein KI-Aufruf. Gelesen werden die Seite, bis zu sieben Unterseiten, robots.txt, llms.txt und die Sitemap.',
    'Bewertungen bei Google und Tripadvisor stehen als «noch nicht geprüft» da, nie erfunden.', 'Nichts wird verschickt. «In die Kundenliste» legt das Haus nur dort an.',
    'Nichts wird endgültig gelöscht. Ein Haus liegt im Papierkorb, bis es zurückgeholt wird.'];
  const wissen = [['glocke', 'Ampel', 'grün zeitgemäss, gelb ausbaufähig, rot deutlich hinter dem Stand.'], ['verlauf', 'Verlauf', 'jeder Check bleibt beim Haus. Ändert sich ein Bereich, steht «vorher gelb» dabei.'],
    ['welt', 'Grenzen', 'baut eine Seite ihren Inhalt erst im Browser auf, meldet der Bereich das, statt zu raten.'], ['uhr', 'Dauer', 'ein Check braucht bei echten Seiten bis zu einer Minute.']];
  const ring = z => `<i class="hg-ring">${WO.ic(z)}</i>`;
  return `<div class="hg-blicke" aria-label="Drei Blicke">${blicke.map(([z, k, t, s, u], i) => `<div class="hg-blick" style="--i:${i}">${ring(z)}<span class="hg-k">${k}</span><b>${t}</b><p>${s}</p><small>${u}</small></div>`).join('')}</div>
  <h2 class="hd-h hd-abschnitt">Die zehn <em>Bereiche</em></h2>
  <div class="hg-bereiche" aria-label="Die zehn Bereiche">${PRUEF.map(([k, name]) => `<div class="hg-b">${ring(ZB[k] || 'auge')}<b>${esc(name)}</b><p>${esc(PWAS[k])}</p></div>`).join('')}</div>
  <h2 class="hd-h hd-abschnitt">So entsteht <em>das Potenzial</em></h2>
  <div class="hg-pot" aria-label="So entsteht das Potenzial">
    <div class="hg-skala"><div class="hg-skala__band"><span style="--w:35"><em>Potenzial gering</em></span><span style="--w:25"><em>Potenzial mittel</em></span><span style="--w:40"><em>Potenzial hoch</em></span></div>
      <div class="hg-skala__zahlen"><span style="--w:35"><b>0</b><small>bis 34</small></span><span style="--w:25"><b>35</b><small>bis 59</small></span><span style="--w:40"><b>60</b><small>und mehr</small></span></div></div>
    <p class="hg-erkl">Sechs Faktoren geben Punkte. Zusammengezählt ergibt das eine Zahl von 0 bis 100, und die zeigt das Band oben. Die grosse Zahl je Faktor ist das Höchste, was er geben kann.</p>
    <div class="hg-faktoren">${faktoren.map(([t, p, s]) => { const ab = /^bis/.test(p), z = p.replace(/^bis\s*/, ''); return `<div class="hg-f"><b>${ab ? z : '+' + z}<small>${ab ? 'Punkte Abzug' : 'Punkte'}</small></b><span>${t}</span><small>${s}</small></div>`; }).join('')}</div>
    <p class="hg-fein">Eine neu gebaute Seite, die gepflegt wird, ist kein Kunde: sie fällt fast immer unter 35.</p>
  </div>
  <div class="hd-zwei hd-teil hg-zwei">
    <div class="hd-tafel hg-tafel"><h3 class="hd-h3">Was <em>nie passiert</em></h3><ul class="hg-liste">${nie.map(x => `<li>${ring('haken')}<span>${x}</span></li>`).join('')}</ul></div>
    <div class="hd-tafel hg-tafel"><h3 class="hd-h3">Gut <em>zu wissen</em></h3><ul class="hg-liste">${wissen.map(([z, b, x]) => `<li>${ring(z)}<span><b>${b}:</b> ${x}</span></li>`).join('')}</ul></div>
  </div>`;
}
