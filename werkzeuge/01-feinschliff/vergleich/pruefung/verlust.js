const { chromium } = require('playwright');
const api=async(w)=>(await fetch('http://localhost:9100/api/01-feinschliff/'+w)).json();
(async()=>{
await fetch('http://localhost:8981/api/feinschliff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:'probe-anna-feinschliff',op:'wunsch',w:{seite:'index.html',abschnitt:'',name:'',text:'ANNAS ECHTER WUNSCH'}})});
console.log('vorher eigene Liste:',JSON.stringify((await api('uebersicht')).doc.wuensche.map(w=>w.text)));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
await p.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r),r=>r.abort());
await p.goto('http://localhost:9100/werkzeuge/01-feinschliff/?wer=Robert#pruefstand');await p.waitForTimeout(2500);
const k=async t=>{const n=await p.evaluate(t=>{const b=[...document.querySelectorAll('.ws-taste')].find(b=>b.textContent.includes(t));if(b){b.click();return true}return false},t);await p.waitForTimeout(1500);return n};
console.log('1. Einspielen:',await k('Probedaten einspielen'), 'Fenster:',await p.locator('[data-ws-fenster]').count());
console.log('2. Einspielen:',await k('Probedaten einspielen'), 'Fenster:',await p.locator('[data-ws-fenster]').count());
await p.screenshot({path:'b/probedaten-zweimal-1440-neubau.jpg',type:'jpeg',quality:80});
console.log('3. Zurückholen:',await k('Eigene Liste zurückholen'), 'Fenster:',await p.locator('[data-ws-fenster]').count());
await p.screenshot({path:'b/eigene-liste-weg-1440-neubau.jpg',type:'jpeg',quality:80});
const t=JSON.stringify((await api('uebersicht')).doc.wuensche.map(w=>w.text));console.log('danach:',t.includes('ANNAS ECHTER WUNSCH')?'eigene Liste da':'EIGENE LISTE WEG',t.slice(0,200));
console.log('Quittung:',(await p.locator('.ws-quit').innerText().catch(()=>'')).replace(/\s+/g,' '));
await b.close();})();
