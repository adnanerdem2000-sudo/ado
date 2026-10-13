/* ================= v34: tüm liglerde gol/asist krallığı · oyuncu kariyer geçmişi · transfer kayıtları ================= */
let CSE_C={};
function clubSeasonEst(cid){const S=G.s,c=CLUBS[cid];if(!S||!c)return {};let played=0;
  try{const tb=c.league===S.league?table():tableOf(c.league,olSync(c.league).res);const row=tb.find(x=>x.id===cid);played=row?row.o:0;}catch(e){}
  const key=[cid,S.year,played,Object.keys(G.tx||{}).length,c.league===S.league?Object.keys(S.ps||{}).length+'/'+S.week:''].join('|');if(CSE_C[cid]&&CSE_C[cid].key===key)return CSE_C[cid].M;
  const sq=squadOf(cid),xi=autoXI(sq),bench=sq.filter(q=>!xi.includes(q.k)).sort((a,b)=>b.ovr-a.ovr).slice(0,7).map(q=>q.k),M={};
  for(const p of sq){const r=srng(p.k+'ss'+S.year);r();r();let ap,st;
    if(xi.includes(p.k)){ap=Math.round(played*(0.8+0.18*r()));st=Math.max(0,ap-Math.round(r()*3));}else if(bench.includes(p.k)){ap=Math.round(played*(0.25+0.35*r()));st=Math.round(ap*0.3*r());}else{ap=Math.round(played*0.1*r());st=0;}
    const ps=S.ps&&S.ps[p.k],gr={FW:0.42,KN:0.24,OS:0.12,DF:0.04,KL:0}[p.pos]*(0.6+r()*0.8)*Math.max(0.4,1+(p.ovr-c.str)/12);
    const g=c.league===S.league&&ps?ps.g:Math.round(ap*gr*(st/Math.max(1,ap)*0.7+0.3)),a=c.league===S.league&&ps?ps.a:Math.round(ap*gr*0.7*(0.5+r()));
    const rt=ap?clamp(6.55+(p.ovr-c.str)*0.04+(g*0.12+a*0.07)/Math.max(1,ap)*3+(r()-0.5)*0.4,5.8,8.6):0;M[p.k]={p,ap,st,g,a,rt:rt*ap};}
  if(cid===G.club)for(const k in M){try{const t=seasonStats(M[k].p,cid);if(t&&t.tracked)M[k]=Object.assign({p:M[k].p},t);}catch(e){}}
  CSE_C[cid]={key,M};return M;}
function lgLeaders(lid,k){const out=[];for(const c of leagueClubs(lid)){const M=clubSeasonEst(c.id);for(const x of Object.values(M))if(x.ap)out.push(Object.assign({c:c.id},x));}
  if(isPl()&&lid===G.s.league){const st=G.s.stats||{};out.push({me:true,c:G.club,p:{k:'me',name:(G.p&&G.p.name)||(meN()),pos:(G.p&&G.p.pos)||'FW'},ap:st.apps||0,g:st.goals||0,a:st.assists||0,rt:(st.rsum||0)});}
  const key=k==='g'?'g':'a',alt=k==='g'?'a':'g';return out.sort((x,y)=>y[key]-x[key]||y[alt]-x[alt]||x.ap-y.ap);}
