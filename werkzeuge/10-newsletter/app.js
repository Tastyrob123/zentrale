/* Post aus dem Studio: die Oberfläche. Spricht mit /api/10-newsletter/… (api.py im selben Ordner).
   Jede Änderung geht über den Server und zeigt unten eine Quittung mit vorher, nachher und «Rückgängig». */
(function () {
  'use strict';
  var D = null;                     // alles vom Server: listen, empfaenger, ausgaben, projekte, versand, postausgang, versendungen
  var A = null, aOriginal = '';     // die offene Ausgabe im Editor und ihr Stand beim Öffnen
  var API = '/zentrale/api/10-newsletter/';
  var ARTEN = { titel: 'Titel', text: 'Text', bild: 'Bild', zitat: 'Zitat', knopf: 'Knopf', projekt: 'Projekt aus dem Atelier' };
  var HERKUNFT_SATZ = { Website: 'über die Website', Gespräch: 'nach einem Gespräch', 'KI-Check': 'über den KI-Check' };

  function $(id) { return document.getElementById(id); }
  function alle(s, w) { return [].slice.call((w || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function datum(iso) {
    if (!iso) return '';
    var t = iso.slice(0, 10).split('-');
    return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : iso;
  }
  function zeit(s) { return s ? datum(s) + ', ' + s.slice(11, 16) + ' Uhr' : ''; }
  function listenName(id) { var l = D.listen.filter(function (x) { return x.id === id; })[0]; return l ? l.name : id; }
  function mehrzahl(n, eins, viele) { return n + ' ' + (n === 1 ? eins : viele); }

  async function api(methode, weg, daten) {
    var r = await fetch(API + weg, { method: methode, headers: { 'Content-Type': 'application/json' }, body: methode === 'GET' ? undefined : JSON.stringify(daten || {}) });
    var a = await r.json();
    if (!r.ok || a.fehler) { var f = new Error(a.fehler || 'Das hat nicht geklappt.'); f.antwort = a; f.status = r.status; throw f; }
    return a;
  }
  async function lade() { D = await api('GET', 'stand'); zeichneAlles(); }

  /* ---------- Quittung ---------- */
  var qUhr = null, qRueck = null;
  function quittung(o) {
    var q = $('quittung');
    clearTimeout(qUhr);
    q.classList.toggle('fehler', !!o.fehler);
    $('qTitel').textContent = o.titel || '';
    $('qText').innerHTML = o.text || '';
    qRueck = o.rueckgaengig || null;
    var kn = $('qRueckgaengig');
    kn.hidden = !o.rueckgaengig && !o.tat;
    kn.textContent = o.tat ? o.tat.text : 'Rückgängig';
    kn.onclick = o.tat ? o.tat.fn : rueckgaengig;
    q.classList.add('an');
    qUhr = setTimeout(function () { q.classList.remove('an'); }, o.fehler ? 9000 : 14000);
  }
  async function rueckgaengig() {
    if (!qRueck) return;
    var fn = qRueck; qRueck = null;
    try { await fn(); await lade(); quittung({ titel: 'Zurückgenommen.', text: 'Alles ist wieder wie vorher.' }); }
    catch (e) { quittung({ titel: 'Zurücknehmen hat nicht geklappt.', text: esc(e.message), fehler: true }); }
  }
  function fehler(e) { quittung({ titel: 'Das hat nicht geklappt.', text: esc(e && e.message || e), fehler: true }); }
  function vorherNachher(paare) {
    // paare: [[Bezeichnung, vorher, nachher], …] → nur die Zeilen, die sich geändert haben
    return paare.filter(function (p) { return (p[1] || '') !== (p[2] || ''); })
      .map(function (p) { return esc(p[0]) + ': ' + (p[1] ? esc(p[1]) : '<i>leer</i>') + ' → <i>' + (p[2] ? esc(p[2]) : 'leer') + '</i>'; }).join('<br>');
  }
  $('qZu').onclick = function () { $('quittung').classList.remove('an'); };

  /* ---------- Rückfrage und Formulare ---------- */
  function dialog(html) {
    var d = $('dialog');
    d.innerHTML = html;
    if (!d.open) d.showModal();
    return d;
  }
  function frage(o) {
    return new Promise(function (loes) {
      var d = dialog('<h2>' + esc(o.titel) + '</h2>' + (o.html || '') + '<div class="ende"><button type="button" class="kn kn--leise" data-nein>' + esc(o.nein || 'Abbrechen') + '</button><button type="button" class="kn ' + (o.gefaehrlich ? 'kn--gold' : '') + '" data-ja>' + esc(o.ja || 'Ja') + '</button></div>');
      d.querySelector('[data-ja]').onclick = function () { d.close(); loes(true); };
      d.querySelector('[data-nein]').onclick = function () { d.close(); loes(false); };
      d.oncancel = function () { loes(false); };
    });
  }
  function formular(o) {
    // o.felder: [{name, label, art: 'text'|'mail'|'auswahl'|'mehrzeilig'|'datei', wahl: [[wert, text]], wert, hinweis}]
    return new Promise(function (loes) {
      var felder = o.felder.map(function (f) {
        var inner;
        if (f.art === 'auswahl') inner = '<select name="' + f.name + '">' + f.wahl.map(function (w) { return '<option value="' + esc(w[0]) + '"' + (w[0] === f.wert ? ' selected' : '') + '>' + esc(w[1]) + '</option>'; }).join('') + '</select>';
        else if (f.art === 'mehrzeilig') inner = '<textarea name="' + f.name + '" rows="' + (f.zeilen || 6) + '" placeholder="' + esc(f.platz || '') + '">' + esc(f.wert || '') + '</textarea>';
        else if (f.art === 'datei') inner = '<input name="' + f.name + '" type="file" accept=".csv,text/csv,text/plain">';
        else inner = '<input name="' + f.name + '" type="' + (f.art === 'mail' ? 'email' : 'text') + '" value="' + esc(f.wert || '') + '" placeholder="' + esc(f.platz || '') + '"' + (f.pflicht ? ' required' : '') + '>';
        return '<label class="feld"><span>' + esc(f.label) + '</span>' + inner + (f.hinweis ? '<small>' + f.hinweis + '</small>' : '') + '</label>';
      }).join('');
      var d = dialog('<form method="dialog"><h2>' + esc(o.titel) + '</h2>' + (o.html || '') + '<div style="display:grid;gap:14px">' + felder + '</div><div class="ende"><button type="button" class="kn kn--leise" data-nein>Abbrechen</button><button type="submit" class="kn">' + esc(o.ja || 'Speichern') + '</button></div></form>');
      var form = d.querySelector('form');
      form.onsubmit = function (ev) {
        ev.preventDefault();
        var aus = {};
        o.felder.forEach(function (f) { var el = form.elements[f.name]; aus[f.name] = f.art === 'datei' ? (el.files[0] || null) : el.value.trim(); });
        d.close(); loes(aus);
      };
      d.querySelector('[data-nein]').onclick = function () { d.close(); loes(null); };
      d.oncancel = function () { loes(null); };
      var erstes = form.querySelector('input:not([type=file]),textarea'); if (erstes) erstes.focus();
    });
  }

  /* ---------- Bereiche ---------- */
  function zeigWeg(name) {
    alle('.wege button').forEach(function (b) { b.classList.toggle('an', b.dataset.weg === name); });
    alle('.bereich').forEach(function (s) { s.classList.toggle('an', s.id === 'bereich-' + name); });
    window.scrollTo(0, 0);
    if (name === 'versand') zeichneVersand();
  }
  alle('.wege button').forEach(function (b) { b.onclick = function () { zeigWeg(b.dataset.weg); }; });

  function zeichneAlles() {
    var best = D.empfaenger.filter(function (e) { return e.stand === 'bestätigt'; }).length;
    $('zahlEmpfaenger').textContent = best;
    $('zahlAusgaben').textContent = D.ausgaben.filter(function (a) { return a.stand !== 'versendet'; }).length;
    $('zahlPostausgang').textContent = D.postausgang.length || '';
    $('zahlArchiv').textContent = D.ausgaben.filter(function (a) { return a.stand === 'versendet'; }).length;
    $('standTrocken').textContent = D.versand.scharf ? 'Versand ist scharf' : 'Versand ist trocken';
    $('standTrocken').classList.toggle('scharf', !!D.versand.scharf);
    $('empfaengerSatz').textContent = mehrzahl(D.empfaenger.length, 'Adresse', 'Adressen') + ', davon ' + best + ' bestätigt, '
      + D.empfaenger.filter(function (e) { return e.stand === 'angemeldet'; }).length + ' ohne Bestätigung, '
      + D.empfaenger.filter(function (e) { return e.stand === 'abgemeldet'; }).length + ' abgemeldet.';
    fuelleListenAuswahl($('filterListe'), true);
    fuelleListenAuswahl($('aListe'), false);
    fuelleListenAuswahl($('vListe'), false);
    zeichneEmpfaenger(); zeichneListen(); zeichneAusgabenListe(); zeichneArchiv(); zeichnePostausgang(); fuelleVersandweg();
    if (A) { var frisch = D.ausgaben.filter(function (a) { return a.id === A.id; })[0]; if (frisch && JSON.stringify(A) === aOriginal) oeffneAusgabe(A.id); else if (!frisch) schliesseEditor(); }
  }
  function fuelleListenAuswahl(sel, mitAlle) {
    var wert = sel.value;
    sel.innerHTML = (mitAlle ? '<option value="">Alle Listen</option>' : '') + D.listen.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.name) + '</option>'; }).join('');
    if (wert && D.listen.some(function (l) { return l.id === wert; }) || (mitAlle && wert === '')) sel.value = wert;
  }

  /* ---------- Empfänger ---------- */
  function moeglicheDubletten() {
    // gleicher Name (ohne Gross/Klein) oder gleicher Teil vor dem @
    var ids = {}, nachName = {}, nachKopf = {};
    D.empfaenger.forEach(function (e) {
      var n = (e.name || '').toLowerCase().replace(/\s+/g, ' ').trim(), k = (e.mail || '').split('@')[0].toLowerCase();
      if (n) (nachName[n] = nachName[n] || []).push(e.id);
      if (k) (nachKopf[k] = nachKopf[k] || []).push(e.id);
    });
    [nachName, nachKopf].forEach(function (g) { Object.keys(g).forEach(function (k) { if (g[k].length > 1) g[k].forEach(function (id) { ids[id] = true; }); }); });
    return ids;
  }
  function zeichneEmpfaenger() {
    var such = $('suche').value.trim().toLowerCase(), liste = $('filterListe').value, stand = $('filterStand').value;
    var dub = moeglicheDubletten(), dubZahl = Object.keys(dub).length;
    var hin = $('dublettenHinweis');
    hin.hidden = !dubZahl;
    hin.innerHTML = '<b>' + mehrzahl(dubZahl, 'Adresse', 'Adressen') + '</b> sehen nach Dubletten aus (gleicher Name oder gleicher Teil vor dem @). Gleiche Mail-Adressen zweimal gibt es nicht, die fängt das Werkzeug ab. <button type="button" class="kn kn--text" id="knDubZeigen">Anzeigen</button>';
    if (dubZahl) $('knDubZeigen').onclick = function () { $('filterStand').value = 'dubletten'; zeichneEmpfaenger(); };
    var zeilen = D.empfaenger.filter(function (e) {
      if (liste && (e.listen || []).indexOf(liste) < 0) return false;
      if (stand === 'dubletten') { if (!dub[e.id]) return false; } else if (stand && e.stand !== stand) return false;
      if (such && (e.name + ' ' + e.mail + ' ' + e.haus).toLowerCase().indexOf(such) < 0) return false;
      return true;
    }).sort(function (a, b) { return (b.einwilligung || '').localeCompare(a.einwilligung || '') || a.name.localeCompare(b.name); });
    $('tabelleEmpfaenger').querySelector('tbody').innerHTML = zeilen.map(function (e) {
      return '<tr data-id="' + esc(e.id) + '"' + (dub[e.id] && stand === 'dubletten' ? ' class="markiert"' : '') + '><td><b>' + esc(e.name) + '</b></td><td><span class="mini">Mail</span>' + esc(e.mail) + '</td><td>' + (e.haus ? '<span class="mini">Haus</span>' + esc(e.haus) : '') + '</td><td class="leise"><span class="mini">Herkunft</span>' + esc(e.herkunft) + '</td><td class="leise"><span class="mini">Seit</span>' + datum(e.einwilligung) + '</td><td><span class="stand ' + esc(e.stand) + '">' + esc(e.stand) + '</span></td><td class="leise">' + (e.listen || []).map(listenName).map(esc).join(', ') + '</td></tr>';
    }).join('');
    $('empfaengerLeer').hidden = zeilen.length > 0;
    alle('#tabelleEmpfaenger tr[data-id]').forEach(function (tr) { tr.onclick = function () { oeffneBlatt(D.empfaenger.filter(function (e) { return e.id === tr.dataset.id; })[0]); }; });
  }
  ['suche', 'filterListe', 'filterStand'].forEach(function (id) { $(id).oninput = zeichneEmpfaenger; });

  var blattE = null;
  function oeffneBlatt(e) {
    blattE = e;
    $('blattTitel').textContent = e ? e.name || 'Empfänger' : 'Neuer Empfänger';
    $('bName').value = e ? e.name : ''; $('bMail').value = e ? e.mail : ''; $('bHaus').value = e ? e.haus || '' : '';
    $('bHerkunft').value = e ? e.herkunft : 'Gespräch'; $('bEinwilligung').value = e ? e.einwilligung : D.heute; $('bStand').value = e ? e.stand : 'bestätigt';
    $('bNotiz').value = e ? e.notiz || '' : '';
    $('bListen').innerHTML = D.listen.map(function (l) { return '<label class="haken"><input type="checkbox" value="' + esc(l.id) + '"' + ((e ? e.listen || [] : ['l-post']).indexOf(l.id) >= 0 ? ' checked' : '') + '> ' + esc(l.name) + '</label>'; }).join('');
    $('bLoeschen').hidden = !e;
    standHinweis();
    $('blatt').classList.add('an'); $('schleier').classList.add('an');
    setTimeout(function () { $('bName').focus(); }, 300);
  }
  function standHinweis() {
    var s = $('bStand').value, alt = blattE && blattE.stand;
    $('bStandHinweis').textContent = s === 'abgemeldet' ? 'Abgemeldete bleiben gesperrt: eine neue Anmeldung über die Seite wird abgewiesen, Versand geht nicht an sie.'
      : (alt === 'abgemeldet' ? 'Die Sperre aufheben geht nur hier, bewusst und mit Quittung.' : s === 'angemeldet' ? 'Ohne Bestätigung bekommt die Adresse keine Ausgabe.' : '');
  }
  $('bStand').onchange = standHinweis;
  function schliesseBlatt() { $('blatt').classList.remove('an'); $('schleier').classList.remove('an'); blattE = null; }
  $('bAbbrechen').onclick = schliesseBlatt; $('schleier').onclick = schliesseBlatt;
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && $('blatt').classList.contains('an')) schliesseBlatt(); });
  $('knNeuEmpfaenger').onclick = function () { oeffneBlatt(null); };

  function empfaengerAusBlatt() {
    return { name: $('bName').value.trim(), mail: $('bMail').value.trim(), haus: $('bHaus').value.trim(), herkunft: $('bHerkunft').value, einwilligung: $('bEinwilligung').value,
      stand: $('bStand').value, notiz: $('bNotiz').value.trim(), listen: alle('#bListen input:checked').map(function (i) { return i.value; }) };
  }
  function empfaengerPaare(v, n) {
    return [['Name', v.name, n.name], ['E-Mail', v.mail, n.mail], ['Haus', v.haus, n.haus], ['Herkunft', v.herkunft, n.herkunft], ['Einwilligung', datum(v.einwilligung), datum(n.einwilligung)],
      ['Stand', v.stand, n.stand], ['Listen', (v.listen || []).map(listenName).join(', '), (n.listen || []).map(listenName).join(', ')], ['Notiz', v.notiz, n.notiz]];
  }
  $('bSpeichern').onclick = async function () {
    var neu = empfaengerAusBlatt();
    if (!neu.name || !neu.mail) return fehler('Name und E-Mail müssen da sein.');
    try {
      if (blattE) {
        var alt = blattE, a = await api('PUT', 'empfaenger/' + alt.id, neu);
        var text = vorherNachher(empfaengerPaare(alt, a.empfaenger)) || 'Nichts geändert.';
        schliesseBlatt(); await lade();
        quittung({ titel: a.empfaenger.name + ' gespeichert.', text: text, rueckgaengig: function () { return api('PUT', 'empfaenger/' + alt.id, alt); } });
      } else {
        var b = await api('POST', 'empfaenger', neu), id = b.empfaenger.id;
        schliesseBlatt(); await lade();
        quittung({ titel: b.empfaenger.name + ' ist neu dabei.', text: esc(b.empfaenger.mail) + ', ' + esc(b.empfaenger.stand) + ', ' + esc((b.empfaenger.listen || []).map(listenName).join(', ')), rueckgaengig: function () { return api('DELETE', 'empfaenger/' + id); } });
      }
    } catch (e) { fehler(e); }
  };
  $('bLoeschen').onclick = async function () {
    var e = blattE;
    if (!await frage({ titel: e.name + ' löschen?', html: '<p>' + esc(e.mail) + ' verschwindet aus allen Listen. Mit «Rückgängig» in der Quittung kommt die Adresse zurück.</p>', ja: 'Löschen', gefaehrlich: true })) return;
    try {
      var a = await api('DELETE', 'empfaenger/' + e.id);
      schliesseBlatt(); await lade();
      quittung({ titel: e.name + ' gelöscht.', text: esc(e.mail) + ' → <i>weg</i>', rueckgaengig: function () { return api('PUT', 'empfaenger/' + e.id, a.empfaenger); } });
    } catch (x) { fehler(x); }
  };

  /* Import und Export */
  $('knImport').onclick = async function () {
    var f = await formular({ titel: 'Empfänger importieren', ja: 'Prüfen',
      html: '<p>Eine CSV-Datei mit Kopfzeile, zum Beispiel <b>Name;E-Mail;Haus;Herkunft;Einwilligung;Stand</b>. Erst kommt eine Vorschau, übernommen wird danach. Eine Beispieldatei liegt in <b>probedaten/beispiel-import.csv</b>.</p>',
      felder: [{ name: 'datei', label: 'Datei', art: 'datei' }, { name: 'csv', label: 'Oder hier einfügen', art: 'mehrzeilig', zeilen: 5, platz: 'Name;E-Mail;Haus;Herkunft;Einwilligung;Stand' },
        { name: 'liste', label: 'In Liste', art: 'auswahl', wahl: D.listen.map(function (l) { return [l.id, l.name]; }), wert: $('filterListe').value || 'l-post' }] });
    if (!f) return;
    var text = f.csv;
    if (f.datei) text = await f.datei.text();
    if (!text) return fehler('Keine Daten zum Importieren.');
    try {
      var v = await api('POST', 'empfaenger/import', { csv: text, liste: f.liste });
      var zeile = function (z) { return '<li>' + esc(z.name || z.mail) + ' <span style="color:var(--leise)">' + esc(z.mail) + (z.grund ? ' · ' + esc(z.grund) : '') + '</span></li>'; };
      var html = '<p><b>' + mehrzahl(v.neu.length, 'neue Adresse', 'neue Adressen') + '</b> kommen in die Liste «' + esc(listenName(f.liste)) + '».</p>'
        + (v.neu.length ? '<ul>' + v.neu.map(zeile).join('') + '</ul>' : '')
        + (v.doppelt.length ? '<p><b>' + mehrzahl(v.doppelt.length, 'Dublette', 'Dubletten') + '</b>, werden übersprungen:</p><ul>' + v.doppelt.map(zeile).join('') + '</ul>' : '')
        + (v.gesperrt.length ? '<p><b>' + mehrzahl(v.gesperrt.length, 'Adresse', 'Adressen') + '</b> abgemeldet und gesperrt:</p><ul>' + v.gesperrt.map(zeile).join('') + '</ul>' : '')
        + (v.fehlerhaft.length ? '<p><b>' + mehrzahl(v.fehlerhaft.length, 'Zeile', 'Zeilen') + '</b> fehlerhaft:</p><ul>' + v.fehlerhaft.map(zeile).join('') + '</ul>' : '');
      if (!v.neu.length) { dialog('<h2>Nichts zu übernehmen</h2>' + html + '<div class="ende"><button type="button" class="kn" onclick="this.closest(\'dialog\').close()">Verstanden</button></div>'); return; }
      if (!await frage({ titel: 'Import prüfen', html: html, ja: mehrzahl(v.neu.length, 'Adresse übernehmen', 'Adressen übernehmen') })) return;
      var w = await api('POST', 'empfaenger/import', { csv: text, liste: f.liste, anwenden: true });
      await lade();
      quittung({ titel: mehrzahl(w.ids.length, 'Adresse übernommen.', 'Adressen übernommen.'), text: 'Liste «' + esc(listenName(f.liste)) + '»: ' + (D.empfaenger.filter(function (e) { return e.listen.indexOf(f.liste) >= 0; }).length - w.ids.length) + ' → <i>' + D.empfaenger.filter(function (e) { return e.listen.indexOf(f.liste) >= 0; }).length + '</i>',
        rueckgaengig: async function () { for (var i = 0; i < w.ids.length; i++) await api('DELETE', 'empfaenger/' + w.ids[i]); } });
    } catch (e) { fehler(e); }
  };
  $('knExport').onclick = async function () {
    try {
      var liste = $('filterListe').value, stand = $('filterStand').value === 'dubletten' ? '' : $('filterStand').value;
      var a = await api('GET', 'empfaenger/export?liste=' + encodeURIComponent(liste) + '&stand=' + encodeURIComponent(stand));
      var blob = new Blob(['﻿' + a.csv], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), l = document.createElement('a');
      l.href = url; l.download = a.dateiname; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      quittung({ titel: 'Datei ' + a.dateiname + ' gespeichert.', text: mehrzahl(a.anzahl, 'Adresse', 'Adressen') + (liste ? ' aus «' + esc(listenName(liste)) + '»' : '') + (stand ? ', nur ' + esc(stand) : '') + '. Am Bestand ändert das nichts.' });
    } catch (e) { fehler(e); }
  };

  /* Anmeldung mit Bestätigung durchspielen */
  $('knAnmeldung').onclick = async function () {
    var f = await formular({ titel: 'Anmeldung durchspielen', ja: 'Anmelden',
      html: '<p>So läuft es später von der Agentur-Seite aus: Die Adresse wird als «angemeldet» eingetragen und bekommt eine Bestätigungsmail. Erst der Klick auf den Link darin macht sie «bestätigt».</p>',
      felder: [{ name: 'name', label: 'Name', pflicht: true }, { name: 'mail', label: 'E-Mail', art: 'mail', pflicht: true }, { name: 'haus', label: 'Haus' },
        { name: 'liste', label: 'In Liste', art: 'auswahl', wahl: D.listen.map(function (l) { return [l.id, l.name]; }), wert: 'l-post' }] });
    if (!f) return;
    try {
      var a = await api('POST', 'anmeldung', { name: f.name, mail: f.mail, haus: f.haus, herkunft: 'Website', liste: f.liste });
      await lade();
      if (a.schon_dabei) return quittung({ titel: 'Schon dabei.', text: esc(a.hinweis) });
      var neu = !D.empfaenger.some(function (e) { return e.id === a.empfaenger.id && e.einwilligung !== D.heute; });
      dialog('<h2>Bestätigungsmail liegt im Postausgang.</h2><p>' + esc(a.empfaenger.name) + ' steht jetzt als <b>angemeldet</b> in der Liste. Verschickt wurde nichts, die Mail liegt als Datei im Postausgang.</p><p>Der Link in der Mail:</p><p><a href="' + esc(a.bestaetigen_link) + '" target="_blank" rel="noopener">' + esc(a.bestaetigen_link) + '</a></p><p>Klick ihn an, dann wird die Adresse bestätigt, so wie der Empfänger es später tun würde.</p><div class="ende"><button type="button" class="kn kn--leise" data-mail>Mail ansehen</button><button type="button" class="kn" onclick="this.closest(\'dialog\').close()">Verstanden</button></div>');
      $('dialog').querySelector('[data-mail]').onclick = function () { zeigMail(a.mail.id); };
      quittung({ titel: a.empfaenger.name + ' angemeldet, Bestätigung steht aus.', text: 'Stand: <i>angemeldet</i> · Bestätigungsmail im Postausgang',
        rueckgaengig: neu ? function () { return api('DELETE', 'empfaenger/' + a.empfaenger.id); } : null });
    } catch (e) {
      if (e.antwort && e.antwort.gesperrt) quittung({ titel: 'Abgewiesen.', text: esc(e.message), fehler: true }); else fehler(e);
    }
  };

  /* Listen */
  function zeichneListen() {
    $('tabelleListen').querySelector('tbody').innerHTML = D.listen.map(function (l) {
      var drin = D.empfaenger.filter(function (e) { return (e.listen || []).indexOf(l.id) >= 0; });
      return '<tr><td><b>' + esc(l.name) + '</b></td><td class="leise">' + esc(l.kurz) + '</td><td><span class="mini">Bestätigt</span>' + drin.filter(function (e) { return e.stand === 'bestätigt'; }).length + '</td><td class="leise"><span class="mini">Alle</span>' + drin.length + '</td><td style="text-align:right;white-space:nowrap"><button type="button" class="kn kn--text" data-um="' + esc(l.id) + '">Umbenennen</button> &nbsp; <button type="button" class="kn kn--text" data-zeig="' + esc(l.id) + '">Anzeigen</button> &nbsp; <button type="button" class="kn kn--text" style="color:var(--rot)" data-weg="' + esc(l.id) + '">Löschen</button></td></tr>';
    }).join('');
    alle('#tabelleListen [data-zeig]').forEach(function (b) { b.onclick = function () { $('filterListe').value = b.dataset.zeig; $('filterStand').value = ''; zeichneEmpfaenger(); window.scrollTo(0, 0); }; });
    alle('#tabelleListen [data-um]').forEach(function (b) {
      b.onclick = async function () {
        var l = D.listen.filter(function (x) { return x.id === b.dataset.um; })[0];
        var f = await formular({ titel: 'Liste umbenennen', felder: [{ name: 'name', label: 'Name', wert: l.name, pflicht: true }, { name: 'kurz', label: 'Beschreibung', wert: l.kurz }] });
        if (!f) return;
        try {
          var a = await api('PUT', 'listen/' + l.id, f); await lade();
          quittung({ titel: 'Liste gespeichert.', text: vorherNachher([['Name', l.name, a.liste.name], ['Beschreibung', l.kurz, a.liste.kurz]]) || 'Nichts geändert.', rueckgaengig: function () { return api('PUT', 'listen/' + l.id, l); } });
        } catch (e) { fehler(e); }
      };
    });
    alle('#tabelleListen [data-weg]').forEach(function (b) {
      b.onclick = async function () {
        var l = D.listen.filter(function (x) { return x.id === b.dataset.weg; })[0];
        var n = D.empfaenger.filter(function (e) { return (e.listen || []).indexOf(l.id) >= 0; }).length;
        if (!await frage({ titel: '«' + l.name + '» löschen?', html: '<p>Die Liste verschwindet. Die ' + mehrzahl(n, 'Adresse bleibt', 'Adressen bleiben') + ' erhalten, nur die Zuordnung zu dieser Liste fällt weg.</p>', ja: 'Liste löschen', gefaehrlich: true })) return;
        try {
          var vorher = D.empfaenger.filter(function (e) { return (e.listen || []).indexOf(l.id) >= 0; }).map(function (e) { return JSON.parse(JSON.stringify(e)); });
          await api('DELETE', 'listen/' + l.id); await lade();
          quittung({ titel: 'Liste «' + l.name + '» gelöscht.', text: mehrzahl(n, 'Adresse', 'Adressen') + ' ohne diese Zuordnung → <i>Liste weg</i>',
            rueckgaengig: async function () { await api('POST', 'listen', l); for (var i = 0; i < vorher.length; i++) await api('PUT', 'empfaenger/' + vorher[i].id, vorher[i]); } });
        } catch (e) { fehler(e); }
      };
    });
  }
  $('knNeueListe').onclick = async function () {
    var f = await formular({ titel: 'Neue Liste', felder: [{ name: 'name', label: 'Name', pflicht: true, platz: 'zum Beispiel Gastronomie Zürich' }, { name: 'kurz', label: 'Beschreibung' }], ja: 'Anlegen' });
    if (!f) return;
    try { var a = await api('POST', 'listen', f); await lade(); quittung({ titel: 'Liste «' + a.liste.name + '» angelegt.', text: 'Noch leer. Empfänger kommen über das Seitenblatt oder den Import hinein.', rueckgaengig: function () { return api('DELETE', 'listen/' + a.liste.id); } }); }
    catch (e) { fehler(e); }
  };

  /* ---------- Ausgaben ---------- */
  function zeichneAusgabenListe() {
    var liste = D.ausgaben.slice().sort(function (a, b) { return (b.nummer || 0) - (a.nummer || 0); });
    $('ausgabenListe').innerHTML = liste.map(function (a) {
      return '<button type="button" data-id="' + esc(a.id) + '"' + (A && A.id === a.id ? ' class="an"' : '') + '><b>Nr. ' + a.nummer + ' · ' + esc(a.titel || 'Ohne Titel') + '</b><small>' + (a.stand === 'versendet' ? 'Verschickt am ' + datum(a.versendet_am) + ' an ' + a.empfaenger_zahl : 'Entwurf, geändert am ' + datum(a.geaendert)) + '</small></button>';
    }).join('');
    alle('#ausgabenListe button').forEach(function (b) { b.onclick = function () { wechsleAusgabe(b.dataset.id); }; });
  }
  async function wechsleAusgabe(id) {
    if (A && JSON.stringify(A) !== aOriginal) {
      if (!await frage({ titel: 'Änderungen verwerfen?', html: '<p>Die Ausgabe «' + esc(A.titel) + '» ist nicht gespeichert.</p>', ja: 'Verwerfen', nein: 'Zurück' })) return;
    }
    oeffneAusgabe(id);
  }
  function oeffneAusgabe(id) {
    var a = D.ausgaben.filter(function (x) { return x.id === id; })[0];
    if (!a) return schliesseEditor();
    A = JSON.parse(JSON.stringify(a)); aOriginal = JSON.stringify(A);
    $('editor').hidden = false; $('editorLeer').hidden = true;
    $('aTitel').value = A.titel; $('aBetreff').value = A.betreff; $('aVorschau').value = A.vorschau; $('aListe').value = A.liste;
    var h = $('versendetHinweis');
    h.hidden = A.stand !== 'versendet';
    h.innerHTML = 'Diese Ausgabe ist am <b>' + datum(A.versendet_am) + '</b> an <b>' + A.empfaenger_zahl + '</b> Empfänger gegangen. Änderungen hier ändern nur das Archiv, nicht die Mails. Für eine neue Post: «Als neue Ausgabe kopieren».';
    zeichneBausteine(); geaendert(false); vorschau();
    alle('#ausgabenListe button').forEach(function (b) { b.classList.toggle('an', b.dataset.id === id); });
  }
  function schliesseEditor() { A = null; aOriginal = ''; $('editor').hidden = true; $('editorLeer').hidden = false; zeichneAusgabenListe(); }
  function geaendert(ja) { $('ungespeichert').hidden = !(ja === undefined ? JSON.stringify(A) !== aOriginal : ja); }
  ['aTitel', 'aBetreff', 'aVorschau', 'aListe'].forEach(function (id) {
    $(id).oninput = function () { if (!A) return; A[{ aTitel: 'titel', aBetreff: 'betreff', aVorschau: 'vorschau', aListe: 'liste' }[id]] = $(id).value; geaendert(); vorschau(); };
  });

  function zeichneBausteine() {
    $('bausteine').innerHTML = A.bausteine.map(function (b, i) {
      var f = '';
      if (b.art === 'titel') f = feld('text', 'Überschrift', b.text, i);
      else if (b.art === 'text') f = feld('text', 'Text (Leerzeile = neuer Absatz)', b.text, i, true);
      else if (b.art === 'bild') f = '<div class="zeile">' + feld('link', 'Bildadresse (https://… oder /grundlagen/…)', b.link, i) + feld('alt', 'Beschreibung, falls das Bild nicht lädt', b.alt, i) + '</div>' + feld('zeile', 'Bildzeile (klein unter dem Bild)', b.zeile, i) + '<small>Für den echten Versand braucht ein Bild eine öffentliche Adresse mit https://, sonst sehen Empfänger es nicht.</small>';
      else if (b.art === 'zitat') f = feld('text', 'Zitat', b.text, i, true) + feld('von', 'Von wem', b.von, i);
      else if (b.art === 'knopf') f = '<div class="zeile">' + feld('text', 'Beschriftung', b.text, i) + feld('link', 'Ziel (https://…)', b.link, i) + '</div>';
      else if (b.art === 'projekt') f = '<label class="feld"><span>Projekt</span><select data-i="' + i + '" data-k="projekt">' + D.projekte.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === b.projekt ? ' selected' : '') + '>' + esc(p.name) + ' · ' + esc(p.haus) + '</option>'; }).join('') + '</select><small>Name, Haus, Kurztext und Link kommen aus dem Atelier (probedaten/projekte.json).</small></label>';
      return '<div class="baustein"><div class="kopfzeile"><span class="mono">' + ARTEN[b.art] + '</span><span class="griffe"><button type="button" data-hoch="' + i + '" title="Nach oben" aria-label="Nach oben">↑</button><button type="button" data-runter="' + i + '" title="Nach unten" aria-label="Nach unten">↓</button><button type="button" data-weg="' + i + '" title="Baustein entfernen" aria-label="Baustein entfernen">×</button></span></div>' + f + '</div>';
    }).join('') || '<div class="leer">Noch keine Bausteine. Füge unten den ersten hinzu.</div>';
    alle('#bausteine [data-k]').forEach(function (el) {
      el.oninput = function () { A.bausteine[+el.dataset.i][el.dataset.k] = el.value; geaendert(); vorschau(); };
    });
    alle('#bausteine [data-hoch]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.hoch; if (i > 0) { var t = A.bausteine.splice(i, 1)[0]; A.bausteine.splice(i - 1, 0, t); zeichneBausteine(); geaendert(); vorschau(); } }; });
    alle('#bausteine [data-runter]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.runter; if (i < A.bausteine.length - 1) { var t = A.bausteine.splice(i, 1)[0]; A.bausteine.splice(i + 1, 0, t); zeichneBausteine(); geaendert(); vorschau(); } }; });
    alle('#bausteine [data-weg]').forEach(function (b) { b.onclick = function () { A.bausteine.splice(+b.dataset.weg, 1); zeichneBausteine(); geaendert(); vorschau(); }; });
  }
  function feld(k, label, wert, i, mehrzeilig) {
    return '<label class="feld"><span>' + esc(label) + '</span>' + (mehrzeilig ? '<textarea data-i="' + i + '" data-k="' + k + '" rows="4">' + esc(wert) + '</textarea>' : '<input data-i="' + i + '" data-k="' + k + '" value="' + esc(wert) + '">') + '</label>';
  }
  alle('#neuBaustein button').forEach(function (b) {
    b.onclick = function () {
      if (!A) return;
      var art = b.dataset.art, neu = { art: art };
      if (art === 'projekt') neu.projekt = D.projekte[0] ? D.projekte[0].id : '';
      if (art === 'knopf') { neu.text = 'Mehr dazu'; neu.link = D.versand.seite || ''; }
      A.bausteine.push(neu); zeichneBausteine(); geaendert(); vorschau();
      var letzte = alle('#bausteine .baustein').pop(); if (letzte) { var inp = letzte.querySelector('input,textarea,select'); if (inp) inp.focus(); }
    };
  });

  var vUhr = null;
  function vorschau() {
    clearTimeout(vUhr);
    vUhr = setTimeout(async function () {
      if (!A) return;
      try {
        var a = await api('POST', 'vorschau', { ausgabe: A });
        $('vorschauRahmen').srcdoc = a.html;
        $('vBetreff').textContent = a.betreff; $('vVorschau').textContent = A.vorschau || 'Ohne Vorschautext zeigt das Postfach die ersten Wörter der Mail.';
      } catch (e) { fehler(e); }
    }, 200);
  }
  alle('.geraete button').forEach(function (b) { b.onclick = function () { alle('.geraete button').forEach(function (x) { x.classList.toggle('an', x === b); }); $('rahmen').classList.toggle('handy', b.dataset.geraet === 'handy'); }; });
  $('knVorschauFenster').onclick = function () { var w = window.open('', '_blank'); if (w) { w.document.write($('vorschauRahmen').srcdoc); w.document.close(); } };
  $('knVorschauZeigen').onclick = function () { $('editor').classList.add('zeigt-vorschau'); window.scrollTo(0, 0); };
  $('knVorschauZu').onclick = function () { $('editor').classList.remove('zeigt-vorschau'); };

  function zusammenfassungAusgabe(a) { return mehrzahl((a.bausteine || []).length, 'Baustein', 'Bausteine') + ', Betreff «' + (a.betreff || 'leer') + '»'; }
  async function speichereAusgabe() {
    if (!A) return null;
    var alt = JSON.parse(aOriginal), neuDaten = JSON.parse(JSON.stringify(A));
    var a = await api('PUT', 'ausgaben/' + A.id, neuDaten);
    await lade(); oeffneAusgabe(a.ausgabe.id);
    quittung({ titel: 'Ausgabe Nr. ' + a.ausgabe.nummer + ' gespeichert.', text: vorherNachher([['Titel', alt.titel, a.ausgabe.titel], ['Betreff', alt.betreff, a.ausgabe.betreff], ['Vorschautext', alt.vorschau, a.ausgabe.vorschau], ['Liste', listenName(alt.liste), listenName(a.ausgabe.liste)], ['Bausteine', String(alt.bausteine.length), String(a.ausgabe.bausteine.length)]]) || 'Text in den Bausteinen geändert.',
      rueckgaengig: function () { return api('PUT', 'ausgaben/' + alt.id, alt); } });
    return a.ausgabe;
  }
  $('knSpeichern').onclick = function () { speichereAusgabe().catch(fehler); };
  $('knNeueAusgabe').onclick = async function () {
    if (A && JSON.stringify(A) !== aOriginal && !await frage({ titel: 'Änderungen verwerfen?', html: '<p>Die offene Ausgabe ist nicht gespeichert.</p>', ja: 'Verwerfen', nein: 'Zurück' })) return;
    try {
      var a = await api('POST', 'ausgaben', { titel: 'Neue Ausgabe', liste: $('filterListe').value || 'l-post', bausteine: [{ art: 'titel', text: '' }, { art: 'text', text: '' }] });
      await lade(); oeffneAusgabe(a.ausgabe.id); $('aTitel').focus(); $('aTitel').select();
      quittung({ titel: 'Ausgabe Nr. ' + a.ausgabe.nummer + ' angelegt.', text: 'Leer, mit einem Titel und einem Text als Anfang.', rueckgaengig: function () { return api('DELETE', 'ausgaben/' + a.ausgabe.id); } });
    } catch (e) { fehler(e); }
  };
  $('knKopie').onclick = async function () {
    try {
      var a = await api('POST', 'ausgaben/' + A.id + '/kopie'); await lade(); oeffneAusgabe(a.ausgabe.id);
      quittung({ titel: 'Kopie als Nr. ' + a.ausgabe.nummer + ' angelegt.', text: 'Entwurf mit denselben Bausteinen, noch an niemanden gegangen.', rueckgaengig: function () { return api('DELETE', 'ausgaben/' + a.ausgabe.id); } });
    } catch (e) { fehler(e); }
  };
  $('knAusgabeLoeschen').onclick = async function () {
    var a = A;
    if (!await frage({ titel: 'Ausgabe Nr. ' + a.nummer + ' löschen?', html: '<p>«' + esc(a.titel) + '» verschwindet' + (a.stand === 'versendet' ? ' auch aus dem Archiv' : '') + '. Mit «Rückgängig» in der Quittung kommt sie zurück.</p>', ja: 'Löschen', gefaehrlich: true })) return;
    try {
      var w = await api('DELETE', 'ausgaben/' + a.id); schliesseEditor(); await lade();
      quittung({ titel: 'Ausgabe Nr. ' + a.nummer + ' gelöscht.', text: esc(a.titel) + ' → <i>weg</i>', rueckgaengig: function () { return api('POST', 'ausgaben', w.ausgabe); } });
    } catch (e) { fehler(e); }
  };
  async function probemail(id) {
    try {
      var a = await api('POST', 'ausgaben/' + id + '/probemail'); await lade();
      quittung({ titel: 'Probemail liegt im Postausgang.', text: 'An ' + esc(a.mail.an) + ' · «' + esc(a.mail.betreff) + '» · ' + (a.mail.trocken ? 'nicht verschickt, Versand ist trocken' : (a.mail.gesendet ? 'verschickt' : 'Fehler: ' + esc(a.mail.fehler))), tat: { text: 'Ansehen', fn: function () { zeigMail(a.mail.id); } } });
    } catch (e) { fehler(e); }
  }
  $('knProbemail').onclick = async function () {
    if (!A) return;
    if (JSON.stringify(A) !== aOriginal) { if (!await frage({ titel: 'Erst speichern?', html: '<p>Die Probemail nimmt den gespeicherten Stand. Soll die Ausgabe jetzt gespeichert werden?</p>', ja: 'Speichern und Probemail' })) return; try { await speichereAusgabe(); } catch (e) { return fehler(e); } }
    probemail(A.id);
  };
  $('knZumVersand').onclick = async function () {
    if (!A) return;
    if (JSON.stringify(A) !== aOriginal) { if (!await frage({ titel: 'Erst speichern?', html: '<p>Verschickt wird der gespeicherte Stand. Soll die Ausgabe jetzt gespeichert werden?</p>', ja: 'Speichern und weiter' })) return; try { await speichereAusgabe(); } catch (e) { return fehler(e); } }
    zeigWeg('versand'); $('vAusgabe').value = A.id; $('vListe').value = A.liste; zeichneZusammenfassung();
  };

  /* ---------- Versand ---------- */
  function zeichneVersand() {
    var sel = $('vAusgabe'), wert = sel.value;
    var entw = D.ausgaben.filter(function (a) { return a.stand !== 'versendet'; }).sort(function (a, b) { return (b.nummer || 0) - (a.nummer || 0); });
    sel.innerHTML = entw.map(function (a) { return '<option value="' + esc(a.id) + '">Nr. ' + a.nummer + ' · ' + esc(a.titel || 'Ohne Titel') + '</option>'; }).join('') || '<option value="">Kein Entwurf da</option>';
    if (entw.some(function (a) { return a.id === wert; })) sel.value = wert;
    var a = D.ausgaben.filter(function (x) { return x.id === sel.value; })[0];
    if (a && !$('vListe').dataset.hand) $('vListe').value = a.liste;
    zeichneZusammenfassung();
  }
  $('vAusgabe').onchange = function () { $('vListe').dataset.hand = ''; var a = D.ausgaben.filter(function (x) { return x.id === $('vAusgabe').value; })[0]; if (a) $('vListe').value = a.liste; zeichneZusammenfassung(); };
  $('vListe').onchange = function () { $('vListe').dataset.hand = '1'; zeichneZusammenfassung(); };
  var Z = null;
  async function zeichneZusammenfassung() {
    var id = $('vAusgabe').value, liste = $('vListe').value, box = $('versandZusammenfassung');
    Z = null;
    if (!id) { box.innerHTML = '<div class="leer">Erst eine Ausgabe schreiben, dann verschicken.</div>'; $('knVersand').disabled = true; $('knVersandProbe').disabled = true; return; }
    try {
      var a = await api('POST', 'ausgaben/' + id + '/versand', { liste: liste });
      Z = a.zusammenfassung;
      var ausgabe = D.ausgaben.filter(function (x) { return x.id === id; })[0];
      var namen = Z.empfaenger.slice(0, 40).map(function (e) { return '<li>' + esc(e.name) + ' <span>' + esc(e.haus || e.mail) + '</span></li>'; }).join('') + (Z.empfaenger.length > 40 ? '<li><span>und ' + (Z.empfaenger.length - 40) + ' weitere</span></li>' : '');
      box.innerHTML = '<div class="zahl">' + Z.anzahl + '</div><p style="margin:0">' + mehrzahl(Z.anzahl, 'bestätigter Empfänger', 'bestätigte Empfänger') + ' in «' + esc(Z.liste_name) + '» ' + (Z.anzahl === 1 ? 'bekommt' : 'bekommen') + ' «' + esc(Z.betreff) + '».</p>'
        + '<p style="margin:0;color:var(--leise)">' + (Z.ohne_bestaetigung ? mehrzahl(Z.ohne_bestaetigung, 'Adresse', 'Adressen') + ' ohne Bestätigung und ' : '') + mehrzahl(Z.abgemeldet, 'abgemeldete Adresse', 'abgemeldete Adressen') + ' in dieser Liste ' + (Z.ohne_bestaetigung + Z.abgemeldet === 1 ? 'bekommt' : 'bekommen') + ' nichts.</p>'
        + '<p style="margin:0;color:var(--leise)">' + (ausgabe && ausgabe.probe_am ? 'Probemail zuletzt am ' + zeit(ausgabe.probe_am) + '.' : 'Noch keine Probemail für diese Ausgabe. Erst die Probe, dann der Versand.') + '</p>'
        + (Z.trocken ? '<div class="hinweis"><b>Trocken.</b> Der Versand schreibt ' + mehrzahl(Z.anzahl, 'Mail', 'Mails') + ' in den Postausgang, verschickt wird nichts.</div>' : '<div class="hinweis" style="border-color:var(--rot)"><b>Scharf.</b> Der Versand geht wirklich raus.</div>')
        + (Z.anzahl ? '<ul>' + namen + '</ul>' : '');
      $('knVersand').disabled = !Z.anzahl; $('knVersandProbe').disabled = false;
      $('knVersand').textContent = Z.anzahl ? 'An ' + mehrzahl(Z.anzahl, 'Empfänger', 'Empfänger') + ' schicken' : 'Niemand bestätigt';
    } catch (e) { box.innerHTML = '<div class="leer">' + esc(e.message) + '</div>'; $('knVersand').disabled = true; }
  }
  $('knVersandProbe').onclick = function () { if ($('vAusgabe').value) probemail($('vAusgabe').value); };
  $('knVersand').onclick = async function () {
    if (!Z || !Z.anzahl) return;
    var ausgabe = D.ausgaben.filter(function (x) { return x.id === Z.ausgabe; })[0];
    var ok = await frage({ titel: 'Wirklich an ' + mehrzahl(Z.anzahl, 'Empfänger', 'Empfänger') + ' schicken?', ja: 'Ja, schicken', nein: 'Noch nicht', gefaehrlich: true,
      html: '<p><b>Ausgabe:</b> Nr. ' + ausgabe.nummer + ' · ' + esc(ausgabe.titel) + '<br><b>Betreff:</b> ' + esc(Z.betreff) + '<br><b>Liste:</b> ' + esc(Z.liste_name) + '<br><b>An wen:</b> ' + mehrzahl(Z.anzahl, 'bestätigter Empfänger', 'bestätigte Empfänger') + (Z.ohne_bestaetigung || Z.abgemeldet ? ', ' + (Z.ohne_bestaetigung + Z.abgemeldet) + ' bleiben aussen vor' : '') + '<br><b>Absender:</b> ' + esc(D.versand.absender_name) + ' &lt;' + esc(D.versand.absender_mail) + '&gt;</p>'
        + (!ausgabe.probe_am ? '<p style="color:var(--gold)">Für diese Ausgabe gab es noch keine Probemail.</p>' : '')
        + (Z.trocken ? '<p>Der Versand ist trocken: ' + mehrzahl(Z.anzahl, 'Mail landet', 'Mails landen') + ' als Dateien im Postausgang, es geht nichts raus.</p>' : '<p style="color:var(--rot)">Der Versand ist scharf. Das lässt sich nicht zurücknehmen.</p>') });
    if (!ok) return;
    try {
      var a = await api('POST', 'ausgaben/' + Z.ausgabe + '/versand', { liste: Z.liste, bestaetigt: true });
      await lade(); zeichneVersand();
      var v = a.versendung;
      quittung({ titel: 'Ausgabe Nr. ' + ausgabe.nummer + ' ist an ' + mehrzahl(v.anzahl, 'Empfänger', 'Empfänger') + ' raus.', text: 'Stand: Entwurf → <i>verschickt am ' + datum(a.ausgabe.versendet_am) + '</i>' + (v.trocken ? ' · trocken, liegt im Postausgang' : '') + (v.fehler.length ? ' · ' + mehrzahl(v.fehler.length, 'Fehler', 'Fehler') : ''),
        rueckgaengig: v.trocken ? function () { return api('DELETE', 'versendungen/' + v.id); } : null });
    } catch (e) { fehler(e); }
  };

  /* Versandweg */
  function fuelleVersandweg() {
    var v = D.versand;
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#bereich-versand .karte:nth-child(2)')) return;
    $('eAbsenderName').value = v.absender_name || ''; $('eAbsenderMail').value = v.absender_mail || ''; $('eAntwortAn').value = v.antwort_an || ''; $('eProbeAn').value = v.probe_an || '';
    $('eWeg').value = v.weg || 'postfach'; $('eSeite').value = v.seite || ''; $('eBasis').value = v.basis || '';
    $('eHost').value = v.postfach.host || ''; $('ePort').value = v.postfach.port || ''; $('eBenutzer').value = v.postfach.benutzer || ''; $('ePasswort').value = '';
    $('ePasswortStand').textContent = v.postfach.passwort_gesetzt ? 'Ein Passwort ist hinterlegt. Leer lassen heisst: behalten.' : 'Noch kein Passwort hinterlegt. Für iCloud ist das ein App-spezifisches Passwort, kein Apple-ID-Passwort.';
    $('eDienstAdresse').value = v.dienst.adresse || ''; $('eDienstSchluessel').value = '';
    $('eDienstStand').textContent = v.dienst.schluessel_gesetzt ? 'Ein Schlüssel ist hinterlegt. Leer lassen heisst: behalten.' : 'Noch kein Schlüssel hinterlegt.';
    wegUmschalten();
  }
  function wegUmschalten() { $('eigPostfach').hidden = $('eWeg').value !== 'postfach'; $('eigDienst').hidden = $('eWeg').value !== 'dienst'; }
  $('eWeg').onchange = wegUmschalten;
  $('knVersandwegSpeichern').onclick = async function () {
    var alt = JSON.parse(JSON.stringify(D.versand));
    var neu = { absender_name: $('eAbsenderName').value, absender_mail: $('eAbsenderMail').value, antwort_an: $('eAntwortAn').value, probe_an: $('eProbeAn').value, weg: $('eWeg').value, seite: $('eSeite').value, basis: $('eBasis').value,
      postfach: { host: $('eHost').value.trim(), port: $('ePort').value.trim(), benutzer: $('eBenutzer').value.trim(), passwort: $('ePasswort').value }, dienst: { adresse: $('eDienstAdresse').value, schluessel: $('eDienstSchluessel').value } };
    try {
      var a = await api('PUT', 'versand', neu); await lade(); fuelleVersandweg();
      var n = a.versand, wegName = { postfach: 'Postfach', dienst: 'Dienst' };
      quittung({ titel: 'Versandweg gespeichert.', text: vorherNachher([['Absender', alt.absender_name, n.absender_name], ['Absender-Adresse', alt.absender_mail, n.absender_mail], ['Antworten an', alt.antwort_an, n.antwort_an], ['Probemails an', alt.probe_an, n.probe_an], ['Weg', wegName[alt.weg], wegName[n.weg]], ['Mailserver', alt.postfach.host, n.postfach.host], ['Port', String(alt.postfach.port || ''), String(n.postfach.port || '')], ['Benutzer', alt.postfach.benutzer, n.postfach.benutzer], ['Passwort', alt.postfach.passwort_gesetzt ? 'hinterlegt' : 'keins', n.postfach.passwort_gesetzt ? 'hinterlegt' : 'keins'], ['Dienst', alt.dienst.adresse, n.dienst.adresse], ['Schlüssel', alt.dienst.schluessel_gesetzt ? 'hinterlegt' : 'keiner', n.dienst.schluessel_gesetzt ? 'hinterlegt' : 'keiner'], ['Seite', alt.seite, n.seite], ['Adresse des Werkzeugs', alt.basis, n.basis]]) || 'Nichts geändert.',
        rueckgaengig: function () { var z = JSON.parse(JSON.stringify(alt)); z.postfach = { host: alt.postfach.host, port: alt.postfach.port, benutzer: alt.postfach.benutzer, passwort_loeschen: !alt.postfach.passwort_gesetzt }; z.dienst = { adresse: alt.dienst.adresse, schluessel_loeschen: !alt.dienst.schluessel_gesetzt }; return api('PUT', 'versand', z); } });
    } catch (e) { fehler(e); }
  };

  /* Postausgang */
  var ARTNAME = { probe: 'Probemail', ausgabe: 'Ausgabe', bestaetigung: 'Bestätigung' };
  function zeichnePostausgang() {
    var liste = D.postausgang.slice().reverse();
    $('tabellePostausgang').querySelector('tbody').innerHTML = liste.map(function (m) {
      var stand = m.fehler ? '<span class="stand abgemeldet">Fehler: ' + esc(m.fehler) + '</span>' : m.gesendet ? '<span class="stand bestätigt">verschickt</span>' : '<span class="stand angemeldet">trocken, nur Datei</span>';
      return '<tr><td class="leise">' + zeit(m.zeit) + '</td><td>' + (ARTNAME[m.art] || m.art) + '</td><td><span class="mini">An</span>' + esc(m.name ? m.name + ' <' + m.an + '>' : m.an) + '</td><td>' + esc(m.betreff) + '</td><td>' + stand + '</td><td style="text-align:right"><button type="button" class="kn kn--text" data-mail="' + esc(m.id) + '">Ansehen</button></td></tr>';
    }).join('');
    $('postausgangLeer').hidden = liste.length > 0;
    alle('#tabellePostausgang [data-mail]').forEach(function (b) { b.onclick = function () { zeigMail(b.dataset.mail); }; });
  }
  async function zeigMail(id) {
    try {
      var a = await api('GET', 'postausgang/' + id);
      zeigMailHtml(a.html, a.mail.betreff, 'An ' + (a.mail.name ? a.mail.name + ' <' + a.mail.an + '>' : a.mail.an) + ' · ' + zeit(a.mail.zeit) + ' · Datei ' + a.mail.datei);
    } catch (e) { fehler(e); }
  }
  function zeigMailHtml(html, betreff, zeile) {
    var d = dialog('<h2 style="font-size:22px">' + esc(betreff) + '</h2><p style="color:var(--leise);font-size:13px">' + esc(zeile) + '</p><div class="rahmen" style="padding:8px"><iframe title="Mail" style="border:0;width:100%;max-width:600px;height:min(70vh,760px);background:var(--nacht);border-radius:8px"></iframe></div><div class="ende"><button type="button" class="kn" data-zu>Schliessen</button></div>');
    d.querySelector('iframe').srcdoc = html;
    d.querySelector('[data-zu]').onclick = function () { d.close(); };
  }

  /* ---------- Archiv ---------- */
  function zeichneArchiv() {
    var liste = D.ausgaben.filter(function (a) { return a.stand === 'versendet'; }).sort(function (a, b) { return (b.versendet_am || '').localeCompare(a.versendet_am || '') || (b.nummer || 0) - (a.nummer || 0); });
    $('tabelleArchiv').querySelector('tbody').innerHTML = liste.map(function (a) {
      return '<tr><td class="leise">Nr. ' + a.nummer + '</td><td><b>' + esc(a.titel) + '</b></td><td class="leise">' + esc(a.betreff) + '</td><td><span class="mini">Datum</span>' + datum(a.versendet_am) + '</td><td class="leise"><span class="mini">Liste</span>' + esc(listenName(a.liste)) + '</td><td><span class="mini">Empfänger</span>' + a.empfaenger_zahl + '</td><td style="text-align:right;white-space:nowrap"><button type="button" class="kn kn--text" data-ansehen="' + esc(a.id) + '">Ansehen</button> &nbsp; <button type="button" class="kn kn--text" data-oeffnen="' + esc(a.id) + '">Öffnen</button> &nbsp; <button type="button" class="kn kn--text" data-kopie="' + esc(a.id) + '">Als neue Ausgabe</button></td></tr>';
    }).join('');
    $('archivLeer').hidden = liste.length > 0;
    alle('#tabelleArchiv [data-ansehen]').forEach(function (b) {
      b.onclick = async function () {
        var a = D.ausgaben.filter(function (x) { return x.id === b.dataset.ansehen; })[0];
        try { var v = await api('POST', 'vorschau', { ausgabe: a }); zeigMailHtml(v.html, v.betreff, 'Verschickt am ' + datum(a.versendet_am) + ' an ' + mehrzahl(a.empfaenger_zahl, 'Empfänger', 'Empfänger') + ' der Liste «' + listenName(a.liste) + '»'); } catch (e) { fehler(e); }
      };
    });
    alle('#tabelleArchiv [data-oeffnen]').forEach(function (b) { b.onclick = function () { zeigWeg('ausgaben'); wechsleAusgabe(b.dataset.oeffnen); }; });
    alle('#tabelleArchiv [data-kopie]').forEach(function (b) {
      b.onclick = async function () {
        try {
          var a = await api('POST', 'ausgaben/' + b.dataset.kopie + '/kopie'); await lade(); zeigWeg('ausgaben'); oeffneAusgabe(a.ausgabe.id);
          quittung({ titel: 'Kopie als Nr. ' + a.ausgabe.nummer + ' angelegt.', text: 'Entwurf mit denselben Bausteinen.', rueckgaengig: function () { return api('DELETE', 'ausgaben/' + a.ausgabe.id); } });
        } catch (e) { fehler(e); }
      };
    });
  }

  lade().catch(fehler);
})();
