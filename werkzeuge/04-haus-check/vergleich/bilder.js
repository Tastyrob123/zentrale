/* Bilder für die Vergleichsseite (Prüf-Chat 07.11.2026): je Ansicht die Vorlage und der Haus-Check bei 1440 und 390 px, nebeneinander in index.html.
   Vorlage: Le Registre (Aufbau), Le Bureau (Speichern in der Leiste, Quittung, Fenster), La Réception (Prüfseite).
   So aufnehmen:
     git clone --depth 1 https://github.com/Tastyrob123/culinarium-demo <ordner>/culinarium-demo
     python3 -m http.server 9400 --bind 127.0.0.2 --directory <ordner>
       (127.0.0.2, weil die Demo-Weiche der Vorlage auf localhost/127.0.0.1 ohne Umleitung hängen bleibt; Ports 9081 bis 9087 leitet sie nach aussen)
     python3 zentrale/server.py
     node werkzeuge/04-haus-check/vergleich/bilder.js            (alle)   oder   … bilder.js start   (eine Ansicht)
   Vorher legt das Skript die Probedaten im Haus-Check neu an (daten/04-haus-check/ wird dabei geleert). */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ZIEL = path.join(__dirname, 'bilder');
const VB = 'http://127.0.0.2:9400/culinarium-demo/werkzeuge/';
const V = VB + 'registre/uwerkzeuge/registre/', VBU = VB + 'bureau/uwerkzeuge/bureau/', VR = VB + 'reception/uwerkzeuge/reception/';
const N = 'http://localhost:9100/werkzeuge/04-haus-check/';

const scroll = y => async p => { await p.evaluate(y => scrollTo(0, y === 'unten' ? document.documentElement.scrollHeight : y), y); };
const zweiter = sel => async p => { const l = p.locator(sel); if (await l.count() > 1) { await l.nth(1).scrollIntoViewIfNeeded(); await l.nth(1).click(); } };
const rand = async p => { const k = p.locator('#kopf .wo-kopf__ber, .wo-kopf__ber'); if (await k.first().isVisible()) await k.first().click(); };
const bnav = (p, k) => p.evaluate(k => document.querySelector('[data-ws-nav="' + k + '"]').click(), k);   // auch bei zugeklapptem Rand am Handy
const bureauEingabe = async p => {
  await bnav(p, 'angaben'); await p.waitForTimeout(1500);
  const f = p.locator('#ws-mitte input').first(); await f.click(); await f.fill('+49 163 3909579'); await f.press('Tab');
};
/* Die Demo der Vorlage speichert nicht (Antwort ohne Quittung). Für das Bild antwortet hier der Server so, wie Le Bureau es im Betrieb tut:
   neuer Stand, eine Zeile Quittung (was, wo, vorher, nachher) und die Daten für «Rückgängig». Aussehen und Ablauf bleiben die der Vorlage. */
const bureauAntwort = p => p.evaluate(() => { const orig = window.fetch; window.fetch = function (inp, init) { const url = typeof inp === 'string' ? inp : inp.url;
  if (init && init.method === 'POST' && /aendern\//.test(url)) return orig(url.replace('aendern/', 'stand/')).then(r => r.json()).then(st => new Response(JSON.stringify({ stand: st,
    quittung: [{ was: 'Telefon der Bar', wo: 'alle Seiten', vorher: '+49 163 3909578', nachher: '+49 163 3909579' }], vorher_daten: { demo: 1 } }), { headers: { 'Content-Type': 'application/json' } }));
  return orig(inp, init); }; });
