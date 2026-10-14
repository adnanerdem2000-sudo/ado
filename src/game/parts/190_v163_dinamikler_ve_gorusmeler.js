/* ================= v163: takım dinamikleri + oyunculara verilen sözler · basın toplantısı salonu ve hoca odası sahneleri =================
   - Dinamikler ekranı (teknik direktör; yardımcı antrenör salt okunur): soyunma odası havası, hiyerarşi piramidi,
     uyruk/yaş/kulüpteki süre grupları, oyuncu mutluluğu ve nedenleri, aktif sözler ve geçmişi.
   - Sözler: forma süresi, daha büyük rol, kupa maçlarında forma, mevkie takviye, yeni sözleşme, transfer izni.
     Süresi takip edilir; tutulmazsa oyuncu kırılır, liderler ve grubu tepki gösterir, transfer talebi gelebilir.
   - Kulüpteki süre yalnız gerçek transfer verisinden (FotMob) ya da oyun içi transferden gelir; bilinmiyorsa gösterilmez.
   - Basın toplantısı (maç öncesi, maç sonu, gelen kutusu) mikrofonlu salon sahnesinde; sorular bağlama göre, her soruda 6 cevap
     (ton etiketi ve etki ipucu ile). Birebir görüşmeler ofis sahnesinde, gruplu 20+ seçenek; futbolcu kariyerinde hocanın odası.
   Gazeteci, yayın kuruluşu ve sponsor adları kurmacadır. */
const isTD=()=>!!(G&&G.mode==='mgr'&&G.m&&!isRole()&&!G.m.shadow);
const isYrd163=()=>!!(G&&isStaff()&&G.staff==='yrd'&&G.club&&G.s);
function v163D(){const m=G.m;m.dyn=m.dyn||{};const D=m.dyn;D.prom=D.prom||[];D.hist=D.hist||[];D.ap=D.ap||{};D.br=D.br||{};D.kp=D.kp||{};D.riv=D.riv||{};D.cupN=D.cupN||0;return D;}
const V163_POS={KL:'kaleci',DF:'savunma',OS:'orta saha',KN:'kanat',FW:'forvet'};
const V163_AD=()=>absDay();
/* ---------- kulüpteki süre (gerçek veri ya da oyun içi; yoksa null) ---------- */
function v163Ten(p){const cid=G.club;
  try{const L=(G.txh||{})[p.k];if(L&&L.length){const e=L[L.length-1];if(e.to===cid)return Math.max(0,G.s.year-e.y);}}catch(e){}
  try{if(p.home===cid){const R=fmkRec(p);if(R){let y=null;for(const mv of R.mv){if(mv.tp!=='L'&&fmkClub(mv.t)===cid)y=mv.y;}if(y!=null)return Math.max(0,G.s.year-y);
      let y0=null,n=0;for(const s of R.se){if(fmkClub(s.ci)===cid&&!s.loan){y0=s.y;n++;}else if(n)break;}if(y0!=null)return Math.max(0,G.s.year-y0);}}}catch(e){}
  return null;}
/* yardımcı antrenör: hocayla ilişki bilinmez; oynama süresi ve kişilikten tahmini moral */
function v163Est(p,E,pl){const ps=persOf(p),x=E&&E[p.k],r=srng(p.k+'y163'+G.s.year)();let v=PERS_B[ps]*0.8+r*20-10;if(x&&pl>=3){const q=x.st/pl;v+=q>=0.7?12:q>=0.4?2:-14;}return Math.round(clamp(v,-60,70));}
/* ---------- hiyerarşi ve gruplar (td ve yardımcı antrenör) ---------- */
function v163Calc(){const td=isTD(),sq=squadOf(G.club),R=squadRoles(G.club),c=myClub();let E={},pl=0;
  if(!sq.length)return {td,sq,R,c,E,pl,relF:()=>0,S:{},T:{},lv:{},lead:[],inf:[],nat:[],age:[],ten:[],unk:0,jeal:new Set(),expect:new Set(),pos:null,nT:0};
  try{E=clubSeasonEst(G.club)||{};}catch(e){}try{const row=table().find(r=>r.id===G.club);pl=row?row.o:0;}catch(e){}
  const relF=td?relOf:(p=>v163Est(p,E,pl));const S={},T={};
  for(const p of sq){const ten=v163Ten(p),role=R[p.k],ps=persOf(p);T[p.k]=ten;
    S[p.k]=(p.ovr-c.str)*1.2+Math.min(p.age,33)*0.5+(ten||0)*2.5+(ps==='Lider'?8:0)+(role==='Kaptan'?30:role==='Takım lideri'?18:role==='Yıldız'?10:role==='İlk 11'?4:0);}
  const by=sq.slice().sort((a,b)=>S[b.k]-S[a.k]);const lv={};
  const lead=by.filter(p=>R[p.k]==='Kaptan'||R[p.k]==='Takım lideri');for(const p of by){if(lead.length>=4)break;if(!lead.includes(p)&&persOf(p)==='Lider'&&p.age>=24&&S[p.k]>=S[by[Math.min(7,by.length-1)].k])lead.push(p);}
  const inf=by.filter(p=>!lead.includes(p)&&(p.age>=22||R[p.k]==='Yıldız')).slice(0,6);
  for(const p of sq)lv[p.k]=lead.includes(p)?0:inf.includes(p)?1:(T[p.k]===0||p.age<=20)?3:2;
  const nat=hierGroups(sq,relF);
  const mk=(n,L)=>{if(L.length<2)return null;const mood=L.reduce((a,p)=>a+relF(p),0)/L.length,ld=L.slice().sort((a,b)=>S[b.k]-S[a.k])[0];return {n,L,mood,lead:ld};};
  const age=[mk('Gençler (21 ve altı)',sq.filter(p=>p.age<=21)),mk('Ana grup (22–28)',sq.filter(p=>p.age>=22&&p.age<=28)),mk('Tecrübeliler (29+)',sq.filter(p=>p.age>=29))].filter(Boolean);
  const ten=[mk('Kıdemliler (3+ yıl)',sq.filter(p=>T[p.k]!=null&&T[p.k]>=3)),mk('Yerleşikler (1–2 yıl)',sq.filter(p=>T[p.k]!=null&&T[p.k]>=1&&T[p.k]<3)),mk('Yeni gelenler (bu sezon)',sq.filter(p=>T[p.k]===0))].filter(Boolean);
  const unk=sq.filter(p=>T[p.k]==null).length;
  let jeal=new Set();try{if(td)for(const [a] of hierJealous(sq,mgrXI()))jeal.add(a.k);}catch(e){}
  const top13=new Set(sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,13).map(p=>p.k));
  const expect=new Set(sq.filter(p=>['Kaptan','Yıldız','Takım lideri','İlk 11'].includes(R[p.k])||top13.has(p.k)).map(p=>p.k));
  let pos=null,nT=0;try{if(G.s.results.length){pos=tablePos();nT=table().length;}}catch(e){}
  let gm=0,sa={};if(td){const D=v163D();if(D.y===G.s.year){gm=D.gm||0;sa=D.sa||{};}}
  return {td,sq,R,c,E,pl,relF,S,T,lv,lead,inf,nat,age,ten,unk,jeal,expect,pos,nT,gm,sa};}
const V163_LV=['Takım liderleri','Etkili oyuncular','Kadro oyuncuları','Yeni gelenler ve gençler'];
/* ---------- mutluluk nedenleri ---------- */
function v163Why(p,C){const out=[],m=G.m||{},td=C.td,x=C.E[p.k];const D=td?v163D():null,now=V163_AD();
  if(td&&(m.bw||{})[p.k]>=3)out.push(['sure',`${m.bw[p.k]} haftadır oynamıyor`,-3]);
  else if(C.gm>=3||(x&&C.pl>=3)){const q=C.gm>=3?(C.sa[p.k]||0)/C.gm:x.st/C.pl,ex=C.expect.has(p.k);if(ex&&q<0.4)out.push(['sure','Beklediği süreyi alamıyor',-3]);else if(q>=0.7)out.push(['sure','Düzenli oynuyor',2]);else if(!ex&&q>=0.3)out.push(['sure','Beklediğinden çok oynuyor',1]);}
  try{const ce=ctEnd(p);if(ce<=G.s.year&&p.ovr>=C.c.str-2)out.push(['szl','Sözleşmesi bitiyor',-2]);}catch(e){}
  if(C.jeal.has(p.k))out.push(['szl','Maaşını az buluyor',-2]);
  if(td){if(D.prom.some(r=>r.k===p.k))out.push(['vaat','Verilen sözü bekliyor',1]);
    if(D.br[p.k]&&now-D.br[p.k]<150)out.push(['vaat','Sözü tutulmadı',-4]);else if(D.kp[p.k]&&now-D.kp[p.k]<120)out.push(['vaat','Sözü tutuldu',2]);}
  const gap=p.ovr-C.c.str;if(C.pos&&C.pl>=5){if(gap>=5&&C.pos>C.nT/2)out.push(['hedef','Kulübün hedefleri ona küçük geliyor',-2]);else if(C.pos<=3)out.push(['hedef','Zirve yarışı motive ediyor',2]);else if(C.pos>=C.nT-2)out.push(['hedef','Düşme hattı baskısı',-1]);}
  if(td){const r=relOf(p);if(r>=35)out.push(['hoca','Seninle arası çok iyi',2]);else if(r<=-30)out.push(['hoca','Seninle arası kötü',-3]);if((m.trq||{})[p.k])out.push(['trf','Transfer talep etti',-3]);if((m.ban||{})[p.k])out.push(['disp','Kadro dışı',-2]);}
  return out;}
const V163_WN={sure:'Süre',szl:'Sözleşme',vaat:'Söz',hedef:'Kulüp hedefi',hoca:'Hoca',trf:'Transfer',disp:'Disiplin'};
function v163Hap(p,C,W){const s=(W||v163Why(p,C)).reduce((a,x)=>a+x[2],0);const r=C.relF(p);return Math.round(clamp(50+r*0.42+s*4,0,100));}
function v163Atm(C){const sq=C.sq;if(!sq.length)return {v:50,lab:'Normal'};const avg=sq.reduce((a,p)=>a+C.relF(p),0)/sq.length;let coh=null;
  if(C.td){try{coh=hierCalc().coh;}catch(e){coh=null;}}
  if(coh==null)coh=clamp(52+avg*0.35-C.nat.filter(g=>g.mood<-15).length*7,0,100);
  const ld=C.lead.length?C.lead.reduce((a,p)=>a+C.relF(p),0)/C.lead.length:0;
  const v=Math.round(clamp(coh*0.5+(50+avg*0.8)*0.35+(50+ld*0.6)*0.15,0,100));
  return {v,coh:Math.round(coh),avg,ld,lab:v>=75?'Mükemmel':v>=60?'İyi':v>=45?'Normal':v>=30?'Gergin':'Kriz',cls:v>=60?'ok':v<40?'bad':''};}
/* ---------- sözler ---------- */
const V163_PT={sure:'Forma süresi',rol:'Daha büyük rol',kupa:'Kupada forma',trf:'Takviye transfer',ct:'Yeni sözleşme',izin:'Transfer izni'};
function v163WinEnd(){try{const I=twInfo(),d=G.s.day,base=V163_AD()-d;if(d<=I.sc)return base+I.sc;if(d<=I.wc)return base+I.wc;}catch(e){}return V163_AD()+75;}
function v163Weak(){const sq=squadOf(G.club),c=myClub(),need={KL:1,DF:4,OS:3,KN:2,FW:2};let best=null,bv=1e9;
  for(const [pos,n] of Object.entries(need)){const L=sq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).slice(0,n);const v=L.length?L.reduce((a,p)=>a+p.ovr,0)/L.length-(n-L.length)*6:0;const d=v-c.str+(pos==='KL'?1.5:0);if(d<bv){bv=d;best=pos;}}return best||'OS';}
function v163CupAlive(){try{return cupsOf().list.some(k=>k.alive&&!k.won);}catch(e){return false;}}
function v163Ap(k){const D=v163D();return D.ap[k]=D.ap[k]||{l:0,c:0};}
function v163PromNew(p,t){const D=v163D(),now=V163_AD(),a=v163Ap(p.k);const pr={id:now+'_'+p.k+'_'+t,k:p.k,n:p.name,t,from:now};
  if(t==='sure'){pr.need=2;pr.until=now+28;pr.b0=a.l+a.c;pr.txt='4 hafta içinde en az 2 maçta ilk 11';}
  else if(t==='rol'){pr.need=3;pr.until=now+42;pr.b0=a.l+a.c;pr.txt='6 hafta içinde en az 3 maçta ilk 11';}
  else if(t==='kupa'){pr.until=now+75;pr.c0=a.c;pr.txt='Sıradaki kupa maçında ilk 11';}
  else if(t==='trf'){pr.pos=v163Weak();pr.sk=squadOf(G.club).map(q=>q.k);pr.until=v163WinEnd();pr.txt=`${V163_POS[pr.pos]} mevkiine takviye transfer`;}
  else if(t==='ct'){pr.e0=ctEnd(p);pr.until=now+30;pr.txt='30 gün içinde yeni sözleşme';}
  else if(t==='izin'){pr.until=v163WinEnd();pr.txt='Uygun teklif gelirse gitmesine izin';}
  D.prom.push(pr);return pr;}
function v163Leaders(){const sq=squadOf(G.club),R=squadRoles(G.club);return sq.filter(p=>R[p.k]==='Kaptan'||R[p.k]==='Takım lideri'||(persOf(p)==='Lider'&&p.age>=26));}
function v163PrEnd(pr,res,p,why){const D=v163D(),m=G.m,now=V163_AD();const i=D.prom.indexOf(pr);if(i>=0)D.prom.splice(i,1);
  D.hist.unshift({t:pr.t,k:pr.k,n:pr.n,txt:pr.txt,res,why:why||'',from:pr.from,end:now});if(D.hist.length>30)D.hist.length=30;
  if(!p||res==='gone')return;const sq=squadOf(G.club),g=hgOf(p),mates=sq.filter(q=>q.k!==p.k&&hgOf(q)===g);
  if(res==='kept'){relAdd(p,9);for(const q of mates)relAdd(q,1);D.kp[p.k]=now;msg('squad',`Söz tutuldu: ${p.name}`,`${p.name}: “Sözünüzü tuttunuz hocam, bunu unutmayacağım.” (${pr.txt}${why?' · '+why:''}) Oyuncunun sana güveni arttı; yakın arkadaşları da durumu fark etti.`);}
  else if(res==='broken'){relAdd(p,-22);D.br[p.k]=now;const L=v163Leaders().filter(q=>q.k!==p.k),hit=[];
    for(const q of L){const same=hgOf(q)===g;relAdd(q,same?-6:-3);hit.push(ksur(q.name));}for(const q of mates)relAdd(q,-3);
    let tr='';if(relOf(p)<=-35&&!(m.trq||{})[p.k]){m.trq=m.trq||{};m.trq[p.k]=1;tr=` ${p.name} ayrıca transfer talep etti; sahada isteksiz oynayacak.`;}
    msg('squad',`Söz tutulmadı: ${p.name}`,`${p.name} kendisine verdiğin sözün (${pr.txt}) tutulmadığını düşünüyor${why?' ('+why+')':''}. Oyuncu çok kırgın.${L.length?` Takım liderleri (${hit.slice(0,3).join(', ')}) güvenilirliğini sorguluyor.`:''}${mates.length?` ${HG_N[g]||'Grubundaki oyuncular'} da huzursuz.`:''}${tr}`);}
  else msg('squad',`Söz geçersiz: ${p.name}`,`${pr.txt}: ${why||'koşullar oluşmadı'}. Oyuncu durumu anlayışla karşıladı.`);}
