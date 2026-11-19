/* Prüfseite der Beiträge (pruefung.html), Kopie aus der Prüfseite der Vorlage (La Réception). Liest den Server unter /api/08-beitraege/pruefung und die Fehler im Browser. */
(function () {
  var LEX = {
    VERBINDUNG: ['«Der Server des Werkzeugs antwortet nicht.»', 'Der Server ist nicht gestartet, oder das Netz war kurz weg.', 'Im Terminal im Ordner des Repos python3 zentrale/server.py starten, dann http://localhost:9100/werkzeuge/08-beitraege/ neu laden.'],
    SERVER: ['«Unerwartete Antwort des Servers.»', 'Etwas Unerwartetes im Server-Teil (api.py); der genaue Grund steht in der Meldung.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    FEHLT: ['«Diesen Beitrag gibt es nicht mehr.»', 'Er wurde in einem anderen Fenster gelöscht, oder ein alter Link aus «Heute» zeigt auf ihn.', 'Unter «Alle Beiträge» nachsehen. Gelöschtes kommt nur über «Rückgängig» in seiner Quittung zurück.'],
    ABLAGE: ['Hier steht «Ablage beschreibbar» rot.', 'Der Ordner daten/08-beitraege/ lässt sich nicht beschreiben (Rechte, voller Datenträger).', 'Platz schaffen oder die Rechte des Ordners prüfen, dann neu prüfen.'],
    ARCHIV: ['Hier steht «Archiv der Beiträge» rot.', 'Die Datei daten/08-beitraege/entwuerfe.json ist beschädigt, zum Beispiel von Hand geändert.', 'Die Datei aus einer Sicherung des Rechners zurückholen. Wird sie entfernt, ist das Archiv leer: Probebeiträge gibt es nicht mehr.'],
    HAEUSER: ['Im Werkzeug fehlen die Häuser.', 'haeuser/haeuser.json fehlt oder ist leer.', 'Die Datei aus dem Repo wiederherstellen. Die echten Häuser mit ihren belegten Eckdaten kommen über diese Datei, nicht über die Oberfläche.'],
    BILD: ['«Nur PNG, JPG, WebP, SVG oder GIF» oder «grösser als 8 MB», oder ein Bild eines Hauses fehlt.', 'Die Datei hat ein anderes Format, ist zu gross, oder ein Pfad in haeuser/haeuser.json zeigt ins Leere.', 'Bild als PNG oder JPG speichern, kleiner machen, oder den Pfad in haeuser/haeuser.json berichtigen.'],
    LINK: ['«Die Adresse liess sich nicht abrufen» oder «Dieser Pfad ist nicht freigegeben».', 'Adresse falsch, Seite nicht erreichbar, oder ein Pfad ausserhalb von /seite/, /werkzeuge/, /grundlagen/marke/ und /zentrale/.', 'Adresse im Browser öffnen und prüfen. Geht es nicht: Bild speichern und «Hochladen» nehmen.'],
    KOPIEREN: ['«Kopieren ging nicht.»', 'Der Browser erlaubt den Zugriff auf die Zwischenablage nicht (zum Beispiel im Rahmen ohne Freigabe).', 'Den Text in der Vorschau markieren und mit Cmd + C oder Strg + C kopieren.'],
    SPEICHER: ['Hier steht «Speicher im Browser» gelb.', 'Privates Fenster oder gesperrte Website-Daten: die letzte Ansicht wird nicht gemerkt.', 'Nichts zu tun, die Beiträge liegen auf dem Server. Wer weitermachen will, wo er war: normales Fenster nehmen.'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt: das Werkzeug läuft nur auf dem eigenen Rechner (localhost).', 'Vor einem Betrieb im Netz: Anmeldung davorsetzen (Roberts Entscheidung).']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, Rundgang)' : 'gesperrt (privates Fenster?): die letzte Ansicht wird nicht gemerkt', stichwort: ls ? '' : 'SPEICHER' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'SERVER' });
    return p;
  }
  function zeichne(p) {
    var gr = '', h = '';
    p.forEach(function (x) {
      if (x.gruppe !== gr) { gr = x.gruppe; h += '<div class="gr">' + esc(gr) + '</div>'; }
      h += '<div class="z ' + esc(x.stand) + '"><i></i><b>' + esc(x.was) + '</b><span>' + esc(x.text) + '</span>' + (x.stichwort ? '<a href="#' + esc(x.stichwort) + '">' + esc(x.stichwort) + '</a>' : '<span></span>') + '</div>';
    });
    $('#punkte').innerHTML = h;
    var rot = p.filter(function (x) { return x.stand === 'rot'; }).length;
    $('#satz').textContent = rot ? rot + (rot === 1 ? ' Punkt braucht' : ' Punkte brauchen') + ' Aufmerksamkeit. Das Stichwort rechts führt zur Erklärung.' : 'Alles in Ordnung. Gelb heisst: bewusst so, kein Fehler.';
  }
  function fehlerListe(server) {
    var lokal = [];
    try { lokal = JSON.parse(localStorage.getItem('bt-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('/zentrale/api/08-beitraege/pruefung', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { p.push({ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'gut', text: 'antwortet (api.py)' }); zeichne(p.concat(d.punkte)); fehlerListe(d.fehler); })
      .catch(function () { p.push({ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'rot', text: 'antwortet nicht', stichwort: 'VERBINDUNG' }); zeichne(p); fehlerListe([]); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('bt-fehler'); } catch (e) { }
        fetch('/zentrale/api/08-beitraege/fehler-leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^bt-ort$|^rundgang-tasty-beitraege$/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  var n = (window.WO_HAUS && WO_HAUS.namen) || {};
  document.querySelectorAll('[data-wo-name]').forEach(function (e) { var k = e.getAttribute('data-wo-name'); if (n[k]) e.textContent = n[k]; });
  pruefe();
})();
