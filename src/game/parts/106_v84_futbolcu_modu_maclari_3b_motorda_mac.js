/* ================= v84: futbolcu modu maçları 3B motorda — maç 3B akar, oyuncun sahada; pozisyon sana gelince kontrollü an açılır, sonra 3B'ye dönülür ================= */
/* Maçın kaydı (skor, anlar, kondisyon, sakatlık, puan) eskisi gibi MR'de tutulur; 3B motor görüntüyü üretir ve MR'nin dakikalarını sürer.
   MR'de atılan goller 3B'de canlandırılır, motorun kendi golleri bastırılır: iki taraf her zaman aynı skoru gösterir. */
const PL3={on:false,had:null,cfg:null,me:null,mom:false,end:false,gu:0,go:0,g:0,a:0,knockT:0};
function pl3Pref(){try{const v=localStorage.getItem('pl3d');if(v==='0')return false;if(v==='1')return f3Sup();}catch(e){}return f3Sup();}
function pl3MeObj(){const p=G.p;return {k:'ME',name:p.name||((typeof PN==='function')?PN():(meN())),pos:p.pos,ovr:Math.round(OVR()),age:p.age,age0:p.age,ovr0:Math.round(OVR()),nat:p.nat||'TUR',num:p.num||9,home:G.club,club:G.club,i:99,me:1};}
/* maç sürerken kulüp kadrosunda "ben" de var */
squadOf=(old=>function(id){const r=old.apply(this,arguments);try{if(PL3.on&&id===G.club&&!r.some(p=>p.k==='ME'))r.push(pl3MeObj());}catch(e){}return r;})(squadOf);
/* 3B'de oyuncunun kendi görünüşü */
try{f3Look=(old=>function(p,i){const r=old.apply(this,arguments);try{if(p&&p.k==='ME'&&typeof lookNow==='function'){const L=lookNow(G.p.age),SK=(window.Ado3D&&Ado3D.SKIN)||[[.945,.78,.64]],HR=(window.Ado3D&&Ado3D.HAIR)||[[.11,.08,.06]];if(L){if(L.sk)r.sk=f3Near(L.sk,SK);if(L.hc)r.hc=f3Near(L.hc,HR);if(L.hs!=null&&F3_HS[L.hs]!=null)r.hs=F3_HS[L.hs];r.bd=L.bd==='full'?2:L.bd?1:0;}}}catch(e){}return r;})(f3Look);}catch(e){}
function pl3Me(){const S=FX;return S?S.U.P.find(p=>p.k==='ME'&&!p.off)||null:null;}
/* ---------- başlat ---------- */
startMatch=(old=>function(cfg){if(!isPl()||FX||!cfg||!cfg.us||cfg.us.id!==G.club||!CLUBS[G.club]||!cfg.opp||!pl3Pref())return old.apply(this,arguments);
  let r;try{r=old.apply(this,arguments);pl3Start(cfg);}catch(e){console.warn('3B maç',e);pl3Abort();if(MR&&!MR.timer)MR.timer=setTimeout(mrStep,300);}return r;})(startMatch);
function pl3Start(cfg){if(!MR)return;PL3.mid=(PL3.mid||0)+1;PL3.closed=false;MR.f3=1;clearTimeout(MR.timer);MR.timer=0;PL3.cfg=cfg;PL3.mom=false;PL3.end=false;PL3.gu=0;PL3.go=0;PL3.g=0;PL3.a=0;PL3.on=true;
  PL3.had=yrShadowOn();PL3.sh=true;const m=G.m;m.pl3=1;
  /* ilk 11: oyuncumuz aynı mevkideki en zayıf oyuncunun yerine */
  let xi=mgrXI().slice();if(cfg.role==='start'&&!xi.includes('ME')){const sq=squadOf(G.club),by={};sq.forEach(p=>by[p.k]=p);const pos=G.p.pos;
    let cand=xi.map((k,i)=>({k,i,p:by[k]})).filter(x=>x.p&&x.p.pos===pos);if(!cand.length)cand=xi.map((k,i)=>({k,i,p:by[k]})).filter(x=>x.p&&x.p.pos!=='KL'&&(pos!=='KL'));if(pos==='KL')cand=xi.map((k,i)=>({k,i,p:by[k]})).filter(x=>x.p&&x.p.pos==='KL');
    cand.sort((a,b)=>a.p.ovr-b.p.ovr);if(cand[0])xi[cand[0].i]='ME';m.xi=xi;}
  else{m.xi=xi.filter(k=>k!=='ME');}
  $('#match').classList.add('pl3-hide');
  fxStart({opp:cfg.opp,usHome:!!cfg.usHome,neutral:!!cfg.neutral,pl3:1,onEnd:()=>{}});
  const S=FX;if(!S)throw new Error('fx yok');S.pl3=1;S.end=Math.max(91,MR.end)*60;S.forceG=[0,0];
  if(cfg.role!=='start'&&!S.U.bench.some(b=>b.k==='ME'))S.U.bench.unshift(pl3MeObj());
  const fx=$('#fx');if(fx)fx.classList.add('pl3');try{if(f3Sup()&&!F3.on)f3Toggle(true);}catch(e){}
  fxEv(0,cfg.role==='start'?`${meN()} ilk 11’de, ${G.p.num} numaralı formayla sahada.`:`${meN()} yedek kulübesinde, ısınmaya hazır.`,'bold');pl3Hud();}