function v163PromTick(){const D=v163D(),m=G.m,sq=squadOf(G.club),now=V163_AD();
  for(const pr of D.prom.slice()){const p=sq.find(x=>x.k===pr.k);
    if(pr.t==='izin'){if(!p){v163PrEnd(pr,'gone',null);D.hist[0].res='kept';D.hist[0].why='Oyuncu kulüpten ayrıldı';continue;}
      const b=(m.bids||[]).find(x=>x.k===pr.k&&x.until>G.s.day);if(b){pr.bid=b.id;pr.seen=1;}else if(pr.bid){pr.bid=null;v163PrEnd(pr,'broken',p,'gelen teklifi geri çevirdin');continue;}
      if(now>=pr.until){if(relOf(p)>25)v163PrEnd(pr,'void',p,'oyuncu fikrini değiştirdi, kalmaktan memnun');else v163PrEnd(pr,'void',p,'transfer döneminde uygun teklif gelmedi');}continue;}
    if(!p){v163PrEnd(pr,'gone',null);continue;}
    const a=v163Ap(pr.k);
    if(pr.t==='sure'||pr.t==='rol'){pr.got=a.l+a.c-pr.b0;if(pr.got>=pr.need)v163PrEnd(pr,'kept',p);else if(now>=pr.until)v163PrEnd(pr,'broken',p,`${pr.got}/${pr.need} maç`);}
    else if(pr.t==='kupa'){if(now>=pr.until||!v163CupAlive())v163PrEnd(pr,'void',p,'kupa maçı oynanmadı');}
    else if(pr.t==='trf'){const nw=sq.find(x=>!pr.sk.includes(x.k)&&x.pos===pr.pos);if(nw)v163PrEnd(pr,'kept',p,`${nw.name} transfer edildi`);else if(now>=pr.until)v163PrEnd(pr,'broken',p,'transfer dönemi bitti');}
    else if(pr.t==='ct'){if(ctEnd(p)>pr.e0)v163PrEnd(pr,'kept',p,'sözleşme yenilendi');else if(now>=pr.until)v163PrEnd(pr,'broken',p,'sözleşme yenilenmedi');}}}
/* transfer izni verilen oyuncuya pencere açıkken teklif gelir */
function v163IzinBid(pr){const m=G.m,p=squadOf(G.club).find(x=>x.k===pr.k);if(!p||pr.seen)return;if((m.bids||[]).some(b=>b.k===p.k))return;
  const me=myClub(),cands=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&c.str>=p.ovr-6&&c.str>=me.str-6);if(!cands.length)return;const c=pick(cands);
  const fee=rnd5(pValue(p)*rnd(0.85,1.15),stepOf(pValue(p)));(m.bids=m.bids||[]).push({id:Date.now()%1e7+Math.floor(Math.random()*1000),k:p.k,club:c.id,fee,until:G.s.day+7,cnt:0});pr.seen=1;pr.bid=null;
  msg('offer',`Teklif: ${p.name}`,`${c.name}, ${p.name} için ${eur(fee)} teklif etti. Oyuncuya “uygun teklif gelirse izin veririm” demiştin; reddedersen söz bozulur. Takım › Transfer › Gelen teklifler.`);}
function v163Week(){const C=v163Calc(),D=v163D();
  for(const p of C.sq){const s=v163Why(p,C).filter(x=>['szl','hedef','vaat'].includes(x[0])).reduce((a,x)=>a+x[2],0);if(s)relAdd(p,clamp(s*0.4,-1.5,1));}
  try{if(inWindow())for(const pr of D.prom)if(pr.t==='izin'&&Math.random()<0.5)v163IzinBid(pr);}catch(e){}
  const sadL=C.lead.filter(p=>relOf(p)<-30);if(sadL.length&&Math.random()<0.25){const L=pick(sadL),g=hgOf(L);for(const q of C.sq)if(q.k!==L.k&&hgOf(q)===g)relAdd(q,-2);
    msg('squad',`Lider huzursuz: ${L.name}`,`Takımın liderlerinden ${L.name} seninle arasındaki soğukluğu soyunma odasına taşıdı. ${HG_N[g]||'Yakın çevresi'} de ona hak veriyor. Ofisinde birebir konuşmak iyi olabilir.`);}}
/* maç günlüğü: ilk 11 sayımı (sözlerin takibi için) */
function v163Sea(xi){const D=v163D();if(D.y!==G.s.year){D.y=G.s.year;D.sa={};D.gm=0;}D.gm++;for(const k of xi)D.sa[k]=(D.sa[k]||0)+1;}
mgrFinish=(old=>function(){let xi=null;try{if(isTD())xi=mgrXI().slice();}catch(e){}const r=old.apply(this,arguments);try{if(xi&&isTD()){for(const k of xi)v163Ap(k).l++;v163Sea(xi);}}catch(e){}return r;})(mgrFinish);
mgrCup=(old=>function(){let xi=null,n0=0;try{if(isTD()){xi=mgrXI().slice();n0=(G.s.cupDays||[]).length;}}catch(e){}const r=old.apply(this,arguments);
  try{if(xi&&isTD()&&(G.s.cupDays||[]).length>n0){const D=v163D();D.cupN++;for(const k of xi)v163Ap(k).c++;v163Sea(xi);const sq=squadOf(G.club),m=G.m;
      for(const pr of D.prom.slice()){if(pr.t!=='kupa')continue;const p=sq.find(x=>x.k===pr.k);if(!p)continue;if(xi.includes(pr.k))v163PrEnd(pr,'kept',p,'kupa maçında forma giydi');else if(!(m.inj||{})[pr.k]&&!(m.ban||{})[pr.k])v163PrEnd(pr,'broken',p,'kupa maçında forma vermedin');}}}catch(e){console.warn(e);}return r;})(mgrCup);
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(isTD()&&G.phase==='season'){v163PromTick();const D=v163D(),wk=wkKey();if(D.wk!==wk){D.wk=wk;v163Week();}}}catch(e){console.warn(e);}return out;})(nextDay);

/* =====================================================================
   SAHNELER (SVG): ofis ve basın salonu — bitmap yok
   ===================================================================== */
