/* ================= v154: futbolcu kariyeri düzeltmeleri — gol dengesi, tek kaynaklı ödüller, kaleci, yaş sınırları, kadro kararı, kondisyon, Ballon d'Or, menajerler =================
   - Gol dengesi (K3): hızlı simde şut/asist olasılığı oyuncu gücü ile rakip ve takım gücüne göre ölçeklenir; penaltı daha seyrek. Pozisyon modunda santrfora tam maçta 6–8 hücum anı.
   - Ödüller (K4): sezon sonu ekranı, ödül mesajı ve Ödüller sayfası aynı krallık listesinden (lgLeaders) gelir; oyuncu da listede.
   - Kaleci (Y7): kartta KL, kaleci öğreticisi (PLONJON/ÇIK/AÇI/YUMRUK), kaleciye özel özellik adları (Refleks, Çıkış, Hava topu, Oyun kurma), kalecide maç yorgunluğu az.
   - Yaş sınırları (Y8): 16 altı sponsor, gece hayatı, "geç saatlere kadar" uyku yok; 18 altı araç ve gece kulübü yok; takipçi sayısı seviye, lig ve yaşa bağlı.
   - Kaptanlık ve zam talebi (Y9): yaş, kıdem, maç ve hoca güveni şartı.
   - Maç sonu (Y10): penaltı ve serbest vuruş golüne asist yazılmaz; maç sonu ekranındaki golcüler, asistler ve reytingler lig istatistiğine ve haftanın 11'ine aynen geçer.
   - Kadro ve değer (Y11): kadro kararında mevkideki rekabet, gol katkısı ve uzun süre oynamama; piyasa değeri lig seviyesi, yaş ve performansa göre.
   - Maç sonu "gelecek maç" kararı bağlayıcıdır (kadro açıklamasıyla aynı); yinelenen olay ve haberler tekilleşir.
   - Kondisyon: maçtan önceki iki günde bireysel idman yapılmaz; yaz arasında ve turnuvada toparlanma; sakat oyuncu milli maçtan çekilir.
   - Ballon d'Or: adaylar büyük liglerden ya da çok güçlü sezondan; tören numarası tek formülden; maç ekranı açıkken tören kuyruğa alınır.
   - Gelen kutusu: futbolcuya yalnız kendi ligi ve büyük (40 mn €+) dünya transferleri. Menajerler: gerçek müşterili menajere olumsuz söylenti yok, soyadları tekil, ünlü oyuncuya itibarlı menajer.
   - Seçme teklifleri kulübe ve puana göre farklı; "Hızlı başla" rastgele Türkçe ad üretir; sihirbazda Esc bir önceki adıma döner; metin düzeltmeleri. */

/* ---------- yardımcılar ---------- */
function trLow(s){return String(s==null?'':s).replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();}
const v154PosNeed={FW:2,KN:2,OS:3,DF:4,KL:1};
const v154GaExp={FW:0.38,KN:0.3,OS:0.18,DF:0.06,KL:0};
function v154Lg(){try{return LEAGUES[myClub().league]||curLeague();}catch(e){return null;}}
function v154LgAvg(lid){try{const L=leagueClubs(lid).map(c=>c.str);return L.length?L.reduce((a,b)=>a+b,0)/L.length:60;}catch(e){return 60;}}

/* ======================================================================
   K3 · gol dengesi (hızlı sim) ve penaltı sıklığı
   ====================================================================== */
/* hızlı sim çekirdeği (154'teki simMatch'in aynısı; yalnız futbolcu kariyerinde hücum anlarının olasılıkları farklı):
   gol olasılığı = an türü tabanı × K × eğri(oyuncu−rakip ve takım−rakip farkı) × özellik/perk çarpanı; asist ayrı ölçeklenir;
   gol olmayan anlar kurtarış, top kaybı, arkadaşın kaçırması ve aut arasında paylaşılır (not ortalaması korunur). */
const V154_K=0.58,V154_KA=0.6;
simMatch=(old=>function(cfg){if(!isPl()||!cfg||!cfg.opp||typeof cfg.onEnd!=='function')return old.apply(this,arguments);
  try{LASTCFG=cfg;}catch(e){}try{cfg.pkq=pkSimQ(cfg);}catch(e){cfg.pkq={};}
  const p=G.p,ovr=OVR(),us=cfg.us||{str:ovr},opp=cfg.opp,pk=cfg.pkq||{},rel=(ovr-opp.str)/20,R={gu:poisson(cfg.lamUs),go:poisson(cfg.lamOpp),adj:0,goals:0,assists:0,tackles:0};
  const d=(ovr-opp.str)*0.65+((us.str||ovr)-opp.str)*0.35,qq=clamp(1+d*0.035,0.45,1.45)*(p.energy<40?0.85:1);
  const start=cfg.role==='start'?0:cfg.entry;let out=90,inj=false;
  for(const c of cfg.chances){if(c.m<start)continue;const t=c.type,r=Math.random();let code;
    if(t==='savunma'||t==='dkorner'){const ok=clamp(0.5+rel*0.25+(pk[t]||0),0.2,0.88);code=r<ok?(t==='dkorner'?'clear':'tackle'):r<ok+0.27?'defOk':r<ok+0.35?'foul':'conceded';}
    else if(t==='penalti')code=r<clamp(0.7+rel*0.1+(pk.pen||0),0.5,0.95)?'goal':'saved';
    else{const m=pk[t]||1,g=({atak:0.14,kontra:0.28,serbest:0.09,korner:0.1}[t]||0.12)*V154_K*qq*m,a=0.07*V154_KA*qq*m;
      code=r<g?'goal':r<g+a?'assist':r<g+a+0.34?'saved':r<g+a+0.56?'lost':r<g+a+0.7?'tmMiss':'wide';}
    const RR=RES[code]||{adj:0};R.adj+=RR.adj;if(RR.us)R.gu++;if(RR.opp)R.go++;if(RR.cg)R.goals++;if(RR.as)R.assists++;if(code==='tackle')R.tackles++;}
  if(cfg.injMin&&cfg.injMin>=start){inj=true;out=cfg.injMin;}
  const mins=Math.max(1,out-start),win=R.gu>R.go,draw=R.gu===R.go;
  const rating=Math.round(clamp(6.3+(win?0.35:draw?0.05:-0.25)+R.adj+gauss()*0.25,3,10)*10)/10,cond=clamp(p.energy-mins*0.42*(1.25-p.a.fiz/200),0,100);
  cfg.onEnd({us:R.gu,opp:R.go,played:true,rating,goals:R.goals,assists:R.assists,yc:0,rc:0,injured:inj,injKind:'darbe',mins,tackles:R.tackles,cond,sim:true});})(simMatch);
