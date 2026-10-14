/* ================= v157: lig fikstürü — tüm liglerde hafta hafta eşleşmeler ve skorlar, takım fikstürü; diğer liglerin fikstür/sonuç verisi kayıtta sıkıştırılır ================= */
/* Veri kaynağı (yeni veri üretilmez):
   - kendi ligin: G.s.fixtures / G.s.results / G.s.cal (oynadığın maçlar dahil, gerçek takvim)
   - diğer ligler: G.s.ol[lid] = {fx, res, cal} (156 olSync). Fikstür kayda özel karıştırılmış çift devreli lig usulüdür (çember yöntemi, ikinci devre ev/deplasman ters).
   Puan durumu her yerde bu sonuçlardan hesaplanır (tableOf), bu yüzden fikstürde görünen skorlar tabloyla çelişemez.
   Kayıt: G.s.ol JSON'a yazılırken lig başına kısa dizgelere sıkıştırılır (kulüp sırası + skor dizgesi), yüklenince açılır. Sezon bitince G.s yenilendiği için eski sezon zaten tutulmaz. */

/* ---------- kayıt sıkıştırma ---------- */
const FXK_A='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
/* çember yöntemi (makeFixtures + v118 tek sayı sarmalı ile aynı sonuç). Kayıttaki fikstürü yeniden üretmek için dondurulmuş kopya: DEĞİŞTİRME, eski kayıtlar buna dayanır.
   (Eşleşmezse fikstür kayda açıkça yazılır, bu yüzden makeFixtures ileride değişse de kayıt bozulmaz.) */
function fxkGen(ids){const a=ids.slice(),odd=a.length%2===1;if(odd)a.push(null);const n=a.length,R=[];
  for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){const x=a[i],y=a[n-1-i];rd.push(r%2?[y,x]:[x,y]);}R.push(odd?rd.filter(p=>p[0]!=null&&p[1]!=null):rd);a.splice(1,0,a.pop());}
  return R.concat(R.map(rd=>rd.map(([x,y])=>[y,x])));}
function fxkSame(A,B){if(A.length!==B.length)return false;for(let w=0;w<A.length;w++){const a=A[w],b=B[w];if(!a||!b||a.length!==b.length)return false;for(let j=0;j<a.length;j++)if(a[j][0]!==b[j][0]||a[j][1]!==b[j][1])return false;}return true;}
/* ilk haftadan çember sırası geri kurulur; tutmazsa ilk görülme sırası */
function fxkIds(fx){const all=[];const seen=new Set();for(const rd of fx)for(const [h,a] of rd)for(const t of [h,a])if(!seen.has(t)){seen.add(t);all.push(t);}
  const r0=fx[0]||[],N=all.length;if(!N)return {ids:all,gen:false};
  try{let a;if(N%2===0){a=new Array(N);r0.forEach(([x,y],i)=>{a[i]=x;a[N-1-i]=y;});}
    else{const n=N+1,inR0=new Set();a=new Array(n);a[n-1]=null;r0.forEach(([x,y],k)=>{a[k+1]=x;a[n-2-k]=y;inR0.add(x);inR0.add(y);});a[0]=all.find(t=>!inR0.has(t));a.pop();}
    if(a.every(t=>t!=null)&&new Set(a).size===N&&fxkSame(fxkGen(a),fx))return {ids:a,gen:true};}catch(e){}
  return {ids:all,gen:false};}
