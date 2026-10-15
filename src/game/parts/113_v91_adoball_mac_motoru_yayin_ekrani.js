/* ================= v91: Adoball maç motoru + yayın ekranı (birebir) =================
   İzlenen her maç (teknik direktör, yardımcı antrenör, futbolcu, gözlemci/doktor, hakem) Adoball'ın kendi canlı motoruyla
   (Sim2D: top fiziği, oyuncu yapay zekâsı, 19 özellik, ofsayt, VAR, kart, penaltı, yorgunluk) ve kendi maç ekranıyla oynanır.
   Adoball belgesi ayrı bir çerçevede (iframe) çalışır; 3B görünüm motoru (Ado3D) bu sayfayla paylaşılır.
   Oyunun kayıt düzeni değişmez: maç boyunca FX nesnesi motordan beslenir, maç sonunda her zamanki fxClose() çalışır. */
const ABM={ifr:null,win:null,ready:false,wait:[],fx:null,sim:null,raf:0,s0:0,map:null,last:0,lastT:0,pz:0,ff:0,done:false,shots:[],base:{},rtSnap:{},adj:{}};
window.ABM=ABM;
const AB_ROLE=['GK','LB','LCB','RCB','RB','LDM','RDM','LW','AM','RW','ST'];
const AB_FORM=[[.035,.5],[.27,.10],[.245,.36],[.245,.64],[.27,.90],[.42,.36],[.42,.64],[.60,.12],[.58,.5],[.60,.88],[.72,.5]];
const AB_POS={GK:'KL',LB:'SLB',LCB:'STP',RCB:'STP',RB:'SĞB',LDM:'MDO',RDM:'MO',LW:'SLK',AM:'MOO',RW:'SĞK',ST:'SF'};
const AB_MAP=[0,1,2,3,4,5,6,8,7,9,10];            /* Adoball kadro sırası → motor sırası */
const AB_AGG={KL:12,STP:62,SLB:52,'SĞB':52,MDO:66,MO:44,MOO:34,SLK:28,'SĞK':28,SF:36};
function abAvail(){return !!document.getElementById('abdoc');}
function abPref(){try{if(localStorage.getItem('abeng')==='0')return false;}catch(e){}return abAvail();}
function abDocText(){const s=document.getElementById('abdoc');return s?s.textContent.replace(/<\u0007/g,'<'):'';}
/* ---------- çerçeve ---------- */
function abHost(){let el=$('#fx');if(!el){el=document.createElement('div');el.id='fx';document.body.appendChild(el);}
  if(!el.classList.contains('abm')||!el.querySelector('#abIf')){el.className='fx abm';el.innerHTML='<div id="abWrap"><iframe id="abIf" title="Maç ekranı" allow="fullscreen; autoplay"></iframe><div id="abLoad"><span class="abl-ball"></span><b>Maç ekranı hazırlanıyor…</b></div></div>';ABM.ready=false;ABM.ifr=null;ABM.win=null;}
  return el;}
function abEnsure(cb){const el=abHost();const ifr=el.querySelector('#abIf');
  if(ABM.ready&&ABM.ifr===ifr&&ABM.win&&ABM.win.ABH){cb();return;}
  ABM.wait.push(cb);if(ABM.ifr===ifr)return;ABM.ifr=ifr;ABM.ready=false;
  const t0=performance.now();
  const chk=()=>{try{const w=ifr.contentWindow;if(w&&w.ABH&&w.ado2d&&w.document.readyState==='complete'&&w.setupMatchView){ABM.win=w;ABM.ready=true;const q=ABM.wait.splice(0);for(const f of q){try{f();}catch(e){console.warn('Adoball',e);}}return;}}catch(e){}
    if(performance.now()-t0>30000){console.warn('Adoball yüklenemedi');ABM.wait.length=0;abFail();return;}setTimeout(chk,60);};
  ifr.srcdoc=abDocText();setTimeout(chk,80);}
function abFail(){/* Adoball açılamazsa eski motorla devam */const S=FX;if(!S||!S.ab)return;try{const o=S.o;FX=null;const el=$('#fx');if(el){el.className='fx';el.innerHTML='';}ABM.ifr=null;ABM.ready=false;abOff=1;fxStart(o);}catch(e){console.warn(e);}finally{abOff=0;}}
let abOff=0;
/* ---------- oyuncu → Adoball kaydı ---------- */
function abAttrs(p,role,boost,fam){let R={};try{R=fmAttrs(p).raw||{};}catch(e){}const b=boost||0,f=(fam!=null?fam:0.7),o=p.ovr||60;
  const g=(n,d)=>{const v=R[n];return v==null?(d!=null?d:o-8):v;},c=(v,x)=>Math.round(clamp(v+(x===0?0:b),5,99));
  const pos=AB_POS[role]||'MO',tf=(f-0.7)*10;
  if(p.pos==='KL'||role==='GK')return {pos:'KL',gk_ref:c(g('Refleks',o)),gk_div:c((g('Refleks',o)+g('Çeviklik',o-4))/2),gk_pos:c(g('Pozisyon Alma',o)+tf*.4),gk_kic:c((g('Ayakla Oyun',o-10)+g('Uzun Atış',o-12))/2),gk_1v1:c(g('Bire Bir',o-2)),
    pen:c(g('Penaltı Kullanma',35)),fk:c(g('Serbest Vuruş Kullanma',30)),cor:c(g('Korner',25)),vis:c(g('Vizyon',o-20)),bal:c(g('Denge',o-6)),lead:c(g('Liderlik',o-10),0),agg:12,
    gk_air:c(g('Hava Hakimiyeti',o-4)),gk_han:c(g('Elle Oyun',o-4)),gk_spd:c((g('Çeviklik',o-4)+g('Hızlanma',o-12))/2)};
  const df=/^(STP|SLB|SĞB|MDO)$/.test(pos),at=/^(SF|SLK|SĞK|MOO)$/.test(pos);
  const posi=df?g('Pozisyon Alma')*.75+g('Topsuz Alan')*.25:at?g('Topsuz Alan')*.65+g('Pozisyon Alma')*.35:(g('Pozisyon Alma')+g('Topsuz Alan'))/2;
  const aggRaw=g('Agresiflik',o-8),aggRef=p.pos==='DF'?o-2:o-12;
  return {pos,pac:c(g('Hız')*.8+g('Hızlanma')*.2),acc:c(g('Hızlanma')*.7+g('Çeviklik',o-4)*.3),str:c(g('Güç')),sta:c((g('Dayanıklılık')*.7+g('Vücut Zindeliği',o-4)*.3)),dri:c((g('Dripling')*.5+g('İlk Kontrol')*.3+g('Teknik')*.2)),
    pas:c(g('Pas')*.8+g('Takım Oyunu',o-4)*.2+tf*.3),lon:c(g('Uzaktan Şut')),fin:c(g('Bitiricilik')*.8+g('Soğukkanlılık',o-4)*.2),sho:c(g('Uzaktan Şut')*.45+g('Bitiricilik')*.25+g('Güç')*.3),
    hea:c(g('Kafa Vuruşu')*.7+g('Zıplama')*.3),tac:c(g('Top Kapma')),mar:c(g('Markaj')*.8+g('Konsantrasyon',o-5)*.2),posi:c(posi+tf),vis:c(g('Vizyon')*.6+g('Karar Alma')*.4+tf*.5),
    bal:c(g('Denge')),agg:Math.round(clamp((AB_AGG[pos]||40)+(aggRaw-aggRef)*0.8,8,92)),pen:c(g('Penaltı Kullanma',o-10)),fk:c(g('Serbest Vuruş Kullanma',o-14)),cor:c(g('Korner',o-14)),lead:c(g('Liderlik',o-10),0)};}
