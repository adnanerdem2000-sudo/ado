/* ================= v141: Pozisyon modu — modern New Star Soccer tarzı, mevkiye özel anlar, kaleci modu, canlı hoca talimatları, maç sonu not dökümü =================
   Futbolcu kariyerinde varsayılan maç modu "pozisyon": maç anlatımla akar (MR/feed), mevkine göre seçilen kısa anlar 012'deki kontrollü oyunda oynanır.
   - Mevki grupları: KL, STP (DC), BEK (DL/DR/WBL/WBR), DM, MC, OOS (AMC), KANAT (ML/MR/AML/AMR), FORVET (ST). Oyuncunun rolü G.p.rol (sihirbazda seçilir).
   - Her grubun ağırlıklı senaryo tablosu var (PZ_SCL); sıklık mevkiye, takım gücüne, skora, kondisyona ve hocanın talimatına göre değişir.
   - Kaleci (KL) anları: joystick ile açı daralt, PLONJON (a) yön + zamanlama, ÇIK (b) üstüne çık/kapat, KOŞ (c), AÇI (d) ideal yere geç;
     ortada TUT (a) / YUMRUK (d); dağıtımda PAS (b) kısa / UZUN VURUŞ (a).
     Özellik eşlemesi: def=refleks ve elle kontrol (kurtarış, tutma, plonjon hızı), hiz=çıkış hızı, fiz=hava topu erişimi,
     dri=pozisyon alma (temel erişim), pas=ayakla oyun kurma, sut=degaj/uzun vuruş.
   - Hoca talimatları (PZ_TAL) maç içinde değişir; her anda uyum ölçülür (pzJudge) → not, güven ve sonraki maçın kadrosu.
   - Kontrol ajanı (169) sözleşmesi: mgCtx(), mgActs(), mgActsFor(g), mgCardInfo(type,C), MG.S.coach. */

/* ---------- mevki rolleri ---------- */
const PZ_ROL={FW:[['ST','Santrfor']],KN:[['AMR','Sağ kanat'],['AML','Sol kanat'],['MR','Sağ açık'],['ML','Sol açık']],OS:[['MC','Merkez orta saha'],['DM','Ön libero'],['AMC','On numara']],
  DF:[['DC','Stoper'],['DR','Sağ bek'],['DL','Sol bek'],['WBR','Sağ kanat bek'],['WBL','Sol kanat bek']],KL:[['GK','Kaleci']]};
const PZ_G={ST:'FORVET',AMR:'KANAT',AML:'KANAT',MR:'KANAT',ML:'KANAT',MC:'MC',DM:'DM',AMC:'OOS',DC:'STP',DR:'BEK',DL:'BEK',WBR:'BEK',WBL:'BEK',GK:'KL'};
const PZ_GN={FORVET:'Forvet',KANAT:'Kanat',OOS:'On numara',MC:'Orta saha',DM:'Ön libero',BEK:'Bek',STP:'Stoper',KL:'Kaleci'};
function pzRol(){const p=G.p,L=PZ_ROL[p.pos]||PZ_ROL.OS;if(!p.rol||!L.some(x=>x[0]===p.rol))p.rol=L[0][0];return p.rol;}
const pzGrp=()=>PZ_G[pzRol()]||'MC';
function pzRolName(){const r=pzRol(),x=(PZ_ROL[G.p.pos]||[]).find(y=>y[0]===r);return x?x[1]:r;}
function pzOn(){try{return isPl()&&!!G.p&&(plMode()==='pozisyon'||G.p.pos==='KL');}catch(e){return false;}}
try{POSN.KL='kaleci';}catch(e){}
try{TRY_PLAN.KL=['savunma','dkorner','penalti'];}catch(e){}
const GK_KIT={shirt:'#ff8a1f',trim:'#3a1d00',pat:0,shorts:'#2a1505',socks:'#ff8a1f',num:'#2a1505'};

/* ---------- durum ---------- */
const PZ={on:false,cur:null,pre:false,zip:false,zipIn:false,fast0:false,tal:null,talAt:[],talShown:false,used:{},lastSc:null,log:[],st:null,comp:{ok:0,bad:0},chain:0,onGu:0,onGo:0,obj:[],fin:null,league:false};

/* ---------- yeni sonuç kodları ---------- */
Object.assign(RES,{
  kSave:{t:'KURTARIŞ!',adj:0.45,cls:'ok'},kCatch:{t:'KALECİ TUTTU!',adj:0.5,cls:'ok'},kPunch:{t:'YUMRUKLA UZAKLAŞTIRDI',adj:0.25,cls:'ok'},kClaim:{t:'TOPU TOPLADI',adj:0.2,cls:'ok'},
  kSmother:{t:'AYAĞINDAN ALDI!',adj:0.5,cls:'ok'},kSweep:{t:'ÇIKIŞLA UZAKLAŞTIRDI!',adj:0.35,cls:'ok'},kGoal:{t:'GOL YEDİN',adj:-0.45,opp:1,cls:'bad'},kMiss:{t:'AUT',adj:0.05},
  kOk:{t:'TEHLİKE GEÇTİ',adj:0.1,cls:'ok'},kPenSave:{t:'PENALTI KURTARDI!',adj:0.9,cls:'gold'},kPenGoal:{t:'PENALTI GOL',adj:-0.05,opp:1,cls:'bad'},kPenMiss:{t:'PENALTI DIŞARI',adj:0.1},
  kDistOk:{t:'İYİ DAĞITIM',adj:0.15,cls:'ok'},kDistLong:{t:'UZUN TOP ADAMINI BULDU',adj:0.2,cls:'ok'},kDistBad:{t:'DAĞITIMDA TOP KAYBI',adj:-0.35,cls:'bad'},kFoulPen:{t:'PENALTI!',adj:-0.4,cls:'bad'},
  buOk:{t:'PAS İSABETLİ',adj:0.12,cls:'ok'},buFwd:{t:'HATTI KIRAN PAS!',adj:0.25,cls:'ok'},bpOk:{t:'KALECİYE GÜVENLİ PAS',adj:0.1,cls:'ok'},swOk:{t:'OYUNU AÇTI!',adj:0.25,cls:'ok'},
  buSlow:{t:'TOPU TUTTUN',adj:-0.1,cls:'bad'},uzak:{t:'UZAKLAŞTIRDI',adj:0.05},presFail:{t:'PRES KIRILDI',adj:-0.05},tacFoul:{t:'TAKTİK FAUL',adj:0.3,cls:'ok'},oTrap:{t:'OFSAYT TUZAĞI!',adj:0.3,cls:'ok'}});
const PZ_NEW=new Set(['kSave','kCatch','kPunch','kClaim','kSmother','kSweep','kGoal','kMiss','kOk','kPenSave','kPenGoal','kPenMiss','kDistOk','kDistLong','kDistBad','kFoulPen','buOk','buFwd','bpOk','swOk','buSlow','uzak','presFail','tacFoul','oTrap']);
Object.assign(FEED_TXT,{
  kSave:()=>pick([meN()+' uzandı, müthiş kurtarış!',meF()+' son anda çeldi!',meFs('gen')+' refleksleri takımı kurtardı.']),kCatch:()=>pick([meF()+' topu iki eliyle kontrol etti.',meF()+' şutu tuttu, tehlike yok.']),
  kPunch:()=>meF()+' yükseldi, yumrukla uzaklaştırdı.',kClaim:()=>meF()+' topu rahatça topladı.',kSmother:()=>meF()+' çıktı, topu forvetin ayağından aldı!',
  kSweep:()=>meF()+' ceza sahasından çıktı, arkaya atılan topu uzaklaştırdı.',kGoal:()=>'Rakip golü buldu; '+meF()+' bu kez çaresiz kaldı.',kMiss:()=>'Rakibin vuruşu auta gitti.',
  kOk:()=>'Rakip atak sonuçsuz kaldı.',kPenSave:()=>meF()+' doğru köşeye uçtu: PENALTI KURTARDI!',kPenGoal:()=>'Penaltıdan gol: '+meF()+' köşeyi tutturamadı.',kPenMiss:()=>'Penaltı auta gitti!',
  kDistOk:()=>meFs('gen')+' dağıtımı arkadaşını buldu.',kDistLong:()=>meFs('gen')+' uzun vuruşu hücumcuyu buldu.',kDistBad:()=>meF()+' oyun kurarken topu kaptırdı!',kFoulPen:()=>meF()+' rakibi düşürdü: penaltı!',
  buOk:()=>meF()+' baskıdan sıyrıldı, pası arkadaşına verdi.',buFwd:()=>meFs('gen')+' hattı kıran pası takımı ileri taşıdı.',bpOk:()=>meF()+' topu güvenle kalecisine verdi.',swOk:()=>meF()+' oyunu öbür kanada açtı.',
  buSlow:()=>meF()+' topu fazla tuttu, atak yavaşladı.',uzak:()=>meF()+' tehlikeyi uzun vuruşla savuşturdu.',presFail:()=>'Rakip baskıyı kırdı, top geriye döndü.',tacFoul:()=>meF()+' taktik faulle kontrayı kesti.',
  oTrap:()=>meF()+' çizgiyi öne çekti: rakip forvet ofsayt!'});
const PZ_LBL={goal:'Gol',assist:'Asist',tmGoal:'Takım golüne katkı',tmMiss:'Pozisyon hazırladı',saved:'Şut kaleciye takıldı',wide:'İsabetsiz şut',over:'İsabetsiz şut',post:'Direk',blocked:'Şut bloklandı',
  lost:'Top kaybı',timeout:'Atak söndü',offside:'Ofsayt',fouled:'Faul kazandı',penWon:'Penaltı kazandırdı',tackle:'Top kaptı',intercept:'Pas arası',shotBlock:'Şut bloğu',defOk:'Atak durduruldu',
  oppMiss:'Rakip şutu dışarı',oppOff:'Rakip ofsayt',foul:'Faul',penConceded:'Penaltı yaptırdı (gol)',penSaved:'Penaltı yaptırdı',conceded:'Gol yenildi',gkSave:'Kaleci kurtardı',cleared:'Savunma uzaklaştırdı',
  gkClaim:'Kaleci topladı',clear:'Kafayla uzaklaştırdı',injury:'Sakatlık',kSave:'Kurtarış',kCatch:'Topu tuttu',kPunch:'Yumrukla uzaklaştırdı',kClaim:'Topu topladı',kSmother:'Bire birde kapattı',
  kSweep:'Libero çıkışı',kGoal:'Gol yedi',kMiss:'Rakip şutu dışarı',kOk:'Tehlike geçti',kPenSave:'Penaltı kurtardı',kPenGoal:'Penaltı golü',kPenMiss:'Penaltı dışarı',kDistOk:'İyi dağıtım',
  kDistLong:'Uzun top adamını buldu',kDistBad:'Dağıtımda top kaybı',kFoulPen:'Penaltıya sebep oldu',buOk:'Baskı altında isabetli pas',buFwd:'Hattı kıran pas',bpOk:'Kaleciye güvenli pas',
  swOk:'Oyunu öbür kanada açtı',buSlow:'Topu fazla tuttu',uzak:'Tehlikeyi uzaklaştırdı',presFail:'Pres kırıldı',tacFoul:'Taktik faul',oTrap:'Ofsayt tuzağı'};
const PZ_KLMAP={savunma:'g_kurtar',dkorner:'g_orta',kontra:'g_birebir',atak:'g_dagitim',drill:'g_kurtar',penalti:'g_penalti',serbest:'g_kurtar',korner:'g_orta'};

/* ---------- senaryo yardımcıları ---------- */
function pzR(S){const o=S.opps.find(e=>!e.isGK);S._K={u:S.hero.kit,o:o?o.kit:kitOf(S.C.opp)};S.mates=[];S.opps=[];}
function pzU(S,x,y,o){o=o||{};const e=mkP('us',clamp(x,0.6,67.4),y,Object.assign({kit:S._K.u,q:clamp(S.C.us.str+rnd(-8,8),20,95)},o));if(e.rx==null){e.rx=e.x;e.ry=e.y;}if(e.ox==null){e.ox=e.x-S.hero.x;e.oy=e.y-S.hero.y;}S.mates.push(e);return e;}
function pzO(S,x,y,o){const e=mkP('opp',clamp(x,0.6,67.4),y,Object.assign({kit:S._K.o},o||{}));S.opps.push(e);return e;}
function pzH(S,x,y,fx,fy){const h=S.hero;h.x=clamp(x,0.8,67.2);h.y=y;h.vx=h.vy=0;if(fx!=null){const m=Math.hypot(fx,fy)||1;h.fx=fx/m;h.fy=fy/m;}return h;}
function pzFin(S){S.all=[S.hero,...S.mates,...S.opps];if(S.gk&&S.gk!==S.hero)S.all.push(S.gk);const b=S.ball,o=b.owner;if(o){b.x=o.x+o.fx*0.45;b.y=o.y+o.fy*0.45;b.z=0;}b.px=b.x;b.py=b.y;b.pz=b.z;
  if(S.mode==='atk'){const D=S.opps.filter(d=>!d.wall&&d.role!=='idle');if(D.length)S.lineY=Math.min(...D.map(d=>d.y));}}
function pzGkStr(C){const a=C.a;return clamp(a.def*0.5+a.dri*0.2+a.fiz*0.15+a.hiz*0.15,20,99);}
function pzHeroGK(S,x,y){const h=S.hero;h.isGK=true;h.kit=GK_KIT;pzH(S,x==null?34:x,y==null?1.2:y,0,1);h.str=pzGkStr(S.C);S.gk=h;S.gkm='save';}
function pzGkDist(S){S.hero.kit=GK_KIT;S.gkm='dist';S.bu=1;S.cpUsed=1;}
/* rakibe ya da arkadaşa zamanlı aksiyonlar */
const pzFP=S=>{const f=S.fp;if(f&&!f.done&&S.live>f.at&&S.ball.owner===f.a){f.done=1;if(dist(S.hero,f.a)>1.6)oppPass(f.a,f.r);}};
const pzSH=S=>{const s=S.sh;if(s&&!s.done&&S.live>s.at&&S.ball.owner===s.a){s.done=1;oppShoot(s.a);}};
const pzGive=k=>S=>{const c=S[k];if(!c||c.done||S.ball.owner!==c.m)return;if((c.cond&&c.cond(S))||S.live>c.at){c.done=1;c.m.hold=0;tmGive(c.m);}};
function pzWing(S,yA,yB){const cs=S.cs||1,tk=S.all.find(e=>e.role==='taker')||S.opps.find(e=>e.role==='taker')||S.mates.find(e=>e.role==='taker');const x=34+cs*rnd(19,24),y=rnd(yA,yB);S.ball.x=x;S.ball.y=y;if(tk){tk.x=x+cs*0.6;tk.y=y+0.6;}}

/* ---------- senaryo tablosu ----------
   fam: atk (top bizde) · def (top rakipte; pres dahil) · set (bizim duran top/orta) · dset (rakip ortası/korneri)
   type: 012'deki temel an · st: hızlı simülasyonda sayılacak tür · tag: talimat ve koşullara göre ağırlık
   w: mevki grubuna göre ağırlık */
