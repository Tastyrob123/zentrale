/* Marke & Vision · Inhalt der Kapitel (Runde 2, 07.11.2026). Gliederung nach Robert (07.11.2026, auftraege/12-marke-vision.md): eine Geschichte in acht Kapiteln,
   erst warum, dann woran man uns erkennt, dann wohin. Kapitel 1 (Auftakt) ist die Übersicht, Kapitel 8 (Annas Fragen) die Ansicht der Fragen; hier stehen 2 bis 7.
   Nur aus den Quellen in grundlagen/ (Abzug 06.11.2026), Sätze wörtlich oder eng daran gekürzt. Nicht verwendet: Teil 2 des Strategiepapiers (Partnerschaft, Geld),
   alles Persönliche über Robert, Preise ausser aus Angebot.md. Darum fehlen aus dem Fahrplan die Punkte zu Partnerschaft, Steuerberatung und Gründung.
   Belege: echte Häuser, die in den Quellen stehen. Bilder gibt es nur vom Culinarium Hannover (haeuser/, Herkunft in haeuser/herkunft.json);
   die übrigen Häuser (Familie Maeder, Schlössli, Schäfli, Grand Beau-Rivage) belegen mit Text, ohne erfundenes Bild.
   Bausteine (teile): mk = grosser Titel mit Satz · fenster = grosses Foto mit Satz · beleg = Bild eines echten Hauses mit dem, was es zeigt
   · vh = vorher und nachher an einem echten Haus · bilder = Reihe von Bildern eines Hauses · karten = drei Karten · reihen = Zeilen mit Linie
   · zahlen = grosse Zahlen · sonie = «So» und «Nie» · weg = Schritte · preise = Zeilen mit Betrag · verweis = Weg ins Markenbuch.
   foto = Schlüssel aus dem Kleid (Fotos der Agentur-Seite), bild = Datei in haeuser/ ohne Endung. */
