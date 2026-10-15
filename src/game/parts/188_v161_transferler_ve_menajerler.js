/* ================= v161: transferler sayfası (sezon sezon tüm transferler, kiralıklar dahil), gelen kutusunda yalnız ses getiren transferler, çok uluslu menajer dünyası ve komisyonla çalışan menajerler =================
   - G.trl: her transfer (YZ↔YZ, kendi kulübün, futbolcunun kendisi, kiralık, kiralıktan dönüş, opsiyonlu kiralık, bonservissiz, altyapıdan) sezon başına sıkıştırılmış satır olarak tutulur.
     Satır: [gün, oyuncu anahtarı, ad, yaş, mevki, eski kulüp, yeni kulüp, tür, bedel €, opsiyon €]. Son 10 sezon saklanır; 3 sezondan eski sezonlarda yalnız en değerli 150 satır (ve kendi kulüplerinin satırları) kalır.
   - Gelen kutusu (tüm meslekler): kendi ligin ve kulübün transferleri tek tek gelir; diğerleri yalnız basında ses getirenler (lige göre bedel eşiği, yıldız oyuncu, büyük kulüp)
     ve varsayılan olarak tek bir "Haftanın transferleri" özetinde. Transferler sayfasından "tek tek (haftada en çok 5)" ya da "kapalı" seçilebilir.
   - YZ kulüpleri genç yedeklerini kiralık gönderir (bazıları satın alma opsiyonlu); kiralıklar sezon başında döner ya da opsiyon kullanılır.
   - Menajerler: ~160 hayali menajer, 38 ülke, bölgesel müşteri ağı. Her menajerin maaş komisyonu, bonservis payı ve asgari yıllık getiri beklentisi vardır;
     beklenen komisyon bunun altındaysa (düşük maaşlı genç, amatör lig, düşük piyasa değeri) temsili kabul etmez ve nedenini söyler. Ad ve ajanslar kurgudur. */
const T161={ai:0,cur:null,pend:[]};
/* "%6’sı", "%8’i" gibi yüzde ekleri */
const pctS=n=>{n=Math.round(n);const u={1:'i',2:'si',3:'ü',4:'ü',5:'i',6:'sı',7:'si',8:'i',9:'u'},t={10:'u',20:'si',30:'u',40:'ı',50:'si',60:'ı',70:'i',80:'i',90:'ı'};return `%${n}’${n%10?u[n%10]:n%100?t[n%100]:'ü'}`;};
const TRL_TY=['Bonservis','Kiralık','Bonservissiz','Kiralıktan dönüş','Opsiyonlu kiralık','Altyapıdan'];
function trlInit(){if(!G)return null;const T=G.trl=G.trl||{v:1,s:{},mode:'ozet',dq:[],wk:null,wn:0,al:[],ly:null};T.s=T.s||{};T.dq=T.dq||[];T.al=T.al||[];T.mode=T.mode||'ozet';
  if(!T.bf){T.bf=1;try{trlBackfill(T);}catch(e){console.warn('v161 geçmiş',e);}}return T;}
const trlY=()=>G&&G.s?G.s.year:2026;
const trlLg=id=>{const c=CLUBS[id];return c?c.league:null;};
const trlFee=v=>{v=Math.round(+v||0);return v>=1e6?Math.round(v/1e4)*1e4:v>=1e4?Math.round(v/1e3)*1e3:v;};
/* eski kayıtlar: v34'ten beri tutulan oyuncu bazlı geçmişten (G.txh) sezon listesi kurulur */
function trlBackfill(T){const cy=trlY();for(const [k,L] of Object.entries(G.txh||{})){let p=null;try{p=pByKey(k);}catch(e){}if(!p)continue;
    for(const e of L){if(!e||e.y==null||e.y<cy-9)continue;const a=(T.s[e.y]=T.s[e.y]||[]);a.push([e.d||0,k,p.name,Math.max(15,p.age-(cy-e.y)),p.pos,e.from,e.to,trlTyOf(e,k),trlFee(e.fee||0),0]);}}
  for(const y in T.s)T.s[y].sort((a,b)=>a[0]-b[0]);}
function trlTyOf(e,k){if(e.ret)return 3;if(e.loan){const l=G.m&&G.m.loans&&G.m.loans[k];if(l&&l.opt&&e.to===G.club)return 4;const al=G.trl&&G.trl.al&&G.trl.al.find(x=>x.k===k&&x.t===e.to);return al&&al.o?4:1;}
  if(e.free)return 2;const fl=LEAGUES[trlLg(e.from)],tl=LEAGUES[trlLg(e.to)];if(fl&&fl.youth&&tl&&!tl.youth)return 5;return 0;}
function trlPush(row){const T=trlInit();if(!T)return null;const y=trlY();(T.s[y]=T.s[y]||[]).push(row);if(Array.isArray(T161.cur))T161.cur.push(row);return row;}
/* kayıt anında henüz yazılmamış ayrıntılar (kiralık işareti, opsiyon) sonradan tamamlanır */
function trlFin(){const P=T161.pend;if(!P.length)return;T161.pend=[];for(const {row,e,k} of P){try{const ty=trlTyOf(e,k);row[7]=ty;row[8]=ty===0?trlFee(e.fee||0):0;
    if(ty===4){const l=G.m&&G.m.loans&&G.m.loans[k],al=G.trl.al.find(x=>x.k===k&&x.t===e.to);row[9]=trlFee((l&&e.to===G.club&&l.opt)||(al&&al.o)||0);}}catch(err){}}}
txNote=(old=>function(k,to,fee){let n0=0,l0=null;try{const L=G&&G.txh&&G.txh[k];n0=L?L.length:0;l0=n0?L[n0-1]:null;}catch(e){}const r=old.apply(this,arguments);
  try{const L=G&&G.txh&&G.txh[k];if(L&&L.length&&(L.length!==n0||L[L.length-1]!==l0)){const e=L[L.length-1],p=pByKey(k);if(p&&e.from!==e.to){
      const row=trlPush([G.s?G.s.day:0,k,p.name,p.age,p.pos,e.from,e.to,0,0,0]);if(row){T161.pend.push({row,e,k});row[7]=trlTyOf(e,k);row[8]=row[7]===0?trlFee(e.fee||0):0;}}}}catch(e){console.warn('v161 kayıt',e);}return r;})(txNote);
save=(old=>function(){try{trlFin();}catch(e){}return old.apply(this,arguments);})(save);
/* futbolcunun kendi transferleri (kulüp değişimi) */
function trlSnap(){if(!G||!isPl()||!G.s)return null;let mv=0;try{mv=marketValue();}catch(e){}return {c:G.club,mm:!!G.mustMove,ln:G.loan?G.loan.parent:null,nx:G.next?Object.assign({},G.next):null,yrs:G.contract?G.contract.years:0,mv,ph:G.phase};}
function trlMe(b){try{if(!b||!G||!isPl()||!G.s||G.club===b.c||!CLUBS[b.c]||!CLUBS[G.club])return;let ty=0,fee=0;
    if(G.loan&&G.loan.parent!==G.club)ty=1;else if((b.ln&&G.club===b.ln)||(b.nx&&b.nx.ret))ty=3;else if(b.mm||b.yrs<=0||(b.ph!=='season'&&b.yrs<=1))ty=2;else{ty=0;fee=trlFee(b.mv);}
    const fl=LEAGUES[trlLg(b.c)];if(ty===0&&fl&&fl.youth)ty=5;
    trlPush([G.s.day,'ME',meN(),G.p.age,G.p.pos,b.c,G.club,ty,ty===0?fee:0,0]);}catch(e){console.warn('v161 transferim',e);}}
acceptOffer=(old=>function(o){const b=trlSnap();const r=old.apply(this,arguments);trlMe(b);return r;})(acceptOffer);
startNewSeason=(old=>function(){const b=trlSnap();const r=old.apply(this,arguments);trlMe(b);return r;})(startNewSeason);

/* ---------- basında ses getiren transferler ---------- */
function trlOwn(r){const lg=G.s&&G.s.league,f=r[5],t=r[6];return f===G.club||t===G.club||r[1]==='ME'||trlLg(f)===lg||trlLg(t)===lg;}
function trlNotable(r){const fl=LEAGUES[trlLg(r[5])],tl=LEAGUES[trlLg(r[6])];if(!fl||!tl)return false;const tier=Math.max(fl.tier,tl.tier),cc=(curLeague()||{}).cc;
  let thr=tier>=9?25e6:tier>=8?8e6:3e6;if(fl.cc===cc||tl.cc===cc)thr*=0.35;let p=null;try{p=r[1]==='ME'?null:pByKey(r[1]);}catch(e){}const ovr=p?p.ovr:0;
  const big=Math.max((CLUBS[r[5]]||{}).str||0,(CLUBS[r[6]]||{}).str||0)>=84,fee=r[8]||0;
  if(r[7]===0)return fee>=thr||(ovr>=84&&fee>=5e6)||(big&&fee>=thr*0.5);
  if(r[7]===1||r[7]===4)return ovr>=80&&big;return r[7]===2&&ovr>=83;}