const PZ_SCL=[
  /* ---- forvet ---- */
  {id:'f_birebir',fam:'atk',type:'kontra',n:'Kaleciyle karşı karşıya',k:'Savunmanın arkasına sarktın',tag:'shot box run',w:{FORVET:10,KANAT:4,OOS:4},
    h:'Kaleciyle baş başasın! Açıyı daralt, kaleci çıkınca ŞUT’u kısa basıp aşırt ya da köşeye plase vur.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(2,7),rnd(21,26),0,-1);S.ball.owner=h;pzO(S,h.x+sd*1.2,h.y+rnd(2.5,3.5),{role:'chaser'});pzO(S,34-sd*rnd(5,8),h.y-rnd(4,7));
      pzU(S,34-sd*rnd(8,12),h.y+rnd(0,2),{role:'striker',rx:34-sd*rnd(3,6),ry:rnd(8,11)});S.limit=9;}},
  {id:'f_cutback',fam:'atk',type:'atak',n:'Geri pasla gelen top',k:'Kanattan çizgiye inildi',tag:'shot box',w:{FORVET:9,OOS:5,KANAT:3,MC:2},
    h:'Kanat oyuncun çizgiden geri çevirecek. Boşa çık, top gelince ilk vuruşta ŞUT.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34-sd*rnd(0,3),rnd(10.5,13),0,-1);const w=pzU(S,34+sd*rnd(15,19),rnd(3,6),{role:'wide',rx:34+sd*17,ry:5,hold:99});w.fx=-sd;w.fy=0.3;S.ball.owner=w;
      pzO(S,34+sd*3,rnd(5,7));pzO(S,34-sd*3,rnd(6,8));pzO(S,h.x+sd*0.9,h.y-1.4);pzO(S,w.x-sd*1.6,w.y+1.8);pzU(S,34-sd*rnd(8,12),rnd(9,13),{role:'striker',rx:34-sd*9,ry:10});S.limit=8;S.cb={m:w,at:rnd(0.8,1.4)};},
    t:pzGive('cb')},
  {id:'f_sirt',fam:'atk',type:'atak',n:'Sırtın kaleye dönük',k:'Topu sakla, oyunu bağla',tag:'pass',w:{FORVET:8,OOS:2},
    h:'Stoper sırtında. Topu koru, destek gelen arkadaşına PAS ver ya da KOŞ’a dokunup dön.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(0,4),rnd(19,23),0,1);S.ball.owner=h;pzO(S,h.x+rnd(-0.4,0.4),h.y-1.1);pzO(S,34-sd*5,h.y-rnd(3,5));pzO(S,34+sd*9,h.y-3);pzO(S,h.x,h.y+4.5);
      pzU(S,h.x-sd*4,h.y+6,{role:'support',ox:-sd*4,oy:6});pzU(S,34+sd*rnd(14,19),h.y-2,{role:'wide',rx:34+sd*16,ry:12});pzU(S,34-sd*12,h.y-1,{role:'striker',rx:34-sd*7,ry:10});S.limit=10;}},
  {id:'f_arakos',fam:'atk',type:'atak',n:'Ara pasına koşu',k:'Ofsayta düşmeden sız',tag:'run box',w:{FORVET:9,KANAT:6,OOS:3},
    h:'Orta saha ara pası atmak üzere. Çizgide bekle, doğru anda KOŞ ile arkaya sız. Erken koşarsan ofsayt!',
    b:(S,C,sd)=>{pzR(S);const line=rnd(16,19);pzH(S,34+sd*rnd(2,6),line+0.4,0,-1);const m=pzU(S,34-sd*rnd(2,6),rnd(30,34),{role:'support',ox:0,oy:0,hold:99});m.fy=-1;S.ball.owner=m;
      [-12,-4,4,12].forEach(dx=>pzO(S,34+dx+rnd(-1,1),line+rnd(-0.4,0.4)));pzO(S,m.x+sd*1.5,m.y-3);pzU(S,34-sd*rnd(15,20),line+2,{role:'wide',rx:34-sd*17,ry:line-4});S.limit=10;
      S.ak={m,at:3.2,cond:S2=>S2.sprint&&S2.hero.vy<-2.5};},
    t:pzGive('ak')},
  {id:'f_ceza',fam:'atk',type:'atak',n:'Ceza sahası önü',k:'Şut mu, pas mı?',tag:'shot pass',w:{FORVET:7,OOS:8,MC:6,KANAT:4,DM:2},
    h:'Ceza sahası önündesin. Boşluk varsa ŞUT, kapalıysa boştaki forvete PAS ver.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(0,5),rnd(21,25),0,-1);S.ball.owner=h;pzO(S,31,rnd(13,15));pzO(S,37,rnd(13,15));pzO(S,h.x+rnd(-1,1),h.y-rnd(2.6,3.4));pzO(S,34+sd*12,15);
      pzU(S,34-sd*rnd(9,13),rnd(14,16),{role:'striker',rx:34-sd*10,ry:12});pzU(S,34+sd*rnd(16,20),rnd(16,20),{role:'wide',rx:34+sd*18,ry:14});pzU(S,h.x-sd*5,h.y+6,{role:'support',ox:-sd*5,oy:6});S.limit=10;}},
  {id:'f_kontra',fam:'atk',type:'kontra',n:'Hızlı hücum',k:'Önün açık, sayı üstünlüğü sende',tag:'shot pass run',w:{FORVET:5,KANAT:7,OOS:4,MC:3},
    h:'Kontra! KOŞ’u basılı tutup depar at; savunmacı gelirse koşan arkadaşına PAS, kaleciyle kalırsan ŞUT.'},
  {id:'f_pres',fam:'def',type:'atak',st:'savunma',n:'Önde baskı',k:'Stoperin üstüne bas, topu kap',tag:'press',w:{FORVET:9,KANAT:5,OOS:6},
    h:'Rakip stoper geriden oyun kuruyor. MÜDAHALE ile topu kap, kapınca hemen kaleye yönel!',
    b:(S,C,sd)=>{pzR(S);const cb=pzO(S,34+sd*rnd(4,10),rnd(9,13),{fy:1});pzO(S,34-sd*8,rnd(9,12));pzO(S,34+sd*21,rnd(15,19));pzO(S,34-sd*20,rnd(16,20));pzO(S,34+sd*2,rnd(21,25));
      pzH(S,cb.x-sd*2,cb.y+rnd(5,7),0,-1);S.ball.owner=cb;pzU(S,34-sd*7,rnd(19,22),{role:'striker',rx:34-sd*5,ry:12});pzU(S,34+sd*10,rnd(26,30),{role:'support',ox:sd*10,oy:6});S.limit=12;
      S.pzInit=S2=>{startCP(cb);S2.cpLim=4.2+(1-S2.iqOpp);};}},
  {id:'f_geri',fam:'def',type:'savunma',sub:'geri',n:'Geri koş, kontrayı kes',k:'Takım arkadaşlarına yardım et',tag:'def run',w:{FORVET:5,KANAT:7,OOS:5,MC:4},
    h:'Rakip kontraya çıktı! KOŞ’u basılı tutup geri dön, doğru anda MÜDAHALE et.'},
  /* ---- kanat ---- */
  {id:'k_birebir',fam:'atk',type:'atak',n:'Bekle bire bir',k:'Geç ve ortala ya da içe kat',tag:'drb cross',w:{KANAT:10,BEK:2,FORVET:2},
    h:'Bek önünde. KOŞ’a dokunup çalımla geç, sonra kutudaki arkadaşına PAS ya da içe kat ŞUT.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(18,22),rnd(21,25),0,-1);S.ball.owner=h;pzO(S,h.x-sd*1.2,h.y-3.2);pzO(S,34+sd*3,rnd(10,12));pzO(S,34-sd*3,rnd(10,12));pzO(S,34+sd*7,rnd(18,21));
      pzU(S,34-sd*1,rnd(12,14),{role:'striker',rx:34,ry:8});pzU(S,34-sd*12,rnd(14,17),{role:'striker',rx:34-sd*8,ry:10});pzU(S,h.x-sd*6,h.y+6,{role:'support',ox:-sd*6,oy:6});S.limit=11;}},
  {id:'k_bindirme',fam:'atk',type:'atak',n:'Bek bindiriyor',k:'Kombinasyonla kanadı aş',tag:'pass cross',w:{KANAT:7},
    h:'Bekin arkandan bindiriyor. Beki kendine çek, koşu yoluna PAS’ı basılı tutarak ara pası ver.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(13,16),rnd(25,29),0,-1);S.ball.owner=h;pzO(S,h.x+sd*0.6,h.y-3.2);pzO(S,34+sd*4,rnd(12,14));pzO(S,34-sd*3,rnd(11,13));pzO(S,34+sd*1,rnd(20,23));
      const fb=pzU(S,34+sd*rnd(22,25),h.y+rnd(4,6),{role:'wide',rx:34+sd*24,ry:7});fb.runT=2.8;fb.tx=34+sd*24;fb.ty=h.y-12;fb.tsp=7.2;pzU(S,34-sd*1,rnd(12,15),{role:'striker',rx:34,ry:8});S.limit=12;}},
  {id:'k_ice',fam:'atk',type:'atak',n:'İçe kat ve vur',k:'Ters ayağına çek',tag:'shot drb',w:{KANAT:8,OOS:2},
    h:'Bek dış tarafını kapattı. İçeri sür, ŞUT’u basılı tutarken joystick’i yana iterek uzak köşeye plase vur.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(13,17),rnd(17,21),-sd*0.5,-0.85);S.ball.owner=h;pzO(S,h.x+sd*1.3,h.y-1.6);pzO(S,34+sd*5,rnd(10,12));pzO(S,34-sd*2,rnd(9,11));pzO(S,34+sd*2,rnd(18,21));
      pzU(S,34-sd*4,rnd(11,13),{role:'striker',rx:34-sd*3,ry:8});pzU(S,34-sd*16,rnd(14,18),{role:'wide',rx:34-sd*16,ry:12});S.limit=10;}},
  {id:'k_cizgi',fam:'set',type:'korner',sub:'take',st:'korner',n:'Çizgiden orta',k:'Kutudakileri bul',tag:'cross',w:{KANAT:8,BEK:6},
    h:'Çizgiye indin! Sarı halkayı arkadaşının önüne taşı, ORTA’yı basılı tut, yeşil bölgede bırak.',
    b:(S,C)=>{const cs=S.cs||1,x=34+cs*rnd(18,22),y=rnd(2.5,6);S.ball.x=x;S.ball.y=y;pzH(S,x+cs*0.7,y+0.5);}},
  {id:'k_geri',fam:'def',type:'savunma',n:'Bindiren beki takip et',k:'Kanadını boş bırakma',tag:'def run',w:{KANAT:6,BEK:5},
    h:'Rakip bek kanadından bindirdi. Geri koş, orta yapmadan önüne geç ve MÜDAHALE et.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(18,23),rnd(30,36),{role:'att',fy:-1});pzO(S,34-sd*rnd(2,6),A.y+rnd(-1,2),{role:'runner',fy:-1});pzO(S,34+sd*rnd(6,10),A.y+4,{role:'runner',fy:-1});
      pzH(S,A.x-sd*rnd(1.5,3),A.y+rnd(4,6),0,-1);pzU(S,34-sd*5,rnd(18,22),{role:'cover'});pzU(S,34+sd*4,rnd(14,18),{role:'cover'});S.ball.owner=A;S.limit=13;}},
  /* ---- on numara / orta saha / ön libero ---- */
  {id:'o_arapas',fam:'atk',type:'atak',n:'Ara pası',k:'Savunmayı tek pasla yar',tag:'pass',w:{OOS:10,MC:8,DM:3,KANAT:3},
    h:'Forvetler çizgide. Koşuya çıkan arkadaşına PAS’ı basılı tutarak ara pası ver; hat kapalıysa ŞUT dene.',
    b:(S,C,sd)=>{pzR(S);const line=rnd(15,18),h=pzH(S,34+sd*rnd(0,4),rnd(27,31),0,-1);S.ball.owner=h;[-11,-4,4,11].forEach(dx=>pzO(S,34+dx+rnd(-1,1),line+rnd(-0.5,0.5)));pzO(S,h.x+rnd(-1,1),h.y-3.6);pzO(S,34-sd*9,h.y-4);
      pzU(S,34-sd*rnd(2,5),line+0.7,{role:'striker',rx:34-sd*3,ry:line+0.6});pzU(S,34+sd*rnd(9,13),line+1,{role:'striker',rx:34+sd*10,ry:line+0.8});pzU(S,34-sd*rnd(17,21),line+3,{role:'wide',rx:34-sd*19,ry:line});S.limit=12;}},
  {id:'o_uzak',fam:'atk',type:'atak',n:'Uzaktan şut',k:'Önün boş, dene!',tag:'shot',w:{OOS:6,MC:6,DM:3},
    h:'Önünde alan var. Birkaç adım sür, ŞUT’u basılı tut; kırmızıya girmeden bırak.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(2,8),rnd(24,28),0,-1);S.ball.owner=h;pzO(S,h.x+sd*1,h.y-rnd(4.5,5.5));[-9,-3,3,9].forEach(dx=>pzO(S,34+dx,rnd(12,14)));
      pzU(S,34-sd*3,13.5,{role:'striker',rx:34-sd*3,ry:11});pzU(S,34-sd*16,16,{role:'wide',rx:34-sd*17,ry:13});S.limit=9;}},
  {id:'o_duvar',fam:'atk',type:'atak',n:'Ver-kaç',k:'Duvar pasla içeri gir',tag:'pass',w:{OOS:6,MC:4,FORVET:3},
    h:'Forvet yakınında. PAS ver, hemen KOŞ ile boşluğa gir; top geri gelince bitir.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(2,6),rnd(24,27),0,-1);S.ball.owner=h;const m=pzU(S,h.x-sd*3,h.y-5,{role:'support',ox:-sd*3,oy:-5});
      pzO(S,h.x+sd*0.5,h.y-2.4);pzO(S,m.x-sd*0.8,m.y-1.6);[-6,6].forEach(dx=>pzO(S,34+dx,rnd(12,14)));pzU(S,34-sd*12,15,{role:'striker',rx:34-sd*8,ry:11});S.limit=11;}},
  {id:'o_sirt',fam:'atk',type:'atak',n:'Dön ve çık',k:'Baskıdan sıyrıl',tag:'drb pass',w:{OOS:5,MC:4,DM:3},
    h:'Arkanda rakip var. KOŞ’a kısa dokunup dön ya da desteğe PAS verip boşa çık.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(0,4),rnd(28,32),0,1);S.ball.owner=h;pzO(S,h.x,h.y-1.0);pzO(S,h.x+sd*4,h.y-3);[-8,0,8].forEach(dx=>pzO(S,34+dx,rnd(15,17)));
      pzU(S,34-sd*6,h.y+5,{role:'support',ox:-sd*6,oy:5});pzU(S,34+sd*1,17,{role:'striker',rx:34,ry:12});pzU(S,34+sd*18,22,{role:'wide',rx:34+sd*18,ry:16});S.limit=11;}},
  {id:'o_pres',fam:'def',type:'atak',st:'savunma',n:'Pres ve pas arası',k:'Orta sahada topu kazan',tag:'press',w:{OOS:6,MC:7,DM:6},
    h:'Rakip orta sahası topla. Pas yolunu kapat, MÜDAHALE ile kap; kapınca hızlı çık.',
    b:(S,C,sd)=>{pzR(S);const dm=pzO(S,34+sd*rnd(2,8),rnd(26,31),{fy:1});pzO(S,34-sd*10,dm.y-6);pzO(S,34+sd*16,dm.y-3);pzO(S,34-sd*3,dm.y-12);pzO(S,34+sd*5,dm.y-13);
      pzH(S,dm.x-sd*2.5,dm.y+3.5,0,-1);S.ball.owner=dm;pzU(S,34-sd*6,dm.y+5,{role:'support',ox:-sd*6,oy:2});pzU(S,34+sd*2,dm.y-9,{role:'striker',rx:34,ry:14});pzU(S,34+sd*18,dm.y-6,{role:'wide',rx:34+sd*18,ry:16});S.limit=12;
      S.pzInit=S2=>{startCP(dm);S2.cpLim=3.6+(1-S2.iqOpp);};}},
  {id:'m_cevir',fam:'atk',type:'atak',n:'Baskı altında topu çevir',k:'İki rakip üstüne geliyor',tag:'pass bu safe',w:{MC:9,DM:10,OOS:2,STP:3},
    h:'Baskı geldi! Topu kaptırmadan boştaki arkadaşına PAS ver. UZUN TOP ile oyunu da değiştirebilirsin.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(0,6),rnd(40,46),0,-1);S.ball.owner=h;S.bu=1;pzO(S,h.x+sd*2,h.y-4.2);pzO(S,h.x-sd*3.5,h.y-5);pzO(S,h.x+sd*1,h.y+4.6);pzO(S,34-sd*12,h.y-6);pzO(S,34+sd*14,h.y-7);
      pzU(S,34-sd*9,h.y+8,{role:'support',ox:34-sd*9-h.x,oy:8});pzU(S,34+sd*9,h.y+9,{role:'support',ox:34+sd*9-h.x,oy:9});pzU(S,34+sd*rnd(22,26),h.y-5,{role:'wide',rx:34+sd*24,ry:h.y-8});pzU(S,34-sd*3,h.y-6,{role:'striker',rx:34-sd*3,ry:h.y-6.5});S.limit=9;}},
  {id:'m_degistir',fam:'atk',type:'atak',n:'Oyunu öbür kanada aç',k:'Bir taraf kalabalık',tag:'pass wide bu',w:{MC:7,DM:6,BEK:3},
    h:'Bu taraf kalabalık. Joystick’i boş kanada çevir ve PAS ya da UZUN TOP ile oyunu değiştir.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34-sd*rnd(8,13),rnd(36,42),0,-1);S.ball.owner=h;S.bu=1;pzO(S,h.x+sd*1.5,h.y-4);pzO(S,h.x-sd*2.5,h.y-4.8);pzO(S,h.x+sd*5,h.y-1.5);pzO(S,34,h.y-8);pzO(S,34+sd*20,h.y-12);
      pzU(S,34+sd*rnd(23,27),h.y-rnd(4,8),{role:'wide',rx:34+sd*25,ry:h.y-6});pzU(S,h.x-sd*4,h.y+7,{role:'support',ox:-sd*4,oy:7});pzU(S,34+sd*2,h.y-7,{role:'striker',rx:34+sd*2,ry:h.y-7.5});S.limit=9;}},
  {id:'m_taktik',fam:'def',type:'savunma',n:'Taktik faul kararı',k:'Kontra geliyor, sayı az',tag:'def',w:{DM:5,MC:4},
    h:'Rakip 3’e 1 kontraya çıkıyor. Topu alabilirsen al; alamıyorsan taktik faulle kes (kart riski!).',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,6),rnd(44,48),{role:'att',fy:-1});pzO(S,34-sd*14,A.y+1,{role:'runner',fy:-1});pzO(S,34+sd*15,A.y+2,{role:'runner',fy:-1});
      pzH(S,A.x+sd*1.4,A.y+1.6,0,-1);pzU(S,34,rnd(22,26),{role:'cover'});S.ball.owner=A;S.limit=11;}},
  {id:'d_pasarasi',fam:'def',type:'savunma',n:'Pas arasına gir',k:'Pas yolunu oku',tag:'def press',w:{DM:10,MC:6,STP:4},
    h:'Rakip forvete pas atacak. Pas yolunda dur, top yanına gelince MÜDAHALE ile araya gir.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(4,10),rnd(40,46),{role:'att',fy:-1}),R=pzO(S,34-sd*rnd(2,6),A.y-rnd(8,11),{role:'runner',fy:-1});pzO(S,34+sd*18,A.y-6,{role:'runner',fy:-1});
      pzH(S,(A.x+R.x)/2+rnd(-1.5,1.5),(A.y+R.y)/2+rnd(-1,1),0,1);pzU(S,34-sd*8,R.y-5,{role:'cover'});pzU(S,34+sd*6,R.y-7,{role:'cover'});S.ball.owner=A;S.limit=11;S.fp={a:A,r:R,at:rnd(1.1,1.8)};},
    t:pzFP},
  {id:'d_bekarkasi',fam:'def',type:'savunma',n:'Bekin arkasını kapat',k:'Kanattan sızan var',tag:'def run',w:{DM:6,BEK:3},
    h:'Bekimiz önde kaldı, rakip kanatçı boşlukta. Koş, kanadı kapat, ortadan önce MÜDAHALE et.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(20,25),rnd(27,32),{role:'att',fy:-1});pzO(S,34+sd*rnd(4,8),A.y-rnd(3,6),{role:'runner',fy:-1});pzO(S,34-sd*6,A.y-2,{role:'runner',fy:-1});
      pzH(S,34+sd*rnd(7,10),A.y+rnd(2,4),sd,-0.3);pzU(S,34+sd*3,rnd(16,19),{role:'cover'});pzU(S,34-sd*5,rnd(15,18),{role:'cover'});S.ball.owner=A;S.limit=12;}},
  {id:'d_blok',fam:'def',type:'savunma',n:'Şutu blokla',k:'Rakip vurmak üzere',tag:'def',w:{DM:5,STP:5},
    h:'Rakip ceza sahası önünde vuracak. Şut açısına gir; top sana çarparsa blok sayılır.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,6),rnd(19,24),{role:'att',fy:-1});pzO(S,34-sd*rnd(6,10),rnd(14,18),{role:'runner',fy:-1});
      pzH(S,A.x-sd*rnd(0.5,1.5),A.y-rnd(3,4),0,1);pzU(S,34-sd*4,rnd(10,13),{role:'cover'});S.ball.owner=A;S.limit=9;S.sh={a:A,at:rnd(1.2,2.0)};},
    t:pzSH},
  {id:'savunma',fam:'def',type:'savunma',n:'Rakip atak',k:'Önüne geç, topu al',tag:'def',w:{MC:5,DM:6,BEK:3,STP:4,OOS:2},
    h:'Rakip kalemize geliyor. Önüne geç; MÜDAHALE ayakta, KAY kayarak. PRES’i basılı tutarsan otomatik takip edersin.'},
  /* ---- bek ---- */
  {id:'b_erken',fam:'set',type:'korner',sub:'take',st:'korner',n:'Erken orta',k:'Savunma yerleşmeden ortala',tag:'cross',w:{BEK:7,KANAT:3},
    h:'Savunma geri koşuyor. Sarı halkayı forvetin önüne koy, ORTA’yı basılı tut ve yeşilde bırak.',
    b:(S,C)=>{const cs=S.cs||1,x=34+cs*rnd(20,24),y=rnd(17,24);S.ball.x=x;S.ball.y=y;pzH(S,x+cs*0.7,y+0.6);}},
  {id:'b_bindir',fam:'atk',type:'atak',n:'Bindir!',k:'Kanat oyuncun sana verecek',tag:'cross run pass',w:{BEK:9},
    h:'Kanat oyuncusunun dışından KOŞ ile bindir; topu alınca kutuya PAS ya da ortala.',
    b:(S,C,sd)=>{pzR(S);const w=pzU(S,34+sd*rnd(15,18),rnd(22,26),{role:'wide',rx:34+sd*15,ry:20,hold:99});w.fy=-1;S.ball.owner=w;const h=pzH(S,34+sd*rnd(23,26),w.y+rnd(5,7),0,-1);
      pzO(S,w.x+sd*0.3,w.y-2.6);pzO(S,34+sd*4,rnd(10,12));pzO(S,34-sd*3,rnd(10,12));pzO(S,34,rnd(19,22));pzU(S,34-sd*1,rnd(12,14),{role:'striker',rx:34,ry:8});pzU(S,34-sd*10,rnd(13,16),{role:'striker',rx:34-sd*8,ry:10});
      S.limit=12;S.ov={m:w,at:3.4,cond:S2=>S2.hero.y<w.y+1};},
    t:pzGive('ov')},
  {id:'b_tac',fam:'atk',type:'atak',n:'Taç atışı',k:'Hızlı oyuna sok',tag:'pass bu safe',w:{BEK:5,KANAT:2},
    h:'Taç sende. Joystick ile yön ver, boştaki arkadaşına PAS (kısa) ya da UZUN TOP (uzun taç).',
    b:(S,C,sd)=>{pzR(S);const x=sd>0?67.5:0.5,y=rnd(36,46),ix=-sd;pzH(S,x,y,ix,0);S.ball.owner=S.hero;S.bu=1;S.tac={x:S.hero.x,y};
      const M=[pzU(S,x+ix*5,y-5,{role:'support',ox:ix*5,oy:-5}),pzU(S,x+ix*10,y+1,{role:'support',ox:ix*10,oy:1}),pzU(S,x+ix*7,y+9,{role:'support',ox:ix*7,oy:9})];
      for(const m of M)pzO(S,m.x+rnd(-1,1),m.y-rnd(1,1.6));pzO(S,x+ix*3,y-1.5);S.limit=8;}},
  {id:'b_birebir',fam:'def',type:'savunma',n:'Kanatçıyla bire bir',k:'Geçit verme',tag:'def',w:{BEK:10,KANAT:2},
    h:'Rakip kanatçı sana geliyor. Mesafeni koru, içeri kapat; top açılınca MÜDAHALE.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(18,23),rnd(30,36),{role:'att',fy:-1});pzO(S,34-sd*2,rnd(20,24),{role:'runner',fy:-1});pzO(S,34+sd*6,A.y+3,{role:'runner',fy:-1});
      pzH(S,A.x-sd*1.5,A.y-5,0,1);pzU(S,34+sd*4,rnd(16,19),{role:'cover'});pzU(S,34-sd*4,rnd(15,18),{role:'cover'});S.ball.owner=A;S.limit=12;}},
  {id:'b_stoper',fam:'def',type:'savunma',n:'Stoperin yanını kapat',k:'İçeri kay, boşluğu doldur',tag:'def',w:{BEK:6},
    h:'Stoperimiz topa çıktı; aradaki boşluğa kay ve koşucuyu ya da topu al.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(5,9),rnd(27,32),{role:'att',fy:-1});pzO(S,34-sd*3,rnd(19,23),{role:'runner',fy:-1});
      pzH(S,34+sd*rnd(15,18),A.y-rnd(3,5),-sd,0);pzU(S,34-sd*3,rnd(16,19),{role:'cover'});pzU(S,34-sd*12,rnd(15,18),{role:'cover'});S.ball.owner=A;S.limit=12;}},
  /* ---- stoper ---- */
  {id:'s_orta',fam:'dset',type:'dkorner',n:'Ortayı uzaklaştır',k:'Kanattan orta geliyor',tag:'def',w:{STP:8,BEK:6,DM:2},
    h:'Kanattan orta geliyor. “ADAMIN” yazan forveti bırakma; top sarı halkaya düşerken KAFA ile uzaklaştır.',
    b:S=>pzWing(S,12,20)},
  {id:'s_arapas',fam:'def',type:'savunma',n:'Ara pasını kes',k:'Forvet arkaya koşacak',tag:'def press',w:{STP:9,BEK:3},
    h:'Forvet arkaya koşacak. Onunla birlikte dön; pas gelince topa ondan önce dokun.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,6),rnd(34,40),{role:'att',fy:-1}),R=pzO(S,34-sd*rnd(1,4),rnd(19,22),{role:'runner',fy:-1});pzO(S,34+sd*14,rnd(22,26),{role:'runner',fy:-1});
      pzH(S,R.x+sd*1.3,R.y-0.6,0,1);pzU(S,34+sd*8,R.y-1,{role:'cover'});pzU(S,34-sd*14,R.y-0.5,{role:'cover'});S.ball.owner=A;S.limit=11;S.fp={a:A,r:R,at:rnd(1.0,1.6)};},
    t:pzFP},
  {id:'s_birebir',fam:'def',type:'savunma',n:'Forvetle bire bir',k:'Sabırlı ol, erken dalma',tag:'def',w:{STP:9},
    h:'Forvet üstüne sürüyor. Geri geri git, kaleyi kapat; top ayağından açılınca MÜDAHALE.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,5),rnd(27,32),{role:'att',fy:-1});pzO(S,34-sd*rnd(12,16),A.y+2,{role:'runner',fy:-1});
      pzH(S,A.x+rnd(-0.5,0.5),A.y-rnd(4.5,6),0,1);pzU(S,34+sd*18,rnd(18,22),{role:'cover'});pzU(S,34-sd*18,rnd(18,22),{role:'cover'});S.ball.owner=A;S.limit=12;}},
  {id:'s_ofsayt',fam:'def',type:'savunma',n:'Ofsayt taktiği',k:'Çizgiyi birlikte öne çek',tag:'def',w:{STP:5},
    h:'Savunma çizgisini sen yönetiyorsun. Pas çıkmadan hemen önce rakibe doğru çık: forvetler ofsayta düşer. Geç kalırsan arkana kaçarlar!',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,5),rnd(38,43),{role:'att',fy:-1}),R1=pzO(S,34-sd*3,21,{role:'runner',fy:-1}),R2=pzO(S,34+sd*9,21.5,{role:'runner',fy:-1});
      pzH(S,34-sd*1,20.2,0,1);for(const x of [34+sd*8,34-sd*12,34+sd*17])pzU(S,x,20.2,{role:'cover',lineMate:1,lx:x});S.ball.owner=A;S.limit=11;S.fp={a:A,r:pick([R1,R2]),at:rnd(2.2,2.8)};},
    t:pzFP},
  {id:'s_kaleci',fam:'atk',type:'atak',n:'Kaleciye geri pas',k:'Baskı var, güvenli oyna',tag:'pass bu safe',w:{STP:9,BEK:4,DM:3},
    h:'Forvet baskı yapıyor. Kalecine (turuncu) PAS ile güvenli ver ya da boştaki arkadaşı bul. UZUN TOP: uzaklaştır.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(3,8),rnd(55,59),0,1);S.ball.owner=h;S.bu=1;pzU(S,34,65.5,{role:'gkmate',kit:GK_KIT,rx:34,ry:65.5});
      pzO(S,h.x-sd*0.6,h.y-2.8);pzO(S,34-sd*8,h.y-5);pzO(S,34+sd*16,h.y-8);pzU(S,34+sd*22,h.y-3,{role:'wide',rx:34+sd*23,ry:h.y-5});pzU(S,34-sd*9,h.y+1,{role:'support',ox:34-sd*9-h.x,oy:1});pzU(S,34,h.y-9,{role:'striker',rx:34,ry:h.y-10});S.limit=8;}},
  {id:'s_kur',fam:'atk',type:'atak',n:'Geriden oyun kur',k:'İlk pas senden',tag:'pass bu',w:{STP:9,DM:3},
    h:'Top sende, forvetler basıyor. Ön liberoya ya da beke PAS ver; hattı kıran pas ekstra puan getirir.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(4,9),rnd(50,56),0,-1);S.ball.owner=h;S.bu=1;pzU(S,34,65.5,{role:'gkmate',kit:GK_KIT,rx:34,ry:65.5});
      pzO(S,h.x-sd*1,h.y-4.6);pzO(S,34-sd*6,h.y-5.5);pzO(S,34,h.y-10);pzO(S,34+sd*18,h.y-9);pzU(S,34,h.y-8,{role:'support',ox:34-h.x,oy:-8});pzU(S,34+sd*24,h.y-4,{role:'wide',rx:34+sd*25,ry:h.y-6});pzU(S,34-sd*9,h.y+1,{role:'support',ox:34-sd*9-h.x,oy:1});S.limit=9;}},
  {id:'s_uzun',fam:'atk',type:'atak',n:'Uzun diyagonal',k:'Karşı kanat boş',tag:'pass wide bu',w:{STP:6,BEK:3,DM:3},
    h:'Karşı kanattaki arkadaşın tamamen boş. Joystick’i ona çevir, UZUN TOP ile diyagonal at.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34-sd*rnd(6,11),rnd(48,54),0,-1);S.ball.owner=h;S.bu=1;pzO(S,h.x+sd*1.5,h.y-4.4);pzO(S,h.x-sd*3,h.y-5.8);pzO(S,34,h.y-9);pzO(S,34-sd*12,h.y-12);
      pzU(S,34+sd*rnd(23,27),h.y-rnd(12,18),{role:'wide',rx:34+sd*25,ry:h.y-15});pzU(S,h.x+sd*6,h.y-7,{role:'support',ox:sd*6,oy:-7});pzU(S,h.x-sd*2,h.y+8,{role:'support',ox:-sd*2,oy:8});S.limit=9;}},
  /* ---- duran toplar ---- */
  {id:'dkorner',fam:'dset',type:'dkorner',n:'Rakip korner',k:'Adamını bırakma',tag:'def',w:{STP:6,DM:4,BEK:3,MC:3,FORVET:1},h:''},
  {id:'f_kafa',fam:'set',type:'korner',sub:'box',st:'korner',n:'Ortaya kafa',k:'Kanattan orta geliyor',tag:'box cross',w:{FORVET:8,KANAT:2,OOS:2,STP:2},
    h:'Kanattan orta geliyor. Markörden KOŞ ile sıyrıl, top sarı halkaya düşerken KAFA; joystick ile köşe seç.',
    b:S=>pzWing(S,10,17)},
  {id:'korner_box',fam:'set',type:'korner',sub:'box',n:'Korner',k:'Kafayı vur',tag:'box',w:{FORVET:4,STP:5,DM:2,MC:2,BEK:1},h:''},
  {id:'korner_take',fam:'set',type:'korner',sub:'take',n:'Korner',k:'Ortayı sen yapıyorsun',tag:'cross',w:{KANAT:4,OOS:4,MC:2,BEK:2},h:''},
  {id:'serbest',fam:'set',type:'serbest',n:'Serbest vuruş',k:'Duvarı aş',tag:'shot',w:{OOS:4,MC:3,FORVET:3,KANAT:3,BEK:1},h:''},
  {id:'penalti',fam:'set',type:'penalti',n:'Penaltı',k:'Sorumluluk sende',tag:'shot',w:{FORVET:3,OOS:2,KANAT:1},h:''},
  /* ---- kaleci ---- */
  {id:'g_kurtar',fam:'def',type:'savunma',n:'Şutu kurtar',k:'Açıyı daralt, uç!',tag:'save',w:{KL:12},
    h:'Joystick ile açıyı daralt. Şut çıkınca PLONJON (joystick yönüne). AÇI: ideal yere geç.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(2,12),rnd(17,24),{role:'att',fy:-1});pzO(S,34-sd*rnd(4,9),rnd(10,15),{role:'runner',fy:-1});
      pzU(S,A.x-sd*1.5,A.y-2.5,{role:'cover'});pzU(S,34-sd*6,rnd(8,11),{role:'cover'});pzHeroGK(S);S.ball.owner=A;S.limit=10;S.sh={a:A,at:rnd(1.4,2.4)};},
    t:pzSH},
  {id:'g_birebir',fam:'def',type:'savunma',n:'Bire bir: çık ya da bekle',k:'Forvet savunmayı geçti',tag:'save out',w:{KL:7},
    h:'Forvet tek başına geliyor. ÇIK ile üstüne git ve kapat ya da çizgide kal, şutta PLONJON.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(0,7),rnd(25,30),{role:'att',fy:-1});pzU(S,A.x+sd*2,A.y+4,{role:'cover'});pzO(S,34-sd*14,A.y+3,{role:'runner',fy:-1});pzHeroGK(S);S.ball.owner=A;S.limit=11;}},
  {id:'g_libero',fam:'def',type:'savunma',n:'Arkaya atılan top',k:'Libero kaleci ol',tag:'save out',w:{KL:5},
    h:'Savunmanın arkasına top atıldı! ÇIK ile forvetten önce topa ulaş; ceza sahası dışında elle oynayamazsın, topu uzaklaştırırsın.',
    b:(S,C,sd)=>{pzR(S);const A=pzO(S,34+sd*rnd(2,6),rnd(28,32),{role:'runner',fy:-1});pzU(S,A.x-sd*2.5,A.y+3,{role:'cover'});pzO(S,34-sd*12,rnd(30,34),{role:'runner',fy:-1});
      const P=pzO(S,34+sd*rnd(0,6),rnd(46,50),{role:'idle',fy:-1});pzHeroGK(S,34,rnd(5,7));S.ball.owner=null;S.ball.x=P.x;S.ball.y=P.y-0.5;S.limit=10;
      S.pzInit=S2=>{kick(P,34+sd*rnd(1,5),rnd(17,21),0.4,rnd(16,18),0,0.03,0.1,'pass');S2.ball.target=A;};}},
  {id:'g_orta',fam:'dset',type:'dkorner',n:'Ortayı al ya da yumrukla',k:'Ceza sahası senin',tag:'save out',w:{KL:8},
    h:'Orta geliyor. Topun düşeceği yere git: TUT ile yakala (zamanla), kalabalıksa YUMRUK ile uzaklaştır.',
    b:(S,C)=>{if(Math.random()<0.5)pzWing(S,12,18);const mine=S.myMan;S._K={u:S.hero.kit,o:(S.opps.find(e=>!e.isGK)||{}).kit||kitOf(C.opp)};
      if(mine)pzU(S,mine.x+(34-mine.x)*0.05,mine.y-0.8,{role:'mk',mk:mine});S.myMan=null;S.all=S.all.filter(e=>e!==S.gk);pzHeroGK(S,34+(S.cs||1)*0.8,0.9);}},
  {id:'g_penalti',fam:'def',type:'savunma',st:'savunma',n:'Penaltı kurtar',k:'Köşeyi seç ve uç',tag:'save',w:{KL:2},
    h:'Penaltı! Çizgide kal, atıcıyı izle. Vuruşta joystick yönüne PLONJON; erken atlarsan ters köşe yersin.',
    b:(S,C)=>{pzR(S);const T=pzO(S,34+rnd(-0.6,0.6),13.6,{role:'idle',fy:-1});for(const dx of [-10,-6,6,10])(Math.random()<0.5?pzU:pzO)(S,34+dx,rnd(18.5,20.5),{role:'idle'});
      pzHeroGK(S,34,0.4);S.ball.owner=null;S.ball.x=34;S.ball.y=11;S.pzPen={t:T,at:rnd(1.6,2.4),done:0};S.limit=99;},
    t:(S,dt)=>{const P=S.pzPen,T=P.t;if(P.done)return;if(S.live>P.at-0.7)steer(T,34,11.5,3.6,dt);if(S.live<P.at)return;P.done=1;S.kicked0=1;
      const h=S.hero,early=h.gkD&&h.gkD.dir&&S.t-h.diveAt>0.25?h.gkD.dir:0;let side=wpick([[-1,42],[0,16],[1,42]]);if(early&&Math.random()<0.5+S.iqOpp*0.3)side=-early;
      const tx=side?34+side*rnd(1.8,3.1):34+rnd(-0.6,0.6);S.ball.owner=null;S.ball.x=34;S.ball.y=11;kick(T,tx,0,rnd(0.2,1.9),rnd(19,23)+S.C.opp.str*0.03,0,0.012,0.15,'shot');S.limit=S.live+2.4;}},
  {id:'g_geripas',fam:'atk',type:'atak',st:'savunma',n:'Geri pas, baskı var',k:'Pas mı, uzaklaştır mı?',tag:'dist',w:{KL:8},
    h:'Stoper geri verdi, forvet üstüne geliyor! Boştaki arkadaşa PAS ya da UZUN VURUŞ ile uzaklaştır.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+sd*rnd(2,6),rnd(61,63),0,-1);S.ball.owner=h;pzGkDist(S);pzO(S,h.x+sd*rnd(4,5.5),h.y-rnd(5.5,7),{role:'chaser'});pzO(S,34-sd*10,h.y-8);pzO(S,34+sd*14,h.y-10);
      pzU(S,34+sd*13,h.y-2,{role:'support',ox:34+sd*13-h.x,oy:-2});pzU(S,34-sd*13,h.y-3,{role:'support',ox:34-sd*13-h.x,oy:-3});pzU(S,34+sd*25,h.y-14,{role:'wide',rx:34+sd*25,ry:h.y-15});pzU(S,34-sd*6,h.y-9,{role:'striker',rx:34-sd*6,ry:h.y-9.5});S.limit=7;}},
  {id:'g_dagitim',fam:'atk',type:'atak',st:'savunma',n:'Topu oyuna sok',k:'Hızlı dağıtım hücumu başlatır',tag:'dist',w:{KL:8},
    h:'Top elinde. Yakındaki arkadaşa PAS (elle at) ya da ileriye UZUN VURUŞ; joystick ile yön seç.',
    b:(S,C,sd)=>{pzR(S);const h=pzH(S,34+rnd(-2,2),rnd(60,63),0,-1);S.ball.owner=h;pzGkDist(S);S.pzHands=1;
      pzU(S,34+sd*24,h.y-8,{role:'wide',rx:34+sd*25,ry:h.y-9});pzU(S,34-sd*24,h.y-9,{role:'wide',rx:34-sd*25,ry:h.y-10});pzU(S,34+sd*10,h.y-3,{role:'support',ox:sd*10,oy:-3});pzU(S,34-sd*10,h.y-2,{role:'support',ox:-sd*10,oy:-2});
      pzU(S,34+sd*3,h.y-18,{role:'striker',rx:34+sd*3,ry:h.y-20});pzU(S,34-sd*18,h.y-30,{role:'striker',rx:34-sd*18,ry:h.y-32});pzO(S,34+sd*20,h.y-12);pzO(S,34-sd*6,h.y-12);pzO(S,34+sd*6,h.y-20);pzO(S,34-sd*22,h.y-24);S.limit=8;}}
];
const PZ_SC={};for(const s of PZ_SCL)PZ_SC[s.id]=s;
const PZ_N={FORVET:6,KANAT:6,OOS:6,MC:5,DM:5,BEK:5,STP:5,KL:5};
const PZ_FAM={atak:'atk',kontra:'atk',savunma:'def',dkorner:'dset',korner:'set',serbest:'set',penalti:'set'};
function pzSide(sc){const r=pzRol(),L=/L$/.test(r)?-1:/R$/.test(r)?1:0;if(!L)return Math.random()<.5?-1:1;return ['savunma','dkorner'].includes(sc.type)?-L:L;}
function pzW(s,g,o){let w=s.w[g]||0;if(!w)return 0;const T=s.tag||'',u=PZ.used[s.id]||0;if(s.id==='penalti'&&u)return 0;w*=Math.pow(0.55,u);if(PZ.lastSc===s.id)w*=0.25;
  const rel=o.rel!=null?o.rel:(MR&&MR.us&&MR.opp?(MR.us.str-MR.opp.str)/10:0),atk=s.fam==='atk'||s.fam==='set';w*=clamp(1+(atk?1:-1)*rel*0.15,0.6,1.5);
  if(!o.plan&&MR){const d=MR.gu-MR.go,late=MR.min>=65;if(late&&d>0)w*=atk?0.8:1.35;if(late&&d<0)w*=atk?1.35:0.8;if((MR.cond||100)<35&&/run|press/.test(T))w*=0.6;
    const t=PZ.tal&&PZ.tal.id,M={sut:/shot/,pres:/press/,ceza:/box/,kanat:/cross|wide/,pasli:/pass/,calim:/pass/,risk:/safe|bu/,geride:/def/,ayakta:/def/,kl_cik:/out/,kl_kisa:/dist/,kl_uzun:/dist/}[t];
    if(M&&M.test(T))w*=t==='pres'?2.2:1.6;}
  return w;}
