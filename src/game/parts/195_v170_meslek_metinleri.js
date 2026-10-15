/* ================= v170: meslek metinleri · SD/başkan unvanı, kariyer başlangıç sezonu, meslek bazlı yardım/ayarlar/sayaçlar =================
   U1: sportif direktör ve kulüp başkanı kariyerleri ana sayfa sezon kartında, Kariyerim'de, kariyer anlarında ve pazarlık penceresinde
       "Teknik direktör" görünüyordu; unvan artık meslekten türetilir, eski kayıtlardaki yanlış G.ms metinleri yüklemede düzeltilir.
   U7: futbolcu dışı mesleklerde başlangıç anı, kariyerin açıldığı 2025 yaz arasının etiketine (2025/26) yazılıyordu (startManagerCareer /
       startStaffCareer G.s.year=2025 yapıp save() → msSync çağırıyor; ilk sezon newSeason(2026) ile 2026/27'dir). Başlangıç anı ilk
       oynanan sezona taşınır; eski kayıtlarda da düzelir.
   U6: kulüp vizyonu, "Nasıl oynanır", Ayarlar ve Kariyerim sayaçları futbolcu dışındaki mesleklerde mesleğe göre. */

/* sd/bsk rolü (kayıt nesnesi üzerinden; yüklenen kayıtta da çalışsın diye G'ye bağlı değil) */
function v170Rol(g){if(!g||g.mode!=='mgr')return null;const r=(g.m&&g.m.role)||g.prof;return r==='sd'||r==='bsk'?r:null;}
function v170PlG(g){return !!g&&(!g.mode||g.mode==='player');}
const V170_RT={sd:{bas:'Sportif direktörlüğe başladı',gorev:n=>`Yeni görev: ${n} sportif direktörü`,bit:'Sportif direktörlüğü bıraktı',kis:'SD',emk:'Emekli sportif direktör'},
  bsk:{bas:'Kulüp başkanlığına başladı',gorev:n=>`Yeni görev: ${n} başkanı`,bit:'Kulüp başkanlığını bıraktı',kis:'BŞK',emk:'Emekli kulüp başkanı'}};
const V170_BAS=/^(Teknik direktörlüğe başladı|Sportif direktörlüğe başladı|Kulüp başkanlığına başladı|Hakemliğe başladı|.+ olarak kariyerine başladı)$/;
/* kayıt düzeltmesi: hem canlı kariyerde (msSync sonrası) hem yüklemede */
function v170Fix(g){try{if(!g||!g.p||!Array.isArray(g.ms)||!g.ms.length||v170PlG(g))return g;
    const rol=v170Rol(g);
    if(rol){const T=V170_RT[rol];for(const m of g.ms){if(!m||typeof m.t!=='string')continue;
        if(m.t==='Teknik direktörlüğe başladı')m.t=T.bas;
        else if(/^Teknik direktörlüğe başladı: /.test(m.t))m.t=m.t.replace(/^Teknik direktörlüğe başladı/,T.bas);
        else{const k=/^Yeni görev: (.+) teknik direktörü$/.exec(m.t);if(k)m.t=T.gorev(k[1]);else if(m.t==='Teknik direktörlüğü bıraktı')m.t=T.bit;}}}
    /* başlangıç anı: ilk oynanan sezona */
    const m0=g.ms[0];if(m0&&m0.ic==='td'&&V170_BAS.test(m0.t||'')&&g.s){const h=g.history||[];let hedef;
      if(h.length&&h[0].year)hedef=h[0].year;
      else if(g.phase==='off'&&g.mustMove&&g.ms.length===1)hedef=seasonLabel(g.s.year+1);/* henüz kulüp yok: ilk sezon gelecek sezon */
      else hedef=seasonLabel(g.s.year);
      if(hedef&&String(m0.y||'')<String(hedef))m0.y=hedef;}}catch(e){}return g;}
msSync=(old=>function(){const r=old.apply(this,arguments);try{v170Fix(G);}catch(e){}return r;})(msSync);
slotLoad=(old=>function(){return v170Fix(old.apply(this,arguments));})(slotLoad);
load=(old=>function(){return v170Fix(old.apply(this,arguments));})(load);
/* kariyere başlamadan önceki yaz arası (2025) — futbolcu dışı, henüz kulüp yok */
function v170Bekleme(){return !!G&&!isPl()&&G.s&&!(G.history||[]).length&&G.phase==='off'&&G.mustMove&&(G.ms||[]).length<=1;}

