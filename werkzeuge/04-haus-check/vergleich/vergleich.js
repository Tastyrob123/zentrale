/* Vergleichsseite (Prüf-Chat 07.11.2026): je Ansicht Vorlage links, Haus-Check rechts; Wahl der Breite 1440 oder 390 px.
   Die Liste ist dieselbe wie in bilder.js (dort aufgenommen). */
(function () {
  var A = [
    ['start', 'Startbild', 'Kopf, Rand, Startbild mit Gruss nach Tageszeit, einem Satz, Foto, Anleitung und Kennzahlen.'],
    ['start-mitte', 'Übersicht, Mitte', 'Unter dem Startbild: Vorlage Kennzahlen und Säulen, Neubau Feld zum Prüfen und Kennzahlen.'],
    ['start-unten', 'Übersicht, unten', '«Zuletzt» mit Karten, Ranglisten, Leiste unten.'],
    ['liste', 'Liste und Karte', 'Besuche (Vorlage) und Geprüfte Häuser (Neubau): Auswahl, Liste nach Tagen, daneben die gewählte Karte.'],
    ['liste-gewaehlt', 'Anderer Eintrag gewählt', 'Zweiter Eintrag angeklickt: die Karte wechselt.'],
    ['neues-haus', 'Neues Haus (nur Neubau, Inhalt)', 'Vorlage: Herkunft (Bereich mit Startbild und Blatt). Neubau: Feld zum Prüfen, frischer Check als Karte, Leiste gelb.'],
    ['tabelle', 'Tabelle', 'Seiten (Vorlage) und Wo es fehlt (Neubau): Band mit Zahlen, Tabelle mit Balken.'],
    ['verlauf', 'Verlauf', 'Säulen, Zeitraum, Woche für Woche.'],
    ['zum-platz', 'Zum Platz · Zur Kundenliste', 'Werte, Rangliste, Trichter.'],
    ['so-wird', 'So wird gezählt · So wird geprüft', 'Blätter mit Listen, «Gut zu wissen».'],
    ['speichern-gelb', 'Leiste: Speichern gelb', 'Etwas wartet: Le Bureau nach einer Eingabe, Haus-Check nach einem frischen Check.'],
    ['quittung', 'Leiste grün und Quittung', 'Nach dem Speichern: Speichern grün, Quittung mit vorher, nachher und «Rückgängig». Vorlage Le Bureau; die Demo speichert nicht, die Server-Antwort ist für das Bild nachgestellt.'],
    ['fenster', 'Fenster', 'Le Bureau: Fenster «Foto tauschen». Haus-Check: Rückfrage «Haus in den Papierkorb?».'],
    ['rand', 'Rand', 'Am Handy klappt der Rand über «Bereiche» auf; am Rechner steht er links.'],
    ['rundgang', 'Rundgang', 'Lichtkegel auf dem echten Element, Karte mit zwei, drei Sätzen.'],
    ['anleitung', 'Anleitung', 'Kopf mit Tafel, Knöpfe, Inhalt nach Themen.'],
    ['anleitung-kapitel', 'Anleitung, Kapitel', 'Kapitel mit Text, Schritten, «Gut zu wissen» und Bild.'],
    ['pruefung', 'Prüfseite', 'Punkte mit Ampel, Fehlerliste, Reparaturen, Lexikon (Vorlage: La Réception).'],
    ['papierkorb', 'Papierkorb (nur Neubau)', 'Vorlage: Frühere Fassungen in Le Bureau (zurückholen). Neubau: ein Haus im Papierkorb mit «Zurückholen» (am Handy fehlt der Knopf, siehe PRUEFUNG.md).']
  ];
  var b = '1440', liste = document.getElementById('liste');
  function zeichne() {
    document.body.dataset.breite = b;
    liste.innerHTML = A.map(function (x) {
      return '<section id="' + x[0] + '"><h2>' + x[1] + ' <em>' + b + ' px</em></h2><p class="satz">' + x[2] + '</p><div class="paar">'
        + '<figure><figcaption>Vorlage · Culinarium</figcaption><img loading="lazy" src="bilder/' + x[0] + '-' + b + '-vorlage.jpg" alt="Vorlage: ' + x[1] + '"></figure>'
        + '<figure><figcaption>Neubau · Haus-Check</figcaption><img loading="lazy" src="bilder/' + x[0] + '-' + b + '-neubau.jpg" alt="Haus-Check: ' + x[1] + '"></figure></div></section>';
    }).join('');
  }
  document.querySelectorAll('[data-b]').forEach(function (k) {
    k.onclick = function () { b = k.dataset.b; document.querySelectorAll('[data-b]').forEach(function (x) { x.setAttribute('aria-pressed', x === k); }); zeichne(); };
  });
  zeichne();
})();
