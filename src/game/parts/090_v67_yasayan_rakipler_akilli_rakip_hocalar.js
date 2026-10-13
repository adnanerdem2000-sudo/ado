/* ================= v67: Yaşayan rakipler — akıllı rakip hocalar, sezon boyu hikâyeler, transfer rekabeti, ezeli rakip kuralları ================= */
/* ---------- 1) Hoca oyun stilleri ---------- */
const OAI_STY={
  pres:{n:'Önde baskı (gegenpress)',ic:'⚡',tac:'pres',ti:{pres:'yuk',yog:'cok',kayip:'karsi',hat:'yuksek',tempo:'yuk'},d:'Topu kaybettiği an baskı yapar, yüksek savunma çizgisi kullanır.'},
  pos:{n:'Topa sahip olma',ic:'🎯',tac:'dengeli',ti:{pas:'kisa',kazan:'tut',gen:'gen',sut:'sabir',set:'yavas',kaleci:'kisa'},d:'Kısa paslarla oyunu kontrol eder, sabırla pozisyon arar.'},
  kontra:{n:'Kontra atak',ic:'🏹',tac:'dengeli',ti:{pres:'orta',hat:'derin',kazan:'kontra',arka:'evet',pas:'direkt',set:'hizli'},d:'Rakibi kendi yarı alanına çeker, topu kazanınca hızlı çıkar.'},
  blok:{n:'Derin blok',ic:'🧱',tac:'savunma',ti:{pres:'dus',hat:'derin',gen:'dar',kazan:'kontra',yonl:'kenar'},d:'Kalesini kapatır, az pozisyon verir, duran top ve kontraları kollar.'},
  direkt:{n:'Uzun top',ic:'🚀',tac:'dengeli',ti:{pas:'direkt',kaleci:'uzun',orta:'bol',arka:'evet'},d:'Orta sahayı hızlı geçer, ön libero ve kanatlara uzun top oynar.'},
  kanat:{n:'Kanat oyunu',ic:'↔',tac:'dengeli',ti:{gen:'gen',orta:'bol',drip:'cok'},d:'Hücumları kanatlara yayar, bol orta yapar.'},
  fizik:{n:'Fiziksel ve sert',ic:'🛡',tac:'dengeli',ti:{mud:'sert',yog:'cok',pas:'direkt',hat:'nor'},d:'İkili mücadeleleri sertleştirir, rakibi yıpratarak oynar.'},
  denge:{n:'Dengeli',ic:'⚖',tac:'dengeli',ti:{},d:'Rakibe göre şekil alan, risk almayan bir oyun planı.'}};
const OAI_REAL={Arteta:'pos',Maresca:'pos',Alonso:'pos','De Zerbi':'pos',Hürzeler:'pos',Kompany:'pos',Fàbregas:'pos',Sarri:'pos',Flick:'pres',Glasner:'kontra',Iraola:'pres',Jaissle:'pres',Rose:'pres',Terzić:'pres',
  Gasperini:'pres',Italiano:'pres',Mourinho:'blok',Simeone:'fizik',Allegri:'blok',Emery:'kontra',Amorim:'kontra',Spalletti:'pos',Chivu:'kontra',Moyes:'blok',Bordalás:'fizik',Aguirre:'fizik',Pellegrini:'pos',
  Gattuso:'fizik',Kovač:'fizik',Buruk:'kontra',Kartal:'kanat',Şahin:'pos',Carrick:'denge',Farke:'pos',Lampard:'kanat','De Rossi':'pos',Jurić:'pres',Matarazzo:'pres',Palladino:'pos',Inzaghi:'kontra',Ancelotti:'denge',Guardiola:'pos',Klopp:'pres',Slot:'pres',Conte:'kontra',Tuchel:'denge'};
function oaiStyleOf(id){const c=CLUBS[id];let co=null;try{co=c?coachOf(id):null;}catch(e){}const nm=co?co.n:(id||'x');
  for(const [k,v] of Object.entries(OAI_REAL))if(nm.includes(k))return v;
  const r=hash(nm+'sty')%100,s=c?c.str:70;
  if(s>=80)return ['pos','pres','pres','denge','kanat','kontra'][r%6];if(s>=74)return ['pres','kontra','denge','kanat','pos','fizik','direkt'][r%7];return ['blok','kontra','direkt','fizik','kanat','denge','blok','kontra'][r%8];}
function oaiAb(id){try{return CLUBS[id]?coachAb(id):45;}catch(e){return 45;}}
function oaiCoachN(id){try{return CLUBS[id]?coachOf(id).n:'Rakip hoca';}catch(e){return 'Rakip hoca';}}

/* ---------- 2) Dünya durumu (sezon boyu) ---------- */
function wdInit(){if(!G||!G.s)return null;if(!G.wd||G.wd.y!==G.s.year)G.wd={y:G.s.year,cl:{},ev:[],r:0,pw:null,hr:{}};return G.wd;}
function wdCl(id){const W=wdInit();return W.cl[id]=W.cl[id]||{pr:20};}
function wdEv(ic,t,id,big){const W=wdInit();W.ev.unshift({d:G.s.day,ic,t,id:id||null,b:big?1:0});if(W.ev.length>60)W.ev.length=60;}
function wdMod(id){const W=G&&G.wd;if(!W||W.y!==(G.s&&G.s.year))return 0;const c=W.cl[id];if(!c)return 0;return (c.bo>0?1.8:0)-(c.pr>=75?1.2:0)+(c.ws?0.8:0);}
function wdLeagues(){const out=[G.s.league];for(const l of ['pl','ll','it1','de1','fr1','sl','pt1','nl1'])if(LEAGUES[l]&&!out.includes(l))out.push(l);return out;}
function wdRes(lid){return lid===G.s.league?(G.s.results||[]):olSync(lid).res;}
function wdForm(R,id,n){const out=[];for(let i=R.length-1;i>=0&&out.length<(n||5);i--){const x=R[i]&&R[i].find(m=>m[0]===id||m[1]===id);if(!x)continue;const [h,a,hg,ag]=x,us=h===id?hg:ag,th=h===id?ag:hg;out.unshift(us>th?'G':us===th?'B':'M');}return out;}
const wdPts=f=>f.reduce((a,x)=>a+(x==='G'?3:x==='B'?1:0),0);
function wdOwnSkip(id){return id===G.club&&!isPl();}
function wdRound(){const W=wdInit();if(!W)return;let news=0;const big=lid=>lid===G.s.league||LEAGUES[lid].tier>=9;W.sk=W.sk||{};
  for(const lid of wdLeagues()){let R,tb;try{R=wdRes(lid);if(R.length<4)continue;tb=lid===G.s.league?table():tableOf(lid,R);}catch(e){continue;}
    const n=tb.length,byStr=leagueClubs(lid).sort((a,b)=>b.str-a.str).map(c=>c.id);let sacked=0;
    tb.forEach((row,i)=>{const id=row.id,c=CLUBS[id];if(!c||wdOwnSkip(id))return;const C=wdCl(id),f=wdForm(R,id,5),pts=wdPts(f),exp=byStr.indexOf(id),diff=i-exp;
      if(C.bo>0)C.bo--;
      let inc=(diff>4?7:diff>2?4:diff>0?1:-3)+(pts<=2?9:pts<=4?4:pts>=12?-7:pts>=9?-3:0)+(i>=n-3?5:0)-(i===0?6:0);try{const co=coachRaw(id),tc=(co.tr||[]).reduce((a,t)=>a+t[1],0);if(inc>0&&tc>=5)inc*=0.55;else if(inc>0&&tc>=2)inc*=0.8;}catch(e){}C.pr=clamp((C.pr||20)+inc,0,100);
      C.pos=i+1;C.f=f.join('');
      const ws=f.length>=5&&f.every(x=>x==='G');if(ws&&!C.ws&&lid===G.s.league){C.ws=1;wdEv('🔥',`${c.name} 5 maçlık galibiyet serisi yakaladı.`,id);}if(!ws)C.ws=0;
      if(C.pr>=68&&!C.vote&&big(lid)&&Math.random()<0.6){C.vote=1;const pn=c.league==='sl'&&typeof presName==='function'?`Başkan ${presName(id)}`:`${c.name} yönetimi`;wdEv('🗣',`${pn}: “Hocamıza güveniyoruz.” Teknik direktör ${oaiCoachN(id)} baskı altında.`,id);
        if(lid===G.s.league&&news<3){news++;msg('gundem',`${c.short}: başkandan güvenoyu`,`${c.name} kötü gidişin ardından teknik direktör ${oaiCoachN(id)} için “güveniyoruz” açıklaması yaptı. Kulis, birkaç kötü sonucun daha hocanın sonu olabileceğini konuşuyor.`);}}
      if(C.pr>=75&&lid===G.s.league&&!C.prot&&Math.random()<0.4){C.prot=1;try{feedAdd({src:`${c.short} Taraftarı`,h:'@'+c.short.toLowerCase().replace(/[^a-z]/g,'')+'_tribun',cat:'fan',mood:-1,txt:`${c.name} taraftarı tesis önünde toplandı: “Yönetim istifa!” Hoca ${oaiCoachN(id)} için tepkiler büyüyor.`});}catch(e){}}
      if(C.pr>=88&&R.length>=7&&!sacked&&C.sk!==G.s.year&&(W.sk[lid]||0)<3&&Math.random()<0.35){sacked=1;W.sk[lid]=(W.sk[lid]||0)+1;wdSack(id,lid,big(lid)&&news<4);news++;}});}
  wdMarket();if(G.mode==='mgr'&&G.m)wdTapUp();}
