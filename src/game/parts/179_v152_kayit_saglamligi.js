/* ================= v152: kayıt sağlamlığı — küçük kayıt (oyuncu geçmişi yalnız ilgili oyunculara), hızlı kapanış kaydı, bozuk kayıt penceresi ve yedek, kota penceresinde kayıt boyutları, sezon geçişi hızlandı, Devam çift basma koruması ================= */
const KV={busy:0,t0:0,set:null,setY:null,tb:null,raw:0,wk:null};
const KV_TOP=48,KV_YP='kariyer-yedek-',KV_YIDX='kariyer-yedekler-v1';
const KV_RE=/^[a-z0-9_]+#\d+$|^ng\d{4}_/i;
/* ---------- ilgili oyuncular: kendi ligin/kulübün, geçmiş kulüplerin ligleri, en güçlü kulüpler ve kayıtta adı geçen oyuncular (izleme listesi, gözlem raporu, gelen kutusu…) ---------- */
function kvClubOf(k){try{const t=G.tx&&G.tx[k];if(t)return t;const i=k.lastIndexOf('#');if(i>0){const h=k.slice(0,i);if(CLUBS[h])return h;}return ((pRaw(k)||{}).home)||null;}catch(e){return null;}}
function kvRefs(){const ref=new Set(),skip={ph:1,ovh:1,tx:1,txh:1,leg:1};
  const walk=(o,d)=>{if(o==null||d>14)return;if(typeof o==='string'){if(o.length<40&&KV_RE.test(o))ref.add(o);return;}if(typeof o!=='object')return;
    if(Array.isArray(o)){for(const x of o)walk(x,d+1);return;}for(const k in o){if(KV_RE.test(k))ref.add(k);walk(o[k],d+1);}};
  for(const k in G){if(skip[k])continue;if(k==='s'){for(const j in G.s){if(j==='cal'||j==='fixtures'||j==='ol')continue;walk(G.s[j],1);}continue;}walk(G[k],0);}return ref;}
function kvSet(){const Y=G.s?G.s.year:2026;if(KV.set&&KV.setY===Y+'/'+(G.s?G.s.day:0))return KV.set;
  const lgs=new Set(),clubs=new Set();const addC=id=>{if(id&&CLUBS[id])clubs.add(id);};
  try{if(G.s&&G.s.league)lgs.add(G.s.league);}catch(e){}try{const c=CLUBS[G.club];if(c)lgs.add(c.league);}catch(e){}
  for(const h of G.history||[]){const c=h&&CLUBS[h.club];if(c)lgs.add(c.league);addC(h&&h.club);}
  for(const l of lgs)for(const c of leagueClubs(l))clubs.add(c.id);addC(G.club);if(G.m)addC(G.m.club);const lg=new Set(clubs);
  const top=Object.values(CLUBS).filter(c=>{const L=LEAGUES[c.league];return L&&!L.youth&&L.tier>=6;}).sort((a,b)=>(b.str||0)-(a.str||0)).slice(0,KV_TOP);for(const c of top)clubs.add(c.id);
  let keys;try{keys=kvRefs();}catch(e){keys=new Set();}
  KV.set={clubs,keys,lg};KV.setY=Y+'/'+(G.s?G.s.day:0);return KV.set;}
function kvKeep(k,cid){const S=kvSet();return S.keys.has(k)||(cid!=null&&S.clubs.has(cid));}
/* tablo hesabı arşiv sırasında lig başına bir kez yapılır */
tableOf=(old=>function(lid,res){if(!KV.tb)return old.apply(this,arguments);const key=lid+'|'+(res?res.length:0);if(KV.tb[key]&&KV.tb[key].r===res)return KV.tb[key].v;const v=old.apply(this,arguments);KV.tb[key]={r:res,v};return v;})(tableOf);
/* ---------- kariyer geçmişi arşivi ----------
   oyun öncesi (başlangıç yılından önceki) arka plan sezonu kaydedilmez: v128 bu satırları zaten göstermiyordu.
   Sezon satırı yalnız ilgili oyunculara ve geçmişi süren oyunculara yazılır; diğer oyuncuların profili gerçek geçmiş + süren sezonu gösterir. */