function abLook(p,T){try{const q=Object.assign({spos:p.pos==='KL'?'KL':(p.spos||''),T},p);const r=f3Look(q,0);const M=pMetaX(q);
  return {h:r.h||180,w:r.w||75,sk:r.sk!=null?r.sk:1,hs:r.hs!=null?r.hs:1,hc:r.hc!=null?r.hc:0,bd:r.bd!=null?r.bd:0,ft:M.ft==='Sol'?'L':'R',wf:clamp(M.wf||3,1,5),v:2};}catch(e){return null;}}
let AB_ID=1000000;
function abRec(p,role,T,boost,fam){const A=abAttrs(p,role,boost,fam),id=AB_ID++;const r=Object.assign({id,name:p.name,__k:p.k},A);const ap=abLook(p,T);if(ap)r.__ap=ap;if(p.k==='ME')r.agg=6;return r;}
/* ---------- diziliş → motorun 11 rolü (en yakın eşleme, Macar yöntemi) ---------- */
function abHung(C){const n=C.length,u=new Array(n+1).fill(0),v=new Array(n+1).fill(0),p=new Array(n+1).fill(0),way=new Array(n+1).fill(0);
  for(let i=1;i<=n;i++){p[0]=i;let j0=0;const minv=new Array(n+1).fill(Infinity),used=new Array(n+1).fill(false);
    do{used[j0]=true;const i0=p[j0];let d=Infinity,j1=0;for(let j=1;j<=n;j++)if(!used[j]){const cur=C[i0-1][j-1]-u[i0]-v[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0;}if(minv[j]<d){d=minv[j];j1=j;}}
      for(let j=0;j<=n;j++){if(used[j]){u[p[j]]+=d;v[j]-=d;}else minv[j]-=d;}j0=j1;}while(p[j0]!==0);
    do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);}
  const ans=new Array(n);for(let j=1;j<=n;j++)ans[p[j]-1]=j-1;return ans;}
const AB_DY=[[.04,.035],[.18,.245],[.24,.27],[.40,.42],[.48,.50],[.64,.58],[.76,.60],[.85,.72]];
function abDepth(y){const A=AB_DY;if(y<=A[0][0])return A[0][1];for(let i=1;i<A.length;i++)if(y<=A[i][0]){const t=(y-A[i-1][0])/(A[i][0]-A[i-1][0]);return A[i-1][1]+t*(A[i][1]-A[i-1][1]);}return A[A.length-1][1]+(y-A[A.length-1][0])*.6;}
/* sahadaki 11 oyuncuyu (FX) motor rollerine yerleştir: [ei] = FX oyuncusu, ev konumu */
function abAssign(T){const on=T.P.filter(p=>!p.off),SL=FMF[T.form]||FMF['4-2-3-1'];const gk=on.find(p=>p.spos==='KL')||on[0];const out=on.filter(p=>p!==gk).slice(0,10);
  const pts=out.map(p=>{const s=SL[p.slot]||['OS',.5,.5];return [abDepth(s[2]),clamp(s[1],.04,.96)];});
  const C=out.map((p,i)=>AB_FORM.slice(1).map(f=>{const dx=(pts[i][0]-f[0])*1.6,dy=pts[i][1]-f[1];return dx*dx+dy*dy;}));
  while(C.length<10)C.push(new Array(10).fill(0));
  const asg=abHung(C),res=new Array(11).fill(null),homes=new Array(11).fill(null);res[0]=gk;homes[0]=null;
  out.forEach((p,i)=>{const r=asg[i]+1;res[r]=p;homes[r]=[clamp(pts[i][0],.08,.8),pts[i][1]];});return {res,homes};}
/* takım talimatları: oyunun taktikleri → Adoball'ın altı talimatı (−1/0/+1) */
function abTac(T){const ti=T.ti||{},k=T.tacK||'';const s=(v,a,b)=>v===a?1:v===b?-1:0;
  return {ment:k==='hucum'?1:k==='savunma'?-1:0,tempo:s(ti.tempo,'yuk','dus'),line:s(ti.hat,'yuksek','derin')||(k==='pres'?1:0),press:(k==='pres'?1:0)||s(ti.pres,'yuk','dus')||s(ti.yog,'cok','az'),
    width:s(ti.gen,'gen','dar'),gk:/uzun|uz/.test(ti.kaleci||'')?1:/kisa|kıs/.test(ti.kaleci||'')?-1:(ti.pas==='direkt'?1:ti.pas==='kisa'?-1:0)};}
function abTeam(T,side,recs,asg){const c=CLUBS[T.id]||{};const ids=new Array(11);for(let gi=0;gi<11;gi++){const ei=AB_MAP[gi];ids[gi]=recs[ei].id;}
  let tk=null;const tid=kind=>{try{const p=typeof fxTaker==='function'?fxTaker(T,kind):null;if(p){const i=asg.res.indexOf(p);if(i>=0)return recs[i].id;}}catch(e){}return null;};
  return {name:T.name,color:T.c1||c.c1||'#888',color2:T.c2||c.c2||'#fff',logo:'shield',code:(T.short||c.short||'').slice(0,4),__cid:T.id,manager:75,stadium:75,squad:ids,captainId:null,
    penaltyTakerId:tid('pen'),freeKickTakerId:tid('fk'),cornerTakerId:tid('co')};}
/* ---------- başlat ---------- */
function abUse(o){return !abOff&&abPref()&&!(o&&o.headless);}
fxStart=(old=>function(o){if(!abUse(o))return old.apply(this,arguments);
  const op=fxOpen;fxOpen=function(){};let r;try{r=old.apply(this,arguments);}finally{fxOpen=op;}
  const S=FX;if(!S)return r;S.ab=1;S.phase='pre';ABM.fx=S;ABM.done=false;ABM.sim=null;ABM.ff=0;ABM.ffDetach=0;ABM.fq=[];ABM.fcur=null;
  const el=abHost();el.hidden=false;$('#tabs').hidden=true;document.documentElement.classList.add('playing');const ld=$('#abLoad');if(ld)ld.hidden=false;
  setTimeout(()=>{if(FX!==S)return;abEnsure(()=>{if(FX===S)abSetup(S);});},0);return r;})(fxStart);
