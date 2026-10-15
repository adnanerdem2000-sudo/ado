/* ================= v172: sportif direktör ve kulüp başkanı — mesleğe özel ana sayfa, haftalık kararlar, kongre/seçim, kulüp defteri, locadan izleme ================= */
/* Ölçüt: sportif direktör "yönetim güveni"yle, başkan "üye desteği" (dört üye bloğu) ve taraftar memnuniyetiyle ölçülür.
   Kararlar v155 karar kuyruğundan (v155Push / V155_DEC) gelir; haftada en az 2–3 karar hedeflenir.
   Kişi adları (rakip adaylar, yönetim kurulu, sponsor şirketleri) kurgusaldır. */

/* ---------- ortak yardımcılar ---------- */
function R172(){G.r172=G.r172||{w:-1,n:0,hist:[],tot:0,ans:0};return G.r172;}
const rlWk=()=>Math.floor(absDay()/7);
function rlRoll(){const R=R172(),w=rlWk();if(R.w!==w){if(R.w>=0){R.hist.push(R.n);if(R.hist.length>80)R.hist.shift();}R.w=w;R.n=0;}return R;}
const rlR=(v,s)=>{s=s||1e4;return Math.round(v/s)*s;};
function rlMood(){const m=G.m;if(m.hcMood==null)m.hcMood=60;return m.hcMood;}
function rlHc(d){G.m.hcMood=clamp(rlMood()+d,0,100);}
function rlLast(n){try{return G.s.results.slice(-n).map(rd=>rd.find(x=>x[0]===G.club||x[1]===G.club)).filter(Boolean).map(x=>{const u=x[0]===G.club?x[2]:x[3],o=x[0]===G.club?x[3]:x[2];return u>o?'G':u===o?'B':'M';});}catch(e){return [];}}
function rlName(seed){const P=(typeof NAMEP!=='undefined'&&(NAMEP.TR||Object.values(NAMEP)[0]))||{f:['Kerem'],l:['Yalçın']},R=srng(seed);let n='';for(let i=0;i<6;i++){n=P.f[Math.floor(R()*P.f.length)]+' '+P.l[Math.floor(R()*P.l.length)];if(n!==PN())break;}return n;}
const rlPC=k=>(G.tx&&G.tx[k])||((typeof pRaw==='function'&&pRaw(k))||{}).home;
function rlP(k){const c=rlPC(k);if(!c||!CLUBS[c])return null;return squadOf(c).find(x=>x.k===k)||null;}
const rlXI={KL:1,DF:4,OS:3,KN:2,FW:1};
function rlNeed(){const sq=squadOf(G.club);return Object.keys(rlXI).map(pos=>{const ps=sq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr),top=ps.slice(0,rlXI[pos]);return {pos,n:ps.length,avg:top.length?top.reduce((a,p)=>a+p.ovr,0)/top.length:0,old:ps.filter(p=>p.age>=31).length,exp:ps.filter(p=>{try{return ctExpiring(p);}catch(e){return false;}}).length};});}
function rlWeakest(){return rlNeed().slice().sort((a,b)=>(a.avg-(a.n<rlXI[a.pos]+1?6:0))-(b.avg-(b.n<rlXI[b.pos]+1?6:0)))[0];}
/* transfer adayları: aynı ülke ± bir kademe, bütçeye uygun, takımı güçlendiren */
function rlCands(pos,n,seed){const me=myClub(),T=curLeague().tier,cc=curLeague().cc,bud=Math.max(G.m.budget,0)/EUR_TL,tg=(G.m.sdT||[]).map(x=>x.k),out=[];
  const lgs=Object.keys(LEAGUES).filter(l=>{const L=LEAGUES[l];return !L.youth&&Math.abs(L.tier-T)<=1&&(L.cc===cc||L.tier>=T);}).sort((a,b)=>(LEAGUES[b].cc===cc)-(LEAGUES[a].cc===cc)||(a===G.s.league?-1:b===G.s.league?1:0)).slice(0,5);
  for(const l of lgs)for(const c of leagueClubs(l)){if(c.id===G.club)continue;for(const p of squadOf(c.id)){if(pos&&p.pos!==pos)continue;if(tg.includes(p.k)||p.age>31)continue;if(p.ovr<me.str-3||p.ovr>me.str+9)continue;const v=pValue(p);if(v>bud*1.6+3e5)continue;out.push({p,c:c.id,v,sc:p.ovr+(potOf(p)-p.ovr)*0.35-p.age*0.25});}}
  out.sort((a,b)=>b.sc-a.sc);const top=out.slice(0,10),R=srng(seed||(G.club+absDay()));return top.sort(()=>R()-0.5).slice(0,n||1);}
function rlTgtAdd(k,c,src){const m=G.m;m.sdT=m.sdT||[];if(m.sdT.some(x=>x.k===k))return false;m.sdT.unshift({k,c,src:src||'sen',d:absDay()});if(m.sdT.length>10)m.sdT.length=10;return true;}
/* sayaçlar: her yeni karar haftalık sayaca yazılır (önce/sonra ölçümü) */
v155Push=(old=>function(ev){const V=v155(),n0=V.q.length;let r;const om=msg,q=isRole()&&ev&&ev.k==='bid';if(q)msg=function(){};try{r=old.apply(this,arguments);}finally{if(q)msg=om;}try{if(isRole()&&V.q.length>n0){const R=rlRoll();R.n++;R.tot++;}}catch(e){}return r;})(v155Push);
/* kapanan dönemde geçersiz kalan "Teklif: X" kararları kuyruktan düşer (V6) */
function rlPurge(){try{if(!isRole()||!G.s)return;const V=v155(),m=G.m,n0=V.q.length;V.q=V.q.filter(ev=>{if(ev.k!=='bid')return true;const b=(m.bids||[]).find(x=>x.id===ev.bid);return !!(b&&b.until>G.s.day&&squadOf(G.club).some(p=>p.k===b.k));});if(V.q.length<n0&&!$('#modal').hidden&&$('#modalCard .v155-dec'))closeModal();}catch(e){}}
v155Gate=(old=>function(){rlPurge();return old.apply(this,arguments);})(v155Gate);
v155Alert=(old=>function(){rlPurge();return old.apply(this,arguments);})(v155Alert);
ACTX.v155Dec=(old=>function(el){try{if(isRole())R172().ans++;}catch(e){}const r=old.apply(this,arguments);try{if(isBsk()){rlSync();save();}}catch(e){}return r;})(ACTX.v155Dec);
try{V155_KIND.sd='Sportif direktörlük kararı';V155_KIND.bsk='Başkanlık kararı';V155_KIND.yk='Yönetim kurulu toplantısı';V155_KIND.el='Genel kurul';}catch(e){}

/* =====================================================================
   BAŞKAN: kulüp defteri, üye blokları, sponsor yuvaları
   ===================================================================== */
const BSK_W={divan:.25,tribun:.38,is:.2,genc:.17},BSK_BN={divan:'Divan ve eski üyeler',tribun:'Tribün üyeleri',is:'İş dünyası',genc:'Genç üyeler'};
const BSK_SLOT={gogus:'Göğüs (forma)',sirt:'Sırt',kol:'Kol',tedarik:'Teknik tedarikçi',stad:'Stadyum isim hakkı'};
const BSK_SLOTP={sirt:[.02,.035],kol:[.015,.025],tedarik:[.025,.04],stad:[.035,.06]};
const BSK_SP2=['Ege Lojistik','Toros Çimento','Pusula Sigorta','Akdeniz Turizm','Yıldız Gıda','Kuzey Tekstil','Mavi Kanat Havayolları','Bereket Beyaz Eşya','Doruk Enerji','Lider Market','Anka Spor Giyim','Poyraz Telekom'];
const BSK_FORMA={dusuk:['Uygun forma','Satış adedi artar, gençler memnun'],normal:['Normal',''],yuksek:['Pahalı forma','Gelir artar, taraftar homurdanır']};
const BSK_RIV=[['zengin','Zengin iş insanı','“Kendi cebimden kulübe para koyacağım.”'],['efsane','Eski futbolcu','“Kulübü futbolu bilenler yönetmeli.”'],['divan','Divan adayı','“Önce mali disiplin.”'],['reform','Genç reformcu','“Şeffaflık ve dijital üyelik.”']];
const BSK_VAAT={borc:['Borcu %20 azaltacağım','divan',4],bilet:['Bilet zammı yok','tribun',4],yildiz:['Yıldız transfer','tribun',5],altyapi:['Her sezon 2 genç A takıma','genc',5],tesis:['Tesislere yatırım','is',3]};
function bskGy(){let wb=0;try{wb=wageBill()*EUR_TL*52;}catch(e){}return Math.max(clubBudget(myClub())*VALF,wb/0.72,1e5);}
function rlDefNew(){return {y:G.s?G.s.year:0,gel:{yayin:0,mac:0,ticari:0,sponsor:0,diger:0,bagis:0},gid:{maas:0,ekip:0,isletme:0,faiz:0,yatirim:0,diger:0}};}
function bk172(){if(!isBsk()||!G.club||!CLUBS[G.club])return null;const m=G.m,B=bskInit();if(B.v172&&B.club===G.club)return B;
  const Gy=bskGy(),c=myClub(),cs=cstate(G.club),big=(typeof VIS_FIX!=='undefined'&&VIS_FIX[c.id]==='sampiyon')||c.str>=80,conf=m.conf==null?60:m.conf,E=elInit();
  B.v172=1;B.club=G.club;B.kasa=rlR(Gy*0.12);B.forma=B.forma||'normal';B.spn={};B.kadin=0;B.prim=null;B.sk=0;B.neg=0;
  B.uye={divan:clamp(conf,0,100),tribun:clamp(conf+2,0,100),is:clamp(conf,0,100),genc:clamp(conf-2,0,100),lc:conf,n:rlR(clamp(cs.cap*(big?0.9:0.35),150,60000),10),vaat:[]};
  const per=big?2:3;B.sec={per,next:(E.last||G.s.year)+per,cur:null,hist:(B.sec&&B.sec.hist)||(E.hist||[]).map(x=>({y:x.y,me:x.me,ch:x.ch,won:x.won,tip:'olagan'})),low:0,imza:null};
  B.def=rlDefNew();B.defOld=null;B.yk=['Mali işler','Futbol işleri','Sponsorluk ve pazarlama'].map((r,i)=>({n:rlName(G.club+'yk'+i+G.s.year),r}));B.sd=null;
  try{rlSync();}catch(e){}return B;}
function rlND(){const B=bk172();if(!B)return 0;return (B.debt-B.kasa)/bskGy();}
function rlSync(){const B=bk172();if(!B)return;const m=G.m,U=B.uye;const d=(m.conf==null?U.lc:m.conf)-U.lc;
  if(Math.abs(d)>0.001){U.tribun+=d*1.4;U.divan+=d*0.6;U.is+=d*0.9;U.genc+=d*0.8;}
  let c=0;for(const k in BSK_W){U[k]=clamp(U[k],0,100);c+=U[k]*BSK_W[k];}m.conf=c;U.lc=c;try{cstate(G.club).board=c;}catch(e){}}
function rlU(k,d){const B=bk172();if(!B)return;if(k==='hepsi'){for(const x in BSK_W)B.uye[x]+=d;}else B.uye[k]=(B.uye[k]||50)+d;const U=B.uye;let c=0;for(const x in BSK_W){U[x]=clamp(U[x],0,100);c+=U[x]*BSK_W[x];}G.m.conf=c;U.lc=c;}
function rlFans(d){const m=G.m;m.fans=clamp((m.fans==null?60:m.fans)+d,0,100);}
function rlKasa(v,k,grp){const B=bk172();if(!B)return;B.kasa+=v;const D=B.def;if(!D)return;if(v>=0){const g=grp||'diger';D.gel[g]=(D.gel[g]||0)+v;}else{const g=grp||'diger';D.gid[g]=(D.gid[g]||0)-v;}}
function rlSpYear(){const B=bk172();if(!B)return 0;let s=B.sp?B.sp.amt:0;for(const k in B.spn){const x=B.spn[k];if(x)s+=x.amt;}return s;}
function rlExpW(){const B=bk172();if(!B)return 1;const Gy=bskGy();let wb=0;try{wb=wageBill()*EUR_TL*52/44;}catch(e){}return wb+Gy*0.12/44;}
/* haftalık defter (eski düz çarpanlı bskWeek yerine) */
function bsk172Week(){const m=G.m,B=bk172();if(!B)return;const Gy=bskGy(),W=44,D=B.def,fans=m.fans==null?60:m.fans,ff=clamp(fans/60,0.6,1.25);
  if(!D||D.y!==G.s.year){B.defOld=D&&D.y!==G.s.year?D:B.defOld;B.def=rlDefNew();}
  const tF={dusuk:.8,normal:1,yuksek:1.2}[B.tix]||1,fF={dusuk:.9,normal:1,yuksek:1.1}[B.forma]||1,cs=cstate(G.club),capF=clamp((cs.cap||10000)/Math.max(1,B.cap0||(B.cap0=cs.cap||10000)),0.8,1.6);
  const g={yayin:Gy*.40/W,mac:Gy*.22/W*tF*ff*capF,ticari:Gy*.14/W*fF*ff,sponsor:rlSpYear()/52,diger:Gy*.05/W};
  let wb=0;try{wb=wageBill()*EUR_TL*52/W;}catch(e){}
  const x={maas:wb,ekip:Gy*.05/W,isletme:Gy*.07/W+(B.kadin?Gy*.012/W:0),faiz:0};
  if(B.debt>0){const p=Math.min(B.debt,Math.max(Gy*.004,B.debt/104));B.debt-=p;x.faiz=p;}
  let gs=0,xs=0;for(const k in g){D.gel[k]=(D.gel[k]||0)+g[k];gs+=g[k];}for(const k in x){B.def.gid[k]=(B.def.gid[k]||0)+x[k];xs+=x[k];}B.kasa+=gs-xs;B.lastW={g:gs,x:xs};
  if(B.tix==='dusuk'){rlU('tribun',.35);rlU('is',-.15);rlFans(.3);}else if(B.tix==='yuksek'){rlU('tribun',-.45);rlU('is',.2);rlFans(-.4);}
  if(B.forma==='dusuk')rlU('genc',.25);else if(B.forma==='yuksek'){rlU('genc',-.3);rlFans(-.15);}
  const ND=rlND();if(ND>0.8)rlU('divan',-.4);if(ND>1.2)rlU('hepsi',-.3);if(B.kasa<0){rlU('hepsi',-.35);B.neg=(B.neg||0)+1;}else B.neg=0;
  if(B.sp){B.sp.w--;if(B.sp.w<=0){msg('board','Göğüs sponsorluğu bitti',`${B.sp.n} ile anlaşma sona erdi.`);B.sp=null;}}
  for(const k in B.spn){const s=B.spn[k];if(!s)continue;s.w--;if(s.w<=0){msg('board',`${BSK_SLOT[k]} sponsorluğu bitti`,`${s.n} ile anlaşma sona erdi. Yeni teklifler gelecek.`);delete B.spn[k];}}
  rlSync();}
