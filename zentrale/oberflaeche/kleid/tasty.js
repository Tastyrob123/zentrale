/* kleid/tasty.js · Hauswerte für oberflaeche.js (Tasty Studios, interne Werkzeuge; 07.11.2026, Neubau im Kleid).
   Im <head> VOR allen Stilen laden (ohne defer). Rahmen «Die Bühne»: Kopf dunkel in Nacht und Navy, Raum hell wie das Papier der Agentur-Seite.
   Paket aus der Vorlage (vorlage/culinarium-demo/werkzeuge/bureau/assets/oberflaeche/), Kleid neu. Einziger Schreiber: der Chat «neubau/00-kleid».
   Fotos aus grundlagen/marke/fotos/ (echte Bilder der Agentur-Seite), Zeichen = das T aus grundlagen/marke/logo/t.svg (unverändert kopiert),
   Schriften aus grundlagen/marke/schriften/ (dieselben Dateien wie seite/assets/fonts/).

   Einbinden in jedem Werkzeug (Reihenfolge wie in der Vorlage):
     <script src="/zentrale/zentrale/oberflaeche/kleid/tasty.js"></script>
     <link rel="stylesheet" href="/zentrale/zentrale/oberflaeche/grund.css">
     <link rel="stylesheet" href="/zentrale/zentrale/oberflaeche/rahmen-buehne.css">
     <link rel="stylesheet" href="/zentrale/zentrale/oberflaeche/kleid/tasty.css">
     <script src="/zentrale/zentrale/oberflaeche/oberflaeche.js"></script> */
