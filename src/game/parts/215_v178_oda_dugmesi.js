/* ================= v178: üst çubukta "Oda" düğmesi ve küçük panel (çevrimiçi olanlar, son olaylar); oda kurucusu sunucu: kariyeri açıkken oda sürer, bağlantısı giderse oda duraklar; olaylar kayda yazılır ================= */
/* ---------- oda olay günlüğü (kayıtta tutulur; oyunu kapatıp açınca kaybolmaz) ---------- */
function v178Log(x){try{if(!G||!G.mp)return;const L=G.mp.log=G.mp.log||[];const s=String(x||'').slice(0,160);if(L.length&&L[L.length-1].x===s&&Date.now()-L[L.length-1].t<60000)return;
    L.push({t:Date.now(),e:mpEpoch(),x:s});if(L.length>40)L.splice(0,L.length-40);save();}catch(e){}}
function v178Rol(r){return r==='host'?'Sunucu':'Misafir';}
function v178PeerN(){return (MP.peer&&MP.peer.n)||(G.mp.peer&&G.mp.peer.n)||'Arkadaşın';}
/* bağlantı ve eşleşme değişimleri günlüğe */
const V178={live:null,conn:null,mem:0,lr:'',y:0,pop:false};
function v178Izle(){try{if(!G||!G.mp||!mpOn())return;const mem=(G.mp.mem||[]).length,live=mpPeerLive(),conn=mpConnected()>0,nm=v178PeerN(),host=G.mp.role==='host';
    if(V178.conn!==null&&conn!==V178.conn)v178Log(conn?'Sunuculara yeniden bağlandın':'İnternet bağlantın koptu');
    if(V178.conn===null&&conn)v178Log('Odaya bağlandın · '+(host?'oda sunucusu sensin':'sunucu: '+nm));
    V178.conn=conn;
    if(mem>=2&&V178.mem<2&&V178.mem!==0)v178Log(nm+' odaya katıldı');V178.mem=mem;
    if(mem>=2){if(V178.live!==null&&live!==V178.live)v178Log(live?(host?nm+' çevrimiçi oldu':'Sunucu ('+nm+') çevrimiçi: oda sürüyor'):(host?nm+' çevrimdışı oldu':'Sunucu ('+nm+') kapandı: oda duraklatıldı'));V178.live=live;}
    const P=MP.peer;if(P&&P.lr&&live){const k=P.lr.join('|');if(V178.lr&&k!==V178.lr)v178Log(`${nm}: ${P.lr[0]} ${P.lr[1]}-${P.lr[2]} ${P.lr[3]}`);V178.lr=k;}}catch(e){}}
/* kendi maç sonucun da günlüğe */
nextDay=(old=>function(){const n0=G&&G.s?G.s.results.length:0,y0=G&&G.s?G.s.year:0;const r=old.apply(this,arguments);try{if(mpOn()&&G.s&&G.s.year===y0&&G.s.results.length>n0){const x=mpLastRes();if(x)v178Log(`Sen: ${x[0]} ${x[1]}-${x[2]} ${x[3]}`);}}catch(e){}return r;})(nextDay);
mpFull=(old=>function(){v178Log('Oda dolu: katılamadın');return old.apply(this,arguments);})(mpFull);
/* ---------- sunucu (oda kurucusu): arkadaşın çevrimdışıysa günler senin Devam’ınla ilerler; arkadaşın dönünce sana yetişir ---------- */
mpCheck=(old=>function(){const r=old.apply(this,arguments);try{if(MP.ready&&mpOn()&&G.mp.role==='host'&&mpPartnerExists()&&!mpPeerLive()&&mpConnected()>0&&!MP.going){const me=mpEpoch();const T=MP.ready.stop;if(T>me){v178Log('Sunucu olarak devam ettin ('+v178PeerN()+' çevrimdışı)');mpGo(T);}}}catch(e){}return r;})(mpCheck);
/* misafir: sunucu kapalıyken bekleme çubuğu bunu söyler */
mpUI=(old=>function(){const r=old.apply(this,arguments);try{v178Izle();
    const bar=$('#mpbar');if(bar&&!bar.hidden&&MP.ready&&G.mp.role==='guest'&&!mpPeerLive()){const nm=esc(v178PeerN());
      const h=`<b>⏸ Sunucu kapalı · oda duraklatıldı</b><span>Odanın sunucusu ${nm}. ${nm} kariyerini açınca kaldığınız yerden birlikte devam edersiniz; senin kaydın cihazında duruyor.</span><button class="btn sm" data-act="mpSolo">Odadan ayrıl, tek devam et</button><button class="btn ghost sm" data-act="mpCancel">İptal</button>`;
      if(bar.__h!==h){bar.innerHTML=h;bar.__h=h;}}
    /* hazır sayacı: herkes hazırsa (gün ilerlerken) sayaç gizlenir */
    for(const s of document.querySelectorAll('.mp-say'))s.hidden=s.textContent==='0/2';
    v178Dugme();if(V178.pop)v178PopCiz();}catch(e){}return r;})(mpUI);
