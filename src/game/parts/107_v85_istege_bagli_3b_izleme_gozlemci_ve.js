/* ================= v85: isteğe bağlı 3B izleme — gözlemci ve doktor (kulübün maçı), hakem (yönettiği maç, kararlar maç içinde) ================= */
const W3={on:false,club0:null,had:undefined,cap:null};
function w3Begin(club){W3.on=true;W3.club0=G.club;W3.had=G.m;if(club&&club!==G.club)G.club=club;yrShadowOn();}
function w3End(){if(!W3.on)return;W3.on=false;try{if(W3.had)G.m=W3.had;else delete G.m;}catch(e){}if(W3.club0)G.club=W3.club0;W3.club0=null;W3.had=undefined;document.documentElement.classList.remove('w3m');}
/* izleme sırasında kayıt alınırsa geçici kulüp ve gölge yönetim kaydedilmesin */
save=(old=>function(){if(!W3.on||!G)return old.apply(this,arguments);const c=G.club,m=G.m;try{G.club=W3.club0||c;if(W3.had)G.m=W3.had;else delete G.m;return old.apply(this,arguments);}finally{G.club=c;G.m=m;}})(save);
/* senaryolu gol dakikaları: önceden belli skor, 3B'de aynı skorla oynanır */
function w3Plan(gu,go){const mk=n=>{const a=[];for(let i=0;i<n;i++)a.push(rint(4,89));return a.sort((x,y)=>x-y);};return {u:mk(gu),o:mk(go)};}
function w3Tick(){const S=FX;if(!S||!S.scr||!S.plan)return;const mn=fxMin(),P=S.plan;
  while(P.u.length&&P.u[0]<=mn){P.u.shift();pl3Goal(S.U,null,null);}
  while(P.o.length&&P.o[0]<=mn){P.o.shift();pl3Goal(S.O,null,null);}}
fxStep=(old=>function(dt){const r=old.apply(this,arguments);try{const S=FX;if(S&&S.scr)w3Tick();if(S&&S.ref3)ref3Tick();if(S&&(S.scr||S.ref3)&&S.phase==='ht'&&!S.w3ht){S.w3ht=1;S.htDone=true;setTimeout(()=>{try{if(FX===S&&S.phase==='ht'){fxSecond();fxUI();}}catch(e){}},1200);}}catch(e){console.warn(e);}return r;})(fxStep);
/* ---------- gözlemci / doktor: kulübün maçını 3B izle ---------- */
ACTX.stWatch=()=>{if(!isStaff()||isRef()||G.staff==='yrd'||FX)return;const f=ourFixture();if(!f)return;const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]];if(!opp)return staffMatch();
  /* sonuç ve yan etkiler her zamanki gibi belirlenir; sonuç penceresi maçtan sonra açılır */
  const cap=[],o=openModal;openModal=function(h){cap.push(h);};let n0=G.s.results.length;try{staffMatch();}catch(e){console.warn(e);}finally{openModal=o;}
  let gu=0,go=0;try{const rd=G.s.results[G.s.results.length-1],row=rd&&rd.find(r=>r[0]===f[0]&&r[1]===f[1]);if(row){gu=usHome?row[2]:row[3];go=usHome?row[3]:row[2];}}catch(e){}
  if(G.s.results.length===n0){if(cap.length)openModal(cap[cap.length-1]);return;}
  try{w3Begin();fxStart({opp,usHome,neutral:false,onEnd:()=>{w3End();if(cap.length)openModal(cap[cap.length-1]);save();render();}});const S=FX;S.scr=1;S.forceG=[0,0];S.plan=w3Plan(gu,go);S.end=Math.max(S.end,91*60);$('#fx').classList.add('pl3');
    fxEv(0,`${G.staff==='dr'?'Sağlık ekibiyle kulübedesin':'Tribündesin'}: ${S.U.name} – ${S.O.name}.`,'bold');try{if(f3Sup()&&!F3.on)f3Toggle(true);}catch(e){}}
  catch(e){console.warn('3B izle',e);w3End();if(FX){try{cancelAnimationFrame(FX.raf);}catch(_){}$('#fx').hidden=true;FX=null;}if(cap.length)openModal(cap[cap.length-1]);render();}};
