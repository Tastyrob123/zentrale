/* Feinschliff (Robert 06.11.2026): Anna passt die Seite selbst an. Wörter, Schrift, Abstände und Reihenfolge der Abschnitte direkt auf der Seite,
   grössere Umbauten als Wunsch zu einem Abschnitt, über den Robert und Anna sprechen. Geladen nur mit Schlüssel (Lader am Ende von kopf.js
   und assets/js/main.js). Die Seite selbst bleibt unverändert: Annas Änderungen liegen als Liste im Dienst feinschliff (tasty-besuche) und
   werden beim Bearbeiten darübergelegt, bis Robert sie in die Quelle übernimmt (texte.py / bau.py). Besucher sehen nichts davon. */
(function () {
  'use strict';
  var K = '';
  try { K = localStorage.getItem('tasty-feinschliff') || ''; } catch (e) {}
  var html = document.documentElement, body = document.body;
  function zeigen() { html.classList.remove('fs-warte'); }
  if (!K) { zeigen(); return; }
  var LOKAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = LOKAL ? 'http://localhost:8981/api/feinschliff' : 'https://tasty-besuche.vercel.app/api/feinschliff';
  var SEITE = decodeURIComponent(location.pathname.split('/').pop() || 'index.html') || 'index.html';
  var SEITEN_NAME = { 'index.html': 'Startseite', 'team.html': 'Team', 'studio.html': 'Studio', 'work.html': 'Arbeiten', 'werkzeuge.html': 'Werkzeuge',
    'contact.html': 'Kontakt', 'legal.html': 'Impressum', 'restaurant.html': 'Restaurant', 'studio-r.html': 'Studio (Restaurant)',
    'work-r.html': 'Arbeiten (Restaurant)', 'werkzeuge-r.html': 'Werkzeuge (Restaurant)' };
  /* Schriften: die ersten liegen schon auf der Seite, die übrigen kommen bei Wahl von Google Fonts (kostet nichts) */
  var SCHRIFTEN = [
    ['Antonio', 'seite'], ['Instrument Sans', 'seite'], ['DM Mono', 'seite'], ['Cormorant Garamond', 'google'],
    ['Montserrat', 'google'], ['Playfair Display', 'google'], ['Libre Baskerville', 'google'], ['DM Serif Display', 'google'], ['Lora', 'google'], ['Inter', 'google']];
  var ZUSTAND = /^(an|in|vor|sicht|aktiv|offen|zu|da|weg|los|laeuft|fertig|steht|spielt|erst|zieht|is-.*|fs-.*)$/;
  var doc = { aenderungen: [], wuensche: [] }, wer = '', modus = 'ansehen', ohne = false;
  try { ohne = sessionStorage.getItem('fs-ohne') === '1'; } catch (e) {}
  var grund = new WeakMap();   // Element → Ausgangswerte (Text, Abstände), einmal gemessen vor jeder Änderung

  /* ------------------------------------------------------------------ Dienst */
  function holen() {
    return fetch(API + '?k=' + encodeURIComponent(K), { cache: 'no-store' }).then(function (r) {
      if (r.status === 403) throw new Error('schluessel');
      return r.json();
    });
  }
  function senden(daten) {
    daten.k = K;
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); })
      .then(function (j) { doc = j.doc; liste(); return j; })
      .catch(function (j) { hinweis('Nicht gespeichert' + (j && j.fehler ? ' (' + j.fehler + ')' : '') + '. Bitte noch einmal versuchen.', null, true); throw j; });
  }
  function eintrag(zk) { return aktiv().filter(function (x) { return x.zk === zk; })[0]; }
  function kopie(a) { var k = JSON.parse(JSON.stringify(a)); delete k._da; delete k.wer; delete k.zeit; delete k.status; return k; }
  /* speichern und eine Quittung mit «Rückgängig» zeigen: zurück heisst, die vorige Fassung dieser Stelle wieder einsetzen oder den Eintrag entfernen */
  function sichern(a, text, zurueckDom, dann) {
    var alt = eintrag(a.zk), altKopie = alt ? kopie(alt) : null;
    return senden({ op: 'setzen', a: a }).then(function () {
      if (dann) dann();
      hinweis(text, function () {
        if (zurueckDom) zurueckDom();
        var jetzt = eintrag(a.zk);
        if (altKopie) senden({ op: 'setzen', a: altKopie }).then(function () { hinweis('Zurückgenommen.'); });
        else if (jetzt) senden({ op: 'entfernen', id: jetzt.id }).then(function () { hinweis('Zurückgenommen.'); });
      });
    });
  }

  /* ------------------------------------------------------------------ Adressen auf der Seite */
  function unser(el) { return !!(el && el.closest && el.closest('.fs-ui')); }
  function pfad(el) {
    var teile = [], x = el;
    while (x && x !== body && x.nodeType === 1) {
      if (x.id && !/^fs-/.test(x.id)) { teile.unshift('#' + x.id); break; }
      if (x.tagName === 'MAIN' || x.tagName === 'FOOTER' || x.tagName === 'HEADER') { teile.unshift(x.tagName.toLowerCase()); break; }
      var i = 1, s = x;
      while ((s = s.previousElementSibling)) if (s.tagName === x.tagName && !unser(s)) i++;
      teile.unshift(x.tagName.toLowerCase() + ':' + i);
      x = x.parentElement;
    }
    return teile.join('>');
  }
  function finden(p) {
    var teile = p.split('>'), x;
    var a = teile.shift();
    x = a.charAt(0) === '#' ? document.getElementById(a.slice(1)) : document.querySelector(a);
    for (var j = 0; x && j < teile.length; j++) {
      var m = /^([a-z0-9-]+):(\d+)$/.exec(teile[j]), n = 0, gef = null;
      if (!m) return null;
      for (var c = x.firstElementChild; c; c = c.nextElementSibling) {
        if (c.tagName.toLowerCase() === m[1] && !unser(c) && ++n === +m[2]) { gef = c; break; }
      }
      x = gef;
    }
    return x;
  }
  function textVon(el) {   // Textknoten mit Leerzeichen verbinden (Zeilen einer Überschrift stehen in eigenen Spans)
    var t = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (!unser(n.parentElement) && n.nodeValue.trim()) t.push(n.nodeValue.trim());
    return norm(t.join(' '));
  }
  function norm(s) { return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }
  function zeichen(el) {   // gleiche Art: Tag + Klassen ohne Zustandsklassen
    var k = [].slice.call(el.classList).filter(function (c) { return !ZUSTAND.test(c); }).sort();
    return el.tagName.toLowerCase() + (k.length ? '.' + k.join('.') : '');
  }
  function abschnitte() {
    var m = document.querySelector('main');
    return m ? [].slice.call(m.children).filter(function (c) { return !unser(c) && c.tagName !== 'SCRIPT' && c.offsetHeight > 30; }) : [];
  }
  /* Schlüssel der Abschnitte: #id oder .klasse:n, gezählt in der Reihenfolge der Quelle. Einmal beim Start festgehalten,
     damit er nach dem Verschieben noch dieselbe Stelle meint. */
  var keyVon = new WeakMap(), elVon = {};
  function schluesselAufbauen() {
    var m = document.querySelector('main');
    if (!m) return;
    var zaehler = {};
    [].slice.call(m.children).forEach(function (c) {
      if (unser(c) || c.tagName === 'SCRIPT') return;
      var key;
      if (c.id) key = '#' + c.id;
      else { var k = c.classList[0] || c.tagName.toLowerCase(); zaehler[k] = (zaehler[k] || 0) + 1; key = '.' + k + ':' + zaehler[k]; }
      keyVon.set(c, key); elVon[key] = c;
    });
  }
  function abschnittKey(s) { if (!keyVon.has(s)) schluesselAufbauen(); return keyVon.get(s) || (s.id ? '#' + s.id : s.tagName.toLowerCase()); }
  function abschnittVonKey(key) {
    if (!Object.keys(elVon).length) schluesselAufbauen();
    if (elVon[key]) return elVon[key];
    return key.charAt(0) === '#' ? document.getElementById(key.slice(1)) : null;
  }
  function abschnittName(s) {
    var h = s.querySelector('h1,h2,h3,h4,h5,strong,b,p'), t = h ? textVon(h) : '';
    if (!t) t = textVon(s);
    if (s.classList.contains('fen')) t = 'Bildfenster' + (t ? ': ' + t : '');
    if (s.classList.contains('gband')) t = 'Band unter dem Auftakt';
    return (t || abschnittKey(s)).slice(0, 70);
  }

  /* ------------------------------------------------------------------ Darüberlegen */
  function eigenerText(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim()) return true;
    return false;
  }
  function textBlatt(el) {   // kleinstes Element mit eigenem Text; einzelne Buchstaben-Spans zählen zum Elternteil
    while (el && el !== body && !unser(el)) {
      if (/^(SCRIPT|STYLE|SVG|svg|path|INPUT|TEXTAREA|SELECT|IMG|VIDEO)$/.test(el.tagName)) return null;
      if (eigenerText(el)) {
        if (el.textContent.trim().length <= 1 && el.parentElement && el.parentElement.children.length > 3) return el.parentElement;
        return el;
      }
      /* Hülle um genau ein Kind (z. B. die Zeile einer Überschrift, deren Text im inneren Span steht): hinein statt hinauf */
      var k = el;
      while (k.children.length === 1 && !eigenerText(k) && !unser(k.firstElementChild)) k = k.firstElementChild;
      if (k !== el && eigenerText(k)) return k;
      el = el.parentElement;
    }
    return null;
  }
  function schriftZiel(el) {
    var b = textBlatt(el);
    if (!b) return null;
    return b.closest('h1,h2,h3,h4,h5,h6,p,li,a,button,blockquote,figcaption,label,dt,dd,small,em,b') || b;
  }
  function sauberesHtml(el) {
    var k = el.cloneNode(true);
    k.querySelectorAll('*').forEach(function (x) {
      if (unser(x) || !/^(BR|B|STRONG|I|EM|A|SPAN|SMALL)$/.test(x.tagName)) { x.replaceWith(document.createTextNode(unser(x) ? '' : x.textContent)); return; }
      [].slice.call(x.attributes).forEach(function (a) {
        if (!((a.name === 'href' && x.tagName === 'A') || a.name === 'class')) x.removeAttribute(a.name);
      });
    });
    k.removeAttribute('contenteditable');
    return k.innerHTML.replace(/\s+/g, ' ').trim();
  }
  function messen(el) {
    if (!grund.has(el)) {
      var cs = getComputedStyle(el);
      grund.set(el, { html: sauberesHtml(el), pt: parseFloat(cs.paddingTop) || 0, pb: parseFloat(cs.paddingBottom) || 0 });
    }
    return grund.get(el);
  }
  function aktiv() { return doc.aenderungen.filter(function (a) { return a.status !== 'übernommen' && (a.seite === SEITE || a.seite === '*'); }); }
  var geladen = {};
  function schriftLaden(f) {   // gibt ein Versprechen zurück, damit die Seite erst mit geladener Schrift erscheint
    var s = SCHRIFTEN.filter(function (x) { return x[0] === f; })[0];
    if (!s || s[1] !== 'google') return Promise.resolve();
    if (geladen[f]) return geladen[f];
    var schon = [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).some(function (l) { return (l.href || '').indexOf('family=' + f.replace(/ /g, '+')) > -1; });
    if (schon) return (geladen[f] = Promise.resolve());
    geladen[f] = new Promise(function (ok) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@300;400;500;600;700&display=block';
      l.onload = l.onerror = function () { ok(); };
      document.head.appendChild(l);
      setTimeout(ok, 2500);
    });
    return geladen[f];
  }
  function stilLeeren(el) { ['fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight'].forEach(function (k) { el.style[k] = ''; }); el.removeAttribute('data-fs'); }
  function stilSetzen(el, w) {
    stilLeeren(el);
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    if (w.schrift) { schriftLaden(w.schrift); el.style.fontFamily = '"' + w.schrift + '", ' + cs.fontFamily; }
    if (w.groesse && w.groesse !== 100) el.style.fontSize = (fs * w.groesse / 100).toFixed(1) + 'px';
    if (w.gewicht) el.style.fontWeight = w.gewicht;
    if (w.zeilen) el.style.lineHeight = w.zeilen;
    if (w.laufweite !== undefined && w.laufweite !== null && w.laufweite !== '') el.style.letterSpacing = w.laufweite + 'em';
    el.setAttribute('data-fs', '1');
  }
  function stilZiele(a) {
    if (a.umfang === 'element') { var e = finden(a.ziel); return e ? [e] : []; }
    var sel;
    try { sel = document.querySelectorAll('main ' + a.ziel + ', footer ' + a.ziel); } catch (x) { return []; }
    return [].slice.call(sel).filter(function (e) { return zeichen(e) === a.ziel && !unser(e); });
  }
  function schnittWert() { return Math.max(0.45, Math.min(1, innerWidth / 1440)); }
  function abstandSetzen(s, w) {
    var g = messen(s), schnitt = schnittWert();
    s.style.paddingTop = Math.max(0, g.pt + (w.oben || 0) * schnitt) + 'px';
    s.style.paddingBottom = Math.max(0, g.pb + (w.unten || 0) * schnitt) + 'px';
    s.setAttribute('data-fs', '1');
  }
  function abstandLeeren(s) { s.style.paddingTop = ''; s.style.paddingBottom = ''; s.removeAttribute('data-fs'); }
  function reihenfolgeSetzen(liste) {
    var m = document.querySelector('main');
    if (!m) return;
    var els = liste.map(abschnittVonKey).filter(Boolean);
    els.forEach(function (x) { m.appendChild(x); });
    [].slice.call(m.children).forEach(function (c) { if (unser(c)) m.appendChild(c); });
  }
  function anwenden() {
    if (ohne) return [];
    var warten = [];
    aktiv().forEach(function (a) {
      a._da = true;
      if (a.art === 'text') {
        var el = finden(a.ziel);
        if (!el || norm(messen(el).html) !== norm(a.vorher)) {   // Seite hat sich verschoben: über den Ausgangstext suchen
          el = null;
          var tag = (/([a-z0-9]+):\d+$/.exec(a.ziel) || [])[1];
          var alle = tag ? document.querySelectorAll('main ' + tag + ', footer ' + tag) : [];
          for (var i = 0; i < alle.length; i++) if (norm(alle[i].innerHTML) === norm(a.vorher)) { el = alle[i]; break; }
        }
        if (!el) { a._da = false; return; }
        messen(el);
        el.innerHTML = a.nachher;
        el.setAttribute('data-fs', '1');
      } else if (a.art === 'stil') {
        var z = stilZiele(a);
        if (!z.length) a._da = false;
        if (a.werte && a.werte.schrift) warten.push(schriftLaden(a.werte.schrift));
        z.forEach(function (e) { stilSetzen(e, a.werte || {}); });
      } else if (a.art === 'abstand') {
        var s = abschnittVonKey(a.ziel);
        if (!s) { a._da = false; return; }
        abstandSetzen(s, a.werte || {});
      } else if (a.art === 'reihenfolge') {
        reihenfolgeSetzen(a.werte && a.werte.liste || []);
      }
    });
    return warten;
  }
  var rz;
  addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      aktiv().forEach(function (a) {
        if (a.art === 'stil') stilZiele(a).forEach(function (e) { stilSetzen(e, a.werte || {}); });
        if (a.art === 'abstand') { var s = abschnittVonKey(a.ziel); if (s) abstandSetzen(s, a.werte || {}); }
      });
      if (modus === 'abschnitte') griffe(true);
    }, 200);
  });

  /* ------------------------------------------------------------------ Oberfläche */
  function el(tag, cls, inhalt) {
    var x = document.createElement(tag);
    if (cls) x.className = cls;
    if (inhalt !== undefined) x.innerHTML = inhalt;
    return x;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function kurz(s, n) { s = norm(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function ausschnitt(a, b, n) {   // vorher und nachher gekürzt, aber immer um die Stelle herum, die sich unterscheidet
    a = norm(a); b = norm(b);
    if (a.length <= n && b.length <= n) return [a, b];
    var p = 0, m = Math.min(a.length, b.length);
    while (p < m && a[p] === b[p]) p++;
    var s = 0;
    while (s < m - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    var w = a.lastIndexOf(' ', p - 1); p = w < 0 ? 0 : w + 1;   // am Wortanfang beginnen
    var vorn = Math.min(p, 20), start = p - vorn;
    var w2 = a.indexOf(' ', start); if (start > 0 && w2 >= 0 && w2 < p) start = w2 + 1;
    function stueck(t) {
      var ende = Math.min(t.length, start + n - (start > 0 ? 1 : 0));
      if (ende < t.length) { var l = t.lastIndexOf(' ', ende - 1); if (l > start + n / 2) ende = l; }
      return (start > 0 ? '…' : '') + t.slice(start, ende).trim() + (ende < t.length ? '…' : '');
    }
    return [stueck(a), stueck(b)];
  }
  function zeit(z) {
    try { return new Date(z).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ''); } catch (e) { return ''; }
  }

  var leiste = el('div', 'fs-ui fs-leiste');
  var MODI = [['ansehen', 'Ansehen'], ['text', 'Wörter'], ['schrift', 'Schrift'], ['abschnitte', 'Abschnitte'], ['wuensche', 'Wünsche'], ['liste', 'Änderungen']];
  leiste.innerHTML = '<span class="fs-marke"><b>Website bearbeiten</b><i class="fs-wer"></i></span><span class="fs-modi">' +
    MODI.map(function (m) { return '<button type="button" data-modus="' + m[0] + '">' + m[1] + '<em></em></button>'; }).join('') + '</span>' +
    '<span class="fs-rechts"><button type="button" class="fs-vorher" title="Seite ohne Änderungen zeigen">Original</button>' +
    '<button type="button" class="fs-zu" title="Leiste klein machen" aria-label="Klein machen">×</button></span>';
  var hilfe = el('div', 'fs-ui fs-hilfe');
  var tafel = el('aside', 'fs-ui fs-tafel');
  var toast = el('div', 'fs-ui fs-toast');
  var rahmen = el('div', 'fs-ui fs-rahmen');
  var HILFE = {
    ansehen: 'Die Seite mit allen Änderungen. Unten wählen, was angepasst werden soll.',
    text: 'Auf ein Wort klicken und direkt schreiben. Enter speichert, Shift+Enter macht eine neue Zeile, Esc bricht ab.',
    schrift: 'Auf einen Text klicken, dann rechts Schriftart, Grösse, Stärke und Abstände wählen.',
    abschnitte: 'Abstände oben und unten mit den Griffen ziehen oder mit plus und minus setzen. Pfeile verschieben den ganzen Abschnitt.',
    wuensche: 'Auf einen Abschnitt klicken und aufschreiben, was sich dort ändern soll. Robert sieht es und antwortet.',
    liste: 'Alles, was geändert wurde, mit vorher und nachher. Jede Änderung lässt sich einzeln zurücknehmen.'
  };

  function modusSetzen(m) {
    if (bearbeitet) fertig(true);
    if (ohne && (m === 'text' || m === 'schrift' || m === 'abschnitte')) {
      hinweis('Gerade ist das Original zu sehen. Erst oben «Mit Änderungen» wählen, dann bearbeiten.');
      m = 'ansehen';
    }
    modus = m;
    html.setAttribute('data-fs-modus', m);
    html.classList.remove('fs-klein');
    leiste.querySelectorAll('[data-modus]').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-modus') === m); });
    hilfe.textContent = HILFE[m];
    hilfe.classList.toggle('da', m !== 'ansehen');
    rahmen.style.display = 'none';
    griffe(m === 'abschnitte');
    if (m === 'liste') liste(true);
    else if (m === 'wuensche') wunschTafel(null);
    else tafelZu();
  }
  leiste.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('fs-zu')) { if (html.classList.contains('fs-klein')) { html.classList.remove('fs-klein'); } else { modusSetzen('ansehen'); html.classList.add('fs-klein'); } return; }
    if (b.classList.contains('fs-vorher')) {
      try { sessionStorage.setItem('fs-ohne', ohne ? '0' : '1'); } catch (x) {}
      location.reload();
      return;
    }
    modusSetzen(b.getAttribute('data-modus'));
  });
  leiste.addEventListener('click', function (e) { if (html.classList.contains('fs-klein') && !e.target.closest('button')) html.classList.remove('fs-klein'); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !bearbeitet && modus !== 'ansehen' && !e.target.closest('.fs-tafel')) modusSetzen('ansehen');
  });

  function hinweis(text, rueck, fehler) {
    toast.innerHTML = '<p>' + text + '</p>' + (rueck ? '<button type="button">Rückgängig</button>' : '');
    toast.classList.toggle('fs-fehler', !!fehler);
    toast.classList.add('da');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('da'); }, rueck ? 10000 : 5000);
    if (rueck) toast.querySelector('button').onclick = function () { toast.classList.remove('da'); rueck(); };
  }
  function tafelZu() { tafel.classList.remove('da'); html.classList.remove('fs-tafel-da'); }
  function tafelAuf(inhalt) { tafel.innerHTML = inhalt; tafel.classList.add('da'); html.classList.add('fs-tafel-da'); tafel.scrollTop = 0; }

  /* Nur, was man sieht, bekommt einen Rahmen: unsichtbare Texte (noch nicht aufgetaucht, ausgeblendet, durchsichtig) nie (Robert 08.11.2026) */
  function zuSehen(z) {
    var r = z.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return false;
    for (var e = z; e && e !== document.documentElement; e = e.parentElement) {
      var st = getComputedStyle(e);
      if (st.visibility === 'hidden' || st.display === 'none' || parseFloat(st.opacity) < 0.15) return false;
    }
    var f = getComputedStyle(z).color.match(/rgba?\(([^)]+)\)/);
    if (f && f[1].split(',').length === 4 && parseFloat(f[1].split(',')[3]) < 0.15) return false;
    return true;
  }
  /* Rahmen beim Überfahren */
  document.addEventListener('mousemove', function (e) {
    if (modus === 'ansehen' || modus === 'liste' || modus === 'abschnitte' || bearbeitet || unser(e.target)) { if (!bearbeitet) rahmen.style.display = 'none'; return; }
    var z = modus === 'text' ? textBlatt(e.target) : modus === 'schrift' ? schriftZiel(e.target) : e.target.closest && e.target.closest('main > *');
    if (!z || !z.closest('main, footer') || !zuSehen(z)) { rahmen.style.display = 'none'; return; }
    var r = z.getBoundingClientRect();
    rahmen.style.cssText = 'display:block;left:' + (r.left - 6) + 'px;top:' + (r.top - 4) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 8) + 'px';
    rahmen.setAttribute('data-art', modus);
  }, { passive: true });
  /* Beim Scrollen fährt der Rahmen mit dem bearbeiteten Text mit; ohne Bearbeitung verschwindet er (Robert 08.11.2026: «der Rahmen geht mit, obwohl das … gar nicht mehr da ist») */
  var rahmenTakt = 0;
  function rahmenNach() {
    rahmenTakt = 0;
    if (!bearbeitet || !bearbeitet.isConnected) { rahmen.style.display = 'none'; return; }
    var rr = bearbeitet.getBoundingClientRect();
    rahmen.style.cssText = 'display:block;left:' + (rr.left - 6) + 'px;top:' + (rr.top - 4) + 'px;width:' + (rr.width + 12) + 'px;height:' + (rr.height + 8) + 'px';
  }
  addEventListener('scroll', function () { if (!bearbeitet) { rahmen.style.display = 'none'; return; } if (!rahmenTakt) rahmenTakt = requestAnimationFrame(rahmenNach); }, { passive: true, capture: true });
  addEventListener('resize', function () { if (bearbeitet && !rahmenTakt) rahmenTakt = requestAnimationFrame(rahmenNach); });
  addEventListener('load', function () { if (griffListe.length) griffeNachlegen(); });
  setInterval(function () { if (griffListe.length) griffeNachlegen(); }, 1500);   // Abschnitte wachsen beim Scrollen (Auftritte, Bilder): Griffe leise nachführen

  /* Klicks der Seite (Links, Blättern, Chat) ruhen, solange bearbeitet wird */
  function fangen(e) {
    if (modus === 'ansehen' || unser(e.target)) return;
    if (bearbeitet && bearbeitet.contains(e.target)) return;
    if (modus === 'liste') return;
    e.stopPropagation();
    if (e.type === 'touchstart') return;   // am Handy nur die Seite ruhigstellen, das Scrollen bleibt
    e.preventDefault();
    if (e.type !== 'click') return;
    if (modus === 'text') textStart(e.target);
    else if (modus === 'schrift') schriftStart(e.target);
    else if (modus === 'wuensche') { var s = e.target.closest('main > *'); if (s) wunschTafel(s); }
  }
  ['click', 'pointerdown', 'mousedown'].forEach(function (t) { document.addEventListener(t, fangen, true); });
  document.addEventListener('touchstart', fangen, { capture: true, passive: true });

  /* ------------------------------------------------------------------ Wörter */
  var bearbeitet = null;
  function textStart(ziel) {
    var b = textBlatt(ziel);
    if (!b || !b.closest('main, footer')) return;
    if (bearbeitet && bearbeitet !== b) fertig(true);
    if (bearbeitet === b) return;
    bearbeitet = b;
    var g = messen(b);
    b._vorher = sauberesHtml(b);
    b._original = g.html;
    b.setAttribute('contenteditable', 'true');
    b.classList.add('fs-schreibt');
    b.focus();
    var r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
    var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    var rr = b.getBoundingClientRect();
    rahmen.style.cssText = 'display:block;left:' + (rr.left - 6) + 'px;top:' + (rr.top - 4) + 'px;width:' + (rr.width + 12) + 'px;height:' + (rr.height + 8) + 'px';
    rahmen.setAttribute('data-art', 'schreibt');
    b.addEventListener('keydown', tasten);
    b.addEventListener('blur', blur);
    b.addEventListener('paste', einfuegen);
    b.addEventListener('input', rahmenNach);
  }
  function einfuegen(e) {   // nur reiner Text, nie fremde Formate
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!document.execCommand('insertText', false, t)) {
      var sel = getSelection(); if (!sel.rangeCount) return;
      var r = sel.getRangeAt(0); r.deleteContents(); r.insertNode(document.createTextNode(t)); r.collapse(false);
    }
  }
  function tasten(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fertig(true); }
    else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak'); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fertig(false); }
  }
  function blur() { setTimeout(function () { if (bearbeitet && document.activeElement !== bearbeitet) fertig(true); }, 120); }
  function fertig(speichern) {
    var b = bearbeitet;
    if (!b) return;
    bearbeitet = null;
    rahmen.style.display = 'none';
    b.removeEventListener('keydown', tasten);
    b.removeEventListener('blur', blur);
    b.removeEventListener('paste', einfuegen);
    b.removeEventListener('input', rahmenNach);
    b.removeAttribute('contenteditable');
    b.classList.remove('fs-schreibt');
    if (!b.getAttribute('class')) b.removeAttribute('class');
    var neu = sauberesHtml(b), vorher = b._vorher, original = b._original;
    if (!speichern || norm(neu) === norm(vorher)) { b.innerHTML = vorher; if (!speichern) hinweis('Nicht geändert.'); return; }
    b.innerHTML = neu;
    var zk = 'text|' + SEITE + '|' + pfad(b);
    var a = { zk: zk, art: 'text', seite: SEITE, ziel: pfad(b), vorher: original, nachher: neu, abschnitt: abschnittName(b.closest('main > *') || b) };
    if (norm(neu) === norm(original)) {   // zurück auf den Ausgangstext: der Eintrag kann weg
      var alt = eintrag(zk);
      if (alt) senden({ op: 'entfernen', id: alt.id }).then(function () { b.removeAttribute('data-fs'); hinweis('Wieder wie im Original.'); });
      return;
    }
    var vn = ausschnitt(vorher, neu, 60);
    sichern(a, 'Gespeichert. <s>' + esc(vn[0]) + '</s> <span>' + esc(vn[1]) + '</span>', function () { b.innerHTML = vorher; }, function () { b.setAttribute('data-fs', '1'); })
      .catch(function () { b.innerHTML = vorher; });
  }

  /* ------------------------------------------------------------------ Schrift */
  function stilText(w) {
    var t = [];
    w = w || {};
    if (w.schrift) t.push(w.schrift);
    if (w.groesse && w.groesse !== 100) t.push('Grösse ' + w.groesse + ' %');
    if (w.gewicht) t.push('Stärke ' + w.gewicht);
    if (w.zeilen) t.push('Zeilen ' + w.zeilen);
    if (w.laufweite !== undefined && w.laufweite !== null) t.push('Buchstaben ' + w.laufweite + ' em');
    return t.join(' · ') || 'wie im Original';
  }
  function schriftStart(ziel) {
    var z = schriftZiel(ziel);
    if (!z || !z.closest('main, footer')) return;
    stilLeeren(z);
    var cs = getComputedStyle(z);
    var sig = zeichen(z);
    var vorhanden = aktiv().filter(function (a) { return a.art === 'stil' && ((a.umfang === 'element' && a.ziel === pfad(z)) || (a.umfang !== 'element' && a.ziel === sig)); }).pop();
    var w = vorhanden ? JSON.parse(JSON.stringify(vorhanden.werte || {})) : {};
    var umfang = vorhanden ? vorhanden.umfang : 'element';
    var jetzt = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    var gleiche = stilZiele({ umfang: 'seite', ziel: sig }).length;
    var zwischenstand = function () {   // was gerade gilt, wieder herstellen (Vorschau verwerfen)
      [z].concat(stilZiele({ umfang: 'seite', ziel: sig })).forEach(stilLeeren);
      aktiv().forEach(function (a) { if (a.art === 'stil') stilZiele(a).forEach(function (e) { stilSetzen(e, a.werte || {}); }); });
    };
    zwischenstand();
    tafelAuf('<div class="fs-kopf"><small>Schrift</small><h3>' + esc(kurz(textVon(z), 60)) + '</h3><button type="button" class="fs-x" aria-label="Schliessen">×</button></div>' +
      '<label>Schriftart<select data-w="schrift"><option value="">wie bisher (' + esc(jetzt) + ')</option>' +
      SCHRIFTEN.map(function (s) { return '<option value="' + s[0] + '"' + (w.schrift === s[0] ? ' selected' : '') + '>' + s[0] + (s[1] === 'google' ? ' · neu' : '') + '</option>'; }).join('') + '</select></label>' +
      regler('groesse', 'Grösse', w.groesse || 100, 50, 180, 1, ' %') +
      '<label>Stärke<select data-w="gewicht"><option value="">wie bisher (' + cs.fontWeight + ')</option>' +
      [[300, 'Leicht'], [400, 'Normal'], [500, 'Mittel'], [600, 'Halbfett'], [700, 'Fett']].map(function (g) { return '<option value="' + g[0] + '"' + (+w.gewicht === g[0] ? ' selected' : '') + '>' + g[1] + ' · ' + g[0] + '</option>'; }).join('') + '</select></label>' +
      regler('zeilen', 'Zeilenabstand', w.zeilen || (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1.2).toFixed(2), 0.8, 2.2, 0.05, '') +
      regler('laufweite', 'Buchstabenabstand', w.laufweite !== undefined ? w.laufweite : ((parseFloat(cs.letterSpacing) || 0) / parseFloat(cs.fontSize)).toFixed(3), -0.08, 0.3, 0.005, ' em') +
      '<fieldset><legend>Gilt für</legend>' +
      '<label class="fs-wahl"><input type="radio" name="fs-umfang" value="element"' + (umfang === 'element' ? ' checked' : '') + '> nur diesen Text</label>' +
      '<label class="fs-wahl"><input type="radio" name="fs-umfang" value="seite"' + (umfang === 'seite' ? ' checked' : '') + '> alle gleichen auf dieser Seite (' + gleiche + ')</label>' +
      '<label class="fs-wahl"><input type="radio" name="fs-umfang" value="ueberall"' + (umfang === 'ueberall' ? ' checked' : '') + '> alle gleichen auf allen Seiten</label></fieldset>' +
      '<div class="fs-knoepfe"><button type="button" class="fs-haupt">Speichern</button><button type="button" class="fs-neben" data-ab>Abbrechen</button>' + (vorhanden ? '<button type="button" class="fs-neben" data-weg>Wie im Original</button>' : '') + '</div>');
    var vorschau = function () {
      var u = tafel.querySelector('[name=fs-umfang]:checked').value;
      lesen();
      zwischenstand();
      (u === 'element' ? [z] : stilZiele({ umfang: u, ziel: sig })).forEach(function (e) { stilSetzen(e, w); });
    };
    function lesen() {
      tafel.querySelectorAll('[data-w]').forEach(function (f) {
        var k = f.getAttribute('data-w'), v = f.value;
        var o = tafel.querySelector('[data-zeige="' + k + '"]');
        if (o) o.textContent = f.value + (f.getAttribute('data-einheit') || '');
        if (v === '') { delete w[k]; return; }
        w[k] = k === 'schrift' ? v : parseFloat(v);
      });
    }
    tafel.querySelectorAll('[data-w], [name=fs-umfang]').forEach(function (f) { f.addEventListener('input', vorschau); f.addEventListener('change', vorschau); });
    tafel.querySelector('.fs-x').onclick = tafel.querySelector('[data-ab]').onclick = function () { zwischenstand(); tafelZu(); };
    tafel.querySelector('.fs-haupt').onclick = function () {
      lesen();
      var u = tafel.querySelector('[name=fs-umfang]:checked').value;
      var ziel = u === 'element' ? pfad(z) : sig;
      var vorherText = vorhanden ? stilText(vorhanden.werte) : 'wie im Original';
      var a = { zk: 'stil|' + (u === 'ueberall' ? '*' : SEITE) + '|' + u + '|' + ziel, art: 'stil', seite: u === 'ueberall' ? '*' : SEITE,
        umfang: u, ziel: ziel, werte: w, beispiel: kurz(textVon(z), 60), abschnitt: abschnittName(z.closest('main > *') || z) };
      if (vorhanden && vorhanden.zk !== a.zk) senden({ op: 'entfernen', id: vorhanden.id });   // Umfang gewechselt: der alte Eintrag weicht
      sichern(a, 'Schrift gespeichert. <s>' + esc(vorherText) + '</s> <span>' + esc(stilText(w)) + '</span>', function () { zwischenstand(); }, function () { tafelZu(); });
    };
    var weg = tafel.querySelector('[data-weg]');
    if (weg) weg.onclick = function () {
      var altKopie = kopie(vorhanden);
      senden({ op: 'entfernen', id: vorhanden.id }).then(function () {
        zwischenstand(); tafelZu();
        hinweis('Schrift wieder wie im Original.', function () { senden({ op: 'setzen', a: altKopie }).then(zwischenstand); });
      });
    };
  }
  function regler(k, name, wert, min, max, schritt, einheit) {
    return '<label>' + name + ' <output data-zeige="' + k + '">' + wert + einheit + '</output><input type="range" data-w="' + k + '" data-einheit="' + einheit +
      '" min="' + min + '" max="' + max + '" step="' + schritt + '" value="' + wert + '"></label>';
  }

  /* ------------------------------------------------------------------ Abschnitte */
  var griffListe = [], griffHof = el('div', 'fs-ui fs-griffe');
  /* die Griffe liegen nicht im Abschnitt (dort verdecken sie sich gegenseitig oder werden abgeschnitten), sondern in einer eigenen Ebene
     über der Seite, ausgerichtet am Rand des Abschnitts */
  function griffLegen(k) {
    var r = k._abschnitt.getBoundingClientRect();
    k.style.top = (r.top + scrollY) + 'px';
    k.style.height = r.height + 'px';
    /* schmale Abschnitte (Band, Leiste): das Schild hängt über dem Abschnitt statt in ihm, sonst verdeckt es ihn und das nächste Schild */
    k.classList.toggle('fs-ab--schmal', r.height < 130 && r.top + scrollY > 80);
  }
  /* zwei Schilder dürfen nie übereinander liegen: kommt eines dem vorigen zu nahe, rückt es an den rechten Rand */
  function entzerren() {
    var vorher = null;
    griffListe.forEach(function (k) {
      k.classList.remove('fs-ab--rechts');
      var kopf = k.querySelector('.fs-ab-kopf'), r = kopf.getBoundingClientRect();
      if (vorher && r.top < vorher.bottom + 8 && r.bottom > vorher.top - 8 && r.left < vorher.right + 8) {
        k.classList.add('fs-ab--rechts');
        r = kopf.getBoundingClientRect();
      }
      vorher = r;
    });
    /* dasselbe für die Abstands-Griffe: liegt einer auf einem Schild oder einem anderen Griff, rückt er seitlich weiter */
    var belegt = griffListe.map(function (k) { return k.querySelector('.fs-ab-kopf').getBoundingClientRect(); });
    var trifft = function (r) { return belegt.some(function (b) { return r.top < b.bottom + 3 && b.top < r.bottom + 3 && r.left < b.right + 3 && b.left < r.right + 3; }); };
    griffListe.forEach(function (k) {
      k.querySelectorAll('.fs-griff span').forEach(function (g) {
        g.style.marginLeft = ''; g.style.marginTop = '';
        var r = g.getBoundingClientRect(), w = r.width + 12, h = r.height + 6;
        var drin = function (q) { return q.left >= 8 && q.right <= innerWidth - 8; };
        if (trifft(r) || !drin(r)) {
          /* erst seitlich, dann (am Handy) nach unten ausweichen, nie aus dem Bild */
          var wege = [[w, 0], [-w, 0], [2 * w, 0], [-2 * w, 0], [0, h], [w, h], [-w, h], [0, 2 * h], [w, 2 * h], [-w, 2 * h], [0, 3 * h], [w, 3 * h], [-w, 3 * h], [0, -h]];
          for (var n = 0; n < wege.length; n++) {
            g.style.marginLeft = wege[n][0] + 'px'; g.style.marginTop = wege[n][1] + 'px';
            r = g.getBoundingClientRect();
            if (!trifft(r) && drin(r)) break;
          }
        }
        belegt.push(r);
      });
    });
  }
  function griffeNachlegen() { griffListe.forEach(griffLegen); entzerren(); }
  function abstandVon(s) {
    var key = abschnittKey(s);
    var a = aktiv().filter(function (x) { return x.art === 'abstand' && x.ziel === key; })[0];
    return { key: key, a: a, w: a ? { oben: a.werte.oben || 0, unten: a.werte.unten || 0 } : { oben: 0, unten: 0 } };
  }
  function griffe(an) {
    griffListe.forEach(function (g) { g.remove(); });
    griffListe = [];
    if (!an) return;
    abschnitte().forEach(function (s, i, alle) {
      var st = abstandVon(s);
      var k = el('div', 'fs-ui fs-ab');
      k.innerHTML = '<div class="fs-ab-kopf"><b>' + esc(abschnittName(s)) + '</b>' +
        '<span><button type="button" data-zug="hoch" ' + (i === 0 ? 'disabled' : '') + ' title="Abschnitt nach oben">↑</button>' +
        '<button type="button" data-zug="runter" ' + (i === alle.length - 1 ? 'disabled' : '') + ' title="Abschnitt nach unten">↓</button>' +
        '<button type="button" data-wunsch title="Wunsch zu diesem Abschnitt">Wunsch</button></span></div>' +
        '<div class="fs-griff fs-griff--oben" data-seite="oben" title="Ziehen: Abstand oben"><span><button type="button" data-st="-16" aria-label="weniger">−</button><output>' + wertText(st.w.oben) + '</output><button type="button" data-st="16" aria-label="mehr">+</button></span></div>' +
        '<div class="fs-griff fs-griff--unten" data-seite="unten" title="Ziehen: Abstand unten"><span><button type="button" data-st="-16" aria-label="weniger">−</button><output>' + wertText(st.w.unten) + '</output><button type="button" data-st="16" aria-label="mehr">+</button></span></div>';
      k._abschnitt = s;
      griffHof.appendChild(k);
      k.classList.toggle('fs-ab--hell', istHell(s));
      griffListe.push(k);
      griffLegen(k);
      var setze = function (seite, wert) {
        st.w[seite] = Math.max(-400, Math.min(600, Math.round(wert)));
        abstandSetzen(s, st.w);
        k.querySelector('.fs-griff--' + seite + ' output').textContent = wertText(st.w[seite]);
        griffeNachlegen();
      };
      var sichernAbstand = function (vorher) {
        var a = { zk: 'abstand|' + SEITE + '|' + st.key, art: 'abstand', seite: SEITE, ziel: st.key, werte: { oben: st.w.oben, unten: st.w.unten }, abschnitt: abschnittName(s) };
        if (!st.w.oben && !st.w.unten) {   // beide auf null: der Eintrag kann weg
          var alt = eintrag(a.zk);
          if (alt) senden({ op: 'entfernen', id: alt.id }).then(function () { abstandLeeren(s); hinweis('Abstand wieder wie im Original.'); });
          return;
        }
        sichern(a, 'Abstand gespeichert. <s>oben ' + wertText(vorher.oben) + ', unten ' + wertText(vorher.unten) + '</s> <span>oben ' + wertText(st.w.oben) + ', unten ' + wertText(st.w.unten) + '</span>',
          function () { st.w = { oben: vorher.oben, unten: vorher.unten }; if (!st.w.oben && !st.w.unten) abstandLeeren(s); else abstandSetzen(s, st.w); griffe(true); });
      };
      k.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-st')) { var seite = b.closest('.fs-griff').getAttribute('data-seite'), vorher = { oben: st.w.oben, unten: st.w.unten }; setze(seite, st.w[seite] + +b.getAttribute('data-st')); sichernAbstand(vorher); }
        else if (b.hasAttribute('data-zug')) verschieben(s, b.getAttribute('data-zug'));
        else if (b.hasAttribute('data-wunsch')) { modusSetzen('wuensche'); wunschTafel(s); }
      });
      k.querySelectorAll('.fs-griff').forEach(function (g) {
        g.addEventListener('pointerdown', function (e) {
          if (e.target.closest('button')) return;
          e.preventDefault();
          var seite = g.getAttribute('data-seite'), y0 = e.clientY, w0 = st.w[seite], vorher = { oben: st.w.oben, unten: st.w.unten };
          g.setPointerCapture(e.pointerId);
          g.classList.add('zieht');
          var zug = function (ev) { setze(seite, w0 + (seite === 'oben' ? -(ev.clientY - y0) : ev.clientY - y0) / schnittWert()); };
          var los = function () { g.removeEventListener('pointermove', zug); g.removeEventListener('pointerup', los); g.removeEventListener('pointercancel', los); g.classList.remove('zieht'); if (st.w[seite] !== w0) sichernAbstand(vorher); };
          g.addEventListener('pointermove', zug);
          g.addEventListener('pointerup', los);
          g.addEventListener('pointercancel', los);
        });
      });
    });
    entzerren();
  }
  function istHell(s) {
    var c = getComputedStyle(s).backgroundColor, m = /(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);
    if (!m || (m[4] !== undefined && +m[4] < 0.3)) { c = getComputedStyle(body).backgroundColor; m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c); }
    return m ? (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) > 150 : false;
  }
  function wertText(v) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) + ' px'; }
  function verschieben(s, wohin) {
    var alle = abschnitte(), i = alle.indexOf(s), j = wohin === 'hoch' ? i - 1 : i + 1;
    if (j < 0 || j >= alle.length) return;
    var vorherListe = alle.map(abschnittKey);
    if (wohin === 'hoch') alle[j].before(s); else alle[j].after(s);
    var liste = abschnitte().map(abschnittKey);
    var a = { zk: 'reihenfolge|' + SEITE, art: 'reihenfolge', seite: SEITE, ziel: 'main', werte: { liste: liste }, abschnitt: abschnittName(s) };
    sichern(a, 'Reihenfolge gespeichert: «' + esc(abschnittName(s)) + '» ist jetzt ' + (wohin === 'hoch' ? 'weiter oben' : 'weiter unten') + '.',
      function () { reihenfolgeSetzen(vorherListe); griffe(true); s.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
      function () { griffe(true); s.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }

  /* ------------------------------------------------------------------ Wünsche */
  var STATUS = { offen: 'offen', besprochen: 'besprochen', erledigt: 'erledigt' };
  function wunschTafel(s) {
    var key = s ? abschnittKey(s) : '', name = s ? abschnittName(s) : '';
    var hier = doc.wuensche.filter(function (w) { return w.seite === SEITE && w.status !== 'erledigt'; });
    tafelAuf('<div class="fs-kopf"><small>Wünsche · ' + esc(SEITEN_NAME[SEITE] || SEITE) + '</small><h3>' + (s ? esc(name) : 'Was soll sich ändern?') + '</h3><button type="button" class="fs-x" aria-label="Schliessen">×</button></div>' +
      '<p class="fs-leise">' + (s ? 'Für Umbauten, die mehr sind als Wörter und Abstände: was soll dieser Abschnitt können, zeigen oder weglassen?' :
        'Einen Abschnitt auf der Seite anklicken, um den Wunsch dort festzumachen, oder hier allgemein für die Seite schreiben.') + '</p>' +
      '<textarea rows="5" placeholder="' + (s ? 'Zum Beispiel: Die drei Karten wirken zu gleich. Lieber ein grosses Bild und zwei kleine.' : 'Wunsch für die ganze Seite …') + '"></textarea>' +
      '<div class="fs-knoepfe"><button type="button" class="fs-haupt">Wunsch speichern</button></div>' +
      (hier.length ? '<h4>Offen auf dieser Seite</h4>' + hier.slice().reverse().map(wunschKarte).join('') : '') +
      '<p class="fs-leise"><button type="button" class="fs-link" data-alle>Alle Wünsche aller Seiten</button></p>');
    tafel.querySelector('.fs-x').onclick = function () { modusSetzen('ansehen'); };
    tafel.querySelector('[data-alle]').onclick = function () { modus = 'liste'; html.setAttribute('data-fs-modus', 'liste'); leiste.querySelectorAll('[data-modus]').forEach(function (b) { b.classList.toggle('an', b.getAttribute('data-modus') === 'liste'); }); hilfe.textContent = HILFE.liste; liste(true, 'wuensche'); };
    tafel.querySelector('.fs-haupt').onclick = function () {
      var t = tafel.querySelector('textarea').value.trim();
      if (!t) { tafel.querySelector('textarea').focus(); return; }
      senden({ op: 'wunsch', w: { seite: SEITE, abschnitt: key, name: name, text: t } }).then(function () {
        var neu = doc.wuensche[doc.wuensche.length - 1];
        hinweis('Wunsch gespeichert' + (name ? ' zu «' + esc(name) + '»' : '') + '. Robert sieht ihn in seiner Liste.', neu ? function () { senden({ op: 'wunsch_weg', id: neu.id }).then(function () { wunschTafel(s); hinweis('Wunsch zurückgenommen.'); }); } : null);
        wunschTafel(s);
      });
    };
    wunschKnoepfe();
    if (s) setTimeout(function () { tafel.querySelector('textarea').focus(); }, 60);
  }
  function wunschKarte(w) {
    return '<div class="fs-wunsch" data-id="' + w.id + '"><div class="fs-wunsch-kopf"><b>' + esc(w.name || 'ganze Seite') + '</b><span class="fs-status fs-status--' + w.status + '">' + (STATUS[w.status] || w.status) + '</span></div>' +
      '<p>' + esc(w.text).replace(/\n/g, '<br>') + '</p><small>' + esc(w.wer) + ' · ' + zeit(w.zeit) + (w.seite !== SEITE ? ' · ' + esc(SEITEN_NAME[w.seite] || w.seite) : '') + '</small>' +
      (w.antworten || []).map(function (a) { return '<div class="fs-antwort"><p>' + esc(a.text).replace(/\n/g, '<br>') + '</p><small>' + esc(a.wer) + ' · ' + zeit(a.zeit) + '</small></div>'; }).join('') +
      '<div class="fs-antworten"><input type="text" placeholder="Antworten …"><button type="button" data-w-op="antwort">Senden</button></div>' +
      '<div class="fs-wunsch-fuss">' + (w.status !== 'besprochen' ? '<button type="button" class="fs-link" data-w-op="besprochen">besprochen</button>' : '') +
      (w.status !== 'erledigt' ? '<button type="button" class="fs-link" data-w-op="erledigt">erledigt</button>' : '<button type="button" class="fs-link" data-w-op="offen">wieder offen</button>') +
      (w.wer === wer || wer === 'Robert' ? '<button type="button" class="fs-link" data-w-op="weg">löschen</button>' : '') +
      (w.abschnitt && w.seite === SEITE ? '<button type="button" class="fs-link" data-w-op="zeigen">zeigen</button>' : '') +
      (w.seite !== SEITE ? '<a class="fs-link" href="' + seitenLink(w.seite) + '">zur Seite</a>' : '') + '</div></div>';
  }
  function wunschKnoepfe() {
    tafel.querySelectorAll('.fs-wunsch').forEach(function (k) {
      var id = k.getAttribute('data-id');
      var w = doc.wuensche.filter(function (x) { return x.id === id; })[0];
      var neu = function () { if (modus === 'liste') liste(true, 'wuensche'); else wunschTafel(null); };
      k.querySelectorAll('[data-w-op]').forEach(function (b) {
        b.onclick = function () {
          var op = b.getAttribute('data-w-op');
          if (op === 'antwort') { var t = k.querySelector('input').value.trim(); if (t) senden({ op: 'antwort', id: id, text: t }).then(function () { neu(); hinweis('Antwort gespeichert.'); }); }
          else if (op === 'weg') { wunschLoeschen(k, w, neu); }
          else if (op === 'zeigen') { var s = w && abschnittVonKey(w.abschnitt); if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); s.classList.add('fs-blitz'); setTimeout(function () { s.classList.remove('fs-blitz'); }, 2200); } }
          else {
            var vorher = w ? w.status : 'offen';
            senden({ op: 'wunsch_status', id: id, status: op }).then(function () {
              neu();
              hinweis('Wunsch ist jetzt «' + op + '». <s>' + vorher + '</s> <span>' + op + '</span>', function () { senden({ op: 'wunsch_status', id: id, status: vorher }).then(function () { neu(); hinweis('Zurückgenommen.'); }); });
            });
          }
        };
      });
      var i = k.querySelector('input');
      i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); k.querySelector('[data-w-op=antwort]').click(); } });
    });
  }
  function wunschLoeschen(k, w, neu) {   // Rückfrage im Werkzeug, nichts geht ohne Bestätigung verloren
    var frage = k.querySelector('.fs-frage');
    if (frage) return;
    frage = el('div', 'fs-frage', '<p>Diesen Wunsch wirklich löschen?</p><button type="button" class="fs-haupt" data-ja>Ja, löschen</button><button type="button" class="fs-neben" data-nein>Behalten</button>');
    k.appendChild(frage);
    frage.querySelector('[data-nein]').onclick = function () { frage.remove(); };
    frage.querySelector('[data-ja]').onclick = function () {
      var alt = w ? JSON.parse(JSON.stringify(w)) : null;
      senden({ op: 'wunsch_weg', id: w.id }).then(function () {
        neu();
        hinweis('Wunsch gelöscht: «' + esc(kurz(alt ? alt.text : '', 50)) + '»', alt ? function () {
          senden({ op: 'wunsch', w: { seite: alt.seite, abschnitt: alt.abschnitt, name: alt.name, text: alt.text } }).then(function () { neu(); hinweis('Wunsch ist wieder da (als neuer Eintrag).'); });
        } : null);
      });
    };
  }

  /* ------------------------------------------------------------------ Liste */
  var listeReiter = 'aenderungen';
  function beschreibung(a) {
    if (a.art === 'text') { var vn = ausschnitt(a.vorher, a.nachher, 90); return '<s>' + esc(vn[0]) + '</s><span>' + esc(vn[1]) + '</span>'; }
    if (a.art === 'stil') {
      return '<span>' + esc(stilText(a.werte)) + '</span><small>' + (a.umfang === 'element' ? 'nur «' + esc(a.beispiel) + '»' : a.umfang === 'seite' ? 'alle gleichen auf der Seite, z. B. «' + esc(a.beispiel) + '»' : 'alle gleichen auf allen Seiten, z. B. «' + esc(a.beispiel) + '»') + '</small>';
    }
    if (a.art === 'abstand') return '<span>Abstand oben ' + wertText(a.werte.oben || 0) + ', unten ' + wertText(a.werte.unten || 0) + '</span>';
    if (a.art === 'reihenfolge') return '<span>Neue Reihenfolge der Abschnitte</span><small>zuletzt bewegt: «' + esc(a.abschnitt || '') + '»</small>';
    return '';
  }
  var ART = { text: 'Wörter', stil: 'Schrift', abstand: 'Abstand', reihenfolge: 'Reihenfolge' };
  function liste(zeigen, reiter) {
    var offen = doc.aenderungen.filter(function (a) { return a.status !== 'übernommen'; });
    var wOffen = doc.wuensche.filter(function (w) { return w.status !== 'erledigt'; });
    leiste.querySelector('[data-modus=liste] em').textContent = offen.length ? offen.length : '';
    leiste.querySelector('[data-modus=wuensche] em').textContent = wOffen.length ? wOffen.length : '';
    if (!zeigen && !(modus === 'liste' && tafel.classList.contains('da'))) return;
    if (reiter) listeReiter = reiter;
    var gruppen = {};
    offen.forEach(function (a) { (gruppen[a.seite] = gruppen[a.seite] || []).push(a); });
    var inhalt = '<div class="fs-kopf"><small>Website bearbeiten</small><h3>' + (listeReiter === 'wuensche' ? 'Alle Wünsche' : 'Alle Änderungen') + '</h3><button type="button" class="fs-x" aria-label="Schliessen">×</button></div>' +
      '<div class="fs-reiter"><button type="button" data-r="aenderungen" class="' + (listeReiter === 'aenderungen' ? 'an' : '') + '">Änderungen · ' + offen.length + '</button>' +
      '<button type="button" data-r="wuensche" class="' + (listeReiter === 'wuensche' ? 'an' : '') + '">Wünsche · ' + wOffen.length + '</button></div>';
    if (listeReiter === 'wuensche') {
      inhalt += doc.wuensche.length ? doc.wuensche.slice().reverse().map(wunschKarte).join('') : '<p class="fs-leise">Noch keine Wünsche.</p>';
    } else {
      var seiten = Object.keys(gruppen).sort(function (x, y) { return (x === SEITE ? -1 : x === '*' ? 0 : 1) - (y === SEITE ? -1 : y === '*' ? 0 : 1); });
      inhalt += seiten.length ? seiten.map(function (sk) {
        return '<h4>' + esc(sk === '*' ? 'Alle Seiten' : SEITEN_NAME[sk] || sk) + (sk === SEITE ? ' · diese Seite' : '') + '</h4>' + gruppen[sk].slice().reverse().map(function (a) {
          var weg = (a.seite === SEITE || a.seite === '*') && a._da === false && !ohne;
          return '<div class="fs-eintrag' + (weg ? ' fs-eintrag--weg' : '') + '" data-id="' + a.id + '"><div class="fs-eintrag-kopf"><b>' + ART[a.art] + '</b><small>' + esc(a.abschnitt || '') + '</small></div>' +
            '<div class="fs-vn">' + beschreibung(a) + '</div>' + (weg ? '<p class="fs-warn">Auf der Seite nicht mehr gefunden. Robert sieht es sich an.</p>' : '') +
            '<div class="fs-eintrag-fuss"><small>' + esc(a.wer) + ' · ' + zeit(a.zeit) + '</small><span>' +
            ((a.seite === SEITE || a.seite === '*') && a.art !== 'reihenfolge' && !ohne ? '<button type="button" class="fs-link" data-op="zeigen">zeigen</button>' : '') +
            (a.seite !== SEITE && a.seite !== '*' ? '<a class="fs-link" href="' + seitenLink(a.seite) + '">zur Seite</a>' : '') +
            '<button type="button" class="fs-link" data-op="zurueck">zurücknehmen</button>' +
            (wer === 'Robert' ? '<button type="button" class="fs-link" data-op="uebernommen">übernommen</button>' : '') + '</span></div></div>';
        }).join('');
      }).join('') : '<p class="fs-leise">Noch keine Änderungen. Unten «Wörter», «Schrift» oder «Abschnitte» wählen und auf der Seite anfangen.</p>';
      var fertigListe = doc.aenderungen.filter(function (a) { return a.status === 'übernommen'; });
      if (fertigListe.length) inhalt += '<p class="fs-leise">' + fertigListe.length + ' Änderung' + (fertigListe.length > 1 ? 'en sind' : ' ist') + ' schon fest in der Seite.</p>';
    }
    tafelAuf(inhalt);
    tafel.querySelector('.fs-x').onclick = function () { modusSetzen('ansehen'); };
    tafel.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { liste(true, b.getAttribute('data-r')); }; });
    wunschKnoepfe();
    tafel.querySelectorAll('.fs-eintrag').forEach(function (k) {
      var a = doc.aenderungen.filter(function (x) { return x.id === k.getAttribute('data-id'); })[0];
      k.querySelectorAll('[data-op]').forEach(function (b) {
        b.onclick = function () {
          var op = b.getAttribute('data-op');
          if (op === 'zeigen') zeigeAenderung(a);
          else if (op === 'zurueck') zuruecknehmen(a);
          else if (op === 'uebernommen') senden({ op: 'uebernommen', ids: [a.id] }).then(function () {
            liste(true);
            hinweis('Als übernommen markiert: «' + esc(a.abschnitt || ART[a.art]) + '». Wird nicht mehr darübergelegt.', function () {
              senden({ op: 'setzen', a: kopie(a) }).then(function () { liste(true); hinweis('Wieder in der Liste.'); });
            });
          });
        };
      });
    });
  }
  function zuruecknehmen(a) {   // Eintrag entfernen und die Stelle auf der Seite gleich zurückstellen; Reihenfolge braucht ein Neuladen
    var altKopie = kopie(a);
    senden({ op: 'entfernen', id: a.id }).then(function () {
      if (a.seite === SEITE || a.seite === '*') {
        if (a.art === 'text') { var e = finden(a.ziel); if (e && grund.has(e)) { e.innerHTML = grund.get(e).html; e.removeAttribute('data-fs'); } }
        else if (a.art === 'stil') { stilZiele(a).forEach(stilLeeren); aktiv().forEach(function (x) { if (x.art === 'stil') stilZiele(x).forEach(function (e) { stilSetzen(e, x.werte || {}); }); }); }
        else if (a.art === 'abstand') { var s = abschnittVonKey(a.ziel); if (s) abstandLeeren(s); }
        else if (a.art === 'reihenfolge') { try { sessionStorage.setItem('fs-liste', '1'); } catch (x) {} location.reload(); return; }
      }
      liste(true);
      hinweis('Zurückgenommen: ' + ART[a.art] + (a.abschnitt ? ' in «' + esc(a.abschnitt) + '»' : '') + '.', function () {
        senden({ op: 'setzen', a: altKopie }).then(function () { anwenden(); liste(true); hinweis('Wieder da.'); });
      });
    });
  }
  function seitenLink(s) { return '/' + (s === 'index.html' ? '' : s); }
  function zeigeAenderung(a) {
    var z = a.art === 'text' ? finden(a.ziel) : a.art === 'stil' ? stilZiele(a)[0] : a.art === 'abstand' ? abschnittVonKey(a.ziel) : null;
    if (!z) { hinweis('Diese Stelle ist auf der Seite gerade nicht zu finden.'); return; }
    z.scrollIntoView({ behavior: 'smooth', block: 'center' });
    z.classList.add('fs-blitz');
    setTimeout(function () { z.classList.remove('fs-blitz'); }, 2200);
  }

  /* ------------------------------------------------------------------ Start */
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = (document.currentScript && document.currentScript.src || '/neu/runde3/feinschliff.js').replace(/feinschliff\.js.*$/, 'feinschliff.css?v=1');
  var cssDa = new Promise(function (ok) { css.onload = css.onerror = function () { ok(); }; setTimeout(ok, 2500); });
  document.head.appendChild(css);
  Promise.all([holen(), cssDa]).then(function (r) {
    var j = r[0];
    doc = j.doc; wer = j.wer;
    var warten = [];
    try { schluesselAufbauen(); warten = anwenden(); } catch (e) { console.error(e); }
    body.appendChild(griffHof); body.appendChild(rahmen); body.appendChild(leiste); body.appendChild(hilfe); body.appendChild(tafel); body.appendChild(toast);
    leiste.querySelector('.fs-wer').textContent = wer;
    html.classList.add('fs-an');
    if (ohne) {
      html.classList.add('fs-ohne');
      leiste.querySelector('.fs-vorher').textContent = 'Mit Änderungen';
      leiste.querySelector('.fs-vorher').classList.add('an');
      leiste.querySelector('.fs-vorher').title = 'Seite wieder mit Änderungen zeigen';
    }
    var start = 'ansehen';
    try { var q = new URLSearchParams(location.search).get('fs-modus'); if (q && MODI.some(function (m) { return m[0] === q; })) start = q; } catch (e) {}
    modusSetzen(start);
    liste(false);
    var ausListe = false;
    try { ausListe = sessionStorage.getItem('fs-liste') === '1'; sessionStorage.removeItem('fs-liste'); } catch (e) {}
    if (ausListe) modusSetzen('liste');
    /* erst zeigen, wenn gewählte Schriften da sind (kein Nachladen im ersten Bild) */
    var fertigGeladen = Promise.all(warten).then(function () { return document.fonts && document.fonts.ready ? document.fonts.ready : null; });
    Promise.race([fertigGeladen, new Promise(function (ok) { setTimeout(ok, 2500); })]).then(zeigen, zeigen);
  }).catch(function (e) {
    zeigen();
    if (e && e.message === 'schluessel') { try { localStorage.removeItem('tasty-feinschliff'); } catch (x) {} return; }
    console.warn('Feinschliff: Dienst nicht erreichbar', e);
    body.appendChild(toast);
    hinweis('Das Bearbeiten ist gerade nicht erreichbar. Bitte den Dienst starten und die Seite neu laden.', null, true);
  });
})();
