/* ================= v166: maç sırasında aynı haftanın diğer maçları (canlı skorlar, gol uyarısı, canlı puan durumu) ================= */
/* Football Manager'daki gibi: kendi ligimizde bir maçı izlerken/oynarken aynı haftanın diğer maçları saatimizle birlikte ilerler.
   Tutarlılık: hafta henüz kaydedilmediyse diğer maçların sonuçları maç ekranı açılınca BİR KEZ belirlenir (G.s.lcv, yalnız skorlar)
   ve simScore bu hafta için aynı skorları döndürür; böylece maç sonunda lige yazılan sonuçlar, 90'da gösterilenle birebir aynıdır.
   Hafta zaten kaydedildiyse (ör. gözlemci/doktor izlemesi) kayıtlı sonuçlar gösterilir. Gol dakikaları skordan tohumlu (deterministik)
   üretilir, kayıtta yer tutmaz. Kupa turlarında diğer eşleşmeler simüle edilmediği için şerit gösterilmez.
   Görünüm: Adoball (2B/3B) ekranında akış kartına "Diğer maçlar" sekmesi + telefonda katlanabilir şerit + saha üstünde gol uyarısı;
   klasik maç ekranlarında (futbolcu akışı, eski 2B motor) masaüstünde yan panel, telefonda alttan açılan katlanabilir çubuk. */
const LCV={key:'',seen:{},tab:'mac',open:null,fl:[],flT:0,cr:{},last:null,sig:'',abSig:'',tbSig:'',tbHTML:'',ab:null};
window.LCV=LCV;
/* tohumlu rastgele (mulberry32) */
function lcvRng(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  let a=h>>>0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
/* gol dakikaları: [[dk,taraf(0 ev/1 dep)],...] — skordan ve maçtan türetilir, her açılışta aynı */
function lcvMins(y,lid,wi,h,a,hg,ag){const r=lcvRng(`${y}|${lid}|${wi}|${h}|${a}|${hg}|${ag}`),o=[];
  const one=()=>{const x=r(),m=r();return x<0.45?1+Math.floor(m*45):46+Math.floor(m*45);};
  for(let i=0;i<hg;i++)o.push([one(),0]);for(let i=0;i<ag;i++)o.push([one(),1]);o.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);return o;}
/* bu hafta için önceden belirlenmiş skorlar geçerli mi? */
function lcvPlanOK(){const S=G&&G.s,P=S&&S.lcv;if(!P||P.lid!==S.league||P.y!==S.year||!S.results||P.wi!==S.results.length)return null;return P;}
simScore=(old=>{window.__lcvSim0=old;return function(h,a){try{const P=lcvPlanOK();if(P){const r=P.m[h+'|'+a];if(r)return [r[0],r[1]];}}catch(e){}return old.apply(this,arguments);};})(simScore);
function lcvPlan(wi,skip){const S=G.s;let P=S.lcv;if(P&&P.lid===S.league&&P.y===S.year&&P.wi===wi)return P;
  P={lid:S.league,y:S.year,wi,m:{}};const sim=window.__lcvSim0||simScore;
  for(const [h,a] of S.fixtures[wi]||[]){if(!CLUBS[h]||!CLUBS[a]||(h===skip[0]&&a===skip[1]))continue;const r=sim(h,a);P.m[h+'|'+a]=[r[0]|0,r[1]|0];}
  S.lcv=P;return P;}
/* ekrandaki maç ve saati */
function lcvClock(){
  try{if(typeof FX!=='undefined'&&FX&&FX.T&&FX.T[0]&&FX.T[1]&&!(FX.o&&FX.o.headless)){const el=$('#fx');if(el&&!el.hidden){
    const ph=FX.phase==='end'?'end':FX.phase==='ht'?'ht':FX.phase==='pre'||!(FX.t>0)?'pre':'play';
    const sc={};sc[FX.T[0].id]=FX.score[0];sc[FX.T[1].id]=FX.score[1];
    return {host:FX.ab?'ab':'fx',ids:[FX.T[0].id,FX.T[1].id],cur:ph==='pre'?0:Math.min(120,Math.floor(FX.t/60)),ph,sc};}}}catch(e){}
  try{if(typeof MR!=='undefined'&&MR&&MR.home&&MR.away&&!MR.headless){const el=$('#match');if(el&&!el.hidden){
    const end=MR.fin||MR.min>=(MR.end||90),ph=end?'end':MR.min<=0?'pre':'play',sc={};
    sc[MR.home.id]=MR.usHome?MR.gu:MR.go;sc[MR.away.id]=MR.usHome?MR.go:MR.gu;
    return {host:'mr',ids:[MR.home.id,MR.away.id],cur:MR.min,ph,sc};}}}catch(e){}
  return null;}