function leadersViewHTML(lid,k){const L=lgLeaders(lid,k),top=L.slice(0,25),mi=L.findIndex(x=>x.me);if(mi>=25)top.push(L[mi]);const S=G.s,o=lid===S.league?null:olSync(lid);
  const wk=lid===S.league?(S.results||[]).length:o.res.length,tot=lid===S.league?(S.fixtures||[]).length:o.fx.length;
  const head=`<tr><th>#</th><th class="l">Oyuncu</th><th class="l">Kulüp</th><th>Maç</th><th class="${k==='g'?'hl':''}">Gol</th><th class="${k==='a'?'hl':''}">Asist</th><th>${k==='g'?'Gol/M':'Asist/M'}</th><th>Ort.</th></tr>`;
  const rows=top.map(x=>{const r=L.indexOf(x)+1,c=CLUBS[x.c],v=k==='g'?x.g:x.a;return `<tr class="${x.me?'me':''} ${x.me?'':'clk'}" ${x.me?'':`data-act="pcard" data-id="${x.c}" data-k="${x.p.k}"`}><td>${r<=3?['🥇','🥈','🥉'][r-1]:r}</td><td class="l pl-n">${x.me?'':`<span class="tp">${dpTag(x.p)}</span>`}${esc(x.p.name)}</td><td class="l club">${crestSVG(c,16)}<span>${esc(c.short)}</span></td><td>${x.ap}</td><td class="${k==='g'?'pts':''}">${x.g}</td><td class="${k==='a'?'pts':''}">${x.a}</td><td>${x.ap?(v/x.ap).toFixed(2):'0'}</td><td>${x.ap&&x.rt?(x.rt/x.ap).toFixed(2):'–'}</td></tr>`;}).join('');
  return `<section class="panel"><p class="sub-h"><span>${k==='g'?'Gol krallığı':'Asist krallığı'} · ${esc(LEAGUES[lid].name)}</span><span>${wk}/${tot} hafta${lid===S.league?'':' · tahmini istatistik'}</span></p><div class="tbl-wrap"><table class="lgt ldr"><thead>${head}</thead><tbody>${rows||'<tr><td colspan="8" class="muted">Henüz maç oynanmadı.</td></tr>'}</tbody></table></div></section>`;}
const LT_ALL=[['tbl','Puan durumu'],['g','Gol krallığı'],['a','Asist krallığı'],['cup','Kupalar'],['avr','Avrupa'],['nk','Ulusal kupalar'],['kur','Kurallar']];
viewLeague=(old=>function(){if((LTAB==='g'||LTAB==='a')&&G&&G.s){const lid=VLG||G.s.league,own=lid===G.s.league;
    const lt=`<div class="filt">${LT_ALL.filter(([k])=>own||k!=='cup'&&k!=='avr').map(([k,l])=>`<button class="chip" data-act="ltab" data-k="${k}" aria-pressed="${LTAB===k}">${l}</button>`).join('')}</div>`;
    return `<h2 class="h">${esc(LEAGUES[lid].name)}</h2>${worldChips()}${lt}${leadersViewHTML(lid,LTAB)}`;}
  return old.apply(this,arguments);})(viewLeague);
viewWorld=(old=>function(lid){let h=old.apply(this,arguments);if(!/data-k="g"/.test(h))h=h.replace(/(data-k="tbl"[^>]*>Puan durumu<\/button>)/,`$1<button class="chip" data-act="ltab" data-k="g" aria-pressed="false">Gol krallığı</button><button class="chip" data-act="ltab" data-k="a" aria-pressed="false">Asist krallığı</button>`);return h;})(viewWorld);

/* ---------- transfer kayıtları ---------- */
function txNote(k,to,fee){try{if(!G||!k)return;const p=pByKey(k);if(!p)return;G.txh=G.txh||{};const L=G.txh[k]=G.txh[k]||[];const from=L.length?L[L.length-1].to:p.home;if(from===to)return;
    const m=G.m,n=m&&m.neg&&m.neg.k===k?m.neg:null;let e={y:G.s?G.s.year:2026,d:G.s?G.s.day:0,from,to};
    if(n&&n.type==='loan'&&to===G.club)e.loan=1;else if(n&&n.type==='free')e.free=1;else if(m&&m.loans&&m.loans[k]&&to===G.club&&!n)e.loan=1;
    else if(L.length&&L[L.length-1].loan&&L[L.length-1].from===to)e.ret=1;
    else if(n&&n.o&&n.o.fee)e.fee=Math.round(n.o.fee);else if(fee===-1)e.free=1;else if(fee!=null)e.fee=Math.round(fee);else e.fee=Math.round(pValue(p)*(0.85+0.3*srng(k+'fee'+(G.s?G.s.day:0))())/1e4)*1e4;
    L.push(e);if(L.length>12)L.shift();}catch(err){console.warn(err);}}
function txUnnote(k,to){const L=G.txh&&G.txh[k];if(L&&L.length&&L[L.length-1].to===to)L.pop();}
/* ---------- kariyer geçmişi ---------- */
function phArchive(){const S=G.s;if(!S||!S.cal||S.phArch)return;S.phArch=1;G.ph=G.ph||{};
  for(const c of Object.values(CLUBS)){const L=LEAGUES[c.league];if(!L||L.youth||L.tier<6)continue;let M;try{M=clubSeasonEst(c.id);}catch(e){continue;}
    for(const [k,x] of Object.entries(M)){if(!x.ap)continue;const a=G.ph[k]=G.ph[k]||[];if(a.some(z=>z[0]===S.year))continue;a.push([S.year,c.id,x.ap,x.g,x.a,Math.round((x.rt/x.ap)*100)]);}}
  for(const k in G.ph){G.ph[k]=G.ph[k].filter(z=>z[0]>S.year-8);if(!G.ph[k].length)delete G.ph[k];}}
