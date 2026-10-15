/* ================= v172: sade menü (aynı ekrana giden tekrarlar tek öğede, alt sekmeli; boş ekranlar soluk) ve tek güç ölçeği (0–100) ================= */
/* ---------- 1) tek güç ölçeği ----------
   İç hesaplar (ovr, pot, takım gücü) 100'lük ölçekte ve değişmez. v115'ten beri ekranda ab200() ile 200'lük gösteriliyordu;
   kartta "140 GENEL" yazarken özellikler 65–77 görünüyordu. Ölçülen dağılım (27.523 oyuncu): en iyiler 88–91 (Kane 91, Mbappé 90),
   Premier Lig ortancası 79, Süper Lig ortancası 70, alt ligler 50'ler. Bu dağılım istenen okunuşa (yıldız 85–92, sıradan lig oyuncusu 60–75)
   zaten uyduğu için gösterim, iç değerin yuvarlanmış hâlidir (1–99); sıralama birebir korunur. Tüm ekranlar R200/ab200/potTxt üzerinden geçtiği için
   tek noktadan değişir. */
function gucGoster(o){const v=+o;if(!isFinite(v))return o;return Math.max(1,Math.min(99,Math.round(v)));}
ab200=gucGoster;
const GUC_IPUCU='Genel güç 0–100 ölçeğindedir (özelliklerle aynı). 85+ dünya yıldızı · 75–84 üst düzey lig oyuncusu · 65–74 iyi lig oyuncusu · 55–64 alt lig oyuncusu · 55 altı gelişmekte.';
ACTX.gucIp=()=>{try{toast(GUC_IPUCU);}catch(e){}};
const v172IpBtn=()=>`<button type="button" class="v172-ip" data-act="gucIp" title="${esc(GUC_IPUCU)}" aria-label="Güç ölçeği nedir?">?</button>`;
/* profil: "Mevcut yetenek" kutusuna ipucu */
pfBuild=(old=>function(mc){const r=old.apply(this,arguments);try{const s=mc&&mc.querySelector('.ca-sec .ca-row > div:first-child > span');if(s&&!s.querySelector('.v172-ip'))s.insertAdjacentHTML('beforeend',' '+v172IpBtn());}catch(e){}return r;})(pfBuild);
/* kadro, transfer, gözlem tabloları: "Güç" başlığına ipucu */
function v172GucBaslik(root){try{if(!root)return;for(const th of root.querySelectorAll('th')){if(th.querySelector('.v172-ip'))continue;const t=th.textContent.trim().replace(/[▾▴▲▼\s]+$/,'');if(/^(güç|GÜÇ|Güç|CA|Yetenek)$/.test(t)){th.title=GUC_IPUCU;th.insertAdjacentHTML('beforeend',v172IpBtn());}}
    for(const b of root.querySelectorAll('.pc-ovr > b, .lic-ovr > b'))if(!b.title)b.title=GUC_IPUCU;}catch(e){}}

/* ---------- 2) sade menü ----------
   Aynı ekran ailesine giden öğeler menüde tek öğe olur; ailenin diğer ekranları sayfanın üstünde alt sekme olarak durur.
   Anahtar: sekme[:KTAB|:LTAB]. Klasik menü (navCats) hiç değişmez. */
const V172_FAM=[
  {id:'kadro',l:'Kadro',m:['squad:kadro','squad:soz','squad:iliski','squad:ekip','trep','plan','res']},
  {id:'taktik',l:'Taktik',m:['squad:taktik','setp']},
  {id:'mac',l:'Maç hazırlığı',m:['prep','mrep','rdr']},
  {id:'lig',l:'Lig ve kupalar',m:['league:tbl','league:fx','league:g','league:cup','avr','stats']},
  {id:'odul',l:'Ödüller',m:['awards','bdo','leg']},
  {id:'trf',l:'Transfer',m:['trc','squad:transfer','squad:gozlem','loans','tlog']},
  {id:'yon',l:'Yönetim ve finans',m:['board','fin','hist','nt']},
  {id:'kar',l:'Kariyerim',m:['career','zaman','sezon','ssum','lcg']},
  {id:'yas',l:'Yaşam',m:['life','sm','night','_cz']}];