/* ---------- hakem: maçı 3B yönet, kararlar ilgili dakikada ---------- */
ACTX.ref3=()=>{if(!isRef()||dayType(G.s.day)!=='mac'||FX)return;const F=refFx();if(!F||!CLUBS[F.h]||!CLUBS[F.a])return ACTX.refGo();
  REF={F,inc:refMkInc(F),i:0,rt:8.3,log:[],varQ:null,f3:1,wait:0};
  try{w3Begin(F.h);fxStart({opp:CLUBS[F.a],usHome:true,neutral:false,onEnd:()=>{w3End();if(REF&&REF.f3){REF.f3=0;if(REF.i<REF.inc.length)refModal();else refFinish();}}});
    const S=FX;S.ref3=1;S.end=Math.max(S.end,91*60);$('#fx').classList.add('pl3');fxEv(0,`Hakem ${PN()} başlama düdüğünü çaldı. ${REF.inc.length} kritik pozisyonda kararı sen vereceksin.`,'bold');try{if(f3Sup()&&!F3.on)f3Toggle(true);}catch(e){}}
  catch(e){console.warn('3B hakem',e);w3End();if(FX){try{cancelAnimationFrame(FX.raf);}catch(_){}$('#fx').hidden=true;FX=null;}REF.f3=0;refModal();}};
function ref3Tick(){const S=FX,R=REF;if(!S||!R||!R.f3||R.wait||R.i>=R.inc.length)return;if(fxMin()<R.inc[R.i].m)return;
  R.wait=1;S.ref3ph=S.phase;S.phase='pause';S.ff=false;document.documentElement.classList.add('w3m');refModal();}
/* kararın 3B maça yansıması: verilen gol / penaltı golü sahada da olur */
function ref3Side(I){const F=REF&&REF.F;if(!F||!I)return 0;const q=I.q||'';let bh=1e9,ba=1e9;for(const p of squadOf(F.h)){const i=q.indexOf(p.name);if(i>=0&&i<bh)bh=i;}for(const p of squadOf(F.a)){const i=q.indexOf(p.name);if(i>=0&&i<ba)ba=i;}return bh<=ba?0:1;}
function ref3Apply(I){const S=FX;if(!S||!I)return;const T=S.T[ref3Side(I)];S.forceG=S.forceG||[0,0];
  if(I.t==='ofs'&&I.dec==='gol'){pl3Goal(T,null,null);}
  else if((I.t==='pen'||I.t==='el')&&I.dec==='pen'){if(Math.random()<0.76)pl3Goal(T,null,null);else fxEv(fxMin(),'Penaltı kaçtı! Kaleci kurtardı.','');}
  else if(I.t==='ofs'&&I.dec==='ofs')fxEv(fxMin(),'Gol ofsayt gerekçesiyle iptal edildi.','');}
refNext=(old=>function(){const R=REF;if(!(R&&R.f3))return old.apply(this,arguments);try{ref3Apply(R.inc[R.i]);}catch(e){console.warn(e);}R.i++;R.wait=0;$('#modal').hidden=true;$('#modalCard').innerHTML='';document.documentElement.classList.remove('w3m');
  const S=FX;if(S&&S.ref3){S.phase=S.ref3ph==='end'?'end':'play';fxUI();}})(refNext);
/* hub: maç günü "3B" düğmeleri (ana düğmenin yanında, DEVAM'a karışmaz) */
viewHub=(old=>function(){let h=old.apply(this,arguments);try{if(!G||!G.s||G.phase!=='season')return h;
  if(isRef()&&dayType(G.s.day)==='mac'&&(()=>{try{const F=refFx();return !!(F&&CLUBS[F.h]&&CLUBS[F.a]);}catch(e){return false;}})()&&h.indexOf('data-act="refGo"')>=0&&h.indexOf('data-act="ref3"')<0){h=h.replace(/<button[^>]*data-act="refGo"[\s\S]*?<\/button>/,m=>`<button class="cta big" data-act="ref3"><span>Maçı izle ve yönet</span><small>3B yayın · kararları maçın içinde ver</small></button>`+m.replace(/class="cta big"/,'class="btn ghost v190-hizli"').replace(/<span>[^<]*<\/span>/,'<span>Hızlı yönet</span>').replace(/<small>[^<]*<\/small>/,'<small>maçı izlemeden yalnız kararlar</small>'));}
  else if(isStaff()&&!isRef()&&G.staff!=='yrd'&&h.indexOf('data-act="stMatch"')>=0&&h.indexOf('data-act="stWatch"')<0){h=h.replace(/(<button[^>]*data-act="stMatch"[\s\S]*?<\/button>)/,`$1<button class="btn w3b" data-act="stWatch">🎥 Maçı 3B izle <small>tribünden canlı</small></button>`);}}catch(e){}return h;})(viewHub);
/* yeni kariyere geçerken yarım kalan hakem/maç durumları temizlensin */
wizGo=(old=>function(){try{REF=null;}catch(e){}try{if(PL3)PL3.on=false;}catch(e){}return old.apply(this,arguments);})(wizGo);
stG=(old=>function(){if(!G||!G.job)return {sk:30,pot:70,bd:55,tr:50,kn:{},short:[],reps:[],cases:[],inj:{},log:[],wk:{},rq:[]};return old.apply(this,arguments);})(stG);