/* penaltı: maç başına daha seyrek; pozisyon modunda santrfora tam maçta 6–8 hücum anı */
const v154Def=t=>t==='savunma'||t==='dkorner';
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(!isPl()||!cfg||!Array.isArray(cfg.chances))return cfg;
    if(cfg.pz&&typeof pzPick==='function'){const g=pzGrp(),rel=((cfg.us&&cfg.us.str)||60)-((cfg.opp&&cfg.opp.str)||60),o={rel:rel/10,plan:1},atk=s=>!v154Def(s.st||s.type)&&(s.st||s.type)!=='penalti';
      for(const c of cfg.chances)if(c.type==='penalti'&&Math.random()<0.55){const s=pzPick(null,o,atk);if(s){c.type=s.st||s.type;c.sc=s.id;c.fam=s.fam;}}
      if(g==='FORVET'&&!cfg.gkBench&&(cfg.entry||0)<88){const e0=cfg.role==='start'?0:(cfg.entry||60),share=(90-e0)/90,want=Math.max(cfg.role==='start'?6:2,Math.round(rint(6,8)*share));
        let nA=cfg.chances.filter(c=>!v154Def(c.type)).length,add=0,guard=0;
        while(nA<want&&guard++<60){const m=rint(Math.max(4,e0+3),88);if(cfg.chances.some(x=>Math.abs(x.m-m)<4))continue;const s=pzPick(null,o,atk);if(!s)break;cfg.chances.push({m,type:s.st||s.type,sc:s.id,fam:s.fam});nA++;add++;}
        if(add){cfg.chances.sort((a,b)=>a.m-b.m);cfg.lamUs=Math.max(0.15,cfg.lamUs-add*0.2);}}}
    else for(const c of cfg.chances)if(c.type==='penalti'&&Math.random()<0.55)c.type='atak';}catch(e){console.warn('v154 maç planı',e);}return cfg;})(buildMatch);

/* lig gol dağılımı: takımın golleri ilk 11'deki golcülerde toplanır (gerçek liglerde gol kralı takım gollerinin %25–35'ini atar);
   eskiden goller bütün kadroya yayıldığı için ligin en golcü yapay oyuncusu 11–14 golde kalıyor, futbolcu her sezon gol kralı oluyordu. */
genPS=(old=>function(L){const ps=old.apply(this,arguments);try{for(const c of leagueClubs(L)){let xi=[];try{xi=autoXI(squadOf(c.id))||[];}catch(e){}if(!xi.length)continue;const X=new Set(xi);
      for(const p of squadOf(c.id)){const x=ps[p.k];if(!x)continue;const q=Math.max(0.25,(p.ovr-c.str+12)/12);if(X.has(p.k)){x.gw*=4*q;x.aw*=2.5;}else{x.gw*=0.6;x.aw*=0.7;}}}}catch(e){console.warn('v154 ps',e);}return ps;})(genPS);

/* ======================================================================
   K4 · sezon ödülleri tek kaynaktan
   ====================================================================== */
let V154_SE=false;
leaders=(old=>function(k){if(V154_SE&&isPl()&&G&&G.s&&typeof lgLeaders==='function'){try{const key=k==='g'?'g':'a';return lgLeaders(G.s.league,k).map(x=>({n:x.me?meN():x.p.name,c:x.c,v:x[key]||0,me:!!x.me}));}catch(e){}}return old.apply(this,arguments);})(leaders);
let V154_ST=null;
seasonEnd=(old=>function(){V154_SE=true;try{V154_ST=G&&G.s&&G.s.stats?Object.assign({},G.s.stats):null;}catch(e){}try{return old.apply(this,arguments);}finally{V154_SE=false;V154_ST=null;}})(seasonEnd);
seasonAwards=(old=>function(){const S=G&&G.s,yl=S?seasonLabel(S.year):null,had=!!(G&&G.awards&&yl&&G.awards[yl]);const r=old.apply(this,arguments);
  try{if(!isPl()||had||!G.awards||!G.awards[yl]||typeof lgLeaders!=='function')return r;const A=G.awards[yl],st=V154_ST||S.stats||{},lid=S.league,me={k:'me',n:meN(),c:G.club,g:st.goals||0,a:st.assists||0,r:st.apps?+(st.rsum/st.apps).toFixed(2):0};
    const top=(k)=>{const L=lgLeaders(lid,k),o=L.filter(x=>!x.me&&x.p&&x.p.k!=='me'),best=o[0];return {best,ov:best?(best[k]||0):0};};
    const pk=x=>x?{k:x.p.k,n:x.p.name,c:x.c,g:x.g,a:x.a,r:x.ap?+(x.rt/x.ap).toFixed(2):0}:null;
    const G1=top('g'),A1=top('a');A.gk=me.g>=3&&me.g>=G1.ov?me:pk(G1.best)||A.gk;A.ak=me.a>=3&&me.a>=A1.ov?me:pk(A1.best)||A.ak;
    const aw=(G.summary&&G.summary.yl===yl&&G.summary.awards)||[];if(aw.includes('Sezonun Oyuncusu'))A.po=me;if(aw.includes('Yılın Genç Oyuncusu'))A.yg=me;
    /* gündem mesajını düzelt */
    const m=G.inbox.find(x=>x.title===`${yl} sezon ödülleri`);if(m){const mine=[A.gk,A.ak,A.po,A.yg].some(x=>x&&x.k==='me');
      m.body=`${A.lg} yılın oyuncusu: ${A.po?A.po.n:'—'}. Gol kralı: ${A.gk?A.gk.n+' ('+A.gk.g+')':'—'}. Asist kralı: ${A.ak?A.ak.n+' ('+A.ak.a+')':'—'}.${A.bdo&&A.bdo[0]?' Altın Top: '+A.bdo[0].n+'.':''}${mine?` ${meN()} ödül aldı!`:''}`;}}catch(e){console.warn('v154 ödül',e);}return r;})(seasonAwards);

/* ======================================================================
   Y7 · kaleci: özellik adları, öğretici, maç yorgunluğu
   ====================================================================== */
const V154_ATTR0=Object.assign({},ATTR),V154_ATTR_GK={sut:'Degaj',pas:'Oyun kurma',dri:'Pozisyon alma',hiz:'Çıkış',fiz:'Hava topu',def:'Refleks'};
let V154_ATTRS0=null;const V154_ATTRS_GK={sut:'DEG',pas:'OYN',dri:'POZ',hiz:'ÇIK',fiz:'HAV',def:'REF'};
function v154Attr(){try{const gk=!!(G&&G.p&&isPl()&&G.p.pos==='KL'),src=gk?V154_ATTR_GK:V154_ATTR0;for(const k in V154_ATTR0)ATTR[k]=src[k];
    if(typeof ATTR_S!=='undefined'){if(!V154_ATTRS0)V154_ATTRS0=Object.assign({},ATTR_S);const s2=gk?V154_ATTRS_GK:V154_ATTRS0;for(const k in V154_ATTRS0)ATTR_S[k]=s2[k];}}catch(e){}}
