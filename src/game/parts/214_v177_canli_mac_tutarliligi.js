/* ================= v177: canlı 3B futbolcu maçında tek gol defteri — skor, anlatım, motor olayları, golcü/asist, maç sonu ve lig istatistiği birebir ================= */
/* Futbolcu kariyerinin 3B (Adoball) maçında goller MR'de (maç anlatımı) doğar, motor onları "zorla gol" ile canlandırır (106/113).
   Eskiden: (1) golcü adayı 40 sn'de topa ulaşamazsa takımdan herhangi biri (oyuncumuz da) atabiliyordu, MR "0 gol" derken çerçevede oyuncumuzun golü;
   (2) MR'nin son dakikalardaki golü motor bitmeden gerçekleşmezse (ya da "Sonuna simüle et"ten sonra MR bitişe koşarken doğarsa) motor skoru
   MR'den geride kalıyor (MR 3-3, motor 3-2), maç sonu kaydı tutmadığı için lig istatistiği eski rastgele dağıtıma düşüyordu.
   Şimdi tek kaynak V177.led (gol defteri): her MR golü planlandığı anda deftere yazılır (taraf, dakika, golcü, oyuncumuzun golü/asisti, anlatım satırı).
   - Motorun GOAL olayı çerçeveye ve oyuna ulaşmadan (sim.onEvent önünde) deftere bağlanır: golcü/asist planlanan oyuncuya çevrilir,
     oyuncumuza planlanmamış gol/asist yazılmaz. Çerçevenin skor/olay listesi, FX (abEv, 206 FX.gl) ve anlatım aynı golcüyü görür.
   - Anlatımdaki gol satırının adı ve dakikası motorun golüyle eşitlenir (206 v172PlFeed'in "en eski satır" tahmini yerine defterdeki satır).
   - Planlanmamış motor golü (olmamalı) MR'ye eklenir; MR bittikten sonra gelirse yok sayılır.
   - Maç bitiminde defterde bekleyen gol varsa motor bir süre daha oynar (holdEnd); yetişmezse ya da hızlı sonuçta gol aynı olay yoluyla üretilir.
     Kapanışta skor MR ile karşılaştırılır; tutmazsa FX skoru ve gol listesi defterden kurulur (son güvence).
   - Çerçeve maçı yeniden kurarsa (yeni sim) süre, devre, yönler, skor, istatistik ve oyundan atılanlar yeni sime taşınır.
   - "Maç sonu" düğmesi 3B kapanmadan basılırsa önce kapanış (defter + FX anlık görüntüsü) yapılır.
   Pro modunda goller zaten motordan MR'ye akar (120); defter orada kapalıdır. */
const V177={led:[],fd:{gu:0,go:0,q:[[],[]]},mid:-1,rb:0,w0:0,force:0,rec:0,log:[]};
window.V177=V177;
const V177_WAIT=9000;   /* MR bitince bekleyen golü motorun canlandırması için en çok bekleme (ms) */
function v177On(){try{const S=FX;return !!(S&&S.ab&&S.pl3&&ABM.fx===S&&MR&&MR.f3&&!MR.pro&&!(typeof PRO!=='undefined'&&PRO.on)&&V177.mid===PL3.mid);}catch(e){return false;}}
const v177Pend=()=>V177.led.filter(L=>!L.done).length;
/* her maçın başında defter sıfırlanır */
pl3Start=(old=>function(cfg){const r=old.apply(this,arguments);try{if(MR&&MR.f3){Object.assign(V177,{led:[],fd:{gu:MR.gu||0,go:MR.go||0,q:[[],[]]},mid:PL3.mid,rb:0,w0:0,force:0,rec:0,settled:0,log:[]});}}catch(e){}return r;})(pl3Start);
/* anlatım: MR'nin skoru her arttığında yazdığı satır o golün satırıdır */
feed=(old=>function(m,txt,cls){const r=old.apply(this,arguments);try{if(MR&&MR.f3&&!MR.pro&&V177.mid===PL3.mid){const li=($('#mvFeed')||{}).firstElementChild||null,F=V177.fd;
    while(F.gu<MR.gu){F.gu++;F.q[0].push(li);}while(F.go<MR.go){F.go++;F.q[1].push(li);}}}catch(e){}return r;})(feed);