bskWeek=(old=>function(){if(bk172()){bsk172Week();return;}return old.apply(this,arguments);})(bskWeek);
/* başkan kredisi ve tesisleri kasadan */
ACTX.bskLoan=(old=>function(el){const B=bk172();if(!B)return old&&old.apply(this,arguments);const Gy=bskGy(),amt=rlR(Gy*0.15);if(B.debt>Gy*0.6)return toast('Bankalar daha fazla kredi vermiyor');B.kasa+=amt;B.debt+=rlR(amt*1.32);rlU('divan',-2);rlSync();msg('board','Kredi çekildi',`${money(amt)} kredi kasaya girdi. Faiziyle geri ödeme ${money(rlR(amt*1.32))}, haftalık taksitlerle kasadan düşülür.`);save();render();})(ACTX.bskLoan);
function rlFacCost(){return rlR(bskGy()*0.12);}
ACTX.bskFac=(old=>function(el){const B=bk172();if(!B)return old&&old.apply(this,arguments);const cs=cstate(G.club);if(cs.fac>=5)return toast('Tesisler zaten en üst seviyede');const c=rlFacCost();if(B.kasa<c)return toast('Kasada yeterli para yok');rlKasa(-c,0,'yatirim');cs.fac++;try{G.m.acadLv=Math.max(G.m.acadLv||1,cs.fac);}catch(e){}rlU('genc',3);rlU('is',1);msg('board','Tesis yatırımı',`Antrenman ve akademi tesisleri ${cs.fac}. seviyeye çıktı (${money(c)}).`);save();render();})(ACTX.bskFac);
ACTX.rlCap=()=>{const B=bk172();if(!B)return;const cs=cstate(G.club),c=rlR(bskGy()*0.18);if(B.kasa<c)return toast('Kasada yeterli para yok');if((cs.cap||0)>=90000)return toast('Stadyum kapasitesi sınırda');rlKasa(-c,0,'yatirim');cs.cap=rlR((cs.cap||10000)*1.12,100);rlU('tribun',3);rlFans(2);msg('board','Stadyum kapasitesi arttı',`Yeni tribün bölümüyle kapasite ${cs.cap.toLocaleString('tr-TR')} oldu (${money(c)}). Maç günü geliri artacak.`);save();render();};
ACTX.rlPitch=()=>{const B=bk172();if(!B)return;const cs=cstate(G.club),c=rlR(bskGy()*0.03),L=['Kötü','Orta','İyi','Çok iyi'],i=L.indexOf(cs.cond);if(i>=L.length-1)return toast('Zemin zaten çok iyi');if(B.kasa<c)return toast('Kasada yeterli para yok');rlKasa(-c,0,'yatirim');cs.cond=L[Math.max(0,i)+1];rlHc(2);msg('board','Zemin yenilendi',`Stadyum zemini yenilendi: ${cs.cond} (${money(c)}).`);save();render();};
ACTX.rlForma=el=>{const B=bk172();if(!B)return;B.forma=el.dataset.k;save();render();};
ACTX.rlBud=el=>{const B=bk172();if(!B)return;const p=+el.dataset.p,m=G.m;if(p>0){const a=rlR(Math.max(0,B.kasa)*p/100);if(a<=0)return toast('Kasada aktarılacak para yok');B.kasa-=a;m.budget+=a;msg('board','Transfer bütçesi belirlendi',`Kasadan transfer bütçesine ${money(a)} aktarıldı. Transfer bütçesi: ${money(m.budget)}.`);toast(`Transfer bütçesi +${money(a)}`);}
  else{const a=rlR(Math.max(0,m.budget)*(-p)/100);if(a<=0)return toast('Geri çekilecek bütçe yok');m.budget-=a;B.kasa+=a;rlU('divan',1);rlHc(-2);toast(`Kasaya ${money(a)} geri alındı`);}save();render();};

/* ---------- sponsorluk: yuva teklifleri ve pazarlık ---------- */
function rlSpOffer(slot,seed){const R=srng(seed),Gy=clubBudget(myClub())*VALF,cs=cstate(G.club),fans=G.m.fans==null?60:G.m.fans;const P=slot==='gogus'?[.06,.11]:BSK_SLOTP[slot];
  const y=1+Math.floor(R()*3),k=(0.85+fans/250)*(1+Math.max(0,8-((G.s.results.length?tablePos():8)))*0.01),amt=rlR(Gy*(P[0]+R()*(P[1]-P[0]))*k*(y===3?0.92:y===1?1.08:1));
  return {n:BSK_SP2[Math.floor(R()*BSK_SP2.length)],y,amt,w:y*52,slot};}
function rlSpSign(o){const B=bk172();if(!B)return;if(o.slot==='gogus'){B.sp={n:o.n,y:o.y,amt:o.amt,w:o.w};}else B.spn[o.slot]={n:o.n,y:o.y,amt:o.amt,w:o.w};rlU('is',2);msg('board','Sponsorluk imzalandı',`${BSK_SLOT[o.slot]}: ${o.n} ile ${o.y} yıllık, yıllık ${money(o.amt)} anlaşma.`);}

/* =====================================================================
   BAŞKAN: seçim, olağanüstü kongre, imza kampanyası
   ===================================================================== */
function rlRival(seed){const R=srng(seed),t=BSK_RIV[Math.floor(R()*BSK_RIV.length)];return {n:rlName(seed+'r'),tip:t[0],tn:t[1],soz:t[2],guc:+(0.25+R()*0.5).toFixed(2)};}
function rlVoteP(cur){const B=bk172(),U=B.uye,m=G.m;let s=0;for(const k in BSK_W)s+=BSK_W[k]*(U[k]-50);s=s/12+(cur.camp||0)*0.09+(cur.vk||0)*0.05-cur.ch.guc*0.6+((m.fans==null?60:m.fans)-55)/40;
  try{const n=leagueClubs(G.s.league).length,pos=G.s.results.length?tablePos():n/2;s+=(n/2-pos)/n*0.8;}catch(e){}s-=Math.max(0,rlND()-0.6)*0.6;return s;}
const rlSig=x=>1/(1+Math.exp(-x));
function rlElStart(tip){const B=bk172(),S=B.sec,days=tip==='olagan'?42:28;S.cur={tip,at:absDay()+days,ch:rlRival(G.club+'el'+G.s.year+tip+absDay()),camp:0,vk:0,acts:[],wk:-1};
  const C=S.cur;v155Push({g:'el',k:'el_open',key:C.at,t:tip==='olagan'?'Seçimli olağan genel kurul ilan edildi':'Olağanüstü seçimli genel kurul',b:`<p>${tip==='olagan'?`${myClub().name} seçimli genel kurulu <b>${days/7} hafta</b> sonra.`:`İmza kampanyası eşiği aştı: <b>${days} gün</b> içinde olağanüstü seçim yapılacak.`} Rakip aday <b>${esc(C.ch.n)}</b> (${esc(C.ch.tn)}): ${esc(C.ch.soz)}</p><p class="muted">Oy hakkı olan üye: ${B.uye.n.toLocaleString('tr-TR')}. Her hafta bir kampanya kararı vereceksin; anket ana sayfada.</p>`,o:[['aday','Aday ol, kampanyayı başlat','Üye bloklarını tek tek kazanmaya çalış'],['cekil','Aday olmayacağım','Görevin genel kurulda sona erer']]});}
V155_DEC.el_open=(ev,k)=>{const B=bk172();if(!B||!B.sec.cur)return '';if(k==='cekil'){B.sec.cur.cekil=1;B.sec.cur.at=absDay()+1;return 'Aday olmayacağını açıkladın';}msg('board','Kampanya başladı',`Rakip aday ${B.sec.cur.ch.n} ile yarışıyorsun. Kampanya kararları her hafta gelecek.`);return 'Adaylığını açıkladın';};
function rlCampEv(){const B=bk172(),C=B&&B.sec.cur;if(!C||C.cekil)return null;const left=C.at-absDay();if(left<=3)return null;const w=rlWk();if(C.wk===w)return null;C.wk=w;const i=(C.acts||[]).length%4;
  const base={g:'el',key:'c'+w,t:`Seçim kampanyası · ${Math.ceil(left/7)} hafta kaldı`};
  if(i===0)return Object.assign(base,{k:'el_blok',b:`<p>Bu hafta hangi üye grubuyla buluşacaksın? Rakip ${esc(C.ch.n)} sahada.</p>${rlBlokHTML()}`,o:Object.keys(BSK_BN).map(k=>[k,BSK_BN[k]+' ile buluş',`Memnuniyet ${Math.round(B.uye[k])} · bu blok +5`])});
  if(i===1)return Object.assign(base,{k:'el_vaat',b:'<p>Seçim beyannamene bir vaat ekle. Tutulan sözler üyeleri memnun eder, tutulmayanlar bir sonraki genel kurulda hatırlatılır.</p>',o:Object.entries(BSK_VAAT).filter(([k])=>!B.uye.vaat.some(v=>v.k===k)).slice(0,3).map(([k,v])=>[k,v[0],`${BSK_BN[v[1]]} +${v[2]}`]).concat([['yok','Vaat verme','Gerçekçi ol: divan +1']])});
  if(i===2)return Object.assign(base,{k:'el_tv',b:`<p>${esc(C.ch.n)} seni canlı yayında tartışmaya çağırdı.</p>`,o:[['kabul','Meydan okumayı kabul et','Başarı medya ve taraftara bağlı'],['red','Reddet','Tribün −2']]});
  return Object.assign(base,{k:'el_bagis',b:`<p>${C.ch.tip==='zengin'?`${esc(C.ch.n)} “kendi cebimden kulübe para koyacağım” dedi.`:'Üyeler kulübün kasasına destek bekliyor.'} Kişisel servetin: ${money(G.p.money||0)}.</p>`,o:[['bagis',`Kulübe ${money(rlR(Math.max(0,(G.p.money||0))*0.25))} bağışla`,'Geri dönmez · tüm bloklar +'],['disiplin','“Bağışla kulüp yönetilmez”','Divan +3, tribün −1'],['soz','Bağış sözü ver','Seçimden sonra ödemezsen skandal']]});}
function rlBlokHTML(){const B=bk172();if(!B)return '';return `<div class="rl-bars">${Object.keys(BSK_BN).map(k=>`<div><span>${BSK_BN[k]}</span><i><em style="width:${Math.round(B.uye[k])}%"></em></i><b>${Math.round(B.uye[k])}</b></div>`).join('')}</div>`;}
const rlCampAdd=(n,v)=>{const B=bk172(),C=B&&B.sec.cur;if(!C)return;C.acts=C.acts||[];C.acts.push(n);C.camp=(C.camp||0)+v;};
V155_DEC.el_blok=(ev,k)=>{if(!BSK_BN[k])return '';rlU(k,5);rlCampAdd(k,1);rlKasa(-rlR(bskGy()*0.002),0,'diger');return `${BSK_BN[k]}: +5`;};
V155_DEC.el_vaat=(ev,k)=>{const B=bk172();rlCampAdd('vaat',0.5);if(k==='yok'){rlU('divan',1);return 'Vaat vermedin';}const V=BSK_VAAT[k];if(!V)return '';B.uye.vaat.push({k,y:G.s.year,debt0:B.debt,st:'bekliyor'});rlU(V[1],V[2]);B.sec.cur.vk=(B.sec.cur.vk||0)+1;return `Vaat: ${V[0]}`;};
V155_DEC.el_tv=(ev,k)=>{const B=bk172(),m=G.m;if(k==='red'){rlU('tribun',-2);rlCampAdd('tv',0);return 'Tartışmayı reddettin';}const ok=Math.random()<clamp(0.35+((m.media==null?50:m.media)-50)/120+((m.fans==null?60:m.fans)-55)/150,0.15,0.8);
  rlCampAdd('tv',ok?2:-1);if(ok){rlU('hepsi',2);m.media=clamp((m.media||50)+4,0,100);msg('gundem','Canlı yayın tartışması',`${PN()} rakibi ${B.sec.cur.ch.n} karşısında rakamlarla konuştu; üyelerden olumlu tepki.`);return 'Tartışmadan güçlü çıktın';}
  rlU('tribun',-2);rlU('divan',-1);m.media=clamp((m.media||50)-4,0,100);msg('gundem','Canlı yayın tartışması',`${B.sec.cur.ch.n} tartışmada öne çıktı; kampanyan yara aldı.`);return 'Tartışma kötü geçti';};
V155_DEC.el_bagis=(ev,k)=>{const B=bk172();if(k==='bagis'){const a=rlR(Math.max(0,G.p.money||0)*0.25);if(a<=0){rlCampAdd('bagis',0);return 'Bağış yapacak paran yok';}G.p.money-=a;rlKasa(a,0,'bagis');rlU('hepsi',3);rlCampAdd('bagis',2);msg('board','Başkandan bağış',`${PN()} kulübe ${money(a)} bağışladı.`);return `Bağış: ${money(a)}`;}
  if(k==='disiplin'){rlU('divan',3);rlU('tribun',-1);rlCampAdd('bagis',0.5);return 'Mali disiplin mesajı';}B.sozBagis=rlR(Math.max(0,G.p.money||0)*0.2);rlU('hepsi',2);rlCampAdd('bagis',1.5);return 'Bağış sözü verdin';};
function rlElResolve(){const B=bk172(),S=B.sec,C=S.cur,m=G.m;S.cur=null;const n=B.uye.n,kat=clamp((LEAGUES[myClub().league].tier>=8?0.47:0.6)+((m.fans==null?60:m.fans)-60)/400+(C.tip==='olaganustu'?0.05:0),0.3,0.75),tot=Math.max(30,Math.round(n*kat));
  let p=C.cekil?0:clamp(rlSig(rlVoteP(C)+(Math.random()-0.5)*0.5),0.12,0.88);const me=Math.round(tot*p),won=!C.cekil&&me>tot-me;const pct=Math.round(p*100);
  S.hist.unshift({y:G.s.year,me:pct,ch:C.ch.n,won,tip:C.tip,tot});if(S.hist.length>12)S.hist.length=12;try{const E=elInit();E.last=G.s.year;E.hist=E.hist||[];E.hist.unshift({y:G.s.year,me:pct,ch:C.ch.n,won});}catch(e){}
  const bar=`<div class="v155-vote"><div><b>${esc(PN())}</b><i><em style="width:${pct}%"></em></i><span>%${pct} · ${me.toLocaleString('tr-TR')} oy</span></div><div><b>${esc(C.ch.n)}</b><i><em class="r" style="width:${100-pct}%"></em></i><span>%${100-pct} · ${(tot-me).toLocaleString('tr-TR')} oy</span></div></div><p class="muted">Katılım %${Math.round(kat*100)} · ${tot.toLocaleString('tr-TR')} oy kullanıldı · ${Math.max(3,Math.round(tot/450))} sandık</p>`;
  if(won){S.next=G.s.year+S.per;rlU('hepsi',3);msg('board','Yeniden başkan seçildin!',`Genel kurulda %${pct} oyla yeniden seçildin. ${S.per} yıl daha görevdesin.`);
    v155Push({g:'el',k:'el_res',key:'r'+absDay(),info:1,t:'Genel kurul: yeniden seçildin!',b:bar+`<p>Üyeler güvenini yineledi. Sonraki seçimli genel kurul ${S.next} sezonunda.</p>`,o:[['ok','Göreve devam']]});}
  else{msg('board',C.cekil?'Görevi devrettin':'Seçimi kaybettin',C.cekil?`Aday olmadın; ${C.ch.n} başkan seçildi.`:`Genel kurulda ${C.ch.n} başkan seçildi (%${100-pct}). Görevin sona erdi.`);
    v155Push({g:'el',k:'el_res',key:'r'+absDay(),info:1,t:C.cekil?'Genel kurul: görev devredildi':'Genel kurul: seçimi kaybettin',b:bar+`<p>${esc(C.ch.n)} başkan seçildi. Başka bir kulüpte aday olabilirsin.</p>`,o:[['ok','Tamam']]});rlOust(C.cekil?0:-5);}}
function rlOust(rep){const m=G.m;m.rep=clamp((m.rep||40)+rep,5,95);G.phase='off';G.summary=null;m.sacked=true;m.offers=mgrJobOffers(Math.max(10,(m.rep||30)-6),3);G.mustMove=true;}
function rlElWeek(){const B=bk172();if(!B||G.phase!=='season')return;const S=B.sec,m=G.m;
  if(S.cur){if(absDay()>=S.cur.at)rlElResolve();return;}
  if(G.s.year>=S.next&&G.s.week>=Math.round(NR()*0.45)){rlElStart('olagan');return;}
  if(m.conf<30)S.low++;else S.low=Math.max(0,S.low-1);
  if(!S.imza&&S.low>=4){S.imza={pct:Math.round((30-m.conf)*1.5),w:0};v155Push({g:'el',k:'el_imza',key:'i'+rlWk(),t:'Muhalefet imza topluyor',b:`<p>Üye desteği uzun süredir düşük (${Math.round(m.conf)}). Muhalefet olağanüstü genel kurul için imza kampanyası başlattı: şu an üyelerin <b>%${S.imza.pct}</b>’i imzaladı. Eşik %20.</p>`,o:[['bagis','Kulübe bağış açıkla','Servetinden · tüm bloklar +'],['transfer','Sürpriz transfer bütçesi','Kasadan bütçeye · tribün +'],['kongre','“Kongrede hesap veririz”','Divan +2, tribün −2']]});return;}
  if(S.imza){const I=S.imza;I.w++;I.pct=Math.round(I.pct+(m.conf<30?(30-m.conf)*0.5:-3));if(I.pct>=20){S.imza=null;S.low=0;msg('board','Olağanüstü genel kurul',`İmzalar eşiği aştı (%${I.pct}). Olağanüstü seçimli genel kurul 4 hafta sonra.`);rlElStart('olaganustu');}else if(I.pct<=0||I.w>=8){S.imza=null;S.low=0;msg('board','İmza kampanyası söndü','Muhalefetin imza kampanyası yeterli desteği bulamadı.');}}}
