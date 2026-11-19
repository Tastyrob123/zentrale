/* Feinschliff (Robert 06.11.2026): Annas Bearbeiten-Werkzeug. Diese Zeilen stehen am Ende von kopf.js (Hauptseiten) und assets/js/main.js
   (Kontakt, Impressum). Nur wer die Seite einmal mit ?feinschliff=<Schlüssel> geöffnet hat, bekommt das Werkzeug; der Browser merkt sich den
   Schlüssel, ?feinschliff=aus vergisst ihn. Besucher ohne Schlüssel laden kein Byte mehr als vorher. */
(function () {
  var m = /[?&]feinschliff=([^&#]*)/.exec(location.search), k = '';
  try {
    if (m) { if (m[1] === 'aus' || !m[1]) localStorage.removeItem('tasty-feinschliff'); else localStorage.setItem('tasty-feinschliff', decodeURIComponent(m[1])); }
    k = localStorage.getItem('tasty-feinschliff') || '';
  } catch (e) {}
  if (!k) return;
  if (m && history.replaceState) {   /* Schlüssel aus der Adresszeile nehmen, die übrigen Angaben bleiben */
    var rest = location.search.replace(/[?&]feinschliff=[^&#]*/, '').replace(/^&/, '?');
    history.replaceState(null, '', location.pathname + rest + location.hash);
  }
  /* die Seite bleibt verdeckt, bis Annas Änderungen darüberliegen (feinschliff.js nimmt fs-warte wieder weg, spätestens nach 4 s) */
  document.documentElement.classList.add('fs-warte');
  var st = document.createElement('style'); st.textContent = 'html.fs-warte body{visibility:hidden}'; document.head.appendChild(st);
  setTimeout(function () { document.documentElement.classList.remove('fs-warte'); }, 4000);
  var s = document.createElement('script'); s.src = '/neu/runde3/feinschliff.js?v=20261108c'; document.head.appendChild(s);
})();
