/* ================= v169: çevrimiçi oda — arkadaşınla aynı dünyada kariyer (oda kodu/bağlantı, ortak "Hazırım" onayı, ortak lig sonuçları) ================= */
/* Taşıma: ücretsiz, herkese açık MQTT sunucuları (WebSocket, 443 ve standart wss portları). Aynı anda birkaç sunucuya bağlanılır,
   ileti hepsine gönderilir, gelenler kimlikten ayıklanır: biri düşerse diğerleri sürer. İçerik oda kodundan türetilen anahtarla
   AES-GCM ile şifrelenir; sunucular yalnız anlamsız bayt görür. Her oyuncunun kariyeri kendi cihazında kayıtlıdır. */
const MQB=[
  {n:'shiftr.io',u:'wss://public.cloud.shiftr.io',us:'public',pw:'public'},
  {n:'HiveMQ',u:'wss://broker.hivemq.com:8884/mqtt'},
  {n:'EMQX',u:'wss://broker.emqx.io:8084/mqtt'},
  {n:'Eclipse',u:'wss://mqtt.eclipseprojects.io/mqtt'},
  {n:'Mosquitto',u:'wss://test.mosquitto.org:8081/mqtt'}];
const MP_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',MP_VER=169,MP_PAGE='https://adnanerdem2000-sudo.github.io/ado/';
const MP={code:null,base:'',key:null,cons:[],seen:new Set(),seenQ:[],seq:0,peer:null,peerAt:0,peerTs:0,resTs:0,ready:null,want:null,lim:0,going:false,
  join:null,tmpPid:null,gone:null,holOn:false,hb:0,chk:0,lastPub:'',lastRes:'',up:false,unread:0,offAsk:0};
/* ---------- yardımcılar ---------- */
function mpRnd(n){const a=new Uint8Array(n);try{crypto.getRandomValues(a);}catch(e){for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);}return a;}
function mpNewCode(){const a=mpRnd(6);let s='';for(let i=0;i<6;i++)s+=MP_ABC[a[i]%MP_ABC.length];return s;}
function mpNewPid(){return 'p'+[...mpRnd(6)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function mpNorm(c){return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/O/g,'0').replace(/I/g,'1').slice(0,6);}
function mpCodeOk(c){return /^[A-Z0-9]{6}$/.test(c);}
function mpH53(s,seed){let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0');}
function mpLink(code){let b=MP_PAGE;try{if(/^https?:$/.test(location.protocol)&&!/claude\.ai|claudeusercontent/.test(location.host))b=location.origin+location.pathname;}catch(e){}return b+'#oda='+code;}
const mpOn=()=>!!(G&&G.mp&&G.mp.on&&G.mp.code);
const mpPid=()=>G&&G.mp?G.mp.pid:MP.tmpPid;
function mpEpoch(){try{return Math.floor(today().getTime()/864e5);}catch(e){return 0;}}
function mpDateTxt(e){try{return fmtDate(new Date(e*864e5),true);}catch(x){return '';}}
function mpPartnerExists(){return mpOn()&&Array.isArray(G.mp.mem)&&G.mp.mem.length>=2;}
function mpPeerLive(){return !!(MP.peer&&Date.now()-MP.peerAt<35000);}
function mpProfN(k){try{return (PROF[k]&&PROF[k].n)||k;}catch(e){return k;}}
function mpClubN(id){try{return CLUBS[id]?CLUBS[id].name:'';}catch(e){return '';}}
/* ---------- şifreleme ---------- */
const mpTE=new TextEncoder(),mpTD=new TextDecoder();
async function mpKeyOf(code){if(!(window.crypto&&crypto.subtle))return null;
  const b=await crypto.subtle.importKey('raw',mpTE.encode('adofk:'+code),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:mpTE.encode('adofk-oda-v1'),iterations:40000,hash:'SHA-256'},b,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function mpEnc(obj){const pt=mpTE.encode(JSON.stringify(obj));if(!MP.key){const o=new Uint8Array(pt.length+1);o[0]=0;o.set(pt,1);return o;}
  const iv=mpRnd(12),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},MP.key,pt));const o=new Uint8Array(13+ct.length);o[0]=1;o.set(iv,1);o.set(ct,13);return o;}
async function mpDec(u8){if(!u8||!u8.length)return null;try{if(u8[0]===0)return JSON.parse(mpTD.decode(u8.subarray(1)));
  if(u8[0]===1&&MP.key){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u8.subarray(1,13)},MP.key,u8.subarray(13));return JSON.parse(mpTD.decode(pt));}}catch(e){}return null;}
/* ---------- en küçük MQTT 3.1.1 istemcisi (WebSocket, QoS 0) ---------- */
function mqLen(n){const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d);}while(n>0);return o;}
function mqStr(s){const b=mpTE.encode(s);return [b.length>>8,b.length&255,...b];}
function mqPkt(h,body){const L=mqLen(body.length),o=new Uint8Array(1+L.length+body.length);o[0]=h;o.set(L,1);o.set(body,1+L.length);return o;}
function mqConnect(c){const fl=0x02|(c.b.us?0xC0:0),pl=[...mqStr('MQTT'),4,fl,0,40,...mqStr('ado'+mpH53(String(Math.random()),7).slice(0,14))];
  if(c.b.us)pl.push(...mqStr(c.b.us),...mqStr(c.b.pw||''));return mqPkt(0x10,new Uint8Array(pl));}
function mqOpen(c){if(!MP.code||c.dead)return;c.st='bağlanıyor';let ws;try{ws=new WebSocket(c.b.u,['mqtt']);}catch(e){c.st='hata';return mqRetry(c);}
  c.ws=ws;ws.binaryType='arraybuffer';c.buf=new Uint8Array(0);
  const to=setTimeout(()=>{if(c.st!=='bağlı'){try{ws.close();}catch(e){}}},12000);
  ws.onopen=()=>{try{ws.send(mqConnect(c));}catch(e){}};
  ws.onmessage=ev=>{const d=new Uint8Array(ev.data);const nb=new Uint8Array(c.buf.length+d.length);nb.set(c.buf);nb.set(d,c.buf.length);c.buf=nb;mqParse(c);};
  ws.onclose=()=>{clearTimeout(to);clearInterval(c.ping);const was=c.st==='bağlı';c.st='kapalı';c.ws=null;if(was)mpUI();mqRetry(c);};
  ws.onerror=()=>{};}