function abSetup(S){const W=ABM.win;if(!W)return;const H=W.ABH;
  const usE=S.o&&(S.o.usHome||S.o.neutral)?0:1;ABM.s0=usE===0?0:1;          /* motor takımı 0 = ev sahibi; s0: motor 0'ın FX tarafı */
  const sides=ABM.s0===0?[S.U,S.O]:[S.O,S.U];
  /* kayıtları kur */
  const db=H.db();for(let i=db.length-1;i>=0;i--)if(db[i].id>=1000000)db.splice(i,1);
  /* motorun rahat çalıştığı güç bandı (≈72+): iki takım birlikte kaydırılır, aradaki fark aynen kalır */
  const avg=T=>{const on=T.P.filter(p=>!p.off);return on.reduce((a,p)=>a+(p.ovr||60),0)/Math.max(1,on.length);};ABM.shift=Math.round(clamp(72-(avg(S.U)+avg(S.O))/2,0,30));
  ABM.map={byId:{},ei:[],asg:[]};const recsE=[],homes=[],teams=[];
  sides.forEach((T,e)=>{const asg=abAssign(T),recs=asg.res.map((p,i)=>{const rr=abRec(p,AB_ROLE[i],T,(T.boost||0)+ABM.shift,T.famF);rr.pos=AB_POS[AB_ROLE[i]];if(i===0)rr.pos='KL';try{rr.lbl=i===0?'KL':posTag(p,T);}catch(e){}db.push(rr);ABM.map.byId[rr.id]=p;p.ei=e*11+i;p.abId=rr.id;return rr;});
    /* yedekler de kayıtlı (değişiklik için) */
    for(const b of T.bench||[]){if(b.abId&&db.some(x=>x.id===b.abId))continue;const rr=abRec(b,b.pos==='KL'?'GK':b.pos==='DF'?'LCB':b.pos==='FW'?'ST':b.pos==='KN'?'LW':'AM',T,(T.boost||0)+ABM.shift,T.famF);db.push(rr);b.abId=rr.id;try{rr.lbl=dpTag(b);}catch(e){}ABM.map.byId[rr.id]=b;}
    recsE.push(recs);homes.push(asg.homes);ABM.map.asg.push(asg);teams.push(abTeam(T,e,recs,asg));});
  W.__abHomes=homes;W.__abForm=sides.map(T=>T.form);W.__abTac=sides.map(abTac);W.__ab2d_seed=(Date.now()^(Math.random()*4294967296))>>>0;
  const ctl=G.mode==='mgr'&&!S.watch&&!S.pl3&&!S.scr&&!S.ref3&&!S.bsk;W.__abMine=ctl?(ABM.s0===0?0:1):null;
  const bc=W.document.body.classList;bc.toggle('abh-mine',ctl);bc.toggle('abh-mine0',ctl&&W.__abMine===0);bc.toggle('abh-mine1',ctl&&W.__abMine===1);bc.toggle('abh-notac',!ctl);
  try{if(!W.localStorage.getItem('ado_match_len_v1'))W.localStorage.setItem('ado_match_len_v1','5');}catch(e){}
  const md=H.md();md.h=teams[0];md.a=teams[1];md.isTournamentMatch=true;md.neutralVenue=!!(S.o&&S.o.neutral);
  W.onTournamentMatchEnd=function(hg,ag){abFullTime();};
  abPatchWin(W);
  try{if(W.ado2d.mode()!=='2d')W.ado2d.setMode('2d');}catch(e){}
  W.setupMatchView();
  try{if(W.ado2d.mode()!=='2d')W.ado2d.setMode('2d');}catch(e){}
  ABM.sim=null;abHook();
  const st=W.ado2d.state;if(!ctl)st.tacOk=[true,true];
  if(S.pl3||S.scr||S.ref3){const sim=W.ado2d.sim();if(sim){sim.noGoal=true;sim.forceDist=34;}}
  ABM.last=0;ABM.lastT=0;ABM.pz=0;ABM.ff=0;ABM.shots=[];ABM.rtSnap={};ABM.adj={};ABM.htDone=false;ABM.aiT=0;ABM.tacKey=['',''];ABM.fq=[];ABM.rbT=0;ABM.heatT=0;ABM.apT=0;
  abBarExtras(W);
  const ld=$('#abLoad');if(ld)ld.hidden=true;
  S.phase='play';
  if(S.pl3||S.scr||S.ref3){setTimeout(()=>{try{if(FX===S&&ABM.win)ABM.win.startMatch();}catch(e){console.warn(e);}},700);}
  cancelAnimationFrame(ABM.raf);ABM.raf=requestAnimationFrame(abTick);}
/* çerçeve penceresine kancalar: arma, maç özeti düğmesi */
function abPatchWin(W){if(W.__abp)return;W.__abp=1;
  const oc=W.renderTeamCrestHTML;W.renderTeamCrestHTML=function(team,size,glow){try{if(team&&team.__cid&&CLUBS[team.__cid])return `<span class="ab-crest" style="display:inline-flex;width:${size||34}px;height:${size||34}px;align-items:center;justify-content:center;flex:none">${crestSVG(CLUBS[team.__cid],size||34)}</span>`;}catch(e){}return oc.apply(this,arguments);};}
/* motor olaylarını dinle (köprü maçı yeniden kurarsa tekrar bağlanır) */
function abHook(){const W=ABM.win;if(!W)return;const sim=W.ado2d.sim();if(!sim||sim===ABM.sim)return;ABM.sim=sim;const prev=sim.onEvent;
  sim.onEvent=function(e){if(prev&&!ABM.ffDetach)prev(e);try{abEv(e);}catch(x){console.warn('ab olay',x);}};
  const S=ABM.fx;if(S&&(S.pl3||S.scr||S.ref3)){sim.noGoal=true;sim.forceDist=34;}}
/* ---------- yardımcılar ---------- */
const abE2S=e=>e===0?ABM.s0:1-ABM.s0, abS2E=s=>s===ABM.s0?0:1;
function abFxP(ei){const S=ABM.fx;if(!S||ei==null||ei<0)return null;for(const T of S.T)for(const p of T.P)if(p.ei===ei&&!p.subbed)return p;return null;}
function abXY(x,y){const sim=ABM.sim;if(!sim)return [x,y];const eu=abS2E(0);return sim.teams[eu].dir===1?[x,y]:[105-x,68-y];}
function abMin(){const sim=ABM.sim;return sim?Math.min(120,Math.floor(sim.t*sim.C.CK/60)+1):1;}
/* ---------- olaylar → FX kayıtları ---------- */
function abEv(e){const S=ABM.fx;if(!S||FX!==S)return;const sim=ABM.sim,t=e.type;
  const side=e.team>=0?abE2S(e.team):-1,T=side>=0?S.T[side]:null,p=abFxP(e.p),mn=abMin();
  if(t==='SHOT'&&p&&T){const dir=sim.teams[e.team].dir,u=dir>0?e.x:105-e.x,v=dir>0?e.y:68-e.y;try{const A=anS();const r={x:u,y:v,s:side,r:'?',xg:(e.meta&&e.meta.xg)||0.05,m:mn,n:p.sur||p.name,k:e.meta&&e.meta.tag==='PEN'?'pen':e.meta&&e.meta.tag==='FK'?'fk':''};A.shots.push(r);ABM.lastShot=r;}catch(x){}p.s.sh++;if(e.meta&&e.meta.on)p.s.son++;}
  else if(t==='SAVE'){if(ABM.lastShot)ABM.lastShot.r='sv';if(p)p.s.sv=(p.s.sv||0)+1;}
  else if(t==='OFF'){if(ABM.lastShot&&ABM.lastShot.r==='?')ABM.lastShot.r='off';}
  else if(t==='BLOCK'){if(ABM.lastShot&&ABM.lastShot.r==='?')ABM.lastShot.r='bl';}
  else if(t==='POST'){if(ABM.lastShot)ABM.lastShot.r='post';}
  else if(t==='PASS'&&side===0&&p){try{const A=anS();A.pc[p.k]=(A.pc[p.k]||0)+1;}catch(x){}}
  else if(t==='PASS_OK'&&side===0){const a=abFxP(e.p2),b=p;if(a&&b&&a!==b){try{const A=anS(),key=a.k+'>'+b.k;A.pn[key]=(A.pn[key]||0)+1;}catch(x){}}}
  else if(t==='TACKLE'&&p){p.s.tk=(p.s.tk||0)+1;}
  else if(t==='GOAL'&&side>=0){const own=e.meta&&e.meta.own;const sc=own?null:p;if(ABM.lastShot&&ABM.lastShot.r==='?')ABM.lastShot.r='g';
    if(sc){sc.s.g++;}const as=e.meta&&e.meta.assist!=null?abFxP(e.meta.assist):null;if(as&&!own)as.s.as=(as.s.as||0)+1;
    if(side===0)S.scorers.push(sc?sc.k:null);
    S.score=[sim.teams[abS2E(0)].score,sim.teams[abS2E(1)].score];
    try{fxEv(mn,`GOL! ${T.name}: ${sc?sc.name:'kendi kalesine'}${as&&!own?` (asist: ${as.sur||as.name})`:''}. ${S.score[0]}-${S.score[1]}`,side===0?'us':'opp');}catch(x){}
    abGoalRec(side,sc,e);}
  else if(t==='CARD'&&p){const red=e.meta&&e.meta.card==='R';if(red){p.red=1;p.redWhy=e.meta&&e.meta.why||null;p.red2=!!(e.meta&&e.meta.second);p.off=true;p.offT=sim.t*sim.C.CK;}else p.yel=(p.yel||0)+1;
    try{fxEv(mn,`${red?'🟥 Kırmızı kart':'🟨 Sarı kart'}: ${p.name} (${T?T.short:''})`,red?'red':'');}catch(x){}}
  else if(t==='HALFTIME'){S.half=2;}
  else if(t==='FULLTIME'){if(ABM.ffDetach)abFullTime();}}
