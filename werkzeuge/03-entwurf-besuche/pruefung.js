/* Prüfseite · Wer hat den Entwurf geöffnet (Werkzeug 03, Tasty Studios). Aufbau wie pruefung.js von La Carte (Vorlage), Lexikon wie die Prüfung von Le Bureau
   (Einträge lex-<stichwort>: was du siehst, warum, was tun). Läuft ohne besuche.js. Liest nur /api/03-entwurf-besuche/haeuser, /heute und /fehler;
   die eine Reparatur (Fehlerliste leeren) braucht zwei Klicks. Ändert nie einen Besuch, den Schlüssel oder die Marke «neu». */
(function () {
  'use strict';
  var API = '/zentrale/api/03-entwurf-besuche/';
  var $ = function (s) { return document.querySelector(s); };
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var zeile = function (t, wert, ok, lex) { return '<div><span>' + h(t) + (lex ? ' · <a class="ln" href="#lex-' + lex + '">Was tun?</a>' : '') + '</span><b class="' + (ok === true ? 'ja' : ok === false ? 'nein' : '') + '">' + h(wert) + '</b></div>'; };
  var K = 'tasty-besuche-fehler', lokal = [];
  try { lokal = JSON.parse(localStorage.getItem(K) || '[]'); } catch (e) { /* ohne Speicher */ }
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['03-entwurf-besuche'];
  if (n) { document.querySelectorAll('[data-werkzeug]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }

  var LEX = [
    { id: 'server', titel: 'Der Server antwortet nicht', sehen: 'Das Werkzeug zeigt «Startet nicht» oder «Der Server antwortet nicht», hier steht «Antwort des Servers: keine».',
      grund: 'Der gemeinsame Server der Werkzeuge läuft nicht, oder die Verbindung ist weg.', tun: 'Im Ordner des Repos python3 zentrale/server.py starten, dann http://localhost:9100 öffnen und diese Seite neu laden.' },
    { id: 'schluessel', titel: 'Der Schlüssel wird nicht angenommen', sehen: 'Hinweis «Schlüssel wird nicht angenommen», darunter Probedaten oder der letzte abgerufene Stand.',
      grund: 'Der Dienst tasty-besuche antwortet auf einen falschen Schlüssel mit «nicht gefunden» (404). Meist ein Tippfehler oder ein alter Schlüssel.', tun: 'Unter «Der Schlüssel» entfernen und den Schlüssel von Roberts Rechner neu eintragen.' },
    { id: 'dienst', titel: 'Der Dienst ist nicht erreichbar', sehen: 'Band «Letzter abgerufener Stand» mit Datum, oder Probedaten mit dem Hinweis «Dienst nicht erreichbar».',
      grund: 'Keine Verbindung nach aussen, oder der Dienst tasty-besuche ist gerade nicht da. Nichts geht verloren: der Dienst zählt weiter.', tun: 'Später «Neu laden». Bleibt es, die Verbindung des Rechners prüfen.' },
    { id: 'probe', titel: 'Es stehen Probedaten da', sehen: 'Im Kopf «Probedaten · keine echten Besuche», unten «Du siehst Probedaten».',
      grund: 'Es ist kein Schlüssel hinterlegt. Das Werkzeug zeigt dann erfundene Häuser im Format des Dienstes, damit es bedienbar ist.', tun: 'Unter «Der Schlüssel» den Schlüssel des Dienstes eintragen.' },
    { id: 'neu', titel: 'Nichts ist als neu markiert', sehen: 'Keine Zahl im Rand, der Knopf «Als gesehen markieren» ist grau.',
      grund: '«Neu» heisst: seit dem vorletzten Öffnen dieses Werkzeugs. Wer es gerade erst geöffnet hat, sieht nur, was seither dazukam.', tun: 'Nichts. Kam versehentlich «gesehen», gleich danach «Rückgängig» in der Quittung.' },
    { id: 'fehler', titel: 'Hier stehen Fehler', sehen: 'Unter «Fehler» stehen Zeilen in Rot.',
      grund: 'Ein Teil der Oberfläche hat einen Fehler gemeldet. Die Daten sind davon nicht betroffen.', tun: 'Den Wortlaut an Robert schicken (nicht automatisch), dann «Fehler leeren» und das Werkzeug neu laden.' }
  ];
  $('#p-lex').innerHTML = LEX.map(function (x) {
    return '<details id="lex-' + x.id + '"><summary>' + h(x.titel) + '<small>lex-' + x.id + '</small></summary><dl><div><dt>Was du siehst</dt><dd>' + h(x.sehen) + '</dd></div><div><dt>Warum</dt><dd>' + h(x.grund) + '</dd></div><div><dt>Was tun</dt><dd>' + h(x.tun) + '</dd></div></dl></details>';
  }).join('');
  function oeffneZiel() { var z = location.hash && document.querySelector(location.hash); if (z && z.tagName === 'DETAILS') z.open = true; }
  addEventListener('hashchange', oeffneZiel); oeffneZiel();

  var sp = true; try { localStorage.setItem('tasty-besuche-probe', '1'); localStorage.removeItem('tasty-besuche-probe'); } catch (e) { sp = false; }
  $('#p-browser').innerHTML = zeile('Verbindungen (fetch)', typeof fetch === 'function' ? 'vorhanden' : 'fehlt', typeof fetch === 'function') +
    zeile('Speicher im Browser (Ansicht, Fehler)', sp ? 'in Ordnung' : 'gesperrt, das Werkzeug merkt sich nichts', sp) +
    zeile('Wer arbeitet', (window.WO_HAUS && WO_HAUS.wer) || 'Robert', true) +
    zeile('Fenster', innerWidth + ' × ' + innerHeight + ' px', true);

  function hole(weg, o) { return fetch(API + weg, Object.assign({ cache: 'no-store' }, o || {})).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.fehler || ('Antwort ' + r.status)); return j; }); }); }
  function lade() {
    var t0 = performance.now();
    return hole('haeuser').then(function (d) {
      var ms = Math.round(performance.now() - t0), aus = d.ausgeblendet || {};
      $('#p-server').innerHTML = zeile('Antwort des Servers', ms + ' ms', true) + zeile('Weg des Werkzeugs', '/zentrale/api/03-entwurf-besuche/', true);
      var quelle = d.quelle === 'probe' ? 'Probedaten (kein Schlüssel)' : d.quelle === 'dienst-alt' ? 'letzter abgerufener Stand' : 'Dienst tasty-besuche';
      var lex = /Schlüssel/.test(d.hinweis || '') ? 'schluessel' : d.hinweis ? 'dienst' : d.quelle === 'probe' ? 'probe' : '';
      $('#p-besuche').innerHTML = zeile('Schlüssel', d.schluessel ? 'hinterlegt (nur in der Ablage)' : 'keiner', d.schluessel ? true : null) +
        zeile('Quelle', quelle, d.quelle === 'dienst', lex) +
        (d.hinweis ? zeile('Hinweis', d.hinweis, false, lex) : '') +
        zeile('Stand', d.stand || '–', true) +
        zeile('Häuser', d.zeilen.length + ', davon ' + d.zeilen.filter(function (z) { return z.geoeffnet; }).length + ' geöffnet', true) +
        zeile('Menschliche Besuche', (d.besuche || []).length + ', davon ' + d.zeilen.reduce(function (a, z) { return a + z.neu; }, 0) + ' neu', true) +
        zeile('Ausgeblendet', (aus.maschinen || 0) + ' Maschinen, ' + (aus.eigene || 0) + ' eigene Aufrufe', true) +
        zeile('Zuletzt geöffnet', d.geoeffnet && d.geoeffnet.zuletzt ? String(d.geoeffnet.zuletzt).slice(0, 16).replace('T', ' ') + (d.geoeffnet.wer ? ' · ' + d.geoeffnet.wer : '') : 'noch nie', true, d.geoeffnet && d.geoeffnet.zuletzt ? '' : 'neu');
    }).catch(function (e) {
      $('#p-server').innerHTML = zeile('Antwort des Servers', 'keine: ' + e.message, false, 'server');
      $('#p-besuche').innerHTML = zeile('Besuche', 'nicht lesbar', false, 'server');
    }).then(function () {
      return hole('heute').then(function (x) {
        $('#p-heute').innerHTML = zeile('Punkte für «Heute»', String((x.punkte || []).length), true) + (x.punkte || []).slice(0, 6).map(function (p) { return zeile(p.text, p.wann, true); }).join('');
      }).catch(function (e) { $('#p-heute').innerHTML = zeile('Punkte für «Heute»', 'keine Antwort: ' + e.message, false, 'server'); });
    }).then(function () {
      return hole('fehler').then(function (x) { return x.fehler_liste || []; }).catch(function () { return []; }).then(function (srv) {
        var f = srv.slice().reverse().map(function (x) { return zeile('Ablage · ' + String(x.z).slice(0, 16).replace('T', ' ') + (x.a ? ' · ' + x.a : ''), x.t, false, 'fehler'); })
          .concat(lokal.slice(-5).reverse().map(function (x) { return zeile('Dieser Browser · ' + String(x.z).slice(0, 16).replace('T', ' '), x.t, false, 'fehler'); }));
        $('#p-fehler').innerHTML = f.join('') || zeile('Fehler', 'keine mitgeschrieben', true);
      });
    });
  }
  lade();

  var scharf = null, uhr = 0;
  function zuruecksetzen(b) { b.removeAttribute('data-scharf'); b.querySelector('span').textContent = b.dataset.t; }
  $('#p-rep').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rep]'); if (!b) return;
    if (scharf !== b) {
      if (scharf) zuruecksetzen(scharf);
      scharf = b; b.dataset.t = b.dataset.t || b.querySelector('span').textContent; b.setAttribute('data-scharf', ''); b.querySelector('span').textContent = 'Noch einmal klicken';
      clearTimeout(uhr); uhr = setTimeout(function () { if (scharf) { zuruecksetzen(scharf); scharf = null; } }, 5000);
      return;
    }
    clearTimeout(uhr); zuruecksetzen(b); scharf = null;
    var alt = lokal.slice();
    hole('fehler', { method: 'DELETE' }).then(function (j) {
      var vorher = (j.vorher || []).length + alt.length;
      try { localStorage.removeItem(K); lokal = []; } catch (e) { /* egal */ }
      $('#p-quit').innerHTML = 'Fehlerliste geleert. Vorher: ' + (vorher === 1 ? 'ein Eintrag' : vorher + ' Einträge') + ', nachher: keine. <button class="ln" type="button" id="p-rueck" style="font:inherit;background:none;border:0;padding:0;cursor:pointer;border-bottom:1px solid currentColor">Rückgängig</button>';
      $('#p-rueck').onclick = function () {
        hole('fehler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liste: j.vorher || [] }) }).then(function () {
          try { localStorage.setItem(K, JSON.stringify(alt)); lokal = alt; } catch (e) { /* egal */ }
          $('#p-quit').textContent = 'Zurückgenommen. Vorher: keine, nachher: ' + (vorher === 1 ? 'ein Eintrag' : vorher + ' Einträge') + '.'; lade();
        }).catch(function (e) { $('#p-quit').textContent = 'Nicht zurückgenommen: ' + e.message; });
      };
      lade();
    }).catch(function (e) { $('#p-quit').textContent = 'Nicht ausgeführt: ' + e.message; });
  });
})();
