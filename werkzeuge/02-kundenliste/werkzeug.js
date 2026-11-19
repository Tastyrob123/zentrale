/* Kundenliste: Oberfläche. Spricht mit /api/02-kundenliste/ (api.py). Jede Änderung zeigt eine Quittung mit Rückgängig. */
(function () {
  'use strict';
  const API = '/zentrale/api/02-kundenliste/';
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);

  let D = { haeuser: [], staende: [], heute: '', quelle: '' };
  let wer = params.get('wer') || localStorage.getItem('kundenliste.wer') || 'Robert';
  let ansicht = localStorage.getItem('kundenliste.ansicht') || 'liste';
  let sortierung = { feld: 'datum', auf: true };
  const filter = { stand: '', faellig: '', art: '', text: '' };
  let offenId = null;          // Haus in der Tafel, null = neues Haus
  let rueckgaengig = null;     // Funktion, die die letzte Änderung zurücknimmt
  let quittungUhr = null;

  // ---------- Helfer ----------
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const deDatum = (iso) => iso ? iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4) : '';
  const deZeit = (iso) => iso ? deDatum(iso) + (iso.length > 10 ? ', ' + iso.slice(11, 16) : '') : '';
  const tage = (iso) => Math.round((Date.parse(iso) - Date.parse(D.heute)) / 86400000);

  function faelligkeit(h) {
    const d = (h.naechster_schritt || {}).datum;
    if (!d) return 'ohne';
    if (h.stand === 'abgesagt') return 'spaeter';
    const n = tage(d);
    if (n < 0) return 'ueberfaellig';
    if (n === 0) return 'heute';
    if (n <= 7) return 'woche';
    return 'spaeter';
  }
  function datumHtml(h) {
    const d = (h.naechster_schritt || {}).datum;
    if (!d) return '<span class="datum ohne">ohne Datum</span>';
    const f = faelligkeit(h);
    const kl = f === 'ueberfaellig' ? ' faellig-ueber' : f === 'heute' ? ' faellig-heute' : '';
    const zusatz = f === 'ueberfaellig' ? ' (' + (-tage(d)) + (tage(d) === -1 ? ' Tag' : ' Tage') + ' her)' : f === 'heute' ? ' (heute)' : '';
    return '<span class="datum' + kl + '">' + deDatum(d) + zusatz + '</span>';
  }

  async function api(methode, weg, daten) {
    const r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: methode === 'GET' ? undefined : JSON.stringify({ wer, ...(daten || {}) }) });
    let a = {};
    try { a = await r.json(); } catch (_) { /* leere Antwort */ }
    if (!r.ok) throw new Error(a.fehler || ('Fehler ' + r.status));
    return a;
  }
  const haus = (id) => D.haeuser.find((h) => h.id === id);

  // ---------- Laden und Zeichnen ----------
  async function lade() {
    D = await api('GET', 'haeuser');
    zeichne();
  }

  function gefiltert() {
    const t = filter.text.trim().toLowerCase();
    return D.haeuser.filter((h) => {
      if (filter.stand && h.stand !== filter.stand) return false;
      if (filter.art && h.art !== filter.art) return false;
      if (filter.faellig && faelligkeit(h) !== filter.faellig) return false;
      if (t) {
        const ap = h.ansprechpartner || {};
        const heu = [h.name, h.ort, h.kuerzel, ap.name, ap.mail, ap.rolle].join(' ').toLowerCase();
        if (!heu.includes(t)) return false;
      }
      return true;
    });
  }

  function sortiert(liste) {
    const rang = { ueberfaellig: 0, heute: 1, woche: 2, spaeter: 3, ohne: 4 };
    const wert = (h) => {
      switch (sortierung.feld) {
        case 'name': return h.name.toLowerCase();
        case 'art': return h.art + h.name.toLowerCase();
        case 'stand': return D.staende.indexOf(h.stand);
        case 'person': return ((h.ansprechpartner || {}).name || 'zzz').toLowerCase();
        case 'geaendert': return h.geaendert || '';
        default: return rang[faelligkeit(h)] + ((h.naechster_schritt || {}).datum || '9999') + h.name.toLowerCase();
      }
    };
    return liste.slice().sort((a, b) => {
      const x = wert(a), y = wert(b);
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sortierung.auf ? r : -r;
    });
  }

  function zeichne() {
    zeichneKopf();
    zeichneHeute();
    zeichneListe();
    zeichneBrett();
    zeichneFuss();
  }

  function zeichneKopf() {
    const n = D.haeuser.length;
    const f = D.haeuser.filter((h) => ['ueberfaellig', 'heute'].includes(faelligkeit(h))).length;
    $('#kopf-satz').textContent = (n === 1 ? 'Ein Haus' : n + ' Häuser') + (f ? ', ' + (f === 1 ? 'eins fällig' : f + ' fällig') : ', nichts fällig');
    document.querySelectorAll('#wer button').forEach((b) => b.classList.toggle('an', b.dataset.wer === wer));
    document.querySelectorAll('.ansichten button').forEach((b) => b.classList.toggle('an', b.dataset.ansicht === ansicht));
    $('#liste').hidden = ansicht !== 'liste';
    $('#brett').hidden = ansicht !== 'brett';
  }

  function zeichneHeute() {
    const liste = sortiert(D.haeuser.filter((h) => ['ueberfaellig', 'heute'].includes(faelligkeit(h))));
    $('#heute').hidden = liste.length === 0;
    $('#heute-liste').innerHTML = liste.map((h) => '<li>' + datumHtml(h).replace('class="datum', 'class="wann') +
      '<div><button type="button" data-id="' + e(h.id) + '">' + e(h.name) + '</button> <span class="schritt">' + e((h.naechster_schritt || {}).text || 'nächster Schritt ohne Text') + '</span></div></li>').join('');
  }

  function zeichneListe() {
    const liste = sortiert(gefiltert());
    $('#liste-leer').hidden = liste.length > 0;
    document.querySelectorAll('.tabelle th').forEach((th) => {
      th.classList.toggle('sort-auf', th.dataset.sort === sortierung.feld && sortierung.auf);
      th.classList.toggle('sort-ab', th.dataset.sort === sortierung.feld && !sortierung.auf);
    });
    $('#liste-koerper').innerHTML = liste.map((h) => {
      const ap = h.ansprechpartner || {};
      const s = h.naechster_schritt || {};
      return '<tr data-id="' + e(h.id) + '">' +
        '<td class="zelle-haus"><span class="haus-name">' + e(h.name) + '</span><span class="haus-ort">' + e(h.ort || 'Ort offen') + '</span></td>' +
        '<td data-l="Art">' + e(h.art) + '</td>' +
        '<td data-l="Stand" class="stand-' + e(h.stand.replace(/\s/g, '-')) + '">' + e(h.stand) + '</td>' +
        '<td data-l="Nächster Schritt">' + datumHtml(h) + (s.text ? '<span class="neben">' + e(s.text) + '</span>' : '') + '</td>' +
        '<td data-l="Ansprechpartner">' + (ap.name ? e(ap.name) : '<span class="ohne">noch niemand</span>') + (ap.mail ? '<span class="neben">' + e(ap.mail) + '</span>' : '') + '</td>' +
        '<td data-l="Zuletzt"><span class="datum">' + e(deZeit(h.geaendert)) + '</span></td></tr>';
    }).join('');
  }

  function zeichneBrett() {
    const liste = sortiert(gefiltert());
    const spalten = D.staende.filter((s) => s !== 'offen' || D.haeuser.some((h) => h.stand === 'offen'));
    $('#brett').innerHTML = spalten.map((s) => {
      const karten = liste.filter((h) => h.stand === s);
      return '<div class="spalte" data-stand="' + e(s) + '"><div class="spalte-kopf"><strong>' + e(s) + '</strong><span>' + karten.length + '</span></div><div class="karten">' +
        karten.map((h) => '<div class="karte" draggable="true" data-id="' + e(h.id) + '"><strong>' + e(h.name) + '</strong><span class="leise">' + e(h.ort || 'Ort offen') + ' · ' + e(h.art) + '</span>' +
          ((h.naechster_schritt || {}).datum || (h.naechster_schritt || {}).text ? '<div class="schritt">' + datumHtml(h) + '<span>' + e((h.naechster_schritt || {}).text) + '</span></div>' : '') + '</div>').join('') +
        '</div></div>';
    }).join('');
  }

  function zeichneFuss() {
    const probe = D.haeuser.filter((h) => h.probe).length;
    $('#fuss-satz').textContent = D.quelle === 'probedaten' || probe === D.haeuser.length && probe > 0
      ? 'Zurzeit Probedaten (' + probe + ' erfundene Häuser). Die echten Häuser kommen mit «Echte Häuser übernehmen».'
      : 'Daten liegen in daten/02-kundenliste/haeuser.json' + (probe ? ', davon ' + probe + ' noch aus den Probedaten' : '') + '.';
  }

  // ---------- Quittung ----------
  function quittung(titel, zeilen, zurueck) {
    $('#quittung-titel').textContent = titel;
    $('#quittung-liste').innerHTML = (zeilen || []).map((z) => '<li>' + z + '</li>').join('');
    $('#quittung-zurueck').hidden = !zurueck;
    rueckgaengig = zurueck || null;
    const q = $('#quittung');
    q.hidden = false;
    requestAnimationFrame(() => q.classList.add('an'));
    clearTimeout(quittungUhr);
    quittungUhr = setTimeout(quittungZu, zurueck ? 20000 : 8000);
  }
  function quittungZu() {
    const q = $('#quittung');
    q.classList.remove('an');
    clearTimeout(quittungUhr);
    setTimeout(() => { if (!q.classList.contains('an')) q.hidden = true; }, 320);
  }
  const zeileAenderung = (a) => e(a.feld) + ': <em>' + e(a.vorher || 'leer') + '</em> → <em>' + e(a.nachher || 'leer') + '</em>';

  function frage(text) {
    return new Promise((loes) => {
      $('#frage-text').textContent = text;
      $('#frage').hidden = false;
      const fertig = (antwort) => { $('#frage').hidden = true; $('#frage-ja').onclick = $('#frage-nein').onclick = null; loes(antwort); };
      $('#frage-ja').onclick = () => fertig(true);
      $('#frage-nein').onclick = () => fertig(false);
      $('#frage-ja').focus();
    });
  }

  function fehler(err) {
    quittung('Das hat nicht geklappt', [e(err.message || err)], null);
  }

  // ---------- Tafel ----------
  const F = () => $('#formular');
  function tafelAuf(id) {
    offenId = id;
    const h = id ? haus(id) : null;
    const f = F();
    f.reset();
    $('#nur-bestehend').hidden = !h;
    $('#loeschen').hidden = !h;
    $('#tafel-titel').textContent = h ? h.name : 'Neues Haus';
    $('#tafel-unter').textContent = h ? [h.ort, h.art, h.quelle ? 'aus ' + h.quelle : ''].filter(Boolean).join(' · ') : 'Name, Ort und Art reichen für den Anfang.';
    $('#tafel-links').innerHTML = h ? [h.website ? '<a href="' + e(h.website) + '" target="_blank" rel="noopener">Website</a>' : '', h.entwurf ? '<a href="' + e(h.entwurf) + '" target="_blank" rel="noopener">Entwurf</a>' : '',
      (h.ansprechpartner || {}).mail ? '<a href="mailto:' + e(h.ansprechpartner.mail) + '">Mail schreiben</a>' : ''].filter(Boolean).join('') : '';
    if (h) {
      const ap = h.ansprechpartner || {}, s = h.naechster_schritt || {};
      f.name.value = h.name; f.ort.value = h.ort || ''; f.art.value = h.art; f.kuerzel.value = h.kuerzel || '';
      f.website.value = h.website || ''; f.entwurf.value = h.entwurf || '';
      f.ap_name.value = ap.name || ''; f.ap_rolle.value = ap.rolle || ''; f.ap_mail.value = ap.mail || ''; f.ap_telefon.value = ap.telefon || '';
      f.stand.value = h.stand; f.ns_datum.value = s.datum || ''; f.ns_text.value = s.text || '';
      zeichneNotizen(h);
    } else {
      f.stand.value = 'gefunden';
    }
    $('#speichern-hinweis').textContent = '';
    $('#schleier').classList.add('an');
    $('#tafel').classList.add('an');
    $('#tafel').scrollTop = 0;
    setTimeout(() => f.name.focus({ preventScroll: true }), 350);
  }
  function tafelZu() {
    $('#schleier').classList.remove('an');
    $('#tafel').classList.remove('an');
    offenId = null;
    if (params.has('haus')) { params.delete('haus'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '')); }
  }
  function zeichneNotizen(h) {
    const notizen = (h.notizen || []).slice().reverse();
    $('#notizen').innerHTML = notizen.length ? notizen.map((n) => '<li><span class="meta">' + e(n.wer) + ' · ' + e(deZeit(n.wann)) + '</span><p>' + e(n.text) + '</p></li>').join('') : '<li class="leise">Noch keine Notiz.</li>';
    const verlauf = (h.verlauf || []).slice().reverse();
    $('#verlauf').innerHTML = verlauf.length ? verlauf.map((v) => '<li><span class="meta">' + e(deZeit(v.wann)) + ' · ' + e(v.wer) + '</span>' + e(v.was) + '</li>').join('') : '<li class="leise">Noch nichts.</li>';
    const b = h.besuche || {};
    $('#besuche').textContent = b.anzahl == null ? 'Noch nicht erfasst. Werkzeug 03 trägt hier später ein, wer den Entwurf geöffnet hat, über das Kürzel «' + (h.kuerzel || '') + '».'
      : b.anzahl + ' Besuche, zuletzt ' + deZeit(b.letzter);
  }
  function formularDaten() {
    const f = F();
    return {
      name: f.name.value.trim(), ort: f.ort.value.trim(), art: f.art.value, kuerzel: f.kuerzel.value.trim(),
      website: f.website.value.trim(), entwurf: f.entwurf.value.trim(), stand: f.stand.value,
      ansprechpartner: { name: f.ap_name.value.trim(), rolle: f.ap_rolle.value.trim(), mail: f.ap_mail.value.trim(), telefon: f.ap_telefon.value.trim() },
      naechster_schritt: { text: f.ns_text.value.trim(), datum: f.ns_datum.value },
    };
  }

  async function speichern(ev) {
    ev.preventDefault();
    const daten = formularDaten();
    if (!daten.name) { $('#speichern-hinweis').textContent = 'Ein Name fehlt.'; return; }
    $('#speichern').disabled = true;
    try {
      if (offenId) {
        const id = offenId;
        const a = await api('PUT', 'haeuser/' + id, daten);
        await lade();
        if (a.aenderungen.length) {
          quittung(a.nachher.name + ' gespeichert', a.aenderungen.map(zeileAenderung), async () => {
            await api('POST', 'wiederherstellen', { haus: a.vorher }); await lade(); if (offenId === id) tafelAuf(id);
            quittung(a.vorher.name + ': zurückgenommen', a.aenderungen.map((x) => zeileAenderung({ feld: x.feld, vorher: x.nachher, nachher: x.vorher })), null);
          });
        } else {
          quittung('Nichts geändert', [], null);
        }
        if (offenId === id) tafelAuf(id);
      } else {
        const a = await api('POST', 'haeuser', daten);
        await lade();
        tafelAuf(a.haus.id);
        quittung(a.haus.name + ' angelegt', ['Stand: <em>' + e(a.haus.stand) + '</em>' + (a.haus.ort ? ', Ort: <em>' + e(a.haus.ort) + '</em>' : '')], async () => {
          await api('DELETE', 'haeuser/' + a.haus.id); await lade(); if (offenId === a.haus.id) tafelZu();
          quittung(a.haus.name + ' wieder entfernt', [], null);
        });
      }
    } catch (err) { fehler(err); }
    $('#speichern').disabled = false;
  }

  async function loeschen() {
    const h = haus(offenId);
    if (!h) return;
    if (!(await frage('«' + h.name + '» wirklich aus der Liste löschen?\nMit «Rückgängig» in der Quittung kommt es zurück, danach ist es weg.'))) return;
    try {
      const a = await api('DELETE', 'haeuser/' + h.id);
      tafelZu();
      await lade();
      quittung(a.vorher.name + ' gelöscht', ['Stand war <em>' + e(a.vorher.stand) + '</em>, ' + (a.vorher.notizen || []).length + ' Notizen'], async () => {
        await api('POST', 'wiederherstellen', { haus: a.vorher }); await lade();
        quittung(a.vorher.name + ' ist wieder da', [], null);
      });
    } catch (err) { fehler(err); }
  }

  async function notizAnhaengen() {
    const text = $('#notiz-text').value.trim();
    const id = offenId;
    if (!text || !id) return;
    try {
      const a = await api('POST', 'haeuser/' + id + '/notiz', { text });
      $('#notiz-text').value = '';
      await lade();
      if (offenId === id) zeichneNotizen(haus(id));
      quittung('Notiz bei ' + a.nachher.name, ['<em>' + e(wer) + '</em>: ' + e(text)], async () => {
        await api('POST', 'wiederherstellen', { haus: a.vorher }); await lade(); if (offenId === id) zeichneNotizen(haus(id));
        quittung('Notiz wieder entfernt', [], null);
      });
    } catch (err) { fehler(err); }
  }

  async function standSetzen(id, stand) {
    const h = haus(id);
    if (!h || h.stand === stand) return;
    try {
      const a = await api('PUT', 'haeuser/' + id, { stand });
      await lade();
      quittung(a.nachher.name + ' verschoben', a.aenderungen.map(zeileAenderung), async () => {
        await api('POST', 'wiederherstellen', { haus: a.vorher }); await lade();
        quittung(a.vorher.name + ' zurück auf «' + e(a.vorher.stand) + '»', [], null);
      });
    } catch (err) { fehler(err); }
  }

  async function alleErsetzen(weg, text, titel) {
    if (!(await frage(text))) return;
    try {
      const a = await api('POST', weg);
      await lade();
      tafelZu();
      const zeilen = weg === 'import' ? a.bericht.map(e) : [a.anzahl + ' erfundene Häuser geladen'];
      quittung(titel, zeilen, async () => {
        await api('POST', 'alle', { haeuser: a.vorher_alle, quelle: a.vorher_quelle }); await lade();
        quittung('Vorheriger Stand ist wieder da', [a.vorher_alle.length + ' Häuser'], null);
      });
    } catch (err) { fehler(err); }
  }

  // ---------- Ereignisse ----------
  function verdrahte() {
    $('#suche').addEventListener('input', (ev) => { filter.text = ev.target.value; zeichneListe(); zeichneBrett(); });
    $('#f-stand').addEventListener('change', (ev) => { filter.stand = ev.target.value; zeichneListe(); zeichneBrett(); });
    $('#f-faellig').addEventListener('change', (ev) => { filter.faellig = ev.target.value; zeichneListe(); zeichneBrett(); });
    $('#f-art').addEventListener('change', (ev) => { filter.art = ev.target.value; zeichneListe(); zeichneBrett(); });
    $('#wer').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; wer = b.dataset.wer; localStorage.setItem('kundenliste.wer', wer); zeichneKopf(); });
    document.querySelector('.ansichten').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; ansicht = b.dataset.ansicht; localStorage.setItem('kundenliste.ansicht', ansicht); zeichneKopf(); });
    $('#neu').addEventListener('click', () => tafelAuf(null));
    $('#schliessen').addEventListener('click', tafelZu);
    $('#schleier').addEventListener('click', tafelZu);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { if (!$('#frage').hidden) $('#frage-nein').click(); else tafelZu(); } });
    F().addEventListener('submit', speichern);
    $('#loeschen').addEventListener('click', loeschen);
    $('#notiz-anhaengen').addEventListener('click', notizAnhaengen);
    $('#notiz-text').addEventListener('keydown', (ev) => { if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') notizAnhaengen(); });
    $('#quittung-zu').addEventListener('click', quittungZu);
    $('#quittung-zurueck').addEventListener('click', async () => { const f = rueckgaengig; rueckgaengig = null; quittungZu(); if (f) { try { await f(); } catch (err) { fehler(err); } } });
    $('#import').addEventListener('click', () => alleErsetzen('import',
      'Die echten Häuser aus den Grundlagen übernehmen?\nProbedaten werden entfernt, von Hand angelegte Häuser bleiben. Stände nur, wo sie belegt sind, sonst «offen».', 'Echte Häuser übernommen'));
    $('#probedaten').addEventListener('click', () => alleErsetzen('probedaten',
      'Probedaten laden?\nDie ganze Liste wird durch die erfundenen Häuser ersetzt. Mit «Rückgängig» kommt der jetzige Stand zurück.', 'Probedaten geladen'));

    document.querySelectorAll('.tabelle th').forEach((th) => th.addEventListener('click', () => {
      if (sortierung.feld === th.dataset.sort) sortierung.auf = !sortierung.auf; else sortierung = { feld: th.dataset.sort, auf: true };
      zeichneListe(); zeichneBrett();
    }));
    $('#liste-koerper').addEventListener('click', (ev) => { const tr = ev.target.closest('tr'); if (tr) tafelAuf(tr.dataset.id); });
    $('#heute-liste').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) tafelAuf(b.dataset.id); });

    // Brett: Karten ziehen (am Rechner), am Handy über den Stand in der Tafel
    const brett = $('#brett');
    let zieht = null;
    brett.addEventListener('click', (ev) => { const k = ev.target.closest('.karte'); if (k) tafelAuf(k.dataset.id); });
    brett.addEventListener('dragstart', (ev) => { const k = ev.target.closest('.karte'); if (!k) return; zieht = k.dataset.id; k.classList.add('zieht'); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', zieht); });
    brett.addEventListener('dragend', () => { zieht = null; brett.querySelectorAll('.zieht').forEach((k) => k.classList.remove('zieht')); brett.querySelectorAll('.ziel').forEach((s) => s.classList.remove('ziel')); });
    brett.addEventListener('dragover', (ev) => { const s = ev.target.closest('.spalte'); if (!s || !zieht) return; ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; brett.querySelectorAll('.ziel').forEach((x) => { if (x !== s) x.classList.remove('ziel'); }); s.classList.add('ziel'); });
    brett.addEventListener('dragleave', (ev) => { const s = ev.target.closest('.spalte'); if (s && !s.contains(ev.relatedTarget)) s.classList.remove('ziel'); });
    brett.addEventListener('drop', (ev) => { const s = ev.target.closest('.spalte'); if (!s) return; ev.preventDefault(); const id = zieht || ev.dataTransfer.getData('text/plain'); s.classList.remove('ziel'); if (id) standSetzen(id, s.dataset.stand); });
  }

  // ---------- Start ----------
  async function start() {
    verdrahte();
    try {
      await Promise.all([lade(), document.fonts.ready]);
      const wahl = $('#stand-wahl'), fs = $('#f-stand');
      D.staende.forEach((s) => { wahl.insertAdjacentHTML('beforeend', '<option>' + e(s) + '</option>'); fs.insertAdjacentHTML('beforeend', '<option>' + e(s) + '</option>'); });
    } catch (err) {
      $('#kopf-satz').textContent = 'Die Daten kommen nicht an: ' + (err.message || err) + '. Läuft python3 zentrale/server.py?';
    }
    document.documentElement.classList.remove('wartet');
    const gewuenscht = params.get('haus');
    if (gewuenscht && haus(gewuenscht)) tafelAuf(gewuenscht);
  }
  start();
})();
