/* saele.js · Ein Saal je Werkzeug in der Zentrale (wie Kontrollpanel: Bildschirmbilder, «So geht’s» in drei Schritten, Zahlen, Knopf «… öffnen»).
   Texte: je Werkzeug aus auftraege/<nn>-….md und der Oberfläche des Werkzeugs; jede Bezeichnung in <span class="m-ui"> steht wörtlich im Werkzeug.
   Bildschirmbilder: zentrale/img/schirm-<ordner>.jpg (und -2.jpg), aufgenommen mit node zentrale/schirme.js aus den laufenden Werkzeugen.
   Zahlen nur aus den Schnittstellen der Werkzeuge selbst (stand.weg); antwortet eins nicht, bleibt «–». Fehlt ein Werkzeug hier, zeigt die Zentrale
   seinen Saal mit Name und Satz aus werkzeug.json und einem leeren Bildschirm. */
(function () {
  var TEXT = {
  '01-feinschliff': {
    zweck: 'Texte und Schrift unserer Website',
    satz: 'Anna ändert Wörter, Schrift und Abstände direkt auf der Agentur-Seite, grössere Umbauten schreibt sie als Wunsch an Robert. Die Seite selbst bleibt, bis Robert übernimmt.',
    schritte: [
      { t: 'Seite öffnen', p: '<span class="m-ui">als Anna</span> oder <span class="m-ui">als Robert</span> wählen und eine Seite öffnen, etwa die <span class="m-ui">Startseite</span>. Unten erscheint die Leiste des Werkzeugs.' },
      { t: 'Wörter und Schrift ändern', p: 'In der Leiste <span class="m-ui">Wörter</span> wählen, auf einen Text klicken und schreiben, Enter speichert. Unter <span class="m-ui">Schrift</span> und <span class="m-ui">Abschnitte</span> lassen sich Schrift, Abstände und Reihenfolge anpassen.' },
      { t: 'Wunsch hinterlassen', p: 'Unter <span class="m-ui">Wünsche</span> einen Abschnitt anklicken und aufschreiben, was Robert umbauen soll. <span class="m-ui">Änderungen</span> zeigt alles mit vorher und nachher.' }
    ],
    zweiter: null
  },
  '02-kundenliste': {
    zweck: 'Unser Kundenstamm',
    satz: 'Jeder Kunde mit Vertrag als Akte: Stammdaten, Vertrag, Ablage, Rechnungen mit bezahlt oder offen und Termine. Neue Häuser beginnen im Sales Cockpit und kommen hierher, sobald alles besprochen ist.',
    schritte: [
      { t: 'Kunde öffnen', p: 'Unter <span class="m-ui">Unsere Kunden</span> einen Kunden anklicken. Oben steht die Website im Laptop, darunter die Reiter <span class="m-ui">Stammdaten</span>, <span class="m-ui">Vertrag</span>, <span class="m-ui">Ablage</span>, <span class="m-ui">Rechnungen</span> und <span class="m-ui">Termine</span>.' },
      { t: 'Ablegen', p: 'Eine Datei in die Fläche <span class="m-ui">Datei hierher ziehen</span> legen. Rechnungen bekommen Betrag, Fälligkeit und <span class="m-ui">Offen</span> oder <span class="m-ui">Bezahlt</span> und gehen zusätzlich nach Google Drive.' },
      { t: 'Kunde anlegen', p: '<span class="m-ui">Kunde anlegen</span> legt einen neuen Kunden an oder übernimmt ein Haus aus dem Sales Cockpit.' }
    ],
    zweiter: null
  },
  '03-entwurf-besuche': {
    zweck: 'Wer den Entwurf sah',
    satz: 'Zeigt je Haus, ob jemand den geschickten Entwurf geöffnet hat: wer, wann, welche Seiten und wie lange.',
    schritte: [
      { t: 'Häuser auswählen', p: 'Oben <span class="m-ui">Geöffnet</span>, <span class="m-ui">Noch niemand</span> oder <span class="m-ui">Neu</span> wählen. Neue Besuche seit dem letzten Mal tragen eine goldene Linie.' },
      { t: 'Ein Haus ansehen', p: 'Auf ein Haus klicken: jeder Besucher steht mit seinem Weg durch die Seiten da. <span class="m-ui">Alle Häuser</span> führt zurück zu «Karten & Preislisten».' },
      { t: 'Neues abhaken', p: 'Ist alles Neue gelesen, oben auf <span class="m-ui">als gesehen markieren</span> drücken. Die Quittung erlaubt es, das rückgängig zu machen.' }
    ],
    zweiter: 'Hotel Seeblick'
  },
  '04-haus-check': {
    zweck: 'Neue Kunden finden und prüfen',
    satz: 'Kandidaten aus der ganzen DACH-Region nach Potenzial sortiert, jedes Haus in unter einer Minute geprüft: Bilder, Text, Marke, Bauweise, Agentur, Aktualität und wie gut KI es liest. Was sich lohnt, geht in die Kunden.',
    schritte: [
      { t: 'Kunden finden', p: 'Unter <span class="m-ui">Kunden finden</span> nach Familien, Luxushotels oder Sterneküche filtern, nach Land und Potenzial sortieren. Eigene Funde kommen über das Formular dazu.' },
      { t: 'Haus prüfen', p: 'Die Adresse eintragen und <span class="m-ui">Prüfen</span>. Oben steht das Potenzial als Zahl, darunter jeder Bereich mit Ampel und einem Satz.' },
      { t: 'Weitergeben', p: 'Lohnt sich das Haus, mit <span class="m-ui">In die Kundenliste</span> zu den Kunden schieben. Dort läuft der Weg weiter bis zum Vertrag.' }
    ],
    zweiter: null
  },
  '05-angebot': {
    zweck: 'Angebot in Minuten',
    satz: 'Haus wählen, Umfang anklicken, und das Angebot steht als fertiges Dokument da, mit den Preisen aus den Grundlagen.',
    schritte: [
      { t: 'Haus wählen', p: 'Oben das Haus wählen oder mit <span class="m-ui">Neues Haus</span> eintragen: Name, Ansprechperson, Adresse, Währung und Anrede, dann <span class="m-ui">Haus speichern</span>.' },
      { t: 'Umfang anklicken', p: 'Anklicken, was dazugehört, etwa <span class="m-ui">Website</span> oder <span class="m-ui">Betreuung Basis</span>. Rechts wächst das Angebot Seite für Seite mit.' },
      { t: 'Speichern und drucken', p: '<span class="m-ui">Angebot speichern</span> gibt ihm eine Nummer und legt es beim Haus ab. <span class="m-ui">PDF speichern</span> öffnet das Druckfenster, dort als PDF sichern.' }
    ],
    zweiter: null
  },
  '06-aufgaben': {
    zweck: 'Wer macht gerade was',
    satz: 'Die gemeinsame Aufgabenliste von Robert und Anna: wer gerade woran ist, was übergeben wurde und was auf eine Antwort wartet.',
    schritte: [
      { t: 'Aufgabe anlegen', p: '<span class="m-ui">Neue Aufgabe</span> öffnen, eintragen was zu tun ist, für wen und bis wann, dann <span class="m-ui">Anlegen</span>.' },
      { t: 'Stand nachführen', p: 'Eine Aufgabe anklicken, den Stand ändern und <span class="m-ui">Speichern</span>. Mit <span class="m-ui">Notiz anhängen</span> bleibt festgehalten, was passiert ist.' },
      { t: 'Übergeben', p: 'In der Aufgabe eine Zeile schreiben und <span class="m-ui">An Anna übergeben</span>. Sie sieht es oben unter «Neu für dich» und hakt es mit <span class="m-ui">Gesehen</span> ab.' }
    ],
    zweiter: 'Wartet auf mich'
  },
  '07-kunden-uebersicht': {
    zweck: 'Kunden mit fertiger Website',
    satz: 'Je Kunde mit fertiger Website: läuft die Seite, was kostet sie uns im Monat und was steht bei der Betreuung an.',
    schritte: [
      { t: 'Kunde wählen', p: 'Links einen Kunden anklicken. Rechts steht, ob seine Seite antwortet, was sie uns kostet und was bei der Betreuung ansteht.' },
      { t: 'Seite abrufen', p: '<span class="m-ui">Jetzt abrufen</span> prüft die Seite des Kunden sofort, <span class="m-ui">Alle Seiten jetzt abrufen</span> alle auf einmal. Ausfälle der letzten 30 Tage stehen darunter.' },
      { t: 'Kosten und Termine pflegen', p: 'Beim Abschnitt auf <span class="m-ui">Bearbeiten</span>, dann <span class="m-ui">Posten hinzufügen</span> oder <span class="m-ui">Termin hinzufügen</span> und <span class="m-ui">Speichern</span>.' }
    ],
    zweiter: 'Hotel Seeblick Spiez'
  },
  '08-beitraege': {
    zweck: 'LinkedIn-Beiträge entwerfen',
    satz: 'Aus jedem fertigen Haus ein LinkedIn-Entwurf in Roberts Stimme, mit Prüfung, Vorschau und Bild vorher und nachher. Veröffentlicht wird von Hand.',
    schritte: [
      { t: 'Entwurf anfangen', p: '<span class="m-ui">Neuer Entwurf</span> drücken, das Haus wählen und die Bilder <span class="m-ui">Vom Haus</span> holen oder <span class="m-ui">Hochladen</span>.' },
      { t: 'Text bauen', p: 'Eine Vorlage wählen und <span class="m-ui">Text aus der Vorlage bauen</span>. <span class="m-ui">Andere Fassung</span> holt für einen Abschnitt den nächsten Vorschlag, die Prüfung rechts markiert Floskeln und zu lange Sätze.' },
      { t: 'Fertig machen', p: '<span class="m-ui">Speichern</span> legt den Entwurf ins <span class="m-ui">Archiv</span>. Mit <span class="m-ui">Text kopieren</span> und <span class="m-ui">Grafik speichern</span> selbst auf LinkedIn veröffentlichen.' }
    ],
    zweiter: null
  },
  '09-ki-check': {
    zweck: 'Wie gut KI ein Haus liest',
    satz: 'Zeigt einem Hotel oder Restaurant, wie gut ChatGPT und andere KI-Dienste seine Website lesen, und sammelt hier alle Checks, die Interessenten gemacht haben.',
    schritte: [
      { t: 'Check ausprobieren', p: '<span class="m-ui">Öffentliche Seite öffnen</span>, Website und Mail eingeben und <span class="m-ui">Jetzt prüfen</span>. Zum Üben ohne Gäste <span class="m-ui">Probedaten laden</span>.' },
      { t: 'Ergebnis ansehen', p: 'In der Liste ein Haus anklicken: Note, alle Prüfbereiche und die fertige Mail an den Gast stehen da. <span class="m-ui">Text kopieren</span> nimmt die Mail mit, verschickt wird nichts.' },
      { t: 'Weitergeben', p: 'Lohnt sich das Haus, mit <span class="m-ui">In die Kundenliste</span> übergeben. <span class="m-ui">Check löschen</span> fragt vorher nach.' }
    ],
    zweiter: null   // die Liste ist ohne Probedaten leer; die Zentrale lädt keine Probedaten in fremde Werkzeuge
  },
  '10-newsletter': {
    zweck: 'Newsletter des Studios',
    satz: 'Newsletter schreiben, Empfängerlisten pflegen und den Versand vorbereiten, mit einem Archiv aller Ausgaben. Verschickt wird nichts, jede Mail landet als Datei im Postausgang.',
    schritte: [
      { t: 'Empfänger pflegen', p: 'Unter <span class="m-ui">Empfänger</span> mit <span class="m-ui">Neuer Empfänger</span> jemanden eintragen oder eine Liste <span class="m-ui">Importieren</span>. Doppelte Einträge zeigt das Werkzeug an.' },
      { t: 'Ausgabe schreiben', p: 'Unter <span class="m-ui">Ausgaben</span> eine <span class="m-ui">Neue Ausgabe</span> anlegen und Bausteine wie <span class="m-ui">Titel</span>, <span class="m-ui">Text</span> oder <span class="m-ui">Bild</span> hinzufügen. Die Vorschau zeigt die Mail für Rechner und Handy.' },
      { t: 'Versand vorbereiten', p: '<span class="m-ui">Probemail an Robert</span> legt eine Probe in den Postausgang, <span class="m-ui">Versand vorbereiten</span> führt zur Zusammenfassung mit Rückfrage. Es geht nichts raus.' }
    ],
    zweiter: 'Ausgaben'
  },
  '11-markenbuch': {
    zweck: 'Logo, Schrift und Farbe',
    satz: 'Die Marke von Tasty Studios als Buch zum Durchlesen: die drei Zeichen von Agentur, Masterclass und Backoffice, 28 Farben mit Herkunft, die Schriften, Bilder, Bausteine und die Sprache. Das Werkzeug ändert nichts.',
    schritte: [
      { t: 'Lesen', p: 'Von oben nach unten lesen oder auf der ersten Seite ein Kapitel wählen, etwa <span class="m-ui">Drei Zeichen</span>, <span class="m-ui">Farben</span> oder <span class="m-ui">Schrift</span>.' },
      { t: 'Dateien laden', p: 'Im Kapitel <span class="m-ui">Mitnehmen</span> liegen Anker, Doktorhut, T, Wasserzeichen, alle Farben als Datei und die Schriften.' },
      { t: 'Werte mitnehmen', p: 'Ein Klick auf eine Farbe kopiert ihren Wert. <span class="m-ui">Als PDF</span> druckt das ganze Buch, <span class="m-ui">Abgleich</span> zeigt, was auf der Website wirklich steht.' }
    ],
    zweiter: 'Farbe'
  },
  '12-marke-vision': {
    zweck: 'Wofür wir stehen',
    satz: 'Wofür Tasty Studios steht: wer wir sind, für wen wir arbeiten, wie wir klingen und wohin es geht. Anna hinterlässt Fragen, Robert antwortet direkt im Werkzeug.',
    schritte: [
      { t: 'Kapitel lesen', p: 'Auf der Übersicht <span class="m-ui">Lesen</span> drücken oder links ein Kapitel wählen, etwa «Warum es uns gibt». Am Ende jedes Kapitels führt <span class="m-ui">Nächstes Kapitel</span> weiter.' },
      { t: 'Frage stellen', p: 'Ist beim Lesen etwas unklar, <span class="m-ui">Frage stellen</span> drücken und aufschreiben. Robert sieht sie im Kapitel «Annas Fragen» und antwortet dort.' },
      { t: 'Antwort lesen', p: 'Unter <span class="m-ui">Alle Fragen</span> stehen die offenen zuerst. Robert schreibt mit <span class="m-ui">Antworten</span> direkt darunter, die Antwort steht im Kapitel «Annas Fragen».' }
    ],
    zweiter: null
  },
  '15-drucksachen': {
    zweck: 'Unser Papier und unsere Vorlagen',
    satz: 'Alle Drucksachen von Tasty Studios auf einer Seite: Visitenkarten, Briefbogen, Umschläge, Pitch-Heft, Mappe, Präsentation, Beitragsvorlagen und die Stücke für Backoffice und Masterclass, jedes als druckfertige PDF.',
    schritte: [
      { t: 'Stück finden', p: 'Von oben nach unten blättern oder oben <span class="m-ui">Zu den Stücken</span> drücken. Jedes Stück zeigt seine Seiten, das Format und wofür es da ist.' },
      { t: 'PDF öffnen', p: '<span class="m-ui">Als PDF ansehen</span> öffnet das Stück in Originalgrösse, jede Seite in ihrem eigenen Format, bereit für die Druckerei.' },
      { t: 'Im Markenbuch nachsehen', p: '<span class="m-ui">Zum Markenbuch</span> führt zu Zeichen, Farben und Schriften, nach denen alle Stücke gesetzt sind.' }
    ],
    zweiter: null
  },
  '13-sales-cockpit': {
    zweck: 'Für jedes Akquise-Gespräch',
    satz: 'Alle Häuser, die noch kein Kunde sind. Je Haus eine Mappe für das Gespräch: die Website, die Werkzeuge und was das Haus damit kann, das Angebot mit der Betreuung, der Ablauf und die Antworten auf die Fragen, die kommen. Anna trägt dort ein, was im Gespräch herauskommt.',
    schritte: [
      { t: 'Haus öffnen', p: 'Links ein Haus wählen, geordnet nach <span class="m-ui">Im Gespräch</span>, <span class="m-ui">Entwurf geschickt</span> und <span class="m-ui">Noch nicht angeschrieben</span>. Rechts in der Mappe steht <span class="m-ui">Parat im Gespräch</span> mit Preis, Betreuung und Ansprechpartner.' },
      { t: 'Zeigen und antworten', p: '<span class="m-ui">Website zeigen</span> öffnet die Seite des Hauses. Unter <span class="m-ui">Die Werkzeuge</span> ein Werkzeug wählen, <span class="m-ui">Film ansehen</span> zeigt die Bedienung. <span class="m-ui">Fragen, die kommen</span> hat die Antworten.' },
      { t: 'Gespräch eintragen', p: 'Unter <span class="m-ui">Das Gespräch</span> abhaken, was besprochen ist, Ergebnis und Vereinbartes eintragen, dann <span class="m-ui">Speichern</span>. Die Quittung hat <span class="m-ui">Rückgängig</span>.' }
    ],
    zweiter: null
  },
  '14-social-cockpit': {
    zweck: 'Für alles, was nach aussen geht',
    satz: 'Alle Kanäle von Tasty Studios an einem Ort. Drei Beiträge pro Woche im Kalender, je Beitrag die Texte für jeden Kanal mit Vorschau und Prüfung, was draussen ist mit seinen Zahlen, und das Archiv.',
    schritte: [
      { t: 'Planen', p: 'Im <span class="m-ui">Kalender</span> wartet an jedem Rhythmus-Tag ein leerer Platz: ein Klick legt den Beitrag an. Was noch keinen Tag hat, liegt unter <span class="m-ui">Ideen</span>.' },
      { t: 'Schreiben und prüfen', p: 'In der Werkstatt je Kanal den Text schreiben. Rechts stehen die <span class="m-ui">Vorschau</span> und die <span class="m-ui">Prüfung</span>. Erst ohne Fehler lässt sich der Beitrag freigeben.' },
      { t: 'Posten und auswerten', p: '<span class="m-ui">Text kopieren</span> und in der App posten, dann auf <span class="m-ui">Draussen</span> stellen und den Link eintragen. Zahlen von Hand oder als Export-Datei unter <span class="m-ui">Draussen und Wirkung</span>.' }
    ],
    zweiter: null
  }
};

  var B = '/zentrale/zentrale/img/geraet-';
  var laenge = function (x) { return Array.isArray(x) ? x.length : NaN; };
  var mehr = function (z, eins, viele) { return z + '\u00a0' + (z === 1 ? eins : viele); };
  /* Je Werkzeug: Zeichen in der Leiste, Wort über dem Namen in der Tür, Zeichen der drei Schritte, Bildschirmbilder, Zahlen und woher sie kommen. */
  var DAZU = {
    '01-feinschliff': { zeichen: 'stift', wort: 'Agentur-Seite', z: ['welt', 'stift', 'chat'],
      schirme: [{ titel: 'Start' }],
      zahlen: [['offen', 'Änderungen offen'], ['wuensche', 'Wünsche offen'], ['seiten', 'Seiten']],
      stand: { weg: '/zentrale/api/01-feinschliff/uebersicht', lies: function (d) {
        var s = d.zusammenfassung || {}, seiten = Object.keys(d.seiten || {}).filter(function (k) { return k !== '*'; }).length;
        return { zahlen: { offen: s.aenderungen_offen, wuensche: s.wuensche_offen, seiten: seiten },
          kurz: s.aenderungen_offen ? mehr(s.aenderungen_offen, 'Änderung offen', 'Änderungen offen') : 'Nichts offen',
          satz: (s.aenderungen_offen ? mehr(s.aenderungen_offen, 'Änderung wartet', 'Änderungen warten') + ' auf Robert' : 'Keine Änderung wartet') + ', ' + mehr(s.aenderungen_uebernommen || 0, 'ist', 'sind') + ' übernommen.' }; } } },
    '02-kundenliste': { zeichen: 'person', wort: 'Kunden', z: ['plus', 'pfeil', 'stift'],
      zahlen: [['kunden', 'Kunden'], ['offen', 'Rechnungen offen'], ['termine', 'Termine fällig']],
      stand: { weg: '/zentrale/api/02-kundenliste/haeuser', lies: function (d) {   /* Kundenstamm (17.11.2026): nur Häuser mit Vertrag; der Weg bis dahin steht im Sales Cockpit */
        var heute = d.heute || '', k = (d.haeuser || []).filter(function (x) { return x.stand === 'Vertrag' || x.stand === 'Pro bono'; });
        var re = [], tm = 0;
        k.forEach(function (x) { (x.ablage || []).forEach(function (a) { if (a.art === 'Rechnung') re.push(a.rechnung || {}); });
          (x.termine || []).forEach(function (t) { if (!t.erledigt && t.datum && t.datum <= heute) tm++; }); });
        var offen = re.filter(function (r) { return !r.bezahlt; }).length, ueber = re.filter(function (r) { return !r.bezahlt && r.faellig && r.faellig < heute; }).length;
        return { zahlen: { kunden: k.length, offen: offen, termine: tm },
          weg: { kunden: k.length, offen: offen, ueber: ueber, bezahlt: re.length - offen },
          kurz: mehr(k.length, 'Kunde', 'Kunden') + (offen ? ', ' + offen + '\u00a0offen' : ''),
          satz: offen ? mehr(offen, 'Rechnung ist', 'Rechnungen sind') + ' offen' + (ueber ? ', ' + ueber + ' davon überfällig.' : '.') : 'Keine Rechnung offen.' }; } },
      weg: [{ k: 'kunden', t: 'Kunden', s: 'mit Vertrag' }, { k: 'offen', t: 'Rechnungen offen', s: 'noch nicht bezahlt' },
        { k: 'ueber', t: 'Überfällig', s: 'Fälligkeit vorbei' }, { k: 'bezahlt', t: 'Bezahlt', s: 'seit 17.11.2026 abgelegt' }] },
    '03-entwurf-besuche': { zeichen: 'auge', wort: 'Entwürfe', z: ['suche', 'auge', 'haken'],
      zahlen: [['haeuser', 'Entwürfe'], ['geoeffnet', 'Geöffnet'], ['neu', 'Neue Besuche']],
      stand: { weg: '/zentrale/api/03-entwurf-besuche/haeuser', lies: function (d) {
        var z = d.zeilen || [], g = z.filter(function (x) { return x.geoeffnet; }).length, neu = z.reduce(function (s, x) { return s + (+x.neu || 0); }, 0);
        return { zahlen: { haeuser: z.length, geoeffnet: g, neu: neu }, kurz: neu ? mehr(neu, 'neuer Besuch', 'neue Besuche') : g + ' von ' + z.length + ' geöffnet',
          satz: g + ' von ' + mehr(z.length, 'Entwurf', 'Entwürfen') + ' geöffnet' + (d.quelle === 'probe' ? ', Beispielwerte.' : '.') }; } } },
    '04-haus-check': { zeichen: 'haus', wort: 'Prüfen', z: ['suche', 'auge', 'person'],
      zahlen: [['haeuser', 'Häuser geprüft']],
      stand: { weg: '/zentrale/api/04-haus-check/haeuser', lies: function (d) { var n = laenge(d.haeuser);
        return { zahlen: { haeuser: n }, satz: n ? mehr(n, 'Haus', 'Häuser') + ' geprüft und abgelegt.' : 'Noch kein Haus geprüft und abgelegt.' }; } } },
    '05-angebot': { zeichen: 'pdf', wort: 'Angebot', z: ['haus', 'haken', 'pdf'],
      schirme: [{ titel: 'Angebot' }],
      zahlen: [['angebote', 'Angebote'], ['haeuser', 'Häuser']],
      stand: { weg: '/zentrale/api/05-angebot/', lies: function (d) {
        return { zahlen: { angebote: +d.angebote, haeuser: +d.haeuser }, kurz: mehr(+d.angebote || 0, 'Angebot', 'Angebote') + ' für ' + mehr(+d.haeuser || 0, 'Haus', 'Häuser'),
          satz: 'Preise aus den Grundlagen, Stand ' + (d.preise_stand ? new Date(d.preise_stand).toLocaleDateString('de-DE') : 'unbekannt') + '.' }; } } },
    '06-aufgaben': { zeichen: 'haken', wort: 'Studio', z: ['plus', 'stift', 'pfeil'],
      zahlen: [['offen', 'Offen'], ['arbeit', 'In Arbeit'], ['wartet', 'Warten auf Antwort']],
      stand: { weg: '/zentrale/api/06-aufgaben/liste', lies: function (d) {
        var a = d.aufgaben || [], z = function (s) { return a.filter(function (x) { return x.stand === s; }).length; };
        return { zahlen: { offen: z('offen'), arbeit: z('in Arbeit'), wartet: z('wartet auf Antwort') }, kurz: z('offen') + '\u00a0offen, ' + z('wartet auf Antwort') + '\u00a0warten',
          satz: mehr(z('erledigt'), 'Aufgabe', 'Aufgaben') + ' erledigt.' }; } } },
    '07-kunden-uebersicht': { zeichen: 'balken', wort: 'Betreuung', z: ['person', 'welt', 'stift'],
      zahlen: [['kunden', 'Kunden'], ['termine', 'Termine'], ['wuensche', 'Wünsche offen']],
      stand: { weg: '/zentrale/api/07-kunden-uebersicht/kunden', lies: function (d) {
        var k = d.kunden || [], t = 0, w = 0;
        k.forEach(function (x) { var b = x.betreuung || {}; t += laenge(b.termine) || 0; w += (b.wuensche || []).filter(function (y) { return y.stand !== 'erledigt'; }).length; });
        return { zahlen: { kunden: k.length, termine: t, wuensche: w }, satz: mehr(k.length, 'Kunde', 'Kunden') + ' mit fertiger Website.' }; } } },
    '08-beitraege': { zeichen: 'chat', wort: 'LinkedIn', z: ['plus', 'stift', 'kopie'],
      zahlen: [['entwuerfe', 'Entwürfe'], ['projekte', 'Fertige Häuser']],
      stand: { weg: ['/zentrale/api/08-beitraege/entwuerfe', '/zentrale/api/08-beitraege/projekte'], lies: function (d) {
        var e = laenge(d[0].entwuerfe), p = laenge(d[1].projekte);
        return { zahlen: { entwuerfe: e, projekte: p }, satz: mehr(e || 0, 'Entwurf', 'Entwürfe') + ' im Archiv. Veröffentlicht wird von Hand.' }; } } },
    '09-ki-check': { zeichen: 'schild', wort: 'Prüfen', z: ['schild', 'auge', 'person'],
      schirme: [{ titel: 'Übersicht' }],
      zahlen: [['checks', 'Checks']],
      stand: { weg: '/zentrale/api/09-ki-check/checks', lies: function (d) { var n = laenge(d.checks);
        return { zahlen: { checks: n }, satz: n ? mehr(n, 'Check', 'Checks') + ' von Interessenten gesammelt.' : 'Noch kein Check gesammelt.' }; } } },
    '10-newsletter': { zeichen: 'mail', wort: 'Newsletter', z: ['person', 'stift', 'mail'],
      schirme: [{ titel: 'Empfänger' }],
      zahlen: [['ausgaben', 'Ausgaben'], ['empfaenger', 'Empfänger'], ['listen', 'Listen']],
      stand: { weg: '/zentrale/api/10-newsletter/stand', lies: function (d) {
        var a = laenge(d.ausgaben), e = laenge(d.empfaenger);
        return { zahlen: { ausgaben: a, empfaenger: e, listen: laenge(d.listen) }, kurz: mehr(a || 0, 'Ausgabe', 'Ausgaben') + ', ' + mehr(e || 0, 'Empfänger', 'Empfänger'),
          satz: d.versand && d.versand.scharf ? 'Versand ist scharf gestellt.' : 'Versand nur trocken: jede Mail landet als Datei im Postausgang.' }; } } },
    '11-markenbuch': { zeichen: 'siegel', wort: 'Marke', z: ['siegel', 'hoch', 'kopie'],
      zahlen: [['dateien', 'Dateien'], ['schriften', 'Schriften'], ['farben', 'Farben']],
      stand: { weg: '/zentrale/api/11-markenbuch/auslese', lies: function (d) {
        return { zahlen: { dateien: laenge(d.dateien), schriften: laenge(d.schriften), farben: d.farben ? +d.farben.gesamt : NaN }, satz: 'Gelesen aus der gebauten Agentur-Seite.' }; } } },
    '12-marke-vision': { zeichen: 'buch', wort: 'Marke', z: ['buch', 'chat', 'haken'],
      zahlen: [['offen', 'Fragen offen'], ['beantwortet', 'Beantwortet']],
      stand: { weg: '/zentrale/api/12-marke-vision/fragen', lies: function (d) {
        var f = d.fragen || [], o = f.filter(function (x) { return !x.antwort; }).length;
        return { zahlen: { offen: o, beantwortet: f.length - o }, kurz: o ? mehr(o, 'Frage offen', 'Fragen offen') : 'Alles beantwortet',
          satz: o ? mehr(o, 'Frage von Anna wartet', 'Fragen von Anna warten') + ' auf eine Antwort.' : 'Keine Frage wartet auf eine Antwort.' }; } } },
    '15-drucksachen': { zeichen: 'druck', wort: 'Marke', z: ['blatt', 'pdf', 'siegel'],
      zahlen: [['stuecke', 'Stücke'], ['seiten', 'Seiten']],
      stand: { weg: '/zentrale/werkzeuge/15-drucksachen/plan.json', lies: function (d) {
        var s = 0; (d || []).forEach(function (x) { s += x.seiten || 0; });
        return { zahlen: { stuecke: laenge(d), seiten: s }, satz: 'Jedes Stück liegt als druckfertige PDF bereit.' }; } } },
    '13-sales-cockpit': { zeichen: 'balken', wort: 'Verkauf', z: ['person', 'auge', 'balken'],
      zahlen: [['offen', 'Offene Häuser'], ['gespraeche', 'Gespräche eingetragen']],
      stand: { weg: '/zentrale/api/13-sales-cockpit/stand', lies: function (d) {
        var o = (d.kunden || []).filter(function (x) { return !/^(Vertrag|Pro bono|abgesagt)$/.test(x.stand || ''); }).length;
        var g = Object.keys(d.gespraeche || {}).filter(function (k) { var s = d.gespraeche[k].stand || {}; return s.ergebnis || (s.abgedeckt || []).length; }).length;
        return { zahlen: { offen: o, gespraeche: g }, kurz: mehr(o, 'Haus', 'Häuser') + ' offen',
          satz: g ? mehr(g, 'Gespräch ist', 'Gespräche sind') + ' eingetragen.' : 'Noch kein Gespräch eingetragen.' }; } } },
    '14-social-cockpit': { zeichen: 'chat', wort: 'Kommunikation', z: ['uhr', 'stift', 'balken'],
      zahlen: [['arbeit', 'In Arbeit'], ['draussen', 'Draussen']],
      stand: { weg: '/zentrale/api/14-social-cockpit/stand', lies: function (d) {
        var l = Object.keys(d.beitraege || {}).map(function (k) { return d.beitraege[k]; });
        var a = l.filter(function (b) { return /^(entwurf|geprueft|freigegeben|geplant)$/.test(b.stand); }).length, dr = l.filter(function (b) { return b.stand === 'draussen'; }).length;
        var f = l.filter(function (b) { return b.stand === 'geprueft'; }).length;
        return { zahlen: { arbeit: a, draussen: dr }, kurz: mehr(a, 'Beitrag', 'Beiträge') + ' in Arbeit',
          satz: f ? mehr(f, 'Beitrag wartet', 'Beiträge warten') + ' auf Freigabe.' : 'Kein Beitrag wartet auf Freigabe.' }; } } }
  };
  var S = {};
  Object.keys(TEXT).forEach(function (o) {
    var t = TEXT[o], d = DAZU[o] || {}, s = {};
    Object.keys(d).forEach(function (k) { s[k] = d[k]; });
    s.zweck = t.zweck; s.satz = t.satz;
    s.schritte = t.schritte.map(function (x, i) { return { t: x.t, p: x.p, z: (d.z || [])[i] }; });
    var erst = (d.schirme && d.schirme[0] && d.schirme[0].titel) || 'Übersicht';
    s.schirme = [{ bild: B + o + '.webp', titel: erst, alt: t.satz }];   // eine Ansicht je Werkzeug, im Laptop (Robert 08.11.2026: nie zwei Fenster übereinander)
    s.zweiter = t.zweiter;
    S[o] = s;
  });
  window.ZENTRALE_SAELE = S;
})();