function mqRetry(c){if(c.dead||!MP.code)return;clearTimeout(c.rt);c.n=(c.n||0)+1;const w=Math.min(30000,1500*Math.pow(1.7,Math.min(c.n,8)))*(0.8+Math.random()*0.4);c.rt=setTimeout(()=>mqOpen(c),w);}
function mqParse(c){let b=c.buf;for(;;){if(b.length<2)break;let m=1,v=0,i=1,k;do{if(i>=b.length)return void(c.buf=b);k=b[i++];v+=(k&127)*m;m*=128;}while(k&128&&i<5);
    if(b.length<i+v)break;const h=b[0],body=b.subarray(i,i+v);b=b.subarray(i+v);mqPacket(c,h,body);}c.buf=b.slice();}
function mqPacket(c,h,body){const t=h>>4;
  if(t===2){if(body[1]!==0){c.st='reddetti';try{c.ws.close();}catch(e){}return;}c.st='bağlı';c.n=0;
    const tp=mqStr(MP.base+'/#');try{c.ws.send(mqPkt(0x82,new Uint8Array([0,1,...tp,0])));}catch(e){}
    clearInterval(c.ping);c.ping=setInterval(()=>{try{c.ws&&c.ws.readyState===1&&c.ws.send(new Uint8Array([0xC0,0]));}catch(e){}},20000);
    setTimeout(()=>{mpPubState(true);mpPubRes(true);},300);mpUI();}
  else if(t===3){const q=(h>>1)&3,tl=(body[0]<<8)|body[1];const topic=mpTD.decode(body.subarray(2,2+tl));let o=2+tl;if(q>0)o+=2;
    const pay=body.slice(o);mpRecv(topic,pay,!!(h&1)).catch(e=>console.warn('oda',e));}}
function mqPub(topic,u8,retain){const tb=mqStr(topic),body=new Uint8Array(tb.length+u8.length);body.set(tb);body.set(u8,tb.length);
  const p=mqPkt(0x30|(retain?1:0),body);let n=0;for(const c of MP.cons)if(c.st==='bağlı'&&c.ws&&c.ws.readyState===1){try{c.ws.send(p);n++;}catch(e){}}return n;}
function mpConnected(){return MP.cons.filter(c=>c.st==='bağlı').length;}
/* ---------- oda başlat / durdur ---------- */
async function mpStart(code){code=mpNorm(code);if(!mpCodeOk(code))return false;if(MP.code===code&&MP.cons.length)return true;mpStop();
  MP.code=code;MP.base='adofk1/'+mpH53('konu:'+code,11);MP.peer=null;MP.peerAt=0;MP.peerTs=0;MP.resTs=0;MP.ready=null;MP.want=null;MP.lastPub='';MP.lastRes='';
  try{MP.key=await mpKeyOf(code);}catch(e){MP.key=null;}if(MP.code!==code)return false;
  MP.cons=MQB.map(b=>({b,st:'kapalı',n:0}));MP.cons.forEach(mqOpen);
  clearInterval(MP.hb);MP.hb=setInterval(()=>{mpPubState(true);},15000);
  clearInterval(MP.chk);MP.chk=setInterval(()=>{try{mpCheck();mpUI();}catch(e){}},2000);return true;}
function mpStop(){for(const c of MP.cons){c.dead=true;clearTimeout(c.rt);clearInterval(c.ping);try{if(c.ws){if(c.ws.readyState===1)c.ws.send(new Uint8Array([0xE0,0]));c.ws.close();}}catch(e){}}
  MP.cons=[];MP.code=null;MP.key=null;MP.peer=null;MP.ready=null;MP.want=null;clearInterval(MP.hb);clearInterval(MP.chk);mpUI();}
/* kayıt yüklenince / sekme değişince: oda açıksa bağlan, kapalıysa kes */
function mpEnsure(){try{if(mpOn()){if(MP.code!==G.mp.code)mpStart(G.mp.code);}else if(MP.code&&!MP.join)mpStop();}catch(e){}}
/* ---------- gönder ---------- */
function mpSt(){const g=G,S=g&&g.s;let pos=0;try{pos=g.club&&S?tablePos():0;}catch(e){}
  return {k:'st',v:MP_VER,p:mpPid(),r:g.mp.role,mem:g.mp.mem||[],n:(g.p&&g.p.name)||'',prof:g.prof||'',club:g.phase==='tryout'?'':(g.club||''),cn:mpClubN(g.club),L:S?S.league:'',Ln:S&&LEAGUES[S.league]?LEAGUES[S.league].name:'',
    y:S?S.year:0,e:mpEpoch(),ph:g.phase,pos,rd:MP.ready,go:MP.gone,ts:Date.now(),lr:mpLastRes()};}
function mpLastRes(){try{const S=G.s,R=S.results;for(let w=R.length-1;w>=0;w--){const m=R[w].find(x=>x[0]===G.club||x[1]===G.club);if(m)return [mpClubN(m[0]),m[2],m[3],mpClubN(m[1])];}}catch(e){}return null;}
async function mpPubState(force){if(!mpOn()||!MP.code||!mpConnected())return;const s=mpSt(),sig=JSON.stringify(Object.assign({},s,{ts:0}));if(!force&&sig===MP.lastPub)return;MP.lastPub=sig;
  mqPub(MP.base+'/s/'+s.p,await mpEnc(s),true);}
async function mpPubRes(force){if(!mpOn()||!MP.code||!mpConnected()||!G.s)return;const S=G.s;
  const o={k:'res',p:mpPid(),r:G.mp.role,y:S.year,L:S.league,club:G.club||'',fh:mpH53(JSON.stringify(S.fixtures||[]),3),rs:(S.results||[]).map(rd=>rd.map(m=>[m[0],m[1],m[2],m[3]])),ts:Date.now()};
  if(G.mp.role==='host')o.fx=S.fixtures;const sig=JSON.stringify([o.y,o.L,o.fh,o.rs,o.club]);if(!force&&sig===MP.lastRes)return;MP.lastRes=sig;
  mqPub(MP.base+'/r/'+o.p,await mpEnc(o),true);}
