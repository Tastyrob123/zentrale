/* fuehrung.js · Rundführung durch die Zentrale und ihre Werkzeuge (Robert 19.11.2026: «dass sie quasi durchgeführt wird. Was kann sie aufklappen,
   was kann sie zuklappen, was kann sie sich voranzeigen lassen … wo findet sie welche Informationen … die auch mehrere Seiten öffnet»).
   Zweite Fassung nach Roberts Durchsicht (19.11.2026, 18:15): startet nur auf Klick (Einladung), der Lichtrahmen liegt immer genau um ganze Teile
   (zu hohe Teile: nur die ersten Stücke, die ganz in den freien Bereich passen, nie mitten durch), er wartet, bis die Seite ruhig steht, und gleitet
   dann hin; die Karte liegt nie über dem Gezeigten; beim Wechsel in ein anderes Werkzeug ist der Schirm gleichmässig abgedunkelt, nichts Altes bleibt
   stehen. Kopf- und Fussleisten der Werkzeuge bleiben frei. Erste Fassung: fuehrung.js.erste-fassung-2026-11-19.
   Start: Link mit ?rundgang (für Anna: /?wer=Anna&rundgang) zeigt die Einladung, ebenso das Schild «Rundgang» und window.rundgang().
   Texte: nur, was im Werkzeug wörtlich steht oder tut (Bezeichnungen in «»). Findet ein Schritt sein Ziel nicht, geht es zum nächsten. */
