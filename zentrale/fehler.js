document.documentElement.classList.add('js');   /* Bewegung nur mit Skript (wie Kontrollpanel) */
/* Fehlermelder der Zentrale (nach «Kontrollpanel» fehler.js, R03), vor allem anderen geladen: jeder Skriptfehler wird im Browser gemerkt
   (localStorage «tasty_werkzeuge_fehler», höchstens 30, der neueste zuerst) und auf der Prüfseite /zentrale/pruefung.html gezeigt.
   Einen Server-Teil zum Weitermelden hat zentrale/server.py nicht (er darf nicht geändert werden); steht in der Übergabe.
   Netzfehler nie merken, höchstens 20 je Seite. */
(function () {
  var zahl = 0;
  function merk(t) {
    t = String(t); window.ZENTRALE_FEHLER = t;
    if (++zahl > 20 || /Load failed|access control|abort|NetworkError|Failed to fetch/i.test(t)) return;
    try {
      var a = JSON.parse(localStorage.getItem('tasty_werkzeuge_fehler') || '[]');
      a.unshift({ zeit: new Date().toISOString(), art: 'zentrale', text: ('Zentrale: ' + t).slice(0, 400), ort: location.pathname });
      localStorage.setItem('tasty_werkzeuge_fehler', JSON.stringify(a.slice(0, 30)));
    } catch (e) {}
  }
  window.ZENTRALE_MERK = merk;
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'SCRIPT') { window.ZENTRALE_FEHLER = 'Die Datei ' + (e.target.getAttribute('src') || '').split('?')[0] + ' liess sich nicht laden.'; merk(window.ZENTRALE_FEHLER); return; }
    if (e.target && e.target !== window) return;   /* Bilder und Schriften sind keine Skriptfehler */
    merk((e.message || 'Fehler') + ' · ' + (e.filename || '').split('/').pop() + ':' + (e.lineno || ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) { merk('Versprechen: ' + ((e.reason && e.reason.message) || e.reason)); });
  /* Startfehler-Tür (R04): ist zentrale.js beim Laden nicht durchgelaufen, sagt die Seite es und zeigt alles ohne Bewegung. Wache nach 12 s. */
  function tuer() {
    if (window.ZENTRALE_BEREIT) return;
    var t = document.getElementById('tuer'); if (!t || !t.hidden) return;
    document.documentElement.classList.remove('js', 'wartet');
    document.getElementById('tuer-t').textContent = window.ZENTRALE_FEHLER || 'Das Programm der Seite ist nicht durchgelaufen.';
    t.hidden = false;
  }
  window.addEventListener('load', tuer);
  setTimeout(tuer, 12000);
  window.ZENTRALE_TUER = tuer;
})();