async function mpPubMsg(o){if(!MP.code)return 0;o.p=mpPid();o.i=o.p+'-'+Date.now().toString(36)+'-'+(++MP.seq);o.ts=Date.now();MP.seen.add(o.i);return mqPub(MP.base+'/m',await mpEnc(o),false);}
/* ---------- al ---------- */
async function mpRecv(topic,pay,retained){if(!topic.startsWith(MP.base+'/'))return;if(!pay.length)return;const o=await mpDec(pay);if(!o||!o.p||o.p===mpPid())return;
  if(o.i){if(MP.seen.has(o.i))return;MP.seen.add(o.i);MP.seenQ.push(o.i);if(MP.seenQ.length>600)MP.seen.delete(MP.seenQ.shift());}
  if(MP.join&&!G){if(o.k==='st')mpJoinSeen(o);return;}
  if(!mpOn())return;const mem=G.mp.mem||[];
  if(o.k==='st'){
    if(!mem.includes(o.p)){/* yeni gelen: ev sahibi ilk misafiri odaya alır */
      if(G.mp.role==='host'&&mem.length<2&&o.r==='guest'&&Array.isArray(o.mem)&&o.mem.includes(mpPid())){G.mp.mem=[mpPid(),o.p];save();
        msg('news','🌐 Arkadaşın odaya katıldı',`${esc(o.n||'Arkadaşın')} (${esc(mpProfN(o.prof))}${o.cn?' · '+esc(o.cn):''}) odana katıldı. Artık günler ikiniz de “Hazırım” deyince ilerliyor.`);
        toast('🌐 '+(o.n||'Arkadaşın')+' odaya katıldı');MP.lastPub='';mpPubState(true);mpPubRes(true);try{render();}catch(e){}}
      return;}
    if(o.ts<MP.peerTs)return;const prev=MP.peer;MP.peer=o;MP.peerTs=o.ts;if(!retained)MP.peerAt=Date.now();
    G.mp.peer={n:o.n,prof:o.prof,club:o.club,cn:o.cn,L:o.L,y:o.y,e:o.e};
    if(G.mp.role==='guest'&&Array.isArray(o.mem)&&o.mem.length>=2&&!o.mem.includes(mpPid())){mpFull();return;}
    mpPeerNews(prev,o);mpCheck();mpUI();}
  else if(o.k==='res'){if(!mem.includes(o.p)||o.ts<MP.resTs)return;MP.resTs=o.ts;mpMerge(o);}
  else if(o.k==='ch'){if(!mem.includes(o.p))return;const C=G.mp.chat=G.mp.chat||[];C.push({n:o.n,t:String(o.t||'').slice(0,240),ts:o.ts,me:0});if(C.length>60)C.splice(0,C.length-60);
    MP.unread++;save();toast('💬 '+(o.n||'Arkadaşın')+': '+String(o.t||'').slice(0,60));mpUI();const box=$('#mpChat');if(box)mpChatDraw();}
  else if(o.k==='nudge'){if(!mem.includes(o.p))return;toast('🔔 '+(o.n||'Arkadaşın')+' Devam’a basmanı bekliyor');}}
function mpFull(){toast('Bu oda dolu: iki oyuncu zaten içeride');G.mp.on=false;G.mp.full=1;save();mpStop();try{render();}catch(e){}}
/* arkadaşın önemli değişiklikleri gelen kutuna */
function mpPeerNews(a,b){if(!a||!b)return;const nm=esc(b.n||'Arkadaşın');
  if(a.club&&b.club&&a.club!==b.club)msg('news',`🌐 ${nm} kulüp değiştirdi`,`${nm} artık ${esc(b.cn||b.club)} formasını giyiyor${a.cn?' (eski kulübü: '+esc(a.cn)+')':''}.`);
  if(a.y&&b.y&&b.y>a.y)msg('news',`🌐 ${nm} yeni sezona geçti`,`${nm}, ${esc(b.Ln||'')} ${seasonLabel(b.y)} sezonuna başladı.`);}
/* ---------- ortak lig sonuçları ---------- */
/* Kural: kendi kulübünün maçı senin; arkadaşının kulübünün maçı onun; ikiniz karşılaştıysanız ev sahibinin; geri kalanı oda kurucusunun. */
function mpMerge(o){try{const S=G.s;if(!S||o.y!==S.year||o.L!==S.league)return;
    const myH=mpH53(JSON.stringify(S.fixtures||[]),3);
    if(o.fh!==myH){/* yeni sezonda kurucunun fikstürünü benimse (henüz maç oynanmadıysa) */
      if(G.mp.role==='guest'&&o.fx&&Array.isArray(o.fx)&&(S.results||[]).length===0&&mpFixOk(o.fx)){S.fixtures=JSON.parse(JSON.stringify(o.fx));save();toast('🌐 Fikstür oda kurucusuyla eşitlendi');MP.lastRes='';mpPubRes(true);}
      return;}
    const me=G.club,pc=o.club,host=G.mp.role==='host';let ch=0;const notes=[];
    const R=S.results||[],n=Math.min(R.length,(o.rs||[]).length);
    for(let w=0;w<n;w++){const A=R[w],B=o.rs[w];if(!A||!B)continue;
      for(let i=0;i<A.length;i++){const a=A[i],b=B.find(x=>x[0]===a[0]&&x[1]===a[1]);if(!b)continue;if(a[2]===b[2]&&a[3]===b[3])continue;
        const hasMe=me&&(a[0]===me||a[1]===me),hasP=pc&&(a[0]===pc||a[1]===pc);let take;
        if(hasMe&&hasP)take=a[0]===pc;else if(hasMe)take=false;else if(hasP)take=true;else take=!host;
        if(take){if(hasMe)notes.push(`${mpClubN(a[0])} ${b[2]}-${b[3]} ${mpClubN(a[1])}`);a[2]=b[2];a[3]=b[3];ch++;}}}
    if(ch){save();if(notes.length)msg('report','🌐 Resmi sonuç arkadaşınla eşitlendi',`İkinizin karşılaşmasında ev sahibinin sonucu geçerli: ${esc(notes.join(' · '))}.`);
      MP.lastRes='';if(host)mpPubRes(true);mpSoftRender();}}
  catch(e){console.warn('oda birleştirme',e);}}