/* takım arkadaşı / rakip golcü: sahadaki oyunculardan mevki ağırlığıyla (oyuncumuz hariç) */
function v177PickSc(side,ex){try{const S=FX,T=S.T[side];const on=fxOn(T).filter(p=>p.k!=='ME'&&p.spos!=='KL'&&p.pos!=='KL'&&p.ei!=null&&!p.subbed&&p!==ex);
    if(!on.length)return null;return wpick(on.map(p=>[p,(GWP[p.pos]||0.1)]));}catch(e){return null;}}
function v177ByK(side,k){try{if(!k)return null;const T=FX.T[side];return T.P.find(p=>p.k===k&&!p.subbed&&!p.off)||T.P.find(p=>p.k===k)||null;}catch(e){return null;}}
const v177Nm=(side,k)=>{const p=v177ByK(side,k);return p?p.name:(k==='ME'?meN():'');};
/* anlatım satırı: golcü adı ve (motor golü olunca) dakika */
function v177FeedSet(L){try{const li=L.li;if(!li||!li.isConnected)return;li.dataset.v172g='1';const sp=li.querySelector('span'),it=li.querySelector('i');if(!sp)return;
    if(li.__v177h==null)li.__v177h=sp.innerHTML;let h=li.__v177h;
    if(L.k&&L.k!=='ME'&&!L.me){const nm=esc(v177Nm(L.s,L.k));if(nm){
      h=h.replace(/^(GOL! .+? — ).+?( ağları buldu\.)$/,`$1${nm}$2`).replace(/^(Penaltıyı ).+?( kullandı: GOL!)$/,`$1${nm}$2`).replace(/^(.+? pasında ).+?( golü attı! ASİST\.)$/,`$1${nm}$2`)
        .replace(/^[^!]+? golü attı\.$/,`${nm} golü attı.`).replace(/takım arkadaşı attı/,`${nm} attı`)
        .replace(/^(Gol\. .+? — ).+?( skoru değiştirdi\.)$/,`$1${nm}$2`).replace(/^Rakip golü buldu\.$/,`Rakip golü buldu: ${nm}.`);}}
    if(sp.innerHTML!==h)sp.innerHTML=h;
    if(it&&L.mm)it.textContent=L.mm+'’';}catch(e){}}
/* plan: MR golü motora gönderilirken deftere yazılır (106 pl3Sync → 206 golcü seçimi → 113 kuyruk) */
pl3Goal=(old=>function(T,sc,as,meta){if(!v177On())return old.apply(this,arguments);const S=FX,side=S.T.indexOf(T);meta=meta||{};
  if(side===1&&!sc)sc=v177PickSc(1);                       /* rakip golcü de baştan planlanır (motor onu zorlar) */
  const q0=(ABM.fq||[]).length;const r=old.call(this,T,sc,as);const q=ABM.fq&&ABM.fq.length>q0?ABM.fq[ABM.fq.length-1]:null;
  try{const li=V177.fd.q[side<0?0:side].shift()||null;let m=MR.min;try{const t=li&&li.querySelector('i');const v=t&&parseInt(t.textContent,10);if(v>0)m=v;}catch(e){}
    const L={s:side,m,k:meta.mine?'ME':(q&&q.k)||(sc&&sc.k)||null,ak:meta.asst?'ME':null,me:!!meta.mine,as:!!meta.asst,done:false,li};
    if(q){q.v177=L;if(meta.mine)q.k='ME';}V177.led.push(L);v177FeedSet(L);}catch(e){console.warn('v177 plan',e);}
  return r;})(pl3Goal);
/* 113 abForceTick: planlanan golcü sahadan çıktıysa ya da ~3 dk'da bitiremezse yeni golcü (near: o an kaleye en yakın arkadaş); anlatım satırı da değişir */
function v177Near(side){try{const S=FX,sim=ABM.sim,te=abS2E(side),gx=sim.teams[te].dir>0?105:0;const c=fxOn(S.T[side]).filter(p=>p.k!=='ME'&&p.spos!=='KL'&&p.pos!=='KL'&&p.ei!=null&&!p.subbed&&sim.players[p.ei]&&!sim.players[p.ei].off);
    return c.sort((a,b)=>Math.abs(gx-sim.players[a.ei].x)-Math.abs(gx-sim.players[b.ei].x))[0]||null;}catch(e){return null;}}
