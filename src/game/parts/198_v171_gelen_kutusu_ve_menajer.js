/* ================= v171: gelen kutusu sadeleşiyor (aynı başlıklı iletiler tek iletide "×N", mesleğe göre transfer gündemi yalnız Haberler'e, tekrar eden sorulara bekleme süresi) · tek menajer sistemi (mağaza "Menajer" eşyası kaldırıldı, bedeli iade) ================= */
const GK171={nom:0,agw:0};
function gk171S(){G.gk171=G.gk171||{};const S=G.gk171;S.yq=S.yq||{};return S;}
/* Birleştirilebilir ileti: teklif, karar, olay, haftanın 11'i, menajer ve benzeri ek alan taşımayan düz bilgi iletisi */
const GK171_BASE=new Set(['id','t','title','body','read','when','ad','pr','n','hist','dn']);
function gk171Can(m){if(!m||typeof m!=='object')return false;if(m.offer||m.ev||m.totw||m.twRaw||m.pzRep||m.ag)return false;for(const k in m)if(!GK171_BASE.has(k))return false;return true;}
const GK171_GUN=28;/* bu kadar gün içindeki aynı başlıklı ileti birleşir */
/* aynı konunun farklı başlıkları tek iletide: haftalık idman programı isteği ve sonucu */
const GK171_AILE={'Haftalık program bekleniyor':'yr_prg','Haftalık program uygulandı':'yr_prg','Hoca kendi programını uyguladı':'yr_prg'};
const gk171Key=m=>m.t+'|'+(GK171_AILE[m.title]||m.title);

/* ---------- transfer gündemi: hakem, doktor ve 16 yaş altı futbolcu için gelen kutusuna değil yalnız Haberler'e ---------- */
function gk171TrQuiet(){try{if(!G||!G.s)return false;if(isRef())return true;if(isStaff()&&G.staff==='dr')return true;if(isPl()&&G.p&&G.p.age<16)return true;}catch(e){}return false;}
function gk171IsTr(m){return m.t==='gundem'&&/→|^Haftanın transferleri$|^Transfer|^Kiralık: |transfer yaptı$|kadrosunu güçlendirdi$/.test(String(m.title||''));}
function gk171Own(m){try{if(isRef())return false;const s=String(m.title||'')+' '+String(m.body||''),c=CLUBS[G.club];
    if(c&&(s.includes(c.name)||(c.short&&String(m.title||'').endsWith('→ '+c.short))))return true;
    if(isPl()&&G.p&&G.p.name&&s.includes(G.p.name))return true;}catch(e){}return false;}

/* ---------- iletinin gelen kutusuna düştüğü an ---------- */
function gk171Post(m){const L=G.inbox,S=gk171S();
  /* transfer gündemi (060_v42 sarmalayıcısı akışa zaten ekledi) */
  if(gk171TrQuiet()&&gk171IsTr(m)&&gk171Can(m)&&!gk171Own(m)){L.shift();S.fo=(S.fo||0)+1;return;}
  if(GK171.nom||!gk171Can(m))return;
  /* aynı başlık: eski iletiye ekle, en günceli üstte */
  let j=-1;for(let i=1;i<Math.min(L.length,90);i++){const o=L[i];if(gk171Key(o)===gk171Key(m)&&gk171Can(o)&&(m.ad==null||o.ad==null||m.ad-o.ad<=GK171_GUN)){j=i;break;}}
  if(j<0)return;const o=L[j];
  if(o.body!==m.body){o.hist=o.hist||[];o.hist.unshift({w:o.when||'',b:(o.title!==m.title?o.title+': ':'')+String(o.body||'')});if(o.hist.length>5)o.hist.length=5;}
  /* aile: bekleyen istek → sonucu aynı haftanın devamıdır, sayaç artmaz */
  if(!(GK171_AILE[m.title]&&o.title!==m.title&&m.title!=='Haftalık program bekleniyor'))o.n=(o.n||1)+1;
  if(m.title==='Vakalar asistana devredildi'){/* kendi kararının özeti: toplam hasta sayısı tek iletide; yeniden "okunmamış" yapmaz */
    const k=s=>{const x=/^(?:Toplam )?(\d+) hasta/.exec(String(s||''));return x?+x[1]:0;};const now=k(m.body);o.dn=(o.dn||k(o.body))+now;
    o.body=`Toplam ${o.dn} hasta asistan hekime devredildi (son devir: ${now} hasta, ${m.when||'bugün'}). Teşhislerin bir kısmı yanlış olabilir; yönetim işin sana ait olduğunu hatırlatıyor.`;o.hist=null;delete o.hist;}
  else{o.body=m.body;o.read=!!m.read&&!!o.read;}
  o.title=m.title;o.when=m.when;if(m.ad!=null)o.ad=m.ad;if(m.pr)o.pr=m.pr;
  L.shift();L.splice(L.indexOf(o),1);L.unshift(o);
  try{if(INSEL===m.id)INSEL=o.id;}catch(e){}}
msg=(old=>function(t,title,body,extra){if(!G||!Array.isArray(G.inbox))return old.apply(this,arguments);const top0=G.inbox[0];const r=old.apply(this,arguments);
  try{const m=G.inbox[0];if(m&&m!==top0&&m.title===title)gk171Post(m);}catch(e){console.warn('v171 gelen kutusu',e);}return r;})(msg);

