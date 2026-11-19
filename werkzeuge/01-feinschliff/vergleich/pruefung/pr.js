const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--host-resolver-rules=MAP vorlage.test 127.0.0.1']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r),r=>r.abort());
await p.goto('http://localhost:9100/werkzeuge/01-feinschliff/?wer=Robert#start');await p.waitForTimeout(2000);
await p.evaluate(()=>setTimeout(()=>{nichtDa.aufruf()},0));await p.waitForTimeout(1500);
const log=[];p.on('console',m=>{if(m.type()==='error')log.push(m.text())});
for(const [n,u] of [['vorlage','http://vorlage.test:9371/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/pruefung.html'],['neubau','http://localhost:9100/werkzeuge/01-feinschliff/pruefung.html']]){
await p.goto(u);await p.waitForTimeout(2500);
const i=await p.evaluate(()=>({h:[...document.querySelectorAll('h1,h2')].map(h=>h.textContent.trim()),kn:[...document.querySelectorAll('button,a.kn,a.wo-kn')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,20),lex:document.querySelectorAll('[id^=lex-]').length,fehler:(document.body.innerText.match(/nichtDa[^\n]*/)||[''])[0]}));
console.log(n,JSON.stringify(i));
await p.screenshot({path:`b/pruefung-ganz-1440-${n}.jpg`,type:'jpeg',quality:75,fullPage:true});}
// Reparatur: erster Klick fragt, zweiter tut
const rep=await p.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()));console.log('Knöpfe Neubau-Prüfseite',rep.join(' | '));
const leer=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Fehlerliste leeren|leeren/i.test(b.textContent));if(!b)return 'kein Knopf';b.click();return b.textContent});await p.waitForTimeout(800);
const nach1=await p.evaluate(()=>/nichtDa/.test(document.body.innerText));console.log('nach erstem Klick:',leer,'Fehler noch da:',nach1, await p.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).join(' | ')));
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/leeren|wirklich|nochmal|sicher/i.test(b.textContent));b&&b.click()});await p.waitForTimeout(1200);
console.log('nach zweitem Klick Fehler noch da:',await p.evaluate(()=>/nichtDa/.test(document.body.innerText)));
console.log('Konsole Prüfseite:',log.join('|')||'leer');
await b.close();})();
