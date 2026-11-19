// Nachbesserung 1 und 2: Probedaten zweimal einspielen, eigene Liste zurückholen, jeweils mit Rückfrage, Quittung und Rückgängig.
// node vergleich/pruefung/nb-probedaten.js  (Zentrale auf 9100, probe.py läuft) → Bilder in vergleich/bilder/nb-*.jpg
const { chromium } = require('playwright');
const B = __dirname + '/../bilder/';
const api = async w => (await fetch('http://localhost:' + (process.env.ZENTRALE || '9100') + '/zentrale/api/01-feinschliff/' + w)).json();
const texte = async () => (await api('uebersicht')).doc.wuensche.map(w => w.text);
const wunsch = t => fetch('http://localhost:' + (process.env.DIENST || '8981') + '/zentrale/api/feinschliff', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ k: 'probe-anna-feinschliff', op: 'wunsch', w: { seite: 'index.html', abschnitt: '', name: '', text: t } }) });
const pruefe = (name, ja) => { console.log((ja ? 'OK    ' : 'FEHLER') + ' ' + name); if (!ja) process.exitCode = 1; };
(async () => {
  await wunsch('ANNAS ECHTER WUNSCH');
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 900 } }), log = [];
  p.on('console', m => { if (m.type() === 'error') log.push(m.text()); }); p.on('pageerror', e => log.push(e.message));
  await p.route(r => !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r), r => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('rundgang-tasty-feinschliff', '1'); } catch (e) {} });
  await p.goto('http://localhost:' + (process.env.ZENTRALE || '9100') + '/zentrale/werkzeuge/01-feinschliff/?wer=Robert#pruefstand'); await p.waitForTimeout(2500);
  const k = async t => { const n = await p.evaluate(t => { const b = [...document.querySelectorAll('.ws-taste, .kn, .ws-fenster__kn a, .ws-fenster__kn button')].find(b => b.textContent.trim() === t); if (b) { b.click(); return true; } return false; }, t); await p.waitForTimeout(1300); return n; };
  const fen = () => p.locator('[data-ws-fenster]').count();
  const q = () => p.locator('#ws-quittung').innerText().then(t => t.replace(/\s+/g, ' ')).catch(() => '');

  await k('Probedaten einspielen');
  pruefe('1. Einspielen ohne Rückfrage (nichts geht verloren)', await fen() === 0);
  pruefe('1. Quittung mit vorher/nachher und Rückgängig', /wird/.test(await q()) && /Rückgängig/i.test(await q()));
  await k('Probedaten einspielen');
  pruefe('2. Einspielen ohne Neues: keine Rückfrage', await fen() === 0);
  await wunsch('NEU SEIT DEM EINSPIELEN'); await p.reload(); await p.waitForTimeout(2500);
  await k('Probedaten einspielen');
  pruefe('3. Einspielen mit Neuem: Rückfrage', await fen() === 1);
  await p.screenshot({ path: B + 'nb-probedaten-rueckfrage-1440-neubau.jpg', type: 'jpeg', quality: 80 });
  await k('Abbrechen');
  pruefe('3. Abbrechen lässt alles stehen', (await texte()).includes('NEU SEIT DEM EINSPIELEN'));
  await k('Probedaten einspielen'); await k('Ja, neu einspielen');
  pruefe('3. nach Ja: Neues weg', !(await texte()).includes('NEU SEIT DEM EINSPIELEN'));
  pruefe('3. Quittung mit Rückgängig', /Rückgängig/i.test(await q()));
  await k('Rückgängig');
  pruefe('3. Rückgängig holt das Neue zurück', (await texte()).includes('NEU SEIT DEM EINSPIELEN'));
  pruefe('3. Sicherung liegt weiter bereit', (await api('uebersicht')).sicherung_da);

  await k('Eigene Liste zurückholen');
  pruefe('4. Zurückholen: Rückfrage', await fen() === 1);
  await p.screenshot({ path: B + 'nb-zurueckholen-rueckfrage-1440-neubau.jpg', type: 'jpeg', quality: 80 });
  await k('Ja, zurückholen');
  let t = await texte();
  pruefe('4. eigene Liste da (ANNAS ECHTER WUNSCH)', t.includes('ANNAS ECHTER WUNSCH') && !t.includes('NEU SEIT DEM EINSPIELEN'));
  pruefe('4. Quittung vorher/nachher mit Rückgängig', /Eigene Liste zurückgeholt/i.test(await q()) && /wird/.test(await q()) && /Rückgängig/i.test(await q()));
  await p.screenshot({ path: B + 'nb-zurueckgeholt-quittung-1440-neubau.jpg', type: 'jpeg', quality: 80 });
  await k('Rückgängig');
  t = await texte();
  pruefe('4. Rückgängig: Stand vor dem Zurückholen wieder da', t.includes('NEU SEIT DEM EINSPIELEN') && (await api('uebersicht')).sicherung_da);
  await k('Eigene Liste zurückholen'); await k('Ja, zurückholen');
  t = await texte();
  pruefe('5. Ende: eigene Liste da, keine Sicherung mehr', t.includes('ANNAS ECHTER WUNSCH') && !(await api('uebersicht')).sicherung_da);
  pruefe('Konsole leer', !log.length); if (log.length) console.log(log);
  await b.close();
})();
