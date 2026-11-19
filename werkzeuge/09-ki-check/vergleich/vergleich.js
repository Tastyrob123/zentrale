/* Vergleichsseite: je Ansicht Vorlage links, KI-Check rechts; Wahl der Breite 1440 oder 390 px. */
(function () {
  var A = [
    ['start', 'Startbild', 'Übersicht oben: Kopf, Rand, Startbild mit Gruss, Satz, Foto, Anleitung, Kennzahlen und Zeitraum.'],
    ['start-zahlen', 'Übersicht, Kennzahlen', 'Beispiel-Band, vier Kennzahlen, Säulen je Tag.'],
    ['start-unten', 'Übersicht, unten', 'Ranglisten, «Zuletzt», Leiste unten.'],
    ['liste', 'Liste, oben', 'Besuche (Vorlage) und Alle Checks (Neubau): Bühne mit Foto, Zeitraum, Auswahl.'],
    ['liste-karte', 'Liste und Karte', 'Liste nach Tagen, rechts die gewählte Karte.'],
    ['karte-gewaehlt', 'Karte gewählt', 'Zweiter Eintrag gewählt: nur die Karte wechselt.'],
    ['herkunft', 'Herkunft', 'Band mit vier Zahlen, Ranglisten in zwei Spalten.'],
    ['zeit', 'Zeit', 'Band, Säulen nach Uhrzeit, Raster Wochentag und Stunde.'],
    ['tabelle', 'Seiten · Was fehlt', 'Tabelle mit Balken.'],
    ['verlauf', 'Verlauf', 'Säulen mit dem Zeitraum davor, Vergleich, Woche für Woche.'],
    ['kundenliste', 'Zum Platz · Zur Kundenliste', 'Werte, Ranglisten, Woche für Woche.'],
    ['so-wird-geprueft', 'So wird gezählt · geprüft', 'Blätter mit Listen, «Gut zu wissen».'],
    ['rand-offen', 'Rand', 'Am Handy klappt der Rand über «Bereiche» auf; am Rechner steht er links.'],
    ['rundgang', 'Rundgang', 'Mit ?rundgang: Lichtkegel auf dem echten Element, Karte, Fortschritt.'],
    ['fenster', 'Fenster', 'Vorlage: Le Bureau, «Neuer Abend» (Le Registre hat kein Fenster). Neubau: Fenster «Mail an den Gast».'],
    ['fenster-loeschen', 'Rückfrage beim Entfernen', 'Vorlage: Le Bureau, «Von der Seite nehmen» (Quittung statt Rückfrage). Neubau: Rückfrage «Check löschen?».'],
    ['leiste-offen', 'Leiste', 'Vorlage: Le Bureau nach einer Eingabe (Speichern gelb). Neubau: Leiste der Liste (Le Registre hat kein Speichern).'],
    ['quittung', 'Quittung', 'Vorlage: Le Bureau nach «Speichern». Neubau: nach «In die Kundenliste», vorher, nachher, «Rückgängig».'],
    ['anleitung', 'Anleitung', 'Kopf mit Tafel, Knöpfe, Inhalt.'],
    ['anleitung-kapitel', 'Anleitung, Kapitel', 'Kapitel mit Text, Schritten und Bild.'],
    ['pruefung', 'Prüfseite', 'Punkte mit Ampel, Reparaturen, Lexikon (Vorlage: La Réception).']
  ];
  var b = '1440', liste = document.getElementById('liste');
  function zeichne() {
    document.body.dataset.breite = b;
    liste.innerHTML = A.map(function (x) {
      return '<section id="' + x[0] + '"><h2>' + x[1] + ' <em>' + b + ' px</em></h2><p class="satz">' + x[2] + '</p><div class="paar">'
        + '<figure><figcaption>Vorlage · Culinarium</figcaption><img loading="lazy" src="bilder/' + x[0] + '-' + b + '-vorlage.jpg" alt="Vorlage: ' + x[1] + '"></figure>'
        + '<figure><figcaption>Neubau · KI-Check</figcaption><img loading="lazy" src="bilder/' + x[0] + '-' + b + '-neubau.jpg" alt="KI-Check: ' + x[1] + '"></figure></div></section>';
    }).join('');
  }
  document.querySelectorAll('[data-b]').forEach(function (k) {
    k.onclick = function () { b = k.dataset.b; document.querySelectorAll('[data-b]').forEach(function (x) { x.setAttribute('aria-pressed', x === k); }); zeichne(); };
  });
  zeichne();
})();
