/* ================= v186: maç motoru açık veri kalibrasyonu — zorla golün türü gerçek gol zincirlerinden (kontra, orta-kafa, orta-ayak, ara pası, dönen top, uzaktan şut, duran top, serbest vuruş) ================= */
/* Futbolcu / gözlemci / hakem modlarında goller MR'den gelir; motor onları "zorla gol" ile canlandırır (113 abForceTick → 220 v183ForceTick).
   Eskiden golün türü kurgulanmıyordu: o an top kimdeyse ve pencere açıksa vuruyordu (motorda gollerin ~%30'u "bireysel"/"ara pası").
   Şimdi her kuyruk golüne, StatsBomb Open Data'daki 3650 golün zincir paylarına (golZinciri.tipler) ve golcünün özelliklerine göre bir tür seçilir:
   kontra %12,5 · orta-kafa %3,9 + duran top kafa %9,2 · orta-ayak %7 · ara pası %4,5 · dönen top %11,9 · uzaktan şut %4,9 · açık oyun (bireysel + kombinasyon + duran top diğer) %31 ·
   doğrudan serbest vuruş %2,6 (18–28 m'de faul olursa golcü kullanır). Uygunluk: kafa türleri Kafa Vuruşu ve boyla, uzaktan şut Uzaktan Şut'la, kontra rakip hücum ettikçe artar.
   Tür, golün kuyruk zamanından türetilen ayrı bir rastgele akışla seçilir (Math.random değil: aynı maç kaydında aynı tür).
   Her tür bir durum makinesidir (motor kancaları: S.forceAir golcü hava topunu kazanır ve kafa vurur · S.forceRebound kaleci golcünün önüne çeler ·
   S.forceCorner korner golcüye · S.forceFK serbest vuruşu golcü kullanır · S.forceQuick tek dokunuş). Penceresi dolan tür (70 sn; duran top 90 sn) v183'ün açık oyun kademelerine düşer.
   Skor/golcü/asist defteri (214 V177) değişmez: golcü yine kuyruktaki oyuncu, olay yolu aynı. */
