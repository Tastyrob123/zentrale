/* Beiträge: Archiv, Entwurf, Vorschau, Grafik, Prüfung, Quittung.
   Spricht mit /api/08-beitraege/… (api.py). Vorlagen in vorlagen.js, Prüfung in pruefung.js. */
(function () {
  'use strict';

  const API = '/zentrale/api/08-beitraege/';
  const $ = id => document.getElementById(id);
  const STAND_NAME = { entwurf: 'Entwurf', fertig: 'fertig', veroeffentlicht: 'veröffentlicht' };
  const WER = new URLSearchParams(location.search).get('wer') || 'Robert';

  const zustand = {
    projekte: [], entwuerfe: [], filter: '',
    entwurf: null,              // der offene Entwurf (Arbeitskopie)
    gespeichert: '',            // JSON des zuletzt gespeicherten Standes
    geraet: 'rechner',
    quittung: null,             // {aktion, vorher, nachher}
    bilder: {},                 // Bild-Adresse → Image (geladen)
    grafikUrl: '',              // Daten-Adresse der gebauten Grafik
    pruefung: null
  };

  /* ---------- Hilfen ---------- */

  async function api(methode, weg, daten) {
    const r = await fetch(API + weg + (methode === 'GET' && daten ? '?' + new URLSearchParams(daten) : ''), {
      method: methode, headers: { 'Content-Type': 'application/json' },
      body: methode === 'GET' ? undefined : JSON.stringify(daten || {})
    });
    const a = await r.json();
    if (!r.ok) throw new Error(a.fehler || 'Fehler ' + r.status);
    return a;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function datumKurz(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
  }

  function projekt(id) { return zustand.projekte.find(p => p.id === id) || null; }

  function autoHoehe(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }

  function bildLaden(adresse) {
    if (!adresse) return Promise.resolve(null);
    if (zustand.bilder[adresse]) return Promise.resolve(zustand.bilder[adresse]);
    return new Promise(res => {
      const im = new Image();
      im.onload = () => { zustand.bilder[adresse] = im; res(im); };
      im.onerror = () => res(null);
      im.src = adresse;
    });
  }

  /* Ein Bild des Entwurfs als Adresse: Pfad direkt, aus der Ablage als Daten-Adresse. */
  const ablageAdressen = {};
  async function bildAdresse(b) {
    if (!b || !b.wert) return '';
    if (b.art !== 'ablage') return b.wert;
    if (!ablageAdressen[b.wert]) {
      try { ablageAdressen[b.wert] = (await api('GET', 'bild', { id: b.wert })).daten; } catch (e) { return ''; }
    }
    return ablageAdressen[b.wert];
  }

  /* ---------- Gesamttext ---------- */

  function gesamttext(e) {
    const teile = [];
    const lagen = [];
    let pos = 0;
    e.abschnitte.forEach((a, i) => {
      const t = (a.text || '').trim();
      if (!t) return;
      if (teile.length) pos += 2;
      lagen.push({ i, art: a.art, von: pos, bis: pos + t.length });
      teile.push(t);
      pos += t.length;
    });
    let text = teile.join('\n\n');
    let hashtagsVon = -1;
    const h = (e.hashtags || '').trim();
    if (h) { hashtagsVon = text.length + (text ? 2 : 0); text = text ? text + '\n\n' + h : h; }
    return { text, lagen, hashtagsVon };
  }

  /* ---------- Archiv ---------- */

  function zeigeArchiv() {
    $('ansicht-entwurf').hidden = true;
    $('ansicht-archiv').hidden = false;
    $('zum-archiv').hidden = true;
    history.replaceState(null, '', location.pathname + (WER !== 'Robert' ? '?wer=' + WER : ''));
    baueArchiv();
  }

  function baueArchiv() {
    const liste = $('archiv-liste');
    const eintraege = zustand.entwuerfe.filter(e => !zustand.filter || e.stand === zustand.filter);
    liste.innerHTML = eintraege.map(e => {
      const p = projekt(e.projekt_id);
      const hook = (e.abschnitte.find(a => a.art === 'hook') || e.abschnitte[0] || {}).text || '';
      const wann = e.stand === 'veroeffentlicht' && e.veroeffentlicht_am ? 'veröffentlicht am ' + datumKurz(e.veroeffentlicht_am) : 'geändert am ' + datumKurz(e.geaendert) + (e.bearbeiter ? ' von ' + esc(e.bearbeiter) : '');
      return `<li class="eintrag" data-id="${esc(e.id)}" tabindex="0">
        <span class="eintrag__stand ist-${esc(e.stand)}">${STAND_NAME[e.stand] || e.stand}</span>
        <div><div class="eintrag__haus">${esc(p ? p.name : 'Ohne Haus')}</div><div class="eintrag__hook">${esc(hook.split('\n')[0] || 'Noch kein Text')}</div></div>
        <span class="eintrag__wann">${wann}</span></li>`;
    }).join('');
    $('archiv-leer').hidden = eintraege.length > 0;
  }

  async function ladeArchiv() {
    zustand.entwuerfe = (await api('GET', 'entwuerfe')).entwuerfe;
  }

  /* ---------- Entwurf öffnen, neu ---------- */

  function neuerEntwurf() {
    const p = zustand.projekte[0];
    const e = {
      id: 'e-' + new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + Math.random().toString(16).slice(2, 6),
      projekt_id: p ? p.id : '', vorlage: 'zahl', stand: 'entwurf', erstellt: '', geaendert: '', veroeffentlicht_am: '', bearbeiter: WER,
      stichpunkte: p ? p.anders.slice() : [],
      abschnitte: [],
      hashtags: '',
      bilder: p ? { vorher: { art: 'pfad', wert: p.vorher.bild }, nachher: { art: 'pfad', wert: p.nachher.bild } } : {},
      grafik: 'quer', neu: true
    };
    e.abschnitte = baueAbschnitte(e.vorlage, werteAusHaus(p, e.stichpunkte));
    return e;
  }

  async function oeffne(e) {
    zustand.entwurf = JSON.parse(JSON.stringify(e));
    zustand.gespeichert = e.neu ? '' : JSON.stringify(saubereKopie(zustand.entwurf));
    $('ansicht-archiv').hidden = true;
    $('ansicht-entwurf').hidden = false;
    $('zum-archiv').hidden = false;
    if (!e.neu) history.replaceState(null, '', location.pathname + '?entwurf=' + e.id + (WER !== 'Robert' ? '&wer=' + WER : ''));
    baueFormular();
    await zeichneAlles();
    $('ansicht-entwurf').scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
  }

  function saubereKopie(e) {
    const k = JSON.parse(JSON.stringify(e));
    delete k.neu; delete k.geaendert; delete k.erstellt;
    return k;
  }

  /* ---------- Formular ---------- */

  function baueFormular() {
    const e = zustand.entwurf;
    const sel = $('f-projekt');
    sel.innerHTML = zustand.projekte.map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.ort)}</option>`).join('');
    sel.value = e.projekt_id;
    zeigeHaus();
    $('f-stichpunkte').value = e.stichpunkte.join('\n');
    autoHoehe($('f-stichpunkte'));
    $('vorlagen').innerHTML = VORLAGEN.map(v => `<label class="vorlage"><input type="radio" name="vorlage" value="${v.id}" ${v.id === e.vorlage ? 'checked' : ''}><span><span class="vorlage__name">${esc(v.name)}</span><div class="vorlage__kurz">${esc(v.kurz)}</div></span></label>`).join('');
    $('abschnitt-art').innerHTML = Object.keys(ABSCHNITT_ARTEN).map(a => `<option value="${a}">${esc(ABSCHNITT_ARTEN[a].name)}</option>`).join('');
    $('f-hashtags').value = e.hashtags || '';
    document.querySelectorAll('input[name="stand"]').forEach(r => { r.checked = r.value === e.stand; });
    document.querySelectorAll('[data-grafik]').forEach(k => k.classList.toggle('ist-aktiv', k.dataset.grafik === e.grafik));
    $('loeschen').hidden = !!e.neu;
    zeigeStandSatz();
    baueAbschnitteFormular();
    zeigeBilder();
  }

  function zeigeHaus() {
    const p = projekt(zustand.entwurf.projekt_id);
    const box = $('haus-info');
    if (!p) { box.innerHTML = ''; return; }
    const v = p.vorher, n = p.nachher;
    const z = (name, a, b, einheit) => `<span>${esc(name)}<b>${esc(a)}${einheit} → ${esc(b)}${einheit}</b></span>`;
    box.innerHTML = `<p class="haus__satz">${esc(p.art)}, ${esc(p.ort)}, seit ${esc(p.seit)}. Seite neu seit ${datumKurz(p.fertig)}, ${esc(p.adresse)}.</p>
      <div class="haus__zahlen">${z('Dateien beim Öffnen', v.dateien, n.dateien, '')}${z('Sekunden bis zur Seite', v.ladezeit, n.ladezeit, ' s')}${z('Unterseiten', v.seiten, n.seiten, '')}${z('Klicks bis zum Tisch', v.klicks_bis_tisch, n.klicks_bis_tisch, '')}</div>
      <p class="block__satz">Vorher: ${esc(v.stand)}.</p>`;
  }

  function zeigeStandSatz() {
    const s = zustand.entwurf.stand;
    $('stand-satz').textContent = s === 'veroeffentlicht' ? 'Veröffentlicht am ' + (datumKurz(zustand.entwurf.veroeffentlicht_am) || 'heute') + '. Das Werkzeug stellt nichts online, das machst du auf LinkedIn.'
      : s === 'fertig' ? 'Fertig heißt: geprüft und bereit. Nach dem Posten auf LinkedIn den Stand hier auf «veröffentlicht» stellen.'
      : 'Ein Entwurf. Lücken füllen, Prüfung durchgehen, dann auf «fertig» stellen.';
  }

  function baueAbschnitteFormular() {
    const e = zustand.entwurf;
    const box = $('abschnitte');
    box.innerHTML = e.abschnitte.map((a, i) => {
      const art = ABSCHNITT_ARTEN[a.art] || { name: a.art, hinweis: '' };
      return `<div class="abschnitt" data-i="${i}">
        <div class="abschnitt__kopf">
          <span class="abschnitt__name">${esc(art.name)}</span>
          <button type="button" class="abschnitt__knopf" data-tu="fassung" data-i="${i}">Andere Fassung</button>
          <button type="button" class="abschnitt__knopf" data-tu="hoch" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="nach oben">↑</button>
          <button type="button" class="abschnitt__knopf" data-tu="runter" data-i="${i}" ${i === e.abschnitte.length - 1 ? 'disabled' : ''} aria-label="nach unten">↓</button>
          <button type="button" class="abschnitt__knopf" data-tu="weg" data-i="${i}" aria-label="Abschnitt entfernen">Entfernen</button>
        </div>
        <p class="abschnitt__hinweis">${esc(art.hinweis)}</p>
        <textarea data-i="${i}" rows="2" spellcheck="true">${esc(a.text)}</textarea>
      </div>`;
    }).join('');
    box.querySelectorAll('textarea').forEach(autoHoehe);
  }

  async function zeigeBilder() {
    const e = zustand.entwurf;
    for (const seite of ['vorher', 'nachher']) {
      const b = e.bilder[seite];
      const adresse = await bildAdresse(b);
      const img = $('bild-' + seite);
      if (adresse) img.src = adresse; else img.removeAttribute('src');
      $('bild-quelle-' + seite).textContent = !b ? 'kein Bild' : b.art === 'ablage' ? 'hochgeladen' : b.wert.startsWith('/zentrale/werkzeuge/08-beitraege/haeuser/bilder/') ? 'vom Haus' : b.wert.replace(/^https?:\/\//, '').slice(0, 40);
    }
  }

  /* ---------- Vorschau, Prüfung, Grafik ---------- */

  function werte() {
    return werteAusHaus(projekt(zustand.entwurf.projekt_id), zustand.entwurf.stichpunkte);
  }

  function zeichneVorschau() {
    const e = zustand.entwurf;
    const g = gesamttext(e);
    const p = pruefeText(g.text, g.lagen, g.hashtagsVon);
    zustand.pruefung = { ...p, lagen: g.lagen, text: g.text };

    // Markierungen: sortiert, ohne Überlappung
    const marken = p.funde.filter(f => f.bis > f.von && f.von < g.text.length).slice().sort((a, b) => a.von - b.von || b.bis - a.bis);
    let html = '', pos = 0;
    marken.forEach((f, n) => {
      if (f.von < pos) return;
      html += esc(g.text.slice(pos, f.von));
      html += `<mark class="m-${f.stufe}" data-fund="${p.funde.indexOf(f)}" title="${esc(f.titel)}">${esc(g.text.slice(f.von, f.bis))}</mark>`;
      pos = f.bis;
    });
    html += esc(g.text.slice(pos));
    $('post-text').innerHTML = html || '<span style="opacity:.5">Noch kein Text. Wähl eine Vorlage und bau den Text.</span>';

    // Prüfung
    $('pruefung-zahl').textContent = `${p.anzahl.fehler} ${p.anzahl.fehler === 1 ? 'Fehler' : 'Fehler'} · ${p.anzahl.pruefen} zu prüfen · ${p.anzahl.hinweis} ${p.anzahl.hinweis === 1 ? 'Hinweis' : 'Hinweise'}`;
    $('pruefung-laenge').textContent = `${p.zeichen.toLocaleString('de-DE')} Zeichen, ${p.woerter.toLocaleString('de-DE')} Wörter. ${p.laengeText}`;
    $('funde').innerHTML = p.funde.map((f, i) => {
      const lage = g.lagen.find(l => f.von >= l.von && f.von < l.bis);
      const wo = f.von >= g.hashtagsVon && g.hashtagsVon >= 0 ? 'Hashtags' : lage ? (ABSCHNITT_ARTEN[lage.art] || {}).name || lage.art : '';
      return `<li class="fund fund--${f.stufe}" data-fund="${i}"><span class="fund__stufe">${f.stufe === 'fehler' ? 'raus' : f.stufe === 'pruefen' ? 'prüfen' : 'Hinweis'}</span>
        <div><div class="fund__titel">${esc(f.titel)}</div>${f.zitat ? `<div class="fund__zitat">«${esc(f.zitat)}»</div>` : ''}<div class="fund__tipp">${esc(f.tipp)}</div>${wo ? `<div class="fund__wo">${esc(wo)}</div>` : ''}</div></li>`;
    }).join('');
    $('pruefung-gut').hidden = p.funde.length > 0 || !g.text;
  }

  async function zeichneGrafik() {
    const e = zustand.entwurf;
    const p = projekt(e.projekt_id);
    const [av, an] = await Promise.all([bildAdresse(e.bilder.vorher), bildAdresse(e.bilder.nachher)]);
    const [iv, inn, logo] = await Promise.all([bildLaden(av), bildLaden(an), bildLaden('/zentrale/zentrale/oberflaeche/kleid/anker/anker-weiss.png')]);
    try { await Promise.all([document.fonts.load('500 48px "Antonio"'), document.fonts.load('400 20px "DM Mono"'), document.fonts.load('400 22px "Instrument Sans"')]); } catch (x) { /* Schrift fehlt, Ersatz reicht */ }

    const quer = e.grafik !== 'quadrat';
    const W = quer ? 1200 : 1080, H = quer ? 628 : 1080;
    const c = $('leinwand'); c.width = W; c.height = H;
    const k = c.getContext('2d');
    const stil = getComputedStyle(document.documentElement);
    const farbe = n => stil.getPropertyValue(n).trim();
    k.fillStyle = farbe('--nacht'); k.fillRect(0, 0, W, H);

    const rand = quer ? 36 : 48, kopf = quer ? 84 : 120, fuss = quer ? 54 : 72, luecke = quer ? 20 : 24;
    const titel = p ? p.name : 'Vorher und nachher';
    k.fillStyle = farbe('--creme'); k.textBaseline = 'alphabetic';
    k.font = `500 ${quer ? 40 : 54}px "Antonio", "Instrument Sans", sans-serif`;
    k.fillText(titel.toUpperCase(), rand, quer ? 56 : 82);
    k.font = `400 ${quer ? 15 : 18}px "DM Mono", monospace`;
    k.fillStyle = farbe('--gold');
    const unter = p ? `${p.ort} · Seite neu seit ${datumKurz(p.fertig)}`.toUpperCase() : '';
    k.textAlign = 'right'; k.fillText(unter, W - rand, quer ? 56 : 82); k.textAlign = 'left';

    const felder = [];
    const innenB = W - 2 * rand, innenH = H - kopf - fuss;
    if (quer) {
      const b = (innenB - luecke) / 2;
      felder.push({ x: rand, y: kopf, w: b, h: innenH }, { x: rand + b + luecke, y: kopf, w: b, h: innenH });
    } else {
      const h = (innenH - luecke) / 2;
      felder.push({ x: rand, y: kopf, w: innenB, h }, { x: rand, y: kopf + h + luecke, w: innenB, h });
    }
    [[iv, 'VORHER'], [inn, 'NACHHER']].forEach(([im, name], i) => {
      const f = felder[i], etikett = quer ? 34 : 40;
      const bh = f.h - etikett;
      k.save();
      k.beginPath(); k.roundRect(f.x, f.y, f.w, bh, 14); k.clip();
      k.fillStyle = farbe('--flaeche'); k.fillRect(f.x, f.y, f.w, bh);
      if (im) {
        const s = Math.max(f.w / im.width, bh / im.height);
        const dw = im.width * s, dh = im.height * s;
        k.drawImage(im, f.x, f.y, dw, dh);   // oben links verankert: bei Bildschirmfotos ist dort das Wichtige
      } else {
        k.fillStyle = farbe('--leise'); k.font = '400 18px "Instrument Sans", sans-serif'; k.textAlign = 'center';
        k.fillText('Kein Bild', f.x + f.w / 2, f.y + bh / 2); k.textAlign = 'left';
      }
      k.restore();
      k.strokeStyle = farbe('--linie'); k.lineWidth = 1; k.beginPath(); k.roundRect(f.x + .5, f.y + .5, f.w - 1, bh - 1, 14); k.stroke();
      k.fillStyle = i ? farbe('--gold') : farbe('--leise');
      k.font = `400 ${quer ? 14 : 16}px "DM Mono", monospace`;
      k.fillText(name.split('').join(String.fromCharCode(8202)), f.x, f.y + bh + (quer ? 24 : 28));
    });

    k.fillStyle = farbe('--leise'); k.font = `400 ${quer ? 13 : 15}px "DM Mono", monospace`;
    k.fillText('TASTY STUDIOS'.split('').join(String.fromCharCode(8202)), rand, H - (quer ? 20 : 26));
    if (logo) { const g = quer ? 26 : 32; k.drawImage(logo, W - rand - g, H - (quer ? 20 : 26) - g + 4, g, g); }

    zustand.grafikUrl = c.toDataURL('image/png');
    $('post-grafik').src = zustand.grafikUrl;
    const a = $('grafik-speichern');
    a.href = zustand.grafikUrl;
    a.download = `${(p ? p.id : 'haus')}-vorher-nachher-${quer ? '1200x628' : '1080x1080'}.png`;
  }

  async function zeichneAlles() {
    zeichneVorschau();
    await zeichneGrafik();
  }

  /* ---------- Quittung ---------- */

  function unterschiede(v, n) {
    const z = [];
    if (!v) return ['neu angelegt'];
    if (!n) return ['gelöscht'];
    if (v.stand !== n.stand) z.push(`Stand: ${STAND_NAME[v.stand]} → ${STAND_NAME[n.stand]}`);
    if (v.projekt_id !== n.projekt_id) z.push(`Haus: ${(projekt(v.projekt_id) || {}).name || '–'} → ${(projekt(n.projekt_id) || {}).name || '–'}`);
    const tv = gesamttext(v).text, tn = gesamttext(n).text;
    if (tv !== tn) z.push(`Text: ${tv.length.toLocaleString('de-DE')} → ${tn.length.toLocaleString('de-DE')} Zeichen`);
    if (JSON.stringify(v.stichpunkte) !== JSON.stringify(n.stichpunkte)) z.push(`Stichpunkte: ${v.stichpunkte.length} → ${n.stichpunkte.length}`);
    for (const s of ['vorher', 'nachher']) if (JSON.stringify(v.bilder[s] || null) !== JSON.stringify(n.bilder[s] || null)) z.push(`Bild ${s} geändert`);
    if (v.grafik !== n.grafik) z.push(`Grafik: ${v.grafik} → ${n.grafik}`);
    if (v.vorlage !== n.vorlage) z.push('Vorlage geändert');
    return z.length ? z : ['keine Änderung am Inhalt'];
  }

  function zeigeQuittung(titel, zeilen, quittung) {
    zustand.quittung = quittung;
    $('quittung-titel').textContent = titel;
    $('quittung-liste').innerHTML = zeilen.map(z => `<li>${esc(z)}</li>`).join('');
    $('quittung-zurueck').hidden = !quittung;
    $('quittung').hidden = false;
  }

  async function rueckgaengig() {
    const q = zustand.quittung;
    if (!q) return;
    try {
      if (q.aktion === 'speichern') {
        const a = await api('PUT', 'entwurf', q.vorher);
        await ladeArchiv();
        if (zustand.entwurf && zustand.entwurf.id === a.entwurf.id) await oeffne(a.entwurf);
        zeigeQuittung('Zurückgenommen', unterschiede(q.nachher, a.entwurf), { aktion: 'speichern', vorher: q.nachher, nachher: a.entwurf });
      } else if (q.aktion === 'anlegen') {
        await api('DELETE', 'entwurf', { id: q.nachher.id });
        await ladeArchiv();
        zeigeArchiv();
        zeigeQuittung('Zurückgenommen: der neue Entwurf ist wieder weg', ['gelöscht'], { aktion: 'loeschen', vorher: q.nachher, nachher: null });
      } else if (q.aktion === 'loeschen') {
        const a = await api('POST', 'entwurf', q.vorher);
        await ladeArchiv();
        zeigeArchiv();
        zeigeQuittung('Zurückgenommen: der Entwurf ist wieder da', ['wiederhergestellt'], { aktion: 'anlegen', vorher: null, nachher: a.entwurf });
      }
    } catch (x) {
      zeigeQuittung('Das ging nicht: ' + x.message, [], null);
    }
    if (!$('ansicht-archiv').hidden) baueArchiv();
  }

  /* ---------- Rückfrage ---------- */

  function frage(text) {
    return new Promise(res => {
      $('rueckfrage-text').textContent = text;
      $('rueckfrage').hidden = false;
      const zu = antwort => { $('rueckfrage').hidden = true; $('rueckfrage-ja').onclick = $('rueckfrage-nein').onclick = null; res(antwort); };
      $('rueckfrage-ja').onclick = () => zu(true);
      $('rueckfrage-nein').onclick = () => zu(false);
      $('rueckfrage-ja').focus();
    });
  }

  /* ---------- Speichern, Löschen ---------- */

  function liesFormular() {
    const e = zustand.entwurf;
    e.stichpunkte = $('f-stichpunkte').value.split('\n').map(s => s.trim()).filter(Boolean);
    e.hashtags = $('f-hashtags').value.trim();
    document.querySelectorAll('#abschnitte textarea').forEach(t => { e.abschnitte[+t.dataset.i].text = t.value; });
    const stand = document.querySelector('input[name="stand"]:checked');
    e.stand = stand ? stand.value : 'entwurf';
  }

  async function speichern() {
    liesFormular();
    const e = zustand.entwurf;
    const neu = !!e.neu;
    const daten = saubereKopie(e);
    daten.bearbeiter = WER;
    try {
      const a = neu ? await api('POST', 'entwurf', daten) : await api('PUT', 'entwurf', daten);
      await ladeArchiv();
      const vorher = a.quittung.vorher;
      zustand.entwurf = JSON.parse(JSON.stringify(a.entwurf));
      zustand.gespeichert = JSON.stringify(saubereKopie(zustand.entwurf));
      $('loeschen').hidden = false;
      history.replaceState(null, '', location.pathname + '?entwurf=' + a.entwurf.id + (WER !== 'Robert' ? '&wer=' + WER : ''));
      zeigeStandSatz();
      zeigeQuittung(neu ? 'Angelegt' : 'Gespeichert', unterschiede(vorher, a.entwurf), { aktion: neu ? 'anlegen' : 'speichern', vorher, nachher: a.entwurf });
    } catch (x) {
      zeigeQuittung('Speichern ging nicht: ' + x.message, [], null);
    }
  }

  async function loeschen() {
    const e = zustand.entwurf;
    const p = projekt(e.projekt_id);
    if (!await frage(`Diesen Entwurf zu ${p ? p.name : 'diesem Haus'} wirklich löschen? Du kannst es in der Quittung rückgängig machen.`)) return;
    try {
      const a = await api('DELETE', 'entwurf', { id: e.id });
      await ladeArchiv();
      zeigeArchiv();
      zeigeQuittung('Gelöscht', unterschiede(a.quittung.vorher, null), { aktion: 'loeschen', vorher: a.quittung.vorher, nachher: null });
    } catch (x) {
      zeigeQuittung('Löschen ging nicht: ' + x.message, [], null);
    }
  }

  function istGeaendert() {
    if (!zustand.entwurf) return false;
    liesFormular();
    return JSON.stringify(saubereKopie(zustand.entwurf)) !== zustand.gespeichert;
  }

  /* ---------- Bilder ---------- */

  function bildMeldung(text, fehler) {
    const m = $('bild-meldung');
    m.textContent = text; m.hidden = !text; m.classList.toggle('ist-fehler', !!fehler);
  }

  async function bildSetzen(seite, bild) {
    zustand.entwurf.bilder[seite] = bild;
    await zeigeBilder();
    await zeichneGrafik();
  }

  function dateiAlsAdresse(datei) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(datei); });
  }

  /* ---------- Ereignisse ---------- */

  function verdrahte() {
    $('zum-archiv').addEventListener('click', async () => {
      if (istGeaendert() && !await frage('Der Entwurf hat ungespeicherte Änderungen. Ohne Speichern ins Archiv?')) return;
      zeigeArchiv();
    });
    $('neu').addEventListener('click', async () => {
      if (!$('ansicht-entwurf').hidden && istGeaendert() && !await frage('Der Entwurf hat ungespeicherte Änderungen. Ohne Speichern einen neuen anfangen?')) return;
      oeffne(neuerEntwurf());
    });

    document.querySelectorAll('[data-stand]').forEach(k => k.addEventListener('click', () => {
      zustand.filter = k.dataset.stand;
      document.querySelectorAll('[data-stand]').forEach(x => x.classList.toggle('ist-aktiv', x === k));
      baueArchiv();
    }));
    $('archiv-liste').addEventListener('click', ev => {
      const li = ev.target.closest('.eintrag');
      if (!li) return;
      const e = zustand.entwuerfe.find(x => x.id === li.dataset.id);
      if (e) oeffne(e);
    });
    $('archiv-liste').addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.classList.contains('eintrag')) ev.target.click(); });

    $('f-projekt').addEventListener('change', async () => {
      const e = zustand.entwurf;
      e.projekt_id = $('f-projekt').value;
      const p = projekt(e.projekt_id);
      zeigeHaus();
      if (p && await frage(`Bilder und Stichpunkte von ${p.name} übernehmen? Der Text bleibt, wie er ist.`)) {
        e.stichpunkte = p.anders.slice();
        $('f-stichpunkte').value = e.stichpunkte.join('\n'); autoHoehe($('f-stichpunkte'));
        e.bilder = { vorher: { art: 'pfad', wert: p.vorher.bild }, nachher: { art: 'pfad', wert: p.nachher.bild } };
        await zeigeBilder();
      }
      await zeichneAlles();
    });

    $('f-stichpunkte').addEventListener('input', () => { autoHoehe($('f-stichpunkte')); liesFormular(); zeichneVorschau(); });
    $('stichpunkte-haus').addEventListener('click', () => {
      const p = projekt(zustand.entwurf.projekt_id);
      if (!p) return;
      $('f-stichpunkte').value = p.anders.join('\n'); autoHoehe($('f-stichpunkte'));
      liesFormular(); zeichneVorschau();
    });

    $('vorlagen').addEventListener('change', ev => { if (ev.target.name === 'vorlage') zustand.entwurf.vorlage = ev.target.value; });
    $('vorlage-bauen').addEventListener('click', async () => {
      liesFormular();
      const e = zustand.entwurf;
      const hatText = e.abschnitte.some(a => a.text.trim());
      if (hatText && !await frage(`Den Text neu aus der Vorlage «${vorlage(e.vorlage).name}» bauen? Der jetzige Text wird ersetzt. Gespeichertes bleibt, bis du speicherst.`)) return;
      e.abschnitte = baueAbschnitte(e.vorlage, werte());
      baueAbschnitteFormular();
      zeichneVorschau();
    });

    $('abschnitte').addEventListener('input', ev => {
      if (ev.target.tagName !== 'TEXTAREA') return;
      autoHoehe(ev.target);
      zustand.entwurf.abschnitte[+ev.target.dataset.i].text = ev.target.value;
      zeichneVorschau();
    });
    $('abschnitte').addEventListener('click', async ev => {
      const k = ev.target.closest('[data-tu]');
      if (!k) return;
      liesFormular();
      const e = zustand.entwurf, i = +k.dataset.i, a = e.abschnitte[i];
      if (k.dataset.tu === 'fassung') {
        const n = naechsteFassung(e.vorlage, a.art, a.fassung, werte());
        if (n.anzahl < 2 && n.text === a.text) { return; }
        a.fassung = n.fassung; a.text = n.text;
      } else if (k.dataset.tu === 'hoch' && i > 0) {
        [e.abschnitte[i - 1], e.abschnitte[i]] = [e.abschnitte[i], e.abschnitte[i - 1]];
      } else if (k.dataset.tu === 'runter' && i < e.abschnitte.length - 1) {
        [e.abschnitte[i + 1], e.abschnitte[i]] = [e.abschnitte[i], e.abschnitte[i + 1]];
      } else if (k.dataset.tu === 'weg') {
        if (a.text.trim() && !await frage(`Den Abschnitt «${(ABSCHNITT_ARTEN[a.art] || {}).name || a.art}» entfernen?`)) return;
        e.abschnitte.splice(i, 1);
      }
      baueAbschnitteFormular();
      zeichneVorschau();
    });
    $('abschnitt-neu').addEventListener('click', () => {
      liesFormular();
      const art = $('abschnitt-art').value;
      const e = zustand.entwurf;
      const v = vorlage(e.vorlage);
      const text = v.abschnitte[art] ? fuelle(v.abschnitte[art][0], werte()) : '';
      e.abschnitte.push({ art, fassung: 0, text });
      baueAbschnitteFormular();
      zeichneVorschau();
      const t = document.querySelector(`#abschnitte textarea[data-i="${e.abschnitte.length - 1}"]`);
      if (t) t.focus();
    });

    $('f-hashtags').addEventListener('input', () => { liesFormular(); zeichneVorschau(); });
    document.querySelectorAll('input[name="stand"]').forEach(r => r.addEventListener('change', () => { liesFormular(); zeigeStandSatz(); }));

    $('speichern').addEventListener('click', speichern);
    $('loeschen').addEventListener('click', loeschen);
    $('kopieren').addEventListener('click', async () => {
      liesFormular();
      const t = gesamttext(zustand.entwurf).text;
      try { await navigator.clipboard.writeText(t); zeigeQuittung('Text kopiert', [`${t.length.toLocaleString('de-DE')} Zeichen in der Zwischenablage. Auf LinkedIn einfügen, Bild dazu, Link in den ersten Kommentar.`], null); }
      catch (x) { zeigeQuittung('Kopieren ging nicht', ['Text markieren und mit der Tastatur kopieren.'], null); }
    });

    // Bilder
    document.querySelectorAll('[data-bild="haus"]').forEach(k => k.addEventListener('click', () => {
      const p = projekt(zustand.entwurf.projekt_id);
      if (p) bildSetzen(k.dataset.seite, { art: 'pfad', wert: p[k.dataset.seite].bild });
    }));
    document.querySelectorAll('[data-bild="link"]').forEach(k => k.addEventListener('click', () => {
      const box = $('bild-link-' + k.dataset.seite);
      box.hidden = !box.hidden;
      if (!box.hidden) $('bild-url-' + k.dataset.seite).focus();
    }));
    document.querySelectorAll('[data-bild="holen"]').forEach(k => k.addEventListener('click', async () => {
      const seite = k.dataset.seite, url = $('bild-url-' + seite).value.trim();
      if (!url) return;
      bildMeldung('Bild wird geholt …');
      try {
        const a = await api('POST', 'bild-holen', { url });
        await bildSetzen(seite, { art: 'ablage', wert: a.id });
        $('bild-link-' + seite).hidden = true;
        bildMeldung('');
      } catch (x) { bildMeldung(x.message, true); }
    }));
    document.querySelectorAll('[data-bild="datei"]').forEach(inp => inp.addEventListener('change', async () => {
      const datei = inp.files[0];
      if (!datei) return;
      bildMeldung('Bild wird abgelegt …');
      try {
        const daten = await dateiAlsAdresse(datei);
        const a = await api('POST', 'bild', { name: datei.name, daten });
        await bildSetzen(inp.dataset.seite, { art: 'ablage', wert: a.id });
        bildMeldung('');
      } catch (x) { bildMeldung(x.message, true); }
      inp.value = '';
    }));

    // Vorschau
    document.querySelectorAll('[data-geraet]').forEach(k => k.addEventListener('click', () => {
      zustand.geraet = k.dataset.geraet;
      document.querySelectorAll('[data-geraet]').forEach(x => x.classList.toggle('ist-aktiv', x === k));
      $('geraet').className = 'geraet geraet--' + zustand.geraet;
    }));
    $('post-mehr').addEventListener('click', () => {
      const zu = $('post-text').classList.toggle('ist-zu');
      $('post-mehr').textContent = zu ? '…mehr anzeigen' : 'weniger anzeigen';
    });
    document.querySelectorAll('[data-grafik]').forEach(k => k.addEventListener('click', async () => {
      zustand.entwurf.grafik = k.dataset.grafik;
      document.querySelectorAll('[data-grafik]').forEach(x => x.classList.toggle('ist-aktiv', x === k));
      await zeichneGrafik();
    }));

    // Fund anklicken: Stelle im Text zeigen
    const zeigeFund = i => {
      const f = zustand.pruefung && zustand.pruefung.funde[i];
      if (!f) return;
      document.querySelectorAll('.post mark.ist-markiert, .abschnitt.ist-markiert').forEach(x => x.classList.remove('ist-markiert'));
      const m = document.querySelector(`.post mark[data-fund="${i}"]`);
      if (m) { $('post-text').classList.remove('ist-zu'); $('post-mehr').textContent = 'weniger anzeigen'; m.classList.add('ist-markiert'); }
      const lage = zustand.pruefung.lagen.find(l => f.von >= l.von && f.von < l.bis);
      if (lage) {
        const box = document.querySelector(`.abschnitt[data-i="${lage.i}"]`);
        const t = box && box.querySelector('textarea');
        if (t) {
          box.classList.add('ist-markiert');
          const text = zustand.entwurf.abschnitte[lage.i].text;
          const versatz = text.indexOf(text.trim());
          t.focus({ preventScroll: true });
          t.setSelectionRange(versatz + f.von - lage.von, versatz + Math.min(f.bis, lage.bis) - lage.von);
          box.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      } else if (f.von >= zustand.pruefung.text.length - ($('f-hashtags').value.length + 1)) {
        $('f-hashtags').focus();
      }
    };
    $('funde').addEventListener('click', ev => { const li = ev.target.closest('.fund'); if (li) zeigeFund(+li.dataset.fund); });
    $('post-text').addEventListener('click', ev => { const m = ev.target.closest('mark'); if (m) zeigeFund(+m.dataset.fund); });

    // Quittung
    $('quittung-zurueck').addEventListener('click', rueckgaengig);
    $('quittung-zu').addEventListener('click', () => { $('quittung').hidden = true; });

    window.addEventListener('beforeunload', ev => { if (!$('ansicht-entwurf').hidden && istGeaendert()) { ev.preventDefault(); ev.returnValue = ''; } });
  }

  /* ---------- Start ---------- */

  async function start() {
    try {
      const [p] = await Promise.all([api('GET', 'projekte'), ladeArchiv()]);
      zustand.projekte = p.projekte;
    } catch (x) {
      document.body.innerHTML = `<p style="padding:40px">Der Server antwortet nicht: ${esc(x.message)}. Starten mit <code>python3 zentrale/server.py</code>.</p>`;
      document.documentElement.classList.remove('wartet');
      return;
    }
    verdrahte();
    const gewuenscht = new URLSearchParams(location.search).get('entwurf');
    const e = gewuenscht && zustand.entwuerfe.find(x => x.id === gewuenscht);
    try { await document.fonts.ready; } catch (x) { /* ohne Schrift weiter */ }
    if (e) await oeffne(e); else zeigeArchiv();
    document.documentElement.classList.remove('wartet');
  }

  start();
})();