function pzPick(fam,o,only){o=o||{};const g=pzGrp();let L=PZ_SCL.filter(s=>s.w[g]&&(!fam||s.fam===fam)&&(!only||only(s)));if(!L.length)L=PZ_SCL.filter(s=>s.w[g]&&(!only||only(s)));if(!L.length)L=PZ_SCL.filter(s=>s.w[g]);
  const it=L.map(s=>[s,pzW(s,g,o)]).filter(x=>x[1]>0);return it.length?wpick(it):L[0];}

/* ---------- hoca talimatları ---------- */
const PZ_TAL={pasli:{t:'Daha paslı oyna, topu tutma!'},sut:{t:'Daha çok şut çek!'},calim:{t:'Çalım yapma, topu çabuk ver!'},risk:{t:'Risk alma, basit oyna!'},pres:{t:'Önde baskı yap, rahat bırakma!'},
  geride:{t:'Geride kal, savunmaya yardım et!'},kanat:{t:'Kanatları kullan, ortaya oyna!'},ceza:{t:'Ceza sahasına gir!'},ayakta:{t:'Kayarak müdahale yok, ayakta kal!'},
  kl_kisa:{t:'Oyunu ayağınla kur, kısa oyna!'},kl_uzun:{t:'Uzun oyna, riske girme!'},kl_cik:{t:'Çizgide kalma, toplara çık!'}};