function v177Replan(q,near){const L=q&&q.v177;const p=(near?v177Near(q.side):null)||v177PickSc(q.side);if(p){q.k=p.k;if(L&&!L.done&&!L.me){L.k=p.k;v177FeedSet(L);}}return p;}
/* planlanmamış motor golü: MR'ye eklenir (MR bittiyse null → olay yok sayılır) */
function v177Adopt(side,e){if(!MR||MR.fin||PL3.end)return null;const S=FX,m=e.meta||{};let p=abFxP(e.p);if(!p||m.own||p.T!==S.T[side]||p.k==='ME')p=v177PickSc(side);
  if(side===0){MR.gu++;PL3.gu=MR.gu;}else{MR.go++;PL3.go=MR.go;}
  const nm=esc(p?p.name:'');try{feed(Math.min(MR.min,MR.end),side===0?`GOL! ${esc(MR.us.name)} — ${nm} ağları buldu.`:`Gol. ${esc(MR.opp.name)} — ${nm} skoru değiştirdi.`,side===0?'us':'opp');}catch(x){}
  const L={s:side,m:MR.min,k:p?p.k:null,ak:null,me:false,as:false,done:false,adopt:1,li:V177.fd.q[side].shift()||null};V177.led.push(L);V177.log.push('adopt '+side);
  try{renderBoard();pl3Hud();}catch(x){}return L;}
/* motor GOAL olayı → defter (çerçeve ve oyun olayı görmeden önce) */
function v177Pre(e){if(!e||e.__v177p||e.type!=='GOAL')return;e.__v177p=1;if(!v177On()||(e.team!==0&&e.team!==1))return;
  const S=FX,sim=ABM.sim,side=abE2S(e.team),m=e.meta||(e.meta={});
  let L=V177.led.find(x=>!x.done&&x.s===side);
  if(!L){L=v177Adopt(side,e);if(!L){e.__v177drop=1;try{sim.teams[e.team].score=Math.max(0,sim.teams[e.team].score-1);}catch(x){}V177.log.push('drop '+side);return;}}
  L.done=true;e.__v177e=L;
  let sp=L.k?abFxPk(L.k):null;
  if(!sp&&L.k!=='ME'){const mp=abFxP(e.p);sp=mp&&mp.T===S.T[side]&&mp.k!=='ME'&&!m.own?mp:v177PickSc(side);if(sp)L.k=sp.k;}
  if(sp&&sp.ei!=null){e.p=sp.ei;}
  m.own=false;
  if(L.as){const me=pl3Me();m.assist=me&&me.ei!=null&&me.ei!==e.p?me.ei:-1;}
  else{const a=m.assist!=null&&m.assist>=0?abFxP(m.assist):null;if(!a||a.k==='ME'||a.T!==S.T[side]||a.ei===e.p)m.assist=-1;}}
/* gol/kart olayına o anki oyuncu adı (yuvaya sonradan giren oyuncunun adı 206 v172FrameSync'te gole yazılmasın) */
function v177Nm0(sim,e){if(!e||e.__nm!=null||(e.type!=='GOAL'&&e.type!=='CARD'))return;const P=sim.players||[],q=e.p>=0?P[e.p]:null,m=e.meta||{};e.__nm=q?q.name:'';
  if(e.type==='GOAL'){const a=m.assist!=null&&m.assist>=0?P[m.assist]:null;e.__an=a?a.name:'';}}
/* sim.onEvent önüne kanca: kim atarsa atsın (çerçeve, abHook, hızlı sonuç, hzSynth) GOAL önce deftere uğrar */
function v177Wrap(sim){if(!sim||sim.__v177)return;let fn=sim.onEvent;
  try{Object.defineProperty(sim,'onEvent',{configurable:true,enumerable:true,
    get(){const f=fn;if(!f)return f;return function(e){try{v177Pre(e);v177Nm0(sim,e);}catch(x){console.warn('v177 olay',x);}if(e&&e.__v177drop)return;return f.apply(this,arguments);};},
    set(v){fn=v;}});sim.__v177=1;}catch(e){}}