function trlTxt(r){const f=CLUBS[r[5]],t=CLUBS[r[6]];if(!f||!t)return null;const pos=(()=>{try{const p=pByKey(r[1]);return p?dpTag(p):r[4];}catch(e){return r[4];}})();
  if(r[7]===1||r[7]===4)return [`Kiralık: ${r[2]} → ${t.short}`,`${t.name}, ${f.name} forması giyen ${r[2]} (${r[3]}, ${pos}) ile sezon sonuna kadar kiralık anlaştı.${r[9]?` Sözleşmede ${eur(r[9])} satın alma opsiyonu var.`:''}`];
  if(r[7]===2)return [`Transfer: ${r[2]} → ${t.short}`,`${t.name}, ${r[2]} (${r[3]}, ${pos}) ile bonservissiz anlaştı. Oyuncunun eski kulübü ${f.name}.`];
  if(r[7]===3)return null;return [`Transfer: ${r[2]} → ${t.short}`,`${t.name}, ${f.name} forması giyen ${r[2]} (${r[3]}, ${pos}) ile anlaştı. Bonservis: ${eur(r[8])}.`];}
function trlNews(rows){const T=trlInit();if(!T||!rows||!rows.length)return;trlFin();const wk=wkKey();if(T.wk!==wk){trlDigest();T.wk=wk;T.wn=0;}
  for(const r of rows){if(r[1]==='ME')continue;const own=trlOwn(r),x=trlTxt(r);if(!x)continue;
    if(own){if(r[7]!==1&&r[7]!==4||(r[5]===G.club||r[6]===G.club)||trlNotable(r))msg('gundem',x[0],x[1]);continue;}
    if(T.mode==='kapali'||!trlNotable(r))continue;
    if(T.mode==='tek'&&T.wn<5){T.wn++;msg('gundem',x[0],x[1]);continue;}
    T.dq.push([r[1],r[2],r[5],r[6],r[7],r[8]]);if(T.dq.length>40)T.dq.sort((a,b)=>b[5]-a[5]).length=40;}}
function trlDigest(){const T=G.trl;if(!T||!T.dq||!T.dq.length)return;const L=T.dq.slice().sort((a,b)=>b[5]-a[5]);T.dq=[];if(T.mode==='kapali')return;
  const it=L.slice(0,8).map(x=>`${x[1]} (${(CLUBS[x[2]]||{}).short||'?'} → ${(CLUBS[x[3]]||{}).short||'?'}, ${x[4]===1||x[4]===4?'kiralık':x[4]===2?'bonservissiz':eur(x[5])})`);
  msg('gundem','Haftanın transferleri',`Dünyada basının konuştuğu ${L.length} transfer: ${it.join('; ')}${L.length>8?` ve ${L.length-8} transfer daha`:''}. Tüm liste: Transferler sayfası.`);}
/* YZ transferleri: tek tek "Transfer:" haberleri yerine yukarıdaki kural */
aiTransfers=(old=>function(){T161.ai=1;T161.cur=[];let rows;try{old.apply(this,arguments);try{trlAiLoans();}catch(e){console.warn('v161 kiralık',e);}}finally{T161.ai=0;rows=T161.cur;T161.cur=null;}
  try{trlNews(rows);}catch(e){console.warn('v161 haber',e);}})(aiTransfers);
msg=(old=>function(t,title){if(T161.ai&&t==='gundem'&&/^Transfer: /.test(String(title)))return;return old.apply(this,arguments);})(msg);
/* YZ kiralıkları: büyük kulüplerin genç yedekleri alt kulüplere */
function trlAiLoans(){const T=trlInit(),I=twInfo(),d=G.s.day,summer=d<=I.sc,winter=d>=I.wo&&d<=I.wc;if(!summer&&!winter)return;
  let n=summer?(Math.random()<0.6?1:0)+(Math.random()<0.3?1:0):(Math.random()<0.25?1:0);if(!n)return;
  const lgs=WORLD.filter(l=>LEAGUES[l]&&!LEAGUES[l].youth&&LEAGUES[l].tier>=8);
  for(let i=0;i<n*8&&n>0;i++){const lc=pick(aiLC(pick(lgs)));if(!lc||lc.id===G.club)continue;const sq=squadOf(lc.id);if(sq.length<24)continue;
    const cand=sq.filter(p=>p.k!=='ME'&&!p.me&&p.age>=18&&p.age<=22&&p.ovr<=lc.str-5&&!T.al.some(x=>x.k===p.k)&&!(G.twPend||[]).some(x=>x.k===p.k));if(!cand.length)continue;
    const p=pick(cand),lt=LEAGUES[lc.league].tier,cc=LEAGUES[lc.league].cc;
    const bs=aiClubs().filter(c=>{const L=LEAGUES[c.league];return L&&!L.youth&&!L.hidden&&c.id!==G.club&&c.id!==lc.id&&L.tier<=lt&&L.tier>=lt-2&&c.str<lc.str-3&&c.str>=p.ovr-5&&c.str<=p.ovr+6&&!derbyOf(lc.id,c.id);});
    if(!bs.length)continue;const dom=bs.filter(c=>LEAGUES[c.league].cc===cc),b=pick(dom.length&&Math.random()<0.6?dom:bs);if(squadOf(b.id).length>=29)continue;
    const o=Math.random()<0.3?trlFee(pValue(p)*rnd(1,1.3)):0;T.al.push({k:p.k,f:lc.id,t:b.id,y:G.s.year,o});
    G.tx=G.tx||{};G.tx[p.k]=b.id;txNote(p.k,b.id);const L=G.txh&&G.txh[p.k];if(L&&L.length){L[L.length-1].loan=1;delete L[L.length-1].fee;}trlFin();syncStr(b.id);syncStr(lc.id);n--;}}
/* sezon geçişi: YZ kiralıkları döner (ya da opsiyon kullanılır), eski sezonlar inceltilir, haftalık özet */
function trlSeason(){const T=trlInit();if(!T||!G.s)return;const y=G.s.year;if(T.ly===y)return;const first=T.ly==null;T.ly=y;if(first&&!T.al.length)return;
  const keep=[];for(const a of T.al){if(a.y>=y){keep.push(a);continue;}try{if(!G.tx||G.tx[a.k]!==a.t)continue;const p=pByKey(a.k);if(!p)continue;
      if(a.o&&Math.random()<0.4){trlPush([G.s.day,a.k,p.name,p.age,p.pos,a.f,a.t,0,a.o,0]);continue;}
      G.tx[a.k]=a.f;txNote(a.k,a.f);syncStr(a.f);syncStr(a.t);}catch(e){}}
  T.al=keep;trlFin();
  for(const k of Object.keys(T.s)){const sy=+k;if(sy<y-9){delete T.s[k];continue;}if(sy<y-2&&T.s[k].length>150){const R=T.s[k],mine=r=>r[1]==='ME'||(G.history||[]).some(h=>h&&(h.club===r[5]||h.club===r[6]))||r[5]===G.club||r[6]===G.club,me=R.filter(mine),rest=R.filter(r=>!mine(r)).sort((a,b)=>b[8]-a[8]).slice(0,Math.max(0,150-me.length));T.s[k]=me.concat(rest).sort((a,b)=>a[0]-b[0]);}}}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s){trlSeason();const T=G.trl,wk=wkKey();if(T&&T.wk!==wk){trlDigest();T.wk=wk;T.wn=0;}}}catch(e){console.warn('v161',e);}return r;})(nextDay);
/* kayıt boyutu: transfer listesindeki oyuncu anahtarları "ilgili oyuncu" sayılmasın (v152 arşivi şişmesin) */
if(typeof kvRefs==='function')kvRefs=(old=>function(){const t=G&&G.trl;if(!t)return old.apply(this,arguments);try{delete G.trl;return old.apply(this,arguments);}finally{G.trl=t;}})(kvRefs);

