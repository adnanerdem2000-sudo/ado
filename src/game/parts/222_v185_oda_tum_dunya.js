/* ================= v185: çevrimiçi oda — tüm dünya ortak: kupalar, Avrupa, transferler, hocalar, kulüpler ve iki insanın verisi iki cihazda aynı ilerler ================= */
/* Kural (v169 sonuç kuralının genişletilmişi): dünyanın tek kaynağı oda sunucusu (kurucu). İki insanın her biri kendi kulübünün (TD/SD/başkan) ve kendi kariyerinin
   kaynağıdır; bunlar ona ait cihazdan gelir ve karşı tarafta (kadro, oyuncu kartı, kulüp sayfası) aynen gösterilir. Kişisel kalan yalnız gelen kutusu iletileri ve bekleyen kararlardır.
   Konular (kalıcı/retained, her biri ≤ V185_PARCA bayt, deflate-raw + AES-GCM):
     MP.base+'/w/<grup>/<parça>/'+pid  sunucunun dünya grupları (yalnız değişen grup gönderilir; imza = içerik özeti)
     MP.base+'/o/me/<parça>/'+pid      her oyuncunun kendi verisi (kulübü, kadrosu, kariyeri, kupa yolu, kendi yaptığı transferler)
   Misafirde dünya üreten rastgele işler (YZ transferleri, hoca kovmaları, altyapı çıkışları, efsaneler, söylentiler) oda açıkken çalışmaz; sunucunun dünyası gelince
   ilgili gelen kutusu iletileri (transfer haberleri, kulübünün yeni hocası, sunucudaki dünya gündemi) misafirde de oluşur. Kupa ağaçları iki cihazda aynı tohumla,
   iki insanın gerçek sonuçları işlenerek kurulur; insanların rakipleri ağaçtan alınır. */
const V185={sig:{},boy:{},inb:{},got:{},q:{},ver:0,cap:0,seq:0,t:null,last:0,busy:0,cal:{},eub:{},nc:{},trlIlk:0,coIlk:0,wnIlk:0,ilk:{}};
const V185_PARCA=60000;
const V185_SIRA=['gen','co','cs','tx','ng','trl','wd','feed','leg','ph','ovh','ps','sz','wn'];
function v185On(){try{return !!(mpOn()&&mpPartnerExists()&&MP.code);}catch(e){return false;}}
function v185Host(){return v185On()&&G.mp.role==='host';}
function v185Guest(){return v185On()&&G.mp.role==='guest';}
function v185O(){try{const O=G&&G.mpO;if(!O||!v185On())return null;if(!(G.mp.mem||[]).includes(O.p))return null;return O;}catch(e){return null;}}
function v185PC(){const O=v185O();return O&&O.club&&O.club!==G.club&&CLUBS[O.club]?O.club:null;}
function v185PCM(){const O=v185O();return O&&O.mode==='mgr'&&O.sq&&v185PC()?O.club:null;}
function v185J(){G.mp.jr=G.mp.jr||{tx:{}};G.mp.jr.tx=G.mp.jr.tx||{};return G.mp.jr;}
function v185Mesgul(){try{if(MP.going)return true;if(typeof FX!=='undefined'&&FX){const f=$('#fx');if(f&&!f.hidden)return true;}const m=$('#match');if(m&&!m.hidden)return true;}catch(e){}return false;}
const v185Kopya=x=>x==null?x:JSON.parse(JSON.stringify(x));
/* ---------- sıkıştırma ve şifreleme (ikili: base64 yok) ---------- */
async function v185Sik(str){try{if(typeof CompressionStream==='undefined')throw 0;const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'));return {z:1,u8:new Uint8Array(await new Response(cs).arrayBuffer())};}catch(e){return {z:0,u8:mpTE.encode(str)};}}
async function v185Ac(z,u8){if(!z)return mpTD.decode(u8);if(typeof DecompressionStream!=='undefined'){const ds=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return await new Response(ds).text();}
  const out=await adoAc(u8);return typeof out==='string'?out:mpTD.decode(out);}
async function v185Enc(head,bytes){const hb=mpTE.encode(JSON.stringify(head)),pt=new Uint8Array(2+hb.length+bytes.length);pt[0]=hb.length>>8;pt[1]=hb.length&255;pt.set(hb,2);pt.set(bytes,2+hb.length);
  if(!MP.key){const o=new Uint8Array(pt.length+1);o[0]=3;o.set(pt,1);return o;}
  const iv=mpRnd(12),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},MP.key,pt));const o=new Uint8Array(13+ct.length);o[0]=2;o.set(iv,1);o.set(ct,13);return o;}
async function v185Dec(u8){try{let pt;if(u8[0]===3)pt=u8.subarray(1);else if(u8[0]===2&&MP.key)pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:u8.subarray(1,13)},MP.key,u8.subarray(13)));else return null;
  const hl=(pt[0]<<8)|pt[1];return {head:JSON.parse(mpTD.decode(pt.subarray(2,2+hl))),bytes:pt.slice(2+hl)};}catch(e){return null;}}
/* bir grubu (yalnız değiştiyse) parçalara bölüp kalıcı konulara yayımla */
async function v185Yay(kind,g,obj,extra){const str=JSON.stringify(obj),sig=mpH53(str,13),key=kind+'/'+g;if(V185.sig[key]===sig)return 0;
  const {z,u8}=await v185Sik(str);const n=Math.max(1,Math.ceil(u8.length/V185_PARCA)),ts=Date.now();
  for(let i=0;i<n;i++){const head=Object.assign({k:kind,g,i,n,sig,z,ts,p:mpPid()},extra||{});const enc=await v185Enc(head,u8.subarray(i*V185_PARCA,(i+1)*V185_PARCA));
    if(!mqPub(MP.base+'/'+kind+'/'+g+'/'+i+'/'+mpPid(),enc,true))return 0;}
  V185.sig[key]=sig;V185.boy[key]=[str.length,u8.length,n];return n;}
/* ---------- sunucunun dünya grupları ---------- */
function v185TrlDis(){const T=G.trl||{},me='@'+mpPid(),s={};for(const [y,R] of Object.entries(T.s||{}))s[y]=R.map(r=>r[1]==='ME'?Object.assign(r.slice(),{1:me}):r);return {s,al:T.al||[],ly:T.ly==null?null:T.ly,bf:T.bf||0};}
function v185StrHarita(){const m={};for(const c of Object.values(CLUBS))if(c.str!==c.str0)m[c.id]=c.str;return m;}
const V185_GR={
  gen:()=>({lgMove:G.lgMove||{},lgHist:G.lgHist||[],qual:G.qual||null,qualPrev:G.qualPrev||null,coef:G.coef||null,cupW:G.cupW||[],cupWin:G.cupWin||{},cpChamps:G.cpChamps||[],chm:G.chm||{},dh:G.dh||{}}),
  co:()=>({co:G.co||{},coFree:G.coFree||[],coT:G.coT||{},coY:G.coY==null?null:G.coY}),
  cs:()=>({cs:G.cs||{}}),
  tx:()=>({tx:G.tx||{},txh:G.txh||{}}),
  ng:()=>({ng:G.ng||{},ngY:G.ngY||{}}),
  trl:()=>v185TrlDis(),
  wd:()=>({wd:G.wd||null}),
  feed:()=>({feed:G.feed||[]}),
  leg:()=>({leg:G.leg||{},legSeed:G.legSeed||0,legY:G.legY==null?null:G.legY}),
  ph:()=>({ph:G.ph||{},ph0Y:G.ph0Y==null?null:G.ph0Y}),
  ovh:()=>({ovh:G.ovh||{}}),
  ps:()=>({y:G.s.year,L:G.s.league,ps:G.s.ps||{}}),
  sz:()=>({y:G.s.year,L:G.s.league,ph:G.phase,day:G.s.day,str:v185StrHarita()}),
  wn:()=>({wn:G.mp.wn||[]})};
