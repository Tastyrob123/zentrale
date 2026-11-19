/* Nachbesserung 07.11.2026: je behobene Abweichung ein Bild nach vergleich/nachbesserung/ (Neubau, 1440 und 390 px) und eine Prüfung im Ablauf.
   Start: python3 zentrale/server.py, rm -rf daten/08-beitraege, dann node werkzeuge/08-beitraege/vergleich/nachbesserung.js
   Speichert einmal (Quittung) und nimmt es mit «Rückgängig» sofort zurück. */
const { chromium } = require('playwright');
const ZIEL = __dirname + '/nachbesserung/';
const N = 'http://localhost:9100/werkzeuge/08-beitraege/', ID = 'e-20261105-fernsicht-frage', T = N + '?ansicht=text&entwurf=' + ID;
const pruef = [];
const soll = (ja, was) => { pruef.push((ja ? 'ok   ' : 'FEHLT ') + was); };
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 } });
    const p = await ctx.newPage(), log = [];
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(m.text()); }); p.on('pageerror', e => log.push(e.message));
    const bild = async (name, opt = {}) => p.screenshot(Object.assign({ path: ZIEL + name + '-' + w + '.jpg', type: 'jpeg', quality: 80 }, opt));
    // 1 Zeile zeigt beim Tippen «nicht gespeichert»
    await p.goto(T); await p.waitForTimeout(1800);
    await p.click('#ws-gruppen [data-g="text"] .ws-st >> nth=0'); await p.waitForTimeout(600);
    await p.click('.ws-ed textarea'); await p.keyboard.press('End'); await p.keyboard.type(' neu'); await p.waitForTimeout(1600);
    const z = await p.$eval('#ws-gruppen [data-g="text"] .ws-st', x => [x.classList.contains('ws-offen'), x.querySelector('small').textContent]);
    soll(z[0] && /nicht gespeichert/.test(z[1]), w + ' Zeile beim Tippen: ' + z[1]);
    await bild('1-eingabe');
    for (let i = 0; i < 4; i++) await p.keyboard.press('Backspace');
    await p.waitForTimeout(300);
    const z2 = await p.$eval('#ws-gruppen [data-g="text"] .ws-st', x => [x.classList.contains('ws-offen'), x.querySelector('small').textContent]);
    soll(!z2[0] && !/nicht gespeichert/.test(z2[1]), w + ' zurückgetippt, Zeile wieder ruhig: ' + z2[1]);
    // 2 Gross öffnen
    await p.keyboard.type(' neu'); await p.waitForTimeout(300);
    const [neu] = await Promise.all([ctx.waitForEvent('page'), p.click('#bt-gross')]);
    await neu.waitForTimeout(1600);
    const t = await neu.textContent('.bt-post__text').catch(() => '');
    soll(/Tisch\? neu/.test(t), w + ' Gross öffnen zeigt den Beitrag mit der offenen Eingabe');
    await neu.screenshot({ path: ZIEL + '2-gross-' + w + '.jpg', type: 'jpeg', quality: 80 }); await neu.close();
    // Hinweis Quittung
    await p.click('#ws-speichern'); await p.waitForTimeout(1500);
    await bild('6-quittung');
    const q = await p.$eval('.ws-quit', k => { const r = k.querySelector('.ws-rund:last-child').getBoundingClientRect(), t = k.querySelector('.ws-quit__t').getBoundingClientRect(); return { zuOben: r.top < t.bottom, farbe: getComputedStyle(k.querySelector('.ws-quit__t span')).color }; });
    soll(q.zuOben, w + ' Schliessen steht oben in der Quittung, Satz in ' + q.farbe);
    await p.click('.ws-quit >> text=Rückgängig'); await p.waitForTimeout(1500);
    // 3 kurze Ansichten
    for (const a of ['start', 'l:alle', 'l:entwurf', 'l:veroeffentlicht', 'vorlagen', 'regeln']) {
      await p.goto(N + '?ansicht=' + a); await p.waitForTimeout(1500);
      const top = await p.evaluate(() => [document.querySelector('#ws-rand').getBoundingClientRect().top, document.querySelector('#ws-mitte').getBoundingClientRect().top].map(Math.round));
      if (w > 500) soll(top[0] === 96 && top[1] === 96, w + ' ' + a + ': Rand und Inhalt oben bei ' + top.join(' / ') + ' px');
      if (a === 'l:entwurf') await bild('3-entwurf');
      if (a === 'l:veroeffentlicht') await bild('3-veroeffentlicht');
      if (a === 'l:alle') { // 4 Bilder in Listen
        const n = await p.$$eval('.bt-karte', k => k.map(x => !!x.querySelector('.bt-karte__bild img, .bt-karte__bild b')));
        soll(n.length && n.every(Boolean), w + ' jede Karte hat ein Bild (' + n.length + ')');
        await bild('4-karten');
      }
      if (a === 'vorlagen') { const roh = await p.$eval('#ws-mitte', m => /\{\w+\}/.test(m.textContent)); soll(!roh, w + ' Vorlagen ohne {Platzhalter}'); await bild('7-vorlagen'); }
    }
    // 5 Rundgang
    await p.goto(N + '?ansicht=start&rundgang'); await p.waitForTimeout(7000);
    const da = await p.$eval('.rdg-weg', x => [...x.children].map(b => getComputedStyle(b).backgroundColor)).catch(() => []);
    soll(da.length && da[0] !== da[1], w + ' Rundgang: aktueller Strich ' + da[0] + ', übrige ' + da[1]);
    await bild('5-rundgang');
    // Zahl im gewählten Rand-Eintrag
    if (w > 500) { await p.goto(N + '?ansicht=vorlagen'); await p.waitForTimeout(1500); const f = await p.$eval('#ws-rand .wo-an em.wo-rand__z, #ws-rand [aria-current] em.wo-rand__z', e => getComputedStyle(e).color).catch(() => 'keine'); soll(f !== 'keine', w + ' Zahl im gewählten Eintrag: ' + f); await bild('8-randzahl', { clip: { x: 0, y: 74, width: 340, height: 520 } }); }
    soll(!log.length, w + ' Konsole leer' + (log.length ? ': ' + log.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(pruef.join('\n'));
})();
