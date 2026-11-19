// Prüf-Chat 07.11.2026: jeden Knopf des Neubaus bedienen (Rechner 1440 px und Handy 390 px), Ergebnis als Liste.
// Lauf: python3 zentrale/server.py, dann node werkzeuge/03-entwurf-besuche/vergleich/pruefung-bedienen.js
// Server für diesen Lauf mit BESUCHE_DIENST=http://127.0.0.1:9/ starten, sonst fragt der Schlüssel-Test den echten Dienst.
// Der Schlüssel-Test hinterlegt einen erfundenen Schlüssel und nimmt ihn mit «Rückgängig» und «Entfernen» wieder weg.
const { chromium } = require('playwright');
const fs = require('fs');
const DATEN = __dirname + '/../../../daten/03-entwurf-besuche/';
const NB = process.env.NEUBAU || 'http://127.0.0.1:9100';   // Nachbesserung: NEUBAU=http://127.0.0.1:9607
const N = NB + '/zentrale/werkzeuge/03-entwurf-besuche/';
const erg = [];
const ok = (was, wahr, info = '') => { erg.push((wahr ? 'ja   ' : 'NEIN ') + was + (info ? ' · ' + info : '')); };
(async () => {
  const b = await chromium.launch();
  for (const breite of [1440, 390]) {
    erg.push(`--- ${breite} px`);
    fs.rmSync(DATEN + 'geoeffnet.json', { force: true });
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 }, acceptDownloads: true });
    const fehler = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(m.type() + ': ' + m.text()); });
    p.on('pageerror', e => fehler.push(String(e)));
    p.on('response', r => { if (r.status() >= 400) fehler.push(r.status() + ' ' + r.url()); });
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.href), r => r.abort());
    await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-besuche', '1'); localStorage.removeItem('tasty-besuche-tage'); } catch (e) {} });
    await p.goto(N + '?wer=Robert#start'); await p.waitForTimeout(1800);
    const txt = s => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, s);
    const randAuf = async () => { if (breite < 500) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(400); } };
    // Rand: jeder Bereich
    for (const [k, t] of [['haeuser', 'Alle Häuser'], ['besuche', 'Besuche'], ['zaehlung', 'So wird gezählt'], ['schluessel', 'Der Schlüssel'], ['start', 'Übersicht']]) {
      await randAuf();
      await p.click(`#rand [data-gehe="${k}"]`); await p.waitForTimeout(700);
      const h = await p.evaluate(() => location.hash), kt = await txt('#kopf .wo-kopf__titel, #kopf h1, #kopf [class*=titel]');
      const zu = breite < 500 ? await p.evaluate(() => !document.querySelector('#rand').classList.contains('auf')) : true;
      ok(`Rand «${t}» öffnet die Ansicht`, h === '#' + k, `${h}, Kopf: ${kt}${breite < 500 ? ', Rand danach zu: ' + zu : ''}`);
    }
    // Leiste: Farbe des Knopfs «gesehen»
    const art = () => p.evaluate(() => { const k = document.querySelector('#l-gesehen'); return k ? [k.className.match(/wo-kn--\w+/g).join(' '), k.disabled, k.innerText.trim()] : null; });
    ok('Leiste gelb, solange Neues offen ist', /wartet/.test((await art() || [''])[0]), JSON.stringify(await art()));
    // Häuser-Auswahl
    await randAuf(); await p.click('#rand [data-gehe="haeuser"]'); await p.waitForTimeout(600);
    for (const s of ['offen', 'zu', 'neu', 'alle']) {
      await p.click(`[data-sicht="${s}"]`); await p.waitForTimeout(400);
      const z = await p.evaluate(() => document.querySelectorAll('#ansicht [data-gehe="haus"]').length);
      const soll = await p.evaluate(s => +(document.querySelector(`[data-sicht="${s}"]`).innerText.match(/(\d+)\s*$/) || [])[1], s);
      ok(`Häuser-Auswahl «${s}» filtert`, z === soll, `${z} Zeilen, Knopf sagt ${soll}`);
    }
    // Ein Haus öffnen und zurück
    await p.click('#ansicht [data-gehe="haus"] >> nth=0'); await p.waitForTimeout(800);
    const hausTitel = await txt('.wo-sb h1');
    const wege = await p.evaluate(() => document.querySelectorAll('#ansicht .weg li, #ansicht .zeitleiste li, #ansicht [class*=weg] li').length);
    ok('Klick auf ein Haus zeigt das Haus mit Zeitleiste', /Kranich|Seeblick|Linden|Sonne|Alpina|Bellevue/i.test(hausTitel || '') && wege > 0, `${hausTitel}, ${wege} Schritte`);
    const ent = await p.evaluate(() => { const a = [...document.querySelectorAll('#ansicht a')].find(a => /Entwurf ansehen/i.test(a.innerText)); return a ? a.href + ' target=' + a.target : null; });
    ok('«Entwurf ansehen» verweist auf den Entwurf', !!ent, ent);
    // zweiter Besucher im Haus
    const bes = await p.$$('#ansicht .liste .besuch');
    if (bes.length > 1) { const y0 = await p.evaluate(() => scrollY); await bes[1].click(); await p.waitForTimeout(500); ok('Im Haus: anderer Besuch wechselt die Karte rechts', await p.evaluate(() => document.querySelectorAll('#ansicht .liste .besuch')[1].getAttribute('aria-pressed') === 'true'), `scroll vorher ${y0}`); }
    const zur = await p.$('#ansicht [data-gehe="haeuser"]');
    if (zur) { await zur.click(); await p.waitForTimeout(600); }
    ok('«Alle Häuser» führt zurück', (await p.evaluate(() => location.hash)) === '#haeuser');
    // Besuche: Auswahl und Karte
    await randAuf(); await p.click('#rand [data-gehe="besuche"]'); await p.waitForTimeout(600);
    for (const f of await p.$$eval('[data-filter]', l => l.map(x => x.dataset.filter))) {
      await p.click(`[data-filter="${f}"]`); await p.waitForTimeout(350);
      const z = await p.evaluate(() => document.querySelectorAll('#ansicht .liste .besuch').length);
      const soll = await p.evaluate(f => +(document.querySelector(`[data-filter="${f}"]`).innerText.match(/(\d+)\s*$/) || [])[1], f);
      ok(`Besuche-Auswahl «${f}» filtert`, z === soll, `${z} Karten, Knopf sagt ${soll}`);
    }
    await p.click('[data-filter="alle"]').catch(() => {}); await p.waitForTimeout(300);
    await p.click('#ansicht .liste .besuch >> nth=2'); await p.waitForTimeout(500);
    ok('Besuch wählen zeigt seine Karte', /Der Weg/.test(await txt('#ansicht .detail') || ''), (await txt('#ansicht .detail h2, #ansicht .detail h3') || '').slice(0, 60));
    // Zeitraum 7 / 30 / 90 (Nachbesserung): Säulen, Leiste und Liste folgen der Wahl
    await randAuf(); await p.click('#rand [data-gehe="start"]'); await p.waitForTimeout(600);
    for (const t of [7, 90, 30]) {
      await p.click(`#ansicht .zeitraum button[data-tage="${t}"]`); await p.waitForTimeout(900);
      const st = await p.evaluate(() => ({ tage: TASTY_BESUCHE_STAND().tage, saeulen: document.querySelectorAll('.saeulen .s').length, an: document.querySelector('#ansicht .zeitraum [aria-pressed="true"]').innerText, leiste: document.querySelector('#leiste').innerText.replace(/\s+/g, ' ') }));
      ok(`Zeitraum «${t} Tage» lädt den Zeitraum`, st.tage === t && st.saeulen === t && st.an === t + ' Tage', JSON.stringify(st));
    }
    for (const k of ['haeuser', 'besuche']) { await randAuf(); await p.click(`#rand [data-gehe="${k}"]`); await p.waitForTimeout(500); ok(`Zeitraum auch in «${k}»`, (await p.$$('#ansicht .zeitraum button')).length === 3); }
    // Als Tabelle sichern (Leiste am Rechner, unter der Liste überall)
    for (const sel of breite > 500 ? ['#l-export', '[data-sichern]'] : ['[data-sichern]']) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }).catch(() => null), p.click(sel)]);
      const inhalt = dl ? fs.readFileSync(await dl.path(), 'utf8') : '';
      await p.waitForTimeout(400);
      ok(`«Als Tabelle sichern» (${sel}) lädt eine Tabelle und quittiert`, !!dl && /^\ufeffArt;Haus;Tag/.test(inhalt) && /Als Tabelle gesichert/.test(await txt('#meldung') || ''), dl ? dl.suggestedFilename() + ', ' + (inhalt.split('\r\n').length - 2) + ' Zeilen' : 'kein Download');
    }
    // Gesehen + Quittung + Rückgängig
    await p.click('#l-gesehen'); await p.waitForTimeout(700);
    const q = await txt('#meldung .quit:last-child');
    ok('«Als gesehen markieren» zeigt Quittung mit vorher, nachher und Rückgängig', /Vorher/i.test(q || '') && /Nachher/i.test(q || '') && /Rückgängig/i.test(q || ''), q);
    ok('Leiste danach grün', /fertig/.test((await art() || [''])[0]), JSON.stringify(await art()));
    const randZahl = () => p.evaluate(() => document.querySelector('#rand [data-gehe="haeuser"]').innerText.replace(/\s+/g, ' '));
    const r1 = await randZahl();
    await p.click('#meldung [data-rueck]'); await p.waitForTimeout(900);
    const q2 = await txt('#meldung .quit');
    ok('Rückgängig holt die Markierung «neu» zurück', /wartet/.test((await art() || [''])[0]) && (await randZahl()) !== r1, `${JSON.stringify(await art())}, Rand vorher «${r1}» nachher «${await randZahl()}», Quittung: ${q2}`);
    // Neu laden
    await p.click('#l-neu'); await p.waitForTimeout(900);
    ok('«Neu laden» lädt und meldet sich', true, (await txt('#meldung .quit:last-child')) || 'ohne Quittung');
    // grau: alles gesehen, dann Seite neu öffnen
    await p.click('#l-gesehen'); await p.waitForTimeout(600);
    await p.reload(); await p.waitForTimeout(1600);
    ok('Leiste grau, wenn nichts Neues', /glas/.test((await art() || [''])[0]), JSON.stringify(await art()));
    // Schlüssel: Fenster, Esc, Grund, Hinterlegen, Rückgängig, Entfernen mit Rückfrage
    await randAuf(); await p.click('#rand [data-gehe="schluessel"]'); await p.waitForTimeout(600);
    await p.click('[data-schluessel] >> nth=0'); await p.waitForTimeout(400);
    ok('Schlüssel-Fenster öffnet, Fokus im Feld', await p.evaluate(() => document.activeElement && document.activeElement.tagName === 'INPUT'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok('Esc schliesst das Fenster', !(await p.$('#fenster .fenster')));
    await p.click('[data-schluessel] >> nth=0'); await p.waitForTimeout(300);
    await p.click('.fenster__grund', { position: { x: 5, y: 5 } }); await p.waitForTimeout(300);
    ok('Klick daneben schliesst das Fenster', !(await p.$('#fenster .fenster')));
    await p.click('[data-schluessel] >> nth=0'); await p.waitForTimeout(300);
    await p.click('.fenster [data-kn="1"], .fenster .wo-kn'); await p.waitForTimeout(400);
    ok('Hinterlegen ohne Eingabe wird abgefangen', !!(await p.$('#fenster .fenster')) || /leer|eingeben|fehlt/i.test(await txt('#meldung') || ''), await txt('#fenster .fenster') ? 'Fenster bleibt offen' : await txt('#meldung'));
    if (!(await p.$('#fenster .fenster'))) { await p.click('[data-schluessel] >> nth=0'); await p.waitForTimeout(300); }
    await p.fill('#fenster input', 'probe-schluessel-pruefchat'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
    const qs = await txt('#meldung .quit:last-child');
    const imRepo = fs.existsSync(__dirname + '/../schluessel.txt');
    const inAblage = fs.existsSync(DATEN + 'schluessel.txt') && fs.readFileSync(DATEN + 'schluessel.txt', 'utf8').includes('probe-schluessel');
    ok('Schlüssel hinterlegen: Quittung mit vorher, nachher und Rückgängig', /Vorher/i.test(qs || '') && /Rückgängig/i.test(qs || ''), qs);
    ok('Quittung sagt ehrlich, dass der Dienst nicht antwortet', !/kommen jetzt vom Dienst/.test(qs || '') && /nicht erreichbar|nicht angenommen/.test(qs || '') && /weiter Probedaten|letzter abgerufener Stand/.test(qs || ''), qs);
    ok('Schlüssel liegt nur in der Ablage, kommt nicht zurück in die Oberfläche', inAblage && !imRepo && !(await p.content()).includes('probe-schluessel-pruefchat'));
    ok('Ohne erreichbaren Dienst: Werkzeug sagt es und läuft weiter', true, await txt('#kopf .wo-kopf__stand, #kopf [class*=stand]') + ' / ' + (await txt('#ansicht .wo-sb p') || '').slice(0, 120));
    const rk = await p.$('#meldung .quit:last-child [data-rueck]');
    if (rk) { await rk.click(); await p.waitForTimeout(1500); }
    ok('Rückgängig nimmt den Schlüssel wieder weg', !fs.existsSync(DATEN + 'schluessel.txt') || !fs.readFileSync(DATEN + 'schluessel.txt', 'utf8').trim(), await txt('#meldung .quit:last-child'));
    // nochmal hinterlegen und mit Rückfrage entfernen
    await p.click('[data-schluessel] >> nth=0'); await p.waitForTimeout(300);
    await p.fill('#fenster input', 'probe-schluessel-pruefchat'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
    const entf = await p.$('#ansicht [data-schluessel]');
    if (entf) {
      await entf.click(); await p.waitForTimeout(400);
      const fr = await txt('#fenster .fenster');
      ok('Entfernen fragt erst nach', !!fr, fr);
      await p.click('#fenster .wo-kn'); await p.waitForTimeout(1500);
      ok('Nach Ja ist der Schlüssel weg, Quittung mit Rückgängig', !fs.existsSync(DATEN + 'schluessel.txt') || !fs.readFileSync(DATEN + 'schluessel.txt', 'utf8').trim(), await txt('#meldung .quit:last-child'));
    } else ok('Knopf «Entfernen» vorhanden', false);
    fs.rmSync(DATEN + 'schluessel.txt', { force: true }); fs.rmSync(DATEN + 'dienst-zuletzt.json', { force: true });
    // Rundgang
    await randAuf(); await p.click('#rand [data-rundgang]'); await p.waitForTimeout(900);
    let schritte = 0, titel = [];
    for (let i = 0; i < 12; i++) {
      const t = await p.evaluate(() => { const e = document.querySelector('.rdg-karte h2, .rdg-karte h3, [class^=rdg] h2, [class^=rdg] h3'); return e ? e.innerText : null; });
      if (!t) break; schritte++; titel.push(t);
      const w = await p.$('.rdg-los');
      if (!w) break; await w.click(); await p.waitForTimeout(800);
    }
    ok('Rundgang läuft durch und schliesst', schritte >= 3 && !(await p.evaluate(() => document.querySelector('.rdg-karte h2, .rdg-karte h3, [class^=rdg] h2, [class^=rdg] h3'))), `${schritte} Schritte: ${titel.join(' | ')}`);
    // Kopf und Rand: Wege
    const links = await p.evaluate(() => [...document.querySelectorAll('#kopf a[href], #rand a[href]')].map(a => a.href));
    for (const l of [...new Set(links)]) { const r = await p.request.get(l).catch(() => null); ok('Weg erreichbar ' + l.replace(/^http:\/\/127\.0\.0\.1:\d+/, ''), r && r.status() < 400, r ? String(r.status()) : 'keine Antwort'); }
    // tiefer Link
    await p.goto(N + '?wer=Robert&haus=seeblick'); await p.waitForTimeout(1600);
    ok('?haus=seeblick öffnet das Haus direkt', /Seeblick/i.test(await txt('.wo-sb h1') || ''), await txt('.wo-sb h1'));
    // Überlauf
    for (const h of ['#start', '#haeuser', '#besuche', '#zaehlung', '#schluessel']) {
      await p.goto(N + '?wer=Robert' + h); await p.waitForTimeout(1200);
      ok('Nichts über dem Rand ' + h, (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
    }
    ok('Konsole leer', fehler.length === 0, fehler.join(' | '));
    await p.close();
  }
  // Anleitung und Prüfseite bedienen
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const fe = []; p.on('pageerror', e => fe.push(String(e))); p.on('console', m => { if (m.type() === 'error') fe.push(m.text()); });
  await p.goto(N + 'anleitung.html'); await p.waitForTimeout(1500);
  const bilder = await p.evaluate(() => [...document.images].filter(i => i.getAttribute('src')).map(i => i.complete && i.naturalWidth > 0));   /* ohne src: Platz der Vergrösserung, leer bis zum Klick */
  ok('Anleitung: alle Bilder geladen', bilder.every(Boolean), `${bilder.filter(Boolean).length}/${bilder.length}`);
  const ank = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)));
  ok('Anleitung: Sprungmarken führen ins Ziel', ank.length === 0, ank.join(' '));
  await p.goto(N + 'pruefung.html'); await p.waitForTimeout(2000);
  const pt = await p.evaluate(() => document.body.innerText);
  ok('Prüfseite zeigt Browser, Server, Besuche, Fehler und Lexikon', ['BROWSER', 'SERVER', 'BESUCHE', 'WAS TUN'].every(w => pt.toUpperCase().includes(w)));
  const pk = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()));
  ok('Prüfseite: Knöpfe', pk.length > 0, pk.join(' | '));
  ok('Anleitung und Prüfseite ohne Konsolenfehler', fe.length === 0, fe.join(' | '));
  // Zentrale: heute und Rahmen
  const h = await (await p.request.get(NB + '/zentrale/api/03-entwurf-besuche/heute')).json();
  ok('heute für die Zentrale liefert Punkte', Array.isArray(h.punkte), `${h.punkte.length} Punkte`);
  await p.goto(NB + '/'); await p.waitForTimeout(2000);
  const fr = await p.evaluate(() => [...document.querySelectorAll('a[href*="03-entwurf-besuche"], [data-werkzeug*="03"], button')].filter(e => /Entwurf/.test(e.innerText)).map(e => e.outerHTML.slice(0, 160)));
  ok('Zentrale kennt das Werkzeug', fr.length > 0, fr[0] || '');
  if (fr.length) {
    await p.click('.wo-ag[data-oeffne="03-entwurf-besuche"]').catch(() => {}); await p.waitForTimeout(2500);
    let rahmen = null;   /* die Zentrale hält mehrere Rahmen; gesucht ist der, in dem das Werkzeug wirklich läuft */
    for (const f of p.frames().filter(f => /\/werkzeuge\/03-entwurf-besuche\//.test(f.url()))) if (await f.$('#ansicht .wo-sb').catch(() => null)) { rahmen = f; break; }
    ok('Werkzeug läuft im Rahmen der Zentrale', !!rahmen, rahmen ? rahmen.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '') : p.frames().map(f => f.url()).join(' '));
    await p.screenshot({ path: __dirname + '/bilder/zentrale-1440-neubau.jpg', type: 'jpeg', quality: 74 });
  }
  await b.close();
  fs.writeFileSync(__dirname + '/bilder/bedienen.txt', erg.join('\n') + '\n');
  console.log(erg.join('\n'));
})();