let V163_ID=0;
const v163Nest=(svg,x,y,w,h)=>String(svg).replace(/<svg\b([^>]*?)\swidth="[^"]*"\s+height="[^"]*"/,'<svg$1').replace('<svg',`<svg x="${x}" y="${y}" width="${w}" height="${h}"`);
function v163Tro(cid){let n=0;try{const I=(typeof CLUB_INFO!=='undefined'&&CLUB_INFO[cid])||{};n=(I.kupalar||[]).reduce((a,t)=>a+(+t[1]||0),0);}catch(e){}try{n+=(G.trophies||[]).filter(t=>t.club===cid&&!/\(TD\)/.test(t.name||'')).length;}catch(e){}return n;}
function v163Cup(x,y,s,col){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0h12l-1.2-2.6h-3v-4.4c4.6-1 7-4.6 7-10.4h-15.6c0 5.8 2.4 9.4 7 10.4v4.4h-3z" fill="${col}"/><path d="M-7.8-15.5c-3 0-3.6 4.6 0 5.6M7.8-15.5c3 0 3.6 4.6 0 5.6" fill="none" stroke="${col}" stroke-width="1.3"/></g>`;}
/* ofis: arka plan (pencere + stadyum, taktik tahtası, raf ve kupalar), ortada oturan kişi, önde masa */
function v163OfficeSVG(c,face,o){const id='o'+(++V163_ID),c1=c.c1||'#a3122a',c2=c.c2||'#ffffff',nT=v163Tro(c.id),shown=Math.min(nT,8);o=o||{};
  let cups='';for(let i=0;i<shown;i++){const big=i<2;cups+=v163Cup(318+i*18+(i>=2?6:0),126,big?0.95:0.72,big?'#e8c45a':'#c9ccd3');}
  const shelf=nT?`${cups}<text x="312" y="158" text-anchor="start" font-size="8" fill="#d9c79a" font-weight="700">${nT} KUPA</text>`:`<circle cx="340" cy="117" r="9" fill="#f4f4f4"/><path d="M334 112l6 3 5-4M333 121l7-2 5 4M340 115v4" stroke="#222" stroke-width="1.2" fill="none"/><rect x="360" y="104" width="22" height="22" fill="#2b2f36" stroke="#8a7a55" stroke-width="2"/><rect x="364" y="108" width="14" height="14" fill="${c1}"/>`;
  const X=[[22,22],[22,36],[30,52],[44,26],[44,46],[58,36]],O=[[76,20],[76,50],[90,30],[90,44]];
  return `<svg class="v163-svg" viewBox="0 0 480 220" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><defs>
   <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4049"/><stop offset="1" stop-color="#262a31"/></linearGradient>
   <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2b4d"/><stop offset=".55" stop-color="#5a4a78"/><stop offset="1" stop-color="#e3925a"/></linearGradient>
   <radialGradient id="${id}l" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7cc" stop-opacity=".9"/><stop offset="1" stop-color="#fff7cc" stop-opacity="0"/></radialGradient>
   <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5235"/><stop offset="1" stop-color="#4a2f1d"/></linearGradient></defs>
   <rect width="480" height="220" fill="url(#${id}w)"/><rect y="160" width="480" height="60" fill="#1f2228"/><rect y="158" width="480" height="3" fill="#4d525c"/>
   <g transform="translate(18 18)"><rect width="150" height="116" rx="3" fill="#14171c"/><rect x="5" y="5" width="140" height="106" fill="url(#${id}s)"/>
    <path d="M5 74L34 56H116L145 74V111H5Z" fill="${c1}"/><path d="M13 70H137M10 80H140M7 90H143" stroke="${c2}" stroke-width="1.6" opacity=".55"/>
    <path d="M5 60L36 46H114L145 60" fill="none" stroke="#d9dee6" stroke-width="2.4"/><ellipse cx="75" cy="104" rx="64" ry="10" fill="#2f8f4e"/><path d="M75 95v18" stroke="#e8f5e9" stroke-width=".8" opacity=".7"/>
    <path d="M20 56V22M130 56V22" stroke="#9aa3ad" stroke-width="2"/><rect x="13" y="16" width="14" height="7" rx="1" fill="#fff7cc"/><rect x="123" y="16" width="14" height="7" rx="1" fill="#fff7cc"/>
    <circle cx="20" cy="20" r="16" fill="url(#${id}l)"/><circle cx="130" cy="20" r="16" fill="url(#${id}l)"/><rect x="73" y="5" width="4" height="106" fill="#14171c"/></g>
   <circle cx="240" cy="30" r="13" fill="#e9e4d8" stroke="#6b5a3e" stroke-width="2"/><path d="M240 30V21M240 30l6 3" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>
   <g transform="translate(312 16)"><rect width="150" height="88" rx="3" fill="#e9ecef" stroke="#8b939c" stroke-width="3"/><rect x="8" y="8" width="134" height="72" fill="#2e7d4b"/>
    <g transform="translate(8 8)" stroke="#e8f5e9" fill="none" stroke-width=".9" opacity=".75"><rect x="2" y="2" width="130" height="68"/><path d="M67 2v68"/><circle cx="67" cy="36" r="10"/><rect x="2" y="20" width="16" height="32"/><rect x="116" y="20" width="16" height="32"/></g>
    <g transform="translate(14 12)" font-size="9" font-weight="800" font-family="Arial,sans-serif">${X.map(([x,y])=>`<text x="${x}" y="${y}" fill="#ffd23f">×</text>`).join('')}${O.map(([x,y])=>`<circle cx="${x}" cy="${y-3}" r="3.2" fill="none" stroke="#ff6b6b" stroke-width="1.4"/>`).join('')}</g>
    <path d="M60 52q14-18 34-8" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 2"/><path d="M92 41l4 3-5 1" fill="#fff"/></g>
   <rect x="306" y="140" width="162" height="6" fill="#6b4a2c"/><rect x="306" y="146" width="162" height="3" fill="#3a2717"/>${shelf}
   <path d="M186 58h108v116h-108z" rx="12" fill="#17191e" opacity=".85"/><rect x="180" y="120" width="120" height="60" rx="12" fill="#24272d"/>
   ${v163Nest(face,166,30,148,166)}
   <path d="M-10 168L490 168L500 220L-20 220Z" fill="url(#${id}d)"/><rect x="-10" y="162" width="500" height="9" fill="#8a5d3c"/>
   <g transform="translate(22 150)"><rect width="64" height="14" rx="1.5" fill="#f2efe4" transform="rotate(-4)"/><rect x="6" y="-3" width="56" height="14" rx="1.5" fill="#d8cfae" transform="rotate(-1)"/><text x="34" y="7" text-anchor="middle" font-size="6" fill="#4a3a1a" font-weight="700" transform="rotate(-1)">${esc(o.file||'OYUNCU DOSYASI')}</text></g>
   <g transform="translate(440 144)"><rect width="16" height="18" rx="3" fill="${c1}"/><path d="M16 4q7 0 7 6t-7 6" fill="none" stroke="${c1}" stroke-width="2.4"/><rect x="2" y="2" width="12" height="2" fill="${c2}"/></g>
   ${o.plate?`<g transform="translate(190 150)"><path d="M0 14L8 0H92L100 14Z" fill="#c9a227"/><text x="50" y="10" text-anchor="middle" font-size="7.4" fill="#2a1d00" font-weight="800">${esc(o.plate)}</text></g>`:`<g transform="translate(104 154)"><rect width="60" height="8" rx="2" fill="#1b1e24"/><rect x="6" y="-24" width="50" height="26" rx="2" fill="#2b2f36" transform="skewX(10)"/><rect x="9" y="-21" width="44" height="20" fill="#3d6b8f" opacity=".7" transform="skewX(10)"/></g>`}
   <path d="M300 172l26-4" stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round"/></svg>`;}
/* basın salonu: sponsor panosu, masa, isim kartı, mikrofonlar (kurmaca kanallar), flaşlar, ön planda gazeteciler */
const V163_MIC=[['ES9','#d6283a'],['TFM','#1e66d0'],['GH','#f2b705'],['SKG','#0f8a5f'],['FP','#7b3fbf'],['DR','#e05a1a']];
const V163_SP=['KORNER BANK','ADO ENERJİ','DÜDÜK TELEKOM','SAHA SU'];
function v163PressSVG(face,name,c){const id='p'+(++V163_ID),c1=c.c1||'#a3122a',c2=c.c2||'#ffffff',sh=esc((c.short||c.name||'').toUpperCase().slice(0,12));
  const mics=V163_MIC.map(([t,col],i)=>{const x=196+i*17.5,tilt=(x-240)*0.12,hy=118+(i%2)*5;return `<g><path d="M${x} 158L${x+tilt*0.2} ${hy+8}" stroke="#2a2a2a" stroke-width="1.6"/><rect x="${x-7+tilt*0.2}" y="${hy+5}" width="14" height="9" rx="1.5" fill="${col}"/><text x="${x+tilt*0.2}" y="${hy+11.6}" text-anchor="middle" font-size="5" font-weight="800" fill="#fff">${t}</text><ellipse cx="${x+tilt*0.2}" cy="${hy}" rx="4.2" ry="5.4" fill="#1a1a1a"/><path d="M${x-3+tilt*0.2} ${hy-2}h6M${x-3.5+tilt*0.2} ${hy+1}h7" stroke="#555" stroke-width=".7"/></g>`;}).join('');
  const crowd=[[18,212,1.15],[70,206,1],[122,214,1.2],[176,210,.95],[300,212,1.1],[352,206,1],[404,214,1.2],[456,208,1]].map(([x,y,s],i)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="#05080d"><circle cx="0" cy="-34" r="11"/><path d="M-24 4C-22-14-12-22 0-22S22-14 24 4Z"/>${i===2||i===5?'<rect x="10" y="-52" width="20" height="13" rx="2"/><rect x="14" y="-56" width="7" height="5"/><circle cx="20" cy="-45.5" r="4" fill="#1d2633"/>':i===3||i===6?'<path d="M14-14L22-50" stroke="#05080d" stroke-width="5" stroke-linecap="round"/><rect x="17" y="-62" width="9" height="14" rx="2"/>':''}</g>`).join('');
  const fl=[[96,150],[392,152],[150,158],[330,148],[60,160]].map(([x,y],i)=>`<circle class="v163-fl f${i}" cx="${x}" cy="${y}" r="20" fill="url(#${id}f)"/>`).join('');
  return `<svg class="v163-svg" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
   <pattern id="${id}p" width="96" height="52" patternUnits="userSpaceOnUse"><rect width="96" height="52" fill="#0f1b2d"/>
    <path d="M10 6h18v11c0 8-5.5 12-9 13.5C15.5 29 10 25 10 17Z" fill="${c1}" stroke="${c2}" stroke-width="1.4"/><text x="64" y="17" font-size="8" fill="#dfe6f0" text-anchor="middle" font-weight="800" font-family="Arial,sans-serif">${sh}</text>
    <text x="24" y="44" font-size="6.2" fill="#8fa3bf" text-anchor="middle" font-weight="700" font-family="Arial,sans-serif">${V163_SP[0]}</text><text x="72" y="44" font-size="6.2" fill="#c8a85a" text-anchor="middle" font-weight="700" font-family="Arial,sans-serif">${V163_SP[1]}</text></pattern>
   <pattern id="${id}q" width="96" height="52" patternUnits="userSpaceOnUse" x="48" y="26"><text x="48" y="30" font-size="6" fill="#6f84a3" text-anchor="middle" font-weight="700" font-family="Arial,sans-serif">${V163_SP[2]} · ${V163_SP[3]}</text></pattern>
   <radialGradient id="${id}v" cx=".5" cy=".42" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
   <radialGradient id="${id}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".3" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
   <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${shade(c1,-0.45)}"/></linearGradient></defs>
   <rect width="480" height="220" fill="url(#${id}p)"/><rect width="480" height="220" fill="url(#${id}q)" opacity=".45"/><rect width="480" height="220" fill="url(#${id}v)"/>
   <rect x="0" y="0" width="480" height="8" fill="${c1}" opacity=".85"/>
   ${v163Nest(face,170,26,140,158)}
   <rect x="70" y="150" width="340" height="9" fill="#eceff3"/><rect x="70" y="158" width="340" height="44" fill="url(#${id}t)"/><path d="M70 166H410" stroke="${c2}" stroke-width="2.2" opacity=".75"/>
   <g transform="translate(240 186)"><path d="M-14-10h28v11c0 7-8 11-14 13-6-2-14-6-14-13Z" fill="${c2}" opacity=".9"/><path d="M-10-7h20v8c0 5-6 8-10 9.5-4-1.5-10-4.5-10-9.5Z" fill="${c1}"/></g>
   <g transform="translate(110 134)"><rect width="14" height="17" rx="2" fill="#bfe3f5" opacity=".75"/><rect x="2" y="-5" width="10" height="5" fill="#1e66d0"/></g><g transform="translate(352 138)"><path d="M0 0h10l-1.5 13h-7z" fill="#dfe9f2" opacity=".7"/></g>
   <g transform="translate(206 140)"><path d="M0 12L6 0H62L68 12Z" fill="#fafafa"/><text x="34" y="9" text-anchor="middle" font-size="6.6" font-weight="800" fill="#1b2433">${esc(name)}</text></g>
   ${mics}${fl}${crowd}</svg>`;}
function v163Reporter(i){const tone=['#c08559','#e0b78a','#8d5a3b','#f3d2ad','#6b4329','#d9a77a'][i%6],hair=['#2b1a10','#5a3a1a','#111','#7a4b22','#1a1a1a','#a8752e'][i%6];
  return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#1d2a3d"/><path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="#3a4a63"/><circle cx="20" cy="17" r="8" fill="${tone}"/><path d="M12 15c0-6 4-9 8-9s8 3 8 9c-2-3-5-4-8-4s-6 1-8 4z" fill="${hair}"/><rect x="25" y="25" width="7" height="9" rx="1.5" fill="#222"/></svg>`;}
function v163MyFace(){let L;try{const age=(G.p&&G.p.age)||45;L=Object.assign({},lookOf('me','TUR',age,true),lookNow(age));try{L.hc=mixC(L.hc||'#140d09','#d9d9d9',clamp((age-40)/30,0,0.9));}catch(e){}}catch(e){L=lookOf('me','TUR',45,true);}
  const c=myClub();return faceSVG(L,{coach:true,c1:c.c1,c2:c.c2,age:(G.p&&G.p.age)||45});}
function v163Modal(h){openModal(h);try{$('#modalCard').classList.add('v163m');}catch(e){}}
openModal=(old=>function(){try{const mc=$('#modalCard');if(mc)mc.classList.remove('v163m');}catch(e){}return old.apply(this,arguments);})(openModal);

/* =====================================================================
   BASIN TOPLANTISI
   ===================================================================== */
const T163={S:'Sakin',K:'Kendinden emin',A:'Agresif',E:'Esprili',Q:'Kaçamak',O:'Övgü',L:'Eleştiri'};
const V163_J=[['Selin Akbayır','Ekran Spor 9'],['Murat Yelkenci','Tribün FM'],['Deniz Karaarslan','Saha Kenarı Gazetesi'],['Ece Tanyeri','Gol Hattı TV'],['Burak Sezginer','Futbol Postası'],['Kerem Altınok','Düdük Radyo'],['Aslı Ergüven','Korner Haber'],['Tolga Yazıcılar','Ofsayt Dergisi']];
const v163Q=(id,tag,q,a)=>({id,tag,q,a});
function v163Ctx(opp){const m=G.m,sq=squadOf(G.club);let C={};try{C=v155Ctx(opp)||{};}catch(e){C={};}
  try{C.nT=table().length;}catch(e){C.nT=18;}C.res=(G.s.results||[]).length;
  C.inj=sq.filter(p=>(m.inj||{})[p.k]&&p.ovr>=myClub().str).sort((a,b)=>b.ovr-a.ovr)[0]||null;
  try{const S=G.s.ps||{};C.top=sq.map(p=>({p,g:(S[p.k]||{}).g||0})).filter(x=>x.g>=3).sort((a,b)=>b.g-a.g)[0]||null;}catch(e){C.top=null;}
  try{const R=squadRoles(G.club);C.sad=sq.filter(p=>relOf(p)<-30&&['Kaptan','Yıldız','Takım lideri','İlk 11'].includes(R[p.k])).sort((a,b)=>relOf(a)-relOf(b))[0]||null;}catch(e){C.sad=null;}
  try{const b=(m.bids||[]).find(x=>x.until>G.s.day);if(b){const p=sq.find(x=>x.k===b.k),cl=clubObj(b.club);if(p&&cl)C.bid={p,cl};}}catch(e){}
  try{const xi=mgrXI();C.young=sq.filter(p=>xi.includes(p.k)&&p.age<=20).sort((a,b)=>b.ovr-a.ovr)[0]||null;}catch(e){C.young=null;}
  C.fans=m.fans==null?62:m.fans;C.conf=m.conf==null?50:m.conf;C.cond=m.tcond==null?92:m.tcond;try{C.riv=opp?(v163D().riv[opp.id]||0):0;}catch(e){C.riv=0;}
  try{const L=ourLastRes();if(L){const [h,,hg,ag]=L.r,us=h===G.club?hg:ag,th=h===G.club?ag:hg;C.lastL=us<th;}}catch(e){}
  return C;}
function v163PreQs(opp){const C=v163Ctx(opp),o=opp||{name:'Rakip'},on=o.name,Q=[],P=(c,q)=>{if(c)Q.push(q);};
  P(C.derby,v163Q('derby','Derbi',`${(C.derby&&C.derby.n)||'Derbi'} öncesi şehir alev alev. Bu maç sizin için ne ifade ediyor?`,[
    ['Derbi bambaşka bir maç; oyuncularım bunun bilincinde','K',{tm:2,fans:2,opp:0.5}],['Üç puanlık bir maç, sakin kalmamız gerekiyor','S',{tm:1,b:1,fans:-1}],['Rakibin bizden korktuğunu düşünüyorum','A',{tm:2,fans:3,opp:2,media:-1}],
    ['Derbiyi kazanan taraf bir hafta şehirde bedava çay içer','E',{fans:2,media:2}],['Bunu maçtan sonra konuşalım','Q',{media:-2}],['Taraftarımız bu maçın on ikinci oyuncusu olacak','O',{fans:3,tm:1}]]));
  P(C.riv>0,v163Q('riv','Rekabet',`Geçen karşılaşmadaki sözleriniz ${on} cephesinde tepki çekti. Geri adım atacak mısınız?`,[
    ['Saygısızlık niyetim yoktu','S',{opp:-1,media:1}],['Söylediklerimin arkasındayım','A',{opp:1.5,fans:2,tm:1}],['Konu benim için kapandı','Q',{}],
    ['Rakip teknik direktöre saygım büyük','O',{opp:-1.5,media:1}],['Sözlerimi bir daha okuyun, iltifattı','E',{media:2,opp:0.5}],['Cevabı sahada versinler','K',{opp:1,tm:2}]]));
  P(C.n>=3&&C.l>=2,v163Q('kriz','Form',`Son ${C.n} maçta ${C.l} yenilgi. Koltuğunuz sallanıyor mu?`,[
    ['Sorumluluk bende; çalışarak düzelteceğiz','S',{b:2,tm:1}],['Oyuncularıma sonuna kadar güveniyorum','O',{tm:3,b:-0.5}],['Koltuğunu düşünen teknik direktör bu işi yapamaz','K',{b:1,media:1}],
    ['Bazı oyuncularım beklentinin çok altında','L',{tm:-3,b:1,fans:1}],['Bu soruyu cevaplamayacağım','Q',{media:-3,b:-1}],['Sallanan tek şey sizin kameranız','E',{media:1,fans:1}]]));
  P(C.n>=3&&C.w>=3,v163Q('seri','Form',`Son ${C.n} maçta ${C.w} galibiyet. Seri sürecek mi?`,[
    ['Ayaklarımız yere basıyor, sıradaki maça bakıyoruz','S',{tm:1,b:1,opp:-0.5}],['Bu takım her rakibi yenebilir','K',{tm:2,fans:2,opp:1}],['Rakip kim olursa olsun fark etmez','A',{tm:2,opp:2,media:-1}],
    ['Seriyi oyuncular yazdı, ben sadece not tutuyorum','O',{tm:3,media:1}],['Seriyi değil oyunu konuşalım','Q',{media:-1}],['Batıl inançtan aynı kravatı takmaya devam ediyorum','E',{fans:2,media:2}]]));
  P(C.tw,v163Q('trf','Transfer','Transfer dönemi açık. Kadroya takviye yapacak mısınız?',[
    ['Kadromdan memnunum','O',{tm:2}],['Yönetimle görüşüyoruz, ihtiyaçlar belli','S',{b:1}],['Bu kadroyla hedefe ulaşmak zor','L',{tm:-4,b:-2,fans:1}],
    ['İsim vermem ama bir iki mevkiye bakıyoruz','Q',{media:1}],['Doğru oyuncu gelirse kapımız açık','K',{b:1,fans:1}],['Transfer haberlerini zaten sizden öğreniyorum','E',{media:2,b:-0.5}]]));
  P(!C.tw&&Math.random()<0.5,v163Q('trf2','Kadro','Transfer dönemi kapandı. Eksik kaldığınız bir mevki var mı?',[
    ['Bu kadroya güveniyorum','O',{tm:2}],['Altyapıdan gençlere şans vereceğiz','K',{tm:1,b:1,fans:1}],['Yönetim bizi yalnız bıraktı','A',{tm:-1,b:-4,fans:1,media:1}],
    ['Eksik varsa idmanda kapatacağız','S',{tm:1}],['Bunu kendi aramızda konuşuyoruz','Q',{media:-1}],['Kadro tam, eksik olan sadece benim saçlarım','E',{media:2,fans:1}]]));
  P(opp&&C.diff>=4,v163Q('guclu','Rakip',`${on} kâğıt üstünde sizden güçlü. Nasıl bir plan var?`,[
    ['Disiplinli savunup kontra atağa çıkacağız','S',{tm:1,opp:-0.5}],['Kimseden korkumuz yok','K',{tm:2,opp:1.5,fans:1}],['Puan alırsak büyük başarı olur','Q',{tm:-1,opp:-1,b:0.5}],
    ['Yıldızlarına saygı duyuyorum ama futbol sahada oynanır','O',{tm:1,opp:-0.5,media:1}],['Bütçeleri bizim kat kat üstümüzde, baskı onlarda','A',{tm:1,opp:1,media:1}],['Planı söylersem rakip hoca da okur','E',{media:2}]]));
  P(opp&&C.diff<=-4,v163Q('favori','Rakip',`${on} karşısında favori sizsiniz. Rehavet tehlikesi var mı?`,[
    ['Hiçbir maçı küçümsemiyoruz','S',{tm:1,opp:-0.5,b:1}],['Farklı kazanmak istiyoruz','K',{tm:2,opp:1.5,fans:2}],['Onlar bizim seviyemizde değil','A',{tm:2,opp:2.5,b:-1,media:-1}],
    ['Rakip çok iyi çalışan bir takım, saygı duyuyoruz','O',{opp:-1,media:1}],['Favori kelimesini sevmiyorum','Q',{}],['Rehavet sözlüğümüzde yok; o sözlüğü de kaybettik zaten','E',{media:2,fans:1}]]));
  P(C.pos&&C.res>=4&&C.pos<=2,v163Q('zirve','Lig',`Zirvedesiniz (${C.pos}. sıra). Şampiyonluk konuşulabilir mi?`,[
    ['Maç maç bakıyoruz','S',{tm:1,b:1}],['Hedefimiz şampiyonluk, saklamıyorum','K',{tm:2,fans:3,b:-0.5,opp:0.5}],['Erken, baskıyı istemiyoruz','Q',{}],
    ['Bu sıralamayı oyuncular hak etti','O',{tm:2}],['Rakiplerimiz bizi takip etsin','A',{fans:2,opp:1.5,media:-1}],['Mayıs’ta size pasta getiririm','E',{media:2,fans:2}]]));
  P(C.pos&&C.res>=4&&C.pos>=C.nT-2,v163Q('dusme','Lig',`Düşme hattındasınız (${C.pos}. sıra). Takım bu baskıyı kaldırabilir mi?`,[
    ['Bu takım karakterli, buradan çıkacağız','K',{tm:2,fans:1}],['Herkes aynaya bakmalı, ben de dahil','L',{tm:-1,b:2}],['Baskı yok, sadece iş var','S',{tm:1,b:1}],
    ['Taraftar bizi yalnız bırakmasın','O',{fans:2}],['Tablo yalan söylemez ama lig daha bitmedi','Q',{}],['Bazı kararlar bizi buraya getirdi, hakemler de dahil','A',{fans:1,b:-1,media:-2}]]));
  if(C.inj){const p=C.inj,s=ksur(p.name);P(1,v163Q('sakat','Sakatlık',`${p.name} sakat. Onun yokluğunu nasıl kapatacaksınız?`,[
    ['Kadromuz geniş, yerine oynayacak arkadaşına güveniyorum','O',{tm:2}],[`${s} çok önemli, onu özleyeceğiz`,'S',{pk:p.k,pv:4,tm:-0.5}],['Sistemi değiştireceğiz ama ne olduğunu söylemem','Q',{media:-1}],
    ['Sağlık ekibimiz harika iş çıkarıyor, kısa sürede döner','S',{b:0.5,pk:p.k,pv:2}],['Sakatlık bahane değil','K',{tm:1,b:1}],['Bu fikstür yoğunluğunda sakatlık kaçınılmaz','A',{media:-1,fans:1}]]));}
  if(C.top){const p=C.top.p,s=ksur(p.name);P(1,v163Q('golcu','Oyuncu',`${p.name} ${C.top.g} golle formda. Bu maçta da ondan gol bekliyor musunuz?`,[
    [`${s} bizim en önemli silahımız`,'O',{pk:p.k,pv:5,tm:-0.5}],['Golü kimin attığı önemli değil','S',{tm:2}],['Daha fazlasını yapabilir, bekliyorum','L',{pk:p.k,pv:-3,b:0.5}],
    ['Onu çok övmeyeceğim, şımarmasın','E',{pk:p.k,pv:-1,media:2}],['Rakip savunmacılar bu gece uyuyamaz','A',{pk:p.k,pv:3,opp:1}],['Bunu sahada göreceğiz','Q',{}]]));}
  if(C.sad){const p=C.sad;P(1,v163Q('mutsuz','Oyuncu',`${p.name}’in mutsuz olduğu ve ayrılmak istediği konuşuluyor. Doğru mu?`,[
    ['Kapım ona her zaman açık, konuşacağız','S',{pk:p.k,pv:6}],['Kimse kulüpten büyük değil','A',{pk:p.k,pv:-8,tm:1,b:1}],['Bu dedikodulara cevap vermeyeceğim','Q',{media:-2}],
    ['Çok değerli bir oyuncu, burada kalacak','O',{pk:p.k,pv:8,fans:1}],['Mutsuzsa bunu performansıyla göstersin','L',{pk:p.k,pv:-5,b:0.5}],['Mutsuz olan tek kişi malzemeci; çaylar soğuk','E',{media:2}]]));}
  if(C.bid){const p=C.bid.p,s=ksur(p.name);P(1,v163Q('teklif','Transfer',`${C.bid.cl.name}, ${p.name} için teklif yaptı. Satacak mısınız?`,[
    ['Satılık değil','K',{pk:p.k,pv:5,fans:2,b:-1}],['Doğru teklif gelirse yönetim karar verir','S',{pk:p.k,pv:-2,b:2}],['Bu konuyu basın önünde konuşmam','Q',{media:-1}],
    [`${s} bu takımın kalbi`,'O',{pk:p.k,pv:6,tm:1}],['Teklif şaka gibiydi','A',{pk:p.k,pv:2,media:-1,fans:1}],['Benim de ona teklifim var: daha çok gol atsın','E',{pk:p.k,pv:1,media:2}]]));}
  if(C.young){const p=C.young;P(1,v163Q('genc','Oyuncu',`${p.name} ${p.age} yaşında ilk 11’de. Gençlere bu kadar güvenmek risk değil mi?`,[
    ['Yetenek yaşa bakmaz','K',{pk:p.k,pv:6,b:1}],['Onu korumamız gerekiyor, adım adım','S',{pk:p.k,pv:2}],['Henüz hata yapma lüksü var, yapacak da','L',{pk:p.k,pv:-3}],
    ['Altyapımızın gururu','O',{pk:p.k,pv:5,fans:2}],['Risk almayan kazanamaz','A',{tm:1,media:-0.5}],['Yaşını bana sormayın, kimliğini ben de görmedim','E',{media:2}]]));}
  P(C.fans<45,v163Q('taraftar','Taraftar','Taraftar son maçlardan sonra tepkili. Onlara ne söylemek istersiniz?',[
    ['Tepkilerinde haklılar, özür diliyoruz','S',{fans:3,tm:-1}],['Bizi destekledikleri sürece kazanacağız','O',{fans:2}],['Islık çalmak kimseye fayda sağlamaz','A',{fans:-4,tm:1}],
    ['Cevabı sahada vereceğiz','K',{fans:1,tm:1}],['Taraftarın duygularını yorumlamak bana düşmez','Q',{fans:-1}],['Islıkları da tezahürat sayıyorum','E',{fans:1,media:1}]]));
  P(C.conf<40,v163Q('yonetim','Yönetim','Yönetimin sizden memnun olmadığı konuşuluyor. Başkanla aranız nasıl?',[
    ['Başkanla her gün konuşuyoruz, sorun yok','S',{b:2}],['Ben işime bakarım, gerisi yönetimin bileceği iş','K',{b:-1,media:1}],['Bize verilen sözler tutulmadı','A',{b:-5,fans:2,media:1}],
    ['Yönetimimizin desteği için teşekkür ederim','O',{b:3}],['Kulis haberlerine yorum yapmam','Q',{media:-1}],['Başkanla aramız, kazandıkça çok iyi','E',{b:0.5,media:2}]]));
  P(C.cond<80,v163Q('yorgun','Fikstür','Yoğun fikstür sonrası oyuncularınız yorgun görünüyor. Rotasyon yapacak mısınız?',[
    ['Herkes hazır, gerekirse rotasyon yapılır','S',{tm:1}],['Yorgunluk bahane değil','K',{tm:-1,b:1}],['Fikstürü hazırlayanlar bir gün bu tempoyla oynasın','A',{media:-1,fans:1}],
    ['Yedeklerime güveniyorum','O',{tm:2}],['Kadroyu maç saatinde göreceksiniz','Q',{media:-1}],['Ben de yorgunum ama kimse beni oyundan almıyor','E',{media:2}]]));
  P(C.lastL&&Math.random()<0.6,v163Q('hakem','Hakem','Geçen haftaki hakem kararları çok tartışıldı. Bu maçın hakeminden beklentiniz ne?',[
    ['Hakemler de insan, güveniyoruz','S',{media:1,b:1}],['Sadece adil olsun, yeter','K',{}],['Bu kez gözlerini açık tutsunlar','A',{fans:2,b:-2,media:-2}],
    ['VAR odasına kahve göndereceğim, uyanık kalsınlar','E',{media:1,fans:1,b:-0.5}],['Hakem konuşmayacağım','Q',{}],['Ligimizdeki hakem kalitesi düşük','L',{fans:2,b:-3,media:-1}]]));
  P(opp&&Math.random()<0.35,v163Q('psiko','Rakip',`${on} kampından “Onların zayıf noktalarını biliyoruz” açıklaması geldi. Cevabınız?`,[
    ['Biz de onlarınkini biliyoruz','A',{opp:1.5,tm:2,fans:1}],['Herkes konuşabilir, sahada görürüz','K',{tm:1}],['Psikolojik savaşa girmiyorum','S',{media:1,opp:-0.5}],
    ['Zayıf noktamız tatlı düşkünlüğümüz','E',{media:2}],['Yorum yok','Q',{}],['Rakibimizin açıklamalarına saygı duyuyoruz','O',{opp:-1}]]));
  P(opp,v163Q('rakip','Rakip',`${on} maçı öncesi rakibinizi nasıl değerlendiriyorsunuz?`,[
    ['Saygı duyuyoruz, zor bir maç olacak','S',{tm:1,opp:-0.5}],['Kazanmak için sahaya çıkıyoruz','K',{tm:2,opp:1,b:1}],['Onlar bizim seviyemizde değil','A',{tm:3,opp:2.5,b:-1,media:-1}],
    ['Oyun anlayışlarını takdir ediyorum','O',{opp:-1,media:1}],['Rakibi değil kendimizi düşünüyoruz','Q',{tm:1}],['Analiz ekibim üç gündür uyumuyor; sanırım iyi tanıyoruz','E',{media:2,tm:1}]]));
  /* bağlama özel sorular önce; aynı etiketten ikinci soru sona */
  const seen={},a=[],b=[];for(const q of Q){(seen[q.tag]?b:a).push(q);seen[q.tag]=1;}const head=a.slice(0,-1).sort(()=>Math.random()-0.5),tail=a.slice(-1);return head.concat(tail,b);}
function v163PostQs(R){const {gu,go}=R,opp=R.opp,on=opp?opp.name:'Rakip',win=gu>go,draw=gu===go,big=Math.abs(gu-go)>=3;let D=null;try{if(opp)D=derbyOf(G.club,opp.id);}catch(e){}const Q=[];
  if(win&&D)Q.push(v163Q('derbyw','Derbi',`${D.n||'Derbi'} sizin! ${gu}-${go}’lık galibiyeti kime armağan ediyorsunuz?`,[
    ['Taraftarımıza; bu gece onların','O',{fans:4,tm:1}],['Oyuncularıma; her şeyi verdiler','O',{tm:3}],['Rakibin sözlerine sahada cevap verdik','A',{fans:3,opp:2,media:-1}],
    ['Şehir bir süre bizim renklerimizle uyanacak','E',{fans:3,media:1}],['Bu da sonuçta üç puan','S',{b:1,fans:-1}],['Bu takımı kuran yönetimimize','O',{b:3}]]));
  else if(win&&big)Q.push(v163Q('farkw','Sonuç',`${gu}-${go}’lık farklı galibiyet. Takımın en iyi maçı mıydı?`,[
    ['Mükemmeldi, oyuncularımı tebrik ederim','O',{tm:3,b:1}],['Hâlâ düzeltecek çok şey var','L',{b:1}],['Rakip çok zayıftı','A',{opp:1.5,media:-1}],
    ['Ayaklarımız yere basmalı','S',{tm:1,b:1}],['Bu skora iddiaya girenler bu gece zengin','E',{media:2}],['Fark değil oyun önemli','Q',{}]]));
  else if(win)Q.push(v163Q('win','Sonuç',`${gu}-${go}’lık galibiyetin anahtarı neydi?`,[
    ['Takım oyunu ve disiplin','S',{tm:2,b:1}],['Oyuncularım muhteşemdi','O',{tm:3}],['Taktik planımız tuttu','K',{media:1,b:1}],
    ['Daha iyisini yapabiliriz','L',{tm:-1,b:1}],['Rakip hata yaptı, biz faydalandık','Q',{opp:1}],['Soyunma odasındaki şanslı çorabım','E',{media:2,fans:1}]]));
  else if(draw)Q.push(v163Q('draw','Sonuç','Beraberlik: bir puan mı kazandınız, iki puan mı kaybettiniz?',[
    ['Bir puan da değerli','S',{tm:1}],['Kazanmamız gereken bir maçtı','L',{tm:-1,b:0.5,fans:1}],['Hakem kararları bizi etkiledi','A',{fans:2,b:-1,media:-2}],
    ['Oyuncularım mücadeleyi hiç bırakmadı','O',{tm:2}],['Matematik öğretmenime sorayım','E',{media:2}],['Maçı izlediniz, yorumu size bırakıyorum','Q',{media:-1}]]));
  else if(big)Q.push(v163Q('farkl','Sonuç',`${go}-${gu}... Tribünlerden istifa sesleri yükseldi. Ne diyorsunuz?`,[
    ['Taraftarımızdan özür dilerim','S',{fans:3,b:1}],['İstifa etmeyeceğim, bu işi düzelteceğim','K',{b:1,tm:1}],['Bazı oyuncular bu formayı hak etmiyor','L',{tm:-5,fans:1}],
    ['Bu soruya cevap vermeyeceğim','Q',{media:-3,b:-1}],['Kötü bir gün, kimseyi suçlamam','O',{tm:2}],['Hakemin de bu skorda payı var','A',{fans:1,b:-3,media:-2}]]));
  else Q.push(v163Q('loss','Sonuç',`${on} karşısında ${go}-${gu} mağlubiyet. Sorumluluk kimde?`,[
    ['Sorumluluk tamamen bende','S',{tm:2,b:1}],['Oyuncular beklentinin altında kaldı','L',{tm:-4,b:0.5}],['Şanssızdık, oyunun hakkı bu değildi','Q',{b:-1}],
    ['Hakem maçı belirledi','A',{fans:2,b:-3,media:-3}],['Rakibi tebrik ederim, bizden iyiydiler','O',{opp:-0.5,media:2,fans:-1}],['Bu gece uyumayacağım; daha güçlü döneceğiz','K',{tm:1,fans:1}]]));
  const F=[];
  if(R.motm&&R.mine){const p=squadOf(G.club).find(x=>x.name===R.motm);if(p){const s=ksur(p.name);F.push(v163Q('motm','Oyuncu',`${p.name} maçın oyuncusu seçildi. Onun için ne söylersiniz?`,[
    [`${s} dünya klasında oynadı`,'O',{pk:p.k,pv:6,tm:-0.5}],['Bireysel değil takım başarısı','S',{tm:2}],['Daha da iyi olabilir','L',{pk:p.k,pv:-2}],
    ['Ona yeni sözleşme mi versek diye düşünüyordum, şaka şaka','E',{pk:p.k,pv:3,media:2,b:-0.5}],['Bunu ondan duymanız daha doğru','Q',{}],['Onu bu kulübe getirenlere teşekkürler','O',{b:2,pk:p.k,pv:2}]]));}}
  if(!win)F.push(v163Q('hakemp','Hakem','Maçtaki tartışmalı pozisyonlar hakkında ne düşünüyorsunuz?',[
    ['Hakemler de hata yapar, bizim hatalarımız daha fazlaydı','S',{b:1,media:1}],['Pozisyonları herkes gördü','Q',{fans:1}],['Bu ligde bazı takımlar hep korunuyor','A',{fans:3,b:-3,media:-3}],
    ['Kararlar maçın kaderini değiştirdi','L',{fans:2,b:-1,media:-1}],['Hakemle konuşmak için gözlüğümü getirmeyi unuttum','E',{media:1,fans:1}],['Hakem kararlarını değil, kendi eksiklerimizi konuşacağım','K',{tm:1,b:1}]]));
  if(win)F.push(v163Q('tribun','Taraftar','Tribünler bugün inanılmazdı. Taraftara bir mesajınız var mı?',[
    ['Bu galibiyet onların','O',{fans:3}],['Her maç böyle destek bekliyoruz','K',{fans:1,tm:1}],['Hep birlikte daha büyük gecelere','S',{fans:2,b:0.5}],
    ['Sesleri kenardan talimat vermemi bile zorlaştırdı','E',{fans:2,media:1}],['Kötü günde de yanımızda olsunlar','L',{fans:-1}],['Onlar olmasa da kazanırdık','A',{fans:-5,media:-1}]]));
  F.push(v163Q('sonraki','Gelecek','Önümüzdeki maç için hedefiniz ne?',[
    ['Aynı ciddiyetle devam','S',{tm:1}],['Kazanmaktan başka hedefimiz yok','K',{tm:1,fans:1,b:0.5}],['Önce dinlenmemiz gerekiyor','Q',{}],
    ['Bu oyuncularla her maçı kazanabiliriz','O',{tm:2}],['Bazı oyuncular şansını kaybetti, değişiklik olacak','L',{tm:-2,b:1}],['Hedef? Önce bu geceyi kutlayalım, sonra düşünürüz','E',{media:1,fans:1,b:-0.5}]]));
  return Q.concat([pick(F)]);}
function v163Fx(e){if(!e)return '';const o=[],ar=v=>Math.abs(v)>=3?(v>0?'▲▲':'▼▼'):(v>0?'▲':'▼'),add=(n,v,rev)=>{if(!v)return;o.push(`<i class="${(rev?-v:v)>0?'up':'dn'}">${n} ${ar(v)}</i>`);};
  add('Takım',(e.tm||0)+(e.morale||0));add('Yönetim',(e.b||0)+(e.board||0));add('Taraftar',e.fans||0);add('Medya',e.media||0);
  if(e.pk){const p=pByKey(e.pk);if(p)add(ksur(p.name),e.pv||0);}if(e.opp)o.push(`<i class="${e.opp>0?'dn':'up'}">${e.opp>0?'Rakip hırslanır':'Rakip gevşer'}</i>`);if(e.promise)o.push('<i class="dn">Söz verdin</i>');
  return o.join('')||'<i class="nt">Etkisiz</i>';}
let V163P=null;
function v163Meters(){const m=G.m,h=Math.round(clamp(50+harm()/1.6,0,100)),b=Math.round(m.conf==null?50:m.conf),f=Math.round(m.fans==null?62:m.fans),md=Math.round(m.media==null?50:m.media);
  const M=(n,v)=>`<div><span>${n}</span><i><em style="width:${v}%" class="${v>=60?'ok':v<40?'bad':''}"></em></i><b>${v}</b></div>`;return `<div class="v163-hud">${M('Takım',h)}${M('Yönetim',b)}${M('Taraftar',f)}${M('Medya',md)}</div>`;}
function v163PressRender(){const P=V163P;if(!P)return;const c=myClub(),face=v163MyFace(),nm=PN();
  const stage=`<div class="v163-stage">${v163PressSVG(face,nm,c)}<span class="v163-live">● CANLI</span><span class="v163-tit">${P.kind==='pre'?'Maç öncesi basın toplantısı':'Maç sonu basın toplantısı'}</span></div>`;
  if(P.done){const S=P.sum;v163Modal(`<div class="v163-sc v163-pr">${stage}<div class="v163-body"><h3>Toplantı bitti</h3>
    <ul class="v163-log">${P.log.map(x=>`<li><small>${esc(x.j)}</small><b>“${esc(x.q)}”</b><span><u class="v163-tone t-${x.tn}">${T163[x.tn]||''}</u> ${esc(x.a)}</span></li>`).join('')}</ul>
    <p class="v163-fx">${v163Fx(S)}</p>${v163Meters()}<button class="cta" data-act="v163PrEnd">${P.kind==='pre'?'Maça çık':'Salondan ayrıl'}</button></div></div>`);return;}
  const Q=P.qs[P.i],J=V163_J[(P.j0+P.i)%V163_J.length];
  v163Modal(`<div class="v163-sc v163-pr">${stage}<div class="v163-body">${v163Meters()}
   <div class="v163-q ng-id"><div class="v163-qh">${v163Reporter(P.j0+P.i)}<div><b>${esc(J[0])}</b><small>${esc(J[1])}</small></div><em>${esc(Q.tag||'Soru')} · ${P.i+1}/${P.qs.length}</em></div><p>“${esc(Q.q)}”</p></div>
   ${P.last?`<p class="v163-react">${P.last}</p>`:''}
   <div class="v163-ans">${Q.a.map((A,i)=>{const tn=A.length>=3?A[1]:'S',e=A.length>=3?A[2]:A[1];return `<button class="v163-a" data-act="v163PrA" data-i="${i}"><u class="v163-tone t-${tn}">${T163[tn]}</u><b>${esc(A[0])}</b><span class="v163-fx">${v163Fx(e)}</span></button>`;}).join('')}</div>
   <div class="v163-foot"><button class="btn ghost sm" data-act="v163PrSkip">${P.i?'Toplantıyı bitir':'Toplantıya katılma'}</button><small class="muted">Cevabın tonu takımı, yönetimi, taraftarı, medyayı ve rakibi etkiler.</small></div></div></div>`);}
function v163PressOpen(P){P.i=P.i||0;P.log=[];P.sum={};P.j0=hash((P.kind||'')+G.s.day+G.s.year)%V163_J.length;V163P=P;v163PressRender();}
function v163Apply(e,P){const m=trInit()||G.m,sq=squadOf(G.club),tm=(e.tm||0)+(e.morale||0);
  if(tm)for(const p of sq){const ps=persOf(p);relAdd(p,tm*(ps==='Hassas'?1.3:ps==='Profesyonel'?0.7:1));}
  const b=(e.b||0)+(e.board||0);if(b)m.conf=clamp((m.conf==null?50:m.conf)+b,0,100);if(e.fans)m.fans=clamp(m.fans+e.fans,0,100);if(e.media)m.media=clamp(m.media+e.media,0,100);
  if(e.opp){if(P.kind==='pre')m.pcOpp=(m.pcOpp||0)+e.opp;else if(P.oppId){const D=v163D();D.riv[P.oppId]=clamp((D.riv[P.oppId]||0)+e.opp,-2,4);}}
  if(e.pk){const p=sq.find(x=>x.k===e.pk);if(p)relAdd(p,e.pv||0);}if(e.promise)m.promise={day:G.s.day};
  const S=P.sum;for(const k of ['tm','b','fans','media','opp'])S[k]=(S[k]||0)+(k==='tm'?tm:k==='b'?b:(e[k]||0));if(e.pk){S.pk=e.pk;S.pv=(S.pv||0)+(e.pv||0);}}
const V163_RE={S:['Gazeteciler not alıyor; sakin tavrın salona yayıldı.','Salon sessizleşti, cevabın dengeli bulundu.'],K:['Kameralar sana döndü: “Kendinden emin” manşetleri hazırlanıyor.','Flaşlar patladı; özgüvenin salonda hissedildi.'],
  A:['Salonda uğultu! Bu sözler yarın manşette olacak.','Gazeteciler birbirine baktı; sert çıkışın rakip kampa da ulaşacak.'],E:['Salonda kahkahalar yükseldi.','Esprin sosyal medyada şimdiden dolaşıyor.'],Q:['Gazeteci tatmin olmadı, not defterine bir şeyler karaladı.','Cevapsız kalan soru salonda asılı kaldı.'],
  O:['Övgülerin soyunma odasına ulaşacak.','Sıcak sözlerin salonda olumlu karşılandı.'],L:['Sözlerin soyunma odasında tartışılacak.','Eleştirin kameralara yansıdı; oyuncular bunu duyacak.']};
ACTX.v163PrA=el=>{const P=V163P;if(!P||P.done)return;const Q=P.qs[P.i],A=Q.a[+el.dataset.i];if(!A)return;const tn=A.length>=3?A[1]:'S',e=A.length>=3?A[2]:A[1];
  v163Apply(e,P);P.log.push({q:Q.q,a:A[0],tn,j:V163_J[(P.j0+P.i)%V163_J.length].join(' · ')});
  const m=G.m;if(P.kind==='inbox'&&m.press){(m.pressLog=m.pressLog||[]).unshift({d:G.s.day,q:Q.q,a:A[0]});if(m.pressLog.length>20)m.pressLog.length=20;m.press.i=P.i+1;}
  if(P.kind==='pre'&&(e.opp||0)>=1.5)P.mind=1;P.last=esc(pick(V163_RE[tn]||V163_RE.S));P.i++;
  if(P.i>=P.qs.length){P.done=true;if(P.kind==='inbox'&&m.press)m.press.done=true;}save();v163PressRender();};
ACTX.v163PrSkip=()=>{const P=V163P;if(!P)return;const m=trInit()||G.m;if(!P.log.length){m.media=clamp((m.media==null?50:m.media)-2,0,100);if(P.kind==='pre')m.conf=clamp((m.conf==null?50:m.conf)-1,0,100);toast('Basın toplantısına katılmadın (medya ilişkisi −2)');}
  if(P.kind==='inbox'&&m.press)m.press.done=true;P.done=true;P.skip=1;ACTX.v163PrEnd();};
ACTX.v163PrEnd=()=>{const P=V163P;V163P=null;try{const m=G.m;if(P&&P.mind&&P.opp)msg('press',`${P.opp.name} cephesinden yanıt`,`Basın toplantısındaki sözlerin rakip kampta panoya asıldı. ${P.opp.name} oyuncuları bu maça daha hırslı çıkacak; ama senin oyuncuların da arkanda durduğunu hissetti.`);
    if(P&&!P.skip&&P.log.length&&P.kind!=='pre'){toast('Basın toplantısı tamamlandı');}}catch(e){}save();closeModal();render();if(P&&P.next)P.next();};
/* pencere başka bir yolla kapanırsa (Esc) maç yine başlasın */
closeModal=(old=>function(){const P=V163P;const r=old.apply(this,arguments);try{if($('#modal').hidden)$('#modalCard').classList.remove('v163m');if(P&&$('#modal').hidden){V163P=null;if(P.next)setTimeout(P.next,0);}}catch(e){}return r;})(closeModal);
/* maç öncesi */
pressConf=(old=>function(opp,next){try{if(isTD()){const m=G.m,D=v163D();if(opp&&D.riv[opp.id]){m.pcOpp=(m.pcOpp||0)+D.riv[opp.id]*0.5;}
      if(m.pcDay===G.s.day||Math.random()>0.45){if(opp)delete D.riv[opp.id];next();return;}m.pcDay=G.s.day;const qs=v163PreQs(opp);if(opp)delete D.riv[opp.id];
      if(qs.length){v163PressOpen({kind:'pre',opp,oppId:opp&&opp.id,qs:qs.slice(0,2),next});return;}}}catch(e){console.warn(e);}return old.apply(this,arguments);})(pressConf);
/* maç sonu (sonuç ekranından) */
ACTX.v155PostPress=(old=>function(el){if(!isTD()||!V155_POST)return old.apply(this,arguments);const P=V155_POST;V155_POST=null;closeModal();
  try{const {gu,go,f}=P,opp=CLUBS[f[0]===G.club?f[1]:f[0]],D=v163D(),m=G.m;D.ppDay=G.s.day;if(m.press&&!m.press.done&&m.press.kind!=='pre')m.press.done=true;
    v163PressOpen({kind:'post',opp,oppId:opp&&opp.id,qs:v163PostQs({gu,go,opp,motm:P.motm,mine:P.mine})});}catch(e){console.warn(e);}})(ACTX.v155PostPress);
/* gelen kutusundaki maç sonu toplantısı */
pressNew=(old=>function(kind,ctx){try{if(isTD()&&kind!=='pre'){const D=v163D();if(D.ppDay!=null&&G.s.day-D.ppDay<=1&&D.ppDay<=G.s.day)return;}}catch(e){}const r=old.apply(this,arguments);
  try{const m=G.m;if(isTD()&&m.press&&!m.press.done&&kind!=='pre'){const L=ourLastRes();if(L){const [h,a,hg,ag]=L.r,us=h===G.club?hg:ag,th=h===G.club?ag:hg,opp=CLUBS[h===G.club?a:h];
      m.press.qs=v163PostQs({gu:us,go:th,opp}).map(q=>({q:q.q,a:q.a,tag:q.tag}));m.press.oppId=opp&&opp.id;m.press.v=163;}}}catch(e){console.warn(e);}return r;})(pressNew);
pressModal=(old=>function(){try{const m=G.m,P=m&&m.press;if(isTD()&&P&&!P.done&&P.qs&&P.qs.length){const opp=P.oppId?CLUBS[P.oppId]:null;v163PressOpen({kind:'inbox',opp,oppId:P.oppId,qs:P.qs,i:P.i||0});V163P.kind='inbox';return;}}catch(e){console.warn(e);}return old.apply(this,arguments);})(pressModal);

/* =====================================================================
   OFİS: teknik direktör birebir görüşmeler
   ===================================================================== */
const V163_OG=[['talep','Talebi'],['ovgu','Övgü'],['elst','Eleştiri'],['moti','Motivasyon'],['soz','Söz ver'],['rol','Rol konuş'],['szl','Sözleşme'],['disp','Disiplin']];
const V163_OF=[
  {id:'ov_form',g:'ovgu',l:'Son maçlardaki formunu öv',d:'Sahadaki katkısını takdir et',f:X=>X.f>=6.9?{d:X.ps==='Hassas'?10:7,txt:pick(['Teşekkürler hocam, böyle devam edeceğim.','Bunu sizden duymak çok iyi geldi hocam.'])}:{d:-3,txt:'Formumun farkındayım hocam, boş övgüye gerek yok.'}},
  {id:'ov_idman',g:'ovgu',l:'İdmandaki çalışkanlığını takdir et',d:'Emeğini gördüğünü söyle',f:X=>({d:X.ps==='Profesyonel'?6:X.ps==='Asi'?1:4,txt:X.ps==='Asi'?'İdman idman... Ben maçlarda oynamak istiyorum.':'Her gün en iyisini vermeye çalışıyorum hocam.'})},
  {id:'ov_lider',g:'ovgu',l:'Soyunma odasındaki etkisini öv',d:'Takımdaki ağırlığını vurgula',f:X=>X.lv<=1?{d:6,team:1,txt:'Arkadaşlarım bana güveniyor, ben de size. Takımı bir arada tutacağım.'}:{d:-1,txt:'Soyunma odasında pek sözüm geçmiyor ki hocam.'}},
  {id:'el_form',g:'elst',l:'Formunu açıkça eleştir',d:'Beklentinin altında kaldığını söyle',f:X=>{const tough=['Hırslı','Profesyonel','Lider'].includes(X.ps);if(X.f<6.6)return tough?{d:4,dev:0.15,txt:'Haklısınız. Daha çok çalışacağım, göreceksiniz.'}:{d:-7,txt:'(Gözlerini kaçırıyor) Zaten herkes beni suçluyor...'};return {d:-10,txt:'İyi oynuyorum hocam, bunu hak etmedim!'};}},
  {id:'el_tutum',g:'elst',l:'Antrenman tutumunu eleştir',d:'Disiplinsizliğe dikkat çek',f:X=>X.ps==='Hassas'?{d:-8,txt:'Bunu bana neden şimdi söylüyorsunuz? Çok üzüldüm.'}:X.ps==='Asi'?{d:-10,team:-0.5,txt:'Benim tutumum mu? Asıl sorun başka yerde hocam.'}:{d:2,dev:0.1,txt:'Tamam hocam, idmanda daha dikkatli olacağım.'}},
  {id:'el_kamu',g:'elst',l:'Değişmezse basına konuşacağını söyle',d:'Baskı kur (riskli)',f:X=>X.ps==='Hırslı'&&X.ok?{d:2,dev:0.1,txt:'Gerek kalmayacak. Cevabı sahada vereceğim.'}:{d:-9,txt:'Beni basının önüne atmak mı? Bunu unutmam hocam.'}},
  {id:'mo_hedef',g:'moti',l:'Büyük hedefler göster',d:'Milli takım, kupalar, büyük geceler',f:X=>({d:X.ps==='Hırslı'?8:X.age<=23?6:3,txt:X.age<=23?'Milli takım mı? Bunun için her şeyi yaparım!':'Bu takımla kupa kaldırmak istiyorum hocam.'})},
  {id:'mo_guven',g:'moti',l:'Ona sonuna kadar güvendiğini söyle',d:'Moral desteği ver',f:X=>X.rel<-30?(X.ok?{d:9,txt:'Bunu duymaya ihtiyacım vardı. Belki yeniden başlayabiliriz.'}:{d:1,txt:'Sözler güzel ama davranışlarınız başka şey söylüyor.'}):{d:5,txt:'Güveninizi boşa çıkarmayacağım.'}},
  {id:'mo_rakip',g:'moti',l:'Rakibiyle kıyasla, kendini kanıtlasın',d:'Rekabet duygusunu tetikle',f:X=>X.ps==='Hırslı'?{d:6,dev:0.1,txt:'Ondan iyi olduğumu herkese göstereceğim.'}:X.ps==='Hassas'?{d:-4,txt:'Beni başkasıyla kıyaslamanız hoşuma gitmedi.'}:{d:2,txt:'Anladım hocam, mesajı aldım.'}},
  {id:'mo_takim',g:'moti',l:'Takım için ne kadar önemli olduğunu anlat',d:'Aidiyet hissini güçlendir',f:X=>({d:X.R==='Yedek'?2:5,team:X.lv===0?1:0,txt:X.R==='Yedek'?'Bu kadar önemliysem neden oynamıyorum hocam?':'Bu formayı taşımak benim için onur.'})},
  {id:'sz_sure',g:'soz',l:'Forma sözü: 4 haftada 2 maç ilk 11',d:'Takip edilir; tutmazsan sert tepki',pr:'sure'},
  {id:'sz_rol',g:'soz',l:'Daha büyük rol sözü: 6 haftada 3 maç',d:'Takip edilir',pr:'rol'},
  {id:'sz_kupa',g:'soz',l:'Kupa maçlarında forma sözü',d:'Sıradaki kupa maçında ilk 11',pr:'kupa'},
  {id:'sz_trf',g:'soz',l:'Takıma takviye sözü',d:'Transfer döneminde en zayıf mevkie oyuncu',pr:'trf'},
  {id:'sz_ct',g:'soz',l:'Yeni sözleşme sözü (30 gün)',d:'Sözleşmesini yenilemen gerekir',pr:'ct'},
  {id:'sz_izin',g:'soz',l:'Uygun teklif gelirse gitmesine izin ver',d:'Gelen teklifi reddedersen söz bozulur',pr:'izin'},
  {id:'ro_anla',g:'rol',l:'Takımdaki rolünü anlat',d:'Ondan ne beklediğini açıkla',f:X=>{const d=['Yıldız','Kaptan','İlk 11','Takım lideri'].includes(X.R)?4:X.R==='Yedek'?-2:2;return {d,txt:d>=0?`Anladım hocam: ${String(X.R||'kadro oyuncusu').toLocaleLowerCase('tr-TR')} olarak üzerime düşeni yapacağım.`:'Bu rol bana yetmiyor hocam, daha fazlasını hak ediyorum.'};}},
  {id:'ro_mevki',g:'rol',l:'Farklı mevkide denemek istediğini söyle',d:'Esneklik iste',f:X=>X.ps==='Profesyonel'?{d:3,txt:'Takımın ihtiyacı neyse oradayım.'}:X.ps==='Asi'?{d:-6,txt:'Ben kendi mevkimin oyuncusuyum.'}:{d:-1,txt:'Deneriz hocam ama kendi yerimde daha iyiyim.'}},
  {id:'ro_yedek',g:'rol',l:'Rotasyon rolünü kabul etmesini iste',d:'Beklentisini düşür',f:X=>(['Profesyonel','Sakin'].includes(X.ps)||(X.R==='Yedek'&&X.age>=31))?{d:1,txt:'Anlıyorum. Şansım geldiğinde hazır olacağım.'}:{d:X.lv<=1?-9:-6,txt:'Rotasyon mu? Buraya yedek kalmak için gelmedim.'}},
  {id:'ro_abi',g:'rol',l:'Gençlere ağabeylik etmesini iste',d:'Soyunma odasında sorumluluk ver',f:X=>X.age>=27?{d:X.lv<=1?6:4,team:0.5,txt:'Memnuniyetle hocam, gençlere elimden geleni aktarırım.'}:{d:-1,txt:'Ben de daha gencim hocam, önce kendime bakmalıyım.'}},
  {id:'sc_uzat',g:'szl',l:'Sözleşme uzatma niyetini konuş',d:'Uzun vadeli planında olduğunu söyle',f:X=>({d:ctEnd(X.p)<=G.s.year+1?7:4,renew:1,txt:'Bu kulüpte kalmak isterim. Menajerim sizinle oturmaya hazır.'})},
  {id:'sc_maas',g:'szl',l:'Maaş beklentisini sor',d:'Kıskançlık ve memnuniyeti öğren',f:X=>X.jeal?{d:2,txt:'Açık konuşayım: benden az katkı veren arkadaşlar daha fazla kazanıyor.'}:{d:1,txt:'Maaşımdan memnunum hocam; beni asıl ilgilendiren sahada olmak.'}},
  {id:'di_uyar',g:'disp',l:'Sözlü uyarı ver',d:'Saha içi ve dışı disiplini hatırlat',f:X=>X.ps==='Asi'||X.rel<-20?{d:3,team:0.5,txt:'Tamam hocam, mesajı aldım.'}:{d:-2,txt:'Bunu hak edecek ne yaptım ki?'}},
  {id:'di_ceza',g:'disp',l:'Para cezası kes',d:'Takıma otorite mesajı',f:X=>({d:X.ps==='Asi'?-16:-9,team:1,txt:X.ps==='Asi'?'Kesin cezanızı, umurumda değil!':'Bunu beklemiyordum hocam.'})},
  {id:'di_kadro',g:'disp',l:'Bir hafta kadro dışı bırak',d:'Sert disiplin',f:X=>({d:-15,team:1.5,ban:1,txt:'(Kapıyı çarparak çıkıyor)'})}];
function v163Prom(X,t){const p=X.p,D=v163D(),m=G.m;if(D.prom.some(r=>r.k===p.k&&r.t===t))return {d:0,txt:'Bunu zaten söz vermiştiniz hocam, bekliyorum.'};
  const brk=D.br[p.k]&&V163_AD()-D.br[p.k]<120,trust=brk?0.4:1,pre=brk?'(Şüpheyle bakıyor) Geçen sefer de söz vermiştiniz... ':'';let d=0,txt='';
  if(t==='sure'){const st=['Yıldız','Kaptan','İlk 11','Takım lideri'].includes(X.R);d=st?3:10;txt=st?'Zaten oynuyorum ama sağ olun hocam.':'Sözünüzü not ediyorum hocam: 4 hafta içinde ilk 11’de görmek istiyorum.';}
  else if(t==='rol'){d=8;txt='Daha fazla sorumluluk istiyorum, hazırım.';}
  else if(t==='kupa'){if(!v163CupAlive())return {d:-2,txt:'Kupada yokuz ki hocam.'};d=X.R==='Yedek'||X.R==='Rotasyon'||X.R==='Genç yetenek'?6:2;txt='Kupa maçında sahada olacağım, tamam.';}
  else if(t==='trf'){d=X.p.ovr>=X.c.str?7:4;txt=`Takım güçlenirse ben de daha iyi oynarım. ${V163_POS[v163Weak()]} hattına gerçekten takviye lazım.`;}
  else if(t==='ct'){d=ctEnd(p)<=G.s.year+1?9:5;txt='Yeni sözleşme haberini menajerime ileteceğim.';}
  else if(t==='izin'){if(!(m.trq||{})[p.k]&&X.rel>-20)return {d:-4,txt:'Gitmek istediğimi kim söyledi hocam? Burada mutluyum.'};d=12;delete (m.trq||{})[p.k];txt='Teşekkür ederim hocam. Teklif gelene kadar elimden geleni yapacağım.';}
  const pr=v163PromNew(p,t);return {d:Math.round(d*trust),txt:pre+txt,pr};}
function v163X(p){const m=G.m,C=v163Calc();let f=null;try{f=pFormOf(p);}catch(e){}const ps=persOf(p),rel=relOf(p);
  return {p,ps,rel,f:f||6.7,lv:C.lv[p.k],R:C.R[p.k],age:p.age,c:C.c,jeal:C.jeal.has(p.k),ok:Math.random()<clamp(PERS_OK[ps]+((m.rep||40)-40)/200+(typeof sF==='function'?sF('yrd')*0.12:0),0.05,0.95),C};}
function v163BodyL(p){const r=relOf(p);return r>40?'gülümseyerek içeri girdi':r>15?'rahat bir tavırla oturdu':r>-10?'sandalyeye oturdu, ne diyeceğini bekliyor':r>-35?'kollarını kavuşturarak oturdu':'yüzü asık, sandalyeye çöktü';}
let V163O=null;
function v163OfOpen(k,viaTalk){const m=G.m,p=squadOf(G.club).find(x=>x.k===k);if(!p)return;const t=(m.talks||[]).find(x=>x.k===k)||null;
  if(!t){m.t1=m.t1||{};const last=m.t1[k];if(last!=null&&last<=G.s.day&&G.s.day-last<7)return toast(`${p.name} ile yakın zamanda görüştün; birkaç gün bekle`);}
  const T=t&&TALK[t.type];V163O={k,type:t?t.type:null,turns:[],left:3,used:{},g:t?'talep':'ovgu',sum:0};
  V163O.turns.push({w:'n',t:`${p.name} ${v163BodyL(p)}.`});
  if(T)V163O.turns.push({w:'p',t:T.q.replace(/^“|”$/g,''),pre:`${p.name} ${T.t}.`});else V163O.turns.push({w:'p',t:pick(relOf(p)>15?['Beni çağırmışsınız hocam, buyurun.','Hocam, ne konuşacaktık?']:relOf(p)<-20?['Evet hocam, dinliyorum.','Ne konuşacağız?']:['Buyurun hocam.','Merhaba hocam, beni görmek istemişsiniz.'])});
  v163OfRender();}
function v163OfRender(){const O=V163O;if(!O)return;const m=G.m,p=squadOf(G.club).find(x=>x.k===O.k);if(!p){V163O=null;closeModal();return;}const c=myClub(),C=v163Calc(),lv=C.lv[p.k];
  const face=faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num});const T=O.type?TALK[O.type]:null;
  const groups=V163_OG.filter(([g])=>g!=='talep'||T);const g=groups.some(x=>x[0]===O.g)?O.g:groups[0][0];
  const opts=g==='talep'?T.o.map(([k,l])=>({id:'t_'+k,l,d:'Talebine doğrudan cevap ver'})):V163_OF.filter(o=>o.g===g);
  const md=moodOf(relOf(p)),f=(()=>{try{return pFormOf(p);}catch(e){return null;}})();
  v163Modal(`<div class="v163-sc v163-of"><div class="v163-stage">${v163OfficeSVG(c,face,{file:p.name.toLocaleUpperCase('tr-TR').slice(0,18)})}<span class="v163-tit">Teknik direktörün odası</span></div>
   <div class="v163-body"><div class="v163-who ng-id"><b>${esc(p.name)}</b><small>${dpTag(p)} ${R200(p.ovr)} · ${p.age} yaş · ${esc(persOf(p))} · ${md[2]} ${md[1]} · ${V163_LV[lv]||''}${f?` · form ${f.toFixed(2)}`:''}</small></div>
   <div class="v163-chat">${O.turns.map(x=>x.w==='n'?`<p class="v163-n ng-id">${esc(x.t)}</p>`:`<div class="v163-b ng-id ${x.w}">${x.pre?`<small>${esc(x.pre)}</small>`:''}<span>${esc(x.t)}</span>${x.d!=null?`<i class="${x.d>0?'up':x.d<0?'dn':''}">${x.d>0?'Moral ▲':x.d<0?'Moral ▼':'Değişmedi'}</i>`:''}</div>`).join('')}</div>
   ${O.left>0?`<div class="v163-gr">${groups.map(([k,l])=>`<button class="chip" data-act="v163OfG" data-k="${k}" aria-pressed="${k===g}">${l}</button>`).join('')}</div>
   <div class="v163-opts">${opts.map(o=>`<button class="v163-o" data-act="v163OfA" data-id="${o.id}" ${O.used[o.id]?'disabled':''}><b>${esc(o.l)}</b><small>${esc(o.d||'')}</small></button>`).join('')}</div>`:'<p class="muted" style="margin:6px 0">Görüşme doğal sonuna geldi.</p>'}
   <div class="v163-foot"><button class="cta" data-act="v163OfEnd">${O.turns.some(x=>x.w==='me')?'Görüşmeyi bitir':'Vazgeç'}</button><small class="muted">${O.left>0?`${O.left} konu daha açabilirsin. `:''}Tepkiyi kişilik, moral ve takımdaki yeri belirler.</small></div></div></div>`);
  setTimeout(()=>{try{const ch=$('#modalCard .v163-chat');if(ch)ch.scrollTop=ch.scrollHeight;}catch(e){}},0);}
