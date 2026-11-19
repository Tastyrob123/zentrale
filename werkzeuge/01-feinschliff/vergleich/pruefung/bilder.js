// Prüfbilder: node bilder.js <ansicht> <breite> -> b/<ansicht>-<breite>-<vorlage|neubau>.jpg, dazu Befund als JSON auf stdout
const {V,N,neu,ueber,start}=require('./lib');
const W=ms=>p=>p.waitForTimeout(ms);
const klick=s=>async p=>{await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.click();else console.log('FEHLT '+s)},s);await p.waitForTimeout(1200)};
const rolle=s=>async p=>{await p.evaluate(s=>{const e=document.querySelector(s);if(e)scrollTo(0,e.getBoundingClientRect().top+scrollY-90)},s);await p.waitForTimeout(1500)};
const nav=n=>async p=>{await p.evaluate(n=>{const e=document.querySelector('[data-ws-nav="'+n+'"]');e&&e.click()},n);await p.waitForTimeout(3000)};
const tippe=async p=>{await p.evaluate(()=>{const f=document.querySelector('#ws-mitte textarea, #ws-mitte [contenteditable=true], #ws-mitte input[type=text]:not([type=search])');if(f)f.scrollIntoView({block:'center'});if(f){f.focus();}});await p.keyboard.press('End');await p.keyboard.type(' Probe');await p.waitForTimeout(800)};
const speichern=async p=>{await p.evaluate(()=>{const s=document.querySelector('#ws-speichern,[data-ws-lage]');s&&s.click()});await p.waitForTimeout(1800)};
const vStatus=async p=>{await p.evaluate(()=>{const k=document.querySelector('[data-ws-antworten]');k&&k.click()});await p.waitForTimeout(900);await p.evaluate(()=>{const b=[...document.querySelectorAll('.ws-ed__status button,.ws-ed__status [role=radio]')].find(b=>b.getAttribute('aria-pressed')!=='true'&&b.getAttribute('aria-checked')!=='true');b&&b.click()});await p.waitForTimeout(900)};
const qv=async p=>{await p.evaluate(()=>{const o=document.getElementById('ws-quittung');o.innerHTML='<div class="ws-quit" role="status"><div class="ws-quit__t"><b>Gespeichert</b><span>Strasse · Angaben des Hauses: «Haasemannstraße 13» wird «Haasemannstraße 13 Probe»</span></div><button class="ws-taste" type="button">Vorher/nachher ansehen</button><button class="ws-taste" type="button">Rückgängig</button><button class="ws-rund" type="button" aria-label="Schliessen"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3 3 13"/></svg></button></div>'});await p.waitForTimeout(500)};
const VS=V+'index.html', NS=N+'?wer=Robert';
const RV='http://vorlage.test:'+(process.env.VORLAGE||'9371')+'/culinarium-demo/werkzeuge/reception/uwerkzeuge/reception/pruefung.html';
const A={
 start:[VS,[],NS,[]],
 haeufig:[VS,[rolle('.wo-aufg')],NS,[rolle('.wo-aufg')]],
 bereiche:[VS,[rolle('.wo-ber')],NS,[rolle('.wo-ber')]],
 bereich:[VS,[nav('b:start'),W(2500)],NS,[nav('b:index.html'),W(2500)]],
 stelle:[VS,[nav('b:start'),W(2500),klick('#ws-gruppen .ws-st'),rolle('.ws-ed')],NS,[nav('b:team.html'),W(2500),klick('#ws-gruppen .ws-st'),rolle('.ws-ed')]],
 alle:[VS,[nav('angaben')],NS,[nav('alle')]],
 wuensche:[VS,[nav('e:termine')],NS,[nav('wuensche')]],
 entwurf:[VS,[nav('entwurf')],NS,[nav('aenderungen')]],
 quelle:[VS,[nav('google')],NS,[nav('uebernehmen')]],
 verlauf:[VS,[nav('verlauf')],NS,[nav('pruefstand')]],
 fenster:[VS,[nav('b:start'),W(2500),klick('#ws-gruppen .ws-foto')],NS,[nav('wuensche'),klick('.wo-sb__kn .kn')]],
 gelb:[VS,[nav('angaben'),tippe],NS,[nav('wuensche'),vStatus]],
 quittung:[VS,[nav('angaben'),tippe,qv],NS,[nav('wuensche'),vStatus,speichern]],
 rand:[VS,[klick('[data-wo-rand-knopf]')],NS,[klick('[data-wo-rand-knopf]')]],
 anleitung:[V+'anleitung.html',[],N+'anleitung.html',[]],
 rundgang:[VS,['rg'],NS,['rg']],
 pruefung:[RV,[],N+'pruefung.html',[]],
};
(async()=>{const [name,br]=[process.argv[2],+process.argv[3]];const [vu,vs,nu,ns]=A[name];const b=await start();const out={};
for(const [seite,url,schritte] of [['vorlage',vu,vs],['neubau',nu,ns]]){
 const p=await neu(b,br);
 if(schritte[0]==='rg'){await p.addInitScript(()=>{try{['rundgang-culinarium-bureau','rundgang-tasty-feinschliff'].forEach(k=>localStorage.removeItem(k))}catch(e){}});}
 p.on('console',m=>{if(m.type()==='log'&&/^FEHLT/.test(m.text()))p.log.push(m.text())});
 await p.goto(url,{waitUntil:'load',timeout:20000}).catch(e=>p.log.push('goto '+e.message));
 await p.waitForTimeout(2600);
 for(const s of schritte){if(typeof s==='function')await s(p);else if(s==='rg')await p.waitForTimeout(2500);}
 await p.waitForTimeout(1200);
 await p.screenshot({path:`b/${name}-${br}-${seite}.jpg`,type:'jpeg',quality:80});
 const eigen=p.log.filter(l=>!/:89(80|81|82)\//.test(l)&&!/besuch\.js|verweil\.js|_probe\//.test(l));
 out[seite]={ueber:await ueber(p),konsole:eigen,leiste:await p.evaluate(()=>{const s=document.querySelector('[data-ws-lage]');return s&&s.getAttribute('data-ws-lage')+' '+getComputedStyle(s).backgroundColor}),quit:await p.evaluate(()=>{const q=document.querySelector('.ws-quit');return q&&q.innerText.replace(/\s+/g,' ')})};
 await p.close();}
console.log(name,br,JSON.stringify(out));await b.close();})();
