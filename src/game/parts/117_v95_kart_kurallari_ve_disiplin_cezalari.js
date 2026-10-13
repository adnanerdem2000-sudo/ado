/* ================= v95: kart kuralları ve disiplin cezaları (IFAB Kural 12 · TFF Futbol Disiplin Talimatı) =================
   Sarı kart birikimi: ligde 4 sarı = 1 maç (Avrupa kupalarında 3 sarı = 1 maç). İkinci sarıdan kırmızı: 1 maç (iki sarı birikime sayılmaz).
   Doğrudan kırmızı türleri: net gol şansını engelleme 1 maç · ciddi faul 2–4 maç · şiddetli hareket 3–6 maç · sportmenlik dışı / hakaret 2–5 maç · tükürme 3–7 maç. */
const RED_T={
  ikinci_sari:{n:'İkinci sarıdan kırmızı',min:1,max:1,law:'İki sarı kart: otomatik 1 maç.'},
  son_adam:{n:'Net gol şansını engelleme',min:1,max:1,law:'Kural 12 · DOGSO: doğrudan kırmızı, 1 maç.'},
  sert:{n:'Ciddi faul hareketi',min:2,max:4,law:'Kural 12 · rakibin güvenliğini tehlikeye atan müdahale (FDT md. 43: 2–4 maç).'},
  siddet:{n:'Şiddetli hareket',min:3,max:6,law:'Kural 12 · topla ilgisi olmayan güç kullanımı: dirsek, kafa, yumruk (FDT md. 43: 3–6 maç).'},
  sportmenlik:{n:'Sportmenlik dışı hareket / hakaret',min:2,max:5,law:'Saldırgan, hakaret içeren söz ya da hareket (FDT md. 41: 2–5 maç).'},
  tukurme:{n:'Tükürme',min:3,max:7,law:'Rakibe ya da bir kişiye tükürmek (FDT md. 41).'}};
const YEL_T={faul:'Pervasız faul',taktik:'Taktik faul (atağı kesme)',itiraz:'İtiraz',zaman:'Zaman geçirme',sim:'Simülasyon',sportmenlik:'Sportmenlik dışı hareket',mesafe:'Mesafe kuralını ihlal'};
/* kırmızı türü: motorun gerekçesi yoksa gerçekçi dağılımla */
function redKind(why,second){if(second||why==='ikinci_sari')return 'ikinci_sari';if(RED_T[why])return why;if(why==='taktik')return 'son_adam';
  const r=Math.random();return r<0.34?'sert':r<0.62?'son_adam':r<0.84?'siddet':r<0.97?'sportmenlik':'tukurme';}
function redBan(kind,agg){const T=RED_T[kind]||RED_T.sert;const span=T.max-T.min;return T.min+Math.min(span,Math.floor(Math.random()*(span+1)*(0.55+((agg||50)-40)/120)));}
function ycLimit(comp){return comp==='eu'?3:4;}
/* ---------- teknik direktör: maç sonu kart ve ceza işlemesi ---------- */
function discMgr(){const m=G&&G.m;if(!m||m.shadow)return null;m.cban=m.cban||{};m.ycnt=m.ycnt||{};m.ycntEu=m.ycntEu||{};return m;}
/* izlenen maçta görülen kartlar (FX) */
let DISC_LAST=null;
fxClose=(old=>function(){try{const S=FX;if(S&&S.U&&G.mode==='mgr'&&G.m&&!G.m.shadow&&!S.watch){DISC_LAST={day:G.s.day,cards:S.U.P.filter(p=>p.yel||p.red).map(p=>({k:p.k,name:p.name,y:p.yel||0,r:!!p.red,why:p.redWhy||null,second:!!p.red2}))};}}catch(e){}return old.apply(this,arguments);})(fxClose);
/* izlenmeyen maçta kartlar: kadroya göre tahmini (ortalama ~1,9 sarı, %5 kırmızı) */
function discSimCards(){const xi=(typeof mgrXI==='function'?mgrXI():[]),sq=squadOf(G.club),by={};sq.forEach(p=>by[p.k]=p);const on=xi.map(k=>by[k]).filter(Boolean);if(!on.length)return [];
  const w=p=>p.pos==='DF'?1.5:p.pos==='OS'?1.35:p.pos==='KL'?0.15:0.8,tw=on.reduce((a,p)=>a+w(p),0),pickW=()=>{let r=Math.random()*tw;for(const p of on){r-=w(p);if(r<=0)return p;}return on[0];};
  const out={},ny=(()=>{let n=0,L=Math.exp(-1.9),p=1;do{n++;p*=Math.random();}while(p>L);return n-1;})();
  for(let i=0;i<ny;i++){const p=pickW();const o=out[p.k]=out[p.k]||{k:p.k,name:p.name,y:0,r:false,why:null};o.y++;if(o.y>=2){o.r=true;o.second=true;o.y=1;}}
  if(Math.random()<0.05){const p=pickW(),o=out[p.k]=out[p.k]||{k:p.k,name:p.name,y:0,r:false};if(!o.r){o.r=true;o.why=null;}}
  return Object.values(out);}