function wdSack(id,lid,loud){const c=CLUBS[id],C=wdCl(id),old=coachRaw(id),oldN=old.n;let nw;G.coFree=G.coFree||[];const tcOf=x=>(x.tr||[]).reduce((a,t)=>a+t[1],0),cap=c.str>=80?999:c.str>=76?6:c.str>=72?2:0;const fit=G.coFree.filter(x=>tcOf(x)<=cap&&x.n!==oldN);
  if(fit.length&&Math.random()<0.5){const x=pick(fit);G.coFree.splice(G.coFree.indexOf(x),1);nw=Object.assign({},x,{since:G.s.year});}else{const keep=G.coFree;G.coFree=[];try{nw=newCoachFor(id);}catch(e){}finally{G.coFree=keep;}if(!nw)return;}nw.since=G.s.year;G.co=G.co||{};G.co[id]=nw;
  if(old.real){G.coFree=G.coFree||[];G.coFree.push(Object.assign({},old));}
  C.sk=G.s.year;C.bo=4;C.pr=22;C.vote=0;C.prot=0;C.sty=null;
  wdEv('🪓',`${c.name}, teknik direktör ${oldN} ile yolları ayırdı. Yeni hoca: ${nw.n} (${OAI_STY[oaiStyleOf(id)].n}).`,id,1);
  if(loud)msg('gundem',`${c.short}: ${oldN} görevden alındı`,`${c.name}, kötü gidişin ardından teknik direktör ${oldN} ile yollarını ayırdı. Yerine ${nw.n} getirildi. Yeni hocanın ilk maçlarda takımı ateşlemesi bekleniyor.`);
  if(id===G.club&&isPl()){msg('coach','Hocamız gönderildi',`${c.name} yönetimi ${oldN} ile yollarını ayırdı. Yeni hocan ${nw.n}. Forma için kendini yeniden kanıtlaman gerekecek.`);G.p.trust=clamp(G.p.trust-5,25,90);}}
/* transfer dönemi: rakipler güçlenir, krizdekiler satar, küme hattı takviye yapar */
function wdMarket(){if(!twOpen()||G.phase!=='season')return;const W=wdInit(),lid=G.s.league,L=LEAGUES[lid];if(!L||L.youth)return;let tb;try{tb=table();}catch(e){return;}if(!tb.length)return;
  const pool=()=>WORLD.filter(l=>LEAGUES[l]&&!LEAGUES[l].youth&&LEAGUES[l].tier>=Math.max(5,L.tier-1));
  const buy=(buyer,minO,maxO,ageMax,ageMin,why)=>{const bsq=squadOf(buyer.id);if(bsq.length>=30)return false;const lines=['DF','OS','KN','FW'].map(pos=>[pos,bsq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).slice(0,2).reduce((a,p)=>a+p.ovr,0)/2]);const pos=lines.sort((a,b)=>a[1]-b[1])[0][0];
    for(let t=0;t<14;t++){const sl=pick(pool()),sc=pick(leagueClubs(sl));if(!sc||sc.id===buyer.id||sc.id===G.club||derbyOf(buyer.id,sc.id))continue;const ssq=squadOf(sc.id);if(ssq.length<=19)continue;
      const cand=ssq.filter(p=>p.pos===pos&&p.ovr>=minO&&p.ovr<=maxO&&p.age<=ageMax&&p.age>=(ageMin||17));if(!cand.length)continue;const p=pick(cand),fee=Math.round(pValue(p)*rnd(1,1.4)/5e4)*5e4;
      G.tx=G.tx||{};G.tx[p.k]=buyer.id;txNote(p.k,buyer.id,fee);syncStr(buyer.id);syncStr(sc.id);wdEv('✍',`${why}: ${buyer.name}, ${sc.name} forması giyen ${p.name} (${R200(p.ovr)}) ile anlaştı. Bonservis ${eur(fee)}.`,buyer.id,1);
      msg('gundem',`${why}: ${p.name} → ${buyer.short}`,`${buyer.name}, ${sc.name} forması giyen ${p.name} (${p.age}, ${dpTag(p)}, güç ${R200(p.ovr)}) için ${eur(fee)} ödedi.`);return true;}return false;};
  /* zirve rakipleri */
  const top=tb.slice(0,4).map(r=>CLUBS[r.id]).filter(c=>c&&c.id!==G.club);const tk='t'+(G.s.day<=twInfo().sc?'s':'w');
  for(const c of top){const C=wdCl(c.id);if(C[tk]===G.s.year)continue;if(Math.random()<0.16){C[tk]=G.s.year;buy(c,c.str+1,c.str+6,30,0,'Zirve yarışında takviye');break;}}
  /* küme hattı panik transferi */
  const bot=tb.slice(-3).map(r=>CLUBS[r.id]).filter(c=>c&&c.id!==G.club);for(const c of bot){const C=wdCl(c.id);if(C['b'+tk]===G.s.year)continue;if(Math.random()<0.12){C['b'+tk]=G.s.year;buy(c,c.str+1,c.str+5,34,28,'Küme hattında panik');break;}}
  /* mali kriz: yıldız satışı */
  for(const r of tb){const c=CLUBS[r.id];if(!c||c.id===G.club)continue;const C=wdCl(c.id);if(C.fs===G.s.year||C.pr<70||Math.random()>0.1)continue;
    const st=squadOf(c.id).sort((a,b)=>b.ovr-a.ovr)[0];if(!st)continue;const bs=Object.values(CLUBS).filter(x=>x.id!==c.id&&x.id!==G.club&&!LEAGUES[x.league].youth&&x.str>=st.ovr-2&&LEAGUES[x.league].tier>=LEAGUES[c.league].tier&&!derbyOf(x.id,c.id)&&squadOf(x.id).length<30);if(!bs.length)continue;
    const b=pick(bs),fee=Math.round(pValue(st)*rnd(0.7,0.9)/5e4)*5e4;C.fs=G.s.year;G.tx=G.tx||{};G.tx[st.k]=b.id;txNote(st.k,b.id,fee);syncStr(b.id);syncStr(c.id);
    wdEv('💸',`Mali kriz: ${c.name} yıldızını satmak zorunda kaldı. ${st.name}, ${eur(fee)} bedelle ${b.name} yolunda.`,c.id,1);msg('gundem',`Mali kriz: ${c.short} yıldızını sattı`,`Kötü gidiş ve finansal sıkıntı içindeki ${c.name}, ${st.name} transferinde ${b.name} ile ${eur(fee)} bedelle anlaştı. Taraftar tepkili.`);break;}}
/* menajer modu: büyük kulüpler yıldızımızın aklını çeliyor */
function wdTapUp(){const m=G.m;if(m.tap&&m.tap.y===G.s.year)return;if(Math.random()>0.07)return;const me=myClub(),sq=squadOf(G.club).filter(p=>!(m.loans&&m.loans[p.k])).sort((a,b)=>b.ovr-a.ovr).slice(0,3);if(!sq.length)return;const p=pick(sq);
  const cs=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&c.str>=me.str+3&&LEAGUES[c.league].tier>=curLeague().tier);if(!cs.length)return;const c=pick(cs);
  m.tap={k:p.k,c:c.id,y:G.s.year,d:G.s.day};relAdd(p,-6);
  msg('squad',`${c.short} yıldızımızın peşinde: ${p.name}`,`Kulis: ${c.name} yöneticileri ${p.name} ve menajeriyle gizlice görüştü. Oyuncunun aklı karışık; transfer döneminde resmi teklif gelmesi bekleniyor. Birebir görüşmeyle onu ikna etmeyi deneyebilirsin.`);
  wdEv('🕵',`${c.name}, ${myClub().name} oyuncusu ${p.name} ile temas kurdu.`,c.id);try{feedAdd({src:'Transfer Kulisi',h:'@transferkulisi',cat:'tr',rum:1,txt:`ÖZEL: ${c.name}, ${p.name} için harekete geçti. Oyuncu tarafı teklife sıcak bakıyor.`});}catch(e){}}