/* ekrandaki maçın bulunduğu lig haftası */
function lcvRound(ids){const S=G&&G.s;if(!S||!S.fixtures||!S.results||G.phase!=='season'||!ids[0]||!ids[1])return null;
  const [x,y]=ids,find=rd=>rd&&rd.find(f=>(f[0]===x&&f[1]===y)||(f[0]===y&&f[1]===x));
  const n=S.results.length,cal=S.cal||[];
  /* bekleyen hafta: bugün o haftanın günü olmalı */
  {const f=find(S.fixtures[n]);if(f&&(cal[n]===S.day||(cal[n]==null&&dayType(S.day)==='mac')))return {wi:n,f,done:false};}
  /* bugün (ya da az önce) kaydedilmiş hafta */
  if(n>0){const f=find(S.fixtures[n-1]);if(f&&(cal[n-1]==null||Math.abs(cal[n-1]-S.day)<=1))return {wi:n-1,f,done:true};}
  return null;}
const lcvShort=id=>{const c=CLUBS[id];return c?(c.short||c.name.slice(0,3)).toUpperCase():'?';};
const lcvCrest=id=>LCV.cr[id]||(LCV.cr[id]=CLUBS[id]?crestSVG(CLUBS[id],16):'');
/* anlık durum */
function lcvState(){const ck=lcvClock();if(!ck)return null;const R=lcvRound(ck.ids);if(!R)return null;
  const S=G.s,lid=S.league,wi=R.wi,f=R.f,cur=ck.ph==='end'?99:ck.cur,fin=ck.ph==='end'||cur>=90,started=ck.ph!=='pre';
  const P=R.done?null:lcvPlan(wi,f),rows=[];
  for(const fx of S.fixtures[wi]||[]){const [h,a]=fx;if(h===f[0]&&a===f[1])continue;if(!CLUBS[h]||!CLUBS[a])continue;
    let fs=null;if(R.done){const r=(S.results[wi]||[]).find(q=>q[0]===h&&q[1]===a);if(r)fs=[r[2],r[3]];}else{fs=P.m[h+'|'+a];}
    if(!fs)continue;const ev=lcvMins(S.year,lid,wi,h,a,fs[0],fs[1]);let hg=0,ag=0;const shown=[];
    for(const e of ev){if(fin||(started&&e[0]<=cur)){if(e[1])ag++;else hg++;shown.push(e);}}
    rows.push({h,a,hg,ag,fh:fs[0],fa:fs[1],ev:shown});}
  const us={h:f[0],a:f[1],hg:ck.sc[f[0]]|0,ag:ck.sc[f[1]]|0};
  return {ck,lid,wi,done:R.done,rows,us,fin,started,cur,key:`${S.year}|${lid}|${wi}|${f[0]}|${f[1]}`};}
const lcvMinTxt=st=>!st.started?'—':st.fin?'MS':st.ck.ph==='ht'?'İY':Math.min(90,st.cur)+'’';
/* ---------- HTML ---------- */
function lcvRowsHTML(st){
  if(!st.rows.length)return '<div class="lcv-empty">Bu hafta başka maç yok.</div>';
  const mt=lcvMinTxt(st);
  return st.rows.map(r=>{const k=r.h+'|'+r.a,hot=LCV.hot&&LCV.hot[k]&&performance.now()-LCV.hot[k]<6000;
    const tip=r.ev.map(e=>`${e[0]}’ ${CLUBS[e[1]?r.a:r.h].name}`).join(', ');
    return `<div class="lcv-r${hot?' lcv-hot':''}" title="${esc(tip||'Gol yok')}"><span class="lcv-t lcv-th">${lcvCrest(r.h)}<b>${esc(lcvShort(r.h))}</b></span><span class="lcv-s">${st.started?`${r.hg} - ${r.ag}`:'– : –'}</span><span class="lcv-t lcv-ta"><b>${esc(lcvShort(r.a))}</b>${lcvCrest(r.a)}</span><i class="lcv-m">${mt}</i></div>`;}).join('');}
