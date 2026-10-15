/* ================= v171: hızlı "Sonuna simüle et" (kalan dakikalar üreteçle, anında) ve seyreltilmiş YZ transferleri ================= */
/* HZ_P: Adoball motorunun (değişmemiş, v170) oyun içi kadrolarla oynanan 240 tam maçının olay günlüklerinden çıkarıldı (60 eşleşme × 4 tohum;
   ölçüm betikleri v171 çalışmasında). Gol: Poisson, log λ = a + b·tanh(güç farkı/s) + ev + önde/geride (dilim başına); diğer olaylar
   takım başına log-doğrusal oran (güç farkı = motorun teamQ farkı) ve rol payları. Motor kalibrasyonu değişirse yeniden üretilmeli. [v186] açık veri kalibrasyonlu motorla (AV_* açık) aynı 60 eşleşme × 4 tohumla yeniden üretildi (maç başı gol 5,46 → 4,15). */
const HZ_P={"v":1,"n":240,"full":1400,"goal":[0.3501,1.9299,-0.1767,-0.073,-0.2627,14],"rate":{"PASS":[5.2649,0.0027],"TACKLE":[2.0177,0.0387],"SHOTN":[2.3432,0.0486],"FOUL":[2.4004,-0.0023],"OFFSIDE":[-0.0239,-0.0106],"HEADER":[2.3497,0.0232],"CLEAR":[1.7778,-0.0362],"CLAIM":[-0.3781,-0.0534],"CORNER":[0.9935,0.058],"THROWIN":[2.2527,0.0134],"BLOCKC":[2.2708,0.0001],"INTERCEPT":[2.7991,0.0147],"gk":[1.9249,-0.0396],"to":[0.803,0.0788],"ctr":[1.6448,-0.0019]},"pacc":[0.827,0.0014,0],"poss":0.0066,"w":{"pass":[0.062,0.033,0.03,0.024,0.029,0.129,0.126,0.121,0.147,0.124,0.176],"recv":[0.001,0.021,0.027,0.022,0.019,0.129,0.133,0.116,0.204,0.132,0.197],"acc":[0.711,0.897,0.895,0.887,0.912,0.869,0.866,0.756,0.834,0.789,0.842],"cross":[0,0.004,0.003,0.003,0.001,0.014,0.013,0.111,0.046,0.144,0.039],"prog":[[23.8,12.5],[9,8.2],[11.3,8.7],[10.9,8.5],[9.3,8.4],[7.7,9.6],[7.3,9.5],[3.3,10.8],[0.3,10.8],[3.2,10.3],[-2.5,10.4]],"ic":[0.074,0.076,0.095,0.082,0.064,0.186,0.165,0.061,0.075,0.074,0.049],"icv":[0.126,0.019,0.022,0.018,0.015,0.103,0.106,0.154,0.133,0.15,0.152],"tk":[0,0.058,0.125,0.119,0.057,0.225,0.19,0.056,0.065,0.06,0.045],"tkv":[0,0.02,0.021,0.019,0.017,0.102,0.092,0.109,0.232,0.124,0.265],"fl":[0,0.025,0.056,0.037,0.022,0.223,0.179,0.094,0.158,0.092,0.113],"flv":[0.006,0.03,0.042,0.042,0.022,0.145,0.127,0.101,0.194,0.108,0.184],"ofs":[0,0.002,0.002,0.002,0,0.002,0.002,0.03,0.178,0.025,0.756],"ofs2":[0,0.021,0.002,0.004,0,0.087,0.114,0.254,0.165,0.286,0.066],"hd":[0,0.053,0.048,0.042,0.038,0.119,0.104,0.1,0.177,0.121,0.198],"hdF":[0,0,0.052,0.082,0,0.011,0.006,0.023,0.262,0.046,0.35],"clr":[0,0.115,0.19,0.191,0.115,0.145,0.128,0.031,0.034,0.039,0.011],"blc":[0,0.059,0.073,0.06,0.059,0.184,0.162,0.091,0.114,0.098,0.099],"bls":[0,0.064,0.3,0.322,0.068,0.128,0.081,0.012,0.016,0.005,0.003],"sh":[0,0,0.004,0.005,0,0.012,0.014,0.048,0.372,0.056,0.488],"gs":[0,0,0.003,0.002,0,0.017,0.006,0.025,0.431,0.038,0.478],"ga":[0,0.001,0.004,0.002,0.002,0.063,0.068,0.171,0.213,0.198,0.278],"og":[0,0.077,0.385,0.538,0,0,0,0,0,0,0],"kp":[0,0.001,0.004,0.004,0.001,0.067,0.081,0.182,0.201,0.2,0.259]},"shot":{"on":0.334,"head":0.093,"fk":0.026,"gHead":0.15,"kp":0.852,"out":{"sv":0.226,"off":0.471,"bl":0.258,"post":0.041},"onX":0.211},"xgG":[0.026,0.044,0.053,0.065,0.074,0.083,0.093,0.099,0.106,0.114,0.124,0.133,0.146,0.157,0.166,0.176,0.19,0.21,0.23,0.255,0.293,0.348,0.467,0.751],"xgN":[0.014,0.023,0.029,0.035,0.04,0.046,0.052,0.057,0.063,0.068,0.073,0.08,0.086,0.092,0.099,0.107,0.114,0.124,0.134,0.148,0.165,0.187,0.222,0.309],"gl":{"pen":0.033,"own":0.013,"ast":0.868},"fl":{"y":0.18,"y2k":0.15,"r":0.0008},"intc":0.502,"onBy":{"g":0.982,"sv":0.918,"off":0.02,"bl":0.4,"post":0.303,"none":0.52},"gOn":0.982,"possF":0.663,"st":{"passes":1.033,"tackles":1.387,"sot":0.805},"stam":[0.103,0.127,0.13,0.131,0.124,0.185,0.189,0.179,0.176,0.158,0.173]};
/*HZ_SAF_BAS — saf üreteç: oyun globali kullanmaz (Node'da da sınanır) */
/* Kalan süreyi istatistiksel olarak üretir: gol (skor durumu + güç farkı + ev), pas/şut/top kapma/faul/kart/ofsayt/kafa/uzaklaştırma
   olayları, rol paylarıyla oyunculara dağıtılır ve motorun emit() biçiminde sim.onEvent'e verilir (reyting, oyuncu istatistiği,
   şut haritası, pas ağı aynı yoldan işlenir). Takım istatistikleri (sim.teams[].st), kondisyon ve skor da güncellenir.
   o: {to: bitiş (fiziksel sn), goals: motor gol üretsin mi, home: ev sahibi motor takımı (0/1, tarafsızda -1), rnd, keep: kart görmeyecek oyuncu idleri,
       step: (t)=>false ise duraklar (kontrollü an vb.), forced: ()=>[{tm,p}] dışarıdan gelen senaryolu goller} → 'fin' | 'pause' */