function fxkPack(o){
  if(!o||typeof o!=='object'||o.z===1||!Array.isArray(o.fx)||!Array.isArray(o.res)||!o.fx.length)return o;
  const {ids,gen}=fxkIds(o.fx);if(ids.length>FXK_A.length||ids.some(t=>typeof t!=='string'||t.includes(',')))return o;
  const ix=new Map(ids.map((t,i)=>[t,i]));const ch=i=>FXK_A[i];
  const rs=[];for(let w=0;w<o.res.length;w++){const r=o.res[w],f=o.fx[w];if(!Array.isArray(r)||!f||r.length!==f.length)return o;let s='';
    for(let j=0;j<r.length;j++){const m=r[j];if(!m||m.length!==4||m[0]!==f[j][0]||m[1]!==f[j][1])return o;const x=m[2],y=m[3];if(!(x>=0&&x<36&&y>=0&&y<36)||x%1||y%1)return o;s+=x.toString(36)+y.toString(36);}rs.push(s);}
  const out={};for(const k in o)if(k!=='fx'&&k!=='res'&&k!=='cal')out[k]=o[k];
  out.z=1;out.i=ids.join(',');if(!gen)out.f=o.fx.map(rd=>rd.map(([h,a])=>ch(ix.get(h))+ch(ix.get(a))).join('')).join(',');
  out.n=rs.length;out.r=rs.join(',');
  const cal=Array.isArray(o.cal)?o.cal:[];out.c=cal.every(d=>Number.isInteger(d)&&d>=0)?cal.map(d=>d.toString(36)).join('.'):cal;
  return out;}
function fxkUnpack(z){if(!z||z.z!==1)return z;const ids=z.i?String(z.i).split(','):[];
  const fx=z.f!=null?String(z.f).split(',').map(s=>{const rd=[];for(let j=0;j+1<s.length;j+=2)rd.push([ids[FXK_A.indexOf(s[j])],ids[FXK_A.indexOf(s[j+1])]]);return rd;}):fxkGen(ids);
  const rs=z.n?String(z.r||'').split(',').slice(0,z.n):[];
  const res=rs.map((s,w)=>(fx[w]||[]).map(([h,a],j)=>[h,a,parseInt(s[2*j],36)||0,parseInt(s[2*j+1],36)||0]));
  const cal=typeof z.c==='string'?(z.c?z.c.split('.').map(x=>parseInt(x,36)):[]):(Array.isArray(z.c)?z.c:[]);
  const o={};for(const k in z)if(!['z','i','f','n','r','c'].includes(k))o[k]=z[k];o.fx=fx;o.res=res;o.cal=cal;return o;}
/* G.s.ol kaba (JSON) yazılırken sıkıştırılır: tüm kayıt yolları JSON.stringify(G) kullanır */
function fxkBox(S){try{if(S&&S.ol&&typeof S.ol==='object'&&!Object.prototype.hasOwnProperty.call(S.ol,'toJSON'))
  Object.defineProperty(S.ol,'toJSON',{value:function(){const out={};for(const k of Object.keys(this)){try{out[k]=fxkPack(this[k]);}catch(e){out[k]=this[k];}}return out;},enumerable:false,configurable:true,writable:true});}catch(e){}}
function fxkOpen(S){if(!S||!S.ol||typeof S.ol!=='object'||Object.prototype.hasOwnProperty.call(S.ol,'toJSON'))return;
  for(const k of Object.keys(S.ol)){const o=S.ol[k];if(o&&o.z===1){try{S.ol[k]=fxkUnpack(o);}catch(e){delete S.ol[k];}}}fxkBox(S);}
olSync=(old=>function(lid){try{if(G&&G.s)fxkOpen(G.s);}catch(e){}const o=old.apply(this,arguments);try{fxkBox(G.s);}catch(e){}return o;})(olSync);
lgFinalTable=(old=>function(lid,prev){try{fxkOpen(prev);}catch(e){}return old.apply(this,arguments);})(lgFinalTable);
svParse=(old=>function(){const g=old.apply(this,arguments);try{if(g&&g.s)fxkOpen(g.s);}catch(e){}return g;})(svParse);
load=(old=>function(){const g=old.apply(this,arguments);try{if(g&&g.s)fxkOpen(g.s);}catch(e){}return g;})(load);