function lcvTableHTML(st){
  const S=G.s,base=S.results.slice(0,st.wi),live=st.rows.map(r=>[r.h,r.a,r.hg,r.ag]);live.push([st.us.h,st.us.a,st.us.hg,st.us.ag]);
  const sig=st.key+'|'+(st.started?live.map(r=>r[2]+'-'+r[3]).join(','):'0');if(LCV.tbSig===sig)return LCV.tbHTML;
  const t0=tableOf(st.lid,base),t1=st.started?tableOf(st.lid,base.concat([live])):t0,p0={};t0.forEach((r,i)=>p0[r.id]=i);
  const mine=new Set([st.us.h,st.us.a]),arw=base.length>0;
  const html=`<table class="lcv-tb"><thead><tr><th>#</th><th></th><th class="l">Takım</th><th>O</th><th>AV</th><th>P</th></tr></thead><tbody>${t1.map((r,i)=>{const d=p0[r.id]-i;
    const ar=!arw?'<i class="lcv-eq">•</i>':d>0?`<i class="lcv-up" title="${d} sıra yükseldi">▲</i>`:d<0?`<i class="lcv-dn" title="${-d} sıra düştü">▼</i>`:'<i class="lcv-eq">•</i>';
    const av=r.a-r.y;return `<tr class="${r.id===G.club?'lcv-me':mine.has(r.id)?'lcv-us':''}"><td>${i+1}</td><td>${ar}</td><td class="l"><span class="lcv-tc">${lcvCrest(r.id)}<span>${esc(lcvShort(r.id))}</span></span></td><td>${r.o}</td><td>${av>0?'+':''}${av}</td><td><b>${r.p}</b></td></tr>`;}).join('')}</tbody></table>`;
  LCV.tbSig=sig;LCV.tbHTML=html;return html;}
function lcvBodyHTML(st){return LCV.tab==='tablo'?lcvTableHTML(st):lcvRowsHTML(st);}
function lcvHeadHTML(st){const L=LEAGUES[st.lid]||{};return `<div class="lcv-hd"><b>Diğer maçlar</b><span>${esc(L.short||L.name||'')} · ${st.wi+1}. hafta</span></div>
  <div class="lcv-seg"><button type="button" data-lcv="mac" class="${LCV.tab==='mac'?'on':''}">Skorlar</button><button type="button" data-lcv="tablo" class="${LCV.tab==='tablo'?'on':''}">Canlı puan durumu</button></div>`;}
function lcvFlashTxt(g){return `<b>GOL!</b> ${g.m}’ ${esc(CLUBS[g.by].name)} <span>${esc(lcvShort(g.h))} ${g.hg}-${g.ag} ${esc(lcvShort(g.a))}</span>`;}
/* ---------- yeni goller → uyarı ---------- */
function lcvGoals(st,fresh){const now=performance.now();LCV.hot=LCV.hot||{};
  for(const r of st.rows){const k=r.h+'|'+r.a,n=r.ev.length,o=LCV.seen[k]||0;
    if(!fresh&&n>o){let hg=0,ag=0;r.ev.forEach((e,i)=>{if(e[1])ag++;else hg++;if(i>=o)LCV.fl.push({m:e[0],by:e[1]?r.a:r.h,h:r.h,a:r.a,hg,ag});});LCV.hot[k]=now;}
    LCV.seen[k]=n;}
  if(LCV.fl.length>3)LCV.fl=LCV.fl.slice(-3);}