/* ---------- Transferler sayfası ---------- */
const TRLV={y:null,lg:'',cl:'',ty:'',pos:'',fr:'',q:'',sort:'d',n:60};
const trlSeasonTxt=y=>`${y}/${String((+y+1)%100).padStart(2,'0')}`;
function trlRows(y){const T=trlInit();trlFin();return ((T&&T.s[y])||[]).map(r=>({d:r[0],k:r[1],n:r[2],age:r[3],pos:r[4],f:r[5],t:r[6],ty:r[7],fee:r[8]||0,opt:r[9]||0,lf:trlLg(r[5]),lt:trlLg(r[6])}));}
function trlFilter(R,skipQ){const q=skipQ?'':TRLV.q.trim().toLocaleLowerCase('tr-TR'),cn=id=>String((CLUBS[id]||{}).name||'').toLocaleLowerCase('tr-TR');
  return R.filter(r=>(!TRLV.lg||r.lf===TRLV.lg||r.lt===TRLV.lg)&&(!TRLV.cl||r.f===TRLV.cl||r.t===TRLV.cl)&&(TRLV.ty===''||(TRLV.ty==='1'?(r.ty===1||r.ty===4):String(r.ty)===TRLV.ty))&&(!TRLV.pos||r.pos===TRLV.pos)
    &&(!TRLV.fr||(r.ty===0&&(TRLV.fr==='a'?r.fee<1e6:TRLV.fr==='b'?r.fee>=1e6&&r.fee<1e7:TRLV.fr==='c'?r.fee>=1e7&&r.fee<5e7:r.fee>=5e7)))
    &&(!q||String(r.n).toLocaleLowerCase('tr-TR').includes(q)||cn(r.f).includes(q)||cn(r.t).includes(q)));}
function trlDate(r,y){try{const d=dateOf(r.d,+y);return `${d.getUTCDate()} ${TR_MONTHS[d.getUTCMonth()]}`;}catch(e){return '';}}
function trlClubBtn(id){const c=clubObj(id);if(!c)return '<span class="trl-c">?</span>';return `<button class="trl-c" data-act="club" data-id="${id}">${crestSVG(c,18)}<span>${esc(c.short||c.name)}</span></button>`;}
function trlFeeTxt(r){return r.ty===0?(r.fee?eur(r.fee):'Açıklanmadı'):r.ty===4?`Kiralık${r.opt?` <small>ops. ${eur(r.opt)}</small>`:''}`:r.ty===1?'Kiralık':r.ty===2?'Bonservissiz':r.ty===3?'Dönüş':'Altyapıdan';}
function trlRowHTML(r,y){const me=r.k==='ME',cur=(G.tx&&G.tx[r.k])||r.t;
  const pl=me?`<button class="trl-p" data-act="navGo" data-tab="player"><b>${esc(r.n)}</b><small>${esc(POS_TR[r.pos]||r.pos)} · ${r.age} · sen</small></button>`
    :`<button class="trl-p" data-act="pcard" data-id="${esc(cur)}" data-k="${esc(r.k)}"><b>${esc(r.n)}</b><small>${esc(POS_TR[r.pos]||r.pos)} · ${r.age}</small></button>`;
  return `<div class="trl-r ty${r.ty}${me||r.f===G.club||r.t===G.club?' me':''}"><time>${trlDate(r,y)}</time>${pl}<div class="trl-m">${trlClubBtn(r.f)}<i aria-hidden="true">→</i>${trlClubBtn(r.t)}</div><em class="trl-f">${trlFeeTxt(r)}</em></div>`;}
function trlListHTML(R,y){const s=R.slice().sort(TRLV.sort==='f'?(a,b)=>(b.ty===0?b.fee:-1)-(a.ty===0?a.fee:-1)||b.d-a.d:(a,b)=>b.d-a.d||b.fee-a.fee);
  const vis=s.slice(0,TRLV.n);return `<p class="sub-h"><span>Transferler</span><span>${R.length}</span></p>${vis.length?vis.map(r=>trlRowHTML(r,y)).join(''):'<p class="muted">Bu filtrelere uyan transfer yok.</p>'}
  ${s.length>TRLV.n?`<button class="btn ghost trl-more" data-act="trlMore">Daha fazla göster (${s.length-TRLV.n})</button>`:''}`;}
function trlSum(R){const pay=R.filter(r=>r.ty===0&&r.fee>0),top=pay.slice().sort((a,b)=>b.fee-a.fee).slice(0,10),lg={},cl={};
  for(const r of pay){const a=lg[r.lt]=lg[r.lt]||{s:0,g:0,n:0},b=lg[r.lf]=lg[r.lf]||{s:0,g:0,n:0};a.s+=r.fee;a.n++;b.g+=r.fee;const c=cl[r.t]=cl[r.t]||{s:0,n:0};c.s+=r.fee;c.n++;}
  return {pay,top,lg:Object.entries(lg).filter(([k])=>LEAGUES[k]).sort((a,b)=>b[1].s-a[1].s).slice(0,8),cl:Object.entries(cl).filter(([k])=>CLUBS[k]).sort((a,b)=>b[1].s-a[1].s).slice(0,8)};}
