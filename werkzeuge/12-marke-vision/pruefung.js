/* Prüfseite von Marke & Vision (pruefung.html), aufgebaut wie pruefung.js von La Réception. Eigenes Skript, keine eingebetteten Skripte.
   Liest nur: Browser, Server und Ablage (api.py), die Heute-Schnittstelle, das Kleid, die Kapitel und ihre Quellen aus kapitel.js, die Fotos
   und den Fehlermelder (localStorage «tasty-mv-fehler»). Ändert nichts ausser den Reparaturen (jede erst nach einem zweiten Klick). */
(function () {
  var LEX = {
    START: ['«Marke & Vision startet nicht.»', 'Eine Datei fehlt oder ist kaputt: kapitel.js, marke-vision.js oder das Kleid in /zentrale/oberflaeche/.', 'Neu laden. Hilft das nicht: prüfen, ob der Zweig vollständig geholt ist, und Robert Bescheid geben.'],
    VERBINDUNG: ['«Ohne den Server lässt sich nichts speichern.»', 'Das Werkzeug wurde ohne den gemeinsamen Server geöffnet (zum Beispiel als Datei), oder das Netz war kurz weg.', 'Im Ordner des Repos python3 zentrale/server.py starten und http://localhost:9100 öffnen.'],
    LEER: ['«Die Frage ist leer.»', 'Im Feld steht nichts oder nur Leerzeichen.', 'Etwas schreiben, dann wird «Speichern» gelb.'],
    FRAGE: ['«Diese Frage gibt es nicht mehr.»', 'Die Frage wurde inzwischen gelöscht, zum Beispiel in einem zweiten Fenster.', 'Neu laden. Eine gerade gelöschte Frage holt «Rückgängig» in der Quittung zurück.'],
    ABLAGE: ['Im Kapitel «Annas Fragen» stehen keine oder nur die Beispiele.', 'Die Datei daten/12-marke-vision/fragen.json fehlt oder ist kaputt. Daneben liegt immer der Stand davor als fragen.json.gut; den liest das Werkzeug selbst, wenn die Datei kaputt ist.', 'Die Datei aus einer Sicherung des Rechners zurückholen. daten/ ist nicht in Git.'],
    HEUTE: ['In der Zentrale fehlt Marke & Vision unter «Heute».', 'Es gibt keine offene Frage von Anna (für Robert) oder keine Antwort (für Anna), oder der Server antwortet nicht.', 'Oben im Blatt nachsehen, was «Heute» liefert.'],
    FOTO: ['Eine Fläche bleibt dunkel, oben im Blatt steht, welches Foto fehlt.', 'Die Fotos kommen aus grundlagen/marke/fotos/ über das Kleid, die Bilder der Häuser aus haeuser/ in diesem Ordner. Ist dort eine Datei umbenannt, fehlt sie hier.', 'Im Chat des Kleids melden (neubau/00-kleid); in diesem Werkzeug wird nichts erzeugt.'],
    SERVER: ['Fehler im Server-Teil.', 'Etwas Unerwartetes; der genaue Grund steht in der Meldung.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt: das Werkzeug läuft nur auf dem eigenen Rechner über den gemeinsamen Server.', 'Vor dem Weg ins Netz: Anmeldung mit Passwort davorsetzen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var KAP = window.MV_KAPITEL || [], Q = window.MV_QUELLEN || {}, RA = window.MV_RAHMEN || {}, H = window.WO_HAUS || {};
  var API = '/zentrale/api/12-marke-vision/';
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, Rundgang gesehen)' : 'gesperrt (privates Fenster?): Ansicht und Rundgang werden nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'START' });
    return p;
  }
  function inhalt() {
    var p = [];
    p.push({ gruppe: 'Inhalt', was: 'Kleid', stand: window.WO_HAUS ? 'gut' : 'rot', text: window.WO_HAUS ? 'geladen (/zentrale/zentrale/oberflaeche/kleid/tasty.js)' : 'fehlt', stichwort: window.WO_HAUS ? '' : 'START' });
    var acht = KAP.length === 6 && RA.auftakt && RA.fragen;
    p.push({ gruppe: 'Inhalt', was: 'Kapitel', stand: acht ? 'gut' : 'rot', text: acht ? 'acht nach Roberts Gliederung (07.11.2026): Auftakt, sechs Kapitel mit Quelle, Annas Fragen' : (KAP.length + 2) + ' Kapitel statt acht', stichwort: acht ? '' : 'START' });
    return p;
  }
  function quellen() {
    var qz = function (k) { return k.q.map(function (q) { return (Q[q[0]] || q[0]) + ': ' + q[1]; }).join(' · '); };
    var p = [];
    if (RA.auftakt) p.push({ gruppe: 'Quellen je Kapitel', was: 'Kapitel 1 · ' + RA.auftakt.titel, stand: 'gut', text: qz(RA.auftakt) });
    KAP.forEach(function (k, i) { p.push({ gruppe: 'Quellen je Kapitel', was: 'Kapitel ' + (i + 2) + ' · ' + k.titel, stand: 'gut', text: qz(k) }); });
    if (RA.fragen) p.push({ gruppe: 'Quellen je Kapitel', was: 'Kapitel ' + (KAP.length + 2) + ' · ' + RA.fragen.titel, stand: 'gut', text: 'keine Quelle: Annas Fragen und Roberts Antworten aus der Ablage daten/12-marke-vision/' });
    var g = 'Bewusst weggelassen';
    p.push({ gruppe: g, was: 'Teil 2 des Strategiepapiers', stand: 'gelb', text: 'Partnerschaft und Geld, auch die Punkte des Fahrplans, die sie betreffen (Partnerschaft klären, Steuerberatung, Firma gründen)' });
    p.push({ gruppe: g, was: 'Persönliches über Robert', stand: 'gelb', text: 'Wohnorte, Reisen, Alter, Social-Media-Konten und die persönlichen Teile der Design-DNA; nur woher er beruflich kommt (Strategiepapier, Kapitel 02)' });
    p.push({ gruppe: g, was: 'Beträge aus dem Strategiepapier', stand: 'gelb', text: 'Preise nur aus grundlagen/Angebot.md; die Offerten für «GEO-Optimierung» und das Rechenbeispiel aus Kapitel 05 fehlen darum' });
    p.push({ gruppe: g, was: 'Offene Preisfragen im Angebot', stand: 'gelb', text: 'was Angebot.md selbst als «klären» führt (Shop-Preise, Preiszonen); gezeigt nur entschiedene Beträge und die zwei Einzelfälle mit «kein Standard»' });
    p.push({ gruppe: g, was: 'Anmeldung', stand: 'gelb', text: 'keine Anmeldung vor dem Werkzeug, es läuft nur auf dem eigenen Rechner', stichwort: 'ANMELDUNG' });
    return p;
  }
  function fotos() {
    var schl = {}, haus = {};
    KAP.forEach(function (k) { schl[k.foto] = 1; k.teile.forEach(function (b) { if (b.foto) schl[b.foto] = 1; if (b.bild) haus[b.bild] = 1;
      (b.paare || []).forEach(function (x) { haus[x[0]] = 1; haus[x[1]] = 1; }); (b.bilder || []).forEach(function (x) { haus[x[0]] = 1; }); }); });
    var namen = Object.keys(schl), hn = Object.keys(haus);
    var lade = function (n, src) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(null); }; i.onerror = function () { r(n); }; i.src = src; }); };
    return Promise.all([Promise.all(namen.map(function (n) { return lade(n, (H.fotos || {})[n] || ''); })), Promise.all(hn.map(function (n) { return lade(n, 'haeuser/' + n + '.webp'); }))])
      .then(function (f) { var a = f[0].filter(Boolean), b = f[1].filter(Boolean);
        return [
          { gruppe: 'Inhalt', was: 'Fotos', stand: a.length ? 'rot' : 'gut', text: a.length ? 'es fehlen: ' + a.join(', ') : namen.length + ' aus grundlagen/marke/fotos/, alle da', stichwort: a.length ? 'FOTO' : '' },
          { gruppe: 'Inhalt', was: 'Belege der Häuser', stand: b.length ? 'rot' : 'gut', text: b.length ? 'es fehlen: ' + b.join(', ') : hn.length + ' Bilder vom Culinarium Hannover in haeuser/, alle da; Häuser ohne Bild belegen mit Text', stichwort: b.length ? 'FOTO' : '' }
        ]; });
  }
  function holen(weg) { return fetch(API + weg, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function server() {
    var anz = function (n) { return n === 1 ? 'ein Punkt' : n + ' Punkte'; };
    return holen('fragen').then(function (j) {
      var o = j.fragen.filter(function (f) { return !f.antwort; }).length, p = [];
      p.push({ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'gut', text: 'antwortet' });
      p.push({ gruppe: 'Server', was: 'Ablage', stand: j.probe ? 'gelb' : 'gut', text: j.fragen.length + ' Fragen, davon ' + o + ' offen' + (j.probe ? ' (noch die Beispiele aus probedaten/; mit der ersten gespeicherten Frage werden sie zum eigenen Stand)' : ', in daten/12-marke-vision/fragen.json'), stichwort: j.probe ? '' : '' });
      return Promise.all([
        holen('heute?wer=Robert').then(function (h) { return { gruppe: 'Server', was: 'Heute für Robert', stand: 'gut', text: anz((h.punkte || []).length) + ((h.punkte || []).length ? ': ' + h.punkte.map(function (x) { return '«' + x.text + '»'; }).join(', ') : ' (keine offene Frage)') }; },
          function () { return { gruppe: 'Server', was: 'Heute für Robert', stand: 'rot', text: 'keine Antwort', stichwort: 'HEUTE' }; }),
        holen('heute?wer=Anna').then(function (h) { return { gruppe: 'Server', was: 'Heute für Anna', stand: 'gut', text: anz((h.punkte || []).length) + ' (beantwortete Fragen)' }; },
          function () { return { gruppe: 'Server', was: 'Heute für Anna', stand: 'rot', text: 'keine Antwort', stichwort: 'HEUTE' }; })
      ]).then(function (h) { return p.concat(h); });
    }, function () { return [{ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'rot', text: 'antwortet nicht', stichwort: 'VERBINDUNG' }]; });
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
  function fehlerListe() {
    var lokal = [];
    try { lokal = JSON.parse(localStorage.getItem('tasty-mv-fehler') || '[]').reverse(); } catch (e) { }
    $('#fehler').innerHTML = lokal.length ? lokal.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo || 'dieser Browser') + ', ' + esc(x.seite || '') + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    Promise.all([server(), fotos()]).then(function (r) { zeichne(browser().concat(r[0], inhalt(), r[1], quellen())); fehlerListe(); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('tasty-mv-fehler'); } catch (e) { }
        b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe();
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^tasty-mv-ansicht$|^rundgang-tasty-12-marke-vision/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();