const bureauGespeichert = async p => { await bureauAntwort(p); await bureauEingabe(p); await p.waitForTimeout(800); await p.click('#ws-speichern'); return 'kurz'; };
const bureauFenster = async p => { await bnav(p, 'b:start'); await p.waitForTimeout(2000); await p.evaluate(() => { const f = document.querySelector('#ws-mitte .ws-foto'); f.scrollIntoView({ block: 'center' }); f.click(); }); };
const neuGeprueft = async p => { await p.click('[data-probehaus="hotel-am-kai"]'); await p.waitForTimeout(2500); };
const neuGespeichert = async p => { await neuGeprueft(p); await p.click('#l-speichern'); return 'kurz'; };
const neuKorb = async p => { await p.goto(N + '#haeuser'); await p.waitForTimeout(2500); await neuFenster(p); await p.waitForTimeout(500); await p.locator('.hc-fenster__kn .wo-kn').first().click(); await p.waitForTimeout(1500); await p.goto(N + '#papierkorb'); await p.waitForTimeout(2500); };
const neuFenster = async p => { await p.locator('[data-haus-weg]').first().scrollIntoViewIfNeeded(); await p.click('[data-haus-weg]'); };

// [schlüssel, titel, satz, vorlage-url, vorlage-tun, neu-url, neu-tun]
const ANSICHTEN = [
  ['start', 'Startbild', 'Kopf, Rand, Startbild mit Gruss nach Tageszeit, einem Satz, Foto, Anleitung und Kennzahlen.', V + '?gruss=tag#start', null, N + '?gruss=tag#start', null],
  ['start-mitte', 'Übersicht, Mitte', 'Unter dem Startbild: Vorlage Kennzahlen und Säulen, Neubau Feld zum Prüfen und Kennzahlen.', V + '?gruss=tag#start', scroll(700), N + '?gruss=tag#start', scroll(700)],
  ['start-unten', 'Übersicht, unten', '«Zuletzt» mit Karten, Ranglisten, Leiste unten.', V + '?gruss=tag#start', scroll('unten'), N + '?gruss=tag#start', scroll('unten')],
  ['liste', 'Liste und Karte', 'Besuche (Vorlage) und Geprüfte Häuser (Neubau): Auswahl, Liste nach Tagen, daneben die gewählte Karte.', V + '#besuche', scroll(520), N + '#haeuser', scroll(520)],
  ['liste-gewaehlt', 'Anderer Eintrag gewählt', 'Zweiter Eintrag angeklickt: die Karte wechselt.', V + '#besuche', zweiter('#ansicht .liste .besuch'), N + '#haeuser', zweiter('#ansicht .liste .besuch')],
  ['neues-haus', 'Neues Haus (nur Neubau, Inhalt)', 'Vorlage: Herkunft (Bereich mit Startbild und Blatt). Neubau: Feld zum Prüfen, frischer Check als Karte, Leiste gelb.', V + '#herkunft', null, N + '#pruefen', neuGeprueft],
  ['tabelle', 'Tabelle', 'Seiten (Vorlage) und Wo es fehlt (Neubau): Band mit Zahlen, Tabelle mit Balken.', V + '#seiten', scroll(420), N + '#bereiche', scroll(420)],
  ['verlauf', 'Verlauf', 'Säulen, Zeitraum, Woche für Woche.', V + '#verlauf', scroll(480), N + '#verlauf', scroll(480)],
  ['zum-platz', 'Zum Platz · Zur Kundenliste', 'Werte, Rangliste, Trichter.', V + '#buchung', scroll(480), N + '#kundenliste', scroll(480)],
  ['so-wird', 'So wird gezählt · So wird geprüft', 'Blätter mit Listen, «Gut zu wissen».', V + '#zaehlung', scroll(300), N + '#geprueft', scroll(300)],
  ['speichern-gelb', 'Leiste: Speichern gelb', 'Etwas wartet: Le Bureau nach einer Eingabe, Haus-Check nach einem frischen Check.', VBU, bureauEingabe, N + '#pruefen', neuGeprueft],
  ['quittung', 'Leiste grün und Quittung', 'Nach dem Speichern: Speichern grün, Quittung mit vorher, nachher und «Rückgängig».', VBU, bureauGespeichert, N + '#pruefen', neuGespeichert],
  ['fenster', 'Fenster', 'Le Bureau: Fenster «Foto tauschen». Haus-Check: Rückfrage «Haus in den Papierkorb?» im selben Fenster.', VBU, bureauFenster, N + '#haeuser', neuFenster],
  ['rand', 'Rand', 'Am Handy klappt der Rand über «Bereiche» auf; am Rechner steht er links.', V + '#start', rand, N + '#start', rand],
  ['rundgang', 'Rundgang', 'Lichtkegel auf dem echten Element, Karte mit zwei, drei Sätzen.', V + '?rundgang#start', null, N + '?rundgang#start', null],
  ['anleitung', 'Anleitung', 'Kopf mit Tafel, Knöpfe, Inhalt nach Themen.', V + 'anleitung.html', null, N + 'anleitung.html', null],
  ['anleitung-kapitel', 'Anleitung, Kapitel', 'Kapitel mit Text, Schritten, «Gut zu wissen» und Bild.', V + 'anleitung.html#k03', null, N + 'anleitung.html#k03', null],
  ['pruefung', 'Prüfseite', 'Punkte mit Ampel, Fehlerliste, Reparaturen, Lexikon (Vorlage: La Réception).', VR + 'pruefung.html', null, N + 'pruefung.html', null],
  ['papierkorb', 'Papierkorb (nur Neubau)', 'Vorlage: Frühere Fassungen in Le Bureau (zurückholen). Neubau: ein Haus im Papierkorb, daneben «Zurückholen». Steht zuletzt, weil es ein Haus aus der Liste nimmt.', VBU, async p => { await bnav(p, 'verlauf'); }, N + '#start', neuKorb],
];
module.exports = ANSICHTEN.map(a => a.slice(0, 3));

