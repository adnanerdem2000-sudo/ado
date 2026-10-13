/* ================= v128: gerçek kariyer geçmişi ve boylar — FotMob verisi (Ekim 2026) · rastgele oyun öncesi kariyer kaldırıldı =================
   FMK_Z (game/data/fm_kariyer.js) sayfa açılınca arka planda açılır. Oyuncu kaydı: kulüp (p.home) + ad.
   - Kariyer: sezon sezon gerçek kulüp, lig, maç, gol, asist, reyting; kiralıklar, dönüşler, bonservisler (bedeller SofaScore'dan, yoksa CARD'dan).
   - Boy: FotMob boyu HW_REAL/LOOKS'tan önce gelir. Hiçbir kaynakta yoksa boy tahminidir ve "tahmini" diye gösterilir.
   - Milli maç: gerçek A milli takım maç/gol sayısı.
   - Tercih edilen ayak (FOOT_DB'de olmayanlara) ve yer tutucu/yanlış kadro yaşlarının düzeltmesi (doğum tarihinden).
   - Verisi olmayan oyuncuya rastgele geçmiş uydurulmaz: yalnız oyun içi sezonları görünür. */
const FMK={ready:false,c:[],l:[],p:{}},FMK_PC={};
const FMK_PAL=[['#1f3a68','#ffffff'],['#a3122a','#ffffff'],['#0f6b3a','#ffffff'],['#f2c200','#14213d'],['#2b2b2b','#e5e5e5'],['#5b2a86','#ffffff'],['#0a7cc2','#ffffff'],['#d35400','#ffffff'],['#7a0019','#f2c200'],['#006d77','#ffffff']];
function fmkXid(i){const c=FMK.c[i];return c&&c[2]?'fm'+c[2]:'fmx'+i;}
function fmkShort(n){const w=String(n).replace(/\b(FC|FK|SK|CF|AFC|SC|AC|CD|SD|UD|NK|BK|IF|SV|VfL|VfB|TSV|Club|Clube|de|del|da|do)\b\.?/g,' ').replace(/\s+/g,' ').trim();return w.length<=16?w:w.split(' ').slice(0,2).join(' ');}
/* tercih edilen ayak (FOOT_DB'de yoksa) ve açıkça yanlış kadro yaşları; önbellekler temizlenir */
function fmkFix(){let n=0;for(const [cid,o] of Object.entries(FMK.p)){const sq=SQ_REAL[cid];for(const [nm,s] of Object.entries(o)){const f=s.split('|')[4];if(!f)continue;
    if(/^[LRB]/.test(f)&&typeof FOOT_DB!=='undefined'&&!FOOT_DB[nm])FOOT_DB[nm]=f[0];
    const ag=parseInt(f.replace(/^[LRB]/,''),10);if(ag&&Array.isArray(sq)){const r=sq.find(x=>x[0]===nm);if(r&&r[2]!==ag){r[2]=ag;n++;}}}}
  if(n){try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}try{for(const k in POT_C)delete POT_C[k];}catch(e){}}return n;}
function fmkReady(){try{fmkFix();}catch(e){console.warn('FMK yaş/ayak',e);}try{for(const k in DP_C)delete DP_C[k];}catch(e){}for(let i=0;i<FMK.c.length;i++){const [n,g]=FMK.c[i];if(g&&clubObj(g))continue;const id=fmkXid(i);if(EXT[id])continue;const P=FMK_PAL[hash(n)%FMK_PAL.length];
  EXT[id]={id,name:n,short:fmkShort(n),c1:P[0],c2:P[1],str:60,str0:60,nat:'',ext:true,fx:1};}}