/* alt sekmede daha açıklayıcı adlar (menüdeki ad korunur) */
const V172_ALTAD={'league:tbl':'Puan durumu','squad:kadro':'Oyuncular',career:'Genel bakış',sezon:'Sezon özeti',ssum:'En iyi goller ve sezon kartı',life:'Yaşam ve mağaza',trc:'Transfer merkezi','squad:transfer':'Pazar ve teklifler',board:'Yönetim'};
const v172Key=a=>a?a.tab+(a.k?':'+a.k:'')+(a.l?':'+a.l:''):'';
/* meslek bazında aileden çıkan ya da gizlenen öğeler */
function v172Kural(){const pl=isPl(),ref=typeof isRef==='function'&&isRef(),td=typeof isTD==='function'&&isTD();
  return {ayri:new Set([...(td?['nt']:[]),...(pl?['sm']:[])]),gizle:new Set(ref?['_cz']:[])};}
/* veri yokken boş kalan ekranlar (menüde soluk, "henüz veri yok") */
function v172Bos(key){try{const m=G.m||{},n=o=>Object.keys(o||{}).length;
  switch(key){case 'sezon':return !n(v165().sz);case 'ssum':return !n(G.ssum);case 'awards':return !n(G.awards);case 'bdo':return !n(bdoAll());
    case 'loans':return !(n(m.lout)||n(m.loans));case 'mrep':return !((m.an)||[]).length;case 'nt':return G.mode==='mgr'&&!(m.nt||m.ntOff);
    case 'disc':{const j=G.job||{};return !((Array.isArray(j.disc)?j.disc.length:n(j.disc))||n(j.rv));}}}catch(e){}return false;}
let V172_SON=null;/* son kurulan aileler: {id:{l,mem:[item...]}} */
uiGroups=(old=>{window.v172UiEski=old;return function(){const L=old.apply(this,arguments);try{if(!G)return L;const K=v172Kural(),famOf={},F={};
    for(const f of V172_FAM)for(const k of f.m)if(!K.ayri.has(k))famOf[k]=f;
    /* önce her ailenin menüde bulunan üyelerini topla */
    for(const [,items] of L)for(const it of items){const k=v172Key(it[2]);if(K.gizle.has(k))continue;const f=famOf[k];if(f){(F[f.id]=F[f.id]||{f,mem:[]}).mem.push(it);}}
    for(const id in F)F[id].mem.sort((a,b)=>F[id].f.m.indexOf(v172Key(a[2]))-F[id].f.m.indexOf(v172Key(b[2])));
    const out=[],done=new Set();
    for(const [g,items] of L){const keep=[];
      for(const it of items){const k=v172Key(it[2]);if(K.gizle.has(k))continue;const f=famOf[k];
        if(!f){keep.push(v172Bos(k)?[it[0],it[1],Object.assign({},it[2],{bos:1})]:it);continue;}
        if(done.has(f.id))continue;done.add(f.id);const mem=F[f.id].mem;
        if(mem.length===1){const x=mem[0];keep.push([x[0],x[1],Object.assign({},x[2],v172Bos(v172Key(x[2]))?{bos:1}:{})]);continue;}
        const h=mem.find(x=>x[2].tab!=='_cz')||mem[0],allBos=mem.every(x=>v172Bos(v172Key(x[2])));
        /* ailenin ana ekranı yoksa (ör. sportif direktörde Maç hazırlığı) öğe ilk üyenin adını taşır */
        keep.push([h[0],v172Key(h[2])===f.m[0]?f.l:h[1],Object.assign({},h[2],{fam:f.id},allBos?{bos:1}:{})]);}
      if(keep.length)out.push([g,keep]);}
    /* "Eğlence" gibi tek öğesi aileye katılıp boşalan gruplar düşer; aile üyesi başka gruptaysa (ör. Eğlence → Yaşam) ailenin grubunda kalır */
    V172_SON={};for(const id in F)if(F[id].mem.length>1)V172_SON[id]={l:F[id].f.l,mem:F[id].mem};
    return out;}catch(e){console.warn('v172 menü',e);return L;}};})(uiGroups);