function mpFixOk(fx){try{const ids=new Set(leagueClubs(G.s.league).map(c=>c.id));return fx.every(rd=>Array.isArray(rd)&&rd.every(m=>ids.has(m[0])&&ids.has(m[1])));}catch(e){return false;}}
function mpSoftRender(){try{if(!$('#modal').hidden)return;const m=$('#match');if(m&&!m.hidden)return;if(typeof HOL5!=='undefined'&&HOL5.on)return;if(['hub','lig','league','fikstur','table'].includes(TAB))render();}catch(e){}}
/* ---------- ortak onay: "Hazırım" ---------- */
function mpStop1(){/* bu oyuncunun doğal durağı: sıradaki maç/milli/kupa günü */let k=1;try{for(;k<=120;k++){const t=dayType(G.s.day+k);if(t==='mac'||t==='kupa'||t==='milli')break;}}catch(e){k=1;}return mpEpoch()+Math.max(1,Math.min(k,120));}
function mpGate(){return mpPartnerExists()&&!MP.going;}
/* çok günlük döngüler bu sınırı aşmaz */
function mpStep(){if(!mpPartnerExists())return true;return mpEpoch()<MP.lim;}
function mpWant(kind,fn,stop){if(!mpGate()){fn&&fn();return;}
  const e=mpEpoch();MP.ready={e,stop:stop||mpStop1(),k:kind};MP.want=fn||null;MP.lastPub='';mpPubState(true);mpCheck();mpUI();}
function mpCancel(){MP.ready=null;MP.want=null;MP.lastPub='';mpPubState(true);mpUI();}
function mpCheck(){if(!MP.ready||!mpOn())return;if(MP.ready.k==='tatil'&&!(typeof HOL5!=='undefined'&&HOL5.on)){mpCancel();return;}const me=mpEpoch();if(MP.ready.e!==me){MP.ready.e=me;}
  const P=MP.peer;if(!P||!mpPeerLive())return;let T=0;
  if(P.e>me)T=Math.min(MP.ready.stop,P.e);/* arkadaşın ileride bekliyor: ona yetiş */
  else if(P.e===me&&P.rd&&P.rd.e===me)T=Math.min(MP.ready.stop,P.rd.stop);
  else if(P.e===me&&P.go&&P.go.e===me&&P.go.T>me)T=Math.min(MP.ready.stop,P.go.T);/* arkadaşın bizim onayımızla çoktan ilerledi */
  if(T>me)mpGo(T);}
function mpGo(T){const fn=MP.want,k=MP.ready&&MP.ready.k;MP.lim=T;MP.gone={e:mpEpoch(),T};MP.ready=null;MP.want=null;MP.lastPub='';
  /* aynı tıklamanın içinden yeniden click() tarayıcıca yok sayılır: bir sonraki turda çalıştır */
  setTimeout(()=>{MP.going=true;try{if(fn)fn();}catch(e){console.warn('oda devam',e);}finally{MP.going=false;}
    if(k!=='tatil')setTimeout(()=>{mpPubState(true);mpPubRes();},50);mpUI();},0);mpPubState(true);mpUI();}
/* ana sayfadaki günü ilerleten düğmeler ve Devam */
const MP_NOADV=new Set(['closeModal','accept','nego','mgrSign','trySign','intAcc','ntAcc','agSign','loanGo','stSign','trcOffer','plFind','retire','mgrRetire','resign','slotDel','toMenu','fmCont','newSeason','mgrNew','stNew','tryStart','trySkip']);
const MP_ADV=new Set(['stDay','mgrAdv','stAdv','finish','skip','autoAdv','simPlay','mgrSim','mgrCup','stMatch','refGo','play','mgrPlay','mgrCupW','yrWatch','stWatch','ref3','v155Watch']);
fmCont=(old=>function(){if(mpGate()&&!(typeof HOL5!=='undefined'&&HOL5.on)){const self=this,args=arguments;const b=(()=>{try{return fmContTarget();}catch(e){return null;}})();
    const a=b&&b.dataset?b.dataset.act:'';if(b&&MP_NOADV.has(a)&&a!=='fmCont')return old.apply(self,args);
    if(MP.ready){mpUI(true);return;}return mpWant('devam',()=>old.apply(self,args));}
  return old.apply(this,arguments);})(fmCont);
ACTX.fmCont=()=>fmCont();
document.addEventListener('click',e=>{if(!mpGate())return;if(typeof HOL5!=='undefined'&&HOL5.on)return;const el=e.target&&e.target.closest&&e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act;if(a==='fmCont'||MP_NOADV.has(a))return;
  const hubCta=TAB==='hub'&&el.classList.contains('cta')&&el.closest('#view');if(!hubCta&&!MP_ADV.has(a))return;
  if(el.closest('#modal')&&!MP_ADV.has(a))return;
  e.preventDefault();e.stopImmediatePropagation();if(MP.ready){mpUI(true);return;}
  mpWant('devam',()=>{if(el.isConnected)el.click();else if(ACTX[a])ACTX[a](el);else{const t=fmContTarget();if(t)t.click();}});},true);
/* tatil: iki taraf da onay verdikçe ilerler */
if(typeof v165Loop==='function'){v165Loop=(old=>function(){try{if(!HOL5.on)MP.holOn=false;else if(!MP.holOn){MP.holOn=true;if(mpPartnerExists())MP.lim=Math.min(MP.lim,mpEpoch());}
    if(HOL5.on&&!HOL5.cancel&&mpPartnerExists()&&!mpStep()){if(!MP.ready)mpWant('tatil',null,Math.max(mpEpoch()+1,Math.floor((HOL5.tgt||0)/864e5)));
      mpUI();setTimeout(v165Loop,400);return;}}catch(e){}return old.apply(this,arguments);})(v165Loop);}
/* aynı takımda oynanamaz (futbolcu ve teknik direktör) */
function mpPeerInfo(){return (G&&G.mp&&G.mp.on&&G.mp.peer)||W.mpJoin||null;}
function mpClubBlocked(id){try{const P=mpPeerInfo();if(!P||!id||!P.club)return false;const pr=(G&&G.prof)||W.prof;if(!['oyuncu','td'].includes(pr))return false;return P.club===id&&P.prof===pr;}catch(e){return false;}}
const MP_BLK='Bu kulüpte arkadaşın var: çevrimiçi kariyerde aynı takımda olamazsınız.';
acceptOffer=(old=>function(o){if(o&&mpClubBlocked(o.club)){toast(MP_BLK);return;}return old.apply(this,arguments);})(acceptOffer);
mgrSign=(old=>function(id){if(mpClubBlocked(id)){toast(MP_BLK);return;}return old.apply(this,arguments);})(mgrSign);
signTryout=(old=>function(i){const o=G&&G.tryout&&G.tryout.offers[i];if(o&&mpClubBlocked(o.club)){toast(MP_BLK);return;}return old.apply(this,arguments);})(signTryout);
tryoutEnd=(old=>function(){const r=old.apply(this,arguments);try{const T=G.tryout,pc=G.mp&&G.mp.peer&&G.mp.peer.prof==='oyuncu'?G.mp.peer.club:null;
    if(T&&pc&&T.offers.some(o=>o.club===pc)){const used=new Set(T.offers.map(o=>o.club));const alt=leagueClubs('u14').filter(c=>!used.has(c.id)&&c.id!==pc).sort((a,b)=>b.str-a.str);
      T.offers=T.offers.map(o=>o.club===pc&&alt.length?Object.assign({},o,{club:alt.shift().id}):o).filter(o=>o.club!==pc);save();render();}}catch(e){}return r;})(tryoutEnd);
