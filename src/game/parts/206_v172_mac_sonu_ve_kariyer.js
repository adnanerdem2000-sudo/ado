/* ================= v172: maç sonu tek kaynak (motor olayları), telefonda maç sonu düzeni, kulüpte başlayan futbolcunun kariyer geçmişi, eski kayıtta ilk maç anı ================= */

/* =====================================================================
   V7 · Maç sonu: goller, golcüler, dakikalar, reytingler ve maçın oyuncusu TEK kaynaktan
   Kaynak: maçı oynatan motorun olayları (Adoball: sim olayları → abEv; eski 2B: fxShotEnd). Tam oynanan maçta da "Sonuna simüle et"te
   (197 hzSynth olayları aynı sim.onEvent yolundan gelir) aynı kayıt kullanılır:
   - FX.gl: gol listesi (taraf, dakika, golcü, asist, penaltı, kendi kalesine) — çerçevedeki "Olaylar" sekmesiyle aynı dakika biçimi.
   - çerçeve (Adoball) maç sonu özeti: hızlı sonuçta işlenmeyen gol/kart olayları "Olaylar" listesine ve zaman çizgisine eklenir;
     maçın oyuncusu oyunun reytinginden (FX), manşet skor farkına göre.
   - oyunun "Maç sonucu" penceresi (182 v155RichFT) ve lig istatistiği (creditGoals → G.s.v154ft, 181) aynı kayıttan.
   ===================================================================== */
const v172Gl=S=>S.gl||(S.gl=[]);
/* Adoball: gol olayı */
abEv=(old=>function(e){const r=old.apply(this,arguments);
  try{const S=ABM.fx,sim=ABM.sim;if(e&&e.type==='GOAL'&&S&&FX===S&&sim&&(e.team===0||e.team===1)){const side=abE2S(e.team),m=e.meta||{},own=!!m.own,p=abFxP(e.p),
      a=!own&&m.assist!=null&&m.assist>=0?abFxP(m.assist):null,CK=(sim.C&&sim.C.CK)||1,mn=Math.max(1,Math.floor((e.t!=null?e.t:sim.t)*CK/60));
    v172Gl(S).push({s:side,m:mn,k:p?p.k:null,n:p?p.name:'',cid:p&&p.T?p.T.id:S.T[side].id,own,pen:!!m.pen,ak:a?a.k:null,an:a?a.name:null});}}catch(x){console.warn('v172 gol',x);}
  return r;})(abEv);
/* eski 2B motor: gol (VAR iptali kapanışta skorla eşitlenir) */
fxShotEnd=(old=>function(f){const S=FX;let c=null,as=null,s0=null;
  try{if(S&&!S.ab&&f&&f.res==='g'&&f.from&&f.from.T){c=f.from;as=c.lastFrom&&S.pt-c.lfT<6&&c.lastFrom.T===c.T?c.lastFrom:null;s0=S.score.slice();}}catch(e){}
  const r=old.apply(this,arguments);
  try{if(c&&s0&&FX===S){const sd=c.T.side;if(S.score[sd]>s0[sd])v172Gl(S).push({s:sd,m:fxMin(),k:c.k,n:c.name,cid:c.T.id,own:false,pen:false,ak:as?as.k:null,an:as?as.name:null});}}catch(e){}
  return r;})(fxShotEnd);
