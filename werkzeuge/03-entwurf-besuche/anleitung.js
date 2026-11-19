/* Anleitung · Wer hat den Entwurf geöffnet (Werkzeug 03, Tasty Studios), aus anleitung.js des Le Registre: Bild gross mit Klick, Esc schliesst;
   das Zeichen aus dem Kleid (WO_HAUS.zeichen, das T von Tasty Studios). */
(function () {
  var g = document.getElementById('gross'), im = g.querySelector('img');
  function zu() { g.hidden = true; }
  document.addEventListener('click', function (e) { var b = e.target.closest('.bild'); if (b) { im.src = b.querySelector('img').src; im.alt = b.querySelector('img').alt; g.hidden = false; } else if (e.target.closest('#gross')) zu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  fetch(window.WO_HAUS ? WO_HAUS.zeichen : '/zentrale/zentrale/oberflaeche/kleid/anker-zeichen.svg').then(function (r) { return r.text(); }).then(function (t) { var m = t.match(/<svg[^>]*>([\s\S]*)<\/svg>/); if (m) document.getElementById('zeichen').innerHTML = m[1].replace(/<!--[\s\S]*?-->/g, '').replace(/\sfill="[^"]*"/g, ''); }).catch(function () {});
})();
