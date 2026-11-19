/* Feste Inhalte des Markenbuchs. Alles stammt aus grundlagen/ (Abzug vom 06.11.2026) und ist dort nachzulesen.
   Was die Website wirklich benutzt (Schriften, Farben, Knöpfe), kommt nicht von hier, sondern frisch aus /api/11-markenbuch/auslese. */
window.INHALT = {
  logoPfad: '/zentrale/zentrale/oberflaeche/kleid/anker/',

  /* Fassungen aus grundlagen/marke/logo/. grund: auf welchem Grund die Datei gezeigt wird.
     «maske» heisst: so wie die Seite das Zeichen einsetzt (Form als Maske, Farbe Weiss oder Creme), die Form bleibt unverändert. */
  logos: [
    { datei: 'anker.svg', name: 'Zeichen als Vektor', satz: 'Die Grundform, verlustfrei skalierbar. Die Datei ist schwarz; auf dunklem Grund setzt die Website dieselbe Form als Maske ein und füllt sie hell.', dunkel: 'maske', hell: 'bild' },
    { datei: 'anker-weiss.png', name: 'Zeichen weiss', satz: 'Die Primärfassung laut Branding: Weiss auf Dunkel. Auf hellem Grund verschwindet sie und wird dort nicht eingesetzt.', dunkel: 'bild', hell: '' },
    { datei: 'anker-emblem-schatten.webp', name: 'Emblem mit Schatten', satz: 'Dunkles Emblem mit leichtem Schatten, für helle Flächen.', dunkel: '', hell: 'bild' },
    { datei: 'anker-wasserzeichen.png', name: 'Wasserzeichen', satz: 'Für Dokumente: mittig auf jeder Seite, Deckkraft 6 Prozent, so wie in «Tastyrob Document Taste» festgelegt.', dunkel: '', hell: 'wasser' },
    { datei: 'anker-schwebt.webp', name: 'Zeichen in Metall', satz: 'Die räumliche Fassung mit Licht und Kante, für Bühnen und Vorschaubilder.', dunkel: 'bild', hell: 'bild' },
    { datei: 'anker-emblem.webp', name: 'Emblem im Raum', satz: 'Das Zeichen als Bild mit eigenem dunklem Hintergrund. Wird als ganzes Bild gezeigt, nie freigestellt.', dunkel: 'ganz', hell: '' }
  ],

  /* Aus Logo.md und Branding.md (Abschnitt Logo), Design-DNA Gesetz 5. */
  nie: [
    'Das Logo nachzeichnen, neu rendern oder neu interpretieren. Es wird immer die gelieferte Datei benutzt.',
    'Die Form verändern: nicht strecken, nicht drehen, keine Teile weglassen, nichts hinzufügen.',
    'Verschnörkelte Symbolik, illustrative Zusätze oder einen organischen Verlauf ins Zeichen legen.',
    'Das weisse Zeichen auf hellen oder das dunkle auf dunklen Grund setzen.',
    'Das Logo gross machen. Es steht immer klein.'
  ],
  nieQuelle: 'Logo.md, Branding.md, Design-DNA (Gesetz 5)',

  /* Tastyrob Document Taste, Abschnitt 2 und 3 */
  montserrat: {
    schnitte: [
      { name: 'Light', staerke: 300, wofuer: 'Verbindungswörter der Titelseite («zwischen», «und»)' },
      { name: 'Regular', staerke: 400, wofuer: 'Fliesstext, Aufzählungen' },
      { name: 'Medium', staerke: 500, wofuer: 'Titel, Überschriften, Parteinamen' }
    ],
    regeln: ['Eine Schriftfamilie im ganzen Dokument, kein zweiter Font, keine Serifen.', 'Nie Fett, nie Kursiv, nie Unterstreichung ausser in Links. Betonung entsteht über Gewicht 500 und Weissraum.', 'Farbe durchgehend #000000, keine Grautöne.', 'Zeilenabstand 1,15 überall.', 'A4 hochkant, Ränder 2,54 cm, Hintergrund Weiss.'],
    vertrag: [
      { rolle: 'Dokumenttitel', pt: 28, staerke: 500, mitte: true, text: 'Partnerschaftsvertrag' },
      { rolle: 'Untertitel', pt: 17, staerke: 400, mitte: true, text: 'Vereinbarung über die Zusammenarbeit' },
      { rolle: '«zwischen» / «und»', pt: 10, staerke: 300, mitte: true, text: 'zwischen' },
      { rolle: '§-Überschrift', pt: 12, staerke: 500, mitte: false, text: '§ 1 Gegenstand des Vertrags' },
      { rolle: 'Unterüberschrift', pt: 11, staerke: 500, mitte: false, text: '1.1 Leistungen' },
      { rolle: 'Fliesstext', pt: 11, staerke: 400, mitte: false, text: 'Tasty Studios baut für den Betrieb eine Website und richtet sie so ein, dass das Team sie selbst pflegen kann.' }
    ],
    fach: [
      { rolle: 'Kapitel', pt: 22, staerke: 400, mitte: true, text: 'Die neue Website' },
      { rolle: 'Einleitungsabsatz', pt: 11, staerke: 400, mitte: true, text: 'Was gebaut wird und was sich für das Haus ändert.' },
      { rolle: 'Abschnitt', pt: 15, staerke: 400, mitte: false, nummer: '1', text: 'Startseite' },
      { rolle: 'Leitwort', pt: 12, staerke: 500, mitte: false, text: 'Umsetzung:', rest: 'Die Startseite zeigt das Haus mit grossen Bildern.' },
      { rolle: 'Leitwort', pt: 12, staerke: 500, mitte: false, text: 'Was sich ändert:', rest: 'Gäste finden Zimmer und Tisch auf dem ersten Bild.' }
    ],
    quelle: 'Tastyrob Document Taste (gemessen 08.08.2026, Fachdokument festgelegt 09.08.2026)'
  },

  /* Branding.md, Typografie */
  typo: ['Eine geometrische Schrift in leichten Schnitten.', 'Genaue Abstände, Überschriften deutlich grösser als der Text.', 'Überschriften in Medium, nie fett.', 'Fliesstext gut lesbar, in normaler Grösse.'],

  /* Branding.md, Layout-Prinzipien */
  layout: [
    { wort: 'Linearität', satz: 'Waagrechte Linien trennen die Inhalte einer Seite.' },
    { wort: 'Rastergefühl', satz: 'Tabellen und Textblöcke stehen auf einem festen Raster.' },
    { wort: 'Weissraum', satz: 'Zwischen den Inhalten bleibt viel freie Fläche.' },
    { wort: 'Übersichtlichkeit', satz: 'Auf einer Seite stehen nur wenige Inhalte.' }
  ],

  /* Design-DNA, «Der Core, elf Gesetze» (gekürzt auf den ersten Satz) */
  bild: [
    { wort: 'Warmes Licht im Dunkeln', satz: 'Kerze, Laterne, Abendsonne, beleuchtete Theke: kleine warme Lichtpunkte gegen dunkles Holz, dunkles Blau, Backstein oder Nacht.' },
    { wort: 'Wie auf Film', satz: 'Korn, Gegenlicht, goldene Stunde, Bewegungsunschärfe, echte Schatten. Kein Bild sieht nach Studio, Stock oder KI aus.' },
    { wort: 'Der Mensch von hinten', satz: 'Rückenansicht, abgewandt, in einer echten Szene. Niemand posiert.' },
    { wort: 'Der Ort vorne', satz: 'Terminal, Holzdeck, Werkstatt, Roller, Tisch, Speicherstadt. Die Stimmung kommt vom Ort.' },
    { wort: 'Kleines Logo', satz: 'Das Logo steht klein. Ein Bild zeigt den Ort und die Menschen, nicht die Marke.' },
    { wort: 'Ein Farbpunkt pro Bild', satz: 'Rot und Orange sind Punkte, nie Flächen. Alles andere bleibt gedeckt: Creme, Sand, Oliv, Flaschengrün, Navy, Braun, Amber.' },
    { wort: 'Gebrauchsspuren', satz: 'Verblasster Druck, altes Holz, alter Lack, nasse Strasse. Nichts wird weggeputzt.' },
    { wort: 'Gezeichnet, nicht geclippt', satz: 'Illustration als feiner Strich oder Vintage-Stich. Kein Clipart, kein Verlauf, kein Neon.' },
    { wort: 'Humor', satz: 'Ein Witz nur, wenn er aus der Sache kommt. Keine Motivationssprüche.' },
    { wort: 'Ort', satz: 'Im Auftritt steht nur Hamburg.' },
    { wort: 'KI-Bilder nur, wenn sie wie Fotos aussehen', satz: 'Im Zweifel echtes Material aus Roberts Archiv nehmen und bearbeiten statt neu erzeugen.' }
  ],
  bildQuelle: 'Design-DNA, Vibe und Einflüsse (01.10.2026)',

  /* Schreibstil.md */
  sprache: {
    grundton: 'Direkt und sachlich. Kein künstlicher Druck. Wenn etwas komplex ist, wird es verständlich gemacht. Wenn etwas einfach ist, wird es nicht unnötig aufgeblasen.',
    ansprache: 'Wir duzen.',
    prinzip: 'Jeder Satz sagt etwas Bestimmtes: eine Tatsache, eine Zahl, einen Schritt. Sätze ohne Inhalt werden gestrichen.',
    vermeiden: [
      'Marketing-Sprache: grosse Versprechen, leere Superlative, Standardphrasen',
      'Unnötiger Fachjargon; wenn nötig, Begriffe greifbar machen',
      'Künstliche Dringlichkeit, Clickbait, emotionale Übertreibung, aufgesetzte Begeisterung',
      'Emojis und Business-Floskeln',
      'Gedankenstriche als Satztrenner und Leerzeichen vor Kommas',
      'Dreier-Aufzählungen von Verben, wirkt generisch und nach KI',
      'Sätze, die etwas verneinen, um danach das Gegenteil zu behaupten',
      '«Trägt» oder «tragen» im übertragenen Sinn',
      '«Vom X zum Y»-Sprüche und abstrakte Wortpaare als Überschrift',
      'Kurz-Sprüche aus Gegensatzpaaren oder Stichwort-Fragmenten'
    ],
    benennung: [
      'Gewöhnliche Wörter, präzise gesetzt. Keine Kunstwörter, keine englischen Tech-Namen, keine Kürzel.',
      'Keine Doppelbegriffe mit «und», ein Wort reicht.',
      'Der Name benennt die Haltung, nicht das Thema.',
      'Vokabular aus Druck, Handwerk, Architektur und Küche.',
      'Ein Name muss ohne Erklärung funktionieren und darf in zehn Jahren nicht albern wirken.'
    ],
    verboten: 'Ultimate, Master, Pro, Framework, Blueprint, Playbook, Toolkit',
    quelle: 'Schreibstil.md (Regeln bis 04.11.2026)'
  },

  /* Branding.md, «Der entscheidende Punkt» */
  kern: 'Dunkle Flächen mit Weiss, warme Akzente, wenige Elemente und genaue Abstände. Angebote, Unterlagen und Websites sind gleich gestaltet.',

  /* Mustertexte für die Schriftproben (aus den Grundlagen, nichts Neues behauptet) */
  muster: {
    Titel: 'Tasty Studios',
    Zwischentitel: 'Websites für Hotels und Restaurants',
    Fliesstext: 'Wir schreiben so, dass man sofort versteht, worum es geht.',
    Etikett: 'Hamburg'
  }
};