/* olay işlendikten sonra: FX istatistiği, 206 FX.gl ve skorer listesi defterdeki golcüye; anlatım satırı */
abEv=(old=>function(e){const r=old.apply(this,arguments);try{const L=e&&e.__v177e;if(L&&e.type==='GOAL'&&!L.post){L.post=1;v177Post(e,L);}}catch(x){console.warn('v177 gol',x);}return r;})(abEv);
function v177Post(e,L){const S=ABM.fx;if(!S)return;const side=L.s,m=e.meta||{},gl=(S.gl||[])[S.gl?S.gl.length-1:-1];const G0=gl&&gl.s===side?gl:null;
  const got=abFxP(e.p),want=L.k==='ME'?S.U.P.find(p=>p.k==='ME')||null:v177ByK(side,L.k);
  if(want&&got!==want){if(got&&got.s)got.s.g=Math.max(0,(got.s.g||0)-1);want.s.g=(want.s.g||0)+1;if(side===0&&S.scorers&&S.scorers.length)S.scorers[S.scorers.length-1]=want.k;}
  if(G0&&want){G0.k=want.k;G0.n=want.name;G0.own=false;G0.cid=S.T[side].id;}
  if(L.as){const me=S.U.P.find(p=>p.k==='ME');const ga=m.assist!=null&&m.assist>=0?abFxP(m.assist):null;if(me&&ga!==me){if(ga&&ga.s)ga.s.as=Math.max(0,(ga.s.as||0)-1);me.s.as=(me.s.as||0)+1;}if(G0){G0.ak='ME';G0.an=me?me.name:meN();}}
  L.mm=G0?G0.m:Math.max(1,Math.floor((e.t!=null?e.t:ABM.sim.t)*ABM.sim.C.CK/60));L.ak=G0?G0.ak:L.ak;
  v177FeedSet(L);}
/* 206: anlatım satırı bağlama defterde */
v172PlFeed=(old=>function(){if(v177On())return;return old.apply(this,arguments);})(v172PlFeed);
/* bekleyen gol varken motor maçı bitirmez (113 holdEnd) */
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const sim=ABM.sim;if(sim&&v177On()&&v177Pend()&&!sim.finished)sim.holdEnd=true;}catch(e){}return r;})(abTickCore);
/* bekleyen golleri motorun olay yoluyla üret (hızlı sonuç, süre doldu, sim bitti) */
function v177Synth(){const S=FX,sim=ABM.sim;if(!S||!sim)return 0;let n=0;const CK=(sim.C&&sim.C.CK)||1;
  for(const L of V177.led.slice()){if(L.done)continue;const te=abS2E(L.s);const sp=L.k?abFxPk(L.k):null,me=L.as?pl3Me():null,t=(Math.max(1,L.m)*60+30)/CK;   /* dakika = MR'deki gol dakikası */
    sim.teams[te].score++;sim.eid=(sim.eid||0)+1;const dir=sim.teams[te].dir||1;
    const ev={id:sim.eid,t,type:'GOAL',team:te,p:sp&&sp.ei!=null?sp.ei:-1,p2:-1,x:dir>0?105.2:-.2,y:34,meta:{own:false,assist:me&&me.ei!=null?me.ei:-1,xg:0.3,shot:true,dist:12,pen:false,v177:1},
      score:[sim.teams[0].score,sim.teams[1].score],min:L.m,tc:t*CK,dir,hz:1};
    try{sim.events&&sim.events.push(ev);}catch(e){}try{if(sim.onEvent)sim.onEvent(ev);}catch(e){console.warn('v177 üretim',e);}
    if(!L.done){L.done=true;}n++;}
  if(n)V177.log.push('synth '+n);return n;}
