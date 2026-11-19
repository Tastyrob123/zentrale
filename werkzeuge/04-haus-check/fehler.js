/* Fehlermelder Haus-Check · Tasty Studios (aus Le Registre, fehler.js; vor allem anderen geladen): Skriptfehler nach localStorage «tasty-haus-check-fehler»
   (letzte 20, liest die Prüfseite). Netz- und Ladefehler nie melden, höchstens 20 je Seite. Nichts geht an einen fremden Dienst. */
(function () { var n = 0, K = 'tasty-haus-check-fehler';
  function melde(t) { if (n >= 20) return; n++; t = String(t).slice(0, 300);
    try { var l = JSON.parse(localStorage.getItem(K) || '[]'); l.push({ z: new Date().toISOString(), t: t, a: location.pathname.split('/').pop() + location.hash }); localStorage.setItem(K, JSON.stringify(l.slice(-20))); } catch (e) {} }
  addEventListener('error', function (e) { if (e.target && e.target !== window) return; melde((e.message || 'Fehler') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); }, true);
  addEventListener('unhandledrejection', function (e) { var r = e.reason; if (r && r.stichwort) return; var t = String(r && (r.message || r.fehler) || r); if (/fetch|network|load failed|abort/i.test(t)) return; melde('Promise: ' + t); });
})();