function hzSynth(sim,o){
  const P=HZ_P,R=o.rnd||Math.random,CK=(sim.C&&sim.C.CK)||(5400/P.full),FULL=5400/CK,HALF=FULL/2,DT=10,RO=['GK','LB','LCB','RCB','RB','LDM','RDM','LW','AM','RW','ST'];
  const PL=sim.players,TM=sim.teams,W=P.w,TO=()=>o.to!=null?o.to:FULL,keep=o.keep||[];
  const gauss=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
  const pois=l=>{if(!(l>0))return 0;if(l>40)return Math.max(0,Math.round(l+Math.sqrt(l)*gauss()));const L=Math.exp(-l);let k=0,p=R();while(p>L){k++;p*=R();}return k;};
  const ri=q=>{const i=RO.indexOf(q.role);return i<0?8:i;};
  const onT=tm=>PL.filter(q=>q.team===tm&&!q.off);
  const pickW=(tm,w,ex)=>{const a=onT(tm).filter(q=>q!==ex);if(!a.length)return null;let s=0;const ws=a.map(q=>{const v=(w[ri(q)]||0)+(q.role==='GK'?0:1e-3);s+=v;return v;});
    if(s<=0)return a[Math.floor(R()*a.length)];let x=R()*s;for(let i=0;i<a.length;i++){x-=ws[i];if(x<=0)return a[i];}return a[a.length-1];};
  const gkOf=tm=>onT(tm).find(q=>q.role==='GK')||onT(tm)[0]||null;
  const teamQ=tm=>{let s=0;for(const q of PL){if(q.team!==tm||q.off||q.role==='GK')continue;const a=q.a||{};s+=(a.pas||60)*.25+(a.dri||60)*.2+(a.vis||60)*.15+(a.posi||60)*.1+(a.tac||60)*.15+(a.pac||60)*.15;}return s/10;};
  const qx=(arr)=>arr[Math.min(arr.length-1,Math.floor(R()*arr.length))]*(0.9+0.2*R());
  const lin=(c,dq)=>Math.exp(c[0]+c[1]*dq);
  const B=sim.ball||{x:52.5,y:34};
  function emit(type,t,x){sim.t=Math.max(sim.t,t);sim.eid=(sim.eid||0)+1;const ev={id:sim.eid,t:sim.t,type,team:-1,p:-1,p2:-1,x:B.x,y:B.y,meta:{},score:[TM[0].score,TM[1].score],hz:1};
    for(const k in x)ev[k]=x[k];ev.min=Math.floor(sim.t*CK/60);ev.tc=sim.t*CK;ev.dir=ev.team>=0?TM[ev.team].dir:0;
    try{sim.events&&sim.events.push(ev);}catch(e){}if(sim.onEvent)sim.onEvent(ev);return ev;}
  const st=tm=>TM[tm].st||(TM[tm].st={});
  const inc=(tm,k,v)=>{const s=st(tm);s[k]=(s[k]||0)+(v==null?1:v);};
  /* şut konumu: xG'den kaleye uzaklık (motor koordinatı, hücum yönüne göre) */
  const shotXY=(tm,xg,head)=>{const d=Math.max(4,Math.min(32,(head?7:9)+22*Math.pow(Math.max(0,1-xg/.5),1.6)*(0.7+0.6*R()))),v=Math.max(10,Math.min(58,34+gauss()*(5+d*.35))),dir=TM[tm].dir||1;
    return dir>0?{x:105-d,y:v}:{x:d,y:68-v};};
  function card(q,t,vic){if(!q||q.off||keep.indexOf(q.id)>=0)return;const r=R();let kind=null,second=false;
    if(r<P.fl.r)kind='R';else if(r<P.fl.r+P.fl.y*((q.yc||0)>=1?P.fl.y2k:1)){if((q.yc||0)>=1){kind='R';second=true;q.yc++;}else{kind='Y';q.yc=(q.yc||0)+1;}}
    if(!kind)return;inc(q.team,kind==='Y'?'yellow':'red');
    const gone=PL.filter(z=>z.team===q.team&&z.off).length;
    emit('CARD',t,{team:q.team,p:q.id,p2:vic?vic.id:-1,meta:{card:kind,second,yc:q.yc||0,why:second?'ikinci_sari':'faul',pen:false,men:11-gone-(kind==='R'?1:0),var:false}});
    if(kind==='R'){try{if(sim.sendOff)sim.sendOff(q.id);else q.off=true;}catch(e){q.off=true;}}}
  function shotSeq(tm,t,goal,force){const sh=force&&force.p!=null?PL[force.p]:null;let s=sh&&!sh.off&&sh.team===tm?sh:pickW(tm,goal?W.gs:W.sh);if(!s)return;
    const opp=1-tm;let pen=goal&&R()<P.gl.pen,ast=null;
    if(goal&&!force&&R()<P.gl.own){const og=pickW(opp,W.og);if(og){TM[tm].score++;emit('GOAL',t,{team:tm,p:og.id,x:TM[tm].dir>0?105.2:-.2,y:34,meta:{own:true,assist:-1,xg:0,shot:false,pen:false}});return;}}
    if(pen){const d=pickW(opp,W.fl);if(d){inc(opp,'fouls');emit('FOUL',t-4,{team:opp,p:d.id,p2:s.id,meta:{pen:true}});}}
    else if(R()<(goal?P.gl.ast:P.shot.kp)){ast=pickW(tm,goal?W.ga:W.kp,s);if(ast){inc(tm,'passes');inc(tm,'passOk');const prog=Math.max(-5,(W.prog[ri(ast)]||[5,9])[0]+gauss()*6);
      emit('PASS',t-1.6,{team:tm,p:ast.id,p2:s.id,meta:{prog,cross:ast.role==='LW'||ast.role==='RW'?R()<.35:false}});emit('PASS_OK',t-.8,{team:tm,p:s.id,p2:ast.id,meta:{prog,receiver:true}});}}
    const head=!pen&&R()<(goal?P.shot.gHead:P.shot.head),fk=!pen&&!head&&!goal&&R()<P.shot.fk,xg=pen?.76:qx(goal?P.xgG:P.xgN),out=goal?'g':(()=>{const u=R(),O=P.shot.out;return u<O.sv?'sv':u<O.sv+O.off?'off':u<O.sv+O.off+O.bl?'bl':'post';})();
    const on=pen||R()<(P.onBy[out]!=null?P.onBy[out]:.3),xy=pen?(TM[tm].dir>0?{x:94,y:34}:{x:11,y:34}):shotXY(tm,xg,head);
    inc(tm,'shots');inc(tm,'xg',xg);if(on)inc(tm,'sot',P.st.sot);
    emit('SHOT',t-.3,{team:tm,p:s.id,x:xy.x,y:xy.y,meta:{xg,on,tag:pen?'PEN':head?'HEAD':fk?'FK':null}});
    if(goal){TM[tm].score++;emit('GOAL',t,{team:tm,p:s.id,x:TM[tm].dir>0?105.2:-.2,y:34,meta:{own:false,assist:ast&&!pen?ast.id:-1,xg,shot:true,dist:Math.round(Math.abs((TM[tm].dir>0?105:0)-xy.x)),pen}});}
    else if(out==='sv'){const g=gkOf(opp);if(g){inc(opp,'saves');emit('SAVE',t,{team:opp,p:g.id,p2:s.id,meta:{xg,parry:R()<.5}});}}
    else if(out==='bl'){const b=pickW(opp,W.bls);if(b)emit('BLOCK',t,{team:opp,p:b.id,p2:s.id,meta:{xg}});}
    else if(out==='post')emit('POST',t,{team:tm,p:s.id,meta:{xg}});
    else emit('OFF',t,{team:tm,p:s.id,meta:{xg}});}
  function pass(tm,t,acc){const a=pickW(tm,W.pass);if(!a)return;const ok=R()<Math.min(.98,Math.max(.3,(W.acc[ri(a)]||.85)+acc)),cross=R()<(W.cross[ri(a)]||0);inc(tm,'passes',P.st.passes);
    const b=ok?pickW(tm,W.recv,a):null,pr=W.prog[ri(a)]||[5,9],prog=pr[0]+gauss()*pr[1];
    emit('PASS',t,{team:tm,p:a.id,p2:b?b.id:-1,meta:{prog,cross}});
    if(b){inc(tm,'passOk');emit('PASS_OK',t+.6,{team:tm,p:b.id,p2:a.id,meta:{prog,receiver:true}});}
    else if(R()<P.intc){const c=pickW(1-tm,W.ic);if(c){inc(1-tm,'inter');emit('INTERCEPT',t+.6,{team:1-tm,p:c.id,p2:a.id,meta:{}});}}}
  while(sim.t<TO()-1e-6){
    const t0=sim.t,t1=Math.min(TO(),t0+DT),dt=t1-t0,f=dt/FULL;
    if(sim.half===1&&!sim.halfBreak&&t1>=HALF){sim.halfBreak=true;sim.half=2;try{TM.forEach(T=>{T.dir=-T.dir;});}catch(e){}emit('HALFTIME',HALF,{});}
    const L=[];
    const fq=o.forced?o.forced():[];for(const g of fq)L.push([t0+.5,()=>shotSeq(g.tm,sim.t+.3,true,g)]);
    const q0=teamQ(0),q1=teamQ(1);
    for(const tm of [0,1]){const dq=tm===0?q0-q1:q1-q0,d=TM[tm].score-TM[1-tm].score,Rt=P.rate,at=()=>t0+R()*dt;
      if(o.goals){const g=P.goal,lam=Math.exp(g[0]+g[1]*Math.tanh(dq/g[5])+g[2]*(o.home===tm?1:0)+g[3]*(d>0?1:0)+g[4]*(d<0?1:0))*f;for(let n=pois(lam);n>0;n--)L.push([at(),()=>shotSeq(tm,sim.t,true)]);}
      for(let n=pois(lin(Rt.SHOTN,dq)*f);n>0;n--)L.push([at(),()=>shotSeq(tm,sim.t,false)]);
      const acc=P.pacc[1]*dq;for(let n=pois(Math.max(0,lin(Rt.PASS,dq)-lin(Rt.SHOTN,dq)*P.shot.kp-1.4*P.gl.ast)*f);n>0;n--){const t=at();L.push([t,()=>pass(tm,t,acc)]);}
      for(let n=pois(lin(Rt.TACKLE,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.tk),v=pickW(1-tm,W.tkv);if(a){inc(tm,'tackles',P.st.tackles);emit('TACKLE',sim.t,{team:tm,p:a.id,p2:v?v.id:-1,meta:{}});}}]);
      for(let n=pois(lin(Rt.FOUL,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.fl),v=pickW(1-tm,W.flv);if(a){inc(tm,'fouls');emit('FOUL',sim.t,{team:tm,p:a.id,p2:v?v.id:-1,meta:{}});card(a,sim.t+.5,v);}}]);
      for(let n=pois(lin(Rt.OFFSIDE,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.ofs),b=pickW(tm,W.ofs2,a);if(a){inc(tm,'offsides');emit('OFFSIDE',sim.t,{team:tm,p:a.id,p2:b?b.id:-1});}}]);
      for(let n=pois(lin(Rt.HEADER,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.hd);if(a)emit('HEADER',sim.t,{team:tm,p:a.id,meta:{inFront:R()<(W.hdF[ri(a)]||0),won:true}});}]);
      for(let n=pois(lin(Rt.CLEAR,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.clr);if(a)emit('CLEAR',sim.t,{team:tm,p:a.id,meta:{}});}]);
      for(let n=pois(lin(Rt.BLOCKC,dq)*f);n>0;n--)L.push([at(),()=>{const a=pickW(tm,W.blc);if(a)emit('BLOCK',sim.t,{team:tm,p:a.id,p2:-1,meta:{cross:true,kind:'pass'}});}]);
      for(let n=pois(lin(Rt.CLAIM,dq)*f);n>0;n--)L.push([at(),()=>{const g=gkOf(tm);if(g)emit('CLAIM',sim.t,{team:tm,p:g.id});}]);
      for(let n=pois(lin(Rt.CORNER,dq)*f);n>0;n--)L.push([at(),()=>{inc(tm,'corners');emit('CORNER',sim.t,{team:tm});}]);
      for(let n=pois(lin(Rt.THROWIN,dq)*f);n>0;n--)L.push([at(),()=>{inc(tm,'throwins');emit('THROWIN',sim.t,{team:tm,meta:{}});}]);
      inc(tm,'goalkicks',pois(lin(Rt.gk,dq)*f));inc(tm,'takeOns',pois(lin(Rt.to,dq)*f));inc(tm,'ctr',pois(lin(Rt.ctr,dq)*f));
      for(const q of PL)if(q.team===tm&&!q.off&&q.stam!=null)q.stam=Math.max(.3,q.stam-(P.stam[ri(q)]||.18)/1000*dt);}
    /* topa sahip olma: güç farkına göre pay */
    {const sh=1/(1+Math.exp(-P.poss*(q0-q1)));inc(0,'poss',dt*P.possF*sh);inc(1,'poss',dt*P.possF*(1-sh));}
    L.sort((a,b)=>a[0]-b[0]);for(const [t,fn] of L){sim.t=Math.max(sim.t,Math.min(t1,t));try{fn();}catch(e){}}
    sim.t=t1;
    if(o.step&&o.step(sim.t)===false)return 'pause';}
  for(const T of TM){const s=T.st;if(s)for(const k of ['sot','passes','tackles','goalkicks','takeOns','ctr'])if(s[k]!=null)s[k]=Math.round(s[k]);}
  return 'fin';}