ACTX.v163OfG=el=>{if(V163O){V163O.g=el.dataset.k;v163OfRender();}};
ACTX.v163OfA=el=>{const O=V163O;if(!O||O.left<=0)return;const id=el.dataset.id,m=G.m,sq=squadOf(G.club),p=sq.find(x=>x.k===O.k);if(!p||O.used[id])return;
  O.used[id]=1;O.left--;m.t1=m.t1||{};m.t1[p.k]=G.s.day;let res={d:0,txt:''},lab='';
  if(id.startsWith('t_')){const ok=id.slice(2),i=(m.talks||[]).findIndex(t=>t.k===O.k),T=TALK[O.type];lab=(T.o.find(x=>x[0]===ok)||[,''])[1];const r0=relOf(p);
    if(i>=0){talkDo(i,ok);res={d:relOf(p)-r0,txt:((m.tlog||[])[0]||{}).r||'',raw:1};}O.type=null;O.g='ovgu';}
  else{const o=V163_OF.find(x=>x.id===id);if(!o)return;lab=o.l;const X=v163X(p);res=o.pr?v163Prom(X,o.pr):o.f(X);
    if(O.type){const i=(m.talks||[]).findIndex(t=>t.k===O.k);if(i>=0)m.talks.splice(i,1);O.type=null;}
    if(res.d)relAdd(p,res.d);if(res.dev){m.dev=m.dev||{};m.dev[p.k]=(m.dev[p.k]||0)+res.dev;}
    if(res.team){for(const q of sq)if(q.k!==p.k)relAdd(q,res.team);}
    if(res.ban){m.ban=m.ban||{};m.ban[p.k]=Math.max(m.ban[p.k]||0,1);if(m.xi)m.xi=m.xi.filter(k=>k!==p.k);}
    const lv=X.lv;if(lv===0&&Math.abs(res.d)>=8){const g=hgOf(p);for(const q of sq)if(q.k!==p.k&&hgOf(q)===g)relAdd(q,res.d>0?1:-2);res.txt+=res.d>0?'':' — Liderin tepkisi grubuna da yansıyacak.';}}
  O.turns.push({w:'me',t:lab});O.turns.push({w:'p',t:res.raw?res.txt:res.txt,d:res.d});O.sum+=res.d||0;
  if(res.pr)O.turns.push({w:'n',t:`Söz kaydedildi: ${res.pr.txt}. Dinamikler › Sözler ekranından takip edebilirsin.`});
  if(res.renew)O.renew=1;save();v163OfRender();};