V155_DEC.el_imza=(ev,k)=>{const B=bk172(),m=G.m;if(k==='bagis'){const a=rlR(Math.max(0,G.p.money||0)*0.3);if(a>0){G.p.money-=a;rlKasa(a,0,'bagis');rlU('hepsi',4);if(B.sec.imza)B.sec.imza.pct-=6;return `Bağış: ${money(a)}`;}return 'Bağış yapacak paran yok';}
  if(k==='transfer'){const a=rlR(Math.max(0,B.kasa)*0.25);B.kasa-=a;m.budget+=a;rlU('tribun',4);if(B.sec.imza)B.sec.imza.pct-=4;return `Transfer bütçesi +${money(a)}`;}rlU('divan',2);rlU('tribun',-2);return 'Kongrede hesap vereceksin';};
elWeek=(old=>function(){if(bk172())return rlElWeek();return old.apply(this,arguments);})(elWeek);

/* =====================================================================
   HAFTALIK KARAR ÜRETİCİSİ (başkan + sportif direktör)
   ===================================================================== */
const rlCd=(k,d)=>v155Due('r172'+k,d),rlMk=k=>v155Mark('r172'+k);
function rlPick(list){const ok=list.filter(x=>x&&x.w>0);if(!ok.length)return null;let t=ok.reduce((a,x)=>a+x.w,0)*Math.random();for(const x of ok){t-=x.w;if(t<=0)return x;}return ok[ok.length-1];}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(isRole()&&G.s&&G.phase==='season')rlDay();}catch(e){console.warn('v172 gün',e);}return r;})(nextDay);
function rlDay(){rlPurge();const R=rlRoll();if(isBsk()){bk172();rlSync();}else{try{rlSdPlanRun();}catch(e){}}if(v155().q.length||(typeof FX!=='undefined'&&FX))return;
  const dw=wdOf(today());if(dayType(G.s.day)==='mac'||dayType(G.s.day)==='kupa')return;
  /* acil kararlar her gün */
  const urgent=isBsk()?rlBskUrgent():rlSdUrgent();if(urgent){v155Push(urgent);return;}
  const want=(R.n<1&&dw>=1)||(R.n<2&&dw>=3)||(R.n<3&&dw>=5);if(!want)return;
  const g=isBsk()?rlBskPool():rlSdPool(),x=rlPick(g);if(!x)return;rlMk(x.id);const ev=x.f();if(ev)v155Push(ev);}

/* ---------- başkan: acil ---------- */
function rlBskUrgent(){const B=bk172(),m=G.m;if(!B)return null;const C=rlCampEv();if(C)return C;
  if(m.hc&&m.hc.tmp&&rlCd('hcnew',3)){rlMk('hcnew');return rlHcNewEv();}
  if(B.kasa<0&&rlCd('maas',10)){rlMk('maas');const need=rlR(Math.max(-B.kasa,rlExpW()));return {g:'bsk',k:'r_maas',key:rlWk(),need,t:'Maaşlar yatmadı',b:`<p>Kasada para yok (${money(B.kasa)}). Bu ayın maaşları için en az <b>${money(need)}</b> gerekiyor. Oyuncular ve teknik ekip ödeme bekliyor.</p>`,o:[['kredi','Kefaletle acil kredi',`Kasa +${money(need)} · borç faiziyle artar`],['cep','Kendi cebimden öde',`Servetin ${money(G.p.money||0)} · divan +`],['ertele','Maaşları ertele','Hoca ve oyuncular kırılır, üyeler tepkili']]};}
  if(!B.sd&&rlCd('sdat',60)&&G.s.week>=1){rlMk('sdat');return {g:'bsk',k:'r_sdat',key:'s'+G.s.year,t:'Sportif direktör ataması',b:'<p>Futbol işleri kurul üyesi, transferleri yürütecek bir sportif direktör atanmasını öneriyor.</p>',o:[['deneyim','Deneyimli sportif direktör','Maaşı yüksek · transfer hatası az'],['analitik','Genç, veri odaklı sportif direktör','Ucuz · scout ve altyapı +'],['ben','Transferleri ben yürütürüm','Karar yükü artar']]};}
  return null;}
function rlHcNewEv(){const C=hcCands().slice(0,3);return {g:'bsk',k:'r_hcnew',key:'h'+absDay(),t:'Yeni teknik direktör seçimi',b:`<p>Takımı geçici olarak yardımcı antrenör çalıştırıyor. Yönetim kurulu üç adayla görüştü.</p><ul class="cupres">${C.map(c=>`<li><span>${esc(c.n)}</span><b>${esc(c.f)} · kalite ${c.q}</b><em>${money(c.fee)}</em></li>`).join('')}</ul>`,o:C.map((c,i)=>[String(i),`${c.n} ile anlaş`,`Kalite ${c.q} · imza ücreti ${money(c.fee)}`]).concat([['bekle','Biraz daha düşün','Geçici hoca devam eder']])};}
V155_DEC.r_hcnew=(ev,k)=>{if(k==='bekle')return 'Karar ertelendi';const m=G.m,C=hcCands()[+k];if(!C)return '';if(m.budget<C.fee){const B=bk172();if(B&&B.kasa>=C.fee){B.kasa-=C.fee;m.budget+=C.fee;}}try{ACTX.hcHire({dataset:{i:k}});}catch(e){console.warn(e);}rlHc(8);return `Yeni hoca: ${C.n}`;};
V155_DEC.r_maas=(ev,k)=>{const B=bk172(),m=G.m,need=ev.need||rlR(rlExpW());if(k==='kredi'){B.kasa+=need;B.debt+=rlR(need*1.28);rlU('divan',-2);return `Acil kredi: ${money(need)}`;}
  if(k==='cep'){const a=Math.min(need,Math.max(0,G.p.money||0));G.p.money-=a;rlKasa(a,0,'bagis');rlU('divan',3);rlU('tribun',2);if(a<need){rlHc(-4);return `Cebinden ${money(a)} ödendi; yetmedi`;}return `Cebinden ${money(a)} ödendi`;}
  rlHc(-8);rlFans(-4);rlU('hepsi',-3);for(const p of squadOf(G.club))relAdd(p,-3);msg('gundem','Maaşlar yatmadı',`${myClub().name}'da maaşlar gecikti; oyuncular ve teknik ekip tepkili.`);return 'Maaşlar ertelendi';};
V155_DEC.r_sdat=(ev,k)=>{const B=bk172();if(k==='ben'){B.sd={n:'Başkan (transferleri yürütüyor)',me:1,q:0};rlU('tribun',1);return 'Transferleri sen yürüteceksin';}const n=rlName(G.club+'sd'+absDay()),q=k==='deneyim'?rint(66,82):rint(52,66),fee=rlR(bskGy()*(k==='deneyim'?0.012:0.005));
  rlKasa(-fee,0,'diger');B.sd={n,q,mood:60,tip:k};if(k==='analitik'){try{const s=mgrInit();if(!s.scout)s.scout={lid:G.s.league};}catch(e){}rlU('genc',2);}else rlU('divan',1);msg('board','Sportif direktör atandı',`${n} sportif direktör oldu (${k==='deneyim'?'deneyimli':'veri odaklı'}, kalite ${q}).`);return `Sportif direktör: ${n}`;};

/* ---------- başkan: haftalık karar havuzu ---------- */
function rlBskPool(){const B=bk172(),m=G.m,cs=cstate(G.club),tw=(()=>{try{return trWin();}catch(e){return false;}})(),L=rlLast(5),H=m.hc||{},Gy=bskGy();
  const freeSlots=Object.keys(BSK_SLOT).filter(k=>k==='gogus'?!B.sp:!B.spn[k]&&(k!=='stad'||(cs.cap||0)>=10000));
  return [
    {id:'tix',w:rlCd('tix',35)?3:0,f:()=>({g:'yk',k:'r_tix',key:rlWk(),t:'Yönetim kurulu: bilet fiyatları',b:`<p>${esc(B.yk[0].n)} (mali işler) bilet tarifesinin gözden geçirilmesini istiyor. Doluluk taraftar memnuniyetine bağlı (taraftar ${Math.round(m.fans==null?60:m.fans)}). Şu an: <b>${TIX[B.tix][0]}</b>.</p>`,o:[['normal','Normal tarife','Denge'],['dusuk','Ucuz bilet','Tribün ve taraftar +, maç günü geliri −'],['yuksek','Pahalı bilet','Gelir +%20, tribün homurdanır']]})},
    {id:'forma',w:rlCd('forma',70)?2:0,f:()=>({g:'yk',k:'r_forma',key:rlWk(),t:'Yönetim kurulu: yeni sezon forması',b:`<p>${esc(B.yk[2].n)} (pazarlama) mağaza fiyatını soruyor. Şu an: <b>${BSK_FORMA[B.forma][0]}</b>.</p>`,o:[['normal','Normal fiyat',''],['dusuk','Uygun fiyat','Satış adedi ve gençler +, birim gelir −'],['yuksek','Pahalı forma','Ticari gelir +%10, taraftar −']]})},
    {id:'tesis',w:rlCd('tesis',42)?2.5:0,f:()=>{const fc=rlFacCost(),cc=rlR(Gy*0.18),pc=rlR(Gy*0.03),o=[];if(cs.fac<5)o.push(['fac',`Antrenman/akademi tesisi (${cs.fac}→${cs.fac+1})`,money(fc)]);o.push(['cap',`Tribün genişletme (+%12 kapasite)`,money(cc)]);if(cs.cond!=='Çok iyi')o.push(['zemin','Zemin yenileme',money(pc)]);o.push(['ertele','Yatırımı ertele','Kasa korunur, divan +1']);
      return {g:'yk',k:'r_tesis',key:rlWk(),t:'Yönetim kurulu: tesis yatırımı',b:`<p>Kasa ${money(B.kasa)}. Tesis ${cs.fac}/5 · kapasite ${(cs.cap||0).toLocaleString('tr-TR')} · zemin ${esc(cs.cond||'—')}.</p>`,o};}},
    {id:'bud',w:tw&&rlCd('bud',24)?3.5:0,f:()=>({g:'yk',k:'r_bud',key:rlWk(),t:'Yönetim kurulu: transfer bütçesi',b:`<p>Transfer dönemi açık. Kasa <b>${money(B.kasa)}</b>, transfer bütçesi <b>${money(m.budget)}</b>. ${esc(H.n||'Hoca')} kadroya takviye bekliyor (ilişki ${Math.round(rlMood())}).</p>`,o:[['15','Kasadan %15 aktar',money(rlR(Math.max(0,B.kasa)*0.15))],['30','Kasadan %30 aktar',`${money(rlR(Math.max(0,B.kasa)*0.3))} · divan −`],['0','Bütçe aynı kalsın','Hoca biraz kırılır'],['-20','Bütçenin %20’sini kasaya geri al','Mali disiplin · hoca −']]})},
    {id:'sp',w:freeSlots.length&&rlCd('sp',18)?3:0,f:()=>{const slot=freeSlots[0],o=rlSpOffer(slot,G.club+slot+absDay());B.spP=o;return {g:'bsk',k:'r_sp',key:slot+rlWk(),t:`Sponsor teklifi: ${BSK_SLOT[slot]}`,b:`<p><b>${esc(o.n)}</b> ${BSK_SLOT[slot].toLocaleLowerCase('tr-TR')} için ${o.y} yıllık, yıllık <b>${money(o.amt)}</b> teklif etti.</p><p class="muted">Pazarlıkta ne kadar çok istersen şirketin masadan kalkma ihtimali o kadar artar.</p>`,o:[['imza','İmzala',money(o.amt)+' / yıl'],['p10','%10 fazlasını iste','Büyük ihtimalle kabul'],['p25','%25 fazlasını iste','Yüksek risk'],['red','Teklifi geri çevir','Yuva boş kalır']]};}},
    {id:'hc',w:(L.filter(x=>x==='M').length>=3||rlMood()<35)&&!H.tmp&&rlCd('hc',24)?4:0,f:()=>({g:'bsk',k:'r_hc',key:rlWk(),t:`Teknik direktör ${H.n||''} tartışılıyor`,b:`<p>Son maçlar: <b>${L.join(' ')||'—'}</b>. Taraftar ${Math.round(m.fans==null?60:m.fans)}, hocayla ilişki ${Math.round(rlMood())}. Basın hocanın geleceğini soruyor.</p>`,o:[['destek','“Hocamızın arkasındayız”','Hoca +8, tribün −2'],['uyari','Son uyarı: 3 maç süre','Hoca −3, divan +1'],['kov','Görevden al',`Tazminat ${money(Math.round(clubBudget(myClub())*VALF*0.03/1e4)*1e4)} · yeni hoca seçersin`]]})},
    {id:'htr',w:tw&&rlCd('htr',28)?2.5:0,f:()=>{const wk=rlWeakest();return {g:'bsk',k:'r_htr',key:rlWk(),pos:wk.pos,t:'Hocanın transfer isteği',b:`<p>${esc(H.n||'Hoca')}: “${POS_TR[wk.pos]||wk.pos} hattına takviye şart.” Bu hattın ilk 11 ortalaması ${R200(Math.round(wk.avg))}, takım ${R200(xiStr())}.</p>`,o:[['ek','Ek bütçe ver (kasanın %10’u)',`${money(rlR(Math.max(0,B.kasa)*0.1))} · hoca +5`],['sd','Sportif direktöre ilet','Hoca +1'],['red','Mevcut kadroyla devam','Hoca −5']]};}},
    {id:'sdtr',w:tw&&B.sd&&!B.sd.me&&rlCd('sdtr',21)?3:0,f:()=>{const wk=rlWeakest(),c=rlCands(wk.pos,1,G.club+'sdtr'+absDay())[0];if(!c)return null;const fee=Math.round(pValue(c.p)*EUR_TL*1.15);return {g:'bsk',k:'r_sdtr',key:c.p.k,pk:c.p.k,cid:c.c,fee,t:`Sportif direktörün önerisi: ${c.p.name}`,b:`<p>${esc(B.sd.n)}: “${esc(c.p.name)} (${c.p.age}, ${dpTag(c.p)}, güç ${R200(c.p.ovr)}) ${esc(CLUBS[c.c].name)}’dan alınabilir. Tahmini bedel <b>${money(fee)}</b>.”</p><p class="muted">Transfer bütçesi ${money(m.budget)} · kasa ${money(B.kasa)}</p>`,o:[['onay','Onayla, görüşmeye başlansın','Transfer bütçesinden'],['kasa','Onayla, eksik kısmı kasadan','Kasa → bütçe'],['red','Reddet','SD kırılır']]};}},
    {id:'fan',w:rlCd('fan',30)?2:0,f:()=>{const c=rlR(Gy*0.002);return {g:'bsk',k:'r_fan',key:rlWk(),cost:c,t:'Taraftar grubu talebi',b:`<p>Taraftar grubunun lideri derbi ve büyük maçlar için koreografi ve deplasman otobüsü desteği istiyor.</p>`,o:[['ver',`Destek ver (${money(c)})`,'Tribün +3, taraftar +2'],['gorus','Görüş ama para verme','Tribün +1'],['red','Talebi reddet','Tribün −3']]};}},
    {id:'divan',w:rlCd('divan',60)&&G.s.week>=6?2:0,f:()=>({g:'bsk',k:'r_divan',key:rlWk(),t:'Divan kurulu toplantısı',b:`<p>Divan, kulübün mali durumunu soruyor. Kasa ${money(B.kasa)}, borç ${money(B.debt)}, net borç oranı ${rlND().toFixed(2)}.</p>`,o:[['seffaf','Şeffaf rapor sun','Divan +3; kötü rakamlar varsa tepki'],['yuvarla','Rakamları yuvarla','Kısa vadede +, ibrada risk']]})},
    {id:'hakem',w:(()=>{try{const x=ourLastRes();if(!x||G.s.results.length-1!==x.w)return 0;const r=x.r,u=r[0]===G.club?r[2]:r[3],o=r[0]===G.club?r[3]:r[2];return o-u===1&&rlCd('hakem',21)?3:0;}catch(e){return 0;}})(),f:()=>({g:'bsk',k:'r_hakem',key:rlWk(),t:'Tartışmalı mağlubiyet sonrası',b:'<p>Son maçtaki hakem kararları tribünü ayağa kaldırdı. Gazeteciler başkanın açıklamasını bekliyor.</p>',o:[['sakin','Sakin kal','Tribün −1'],['itiraz','Federasyona resmi itiraz','Divan +1'],['sert','Sert açıklama yap','Tribün +3 · disiplin cezası riski']]})},
    {id:'derbi',w:(()=>{try{const nm=nextMatchDay(G.s.day);if(nm==null||nm-G.s.day>4)return 0;const f=ourFixture();return f&&derbyOf(f[0],f[1])&&rlCd('derbi',20)?4:0;}catch(e){return 0;}})(),f:()=>({g:'bsk',k:'r_derbi',key:rlWk(),cost:rlR(Gy*0.004),t:'Derbi öncesi galibiyet primi',b:'<p>Kaptan, derbi için galibiyet primi konulup konulmayacağını soruyor.</p>',o:[['prim',`Galibiyet primi koy (${money(rlR(Gy*0.004))})`,'Yalnız kazanırsak ödenir · takım +'],['arma','“Para değil arma için oynayın”','Divan +1']]})},
    {id:'kombine',w:G.s.week<=4&&rlCd('kombine',200)?3:0,f:()=>({g:'bsk',k:'r_kombine',key:'k'+G.s.year,t:'Kombine kampanyası',b:'<p>Pazarlama ekibi kombine satışları için kampanya öneriyor.</p>',o:[['erken','Erken indirimli kombine',`Kasa +${money(rlR(Gy*0.03))} şimdi · maç günü geliri biraz düşer`],['genc','Öğrenci ve kadın tribünü','Genç üyeler +4'],['zam','Kombine fiyatına zam','Kasa + · tribün −']]})},
    {id:'kredi',w:B.kasa<rlExpW()*4&&rlCd('kredi',35)?3:0,f:()=>{const a=rlR(Gy*0.12);return {g:'bsk',k:'r_kredi',key:rlWk(),amt:a,t:'Banka kredi teklifi',b:`<p>Kasa birkaç haftalık giderini karşılıyor (${money(B.kasa)}, haftalık gider yaklaşık ${money(rlExpW())}). Bir banka ${money(a)} kredi öneriyor.</p>`,o:[['cek','Krediyi çek (%32 faiz)','Kasa +, borç +'],['kefil','Kişisel kefaletle çek (%18)','Faiz düşük · kulüp ödeyemezse servetinden'],['red','Kredi istemiyoruz','Divan +1']]};}},
    {id:'genc',w:(()=>{try{const a=acadInit();return a&&a.acad&&a.acad.length&&rlCd('genc',80)?1.5:0;}catch(e){return 0;}})(),f:()=>{const a=acadInit(),ps=a.acad.map(k=>pByKey(k)).filter(Boolean).sort((x,y)=>potOf(y)-potOf(x)),p=ps[0];if(!p)return null;const big=Object.values(CLUBS).filter(c=>!LEAGUES[c.league].youth&&c.str>=myClub().str+6).sort((x,y)=>y.str-x.str)[0];if(!big)return null;const fee=rlR(Math.max(2e5,pValue(Object.assign({},p,{ovr:Math.max(p.ovr,potOf(p)-12)}))*EUR_TL*0.6));
      return {g:'bsk',k:'r_genc',key:p.k,pk:p.k,cid:big.id,fee,t:`Altyapıdan cevher: ${p.name}`,b:`<p><b>${esc(big.name)}</b>, akademimizdeki ${esc(p.name)} (${p.age}, ${dpTag(p)}) için <b>${money(fee)}</b> teklif etti.</p>`,o:[['pro','Profesyonel sözleşme imzala','Genç üyeler +4 · oyuncu kalır'],['sat','Sat',`Kasa +${money(fee)} · genç üyeler −4`],['pay','Sat + %20 sonraki satıştan pay',`Kasa +${money(rlR(fee*0.85))}`]]};}},
    {id:'kadin',w:!B.kadin&&rlCd('kadin',300)&&G.s.week>=8?1.5:0,f:()=>({g:'bsk',k:'r_kadin',key:'w'+G.s.year,t:'Kadın futbol takımı kurulsun mu?',b:`<p>Genç üyeler ve kulübün sosyal medya ekibi kadın futbol takımı kurulmasını istiyor. Yıllık gider yaklaşık ${money(rlR(Gy*0.012))}.</p>`,o:[['kur','Takımı kur','Genç üyeler +8 · medya +'],['ertele','Gelecek sezona bırak','Genç üyeler −2']]})},
    {id:'medya',w:rlCd('medya',30)?1.5:0,f:()=>({g:'bsk',k:'r_medya',key:rlWk(),t:'Spor programı daveti',b:'<p>Bir spor kanalı başkanı canlı yayına davet ediyor; mali tablo ve hedefler sorulacak.</p>',o:[['seffaf','Katıl, şeffaf konuş','Divan ve iş dünyası +'],['iddia','Katıl, iddialı hedefler ver','Tribün +3, divan −2'],['red','Katılma','Medya −']]})},
    {id:'bahis',w:rlCd('bahis',150)&&G.s.week>=10?0.8:0,f:()=>({g:'bsk',k:'r_bahis',key:'b'+G.s.year,amt:rlR(Gy*0.05),t:'Bahis şirketinden sponsorluk teklifi',b:`<p>Yurt dışı merkezli bir bahis şirketi yıllık ${money(rlR(Gy*0.05))} teklif ediyor. Hukukçular yasal risk olduğunu söylüyor.</p>`,o:[['red','Reddet','Divan +2'],['kabul','Kabul et','Kasa ++ · divan −6, skandal riski']]})},
    {id:'meetyk',w:rlCd('meetyk',45)&&G.s.week>=3?1.5:0,f:()=>({g:'yk',k:'r_yk',key:rlWk(),t:'Yönetim kurulu toplantısı: ikinci yarı planı',b:`<p>Kurul üyeleri ${esc(B.yk.map(x=>x.n).join(', '))} sezonun kalanı için plan istiyor. Sıra ${G.s.results.length?tablePos()+'.':'—'} · hedef: ${esc((m.obj||{}).txt||'—')} · kasa ${money(B.kasa)}.</p>`,o:[['denge','Dengeli plan','Üye desteği +1'],['yatirim','Kadroya yatırım','Kasa → transfer bütçesi, divan −'],['tasarruf','Tasarruf planı','Borç azalır, taraftar homurdanır']]})}
  ];}