/*HZ_SAF_SON*/
/* ---------- oyun katmanı: "Sonuna simüle et" kalan dakikaları üreteçle bitirir ----------
   Eskiden kalan dakikalar tam fizik + yapay zekâ ile adım adım oynanıyordu (maç başına ~10 sn, telefonda daha uzun; futbolcu modunda
   MR beklemesi ve arka plan sekmede RAF durunca takılma). Şimdi abToEnd kalan süreyi hzSynth ile 10 sn'lik (fiziksel) dilimlerde üretir;
   her dilimden sonra abTickCore çalışır (MR/futbolcu modu, senaryolu goller, rakip hoca, hakem, aynı yol), kontrollü an açılırsa bekler.
   Kapatmak için: localStorage.hzff='0' (eski tam simülasyon). */
function hzOn(){try{return localStorage.getItem('hzff')!=='0';}catch(e){return true;}}
function hzWait(S){try{return !!(S&&S.pl3&&(PL3.mom||(MR&&MR.pendKnock)||S.phase==='pause'));}catch(e){return false;}}
/* futbolcu modunda MR'nin uzatma dakikası kadar motor da sürer (eski holdEnd davranışı) */
function hzEnd(S,sim){const CK=sim.C.CK,F=5400/CK;try{if(S.pl3&&MR&&!MR.fin&&MR.end>90)return Math.min(F+30*60/CK,MR.end*60/CK);}catch(e){}return F;}
function hzForced(sim){const q=ABM.fq||[];if(!q.length)return [];ABM.fq=[];ABM.fcur=null;try{sim.forceGoal=null;sim.forceBy=null;}catch(e){}
  return q.map(x=>{const me=x.k?abFxPk(x.k):null;return {tm:abS2E(x.side),p:me&&me.ei!=null?me.ei:null};});}
