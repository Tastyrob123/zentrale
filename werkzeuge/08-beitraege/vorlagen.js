/* Vorlagen für den Beitrag: feste Bausteine mit Lücken, kein KI-Aufruf.
   Aufbau nach «LinkedIn-Beitrag — Aufbau & Algorithmus» und dem Regelwerk:
   erste Zeile (steht vor «mehr anzeigen») → zweite Zeile → Problem → kurze Absätze → Schlusssatz → eine konkrete Frage.
   Platzhalter in geschweiften Klammern füllt das Werkzeug aus dem Haus. Was es nicht weiß, bleibt als [Lücke: …] stehen.
   Eckige Klammern im Text sind Lücken, die Robert füllt. Die Prüfung meldet jede offene Lücke. */

const ABSCHNITT_ARTEN = {
  hook:    { name: 'Erste Zeile',   hinweis: 'Steht allein vor «mehr anzeigen», etwa 150 Zeichen. Eine Beobachtung oder eine Zahl, kein Aufwärmen.' },
  rehook:  { name: 'Zweite Zeile',  hinweis: 'Der zweite Haken direkt nach dem Klick. Ein kurzer Satz.' },
  problem: { name: 'Das Problem',   hinweis: 'Was im Weg stand. Eine Zeile je Gedanke, Leerzeile dazwischen.' },
  koerper: { name: 'Was anders ist', hinweis: 'Die Stichpunkte, je eine Zeile. Längere Absätze nur, wo du begründest.' },
  schluss: { name: 'Der Schlusssatz', hinweis: 'Ein Satz, der bleibt. Keine Zusammenfassung.' },
  frage:   { name: 'Die Frage',     hinweis: 'Konkret und beantwortbar: nennt Optionen oder eine Situation. Nie «Was denkt ihr?».' }
};

const LUECKEN_NAMEN = {
  haus: 'Name des Hauses', ort: 'Ort', art: 'Art des Hauses', art_gross: 'Art des Hauses', seit: 'Jahr der Gründung', jahre: 'Alter des Hauses in Jahren',
  adresse: 'Adresse der Seite', fertig: 'Datum, seit dem die Seite neu ist',
  dateien_vorher: 'Zahl der Dateien beim Öffnen, vorher', dateien_nachher: 'Zahl der Dateien beim Öffnen, nachher',
  ladezeit_vorher: 'Sekunden bis zur Seite, vorher', ladezeit_nachher: 'Sekunden bis zur Seite, nachher',
  seiten_vorher: 'Zahl der Unterseiten, vorher', seiten_nachher: 'Zahl der Unterseiten, nachher',
  klicks_vorher: 'Klicks bis zum Tisch, vorher', klicks_nachher: 'Klicks bis zum Tisch, nachher',
  stand_vorher: 'Was auf der alten Seite im Weg stand', stichpunkte: 'Was anders ist, je eine Zeile', stichpunkt_1: 'Der erste Stichpunkt'
};