/* aile öğesi: üyelerinden biri açıksa etkin sayılır */
function v172FamCur(){if(!V172_SON)return null;for(const id in V172_SON)if(V172_SON[id].mem.some(x=>x[2].tab!=='_cz'&&navOn(x[2])))return id;return null;}
navOn=(old=>function(a){if(a&&a.fam){const S=V172_SON&&V172_SON[a.fam];if(S)return S.mem.some(x=>x[2].tab!=='_cz'&&old(x[2]));}return old.apply(this,arguments);})(navOn);
uiGoAttrs=(old=>function(a){let s=old.apply(this,arguments);try{if(a&&a.fam)s+=` data-fam="${a.fam}"`;if(a&&a.bos)s+=' data-bos="1" title="Henüz veri yok"';}catch(e){}return s;})(uiGoAttrs);
/* sayfa üstündeki alt sekmeler */
function v172AltHTML(id,skip){const S=V172_SON&&V172_SON[id];if(!S)return '';const mem=S.mem.filter(x=>!skip||!skip(x));if(!mem.length)return '';
  return `<nav class="v172-alt" aria-label="${esc(S.l)}">${mem.map(([,l,a])=>{const k=v172Key(a),on=a.tab!=='_cz'&&navOn(a),bos=v172Bos(k);
    return `<button class="v172-at${on?' on':''}${bos?' bos':''}" ${uiGoAttrs(a)} ${on?'aria-current="page"':''}${bos?' title="Henüz veri yok"':''}>${esc(V172_ALTAD[k]||l)}${bos?'<small>henüz veri yok</small>':''}</button>`;}).join('')}</nav>`;}
function v172Alt(){try{const v=$('#view');if(!v||v.querySelector(':scope > .v172-alt'))return;uiGroups();const id=v172FamCur();if(!id)return;
    if(TAB==='league'){/* lig sayfasının kendi sekmeleri var; yalnız lig dışı üyeler (Avrupa, İstatistikler) eklenir */
      const st=v.querySelector('.lg-tabs, .filt');if(!st||!st.querySelector('[data-act=ltab]')||st.querySelector('.v172-lx'))return;const mem=V172_SON[id].mem,has=k=>!!st.querySelector(`[data-act=ltab][data-k="${k}"]`);let h='';
      /* menüden kalkan Fikstür sekmesi lig sayfasında yoksa eklenir (puan durumunun hemen yanına) */
      const fx=mem.find(x=>x[2].tab==='league'&&x[2].l==='fx');if(fx&&!has('fx')){const t=st.querySelector('[data-act=ltab][data-k="tbl"]');const b=`<button class="chip v172-lx" data-act="ltab" data-k="fx" aria-pressed="${LTAB==='fx'}">${esc(fx[1])}</button>`;if(t)t.insertAdjacentHTML('afterend',b);else h+=b;}
      /* lig dışı üyeler (İstatistikler; Avrupa sekmesi lig sayfasında zaten varsa aynı ekran olduğu için eklenmez) */
      for(const [,l,a] of mem)if(a.tab!=='league'&&!(a.tab==='avr'&&has('avr')))h+=`<button class="chip v172-lx" ${uiGoAttrs(a)}>${esc(l)}</button>`;
      if(h)st.insertAdjacentHTML('beforeend',h);if(!st.querySelector('.v172-lx'))st.insertAdjacentHTML('beforeend','<i class="v172-lx" hidden></i>');return;}
    const h=v172AltHTML(id);if(!h)return;const gt=v.querySelector(':scope > .grp-tabs');if(gt)gt.insertAdjacentHTML('afterend',h);else v.insertAdjacentHTML('afterbegin',h);}catch(e){console.warn('v172 alt sekme',e);}}
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.phase!=='tryout'){if(uiSade())v172Alt();v172GucBaslik($('#view'));}}catch(e){}return r;})(render);
/* oyuncu kartı / karşılaştırma pencereleri: güç başlığına ipucu */
openModal=(old=>function(){const r=old.apply(this,arguments);try{v172GucBaslik($('#modalCard'));}catch(e){}return r;})(openModal);