/* reyting: Adoball'da motorun maç notu (çerçevede görünen), eski motorda fxR */
const v172Rt=(S,p)=>S.ab?Math.round(clamp(+p.rt||6,3,10)*10)/10:fxR(p);
function v172Best(S){let b=null,bs=0;for(const T of S.T)for(const p of T.P){const r=v172Rt(S,p);if(!b||r>bs){b=p;bs=r;}}return b?{p:b,rt:bs,side:S.T.indexOf(b.T)}:null;}
/* kapanış anının özeti */
let V172_MS=null,V172_CUR=null,V172_RT=null;
function v172Snap(S){if(!S||!S.T||!S.T[0]||!S.T[1]||!G||!G.s)return null;
  const sc=S.score.slice(),gl=(S.gl||[]).slice().sort((a,b)=>a.m-b.m);let ok=true;const goals=[];
  for(const sd of [0,1]){const L=gl.filter(g=>g.s===sd);if(L.length<sc[sd]){ok=false;break;}goals.push(...L.slice(0,sc[sd]));}   /* VAR ile iptal edilen fazla kayıt düşer */
  const rows=T=>T.P.map(p=>({k:p.k,n:p.name,pos:p.pos,tag:(()=>{try{return posTag(p,T)||p.pos;}catch(e){return p.pos;}})(),g:p.s.g||0,a:p.s.as||0,rt:v172Rt(S,p),sub:!!p.onT,out:!!p.subbed,red:!!p.red}));
  const b=v172Best(S);
  return {day:G.s.day,ids:[S.T[0].id,S.T[1].id],score:sc,ab:!!S.ab,goals:ok?goals.sort((a,b)=>a.m-b.m):null,T:[rows(S.T[0]),rows(S.T[1])],motm:b?{k:b.p.k,n:b.p.name,rt:b.rt,side:b.side}:null};}
fxClose=(old=>function(){const S=FX;V172_MS=null;V172_RT=null;
  try{if(S&&S.T&&!S.watch){V172_MS=v172Snap(S);if(S.ab&&V172_MS){V172_RT={};for(const T of V172_MS.T)for(const x of T)V172_RT[x.k]=x.rt;}}}catch(e){console.warn('v172 maç sonu',e);V172_MS=null;}
  try{return old.apply(this,arguments);}finally{V172_RT=null;}})(fxClose);
/* sezon istatistiği (046) Adoball maçında çerçevedeki notla */
pstAdd=(old=>function(k,o){try{if(V172_RT&&o&&V172_RT[k]!=null)o=Object.assign({},o,{rt:V172_RT[k]});}catch(e){}return old.call(this,k,o);})(pstAdd);
function v172MsFor(f,gu,go){const M=V172_MS;if(!M||!f||!G||!G.s||M.day!==G.s.day)return null;
  if(M.ids[0]!==G.club||!f.includes(M.ids[1])||!f.includes(G.club))return null;if(M.score[0]!==gu||M.score[1]!==go)return null;return M;}
/* TD maçı: lig istatistiği (golcü/asist) ve haftanın 11'i motorun kaydından (181'in v154ft biçimi) */
mgrFinish=(old=>function(gu,go,f){let M=null;try{M=v172MsFor(f,gu,go);
    if(M&&M.goals&&G.s.fixtures[G.s.week-1]){const w=G.s.results.length,cl={};
      M.T.forEach((rows,sd)=>{const cid=M.ids[sd],R={};for(const x of rows)R[x.k]=x.rt;
        cl[cid]={R,goals:M.goals.filter(g=>g.s===sd).map(g=>({k:g.own?null:g.k,ak:g.own?null:g.ak,me:false,as:false}))};});
      G.s.v154ft={w,cl};}}catch(e){console.warn('v172 lig istatistiği',e);M=null;}
  V172_CUR=M;try{return old.apply(this,arguments);}finally{V172_CUR=null;V172_MS=null;}})(mgrFinish);