/* ---------- Kariyerim: unvan ve sayaçlar ---------- */
careerSnap=(old=>function(){const s=old.apply(this,arguments);try{if(isPl())return s;const rol=v170Rol(G);
    if(rol)s.status=G.phase==='retired'?V170_RT[rol].emk:ROLE_N[rol];
    if(G.mode==='mgr'){const t=G.totals||{};if(!t.apps)s.peak=0;
      const mt=G.mt||{w:0,d:0,l:0,s:0},st=(G.m&&G.m.st)||{},cur=G.phase==='season'||(G.phase==='off'&&G.m&&G.m.sacked);
      s.mg={w:(mt.w||0)+(cur?st.w||0:0),d:(mt.d||0)+(cur?st.d||0:0),l:(mt.l||0)+(cur?st.l||0:0),s:mt.s||0};}
    if(v170Bekleme()){const y=seasonLabel(G.s.year+1);s.from=y;s.to=y;}}catch(e){}return s;})(careerSnap);
careerHTML=(old=>function(s){let h=old.apply(this,arguments);try{if(!s||snapKind(s)!=='mgr')return h;
    const rol=s.prof==='sd'||s.prof==='bsk'?s.prof:null;
    if(rol){const k=V170_RT[rol].kis;h=h.replace(/(<div class="car-av"><svg[\s\S]*?<text[^>]*>)[^<]*(<\/text>)/,`$1${k}$2`).replace(/<u class="rt r-xi">TD<\/u>/g,`<u class="rt r-xi">${k}</u>`).replace(/ \(TD\)<\/span>/g,` (${k})</span>`);}
    const g=s.mg||(s.mt?{w:s.mt.w||0,d:s.mt.d||0,l:s.mt.l||0,s:s.mt.s||0}:{w:0,d:0,l:0,s:0}),n=g.w+g.d+g.l,t=s.totals||{};
    const ad=rol==='bsk'?'başkanlık döneminde oynanan maçlar':rol==='sd'?'görev süresince oynanan maçlar':'yönettiği maçlar';
    const strip=`<section class="panel"><div class="strip v170-str"><div><b>${n}</b><span>Maç</span></div><div><b>${g.w}</b><span>G</span></div><div><b>${g.d}</b><span>B</span></div><div><b>${g.l}</b><span>M</span></div><div><b>${(s.trophies||[]).length}</b><span>Kupa/ödül</span></div></div><p class="muted" style="margin-top:10px;text-align:center">Maç: ${ad}${g.s?` · ${g.s} sezon tamamlandı`:''}${n?` · galibiyet oranı %${Math.round(g.w/n*100)}`:''}</p>${t.apps?`<p class="muted" style="margin-top:6px;text-align:center">Futbolculuk dönemi: ${t.apps} maç · ${t.goals||0} gol · ${t.assists||0} asist${s.caps?` · ${s.caps} milli maç`:''}</p>`:''}</section>`;
    h=h.replace(/<section class="panel"><div class="strip">[\s\S]*?<\/section>/,strip);}catch(e){console.warn('v170 kariyer',e);}return h;})(careerHTML);

/* ---------- ana sayfa sezon kartı (SD/başkan) ---------- */
viewMgrHub=(old=>function(){let h=old.apply(this,arguments);try{const rol=v170Rol(G);if(rol)h=h.replace(/(<span>\d{4}\/\d{2}) · teknik direktör<\/span>/,`$1 · ${ROLE_N[rol].toLocaleLowerCase('tr-TR')}</span>`);}catch(e){}return h;})(viewMgrHub);

/* ---------- zaman çizelgesi: kariyer öncesi yaz arası ayrı sezon sayılmasın ---------- */
v165ViewTl=(old=>function(){if(!v170Bekleme())return old.apply(this,arguments);const y0=G.s.year;G.s.year=y0+1;try{return old.apply(this,arguments);}finally{G.s.year=y0;}})(v165ViewTl);
try{V165_V.zaman=v165ViewTl;}catch(e){}/* görünüm tablosu eski başvuruyu tutuyordu */

/* ---------- pazarlık: kendi kulübünde SD/başkan konuşuyorsa unvanı doğru yaz ---------- */
negOpen=(old=>function(){const r=old.apply(this,arguments);try{const rol=v170Rol(G),n=G.m&&G.m.neg;if(rol&&n&&n.from===G.club){const c=CLUBS[G.club],eski=`${c.name} · sportif direktör`,yeni=`${c.name} · ${ROLE_N[rol].toLocaleLowerCase('tr-TR')}`;
      document.querySelectorAll('#modalCard .ng-log i').forEach(i=>{if(i.textContent===eski)i.textContent=yeni;});}}catch(e){}return r;})(negOpen);