/* ---------- her oyuncunun kendi verisi ---------- */
function v185SahipNg(){const out={};if(!(G.mode==='mgr'&&G.m&&G.club))return out;const N=G.ng||{},tx=G.tx||{};for(const k of (G.m.acad||[]))if(N[k])out[k]=N[k];for(const k in N)if(tx[k]===G.club)out[k]=N[k];return out;}
function v185OYap(){const S=G.s;if(!S)return null;const mgr=G.mode==='mgr'&&G.m&&G.club&&CLUBS[G.club];
  const o={v:185,p:mpPid(),y:S.year,day:S.day,ph:G.phase,prof:G.prof||'',mode:G.mode||'',club:G.club||'',L:S.league,str:G.club&&CLUBS[G.club]?CLUBS[G.club].str:0,n:(G.p&&G.p.name)||''};
  if(isPl()&&G.p&&G.club&&CLUBS[G.club]&&G.phase!=='tryout'){let ovr=0,mv=0;try{ovr=OVR();}catch(e){}try{mv=marketValue();}catch(e){}
    o.me={p:G.p,contract:G.contract||null,mvh:G.mvh||[],totals:G.totals||null,stats:S.stats||null,cid:G.cid||'',capt:G.capt||null,loan:G.loan||null,ovr,mv,tro:(G.trophies||[]).length};}
  if(mgr){const m=G.m;let co=null;try{co=coachOf(G.club);}catch(e){}
    o.td={co,rep:m.rep==null?null:m.rep,mt:G.mt||null,st:m.st||null,budget:m.budget||0,wbud:m.wbud||0,conf:m.conf==null?null:m.conf,role:m.role||null};
    o.sq=squadOf(G.club).map(p=>{let ct=0,pt=null,v=0;try{ct=ctEnd(p);}catch(e){}try{pt=pPot(p);}catch(e){}try{v=pValue(p);}catch(e){}
      return [p.k,p.ovr,p.age,ct,Math.round(clamp(100-fatOf(p.k),0,100)),(m.inj&&m.inj[p.k])||0,(m.ban&&m.ban[p.k])||0,pt,v,p.num,p.pos,p.name];});
    o.pst=S.pst||null;o.cs=(G.cs&&G.cs[G.club])||null;}
  o.ps={};for(const [k,x] of Object.entries(S.ps||{}))if(x&&x.c===G.club)o.ps[k]=x;
  try{o.cups=(S.cups&&S.cups.club===G.club&&S.cups.year===S.year?S.cups.list:[]).map(k=>{const x=Object.assign({},k);delete x.table;delete x.st;return x;});}catch(e){o.cups=[];}
  const J=v185J(),j={tx:{},txh:{},trl:[]};for(const k of Object.keys(J.tx)){j.tx[k]=G.tx&&G.tx[k]!=null?G.tx[k]:null;if(G.txh&&G.txh[k])j.txh[k]=G.txh[k];}
  try{const T=G.trl,y=String(S.year);for(const r of ((T&&T.s&&T.s[y])||[]))if(r[1]==='ME'||J.tx[r[1]])j.trl.push(r[1]==='ME'?Object.assign(r.slice(),{1:'@'+mpPid()}):r);}catch(e){}
  j.ng=v185SahipNg();o.j=j;o.of=(G.mp.of||[]).slice(-40);return o;}
/* ---------- gönder ---------- */
function v185Planla(ms){if(!v185On())return;ms=ms==null?700:ms;const at=Date.now()+ms;if(V185.t&&V185.tAt<=at)return;clearTimeout(V185.t);V185.tAt=at;V185.t=setTimeout(()=>{V185.t=null;v185Gonder().catch(e=>console.warn('v185 gönder',e));},ms);}
async function v185Gonder(){if(!v185On()||!mpConnected()||!G.s)return;if(V185.busy){v185Planla(900);return;}V185.busy=1;
  try{const O=v185OYap();if(O)await v185Yay('o','me',O,{y:O.y,day:O.day});
    if(G.mp.role==='host')for(const g of V185_SIRA){let obj;try{obj=V185_GR[g]();}catch(e){continue;}await v185Yay('w',g,obj,{y:G.s.year,L:G.s.league,day:G.s.day,ph:G.phase});}
    V185.last=Date.now();}finally{V185.busy=0;}}
/* ---------- al ---------- */
async function v185Al(topic,pay){const d=await v185Dec(pay);if(!d||!G||!G.mp)return;const h=d.head;if(!h||!h.p||h.p===mpPid())return;if(!(G.mp.mem||[]).includes(h.p))return;
  if(h.k==='w'&&G.mp.role!=='guest')return;
  const key=h.k+'/'+h.g;let B=V185.inb[key];if(!B||B.sig!==h.sig){if(B&&B.ts>h.ts&&!B.done)return;if(B&&B.done&&B.ts>h.ts)return;B=V185.inb[key]={sig:h.sig,ts:h.ts,n:h.n,z:h.z,parts:[],head:h,done:false};}
  if(B.done)return;B.parts[h.i]=d.bytes;for(let i=0;i<B.n;i++)if(!B.parts[i])return;B.done=true;if(V185.got[key]===h.sig&&V185.ilk[key])return;
  const tot=B.parts.reduce((a,x)=>a+x.length,0),u8=new Uint8Array(tot);let o=0;for(const x of B.parts){u8.set(x,o);o+=x.length;}B.parts=[];
  let obj;try{obj=JSON.parse(await v185Ac(B.z,u8));}catch(e){console.warn('v185 aç',e);return;}
  V185.q[key]={head:h,obj,sig:h.sig};v185Isle();}
mpRecv=(old=>async function(topic,pay,retained){try{if(MP.base&&(topic.startsWith(MP.base+'/w/')||topic.startsWith(MP.base+'/o/'))){if(!pay.length||!mpOn())return;await v185Al(topic,pay);return;}}catch(e){console.warn('v185 al',e);return;}
  return old.apply(this,arguments);})(mpRecv);
function v185Isle(){if(!G||!G.s||!v185On())return;if(v185Mesgul()){clearTimeout(V185.qt);V185.qt=setTimeout(v185Isle,1200);return;}
  let ch=0;const Q=V185.q;
  if(Q['o/me']){const x=Q['o/me'];delete Q['o/me'];try{v185OAl(x.obj);V185.got['o/me']=x.sig;V185.ilk['o/me']=1;ch++;}catch(e){console.warn('v185 kendi verisi',e);}}
  if(G.mp.role==='guest')for(const g of V185_SIRA){const key='w/'+g,x=Q[key];if(!x)continue;let ok=true;try{ok=v185WAl(g,x.obj,x.head)!==false;}catch(e){console.warn('v185 dünya '+g,e);}
    if(ok){delete Q[key];V185.got[key]=x.sig;V185.ilk[key]=1;ch++;}}
  if(ch){V185.ver++;V185.eub={};V185.nc={};try{EUB_C={};}catch(e){}try{CSE_C={};}catch(e){}try{v185CupFix();}catch(e){console.warn('v185 kupa düzelt',e);}save();try{mpSoftRender();}catch(e){}}}