/* gol arşivi için son anlar (FX biçiminde) */
function abGoalRec(side,sc,e){const S=ABM.fx;try{if(!S.rb||S.rb.length<10)return;const T=S.T[side],last=S.rb[S.rb.length-1].slice(),fin=[];
  for(let i=0;i<8;i++){const fr=last.slice();fr[0]=Math.round((side===0?105.8+i*.08:-.8-i*.08)*5);fr[2]=Math.max(0,fr[2]-i);fin.push(fr);}
  const meta=S.T.map(T2=>T2.P.map(p=>[p.num,p.spos==='KL'?1:0])),dir=ABM.sim.teams[e.team].dir,gx=dir>0?105:0;
  (S.grec=S.grec||[]).push({side,n:sc?sc.name:'',num:sc?sc.num:0,m:abMin(),xg:(e.meta&&e.meta.xg)||0.1,hdr:!!(ABM.lastShot&&/kafa/.test(ABM.lastShot.k||'')),d:Math.round((e.meta&&e.meta.dist)||12),fr:S.rb.slice(-75).concat(fin),meta,col:[[S.U.c1,S.U.c2],[S.O.c1,S.O.c2]],nm:[S.U.short,S.O.short],sc:S.score.slice()});}catch(x){console.warn(x);}}
/* ---------- her kare: motor → FX, senaryolu modlar, rakip yapay zekâsı ---------- */
function abTick(){const S=ABM.fx;if(!S||FX!==S||!ABM.win){ABM.raf=0;return;}ABM.raf=requestAnimationFrame(abTick);abTickCore();}
function abTickCore(){const S=ABM.fx;if(!S||FX!==S||!ABM.win)return;
  try{abHook();const sim=ABM.sim;if(!sim)return;const W=ABM.win,st=W.ado2d.state,CK=sim.C.CK;
    const tc=sim.t*CK,dt=Math.max(0,tc-(ABM.lastT||0));ABM.lastT=tc;
    S.t=tc;S.half=sim.half;S.score=[sim.teams[abS2E(0)].score,sim.teams[abS2E(1)].score];
    /* durum */
    if(!ABM.ff){const lag=abLag(S)>3;if(S.phase==='pause'||lag){if(st.running&&!ABM.pz){ABM.pz=1;try{W.pauseMatch();}catch(e){}}}
      else if(ABM.pz){ABM.pz=0;try{if(!sim.finished&&st.hold!=='half')W.startMatch();}catch(e){}}}
    if(S.phase==='pre'&&(st.running||sim.t>0))S.phase='play';
    if(st.hold==='half'&&S.phase==='play'){S.phase='ht';abHalf(S);}
    if(S.phase==='ht'&&st.hold!=='half'&&!sim.finished)S.phase='play';
    if(dt>0){abMirror(S,sim,st,dt);
      if(S.scr){try{w3Tick();}catch(e){}}
      if(S.ref3){try{ref3Tick();}catch(e){}}
      ABM.aiT+=dt;if(ABM.aiT>=60){ABM.aiT=0;try{fxCoachAI();}catch(e){}if(S.watch){try{fxCoachU();fxSugEval();}catch(e){}}else if(S.bsk){try{fxCoachU();}catch(e){}}abTacSync(S);}
      abForceTick(S,sim);}
    if(S.pl3){try{sim.holdEnd=!!(MR&&!MR.fin&&!PL3.end&&MR.min<MR.end);}catch(e){}}
    if(S.pl3&&ABM.done&&sim.finished&&S.phase!=='end'&&S.phase!=='pause'&&!PL3.mom)S.phase='end';
    if(S.pl3)try{pl3Drive();}catch(e){console.warn(e);}
  }catch(e){console.warn('ab tick',e);}}
function abMirror(S,sim,st,dt){const R=st.rt,fl=sim.teams[abS2E(0)].dir!==1;/* [v133] kare basina dizi tahsisi yok (abXY ile ayni donusum) */
  for(const T of S.T)for(const p of T.P){if(p.ei==null||p.subbed)continue;const q=sim.players[p.ei];if(!q)continue;p.x=fl?105-q.x:q.x;p.y=fl?68-q.y:q.y;p.st=clamp((q.stam!=null?q.stam:1)*100,10,100);
    if(R){try{p.rt=clamp(R.get(p.ei)+(ABM.adj[p.k]||0),3,10);const c=R.c[p.ei];if(c){p.s.pa=c.pa||0;p.s.pc=c.pok||0;}}catch(e){}}
    if(q.off&&!p.off){p.off=true;}}
  const B=sim.ball,bxy=abXY(B.x,B.y);S.ball.x=bxy[0];S.ball.y=bxy[1];S.ball.z=B.z||0;
  /* takım istatistikleri */
  const pp=sim.possPct();for(let sd=0;sd<2;sd++){const e=abS2E(sd),a=sim.teams[e].st,o=S.stats[sd];o.pos=pp[e]*60;o.sh=a.shots;o.son=a.sot;o.xg=a.xg;o.pc=a.passOk;o.pa=a.passes;o.fo=a.fouls;o.co=a.corners;o.yc=a.yellow;}
  /* baskı grafiği (5 dakikalık dilimler) */
  if(!S.mom)S.mom=Array.from({length:18},()=>[0,0]);const mi=Math.min(17,Math.floor(Math.min(S.t,89.9*60)/300));if(S.ball.x>70)S.mom[mi][0]+=dt;else if(S.ball.x<35)S.mom[mi][1]+=dt;
  /* ısı haritası ve ortalama konum (teknik direktör) */
  if(G.mode==='mgr'&&!S.watch){try{HEAT=HEAT&&HEAT.id===S.id0?HEAT:{id:S.id0,g:{}};const T=S.T[0],w=dt/0.6;
    for(const p of fxOn(T)){if(!p.k)continue;const cx=clamp(Math.floor(p.x/FXL*12),0,11),cy=clamp(Math.floor(p.y/FXW*8),0,7);const a=HEAT.g[p.k]=HEAT.g[p.k]||new Array(96).fill(0);a[cy*12+cx]+=w;}}catch(e){}}
  try{const A=anS(),U=S.U,w=dt;for(const p of fxOn(U)){const a=A.ap[p.k]=A.ap[p.k]||[0,0,0];a[0]+=p.x*w;a[1]+=p.y*w;a[2]+=w;}}catch(e){}
  /* gol tekrarı tamponu */
  if(sim.t-ABM.rbT>=0.12){ABM.rbT=sim.t;const fr=[Math.round(S.ball.x*5),Math.round(S.ball.y*5),Math.round(S.ball.z*5)];for(const T of S.T)for(const p of T.P)fr.push(p.off?-999:Math.round(p.x*5),p.off?-999:Math.round(p.y*5));S.rb=S.rb||[];S.rb.push(fr);if(S.rb.length>95)S.rb.shift();}
  /* FX tarafında oyundan atılan (futbolcu modu kırmızısı vb.) motora da */
  for(const T of S.T)for(const p of T.P)if(p.off&&!p.subbed&&p.ei!=null){const q=sim.players[p.ei];if(q&&!q.off&&!p.abSub){try{sim.sendOff(p.ei);}catch(e){}}}}
