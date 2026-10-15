/* ================= v186: maç motoru açık veri kalibrasyonu — zorla golün türü gerçek gol zincirlerinden (kontra, orta-kafa, orta-ayak, ara pası, dönen top, uzaktan şut, duran top, serbest vuruş) ================= */
/* Futbolcu / gözlemci / hakem modlarında goller MR'den gelir; motor onları "zorla gol" ile canlandırır (113 abForceTick → 220 v183ForceTick).
   Eskiden golün türü kurgulanmıyordu: o an top kimdeyse ve pencere açıksa vuruyordu (motorda gollerin ~%30'u "bireysel"/"ara pası").
   Şimdi her kuyruk golüne, StatsBomb Open Data'daki 3650 golün zincir paylarına (golZinciri.tipler) ve golcünün özelliklerine göre bir tür seçilir:
   kontra %12,5 · orta-kafa %3,9 + duran top kafa %9,2 · orta-ayak %7 · ara pası %4,5 · dönen top %11,9 · uzaktan şut %4,9 · açık oyun (bireysel + kombinasyon + duran top diğer) %31 ·
   doğrudan serbest vuruş (18–28 m'de faul olursa, golcü kullanır; fırsatçı). Uygunluk: kafa türleri Kafa Vuruşu ve boyla, uzaktan şut Uzaktan Şut'la, kontra rakip hücum ettikçe artar.
   Tür, golün kuyruk zamanından türetilen ayrı bir rastgele akışla seçilir (Math.random değil: aynı maç kaydında aynı tür).
   Her tür bir durum makinesidir (motor kancaları: S.forceAir golcü hava topunu kazanır ve kafa vurur · S.forceRebound kaleci golcünün önüne çeler ·
   S.forceCorner korner golcüye · S.forceFK serbest vuruşu golcü kullanır · S.forceQuick tek dokunuş). Penceresi dolan tür (50 sn; duran top 80 sn) v183'ün açık oyun kademelerine düşer.
   Skor/golcü/asist defteri (214 V177) değişmez: golcü yine kuyruktaki oyuncu, olay yolu aynı. */