ACTX.v163OfEnd=()=>{const O=V163O;V163O=null;try{if(O){const p=pByKey(O.k),said=O.turns.filter(x=>x.w==='me').map(x=>x.t);if(p&&said.length){msg('squad',`Birebir görüşme: ${p.name}`,`Konuşulanlar: ${said.join(' · ')}. Görüşme ${O.sum>0?'olumlu':O.sum<0?'gergin':'nötr'} geçti.`);
      const m=G.m;m.tlog=m.tlog||[];m.tlog.unshift({y:seasonLabel(G.s.year),w:G.s.week,n:p.name,r:said.join(' · ')});if(m.tlog.length>12)m.tlog.length=12;}
    if(O.renew){closeModal();save();render();try{renewStart(O.k);}catch(e){}return;}}}catch(e){console.warn(e);}closeModal();save();render();};
ACTX.v163Of=el=>{if(!isTD())return;v163OfOpen(el.dataset.k);};
ACTX.talk1=(old=>function(el){if(isTD())return v163OfOpen(el.dataset.k);return old.apply(this,arguments);})(ACTX.talk1);
ACTX.talkOpen=el=>{if(isTD())return v163OfOpen(el.dataset.k);talkOpen(el.dataset.k);};

/* =====================================================================
   HOCANIN ODASI: futbolcu kariyeri (hoca karşıda oturur)
   ===================================================================== */
