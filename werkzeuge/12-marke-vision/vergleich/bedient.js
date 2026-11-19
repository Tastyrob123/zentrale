// Nachbesserung 07.11.2026: Rand im ersten Bild (Vorlage und Neubau) und das Bedienen des Neubaus (Speichern grau, gelb, grün, Quittung,
// vorher und nachher, Rückgängig, Löschen mit Rückfrage und Zurückholen, Antwort als Robert, Prüfseite mit «Neu prüfen» und Reparaturen).
// Neu aufnehmen: python3 zentrale/server.py; python3 -m http.server 9081 --bind 127.0.0.1 --directory vorlage;
// node werkzeuge/12-marke-vision/vergleich/bedient.js
// Legt Fragen an und löscht sie wieder; die Ablage daten/12-marke-vision/ steht danach wie vorher (der Stand wird vorher gesichert und zurückgelegt).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ZIEL = __dirname + '/bilder/';
const ABLAGE = path.join(__dirname, '../../../daten/12-marke-vision');
const V = 'http://127.0.0.1:9081/culinarium-demo/werkzeuge/livre/uwerkzeuge/livre/index.html#start';
const N = 'http://localhost:9100/werkzeuge/12-marke-vision/';
const ok = (w, t) => { if (!w) throw new Error('Nicht erfüllt: ' + t); console.log('ok  ' + t); };