/* ---------- kulüp vizyonu: futbolcu dışındaki mesleklerde yönetici gözüyle ---------- */
const V170_VIS={genc:'Genç oyunculara süre verir; 21 yaş ve altındaki oyuncular kadroda bir basamak üst role yerleşir.',
  sampiyon:'Sonuç odaklı ve sabırsız. Bütçe ve maaşlar yüksek, forma rekabeti sert; kötü sonuçlar çabuk sorgulanır.',
  altyapi:'Antrenman kalitesi yüksek; oyuncular takım idmanlarından daha fazla gelişir.',
  vitrin:'Oyuncularını büyük kulüplere satar; gözlemciler bu takımın maçlarını daha çok izler.',
  hucum:'Topa sahip olur, sürekli atak yapar; forvet ve kanat oyuncuları maçta daha çok pozisyona girer.',
  savunma:'Kompakt ve disiplinli; savunma ve orta saha oyuncuları maçta daha çok sorumluluk alır.',
  tutumlu:'Bütçe kısıtlı, maaşlar düşük; kadro dar tutulur.'};
function v170VisD(c){try{if(!G||isPl())return null;return V170_VIS[clubVision(c)]||null;}catch(e){return null;}}
visLine=(old=>function(c){let h=old.apply(this,arguments);try{const d=v170VisD(c),v=VISIONS[clubVision(c)];if(d&&v)h=h.replace(`<p>${v.d}</p>`,`<p>${d}</p>`);}catch(e){}return h;})(visLine);
showClub=(old=>function(id){const r=old.apply(this,arguments);try{const d=v170VisD(CLUBS[id]);if(d){const p=document.querySelector('#modalCard .vis-d');if(p)p.textContent=d;}}catch(e){}return r;})(showClub);

/* ---------- Nasıl oynanır: meslek bazlı ---------- */
/* futbolcunun maç kontrolleri ve futbolcu günlüğü (yalnız futbolcu kariyerinde gösterilir) */
const V170_HLP_PL=['Takvim','Bireysel idman','Maç','Takım arkadaşların','Rakipler','Savunma','Korner','Takım idmanı ve seçmeler','Maçta değişiklik ve darbe','Pazarlık ve kiralık','İdman zorunluluğu','Ayarlar','Kişisel plan','Futbolcu maçında Pro modu','Futbolcu maçında rakip hoca','Pro modunda yapay zekâ yardımı','Şut çeşitleri','Pres','Kondisyon','Oynanış ayrıntıları','Maçın akışı ve hava','Futbolcu: takım arkadaşları, menajer, sponsor, yaşam','Geç kariyer hedefleri ve jübile'];
/* mesleğe ait mevcut yardım başlıkları (en üste taşınır) */
const V170_HLP_PR={
  td:['Teknik direktörlük','Takım kurma (teknik direktör)','2B maç motoru (teknik direktör)','2B maç motoru ve taktik ekranı','Antrenman','Maç hazırlığı ve basın','Sözleşmeler (teknik direktör)','Altyapı ve newgen (teknik direktör)','Teknik direktör: rakip planı, duran toplar, kültür, seçim','Soyunma odası hiyerarşisi'],
  yrd:['Yardımcı antrenör, gözlemci, doktor','Yardımcı antrenör maçı','Teknik ekip meslekleri','Teknik ekip görev panosu'],
  scout:['Yardımcı antrenör, gözlemci, doktor','Gözlem haritası','Gözlemci raporu','Gözlemci ağı','Transferlerim (gözlemci)','Yönetime baskı (gözlemci)'],
  dr:['Yardımcı antrenör, gözlemci, doktor','Doktor gelişimi','Doktor: muayene odası'],
  sd:['Yeni meslekler: sportif direktör, kulüp başkanı, hakem','Transfer merkezi, kadro planlayıcı, maç analizi','Transfer ve kiralık görüşmeleri','Transfer dönemleri'],
  bsk:['Yeni meslekler: sportif direktör, kulüp başkanı, hakem','Yönetim','Finans, kiralıklar, ödüller','Transfer dönemleri'],
  ref:['Yeni meslekler: sportif direktör, kulüp başkanı, hakem','Hakem modu: canlı karar','Hakem: ciddi kararlar ya da tüm kararlar','Hakem hataları: türüne göre eksi puan','Hakem teknolojileri','VAR: monitöre yürüyüş ve nihai karar','VAR ve tartışmalı kararlar','MHK: uyarı, görevden uzaklaştırma, men','Kart kuralları ve cezalar']};