/* ---------- veri ---------- */
let FXV={m:'w',w:null,t:null,day:null,lid:null};
function fxLid(){const own=G.s.league;let l=(typeof VLG!=='undefined'&&VLG)||own;if(!LEAGUES[l])l=own;return l;}
function fxData(lid){const S=G.s;if(lid===S.league)return {fx:S.fixtures||[],res:S.results||[],cal:S.cal||[],own:true};const o=olSync(lid);return {fx:o.fx||[],res:o.res||[],cal:o.cal||[],own:false};}
/* şimdiki hafta: son oynanan hafta en çok 3 gün önceyse o, değilse sıradaki */
function fxCurW(D){const n=D.res.length,R=D.fx.length;if(!R)return 1;if(n>=R)return R;if(!n)return 1;const ld=D.cal[n-1];return ld!=null&&G.s.day-ld<=3?n:n+1;}
function fxRes(D,w,h,a){const rd=D.res[w];if(!rd)return null;const m=rd.find(x=>x[0]===h&&x[1]===a);return m?[m[2],m[3]]:null;}
function fxLgList(){const own=G.s.league,L=WORLD.filter(l=>LEAGUES[l]&&(l===own||!LEAGUES[l].youth)&&(l===own||leagueClubs(l).length>=4));const by={};
  for(const l of L){const cc=LEAGUES[l].cc||'TR';(by[cc]=by[cc]||[]).push(l);}
  const order=Object.keys(CC).filter(c=>by[c]);for(const c of Object.keys(by))if(!order.includes(c))order.push(c);const occ=LEAGUES[own].cc||'TR';
  order.sort((a,b)=>(b===occ)-(a===occ));for(const c of order)by[c].sort((a,b)=>(LEAGUES[b].tier-LEAGUES[a].tier)||String(LEAGUES[a].name).localeCompare(String(LEAGUES[b].name),'tr'));
  return order.map(c=>[c,by[c]]);}
const fxDt=d=>{try{return fmtDate(dateOf(d));}catch(e){return '';}};
const fxCr=(id,s)=>{const c=CLUBS[id];return c?crestSVG(c,s):'';};
const fxNm=id=>{const c=CLUBS[id];return c?esc(c.name):'?';};

/* ---------- görünüm ---------- */
function fxPicker(lid){const own=G.s.league;
  return `<section class="panel fx-pick"><label class="fx-lab" for="fxLg">Lig</label><select id="fxLg" class="fx-sel" data-fxchg="lid">${fxLgList().map(([cc,ls])=>`<optgroup label="${esc(CC[cc]||cc)}">${ls.map(l=>`<option value="${l}" ${l===lid?'selected':''}>${l===own?'● ':''}${esc(LEAGUES[l].name)}</option>`).join('')}</optgroup>`).join('')}</select>
    <div class="seg2 fx-mode">${lid!==own?`<button class="chip" data-act="fxLg" data-l="${own}">● Benim ligim</button>`:''}<button class="chip" data-act="fxM" data-m="w" aria-pressed="${FXV.m!=='t'}">Haftalık</button><button class="chip" data-act="fxM" data-m="t" aria-pressed="${FXV.m==='t'}">Takım fikstürü</button></div></section>`;}
function fxTableHTML(lid,D,upto,hl){const tb=tableOf(lid,D.res.slice(0,upto));if(!tb.length)return '';const n=tb.length;
  return `<div class="tbl-wrap"><table class="fx-tb"><thead><tr><th>#</th><th class="l">Takım</th><th>O</th><th>AV</th><th>P</th></tr></thead><tbody>${tb.map((r,i)=>`<tr class="clk ${r.id===G.club?'me':''} ${hl&&hl.has(r.id)?'hl':''}" data-act="club" data-id="${r.id}"><td>${i+1}</td><td class="l club">${fxCr(r.id,16)}<span>${fxNm(r.id)}</span></td><td>${r.o}</td><td>${r.a-r.y>0?'+':''}${r.a-r.y}</td><td class="pts">${r.p}</td></tr>`).join('')}</tbody></table></div>`;}
