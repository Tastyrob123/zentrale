// Bedienprobe 02-kundenliste (Prüf-Chat 07.11.2026; Nachbesserung: Heute-Link relativ, Import-Stände geprüft): jeden Knopf drücken, jede Funktion aus auftraege/02-kundenliste.md durchspielen, bei 1440 und 390 px. Setzt am Ende die Probedaten wieder ein.
const { chromium } = require('playwright');
const N = 'http://localhost:9100/werkzeuge/02-kundenliste/';
const A = 'http://localhost:9100/api/02-kundenliste/';
const erg = [];
const ok = (was, b, mehr = '') => { erg.push((b ? 'OK   ' : 'FEHL ') + was + (mehr ? ' — ' + mehr : '')); };
(async () => {
  const b = await chromium.launch();
  for (const breite of [1440, 390]) { try {
    const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
    await ctx.request.post(A + 'probedaten', { data: { wer: 'Prüfung' } });
    const p = await ctx.newPage();
    p.setDefaultTimeout(8000);
    const konsole = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') konsole.push(m.text()); });
    p.on('pageerror', e => konsole.push('pageerror ' + e.message));
    p.on('dialog', d => { konsole.push('dialog ' + d.message()); d.dismiss(); });
    await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-kundenliste', '1'); } catch (e) {} });
    const W = breite + ' ';
    const rand = async a => { if (breite < 900) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(400); } await p.click(`#ws-rand [data-ws-nav="${a}"]`); await p.waitForTimeout(700); };
    const daten = async () => (await (await ctx.request.get(A + 'haeuser')).json()).haeuser;
    const ueber = async name => { const r = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(W + 'kein Überlauf ' + name, r <= 0, 'scrollWidth+' + r); };
    await p.goto(N + '?ansicht=start'); await p.waitForTimeout(1500);
    ok(W + 'Gruss nach Tageszeit', /Guten (Morgen|Tag|Abend)\./.test(await p.textContent('.wo-sb__h')));
    ok(W + 'Foto im Startbild geladen', await p.evaluate(() => { const i = document.querySelector('.wo-sb__foto img'); return i && i.complete && i.naturalWidth > 0; }));
    ok(W + 'Lage mit drei Fächern', (await p.locator('.wo-lage .wo-lg').count()) === 3);
    await ueber('Start');
    // Lage-Links
    for (const [z, t] of [['heute', 'Heute'], ['brett', 'Brett'], ['verlauf', 'Frühere']]) {
      await p.goto(N + '?ansicht=start'); await p.waitForTimeout(900);
      await p.click(`.wo-lage [data-gehe="${z}"]`); await p.waitForTimeout(700);
      ok(W + 'Lage-Knopf ' + z, (await p.getAttribute('#ws-mitte', 'data-ws-ansicht')) === z);
    }
    // Häufig gebraucht
    for (const a of ['heute', 'brett', 'liste', 'bestand']) {
      await p.goto(N + '?ansicht=start'); await p.waitForTimeout(900);
      await p.click(`[data-aufgabe="${a}"]`); await p.waitForTimeout(700);
      ok(W + 'Kachel ' + a, (await p.getAttribute('#ws-mitte', 'data-ws-ansicht')) === a);
    }
    await p.goto(N + '?ansicht=start'); await p.waitForTimeout(900);
    await p.click('[data-aufgabe="notiz"]'); await p.waitForTimeout(500);
    ok(W + 'Kachel Notiz fragt nach Haus', await p.isVisible('[data-ws-fenster="haus-waehlen"]'));
    await p.click('[data-ws-fenster="haus-waehlen"] .kn'); await p.waitForTimeout(900);
    ok(W + 'Kachel Notiz öffnet Notizfenster', await p.isVisible('[data-ws-fenster="notiz"]'));
    await p.keyboard.press('Escape');
    await p.goto(N + '?ansicht=start'); await p.waitForTimeout(900);
    await p.click('[data-aufgabe="schritt"]'); await p.waitForTimeout(400);
    await p.click('[data-ws-fenster="haus-waehlen"] .kn'); await p.waitForTimeout(900);
    ok(W + 'Kachel Schritt öffnet Haus mit Feld', (await p.evaluate(() => document.activeElement && document.activeElement.id)) === 'kl-schritt');
    // Bereich-Kacheln
    await p.goto(N + '?ansicht=start'); await p.waitForTimeout(900);
    await p.click('[data-ws-bk="Gespräch"]'); await p.waitForTimeout(700);
    ok(W + 'Bereich-Kachel Gespräch', (await p.getAttribute('#ws-mitte', 'data-ws-ansicht')) === 'stand:Gespräch' && (await p.locator('.cu-t').count()) === 2);
    // Rand: alle Einträge
    const navs = await p.evaluate(() => [...document.querySelectorAll('#ws-rand [data-ws-nav]')].map(e => e.dataset.wsNav));
    for (const a of navs) { await rand(a); ok(W + 'Rand ' + a, (await p.getAttribute('#ws-mitte', 'data-ws-ansicht')) === a); await ueber(a); }
    // Neues Haus: leerer Name warnt, dann anlegen, Quittung, Rückgängig
    await p.goto(N + '?ansicht=liste'); await p.waitForTimeout(900);
    await p.click('[data-kl-neu]'); await p.waitForTimeout(400);
    await p.click('[data-kl-anlegen]'); await p.waitForTimeout(300);
    ok(W + 'Neues Haus ohne Namen warnt', await p.isVisible('.ws-ang__warn'));
    await p.fill('#kl-neu-name', 'Prüfhaus Seeblick'); await p.fill('#kl-neu-ort', 'Kiel');
    await p.click('[data-ws-fenster="neu"] [data-ws-wahl="Art"] [data-wert="Restaurant"]');
    await p.click('[data-kl-anlegen]'); await p.waitForTimeout(1200);
    let d = await daten();
    ok(W + 'Neues Haus angelegt', d.some(h => h.name === 'Prüfhaus Seeblick' && h.art === 'Restaurant' && h.ort === 'Kiel'));
    ok(W + 'Quittung nach Anlegen mit Rückgängig', await p.isVisible('[data-ws-quittung] >> text=Rückgängig'));
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
    d = await daten(); ok(W + 'Rückgängig nimmt Anlegen zurück', !d.some(h => h.name === 'Prüfhaus Seeblick'));
    // Stand in der Liste: gelb, Vorher/nachher, Verwerfen, Speichern, Rückgängig
    await p.goto(N + '?ansicht=liste'); await p.waitForTimeout(900);
    const id0 = await p.getAttribute('.cu-t >> nth=0', 'data-kl-haus');
    const alt = (await daten()).find(h => h.id === id0).stand;
    const ziel = alt === 'Angebot' ? 'Vertrag' : 'Angebot';
    const stand = async () => { await p.locator('.cu-t >> nth=0').locator('.ws-auswahl__knopf').click(); await p.locator(`.cu-t >> nth=0`).locator(`.ws-auswahl__liste [data-wert="${ziel}"]`).click(); await p.waitForTimeout(400); };
    await stand();
    ok(W + 'Leiste gelb bei offener Eingabe', (await p.getAttribute('#ws-speichern', 'data-ws-lage')) === 'offen');
    const farbe = await p.evaluate(() => getComputedStyle(document.querySelector('#ws-speichern')).backgroundImage + getComputedStyle(document.querySelector('#ws-speichern')).backgroundColor);
    await p.click('#ws-vgl'); await p.waitForTimeout(400);
    ok(W + 'Vorher, nachher zeigt beide Werte', (await p.innerText('[data-ws-fenster="vergleich"]')).includes(ziel));
    await p.keyboard.press('Escape');
    if (await p.isVisible('#ws-verwerfen')) {
    await p.click('#ws-verwerfen'); await p.waitForTimeout(300);
    await p.click('[data-ws-fenster="verwerfen"] .kn'); await p.waitForTimeout(600);
    ok(W + 'Verwerfen stellt zurück', (await p.getAttribute('#ws-speichern', 'data-ws-lage')) === 'ruhig' && (await daten()).find(h => h.id === id0).stand === alt);
    await stand(); } else ok(W + 'Verwerfen am Handy ausgeblendet (wie Vorlage: zwei Knöpfe)', true);
    await p.keyboard.press('Control+s'); await p.waitForTimeout(1200);
    ok(W + 'Strg+S speichert', (await daten()).find(h => h.id === id0).stand === ziel);
    ok(W + 'Leiste grün nach Speichern', (await p.getAttribute('#ws-speichern', 'data-ws-lage')) === 'gespeichert');
    const q = await p.innerText('[data-ws-quittung]');
    ok(W + 'Quittung vorher/nachher', q.includes(alt) && q.includes(ziel), q.replace(/\n/g, ' '));
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
    ok(W + 'Rückgängig Stand', (await daten()).find(h => h.id === id0).stand === alt);
    await p.waitForTimeout(6200);
    ok(W + 'Leiste wieder grau', (await p.getAttribute('#ws-speichern', 'data-ws-lage')) === 'ruhig');
    // Suche, Filter, Sortierung
    await p.goto(N + '?ansicht=liste'); await p.waitForTimeout(900);
    await p.fill('#kl-such', 'Grindelwald'); await p.waitForTimeout(300);
    ok(W + 'Suche nach Ort', (await p.locator('.cu-t').count()) === 1);
    await p.fill('#kl-such', ''); await p.waitForTimeout(300);
    await p.click('[data-ws-auswahl="Fälligkeit"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Fälligkeit"] [data-wert="faellig"]'); await p.waitForTimeout(300);
    ok(W + 'Filter Fälligkeit', (await p.locator('.cu-t').count()) === 3);
    await p.click('[data-ws-auswahl="Fälligkeit"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Fälligkeit"] [data-wert="alle"]');
    await p.click('[data-ws-auswahl="Stand"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Stand"] [data-wert="gefunden"]'); await p.waitForTimeout(300);
    ok(W + 'Filter Stand', (await p.locator('.cu-t').count()) === 2);
    await p.click('[data-ws-auswahl="Stand"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Stand"] [data-wert="alle"]');
    await p.click('[data-ws-wahl="Art"] [data-wert="Restaurant"]'); await p.waitForTimeout(300);
    const nR = await p.locator('.cu-t').count(); ok(W + 'Filter Art', nR > 0 && nR < 10, nR + ' Restaurants');
    await p.click('[data-ws-wahl="Art"] [data-wert="alle"]');
    await p.click('[data-ws-auswahl="Sortierung"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Sortierung"] [data-wert="name"]'); await p.waitForTimeout(300);
    const namen = await p.$$eval('.cu-t .kl-name', l => l.map(e => e.textContent));
    ok(W + 'Sortierung nach Name', JSON.stringify(namen) === JSON.stringify([...namen].sort((a, b) => a.localeCompare(b, 'de'))));
    await p.click('[data-ws-auswahl="Sortierung"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Sortierung"] [data-wert="faellig"]');
    // Brett ziehen (nur Rechner)
    if (breite > 900) {
      await p.goto(N + '?ansicht=brett'); await p.waitForTimeout(900);
      const k = p.locator('[data-kl-karte]').first(); const kid = await k.getAttribute('data-kl-karte');
      const von = (await daten()).find(h => h.id === kid).stand;
      const nach = von === 'geprüft' ? 'angeschrieben' : 'geprüft';   // eine Spalte im ersten Bild (die hinteren liegen seitlich im Brett)
      await k.dragTo(p.locator(`[data-kl-stand="${nach}"]`)); await p.waitForTimeout(600);
      ok(W + 'Brett: Karte gezogen wartet gelb', (await p.getAttribute('#ws-speichern', 'data-ws-lage')) === 'offen' && (await p.locator(`[data-kl-stand="${nach}"] [data-kl-karte="${kid}"]`).count()) === 1);
      await p.click('#ws-speichern'); await p.waitForTimeout(1200);
      ok(W + 'Brett: gespeichert', (await daten()).find(h => h.id === kid).stand === nach);
      await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
      ok(W + 'Brett: Rückgängig', (await daten()).find(h => h.id === kid).stand === von);
    }
    // Haus: Felder, Datum, Ansprechpartner, Notiz, Verlauf, Löschen
    await p.goto(N + '?haus=alpenblick-grindelwald'); await p.waitForTimeout(1000);
    await p.fill('[data-kl-feld="ansprechpartner|telefon"]', '+41 33 000 00 00');
    await p.fill('#kl-schritt', 'Prüfschritt');
    await p.click('[data-ws-auswahl="Tag"] .ws-auswahl__knopf'); await p.click('[data-ws-auswahl="Tag"] [data-wert="20"]');
    await p.click('[data-ws-form="angaben"] [data-ws-wahl="Art"] [data-wert="Restaurant"]');
    ok(W + 'Haus: 4 Eingaben offen', (await p.getAttribute('#ws-leiste', 'data-ws-offen')) === '4');
    await p.click('#ws-speichern'); await p.waitForTimeout(1300);
    let h = (await daten()).find(x => x.id === 'alpenblick-grindelwald');
    ok(W + 'Haus: Felder gespeichert', h.ansprechpartner.telefon === '+41 33 000 00 00' && h.naechster_schritt.text === 'Prüfschritt' && /-20$/.test(h.naechster_schritt.datum) && h.art === 'Restaurant');
    ok(W + 'Haus: Verlauf mit wer und wann', (h.verlauf || []).some(v => v.wer && v.wann));
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
    h = (await daten()).find(x => x.id === 'alpenblick-grindelwald');
    ok(W + 'Haus: Rückgängig', h.naechster_schritt.text !== 'Prüfschritt' && h.art === 'Hotel');
    ok(W + 'Haus: Besuche-Platzhalter mit Kürzel', await p.isVisible('[data-kl-besuche]'));
    const nNot = h.notizen.length;
    await p.click('.kl-notizen .ws-taste'); await p.waitForTimeout(300);
    await p.fill('#kl-notiz', 'Prüfnotiz'); await p.click('[data-kl-notiz-speichern]'); await p.waitForTimeout(1200);
    h = (await daten()).find(x => x.id === 'alpenblick-grindelwald');
    ok(W + 'Notiz mit wer und wann', h.notizen.length === nNot + 1 && h.notizen.some(n => n.text === 'Prüfnotiz' && n.wer && n.wann));
    ok(W + 'Notiz sichtbar im Haus', (await p.innerText('#kl-notizen')).includes('Prüfnotiz'));
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
    ok(W + 'Notiz Rückgängig', (await daten()).find(x => x.id === 'alpenblick-grindelwald').notizen.length === nNot);
    await p.click('text=Haus löschen …'); await p.waitForTimeout(300);
    ok(W + 'Löschen fragt nach', await p.isVisible('[data-ws-fenster="loeschen"]'));
    await p.click('[data-ws-fenster="loeschen"] >> text=Behalten'); await p.waitForTimeout(300);
    ok(W + 'Behalten löscht nicht', (await daten()).some(x => x.id === 'alpenblick-grindelwald'));
    await p.click('text=Haus löschen …'); await p.click('[data-kl-loeschen]'); await p.waitForTimeout(1200);
    ok(W + 'Löschen nach Rückfrage', !(await daten()).some(x => x.id === 'alpenblick-grindelwald'));
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1200);
    ok(W + 'Löschen Rückgängig', (await daten()).some(x => x.id === 'alpenblick-grindelwald'));
    // Heute-Schnittstelle
    const heute = await (await ctx.request.get(A + 'heute')).json();
    ok(W + 'Heute-Schnittstelle', Array.isArray(heute.punkte) && heute.punkte.length === 3 && heute.punkte.every(x => x.text && /^\?haus=/.test(x.link)), JSON.stringify(heute.punkte[0]));
    await p.goto(new URL(heute.punkte[0].link, N).href); await p.waitForTimeout(1000);   // Vertrag: link relativ zum Werkzeug
    ok(W + 'Link aus Heute öffnet Haus', (await p.getAttribute('#ws-mitte', 'data-ws-ansicht') || '').startsWith('haus:'));
    // Import und Probedaten
    await p.goto(N + '?ansicht=bestand'); await p.waitForTimeout(900);
    await p.click('[data-kl-import]'); await p.waitForTimeout(2000);
    ok(W + 'Import mit Bericht', await p.isVisible('#kl-bericht'));
    d = await daten(); { const st = n => (d.find(x => x.name === n) || {}).stand, namen = d.map(x => x.name);
      ok(W + 'Import übernimmt echte Häuser, Stände wo belegt', d.length > 0 && !d.some(x => x.probe) && st('txtme.social') === 'Vertrag' && st('Grand Hotel Beau-Rivage') === 'Entwurf geschickt' && st('Salt & Silver') === 'Entwurf geschickt' && st('Carlton-Europe Vintage Adults Hotel') === 'angeschrieben' && st('Landgasthof Ruedihus') === 'offen', d.length + ' Häuser, Stände ' + [...new Set(d.map(x => x.stand))].join('/'));
      ok(W + 'Import: keine Nicht-Kunden, keine Doppelten', !namen.some(n => /Tasty|Instagram|Werkzeuge|Kurs|Secret Mountain|Familie Maeder|Grand Beau-Rivage$|^Carlton-Europe$/.test(n)) && new Set(namen).size === namen.length, namen.join(', ')); }
    await p.click('[data-ws-quittung] >> text=Rückgängig'); await p.waitForTimeout(1500);
    d = await daten(); ok(W + 'Import Rückgängig', d.length === 10 && d.every(x => x.probe));
    await p.click('text=Probedaten laden …'); await p.click('[data-kl-probe]'); await p.waitForTimeout(1200);
    ok(W + 'Probedaten laden mit Quittung', await p.isVisible('[data-ws-quittung]'));
    // Kopf
    const kopf = await p.evaluate(() => [...document.querySelectorAll('#ws-kopf a')].map(a => a.getAttribute('href') + '|' + (a.getAttribute('aria-label') || a.innerText.trim())));
    ok(W + 'Kopf-Links', kopf.length > 0, kopf.join(' ; '));
    for (const href of ['pruefung.html', 'anleitung.html', '/', 'https://tastystudios.vercel.app/']) {
      const r = await ctx.request.get(new URL(href, N).href); ok(W + 'Ziel erreichbar ' + href, r.ok());
    }
    if (breite < 900) {
      await p.goto(N); await p.waitForTimeout(900);
      await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(500);
      ok(W + 'Handy: Rand klappt auf', await p.evaluate(() => document.documentElement.classList.contains('wo-rand-auf')));
      await p.click('#ws-rand [data-ws-nav="brett"]'); await p.waitForTimeout(600);
      ok(W + 'Handy: Wahl klappt zu', !(await p.evaluate(() => document.documentElement.classList.contains('wo-rand-auf'))));
      // Stand am Handy über das Haus
    }
    // Rundgang
    const p2 = await ctx.newPage(); p2.on('pageerror', e => konsole.push('rundgang ' + e.message));
    await p2.goto(N + '?rundgang'); await p2.waitForTimeout(6500);
    let schritte = 0;
    for (let i = 0; i < 8; i++) { const w = p2.locator('.rdg-karte .rdg-los'); if (!(await w.count()) || !(await w.isVisible())) break; schritte++; await w.click(); await p2.waitForTimeout(900); }
    ok(W + 'Rundgang lässt sich durchklicken', schritte >= 5, schritte + ' Klicks');
    await p2.close();
    // Prüfseite und Anleitung
    const p3 = await ctx.newPage(); const k3 = []; p3.on('console', m => m.type() === 'error' && k3.push(m.text())); p3.on('pageerror', e => k3.push(e.message));
    await p3.goto(N + 'pruefung.html'); await p3.waitForTimeout(2000);
    const pt = await p3.innerText('body');
    ok(W + 'Prüfseite mit Lexikon', /Was tun/.test(pt) || /Lexikon/i.test(pt), pt.slice(0, 0));
    const pk = await p3.$$eval('button, a', l => l.map(e => e.innerText.trim()).filter(Boolean));
    ok(W + 'Prüfseite Knöpfe', true, pk.join(' | '));
    await ueberSeite(p3, W + 'Prüfseite', ok);
    await p3.goto(N + 'anleitung.html'); await p3.waitForTimeout(1500); await p3.evaluate(() => window.scrollTo(0, 1e6)); await p3.waitForTimeout(1500);   // Bilder unter dem ersten Bild laden erst beim Hinscrollen
    ok(W + 'Anleitung Bilder geladen', await p3.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)));
    await ueberSeite(p3, W + 'Anleitung', ok);
    ok(W + 'Konsole Prüf/Anleitung leer', k3.length === 0, k3.join(' | '));
    ok(W + 'Konsole Werkzeug leer', konsole.length === 0, konsole.join(' | '));
    await ctx.close();
  } catch (e) { ok(breite + ' ABBRUCH', false, e.message.split('\n')[0]); } }
  await (await b.newContext()).request.post(A + 'probedaten', { data: { wer: 'Prüfung' } });
  await b.close();
  console.log(erg.join('\n'));
})();
async function ueberSeite(p, name, ok) { const r = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok('kein Überlauf ' + name, r <= 0, '+' + r); }