newSeason=(old=>function(y){try{if(G&&G.s&&G.s.cal&&G.s.year<y)phArchive();}catch(e){console.warn(e);}CSE_C={};return old.apply(this,arguments);})(newSeason);
const CC_OF_NAT={TUR:'TR',ENG:'EN',ESP:'ES',ITA:'IT',GER:'DE',FRA:'FR',POR:'PT',NED:'NL',BEL:'BE',KSA:'SA',BRA:'BR',SCO:'SC',GRE:'GR',AUT:'AT',SUI:'CH',DEN:'DK'};
/* gerçek kariyer verisi (CARD) → sezonlar ve transferler */
let CAR_IDX=null;const CAR_AL={bayernmunich:'Bayern München',intermilan:'Inter',internazionale:'Inter',acmilan:'Milan',psg:'Paris Saint-Germain',parissaintgermain:'Paris Saint-Germain',manutd:'Manchester United',tottenham:'Tottenham Hotspur'};
function carId(i){if(!CAR_IDX){CAR_IDX={};const all=Object.values(CLUBS).concat(Object.values(EXT));for(const c of all){CAR_IDX[euNorm(c.name)]=c.id;}}const nm=CAR_CL[i],n=euNorm(nm),al=CAR_AL[n];
  if(CAR_IDX[n])return CAR_IDX[n];if(al&&CAR_IDX[euNorm(al)])return CAR_IDX[euNorm(al)];const n2=n.replace(/^(fc|vfl|vfb|sv|sc|ac|as|ss|us|rc|cd|ud|sd|ca|cf|rcd|tsg|1fc|ogc|aj)/,'').replace(/(fc|cf|sk|calcio|1907|1909|1913|1903)$/,'');if(n2&&CAR_IDX[n2])return CAR_IDX[n2];
  for(const k in CAR_IDX)if(n2.length>4&&(k.startsWith(n2)||n2.startsWith(k)&&k.length>4))return CAR_IDX[k];return 'n:'+nm;}
function carReal(p){const d=CARD[p.name];if(!d||!String(p.k).includes('#'))return null;const E=d.split(';').map(x=>{const a=x.split(',');return {y:2000+(+a[0]),cid:carId(+a[1]),t:a[2],fee:a[3]!=null?+a[3]*1e6:null};});return E;}
function phReal(p,E){const Y0=2026,age=p.age-((G.s?G.s.year:Y0)-Y0),r=srng(p.k+'prer');r();const out=[],tr=[];
  for(let j=0;j<E.length;j++){const e=E[j],y1=j+1<E.length?E[j+1].y:Y0;for(let y=Math.max(e.y,Y0-14);y<Math.min(y1,Y0);y++){const ageT=age-(Y0-y);if(ageT<16)continue;
      const ovrT=clamp(p.ovr-Math.max(0,27-ageT)*1.7-(Y0-y)*0.2,45,95),C=clubObj(e.cid),cs=C?C.str:clamp(ovrT-2,55,80);
      const ap=Math.max(0,Math.round((ageT<20?10:20)+r()*18+(ovrT-cs)*0.9)),gr={FW:0.46,KN:0.26,OS:0.13,DF:0.045,KL:0}[p.pos]*(0.7+r()*0.6)*clamp((ovrT-52)/26,0.35,1.6)*Math.max(0.6,1+(ovrT-cs)/20);
      const g=Math.round(ap*gr),a=Math.round(ap*gr*0.6*(0.5+r())),rt=ap?clamp(6.5+(ovrT-cs)*0.04+(g*0.12+a*0.07)/Math.max(1,ap)*3+(r()-0.5)*0.4,5.9,8.4):0;
      const prev=out.find(x=>x.y===y);if(prev){prev.ap+=Math.round(ap/2);continue;}out.push({y,cid:e.cid,ap:Math.min(ap,46),g,a,rt,loan:e.t==='L',pre:1});}
    if(j>0){const pv=E[j-1];tr.push({y:e.y,from:pv.cid,to:e.cid,loan:e.t==='L'?1:0,ret:e.t==='R'?1:0,free:e.t==='F'?1:0,fee:e.t==='T'?e.fee:null,nd:e.t==='T'&&e.fee==null?1:0,pre:1});}}
  return {s:out,t:tr,real:1};}