/* kapanışta son güvence: skor ve gol listesi defterden */
function v177Settle(){if(!v177On())return;const S=FX;
  try{const n0=V177.led.filter(L=>L.s===0).length,n1=V177.led.filter(L=>L.s===1).length;if(MR&&(MR.gu>n0||MR.go>n1))pl3Sync();}catch(e){}
  let n=0;try{n=v177Synth();}catch(e){console.warn('v177',e);}
  try{const sim=ABM.sim;ABM.fq=[];ABM.fcur=null;if(sim){sim.forceGoal=null;sim.forceBy=null;}}catch(e){}   /* defter kapandı: motor artık gol zorlamaz */
  /* üretilen gol çerçevenin tabelasına da (hızlı sonuçta çerçeve döngüsü durmuş olur) */
  if(n){try{const sim=ABM.sim,W=ABM.win,d=W.document,st=W.ado2d.state;if(st)st.scHold=null;const sh=d.getElementById('score-home'),sa=d.getElementById('score-away');if(sh)sh.textContent=String(sim.teams[0].score);if(sa)sa.textContent=String(sim.teams[1].score);}catch(e){}
    try{if(ABM.ff){S.score=[ABM.sim.teams[abS2E(0)].score,ABM.sim.teams[abS2E(1)].score];abFfUI(true);}if(ABM.ff||V177.force)v172FrameSync();}catch(e){}}   /* hızlı sonuçta (ya da hemen kapanışta) çerçeve olayı işleyemez: Olaylar listesi 206 ile eşitlenir */
  try{const sim=ABM.sim;if(sim)S.score=[sim.teams[abS2E(0)].score,sim.teams[abS2E(1)].score];}catch(e){}
  const want=[MR.gu,MR.go],gl=S.gl||[];
  const ok=S.score[0]===want[0]&&S.score[1]===want[1]&&gl.filter(g=>g.s===0).length===want[0]&&gl.filter(g=>g.s===1).length===want[1];
  if(!ok){V177.rec=1;V177.log.push('uzlaştırma '+S.score.join('-')+' → '+want.join('-'));console.warn('v177 uzlaştırma',S.score,want);
    S.score=want.slice();S.gl=V177.led.map(L=>({s:L.s,m:L.mm||L.m,k:L.k,n:v177Nm(L.s,L.k),cid:S.T[L.s].id,own:false,pen:false,ak:L.ak||null,an:L.ak?v177Nm(L.s,L.ak):null}));
    for(const T of S.T)for(const p of T.P){p.s.g=0;p.s.as=0;}
    for(const L of V177.led){const a=v177ByK(L.s,L.k);if(a)a.s.g++;const b=L.ak?v177ByK(L.s,L.ak):null;if(b)b.s.as=(b.s.as||0)+1;}
    try{S.scorers=V177.led.filter(L=>L.s===0).map(L=>L.k);}catch(e){}}
  return n;}
/* kapanış: bekleyen gol varsa motor biraz daha oynar, sonra defterle kapanır */
pl3Close=(old=>function(mid){try{if(!PL3.closed&&(mid==null||mid===PL3.mid)&&v177On()){const sim=ABM.sim,now=performance.now();if(!V177.w0)V177.w0=now;
      if(!V177.force&&v177Pend()&&sim&&!sim.finished&&!ABM.ff&&now-V177.w0<V177_WAIT){setTimeout(()=>pl3Close(mid),250);return;}
      if(!V177.settled){V177.settled=1;const n=v177Settle();
        /* canlı izlerken üretilen gol çerçevenin skor tabelasında da görünsün (bir kare çizilsin), sonra kapanır */
        if(n&&!V177.rec&&!V177.force&&!ABM.ff){setTimeout(()=>pl3Close(mid),1500);return;}}}}catch(e){console.warn('v177 kapanış',e);}
  return old.apply(this,arguments);})(pl3Close);
/* "Maç sonu" 3B kapanmadan basılırsa önce kapanış (lig kaydı defter + FX görüntüsünden) */
mrFinish=(old=>function(){const pl=!!(MR&&MR.f3);const r=old.apply(this,arguments);
  try{if(pl){const d=$('#mvDone'),oc=d&&d.onclick;if(oc&&!oc.__v177){const f=function(){if(!MR)return;try{if(PL3.on&&!PL3.closed){V177.force=1;pl3Close(PL3.mid);}}catch(e){console.warn(e);}return oc.apply(this,arguments);};f.__v177=1;d.onclick=f;}}}catch(e){}
  return r;})(mrFinish);
