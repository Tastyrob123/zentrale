
document.addEventListener('DOMContentLoaded',function(){
  var fx=document.documentElement.classList.contains('fx'), reduce=!fx;
  function seen(el,fn,m){ if(!('IntersectionObserver' in window)){fn();return;} var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn();}});},{rootMargin:m||'0px 0px -12% 0px'}); io.observe(el); }
  /* Feed-Filter */
  var g=document.querySelector('.ig-grid');
  document.querySelectorAll('.ig-f button').forEach(function(b){ b.addEventListener('click',function(){ document.querySelectorAll('.ig-f button').forEach(function(x){x.classList.toggle('on',x===b);}); g.dataset.f=b.dataset.f; }); });
  /* Profil-Kacheln Reihe für Reihe */
  if(fx){ var tiles=[].slice.call(g.children); tiles.forEach(function(c,i){ c.classList.add('pre'); c.style.setProperty('--d',((i%3)*0.08)+'s'); });
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pre'); io.unobserve(e.target);} });},{rootMargin:'0px 0px -6% 0px'}); tiles.forEach(function(c){io.observe(c);}); }
  /* Hero: Handy-Feed läuft mit dem Scrollen */
  var scr=document.querySelector('.pl-hero .ph-scr'), pg=document.querySelector('.pl-hero .ph-grid'), hero=document.querySelector('.pl-hero');
  if(pg&&fx){ var tk=false; function hs(){ tk=false; var h=hero.offsetHeight, p=Math.max(0,Math.min(1,scrollY/(h*0.9))); var max=pg.scrollHeight-(scr.clientHeight-pg.offsetTop); pg.style.transform='translate3d(0,'+(-p*Math.max(0,max)*0.55)+'px,0)'; }
    addEventListener('scroll',function(){ if(!tk){tk=true;requestAnimationFrame(hs);} },{passive:true}); hs(); }
  /* Hero-Zahlen zählen hoch */
  var s0=document.querySelector('.pl-hero .stat b'); if(s0&&fx){ var t0=null; function cu(ts){ if(!t0)t0=ts; var p=Math.min(1,(ts-t0)/1400); s0.textContent=Math.round(+s0.dataset.n*(1-Math.pow(1-p,3))); if(p<1)requestAnimationFrame(cu); } s0.textContent='0'; setTimeout(function(){requestAnimationFrame(cu);},500); }
  /* Feed wächst Schub für Schub */
  var grow=document.querySelector('.grow'), cells=[].slice.call(document.querySelectorAll('.wall i')), num=document.querySelector('.wall-n'), lb=document.querySelector('.wall-lb'), steps=[].slice.call(document.querySelectorAll('.gstep')), cur=0, shown=0, nt=null;
  function setTo(n,label){ var from=shown; cells.forEach(function(c,i){ var on=i<n; if(on!==c.classList.contains('on')){ c.style.setProperty('--d',(on?Math.max(0,i-from)*0.018:0)+'s'); c.classList.toggle('on',on); } });
    var a=shown, b=n, t1=null; cancelAnimationFrame(nt); function an(ts){ if(!t1)t1=ts; var p=Math.min(1,(ts-t1)/900); num.textContent=Math.round(a+(b-a)*(1-Math.pow(1-p,3))); if(p<1)nt=requestAnimationFrame(an); } nt=requestAnimationFrame(an);
    shown=n; if(label)lb.textContent=label; }
  if(reduce){ setTo(cells.length,'Alle Phasen'); }
  else { grow.classList.add('live');
    var so=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ steps.forEach(function(s){s.classList.toggle('act',s===e.target);}); setTo(+e.target.dataset.to,e.target.dataset.label); } }); },{rootMargin:'-45% 0px -45% 0px'});
    steps.forEach(function(s){so.observe(s);}); }
  /* Kalender: Tage poppen nacheinander */
  document.querySelectorAll('.mon').forEach(function(m){ var cs=[].slice.call(m.querySelectorAll('.cd:not(.pad)')); if(!fx)return; cs.forEach(function(c,i){c.classList.add('pre');c.style.setProperty('--d',(i*0.018)+'s');}); seen(m,function(){cs.forEach(function(c){c.classList.remove('pre');});}); });
  /* Kapitel-Balken, Woche, Flächen */
  [['.kps',0.09,'.kp-bar i'],['.week',0.07,'div'],['.surf',0.12,'div']].forEach(function(x){ var el=document.querySelector(x[0]); if(!el)return; [].forEach.call(el.querySelectorAll(x[2]),function(c,i){c.style.setProperty('--d',(i*x[1])+'s');}); if(!fx){el.classList.add('seen');return;} seen(el,function(){el.classList.add('seen');}); });
});