const V163_CG=[['sure','Süre ve rol'],['gel','Gelişim'],['kar','Kariyer'],['tav','Tavır'],['kis','Kişisel']];
const V163_CO=[
  {id:'c_sure',g:'sure',l:'Daha fazla süre istiyorum',f:X=>X.trust>60||X.f>7?{tr:3,txt:'Haklısın. Önümüzdeki maçlarda sana şans vereceğim.'}:{tr:-3,txt:'Önce antrenmanda göster, sonra konuşuruz.'}},
  {id:'c_mevki',g:'sure',l:'Doğal mevkimde oynamak istiyorum',f:X=>X.trust>55?{tr:1,txt:'Değerlendireceğim. Takımın dengesi de önemli ama.'}:{tr:-2,txt:'Takımın ihtiyacı neredeyse orada oynarsın.'}},
  {id:'c_rol',g:'sure',l:'Benden ne beklediğinizi sormak istiyorum',f:X=>({tr:2,txt:`Sen bu takımda ${String(X.role||'kadro oyuncusu').toLocaleLowerCase('tr-TR')} rolündesin. ${X.f>=6.9?'Formunu koru, gerisi gelir.':'İstikrar istiyorum; iyi maçları arka arkaya diz.'}`})},
  {id:'c_takim',g:'tav',l:'Takım için ne gerekiyorsa yaparım',f:X=>({tr:3,mo:1,txt:'Bu tavrı seviyorum. Böyle oyuncularla şampiyonluk yaşanır.'})},
  {id:'c_kabul',g:'tav',l:'Eleştirilerinizi kabul ediyorum',f:X=>X.f<6.6?{tr:3,mo:-1,txt:'Olgun bir cevap. Bunu sahada da görmek istiyorum.'}:{tr:1,txt:'Seni eleştirmedim ki zaten, iyi gidiyorsun.'}},
  {id:'c_itiraz',g:'tav',l:'Kararlarınıza itiraz ediyorum',f:X=>X.trust>75&&X.ovr>=X.str+3?{tr:-2,mo:1,txt:'Fikrini söylemen güzel ama son söz benim.'}:{tr:-6,mo:1,txt:'(Masaya yaslanıyor) Bu odada kararları ben veririm, evlat.'}},
  {id:'c_ekstra',g:'gel',l:'Ekstra antrenman programı istiyorum',f:X=>{const k=(G.plan&&G.plan.focus)||'sut';let g=0;try{g=gainAttr(k,0.15);}catch(e){}bump('energy',-6);return {tr:2,txt:`Antrenörlerle ${ATTR[k]||'özel'} çalışması ayarlayalım.${g?` (${ATTR[k]} +${dec(g,2)})`:''}`};}},
  {id:'c_taktik',g:'gel',l:'Taktik bir öneri getirdim',f:X=>X.trust>=60&&X.ovr>=X.str?{tr:2,mo:2,txt:'İlginç... Bunu yardımcılarımla değerlendireceğim.'}:{tr:-3,txt:'Taktik benim işim. Sen kendi oyununa odaklan.'}},
  {id:'c_video',g:'gel',l:'Maç videolarımı birlikte izleyelim',f:X=>{let g=0;try{g=gainAttr('pas',0.08);}catch(e){}return {tr:2,mo:1,txt:'Bak şu pozisyonda erken karar verdin. Böyle anları birlikte düzelteceğiz.'};}},
  {id:'c_kaptan',g:'kar',l:'Bir gün kaptan olmak istiyorum',f:X=>(['Takım lideri','Yıldız'].includes(X.role)&&X.trust>65)?{tr:2,txt:'Bu yolda ilerliyorsun. Soyunma odası sana bakmaya başladı.'}:{tr:-1,txt:'Acele etme. Saygı zamanla kazanılır.'}},
  {id:'c_kiralik',g:'kar',l:'Kiralık gitmeyi düşünüyorum',f:X=>['Yedek','Rotasyon','Genç yetenek'].includes(X.role)?{tr:0,txt:'Mantıklı olabilir. Yönetimle konuş; ben de olumlu görüş bildiririm.'}:{tr:-4,txt:'Sana burada ihtiyacım var, bunu aklından çıkar.'}},
  {id:'c_soz',g:'kar',l:'Sözleşmem için destek istiyorum',f:X=>{if(X.trust>65){try{const cs=cstate(G.club);cs.board=clamp(cs.board+2,0,100);}catch(e){}return {tr:1,txt:'Yönetime senin hakkında iyi bir rapor vereceğim.'};}return {tr:-1,txt:'Önce sahada göster, sonra masaya otururuz.'};}},
  {id:'c_genc',g:'kar',l:'Gençlere yardımcı olmak istiyorum',f:X=>X.age>=27?{tr:2,fa:1,txt:'Harika. Gençlerin senin gibi bir örneğe ihtiyacı var.'}:{tr:0,txt:'Önce kendi gelişimine odaklan.'}},
  {id:'c_izin',g:'kis',l:'Kişisel bir konu için birkaç gün izin istiyorum',f:X=>{bump('energy',10);return {tr:-2,mo:5,txt:'Peki. Ama döndüğünde yüzde yüz hazır ol.'};}},
  {id:'c_tesek',g:'kis',l:'Bana verdiğiniz şans için teşekkür ederim',f:X=>X.trust<40?{tr:0,txt:'Teşekkürü sahada görmek istiyorum.'}:{tr:1,mo:2,txt:'Hak ettin. Devam et.'}},
  {id:'c_alis',g:'kis',l:'Takıma alışmakta zorlanıyorum',f:X=>X.yrs<=1?{tr:1,mo:3,txt:'Kapım her zaman açık. Takım arkadaşlarınla daha çok vakit geçir.'}:{tr:0,mo:1,txt:'Artık buranın bir parçasısın, kendine güven.'}}];