V155_DEC.r_tix=(ev,k)=>{const B=bk172();B.tix=TIX[k]?k:'normal';rlU('is',k==='yuksek'?1:0);return `Bilet: ${TIX[B.tix][0]}`;};
V155_DEC.r_forma=(ev,k)=>{const B=bk172();B.forma=BSK_FORMA[k]?k:'normal';return `Forma: ${BSK_FORMA[B.forma][0]}`;};
V155_DEC.r_tesis=(ev,k)=>{if(k==='fac'){ACTX.bskFac();return '';}if(k==='cap'){ACTX.rlCap();return '';}if(k==='zemin'){ACTX.rlPitch();return '';}rlU('divan',1);return 'Yatırım ertelendi';};
V155_DEC.r_bud=(ev,k)=>{const p=+k;if(!p){rlHc(-2);return 'Transfer bütçesi aynı kaldı';}ACTX.rlBud({dataset:{p}});if(p>0){rlHc(p>=30?5:3);if(p>=30)rlU('divan',-2);rlU('tribun',p>=30?3:1);}else{rlU('divan',2);rlU('tribun',-1);}return '';};
V155_DEC.r_sp=(ev,k)=>{const B=bk172(),o=B.spP;B.spP=null;if(!o)return '';if(k==='red')return 'Teklif geri çevrildi';if(k==='imza'){rlSpSign(o);return `${o.n} imzaladı`;}
  const p=k==='p25'?25:10,ch=k==='p25'?0.38:0.8;if(Math.random()<ch){o.amt=rlR(o.amt*(1+p/100));rlSpSign(o);return `Pazarlık başarılı: ${money(o.amt)}/yıl`;}if(Math.random()<0.5){o.amt=rlR(o.amt*(1+p/250));rlSpSign(o);return `Orta yolda buluşuldu: ${money(o.amt)}/yıl`;}msg('board','Sponsor masadan kalktı',`${o.n} pazarlığı sonlandırdı.`);return `${o.n} teklifini geri çekti`;};
V155_DEC.r_hc=(ev,k)=>{if(k==='destek'){rlHc(8);rlU('tribun',-2);rlFans(-1);return 'Hocaya destek verdin';}if(k==='uyari'){rlHc(-3);rlU('divan',1);G.m.hcWarn=G.s.results.length+3;return 'Hocaya son uyarı';}
  try{ACTX.hcFire();}catch(e){console.warn(e);}rlU('tribun',2);rlU('divan',-1);return 'Teknik direktör gönderildi';};
V155_DEC.r_htr=(ev,k)=>{const B=bk172(),m=G.m;if(k==='ek'){const a=rlR(Math.max(0,B.kasa)*0.1);B.kasa-=a;m.budget+=a;rlHc(5);return `Ek bütçe ${money(a)}`;}if(k==='sd'){rlHc(1);if(B.sd&&!B.sd.me){const c=rlCands(ev.pos,1,G.club+'htr'+absDay())[0];if(c){rlTgtAdd(c.p.k,c.c,'sd');msg('board','Sportif direktör aday buldu',`${B.sd.n}: ${c.p.name} (${CLUBS[c.c].name}) için çalışıyoruz.`);}}return 'İstek sportif direktöre iletildi';}rlHc(-5);return 'Hocanın isteği reddedildi';};
V155_DEC.r_sdtr=(ev,k)=>{const B=bk172(),m=G.m;if(k==='red'){if(B.sd)B.sd.mood=clamp((B.sd.mood||60)-6,0,100);return 'Öneri reddedildi';}if(k==='kasa'&&m.budget<ev.fee){const a=Math.min(Math.max(0,B.kasa),ev.fee-m.budget);B.kasa-=a;m.budget+=a;}
  if(B.sd)B.sd.mood=clamp((B.sd.mood||60)+4,0,100);setTimeout(()=>{try{negStart(ev.cid,ev.pk,'tr');}catch(e){console.warn(e);}},0);return '';};
V155_DEC.r_fan=(ev,k)=>{if(k==='ver'){rlKasa(-ev.cost,0,'diger');rlU('tribun',3);rlFans(2);return 'Taraftar grubuna destek';}if(k==='gorus'){rlU('tribun',1);return 'Taraftar liderleriyle görüştün';}rlU('tribun',-3);rlFans(-1);return 'Talep reddedildi';};
V155_DEC.r_divan=(ev,k)=>{const B=bk172(),nd=rlND();if(k==='seffaf'){B.seffaf=(B.seffaf||0)+0.3;if(nd>0.8){rlU('divan',-2);rlU('is',1);return 'Şeffaf rapor: borç tablosu tepki çekti';}rlU('divan',3);return 'Divan raporu beğendi';}B.sk=(B.sk||0)+1;rlU('divan',2);return 'Rakamlar yuvarlandı (ibrada risk)';};
V155_DEC.r_hakem=(ev,k)=>{if(k==='sakin'){rlU('tribun',-1);return 'Sakin kaldın';}if(k==='itiraz'){rlU('divan',1);return 'Resmi itiraz yapıldı';}rlU('tribun',3);rlFans(1);if(Math.random()<0.35){const c=rlR(bskGy()*0.002);rlKasa(-c,0,'diger');msg('board','Disiplin cezası',`Hakem açıklaman nedeniyle kulübe ${money(c)} para cezası verildi.`);return 'Sert açıklama · para cezası geldi';}return 'Sert açıklama tribünü coşturdu';};
V155_DEC.r_derbi=(ev,k)=>{if(k==='prim'){const f=ourFixture();bk172().prim={f:f?f.join('-'):'',a:ev.cost,d:G.s.day};return 'Galibiyet primi kondu';}rlU('divan',1);return '“Arma için oynayın”';};
V155_DEC.r_kombine=(ev,k)=>{const Gy=bskGy();if(k==='erken'){rlKasa(rlR(Gy*0.03),0,'mac');bk172().kombi=-0.03;rlFans(2);return 'Erken kombine satışı';}if(k==='genc'){rlU('genc',4);rlFans(1);return 'Öğrenci ve kadın tribünü açıldı';}rlKasa(rlR(Gy*0.015),0,'mac');rlU('tribun',-3);return 'Kombine zamlandı';};
V155_DEC.r_kredi=(ev,k)=>{const B=bk172();if(k==='red'){rlU('divan',1);return 'Kredi istenmedi';}B.kasa+=ev.amt;B.debt+=rlR(ev.amt*(k==='kefil'?1.18:1.32));if(k==='kefil'){B.kefil=(B.kefil||0)+ev.amt;rlU('divan',1);}else rlU('divan',-1);return `Kredi: ${money(ev.amt)}`;};
V155_DEC.r_genc=(ev,k)=>{const a=acadInit(),p=pByKey(ev.pk);if(!p||!a.acad.includes(ev.pk))return '';if(k==='pro'){rlU('genc',4);try{ACTX.acadUpP({dataset:{k:ev.pk}});}catch(e){}return `${p.name} profesyonel oldu`;}
  const fee=k==='pay'?rlR(ev.fee*0.85):ev.fee;a.acad.splice(a.acad.indexOf(ev.pk),1);G.tx=G.tx||{};G.tx[ev.pk]=ev.cid;try{txNote(ev.pk,ev.cid,fee/EUR_TL);}catch(e){}rlKasa(fee,0,'diger');rlU('genc',-4);msg('board',`Altyapıdan satış: ${p.name}`,`${p.name}, ${CLUBS[ev.cid].name} kulübüne ${money(fee)} karşılığında satıldı.${k==='pay'?' Sonraki satıştan %20 pay hakkımız var.':''}`);return `${p.name} satıldı`;};
V155_DEC.r_kadin=(ev,k)=>{const B=bk172();if(k==='kur'){B.kadin=1;rlU('genc',8);G.m.media=clamp((G.m.media||50)+3,0,100);msg('board','Kadın futbol takımı kuruldu',`${myClub().name} kadın futbol takımı ligde mücadele edecek.`);return 'Kadın futbol takımı kuruldu';}rlU('genc',-2);return 'Karar ertelendi';};
V155_DEC.r_medya=(ev,k)=>{const m=G.m;if(k==='seffaf'){rlU('divan',2);rlU('is',2);return 'Şeffaf konuştun';}if(k==='iddia'){rlU('tribun',3);rlU('divan',-2);return 'İddialı hedefler verdin';}m.media=clamp((m.media||50)-3,0,100);return 'Davete katılmadın';};
V155_DEC.r_bahis=(ev,k)=>{const B=bk172();if(k==='kabul'){rlKasa(ev.amt,0,'sponsor');rlU('divan',-6);B.sk=(B.sk||0)+1;msg('gundem','Tartışmalı sponsorluk','Kulübün bahis şirketiyle anlaşması tartışma yarattı.');return 'Bahis sponsorluğu kabul edildi';}rlU('divan',2);return 'Teklif reddedildi';};
V155_DEC.r_yk=(ev,k)=>{const B=bk172(),m=G.m,a=rlR(bskGy()*0.05);if(k==='denge'){rlU('hepsi',1);return 'Plan onaylandı';}if(k==='yatirim'){const x=Math.min(a,Math.max(0,B.kasa));B.kasa-=x;m.budget+=x;rlU('divan',-1);rlU('tribun',1);rlHc(3);return `Transfer bütçesi +${money(x)}`;}const cut=Math.min(B.debt,a*0.6,Math.max(0,B.kasa));B.debt-=cut;B.kasa-=cut;rlFans(-2);rlU('divan',2);return 'Tasarruf planı kabul edildi';};