phArchive=function(){const S=G.s;if(!S||!S.cal||S.phArch)return;S.phArch=1;if(S.year<(G.ph0Y||2026))return;G.ph=G.ph||{};
  const K=kvSet(),need=new Map();const want=(cid,k)=>{if(!cid)return;if(!need.has(cid))need.set(cid,k===null?null:new Set());const s=need.get(cid);if(s&&k!==null)s.add(k);};
  for(const cid of K.clubs)want(cid,null);for(const k of K.keys)want(kvClubOf(k),k);for(const k in G.ph)want(kvClubOf(k),k);
  KV.tb={};try{for(const [cid,only] of need){const c=CLUBS[cid],L=c&&LEAGUES[c.league];if(!L||L.youth||L.tier<6)continue;let M;try{M=clubSeasonEst(cid);}catch(e){continue;}
      for(const [k,x] of Object.entries(M)){if(!x||!x.ap)continue;if(only?!(only.has(k)&&(K.keys.has(k)||(x.p&&x.p.ovr>=70))):(!K.lg.has(cid)&&x.ap<3&&!(x.p&&x.p.ovr>=70)))continue;const a=G.ph[k]=G.ph[k]||[];if(a.some(z=>z[0]===S.year))continue;a.push([S.year,cid,x.ap,x.g,x.a,Math.round((x.rt/x.ap)*100)]);}}}
  finally{KV.tb=null;}
  for(const k in G.ph){G.ph[k]=G.ph[k].filter(z=>z[0]>S.year-8&&z[0]>=(G.ph0Y||2026));if(!G.ph[k].length)delete G.ph[k];}};
/* güç geçmişi (gelişim grafiği): aynı oyuncu kümesi; diğerleri için grafik tahmini çizer */
ovhArchive=function(Y){if(Y<(G.ph0Y||2026))return;G.ovh=G.ovh||{};const K=kvSet(),need=new Set(K.clubs);
  for(const k of K.keys){const c=kvClubOf(k);if(c)need.add(c);}for(const k in G.ovh){const c=kvClubOf(k);if(c)need.add(c);}
  /* kadro yerine sezon tahmini kullanılır: aynı sonuç önbelleğe girer, hemen ardından gelen kariyer arşivi yeniden hesaplamaz */
  KV.tb={};try{for(const cid of need){const c=CLUBS[cid],L=c&&LEAGUES[c.league];if(!L||L.youth||L.tier<6)continue;let M;try{M=clubSeasonEst(cid);}catch(e){continue;}
    for(const x of Object.values(M)){const p=x&&x.p;if(!p||!p.k||p.k==='ME'||p.k==='me')continue;if(!(K.keys.has(p.k)||(K.clubs.has(cid)&&(K.lg.has(cid)||p.ovr>=68))||(G.ovh[p.k]&&p.ovr>=70)))continue;(G.ovh[p.k]=G.ovh[p.k]||{})[Y]=p.ovr;}}}finally{KV.tb=null;}
  for(const k in G.ovh){for(const yy in G.ovh[k])if(+yy<Y-7)delete G.ovh[k][yy];if(!Object.keys(G.ovh[k]).length)delete G.ovh[k];}};
/* ---------- eski kayıtları küçült (yüklenince bir kez) ---------- */
function kvMigrate(){if(!G||G.kv152)return;const Y0=G.ph0Y||2026;let n0=0,n1=0;
  try{KV.set=null;const K=kvSet();
    if(G.ph)for(const k in G.ph){const a=(G.ph[k]||[]).filter(z=>Array.isArray(z)&&z[0]>=Y0);n0++;if(!a.length||!kvKeep(k,kvClubOf(k))){delete G.ph[k];n1++;}else G.ph[k]=a;}
    if(G.ovh)for(const k in G.ovh){if(!kvKeep(k,kvClubOf(k))){delete G.ovh[k];n1++;}}
  }catch(e){console.warn('kayıt küçültme',e);}G.kv152=1;KV.set=null;return {n0,n1};}
/* ---------- kayıt doğrulama ---------- */
function kvGecerli(g){if(!g||typeof g!=='object')return 'kayıt boş';if(g.v!==4)return 'sürüm tanınmadı';if(!g.p||typeof g.p!=='object')return 'kariyer bilgisi eksik';
  if(!g.s||typeof g.s!=='object')return 'sezon bilgisi eksik';if(typeof g.s.year!=='number'||!isFinite(g.s.year))return 'sezon yılı eksik';
  if(!g.s.league||!LEAGUES[g.s.league])return 'lig bilgisi eksik';return null;}