render=(old=>function(){v154Attr();return old.apply(this,arguments);})(render);
nextDay=(old=>function(){v154Attr();return old.apply(this,arguments);})(nextDay);
doFree=(old=>function(){v154Attr();return old.apply(this,arguments);})(doFree);
/* kaptandan ekstra çalışma: kalecide kalecilik özellikleri */
try{const E=EVENTS.kaptan;if(E&&E.o&&E.o[0]){const f0=E.o[0][1];E.o[0][1]=function(){if(G.p.pos!=='KL')return f0.apply(this,arguments);const k=pick(['def','hiz','fiz']);const g=gainAttr(k,0.2);bump('energy',-8);bump('trust',2);return `${ATTR[k]} ${v154G(g)}. Kaptanla aran çok iyi.`;};}
  E.body=()=>G.p.pos==='KL'?'Takım kaptanı idman sonrası sana şut çekmeyi teklif etti; birlikte refleks ve plonjon çalışabilirsiniz.':'Takım kaptanı idman sonrası birlikte bitiricilik çalışmayı teklif etti.';}catch(e){}
/* öğretici: kaleci ve cihaza uygun metin */
const v154Touch=()=>{try{return matchMedia('(hover: none) and (pointer: coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);}catch(e){return false;}};
function v154TutFill(){const tt=$('#mgTut');if(!tt)return;const card=tt.querySelector('.tut-card');if(!card)return;if(!tt.dataset.v154)tt.dataset.v154=card.innerHTML;
  const gk=G&&G.p&&G.p.pos==='KL',touch=v154Touch();card.classList.toggle('gk',!!gk);let K=null,L=a=>a;try{K=ctlKeys();L=a=>ctlLbl(K[a][0]);}catch(e){}
  const kb=K?`Klavyede: ${L('up')} ${L('left')} ${L('down')} ${L('right')} ile hareket, ${L('a')} A, ${L('b')} B, ${L('c')} C, ${L('d')} D, ${L('pause')} duraklat. Tuşları Ayarlar → Kontroller’den değiştirebilirsin.`:'Klavyede: WASD veya oklar ile hareket.';
  if(gk){const mv=touch?'Ekranın sol altına dokun ve sürükle: kalede yan yan kay, açıyı daralt.':'Hareket tuşlarıyla kalede yan yan kay, açıyı daralt.';
    card.innerHTML=`<h3>Kaleci kontrolleri</h3><ul>
      <li><b>YÖN</b><span>${mv}</span></li>
      <li><b class="a">PLONJON</b><span>Şut çıkınca ${touch?'joystick’in':'yön tuşunun'} gösterdiği köşeye uç. Erken atlarsan ters köşe yersin.</span></li>
      <li><b class="b">ÇIK</b><span>Bire birde forvetin üstüne çık, açıyı kapat. Geç kalırsan aşırtılırsın.</span></li>
      <li><b class="c">KOŞ</b><span>Basılı tut: hızlı yer değiştir.</span></li>
      <li><b class="d">AÇI</b><span>Topa göre ideal yere geç.</span></li>
      <li><b>ORTA</b><span>Topun düşeceği yere git: <b class="a">TUT</b> ile yakala, kalabalıksa <b class="d">YUMRUK</b> ile uzaklaştır.</span></li>
      <li><b>DAĞITIM</b><span>Top sendeyken <b class="b">PAS</b> kısa, <b class="a">UZUN</b> uzun vuruş.</span></li></ul>
      <p>${touch?'Düğmelere dokun; joystick ile yön ver.':esc(kb)}</p><button class="cta sm" type="button" data-act="tutGo">Anladım, oyna</button>`;}
  else{card.innerHTML=tt.dataset.v154;const li=card.querySelector('li span');if(li&&!touch)li.textContent='Hareket tuşlarıyla (WASD ya da oklar) oyuncun o yöne koşar.';const p=card.querySelector('p');if(p)p.textContent=touch?'Düğmelere dokun; ekranın sol altını sürükleyerek koş.':kb;}}
startMoment=(old=>function(){const r=old.apply(this,arguments);try{const tt=$('#mgTut');if(!tt)return r;
    if(G&&G.p&&G.p.pos==='KL'&&G.tutSeen&&!G.tutGK&&MG.S){MG.S.paused=true;tt.hidden=false;}
    if(!tt.hidden)v154TutFill();}catch(e){console.warn('v154 öğretici',e);}return r;})(startMoment);
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('[data-act=tutGo]');if(t&&G&&G.p&&G.p.pos==='KL')G.tutGK=true;},true);

/* ======================================================================
   Y8 · yaş sınırları ve takipçi
   ====================================================================== */
const v154Age=()=>G&&G.p?G.p.age:30;
spnWeek=(old=>function(){if(!isPl())return old.apply(this,arguments);const a=v154Age(),bak=SPN.slice();
  if(a<16)SPN.length=0;else if(a<18){for(let i=SPN.length-1;i>=0;i--)if(['atlas','ruzgar','zirve','lezzet'].includes(SPN[i][0]))SPN.splice(i,1);}
  try{return old.apply(this,arguments);}finally{SPN.length=0;SPN.push(...bak);}})(spnWeek);
try{const c0=EVENTS.sponsor.c;EVENTS.sponsor.c=()=>v154Age()>=16&&c0();const p0=EVENTS.parti;if(p0&&p0.o&&p0.o[1]){const f=p0.o[1][1];p0.o[1][1]=function(){if(v154Age()<16){bump('morale',4);bump('energy',-6);return 'Ailen seni erken saatte aldı; yine de güzel vakit geçirdin.';}return f.apply(this,arguments);};}}catch(e){}
shopFor=(old=>function(){const o=old.apply(this,arguments);try{if(isPl()&&v154Age()<18&&o&&o.arac){const c=Object.assign({},o);delete c.arac;return c;}}catch(e){}return o;})(shopFor);
buyItem=(old=>function(cat,k){try{if(isPl()&&v154Age()<18&&SHOP.arac.items.some(x=>x[0]===k))return toast('Araç satın almak için 18 yaşını doldurmalısın');}catch(e){}return old.apply(this,arguments);})(buyItem);
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(isPl()&&v154Age()<16){const i=L.findIndex(x=>x[0]==='night');if(i>=0)L.splice(i,1);}}catch(e){}return L;})(xtabs);
ACTX.night=(old=>function(el){if(isPl()){const a=v154Age();if(a<16)return toast('16 yaşından küçükler için gece hayatı yok');if(a<18&&el&&el.dataset.k==='kulup')return toast('Gece kulübüne 18 yaşından küçükler giremez');}return old.apply(this,arguments);})(ACTX.night);
ACTX.rtSet=(old=>function(el){if(isPl()&&v154Age()<16&&el&&el.dataset.g==='uyku'&&el.dataset.v==='g')return toast('Bu yaşta geç saatlere kadar oturmak yok');return old.apply(this,arguments);})(ACTX.rtSet);
rtDay=(old=>function(){try{if(isPl()&&v154Age()<16){const r=rtInit();if(r.uyku==='g')r.uyku='n';}}catch(e){}return old.apply(this,arguments);})(rtDay);
render=(old=>function(){const r=old.apply(this,arguments);try{if(isPl()&&G.p&&G.p.age<16){document.querySelectorAll('#view [data-act=rtSet][data-g=uyku][data-v=g]').forEach(b=>b.remove());}}catch(e){}return r;})(render);
/* takipçi: şöhret + lig seviyesi + yaş (12–16 yaşta yüzlerce–birkaç bin) */
function v154SmCap(){const p=G.p,a=p.age,L=v154Lg();if(a<14)return 2500;if(a<16)return 6000;if(L&&L.youth)return 25000;return Infinity;}
smTarget=(old=>function(f){if(!isPl()||!G||!G.p)return old.apply(this,arguments);const L=v154Lg(),t=L?L.tier:5;
  const lm=L&&L.youth?0.35:t>=9?18:t>=8?6:t>=7?2.5:t>=5?1.2:0.7;return Math.round(Math.min(v154SmCap(),300*Math.exp((f||0)/13)*lm));})(smTarget);
