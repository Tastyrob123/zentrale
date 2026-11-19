const {V,N,neu,start}=require('./lib');
(async()=>{const b=await start();
for(const br of [1440,390]) for(const [seite,url] of [['vorlage',V+'index.html?rundgang'],['neubau',N+'?wer=Robert&rundgang']]){
 const p=await neu(b,br);await p.goto(url,{waitUntil:'load'});await p.waitForTimeout(7000);
 const titel=[];let n=0;
 for(;n<15;n++){const t=await p.evaluate(()=>{const k=document.querySelector('.rdg-karte, [role=dialog][aria-label^="Kurzer Rundgang"]');return k&&k.innerText.replace(/\s+/g,' ').slice(0,90)});if(!t)break;titel.push(t);
  if(n===1)await p.screenshot({path:`b/rundgang-${br}-${seite}.jpg`,type:'jpeg',quality:80});
  const ok=await p.evaluate(()=>{const l=document.querySelector('.rdg-los');if(l){l.click();return true}return false});if(!ok)break;await p.waitForTimeout(1800);}
 console.log(seite,br,'Schritte:',titel.length,'\n  '+titel.join('\n  '),'\n  Konsole:',p.log.filter(l=>!/:89(80|81|82)\/|googleapis|besuch\.js|verweil\.js|_probe\//.test(l)).join('|'));
 await p.close();}
await b.close();})();
