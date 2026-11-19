const { chromium } = require('playwright');
/* Nachbesserung nach der zweiten Prüfung (07.11.2026): misst «Häufig gebraucht» (sieben Kacheln, Lage je Kachel) und die Bilder der Häuser-Kacheln
   und Karten (ganz, vorher und nachher übereinander), bei 1440 und 390 px, mit Konsole und Überlauf. Bilder nach vergleich/nachbesserung/.
   Start: python3 zentrale/server.py, rm -rf daten/08-beitraege, dann node werkzeuge/08-beitraege/vergleich/nachbesserung2.js */
const N='http://localhost:9100/werkzeuge/08-beitraege/', O=__dirname+'/nachbesserung';
(async()=>{const b=await chromium.launch();
for(const w of [1440,390]){const p=await b.newPage({viewport:{width:w,height:w>500?900:844}});const log=[];p.on('console',m=>{if(['error','warning'].includes(m.type()))log.push(m.text())});p.on('pageerror',e=>log.push(e.message));
await p.goto(N+'?ansicht=start');await p.waitForTimeout(1800);
const r=await p.$$eval('#ws-mitte .wo-ag',a=>a.map(x=>{const r=x.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y+scrollY),Math.round(r.width)]}));
console.log(w,'kacheln',r.length,JSON.stringify(r));
const bk=await p.$$eval('#ws-mitte .wo-bk__b img',a=>a.map(i=>{const r=i.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),i.naturalWidth]}));console.log(w,'haeuser img',JSON.stringify(bk));
await p.evaluate(()=>{const e=document.querySelector('#ws-mitte .wo-ag');scrollTo(0,e.getBoundingClientRect().top+scrollY-140)});await p.waitForTimeout(800);await p.screenshot({path:O+'/p2-1-haeufig-'+w+'.jpg',type:'jpeg',quality:80});
await p.evaluate(()=>{const e=document.querySelector('#ws-mitte .wo-bk');scrollTo(0,e.getBoundingClientRect().top+scrollY-140)});await p.waitForTimeout(800);await p.screenshot({path:O+'/p2-2-haeuser-'+w+'.jpg',type:'jpeg',quality:80});
const ow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
await p.goto(N+'?ansicht=l:alle');await p.waitForTimeout(1800);
const kb=await p.$$eval('.bt-karte__bild',a=>a.map(f=>[...f.querySelectorAll('img')].map(i=>{const r=i.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height)}).join('+')));console.log(w,'karten',JSON.stringify(kb));
await p.screenshot({path:O+'/p2-2-karten-'+w+'.jpg',type:'jpeg',quality:80});
const ow2=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
console.log(w,'ueberlauf',ow,ow2,'konsole',JSON.stringify(log));await p.close();}
await b.close();})();