const VORLAGEN = [
  {
    id: 'zahl', name: 'Eine eigene Zahl',
    kurz: 'Die Zahl aus dem Projekt steht vorn. Für Häuser, bei denen vorher und nachher gemessen sind.',
    abschnitte: {
      hook: [
        'Die alte Seite von {haus} hat {dateien_vorher} Dateien geladen, bevor der Gast den ersten Satz lesen konnte.',
        '{ladezeit_vorher} Sekunden hat die Seite von {haus} gebraucht, bis der Gast die Speisekarte sehen konnte.',
        '{klicks_vorher} Klicks bis zum Tisch. So lange hat ein Gast bei {haus} gebraucht, am Handy.'
      ],
      rehook: [
        'Die neue lädt {dateien_nachher}.',
        'Seit dem {fertig} sind es {ladezeit_nachher} Sekunden.',
        'Jetzt sind es {klicks_nachher}.'
      ],
      problem: [
        '{art_gross} in {ort}, seit {seit}. Die Seite dazu: {stand_vorher}.\n\nWer am Handy einen Tisch suchte, brauchte {klicks_vorher} Klicks. Die meisten haben vorher aufgegeben.',
        'Das Haus hat {jahre} Jahre Geschichte. Die Seite hatte {seiten_vorher} Unterseiten, und keine davon hat dem Gast die eine Frage beantwortet: [die Frage, die der Gast wirklich hat].\n\n[Was der Gast stattdessen gefunden hat, in einem Satz.]'
      ],
      koerper: [
        'Was jetzt anders ist:\n\n{stichpunkte}',
        'Gebaut haben wir {seiten_nachher} Seiten statt {seiten_vorher}. Der Rest ist Ordnung:\n\n{stichpunkte}'
      ],
      schluss: [
        'Der Gast entscheidet am Handy, bevor er das Haus gesehen hat. Die Seite ist der erste Eindruck, nicht die Fassade.',
        'Der Gast sieht jetzt in {ladezeit_nachher} Sekunden, was das Haus kann. Vorher hat er die Seite nach {ladezeit_vorher} Sekunden geschlossen.',
        '[Ein Satz, der bleibt: was das Haus jetzt hat, das es vorher nicht hatte.]'
      ],
      frage: [
        'Wann hat zuletzt jemand deine Seite am Handy geöffnet und bis zur Reservierung durchgeklickt: diese Woche, dieses Jahr oder nie?',
        'Wie viele Klicks braucht ein Gast bei dir vom ersten Bild bis zum Tisch: zwei, vier oder weißt du es nicht?',
        'Wer pflegt bei dir die Speisekarte auf der Website: die Küche, der Service oder niemand?'
      ]
    }
  },
  {
    id: 'situation', name: 'Eine Situation, die jeder kennt',
    kurz: 'Ein Gast, ein Handy, eine Uhrzeit. Erzählt in einzeiligen Absätzen, aufgelöst durch das neue Haus.',
    abschnitte: {
      hook: [
        'Samstag, 19:40 Uhr. Ein Gast sucht am Handy einen Tisch in {ort}.',
        'Ein Paar steht am Bahnhof in {ort} und sucht ein Zimmer für heute Nacht.',
        '[Eine Situation, die jeder kennt: Wochentag, Uhrzeit, ein Gast mit dem Handy in der Hand.]'
      ],
      rehook: [
        'Er findet {haus}. Dann findet er [was der Gast als Erstes gesehen hat, zum Beispiel ein PDF von 2023].',
        'Die Seite von {haus} öffnet sich nach {ladezeit_vorher} Sekunden. Der Gast ist da schon weiter.'
      ],
      problem: [
        'Das Haus steht seit {seit} in {ort}.\n\nDie Seite: {stand_vorher}.\n\nDer Gast hat [was er am Ende gemacht hat: angerufen, woanders reserviert, aufgegeben].',
        '[Wie alt die Seite war und wer sie zuletzt angefasst hat.]\n\n[Was im Weg stand, je eine Zeile.]'
      ],
      koerper: [
        'Seit dem {fertig}:\n\n{stichpunkte}',
        'Derselbe Gast, dieselbe Uhrzeit, die neue Seite:\n\n{stichpunkte}'
      ],
      schluss: [
        'Der Gast reserviert in {klicks_nachher} Schritten. [Was das für das Haus heißt, in einem Satz.]',
        'Das Haus hat sich nicht verändert. Die Seite zeigt es jetzt so, wie es ist.'
      ],
      frage: [
        'Welche Seite deines Betriebs hat ein Gast zuletzt gesehen, bevor er woanders reserviert hat: die Karte, die Zeiten oder das Formular?',
        'Was sieht ein Gast bei dir um 19:40 Uhr am Handy: eine Karte, ein PDF oder eine Telefonnummer?'
      ]
    }
  },
  {
    id: 'these', name: 'Eine These mit Beleg',
    kurz: 'Eine Behauptung, die man bestreiten kann, belegt mit diesem Haus. Nie ohne eigenen Anker.',
    abschnitte: {
      hook: [
        'Die meisten Websites in der Gastronomie sind für den Betreiber gebaut, nicht für den Gast.',
        'Eine Seite, die {ladezeit_vorher} Sekunden lädt, kostet jeden Abend Gäste. Im Kassenbuch steht das nirgends.',
        '[Eine These in einem Satz, die man bestreiten kann.]'
      ],
      rehook: [
        '{haus} hatte so eine Seite. Bis zum {fertig}.',
        'Der Beleg kommt aus {ort}.'
      ],
      problem: [
        '{seiten_vorher} Unterseiten, {dateien_vorher} Dateien beim Öffnen, {stand_vorher}.\n\nAlles davon war für jemanden im Haus wichtig. Nichts davon hat dem Gast einen Tisch gegeben.',
        '[Woran man die These an diesem Haus gesehen hat, in zwei bis drei kurzen Absätzen.]'
      ],
      koerper: [
        'Wir haben die Seite vom Gast her gebaut:\n\n{stichpunkte}',
        'Die Zahlen nach dem Umbau: {dateien_nachher} Dateien, {ladezeit_nachher} Sekunden, {klicks_nachher} Klicks bis zum Tisch.\n\n{stichpunkte}'
      ],
      schluss: [
        'Der Betreiber hat die Seite vorher jeden Tag gesehen. Der Gast hat sie jeden Tag verlassen.',
        '[Der Satz, der die These zuspitzt.]'
      ],
      frage: [
        'Für wen ist deine Seite gebaut: für den Gast, für dich oder für die Agentur, die sie gemacht hat?',
        'Welcher Teil deiner Website existiert nur, weil ihn jemand im Haus wollte, und welcher, weil der Gast ihn braucht?'
      ]
    }
  },
  {
    id: 'frage', name: 'Eine Frage mit Ja oder Nein',
    kurz: 'Die erste Zeile ist eine Frage, die sich jeder Gastronom selbst stellen muss. Das Haus gibt die Antwort.',
    abschnitte: {
      hook: [
        'Findet dein Gast am Handy in unter einer Minute einen Tisch?',
        'Stimmt der Preis auf deiner Website heute Abend?',
        'Würdest du auf deiner eigenen Seite buchen, wenn du das Haus nicht kennen würdest?'
      ],
      rehook: [
        'Bei {haus} waren es vorher {klicks_vorher} Klicks. Jetzt sind es {klicks_nachher}.',
        'Bei {haus} war die Antwort bis zum {fertig}: nein.'
      ],
      problem: [
        'Die alte Seite: {stand_vorher}.\n\nDer Gast hat das nicht gelesen. Er hat die Seite nach {ladezeit_vorher} Sekunden geschlossen.',
        '[Was auf der alten Seite im Weg stand, in zwei Sätzen.]'
      ],
      koerper: [
        'Das haben wir geändert:\n\n{stichpunkte}',
        'Die Antwort ist seit dem {fertig} ja:\n\n{stichpunkte}'
      ],
      schluss: [
        'Die Antwort entscheidet sich auf der Seite, bevor der Gast anruft.',
        '[Ein Satz, der bleibt.]'
      ],
      frage: [
        'Und bei dir: ja, nein oder hast du es nie ausprobiert?',
        'Wann hast du zuletzt selbst am Handy bei dir reserviert: diesen Monat, dieses Jahr oder noch nie?'
      ]
    }
  },
  {
    id: 'kurz', name: 'Der kurze Beitrag',
    kurz: 'Unter 600 Zeichen: erste Zeile, zwei Sätze, Frage. Zwischen die langen Beiträge gesetzt.',
    abschnitte: {
      hook: [
        '{haus} hat seit dem {fertig} eine neue Seite. Vorher {dateien_vorher} Dateien beim Öffnen, jetzt {dateien_nachher}.',
        'Die Seite von {haus} brauchte {ladezeit_vorher} Sekunden, bis der Gast etwas lesen konnte. Seit dem {fertig} sind es {ladezeit_nachher}.'
      ],
      koerper: [
        'Der Gast reserviert jetzt in {klicks_nachher} Schritten, vorher waren es {klicks_vorher}. {stichpunkt_1}',
        '[Der eine Unterschied, der zählt, in zwei Sätzen.]'
      ],
      frage: [
        'Wie viele Schritte sind es bei dir: zwei, vier oder mehr?',
        'Was würdest du an deiner Seite zuerst ändern: die Karte, die Zeiten oder die Buchung?'
      ]
    }
  }
];

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function datumLang(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${parseInt(m[3], 10)}. ${MONATE[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

/* Kleine Zahlen als Wort, wie man sie im Satz schreibt: «sechs Klicks», nicht «6 Klicks». */
const ZAHLWORTE = ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
function zahlWort(n) {
  if (n === undefined || n === null || n === '') return '';
  const z = Number(n);
  return Number.isInteger(z) && z >= 0 && z <= 12 && z !== 1 ? ZAHLWORTE[z] : String(n);
}

function satzPunkt(s) {
  s = (s || '').trim();
  if (!s) return '';
  return /[.!?]$/.test(s) ? s : s + '.';
}

/* Werte aus dem Haus und den Stichpunkten, mit denen die Platzhalter gefüllt werden. */
function werteAusHaus(haus, stichpunkte) {
  const w = {};
  if (haus) {
    const v = haus.vorher || {}, n = haus.nachher || {};
    w.haus = haus.name; w.ort = haus.ort; w.art = haus.art; w.adresse = haus.adresse;
    w.art_gross = haus.art ? haus.art.charAt(0).toUpperCase() + haus.art.slice(1) : '';
    w.seit = haus.seit; w.jahre = haus.seit ? new Date().getFullYear() - haus.seit : '';
    w.fertig = datumLang(haus.fertig);
    w.dateien_vorher = v.dateien; w.dateien_nachher = n.dateien;
    w.ladezeit_vorher = v.ladezeit; w.ladezeit_nachher = n.ladezeit;
    w.seiten_vorher = v.seiten; w.seiten_nachher = n.seiten;
    w.klicks_vorher = zahlWort(v.klicks_bis_tisch); w.klicks_nachher = zahlWort(n.klicks_bis_tisch);
    w.stand_vorher = v.stand;
  }
  const punkte = (stichpunkte || []).map(satzPunkt).filter(Boolean);
  w.stichpunkte = punkte.join('\n');
  w.stichpunkt_1 = punkte[0] || '';
  return w;
}

/* Setzt die Werte in eine Vorlage ein. Unbekanntes bleibt als Lücke stehen. */
function fuelle(text, werte) {
  return text.replace(/\{(\w+)\}/g, (_, k) => {
    const v = werte[k];
    if (v === undefined || v === null || v === '') return `[Lücke: ${LUECKEN_NAMEN[k] || k}]`;
    return String(v);
  });
}

function vorlage(id) {
  return VORLAGEN.find(v => v.id === id) || VORLAGEN[0];
}

/* Baut die Abschnitte eines Entwurfs aus einer Vorlage, jeweils die erste Fassung. */
function baueAbschnitte(vorlageId, werte) {
  const v = vorlage(vorlageId);
  return Object.keys(v.abschnitte).map(art => ({ art, fassung: 0, text: fuelle(v.abschnitte[art][0], werte) }));
}

/* Die nächste Fassung eines Abschnitts aus der Vorlage, der Reihe nach. */
function naechsteFassung(vorlageId, art, fassung, werte) {
  const v = vorlage(vorlageId);
  const liste = (v.abschnitte[art]) || (VORLAGEN.map(x => x.abschnitte[art]).find(Boolean)) || [''];
  const n = ((fassung || 0) + 1) % liste.length;
  return { fassung: n, text: fuelle(liste[n], werte), anzahl: liste.length };
}