smDay=(old=>function(){try{if(isPl()&&G.sm){const tg=smTarget(G.p.fame);if(G.sm.fol>tg*3+500){G.sm.fol=Math.round(tg*1.3+200);G.sm.hist=[];}}}catch(e){}return old.apply(this,arguments);})(smDay);

/* ======================================================================
   Y9 · kaptanlık ve zam talebi şartları
   ====================================================================== */
function v154ReqWhy(k){if(!isPl()||!G||!G.p||!G.s)return '';const p=G.p,st=G.s.stats||{},L=curLeague(),yrs=clubYears(),apps=st.apps||0,starts=st.starts||0;
  if(k==='kaptan'){if(p.age<20&&!(p.age>=18&&!L.youth&&yrs>=3))return 'Kaptanlık için en az 20 yaşında olmalısın';if(yrs<2&&apps<20)return 'Önce bu kulüpte kıdem kazanmalısın';
    if(apps<8)return 'Bu sezon en az 8 maça çıkmalısın';if(starts<apps*0.6)return 'İlk 11’in düzenli oyuncusu olmalısın';if(p.trust<60)return 'Hocanın güveni yeterli değil';return '';}
  if(k==='maas'){if(p.age<16)return 'Altyapı sözleşmesinde zam görüşülmez';const need=Math.max(6,Math.round(NR()*0.25));if(apps<need&&!(G.history.slice(-1)[0]&&G.history.slice(-1)[0].club===G.club&&G.history.slice(-1)[0].apps>=15))return `Önce sahada katkı göster (en az ${need} maç)`;
    if(apps>=3&&seasonAvg()<6.5)return 'Bu performansla zam istemek ters teper';if(p.trust<45)return 'Hocanın güveni düşük';return '';}
  return '';}
reqP=(old=>function(k){const w=v154ReqWhy(k);if(w)return 0;return old.apply(this,arguments);})(reqP);
boardReq=(old=>function(k){const w=v154ReqWhy(k);if(w)return toast(w);return old.apply(this,arguments);})(boardReq);
render=(old=>function(){const r=old.apply(this,arguments);try{if(isPl()&&G.s)for(const k of ['kaptan','maas']){const b=document.querySelector(`#view [data-act=breq][data-k=${k}]`);if(!b||b.disabled)continue;const w=v154ReqWhy(k);if(!w)continue;
      b.disabled=true;const s=b.querySelector('small');if(s)s.textContent=w;const ch=b.querySelector('.ch');if(ch)ch.remove();}}catch(e){}return r;})(render);

/* ======================================================================
   Y10 · maç sonu ekranı ↔ istatistik ↔ haftanın 11'i
   ====================================================================== */
/* penaltı ve doğrudan serbest vuruş golüne asist yazılmaz (golün anı, an kaydından bulunur) */
function v154SetGoal(g){try{const L=(typeof PZ!=='undefined'&&PZ.log&&PZ.log.length?PZ.log:(MR&&MR._clog))||[];return L.some(e=>e&&e.c==='goal'&&Math.abs((e.m||0)-g.m)<=1&&(['penalti','serbest'].includes(e.sc)||['Penaltı','Serbest vuruş'].includes(e.n)));}catch(e){return false;}}
ftTeam=(old=>function(club,gf,ga,win,draw,r,goals,side){const rows=old.apply(this,arguments);try{if(!rows)return rows;
    for(const g of goals){if(g.s!==side)continue;if(g.mine&&g.an&&v154SetGoal(g)){const a=rows.find(x=>x.name===g.an&&!x.me);if(a){a.a=Math.max(0,a.a-1);a.rt=clamp(Math.round((a.rt-0.5)*10)/10,4.5,10);}delete g.an;}
      if(g.an){const a=rows.find(x=>x.name===g.an);if(a&&a.k)g.ak=a.k;}}
    /* lig maçıysa: maç sonu verisini sakla (lig istatistiği ve haftanın 11'i aynı veriyi kullanır) */
    if(G&&G.s&&!MR.national&&/Hafta/.test(MR.comp||'')){const w=(G.s.results||[]).length,F=G.s.v154ft&&G.s.v154ft.w===w?G.s.v154ft:(G.s.v154ft={w,cl:{}});
      const R={};for(const x of rows)if(x.k&&x.rt!=null)R[x.k]=x.rt;F.cl[club.id]={R,goals:goals.filter(g=>g.s===side).map(g=>({k:g.k||null,ak:g.ak||null,me:!!g.mine,as:!!g.as}))};}}catch(e){console.warn('v154 maç sonu',e);}return rows;})(ftTeam);
creditGoals=(old=>function(cid,n,me){try{const S=G.s,F=S&&S.v154ft;if(F&&F.w===S.results.length-1&&F.cl[cid]&&F.cl[cid].goals.length===n){const ps=S.ps||{};
      const psE=k=>{if(!ps[k]){const p=squadOf(cid).find(x=>x.k===k);if(p)ps[k]={n:p.name,c:cid,gw:0,aw:0,g:0,a:0};}return ps[k];};   /* sezon başında listede olmayan (kaleci, sonradan gelen) oyuncunun golü de lige yazılır */
      for(const g of F.cl[cid].goals){if(!g.me&&g.k&&psE(g.k))ps[g.k].g++;if(!g.as&&g.ak&&psE(g.ak))ps[g.ak].a++;}return;}}catch(e){}return old.apply(this,arguments);})(creditGoals);