/* ---------- 3) Maç öncesi rakip plan ---------- */
function oaiPlan(oppId,usHome){const opp=CLUBS[oppId],me=myClub(),why=[];if(!opp||!me)return null;
  let sty=oaiStyleOf(oppId);const S0=OAI_STY[sty],ab=oaiAb(oppId),smart=ab>=40||hash(oppId+G.s.day)%100<ab,ti=Object.assign({},S0.ti);let tac=S0.tac,boost=0,mark=null,side=null,agg=1;
  const d=opp.str-me.str+(usHome?-1.5:1.5),D=derbyOf(G.club,oppId),m=G.mode==='mgr'&&G.m?fmInit():null;
  if(d<=-6&&sty!=='blok'&&sty!=='kontra'){tac='savunma';ti.hat='derin';ti.pres='dus';ti.kazan='kontra';why.push('Güçlü rakibe karşı derin blok ve kontra');}
  else if(d>=5&&sty!=='blok'){ti.pres='yuk';ti.hat='yuksek';why.push('Üstünlüğünü önde baskıyla göstermek isteyecek');}
  if(D){if(D.lv>=3||sty==='fizik')ti.mud='sert';ti.yog='cok';ti.tempo='yuk';if(tac!=='savunma')tac=D.lv>=2?'pres':tac;agg=1+0.02*D.lv;boost+=0.3*D.lv;why.push(`${D.n}: sert ikili mücadeleler, yüksek tempo`);}
  if(m&&smart){const t=m.fm.ti||{};
    if(t.hat==='yuksek'){ti.arka='evet';ti.pas='direkt';why.push('Yüksek savunma çizgimizin arkasına top atacak');}
    if(t.pres==='yuk'||m.tac==='pres'){ti.kaleci='uzun';if(ti.pas!=='kisa')ti.pas='direkt';why.push('Presimizi uzun toplarla aşmaya çalışacak');}
    if(m.tac==='hucum'){ti.kazan='kontra';ti.set='hizli';why.push('Hücumcu oyunumuza karşı kontra atak kollayacak');}
    if(m.tac==='savunma'&&ti.pas!=='direkt'){ti.gen='gen';ti.orta='bol';why.push('Kapanan savunmamızı kanatlardan ortalarla açmaya çalışacak');}
    try{const xi=mgrXI().map(k=>pByKey(k)).filter(Boolean);const atk=xi.filter(p=>['FW','KN','OS'].includes(p.pos)).sort((a,b)=>b.ovr-a.ovr)[0];
      if(atk&&atk.ovr>=opp.str+2&&ab>=50){mark=atk.k;why.push(`${atk.name} için özel adam adama markaj`);}
      const S=FMF[m.fm.f],L=[],Rr=[];xi.forEach((p,i)=>{const s=S&&S[mgrXI().indexOf(p.k)];if(!s||p.pos!=='DF')return;(s[1]<0.35?L:s[1]>0.65?Rr:[]).push(p);});
      const av=a=>a.length?a.reduce((x,p)=>x+p.ovr,0)/a.length:99;const la=av(L),ra=av(Rr);if(Math.abs(la-ra)>=3&&ab>=45){const wk=la<ra?L[0]:Rr[0];side=la<ra?'sag':'sol';ti.yon=side;why.push(`${la<ra?'Sol':'Sağ'} bekimiz ${wk.name} tarafına yüklenecek`);}}catch(e){}}
  try{const tb=table(),n=tb.length,i=tb.findIndex(r=>r.id===oppId),wk=(G.s.results||[]).length,half=(G.s.fixtures||[]).length/2;
    if(opp.league===G.s.league&&wk>=half&&i>=n-3){boost+=1;ti.mud=ti.mud||'sert';why.push('Küme düşme hattında: canını dişine takacak');}
    else if(opp.league===G.s.league&&wk>=half&&i===0){boost+=0.5;why.push('Liderliği korumak için hata yapmayacak');}}catch(e){}
  const mo=wdMod(oppId),C=G.wd&&G.wd.cl&&G.wd.cl[oppId];if(C&&C.bo>0){boost+=1.5;why.push('Yeni hoca etkisi: oyuncular kendini göstermek istiyor');}else if(C&&C.pr>=75){boost-=1;why.push('Kriz ortamı: takım gergin ve özgüvensiz');}
  const pw=G.wd&&G.wd.pw;if(pw&&pw.opp===oppId&&pw.md===G.s.day&&pw.resp==='sert'){boost+=0.5;agg*=1.08;why.push('Basındaki atışma rakibi de ateşledi');}
  if(!why.length)why.push(S0.d);
  return {sty,n:S0.n,ic:S0.ic,tac,ti,boost,mark,side,agg,ab,why,co:oaiCoachN(oppId),derby:D};}
function oaiApply(){const S=FX,O=S.O,P=S.oai&&S.oai.plan;O.tac=fxTac(O.ti,O.tacK);if(P&&P.agg)O.tac.agg*=P.agg;if(S.oai&&S.oai.agg)O.tac.agg*=S.oai.agg;try{fxLam();}catch(e){}}
function oaiDo(txt,ti,tac,opt){const S=FX,O=S.O,A=S.oai,mn=fxMin();if(ti)Object.assign(O.ti,ti);if(tac)O.tacK=tac;oaiApply();A.last=mn;A.n++;A.log.unshift({m:mn,t:txt});if(A.log.length>14)A.log.length=14;fxEv(mn,`🧠 ${A.co}: ${txt}`,'tac');if(opt&&opt.say)try{fxSay(`${O.short} ${opt.say}`);}catch(e){}}
function oaiMark(p,mn){if(!p||p.marked2)return;p.marked2=1;for(const k of ['sh','pa','dr'])if(p.a[k]!=null)p.a[k]=p.a[k]*0.95;if(p.fa)for(const n of ['Bitiricilik','Pas','Dripling','Karar Alma','Vizyon','Uzaktan Şut'])if(p.fa[n]!=null)p.fa[n]=Math.max(1,p.fa[n]-1.5);}
function oaiSub(kind){const S=FX,O=S.O;if(O.subs>=5||!O.bench.length)return null;const on=fxOn(O).filter(p=>p.spos!=='KL');let out,inP;
  if(kind==='atk'){out=on.filter(p=>p.pos==='DF'||p.pos==='OS').sort((a,b)=>fxR(a)-fxR(b)||a.st-b.st)[0];inP=O.bench.filter(b=>b.pos==='FW'||b.pos==='KN').sort((a,b)=>b.ovr-a.ovr)[0];}
  else if(kind==='def'){out=on.filter(p=>p.pos==='FW'||p.pos==='KN').sort((a,b)=>a.st-b.st)[0];inP=O.bench.filter(b=>b.pos==='DF'||b.pos==='OS').sort((a,b)=>b.ovr-a.ovr)[0];}
  else{out=on.filter(p=>p.st<62||(p.yel&&fxMin()>=55)).sort((a,b)=>a.st-b.st)[0];inP=out&&(O.bench.find(b=>b.pos===out.pos)||O.bench[0]);}
  if(out&&inP&&fxSub(O,out,inP))return [out,inP];return null;}
/* ---------- 4) Maç içi rakip hoca beyni ---------- */
function oaiBrain(){const S=FX,O=S.O,U=S.U,A=S.oai;if(!A)return false;const mn=fxMin(),d=S.score[1]-S.score[0],F=A.f,ab=A.ab,cd=ab>=70?5:ab>=45?7:10;
  const redU=U.P.filter(p=>p.off&&!p.subbed).length,redO=O.P.filter(p=>p.off&&!p.subbed).length;
  /* değişiklikler: yorgunluk ve kart riski her zaman */
  if(mn>=58&&O.subs<5&&mn-(A.lsub||0)>=4&&Math.random()<0.5){const r=oaiSub('tired');if(r)A.lsub=mn;}
  if(mn-A.last<cd&&!(redU>(F.redU||0)||redO>(F.redO||0)))return true;
  if(redU>(F.redU||0)){F.redU=redU;oaiDo('Sayısal üstünlüğü kullanmak için baskıyı artırdı, oyunu geniş oynuyor.',{pres:'yuk',gen:'gen',tempo:'yuk'},d<=0?'hucum':null);return true;}
  if(redO>(F.redO||0)){F.redO=redO;const r=oaiSub('def');oaiDo(`${11-redO} kişi kaldı; bloğunu geriye çekti${r?`, ${r[0].sur} çıktı, ${ksur(r[1].name)} girdi`:''}.`,{hat:'derin',pres:'dus',gen:'dar'},d>=0?'savunma':null);return true;}
  if(S.half===2&&mn<=52&&d<0&&!F.ht){F.ht=1;const r1=oaiSub('atk'),r2=Math.random()<0.6?oaiSub('tired'):null;for(const p of fxOn(O))for(const k of ['sh','pa','dr','df'])if(p.a[k]!=null)p.a[k]*=1.015;
    oaiDo(`Devre arasında soyunma odasında sert konuştu${r1?`; ${ksur(r1[1].name)} oyuna girdi`:''}${r2?`, ${ksur(r2[1].name)} da sahada`:''}.`,{tempo:'yuk'},null,{say:'ikinci yarıya çok istekli başladı.'});return true;}
  if(mn>=80&&d<0&&!F.all){F.all=1;const r=oaiSub('atk');oaiDo(`Son dakikalarda her şeyi ortaya koydu: savunmadan eksilip hücuma oyuncu ekledi${r?` (${ksur(r[1].name)})`:''}.`,{hat:'yuksek',yog:'cok',orta:'bol',arka:'evet'},'hucum',{say:'kalecisi hariç herkesi hücuma gönderdi!'});return true;}
  if(mn>=55&&d<0&&!F.atk){F.atk=1;const r=oaiSub('atk');oaiDo(`Hücuma ağırlık verdi${r?`: ${r[0].sur} çıktı, forvet ${ksur(r[1].name)} girdi`:''}.`,{tempo:'yuk',orta:'bol',pres:'yuk'},'hucum');return true;}
  if(ab<35&&mn>=65&&d>0&&!F.greed&&Math.random()<0.3){F.greed=1;oaiDo('Skor avantajına rağmen riskli şekilde hücuma devam ediyor; arkada boşluklar oluşabilir.',{hat:'yuksek',tempo:'yuk'},'hucum');return true;}
  if(mn>=70&&d>0&&!F.prot){F.prot=1;const r=oaiSub('def');oaiDo(`Skoru korumaya geçti${r?`: ${r[0].sur} yerine savunmacı ${ksur(r[1].name)}`:''}. Oyunu yavaşlatıyor.`,{hat:'derin',pres:'dus',tempo:'dus',kazan:'tut'},'savunma');return true;}
  if(mn>=84&&d>0&&!F.tw){F.tw=1;if(S.t<S.end-60)S.end+=60;oaiDo('Zaman geçirmeye başladı: her duran topta ağırdan alıyor. Hakem uzatmaya ekleme yapacak.',{tempo:'dus',kazan:'tut'});return true;}
  if(mn>=25&&!F.mk&&ab>=45){const st=fxOn(U).filter(p=>p.spos!=='KL'&&!p.marked2).sort((a,b)=>fxR(b)-fxR(a))[0];if(st&&fxR(st)>=7.4){F.mk=1;oaiMark(st,mn);A.mk=st.k;oaiDo(`Maçın en etkilisi ${st.sur} için adam adama markaj uygulamaya başladı; artık rahat top alamayacak.`);return true;}}
  const su=S.stats[0],so=S.stats[1],tp=Math.max(1,su.pos+so.pos);
  if(mn>=30&&su.xg-so.xg>=0.8&&d>=0&&O.tacK!=='savunma'&&!F.deep){F.deep=1;oaiDo('Çok pozisyon verdiğini görüp bloğunu geriye çekti, ceza sahası önünü kapatıyor.',{hat:'derin',pres:'orta',gen:'dar'});return true;}
  if(mn>=20&&su.pos/tp>0.62&&!F.prs&&O.tacK!=='savunma'){F.prs=1;oaiDo('Topu bizden almak için önde baskıyı sertleştirdi.',{pres:'yuk',kayip:'karsi',yog:'cok'});return true;}
  if(mn>=15&&U.ti.hat==='yuksek'&&!F.beh&&ab>=40){F.beh=1;oaiDo('Yüksek savunma çizgimizi fark etti: savunma arkasına toplar atıyor.',{arka:'evet',pas:'direkt',set:'hizli'});return true;}
  if(mn>=15&&U.ti.pres==='yuk'&&so.pa>15&&so.pc/so.pa<0.72&&!F.lng){F.lng=1;oaiDo('Presimiz karşısında kısa pası bıraktı, uzun toplarla çıkıyor.',{pas:'direkt',kaleci:'uzun'});return true;}
  const avg=fxOn(U).reduce((a,p)=>a+p.st,0)/Math.max(1,fxOn(U).length);if(mn>=65&&avg<60&&!F.tir){F.tir=1;oaiDo('Takımımızın yorulduğunu gördü: tempoyu ve baskıyı artırdı.',{tempo:'yuk',pres:'yuk'});return true;}
  if(S.derby&&mn>=60&&d<=0&&!F.drb){F.drb=1;A.agg=(A.agg||1)*1.06;oaiDo('Derbide ipler gerildi: ikili mücadelelerde çok daha sert.',{mud:'sert',yog:'cok'},null,{say:'oyuncuları her topa sert giriyor!'});return true;}
  if(U.tacK==='hucum'&&mn>=40&&!F.cnt&&O.ti.kazan!=='kontra'){F.cnt=1;oaiDo('Hücuma kalkmamızdan yararlanmak için kontra ataklara ağırlık verdi.',{kazan:'kontra',set:'hizli',arka:'evet'});return true;}
  return true;}