/* çok günlük ilerleme sonrası durum yayını */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(mpOn()){clearTimeout(MP.pt);MP.pt=setTimeout(()=>{mpPubState();mpPubRes();},120);}}catch(e){}return r;})(nextDay);
/* ---------- kurulum: sihirbazda "Çevrimiçi" kutusu, giriş ekranında "Odaya katıl" ---------- */
W.mpHost=false;W.mpCode=null;
ACTX.mpHostTog=el=>{W.mpHost=!!el.checked;if(W.mpHost&&!W.mpCode)W.mpCode=mpNewCode();showStart();};
function mpWizBox(){if(MP.join&&W.mpJoin)return `<div class="mp-wz mp-wz-j"><b>🌐 Odaya katılıyorsun · ${esc(W.mpJoin.code)}</b><small>Oda kurucusu: ${esc(W.mpJoin.n||'')} · ${esc(mpProfN(W.mpJoin.prof))}${W.mpJoin.cn?' · '+esc(W.mpJoin.cn):''}. Aynı mesleği seçmelisin${['oyuncu','td'].includes(W.mpJoin.prof)?'; aynı kulüpte olamazsınız':''}.</small><button class="btn ghost sm" data-act="mpJoinCancel">Vazgeç</button></div>`;
  return `<label class="mp-wz"><input type="checkbox" data-act="mpHostTog" ${W.mpHost?'checked':''}><span><b>🌐 Çevrimiçi: arkadaşınla oyna</b><small>${W.mpHost?`Oda kodun: <code>${esc(W.mpCode||'')}</code> — kariyer başlayınca oda kurulur, kodu ya da bağlantıyı arkadaşına gönderirsin.`:'İşaretlersen oda kodu üretilir ve oda kurulur. İşaretlemezsen her zamanki gibi tek oynarsın.'}</small></span></label>`;}
showStart=(old=>function(){const r=old.apply(this,arguments);try{const st=$('#start');if(!st)return r;
    if(W.step==='list'){const b=st.querySelector('[data-act=wz][data-k=prof]');if(b&&!st.querySelector('[data-act=mpJoinOpen]'))b.insertAdjacentHTML('afterend',`<button class="btn mp-joinb" data-act="mpJoinOpen">🌐 Arkadaşının odasına katıl<small>Oda kodu ya da davet bağlantısıyla</small></button>`);}
    if(W.step!=='list'&&W.mpJoin&&st.querySelector('[data-act=wzProf]')){W.prof=W.mpJoin.prof;st.querySelectorAll('[data-act=wzProf]').forEach(x=>{if(x.dataset.k!==W.mpJoin.prof){x.disabled=true;x.classList.add('mp-off');x.title='Odadaki arkadaşınla aynı meslek olmalı';}else x.classList.add('on');});}
    const P=W.mpJoin;if(P&&P.club&&['oyuncu','td'].includes(P.prof)){const o=st.querySelector('#wzCl option[value="'+P.club+'"]');if(o){o.disabled=true;o.textContent+=' (arkadaşın)';}}
    if(W.step!=='list'&&!st.querySelector('.mp-wz')){const go=st.querySelector('[data-act=wzGo]')||st.querySelector('.cta.big[data-act=wz]');if(go)go.insertAdjacentHTML('beforebegin',mpWizBox());}}catch(e){console.warn('oda sihirbaz',e);}return r;})(showStart);
ACTX.wzProf=el=>{if(W.mpJoin&&el.dataset.k!==W.mpJoin.prof){toast('Odadaki arkadaşınla aynı mesleği seçmelisin: '+mpProfN(W.mpJoin.prof));return;}W.prof=el.dataset.k;showStart();};
wizGo=(old=>function(){if(W.mpJoin&&W.prof!==W.mpJoin.prof){toast('Aynı meslek olmalı: '+mpProfN(W.mpJoin.prof));return;}
  if(W.mpJoin&&W.lvl&&W.lvl!=='sifir'){try{lvlDefaults();}catch(e){}if(mpClubBlocked(W.club)){toast(MP_BLK+' Başka bir kulüp seç.');return;}}
  const J=W.mpJoin,host=W.mpHost&&!J,code=host?(W.mpCode||mpNewCode()):null;const r=old.apply(this,arguments);
  try{if(G&&(J||host)){G.mp={on:true,code:J?J.code:code,role:J?'guest':'host',pid:J?MP.tmpPid:mpNewPid(),mem:J?[J.hp,MP.tmpPid]:[],chat:[],peer:J?{n:J.n,prof:J.prof,club:J.club,cn:J.cn,L:J.L}:null};
      if(J&&!G.mp.pid)G.mp.pid=mpNewPid();MP.join=null;W.mpJoin=null;W.mpHost=false;W.mpCode=null;save();
      if(MP.code===G.mp.code){MP.lastPub='';mpPubState(true);mpPubRes(true);}else mpStart(G.mp.code);
      if(host)msg('news','🌐 Çevrimiçi oda kuruldu',`Oda kodun <b>${G.mp.code}</b>. Kodu ya da davet bağlantısını (${esc(mpLink(G.mp.code))}) arkadaşına gönder; üst çubuktaki 🌐 rozetinden odayı açabilirsin.`);
      else msg('news','🌐 Odaya katıldın',`${esc(J.n||'Arkadaşın')} ile aynı dünyadasın (oda ${J.code}). Gün, ikiniz de “Hazırım” deyince ilerler.`);save();
      setTimeout(()=>{try{if(host&&$('#modal').hidden)mpPanel(true);else toast(host?'🌐 Oda kuruldu: '+G.mp.code:'🌐 Odaya katıldın: '+G.mp.code);}catch(e){}},400);}}catch(e){console.warn('oda kur',e);}return r;})(wizGo);