async function probedaten(b) {
  fs.rmSync(path.join(__dirname, '..', '..', '..', 'daten', '04-haus-check'), { recursive: true, force: true });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(N + '#start'); await p.waitForTimeout(2500); await p.click('#l-probe'); await p.waitForTimeout(6000);
  await p.context().close();
}

if (require.main === module) (async () => {
  const b = await chromium.launch(), nur = process.argv[2], bericht = [];
  fs.mkdirSync(ZIEL, { recursive: true });
  for (const breite of [1440, 390]) { await probedaten(b); for (const [name, , , vu, vt, nu, nt] of ANSICHTEN) {
    if (nur && !nur.split(',').includes(name)) continue;
    for (const [seite, url, tun] of [['vorlage', vu, vt], ['neubau', nu, nt]]) {
      const ctx = await b.newContext({ viewport: { width: breite, height: breite > 500 ? 900 : 844 } });
      await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {} });
      const p = await ctx.newPage(), log = [];
      await p.route(u => !['localhost', '127.0.0.1', '127.0.0.2'].includes(u.hostname), r => r.abort());
      p.on('console', m => { if (m.type() === 'error') log.push(m.text()); });
      p.on('pageerror', e => log.push(e.message));
      await p.goto(url, { waitUntil: 'load', timeout: 25000 }).catch(e => log.push('goto: ' + e.message.split('\n')[0]));
      await p.waitForTimeout(3200);
      const art = tun ? await tun(p).catch(e => log.push('tun: ' + e.message.split('\n')[0])) : '';
      await p.waitForTimeout(art === 'kurz' ? 700 : 1800);
      const breit = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => -1);
      await p.screenshot({ path: path.join(ZIEL, `${name}-${breite}-${seite}.jpg`), type: 'jpeg', quality: 76 });
      if (seite === 'neubau') bericht.push(`${breite} ${name}: Überlauf ${breit}px, Konsole ${log.length ? log.join(' | ') : 'leer'}`);
      else if (log.some(x => /^(tun|goto)/.test(x))) bericht.push(`${breite} ${name} (Vorlage): ${log.filter(x => /^(tun|goto)/.test(x)).join(' | ')}`);
      await ctx.close();
    }
  } }
  await b.close();
  console.log(bericht.join('\n'));
})();