function viewTrl(){const T=trlInit(),cy=trlY();const ys=[...new Set([cy,...Object.keys(T.s).map(Number)])].sort((a,b)=>b-a);if(!ys.includes(+TRLV.y))TRLV.y=cy;const y=+TRLV.y;
  const all=trlRows(y),R=trlFilter(all),S=trlSum(R),tot=S.pay.reduce((a,r)=>a+r.fee,0),loans=R.filter(r=>r.ty===1||r.ty===4).length,fr=R.filter(r=>r.ty===2).length;
  const lgs=[...new Set(all.flatMap(r=>[r.lf,r.lt]))].filter(l=>LEAGUES[l]).sort((a,b)=>LEAGUES[b].tier-LEAGUES[a].tier||String(LEAGUES[a].name).localeCompare(LEAGUES[b].name,'tr'));
  const cc={};for(const r of all)for(const id of [r.f,r.t])if(CLUBS[id]&&(!TRLV.lg||CLUBS[id].league===TRLV.lg))cc[id]=(cc[id]||0)+1;
  const cls=Object.keys(cc).sort((a,b)=>cc[b]-cc[a]).slice(0,120).sort((a,b)=>String(CLUBS[a].name).localeCompare(CLUBS[b].name,'tr'));if(TRLV.cl&&!cls.includes(TRLV.cl))cls.unshift(TRLV.cl);
  const sel=(k,lab,opts)=>`<label class="trl-fl"><span>${lab}</span><select class="lf-sel" data-trl="${k}" aria-label="${lab}">${opts.map(([v,l])=>`<option value="${esc(String(v))}"${String(TRLV[k])===String(v)?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
  const mode=T.mode;
  const card=(h,b)=>`<section class="panel trl-card"><p class="sub-h"><span>${h}</span></p>${b}</section>`;
  const top=S.top.length?`<ol class="trl-top">${S.top.map(r=>`<li><button class="lnk" data-act="${r.k==='ME'?'navGo" data-tab="player':'pcard" data-id="'+esc((G.tx&&G.tx[r.k])||r.t)+'" data-k="'+esc(r.k)}">${esc(r.n)}</button><small>${esc((CLUBS[r.f]||{}).short||'?')} → ${esc((CLUBS[r.t]||{}).short||'?')}</small><b>${eur(r.fee)}</b></li>`).join('')}</ol>`:'<p class="muted">Bonservisli transfer yok.</p>';
  const lgT=S.lg.length?`<table class="trl-tb"><thead><tr><th>Lig</th><th>Harcama</th><th>Gelir</th><th>Net</th></tr></thead><tbody>${S.lg.map(([k,v])=>`<tr><td>${esc(LEAGUES[k].short||LEAGUES[k].name)}</td><td>${eur(v.s)}</td><td>${eur(v.g)}</td><td class="${v.g-v.s>=0?'pos':'neg'}">${v.g-v.s>=0?'+':'−'}${eur(Math.abs(v.g-v.s))}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">—</p>';
  const clT=S.cl.length?`<ol class="trl-top">${S.cl.map(([k,v])=>`<li><button class="lnk" data-act="club" data-id="${k}">${crestSVG(CLUBS[k],16)} ${esc(CLUBS[k].name)}</button><small>${v.n} transfer</small><b>${eur(v.s)}</b></li>`).join('')}</ol>`:'<p class="muted">—</p>';
  return `<div class="trl">
  <section class="panel trl-hd"><div class="trl-h1"><h2>Transferler</h2>${sel('y','Sezon',ys.map(v=>[v,trlSeasonTxt(v)+(v===cy?' (bu sezon)':'')]))}</div>
   <div class="strip trl-strip"><div><b>${R.length}</b><span>Transfer</span></div><div><b>${eur(tot)}</b><span>Bonservis</span></div><div><b>${loans}</b><span>Kiralık</span></div><div><b>${fr}</b><span>Bonservissiz</span></div><div><b>${S.top[0]?eur(S.top[0].fee):'—'}</b><span>En pahalı</span></div></div></section>
  <section class="panel trl-fil"><input id="trlQ" class="ag-q" type="search" placeholder="Oyuncu ya da kulüp ara" value="${esc(TRLV.q)}" autocomplete="off">
   <div class="trl-fls">${sel('lg','Lig',[['','Tüm ligler'],...lgs.map(l=>[l,LEAGUES[l].name])])}${sel('cl','Kulüp',[['','Tüm kulüpler'],...cls.map(c=>[c,CLUBS[c].name])])}
   ${sel('ty','Tür',[['','Tümü'],['0','Bonservisli'],['1','Kiralık'],['2','Bonservissiz'],['3','Kiralıktan dönüş'],['5','Altyapıdan']])}${sel('pos','Mevki',[['','Tümü'],...Object.entries(POS_TR)])}
   ${sel('fr','Bedel',[['','Tümü'],['a','1 mn €’dan az'],['b','1–10 mn €'],['c','10–50 mn €'],['d','50 mn € ve üstü']])}</div>
   <div class="filt trl-sort"><button class="chip" data-act="trlSort" data-k="d" aria-pressed="${TRLV.sort==='d'}">Tarihe göre</button><button class="chip" data-act="trlSort" data-k="f" aria-pressed="${TRLV.sort==='f'}">Bedele göre</button>${TRLV.lg||TRLV.cl||TRLV.ty||TRLV.pos||TRLV.fr||TRLV.q?'<button class="chip" data-act="trlReset">Filtreleri temizle</button>':''}</div></section>
  <div class="trl-grid"><section class="panel trl-list" id="trlList">${trlListHTML(R,y)}</section>
   <div class="trl-side">${card('En pahalı 10 transfer',top)}${card('Liglere göre harcama',lgT)}${card('En çok harcayan kulüpler',clT)}
    ${card('Gelen kutusu',`<p class="muted">Kendi liginin ve kulübünün transferleri her zaman gelir. Diğer liglerden yalnız basında ses getirenler:</p><div class="filt">${[['ozet','Haftalık özet'],['tek','Tek tek (haftada en çok 5)'],['kapali','Gönderme']].map(([k,l])=>`<button class="chip" data-act="trlMode" data-k="${k}" aria-pressed="${mode===k}">${l}</button>`).join('')}</div>`)}</div></div>
  <p class="ag-disc">Liste, oyun dünyasında bu kariyerde gerçekleşen transferlerdir; bedeller oyun içi piyasa değerinden hesaplanır.</p></div>`;}
XICON.tlog=NI('<path d="M4 7h12l-3-3M20 17H8l3 3"/><circle cx="19" cy="7" r="1.6"/><circle cx="5" cy="17" r="1.6"/>');NICON.tlog=XICON.tlog;
Object.assign(XV,{tlog:()=>viewTrl()});
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.s&&G.phase!=='tryout'&&!L.some(x=>x[0]==='tlog'))L.push(['tlog','Transferler']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(G&&G.s&&G.phase!=='tryout'){const it=['tlog','Transferler',{tab:'tlog'}];const tr=C.find(x=>x[0]==='Transfer');
    if(tr){const m=tr[1].find(x=>x[0]==='trf');if(m)m[1]='Transfer pazarı';if(!tr[1].some(x=>x[0]==='tlog'))tr[1].push(it);}
    else if(!C.some(c=>c[1].some(x=>x[0]==='tlog'))){const i=C.findIndex(x=>x[0]==='Rekabet');C.splice(i>=0?i+1:C.length,0,['Transfer',[it]]);}}}catch(e){}return C;})(navCats);
ACTX.trlSort=el=>{TRLV.sort=el.dataset.k;render();};
ACTX.trlMore=()=>{TRLV.n+=80;const b=$('#trlList');if(b){const y=+TRLV.y||trlY();b.innerHTML=trlListHTML(trlFilter(trlRows(y)),y);}else render();};
ACTX.trlReset=()=>{Object.assign(TRLV,{lg:'',cl:'',ty:'',pos:'',fr:'',q:'',n:60});render();};
ACTX.trlMode=el=>{const T=trlInit();T.mode=el.dataset.k;save();render();toast(T.mode==='ozet'?'Diğer liglerin büyük transferleri haftalık özetle gelecek':T.mode==='tek'?'Diğer liglerin büyük transferleri tek tek gelecek (haftada en çok 5)':'Diğer liglerin transfer haberleri gelmeyecek');};
document.addEventListener('change',e=>{try{const el=e.target&&e.target.closest&&e.target.closest('[data-trl]');if(!el||!G)return;const k=el.dataset.trl;TRLV[k]=el.value;if(k==='lg')TRLV.cl='';if(k==='y'){TRLV.cl='';}TRLV.n=60;render();}catch(_){}});
document.addEventListener('input',e=>{try{if(e.target&&e.target.id==='trlQ'){TRLV.q=e.target.value;TRLV.n=60;const b=$('#trlList');if(b){const y=+TRLV.y||trlY();b.innerHTML=trlListHTML(trlFilter(trlRows(y)),y);}}}catch(_){}});

/* ======================================================================
   Menajerler: çok uluslu kurgusal havuz, bölgesel müşteri ağı, komisyonla çalışma
   ====================================================================== */
