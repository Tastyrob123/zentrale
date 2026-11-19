/* Sales Cockpit · Wissen für das Gespräch (09.11.2026). Nur Belegtes, jede Angabe mit Quelle; was nicht belegt ist, steht als offen da.
   Quellen:
   W  = Werkbank-Angebot Carlton-Europe, Kapitel «Das Angebot» (Website-Projekte/Carlton-Europe Interlaken/werkbank/index.html, 15. und 17.10.2026):
        Pakete «Sie pflegen selbst» / «Ich pflege für Sie», Ablauf (seit 15.11.2026 als Schritte, Dauer aus Angebot.md), was dem Haus gehört, Gut zu wissen, Wo die KI arbeitet, Wie es gebaut ist.
        Dort steht «ich» (Robert); hier steht «wir», weil Anna für Tasty Studios spricht.
   A  = Vault «00 Kontext/Angebot.md», Abschnitt «Designstudien Schweiz» (Preise und Paketpreise 08.11.2026, Inhalt der Pakete «gilt wie bisher im Pitch»)
        und «Preisrahmen Website + Werkzeuge» (09.11.2026).
   M  = Website-Bau Master, Regel 60a der Vault-CLAUDE.md («Buchungsmasken bleiben»).
   Preise je Haus kommen nie von hier, sondern aus «Kunden». */
