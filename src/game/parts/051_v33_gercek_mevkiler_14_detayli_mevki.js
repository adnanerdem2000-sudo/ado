/* ================= v33: gerçek mevkiler (14 detaylı mevki) ================= */
const DPT={GK:'KL',DL:'SLB',DC:'STP',DR:'SĞB',WBL:'SLKB',WBR:'SĞKB',DM:'DOS',MC:'MOS',ML:'SLO',MR:'SĞO',AML:'SLK',AMC:'OOS',AMR:'SĞK',ST:'SNT'};
const DP_ORDER=['GK','DR','DC','DL','WBR','WBL','DM','MC','MR','ML','AMC','AMR','AML','ST'];
const DP_BROAD={GK:'KL',DL:'DF',DC:'DF',DR:'DF',WBL:'DF',WBR:'DF',DM:'OS',MC:'OS',AMC:'OS',ML:'KN',MR:'KN',AML:'KN',AMR:'KN',ST:'FW'};
let DP_C={};
const DP_SW={DL:'DR',DR:'DL',WBL:'WBR',WBR:'WBL',ML:'MR',MR:'ML',AML:'AMR',AMR:'AML'};
const dpSwap=R=>{const o={};for(const k in R)o[DP_SW[k]||k]=R[k];return o;};
const dpType=R=>R.DL===20||R.DR===20?'fb':R.AML===20||R.AMR===20?'w':null;
const dpSideOf=R=>R.DL===20||R.AML===20?'L':'R';
/* kulüp içinde sağ/sol dengesi: her kulübün bekleri ve kanatları iki tarafa paylaşılır */
let DP_BAL={};
function dpBal(home){if(DP_BAL[home])return DP_BAL[home];const M={};try{const raw=baseSquad(home);const grp={fb:[],w:[]};
    for(const q of raw){const R=fmPosR0(q),t=dpType(R);if(t)grp[t].push(q.k);}const st=hash(home)%2;
    for(const t of ['fb','w'])grp[t].sort().forEach((k,i)=>{M[k]=(i+st)%2?'L':'R';});}catch(e){}DP_BAL[home]=M;return M;}
const fmPosR0=fmPosR;
const DP_ADJ={DR:['WBR'],DL:['WBL'],WBR:['DR','MR'],WBL:['DL','ML'],AMR:['MR'],AML:['ML'],MR:['AMR','WBR'],ML:['AML','WBL'],DM:['MC'],MC:['DM','AMC'],AMC:['MC'],ST:[],DC:[],GK:[]};
function dpReal(p){const d=POSD[p.name];if(!d||!String(p.k).includes('#'))return null;const L=d.split(','),m=L[0];if(p.pos==='KL'?m!=='GK':m==='GK')return null;
  const R={};for(const k in FMP_POS)R[k]=1;if(m==='GK'){R.GK=20;return R;}const R0=fmPosR0(p);for(const k in R0)R[k]=Math.min(R0[k],11);
  const r=srng(p.k+'dpr');r();for(const k of DP_ADJ[m]||[])R[k]=Math.max(R[k],13+Math.floor(r()*3));L.slice(1).forEach((k,i)=>{if(R[k]!=null)R[k]=Math.max(R[k],[18,17,16,15][i]||15);});R[m]=20;R.GK=1;return R;}
fmPosR=function(p){if(!p||!p.k)return fmPosR0(p);const c=DP_C[p.k];if(c&&c.pos===p.pos)return c.R;const RR=dpReal(p);if(RR){DP_C[p.k]={pos:p.pos,R:RR};return RR;}let R=fmPosR0(p);
  const t=dpType(R);if(t&&p.home&&CLUBS[p.home]&&String(p.k).startsWith(p.home+'#')){const want=dpBal(p.home)[p.k];if(want&&want!==dpSideOf(R))R=dpSwap(R);}
  DP_C[p.k]={pos:p.pos,R};return R;};