(function(){try{if(typeof FMK_Z==='undefined'||typeof DecompressionStream==='undefined')return;const b=atob(FMK_Z),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(t=>{const d=JSON.parse(t);FMK.c=d.c;FMK.l=d.l;FMK.p=d.p;fmkReady();FMK.ready=true;}).catch(e=>console.warn('FMK',e));}catch(e){console.warn('FMK',e);}})();
function fmkRec(p){if(!FMK.ready||!p||p.k==='ME'||p.ng||p.regen)return null;const nm=String(p.name||'').replace(/^\d+\.\s*/,'');let home=p.home;if(!home&&p.k){const m=/^(.+)#/.exec(p.k);if(m)home=m[1];}
  const C=FMK.p[home],s=C&&C[nm];if(!s)return null;const key=home+'|'+nm;if(FMK_PC[key])return FMK_PC[key];
  const [h,S,M,N,,PS]=s.split('|');
  /* sezon: yıl farkı,kulüp36,maç,gol,asist,reyting*100,lig36[,L] (yeni → eski) · transfer: yıl-1980,kimden36,kime36,tür[bedel bin €] (eski → yeni) */
  let py=1980;const se=S?S.split(';').map((x,o)=>{const a=x.split(','),y=o?py-(+a[0]):1980+(+a[0]);py=y;return {y,ci:parseInt(a[1],36),ap:+a[2],g:+a[3],a:+a[4],rt:a[5]?+a[5]/100:0,lg:a[6]?FMK.l[parseInt(a[6],36)]||'':'',loan:a[7]==='L',o};}):[];
  const mv=M?M.split(';').map((x,d)=>{const a=x.split(',');return {y:1980+(+a[0]),d,f:parseInt(a[1],36),t:parseInt(a[2],36),tp:a[3][0],fee:a[3].length>1?+a[3].slice(1)*1000:null};}):[];
  const nc=N?N.split(',').map(Number):null;
  return FMK_PC[key]={h:+h||0,se,mv,nc,pos:PS?PS.split(','):null};}
function fmkClub(i){const c=FMK.c[i];if(!c)return null;return c[1]&&clubObj(c[1])?c[1]:fmkXid(i);}
function fmkCareer(p,R){
  const s=R.se.map(x=>({y:x.y,cid:fmkClub(x.ci),ap:x.ap,g:x.g,a:x.a,rt:x.rt,loan:x.loan,lgn:x.lg,pre:1,o:x.o}));
  const t=R.mv.map(m=>({y:m.y,d:m.d,from:fmkClub(m.f),to:fmkClub(m.t),loan:m.tp==='L'?1:0,ret:m.tp==='R'?1:0,free:m.tp==='F'?1:0,fee:(m.tp==='T'||m.tp==='L')&&m.fee?m.fee:null,nd:m.tp==='T'&&!m.fee?1:0,pre:1}));
  return {s,t,real:1,fm:1};}
/* oyun öncesi sezonlar: FotMob → CARD (kulüpler gerçek) → hiçbiri (uydurma yok) */
phPre=(old=>function(p){try{const R=fmkRec(p);if(R)return fmkCareer(p,R);}catch(e){console.warn(e);}
  try{const E=carReal(p);if(E)return phReal(p,E);}catch(e){}return {s:[],t:[],none:1};})(phPre);
/* oyun başlarken arka planda simüle edilen 2025/26 (phArchive) gerçek sezon değildir: oyun öncesi satırlar yalnız gerçek veriden gelir.
   Aynı sezonda iki kulüp: yeni → eski sırası korunur (krData artan sıralamada eskiyi önce görür). */
careerOf=(old=>function(p){const C=old.apply(this,arguments);try{const Y0=G.ph0Y||2026;C.rows=C.rows.filter(x=>x.pre||x.cur||x.y>=Y0);C.rows.sort((a,b)=>(b.y-a.y)||((b.o!=null?b.o:-1)-(a.o!=null?a.o:-1)));C.fm=!!fmkRec(p);if(!C.fm&&!C.real)C.none=!C.rows.some(x=>x.pre);}catch(e){}return C;})(careerOf);
/* milli maçlar: gerçek A milli takım verisi */
fmCaps=(old=>function(p){try{const R=fmkRec(p);if(R)return R.nc&&R.nc[0]>0?[R.nc[0],R.nc[1]||0,R.nc[2]||0]:null;}catch(e){}return old.apply(this,arguments);})(fmCaps);
/* boy: FotMob → HW_REAL → LOOKS → tahmin (işaretli) */
function fmkKnownH(p){const nm=String(p&&p.name||'').replace(/^\d+\.\s*/,'');return !!((HW_REAL[nm]&&HW_REAL[nm][0])||(typeof LOOKS!=='undefined'&&LOOKS[nm]&&LOOKS[nm][0]));}
pHW=(old=>function(p){const r=old.apply(this,arguments);try{if(!r)return r;const R=fmkRec(p);
  if(R&&R.h){if(r.wq&&r.h&&r.h!==R.h)r.w=Math.round(r.w*(R.h*R.h)/(r.h*r.h));r.h=R.h;r.hq=false;}else r.hq=!fmkKnownH(p);}catch(e){}return r;})(pHW);
lookOf=(old=>function(seed,nat,age,coach){const L=old.apply(this,arguments);try{if(!coach&&FMK.ready&&typeof pRaw==='function'){const R=fmkRec(pRaw(seed));if(R&&R.h&&L.cm!==R.h){L.cm=R.h;L.hgt=clamp(R.h/181,0.9,1.12);}}}catch(e){}return L;})(lookOf);
/* tahmini boyu ekranda belirt */
pfBuild=(old=>function(mc){const r=old.apply(this,arguments);try{if(!mc||!PF_CUR)return r;const p=pByKey(PF_CUR.k),X=p&&pHW(p);if(!X||!X.hq)return r;
  for(const d of mc.querySelectorAll('.ca-row > div')){const s=d.querySelector('span'),b=d.querySelector('b');if(s&&b&&s.textContent==='Boy'&&!d.querySelector('.ca-q')){if(!/^~/.test(b.textContent))b.textContent='~'+b.textContent;d.insertAdjacentHTML('beforeend','<small class="ca-q">tahmini</small>');}}}catch(e){}return r;})(pfBuild);
fmProfHTML=(old=>function(p){let h=old.apply(this,arguments);try{const X=pHW(p);if(X&&X.hq)h=h.replace(/(<span>Boy<\/span><b class="vb">)(\d+ cm)/,'$1~$2');}catch(e){}return h;})(fmProfHTML);

/* ---------- Kariyer sekmesi (v81 düzeni; gerçek lig adları, dış kulüpler, veri kaynağı notu) ---------- */
pCareerHTML=function(p){let D;try{D=krData(p);}catch(e){console.warn(e);return '';}const {C,tot,path,tro,ms,caps}=D;
  if(caps&&caps[2]){const m=ms.find(x=>x.ic==='nat'),now0=G.s?G.s.year:2026;if(m){m.y=caps[2];m.a=p.age-(now0-caps[2]);const o=x=>({start:0,tr:1,loan:1,nat:2,apps:3,goal:4,cup:5})[x.ic]||6;ms.sort((a,b)=>(b.y-a.y)||(o(b)-o(a)));}}
  const cid=(G.tx&&G.tx[p.k])||p.club||p.home,c=clubObj(cid)||{c1:'#2a8c4a',c2:'#fff',name:''},now=G.s?G.s.year:2026,dead=p.alive===false;
  const crest=(id,s)=>{const k=clubObj(id);return k?crestSVG(k,s):'<i class="kr-dot"></i>';};
  const clubLg=id=>{const k=CLUBS[id];return k&&LEAGUES[k.league]?LEAGUES[k.league].short:'';};
  const lgOf=x=>x.lgn||(x.pre?'':clubLg(x.cid));
  const pathLg=x=>{const m={};for(const r of D.rows)if(r.cid===x.cid&&r.y>=x.from&&r.y<=x.to&&!!r.loan===!!x.loan){const l=lgOf(r);if(l)m[l]=(m[l]||0)+(r.ap||1);}const e=Object.entries(m).sort((a,b)=>b[1]-a[1]);return e.length?e[0][0]:'';};
  let face='';try{face=faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num});}catch(e){}
  const src=C.fm?'gerçek kariyer (FotMob)':C.real?'kulüpler gerçek kariyerden; oyun öncesi istatistikler tahmini':'oyun içi kayıt';
  const head=`<div class="kr2-hd"><div class="kr2-av">${face}</div><div><span class="kicker">${dead?'Futbolu bıraktı':'Aktif futbolcu'} · ${esc(POS_TR[p.pos]||'')}</span><h3>${esc(p.name)}</h3><small>${seasonLabel(D.from)} – ${dead?'':'günümüz'}${dead?'':' · '}${p.age} yaş · zirve ${R200(D.peak)} güç${c.name?` · ${esc(c.name)}`:''}</small></div></div>`;
  const strip=`<div class="strip kr2-st"><div><b>${tot.ap}</b><span>Maç</span></div><div><b>${p.pos==='KL'?'–':tot.g}</b><span>Gol</span></div><div><b>${tot.a}</b><span>Asist</span></div><div><b>${caps?caps[0]:0}</b><span>Milli</span></div><div><b>${tro.length}</b><span>Ödül</span></div></div>`;
  const note=C.none?`<p class="muted kr-none">Bu oyuncunun oyun öncesi kariyer verisi bulunamadı. Uydurma geçmiş gösterilmez; oyun içinde oynadığı sezonlar burada birikir.</p>`:'';
  const pth=path.length?`<section class="panel kr2-p"><p class="sub-h"><span>Kulüp yolculuğu</span><span>${path.length} durak</span></p><ol class="cpath">${path.slice().reverse().map(x=>{const k=clubObj(x.cid),l=pathLg(x);return `<li>${crest(x.cid,24)}<div><b>${esc(k?k.name:'?')}${x.loan?' <u class="rt r-ln">kiralık</u>':''}</b><small>${x.from===x.to?seasonLabel(x.from):seasonLabel(x.from)+' – '+seasonLabel(x.to)}${l?' · '+esc(l):''}</small></div><em>${x.ap}M ${p.pos==='KL'?'':x.g+'G'}</em></li>`;}).join('')}</ol></section>`:'';
  const trp=`<section class="panel kr2-p"><p class="sub-h"><span>Kupalar ve ödüller</span><span>${tro.length||''}</span></p>${tro.length?`<ul class="trophies">${tro.map(t=>`<li><i>${esc(t.y)}</i>${t.ic==='gold'?'🥇 ':''}${esc(t.n)}${CLUBS[t.c]?' · '+esc(CLUBS[t.c].name):''}</li>`).join('')}</ul>`:`<p class="muted">${C.real?'Oyun öncesi kupaları kayıtlı değil; oyun içinde kazandığı lig şampiyonlukları ve sezon ödülleri burada birikir.':'Henüz kupa ya da bireysel ödül yok.'}</p>`}</section>`;
  const tl=ms.length?`<section class="panel kr2-p"><p class="sub-h"><span>Kariyer anları</span><span>${ms.length}</span></p><ol class="tline">${ms.slice(0,60).map(m=>`<li class="ms-${m.ic}"><i>${MS_IC[m.ic]||'•'}</i><div><b>${esc(m.t)}</b><small>${seasonLabel(m.y)} · ${m.a} yaş</small></div></li>`).join('')}</ol></section>`:'';
  const sum=D.rows.reduce((a,x)=>{a.rt+=(x.rt||0)*(x.ap||0);a.ra+=x.rt?(x.ap||0):0;return a;},{rt:0,ra:0});
  const rws=D.rows.slice().reverse().map(x=>{const k=clubObj(x.cid);return `<tr class="${x.cur?'cur':''}"><td class="l">${seasonLabel(x.y)}${x.cur?' <em>sürüyor</em>':''}</td><td>${p.age-(now-x.y)}</td><td class="l club">${k?crestSVG(k,14):''}<span>${esc(k?k.short||k.name:'?')}</span>${x.loan?'<i class="kr-loan">kiralık</i>':''}</td><td class="l">${esc(lgOf(x))}</td><td>${x.ap}</td><td>${p.pos==='KL'?'–':x.g}</td><td>${x.a}</td><td>${x.ap&&x.rt?(+x.rt).toFixed(2):'–'}</td></tr>`;}).join('');
  const tbl=D.rows.length?`<section class="panel kr2-p"><p class="sub-h"><span>Sezonlar</span><span>${src}</span></p><div class="tbl-wrap"><table class="kr-t"><thead><tr><th class="l">Sezon</th><th>Yaş</th><th class="l">Kulüp</th><th class="l">Lig</th><th>M</th><th>G</th><th>A</th><th>Ort</th></tr></thead><tbody>${rws}</tbody>
   <tfoot><tr><td class="l" colspan="4">Kariyer toplamı</td><td>${tot.ap}</td><td>${p.pos==='KL'?'–':tot.g}</td><td>${tot.a}</td><td>${sum.ra?(sum.rt/sum.ra).toFixed(2):'–'}</td></tr></tfoot></table></div></section>`:'';
  const nm=id=>{const k=clubObj(id);return k?k.short||k.name:'?';};
  const txr=C.tx.map(e=>`<li><span class="kr-y">${seasonLabel(e.y)}</span><span class="kr-c">${clubObj(e.from)?crestSVG(clubObj(e.from),14):''}<span>${esc(nm(e.from))}</span><b>→</b>${clubObj(e.to)?crestSVG(clubObj(e.to),14):''}<span>${esc(nm(e.to))}</span></span><em class="${e.loan?'ln':e.ret?'rt':e.free?'fr':'fe'}">${e.loan?'Kiralık'+(e.fee?' · '+eur(e.fee):''):e.ret?'Kiralıktan dönüş':e.free?'Bonservissiz':e.nd||!e.fee?'Bedel açıklanmadı':eur(e.fee)}</em></li>`).join('');
  const txs=`<section class="panel kr2-p"><p class="sub-h"><span>Transferler</span><span>${C.tx.length||''}</span></p>${txr?`<ul class="kr-tx">${txr}</ul>`:`<p class="muted">${C.none?'Oyun öncesi transfer kaydı yok.':'Kariyeri boyunca tek kulüpte.'}</p>`}</section>`;
  /* "Kariyer geçmişi" başlığı eski eklemelerin (gelişim grafiği) yerleşmesi için çapa olarak kalıyor */
  return `<section class="fmp-krx kr2">${head}${strip}${note}<div class="kr2-g"><div>${tl}</div><div>${pth}${trp}</div></div><p class="fmp-sec">Kariyer geçmişi <small>· ${C.fm?'FotMob verisi, sezon sezon':'sezon sezon'}</small></p>${tbl}${txs}</section>`;};
/* güncel mevkiler (FotMob, ana mevki önce): ana 20 · ikincil 18 · üçüncül 16 · 14 · 12; komşu mevkiler en fazla 11 */
dpReal=(old=>function(p){try{const R0=fmkRec(p),L=R0&&R0.pos;if(L&&L.length){const m=L[0];if(p.pos==='KL'?m!=='GK':m==='GK')return old.apply(this,arguments);
    const R={};for(const k in FMP_POS)R[k]=1;if(m==='GK'){R.GK=20;return R;}const B=fmPosR0(p);for(const k in B)R[k]=Math.min(B[k],10);
    for(const k of DP_ADJ[m]||[])R[k]=Math.max(R[k],11);L.slice(1).forEach((k,i)=>{if(R[k]!=null)R[k]=[18,16,14,12][i]||11;});R[m]=20;R.GK=1;return R;}}catch(e){}
  return old.apply(this,arguments);})(dpReal);