const PZ_TALP={FORVET:['sut','pres','ceza','pasli'],KANAT:['kanat','calim','pasli','geride','sut'],OOS:['pasli','sut','pres','calim'],MC:['pasli','risk','pres','sut'],DM:['risk','pasli','pres','ayakta'],
  BEK:['kanat','geride','risk','ayakta'],STP:['risk','ayakta','pasli'],KL:['kl_kisa','kl_uzun','kl_cik','risk']};
function pzTalPick(){const g=pzGrp();let P=(PZ_TALP[g]||PZ_TALP.MC).slice();if(MR){const d=MR.gu-MR.go,late=MR.min>=58;
    if(late&&d>0)P=P.concat(g==='KL'?['kl_uzun','risk']:['FORVET','KANAT','BEK'].includes(g)?['geride','geride']:['risk','risk']);
    if(late&&d<0)P=P.concat(g==='KL'?['kl_uzun']:['FORVET','KANAT','OOS'].includes(g)?['sut','ceza','pres']:['pasli','pres']);}
  const cur=PZ.tal&&PZ.tal.id,Q=P.filter(x=>x!==cur);const id=pick(Q.length?Q:P);return {id,t:PZ_TAL[id].t};}
function pzSay(m,first){PZ.tal=pzTalPick();PZ.talShown=true;try{feed(m,`📣 Hoca kenardan: “${esc(PZ.tal.t)}”`,'me coach');}catch(e){}pzBanner(true);if(!first)try{toast('Hoca: '+PZ.tal.t);}catch(e){}}
function pzBanner(flash){const host=$('#match');if(!host)return;let el=$('#pzCoach');if(!PZ.on||!PZ.tal){if(el)el.remove();return;}
  if(!el){el=document.createElement('div');el.id='pzCoach';el.className='pz-coach';const bd=$('#mvBoard');(bd||host.firstChild).insertAdjacentElement('afterend',el);}
  el.innerHTML=`<i>HOCA</i><span>${esc(PZ.tal.t)}</span><small>Uyum ${PZ.comp.ok}✓ ${PZ.comp.bad}✗</small>`;if(flash){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}}

/* ---------- maç hedefleri ---------- */
const PZ_OBJ={
  FORVET:[['En az 2 isabetli şut',s=>s.onT>=2],['Gol at',s=>s.goals>=1],['En fazla 1 top kaybı',s=>s.lost<=1]],
  KANAT:[['1 asist ya da kilit pas',s=>s.keyP+s.assists>=1],['1 başarılı çalım',s=>s.drbOk>=1],['Savunmaya yardım: 1 top kazan',s=>s.def>=1]],
  OOS:[['2 kilit pas / asist',s=>s.keyP+s.assists>=2],['1 isabetli şut',s=>s.onT>=1],['Pas isabeti %75+',s=>s.pAtt>=2&&s.pOk/s.pAtt>=0.75]],
  MC:[['Pas isabeti %80+ (en az 3 pas)',s=>s.pAtt>=3&&s.pOk/s.pAtt>=0.8],['2 kez top kazan',s=>s.def>=2],['En fazla 1 top kaybı',s=>s.lost<=1]],
  DM:[['3 kez top kazan / pas arası',s=>s.def>=3],['Top kaybı yok',s=>s.lost===0],['Pas isabeti %80+',s=>s.pAtt>=2&&s.pOk/s.pAtt>=0.8]],
  BEK:[['1 başarılı orta ya da kilit pas',s=>s.keyP+s.assists>=1],['2 savunma müdahalesi',s=>s.def>=2],['Kanadından gol yeme',s=>s.concMine===0]],
  STP:[['Rakip forvete gol izni verme (en fazla 1 gol)',(s,F)=>F.conc<=1],['3 savunma müdahalesi',s=>s.def>=3],['Pas hatası yapma',s=>s.lost===0]],
  KL:[['Kaleni gole kapat',(s,F)=>F.conc===0],['En az 3 kurtarış',s=>s.saves>=3],['Dağıtımda top kaybı yok',s=>s.distBad===0]]};