const AG161_NP={
  TUR:{f:['Emre','Burak','Caner','Mert','Ozan','Deniz','Arda','Kerem','Selin','Nil','Berk','Alper'],l:['Karakaya','Sarıkaya','Demirbilek','Aydemir','Çağlayan','Kuşçu','Erim','Tanrıkulu','Gökalp','Sungur','Ünlüer','Bektaşoğlu']},
  ENG:{f:['Daniel','Liam','Mark','Rebecca','Stuart','Neil','Hannah','Ryan'],l:['Thornbury','Kettering','Marlowe','Haversham','Crossley','Linford','Bramhall','Oakridge','Penrose','Wetherby','Calloway']},
  SCO:{f:['Alasdair','Callum','Fraser','Iain','Kirsty','Ewan'],l:['MacAulay','Drummond','Kilbride','Rennie','Lennox','Galbraith'],c:['Glasgow','Edinburgh','Aberdeen'],lang:['İngilizce'],cont:['sc1','en2']},
  IRL:{f:['Cian','Darragh','Niamh','Ronan','Eoin'],l:['Fitzmaurice','Kinsella','Mulcahy','Treacy','Ó Briain'],c:['Dublin','Cork'],lang:['İngilizce'],cont:['en2','sc1','pl']},
  ESP:{f:['Javier','Pablo','Lucía','Rubén','Marcos','Adrián','Carmen'],l:['Arrieta Gil','Benavente','Carrasquilla','Olaizola','Peñaranda','Quintanar','Urquiola']},
  POR:{f:['Bruno','Inês','Gonçalo','Mariana'],l:['Barroso Leite','Valadares','Godinho','Seixas']},
  ITA:{f:['Giacomo','Riccardo','Alessia','Stefano','Niccolò'],l:['Benvenuti','Castellari','Moretto','Pellizzari','Tagliaferri','Vianello']},
  FRA:{f:['Antoine','Romain','Camille','Yanis','Sébastien'],l:['Lavergne','Duplessis','Garnier-Roche','Montfort','Vasseur']},
  GER:{f:['Lukas','Sebastian','Niklas','Anja','Dominik'],l:['Ehrenberg','Hollmann','Kranzbühler','Steinbrecher','Wachtel']},
  AUT:{f:['Bernhard','Lukas','Teresa','Clemens','Florian'],l:['Pfanzelter','Hörtnagl','Gruber-Lenz','Aigner','Mayrhofer'],c:['Viyana','Salzburg','Graz'],lang:['Almanca'],cont:['at1','de2','ch1']},
  SUI:{f:['Reto','Urs','Nadine','Fabian','Severin'],l:['Bühlmann','Zürcher','Gasser','Schärli','Inäbnit'],c:['Zürih','Basel','Cenevre'],lang:['Almanca','Fransızca'],cont:['ch1','at1','fr2']},
  NED:{f:['Bram','Femke','Thijs','Daan'],l:['Bosschaart','van Leeuwerden','Kroeze','Ooms','de Haanstra']},
  BEL:{f:['Laurent','Jens','Sarah'],l:['Verbruggen','Lambotte','Goossenaerts']},
  DEN:{f:['Mads','Rasmus','Frederik','Line','Søren','Kasper'],l:['Kjærgaard','Holmsted','Lindvig','Bøgelund','Thygesen','Krogsbøl'],c:['Kopenhag','Aarhus','Odense'],lang:['Danca'],cont:['dk1','se1','no1']},
  SWE:{f:['Johan','Erik','Oskar','Linnea','Viktor','Henrik'],l:['Bergqvist','Lindholm','Sjöberg-Ek','Wallin','Ekdahl','Nyström'],c:['Stockholm','Göteborg','Malmö'],lang:['İsveççe'],cont:['se1','no1','dk1']},
  NOR:{f:['Lars','Magnus','Eirik','Ingrid','Håkon','Sindre'],l:['Haugland','Strømsnes','Fjeldvik','Rognstad','Bakkelund','Tveitan'],c:['Oslo','Bergen','Trondheim'],lang:['Norveççe'],cont:['no1','se1','dk1']},
  POL:{f:['Tomasz','Paweł','Krzysztof','Agnieszka','Michał','Piotr'],l:['Wierzbicki','Zaremba','Szczepaniak','Dąbrowiecki','Lisowski','Kowalczyk-Nowak'],c:['Varşova','Krakov','Poznań'],lang:['Lehçe'],cont:['po1','cz1','de2']},
  CZE:{f:['Jakub','Ondřej','Tomáš','Petra','Lukáš'],l:['Dvořáček','Holub','Kratochvíl','Vaněk','Novotný-Šmíd'],c:['Prag','Brno'],lang:['Çekçe'],cont:['cz1','po1','at1']},
  CRO:{f:['Ivan','Marko','Luka','Ana','Tomislav'],l:['Barišić','Jurković','Matijević','Pavletić','Kovačević-Rak'],c:['Zagreb','Split','Rijeka'],lang:['Hırvatça'],cont:['hr1','rs1','at1','it1']},
  SRB:{f:['Stefan','Jelena','Vuk'],l:['Ilić-Marković','Simonović','Đurđević']},
  GRE:{f:['Giorgos','Nikos','Dimitris','Eleni','Kostas'],l:['Papadakis','Theodoridis','Kalogeropoulos','Mavridis','Stathopoulos','Zervakis'],c:['Atina','Selanik','Pire'],lang:['Yunanca'],cont:['gr1','cy1']},
  UKR:{f:['Oleksandr','Andriy','Dmytro','Olena','Taras'],l:['Kovalenko','Hrytsenko','Melnychuk','Tkachenko','Shevchuk-Bondar'],c:['Kiev','Lviv','Harkiv'],lang:['Ukraynaca','Rusça'],cont:['ua1','po1']},
  RUS:{f:['Aleksey','Sergey','Dmitriy','Yelena','Pavel'],l:['Voronin','Sokolovskiy','Belyakov','Gromov','Zaytsev-Orlov'],c:['Moskova','St. Petersburg','Kazan'],lang:['Rusça'],cont:['ru1']},
  BRA:{f:['Rafael','Gustavo','Felipe','Larissa','Caio'],l:['Assunção','Brandão Lacerda','Cavalcanti','Tavares Moura']},
  ARG:{f:['Federico','Nicolás','Lucía','Matías','Ezequiel'],l:['Arguedas','Bustamante Vera','Lavalle','Quiroga Sosa']},
  URU:{f:['Sebastián','Gonzalo','Valentina','Rodrigo','Martín'],l:['Olivera Mena','Barrios Lagos','Castelnuovo','Pereda','Rodríguez Lago'],c:['Montevideo','Salto'],lang:['İspanyolca'],cont:['ar1','ll','br1']},
  COL:{f:['Andrés','Camilo','Juan Pablo','Daniela','Mauricio'],l:['Restrepo Lara','Quintero Mejía','Ospina Gil','Zuluaga','Cárdenas Toro'],c:['Bogota','Medellín','Cali'],lang:['İspanyolca'],cont:['mx1','ar1','us1']},
  MEX:{f:['Alejandro','Ricardo','Héctor','Mariana','Emiliano'],l:['Garza Treviño','Villaseñor','Arreola','Cervantes Lugo','Salazar Ríos','Montemayor'],c:['Meksiko','Monterrey','Guadalajara'],lang:['İspanyolca','İngilizce'],cont:['mx1','us1']},
  USA:{f:['Tyler','Brandon','Kevin','Ashley','Marcus','Jordan'],l:['Whitaker','Brennan','Holloway','Castellano','Dunmore','Redfield'],c:['New York','Los Angeles','Miami','Chicago'],lang:['İngilizce','İspanyolca'],cont:['us1','mx1','en2']},
  JPN:{f:['Kenji','Takumi','Haruto','Yui','Daisuke','Ryo'],l:['Tanabe','Morikawa','Hasegawa','Kitano','Ishiguro','Sugimoto'],c:['Tokyo','Osaka','Yokohama'],lang:['Japonca','İngilizce'],cont:['jp1','de2','be1']},
  KOR:{f:['Min-jun','Ji-hoon','Seo-yeon','Dong-hyun','Jae-won'],l:['Kwon','Baek','Seo','Yoon','Chae'],c:['Seul','Busan'],lang:['Korece','İngilizce'],cont:['jp1','de1','de2']},
  KSA:{f:['Faisal','Abdulrahman','Turki','Saad','Nawaf'],l:['Al-Qahtani','Al-Mutairi','Al-Harbi','Al-Shammari','Al-Otaibi'],c:['Riyad','Cidde','Dammam'],lang:['Arapça','İngilizce'],cont:['sa1']},
  EGY:{f:['Ahmed','Omar','Youssef','Mona','Karim'],l:['El-Sayed','Mansour','Abdelaziz','Fahmy','Shalaby'],c:['Kahire','İskenderiye'],lang:['Arapça','İngilizce'],cont:['sa1','fr1','be1']},
  ALG:{f:['Riad','Sofiane','Nabil','Amine','Lina'],l:['Benali','Bouzid','Haddadi','Mekhloufi','Zerrouki'],c:['Cezayir','Oran'],lang:['Arapça','Fransızca'],cont:['fr1','fr2','be1']},
  SEN:{f:['Moussa','Ibrahima','Cheikh','Aminata','Pape'],l:['Ndiaye-Sarr','Faye','Thiam','Ba Gueye','Sy'],c:['Dakar','Thiès'],lang:['Fransızca','Volofça'],cont:['fr1','fr2','be1']},
  GHA:{f:['Kwame','Kofi','Yaw','Ama','Kwabena'],l:['Mensah-Boateng','Owusu','Asante','Agyeman','Darko'],c:['Akra','Kumasi'],lang:['İngilizce'],cont:['en2','be1','dk1']},
  CIV:{f:['Serge','Yao','Koffi','Mariam','Arnaud'],l:['Kouassi','Kouamé','Diabaté','Gnagbo','Yapi'],c:['Abidjan','Yamoussoukro'],lang:['Fransızca'],cont:['fr1','be1','ch1']},
  CMR:{f:['Thierry','Blaise','Estelle','Jean-Pierre','Hervé'],l:['Mbarga','Abena','Ndzana','Fotso','Mvondo'],c:['Yaoundé','Douala'],lang:['Fransızca','İngilizce'],cont:['fr1','fr2','pt1']},
  NGA:{f:['Ifeanyi','Seun','Ngozi'],l:['Okafor-Daniels','Balogun','Eze-Williams']},
  MAR:{f:['Mehdi','Salma'],l:['Alaoui','Berrada']}};
