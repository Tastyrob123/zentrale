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
/* Auftritte wie in der Zentrale (Robert 19.11.2026: «dass diese geilen Effekte … auch auf allen Unterseiten zu finden sind»). Vorlage: zentrale.css
   [data-schlitz] und pult-fassungen.css (Bareiss-Reinfliegen). Für jedes Werkzeug, ohne dass es selbst etwas markiert:
   - Titel rollen Zeile für Zeile aus ihrem Schlitz (Startbild, Zwischentitel, Titel in Karten): Wörter aus WO_ZEILEN, jedes Wort ist ein Schlitz
     (überstehendes verdeckt, mit Luft für Ober- und Unterlängen), darin schiebt sich das Wort herauf. Danach ist nichts mehr beschnitten.
   - Fotos in beschnittenen Rahmen zoomen aus 1,16 zur Ruhe (eigene Eigenschaft scale, stört kein transform der Werkzeuge).
   - Karten aus bewegung.js fliegen weiter und länger herauf (Werte der Zentrale).
   Nur beim Laden und gleich nach einem Klick; was beim Tippen oder Speichern neu gezeichnet wird, steht still. prefers-reduced-motion: nichts. */
(function () {
  if (window.__woAuftritt || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.__woAuftritt = true;
  var K = 'cubic-bezier(.16,1,.3,1)', html = document.documentElement;
  var st = document.createElement('style'); st.id = 'wo-auftritt';
  st.textContent = ''
    + '@keyframes auZoom{from{scale:1.16}}'
    /* Titel: das Wort ist der Schlitz, sein Inneres rollt herauf */
    + 'html body [data-au].wo-zl,html:not(.still) body.wo-app [data-au="ruht"][data-au]{animation:none!important}'
    /* data-au="ruht": nach dem Auftritt bleibt nur das Stillhalten, damit die alten Wort-Bewegungen der Werkzeuge nicht ein zweites Mal anlaufen */
    + 'html body [data-au].wo-zl .wo-w{animation:none!important;opacity:1!important;translate:none!important;transform:none!important}'
    + 'html body [data-au=""].wo-zl .wo-w{display:inline-block;vertical-align:top;overflow:hidden;padding:.16em .12em .05em;margin:-.16em -.12em -.05em}'
    + 'html body [data-au=""].wo-zl .au-i{display:inline-block}'
    + 'html body [data-au=""].wo-zl:not(.au-da) .au-i{transform:translate3d(0,140%,0)}'
    + 'html body [data-au=""].wo-zl.au-da .au-i{transform:none;transition:transform 1.4s ' + K + ';transition-delay:calc(.12s + var(--au-i,0) * 90ms + var(--z,0) * 110ms)}'
    /* Karten aus bewegung.js: weiter und länger, wie die Bildwand der Zentrale */
    + 'html body [data-wo-bw="k"]{--wo-bw-weg:clamp(56px,5.6vw,88px)}'
    + 'html body [data-wo-bw="k"].wo-bw-da{animation-duration:1.6s!important;animation-timing-function:' + K + '!important;animation-delay:calc(var(--wo-bw-i,0) * 90ms)!important}'
    + 'html body [data-wo-bw="k"].wo-bw-da img{animation:auZoom 2.6s ' + K + ' backwards!important;animation-delay:calc(var(--wo-bw-i,0) * 90ms)!important}'
    /* Fotos: warten leicht vergrössert in ihrem Rahmen, zoomen beim Auftauchen zur Ruhe */
    + 'html body img[data-au-b]:not(.au-da){scale:1.16}'
    + 'html body img[data-au-b].au-da{scale:1;transition:scale 2.6s ' + K + ' calc(var(--au-i,0) * 90ms)}'
    + '@media (prefers-reduced-motion:reduce){html body [data-au] .au-i,html body img[data-au-b]{transform:none!important;scale:none!important;transition:none!important}}';
  document.head.appendChild(st);

  var offen = performance.now() + 2600;
  ['click', 'hashchange', 'popstate'].forEach(function (e) { addEventListener(e, function () { offen = performance.now() + 1600; }, true); });
  addEventListener('keydown', function (e) { if (e.key === 'Enter') offen = performance.now() + 1600; }, true);
  var frisch = function () { return performance.now() <= offen; };
  var NIE = 'nav, .wo-rand, .wo-kopf, .wo-leiste, body > header, body > footer, dialog, [role="dialog"], [aria-modal], svg, [contenteditable], [data-wo-zl-nie], [data-st-mini], .rdg-karte, .rdg-schild, [data-fd]';

  /* Solange die Seite noch auf Schrift und Startfoto wartet (wo-wartet), beginnt nichts: der Auftritt läuft erst, wenn man ihn sieht */
  var nachWarten = [];
  new MutationObserver(function () { if (!html.classList.contains('wo-wartet') && nachWarten.length) { var n = nachWarten; nachWarten = []; n.forEach(function (f) { f(); }); } })
    .observe(html, { attributes: true, attributeFilter: ['class'] });
  function auf(el, i) {
    var los = function () { el.style.setProperty('--au-i', i); void el.offsetWidth; el.classList.add('au-da'); setTimeout(function () { fertig(el); }, 3400); };
    if (html.classList.contains('wo-wartet')) nachWarten.push(los); else los();
  }
  var io = new IntersectionObserver(function (es) {
    var k = 0;
    es.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting) {
        io.unobserve(el);
        if (!el._auWartet && !frisch()) { fertig(el); return; }   // schon zu sehen und nicht frisch: steht still
        auf(el, Math.min(k++, 4));
      } else if (e.boundingClientRect.top > 0) el._auWartet = true;   // unter dem Rand: wartet im Schlitz bzw. vergrössert
      else { io.unobserve(el); fertig(el); }
    });
  }, { rootMargin: '0px 0px 12% 0px' });
  /* nach dem Auftritt alles zurück: die Werkzeuge haben wieder ihre eigenen Regeln (Hover-Zoom usw.) */
  function fertig(el) {
    el.classList.remove('au-da'); el.style.removeProperty('--au-i');
    if (el.tagName === 'IMG') { el.removeAttribute('data-au-b'); return; }
    el.setAttribute('data-au', 'ruht');
    /* selbst geteilte Titel bekommen ihren ursprünglichen Satz zurück, als wäre nie etwas gewesen (nur wenn das Werkzeug den Text nicht inzwischen geändert hat) */
    if (el._auRoh != null && !el.classList.contains('wo-sb__h') && el.textContent === el._auText) {
      var h0 = el.offsetHeight, geteilt = el.innerHTML, lh0 = el.style.lineHeight;
      el.innerHTML = el._auRoh; el.classList.remove('wo-zl');
      var gleich = function () { return Math.abs(el.offsetHeight - h0) <= .5; };
      if (!gleich()) {   // die geteilte Fassung hatte mehr Zeilenluft (cockpit-stand.js lesbar() an den Wörtern): dieselbe Luft am ganzen Titel
        var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight);
        if (fs >= 18 && lh && lh < fs * 1.12) el.style.lineHeight = '1.14';
      }
      if (!gleich()) { el.innerHTML = geteilt; el.classList.add('wo-zl'); el.style.lineHeight = lh0; }   // nichts darf springen: dann bleibt er geteilt
    }
    el._auRoh = null;
  }

  var ZAHL = /^[\d'’.,]+%?$/;
  function titel(h) {
    if (h.hasAttribute('data-au') || h.hasAttribute('data-wo-bw-art') || h.closest(NIE)) return;
    if (parseFloat(getComputedStyle(h).fontSize) < 19 || !h.offsetHeight) return;
    if (!h.classList.contains('wo-zl')) {
      if (h.hasAttribute('data-wo-zl') || !window.WO_ZEILEN) return;
      var roh = h.innerHTML, text = h.textContent;
      if (!WO_ZEILEN(h)) return;
      h._auRoh = roh; h._auText = text;
    }
    var ws = [].slice.call(h.querySelectorAll('.wo-w'));
    /* eine Zahl bleibt mit ihrem Wort zusammen («12 Häuser»), nie allein in einem Teil */
    ws.forEach(function (w, i) {
      var n = ws[i + 1], z = function (x) { return x.style.getPropertyValue('--z') || '0'; };
      if (!n || !w.parentNode || !ZAHL.test(w.textContent.trim()) || w.nextSibling !== n.previousSibling || z(w) !== z(n)) return;
      if (w.nextSibling && w.nextSibling.nodeType === 3 && !w.nextSibling.data.trim()) { w.appendChild(w.nextSibling); w.appendChild(document.createTextNode(n.textContent)); n.remove(); ws[i + 1] = w; }
    });
    [].forEach.call(h.querySelectorAll('.wo-w'), function (w) {
      if (w.firstElementChild && w.firstElementChild.classList.contains('au-i')) return;
      var i = document.createElement('span'); i.className = 'au-i';
      while (w.firstChild) i.appendChild(w.firstChild);
      w.appendChild(i);
    });
    h.setAttribute('data-wo-bw-nie', '');   // bewegung.js lässt ihn, er rollt hier
    h.setAttribute('data-au', ''); io.observe(h);
  }
  function rahmen(i) {
    for (var e = i.parentElement, n = 0; e && n < 4; e = e.parentElement, n++) {
      var s = getComputedStyle(e);
      if (/hidden|clip/.test(s.overflow) || s.clipPath !== 'none') return e.getBoundingClientRect().width <= i.getBoundingClientRect().width * 1.6 + 2;
    }
    return false;
  }
  function foto(i) {
    if (i.hasAttribute('data-au-b') || i.closest(NIE) || i.closest('[data-wo-bw="k"],[data-wo-bw-art="k"],[class*="schirm"]')) return;
    var b = i.getBoundingClientRect(); if (b.height < 80 || b.width < 80) return;
    var s = getComputedStyle(i);
    if (s.animationName !== 'none' || s.scale !== 'none' || s.transform !== 'none') return;   // eigene Bewegung
    if (/(^|,\s*)(all|transform|scale)\b/.test(s.transitionProperty) && s.transitionDuration.split(',').some(function (d) { return parseFloat(d) >= .6; })) return;
    if (!rahmen(i)) return;   // nur Fotos, die in einem beschnittenen Rahmen sitzen: nie über den Rand
    i.setAttribute('data-au-b', ''); io.observe(i);
  }
  function suche(wurzel) {
    if (!wurzel || wurzel.nodeType !== 1 || !frisch() || html.classList.contains('still')) return;
    var m = document.querySelector('main') || document.body;
    if (!m || !(m.contains(wurzel) || wurzel.contains(m))) return;
    var w = wurzel.contains(m) ? m : wurzel;
    if (w.matches('h1, h2, h3, .wo-zw')) titel(w);
    [].forEach.call(w.querySelectorAll('h1, h2, h3, .wo-zw'), titel);
    if (w.tagName === 'IMG') foto(w);
    [].forEach.call(w.querySelectorAll('img'), foto);
  }
  /* gleich nach dem Zeichnen, vor dem nächsten Bild: nichts steht erst da und springt dann in den Schlitz */
  new MutationObserver(function (l) {
    if (!frisch()) return;
    l.forEach(function (x) { [].forEach.call(x.addedNodes, suche); });
  }).observe(html, { childList: true, subtree: true });
  var los = function () { suche(document.body); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
  if (document.fonts) document.fonts.ready.then(function () { if (frisch()) los(); });
})();
