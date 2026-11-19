/* Marke & Vision · läuft vor allem anderen (wie start.js in Le Livre).
   Fehlermelder: Skriptfehler nach localStorage «tasty-mv-fehler» (letzte 20, die Prüfseite zeigt sie). Netzfehler und fehlende Dateien nie, höchstens 20 je Seite.
   Ladezeichen erst nach 280 ms. Kommt marke-vision.js nach 12 s nicht hoch: ein Satz statt leerer Fläche. */
'use strict';
(function () {
  let n = 0;
  const melde = (art, text, wo) => {
    if (n >= 20) return; n++;
    const e = { zeit: new Date().toISOString(), art, text: String(text || '').slice(0, 300), wo: String(wo || '').slice(0, 200), seite: location.pathname + location.hash, browser: navigator.userAgent.slice(0, 160) };
    try { const l = JSON.parse(localStorage.getItem('tasty-mv-fehler') || '[]'); l.push(e); localStorage.setItem('tasty-mv-fehler', JSON.stringify(l.slice(-20))); } catch (x) { /* privat */ }
  };
  window.MV_MELDE = melde;
  addEventListener('error', ev => { if (ev.target && ev.target !== window) return; melde('fehler', ev.message, (ev.filename || '').split('/').pop() + ':' + (ev.lineno || 0)); }, true);
  addEventListener('unhandledrejection', ev => { const r = ev.reason; if (r && /Failed to fetch|NetworkError|Load failed|network|abort/i.test(String(r.message || r))) return; melde('versprechen', r && (r.message || r), r && r.stack && r.stack.split('\n')[1]); });
  window.MV_LADE = setTimeout(() => { const a = document.getElementById('ansicht'); if (a && !a.firstChild) a.innerHTML = '<div class="lade" role="status" aria-label="Lädt"><span class="lade__r"></span></div>'; }, 280);
  window.MV_TUER = setTimeout(() => {
    if (window.MV_BEREIT) return;
    const a = document.getElementById('ansicht'); if (!a) return;
    a.innerHTML = '<div class="platte li-tuer" role="alert"><h1>Marke &amp; Vision startet nicht.</h1><p class="li-tuer__g">Das Programm der Seite ist nicht geladen worden (Netz oder blockiertes Skript).</p><p>Hilft «Neu laden» nicht: die Anleitung öffnen oder Robert Bescheid geben.</p><div class="li-tuer__kn"><a class="wo-kn wo-kn--dunkel" href="./"><span>Neu laden</span><i></i></a><a class="wo-kn wo-kn--hell" href="anleitung.html" target="_blank" rel="noopener"><span>Anleitung</span><i></i></a></div></div>';
  }, 12000);
})();