/* "Maç sonucu" penceresi: goller ve reytingler motor kaydından (yoksa eski üretim) */
v155RichFT=(old=>function(gu,go,f){const M=V172_CUR;if(!M)return old.apply(this,arguments);try{if(v172RichFT(gu,go,f,M)!==false)return;}catch(e){console.warn('v172 maç sonu',e);}return old.apply(this,arguments);})(v155RichFT);
function v172RichFT(gu,go,f,M){const mc=$('#modalCard');if(!mc||$('#modal').hidden||!G.m||G.m.shadow)return;const h3=mc.querySelector('h3');if(!h3||!/Maç sonucu/i.test(h3.textContent)||mc.querySelector('.ms-cols'))return;
  const usHome=f[0]===G.club,H=CLUBS[f[0]],A=CLUBS[f[1]],sdH=M.ids[0]===f[0]?0:1,sdA=1-sdH,ORD=['KL','DF','OS','KN','FW'];
  let goals=M.goals;
  if(!goals){goals=[];M.T.forEach((rows,sd)=>{for(const x of rows)for(let i=0;i<x.g;i++)goals.push({s:sd,m:null,k:x.k,n:x.n,cid:M.ids[sd]});});}   /* dakika kaydı yoksa yalnız golcüler */
  const motm=M.motm,mk=x=>motm&&x.k===motm.k&&x.rt===motm.rt;
  const gl=goals.slice().sort((a,b)=>(a.m||0)-(b.m||0)).map(x=>{const right=x.s===sdA;const nm=x.n?esc(x.n)+(x.own?' <small>(k.k.)</small>':x.pen?' <small>(P)</small>':''):esc(CLUBS[M.ids[x.s]]?CLUBS[M.ids[x.s]].short:'');
    return `<li class="${right?'r':''}"><i>${x.m!=null?x.m+'’':''}</i>⚽ ${x.k&&x.cid?`<span class="plink" data-act="pcard" data-id="${x.cid}" data-k="${x.k}">${nm}</span>`:`<b>${nm}</b>`}${x.an?` <small>(asist: ${esc(x.an)})</small>`:''}</li>`;}).join('');
  const sortR=rows=>rows.slice().sort((a,b)=>(a.sub?1:0)-(b.sub?1:0)||ORD.indexOf(a.pos)-ORD.indexOf(b.pos));
  const col=(rows,c)=>`<div class="ms-col"><p class="sub-h"><span>${crestSVG(c,16)} ${esc(c.short)}</span><span>Reyting</span></p>${sortR(rows).map(x=>`<div class="ms-r${mk(x)?' motm':''}"><span>${esc(x.tag||x.pos)}</span><b class="plink" data-act="pcard" data-id="${c.id}" data-k="${x.k}">${esc(x.n)}${x.sub?' <small>↑</small>':''}${x.red?' 🟥':''}</b><small>${'⚽'.repeat(x.g)}${x.a?' 🅰'.repeat(x.a):''}</small><em class="${x.rt>=7.5?'hi':x.rt<6?'lo':''}">${x.rt.toFixed(1)}</em></div>`).join('')}</div>`;
  const board=mc.querySelector('.res-board');if(!board)return false;
  board.insertAdjacentHTML('afterend',`${gl?`<ul class="ms-goals">${gl}</ul>`:'<p class="muted" style="text-align:center">Golsüz maç</p>'}${motm?`<p class="ms-motm">⭐ Maçın oyuncusu: <b>${esc(motm.n)}</b> · ${motm.rt.toFixed(1)}</p>`:''}<div class="ms-cols">${col(M.T[sdH],H)}${col(M.T[sdA],A)}</div>`);
  mc.classList.add('wide');
  /* teknik direktör: maç sonu basın toplantısı (182 ile aynı) */
  if(G.mode==='mgr'&&!isRole()&&motm&&Math.random()<0.55){const b=mc.querySelector('button.cta[data-act="closeModal"]');if(b){b.dataset.act='v155PostPress';b.insertAdjacentHTML('afterend','<small class="muted v155-pp">Basın seni bekliyor</small>');V155_POST={gu,go,f,motm:motm.n,mine:motm.side===0};}}
  return true;}
/* ---------- Adoball çerçevesi: maç sonu özeti ---------- */
function v172Headline(s,h,a,hg,ag){const d=Math.abs(hg-ag);if(d>=2&&h&&a&&/Dar Farkla|kıl payı/i.test(String(s||''))){const w=hg>ag?h.name:a.name,l=hg>ag?a.name:h.name;
    return d===2?`Net Galibiyet: ${w}, ${l} karşısında ${hg}-${ag} kazandı.`:`Farklı Galibiyet: ${w}, ${l} karşısında ${hg}-${ag} kazandı.`;}return s;}
function v172PatchWin(W){if(!W||W.__v172ms)return;W.__v172ms=1;
  const cm=W.computeMOTM;if(typeof cm==='function')W.computeMOTM=function(){try{const S=ABM.fx,md=W.ABH&&W.ABH.md&&W.ABH.md();if(S&&S.ab&&md&&md.h&&md.a){const b=v172Best(S);
        if(b)return {player:{name:b.p.name},team:abS2E(b.side)===0?md.h:md.a,rating:b.rt};}}catch(e){}return cm.apply(this,arguments);};
  const gh=W.generateHeadline;if(typeof gh==='function')W.generateHeadline=function(h,a,hg,ag){const s=gh.apply(this,arguments);try{return v172Headline(s,h,a,+hg,+ag);}catch(e){return s;}};}
