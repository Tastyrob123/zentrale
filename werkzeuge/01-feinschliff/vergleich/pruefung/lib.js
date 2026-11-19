const { chromium } = require('playwright');
const VP=process.env.VORLAGE||'9371', ZP=process.env.ZENTRALE||'9100';
const V='http://vorlage.test:'+VP+'/culinarium-demo/werkzeuge/bureau/uwerkzeuge/bureau/';
const N='http://localhost:'+ZP+'/zentrale/werkzeuge/01-feinschliff/';
async function neu(b, breite){
  const p=await b.newPage({viewport:{width:breite,height:breite>500?900:844}, deviceScaleFactor:1});
  p.log=[];
  p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')p.log.push(m.type()+': '+m.text()+' '+(m.location().url||''))});
  p.on('pageerror',e=>p.log.push('pageerror '+e.message));
  await p.route(r=>!/^https?:\/\/(127\.0\.0\.1|localhost|vorlage\.test)/.test(r),r=>r.abort());
  // Prüfstand auf anderen Ports (SEITE, DIENST, ORIGINAL): die Seite fragt fest bei 8980/8981/8982, hier umleiten
  const PS={'8980':process.env.SEITE,'8981':process.env.DIENST,'8982':process.env.ORIGINAL};
  if(PS['8980']||PS['8981']||PS['8982'])await p.context().route(/(localhost|127\.0\.0\.1):(8980|8981|8982)\//,r=>{const u=r.request().url().replace(/:(8980|8981|8982)\//,(m,x)=>':'+(PS[x]||x)+'/');r.continue({url:u})});
  await p.addInitScript(() => { try { ['rundgang-culinarium-bureau','rundgang-tasty-feinschliff'].forEach(k=>localStorage.setItem(k,'1')); localStorage.removeItem('fs-ort'); } catch(e){} });
  return p;
}
async function ueber(p){ return p.evaluate(()=>{const w=document.documentElement.clientWidth;const r=[];for(const e of document.querySelectorAll('body *')){const b=e.getBoundingClientRect();if(b.width&&b.right>w+1&&getComputedStyle(e).position!=='fixed'){let x=e;let clip=false;while(x=x.parentElement){const o=getComputedStyle(x).overflowX;if(o!=='visible'){clip=true;break}}if(!clip)r.push((e.className||e.tagName).toString().slice(0,40)+' '+Math.round(b.right))}}return {sw:document.documentElement.scrollWidth,w,r:r.slice(0,6)}});}
async function start(){return chromium.launch({args:['--host-resolver-rules=MAP vorlage.test 127.0.0.1']});}
module.exports={V,N,neu,ueber,start};