const V186={W:{fk:.026,kontra:.125,kafa_orta:.039,kafa_duran:.092,orta_ayak:.07,ara:.045,donen:.119,uzak:.049,acik:.461},WIN:70,WIN_D:90,log:[]};
function v186Rnd(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
/* tür seçimi: p(tür) ∝ gol payı × uygunluk(golcü) */
function v186Pick(sim,tm,by,rnd){const W=V186.W,p=by!=null?sim.players[by]:null,a=p&&p.a?p.a:{},o={};
  const hea=a.hea!=null?a.hea:65,h=a.h||180,lon=a.lon!=null?a.lon:60,ment=(sim.tactics?sim.tactics(1-tm).ment:0)||0;
  const kf=Math.max(.15,Math.min(1.6,(hea-55)/25+(h-180)*.03));
  o.kontra=W.kontra*(ment>=0?1.3:.8);o.kafa_orta=W.kafa_orta*kf;o.kafa_duran=W.kafa_duran*kf;o.orta_ayak=W.orta_ayak;o.ara=W.ara*Math.max(.5,Math.min(1.5,(a.pac||70)/75));
  o.donen=W.donen;o.fk=W.fk*Math.max(.3,Math.min(1.6,((a.fk!=null?a.fk:55)-45)/30));o.uzak=W.uzak*Math.max(.2,Math.min(1.6,(lon-50)/30));o.acik=W.acik;
  let s=0;for(const k in o)s+=o[k];let x=rnd()*s;for(const k in o){x-=o[k];if(x<=0)return k;}return 'acik';}
/* not: motorda forceDist 0 "30 m" demektir (S.forceDist || 30); şut istenmeyen evrede .01 */
/* her adım: q = kuyruktaki gol ({t0,av}), tm = golü atacak motor takımı. Dönen: tür etkin mi (v183'ün dış şut zorlaması bekletilir) */
function v186Kurgu(sim,q,tm){if(!q||sim.forceGoal!==tm)return false;const by=sim.forceBy;const P=sim.players,gp=by!=null?P[by]:null;
  if(!q.av){const seed=Math.round((q.t0||0)*1000)^(tm*7919)^((q.side||0)*104729)^Math.round((q.t||0)*37);const rnd=v186Rnd(seed);q.av={tip:gp?v186Pick(sim,tm,by,rnd):'acik',t0:sim.t,rnd,st:0};try{V186.log.push(q.av.tip);}catch(e){}}
  const A=q.av,el=sim.t-A.t0,win=A.tip==='kafa_duran'?V186.WIN_D:V186.WIN;
  /* fırsatçı serbest vuruş: her türde golcü 18–28 m'deki doğrudan serbest vuruşu kullanır */
  sim.forceFK=A.tip==='fk'&&gp&&!gp.off&&gp.team===tm?gp.id:null;
  if(A.tip==='acik'||!gp||gp.off||gp.team!==tm||el>win){if(A.tip!=='acik'){A.from=A.tip;A.tip='acik';q.t0=sim.t;}      /* yedek: v183 açık oyun kademeleri baştan (18 m) */
    sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;sim.forceNoFeed=false;sim.forceHold=false;sim.forceOK=null;sim.forceOKKind=null;sim.forceOKMax=0;return false;}
  const dir=sim.teams[tm].dir,gx=dir>0?105:0,o=sim.ball.owner,hy=Math.hypot,dG=q2=>hy(gx-q2.x,34-q2.y),live=sim.mode==='live';
  const box=(x,y)=>{gp.boxT={x:gx-dir*x,y:34+y,t:sim.t};if(gp.run&&!gp.run.v186)gp.run=null;gp.late=null;gp.chk=null;};      /* ceza sahası hücresi koşu / gelip göstermeden önce gelir */
  sim.forceGap=Math.min(sim.forceGap||0,1.2);sim.forceNoFeed=A.tip==='kafa_orta'||A.tip==='orta_ayak'||A.tip==='donen'||A.tip==='kafa_duran';      /* orta / dönen top: arkadaşlar topu golcüye vermek yerine kanattan ortalar ya da vurur */
  sim.forceHold=true;const okOn=sim.t<(A.ok||-9);sim.forceOK=okOn?gp.id:null;if(!okOn){sim.forceOKKind=null;sim.forceOKMax=0;}      /* bitiriş penceresi: yalnız kurgunun anında golcünün şutu gol */
  const okFor=(s,kd,mx)=>{A.ok=Math.max(A.ok||-9,sim.t+s);sim.forceOK=gp.id;sim.forceOKKind=kd||null;sim.forceOKMax=mx||0;};      /* bitiriş türü (kafa / serbest vuruş) ve en uzak mesafe */
  if(sim.mode==='dead'&&sim.dead&&sim.dead.kind==='freekick'&&sim.dead.team===tm&&sim.dead.taker===gp)okFor(3,'FK',30);
  const pass=(to,high,info)=>{A.lp=sim.t;try{sim._lab.doPass(o,to,high,null,info);}catch(e){}};
  const free=live&&o&&o.team===tm&&o!==gp&&!sim.pass&&!sim.shot&&sim.t-(A.lp||-9)>3;
  /* hazırlık: top orta sahada bir arkadaştaysa öndeki kanat oyuncusuna (orta) ya da ceza yayındaki arkadaşa (dönen top) aktarılır — her aktarma gerçek bir motor pası */
  const feed=(want)=>{if(!free||sim.t-(A.fd||-9)<4)return;let b=null,bs=-1e9;for(const q2 of P){if(q2.team!==tm||q2.off||q2.role==='GK'||q2===o||q2===gp)continue;const dq=hy(q2.x-o.x,q2.y-o.y);if(dq<6||dq>34||(q2.x-o.x)*dir<-2)continue;const sc=want(q2)-dq*.05;if(sc>bs){bs=sc;b=q2;}}
    if(b&&bs>0){A.fd=sim.t;pass(b,hy(b.x-o.x,b.y-o.y)>30,null);}};
  switch(A.tip){
    case 'kontra':{   /* kendi yarısında top kazanılınca 15 sn: golcü hattın arkasına koşar, ara pası, 16 m içinde vurur (veri: kontra golü medyan 12,8 m) */
      if(live&&o&&o.team===tm&&A.own!==o.team&&Math.abs(sim.ball.x-gx)>45){A.ct=sim.t;}
      A.own=o?o.team:A.own;
      const on=A.ct!=null&&sim.t-A.ct<15;sim.forceDist=on?16:.01;if(on)okFor(.1,null,18);
      if(on&&live&&o&&o.team===tm&&o!==gp&&dG(gp)>14&&!(gp.run&&gp.run.until>sim.t))gp.run={v186:1,until:sim.t+2.6,x:gx-dir*Math.max(10,Math.min(dG(gp)-8,26)),y:34+(gp.y>34?4:-4)};
      if(on&&free&&(gp.x-o.x)*dir>2&&hy(gp.x-o.x,gp.y-o.y)<46&&dG(gp)<44){sim.forceQuick=null;pass(gp,hy(gp.x-o.x,gp.y-o.y)>32,{run:true});}
      return true;}
    case 'kafa_orta':case 'orta_ayak':{   /* top kanatta bir arkadaşta: golcü ceza sahasına (ön/uzak direk), orta ona (veri: orta golü medyan 6,8 / 8,3 m) */
      const head=A.tip==='kafa_orta';sim.forceDist=head?.01:15;
      if(!live||!o||o.team!==tm||o===gp)return true;
      if(Math.abs(o.y-34)<10||Math.abs(gx-o.x)>38)feed(q2=>{const d2=Math.abs(gx-q2.x);return Math.abs(q2.y-34)>=11&&d2<=38&&d2>=6?1+(38-d2)/38:0;});
      const dl=Math.abs(gx-o.x),wing=Math.abs(o.y-34)>=10&&dl<=38&&dl>=3;
      if(dl<62)box(head?6.8:8.3,(o.y>34?-1:1)*(head?2.2:3.2));
      if(wing&&free&&dG(gp)<(head?13.5:16)){if(head)sim.forceAir=gp.id;else sim.forceQuick=gp.id;okFor(head?3.5:3,head?'HEAD':null,head?14:15);pass(gp,head||hy(gp.x-o.x,gp.y-o.y)>22,{cross:true});}
      return true;}
    case 'kafa_duran':{   /* sıradaki korner golcünün kafasına */
      sim.forceDist=.01;sim.forceCorner=gp.id;if(sim.forceAir===gp.id)okFor(3.5,'HEAD',14);
      return true;}
    case 'ara':{   /* golcü hattın arkasına koşar, ara pası, tek dokunuş (veri: ara pası golü medyan 11,6 m) */
      sim.forceDist=15;if(!live||!o||o.team!==tm||o===gp)return true;
      const dg=dG(gp),ahead=(gp.x-o.x)*dir>3;
      if(ahead&&dg>13&&dg<36&&!(gp.run&&gp.run.until>sim.t)&&sim.t-(A.rt||-9)>3){A.rt=sim.t;gp.run={v186:1,until:sim.t+2.6,x:gx-dir*11,y:34+(gp.y>34?3:-3)};}
      if(gp.run&&gp.run.until>sim.t&&sim.t-(A.rt||-9)>.5&&free&&hy(gp.x-o.x,gp.y-o.y)<34){sim.forceQuick=gp.id;okFor(3.5,null,16);pass(gp,false,{run:true});}
      return true;}
    case 'donen':{   /* arkadaşı 8–22 m'den vurur, kaleci golcünün önüne çeler, golcü tek dokunuş (veri: dönen top golü medyan 6,8 m) */
      sim.forceDist=11;if(!live||!o||o.team!==tm)return true;
      if(o!==gp){const d0=dG(o);if(dG(gp)>9&&Math.abs(gx-o.x)<62)box(7,(o.y>34?-1:1)*2.8);
        if(d0>24)feed(q2=>{const d2=hy(gx-q2.x,34-q2.y);return d2>=9&&d2<=22&&Math.abs(q2.y-34)<14?1+(22-d2)/22:0;});
        if(d0>=8&&d0<=24&&Math.abs(o.y-34)<18&&dG(gp)<14&&!sim.shot&&sim.t-(A.sh||-9)>5){A.sh=sim.t;sim.forceRebound=gp.id;okFor(3.5,null,11);try{sim._lab.doShot(o,sim.xgAt(o.x,o.y,dir,3),3,null);}catch(e){}}}
      return true;}
    case 'fk':{sim.forceDist=.01;return true;}      /* 18–28 m'de serbest vuruş kazanılırsa golcü kullanır */
    case 'uzak':{   /* golcü 19–27 m'de merkezde topla: kıvrılan şut köşeye (veri: uzaktan şut golü medyan 22,3 m) */
      const d1=dG(gp);sim.forceDist=d1>=18?27:.01;sim.forceGap=Math.min(sim.forceGap,.9);if(d1>=18&&d1<=28&&o===gp)okFor(.1,null,29);
      if(live&&o&&o.team===tm&&o!==gp&&Math.abs(gx-o.x)<60)box(22,(gp.y>34?1:-1)*4);
      if(free&&d1>=18&&d1<=28&&Math.abs(gp.y-34)<12&&hy(gp.x-o.x,gp.y-o.y)<30)pass(gp,false,null);
      return true;}
  }
  return false;}
/* v183 zorla gol akışını sarar: tür etkinken dış şut zorlaması ve uzun bekleme kuralı bekler, mesafe/aralık türe göre */
if(typeof v183ForceTick==='function'){v183ForceTick=(old=>function(S,sim){const q=ABM.fq&&ABM.fq[0];const act=!!(q&&q.av&&q.av.tip!=='acik');const tk=V183.TK,ow=V183.OWN;
  if(act){V183.TK=1e9;V183.OWN=1e9;}let r;try{r=old.apply(this,arguments);}finally{V183.TK=tk;V183.OWN=ow;}
  try{const q2=ABM.fq&&ABM.fq[0];if(q2&&ABM.fcur===q2&&sim.forceGoal!=null){v186Kurgu(sim,q2,sim.forceGoal);}else if(!ABM.fq||!ABM.fq.length){sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;sim.forceFK=null;sim.forceNoFeed=false;sim.forceHold=false;sim.forceOK=null;sim.forceOKKind=null;sim.forceOKMax=0;}}catch(e){console.warn('v186',e);}
  return r;})(v183ForceTick);
  abForceTick=function(S,sim){if(ABM.hz)return;return v183ForceTick(S,sim);};}