const V170_HLP_GIR={
  td:'Teknik direktör olarak maçta topu sen kontrol etmezsin: kadroyu, dizilişi ve talimatları belirlersin, maçı izler ya da sonucunu alırsın. Takım menüsünden kadro, taktik, antrenman ve transferleri yönetirsin; lisansını yükselttikçe büyük kulüplere ulaşırsın.',
  sd:'Sportif direktör olarak maç günü kadroyu ve taktiği teknik direktör belirler; sen maç sonucunu alır ya da maçı tribünden izlersin. Transferler, sözleşmeler ve altyapı senin elinde; teknik direktörü sen seçer, gerekirse görevden alırsın.',
  bsk:'Kulüp başkanı olarak bütçe, bilet fiyatları, sponsorlar, krediler, tesisler ve hoca seçimi senin elinde; üç yılda bir seçime girersin. Maçlarda kadroyu ve taktiği teknik direktör belirler.',
  yrd:'Yardımcı antrenör olarak maç öncesi idman planı ve rakip analizi hazırlarsın; isabetli hazırlık takımı güçlendirir ve hocanın güvenini artırır. Altyapı antrenörlüğünden as hocalığa ve teknik direktörlüğe yükselebilirsin.',
  scout:'Gözlemci olarak kulübün için yetenek ararsın: ülke ülke gezer, oyuncuları izler ve raporlarsın; keşfettiğin oyuncular yıldızlaştıkça itibarın artar.',
  dr:'Takım doktoru olarak sakat oyunculara teşhis koyar, tedavi seçer ve onları sahaya döndürürsün. Fizyoterapistlikten sağlık şefliğine yükselirsin.',
  ref:'Hakem olarak atandığın maçlarda pozisyonlarda karar verirsin; doğru kararlar maç notunu yükseltir, klasman atlatır ve FIFA kokartına götürür.'};
showHelp=(old=>function(){const r=old.apply(this,arguments);try{if(!G||!G.p||isPl())return r;const box=document.querySelector('#modalCard .help');if(!box)return r;
    const pr=v170Rol(G)||G.prof||(G.mode==='mgr'?'td':G.staff);
    /* başlık + ardından gelen paragraflar = bir bölüm */
    const sec={};let cur=null;for(const el of Array.from(box.children)){if(el.tagName==='H4'){cur={h:el,els:[el]};const k=el.textContent.trim();(sec[k]=sec[k]||[]).push(cur);}else if(cur)cur.els.push(el);}
    for(const k of V170_HLP_PL)for(const s of sec[k]||[])for(const el of s.els)el.hidden=true;
    const top=document.createElement('div');top.className='v170-hlp';
    top.innerHTML=`<p class="kicker">${esc(carProfIc(pr))} ${esc(carProfN(pr))} kariyeri</p><p>${esc(V170_HLP_GIR[pr]||'')}</p><p class="muted">Devam düğmesi (ya da boşluk tuşu) günü ilerletir. Futbolcunun maç kontrolleri (joystick, şut, pas) bu kariyerde kullanılmadığı için burada gösterilmez.</p>`;
    for(const k of V170_HLP_PR[pr]||[])for(const s of sec[k]||[])for(const el of s.els)top.appendChild(el);/* taşınır, kopyalanmaz */
    box.insertBefore(top,box.firstChild);
    const h3=document.querySelector('#modalCard h3');if(h3)h3.textContent=`Nasıl oynanır · ${carProfN(pr)}`;}catch(e){console.warn('v170 yardım',e);}return r;})(showHelp);

/* ---------- Ayarlar: futbolcuya özel bölümler yalnız futbolcuda ---------- */
openSettings=(old=>function(){const r=old.apply(this,arguments);try{if(!G||!G.p||isPl())return r;const mc=document.querySelector('#modalCard');if(!mc)return r;
    const ce=mc.querySelector('.ctl-entry');if(ce){const p=ce.previousElementSibling;if(p&&p.classList.contains('sub-h')&&/Kontroller/i.test(p.textContent))p.remove();ce.remove();}
    mc.querySelectorAll('.plm-set,.pl3-set').forEach(e=>e.remove());}catch(e){}return r;})(openSettings);
