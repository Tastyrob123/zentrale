// VERALTET seit 17.11.2026 (Umbau zum Kundenstamm: kein Brett, keine Stände, keine Fälligkeiten mehr in «Kunden»). Nicht starten:
// der Lauf ersetzt alle Häuser durch Probedaten. Die Prüfung läuft über ~/Desktop/Website-Projekte/_Werkzeuge/oberflaeche_pruefen.js.
if (!process.env.PRUEFSTAND_ALT) { console.log('Veraltet seit 17.11.2026, nicht gestartet (würde alle Häuser durch Probedaten ersetzen).'); process.exit(1); }
// Prüfstand der Kundenliste (Playwright): node werkzeuge/02-kundenliste/pruefstand.js bei laufendem python3 zentrale/server.py.
// Spielt jeden Ablauf bei 1440 und 390 px durch, setzt danach die Probedaten wieder ein. Meldet Fehler der Konsole und alles, was über den Rand läuft.
const { chromium } = require('playwright');
const N = 'http://localhost:9100/werkzeuge/02-kundenliste/';
const A = 'http://localhost:9100/api/02-kundenliste/';
let fehlerZahl = 0;
const ok = (b, t) => { console.log((b ? 'ok   ' : 'FEHLT') + ' ' + t); if (!b) fehlerZahl++; };
(async () => {
  const b = await chromium.launch();
  for (const breite of [1440, 390]) {
    console.log('--- ' + breite + ' px');
    const p = await b.newPage({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    const konsole = [];
    p.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
    p.on('pageerror', e => konsole.push(e.message));
    await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r), r => r.abort());
    await p.request.post(A + 'probedaten', { data: { wer: 'Prüfstand' } });
    const ueber = async wo => { const w = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(w <= 0, wo + ': nichts über den Rand (' + w + ')'); };
    const bereit = async a => p.waitForSelector(`#ws-mitte[data-ws-bereit="${a}"]`, { timeout: 8000 });
    const nav = async a => { if (breite < 900) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(400); } await p.click(`#ws-rand [data-ws-nav="${a}"]`); await bereit(a); await p.waitForTimeout(500); };
    await p.goto(N + '?ansicht=start'); await bereit('start'); await p.waitForTimeout(800);
    ok(await p.locator('.wo-sb__h').count() === 1, 'Startbild mit Gruss'); await ueber('Übersicht');
    ok(await p.locator('.wo-lage .wo-lg').count() === 3, 'Lage mit drei Fächern');
    ok(await p.locator('.wo-aufg .wo-ag').count() === 7, 'Häufig gebraucht: 7 Kacheln');
    ok(await p.locator('.wo-ber .wo-bk').count() === 9, 'Stand für Stand: 9 Kacheln');
    // Liste: Stand ändern → gelb → speichern → Quittung → Rückgängig
    await nav('liste'); await ueber('Liste');
    const karte = p.locator('[data-kl-haus="hotel-sonne-andermatt"], .cu-t').first();
    const id = await karte.getAttribute('data-kl-haus');
    await karte.locator('.ws-auswahl__knopf').click(); await p.locator('.ws-auswahl__liste [data-wert="geprüft"]').first().click();
    ok(await p.locator('#ws-speichern[data-ws-lage="offen"]').count() === 1, 'Speichern wird gelb (offen)');
    await p.click('#ws-vgl'); ok(await p.locator('[data-ws-fenster="vergleich"] .ws-wert--neu').count() >= 1, 'Vorher, nachher im Fenster'); await p.keyboard.press('Escape');
    await p.click('#ws-speichern'); await p.waitForSelector('[data-ws-quittung]');
    ok((await p.textContent('[data-ws-q="nachher"]')).includes('geprüft'), 'Quittung zeigt nachher');
    ok(await p.locator('#ws-speichern[data-ws-lage="gespeichert"]').count() === 1, 'Speichern wird grün');
    let h = await (await p.request.get(A + 'haeuser')).json();
    ok(h.haeuser.find(x => x.id === id).stand === 'geprüft', 'Stand gespeichert');
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(700);
    h = await (await p.request.get(A + 'haeuser')).json();
    ok(h.haeuser.find(x => x.id === id).stand !== 'geprüft', 'Rückgängig stellt zurück');
    // Filter und Suche
    await p.fill('#kl-such', 'Elbdeck'); await p.waitForTimeout(200);
    ok(await p.locator('.cu-liste .cu-t').count() === 1, 'Suche findet ein Haus');
    await p.fill('#kl-such', ''); 
    // Brett: ziehen (nur am Rechner)
    await nav('brett'); await ueber('Brett');
    if (breite > 900) {
      await p.dragAndDrop('[data-kl-karte="hotel-sonne-andermatt"]', '[data-kl-stand="angeschrieben"]');
      ok(await p.locator('[data-kl-stand="angeschrieben"] [data-kl-karte="hotel-sonne-andermatt"]').count() === 1, 'Karte gezogen, wartet gelb');
      await p.click('#ws-speichern'); await p.waitForSelector('[data-ws-quittung]');
      h = await (await p.request.get(A + 'haeuser')).json();
      ok(h.haeuser.find(x => x.id === 'hotel-sonne-andermatt').stand === 'angeschrieben', 'Brett: Stand gespeichert');
    }
    // Haus: Feld ändern, Notiz, Verlauf
    await p.goto(N + '?haus=cafe-bar-elbdeck-hamburg'); await bereit('haus:cafe-bar-elbdeck-hamburg'); await p.waitForTimeout(600); await ueber('Haus');
    await p.fill('[data-kl-feld="ort"]', 'Hamburg-Altona');
    await p.click('#ws-speichern'); await p.waitForSelector('[data-ws-quittung]');
    h = await (await p.request.get(A + 'haeuser')).json();
    const e = h.haeuser.find(x => x.id === 'cafe-bar-elbdeck-hamburg');
    ok(e.ort === 'Hamburg-Altona' && e.verlauf.some(v => v.was.startsWith('Ort')), 'Feld gespeichert, Verlauf mit Name');
    await p.click('.wo-sb__kn >> text=Notiz schreiben'); await p.fill('#kl-notiz', 'Prüfstand: angerufen.');
    await p.click('[data-kl-notiz-speichern]'); await p.waitForSelector('[data-ws-quittung] >> text=Notiz gespeichert');
    ok(await p.locator('.kl-notizen >> text=Prüfstand: angerufen.').count() === 1, 'Notiz steht im Haus');
    // Löschen mit Rückfrage und Rückgängig
    await p.click('text=Haus löschen …'); ok(await p.locator('[data-ws-fenster="loeschen"]').count() === 1, 'Löschen fragt nach');
    await p.click('[data-kl-loeschen]'); await p.waitForSelector('[data-ws-quittung]');
    h = await (await p.request.get(A + 'haeuser')).json(); ok(!h.haeuser.some(x => x.id === 'cafe-bar-elbdeck-hamburg'), 'Gelöscht');
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(700);
    h = await (await p.request.get(A + 'haeuser')).json(); ok(h.haeuser.some(x => x.id === 'cafe-bar-elbdeck-hamburg'), 'Löschen zurückgenommen');
    // Neues Haus
    await p.goto(N + '?ansicht=start'); await bereit('start'); await p.waitForTimeout(500);
    await p.click('[data-aufgabe="neu"]'); await p.fill('#kl-neu-name', 'Hotel Prüfstand'); await p.fill('#kl-neu-ort', 'Kiel');
    await p.click('[data-kl-anlegen]'); await p.waitForSelector('[data-ws-quittung]'); await ueber('Fenster Neues Haus');
    h = await (await p.request.get(A + 'haeuser')).json(); ok(h.haeuser.some(x => x.name === 'Hotel Prüfstand'), 'Neues Haus angelegt');
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(700);
    h = await (await p.request.get(A + 'haeuser')).json(); ok(!h.haeuser.some(x => x.name === 'Hotel Prüfstand'), 'Anlegen zurückgenommen');
    // Heute, Verlauf, Bestand
    await nav('heute'); ok(await p.locator('.cu-liste .cu-t').count() >= 1, 'Heute fällig zeigt Häuser'); await ueber('Heute');
    await nav('verlauf'); ok(await p.locator('[data-kl-tag]').count() >= 1, 'Frühere Änderungen'); await ueber('Verlauf');
    await nav('bestand'); await ueber('Bestand');
    if (breite > 900) {
      await p.click('[data-kl-import]'); await p.waitForSelector('[data-ws-quittung]'); await p.waitForTimeout(500);
      ok(await p.locator('#kl-bericht:not([hidden])').count() === 1, 'Import mit Bericht');
      await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(700);
      h = await (await p.request.get(A + 'haeuser')).json(); ok(h.quelle === 'probedaten', 'Import zurückgenommen');
    }
    const heute = await (await p.request.get(A + 'heute')).json();
    ok(Array.isArray(heute.punkte) && heute.punkte.every(x => x.text && x.wann && x.link), 'Heute-Schnittstelle nach Vertrag');
    if (breite < 900) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(400); ok(await p.locator('html.wo-rand-auf').count() === 1, 'Handy: Rand klappt auf'); await ueber('Handy-Rand'); }
    ok(!konsole.length, 'Konsole leer' + (konsole.length ? ': ' + konsole.join(' | ') : ''));
    await p.close();
  }
  // Prüfseite und Anleitung
  const p = await b.newPage(); const k = []; p.on('pageerror', e => k.push(e.message));
  await p.goto(N + 'pruefung.html'); await p.waitForTimeout(1200); ok(await p.locator('[data-punkt]').count() >= 3, 'Prüfseite zeigt Punkte'); ok(await p.locator('.wsp-lex').count() >= 5, 'Lexikon');
  await p.goto(N + 'anleitung.html'); await p.waitForTimeout(600); ok(await p.locator('.an-schritt').count() >= 6, 'Anleitung'); ok(!k.length, 'Prüfseite/Anleitung ohne Skriptfehler ' + k.join(' | '));
  await p.request.post(A + 'probedaten', { data: { wer: 'Prüfstand' } });
  await b.close();
  console.log(fehlerZahl ? fehlerZahl + ' Punkte fehlen' : 'Alles geprüft.');
  process.exit(fehlerZahl ? 1 : 0);
})();