/* ---------- üst çubuk: Oda düğmesi ---------- */
function v178Cevrimici(){if(!G||!G.mp||!mpOn())return 0;return (mpConnected()>0?1:0)+(mpPartnerExists()&&mpPeerLive()?1:0);}
function v178Dugme(){try{if(!G||G.phase==='retired')return;const meta=$('#top .top-meta');if(!meta)return;let b=meta.querySelector('.mp-pill');
    if(!b){meta.insertAdjacentHTML('afterbegin','<button class="mp-pill mp-off" data-act="v178Oda"></button>');b=meta.querySelector('.mp-pill');}
    if(b.dataset.act!=='v178Oda')b.dataset.act='v178Oda';
    const on=mpOn(),n=v178Cevrimici(),s=mpStatus();if(!b.classList.contains('mp-'+s.c))b.className='mp-pill mp-'+s.c;b.classList.add('v178-oda');
    const un=MP.unread&&on?`<em>${MP.unread}</em>`:'';const h=`<i></i><b class="v178-l">Oda</b>${on?`<small class="v178-n">${n}/2</small>`:''}${un}`;
    if(b.__h!==h){b.innerHTML=h;b.__h=h;}b.title=on?`Çevrimiçi oda ${G.mp.code} · ${s.t}`:'Çevrimiçi oda: kapalı';}catch(e){}}
renderTop=(old=>function(){old.apply(this,arguments);try{v178Dugme();}catch(e){}})(renderTop);
/* ---------- küçük panel ---------- */
function v178Saat(t){try{const d=new Date(t),n=new Date();const hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return d.toDateString()===n.toDateString()?hm:d.getDate()+'.'+(d.getMonth()+1)+' '+hm;}catch(e){return '';}}
function v178Kisi(o){return `<li class="v178-k ${o.c}"><i></i><div><b>${esc(o.n)}${o.sen?' <span class="v178-sen">sen</span>':''}</b><small>${esc(o.alt)}</small></div><em>${esc(o.rol)}</em></li>`;}
function v178PopHTML(){if(!mpOn())return `<div class="v178-h"><b>🌐 Çevrimiçi oda</b><span class="v178-d mp-offt">Kapalı</span></div>
    <p class="v178-p">Bu kariyer tek oyunculu. Oda kurarsan sunucusu sen olursun: kariyerin açık olduğu sürece arkadaşın aynı dünyada seninle oynar.</p>
    <div class="v178-b"><button class="btn sm" data-act="v178Kur">Oda kur</button><button class="btn sm" data-act="v178Katil">Arkadaşının odasına katıl</button></div>`;
  const s=mpStatus(),host=G.mp.role==='host',P=MP.peer,pp=G.mp.peer||{},live=mpPeerLive(),me=mpEpoch(),conn=mpConnected()>0;
  const ben={n:(G.p&&G.p.name)||'Sen',sen:1,rol:v178Rol(G.mp.role),c:conn?'on':'off',alt:[mpProfN(G.prof),mpClubN(G.club)].filter(Boolean).join(' · ')+(conn?(MP.ready?' · hazır':' · çevrimiçi'):' · bağlanıyor…')};
  const kisi=[ben];
  if(mpPartnerExists()){const pr=(P&&P.prof)||pp.prof,cn=(P&&P.cn)||pp.cn,e=(P&&P.e)||pp.e;let d=live?(P&&P.rd?(P.rd.k==='tatil'?'tatilde':'hazır'):'çevrimiçi'):'çevrimdışı';
    if(e&&e!==me)d+=' · '+mpDateTxt(e)+(e>me?' (ileride)':' (geride)');
    kisi.push({n:v178PeerN(),rol:v178Rol(host?'guest':'host'),c:live?(P&&P.rd?'rd':'on'):'off',alt:[mpProfN(pr),cn].filter(Boolean).join(' · ')+' · '+d});}
  const n=kisi.filter(k=>k.c!=='off').length;
  const durum=!mpPartnerExists()?`Kod ya da bağlantıyı arkadaşına gönder; katılınca burada görünür.`
    :host?(live?'Sunucu sensin: kariyerin açık oldukça oda açık.':`Sunucu sensin. ${esc(v178PeerN())} çevrimdışı: Devam’a bastıkça günler ilerler, döndüğünde sana yetişir.`)
    :(live?`Sunucu ${esc(v178PeerN())}: bağlantı açık.`:`Sunucu (${esc(v178PeerN())}) kapalı: oda duraklatıldı. Kariyerini açınca aynı yerden sürersiniz.`);
  const L=(G.mp.log||[]).slice(-6).reverse();
  return `<div class="v178-h"><b>🌐 Oda <span class="v178-kod">${esc(G.mp.code)}</span></b><span class="v178-d mp-${s.c}t">● ${n}/2 çevrimiçi</span></div>
    <ul class="v178-ks">${kisi.map(v178Kisi).join('')}${mpPartnerExists()?'':'<li class="v178-k bos"><i></i><div><b>Boş yer</b><small>Arkadaşın bekleniyor</small></div><em>Misafir</em></li>'}</ul>
    <p class="v178-p">${durum}</p>
    ${L.length?`<p class="v178-st">Son olaylar</p><ul class="v178-log">${L.map(x=>`<li><time>${esc(v178Saat(x.t))}</time>${esc(x.x)}</li>`).join('')}</ul>`:''}
    <div class="v178-b"><button class="btn sm" data-act="v178Panel">Sohbet ve ayrıntılar${MP.unread?` (${MP.unread})`:''}</button><button class="btn sm" data-act="mpCopy" data-v="${esc(mpLink(G.mp.code))}">Bağlantıyı kopyala</button></div>`;}
