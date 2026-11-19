/* pult-fassungen.js · «Alle Werkzeuge» als Bildwand (Robert 13.11.2026 gewählt: Fassung 1 von 10).
   Neun Fotos fugenlos im Raster, Name, Zweck und Zahl darauf, ein Klick öffnet das Werkzeug.
   Die übrigen neun Fassungen liegen in pult-fassungen.js.alle-zehn-2026-11-13.
   Zehnte Kachel Drucksachen (19.11.2026): steht sie allein in der letzten Reihe, geht sie über die ganze Breite (pult-fassungen.css).
   Marke & Vision: Bild «Morgen im Studio» (Robert 16.11.2026 aus fünf gewählt), Wahlleiste entfernt. */
(function () {
  'use strict';
  var F = '/zentrale/grundlagen/marke/fotos/';
  var MV = F + 'k-morgen-900.webp';   // Marke & Vision: Bild 3 «Morgen im Studio», Robert 16.11.2026 gewählt
  var P = null;
  var ZAHL = { 8: 'Acht', 9: 'Neun', 10: 'Zehn', 11: 'Elf', 12: 'Zwölf' };
  function alle(gr) { return gr.reduce(function (a, g) { return a.concat(g.ws); }, []); }
  /* Auftritt wie Bareiss (Robert 19.11.2026): jedes Stück liegt in einem Schlitz (.pf-sl) und rollt nach der Kachel heraus, --k = Reihenfolge */
  function sl(inhalt, k) { return '<span class="pf-sl" style="--k:' + k + '">' + inhalt + '</span>'; }
  function z0(w) { var z = w.zahlen[0]; return z ? sl('<b data-zahl="' + P.esc(w.o + '-' + z[0]) + '">–</b>', 0) + sl('<small>' + P.esc(z[1]) + '</small>', 1) : ''; }
  function bau(gr, ph) {
    P = ph;
    var kacheln = alle(gr).map(function (w, i) {
      var bild = w.o === '12-marke-vision' ? MV : w.foto;
      /* jede Kachel fliegt einzeln herein (data-r="b"), gestaffelt je Spalte */
      return '<li data-r="b" style="--i:' + (i % 3) + '"><button type="button" class="pf1-k" data-oeffne="' + P.esc(w.o) + '"><img src="' + bild + '" alt="" decoding="async">'
        + '<span class="pf1-n">' + z0(w) + '</span><span class="pf1-t">' + sl('<small>' + P.esc(w.gruppe) + '</small>', 0) + sl('<b>' + P.esc(w.name) + '</b>', 1) + sl('<span class="pf1-z">' + P.esc(w.zweck) + '</span>', 2) + '</span>'
        + '<i class="pf1-p">' + P.ic('rechts') + '</i></button></li>';
    }).join('');
    return '<section class="m-saal dunkel m-pult pf pf--1" id="w-alle" aria-label="Alle Werkzeuge"><div class="innen">'
      + '<header class="pf-kopf pf-kopf--mitte"><p class="pf-kopf__nr" data-schlitz>' + (ZAHL[alle(gr).length] || alle(gr).length) + ' Werkzeuge · Tasty Studios</p><h2 class="pf-kopf__t" data-schlitz>Alle Werkzeuge</h2><p class="pf-kopf__s" data-schlitz style="--i:2">Ein Klick öffnet das Werkzeug.</p></header>'
      + '<ul class="pf1">' + kacheln + '</ul></div></section>';
  }

  window.ZENTRALE_FASSUNGEN = { bau: bau, leben: function () {}, wert: function () {} };
})();