function lcvNextFlash(){const now=performance.now();if(LCV.cur&&now-LCV.flT<3800)return LCV.cur;LCV.cur=null;if(!LCV.fl.length)return null;LCV.cur=LCV.fl.shift();LCV.flT=now;LCV.cur.id=(LCV.cur.id||0)+now;return LCV.cur;}
/* ---------- ana döngü ---------- */
function lcvTick(){let st=null;try{if(G&&G.s)st=lcvState();}catch(e){st=null;}
  if(!st){if(LCV.key){LCV.key='';LCV.seen={};LCV.fl=[];LCV.cur=null;LCV.hot={};}lcvParentHide();lcvAbHide();return;}
  const fresh=LCV.key!==st.key;if(fresh){LCV.key=st.key;LCV.seen={};LCV.fl=[];LCV.cur=null;LCV.hot={};LCV.sig='';LCV.abSig='';LCV.tbSig='';}
  lcvGoals(st,fresh);
  LCV.last={lid:st.lid,y:G.s.year,wi:st.wi,fin:st.fin,cur:st.cur,rows:st.rows.map(r=>[r.h,r.a,r.hg,r.ag,r.ev.map(e=>e[0]+(e[1]?'d':'e')).join(' ')])};
  const fl=st.ck.host!=='ab'&&lcvBlocked(st)==='modal'?null:lcvNextFlash();
  if(st.ck.host==='ab'){lcvParentHide();lcvAb(st,fl);}else{lcvAbHide();lcvParent(st,fl);}}
/* ---------- klasik ekranlar: üst sayfada panel ---------- */
/* açık pencere varken çubuk gizlenir (goller sırada bekler); etkileşimli an sahnesinde (şut/pas düğmeleri) yalnız üstte kısa gol uyarısı çıkar */
function lcvBlocked(st){const mo=document.getElementById('modal'),sg=document.getElementById('mvStage');return mo&&!mo.hidden?'modal':st.ck.host==='mr'&&sg&&!sg.hidden?'stage':'';}
function lcvParentHide(){const el=document.getElementById('lcv');if(el&&!el.hidden)el.hidden=true;}
function lcvParent(st,fl){let el=document.getElementById('lcv');
  if(!el){el=document.createElement('aside');el.id='lcv';el.className='lcv';el.setAttribute('aria-label','Diğer maçlar');document.body.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-lcv]');if(!b)return;const k=b.getAttribute('data-lcv');
      if(k==='tog'){LCV.open=!lcvIsOpen();try{localStorage.setItem('lcvOpen',LCV.open?'1':'0');}catch(_){}}else LCV.tab=k;LCV.sig='';lcvTick();});}
  /* açık pencere varken çubuk gizlenir (goller sırada bekler); etkileşimli an sahnesinde (şut/pas düğmeleri) yalnız üstte kısa gol uyarısı çıkar */
  const bl=lcvBlocked(st);el.classList.toggle('lcv-mini',bl==='stage');
  if(bl==='modal'||(bl==='stage'&&!fl)){el.hidden=true;LCV.sig='';return;}
  if(bl==='stage'){el.hidden=false;const k='m'+fl.id;if(LCV.sig!==k){LCV.sig=k;el.innerHTML=`<div class="lcv-mfl" role="status">${lcvFlashTxt(fl)}</div>`;}return;}
  el.hidden=false;const open=lcvIsOpen();el.classList.toggle('lcv-open',open);
  const lastG=lcvLastGoal(st);
  const sig=[st.key,LCV.tab,open,lcvMinTxt(st),st.rows.map(r=>r.hg+'-'+r.ag).join(','),st.us.hg+'-'+st.us.ag,fl?fl.id:0,LCV.tab==='tablo'?'t':''].join('|');
  if(sig===LCV.sig)return;LCV.sig=sig;
  const bar=`<button type="button" class="lcv-bar" data-lcv="tog" aria-expanded="${open}"><span class="lcv-dot"></span><b>Diğer maçlar</b><span class="lcv-bt">${fl?lcvFlashTxt(fl):lastG?esc(lastG):`${st.rows.length} maç · ${lcvMinTxt(st)}`}</span><i class="lcv-car">${open?'▾':'▴'}</i></button>`;
  el.innerHTML=bar+(open?`<div class="lcv-in">${lcvHeadHTML(st)}<div class="lcv-body">${lcvBodyHTML(st)}</div></div>`:'')+(fl&&open?`<div class="lcv-fl" role="status">${lcvFlashTxt(fl)}</div>`:'');
  el.classList.toggle('lcv-flash',!!fl);}
