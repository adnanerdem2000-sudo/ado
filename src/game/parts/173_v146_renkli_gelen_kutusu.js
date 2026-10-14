/* ================= v146: renkli gelen kutusu · haftanın 11’i sahada · takım adlarına tıklayınca kulüp sayfası =================
   - Her mesaj içeriğine göre bir kategoriye düşer (transfer, finans, maç, ödül, sağlık, medya, ekip, yönetim, gözlem, milli, olay, gündem, menajer):
     renk, simge, gönderen, göreli tarih ("Dün", "3 gün önce"), kategori süzgeç çipleri, açık mesajda kategori renginde başlık bandı.
   - Haftanın 11’i her lig haftasından sonra tüm mesleklerde yayınlanır; mesaj yapılandırılmış veri taşır (m.totw) ve açılınca dizilişe göre sahada gösterilir.
     Notlar oyun içi simülasyondur (skor, haftanın golleri/asistleri ve oyuncu gücüne göre tohumlanmış); gerçek veri değildir.
     Futbolcu kariyerinde oyuncu eskisi gibi yalnızca maç notu 8+ ise listeye girer.
   - Kulüp adları (tam ad; kendi ligindeki kısa adlar da) metinde otomatik bağlantı olur: dokununca kulüp sayfası açılır (data-act="club"). */

/* ---------- kategoriler ---------- */
const IB_CATS={
  transfer:['Transfer','🔁','#a77bff'],money:['Finans','💰','#f5c542'],match:['Maç','⚽','#4ad27f'],award:['Ödül','⭐','#ffd23f'],
  injury:['Sağlık','🩹','#ff5a52'],press:['Medya','📰','#5aa9ff'],staff:['Ekip','📋','#22c3b5'],board:['Yönetim','🏛️','#8c9cff'],
  scout:['Gözlem','🔭','#b5e655'],nat:['Milli','🌍','#ff3b4a'],event:['Olay','🎲','#e070ff'],gundem:['Gündem','🗞️','#6fd3a0'],
  agent:['Menajer','🤝','#ff8c3a'],other:['Diğer','✉️','#9fb3a6']};
const IB_ORDER=['transfer','money','match','award','injury','agent','staff','board','press','gundem','scout','nat','event','other'];
const IB_FROM={board:'Yönetim kurulu',squad:'Soyunma odası',coach:'Teknik ekip',injury:'Sağlık ekibi',offer:'Transfer masası',scout:'Gözlemci',report:'Maç analizi',
  gundem:'Gündem',news:'Haber merkezi',press:'Basın',event:'Kişisel',nat:'Milli takım',agent:'Menajerin',menajer:'Menajerin'};
const IB_RES_COL={w:'#4ad27f',l:'#ff5a52',d:'#a3b8ab'};
const IB_MEMO=new WeakMap();
function ibResult(m){const s=(m.title||'')+' '+(m.body||'');
  const x=/([^:·]+?)\s(\d+)-(\d+)\s(.+)$/.exec(m.title||'');
  if(x&&G&&CLUBS[G.club]){const me=CLUBS[G.club].name,h=x[1].trim(),a=x[4].trim(),hg=+x[2],ag=+x[3];const us=h.endsWith(me)?1:a.startsWith(me)?2:0;
    if(us){const u=us===1?hg:ag,o=us===1?ag:hg;return u>o?'w':u<o?'l':'d';}}
  if(/galibiyet|kazandı|kazandık|zafer|farklı kazan/i.test(s))return 'w';if(/mağlubiyet|yenildi|yenilgi|kaybett/i.test(s))return 'l';if(/berabere|beraberlik/i.test(s))return 'd';return '';}
function ibCat(m){if(!m)return {k:'other'};let c=IB_MEMO.get(m);if(c&&c.ti===m.title)return c;
  const T=m.title||'',t=m.t,s=T+' '+(m.body||'').slice(0,160);let k;
  if(m.totw||/haftanın 11|ayın (oyuncusu|hocası|teknik)|ödül|şampiyon|gol kral|asist kral|rekor|yılın/i.test(T))k='award';
  else if(t==='injury'||/sakat|iyileş|tedavi|ameliyat/i.test(T))k='injury';
  else if(t==='agent'||t==='menajer'||/menajer/i.test(T))k='agent';
  else if(t==='offer'||/transfer|teklif|kiralı|bonservis|satış|ilgileniyor|takas|serbest oyuncu|takviye|→/i.test(T))k='transfer';
  else if(/sözleşme|maaş|bütçe|prim|gelir|finans|sponsor|ödeme|borç|kasa|para|bonus|ceza/i.test(T))k='money';
  else if(t==='report'||/maç raporu|maç sonu|değerlendirme|derbi|galibiyet|mağlubiyet|beraberlik|skor/i.test(T))k='match';
  else if(t==='nat')k='nat';else if(t==='press'||t==='news')k='press';else if(t==='coach'||t==='squad')k='staff';
  else if(t==='board')k='board';else if(t==='scout')k='scout';else if(t==='event')k='event';else if(t==='gundem')k='gundem';else k='other';
  const res=k==='match'?ibResult(m):'';const D=IB_CATS[k];
  c={k,ti:m.title,res,lab:D[0],ic:D[1],col:res?IB_RES_COL[res]:D[2]};IB_MEMO.set(m,c);return c;}