/* ---------- karar kuyruğu iletileri birleşmez; hoca aynı genç oyuncuyu 4 hafta içinde yeniden sormaz ---------- */
v155Push=(old=>function(ev){GK171.nom++;try{
    if(ev&&ev.k==='yr_req'&&ev.pk!=null&&G&&G.club){const S=gk171S(),d=V155_DAY(),rec=k=>S.yq[k]!=null&&d-S.yq[k]<GK171_GUN;
      for(const k in S.yq)if(d-S.yq[k]>=GK171_GUN*3)delete S.yq[k];
      if(rec(ev.pk)){const p0=pByKey(ev.pk);let alt=null;try{alt=squadOf(G.club).filter(p=>p.age<=21&&!rec(p.k)).sort((a,b)=>potOf(b)-potOf(a))[0];}catch(e){}
        if(!alt||!p0)return;const a0=`${esc(p0.name)} (${p0.age})`,b=String(ev.b||'');if(!b.includes(a0))return;
        ev=Object.assign({},ev,{key:alt.k,pk:alt.k,b:b.split(a0).join(`${esc(alt.name)} (${alt.age})`)});}
      S.yq[ev.pk]=d;}
    return old.call(this,ev);}finally{GK171.nom--;}})(v155Push);
/* "Kadroya alınsın" denen genç uzun süre yeniden sorulmaz */
if(V155_DEC.yr_req)V155_DEC.yr_req=(old=>function(ev,k){const r=old.apply(this,arguments);try{if(k==='evet'&&ev&&ev.pk!=null)gk171S().yq[ev.pk]=V155_DAY()+GK171_GUN*2;}catch(e){}return r;})(V155_DEC.yr_req);

/* ---------- görünüm: "×N" sayacı ve önceki iletiler ---------- */
function gk171Badge(m){return `<em class="gk171-n" title="Bu ileti ${m.n} kez geldi">×${m.n}</em>`;}
msgHTML=(old=>function(m){let h=old.apply(this,arguments);try{if(m&&m.n>1){const i=h.indexOf('<b>');if(i>0)h=h.slice(0,i+3)+gk171Badge(m)+h.slice(i+3);
      if(m.hist&&m.hist.length&&h.includes('class="msg-body"')){const a=h.indexOf('class="msg-body"'),e=h.indexOf('</p>',a);
        if(e>0)h=h.slice(0,e+4)+`<details class="gk171-h"><summary>Önceki ${m.hist.length} ileti</summary><ul>${m.hist.map(x=>`<li><small>${esc(x.w)}</small> ${esc(x.b)}</li>`).join('')}</ul></details>`+h.slice(e+4);}}}catch(e){}return h;})(msgHTML);
if(typeof ibSplit2==='function')ibSplit2=(old=>function(list){let h=old.apply(this,arguments);try{for(const m of list||[])if(m&&m.n>1){const k=`data-act="ibSel" data-id="${m.id}">`,i=h.indexOf(k);if(i<0)continue;const e=h.indexOf('<b>',i);if(e>0)h=h.slice(0,e+3)+gk171Badge(m)+h.slice(e+3);}}catch(e){}return h;})(ibSplit2);

/* =====================================================================
   Tek menajer sistemi (denetim G11): mağazadaki "Menajer" eşyası kaldırıldı.
   Etki yalnız kurgusal menajerden (174_v147 / 188_v161: a.pow teklifte, itibarlı menajer pazarlıkta).
   ===================================================================== */
const GK171_MJ_FIYAT=(()=>{try{const u=UPGRADES.find(x=>x[0]==='menajer');return u?u[3]:1500000;}catch(e){return 1500000;}})();
try{for(const L of [UPGRADES,SHOP&&SHOP.ekip&&SHOP.ekip.items]){if(!Array.isArray(L))continue;const i=L.findIndex(x=>x&&x[0]==='menajer');if(i>=0)L.splice(i,1);}}catch(e){console.warn('v171 menajer',e);}
/* agWithPow (174) pazarlık sırasında up.menajer'i geçici açar; o sırada göç çalışmasın */
haggle=(old=>function(){GK171.agw++;try{return old.apply(this,arguments);}finally{GK171.agw--;}})(haggle);
if(typeof askTerm==='function')askTerm=(old=>function(){GK171.agw++;try{return old.apply(this,arguments);}finally{GK171.agw--;}})(askTerm);
if(typeof negoSheet==='function')negoSheet=(old=>function(){GK171.agw++;try{return old.apply(this,arguments);}finally{GK171.agw--;}})(negoSheet);
/* teklif maaşı: eski eşya çarpanları (006: ×1,2; 183: ×1,1) devre dışı, yalnız menajerin gücü (1 + a.pow) kalır */
makeOffer=(old=>function(){const p=G&&G.p,had=p&&p.up&&p.up.menajer;if(had)delete p.up.menajer;try{return old.apply(this,arguments);}finally{if(had)p.up.menajer=had;}})(makeOffer);
/* eski kayıt: eşyayı satın almış olana bedeli iade edilir, gelen kutusuna bilgi düşer */
function gk171MjGoc(){if(!G||!G.p||G.gk171mj||GK171.agw>0)return;G.gk171mj=1;const p=G.p;
  if(p.up&&p.up.menajer===true){delete p.up.menajer;p.money=(p.money||0)+GK171_MJ_FIYAT;
    try{msg(isPl()?'menajer':'news','Menajer hizmeti kaldırıldı',`Mağazadaki "Menajer" hizmeti artık yok; ödediğin ${money(GK171_MJ_FIYAT)} hesabına iade edildi. Tekliflerde ve pazarlıkta yalnız anlaştığın menajerin etkisi geçerli (Kariyer › Menajer ve sponsorlar).`);}catch(e){}
    try{save();}catch(e){}}}
render=(old=>function(){try{gk171MjGoc();}catch(e){console.warn('v171 menajer göçü',e);}return old.apply(this,arguments);})(render);
