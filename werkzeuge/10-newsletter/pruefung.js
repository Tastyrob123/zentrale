/* Prüfseite des Werkzeugs Post aus dem Studio (pruefung.html), aufgebaut wie die von La Réception: eigenes Skript, weil die Website online keine eingebetteten Skripte zulässt (CSP). */
(function () {
  var LEX = {
    VERBINDUNG: ['«Keine Verbindung.» Das Werkzeug zeigt «startet nicht».', 'Der Server-Teil läuft nicht, oder der Rechner ist gerade ohne Netz.', 'Im Terminal im Ordner des Repos «python3 zentrale/server.py» starten und die Seite neu laden. Deine Eingabe bleibt stehen, solange das Fenster offen ist.'],
    SERVER: ['«Fehler 500» oder «Antwort nicht lesbar».', 'Im Server-Teil (werkzeuge/10-newsletter/api.py) ist etwas schiefgegangen.', 'Seite neu laden. Hält es an: das Terminal mit dem Server ansehen und die Zeile mit dem Fehler an Robert geben.'],
    EINGABE: ['Eine Eingabe wurde abgewiesen, zum Beispiel «Das ist keine gültige E-Mail-Adresse».', 'Ein Pflichtfeld ist leer oder die Mail-Adresse hat keine gültige Form.', 'Den Hinweis in der Meldung lesen und das Feld ausfüllen.'],
    DUBLETTE: ['«… ist schon dabei» oder eine Adresse steht doppelt.', 'Jede Mail-Adresse darf nur einmal vorkommen. Beim Import werden Dubletten übersprungen.', 'Die vorhandene Adresse unter «Empfänger» suchen und dort die Listen ergänzen, statt sie neu anzulegen.'],
    'GESPERRT': ['«… hat sich abgemeldet und bleibt gesperrt».', 'Wer sich abgemeldet hat, bekommt keine Post mehr und kann nicht still wieder eingetragen werden.', 'Nur wenn die Person es selbst ausdrücklich wünscht: unter «Empfänger» den Stand bewusst ändern. Das zeigt eine Quittung.'],
    'BESTÄTIGUNG': ['Adressen stehen «ohne Bestätigung» und bekommen keine Ausgabe.', 'Doppelte Einwilligung: erst der Klick auf den Link in der Bestätigungsmail macht eine Adresse «bestätigt».', 'Abwarten. Die Bestätigungsmail liegt im Postausgang. Kommt nach Wochen nichts, die Adresse löschen.'],
    KONFLIKT: ['«Rückgängig wurde nicht ausgeführt».', 'Seit der Quittung hat sich die Ausgabe geändert, zum Beispiel ist sie inzwischen verschickt. Rückgängig hätte das überschrieben.', 'Die Ausgabe öffnen und von Hand ändern. Einen trockenen Versand nimmt die Quittung des Versands zurück.'],
    LISTE: ['Eine Adresse steht in keiner Liste.', 'Die Liste wurde gelöscht oder beim Anlegen keine gewählt.', 'Unter «Empfänger» die Adresse öffnen und eine Liste anhaken.'],
    VERSAND: ['Probemail oder Ausgabe liegt nur als Datei im Postausgang.', 'Der Versand ist trocken. So gewollt: hier wird nichts verschickt.', 'Scharf geschaltet wird nur auf Roberts Wort, in einem anderen Chat (in daten/10-newsletter/versand.json «scharf»).'],
    LINK: ['Bestätigen- und Abmelde-Links in den Mails zeigen auf localhost.', 'Das Werkzeug läuft nur auf diesem Rechner, Empfänger erreichen es nicht.', 'Später eine öffentliche Adresse wählen (Robert) und unter «Versand» bei «Adresse des Werkzeugs» eintragen.'],
    ABLAGE: ['«Speichern ging nicht», die Ablage ist nicht schreibbar.', 'Der Ordner daten/10-newsletter/ fehlt oder gehört einem anderen Benutzer.', 'Ordner anlegen bzw. Rechte prüfen und den Server neu starten.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht)' : 'gesperrt (privates Fenster?): die Ansicht wird nicht gemerkt' });
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
    try { lokal = JSON.parse(localStorage.getItem('newsletter-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('/zentrale/api/10-newsletter/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
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
        try { localStorage.removeItem('newsletter-fehler'); } catch (e) { }
        fetch('/zentrale/api/10-newsletter/fehler_leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^newsletter-|^rundgang-rh-newsletter/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