function dpMain(p){const R=fmPosR(p);let b='ST',v=-1;for(const k of DP_ORDER)if(R[k]>v){v=R[k];b=k;}return b;}
const dpTag=p=>{try{return p&&p.k?DPT[dpMain(p)]:(p&&p.pos)||'';}catch(e){return p&&p.pos||'';}};
const dpName=p=>{try{return FMP_PN[dpMain(p)];}catch(e){return '';}};
function dpAlt(p){const R=fmPosR(p),m=dpMain(p);return DP_ORDER.filter(k=>k!==m&&R[k]>=15).sort((a,b)=>R[b]-R[a]);}
/* formasyon yuvasının gerçek mevkisi */
function slotDP(s){const [p,x,y]=s;if(p==='KL')return 'GK';if(p==='DF'){if(x<.2)return y>.27?'WBL':'DL';if(x>.8)return y>.27?'WBR':'DR';return 'DC';}
  if(p==='OS'){if(y<.4)return 'DM';if(y>.6)return 'AMC';return 'MC';}
  if(p==='KN'){const L=x<.5;if(y<.6)return L?'ML':'MR';return L?'AML':'AMR';}return 'ST';}
function dpRate(p,s){if(p.pos==='KL'||s[0]==='KL')return p.pos===s[0]?20:1;return fmPosR(p)[slotDP(s)]||1;}
function dpPen(p,s){if(!p||!s)return 0;if(p.pos==='KL'||s[0]==='KL')return p.pos===s[0]?0:25;const v=dpRate(p,s);return v>=20?0:v>=15?1.5:v>=11?4:v>=6?7:11;}
const dpLvl=v=>v>=18?'Doğal':v>=15?'Usta':v>=11?'Yetkin':v>=6?'Beceriksiz':'Uygun değil';
/* profil: mevki satırı */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const m=dpMain(p),alt=dpAlt(p);
    h=h.replace('<div class="fmi"><span>Yaş</span>',`<div class="fmi"><span>Mevki</span><b><i class="dpb">${DPT[m]}</i> ${esc(FMP_PN[m])}${alt.length?`<small>Alternatif: ${alt.map(k=>`${DPT[k]} (${dpLvl(fmPosR(p)[k]).toLowerCase()})`).join(', ')}</small>`:''}</b></div><div class="fmi"><span>Yaş</span>`);}catch(e){}return h;})(fmProfHTML);
/* transfer arama: detaylı mevki filtresi */
const DP_CHIPS=[['','Tüm mevkiler'],['GK','KL'],['DC','STP'],['DR','SĞB'],['DL','SLB'],['DM','DOS'],['MC','MOS'],['AMC','OOS'],['AMR','SĞK'],['AML','SLK'],['ST','SNT']];
trSearch=(old=>function(){if(!TRF.dp)return old.apply(this,arguments);const keep=TRF.pos;TRF.pos=DP_BROAD[TRF.dp]==='KN'||DP_BROAD[TRF.dp]==='OS'?'all':DP_BROAD[TRF.dp];
  let L;try{const lids=TRF.lg?[TRF.lg]:Object.keys(LEAGUES).filter(l=>LEAGUES[l].tier>=Math.max(4,curLeague().tier-1)&&LEAGUES[l].tier<=curLeague().tier+2&&!LEAGUES[l].youth);const out=[];
    for(const lid of lids)for(const c of leagueClubs(lid)){if(c.id===G.club)continue;for(const p of squadOf(c.id)){if(p.age>TRF.age)continue;if((fmPosR(p)[TRF.dp]||0)<15)continue;out.push(Object.assign({},p,{club:c.id,price:Math.round(pValue(p)*EUR_TL*1.15/1e4)*1e4}));}}
    L=out.sort((a,b)=>(b.ovr+potOf(b)*0.4)-(a.ovr+potOf(a)*0.4)).slice(0,25);}finally{TRF.pos=keep;}return L;})(trSearch);
trHTML=(old=>function(){let h=old.apply(this,arguments);try{const row=`<div class="filt dp-filt">${DP_CHIPS.map(([k,l])=>`<button class="chip sm" data-act="trDp" data-v="${k}" aria-pressed="${(TRF.dp||'')===k}" title="${k?esc(FMP_PN[k]):''}">${l}</button>`).join('')}</div>`;
    h=h.replace(/(<div class="filt">[^]*?data-f="pos"[^]*?<\/div>)/,`$1${row}`);}catch(e){}return h;})(trHTML);
ACTX.trDp=el=>{TRF.dp=el.dataset.v||'';if(TRF.dp)TRF.pos='all';render();};
/* kadro tablosu: mevki sütununda detaylı mevki + alternatif */
/* taktik ekranı: yuvanın gerçek mevkisi ve oyuncunun uyumu */
function dpSlotNote(p,s){const v=dpRate(p,s);return `${DPT[slotDP(s)]} · ${dpLvl(v)}`;}