/* katılma */
function mpJoinHTML(code,stt){const J=MP.join||{};const h=J.host;
  return `<h3>🌐 Arkadaşının odasına katıl</h3><p class="muted">Arkadaşının gönderdiği 6 haneli oda kodunu yaz. Bağlantıyla geldiysen kod hazır.</p>
  <div class="mp-code-in"><input id="mpCodeIn" value="${esc(code||'')}" maxlength="7" placeholder="ÖRN. AB12CD" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="cta" data-act="mpJoinGo">Bağlan</button></div>
  <p class="mp-jst" id="mpJst">${stt||''}</p>
  ${h?`<div class="mp-host"><b>${esc(h.n||'Oda kurucusu')}</b><span>${esc(mpProfN(h.prof))}${h.cn?' · '+esc(h.cn):''}${h.Ln?' · '+esc(h.Ln):''}</span><span>${h.e?'Oyun tarihi: '+esc(mpDateTxt(h.e)):''}</span>
    ${h.mem&&h.mem.length>=2&&!h.mem.includes(MP.tmpPid)?'<p class="mp-bad">Bu oda dolu: iki oyuncu zaten içeride.</p>':`<button class="cta big" data-act="mpJoinYes"><span>Katıl ve kariyerini oluştur</span><small>${esc(mpProfN(h.prof))} olarak başlayacaksın${['oyuncu','td'].includes(h.prof)?' (farklı bir kulüpte)':''}</small></button>`}</div>`:''}
  <div class="offer-btns"><button class="btn ghost" data-act="mpJoinCancel">Kapat</button></div>`;}
ACTX.mpJoinOpen=el=>{openModal(mpJoinHTML(el&&el.dataset&&el.dataset.code||''));setTimeout(()=>{const i=$('#mpCodeIn');if(i)i.focus();},50);};
ACTX.mpJoinGo=async()=>{const i=$('#mpCodeIn'),code=mpNorm(i&&i.value);if(!mpCodeOk(code)){const s=$('#mpJst');if(s)s.textContent='Kod 6 karakter olmalı (harf ve rakam).';return;}
  if(G){save();G=null;W.step='list';render();}
  MP.tmpPid=MP.tmpPid||mpNewPid();MP.join={code,host:null,t0:Date.now()};openModal(mpJoinHTML(code,'⏳ Odaya bağlanılıyor…'));await mpStart(code);
  setTimeout(()=>{if(MP.join&&!MP.join.host){const s=$('#mpJst');if(s)s.innerHTML=mpConnected()?'Bağlandın ama oda kurucusu bulunamadı. Kodu kontrol et; kod doğruysa arkadaşının oyunu açık olmalı.':'Sunuculara bağlanılamadı. İnternet bağlantını kontrol et; birkaç saniye sonra yeniden dene.';}},9000);};
function mpJoinSeen(o){if(!MP.join||o.r!=='host')return;MP.join.host=o;if(!$('#modal').hidden&&$('#mpCodeIn'))openModal(mpJoinHTML(MP.join.code,'✅ Oda bulundu'));}
ACTX.mpJoinYes=()=>{const J=MP.join,h=J&&J.host;if(!h)return;W.mpJoin={code:J.code,hp:h.p,n:h.n,prof:h.prof,club:h.club,cn:h.cn,L:h.L};W.prof=h.prof;W.mpHost=false;closeModal();W.step='prof';showStart();};
ACTX.mpJoinCancel=()=>{const wasJ=!!W.mpJoin;W.mpJoin=null;if(MP.join){MP.join=null;if(!G)mpStop();}closeModal();if(wasJ){W.step='list';showStart();}};
/* ---------- arayüz: üst çubuk rozeti, bekleme çubuğu, oda paneli ---------- */
function mpStatus(){if(!mpOn())return {c:'off',t:'Kapalı'};const n=mpConnected();if(!n)return {c:'bad',t:'Bağlanıyor…'};
  if(!mpPartnerExists())return {c:'wait',t:'Arkadaşın bekleniyor'};return mpPeerLive()?{c:'ok',t:'Arkadaşın çevrimiçi'}:{c:'warn',t:'Arkadaşın çevrimdışı'};}
renderTop=(old=>function(){old.apply(this,arguments);try{if(!mpOn())return;const meta=$('#top .top-meta');if(!meta||meta.querySelector('.mp-pill'))return;const s=mpStatus();
    meta.insertAdjacentHTML('afterbegin',`<button class="mp-pill mp-${s.c}" data-act="mpPanel" title="Çevrimiçi oda · ${esc(s.t)}"><i></i><span>${esc(G.mp.code)}</span>${MP.unread?`<em>${MP.unread}</em>`:''}</button>`);}catch(e){}})(renderTop);
render=(old=>function(){const r=old.apply(this,arguments);try{mpEnsure();mpUI();}catch(e){}return r;})(render);
function mpUI(flash){try{const pill=$('#top .mp-pill');if(pill){const s=mpStatus();pill.className='mp-pill mp-'+s.c;pill.title='Çevrimiçi oda · '+s.t;const em=pill.querySelector('em');
      if(MP.unread&&!em)pill.insertAdjacentHTML('beforeend',`<em>${MP.unread}</em>`);else if(em){if(MP.unread)em.textContent=MP.unread;else em.remove();}}
    const fb=$('#top .fm-cont');if(fb){fb.classList.toggle('mp-rdy',!!MP.ready);const sp=fb.querySelector('span');if(sp){const want=MP.ready?'Bekleniyor…':(mpPartnerExists()?'Hazırım':'Devam');if(sp.textContent!==want)sp.textContent=want;}}
    const bc=document.querySelector('#tabs .tab.cont');if(bc){bc.classList.toggle('mp-rdy',!!MP.ready);const bb=bc.querySelector('b');if(bb){const want=MP.ready?'BEKLENİYOR':(mpOn()&&mpPartnerExists()?'HAZIRIM':'DEVAM');if(bb.textContent!==want)bb.textContent=want;}}
    let bar=$('#mpbar');const show=mpOn()&&mpPartnerExists()&&G&&(MP.ready||(MP.peer&&MP.peer.rd&&mpPeerLive()));
    if(!show){if(bar)bar.hidden=true;return;}
    if(!bar){bar=document.createElement('div');bar.id='mpbar';document.body.appendChild(bar);}bar.hidden=false;const P=MP.peer,nm=esc((P&&P.n)||(G.mp.peer&&G.mp.peer.n)||'Arkadaşın');
    let h;const me=mpEpoch();
    if(MP.ready){const live=mpPeerLive();
      h=!live?`<b>⏳ ${nm} çevrimdışı</b><span>Gün, arkadaşın da “Hazırım” deyince ilerler. Döndüğünde kendiliğinden devam edilir.</span><button class="btn sm" data-act="mpSolo">Tek devam et (çevrimiçini kapat)</button><button class="btn ghost sm" data-act="mpCancel">İptal</button>`
        :P.e<me?`<b>⏳ ${nm} geride</b><span>${esc(mpDateTxt(P.e))} tarihinde; seninle aynı güne gelince birlikte ilerlersiniz.</span><button class="btn ghost sm" data-act="mpNudge">🔔 Dürt</button><button class="btn ghost sm" data-act="mpCancel">İptal</button>`
        :`<b>✅ Hazırsın</b><span>${nm} da “Hazırım” deyince gün ilerleyecek.</span><button class="btn ghost sm" data-act="mpNudge">🔔 Dürt</button><button class="btn ghost sm" data-act="mpCancel">İptal</button>`;}
    else h=P.e>me?`<b>🟢 ${nm} ileride bekliyor</b><span>${esc(mpDateTxt(P.e))} · Devam’a basarak ona yetişebilirsin.</span>`:`<b>🟢 ${nm} hazır</b><span>Sen de Devam’a (Hazırım) basınca gün ilerler.</span>`;
    if(bar.__h!==h){bar.innerHTML=h;bar.__h=h;}bar.className=(MP.ready?'rdy':'peer')+(flash?' fl':'');if(flash){setTimeout(()=>{bar.classList.remove('fl');},700);}
    const pn=$('#mpPanelBody');if(pn&&!$('#modal').hidden&&!pn.__busy){const nh=mpPanelBody();if(pn.__h!==nh){pn.innerHTML=nh;pn.__h=nh;}}}catch(e){}}
