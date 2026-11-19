/* kopf-fassungen.js · Kopfleiste der Zentrale, zehn Fassungen zum Durchschalten (Robert 17.11.2026: «viel schöner, luxuriöser, edler und eleganter»).
   Nur aktiv mit ?kopf=<Nummer> in der Adresse; ← → wechseln, 0 = heutiger Stand. Die vorhandenen Knöpfe werden nur umgehängt,
   ihre Funktionen (Start, Suchen, Robert/Anna, Website, Anleitungen) bleiben dieselben. */
(function () {
  'use strict';
  var m = /[?&]kopf=(\d+)/.exec(location.search);
  if (!m) return;
  var NAMEN = ['Heutiger Stand', 'Concierge-Leiste', 'Magazinkopf', 'Eine Kapsel', 'Siegel', 'Elfenbein und Messing',
    'Zwei Etagen', 'Briefkopf', 'Hängende Lasche', 'Nachtblaue Inseln', 'Block der Seitenleiste'];
  var ZAHL = NAMEN.length, f = Math.min(ZAHL - 1, Math.max(0, +m[1] || 0));
  var FLACH = { 1: 1, 2: 1, 3: 1, 4: 1, 6: 1, 7: 1, 10: 1 };
  var OFFEN = { 2: 1, 4: 1, 10: 1 };   // stehen frei auf dem Bild; unterhalb des Empfangs bekommen sie Grund

  var q = function (s) { return document.querySelector(s); };
  var K, A, I, E, W, WK, SU, R, WER, RUND, WEB;
  function refs() {
    K = q('#kopf'); A = q('.m-oben__ecke--l') || document.createComment(''); I = q('.m-insel'); E = q('.m-ecke'); W = q('.m-insel__wege');
    WK = q('.m-insel__p[href="#werkzeuge"]'); SU = q('.m-insel__p[data-suche]'); R = q('.m-oben__r'); WER = q('#wer'); RUND = q('#werRund');
    WEB = q('.m-oben__r .m-oben__ecke');
  }
  function g(kl) { var d = document.createElement('div'); d.className = 'kf-g ' + kl; for (var i = 1; i < arguments.length; i++) d.appendChild(arguments[i]); return d; }
  function deko(kl, html) { var s = document.createElement('span'); s.className = 'kf-deko ' + kl; s.setAttribute('aria-hidden', 'true'); s.innerHTML = html; return s; }
  function datum() { return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }

  function grundstand() {
    K.append(A, I, R); I.append(E, W); W.append(WK, SU); R.append(WER, RUND, WEB);
    Array.prototype.forEach.call(K.querySelectorAll('.kf-g, .kf-deko'), function (n) { n.remove(); });
  }
  var BAU = {
    1: function () { K.append(g('kf-l', A, WK, SU), E, R); R.append(WER, RUND, WEB); },
    2: function () { K.append(E, g('kf-m', A, WK, SU), R); },
    3: function () { K.append(g('kf-kapsel', A, E, deko('kf-strich', ''), WK, SU, deko('kf-strich', ''), WER, RUND, WEB)); },
    4: function () { K.append(g('kf-l', A, WK, SU, deko('kf-linie', '')), E, g('kf-r', deko('kf-linie', ''), WER, RUND, WEB)); },
    6: function () {
      K.append(g('kf-oben', deko('kf-ort', 'Tasty Studios · Hamburg'), deko('kf-tag', datum()), WER, RUND),
        g('kf-unten', E, g('kf-wege', A, WK, SU, WEB)));
    },
    7: function () { K.append(E, g('kf-wege', A, WK, SU, WEB), WER, RUND); },
    10: function () { K.append(g('kf-block', E), g('kf-r', A, WK, SU, WER, RUND, WEB)); }
  };
  function anwenden() {
    refs(); if (!K) return;
    grundstand();
    if (BAU[f]) BAU[f]();
    var h = document.documentElement;
    h.setAttribute('data-kopf', String(f));
    if (FLACH[f]) h.setAttribute('data-kopf-art', 'flach'); else h.removeAttribute('data-kopf-art');
    if (OFFEN[f]) h.setAttribute('data-kopf-offen', ''); else h.removeAttribute('data-kopf-offen');
    fest();
    malLeiste();
  }
  function fest() {
    var o = q('#oben'); if (!K || !o) return;
    K.classList.toggle('kf-fest', scrollY > o.offsetHeight - 120);
  }
  addEventListener('scroll', fest, { passive: true });

  var leiste = null;
  function setze(neu) {
    f = (neu + ZAHL) % ZAHL;
    var u = new URL(location.href); u.searchParams.set('kopf', f); history.replaceState(null, '', u);
    anwenden();
  }
  function malLeiste() {
    if (!leiste) {
      leiste = document.createElement('div'); leiste.className = 'kf-leiste'; leiste.setAttribute('role', 'group'); leiste.setAttribute('aria-label', 'Fassung der Kopfleiste wählen');
      var pfeil = '<svg class="wo-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      leiste.innerHTML = '<button type="button" data-kf="-1" aria-label="Vorige Fassung">' + pfeil + '</button><span class="kf-leiste__t"></span><button type="button" data-kf="1" aria-label="Nächste Fassung">' + pfeil + '</button>';
      document.body.appendChild(leiste);
      leiste.addEventListener('click', function (e) { var b = e.target.closest('[data-kf]'); if (b) setze(f + +b.dataset.kf); });
      addEventListener('keydown', function (e) {
        var werk = document.getElementById('werk');
        if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || (werk && !werk.hidden)) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); setze(f + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); setze(f - 1); }
      });
    }
    leiste.querySelector('.kf-leiste__t').innerHTML = '<b>' + f + '</b> von ' + (ZAHL - 1) + ' · ' + NAMEN[f];
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', anwenden); else anwenden();
})();