function discApply(comp){const m=discMgr();if(!m)return;const cards=DISC_LAST&&DISC_LAST.day===G.s.day?DISC_LAST.cards:discSimCards();DISC_LAST=null;
  /* önce mevcut cezalar bir maç düşer (bu maçı kaçıranlar) */
  for(const k in m.cban){m.cban[k].n--;if(m.cban[k].n<=0)delete m.cban[k];}
  const L=[],lim=ycLimit(comp),cnt=comp==='eu'?m.ycntEu:m.ycnt;
  for(const c of cards){if(c.r){const kind=redKind(c.why,c.second),n=redBan(kind);m.cban[c.k]={n,why:kind,src:'red'};L.push(`🟥 ${c.name}: ${RED_T[kind].n}. ${n} maç ceza. (${RED_T[kind].law})`);if(c.y&&!c.second)cnt[c.k]=(cnt[c.k]||0)+1;continue;}
    if(c.y){if(comp==='cup'&&!lim)continue;cnt[c.k]=(cnt[c.k]||0)+1;if(cnt[c.k]>=lim){cnt[c.k]=0;const cur=m.cban[c.k];m.cban[c.k]={n:(cur?cur.n:0)+1,why:cur?cur.why:'sari',src:'yel'};L.push(`🟨 ${c.name}: ${lim}. sarı kart. Bir sonraki maçta cezalı.`);}else if(cnt[c.k]===lim-1)L.push(`⚠ ${c.name}: ${cnt[c.k]} sarı kartı var, bir sarı daha görürse cezalı duruma düşecek.`);}}
  if(L.length)msg('squad',L.some(x=>x.startsWith('🟥'))?'PFDK kararları':'Kart durumu',L.join('\n'));}
mgrFinish=(old=>function(gu,go,f,sc){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m&&!G.m.shadow)discApply('lig');}catch(e){console.warn('disiplin',e);}return r;})(mgrFinish);
cupApply=(old=>function(k,us,them,notes){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m&&!G.m.shadow)discApply(k&&k.type==='eu'?'eu':'cup');}catch(e){console.warn('disiplin',e);}return r;})(cupApply);
/* cezalılar ilk 11'e ve yedeklere giremez */
mgrXI=(old=>function(){const m=G&&G.m;if(!m||!m.cban||!Object.keys(m.cban).length)return old.apply(this,arguments);m.ban=m.ban||{};const add=[];for(const k in m.cban){if(!m.ban[k]){m.ban[k]=99;add.push(k);}}if(m.xi)m.xi=m.xi.filter(k=>!m.cban[k]);
  try{return old.apply(this,arguments);}finally{for(const k of add)delete m.ban[k];}})(mgrXI);
/* sezon başında sarı kart sayaçları sıfırlanır */
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.m){G.m.ycnt={};G.m.ycntEu={};}if(G&&G.p){G.p.yellows=0;}}catch(e){}return r;})(newSeason);
/* oyuncu kartında ceza bilgisi */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const m=G&&G.m;if(m&&m.cban&&m.cban[p.k]&&c&&c.id===G.club){const B=m.cban[p.k];const t=B.why==='sari'?`Sarı kart cezası · ${B.n} maç`:`${(RED_T[B.why]||{n:'Kırmızı kart'}).n} · ${B.n} maç`;
    h=h.replace('<div class="fmi two">',`<div class="fmi"><span>Ceza</span><b style="color:#ff7b7b">🟥 ${esc(t)}</b></div><div class="fmi two">`);}
  else if(m&&m.ycnt&&m.ycnt[p.k]&&c&&c.id===G.club){h=h.replace('<div class="fmi two">',`<div class="fmi"><span>Sarı kart</span><b>🟨 ${m.ycnt[p.k]}/${ycLimit('lig')}</b></div><div class="fmi two">`);}}catch(e){}return h;})(fmProfHTML);
/* ---------- futbolcu modu: kırmızının türüne göre ceza ---------- */
function plRedNote(res){const second=(res.yc||0)>=2||(MR&&MR.yc>=2);const kind=redKind(null,second);const n=redBan(kind,G.p&&G.p.a&&G.p.a.agr);return {kind,n};}
/* oyuncunun maç sonucu işlenirken (pre34: league&&res.rc → p.ban=1/2) türü ve süresi kurala göre yeniden belirlenir */
function plDiscFix(res,notes){try{if(!res||!res.rc||!G.p)return;const {kind,n}=plRedNote(res);G.p.ban=n;G.p.redWhy=kind;const T=RED_T[kind];
  const i=notes.findIndex(x=>/Kırmızı kart!/.test(x));const t=`Kırmızı kart! ${T.n}: ${n} maç ceza. ${T.law}`;if(i>=0)notes[i]=t;else notes.push(t);
  if(kind==='siddet'||kind==='sportmenlik'||kind==='tukurme'){G.p.fame=clamp(G.p.fame-2,0,100);try{msg('board','PFDK kararı',`${PN()}, ${T.n.toLowerCase()} nedeniyle ${n} maç men cezası aldı. Kulüp ayrıca para cezası kesebilir.`);}catch(e){}}}catch(e){console.warn(e);}}
applyPlayed=(old=>function(res,role,win,draw,notes,tier,league){const r=old.apply(this,arguments);try{if(league&&res&&res.rc)plDiscFix(res,notes);}catch(e){console.warn(e);}return r;})(applyPlayed);

