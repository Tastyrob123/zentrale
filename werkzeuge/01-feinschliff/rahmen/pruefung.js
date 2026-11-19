/* Prüfseite des Feinschliffs (pruefung.html). Aus pruefung.js der Culinarium-Werkzeuge (La Réception, dort nach Le Bureau): Punkte mit Ampel, Fehlerliste,
   Reparaturen mit zweitem Klick, Lexikon Sehen · Grund · Tun. Die Stichworte sind die des Startblatts (rahmen/blatt.js) und von api.py. */
(function () {
  var LEX = {
    'keine-verbindung': ['«Die Zentrale antwortet nicht.»', 'Die Zentrale ist nicht gestartet, oder das Netz war kurz weg.', 'Im Ordner des Repos python3 zentrale/server.py starten, dann neu laden.'],
    unerwartet: ['«Unerwartete Antwort der Zentrale» oder ein anderer Fehler.', 'Etwas Unerwartetes; der genaue Grund steht in der Meldung.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    konflikt: ['«Zwei haben gleichzeitig geändert» oder «Inzwischen hat jemand anderes gespeichert».', 'Anna hat auf der Seite gespeichert, während hier eine Eingabe wartete. Nichts wurde überschrieben.', 'Im Fenster wählen: die eigene Eingabe auf den neuen Stand speichern oder verwerfen.'],
    abgelehnt: ['«Das darf nur Robert» oder «Diesen Wunsch gibt es nicht mehr».', 'Nur Robert markiert Änderungen als übernommen. Ein Wunsch kann inzwischen entfernt sein.', 'Mit ?wer=Robert öffnen (die Zentrale gibt das mit), oder neu laden.'],
    leer: ['«Ein Feld ist leer» oder «Nichts geändert, nichts gespeichert».', 'Eine leere Antwort, ein leerer Wunsch, oder es wartete keine Eingabe.', 'Etwas hineinschreiben oder das Feld schliessen.'],
    ablage: ['Der Ordner der Ablage ist nicht beschreibbar.', 'daten/01-feinschliff/ fehlt oder gehört einem anderen Benutzer.', 'Ordner anlegen bzw. Rechte prüfen; die Zentrale legt ihn beim Start selbst an.'],
    liste: ['«Liste der Änderungen: unlesbar».', 'Die Datei feinschliff_tastystudios.json wurde von Hand geändert oder ist beim Schreiben abgebrochen.', 'Die Datei aus einer Sicherung des Rechners zurückholen. Probedaten einspielen sichert die kaputte Datei als .vorher.'],
    skript: ['Ein Fehler steht unten in der Liste.', 'Ein Skript des Werkzeugs ist unerwartet stehen geblieben; fehlermelder.js schreibt es mit.', 'Neu laden. Wiederholt es sich: Uhrzeit und Text an Robert.'],
    quelle: ['«Die Arbeitskopie der Website fehlt» oder die Seite lädt nicht im Werkzeug.', 'Beim ersten Öffnen legt das Werkzeug eine Kopie der Website an (aus ~/github-umzug/tastystudios). Fehlt dieser Ordner, geht das nicht.', 'Den Ordner wiederherstellen (gh repo clone Tastyrob123/tastystudios ~/github-umzug/tastystudios), dann eine Seite öffnen.'],
    entwurf: ['«Im Entwurf liegen noch Änderungen».', 'Ein früherer Stand lässt sich nur zurückholen, wenn der Entwurf leer ist, sonst gingen deine Änderungen verloren.', 'Erst veröffentlichen oder unter «Entwurf» verwerfen, dann zurückholen.'],
    ziel: ['«Probe-Betrieb» beim Veröffentlichen.', 'Veröffentlicht wird in eine Probe-Kopie auf diesem Mac, bis Robert auf die echte Website umschaltet.', 'Nichts zu tun. Umschalten macht Robert.'],
    stelle: ['«Diese Stelle gibt es im Entwurf nicht mehr».', 'Die Seite wurde in einem anderen Fenster geändert, die Stelle hat sich verschoben.', 'Die Seite lädt von selbst neu. Danach die Stelle noch einmal anklicken.'],
    text: ['«An dieser Stelle steht kein Text».', 'Die gewählte Stelle ist eine Fläche oder ein Foto.', 'Auf die Buchstaben selbst klicken.'],
    lang: ['«Der Text ist zu lang für eine Stelle».', 'Mehr als 20 000 Zeichen an einer Stelle.', 'Kürzen oder als Wunsch an Robert schreiben.'],
    stil: ['«… lässt sich hier nicht einstellen» oder «Der Wert passt nicht».', 'Nur Werte aus der Marke sind erlaubt (Schriften der Seite, Farben der Marke, Grössen in einem sinnvollen Rahmen).', 'Einen Wert aus den Reglern und Farben rechts nehmen.'],
    bild: ['«Hier ist kein Foto» oder «Dieses Foto liegt nicht in der Website».', 'Getauscht werden nur Fotos, und nur gegen Fotos der Website oder eigene hochgeladene.', 'Das Foto selbst anklicken und rechts «Foto tauschen» nehmen.'],
    foto: ['«Das Foto ist nur … Pixel breit» oder «grösser als 25 MB».', 'Für die Website braucht ein Foto mindestens 900 Pixel Breite und höchstens 25 MB.', 'Eine grössere bzw. kleinere Fassung des Fotos nehmen.'],
    link: ['«Hier ist kein Link» oder «So geht das Ziel nicht».', 'Ein Ziel beginnt mit https://, mailto: oder tel:, oder ist eine Seite der Website wie team.html.', 'Das Ziel so eintragen oder eine Seite aus der Liste darunter wählen.'],
    schieben: ['«Diese Stelle lässt sich nicht verschieben» oder «Sie steht schon ganz oben».', 'Verschoben wird nur zwischen Nachbarn im selben Abschnitt.', 'Mit «Drumherum wählen» eine Stufe höher gehen und dort schieben.'],
    neuer: ['«An dieser Stelle wurde danach noch einmal geändert».', 'Eine spätere Änderung baut auf dieser auf.', 'Zuerst die neuere Änderung zurücknehmen, dann diese.'],
    nichts: ['«Nichts geändert, nichts veröffentlicht» oder «Die Website zeigt diesen Stand schon».', 'Es gibt keinen Unterschied zwischen Entwurf und Website.', 'Nichts zu tun.'],
    pruefung: ['«… endet nicht sauber» oder «… wäre um mehr als 40 Prozent kürzer». Nichts veröffentlicht.', 'Die Prüfung vor dem Veröffentlichen hat eine beschädigte Seite gefunden und angehalten. Die Website ist unverändert.', 'Unter «Entwurf» die letzte Änderung zurücknehmen und noch einmal veröffentlichen. Wiederholt es sich: an Robert.'],
    hochladen: ['«Die Website hat die Änderung nicht angenommen» oder «Noch nicht online angekommen».', 'Die Verbindung zu GitHub ging nicht, oder GitHub braucht länger. Die Website ist unverändert bzw. wird gleich aktualisiert.', 'Im Verlauf nachsehen, das Werkzeug prüft weiter. Steht es nach zehn Minuten noch nicht online: noch einmal veröffentlichen.'],
    laeuft: ['«Eine Veröffentlichung läuft schon».', 'Jemand veröffentlicht gerade (vielleicht im anderen Fenster).', 'Kurz warten, dann neu laden.'],
    zusammenstoss: ['«Robert hat inzwischen an … gearbeitet».', 'Die Seite wurde auf der Website geändert, während in deinem Entwurf Änderungen an ihr liegen.', 'Mit Robert absprechen; den Entwurf dieser Seite verwerfen holt Roberts Stand.'],
    anmeldung: ['Keine Anmeldung vor dem Startblatt.', 'So gewollt: die Zentrale läuft nur auf dem eigenen Rechner. Auf der Seite schützt der Schlüssel.', 'Nichts zu tun.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="lex-' + k + '"><h3>' + esc(k) + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, Rundgang)' : 'gesperrt (privates Fenster?): Ansicht wird nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'unerwartet' });
    return p;
  }
  function zeichne(p) {
    var gr = '', h = '';
    p.forEach(function (x) {
      if (x.gruppe !== gr) { gr = x.gruppe; h += '<div class="gr">' + esc(gr) + '</div>'; }
      h += '<div class="z ' + esc(x.stand) + '"><i></i><b>' + esc(x.was) + '</b><span>' + esc(x.text) + '</span>' + (x.stichwort && x.stand !== 'gut' ? '<a href="#lex-' + esc(x.stichwort) + '">' + esc(x.stichwort) + '</a>' : '<span></span>') + '</div>';
    });
    $('#punkte').innerHTML = h;
    var rot = p.filter(function (x) { return x.stand === 'rot'; }).length;
    $('#satz').textContent = rot ? rot + (rot === 1 ? ' Punkt braucht' : ' Punkte brauchen') + ' Aufmerksamkeit. Das Stichwort rechts führt zur Erklärung.' : 'Alles in Ordnung. Gelb heisst: bewusst so, kein Fehler.';
  }
  function fehlerListe(server) {
    var lokal = [];
    try { lokal = JSON.parse(localStorage.getItem('ws-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).slice().reverse().map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Protokoll der Zentrale' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  var API = '/zentrale/api/01-feinschliff/';
  function pruefe() {
    var p = browser();
    Promise.all([fetch(API + 'pruefung', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(API + 'fehler', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return { fehler: [] }; })])
      .then(function (d) {
        p.push({ gruppe: 'Zentrale', was: 'Zentrale läuft', stand: 'gut', text: 'antwortet auf ' + location.host });
        zeichne(p.concat(d[0].punkte.map(function (x) { return { gruppe: x.gruppe, was: x.name, stand: x.stufe, text: x.text, stichwort: x.stichwort }; })));
        fehlerListe(d[1].fehler);
      })
      .catch(function () { p.push({ gruppe: 'Zentrale', was: 'Zentrale läuft', stand: 'rot', text: 'antwortet nicht', stichwort: 'keine-verbindung' }); zeichne(p); fehlerListe([]); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('ws-fehler'); } catch (e) { }
        fetch(API + 'fehler/leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { ['fs-ort', 'rundgang-tasty-feinschliff'].forEach(function (k) { localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