/* haftanın 11'i: bizim maçımızdaki iki kulüpten yalnız sahaya çıkanlar, notları maç sonu ekranındakiyle aynı (173'teki twBuild'in aynısı, tek fark not kaynağı) */
twBuild=(old=>function(w){const S=G.s,F=S&&S.v154ft;if(!F||F.w!==w)return old.apply(this,arguments);
  try{const rd=S.results[w];if(!rd||!rd.length)return null;const snap=S.twSnap||{},ps=S.ps||{},cand=[];
    for(const [h,a,hg,ag] of rd)for(const [cid,gf,ga] of [[h,hg,ag],[a,ag,hg]]){const C=CLUBS[cid];if(!C)continue;let sq;try{sq=squadOf(cid)||[];}catch(e){continue;}
      const FC=F.cl[cid],res=gf>ga?0.45:gf===ga?0.1:-0.35,str=C.str||70,by={};for(const p of sq){if(p&&TW_N[p.pos]&&(!FC||FC.R[p.k]!=null))(by[p.pos]=by[p.pos]||[]).push(p);}
      for(const pos in TW_N)for(const p of (by[pos]||[]).slice().sort((x,y)=>FC?(FC.R[y.k]-FC.R[x.k]):((y.ovr||0)-(x.ovr||0))).slice(0,TW_N[pos])){
        const s=ps[p.k],o=snap[p.k]||[0,0],dg=s?Math.max(0,(s.g||0)-o[0]):0,da=s?Math.max(0,(s.a||0)-o[1]):0;let v;
        if(FC)v=FC.R[p.k];else{const r=srnd('tw'+S.year+'|'+w+'|'+p.k),back=pos==='KL'||pos==='DF';v=6.35+((p.ovr||70)-str)*0.035+res+dg*0.9+da*0.5+(back?(ga===0?0.55:ga>=3?-0.4:0):0)+(pos==='KL'&&ga===0?0.15:0)+(!back&&gf>=3?0.15:0)+(r()*1.3-0.65);}
        cand.push({n:p.name,k:p.k,c:cid,p:pos,r:Math.round(clamp(v,4.5,9.9)*10)/10,g:dg,a:da});}}
    if(isPl()&&TW_PEND&&TW_ME&&TW_ME.w===w&&G.p&&TW_N[G.p.pos])cand.push({n:meN(),c:G.club,p:G.p.pos,r:Math.round(clamp(TW_ME.r,4.5,10)*10)/10,g:TW_ME.g||0,a:TW_ME.a||0,me:1});
    if(!cand.length)return null;cand.sort((x,y)=>(y.me?1:0)-(x.me?1:0)||y.r-x.r);
    const byP={};for(const x of cand)(byP[x.p]=byP[x.p]||[]).push(x);
    let best=null;for(const [f,lines] of TW_F){const need={};lines.flat().forEach(p=>need[p]=(need[p]||0)+1);if(Object.keys(need).some(p=>(byP[p]||[]).length<need[p]))continue;
      const q={};for(const p in need)q[p]=byP[p].slice(0,need[p]);const sc=Object.values(q).flat().reduce((s,x)=>s+x.r,0)+(Object.values(q).flat().some(x=>x.me)?100:0);
      if(!best||sc>best.sc){const L=lines.map(l=>{const ix={};return l.map(p=>{const i=ix[p]=(ix[p]||0);ix[p]++;return q[p][i];});});best={sc,f,L};}}
    if(!best)return old.apply(this,arguments);
    const all=best.L.flat();let mo=all[0];for(const x of all)if(x.r>mo.r)mo=x;
    return {y:S.year,w:w+1,lg:S.league,f:best.f,mo:mo.k||(mo.me?'me':''),L:best.L.map(l=>l.map(x=>{const o={n:x.n,c:x.c,p:x.p,r:x.r};if(x.k)o.k=x.k;if(x.g)o.g=x.g;if(x.a)o.a=x.a;if(x.me)o.me=1;return o;}))};}
  catch(e){console.warn('v154 totw',e);return old.apply(this,arguments);}})(twBuild);

/* ======================================================================
   Y11 · kadro kararı (rekabet, gol katkısı, uzun süre oynamama) ve piyasa değeri
   ====================================================================== */
const v154Lbl=s=>s>=-3?'start':s>=-12?'sub':'squad';
let V154_INPROJ=false;
function v154Score(){const c=myClub(),p=G.p;return (OVR()-c.str)+(p.trust-50)/4+(formAvg()-6.5)*5+(p.energy<40?-8:0)+(ROLE_BONUS[G.contract.role]||0)+({genc:p.age<=21?3:0,sampiyon:-3,tutumlu:2}[clubVision(c)]||0)+prepAdj()+(LEAGUES[c.league].tier===0?5:0);}
function v154Adj(){const p=G.p,c=myClub(),pos=p.pos,ovr=OVR();let s=0;
  /* mevkideki rekabet */
  try{const sq=squadOf(c.id).filter(q=>q.pos===pos&&q.k!=='me'),better=sq.filter(q=>q.ovr>ovr).length,need=v154PosNeed[pos]||2;s+=better<need?3:-Math.min(8,(better-need+1)*2);}catch(e){}
  /* gol katkısı: bu sezon (3+ maç) ya da geçen sezon */
  const ex=v154GaExp[pos]||0.2,st=G.s.stats||{};
  if(pos!=='KL'){if(st.apps>=3){const ga=(st.goals+st.assists*0.6)/st.apps;s+=clamp((ga-ex)*12,-3,6);}
    else{const h=G.history.slice().reverse().find(x=>x.pos!=='TD'&&x.apps>=10);if(h){const Lh=LEAGUES[h.league],tf=Lh?clamp(1-(LEAGUES[c.league].tier-Lh.tier)*0.3,0.2,1):0.5;s+=clamp(((h.goals+h.assists*0.6)/h.apps-ex)*6,-2,4)*tf;}}}
  if(p.fame>=60)s+=1.5;
  /* uzun süredir oynamıyorsa hoca şans verir */
  const miss=p.v154miss||0;if(miss>=3)s+=(miss-2)*2.5;
  return s;}
decideRole=(old=>function(){const r=old.apply(this,arguments);try{if(!isPl()||!G||!G.s)return r;const p=G.p;
    if(!V154_INPROJ&&p.v154nx&&p.v154nx.y===G.s.year&&G.s.day>p.v154nx.d&&G.s.day-p.v154nx.d<=14)return p.v154nx.role;
    const s0=v154Score();if(v154Lbl(s0)!==r)return r;return v154Lbl(s0+v154Adj());}catch(e){console.warn('v154 kadro',e);return r;}})(decideRole);
finishLeague=(old=>function(res,f,role){try{const p=G.p;if(isPl()){if(res&&res.played)p.v154miss=0;else if(role==='sub'||role==='squad')p.v154miss=(p.v154miss||0)+1;}}catch(e){}return old.apply(this,arguments);})(finishLeague);
/* maç sonu "gelecek maç" kararı: metin tutarlı ve bağlayıcı */
pzProject=(old=>function(rt,played){V154_INPROJ=true;let o;try{o=old.apply(this,arguments);}finally{V154_INPROJ=false;}
  try{if(!o||!o.role)return o;const low=played&&rt<6,hi=played&&rt>=7.5;
    if(o.role==='start'&&MR&&MR.role!=='start'&&low)o.why='Zayıf bir maçtı ama hoca sana şans vermeye devam ediyor';
    else if(o.role==='start'&&low)o.why='Performansın yetmedi ama hoca sana güveniyor';
    else if(o.role!=='start'&&hi&&!/rekabet/.test(o.why))o.why+=' · ama kadrodaki rekabet sert';
    G.p.v154nx={y:G.s.year,d:G.s.day,role:o.role};}catch(e){}return o;})(pzProject);