/* ---------- sportif direktör: acil + havuz ---------- */
function rlSdUrgent(){const m=G.m;if(m.hc&&m.hc.tmp&&rlCd('hcnew',3)){rlMk('hcnew');const e=rlHcNewEv();e.g='sd';e.b=e.b.replace('Yönetim kurulu','Sportif direktörlük');return e;}return null;}
function rlSdPool(){const m=G.m,H=m.hc||{},tw=(()=>{try{return trWin();}catch(e){return false;}})(),sq=squadOf(G.club);let xi=[];try{xi=autoXI(sq);}catch(e){}
  const rep=(m.reports||[]).find(r=>!r.v172&&rlP(r.k)&&rlPC(r.k)!==G.club);
  const sell=sq.filter(p=>!xi.includes(p.k)&&p.age>=24&&!(m.lout&&m.lout[p.k])&&!(m.loans&&m.loans[p.k])).sort((a,b)=>(b.age*0.5-b.ovr*0.3)-(a.age*0.5-a.ovr*0.3))[0];
  let youth=null;try{const a=acadInit();youth=a.acad.map(k=>pByKey(k)).filter(Boolean).filter(p=>p.age>=16).sort((x,y)=>(y.ovr+potOf(y)*0.3)-(x.ovr+potOf(x)*0.3))[0];}catch(e){}
  const tg=(m.sdT||[]).filter(x=>rlP(x.k)&&rlPC(x.k)!==G.club);
  return [
    {id:'scas',w:(!m.scout||!(m.scUntil>absDay()))&&rlCd('scas',21)?4:0,f:()=>{const T=curLeague().tier,cc=curLeague().cc,R=srng(G.club+'sc'+rlWk());const pool=Object.keys(LEAGUES).filter(l=>!LEAGUES[l].youth&&leagueClubs(l).length>4);const pk=a=>a.length?a[Math.floor(R()*a.length)]:null;
      const L=[G.s.league,pk(pool.filter(l=>LEAGUES[l].cc===cc&&LEAGUES[l].tier===T-1)),pk(pool.filter(l=>LEAGUES[l].cc!==cc&&Math.abs(LEAGUES[l].tier-T)<=1))].filter((x,i,a)=>x&&a.indexOf(x)===i);
      return {g:'sd',k:'r_scas',key:rlWk(),t:'Scout görevlendirme',b:`<p>Gözlem ağı ${m.scout&&LEAGUES[m.scout.lid]?`şu an ${esc(LEAGUES[m.scout.lid].name)} görevini tamamladı`:'boşta'}. Hocanın ihtiyacı: <b>${POS_TR[rlWeakest().pos]}</b>. Önümüzdeki 4 hafta scoutlar nereye gitsin?</p>`,o:L.map(l=>[l,LEAGUES[l].name,l===G.s.league?'Rakipleri tanı, hazır oyuncu':LEAGUES[l].cc===cc?'Ucuz, gelişime açık oyuncular':'Yabancı pazar · daha pahalı']).concat([['yok','Şimdilik görev verme','Rapor gelmez']])};}},
    {id:'screp',w:rep&&rlCd('screp',3)?5:0,f:()=>{rep.v172=1;const p=rlP(rep.k),c=rlPC(rep.k);if(!p)return null;return {g:'sd',k:'r_screp',key:rep.k,pk:rep.k,cid:c,t:`Scout raporu: ${p.name}`,b:`<p><b>${esc(p.name)}</b> (${p.age}, ${dpTag(p)}, ${esc(CLUBS[c].name)}) · güç ${R200(p.ovr)} · potansiyel ${R200(potOf(p))} · değer ${eur(pValue(p))}. Scout notu: “${esc(rep.note||'')}”.</p>`,o:[['liste','Transfer hedefleri listesine ekle','Kadro planına girer'],['teklif',tw?'Hemen teklif hazırla':'Teklif (dönem kapalı: listeye ekler)','Görüşme masası'],['pas','İlgilenmiyoruz','Scout biraz kırılır']]};}},
    {id:'hreq',w:rlCd('hreq',20)?3:0,f:()=>{const wk=rlWeakest(),yp=(()=>{try{return acadInit().acad.map(k=>pByKey(k)).filter(p=>p&&p.pos===wk.pos).sort((a,b)=>b.ovr-a.ovr)[0];}catch(e){return null;}})();
      return {g:'sd',k:'r_hreq',key:rlWk(),pos:wk.pos,yk:yp?yp.k:null,t:`Hocanın transfer isteği: ${POS_TR[wk.pos]}`,b:`<p>${esc(H.n||'Hoca')}: “${POS_TR[wk.pos]} hattında ${wk.n} oyuncumuz var, ilk 11 ortalaması ${R200(Math.round(wk.avg))}. Takviye istiyorum.”</p>`,o:[['aday','Hedef listesinden 2 aday sun','Hoca +4 · listeye eklenir'],...(yp?[['genc',`Altyapıdan ${yp.name}’i öner`,'Hoca +1 · genç A takıma']]:[]),['red','Bütçe yok, mevcut kadro','Hoca −5']]};}},
    {id:'sell',w:sell&&rlCd('sell',16)?3:0,f:()=>{const p=sell,w=pWage(p,G.club);return {g:'sd',k:'r_sell',key:p.k,pk:p.k,t:`Satış / kiralık kararı: ${p.name}`,b:`<p>${esc(p.name)} (${p.age}, ${dpTag(p)}, güç ${R200(p.ovr)}) ilk 11’de değil. Haftalık maaşı ${eur(w)}, piyasa değeri ${eur(pValue(p))}.${tw?'':' <b>Transfer dönemi kapalı</b>: karar dönem açılınca uygulanır.'}</p>`,o:[['kal','Kadroda kalsın, rotasyon','Oyuncu +2'],['kir',tw?'Kiralık gönder':'Dönem açılınca kiralık gönder','Maaş yükü azalır, oyuncu gelişir'],['sat',tw?'Satışa çıkar':'Dönem açılınca satış listesine al','Bütçe +']]};}},
    {id:'youth',w:youth&&rlCd('youth',18)?3:0,f:()=>{const p=youth;return {g:'sd',k:'r_youth',key:p.k,pk:p.k,t:`Gençlerin A takıma alınması: ${p.name}`,b:`<p>Altyapı sorumlusu ${esc(p.name)} (${p.age}, ${dpTag(p)}, güç ${R200(p.ovr)}, potansiyel ${acadPotTxt(p)}) için A takım idmanlarına çıkma zamanının geldiğini düşünüyor.</p>`,o:[['al','A takıma al','Hoca +1 · genç forma şansı bulur'],['kal','Akademide gelişsin',''],...(tw?[['kir','Alt ligde kiralık oynasın','A takıma al ve kiralık gönder']]:[])]};}},
    {id:'tgt',w:tw&&tg.length&&rlCd('tgt',10)?3.5:0,f:()=>{const x=tg[0],p=rlP(x.k),c=rlPC(x.k);if(!p)return null;return {g:'sd',k:'r_tgt',key:x.k+rlWk(),pk:x.k,cid:c,t:`Transfer hedefi: ${p.name}`,b:`<p>Listendeki ${esc(p.name)} (${p.age}, ${dpTag(p)}, ${esc(CLUBS[c].name)}) için teklif zamanı. Değer ${eur(pValue(p))}, transfer bütçesi ${money(m.budget)}.</p>`,o:[['teklif','Teklif yap','Görüşme masası'],['bekle','Bekle, fiyat düşsün','Listede kalır'],['cikar','Listeden çıkar','']]};}},
    {id:'agent',w:rlCd('agent',24)?1.5:0,f:()=>{const c=rlCands(null,1,G.club+'ag'+rlWk())[0];if(!c)return null;return {g:'sd',k:'r_agent',key:c.p.k,pk:c.p.k,cid:c.c,t:`Menajer önerisi: ${c.p.name}`,b:`<p>Bir menajer ${esc(c.p.name)} (${c.p.age}, ${dpTag(c.p)}, ${esc(CLUBS[c.c].name)}, güç ${R200(c.p.ovr)}) için arayıp kulübün ilgisini soruyor. Değer ${eur(pValue(c.p))}.</p>`,o:[['liste','Hedef listesine al',''],['red','İlgilenmiyoruz','']]};}}
  ];}
V155_DEC.r_scas=(ev,k)=>{const m=G.m;if(k==='yok'||!LEAGUES[k])return 'Scout görevi verilmedi';mgrInit().scout={lid:k};m.scUntil=absDay()+28;return `Scoutlar yola çıktı: ${LEAGUES[k].short}`;};
V155_DEC.r_screp=(ev,k)=>{const p=rlP(ev.pk);if(!p)return '';if(k==='pas')return 'Rapor arşivlendi';rlTgtAdd(ev.pk,ev.cid,'scout');if(k==='teklif'){let tw=false;try{tw=trWin();}catch(e){}if(tw)setTimeout(()=>{try{negStart(ev.cid,ev.pk,'tr');}catch(e){console.warn(e);}},0);}return `${p.name} hedef listesinde`;};
V155_DEC.r_hreq=(ev,k)=>{if(k==='aday'){const L=rlCands(ev.pos,2,G.club+'hq'+absDay());L.forEach(c=>rlTgtAdd(c.p.k,c.c,'hoca'));rlHc(4);return L.length?`Hocaya ${L.length} aday sunuldu`:'Uygun aday bulunamadı';}
  if(k==='genc'&&ev.yk){try{ACTX.acadUpP({dataset:{k:ev.yk}});}catch(e){}rlHc(1);return 'Genç A takıma çıktı';}rlHc(-5);return 'Hoca mevcut kadroyla devam edecek';};
V155_DEC.r_sell=(ev,k)=>{const m=G.m,p=squadOf(G.club).find(x=>x.k===ev.pk);if(!p)return '';if(k==='kal'){relAdd(p,2);return `${p.name} kadroda kalıyor`;}let tw=false;try{tw=trWin();}catch(e){}
  if(!tw){m.sdPlan=m.sdPlan||{};m.sdPlan[p.k]=k;return `${p.name}: dönem açılınca ${k==='kir'?'kiralık':'satış'}`;}
  if(k==='kir'){const T=loanTargets(p);if(T.length){ACTX.loanGo({dataset:{k:p.k,id:T[0].id}});return '';}return 'Kiralık için kulüp bulunamadı';}
  sellPlayer(p.k);return '';};
V155_DEC.r_youth=(ev,k)=>{if(k==='kal')return 'Akademide gelişmeye devam';try{ACTX.acadUpP({dataset:{k:ev.pk}});}catch(e){console.warn(e);}rlHc(1);G.m.sdPromo=(G.m.sdPromo||0)+1;
  if(k==='kir'){const p=squadOf(G.club).find(x=>x.k===ev.pk);if(p){const T=loanTargets(p);if(T.length)ACTX.loanGo({dataset:{k:p.k,id:T[0].id}});}}return 'Genç A takımda';};
V155_DEC.r_tgt=(ev,k)=>{const m=G.m;if(k==='cikar'){m.sdT=(m.sdT||[]).filter(x=>x.k!==ev.pk);return 'Listeden çıkarıldı';}if(k==='bekle'){const x=(m.sdT||[]).find(y=>y.k===ev.pk);if(x){m.sdT=m.sdT.filter(y=>y!==x);m.sdT.push(x);}return 'Beklemedeyiz';}
  setTimeout(()=>{try{negStart(ev.cid,ev.pk,'tr');}catch(e){console.warn(e);}},0);return '';};
V155_DEC.r_agent=(ev,k)=>{if(k==='liste'){rlTgtAdd(ev.pk,ev.cid,'menajer');return 'Hedef listesine eklendi';}return 'Menajere teşekkür edildi';};
/* dönem açılınca SD planı uygulanır */
function rlSdPlanRun(){const m=G.m;if(!m.sdPlan||!Object.keys(m.sdPlan).length||!$('#modal').hidden)return;let tw=false;try{tw=trWin();}catch(e){}if(!tw)return;for(const [k,v] of Object.entries(m.sdPlan)){const p=squadOf(G.club).find(x=>x.k===k);delete m.sdPlan[k];if(!p)continue;try{if(v==='kir'){const T=loanTargets(p);if(T.length)ACTX.loanGo({dataset:{k,id:T[0].id}});}else sellPlayer(k);}catch(e){}}try{closeModal();}catch(e){}}

/* =====================================================================
   MAÇ SONRASI: basın toplantısı yok, mesleğe uygun özet
   ===================================================================== */
pressNew=(old=>function(){if(isRole())return;return old.apply(this,arguments);})(pressNew);
mgrFinish=(old=>function(gu,go,f){const role=isRole()&&G.m&&!G.m.shadow;let c0=0,f0=0;if(role){c0=G.m.conf||0;f0=G.m.fans==null?60:G.m.fans;}
  const r=old.apply(this,arguments);try{if(role)rlAfter(gu,go,f,c0,f0);}catch(e){console.warn('v172 maç sonu',e);}return r;})(mgrFinish);
function rlAfter(gu,go,f,c0,f0){const m=G.m,bsk=isBsk(),win=gu>go,draw=gu===go,opp=CLUBS[f[0]===G.club?f[1]:f[0]],usHome=f[0]===G.club,H=m.hc||{},lines=[];
  if(LOCA.notes&&LOCA.notes.length&&LOCA.f===f){lines.push(...LOCA.notes.map(x=>'🏟 '+x));}LOCA.notes=[];LOCA.f=null;
  if(bsk){const B=bk172(),Gy=bskGy();rlSync();const prim=win?Gy*0.006:draw?Gy*0.002:0;if(prim){rlKasa(prim,0,'yayin');lines.push(`Yayın geliri primi: +${money(prim)}`);}
    if(usHome){lines.push(`İç saha maçı · bilet: ${TIX[B.tix][0].toLocaleLowerCase('tr-TR')}`);}
    if(B.prim&&B.prim.f===f.join('-')){if(win){rlKasa(-B.prim.a,0,'diger');lines.push(`Derbi galibiyet primi ödendi: ${money(B.prim.a)}`);}B.prim=null;}
    let D=null;try{D=derbyOf(f[0],f[1]);}catch(e){}if(D){rlU('tribun',win?3:draw?0:-3);}
    if(m.hcWarn&&G.s.results.length>=m.hcWarn){m.hcWarn=0;if(rlLast(3).filter(x=>x==='M').length>=2)lines.push('Hocaya verdiğin süre doldu: sonuçlar düzelmedi.');}
    lines.push(`Üye desteği ${Math.round(c0)} → ${Math.round(m.conf)} · taraftar ${Math.round(f0)} → ${Math.round(m.fans==null?60:m.fans)}`);}
  else{lines.push(`${esc(H.n||'Hoca')}: “${win?'Planımız tuttu.':draw?'Bir puan, daha fazlasını isterdik.':'Kadroda eksiklerimiz belli oldu.'}”`);
    const wk=rlWeakest();if(!win)lines.push(`Kadro planı: en zayıf hat ${POS_TR[wk.pos]} (ilk 11 ort. ${R200(Math.round(wk.avg))})`);
    try{const best=squadOf(opp.id).filter(p=>p.age<=26).sort((a,b)=>b.ovr-a.ovr)[0];if(best&&!(m.sdT||[]).some(x=>x.k===best.k))LOCA.scoutK={k:best.k,c:opp.id,n:best.name};lines.push(best?`Scout notu: rakipte ${best.name} (${best.age}, ${dpTag(best)}, güç ${R200(best.ovr)}) dikkat çekti`:'');}catch(e){}
    lines.push(`Yönetim güveni ${Math.round(c0)} → ${Math.round(m.conf)} · hocayla ilişki ${Math.round(rlMood())}`);}
  const L=lines.filter(Boolean);
  try{msg('report',`Maç sonrası özet: ${esc(myClub().short)} ${gu}-${go} ${esc(opp.short)}`,L.join(' · ').replace(/<[^>]+>/g,''));}catch(e){}
  setTimeout(()=>{try{const mc=$('#modalCard');if(!mc||$('#modal').hidden||mc.querySelector('.rl-ms'))return;mc.querySelectorAll('.notes li').forEach(li=>{if(bsk&&/^Yönetim güveni:/.test(li.textContent))li.textContent=`Üye desteği: ${Math.round(G.m.conf)}`;});
    const sk=LOCA.scoutK;const box=`<section class="rl-ms"><p class="sub-h"><span>${bsk?'Başkanın maç sonrası notları':'Sportif direktörün maç sonrası özeti'}</span></p><ul>${L.map(x=>`<li>${x}</li>`).join('')}</ul>${!bsk&&sk?`<button class="btn sm" data-act="rlTgtQ" data-k="${sk.k}" data-id="${sk.c}">${esc(sk.n)}’i hedef listesine ekle</button>`:''}</section>`;
    const notes=mc.querySelector('ul.notes');if(notes)notes.insertAdjacentHTML('afterend',box);else{const b=mc.querySelector('button.cta');if(b)b.insertAdjacentHTML('beforebegin',box);}}catch(e){}},0);}
ACTX.rlTgtQ=el=>{if(rlTgtAdd(el.dataset.k,el.dataset.id,'maç'))toast('Hedef listesine eklendi');else toast('Zaten listede');el.disabled=true;save();};
ACTX.rlTgtDel=el=>{const m=G.m;m.sdT=(m.sdT||[]).filter(x=>x.k!==el.dataset.k);save();render();};

/* =====================================================================
   SEZON SONU: mali genel kurul (ibra) + değerlendirme
   ===================================================================== */