const pzSt0=()=>({shots:0,onT:0,goals:0,assists:0,keyP:0,pOk:0,pAtt:0,drbOk:0,def:0,lost:0,saves:0,concMine:0,distBad:0});

/* ---------- uyum değerlendirmesi ---------- */
function pzJudge(res,A){const c=res.code,T=PZ.tal&&PZ.tal.id;if(!T||c==='injury')return null;const def=A.fam==='def'||A.fam==='dset',had=A.own>0.25,shot=A.shot>0||A.set;
  const R=(v,w)=>({v,w});
  switch(T){
    case 'pasli':if(!had)return null;if(A.passOk>0&&A.drb<=1)return R(1,'Topu çabuk dağıttın');if(A.drb>=2||A.hold>3.5)return R(-1,'Topu fazla tuttun');return null;
    case 'sut':if(shot)return R(1,'Şut denedin');if(A.zone&&had)return R(-1,'Şut fırsatını geçtin');return null;
    case 'calim':if(A.drb>0)return R(-1,'Çalıma kalktın');if(A.passOk>0&&A.firstPassT!=null&&A.firstPassT<2.5)return R(1,'Topu tek-iki dokunuşla verdin');return null;
    case 'risk':if(['lost','offside','kDistBad','penConceded','penSaved','buSlow','kFoulPen'].includes(c))return R(-1,'Riskli oynadın');if(A.sl>0&&def&&c!=='tackle')return R(-1,'Gereksiz kayarak müdahale');
      if(['buOk','bpOk','uzak','kDistOk','kDistLong','clear','tackle','intercept','defOk','swOk','kClaim','kCatch'].includes(c))return R(1,'Basit ve güvenli oynadın');return null;
    case 'pres':if(A.fam!=='def')return null;if(A.tk+A.sl>0||A.pressT>1.0||A.regain||['tackle','intercept','shotBlock'].includes(c))return R(1,'Baskı yaptın');return R(-1,'Baskıya çıkmadın');
    case 'geride':if(def){if(['tackle','intercept','shotBlock','clear','defOk','oppMiss','oppOff','oTrap'].includes(c))return R(1,'Savunmaya yardım ettin');if(['conceded','foul','penConceded'].includes(c))return R(-1,'Savunmada açık verdin');return null;}
      if(c==='lost')return R(-1,'Önde top kaybettin');return null;
    case 'kanat':if(A.wide>0||A.cross)return R(1,'Oyunu kanada açtın');if(shot&&A.shotPos&&A.shotPos.y>20&&Math.abs(A.shotPos.x-34)<10)return R(-1,'Kanatları kullanmadın');return null;
    case 'ceza':if(A.box&&(shot||had))return R(1,'Ceza sahasına girdin');if(shot&&A.shotPos&&A.shotPos.y>17)return R(-1,'Ceza sahası dışından vurdun');return null;
    case 'ayakta':if(A.sl>0)return R(-1,'Kayarak müdahale ettin');if(A.tk>0&&['tackle','intercept'].includes(c))return R(1,'Ayakta kalıp topu aldın');return null;
    case 'kl_kisa':if(A.long>0)return R(-1,'Uzun vurdun');if(A.passOk>0)return R(1,'Kısa oyun kurdun');return null;
    case 'kl_uzun':if(A.long>0)return R(1,'Uzun oynadın');if(c==='kDistBad')return R(-1,'Kısa oynayıp topu kaptırdın');if(A.pass>0)return R(-1,'Kısa oynadın');return null;
    case 'kl_cik':if(A.rush>0||['kSmother','kSweep','kClaim','kCatch','kPunch'].includes(c))return R(1,'Toplara çıktın');if(A.gk&&A.fam==='dset'&&!A.catchTry)return R(-1,'Çizgide kaldın');return null;}
  return null;}

/* ---------- mod seçimi, 3B/pro devre dışı ---------- */
pl3Pref=(old=>function(){try{if(pzOn())return false;}catch(e){}return old.apply(this,arguments);})(pl3Pref);
proUsable=(old=>function(){try{if(G&&G.p&&G.p.pos==='KL')return false;}catch(e){}return old.apply(this,arguments);})(proUsable);

/* ---------- sihirbaz: rol seçimi ---------- */
newGame=(old=>function(pos){const r=old.apply(this,arguments);try{if(G&&G.p){const L=PZ_ROL[pos]||PZ_ROL.OS;G.p.rol=(SEL.rol&&L.some(x=>x[0]===SEL.rol))?SEL.rol:L[0][0];}}catch(e){}return r;})(newGame);
showStart=(old=>function(){const r=old.apply(this,arguments);try{if(W.step!=='kim'||W.prof!=='oyuncu')return r;const pf=document.querySelector('#start [data-act=selpos]');const f=pf&&pf.closest('.field');if(!f||document.querySelector('#start .pz-rolf'))return r;
    const L=PZ_ROL[SEL.pos]||[];if(!L.some(x=>x[0]===SEL.rol))SEL.rol=(L[0]||[''])[0];
    f.insertAdjacentHTML('afterend',`<div class="field pz-rolf"><span class="field-label">Rol</span><div class="chips">${L.map(([k,n])=>`<button class="chip" data-act="selrol" data-v="${k}" aria-pressed="${SEL.rol===k}">${n}<small>${DPT[k]||k}</small></button>`).join('')}</div></div>`);}catch(e){console.warn('rol',e);}return r;})(showStart);
ACTX.selrol=el=>{SEL.rol=el.dataset.v;const y=window.scrollY;showStart();window.scrollTo(0,y);};

/* ---------- maç planı: anlar mevkiye göre ---------- */
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(pzOn()&&cfg&&cfg.chances)pzPlan(cfg);}catch(e){console.warn('pozisyon planı',e);}return cfg;})(buildMatch);
function pzPlan(cfg){const g=pzGrp(),isDef=t=>t==='savunma'||t==='dkorner',o=cfg.chances,oA=o.filter(c=>!isDef(c.type)).length,oD=o.length-oA,vis=cfg.national?null:clubVision(cfg.us);
  /* yedek kaleci yalnızca ilk kaleci sakatlanırsa (nadiren) oyuna girer; yoksa maç anlatımla akar */
  if(g==='KL'&&cfg.role==='sub'){if(Math.random()<0.05){cfg.entry=rint(25,80);cfg.gkInj=1;}else{cfg.gkBench=1;cfg.entry=999;cfg.lamUs+=oA*0.2;cfg.lamOpp+=oD*0.22;cfg.chances=[];cfg.pz=1;return;}}
  const n=cfg.role==='start'?(PZ_N[g]||5)+(Math.random()<.35?1:0)+(vis==='hucum'&&['FORVET','KANAT','OOS'].includes(g)?1:0)+(vis==='savunma'&&['STP','BEK','DM','KL'].includes(g)?1:0):rint(2,3);
  const e0=cfg.entry||0,mins=[];let guard=0;while(mins.length<n&&guard++<300){const m=rint(Math.max(4,e0+3),88);if(!mins.some(x=>Math.abs(x-m)<5))mins.push(m);}mins.sort((a,b)=>a-b);
  const rel=(cfg.us.str-cfg.opp.str)/10,keep=PZ.used;PZ.used={};const lst=PZ.lastSc;PZ.lastSc=null;
  const ch=mins.map(m=>{const s=pzPick(null,{rel,plan:1});PZ.used[s.id]=(PZ.used[s.id]||0)+1;return {m,type:s.st||s.type,sc:s.id,fam:s.fam};});
  PZ.used=keep;PZ.lastSc=lst;const nA=ch.filter(c=>!isDef(c.type)).length,nD=ch.length-nA;
  cfg.lamUs=Math.max(0.15,cfg.lamUs+(oA-nA)*0.2);cfg.lamOpp=Math.max(0.15,cfg.lamOpp+(oD-nD)*(g==='KL'?0.26:0.22));cfg.chances=ch;cfg.pz=1;}

/* ---------- maç başı: ön kart, ilk talimat, hedefler ---------- */
startMatch=(old=>function(cfg){const pz=pzOn();PZ.on=false;const r=old.apply(this,arguments);if(!pz||!MR||MR.f3||MR.pro)return r;try{pzBegin(cfg);}catch(e){console.warn('pozisyon',e);PZ.on=false;}return r;})(startMatch);
function pzBegin(cfg){Object.assign(PZ,{on:true,mN:0,cur:null,pre:true,zip:false,zipIn:false,tal:null,talShown:false,used:{},lastSc:null,log:[],st:pzSt0(),comp:{ok:0,bad:0},chain:0,onGu:0,onGo:0,fin:null,
    league:!cfg.national&&/Hafta/.test(cfg.comp||''),grp:pzGrp()});
  const used=new Set();for(const c of cfg.chances||[]){const e=MR.events.find(x=>x.k==='ch'&&x.m===c.m&&x.type===c.type&&!used.has(x));if(e){used.add(e);e.sc=c.sc;e.fam=c.fam;e.re=1;}}
  const g=pzGrp();PZ.obj=(PZ_OBJ[g]||PZ_OBJ.MC).map(([t,f])=>({t,f,ok:false}));
  const st=cfg.role==='start'?0:cfg.entry||60;PZ.talAt=[rint(24,34),46,rint(60,72)].filter(m=>m>st+4);
  PZ.tal=pzTalPick();clearTimeout(MR.timer);MR.timer=0;pzPreCard(cfg);pzSkipBtn();}
function pzPreCard(cfg){const old=$('#pzPre');if(old)old.remove();const sub=cfg.role!=='start',g=pzGrp(),a=G.p.a,opp=cfg.opp||{},vis=cfg.national?null:clubVision(cfg.us);
  const gk=g==='KL'?`<p class="pz-gk">Kalecilikte özelliklerin: <b>Refleks</b> (Defans ${Math.round(a.def)}) · <b>Çıkış</b> (Hız ${Math.round(a.hiz)}) · <b>Hava topu</b> (Fizik ${Math.round(a.fiz)}) · <b>Pozisyon</b> (Dribling ${Math.round(a.dri)}) · <b>Oyun kurma</b> (Pas ${Math.round(a.pas)}) · <b>Degaj</b> (Şut ${Math.round(a.sut)})</p>`:'';
  const tac={hucum:'Bugün hücum oynuyoruz; öne çıkmaktan korkma.',savunma:'Önce kalemizi koruyacağız, sonra kontra.',genc:'Gençlere güveniyoruz; cesur ol.',sampiyon:'Kazanmak zorundayız, hata kabul etmem.'}[vis]||'Planımıza sadık kal.';
  const el=document.createElement('section');el.id='pzPre';el.className='pz-pre';
  const bench=!!cfg.gkBench;el.innerHTML=bench?`<div class="pz-pre-h"><span class="kicker">Maç öncesi · Kaleci</span><h3>Yedek kalecisin</h3><p>Bugün forma ilk kalecide. Maç anlatımla akacak; ilk kaleci sakatlanır ya da kırmızı kart görürse oyuna girersin.</p></div><button class="cta" type="button" data-act="pzGo"><span>Maçı izle</span><small>Kulübede ısınmaya hazır ol</small></button>`:`<div class="pz-pre-h"><span class="kicker">Maç öncesi · ${esc(PZ_GN[g])}</span><h3>${sub?'Yedek kulübesindesin':'İlk 11’desin'}</h3><p>${esc(pzRolName())} · ${esc(opp.name||'')} maçı${sub?' · hoca seni ikinci yarıda düşünüyor':''}</p></div>
    <p class="sub-h"><span>Hocanın hedefleri</span><span>her biri +0,15</span></p><ul class="pz-obj">${PZ.obj.map(o=>`<li>${esc(o.t)}</li>`).join('')}</ul>
    <p class="pz-tal"><i>HOCA</i> “${esc(PZ.tal.t)}” <small>${esc(tac)}</small></p>${gk}
    <p class="muted pz-note">Maç anlatımla akar; pozisyon sana gelince kontrol sende. Talimata uyarsan not ve hocanın güveni artar, uymazsan forma kaybedebilirsin.</p>
    <button class="cta" type="button" data-act="pzGo"><span>${sub?'Oyuna gireceğin ana atla':'Maça çık'}</span><small>${sub?'Isınmaya başla':'Hakem düdüğü çalmak üzere'}</small></button>`;
  const bd=$('#mvBoard');if(bd)bd.insertAdjacentElement('afterend',el);}
function pzGoStart(){if(!PZ.on||!PZ.pre||!MR)return;PZ.pre=false;const el=$('#pzPre');if(el)el.remove();
  if(MR.gkBench)feed(0,'Yedek kalecisin: maçı kulübeden izliyorsun. İlk kaleci sakatlanırsa oyuna gireceksin.','me');
  if(MR.role==='start'){pzSay(0,true);}else{PZ.zip=true;PZ.zipIn=true;PZ.fast0=!!MR.fast;MR.fast=true;}
  clearTimeout(MR.timer);MR.timer=setTimeout(mrStep,300);pzSkipBtn();}
ACTX.pzGo=()=>pzGoStart();
ACTX.pzSkip=()=>{if(!PZ.on||!MR||PZ.pre)return pzGoStart();if(PZ.zip)return;PZ.zip=true;PZ.zipIn=!onPitch();PZ.fast0=!!MR.fast;MR.fast=true;pzSkipBtn();};
function pzStopZip(){if(!PZ.zip)return;PZ.zip=false;PZ.zipIn=false;if(MR)MR.fast=PZ.fast0;try{$('#mvFast').textContent=MR&&MR.fast?'Normal hız':'Hızlandır';}catch(e){}pzSkipBtn();}
/* "Hızlandır" ön kartta maçı başlatır */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('#mvFast');if(t&&PZ.on&&PZ.pre){e.stopImmediatePropagation();e.preventDefault();pzGoStart();}},true);
function pzSkipBtn(){const c=document.querySelector('#match .mv-ctrl');if(!c)return;let b=$('#pzSkip');
  if(!b){b=document.createElement('button');b.id='pzSkip';b.className='btn';b.type='button';b.dataset.act='pzSkip';const f=$('#mvFast');if(f)f.insertAdjacentElement('afterend',b);else c.appendChild(b);}
  const show=PZ.on&&MR&&!PZ.pre&&!PZ.zip&&$('#mvStage').hidden&&$('#mvDone').hidden&&!MR.pendKnock;b.hidden=!show;
  if(show){const left=MR.events.slice(MR.ei).some(e=>e.k==='ch');b.textContent=!onPitch()&&!MR.out?'Oyuna girişe atla ⏭':MR.out||!left?'Maç sonuna atla ⏭':'Sonraki anına atla ⏭';}}

/* ---------- anlatım döngüsü: talimat zamanı, atlama ---------- */
mrStep=(old=>function(){if(!MR||!PZ.on||MR.f3||MR.pro)return old.apply(this,arguments);if(PZ.pre)return;
  const gu=MR.gu,go=MR.go,on0=onPitch();
  try{if(onPitch()&&!MR.out){if(!PZ.talShown)pzSay(MR.min);else if(PZ.talAt.length&&MR.min>=PZ.talAt[0]){PZ.talAt.shift();pzSay(MR.min);}}else if(PZ.talAt.length&&MR.min>=PZ.talAt[0])PZ.talAt.shift();}catch(e){}
  const r=old.apply(this,arguments);
  try{if(MR){if(on0&&onPitch()){PZ.onGu+=MR.gu-gu;PZ.onGo+=MR.go-go;}if(PZ.zip&&PZ.zipIn&&onPitch()){pzStopZip();if(MR.gkInj)feed(MR.min,'İlk kalecimiz sakatlandı! '+esc(meN())+' eldivenleri giydi.','me');if(!PZ.talShown)pzSay(MR.min);}pzSkipBtn();}}catch(e){}
  return r;})(mrStep);

