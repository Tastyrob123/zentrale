/* zentrale.js · Die Zentrale von Tasty Studios, gebaut nach «Kontrollpanel» (vorlage/culinarium-demo/werkzeuge/maison/uwerkzeuge/maison/maison.js).
   Wie Kontrollpanel: Gruss und Datum, fünf Türen mit Tasten 1 bis 5, Laufband, ein Saal je Werkzeug mit Bildschirmbildern, «So geht’s» und Zahlen,
   Zahlenzeile, Insel markiert den sichtbaren Bereich, Titel steigen zeilenweise, Zahlen laufen hoch, Auftritte beim Scrollen, Startfehler-Tür.
   Dazu, was nur die Zentrale kann (Auftrag 00): Werkzeug sofort im Rahmen mit Leiste, gemerkt; Suche ⌘K; Wer arbeitet mit Quittung; «Heute» nach Vertrag.
   Zahlen nur aus den Werkzeugen selbst (nichts geschätzt): antwortet ein Werkzeug nicht, bleibt «–» und der Satz ohne Zahl. */
(() => {
  'use strict';
  const H = WO.haus;
  const SPEICHER = { wer: 'tasty-wer', offen: 'zentrale.offen' };
  const PERSONEN = ['Robert', 'Anna'];
  const el = id => document.getElementById(id);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = WO.esc;
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAELE = window.ZENTRALE_SAELE || {};
  /* Die fünf Türen im Empfang (Kontrollpanel zeigt fünf): die Werkzeuge für den Alltag. Fehlen sie (Probe), nimmt die Zentrale die ersten fünf. */
  const TUEREN = ['02-kundenliste', '04-haus-check', '01-feinschliff', '14-social-cockpit', '10-newsletter'];   // Aufgaben leben seit 08.11.2026 in Notion (Robert)
  const POS = { studio: '62% 50%', empfang: '40% 50%', tafel: '30% 50%', bildschirm: '62% 50%', faehre: '50% 50%' };

  let werkzeuge = [], alle = [], offen = null, heutePunkte = null, serverFehler = false;
  let wer = PERSONEN.includes(H.wer) ? H.wer : 'Robert';
  try { const w = localStorage.getItem(SPEICHER.wer); if (PERSONEN.includes(w)) wer = w; } catch (e) {}
  /* ?wer=Anna im Link stellt die Zentrale gleich auf diese Person (Robert 19.11.2026: «wenn ich Anna den Link … schicke, dass es direkt auf Anna eingestellt ist») */
  { const q = (new URLSearchParams(location.search).get('wer') || '').toLowerCase(), p = PERSONEN.find(x => x.toLowerCase() === q);
    if (p) { wer = p; try { localStorage.setItem(SPEICHER.wer, p); } catch (e) {} } }

  const art = w => (SAELE[w.ordner] && SAELE[w.ordner].zeichen) || 'pfeil';
  const wort = w => (SAELE[w.ordner] && SAELE[w.ordner].wort) || 'Werkzeug';
  const foto = w => H.fotos[H.fotoJe[w.ordner]] || H.foto;
  const fotoName = w => H.fotoJe[w.ordner] || 'studio';
  const n = x => Number(x || 0).toLocaleString('de-DE');

  // ---------- Feste Teile: Zeichen, Knöpfe ----------
  $$('[data-zeichen]').forEach(s => { s.innerHTML = WO.zeichen(); });
  $$('[data-ic]').forEach(s => { s.insertAdjacentHTML('afterbegin', WO.ic(s.dataset.ic)); });
  $$('[data-knopf]').forEach(s => {
    const [text, z, artK, href] = s.dataset.knopf.split('|');
    s.outerHTML = WO.knopf(text, z, artK, { href, neu: /^\/seite\//.test(href), klein: true, klasse: s.className, attr: s.dataset.attr || '' });
  });

  /* Gruss und Datum (wie Kontrollpanel M03); ?gruss=morgen|tag|abend für Standbilder */
  function grussText() {
    let h = new Date().getHours();
    const fest = { morgen: 8, tag: 13, abend: 20 }[(/[?&]gruss=(morgen|tag|abend)/.exec(location.search) || [])[1]]; if (fest) h = fest;
    return (h >= 5 && h < 11 ? 'Guten Morgen' : h >= 11 && h < 18 ? 'Guten Tag' : 'Guten Abend') + ', ' + wer + '.';
  }

  /* Buchstaben rollen in den Namen der Insel (wie Kontrollpanel M01) */
  $$('.rl').forEach(s => { s.innerHTML = s.textContent.split('').map((z, i) => '<b style="--n:' + i + '">' + esc(z) + '</b>').join(''); });
  /* Insel: die Wege stehen nur, wenn sie ganz Platz haben (wie Kontrollpanel) */
  const passt = () => {
    const o = document.querySelector('.m-oben'), i = document.querySelector('.m-insel'), r = $$('.m-oben__ecke, .m-oben__r'); if (!o || !i) return;
    o.classList.remove('eng');
    const rechtsEl = document.querySelector('.m-oben__r'), linksEl = document.querySelector('.m-oben__ecke--l');
    const rechts = rechtsEl ? rechtsEl.getBoundingClientRect().left : innerWidth;
    const links = linksEl && getComputedStyle(linksEl).display !== 'none' ? linksEl.getBoundingClientRect().right : 0;
    const b = i.getBoundingClientRect();
    if (i.scrollWidth > i.clientWidth + 1 || b.right > rechts - 12 || b.left < links + 12) o.classList.add('eng');
    return r;
  };
  addEventListener('resize', passt); document.fonts && document.fonts.ready.then(passt);

  // ---------- Werkzeuge laden ----------
  async function ladeWerkzeuge() {
    try {
      const r = await fetch('/zentrale/api/werkzeuge');
      if (!r.ok) throw new Error(r.status);
      alle = (await r.json()).filter(w => w && w.ordner && w.name);
      // Werkzeuge mit «teil_von» stecken seit 08.11.2026 im Kunden (Robert: «keine 12 verschiedenen Tools»); sie liefern weiter Daten und «Heute»-Punkte
      werkzeuge = alle.filter(w => !w.teil_von);
      serverFehler = false;
    } catch (e) { werkzeuge = []; alle = []; serverFehler = true; }
    zeichneWerkzeuge();
  }
  // Der Satz unter dem Namen in der Tür: der erste Teil des «kurz» bis zum ersten Komma oder Punkt (bis der Stand des Werkzeugs da ist)
  function kurzSatz(s) { s = String(s || ''); const m = /^(.{12,64}?)[,.:;]/.exec(s); return m ? m[1] : (s.length > 64 ? s.slice(0, 62).replace(/\s\S*$/, '') + ' …' : s); }

  function zeichneWerkzeuge() {
    // Türen im Empfang, Tasten 1 bis 5
    let tw = TUEREN.map(o => werkzeuge.find(w => w.ordner === o)).filter(Boolean);
    if (tw.length < 5) tw = tw.concat(werkzeuge.filter(w => !tw.includes(w))).slice(0, 5);
    el('tueren').style.setProperty('--spalten', Math.max(tw.length, 1));
    el('tueren').innerHTML = tw.map((w, i) => '<li><button class="m-f5__k" type="button" data-oeffne="' + esc(w.ordner) + '" data-taste="' + (i + 1) + '" style="--i:' + i + ';--pos:' + (POS[fotoName(w)] || '50% 50%') + '">'
      + '<img src="' + foto(w) + '" alt="" decoding="async" fetchpriority="high"><span class="m-f5__t"><span class="m-f5__w">' + esc(wort(w)) + '</span><b>' + esc(w.name) + '</b><small data-stand="' + esc(w.ordner) + '-kurz">' + esc(kurzSatz(w.kurz)) + '</small>'
      + '<i class="m-f5__p" aria-hidden="true">' + WO.ic('rechts') + '</i></span></button></li>').join('');
    // Laufband: die Namen der Werkzeuge und des Studios, zweimal hintereinander (läuft endlos); nur die erste Reihe ist bedienbar
    const namen = werkzeuge.map(w => [w.name, w.ordner]).concat([['Tasty Studios'], ['Hamburg'], ['Robert und Anna']]);
    const reihe = still => namen.map(([t, o]) => '<li>' + (o ? '<button type="button" data-oeffne="' + esc(o) + '"' + (still ? ' tabindex="-1"' : '') + '>' + esc(t) + '</button>' : esc(t)) + '</li><li class="p" aria-hidden="true"></li>').join('');
    el('band').innerHTML = reihe(false) + reihe(true).replace(/<li>/g, '<li aria-hidden="true">');
    // Alle Werkzeuge auf einem Pult statt neun Sälen untereinander (Robert 13.11.2026: «viel übersichtlicher … schnell auf die Sachen zugreifen … luxuriös und edel»)
    el('werkzeuge').innerHTML = werkzeuge.length ? pult()
      : '<section class="m-saal dunkel" data-leer><div class="innen"><div class="m-leer"><b>' + (serverFehler ? 'Der Server antwortet nicht' : 'Noch kein Werkzeug da') + '</b>' + (serverFehler ? 'Läuft python3 zentrale/server.py?' : 'Zum Probieren mit zwei Beispielen: python3 zentrale/probe/start.py') + '</div></div></section>';
    $$('#werkzeuge [data-zeichen]').forEach(s => { s.innerHTML = WO.zeichen(); });
    zeichneLeiste();
    beobachte();
    holeStaende();
    pultLeben();
  }

  // ---------- Alle Werkzeuge: Fassungen zum Durchschalten (Robert 13.11.2026: «komplett anders und neu machen»), Bau in pult-fassungen.js ----------
  const GRUPPEN = [
    ['Verkaufen', 'Häuser finden, ansprechen, gewinnen', ['13-sales-cockpit', '02-kundenliste', '04-haus-check', '09-ki-check']],
    ['Nach aussen', 'Was die Welt von uns sieht', ['14-social-cockpit', '10-newsletter', '01-feinschliff']],
    ['Marke', 'Wer wir sind und wie wir aussehen', ['11-markenbuch', '12-marke-vision', '15-drucksachen', '16-portfolio']]
  ];
  /* Fotos der Agentur-Seite, die oben im Empfang noch nicht stehen: kein Bild zweimal auf der Seite */
  const PULT_FOTO = { '13-sales-cockpit': 'tafel', '02-kundenliste': 'aussen', '04-haus-check': 'zimmer', '09-ki-check': 'speicherstadt',
    '14-social-cockpit': 'terrasse', '10-newsletter': 'anleger', '01-feinschliff': 'bildschirm', '11-markenbuch': 'bar', '12-marke-vision': 'auftakt', '15-drucksachen': 'drucksachen' };
  const werte = {}, saetze = {};
  function eintraege() {
    const drin = new Set(), gr = GRUPPEN.map(([t, s, os]) => ({ t, s, ws: os.map(o => werkzeuge.find(w => w.ordner === o)).filter(Boolean) }));
    gr.forEach(g => g.ws.forEach(w => drin.add(w.ordner)));
    const rest = werkzeuge.filter(w => !drin.has(w.ordner)); if (rest.length) gr.push({ t: 'Weitere', s: 'Was sonst noch im Studio läuft', ws: rest });
    return gr.filter(g => g.ws.length).map(g => ({ t: g.t, s: g.s, ws: g.ws.map(w => {
      const s = SAELE[w.ordner] || {};
      return { o: w.ordner, name: w.name, zweck: s.zweck || kurzSatz(w.kurz), satz: s.satz || w.kurz || '', wort: wort(w), ic: WO.ic(art(w)), gruppe: g.t,
        zahlen: s.zahlen || [], foto: H.fotos[PULT_FOTO[w.ordner]] || foto(w) };
    }) }));
  }
  const PH = { esc, ic: n => WO.ic(n), knopf: (t, z, a, o) => WO.knopf(t, z, a, o), zeichen: () => WO.zeichen(), werte, saetze };
  function pult() { return window.ZENTRALE_FASSUNGEN ? ZENTRALE_FASSUNGEN.bau(eintraege(), PH) : ''; }
  /* nach jedem Wechsel der Fassung: neu zeichnen, Auftritte und bekannte Zahlen wieder einsetzen */
  window.ZENTRALE_PULT_NEU = () => {
    el('werkzeuge').innerHTML = pult();
    $$('#werkzeuge [data-zeichen]').forEach(s => { s.innerHTML = WO.zeichen(); });
    Object.keys(werte).forEach(k => $$('#werkzeuge [data-zahl="' + k + '"]').forEach(e => { e.textContent = werte[k]; }));
    beobachte(); pultLeben();
  };
  function pultLeben() { if (window.ZENTRALE_FASSUNGEN) ZENTRALE_FASSUNGEN.leben(document.getElementById('w-alle'), PH); }

  // ---------- Ein Saal je Werkzeug (wie Kontrollpanel) ----------
  const GRUND = ['dunkel', 'papier', 'dunkel', 'tapete'];
  function saal(w, i) {
    const s = SAELE[w.ordner] || {}, grund = GRUND[i % 4], dunkel = grund === 'dunkel';
    // Ein Laptop je Werkzeug (Blender-Gehäuse aus der Carlton-Werkbank), darin eine echte Aufnahme des Werkzeugs bei 1440 × 932 (Robert 08.11.2026)
    const b0 = s.schirme && s.schirme[0];
    const links = '<figure class="m-geraet" data-r="schweb" style="--i:0">'
      + (b0 ? '<span class="m-geraet__schirm"><img src="' + b0.bild + '" width="2160" height="1398" alt="' + esc(b0.alt) + '" loading="lazy" decoding="async"></span>'
            : '<span class="m-geraet__schirm m-geraet__schirm--leer"><b>' + esc(w.name) + '</b><small>' + esc(w.kurz || '') + '</small></span>')
      + '<img class="m-geraet__haus" src="/zentrale/zentrale/img/laptop.webp" width="1600" height="1338" alt="" loading="lazy" decoding="async"></figure>';
    const schritte = (s.schritte || []).map(x => '<div class="m-tafel__z"><i>' + WO.ic(x.z || art(w)) + '</i><p><b>' + esc(x.t) + '</b>' + x.p + '</p></div>').join('');
    const zahlen = '<div class="m-zahlen">' + (s.zahlen || []).map(([k, t]) => '<div class="m-zahl"><b data-zahl="' + esc(w.ordner + '-' + k) + '">–</b><span>' + esc(t) + '</span></div>').join('') + '</div>';
    const oeffnen = WO.knopf(esc(w.name) + ' öffnen', 'rechts', 'dunkel', { attr: 'data-oeffne="' + esc(w.ordner) + '"' });
    // Rechts eine einzige Tafel: «So geht’s», darunter Stand mit Zahlen und der Knopf. Nichts steht lose daneben.
    const rechts = '<div class="m-tafel m-tafel--saal" data-r style="--i:1">' + (schritte ? '<p class="m-tafel__kopf"><span>So geht’s</span></p>' + schritte : '')
      + '<div class="m-tafel__fuss"><p class="m-tafel__kopf"><span>So steht es</span></p>' + zahlen + '<p class="m-tafel__stand" data-stand="' + esc(w.ordner) + '">&nbsp;</p>' + oeffnen + '</div></div>';
    const weg = s.weg ? '<ol class="m-weg" data-r style="--n:' + s.weg.length + '">' + s.weg.map((x, j) => '<li style="--i:' + j + '"><b data-wg="' + esc(w.ordner + '-' + x.k) + '">–</b><span>' + esc(x.t) + '</span><small>' + esc(x.s) + '</small></li>').join('') + '</ol>' : '';
    return '<section class="m-saal ' + grund + '" id="w-' + esc(w.ordner) + '" data-werkzeug="' + esc(w.ordner) + '"><div class="innen">'
      + '<header class="m-saal__kopf"><span class="m-saal__z" data-zeichen></span><p class="m-saal__nr" data-r style="--i:0">N° ' + (i + 1) + ' von ' + werkzeuge.length + ' · ' + esc(s.zweck || wort(w)) + '</p>'
      + '<h2 class="m-saal__titel" data-r style="--i:1">' + esc(w.name) + '</h2><p class="m-saal__satz" data-r style="--i:2">' + esc(s.satz || w.kurz || '') + '</p></header><div class="m-saal__linie" aria-hidden="true"><i></i></div>'
      + '<div class="m-saal__feld"><div class="m-saal__links">' + links + '</div>' + rechts + '</div>' + weg + '</div></section>';
  }

  // ---------- Stand je Werkzeug: Zahlen nur aus dem Werkzeug selbst ----------
  const nachZahl = () => { if (window.ZENTRALE_FASSUNGEN && ZENTRALE_FASSUNGEN.wert) ZENTRALE_FASSUNGEN.wert(PH); };
  const setze = (k, html) => { saetze[k] = html; $$('[data-stand="' + k + '"]').forEach(e => { e.innerHTML = html; }); nachZahl(); };
  const zahl = (k, wert) => { werte[k] = wert; $$('[data-zahl="' + k + '"]').forEach(e => { e.textContent = wert; }); nachZahl(); };
  function holeStaende() {
    werkzeuge.forEach(w => {
      const s = SAELE[w.ordner]; if (!s || !s.stand) return;
      const hol = u => fetch(u, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)));
      (Array.isArray(s.stand.weg) ? Promise.all(s.stand.weg.map(hol)) : hol(s.stand.weg)).then(d => {
        const e = s.stand.lies(d) || {};
        Object.entries(e.zahlen || {}).forEach(([k, v]) => zahl(w.ordner + '-' + k, Number.isFinite(v) ? n(v) : '–'));
        Object.entries(e.weg || {}).forEach(([k, v]) => $$('[data-wg="' + w.ordner + '-' + k + '"]').forEach(x => { x.textContent = Number.isFinite(v) ? n(v) : '–'; }));
        if (e.kurz) setze(w.ordner + '-kurz', esc(e.kurz));
        setze(w.ordner, e.satz ? esc(e.satz) : '&nbsp;');
      }).catch(() => { setze(w.ordner, 'Der Stand ist gerade nicht abrufbar.'); });
    });
  }

  // ---------- Leiste links (Werkzeug offen) ----------
  /* Robert 17.11.2026: die Leiste in jedem Werkzeug, ein- und aufklappbar, mit Titeln und einem Satz, sortiert wie die Werkzeuge der Zentrale */
  const LEISTE_SATZ = { '13-sales-cockpit': 'Häuser ohne Vertrag, je Haus eine Mappe', '02-kundenliste': 'Unser Kundenstamm mit allen Akten', '04-haus-check': 'Kunden finden und jedes Haus prüfen',
    '09-ki-check': 'Wie gut KI-Dienste eine Website lesen', '14-social-cockpit': 'Alle Kanäle von Tasty Studios', '10-newsletter': 'Newsletter, Empfänger und Archiv',
    '01-feinschliff': 'Unsere Website direkt ändern', '11-markenbuch': 'Logo, Schriften und Farben', '12-marke-vision': 'Wofür Tasty Studios steht', '15-drucksachen': 'Visitenkarten, Briefe und Vorlagen', '16-portfolio': 'Was wir bauen und was dazukommen könnte' };
  /* Robert 17.11.2026: bei jedem Wechsel in ein Werkzeug zuerst eingeklappt, damit der Bereich wirkt; aufgeklappt nur auf Wunsch */
  let leisteAuf = false;
  function leisteSetzen() { document.documentElement.classList.toggle('leiste-auf', leisteAuf); }
  leisteSetzen();
  function zeichneLeiste() {
    const knopf = w => '<button class="m-lk" type="button" data-oeffne="' + esc(w.ordner) + '" data-name="' + esc(w.name) + '" aria-label="' + esc(w.name) + '"' + (w.ordner === offen ? ' aria-current="page"' : '') + '>'
      + '<i class="m-lk__ic">' + WO.ic(art(w)) + '</i><span class="m-lk__t"><b>' + esc(w.name) + '</b><small>' + esc(LEISTE_SATZ[w.ordner] || kurzSatz(w.kurz)) + '</small></span></button>';
    const drin = new Set();
    let s = '<div class="m-leiste__kopf"><button class="m-lk m-lk--start" type="button" data-start data-name="Zentrale" aria-label="Zentrale"><i class="m-lk__ic m-ecke__ring">' + WO.zeichen() + '</i><span class="m-lk__t"><b>Zentrale</b><small>Alle Werkzeuge</small></span></button>'
      + '<button class="m-leiste__klapp" type="button" data-leiste-klapp aria-expanded="' + leisteAuf + '" aria-label="' + (leisteAuf ? 'Leiste einklappen' : 'Leiste aufklappen') + '" data-name="' + (leisteAuf ? 'Einklappen' : 'Aufklappen') + '">' + WO.ic(leisteAuf ? 'links' : 'rechts') + '</button></div>';
    GRUPPEN.forEach(([titel, satz, os]) => {
      const ws = os.map(o => werkzeuge.find(w => w.ordner === o)).filter(Boolean); if (!ws.length) return;
      ws.forEach(w => drin.add(w.ordner));
      s += '<span class="m-leiste__trenn"></span><p class="m-leiste__gruppe">' + esc(titel) + '</p>' + ws.map(knopf).join('');
    });
    const rest = werkzeuge.filter(w => !drin.has(w.ordner));
    if (rest.length) s += '<span class="m-leiste__trenn"></span><p class="m-leiste__gruppe">Weitere</p>' + rest.map(knopf).join('');
    s += '<span class="m-leiste__fuss"><span class="m-leiste__trenn"></span><button class="m-lk" type="button" data-suche data-name="Suchen ⌘K" aria-label="Suchen"><i class="m-lk__ic">' + WO.ic('suche') + '</i><span class="m-lk__t"><b>Suchen</b><small>Werkzeug tippen, ⌘K</small></span></button>'
      + '<button class="m-lk m-lk__wer" type="button" data-wer-wechsel data-name="Es arbeitet ' + wer + ', umschalten" aria-label="Es arbeitet ' + wer + ', umschalten"><i class="m-lk__ic">' + wer.charAt(0) + '</i><span class="m-lk__t"><b>' + wer + '</b><small>Es arbeitet ' + wer + ', umschalten</small></span></button></span>';
    el('leiste').innerHTML = s;
    const an = el('leiste').querySelector('[aria-current]');
    if (an && innerWidth <= 800) an.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  el('leiste').addEventListener('click', e => {
    if (!e.target.closest('[data-leiste-klapp]')) return;
    leisteKlapp();
  });
  /* Auf- und Zuklappen der Leiste als Vorhang wie im Sales Cockpit (randKlapp, Robert 16.11.2026; 17.11.2026: «gilt auch für das auf und zuklappen
     der seitenleiste in jedem bereich», «es läuft nicht flüssig»). Gemessen: das Werkzeug rechts neben der Leiste baute sich bei jedem Bild neu auf
     (4-fach gedrosselt 46 bis 60 Bilder/s, Bilder bis 125 ms). Darum bleibt das Werkzeug jetzt still, die offene Leiste liegt darüber.
     Eine Bewegung: die Kante der Leiste wandert, jedes Zeichen gleitet an seinen Platz, die Schrift kommt nach / tritt vorher zurück.
     Nur transform, opacity und clip-path an der Leiste selbst. */
  function leisteKlapp() {
    const L = el('leiste'); if (L._laeuft) return;
    const an = !leisteAuf;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth <= 800) { leisteAuf = an; leisteSetzen(); zeichneLeiste(); return; }
    L._laeuft = true; nameWeg();
    const DAUER = an ? 760 : 640, E = an ? 'cubic-bezier(.5,0,.15,1)' : 'cubic-bezier(.65,0,.35,1)';
    const schluessel = b => b.dataset.oeffne || (b.matches('[data-start]') ? 'start' : b.matches('[data-suche]') ? 'suche' : b.matches('[data-wer-wechsel]') ? 'wer' : 'klapp');
    const knoepfe = () => [...L.querySelectorAll('.m-lk, .m-leiste__klapp')];
    const orte = () => new Map(knoepfe().map(b => { const r = (b.querySelector('.m-lk__ic') || b).getBoundingClientRect(); return [schluessel(b), [r.left + r.width / 2, r.top + r.height / 2]]; }));
    const schmal = el('werk').getBoundingClientRect().left + parseFloat(getComputedStyle(el('werk')).gridTemplateColumns) || 76;
    let oZu;
    if (an) { oZu = orte(); leisteAuf = true; leisteSetzen(); zeichneLeiste(); }
    else { leisteAuf = false; leisteSetzen(); zeichneLeiste(); oZu = orte(); leisteAuf = true; leisteSetzen(); zeichneLeiste(); }
    const oOffen = orte(), breit = L.getBoundingClientRect().width;
    const zuClip = 'inset(0px ' + Math.max(0, breit - schmal).toFixed(1) + 'px 0px 0px)', aufClip = 'inset(0px -80px 0px 0px)';
    const anims = [L.animate([{ clipPath: an ? zuClip : aufClip }, { clipPath: an ? aufClip : zuClip }], { duration: DAUER, easing: E, fill: 'forwards' })];
    knoepfe().forEach(b => { const k = schluessel(b), z = oZu.get(k), o = oOffen.get(k); if (!z || !o) return;
      const t = 'translate(' + (z[0] - o[0]).toFixed(1) + 'px,' + (z[1] - o[1]).toFixed(1) + 'px)';
      anims.push(b.animate([{ transform: an ? t : 'none' }, { transform: an ? 'none' : t }], { duration: DAUER, easing: E, fill: 'forwards' })); });
    L.querySelectorAll('.m-lk__t, .m-leiste__gruppe, .m-leiste__trenn').forEach(x => anims.push(an
      ? x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.round(DAUER * .5), delay: Math.round(DAUER * .4), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' })
      : x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: Math.round(DAUER * .26), easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })));
    Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
      leisteAuf = an; leisteSetzen(); zeichneLeiste();
      anims.forEach(a => a.cancel()); L._laeuft = false; nameWeg();
    });
  }
  /* Name zum Knopf der Leiste: ein Schild über allem, damit der Rand der Leiste es nie beschneidet */
  const schild = el('lkName');
  const zeigeName = b => { if (!b || innerWidth <= 800 || el('leiste')._laeuft || (leisteAuf && !b.matches('[data-leiste-klapp]'))) return; const r = b.getBoundingClientRect(); schild.textContent = b.dataset.name; schild.style.transform = 'translate(' + Math.round(r.right + 12) + 'px,' + Math.round(r.top + r.height / 2 - 14) + 'px)'; schild.classList.add('an'); };
  const nameWeg = () => schild.classList.remove('an');
  el('leiste').addEventListener('pointerover', e => { const b = e.target.closest('.m-lk, .m-leiste__klapp'); if (b) zeigeName(b); });
  el('leiste').addEventListener('pointerout', e => { if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget) || !e.relatedTarget.closest('.m-lk, .m-leiste__klapp')) nameWeg(); });
  el('leiste').addEventListener('focusin', e => { const b = e.target.closest('.m-lk'); if (b && b.matches(':focus-visible')) zeigeName(b); });
  el('leiste').addEventListener('focusout', nameWeg);
  el('leiste').addEventListener('click', nameWeg);
  el('leiste').addEventListener('scroll', nameWeg, { passive: true });

  // ---------- Werkzeug öffnen / Start zeigen ----------
  function adresse(ordner, link) {
    const basis = new URL('/zentrale/werkzeuge/' + ordner + '/', location.origin);
    let u;
    try { u = new URL(link || '', basis); } catch (e) { u = basis; }
    if (!u.pathname.startsWith(basis.pathname)) u = basis;      // nur innerhalb des Werkzeugs
    u.searchParams.set('wer', wer);
    return u.href;
  }
  function oeffne(ordner, link) {
    const w = werkzeuge.find(x => x.ordner === ordner);
    if (!w) return zeigeStart();
    const ziel = adresse(ordner, link);
    offen = ordner;
    try { localStorage.setItem(SPEICHER.offen, ordner); } catch (e) {}
    history.replaceState(null, '', '#' + ordner);
    document.title = w.name + ' · Zentrale · Tasty Studios';
    el('werk').hidden = false;
    document.documentElement.classList.add('werk-offen');
    document.documentElement.style.overflow = 'hidden';
    const r = el('rahmen');
    if (!link || r.src !== ziel) r.src = ziel;   // über die Leiste immer frisch in der Übersicht (Robert 17.11.2026)
    leisteAuf = false; leisteSetzen(); nameWeg();
    zeichneLeiste();
  }
  function zeigeStart(still) {
    offen = null; nameWeg();
    try { localStorage.removeItem(SPEICHER.offen); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.search);
    document.title = 'Zentrale · Tasty Studios';
    el('werk').hidden = true;
    document.documentElement.classList.remove('werk-offen');
    document.documentElement.style.overflow = '';
    if (!still) { zeichneHeute(); ladeHeute().then(zeichneHeute); }
  }
  // Tastenkürzel gelten auch im Rahmen (gleiche Herkunft)
  el('rahmen').addEventListener('load', () => { try { el('rahmen').contentWindow.addEventListener('keydown', tasten); } catch (e) {} });
  // Der runde Knopf «Zentrale» im Kopf eines Werkzeugs meldet sich hier (kleid/tasty.js)
  addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.tasty === 'zentrale') zeigeStart(); });

  // ---------- Heute (Vertrag zentrale/VERTRAG-HEUTE.md) ----------
  const tag0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  function wannText(wann) {
    if (!wann) return { text: 'Ohne Datum', klasse: '', rang: 3 };
    const d = new Date(wann);
    if (isNaN(d)) return { text: wann, klasse: '', rang: 3 };
    const mitZeit = /T\d\d:\d\d/.test(wann), tag = new Date(d); tag.setHours(0, 0, 0, 0);
    const diff = Math.round((tag - tag0()) / 864e5);
    const zeit = mitZeit ? ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
    if (diff < 0) return { text: diff === -1 ? 'Seit gestern' : 'Seit ' + (-diff) + ' Tagen', klasse: 'spaet', rang: 0 };
    if (diff === 0) return { text: 'Heute' + zeit, klasse: 'jetzt', rang: 1 };
    if (diff === 1) return { text: 'Morgen' + zeit, klasse: '', rang: 2 };
    if (diff < 7) return { text: d.toLocaleDateString('de-DE', { weekday: 'long' }), klasse: '', rang: 2 };
    return { text: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }), klasse: '', rang: 2 };
  }
  async function holeHeute(w) {
    const stopp = new AbortController(), uhr = setTimeout(() => stopp.abort(), 4000);
    try {
      const r = await fetch('/zentrale/api/' + w.ordner + '/heute?wer=' + encodeURIComponent(wer), { signal: stopp.signal });
      if (!r.ok) return [];
      const d = await r.json();
      if (!d || !Array.isArray(d.punkte)) return [];
      return d.punkte.filter(p => p && typeof p.text === 'string' && p.text.trim())
        .map(p => ({ text: p.text.trim(), wann: typeof p.wann === 'string' ? p.wann : '', link: typeof p.link === 'string' ? p.link : '', werkzeug: w }));
    } catch (e) { return []; } finally { clearTimeout(uhr); }
  }
  // «Was heute ansteht» ist raus (Robert 08.11.2026: läuft über Notion); Gruss und Datum bleiben
  async function ladeHeute() { heutePunkte = []; }
  function zeichneHeute() {
    const d = new Date();
    el('gruss').textContent = grussText();
    el('datum').textContent = d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }


  // ---------- Wer arbeitet (mit Quittung: vorher, nachher, Rückgängig) ----------
  function zeichneWer() {
    el('wer').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.wer === wer ? 'true' : 'false'));
    el('werRund').textContent = wer.charAt(0);
    el('werRund').setAttribute('aria-label', 'Es arbeitet ' + wer + ', umschalten');
  }
  function setzeWer(neu, still) {
    if (!PERSONEN.includes(neu) || neu === wer) return;
    const vorher = wer;
    wer = neu;
    try { localStorage.setItem(SPEICHER.wer, wer); } catch (e) {}
    zeichneWer(); zeichneLeiste();
    heutePunkte = null;
    if (offen) { const u = new URL(el('rahmen').src || adresse(offen), location.origin); u.searchParams.set('wer', wer); el('rahmen').src = u.href; }
    else { zeichneHeute(); ladeHeute().then(zeichneHeute); }
    if (!still) quittung('Jetzt arbeitet ' + wer, 'Jedes Werkzeug bekommt den Namen mit.', [['Vorher', vorher], ['Nachher', wer]], () => setzeWer(vorher, true));
  }
  el('wer').addEventListener('click', e => { const b = e.target.closest('button[data-wer]'); if (b) setzeWer(b.dataset.wer); });
  const wechsle = () => setzeWer(wer === 'Robert' ? 'Anna' : 'Robert');
  el('werRund').addEventListener('click', wechsle);

  // ---------- Quittung (Baustein des Kleids wie muster.html: Vorher, nachher · Rückgängig · Schliessen) ----------
  let qUhr = 0, qZurueck = null;
  function quittung(titel, satz, vn, zurueck) {
    const q = el('quittung');
    q.querySelector('[data-q-text]').innerHTML = '<b>' + esc(titel) + '</b>' + esc(satz) + '<dl class="m-q-vn">' + vn.map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl>';
    q.querySelector('[data-q-vn]').setAttribute('aria-expanded', 'false');
    qZurueck = zurueck; q.classList.remove('weg'); clearTimeout(qUhr); qUhr = setTimeout(qWeg, 9000);
  }
  function qWeg() { el('quittung').classList.add('weg'); clearTimeout(qUhr); }
  el('quittung').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-q-zurueck')) { if (qZurueck) qZurueck(); qWeg(); }
    else if (t.hasAttribute('data-q-zu')) qWeg();
    else if (t.hasAttribute('data-q-vn')) { const vn = el('quittung').querySelector('.m-q-vn'), auf = vn.classList.toggle('an'); t.setAttribute('aria-expanded', auf ? 'true' : 'false'); clearTimeout(qUhr); if (!auf) qUhr = setTimeout(qWeg, 9000); }
  });
  el('quittung').addEventListener('mouseenter', () => clearTimeout(qUhr));

  // ---------- Suche (⌘K) ----------
  const suche = el('suche'), feld = el('sucheFeld');
  let liste = [], wahl = 0;
  function sucheAuf() {
    if (!suche.hidden) return;
    suche.hidden = false; suche.classList.add('kommt'); feld.value = ''; filtere();
    requestAnimationFrame(() => requestAnimationFrame(() => suche.classList.remove('kommt')));
    feld.focus();
  }
  function sucheZu() { if (suche.hidden) return; suche.hidden = true; (offen ? el('rahmen') : document.body).focus(); }
  function filtere() {
    const woerter = feld.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    liste = werkzeuge.filter(w => { const heu = (w.name + ' ' + (w.kurz || '') + ' ' + w.ordner).toLowerCase(); return woerter.every(x => heu.includes(x)); });
    wahl = 0; zeichneTreffer();
  }
  function zeichneTreffer() {
    const t = el('treffer');
    if (!liste.length) { t.innerHTML = '<li class="nichts">' + (werkzeuge.length ? 'Kein Werkzeug passt.' : 'Noch kein Werkzeug da.') + '</li>'; return; }
    t.innerHTML = liste.map((w, i) => '<li class="' + (i === wahl ? 'an' : '') + '" data-i="' + i + '"><img src="' + foto(w) + '" alt=""><span><b>' + esc(w.name) + '</b><small>' + esc(w.kurz || '') + '</small></span></li>').join('');
    const an = t.querySelector('.an'); if (an) an.scrollIntoView({ block: 'nearest' });
  }
  feld.addEventListener('input', filtere);
  feld.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); wahl = Math.min(wahl + 1, liste.length - 1); zeichneTreffer(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); wahl = Math.max(wahl - 1, 0); zeichneTreffer(); }
    else if (e.key === 'Enter') { e.preventDefault(); const w = liste[wahl]; if (w) { sucheZu(); oeffne(w.ordner); } }
  });
  el('treffer').addEventListener('mousemove', e => { const li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== wahl) { wahl = +li.dataset.i; zeichneTreffer(); } });
  el('treffer').addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) { sucheZu(); oeffne(liste[+li.dataset.i].ordner); } });
  suche.addEventListener('click', e => { if (e.target === suche) sucheZu(); });
  function tasten(e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); suche.hidden ? sucheAuf() : sucheZu(); }
    else if (e.key === 'Escape' && !suche.hidden) { e.preventDefault(); sucheZu(); }
  }
  addEventListener('keydown', tasten);
  /* Taste 1 bis 5 öffnet das Werkzeug der Tür, 6 springt zu «Heute» (wie Kontrollpanel M12); still, solange der Rundgang, die Suche oder ein Werkzeug offen ist */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || document.querySelector('.rdg-karte') || offen || !suche.hidden) return;
    const t = document.querySelector('[data-taste="' + e.key + '"]'); if (!t) return;
    e.preventDefault();
    t.classList.add('gedrueckt'); t.classList.add('an');
    setTimeout(() => { t.classList.remove('gedrueckt', 'an'); t.click(); }, 180);
  });

  // ---------- Klicks ----------
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-oeffne],[data-start],[data-suche],[data-punkt],[data-wer-wechsel]');
    if (!t) return;
    if (t.hasAttribute('data-oeffne')) oeffne(t.dataset.oeffne);
    else if (t.hasAttribute('data-start')) { if (offen) zeigeStart(); else scrollTo({ top: 0, behavior: ruhig ? 'auto' : 'smooth' }); }
    else if (t.hasAttribute('data-suche')) sucheAuf();
    else if (t.hasAttribute('data-wer-wechsel')) wechsle();
    else { const p = heutePunkte && heutePunkte[+t.dataset.punkt]; if (p) oeffne(p.werkzeug.ordner, p.link); }
  });
  addEventListener('hashchange', () => {
    const ziel = location.hash.slice(1);
    if (werkzeuge.some(w => w.ordner === ziel)) { if (ziel !== offen) oeffne(ziel); }
    else if (offen && !ziel) zeigeStart();
  });
  // Kopf weicht beim Hinunterscrollen und kommt beim Hochscrollen wieder (wie Kontrollpanel)
  let letzt = 0;
  addEventListener('scroll', () => { const y = scrollY; if (Math.abs(y - letzt) < 6) return; el('kopf').classList.toggle('weg', y > letzt && y > 160); letzt = y; }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !offen) ladeHeute().then(zeichneHeute);
  });

  // ---------- Bewegung wie Kontrollpanel: Titel zeilenweise, Zahlen laufen hoch, Auftritte, Laufband nur im Bild, Insel markiert den Bereich ----------
  const zeilen = e => {
    const h0 = e.offsetHeight; if (!h0 || e.classList.contains('wo-zl')) return;
    const w0 = Math.max(e.scrollWidth, e.clientWidth), roh = e.innerHTML, tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), ts = []; let t;
    while ((t = tw.nextNode())) if (/\S/.test(t.data)) ts.push(t);
    ts.forEach(t => {
      const f = document.createDocumentFragment();
      t.data.split(/(\s+)/).forEach(s => { if (!s) return; if (/^\s+$/.test(s)) { f.appendChild(document.createTextNode(s)); return; } const w = document.createElement('span'); w.className = 'wo-w'; w.textContent = s; f.appendChild(w); });
      t.parentNode.replaceChild(f, t);
    });
    if (e.offsetHeight !== h0 || e.scrollWidth > w0 + 1) { e.innerHTML = roh; return; }
    let z = -1, oben = -1e9; const halb = parseFloat(getComputedStyle(e).fontSize) * 0.5;
    $$('.wo-w', e).forEach(w => { const y = w.getBoundingClientRect().top; if (y > oben + halb) { z++; oben = y; } if (z) w.style.setProperty('--z', z); });
    e.classList.add('wo-zl');
  };
  /* Schlitz (Vorlage Bareiss zeilen()): Überschrift in Zeilen zerlegen, jede Zeile rollt aus ihrem eigenen Schlitz */
  const schlitz = h => {
    if (ruhig || h.dataset.z || !h.offsetHeight) return; h.dataset.z = '1';
    const ws = h.textContent.trim().split(/\s+/); h.textContent = '';
    const sp = ws.map(w => { const s = document.createElement('span'); s.textContent = w; s.style.whiteSpace = 'nowrap'; h.append(s, ' '); return s; });
    const rows = []; let top = null;
    sp.forEach(s => { const t = s.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; rows.push([]); } rows[rows.length - 1].push(s.textContent); });
    h.textContent = '';
    rows.forEach((r, i) => { const z = document.createElement('span'), inn = document.createElement('span'); z.className = 'zl'; inn.className = 'zi'; inn.style.setProperty('--z', i); inn.textContent = r.join(' '); z.appendChild(inn); h.appendChild(z); });
  };
  const ZAHL = /^\s*(\d{1,3}(?:\.\d{3})+|\d{1,7})\s*$/;
  const zaehle = e => {
    const roh = e.textContent, m = ZAHL.exec(roh); if (!m) return;
    const ziel = parseInt(m[1].split('.').join(''), 10); if (!(ziel >= 4)) return;
    const hut = document.createElement('span'), zw = document.createElement('span'), z = document.createElement('span');
    hut.className = 'wo-zl-z'; zw.setAttribute('aria-hidden', 'true'); zw.textContent = roh; z.textContent = '0';
    hut.appendChild(zw); hut.appendChild(z); e.textContent = ''; e.appendChild(hut);
    const t0 = performance.now(), D = 1400;
    (function schritt(jetzt) {
      if (!z.isConnected) return;
      const x = Math.min(1, Math.max(0, (jetzt - t0) / D));
      if (x < 1) { z.textContent = n(Math.round(ziel * (1 - Math.pow(1 - x, 4)))); requestAnimationFrame(schritt); } else e.textContent = roh;
    })(t0);
  };
  let zio = null, zmo = null, io = null;
  if (!ruhig && 'IntersectionObserver' in window) {
    zio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { zio.unobserve(e.target); zaehle(e.target); } }), { threshold: 0.6 });
    zmo = new MutationObserver(ms => ms.forEach(m => { const e = m.target; if (!e.hasAttribute('data-gezaehlt') && ZAHL.test(e.textContent)) { e.setAttribute('data-gezaehlt', ''); zio.observe(e); } }));
  }
  const fuenftel = e => e.isIntersecting && (e.intersectionRatio >= 0.2 || e.intersectionRect.height >= innerHeight * 0.2);
  const wecke = e => (e.tagName === 'IMG' ? [e] : $$('img[loading="lazy"]', e)).forEach(i => { if (!i.complete || !i.naturalWidth) i.loading = 'eager'; });
  /* Auftritt erst mit fertigem Bild (Vorlage Bareiss bereit()), höchstens 2,5 s */
  const bereit = (e, dann) => {
    const ims = (e.tagName === 'IMG' ? [e] : $$('img', e)); let n = ims.length, los = false;
    const fertig = () => { if (!los) { los = true; dann(); } }, eins = () => { if (--n <= 0) fertig(); };
    if (!n) return fertig();
    ims.forEach(i => { const ent = () => (i.decode ? i.decode() : Promise.resolve()).then(eins, eins); if (i.complete && i.naturalWidth > 1) return ent(); i.loading = 'eager'; i.addEventListener('load', ent, { once: true }); i.addEventListener('error', eins, { once: true }); });
    setTimeout(fertig, 2500);
  };
  /* Reinfliegen wie Bareiss (Robert 13.11.2026): jedes Stück startet, wenn es 12 % vor dem unteren Rand steht; was schon darüber liegt, ist sofort da */
  if ('IntersectionObserver' in window) io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting && e.boundingClientRect.bottom >= 0) return;
    io.unobserve(e.target); wecke(e.target); bereit(e.target, () => e.target.classList.add('da'));
  }), { rootMargin: '0px 0px 12% 0px', threshold: 0 });
  function beobachte() {
    if (!ruhig) $$('.m-saal__titel').forEach(zeilen);
    $$('[data-r]:not(.da)').forEach(e => { if (io) io.observe(e); else e.classList.add('da'); });
    const sl = () => $$('[data-schlitz]:not(#titel):not(.da)').forEach(h => { schlitz(h); if (io) io.observe(h); else h.classList.add('da'); });
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(sl); else sl();
    if (zmo) $$('[data-zahl], [data-wg]').forEach(e => { if (!e.hasAttribute('data-beob')) { e.setAttribute('data-beob', ''); zmo.observe(e, { childList: true }); } });
    if (sio) { sio.disconnect(); Object.keys(punkte).forEach(id => { const s = el(id); if (s) sio.observe(s); }); }
  }
  const band = document.querySelector('[data-laufband]');
  if (band && 'IntersectionObserver' in window) new IntersectionObserver(es => { band.classList.toggle('laeuft', es[0].isIntersecting && !ruhig); }).observe(band);
  const punkte = {};
  $$('.m-insel__p[href^="#"]').forEach(a => { punkte[a.getAttribute('href').slice(1)] = a; });
  const sio = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { const a = punkte[e.target.id]; if (a) a.classList.toggle('an', e.isIntersecting); }), { rootMargin: '-45% 0px -45% 0px' }) : null;

  // ---------- Anfang: erst zeigen, wenn Schrift, Liste und die Fotos der Türen da sind ----------
  async function anfang() {
    zeichneWer(); zeichneHeute();
    const schrift = Promise.all(['700 40px Antonio', '400 17px "Instrument Sans"', '600 17px "Instrument Sans"', '400 12px "DM Mono"'].map(f => document.fonts.load(f)));
    const bereit = (async () => {
      await Promise.all([schrift, ladeWerkzeuge()]);
      await Promise.all($$('#tueren img').map(i => i.decode().then(() => i.classList.add('da')).catch(() => {})));
    })();
    await Promise.race([bereit, new Promise(r => setTimeout(r, 2500))]);
    /* Robert 17.11.2026: «der Home button soll in jedem Tool in die Zentrale führen» – kein Wiederöffnen des zuletzt offenen Werkzeugs mehr, nur was in der Adresse steht */
    const ziel = location.hash.slice(1);
    const weiter = new URLSearchParams(location.search).get('weiter') || '';
    if (weiter) { const u = new URL(location.href); u.searchParams.delete('weiter'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    if (ziel && werkzeuge.some(w => w.ordner === ziel) && !/[?&]rundgang/.test(location.search)) {
      oeffne(ziel, weiter && weiter.startsWith('/zentrale/werkzeuge/' + ziel + '/') ? weiter : undefined);
      await new Promise(r => { el('rahmen').addEventListener('load', r, { once: true }); setTimeout(r, 1500); });
      zeichneHeute(); ladeHeute().then(zeichneHeute);
    } else {
      await Promise.race([ladeHeute(), new Promise(r => setTimeout(r, 1500))]);
      zeigeStart(true); zeichneHeute();
      if (!heutePunkte) ladeHeute().then(zeichneHeute);
    }
    passt();
    if (!ruhig) { el('titel').setAttribute('data-schlitz', ''); schlitz(el('titel')); }
    document.documentElement.classList.remove('wartet');
    void el('titel').offsetWidth; el('titel').classList.add('da');   /* Ausgangslage festhalten, dann rollt der Titel genau beim Sichtbarwerden */
  }
  anfang().catch(e => { if (window.ZENTRALE_MERK) ZENTRALE_MERK('Anfang: ' + (e && e.message || e)); document.documentElement.classList.remove('wartet'); });
  /* Für die Rundführung (fuehrung.js): Werkzeug öffnen, zurück zum Start, Leiste */
  window.ZENTRALE_API = { oeffne, zeigeStart, offen: () => offen, leisteAuf: () => leisteAuf, leisteKlapp: () => el('leiste').querySelector('[data-leiste-klapp]') && el('leiste').querySelector('[data-leiste-klapp]').click() };
  window.ZENTRALE_BEREIT = true;   /* Startfehler-Tür (wie Kontrollpanel R04): ohne dieses Zeichen öffnet fehler.js die Tür */
})();
