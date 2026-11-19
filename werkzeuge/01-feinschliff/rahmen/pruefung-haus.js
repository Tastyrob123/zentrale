/* pruefung-haus.js · Prüfseite im Rahmen von Tasty Studios (aus der Vorlage Le Bureau): Name des Werkzeugs aus der einen Stelle, «Zum Werkzeug» führt in dieses Werkzeug. */
(function () {
  var z = document.getElementById('wsp-zurueck'); if (z) z.href = './';
  var n = window.WO_HAUS && WO_HAUS.namen && WO_HAUS.namen['01-feinschliff'];
  if (n) { document.querySelectorAll('[data-werkzeug]').forEach(function (e) { e.textContent = n; }); document.title = 'Prüfung · ' + n + ' · ' + WO_HAUS.name; }
})();
