/* Fehlermelder der Kunden-Übersicht (aus der Vorlage Le Registre, fehler.js; vor allem anderen geladen): Skriptfehler nach localStorage «tasty-kunden-fehler» (letzte 20)
   und an den eigenen Server-Teil (/zentrale/api/07-kunden-uebersicht/fehler, Ablage auf dem Rechner, nie an einen fremden Dienst). Die Prüfseite zeigt beide Listen.
   Netz- und Ladefehler nie melden, höchstens 20 je Seite, ein eigener Fehlschlag wird nie erneut gemeldet. */
(function () { var n = 0, K = 'tasty-kunden-fehler';
  function melde(t) { if (n >= 20) return; n++; t = String(t).slice(0, 300);
    try { var l = JSON.parse(localStorage.getItem(K) || '[]'); l.push({ zeit: new Date().toISOString(), text: t, wo: location.hash }); localStorage.setItem(K, JSON.stringify(l.slice(-20))); } catch (e) {}
    try { if (!navigator.webdriver) fetch('/zentrale/api/07-kunden-uebersicht/fehler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t, wo: location.hash }) }).catch(function () {}); } catch (e) {} }
  addEventListener('error', function (e) { if (e.target && e.target !== window) return; melde((e.message || 'Fehler') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); }, true);
  addEventListener('unhandledrejection', function (e) { var r = e.reason, t = String(r && r.message || r); if (/fetch|network|load failed|abort|Server-Teil/i.test(t)) return; melde('Promise: ' + t); });
})();