ACTX.mpCancel=()=>mpCancel();
ACTX.mpSolo=()=>{if(!mpOn())return;G.mp.on=false;save();mpStop();const fn=MP.want;MP.ready=null;MP.want=null;toast('Çevrimiçi kapatıldı: tek oyuncu olarak devam ediyorsun');try{fn&&fn();}catch(e){}try{render();}catch(e){}};
ACTX.mpNudge=()=>{mpPubMsg({k:'nudge',n:(G.p&&G.p.name)||''});toast('🔔 Arkadaşına haber verildi');};
function mpPanelBody(){const s=mpStatus(),P=MP.peer||null,pp=G.mp.peer,me=mpEpoch();const link=mpLink(G.mp.code);
  const peerCard=mpPartnerExists()?`<div class="mp-peer"><b>${esc((P&&P.n)||(pp&&pp.n)||'Arkadaşın')}</b><span>${esc(mpProfN((P&&P.prof)||(pp&&pp.prof)))}${(P&&P.cn)||(pp&&pp.cn)?' · '+esc((P&&P.cn)||pp.cn):''}${P&&P.pos?' · ligde '+P.pos+'.':''}</span>
      ${P?`<span>${esc(P.Ln||'')} · ${esc(mpDateTxt(P.e))}${P.e===me?' (seninle aynı gün)':P.e>me?' (senden ileride)':' (senden geride)'}</span>${P.lr?`<span>Son maç: ${esc(P.lr[0])} ${P.lr[1]}-${P.lr[2]} ${esc(P.lr[3])}</span>`:''}<span class="mp-${mpPeerLive()?'ok':'warn'}t">${mpPeerLive()?(P.rd?'● Hazır':'● Çevrimiçi'):'○ Çevrimdışı'}</span>`:'<span>Henüz bilgi gelmedi</span>'}</div>`
    :`<div class="mp-peer mp-peer0"><b>Arkadaşın henüz katılmadı</b><span>Kodu ya da bağlantıyı gönder. Arkadaşın katılana kadar tek başına oynamaya devam edebilirsin; katıldığında seninle aynı tarihe yetişir.</span></div>`;
  return `<div class="mp-code"><small>Oda kodu</small><b>${esc(G.mp.code)}</b><div class="offer-btns"><button class="btn sm" data-act="mpCopy" data-v="${esc(G.mp.code)}">Kodu kopyala</button><button class="btn sm" data-act="mpCopy" data-v="${esc(link)}">Bağlantıyı kopyala</button>${navigator.share?'<button class="btn sm" data-act="mpShare">Paylaş</button>':''}</div><small class="mp-link">${esc(link)}</small></div>
    <p class="mp-st mp-${s.c}t">● ${esc(s.t)} · ${mpConnected()}/${MP.cons.length||MQB.length} sunucu bağlı${MP.key?' · uçtan uca şifreli':''}</p>
    ${peerCard}
    <div class="mp-srv">${(MP.cons.length?MP.cons:MQB.map(b=>({b,st:'kapalı'}))).map(c=>`<span class="mp-s-${c.st==='bağlı'?'ok':'no'}">${esc(c.b.n)}</span>`).join('')}</div>`;}
function mpPanel(first){if(!mpOn())return;MP.unread=0;
  openModal(`<h3>🌐 Çevrimiçi oda</h3>${first?'<p class="mp-new">Oda kuruldu! Kodu ya da bağlantıyı arkadaşına gönder. Arkadaşın “Arkadaşının odasına katıl” deyip kodu yazınca aynı dünyada kariyerine başlar.</p>':''}
  <div id="mpPanelBody">${mpPanelBody()}</div>
  <p class="sub-h" style="margin:12px 0 6px"><span>Sohbet</span></p><div id="mpChat" class="mp-chat"></div><div class="mp-chin"><input id="mpChIn" maxlength="240" placeholder="Mesaj yaz…" autocomplete="off"><button class="btn" data-act="mpSend">Gönder</button></div>
  <details class="mp-how"><summary>Nasıl çalışıyor?</summary><ul><li>İkiniz de aynı mesleği seçersiniz; futbolcular ve teknik direktörler aynı kulüpte olamaz.</li><li>Devam düğmesi “Hazırım” olur: gün ikiniz de hazır olunca ilerler. Biri ileri giderse diğeri ona yetişir.</li><li>Aynı ligdeyseniz puan durumu ortaktır: kendi maçın senin, arkadaşınınki onun; karşılaşırsanız ev sahibinin sonucu geçerlidir.</li><li>Her kariyer kendi cihazında kayıtlıdır; oyunu kapatıp açınca odaya kendiliğinden bağlanır.</li><li>Ücretsiz, herkese açık sunucular kullanılır; birkaçına birden bağlanılır, biri düşerse diğerleri sürer. İletiler oda kodundan türeyen anahtarla şifrelenir.</li></ul></details>
  <div class="offer-btns"><button class="btn ghost" data-act="mpOff">Çevrimiçini kapat</button><button class="btn" data-act="closeModal">Tamam</button></div>`);
  mpChatDraw();const pn=$('#mpPanelBody');if(pn)pn.__h=pn.innerHTML;mpUI();}