function ibFrom(m){if(m.from)return String(m.from);if(m.totw)return (LEAGUES[m.totw.lg]||{}).short||'Lig';
  if(m.offer&&CLUBS[m.offer.club])return CLUBS[m.offer.club].name;return IB_FROM[m.t]||'Gelen kutusu';}
function ibRel(m){try{if(m.ad!=null&&G&&G.s){const d=absDay()-m.ad;if(d>=0&&d<35)return d===0?'Bugün':d===1?'Dün':d<7?`${d} gün önce`:`${Math.floor(d/7)} hafta önce`;}}catch(e){}return m.when||'';}
function ibCrestOf(m){try{if(m.offer&&CLUBS[m.offer.club])return CLUBS[m.offer.club];if(m.cid&&CLUBS[m.cid])return CLUBS[m.cid];
  if(['board','squad','coach','injury','report'].includes(m.t)&&G&&CLUBS[G.club])return CLUBS[G.club];}catch(e){}return null;}
function ibAv(m,C){const c=ibCrestOf(m);return `<span class="ib-av" aria-hidden="true"><i>${C.ic}</i>${c?`<u class="ib-cr">${crestSVG(c,13)}</u>`:''}</span>`;}
function ibMeta(m,C){return `<span class="ib-cat">${esc(C.lab)}</span><span class="ib-snd">${esc(ibFrom(m))}</span><time title="${esc(m.when||'')}">${esc(ibRel(m))}</time>`;}

/* mesajlara gün damgası: göreli tarih için (eski mesajlarda yok → tarih yazılır) */
let TW_ME=null,TW_PEND=null;
msg=(old=>function(t,title,body,extra){
  try{if(title==='Haftanın 11’i açıklandı'&&!(extra&&(extra.totw||extra.twRaw))){TW_PEND={body};return;}}catch(e){}
  let ad=null;try{if(G&&G.s)ad=absDay();}catch(e){}
  return old.call(this,t,title,body,ad!=null?Object.assign({ad},extra||{}):extra);})(msg);