fxCoachAI=(old=>function(){try{if(FX&&FX.oai)return oaiBrain();}catch(e){console.warn(e);}return old.apply(this,arguments);})(fxCoachAI);
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{const S=FX;if(!S||!o||!o.opp||!CLUBS[o.opp.id]||!G.s)return r;const P=oaiPlan(o.opp.id,!!o.usHome);if(!P)return r;const O=S.O;
    O.ti=Object.assign({},O.ti,P.ti);O.tacK=P.tac;S.oai={plan:P,co:P.co,ab:P.ab,log:[],n:0,last:0,f:{},agg:1};
    if(P.boost)for(const p of O.P)for(const k of ['sh','pa','dr','df','ph'])if(p.a[k]!=null)p.a[k]=clamp(p.a[k]*(1+P.boost*0.012),10,99);
    if(P.mark){const p=S.U.P.find(x=>x.k===P.mark);if(p){oaiMark(p,0);S.oai.mk=p.k;}}
    const pw=G.wd&&G.wd.pw;if(pw&&pw.opp===o.opp.id&&pw.md===G.s.day&&pw.resp==='sert')for(const p of S.U.P)for(const k of ['sh','pa','dr','df'])if(p.a[k]!=null)p.a[k]=clamp(p.a[k]*1.02,10,99);
    oaiApply();fxEv(0,`🧠 ${P.co} (${P.n}): ${P.why.slice(0,3).join(' · ')}.`,'tac');}catch(e){console.warn(e);}return r;})(fxStart);
/* hızlı simülasyon da rakibin planını hisseder */
tacT=(old=>function(opp){const T=old.apply(this,arguments);try{if(!opp||!CLUBS[opp.id]||!G.s||G.mode!=='mgr')return T;const P=oaiPlan(opp.id,true);if(!P)return T;let f=1,a=1;
    if(P.sty==='blok'||P.tac==='savunma'){f*=0.93;a*=0.92;}if(P.sty==='pres'){f*=1.03;a*=1.04;}if(P.derby){f*=0.95;a*=0.95;}if(P.mark)f*=0.96;if(P.side)a*=1.03;if(P.why.some(w=>w.includes('arkasına')))a*=1.04;a*=1+P.boost*0.02;
    return Object.assign({},T,{f:T.f*f,a:T.a*a});}catch(e){return T;}})(tacT);
/* diğer maçlar: yeni hoca etkisi, kriz, seri */
simScore=(old=>function(h,a){const bh=wdMod(h),ba=wdMod(a);if(!bh&&!ba)return old.apply(this,arguments);const H=CLUBS[h],A=CLUBS[a],sh=H.str,sa=A.str;H.str=sh+bh;A.str=sa+ba;try{return old.apply(this,arguments);}finally{H.str=sh;A.str=sa;}})(simScore);
/* futbolcu modu: rakip hoca Cenk'e özel önlem alır */
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(!isPl()||national||!opp||!CLUBS[opp.id])return cfg;const p=G.p,fa=(p.form||[]),fav=fa.length?fa.reduce((a,b)=>a+b,0)/fa.length:6.5,thr=fav>=7.2||(G.s.stats&&G.s.stats.goals>=8)||p.fame>=60;
    const ab=oaiAb(opp.id);if(thr&&ab>=45&&Math.random()<0.3){const atk=cfg.chances.filter(c=>!['savunma','dkorner'].includes(c.type));if(atk.length>=3){cfg.chances.splice(cfg.chances.indexOf(atk[atk.length-1]),1);}cfg.mk=1;
      msg('coach',`${opp.short} hocası: “Cenk’e özel önlem aldık”`,`${oaiCoachN(opp.id)} maç öncesi Cenk Kuşku için adam adama markaj uygulayacaklarını açıkladı. Bugün pozisyon bulmak daha zor olacak; boş alana sarkan koşular önemli.`);}
    const P=(()=>{try{return oaiPlan(opp.id,usHome);}catch(e){return null;}})();if(P&&(P.sty==='blok'||P.tac==='savunma')){cfg.lamUs*=0.92;cfg.lamOpp*=0.9;}if(P&&P.sty==='pres'){cfg.lamUs*=1.04;cfg.lamOpp*=1.04;}cfg.lamOpp*=1+wdMod(opp.id)*0.025;}catch(e){console.warn(e);}return cfg;})(buildMatch);

/* ---------- 5) Basında söz düellosu ---------- */
const PW_Q=['Cumartesi sahada kimin büyük olduğunu herkes görecek.','Onların baskısından korkmuyoruz, deplasman bizim için sorun değil.','Şampiyonluk yarışını bu maç belirleyecek; biz hazırız.','Rakibin kadrosu pahalı ama futbol kâğıt üstünde oynanmıyor.','Taraftarımıza söz veriyoruz: bu maçı kazanacağız.','Hakemlerin bu maçta adil olmasını bekliyoruz, geçen sefer olanları unutmadık.'];
const PW_QC=['Cenk Kuşku iyi oyuncu ama bizim savunmamız onu durdurur.','Cenk’i abartıyorlar; bizim maçta sesi çıkmayacak.'];
function wdPress(){const W=wdInit(),f=ourFixture();if(!f||G.phase!=='season'||isStaff()||isRef())return;const md=nextMatchDay(G.s.day);if(md==null||md-G.s.day!==2)return;if(W.pw&&W.pw.md===md)return;
  const opp=f[0]===G.club?f[1]:f[0],c=CLUBS[opp];if(!c)return;const D=derbyOf(G.club,opp);let top=false;try{const tb=table();const i=tb.findIndex(r=>r.id===opp),j=tb.findIndex(r=>r.id===G.club);top=(G.s.results||[]).length>=5&&i<4&&j<4;}catch(e){}
  if(!(D&&D.lv>=2&&Math.random()<0.75)&&!(top&&Math.random()<0.5))return;
  const said=isPl()&&G.p.fame>=45&&Math.random()<0.5?pick(PW_QC):pick(PW_Q);W.pw={md,opp,co:oaiCoachN(opp),said,resp:null,d:G.s.day};
  msg('press',`${c.short} hocası ${W.pw.co}: “${said}”`,`${D?D.n+' öncesi':'Zirve maçı öncesi'} ${c.name} teknik direktörü ${W.pw.co} basına konuştu. Ana sayfadan cevap verebilirsin.`);
  try{feedAdd({src:'Spor Gündemi',h:'@sporgundemi',cat:'gen',txt:`${c.short} hocası ${W.pw.co}: “${said}”`});}catch(e){}wdEv('🎙',`${c.name} hocası ${W.pw.co}: “${said}”`,opp);}
