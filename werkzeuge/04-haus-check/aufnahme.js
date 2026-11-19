// Aufnahme der Startseite eines Hauses für den Haus-Check (Laptop-Bild in der Karte).
//   node aufnahme.js <adresse> <ziel.jpg>
// Eigener, unsichtbarer Browser (Playwright, headless), 1440 × 900, nur die erste Ansicht, höchstens 25 Sekunden.
// Schliesst nur den eigenen Browser, nie einen anderen. Ergebnis auf stdout: {"ok":true} oder {"ok":false,"fehler":"…"}.
const PW = '/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright';
const [adresse, ziel] = process.argv.slice(2);
(async () => {
  let b;
  const ende = setTimeout(async () => { console.log(JSON.stringify({ ok: false, fehler: 'Zeit abgelaufen' })); try { if (b) await b.close(); } catch (e) {} process.exit(0); }, 28000);
  try {
    const { chromium } = require(PW);
    b = await chromium.launch({ headless: true });
    const p = await b.newPage({ viewport: { width: 1440, height: 900 }, locale: 'de-DE',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 TastyStudiosHausCheck/1' });
    await p.goto(adresse, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(1800);
    await p.screenshot({ path: ziel, type: 'jpeg', quality: 72 });
    console.log(JSON.stringify({ ok: true }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, fehler: String(e.message || e).split('\n')[0].slice(0, 160) }));
  } finally {
    clearTimeout(ende);
    try { if (b) await b.close(); } catch (e) {}
  }
})();
