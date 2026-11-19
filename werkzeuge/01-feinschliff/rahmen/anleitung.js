/* anleitung.js · Namen der Werkzeuge aus der einen Stelle (kleid/tasty.js › WO_HAUS.namen), damit die Anleitung nie einen alten Namen trägt (aus der Vorlage). */
(function () {
  var n = (window.WO_HAUS && WO_HAUS.namen) || {};
  document.querySelectorAll('[data-wo-name]').forEach(function (e) { var k = e.getAttribute('data-wo-name'); if (n[k]) e.textContent = n[k]; });
  if (n['01-feinschliff']) document.title = 'Anleitung · ' + n['01-feinschliff'] + ' · ' + (WO_HAUS.name || '');
})();