function pwBand(){const W=G&&G.wd;if(!W||!W.pw||W.pw.resp||W.pw.md<G.s.day||G.phase!=='season')return '';const c=CLUBS[W.pw.opp];if(!c)return '';
  return `<section class="panel pw-band">${crestSVG(c,34)}<div><small>${esc(c.name)} · ${esc(W.pw.co)}</small><b>“${esc(W.pw.said)}”</b><div class="offer-btns"><button class="cta sm" data-act="pwR" data-k="sert">🔥 Sert cevap ver</button><button class="btn sm" data-act="pwR" data-k="sakin">🤝 Sakin ve saygılı</button><button class="btn sm ghost" data-act="pwR" data-k="yok">Yorum yapma</button></div></div></section>`;}
ACTX.pwR=el=>{const W=G.wd;if(!W||!W.pw)return;const k=el.dataset.k,c=CLUBS[W.pw.opp];W.pw.resp=k;const me=isPl()?'Cenk Kuşku':(G.mode==='mgr'?coachOf(G.club).n:'Biz');
  const T={sert:pick(['Sahada konuşuruz. Maçtan sonra kimin ne dediğini hatırlatırız.','Bu sözler soyunma odamıza asılacak; oyuncularım cevabı sahada verecek.','Bizi tanımıyorlar galiba. Pazartesi konuşalım.']),sakin:pick(['Rakibimize saygı duyuyoruz, biz sadece kendi işimize bakıyoruz.','Güzel bir futbol maçı olsun, en iyi takım kazansın.']),yok:''}[k];
  if(G.mode==='mgr'&&G.m){const m=trInit();if(k==='sert'){m.fans=clamp(m.fans+3,0,100);m.media=clamp((m.media||50)-2,0,100);}else if(k==='sakin'){m.media=clamp((m.media||50)+3,0,100);m.conf=clamp((m.conf||50)+1,0,100);}}
  if(isPl()){if(k==='sert'){G.p.morale=clamp(G.p.morale+5,0,100);G.p.fame=clamp(G.p.fame+1,0,100);}else if(k==='sakin')G.p.trust=clamp(G.p.trust+2,0,100);}
  if(T){msg('press',`${me}: “${T}”`,`${c.name} cephesinin sözlerine ${k==='sert'?'sert':'sakin'} bir cevap verildi.${k==='sert'?' Taraftar coştu; rakip de bu maça daha da hırslı çıkacak.':' Medya bu olgun tavrı övdü.'}`);try{feedAdd({src:'Spor Gündemi',h:'@sporgundemi',cat:'gen',txt:`${me}: “${T}”`});}catch(e){}}
  toast(k==='yok'?'Yorum yapılmadı':'Cevabın basında');save();render();};
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const b=pwBand();if(b)return b+h;}catch(e){}return h;})(viewHub);
mgrFinish=(old=>function(gu,go,f,sc){const W=G.wd,pw=W&&W.pw,mine=pw&&pw.resp==='sert'&&f&&(f[0]===pw.opp||f[1]===pw.opp)&&pw.md===G.s.day;const r=old.apply(this,arguments);
  try{if(mine&&G.m){const m=trInit();if(gu>go){m.fans=clamp(m.fans+3,0,100);msg('press','Sözünü sahada tuttun',`Maç öncesi atışmanın ardından gelen galibiyet taraftarı mest etti.`);}else if(gu<go){m.fans=clamp(m.fans-3,0,100);m.media=clamp((m.media||50)-3,0,100);msg('press','Sert sözler geri döndü',`Maç öncesi iddialı konuşmanın ardından gelen yenilgi medyada eleştiriliyor.`);}pw.done=1;}}catch(e){}return r;})(mgrFinish);
/* her gün dünya akışı */
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'&&G.s.cal){const W=wdInit(),n=(G.s.results||[]).length;if(n>0&&W.r!==n){W.r=n;wdRound();}wdPress();}}catch(e){console.warn(e);}return out;})(nextDay);

/* ---------- 6) Transfer rekabeti ve ezeli rakip kuralları ---------- */
const DRB_MULT=lv=>lv>=3?1.6:lv===2?1.4:1.2;
askPrice=(old=>function(p,from){const A=old.apply(this,arguments);try{if(G&&G.club&&from!==G.club&&(G.mode==='mgr'||isRole&&isRole())){const D=derbyOf(G.club,from);if(D&&A&&A.a){A.a=Math.round(A.a*DRB_MULT(D.lv)/5e4)*5e4;A.drb=D.lv;}}}catch(e){}return A;})(askPrice);
function rvPick(p,from){const me=myClub(),T=curLeague().tier;const L=Object.values(CLUBS).filter(c=>c.id!==G.club&&c.id!==from&&!LEAGUES[c.league].youth&&c.str>=Math.max(p.ovr-4,me.str-6)&&LEAGUES[c.league].tier>=T-1&&squadOf(c.id).length<30&&!derbyOf(c.id,from));
  if(!L.length)return null;return wpick(L.map(c=>[c,(derbyOf(G.club,c.id)?4:1)*(c.league===me.league?2:1)*(c.str>=me.str?1.5:1)]));}
negStart=(old=>function(from,k,type){try{const D=derbyOf(G.club,from),p=squadOf(from).find(x=>x.k===k);
    if(D&&p&&type!=='renew'){const m=fmInit();m.negCd=m.negCd||{};if(!(m.negCd[k]&&m.negCd[k]>G.s.day)&&trWin()){
      const refuse=type==='loan'?D.lv>=2:srng(k+'|'+from+'|rf'+G.s.year)()<(D.lv>=3?0.35:D.lv===2?0.2:0.06);
      if(refuse){m.negCd[k]=G.s.day+60;return negMsgOnly(p,from,`${CLUBS[from].name}: “${type==='loan'?'Ezeli rakibimize oyuncu kiralamayız.':`${p.name} için ${myClub().name} ile masaya oturmayız. Taraftarımız bunu asla affetmez; konu kapanmıştır.`}”`);}}}}catch(e){console.warn(e);}
  const n0=G.m&&G.m.neg;const r=old.apply(this,arguments);try{const n=G.m&&G.m.neg;if(!n||n===n0||n.k!==k)return r;const p=negP(),D=derbyOf(G.club,from);
    if(D&&n.st==='club'){n.drb=D.lv;n.pat=Math.max(1,n.pat-1);n.log.push(['club',`“Açık konuşalım: ezeli rakibimize oyuncu satmak bizim için çok zor. ${D.lv>=3?'Taraftarımız ayağa kalkar. ':''}Ancak çok yüksek bir teklifi değerlendiririz.”`]);n.I=Math.max(0,n.I-6*D.lv);}
    if(p&&(type==='tr'||type==='free')&&!n.rv){const me=myClub(),ch=clamp(0.14+(p.ovr-me.str)*0.025+(p.age<=23?0.1:0)+(pValue(p)>=3e7?0.1:0),0.08,0.6);
      if(Math.random()<ch){const rc=rvPick(p,from);if(rc){const A=n.A||pValue(p);n.rv={id:rc.id,fee:Math.round(A*rnd(1,1.15)/5e4)*5e4,w:Math.round(pWage(p,rc.id)*rnd(1.1,1.3)/100)*100,at:type==='free'?0:1+(hash(k+'rv')%2),on:0,dl:0};}}}
    if(n.rv&&!n.rv.on&&n.st==='player'&&n.d){rvReveal(n,p,'player');n.d.w=Math.max(n.d.w,n.rv.w);}
    save();negOpen();}catch(e){console.warn(e);}return r;})(negStart);
function rvReveal(n,p,where){const rv=n.rv,rc=CLUBS[rv.id];rv.on=1;n.offN=n.offN||0;rv.dl=n.offN+2+(hash(n.k+'dl')%2);const D=derbyOf(G.club,rv.id);
  if(where==='club'){n.A=Math.max(n.A,Math.round(rv.fee*1.02/5e4)*5e4);n.log.push(['club',`“Bu arada ${rc.name} de ${p.name} için resmi teklif yaptı: ${eur(rv.fee)}. En iyi teklifi kim verirse oyuncu onundur.”`]);}
  else n.log.push(['ag',`Menajer: “${rc.name} de masada; haftalık ${eur(rv.w)} öneriyorlar.${D?' Ezeli rakibiniz olduklarını biliyorsunuz, müvekkilim iki tarafı da dinliyor.':''}”`]);
  wdInit();wdEv('⚔',`${rc.name}, ${p.name} transferinde ${myClub().name} ile yarışa girdi.`,rv.id);
  msg('offer',`Transfer yarışı: ${p.name}`,`${rc.name}, görüştüğün ${p.name} için devreye girdi. ${where==='club'?`Kulübe ${eur(rv.fee)} teklif ettiler.`:`Oyuncuya haftalık ${eur(rv.w)} öneriyorlar.`} Hızlı ve ikna edici olmazsan oyuncuyu kaptırabilirsin.`);}
function rvHijack(n,p,why){const rv=n.rv,rc=CLUBS[rv.id];if(!rc||!p)return;n.st='fail';G.m.negCd=G.m.negCd||{};G.m.negCd[n.k]=G.s.day+90;rv.won=1;
  G.tx=G.tx||{};G.tx[p.k]=rc.id;txNote(p.k,rc.id,rv.fee);syncStr(rc.id);syncStr(n.from);
  n.log.push([why==='club'?'club':'ag',why==='club'?`“Üzgünüz, ${rc.name} teklifini kabul ettik. ${p.name} onlarla anlaştı.”`:`Menajer: “${rc.name} ile imzaladık. Teklifiniz geç ve yetersiz kaldı.”`]);
  const D=derbyOf(G.club,rc.id);msg('gundem',`Transfer kaçtı: ${p.name} ${rc.short} ile anlaştı`,`${p.name}, ${myClub().name} ile görüşmeler sürerken ${rc.name} ile anlaştı. Bonservis ${eur(rv.fee)}.${D?` Ezeli rakibe kaptırılan transfer taraftarı kızdırdı.`:''}`);
  if(D&&G.m){const m=trInit();m.fans=clamp(m.fans-2*D.lv,0,100);}wdEv('🏃',`${rc.name}, ${myClub().name} ile görüşen ${p.name} transferini son anda bitirdi.`,rc.id,1);}