function hzToEnd(){const S=ABM.fx,W=ABM.win,sim=ABM.sim;if(!S||!W||!sim||ABM.ff)return false;if(!abFfPrep())return false;
  ABM.hz=1;abFfUI(true);const t0=performance.now();ABM.hzT0=t0;
  let keep=[];try{if(S.pl3&&!(typeof PRO!=='undefined'&&PRO.on)){const me=pl3Me();if(me&&me.ei!=null)keep=[me.ei];}}catch(e){}   /* oyuncumuzun kartı MR'den gelir */
  const o={goals:!sim.noGoal,home:S.o&&S.o.neutral?-1:0,keep,forced:()=>hzForced(sim),
    step:()=>{if(FX!==S||!ABM.ff||ABM.done)return false;try{abTickCore();}catch(e){console.warn('hz tick',e);}o.to=hzEnd(S,sim);return !hzWait(S);}};
  const fin=()=>{if(FX!==S||!ABM.ff||ABM.done)return;
    /* son dilimde gelen senaryolu goller */
    const left=hzForced(sim);if(left.length){o.to=sim.t+1;o.forced=()=>left.splice(0);try{hzSynth(sim,o);}catch(e){}o.forced=()=>hzForced(sim);}
    sim.finished=true;ABM.hzMs=Math.round(performance.now()-t0);
    try{W.ado2d.flush&&W.ado2d.flush();}catch(e){}   /* çerçevenin reyting listesi ve maç sonu özeti (eskiden 700 ms'lik döngü yazıyordu) */
    try{sim.eid=(sim.eid||0)+1;const ev={id:sim.eid,t:sim.t,type:'FULLTIME',team:-1,p:-1,p2:-1,x:52.5,y:34,meta:{},score:[sim.teams[0].score,sim.teams[1].score],min:Math.floor(sim.t*sim.C.CK/60),tc:sim.t*sim.C.CK,dir:0,hz:1};
      try{sim.events.push(ev);}catch(e){}if(sim.onEvent)sim.onEvent(ev);}catch(e){console.warn('hz bitiş',e);}
    if(!ABM.done){try{abFullTime();}catch(e){console.warn(e);}}};
  const run=()=>{if(FX!==S||!ABM.ff||ABM.done)return;if(hzWait(S)){setTimeout(run,150);return;}
    o.to=hzEnd(S,sim);let r='fin';try{r=hzSynth(sim,o);}catch(e){console.warn('hızlı sonuç',e);}
    if(FX!==S||!ABM.ff||ABM.done)return;
    if(r==='pause'){abFfUI(true);setTimeout(run,hzWait(S)?150:0);return;}
    fin();};
  setTimeout(run,30);   /* örtü ("Maç sonuçlanıyor…") bir kare görünsün */
  return true;}