function mpChatDraw(){const box=$('#mpChat');if(!box||!G||!G.mp)return;const C=G.mp.chat||[];MP.unread=0;
  box.innerHTML=C.length?C.map(m=>`<p class="${m.me?'me':''}"><b>${esc(m.me?'Sen':m.n||'Arkadaşın')}</b>${esc(m.t)}</p>`).join(''):'<p class="muted">Henüz mesaj yok.</p>';box.scrollTop=box.scrollHeight;}
ACTX.mpPanel=()=>mpPanel(false);
ACTX.mpSend=async()=>{const i=$('#mpChIn');const t=(i&&i.value||'').trim();if(!t||!mpOn())return;i.value='';const C=G.mp.chat=G.mp.chat||[];C.push({n:G.p.name,t:t.slice(0,240),ts:Date.now(),me:1});if(C.length>60)C.splice(0,C.length-60);save();mpChatDraw();
  const n=await mpPubMsg({k:'ch',n:(G.p&&G.p.name)||'',t:t.slice(0,240)});if(!n)toast('Mesaj gönderilemedi: sunucuya bağlı değilsin');};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='mpChIn'){e.preventDefault();ACTX.mpSend();}if(e.key==='Enter'&&e.target&&e.target.id==='mpCodeIn'){e.preventDefault();ACTX.mpJoinGo();}});
ACTX.mpCopy=el=>{const v=el.dataset.v||'';const done=()=>toast('Kopyalandı: '+v.slice(0,40));try{navigator.clipboard.writeText(v).then(done,()=>{mpCopyOld(v);done();});}catch(e){mpCopyOld(v);done();}};
function mpCopyOld(v){try{const t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}catch(e){}}
ACTX.mpShare=()=>{try{navigator.share({title:'Futbol Kariyeri · oda '+G.mp.code,text:`Futbol Kariyeri'nde odama katıl! Oda kodu: ${G.mp.code}`,url:mpLink(G.mp.code)}).catch(()=>{});}catch(e){}};
ACTX.mpOff=()=>{if(!mpOn())return;G.mp.on=false;save();mpStop();closeModal();toast('Çevrimiçi kapalı: tek oyuncu. Ayarlar’dan yeniden açabilirsin.');try{render();}catch(e){}};
/* Ayarlar: çevrimiçi aç/kapat (mevcut kariyer için oda kur) */
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||!G||mc.querySelector('.mp-set'))return r;const on=mpOn();
    const h=`<div class="mp-set"><p class="sub-h" style="margin:14px 0 6px"><span>🌐 Çevrimiçi oda</span></p><label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="mpSetTog" ${on?'checked':''}> Çevrimiçi (arkadaşınla aynı dünyada oyna)</label>
      <small class="muted">${on?`Oda kodu <b>${esc(G.mp.code)}</b> · <a href="#" data-act="mpPanel">odayı aç</a>`:G.mp&&G.mp.code&&!G.mp.full?`Kapalı. Açarsan eski odan (<b>${esc(G.mp.code)}</b>) yeniden açılır.`:'Kapalı: tek oyuncu. Açarsan bu kariyer için oda kodu üretilir ve oda kurulur.'}</small></div>`;
    const tgt=mc.querySelector('.rn');if(tgt&&tgt.previousElementSibling)tgt.previousElementSibling.insertAdjacentHTML('beforebegin',h);else{const ob=mc.querySelector('.offer-btns');if(ob)ob.insertAdjacentHTML('beforebegin',h);else mc.insertAdjacentHTML('beforeend',h);}}catch(e){}return r;})(openSettings);
ACTX.mpSetTog=el=>{if(!G)return;if(el.checked){if(!G.mp||G.mp.full||!G.mp.code)G.mp={on:true,code:mpNewCode(),role:'host',pid:mpNewPid(),mem:[],chat:[],peer:null};else G.mp.on=true;save();mpStart(G.mp.code);closeModal();render();mpPanel(!(G.mp.mem&&G.mp.mem.length>=2));}
  else{G.mp.on=false;save();mpStop();closeModal();render();toast('Çevrimiçi kapalı: tek oyuncu');}};
/* davet bağlantısı: #oda=KOD */
function mpHashCode(){try{const m=/[#&?]oda=([A-Za-z0-9]{6})/.exec(location.hash||'')||/[?&]oda=([A-Za-z0-9]{6})/.exec(location.search||'');return m?mpNorm(m[1]):null;}catch(e){return null;}}
setTimeout(()=>{try{const c=mpHashCode();if(!c)return;try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
    if(G&&G.mp&&G.mp.code===c){G.mp.on=true;save();mpEnsure();render();return;}
    if(G){save();G=null;W.step='list';render();}ACTX.mpJoinOpen({dataset:{code:c}});setTimeout(()=>ACTX.mpJoinGo(),80);}catch(e){console.warn('oda bağlantı',e);}},600);
/* açılışta kayıtlı kariyer odadaysa bağlan */
setTimeout(()=>{try{mpEnsure();}catch(e){}},900);
window.addEventListener('online',()=>{try{for(const c of MP.cons)if(c.st!=='bağlı'){clearTimeout(c.rt);mqOpen(c);}}catch(e){}});
document.addEventListener('visibilitychange',()=>{try{if(document.visibilityState==='visible'&&MP.code){for(const c of MP.cons)if(c.st!=='bağlı'&&c.st!=='bağlanıyor'){clearTimeout(c.rt);mqOpen(c);}mpPubState(true);}}catch(e){}});
/* test kancası */
window.__mp={MP,state:()=>({on:mpOn(),code:G&&G.mp&&G.mp.code,role:G&&G.mp&&G.mp.role,mem:G&&G.mp&&G.mp.mem,peer:MP.peer&&{n:MP.peer.n,e:MP.peer.e,club:MP.peer.club,rd:MP.peer.rd},live:mpPeerLive(),conn:mpConnected(),ready:MP.ready,lim:MP.lim,e:mpEpoch(),club:G&&G.club,prof:G&&G.prof})};