function rvLost(n,p){const rc=CLUBS[n.rv.id],c=CLUBS[n.from];openModal(`<div class="ng"><p class="sub-h"><span>Transfer görüşmesi</span><span>${esc(p.name)}</span></p><div class="rv-band lost">${crestSVG(rc,28)}<div><b>${esc(rc.name)} oyuncuyu kaptı</b><small>Bonservis ${eur(n.rv.fee)} · ${esc(p.name)} artık ${esc(rc.short)} oyuncusu</small></div></div>
  <div class="ng-log">${n.log.slice(-4).map(([w,t])=>`<p class="ng-${w}"><i>${w==='me'?'Sen':w==='club'?`${esc(c.name)} · sportif direktör`:'Menajer'}</i>${esc(t)}</p>`).join('')}</div><p class="muted">Rakip kulüpler de transfer yapıyor: iyi bir oyuncuda ağırdan alırsan kaptırabilirsin.</p><button class="btn" data-act="closeModal" style="width:100%">Kapat</button></div>`);}
negClub=(old=>function(){const n=G.m&&G.m.neg,p=negP();if(!n||!p)return old.apply(this,arguments);const L0=n.log.length;
  n.offN=(n.offN||0)+1;const rv=n.rv;if(rv&&!rv.on&&!rv.won&&n.st==='club'&&n.offN>=rv.at)rvReveal(n,p,'club');
  else if(rv&&rv.on&&n.st==='club'&&Math.random()<0.4){rv.fee=Math.round(rv.fee*rnd(1.04,1.09)/5e4)*5e4;n.A=Math.max(n.A,Math.round(rv.fee*1.02/5e4)*5e4);n.log.push(['club',`“${CLUBS[rv.id].name} teklifini yükseltti: ${eur(rv.fee)}.”`]);}
  const r=old.apply(this,arguments);if(!n.log.slice(L0).some(x=>x[0]==='me'))n.offN--;
  try{if(rv&&rv.on&&!rv.won){if(n.st==='fail')rvHijack(n,p,'club');else if(n.st==='club'&&n.offN>=rv.dl){rvHijack(n,p,'club');}if(rv.won){save();rvLost(n,p);}}}catch(e){console.warn(e);}return r;})(negClub);
negPlayerInit=(old=>function(){const r=old.apply(this,arguments);try{const n=G.m.neg,p=negP();if(!n||!p||n.st!=='player'||!n.d)return r;const D=derbyOf(G.club,n.from);
    if(D&&n.type!=='loan'){const ps=persOf(p);if(ps==='Sadık'&&D.lv>=2){n.st='fail';n.log.push(['ag',`Menajer: “${p.name} kulübüne çok bağlı. Ezeli rakibe geçmeyi kesinlikle reddediyor.”`]);G.m.negCd=G.m.negCd||{};G.m.negCd[n.k]=G.s.day+120;return r;}
      n.d.w=Math.round(n.d.w*(1+0.1*D.lv)/100)*100;n.log.push(['ag',`Menajer: “Ezeli rakibe geçmek büyük bedel demek; ${p.name} eski taraftarlarının tepkisini göze alacak. Bunun karşılığını maaşta görmek istiyoruz.”`]);}
    const rv=n.rv;if(rv&&!rv.won){if(!rv.on)rvReveal(n,p,'player');n.d.w=Math.max(n.d.w,rv.w);if(CLUBS[rv.id].str>myClub().str)n.I=Math.max(0,n.I-8);n.ppat=Math.max(2,n.ppat-1);}}catch(e){console.warn(e);}return r;})(negPlayerInit);
negPlayer=(old=>function(){const n=G.m&&G.m.neg,p=negP();const r=old.apply(this,arguments);try{if(!n||!p||!n.rv||!n.rv.on||n.rv.won)return r;
    if(n.st==='fail'){rvHijack(n,p,'player');save();rvLost(n,p);}else if(n.st==='player'&&n.ppat<=2&&Math.random()<0.35){rvHijack(n,p,'player');save();rvLost(n,p);}}catch(e){console.warn(e);}return r;})(negPlayer);
negOpen=(old=>function(){const r=old.apply(this,arguments);try{const n=G.m&&G.m.neg;if(!n)return r;const mc=$('#modalCard'),lg=mc&&mc.querySelector('.ng-log');if(!lg)return r;let h='';
    if(n.drb&&(n.st==='club'||n.st==='player'))h+=`<div class="rv-band drb">🔥 <b>${derbyLvN(n.drb)}</b><span>Ezeli rakipten transfer: fiyat yüksek, kulübün sabrı az, oyuncu ek maaş istiyor.</span></div>`;
    if(n.rv&&n.rv.on&&!n.rv.won&&(n.st==='club'||n.st==='player')){const rc=CLUBS[n.rv.id],left=Math.max(0,(n.rv.dl||0)-(n.offN||0));h+=`<div class="rv-band">${crestSVG(rc,24)}<div><b>Rakip teklif: ${esc(rc.name)}</b><small>${n.st==='club'?`Bonservis ${eur(n.rv.fee)}${left?` · ${left} teklif hakkın kaldı`:' · son şansın'}`:`Oyuncuya haftalık ${eur(n.rv.w)}`}</small></div></div>`;}
    if(n.rv&&n.rv.won)h+=`<div class="rv-band lost">${crestSVG(CLUBS[n.rv.id],24)}<div><b>${esc(CLUBS[n.rv.id].name)} oyuncuyu kaptı</b></div></div>`;
    if(h)lg.insertAdjacentHTML('beforebegin',h);}catch(e){}return r;})(negOpen);
/* gelen teklifler: artırma savaşı ve göz kırpan kulüp */
bidsWeek=(old=>function(){const m=fmInit(),n0=(m.bids||[]).length;const r=old.apply(this,arguments);try{if(!inWindow())return r;m.bids=m.bids||[];const me=myClub();
    if(m.tap&&m.tap.y===G.s.year&&!m.bids.some(b=>b.k===m.tap.k)&&squadOf(G.club).some(p=>p.k===m.tap.k)&&CLUBS[m.tap.c]){const p=pByKey(m.tap.k);m.bids.push({id:Date.now()%1e7+Math.floor(Math.random()*1000),k:p.k,club:m.tap.c,fee:rnd5(pValue(p)*rnd(1.05,1.25),stepOf(pValue(p))),until:G.s.day+7,cnt:0});msg('offer',`Resmi teklif: ${p.name}`,`Aylardır kulis yapan ${CLUBS[m.tap.c].name}, ${p.name} için resmi teklifini yaptı.`);delete m.tap;return r;}
    if(m.bids.length>n0&&m.bids.length<5&&Math.random()<0.32){const b=m.bids[m.bids.length-1],p=pByKey(b.k);if(!p)return r;
      const cs=Object.values(CLUBS).filter(c=>c.id!==G.club&&c.id!==b.club&&!LEAGUES[c.league].youth&&c.str>=Math.max(me.str-3,p.ovr-4)&&LEAGUES[c.league].tier>=curLeague().tier-1);if(!cs.length)return r;const c=pick(cs);
      m.bids.push({id:Date.now()%1e7+Math.floor(Math.random()*1000)+7,k:b.k,club:c.id,fee:rnd5(b.fee*rnd(1.06,1.18),stepOf(b.fee)),until:G.s.day+7,cnt:0,war:1});
      msg('offer',`Artırma savaşı: ${p.name}`,`${CLUBS[b.club].name} teklifini duyan ${c.name} araya girdi ve ${p.name} için daha yüksek teklif yaptı. İki kulübü birbirine karşı oynatabilirsin.`);wdEv('⚔',`${c.name} ve ${CLUBS[b.club].name}, ${p.name} için yarışıyor.`,c.id);}}catch(e){console.warn(e);}return r;})(bidsWeek);
bidModal=(old=>function(){const r=old.apply(this,arguments);try{const b=(G.m.bids||[]).find(x=>x.id===BIDO);if(!b)return r;const D=derbyOf(G.club,b.club),mc=$('#modalCard');if(D&&mc){const t=`<div class="rv-band drb">🔥 <b>${derbyLvN(D.lv)}: ${esc(CLUBS[b.club].name)}</b><span>Oyuncunu ezeli rakibe satarsan taraftar memnuniyeti ciddi düşer ve oyuncu “hain” ilan edilir.</span></div>`;const hd=mc.querySelector('.ng-hd');if(hd)hd.insertAdjacentHTML('afterend',t);}}catch(e){}return r;})(bidModal);
/* ezeli rakipler arası transferler: taraftar tepkisi */
txNote=(old=>function(k,to,fee){let from=null;try{const L=G&&G.txh&&G.txh[k];const p=pByKey(k);from=L&&L.length?L[L.length-1].to:(p?p.home:null);}catch(e){}const r=old.apply(this,arguments);
  try{if(!from||from===to||!G.s)return r;const D=derbyOf(from,to);if(!D||D.lv<2)return r;const p=pByKey(k);if(!p)return r;wdInit();
    if(G.mode==='mgr'&&G.m&&from===G.club){const m=trInit();m.fans=clamp(m.fans-4*D.lv,0,100);m.conf=clamp((m.conf||50)-D.lv,0,100);msg('board',`Taraftar öfkeli: ${p.name} ezeli rakibe gitti`,`${p.name} transferi (alıcı: ezeli rakip ${CLUBS[to].name}) tribünlerde büyük tepki gördü. Taraftar memnuniyeti ciddi düştü; yönetim de rahatsız.`);}
    else if(G.mode==='mgr'&&G.m&&to===G.club){const m=trInit();m.fans=clamp(m.fans+D.lv,0,100);}
    wdEv('😡',`Olay transfer: ${p.name}, ${CLUBS[from].name} formasını çıkarıp ezeli rakip ${CLUBS[to].name} ile imzaladı.`,to,1);try{feedAdd({src:`${CLUBS[from].short} Taraftarı`,h:'@tribun_'+CLUBS[from].short.toLowerCase().replace(/[^a-z]/g,''),cat:'fan',mood:-1,txt:`${p.name} artık bizim için yok. Ezeli rakibe giden hain ilan edilir!`});}catch(e){}}catch(e){}return r;})(txNote);