/* talimat değişikliği (yapay zekâ teknik direktörü) motora */
function abTacSync(S){const sim=ABM.sim,W=ABM.win;if(!sim||!W)return;S.T.forEach((T,sd)=>{const e=abS2E(sd);if(W.__abMine===e)return;const t=abTac(T),k=JSON.stringify(t);if(ABM.tacKey[sd]!==k){ABM.tacKey[sd]=k;try{sim.setTactics(e,t);const st=W.ado2d.state;if(st&&st.tac)st.tac[e]=sim.tactics(e);}catch(x){}}});}
/* ---------- oyuncu değişikliği: FX + motor ---------- */
fxSub=(old=>function(T,out,inP){const S=FX;const r=old.apply(this,arguments);if(!r||!S||!S.ab||!ABM.sim)return r;try{abSubEng(T,out,inP);}catch(e){console.warn('ab değişiklik',e);}return r;})(fxSub);
function abSubEng(T,out,inP){const S=ABM.fx,sim=ABM.sim,W=ABM.win;if(!sim||!W||out.ei==null)return;const ei=out.ei,np=T.P[T.P.length-1];if(!np||np.k!==inP.k)return;
  const side=S.T.indexOf(T),e=abS2E(side),role=sim.players[ei].role;
  const db=W.ABH.db();let rec=inP.abId?db.find(x=>x.id===inP.abId):null;const fresh=abRec(inP,role,T,(T.boost||0)+(ABM.shift||0),T.famF);fresh.pos=AB_POS[role]||fresh.pos;if(!rec){db.push(fresh);rec=fresh;}else{Object.assign(rec,fresh,{id:rec.id});}
  const ro=W.DB2D.toEngine(rec);const st=W.ado2d.state;
  try{ABM.rtSnap[out.k]=out.rt;}catch(x){}
  sim.sub(ei,ro);np.ei=ei;np.abId=rec.id;out.abSub=1;out.offT=sim.t*sim.C.CK;np.onT=sim.t*sim.C.CK;ABM.map.byId[rec.id]=np;
  try{st.eng2db[ei]=rec.id;st.db2eng={};st.eng2db.forEach((d,i)=>{if(d!=null)st.db2eng[d]=i;});}catch(x){}
  try{const md=W.ABH.md(),tm=e===0?md.h:md.a,gi=AB_MAP.indexOf(ei-e*11);if(gi>=0)tm.squad[gi]=rec.id;if(md.ratings)md.ratings[rec.id]=6.5;if(md.playerMatchStats)md.playerMatchStats[rec.id]={goals:0,assists:0,shots:0,sot:0,saves:0,yellow:0,red:0};}catch(x){}
  try{const c=st.rt&&st.rt.c[ei];if(c)for(const k in c){if(typeof c[k]==='number')c[k]=0;else if(typeof c[k]==='boolean')c[k]=false;}}catch(x){}
  try{W.ado2d.refreshAppearance();}catch(x){}
  try{if(typeof W.addTicker==='function')W.addTicker(`Oyuncu değişikliği (${T.name}): ${out.name} çıkıyor, ${inP.name} giriyor.`);}catch(x){}
  try{const st2=W.ado2d.state;st2.xiKey='';}catch(x){}}
/* ---------- senaryolu goller (futbolcu, gözlemci, hakem modları) ---------- */
pl3Goal=(old=>function(T,sc,as){const S=FX;if(!S||!S.ab)return old.apply(this,arguments);ABM.fq.push({side:S.T.indexOf(T),k:sc&&sc.k||null,t:ABM.sim?ABM.sim.t:0});})(pl3Goal);
function abForceTick(S,sim){if(!ABM.fq.length){if(sim.forceGoal!=null&&!ABM.fcur)sim.forceGoal=null;return;}
  const q=ABM.fq[0];if(!ABM.fcur||ABM.fcur!==q){ABM.fcur=q;q.g0=sim.teams[abS2E(q.side)].score;q.t0=sim.t;sim.forceGoal=abS2E(q.side);const me=q.k?abFxPk(q.k):null;sim.forceBy=me&&me.ei!=null?me.ei:null;sim.forceDist=me?30:34;}
  if(sim.teams[abS2E(q.side)].score>q.g0){ABM.fq.shift();ABM.fcur=null;sim.forceGoal=null;sim.forceBy=null;return;}
  /* v177: planlanan golcü bırakılmaz (eskiden 40 sn sonra takımdan herhangi biri, oyuncumuz da, atabiliyordu); sahadan çıktıysa yeni golcü seçilir */
  if(sim.forceBy!=null){const fp=sim.players[sim.forceBy],fo=abFxP(sim.forceBy);if(!fp||fp.off||fp.team!==sim.forceGoal||!fo||(q.k&&fo.k!==q.k)){let np=null;try{if(q.k!=='ME'&&typeof v177Replan==='function')np=v177Replan(q);}catch(e){}sim.forceBy=np&&np.ei!=null?np.ei:null;}}
  if(sim.t-q.t0>70&&sim.mode==='live'&&!sim.shot){const o0=sim.ball.owner;if(!o0||o0.team!==sim.forceGoal){const fp=sim.forceBy!=null?sim.players[sim.forceBy]:null;const at=fp&&!fp.off&&fp.team===sim.forceGoal?fp:sim.players.filter(p=>p.team===sim.forceGoal&&!p.off&&p.role!=='GK').sort((a,b)=>{const g=sim.teams[sim.forceGoal].dir>0?105:0;return Math.abs(g-a.x)-Math.abs(g-b.x);})[0];if(at){try{sim._lab.setOwner(at);}catch(e){}}}}
  if(sim.t-q.t0>25&&sim.mode==='live'){const o=sim.ball.owner;if(o&&o.team===sim.forceGoal&&o.role!=='GK'&&(sim.forceBy==null||o.id===sim.forceBy)){const dir=sim.teams[o.team].dir,gx=dir>0?105:0;if(Math.abs(gx-o.x)<48){try{sim._lab.doShot(o,sim.xgAt(o.x,o.y,dir,3),3,null);}catch(e){}}}}}
