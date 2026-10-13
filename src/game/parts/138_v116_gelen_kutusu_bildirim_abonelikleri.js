/* ================= v116: gelen kutusu — bildirim abonelikleri, temizleme, seçip toplu silme ================= */
const INB_CAT=[['board','Yönetim ve kulüp','Yönetim kurulu, bütçe, hedefler, kulüp kararları'],['squad','Kadro ve takım','Kadro durumu, gelişim raporları, soyunma odası'],['coach','Teknik ekip','Hoca ve antrenörlerden mesajlar'],
  ['injury','Sakatlıklar','Sakatlık ve iyileşme haberleri'],['offer','Teklifler','Sözleşme ve transfer teklifleri'],['scout','Gözlemci raporları','Gözlem ve keşif raporları'],['report','Maç ve dönem raporları','Analiz ve dönem raporları'],
  ['gundem','Gündem','Lig ve dünya futbolundan gelişmeler'],['news','Haberler','Genel futbol haberleri'],['press','Basın','Röportaj ve basın talepleri'],['event','Olaylar','Kişisel olaylar ve kararlar'],['nat','Milli takım','Milli takım çağrıları ve haberleri']];
function inbSub(){G.inSub=G.inSub||{};return G.inSub;}
function inbOn(t){const S=inbSub();return S[t]!==false;}
/* kapalı başlıktaki mesajlar gelmez — karar bekleyen olaylar ve açık teklifler her zaman gelir */
msg=(old=>function(t,title,body,extra){try{if(G&&!inbOn(t)&&!(extra&&(extra.offer||extra.ev))){G.inMuted=(G.inMuted||0)+1;return;}}catch(e){}return old.apply(this,arguments);})(msg);
let INB_EDIT=false;const INB_SEL=new Set();
function inbLocked(m){return !!((m.offer&&m.offer.status==='open')||(m.ev&&!m.ev.done));}
viewInbox=(old=>function(){if(INB_EDIT)return inbEditHTML();let h=old.apply(this,arguments);try{const off=INB_CAT.filter(([k])=>!inbOn(k)).length;
  const tools=`<div class="inb-tools"><button class="btn ghost sm" data-act="inbEdit">☑ Seç ve sil</button><button class="btn ghost sm" data-act="inbClean" title="Okunmuş ve karar beklemeyen mesajları siler">🧹 Temizle</button><button class="btn ghost sm" data-act="inbSet">🔔 Bildirimler${off?` <em class="inb-off">${off} kapalı</em>`:''}</button></div>`;
  h=h.replace(/(<div class="inbox-head"><h2 class="h">Gelen kutusu<\/h2>)/,`$1${tools}`);}catch(e){}return h;})(viewInbox);
function inbEditHTML(){const L=G.inbox,all=L.length&&L.filter(m=>!inbLocked(m)).every(m=>INB_SEL.has(m.id));
  return `<div class="inbox-head"><h2 class="h">Gelen kutusu · düzenle</h2><div class="inb-tools"><button class="btn ghost sm" data-act="inbAll">${all?'Seçimi kaldır':'Tümünü seç'}</button><button class="btn ghost sm" data-act="inbRead">Okunanları seç</button><button class="btn sm danger" data-act="inbDel" ${INB_SEL.size?'':'disabled'}>🗑 Seçilenleri sil (${INB_SEL.size})</button><button class="btn sm cta" data-act="inbEdit">Bitti</button></div></div>
  ${L.length?`<ul class="inb-ed">${L.map(m=>{const lk=inbLocked(m);return `<li class="${m.read?'':'unread'}${lk?' lk':''}"><label><input type="checkbox" data-act="inbTog" data-id="${m.id}" ${INB_SEL.has(m.id)?'checked':''} ${lk?'disabled':''}><span class="msg-tag">${TAGS[m.t]||'•'}</span><b>${esc(m.title)}</b><small>${esc(m.when||'')}${lk?' · karar bekliyor, silinemez':''}</small></label></li>`;}).join('')}</ul>`:'<p class="empty">Gelen kutun boş.</p>'}`;}
ACTX.inbEdit=()=>{INB_EDIT=!INB_EDIT;INB_SEL.clear();render();};
ACTX.inbTog=el=>{const id=el.dataset.id;if(el.checked)INB_SEL.add(id);else INB_SEL.delete(id);const b=document.querySelector('[data-act="inbDel"]');if(b){b.disabled=!INB_SEL.size;b.textContent=`🗑 Seçilenleri sil (${INB_SEL.size})`;}};
ACTX.inbAll=()=>{const ids=G.inbox.filter(m=>!inbLocked(m)).map(m=>m.id);const all=ids.length&&ids.every(id=>INB_SEL.has(id));INB_SEL.clear();if(!all)ids.forEach(id=>INB_SEL.add(id));render();};
ACTX.inbRead=()=>{INB_SEL.clear();G.inbox.filter(m=>m.read&&!inbLocked(m)).forEach(m=>INB_SEL.add(m.id));render();};
ACTX.inbDel=()=>{const n=INB_SEL.size;if(!n)return;G.inbox=G.inbox.filter(m=>!INB_SEL.has(m.id)||inbLocked(m));INB_SEL.clear();INB_EDIT=false;try{if(typeof INSEL!=='undefined'&&!G.inbox.some(m=>m.id===INSEL))INSEL=null;}catch(e){}save();render();toast(`${n} mesaj silindi`);};
ACTX.inbClean=()=>{const before=G.inbox.length;G.inbox=G.inbox.filter(m=>!m.read||inbLocked(m));const n=before-G.inbox.length;try{if(typeof INSEL!=='undefined'&&!G.inbox.some(m=>m.id===INSEL))INSEL=null;}catch(e){}save();render();toast(n?`${n} okunmuş mesaj temizlendi`:'Temizlenecek okunmuş mesaj yok');};
function inbSetHTML(){const S=inbSub();return `<section class="inb-set"><div class="inb-set-hd"><h3>Bildirim ayarları</h3><button type="button" class="pf-x" data-act="closeModal" aria-label="Kapat">✕</button></div>
  <p class="muted" style="margin:0 0 10px;font-size:13px">İşaretli başlıklardaki mesajlar gelen kutuna düşer. Karar bekleyen olaylar ve açık teklifler her zaman gelir.</p>
  <div class="inb-set-l">${INB_CAT.map(([k,n,d])=>`<label class="inb-set-i"><input type="checkbox" data-act="inbSub" data-k="${k}" ${S[k]!==false?'checked':''}><span class="msg-tag">${TAGS[k]||'•'}</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></label>`).join('')}</div>
  <div class="inb-set-f"><button class="btn ghost sm" data-act="inbSubAll" data-v="1">Hepsini aç</button><button class="btn ghost sm" data-act="inbSubAll" data-v="0">Sadece önemliler</button>${G.inMuted?`<small class="muted">Şimdiye kadar ${G.inMuted} mesaj gizlendi</small>`:''}</div></section>`;}
ACTX.inbSet=()=>{openModal(inbSetHTML());};
ACTX.inbSub=el=>{inbSub()[el.dataset.k]=!!el.checked;save();};
ACTX.inbSubAll=el=>{const S=inbSub(),on=el.dataset.v==='1',keep=['offer','injury','coach','board','nat'];INB_CAT.forEach(([k])=>{S[k]=on||keep.includes(k);});save();openModal(inbSetHTML());render();};

