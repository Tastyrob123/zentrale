/* fuehrung.js · Rundführung durch die Zentrale und ihre Werkzeuge (Robert 19.11.2026: «dass sie quasi durchgeführt wird. Was kann sie aufklappen,
   was kann sie zuklappen, was kann sie sich voranzeigen lassen … wo findet sie welche Informationen … die auch mehrere Seiten öffnet»).
   Ersetzt den Rundgang der Startseite (rundgang.js ruft ZENTRALE_FUEHRUNG auf). Start: Link mit ?rundgang (für Anna: /?wer=Anna&rundgang),
   das Schild «Rundgang» auf der Startseite oder window.rundgang().
   Ablauf je Schritt: Werkzeug in der Zentrale öffnen (ZENTRALE_API aus zentrale.js), Ansicht im Werkzeug ansteuern (#…), selbst aufklappen, was
   erklärt wird, dann Lichtkegel und Karte darauf. Kegel und Karte liegen über allem in der Zentrale, auch über dem Werkzeug-Rahmen (gleiche Herkunft).
   Texte: nur, was im Werkzeug wörtlich steht oder tut (Bezeichnungen in «»). Findet ein Schritt sein Ziel nicht, geht es zum nächsten. */
(function () {
  'use strict';
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var warte = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var api = function () { return window.ZENTRALE_API; };
  var rahmen = function () { return document.getElementById('rahmen'); };
  function sicht(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; }
  function Q(d, sel) { return [].find.call(d.querySelectorAll(sel), sicht) || null; }
  function T(d, sel, re) { return [].find.call(d.querySelectorAll(sel), function (e) { return sicht(e) && re.test((e.textContent || '').replace(/\s+/g, ' ').trim()); }) || null; }
  function auf(b) { if (b && b.getAttribute('aria-expanded') === 'false') b.click(); }
  function zu(b) { if (b && b.getAttribute('aria-expanded') === 'true') b.click(); }
  function oeffneDetails(d) { if (d && !d.open) { var s = d.querySelector('summary'); if (s) s.click(); else d.open = true; } }
  async function bis(f, ms) { var t0 = Date.now(), x; while (!(x = f()) && Date.now() - t0 < ms) await warte(120); return x; }
  function haus(d) { var b = Q(d, '.sc-fort-auf'); return b ? (b.closest('article, li, .sc-haus') || b.parentElement.parentElement) : null; }

  /* ---------- Die Stationen ---------- */
  var S = [
    /* Zentrale */
    { kap: 'Zentrale', oben: true, ziel: function (d) { return Q(d, '#titel'); }, titel: 'Willkommen, Anna',
      text: 'Dieser Rundgang öffnet nacheinander die Werkzeuge und zeigt in jedem, was sich aufklappen lässt, wo Vorschauen liegen und wo welche Information steht. «Weiter» und «Zurück» führen durch, die Pfeiltasten auch. Esc beendet den Rundgang.' },
    { kap: 'Zentrale', oben: true, ziel: function (d) { return Q(d, '#wer'); }, titel: 'Du arbeitest als Anna',
      text: 'Hier steht, wer gerade arbeitet. Über deinen Link ist schon Anna eingestellt. Jedes Werkzeug bekommt den Namen mit: Der Gruss lautet auf dich, und was du einträgst, steht mit deinem Namen da. Ein Klick auf «Robert» schaltet um.' },
    { kap: 'Zentrale', oben: true, ziel: function (d) { return Q(d, '.m-insel'); }, titel: 'Die Leiste oben',
      text: '«Werkzeuge» springt zur Übersicht aller Werkzeuge. «Suchen», auch mit ⌘K, findet ein Werkzeug über seinen Namen und öffnet es. «Website ansehen» rechts öffnet unsere Website in einem neuen Fenster.' },
    { kap: 'Zentrale', block: 'start', ziel: function (d) { return Q(d, '#w-alle .pf1') || Q(d, '#w-alle'); }, titel: 'Alle Werkzeuge',
      text: 'Zehn Werkzeuge, geordnet nach Verkaufen, Nach aussen und Marke. Die Zahl oben rechts in jeder Kachel kommt aus dem Werkzeug selbst, etwa die offenen Häuser im Sales Cockpit. Ein Klick öffnet das Werkzeug hier in der Zentrale.' },

    /* Sales Cockpit */
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', breit: true,
      tun: function () { if (!api().leisteAuf()) api().leisteKlapp(); }, warte: 900,
      ziel: function () { return Q(document, '#leiste'); }, titel: 'Die Leiste der Zentrale',
      text: 'Ist ein Werkzeug offen, steht links diese Leiste mit allen Werkzeugen. Der Pfeil oben klappt sie auf und zeigt die Namen, ein zweiter Klick klappt sie wieder zu. Der Anker ganz oben führt zurück zur Startseite der Zentrale.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', oben: true,
      tun: function () { if (api().leisteAuf()) api().leisteKlapp(); }, warte: 900,
      ziel: function (d) { return Q(d, '.sc-lage'); }, titel: 'Die Lage oben',
      text: 'Ganz oben im Cockpit: wie viele Häuser noch ohne Vertrag sind, wie viele Rückrufe heute fällig sind und was zusammenkäme, wenn alle offenen Häuser zusagen, einmalig und im Monat für Betreuung und Werkzeuge.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit',
      tun: function (d) { auf(Q(d, '.sc-lage__auf')); }, warte: 1000, max: 520,
      ziel: function (d) { return Q(d, '#sc-ann2'); }, titel: 'Aufklappen: wie die Zahlen entstehen',
      text: 'Der kleine Pfeil unter den Zahlen klappt die Rechnung dahinter auf: je Haus der Preis, aus dem sich die Summen oben ergeben. Die Preise sind vorläufig und noch mit keinem Haus besprochen. Ein zweiter Klick auf den Pfeil klappt die Rechnung wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', oben: true,
      tun: function (d) { zu(Q(d, '.sc-lage__auf')); }, warte: 800,
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Die Seitenleiste',
      text: 'Hier ist alles im Cockpit zu finden: «Unser Start» mit Vertrag und Unterlagen, die offenen Häuser nach Familien geordnet, darunter Konditionen, Antworten, «Wie es weitergeht» und die Kooperationen. Der runde Pfeil oben klappt die Leiste ein, dann hat die Seite die volle Breite.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', block: 'start',
      tun: function (d) { oeffneDetails(Q(d, 'details.sc-mb')); }, warte: 1000, max: 560,
      ziel: function (d) { return Q(d, 'details.sc-mb'); }, titel: 'Das Missionboard einer Familie',
      text: 'Aufgeklappt zeigt es die sieben Phasen von «Gefunden» bis «Kunde» und in welcher die Familie gerade steht, dazu Paketpreis, Betrag im Monat, wie viele der neun Gesprächspunkte besprochen sind und die Tage seit dem Versand. Ein Klick auf die Kopfzeile klappt es wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', block: 'start',
      tun: function (d) { auf(Q(d, '.sc-fort-auf')); }, warte: 1000, max: 620,
      ziel: function (d) { return haus(d); }, titel: 'Stand und Fortschritt je Haus',
      text: 'Unter jedem Haus klappt «Stand und Fortschritt» auf: die Phase mit dem nächsten Schritt, die Tage seit dem Versand, ob jemand den Entwurf wirklich geöffnet hat, die Preise mit «Preise ändern», der Demo-Check von Website und Werkbank und wie weit das Gespräch ist. Der Pfeil klappt es wieder zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit',
      ziel: function (d) { var h = haus(d), m = h && T(h, 'button, a', /^Mappe öffnen$/i); return m ? m.parentElement : null; }, titel: 'Mappe, Website, Werkbank',
      text: '«Mappe öffnen» führt zur Gesprächsmappe. «Website öffnen» und «Werkbank öffnen» zeigen den Entwurf und die Werkbank des Hauses in einem neuen Fenster, so wie das Haus sie sieht.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder', oben: true,
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Die Gesprächsmappe',
      text: 'Jede Familie und jedes Haus hat eine Mappe für das Gespräch. Oben öffnet «Gemeinsame Startseite» die Website als Vorschau in einem neuen Fenster, «Präsentation öffnen» die Präsentation als PDF, und «Gespräch eintragen» springt zu den Notizen ganz unten.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      tun: function (d) { auf(Q(d, '.sc-parat__auf')); }, warte: 700,
      ziel: function (d) { return Q(d, '.sc-parat'); }, titel: 'Parat im Gespräch',
      text: 'Rechts steht, was du im Gespräch griffbereit brauchst: die Ansprechpartner, die Preise und die Häuser der Familie, jedes mit einem Sprung zu seiner Mappe. Der Pfeil oben klappt die Tafel ein und wieder auf.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder',
      ziel: function (d) { var k = Q(d, '.sc-schritte__kopf'); return k ? k.parentElement : null; }, titel: 'Neun Schritte durchs Gespräch',
      text: 'Die Mappe ist in neun Schritte geteilt, von der Website bis zum nächsten Schritt. Unter jedem Schritt steht «Als besprochen abhaken». Die Leiste unten zählt mit, wie viele Punkte besprochen sind, und «Zum Gespräch» springt zu deinen Notizen.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#familie:maeder', block: 'start',
      tun: function (d) { oeffneDetails(Q(d, '.sc-fragen details.sc-frage')); }, warte: 800, max: 560,
      ziel: function (d) { return Q(d, '.sc-fragen'); }, titel: 'Fragen, die kommen',
      text: 'Die Fragen, die im Gespräch kommen können, jede mit ihrer Antwort. Das Plus klappt eine Antwort auf, ein zweiter Klick klappt sie zu.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft', oben: true,
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Unser Start',
      text: 'Die Grundlage unserer Zusammenarbeit. Oben «Vertrag ansehen», «Alle Unterlagen» und «Frage eintragen», darunter die ersten Wochen und wer welchen Teil übernimmt.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft', block: 'start',
      ziel: function (d) { return Q(d, '#ablauf-start'); }, max: 640, titel: 'Der Weg zum Kunden',
      text: 'Vom ersten Anruf bis zum Nachfassen. Die Reiter von «Tag 0» bis «Tag 30» schalten um, was an welchem Tag passiert.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#partnerschaft', block: 'start',
      tun: function (d) { oeffneDetails(Q(d, '.sc-kosten details.sc-frage')); }, warte: 800, max: 560,
      ziel: function (d) { return Q(d, '.sc-kosten'); }, titel: 'Die Kosten im Monat',
      text: 'Je Monat klappt auf, welche Werkzeuge und Dienste anfallen und was davon auf jede Person kommt.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#konditionen', oben: true,
      ziel: function (d) { return Q(d, '.wo-sb'); }, titel: 'Die Konditionen',
      text: 'Alle Preise an einem Ort: Hotels, Restaurants, nur Werkzeuge, Familienpakete, die Betreuung, Eigentum und Extras.' },
    { kap: 'Sales Cockpit', wz: '13-sales-cockpit', gehe: '#antworten', block: 'start', max: 560,
      ziel: function (d) { return Q(d, '.sc-fragen'); }, titel: 'Die Antworten',
      text: 'Alle Fragen aus den Mappen an einer Stelle, jede zum Aufklappen, dazu wo die KI arbeitet.' },

    /* Kunden */
    { kap: 'Kunden', wz: '02-kundenliste', block: 'start', max: 560,
      ziel: function (d) { return Q(d, '.cu-liste'); }, titel: 'Unsere Kunden',
      text: 'Hierher kommt ein Haus aus dem Sales Cockpit, sobald alles besprochen ist. Jede Karte zeigt die Website des Kunden im Laptop, ein Klick darauf öffnet seine Akte.' },
    { kap: 'Kunden', wz: '02-kundenliste',
      tun: function (d) { var b = Q(d, '.cu-t .kl-mini'); if (b && !T(d, 'button', /^Laufende Verträge$/i)) b.click(); }, warte: 1400,
      ziel: function (d) { var b = T(d, 'main button, main a', /^Laufende Verträge$/i); return b ? b.parentElement : null; }, titel: 'Die Akte eines Kunden',
      text: 'Oben in der Akte: «Datei ablegen», «Notiz schreiben» und «Entwurf ansehen». Die Reiter führen zu Überblick, Arbeiten, Stammdaten, laufenden Verträgen, Ablage, Rechnungen, Verlauf, Besuchen und Notizen.' },
    /* «Wer hat den Entwurf geöffnet» und «Angebot» gehören zu Kunden, laufen online aber nicht (Stand 19.11.2026): darum hier nicht im Rundgang */

    /* Haus-Check */
    { kap: 'Haus-Check', wz: '04-haus-check',
      ziel: function (d) { return Q(d, 'form.hc-pruef'); }, titel: 'Ein Haus prüfen',
      text: 'Die Adresse der Website eintragen und «Prüfen»: Bilder, Text, Marke, Bauweise, Agentur, Aktualität und wie gut KI das Haus liest, jeder Bereich mit Ampel und einem Satz, oben das Potenzial als Zahl.' },
    { kap: 'Haus-Check', wz: '04-haus-check', oben: true,
      ziel: function (d) { return T(d, '.wo-rand a, .wo-rand button', /^Kunden finden/i); }, titel: 'Kunden finden',
      text: 'In der Seitenleiste: «Kunden finden» mit den Kandidaten aus Deutschland, Österreich und der Schweiz, nach Potenzial sortiert und nach Familien, Luxushotels oder Sterneküche zu filtern. «Geprüfte Häuser» zeigt alles, was schon geprüft ist.' },

    /* Website bearbeiten */
    { kap: 'Website bearbeiten', wz: '01-feinschliff', block: 'start', max: 560,
      ziel: function (d) { return Q(d, '.ws-aufgaben'); }, titel: 'Unsere Website selbst ändern',
      text: 'Wörter ändern, Foto tauschen, Abstände und Reihenfolge, vorher und nachher vergleichen, veröffentlichen und einen früheren Stand zurückholen: Jede Karte sagt in einem Satz, wie es geht.' },
    { kap: 'Website bearbeiten', wz: '01-feinschliff', block: 'start', max: 560,
      ziel: function (d) { return Q(d, '.ws-bereiche'); }, titel: 'Bereich für Bereich',
      text: 'Jede Seite unserer Website mit ihrem Stand, etwa «wie online». Ein Klick öffnet die Seite zum Bearbeiten, unten in der Leiste stehen dann die Werkzeuge dafür.' },

    /* Social Cockpit */
    { kap: 'Social Cockpit', wz: '14-social-cockpit', oben: true,
      ziel: function (d) { return Q(d, '.wo-rand'); }, titel: 'Was nach aussen geht',
      text: '«Diese Woche», der Kalender, die Ideen, die Kanäle von LinkedIn bis Google, «Post aus dem Studio» und das Archiv. Die Zahl neben einem Eintrag zeigt, wie viel dort liegt.' },

    /* Schluss */
    { kap: 'Zum Schluss', block: 'start', ziel: function (d) { return Q(d, '#w-alle .pf1') || Q(d, '#w-alle'); }, titel: 'Das war der Rundgang',
      text: 'KI-Check, Post aus dem Studio, Markenbuch, Marke & Vision und Drucksachen öffnest du genauso über ihre Kachel. Den Rundgang startest du jederzeit wieder über deinen Link.' }
  ];

  /* ---------- Aussehen: wie der Rundgang der Werkzeuge (rundgang.js), Farben und Schrift aus dem Kleid ---------- */
  var CSS = ''
    + '.fg-kegel{position:fixed;left:0;top:0;z-index:2147483000;border-radius:16px;pointer-events:none;transition:transform .5s cubic-bezier(.16,1,.3,1),width .5s cubic-bezier(.16,1,.3,1),height .5s cubic-bezier(.16,1,.3,1);'
    + 'box-shadow:0 0 0 3px var(--wo-g2),0 0 0 9px color-mix(in srgb,var(--wo-g2) 35%,transparent),0 0 40px 10px color-mix(in srgb,var(--wo-g2) 35%,transparent),0 0 0 200vmax color-mix(in srgb,var(--wo-tief) 72%,transparent)}'
    + '.fg-sperre{position:fixed;inset:0;z-index:2147482999}'
    + '.fg-karte{position:fixed;left:0;top:0;z-index:2147483001;width:390px;max-width:calc(100vw - 32px);box-sizing:border-box;padding:22px 24px 20px;border-radius:18px;color:var(--wo-tinte);'
    + 'background:linear-gradient(180deg,var(--wo-weiss),var(--wo-blatt));box-shadow:0 1px 0 var(--wo-weiss) inset,0 0 0 1px var(--wo-linie),0 30px 60px -24px color-mix(in srgb,var(--wo-tief) 60%,transparent);'
    + 'transform:translate3d(var(--rx,0),var(--ry,0),0);transition:transform .55s cubic-bezier(.16,1,.3,1),opacity .3s}'
    + '.fg-karte.fg-laedt{opacity:.55}'
    + '.fg-karte *{box-sizing:border-box}'
    + '.fg-zier{display:flex;align-items:center;gap:10px;font:500 11px/1 var(--wo-mono);letter-spacing:.18em;text-transform:uppercase;color:var(--wo-akzent)}'
    + '.fg-zier i{flex:1;height:1px;background:linear-gradient(90deg,var(--wo-g2),transparent)}'
    + '.fg-karte h3{margin:12px 0 8px;font:700 28px/1.12 var(--wo-titel);text-transform:uppercase;letter-spacing:.015em;color:var(--wo-tinte)}'
    + '.fg-karte p{margin:0;font:15px/1.55 var(--wo-sans);color:var(--wo-leise)}'
    + '.fg-lauf{height:3px;margin-top:18px;border-radius:2px;background:var(--wo-linie);overflow:hidden}.fg-lauf b{display:block;height:100%;background:var(--wo-nacht);transition:width .5s cubic-bezier(.16,1,.3,1)}'
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
    + '@media (max-width:700px){.fg-karte{left:16px!important;right:16px;top:auto!important;bottom:16px;width:auto;--rx:0!important;--ry:0!important}.fg-karte h3{font-size:24px}}'
    + '@media (prefers-reduced-motion:reduce){.fg-kegel,.fg-karte,.fg-lauf b{transition:none}}';
  var PFEIL = '<i><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i>';

  var lauf = null;
  function starte(ab) {
    if (lauf || !api()) return;
    if (!document.getElementById('fg-css')) { var st = document.createElement('style'); st.id = 'fg-css'; st.textContent = CSS; document.head.appendChild(st); }
    var sperre = document.createElement('div'); sperre.className = 'fg-sperre';
    var kegel = document.createElement('div'); kegel.className = 'fg-kegel';
    var karte = document.createElement('div'); karte.className = 'fg-karte';
    karte.setAttribute('role', 'dialog'); karte.setAttribute('aria-modal', 'true'); karte.setAttribute('aria-label', 'Rundgang durch die Zentrale');
    document.body.append(sperre, kegel, karte);
    var nr = -1, takt = 0, ziel = null, zielDoc = document, schritt = null;
    lauf = { ende: ende };

    function rect() {
      var r = ziel.getBoundingClientRect(), x = 0, y = 0;
      if (zielDoc !== document) { var f = rahmen().getBoundingClientRect(); x = f.left; y = f.top; }
      return { left: r.left + x, top: r.top + y, right: r.right + x, bottom: r.bottom + y, width: r.width, height: r.height };
    }
    function lege() {
      if (!ziel || !ziel.isConnected) return;
      var r = rect(), pad = 8, vw = innerWidth, vh = innerHeight, s = schritt || {};
      var x = Math.max(6, r.left - pad), y = Math.max(6, r.top - pad);
      var unten = Math.min(vh - 8, r.bottom + pad, s.max ? r.top + s.max : 1e9);
      var b = Math.min(vw - 8, r.right + pad) - x, h = Math.max(30, unten - y);
      if (vw <= 700) { var kt = vh - 16 - karte.offsetHeight - 18; if (y < kt && y + h > kt) h = Math.max(40, kt - y); }
      kegel.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; kegel.style.width = b + 'px'; kegel.style.height = h + 'px';
      if (vw <= 700) return;
      var kw = karte.offsetWidth, kh = karte.offsetHeight, ab = 22, kx, ky;
      if (x + b + ab + kw <= vw - 16) { kx = x + b + ab; ky = y; }
      else if (x - ab - kw >= 16) { kx = x - ab - kw; ky = y; }
      else if (y + h + ab + kh <= vh - 16) { kx = x; ky = y + h + ab; }
      else if (y - ab - kh >= 16) { kx = x; ky = y - ab - kh; }
      else { kx = vw - kw - 28; ky = vh - kh - 28; }
      kx = Math.min(Math.max(16, kx), vw - kw - 16); ky = Math.min(Math.max(16, ky), vh - kh - 16);
      karte.style.setProperty('--rx', kx + 'px'); karte.style.setProperty('--ry', ky + 'px');
    }

    /* Handy: die Karte liegt unten, das Ziel kommt in das freie Feld darüber (wie rundgang.js handy()) */
    function handy() {
      if (innerWidth > 700 || !ziel || !ziel.isConnected) return;
      var r = rect(), oben = 84, unten = karte.getBoundingClientRect().top - 24, frei = unten - oben;
      if (frei < 80 || (r.top >= oben && r.bottom <= unten)) return;
      var dy = r.top - (r.height <= frei ? oben + (frei - r.height) / 2 : oben);
      zielDoc.defaultView.scrollBy({ top: dy, behavior: 'instant' });
    }

    /* Ort eines Schritts herstellen: Startseite der Zentrale oder Werkzeug im Rahmen, dort die Ansicht */
    async function ort(s) {
      var A = api();
      if (!s.wz) { if (A.offen()) A.zeigeStart(true); return document; }
      var r = rahmen(), haupt = s.in || s.wz;   /* in: Teil eines anderen Werkzeugs (Angebot, Wer hat geöffnet gehören zu Kunden), öffnet im selben Rahmen */
      var neu = function (tu) { var geladen = new Promise(function (res) { r.addEventListener('load', res, { once: true }); setTimeout(res, 9000); }); tu(); return geladen; };
      if (A.offen() !== haupt) await neu(function () { A.oeffne(haupt); });
      var pfad = ''; try { pfad = r.contentWindow.location.pathname; } catch (e) { }
      if (pfad.indexOf('/' + s.wz + '/') < 0) await neu(function () { var u = new URL('../' + s.wz + '/', r.contentWindow.location.href); u.search = r.contentWindow.location.search; r.src = u.href; });
      await bis(function () { var d = r.contentDocument; return d && d.readyState === 'complete' && d.querySelector('main'); }, 9000);
      var w = r.contentWindow;
      if (s.gehe !== undefined && (w.location.hash || '') !== s.gehe) { w.location.hash = s.gehe; await warte(1100); }
      try { if (!w.__fgTaste) { w.__fgTaste = true; w.addEventListener('keydown', taste, true); } } catch (e) { }
      return r.contentDocument;
    }

    async function zeige(n, rueck) {
      if (n < 0) n = 0;
      if (n >= S.length) return ende(true);
      var mein = ++takt, s = S[n];
      if (s.breit && innerWidth <= 800) return zeige(rueck ? n - 1 : n + 1, rueck);   /* die Leiste links gibt es nur am Rechner */
      karte.classList.add('fg-laedt');
      var d = await ort(s); if (mein !== takt || !lauf) return;
      if (s.tun) { try { await s.tun(d); } catch (e) { } await warte(ruhig ? 150 : (s.warte || 650)); }
      var el = await bis(function () { try { return s.ziel(d); } catch (e) { return null; } }, 7000);
      if (mein !== takt || !lauf) return;
      if (!el) return zeige(rueck ? n - 1 : n + 1, rueck);   /* Ziel fehlt (Handy, leere Ansicht): weiter */
      nr = n; schritt = s; ziel = el; zielDoc = d;
      var w = d.defaultView;
      if (s.oben) w.scrollTo({ top: 0, behavior: 'instant' });
      else el.scrollIntoView({ block: s.block || 'center', behavior: 'instant' });
      await warte(ruhig ? 60 : 420); if (mein !== takt || !lauf) return;
      var letzt = n === S.length - 1;
      karte.innerHTML = '<div class="fg-zier"><span>' + s.kap + '</span><i></i><span>' + (n + 1) + ' von ' + S.length + '</span></div>'
        + '<h3>' + s.titel + '</h3><p>' + s.text + '</p>'
        + '<div class="fg-lauf" aria-hidden="true"><b style="width:' + Math.round((n + 1) / S.length * 100) + '%"></b></div>'
        + '<div class="fg-fuss"><button type="button" class="fg-zurueck"' + (n ? '' : ' disabled') + '>Zurück</button>'
        + (letzt ? '' : '<button type="button" class="fg-zu">Beenden</button>')
        + '<button type="button" class="fg-los">' + (letzt ? 'Fertig' : 'Weiter') + PFEIL + '</button></div>';
      karte.querySelector('.fg-zurueck').onclick = function () { zeige(nr - 1, true); };
      var zuK = karte.querySelector('.fg-zu'); if (zuK) zuK.onclick = function () { ende(false); };
      karte.querySelector('.fg-los').onclick = function () { letzt ? ende(true) : zeige(nr + 1); };
      karte.classList.remove('fg-laedt');
      handy(); lege(); setTimeout(function () { handy(); lege(); }, 450);
      try { karte.querySelector('.fg-los').focus({ preventScroll: true }); } catch (e) { }
    }

    function taste(e) {
      if (!lauf) return;
      if (e.key === 'Escape') { e.preventDefault(); ende(false); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (!karte.classList.contains('fg-laedt')) nr < S.length - 1 ? zeige(nr + 1) : ende(true); }
      else if (e.key === 'ArrowLeft' && nr > 0) { e.preventDefault(); if (!karte.classList.contains('fg-laedt')) zeige(nr - 1, true); }
    }
    var zuletzt = '', wacht = setInterval(function () {
      if (!ziel || !ziel.isConnected) return; var r = rect(), k = [r.left, r.top, r.width, r.height].map(Math.round).join();
      if (k !== zuletzt) { zuletzt = k; lege(); }
    }, 120);
    function ende(fertig) {
      if (!lauf) return;
      lauf = null; takt++;
      try { localStorage.setItem('rundgang-tasty-zentrale', '1'); } catch (e) { }
      clearInterval(wacht); removeEventListener('resize', lege); document.removeEventListener('keydown', taste, true);
      sperre.remove(); kegel.remove(); karte.remove();
      if (fertig && api().offen()) api().zeigeStart();
      if (fertig) scrollTo({ top: 0, behavior: 'instant' });
    }
    addEventListener('resize', lege); document.addEventListener('keydown', taste, true);
    zeige(typeof ab === 'number' ? ab : 0);
  }
  window.ZENTRALE_FUEHRUNG = starte;
})();
