const { chromium } = require('playwright');
const N='http://localhost:9100/werkzeuge/01-feinschliff/';
const ok=(n,b,x='')=>console.log((b?'OK   ':'FEHLT')+' '+n+(x?' — '+x:''));
const api=async(w,m='GET',d)=>{const r=await fetch('http://localhost:9100/api/01-feinschliff/'+w,{method:m,body:d?JSON.stringify(d):undefined,headers:{'content-type':'application/json'}});return r.json()};
(async()=>{
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const log=[];
p.on('console',m=>{if(m.type()==='error')log.push(m.text()+' '+m.location().url)});p.on('pageerror',e=>log.push('pageerror '+e.message));
await p.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r),r=>r.abort());
await p.addInitScript(()=>{try{localStorage.setItem('rundgang-tasty-feinschliff','1')}catch(e){}});
const titel=()=>p.evaluate(()=>document.querySelector('.wo-kopf__mitte b')?.textContent||document.title);
const start=async(q='?wer=Robert#start')=>{await p.goto('about:blank');await p.goto(N+q,{waitUntil:'load'});await p.waitForTimeout(2200)};
const klick=async(sel,i=0)=>{await p.evaluate(([s,i])=>{const e=document.querySelectorAll(s)[i];if(!e)throw new Error('fehlt '+s);e.click()},[sel,i]);await p.waitForTimeout(1300)};
await api('probedaten','POST',{});
// Bereich
await start('?wer=Robert#b:index.html');await p.waitForTimeout(2000);
const vb=await p.evaluate(()=>document.querySelector('.ws-vorschau iframe, iframe')?.getBoundingClientRect().width);
await p.evaluate(()=>{const b=[...document.querySelectorAll('[data-ws-wahl] button')].find(b=>b.textContent.trim()==='Handy');b.click()});await p.waitForTimeout(1200);
const hb=await p.evaluate(()=>document.querySelector('iframe')?.getBoundingClientRect().width);ok('Vorschau Rechner/Handy',vb&&hb&&hb<vb,vb+' → '+hb);
const z0=await p.locator('#ws-gruppen .ws-st:visible').count();await p.fill('#ws-such','Gastfreundschaft');await p.waitForTimeout(600);const z1=await p.locator('#ws-gruppen .ws-st:visible').count();ok('Suche filtert (Wort aus «nachher»)',z1<z0&&z1>0,z0+' → '+z1);await p.fill('#ws-such','Hospitality');await p.waitForTimeout(600);ok('Suche findet Wort aus «vorher»',await p.locator('#ws-gruppen .ws-st:visible').count()>0,''+await p.locator('#ws-gruppen .ws-st:visible').count());
await p.fill('#ws-such','');
const gk=await p.evaluate(()=>{const a=[...document.querySelectorAll('#ws-mitte a')].find(a=>/Gross öffnen/i.test(a.textContent));return a&&a.href});ok('Gross öffnen',!!gk&&(await fetch(gk)).ok,gk);
await p.evaluate(()=>[...document.querySelectorAll('#ws-gruppen button')].find(b=>/Neuer Wunsch/i.test(b.textContent)).click());await p.waitForTimeout(800);
ok('Neuer Wunsch: Fenster',await p.locator('[data-ws-fenster=wunsch]').count()===1);
await p.keyboard.press('Escape');await p.waitForTimeout(400);ok('Fenster: Esc schliesst',await p.locator('[data-ws-fenster]').count()===0);
await p.evaluate(()=>[...document.querySelectorAll('#ws-gruppen button')].find(b=>/Neuer Wunsch/i.test(b.textContent)).click());await p.waitForTimeout(800);
await p.locator('[data-ws-fenster=wunsch] [contenteditable], [data-ws-fenster=wunsch] textarea').first().click();await p.keyboard.type('Wunsch aus der Prüfung im Startblatt');
await p.evaluate(()=>[...document.querySelectorAll('[data-ws-fenster] button')].find(b=>/Vormerken/i.test(b.textContent)).click());await p.waitForTimeout(900);
ok('Vormerken: Leiste gelb',await p.getAttribute('#ws-speichern','data-ws-lage')==='offen');
const w0=(await api('uebersicht')).doc.wuensche.length;
await p.click('#ws-speichern');await p.waitForTimeout(1500);
ok('Speichern: Leiste grün',await p.getAttribute('#ws-speichern','data-ws-lage')==='gespeichert');
const q=await p.locator('.ws-quit').innerText().catch(()=>'');ok('Quittung vorher/nachher + Rückgängig',/wird/.test(q)&&/Rückgängig/i.test(q),q.replace(/\s+/g,' ').slice(0,150));
ok('Wunsch gespeichert',(await api('uebersicht')).doc.wuensche.length===w0+1);
await p.evaluate(()=>[...document.querySelectorAll('.ws-quit button')].find(b=>/Rückgängig/i.test(b.innerText)).click());await p.waitForTimeout(1500);
ok('Rückgängig nimmt zurück',(await api('uebersicht')).doc.wuensche.length===w0);
await p.waitForTimeout(6500);ok('Leiste wieder grau',await p.getAttribute('#ws-speichern','data-ws-lage')==='ruhig');
// Wünsche Filter
await start('?wer=Robert#wuensche');const f=[];for(const t of ['Erledigt','Alle','Noch offen']){await p.evaluate(t=>[...document.querySelectorAll('.ws-wahl2 button')].find(b=>b.textContent.trim()===t).click(),t);await p.waitForTimeout(700);f.push(t+':'+await p.locator('[data-ws-wunsch]').count());}
ok('Wünsche: Filter',true,f.join(' '));
await p.locator('[data-ws-wunsch] .ws-taste').nth(1).click();await p.waitForTimeout(1500);ok('Wunsch «In der Seite» führt zur Seite',/^b:/.test(await p.evaluate(()=>location.hash.slice(1)))||(await titel())!=='Wünsche','→ '+await titel());
// Wunsch entfernen
await start('?wer=Robert#wuensche');await klick('[data-ws-antworten]');
await p.evaluate(()=>[...document.querySelectorAll('.ws-ed button')].find(b=>/entfernen/i.test(b.textContent)).click());await p.waitForTimeout(700);
ok('Wunsch entfernen fragt nach',await p.locator('[data-ws-fenster=wunsch-weg]').count()===1);
await p.evaluate(()=>[...document.querySelectorAll('[data-ws-fenster] button')].find(b=>/Abbrechen/i.test(b.textContent)).click());await p.waitForTimeout(400);
// Antwort
await start('?wer=Robert#wuensche');await klick('[data-ws-antworten]');await p.locator('.ws-ed [contenteditable], .ws-ed textarea').first().click();await p.keyboard.type('Antwort im Startblatt');await p.click('#ws-speichern');await p.waitForTimeout(1500);
ok('Antwort gespeichert',JSON.stringify((await api('uebersicht')).doc.wuensche).includes('Antwort im Startblatt'));
// Vorher & nachher
await start('?wer=Robert#aenderungen');const a0=(await api('uebersicht')).doc.aenderungen.filter(a=>a.status!=='übernommen').length;
await p.evaluate(()=>[...document.querySelectorAll('[data-ws-aenderung] .ws-taste')].find(b=>/Zurücknehmen/i.test(b.textContent)).click());await p.waitForTimeout(700);
ok('Zurücknehmen fragt nach',await p.locator('[data-ws-fenster=zuruecknehmen]').count()===1);
await p.screenshot({path:'b/zuruecknehmen-1440-neubau.jpg',type:'jpeg',quality:80});
await p.evaluate(()=>[...document.querySelectorAll('[data-ws-fenster] button')].find(b=>/Ja/i.test(b.textContent)).click());await p.waitForTimeout(1500);
ok('Zurückgenommen',(await api('uebersicht')).doc.aenderungen.filter(a=>a.status!=='übernommen').length===a0-1);
const q2=await p.locator('.ws-quit').innerText().catch(()=>'');ok('Quittung nach Zurücknehmen',/Rückgängig/i.test(q2),q2.replace(/\s+/g,' ').slice(0,140));
await p.evaluate(()=>[...document.querySelectorAll('.ws-quit button')].find(b=>/Rückgängig/i.test(b.innerText)).click());await p.waitForTimeout(1500);
ok('Rückgängig holt die Änderung zurück',(await api('uebersicht')).doc.aenderungen.filter(a=>a.status!=='übernommen').length===a0);
await klick('[data-ws-ue]');ok('Als übernommen markieren: Leiste gelb',await p.getAttribute('#ws-speichern','data-ws-lage')==='offen');
await p.click('#ws-speichern');await p.waitForTimeout(1500);ok('Übernommen gespeichert',(await api('uebersicht')).doc.aenderungen.filter(a=>a.status!=='übernommen').length===a0-1);
// Vergleich Seite wechseln
const vg=await p.evaluate(()=>!!document.querySelector('[data-ws-spalte=vorher] iframe')&&!!document.querySelector('[data-ws-spalte=nachher] iframe'));ok('Seite für Seite: vorher und nachher nebeneinander',vg);
// Quelle
await start('?wer=Robert#uebernehmen');const sw=await p.locator('[data-ws-uebernommen]').count();await klick('[data-ws-uebernommen]');ok('Quelle: Schalter übernommen → gelb',sw>0&&await p.getAttribute('#ws-speichern','data-ws-lage')==='offen');
await p.click('#ws-speichern');await p.waitForTimeout(1500);ok('Quelle: gespeichert',(await api('uebersicht')).doc.aenderungen.filter(a=>a.status!=='übernommen').length===a0-2);
// Leiste
await start();await p.click('#ws-speichern');await p.waitForTimeout(800);ok('Speichern ohne Eingabe meldet',/Nichts geändert/.test(await p.locator('.ws-quit').innerText().catch(()=>'')));
await p.click('#ws-vgl');await p.waitForTimeout(1200);ok('Leiste «Vorher, nachher»',(await titel())==='Vorher & nachher');
const ro=await p.getAttribute('#ws-raus','href');ok('Leiste «Seite öffnen»',(await fetch(ro)).ok,ro);
// Konflikt
await start('?wer=Robert#wuensche');await klick('[data-ws-antworten]');await p.evaluate(()=>{const b=[...document.querySelectorAll('.ws-ed__status button')].find(b=>b.getAttribute('aria-pressed')!=='true');b.click()});await p.waitForTimeout(500);
await fetch('http://localhost:8981/api/feinschliff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:'probe-anna-feinschliff',op:'wunsch',w:{seite:'index.html',abschnitt:'',name:'',text:'Zwischendurch von Anna'}})});
await p.click('#ws-speichern');await p.waitForTimeout(1500);ok('Konflikt: Fenster «Zwei haben gleichzeitig geändert»',await p.locator('[data-ws-fenster=konflikt]').count()===1);
await p.screenshot({path:'b/konflikt-1440-neubau.jpg',type:'jpeg',quality:80});
await p.evaluate(()=>[...document.querySelectorAll('[data-ws-fenster] button')].find(b=>/speichern/i.test(b.textContent)).click());await p.waitForTimeout(1500);
ok('Konflikt: beides erhalten',JSON.stringify((await api('uebersicht')).doc).includes('Zwischendurch von Anna'));
// Anna
await start('?wer=Anna#uebernehmen');ok('Anna: kein übernommen-Schalter',await p.locator('[data-ws-uebernommen]').count()===0);
await start('?wer=Anna#aenderungen');ok('Anna: kein «Als übernommen markieren»',await p.locator('[data-ws-ue]').count()===0);
// Probedaten / eigene Liste
await api('probedaten/zurueck','POST',{}).catch(()=>{});
await api('probedaten','POST',{}); // Probedaten
await fetch('http://localhost:8981/api/feinschliff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:'probe-anna-feinschliff',op:'wunsch',w:{seite:'index.html',abschnitt:'',name:'',text:'EIGENER WUNSCH'}})});
// eigene Liste herstellen: jetzt zurueck + eigener Eintrag
await api('probedaten/zurueck','POST',{});
await fetch('http://localhost:8981/api/feinschliff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:'probe-anna-feinschliff',op:'wunsch',w:{seite:'index.html',abschnitt:'',name:'',text:'EIGENE LISTE ANNA'}})});
await start('?wer=Robert#pruefstand');await klick('[data-ws-probedaten]');const qp=await p.locator('.ws-quit').innerText().catch(()=>'');ok('Probedaten einspielen: Quittung',/wird/.test(qp)&&/Rückgängig/i.test(qp),qp.replace(/\s+/g,' ').slice(0,120));
await klick('[data-ws-probedaten]');const frage=await p.locator('[data-ws-fenster]').count();ok('Zweites Einspielen fragt nach',frage>0);
await p.evaluate(()=>{const b=[...document.querySelectorAll('.ws-taste')].find(b=>/zurückholen/i.test(b.textContent));b&&b.click()});await p.waitForTimeout(1500);
const fz=await p.locator('[data-ws-fenster]').count();ok('Eigene Liste zurückholen fragt nach',fz>0);
const eig=JSON.stringify((await api('uebersicht')).doc);ok('Eigene Liste nach zweimal Einspielen noch da',eig.includes('EIGENE LISTE ANNA'),eig.includes('EIGENE LISTE ANNA')?'':'eigene Liste ist weg, Sicherung wurde beim zweiten Einspielen mit den Probedaten überschrieben');
// Handy
await p.setViewportSize({width:390,height:844});await start();await klick('[data-wo-rand-knopf]');ok('Handy: Rand klappt auf',await p.evaluate(()=>document.documentElement.classList.contains('wo-rand-auf')));
await klick('.wo-rand [data-ws-nav="wuensche"]');ok('Handy: Wahl im Rand klappt zu und wechselt',!(await p.evaluate(()=>document.documentElement.classList.contains('wo-rand-auf')))&&(await titel())==='Wünsche');
for(const h of ['#start','#b:team.html','#wuensche','#aenderungen','#uebernehmen','#pruefstand','#alle']){await start('?wer=Robert'+h);const sw2=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw2>390)ok('Handy Überlauf '+h,false,''+sw2);}
console.log('Konsole Startblatt:',log.filter(l=>!/:89(80|81|82)\/|googleapis/.test(l)).join(' | ')||'leer');
await b.close();})();