/* futbolcu modu: MR (maç kaydı) motorun gerisinde kalırsa motor bekler */
function abLag(S){try{if(!S||!S.pl3||!MR||MR.fin||PL3.end||MR.min>=MR.end)return 0;return abMin()-MR.min;}catch(e){return 0;}}
function abFxPk(k){const S=ABM.fx;for(const T of S.T)for(const p of T.P)if(p.k===k&&!p.subbed&&!p.off)return p;return null;}
/* ---------- devre arası ---------- */
function abHalf(S){const W=ABM.win;if(!W)return;
  if(S.pl3||S.scr||S.ref3){setTimeout(()=>{try{if(FX===S&&W.ado2d.state.hold==='half'){W.startSecondHalf();}}catch(e){}},1400);return;}
  if(S.bsk){try{v158Half(S);}catch(e){console.warn(e);}return;}   /* v158: başkan/SD locada: devre arası seçenekleri */
  if(G.mode!=='mgr'||S.watch)return;
  try{const ho=W.document.getElementById('halftime-overlay');if(!ho||ho.querySelector('.abh-talk'))return;const ft=W.document.getElementById('ht-foot')||ho.querySelector('.bc-foot')||ho;
    const box=W.document.createElement('div');box.className='abh-talk';box.innerHTML=`<p class="abh-tk">Soyunma odası konuşması</p><div class="abh-tb">${[['sakin','Sakin ve net ol'],['ovgu','Övgü: “Böyle devam”'],['ofke','Öfke: “Bu kabul edilemez!”'],['beklenti','“Daha fazlasını bekliyorum”']].map(([k,l])=>`<button type="button" class="btn btn-ghost" data-htt="${k}">${l}</button>`).join('')}</div><p class="abh-tr" hidden></p>`;
    ft.parentNode.insertBefore(box,ft);box.addEventListener('click',ev=>{const b=ev.target.closest('[data-htt]');if(!b||box.dataset.done)return;box.dataset.done=1;const txt=abTalk(b.dataset.htt);box.querySelectorAll('button').forEach(x=>x.disabled=true);b.classList.add('btn-primary');const tr=box.querySelector('.abh-tr');tr.hidden=false;tr.textContent=txt;});}catch(e){console.warn(e);}}
function abTalk(k){const S=ABM.fx,sim=ABM.sim;const h=harm(),U=S.U,ok=Math.random()<clamp(0.5+h/120,0.2,0.9),d=S.score[0]-S.score[1];let eff=0,txt='';
  if(k==='sakin'){eff=0.02;txt='Oyuncular sakin bir şekilde ikinci yarıya hazırlanıyor.';}else if(k==='ovgu'){eff=d>=0?0.05:-0.02;txt=d>=0?'Övgü moral verdi.':'Geride olmamıza rağmen övgü pek inandırıcı gelmedi.';}
  else if(k==='ofke'){eff=d<0?(ok?0.06:-0.05):-0.04;txt=eff>0?'Sert sözlerin takımı ateşledi!':'Sert çıkışın oyuncuları gerdi.';}else{eff=ok?0.04:-0.02;txt=ok?'Oyuncular mesajı aldı.':'Mesaj pek karşılık bulmadı.';}
  for(const p of fxOn(U)){ABM.adj[p.k]=(ABM.adj[p.k]||0)+eff;if(p.ei!=null&&sim){const q=sim.players[p.ei];if(q&&q.a)for(const a of ['pac','pas','sho','fin','dri','tac','mar','posi','vis','hea'])if(q.a[a]!=null)q.a[a]=clamp(q.a[a]+eff*40,5,99);}}
  try{fxEv(45,`Devre arası konuşması: ${txt}`,'tac');}catch(e){}S.htDone=true;return txt;}
/* ---------- maç sonu ---------- */
function abFullTime(){const S=ABM.fx;if(!S||FX!==S||ABM.done)return;ABM.done=true;const sim=ABM.sim,W=ABM.win;
  try{abMirror(S,sim,W.ado2d.state,0);}catch(e){}
  S.score=[sim.teams[abS2E(0)].score,sim.teams[abS2E(1)].score];S.t=Math.max(S.t,90*60);
  try{const R=W.ado2d.state.rt;for(const T of S.T)for(const p of T.P){if(p.subbed&&ABM.rtSnap[p.k]!=null)p.rt=ABM.rtSnap[p.k];else if(p.ei!=null&&R){p.rt=clamp(R.get(p.ei)+(ABM.adj[p.k]||0),3,10);}}}catch(e){}
  if(S.pl3){S.phase='end';try{pl3Drive();}catch(e){}return;}            /* futbolcu modu: maçı MR bitirir */
  S.phase='end';
  if(ABM.ffDetach&&!(G.mode==='mgr'&&!S.watch)){abDone();return;}   /* v153: TD hızlı sonuçta da tam süre özetini görür */
  abFfUI(false);if(ABM.ffDetach)try{abSumSync(W,sim);}catch(e){}try{W.showMatchSummary(()=>abDone());const b=W.document.getElementById('summary-continue-btn');if(b)b.innerText='Devam';}catch(e){abDone();}}
function abDone(){const S=ABM.fx;cancelAnimationFrame(ABM.raf);ABM.raf=0;ABM.ff=0;ABM.ffDetach=0;abFfUI(false);
  try{const W=ABM.win;if(W){W.ado2d.state.running=false;try{W.ABH.stop();}catch(e){}try{W.stopCrowdAmbience&&W.stopCrowdAmbience();}catch(e){}try{W.sndBedStop&&W.sndBedStop(true);}catch(e){}}}catch(e){}
  if(!S||FX!==S)return;ABM.fx=null;try{fxClose();}catch(e){console.warn('fxClose',e);}}
/* ---------- hızlı sonuç (kalan dakikalar görüntüsüz oynanır) ---------- */
function abFfPrep(){const S=ABM.fx,W=ABM.win,sim=ABM.sim;if(!S||!W||!sim)return false;if(ABM.ff)return true;ABM.ff=1;
  const st=W.ado2d.state;try{W.pauseMatch();}catch(e){}st.running=false;try{st.hold=null;}catch(e){}try{if(st.vs){st.vs=null;}}catch(e){}
  ABM.ffDetach=1;const R=st.rt;sim.onEvent=function(e){try{if(R)R.onEvent(e);}catch(x){}try{abEv(e);}catch(x){}};return true;}
/* testler ve eşzamanlı ileri sarma: verilen süre kadar motoru çalıştırır */
ABM.syncRun=function(ms){const S=ABM.fx,sim=ABM.sim;if(!S||FX!==S)return 'nofx';if(!sim)return 'abwait';if(!abFfPrep())return 'abwait';const t0=performance.now();
  while(performance.now()-t0<ms&&!sim.finished){if(S.phase==='pause'||abLag(S)>2)break;for(let i=0;i<60&&!sim.finished;i++)sim.step();abTickCore();}
  abTickCore();if(sim.finished&&!ABM.done)abFullTime();return sim.finished?'abfin':S.phase==='pause'?'abpause':'abrun';};
function abToEnd(){const S=ABM.fx,W=ABM.win,sim=ABM.sim;if(!S||!W||!sim||ABM.ff)return;abFfPrep();abFfUI(true);
  const st=W.ado2d.state,R=st.rt;const run=()=>{if(FX!==S||!ABM.ff)return;const t0=performance.now();
    if(abLag(S)>2){setTimeout(run,40);return;}
    while(performance.now()-t0<28&&!sim.finished){if(S.phase==='pause'||abLag(S)>2)break;sim.step();}
    if(FX!==S||!ABM.ff||ABM.done)return;   /* v153: FULLTIME olayı adım içinde maçı kapattıysa örtüyü geri ekleme */
    abFfUI(true);
    if(!sim.finished){if(S.phase!=='pause'){/* senaryolu modlar */}setTimeout(run,0);}
    else{abFullTime();}};
  setTimeout(run,0);}