function lcvIsOpen(){if(LCV.open!=null)return LCV.open;try{const v=localStorage.getItem('lcvOpen');if(v!=null)return LCV.open=v==='1';}catch(_){}return LCV.open=window.innerWidth>=900;}
function lcvLastGoal(st){let best=null;for(const r of st.rows){const e=r.ev[r.ev.length-1];if(e&&(!best||e[0]>=best.m))best={m:e[0],r,by:e[1]?r.a:r.h};}
  return best?`Son gol ${best.m}’ ${lcvShort(best.by)} · ${lcvShort(best.r.h)} ${best.r.hg}-${best.r.ag} ${lcvShort(best.r.a)}`:'';}
/* ---------- Adoball çerçevesi: sekme + şerit + gol uyarısı ---------- */
const LCV_ABCSS=`
#tl-tab-lcv.lcv-new::after,#l2t-lcv.lcv-new::after{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--live,#ff4757);margin-left:6px;vertical-align:middle;animation:lcvP 1s ease-in-out infinite}
.timeline-card.lcv-on #fm-events-list,.timeline-card.lcv-on #commentary-list,.timeline-card.lcv-on #km-head,.timeline-card.lcv-on .stats-container{display:none!important}
body.l2d-wide .timeline-card .tabs:has(#tl-tab-lcv) .tab{padding-left:8px;padding-right:8px;letter-spacing:.02em;font-size:.8rem;white-space:nowrap}
body.l2d-wide #lcv-ab{flex:1 1 0;min-height:0}
#lcv-ab{padding:8px 10px 12px;overflow:auto;min-height:0;flex:1}
.timeline-card:not(.lcv-on) #lcv-ab{display:none}
.lcv-hd{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:2px 2px 8px}
.lcv-hd b{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text,#f2f5fa)}
.lcv-hd span{font-size:11px;color:var(--text-3,#8494af)}
.lcv-seg{display:flex;gap:4px;margin:0 0 8px;background:var(--s1,#0b1222);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:9px;padding:3px}
.lcv-seg button{flex:1;border:0;background:none;color:var(--text-2,#a9b6c8);font:600 12px/1 inherit;font-family:inherit;padding:7px 6px;border-radius:7px;cursor:pointer}
.lcv-seg button.on{background:var(--s4,#22304f);color:var(--text,#fff)}
.lcv-r{display:grid;grid-template-columns:1fr auto 1fr 34px;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;background:var(--glass,rgba(255,255,255,.04));margin-bottom:4px;font-size:13px}
.lcv-t{display:flex;align-items:center;gap:6px;min-width:0}.lcv-t b{font-weight:700;white-space:nowrap}
.lcv-th{justify-content:flex-end}.lcv-ta{justify-content:flex-start}
.lcv-t svg,.lcv-t img,.lcv-tb svg,.lcv-tb img{width:16px;height:auto;flex:0 0 16px}
.lcv-s{font-weight:800;font-variant-numeric:tabular-nums;min-width:44px;text-align:center;background:var(--s0,#060a14);border-radius:6px;padding:3px 6px}
.lcv-m{font-style:normal;font-size:11px;color:var(--live,#ff4757);text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
.lcv-hot{animation:lcvHot 1.2s ease-out 3;box-shadow:inset 3px 0 0 var(--gold,#ffc93c)}
.lcv-hot .lcv-s{background:var(--gold,#ffc93c);color:#111}
.lcv-empty{font-size:12px;color:var(--text-3,#8494af);padding:14px;text-align:center}
.lcv-tb{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.lcv-tb th{font-size:10px;color:var(--text-3,#8494af);font-weight:600;padding:3px 4px;text-align:center}
.lcv-tb td{padding:4px;text-align:center;border-top:1px solid var(--line,rgba(255,255,255,.08))}
.lcv-tb .l{text-align:left}.lcv-tc{display:flex;align-items:center;gap:6px}
.lcv-tb tr.lcv-me td{background:var(--primary-dim,rgba(31,178,255,.14))}.lcv-tb tr.lcv-us td{background:rgba(255,255,255,.04)}
.lcv-up{color:var(--success,#2fd08a);font-style:normal;font-size:10px}.lcv-dn{color:var(--danger,#ff5a6e);font-style:normal;font-size:10px}.lcv-eq{color:var(--text-dis,#5b6a86);font-style:normal}
#lcv-fl{position:absolute;left:50%;top:52px;transform:translateX(-50%);z-index:30;pointer-events:none;background:rgba(6,10,20,.92);border:1px solid var(--gold,#ffc93c);border-left:4px solid var(--gold,#ffc93c);color:var(--text,#fff);border-radius:8px;padding:6px 12px;font-size:13px;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 24px rgba(0,0,0,.45);animation:lcvIn .35s ease-out}
#lcv-fl b{color:var(--gold,#ffc93c);letter-spacing:.06em;margin-right:4px}#lcv-fl span{margin-left:6px;font-weight:800;font-variant-numeric:tabular-nums}
#lcv-strip{display:flex;align-items:center;gap:6px;margin:6px 0;padding:4px 6px;background:var(--s1,#0b1222);border:1px solid var(--line,rgba(255,255,255,.08));border-radius:10px;font-size:12px;order:3}
#lcv-strip .lcv-sl{flex:0 0 auto;font-weight:700;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3,#8494af);border:0;background:none;padding:4px;cursor:pointer;font-family:inherit}
#lcv-strip .lcv-sc{flex:1;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}#lcv-strip .lcv-sc::-webkit-scrollbar{display:none}
#lcv-strip .lcv-ch{flex:0 0 auto;display:flex;align-items:center;gap:4px;padding:3px 7px;border-radius:7px;background:var(--glass,rgba(255,255,255,.05));white-space:nowrap;font-variant-numeric:tabular-nums;cursor:pointer}
#lcv-strip .lcv-ch b{font-weight:800}#lcv-strip .lcv-ch.lcv-hot{background:var(--gold,#ffc93c);color:#111;box-shadow:none}
#lcv-strip .lcv-ch i{font-style:normal;color:var(--live,#ff4757);font-size:10px;font-weight:700}
#lcv-strip.lcv-shut .lcv-sc{display:none}#lcv-strip.lcv-shut .lcv-sum{display:block}
#lcv-strip .lcv-sum{display:none;flex:1;color:var(--text-2,#a9b6c8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lcv-strip .lcv-x{flex:0 0 auto;border:0;background:none;color:var(--text-3,#8494af);font-size:14px;padding:2px 6px;cursor:pointer}
body.l2d-wide #lcv-strip{display:none}
@keyframes lcvIn{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes lcvHot{0%{background:rgba(255,201,60,.35)}100%{background:var(--glass,rgba(255,255,255,.04))}}
@keyframes lcvP{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){#lcv-fl,.lcv-hot,#tl-tab-lcv.lcv-new::after,#l2t-lcv.lcv-new::after{animation:none}}`;
function lcvAbHide(){const W=typeof ABM!=='undefined'&&ABM.win;if(!W||!W.document)return;const d=W.document;
  for(const id of ['tl-tab-lcv','l2t-lcv','lcv-strip','lcv-fl']){const e=d.getElementById(id);if(e&&!e.hidden)e.hidden=true;}
  const tc=d.querySelector('.timeline-card.lcv-on');if(tc){tc.classList.remove('lcv-on');try{W.ado.tl(W.ado.tlCur||'key');}catch(_){}}}
