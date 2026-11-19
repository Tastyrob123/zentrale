/* Fehlermelder · Wer hat den Entwurf geöffnet (Werkzeug 03, Tasty Studios). Aus fehler.js des Le Registre (vorlage/culinarium-demo/werkzeuge/registre/), vor allem anderen geladen.
   Skriptfehler nach localStorage «tasty-besuche-fehler» (letzte 20) und an die eigene Ablage (/zentrale/api/03-entwurf-besuche/fehler, nur lokal, verschickt nichts nach aussen);
   die Prüfseite (pruefung.html) zeigt sie. Netz- und Ladefehler nie melden, höchstens 20 je Seite, ein eigener Fehlschlag wird nie erneut gemeldet. */
(function () { var n = 0, K = 'tasty-besuche-fehler';
  function melde(t) { if (n >= 20) return; n++; t = String(t).slice(0, 300);
    try { var l = JSON.parse(localStorage.getItem(K) || '[]'); l.push({ z: new Date().toISOString(), t: t, a: location.hash }); localStorage.setItem(K, JSON.stringify(l.slice(-20))); } catch (e) {}
    try { if (navigator.sendBeacon && !navigator.webdriver) navigator.sendBeacon('/zentrale/api/03-entwurf-besuche/fehler', new Blob([JSON.stringify({ t: t, a: location.hash })], { type: 'application/json' })); } catch (e) {} }
  addEventListener('error', function (e) { if (e.target && e.target !== window) return; melde((e.message || 'Fehler') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); }, true);
  addEventListener('unhandledrejection', function (e) { var r = e.reason, t = String(r && r.message || r); if (/fetch|network|load failed|abort/i.test(t)) return; melde('Promise: ' + t); });
})();