mgrSeasonEnd=(old=>function(){const role=isRole();let pre=null;try{if(role){const m=G.m;pre={sq:squadOf(G.club).map(p=>p.k),sq0:(m.sq0&&m.sq0.y===G.s.year)?m.sq0.k:null,dec:R172().tot,ans:R172().ans,promo:m.sdPromo||0,mood:rlMood(),tg:(m.sdT||[]).length};if(isBsk()){const B=bk172();pre.def=JSON.parse(JSON.stringify(B.def||rlDefNew()));pre.kasa=B.kasa;pre.debt=B.debt;pre.uye=Object.assign({},B.uye);pre.spn=Object.keys(B.spn).length+(B.sp?1:0);}}}catch(e){console.warn(e);}
  const r=old.apply(this,arguments);
  try{if(pre){const V=v155(),R=V.rev||{};const H=R172();R.dec=H.hist.slice(-46).reduce((a,x)=>a+x,0)+H.n;R.wk=Math.max(1,Math.min(46,H.hist.length+1));
    if(pre.sq0){R.inN=pre.sq.filter(k=>!pre.sq0.includes(k)).map(k=>(pByKey(k)||{}).name).filter(Boolean).slice(0,8);R.outN=pre.sq0.filter(k=>!pre.sq.includes(k)).map(k=>(pByKey(k)||{}).name).filter(Boolean).slice(0,8);}
    R.promo=pre.promo;R.mood=Math.round(pre.mood);R.tg=pre.tg;
    if(isBsk()&&!G.m.sacked){const B=bk172(),U=B.uye,nd=rlND();let gs=0,xs=0;for(const k in pre.def.gel)gs+=pre.def.gel[k];for(const k in pre.def.gid)xs+=pre.def.gid[k];R.fin={gel:pre.def.gel,gid:pre.def.gid,gs,xs,kasa:B.kasa,debt:B.debt,nd};R.uye=Object.assign({},U);
      /* vaatler */
      for(const v of U.vaat){if(v.st!=='bekliyor')continue;let ok=null;if(v.k==='borc')ok=B.debt<=v.debt0*0.8;else if(v.k==='bilet')ok=B.tix!=='yuksek';else if(v.k==='altyapi')ok=(G.m.acadUpN||0)>=2;else if(v.k==='tesis')ok=cstate(G.club).fac>=4;else if(v.k==='yildiz')ok=(R.inN||[]).length>0;if(ok!=null){v.st=ok?'tutuldu':'bozuldu';const bl=BSK_VAAT[v.k][1];rlU(bl,ok?3:-5);}}
      if(B.sozBagis&&(G.p.money||0)>=B.sozBagis){}else if(B.sozBagis){B.sk=(B.sk||0)+1;rlU('hepsi',-3);msg('gundem','Bağış sözü tutulmadı','Seçimde verilen bağış sözü yerine getirilmedi; muhalefet hesap soruyor.');}B.sozBagis=0;
      const pM=rlSig(((U.divan*.5+U.is*.3+U.tribun*.2)-50)/6+1.2-Math.max(0,nd)*1.2+(B.seffaf||0)),pI=rlSig((G.m.conf-45)/6+1-(B.sk||0)*0.4),mali=Math.random()<pM,idari=Math.random()<pI,uN=B.uye.n,kat=0.35,tot=Math.round(uN*kat);
      const vt=p=>{const y=Math.round(tot*clamp(p+(Math.random()-0.5)*0.12,0.05,0.95));return [y,tot-y];};R.ibra={mali,idari,pM:Math.round(pM*100),pI:Math.round(pI*100),vm:vt(mali?Math.max(pM,0.52):Math.min(pM,0.48)),vi:vt(idari?Math.max(pI,0.52):Math.min(pI,0.48))};
      B.sk=Math.max(0,(B.sk||0)-1);B.seffaf=0;
      if(!mali||!idari){R.verdict=`Genel kurul yönetimi ${!mali&&!idari?'mali ve idari':!mali?'mali':'idari'} yönden ibra etmedi`;R.sacked=true;msg('board','İbra edilmedin',`Olağan mali genel kurulda yönetim ${!mali?'mali':''}${!mali&&!idari?' ve ':''}${!idari?'idari':''} yönden ibra edilmedi. Tüzük gereği olağanüstü seçime gidiliyor; ibra edilmeyen yönetim aday olamaz.`);rlOust(-8);}
      else{R.verdict=G.m.conf>=65?'Genel kurul yönetimi alkışlarla ibra etti':G.m.conf>=45?'Genel kurul yönetimi ibra etti':'İbra edildin ama üyeler endişeli';msg('board','Genel kurul: ibra edildin',`Yönetim mali (%${R.ibra.pM}) ve idari (%${R.ibra.pI}) yönden ibra edildi.`);}
      B.defOld=pre.def;B.def=rlDefNew();B.def.y=G.s.year+1;}
    V.rev=R;}}catch(e){console.warn('v172 sezon sonu',e);}return r;})(mgrSeasonEnd);
mgrNewSeason=(old=>function(){const B=bk172(),keep=B?Math.max(0,G.m.budget):0;const r=old.apply(this,arguments);try{if(isRole())G.m.sq0={y:G.s.year,k:squadOf(G.club).map(p=>p.k)};G.m.sdPromo=0;G.m.acadUpN=0;
    if(B&&bk172()){G.m.budget=rlR(keep*0.8);msg('board','Yeni sezon bütçesi',`Devreden transfer bütçesi ${money(G.m.budget)}. Kasadan transfer bütçesine ne kadar aktaracağına yönetim kurulunda karar vereceksin (kasa ${money(B.kasa)}).`);v155Mark('r172bud');try{v155().last['r172bud']=0;}catch(e){}}}catch(e){console.warn(e);}return r;})(mgrNewSeason);
v155RevHTML=(old=>function(R){let h=old.apply(this,arguments);try{if(!R||!R.role)return h;const bsk=R.role==='bsk';let x='';
  x+=`<p class="sub-h" style="margin:12px 0 6px"><span>Sezonun kararları</span><span>${R.dec||0} karar · haftada ${(((R.dec||0)/(R.wk||1))).toFixed(1).replace('.',',')}</span></p>`;
  if(bsk&&R.fin){const F=R.fin,row=(n,v)=>`<li><span>${n}</span><b>${money(v)}</b><em></em></li>`;x+=`<p class="sub-h" style="margin:12px 0 6px"><span>Kulüp finansı</span><span>net ${money(F.gs-F.xs)}</span></p><ul class="cupres">${row('Yayın geliri',F.gel.yayin)}${row('Maç günü',F.gel.mac)}${row('Sponsor',F.gel.sponsor)}${row('Ticari (forma/mağaza)',F.gel.ticari)}${row('Bağış ve diğer',(F.gel.bagis||0)+(F.gel.diger||0))}${row('Maaşlar',-F.gid.maas)}${row('İşletme ve ekip',-(F.gid.isletme+F.gid.ekip))}${row('Yatırım',-(F.gid.yatirim||0))}${row('Faiz ve taksit',-F.gid.faiz)}<li><span>Kasa / borç</span><b>${money(F.kasa)} · ${money(F.debt)}</b><em class="${F.nd>0.8?'res-l':'res-w'}">ND ${F.nd.toFixed(2)}</em></li></ul>`;}
  if(bsk&&R.uye)x+=`<p class="sub-h" style="margin:12px 0 6px"><span>Üye blokları</span></p>${`<div class="rl-bars">${Object.keys(BSK_BN).map(k=>`<div><span>${BSK_BN[k]}</span><i><em style="width:${Math.round(R.uye[k])}%"></em></i><b>${Math.round(R.uye[k])}</b></div>`).join('')}</div>`}${(R.uye.vaat||[]).length?`<ul class="cupres">${R.uye.vaat.map(v=>`<li><span>Vaat</span><b>${esc(BSK_VAAT[v.k][0])}</b><em class="${v.st==='tutuldu'?'res-w':v.st==='bozuldu'?'res-l':''}">${v.st}</em></li>`).join('')}</ul>`:''}`;
  if(bsk&&R.ibra){const I=R.ibra,vb=(n,v,ok)=>`<div><b>${n}</b><i><em style="width:${Math.round(v[0]/(v[0]+v[1])*100)}%"></em></i><span>${ok?'kabul':'ret'} · ${v[0].toLocaleString('tr-TR')} – ${v[1].toLocaleString('tr-TR')}</span></div>`;x+=`<p class="sub-h" style="margin:12px 0 6px"><span>Olağan mali genel kurul</span></p><div class="v155-vote">${vb('Mali ibra',I.vm,I.mali)}${vb('İdari ibra',I.vi,I.idari)}</div>`;}
  if(!bsk){x+=`<p class="sub-h" style="margin:12px 0 6px"><span>Sportif direktörlük karnesi</span></p><ul class="cupres"><li><span>Gelenler</span><b>${esc((R.inN||[]).join(', ')||'—')}</b><em>${(R.inN||[]).length}</em></li><li><span>Gidenler</span><b>${esc((R.outN||[]).join(', ')||'—')}</b><em>${(R.outN||[]).length}</em></li><li><span>A takıma çıkan genç</span><b>${R.promo||0}</b><em></em></li><li><span>Hocayla ilişki</span><b>${R.mood||'—'}</b><em class="${(R.mood||60)>=55?'res-w':'res-l'}">${(R.mood||60)>=55?'iyi':'gergin'}</em></li><li><span>Transfer hedefleri</span><b>${R.tg||0} oyuncu listede</b><em></em></li></ul>`;}
  h=h.replace(/(<p class="sub-h" style="margin:12px 0 6px"><span>Gelecek sezon<\/span>)/,x+'$1');
  if(R.sacked&&!/Görevden/.test(h))h=h.replace(/(<button class="cta" data-act="closeModal")/,'<p class="pill red">Görevin sona erdi · başka bir kulüpte aday olabilirsin</p>$1');
  if(bsk)h=h.replace('+ devreden bütçenin yarısı',' · kasadan aktarımı sen belirlersin').replace(/Kalan transfer bütçesi/,'Transfer bütçesi');}catch(e){console.warn(e);}return h;})(v155RevHTML);

/* =====================================================================
   ANA SAYFALAR
   ===================================================================== */
function rlKpi(items){return `<div class="rl-kpi">${items.map(([n,v,s,c])=>`<div class="${c||''}"><span>${n}</span><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`).join('')}</div>`;}
function rlPanel(t,r,body,cls){return `<section class="panel rl-p ${cls||''}"><p class="sub-h"><span>${t}</span>${r?`<span>${r}</span>`:''}</p>${body}</section>`;}
function rlBar(v,cls){return `<i class="rl-mb ${cls||''}"><em style="width:${clamp(Math.round(v),0,100)}%"></em></i>`;}
function rlWatchPref(){try{return localStorage.getItem('rlWatch')||'hizli';}catch(e){return 'hizli';}}
function rlMatchCard(){const s=G.s,f=ourFixture(),t=dayType(s.day),nm=nextMatchDay(s.day),H=G.m.hc||{},bsk=isBsk();let tk='';
  if(f){const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]];tk=ticketHTML(`${curLeague().short} · ${s.week}. hafta`,`${t==='mac'?'Bugün':nm!=null?fmtDate(dateOf(nm)):''} · ${usHome?'İç saha':'Deplasman'}`,CLUBS[f[0]],CLUBS[f[1]],`Rakip: ${esc(opp.name)} · güç ${R200(opp.str)} – bizim ${R200(xiStr())}`);}
  if(t==='kupa')return tk+`<button class="cta big" data-act="mgrCup"><span>Kupa maçının sonucunu al</span><small>Takımı ${esc(H.n||'teknik direktör')} yönetir</small></button>`;
  if(t!=='mac')return tk+`<button class="cta big" data-act="mgrAdv"><span>Maç gününe ilerle</span><small>${nm!=null?fmtDate(dateOf(nm))+' · '+(nm-s.day)+' gün':''} · haftanın kararları yolda karşına çıkar</small></button>`;
  const pr=rlWatchPref(),loc=`<button class="${pr==='loca'?'cta big':'btn w3b'} rl-loca" data-act="rlWatch" data-k="loca"><span>🏟 ${bsk?'Maçı locadan izle':'Maçı tribünden izle'}</span><small>3B canlı · takımı ${esc(H.n||'hoca')} yönetir · skor motordan</small></button>`,
    yay=`<button class="${pr==='yayin'?'cta big':'btn'}" data-act="rlWatch" data-k="yayin"><span>📺 Yayından izle</span>${pr==='yayin'?'<small>Canlı yayın, taktik yok</small>':''}</button>`,
    hz=`<button class="${pr==='hizli'?'cta big':'btn'}" data-act="mgrPlay"><span>⏩ Hızlı sonuç</span>${pr==='hizli'?'<small>Maç sonucunu ve raporu hemen al</small>':''}</button>`;
  const ord=pr==='loca'?[loc,yay,hz]:pr==='yayin'?[yay,loc,hz]:[hz,loc,yay];return tk+ord[0]+`<div class="rl-mrow">${ord.slice(1).join('')}</div>`;}
function rlWeekNote(){const R=rlRoll();return `<p class="muted rl-wn">Bu hafta ${R.n} karar verildi${R.hist.length?` · son 4 haftada ortalama ${(R.hist.slice(-4).reduce((a,x)=>a+x,0)/Math.min(4,R.hist.length)).toFixed(1).replace('.',',')}`:''}</p>`;}
function rlHcBox(){const m=G.m,H=m.hc||{},mood=rlMood();return `<div class="rl-hc"><b>${esc(H.n||'—')}</b><small>${esc(H.f||'')} · kalite ${H.q||'-'} · seninle ${H.w||0}G ${H.d||0}B ${H.l||0}M</small><div class="rl-row"><span>Hocayla ilişki</span>${rlBar(mood,mood<35?'bad':mood>=65?'good':'')}<b>${Math.round(mood)}</b></div>${H.tmp?'<p class="pill red">Geçici hoca görevde · yeni teknik direktör seç</p>':''}</div>`;}
function rlHubSD(){const m=G.m,c=myClub(),bids=(m.bids||[]).filter(b=>b.until>G.s.day),sq=squadOf(G.club),wb=(()=>{try{return wageBill();}catch(e){return 0;}})(),pos=G.s.results.length?tablePos()+'.':'—';
  const kpi=rlKpi([['Transfer bütçesi',money(m.budget)],['Haftalık maaş',eur(wb),m.wbud?`tavan ${eur(m.wbud)}`:''],['Yönetim güveni',Math.round(m.conf),'',m.conf<35?'bad':''],['Hocayla ilişki',Math.round(rlMood()),'',rlMood()<35?'bad':''],['Sıra',pos,esc((m.obj||{}).txt||'')]]);
  const tg=(m.sdT||[]).map(x=>{const p=rlP(x.k),cid=rlPC(x.k);if(!p||cid===G.club)return '';return `<div class="rl-tg"><button class="trrow" data-act="pcard" data-id="${cid}" data-k="${x.k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${p.age} · ${esc(CLUBS[cid].short)} · ${esc({scout:'scout',hoca:'hoca isteği',menajer:'menajer',sd:'SD',maç:'maç notu',sen:'sen'}[x.src]||'')}</small></span><span class="to"><b>${R200(p.ovr)}</b><small>${eur(pValue(p))}</small></span></button><div class="sc-b"><button class="cta sm" data-act="trcOffer" data-id="${cid}" data-k="${x.k}" data-t="tr">Teklif</button><button class="btn sm ghost" data-act="rlTgtDel" data-k="${x.k}">Çıkar</button></div></div>`;}).join('');
  const need=rlNeed(),wk=rlWeakest();const plan=`<table class="rl-plan"><thead><tr><th>Hat</th><th>Oyuncu</th><th>İlk 11</th><th>31+</th><th>Biten</th></tr></thead><tbody>${need.map(n=>`<tr class="${n.pos===wk.pos?'weak':''}"><td>${POS_TR[n.pos]}</td><td>${n.n}</td><td>${R200(Math.round(n.avg))}</td><td>${n.old}</td><td>${n.exp}</td></tr>`).join('')}</tbody></table><p class="muted" style="margin:6px 0 0">Takviye önceliği: <b>${POS_TR[wk.pos]}</b>. ${m.sdPlan&&Object.keys(m.sdPlan).length?`Dönem açılınca uygulanacak ${Object.keys(m.sdPlan).length} karar var.`:''}</p>`;
  const sc=m.scout&&LEAGUES[m.scout.lid],reps=(m.reports||[]).slice(0,3).map(r=>{const p=rlP(r.k),cid=rlPC(r.k);if(!p||cid===G.club)return '';return `<li><span>${esc(p.name)}</span><b>${p.age} · ${dpTag(p)} · ${R200(p.ovr)}</b><em><button class="btn sm ghost" data-act="rlTgtQ" data-k="${r.k}" data-id="${cid}">Listeye</button></em></li>`;}).join('');
  const scout=`<p class="muted" style="margin:0 0 6px">${sc?`Görev: <b>${esc(LEAGUES[m.scout.lid].name)}</b>${m.scUntil>absDay()?` · ${m.scUntil-absDay()} gün kaldı`:''}`:'Scoutlar boşta: bir lig seç.'}</p><div class="filt" style="margin:0">${[G.s.league].concat(Object.keys(LEAGUES).filter(l=>!LEAGUES[l].youth&&l!==G.s.league&&LEAGUES[l].tier===curLeague().tier&&leagueClubs(l).length>4).slice(0,3)).map(l=>`<button class="chip" data-act="scLg" data-k="${l}" aria-pressed="${!!(m.scout&&m.scout.lid===l)}">${esc(LEAGUES[l].short)}</button>`).join('')}</div>${reps?`<ul class="cupres" style="margin-top:8px">${reps}</ul>`:''}`;
  const bidsH=bids.length?`<ul class="ag-l">${bids.slice(0,4).map(b=>{const p=pByKey(b.k),cl=CLUBS[b.club];return p&&cl?`<li><div><b>${esc(p.name)}</b><small>${esc(cl.name)} · ${eur(b.fee)}</small></div><button class="btn sm" data-act="bidO" data-id="${b.id}">İncele</button></li>`:'';}).join('')}</ul>`:'<p class="muted" style="margin:0">Bekleyen teklif yok.</p>';
  const exp=sq.filter(p=>{try{return ctExpiring(p);}catch(e){return false;}}).sort((a,b)=>b.ovr-a.ovr).slice(0,3);
  let yth='';try{const a=acadInit();yth=a.acad.map(k=>pByKey(k)).filter(Boolean).sort((x,y)=>potOf(y)-potOf(x)).slice(0,2).map(p=>`<li><span>${esc(p.name)}</span><b>${p.age} · ${dpTag(p)} · POT ${acadPotTxt(p)}</b><em><button class="btn sm" data-act="acadUpP" data-k="${p.k}">A takıma al</button></em></li>`).join('');}catch(e){}
  return v155Alert()+rlMatchCard()+kpi+rlWeekNote()+`<div class="rl-grid">`+
    rlPanel('Transfer hedefleri',`${(m.sdT||[]).length}/10`,(tg||`<p class="muted" style="margin:0">Liste boş. Scout raporları, hocanın istekleri ve menajer önerileri buraya düşer.</p>`)+`<button class="btn sm rl-more" data-act="navGo" data-tab="squad" data-k="transfer">Transfer pazarında ara</button>`)+
    rlPanel('Kadro planı',esc(c.short),plan)+
    rlPanel('Teknik direktörle ilişki','',rlHcBox()+`<button class="btn sm" data-act="navGo" data-tab="hcm">Teknik direktör yönetimi</button>`)+
    rlPanel('Scout ağı',sc?esc(LEAGUES[m.scout.lid].short):'boşta',scout)+
    rlPanel('Gelen teklifler',String(bids.length),bidsH)+
    rlPanel('Sözleşmesi bitenler ve altyapı','',`${exp.length?`<ul class="cupres">${exp.map(p=>`<li><span>${esc(p.name)}</span><b>${p.age} · ${R200(p.ovr)} · ${ctEnd(p)}</b><em><button class="btn sm ghost" data-act="navGo" data-tab="squad" data-k="soz">Görüş</button></em></li>`).join('')}</ul>`:'<p class="muted" style="margin:0">Bu sezon biten önemli sözleşme yok.</p>'}${yth?`<ul class="cupres">${yth}</ul>`:''}`)+`</div>`;}