function abFfUI(on){const el=$('#fx');if(!el)return;let b=el.querySelector('#abFf');if(!on){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='abFf';el.appendChild(b);}const sim=ABM.sim;b.innerHTML=`<span class="abl-ball"></span><b>Maç sonuçlanıyor… ${sim?Math.min(90,Math.floor(sim.t*sim.C.CK/60)):0}'</b><small>${ABM.fx?`${esc(ABM.fx.U.short)} ${ABM.fx.score[0]}-${ABM.fx.score[1]} ${esc(ABM.fx.O.short)}`:''}</small>`;}
fxToEnd=(old=>function(){const S=FX;if(S&&S.ab){if(S.pl3){S.ff=true;}abToEnd();return;}return old.apply(this,arguments);})(fxToEnd);
/* eski 2B arayüz fonksiyonları Adoball ekranında boşa çalışmasın */
fxUI=(old=>function(){if(FX&&FX.ab)return;return old.apply(this,arguments);})(fxUI);
fxDraw=(old=>function(){if(FX&&FX.ab)return;return old.apply(this,arguments);})(fxDraw);
fxResize=(old=>function(){if(FX&&FX.ab)return;return old.apply(this,arguments);})(fxResize);
fxLoop=(old=>function(ts){if(FX&&FX.ab)return;return old.apply(this,arguments);})(fxLoop);
fxSecond=(old=>function(){const S=FX;if(S&&S.ab){S.half=2;S.htDone=true;try{const W=ABM.win;if(W&&W.ado2d.state.hold==='half')W.startSecondHalf();}catch(e){}S.phase='play';return;}return old.apply(this,arguments);})(fxSecond);
/* maçtan çıkış: kalan dakikalar hızlıca oynanır */
ABM.exitAsk=function(){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const d=W.document;let ov=d.getElementById('abh-exit');if(ov){ov.remove();return;}
  ov=d.createElement('div');ov.id='abh-exit';ov.innerHTML=`<div class="abh-ex"><h3>Maçtan ayrılıyor musun?</h3><p>Kalan dakikalar görüntüsüz oynanacak ve sonuç kaydedilecek.</p><div class="abh-exb"><button type="button" class="btn btn-ghost" data-x="no">Maça dön</button><button type="button" class="btn btn-primary" data-x="go">Sonucu gör</button></div></div>`;
  d.body.appendChild(ov);ov.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b&&e.target!==ov)return;ov.remove();if(b&&b.dataset.x==='go'){if(S.pl3){S.ff=true;}abToEnd();}});};
/* ---------- maç çubuğu: oyuncu değişikliği ---------- */
function abBarExtras(W){const d=W.document;const S=ABM.fx;let b=d.getElementById('abh-sub');const can=G.mode==='mgr'&&!S.watch&&!S.pl3&&!S.scr&&!S.ref3&&!S.bsk;
  if(!b){const ref=d.getElementById('btn-tactics');if(!ref)return;b=d.createElement('button');b.type='button';b.id='abh-sub';b.className=ref.className;b.innerHTML='<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-shuffle"/></svg><span class="mb-t">Değişiklik</span>';ref.parentNode.insertBefore(b,ref.nextSibling);b.addEventListener('click',()=>abSubOpen());}
  b.hidden=!can;}
function abSubOpen(sel){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const d=W.document,U=S.U;let ov=d.getElementById('abh-subov');if(!ov){ov=d.createElement('div');ov.id='abh-subov';d.body.appendChild(ov);ov.addEventListener('click',abSubClick);}
  const st=W.ado2d.state;if(st.running&&!ABM.subPz){ABM.subPz=1;try{W.pauseMatch();}catch(e){}}
  ABM.subSel=sel||ABM.subSel||null;const on=fxOn(U).sort((a,b)=>(a.ei||0)-(b.ei||0)),bench=U.bench||[],left=5-(U.subs||0);
  const rt=p=>dec(clamp(p.rt||6.5,3,10),1),cond=p=>Math.round(p.st||100);
  ov.innerHTML=`<div class="abh-sp"><header><h3>Oyuncu değişikliği</h3><span class="abh-left">${left} hak kaldı</span><button type="button" class="btn btn-ghost icon-btn" data-sx="close" aria-label="Kapat">✕</button></header>
    <div class="abh-cols"><section><h4>Sahada</h4>${on.map(p=>`<button type="button" class="abh-pl${ABM.subSel===p.k?' on':''}" data-out="${esc(p.k)}"${p.spos==='KL'&&false?' disabled':''}><span class="ps">${esc(posTag(p,U))}</span><b>${esc(p.name)}</b><i class="cd" style="--c:${cond(p)}%"></i><em>${rt(p)}</em></button>`).join('')}</section>
    <section><h4>Yedekler</h4>${bench.length?bench.map(p=>`<button type="button" class="abh-pl" data-in="${esc(p.k)}"${!ABM.subSel||left<=0?' disabled':''}><span class="ps">${esc(dpTag(p))}</span><b>${esc(p.name)}</b><em>${R200(p.ovr||'')}</em></button>`).join(''):'<p class="abh-nob">Yedek yok</p>'}</section></div>
    <footer><p>${ABM.subSel?'Şimdi oyuna girecek yedeği seç.':'Önce oyundan çıkacak oyuncuyu seç.'}</p><button type="button" class="btn btn-primary" data-sx="close">Maça dön</button></footer></div>`;ov.hidden=false;}
function abSubClick(e){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const t=e.target.closest('button');const ov=W.document.getElementById('abh-subov');
  if(!t){if(e.target===ov)abSubClose();return;}
  if(t.dataset.sx==='close'){abSubClose();return;}
  if(t.dataset.out){ABM.subSel=ABM.subSel===t.dataset.out?null:t.dataset.out;abSubOpen();return;}
  if(t.dataset.in&&ABM.subSel){const U=S.U,out=U.P.find(p=>p.k===ABM.subSel&&!p.off),inP=(U.bench||[]).find(b=>b.k===t.dataset.in);if(out&&inP&&(U.subs||0)<5){if(fxSub(U,out,inP)){ABM.subSel=null;}}abSubOpen();}}
function abSubClose(){const W=ABM.win;if(!W)return;const ov=W.document.getElementById('abh-subov');if(ov)ov.hidden=true;ABM.subSel=null;if(ABM.subPz){ABM.subPz=0;try{const st=W.ado2d.state;if(!st.sim.finished&&!st.hold)W.startMatch();}catch(e){}}}
/* ---------- ayarlar: maç motoru ---------- */
ACTX.abTog=()=>{const on=!abPref();try{localStorage.setItem('abeng',on?'1':'0');}catch(e){}toast(on?'Maçlar Adoball motoruyla oynanacak':'Maçlar eski 2B motorla oynanacak');try{const b=$('[data-act=abTog]');if(b)b.textContent=on?'Adoball':'Eski motor';}catch(e){}};
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||mc.querySelector('.ab-set')||!abAvail())return r;
  const h=`<div class="ab-set"><p class="sub-h" style="margin:14px 0 6px"><span>Maç motoru</span></p><div class="set-row" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="muted">İzlenen maçlar Adoball'ın canlı motoru ve yayın ekranıyla oynanır (top fiziği, oyuncu yapay zekâsı, VAR, tekrar)</span><button class="btn sm" data-act="abTog">${abPref()?'Adoball':'Eski motor'}</button></div></div>`;
  (mc.lastElementChild||mc).insertAdjacentHTML('beforebegin',h);}catch(e){}return r;})(openSettings);