/* hızlı sonuçta (ve gecikmeli gösterimde kuyrukta kalan) gol/kart olayları çerçevenin "Olaylar" listesine ve zaman çizgisine */
function v172FrameSync(){const W=ABM.win,S=ABM.fx,sim=ABM.sim;if(!W||!S||!sim||!W.ado||!W.ado.km||typeof W.addHighlight!=='function')return 0;
  const md=W.ABH&&W.ABH.md&&W.ABH.md();if(!md||!md.h||!md.a||!md.highlights)return 0;const CK=(sim.C&&sim.C.CK)||1,nm=i=>i!=null&&i>=0&&sim.players[i]?sim.players[i].name:'';
  const rows=W.ado.km.rows(),used=new Set();let add=0;
  for(const e of (sim.events||[])){if(e.type!=='GOAL'&&e.type!=='CARD')continue;const T=e.team;if(T!==0&&T!==1)continue;const m=e.meta||{},b=Math.max(1,Math.floor(e.t*CK/60));let km,txt,ty;
    if(e.type==='GOAL'){const own=!!m.own,ast=m.assist!=null&&m.assist>=0?m.assist:-1;km={k:'goal',s:T,n:nm(e.p),a:!own&&ast>=0?nm(ast):'',pen:!!m.pen,fk:false,cor:false,og:own,v:null,b,x:0};
      txt=own?'⚽ Kendi kalesine - '+km.n:'⚽ '+km.n+(km.a?' (Asist: '+km.a+')':'')+(m.pen?' (P)':'');ty='goal';}
    else{const red=m.card==='R';km=red?{k:'red',s:T,n:nm(e.p),y2:!!m.second,v:null,b,x:0}:{k:'yellow',s:T,n:nm(e.p),b,x:0};txt=(red?'🟥 Kırmızı Kart - ':'🟨 Sarı Kart - ')+km.n;ty=red?'card-red':'card-yellow';}
    let hit=-1;for(let j=0;j<rows.length;j++){const r=rows[j];if(!used.has(j)&&r&&r.k===km.k&&r.s===km.s&&r.n===km.n&&Math.abs((r.b||0)-b)<=1){hit=j;break;}}
    if(hit>=0){used.add(hit);continue;}
    try{W.ado.km.next(km);W.addHighlight(T===0?md.h:md.a,txt,ty,b);add++;}catch(x){console.warn('v172 olay',x);}}
  if(add){try{md.highlights.sort((x,y)=>(y.min||0)-(x.min||0));if(typeof W.renderHighlightsList==='function')W.renderHighlightsList();}catch(x){}}
  return add;}
abFullTime=(old=>function(){try{const S=ABM.fx;if(S&&FX===S&&!ABM.done&&ABM.win){v172PatchWin(ABM.win);v172FrameSync();}}catch(e){console.warn('v172 çerçeve',e);}return old.apply(this,arguments);})(abFullTime);

/* =====================================================================
   V8 · Telefonda futbolcu maç sonu: "Diğer maçlar" şeridi Maç sonu düğmesini örtmesin; klavye ipucu telefonda yok
   ===================================================================== */
lcvTick=(old=>function(){const r=old.apply(this,arguments);
  try{const el=document.getElementById('lcv'),ms=document.getElementById('match'),on=!!(el&&!el.hidden&&ms&&!ms.hidden),de=document.documentElement;
    de.classList.toggle('v172-lcv',on);if(on){const h=Math.ceil(el.getBoundingClientRect().height)||44;if(de.style.getPropertyValue('--lcv-h')!==h+'px')de.style.setProperty('--lcv-h',h+'px');}
    /* kendi maçımız bittiyse diğer maçların gol uyarıları sırayla akmaya devam etmesin (şerit son durumu gösterir) */
    const d=document.getElementById('mvDone');if(on&&d&&!d.hidden&&LCV.fl&&LCV.fl.length)LCV.fl.length=0;}catch(e){}
  return r;})(lcvTick);
