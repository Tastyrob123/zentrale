/* cockpit-stand.js · Seitenleiste ein- und ausklappbar, Zahlen zählen hoch, Startbild nur bei echtem Seitenwechsel neu eingeblendet.
   Für alle Werkzeuge der Zentrale auf dem Stand des Sales Cockpits (Robert 16.11.2026). Vorlage: «Kunden» (kundenliste.js randKlapp, bewegung.js),
   dort aus 13-sales-cockpit/cockpit.js. Gehört zu cockpit-stand.css. Am Ende der Seite einbinden: <script src="/zentrale/zentrale/oberflaeche/cockpit-stand.js"></script>
   Die Leiste wird nach jedem Neuzeichnen des Werkzeugs von selbst wieder in Kopfzeile (Name + Knopf) und rollenden Teil gegliedert. */
(function () {
  'use strict';
  if (window.__cockpitStand) return; window.__cockpitStand = true;
  var ruhig = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var html = document.documentElement, KEY = 'tasty-rand:' + location.pathname.replace(/index\.html$/, '');
  var zu = false;
  try { zu = localStorage.getItem(KEY) === 'zu'; } catch (e) { /* privat */ }
  html.classList.toggle('st-rand-zu', zu);
  var ic = function (n) { return window.WO && WO.ic ? WO.ic(n) : ''; };

  /* ---------- Seitenleiste ---------- */
  function name() {
    var t = (document.title || '').split('·')[0].trim();
    return t || 'Bereiche';
  }
  function gliedere(r) {
    if (!r || r.querySelector(':scope > .st-rand-kopf') || r.querySelector('[data-rand-kn]')) return;   // schon gegliedert oder eigener Knopf (Cockpit, Kunden)
    if (!r.firstElementChild) return;
    var inhalt = document.createElement('div'), kopf = document.createElement('div');
    inhalt.className = 'st-rand-inhalt'; kopf.className = 'st-rand-kopf';
    while (r.firstChild) inhalt.appendChild(r.firstChild);
    var erste = inhalt.querySelector('.wo-rand__g > .wo-mk');
    if (erste && erste.parentElement === inhalt.firstElementChild) kopf.appendChild(erste);   // wie im Cockpit: die erste Gruppe gibt der Kopfzeile den Namen
    else { var p = document.createElement('p'); p.className = 'wo-mk'; p.textContent = name(); kopf.appendChild(p); }
    var kn = document.createElement('button');
    kn.type = 'button'; kn.className = 'st-rand-kn'; kn.setAttribute('data-st-rand-kn', '');
    kn.setAttribute('aria-expanded', zu ? 'false' : 'true'); kn.setAttribute('aria-label', 'Seitenleiste ein- oder ausklappen'); kn.title = 'Seitenleiste ein- oder ausklappen';
    kn.innerHTML = '<i>' + ic('links') + '</i><i>' + ic('menue') + '</i>';
    kn.addEventListener('click', klapp);
    kopf.appendChild(kn);
    r.append(kopf, inhalt);
    r.classList.add('st-rand');
    inhalt.querySelectorAll('.wo-re, .wo-zw, h2, h3').forEach(function (x) { x.setAttribute('data-wo-bw-nie', ''); });   // Einträge stehen beim Laden ruhig
    var an = inhalt.querySelector('[aria-current], .wo-an');
    if (an) { var b = an.getBoundingClientRect(), rb = inhalt.getBoundingClientRect(); if (b.top < rb.top || b.bottom > rb.bottom) inhalt.scrollTop += b.top - rb.top - rb.height / 3; }
  }
  /* Hält den sichtbaren Inhalt auf seiner Höhe, während sich die Breite ändert */
  function haltHoehe() {
    var h = document.querySelector('main'); if (!h) return { lauf: function () {}, ende: function () {} };
    var hb = h.getBoundingClientRect();
    var a = document.elementFromPoint(Math.min(hb.left + 60, innerWidth - 1), Math.round(innerHeight * .45));
    while (a && a.parentElement && a.parentElement !== h && a.parentElement.getBoundingClientRect().height < innerHeight * .8) a = a.parentElement;
    if (!a || !h.contains(a) || a === h) return { lauf: function () {}, ende: function () {} };
    var y0 = a.getBoundingClientRect().top, an = true; html.style.overflowAnchor = 'none';
    var zieh = function () { var d = a.getBoundingClientRect().top - y0; if (Math.abs(d) > .5) scrollBy(0, d); };
    var lauf = function () { if (!an) return; zieh(); requestAnimationFrame(lauf); };
    return { lauf: function () { requestAnimationFrame(lauf); }, ende: function () { an = false; zieh(); html.style.overflowAnchor = ''; } };
  }
  /* Eine einzige Bewegung: die Spalte wird schmal oder breit, die Fläche wird wie ein Vorhang beschnitten, der Inhalt behält seine Breite, der Knopf gleitet mit */
  function klapp() {
    var r = document.querySelector('.wo-rand.st-rand'), kn = r && r.querySelector('[data-st-rand-kn]'), app = document.body; if (!r || r._laeuft) return; r._laeuft = true;
    zu = !zu; try { localStorage.setItem(KEY, zu ? 'zu' : 'auf'); } catch (e) { /* privat */ }
    var auf = !zu, setze = function (v) { html.classList.toggle('st-rand-zu', !v); };
    if (kn) kn.setAttribute('aria-expanded', auf ? 'true' : 'false');
    if (ruhig() || !matchMedia('(min-width:901px)').matches || !app.animate) { setze(auf); r._laeuft = false; return; }
    var EA = 'cubic-bezier(.65,0,.35,1)', D = 720;
    var spalten = function () { return getComputedStyle(app).gridTemplateColumns; };
    var fest = [].slice.call(r.querySelectorAll(':scope > .st-rand-kopf, :scope > .st-rand-inhalt'));
    var mitte = function (x) { var b = x.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
    var halt = haltHoehe(), rad = getComputedStyle(r).borderTopLeftRadius || '18px';
    var sVor = spalten(), hVor = r.getBoundingClientRect().height, kVor = kn ? mitte(kn) : [0, 0];
    setze(auf); var sNach = spalten(), hNach = r.getBoundingClientRect().height, kNach = kn ? mitte(kn) : [0, 0];
    setze(true); if (auf) rad = getComputedStyle(r).borderTopLeftRadius || rad;
    var hOffen = r.getBoundingClientRect().height;
    fest.forEach(function (x) { x.style.width = x.getBoundingClientRect().width + 'px'; });
    var kOffen = kn ? mitte(kn) : [0, 0];
    var zuClip = 'inset(0px 0px ' + Math.max(0, hOffen - Math.min(hVor, hNach)) + 'px 0px round 32px)', aufClip = 'inset(0px 0px 0px 0px round ' + rad + ')';
    var anims = [app.animate([{ gridTemplateColumns: sVor }, { gridTemplateColumns: sNach }], { duration: D, easing: EA, fill: 'forwards' }),
      r.animate([{ clipPath: auf ? zuClip : aufClip }, { clipPath: auf ? aufClip : zuClip }], { duration: D, easing: EA, fill: 'forwards' })];
    if (kn) { var ziel = auf ? kVor : kNach, t = 'translate(' + (ziel[0] - kOffen[0]) + 'px,' + (ziel[1] - kOffen[1]) + 'px)';
      anims.push(kn.animate([{ transform: auf ? t : 'none' }, { transform: auf ? 'none' : t }], { duration: D, easing: EA, fill: 'forwards' })); }
    if (!auf) r.querySelectorAll(':scope > .st-rand-kopf > .wo-mk, :scope > .st-rand-inhalt').forEach(function (x) {   // Schrift verschwindet, bevor die Kante sie erreicht
      anims.push(x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.round(D * .26), easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })); });
    halt.lauf();
    Promise.all(anims.map(function (a) { return a.finished; })).catch(function () {}).then(function () {
      setze(auf); fest.forEach(function (x) { x.style.width = ''; }); anims.forEach(function (a) { a.cancel(); }); halt.ende(); r._laeuft = false;
    });
  }

  /* ---------- Startbild: nur nach Laden oder Klick eingeblendet, beim leisen Neuzeichnen (Tippen, Speichern im Hintergrund) steht es still ---------- */
  var offen = performance.now() + 2500;
  ['click', 'keydown', 'hashchange', 'popstate'].forEach(function (e) { addEventListener(e, function (ev) { if (e !== 'keydown' || ev.key === 'Enter') offen = performance.now() + 1500; }, true); });
  function startbilder(knoten) {
    if (performance.now() <= offen) return;
    knoten.forEach(function (n) { if (n.nodeType !== 1) return; (n.matches('.wo-sb') ? [n] : [].slice.call(n.querySelectorAll('.wo-sb'))).forEach(function (s) { s.classList.add('st-still'); }); });
  }

  /* ---------- Zahlen der Lage zählen hoch («4 Häuser»), Daten nicht ---------- */
  var io = 'IntersectionObserver' in window && !ruhig() ? new IntersectionObserver(function (l) { l.forEach(function (x) { if (x.isIntersecting && x.target.offsetParent) { io.unobserve(x.target); zaehle(x.target); } }); }, { threshold: .4 }) : null;
  function zaehle(b) {
    var t = b.firstChild, m = t && t.nodeType === 3 && /^(\d+)(\s.*)?$/.exec(t.nodeValue); if (!m) return;
    var zielZ = +m[1], rest = m[2] || ''; if (!zielZ) return;
    b.style.minWidth = b.getBoundingClientRect().width + 'px';
    var t0 = performance.now(), d = 900;
    var schritt = function (n) { var k = Math.min(1, (n - t0) / d), e = 1 - Math.pow(1 - k, 3); t.nodeValue = Math.round(zielZ * e) + rest; if (k < 1) requestAnimationFrame(schritt); else b.style.minWidth = ''; };
    t.nodeValue = '0' + rest; requestAnimationFrame(schritt);
  }
  function zahlen() { if (!io) return; document.querySelectorAll('main .wo-lg > b:not([data-st-z])').forEach(function (b) { b.setAttribute('data-st-z', ''); io.observe(b); }); }

  /* ---------- Lesbarkeit nach jedem Zeichnen (Prüfpunkte 17 und 21, wie im Cockpit): Schrift nie unter 13 px, grosse Schrift mit Luft für Ober- und Unterlängen.
     Läuft im selben Moment wie das Zeichnen, vor dem Bild: nichts springt sichtbar. Miniaturen (verkleinert dargestellte Blätter) bleiben, wie sie sind. */
  function lesbar(knoten) {
    knoten.forEach(function (n) {
      if (n.nodeType !== 1) return;
      [n].concat([].slice.call(n.querySelectorAll('*'))).forEach(function (e) {
        if (e.hasAttribute('data-st-l') || e.closest('svg,[data-st-mini]')) return;
        var text = false; for (var c = e.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) { text = true; break; }
        if (!text) return;
        var s = getComputedStyle(e), fs = parseFloat(s.fontSize), lh = parseFloat(s.lineHeight);
        if (e.offsetWidth && e.getBoundingClientRect().width / e.offsetWidth < .8) return;   // Miniatur
        if (fs > 5 && fs < 12.9) { e.style.fontSize = '13px'; e.setAttribute('data-st-l', ''); }
        if (fs >= 18 && lh && lh < fs * 1.12) { e.style.lineHeight = '1.14'; e.setAttribute('data-st-l', ''); }
      });
    });
  }

  /* ---------- Hereinschweben auch dort, wo das Werkzeug selbst nichts markiert (Unterseiten): die Blöcke unter dem ersten Bild schweben wie im Cockpit herein ---------- */
  var ioSt = 'IntersectionObserver' in window ? new IntersectionObserver(function (l) { var k = 0; l.forEach(function (x) { if (x.isIntersecting) { x.target.style.setProperty('--i', Math.min(k++, 3)); x.target.classList.add('st-da'); ioSt.unobserve(x.target); } }); }, { rootMargin: '0px 0px -2% 0px' }) : null;
  var MARKIERT = '[data-sw],[data-r],[data-st],[data-swz]';
  function bloecke(w, tiefe, aus) {
    [].slice.call(w.children).forEach(function (k) {
      var cs = getComputedStyle(k); if (/fixed|sticky|absolute/.test(cs.position) || cs.display === 'none') return;
      var b = k.getBoundingClientRect(); if (b.height < 40) return;
      if (b.height > innerHeight * 1.2 && k.children.length > 1 && tiefe < 4) bloecke(k, tiefe + 1, aus); else aus.push(k);
    });
    return aus;
  }
  function schwebe() {
    if (!ioSt || ruhig() || body().classList.contains('sc')) return;
    var w = document.querySelector('main'); if (!w) return;
    while (w.children.length === 1) w = w.children[0];
    bloecke(w, 0, []).forEach(function (k) {
      if (k.matches(MARKIERT) || k.closest(MARKIERT) || k.querySelector(MARKIERT)) return;
      if (k.getBoundingClientRect().top < innerHeight * .9) return;   // was man schon sieht, bleibt stehen
      k.setAttribute('data-st', ''); ioSt.observe(k);
    });
  }
  function body() { return document.body; }

  function los() {
    var r = document.querySelector('.wo-rand');
    if (r) { gliedere(r); new MutationObserver(function () { gliedere(r); }).observe(r, { childList: true }); }
    var m = document.querySelector('main'), plan = 0;
    if (m) new MutationObserver(function (l) {
      var neu = []; l.forEach(function (x) { neu.push.apply(neu, x.addedNodes); });
      startbilder(neu); lesbar(neu); zahlen();
      if (performance.now() <= offen && !plan) plan = requestAnimationFrame(function () { plan = 0; schwebe(); });   // nach dem Markieren des Werkzeugs, im selben Bild
    }).observe(m, { childList: true, subtree: true });
    lesbar([m || document.body]); zahlen(); schwebe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