/* oyun başlamadan önceki sezonlar (tahmini) */
function phPre(p){{const E=carReal(p);if(E)return phReal(p,E);}if(!p||!String(p.k).includes('#'))return [];const r=srng(p.k+'pre');r();r();const Y0=(G.ph0Y||2026),age=p.age-((G.s?G.s.year:Y0)-Y0),n=Math.max(0,Math.min(age-18,12));if(!n)return [];
  const home=CLUBS[p.home],hcc=home?ccOf(home):'TR',ncc=CC_OF_NAT[p.nat]||hcc,out=[];
  const stay=age<=21?n:Math.min(n,1+Math.floor(r()*Math.min(5,n)));let club=p.home,i=n;const seq=[];
  for(let s=0;s<stay;s++)seq.unshift(p.home);
  while(seq.length<n){const yrs=Math.min(n-seq.length,1+Math.floor(r()*3)),ago=n-seq.length,ovrT=clamp(p.ovr-Math.max(0,27-(age-ago))*1.7-ago*0.3,48,95);
    const cc=r()<0.6?ncc:hcc,pool=Object.values(CLUBS).filter(c=>ccOf(c)===cc&&!LEAGUES[c.league].youth&&c.id!==seq[0]&&Math.abs(c.str-ovrT)<6);
    const pool2=pool.length?pool:Object.values(CLUBS).filter(c=>!LEAGUES[c.league].youth&&c.id!==seq[0]&&Math.abs(c.str-ovrT)<7);const c=pool2.length?pool2[Math.floor(r()*pool2.length)].id:p.home;
    for(let s=0;s<yrs;s++)seq.unshift(c);}
  /* genç yaşta kiralık */
  const loanAt=age<=24&&r()<0.45?Math.floor(r()*Math.min(3,n)):-1;
  for(let j=0;j<n;j++){const yr=Y0-n+j,ageT=age-(n-j),ovrT=clamp(p.ovr-Math.max(0,27-ageT)*1.7-(n-j)*0.3,45,95);let cid=seq[j],loan=false;
    if(j===loanAt&&CLUBS[cid]){const lp=Object.values(CLUBS).filter(c=>ccOf(c)===ccOf(CLUBS[cid])&&c.id!==cid&&!LEAGUES[c.league].youth&&c.str<CLUBS[cid].str-2&&c.str>CLUBS[cid].str-12);if(lp.length){cid=lp[Math.floor(r()*lp.length)].id;loan=true;}}
    const C=CLUBS[cid],cs=C?C.str:65,ap=Math.max(0,Math.round((ageT<20?8:18)+r()*20+(ovrT-cs)*0.9)),gr={FW:0.42,KN:0.24,OS:0.12,DF:0.04,KL:0}[p.pos]*(0.6+r()*0.8)*Math.max(0.4,1+(ovrT-cs)/12);
    const g=Math.round(ap*gr*0.8),a=Math.round(ap*gr*0.6*(0.5+r())),rt=ap?clamp(6.5+(ovrT-cs)*0.04+(g*0.12+a*0.07)/Math.max(1,ap)*3+(r()-0.5)*0.4,5.9,8.4):0;
    out.push({y:yr,cid,ap:Math.min(ap,46),g,a,rt,loan,pre:1});}
  /* transferler: kulüp değişimleri */
  const tr=[];for(let j=1;j<out.length;j++){const a=out[j-1],b=out[j];if(a.cid===b.cid)continue;const ago=out.length-j,ageT=age-ago;
    if(b.loan)tr.push({y:b.y,from:seq[j],to:b.cid,loan:1,pre:1});else if(a.loan&&seq[j-1]===b.cid)tr.push({y:b.y,from:a.cid,to:b.cid,ret:1,pre:1});
    else{const free=r()<0.14&&ageT>=24,fee=free?0:Math.round(pValue(p)*Math.pow(0.86,ago)*(0.5+r()*0.7)*(ageT<22?0.6:1)/5e4)*5e4;tr.push({y:b.y,from:a.cid,to:b.cid,fee,free:free?1:0,pre:1});}}
  return {s:out,t:tr};}
