/* ================= v186: maç motoru açık veri kalibrasyonu — zorla golün türü gerçek gol zincirlerinden (kontra, orta-kafa, orta-ayak, ara pası, dönen top, uzaktan şut, duran top, serbest vuruş) ================= */
/* Futbolcu / gözlemci / hakem modlarında goller MR'den gelir; motor onları "zorla gol" ile canlandırır (113 abForceTick → 220 v183ForceTick).
   Eskiden golün türü kurgulanmıyordu: o an top kimdeyse ve pencere açıksa vuruyordu (motorda gollerin ~%30'u "bireysel"/"ara pası").
   Şimdi her kuyruk golüne, StatsBomb Open Data'daki 3650 golün zincir paylarına (golZinciri.tipler) ve golcünün özelliklerine göre bir tür seçilir:
   kontra %12,5 · orta-kafa %3,9 + duran top kafa %9,2 · orta-ayak %7 · ara pası %4,5 · dönen top %11,9 · uzaktan şut %4,9 · açık oyun (bireysel + kombinasyon + duran top diğer) %31 ·
   doğrudan serbest vuruş %2,6 (18–28 m'de faul olursa golcü kullanır). Uygunluk: kafa türleri Kafa Vuruşu ve boyla, uzaktan şut Uzaktan Şut'la, kontra rakip hücum ettikçe artar.
   Tür, golün kuyruk zamanından türetilen ayrı bir rastgele akışla seçilir (Math.random değil: aynı maç kaydında aynı tür).
   Her tür bir durum makinesidir (motor kancaları: S.forceAir golcü hava topunu kazanır ve kafa vurur · S.forceRebound kaleci golcünün önüne çeler ·
   S.forceCorner korner golcüye · S.forceFK serbest vuruşu golcü kullanır · S.forceQuick tek dokunuş). Penceresi dolan tür (35 sn; duran top 60 sn) v183'ün açık oyun kademelerine düşer.
   Skor/golcü/asist defteri (214 V177) değişmez: golcü yine kuyruktaki oyuncu, olay yolu aynı. */