for(const [k,v] of Object.entries(AG161_NP)){const P=AG_NP[k];if(P){P.f=[...new Set(P.f.concat(v.f))];P.l=[...new Set(P.l.concat(v.l))];}else AG_NP[k]=v;}
/* gerçek menajerlerle karışmasın: bilinen soyadları üretimden çıkar */
const AG161_NO=/^(Mendes|Raiola|Zahavi|Barnett|Joorabchian|Struth|Pastorello|Pimenta|Felicevich|Bulut|Tutumlu|Altıparmak|Bertolucci|Ramadani|Stretford|Lucci|Empacher|Wittmann|Stipic|Bentancur|Manasseh|Jansen)$/;
/* portre çizimi yalnız erkek yüzü üretebildiği için yeni üretimde kadın adları kullanılmaz (bıyıklı portre olmasın) */
const AG161_FEM=new Set('Ayşe Zeynep Defne Elif Ece Selin Nil Nerea Lucía Carmen Chiara Alessia Élodie Camille Sophie Rebecca Hannah Katrin Anja Teresa Nadine Femke Sarah Line Linnea Ingrid Agnieszka Petra Ana Jelena Eleni Olena Yelena Larissa Valentina Daniela Mariana Ashley Yui Seo-yeon Mona Lina Aminata Ama Mariam Estelle Ngozi Salma Inês Kirsty Niamh'.split(' '));
const AG161_AGN={ENG:['Thamesgate Sports Partners','Redbrick Lane Football'],SCO:['Clyde Harbour Sports'],IRL:['Liffey Bridge Football'],ESP:['Guadalquivir Talento'],POR:['Atlântico Norte Gestão'],ITA:['Arno Prima Procure'],FRA:['Garonne Horizon Conseil'],
  GER:['Elbtor Sportmanagement'],AUT:['Donaukanal Sportberatung'],SUI:['Limmat Pass Sports'],NED:['Maaskade Football'],BEL:['Meuse Étoile Football'],DEN:['Øresund Pitch Agency'],SWE:['Vättern Spelarbyrå'],NOR:['Fjordlys Sportsbyrå'],
  POL:['Wisła Brama Sport'],CZE:['Vltava Most Sport'],CRO:['Jadran Mreža Sport'],SRB:['Sava Kapija Sport'],GRE:['Egeo Galazio Sports'],UKR:['Dnipro Mist Sport'],RUS:['Volga Kompas Sport'],BRA:['Cerrado Verde Futebol','Paraná Rio Gestão'],
  ARG:['Pampa Sur Fútbol'],URU:['Celeste Puerto Deportes'],COL:['Cordillera Andina Fútbol'],MEX:['Sierra Madre Fútbol Group'],USA:['Pacific Ridge Soccer Partners','Hudson Line Sports'],JPN:['Sakura Gate Football'],KOR:['Hangang Bridge Sports'],
  KSA:['Najd Sands Sports'],EGY:['Nile Delta Sports'],ALG:['Casbah Horizon Sport'],SEN:['Teranga Pass Football'],GHA:['Volta Star Football'],CIV:['Lagune Ébrié Sports'],CMR:['Sanaga Talents'],TUR:['Kızılırmak Spor Danışmanlık','Uludağ Futbol Ajansı']};
for(const [k,v] of Object.entries(AG161_AGN))AG_AGN[k]=[...new Set((AG_AGN[k]||[]).concat(v))];
AG_BIG.push('Kestrel Meridian Football','Ivory Compass Sports Group','Lumen Crest Global','Seastone Continental Football');
/* bölgeler: menajerin ağı ve oyuncunun uyruğu */
const AG_REGN={tr:'Türkiye',brit:'Britanya ve İrlanda',iber:'İber Yarımadası',it:'İtalya',fr:'Fransa',dach:'Almanca konuşulan ülkeler',benel:'Benelüks',nord:'İskandinavya',ceu:'Orta Avrupa',balk:'Balkanlar',east:'Doğu Avrupa',latam:'Güney Amerika',nam:'Kuzey ve Orta Amerika',asia:'Asya',mena:'Orta Doğu ve Kuzey Afrika',afr:'Afrika'};
const AG_REG={};(()=>{const R={tr:'TUR AZE CYP',brit:'ENG SCO WAL IRL NIR AUS NZL',iber:'ESP POR CPV',it:'ITA MLT',fr:'FRA GLP MTQ LUX',dach:'GER AUT SUI',benel:'NED BEL SUR CUW',nord:'DEN SWE NOR FIN ISL FRO',
  ceu:'POL CZE SVK HUN ROU SVN LTU LVA EST',balk:'SRB CRO BIH MNE MKD KOS KVX BUL ALB GRE',east:'UKR RUS BLR GEO ARM MDA KAZ UZB TJK',latam:'BRA ARG URU PAR CHI BOL PER ECU COL VEN',
  nam:'MEX USA CAN CRC HON PAN GUA SLV JAM HAI DOM CUB TRI',asia:'JPN KOR CHN IDN MAS PHI IRN PAK',mena:'KSA MAR ALG TUN EGY QAT UAE IRQ JOR SYR LBY ISR LBN PLE',
  afr:'SEN CIV MLI GUI GHA NGA CMR BFA BEN TOG GAB CGO COD GAM GNB SLE LBR NIG MTN ANG EQG CTA CHA COM MAD KEN TAN UGA RWA ZAM ZIM RSA ETH SUD BDI ERI SOM BOT'};
  for(const [r,s] of Object.entries(R))for(const n of s.split(' '))AG_REG[n]=r;})();
const agReg=n=>AG_REG[n]||'other';
for(const r of Object.keys(AG_REGN))AG_SPEC['r_'+r]=AG_REGN[r]+' pazarı';
const AG161_NW={ENG:7,ESP:7,ITA:6,FRA:6,GER:6,BRA:6,ARG:5,POR:4,NED:4,BEL:3,USA:3,JPN:3,DEN:2,SWE:2,NOR:2,POL:2,CZE:2,CRO:2,SRB:2,GRE:2,UKR:2,RUS:2,URU:2,COL:2,MEX:2,KOR:2,KSA:2,MAR:2,SEN:2,NGA:2,AUT:2,SUI:2,EGY:1,ALG:1,GHA:1,CIV:1,CMR:1,SCO:1,IRL:1};
const AG161_TIER=[10,28,50,72];
/* yeni menajer üretimi: tohumdan, ülke başına makul ad/ajans/şehir/dil, bölgesel ağ ve komisyon şartları */
function ag161Make(r,t,nat,id,usedL,usedN,usedA){const ri=(a,b)=>a+Math.floor(r()*(b-a+1)),pk=a=>a[Math.floor(r()*a.length)];const P=AG_NP[nat]||AG_NP.TUR;
  let n=null;for(let g=0;g<40;g++){const ln=pk(P.l),fn=pk(P.f);if(AG161_FEM.has(fn))continue;if(AG161_NO.test(ln)||usedL.has(ln)&&g<30)continue;const x=fn+' '+ln;if(usedN.has(x))continue;n=x;usedL.add(ln);usedN.add(x);break;}if(!n)return null;
  let ag;if(t===0)ag=pk(AG_BIG.filter(x=>!usedA[x]).length?AG_BIG.filter(x=>!usedA[x]):AG_BIG);else{const L=AG_AGN[nat]||AG_AGN.TUR,fr=L.filter(x=>!usedA[x]);ag=fr.length?pk(fr):pk(L);}usedA[ag]=(usedA[ag]||0)+1;
  const rep=[ri(86,98),ri(70,85),ri(48,69),ri(14,47)][t],shady=t===3?r()<0.4:t===2?r()<0.28:r()<0.2,hon=shady?ri(t===3?6:22,t===3?38:46):ri(55,96);
  const fee=clamp([ri(8,12),ri(7,11),ri(5,10),ri(3,8)][t]+(shady?ri(3,8):0),3,20),yrs=[ri(16,32),ri(10,24),ri(5,18),ri(1,10)][t],age=clamp(25+yrs+ri(0,9),26,72);
  const home=agReg(nat),regs=Object.keys(AG_REGN).filter(x=>x!==home),reach=[home];const nr=[4,2,r()<0.5?1:0,0][t];for(let i=0;i<nr;i++){const x=pk(regs.filter(z=>!reach.includes(z)));if(x)reach.push(x);}
  const spec=t===0?pk(['buyuk','buyuk','soz']):nat==='TUR'&&r()<0.55?'tr':r()<0.3?'r_'+home:t===3?pk(['genc','genc','soz']):pk(['genc','soz','buyuk']);
  const lang=[...(P.lang||['İngilizce'])];if(!lang.includes('İngilizce')&&(t<=2||r()<0.4))lang.push('İngilizce');if(t===0&&!lang.includes('İspanyolca'))lang.push('İspanyolca');if(nat==='TUR'&&t<=1&&r()<0.5)lang.push('Almanca');
  const cont=[...(P.cont||[])];if(t===0)cont.push(...['pl','ll','it1','de1','fr1']);else if(t===1)cont.push(pk(['pl','ll','it1','de1','fr1','pt1','nl1','sa1']));if(nat!=='TUR'&&t<=2&&r()<0.35)cont.push('sl');
  const tf=[ri(6,10),ri(5,8),ri(4,7),ri(3,6)][t],mn=Math.round([ri(180,420)*1e3,ri(40,110)*1e3,ri(8,25)*1e3,ri(15,50)*100][t]*(shady?0.5:1)/100)*100;
  return {id,n,ag,nat,city:pk(P.c||['—']),y0:2026-yrs,age,rep,hon,fee,spec,lang:[...new Set(lang)],cont:[...new Set(cont)].filter(x=>LEAGUES[x]),t,cap:[ri(55,95),ri(30,60),ri(14,34),ri(4,16)][t],reg:reach,tf,mn};}