/* çerçeve maçı yeniden kurarsa (yeni sim): durum taşınır */
abHook=(old=>function(){const W=ABM.win;let s1=null;try{s1=W&&W.ado2d&&W.ado2d.sim();}catch(e){}const s0=ABM.sim;if(s1&&s1!==s0)v177Wrap(s1);
  const r=old.apply(this,arguments);
  try{const S=ABM.fx;if(s0&&s1&&s1!==s0&&ABM.sim===s1&&S&&FX===S&&!ABM.done&&(s0.t||0)>(s1.t||0)+1){v177Carry(s0,s1);}}catch(e){console.warn('v177 çerçeve',e);}
  return r;})(abHook);
function v177Carry(a,b){V177.rb++;V177.log.push('yeniden kurma '+Math.round(a.t));
  b.t=a.t;b.half=a.half;b.halfBreak=a.halfBreak;b.eid=Math.max(b.eid||0,a.eid||0);
  for(let i=0;i<2;i++){const A=a.teams[i],B=b.teams[i];B.dir=A.dir;B.score=A.score;B.st=A.st;}
  for(let i=0;i<Math.min(a.players.length,b.players.length);i++){const p=a.players[i],q=b.players[i];if(!p||!q)continue;if(p.stam!=null)q.stam=p.stam;if(p.stamCap!=null)q.stamCap=p.stamCap;if(p.off&&!q.off){try{b.sendOff(i);}catch(e){q.off=true;}}}
  try{for(const k of ['noGoal','forceDist','holdEnd'])if(a[k]!=null)b[k]=a[k];}catch(e){}
  /* olay geçmişi: eski olaylar yeni simin başına; çerçevenin reytingi olaylardan hesaplandığı için yeniden işlenir */
  try{const old=(a.events||[]).slice();if(b.events&&old.length){b.events.unshift(...old);const R=ABM.win&&ABM.win.ado2d.state.rt;if(R&&R.onEvent)for(const e of old){try{R.onEvent(e);}catch(x){}}}}catch(e){}
  ABM.fcur=null;try{b.forceGoal=null;b.forceBy=null;}catch(e){}}
/* Pro modu: goller ve anlar yalnız motordan (120). Rakip hocanın hamleleri (097) ve an zincirleri (172) maç sırasında MR'ye yeni gol/an
   ekliyordu; bunlar motorda olmadığı için MR skoru motordan sapıyordu (ör. motor 5-0, MR 7-0). Pro'da bu olaylar ayıklanır. */
mrStep=(old=>function(){try{if(MR&&MR.pro&&MR.f3&&MR.events){for(let i=MR.events.length-1;i>=(MR.ei||0);i--){const k=MR.events[i].k;if(k==='us'||k==='opp'||k==='ch')MR.events.splice(i,1);}}}catch(e){}return old.apply(this,arguments);})(mrStep);
/* Pro modu kapanış güvencesi: maçı oyuncu motorda oynadı, kayıt motordan */
pl3Close=(old=>function(mid){try{const S=FX,sim=ABM.sim;if(!PL3.closed&&(mid==null||mid===PL3.mid)&&S&&S.ab&&S.pl3&&MR&&MR.pro&&sim){const sc=[sim.teams[abS2E(0)].score,sim.teams[abS2E(1)].score],gl=S.gl||[];
      S.score=sc.slice();if(MR.gu!==sc[0]||MR.go!==sc[1]){V177.rec=1;V177.log.push('pro uzlaştırma MR '+MR.gu+'-'+MR.go+' → '+sc.join('-'));MR.gu=sc[0];MR.go=sc[1];PL3.gu=MR.gu;PL3.go=MR.go;}
      const g=gl.filter(x=>x.s===0&&x.k==='ME').length,a=gl.filter(x=>x.s===0&&x.ak==='ME').length;if(gl.filter(x=>x.s===0).length===sc[0]&&(MR.goals!==g||MR.assists!==a)){V177.log.push('pro G/A '+MR.goals+'/'+MR.assists+' → '+g+'/'+a);MR.goals=g;MR.assists=a;}}}catch(e){console.warn('v177 pro',e);}
  return old.apply(this,arguments);})(pl3Close);
