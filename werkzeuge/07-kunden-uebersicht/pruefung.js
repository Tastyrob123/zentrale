/* Prüfseite der Kunden-Übersicht (pruefung.html, aus der Vorlage: pruefung.js von La Réception). Eigenes Skript, damit die Seite ohne das Werkzeug läuft. */
(function () {
  var LEX = {
    VERBINDUNG: ['«Der Server-Teil antwortet nicht.» oder das Werkzeug zeigt «startet nicht».', 'Der Server ist nicht gestartet, oder er lief auf einem anderen Rechner.', 'Im Terminal im Ordner des Repos python3 zentrale/server.py starten, dann http://localhost:9100/werkzeuge/07-kunden-uebersicht/ neu laden.'],
    ABRUF: ['«Antwortet nicht», rote Striche im Verlauf, oder oben steht eine Seite als ausgefallen.', 'Die Seite hat in acht Sekunden nicht geantwortet, die Adresse gibt es nicht, oder die Seite meldet einen Fehler (etwa 500). Auf einem Rechner ohne Zugang nach draussen sind fremde Adressen gesperrt.', 'Adresse im Browser öffnen. Lädt sie dort, später «Jetzt abrufen». Lädt sie nicht: Hosting prüfen (Vercel, Anbieter des Hauses). Die Probeadresse «Alpenrose» ist absichtlich tot.'],
    ADRESSE: ['«Adresse muss mit http:// oder https:// beginnen» oder «keine Adresse hinterlegt».', 'Bei den Angaben des Kunden fehlt die Adresse oder sie hat eine andere Form.', 'Beim Kunden «Angaben ändern», die volle Adresse der Seite eintragen (https://…), übernehmen und speichern.'],
    BETRAG: ['«Der Betrag ist keine Zahl.»', 'Im Feld steht ein Wort oder ein Zeichen, das keine Zahl ist.', 'Nur Ziffern, Komma für die Cent (20 oder 1,25). Wer den Betrag nicht kennt, lässt das Feld leer: dann steht «offen».'],
    OFFEN: ['Bei Kosten oder Vertrag steht «offen».', 'Der Betrag ist nicht eingetragen. Das Werkzeug schätzt nie.', 'Rechnung oder Vertrag nachsehen und den Betrag mit Quelle eintragen.'],
    NAME: ['«Ein Name muss sein.»', 'Beim Anlegen oder bei den Angaben ist der Name leer.', 'Den Namen des Hauses eintragen, so wie er auf der Website steht.'],
    KUNDE: ['«Kunde nicht gefunden.»', 'Der Kunde wurde in einem anderen Fenster entfernt, oder der Direktlink (?kunde=…) ist alt.', 'Neu laden. Fehlt er, über die Quittung in dem Fenster, in dem er entfernt wurde, «Rückgängig» drücken.'],
    QUITTUNG: ['«Liess sich nicht zurücknehmen.»', 'Seit der Quittung hat sich der Kunde geändert (zum Beispiel wurde er entfernt), oder die Ablage wurde auf Probedaten zurückgesetzt.', 'Neu laden und den alten Stand von Hand eintragen; «Vorher, nachher» der Quittung zeigt ihn.'],
    EINGABE: ['Eine Eingabe wurde abgewiesen.', 'Feld in falscher Form (Datum, Betrag) oder ein unbekanntes Feld.', 'Den Hinweis in der Meldung lesen und das Feld anpassen.'],
    ABLAGE: ['Hier oben steht ein Teil der Ablage rot.', 'Eine Datei in daten/07-kunden-uebersicht/ ist beschädigt, etwa von Hand geändert.', 'Die Datei aus einer Sicherung des Rechners zurückholen. Nur zum Ausprobieren: «Probedaten zurücksetzen» unter «So wird gerechnet» legt sie neu an (eigene Einträge gehen dabei verloren).'],
    PROBEDATEN: ['Oben im Werkzeug steht «Probedaten».', 'Die Kunden sind erfunden, damit sich alles ausprobieren lässt. Vier Probeseiten liegen im Werkzeug, eine Adresse ist absichtlich tot.', 'Nichts zu tun. Echte Kunden mit «Kunde anlegen» eintragen; die Probe-Kunden einzeln entfernen.'],
    BESUCHER: ['Bei «Besucher» steht «offen».', 'Die Zahl liefert später das Werkzeug 03 über das Kürzel des Hauses. Bis dahin wird nichts erfunden.', 'Beim Kunden das Kürzel für 03 eintragen, damit es später passt.'],
    SPEICHERN: ['Unten steht gelb «Eingaben noch nicht gespeichert».', 'Im Fenster übernommene Änderungen warten, bis «Speichern» sie in die Ablage schreibt.', '«Vorher, nachher» ansehen, dann «Speichern». Wer die Seite vorher schliesst, wird gefragt.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var NAME = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['07-kunden-uebersicht'];
  if (NAME) { document.querySelectorAll('[data-name]').forEach(function (e) { e.textContent = NAME; }); document.title = 'Prüfung · ' + NAME + ' · ' + WO_HAUS.name; }
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (Zeitraum, Rundgang gesehen)' : 'gesperrt (privates Fenster?): Zeitraum wird nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: '' });
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
    try { lokal = JSON.parse(localStorage.getItem('tasty-kunden-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Ablage' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('/zentrale/api/07-kunden-uebersicht/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { zeichne(p.concat(d.punkte)); fehlerListe(d.fehler); })
      .catch(function () { p.push({ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'rot', text: 'antwortet nicht', stichwort: 'VERBINDUNG' }); zeichne(p); fehlerListe([]); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('tasty-kunden-fehler'); } catch (e) { }
        fetch('/zentrale/api/07-kunden-uebersicht/fehler_leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { ['tasty-kunden-tage', 'rundgang-tasty-kunden-uebersicht'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