function lcvAbSet(on){const W=ABM.win;if(!W)return;const d=W.document,tc=d.querySelector('.timeline-card');if(!tc)return;LCV.abOn=on;
  if(on){try{W.__lcvTl.call(W.ado,W.ado.tlCur||'key');}catch(_){}tc.classList.add('lcv-on');
    for(const id of ['tl-tab-key','tl-tab-cm','tl-tab-st']){const b=d.getElementById(id);if(b){b.classList.remove('active');b.setAttribute('aria-pressed','false');}}
    for(const id of ['l2t-key','l2t-cm','l2t-xi','l2t-stats']){const b=d.getElementById(id);if(b){b.classList.remove('on');b.setAttribute('aria-pressed','false');}}}
  else tc.classList.remove('lcv-on');
  const t=d.getElementById('tl-tab-lcv'),t2=d.getElementById('l2t-lcv');
  if(t){t.classList.toggle('active',on);t.setAttribute('aria-pressed',on?'true':'false');if(on)t.classList.remove('lcv-new');}
  if(t2){t2.classList.toggle('on',on);t2.setAttribute('aria-pressed',on?'true':'false');if(on)t2.classList.remove('lcv-new');}
  LCV.abSig='';}
function lcvAbInit(W){const d=W.document;if(W.__lcv&&d.getElementById('lcv-ab'))return true;
  const tc=d.querySelector('.timeline-card'),tabs=tc&&tc.querySelector('.tabs');if(!tc||!tabs||!W.ado||!W.ado.tl)return false;
  if(!d.getElementById('lcv-css')){const s=d.createElement('style');s.id='lcv-css';s.textContent=LCV_ABCSS;d.head.appendChild(s);}
  const b=d.createElement('button');b.type='button';b.className='tab';b.id='tl-tab-lcv';b.textContent='Diğer maçlar';b.setAttribute('aria-pressed','false');tabs.appendChild(b);
  const box=d.createElement('div');box.id='lcv-ab';box.setAttribute('role','region');box.setAttribute('aria-label','Diğer maçlar');tc.appendChild(box);
  const l2=d.getElementById('l2d-tabs');if(l2&&!d.getElementById('l2t-lcv')){const b2=d.createElement('button');b2.type='button';b2.id='l2t-lcv';b2.textContent='Diğer';b2.setAttribute('aria-pressed','false');l2.appendChild(b2);
    b2.addEventListener('click',()=>{try{const k=d.getElementById('l2t-key');if(k)k.click();}catch(_){}lcvAbSet(true);lcvTick();});
    const sp=d.createElement('div');sp.id='lcv-strip';sp.setAttribute('role','region');sp.setAttribute('aria-label','Diğer maçlar şeridi');l2.parentNode.insertBefore(sp,l2);
    try{if(localStorage.getItem('lcvStrip')==='0')sp.classList.add('lcv-shut');}catch(_){}
    sp.addEventListener('click',e=>{const x=e.target.closest('.lcv-x');if(x){const sh=sp.classList.toggle('lcv-shut');try{localStorage.setItem('lcvStrip',sh?'0':'1');}catch(_){}LCV.abSig='';lcvTick();return;}
      const k=d.getElementById('l2t-lcv');if(k)k.click();try{(d.getElementById('lcv-ab')||sp).scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_){}});}
  b.addEventListener('click',()=>{lcvAbSet(true);lcvTick();});
  box.addEventListener('click',e=>{const t=e.target.closest('[data-lcv]');if(!t)return;LCV.tab=t.getAttribute('data-lcv');LCV.abSig='';lcvTick();});
  /* diğer sekmeler seçilince bizim görünüm kapanır */
  W.__lcvTl=W.ado.tl;W.ado.tl=function(){if(LCV.abOn)lcvAbSet(false);return W.__lcvTl.apply(this,arguments);};
  for(const id of ['l2t-key','l2t-cm','l2t-xi','l2t-stats']){const e=d.getElementById(id);if(e)e.addEventListener('click',()=>{if(LCV.abOn)lcvAbSet(false);});}
  W.__lcv=1;LCV.abOn=false;return true;}