function pl3Abort(){try{if(FX&&FX.pl3){FX.pl3=0;cancelAnimationFrame(FX.raf);$('#fx').hidden=true;FX=null;$('#tabs').hidden=true;}}catch(e){}try{if(PL3.sh){PL3.sh=false;yrShadowOff(PL3.had);}}catch(e){}PL3.on=false;PL3.had=null;try{$('#match').classList.remove('pl3-hide');}catch(e){}if(MR)MR.f3=0;}
/* MR dakikaları yalnızca 3B saat ilerledikçe işlenir */
mrStep=(old=>function(){if(!MR)return;if(MR.f3&&!MR.f3go)return;return old.apply(this,arguments);})(mrStep);
function pl3Drive(){const S=FX;if(!S||!S.pl3||!MR||!MR.f3||PL3.mom||PL3.end)return;if(MR.pendKnock){pl3Knock();return;}
  const tgt=S.phase==='end'?MR.end+1:Math.min(fxMin(),MR.end);let g=0;
  while(MR&&MR.f3&&!PL3.mom&&!MR.pendKnock&&!MR.fin&&MR.min<tgt&&g++<200){MR.f3go=1;try{mrStep();}finally{if(MR)MR.f3go=0;}pl3Sync();}
  if(MR&&MR.pendKnock)pl3Knock();}
/* ---------- MR → 3B eşitleme ---------- */
function pl3Sync(){const S=FX;if(!S||!MR)return;const U=S.U,O=S.O,me=S.U.P.find(p=>p.k==='ME');
  /* oyuncumuz girdi / çıktı */
  const on=!MR.out&&(MR.role==='start'||MR.min>=MR.entry);
  if(on&&!pl3Me()){const b=U.bench.find(x=>x.k==='ME');if(b){const out=fxOn(U).filter(p=>p.spos!=='KL'&&p.pos===G.p.pos).sort((a,c)=>a.st-c.st)[0]||fxOn(U).filter(p=>p.spos!=='KL').sort((a,c)=>a.st-c.st)[0];if(out){U.subs=Math.min(U.subs||0,4);fxSub(U,out,b);}}}
  if(!on&&me&&!me.off){if(MR.rc){me.off=true;me.red=1;fxEv(MR.min,`${me.name} kırmızı kart gördü!`,'red');}else{const b=U.bench.filter(x=>x.k!=='ME').sort((a,c)=>(c.pos===me.pos)-(a.pos===me.pos)||c.ovr-a.ovr)[0];U.subs=Math.min(U.subs||0,4);if(!(b&&fxSub(U,me,b))){me.off=true;}}}
  /* goller */
  const dg=MR.gu-PL3.gu,dgo=MR.go-PL3.go;
  for(let i=0;i<dg;i++){const mine=MR.goals>PL3.g,asst=!mine&&MR.assists>PL3.a;if(mine)PL3.g++;if(asst)PL3.a++;pl3Goal(U,mine?pl3Me():null,asst?pl3Me():null);}
  for(let i=0;i<dgo;i++)pl3Goal(O,null,null);
  PL3.gu=MR.gu;PL3.go=MR.go;PL3.g=Math.max(PL3.g,MR.goals);PL3.a=Math.max(PL3.a,MR.assists);pl3Hud();}