/* ---------- misafir: sunucunun dünyasını benimse (kendi kulübü/kariyeri kendisinde kalır) ---------- */
function v185WAl(g,b,h){const S=G.s,own=G.club,mgr=G.mode==='mgr'&&G.m;
  if(g==='gen'){const lm=Object.assign({},b.lgMove||{});if(own&&CLUBS[own]){const ben=(G.lgMove||{})[own];if(ben!==undefined)lm[own]=ben;else delete lm[own];}
    G.lgMove=lm;try{lgApply.k=null;lgApply();}catch(e){}
    G.lgHist=b.lgHist||[];G.qual=b.qual||G.qual;G.qualPrev=b.qualPrev||G.qualPrev;if(b.coef){G.coef=b.coef;try{coefApply();}catch(e){}}G.cupW=b.cupW||[];G.cupWin=b.cupWin||{};G.cpChamps=b.cpChamps||[];G.chm=b.chm||{};G.dh=b.dh||{};return true;}
  if(g==='co'){let n0=null;try{if(isPl()&&own)n0=coachRaw(own).n;}catch(e){}const keep=G.co&&own&&G.co[own];
    G.co=b.co||{};G.coFree=b.coFree||[];G.coT=b.coT||{};G.coY=b.coY;if(mgr&&own){if(keep)G.co[own]=keep;else delete G.co[own];}
    try{if(isPl()&&own&&n0&&V185.coIlk){const n1=coachRaw(own).n;if(n1!==n0){const c=CLUBS[own];msg('coach','Yeni teknik direktör',`${c.name} yönetimi ${n0} ile yollarını ayırdı. Yeni hocan ${n1}. Forma için kendini yeniden kanıtlaman gerekecek.`);if(G.p)G.p.trust=clamp((G.p.trust||50)-5,25,90);}}}catch(e){}
    V185.coIlk=1;return true;}
  if(g==='cs'){const mine=G.cs&&own?G.cs[own]:null;G.cs=b.cs||{};if(mine&&mgr)G.cs[own]=mine;return true;}
  if(g==='tx'){const J=v185J(),tx=b.tx||{},txh=b.txh||{};
    for(const k of Object.keys(J.tx)){const lv=G.tx?G.tx[k]:undefined,hv=tx[k];if((hv==null?null:hv)===(lv==null?null:lv)){delete J.tx[k];continue;}if(lv==null)delete tx[k];else tx[k]=lv;if(G.txh&&G.txh[k])txh[k]=G.txh[k];}
    if(mgr&&own){const N=v185SahipNg();for(const k in N)if(G.tx&&G.tx[k]===own)tx[k]=own;}
    G.tx=tx;G.txh=txh;return true;}
  if(g==='ng'){const mine=v185SahipNg();G.ng=Object.assign(b.ng||{},mine);G.ngY=b.ngY||{};return true;}
  if(g==='trl'){const T=trlInit();if(!T)return true;const me='@'+mpPid(),y=String(trlY()),J=v185J(),idf=r=>r[0]+'|'+r[1]+'|'+r[6];const old=new Set(((T.s&&T.s[y])||[]).map(idf));
    const s={};for(const [yy,R] of Object.entries(b.s||{}))s[yy]=R.map(r=>r[1]===me?Object.assign(r.slice(),{1:'ME'}):r);
    for(const [yy,R] of Object.entries(T.s||{})){const hs=new Set((s[yy]||[]).map(idf));for(const r of R)if((r[1]==='ME'||J.tx[r[1]])&&!hs.has(idf(r)))(s[yy]=s[yy]||[]).push(r);}
    for(const yy in s)s[yy].sort((a,c)=>a[0]-c[0]);
    const yeni=(s[y]||[]).filter(r=>!old.has(idf(r))&&r[1]!=='ME'&&!String(r[1]).startsWith('@')&&!J.tx[r[1]]);
    T.s=s;T.al=b.al||[];T.ly=b.ly;if(b.bf)T.bf=b.bf;
    if(yeni.length&&V185.trlIlk){try{trlNews(yeni);}catch(e){console.warn('v185 transfer haberi',e);}}V185.trlIlk=1;return true;}
  if(g==='wd'){const W=b.wd;if(W&&G.wd&&G.wd.y===W.y){if(own&&G.wd.cl&&G.wd.cl[own]){W.cl=W.cl||{};W.cl[own]=G.wd.cl[own];}if(G.wd.pw)W.pw=G.wd.pw;if(G.wd.tap)W.tap=G.wd.tap;}if(W)G.wd=W;return true;}
  if(g==='feed'){const F=(b.feed||[]).slice(),seen=new Set(F.map(x=>JSON.stringify(x)));for(const x of (G.mp.of||[]))if(!seen.has(JSON.stringify(x)))F.push(x);
    F.sort((a,c)=>(c.y-a.y)||(c.d-a.d));G.feed=F.slice(0,120);return true;}
  if(g==='leg'){G.leg=b.leg||{};G.legSeed=b.legSeed;G.legY=b.legY;return true;}
  if(g==='ph'){G.ph=b.ph||{};if(b.ph0Y!=null)G.ph0Y=b.ph0Y;return true;}
  if(g==='ovh'){G.ovh=b.ovh||{};return true;}
  if(g==='ps'){if(!S)return false;if(b.y!==S.year)return b.y<S.year;if(b.L!==S.league)return true;const ps=b.ps||{};for(const [k,x] of Object.entries(S.ps||{}))if(x&&x.c===own)ps[k]=x;S.ps=ps;return true;}
  if(g==='sz'){G.mp.str=b.str||{};v185StrUygula();return true;}
  if(g==='wn'){const L=b.wn||[],seen=G.mp.wnSeen||0;let mx=seen;
    for(const x of L){if(x.i<=seen)continue;mx=Math.max(mx,x.i);if(!V185.wnIlk&&!seen)continue;if(/^(Transfer|Kiralık): |^Haftanın transferleri/.test(x.ti||''))continue;
      if(S&&x.y===S.year&&S.day-x.d>12)continue;msg(x.t||'gundem',x.ti||'',x.b||'');}
    G.mp.wnSeen=mx;V185.wnIlk=1;return true;}
  return true;}
function v185StrUygula(){const M=G&&G.mp&&G.mp.str;if(!M||!v185Guest())return;for(const c of Object.values(CLUBS)){if(c.id===G.club)continue;const v=M[c.id];c.str=v!=null?v:c.str0;}
  const pc=v185PC(),O=v185O();if(pc&&O&&O.str)CLUBS[pc].str=O.str;}
/* ---------- karşı tarafın kendi verisi ---------- */
function v185OAl(O){if(!O||!O.p)return;const prev=G.mpO;G.mpO=O;const pc=O.club&&CLUBS[O.club]&&O.club!==G.club?O.club:null;
  if(pc&&O.str)CLUBS[pc].str=O.str;
  if(G.mp.role==='host'){const S=G.s,j=O.j||{};let ch=0;
    /* misafirin kendi kulübüne yaptığı transferler sunucunun dünyasına işlenir */
    for(const [k,to] of Object.entries(j.tx||{})){G.tx=G.tx||{};const cur=G.tx[k]==null?null:G.tx[k];if(cur===to)continue;const from=cur;if(to==null)delete G.tx[k];else G.tx[k]=to;
      if(j.txh&&j.txh[k]){G.txh=G.txh||{};G.txh[k]=j.txh[k];}try{if(from&&CLUBS[from])syncStr(from);if(to&&CLUBS[to])syncStr(to);}catch(e){}ch++;}
    for(const [k,p] of Object.entries(j.ng||{})){G.ng=G.ng||{};if(JSON.stringify(G.ng[k])!==JSON.stringify(p)){G.ng[k]=p;ch++;}}
    try{const T=trlInit(),idf=r=>r[0]+'|'+r[1]+'|'+r[6],y=String(O.y);if(T&&Array.isArray(j.trl)&&j.trl.length){const R=T.s[y]=T.s[y]||[],have=new Set(R.map(idf));for(const r of j.trl)if(!have.has(idf(r))){R.push(r);ch++;}R.sort((a,c)=>a[0]-c[0]);}}catch(e){}
    if(pc&&O.cs){G.cs=G.cs||{};G.cs[pc]=O.cs;}
    if(S&&O.y===S.year&&O.L===S.league&&O.ps&&pc){for(const [k,x] of Object.entries(O.ps)){S.ps=S.ps||{};S.ps[k]=x;}}
    if(Array.isArray(O.of)&&O.of.length){const F=G.feed=G.feed||[],seen=new Set(F.map(x=>JSON.stringify(x)));let n=0;for(const x of O.of)if(!seen.has(JSON.stringify(x))){F.push(x);n++;}if(n){F.sort((a,c)=>(c.y-a.y)||(c.d-a.d));if(F.length>120)F.length=120;}}
    if(pc&&O.str)CLUBS[pc].str=O.str;v185Planla(400);}
  try{if(prev&&prev.td&&O.td&&prev.club===O.club&&prev.td.co&&O.td.co&&prev.td.co.n!==O.td.co.n){}}catch(e){}}