function careerOf(p){const pre=phPre(p)||{s:[],t:[]},S=G.s,rows=[];(pre.s||[]).forEach(x=>rows.push(x));
  for(const z of (G.ph&&G.ph[p.k])||[])rows.push({y:z[0],cid:z[1],ap:z[2],g:z[3],a:z[4],rt:z[5]/100});
  try{const cid=(G.tx&&G.tx[p.k])||p.home,M=clubSeasonEst(cid)[p.k];if(M&&S&&!rows.some(x=>x.y===S.year))rows.push({y:S.year,cid,ap:M.ap,g:M.g,a:M.a,rt:M.ap?M.rt/M.ap:0,cur:1});}catch(e){}
  const tx=(pre.t||[]).concat(((G.txh&&G.txh[p.k])||[]).map(e=>Object.assign({},e)));
  /* kiralık sezonları işaretle */
  for(const e of tx)if(e.loan&&!e.pre){const r=rows.find(x=>x.y===e.y&&x.cid===e.to);if(r)r.loan=true;}
  return {real:!!pre.real,rows:rows.sort((a,b)=>b.y-a.y),tx:tx.sort((a,b)=>(b.y-a.y)||((b.d||0)-(a.d||0)))};}
function pCareerHTML(p){const C=careerOf(p);if(!C.rows.length&&!C.tx.length)return '';const sum=C.rows.reduce((a,x)=>{a.ap+=x.ap;a.g+=x.g;a.a+=x.a;a.rt+=x.rt*x.ap;return a;},{ap:0,g:0,a:0,rt:0});
  const cl=id=>{if(typeof id==='string'&&id.startsWith('n:'))return `<i class="kr-dot"></i><span>${esc(id.slice(2))}</span>`;const c=clubObj(id);return c?`${crestSVG(c,14)}<span>${esc(c.short||c.name)}</span>`:'—';};
  const lg=id=>{const c=typeof id==='string'?CLUBS[id]:null;return c&&LEAGUES[c.league]?esc(LEAGUES[c.league].short):'';};
  const rows=C.rows.map(x=>`<tr class="${x.cur?'cur':''}"><td class="l">${seasonLabel(x.y)}${x.cur?' <em>sürüyor</em>':''}</td><td class="l club">${cl(x.cid)}${x.loan?'<i class="kr-loan">kiralık</i>':''}</td><td class="l">${lg(x.cid)}</td><td>${x.ap}</td><td>${p.pos==='KL'?'–':x.g}</td><td>${x.a}</td><td>${x.ap&&x.rt?(+x.rt).toFixed(2):'–'}</td></tr>`).join('');
  const txr=C.tx.map(e=>`<li><span class="kr-y">${seasonLabel(e.y)}</span><span class="kr-c">${cl(e.from)}<b>→</b>${cl(e.to)}</span><em class="${e.loan?'ln':e.ret?'rt':e.free?'fr':'fe'}">${e.loan?'Kiralık':e.ret?'Kiralıktan dönüş':e.free?'Bonservissiz':e.nd||!e.fee?'Bedel açıklanmadı':eur(e.fee)}</em></li>`).join('');
  return `<section class="fmp-krx"><p class="fmp-sec">Kariyer geçmişi <small>· ${C.real?'kulüpler ve bonservisler gerçek kariyerden; oyun öncesi maç istatistikleri tahmini':C.rows.some(x=>x.pre)?'oyun öncesi sezonlar tahmini':'oyun içi kayıt'}</small></p>
   <div class="kr-grid"><div class="tbl-wrap"><table class="kr-t"><thead><tr><th class="l">Sezon</th><th class="l">Kulüp</th><th class="l">Lig</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th></tr></thead><tbody>${rows}</tbody>
   <tfoot><tr><td class="l" colspan="3">Kariyer toplamı</td><td>${sum.ap}</td><td>${p.pos==='KL'?'–':sum.g}</td><td>${sum.a}</td><td>${sum.ap?(sum.rt/sum.ap).toFixed(2):'–'}</td></tr></tfoot></table></div>
   <div><p class="fmh" style="margin:0 0 6px">Transferler</p>${txr?`<ul class="kr-tx">${txr}</ul>`:'<p class="muted">Kariyeri boyunca tek kulüpte.</p>'}</div></div></section>`;}
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);if(opt&&opt.acad)return h;try{const kr=pCareerHTML(p);if(!kr)return h;
    h=h.replace('<button data-act="fmpTab" data-k="po">Pozisyonlar</button>','<button data-act="fmpTab" data-k="po">Pozisyonlar</button><button data-act="fmpTab" data-k="kr">Kariyer</button>');
    const i=h.indexOf('<p class="fmp-sec">');h=i<0?h+kr:h.slice(0,i)+kr+h.slice(i);}catch(e){console.warn(e);}return h;})(fmProfHTML);