function pl3Goal(T,sc,as){const S=FX;if(!S)return;const on=fxOn(T).filter(p=>p.spos!=='KL');
  const c=sc&&!sc.off?sc:on.filter(p=>p.k!=='ME').sort((a,b)=>((b.spos==='FW')*2+(b.spos==='KN'||b.spos==='OS'?1:0)+Math.random()*2)-((a.spos==='FW')*2+(a.spos==='KN'||a.spos==='OS'?1:0)+Math.random()*2))[0];if(!c){S.score[T.side]++;return;}
  if(as&&as!==c){c.lastFrom=as;c.lfT=S.pt||0;}else if(!as){const mate=on.filter(p=>p!==c&&p.k!=='ME')[0];if(mate&&Math.random()<0.7){c.lastFrom=mate;c.lfT=S.pt||0;}}
  /* kısa bir hücum: top golcüye, ceza sahası önünden vuruş */
  const B=S.ball;B.fl=null;B.lv=null;c.x=fxX(T,FXL-13-Math.random()*5);c.y=34+(Math.random()-0.5)*16;B.own=c;B.last=c;B.x=c.x;B.y=c.y;S.setT=0;
  S.forceG[T.side]=(S.forceG[T.side]||0)+1;try{fxShoot(c,3);}catch(e){S.forceG[T.side]--;S.score[T.side]++;}}
/* motorun kendi golleri bastırılır; senaryolu goller kesin girer; VAR karışmaz */
fxShoot=(old=>function(c){const r=old.apply(this,arguments);try{const S=FX;if(S){const f=S.ball.fl;if(f&&f.kind==='sh'){const sd=c.T.side;if(S.forceG&&S.forceG[sd]>0){f.res='g';S.forceG[sd]--;f.pl3g=1;}else if((S.pl3||S.scr)&&f.res==='g'){f.res=Math.random()<0.65?'sv':'off';}}}}catch(e){}return r;})(fxShoot);
/* kafa vuruşları gibi fxShoot dışı şutlar da: senaryosuz gol yok */
fxShotEnd=(old=>function(f){try{const S=FX;if(S&&(S.pl3||S.scr)&&f&&f.res==='g'&&!f.pl3g)f.res=f.gk?'sv':'off';}catch(e){}return old.apply(this,arguments);})(fxShotEnd);
/* oyuncumuz motorda kırmızı görmez (kart MR'den gelir) */
fxFoul=(old=>function(d,c){const r=old.apply(this,arguments);try{const S=FX;if(S&&S.pl3&&d&&d.k==='ME'&&d.off&&!(MR&&MR.rc)){d.off=false;d.yel=Math.min(d.yel||0,1);}}catch(e){}return r;})(fxFoul);
/* ---------- 3B saatine bağlama, devre arası, maç sonu ---------- */
fxStep=(old=>function(dt){const r=old.apply(this,arguments);try{const S=FX;if(S&&S.pl3){pl3Drive();
    if(S.phase==='ht'&&!S.pl3ht){S.pl3ht=1;S.htDone=true;setTimeout(()=>{try{if(FX===S&&S.phase==='ht'){fxSecond();fxUI();}}catch(e){}},1400);}
    if(S.phase==='end')pl3Drive();}}catch(e){console.warn('3B maç',e);}return r;})(fxStep);
fxToEnd=(old=>function(){const S=FX;if(S&&S.pl3){if(S.phase==='ht'){S.htDone=true;fxSecond();}S.ff=true;if(S.phase!=='end')S.phase='play';fxUI();return;}return old.apply(this,arguments);})(fxToEnd);
mrFinish=(old=>function(){const pl=MR&&MR.f3;if(MR)MR.fin=1;const r=old.apply(this,arguments);if(pl)pl3End();return r;})(mrFinish);
function pl3End(){if(PL3.end)return;PL3.end=true;const S=FX;try{if(S&&S.phase!=='end'){S.phase='end';fxEv(90,`Maç sona erdi: ${S.U.name} ${S.score[0]}-${S.score[1]} ${S.O.name}.`,'bold');fxUI();}}catch(e){}
  PL3.fx=S;const mid=PL3.mid;setTimeout(()=>pl3Close(mid),S&&S.ff?200:1800);}