function ag161List(seed,start,counts,usedL,usedN,usedA){const r=srng('ag161'+seed),out=[];let id=start;const natsW=Object.entries(AG161_NW),totW=natsW.reduce((s,x)=>s+x[1],0);
  const pickNat=()=>{let v=r()*totW;for(const [n,w] of natsW)if((v-=w)<=0)return n;return 'ENG';};const must=Object.keys(AG161_NW).filter(n=>AG_NP[n]);let mi=Math.floor(r()*must.length);
  counts.forEach((cnt,t)=>{for(let i=0;i<cnt;i++){let nat;if(t===0)nat=i===0?'TUR':['ENG','ESP','POR','ITA','GER','FRA','BRA','ARG','NED'][Math.floor(r()*9)];
      else{const tr=[0,0.25,0.3,0.35][t];nat=r()<tr?'TUR':(t>=2&&must.length?must[(mi++)%must.length]:pickNat());}
      if(!AG_NP[nat])nat='ENG';const a=ag161Make(r,t,nat,'m'+(++id),usedL,usedN,usedA);if(a)out.push(a);else id--;}});
  return out;}
agGen=function(seed){return ag161List(seed,0,AG161_TIER,new Set(),new Set(),{});};
/* eski kayıtlar: mevcut 52 menajer (ve müşterin) korunur, havuz yeni ülkelerden menajerlerle tamamlanır */
agWorld=(old=>function(){const A=old.apply(this,arguments);try{if(A&&!A.v161){A.v161=1;if(A.list.length<120){const usedL=new Set(),usedN=new Set(),usedA={},cnt=[0,0,0,0];
      for(const a of A.list){const p=String(a.n).split(' ');usedL.add(p.slice(1).join(' '));usedN.add(a.n);usedA[a.ag]=(usedA[a.ag]||0)+1;cnt[a.t]=(cnt[a.t]||0)+1;}
      const need=AG161_TIER.map((n,t)=>Math.max(0,n-cnt[t]));const mx=Math.max(0,...A.list.map(a=>+String(a.id).slice(1)||0));A.list.push(...ag161List(A.seed+'x',mx,need,usedL,usedN,usedA));AGC=null;}}}catch(e){console.warn('v161 menajer',e);}return A;})(agWorld);
/* komisyon şartları (eski menajerlerde tohumdan türetilir) */
function agTerms(a){if(a.tf==null)a.tf=[8,6,5,4][a.t||0]+hash(a.id+'tf')%3;if(a.mn==null)a.mn=Math.round([280e3,70e3,15e3,3e3][a.t||0]*(a.hon<40?0.5:1)*(0.75+(hash(a.id+'mn')%50)/100)/100)*100;
  if(!a.reg)a.reg=[agReg(a.nat)].concat(a.t===0?['brit','iber','it','dach','fr']:[]);return a;}
/* müşteri ataması: değer + itibar uyumu, uyruk, bölge ağı, ligler, uzmanlık */
agClients=function(){const A=agWorld();if(!A)return {by:{},cl:{}};const key=A.seed+'|'+A.list.length;if(AGC&&AGC.key===key)return AGC;
  const all=[];for(const id of Object.keys(SQ_REAL)){const c=CLUBS[id];if(!c||!LEAGUES[c.league])continue;const L=LEAGUES[c.league],tr=(L.cc||'TR')==='TR';
    for(const p of baseSquad(id))all.push({k:p.k,v:pValue({ovr:p.ovr0,age:p.age0}),nat:p.nat,age:p.age0,tr,lg:c.league});}
  all.sort((a,b)=>b.v-a.v);const r=srng('agc'+A.seed),left={},by={},cl={};for(const a of A.list){agTerms(a);left[a.id]=a.cap;cl[a.id]=[];}
  all.forEach((x,i)=>{if(!(i<900||hash(x.k+'ag'+A.seed)%100<6))return;const s=agSc(x.v),pr=agReg(x.nat);let tot=0;
    const ws=A.list.map(a=>{if(left[a.id]<=0)return 0;let w=Math.exp(-Math.max(0,s-a.rep)/7-Math.max(0,a.rep-s-12)/9);const home=agReg(a.nat);
      if(pr===home)w*=3;else if(a.reg.includes(pr))w*=a.t===0?1.2:1.4;else w*=a.t===0?0.8:0.3;
      if(a.spec==='tr')w*=(x.tr||x.nat==='TUR')?3:0.5;else if(x.tr&&a.nat!=='TUR')w*=0.7;if(a.spec==='genc'&&x.age<=21)w*=2.2;if(a.spec==='buyuk'&&x.v>=3e7)w*=2;if(a.spec==='r_'+pr)w*=1.6;
      if(x.nat===a.nat)w*=2.5;if(a.cont.includes(x.lg))w*=1.5;tot+=w;return w;});
    if(tot<=0)return;let v=r()*tot;for(let j=0;j<ws.length;j++){if((v-=ws[j])<=0){const a=A.list[j];left[a.id]--;by[x.k]=a.id;cl[a.id].push(x.k);break;}}});
  return AGC={seed:A.seed,key,by,cl};};
/* komisyon hesabı: menajer, futbolcudan beklediği yıllık getiri asgari beklentisinin altındaysa temsil etmez */
function agTake(a){agTerms(a);const p=G.p,L=curLeague()||{},wy=U2E((G.contract&&G.contract.wage)||0)*52;let mv=0;try{mv=marketValue();}catch(e){}
  const ovr=OVR(),pa=Object.values(p.pot||{}).reduce((s,v)=>s+v,0)/Math.max(1,Object.keys(p.pot||{}).length),age=p.age;
  const fut=age<=21?mv*(1+clamp((pa-ovr)/15,0,3))*(L.youth?0.6:1):mv;
  const wc=wy*a.fee/100,tc=mv*a.tf/100*0.25,yc=age<=21&&(a.spec==='genc'||a.t>=2)?fut*a.tf/100*0.12:0,earn=Math.round(wc+tc+yc);
  let ok=earn>=a.mn,why='';
  if(a.t===0&&!(mv>=12e6||fut>=30e6)){ok=false;why=`yalnız piyasa değeri en az 12 mn € ya da çok yüksek potansiyelli oyuncularla çalışıyor (senin değerin ${eur(mv)})`;}
  else if(a.t===1&&!(mv>=2e6||fut>=6e6)){ok=false;why=`müşteri listesine piyasa değeri 2 mn €’nun üstündeki ya da büyük potansiyelli oyuncuları alıyor (senin değerin ${eur(mv)})`;}
  else if(!ok)why=wy<=0?`henüz maaş aldığın bir sözleşmen yok; komisyon alabileceği bir gelir olmadığı için zaman ayıramıyor (beklentisi yılda en az ${eur(a.mn)})`:L.youth?`altyapı sözleşmesindesin; maaşının ${pctS(a.fee)} yılda yalnız ${eur(wc)} eder, ofis masraflarını karşılamıyor (beklentisi yılda en az ${eur(a.mn)})`
    :`maaşının ${pctS(a.fee)} ve olası bonservis payıyla yılda yaklaşık ${eur(earn)} kazanır; bu menajerin asgari beklentisi ${eur(a.mn)}${(L.tier||0)<=4?'. Amatör ligdeki oyunculara zaman ayırmıyor':''}`;
  return {ok,earn,min:a.mn,why,wc:Math.round(wc),tc:Math.round(tc),yc:Math.round(yc)};}
/* kapıyı çalan menajerler: yalnız komisyon getirisi yeterli olanlar */
agPickApproacher=(old=>function(){for(let i=0;i<10;i++){const a=old.apply(this,arguments);if(!a)return null;try{if(agTake(a).ok)return a;}catch(e){return a;}}return null;})(agPickApproacher);
function agDecline(a,t){agHist(a.id,'Temsil talebini geri çevirdi');agx().last[a.id]=absDay();
  msg('menajer',`${a.n} temsil talebini geri çevirdi`,`${a.n} (${a.ag}): “Şu an seni temsil edemem.” Neden: ${t.why}. Menajerler komisyonla çalışır; maaşın, piyasa değerin ya da potansiyelin yükseldiğinde yeniden konuşabilirsiniz.`,{ag:a.id});}