onPlay=(old=>function(sim){const r=old.apply(this,arguments);try{const nx=G&&G.p&&G.p.v154nx;if(nx&&(nx.y!==G.s.year||G.s.day>nx.d))delete G.p.v154nx;}catch(e){}return r;})(onPlay);
/* piyasa değeri: lig seviyesi + ligin ortalamasına göre güç + yaş + performans (kulübün gücüne göre değil) */
marketValue=(old=>function(){try{if(!isPl())return old.apply(this,arguments);const p=G.p,c=myClub(),L=LEAGUES[c.league],ovr=OVR(),avg=v154LgAvg(c.league);
    const rel=Math.exp(clamp((ovr-avg)*0.085,-1.4,1.9)),age=p.age,af=age<=17?1:age<=21?1.35:age<=24?1.15:age<=27?1:age<=30?0.7:age<=33?0.4:0.18;
    const potAvg=Object.values(p.pot).reduce((a,b)=>a+b,0)/6,pf=age<=21?1+clamp((potAvg-ovr)/80,0,0.6):1;
    const st=G.s&&G.s.stats||{},wk=Math.max(1,(G.s&&G.s.results||[]).length);let perf=1;
    if(st.apps>=5){const r=st.rsum/st.apps,ex=v154GaExp[p.pos]||0.2,ga=(st.goals+st.assists*0.6)/st.apps;perf=clamp(1+(r-6.7)*0.25+(p.pos==='KL'||p.pos==='DF'?0:clamp((ga-ex)*0.6,-0.2,0.4)),0.7,1.6);if(st.apps<wk*0.3)perf*=0.85;}
    else{const fm=p.form.length?clamp(1+(formAvg()-6.5)*0.12,0.8,1.25):1;perf=fm;}
    const fame=1+p.fame/150,inj=p.injury&&p.injury.serious?0.8:1;const v=MV_BASE[L.tier]*rel*af*pf*perf*fame*inj,rr=v>=1e6?1e5:v>=1e5?25000:v>=1e4?5000:v>=1000?500:100;return Math.max(rr,Math.round(v/rr)*rr);}catch(e){return old.apply(this,arguments);}})(marketValue);
/* oyuncu kartı: hiyerarşi rozeti sözleşme rolü ve ilk 11 oranıyla tutarlı; kaleci yalnız kalecilerle kıyaslanır */
meRole=(old=>function(){const r=old.apply(this,arguments);try{if(!r||!isPl()||r==='Kaptan')return r;const st=G.s&&G.s.stats,sr=st&&st.apps>=4?st.starts/st.apps:null,c=myClub();
    if(G.p.pos==='KL'){const o=OVR(),b=squadOf(c.id).filter(q=>q.pos==='KL'&&q.ovr>o).length;if(b>=1&&(sr==null||sr<0.5))return 'Yedek';if(r==='Yıldız'&&(sr==null||sr<0.7))return 'İlk 11';return r;}
    if(r==='Yıldız'&&(['Rotasyon','Gelişim','Yedek'].includes(G.contract.role)&&(sr==null||sr<0.7)))return sr!=null&&sr<0.5?'Rotasyon':'İlk 11';}catch(e){}return r;})(meRole);

/* ======================================================================
   Yinelenen olaylar ve haberler · gelen kutusu hedefleme
   ====================================================================== */
try{for(const k of Object.keys(EVENTS)){const E=EVENTS[k],c0=E.c;E.c=()=>{try{if(G.inbox.some(m=>m.ev&&!m.ev.done&&m.ev.id===k))return false;}catch(e){}return c0();};}}catch(e){}
let V154_AITX=false;const V154_ONCE=['Transfer dönemi kapandı','Ara transfer dönemi açıldı','Bugün transferde son gün!','Hocayla birebir görüşme'];
aiTransfers=(old=>function(){V154_AITX=true;try{return old.apply(this,arguments);}finally{V154_AITX=false;}})(aiTransfers);
msg=(old=>function(t,title,body,extra){try{if(G&&G.inbox&&G.s){
    if(['news','gundem','board'].includes(t)&&!(extra&&(extra.totw||extra.ev||extra.offer))){const d=absDay(),one=V154_ONCE.includes(title);if(one){const e=G.inbox.slice(0,40).find(m=>m.title===title&&m.ad!=null&&Math.abs(m.ad-d)<=3);if(e){if(!/^Son gün sona erdi\. 0 /.test(body))e.body=body;return;}}else if(G.inbox.slice(0,40).some(m=>m.title===title&&m.ad===d&&m.body===body))return;}
    if(V154_AITX&&isPl()&&t==='gundem'&&/^Transfer: /.test(title)){const lc=leagueClubs(G.s.league).map(c=>c.name),own=lc.some(n=>String(body).startsWith(n+',')||String(body).includes(', '+n+' forması'));
      const m=/Bonservis: ([\d.,]+) mn €/.exec(String(body)),fee=m?parseFloat(m[1].replace(/\./g,'').replace(',','.')):0;if(!own&&fee<40)return;}}}catch(e){}
  return old.apply(this,arguments);})(msg);
/* maç ekranı kapandıktan sonra hoca talimatı bildirimi ana sayfaya taşmasın */
toast=(old=>function(t){try{if(typeof t==='string'&&/^Hoca: /.test(t)){const m=$('#match');if(!m||m.hidden)return;}}catch(e){}return old.apply(this,arguments);})(toast);
closeMatchView=(old=>function(){const r=old.apply(this,arguments);try{const el=$('#toast');if(el&&!el.hidden&&/^Hoca: /.test(el.textContent))el.hidden=true;}catch(e){}return r;})(closeMatchView);
/* küçük gelişimler: "Şut +0,01" yerine "Şut ↑" */
function v154G(g){return g>=0.05?'+'+dec(g,2):'↑';}
function v154Gt(s){return typeof s!=='string'?s:s.replace(/([A-Za-zÇĞİÖŞÜçğıöşü][A-Za-zÇĞİÖŞÜçğıöşü ]{1,18}) \+0,0[0-4]\d?(?![\d])/g,'$1 ↑');}
toast=(old=>function(t){return old.call(this,v154Gt(t));})(toast);
msg=(old=>function(t,title,body,extra){return old.call(this,t,title,v154Gt(body),extra);})(msg);
openModal=(old=>function(h){const a=[].slice.call(arguments);if(typeof h==='string')a[0]=h.replace(/(<li>[^<]{2,24}) \+0,0[0-4]\d?<\/li>/g,'$1 ↑</li>');return old.apply(this,a);})(openModal);

/* ======================================================================
   Kondisyon dengesi
   ====================================================================== */