function pl3Close(mid){if(PL3.closed||(mid!=null&&mid!==PL3.mid))return;if(!PL3.on&&!PL3.sh)return;PL3.closed=true;const S=PL3.fx;PL3.fx=null;try{if(FX===S&&S)fxClose();}catch(e){console.warn(e);}try{if(PL3.sh){PL3.sh=false;yrShadowOff(PL3.had);}}catch(e){}PL3.on=false;PL3.had=null;const mt=$('#match');if(mt){mt.classList.remove('pl3-hide');mt.hidden=false;}$('#tabs').hidden=true;document.documentElement.classList.add('playing');
    const d=$('#mvDone');if(d){d.hidden=false;try{d.focus();}catch(e){}}}
/* ---------- kontrollü an: 3B durur, an oynanır, 3B'ye dönülür ---------- */
startMoment=(old=>function(type,C,title,done){if(!(MR&&MR.f3&&FX&&FX.pl3))return old.apply(this,arguments);const S=FX;PL3.mom=true;S.pl3ph=S.phase==='end'?'end':'play';S.phase='pause';S.ff=false;
  /* anın konumuna yakın bir görüntü: top bizim oyuncuda ya da yakınında */
  try{const me=pl3Me();if(me){const B=S.ball;B.fl=null;B.own=me;B.x=me.x;B.y=me.y;}fxDraw();}catch(e){}
  $('#fx').hidden=true;const mt=$('#match');mt.classList.remove('pl3-hide');mt.hidden=false;
  return old.call(this,type,C,title,res=>{try{done(res);}finally{pl3Resume();}});})(startMoment);
function pl3Resume(){PL3.mom=false;const S=FX;if(!S||!S.pl3)return;$('#match').classList.add('pl3-hide');$('#fx').hidden=false;S.phase=S.pl3ph==='end'?'end':'play';
  try{cancelAnimationFrame(S.raf);fxLast=0;S.raf=requestAnimationFrame(fxLoop);}catch(e){}try{fxResize();}catch(e){}pl3Sync();try{pl3Drive();}catch(e){console.warn(e);}}
/* hafif sakatlık sorusu: 3B durur, karar MR ekranında */
function pl3Knock(){const S=FX;if(!S||PL3.mom)return;PL3.mom=true;S.pl3ph='play';S.phase='pause';$('#fx').hidden=true;const mt=$('#match');mt.classList.remove('pl3-hide');mt.hidden=false;
  const iv=setInterval(()=>{if(!MR||!MR.pendKnock){clearInterval(iv);pl3Resume();}},250);}
/* üst bilgi: oyuncumuzun durumu */
function pl3Hud(){try{const S=FX;if(!S||!S.pl3||!MR)return;let h=$('#pl3Hud');const host=document.querySelector('#fx .fx-pw')||$('#fx');if(!host)return;if(!h){h=document.createElement('div');h.id='pl3Hud';host.appendChild(h);}
  const cd=Math.round(MR.cond),me=pl3Me();h.innerHTML=`<b>${esc(meN())}</b><span>${MR.out?'oyun dışı':me?'sahada':'yedekte'}</span><i><em style="width:${clamp(cd,0,100)}%" class="${cd<30?'low':cd<60?'mid':''}"></em></i><small>${MR.goals?`⚽ ${MR.goals} `:''}${MR.assists?`🅰 ${MR.assists} `:''}${MR.yc?'🟨 ':''}${MR.rc?'🟥':''}</small>`;}catch(e){}}
/* ayarlar: futbolcu maçlarında 3B */
ACTX.pl3Tog=()=>{const on=!pl3Pref();try{localStorage.setItem('pl3d',on?'1':'0');}catch(e){}toast(on?'Maçların 3B görünümde oynanacak':'Maçlar klasik ekranda oynanacak');try{const b=$('[data-act=pl3Tog]');if(b)b.textContent=on?'Açık':'Kapalı';}catch(e){}};
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||mc.querySelector('.pl3-set')||!f3Sup())return r;
  const h=`<div class="pl3-set"><p class="sub-h" style="margin:14px 0 6px"><span>3B maç</span></p><div class="set-row" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="muted">Futbolcu kariyerinde maçları 3B motorda oyna (pozisyon sana gelince kontrol sende)</span><button class="btn sm" data-act="pl3Tog">${pl3Pref()?'Açık':'Kapalı'}</button></div></div>`;
  (mc.lastElementChild||mc).insertAdjacentHTML('beforebegin',h);}catch(e){}return r;})(openSettings);