/* futbolcu modu: Cenk için artırma savaşı ve ezeli rakibe geçiş */
let PO_WAR=0;
pushOffer=(old=>function(o){const r=old.apply(this,arguments);try{if(PO_WAR||!isPl()||!o||o.renew||o.loan||o.role==='A Takıma Yükselme'||o.status!=='open')return r;if(Math.random()>0.28)return r;
    const c=CLUBS[o.club];const cs=Object.values(CLUBS).filter(x=>x.id!==o.club&&x.id!==G.club&&!LEAGUES[x.league].youth&&LEAGUES[x.league].tier>=LEAGUES[c.league].tier-1&&Math.abs(x.str-c.str)<=5&&(!eligible||eligible(LEAGUES[x.league],G.p.age)));if(!cs.length)return r;
    const rv=wpick(cs.map(x=>[x,derbyOf(x.id,o.club)?5:x.league===c.league?2:1])),o2=makeOffer(rv,(o.interest||0)+1,o.kind,o.role);o2.wage=Math.max(o2.wage,Math.round(o.wage*rnd(1.08,1.25)/50)*50);o2.bonus=Math.max(o2.bonus,o.bonus);
    PO_WAR=1;try{old(o2);}finally{PO_WAR=0;}const im=G.inbox[0];if(im&&im.offer===o2){im.title=`Artırma savaşı: ${rv.name}`;im.body=`${c.name} teklifini duyan ${rv.name}${derbyOf(rv.id,o.club)?' (ezeli rakibi)':''} araya girdi ve daha yüksek maaş önerdi: haftalık ${money(o2.wage)}. `+im.body;}
    wdInit();wdEv('⚔',`${rv.name} ve ${c.name}, Cenk Kuşku için yarışıyor.`,rv.id);}catch(e){console.warn(e);}return r;})(pushOffer);
acceptOffer=(old=>function(o){const from=G.club,D=o&&!o.renew?derbyOf(from,o.club):null;const r=old.apply(this,arguments);try{if(D&&D.lv>=2&&isPl()){G.p.fame=clamp(G.p.fame+2,0,100);G.p.morale=clamp(G.p.morale-4,0,100);G.hate={c:from,y:G.s.year};
    msg('news',`Olay transfer: Cenk ezeli rakibe geçti`,`${CLUBS[from].name} taraftarı, Cenk Kuşku’nun ezeli rakip ${CLUBS[o.club].name} ile imzalamasına çok öfkeli. Eski takımına karşı oynayacağın maçlarda ıslıklanacaksın.`);wdInit();wdEv('😡',`Olay transfer: Cenk Kuşku, ${CLUBS[from].name} formasını çıkarıp ezeli rakip ${CLUBS[o.club].name} ile imzaladı.`,o.club,1);}}catch(e){}return r;})(acceptOffer);

/* ---------- 7) Rakip analizinde hocanın planı ---------- */
oppAnalysis=(old=>function(){let h=old.apply(this,arguments);try{const f=ourFixture();if(!f||!h)return h;const id=f[0]===G.club?f[1]:f[0],P=oaiPlan(id,f[0]===G.club);if(!P)return h;
    h+=`<div class="oai-pl"><p class="sub-h"><span>${P.ic} ${esc(P.co)} · muhtemel plan</span><span>${esc(P.n)}</span></p><ul>${P.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul><p class="muted">Hoca kalitesi ${P.ab}/100 · maç içinde skora, kartlara ve senin taktiğine göre plan değiştirir.</p></div>`;}catch(e){}return h;})(oppAnalysis);
/* maç ekranı: Rakip sekmesi ve sol panel özeti */
function oaiPaneHTML(){const S=FX,A=S&&S.oai,O=S.O;if(!A)return '<p class="muted">Rakip hoca bilgisi yok.</p>';const P=A.plan,TIx=TI.filter(t=>O.ti[t.k]&&O.ti[t.k]!==t.d).map(t=>{const o=t.o.find(x=>x[0]===O.ti[t.k]);return o?`<span>${esc(t.n)}: <b>${esc(o[1])}</b></span>`:'';}).join('');
  const mk=A.mk&&S.U.P.find(p=>p.k===A.mk);
  return `<div class="oai-pane"><div class="oai-hd">${crestSVG(CLUBS[O.id]||O,26)}<div><b>${esc(A.co)}</b><small>${esc(P.n)} · ${TAC[O.tacK]?TAC[O.tacK].n:''} · hoca kalitesi ${A.ab}</small></div></div>
   <p class="fx-sub">Maç öncesi planı</p><ul class="oai-why">${P.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>${mk?`<p class="oai-mk">🎯 ${esc(mk.sur)} adam adama markaj altında</p>`:''}
   <p class="fx-sub">Şu anki talimatları</p><div class="oai-ti">${TIx||'<span>Standart</span>'}</div>
   <p class="fx-sub">Maç içindeki hamleleri</p>${A.log.length?`<ul class="oai-log">${A.log.map(x=>`<li><i>${x.m}’</i>${esc(x.t)}</li>`).join('')}</ul>`:'<p class="muted">Henüz bir değişiklik yapmadı.</p>'}
   <p class="muted" style="margin-top:8px">İpucu: rakip yüksek çizgimizi fark ederse arkaya top atar; öne geçersen geri çekilir. Onun hamlesine karşı hamle yap.</p></div>`;}
fxTacHTML=(old=>function(){let h=old.apply(this,arguments);try{if(!FX||!FX.oai)return h;const tb='<div class="fxt-tabs">',i=h.indexOf(tb);if(i<0)return h;const j=h.indexOf('</div>',i);
    h=h.slice(0,j)+`<button data-fx="ttab" data-k="opp" class="${FXT.tab==='opp'?'on':''}">Rakip${FX.oai.n?` · ${FX.oai.n}`:''}</button>`+h.slice(j);
    if(FXT.tab==='opp'){const a=h.indexOf('<div class="fxt-pane">'),b=h.lastIndexOf('</div></section></div></div>');if(a>0&&b>a)h=h.slice(0,a)+'<div class="fxt-pane">'+oaiPaneHTML()+h.slice(b);}}catch(e){console.warn(e);}return h;})(fxTacHTML);
fxLeftHTML=(old=>function(){let h=old.apply(this,arguments);try{const A=FX&&FX.oai;if(A){const l=A.log[0];h+=`<div class="fxl-oai"><p class="fxl-s">Rakip hoca · ${esc(A.co)}</p><small>${esc(A.plan.n)} · ${TAC[FX.O.tacK]?TAC[FX.O.tacK].n:''}</small>${l?`<em>${l.m}’ ${esc(l.t)}</em>`:''}</div>`;}}catch(e){}return h;})(fxLeftHTML);