/* dengeli planda maçtan önceki iki gün bireysel idman yok; kondisyon 85'in altındaysa dinlen */
autoPlan=(old=>function(){try{if(isPl()&&G.s&&!G.slot&&!G.p.injury&&(G.plan.mode||'denge')==='denge'){const nm=nextMatchDay(G.s.day),dd=nm==null?99:nm-G.s.day;
      if(dd>=1&&dd<=2){if(G.p.energy<85)return doFree('rest',null,true);return;}
      if(G.p.energy<70&&dd<=3)return doFree('rest',null,true);}}catch(e){}return old.apply(this,arguments);})(autoPlan);
/* kaleci maçta daha az yorulur */
applyPlayed=(old=>function(res){try{if(isPl()&&res&&res.cond!=null&&G.p.pos==='KL'){const e0=G.p.energy;if(res.cond<e0)res.cond=e0-(e0-res.cond)*0.35;}G.p.v154lm=G.s?absDay():0;}catch(e){}return old.apply(this,arguments);})(applyPlayed);
/* yaz arası: yeni sezonda dinlenmiş başla */
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(isPl()&&G.p&&!(G.p.injury&&G.p.injury.serious))G.p.energy=Math.max(G.p.energy,95);}catch(e){}return r;})(newSeason);
/* turnuva maçları arasında 3–5 gün vardır */
tourPlay=(old=>function(){try{if(isPl()&&G.p&&!(G.p.injury&&G.p.injury.serious))G.p.energy=clamp(Math.max(G.p.energy,Math.min(92,G.p.energy+40)),0,100);}catch(e){}return old.apply(this,arguments);})(tourPlay);
/* sakat oyuncu milli maçtan çekilir */
onPlay=(old=>function(sim){try{if(isPl()&&G.s&&G.s.nat&&dayType(G.s.day)==='milli'&&!canPlay()){const n=G.s.nat;msg('nat',`${n.lv} kadrosundan çıkarıldın`,G.p.ban?'Cezan nedeniyle milli maçta forma giyemiyorsun.':`Sakatlığın nedeniyle ${n.lv} kadrosundan çıkarıldın. Sağlık ekibi iyileşmene odaklanmanı istiyor.`);
      G.s.nat=null;nextDay();save();render();return;}}catch(e){console.warn(e);}return old.apply(this,arguments);})(onPlay);
/* milli maç numarası: yaş kategorisine göre ayrı sayılır */
showResult=(old=>function(h,a,hg,ag,res,notes){try{if(isPl()&&Array.isArray(notes)){const i=notes.findIndex(x=>typeof x==='string'&&/^(.+?) formasıyla \d+\. maçına çıktın\.$/.test(x));
      if(i>=0){const lv=/^(.+?) formasıyla/.exec(notes[i])[1],p=G.p;if(!p.capsBy){p.capsBy={};if(p.caps>1)p.capsBy[lv]=p.caps-1;}p.capsBy[lv]=(p.capsBy[lv]||0)+1;notes[i]=`${lv} formasıyla ${p.capsBy[lv]}. maçına çıktın.`;}}}catch(e){}return old.apply(this,arguments);})(showResult);

/* ======================================================================
   Ballon d'Or
   ====================================================================== */
bdoPool=(old=>function(){const P=old.apply(this,arguments);try{const ok=x=>{const c=CLUBS[x.c],L=c&&LEAGUES[c.league];if(!L)return false;if(L.tier>=9)return true;
      const pm=P.posMap[x.c],top=pm&&pm[0]<=2,eu=P.euW===x.c;if(x.me)return (top||eu)&&((x.g||0)>=25||(x.r||0)>=7.6);return (top||eu)&&x.ovr>=84;};
    P.rows=P.rows.filter(ok);}catch(e){console.warn('v154 bdo',e);}return P;})(bdoPool);
function v154BdoNo(){try{for(const R of Object.values(G.bdo||{}))if(R&&R.y)R.no=bdoNo(R.y);}catch(e){}}
viewBdo=(old=>function(){v154BdoNo();return old.apply(this,arguments);})(viewBdo);
bdoInvite=(old=>function(){v154BdoNo();return old.apply(this,arguments);})(bdoInvite);
let V154_BDQ=null;
const v154Busy=()=>{try{const m=$('#match');if(m&&!m.hidden)return true;if(typeof MR!=='undefined'&&MR)return true;if(typeof TR!=='undefined'&&TR)return true;if(typeof FX!=='undefined'&&FX&&$('#fx')&&!$('#fx').hidden)return true;}catch(e){}return false;};
bdcOpen=(old=>function(R){if(R&&R.y)R.no=bdoNo(R.y);if(v154Busy()){V154_BDQ=R;toast('Ballon d’Or töreni maç bittikten sonra açılacak');return;}return old.apply(this,arguments);})(bdcOpen);
closeMatchView=(old=>function(){const r=old.apply(this,arguments);try{if(V154_BDQ){const R=V154_BDQ;V154_BDQ=null;setTimeout(()=>{if(!v154Busy())bdcOpen(R);},700);}}catch(e){}return r;})(closeMatchView);

/* ======================================================================
   Menajerler: söylentiler, soyadları, kimin kapıyı çaldığı
   ====================================================================== */
const V154_AG_NEU=['Basında: %a son dönemde birkaç yeni müşteriyle anlaştı','Kulis: %n pazarlıkta çok sert; bazı kulüpler masadan kalkmış','Bir spor yazarı %n için: “Komisyonu yüksektir ama işini bilir.”'];
agRumours=(old=>function(a){try{if(a&&a.hon<62&&agClientList(a).length){const n=a.rep>=60?2:1,out=[];for(let i=0;i<n;i++){const t=V154_AG_NEU[(hash(a.id+'n'+i)+i)%V154_AG_NEU.length];if(!out.includes(t))out.push(t);}return out.map(t=>t.replace(/%n/g,a.n).replace(/%a/g,a.ag));}}catch(e){}return old.apply(this,arguments);})(agRumours);
const V154_TR_LN=['Aksoy','Bozkurt','Çetinkaya','Duman','Erdoğdu','Güler','Işıklar','Kalkan','Keskin','Oral','Polat','Sezer','Taşkın','Uçar','Yalçın','Zengin','Başaran','Coşkun','Dinçer','Eren','Fidanoğlu','Gürsoy','Metin','Özer','Sönmez','Tunç','Ünal','Yavuz','Akman','Bilgin','Cansever','Demirtaş','Ekinci','Gündoğdu','Kaptanoğlu','Özkaya','Saraç','Tanrıverdi','Yazıcı','Avcı'];
function v154AgUniq(list){const used=new Set(),all=[];for(const a of list){const P=AG_NP[a.nat]||AG_NP.TUR;const parts=String(a.n).split(' '),fn=parts[0];let ln=parts.slice(1).join(' ');
    if(used.has(ln)){const pool=(a.nat==='TUR'?P.l.concat(V154_TR_LN):P.l.concat(V154_TR_LN.map(x=>x))).filter(x=>!used.has(x));if(pool.length){ln=pool[hash(a.id+'ln')%pool.length];a.n=fn+' '+ln;}}
    used.add(ln);all.push(a);}return all;}