/* ---------- an seçimi ---------- */
runChance=(old=>function(e){if(PZ.on&&MR&&e){try{pzStopZip();PZ.mN=(PZ.mN||0)+1;if(PZ.mN>12&&!e.re&&e.type!=='penalti'){MR.timer=setTimeout(mrStep,60);return;}let sc=null;
    if(e.sc&&!e.re)sc=PZ_SC[e.sc];
    else if(e.sc&&e.re)sc=pzPick(e.fam||PZ_SC[e.sc].fam);
    else if(pzGrp()==='KL')sc=pzPick(e.type==='savunma'?'def':e.type==='dkorner'?'dset':'atk');
    else if(e.type==='penalti'||e.type==='serbest')sc=PZ_SC[e.type];
    else if(e.type==='korner'||e.type==='dkorner')sc=pzPick(null,null,s=>s.type===e.type);
    else sc=pzPick(PZ_FAM[e.type]||'atk');
    if(sc){if(!e.pre&&sc.id==='g_penalti')e.pre='Ceza sahasında faul: rakip penaltı kazandı!';else if(!e.pre&&sc.id==='penalti')e.pre='Ceza sahasında faul! Hakem penaltı noktasını gösterdi.';e.sc=sc.id;e.re=0;e.type=sc.type;e.sub=sc.sub||'std';PZ.used[sc.id]=(PZ.used[sc.id]||0)+1;PZ.lastSc=sc.id;PZ.cur={sc,e};}}catch(x){console.warn('an seçimi',x);PZ.cur=null;}}
  return old.apply(this,arguments);})(runChance);

/* ---------- sahneyi kur ---------- */
function pzAct0(){return {own:0,hold:0,holdCur:0,shot:0,pass:0,thr:0,long:0,passOk:0,wide:0,drb:0,drbOk:0,tk:0,sl:0,pressT:0,zone:0,box:0,regain:0,rush:0,dive:0,catchTry:0,drop:0,firstPassT:null,kickPos:null,shotPos:null,fam:null,set:0,cross:0,gk:0,press:0};}
makeChance=(old=>function(type,C){let cur=PZ.cur;PZ.cur=null;
  if(!cur&&C&&C.pos==='KL'&&!C.pzNo&&PZ_KLMAP[type]){cur={sc:PZ_SC[PZ_KLMAP[type]]};type=cur.sc.type;}
  const S=old.call(this,type,C);
  try{S.act=pzAct0();S.act.set=type==='serbest'||type==='penalti'?1:0;S.act.fam=PZ_FAM[type]||null;
    if(cur&&cur.sc){const sc=cur.sc;S.pz=sc;if(sc.b)sc.b(S,C,pzSide(sc));pzFin(S);const T=sc.tag||'';S.act.fam=sc.fam;S.act.press=/press/.test(T)?1:0;S.act.cross=/cross/.test(T)&&S.ck==='take'?1:0;S.act.gk=S.gkm?1:0;}
    if(PZ.on&&PZ.tal)S.coach=PZ.tal.t;}catch(e){console.warn('senaryo',e);}
  return S;})(makeChance);
startMoment=(old=>function(type,C,title,done){try{pzPopHide();const h0=$('#mgHint');if(h0)h0.classList.remove('gone');}catch(e){}const r=old.apply(this,arguments);try{const S=MG.S;if(S&&S.pz){const sc=S.pz;const t=$('#mgTitle');if(t)t.textContent=String(title||'').replace(/·.*$/,'· '+sc.n);
    if(sc.h){const h=$('#mgHint');if(h){h.classList.remove('gone');h.textContent=sc.h;h.classList.remove('fade');void h.offsetWidth;h.classList.add('fade');}}mgFlash(trUp(sc.n),'',0);}}catch(e){}return r;})(startMoment);
/* 169 başlık kartı ve ayar önizlemesi için */
function mgCardInfo(type,C){const S=MG.S;if(S&&S.pz)return {t:S.pz.n,s:S.pz.k||''};return null;}

/* ---------- kontrol bağlamı (169 sözleşmesi) ---------- */
function mgCtx(){const S=MG.S;if(!S||S.phase==='end'||S.phase==='replay')return null;const b=S.ball;
  if(S.gkm==='save'&&b.owner!==S.hero)return 'gk';
  if(S.mode==='set')return 'set';if(S.mode==='def'||S.mode==='cp')return 'def';
  if(S.mode==='air')return S.ck==='def'?'def':(S.ck==='take'&&!S.kicked?'set':'atk');return 'atk';}
const pzA=(k,id,label,sub)=>id?{k,id,label,sub:sub||''}:null;
function mgActsFor(g,S){S=S||MG.S;const L=(...a)=>a.filter(Boolean);
  if(g==='gk'){if(S&&S.mode==='air')return L(pzA('a','catch','TUT','zamanla'),pzA('b','rush','ÇIK',''),pzA('c','sprint','KOŞ',''),pzA('d','punch','YUMRUK',''));
    return L(pzA('a','dive','PLONJON','yön: joystick'),pzA('b','rush','ÇIK','üstüne git'),pzA('c','sprint','KOŞ',''),pzA('d','angle','AÇI','ideal yer'));}
  if(g==='def'){if(S&&S.mode==='air')return L(pzA('a','header','KAFA','zıpla'),pzA('b','header','KAFA','uzaklaştır'),pzA('c','sprint','KOŞ',''));
    return L(pzA('a','slide','KAY','kayarak'),pzA('b','tackle','MÜDAHALE','ayakta'),pzA('c','sprint','KOŞ',''),pzA('d','press','PRES','basılı tut'));}
  if(g==='set'){if(!S)return L(pzA('a','shoot','ŞUT','basılı tut'));if(S.type==='korner'||S.ck==='take')return L(pzA('a','cross','ORTA','basılı tut'));if(S.kicked)return [];
    return L(pzA('a','shoot','ŞUT',S.type==='penalti'?'basılı tut':'basılı: falso'));}
  if(!S)return L(pzA('a','shoot','ŞUT','kısa: aşırtma'),pzA('b','pass','PAS','tut: ara pas'),pzA('c','sprint','KOŞ','dokun: çalım'));
  if(S.mode==='air')return L(pzA('a','header','KAFA','zamanla'),pzA('c','sprint','KOŞ','sıyrıl'));
  const o=S.ball.owner;
  if(o===S.hero){if(S.bu)return L(pzA('a','long',S.gkm?'UZUN VURUŞ':S.tac?'UZUN TAÇ':'UZUN TOP','basılı: güç'),pzA('b','pass',S.tac?'TAÇ AT':S.gkm?'PAS / AT':'PAS',S.tac||S.gkm?'':'tut: ara pas'),S.tac?null:pzA('c','sprint','KOŞ','dokun: çalım'));
    return L(pzA('a','shoot','ŞUT','kısa: aşırtma'),pzA('b','pass','PAS','tut: ara pas'),pzA('c','sprint','KOŞ','dokun: çalım'));}
  if(o&&o.side==='us')return L(pzA('a','shoot','ŞUT','ilk vuruş'),pzA('c','sprint','KOŞ',''));
  return L(pzA('a','shoot','ŞUT','vole'),pzA('b','pass','PAS',''),pzA('c','sprint','KOŞ',''));}
function mgActs(){const c=mgCtx();return c?mgActsFor(c,MG.S):[];}

/* ---------- eylem kaydı ---------- */
heroShoot=(old=>function(){const S=MG.S;try{if(S&&S.act){S.act.shot++;S.act.shotPos={x:S.hero.x,y:S.hero.y};}}catch(e){}return old.apply(this,arguments);})(heroShoot);
heroPass=(old=>function(through){const S=MG.S;try{if(S&&S.act){S.act.pass++;if(through)S.act.thr++;S.act.kickPos={x:S.ball.x,y:S.ball.y};if(S.act.firstPassT==null)S.act.firstPassT=S.act.own;}}catch(e){}
  const r=old.apply(this,arguments);try{const t=S&&S.ball.target;if(t&&Math.abs(t.x-34)>15)S.act.wide++;if(S&&S.ofs&&S.ofs.y>52.5)S.ofs=null;}catch(e){}return r;})(heroPass);
skillMove=(old=>function(){const S=MG.S;let nd=null,st0=0,cd0=S?S.skillCd:0;try{if(S){let m=99;for(const d of actOpps()){const q=dist(d,S.hero);if(q<m){m=q;nd=d;}}if(nd)st0=nd.stag;}}catch(e){}
  const r=old.apply(this,arguments);try{if(S&&S.act&&S.skillCd!==cd0){S.act.drb++;if(nd&&nd.stag>st0+0.2)S.act.drbOk++;}}catch(e){}return r;})(skillMove);
standTackle=(old=>function(){const S=MG.S,c0=S?S.tkCd:0;const r=old.apply(this,arguments);try{if(S&&S.act&&S.tkCd!==c0)S.act.tk++;}catch(e){}return r;})(standTackle);
slideTackle=(old=>function(){const S=MG.S,c0=S?S.tkCd:0;const r=old.apply(this,arguments);try{if(S&&S.act&&S.tkCd!==c0)S.act.sl++;}catch(e){}return r;})(slideTackle);
/* uzun top / degaj (yapı kurma anlarında 'a') */
function pzLongKick(p){const S=MG.S,b=S.ball,h=S.hero,A=S.C.a;p=clamp(p<0?0.6:p,0.2,1);S.act.long++;S.act.pass++;S.act.kickPos={x:b.x,y:b.y};
  let dx=IN.jx,dy=IN.jy,m=Math.hypot(dx,dy);if(m<0.3){dx=h.fx;dy=h.fy;if(dy>0.2){dx=0;dy=-1;}m=Math.hypot(dx,dy)||1;}dx/=m;dy/=m;
  let t=null,bs=-1e9;for(const e of actMates()){const rx=e.x-b.x,ry=e.y-b.y,d=Math.hypot(rx,ry);if(d<11||d>55)continue;const cs=(rx*dx+ry*dy)/d;if(cs<0.35)continue;const sc=cs*6+d*0.1+Math.min(4,minDist(e,actOpps()))*0.8;if(sc>bs){bs=sc;t=e;}}
  const d=t?dist(t,b):26+p*22,tx=t?t.x+t.vx*0.8:clamp(b.x+dx*d,2,66),ty=t?t.y+t.vy*0.8:b.y+dy*d,v=clamp(14+d*0.3,16,28)*(0.9+A.sut*0.002);
  kick(h,tx,ty,t?0.9:2.6,v,0,0.02+(100-A.sut)*0.0006,t?0.3:0.6,t?'pass':'clear');if(t)b.target=t;else S.pzClr=S.t+0.9;mgFlash(S.gkm?'UZUN VURUŞ':'UZUN TOP','',500);vib(20);}

/* ---------- kaleci: kontrol, hareket, kurtarış ---------- */
onDown=(old=>function(k){const S=MG.S;if(S&&S.gkm==='save'&&mgCtx()==='gk'){S.dn[k]=true;if(k==='c')S.cDown=S.t;pzGkBtn(k);return;}return old.apply(this,arguments);})(onDown);
onUp=(old=>function(k,hold){const S=MG.S;if(S&&S.gkm==='save'&&mgCtx()==='gk'){S.dn[k]=false;return;}
  if(S&&S.bu&&k==='a'&&S.ball.owner===S.hero&&S.mode==='atk'){if(!S.dn[k])return;S.dn[k]=false;const p=S.charge;S.charge=-1;return pzLongKick(p);}
  return old.apply(this,arguments);})(onUp);
function pzGkBtn(k){const S=MG.S,h=S.hero,A=S.act;if(h.down>0&&!h.gkD)return;
  if(S.mode==='air'){if(k==='a'||k==='d'){S.gkAct={k:k==='a'?'catch':'punch',t:S.t};A.catchTry=1;if(h.jumpT==null)h.jumpT=S.t;return;}if(k==='b'){h.rush=true;h.rushT=1.0;A.rush++;}return;}
  if(k==='a')return pzDive();if(k==='b'){h.rush=true;h.rushT=0.9;A.rush++;return;}if(k==='d'){h.auto=1.2;}}
function pzDive(){const S=MG.S,h=S.hero,C=S.C,b=S.ball;if(h.gkD)return;let dir=Math.abs(IN.jx)>0.25?Math.sign(IN.jx):0;
  const autoD=!dir;if(autoD&&S.pzPen)dir=0;else if(!dir){let px=b.x;if(!b.owner&&b.kind==='shot'){for(const q of predictPath())if(q.y<=h.y){px=q.x;break;}}const dx=px-h.x;dir=Math.abs(dx)<0.45?0:Math.sign(dx);}
  S.act.dive++;h.diveAt=S.t;h.rush=false;
  if(!dir){h.jumpT=S.t;h.gkD={t:0,dir:0,v:0,vy:0,dur:0.3,lie:0.12};return;}
  h.gkD={t:0,dir,v:(5.0+C.a.def*0.035)*(autoD?0.8:1),vy:IN.jy<-0.4?-1.2:IN.jy>0.4?1.5:0,dur:0.36+C.a.def*0.0008,lie:0.65};h.dive={tx:h.x+dir*2.6,x0:h.x,t:0};h.diving=true;vib(15);}
function gkMove(dt){const S=MG.S,C=S.C,h=S.hero,b=S.ball;
  if(h.gkD){const d=h.gkD;d.t+=dt;if(h.dive)h.dive.t=d.t;
    if(d.t<d.dur){const v=d.v*(1-d.t/d.dur*0.35);h.x=clamp(h.x+d.dir*v*dt,GL-2.4,GR+2.4);h.y=clamp(h.y+d.vy*dt,0.15,40);h.vx=d.dir*v;h.vy=d.vy;}
    else if(d.t<d.dur+d.lie){h.vx=h.vy=0;}else{h.gkD=null;h.dive=null;h.diving=false;}h.ph+=dt*4;return;}
  if(h.down>0){h.down-=dt;drift(h,dt,0.01);return;}if(h.stag>0){h.stag-=dt;drift(h,dt,0.2);return;}
  if(S.sprint)S.stam=Math.max(0,S.stam-dt/(2.4+C.a.fiz*0.022));else S.stam=Math.min(stamCap(S.cond),S.stam+dt/4.2);
  const max=(3.4+C.a.hiz*0.032)*(S.sprint?1.3:1)*(h.rush?1.35:1)*condSpeed(S.cond);let jx=IN.jx,jy=IN.jy;
  const idle=!h.rush&&!(h.auto>0)&&Math.hypot(IN.jx,IN.jy)<0.2;
  if(h.rush||h.auto>0||idle){let tx,ty;if(h.rush){const T=S.mode==='air'&&S.drop?S.drop:(b.owner||b);tx=T.x;ty=T.y;h.rushT-=dt;if(h.rushT<=0)h.rush=false;}
    else{if(h.auto>0)h.auto-=dt;const dd=Math.hypot(b.x-34,b.y)||1,k=clamp(0.7+dd*0.065,0.7,3.6);tx=34+(b.x-34)/dd*k;ty=Math.max(0.4,b.y/dd*k);}
    const dx=tx-h.x,dy=ty-h.y,dl=Math.hypot(dx,dy),kk=idle?0.6:1;if(dl>0.15){jx=dx/dl*Math.min(1,dl)*kk;jy=dy/dl*Math.min(1,dl)*kk;}else{jx=jy=0;}}
  const k=1-Math.pow(0.002,dt);h.vx+=(jx*max-h.vx)*k;h.vy+=(jy*max-h.vy)*k;h.x=clamp(h.x+h.vx*dt,0.3,67.7);h.y=clamp(h.y+h.vy*dt,0.15,40);
  if(S.pzPen&&!S.kicked0)h.y=Math.min(h.y,0.8);
  faceAnim(h,dt);{const dx=b.x-h.x,dy=b.y-h.y,dl=Math.hypot(dx,dy);if(dl>0.3&&Math.hypot(h.vx,h.vy)<2.5){h.fx=dx/dl;h.fy=dy/dl;}}
  const o=b.owner;
  if(o&&o.side==='opp'&&dist(h,b)<1.0&&S.t>(h.smT||0)&&b.z<0.6){h.smT=S.t+0.6;const p=clamp(0.3+C.a.hiz*0.004+C.a.def*0.003-C.opp.str*0.003+(h.rush?0.12:0),0.12,0.85);
    if(Math.random()<p){b.owner=null;b.held=h;vib(30);return endChance('kSmother');}
    if(h.rush&&Math.random()<0.28){const inBox=b.y<16.5&&Math.abs(b.x-34)<20.16;o.stag=0.8;h.down=0.7;vib(50);return inBox?endChance('kFoulPen',{card:Math.random()<0.3?'Y':null}):endChance('foul',{card:Math.random()<0.4?'Y':null});}
    h.down=0.6;mgFlash('ÇALIMI YEDİN','bad',600);return;}
  if(!o&&!b.held&&b.z<2.3&&dist(h,b)<1.05&&!(b.kind==='shot'&&Math.hypot(b.vx,b.vy)>9)&&!(b.last===h&&S.t-b.lastT<0.4)){
    if(h.y>16.5||Math.abs(h.x-34)>20.16){kick(h,clamp(b.x+rnd(-12,12),3,65),b.y+rnd(18,26),2.5,rnd(16,19),0,0.15,0.5,'clear');return endChance('kSweep');}
    b.held=h;b.owner=null;return endChance(b.kind==='cross'?'kCatch':'kClaim');}}