function lcvAb(st,fl){const W=typeof ABM!=='undefined'&&ABM.win;if(!W||!W.document)return;if(!lcvAbInit(W))return;const d=W.document;
  for(const id of ['tl-tab-lcv','l2t-lcv','lcv-strip']){const e=d.getElementById(id);if(e&&e.hidden)e.hidden=false;}
  const sig=[st.key,LCV.tab,LCV.abOn,lcvMinTxt(st),st.rows.map(r=>r.hg+'-'+r.ag).join(','),st.us.hg+'-'+st.us.ag,fl?fl.id:0].join('|');
  /* gol uyarısı saha kartının üstünde */
  let fe=d.getElementById('lcv-fl');
  if(fl){if(!fe){const host=d.querySelector('.pitch-card');if(host){fe=d.createElement('div');fe.id='lcv-fl';fe.setAttribute('role','status');if(getComputedStyle(host).position==='static')host.style.position='relative';host.appendChild(fe);}}
    if(fe&&fe.dataset.id!==String(fl.id)){fe.dataset.id=String(fl.id);fe.innerHTML=lcvFlashTxt(fl);fe.hidden=false;fe.style.animation='none';void fe.offsetWidth;fe.style.animation='';}
    if(!LCV.abOn){const t=d.getElementById('tl-tab-lcv'),t2=d.getElementById('l2t-lcv');if(t)t.classList.add('lcv-new');if(t2)t2.classList.add('lcv-new');}}
  else if(fe&&!fe.hidden)fe.hidden=true;
  if(sig===LCV.abSig)return;LCV.abSig=sig;
  const box=d.getElementById('lcv-ab');if(box&&LCV.abOn)box.innerHTML=lcvHeadHTML(st)+`<div class="lcv-body">${lcvBodyHTML(st)}</div>`;
  const sp=d.getElementById('lcv-strip');
  if(sp){const mt=lcvMinTxt(st),lg=lcvLastGoal(st),now=performance.now();
    sp.innerHTML=`<button type="button" class="lcv-sl" title="Diğer maçları aç">Diğer maçlar</button><div class="lcv-sc">${st.rows.map(r=>{const hot=LCV.hot&&LCV.hot[r.h+'|'+r.a]&&now-LCV.hot[r.h+'|'+r.a]<6000;return `<span class="lcv-ch${hot?' lcv-hot':''}">${esc(lcvShort(r.h))} <b>${st.started?r.hg+'-'+r.ag:'–'}</b> ${esc(lcvShort(r.a))}</span>`;}).join('')}<span class="lcv-ch"><i>${mt}</i></span></div><span class="lcv-sum">${fl?lcvFlashTxt(fl):esc(lg||`${st.rows.length} maç · ${mt}`)}</span><button type="button" class="lcv-x" aria-label="Şeridi daralt/genişlet" title="Daralt/genişlet">${sp.classList.contains('lcv-shut')?'▸':'▾'}</button>`;}}