function kvOku(id){let raw=null;try{raw=localStorage.getItem(SLOT_PRE+id);}catch(e){return {err:'tarayıcı kayıt alanına erişilemiyor'};}
  if(raw==null)return {err:'kayıt bulunamadı',raw};let g=null;try{g=svParse(raw);}catch(e){return {err:'kayıt verisi yarım ya da bozuk',raw};}
  if(!g)return {err:'sıkıştırılmış kayıt açılamadı',raw};const why=kvGecerli(g);if(why)return {err:why,raw,g0:g};return {g,raw};}
slotLoad=(old=>function(id){const g=old.apply(this,arguments);if(g&&kvGecerli(g))return null;return g;})(slotLoad);
/* ---------- yuvarlanan yedek: son iyi kaydın en çok 7 oyun günü eski bir kopyası (yer varsa) ---------- */
function kvYIdx(){try{const o=JSON.parse(localStorage.getItem(KV_YIDX)||'{}');return o&&typeof o==='object'?o:{};}catch(e){return {};}}
function kvYIdxW(o){try{localStorage.setItem(KV_YIDX,JSON.stringify(o));}catch(e){}}
function kvYedekSil(id){try{localStorage.removeItem(KV_YP+id);}catch(e){}const o=kvYIdx();if(o[id]){delete o[id];kvYIdxW(o);}}
function kvYedekleriSil(keep){const o=kvYIdx();for(const id of Object.keys(o))if(id!==keep)kvYedekSil(id);try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith(KV_YP)&&k.slice(KV_YP.length)!==keep)localStorage.removeItem(k);}}catch(e){}}
function kvYedekYaz(sid,data){try{if(!G||G.sid!==sid||kvGecerli(G))return;const o=kvYIdx(),m=o[sid],y=G.s.year,d=G.s.day;
    if(m&&m.y===y&&d-m.d<7&&d>=m.d)return;const U=svUsage(),old=(()=>{try{return (localStorage.getItem(KV_YP+sid)||'').length;}catch(e){return 0;}})();
    if(U.t-old+data.length>3.0e6){if(old)kvYedekSil(sid);return;}
    localStorage.setItem(KV_YP+sid,data);o[sid]={y,d,t:Date.now()};kvYIdxW(o);}catch(e){try{kvYedekSil(sid);}catch(_){}}}
svDone=(old=>function(d){const ok=d&&d.seq===SV.seq;const r=old.apply(this,arguments);try{if(ok&&!SV.err)kvYedekYaz(d.sid,'LZ1:'+d.c);}catch(e){}return r;})(svDone);
slotDel=(old=>function(id){const r=old.apply(this,arguments);kvYedekSil(id);return r;})(slotDel);
/* ---------- sayfa kapanırken hızlı kayıt: ana iş parçacığında sıkıştırma yok ----------
   Kayıt artık küçük olduğundan düz JSON birkaç ms'de yazılır. Yer yetmezse önce yedekler silinir; yine olmazsa son sıkıştırılmış kayıt yerinde kalır
   (setItem başarısızsa eski değer silinmez) ve sayfa geri gelince yeniden kaydedilir. */
window.removeEventListener('pagehide',svFlushSync);window.removeEventListener('beforeunload',svFlushSync);
svFlushSync=function(){if(!G||!G.p)return;if(!SV.dirty&&!SV.busy)return;clearTimeout(SV.t);SV.seq++;SV.dirty=false;SV.busy=false;
  if(!G.sid)G.sid='s'+Date.now().toString(36)+rint(10,99);let s;try{s=JSON.stringify(G);}catch(e){return;}
  const put=v=>{try{svPut(G.sid,v);return true;}catch(e){return false;}};
  let ok=put(s);if(!ok){kvYedekleriSil(null);ok=put(s);}if(!ok&&s.length<300000)ok=put('LZ1:'+LZ.c16(s));
  if(ok){KV.raw=1;SV.err=0;}else{SV.dirty=true;SV.err++;}svMeta();};