/* ---------- listelerde sıralama (transfer, gözlem ağı, izleme listesi, akademi) ---------- */
let LSORT={k:'',d:-1};
const LS_KEYS=[['','Varsayılan'],['ovr','Güç'],['pot','Potansiyel'],['age','Yaş'],['val','Fiyat'],['pos','Mevki'],['name','İsim']];
function lsVal(row,k){const b=row.matches('[data-k]')?row:row.querySelector('[data-k]'),p=b&&pByKey(b.dataset.k);
  if(k==='ovr'){const t=row.querySelector('.to b,.ov,em.ov');const m=t&&t.textContent.match(/\d+/g);return m?m.map(Number).reduce((a,x)=>a+x,0)/m.length:(p?p.ovr:-1);}
  if(k==='pot'){const t=row.querySelector('.to small');const m=t&&t.textContent.match(/\d+/g);return m?m.map(Number).reduce((a,x)=>a+x,0)/m.length:-1;}
  if(!p)return k==='name'?'':-1;if(k==='age')return p.age;if(k==='val')return pValue(p);if(k==='pos'){try{return -DP_ORDER.indexOf(dpMain(p));}catch(e){return 0;}}if(k==='name')return p.name;return 0;}
function lsApply(root){try{root=root||document;const groups=new Map();root.querySelectorAll('.trrow[data-k]').forEach(b=>{const row=b.parentElement.classList.contains('scrow')?b.parentElement:b;const par=row.parentElement;if(!par)return;if(!groups.has(par))groups.set(par,[]);groups.get(par).push(row);});
  for(const [par,rows] of groups){if(rows.length<3)continue;rows.forEach((r,i)=>{if(r.dataset.oi==null)r.dataset.oi=i;});
    if(!par.previousElementSibling||!par.previousElementSibling.classList.contains('srt-bar')){if(par.firstElementChild===rows[0])par.insertAdjacentHTML('beforebegin',lsBar());else rows[0].insertAdjacentHTML('beforebegin',lsBar());}
    if(!LSORT.k)continue;const k=LSORT.k,d=LSORT.d,v=rows.map(r=>[r,lsVal(r,k)]);v.sort((a,b)=>k==='name'?d*String(a[1]).localeCompare(String(b[1]),'tr'):-d*(b[1]-a[1]));const anchor=rows[rows.length-1].nextSibling;v.forEach(([r])=>par.insertBefore(r,anchor));}}catch(e){console.warn(e);}}
function lsBar(){return `<div class="srt-bar"><span>Sırala</span>${LS_KEYS.map(([k,l])=>`<button class="chip sm" data-act="lsSort" data-k="${k}" aria-pressed="${LSORT.k===k}">${l}${LSORT.k===k&&k?(LSORT.d<0?' ↓':' ↑'):''}</button>`).join('')}</div>`;}
ACTX.lsSort=el=>{const k=el.dataset.k;if(LSORT.k===k&&k)LSORT.d=-LSORT.d;else LSORT={k,d:k==='age'||k==='name'||k==='val'?1:-1};const inModal=!!el.closest('#modalCard');
  document.querySelectorAll('.srt-bar').forEach(b=>b.outerHTML=lsBar());if(!LSORT.k){if(inModal){const rows=[...document.querySelectorAll('#modalCard [data-oi]')];rows.sort((a,b)=>a.dataset.oi-b.dataset.oi).forEach(r=>r.parentElement.appendChild(r));}else render();return;}lsApply(inModal?$('#modalCard'):document);};
render=(old=>function(){const r=old.apply(this,arguments);lsApply(document.querySelector('#view')||document);return r;})(render);
openModal=(old=>function(){const r=old.apply(this,arguments);try{lsApply($('#modalCard'));}catch(e){}return r;})(openModal);