abToEnd=(old=>function(){if(hzOn()&&!ABM.ff){let ok=false;try{ok=hzToEnd();}catch(e){console.warn('hızlı sonuç',e);ok=!!ABM.ff;}if(ok)return;}return old.apply(this,arguments);})(abToEnd);
/* hızlı sonuçta motor zorla şut çektirmesin (senaryolu goller doğrudan işlenir) */
abForceTick=(old=>function(){if(ABM.hz)return;return old.apply(this,arguments);})(abForceTick);
abSetup=(old=>function(){ABM.hz=0;return old.apply(this,arguments);})(abSetup);
abDone=(old=>function(){ABM.hz=0;return old.apply(this,arguments);})(abDone);

/* ---------- YZ transferleri: iki günde bir, iki günün işi birlikte ----------
   Transfer döneminde her gün çalışan aiTransfers (+ v161 kiralıkları) gün ilerlemesinin yarısını yiyordu. Artık günler sayılır,
   HZ_AI_N günde bir (ve dönemin son günü mutlaka) birikmiş gün sayısı kadar çalıştırılır: sezon başına transfer sayısı aynı kalır.
   Toplu çalışmada lig kulüp listeleri (leagueClubs) ve kulüp dizisi önbellekten gelir (aiLC/aiClubs, 092). */