/* ---------- mesaj kartı ---------- */
msgHTML=(old=>function(m){let h=old.apply(this,arguments);try{const C=ibCat(m),open=h.includes('class="msg-body"');
    h=h.replace(/^<li class="msg /,`<li style="--ic:${C.col}" class="msg ib2 c-${C.k}${C.res?' r-'+C.res:''}${open?' open':''} `);
    h=h.replace(/<span class="msg-tag">[^<]*<\/span>/,ibAv(m,C));
    const w=esc(m.when||'');h=h.replace(`<small>${w}`,`<small class="ib-meta">${ibMeta(m,C)}`);
    if(open&&m.totw){const i=h.indexOf('<div class="msg-body">'),j=h.indexOf('</p>',i);const tw=twPitchHTML(m.totw);if(i>=0&&j>i)h=h.slice(0,j+4)+tw+h.slice(j+4);}
  }catch(e){console.warn('ib',e);}return h;})(msgHTML);

/* ---------- liste ve süzgeçler ---------- */
function ibFilt(m){if(!INF||INF==='all')return true;if(INF==='unread')return isOpenMsg(m);if(INF.startsWith('c:'))return ibCat(m).k===INF.slice(2);const F=INF_GROUPS[INF];return !F||F.includes(m.t);}
function ibChips(){const L=G.inbox,cnt={};for(const m of L){const k=ibCat(m).k;const x=cnt[k]||(cnt[k]=[0,0]);x[0]++;if(isOpenMsg(m))x[1]++;}
  const nU=L.filter(isOpenMsg).length;
  const ch=[['all','Tümü','📥','',0],['unread','Okunmamış','●','#ff6b8b',nU],...IB_ORDER.filter(k=>cnt[k]).map(k=>['c:'+k,IB_CATS[k][0],IB_CATS[k][1],IB_CATS[k][2],cnt[k][1]])];
  if(!ch.some(x=>x[0]===INF))INF='all';
  return `<div class="filt ib-chips">${ch.map(([k,l,ic,col,n])=>`<button class="chip ib-chip" data-act="inf" data-k="${k}" aria-pressed="${INF===k}"${col?` style="--ic:${col}"`:''}><i>${ic}</i>${esc(l)}${n?` <em>${n}</em>`:''}</button>`).join('')}</div>`;}
function ibGroup(m){if(m.ad==null||!G||!G.s)return 'Daha önce';let d=0;try{d=absDay()-m.ad;}catch(e){}return d<=0?'Bugün':d<7?'Bu hafta':'Daha önce';}
function ibSplit2(list){const sel=list.find(m=>m.id===INSEL)||list.find(m=>isOpenMsg(m))||list[0];if(sel&&!sel.read)sel.read=true;
  const left=list.map(m=>{const C=ibCat(m);return `<li class="ib-i ib2 t-${m.t} c-${C.k} ${m.read?'':'unread'} ${m===sel?'sel':''}" style="--ic:${C.col}"><button data-act="ibSel" data-id="${m.id}">${ibAv(m,C)}<span class="ib-t"><b>${esc(m.title)}</b><small>${esc(ibFrom(m))} · ${esc(ibRel(m))}${m.offer&&m.offer.status==='open'?' · yanıt bekliyor':m.ev&&!m.ev.done?' · karar bekliyor':''}</small></span></button></li>`;}).join('');
  const right=sel?`<div class="ib-read">${msgHTML(Object.assign({},sel,{open:true})).replace('<li ','<div ').replace('class="msg ','class="msg ib-full ').replace(/<\/li>$/,'</div>')}</div>`:'<div class="ib-read"><p class="empty">Mesaj seçilmedi.</p></div>';
  return `<div class="ib-split">`+`<ul class="ib-list">${left}</ul>${right}</div>`;}
function ibView(){const chips=ibChips(),list=G.inbox.filter(ibFilt);
  const off=INB_CAT.filter(([k])=>!inbOn(k)).length;
  const tools=`<div class="inb-tools"><button class="btn ghost sm" data-act="inbEdit">☑ Seç ve sil</button><button class="btn ghost sm" data-act="inbClean" title="Okunmuş ve karar beklemeyen mesajları siler">🧹 Temizle</button><button class="btn ghost sm" data-act="inbSet">🔔 Bildirimler${off?` <em class="inb-off">${off} kapalı</em>`:''}</button></div>`;
  const head=`<div class="inbox-head"><h2 class="h">Gelen kutusu</h2>${tools}${unreadCount()?'<button class="btn ghost" data-act="readAll">Tümünü okundu say</button>':''}</div>${chips}`;
  if(!list.length)return head+'<p class="empty">Bu başlıkta mesaj yok.</p>';
  if(navWide())return head+ibSplit2(list);
  let g0='',out='';for(const m of list){const g=ibGroup(m);if(g!==g0){out+=`<li class="ib-sep">${g}</li>`;g0=g;}out+=msgHTML(m);}
  return `${head}<ul class="inbox ib2-list">${out}</ul>`;}
viewInbox=(old=>function(){if(INB_EDIT)return old.apply(this,arguments);try{return ibView();}catch(e){console.warn('ib',e);return old.apply(this,arguments);}})(viewInbox);

/* ---------- haftanın 11’i ---------- */
const TW_N={KL:1,DF:4,OS:3,KN:2,FW:2};
/* diziliş: sahada yukarıdan aşağı çizgiler (hücum, orta, savunma, kale) */
const TW_F=[['4-3-3',[['KN','FW','KN'],['OS','OS','OS'],['DF','DF','DF','DF'],['KL']]],['4-4-2',[['FW','FW'],['KN','OS','OS','KN'],['DF','DF','DF','DF'],['KL']]],
  ['3-5-2',[['FW','FW'],['KN','OS','OS','OS','KN'],['DF','DF','DF'],['KL']]],['3-4-3',[['FW','FW','FW'],['KN','OS','OS','KN'],['DF','DF','DF'],['KL']]]];
function twSnapOf(){const o={},ps=(G.s&&G.s.ps)||{};for(const k in ps){const p=ps[k];if(p&&(p.g||p.a))o[k]=[p.g||0,p.a||0];}return o;}
function twBuild(w){const S=G.s,rd=S.results[w];if(!rd||!rd.length)return null;const snap=S.twSnap||{},ps=S.ps||{},cand=[];
  for(const [h,a,hg,ag] of rd)for(const [cid,gf,ga] of [[h,hg,ag],[a,ag,hg]]){const C=CLUBS[cid];if(!C)continue;let sq;try{sq=squadOf(cid)||[];}catch(e){continue;}
    const res=gf>ga?0.45:gf===ga?0.1:-0.35,str=C.str||70,by={};for(const p of sq){if(p&&TW_N[p.pos])(by[p.pos]=by[p.pos]||[]).push(p);}
    for(const pos in TW_N)for(const p of (by[pos]||[]).slice().sort((x,y)=>(y.ovr||0)-(x.ovr||0)).slice(0,TW_N[pos])){
      const s=ps[p.k],o=snap[p.k]||[0,0],dg=s?Math.max(0,(s.g||0)-o[0]):0,da=s?Math.max(0,(s.a||0)-o[1]):0,r=srnd('tw'+S.year+'|'+w+'|'+p.k);
      const back=pos==='KL'||pos==='DF';
      const v=6.35+((p.ovr||70)-str)*0.035+res+dg*0.9+da*0.5+(back?(ga===0?0.55:ga>=3?-0.4:0):0)+(pos==='KL'&&ga===0?0.15:0)+(!back&&gf>=3?0.15:0)+(r()*1.3-0.65);
      cand.push({n:p.name,k:p.k,c:cid,p:pos,r:Math.round(clamp(v,4.5,9.9)*10)/10,g:dg,a:da});}}
  /* futbolcu kariyeri: oyuncu yalnız maç notu 8+ ise (eski kuralla aynı) */
  if(isPl()&&TW_PEND&&TW_ME&&TW_ME.w===w&&G.p&&TW_N[G.p.pos])cand.push({n:meN(),c:G.club,p:G.p.pos,r:Math.round(clamp(TW_ME.r,4.5,10)*10)/10,g:TW_ME.g||0,a:TW_ME.a||0,me:1});
  if(!cand.length)return null;
  cand.sort((x,y)=>(y.me?1:0)-(x.me?1:0)||y.r-x.r);
  const byP={};for(const x of cand)(byP[x.p]=byP[x.p]||[]).push(x);
  let best=null;for(const [f,lines] of TW_F){const need={};lines.flat().forEach(p=>need[p]=(need[p]||0)+1);if(Object.keys(need).some(p=>(byP[p]||[]).length<need[p]))continue;
    const q={};for(const p in need)q[p]=byP[p].slice(0,need[p]);const sc=Object.values(q).flat().reduce((s,x)=>s+x.r,0)+(Object.values(q).flat().some(x=>x.me)?100:0);
    if(!best||sc>best.sc){const L=lines.map(l=>{const ix={};return l.map(p=>{const i=ix[p]=(ix[p]||0);ix[p]++;return q[p][i];});});
      best={sc,f,L};}}
  if(!best){const gk=byP.KL&&byP.KL[0],o=cand.filter(x=>x.p!=='KL').slice(0,10);if(!gk||o.length<10)return null;best={f:'',L:[o.filter(x=>x.p==='FW'||x.p==='KN'),o.filter(x=>x.p==='OS'),o.filter(x=>x.p==='DF'),[gk]].filter(l=>l.length)};}
  const all=best.L.flat();let mo=all[0];for(const x of all)if(x.r>mo.r)mo=x;
  return {y:S.year,w:w+1,lg:S.league,f:best.f,mo:mo.k||(mo.me?'me':''),L:best.L.map(l=>l.map(x=>{const o={n:x.n,c:x.c,p:x.p,r:x.r};if(x.k)o.k=x.k;if(x.g)o.g=x.g;if(x.a)o.a=x.a;if(x.me)o.me=1;return o;}))};}
function twSend(T){const L=LEAGUES[T.lg]||{},all=T.L.flat(),mo=all.find(x=>(x.k||(x.me?'me':''))===T.mo)||all[0],mine=all.filter(x=>x.c===G.club).length;
  const cn=id=>(CLUBS[id]||{}).name||'';
  let body=`${L.name||'Lig'} ${T.w}. hafta en iyi 11’i${T.f?` (${T.f})`:''} açıklandı. Haftanın oyuncusu ${mo.me?meN():mo.n} (${cn(mo.c)}, ${mo.r.toFixed(1)}).`;
  if(TW_PEND&&all.some(x=>x.me))body+=' '+TW_PEND.body;else if(mine)body+=` ${cn(G.club)} listede ${mine} oyuncuyla yer aldı.`;
  msg('gundem',`Haftanın 11’i · ${T.w}. hafta`,body,{totw:T});}
function twTick(){const S=G&&G.s;if(!S||!Array.isArray(S.results)||!Array.isArray(S.fixtures)||!S.ps)return;const n=S.results.length;
  if(S.twN==null||n<S.twN){S.twN=n;S.twSnap=twSnapOf();return;}
  if(n>S.twN){let T=null;try{T=twBuild(n-1);}catch(e){console.warn('totw',e);}S.twN=n;S.twSnap=twSnapOf();if(T){twSend(T);TW_PEND=null;}}}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{twTick();}catch(e){console.warn('totw',e);}return r;})(nextDay);
afterMatch=(old=>function(res,played){TW_PEND=null;try{TW_ME={w:(G.s.results||[]).length-1,r:(res&&res.rating)||0,g:(res&&res.goals)||0,a:(res&&res.assists)||0};}catch(e){}
  const r=old.apply(this,arguments);
  /* hafta işlenmeden (kupa maçı, sezon sonu) kalan eski mesaj: düz metin olarak gönder */
  try{if(TW_PEND){const b=TW_PEND.body;TW_PEND=null;msg('gundem','Haftanın 11’i açıklandı',b,{twRaw:1});}}catch(e){}TW_ME=null;return r;})(afterMatch);

function twSur(n){const w=String(n||'').trim().split(/\s+/);return w.length>1&&w[w.length-1].length>2?w[w.length-1]:w.join(' ');}
function twPitchHTML(T){try{const all=T.L.flat(),L=LEAGUES[T.lg]||{},mine=all.filter(x=>x.c===G.club).length;
  const card=x=>{const c=CLUBS[x.c],mo=(x.k||(x.me?'me':''))===T.mo,nm=x.me?meN():x.n;
    const name=x.me?`<b class="plink" data-act="goPlayer" title="${esc(nm)}">${esc(twSur(nm))}</b>`:x.k&&c?`<b class="plink" data-act="pcard" data-id="${x.c}" data-k="${esc(x.k)}" title="${esc(nm)}">${esc(twSur(nm))}</b>`:`<b>${esc(twSur(nm))}</b>`;
    return `<div class="tw-p${x.me?' me':''}${x.c===G.club?' mine':''}${mo?' mo':''}"><span class="tw-r${x.r>=8.5?' hi':x.r>=7.5?' md':''}">${x.r.toFixed(1)}</span>${c?`<span class="tw-cr" data-act="club" data-id="${x.c}" title="${esc(c.name)}">${crestSVG(c,20)}</span>`:''}${name}<small>${c?`<span class="clink" data-act="club" data-id="${x.c}">${esc(c.short||c.name)}</span>`:''}${x.g?` · ${'⚽'.repeat(Math.min(3,x.g))}`:''}${x.a?` · 🅰${x.a>1?x.a:''}`:''}</small>${mo?'<i class="tw-star" title="Haftanın oyuncusu">★</i>':''}</div>`;};
  const rows=T.L.map(l=>`<div class="tw-row">${l.map(card).join('')}</div>`).join('');
  const clubs={};all.forEach(x=>clubs[x.c]=(clubs[x.c]||0)+1);const top=Object.entries(clubs).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return `<div class="tw-box"><div class="tw-hd"><span>⭐ ${esc(L.short||L.name||'')} · ${T.w}. hafta</span><span>${esc(T.f||'')}</span></div><div class="tw-pitch"><i class="tw-ln"></i>${rows}</div>
    <div class="tw-ft">${top.map(([id,n])=>CLUBS[id]?`<span class="tw-cl${id===G.club?' mine':''}" data-act="club" data-id="${id}">${crestSVG(CLUBS[id],14)}${esc(CLUBS[id].short||CLUBS[id].name)} <b>${n}</b></span>`:'').join('')}${mine?`<small>Senin kulübünden ${mine} oyuncu</small>`:''}</div></div>`;}catch(e){console.warn('totw',e);return '';}}

/* ---------- kulüp bağlantıları ---------- */
function clubLink(x,label){const id=CLUBS[x]?x:clubIdByName(x);const c=CLUBS[id];if(!c)return esc(label||x||'');return `<span class="clink" data-act="club" data-id="${id}">${esc(label||c.name)}</span>`;}
let CLX={key:'',map:null,re:null,first:null};
const CLX_STOP=new Set(['BAY','MİL','GÜN','HB','SK','TR','YÖN','RAP','KAD','GÖZ','SEN','HC','TR','AV','KL','DF','OS','KN','FW','FV','OK','GOL','MAÇ','VS']);
const CLX_SPL=/[\s’'"()\[\],;:!?/·–—-]+/;
const clxTrim=s=>s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
function clxIndex(){if(!G||!G.s)return null;const ids=Object.keys(CLUBS);const key=ids.length+'|'+G.s.league+'|'+G.club;if(CLX.key===key)return CLX;
  const map=new Map(),lg=G.s.league;
  for(const id of ids){const c=CLUBS[id];if(c&&c.name&&c.name.length>=4&&!map.has(c.name))map.set(c.name,id);}
  for(const id of ids){const c=CLUBS[id];if(!c)continue;if(c.league===lg||id===G.club){if(c.name&&c.name.length>=4)map.set(c.name,id);const s=c.short;if(s&&s.length>=2&&s===s.toLocaleUpperCase('tr')&&/\p{L}/u.test(s)&&!CLX_STOP.has(s)&&!map.has(s))map.set(s,id);}}
  const first=new Set();for(const n of map.keys())first.add(clxTrim(n.split(CLX_SPL)[0]));
  const alt=[...map.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  CLX={key,map,first,re:alt?new RegExp(`(?<![\\p{L}\\p{N}])(${alt})(?![\\p{L}\\p{N}])`,'gu'):null};return CLX;}
function clubIdByName(n){const I=clxIndex();return I&&I.map?I.map.get(n)||null:null;}
const CLX_SKIP='button,a,input,textarea,select,option,label,svg,canvas,[data-act],[contenteditable],.plink,.clink,.ib-av,.msg-tag,.tab,.top,#tabs,.ng-id,.cp-hd h2,.cp-hd h3,.cp-name';
function clubLinkify(root,skipId){const I=clxIndex();if(!I||!I.re||!root)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=n.nodeValue,pe=n.parentElement;if(!pe||!v||v.length<2)return NodeFilter.FILTER_REJECT;
    let hit=false;for(const t of v.split(CLX_SPL)){if(t&&I.first.has(clxTrim(t))){hit=true;break;}}if(!hit)return NodeFilter.FILTER_REJECT;
    if(pe.closest(CLX_SKIP))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
  const ns=[];let n;while((n=w.nextNode()))ns.push(n);
  for(const t of ns){const s=t.nodeValue,frag=document.createDocumentFragment();let last=0,mm;I.re.lastIndex=0;
    while((mm=I.re.exec(s))){const id=I.map.get(mm[1]);if(!id||id===skipId)continue;frag.append(s.slice(last,mm.index));const sp=document.createElement('span');sp.className='clink';sp.dataset.act='club';sp.dataset.id=id;sp.textContent=mm[1];frag.append(sp);last=mm.index+mm[1].length;}
    if(last){frag.append(s.slice(last));t.replaceWith(frag);}}}
function clxModal(){try{const mc=$('#modalCard');if(!mc||$('#modal').hidden)return;const cp=mc.querySelector('.cp-wrap');clubLinkify(mc,cp&&typeof CP!=='undefined'?CP.id:null);}catch(e){}}
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.phase!=='tryout')clubLinkify($('#view'));}catch(e){}return r;})(render);
openModal=(old=>function(){const r=old.apply(this,arguments);clxModal();return r;})(openModal);
showPCard=(old=>function(){const r=old.apply(this,arguments);clxModal();return r;})(showPCard);
showClub=(old=>function(){const r=old.apply(this,arguments);clxModal();return r;})(showClub);
ACTX.cpTab=(old=>function(){const r=old.apply(this,arguments);clxModal();return r;})(ACTX.cpTab);
try{if(ACTX.pfTab)ACTX.pfTab=(old=>function(){const r=old.apply(this,arguments);clxModal();return r;})(ACTX.pfTab);}catch(e){}
/* maç sonu ekranı (#ftSheet) maç katmanında oluşur */
try{const mt=document.getElementById('match');if(mt&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{const s=document.getElementById('ftSheet');if(s&&!s.dataset.clx){s.dataset.clx='1';try{clubLinkify(s);}catch(e){}}}).observe(mt,{childList:true,subtree:true});}catch(e){}