window.addEventListener('pagehide',()=>svFlushSync());window.addEventListener('beforeunload',()=>svFlushSync());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&G&&G.p&&(KV.raw||SV.dirty)){KV.raw=0;try{slotSave();}catch(e){}}});
svFlush=(old=>function(){KV.raw=0;return old.apply(this,arguments);})(svFlush);
/* başlangıç ekranında düz (sıkıştırılmamış) kalmış eski kayıtları arka planda sıkıştır */
function kvCompactSlots(){try{if(typeof Worker==='undefined')return;const ids=slotsList().map(x=>x.id).filter(id=>!(G&&G.sid===id));const todo=[];
    for(const id of ids){const v=localStorage.getItem(SLOT_PRE+id);if(v&&!v.startsWith('LZ1:')&&v.length>150000)todo.push([id,v]);}if(!todo.length)return;
    if(!KV.wk){const code=`${LZ_SRC};onmessage=e=>{postMessage({id:e.data.id,n:e.data.n,c:LZ.c16(e.data.s)});};`;KV.wk=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
      KV.wk.onmessage=e=>{const d=e.data;try{if(G&&G.sid===d.id)return;const cur=localStorage.getItem(SLOT_PRE+d.id);if(cur&&cur.length===d.n&&!cur.startsWith('LZ1:'))localStorage.setItem(SLOT_PRE+d.id,'LZ1:'+d.c);}catch(err){}};}
    for(const [id,v] of todo)KV.wk.postMessage({id,n:v.length,s:v});}catch(e){}}
/* ---------- bozuk kayıt penceresi ---------- */
function kvHamIndir(name,text){try{const blob=new Blob([text],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);toast('Ham kayıt dosyası hazırlandı');}catch(e){toast('Dışa aktarma başarısız');}}
function kvTarih(m){try{return m?`${seasonLabel(m.y)} sezonu, ${m.d}. gün`:'';}catch(e){return '';}}
function kvBozuk(id,why){const meta=slotsList().find(x=>x.id===id)||{},Y=kvYIdx()[id],hasY=(()=>{try{return !!localStorage.getItem(KV_YP+id);}catch(e){return false;}})();
  openModal(`<h3>Kayıt okunamadı</h3><p><b>${esc(meta.name||'Kariyer')}</b> kaydı açılamadı${why?` (${esc(why)})`:''}. Kayıt yarım yazılmış ya da bozulmuş olabilir.</p>
    ${hasY?`<p>Bu kariyerin bir yedeği var: <b>${esc(kvTarih(Y))}</b>. Yedekten dönersen o tarihten sonraki ilerleme kaybolur.</p>`:'<p class="muted">Bu kariyerin yedeği yok.</p>'}
    <p class="muted">Kaydı silmeden önce ham hâlini dosya olarak indirebilirsin.</p>
    <div class="offer-btns">${hasY?`<button class="cta sm" data-act="kvYedekDon" data-id="${esc(id)}">Yedekten dön</button>`:''}<button class="btn sm" data-act="kvHam" data-id="${esc(id)}">⬇ Dışa aktar</button><button class="btn sm kv-sil" data-act="kvBozukSil" data-id="${esc(id)}">Sil</button><button class="btn ghost sm" data-act="closeModal">Kapat</button></div>`);}
function kvBaslat(g,id){G=g;G.sid=id;try{kvMigrate();}catch(e){}try{applyBoosts();}catch(e){}TAB='hub';CTAB='cur';LTAB='tbl';VLG=null;
  try{render();}catch(e){console.warn(e);G=null;try{closeModal();}catch(_){}try{showStart();}catch(_){}kvBozuk(id,'ekran açılamadı: '+String(e&&e.message||e).slice(0,80));return false;}window.scrollTo(0,0);return true;}
ACTX.slotGo=el=>{const id=el.dataset.id;try{if(G&&G.sid===id&&(SV.dirty||SV.busy))svFlushSync();}catch(e){}const r=kvOku(id);if(!r.g){kvBozuk(id,r.err);return;}kvBaslat(r.g,id);};
ACTX.kvHam=el=>{const id=el.dataset.id;let raw='';try{raw=localStorage.getItem(SLOT_PRE+id)||'';}catch(e){}if(!raw)return toast('Kayıt verisi yok');kvHamIndir(`futbol-kariyeri-bozuk-${id}.txt`,raw);};
ACTX.kvBozukSil=el=>{const id=el.dataset.id;if(!el.classList.contains('onay')){el.classList.add('onay');el.textContent='Emin misin? Sil';return;}slotDel(id);closeModal();toast('Kayıt silindi');try{showStart();}catch(e){}};
ACTX.kvYedekDon=el=>{const id=el.dataset.id;let v=null,g=null;try{v=localStorage.getItem(KV_YP+id);g=svParse(v);}catch(e){g=null;}
  if(!g||kvGecerli(g)){toast('Yedek de okunamadı');return;}try{localStorage.setItem(SLOT_PRE+id,v);}catch(e){}closeModal();if(kvBaslat(g,id)){toast('Yedekten dönüldü: '+kvTarih(kvYIdx()[id]));try{save();}catch(e){}}};