const V186={W:{kontra:.125,kafa_orta:.039,kafa_duran:.092,orta_ayak:.07,ara:.045,donen:.119,uzak:.049,acik:.461},WIN:50,WIN_D:80,log:[]};
function v186Rnd(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
/* tür seçimi: p(tür) ∝ gol payı × uygunluk(golcü) */
function v186Pick(sim,tm,by,rnd){const W=V186.W,p=by!=null?sim.players[by]:null,a=p&&p.a?p.a:{},o={};
  const hea=a.hea!=null?a.hea:65,h=a.h||180,lon=a.lon!=null?a.lon:60,ment=(sim.tactics?sim.tactics(1-tm).ment:0)||0;
  const kf=Math.max(.15,Math.min(1.6,(hea-55)/25+(h-180)*.03));
  o.kontra=W.kontra*(ment>=0?1.3:.8);o.kafa_orta=W.kafa_orta*kf;o.kafa_duran=W.kafa_duran*kf;o.orta_ayak=W.orta_ayak;o.ara=W.ara*Math.max(.5,Math.min(1.5,(a.pac||70)/75));
  o.donen=W.donen;o.uzak=W.uzak*Math.max(.2,Math.min(1.6,(lon-50)/30));o.acik=W.acik;
  let s=0;for(const k in o)s+=o[k];let x=rnd()*s;for(const k in o){x-=o[k];if(x<=0)return k;}return 'acik';}
/* her adım: q = kuyruktaki gol ({t0,av}), tm = golü atacak motor takımı. Dönen: tür etkin mi (v183'ün dış şut zorlaması bekletilir) */
function v186Kurgu(sim,q,tm){if(!q||sim.forceGoal!==tm)return false;const by=sim.forceBy;const P=sim.players,gp=by!=null?P[by]:null;
  if(!q.av){const seed=Math.round((q.t0||0)*1000)^(tm*7919)^((q.side||0)*104729)^Math.round((q.t||0)*37);const rnd=v186Rnd(seed);q.av={tip:gp?v186Pick(sim,tm,by,rnd):'acik',t0:sim.t,rnd,st:0};try{V186.log.push(q.av.tip);}catch(e){}}
  const A=q.av,el=sim.t-A.t0,win=A.tip==='kafa_duran'?V186.WIN_D:V186.WIN;
  /* fırsatçı serbest vuruş: her türde golcü 18–28 m'deki doğrudan serbest vuruşu kullanır */
  sim.forceFK=gp&&!gp.off&&gp.team===tm?gp.id:null;
  if(A.tip==='acik'||!gp||gp.off||gp.team!==tm||el>win){if(A.tip!=='acik'){A.from=A.tip;A.tip='acik';}sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;return false;}
  const dir=sim.teams[tm].dir,gx=dir>0?105:0,o=sim.ball.owner,hy=Math.hypot,dG=q2=>hy(gx-q2.x,34-q2.y),live=sim.mode==='live';
  const box=(x,y)=>{gp.boxT={x:gx-dir*x,y:34+y,t:sim.t};};
  sim.forceGap=Math.min(sim.forceGap||0,1.2);
  switch(A.tip){
    case 'kontra':{   /* kendi yarısında top kazanılınca 15 sn: golcü hattın arkasına koşar, 16 m içinde vurur */
      if(live&&o&&o.team===tm&&A.own!==o.team&&Math.abs(sim.ball.x-gx)>52.5){A.ct=sim.t;}
      A.own=o?o.team:A.own;
      const on=A.ct!=null&&sim.t-A.ct<15;sim.forceDist=on?16:0;
      if(on&&live&&o&&o.team===tm&&o!==gp&&!(gp.run&&gp.run.until>sim.t)&&dG(gp)>14)gp.run={until:sim.t+2.4,x:gx-dir*Math.max(9,Math.min(dG(gp)-6,24)),y:34+(gp.y>34?4:-4)};
      return true;}
    case 'kafa_orta':case 'orta_ayak':{   /* top kanatta bir arkadaşta: golcü ceza sahasına, orta ona */
      const head=A.tip==='kafa_orta';sim.forceDist=head?0:15;
      if(!live||!o||o.team!==tm)return true;
      if(o===gp){sim.forceDist=head?0:15;return true;}
      const wing=Math.abs(o.y-34)>=13&&Math.abs(gx-o.x)<=32&&Math.abs(gx-o.x)>=3;
      if(Math.abs(gx-o.x)<45)box(head?6.8:8.3,(o.y>34?-1:1)*(head?2.2:3.2));
      if(wing&&dG(gp)<16&&sim.t-(A.lp||-9)>4&&!sim.pass){A.lp=sim.t;if(head)sim.forceAir=gp.id;else sim.forceQuick=gp.id;
        try{sim._lab.doPass(o,gp,head,null,{cross:true});}catch(e){}}
      return true;}
    case 'kafa_duran':{   /* sıradaki korner golcünün kafasına */
      sim.forceDist=0;sim.forceCorner=gp.id;
      if(sim.mode==='dead'&&sim.dead&&sim.dead.kind==='corner'&&sim.dead.team===tm){gp.boxT=null;}
      return true;}
    case 'ara':{   /* golcü hattın arkasına koşar, ara pası, tek dokunuş 11–12 m */
      sim.forceDist=15;if(!live||!o||o.team!==tm||o===gp)return true;
      const ahead=(gp.x-o.x)*dir>4,dg=dG(gp);
      if(ahead&&dg>14&&dg<34&&!(gp.run&&gp.run.until>sim.t)&&sim.t-(A.rt||-9)>3){A.rt=sim.t;gp.run={until:sim.t+2.6,x:gx-dir*11,y:34+(gp.y>34?3:-3)};}
      if(gp.run&&gp.run.until>sim.t&&sim.t-A.rt>.6&&sim.t-(A.lp||-9)>4&&!sim.pass&&hy(gp.x-o.x,gp.y-o.y)<32){A.lp=sim.t;sim.forceQuick=gp.id;try{sim._lab.doPass(o,gp,false,null,{run:true});}catch(e){}}
      return true;}
    case 'donen':{   /* arkadaşı 8–16 m'den vurur, kaleci golcünün önüne çeler, golcü 5–8 m'den tek dokunuş */
      sim.forceDist=10;if(!live||!o||o.team!==tm)return true;
      if(o!==gp){const d0=dG(o);if(gp.role!=='GK'&&dG(gp)>9)box(7,(o.y>34?-1:1)*2.8);
        if(d0>=8&&d0<=17&&dG(gp)<12&&!sim.shot&&sim.t-(A.sh||-9)>5){A.sh=sim.t;sim.forceRebound=gp.id;try{sim._lab.doShot(o,sim.xgAt(o.x,o.y,dir,3),3,null);}catch(e){}}}
      return true;}
    case 'uzak':{   /* golcü 19–27 m'de merkezde topla: kıvrılan şut köşeye */
      const d1=dG(gp);sim.forceDist=d1>=18?27:0;sim.forceGap=Math.min(sim.forceGap,.9);
      if(live&&o&&o.team===tm&&o!==gp&&Math.abs(gx-o.x)<55)box(22,(gp.y>34?1:-1)*4);
      return true;}
  }
  return false;}
/* v183 zorla gol akışını sarar: tür etkinken dış şut zorlaması ve uzun bekleme kuralı bekler, mesafe/aralık türe göre */
if(typeof v183ForceTick==='function'){v183ForceTick=(old=>function(S,sim){const q=ABM.fq&&ABM.fq[0];const act=!!(q&&q.av&&q.av.tip!=='acik');const tk=V183.TK,ow=V183.OWN;
  if(act){V183.TK=1e9;V183.OWN=1e9;}let r;try{r=old.apply(this,arguments);}finally{V183.TK=tk;V183.OWN=ow;}
  try{const q2=ABM.fq&&ABM.fq[0];if(q2&&ABM.fcur===q2&&sim.forceGoal!=null){v186Kurgu(sim,q2,sim.forceGoal);}else if(!ABM.fq||!ABM.fq.length){sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;sim.forceFK=null;}}catch(e){console.warn('v186',e);}
  return r;})(v183ForceTick);
  abForceTick=function(S,sim){if(ABM.hz)return;return v183ForceTick(S,sim);};}
