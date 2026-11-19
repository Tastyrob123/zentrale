/* Prüfung des Textes gegen die Anti-KI-Checkliste aus «Meine LinkedIn-Stimme» und die Negativliste aus «Schreibstil».
   Kein KI-Aufruf: feste Muster, Satz- und Absatzlängen, Aufbau. Jeder Fund hat eine Stufe:
   fehler   = raus damit (steht so in Roberts Checkliste)
   pruefen  = oft falsch, manchmal richtig: ansehen
   hinweis  = Mechanik und Länge
   Funde haben Anfang und Ende im Gesamttext, damit die Vorschau sie markieren kann. */

const MUSTER = [
  { m: /\p{Extended_Pictographic}/gu, stufe: 'fehler', titel: 'Emoji', tipp: 'Kein Emoji, in keiner Form. Der nüchterne Ton ist das Unterscheidungsmerkmal.' },
  { m: /\s[—–]\s|—/g, stufe: 'fehler', titel: 'Gedankenstrich als Satztrenner', tipp: 'Punkt setzen und einen neuen Satz anfangen. Oder ein Komma.' },
  { m: /(?<=\S) - (?=\S)/g, stufe: 'fehler', titel: 'Bindestrich als Gedankenstrich', tipp: 'Punkt oder Komma statt des Strichs.' },
  { m: / ,/g, stufe: 'fehler', titel: 'Leerzeichen vor dem Komma', tipp: 'Das Leerzeichen weg.' },
  { m: /\[[^\]\n]{1,200}\]/g, stufe: 'fehler', titel: 'Lücke offen', tipp: 'Hier fehlt noch dein Text. Die Klammer kommt ganz weg.' },
  { m: /\bes geht nicht um\b/gi, stufe: 'fehler', titel: 'Kontrast-Phrase', tipp: '«Es geht nicht um X, es geht um Y» steht in jedem zweiten Beitrag. Sag direkt, worum es geht.' },
  { m: /\b(kein|keine|keinen|keinem|keiner|nicht)\b[^.!?\n]{0,90}\bsondern\b/gi, stufe: 'fehler', titel: '«Nicht X, sondern Y»', tipp: 'Das Muster klingt nach KI. Nenn nur, was ist. Erlaubt bleibt das knappe «A, nicht B» als Klarstellung.' },
  { m: /\b(revolution(är|iert|ieren|ierte)?\w*|bahnbrechend\w*|game-?changer\w*|disruptiv\w*|next level|state of the art)\b/gi, stufe: 'fehler', titel: 'Marketing-Wort', tipp: 'Sachlich benennen, was passiert.' },
  { m: /\b(Held(en|in|innen)?|Zauberei|Wunderwaffe|Magie|magisch\w*|Zauber\w*)\b/g, stufe: 'fehler', titel: 'Lockeres Bild-Wort', tipp: 'Robert: «Held» ging nicht durch. Sachlich: «das Tool ist nebensächlich».' },
  { m: /\bReflex\w*\b/g, stufe: 'fehler', titel: 'Das Wort «Reflex»', tipp: 'Ersatz: «der naheliegende Schritt», «der erste Gedanke», «was die meisten zuerst tun».' },
  { m: /\b(einsammel\w*|eingesammelt|Flei(ß|ss)arbeit)\b/gi, stufe: 'fehler', titel: 'Wort von der Verbotsliste', tipp: '«einsammeln» und «Fleißarbeit» schreiben wir nie. Sache direkt benennen: «Gäste um eine Bewertung bitten», «laufende Arbeit».' },
  { m: /\bWortklauberei\b/gi, stufe: 'fehler', titel: 'Wort von der Verbotsliste', tipp: '«Wortklauberei» benutzen wir nicht. Auch verwandte wegwerfende Füller weglassen.' },
  { m: /\bglatt(e|en|er|es|em)?\b/gi, stufe: 'pruefen', titel: '«glatt» für flache Texte', tipp: 'Für einen flachen Text nicht «glatt»: «austauschbar», «nach Vorlage», «ein Text, der zu jedem passt und zu keinem».' },
  { m: /\b(ultimate|ultimativ\w*|framework|blueprint|playbook|toolkit)\b/gi, stufe: 'fehler', titel: 'Verbotenes Produktwort', tipp: 'Steht auf der Verbotsliste in Schreibstil, Abschnitt Benennung.' },
  { m: /\b(master|pro)\b/gi, stufe: 'pruefen', titel: 'Wort von der Verbotsliste (Benennung)', tipp: '«Master» und «Pro» stehen auf der Verbotsliste für Namen. Als Teil eines echten Namens in Ordnung.' },
  { m: /(der zug fährt ab|wer jetzt nicht handelt|jetzt oder nie|letzte chance|bevor es zu spät ist|die zeit läuft|höchste zeit)/gi, stufe: 'fehler', titel: 'Künstliche Dringlichkeit', tipp: 'Kein Druck. Der Inhalt reicht.' },
  { m: /(hier wird es interessant|jetzt kommt der spannende teil|das beste kommt noch|und jetzt kommt('s| es| der)|aber jetzt kommt|das spannende daran)/gi, stufe: 'fehler', titel: 'Angekündigte Spannung', tipp: 'Robert: «klingt mist». Die Aussage einfach hinschreiben.' },
  { m: /(auf diesem (profil|kanal)|in diesem beitrag zeige|in diesem post|auf meinem (profil|kanal))/gi, stufe: 'fehler', titel: 'Meta-Kommentar über den Kanal', tipp: 'Klingt nach Vorlage. Weglassen.' },
  { m: /(ich freue mich|freut mich (sehr )?(zu|mit|euch)|stolz(,| darauf| zu| bin)|ich bin begeistert|geflasht|gegrinst|gänsehaut|ich liebe)/gi, stufe: 'fehler', titel: 'Aufgesetzte Begeisterung oder inszeniertes Gefühl', tipp: 'Robert würde das nie posten. Begeisterung zeigt sich im Ergebnis und in der Präzision.' },
  { m: /(was (denkt|meint) ihr|was denkst du\s*\?|eure meinung|wie seht ihr das|was ist eure erfahrung)/gi, stufe: 'fehler', titel: 'Allgemeine Schlussfrage', tipp: 'Die Frage nennt Optionen oder eine konkrete Situation: «Küche, Service oder niemand?»' },
  { m: /nicht,? weil (die|das|der) \w+ schlecht/gi, stufe: 'fehler', titel: 'In-Schutz-nehmen-Floskel', tipp: 'Ursache direkt nennen: «Der Grund ist simpel: …»' },
  { m: /in den backoffice-systemen, die ich baue/gi, stufe: 'fehler', titel: 'Die Bauer-Formel wörtlich', tipp: 'Robert: wiederholt sich ständig. Anders sagen oder ohne Selbstbezug.' },
  { m: /\b(arbeitet|arbeiten) am liebsten\b|\b(ki|system|tool|website|seite) (liebt|will|möchte|mag|wünscht)\b/gi, stufe: 'fehler', titel: 'System vermenschlicht', tipp: 'Sachlich: «ein System kann strukturierte Daten direkt verarbeiten».' },
  { m: /\b(trägt|tragen|getragen|Träger)\b/g, stufe: 'pruefen', titel: '«trägt» im übertragenen Sinn', tipp: 'Robert (28.09.2026): klingt nach KI. Direkt sagen, was ist: «sitzt auf», «steht auf», «ist drauf». Wörtlich (Kleidung) bleibt erlaubt.' },
  { m: /\b(vom|von der|von einem|von einer) \p{L}+ (zum|zur|zu einem|zu einer) \p{L}+\b/giu, stufe: 'pruefen', titel: '«Vom X zum Y»', tipp: 'Abstraktes Wortpaar, klingt nach KI. Sag konkret, was passiert, gern als Frage.' },
  { m: /\b(\p{L}+), (\p{L}+) und (\p{L}+)\b/gu, stufe: 'pruefen', titel: 'Dreier-Parallele', tipp: 'Drei Wörter in Reihe sind der klassische KI-Hinweis. Zwei reichen, oder ein Satz je Punkt.' },
  { m: /\b(könnte|könnten|eventuell|möglicherweise|vielleicht|unter umständen|man sollte erwägen)\b/gi, stufe: 'hinweis', titel: 'Mutmaßung', tipp: 'Robert sagt «Das funktioniert nicht», nicht «das könnte man verbessern».' },
  { m: /\b(wurde|wurden|wird|werden) (\p{L}+ ){0,4}ge\p{L}+(t|en)\b/gu, stufe: 'hinweis', titel: 'Passiv?', tipp: 'Wer macht es? Aktiv schreiben, wenn es jemand tut.' },
  { m: /\b(sehr|extrem|unglaublich|absolut|wirklich|total|mega|super|riesig\w*|enorm\w*)\b/gi, stufe: 'hinweis', titel: 'Verstärker', tipp: 'Meist Ballast. Der Satz ist ohne das Wort stärker.' },
  { m: /(?<=[^.!?:\n]\s)(Sie|Ihnen|Ihre[mnrs]?)\b/g, stufe: 'hinweis', titel: 'Sie-Ansprache?', tipp: 'Robert schreibt Du. Wenn «Sie» hier die Mehrzahl ist, in Ordnung.' },
  { m: /https?:\/\/\S+|www\.\S+/gi, stufe: 'hinweis', titel: 'Link im Text', tipp: 'Links im Text drosseln die Reichweite. Link in den ersten Kommentar.' },
  { m: /\b\p{Lu}{4,}\b/gu, stufe: 'hinweis', titel: 'Großbuchstaben', tipp: 'Sparsam zur Betonung, nicht zum Schreien.' }
];

const FLOSKEL_START = /^(heute (möchte|will|darf) ich|ich (möchte|will|darf) (euch|dir|heute)|wie (ihr|viele von euch) (wisst|wissen)|liebe[sr]? netzwerk|hallo zusammen|hallo liebe|spannend:|exciting news|big news|endlich (ist es|kann ich))/i;

function zaehleWoerter(s) {
  return (s.match(/\p{L}[\p{L}\p{N}'-]*/gu) || []).length;
}

/* Prüft den ganzen Text. abschnitte: [{art, text, von, bis}] mit Position im Gesamttext, hashtagsVon: Position des Hashtag-Blocks oder -1. */
function pruefeText(text, abschnitte, hashtagsVon) {
  const funde = [];
  const koerper = hashtagsVon >= 0 ? text.slice(0, hashtagsVon) : text;

  for (const r of MUSTER) {
    r.m.lastIndex = 0;
    let t;
    while ((t = r.m.exec(text)) !== null) {
      if (t[0].length === 0) { r.m.lastIndex++; continue; }
      funde.push({ stufe: r.stufe, titel: r.titel, tipp: r.tipp, von: t.index, bis: t.index + t[0].length, zitat: t[0] });
    }
  }

  /* Kurz-Sprüche aus Gegensatzpaaren: ein Satz mit höchstens fünf Wörtern und «statt», oder «Kein X, kein Y.» */
  const satzMuster = /[^.!?\n]+[.!?]+/g;
  let s;
  while ((s = satzMuster.exec(koerper)) !== null) {
    const satz = s[0].trim();
    const n = zaehleWoerter(satz);
    if (n <= 5 && (/\bstatt\b/i.test(satz) || /^kein\p{L}* \p{L}+, kein\p{L}* \p{L}+/iu.test(satz))) {
      funde.push({ stufe: 'pruefen', titel: 'Kurz-Spruch aus Gegensätzen', tipp: 'Robert: «Sowas benutzen wir niemals.» Ein normaler Satz, der sagt, was passiert.', von: s.index, bis: s.index + s[0].length, zitat: satz });
    }
    if (n > 25) {
      funde.push({ stufe: 'pruefen', titel: `Langer Satz (${n} Wörter)`, tipp: 'Kurz für die Kernaussage, lang nur für die Begründung. Hier prüfen, ob ein Punkt hilft.', von: s.index, bis: s.index + s[0].length, zitat: satz.slice(0, 60) + (satz.length > 60 ? '…' : '') });
    }
  }

  /* Absätze: länger als vier Zeilen ist Textwand. */
  const absMuster = /[^\n]+(\n[^\n]+)*/g;
  let a;
  while ((a = absMuster.exec(koerper)) !== null) {
    if (a[0].length > 320) {
      funde.push({ stufe: 'pruefen', titel: 'Langer Absatz', tipp: 'Mehr Weißraum: höchstens drei bis vier Zeilen je Absatz, im Erzählteil eine Zeile.', von: a.index, bis: a.index + a[0].length, zitat: a[0].slice(0, 60) + '…' });
    }
  }

  /* Erste Zeile: steht vor «mehr anzeigen». */
  const erste = koerper.split('\n').find(z => z.trim());
  if (erste) {
    const von = koerper.indexOf(erste);
    if (erste.length > 150) {
      funde.push({ stufe: 'hinweis', titel: `Erste Zeile hat ${erste.length} Zeichen`, tipp: 'LinkedIn schneidet nach etwa 150 Zeichen ab. Was danach kommt, sieht niemand ohne Klick.', von, bis: von + erste.length, zitat: erste.slice(0, 60) + '…' });
    }
    if (FLOSKEL_START.test(erste.trim())) {
      funde.push({ stufe: 'fehler', titel: 'Floskel-Eröffnung', tipp: 'Kein Aufwärmen. Direkt rein: Beobachtung, Zahl oder Frage.', von, bis: von + erste.length, zitat: erste.slice(0, 60) });
    }
  }

  /* Die Frage am Ende. */
  const absaetze = koerper.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const letzter = absaetze[absaetze.length - 1] || '';
  if (koerper.trim() && !letzter.includes('?')) {
    const von = koerper.lastIndexOf(letzter);
    funde.push({ stufe: 'hinweis', titel: 'Keine Frage am Ende', tipp: 'Der Beitrag endet mit einer konkreten Frage an Gastronomen. Sie ist der wichtigste Hebel für Kommentare.', von, bis: von + letzter.length, zitat: letzter.slice(0, 60) });
  }

  /* Hashtags. */
  const tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  if (tags.length > 5) {
    funde.push({ stufe: 'hinweis', titel: `${tags.length} Hashtags`, tipp: 'Zwei bis fünf, eher drei gut gewählte.', von: hashtagsVon >= 0 ? hashtagsVon : 0, bis: text.length, zitat: tags.join(' ').slice(0, 60) });
  }

  /* Länge. */
  const zeichen = text.length;
  if (zeichen > 3000) {
    funde.push({ stufe: 'fehler', titel: `${zeichen.toLocaleString('de-DE')} Zeichen`, tipp: 'LinkedIn nimmt höchstens 3.000 Zeichen.', von: 3000, bis: zeichen, zitat: '' });
  }

  const reihenfolge = { fehler: 0, pruefen: 1, hinweis: 2 };
  funde.sort((x, y) => reihenfolge[x.stufe] - reihenfolge[y.stufe] || x.von - y.von);

  let laengeText;
  if (zeichen === 0) laengeText = 'Noch kein Text.';
  else if (zeichen < 600) laengeText = 'Der kurze Beitrag: unter 600 Zeichen. Jeder Satz muss zum Ende ziehen.';
  else if (zeichen < 1400) laengeText = 'Mittlere Länge. Stärkste Länge ist 1.400 bis 1.800 Zeichen, unter 600 der kurze Beitrag.';
  else if (zeichen <= 1800) laengeText = 'Stärkste Länge: 1.400 bis 1.800 Zeichen.';
  else if (zeichen <= 3000) laengeText = 'Lang. Über 1.800 Zeichen bricht ein Teil der Leser ab, und Fertiglesen zählt.';
  else laengeText = 'Zu lang für LinkedIn.';

  return {
    funde, zeichen, woerter: zaehleWoerter(text), laengeText,
    anzahl: { fehler: funde.filter(f => f.stufe === 'fehler').length, pruefen: funde.filter(f => f.stufe === 'pruefen').length, hinweis: funde.filter(f => f.stufe === 'hinweis').length }
  };
}