/* içe aktarılan kayıt da küçültülür */
svImport=(old=>function(txt){const r=old.apply(this,arguments);try{if(G&&!G.kv152){kvMigrate();save();}}catch(e){}return r;})(svImport);
showStart=(old=>function(){const r=old.apply(this,arguments);try{clearTimeout(KV.cmp);KV.cmp=setTimeout(kvCompactSlots,1500);}catch(e){}return r;})(showStart);
/* ---------- kota penceresi: kayıtların boyutu ve tek tıkla yer açma ---------- */
function kvSlotSizes(){const out=[];for(const x of slotsList()){let n=0,y=0;try{n=(localStorage.getItem(SLOT_PRE+x.id)||'').length;y=(localStorage.getItem(KV_YP+x.id)||'').length;}catch(e){}out.push({x,n,y});}return out.sort((a,b)=>(b.n+b.y)-(a.n+a.y));}
function kvQuotaHTML(){const U=svUsage(),L=kvSlotSizes(),yd=L.reduce((a,z)=>a+z.y,0);
  const rows=L.map(({x,n,y})=>{const me=G&&x.id===G.sid,c=CLUBS[x.club];return `<li class="kv-q"><div><b>${esc(x.name||'Kariyer')}</b>${me?' <em>şu an açık</em>':''}<small>${esc(x.title||'')}${c?' · '+esc(c.name):''} · ${seasonLabel(x.year||2026)}</small></div><span class="kv-n">${svKB(n)}${y?`<small>+ yedek ${svKB(y)}</small>`:''}</span><span class="kv-b"><button class="btn ghost sm" data-act="svExp" data-id="${esc(x.id)}" title="Dosya olarak indir">⬇</button>${me?'':`<button class="btn ghost sm" data-act="kvQSil" data-id="${esc(x.id)}">Sil</button>`}</span></li>`;}).join('');
  return `<h3>Kayıt alanı doldu</h3><p>Tarayıcının kayıt alanı dolu olduğu için son ilerleme kaydedilemedi. Toplam kullanım <b>${svKB(U.t)}</b> / ~5 MB.</p>
    <ul class="kv-ql">${rows||'<li class="muted">Kayıtlı kariyer yok.</li>'}</ul>
    <p class="muted">Kullanmadığın kariyerleri önce dosya olarak indirip silebilirsin; indirilen dosya başlangıç ekranındaki “Kayıt dosyası yükle” ile geri açılır.</p>
    <div class="offer-btns"><button class="cta sm" data-act="svExp">⬇ Bu kaydı dışa aktar</button>${yd?`<button class="btn sm" data-act="kvYSil">Yedekleri sil (${svKB(yd)})</button>`:''}<button class="btn" data-act="closeModal">Kapat</button></div>`;}
svQuota=function(sid,data){try{svPrune(true);}catch(e){}try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  try{svPut(sid,data);return true;}catch(e){}kvYedekleriSil(null);try{svPut(sid,data);return true;}catch(e){}
  SV.err++;if(SV.err===1||SV.err%20===0){try{openModal(kvQuotaHTML());}catch(_){}}return false;};
ACTX.kvQSil=el=>{const id=el.dataset.id;if(!el.classList.contains('onay')){el.classList.add('onay');el.textContent='Emin misin?';return;}slotDel(id);toast('Kariyer silindi');SV.dirty=true;try{svFlushSync();}catch(e){}try{openModal(kvQuotaHTML());}catch(e){}};
ACTX.kvYSil=()=>{kvYedekleriSil(null);toast('Yedekler silindi');SV.dirty=true;try{svFlushSync();}catch(e){}try{openModal(kvQuotaHTML());}catch(e){}};
/* ---------- Devam: çift tıklama / basılı tutulan boşluk tuşu koruması ---------- */
fmCont=(old=>function(){const ev=typeof window!=='undefined'?window.event:null,user=!!(ev&&(ev.type==='click'||ev.type==='keydown'||ev.type==='pointerup'||ev.type==='touchend'));
  const now=performance.now();if(user&&(KV.busy||now-KV.t0<160))return;KV.busy++;KV.t0=now;try{return old.apply(this,arguments);}finally{KV.busy--;if(user)KV.t0=performance.now();}})(fmCont);
ACTX.fmCont=()=>fmCont();
/* yeni kariyer zaten küçük biçimde başlar: yükleme sırasında küçültme gerekmez */
newGame=(old=>function(){const r=old.apply(this,arguments);try{if(G)G.kv152=1;}catch(e){}return r;})(newGame);