const HZ_AI_N=2;
aiTransfers=(old=>function(){if(!G||!G.s||!G.s.cal||G.phase!=='season')return old.apply(this,arguments);
  let last=false;try{last=!twOpenAt(G.s.day+1);}catch(e){last=true;}
  G.s.aiq=(G.s.aiq||0)+1;if(G.s.aiq<HZ_AI_N&&!last)return;
  const k=Math.min(4,G.s.aiq);G.s.aiq=0;const own=!AITX_LC;if(own){AITX_LC={};AITX_CV=null;HZ_SQ={};}
  try{for(let i=0;i<k;i++)old.apply(this,arguments);}finally{if(own){AITX_LC=null;AITX_CV=null;HZ_SQ=null;}}})(aiTransfers);
/* toplu çalışmada kadro önbelleği: aynı gün içinde aynı kulübün kadrosu bir kez kurulur; her transfer/kiralık (txNote) ve güç güncellemesinden
   (syncStr) sonra önbellek boşaltılır. Önbellekten dönen dizi kopyadır (syncStr sıralayarak değiştiriyor). */
let HZ_SQ=null;
squadOf=(old=>function(id){if(HZ_SQ&&arguments.length===1){const c=HZ_SQ[id];if(c)return c.slice();const r=old.apply(this,arguments);if(Array.isArray(r))HZ_SQ[id]=r.slice();return r;}return old.apply(this,arguments);})(squadOf);
txNote=(old=>function(){if(HZ_SQ)HZ_SQ={};return old.apply(this,arguments);})(txNote);
syncStr=(old=>function(){const r=old.apply(this,arguments);if(HZ_SQ)HZ_SQ={};return r;})(syncStr);
