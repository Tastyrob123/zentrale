/* Prüfseite des KI-Checks (pruefung.html, aus La Réception): eigenes Skript, keine eingebetteten Skripte. Prüft über die Schnittstellen von api.py,
   die das Werkzeug ohnehin hat (nichts Neues am Server), und erklärt jedes Stichwort der Meldungen. Schreibt nichts in die Ablage. */
(function () {
  var API = '/zentrale/api/09-ki-check/';
  var LEX = {
    NETZ: ['«Der Server antwortet nicht.»', 'Der Server der Zentrale läuft nicht, oder die Verbindung war kurz weg.', 'Im Ordner des Repos python3 zentrale/server.py starten, dann neu laden. Nichts ist verloren: die Checks liegen in daten/09-ki-check/.'],
    SERVER: ['«Unerwartete Antwort des Servers» oder eine Meldung mit Fehlertext.', 'Etwas Unerwartetes in api.py; der genaue Grund steht in der Meldung und im Fenster des Servers.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    CHECK: ['«Diesen Check gibt es nicht.»', 'Der Check wurde in einem anderen Fenster gelöscht, oder der Link aus der Zentrale ist älter als der Check.', 'Im Werkzeug «Neu laden». Die Liste zeigt dann den aktuellen Stand.'],
    EINGABE: ['Auf der öffentlichen Seite: «Bitte geben Sie …» unter dem Formular.', 'Adresse, Mail oder Einverständnis fehlt oder hat eine Form, die keine sein kann.', 'Nichts zu tun: der Gast sieht den Hinweis selbst und ergänzt.'],
    GRENZE: ['Auf der öffentlichen Seite: «Diese Website wurde heute schon … Mal geprüft» oder «Für heute sind alle Checks vergeben».', 'Schutz vor Missbrauch: je Website, je Mail-Adresse und insgesamt gibt es eine Grenze am Tag (api.py, GRENZEN).', 'Am nächsten Tag geht es wieder. Für eigene Versuche ein anderes Probehaus nehmen oder daten/09-ki-check/grenzen.json entfernen.'],
    SEITE: ['Auf der öffentlichen Seite: die Website liess sich nicht lesen.', 'Adresse falsch, Seite nicht erreichbar, oder (in der Cloud) fremde Seiten sind gesperrt.', 'Adresse im Browser öffnen und prüfen. Zum Ausprobieren die Probehäuser nehmen (siehe UEBERGABE.md).'],
    KUNDENLISTE: ['«In die Kundenliste» zeigt eine Meldung statt der Quittung.', 'Der Check ist inzwischen gelöscht, oder die Ablage ist nicht beschreibbar.', 'Neu laden und noch einmal. Die Vormerkung steht in daten/09-ki-check/kundenliste-uebergabe.json.'],
    MAIL: ['«Mail an den Gast» öffnet kein Fenster.', 'Die Vorlage (mail.py) fand den Check nicht.', 'Neu laden. Verschickt wird ohnehin nichts: die Mail ist eine Vorlage zum Kopieren.'],
    PROBEDATEN: ['«probedaten/checks.json fehlt oder ist kaputt.»', 'Die Datei mit den erfundenen Checks im Ordner des Werkzeugs fehlt oder wurde von Hand verändert.', 'Die Datei aus Git zurückholen (git checkout werkzeuge/09-ki-check/probedaten/checks.json).'],
    TABELLE: ['«Die Tabelle liess sich nicht sichern.»', 'Der Browser hat das Herunterladen gesperrt.', 'Herunterladen für diese Seite erlauben und noch einmal «Als Tabelle sichern».'],
    VERSAND: ['Es wird keine Mail verschickt.', 'So gewollt: Versand bauen ja, auslösen nie (CLAUDE.md). Die Mail ist eine fertige Vorlage.', 'Text kopieren und selbst schicken. Den Versand schliesst erst ein eigener Auftrag an.'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt, solange es nur lokal läuft.', 'Vor dem ersten Schritt online: Anmeldung mit Passwort davorsetzen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['09-ki-check'];
  if (n) { document.querySelectorAll('[data-wo-name]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (Zeitraum, Rundgang)' : 'gesperrt (privates Fenster?): Zeitraum und Rundgang werden nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'SERVER' });
    return p;
  }
  function hole(weg) { return fetch(weg, { cache: 'no-store' }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.fehler || r.status); return j; }); }); }
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
  function fehlerListe() {
    var lokal = [];
    try { lokal = JSON.parse(localStorage.getItem('tasty-ki-check-fehler') || '[]').reverse(); } catch (e) { }
    $('#fehler').innerHTML = lokal.length ? lokal.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.z).toLocaleString('de-DE')) + '</time>' + esc(x.t) + ' <small>(' + esc(x.a || '') + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    $('#punkte').innerHTML = '<p class="leer">Prüfe …</p>';
    var checks = hole(API + 'checks').then(function (d) {
      var l = d.checks || [], probe = l.filter(function (c) { return /-p\d{3}$/.test(c.id); }).length;
      p.push({ gruppe: 'Server', was: 'Server und api.py', stand: 'gut', text: 'antwortet' });
      p.push({ gruppe: 'Ablage', was: 'Checks in daten/09-ki-check/', stand: l.length ? 'gut' : 'gelb', text: l.length ? l.length + ' Checks' + (probe ? ', davon ' + probe + ' Probedaten' : '') : 'noch keiner (Probedaten lassen sich im Werkzeug laden)', stichwort: l.length ? '' : 'PROBEDATEN' });
      var kaputt = l.filter(function (c) { return !c.note || !c.bereiche || !c.haus; }).length;
      p.push({ gruppe: 'Ablage', was: 'Checks vollständig', stand: kaputt ? 'rot' : 'gut', text: kaputt ? kaputt + ' Checks ohne Note, Haus oder Bereiche' : 'jeder Check mit Haus, Note und Bereichen', stichwort: kaputt ? 'SERVER' : '' });
      return l.length ? hole(API + 'mail?id=' + encodeURIComponent(l[0].id)).then(function (m) {
        p.push({ gruppe: 'Für den Gast', was: 'Mail-Vorlage', stand: m.mail && m.mail.text ? 'gut' : 'rot', text: m.mail ? 'Betreff «' + m.mail.betreff + '»' : 'leer', stichwort: m.mail ? '' : 'MAIL' });
      }, function () { p.push({ gruppe: 'Für den Gast', was: 'Mail-Vorlage', stand: 'rot', text: 'lässt sich nicht bauen', stichwort: 'MAIL' }); }) : null;
    }, function () { p.push({ gruppe: 'Server', was: 'Server und api.py', stand: 'rot', text: 'antwortet nicht', stichwort: 'NETZ' }); });
    var grenzen = hole(API + 'grenzen').then(function (d) {
      var g = d.grenzen || {};
      p.push({ gruppe: 'Für den Gast', was: 'Schutz vor Missbrauch', stand: 'gut', text: 'je Website ' + g.je_adresse + ', je Mail ' + g.je_mail + ', insgesamt ' + g.gesamt + ' Checks am Tag', stichwort: '' });
    }, function () { });
    var heute = hole(API + 'heute').then(function (d) {
      p.push({ gruppe: 'Zentrale', was: 'Schnittstelle «Heute»', stand: 'gut', text: (d.punkte || []).length + ' Punkte für die Startansicht der Zentrale' });
    }, function () { p.push({ gruppe: 'Zentrale', was: 'Schnittstelle «Heute»', stand: 'rot', text: 'antwortet nicht', stichwort: 'SERVER' }); });
    var haus = fetch('probedaten/haeuser/seehaus/', { cache: 'no-store' }).then(function (r) {
      p.push({ gruppe: 'Für den Gast', was: 'Probehäuser zum Ausprobieren', stand: r.ok ? 'gut' : 'gelb', text: r.ok ? 'erreichbar (seehaus, zur-linde, villa-nova)' : 'nicht erreichbar', stichwort: r.ok ? '' : 'SEITE' });
    }, function () { });
    Promise.all([checks, grenzen, heute, haus]).then(function () {
      p.push({ gruppe: 'Für den Gast', was: 'Versand der Mail', stand: 'gelb', text: 'bewusst nicht eingebaut: Vorlage zum Kopieren', stichwort: 'VERSAND' });
      p.push({ gruppe: 'Für den Gast', was: 'Anmeldung', stand: 'gelb', text: 'keine, solange das Werkzeug nur lokal läuft', stichwort: 'ANMELDUNG' });
      var ord = ['Browser', 'Server', 'Ablage', 'Für den Gast', 'Zentrale'];
      p.sort(function (a, b) { return ord.indexOf(a.gruppe) - ord.indexOf(b.gruppe); });
      zeichne(p); fehlerListe();
    });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') { try { localStorage.removeItem('tasty-ki-check-fehler'); } catch (e) { } b.textContent = 'Geleert'; pruefe(); }
      else { try { Object.keys(localStorage).forEach(function (k) { if (/^tasty-ki-check-|^rundgang-tasty-ki-check/.test(k)) localStorage.removeItem(k); }); } catch (e) { } b.textContent = 'Zurückgesetzt'; }
      setTimeout(function () { b.textContent = text; }, 2000);
    };
  });
  pruefe();
})();