function rlBskBody(full){const m=G.m,B=bk172(),c=myClub(),cs=cstate(G.club),S=B.sec,E=S.cur,nd=rlND(),Gy=bskGy(),D=B.def||rlDefNew();let gs=0,xs=0;for(const k in D.gel)gs+=D.gel[k];for(const k in D.gid)xs+=D.gid[k];
  const left=E?`${Math.max(0,E.at-absDay())} gün`:S.next>G.s.year?`${S.next} sezonu`:'bu sezon';
  const kpi=rlKpi([['Kasa',money(B.kasa),`haftalık net ${B.lastW?money(B.lastW.g-B.lastW.x):'—'}`,B.kasa<0?'bad':''],['Borç',money(B.debt),`ND ${nd.toFixed(2)}`,nd>0.8?'bad':''],['Üye desteği',Math.round(m.conf),'kongre',m.conf<35?'bad':m.conf>=65?'good':''],['Taraftar',Math.round(m.fans==null?60:m.fans),'memnuniyet'],['Seçim',E?'kampanya':left,E?`${esc(E.ch.n)} · ${left}`:`dönem ${S.per} yıl`,E?'warn':'']]);
  const fin=`<ul class="cupres"><li><span>Sezon geliri</span><b>${money(gs)}</b><em></em></li><li><span>Sezon gideri</span><b>${money(xs)}</b><em class="${gs-xs<0?'res-l':'res-w'}">${money(gs-xs)}</em></li><li><span>Transfer bütçesi</span><b>${money(m.budget)}</b><em></em></li><li><span>Sponsor geliri</span><b>${money(rlSpYear())}/yıl</b><em></em></li></ul>
   <p class="sub-h" style="margin:10px 0 4px"><span>Bilet</span></p><div class="seg">${Object.entries(TIX).map(([k,[n]])=>`<button class="chip" data-act="bskTix" data-k="${k}" aria-pressed="${B.tix===k}">${n}</button>`).join('')}</div>
   <p class="sub-h" style="margin:10px 0 4px"><span>Forma</span></p><div class="seg">${Object.entries(BSK_FORMA).map(([k,[n]])=>`<button class="chip" data-act="rlForma" data-k="${k}" aria-pressed="${B.forma===k}">${n}</button>`).join('')}</div>
   <p class="sub-h" style="margin:10px 0 4px"><span>Transfer bütçesi belirle</span></p><div class="seg"><button class="chip" data-act="rlBud" data-p="10">Kasadan +%10</button><button class="chip" data-act="rlBud" data-p="25">Kasadan +%25</button><button class="chip" data-act="rlBud" data-p="-20">Kasaya geri al %20</button></div>`;
  const uye=`${rlBlokHTML()}<p class="muted" style="margin:6px 0 0">${B.uye.n.toLocaleString('tr-TR')} oy hakkı olan üye · olağan mali genel kurul her sezon sonunda (mali ve idari ibra) · seçimli genel kurul ${S.next} sezonunda (${S.per} yılda bir).</p>${S.imza?`<p class="pill red">İmza kampanyası: üyelerin %${S.imza.pct}’i imzaladı (eşik %20)</p>`:''}${E?`<p class="pill">Anket: sen %${Math.round(clamp(rlSig(rlVoteP(E))*100+((hash(G.club+rlWk())%13)-6),10,90))} · ${esc(E.ch.n)} (${esc(E.ch.tn)}) · ±%6</p>`:''}${B.uye.vaat.length?`<ul class="cupres">${B.uye.vaat.slice(0,4).map(v=>`<li><span>Vaat</span><b>${esc(BSK_VAAT[v.k][0])}</b><em class="${v.st==='tutuldu'?'res-w':v.st==='bozuldu'?'res-l':''}">${v.st}</em></li>`).join('')}</ul>`:''}`;
  const sp=`<ul class="cupres">${Object.keys(BSK_SLOT).map(k=>{const x=k==='gogus'?B.sp:B.spn[k];if(k==='stad'&&(cs.cap||0)<10000&&!x)return '';return `<li><span>${BSK_SLOT[k]}</span><b>${x?esc(x.n):'boş'}</b><em>${x?`${money(x.amt)}/yıl · ${Math.ceil(x.w/52)} yıl`:'teklif bekleniyor'}</em></li>`;}).join('')}</ul>`;
  const fc=rlFacCost(),tes=`<ul class="cupres"><li><span>Antrenman/akademi</span><b>${cs.fac}/5</b><em>${cs.fac>=5?'en üst seviye':''}</em></li><li><span>Stadyum</span><b>${(cs.cap||0).toLocaleString('tr-TR')} kişi</b><em>zemin ${esc(cs.cond||'—')}</em></li></ul><div class="reqs">${cs.fac<5?`<button class="req" data-act="bskFac"><b>Tesis yatırımı</b><small>${money(fc)}</small></button>`:''}<button class="req" data-act="rlCap"><b>Tribün genişlet</b><small>${money(rlR(Gy*0.18))} · +%12</small></button>${cs.cond!=='Çok iyi'?`<button class="req" data-act="rlPitch"><b>Zemin yenile</b><small>${money(rlR(Gy*0.03))}</small></button>`:''}<button class="req" data-act="bskLoan"><b>Banka kredisi</b><small>${money(rlR(Gy*0.15))} · %32 faiz</small></button></div>`;
  const rel=rlHcBox()+`<div class="rl-row"><span>Sportif direktör</span>${B.sd&&!B.sd.me?rlBar(B.sd.mood||60):''}<b>${B.sd?esc(B.sd.n):'atanmadı'}</b></div><button class="btn sm" data-act="navGo" data-tab="hcm">Hoca ata / görevden al</button>`;
  const yk=`<ul class="cupres">${B.yk.map(x=>`<li><span>${esc(x.r)}</span><b>${esc(x.n)}</b><em></em></li>`).join('')}</ul>`;
  const hist=full&&S.hist.length?rlPanel('Seçim geçmişi','',`<ul class="cupres">${S.hist.slice(0,6).map(x=>`<li><span>${x.y}${x.tip==='olaganustu'?' · olağanüstü':''}</span><b>%${x.me} · rakip ${esc(x.ch)}</b><em class="${x.won?'res-w':'res-l'}">${x.won?'kazandın':'kaybettin'}</em></li>`).join('')}</ul>`):'';
  return kpi+(full?'':rlWeekNote())+`<div class="rl-grid">`+rlPanel('Kulüp finansı',esc(c.short),fin)+rlPanel('Üyeler, kongre ve seçim takvimi',E?'kampanya':'',uye)+rlPanel('Sponsorlar','',sp)+rlPanel('Tesisler','',tes)+rlPanel('Hoca ve sportif direktör','',rel)+rlPanel('Yönetim kurulu','',yk)+hist+`</div>`;}
function rlHubBsk(){return v155Alert()+rlMatchCard()+rlBskBody(false);}
viewMgrHub=(old=>function(){try{if(isRole()&&G.phase==='season'&&G.s&&G.m&&G.m.hc)return isBsk()&&bk172()?rlHubBsk():rlHubSD();}catch(e){console.warn('v172 ana sayfa',e);}return old.apply(this,arguments);})(viewMgrHub);
viewBsk=(old=>function(){try{if(bk172())return `<h2 class="h">Başkanlık</h2>`+v155Alert()+rlBskBody(true);}catch(e){console.warn(e);}return old.apply(this,arguments);})(viewBsk);
try{XV.bsk=function(){return viewBsk();};}catch(e){}
/* başkanda ölçüt "yönetim güveni" değil "üye desteği" (U9) */
const rlConfTxt=h=>isBsk()?String(h).replace(/Yönetim güveni/g,'Üye desteği').replace(/yönetim güveni/g,'üye desteği').replace(/Yönetimle toplantı iste/g,'Yönetim kurulunu topla'):h;
viewHcm=(old=>function(){return rlConfTxt(old.apply(this,arguments));})(viewHcm);
viewMgrBoard=(old=>function(){return rlConfTxt(old.apply(this,arguments));})(viewMgrBoard);
try{if(typeof viewFin==='function')viewFin=(old=>function(){return rlConfTxt(old.apply(this,arguments));})(viewFin);}catch(e){}
try{XV.fin=(old=>function(){return rlConfTxt(old.apply(this,arguments));})(XV.fin);}catch(e){}
/* kaybeden/ibra edilmeyen başkan: iş teklifi değil adaylık */
viewMgrOff=(old=>function(){let h=old.apply(this,arguments);try{if(isRole()&&G.m.role==='bsk')h=h.replace('Teklif eden kulüpler','Aday olabileceğin kulüpler').replace(/>Anlaş<\/button>/g,'>Aday ol</button>').replace('Yaz arası · teknik direktör','Yaz arası · kulüp başkanı').replace('Görevden alındın','Görevin sona erdi');else if(isRole())h=h.replace('Yaz arası · teknik direktör','Yaz arası · sportif direktör');}catch(e){}return h;})(viewMgrOff);
mgrSign=(old=>function(id){const bsk=isBsk();const r=old.apply(this,arguments);try{if(isRole()&&G.inbox){const c=CLUBS[id];G.inbox=G.inbox.filter(x=>!(x&&x.title===`${c&&c.name} ile anlaştın`&&/^Teknik direktör olarak/.test(x.body||'')));}}catch(e){}try{if(bsk&&isBsk()){const B=bskInit();B.v172=0;bk172();const m0=G.inbox&&G.inbox.find(x=>x.t==='board');}if(isRole())G.m.sq0={y:G.s.year,k:squadOf(G.club).map(p=>p.k)};}catch(e){console.warn(e);}return r;})(mgrSign);
/* kariyer başlangıcında ilk seçim sonucu: başkan genel kurulda seçilerek göreve başlar */
wizGo=(old=>function(){const p=W&&W.prof;const r=old.apply(this,arguments);try{if((p==='sd'||p==='bsk')&&G&&G.m&&isRole()){if(p==='bsk'){const B=bk172();if(B&&!B.sec.hist.length){const ch=rlRival(G.club+'ilk'),tot=Math.max(60,Math.round(B.uye.n*0.5)),pc=rint(52,61),me=Math.round(tot*pc/100);B.sec.hist.unshift({y:G.s.year,me:pc,ch:ch.n,won:true,tip:'olagan',tot});
      v155Push({g:'el',k:'el_res',key:'ilk',info:1,t:'Genel kurul: başkan seçildin',b:`<div class="v155-vote"><div><b>${esc(PN())}</b><i><em style="width:${pc}%"></em></i><span>%${pc} · ${me.toLocaleString('tr-TR')} oy</span></div><div><b>${esc(ch.n)}</b><i><em class="r" style="width:${100-pc}%"></em></i><span>%${100-pc} · ${(tot-me).toLocaleString('tr-TR')} oy</span></div></div><p>${esc(myClub().name)} olağan genel kurulunda ${esc(ch.tn.toLocaleLowerCase('tr-TR'))} ${esc(ch.n)} karşısında başkan seçildin. Dönem ${B.sec.per} yıl; seçimli genel kurul ${B.sec.next} sezonunda. Her sezon sonunda mali genel kurulda ibra oylaması yapılır.</p>`,o:[['ok','Göreve başla']]});}}
    save();render();}}catch(e){console.warn('v172 başlangıç',e);}return r;})(wizGo);

/* =====================================================================
   LOCADAN / TRİBÜNDEN İZLEME: maç gerçek motorla oynanır, takımı hoca yönetir
   ===================================================================== */
const LOCA={on:0,mode:'',f:null,notes:[],t:0,S:null,W:null,prev:null,sc:[0,0],bub:0,said:{},ph:{},react:null,scoutK:null};
try{V155_GATE.add('rlWatch');}catch(e){}try{MP_ADV.add('rlWatch');}catch(e){}
const LOCA_SOZ={g:['Bu sezonun golü!','Ben demiştim, bu takım bugün kazanır.','Tribün yıkılıyor!','Sponsorumuz çok mutlu olacak.','İşte para verdiğimiz futbol bu!','Yarın manşetler bizim.'],
  y:['Savunma yine uyudu…','Hoca bunu devre arasında konuşmalı.','Yarın gazeteler ne yazar…','Sakin olalım, daha çok dakika var.','Bu golün faturası bize çıkar.'],
  k:['Hakem bu kararı nereden buldu?','Rakip zaman geçiriyor.','Tempo düştü, bir değişiklik şart.','Kanatlardan daha çok gitmeliyiz.']};
ACTX.rlWatch=el=>{if(!isRole()||(typeof FX!=='undefined'&&FX))return;const f=ourFixture();if(!f||dayType(G.s.day)!=='mac')return;const mode=(el&&el.dataset&&el.dataset.k)||'loca';try{localStorage.setItem('rlWatch',mode);}catch(e){}
  const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]];try{const S0=xiStr();G.m.xi=null;G.m.tac=opp.str>S0+3?'savunma':opp.str<S0-3?'hucum':'dengeli';}catch(e){}
  Object.assign(LOCA,{on:1,mode,f,notes:[],t:0,S:null,W:null,prev:null,sc:[0,0],bub:0,said:{},ph:{},react:null,scoutK:null});
  try{fxStart({opp,usHome,neutral:false,onEnd:(gu,go,sc)=>{locaClean();const r=mgrFinish(gu,go,f,sc);try{const H=G.m.hc;if(H){if(gu>go)H.w++;else if(gu===go)H.d++;else H.l++;}}catch(e){}LOCA.on=0;save();return r;}});}
  catch(e){console.warn('loca',e);LOCA.on=0;mgrPlay(true);return;}
  const S=typeof FX!=='undefined'?FX:null;if(!S){LOCA.on=0;mgrPlay(true);return;}S.bsk=1;S.loca=mode==='loca'?1:0;LOCA.S=S;
  try{fxEv(0,`${isBsk()?'Locadasın':'Tribündesin'}: ${S.U.name} – ${S.O.name}. Takımı ${(G.m.hc&&G.m.hc.n)||'teknik direktör'} yönetiyor.`,'bold');}catch(e){}
  if(!S.ab){try{if(mode==='loca'&&typeof f3Sup==='function'&&f3Sup()&&!F3.on)f3Toggle(true);}catch(e){}}
  locaTick();};