/* ---------- misafirde dünya üreten rastgele işler durur; sunucuda kendi işlerinin gündem iletileri misafire iletilir ---------- */
function v185Durdur(name,keep){const f=window[name];if(typeof f!=='function')return;window[name]=(old=>function(){if(v185Guest()){try{if(keep)keep();}catch(e){}return;}
    if(v185Host()){const K=v185KoruBas();V185.cap++;let r;try{r=old.apply(this,arguments);}finally{V185.cap--;try{v185KoruSon(K);}catch(e){console.warn('v185 koru',e);}}return r;}
    return old.apply(this,arguments);})(f);}
/* sunucunun YZ işleri arkadaşın yönettiği kulübe dokunmaz: yapılan değişiklik geri alınır, haberi silinir */
function v185KoruBas(){const pc=v185PCM();if(!pc||!G)return null;return {pc,tx:Object.assign({},G.tx||{}),ng:new Set(Object.keys(G.ng||{})),co:G.co?v185Kopya(G.co[pc]):undefined,coH:!!(G.co&&Object.prototype.hasOwnProperty.call(G.co,pc)),ib:G.inbox.length?G.inbox[0].id:null};}
function v185KoruSon(K){if(!K||!G)return;const pc=K.pc,tx=G.tx||{},names=[];
  for(const k of new Set([...Object.keys(K.tx),...Object.keys(tx)])){const a=K.tx[k],b=tx[k];if(a===b)continue;let home=null;try{const p=pRaw(k);home=p&&p.home;}catch(e){}
    const from=a!==undefined?a:home;if(from!==pc&&b!==pc)continue;try{const p=pByKey(k);if(p&&p.name)names.push(p.name);}catch(e){}
    if(a===undefined)delete tx[k];else tx[k]=a;const L=G.txh&&G.txh[k];if(L&&L.length&&L[L.length-1].to===b)L.pop();if(L&&!L.length)delete G.txh[k];
    try{const T=G.trl,y=trlY();if(T&&T.s&&T.s[y])T.s[y]=T.s[y].filter(r=>!(r[1]===k&&r[6]===b));if(T&&T.al)T.al=T.al.filter(x=>!(x.k===k&&x.t===b));}catch(e){}
    if(G.ng&&G.ng[k]&&!K.ng.has(k))delete G.ng[k];try{if(b&&CLUBS[b])syncStr(b);if(from&&CLUBS[from])syncStr(from);}catch(e){}}
  if(G.co){if(K.coH)G.co[pc]=K.co;else delete G.co[pc];}
  if(names.length){const c=CLUBS[pc],bad=x=>names.some(n=>String(x||'').includes(n));const i0=G.inbox.findIndex(m=>m.id===K.ib),n=i0<0?G.inbox.length:i0;
    for(let i=n-1;i>=0;i--)if(bad(G.inbox[i].title)||bad(G.inbox[i].body))G.inbox.splice(i,1);
    if(G.mp.wn)G.mp.wn=G.mp.wn.filter(x=>!(bad(x.ti)||bad(x.b)));}
  const O=v185O();if(O&&O.str&&CLUBS[pc])CLUBS[pc].str=O.str;}
msg=(old=>function(t){const top=G&&G.inbox&&G.inbox[0];const r=old.apply(this,arguments);
  try{if(V185.cap>0&&t==='gundem'&&v185Host()&&G.inbox[0]&&G.inbox[0]!==top){const x=G.inbox[0],W=G.mp.wn=G.mp.wn||[];W.push({i:Date.now()*10+(V185.seq++%10),y:G.s?G.s.year:0,d:G.s?G.s.day:0,t,ti:String(x.title||''),b:String(x.body||'')});if(W.length>50)W.splice(0,W.length-50);}}catch(e){}return r;})(msg);
v185Durdur('aiTransfers');
v185Durdur('wdRound',()=>{if(G.mode==='mgr'&&G.m)wdTapUp();});
v185Durdur('coachSeasonEnd');
v185Durdur('legSeason');
v185Durdur('ngSeason');
v185Durdur('trlSeason');
v185Durdur('rumorWeek');
/* sunucuda arkadaşın yönettiği kulüp "kendi kulübü" gibi korunur */
wdOwnSkip=(old=>function(id){if(v185Host()&&id&&id===v185PCM())return true;return old.apply(this,arguments);})(wdOwnSkip);
bidsWeek=(old=>function(){const n0=G.m&&G.m.bids?G.m.bids.length:0,top=G.inbox[0];const r=old.apply(this,arguments);try{const pc=v185PCM();if(pc&&G.m&&G.m.bids&&G.m.bids.length>n0){const b=G.m.bids[G.m.bids.length-1];if(b&&b.club===pc){G.m.bids.pop();if(G.inbox[0]!==top)G.inbox.shift();}}}catch(e){}return r;})(bidsWeek);
const V185_BLK='Arkadaşının yönettiği kulüpten oyuncu alamazsın: o kulübün kararları onun.';
negStart=(old=>function(from){if(from&&from===v185PCM()){toast(V185_BLK);return;}return old.apply(this,arguments);})(negStart);
buyPlayer=(old=>function(id){if(id&&id===v185PCM()){toast(V185_BLK);return;}return old.apply(this,arguments);})(buyPlayer);
loanTargets=(old=>function(){const r=old.apply(this,arguments);try{const pc=v185PCM();if(pc)return r.filter(c=>c.id!==pc);}catch(e){}return r;})(loanTargets);
/* misafir: kendi kulübüne giren/çıkan oyuncular günlüğe (sunucu onaylayana kadar) */
txNote=(old=>function(k,to){let from=null;try{const L=G&&G.txh&&G.txh[k];const p=pRaw(k);from=L&&L.length?L[L.length-1].to:(p&&p.home);}catch(e){}const r=old.apply(this,arguments);
  try{if(v185Guest()&&V185.cap===0&&G.mode==='mgr'&&G.club&&(to===G.club||from===G.club))v185J().tx[k]=Date.now();}catch(e){}return r;})(txNote);
/* misafirin kendi haber akışı (taraftar paylaşımları vb.) sunucuya da gider */
feedAdd=(old=>function(){const r=old.apply(this,arguments);try{if(v185On()&&V185.cap===0&&G.feed&&G.feed[0]){const L=G.mp.of=G.mp.of||[];L.push(G.feed[0]);if(L.length>40)L.splice(0,L.length-40);}}catch(e){}return r;})(feedAdd);
/* misafirde güç değerleri sunucudan: sezon başı sıfırlamasından sonra yeniden uygula */
applyBoosts=(old=>function(){const r=old.apply(this,arguments);try{v185StrUygula();const pc=v185PC(),O=v185O();if(pc&&O&&O.str)CLUBS[pc].str=O.str;}catch(e){}return r;})(applyBoosts);
/* ---------- tetikleyiciler ---------- */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(v185On()){v185Planla(500);v185Isle();}}catch(e){}return r;})(nextDay);
save=(old=>function(){const r=old.apply(this,arguments);try{if(v185On()&&!V185.busy)v185Planla(1500);}catch(e){}return r;})(save);
mpPubRes=(old=>function(force){const r=old.apply(this,arguments);try{if(force){V185.sig={};}v185Planla(force?900:600);}catch(e){}return r;})(mpPubRes);