agGen=(old=>function(seed){return v154AgUniq(old.apply(this,arguments));})(agGen);
agWorld=(old=>function(){const A=old.apply(this,arguments);try{if(A&&!A.v154){A.v154=1;v154AgUniq(A.list);}}catch(e){}return A;})(agWorld);
agPickApproacher=(old=>function(){try{const A=agWorld(),me=agMeScore(),X=agx(),mid=agMine()&&agMine().id,inTR=(curLeague().cc||'TR')==='TR',d=absDay(),p=G.p,hot=formAvg()>=7.2||p.fame>=55;
    const ws=A.list.map(a=>{if(a.id===mid||(X.last[a.id]&&d-X.last[a.id]<150))return 0;
      /* oyuncunun seviyesine yakın itibar en olası; başarılı oyuncuya itibarlı menajerler gelir, zayıflar geri çekilir */
      let w=Math.exp(-Math.abs(a.rep-(me+(hot?8:2)))/(hot?10:14))*(a.rep<me-25?0.2:1)*(a.hon<45&&me<45?1.5:1)*(a.spec==='genc'&&p.age<=20?1.4:1)*(a.spec==='tr'&&inTR?1.3:1)*(a.nat==='TUR'&&inTR?1.2:1);
      if(a.rep>me+25)w*=0.15;return w;});
    const tot=ws.reduce((s,w)=>s+w,0);if(tot<=0)return null;let v=Math.random()*tot;for(let i=0;i<ws.length;i++)if((v-=ws[i])<=0)return A.list[i];return null;}catch(e){return old.apply(this,arguments);}})(agPickApproacher);

/* ======================================================================
   Seçmeler, sihirbaz, hızlı başlangıç
   ====================================================================== */
tryoutEnd=(old=>function(avg,skipped){const r=old.apply(this,arguments);try{const T=G.tryout;if(!T||!T.offers||!T.offers.length)return r;const cl=leagueClubs('u14'),strs=cl.map(c=>c.str),mn=Math.min(...strs),mx=Math.max(...strs);
    for(const o of T.offers){const c=CLUBS[o.club];if(!c)continue;const rel=(c.str-mn)/((mx-mn)||1),m=(T.avg||0)-rel*0.7;
      o.role=m>=0.3?'İlk 11':m>=0.05?'Altyapı':'Gelişim';o.years=rel>=0.6?3:2;
      o.wage=Math.max(10,Math.round(LEAGUES.u14.wage*(0.7+(T.avg||0)*0.6)*(0.75+rel*0.6)*(VIS_WAGE[clubVision(c)]||1)/10)*10);}
    save();render();}catch(e){console.warn('v154 seçme',e);}return r;})(tryoutEnd);
signTryout=(old=>function(i){const o=G.tryout&&G.tryout.offers[i],y=o&&o.years;const r=old.apply(this,arguments);try{if(y&&G.contract)G.contract.years=y;if(G.p&&!G.p.capsBy)G.p.capsBy={};save();}catch(e){}return r;})(signTryout);
const V154_FN=['Emre','Mert','Arda','Kerem','Yusuf','Burak','Ege','Efe','Can','Barış','Ömer','Kaan','Alper','Deniz','Eren','Onur','Furkan','Berk','Doruk','Umut','Tuna','Batuhan','Yiğit','Cenk','Sinan','Taylan','Ozan','Halil','Serkan','Oğuz'];
const V154_LN=['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Yıldırım','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat','Korkmaz','Karaca','Erdem','Akın','Güneş','Bulut','Tekin','Ateş','Uysal'];
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('#start [data-act=startGame]');if(!t||typeof W==='undefined')return;
  if(String(W.fn||'').trim().length<2||String(W.ln||'').trim().length<2){W.fn=pick(V154_FN);W.ln=pick(V154_LN);}},true);
/* sihirbazda Esc: Karakter → Mevki → Meslek → Liste */
window.addEventListener('keydown',e=>{try{if(e.key!=='Escape'||e.defaultPrevented||typeof W==='undefined')return;const st=$('#start');if(!st||st.hidden||!$('#modal').hidden)return;
    const back={mevki:'prof',kim:W.prof==='oyuncu'&&!W.scn?'mevki':'prof',prof:'list',scn:'list'}[W.step];if(!back)return;
    if(W.step==='kim'&&back==='mevki'){W.mv=W.mv||SEL.rol||null;}
    W.step=back;W.del=null;showStart();e.preventDefault();e.stopPropagation();}catch(err){}},true);
/* giriş metni: tüm meslekler */
showStart=(old=>function(){const r=old.apply(this,arguments);try{if(W.step==='list'){const s=document.querySelector('#start .cta.big[data-k=prof] small');if(s){const L=Object.values(PROF).map(x=>trLow(x.n));s.textContent=L.length>1?L.slice(0,-1).join(', ')+' ya da '+L[L.length-1]:L[0]||'';s.textContent=s.textContent.charAt(0).toLocaleUpperCase('tr-TR')+s.textContent.slice(1);}}}catch(e){}return r;})(showStart);

/* ======================================================================
   Metin düzeltmeleri
   ====================================================================== */
/* sosyal medya: "159,6 bin kaybı takipçi" → "159,6 bin takipçi kaybı" */
function v154SmTxt(h){return typeof h!=='string'?h:h.replace(/([\d.,]+\s?(?:bin|mn|milyon)?)\s+kaybı takipçi/g,'$1 takipçi kaybı').replace(/([\d.,]+\s?(?:bin|mn|milyon)?)\s+kayıp takipçi/g,'$1 takipçi kaybı');}
render=(old=>function(){const r=old.apply(this,arguments);try{const v=$('#view');if(v&&/kaybı takipçi|kayıp takipçi/.test(v.textContent)){const w=document.createTreeWalker(v,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(/takipçi/.test(n.nodeValue))n.nodeValue=v154SmTxt(n.nodeValue);}}catch(e){}return r;})(render);
/* "Kulüp efsanesi ol": yalnız takım kupaları sayılır */
const v154TeamTr=n=>{n=String(n||'');return /Şampiyon|Kupa|Kupası|Süper|Lig(i)? Şampiyon|UEFA|Avrupa|Konferans/i.test(n)&&!/Gol Kral|Asist Kral|Oyuncu|Haftanın|Ayın|Genç|Altın|Ballon|Kopa|Yılın/i.test(n);};
lcClubTot=(old=>function(){const T=old.apply(this,arguments);try{for(const k in T)T[k].tr=0;for(const t of G.trophies||[])if(!t.nat&&T[t.club]&&v154TeamTr(t.name))T[t.club].tr=(T[t.club].tr||0)+1;}catch(e){}return T;})(lcClubTot);