function locaTick(){const S=LOCA.S;if(!LOCA.on||!S||(typeof FX!=='undefined'&&FX!==S))return;try{locaStep(S);}catch(e){console.warn('loca adım',e);}setTimeout(locaTick,500);}
function locaStep(S){if(!S.ab){return;}const W=ABM.win;if(!W||!ABM.sim||ABM.fx!==S)return;
  if(!LOCA.W){LOCA.W=W;try{LOCA.prev=W.ado2d.view.get();}catch(e){}
    if(LOCA.mode==='loca'){try{if(W.ado2d.view.supported())W.ado2d.view.set('loca');}catch(e){}try{W.__abLoca&&W.__abLoca(true);}catch(e){}locaFG(W);}
    else{try{if(W.ado2d.view.supported()&&LOCA.prev&&LOCA.prev.view!=='3d')W.ado2d.view.set('bcast');}catch(e){}}}
  if(LOCA.mode!=='loca')return;
  let mn=0;try{mn=Math.floor(abMin());}catch(e){}let u=0,o=0;try{u=ABM.sim.teams[abS2E(0)].score;o=ABM.sim.teams[abS2E(1)].score;}catch(e){}
  const d=W.document,sb=d.getElementById('lcSc'),mi=d.getElementById('lcMn'),F=LOCA.f||[],H=!!(S.o&&S.o.usHome),hs=H?u:o,as=H?o:u;if(sb)sb.textContent=`${(CLUBS[F[0]]||{}).short||''} ${hs}–${as} ${(CLUBS[F[1]]||{}).short||''}`;if(mi)mi.textContent=mn+'’';
  if(u>LOCA.sc[0]){LOCA.sc[0]=u;try{W.__abLocaOpen&&W.__abLocaOpen();}catch(e){}locaBub(W,'g');locaReact(W,'g');const s=d.getElementById('loca-wall');if(s){s.classList.add('flash');setTimeout(()=>s.classList.remove('flash'),3000);}const hd=d.getElementById('lcHeads');if(hd){hd.classList.add('jump');setTimeout(()=>hd.classList.remove('jump'),500);}}
  if(o>LOCA.sc[1]){LOCA.sc[1]=o;locaBub(W,'y');locaReact(W,'y');}
  if(mn>=20&&!LOCA.ph.a){LOCA.ph.a=1;locaPhone(W,'a');}if(mn>=62&&!LOCA.ph.b){LOCA.ph.b=1;locaPhone(W,'b');}
  if(mn>=35&&mn%17===0&&!LOCA.said['k'+mn])locaBub(W,'k');
  if(LOCA.react&&Date.now()-LOCA.react.t>20000){locaReactClose(W,'Sessiz kaldın');}}
function locaPeople(){const B=isBsk()?bk172():null;if(B)return [[B.yk[0].n,B.yk[0].r],[B.sp?B.sp.n+' yöneticisi':'Sponsor konuğu','konuk'],[B.yk[1].n,B.yk[1].r]];return [[rlName(G.club+'pres'),'Kulüp başkanı'],[rlName(G.club+'scsef'),'Scout şefi']];}
function locaBub(W,t){const now=Date.now();if(now-LOCA.bub<9000&&t==='k')return;LOCA.bub=now;const P=locaPeople(),L=LOCA_SOZ[t].filter(x=>!LOCA.said[x]);if(!L.length)return;const s=L[Math.floor(Math.random()*L.length)];LOCA.said[s]=1;if(t==='k')LOCA.said['k'+(Math.floor(abMin()))]=1;
  const who=P[Math.floor(Math.random()*P.length)],b=W.document.getElementById('lcBub');if(!b)return;const el=W.document.createElement('div');el.className='lc-b';el.innerHTML=`<b>${esc(who[0])}</b><span>${esc(s)}</span>`;b.appendChild(el);setTimeout(()=>{try{el.remove();}catch(e){}},6500);}
function locaCard(W,title,opts,cb){const box=W.document.getElementById('lcPal');if(!box)return;locaReactClose(W);LOCA.react={t:Date.now(),cb};box.innerHTML=`<div class="lc-card"><p>${esc(title)}</p>${opts.map((o,i)=>`<button type="button" data-i="${i}">${esc(o[0])}</button>`).join('')}</div>`;box.hidden=false;
  box.onclick=ev=>{const b=ev.target.closest('button[data-i]');if(!b)return;const o=opts[+b.dataset.i];try{o[1]();}catch(e){console.warn(e);}LOCA.notes.push(`${title}: ${o[0]}`);box.hidden=true;box.innerHTML='';LOCA.react=null;};}
function locaReactClose(W,txt){const box=W&&W.document.getElementById('lcPal');if(LOCA.react&&txt)LOCA.notes.push(txt);LOCA.react=null;if(box){box.hidden=true;box.innerHTML='';}}
function locaReact(W,t){const bsk=isBsk();if(t==='g'){if(bsk)locaCard(W,'Gol bizden!',[['Taraftarı selamla',()=>{rlU('tribun',1);if(Math.random()<0.2){G.m.media=clamp((G.m.media||50)+2,0,100);msg('gundem','Başkanın sevinci','Kameralar locadaki coşkuyu yakaladı.');}}],['Yönetimle kucaklaş',()=>rlU('is',0.5)],['Ağırbaşlı alkış',()=>rlU('divan',0.5)]]);
    else locaCard(W,'Gol bizden!',[['Hocayı tebrik et (mesaj)',()=>rlHc(1)],['Not al: golcünün performansı',()=>{}]]);}
  else{if(bsk)locaCard(W,'Rakip gol attı',[['Takımı ayakta alkışla',()=>rlU('tribun',1)],['Hakemi protesto et',()=>{rlU('tribun',2);if(Math.random()<0.35){const c=rlR(bskGy()*0.002);rlKasa(-c,0,'diger');msg('board','Disiplin cezası',`Locadaki tepkin nedeniyle kulübe ${money(c)} para cezası.`);}}],['Locayı terk et',()=>{G.m.media=clamp((G.m.media||50)-2,0,100);rlU('tribun',-1);}],['Sakin kal',()=>{}]]);
    else locaCard(W,'Rakip gol attı',[['Not al: savunma hattı takviye',()=>{G.m.sdNote='DF';}],['Sakin kal',()=>{}]]);}}
function locaPhone(W,k){const bsk=isBsk(),H=G.m.hc||{},S=LOCA.S;if(k==='a'){if(bsk)locaCard(W,'📱 Taraftar grubu lideri: “Bugün koreografi var, katkı verir misiniz?”',[['Evet, katkı ver',()=>{rlKasa(-rlR(bskGy()*0.001),0,'diger');rlU('tribun',2);rlFans(1);}],['Hayır',()=>rlU('tribun',-1)]]);
    else{let best=null;try{best=squadOf(S.o.opp.id).filter(p=>p.age<=27).sort((a,b)=>b.ovr-a.ovr)[0];}catch(e){}if(best)locaCard(W,`📱 Scout şefi: “Rakipte ${best.name} (${best.age}) çok iyi oynuyor. Listeye ekleyelim mi?”`,[['Evet, listeye ekle',()=>rlTgtAdd(best.k,S.o.opp.id,'maç')],['Hayır',()=>{}]]);}}
  else locaCard(W,`📱 ${H.n||'Hoca'}: “Oyunu değiştirmek için hücum oyuncusu sokacağım.”`,[['“Sana güveniyorum”',()=>rlHc(2)],['“Bence sabırlı ol”',()=>{if(rlMood()>=55){rlHc(-1);}else rlHc(-3);}]]);}
function locaFG(W){const d=W.document;if(d.getElementById('loca-fg'))return;const st=d.createElement('style');st.id='loca-css';st.textContent=`
#loca-fg{position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden}
#loca-fg .lc-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,rgba(0,0,0,0) 55%,rgba(5,8,12,.55) 100%)}
#loca-fg .lc-gl{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,240,200,0) 30%,rgba(255,240,200,.07) 38%,rgba(255,240,200,0) 46%);background-size:300% 100%;animation:lcgl 30s linear infinite}
@keyframes lcgl{0%{background-position:100% 0}100%{background-position:-100% 0}}
#loca-fg .lc-bar{position:absolute;top:0;bottom:0;width:14px;background:linear-gradient(90deg,#1b1f25,#3a414b 45%,#14171b);box-shadow:0 0 18px rgba(0,0,0,.6)}
#loca-fg .lc-bar.l{left:7%}#loca-fg .lc-bar.r{right:7%}
#loca-fg .lc-top{position:absolute;left:0;right:0;top:0;height:16px;background:linear-gradient(#0d1013,#262b31)}
#loca-fg .lc-desk{position:absolute;left:0;right:0;bottom:0;height:7%;min-height:34px;background:linear-gradient(#5b3a22,#2e1c10 60%,#1a0f08);box-shadow:0 -6px 18px rgba(0,0,0,.55);display:flex;align-items:center;gap:14px;padding:0 9%}
#loca-fg .lc-desk svg{width:28px;height:28px;opacity:.9}
#loca-fg .lc-tea{width:12px;height:18px;border-radius:2px 2px 5px 5px;background:linear-gradient(#b5452a,#6d1d0c);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)}
#loca-fg .lc-prog{font:600 10px system-ui;color:#e8d9c4;letter-spacing:.12em;opacity:.75}
#lcHeads{position:absolute;left:0;right:0;bottom:7%;height:26px;display:flex;justify-content:space-around;transition:transform .2s}
#lcHeads i{width:46px;height:30px;border-radius:24px 24px 0 0;background:#07090c;opacity:.8}
#lcHeads.jump{transform:translateY(-10px)}
#loca-wall{position:fixed;left:10px;top:10px;z-index:41;pointer-events:none;background:#050607;border:3px solid #23272d;border-radius:6px;padding:4px 10px;font:700 15px/1.2 ui-monospace,monospace;color:#ffb347;text-shadow:0 0 6px rgba(255,160,40,.7);display:flex;gap:10px;align-items:center}
#loca-wall i{font-style:normal;color:#9fd3ff;text-shadow:0 0 6px rgba(80,170,255,.6)}
#loca-wall.flash{animation:lcfl .5s steps(2) 6}@keyframes lcfl{50%{opacity:.25}}
#lcBub{position:fixed;left:12px;bottom:calc(7% + 34px);z-index:42;display:flex;flex-direction:column;gap:6px;pointer-events:none;max-width:min(320px,70vw)}
#lcBub .lc-b{background:rgba(250,248,240,.94);color:#1b1d21;border-radius:12px 12px 12px 3px;padding:5px 9px;font:13px/1.3 system-ui;box-shadow:0 3px 10px rgba(0,0,0,.35);animation:lcin .25s ease-out}
#lcBub .lc-b b{display:block;font-size:11px;color:#7a5a2a}
@keyframes lcin{from{transform:translateY(8px);opacity:0}}
#lcPal{position:fixed;right:12px;bottom:calc(7% + 34px);z-index:43;pointer-events:auto;max-width:min(330px,80vw)}
#lcPal .lc-card{background:rgba(18,22,28,.94);color:#f2f2f2;border:1px solid rgba(255,200,120,.35);border-radius:12px;padding:10px;box-shadow:0 6px 22px rgba(0,0,0,.5);font:13px/1.35 system-ui}
#lcPal .lc-card p{margin:0 0 8px;font-weight:600}
#lcPal .lc-card button{display:block;width:100%;margin:5px 0 0;padding:7px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font:13px system-ui;text-align:left;cursor:pointer}
#lcPal .lc-card button:hover{background:rgba(255,190,90,.22)}
.lc-ht{margin:10px 0;display:grid;gap:6px}.lc-ht p{margin:0;font-weight:700}.lc-ht .abh-tr{font-size:13px;opacity:.85}
@media (max-width:700px){#loca-fg .lc-bar{display:none}#loca-wall{font-size:13px}}`;
  d.head.appendChild(st);const fg=d.createElement('div');fg.id='loca-fg';fg.setAttribute('aria-hidden','true');let cr='';try{cr=crestSVG(myClub(),28);}catch(e){}
  fg.innerHTML=`<div class="lc-vig"></div><div class="lc-gl"></div><div class="lc-top"></div><i class="lc-bar l"></i><i class="lc-bar r"></i><div id="lcHeads"><i></i><i></i><i></i><i></i><i></i></div><div class="lc-desk">${cr}<span class="lc-tea"></span><span class="lc-prog">MAÇ PROGRAMI · ${esc((myClub().short||'').toLocaleUpperCase('tr-TR'))}</span></div>`;
  d.body.appendChild(fg);const wl=d.createElement('div');wl.id='loca-wall';wl.innerHTML='<b id="lcSc">0–0</b><i id="lcMn">0’</i>';d.body.appendChild(wl);
  const bb=d.createElement('div');bb.id='lcBub';d.body.appendChild(bb);const pl=d.createElement('div');pl.id='lcPal';pl.hidden=true;d.body.appendChild(pl);d.body.classList.add('ab-loca');}
function locaClean(){const W=LOCA.W;LOCA.on=0;if(!W)return;try{W.__abLoca&&W.__abLoca(false);}catch(e){}try{const d=W.document;['loca-fg','loca-wall','lcBub','lcPal','loca-css'].forEach(id=>{const e=d.getElementById(id);if(e)e.remove();});d.body.classList.remove('ab-loca');}catch(e){}
  try{const P=LOCA.prev;if(P&&W.ado2d.view.supported()){if(P.view!=='3d')W.ado2d.view.set('2d');else W.ado2d.view.set(P.cam3==='loca'?'bcast':(P.cam3||'bcast'));}}catch(e){}LOCA.W=null;}
/* devre arası (113: abHalf → S.bsk) */
function v158Half(S){const W=ABM.win;if(!W)return;const ho=W.document.getElementById('halftime-overlay');if(!ho||ho.querySelector('.lc-ht'))return;const bsk=isBsk(),ft=W.document.getElementById('ht-foot')||ho;
  const opts=bsk?[['oda','Soyunma odasına in, konuş'],['prim','İkinci yarı için prim sözü ver'],['hoca','Hocaya bırak']]:[['oda','Hocayla kısa görüş'],['hoca','Hocaya bırak']];
  const box=W.document.createElement('div');box.className='abh-talk lc-ht';box.innerHTML=`<p>${bsk?'Devre arası · loca':'Devre arası · sportif direktör'}</p><div class="abh-tb">${opts.map(([k,l])=>`<button type="button" class="btn btn-ghost" data-lk="${k}">${l}</button>`).join('')}</div><p class="abh-tr" hidden></p>`;
  ft.parentNode.insertBefore(box,ft);box.addEventListener('click',ev=>{const b=ev.target.closest('[data-lk]');if(!b||box.dataset.done)return;box.dataset.done=1;const k=b.dataset.lk;let txt='';
    try{if(k==='hoca'){rlHc(2);txt='Hoca ikinci yarıyı kendi planıyla hazırlıyor.';S.htDone=true;}
      else if(k==='prim'){rlKasa(-rlR(bskGy()*0.002),0,'diger');txt=abTalk('ovgu');}
      else{const ok=Math.random()<clamp(0.35+(rlMood()-50)/100+((G.m.fans==null?60:G.m.fans)-50)/300,0.15,0.8);if(ok)txt=abTalk('beklenti');else{rlHc(bsk?-5:-2);txt=bsk?'Hoca “başkan işime karıştı” diye rahatsız oldu.':'Hoca görüşmeyi kısa kesti.';S.htDone=true;}}}catch(e){console.warn(e);}
    LOCA.notes.push(`Devre arası: ${b.textContent}`);box.querySelectorAll('button').forEach(x=>x.disabled=true);b.classList.add('btn-primary');const tr=box.querySelector('.abh-tr');tr.hidden=false;tr.textContent=txt;});
  setTimeout(()=>{try{if(FX===S&&W.ado2d.state.hold==='half'){if(!box.dataset.done)LOCA.notes.push('Devre arasında locada kaldın');W.startSecondHalf();}}catch(e){}},22000);}
/* eski "tribünden izle" düğmesi yeni gerçek motorlu izlemeye yönlenir */
ACTX.v155Watch=()=>ACTX.rlWatch({dataset:{k:'loca'}});