/* ================= arkadaşın kulübü ve kariyeri: karşı ekranda kaynağıyla aynı ================= */
function v185Sq(){const O=v185O();if(!O||!O.sq||!v185PCM())return null;if(O.__m&&O.__m.src===O.sq)return O.__m.by;const by={};for(const r of O.sq)by[r[0]]=r;Object.defineProperty(O,'__m',{value:{src:O.sq,by},enumerable:false,configurable:true,writable:true});return by;}
squadOf=(old=>function(id){const r=old.apply(this,arguments);try{const pc=v185PCM();if(!pc||id!==pc||!Array.isArray(r))return r;const by=v185Sq();if(!by)return r;
    const have=new Set(),out=[];for(const p of r){const x=by[p.k];if(!x)continue;have.add(p.k);out.push(Object.assign({},p,{ovr:x[1],age:x[2],num:x[9]!=null?x[9]:p.num}));}
    for(const k in by){if(have.has(k))continue;let p=null;try{p=pByKey(k);}catch(e){}if(!p)continue;const x=by[k];out.push(Object.assign({},p,{ovr:x[1],age:x[2],num:x[9]!=null?x[9]:p.num,club:id}));}
    return out;}catch(e){return r;}})(squadOf);
function v185SqR(p){try{if(!p||!p.k)return null;const by=v185Sq();return by&&by[p.k]||null;}catch(e){return null;}}
ctEnd=(old=>function(p){const x=v185SqR(p);if(x&&x[3])return x[3];return old.apply(this,arguments);})(ctEnd);
fatOf=(old=>function(k){const x=v185SqR({k});if(x)return 100-(x[4]==null?100:x[4]);return old.apply(this,arguments);})(fatOf);
pPot=(old=>function(p){const x=v185SqR(p);if(x&&Array.isArray(x[7]))return x[7].slice();return old.apply(this,arguments);})(pPot);
pValue=(old=>function(p){const x=v185SqR(p);if(x&&x[8]&&p&&p.ovr===x[1])return x[8];return old.apply(this,arguments);})(pValue);
sqStatus=(old=>function(p){const x=v185SqR(p);if(x){if(x[5])return ['inj',`Sakat · ${x[5]} hf`];if(x[6])return ['ban',`Cezalı · ${x[6]} maç`];}return old.apply(this,arguments);})(sqStatus);
function v185Iz(cid,k,est){const O=v185O();if(!O||!O.pst||!cid||cid!==v185PCM()||!O.pst[k]||!G.s)return null;const tr=O.pst[k];if(est&&tr.ap<(est.ap||0)*0.6)return null;
  const S=G.s,c=CLUBS[cid],ps=S.ps&&S.ps[k];return Object.assign({tracked:1},tr,c&&c.league===S.league&&ps?{g:Math.max(tr.g||0,ps.g||0),a:Math.max(tr.a||0,ps.a||0)}:{});}
