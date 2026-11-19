/* pruefung.js · Prüfseite der Kundenliste (Tasty Studios), aus pruefung-haus.js von Le Bureau (Vorlage): Name des Werkzeugs aus der einen Stelle,
   «Zum Werkzeug» führt in dieses Werkzeug. Prüft Browser, Server und Liste, zeigt die letzten Fehler, hält Reparaturen bereit
   und das Lexikon der Stichworte, auf das «Was tun?» in jeder Meldung zeigt (#lex-<stichwort>). Braucht weder kundenliste.js noch oberflaeche.js. */
(function () {
  var A = '/zentrale/api/02-kundenliste/';
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['02-kundenliste'];
  if (n) { document.querySelectorAll('[data-werkzeug]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }
  var LEX = [
    { id: 'keine-verbindung', titel: 'Der Server antwortet nicht', sehen: 'Meldung «Der Server des Werkzeugs antwortet nicht», oder hier unter «Server und Liste» steht ein rotes Zeichen.',
      grund: 'Der gemeinsame Server der Werkzeuge läuft nicht, oder die Verbindung ist weg.', tun: 'Im Projektordner python3 zentrale/server.py starten, dann die Seite neu laden. Eingaben, die noch nicht gespeichert sind, bleiben im offenen Fenster stehen.' },
    { id: 'unerwartet', titel: 'Unerwartete Antwort des Servers', sehen: 'Meldung «Unerwartete Antwort des Servers (Zahl)».',
      grund: 'Der Server hat etwas geantwortet, das das Werkzeug nicht versteht, meist nach einer Änderung an api.py.', tun: 'Die Seite neu laden. Bleibt es, die letzten Fehler unten auf dieser Seite lesen und den Wortlaut an Robert schicken.' },
    { id: 'eingabe', titel: 'Eine Eingabe passt nicht', sehen: 'Meldung wie «Ein Haus braucht einen Namen», «Datum bitte als Jahr-Monat-Tag» oder «Unbekannter Stand».',
      grund: 'Ein Feld ist leer oder hat eine Form, die die Liste nicht kennt.', tun: 'Das Feld ausfüllen oder den Stand aus der Auswahl nehmen, dann noch einmal speichern. Nichts anderes wurde geändert.' },
    { id: 'nicht-gefunden', titel: 'Dieses Haus gibt es nicht mehr', sehen: 'Meldung «Haus nicht gefunden» oder die Tafel sagt «Dieses Haus gibt es nicht».',
      grund: 'Das Haus wurde inzwischen gelöscht, vielleicht in einem anderen Fenster.', tun: 'Die Liste neu laden. War es ein Versehen: «Rückgängig» in der Quittung des Löschens, solange sie offen ist.' },
    { id: 'haus-kaputt', titel: 'Ein Haus ohne Namen oder Stand', sehen: 'Hier unter «Häuser» steht ein rotes Zeichen mit dem Namen.',
      grund: 'Die Datei daten/02-kundenliste/haeuser.json wurde von Hand geändert.', tun: 'Im Werkzeug das Haus öffnen und Name und Stand neu setzen. Oder unter «Alle Daten» herunterladen und Robert schicken.' },
    { id: 'import', titel: 'Der Import läuft nicht', sehen: 'Meldung beim Übernehmen der echten Häuser, oder hier unter «Unterlagen für den Import» rot.',
      grund: 'import_start.py findet eine Datei nicht oder kann sie nicht lesen.', tun: 'Im Projektordner python3 werkzeuge/02-kundenliste/import_start.py laufen lassen (ohne --schreiben): der Bericht sagt, welche Datei fehlt.' },
    { id: 'skript', titel: 'Ein Fehler im Werkzeug selbst', sehen: 'Unter «Fehler» steht ein Eintrag mit Datei und Zeile.',
      grund: 'Ein Teil der Oberfläche ist an einer Stelle hängen geblieben.', tun: 'Die Seite neu laden. Hilft das nicht: unten «Gemerkte Ansicht vergessen». Den Eintrag unter «Fehler» an Robert schicken.' }
  ];
  function el(tag, attrs, kinder) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); (kinder || []).forEach(function (k) { e.append(k); }); return e; }
  function punkt(ort, gut, titel, text, stichwort, art) {
    ort.append(el('div', { class: 'wsp-punkt', 'data-gut': gut ? 'ja' : 'nein', 'data-punkt': art || 'punkt' }, [
      el('span', { class: 'wsp-punkt__z' }, [gut ? '✓' : '–']), el('span', { class: 'wsp-punkt__t' }, [titel]),
      el('span', { class: 'wsp-punkt__x' }, [text + ' ', !gut && stichwort ? el('a', { href: '#lex-' + stichwort }, ['Was tun?']) : ''])]));
  }
  // Lexikon
  var lex = document.getElementById('p-lexikon');
  LEX.forEach(function (l) {
    lex.append(el('details', { class: 'platte wsp-lex', id: 'lex-' + l.id }, [el('summary', {}, [l.titel]),
      el('dl', {}, [el('dt', {}, ['Sehen']), el('dd', {}, [l.sehen]), el('dt', {}, ['Grund']), el('dd', {}, [l.grund]), el('dt', {}, ['Tun']), el('dd', {}, [l.tun])])]));
  });
  function oeffne() {
    var e = location.hash.indexOf('#lex-') === 0 && document.getElementById(location.hash.slice(1));
    if (e) { e.open = true; setTimeout(function () { e.scrollIntoView({ block: 'start' }); }, 0); }
  }
  window.addEventListener('hashchange', oeffne); oeffne();
  // Browser
  var br = document.getElementById('p-browser'), ls = true;
  try { localStorage.setItem('kl-probe', '1'); localStorage.removeItem('kl-probe'); } catch (e) { ls = false; }
  punkt(br, !!window.fetch && !!window.Promise, 'Browser', window.fetch ? 'Kann alles, was das Werkzeug braucht.' : 'Zu alt für das Werkzeug. Bitte Safari, Chrome oder Firefox in neuer Fassung.', 'skript', 'browser');
  punkt(br, ls, 'Speicher im Browser', ls ? 'Merkt sich die letzte Ansicht und wer arbeitet.' : 'Gesperrt (privates Fenster?). Das Werkzeug läuft trotzdem, merkt sich aber nichts.', '', 'browser');
  punkt(br, true, 'Wer arbeitet', (window.WO_HAUS && WO_HAUS.wer) || 'Robert', '', 'browser');
  // Server und Liste
  var sv = document.getElementById('p-server');
  fetch(A + 'pruefung', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
    sv.textContent = '';
    punkt(sv, true, 'Server', 'Antwortet unter ' + A, '', 'server');
    (d.punkte || []).forEach(function (x) { punkt(sv, x.gut, x.titel, x.text, x.stichwort, 'server'); });
  }).catch(function () { sv.textContent = ''; punkt(sv, false, 'Server', 'Antwortet nicht.', 'keine-verbindung', 'server'); });
  // Fehler: Server und Browser
  var fe = document.getElementById('p-fehler');
  function fehlerZeigen() {
    var browser = []; try { browser = JSON.parse(localStorage.getItem('kl-fehler') || '[]').reverse(); } catch (e) {}
    fetch(A + 'fehler', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return { fehler: [] }; }).then(function (d) {
      fe.textContent = '';
      var alle = (d.fehler || []).map(function (f) { return { zeit: f.zeit, text: f.text + (f.quelle ? ' (' + f.quelle + ')' : ''), wo: 'Server' }; })
        .concat(browser.map(function (f) { return { zeit: (f.zeit || '').slice(0, 16).replace('T', ' '), text: f.text, wo: 'Browser', stichwort: f.stichwort }; })).slice(0, 12);
      if (!alle.length) return punkt(fe, true, 'Keine Fehler', 'Weder der Server noch dieser Browser hat etwas mitgeschrieben.', '', 'fehler');
      alle.forEach(function (f) { punkt(fe, false, f.wo + ' · ' + f.zeit, f.text, f.stichwort || 'skript', 'fehler'); });
    });
  }
  fehlerZeigen();
  // Reparaturen: erster Klick macht scharf, zweiter führt aus
  var quit = document.getElementById('p-quit');
  document.querySelectorAll('[data-rep]').forEach(function (k) {
    var text = k.textContent, uhr = 0;
    k.addEventListener('click', function () {
      if (!k.hasAttribute('data-scharf')) { k.setAttribute('data-scharf', ''); k.textContent = 'Wirklich?'; uhr = setTimeout(function () { k.removeAttribute('data-scharf'); k.textContent = text; }, 4000); return; }
      clearTimeout(uhr); k.removeAttribute('data-scharf'); k.textContent = text;
      if (k.getAttribute('data-rep') === 'ort') { try { localStorage.removeItem('kl-ort'); } catch (e) {} quit.textContent = 'Erledigt: das Werkzeug öffnet wieder mit der Übersicht.'; return; }
      fetch(A + 'fehler/leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(function (r) { return r.json(); }).then(function (d) {
        try { localStorage.removeItem('kl-fehler'); } catch (e) {}
        quit.textContent = 'Erledigt: ' + (d.meldung || 'Fehlerliste beiseitegelegt.'); fehlerZeigen();
      }).catch(function () { quit.textContent = 'Der Server antwortet nicht.'; });
    });
  });
})();
