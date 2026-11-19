/* Prüfseite des Markenbuchs (pruefung.html), Kopie des Prüfskripts der Vorlage (La Réception): eigenes Skript, Lexikon und Wege des Markenbuchs. */
(function () {
  var LEX = {
    VERBINDUNG: ['«Der Server des Werkzeugs antwortet nicht» oder «Gespeicherter Stand».', 'Der Server (zentrale/server.py) läuft nicht, oder das Netz war kurz weg. Das Markenbuch zeigt dann den gespeicherten Stand aus probedaten/auslese.json.', 'Server starten: python3 zentrale/server.py im Projektordner, dann die Seite neu laden. «Neu lesen» in der Leiste holt den frischen Stand.'],
    AUSLESE: ['«Unerwartete Antwort des Servers» beim Lesen der Website.', 'Eine Stil-Datei der Agentur-Seite liess sich nicht lesen, zum Beispiel nach einem Umbau von seite/.', 'Oben unter «Website» nachsehen. Bis es behoben ist, gilt der gespeicherte Stand. Neu erzeugen: python3 werkzeuge/11-markenbuch/api.py'],
    SEITE: ['«Keine Stil-Datei in seite/ gefunden.»', 'Der Ordner seite/ fehlt oder liegt woanders.', 'Den Ordner seite/ aus dem Repo holen (git pull). Das Markenbuch liest nur, es ändert dort nichts.'],
    LOGO: ['«Die Logo-Datei … fehlt.»', 'Eine Datei aus grundlagen/marke/logo/ ist nicht da.', 'grundlagen/ aus dem Repo holen. Die Logo-Dateien werden nie nachgezeichnet oder neu erzeugt.'],
    SCHRIFT: ['«Die Schriftdatei … liess sich nicht lesen.»', 'Eine Datei in grundlagen/marke/schriften/ fehlt oder ist beschädigt.', 'grundlagen/ aus dem Repo holen. Cormorant Garamond und Montserrat kommen von Google Fonts; ohne Netz zeigen die Proben eine Ersatzschrift.'],
    SPEICHERN: ['«Der Stand ist unvollständig» oder Speichern bleibt gelb.', 'Der Server konnte daten/11-markenbuch/stand.json nicht schreiben, oder er läuft nicht.', 'Server starten (python3 zentrale/server.py), Seite neu laden, noch einmal Speichern. Die Website und die Grundlagen sind davon nie betroffen.'],
    PDF: ['Der Druckdialog öffnet sich nicht oder ein Blatt fehlt im PDF.', 'Der Browser hat das Drucken gesperrt, oder ein Blatt liess sich nicht setzen (steht dann in der Fehlerliste oben).', 'Noch einmal «Als PDF» klicken und im Dialog «Als PDF sichern» wählen. In Safari: Ablage, Als PDF exportieren.'],
    KOPIEREN: ['Ein Wert landet nicht in der Zwischenablage.', 'Der Browser erlaubt das Kopieren nur nach einem Klick und in manchen Rahmen gar nicht.', 'Den Wert noch einmal anklicken. Hilft das nicht, das Markenbuch allein öffnen (nicht in der Zentrale) oder den Wert aus dem Fenster «Mehr» abschreiben.'],
    SKRIPT: ['Ein Fehler steht oben in der Liste, ohne dass eine Meldung kam.', 'Ein Fehler im Skript des Werkzeugs.', 'Seite neu laden. Wiederholt es sich: Wortlaut und Uhrzeit aus der Liste an Robert.'],
    UNERWARTET: ['Eine Meldung ohne eigenes Stichwort.', 'Etwas Unerwartetes; der genaue Grund steht in der Meldung.', 'Seite neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, Rundgang)' : 'gesperrt (privates Fenster?): die letzte Ansicht wird nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'UNERWARTET' });
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
    try { lokal = JSON.parse(localStorage.getItem('ws-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('/zentrale/api/11-markenbuch/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
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
        try { localStorage.removeItem('ws-fehler'); } catch (e) { }
        fetch('/zentrale/api/11-markenbuch/fehler_leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^mb-|^rundgang-tasty-markenbuch|^ws-fehler/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
/* Name des Werkzeugs aus der einen Stelle (kleid/tasty.js › WO_HAUS.namen) */
(function () {
  var n = (window.WO_HAUS && WO_HAUS.namen) || {};
  document.querySelectorAll('[data-wo-name]').forEach(function (e) { var k = e.getAttribute('data-wo-name'); if (n[k]) e.textContent = n[k]; });
  if (n['11-markenbuch']) document.title = 'Prüfung · ' + n['11-markenbuch'] + ' · ' + (WO_HAUS.name || '');
})();