/* Adoball maçında eski 2B adımı çalışmaz (motor sim'dir) */
fxStep=(old=>function(dt){if(FX&&FX.ab)return;return old.apply(this,arguments);})(fxStep);
/* yardımcı antrenör izlemesi (FX_W) Adoball'da da işaretlensin */
fxStart=(old=>function(o){const w=typeof FX_W!=='undefined'&&FX_W;const r=old.apply(this,arguments);try{if(FX&&FX.ab&&w){FX.watch=1;FX_W=0;}}catch(e){}return r;})(fxStart);
/* bildirimler maç ekranında Adoball'ın kendi bildirim kutusunda */
function abToast(msg){try{const W=ABM.win;if(!W)return false;const box=W.document.getElementById('toasts');if(!box)return false;const d=W.document.createElement('div');d.className='toast';d.textContent=msg;box.appendChild(d);setTimeout(()=>{if(d.parentNode)d.parentNode.removeChild(d);},Math.min(9000,2600+String(msg).length*35));return true;}catch(e){return false;}}
toast=(old=>function(t){try{if(FX&&FX.ab&&ABM.win&&$('#fx')&&!$('#fx').hidden&&abToast(t))return;}catch(e){}return old.apply(this,arguments);})(toast);
/* kenardan seslenme: motorda 10 dakikalık küçük etkiler */
const AB_SH={cesaret:{fin:3,pas:3,dri:3},iste:{pac:2,tac:3,sta:-6,mar:2},odak:{agg:-15,posi:2,mar:2},sakin:{agg:-20,tac:-2},atesle:{str:4,tac:3,agg:15},ovgu:{vis:2,pas:2,fin:2},sakla:{pas:4,dri:-2,vis:1},direkt:{lon:3,vis:3,pas:-1}};
fxShout=(old=>function(k){const S=FX;const t0=S?S.shoutT:0;const r=old.apply(this,arguments);try{if(S&&S.ab&&ABM.sim&&S.shoutT!==t0&&S.U.sh&&S.U.sh.k){abShoutApply(S.U.sh.k);}}catch(e){console.warn(e);}return r;})(fxShout);
function abShoutApply(k){const S=ABM.fx,sim=ABM.sim,E=AB_SH[k];if(!S||!sim||!E)return;abShoutEnd();const e=abS2E(0),saved=[];
  for(const q of sim.players){if(q.team!==e||q.off)continue;const o={};for(const a in E){if(q.a[a]==null)continue;o[a]=q.a[a];q.a[a]=clamp(q.a[a]+E[a],1,99);}saved.push([q,o]);}
  ABM.shout={until:sim.t+600/sim.C.CK,saved};}
function abShoutEnd(){const sh=ABM.shout;if(!sh)return;ABM.shout=null;for(const [q,o] of sh.saved)for(const a in o)q.a[a]=o[a];}
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{if(ABM.shout&&ABM.sim&&ABM.sim.t>=ABM.shout.until)abShoutEnd();}catch(e){}return r;})(abTickCore);
/* maç çubuğu: kenar (seslen / öneri) */
abBarExtras=(old=>function(W){old.apply(this,arguments);const d=W.document,S=ABM.fx;let b=d.getElementById('abh-side');const tdm=(G.mode==='mgr'||!!S.watch)&&!S.pl3&&!S.scr&&!S.ref3&&!S.bsk;
  if(!b){const ref=d.getElementById('abh-sub');if(!ref)return;b=d.createElement('button');b.type='button';b.id='abh-side';b.className=ref.className;b.innerHTML='<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-bolt"/></svg><span class="mb-t">Kenar</span>';ref.parentNode.insertBefore(b,ref.nextSibling);b.addEventListener('click',()=>abSideOpen());}
  b.hidden=!tdm;const sb=d.getElementById('abh-sub');if(sb){sb.hidden=!tdm;const t=sb.querySelector('.mb-t');if(t)t.textContent=S.watch?'Değişiklik öner':'Değişiklik';}
  const bs=d.getElementById('abh-side');if(bs){const t=bs.querySelector('.mb-t');if(t)t.textContent=S.watch?'Hocaya öner':'Kenar';}})(abBarExtras);
function abSideOpen(){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const d=W.document;let ov=d.getElementById('abh-sideov');if(!ov){ov=d.createElement('div');ov.id='abh-sideov';ov.className='abh-ovl';d.body.appendChild(ov);ov.addEventListener('click',abSideClick);}
  const w=S.watch,U=S.U,cool=S.t-(S.shoutT||-999)<240;
  ov.innerHTML=`<div class="abh-sp abh-side"><header><h3>${w?'Hocaya öneri':'Kenar çizgisi'}</h3><span class="abh-left">${w?`Hoca: ${esc(coachOf(G.club).n)}`:''}</span><button type="button" class="btn btn-ghost icon-btn" data-sx="close" aria-label="Kapat">✕</button></header>
   <div class="abh-sb"><h4>Yaklaşım</h4><div class="abh-chips">${Object.entries(TAC).map(([k,v])=>`<button type="button" class="abh-chip${U.tacK===k?' on':''}" data-tac="${k}">${esc(v.n)}</button>`).join('')}</div>
   <h4>Kenardan seslen${cool?' <small>(biraz bekle)</small>':''}</h4><div class="abh-chips">${Object.entries(FX_SHOUT).map(([k,v])=>`<button type="button" class="abh-chip" data-sh="${k}"${cool?' disabled':''} title="${esc(v[1])}">${esc(v[0])}</button>`).join('')}</div>
   ${w?'<p class="abh-note">Yardımcı antrenörsün: önerilerin hocaya gider; mantıklı bulursa uygular.</p>':''}</div>
   <footer><p>${esc(U.short)} · ${esc(TAC[U.tacK]?TAC[U.tacK].n:'Dengeli')}</p><button type="button" class="btn btn-primary" data-sx="close">Maça dön</button></footer></div>`;ov.hidden=false;}
function abSideClick(e){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const ov=W.document.getElementById('abh-sideov'),t=e.target.closest('button');if(!t){if(e.target===ov)ov.hidden=true;return;}
  if(t.dataset.sx==='close'){ov.hidden=true;return;}
  if(t.dataset.tac){const k=t.dataset.tac;if(S.watch)fxSuggest('tac',k,()=>{fxSetTi({},k);},`Yaklaşım: ${TAC[k].n}`);else{fxSetTi({},k);abTacMine(S);abToast(`Yaklaşım: ${TAC[k].n}`);}abSideOpen();return;}
  if(t.dataset.sh){const k=t.dataset.sh;if(S.watch)fxSuggest('shout',k,()=>fxShout(k),`Kenardan “${FX_SHOUT[k][0]}”`);else fxShout(k);abSideOpen();return;}}
/* teknik direktörün yaklaşım seçimi Adoball talimatlarına (mentalite / baskı) yansır */
function abTacMine(S){const W=ABM.win,sim=ABM.sim;if(!W||!sim)return;const e=abS2E(0),st=W.ado2d.state,t=Object.assign({},st.tac[e]),k=S.U.tacK;t.ment=k==='hucum'?1:k==='savunma'?-1:0;if(k==='pres'){t.press=1;}
  try{W.ado2d.tac.set(e,'ment',t.ment);if(k==='pres')W.ado2d.tac.set(e,'press',1);}catch(x){}}
/* değişiklik penceresi: yardımcı antrenör için öneri */
abSubClick=(old=>function(e){const S=ABM.fx;if(!S||!S.watch)return old.apply(this,arguments);const W=ABM.win,t=e.target.closest('button');
  if(t&&t.dataset.in&&ABM.subSel){const U=S.U,out=U.P.find(p=>p.k===ABM.subSel&&!p.off),inP=(U.bench||[]).find(b=>b.k===t.dataset.in);if(out&&inP){S.sel=out.k;fxSuggest('subin',inP.k,()=>fxSub(U,out,inP),`Değişiklik: ${out.sur||out.name} ↔ ${ksur(inP.name)}`);ABM.subSel=null;}abSubOpen();return;}
  return old.apply(this,arguments);})(abSubClick);
/* görüntüsüz (başsız) 2B maç hesapları eski motorda kalır */
fxStartHeadless=(old=>function(o){abOff++;try{return old.apply(this,arguments);}finally{abOff--;}})(fxStartHeadless);