let V163C=null;
function v163CoOpen(force){if(!isPl()||!G.club)return;const now=V163_AD();if(!force&&G.p.coM&&now-G.p.coM<14&&now>=G.p.coM)return toast(`Hoca seni yakın zamanda kabul etti; ${14-(now-G.p.coM)} gün sonra tekrar dene`);
  G.p.coM=now;const co=coachOf(G.club);V163C={turns:[{w:'n',t:`${co.n} seni odasına aldı.`},{w:'c',t:force?'Gel otur. Kendini takımda nerede görüyorsun?':pick(['Gel bakalım, ne konuşmak istiyorsun?','Kapı açık, otur. Seni dinliyorum.'])}],left:2,used:{},g:'sure'};save();v163CoRender();}
function v163CoRender(){const S=V163C;if(!S)return;const c=myClub(),co=coachOf(G.club),L=lookOf('co:'+co.n,co.nat,co.age,true),face=faceSVG(L,{coach:true,c1:c.c1,c2:c.c2,age:co.age});const g=S.g,opts=V163_CO.filter(o=>o.g===g);
  v163Modal(`<div class="v163-sc v163-of"><div class="v163-stage">${v163OfficeSVG(c,face,{plate:('T.D. '+co.n).slice(0,22)})}<span class="v163-tit">Hocanın odası</span></div>
   <div class="v163-body"><div class="v163-who ng-id"><b>${esc(co.n)}</b><small>Teknik direktör · ${co.age} yaş · hoca güveni ${Math.round(G.p.trust)} · moral ${Math.round(G.p.morale)}${meRole()?` · rolün: ${esc(meRole())}`:''}</small></div>
   <div class="v163-chat">${S.turns.map(x=>x.w==='n'?`<p class="v163-n ng-id">${esc(x.t)}</p>`:`<div class="v163-b ng-id ${x.w==='me'?'me':'p'}"><span>${esc(x.t)}</span>${x.d!=null?`<i class="${x.d>0?'up':x.d<0?'dn':''}">${x.d>0?'Hoca güveni ▲':x.d<0?'Hoca güveni ▼':'Değişmedi'}</i>`:''}</div>`).join('')}</div>
   ${S.left>0?`<div class="v163-gr">${V163_CG.map(([k,l])=>`<button class="chip" data-act="v163CoG" data-k="${k}" aria-pressed="${k===g}">${l}</button>`).join('')}</div><div class="v163-opts">${opts.map(o=>`<button class="v163-o" data-act="v163CoA" data-id="${o.id}" ${S.used[o.id]?'disabled':''}><b>${esc(o.l)}</b></button>`).join('')}</div>`:'<p class="muted" style="margin:6px 0">Hoca saatine baktı: görüşme bitti.</p>'}
   <div class="v163-foot"><button class="cta" data-act="v163CoEnd">Odadan çık</button><small class="muted">${S.left>0?`${S.left} konu daha açabilirsin. `:''}Hocanın tepkisini güveni, formun ve takımdaki rolün belirler.</small></div></div></div>`);
  setTimeout(()=>{try{const ch=$('#modalCard .v163-chat');if(ch)ch.scrollTop=ch.scrollHeight;}catch(e){}},0);}
ACTX.v163CoG=el=>{if(V163C){V163C.g=el.dataset.k;v163CoRender();}};
ACTX.v163CoA=el=>{const S=V163C;if(!S||S.left<=0)return;const o=V163_CO.find(x=>x.id===el.dataset.id);if(!o||S.used[o.id])return;S.used[o.id]=1;S.left--;
  let yrs=1;try{yrs=clubYears();}catch(e){}const X={trust:G.p.trust,f:formAvg(),role:meRole(),age:G.p.age,ovr:OVR(),str:myClub().str,yrs};const r=o.f(X);
  if(r.tr)bump('trust',r.tr);if(r.mo)bump('morale',r.mo);if(r.fa)bump('fame',r.fa);S.turns.push({w:'me',t:o.l});S.turns.push({w:'c',t:r.txt,d:r.tr||0});save();v163CoRender();};