ACTX.agAsk=(old=>function(el){try{const a=agById(el.dataset.id);if(a&&isPl()){const X=agx();if(!(X.last[a.id]&&absDay()-X.last[a.id]<30)&&a.rep<=agMeScore()+22){const t=agTake(a);if(!t.ok){closeModal();agDecline(a,t);save();TAB='inbox';render();toast(`${a.n} teklifini geri çevirdi`);return;}}}}catch(e){console.warn('v161 menajer',e);}return old.apply(this,arguments);})(ACTX.agAsk);
/* "Menajer ara": seviyene uygun üç menajere ulaşılır; komisyon getirisine göre kabul ya da ret */
ACTX.agSeek=()=>{if(!isPl()||!G.s||G.phase==='tryout')return;const X=agx(),d=absDay();if(X.seek&&d-X.seek<30)return toast(`Yeni bir arayış için ${30-(d-X.seek)} gün bekle`);X.seek=d;
  const A=agWorld(),me=agMeScore(),mid=agMine()&&agMine().id,pr=agReg(G.p.nat||'TUR'),lr=agReg(({TR:'TUR',EN:'ENG',ES:'ESP',IT:'ITA',DE:'GER',FR:'FRA',PT:'POR',NL:'NED',BE:'BEL',BR:'BRA',AR:'ARG'})[(curLeague()||{}).cc]||'TUR');
  const L=A.list.filter(a=>a.id!==mid&&!(X.last[a.id]&&d-X.last[a.id]<30)).map(a=>{agTerms(a);return {a,s:Math.abs(a.rep-(me+6))-(a.reg.includes(pr)||a.reg.includes(lr)?8:0)+(hash(a.id+d)%9)};}).sort((x,y)=>x.s-y.s).slice(0,3).map(x=>x.a);
  if(!L.length)return toast('Şu an ulaşılabilecek menajer yok');let sent=null;const lines=[];
  for(const a of L){const t=agTake(a);if(t.ok&&!sent&&!agOpenMsg()){agSend(a,'rep');sent=a;lines.push(`${a.n} (${a.ag}): ilgilendi, temsil teklifini gelen kutuna gönderdi.`);}
    else if(t.ok){X.last[a.id]=d;lines.push(`${a.n} (${a.ag}): ilgileniyor ama ${sent?'başka bir menajerle görüştüğün için':'açık bir menajer görüşmen olduğu için'} şimdilik bekliyor.`);}
    else{X.last[a.id]=d;agHist(a.id,'Temsil talebini geri çevirdi');lines.push(`${a.n} (${a.ag}): reddetti — ${t.why}.`);}}
  msg('menajer','Menajer arayışı: yanıtlar',lines.join(' ')+(sent?'':' Menajerler komisyonla çalışır; maaşın ve piyasa değerin yükseldikçe kapın daha çok çalınır.'));save();TAB='inbox';render();toast(sent?`${sent.n} teklif gönderdi`:'Menajerlerden olumsuz yanıt');};
/* bonservisli transferde menajerin aracılık payı alıcı kulüpten (futbolcunun cebinden değil) */
acceptOffer=(old=>function(o){let b=null;try{b=isPl()&&o&&!o.renew&&!o.loan?trlSnap():null;}catch(e){}const r=old.apply(this,arguments);
  try{const a=agMine();if(a&&b&&o.status==='accepted'&&b.c!==o.club&&!b.mm&&b.yrs>0&&b.mv>0){agTerms(a);const c=trlFee(b.mv*a.tf/100);if(c>0){agHist(a.id,`${CLUBS[o.club].name} transferinden kulüpten ${eur(c)} aracılık payı`);
      msg('menajer',`${a.n} aracılık payını aldı`,`${CLUBS[o.club].name} transferinde menajerin ${a.n}, tahmini bonservis ${eur(b.mv)} üzerinden ${eur(c)} (%${a.tf}) aracılık ücreti aldı. Ücreti alıcı kulüp öder; senin hesabından düşülmez.`,{ag:a.id});}}}catch(e){}return r;})(acceptOffer);
/* CV: çalışma şartları ve futbolcuya göre getiri */
agProfile=(old=>function(id){const r=old.apply(this,arguments);try{const a=agById(id);if(!a)return r;agTerms(a);const dl=document.querySelector('#modalCard .ag-dl');if(!dl)return r;
    dl.insertAdjacentHTML('beforeend',`<div><dt>Uyruk</dt><dd>${flagImg(a.nat,'fl-row')} ${esc(natName(a.nat))}</dd></div><div><dt>Ağı</dt><dd>${a.reg.map(x=>esc(AG_REGN[x]||x)).join(', ')}</dd></div>`);
    let mine='';if(isPl()&&G.s&&G.mode!=='mgr'){const t=agTake(a);mine=`<li class="${t.ok?'ok':'no'}"><b>Senin için:</b> tahmini yıllık komisyon ${eur(t.earn)} (maaş ${eur(t.wc)}${t.tc?` · bonservis payı ${eur(t.tc)}`:''}${t.yc?` · potansiyel ${eur(t.yc)}`:''}) → ${t.ok?'temsil etmeye istekli':'şu an temsil etmez: '+esc(t.why)}</li>`;}
    dl.insertAdjacentHTML('afterend',`<p class="sub-h"><span>Çalışma şartları</span></p><ul class="ag-terms"><li>Maaş komisyonu: haftalık maaşının <b>${pctS(a.fee)}</b>, her hafta</li><li>İmza komisyonu: yeni sözleşmede ilk 4 haftalık maaşın ${pctS(a.fee)}; sponsorlukta 4 haftalık ödemenin ${pctS(a.fee)}</li>
      <li>Bonservis payı: transfer bedelinin <b>${pctS(a.tf)}</b> (alıcı kulüp öder)</li><li>Asgari beklenti: yılda en az <b>${eur(a.mn)}</b> komisyon getirisi; altında kalan oyuncuyu temsil etmez</li>${a.t===0?'<li>Yalnız 12 mn €’nun üstündeki ya da çok yüksek potansiyelli oyuncular</li>':a.t===1?'<li>Piyasa değeri 2 mn €’nun üstündeki ya da büyük potansiyelli oyuncular</li>':''}${mine}</ul>`);}catch(e){console.warn('v161 CV',e);}return r;})(agProfile);
/* menajer rehberi: uyruk filtresi ve ülke sayısı */
AGV.nat='';
agListRows=(old=>function(){if(!AGV.nat)return old.apply(this,arguments);const A=agWorld(),bak=A.list;try{A.list=bak.filter(a=>a.nat===AGV.nat);return old.apply(this,arguments);}finally{A.list=bak;}})(agListRows);
agListPanel=(old=>function(){let h=old.apply(this,arguments);try{const A=agWorld(),nc={};for(const a of A.list)nc[a.nat]=(nc[a.nat]||0)+1;const ns=Object.keys(nc).sort((x,y)=>nc[y]-nc[x]);
    const s=`<div class="ag-nat"><select class="lf-sel" id="agNat" aria-label="Uyruk"><option value="">Tüm ülkeler (${ns.length} ülke)</option>${ns.map(n=>`<option value="${n}"${AGV.nat===n?' selected':''}>${esc(natName(n))} (${nc[n]})</option>`).join('')}</select></div>`;
    h=h.replace('<div class="seg ag-sort">',s+'<div class="seg ag-sort">');}catch(e){}return h;})(agListPanel);
document.addEventListener('change',e=>{try{if(e.target&&e.target.id==='agNat'){AGV.nat=e.target.value;const b=$('#agList');if(b)b.innerHTML=agListRows();}}catch(_){}});
viewAgent=(old=>function(){let h=old.apply(this,arguments);try{if(isPl()&&G.s){const X=agx(),w=X.seek&&absDay()-X.seek<30?30-(absDay()-X.seek):0;
    const b=`<div class="offer-btns ag-seek"><button class="btn" data-act="agSeek"${w?' disabled':''}>${w?`Menajer arayışı · ${w} gün sonra`:'Menajer ara'}</button></div><p class="muted ag-seek-t">Menajerler komisyonla çalışır: maaşın, piyasa değerin ve potansiyelin onlara yeterli getiri sağlamıyorsa temsil etmezler.</p>`;
    const i=h.indexOf('<section class="panel ag-cur">'),j=i<0?-1:h.indexOf('</section>',i);if(j>0)h=h.slice(0,j)+b+h.slice(j);}}catch(e){}return h;})(viewAgent);
/* test yardımcısı */
window.trlDebug=()=>{const T=trlInit();if(!T)return null;trlFin();const o={};for(const y in T.s)o[y]={n:T.s[y].length,kb:Math.round(JSON.stringify(T.s[y]).length/1024),ty:T.s[y].reduce((m,r)=>(m[r[7]]=(m[r[7]]||0)+1,m),{})};return {s:o,al:T.al.length,mode:T.mode,dq:T.dq.length};};