'use strict';
window.MV_QUELLEN = {
  pos: 'grundlagen/Positionierung & Markenkern.md',
  str: 'grundlagen/Strategiepapier — Teil 1 Strategie (Stand 04.11.2026).md',
  brand: 'grundlagen/Branding.md',
  dna: 'grundlagen/Design-DNA — Vibe & Einflüsse.md',
  stil: 'grundlagen/Schreibstil.md',
  stimme: 'grundlagen/Meine LinkedIn-Stimme.md',
  ang: 'grundlagen/Angebot.md',
  proj: 'grundlagen/Projekte.md',
  wzb: 'grundlagen/Werkzeug-Bau — Die sieben Werkzeuge (Master).md'
};
/* Kapitel 1 (Übersicht) und 8 (Fragen): nur Titel und Kurzsatz, für Rand, Kacheln, Frage-Fenster und Prüfseite */
window.MV_RAHMEN = {
  auftakt: { titel: 'Auf einen Blick', kurz: 'Die ganze Marke auf einer Seite, mit Suche über alle Kapitel.', foto: 'studio',
    q: [['str', 'Kapitel 01 Stand (Satz «Tasty Studios is a Digital Hospitality Studio.», Robert, 10.10.2026)'], ['pos', 'Abschnitt «Digital Hospitality — Markenkern für die Website-Agentur»']] },
  fragen: { titel: 'Annas Fragen', kurz: 'Alle Fragen und Notizen von Anna zu den Kapiteln, mit Roberts Antworten.', foto: 'empfang', q: [] }
};
window.MV_KAPITEL = [
  {
    k: 'warum', gruppe: 'warum', titel: 'Warum es uns gibt', foto: 'tafel',
    h1: ['Warum es uns', 'gibt.'],
    satz: 'Die Vielfalt in Gastronomie und Hotellerie bewahren, bevor unabhängige, familien- und inhabergeführte Betriebe von grossen Systemen mit Dumping-Preisen vom Markt verdrängt werden oder aussterben.',
    kurz: 'Das Wissen der KI-Welt für kleine und mittelständische Betriebe in Gastronomie und Hotellerie zugänglich machen, auch für Familien mit mehreren Häusern.',
    lage: [['Mission', 'Vielfalt in Gastronomie und Hotellerie bewahren'], ['Branche', 'Gastronomie und Hotellerie'], ['Für wen', 'Kleine und mittelständische Betriebe']],
    teile: [
      { art: 'mk', t: ['Ein Digital', 'Hospitality Studio.'], lead: 'Tasty Studios baut für Gastronomie und Hotellerie: Websites mit Werkzeugen für das Team, das Backoffice und die Masterclass. Seit dem 10.10.2026 sagen wir: «Tasty Studios is a Digital Hospitality Studio.»' },
      { art: 'fenster', foto: 'terrasse', s: 'Das Wissen, das die KI-Welt gerade hervorbringt,', u: 'für kleine und mittelständische Betriebe zugänglich machen, familien- und inhabergeführt, auch mit mehreren Häusern.', von: 'Mission, Positionierung & Markenkern' },
      { art: 'beleg', haus: 'Culinarium Hannover', bild: 'cu-tafel', b: 'Eine Abendreihe an einer langen Tafel.',
        p: 'Food-Pairing-Abende «Momo x Rudi» in der Bar Walk on the Wild Side, Hannover-Linden, dazu das Pop-up Dirty Chicken. Walk on the Wild Side ist heute Kunde mit Vertrag. Die Website des Culinarium bauen wir ohne Honorar für unser Netzwerk, alle Kosten, die dafür anfallen, trägt das Culinarium selbst. Für kleine Betriebe des deutschen Mittelstands, die uns im Netzwerk empfohlen werden, gibt es den Netzwerkpreis.',
        von: 'Design-DNA, 25. bis 28.10.2026 · Angebot, Stand 17.11.2026 · Sales Cockpit' },
      { art: 'reihen', t: ['Wofür Kunden', 'bezahlen.'], lead: 'Das Wissen selbst steht online. Bezahlt wird für das, was in diesen Zeilen steht.', reihen: [
        ['Auswahl', 'Wir filtern vor, was für ein Restaurant oder Hotel wichtig ist.'],
        ['Bezug zum Betrieb', 'KI-Themen am Beispiel des Betriebs erklärt: Gastronomie, Hotellerie, Claude Code, Second Brain und mehr.'],
        ['Was nicht überall gezeigt wird', 'Über die Grundlagen hinaus, zum Beispiel fertige Prompts für Bilder von Lebensmitteln.']
      ] },
      { art: 'mk', t: ['Gastronomie', 'und Hotellerie.'], lead: 'Andere KI-Anbieter sprechen alle Branchen an, ihre Gemeinschaft hat nur das Interesse an KI gemeinsam. Wir arbeiten nur für Gastronomie und Hotellerie. Anna kommt aus der Hotellerie, Robert aus der Gastronomie.' },
      { art: 'reihen', t: ['Was wir am Markt', 'gesehen haben.'], reihen: [
        ['Was es am Markt gibt', 'Über KI für kleine und mittlere Gastronomie sprechen bisher einzelne Personen mit wenig Reichweite. Eine Marke mit Reichweite gibt es dafür noch nicht.'],
        ['Was wir daraus machen', 'Wir besetzen das Thema jetzt und zeigen dafür gebaute Systeme und eigene Zahlen.'],
        ['Telefon-KI', 'Dafür gibt es schon viele Anbieter. Wir stellen sie nicht nach vorn.']
      ] },
      { art: 'beleg', haus: 'Culinarium Hannover', bild: 'cu-lachen', rechts: true, b: 'Menschen, die zusammen essen und lachen.',
        p: 'Die Seite des Culinarium ist dunkel. Gross stehen Rudis Fotos vom Abend: die Tafel, Hände, Teller von oben. Die Plakate liegen im Archiv.',
        von: 'Design-DNA, «Was Culinarium Hannover über die DNA zeigt»' }
    ],
    q: [['pos', 'Abschnitte «Die Nische», «Mission», «USP», «Markt-Beleg», «Positionierung: Bewegung statt Titel»'], ['brand', 'Abschnitt «Markenkern (Nische · Mission · USP)»'], ['dna', 'Abschnitt «Was Culinarium Hannover über die DNA zeigt»'], ['ang', 'Abschnitt «Netzwerkpreis Hannover»']]
  },
  {
    k: 'glaube', gruppe: 'warum', titel: 'Woran wir glauben', foto: 'bar',
    h1: ['Woran wir', 'glauben.'],
    satz: 'Wir bauen für Hotels und Restaurants die Website, die Werkzeuge für das Team und die KI aus einer Hand, damit alles zusammenpasst.',
    kurz: 'Jedes Haus bekommt einen eigenen Auftritt, Website und Werkzeuge kommen aus einer Hand.',
    lage: [['Der Satz', 'Tasty Studios is a Digital Hospitality Studio.'], ['Aus einer Hand', 'Website, Werkzeuge, KI'], ['Seit', '10.10.2026 der Markenkern']],
    teile: [
      { art: 'mk', t: ['Zur Website gehören', 'die Werkzeuge.'], lead: 'Zu jeder Website bauen wir die sieben Werkzeuge für das Team, vom Kontrollpanel bis zu Drucksachen & Feed. Ein Haus bekommt immer das ganze Paket.' },
      { art: 'karten', t: ['Was uns', 'unterscheidet.'], karten: [
        { m: 'Aus einer Hand', b: 'Ein Ansprechpartner', p: 'Was ein Haus sonst bei Webagentur, Grafikbüro, SEO-Agentur und weiteren Firmen einkauft, entsteht bei uns aus einer Hand und passt zusammen.' },
        { m: 'Woher wir kommen', b: 'Aus dem Betrieb', p: 'Anna aus Front Office, Event, F&B und Hoteldirektion, Robert aus Gastronomie, Expansion und Systembau. Beide haben selbst im Betrieb gearbeitet.' },
        { m: 'Jedes Haus anders', b: 'Eigene Gestaltung je Haus', p: 'Jeder Auftritt wird aus dem einen Haus heraus gestaltet. Die Familie Maeder hat vier Häuser mit vier verschiedenen Websites, die man als eine Familie erkennt.' }
      ] },
      { art: 'karten', t: ['Drei Beispiele', 'aus unserer Arbeit.'], lead: 'Zwei Restaurants der Familie Kuchler und eine Abendreihe in Hannover, jedes mit eigenen Farben, eigenen Bildern und eigenem Aufbau.', karten: [
        { m: 'Familie Kuchler, Bottighofen', b: 'Wirtschaft am Schlössli', p: 'Restaurant am See, mediterran. Die Seite ist hell, das Blau kommt aus dem Teller. Das erste Bild zeigt einen Teller am See, weil die Küche das Besondere des Hauses ist.' },
        { m: 'Familie Kuchler, Wigoltingen', b: 'Taverne zum Schäfli', p: 'Riegelhaus mit zwei Michelin-Sternen und dunklem Holz. Das erste Bild zeigt das Haus gross im Tageslicht, der Name steht im Himmel.' },
        { m: 'Hannover-Linden', b: 'Culinarium', p: 'Eine Abendreihe in einer Bar. Die Seite ist dunkel mit Kerzenlicht, das Pop-up Dirty Chicken hat eigene Seiten in Violett.' }
      ] },
      { art: 'beleg', haus: 'Culinarium Hannover', bild: 'cu-plakat', b: 'Witzige Sätze nur, wenn das Haus sie selbst sagt.',
        p: '«Dit is keen Burger. Dit Ding is \'ne Ansage.» blieb als Fenster und Sticker, weil es Dirty Chicken selbst so sagt. Erfundene Pointen, Stückzahlen und eine erfundene Vorgeschichte als Kneipe sind gestrichen.',
        von: 'Design-DNA, Gesetz 9' },
      { art: 'mk', t: ['Texte, die das Haus', 'aufwerten.'], lead: 'Texte und Bilder zeigen Sorgfalt und Handarbeit, den einzelnen Gast und den einzelnen Teller. Zahlen stehen nur da, wo sie wenige Plätze zeigen, nie als Menge, die abgearbeitet wird.' },
      { art: 'reihen', t: ['So nennen', 'wir uns.'], reihen: [
        ['In Texten und Angeboten', '«Digital Hospitality Studio» oder «Digital Hospitality & AI».'],
        ['Nicht', '«Webdesign-Agentur», «Website-Agentur», «Showcase».'],
        ['Zweites Standbein', 'Backoffice und Masterclass (die Masterclass ruht seit dem 14. November). Auf der Agentur-Seite laufen sie als Beleg dafür mit, dass wir Gastronomie von innen kennen. Langfristig sollen sie das Geschäft unabhängiger von einzelnen Aufträgen machen, weil sie einmal gebaut und dann mehrfach verkauft werden.']
      ] }
    ],
    q: [['str', 'Kapitel 02 Marke'], ['pos', 'Abschnitte «Digital Hospitality — Markenkern für die Website-Agentur», «Was daraus folgt»'], ['dna', 'Abschnitte «Der Core» (Fundament), «Was die abgenommenen Häuser über die DNA zeigen», «Was Culinarium Hannover über die DNA zeigt»'], ['stil', 'Abschnitt «Kernregeln» (Wertigkeit)']]
  },
  {
    k: 'kunden', gruppe: 'warum', titel: 'Für wen wir arbeiten', foto: 'haus',
    h1: ['Für wen wir', 'arbeiten.'],
    satz: 'Der Schwerpunkt liegt in der Schweiz. Dort gibt es viele sehr gute Häuser, deren Auftritt im Netz nicht zu ihrem Niveau passt, und die Bereitschaft, dafür zu zahlen.',
    kurz: 'Unabhängige Häuser, vor allem in der Schweiz: Familien mit mehreren Häusern zuerst.',
    lage: [['Schwerpunkt', 'Schweiz'], ['Zuerst', 'Familien mit mehreren Häusern'], ['Deutschland', 'Über Empfehlungen, kein Schwerpunkt']],
    teile: [
      { art: 'fenster', foto: 'zimmer', s: 'Haus, Küche und Service', u: 'sind besser als die heutige Website.', von: 'Woran wir ein passendes Haus erkennen' },
      { art: 'reihen', t: ['In dieser', 'Reihenfolge.'], lead: 'In Deutschland ist die Bereitschaft, für den Auftritt zu zahlen, deutlich geringer. Viele arbeiten mit Agenturen oder machen es selbst.', reihen: [
        ['Familien mit mehreren Häusern, Schweiz', 'Jedes Haus bekommt seinen eigenen Stil unter einem gemeinsamen Dach. Ein Gespräch führt zu mehreren Auftritten und einer Betreuung über alle Häuser. Beispiele im Sales Cockpit: Familie Maeder, Familie Zurbriggen, Beau-Rivage & Seiler, Familie Kuchler.'],
        ['Familiengeführte Hotels und Landgasthöfe, Schweiz', 'Haus und Service sind besser als die Website. Die Familie entscheidet selbst und schnell.'],
        ['Sternerestaurants und Restaurants mit Handschrift, Schweiz', 'Kleinere monatliche Betreuung als bei Hotels, dafür kurze Wege zur Entscheidung.'],
        ['Gastronomie in Deutschland', 'Läuft über Empfehlungen im Bekanntenkreis und Netzwerk, mit dem Netzwerkpreis für kleine Betriebe des deutschen Mittelstands. Kein Schwerpunkt der Akquise.']
      ] },
      { art: 'karten', t: ['An diesen Häusern', 'sieht man es.'], lead: 'Für jede Stufe der Reihenfolge gibt es schon ein Haus, an dem wir gearbeitet haben.', karten: [
        { m: 'Familie mit mehreren Häusern', b: 'Familie Maeder', p: 'Carlton-Europe, Waldhotel Doldenhorn, Landgasthof Ruedihus, Berghotel Gasterntal und eine Seite für die Familie. Jedes Haus hat seine eigene Website.' },
        { m: 'Restaurants mit Handschrift', b: 'Schlössli und Schäfli', p: 'Zwei Restaurants der Familie Kuchler im Thurgau. Zusammen CHF 10’000 mit gemeinsamer Startseite, je Haus CHF 5’000. Im Monat Betreuung Website CHF 350 und Werkzeuge im Abo CHF 400.' },
        { m: 'Gastronomie in Deutschland', b: 'Culinarium Hannover', p: 'Nach dem Gespräch mit Rudi, Momo und Derya am 2. November: Momo empfiehlt uns in seinem Netzwerk weiter. Daraus ist der Netzwerkpreis entstanden. Die Website des Culinarium bauen wir ohne Honorar für unser Netzwerk, alle Kosten, die dafür anfallen, trägt das Culinarium selbst.' }
      ] },
      { art: 'beleg', haus: 'Culinarium Hannover', bild: 'cu-bar', rechts: true, b: 'Das Haus steht oben, die Abende darunter.',
        p: 'Drei Konzepte unter einem Dach: Die Bar Walk on the Wild Side steht oben, die Abende und das Pop-up Dirty Chicken darunter. So versteht ein Fremder sofort, wo er ist.',
        von: 'Design-DNA, Gesetz 8' },
      { art: 'karten', t: ['Woran wir ein passendes', 'Haus erkennen.'], hinweis: 'Vorschlag', karten: [
        { m: 'Die Menschen', b: 'Entscheider sind erreichbar', p: 'Es wird von einer Familie oder den Inhabern geführt.' },
        { m: 'Das Niveau', b: 'Besser als die Website', p: 'Haus, Küche und Service sind sichtbar besser als die heutige Website.' },
        { m: 'Die Geschichte', b: 'Eine eigene Geschichte', p: 'Es hat eine eigene Geschichte oder einen besonderen Ort. Und eine KI gibt heute über das Haus falsche oder dünne Antworten. Das prüfen wir vorher.' }
      ] },
      { art: 'mk', t: ['Annas Netzwerk', 'zählt hier am meisten.'], lead: 'Häuser, die sie in der Schweizer Hotellerie kennt, öffnen die Tür leichter als ein Brief von Unbekannten.' },
      { art: 'fenster', foto: 'studio', s: 'Viele Häuser schieben eine neue Website auf.', u: 'Eine falsche KI-Antwort über das Haus liest dagegen schon der nächste Gast.', von: 'Annas Gedanke, 30.10.2026' }
    ],
    q: [['str', 'Kapitel 01 «Zum Ansehen», Kapitel 03 Kunden'], ['pos', 'Abschnitt «Was daraus folgt» (Zielgruppe der Agentur)'], ['ang', 'Abschnitte «Hotel-Portfolios» (Schlössli, Schäfli), «Netzwerkpreis Hannover»'], ['dna', 'Abschnitte «Was die abgenommenen Häuser über die DNA zeigen», «Was Culinarium Hannover über die DNA zeigt»']]
  },
  {
    k: 'erkennen', gruppe: 'wie', titel: 'Woran man uns erkennt', foto: 'speicherstadt',
    h1: ['Woran man uns', 'erkennt.'],
    satz: 'Wie unsere Bilder aussehen, wie wir schreiben und wie Seiten aufgebaut sind. Logo, Schrift und Farben stehen im Markenbuch.',
    kurz: 'Wie unsere Bilder aussehen und wie wir schreiben. Logo, Schrift und Farben stehen im Markenbuch.',
    lage: [['Licht', 'Warmes Licht im Dunkeln'], ['Ansprache', 'Website und Unterlagen Sie, LinkedIn du'], ['Logo, Schrift, Farben', 'Im Markenbuch']],
    teile: [
      { art: 'mk', t: ['Vorbild', 'Apple.'], lead: 'Wenige Elemente und viel Platz. Dunkle Flächen mit Weiss, warme Akzente in Taupe und Creme, Rot nur sparsam. Apple ist Vorbild in der Haltung, kopiert wird nichts.' },
      { art: 'fenster', foto: 'faehre', s: 'Warmes Licht im Dunkeln.', u: 'Kerze, Laterne, Abendsonne, beleuchtete Theke: kleine warme Lichtpunkte gegen dunkles Holz, dunkles Blau, Backstein oder Nacht.', von: 'Das erste Gesetz der Design-DNA' },
      { art: 'beleg', haus: 'Culinarium Hannover', bild: 'cu-glas', b: 'Kerzenlicht auf jedem Bild.',
        p: 'Nacht und Kerze, Gesichter im Kerzenlicht, Gläser im Gegenlicht. Eine Zahl in Pink wurde sofort wieder entfernt. Auszeichnungen wie Falstaff stehen in ihren Originalfarben.',
        von: 'Design-DNA, Gesetze 1 und 6' },
      { art: 'reihen', t: ['Die', 'Bildwelt.'], reihen: [
        ['Wie auf Film', 'Korn, Gegenlicht, goldene Stunde, echte Schatten. Kein Bild sieht nach Studio, Stock oder KI aus.'],
        ['Der Ort vorne', 'Produkt und Mensch sind im Bild, die Stimmung kommt vom Ort. Was das Haus einzigartig macht, steht vorne.'],
        ['Ein Farbpunkt pro Bild', 'Rot und Orange kommen nur als kleiner Punkt vor, nie als Fläche. Alles andere ist gedeckt.'],
        ['Gebrauchsspuren', 'Gegenstände dürfen benutzt aussehen. Die Aufnahme selbst ist sauber.'],
        ['Wenige grosse Bilder', 'Auf einer Seite stehen wenige grosse Bilder, keine Sammlung kleiner.']
      ] },
      { art: 'bilder', haus: 'Culinarium Hannover', t: ['Die echten', 'Abendfotos.'], lead: 'Rudis Fotos vom Abend stehen gross auf der Seite. Die Plakate liegen im Archiv.', bilder: [
        ['cu-teller', 'Der Teller von oben'], ['cu-tresen', 'Am Tresen'], ['cu-gaeste', 'Die lange Tafel'], ['cu-anstossen', 'Gläser im Gegenlicht']
      ] },
      { art: 'mk', t: ['Keine Siegel,', 'keine Kundenstimmen.'], lead: 'Wir setzen keine Testimonials und keine Badges ein. Angebote und Projektunterlagen sind gestaltet wie der übrige Auftritt.' },
      { art: 'mk', t: ['So', 'schreiben wir.'], lead: 'Wir schreiben wie jemand, der selbst im Betrieb gearbeitet hat. Auf der Website und in Unterlagen siezen wir, auf LinkedIn duzen wir. Keine Emojis.' },
      { art: 'sonie', so: ['Gäste fragen heute eine KI, bevor sie buchen.', 'Jeder Teller von Hand angerichtet.'], nie: [] },
      { art: 'reihen', t: ['Was nie', 'im Text steht.'], lead: 'Steht eins davon im Text, kommt es raus.', reihen: [
        ['Sprüche', 'Keine Sinnsprüche, keine Gegensatzpaare, keine Ketten aus Eigenschaftswörtern. Stattdessen ein normaler Satz, der sagt, was passiert.'],
        ['Dreierreihen', 'Keine Aufzählungen aus drei Wörtern als Stilmittel.'],
        ['Gedankenstriche', 'Keine Gedankenstriche als Satztrenner.'],
        ['Marketing-Sprache', 'Keine grossen Versprechen, keine leeren Superlative, keine künstliche Dringlichkeit, keine aufgesetzte Begeisterung.'],
        ['Kundendaten', 'Namen, Preise und Formulierungen der Häuser werden aus dem Original übernommen, nie verschönert.']
      ] },
      { art: 'verweis', ziel: '11-markenbuch', b: 'Logo, Schriften und Farben', p: 'Die Bausteine selbst, mit Farbwerten und Dateien, stehen im Markenbuch. Hier steht, warum sie so sind.' }
    ],
    q: [['brand', 'Abschnitte «Designphilosophie», «Vertrauensmechanik», «Der entscheidende Punkt»'], ['dna', 'Abschnitte «Der Core» (Gesetze 1, 2, 4, 6, 7), «Was Culinarium Hannover über die DNA zeigt»'], ['str', 'Kapitel 07 Stimme'], ['stil', 'Abschnitte «Grundton», «Kernregeln»'], ['stimme', 'Abschnitte «Die Stimme in einem Satz», «Anti-KI-Checkliste»']]
  },
  {
    k: 'bauen', gruppe: 'wie', titel: 'Was wir bauen', foto: 'bildschirm',
    h1: ['Was wir', 'bauen.'],
    satz: 'Websites mit Werkzeugen für Hotels und Restaurants, das Backoffice für den Betrieb und die Gastronomy AI Masterclass. Ein kompletter Website-Auftritt entsteht in rund zwei Tagen.',
    kurz: 'Websites mit Werkzeugen, das Backoffice und die Masterclass.',
    lage: [['Für Hotels und Restaurants', 'Websites mit Werkzeugen'], ['Für den Betrieb', 'Backoffice'], ['Ruht seit 14.11.', 'Masterclass']],
    teile: [
      { art: 'karten', t: ['Was wir', 'anbieten.'], karten: [
        { m: 'Für Hotels und Restaurants', b: 'Websites mit Werkzeugen', p: 'Die Website des Hauses mit den sieben Werkzeugen für das Team, in der Schweiz und in Deutschland, auch für Familien mit mehreren Häusern. Darum geht es im Rest dieses Kapitels.' },
        { m: 'Für den Betrieb', b: 'Das Backoffice', p: 'Ein Backoffice in Notion: Warenwirtschaft, Kalkulation, Kennzahlen, Personalplanung, Lieferanten, HACCP. Aufgebaut aus der Praxis in Betrieben mit mehreren Standorten. Nach Mass 2.000 bis 2.500 €.' },
        { m: 'Zum Lernen', b: 'Die Masterclass', p: 'Die Gastronomy AI Masterclass in drei Stufen: Gastro Air, Gastro Studio und Gastro Max. Sie ruht seit dem 14. November und kommt nach den Websites und dem Backoffice.' }
      ] },
      { art: 'mk', t: ['Wir bauen', 'den Auftritt vor.'], lead: 'Das Haus bekommt seinen fertigen Auftritt zum Anklicken. Über Geld reden wir erst danach.' },
      { art: 'vh', haus: 'Culinarium Hannover', t: ['Vorher', 'und nachher.'], lead: 'Links der Auftritt, wie er vorher war, rechts der gebaute Entwurf mit Rudis Fotos vom Abend.', paare: [
        ['cu-startseite-alt', 'cu-startseite-neu', 'Der erste Eindruck'], ['cu-abend-alt', 'cu-abend-neu', 'Ein Abend'], ['cu-abende-alt', 'cu-abende-neu', 'Alle Abende']
      ] },
      { art: 'reihen', t: ['Die drei', 'Teile.'], lead: 'Aus dem Gespräch am 4. November: drei Teile, die jedes Haus sofort versteht. Das Haus nimmt nur, was es braucht, und kann später dazunehmen.', reihen: [
        ['Website', 'Gestaltet für das eine Haus, mit der Buchung verbunden, lesbar für Gäste und KI. Einmal, Festpreis.'],
        ['Betreuung Website', 'Server, Domain, Sicherungen, kleine Änderungen, das aktuell gehaltene Wissen der KI. Monatlich kündbar. Den Verbrauch der KI zahlt das Haus direkt beim Anbieter.'],
        ['Werkzeuge', 'Die sieben Werkzeuge gibt es nur im Abo, nie zum Kauf. Monatlich kündbar.'],
        ['Familien mit mehreren Häusern', 'Ein Paketpreis für alle Häuser, die gemeinsame Startseite ist inklusive (seit 15.11.2026).']
      ] },
      { art: 'bilder', haus: 'Culinarium Hannover', t: ['Die Werkzeuge', 'für das Team.'], lead: 'Die sieben Werkzeuge am Beispiel Culinarium. Sie heissen seit dem 9. November in jedem Haus gleich.', klein: true, geraet: true, bilder: [
        ['cu-werkzeug-maison', 'Kontrollpanel', 'Die Zentrale'], ['cu-werkzeug-bureau', 'Website bearbeiten', 'Website pflegen'], ['cu-werkzeug-carte', 'Karten & Preislisten', 'Karten pflegen'],
        ['cu-werkzeug-reception', 'Anfragen & Chat', 'Das Team hinter dem Gäste-Chat'], ['cu-werkzeug-livre', 'Markenbuch', 'Die Marke zum Arbeiten'], ['cu-werkzeug-registre', 'Besucher', 'Besuche der Website'],
        ['cu-werkzeug-imprimerie', 'Drucksachen & Feed', 'Drucksachen und Beiträge']
      ] },
      { art: 'bilder', haus: 'Culinarium Hannover', t: ['Die', 'Werkbank.'], lead: 'Zu jeder Website gehört das ganze Paket: Website, Drucksachen, Feed und Unterlagen im gleichen Stil.', geraet: true, bilder: [
        ['cu-werkbank-website', 'Website'], ['cu-werkbank-drucksachen', 'Drucksachen'], ['cu-werkbank-feed', 'Feed'], ['cu-werkbank-unterlagen', 'Unterlagen']
      ] },
      { art: 'karten', t: ['Der Einstieg:', 'der KI-Check.'], lead: 'Gäste fragen ChatGPT, bevor sie buchen. Darüber kommen wir mit einem Haus ins Gespräch. Den vorgebauten Auftritt zeigen wir danach.', hinweis: 'Vorschlag', karten: [
        { m: 'Fragen', b: 'Was die KI sagt', p: 'Wir stellen ChatGPT und Gemini die Fragen, die Gäste in der Region stellen, und halten fest, was über das Haus gesagt wird und was davon nicht stimmt.' },
        { m: 'Prüfen', b: 'Ob eine KI die Seite lesen kann', p: 'Angaben zum Haus in der Form, die Google und KI lesen, ein Teil mit Fragen und Antworten, eine Sitemap.' },
        { m: 'Zeigen', b: 'Bericht und fertiger Auftritt', p: 'Das Haus bekommt das Ergebnis als kurzen Bericht, zusammen mit dem vorgebauten Auftritt, der die Lücken schliesst. In der Betreuung wiederholen wir die Stichprobe jeden Monat.' }
      ] },
      { art: 'weg', t: ['Vom Haus', 'zur Betreuung.'], hinweis: 'Vorschlag', schritte: [
        ['Haus auswählen', 'Nach den Merkmalen im Kapitel «Für wen wir arbeiten». Anna bringt Häuser aus ihrem Netzwerk ein.', 'gemeinsam'],
        ['KI-Check und Auftritt vorbauen', 'Rund zwei Tage je Haus.', 'Robert'],
        ['Brief mit QR-Code', 'Auf gutem Papier, dazu ein kurzes Video, in dem wir dem Haus seine neue Seite zeigen.', 'gemeinsam'],
        ['Anrufen', 'Nach rund einer Woche anrufen und ein Gespräch vereinbaren.', 'Anna'],
        ['Gespräch', 'Mit Familie oder Direktion. Anna führt, Robert zeigt die Werkzeuge.', 'gemeinsam'],
        ['Fertigstellen', 'Alles vollständig prüfen, online stellen und das Team in die Werkzeuge einführen.', 'Robert'],
        ['Betreuung', 'Monat für Monat. Anna ist die Ansprechpartnerin, Robert kümmert sich um Technik und Inhalte.', 'gemeinsam']
      ] },
      { art: 'preise', t: ['Was schon einen', 'Preis hat.'], lead: 'Stand 17.11.2026, netto. Der Betrag für ein einzelnes Haus steht im Sales Cockpit und gilt von dort aus überall.', reihen: [
        ['Hotel in der Schweiz', 'einmalig', 'CHF 10’000', 'Website und Werkzeuge je Haus. Im Monat Betreuung Website CHF 350 und Werkzeuge im Abo CHF 500'],
        ['Restaurant in der Schweiz', 'einmalig', 'CHF 5’000', 'Website und Werkzeuge je Haus. Im Monat Betreuung Website CHF 350 und Werkzeuge im Abo CHF 400'],
        ['Familien mit mehreren Häusern', 'einmalig, für alle Häuser', 'CHF 10’000 bis 30’000', 'Maeder CHF 30’000 (vier Häuser), Zurbriggen CHF 27’500 (vier), Beau-Rivage & Seiler CHF 20’000 (zwei), Kuchler CHF 10’000 (zwei); gemeinsame Startseite inklusive'],
        ['Hotel in Deutschland', 'einmalig', '10.000 €', 'Hotel Bareiss. Im Monat Betreuung Website 350 € und Werkzeuge im Abo 500 €'],
        ['Nur Werkzeuge', 'monatlich', 'CHF 350', 'Die Website bleibt beim Haus (Der Europäische Hof Heidelberg)'],
        ['Netzwerkpreis, Website', 'einmalig', '1.900 €', 'Für kleine Betriebe des deutschen Mittelstands, die uns im Netzwerk empfohlen werden'],
        ['Netzwerkpreis, Betreuung', 'monatlich', '59 € · 129 € · 199 €', 'Basis monatlich kündbar; Plus mit zwei Werkzeugen und Komplett mit allen sieben, je 12 Monate'],
        ['Backoffice nach Mass', 'einzeln', '2.000–2.500 €', 'Individuell zugeschnitten (18.06.2026)']
      ] }
    ],
    q: [['str', 'Kapitel 01 Stand, Kapitel 04 Einstieg, Kapitel 05 Angebot (ohne Beträge), Kapitel 06 Vertrieb'], ['ang', 'Abschnitte «Designstudien Schweiz» (Stand 15.11.2026), «Netzwerkpreis» (Stand 17.11.2026)'], ['pos', 'Abschnitt «Die Module, abstrahiert», «Was daraus folgt»'], ['ang', 'Abschnitte «Netzwerkpreis Hannover», «Hotel-Portfolios», «Ebene 2: B2B-Custom-Preis», «Gastronomy AI Masterclass»'], ['proj', 'Eintrag «Culinarium Hannover — Website»']]
  },
  {
    k: 'werkzeuge', gruppe: 'wie', titel: 'Unsere Werkzeuge', foto: 'plan',
    h1: ['Unsere', 'Werkzeuge.'],
    satz: 'Was jedes der sieben Werkzeuge kann und welche Werkzeuge nur ein Haus hat. Zum Nachlesen vor jedem Gespräch.',
    kurz: 'Die sieben Werkzeuge Funktion für Funktion und die eigenen Werkzeuge einzelner Häuser.',
    lage: [['Für jedes Haus', 'Sieben Werkzeuge'], ['Namen', 'In jedem Haus gleich'], ['Dazu', 'Eigene Werkzeuge']],
    teile: [
      { art: 'mk', t: ['Sieben Werkzeuge', 'für jedes Haus.'], lead: 'Jedes Haus bekommt dieselben sieben Werkzeuge in seinen eigenen Farben. Seit dem 9. November heissen sie in jedem Haus gleich, damit Anna sofort weiss, welches Werkzeug gemeint ist. Unten jedes Werkzeug Funktion für Funktion, mit echten Bildschirmen und einem kurzen Film, am Beispiel Culinarium. Einzelne Häuser haben dazu eigene Werkzeuge, die nur sie brauchen.' },
      { art: 'bilder', haus: 'Culinarium Hannover', t: ['So sehen sie', 'aus.'], lead: 'Die sieben Werkzeuge am Beispiel Culinarium. In jedem Haus sind es dieselben Funktionen und dieselben Namen.', klein: true, geraet: true, bilder: [
        ['cu-werkzeug-maison', 'Kontrollpanel', 'Die Zentrale'], ['cu-werkzeug-bureau', 'Website bearbeiten', 'Website pflegen'], ['cu-werkzeug-carte', 'Karten & Preislisten', 'Karten pflegen'],
        ['cu-werkzeug-reception', 'Anfragen & Chat', 'Das Team hinter dem Gäste-Chat'], ['cu-werkzeug-livre', 'Markenbuch', 'Die Marke zum Arbeiten'], ['cu-werkzeug-registre', 'Besucher', 'Besuche der Website'],
        ['cu-werkzeug-imprimerie', 'Drucksachen & Feed', 'Drucksachen und Beiträge']
      ] },
      { art: 'werkzeug', k: 'maison', t: ['Kontrollpanel:', 'die Zentrale.'], lead: 'Der Eingang zu allen Werkzeugen des Hauses.', f: [
        ['Alle Werkzeuge an einem Ort', 'Jedes Werkzeug als Raum des Hauses im Bild, ein Klick öffnet es. Der Gruss richtet sich nach der Tageszeit, das Datum steht ausgeschrieben. Fährt man über ein Werkzeug, zeigt die Kachel eine Vorschau davon.', 'maison-start'],
        ['Der Stand jedes Werkzeugs', 'Unter jedem Werkzeug steht in einer Zeile, was gerade los ist, live aus dem Werkzeug gelesen: «8 Karten, alle veröffentlicht», «6 Anfragen offen». Antwortet ein Werkzeug nicht, steht ein Satz ohne Zahl. Geschätzt wird nie.', 'maison-saal'],
        ['Jedes Werkzeug erklärt sich', 'Zu jedem Werkzeug ein eigener Abschnitt mit echten Bildschirmen und «So geht’s» mit den Namen der Knöpfe, wie sie im Werkzeug stehen.', 'maison-saal2'],
        ['Besuche des Tages', 'Eine Zeile mit den Besuchen von heute und wie viele davon zur Buchung gingen, mit dem Weg in die Besucherliste. Unten alle Anleitungen, Schritt für Schritt.', 'maison-fuss'],
        ['Rundgang beim ersten Öffnen', 'Wer die Zentrale zum ersten Mal öffnet, wird in ein paar kurzen Schritten herumgeführt. Jedes Werkzeug hat dazu seine eigene Anleitung.', '']
      ] },
      { art: 'werkzeug', k: 'bureau', t: ['Website bearbeiten:', 'die Website pflegen.'], lead: 'Das Team ändert die Website selbst, ohne uns anzurufen.', f: [
        ['Übersicht', 'Was im Entwurf wartet, was auf der Website steht, die häufigsten Aufgaben und jeder Bereich der Website als Bild mit der Zahl offener Änderungen.', 'bureau-start'],
        ['Text direkt in der Seite', 'Links alle Texte einer Seite, rechts die Seite selbst, als Rechner oder Handy. Ein Klick auf einen Text öffnet ihn, beim Tippen ändert sich die Seite sofort. Steht derselbe Text mehrfach, ändert «Überall ändern» ihn auf einmal.', 'bureau-seite'],
        ['Fotos tauschen, Abschnitte ausblenden', 'Ein Foto aus den Fotos des Hauses wählen oder ein eigenes hochladen; es wird in alle Grössen gerechnet. Ein Abschnitt, eine Karte oder ein Angebot lässt sich ausblenden, ohne es zu löschen.', 'bureau-abend'],
        ['Angaben des Hauses', 'Telefon, Adresse, Öffnungstage und Links an einer Stelle. Das Werkzeug zeigt, wo jede Angabe überall steht, etwa «an 9 Stellen auf 8 Seiten», und prüft sie beim Speichern.', 'bureau-angaben'],
        ['Zeiten & Preise', 'Jede Uhrzeit, jeder Preis und jede Dauer der Website in einer Liste, mit Filter. «In der Seite» springt zur Stelle. Was auf mehreren Seiten gleich steht, wird einmal geändert.', 'bureau-zeiten'],
        ['Termine', 'Im Culinarium legt das Team hier die Abende an: Datum, Beginn, Preis und Plätze. Jeder Abend bekommt auf der Website sein eigenes Plakat.', 'bureau-termine'],
        ['Google-Texte', 'Titel und Beschreibung jeder Seite, wie sie bei Google erscheinen, mit Zähler für die Länge und einer Vorschau wie in der Trefferliste.', 'bureau-google'],
        ['Hinweis für Gäste', 'Ein Satz oben auf jeder Seite, etwa Betriebsferien oder ein besonderer Abend. Mit Zeitraum erscheint und verschwindet er von selbst.', 'bureau-hinweis'],
        ['Vorher und nachher', 'Alles wartet zuerst im Entwurf. Jede Änderung steht mit vorher und nachher da und lässt sich einzeln zurücknehmen. Erst «Veröffentlichen» stellt sie auf die Website.', 'bureau-entwurf'],
        ['Frühere Fassungen', 'Jede Veröffentlichung bleibt aufgehoben, mit Datum und Notiz, und lässt sich mit zwei Klicks zurückholen.', 'bureau-fassungen'],
        ['Sprachen', 'In Häusern mit mehreren Sprachen bekommt jeder geänderte Text ein Feld je Sprache, mit einem Vorschlag zur Übersetzung.', '']
      ] },
      { art: 'werkzeug', k: 'carte', t: ['Karten & Preislisten:', 'die Karten.'], lead: 'Speisekarten, Weinkarten und Tagesmenüs aus einer Quelle für Website und PDF.', f: [
        ['Alle Karten an einem Ort', 'Die Karten des Hauses links, mit Datum der letzten PDF. Im Culinarium hat jeder Abend seine Karte, frühere Abende bleiben mit ihrem Plakat erhalten.', 'carte-start'],
        ['Einfach: eintragen, fertig', 'Gänge und Drinks in Feldern eintragen, rechts steht sofort die Karte, genau wie sie gedruckt wird. Ein Klick links oder rechts bringt beide Seiten auf dieselbe Stelle.', 'carte-karte'],
        ['Hinzufügen, verschieben, ausblenden', 'Neue Gerichte geführt anlegen, Rubriken verschieben, etwas kurz ausblenden. Preise kommen in der Schreibweise der Karte: aus «12,5» wird «12.50».', 'carte-tafel'],
        ['Fortgeschritten: gestalten', 'Direkt in der Karte schreiben, Elemente ziehen mit Einrasten, Ecken grösser und kleiner ziehen, Schrift, Grösse, Farbe und Abstände wählen. ⌘Z nimmt zurück.', 'carte-fortgeschritten'],
        ['Frühere Abende', 'Jede Karte eines früheren Abends lässt sich öffnen, ansehen und als Vorlage für den nächsten nehmen.', 'carte-frueher'],
        ['Mittagsmenü der Woche', 'In Häusern mit Mittag je Tag die Gänge eintragen; jeder Tag wird eine eigene Tageskarte, mittig gesetzt. Die Küche veröffentlicht sie selbst.', ''],
        ['Probe, prüfen, veröffentlichen', 'Erst eine Probe-PDF. Beim Veröffentlichen druckt das Werkzeug die Karte, prüft sie Wort für Wort gegen die Eingaben und setzt die Restaurant-Seiten der Website in allen Sprachen. Frühere Fassungen bleiben abrufbar.', '']
      ] },
      { art: 'werkzeug', k: 'reception', t: ['Anfragen & Chat:', 'das Team hinter dem Gäste-Chat.'], lead: 'Alles, was Gäste anfragen, landet hier.', f: [
        ['Übersicht', 'Wie viele Anfragen offen sind, welche Fragen der Chat nicht beantworten konnte und wie viel insgesamt gefragt wurde.', 'reception-start'],
        ['Eingang', 'Jede Anfrage aus dem Chat und den Formularen der Website, mit Gast, Datum, Personen und Wunsch. Dazu Hinweise fürs Team, aus den Angaben des Hauses: Ruhetag, mehr Personen als Plätze, eine Allergie.', 'reception-eingang'],
        ['Antwort im Ton des Hauses', 'Zu jeder Anfrage ein Antwortbrief aus den Vorlagen des Hauses, in der Sprache des Gastes, mit deutscher Fassung daneben. Als PDF-Brief oder Text zum Kopieren. Das Werkzeug verschickt nichts selbst.', 'reception-brief'],
        ['Die Abende', 'Im Culinarium für jeden Abend auf einen Blick: wie viele Plätze die Tafel hat, wie viele Tickets verkauft sind, wer fest zugesagt hat und was frei ist.', 'reception-abende'],
        ['Gutscheine', 'Gutscheine einlösen und ausstellen. Jeder bekommt eine eigene Nummer, und das Werkzeug sagt, ob ein Gutschein gilt.', 'reception-gutscheine'],
        ['Das wurde gefragt', 'Jede Frage an den Chat, nach Themen geordnet. Markiert ist, wo der Chat keine Antwort hatte.', 'reception-gefragt'],
        ['Einmal nachtragen', 'Fehlt dem Chat eine Antwort, trägt das Team sie einmal ein. Ab dann antwortet der Chat damit.', 'reception-nachgetragen'],
        ['Was der Chat weiss', 'Das ganze Wissen des Chats nach Bereichen: berichtigen, ausblenden, mit «gilt bis» ergänzen, einen Link oder eine Datei einlesen lassen.', 'reception-wissen'],
        ['Chat ausprobieren', 'Fragen wie ein Gast, im Fenster wie auf dem Handy, und sehen, was der Chat antwortet.', 'reception-chat']
      ] },
      { art: 'werkzeug', k: 'livre', t: ['Markenbuch:', 'die Marke zum Arbeiten.'], lead: 'Alles, was das Haus für seinen Auftritt braucht.', f: [
        ['Übersicht', 'Wie viele Fotos und Dateien da sind und was die Markenprüfung kann, mit dem Weg zu den Hausregeln.', 'livre-start'],
        ['Bildarchiv', 'Alle Fotos des Hauses, mit Suche und Filter nach Bereich, Format und Herkunft. Mit KI erzeugte Bilder sind gekennzeichnet, Fotos mit fremden Rechten auch.', 'livre-fotos'],
        ['Jedes Foto in fertigen Grössen', 'Ein Klick öffnet das Foto mit Beschreibung, Herkunft und Rechten, zum Laden für Instagram, Story, Website oder Druck. Bei nachgeschärften Fotos vorher und nachher.', 'livre-foto'],
        ['Logo & Dateien', 'Wortmarke, Logo, Tapete, Farben mit Werten zum Kopieren und Schriften, jede Datei einzeln oder alle zusammen. Hat das Haus Auszeichnungen, stehen ihre Logos in Originalfarben dabei.', 'livre-dateien'],
        ['Markenprüfung', 'Einen Entwurf hochladen, etwa ein Plakat einer Agentur. Das Werkzeug misst die Farben und prüft Bild, Schrift und Ton gegen die Marke, Punkt für Punkt.', 'livre-pruefung'],
        ['Die Hausregeln', 'Das Markenbuch zum Lesen, Seite für Seite, und als PDF.', '']
      ] },
      { art: 'werkzeug', k: 'registre', t: ['Besucher:', 'die Besuche der Website.'], lead: 'Wer kommt, woher und was er sich ansieht.', f: [
        ['Übersicht', 'Besuche, angesehene Seiten, Zeit je Besuch und wie viele zur Buchung gingen, für 7, 30 oder 90 Tage.', 'registre-start'],
        ['Jeder Besuch', 'Ort, Tag und Uhrzeit, Gerät, Sprache, woher der Gast kam und sein Weg durch die Seiten, mit Sekunden je Seite.', 'registre-besuche'],
        ['Herkunft', 'Aus welchen Ländern und Orten die Gäste kommen, in welcher Sprache und über welche Website.', 'registre-herkunft'],
        ['Zeit', 'Zu welcher Stunde und an welchem Wochentag die Gäste vorbeischauen. So sieht das Haus, wann ein Beitrag am meisten bringt.', 'registre-zeit'],
        ['Seiten', 'Welche Seiten am meisten gesehen werden und wie lange.', 'registre-seiten'],
        ['Verlauf', 'Die Besuche Tag für Tag, neben dem Zeitraum davor.', 'registre-verlauf'],
        ['Was zur Buchung führt', 'Von welchen Seiten aus gebucht wird, als Anteil an allen Besuchen.', 'registre-platz'],
        ['Ohne Cookies', 'Keine Namen, keine Adresse im Speicher, was gezählt wird und was nie, steht im Werkzeug. Alle Besuche lassen sich als Tabelle sichern.', 'registre-zaehlung']
      ] },
      { art: 'werkzeug', k: 'imprimerie', t: ['Drucksachen & Feed:', 'Drucksachen und Beiträge.'], lead: 'Gedrucktes und Beiträge im Stil des Hauses, ohne Grafiker.', f: [
        ['In einem Satz sagen', 'Was entstehen soll, steht in einem Satz, etwa «ein Plakat für den nächsten Abend». Das Werkzeug wählt Format, Aufbau, Fotos und Farben des Hauses.', 'imprimerie-start'],
        ['Fünf Entwürfe zur Wahl', 'Aus dem Satz werden fünf Entwürfe. Einer wird gewählt und im Editor fertig gemacht.', 'imprimerie-entwuerfe'],
        ['Direkt auf dem Blatt', 'Bearbeiten wie in Canva: Text auf dem Blatt schreiben, Elemente ziehen mit Einrasten, rechts Schrift, Grösse und Farbe aus der Marke.', 'imprimerie-text'],
        ['Fotos des Hauses', 'Ein Klick tauscht das Foto, nur Fotos aus dem Markenbuch; eigene lassen sich dazulegen. Den Ausschnitt zieht man mit der Maus.', 'imprimerie-fotos'],
        ['Anlässe & Events', 'Die nächsten Abende und Anlässe des Hauses, zu jedem vier fertige Motive.', 'imprimerie-events'],
        ['Vorlagen in vielen Arten', 'Plakate, Menükarten, Platzkarten, Gutscheine, Aushänge, Beiträge und Storys, alle im Stil des Hauses.', 'imprimerie-arten'],
        ['Anderes Format', 'Hoch oder quer, A5 bis A3, Beitrag oder Story: Texte und Fotos bleiben, der Aufbau passt sich an.', 'imprimerie-format'],
        ['Fertig für die Druckerei', 'PDF mit Beschnitt und Schnittmarken, Fotos in Druckqualität. Vorher prüft das Werkzeug, ob etwas zu nah am Rand steht oder ein Foto zu klein ist.', 'imprimerie-druck']
      ] },
      { art: 'karten', t: ['Eigene Werkzeuge', 'einzelner Häuser.'], lead: 'Manche Häuser haben zusätzlich ein Werkzeug, das nur sie brauchen.', karten: [
        { m: 'Culinarium und Wild Side', b: 'Die Künstlerliste', p: 'Anfragen von Künstlern für die Abende in der Bar, gesammelt an einem Ort (seit 06.11.2026).' },
        { m: 'Grand Beau-Rivage', b: 'Le Banquet', p: 'Anlässe planen, kalkulieren und Angebote dafür schreiben (seit 16.10.2026, nur auf dem Rechner).' },
        { m: 'Angelina Strelow', b: 'Vier Werkzeuge für Gastgeberinnen', p: 'Anfragen & Angebote, Der Abendplan, Tischkarten & Menü und Nach dem Abend, gebaut rund um ihre Abende (Angebot vom 06.11.2026).' }
      ] },
      { art: 'karten', t: ['Was wir', 'dazugeben.'], lead: 'Zum Auftritt gehören Dinge, die wir einmal bauen und mitgeben. Sie sind keine Werkzeuge, mit denen das Team täglich arbeitet.', karten: [
        { m: 'Werkbank', b: 'Alles auf einer Seite', p: 'Website, Werkzeuge und Beigaben eines Hauses zum Durchklicken, für das Gespräch.' },
        { m: 'Gedrucktes', b: 'Drucksachen und Unterlagen', p: 'Karten, Plakate, Mappen und die Unterlagen des Hauses im neuen Stil; dazu Gegenstände wie Kofferetiketten, Zündhölzer oder Untersetzer.' },
        { m: 'Online', b: 'Feed und Mails', p: 'Der Feed als Handy-Vorschau und die Mail-Vorlagen für Gäste im Kleid des Hauses.' }
      ] }
    ],
    q: [['wzb', 'Abschnitt 4 «Die sieben Werkzeuge, Funktion für Funktion» und Abschnitt 1 (Namen, seit 09.11.2026 in allen Häusern gleich)'], ['proj', 'Häuser und ihre Werkzeuge']]
  },
  {
    k: 'wohin', gruppe: 'wohin', titel: 'Wohin es geht', foto: 'faehre',
    h1: ['Wohin es', 'bis Ende 2027 geht.'],
    satz: 'Die Zeiten richten sich nach dem, was jeder von uns einbringen kann. Sie sind zum Besprechen gedacht und können sich verschieben.',
    kurz: 'Was heute steht, der Fahrplan bis Ende 2027 und was wir bewusst nicht machen.',
    lage: [['Ein Auftritt', 'in rund zwei Tagen'], ['Vorgebaut', 'für 18 Häuser'], ['Mit Vertrag', '2 Kunden']],
    teile: [
      { art: 'zahlen', t: ['Was es', 'heute gibt.'], lead: 'In den letzten zwei Jahren ist eine Grundlage entstanden, die man zeigen kann.', zahlen: [
        ['2', 'Tage', 'Ein kompletter Auftritt entsteht in rund zwei Tagen.'],
        ['80', 'Prozent', 'Die KI erledigt etwa 80 Prozent, die restlichen 20 Prozent machen ihn hochwertig.'],
        ['18', 'Häuser', 'Für 18 Häuser ohne Vertrag ist der Auftritt vorgebaut, alle stehen im Sales Cockpit.'],
        ['2', 'Kunden', 'Walk on the Wild Side und txtme.social haben einen Vertrag. Die Website des Culinarium bauen wir ohne Honorar für unser Netzwerk, die Kosten trägt das Culinarium selbst.']
      ] },
      { art: 'weg', t: ['Der', 'Fahrplan.'], hinweis: 'Vorschlag', zeit: true, schritte: [
        ['Bis Ende 2026', 'Logo in Auftrag geben, den KI-Check als festen Ablauf beschreiben. Annas Foto, Mail-Adresse und Signatur. Erste Briefe an die vorbereiteten Häuser.', ''],
        ['Januar bis März 2027', 'Gespräche und erste Abschlüsse. LinkedIn im festen Rhythmus, erste YouTube-Folge.', ''],
        ['April bis Juni 2027', 'Die Betreuung bringt jeden Monat einen festen Betrag. Das Backoffice wird den betreuten Häusern angeboten. Pilot «Jedem Gast seine Seite» mit einem Haus.', ''],
        ['Zweites Halbjahr 2027', 'Pilot auswerten, danach der Marketing-Anlass «Jedem Gast seine Seite».', '']
      ] },
      { art: 'mk', t: ['Später: jedem Gast', 'seine Seite.'], lead: 'Die Website zeigt jedem Gast, was zu ihm passt, der Familie den Kinderclub, dem Paar das Spa. Wir versprechen das erst, wenn es erprobt ist: als Pilot mit einem Haus über zwei bis drei Monate.' },
      { art: 'reihen', t: ['Wo wir', 'sichtbar werden.'], reihen: [
        ['LinkedIn, der Schwerpunkt', 'Hier sitzen Hoteliers, Direktionen und Verbände. Persönliche Profile von Robert und Anna plus die Firmenseite. Themen: falsche KI-Antworten über Häuser, Einblicke in den Bau, der Betrieb aus Annas Sicht.'],
        ['Instagram und Facebook', 'Ein Inhalt, auf beiden gleichzeitig veröffentlicht. Der Feed zeigt Hafen, Abendlicht und die Arbeit an den Häusern.'],
        ['YouTube', 'Lange Videos, in denen man sieht, wie wir denken und bauen, und persönliche Videos für einzelne Häuser, nicht gelistet.'],
        ['Newsletter «Post aus dem Studio»', 'Gemeinsam, einmal im Monat.']
      ] },
      { art: 'mk', t: ['Ein neues', 'Logo.'], lead: 'Der Name Tasty Studios bleibt, das Logo wird neu. Es muss klein lesbar sein, auf Nachtblau und auf Creme funktionieren und darf nicht nach Technikfirma aussehen. Neben den Logos der Häuser, für die wir arbeiten, steht es zurückhaltend.' },
      { art: 'reihen', t: ['Was wir', 'nicht machen.'], lead: 'Manches lassen wir, weil der Aufwand im Moment zu gross ist. Anderes versprechen wir erst, wenn es erprobt ist.', reihen: [
        ['Ein eigenes CRM für Gastronomie und Hotellerie', 'Der Aufwand passt im Moment nicht.'],
        ['Eine Buchungs-App in ChatGPT', 'Das ist eine eigene grosse Baustelle.'],
        ['«Jedem Gast seine Seite» verkaufen', 'Nicht, bevor der Pilot ausgewertet ist.'],
        ['Masterclass', 'Ruht seit dem 14. November. Zuerst kommen die Websites, dann das Backoffice, dann die Masterclass.'],
        ['Telefon-KI als Hauptbotschaft', 'Das Feld ist überfüllt. Wir stellen es nicht nach vorn.']
      ] },
      { art: 'karten', t: ['Was wir bauen können', 'und was nicht.'], karten: [
        { m: 'Können wir', b: 'Lesbar für Google und KI', p: 'Angaben zum Haus für Google und KI, Fragen und Antworten, monatliche Stichprobe in ChatGPT, Inhalte, die sich nach der Wahl des Gastes richten, nach Einstiegslink, Sprache und Land.' },
        { m: 'Nicht ohne Weiteres', b: 'Was eine eigene Baustelle wäre', p: 'Eine eigene Buchungs-App in ChatGPT, eine Vorhersage, wie wahrscheinlich ein Besucher bucht, und das Auslesen fremder Buchungsmasken.' },
        { m: 'Was wir nie sagen', b: 'Keine Marketing-Sprache', p: 'Keine künstliche Dringlichkeit, keine Emojis in Unterlagen. Nicht «Webdesign-Agentur», nicht «Website-Agentur».' }
      ] }
    ],
    q: [['ang', 'Sales Cockpit (haeuser.json, Stand 17.11.2026): vorgebaute Häuser und Kunden mit Vertrag'], ['str', 'Kapitel 01 Stand, Kapitel 05 «Später», Kapitel 08 Logo und Schrift, Kapitel 09 Kanäle, Kapitel 10 Fahrplan und «Was wir bewusst nicht machen» (ohne Partnerschaft, Steuerberatung und Gründung), Kapitel 04 «Was wir bauen können und was nicht»'], ['pos', 'Abschnitt «Markt-Beleg» (Telefon-KI meiden), «Was daraus folgt» (Selbstbeschreibung)']]
  }
];
