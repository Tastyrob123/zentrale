/* Prüfseite des Werkzeugs Angebot (pruefung.html), aufgebaut wie die von La Réception: eigenes Skript, weil die Website online keine eingebetteten Skripte zulässt (CSP). */
(function () {
  var LEX = {
    VERBINDUNG: ['«Keine Verbindung.» Das Werkzeug zeigt «startet nicht».', 'Der Server-Teil läuft nicht, oder der Rechner ist gerade ohne Netz.', 'Im Terminal im Ordner des Repos «python3 zentrale/server.py» starten und die Seite neu laden. Deine Eingabe bleibt stehen, solange das Fenster offen ist.'],
    SERVER: ['«Fehler 500» oder «Antwort nicht lesbar».', 'Im Server-Teil (werkzeuge/05-angebot/api.py) ist etwas schiefgegangen.', 'Seite neu laden. Hält es an: das Terminal mit dem Server ansehen und die Zeile mit dem Fehler an Robert geben.'],
    PREIS: ['Ein Preis steht als «Preis fehlt» da.', 'In den Grundlagen (Angebot.md) steht für diese Position kein Betrag. Das Werkzeug erfindet keinen.', 'Robert legt den Preis fest. Dann in preise.json eintragen und das Stand-Datum anpassen. Bis dahin steht im Angebot «wird nach dem Gespräch festgelegt».'],
    PREISE: ['Das Werkzeug lädt keine Preise.', 'preise.json fehlt oder ist kein gültiges JSON (oft ein Komma zu viel nach dem letzten Eintrag).', 'Die Datei aus Git wiederherstellen oder die Stelle in einem Editor prüfen, der JSON anzeigt.'],
    SPANNE: ['«Ausserhalb der Spanne».', 'Für Schulung und Backoffice gibt es nur eine Spanne; der eingetragene Betrag liegt darunter oder darüber.', 'Betrag prüfen. Er bleibt stehen, wenn er so gewollt ist.'],
    'WÄHRUNG': ['«Das Haus rechnet in CHF, die Preise liegen nur in EUR vor.»', 'Für Schweizer Häuser gibt es in den Grundlagen nur wenige Preise in Franken.', 'Mit Robert klären, welcher Betrag gilt, und ihn unter «Umfang und Text» von Hand eintragen.'],
    HAUS: ['«Ein Angebot braucht ein Haus» oder ein Angebot ohne Haus.', 'Beim Anlegen fehlte das Haus, oder das Haus wurde ausserhalb des Werkzeugs gelöscht.', 'Haus unter «Häuser» neu eintragen (gleicher Name). Ein Haus mit Angeboten lässt sich im Werkzeug nicht löschen.'],
    NUMMER: ['Eine Angebotsnummer steht doppelt.', 'Die Ablage wurde von Hand bearbeitet oder aus zwei Ständen zusammengesetzt.', 'Unter «Alle Daten herunterladen» sichern, dann das doppelte Angebot im Werkzeug löschen und neu speichern; es bekommt die nächste freie Nummer.'],
    ABLAGE: ['«Speichern ging nicht», die Ablage ist nicht schreibbar.', 'Der Ordner daten/05-angebot/ fehlt oder gehört einem anderen Benutzer.', 'Ordner anlegen bzw. Rechte prüfen und den Server neu starten.'],
    DATEI: ['Häuser oder Angebote lassen sich nicht lesen.', 'Eine Datei in daten/05-angebot/ ist beschädigt.', 'Nicht von Hand bearbeiten. Robert melden; die Probedaten liegen in probedaten/ und werden genommen, wenn die Datei fehlt.'],
    PDF: ['Das PDF sieht anders aus als das Blatt, hat eine leere Seite oder abgeschnittene Ränder.', 'Im Druckfenster stehen Ränder oder Kopf- und Fusszeilen des Browsers an.', 'Im Druckfenster «Als PDF sichern» wählen, Ränder auf «Keine», Kopf- und Fusszeilen aus, Massstab 100 %. Das Blatt bringt die 2,54 cm Rand selbst mit.'],
    EINGABE: ['Eine Eingabe wurde abgewiesen.', 'Pflichtfeld leer (Name des Hauses) oder noch nichts im Umfang angeklickt.', 'Den Hinweis in der Meldung lesen und das Feld ausfüllen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, zuletzt gewähltes Haus)' : 'gesperrt (privates Fenster?): Ansicht und Haus werden nicht gemerkt' });
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
    try { lokal = JSON.parse(localStorage.getItem('angebot-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('/zentrale/api/05-angebot/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
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
        try { localStorage.removeItem('angebot-fehler'); } catch (e) { }
        fetch('/zentrale/api/05-angebot/fehler_leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^angebot-|^angebot\.|^rundgang-rh-angebot/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