(async () => {
  const sicher = {}; if (fs.existsSync(ABLAGE)) for (const f of fs.readdirSync(ABLAGE)) sicher[f] = fs.readFileSync(path.join(ABLAGE, f));
  const b = await chromium.launch();
  const fehler = [];
  const seite = async (breite, url, init) => {
    const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-12-marke-vision', '1'); localStorage.setItem('wo-rundgang-gesehen', '1'); } catch (e) {} });
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(breite + ' ' + url + ': ' + m.text().slice(0, 160)); });
    p.on('pageerror', e => fehler.push(breite + ' ' + url + ': JS ' + e.message.slice(0, 160)));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.toString()), r => r.abort());
    if (url) await p.goto(url, { waitUntil: 'commit' });
    return { p, ctx };
  };
  try {
    /* ---------- Rand im ersten Bild (1440 px): sofort, 120 ms, 300 ms ---------- */
    for (const [wer, url] of [['vorlage', V], ['neubau', N + '?wer=Anna#start']]) {
      const { p, ctx } = await seite(1440, url);
      await p.waitForSelector('#rand .wo-re', { state: 'attached', timeout: 20000 });
      const t0 = Date.now(), lage = [];
      for (const ms of [0, 120, 300, 900]) {
        await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
        lage.push(await p.evaluate(() => [...document.querySelectorAll('#rand .wo-re')].map(e => Math.round(e.getBoundingClientRect().top)).join(',')));
        if (ms < 900) await p.screenshot({ path: ZIEL + 'rand-erstes-bild-' + ms + 'ms-' + wer + '.jpg', type: 'jpeg', quality: 80, clip: { x: 0, y: 40, width: 320, height: 420 } });
      }
      if (url.indexOf('9100') > 0) { ok(lage.every(x => x === lage[0]), 'Neubau: Rand steht vom ersten Bild an still (' + lage[0] + ')');
        const ueber = await p.evaluate(() => { const re = [...document.querySelectorAll('#rand .wo-re')].map(e => e.getBoundingClientRect()), gr = [...document.querySelectorAll('#rand .wo-rand__gr, #rand h2, #rand h3, #rand .wo-zw')].map(e => e.getBoundingClientRect());
          return re.some(a => gr.some(g => a.top < g.bottom && g.top < a.bottom && a.left < g.right && g.left < a.right)); });
        ok(!ueber, 'Neubau: kein Eintrag liegt über einem Gruppentitel'); }
      await ctx.close();
    }

    for (const breite of [1440, 390]) {
      /* ---------- Frage stellen: grau, gelb, grün, Quittung, vorher und nachher, Rückgängig ---------- */
      let { p, ctx } = await seite(breite, N + '?wer=Anna#warum');
      await p.waitForSelector('#leiste [data-neu]'); await p.waitForTimeout(1600);
      await p.click('#leiste [data-neu]');
      const sp = '#fenster [data-sp]';
      ok(await p.$eval(sp, e => e.disabled && e.classList.contains('wo-kn--glas')), breite + ': Speichern grau, solange das Feld leer ist');
      await p.waitForTimeout(500); await p.screenshot({ path: ZIEL + 'bedient-fenster-grau-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.fill('#fenster [data-text]', 'Gilt der Satz «Digital Hospitality Studio» auch auf Deutsch, oder bleibt er englisch?');
      ok(await p.$eval(sp, e => !e.disabled && e.classList.contains('wo-kn--wartet')), breite + ': Speichern gelb nach dem Tippen');
      await p.screenshot({ path: ZIEL + 'bedient-fenster-gelb-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.click(sp); await p.waitForTimeout(250);
      ok(await p.$eval(sp, e => e.classList.contains('wo-kn--fertig')).catch(() => false), breite + ': Speichern grün «Gespeichert»');
      await p.screenshot({ path: ZIEL + 'bedient-fenster-gruen-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.waitForSelector('#meldung .wo-quittung'); await p.waitForTimeout(1200);
      ok(/Frage gespeichert/.test(await p.textContent('#meldung .wo-quittung')), breite + ': Quittung «Frage gespeichert»');
      await p.screenshot({ path: ZIEL + 'bedient-quittung-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.click('#meldung .wo-quittung [data-vn]'); await p.waitForSelector('#fenster .mv-vn'); await p.waitForTimeout(700);
      ok(/Vorher[\s\S]*Nachher/.test(await p.textContent('#fenster .mv-vn')), breite + ': Fenster «Vorher, nachher»');
      await p.screenshot({ path: ZIEL + 'bedient-vorher-nachher-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.keyboard.press('Escape');
      const n1 = await (await p.request.get(N.replace('/zentrale/werkzeuge/', '/zentrale/api/') + 'fragen')).json();
      await p.click('#meldung .wo-quittung [data-rg]'); await p.waitForTimeout(800);
      const n2 = await (await p.request.get(N.replace('/zentrale/werkzeuge/', '/zentrale/api/') + 'fragen')).json();
      ok(n2.fragen.length === n1.fragen.length - 1, breite + ': «Rückgängig» nimmt die neue Frage wieder weg');
      await ctx.close();

      /* ---------- Ändern, Löschen mit Rückfrage, Zurückholen, Antworten als Robert ---------- */
      ({ p, ctx } = await seite(breite, N + '?wer=Robert#fragen'));
      await p.waitForSelector('#ansicht [data-loeschen]'); await p.waitForTimeout(1600);
      const id = await p.$eval('#ansicht [data-loeschen]', e => e.dataset.loeschen);
      await p.click(`#ansicht [data-aendern="${id}"]`);
      await p.fill('#fenster [data-text]', (await p.inputValue('#fenster [data-text]')) + ' (ergänzt)');
      await p.click('#fenster [data-sp]'); await p.waitForSelector('#meldung .wo-quittung'); await p.waitForTimeout(400);
      ok(/Frage geändert/.test(await p.textContent('#meldung')), breite + ': Ändern mit Quittung');
      await p.click('#meldung .wo-quittung:last-child [data-rg]'); await p.waitForTimeout(700);
      ok(!/\(ergänzt\)/.test(await p.textContent('#ansicht')), breite + ': «Rückgängig» nach dem Ändern holt den alten Text');
      await p.evaluate(() => document.querySelectorAll('#meldung > *').forEach(e => e.remove()));
      await p.click(`#ansicht [data-loeschen="${id}"]`); await p.waitForSelector('#fenster .mv-rueck'); await p.waitForTimeout(600);
      ok(/Wirklich löschen\?/.test(await p.textContent('#fenster')), breite + ': Löschen fragt vorher');
      await p.screenshot({ path: ZIEL + 'bedient-loeschen-frage-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.click('#fenster [data-ja]'); await p.waitForSelector('#meldung .wo-quittung'); await p.waitForTimeout(900);
      ok(!(await p.$(`#ansicht [data-loeschen="${id}"]`)), breite + ': Frage gelöscht');
      await p.screenshot({ path: ZIEL + 'bedient-quittung-loeschen-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.click('#meldung .wo-quittung [data-rg]'); await p.waitForTimeout(900);
      ok(!!(await p.$(`#ansicht [data-loeschen="${id}"]`)), breite + ': «Rückgängig» holt die gelöschte Frage zurück');
      await p.evaluate(() => document.querySelectorAll('#meldung > *').forEach(e => e.remove()));
      const offen = await p.$('#ansicht [data-antwort]');
      const aid = await offen.evaluate(e => e.dataset.antwort);
      await offen.click(); await p.fill('#fenster [data-text]', 'Bleibt englisch, so steht es im Strategiepapier.');
      await p.click('#fenster [data-sp]'); await p.waitForSelector('#meldung .wo-quittung'); await p.waitForTimeout(1300);
      ok(/Antwort/.test(await p.textContent('#meldung')), breite + ': Antwort als Robert mit Quittung');
      await p.evaluate(i => { const e = document.querySelector(`[data-antwort="${i}"]`); if (e) e.scrollIntoView({ block: 'center' }); }, aid); await p.waitForTimeout(400);
      await p.screenshot({ path: ZIEL + 'bedient-antwort-' + breite + '.jpg', type: 'jpeg', quality: 76 });
      await p.click('#meldung .wo-quittung [data-rg]'); await p.waitForTimeout(700);
      await ctx.close();

      /* ---------- Prüfseite: Neu prüfen, Reparaturen mit zweitem Klick, Lexikon ---------- */
      ({ p, ctx } = await seite(breite, N + 'pruefung.html', () => { try { localStorage.setItem('tasty-mv-fehler', JSON.stringify([{ zeit: '2026-11-07T09:12:00Z', text: 'Probe: absichtlich eingetragen', wo: 'test', seite: '/zentrale/werkzeuge/12-marke-vision/' }])); } catch (e) {} }));
      await p.waitForSelector('#punkte .z'); await p.waitForTimeout(600);
      ok(/Probe: absichtlich/.test(await p.textContent('#fehler')), breite + ': Prüfseite zeigt mitgeschriebene Fehler');
      await p.click('#neu'); await p.waitForTimeout(600);
      ok((await p.$$('#punkte .z')).length > 10 && /in Ordnung/.test(await p.textContent('#satz')), breite + ': «Neu prüfen» prüft neu, alles in Ordnung');
      await p.click('[data-rep="fehler"]');
      ok(/Wirklich\?/.test(await p.textContent('[data-rep="fehler"]')), breite + ': Reparatur fragt beim ersten Klick');
      await p.click('[data-rep="fehler"]'); await p.waitForTimeout(600);
      ok(/Keine Fehler/.test(await p.textContent('#fehler')), breite + ': Fehlerliste geleert nach dem zweiten Klick');
      ok((await p.$$('#lex article')).length >= 8, breite + ': Lexikon als Karten');
      await ctx.close();
    }
  } catch (e) { console.log('FEHLER ' + e.message); process.exitCode = 1; }
  finally {
    await b.close();
    if (fs.existsSync(ABLAGE)) for (const f of fs.readdirSync(ABLAGE)) if (!(f in sicher)) fs.unlinkSync(path.join(ABLAGE, f));
    for (const f in sicher) fs.writeFileSync(path.join(ABLAGE, f), sicher[f]);
    console.log(fehler.length ? 'Konsole:\n' + fehler.join('\n') : 'Konsole leer');
  }
})();
