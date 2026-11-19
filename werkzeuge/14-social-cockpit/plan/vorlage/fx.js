/* Werkstatt txtme.social — Schaubilder, 3D-Modell, Vorführungen (Robert 02.10.2026).
   Regel: bewegt wird nur transform/opacity bzw. ein Licht auf einer Linie, und nur solange es im Bild ist. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var hoverable = window.matchMedia && matchMedia('(hover: hover)').matches;

  /* Startet fn einmal, sobald el ins Bild kommt; on/off für Dinge, die laufen, solange sie sichtbar sind */
  function onSeen(el, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: margin || '0px 0px -15% 0px' });
    io.observe(el);
  }
  function whileSeen(el, on, off) {
    if (!('IntersectionObserver' in window)) { on(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? on() : off(); }); }).observe(el);
  }
  function mix(t) {
    t = Math.max(0, Math.min(1, t));
    return 'rgb(' + Math.round(96 + 139 * t) + ',' + Math.round(196 - 107 * t) + ',' + Math.round(227 - 93 * t) + ')';
  }

  /* ---------------- Einflug beim Scrollen (Robert 02.10.2026: „beim Scrollen muss mehr passieren“) ----------------
     Texte kommen von unten, Kacheln nacheinander, Bilder ziehen heran, Linien an Zeitleisten und Listen
     wachsen mit dem Scrollen nach unten und schalten ihre Punkte frei. Nur transform/opacity. */
  if (!reduce && 'IntersectionObserver' in window) {
    var root = document.documentElement;
    root.classList.add('fx');
    var SKIP = '.board, .xboard, .journey, .viewer, .slides, .browser, .pages, .formula, .hero';
    var reveal = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('shown'); reveal.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    function mark(el, cls, d) {
      if (el.closest(SKIP) || el.classList.contains('rv') || el.classList.contains('rv-img')) return;
      el.classList.add(cls); if (d) el.style.setProperty('--d', d + 's'); reveal.observe(el);
    }
    // Einzelne Texte
    document.querySelectorAll('section.blk .eyebrow, section.blk h2, section.blk .lead, section.blk h3, section.blk .note, section.blk .finale .btn, .two-col > div > p, .voice .rule, .tbl, .demo, .viewer, .journey, .xboard, .formula')
      .forEach(function (el) {
        if (el.closest('.hero')) return;
        if (el.matches('.demo, .tbl, .journey, .xboard')) { el.classList.add('rv', 'rv-block'); reveal.observe(el); return; }
        if (el.matches('.viewer, .formula')) return;
        mark(el, 'rv', el.matches('.lead') ? 0.08 : el.matches('h2') ? 0.04 : 0);
      });
    // Gruppen: Kinder nacheinander
    document.querySelectorAll('.grid, .steps, .facts, .claims, .next, .numbers, .docs, .proj, .stacks, .quotes, .tags, .legend, .stages, .feat, .posts, .frames, .shoot, .stats')
      .forEach(function (g) {
        if (g.closest('.hero') && !g.matches('.stats')) return;
        [].forEach.call(g.children, function (c, i) { mark(c, 'rv', Math.min(i, 9) * 0.07); });
      });
    // Bilder ziehen heran
    document.querySelectorAll('.pics figure, .step button').forEach(function (f, i) { mark(f, 'rv-img', 0); });
    document.querySelectorAll('.pics').forEach(function (g) { [].forEach.call(g.children, function (c, i) { c.style.setProperty('--d', (Math.min(i, 7) * 0.08) + 's'); }); });
    // Hero: Auftakt beim Laden
    var hero = document.querySelector('section.blk .hero');
    if (hero) {
      var parts = [].slice.call(hero.querySelectorAll('.eyebrow, h1, .lead, .row, .hero-logo'));
      parts.forEach(function (p, i) { p.classList.add('rv'); p.style.setProperty('--d', (0.1 + i * 0.12) + 's'); });
      requestAnimationFrame(function () { requestAnimationFrame(function () { parts.forEach(function (p) { p.classList.add('shown'); }); }); });
      setTimeout(function () { parts.forEach(function (p) { p.classList.add('shown'); }); }, 160);
    }

    // Linien, die mit dem Scrollen nach unten wachsen: Zeitleisten und Punkt-Listen
    var rails = [];
    document.querySelectorAll('.tl, .list').forEach(function (l) {
      if (l.closest(SKIP)) return;
      var f = document.createElement('span'); f.className = 'rail-fill'; f.setAttribute('aria-hidden', 'true');
      l.classList.add('railed'); l.appendChild(f);
      rails.push({ el: l, fill: f, items: [].slice.call(l.children).filter(function (c) { return c.tagName === 'LI'; }), on: false });
    });
    var ticking = false;
    function tick() {
      ticking = false;
      var vh = innerHeight, line = vh * 0.62;
      rails.forEach(function (r) {
        if (!r.on) return;
        var b = r.el.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (line - b.top) / Math.max(1, b.height)));
        r.fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
        r.items.forEach(function (li) { li.classList.toggle('lit', li.getBoundingClientRect().top + 14 < line); });
      });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
    var railIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { rails.forEach(function (r) { if (r.el === e.target) r.on = e.isIntersecting; }); });
      req();
    }, { rootMargin: '20% 0px 20% 0px' });
    rails.forEach(function (r) { railIO.observe(r.el); });
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
  }

  /* ---------------- Schaubild (Board) ---------------- */
  var boardNo = 0;
  document.querySelectorAll('.xboard').forEach(function (root) {
    var D = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
    var gid = 'bg' + (++boardNo);
    var cols = D.cols.length;
    var FX = D.fx || D.cols.map(function (_, i) { return (i + 0.5) / cols; });
    root.insertAdjacentHTML('beforeend',
      '<div class="board-scroll"><div class="board-box">' +
      '<div class="board-heads" aria-hidden="true">' + D.cols.map(function (c, i) { return '<span style="left:' + (FX[i] * 100) + '%"><i>0' + (i + 1) + '</i>' + c + '</span>'; }).join('') + '</div>' +
      '<div class="board"><div class="room" aria-hidden="true"></div>' +
      '<svg class="lines" aria-hidden="true"><defs><linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="#60c4e3"/><stop offset="1" stop-color="#eb5986"/></linearGradient></defs></svg>' +
      '<svg class="heads" aria-hidden="true"></svg><div class="b-nodes"></div></div>' +
      (D.foot ? '<div class="board-foot">' + D.foot + '</div>' : '') +
      '</div></div>' +
      '<div class="board-panel" aria-live="polite"><div><div class="k">' + D.intro[0] + '</div><div class="t">' + D.intro[1] + '</div></div>' +
      '<div><p class="bp-p">' + D.intro[2] + '</p><p class="bp-path"></p></div>' +
      '<div class="row"><button class="btn" type="button">Nochmal abspielen</button></div></div>' +
      '<p class="board-hint">Tippe auf einen Baustein, dann siehst du seinen Weg. Am Handy lässt sich das Schaubild seitlich schieben.</p>');
    var canvas = root.querySelector('.board'), linesSvg = root.querySelector('.lines'), headsSvg = root.querySelector('.heads'), nodesEl = root.querySelector('.b-nodes');
    var grad = root.querySelector('#' + gid);
    var dot = ['#60c4e3', '#8fb0e0', '#c586b8', '#eb5986', '#eb5986'];
    var byId = {}, rows = 0;
    D.nodes.forEach(function (n) {
      var o = { id: n[0], col: n[1], row: n[2], label: n[3], sub: n[4], kind: n[5], title: n[6], text: n[7], leaves: n[8] || [] };
      rows = Math.max(rows, o.row + 1);
      var d = document.createElement('div');
      d.className = 'node' + (o.kind ? ' ' + o.kind : '');
      d.style.setProperty('--dot', dot[Math.round(o.col / Math.max(1, cols - 1) * 3)]);
      d.innerHTML = '<button type="button"><span class="hd">' + o.label + '<small>' + o.sub + '</small></span>' +
        (o.leaves.length ? '<span class="lv">' + o.leaves.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</span>' : '') + '</button>';
      nodesEl.appendChild(d);
      o.el = d; byId[o.id] = o;
    });
    var W = 1000, H = 600, X = [], ROWTOP = [], ROWH = [];
    function layout() {
      W = Math.max(canvas.clientWidth, 960);
      for (var i = 0; i < cols; i++) X[i] = W * FX[i];
      ROWH = []; for (var r = 0; r < rows; r++) ROWH[r] = 0;
      D.nodes.forEach(function (n) { var o = byId[n[0]]; ROWH[o.row] = Math.max(ROWH[o.row], o.el.firstChild.offsetHeight); });
      var y = 34;
      for (r = 0; r < rows; r++) { ROWTOP[r] = y; y += ROWH[r] + 40; }
      H = y - 40 + 38;
      canvas.style.height = H + 'px';
      D.nodes.forEach(function (n) {
        var o = byId[n[0]], b = o.el.firstChild;
        o.x = X[o.col]; o.top = ROWTOP[o.row];
        o.hw = b.offsetWidth / 2; o.bottom = o.top + b.offsetHeight;
        o.ay = o.top + b.firstChild.offsetHeight / 2;
        o.el.style.left = o.x + 'px'; o.el.style.top = o.top + 'px';
      });
      [linesSvg, headsSvg].forEach(function (sv) { sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); });
      grad.setAttribute('x1', X[0]); grad.setAttribute('x2', X[cols - 1]);
    }
    function route(c) {
      var s = byId[c[0]], t = byId[c[1]];
      if (c[2] === 'v') {
        if (t.row > s.row) return 'M ' + s.x + ' ' + s.bottom + ' V ' + (t.top - 4);
        return 'M ' + s.x + ' ' + s.top + ' V ' + (t.bottom + 4);
      }
      var dir = t.x >= s.x ? 1 : -1;
      var x1 = s.x + dir * s.hw, x2 = t.x - dir * (t.hw + 4), y1 = s.ay, y2 = t.ay;
      if (Math.abs(y2 - y1) < 1) return 'M ' + x1 + ' ' + y1 + ' H ' + x2;
      var mx = (x1 + x2) / 2;
      return 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
    }
    var items = [];
    function build() {
      layout();
      linesSvg.querySelectorAll('path').forEach(function (p) { p.remove(); });
      headsSvg.innerHTML = '';
      items = D.links.map(function (c) {
        var d = route(c);
        var glow = document.createElementNS(NS, 'path');
        glow.setAttribute('d', d); glow.setAttribute('class', 'bglow'); glow.setAttribute('stroke', 'url(#' + gid + ')'); glow.setAttribute('stroke-width', '6');
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d); p.setAttribute('class', 'bpath'); p.setAttribute('stroke', 'url(#' + gid + ')'); p.setAttribute('stroke-width', '1.4');
        linesSvg.appendChild(glow); linesSvg.appendChild(p);
        var len = p.getTotalLength(), end = p.getPointAtLength(len), pre = p.getPointAtLength(Math.max(0, len - 2));
        var g = document.createElementNS(NS, 'path');
        g.setAttribute('d', 'M-7,-4.5 L0,0 L-7,4.5'); g.setAttribute('fill', 'none'); g.setAttribute('stroke-width', '1.6');
        g.setAttribute('stroke-linecap', 'round'); g.setAttribute('stroke-linejoin', 'round'); g.setAttribute('class', 'bhead');
        g.setAttribute('stroke', mix((end.x - X[0]) / (X[cols - 1] - X[0])));
        g.setAttribute('transform', 'translate(' + end.x + ',' + end.y + ') rotate(' + (Math.atan2(end.y - pre.y, end.x - pre.x) * 180 / Math.PI) + ')');
        headsSvg.appendChild(g);
        return { c: c, path: p, glow: glow, head: g, len: len };
      });
    }
    var raf = 0;
    function play() {
      cancelAnimationFrame(raf);
      canvas.classList.remove('dim');
      D.nodes.forEach(function (n) { byId[n[0]].el.classList.remove('hot', 'sel'); });
      items.forEach(function (it) { it.path.classList.remove('hot'); it.glow.classList.remove('hot'); it.head.classList.remove('hot'); });
      if (reduce) { canvas.classList.remove('pre'); return; }
      canvas.classList.add('pre');
      items.forEach(function (it) {
        it.path.style.strokeDasharray = it.len; it.path.style.strokeDashoffset = it.len;
        it.glow.style.strokeDasharray = it.len; it.glow.style.strokeDashoffset = it.len;
        it.head.style.opacity = '0';
      });
      void canvas.offsetWidth;
      D.nodes.forEach(function (n) {
        var o = byId[n[0]], dl = o.col * 0.22 + o.row * 0.05;
        o.el.style.transitionDelay = dl + 's';
        o.el.querySelectorAll('.lv span').forEach(function (sp, i) { sp.style.transitionDelay = (dl + 0.35 + i * 0.045) + 's'; });
      });
      canvas.classList.remove('pre');
      items.forEach(function (it) { it.delay = 0.9 + byId[it.c[0]].col * 0.34 + byId[it.c[0]].row * 0.03; });
      var t0 = performance.now(), DUR = 0.9;
      function frame(now) {
        var t = (now - t0) / 1000, busy = false;
        items.forEach(function (it) {
          var p = (t - it.delay) / DUR;
          if (p < 1) busy = true;
          p = Math.max(0, Math.min(1, p));
          var e = 1 - Math.pow(1 - p, 3);
          it.path.style.strokeDashoffset = it.len * (1 - e);
          it.glow.style.strokeDashoffset = it.len * (1 - e);
          if (p > 0.01) {
            var L = it.len * e, pt = it.path.getPointAtLength(L), pv = it.path.getPointAtLength(Math.max(0, L - 2));
            it.head.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ') rotate(' + (Math.atan2(pt.y - pv.y, pt.x - pv.x) * 180 / Math.PI) + ')');
            it.head.style.opacity = '1';
          }
        });
        if (busy) raf = requestAnimationFrame(frame);
        else D.nodes.forEach(function (n) { byId[n[0]].el.style.transitionDelay = ''; byId[n[0]].el.querySelectorAll('.lv span').forEach(function (sp) { sp.style.transitionDelay = ''; }); });
      }
      raf = requestAnimationFrame(frame);
    }
    var pK = root.querySelector('.board-panel .k'), pT = root.querySelector('.board-panel .t'), pP = root.querySelector('.bp-p'), pPath = root.querySelector('.bp-path');
    function select(id) {
      var o = byId[id], hotN = {}, hotC = {};
      hotN[id] = 1;
      function walk(start, dir) {
        var stack = [start], seen = {}; seen[start] = 1;
        while (stack.length) {
          var cur = stack.pop();
          D.links.forEach(function (c, i) {
            var from = dir > 0 ? c[0] : c[1], to = dir > 0 ? c[1] : c[0];
            if (from === cur) { hotC[i] = 1; hotN[to] = 1; if (!seen[to]) { seen[to] = 1; stack.push(to); } }
          });
        }
      }
      walk(id, 1); walk(id, -1);
      canvas.classList.add('dim');
      D.nodes.forEach(function (n) { var e = byId[n[0]].el; e.classList.toggle('hot', !!hotN[n[0]]); e.classList.toggle('sel', n[0] === id); });
      items.forEach(function (it, i) { var h = !!hotC[i]; it.path.classList.toggle('hot', h); it.glow.classList.toggle('hot', h); it.head.classList.toggle('hot', h); });
      pK.textContent = D.cols[o.col]; pT.textContent = o.title; pP.textContent = o.text;
      var up = D.nodes.filter(function (n) { return hotN[n[0]] && n[0] !== id && byId[n[0]].col < o.col; }).map(function (n) { return n[3]; });
      var down = D.nodes.filter(function (n) { return hotN[n[0]] && n[0] !== id && byId[n[0]].col > o.col; }).map(function (n) { return n[3]; });
      pPath.textContent = (up.length ? 'Entsteht aus: ' + up.join(', ') + '. ' : '') + (down.length ? 'Führt zu: ' + down.join(', ') + '.' : '');
    }
    nodesEl.addEventListener('click', function (e) {
      var b = e.target.closest('.node'); if (!b) return;
      var id = D.nodes.filter(function (n) { return byId[n[0]].el === b; })[0][0];
      if (b.classList.contains('sel')) { canvas.classList.remove('dim'); b.classList.remove('sel'); return; }
      select(id);
    });
    root.querySelector('.board-panel .btn').addEventListener('click', function () {
      pK.textContent = D.intro[0]; pT.textContent = D.intro[1]; pP.textContent = D.intro[2]; pPath.textContent = '';
      play();
    });
    function ready() {
      build();
      if (!reduce) canvas.classList.add('pre');
      onSeen(canvas, function () { requestAnimationFrame(function () { requestAnimationFrame(play); }); });
      var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var sel = nodesEl.querySelector('.sel'); build(); if (sel) select(D.nodes.filter(function (n) { return byId[n[0]].el === sel; })[0][0]); }, 200); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
  });

  /* ---------------- Weg (Journey): Stationen, ein Licht läuft von links nach rechts ---------------- */
  document.querySelectorAll('.journey').forEach(function (j) {
    var track = j.querySelector('.track'), nodes = [].slice.call(j.querySelectorAll('.st-node'));
    var svg = document.createElementNS(NS, 'svg'); track.insertBefore(svg, track.firstChild);
    var gid = 'jg' + (++boardNo);
    svg.innerHTML = '<defs><linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0"><stop offset="0" stop-color="#60c4e3"/><stop offset="1" stop-color="#eb5986"/></linearGradient>' +
      '<radialGradient id="' + gid + 'd"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#bfe9f6"/><stop offset="1" stop-color="#60c4e3" stop-opacity="0"/></radialGradient></defs>';
    var base = document.createElementNS(NS, 'path'), lit = document.createElementNS(NS, 'path'), orb = document.createElementNS(NS, 'circle');
    base.setAttribute('fill', 'none'); base.setAttribute('stroke', 'rgba(255,255,255,0.12)'); base.setAttribute('stroke-width', '1.4'); base.setAttribute('stroke-dasharray', '3 6');
    lit.setAttribute('fill', 'none'); lit.setAttribute('stroke', 'url(#' + gid + ')'); lit.setAttribute('stroke-width', '2'); lit.setAttribute('stroke-linecap', 'round');
    orb.setAttribute('r', '16'); orb.setAttribute('fill', 'url(#' + gid + 'd)'); orb.style.opacity = '0';
    svg.appendChild(base); svg.appendChild(lit); svg.appendChild(orb);
    var pts = [], len = 0, stops = [];
    function layout() {
      var w = track.clientWidth, h = track.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.querySelector('#' + gid).setAttribute('x2', w);
      pts = nodes.map(function (n) {
        var fx = parseFloat(n.dataset.x), fy = parseFloat(n.dataset.y || 0.18);
        n.style.left = (fx * 100) + '%'; n.style.top = (fy * 100) + '%';
        return [fx * w, fy * h + 37];
      });
      var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        var mx = (pts[i - 1][0] + pts[i][0]) / 2;
        d += ' C ' + mx + ' ' + pts[i - 1][1] + ' ' + mx + ' ' + pts[i][1] + ' ' + pts[i][0] + ' ' + pts[i][1];
      }
      base.setAttribute('d', d); lit.setAttribute('d', d);
      len = lit.getTotalLength();
      lit.style.strokeDasharray = len; lit.style.strokeDashoffset = len;
      // Länge bis zu jeder Station
      stops = pts.map(function (p) {
        var best = 0, bd = 1e9;
        for (var L = 0; L <= len; L += 4) { var q = lit.getPointAtLength(L), dd = Math.abs(q.x - p[0]) + Math.abs(q.y - p[1]); if (dd < bd) { bd = dd; best = L; } }
        return best;
      });
    }
    layout();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 200); });
    if (reduce) { lit.style.strokeDashoffset = 0; nodes.forEach(function (n) { n.classList.add('lit'); }); return; }
    j.classList.add('pre');
    var raf = 0, t0 = 0, running = false, PER = 9.5;
    function frame(now) {
      if (!running) return;
      var t = ((now - t0) / 1000) % (PER + 1.6);
      var p = Math.min(1, t / PER), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, L = len * e;
      lit.style.strokeDashoffset = len - L;
      var q = lit.getPointAtLength(L);
      orb.setAttribute('cx', q.x); orb.setAttribute('cy', q.y);
      orb.style.opacity = t > PER ? String(Math.max(0, 1 - (t - PER) / 0.8)) : '1';
      nodes.forEach(function (n, i) { n.classList.toggle('lit', L >= stops[i] - 2 && t <= PER + 0.8); });
      raf = requestAnimationFrame(frame);
    }
    onSeen(j, function () {
      j.classList.remove('pre');
      nodes.forEach(function (n, i) { n.style.transitionDelay = (i * 0.08) + 's'; });
      whileSeen(j, function () { if (running) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); },
        function () { running = false; cancelAnimationFrame(raf); });
    });
  });

  /* ---------------- 90 Beiträge: Kacheln füllen sich Schub für Schub ---------------- */
  document.querySelectorAll('.p90').forEach(function (g) {
    var plan = (g.dataset.plan || '40,20,10,20').split(',').map(Number), html = '', k = 0;
    plan.forEach(function (n, s) { for (var i = 0; i < n; i++) html += '<i class="s' + (s + 1) + '" style="--k:' + (k++) + '"></i>'; });
    g.innerHTML = html;
    if (reduce) return;
    g.classList.add('pre');
    onSeen(g, function () {
      [].forEach.call(g.children, function (c, i) { c.style.transitionDelay = (i * 0.018) + 's'; });
      g.classList.remove('pre');
    });
  });

  /* ---------------- Pre-Drop-Vorführung ---------------- */
  document.querySelectorAll('[data-demo="predrop"]').forEach(function (box) {
    var br = box.querySelector('.browser'), sw = box.querySelector('.switch'), flip = box.querySelector('.flip');
    function set(on) {
      br.classList.toggle('on', on); if (flip) flip.classList.toggle('pre', on);
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      sw.querySelector('b').textContent = on ? 'Pre-Drop an' : 'Pre-Drop aus';
    }
    sw.addEventListener('click', function () { set(sw.getAttribute('aria-checked') !== 'true'); });
    onSeen(box, function () { setTimeout(function () { set(true); }, reduce ? 0 : 700); });
  });
  document.querySelectorAll('.wl').forEach(function (w) {
    w.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); w.classList.add('done'); });
  });

  /* ---------------- Dokument-Stapel: liegen gestapelt, fächern beim Überfahren (am Handy beim Hereinkommen) auf ---------------- */
  document.querySelectorAll('[data-fan]').forEach(function (box) {
    var pg = [].slice.call(box.children), n = pg.length;
    pg.forEach(function (p, k) { p.style.zIndex = String(n - k); });
    function stack() {
      pg.forEach(function (p, k) { p.style.transform = 'translate(' + (k * 4) + 'px,' + (k * 3) + 'px) rotateZ(' + (k * 0.7) + 'deg)'; });
    }
    function fan() {
      // Treppe nach hinten: jede Seite zeigt über der vorderen ihren Titel
      pg.forEach(function (p, k) {
        p.style.transform = 'translate(' + (k * 5) + 'px,' + (-k * 27) + 'px) scale(' + (1 - k * 0.02).toFixed(3) + ')';
        p.style.transitionDelay = (k * 0.035) + 's';
      });
    }
    stack();
    onSeen(box, function () { setTimeout(fan, reduce ? 0 : 250); });
  });

  /* ---------------- Neigung beim Überfahren ---------------- */
  if (hoverable && !reduce) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var r = null;
      el.addEventListener('pointerenter', function () { r = el.getBoundingClientRect(); el.style.transition = 'transform .25s ease-out'; });
      el.addEventListener('pointermove', function (e) {
        if (!r) return;
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(1100px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transition = ''; el.style.transform = ''; r = null; });
    });
  }

  /* ---------------- 3D-Modell (three.js, liegt selbst auf dem Server) ---------------- */
  document.querySelectorAll('.viewer[data-models]').forEach(function (v) {
    onSeen(v, function () {
      import('/werkstatt/viewer.js').then(function (m) { m.start(v); }).catch(function () { v.querySelector('.v-load').textContent = '3D-Vorschau nicht verfügbar'; });
    }, '400px 0px 400px 0px');
  });
})();