ACTX.v163CoEnd=()=>{const S=V163C;V163C=null;try{if(S){const said=S.turns.filter(x=>x.w==='me').map(x=>x.t);if(said.length)msg('coach','Hocayla görüşme',`Konuştuklarınız: ${said.join(' · ')}. Hoca güveni şu an ${Math.round(G.p.trust)}.`);}}catch(e){}closeModal();save();render();};
ACTX.v163Co=()=>v163CoOpen(false);
try{if(EVENTS.hoca&&!EVENTS.hoca.o.some(x=>/odasına/.test(x[0])))EVENTS.hoca.o.unshift(['Hocanın odasına gir ve konuş',()=>{setTimeout(()=>{try{v163CoOpen(true);}catch(e){}},80);return 'Hocanın odasına girdin.';}]);}catch(e){}
viewBoard=(old=>function(){const h=old.apply(this,arguments);try{if(isPl()&&G.club&&G.phase!=='retired'){const now=V163_AD(),left=G.p.coM&&now>=G.p.coM?Math.max(0,14-(now-G.p.coM)):0;
    const box=`<section class="panel v163-cob"><p class="sub-h"><span>Hocanın odası</span><span>Hoca güveni ${Math.round(G.p.trust)}</span></p><p class="muted" style="margin:0 0 8px">Teknik direktörle birebir konuş: süre, rol, gelişim, kariyer ve kişisel konular. Ne söylediğin ve nasıl söylediğin hocanın sana güvenini etkiler.</p><button class="btn" data-act="v163Co" ${left?'disabled':''}>${left?`${left} gün sonra tekrar kapısını çalabilirsin`:'Hocanın kapısını çal'}</button></section>`;
    const i=h.indexOf('</section>');if(i>0)return h.slice(0,i+10)+box+h.slice(i+10);}}catch(e){console.warn(e);}return h;})(viewBoard);

/* =====================================================================
   DİNAMİKLER EKRANI
   ===================================================================== */
let V163T='ozet';
function v163Pyr(C,ro){const L=[[],[],[],[]];for(const p of C.sq)L[C.lv[p.k]].push(p);for(const a of L)a.sort((x,y)=>C.S[y.k]-C.S[x.k]);
  const chip=p=>{const md=moodOf(C.relF(p));return `<button class="v163-pc m-${md[0]}" data-act="v163Pc" data-id="${G.club}" data-k="${p.k}"><i>${md[2]}</i>${esc(ksur(p.name))}<small>${C.R[p.k]==='Kaptan'?'C':dpTag(p)}</small></button>`;};
  return `<div class="v163-pyr">${L.map((a,i)=>`<div class="v163-pl l${i}"><p>${V163_LV[i]} <small>${a.length}</small></p><div>${a.map(chip).join('')||'<span class="muted">—</span>'}</div></div>`).join('')}</div>`;}
function v163GrpHTML(title,list,note){return `<section class="panel"><p class="sub-h"><span>${title}</span><span>${list.length}</span></p>${list.length?`<div class="hier-g">${list.map(g=>`<div class="hg ${g.mood<-15?'bad':g.mood>20?'ok':''}"><b>${esc(g.n)}</b><small>${g.L.length} oyuncu · sözcüsü ${esc(ksur(g.lead.name))} · ${moodOf(g.mood)[2]} ${moodOf(g.mood)[1]}</small><em>${g.L.slice(0,8).map(p=>esc(ksur(p.name))).join(', ')}${g.L.length>8?'…':''}</em></div>`).join('')}</div>`:'<p class="muted">Bu ölçüte göre belirgin bir grup yok.</p>'}${note?`<p class="muted" style="margin:6px 0 0">${note}</p>`:''}</section>`;}
function v163PromRows(){const D=v163D(),m=G.m,now=V163_AD(),rows=[];
  for(const pr of D.prom){const left=Math.max(0,pr.until-now);const prog=pr.t==='sure'||pr.t==='rol'?`${Math.max(0,pr.got||0)}/${pr.need} maç`:pr.t==='izin'&&pr.seen?'teklif geldi':'';rows.push({n:pr.n,k:pr.k,t:V163_PT[pr.t],txt:pr.txt,left,prog,warn:left<=7});}
  for(const pr of (m.prom||[]))rows.push({n:(pByKey(pr.k)||{}).name||'—',k:pr.k,t:'Forma süresi',txt:`${pr.need} maç ilk 11 (eski söz)`,left:Math.max(0,(pr.until-G.s.week)*7),prog:`${pr.got}/${pr.need} maç`,warn:pr.until-G.s.week<=1});
  for(const [k,v] of Object.entries(m.prom1||{}))rows.push({n:(pByKey(k)||{}).name||'—',k,t:'Forma süresi',txt:'4 hafta içinde ilk 11 (eski söz)',left:Math.max(0,v.until-G.s.day),prog:'',warn:v.until-G.s.day<=7});
  return rows;}
function v163DynView(ro,oldRel){const C=v163Calc(),A=v163Atm(C),m=G.m||{},td=C.td;const tabs=[['ozet','Özet'],['hiy','Hiyerarşi'],['grp','Gruplar'],['mut','Mutluluk'],...(td?[['soz','Sözler'],['gor',`Görüşmeler${(m.talks||[]).length?' · '+m.talks.length:''}`]]:[])];
  const t=tabs.some(x=>x[0]===V163T)?V163T:'ozet';const hap=C.sq.map(p=>{const W=v163Why(p,C);return {p,W,h:v163Hap(p,C,W)};}).sort((a,b)=>a.h-b.h);
  const head=`<div class="filt v163-tabs">${tabs.map(([k,l])=>`<button class="chip" data-act="v163T" data-k="${k}" aria-pressed="${k===t}">${l}</button>`).join('')}</div>`;
  const ronote=ro?'<p class="v163-ro">Yardımcı antrenör görünümü: dinamikleri izleyebilirsin; görüşme ve söz kararları teknik direktörün. Moral değerleri gözlemine dayanır (tahmini).</p>':'';let body='';
  if(t==='ozet'){const sad=hap.filter(x=>x.h<35).length,happy=hap.filter(x=>x.h>=70).length,P=td?v163PromRows():[],talks=td?(m.talks||[]):[];
    const iss=hap.filter(x=>x.W.some(w=>w[2]<0)).slice(0,5);
    body=`<section class="panel v163-atm"><p class="sub-h"><span>Soyunma odası havası</span><span>${A.lab}</span></p><div class="v163-gauge"><i style="left:${A.v}%"></i></div><div class="v163-gl"><span>Kriz</span><span>Gergin</span><span>Normal</span><span>İyi</span><span>Mükemmel</span></div>
      <div class="v163-kpi"><div><b>${A.v}</b><small>Hava</small></div><div><b>${A.coh}</b><small>Uyum</small></div><div><b>${happy}</b><small>Mutlu</small></div><div><b class="${sad?'dn':''}">${sad}</b><small>Mutsuz</small></div>${td?`<div><b>${P.length}</b><small>Aktif söz</small></div><div><b>${talks.length}</b><small>Görüşme talebi</small></div>`:''}</div>
      <p class="muted" style="margin:8px 0 0">Hava; grupların ruh hali, liderlerin seninle ilişkisi ve oyuncuların ortalama morali ile oluşur. Takım uyumu maç gücüne yansır.</p></section>
     ${talks.length?`<section class="panel"><p class="sub-h"><span>Seninle konuşmak isteyenler</span><span>${talks.length}</span></p>${talks.map(x=>{const p=pByKey(x.k);return p?`<div class="v163-tr"><b class="plink" data-act="v163Pc" data-id="${G.club}" data-k="${p.k}">${esc(p.name)}</b><small>${esc(TALK[x.type].t)}</small><button class="btn sm" data-act="v163Of" data-k="${p.k}">Ofisine çağır</button></div>`:'';}).join('')}</section>`:''}
     <section class="panel"><p class="sub-h"><span>Liderler</span><span>${C.lead.length}</span></p>${C.lead.length?C.lead.map(p=>{const md=moodOf(C.relF(p));return `<div class="v163-tr"><b class="plink" data-act="v163Pc" data-id="${G.club}" data-k="${p.k}">${md[2]} ${esc(p.name)}</b><small>${esc(C.R[p.k]||'')} · ${esc(persOf(p))} · ${md[1]}</small>${td?`<button class="btn sm ghost" data-act="v163Of" data-k="${p.k}">Görüş</button>`:''}</div>`;}).join(''):'<p class="muted">Belirgin bir lider yok.</p>'}</section>
     ${iss.length?`<section class="panel"><p class="sub-h"><span>Dikkat edilmesi gerekenler</span></p>${iss.map(x=>`<div class="v163-tr"><b class="plink" data-act="v163Pc" data-id="${G.club}" data-k="${x.p.k}">${moodOf(C.relF(x.p))[2]} ${esc(x.p.name)}</b><small>${x.W.filter(w=>w[2]<0).map(w=>esc(w[1])).join(' · ')}</small></div>`).join('')}</section>`:''}`;}
  else if(t==='hiy')body=`<section class="panel"><p class="sub-h"><span>Kadro hiyerarşisi</span><span>${C.sq.length} oyuncu</span></p>${v163Pyr(C,ro)}<p class="muted" style="margin:8px 0 0">Yer; kaptanlık ve takım liderliği, kişilik, yaş, kulüpteki süre ve takımdaki önem ile belirlenir. Liderler ve etkili oyuncular kırılırsa grupları da etkilenir.</p></section>`;
  else if(t==='grp')body=v163GrpHTML('Uyruk ve dil',C.nat,'Aynı dili konuşan oyuncular birbirine yakındır; grubun sözcüsünü kazanırsan diğerleri de yumuşar.')+v163GrpHTML('Yaş',C.age,'')+v163GrpHTML('Kulüpteki süre',C.ten,`Kulüpteki süre gerçek transfer kayıtlarından (FotMob) ya da oyun içi transferlerden hesaplanır.${C.unk?` ${C.unk} oyuncunun kulübe geliş tarihi bilinmediği için bu ölçüte katılmadı.`:''}`);
  else if(t==='mut')body=`<section class="panel"><p class="sub-h"><span>Oyuncu mutluluğu</span><span>${ro?'tahmini':'0–100'}</span></p><div class="v163-hap">${hap.map(x=>`<div class="v163-hr"><div class="v163-hn"><b class="plink" data-act="v163Pc" data-id="${G.club}" data-k="${x.p.k}">${esc(x.p.name)}</b><small>${dpTag(x.p)} ${R200(x.p.ovr)} · ${esc(persOf(x.p))}</small></div>
      <div class="v163-hb"><i><em style="width:${x.h}%" class="${x.h>=65?'ok':x.h<35?'bad':''}"></em></i><b>${x.h}</b></div><div class="v163-hw">${x.W.map(w=>`<u class="${w[2]>0?'up':'dn'}" title="${esc(V163_WN[w[0]]||'')}">${esc(w[1])}</u>`).join('')||'<u class="nt">Belirgin bir neden yok</u>'}</div>${td?`<button class="btn sm ghost" data-act="v163Of" data-k="${x.p.k}">Ofis</button>`:''}</div>`).join('')}</div>
      <p class="muted" style="margin:8px 0 0">Nedenler: oynama süresi, sözleşme ve maaş, verilen sözler, kulübün hedefleri ve seninle ilişkisi.</p></section>`;
  else if(t==='soz'){const R=v163PromRows(),H=v163D().hist;body=`<section class="panel"><p class="sub-h"><span>Aktif sözler</span><span>${R.length}</span></p>${R.length?R.map(r=>`<div class="v163-pr ${r.warn?'warn':''}"><div><b class="plink" data-act="v163Pc" data-id="${G.club}" data-k="${r.k}">${esc(r.n)}</b><small>${esc(r.t)} · ${esc(r.txt)}</small></div><em>${r.prog?esc(r.prog)+' · ':''}${r.left} gün</em></div>`).join(''):'<p class="muted">Şu an takip edilen bir söz yok. Ofiste “Söz ver” başlığından oyunculara söz verebilirsin.</p>'}
      <p class="muted" style="margin:8px 0 0">Tutulmayan söz oyuncunun moralini sert düşürür; liderler ve oyuncunun grubu da tepki gösterir, oyuncu transfer talep edebilir.</p></section>
     <section class="panel"><p class="sub-h"><span>Geçmiş</span><span>${H.length}</span></p>${H.length?H.slice(0,12).map(h=>`<div class="v163-pr ${h.res}"><div><b class="ng-id">${esc(h.n)}</b><small>${esc(V163_PT[h.t]||'')} · ${esc(h.txt)}${h.why?' · '+esc(h.why):''}</small></div><em>${h.res==='kept'?'Tutuldu':h.res==='broken'?'Tutulmadı':h.res==='gone'?'Ayrıldı':'Geçersiz'}</em></div>`).join(''):'<p class="muted">Henüz sonuçlanan söz yok.</p>'}</section>`;}
  else if(t==='gor'&&oldRel){let h=oldRel();h=h.replace(/<div class="talk-o">[\s\S]*?<\/div>/g,(s)=>{const k=(/data-i="(\d+)"/.exec(s)||[])[1];const tk=(m.talks||[])[+k];return tk?`<div class="talk-o"><button class="cta sm" data-act="v163Of" data-k="${tk.k}">Ofisine çağır</button></div>`:s;});body=h;}
  return `${head}${ronote}<div class="v163-dyn">${body}</div>`;}
ACTX.v163Pc=el=>showPCard(el.dataset.id,el.dataset.k);
ACTX.v163T=el=>{V163T=el.dataset.k;render();};
relView=(old=>function(){if(!isTD())return old.apply(this,arguments);try{return v163DynView(false,old);}catch(e){console.warn(e);return old.apply(this,arguments);}})(relView);
ACTX.goDyn=()=>{TAB='squad';KTAB='iliski';V163T='soz';render();window.scrollTo(0,0);};
XV.dyn=()=>{try{return `<h2 class="h">Dinamikler</h2>${v163DynView(true)}`;}catch(e){console.warn(e);return '<h2 class="h">Dinamikler</h2>';}};
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(isYrd163()&&G.phase!=='tryout'&&!L.some(x=>x[0]==='dyn'))L.push(['dyn','Dinamikler']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(isTD()){for(const [,its] of C)for(const it of its)if(it[0]==='din')it[1]='Dinamikler';}
  else if(isYrd163()){const k=C.find(x=>x[0]==='Kulüp')||C[1];if(k&&!k[1].some(x=>x[2]&&x[2].tab==='dyn'))k[1].push(['din','Dinamikler',{tab:'dyn'}]);}}catch(e){}return C;})(navCats);
try{UIG_MAP.dyn='Takım';}catch(e){}
/* ana sayfa: süresi yaklaşan sözler */
talkAlert=(old=>function(){let h=old.apply(this,arguments);try{if(isTD()){const R=v163PromRows().filter(r=>r.warn);if(R.length)h+=`<button class="talk-alert v163-al" data-act="goDyn"><b>🤝 ${R.length} sözün süresi doluyor</b><small>${R.slice(0,3).map(r=>`${esc(ksur(r.n))} (${r.left} gün)`).join(', ')} · Dinamikler › Sözler</small></button>`;}}catch(e){}return h;})(talkAlert);