moveMe=(old=>function(dt){const S=MG.S;if(S&&S.gkm==='save'&&S.ball.owner!==S.hero)return gkMove(dt);
  if(S&&S.tac&&S.ball.owner===S.hero){const h=S.hero;h.vx=h.vy=0;h.x=S.tac.x;h.y=S.tac.y;const m=Math.hypot(IN.jx,IN.jy);if(m>0.3){h.fx=IN.jx/m;h.fy=IN.jy/m;}return;}
  return old.apply(this,arguments);})(moveMe);
gkAI=(old=>function(g){if(g&&g.isC)return;return old.apply(this,arguments);})(gkAI);
gkAir=(old=>function(g){if(g&&g.isC)return;return old.apply(this,arguments);})(gkAir);
function pzGkShot(){const S=MG.S,b=S.ball,h=S.hero,C=S.C;if(b.owner||b.held||b.kind!=='shot'||b.gkChecked||!b.last||b.last.side==='us')return;if(!(b.py>h.y&&b.y<=h.y))return;b.gkChecked=true;
  const f=(b.py-h.y)/((b.py-b.y)||1),cx=b.px+(b.x-b.px)*f,cz=b.pz+(b.z-b.pz)*f,dx=Math.abs(cx-h.x),sp=Math.hypot(b.vx,b.vy),A=C.a,dv=!!(h.gkD&&h.gkD.dir),lying=dv&&h.gkD.t>=h.gkD.dur;
  const tt=b.y/Math.max(1,-b.vy),gx=b.x+b.vx*tt,onT=gx>GL-0.4&&gx<GR+0.4&&cz<GH+0.35;if(!onT&&!dv)return;
  const near=Math.hypot(b.px-34,b.py)<11&&!S.pzPen;let rx=0.55+A.dri*0.003+(dv?0.55+A.def*0.004:0)+(h.jumpT!=null?0.1:0)+(near?0.55:0),rz=dv?(lying?0.8:1.7+A.fiz*0.006):(1.95+A.fiz*0.004+(h.jumpT!=null?0.35:0));const auto=!dv&&!h.gkD&&h.down<=0;if(auto){rx+=0.4+A.def*0.004;rz+=0.1;}if(h.down>0&&!dv){rx=0.6;rz=0.6;}
  if(dx<rx&&cz<rz){let p=0.66+A.def*0.0035-(sp-22)*0.015-(dx>rx*0.75?0.1:0)+(dv&&!lying&&Math.abs(S.t-h.diveAt-0.25)<0.2?0.12:0)-(S.pzPen?0.08:0);if(auto&&dx>1.0)p*=0.75;p=clamp(p,0.2,0.96);
    if(Math.random()<p){if(sp<20.5&&dx<0.55+A.def*0.002&&cz<1.9&&Math.random()<0.4+A.def*0.004){b.held=h;b.owner=null;vib(30);return endChance(S.pzPen?'kPenSave':'kCatch');}
      b.vy=Math.abs(b.vy)*0.3+2;b.vx=(cx<h.x?-1:1)*rnd(3,7);b.vz=rnd(1.5,3.5);b.om=0;b.kind='loose';b.last=h;b.lastT=S.t;vib(30);return endChance(S.pzPen?'kPenSave':'kSave');}
    b.vx*=0.85;b.vy*=0.85;mgFlash('DOKUNDU AMA…','bad',500);}}
checkBall=(old=>function(){const S=MG.S;if(S&&S.gkm==='save'&&S.phase==='play'&&S.mode!=='cp'){pzGkShot();if(MG.S!==S||S.phase!=='play')return;}return old.apply(this,arguments);})(checkBall);
function pzGkAir(){const S=MG.S,b=S.ball,h=S.hero,A=S.C.a,g=S.gkAct;if(b.owner||b.held||!g||S.t-g.t>0.6)return false;
  const dh=Math.hypot(h.x-b.x,h.y-b.y),reach=2.55+A.fiz*0.006;if(dh>1.45||b.z>reach||b.z<0.2)return false;
  const crowd=S.all.filter(e=>!e.isGK&&e.side==='opp'&&e.role!=='idle'&&Math.hypot(e.x-b.x,e.y-b.y)<1.4).length;S.gkAct=null;
  if(g.k==='catch'){if(Math.random()<clamp(0.5+A.fiz*0.003+A.def*0.003-crowd*0.12-(dh>1.0?0.1:0),0.2,0.95)){b.held=h;b.owner=null;endChance('kCatch');return true;}
    deflect(b,0.3);b.kind='loose';b.last=h;b.lastT=S.t;S.act.drop=1;mgFlash('TOPU KAÇIRDI!','bad',700);return true;}
  if(Math.random()<clamp(0.68+A.fiz*0.003-crowd*0.08,0.3,0.97)){kickClear(h);endChance('kPunch');return true;}
  deflect(b,0.4);b.kind='loose';b.last=h;b.lastT=S.t;mgFlash('YUMRUK BOŞA','bad',600);return true;}
airCheck=(old=>function(){const S=MG.S;if(S&&S.gkm==='save'&&S.phase==='play'&&S.kicked&&pzGkAir())return;return old.apply(this,arguments);})(airCheck);
/* yardımcı roller: kalecimiz (geri pas hedefi) ve ofsayt çizgisi */
mateAtkAI=(old=>function(t,dt){if(t.role==='gkmate'){if(MG.S.ball.owner===t||busy(t,dt)){if(MG.S.ball.owner===t)drift(t,dt);return;}steer(t,t.rx,t.ry,3.2,dt);return;}return old.apply(this,arguments);})(mateAtkAI);
coverAI=(old=>function(t,dt){const S=MG.S;if(t.role==='idle'){drift(t,dt);return;}if(t.lineMate&&S&&S.fp&&!S.fp.done){if(busy(t,dt))return;steer(t,t.lx,Math.max(3,S.hero.y),4.6+S.C.us.str*0.022,dt);return;}return old.apply(this,arguments);})(coverAI);

/* ---------- her kare: senaryo zamanlaması, eylem takibi, tamamlanan pas ---------- */
mgStep=(old=>function(dt){const S=MG.S;
  if(S&&S.phase==='play'&&!S._init){S._init=1;try{if(S.pzInit)S.pzInit(S);}catch(e){console.warn(e);}}
  if(S&&S.gkm==='save'&&S.phase==='play'&&typeof slowWant!=='function'){const b=S.ball;if(!b.owner&&!b.held&&b.kind==='shot'&&b.vy<-3&&b.y>S.hero.y-0.5&&b.last&&b.last.side==='opp')dt*=0.5;}
  const r=old.call(this,dt);if(S&&MG.S===S&&S.phase==='play'&&S.act){try{pzTick(S,dt);}catch(e){console.warn('pozisyon an',e);}}
  try{if(S&&MG.S===S&&!S._hintOff&&(S.t>3.9||(S.phase==='play'&&(IN.btn.a||IN.btn.b||IN.btn.c||IN.btn.d||Math.hypot(IN.jx,IN.jy)>0.3)))){S._hintOff=1;const h=$('#mgHint');if(h)h.classList.add('gone');}
    const cc=$('#mgCoach');if(cc&&S)cc.classList.toggle('wait',!S._hintOff);}catch(e){}
  return r;})(mgStep);
function pzTick(S,dt){const b=S.ball,h=S.hero,A=S.act;
  if(b.owner===h){A.own+=dt;S.hadBall=true;A.holdCur+=dt;if(A.holdCur>A.hold)A.hold=A.holdCur;if(h.y<25&&Math.abs(h.x-34)<16)A.zone=1;if(h.y<16.5&&Math.abs(h.x-34)<20.16)A.box=1;}else A.holdCur=0;
  if((S.mode==='def'||S.mode==='cp')&&!S.gkm){const o=b.owner;if(o&&o.side==='opp'&&dist(h,o)<2.2)A.pressT+=dt;}
  const o=b.owner;if(o!==S._po){const prev=S._po;S._po=o;
    if(o&&o!==h&&o.side==='us'&&b.last===h&&!prev){A.passOk++;const kp=A.kickPos||{x:h.x,y:h.y},d=Math.hypot(o.x-kp.x,o.y-kp.y);if(Math.abs(o.x-34)>15)A.wide++;
      if(S.gkm==='dist')return endChance(A.long>0&&d>20?'kDistLong':'kDistOk');
      if(S.bu)return endChance(o.role==='gkmate'?'bpOk':d>22?'swOk':o.y<kp.y-8?'buFwd':'buOk');}
    if(o===h&&prev&&prev.side==='opp')A.regain=1;}
  if((S.tac||S.pzHands)&&b.owner===h){const R0=S.tac?2.2:4;for(const e of S.opps){const d=dist(e,h);if(d<R0&&d>0.01){e.x=h.x+(e.x-h.x)/d*R0;e.y=h.y+(e.y-h.y)/d*R0;e.vx*=0.3;e.vy*=0.3;}}}else if(S.pzHands&&b.owner!==h)S.pzHands=0;
  if(S.pzClr&&S.t>S.pzClr&&!b.owner)return endChance('uzak');
  if(S.pz&&S.pz.t)S.pz.t(S,dt);
  if(S.gkm==='save'&&b.kind==='shot'&&!b.owner&&b.last&&b.last.side==='opp'&&!S._shotF){S._shotF=1;mgFlash('ŞUT!','bad',420);}
  /* kaleci yardımı: ortaya hiç girdi yoksa yakın düşen topu kendisi almaya çalışır (yarı yardımlı kaleci) */
  if(S.gkm==='save'&&S.mode==='air'&&S.kicked&&b.kind==='cross'&&S.drop&&!S.gkAct){if(S._ac==null)S._ac=S.drop.y<6&&Math.abs(S.drop.x-34)<7&&Math.random()<0.45;
    if(S._ac&&!A.catchTry&&Math.hypot(h.x-b.x,h.y-b.y)<1.5&&b.z<2.7)S.gkAct={k:'catch',t:S.t};}}

/* ---------- sonuç kodlarının mevkiye/senaryoya göre yorumu ---------- */
function pzMap(S,code){const id=S.pz&&S.pz.id;
  if(S.gkm==='save'){if(S.pzPen)return {conceded:'kPenGoal',gkSave:'kPenSave',oppMiss:'kPenMiss',defOk:'kPenMiss',kSave:'kPenSave',kCatch:'kPenSave'}[code]||code;
    return {conceded:'kGoal',gkSave:'kSave',oppMiss:'kMiss',defOk:'kOk',tackle:'kSmother',intercept:'kClaim',clear:'kClaim',shotBlock:'kOk',penConceded:'kFoulPen',penSaved:'kFoulPen'}[code]||code;}
  if(S.gkm==='dist')return {lost:'kDistBad',timeout:'buSlow',offside:'kDistBad'}[code]||code;
  if(S.bu&&code==='timeout')return 'buSlow';
  if(S.act&&S.act.press&&code==='lost'&&!S.hadBall)return 'presFail';
  if(id==='m_taktik'&&code==='foul')return 'tacFoul';
  if(id==='s_ofsayt'&&code==='oppOff')return 'oTrap';
  return code;}
endChance=(old=>function(code,extra){const S=MG.S;try{if(S&&S.act&&S.phase!=='end'&&S.phase!=='replay')code=pzMap(S,code);}catch(e){console.warn(e);}
  const r=old.call(this,code,extra);
  try{if(S&&S.res&&S.act&&!S.res.pzAct){S.res.pzAct=Object.assign({},S.act);S.res.pzId=S.pz?S.pz.id:null;if(PZ_NEW.has(S.res.code)&&S.res.tr==null){const c=RES[S.res.code].cls;S.res.tr=c==='gold'||c==='ok'?1:c==='bad'?0.15:0.55;}}}catch(e){}
  return r;})(endChance);

/* ---------- an sonucu: not olayları, uyum, zincir ---------- */
const pzFmt=v=>(v>0?'+':v<0?'−':'±')+dec(Math.abs(v),Math.abs(Math.round(v*100))%10?2:1);
applyChance=(old=>function(res,m){if(!MR||!PZ.on||!res)return old.apply(this,arguments);
  const R=RES[res.code]||{adj:0},A=res.pzAct||pzAct0(),ev=[],sc=res.pzId&&PZ_SC[res.pzId];let bonus=0;const add=(t,v)=>{ev.push({t,v});bonus+=v;};
  ev.push({t:PZ_LBL[res.code]||R.t,v:R.adj});if(res.bonus)ev.push({t:'Topu geri kazandı',v:res.bonus});if(res.code==='tmMiss'&&res.fromMe)ev.push({t:'Kilit pas',v:0.1});
  try{if(res.code==='saved')add('İsabetli şut',0.15);
    if(A.passOk&&!['buOk','buFwd','bpOk','swOk','kDistOk','kDistLong','assist'].includes(res.code))add(A.passOk>1?`${Math.min(2,A.passOk)} isabetli pas`:'İsabetli pas',Math.min(2,A.passOk)*0.06);
    if(A.drbOk)add('Başarılı çalım',0.08*Math.min(2,A.drbOk));if(A.drop)add('Topu elinden kaçırdı',-0.2);
    const j=pzJudge(res,A);if(j){add(`${j.v>0?'Talimata uydu':'Talimatı dinlemedi'}: ${j.w.toLowerCase()}`,j.v>0?0.1:-0.15);if(j.v>0)PZ.comp.ok++;else PZ.comp.bad++;}}catch(e){console.warn(e);}
  res.bonus=(res.bonus||0)+bonus;const yc0=MR.yc,rc0=MR.rc;
  const r=old.call(this,res,m);
  try{if(MR.yc>yc0)ev.push({t:MR.rc>rc0?'İkinci sarıdan kırmızı':'Sarı kart',v:MR.rc>rc0?-1.3:-0.3});else if(MR.rc>rc0)ev.push({t:'Kırmızı kart',v:-1});
    if(PZ_NEW.has(res.code)){const c=R.cls;MR.mom=clamp((MR.mom||0)+(c==='ok'||c==='gold'?1:c==='bad'?-1:0),-3,3);renderBoard();}
    pzStats(res,A);pzChain(res,m);PZ.log.push({m,n:sc?sc.n:(CH_NAME[res.type]||'An'),ev});pzPop(ev,sc?sc.n:'');pzBanner(false);pzSkipBtn();}catch(e){console.warn('pozisyon sonuç',e);}
  return r;})(applyChance);