/* test ve denetim: ekranda en son gösterilen skorlar ile lige yazılan sonuçlar */
LCV.dbg=()=>{const s=LCV.last;return s?{wi:s.wi,fin:s.fin,n:s.rows.length,cur:s.cur,sk:s.rows.map(r=>r[2]+'-'+r[3]+(r[4]?'('+r[4]+')':'')).join(' ')}:null;};
LCV.snap=()=>{try{lcvTick();}catch(e){}return LCV.dbg();};
LCV.compare=()=>{const s=LCV.last;if(!s)return {err:'gösterim yok'};const R=G.s.league===s.lid&&G.s.year===s.y?G.s.results[s.wi]:null;if(!R)return {err:'hafta kaydı yok',wi:s.wi,n:G.s.results.length};
  let diff=0;const bad=[];for(const [h,a,hg,ag] of s.rows){const r=R.find(q=>q[0]===h&&q[1]===a);if(!r||r[2]!==hg||r[3]!==ag){diff++;bad.push(`${h}-${a} ekran ${hg}-${ag} kayıt ${r?r[2]+'-'+r[3]:'yok'}`);}}
  return {wi:s.wi,fin:s.fin,n:s.rows.length,diff,bad};};
setInterval(()=>{try{lcvTick();}catch(e){}},450);