window.SC_WISSEN = {
  quelleW: 'Werkbank-Angebot Carlton-Europe, Kapitel «Das Angebot» (15./17.10.2026)',
  quelleA: '00 Kontext/Angebot.md (08.11. und 09.11.2026)',

  /* Die zwei monatlichen Teile (Robert 11.11.2026: «monatliche Betreuung Website … 350 Franken … Monatsabo Tools … 500 Franken», ersetzen die Pakete 1 und 2: «Ja, ersetzen»).
     Inhalt aus dem bisherigen Paket «Sie pflegen selbst» (W), auf die zwei Teile verteilt. Preis je Haus steht in «Kunden» (preis.betreuung_website, preis.abo_werkzeuge). */
  pakete: [
    { k: 'betreuung_website', name: 'Betreuung der Website', kurz: 'Im Monat', satz: 'Wir halten die Website am Laufen, sicher und aktuell.',
      punkte: ['Server, Domain, Sicherungen, Aktualisierungen, Sicherheit und Datenschutz.', 'Fehler an der Website beheben wir ohne Rechnung.', 'Antwort spätestens am nächsten Werktag.'] },
    { k: 'abo_werkzeuge', name: 'Werkzeuge im Abo', kurz: 'Im Monat', satz: 'Das Team pflegt die Inhalte mit den Werkzeugen selbst, wir halten die Werkzeuge am Laufen.',
      punkte: ['Die Werkzeuge laufen, Fehler beheben wir ohne Rechnung.', 'Das Team pflegt die Inhalte mit den Werkzeugen selbst.', 'Antwort spätestens am nächsten Werktag.'] }
  ],
  paketeFuss: 'Beide monatlich kündbar, netto. Wünsche darüber hinaus, etwa ein weiterer Bereich oder eine neue Funktion: dafür gibt es vorher ein eigenes Angebot.',

  /* Ablauf vom Start bis zur Seite unter der eigenen Adresse (W). */
  ablauf: [
    ['Schritt 1', 'Zugänge und Kennenlernen', 'Ein erstes Treffen, dazu die Liste der Zugänge.', 'Zugänge zu Domain, Buchungssystem und Mail, dazu einige Angaben.'],
    ['Schritt 2', 'Lesen und berichtigen', 'Jede Korrektur am selben Tag.', 'Seiten und Unterlagen gegenlesen, die Rezeption den Chat.'],
    ['Schritt 3', 'Anbindungen', 'Buchungssystem, Mailversand, Chat und jedes Werkzeug mit Passwort.', 'Ein Ansprechpartner beim Buchungsanbieter.'],
    ['Schritt 4', 'Fotos und Sprachen', 'Freigegebene Fotos einarbeiten, Übersetzungen gegenlesen lassen.', 'Der Entscheid zu den Fotos.'],
    ['Schritt 5', 'Runde im Haus', 'Gemeinsam durch jede Seite und jedes Werkzeug, die zweite Fassung bis Ende der Woche.', 'Das Team sieht durch.'],
    ['Schritt 6', 'Umzug vorbereiten', 'Rechtstexte, Weiterleitungen, Google, ein Probelauf.', 'Freigabe der Rechtstexte.'],
    ['Schritt 7', 'Einführung', 'Eine Stunde je Werkzeug mit den Personen, die damit arbeiten.', 'Zeit für die Runden.'],
    ['Schritt 8', 'Umzug', 'Die Seite geht unter der eigenen Adresse online, zwei Wochen sehen wir täglich hin.', 'Die Freigabe.']
  ],
  ablaufFuss: 'Ist der Entwurf fertig, ist die Seite in ein bis zwei Wochen online, je nachdem, wie schnell das Feedback des Hauses kommt.',   /* Rückfall; gültig ist «Bis online» in Angebot.md (Robert 15.11.2026) */

  braucht: ['Zugänge zu Domain, Buchungssystem und Mail', 'Der Entscheid zu den Fotos', 'Einige Angaben aus dem Haus', 'Gegenlesen der Übersetzungen', 'Freigabe der Rechtstexte'],
  gehoert: ['Website, Unterlagen, Drucksachen, Mails, Beiträge und Markenbuch gehören dem Haus.', 'Die Werkzeuge gehören nicht dem Haus, es gibt sie nur im Abo.', 'Domain, Server und alle Zugänge laufen auf den Namen des Hauses.', 'Die Fotos bleiben beim Haus und seinen Fotografen.', 'Der Ordner mit allen Dateien liegt beim Haus.', 'Gehen wir einmal getrennte Wege, nimmt das Haus Website, Domain und seine Dateien mit.'],   /* Werkzeuge nur im Abo: Robert 14.11.2026, Angebot.md */
  extra: ['Druckerei, Fotografen und Gegenlesen ausser Haus bleiben Rechnungen des Hauses.', 'Ebenso die Gebühren der heutigen Systeme, etwa des Buchungssystems.'],

  /* Betreuung, Eigentum und Verantwortung (Vault «00 Kontext/Angebot.md», gleichnamiger Abschnitt, Robert 09.11.2026) */
  laeuftAuchOhne: 'Nein. Die Seite geht geprüft und mit allen nötigen Sicherheitsmassnahmen an das Haus und läuft auch ohne Betreuung. Mit Betreuung bleiben wir jeden Monat dabei: Wir reagieren sofort, wenn etwas ist, und sorgen dafür, dass die Seite jederzeit flüssig läuft, egal was sich an der Technik ändert.',
  ohneBetreuung: ['Website und Domain gehören dem Haus, jederzeit.', 'Die laufenden Kosten, etwa für die Domain, übernimmt das Haus selbst.', 'Für alles, was nach der Übergabe rund um die Seite passiert, ist das Haus verantwortlich.', 'Mit Betreuung beheben wir Fehler an Website und Werkzeugen ohne Rechnung.'],
  sicherheit: ['Die Seiten stehen auf einer sehr sicheren Grundlage, weit über dem, was am Markt üblich ist. Was sich vorhersehen lässt, haben wir vorbereitet.', 'Wir denken dabei nicht nur an die Sicherheit von heute, sondern einige Schritte voraus. Die Technik ändert sich gerade schneller als je zuvor, auch durch neue KI-Programme.', 'Deshalb besprechen wir vorher, wer was übernimmt, falls doch einmal etwas Unvorhergesehenes passiert. Das Haus soll auch in einigen Jahren zufrieden sein.'],
  ki: { satz: 'Vier Stellen nutzen Claude, das Sprachmodell von Anthropic. Es läuft über ein eigenes Konto des Hauses beim Anbieter; abgerechnet wird dort nach Verbrauch, mit einer Obergrenze je Monat, die wir gemeinsam festlegen. Alle vier arbeiten auch ohne KI weiter.',
    stellen: [['Der Chat für die Gäste', 'Anfragen & Chat', 'Beantwortet Fragen auf der Website aus den Seiten und Unterlagen des Hauses.'],
      ['Antwort auf eine Anfrage', 'Anfragen & Chat', 'Aus der Anfrage eines Gastes wird ein Entwurf im Ton des Hauses. Hinaus geht er erst, wenn jemand vom Team ihn abschickt.'],
      ['Fünf Entwürfe', 'Drucksachen & Feed', 'Ein Satz genügt für fünf Entwürfe im Stil des Hauses. Die fertigen Vorlagen gehen auch ohne KI.'],
      ['Eine Markenprüfung', 'Markenbuch', 'Prüft einen Entwurf, etwa eine Anzeige der Druckerei, gegen die Marke des Hauses. Gespeichert wird nichts.']],
    kosten: ['Die KI läuft über ein eigenes Konto des Hauses bei Anthropic, dem Anbieter.',
      'Bezahlt wird dort direkt, nach Verbrauch. Der Verbrauch läuft nicht über unsere Rechnung.',
      'Für jeden Monat gibt es eine Obergrenze, die wir gemeinsam festlegen.',
      'Wie viel im Monat anfällt, hängt davon ab, wie oft die vier Stellen genutzt werden.',
      'Alle vier Stellen arbeiten auch ohne KI weiter.',
      'Kein Entwurf geht von selbst hinaus: Abgeschickt wird erst, wenn jemand vom Team es tut.'] },
  /* Laufende Kosten und Anbieter (Robert 17.11.2026: «im Sales Cockpit einbringen … für Anna auch verständlich»).
     Quelle: Vault «04 Ressourcen/Business & Verkauf/Kosten-Portfolio — Häuser, Websites, Werkzeuge (verbindlich).md», Teile A bis D,
     Preisseiten von Cloudflare, Vercel, GitHub, Anthropic, Google, abgerufen 17.11.2026. Wer die KI zahlt: Entscheid offen (Teil B 1). */
  kosten: {
    satz: 'Das Haus zahlt uns einen festen Betrag im Monat. Gebühren nach Nutzung kommen nicht dazu, auch nicht bei vielen Gästen oder wenn das Team jeden Tag etwas ändert.',
    arten: ['Fest, wie eine Miete: jeden Monat derselbe Betrag, egal wie viel los ist. Lässt sich vorher in den Preis einrechnen.',
      'Nach Nutzung, wie Strom: je mehr Besuche, Dateien oder Rechenaufgaben, desto höher die Rechnung. Ohne Obergrenze kann sie beliebig steigen.',
      'Für die Häuser nehmen wir nur Anbieter, bei denen keine Rechnung nach Nutzung entstehen kann.'],
    nie: ['Keine Kosten je Besuch: ob hundert oder hunderttausend Gäste im Monat, die Kosten bleiben gleich.',
      'Keine Kosten je Änderung: Texte, Preise, Karten und Fotos ändert das Team so oft es will.',
      'Keine Kosten für Speicher: Fotos, Karten als PDF und Videos ohne Gebühr nach Menge.',
      'Keine Nachzahlung am Monatsende.'],
    anbieter: [
      ['Cloudflare', '0 im Monat · 0 nach Nutzung', 'Hier liegen Website, Fotos, PDFs, Videos und die Werkzeuge. Jedes Haus bekommt ein eigenes Konto auf seinen Namen, im kostenlosen Plan und ohne Kreditkarte. Ohne Kreditkarte kann Cloudflare nichts abbuchen.'],
      ['Domain-Anbieter des Hauses', 'Jahresgebühr wie bisher', 'Die Adresse der Website gehört dem Haus und bleibt beim heutigen Anbieter. Mit Betreuung ist die Gebühr in der Betreuung enthalten, ohne Betreuung zahlt das Haus.'],
      ['Anthropic (Claude)', 'keine Monatsgebühr · je Entwurf', 'Die KI hinter den Entwürfen in drei Werkzeugen. Das Guthaben wird vorher aufgeladen, wie bei einer Prepaid-Karte; ist es leer, pausiert nur die KI. Wer zahlt, wird gerade entschieden; bis dahin gilt, was unter «Wo die KI arbeitet» steht.'],
      ['Buchungssystem und heutige Systeme', 'wie bisher', 'Buchung, Kasse und Mail des Hauses bleiben, wie sie sind, mit ihren Gebühren beim Haus.']],
    warum: ['Kein Zahlungsmittel im Konto: ohne Kreditkarte keine Rechnung, auch in einem sehr vollen Monat.',
      'Seiten, Fotos und PDFs an Gäste schicken ist im kostenlosen Plan ohne Grenze enthalten («free and unlimited», Preisseite von Cloudflare).',
      'Für Websites von Betrieben erlaubt. Die kostenlosen Pläne von GitHub und Vercel sind nur für private Seiten gedacht.',
      'Gehen wir getrennte Wege, bleibt das Konto mit allem beim Haus.'],
    grenzen: ['Gäste: keine Grenze, egal wie viele kommen.',
      'Speichern und Veröffentlichen in den Werkzeugen: 100’000 Aufrufe am Tag frei. Zehn Änderungen am Tag liegen weit darunter.',
      'Wird diese Grenze doch einmal erreicht, kommt an dieser Stelle eine Meldung und am nächsten Tag geht es weiter. Eine Rechnung kommt nie.',
      'KI: feste Obergrenze je Monat. Ist sie erreicht, arbeitet das Werkzeug ohne Entwurf weiter.'],
    uns: [['10 Häuser', '0 fest und 0 nach Nutzung je Haus. Dazu die Domain bei Häusern mit Betreuung und die KI, je nach Entscheid.'],
      ['50 Häuser', 'Gleich: 0 je Haus. Domains bei Häusern mit Betreuung, KI je nach Entscheid. Keine Kosten, die mit den Gästen wachsen.'],
      ['100 Häuser', 'Gleich: 0 je Haus, 100 kostenlose Konten. Domains bei Häusern mit Betreuung, KI je nach Entscheid.']],
    unsSatz: 'Fest für Tasty Studios, unabhängig von der Zahl der Häuser: Vercel 23.80 USD im Monat, bis gekündigt, und das Google-Postfach 8.10 EUR netto je Person.'
  },
  sicher: ['Keine Kekse, kein Verfolgen der Besucher.', 'Keine Karten- oder Passdaten im Chat.', 'Formulare mit Falle für Spam.', 'Besucher zählt Besuche ohne Namen.', 'Ein Passwort je Person.', 'Jeder frühere Stand kommt zurück.', 'Unsichtbar für Suchmaschinen bis zum Umzug.'],

  /* Was im Gespräch drankommen soll: Anna hakt ab, was besprochen ist */
  themen: [['website', 'Website gezeigt'], ['werkzeuge', 'Werkzeuge gezeigt'], ['preis', 'Preis genannt'], ['ki', 'KI und Kosten erklärt'], ['betreuung', 'Betreuung erklärt'],
    ['ablauf', 'Ablauf erklärt'], ['braucht', 'Was wir vom Haus brauchen'], ['fragen', 'Fragen beantwortet'], ['weiter', 'Nächsten Schritt vereinbart']],
  ergebnisse: ['Nicht erreicht', 'Rückruf vereinbart', 'Interesse, Unterlagen schicken', 'Termin vereinbart', 'Angebot gewünscht', 'Kein Interesse']
};