/* ---------- 8) Rakip radarı sayfası ---------- */
let RDR_T='lig';
function rdrForm(f){return `<span class="rdr-f">${(f||'').split('').map(x=>`<i class="${x==='G'?'w':x==='B'?'d':'l'}">${x}</i>`).join('')}</span>`;}
function rdrPr(pr){const t=pr>=80?['Kovulma eşiğinde','hot']:pr>=55?['Baskı altında','warm']:['Güvende','ok'];return `<span class="rdr-pr ${t[1]}"><i><em style="width:${Math.round(pr)}%"></em></i><small>${t[0]}</small></span>`;}
function viewRadar(){const W=wdInit();if(!W)return '<p class="muted">Sezon başlayınca rakipler hakkında bilgiler burada görünür.</p>';
  const tabs=`<div class="filt">${[['lig','Ligim'],['hoca','Hocalar'],['gun','Gündem'],['rak','Sıradaki rakip']].map(([k,l])=>`<button class="chip" data-act="rdrT" data-k="${k}" aria-pressed="${RDR_T===k}">${l}</button>`).join('')}</div>`;let body='';
  if(RDR_T==='lig'){let tb=[];try{tb=table();}catch(e){}const R=G.s.results||[];
    body=`<section class="panel"><p class="sub-h"><span>${esc(curLeague().name)} · rakiplerin durumu</span><span>${R.length}. hafta</span></p><div class="rdr-tbl">${tb.map((r,i)=>{const c=CLUBS[r.id],C=W.cl[r.id]||{pr:20},me=r.id===G.club,st=OAI_STY[oaiStyleOf(r.id)],D=derbyOf(G.club,r.id);
      return `<div class="rdr-r ${me?'me':''}"><b class="rdr-n">${i+1}</b>${crestSVG(c,20)}<div class="rdr-c"><b>${esc(c.short)}${D?` <span class="rdr-d">${D.lv>=3?'🔥':'⚔'}</span>`:''}</b><small>${me&&!isPl()?'Senin takımın':`${esc(oaiCoachN(r.id))} · ${st.ic} ${esc(st.n)}${C.bo>0?' · <em class="nw">yeni hoca</em>':''}`}</small></div>${rdrForm(wdForm(R,r.id,5).join(''))}${me&&!isPl()?'<span class="rdr-pr"></span>':rdrPr(C.pr||20)}<b class="rdr-p">${r.p}</b></div>`;}).join('')}</div></section>`;}
  else if(RDR_T==='hoca'){const L=Object.entries(W.cl).filter(([id,C])=>CLUBS[id]&&C.pr>=40&&!wdOwnSkip(id)).sort((a,b)=>b[1].pr-a[1].pr).slice(0,20);
    const sk=W.ev.filter(e=>e.ic==='🪓');
    body=`<section class="panel"><p class="sub-h"><span>Baskı altındaki hocalar</span><span>${L.length}</span></p>${L.length?`<div class="rdr-tbl">${L.map(([id,C])=>{const c=CLUBS[id];return `<div class="rdr-r">${crestSVG(c,20)}<div class="rdr-c"><b>${esc(oaiCoachN(id))}</b><small>${esc(c.name)} · ${esc(LEAGUES[c.league].short)}${C.pos?` · ${C.pos}. sırada`:''}</small></div>${rdrForm(C.f)}${rdrPr(C.pr)}</div>`;}).join('')}</div>`:'<p class="muted">Şu an baskı altında hoca yok.</p>'}</section>
     <section class="panel"><p class="sub-h"><span>Bu sezon görevden alınanlar</span><span>${sk.length}</span></p>${sk.length?`<ul class="rdr-ev">${sk.map(e=>`<li><i>${e.ic}</i><span>${esc(e.t)}</span><small>${twD(e.d)}</small></li>`).join('')}</ul>`:'<p class="muted">Henüz kovulan hoca yok.</p>'}</section>`;}
  else if(RDR_T==='gun'){body=`<section class="panel"><p class="sub-h"><span>Sezon gündemi</span><span>${W.ev.length}</span></p>${W.ev.length?`<ul class="rdr-ev">${W.ev.map(e=>`<li class="${e.b?'big':''}"><i>${e.ic}</i><span>${esc(e.t)}</span><small>${twD(e.d)}</small></li>`).join('')}</ul>`:'<p class="muted">Haftalar ilerledikçe kriz, hoca değişikliği, transfer yarışları ve söz düelloları burada birikir.</p>'}</section>`;}
  else{let f=null;try{f=G.club&&ourFixture();}catch(e){}const id=f?(f[0]===G.club?f[1]:f[0]):null;const c=id&&CLUBS[id];
    if(!c)body='<p class="muted">Yakında maç yok.</p>';else{const P=oaiPlan(id,f[0]===G.club),C=W.cl[id]||{pr:20},st=OAI_STY[P.sty];
      body=`<section class="panel rdr-nx"><div class="rdr-nh">${crestSVG(c,44)}<div><b>${esc(c.name)}</b><small>${esc(P.co)} · hoca kalitesi ${P.ab}/100</small>${P.derby?`<span class="rdr-db">🔥 ${esc(P.derby.n)} · ${derbyLvN(P.derby.lv)}</span>`:''}</div>${rdrPr(C.pr||20)}</div>
       <p class="sub-h" style="margin:12px 0 6px"><span>${st.ic} Oyun stili: ${esc(st.n)}</span></p><p class="muted">${esc(st.d)}</p>
       <p class="sub-h" style="margin:12px 0 6px"><span>Bize karşı muhtemel planı</span></p><ul class="oai-why">${P.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>
       <p class="sub-h" style="margin:12px 0 6px"><span>Maç içinde nasıl tepki verir?</span></p><ul class="oai-why"><li>Geriye düşerse 55. dakikadan sonra hücuma kalkar, forvet sokar.</li><li>Öne geçerse 70. dakikadan sonra savunmacı oyuncu alır, oyunu yavaşlatır.</li><li>Sahanın en iyisine adam adama markaj koyar${P.ab<45?' (bu hoca nadiren yapar)':''}.</li><li>Yüksek savunma çizgisine arkaya top, sert prese uzun top ile karşılık verir.</li>${P.ab<35?'<li>Deneyimsiz: öndeyken bile riskli hücum kararları verebilir.</li>':''}</ul>
       <p class="muted">Son form: ${rdrForm(wdForm(G.s.results||[],id,5).join(''))}</p></section>`;}}
  return `<h2 class="h">Rakip radarı</h2>${tabs}${body}`;}
ACTX.rdrT=el=>{RDR_T=el.dataset.k;render();};
XICON.rdr=NI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/><circle cx="12" cy="12" r="1.2"/>');NICON.rdr=XICON.rdr;
Object.assign(XV,{rdr:()=>viewRadar()});
if(typeof UIG_MAP!=='undefined')UIG_MAP.rdr='Maç';
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.s&&!L.some(x=>x[0]==='rdr'))L.push(['rdr','Rakip radarı']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(G&&G.s){const rk=C.find(x=>x[0]==='Rekabet');if(rk&&!rk[1].some(x=>x[0]==='rdr'))rk[1].splice(1,0,['rdr','Rakip radarı',{tab:'rdr'}]);}}catch(e){}return C;})(navCats);
if(typeof uiHubSimplify==='function')uiHubSimplify=(old=>function(v){const r=old.apply(this,arguments);try{const b=v&&v.querySelector('.hub-more .pw-band'),top=v&&v.querySelector(':scope > .hub-top');if(b&&top){const al=v.querySelector(':scope > .hub-al');(al||top).insertAdjacentElement('afterend',b);}}catch(e){}return r;})(uiHubSimplify);

/* LZ sıkıştırma (lz-string algoritması, UTF-16 çıktı) */
const LZ=(function(){const fc=String.fromCharCode;
  function _c(u,bits,gc){if(u==null)return '';let i,v,dict={},create={},wc,w='',enl=2,dsz=3,nb=2,data=[],dv=0,dp=0,ii;
    for(ii=0;ii<u.length;ii++){const c=u.charAt(ii);if(!Object.prototype.hasOwnProperty.call(dict,c)){dict[c]=dsz++;create[c]=true;}
      wc=w+c;if(Object.prototype.hasOwnProperty.call(dict,wc))w=wc;else{
        if(Object.prototype.hasOwnProperty.call(create,w)){if(w.charCodeAt(0)<256){for(i=0;i<nb;i++){dv=(dv<<1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;}
            v=w.charCodeAt(0);for(i=0;i<8;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
          else{v=1;for(i=0;i<nb;i++){dv=(dv<<1)|v;if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v=0;}
            v=w.charCodeAt(0);for(i=0;i<16;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
          enl--;if(enl==0){enl=Math.pow(2,nb);nb++;}delete create[w];}
        else{v=dict[w];for(i=0;i<nb;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
        enl--;if(enl==0){enl=Math.pow(2,nb);nb++;}dict[wc]=dsz++;w=String(c);}}
    if(w!==''){if(Object.prototype.hasOwnProperty.call(create,w)){if(w.charCodeAt(0)<256){for(i=0;i<nb;i++){dv=(dv<<1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;}
          v=w.charCodeAt(0);for(i=0;i<8;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
        else{v=1;for(i=0;i<nb;i++){dv=(dv<<1)|v;if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v=0;}
          v=w.charCodeAt(0);for(i=0;i<16;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
        enl--;if(enl==0){enl=Math.pow(2,nb);nb++;}delete create[w];}
      else{v=dict[w];for(i=0;i<nb;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}}
      enl--;if(enl==0){enl=Math.pow(2,nb);nb++;}}
    v=2;for(i=0;i<nb;i++){dv=(dv<<1)|(v&1);if(dp==bits-1){dp=0;data.push(gc(dv));dv=0;}else dp++;v>>=1;}
    while(true){dv=(dv<<1);if(dp==bits-1){data.push(gc(dv));break;}else dp++;}return data.join('');}
  function _d(len,resetVal,gn){let dict=[],enl=4,dsz=4,nb=3,entry='',result=[],i,w,bits,resb,maxp,power,c,data={val:gn(0),position:resetVal,index:1};
    for(i=0;i<3;i++)dict[i]=i;
    const rd=n=>{let b=0;maxp=Math.pow(2,n);power=1;while(power!=maxp){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetVal;data.val=gn(data.index++);}b|=(resb>0?1:0)*power;power<<=1;}return b;};
    bits=rd(2);switch(bits){case 0:c=fc(rd(8));break;case 1:c=fc(rd(16));break;case 2:return '';}
    dict[3]=c;w=c;result.push(c);
    while(true){if(data.index>len)return '';bits=rd(nb);switch(c=bits){case 0:dict[dsz++]=fc(rd(8));c=dsz-1;enl--;break;case 1:dict[dsz++]=fc(rd(16));c=dsz-1;enl--;break;case 2:return result.join('');}
      if(enl==0){enl=Math.pow(2,nb);nb++;}
      if(dict[c])entry=dict[c];else{if(c===dsz)entry=w+w.charAt(0);else return null;}
      result.push(entry);dict[dsz++]=w+entry.charAt(0);enl--;w=entry;if(enl==0){enl=Math.pow(2,nb);nb++;}}}
  return {c16:s=>s==null?'':_c(s,15,a=>fc(a+32))+' ',d16:s=>s==null?'':s==''?null:_d(s.length,16384,i=>s.charCodeAt(i)-32)};})();