function fxWeekHTML(lid,D){const R=D.fx.length,cur=fxCurW(D),w=clamp(FXV.w||cur,1,R),rd=D.fx[w-1]||[],day=D.cal[w-1],pl=w<=D.res.length;
  let gl=0,hw=0,dr=0,aw=0;const rows=rd.map(([h,a])=>{const r=pl?fxRes(D,w-1,h,a):null,me=h===G.club||a===G.club;if(r){gl+=r[0]+r[1];if(r[0]>r[1])hw++;else if(r[0]<r[1])aw++;else dr++;}
    const wh=r&&r[0]>r[1],wa=r&&r[1]>r[0];
    return `<div class="fx-m ${me?'me':''} ${r?'pl':'up'}"><button class="fx-t h ${wh?'w':''}" data-act="club" data-id="${h}"><span>${fxNm(h)}</span>${fxCr(h,22)}</button><span class="fx-s">${r?`<b>${r[0]}</b><i>–</i><b>${r[1]}</b>`:`<small>${esc(fxDt(day).split(' ').slice(0,3).join(' '))}</small>`}</span><button class="fx-t a ${wa?'w':''}" data-act="club" data-id="${a}">${fxCr(a,22)}<span>${fxNm(a)}</span></button></div>`;}).join('');
  const inR=new Set(rd.flat()),bye=leagueClubs(lid).filter(c=>!inR.has(c.id));
  const sum=pl?`<b>${rd.length}</b> maç · <b>${gl}</b> gol (maç başı ${(gl/Math.max(1,rd.length)).toFixed(1)}) · ev ${hw} · beraberlik ${dr} · deplasman ${aw}`:`<b>${rd.length}</b> maç · ${esc(fxDt(day))} · henüz oynanmadı`;
  const chips=D.fx.map((_,i)=>`<button class="chip fx-c ${i<D.res.length?'pl':''} ${i+1===cur?'now':''}" data-act="fxW" data-w="${i+1}" aria-pressed="${i+1===w}" aria-label="${i+1}. hafta">${i+1}</button>`).join('');
  const T=D.res.length?`<section class="panel fx-side"><details class="fx-det" ${FXV.tb?'open':''}><summary><span>Puan durumu</span><small>${Math.min(w,D.res.length)}. hafta sonu · bu haftanın skorlarından hesaplanır</small></summary>${fxTableHTML(lid,D,Math.min(w,D.res.length),new Set(rd.flat()))}</details></section>`:'';
  return `<section class="panel fx-week fx-sw"><div class="fx-nav"><button class="btn ghost fx-ar" data-act="fxW" data-d="-1" ${w<=1?'disabled':''} aria-label="Önceki hafta">◀</button>
      <div class="fx-wt"><b>${w}. Hafta</b><small>${esc(fxDt(day))} · ${w}/${R}${pl?' · oynandı':w===D.res.length+1?' · sıradaki':''}</small></div>
      <button class="btn ghost fx-ar" data-act="fxW" data-d="1" ${w>=R?'disabled':''} aria-label="Sonraki hafta">▶</button></div>
    <div class="filt fx-wc">${chips}</div>
    <p class="fx-sum">${sum}${w!==cur?` <button class="btn ghost sm fx-now" data-act="fxW" data-w="${cur}">Bu haftaya git</button>`:''}</p>
    <div class="fx-list">${rows||'<p class="muted">Bu hafta maç yok.</p>'}</div>${bye.length?`<p class="muted fx-bye">Bay: ${bye.map(c=>esc(c.name)).join(', ')}</p>`:''}</section>${T}`;}
