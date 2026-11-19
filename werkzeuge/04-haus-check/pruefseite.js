/* Prüfseite des Haus-Checks (pruefung.html, aus La Réception): eigenes Skript, keine eingebetteten Skripte. Prüft über die Schnittstellen von api.py,
   die das Werkzeug ohnehin hat (nichts Neues am Server), und erklärt jedes Stichwort der Meldungen. Schreibt nichts in die Ablage. */
(function () {
  var API = '/zentrale/api/04-haus-check/';
  var LEX = {
    NETZ: ['«Der Server antwortet nicht.»', 'Der Server der Zentrale läuft nicht, oder die Verbindung war kurz weg.', 'Im Ordner des Repos python3 zentrale/server.py starten, dann neu laden. Nichts ist verloren: die Häuser liegen in daten/04-haus-check/.'],
    SERVER: ['«Unerwartete Antwort des Servers» oder eine Meldung mit Fehlertext.', 'Etwas Unerwartetes in api.py oder pruefung.py; der genaue Grund steht in der Meldung und im Fenster des Servers.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    EINGABE: ['«Bitte eine Adresse wie www.beispielhotel.de eingeben.»', 'Im Feld steht keine Adresse, die eine Website sein kann.', 'Die Adresse so eintragen, wie sie im Browser oben steht, etwa www.hotel-am-see.de.'],
    LESEN: ['«Das ging nicht» unter «Neues Haus», mit einem Grund.', 'Die Website war nicht erreichbar, antwortete mit einem Fehler oder sperrt Abrufe. In der Cloud sind fremde Seiten ganz gesperrt.', 'Adresse im Browser öffnen und prüfen, dann noch einmal. Zum Ausprobieren die drei Probehäuser unter dem Feld nehmen.'],
    HAUS: ['«Haus nicht gefunden», «Check nicht gefunden» oder hier «Häuser vollständig» rot.', 'Das Haus wurde in einem anderen Fenster in den Papierkorb gelegt oder der Check entfernt. Rot hier: Eine frühere Fassung liess ein Haus ohne Check in der Ablage, wenn man seinen einzigen Check entfernte (heute geht das Haus dann mit dem Check in den Papierkorb).', 'Im Werkzeug «Neu laden». Liegt das Haus im Papierkorb: dort «Zurückholen». Ein Haus ohne Check unter «Neues Haus» neu prüfen (dieselbe Adresse, bei einem Probehaus das Probehaus unter dem Feld) und speichern; der Check kommt in seinen Verlauf.'],
    KUNDENLISTE: ['Nach «In die Kundenliste» steht «vorgemerkt» statt «in der Kundenliste».', 'Die Kundenliste (Werkzeug 02) hat ihren Weg für neue Häuser noch nicht oder hat die Meldung abgelehnt. Das Haus liegt dann in daten/04-haus-check/fuer-kundenliste.json.', 'Nichts geht verloren. Sobald die Kundenliste den Weg hat: «Aus der Kundenliste» und wieder «In die Kundenliste».'],
    PROBEDATEN: ['Unter dem Feld stehen keine Probehäuser.', 'Der Ordner probedaten/ im Werkzeug fehlt oder wurde verändert.', 'Den Ordner aus Git zurückholen (git checkout werkzeuge/04-haus-check/probedaten).'],
    TABELLE: ['«Die Tabelle liess sich nicht sichern.»', 'Der Browser hat das Herunterladen gesperrt.', 'Herunterladen für diese Seite erlauben und noch einmal «Als Tabelle sichern».'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt, solange es nur lokal läuft.', 'Vor dem ersten Schritt online: Anmeldung mit Passwort davorsetzen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['04-haus-check'];
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
    try { lokal = JSON.parse(localStorage.getItem('tasty-haus-check-fehler') || '[]').reverse(); } catch (e) { }
    $('#fehler').innerHTML = lokal.length ? lokal.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.z).toLocaleString('de-DE')) + '</time>' + esc(x.t) + ' <small>(' + esc(x.a || '') + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    $('#punkte').innerHTML = '<p class="leer">Prüfe …</p>';
    var haeuser = hole(API + 'haeuser').then(function (d) {
      var l = d.haeuser || [], probe = l.filter(function (h) { return /^probe-/.test(h.kennung); }).length, kl = l.filter(function (h) { return h.kundenliste; });
      p.push({ gruppe: 'Server', was: 'Server und api.py', stand: 'gut', text: 'antwortet' });
      p.push({ gruppe: 'Ablage', was: 'Häuser in daten/04-haus-check/', stand: l.length ? 'gut' : 'gelb', text: l.length ? (l.length === 1 ? 'ein Haus' : l.length + ' Häuser') + (probe ? ', davon ' + probe + ' Probedaten' : '') + (d.papierkorb ? ', ' + d.papierkorb + ' im Papierkorb' : '') : 'noch keines (Probedaten lassen sich im Werkzeug laden)', stichwort: l.length ? '' : 'PROBEDATEN' });
      var kaputt = l.filter(function (h) { return !h.letzter; }).length;
      p.push({ gruppe: 'Ablage', was: 'Häuser vollständig', stand: kaputt ? 'rot' : 'gut', text: kaputt ? (kaputt === 1 ? 'ein Haus' : kaputt + ' Häuser') + ' ohne gespeicherten Check' : 'jedes Haus mit mindestens einem Check', stichwort: kaputt ? 'HAUS' : '' });
      var ablage = kl.filter(function (h) { return h.kundenliste.weg === 'ablage'; }).length;
      p.push({ gruppe: 'Kundenliste', was: 'Weg zur Kundenliste', stand: ablage ? 'gelb' : 'gut', text: !kl.length ? 'noch kein Haus gemeldet' : ablage ? ablage + ' von ' + kl.length + ' Meldungen in der eigenen Ablage vorgemerkt' : (kl.length === 1 ? 'ein Haus' : kl.length + ' Häuser') + ' in der Kundenliste', stichwort: ablage ? 'KUNDENLISTE' : '' });
    }, function () { p.push({ gruppe: 'Server', was: 'Server und api.py', stand: 'rot', text: 'antwortet nicht', stichwort: 'NETZ' }); });
    var probe = hole(API + 'probehaeuser').then(function (d) {
      var l = d.haeuser || [];
      p.push({ gruppe: 'Prüfen', was: 'Probehäuser zum Ausprobieren', stand: l.length ? 'gut' : 'rot', text: l.length ? l.map(function (h) { return h.name; }).join(', ') : 'keine gefunden', stichwort: l.length ? '' : 'PROBEDATEN' });
    }, function () { p.push({ gruppe: 'Prüfen', was: 'Probehäuser zum Ausprobieren', stand: 'rot', text: 'nicht erreichbar', stichwort: 'PROBEDATEN' }); });
    var heute = hole(API + 'heute').then(function (d) {
      p.push({ gruppe: 'Zentrale', was: 'Schnittstelle «Heute»', stand: 'gut', text: (d.punkte || []).length + ' Punkte für die Startansicht der Zentrale (der Haus-Check hat keine Termine)' });
    }, function () { p.push({ gruppe: 'Zentrale', was: 'Schnittstelle «Heute»', stand: 'rot', text: 'antwortet nicht', stichwort: 'SERVER' }); });
    Promise.all([haeuser, probe, heute]).then(function () {
      p.push({ gruppe: 'Prüfen', was: 'Fremde Websites lesen', stand: 'gelb', text: 'nur am eigenen Rechner möglich; in der Cloud sind fremde Seiten gesperrt', stichwort: 'LESEN' });
      p.push({ gruppe: 'Zentrale', was: 'Anmeldung', stand: 'gelb', text: 'keine, solange das Werkzeug nur lokal läuft', stichwort: 'ANMELDUNG' });
      var ord = ['Browser', 'Server', 'Ablage', 'Prüfen', 'Kundenliste', 'Zentrale'];
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
      if (b.dataset.rep === 'fehler') { try { localStorage.removeItem('tasty-haus-check-fehler'); } catch (e) { } b.textContent = 'Geleert'; pruefe(); }
      else { try { Object.keys(localStorage).forEach(function (k) { if (/^tasty-haus-check-|^rundgang-tasty-haus-check/.test(k)) localStorage.removeItem(k); }); } catch (e) { } b.textContent = 'Zurückgesetzt'; }
      setTimeout(function () { b.textContent = text; }, 2000);
    };
  });
  pruefe();
})();