const V186={W:{fk:.026,kontra:.125,kafa_orta:.039,kafa_duran:.092,orta_ayak:.07,ara:.045,donen:.119,uzak:.049,acik:.461},WIN:35,WIN_D:60,log:[]};
/* v183 açık oyun kademeleri: gerçek gol şutlarının %86'sı ceza sahası içinden (StatsBomb) — mesafe sınırı daha uzun süre ceza sahası içinde kalır (eski: 18 m → 60 sn'de 26 m → 120 sn'de 32 m) */
if(typeof V183!=='undefined')V183.F=[[0,16,1.6,.8],[25,18,1.4,.9],[50,20,1.1,1],[80,22,.8,1.1],[110,24,0,1.2],[150,28,0,1.4]];
function v186Rnd(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
/* tür seçimi: p(tür) ∝ gol payı × uygunluk(golcü) */
function v186Pick(sim,tm,by,rnd){const W=V186.W,p=by!=null?sim.players[by]:null,a=p&&p.a?p.a:{},o={};
  const hea=a.hea!=null?a.hea:65,h=a.h||180,lon=a.lon!=null?a.lon:60,ment=(sim.tactics?sim.tactics(1-tm).ment:0)||0;
  const kf=Math.max(.15,Math.min(1.6,(hea-55)/25+(h-180)*.03));
  o.kontra=W.kontra*(ment>=0?1.3:.8);o.kafa_orta=W.kafa_orta*kf;o.kafa_duran=W.kafa_duran*kf;o.orta_ayak=W.orta_ayak;o.ara=W.ara*Math.max(.5,Math.min(1.5,(a.pac||70)/75));
  if(W.pen){const tk=sim.takers&&sim.takers[tm]?sim.takers[tm].pen:null;o.pen=W.pen*(tk!=null&&tk>=0?(p&&p.id===tm*11+tk?1.4:.35):(p&&p.role==='ST'?1.3:.6));}
  o.donen=W.donen;o.fk=W.fk*Math.max(.3,Math.min(1.6,((a.fk!=null?a.fk:55)-45)/30));o.uzak=W.uzak*Math.max(.2,Math.min(1.6,(lon-50)/30));o.acik=W.acik;
  let s=0;for(const k in o)s+=o[k];let x=rnd()*s;for(const k in o){x-=o[k];if(x<=0)return k;}return 'acik';}
/* not: motorda forceDist 0 "30 m" demektir (S.forceDist || 30); şut istenmeyen evrede .01 */
/* her adım: q = kuyruktaki gol ({t0,av}), tm = golü atacak motor takımı. Dönen: tür etkin mi (v183'ün dış şut zorlaması bekletilir) */
function v186Kurgu(sim,q,tm){if(!q||sim.forceGoal!==tm)return false;const by=sim.forceBy;const P=sim.players,gp=by!=null?P[by]:null;
  if(!q.av){const seed=Math.round((q.t0||0)*1000)^(tm*7919)^((q.side||0)*104729)^Math.round((q.t||0)*37);const rnd=v186Rnd(seed);q.av={tip:gp?v186Pick(sim,tm,by,rnd):'acik',t0:sim.t,rnd,st:0};{const u=rnd();q.av.dT=u<.45?6+5*rnd():u<.86?11+5.5*rnd():16.5+7*rnd();}      /* açık oyunda bitiriş mesafesi gerçek gol şutlarından (%45 6–11 m, %41 11–16,5 m, %14 16,5–24 m); eskiden şut pencerenin sınırında (18–28 m) çekiliyordu */try{V186.log.push(q.av.tip);}catch(e){}}
  const A=q.av,el=sim.t-A.t0;let win=A.tip==='kafa_duran'||A.tip==='kontra'?V186.WIN_D:V186.WIN;      /* kontra top kazanmayı bekler: 60 sn */
  if(A.ok>sim.t||(A.tip==='kontra'&&A.ct!=null&&sim.t-A.ct<15))win=Math.max(win,el+1);      /* kurgu sürerken (bitiriş penceresi açık / kontra koşusu) pencere kapanmaz */
  /* fırsatçı serbest vuruş: her türde golcü 18–28 m'deki doğrudan serbest vuruşu kullanır */
  sim.forceFK=A.tip==='fk'&&gp&&!gp.off&&gp.team===tm?gp.id:null;
  if(A.tip==='acik'||!gp||gp.off||gp.team!==tm||el>win){if(A.tip!=='acik'){A.from=A.tip;A.tip='acik';q.t0=sim.t;}      /* yedek: v183 açık oyun kademeleri baştan (18 m) */
    if(A.dT)sim.forceDist=Math.min(sim.forceDist||30,A.dT+Math.max(0,sim.t-q.t0-40)*.12);
    /* not: golcünün kendi kararıyla çektiği şutu mesafeyle sınırlamak (forceHold) uzak şut golünü %32'den %20'ye indiriyor ama yoğun gol kuyruğunda (lab: maç başı 8 gol) süresinde atılamayan gol 64'te 7'den 14–16'ya çıkıyor — açık */
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
      if(on&&free&&(gp.x-o.x)*dir>2&&hy(gp.x-o.x,gp.y-o.y)<34&&dG(gp)<44){sim.forceQuick=null;pass(gp,false,{run:true});}      /* yerden ara pası (havadan uzun top kafa düellosuna dönüyordu) */
      return true;}
    case 'kafa_orta':case 'orta_ayak':{   /* top kanatta bir arkadaşta: golcü ceza sahasına (ön/uzak direk), orta ona (veri: orta golü medyan 6,8 / 8,3 m) */
      const head=A.tip==='kafa_orta';sim.forceDist=head?.01:15;
      if(!live||!o||o.team!==tm||o===gp)return true;
      if(Math.abs(o.y-34)<10||Math.abs(gx-o.x)>38)feed(q2=>{const d2=Math.abs(gx-q2.x);return Math.abs(q2.y-34)>=11&&d2<=38&&d2>=6?1+(38-d2)/38:0;});
      const dl=Math.abs(gx-o.x),wing=Math.abs(o.y-34)>=8&&dl<=46&&dl>=3;
      if(dl<62)box(head?6.8:8.3,(o.y>34?-1:1)*(head?2.2:3.2));
      if(wing&&free&&dG(gp)<22&&(gx-gp.x)*dir>0){      /* golcü savunma hattının gerisinden (ofsayta düşmeden) ön / uzak direk hücresine koşar, orta koşusunun önüne */
        const sx=gx-dir*(head?6.8:8.3),sy=34+(o.y>34?-1:1)*(head?2.2:3.2),ux=sx-gp.x,uy=sy-gp.y,ul=hy(ux,uy)||1,sp=Math.min(8,ul/1.2),vx0=gp.vx,vy0=gp.vy;
        if(head)sim.forceAir=gp.id;else sim.forceQuick=gp.id;okFor(head?3.5:3,head?'HEAD':null,head?16:16);
        gp.run={v186:1,until:sim.t+2.4,x:sx,y:sy};gp.vx=ux/ul*sp;gp.vy=uy/ul*sp;pass(gp,head||hy(sx-o.x,sy-o.y)>22,{cross:true});gp.vx=vx0;gp.vy=vy0;}
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
/* ================= v187: zorla golün türü sim içinde zincir olarak planlanır ================= */
/* v186'da tür yalnız "fırsat beklenirken" kurgulanıyordu: penceresi (35–60 sn) dolan türler açık oyuna düşüyordu (görüntüsüz laboratuvar: türlü gollerin ~%10'u amaçlanan zincirle).
   v187: her tür adım adım bir motor zinciridir (hepsi gerçek motor pası / şutu / dribbling; ışınlanma yok):
   kontra — top kendi yarı alanımızda kazanılınca (rakip orada topu kaybeder) golcü hattın arkasına koşar, en çok 4 pas, 15 sn içinde ≤ 18 m'den bitiriş ·
   orta (kafa / ayak) — top kanattaki arkadaşa taşınır, o çizgiye iner, golcü ön / uzak direk hücresine koşar, orta (havadan: golcü düelloyu kazanır, kafa · yerden geri çevirme: tek dokunuş) ·
   duran top kafa — arkadaşın şutunu kaleci kornere çeler (S.forceParryOut), korner golcünün kafasına · ara pası — golcü ofsayt çizgisinden koşar, ara pası, bitiriş ·
   dönen top — arkadaş 9–24 m'den vurur, kaleci golcünün önüne çeler · uzaktan şut — golcü 19–27 m'de topla, köşeye · serbest vuruş / penaltı — golcüye 18–27 m'de / ceza sahasında
   faul (S.forceFoul), vuruşu golcü kullanır (hakem modunda penaltı kurgulanmaz). Bitiriş ancak gol sayımının zinciri doğru okuyacağı anda (kontra dışı türlerde topa sahip olma
   kendi yarı alanında 15 sn içinde başlamışsa, taçtan 12 sn içinde ya da duran toptan sonra beklenir). Penceresi dolan tür v183 açık oyun kademelerine düşer. Defter (214 V177) değişmez. */
V186.K2=1;V186.W.pen=.081;V186.W.acik=.351;
V186.WIN2={kontra:110,kafa_orta:105,orta_ayak:105,kafa_duran:115,ara:100,donen:100,uzak:95,fk:100,pen:100};V186.WK=1;      /* pencere çarpanı (süre fiziksel sn; .7 denendi: penaltı kurgusu %81→%69, medyan yine >70 sim-sn) */
function v187Kurgu(sim,q,tm){if(!q||sim.forceGoal!==tm)return false;const P=sim.players,by=sim.forceBy,gp=by!=null?P[by]:null,hy=Math.hypot;
  if(!q.av){const seed=Math.round((q.t0||0)*1000)^(tm*7919)^((q.side||0)*104729)^Math.round((q.t||0)*37);const rnd=v186Rnd(seed);let tip=gp?v186Pick(sim,tm,by,rnd):'acik';if(tip==='pen'&&sim.userRef)tip='acik';
    q.av={tip,t0:sim.t,rnd,st:0,k2:1};{const u=rnd();q.av.dT=u<.45?6+5*rnd():u<.86?11+5.5*rnd():16.5+7*rnd();}try{V186.log.push(tip);}catch(e){}}
  const A=q.av;{const d0=A.lt!=null?Math.max(0,sim.t-A.lt):0;A.lt=sim.t;A.ph=(A.ph||0)+(sim.mode==='dead'?d0/((sim.C&&sim.C.CLKD)||1):d0);}const el=A.ph;      /* kurgu süresi fiziksel sn (v187 AV_CLK: top ölüyken maç saati hızlı akar; pencere ölü topta erimez) */
  let late=false;try{if(typeof MR!=='undefined'&&MR&&(MR.fin||MR.min>=78))late=true;}catch(e){}      /* maçın son ~12 dakikasında tür kurgusu yok: gol MR dakikasına yetişsin (canlı maç uzamasın, çerçeve eksik kalmasın) */
  if(late&&A.tip!=='acik'&&!(A.ok>sim.t)){A.from=A.tip;A.tip='acik';q.t0=sim.t;}
  const clr=()=>{sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;sim.forceNoFeed=false;sim.forceHold=false;sim.forceOK=null;sim.forceOKKind=null;sim.forceOKMax=0;sim.forceFK=null;sim.forceFoul=null;sim.forceParryOut=null;sim.forceSafe=null;sim.forcePen=null;};
  if(A.tip==='acik'||!gp||gp.off||gp.team!==tm||(el>(V186.WIN2[A.tip]||60)*(V186.WK||1)*(ABM.fq&&ABM.fq.length>2?.25:ABM.fq&&ABM.fq.length>1?.5:1)+(ABM.fq&&ABM.fq.length>1?0:40)&&!(A.ok>sim.t)&&!(A.tip==='kafa_duran'&&((sim.mode==='dead'&&sim.dead&&sim.dead.kind==='corner'&&sim.dead.team===tm)||(gp&&sim.forceAir===gp.id))))){if(A.tip!=='acik'){A.from=A.tip;A.tip='acik';q.t0=sim.t;}
    if(A.dT)sim.forceDist=Math.min(sim.forceDist||30,A.dT+Math.max(0,sim.t-q.t0-40)*.12);clr();sim.forcePen=gp&&!gp.off&&gp.team===tm?gp.id:null;return false;}
  const dir=sim.teams[tm].dir,gx=dir>0?105:0,og=105-gx,o=sim.ball.owner,live=sim.mode==='live',mine=live&&o&&o.team===tm,dG=p=>hy(gx-p.x,34-p.y),gl=p=>Math.abs(gx-p.x);
  /* topa sahip olma kaydı (gol sayımının zincir sınıflandırmasıyla aynı mantık) */
  if(sim.mode==='dead')A.wd=1;
  if(live&&o&&o.team!==A.pt){A.reg=!A.wd&&A.pt===1-o.team;A.pt=o.team;A.ps=sim.t;A.px=Math.abs(o.x-og);A.pn=0;A.set=null;A.thr=null;A.wd=0;}      /* reg: top canlı oyunda rakipten kazanıldı */
  if(sim.pass&&sim.pass!==A.lpo){A.lpo=sim.pass;if(sim.pass.team===tm&&A.pt===tm){A.pn++;const tg=sim.pass.tag;if(tg==='CORNER'||tg==='FREEKICK')A.set=tg;if(tg==='THROW')A.thr=sim.t;}}
  sim.forceSafe=null;const safe=p=>{sim.forceSafe=p.id;};
  const cl=()=>{if(clean0){A.rw=null;return true;}if(A.rw==null)A.rw=sim.t;if(kl&&settled&&o!==gp&&sim.t-(A.fd||-9)>1.2)feed(o,z=>{const d=hy(z.x-o.x,z.y-o.y);return d>=6&&d<=24&&dG(z)<dG(o)+10?1:0;},1.3);return sim.t-A.rw>3.5;};      /* kontra benzeri sahiplikte top bir iki kez dolaştırılır (5 pası geçince açık oyun) */      /* bitiriş hazırken zincir sınıflandırması için en çok 5 sn beklenir */
  const ktr=A.pt===tm&&A.px<52&&sim.t-A.ps<=14.5&&A.pn<=4&&!A.set&&A.thr==null,kl=A.pt===tm&&A.px<53.5&&sim.t-A.ps<=16&&A.pn<=5,clean0=!kl&&!A.set&&!(A.thr!=null&&sim.t-A.thr<12.5);
  sim.forceHold=true;sim.forceNoFeed=true;sim.forceGap=Math.min(sim.forceGap||0,1.2);sim.forceDist=.01;sim.forcePen=gp.id;
  const okOn=sim.t<(A.ok||-9);sim.forceOK=okOn?gp.id:null;if(!okOn){sim.forceOKKind=null;sim.forceOKMax=0;}
  const okFor=(s,kd,mx)=>{A.ok=Math.max(A.ok||-9,sim.t+s);sim.forceOK=gp.id;sim.forceOKKind=kd||null;sim.forceOKMax=mx||0;};
  const pdOf=p=>{let d=99;for(const z of P)if(z.team!==p.team&&!z.off){const e=hy(z.x-p.x,z.y-p.y);if(e<d)d=e;}return d;};
  const offD=()=>{const a=[];for(const z of P)if(z.team!==tm&&!z.off)a.push(Math.abs(gx-z.x));a.sort((u,v)=>u-v);return a[1]||0;};
  const pass=(fr,to,high,info)=>{A.lp=sim.t;try{sim._lab.doPass(fr,to,high,null,info);}catch(e){}};
  const shoot=p=>{A.lsh=sim.t;try{sim._lab.doShot(p,sim.xgAt(p.x,p.y,dir,pdOf(p)),pdOf(p),null);}catch(e){}};
  const settled=mine&&!sim.pass&&!sim.shot&&hy(sim.ball.x-o.x,sim.ball.y-o.y)<1.4&&sim.t-(A.lp||-9)>.5;
  const lane=(a,b)=>{let m=9;for(const z of P){if(z.team===tm||z.off)continue;const vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((z.x-a.x)*vx+(z.y-a.y)*vy)/l2));m=Math.min(m,hy(z.x-a.x-vx*t,z.y-a.y-vy*t));}return m;};
  const box=(x,y)=>{gp.boxT={x:gx-dir*x,y:34+y,t:sim.t};if(gp.run&&!gp.run.v186)gp.run=null;gp.late=null;gp.chk=null;};
  const carry=(p,t,ns)=>{p.dribble=true;p.dribType='carry';p.knock=false;p.wideLine=false;p.think=Math.max(p.think||0,t||.35);if(A.cid!==p.id){A.cid=p.id;A.ct0=sim.t;}if(sim.t-A.ct0<3&&!ns)safe(p);if(ns)p.keepT=sim.t+.3;};      /* kurgunun taşıdığı top en çok 3 sn müdahalesiz */
  /* en iyi aktarım: want(q) > 0 olan, koridoru açık arkadaş (golcü hariç) */
  const feed=(fr,want,minL)=>{if(!settled||sim.t-(A.fd||-9)<1.2)return false;let b=null,bs=-1e9;for(const z of P){if(z.team!==tm||z.off||z.role==='GK'||z===fr||z===gp)continue;const dq=hy(z.x-fr.x,z.y-fr.y);if(dq<5||dq>44)continue;const w=want(z);if(!(w>0))continue;const ln=lane(fr,z);if(ln<Math.min(minL||1.6,1.3))continue;const sc=w+Math.min(ln,4)*.15-dq*.01;if(sc>bs){bs=sc;b=z;}}
    if(b){A.fd=sim.t;pass(fr,b,hy(b.x-fr.x,b.y-fr.y)>32,null);A.fto=b.id;return true;}return false;};
  if(sim.pass&&sim.pass.team===tm&&sim.pass.to&&sim.pass.to.id===A.fto&&sim.t-(A.fd||-9)<2.5)sim.forceSafe=A.fto;      /* kurgunun aktarım pası kesilmez */
  /* top rakipteyken: rakibin kötü pası (gerçek pas; kontrada yalnız rakip bizim yarı alanımızdayken → kendi yarımızda top kazanma) */
  if(live&&o&&o.team!==tm&&o.role!=='GK'&&!sim.pass&&!sim.shot&&el>(A.tip==='kontra'?2:3.5)&&sim.t-(A.bp||-9)>5&&(A.tip!=='kontra'||Math.abs(o.x-og)<64||el>50)){
    let to=null,bd=34;for(const z of P){if(z.team!==tm||z.off||z.role==='GK')continue;if(A.tip==='kontra'&&el<=50&&Math.abs(z.x-og)>48)continue;const d=hy(z.x-o.x,z.y-o.y);if(d<bd&&d>4){bd=d;to=z;}}      /* kontrada top kendi yarı alanımızdaki oyuncuya kaybedilir */
    if(to){A.bp=sim.t;pass(o,to,bd>24,null);}}
  if(sim.shot&&sim.shot.team===tm&&sim.t-(A.lsh||-9)<2.5&&sim.shot.shooter)sim.forceSafe=sim.shot.shooter.id;      /* kurgunun şutu yolda bloklanmaz */
  if(A.ok>sim.t&&sim.forceOKKind!=='HEAD'&&mine&&o===gp&&!sim.shot&&sim.t-(A.lsh||-9)>1&&(!A.okD||dG(gp)<=A.okD)){shoot(gp);return true;}      /* bitiriş anı: golcü topu aldı */
  const sg=A.sg||(A.sg=(mine&&Math.abs(o.y-34)>6?(o.y>34?1:-1):(gp.y>34?1:-1)));
  /* topa sahipken kurgu topçuyu yönetir: kendi kararı (pas / şut) beklenir, kurgu her .5 sn'de bir hamle seçer (gerçek pas, sürme, şut) */
  const ctl=mine&&o.role!=='GK'&&A.tip!=='kontra',act=settled&&sim.t-(A.act||-9)>.5;
  if(ctl){o.think=Math.max(o.think||0,.25);o.keepT=sim.t+.3;}
  const did=()=>{A.act=sim.t;return true;};
  /* topu (tx,ty) noktasına yaklaştır: ona belirgin yakın, koridoru açık arkadaşa pas (golcü hariç); yoksa sür */
  const prog=(tx,ty,ex,wl)=>{if(!act)return false;const d0=hy(o.x-tx,o.y-ty);let b=null,bs=1e9;for(const z of P){if(z.team!==tm||z.off||z.role==='GK'||z===o||(ex&&z===ex))continue;const dq=hy(z.x-o.x,z.y-o.y);if(dq<6||dq>30)continue;const dz=hy(z.x-tx,z.y-ty);if(dz>d0-5)continue;if(lane(o,z)<1.2)continue;const sc=dz+dq*.15;if(sc<bs){bs=sc;b=z;}}
    if(b){A.fd=sim.t;A.fto=b.id;pass(o,b,false,null);safe(b);return did();}carry(o,.3);o.wideLine=!!wl;return false;};
  switch(A.tip){
    case 'kontra':{
      if(!mine)return true;
      if(!ktr){if(o!==gp&&settled&&sim.t-A.ps>16)A.ktw=1;return true;}      /* kontra penceresi geçti: yeni top kazanmayı bekle */
      if(o!==gp){if(dG(gp)>14&&!(gp.run&&gp.run.until>sim.t))gp.run={v186:1,until:sim.t+2.2,x:gx-dir*Math.max(11,Math.min(gl(gp)-9,30)),y:34+(gp.y>34?3:-3)};
        if(sim.pass&&sim.pass.to===gp)safe(gp);else safe(o);
        o.think=Math.max(o.think||0,.2);o.keepT=sim.t+.3;
        if(settled){const ah=(gp.x-o.x)*dir,dq=hy(gp.x-o.x,gp.y-o.y);if(dq<40&&dG(gp)<dG(o)+12&&lane(o,gp)>1.2){pass(o,gp,dq>30,{run:ah>3&&!!(gp.run&&gp.run.until>sim.t)});safe(gp);return true;}
          if(!feed(o,z=>hy(gp.x-z.x,gp.y-z.y)<dq-6?1+(z.x-o.x)*dir/30:0,1.2))carry(o,.25);}
        return true;}
      if(dG(gp)>48&&settled&&feed(gp,z=>(z.x-gp.x)*dir>8?1+(z.x-gp.x)*dir/40:0,1.3)){if(!(gp.run&&gp.run.until>sim.t))gp.run={v186:1,until:sim.t+2.5,x:gx-dir*Math.max(12,gl(gp)-22),y:34+(gp.y>34?4:-4)};return true;}      /* derindeki golcü öne verir, koşar (ver-kaç) */
      safe(gp);carry(gp,.3);gp.keepT=sim.t+.3;if(dG(gp)<=17||(sim.t-A.ps>11&&dG(gp)<26)){okFor(.6,null,27);shoot(gp);}return true;}
    case 'kafa_orta':case 'orta_ayak':{
      const head=A.tip==='kafa_orta',sx=head?6.8:8.3,sy=-sg*(head?2.2:3.2);
      if(sim.t-(A.fs||-9)<2.5)safe(gp);
      if(!mine){A.cr0=null;return true;}
      if(dG(gp)>9&&gl(o)<62)box(Math.max(sx,offD()+.6),sy);      /* ofsayt çizgisinde bekler, orta anında hücreye koşar */
      const wy=34+sg*20,wx=gx-dir*18;
      if(o===gp){prog(wx,wy,null,0);return true;}
      const inZ=Math.abs(o.y-34)>=11&&gl(o)<=33&&gl(o)>=3;
      if(inZ){safe(o);if(A.cr0==null)A.cr0=sim.t;const spx=gx-dir*Math.max(sx,offD()+.6),spy=34+sy,dsp=hy(gp.x-spx,gp.y-spy);
        if(gl(o)>9){carry(o,.3);o.wideLine=Math.abs(o.y-34)<30;}else{o.dribble=false;}      /* çizgiye yapışan oyuncu içeri keser */
        if(settled&&(dsp<3.2||sim.t-A.cr0>2.4)&&dsp<9&&(gx-gp.x)*dir>0&&(head||hy(spx-o.x,spy-o.y)<=33)&&gl(gp)>=offD()-.3&&cl()){const ux=spx-gp.x,uy=spy-gp.y,ul=hy(ux,uy)||1,sp=Math.min(7.5,ul/1),vx0=gp.vx,vy0=gp.vy;
          gp.run={v186:1,until:sim.t+2.2,x:spx,y:spy};if(head){sim.forceAir=gp.id;okFor(4,'HEAD',17);}else{sim.forceQuick=gp.id;okFor(4,null,18);A.okD=18;A.fs=sim.t;}
          gp.vx=ux/ul*sp;gp.vy=uy/ul*sp;pass(o,gp,head,{cross:true});gp.vx=vx0;gp.vy=vy0;A.cr0=null;did();}
        return true;}
      A.cr0=null;prog(wx,wy,gp,Math.abs(o.y-34)>=10);return true;}
    case 'kafa_duran':case 'donen':{
      const dn=A.tip==='donen';
      if(!dn){sim.forceCorner=gp.id;      /* korner vuruşçusu golcü olmaz; korner / serbest vuruş ortası golcüye */
        if(sim.mode==='dead'&&sim.dead&&(sim.dead.kind==='corner'||sim.dead.kind==='freekick')&&sim.dead.team===tm)return true;
        if(sim.forceAir===gp.id){if(sim.ball.high&&!sim.ball.owner){okFor(4,'HEAD',17);return true;}sim.forceAir=null;}}
      if(dn&&sim.t-(A.lsh||-9)<3.5)safe(gp);
      if(!mine)return true;
      const od2=offD();if(dn&&dG(gp)>8.5&&gl(o)<62)box(Math.max(7,od2+.6),-sg*2.8);      /* dönen topa ofsayt çizgisinden */
      const sh=z=>{const d=dG(z);return d>=(dn?9:12)&&d<=(dn?24:26)&&Math.abs(z.y-34)<15;};
      if(o===gp){prog(gx-dir*18,34-sg*6,null,0);return true;}
      if(sh(o)){safe(o);carry(o,.2);
        if(dn){if(act&&dG(gp)<Math.max(12,od2+3.5)&&gl(gp)>=od2-.3&&dG(o)>dG(gp)+3&&sim.t-(A.lsh||-9)>4&&cl()){sim.forceRebound=gp.id;okFor(4.5,null,16);A.okD=16;shoot(o);did();}}
        else if(act&&sim.t-(A.lsh||-9)>4){sim.forceParryOut=tm;shoot(o);did();}
        return true;}
      prog(gx-dir*17,34+(o.y>34?4:-4),gp,0);return true;}
    case 'ara':{
      if(A.thru&&sim.t-A.thru<8)safe(gp);
      if(!mine)return true;
      if(o===gp){if(A.thru&&sim.t-A.thru<8){carry(gp,.3);gp.keepT=sim.t+.3;okFor(1,null,22);if(dG(gp)<=16||(sim.t-(gp.gainT||sim.t)>1.8&&dG(gp)<=20)){okFor(.6,null,22);shoot(gp);}}else prog(gp.x-dir*18,gp.y*.5+17,null,0);return true;}
      const od=offD(),dq=gl(gp),ah=(gp.x-o.x)*dir;
      if(ah<6||hy(gp.x-o.x,gp.y-o.y)>38){prog(gp.x-dir*16,(gp.y+o.y)/2,gp,0);return true;}
      if(!(gp.run&&gp.run.v186&&gp.run.until>sim.t)&&dq>=od-.5&&dq<od+12&&dq>14&&sim.t-(A.rt||-9)>3){A.rt=sim.t;gp.run={v186:1,until:sim.t+2.8,x:gx-dir*Math.max(9,od-11),y:34+(gp.y>34?3:-3)};}
      if(gp.run&&gp.run.v186&&gp.run.until>sim.t&&sim.t-A.rt>.3&&settled&&dq>=od-.25&&cl()){sim.forceQuick=null;A.thru=sim.t;okFor(6,null,22);A.okD=17;pass(o,gp,false,{run:true});safe(gp);return did();}
      carry(o,.25);return true;}
    case 'uzak':case 'fk':{
      const fk=A.tip==='fk';sim.forceFK=fk&&(sim.forceFoul||(sim.mode==='dead'&&sim.dead&&sim.dead.kind==='freekick'))?gp.id:null;
      if(fk&&sim.mode==='dead'&&sim.dead&&sim.dead.kind==='freekick'&&sim.dead.team===tm&&sim.dead.taker===gp){okFor(4,'FK',30);return true;}
      if(!mine)return true;
      const d1=dG(gp),zone=d1>=19&&d1<=27&&Math.abs(gp.y-34)<13;
      if(o===gp){if(!fk)safe(gp);if(zone&&cl()){if(fk){sim.forceFoul={by:gp.id};carry(gp,.4,1);}else{okFor(.6,null,29);shoot(gp);}}
        else if(d1>27)carry(gp,.3,fk);else if(fk&&d1>=17)carry(gp,.4,1);else prog(gx-dir*30,34,null,0);return true;}
      if(gl(o)<62)box(22.5,(gp.y>34?1:-1)*3.5);
      if(sim.pass&&sim.pass.to===gp)safe(gp);
      if(zone&&settled&&lane(o,gp)>1.3&&hy(gp.x-o.x,gp.y-o.y)<36&&pdOf(gp)>2){pass(o,gp,false,null);safe(gp);return did();}
      prog(gp.x-dir*8,gp.y,gp,0);return true;}
    case 'pen':{
      sim.forceFK=gp.id;
      if(!mine)return true;
      const ib=gl(gp)<=15&&Math.abs(gp.y-34)<17;
      if(o===gp){if(ib)sim.forceFoul={by:gp.id};carry(gp,.4,1);return true;}      /* golcü ceza sahasına sürer; içeride ilk müdahale faul */
      sim.forceFoul=null;if(sim.pass&&sim.pass.to===gp)safe(gp);if(dG(gp)>12&&gl(o)<80)box(Math.max(13,offD()+.8),(gp.y>34?1:-1)*4);
      if(settled&&gl(gp)<=24&&lane(o,gp)>1.2&&hy(gp.x-o.x,gp.y-o.y)<32&&gl(gp)>=offD()-.3){pass(o,gp,false,null);safe(gp);return did();}
      prog(gp.x-dir*10,gp.y,gp,0);return true;}
  }
  return false;}
/* v183 zorla gol akışını sarar: tür etkinken dış şut zorlaması ve uzun bekleme kuralı bekler, mesafe/aralık türe göre */
if(typeof v183ForceTick==='function'){v183ForceTick=(old=>function(S,sim){const q=ABM.fq&&ABM.fq[0];const act=!!(q&&q.av&&q.av.tip!=='acik');const tk=V183.TK,ow=V183.OWN;
  const dT=!!(q&&q.av&&q.av.dT),bp0=V183.BP[0];if(act||dT)V183.TK=1e9;if(act)V183.OWN=1e9;if(act&&V186.K2)V183.BP[0]=1e9;let r;try{r=old.apply(this,arguments);}finally{V183.TK=tk;V183.OWN=ow;V183.BP[0]=bp0;}
  try{const q2=ABM.fq&&ABM.fq[0];if(q2&&ABM.fcur===q2&&sim.forceGoal!=null){if(V186.K2)v187Kurgu(sim,q2,sim.forceGoal);else v186Kurgu(sim,q2,sim.forceGoal);
    /* açık oyun yedeğinde v183'ün dış şut zorlaması da bitiriş mesafesine (dT) uyar: eskiden pencerenin sınırından (26–32 m) vurduruyordu */
    const A=q2.av;if(A&&A.tip==='acik'&&A.dT&&sim.t-q2.t0>tk&&sim.mode==='live'&&!sim.shot){const o=sim.ball.owner,gx=v183GoalX(sim,sim.forceGoal);
      if(o&&o.team===sim.forceGoal&&o.role!=='GK'&&(sim.forceBy==null||o.id===sim.forceBy)&&Math.hypot(gx-o.x,34-o.y)<(sim.forceDist||30)&&Math.abs(o.y-34)<22){try{sim._lab.doShot(o,sim.xgAt(o.x,o.y,sim.teams[o.team].dir,3),3,null);}catch(e){}}}}else if(!ABM.fq||!ABM.fq.length){sim.forceAir=null;sim.forceRebound=null;sim.forceCorner=null;sim.forceFK=null;sim.forceNoFeed=false;sim.forceHold=false;sim.forceOK=null;sim.forceOKKind=null;sim.forceOKMax=0;sim.forceFoul=null;sim.forceParryOut=null;sim.forceSafe=null;sim.forcePen=null;}}catch(e){console.warn('v186',e);}
  return r;})(v183ForceTick);
  abForceTick=function(S,sim){if(ABM.hz)return;return v183ForceTick(S,sim);};}