function pzStats(res,A){const s=PZ.st,c=res.code;s.shots+=A.shot+(A.set?1:0);if(c==='goal'||c==='saved')s.onT++;if(c==='goal')s.goals++;if(c==='assist')s.assists++;
  if((c==='tmMiss'&&res.fromMe)||c==='buFwd'||c==='swOk'||(A.cross&&['tmGoal','tmMiss'].includes(c)))s.keyP++;
  s.pOk+=A.passOk;s.pAtt+=A.pass+(A.cross?1:0);s.drbOk+=A.drbOk;if(['tackle','intercept','shotBlock','clear','oTrap','tacFoul','kSmother','kSweep'].includes(c))s.def++;
  if(['lost','kDistBad'].includes(c))s.lost++;if(['kSave','kCatch','kPunch','kPenSave','kSmother'].includes(c))s.saves++;if(RES[c]&&RES[c].opp)s.concMine++;if(c==='kDistBad')s.distBad++;}
function pzChain(res,m){if(!MR||MR.out||PZ.chain>=4||m>=89)return;const c=res.code;let nx=null;
  if(c==='kDistBad')nx=['g_kurtar','Rakip topu kaptı, kaleye geliyor!'];else if(c==='kFoulPen')nx=['g_penalti','Hakem penaltı noktasını gösterdi!'];
  else if(c==='kSave'&&Math.random()<0.3)nx=['g_orta','Top kornere çıktı.'];else if(c==='kPunch'&&Math.random()<0.25)nx=['g_kurtar','Uzaklaşan top yeniden rakipte!'];
  else if(['buFwd','swOk','kDistLong'].includes(c)&&Math.random()<0.2&&pzGrp()!=='KL'){const s=pzPick('atk',null,x=>!/bu/.test(x.tag||''));if(s)nx=[s.id,'Pas sonrası atak gelişiyor, top yeniden sende!'];}
  if(!nx||!PZ_SC[nx[0]])return;const sc=PZ_SC[nx[0]];PZ.chain++;MR.events.splice(MR.ei,0,{m,k:'ch',type:sc.type,sc:sc.id,fam:sc.fam,pre:nx[1]});}
function pzPop(ev,title){const host=$('#match');if(!host||!ev.length)return;let el=$('#pzPop');if(!el){el=document.createElement('div');el.id='pzPop';el.className='pz-pop';host.appendChild(el);}
  const sum=ev.reduce((a,x)=>a+x.v,0);el.innerHTML=`<b>${esc(title||'An')}<em class="${sum>0.001?'p':sum<-0.001?'n':''}">${pzFmt(sum)}</em></b><ul>${ev.map(x=>`<li class="${x.v>0.001?'p':x.v<-0.001?'n':''}"><span>${esc(x.t)}</span><i>${pzFmt(x.v)}</i></li>`).join('')}</ul>`;
  el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(PZ.popT);PZ.popT=setTimeout(()=>el.classList.remove('show'),2900);}

/* ---------- maç sonu: not, döküm, hedefler, hocanın kararı ---------- */
mrFinish=(old=>function(){if(!MR||!PZ.on||MR.f3||MR.pro)return old.apply(this,arguments);
  try{pzFinal();}catch(e){console.warn('pozisyon sonu',e);}const onEnd=MR.onEnd;
  MR.onEnd=res=>{try{if(PZ.fin&&res&&res.played){res.rating=PZ.fin.rating;res.pz=PZ.fin;}}catch(e){}PZ.on=false;return onEnd(res);};
  const r=old.apply(this,arguments);try{pzStopZip();pzFT();}catch(e){console.warn('pozisyon sonu',e);}return r;})(mrFinish);
function pzFinal(){const g=pzGrp(),played=MR.role==='start'||(MR.entry&&MR.events.some(e=>e.k==='in')&&MR.end>=MR.entry&&!(MR.out&&MR.outMin&&MR.outMin<MR.entry));
  const startMin=MR.role==='start'?0:MR.entry,mins=Math.max(1,(MR.outMin||90)-startMin),win=MR.gu>MR.go,draw=MR.gu===MR.go,s=PZ.st,F={conc:PZ.onGo+s.concMine};
  const end=[],add=(t,v)=>{end.push({t,v});MR.adj+=v;};
  if(played){if(mins>=60&&F.conc===0){const v={KL:0.4,STP:0.25,BEK:0.25,DM:0.1}[g];if(v)add('Gol yemedik (sahadayken)',v);}
    if(PZ.onGo>0){const v={KL:-0.12,STP:-0.06,BEK:-0.06}[g];if(v)add(`Anlatımda yenilen ${PZ.onGo} gol`,v*PZ.onGo);}
    if(PZ.onGu>0&&['FORVET','KANAT','OOS'].includes(g))add(`Takımın ${PZ.onGu} golünde oyun içi katkı`,0.04*PZ.onGu);
    for(const o of PZ.obj){o.ok=!!o.f(s,F);if(o.ok)add('Hedef: '+o.t,0.15);}}
  const res=win?0.35:draw?0.05:-0.25,noise=gauss()*0.1+(mins<25?-0.1:0);let rt=6.0+res+MR.adj+noise;rt=Math.round(clamp(rt,1,10)*10)/10;
  const okN=PZ.obj.filter(o=>o.ok).length,cN=PZ.comp.ok+PZ.comp.bad,cR=cN?PZ.comp.ok/cN:1;
  const trustD=clamp((PZ.comp.ok-PZ.comp.bad)*1.2,-5,4)+okN*0.8-(okN===0&&played?1:0);
  const comment=!played?'Bugün sana süre veremedim. Antrenmanda kendini göster.':
    rt>=8?(cR>=0.6?'Bugün fark yarattın, söylediklerimi de sahaya yansıttın. Bravo!':'Harika oynadın ama talimatlarımı dinlemedin; bir dahakine takımla birlikte oyna.'):
    rt>=6.8?(cR>=0.5?'İyi maçtı, istediğim gibi oynadın.':'Fena değildi ama kenardan söylediklerimi duymadın sanki.'):
    rt>=6?(cR>=0.5?'Ortalama bir maç. Daha fazlasını bekliyorum.':'Talimatlarıma uymazsan forma veremem.'):'Bu performans yetmez. Hatalarını videoda konuşacağız.';
  PZ.fin={rating:rt,played,mins,res,noise:Math.round((rt-6-res-MR.adj)*100)/100,end,okN,objN:PZ.obj.length,obj:PZ.obj.map(o=>({t:o.t,ok:o.ok})),comp:{...PZ.comp},compRate:cR,compN:cN,trustD:Math.round(trustD*10)/10,comment,grp:g};
  PZ.fin.next=pzProject(rt,played);}
function pzProject(rt,played){const p=G.p,sv={t:p.trust,f:p.form.slice(),e:p.energy,l:p.pzLast},rr=MR.role;let role=null,base=null;
  try{if(played){if(PZ.league)p.trust=clamp(p.trust+(rt-6.4)*5+PZ.fin.trustD,0,100);p.form.push(rt);if(p.form.length>5)p.form.shift();}p.energy=Math.max(p.energy,80);
    p.pzLast=null;base=decideRole();p.pzLast=played?{r:rt,c:PZ.fin.compRate,n:PZ.fin.compN,y:G.s.year,d:G.s.day}:sv.l;role=decideRole();}catch(e){}finally{p.trust=sv.t;p.form=sv.f;p.energy=sv.e;p.pzLast=sv.l;}
  const T={start:rr==='start'?'İlk 11’e devam':'İlk 11’e yükseliyorsun',sub:'Yedek kulübesi',squad:'Kadro dışı'}[role]||'Hoca kararını sonra verecek';
  const cR=PZ.fin.compRate,cN=PZ.fin.compN;let why=played?`Not ${dec(rt)}`+(cN?` · talimat uyumu %${Math.round(cR*100)}`:''):'Bu maçta süre almadın';
  if(role!==base&&base)why+=role==='start'?' · bu maçla hocayı ikna ettin':' · hoca bu maçtan sonra seni kenara aldı';
  else if(role==='start')why+=rt>=7?' · formun yerinde':' · hoca sana güveniyor';else if(role==='sub')why+=rt<6?' · performans yetmedi':' · kadrodaki rekabet sert';else if(role==='squad')why+=' · antrenmanda kendini göstermelisin';
  return {role,t:T,why};}
function pzPopHide(){const el=$('#pzPop');if(el)el.classList.remove('show');clearTimeout(PZ.popT);}
function pzFT(){const z=PZ.fin;if(!z)return;pzPopHide();const o=$('#pzFT');if(o)o.remove();const cb=$('#pzCoach');if(cb)cb.remove();
  const cls=z.rating>=7.5?'hi':z.rating>=6.5?'mid':'lo',nk=z.next.role||'';
  const row=(m,n,ev)=>{const s=ev.reduce((a,x)=>a+x.v,0);return `<li><i>${m!=null?m+'’':''}</i><div><b>${esc(n)}</b><span>${ev.map(x=>`<em class="${x.v>0.001?'p':x.v<-0.001?'n':''}">${esc(x.t)} ${pzFmt(x.v)}</em>`).join('')}</span></div><strong class="${s>0.001?'p':s<-0.001?'n':''}">${pzFmt(s)}</strong></li>`;};
  const rows=[`<li><i></i><div><b>Başlangıç notu</b></div><strong>6,0</strong></li>`,row(null,'Maç sonucu',[{t:MR.gu>MR.go?'Galibiyet':MR.gu===MR.go?'Beraberlik':'Mağlubiyet',v:z.res}]),
    ...PZ.log.map(l=>row(l.m,l.n,l.ev)),z.end.length?row(null,'Maç geneli',z.end):'',row(null,'Genel oyun (görünmeyen işler)',[{t:'Maç boyunca',v:z.noise}])].join('');
  const el=document.createElement('section');el.id='pzFT';el.className='pz-ft';
  el.innerHTML=z.played?`<div class="pz-ft-h"><div class="pz-rt ${cls}"><b>${dec(z.rating)}</b><small>MAÇ NOTU</small></div><div class="pz-ft-t"><span class="kicker">Maç sonu · ${esc(pzRolName())}</span>
      <p class="pz-next ${nk}"><b>${esc(z.next.t)}</b><small>${esc(z.next.why)}</small></p></div></div>
    <p class="pz-cc"><i>HOCA</i> “${esc(z.comment)}”</p>
    <div class="pz-objs">${z.obj.map(x=>`<span class="${x.ok?'ok':'no'}">${x.ok?'✓':'✗'} ${esc(x.t)}</span>`).join('')}<span class="${z.compRate>=0.5?'ok':'no'}">Talimat ${z.comp.ok}✓ ${z.comp.bad}✗</span></div>
    <details open><summary>Not dökümü · ${PZ.log.length} an</summary><ol class="pz-br">${rows}</ol></details>`
    :`<div class="pz-ft-h"><div class="pz-rt lo"><b>—</b><small>SÜRE YOK</small></div><div class="pz-ft-t"><span class="kicker">Maç sonu</span><p class="pz-next ${nk}"><b>${esc(z.next.t)}</b><small>${esc(z.next.why)}</small></p></div></div><p class="pz-cc"><i>HOCA</i> “${esc(z.comment)}”</p>`;
  const bd=$('#mvBoard');if(bd)bd.insertAdjacentElement('afterend',el);}
applyPlayed=(old=>function(res,role,win,draw,notes,tier,league){const r=old.apply(this,arguments);try{const z=res&&res.pz;if(z&&isPl()){const p=G.p;
    if(league)p.trust=clamp(p.trust+z.trustD,0,100);p.pzLast={r:res.rating,c:z.compRate,n:z.compN,y:G.s.year,d:G.s.day};p.pzHist=(p.pzHist||[]).concat([{r:res.rating,c:Math.round(z.compRate*100)/100,g:z.grp}]).slice(-10);
    if(Array.isArray(notes)){notes.push(`Hoca: “${z.comment}”`);notes.push(`Gelecek maç: ${z.next.t} (${z.next.why}).`);}
    msg('coach','Hocanın maç değerlendirmesi',`${z.comment} Maç notun ${dec(res.rating)}; hedeflerden ${z.okN}/${z.objN} tuttu${z.compN?`, talimatlara uyumun %${Math.round(z.compRate*100)}`:''}. ${z.next.t}.`);}}catch(e){console.warn(e);}return r;})(applyPlayed);
/* son pozisyon maçının notu ve talimat uyumu bir sonraki kadro kararını etkiler */
decideRole=(old=>function(){let r=old.apply(this,arguments);try{const L=G&&G.p&&G.p.pzLast;if(!L||!G.s||L.y!==G.s.year||G.s.day<L.d||G.s.day-L.d>12)return r;
  if(r==='start'&&(L.r<5.3||(L.n>=2&&L.c<0.4&&L.r<6.6)))r='sub';else if(r==='sub'&&L.r>=7.6&&(L.n<2||L.c>=0.5))r='start';else if(r==='squad'&&L.r>=7.2)r='sub';}catch(e){}return r;})(decideRole);
closeMatchView=(old=>function(){const r=old.apply(this,arguments);try{for(const id of ['pzPre','pzFT','pzCoach','pzPop'])$('#'+id)&&$('#'+id).remove();const b=$('#pzSkip');if(b)b.hidden=true;PZ.pre=false;PZ.zip=false;}catch(e){}return r;})(closeMatchView);
/* rolü sonradan değiştirme: Ayarlar → "Mevkideki rolün" */
openSettings=(old=>function(){const r=old.apply(this,arguments);try{if(!G||!G.p||!isPl())return r;const mc=$('#modalCard');if(!mc||mc.querySelector('.pz-rolset'))return r;const L=PZ_ROL[G.p.pos]||[];if(L.length<2)return r;const cur=pzRol();
  const h=`<div class="pz-rolset"><p class="sub-h" style="margin:14px 0 6px"><span>Mevkideki rolün</span><span>${esc(POS[G.p.pos].name)}</span></p><div class="seg plm-seg">${L.map(([k,n])=>`<button class="chip${cur===k?' on':''}" data-act="pzRolSet" data-v="${k}">${n}</button>`).join('')}</div><p class="muted" style="font-size:12.5px;margin:6px 0 0">Pozisyon modunda maçta sana gelecek anlar rolüne göre seçilir (ör. bekte orta ve bire bir savunma, stoperde hava topu ve oyun kurma).</p></div>`;
  const pm=mc.querySelector('.plm-set');if(pm)pm.insertAdjacentHTML('afterend',h);else (mc.lastElementChild||mc).insertAdjacentHTML('beforebegin',h);}catch(e){console.warn('rol ayarı',e);}return r;})(openSettings);
ACTX.pzRolSet=el=>{const v=el.dataset.v,L=PZ_ROL[G.p.pos]||[],x=L.find(y=>y[0]===v);if(!x)return;G.p.rol=v;save();document.querySelectorAll('[data-act=pzRolSet]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));toast('Yeni rolün: '+x[1]);};
/* denge: pozisyon anlarında rakip şutları ve kafaları gerçekçi isabet oranında (yaklaşık üçte biri çerçevede) */
oppShoot=(old=>function(a){const S=MG.S;if(!S||!S.pz)return old.apply(this,arguments);const q=S.C.opp.str,g=S.gk,d=Math.hypot(a.x-34,a.y),far=Math.random()<0.6,side=g.x<34?1:-1;
  const tx=far?34+side*rnd(1.4,3.5):clamp(g.x+rnd(-1.6,1.6),GL+0.3,GR-0.3),sdA=(0.06+(100-q)*0.001)*(0.9+d/15)*(S.gkm?1:dist(S.hero,a)<2.6?1.3:0.72);
  kick(a,tx,0,rnd(0.2,2.2),rnd(17,23)+q*0.04,0,sdA,0.6,'shot');})(oppShoot);
headerBy=(old=>function(e){const S=MG.S;const r=old.apply(this,arguments);try{const b=S&&S.ball;if(S&&S.pz&&e&&e.side==='opp'&&b&&b.kind==='shot'){const a=gauss()*0.15,c=Math.cos(a),sn=Math.sin(a),vx=b.vx*c-b.vy*sn;b.vy=b.vx*sn+b.vy*c;b.vx=vx;b.vz+=gauss()*0.9;}}catch(x){}return r;})(headerBy);