(function () {
  'use strict';
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var warte = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var api = function () { return window.ZENTRALE_API; };
  var rahmen = function () { return document.getElementById('rahmen'); };
  function sicht(e) { if (!e || !e.getBoundingClientRect) return false; var r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; }
  function Q(d, sel) { return [].find.call(d.querySelectorAll(sel), sicht) || null; }
  function T(d, sel, re) { return [].find.call(d.querySelectorAll(sel), function (e) { return sicht(e) && re.test((e.textContent || '').replace(/\s+/g, ' ').trim()); }) || null; }
  function auf(b) { if (b && b.getAttribute('aria-expanded') === 'false') b.click(); }
  function zu(b) { if (b && b.getAttribute('aria-expanded') === 'true') b.click(); }
  function oeffneDetails(d) { if (d && !d.open) { var s = d.querySelector('summary'); if (s) s.click(); else d.open = true; } }
  async function bis(f, ms) { var t0 = Date.now(), x; while (!(x = f()) && Date.now() - t0 < ms) await warte(90); return x; }
  function karteHaus(d) { var b = Q(d, '.sc-fort-auf'); return b ? b.closest('.sc-karte') : null; }
  function klappTeile(d, von, bisN) { var k = karteHaus(d), dl = k && k.querySelector('dl.sc-klapp'); return dl ? [].slice.call(dl.children, von, bisN).filter(sicht) : null; }
  function stil(a) { return (a.ownerDocument.defaultView || window).getComputedStyle(a); }

  /* ---------- Die Stationen ---------- */
  var S = [
    /* Zentrale */
    { kap: 'Zentrale', ziel: function (d) { return Q(d, '#wer'); }, titel: 'Du arbeitest als Anna',
      text: 'Hier steht, wer gerade arbeitet. Über deinen Link ist Anna schon eingestellt. Jedes Werkzeug bekommt den Namen mit: Der Gruss lautet auf dich, und was du einträgst, steht mit deinem Namen da. Ein Klick auf «Robert» schaltet um, ein Klick auf «Anna» zurück.' },
    { kap: 'Zentrale', ziel: function (d) { return Q(d, '#w-alle .pf1'); }, titel: 'Alle Werkzeuge',
      text: 'Zehn Werkzeuge, geordnet nach Verkaufen, Nach aussen und Marke. Die Zahl oben rechts in jeder Kachel kommt aus dem Werkzeug selbst, etwa die offenen Häuser im Sales Cockpit oder die Beiträge in Arbeit im Social Cockpit. Ein Klick auf eine Kachel öffnet das Werkzeug hier in der Zentrale.' },

    /* Sales Cockpit */
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start', breit: true, inZentrale: true,
      tun: function () { if (!api().leisteAuf()) api().leisteKlapp(); },
      ziel: function () { return Q(document, '#leiste'); }, titel: 'Die Leiste der Zentrale',
      text: 'Ist ein Werkzeug offen, steht links diese Leiste mit allen Werkzeugen, nach Verkaufen, Nach aussen und Marke geordnet. Der Pfeil oben klappt sie auf und zeigt die Namen, ein zweiter Klick klappt sie wieder zu. Der Anker ganz oben führt zurück zur Startseite der Zentrale, die Lupe unten öffnet die Suche.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function () { if (api().leisteAuf()) api().leisteKlapp(); },
      ziel: function (d) { return Q(d, '.sc-lage'); }, titel: 'Die Lage oben',
      text: 'Das Sales Cockpit ist für jedes Gespräch mit einem Haus, das noch kein Kunde ist. Oben steht die Lage: wie viele Häuser noch ohne Vertrag sind, wie viele Rückrufe heute fällig sind und was zusammenkäme, wenn alle offenen Häuser zusagen, einmalig und im Monat für Betreuung und Werkzeuge.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { auf(Q(d, '.sc-lage__auf')); },
      ziel: function (d) { return Q(d, '#sc-ann2'); }, titel: 'Aufklappen: wie die Zahlen entstehen',
      text: 'Der runde Pfeil unter den Zahlen klappt die Rechnung dahinter auf: je Gruppe von Häusern, welcher Preis einmalig, für die Betreuung und für die Werkzeuge angenommen ist. Die Preise sind vorläufig und noch mit keinem Haus besprochen. Ein zweiter Klick auf den Pfeil klappt die Rechnung wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { zu(Q(d, '.sc-lage__auf')); },
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Die Seitenleiste',
      text: 'Hier ist alles im Cockpit zu finden: «Unser Start» mit Vertrag und Unterlagen, die offenen Häuser nach Hotellerie, Gastronomie und Private Chef, jede Familie mit «Alle Häuser im Überblick» und ihren Häusern, darunter Konditionen, Antworten, «Wie es weitergeht» und die Kooperationen. Der runde Pfeil oben klappt die Leiste ein, dann hat die Seite die volle Breite.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { oeffneDetails(Q(d, 'details.sc-mb')); },
      ziel: function (d) { return Q(d, 'details.sc-mb'); }, titel: 'Das Missionboard einer Familie',
      text: 'Ein Klick auf die Kopfzeile öffnet es: die sieben Phasen von «Gefunden» bis «Kunde» und in welcher die Familie gerade steht, darunter Paketpreis, Betrag im Monat, wie viele der neun Gesprächspunkte besprochen sind, die Tage seit dem Versand und jedes Haus mit seinem Stand. Das Kreuz oben rechts schliesst es wieder.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { var mb = Q(d, 'details.sc-mb[open]'); if (mb) { var s = mb.querySelector('summary'); if (s) s.click(); } auf(Q(d, '.sc-fort-auf')); },
      ziel: function (d) { return klappTeile(d, 0, 3); }, titel: 'Stand und Fortschritt je Haus',
      text: 'Unter jedem Haus klappt «Stand und Fortschritt» auf. Oben: in welcher Phase das Haus steht und was als Nächstes kommt, die Tage seit dem Versand des Entwurfs von dreissig, und ob jemand den Entwurf wirklich geöffnet hat. Der Pfeil neben «Stand und Fortschritt» klappt alles wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { auf(Q(d, '.sc-fort-auf')); },
      ziel: function (d) { return klappTeile(d, 3, 6); }, titel: 'Preise, Demo-Check, Gespräch',
      text: 'Darunter die Preise des Hauses mit «Preise ändern», der Demo-Check, wie weit Website und Werkbank fertig sind, und wie viele der neun Gesprächspunkte besprochen sind. «Wo das Gespräch steht» klappt die einzelnen Punkte auf.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#start',
      tun: function (d) { auf(Q(d, '.sc-fort-auf')); },
      ziel: function (d) { var k = karteHaus(d); return k && Q(k, '.sc-wege'); }, titel: 'Mappe, Website, Werkbank',
      text: '«Mappe öffnen» führt zur Gesprächsmappe. «Website öffnen» zeigt den Entwurf der Website, «Werkbank öffnen» die Werkbank des Hauses, beide in einem neuen Fenster, genau so, wie das Haus sie sieht.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Die Gesprächsmappe',
      text: 'Jede Familie und jedes Haus hat eine Mappe, die durch das Gespräch führt. Oben öffnet «Gemeinsame Startseite» die Website als Vorschau in einem neuen Fenster, «Präsentation öffnen» die Präsentation als PDF, und «Gespräch eintragen» springt zu den Notizen ganz unten.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      tun: function (d) { auf(Q(d, '.sc-parat__auf')); },
      ziel: function (d) { return Q(d, '.sc-parat'); }, titel: 'Parat im Gespräch',
      text: 'Rechts steht, was du im Gespräch griffbereit brauchst: die Ansprechpartner, die Preise, die Häuser der Familie mit einem Sprung zu ihrer Mappe und die heutigen Seiten der Häuser. Der Pfeil oben klappt die Tafel ein und wieder auf.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      ziel: function (d) { var k = Q(d, '.sc-schritte__kopf'); return k ? k.parentElement : null; }, titel: 'Neun Schritte durchs Gespräch',
      text: 'Die Mappe ist in neun Schritte geteilt: Website, Werkzeuge, Preis, KI, Betreuung, Ablauf, Vom Haus, Fragen, Nächster Schritt. Ein Klick auf eine Nummer springt hin. Unter jedem Schritt steht «Als besprochen abhaken», die Leiste unten zählt mit, und «Zum Gespräch» springt zu deinen Notizen.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      tun: function (d) { oeffneDetails(Q(d, '.sc-fragen details.sc-frage')); },
      ziel: function (d) { return Q(d, '.sc-fragen'); }, titel: 'Fragen, die kommen',
      text: 'Die Fragen, die das Haus im Gespräch stellen kann, jede mit der Antwort, die du geben kannst: ob alle Häuser mitmachen müssen, was es im Monat kostet, was die gemeinsame Startseite ist, wer welche Website pflegt. Das Plus klappt eine Antwort auf, ein zweiter Klick klappt sie zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Unser Start',
      text: 'Wie wir die vorgebauten Häuser zu Kunden machen könnten, wie sich das Geld in den ersten Monaten aufteilen liesse und der Entwurf unseres Vertrags. «Vertrag ansehen» öffnet ihn, «Alle Unterlagen» springt zu den Dokumenten, «Frage eintragen» zu den Fragen und Ergänzungen ganz unten.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft',
      ziel: function (d) { return Q(d, '#ablauf-start'); }, titel: 'Der Weg zum Kunden',
      text: 'Jedes Haus bekommt drei Wochen und einen festen Ablauf: der Anruf, der die Präsentation ankündigt, die Präsentation per Mail, ein zweiter Anruf, das Videogespräch, das Nachfassen. Ein Klick auf einen Schritt von «Tag 0» bis «Tag 30» zeigt, was an diesem Tag passiert.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft',
      tun: function (d) { oeffneDetails(Q(d, '.sc-kosten details.sc-frage')); },
      ziel: function (d) { return Q(d, '.sc-kosten details[open]') || Q(d, '.sc-kosten'); }, titel: 'Die Kosten im Monat',
      text: 'Je Monat klappt auf, welche Werkzeuge und Dienste anfallen, mit Betrag und was davon auf jede Person kommt. Das Kreuz oben rechts klappt den Monat wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#konditionen',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Die Konditionen',
      text: 'Was eine Website mit Werkzeugen kostet, was die Betreuung enthält, was dem Haus gehört und wie es abläuft. Darunter die Preise in sechs Ebenen vom kleinen Betrieb bis zum Grandhotel, die Familienpakete, die Betreuung, Eigentum und Extras. Den Betrag für ein bestimmtes Haus findest du in seiner Mappe.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#antworten',
      tun: function (d) { oeffneDetails(Q(d, '.sc-fragen details.sc-frage')); },
      ziel: function (d) { return Q(d, '.sc-fragen'); }, titel: 'Die Antworten',
      text: 'Alle Fragen, die Häuser stellen, an einer Stelle: was es kostet, was in der Betreuung drin ist, ob die Seite ohne Betreuung läuft, wie lange es dauert, wann das Haus zahlt, wem die Website gehört. Das Plus klappt eine Antwort auf. Weiter unten steht, wo die KI arbeitet.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#weiter',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Wie es weitergeht',
      text: 'Was nach einem guten Gespräch kommt: die Korrekturen, die Betreuung im Monat, was Wartung für uns heisst und in welchem Takt wir prüfen. Die drei Knöpfe springen zu Korrekturen, Betreuung und Prüfungen.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#kooperationen',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Kooperationen',
      text: 'Partner rund um die Gastronomie, die uns Türen öffnen und Empfehlungen aussprechen könnten: wer dafür in Frage kommt, was er davon hat und wen wir zuerst ansprechen könnten. Bisher sind es Ideen, angesprochen ist noch niemand.' },

    /* Kunden */
    { kap: 'Kunden', wz: '02-kundenliste',
      ziel: function (d) { return Q(d, '.cu-liste'); }, titel: 'Unsere Kunden',
      text: 'Hierher kommt ein Haus aus dem Sales Cockpit, sobald alles besprochen ist. Jede Karte zeigt die Website des Kunden im Laptop, was als Nächstes ansteht und den Stand der Rechnungen. Darunter direkt «Öffnen», «Notiz», «Datei ablegen» und «Entwurf ansehen».' },
    { kap: 'Kunden', wz: '02-kundenliste',
      tun: function (d) { var b = Q(d, '.cu-t .kl-mini'); if (b && !T(d, 'button', /^Laufende Verträge$/i)) b.click(); },
      ziel: function (d) { var a = T(d, 'main button, main a', /^Datei ablegen$/i), b = T(d, 'main button, main a', /^Laufende Verträge$/i); return a && b ? [a.parentElement, b.parentElement] : null; }, titel: 'Die Akte eines Kunden',
      text: 'Oben in der Akte: «Datei ablegen», «Notiz schreiben», «Bearbeiten» und «Entwurf ansehen». Die Reiter darunter führen zu Überblick, Arbeiten, Stammdaten, laufenden Verträgen, Ablage, Rechnungen, Verlauf, Besuchen und Notizen. Links in der Seitenleiste stehen alle Kunden, die Personen und die Rechnungen.' },

    /* Haus-Check */
    { kap: 'Haus-Check', wz: '04-haus-check',
      ziel: function (d) { return Q(d, 'form.hc-pruef'); }, titel: 'Ein Haus prüfen',
      text: 'Die Adresse eines Hotels oder Restaurants eintragen und «Prüfen»: In einer Minute steht da, wo die Website schwach ist und ob sich das Haus als Kunde lohnt, jeder Bereich mit Ampel und einem Satz. Darunter drei Beispiele zum Ausprobieren.' },
    { kap: 'Haus-Check', wz: '04-haus-check',
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Finden, prüfen, weitergeben',
      text: '«Kunden finden» zeigt die Kandidaten aus Deutschland, Österreich und der Schweiz, nach Potenzial sortiert. «Geprüfte Häuser» sammelt alle Prüfungen, «Wo es fehlt» zeigt, was den Häusern am häufigsten fehlt. «Zur Kundenliste» gibt ein Haus weiter, «So wird geprüft» erklärt die Bewertung.' },

    /* Website bearbeiten */
    { kap: 'Website bearbeiten', wz: '01-feinschliff',
      ziel: function (d) { return Q(d, '.ws-aufgaben'); }, titel: 'Unsere Website selbst ändern',
      text: 'Wörter ändern, Foto tauschen, Abstände und Reihenfolge, vorher und nachher vergleichen, veröffentlichen und einen früheren Stand zurückholen: Jede Karte sagt in einem Satz, wie es geht, ein Klick öffnet die Seite dafür.' },
    { kap: 'Website bearbeiten', wz: '01-feinschliff',
      ziel: function (d) { return Q(d, '.ws-bereiche'); }, titel: 'Bereich für Bereich',
      text: 'Jede Seite unserer Website mit ihrem Stand, etwa «wie online», wenn nichts geändert ist. Ein Klick öffnet die Seite zum Bearbeiten, unten in der Leiste stehen dann die Werkzeuge dafür.' },
    { kap: 'Website bearbeiten', wz: '01-feinschliff',
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Wünsche und Veröffentlichen',
      text: 'Unter «Besprechen» hinterlässt du bei «Wünsche» einen Wunsch an Robert, wenn etwas grösser umgebaut werden soll. Unter «Veröffentlichen»: der Entwurf, «Vorher & nachher» zum Vergleichen, der Verlauf aller Veröffentlichungen und «Ziel & Prüfung».' },

    /* Social Cockpit */
    { kap: 'Social Cockpit', wz: '14-social-cockpit',
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Was nach aussen geht',
      text: 'Der Rhythmus steht oben: Montag LinkedIn, Mittwoch und Freitag Instagram. Jeder Beitrag wird hier geschrieben und geprüft, gepostet wird in der App des Kanals. «Zum Kalender» zeigt die nächsten Wochen, «Neuer Beitrag» beginnt einen.' },
    { kap: 'Social Cockpit', wz: '14-social-cockpit',
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Kanäle und Archiv',
      text: '«Diese Woche», der Kalender und die Ideen, darunter jeder Kanal von LinkedIn bis Google, «Post aus dem Studio» und das Archiv. Die Zahl neben einem Eintrag zeigt, wie viel dort liegt.' },

    /* Schluss */
    { kap: 'Zum Schluss', ziel: function (d) { return Q(d, '#w-alle .pf1'); }, titel: 'Das war der Rundgang',
      text: 'KI-Check, Post aus dem Studio, Markenbuch, Marke & Vision und Drucksachen öffnest du genauso über ihre Kachel. Den Rundgang startest du jederzeit wieder über deinen Link.' }
  ];

  /* ---------- Aussehen: Farben und Schrift aus dem Kleid ---------- */
  var K = 'cubic-bezier(.16,1,.3,1)';
  var CSS = ''
    + '.fg-kegel{position:fixed;left:0;top:0;z-index:2147483000;border-radius:18px;pointer-events:none;opacity:0;'
    + 'box-shadow:0 0 0 2px var(--wo-g2),0 0 0 8px color-mix(in srgb,var(--wo-g2) 30%,transparent),0 0 36px 8px color-mix(in srgb,var(--wo-g2) 30%,transparent),0 0 0 200vmax color-mix(in srgb,var(--wo-tief) 70%,transparent);'
    + 'transition:opacity .35s ease}'
    + '.fg-kegel.an{opacity:1}'
    + '.fg-kegel.gleit{transition:opacity .35s ease,transform .7s ' + K + ',width .7s ' + K + ',height .7s ' + K + '}'
    + '.fg-kegel.leer{box-shadow:0 0 0 200vmax color-mix(in srgb,var(--wo-tief) 70%,transparent)}'
    + '.fg-sperre{position:fixed;inset:0;z-index:2147482999}'
    + '.fg-hinweis{position:fixed;left:50%;top:50%;z-index:2147483001;transform:translate(-50%,-50%);font:500 12px/1 var(--wo-mono);letter-spacing:.2em;text-transform:uppercase;color:#f4ece2;opacity:0;transition:opacity .3s ease;pointer-events:none}'
    + '.fg-hinweis.an{opacity:.85}'
    + '.fg-karte{position:fixed;left:0;top:0;z-index:2147483001;width:var(--kw,390px);max-width:calc(100vw - 32px);box-sizing:border-box;padding:22px 24px 20px;border-radius:18px;color:var(--wo-tinte);'
    + 'background:linear-gradient(180deg,var(--wo-weiss),var(--wo-blatt));box-shadow:0 1px 0 var(--wo-weiss) inset,0 0 0 1px var(--wo-linie),0 30px 60px -24px color-mix(in srgb,var(--wo-tief) 60%,transparent);'
    + 'transform:translate3d(var(--rx,0),var(--ry,0),0);opacity:0;visibility:hidden;transition:opacity .3s ease,visibility 0s .3s}'
    + '.fg-karte.an{opacity:1;visibility:visible;transition:opacity .35s ease,visibility 0s}'
    + '.fg-karte *{box-sizing:border-box}'
    + '.fg-zier{display:flex;align-items:center;gap:10px;font:500 11px/1 var(--wo-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--wo-akzent)}'
    + '.fg-zier i{flex:1;height:1px;background:linear-gradient(90deg,var(--wo-g2),transparent)}'
    + '.fg-karte h3,.fg-einladung h3{margin:12px 0 8px;font:700 28px/1.12 var(--wo-titel);text-transform:uppercase;letter-spacing:.015em;color:var(--wo-tinte)}'
    + '.fg-karte p,.fg-einladung p{margin:0;font:15px/1.55 var(--wo-sans);color:var(--wo-leise)}'
    + '.fg-lauf{height:3px;margin-top:18px;border-radius:2px;background:var(--wo-linie);overflow:hidden}.fg-lauf b{display:block;height:100%;background:var(--wo-nacht)}'
    + '.fg-fuss{display:flex;align-items:center;gap:14px;margin-top:16px}'
    + '.fg-fuss .fg-zu,.fg-fuss .fg-zurueck{flex:none;margin:0;border:0;background:none;padding:6px 2px;font:500 11px/1 var(--wo-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--wo-akzent);cursor:pointer}'
    + '.fg-fuss .fg-zu:hover,.fg-fuss .fg-zurueck:hover{color:var(--wo-tinte)}'
    + '.fg-fuss .fg-zurueck[disabled]{visibility:hidden}'
    + '.fg-fuss .fg-los{margin:0 0 0 auto;display:inline-flex;align-items:center;gap:12px;height:42px;padding:0 6px 0 18px;border:0;border-radius:999px;cursor:pointer;font:500 11px/1 var(--wo-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--wo-weiss);'
    + 'background:linear-gradient(180deg,var(--wo-nacht2),var(--wo-nacht) 55%,var(--wo-tief));box-shadow:0 1px 0 color-mix(in srgb,var(--wo-weiss) 18%,transparent) inset,0 10px 18px -10px color-mix(in srgb,var(--wo-tief) 80%,transparent)}'
    + '.fg-fuss .fg-los i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(180deg,var(--wo-g1),var(--wo-g2) 55%,var(--wo-g3));transition:transform .2s}'
    + '.fg-fuss .fg-los:hover i{transform:translateX(2px)}'
    + '.fg-fuss .fg-los svg{width:14px;height:14px;fill:none;stroke:var(--wo-tief);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
    + '.fg-fuss button:focus-visible{outline:2px solid var(--wo-nacht);outline-offset:3px}'
    /* Einladung: unten in der Mitte, ohne Abdunkeln */
    + '.fg-einladung{position:fixed;left:50%;bottom:28px;z-index:2147483001;width:min(560px,calc(100vw - 32px));box-sizing:border-box;padding:22px 24px 20px;border-radius:18px;color:var(--wo-tinte);'
    + 'background:linear-gradient(180deg,var(--wo-weiss),var(--wo-blatt));box-shadow:0 1px 0 var(--wo-weiss) inset,0 0 0 1px var(--wo-linie),0 30px 60px -24px color-mix(in srgb,var(--wo-tief) 70%,transparent);'
    + 'transform:translate3d(-50%,0,0);animation:fgEin .7s ' + K + ' both}'
    + '@keyframes fgEin{from{transform:translate3d(-50%,40px,0);opacity:0}}'
    + '.fg-einladung.weg{animation:none;transition:transform .4s ease,opacity .4s ease;transform:translate3d(-50%,30px,0);opacity:0}'
    + '@media (max-width:700px){.fg-karte{left:16px!important;right:16px;top:auto!important;bottom:16px;width:auto;--rx:0!important;--ry:0!important}.fg-karte h3,.fg-einladung h3{font-size:24px}.fg-einladung{bottom:16px}}'
    + '@media (prefers-reduced-motion:reduce){.fg-kegel,.fg-karte,.fg-einladung{transition:none!important;animation:none!important}}';
  var PFEIL = '<i><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i>';
  function css() { if (!document.getElementById('fg-css')) { var st = document.createElement('style'); st.id = 'fg-css'; st.textContent = CSS; document.head.appendChild(st); } }
  function wer() { var b = document.querySelector('#wer [aria-pressed="true"]'); return b ? b.textContent.trim() : ''; }

  /* ---------- Einladung: der Rundgang beginnt erst auf Klick ---------- */
  function einladen() {
    if (lauf || document.querySelector('.fg-einladung') || !api()) return;
    css();
    var e = document.createElement('div'); e.className = 'fg-einladung'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-label', 'Rundgang durch die Zentrale');
    e.innerHTML = '<div class="fg-zier"><span>Rundgang</span><i></i><span>' + S.length + ' Stationen</span></div>'
      + '<h3>Willkommen, ' + (wer() || 'Anna') + '</h3><p>Der Rundgang öffnet nacheinander die Werkzeuge und zeigt in jedem, was sich aufklappen lässt, wo Vorschauen liegen und wo welche Information steht. «Weiter» und «Zurück» führen durch, die Pfeiltasten auch, Esc beendet ihn.</p>'
      + '<div class="fg-fuss"><button type="button" class="fg-zu">Später</button><button type="button" class="fg-los">Rundgang starten' + PFEIL + '</button></div>';
    document.body.appendChild(e);
    var weg = function (dann) { e.classList.add('weg'); setTimeout(function () { e.remove(); if (dann) dann(); }, 380); };
    e.querySelector('.fg-zu').onclick = function () { weg(); };
    e.querySelector('.fg-los').onclick = function () { weg(function () { starte(0); }); };
  }

  var lauf = null;
  function starte(ab) {
    if (lauf || !api()) return;
    css();
    var sperre = document.createElement('div'); sperre.className = 'fg-sperre';
    var kegel = document.createElement('div'); kegel.className = 'fg-kegel leer';
    var hinweis = document.createElement('div'); hinweis.className = 'fg-hinweis';
    var karte = document.createElement('div'); karte.className = 'fg-karte';
    karte.setAttribute('role', 'dialog'); karte.setAttribute('aria-modal', 'true'); karte.setAttribute('aria-label', 'Rundgang durch die Zentrale');
    document.body.append(sperre, kegel, hinweis, karte);
    var nr = -1, takt = 0, teile = null, zielDoc = document, laedt = false, stillBis = 0, zuletzt = '';
    lauf = { ende: ende };
    var mitte = function () { return { left: innerWidth / 2, top: innerHeight / 2, right: innerWidth / 2, bottom: innerHeight / 2 }; };
    setzeKegel(mitte(), false);
    requestAnimationFrame(function () { kegel.classList.add('an'); });

    /* nur der sichtbare Teil: in einem Rahmen mit eigenem Rollbalken zählt, was darin zu sehen ist */
    function sichtbarerTeil(e) {
      var r = e.getBoundingClientRect(), l = r.left, t = r.top, rt = r.right, bt = r.bottom;
      for (var a = e.parentElement; a && a.nodeType === 1 && a !== a.ownerDocument.body && a !== a.ownerDocument.documentElement; a = a.parentElement) {
        var s = stil(a); if (!/(auto|scroll|hidden|clip)/.test(s.overflowY + s.overflowX)) continue;
        var q = a.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rt = Math.min(rt, q.right); bt = Math.min(bt, q.bottom);
      }
      return rt - l > 0 && bt - t > 0 ? { left: l, top: t, right: rt, bottom: bt, width: rt - l, height: bt - t } : null;
    }
    function versatz() { if (zielDoc === document) return [0, 0]; var f = rahmen().getBoundingClientRect(); return [f.left, f.top]; }
    function vereint(liste) {
      var o = versatz(), r = null;
      (liste || []).forEach(function (e) { if (!e || !e.isConnected) return; var b = sichtbarerTeil(e); if (!b || (b.width < 1 && b.height < 1)) return;
        r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) } : { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; });
      return r ? { left: r.left + o[0], top: r.top + o[1], right: r.right + o[0], bottom: r.bottom + o[1], grenze: liste && liste.grenze && sichtbarerTeil(liste.grenze) ? sichtbarerTeil(liste.grenze).top + o[1] : null } : null;
    }
    /* Freier Bereich: unter der Kopfleiste, über der Fussleiste des Werkzeugs (in Koordinaten der Zentrale) */
    function frei() {
      var o = versatz(), oben = 16, unten = innerHeight - 16;
      if (zielDoc !== document) {
        var k = zielDoc.querySelector('header.wo-kopf'), l = zielDoc.querySelector('.wo-leiste');
        if (k) oben = Math.max(oben, k.getBoundingClientRect().bottom + o[1] + 18);
        if (l) { var lr = l.getBoundingClientRect(); if (lr.height > 10 && lr.top > 200) unten = Math.min(unten, lr.top + o[1] - 18); }
      } else if (!api().offen()) {
        var kopf = document.querySelector('#kopf'); if (kopf) { var kb = kopf.getBoundingClientRect(); if (kb.height > 10) oben = Math.max(oben, kb.bottom + 14); }
      }
      return { oben: oben, unten: unten };
    }
    function fest(e) { for (var a = e; a && a.nodeType === 1; a = a.parentElement) { if (stil(a).position === 'fixed') return true; } return false; }
    /* Zu hohe Teile: nur die ersten Stücke, die ganz hineinpassen (nie mitten durch ein Stück) */
    function kinder(e) {
      var k = [];
      [].forEach.call(e.children, function (c) { var s = stil(c); if (s.display === 'contents') k = k.concat(kinder(c)); else if (sicht(c) && s.position !== 'absolute' && s.position !== 'fixed') k.push(c); });
      k.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      if (k.length === 1) { var tiefer = kinder(k[0]); if (tiefer.length > 1) return tiefer; }
      return k;
    }
    function fuelle(acc, stueck, maxH, tiefe) {
      var innen = kinder(stueck);
      for (var j = 0; j < innen.length; j++) {
        var t = acc.concat([innen[j]]), u = vereint(t);
        if (u && u.bottom - u.top <= maxH) { acc = t; continue; }
        var weiter = tiefe < 3 ? fuelle(acc, innen[j], maxH, tiefe + 1) : acc;
        if (!weiter.grenze) weiter.grenze = innen[j];
        return weiter;
      }
      return acc;
    }
    function passe(liste, maxH) {
      var r = vereint(liste); if (!r || r.bottom - r.top <= maxH) return liste;
      var stuecke = liste.length > 1 ? liste : kinder(liste[0]);
      if (!stuecke.length) return liste;
      var acc = [];
      for (var i = 0; i < stuecke.length; i++) {
        var test = acc.concat([stuecke[i]]), u = vereint(test);
        if (u && u.bottom - u.top <= maxH) { acc = test; continue; }
        /* das nächste Stück passt nicht mehr ganz: von ihm die ersten Teile dazu, die noch hineinpassen, bis drei Ebenen tief */
        acc = fuelle(acc, stuecke[i], maxH, 0);
        if (!acc.grenze) acc.grenze = stuecke[i];
        break;
      }
      return acc.length ? acc : (stuecke[0] !== liste[0] ? passe([stuecke[0]], maxH) : liste);
    }

    function setzeKegel(r, gleit) {
      var pad = 10, unten = pad;
      if (r.grenze != null && r.grenze > r.bottom - 1) unten = Math.max(2, Math.min(pad, (r.grenze - r.bottom) / 2));   /* das nächste, nicht gezeigte Stück bleibt ganz im Dunkeln */
      kegel.classList.toggle('gleit', !!gleit);
      kegel.style.transform = 'translate3d(' + Math.round(r.left - pad) + 'px,' + Math.round(r.top - pad) + 'px,0)';
      kegel.style.width = Math.max(0, Math.round(r.right - r.left + pad * 2)) + 'px'; kegel.style.height = Math.max(0, Math.round(r.bottom - r.top + pad + unten)) + 'px';
    }
    /* Karte nie über dem Gezeigten: rechts, links (auch schmaler), darunter, darüber. false = passt nirgends */
    function setzeKarte(r) {
      var vw = innerWidth, vh = innerHeight, ab = 26, pad = 10, R = { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad };
      if (vw <= 700) return true;
      var platzR = vw - R.right - ab - 16, platzL = R.left - ab - 16, w, kx, ky, kh;
      var hoehe = function (wd) { karte.style.setProperty('--kw', wd + 'px'); return karte.offsetHeight; };
      if (platzR >= 330) { w = Math.min(400, platzR); kh = hoehe(w); kx = R.right + ab; ky = R.top; }
      else if (platzL >= 330) { w = Math.min(400, platzL); kh = hoehe(w); kx = R.left - ab - w; ky = R.top; }
      else {
        w = 400; kh = hoehe(w);
        if (vh - R.bottom - ab - 16 >= kh) { kx = R.left; ky = R.bottom + ab; }
        else if (R.top - ab - 16 >= kh) { kx = R.left; ky = R.top - ab - kh; }
        else return false;
        kx = Math.min(Math.max(16, kx), vw - w - 16);
      }
      ky = Math.min(Math.max(16, ky), vh - kh - 16);
      karte.style.setProperty('--rx', Math.round(kx) + 'px'); karte.style.setProperty('--ry', Math.round(ky) + 'px');
      return true;
    }

    /* Wechsel: Karte weg, Kegel zieht sich zusammen, der Schirm ist gleichmässig dunkel, in der Mitte steht, was sich öffnet */
    function dunkel(name) {
      laedt = true; teile = null;
      karte.classList.remove('an');
      setzeKegel(mitte(), !ruhig);
      kegel.classList.add('leer');
      hinweis.textContent = name + ' öffnet'; hinweis.classList.add('an');
    }
    /* Ort eines Schritts herstellen: Startseite der Zentrale oder Werkzeug im Rahmen, dort die Ansicht */
    async function ort(s) {
      var A = api();
      if (!s.wz) { if (A.offen()) { A.zeigeStart(true); await warte(250); } return document; }
      var r = rahmen();
      if (A.offen() !== s.wz) {
        var geladen = new Promise(function (res) { r.addEventListener('load', res, { once: true }); setTimeout(res, 9000); });
        A.oeffne(s.wz); await geladen;
      }
      await bis(function () { var d = r.contentDocument; return d && d.readyState === 'complete' && d.querySelector('main'); }, 9000);
      var w = r.contentWindow;
      if (s.gehe !== undefined && (w.location.hash || '') !== s.gehe) { w.location.hash = s.gehe; await warte(200); }
      try { if (!w.__fgTaste) { w.__fgTaste = true; w.addEventListener('keydown', taste, true); } } catch (e) { }
      return r.contentDocument;
    }
    /* Ruhig: das Gezeigte bewegt sich nicht mehr (drei Messungen gleich, keine laufende Bewegung darin), höchstens 2,2 s */
    async function ruhigBis(liste, d) {
      var t0 = Date.now(), alt = '', gleich = 0;
      while (Date.now() - t0 < 2200) {
        var r = vereint(liste), k = r ? [r.left, r.top, r.right, r.bottom].map(Math.round).join() : '', lauft = false;
        try { lauft = (d.getAnimations ? d.getAnimations() : []).some(function (a) {
          if (a.playState !== 'running') return false; var t = a.effect && a.effect.target; if (!t || t.tagName === 'IMG') return false;
          if (!isFinite(a.effect.getComputedTiming().endTime)) return false;
          return liste.some(function (e) { return e.contains(t) || t.contains(e); });
        }); } catch (e) { }
        gleich = (k === alt && !lauft) ? gleich + 1 : 0; alt = k;
        if (gleich >= 3) return;
        await warte(80);
      }
    }

    async function zeige(n, rueck) {
      if (n < 0) n = 0;
      if (n >= S.length) return ende(true);
      var mein = ++takt, s = S[n];
      if (s.breit && innerWidth <= 800) return zeige(rueck ? n - 1 : n + 1, rueck);   /* die Leiste links gibt es nur am Rechner */
      stillBis = Infinity; zuletzt = '';
      var vorher = nr >= 0 ? S[nr] : null, gleicheSeite = vorher && vorher.wz === s.wz && vorher.gehe === s.gehe;
      if (vorher && !gleicheSeite) dunkel(s.wz ? s.kap : 'Zentrale');
      else { laedt = true; karte.classList.remove('an'); }
      var d = await ort(s); if (mein !== takt || !lauf) return;
      if (s.inZentrale) d = document;   /* das Gezeigte gehört zur Zentrale selbst (Leiste), nicht zum Werkzeug */
      zielDoc = d;
      if (s.tun) { try { await s.tun(d); } catch (e) { } await warte(ruhig ? 60 : 160); }
      var roh = await bis(function () { try { var z = s.ziel(d); return z && (!Array.isArray(z) ? (sicht(z) ? [z] : null) : (z.length ? z : null)); } catch (e) { return null; } }, 7000);
      if (mein !== takt || !lauf) return;
      if (!roh) return zeige(rueck ? n - 1 : n + 1, rueck);   /* Ziel fehlt (Handy, leere Ansicht): weiter */
      await ruhigBis(roh, d); if (mein !== takt || !lauf) return;
      var f = frei(), maxH = f.unten - f.oben, liste = passe(roh, maxH);
      /* ins Bild holen: oben unter die Kopfleiste, kleine Stücke mittig im freien Bereich */
      /* bis zu vier Runden: verschiebt sich die Seite nach dem Rollen noch (Bilder, Auftritte), wird nachgerollt; liegt eine mitlaufende Leiste
         des Werkzeugs (z. B. die Gesprächsschritte) über dem Anfang, beginnt der freie Bereich unter ihr */
      for (var runde = 0; runde < 4 && !fest(liste[0]); runde++) {
        var r0 = vereint(liste); if (!r0) break;
        var hoch = r0.bottom - r0.top, soll = hoch < maxH * .7 ? f.oben + (maxH - hoch) / 2 : f.oben;
        if (Math.abs(r0.top - soll) > 3) { d.defaultView.scrollBy({ top: r0.top - soll, behavior: 'instant' }); await ruhigBis(liste, d); if (mein !== takt || !lauf) return; r0 = vereint(liste); }
        var deckt = d !== document && r0 ? decke(d, liste, r0) : 0;
        if (deckt > f.oben + 2) { f.oben = deckt; maxH = f.unten - f.oben; liste = passe(roh, maxH); continue; }
        if (r0 && Math.abs(r0.top - soll) <= 3) break;
      }
      /* nach dem Rollen ist alles geladen (Bilder, Zeichen): ist das Gezeigte jetzt höher als der freie Bereich, wird neu gekürzt */
      var rn = vereint(liste); if (rn && rn.bottom - rn.top > maxH + 1) { liste = passe(roh, maxH); rn = vereint(liste);
        if (rn && !fest(liste[0]) && Math.abs(rn.top - f.oben) > 3) { d.defaultView.scrollBy({ top: rn.top - f.oben, behavior: 'instant' }); await ruhigBis(liste, d); if (mein !== takt || !lauf) return; } }
      nr = n;
      var letzt = n === S.length - 1;
      karte.innerHTML = '<div class="fg-zier"><span>' + s.kap + '</span><i></i><span>' + (n + 1) + ' von ' + S.length + '</span></div>'
        + '<h3>' + s.titel + '</h3><p>' + s.text + '</p>'
        + '<div class="fg-lauf" aria-hidden="true"><b style="width:' + Math.round((n + 1) / S.length * 100) + '%"></b></div>'
        + '<div class="fg-fuss"><button type="button" class="fg-zurueck"' + (n ? '' : ' disabled') + '>Zurück</button>'
        + (letzt ? '' : '<button type="button" class="fg-zu">Beenden</button>')
        + '<button type="button" class="fg-los">' + (letzt ? 'Fertig' : 'Weiter') + PFEIL + '</button></div>';
      karte.querySelector('.fg-zurueck').onclick = function () { if (!laedt) zeige(nr - 1, true); };
      var zuK = karte.querySelector('.fg-zu'); if (zuK) zuK.onclick = function () { ende(false); };
      karte.querySelector('.fg-los').onclick = function () { if (!laedt) { if (letzt) ende(true); else zeige(nr + 1); } };
      var r = vereint(liste);
      if (!r) return zeige(rueck ? n - 1 : n + 1, rueck);
      /* Passt die Karte nirgends daneben, wird das Gezeigte kürzer (ganze Stücke), bis sie darunter Platz hat */
      if (innerWidth > 700 && !setzeKarte(r)) {
        var kh = karte.offsetHeight + 26 + 16, kurz = passe(liste.length > 1 ? liste : (kinder(liste[0]).length ? kinder(liste[0]) : liste), Math.max(140, maxH - kh));
        liste = kurz; r = vereint(liste);
        if (!setzeKarte(r)) { karte.style.setProperty('--rx', (innerWidth - karte.offsetWidth - 24) + 'px'); karte.style.setProperty('--ry', (innerHeight - karte.offsetHeight - 24) + 'px'); }
      }
      if (innerWidth <= 700) {   /* Handy: die Karte liegt unten, das Gezeigte muss ganz in den Platz darüber passen */
        var mh = Math.max(80, innerHeight - 16 - karte.offsetHeight - 22 - f.oben);
        liste = passe(roh, mh); handy(liste); await ruhigBis(liste, d); if (mein !== takt || !lauf) return;
      }
      r = vereint(liste); teile = liste;
      if (window.FG_PRUEF) console.log('FG', JSON.stringify({ n: n, oben: f.oben, unten: f.unten, maxH: maxH, r: r && [Math.round(r.top), Math.round(r.bottom)], teile: liste.map(function (e) { return e.tagName + '.' + String(e.className).split(' ')[0]; }) }));
      kegel.classList.remove('leer'); hinweis.classList.remove('an');
      setzeKegel(r, !ruhig); setzeKarte(r);
      laedt = false;
      stillBis = Date.now() + 800;
      setTimeout(function () { if (mein === takt && lauf) karte.classList.add('an'); }, ruhig ? 0 : 420);
      try { karte.querySelector('.fg-los').focus({ preventScroll: true }); } catch (e) { }
    }
    /* Liegt eine mitlaufende Leiste über dem Anfang des Gezeigten? Dann deren Unterkante (in Koordinaten der Zentrale), sonst 0 */
    function decke(d, liste, r) {
      var o = versatz(), x = (r.left + r.right) / 2 - o[0], y = r.top - o[1] + 6, e;
      try { e = d.elementFromPoint(x, y); } catch (er) { return 0; }
      if (!e || liste.some(function (t) { return t.contains(e) || e.contains(t); })) return 0;
      for (var a = e; a && a !== d.body; a = a.parentElement) { var p = stil(a).position; if (p === 'sticky' || p === 'fixed') return a.getBoundingClientRect().bottom + o[1] + 14; }
      return 0;
    }
    /* Handy: die Karte liegt unten, das Gezeigte kommt in das freie Feld darüber */
    function handy(liste) {
      var r = vereint(liste); if (!r || fest(liste[0])) return;
      var oben = frei().oben, unten = innerHeight - 16 - karte.offsetHeight - 24, platz = unten - oben, h = r.bottom - r.top;
      if (platz < 80 || (r.top >= oben && r.bottom <= unten)) return;
      zielDoc.defaultView.scrollBy({ top: r.top - (h <= platz ? oben + (platz - h) / 2 : oben), behavior: 'instant' });
    }

    function taste(e) {
      if (!lauf) return;
      if (e.key === 'Escape') { e.preventDefault(); ende(false); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (!laedt && nr >= 0) { if (nr < S.length - 1) zeige(nr + 1); else ende(true); } }
      else if (e.key === 'ArrowLeft' && nr > 0) { e.preventDefault(); if (!laedt) zeige(nr - 1, true); }
    }
    /* Folgt dem Gezeigten ohne Verzögerung, wenn es sich danach noch bewegt (Bilder laden, Leiste fährt) */
    var wacht = setInterval(function () {
      if (laedt || !teile || Date.now() < stillBis) return;
      var r = vereint(teile); if (!r) return; var k = [r.left, r.top, r.right, r.bottom].map(Math.round).join();
      if (zuletzt && k !== zuletzt) { setzeKegel(r, false); setzeKarte(r); }
      zuletzt = k;
    }, 100);
    function neuLegen() { if (teile && !laedt) { var r = vereint(teile); if (r) { setzeKegel(r, false); setzeKarte(r); } } }
    function ende(fertig) {
      if (!lauf) return;
      lauf = null; takt++;
      try { localStorage.setItem('rundgang-tasty-zentrale', '1'); } catch (e) { }
      clearInterval(wacht); removeEventListener('resize', neuLegen); document.removeEventListener('keydown', taste, true);
      karte.classList.remove('an'); kegel.classList.remove('an'); hinweis.classList.remove('an');
      setTimeout(function () { sperre.remove(); kegel.remove(); karte.remove(); hinweis.remove(); }, 400);
      if (fertig && api().offen()) api().zeigeStart();
      if (fertig) scrollTo({ top: 0, behavior: 'instant' });
    }
    addEventListener('resize', neuLegen); document.addEventListener('keydown', taste, true);
    zeige(typeof ab === 'number' ? ab : 0);
  }
  /* rundgang.js (Link mit ?rundgang, Schild «Rundgang») ruft das hier auf: immer zuerst die Einladung; eine Zahl startet direkt bei dieser Station */
  window.ZENTRALE_FUEHRUNG = function (ab) { if (typeof ab === 'number') starte(ab); else einladen(); };
})();
