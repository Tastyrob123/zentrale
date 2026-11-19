const { chromium } = require('playwright');
const S='http://localhost:8980/';
const dienst=async()=>{const r=await fetch('http://localhost:8981/api/feinschliff?k=probe-robert-feinschliff');return r.json()};
const ok=(n,b,x='')=>console.log((b?'OK   ':'FEHLT')+' '+n+(x?' — '+x:''));
(async()=>{
await fetch('http://localhost:9100/api/01-feinschliff/probedaten',{method:'POST',body:'{}'});
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();const log=[];
p.on('console',m=>{if(m.type()==='error')log.push(m.text()+' '+m.location().url)});p.on('pageerror',e=>log.push('pageerror '+e.message));
await p.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r),r=>r.abort());
await p.goto(S+'?feinschliff=probe-anna-feinschliff',{waitUntil:'load'});await p.waitForTimeout(3000);
ok('Leiste erscheint mit Schlüssel', await p.locator('.fs-leiste').count()===1);
ok('Schlüssel aus Adresse genommen', !p.url().includes('feinschliff='), p.url());
let d0=(await dienst()).doc; const n0=d0.aenderungen.length, w0=d0.wuensche.length;
// 1 Wörter
await p.click('.fs-leiste [data-modus=text]');await p.waitForTimeout(400);
const ziel=p.locator('main p').first(); await ziel.evaluate(e=>e.scrollIntoView({block:'center'})); const alt=(await ziel.innerText()).trim();
await ziel.click({force:true});await p.waitForTimeout(300);
ok('Wörter: Text wird bearbeitbar', await ziel.getAttribute('contenteditable')==='true');
await p.keyboard.press('End');await p.keyboard.type(' Pruefwort');
// Einfügen mit fremder Formatierung
await p.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/html','<b style="color:red">FETT</b>');dt.setData('text/plain','FETT');document.activeElement.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}))});
const html=await ziel.innerHTML();ok('Einfügen ohne fremde Formatierung', html.includes('FETT')&&!/<b|style=/.test(html.split('Pruefwort')[1]||''), html.slice(-80));
await p.keyboard.press('Enter');await p.waitForTimeout(1200);
let d=(await dienst()).doc;ok('Wörter: Enter speichert', /Pruefwort/.test(JSON.stringify(d.aenderungen)));const n1=d.aenderungen.length;
const toast=await p.locator('.fs-toast').innerText().catch(()=>'');ok('Quittung mit Rückgängig', /Rückgängig/i.test(toast), toast.replace(/\s+/g,' ').slice(0,140));
const toastHtml=await p.locator('.fs-toast').innerHTML();ok('Quittung zeigt vorher (durchgestrichen) und nachher', /<s>/.test(toastHtml), toastHtml.slice(0,160));
// Esc bricht ab
const z2=p.locator('main p').nth(1);await z2.evaluate(e=>e.scrollIntoView({block:'center'}));const alt2=await z2.innerText();await z2.click({force:true});await p.keyboard.type(' XYZ');await p.keyboard.press('Escape');await p.waitForTimeout(800);
ok('Wörter: Esc bricht ab', (await z2.innerText())===alt2 && (await dienst()).doc.aenderungen.length===n1 && !/XYZ/.test(JSON.stringify((await dienst()).doc)));
// Überschrift Zeile für Zeile
const h=p.locator('main h1, main h2').first();await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click({force:true});await p.waitForTimeout(300);
const hEdit=await p.evaluate(()=>{const e=document.querySelector('[contenteditable=true]');return e&&e.tagName+' '+e.className+' '+e.innerText.slice(0,40)});ok('Wörter: Überschrift-Zeile einzeln bearbeitbar', !!hEdit, hEdit);
await p.keyboard.press('Escape');
// Fuss und Knopf
const f=p.locator('footer a, footer p').first();await f.evaluate(e=>e.scrollIntoView({block:'center'}));await f.click({force:true});await p.waitForTimeout(300);
ok('Wörter: Fuss bearbeitbar', !!(await p.evaluate(()=>{const e=document.querySelector('[contenteditable=true]');return e&&e.closest('footer')})));
await p.keyboard.press('Escape');
// 2 Schrift
await p.click('.fs-leiste [data-modus=schrift]');await p.waitForTimeout(400);
const sp=p.locator('main p').nth(2);await sp.evaluate(e=>e.scrollIntoView({block:'center'}));await sp.click({force:true});await p.waitForTimeout(600);
ok('Schrift: Tafel geht auf', await p.locator('.fs-tafel.da select[data-w=schrift]').count()===1);
const vorFs=await sp.evaluate(e=>getComputedStyle(e).fontSize);
await p.selectOption('.fs-tafel select[data-w=gewicht]','600');
await p.evaluate(()=>{const r=document.querySelector('.fs-tafel input[data-w=groesse]');r.value=130;r.dispatchEvent(new Event('input',{bubbles:true}))});
for(const k of ['zeilen','laufweite']) ok('Schrift: Regler '+k, await p.locator(`.fs-tafel input[data-w=${k}]`).count()===1);
await p.check('.fs-tafel [name=fs-umfang][value=seite]');await p.waitForTimeout(400);
const nachFs=await sp.evaluate(e=>getComputedStyle(e).fontSize);ok('Schrift: Live-Vorschau', vorFs!==nachFs, vorFs+' → '+nachFs);
ok('Schrift: drei Umfänge', await p.locator('.fs-tafel [name=fs-umfang]').count()===3);
await p.click('.fs-tafel .fs-haupt');await p.waitForTimeout(1200);
d=(await dienst()).doc;ok('Schrift: gespeichert', d.aenderungen.some(a=>a.art==='stil'&&a.umfang==='seite'&&a.werte&&a.werte.groesse==130));
// 3 Abschnitte
await p.click('.fs-leiste [data-modus=abschnitte]');await p.waitForTimeout(1000);
ok('Abschnitte: Griffe da', await p.locator('.fs-ab').count()>2, ''+await p.locator('.fs-ab').count());
const gr=p.locator('.fs-ab').nth(1);await gr.evaluate(e=>e.scrollIntoView({block:'center'}));
await gr.locator('.fs-griff--oben button[data-st="16"]').click();await p.waitForTimeout(1200);
d=(await dienst()).doc;ok('Abschnitte: plus setzt Abstand', d.aenderungen.some(a=>a.art==='abstand'));
// Ziehen
const g=gr.locator('.fs-griff--unten');const bb=await g.boundingBox();
if(bb){await p.mouse.move(bb.x+5,bb.y+bb.height/2);await p.mouse.down();await p.mouse.move(bb.x+5,bb.y+bb.height/2+60,{steps:6});await p.mouse.up();await p.waitForTimeout(1200);}
d=(await dienst()).doc;const ab=d.aenderungen.filter(a=>a.art==='abstand').at(-1);ok('Abschnitte: ziehen setzt Abstand unten', ab&&ab.werte.unten>0, JSON.stringify(ab&&ab.werte));
await gr.locator('button[data-zug=runter]').click();await p.waitForTimeout(1200);
d=(await dienst()).doc;ok('Abschnitte: verschieben', d.aenderungen.some(a=>a.art==='reihenfolge'));
// 4 Wünsche
await p.click('.fs-leiste [data-modus=wuensche]');await p.waitForTimeout(500);
const sec=p.locator('main > section').nth(2);await sec.evaluate(e=>e.scrollIntoView({block:'center'}));await sec.click({position:{x:40,y:40},force:true});await p.waitForTimeout(600);
await p.fill('.fs-tafel textarea','Prüfwunsch: dieser Abschnitt soll anders werden.');await p.click('.fs-tafel .fs-haupt');await p.waitForTimeout(1200);
d=(await dienst()).doc;const nw=d.wuensche.at(-1);ok('Wünsche: Box je Abschnitt speichert', d.wuensche.length===w0+1&&nw.abschnitt, nw&&nw.name);
const karte=p.locator(`.fs-tafel .fs-wunsch[data-id="${nw.id}"]`);
await karte.locator('input').fill('Antwort aus der Prüfung');await karte.locator('[data-w-op=antwort]').click();await p.waitForTimeout(1200);
await p.locator(`.fs-tafel .fs-wunsch[data-id="${nw.id}"] [data-w-op=besprochen]`).click();await p.waitForTimeout(1200);
d=(await dienst()).doc;const nw2=d.wuensche.find(w=>w.id===nw.id);ok('Wünsche: Antwort und Status', nw2.antworten.length===1&&nw2.status==='besprochen', nw2.status);
await p.locator(`.fs-tafel .fs-wunsch[data-id="${nw.id}"] [data-w-op=weg]`).click();await p.waitForTimeout(500);
ok('Wünsche: Löschen fragt nach', await p.locator('.fs-frage').count()===1);
await p.click('.fs-frage [data-nein]');
// allgemeiner Wunsch zur Seite
await p.click('.fs-tafel .fs-x').catch(()=>{});await p.click('.fs-leiste [data-modus=wuensche]');await p.waitForTimeout(400);
ok('Wünsche: allgemein zur Seite möglich', await p.locator('.fs-tafel textarea').count()===1);
// 5 Liste
await p.click('.fs-leiste [data-modus=liste]');await p.waitForTimeout(600);
const ein=await p.locator('.fs-tafel .fs-eintrag').count();ok('Liste aller Änderungen', ein>=4, ''+ein);
const e1=await p.locator('.fs-tafel .fs-eintrag').first().innerText();ok('Liste: vorher und nachher', /vorher|→|nachher/i.test(e1)||(await p.locator('.fs-tafel .fs-eintrag').first().innerHTML()).includes('<s'), e1.replace(/\s+/g,' ').slice(0,120));
ok('Liste: zeigen und zurücknehmen', await p.locator('.fs-tafel [data-op=zeigen]').count()>0 && await p.locator('.fs-tafel [data-op=zurueck]').count()>0);
ok('Liste: übernommen nur für Robert', await p.locator('.fs-tafel [data-op=uebernommen]').count()===0);
const vorZ=(await dienst()).doc.aenderungen.filter(a=>a.status!=='übernommen').length;
await p.locator('.fs-tafel [data-op=zeigen]').first().click();await p.waitForTimeout(800);
await p.click('.fs-leiste [data-modus=liste]');await p.waitForTimeout(500);
await p.locator('.fs-tafel [data-op=zurueck]').first().click();await p.waitForTimeout(1200);
const nachZ=(await dienst()).doc.aenderungen.filter(a=>a.status!=='übernommen').length;ok('Liste: zurücknehmen', nachZ===vorZ-1, vorZ+' → '+nachZ);
// Neu laden
await p.reload({waitUntil:'load'});await p.waitForTimeout(3000);
const nachLaden=await p.locator('main p').first().innerText();ok('Nach Neuladen sind Änderungen da', /Pruefwort/.test(nachLaden)||!(alt===nachLaden), nachLaden.slice(-40));
// 6 Original
await p.click('.fs-leiste .fs-vorher');await p.waitForTimeout(3500);
const orig=await p.locator('main p').first().innerText();ok('Original zeigt Seite ohne Änderungen', !/Pruefwort/.test(orig));
await p.click('.fs-leiste .fs-vorher');await p.waitForTimeout(3500);
ok('Zurück zu mit Änderungen', /Pruefwort/.test(await p.locator('main p').first().innerText()));
console.log('Konsole (ohne fehlende Bilder):', log.filter(l=>!/\.(webp|png|jpg)|googleapis|404/.test(l)).join(' | ')||'leer', '| 404 gesamt:', log.filter(l=>/404/.test(l)).length);
// 390
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(800);
const ue=await p.evaluate(()=>document.documentElement.scrollWidth);ok('390: kein Überlauf', ue<=390, ''+ue);
await p.screenshot({path:'b/seite-390-neubau.jpg',type:'jpeg',quality:80});
await p.click('.fs-leiste [data-modus=liste]');await p.waitForTimeout(600);await p.screenshot({path:'b/seite-liste-390-neubau.jpg',type:'jpeg',quality:80});
await p.setViewportSize({width:1440,height:900});await p.click('.fs-leiste [data-modus=schrift]');const sp2=p.locator('main p').nth(4);await sp2.evaluate(e=>e.scrollIntoView({block:'center'}));await sp2.click({force:true});await p.waitForTimeout(800);await p.screenshot({path:'b/seite-schrift-1440-neubau.jpg',type:'jpeg',quality:80});
await p.keyboard.press('Escape');await p.click('.fs-leiste [data-modus=abschnitte]');await p.waitForTimeout(1200);await p.screenshot({path:'b/seite-abschnitte-1440-neubau.jpg',type:'jpeg',quality:80});
// Robert
const pr=await ctx.newPage();await pr.goto(S+'team.html?feinschliff=probe-robert-feinschliff',{waitUntil:'load'});await pr.waitForTimeout(3000);
await pr.click('.fs-leiste [data-modus=liste]');await pr.waitForTimeout(600);
ok('Robert: übernommen-Knopf', await pr.locator('.fs-tafel [data-op=uebernommen]').count()>0);
const vu=(await dienst()).doc.aenderungen.filter(a=>a.status==='übernommen').length;
await pr.locator('.fs-tafel [data-op=uebernommen]').first().click();await pr.waitForTimeout(1200);
ok('Robert: als übernommen markiert', (await dienst()).doc.aenderungen.filter(a=>a.status==='übernommen').length===vu+1);
// Besucher
const vis=await b.newContext();const pv=await vis.newPage();const reqs=[];pv.on('request',r=>reqs.push(r.url()));
await pv.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r),r=>r.abort());
await pv.goto(S,{waitUntil:'load'});await pv.waitForTimeout(2500);
ok('Besucher ohne Schlüssel: keine Leiste, nichts nachgeladen', await pv.locator('.fs-leiste').count()===0 && !reqs.some(u=>/feinschliff|8981/.test(u)), reqs.filter(u=>/feinschliff|8981/.test(u)).join(','));
await pv.goto(S+'?feinschliff=aus');await pv.waitForTimeout(1500);
const pa=await ctx.newPage();await pa.goto(S+'?feinschliff=aus',{waitUntil:'load'});await pa.waitForTimeout(2000);ok('?feinschliff=aus vergisst den Schlüssel', await pa.locator('.fs-leiste').count()===0);
await b.close();})();