proCSS=(old=>function(d){const r=old.apply(this,arguments);try{if(d&&d.head&&!d.getElementById('v172-pro-css')){const s=d.createElement('style');s.id='v172-pro-css';
    s.textContent='@media (max-width:600px),(pointer:coarse){#abh-pro .keys{display:none!important}}';d.head.appendChild(s);}}catch(e){}return r;})(proCSS);

/* =====================================================================
   V9 · Kulüpte (orta/zirve seviye) başlayan futbolcu: kariyer sayacı yolculukla tutarlı, doğru ilk an, seçilen yaş
   Önceki maç/gol sayısı uydurulmaz (G.totals sıfırdan); ilk an "… ile sözleşme imzaladı"; yaş sihirbazdan (varsayılan 21/24).
   ===================================================================== */
function v172PlAgeDef(){return W.lvl==='zirve'?24:21;}
function v172PlAge(){if(W.plAgeSet&&W.plAge>=17&&W.plAge<=33)return W.plAge;return v172PlAgeDef();}
lvlField=(old=>function(){let h=old.apply(this,arguments);try{if(W.prof==='oyuncu'&&W.lvl&&W.lvl!=='sifir'){W.plUI=1;const a=v172PlAge();
    h=h.replace(/<\/div>$/,`<div class="field v172-age"><span class="field-label">Başlangıç yaşı: <b id="wzPA">${a}</b></span><input type="range" min="17" max="33" step="1" value="${a}" id="wzPlAge" class="wz-range" aria-label="Başlangıç yaşı"></div></div>`);}}catch(e){}return h;})(lvlField);
lvlSummary=(old=>function(){let s=old.apply(this,arguments);try{if(W.prof==='oyuncu')s=String(s).replace(/\d+ yaş/,v172PlAge()+' yaş');}catch(e){}return s;})(lvlSummary);
document.addEventListener('input',e=>{const t=e.target;if(!t||t.id!=='wzPlAge')return;W.plAge=+t.value;W.plAgeSet=1;const n=$('#wzPA');if(n)n.textContent=W.plAge;
  try{const sm=document.querySelector('#start .wz-pick small');if(sm)sm.textContent=lvlSummary();}catch(_){}});
wizGo=(old=>function(){const lv=W.lvl,pl=W.prof==='oyuncu'&&lv&&lv!=='sifir';const r=old.apply(this,arguments);
  try{if(pl&&G&&G.mode==='player'&&G.p&&G.phase==='season'&&G.contract&&CLUBS[G.club]&&!G.v172lv){const a0=+W.age;
      const age=W.plUI?v172PlAge():(Number.isFinite(a0)&&a0>=16&&a0<=34?a0:v172PlAgeDef());
      G.v172lv=lv;G.p.age=age;G.totals={apps:0,goals:0,assists:0};G.history=G.history||[];G.ms=[];G.msS=null;
      msAdd(`${CLUBS[G.club].name} ile ${G.contract.years} yıllık profesyonel sözleşme imzaladı (${G.contract.role})`,'start');save();render();}}catch(e){console.warn('v172 başlangıç',e);}
  return r;})(wizGo);

/* =====================================================================
   V13 · "Görevdeki ilk maç" / "İlk galibiyet" anları: kayıt yeni sürümde açılınca daha önce oynanmış maçlar sayılır
   (G.mt: önceki sezonlar, G.m.st: bu sezon; anı yazan 192 v165Tick'tir)
   ===================================================================== */
v165Tick=(old=>function(){try{if(G&&G.s&&G.p&&G.mode==='mgr'&&G.m&&G.m.st&&v165Kind()==='mgr'){const V=v165(),R=V.rec=V.rec||{bw:0,bl:0,w:0},mt=G.mt||{},st=G.m.st;
      const n=(mt.w||0)+(mt.d||0)+(mt.l||0)+(st.w||0)+(st.d||0)+(st.l||0),w=(mt.w||0)+(st.w||0);
      if(n>1&&!R.m1)R.m1=1;if(w>1&&!R.w1)R.w1=1;}}catch(e){}
  return old.apply(this,arguments);})(v165Tick);
