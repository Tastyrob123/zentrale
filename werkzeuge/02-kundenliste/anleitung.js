/* anleitung.js · Name des Werkzeugs aus der einen Stelle (kleid/tasty.js › WO_HAUS.namen), damit die Anleitung nie einen alten Namen trägt (Kopie aus «Website bearbeiten»). */
(function () {
  var n = (window.WO_HAUS && WO_HAUS.namen) || {};
  document.querySelectorAll('[data-wo-name]').forEach(function (e) { var k = e.getAttribute('data-wo-name'); if (n[k]) e.textContent = n[k]; });
  if (n['02-kundenliste']) document.title = 'Anleitung · ' + n['02-kundenliste'] + ' · ' + (WO_HAUS.name || '');
})();