function v178PopCiz(){const p=$('#v178Pop');if(!p||p.hidden)return;const h=v178PopHTML();if(p.__h!==h){p.innerHTML=h;p.__h=h;}v178Konum();}
function v178Konum(){const p=$('#v178Pop'),b=$('#top .mp-pill');if(!p||!b)return;const r=b.getBoundingClientRect(),w=Math.min(340,window.innerWidth-16);p.style.width=w+'px';
  p.style.top=Math.round(r.bottom+8)+'px';p.style.left=Math.round(Math.max(8,Math.min(window.innerWidth-w-8,r.left+r.width/2-w/2)))+'px';}
function v178Kapat(){const p=$('#v178Pop');if(p)p.hidden=true;V178.pop=false;}
ACTX.v178Oda=()=>{let p=$('#v178Pop');if(p&&!p.hidden){v178Kapat();return;}
  if(!p){p=document.createElement('div');p.id='v178Pop';p.className='v178-pop';document.body.appendChild(p);}
  p.hidden=false;V178.pop=true;p.__h='';v178PopCiz();MP.unread=MP.unread||0;};
ACTX.v178Panel=()=>{v178Kapat();mpPanel(false);};
ACTX.v178Kur=()=>{v178Kapat();if(!G)return;ACTX.mpSetTog({checked:true});v178Log('Oda kuruldu · sunucu sensin');};
ACTX.v178Katil=()=>{v178Kapat();if(!G)return;save();G=null;W.step='list';try{render();}catch(e){}ACTX.mpJoinOpen({dataset:{code:''}});};
document.addEventListener('click',e=>{if(!V178.pop)return;const t=e.target;if(t&&t.closest&&(t.closest('#v178Pop')||t.closest('#top .mp-pill')))return;v178Kapat();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&V178.pop){v178Kapat();e.stopImmediatePropagation();e.preventDefault();}},true);
window.addEventListener('resize',()=>{if(V178.pop)v178Konum();});
/* sekme/sayfa kapanırken kayıt (son olaylar ve gün kaybolmasın) */
const v178Kaydet=()=>{try{if(G)save();}catch(e){}};
window.addEventListener('pagehide',v178Kaydet);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')v178Kaydet();});
/* sezon ortası eşitlemesi ve oda açma/kapama da günlüğe */
ACTX.mpOff=(old=>function(){if(mpOn())v178Log('Çevrimiçi kapatıldı');return old.apply(this,arguments);})(ACTX.mpOff);
ACTX.mpSolo=(old=>function(){if(mpOn())v178Log('Odadan ayrıldın: tek devam');return old.apply(this,arguments);})(ACTX.mpSolo);