seasonStats=(old=>function(p,cid){const r=old.apply(this,arguments);try{const t=p&&v185Iz(cid,p.k,r);if(t)return t;}catch(e){}return r;})(seasonStats);
clubSeasonEst=(old=>function(cid){const M=old.apply(this,arguments);try{if(cid&&cid===v185PCM()){for(const k in M){const x=M[k];if(!x||!x.p)continue;const t=v185Iz(cid,k,x);if(t)M[k]=Object.assign({p:x.p},t);}}}catch(e){}return M;})(clubSeasonEst);
coachOf=(old=>function(id){try{const O=v185O();if(O&&O.td&&O.td.co&&id&&id===v185PCM()){const b=v185Kopya(O.td.co);return Object.assign(b,{club:id,mp:1});}}catch(e){}return old.apply(this,arguments);})(coachOf);
/* kadro tablosu: arkadaşın oyuncularının sakatlık/ceza durumu */
sqTable=(old=>function(id){let h=old.apply(this,arguments);try{if(id&&id===v185PCM()){const by=v185Sq();if(by)h=h.replace(/(data-k="([^"]+)"><td class="num">[^<]*<\/td><td class="l"><b>[^<]*<\/b>)/g,(m,a,k)=>{const x=by[k];if(!x)return m;return a+(x[5]?` <i class="pi pi-inj" title="Sakat · ${x[5]} hafta">✚</i>`:'')+(x[6]?` <i class="pi pi-ban" title="Cezalı · ${x[6]} maç">■</i>`:'')+(x[4]<75?` <small class="v185-kn">%${x[4]}</small>`:'');});}}catch(e){}return h;})(sqTable);
/* kulüp sayfası: arkadaşın kulübünün kasası */
cpBody=(old=>function(id,tab){let h=old.apply(this,arguments);try{const O=v185O();if(tab==='eko'&&O&&O.td&&id&&id===v185PCM()){h=h.replace('<span>tahmini</span></p><div class="fin-kpi">',`<span>kulüp verisi · ${esc(O.n||'arkadaşın')}</span></p><div class="fin-kpi"><div class="v185-kasa"><span>Transfer bütçesi</span><b>${money(O.td.budget||0)}</b></div>`);}}catch(e){}return h;})(cpBody);
function v185Kasa(id){try{if(id===G.club&&G.m)return Math.round(G.m.budget||0);const O=v185O();if(O&&O.td&&id===O.club)return Math.round(O.td.budget||0);}catch(e){}return null;}
/* arkadaşın futbolcuysa: kulübünün kadrosunda satırı ve kendi ekranındaki kartının aynısı */
function v185Swap(O,fn){const keys=['p','club','contract','mvh','totals','cid','capt','loan'],bak={};for(const k of keys)bak[k]=G[k];const st0=G.s.stats,ph0=G.phase,md0=G.mode,pr0=G.prof;
  try{const M=O.me;G.p=M.p;G.club=O.club;G.contract=M.contract;G.mvh=M.mvh;G.totals=M.totals;G.cid=M.cid;G.capt=M.capt;G.loan=M.loan;G.s.stats=M.stats||st0;G.phase='season';G.mode='player';G.prof='oyuncu';return fn();}
  finally{for(const k of keys)G[k]=bak[k];G.s.stats=st0;G.phase=ph0;G.mode=md0;G.prof=pr0;}}
function v185KartHTML(){const O=v185O();if(!O||!O.me||!CLUBS[O.club])return '';return v185Swap(O,()=>playerCardHTML());}
function v185ArkSatir(){const O=v185O();if(!O||!O.me||!O.me.p)return '';const p=O.me.p;return `<button class="sqrow me v185-ark" data-act="v185Kart" title="Çevrimiçi odadaki arkadaşın"><i>${esc(String(p.num||''))}</i><b>${esc(p.name||O.n||'Arkadaşın')} <small>· arkadaşın</small></b><span>${flagImg(p.nat||'TUR','fl-row')} ${p.age}</span><em>${R200(O.me.ovr||0)}</em></button>`;}
squadHTML=(old=>function(id){let h=old.apply(this,arguments);try{const O=v185O();if(O&&O.me&&id&&id===v185PC()&&!h.includes('v185-ark')){const row=v185ArkSatir();const i=h.search(/<p class="sub-h"|<div class="sqt-wrap"|<div class="sqv-bar"/);h=i>0?h.slice(0,i)+row+h.slice(i):h+row;}}catch(e){}return h;})(squadHTML);
ACTX.v185Kart=()=>{const O=v185O();if(!O||!O.me)return toast('Arkadaşının bilgisi henüz gelmedi');let card='';try{card=v185KartHTML();}catch(e){console.warn('v185 kart',e);}
  const M=O.me,c=CLUBS[O.club],st=M.stats||{};
  openModal(`<h3>🌐 ${esc(M.p.name||O.n||'Arkadaşın')}</h3>${card}<dl class="offer-terms"><div><dt>Kulüp</dt><dd>${c?esc(c.name):''}</dd></div><div><dt>Sözleşme</dt><dd>${M.contract?M.contract.years+' yıl · '+money(M.contract.wage||0)+'/hf':'—'}</dd></div><div><dt>Bu sezon</dt><dd>${st.apps||0} maç · ${st.goals||0} gol · ${st.assists||0} asist</dd></div><div><dt>Kariyer</dt><dd>${M.totals?`${M.totals.apps} maç · ${M.totals.goals} gol`:'—'}</dd></div></dl><button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Kapat</button>`);};

/* ================= kupalar: iki cihazda aynı ağaç (aynı tohum, iki insanın gerçek sonuçları) ================= */
function v185Insan(type,key){const H=[];const add=(club,list,me)=>{if(!club||!Array.isArray(list))return;const k=list.find(x=>type==='dom'?(x.id==='dom'&&x.cc===key):(x.type==='eu'&&x.id===key));if(k)H.push({c:club,k,me});};
  try{const s=G.s;if(s&&s.cups&&s.cups.club===G.club)add(G.club,s.cups.list,1);}catch(e){}
  const O=v185O();if(O&&O.club&&O.club!==G.club&&O.y===G.s.year)add(O.club,O.cups,0);
  return H.sort((a,b)=>a.c<b.c?-1:a.c>b.c?1:0);}
function v185KupaAnahtar(H){return H.map(h=>h.c+':'+h.k.res.length+'/'+h.k.cur+'/'+(h.k.alive?1:0)+'/'+(h.k.won?1:0)+'/'+JSON.stringify(h.k.res.map(x=>[x.n,x.opp,x.us,x.them,x.leg||0,x.h?1:0]))).join(';');}
function v185RefCal(cc,Y){const ref=(typeof CC_TOP!=='undefined'&&CC_TOP[cc]&&LEAGUES[CC_TOP[cc]])?CC_TOP[cc]:G.s.league,key=ref+Y;if(!V185.cal[key]){try{V185.cal[key]=buildCal(ref,Y);}catch(e){V185.cal[key]=G.s.cal;}}return V185.cal[key];}
function v185NatDay(cc,nm){const D=DOMC[cc],Y=G.s.year,N=D.r.length,cal=v185RefCal(cc,Y),d0=cal[0],d1=cal[cal.length-1],i=D.r.indexOf(nm);return Math.round(d0+(d1-d0)*(0.07+0.88*i/(N-1)));}
function v185NatCup(cc){const D=DOMC[cc];if(!D||!G||!G.s)return null;const Y=G.s.year,H=v185Insan('dom',cc),ck=[cc,Y,G.s.day,G.phase,V185.ver,v185KupaAnahtar(H)].join('|');if(V185.nc[cc]&&V185.nc[cc].k===ck)return V185.nc[cc].B;
  const r=srnd(cc+'nc'+Y),N=D.r.length;
  const clubs=Object.values(CLUBS).filter(c=>ccOf(c)===cc&&D.lg[c.league]!=null&&!LEAGUES[c.league].youth).map(c=>({id:c.id,e:domEntry(c),s:c.str})).filter(x=>x.e!=null).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);if(clubs.length<2)return null;
  const NE=Math.min(N,Math.ceil(Math.log2(clubs.length))),off=N-NE,eOf={};clubs.forEach(x=>eOf[x.id]=x);
  const hOf={};H.forEach(h=>{if(eOf[h.c])hOf[h.c]=h;});const startOf=h=>Math.max(0,D.r.indexOf(h.k.rounds[0].n)-off);
  const recOf=(h,nm)=>{const L=h.k.res,j=L.findIndex(z=>z.n===nm);if(j<0)return null;const z=L[j];const won=z.us>z.them||(z.us===z.them&&(h.k.won||j<L.length-1||(h.k.alive&&h.k.cur>j)));
    return {home:z.h?h.c:z.opp,away:z.h?z.opp:h.c,hg:z.h?z.us:z.them,ag:z.h?z.them:z.us,w:won?h.c:z.opp,pen:z.us===z.them,opp:z.opp,h:!!z.h};};
  let alive=clubs.map(x=>x.id),rounds=[],win=null,run=null;
  for(let i=0;i<NE;i++){const nm=D.r[off+i],day=v185NatDay(cc,nm),played=G.phase==='off'||day<G.s.day;const T1=Math.pow(2,NE-1-i),m=Math.max(0,alive.length-T1);
    const isH=id=>{const h=hOf[id];return !!h&&(h.k.alive||h.k.won||h.k.res.some(z=>z.n===nm));};
    const act=alive.filter(id=>isH(id)&&i>=startOf(hOf[id])),late=alive.filter(id=>isH(id)&&i<startOf(hOf[id]));
    const pool=alive.filter(id=>!isH(id));const ord=pool.map(id=>[id,(eOf[id]?eOf[id].e:0)*10+(CLUBS[id]?CLUBS[id].str:60)/10+r()*2]).sort((a,b)=>a[1]-b[1]||(a[0]<b[0]?-1:1)).map(x=>x[0]);
    let need=Math.max(0,m*2-act.length);if((act.length+need)%2)need++;const players=act.concat(ord.slice(0,need)),byes=ord.slice(need).concat(late);
    const sh=players.slice();for(let j=sh.length-1;j>0;j--){const q=Math.floor(r()*(j+1));const t=sh[j];sh[j]=sh[q];sh[q]=t;}
    /* oynanmış insan maçlarının eşleşmesi korunur */
    for(const id of act){const z=recOf(hOf[id],nm);if(!z)continue;const ia=sh.indexOf(id),ib=sh.indexOf(z.opp);if(ia<0||ib<0)continue;const pa=ia^1;if(pa===ib)continue;const t=sh[pa];sh[pa]=sh[ib];sh[ib]=t;}
    const ties=[],nx=[];byes.forEach(x=>{ties.push({a:x,bye:1,w:x});nx.push(x);});let open=false;
    for(let j=0;j+1<sh.length;j+=2){const a=sh[j],b=sh[j+1],A=clubObj(a),B=clubObj(b),neutral=nm==='Final',[la,lb]=lambdas(A.str+(neutral?0:1.5),B.str);
      let x=sPois(la,r),y=sPois(lb,r),p=0,q=0;for(let t=0;t<5;t++){if(r()<0.76+(A.str-B.str)*0.003)p++;if(r()<0.76+(B.str-A.str)*0.003)q++;}const coin=r();
      const me=(a===G.club||b===G.club)?1:undefined,ha=isH(a)?hOf[a]:null,hb=isH(b)?hOf[b]:null;
      if(ha||hb){let z=null;const za=ha?recOf(ha,nm):null,zb=hb?recOf(hb,nm):null;if(za&&za.h&&za.opp===b)z=za;else if(zb&&zb.h&&zb.opp===a)z=zb;else if(za&&za.opp===b)z=za;else if(zb&&zb.opp===a)z=zb;
        if(z){ties.push({a:z.home,b:z.away,s:`${z.hg}-${z.ag}`+(z.pen?' (pen.)':''),w:z.w,me});nx.push(z.w);}else{ties.push({a,b,s:'',w:null,me});open=true;}continue;}
      if(!played){ties.push({a,b,s:'',w:null});open=true;continue;}
      let w=x>y?a:b,s2=`${x}-${y}`;if(x===y){if(p===q){if(coin<0.5)p++;else q++;}w=p>q?a:b;s2+=` (pen. ${p}-${q})`;}ties.push({a,b,s:s2,w});nx.push(w);}
    const done=!open&&(played||!sh.length||ties.every(t=>t.bye||t.w));rounds.push({n:nm,day,ties,played:done});if(!done)break;alive=nx;
    if(i===NE-1){const t=ties.find(x=>!x.bye);if(t&&t.w){win=t.w;run=t.a===t.w?t.b:t.a;}}}
  const B={cc,name:D.name,rounds,win,run,nRounds:NE,off,v185:1};V185.nc[cc]={k:ck,B};return B;}
function v185EuBoard(id,force){if(!G||!G.s||!G.s.cal||G.phase==='tryout')return null;const Y=G.s.year,H=v185Insan('eu',id);
  const q=G.qual&&G.qual.y===Y?G.qual:G.qualPrev&&G.qualPrev.y===Y?G.qualPrev:null;if(!q&&!H.length)return null;
  const ck=[id,Y,G.s.day,G.phase,force||0,V185.ver,v185KupaAnahtar(H)].join('|');if(V185.eub[id]&&V185.eub[id].k===ck)return V185.eub[id].B;
  const hOf={};H.forEach(h=>hOf[h.c]=h);const myK=hOf[G.club]?hOf[G.club].k:null;
  let parts=[...new Set((q?euParticipants(id,q):H[0].k.parts).filter(x=>clubObj(x)))];for(const h of H)if(!parts.includes(h.c)&&clubObj(h.c))parts.push(h.c);
  if(parts.length%2){const w=parts.filter(x=>!hOf[x]).sort((a,b)=>cupStr(a)-cupStr(b)||(a<b?-1:1))[0];parts=parts.filter(x=>x!==w);}
  const n=EUC[id].lp,D=EU_D[id],r=euSeed('eub'+id+Y),off=G.phase!=='season',dd=md=>dayOfDate(Y,md[0],md[1]);
  const lpDay=i=>dd(D.md[i]);const koDay=(nm,leg)=>{const kk=KRK[nm];return kk==='f'?dd(D.f):dd(D[kk][(leg||1)-1]);};
  const played=d=>force===true||off||d<G.s.day;const lpRes=h=>h.k.res.filter(x=>/Lig aşaması/.test(x.n));
  const met={},mk=(a,b)=>{(met[a]=met[a]||{})[b]=1;(met[b]=met[b]||{})[a]=1;},mds=[];
  for(let i=0;i<n;i++){let av=parts.slice();const M=[],day=lpDay(i);av=av.map(x=>[x,r()]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    while(av.length>1){const a=av.shift();let j=av.findIndex(b=>!(met[a]&&met[a][b])&&ccX(a)!==ccX(b));if(j<0)j=av.findIndex(b=>!(met[a]&&met[a][b]));if(j<0)j=0;const b=av.splice(j,1)[0];mk(a,b);M.push(r()<0.5?{h:a,a:b}:{h:b,a});}
    /* oynanmış insan maçlarının eşleşmesi korunur */
    for(const h of H){const z=lpRes(h)[i];if(!z)continue;const m1=M.find(m=>m.h===h.c||m.a===h.c),m2=M.find(m=>m.h===z.opp||m.a===z.opp);if(!m1||!m2||m1===m2)continue;
      const p1=m1.h===h.c?m1.a:m1.h,p2=m2.h===z.opp?m2.a:m2.h;if(z.h){m1.h=h.c;m1.a=z.opp;}else{m1.h=z.opp;m1.a=h.c;}m2.h=p1;m2.a=p2;}
    for(const m of M){const [lh,la]=lambdas(cupStr(m.h),cupStr(m.a));m.hg=sPois(lh,r);m.ag=sPois(la,r);m.pl=false;
      const hh=hOf[m.h],ha=hOf[m.a];const rec=h=>{const z=lpRes(h)[i];return z&&z.opp===(h.c===m.h?m.a:m.h)?z:null;};let z=null,zh=null;
      if(hh){z=rec(hh);if(z)zh=hh;}if(!z&&ha){z=rec(ha);if(z)zh=ha;}
      if(z){if(m.h===zh.c){m.hg=z.us;m.ag=z.them;}else{m.hg=z.them;m.ag=z.us;}m.pl=true;}else if(hh||ha)m.pl=force==='lp';else m.pl=played(day)||force==='lp';
      if(m.h===G.club||m.a===G.club)m.me=true;}
    mds.push({day,M});}
  const T={};parts.forEach(x=>T[x]={id:x,o:0,g:0,b:0,m:0,a:0,y:0,p:0,aw:0,tb:r()});
  for(const md of mds)for(const m of md.M){if(!m.pl)continue;const Hh=T[m.h],A=T[m.a];Hh.o++;A.o++;Hh.a+=m.hg;Hh.y+=m.ag;A.a+=m.ag;A.y+=m.hg;A.aw+=m.ag;
    if(m.hg>m.ag){Hh.g++;Hh.p+=3;A.m++;}else if(m.hg<m.ag){A.g++;A.p+=3;Hh.m++;}else{Hh.b++;A.b++;Hh.p++;A.p++;}}
  const tbl=Object.values(T).sort((a,b)=>b.p-a.p||(b.a-b.y)-(a.a-a.y)||b.a-a.a||b.aw-a.aw||b.g-a.g||a.tb-b.tb);const lpDone=mds.every(md=>md.M.every(m=>m.pl));
  const B={id,k:myK,parts,n,mds,tbl,lpDone,ko:{},champ:null,runner:null,Y,v185:1};
  if(lpDone){const R=tbl.map(x=>x.id),seedOf=x=>R.indexOf(x);
    const aggOf=t=>{let x=0,y=0;for(const L of [t.L1,t.L2]){if(!L)continue;if(L.h===t.a){x+=L.hg;y+=L.ag;}else{x+=L.ag;y+=L.hg;}}return [x,y];};B.aggOf=aggOf;
    const tie=(a,b,nm,j)=>{if(seedOf(b)<seedOf(a)&&nm!=='Final'){const t=a;a=b;b=t;}const rr=euSeed('eut'+id+Y+nm+j),fin=nm==='Final';
      const L1={h:fin?a:b,a:fin?b:a,day:koDay(nm,fin?0:1)},L2=fin?null:{h:a,a:b,day:koDay(nm,2)};
      const sim=L=>{const [lh,la]=lambdas(cupStr(L.h),cupStr(L.a));if(fin){const mm=(lh+la)/2,d=(lh-la)/2;L.hg=sPois(mm+d*0.8,rr);L.ag=sPois(mm-d*0.8,rr);}else{L.hg=sPois(lh,rr);L.ag=sPois(la,rr);}};
      sim(L1);if(L2)sim(L2);const pr=rr(),px=rr(),py=rr();const t={a,b,nm,j,L1,L2,me:a===G.club||b===G.club};const hs=[hOf[a],hOf[b]].filter(Boolean);
      if(hs.length){[L1,L2].forEach((L,li)=>{if(!L)return;L.pl=false;for(const h of [hOf[L.h],hOf[L.a]]){if(!h)continue;const rs=h.k.res.filter(x=>x.n===nm),x=rs.find(z=>(z.leg||0)===(fin?0:li+1))||(fin?rs[0]:null);
            if(!x||x.opp!==(h.c===L.h?L.a:L.h))continue;if(L.h===h.c){L.hg=x.us;L.ag=x.them;}else{L.hg=x.them;L.ag=x.us;}L.pl=true;break;}});
        const done=fin?L1.pl:!!(L1.pl&&L2&&L2.pl);if(done){const ag=aggOf(t);if(ag[0]!==ag[1])t.w=ag[0]>ag[1]?a:b;else{const hL=hOf[(L2||L1).h]||hs[0],won=fin?!!hL.k.won:hL.k.out!==nm;t.w=won?hL.c:(hL.c===a?b:a);t.pen=true;}}
        else{t.w=null;const ag=aggOf(t);t.pw=ag[0]>=ag[1]?a:b;}t.pl=done;}
      else{L1.pl=played(L1.day);if(L2)L2.pl=played(L2.day);const ag=aggOf(t);if(ag[0]===ag[1]){t.pen=true;const pa=pr<0.5+(cupStr(a)-cupStr(b))*0.012;t.w=pa?a:b;const x=4+Math.floor(px*2),y=x-1-Math.floor(py*2);t.ps=pa?[x,Math.max(1,y)]:[Math.max(1,y),x];}else t.w=ag[0]>ag[1]?a:b;t.pl=(L2||L1).pl;}
      return t;};
    const win=t=>t.w||t.pw||t.a;const drawn=nm=>myK&&myK.alive&&myK.rounds[myK.cur]&&myK.rounds[myK.cur].n===nm;
    const build=(nm,ps,fd)=>{for(const h of H){const x=h.k.res.find(z=>z.n===nm);if(!x)continue;const i1=ps.findIndex(p=>p[0]===h.c||p[1]===h.c),i2=ps.findIndex(p=>p[0]===x.opp||p[1]===x.opp);if(i1<0||i2<0||i1===i2)continue;
      const P1=ps[i1],P2=ps[i2],o1=P1[0]===h.c?1:0,o2=P2[0]===x.opp?1:0;const t=P1[o1];P1[o1]=P2[o2];P2[o2]=t;}
      return ps.map(([a,b],j)=>{const t=tie(a,b,nm,j),F=fd?fd(j):[];t.known=F.every(f=>!f||f.pl)||(t.me&&drawn(nm))||t.L1.pl;return t;});};
    let pairs=[];for(let j=0;j<8;j++)if(R[8+j]&&R[23-j])pairs.push([R[8+j],R[23-j]]);B.ko.po=build('Play-off',pairs);
    const poW=B.ko.po.map(win);pairs=[];const r16F=[];for(let j=0;j<8;j++)if(R[j]){pairs.push([R[j],poW[7-j]||R[24+j]]);r16F.push([B.ko.po[7-j]]);}B.ko.r16=build('Son 16',pairs,j=>r16F[j]);
    const ORD=[0,7,3,4,1,6,2,5],r16W=B.ko.r16.map(win);pairs=[];const qfF=[];for(let t=0;t<4;t++){if(!(r16W[ORD[2*t]]&&r16W[ORD[2*t+1]]))continue;pairs.push([r16W[ORD[2*t]],r16W[ORD[2*t+1]]]);qfF.push([B.ko.r16[ORD[2*t]],B.ko.r16[ORD[2*t+1]]]);}B.ko.qf=build('Çeyrek Final',pairs,j=>qfF[j]);
    const qfW=B.ko.qf.map(win);B.ko.sf=build('Yarı Final',[[qfW[0],qfW[1]],[qfW[2],qfW[3]]].filter(p=>p[0]&&p[1]),j=>[B.ko.qf[2*j],B.ko.qf[2*j+1]]);
    const sfW=B.ko.sf.map(win);B.ko.f=build('Final',[[sfW[0],sfW[1]]].filter(p=>p[0]&&p[1]),()=>[B.ko.sf[0],B.ko.sf[1]]);
    const F=B.ko.f[0];if(F&&F.pl&&F.w){B.champ=F.w;B.runner=F.w===F.a?F.b:F.a;}}
  V185.eub[id]={k:ck,B};return B;}
natCup=(old=>function(cc){if(v185On()){try{return v185NatCup(cc);}catch(e){console.warn('v185 ulusal kupa',e);}}return old.apply(this,arguments);})(natCup);
euBoard=(old=>function(id,force){if(v185On()&&EU_D[id]){try{return v185EuBoard(id,force);}catch(e){console.warn('v185 Avrupa',e);}}return old.apply(this,arguments);})(euBoard);
/* odada kupa günleri ortak takvimden (iki insanın aynı tur aynı günde) */
function v185GunUygun(d,cal,used){if(d==null)return false;if(cal.some(x=>Math.abs(x-d)<=1))return false;if([...used].some(u=>Math.abs(u-d)<=1))return false;return true;}
function v185GunAyarla(k,used){const cal=G.s.cal||[],Y=G.s.year;
  for(let i=0;i<k.rounds.length;i++){const R=k.rounds[i];let t=null;
    if(k.type==='dom'){if(!DOMC[k.cc])continue;t=v185NatDay(k.cc,R.n);}
    else{const D=EU_D[k.id];if(!D)continue;const dd=md=>dayOfDate(Y,md[0],md[1]);if(R.lp){const j=k.rounds.slice(0,i).filter(x=>x.lp).length;if(D.md[j])t=dd(D.md[j]);}else{const kk=KRK[R.n];if(kk==='f')t=dd(D.f);else if(D[kk])t=dd(D[kk][(R.leg||1)-1]);}}
    if(t==null||t<=G.s.day)continue;let best=null;for(const dl of [0,1,-1,2,-2,3,-3]){const d=t+dl;if(d>G.s.day&&v185GunUygun(d,cal,used)){best=d;break;}}if(best==null)continue;
    if(R.day!=null)used.delete(R.day);R.day=best;used.add(best);}}
buildComps=(old=>function(){const R=old.apply(this,arguments);try{if(v185On()&&R&&R.list){const used=new Set();R.list.forEach(k=>k.rounds.forEach(x=>{if(x.day!=null)used.add(x.day);}));for(const k of R.list)v185GunAyarla(k,used);R.v185=1;setTimeout(()=>{try{v185CupFix();save();}catch(e){}},0);}}catch(e){console.warn('v185 kupa günleri',e);}return R;})(buildComps);
/* rakip: ağaçtaki eşleşme (arkadaşın sonucu gelince kesinleşir) */
function v185CupFix(){if(!v185On()||!G||!G.s||G.phase!=='season'||!G.s.cups||G.s.cups.club!==G.club)return false;let ch=false;
  for(const k of G.s.cups.list||[]){if(!k.alive)continue;const r=k.rounds[k.cur];if(!r)continue;if(r.day!=null&&r.day<G.s.day)continue;if(r.day===G.s.day&&v185Mesgul())continue;
    let opp=null,home=null;
    if(k.type==='dom'){const B=natCup(k.cc),R=B&&B.rounds.find(x=>x.n===r.n),t=R&&R.ties.find(x=>!x.bye&&(x.a===G.club||x.b===G.club));if(t&&t.a&&t.b){opp=t.a===G.club?t.b:t.a;home=t.a===G.club;}}
    else if(k.type==='eu'&&EU_D[k.id]){if(r.lp){const B=euBoard(k.id,false);if(B&&B.mds){for(let i=k.cur;i<B.mds.length&&i<k.rounds.length;i++){if(!k.rounds[i].lp)break;const m=B.mds[i].M.find(x=>x.h===G.club||x.a===G.club);if(!m)continue;const o=m.h===G.club?m.a:m.h;
            k.lpOpps=k.lpOpps||[];if(k.lpOpps[i]!==o){k.lpOpps[i]=o;ch=true;}if(i>k.cur&&k.rounds[i].home!==(m.h===G.club)){k.rounds[i].home=m.h===G.club;ch=true;}if(i===k.cur){opp=o;home=m.h===G.club;}}}}
      else{const kk=KRK[r.n],B=euBoard(k.id,false),T=B&&B.ko&&B.ko[kk],t=T&&T.find(x=>x.a===G.club||x.b===G.club);if(t&&t.known!==false){opp=t.a===G.club?t.b:t.a;const L=r.n==='Final'||!r.leg||r.leg===1?t.L1:t.L2;if(L&&r.n!=='Final')home=L.h===G.club;}}}
    if(opp&&opp!==k.opp){k.opp=opp;ch=true;}if(home!=null&&!r.neutral&&r.home!==home){r.home=home;ch=true;}}
  if(ch){try{EUB_C={};}catch(e){}}return ch;}
nextDay=(old=>function(){try{if(v185On()&&v185CupFix())save();}catch(e){}return old.apply(this,arguments);})(nextDay);
domDraw=(old=>function(k){const r=old.apply(this,arguments);try{if(v185On()&&k&&k.rounds[k.cur]){const nm=k.rounds[k.cur].n;delete V185.nc[k.cc];const B=v185NatCup(k.cc),R=B&&B.rounds.find(x=>x.n===nm),t=R&&R.ties.find(x=>!x.bye&&(x.a===G.club||x.b===G.club));if(t&&t.a&&t.b)return t.a===G.club?t.b:t.a;}}catch(e){}return r;})(domDraw);

/* ---------- test kancası ---------- */
window.__v185={V185,on:v185On,build:()=>v185OYap(),gr:V185_GR,boy:()=>V185.boy,cupFix:()=>v185CupFix(),kasa:v185Kasa,kart:()=>v185KartHTML()};