(function () {
  var F = '/zentrale/grundlagen/marke/fotos/';
  window.WO_HAUS = { kurz: 'tasty', name: 'Tasty Studios', voll: 'Tasty Studios', ort: 'Hamburg', welt: 'studio', rahmen: 'buehne', anrede: 'du',
    /* Startbild: das Studio am Fenster zum Hafen (k-studio). Jedes Werkzeug darf in WO.startbild({foto: WO_HAUS.fotos.<schlüssel>}) ein anderes wählen. */
    foto: F + 'k-studio-900.webp', fotoKlein: F + 'k-studio-900.webp', fotoFarbe: '#1f213b',
    /* alle Fotos des Hauses, mit Schlüsseln; nichts erzeugt, nur die Bilder der Agentur-Seite */
    fotos: { studio: F + 'k-studio-900.webp', bildschirm: F + 'k-kn-bildschirm-900.webp', plan: F + 'k-kn-plan-900.webp', empfang: F + 'k-empfang-900.webp',
      bar: F + 'k-bar-900.webp', tafel: F + 'k-tafel-900.webp', terrasse: F + 'k-terrasse-900.webp', zimmer: F + 'k-zimmer-900.webp', aussen: F + 'k-aussen-900.webp',
      haus: F + 'haus-aussen-900.webp', anleger: F + 'fen-anleger-900.webp', faehre: F + 'fen-faehre-900.webp', speicherstadt: F + 'fen-speicherstadt-900.webp',
      auftakt: F + 'ih-auftakt-1400.webp', drucksachen: '/zentrale/werkzeuge/15-drucksachen/kachel.webp', /* kein Porträt als Kachelbild (Robert 08.11.2026: angeschnittenes Gesicht) */ },
    /* Zeichen im Ring: das T-Emblem, so wie geliefert (Logo.md: nie nachzeichnen) */
    zeichen: '/zentrale/zentrale/oberflaeche/kleid/anker-zeichen.svg', zeichenMass: 1744 / 1688, wortmarke: '/zentrale/zentrale/oberflaeche/kleid/anker/anker-weiss.png',
    /* Namen der Werkzeuge: die EINE Stelle, gleich wie in werkzeuge/<ordner>/werkzeug.json. Schlüssel = Ordner. */
    namen: { zentrale: 'Zentrale', '01-feinschliff': 'Website bearbeiten', '02-kundenliste': 'Kunden', '03-entwurf-besuche': 'Wer hat den Entwurf geöffnet',
      '04-haus-check': 'Haus-Check', '05-angebot': 'Angebot', '06-aufgaben': 'Aufgaben', '07-kunden-uebersicht': 'Kunden-Übersicht', '08-beitraege': 'Beiträge',
      '09-ki-check': 'KI-Check', '10-newsletter': 'Post aus dem Studio', '11-markenbuch': 'Markenbuch', '15-drucksachen': 'Drucksachen' },
    /* Foto je Werkzeug (Kachel in der Zentrale, Startbild des Werkzeugs, wenn es kein eigenes wählt) */
    fotoJe: { zentrale: 'studio', '01-feinschliff': 'plan', '02-kundenliste': 'empfang', '03-entwurf-besuche': 'bildschirm', '04-haus-check': 'haus',
      '05-angebot': 'tafel', '06-aufgaben': 'studio', '07-kunden-uebersicht': 'aussen', '08-beitraege': 'terrasse', '09-ki-check': 'speicherstadt',
      '10-newsletter': 'faehre', '11-markenbuch': 'bar', '15-drucksachen': 'drucksachen' },
    wege: { zentrale: '/', website: '/zentrale/seite/index.html' }
  };
  Object.keys(WO_HAUS.namen).forEach(function (k) { if (k !== 'zentrale') WO_HAUS.wege[k] = '/zentrale/werkzeuge/' + k + '/'; });
  /* Wer arbeitet gerade: die Zentrale gibt ?wer=Robert|Anna mit; allein geöffnet gilt, was zuletzt gewählt war */
  var wer = '';
  try { wer = new URLSearchParams(location.search).get('wer') || localStorage.getItem('tasty-wer') || ''; } catch (e) {}
  WO_HAUS.wer = /^(Robert|Anna)$/.test(wer) ? wer : 'Robert';
  WO_HAUS.imRahmen = window.top !== window.self;
  /* Robert 17.11.2026: jedes Werkzeug immer mit der Leiste der Zentrale an der Seite. Direkt geöffnet, öffnet es sich in der Zentrale
     (mit derselben Ansicht); ?einzeln zeigt das Werkzeug allein (Prüfskripte, Bildschirmbilder). */
  var ZENTRAL = ['13-sales-cockpit', '02-kundenliste', '04-haus-check', '09-ki-check', '14-social-cockpit', '10-newsletter', '01-feinschliff', '11-markenbuch', '12-marke-vision', '15-drucksachen'];
  var m = /^\/werkzeuge\/([^\/]+)\//.exec(location.pathname), q = location.search;
  if (!WO_HAUS.imRahmen && m && ZENTRAL.indexOf(m[1]) >= 0 && !/[?&](einzeln|rundgang)(=|&|$)/.test(q)) {
    location.replace('/?weiter=' + encodeURIComponent(location.pathname + q + location.hash) + '#' + m[1]);
  }
})();
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
if (WO_HAUS.imRahmen) document.documentElement.setAttribute('data-wo-im-rahmen', '');
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
/* Im Rahmen der Zentrale: der runde Knopf «Zentrale» im Kopf öffnet die Zentrale im ganzen Fenster, nie im Rahmen selbst */
document.addEventListener('click', function (e) {
  if (!WO_HAUS.imRahmen || !e.target.closest) return;
  var a = e.target.closest('a[href]');
  if (!a || a.getAttribute('href') !== WO_HAUS.wege.zentrale) return;
  e.preventDefault();
  try { window.top.postMessage({ tasty: 'zentrale' }, location.origin); } catch (x) { window.top.location.href = '/'; }
}, true);
/* Bewegung der Werkzeuge: bewegung.js neben oberflaeche.js, async und mit wenig Vorrang nachgeladen (wie in der Vorlage) */
(function () {
  var me = document.currentScript, s = document.createElement('script');
  s.src = (me && me.src ? new URL('../bewegung.js', me.src).href : '/zentrale/zentrale/oberflaeche/bewegung.js') + '?v=1';
  s.async = true; s.setAttribute('fetchpriority', 'low'); document.head.appendChild(s);
})();
/* Titel fliegen zeilenweise hoch (aus der Vorlage). WO_ZEILEN(el) setzt jedes Wort eines Titels in <span class="wo-w"> und schreibt die Zeile als --z daran. */
window.WO_ZEILEN = function (el) {
  if (!el || el.hasAttribute('data-wo-zl')) return !!(el && el.classList.contains('wo-zl'));
  var h0 = el.offsetHeight; if (!h0) return false;
  el.setAttribute('data-wo-zl', '');
  var w0 = Math.max(el.scrollWidth, el.clientWidth), roh = el.innerHTML, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), t, ts = [];
  while ((t = tw.nextNode())) if (/\S/.test(t.data) && !t.parentNode.closest('svg')) ts.push(t);
  if (!ts.length) return false;
  ts.forEach(function (t) {
    var f = document.createDocumentFragment();
    t.data.split(/(\s+)/).forEach(function (s) {
      if (!s) return;
      if (/^\s+$/.test(s)) { f.appendChild(document.createTextNode(s)); return; }
      var w = document.createElement('span'); w.className = 'wo-w'; w.textContent = s; f.appendChild(w);
    });
    t.parentNode.replaceChild(f, t);
  });
  if (el.offsetHeight !== h0 || el.scrollWidth > w0 + 1) { el.innerHTML = roh; return false; }
  var z = -1, oben = -1e9, halb = parseFloat(getComputedStyle(el).fontSize) * 0.5;
  el.querySelectorAll('.wo-w').forEach(function (w) { var y = w.getBoundingClientRect().top; if (y > oben + halb) { z++; oben = y; } if (z) w.style.setProperty('--z', z); });
  el.classList.add('wo-zl');
  return true;
};
/* Der Titel des Startbilds: geteilt, sobald er im Dokument steht (vor dem ersten Bild) */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('MutationObserver' in window)) return;
  var plan = 0;
  function teile() {
    plan = 0;
    document.querySelectorAll('.wo-sb__h:not([data-wo-zl])').forEach(function (h) {
      if (document.documentElement.classList.contains('still')) return;
      var a = h.getAnimations ? h.getAnimations() : [];
      if (a.some(function (x) { return (x.currentTime || 0) > 120; })) { h.setAttribute('data-wo-zl', ''); return; }
      WO_ZEILEN(h);
    });
  }
  new MutationObserver(function () { if (!plan && document.querySelector('.wo-sb__h:not([data-wo-zl])')) { plan = 1; Promise.resolve().then(teile); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
/* Erstes Bild erst, wenn Schrift und Startfoto da sind (CLAUDE.md: kein Nachladen, kein Aufblenden). Höchstens 1,2 s warten, dann in jedem Fall zeigen. */
(function () {
  var h = document.documentElement; h.classList.add('wo-wartet');
  var fertig = 0, zeige = function () { if (fertig++) return; h.classList.remove('wo-wartet'); };
  setTimeout(zeige, 1200);
  var bild = new Image(); bild.src = WO_HAUS.foto;
  var schrift = document.fonts ? document.fonts.load('600 40px Antonio').then(function () { return document.fonts.load('400 15px "Instrument Sans"'); }) : Promise.resolve();
  Promise.all([schrift, bild.decode ? bild.decode().catch(function () {}) : Promise.resolve()]).then(zeige, zeige);
})();