function fxTeamHTML(lid,D){const clubs=leagueClubs(lid).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'tr'));if(!clubs.length)return '';
  let t=FXV.t;if(!clubs.some(c=>c.id===t))t=clubs.some(c=>c.id===G.club)?G.club:(tableOf(lid,D.res)[0]||clubs[0]).id;
  const S={o:0,g:0,b:0,m:0,a:0,y:0},cur=fxCurW(D);
  const rows=D.fx.map((rd,i)=>{const f=rd.find(p=>p[0]===t||p[1]===t),day=D.cal[i];
    if(!f)return `<div class="fx-tr bay"><span class="wk">${i+1}</span><span class="dt">${esc(fxDt(day))}</span><span class="ha"></span><span class="muted">BAY</span><span class="fx-s">—</span></div>`;
    const home=f[0]===t,opp=home?f[1]:f[0],r=i<D.res.length?fxRes(D,i,f[0],f[1]):null;let cls='',sc=`<small>${esc(fxDt(day).split(' ').slice(0,3).join(' '))}</small>`;
    if(r){const u=home?r[0]:r[1],o=home?r[1]:r[0];S.o++;S.a+=u;S.y+=o;if(u>o){S.g++;cls='res-w';}else if(u<o){S.m++;cls='res-l';}else{S.b++;cls='res-d';}sc=`<b>${r[0]}–${r[1]}</b>`;}
    return `<div class="fx-tr ${r?'pl':'up'} ${i+1===cur?'now':''}"><span class="wk">${i+1}</span><span class="dt">${esc(fxDt(day))}</span><span class="ha ${home?'i':'d'}" title="${home?'İç saha':'Deplasman'}">${home?'İ':'D'}</span><button class="fx-t" data-act="club" data-id="${opp}">${fxCr(opp,20)}<span>${fxNm(opp)}</span></button><span class="fx-s ${cls}">${sc}</span></div>`;}).join('');
  const pos=tableOf(lid,D.res).findIndex(r=>r.id===t)+1;
  return `<section class="panel fx-team"><div class="fx-th">${fxCr(t,34)}<div><select class="fx-sel" data-fxchg="t" aria-label="Takım">${clubs.map(c=>`<option value="${c.id}" ${c.id===t?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
      <small>${S.o} maç · ${S.g}G ${S.b}B ${S.m}M · ${S.a}-${S.y} · ${S.g*3+S.b} puan${D.res.length&&pos?` · ${pos}. sırada`:''}</small></div><button class="btn ghost sm" data-act="club" data-id="${t}">Kulüp</button></div>
    <div class="fx-tl">${rows}</div><p class="muted fx-bye">İ: iç saha · D: deplasman. Her takım ligdeki diğer her takımla bir iç sahada, bir deplasmanda oynar.</p></section>`;}
function fxTabsRow(lid){const own=lid===G.s.league;return `<div class="filt">${LT_ALL.filter(([k])=>own||k!=='cup'&&k!=='avr').map(([k,l])=>`<button class="chip" data-act="ltab" data-k="${k}" aria-pressed="${LTAB===k}">${l}</button>`).join('')}</div>`;}
function viewFixtures(){if(!G||!G.s||!G.s.cal)return '<p class="muted">Fikstür sezon başlayınca açılır.</p>';
  if(FXV.day!==G.s.day||FXV.lid!==fxLid()){if(FXV.lid!==fxLid())FXV.t=null;FXV.w=null;FXV.day=G.s.day;FXV.lid=fxLid();}
  const lid=FXV.lid,L=LEAGUES[lid];let D;try{D=fxData(lid);}catch(e){console.warn(e);return `<h2 class="h">Fikstür</h2>${fxTabsRow(lid)}<p class="muted">Bu ligin fikstürü hazırlanamadı.</p>`;}
  const body=!D.fx.length?'<section class="panel"><p class="muted">Bu ligin fikstürü yok.</p></section>':FXV.m==='t'?fxTeamHTML(lid,D):fxWeekHTML(lid,D);
  return `<h2 class="h">Fikstür · ${esc(L.name)}</h2>${fxTabsRow(lid)}${fxPicker(lid)}<p class="muted fx-info">${leagueClubs(lid).length} takım · ${D.fx.length} hafta · ${D.res.length} hafta oynandı · çift devreli lig usulü${D.own?'':' · bu kariyere özel fikstür'}</p><div class="fx-grid ${FXV.m==='t'?'t':''}">${body}</div>`;}

/* ---------- bağlantılar ---------- */
if(!LT_ALL.some(x=>x[0]==='fx'))LT_ALL.splice(1,0,['fx','Fikstür']);
viewLeague=(old=>function(){if(LTAB==='fx'&&G&&G.s)return viewFixtures();let h=old.apply(this,arguments);
  try{if(!/data-act="ltab" data-k="fx"/.test(h))h=h.replace(/(<button class="chip" data-act="ltab" data-k="tbl"[^>]*>[^<]*<\/button>)/,`$1<button class="chip" data-act="ltab" data-k="fx" aria-pressed="false">Fikstür</button>`);
    if(!/data-k="fx"/.test(h)&&typeof VLG!=='undefined'&&VLG)h=h.replace(/(<\/h2>)/,`$1<p style="margin:0 2px 8px"><button class="btn ghost sm" data-act="ltab" data-k="fx">📅 Fikstür ve sonuçlar</button></p>`);}catch(e){}return h;})(viewLeague);
NICON.fix=NI('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M14 14h3M7 18h3"/>');
navCats=(old=>function(){const cats=old.apply(this,arguments);try{const it=['fix','Fikstür',{tab:'league',l:'fx'}];let done=false;
  for(const [,items] of cats){const i=items.findIndex(x=>x[0]==='league');if(i>=0&&!items.some(x=>x[0]==='fix')){items.splice(i+1,0,it);done=true;break;}}
  if(!done){const rk=cats.find(c=>c[0]==='Rekabet');if(rk&&!rk[1].some(x=>x[0]==='fix'))rk[1].unshift(it);}}catch(e){}return cats;})(navCats);
navOn=(old=>function(a){if(a&&a.tab==='league'&&a.l==='tbl'&&LTAB==='fx')return false;return old.apply(this,arguments);})(navOn);
ACTX.fxW=el=>{const D=fxData(FXV.lid||fxLid()),R=D.fx.length,cur=FXV.w||fxCurW(D);FXV.w=el.dataset.w?+el.dataset.w:clamp(cur+(+el.dataset.d||0),1,R);render();
  try{const b=document.querySelector('.fx-wc [aria-pressed="true"]');if(b)b.scrollIntoView({block:'nearest',inline:'center'});}catch(e){}};
ACTX.fxM=el=>{FXV.m=el.dataset.m==='t'?'t':'w';render();};
ACTX.fxLg=el=>{const l=el.dataset.l;VLG=l===G.s.league?null:l;LTAB='fx';TAB='league';render();window.scrollTo(0,0);};
document.addEventListener('change',e=>{const el=e.target&&e.target.closest&&e.target.closest('[data-fxchg]');if(!el||!G||!G.s)return;
  if(el.dataset.fxchg==='lid'){const l=el.value;if(LEAGUES[l]){VLG=l===G.s.league?null:l;LTAB='fx';}}else if(el.dataset.fxchg==='t')FXV.t=el.value;render();});
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('fx-det'))FXV.tb=d.open;},true);
/* telefonda kaydırma: maç listesinde sola/sağa kaydırınca hafta değişir */
(()=>{let x0=null,y0=0;document.addEventListener('touchstart',e=>{const t=e.target.closest&&e.target.closest('.fx-sw');if(!t||e.target.closest('.fx-wc')){x0=null;return;}x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.6)return;
    try{const D=fxData(FXV.lid||fxLid()),cur=FXV.w||fxCurW(D),nw=clamp(cur+(dx<0?1:-1),1,D.fx.length);if(nw!==cur){FXV.w=nw;render();}}catch(err){}},{passive:true});})();
/* seçili hafta çipi görünür kalsın */
render=(old=>function(){const r=old.apply(this,arguments);try{if(TAB==='league'&&LTAB==='fx'){const b=document.querySelector('.fx-wc [aria-pressed="true"]'),w=b&&b.parentElement;if(w)w.scrollLeft=Math.max(0,b.offsetLeft-w.clientWidth/2+b.offsetWidth/2);}}catch(e){}return r;})(render);
