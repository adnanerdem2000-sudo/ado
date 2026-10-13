/* ================= v122: özellik açıklamaları · aramalı geniş karşılaştırma · gerçekçi istenen bonservis ================= */
/* ---------- özellik açıklamaları (profilde üstüne gelince / dokununca) ---------- */
const ATTR_DESC={
  'Bitiricilik':'Ceza sahası içindeki pozisyonları gole çevirme becerisi. Maçta şutların isabetini ve gol olasılığını belirler.',
  'Dripling':'Top ayağındayken rakibi geçme becerisi. Bire birlerde topu kaybetmeden ilerlemeyi sağlar.',
  'İlk Kontrol':'Gelen topu ilk dokunuşta kontrol etme. Baskı altında topu kaybetmeyi ve hızlı oyunu etkiler.',
  'Kafa Vuruşu':'Topa kafayla isabetli vurma. Duran toplarda gol ve savunmada uzaklaştırma başarısını belirler.',
  'Korner':'Köşe vuruşlarının kalitesi. İyi kornerci duran toplardan daha çok pozisyon üretir.',
  'Markaj':'Rakip oyuncuyu yakından takip etme. Savunmada adamını kaçırmamayı ve gol yememeyi etkiler.',
  'Orta Yapma':'Kanattan ceza sahasına isabetli orta açma. Kanat oyuncuları ve bekler için önemlidir.',
  'Pas':'Pasın isabeti ve doğru ağırlıkta verilmesi. Topa sahip olmayı ve hücum kurmayı belirler.',
  'Penaltı Kullanma':'Penaltı atışlarındaki başarı. Penaltıcı seçerken en çok buna bakılır.',
  'Serbest Vuruş Kullanma':'Serbest vuruşlardan doğrudan kaleyi bulma ya da tehlikeli top gönderme becerisi.',
  'Teknik':'Topla oynama ustalığı, zor topları kontrol etme ve estetik hareketler. Diğer teknik becerileri destekler.',
  'Top Kapma':'Rakipten topu temiz şekilde alma. Faul yapmadan top kazanmayı ve savunma başarısını etkiler.',
  'Uzaktan Şut':'Ceza sahası dışından isabetli ve sert şut çekme. Kapalı savunmaları açmaya yarar.',
  'Uzun Taç':'Taç atışlarını uzağa, ceza sahasına atabilme. Duran top silahı olarak kullanılır.',
  'Agresiflik':'İkili mücadeleye girme isteği. Yüksekse top kazanır ama kart görme riski artar.',
  'Cesaret':'Risk almaktan çekinmeme; kafa topuna, kayarak müdahaleye girme. Sakatlık korkusunu azaltır.',
  'Çalışkanlık':'Takım için koşma, pres yapma ve geri dönme isteği. Presli taktiklerde çok önemlidir.',
  'Karar Alma':'Doğru anda doğru hamleyi seçme: pas mı, şut mu, top sürmek mi. Oyunun genel kalitesini etkiler.',
  'Kararlılık':'Zor anlarda pes etmeme. Geriye düşülen maçlarda performansı ve gelişimi destekler.',
  'Konsantrasyon':'Maç boyunca dikkatini koruma. Düşükse özellikle son dakikalarda hata yapar.',
  'Liderlik':'Takım arkadaşlarını yönlendirme ve moral verme. Kaptan seçimi ve takım morali için önemlidir.',
  'Önsezi':'Oyunu okuyup olacakları önceden görme. Pas arası yapmayı ve doğru yerde olmayı sağlar.',
  'Özel Yetenek':'Beklenmedik, yaratıcı hareketler yapabilme. Maçı tek başına değiştirecek anlar üretir.',
  'Pozisyon Alma':'Savunmada doğru yerde durma. Kaleyi korumada ve ofsayt çizgisinde belirleyicidir.',
  'Soğukkanlılık':'Baskı altında sakin kalma. Gol önünde ve kritik anlarda doğru karar vermeyi sağlar.',
  'Takım Oyunu':'Taktiğe ve takım arkadaşlarına uyum. Bencil oyun yerine takım için oynamayı belirler.',
  'Topsuz Alan':'Topsuzken boşa kaçma ve doğru koşu yapma. Forvet ve ofansif orta sahalar için önemlidir.',
  'Vizyon':'Başkalarının göremediği pas açılarını görme. Kilit pas ve asist üretimini artırır.',
  'Çeviklik':'Hızlı yön değiştirme ve dengeli hareket. Dar alanda ve kalecilerde çok önemlidir.',
  'Dayanıklılık':'Maç boyunca yüksek tempoyu sürdürme. Düşükse oyuncu çabuk yorulur, son bölümde performans düşer.',
  'Denge':'Temas sırasında ayakta kalma. İkili mücadelelerde topu korumayı sağlar.',
  'Güç':'Fiziksel kuvvet. İkili mücadeleleri, topu saklamayı ve hava toplarını etkiler.',
  'Hız':'Ulaşabildiği en yüksek koşu hızı. Kontra ataklarda ve arkaya koşularda belirleyicidir.',
  'Hızlanma':'Durduğu yerden en yüksek hıza ne kadar çabuk çıktığı. Kısa mesafede rakibi geçmeyi sağlar.',
  'Vücut Zindeliği':'Doğal kondisyon ve sakatlıklardan sonra toparlanma. Maçlar arası yorgunluğu etkiler.',
  'Zıplama':'Havaya yükselme. Kafa toplarında üstünlük sağlar.',
  'Ayakla Oyun':'Kalecinin ayakla pas ve top kontrolü. Geriden oyun kurmada önemlidir.',
  'Bire Bir':'Kaleciyle karşı karşıya kalınan pozisyonlarda kurtarış becerisi.',
  'Eksantriklik':'Kalecinin alışılmadık hareketlere eğilimi (ceza sahası dışına çıkma, top sürme). Yüksekse risk alır.',
  'Elle Oyun':'Topu elinde tutma, sektirmeden yakalama. Düşükse dönen toplar tehlike yaratır.',
  'Hava Hakimiyeti':'Ortalarda ve havadan gelen toplarda alanına hâkim olma.',
  'İletişim':'Savunmayı yönlendirme ve organize etme. Duran toplarda karışıklığı azaltır.',
  'Kaleden Çıkma':'Ortalara ve ara toplara doğru zamanda çıkma kararı.',
  'Refleks':'Yakın mesafeden gelen şutlara tepki hızı. Kurtarışların temelidir.',
  'Topu Oyuna Sokma':'Topu tutunca hızlıca ve isabetli şekilde oyuna sokma (atış ya da vuruşla). Kontra başlatır.',
  'Uzun Atış':'Topu elle uzağa ve isabetli atabilme.',
  'Yumruklama':'Tutması zor topları yumrukla uzaklaştırma eğilimi.'};
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{h=h.replace(/<div class="fmr"><span>([^<]+)<\/span>/g,(m,n)=>{const d=ATTR_DESC[n.trim()];return d?`<div class="fmr" tabindex="0" data-tip="${esc(n.trim()+': '+d)}"><span>${n}</span>`:m;});}catch(e){}return h;})(fmProfHTML);
document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target.closest('.fmr[data-tip]'):null;document.querySelectorAll('.fmr.tip-on').forEach(x=>{if(x!==t)x.classList.remove('tip-on');});if(t)t.classList.toggle('tip-on');});

/* ---------- karşılaştırma: önce kendi oyuncularımız, arama ile herhangi bir oyuncu ---------- */
let CPX={p:null,cid:null,t:null,tid:null,q:''};let CPX_IDX=null;
function cpxIndex(){if(CPX_IDX)return CPX_IDX;const L=[];for(const [id,c] of Object.entries(CLUBS)){const Lg=LEAGUES[c.league];if(!Lg||Lg.hidden)continue;let sq=[];try{sq=baseSquad(id);}catch(e){}
    for(const q of sq)L.push([q.k,q.name,id,normTR(q.name)]);}
  return CPX_IDX=L;}
function normTR(s){return String(s||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ı/g,'i');}
function cpxCid(q){return (G.tx&&G.tx[q.k])||q.home;}
function cpxGet(k,id){let q=null;try{const cid=id||null;if(cid){q=squadOf(cid).find(x=>x.k===k);}if(!q){const b=pByKey(k);if(b){q=squadOf(cpxCid(b)).find(x=>x.k===k)||b;}}}catch(e){}return q;}
function cpxUnknown(q,cid){try{if(cid===G.club)return false;const c=CLUBS[cid];return !!(scOn&&scOn(c)&&scAcc(q)<3);}catch(e){return false;}}
function cpxStats(q,cid){try{return seasonStats(q,cid)||{};}catch(e){return {};}}
function cpxBody(a,ca,b,cb){const A=fmAttrs(a),B=fmAttrs(b),ua=cpxUnknown(a,ca),ub=cpxUnknown(b,cb),C1=CLUBS[ca],C2=CLUBS[cb],Ma=pMetaX(a),Mb=pMetaX(b),Sa=cpxStats(a,ca),Sb=cpxStats(b,cb);
  const card=(q,c,M,S,cls)=>{const pp=pPot(q),L=lookOf(q.k,q.nat,q.age);return `<div class="cpx-card ${cls}"><div class="cpx-face">${faceSVG(L,{c1:c?c.c1:'#334',c2:c?c.c2:'#fff',num:q.num})}</div><div class="cpx-id"><b class="plink" data-act="pcard" data-id="${c?c.id:''}" data-k="${q.k}">${esc(q.name)}</b>
    <small>${c?crestSVG(c,14)+' '+esc(c.name):''}</small><small>${esc(POS_TR[q.pos]||q.pos)} · ${q.age} yaş · ${flagImg(q.nat,'fl-row')} ${esc(natName(q.nat))}</small>
    <div class="cpx-big"><span>Güç <b>${R200(q.ovr)}</b></span><span>Pot <b>${pp[0]===pp[1]?ab200(pp[0]):ab200(pp[0])+'–'+ab200(pp[1])}</b></span></div></div></div>`;};
  const num=(v)=>typeof v==='number'?v:null;
  const row=(l,va,vb,cmpA,cmpB,hi)=>{const x=num(cmpA),y=num(cmpB);const wa=x!=null&&y!=null&&(hi===false?x<y:x>y),wb=x!=null&&y!=null&&(hi===false?y<x:y>x);return `<tr><td class="${wa?'w':''}">${va}</td><th>${l}</th><td class="${wb?'w':''}">${vb}</td></tr>`;};
  const pa=pPot(a),pb=pPot(b),ra=Sa.ap?Sa.rt/Sa.ap:0,rb=Sb.ap?Sb.rt/Sb.ap:0;
  const genRows=[row('Mevcut yetenek',`${R200(a.ovr)}/200`,`${R200(b.ovr)}/200`,a.ovr,b.ovr),row('Potansiyel',`${ab200(pa[0])}${pa[0]!==pa[1]?'–'+ab200(pa[1]):''}`,`${ab200(pb[0])}${pb[0]!==pb[1]?'–'+ab200(pb[1]):''}`,(pa[0]+pa[1])/2,(pb[0]+pb[1])/2),
    row('Yaş',a.age,b.age,a.age,b.age,false),row('Piyasa değeri',eur(pValue(a)),eur(pValue(b)),pValue(a),pValue(b)),row('Maaş (hafta)',eur(pWage(a,ca)),eur(pWage(b,cb)),pWage(a,ca),pWage(b,cb),false),
    row('Sözleşme bitişi',(()=>{try{return ctEnd(a);}catch(e){return '–';}})(),(()=>{try{return ctEnd(b);}catch(e){return '–';}})(),null,null),
    row('Boy',`${Ma.h} cm`,`${Mb.h} cm`,null,null),row('Kilo',`${Ma.w} kg`,`${Mb.w} kg`,null,null),row('Ayak',esc(Ma.ft),esc(Mb.ft),null,null),
    row('Bu sezon maç',Sa.ap||0,Sb.ap||0,Sa.ap||0,Sb.ap||0),row('Gol',Sa.g||0,Sb.g||0,Sa.g||0,Sb.g||0),row('Asist',Sa.a||0,Sb.a||0,Sa.a||0,Sb.a||0),row('Ortalama puan',ra?ra.toFixed(2):'–',rb?rb.toFixed(2):'–',ra||null,rb||null)].join('');
  const both=A.gk&&B.gk,grp=both?[['G','Kalecilik'],['M','Zihinsel'],['P','Fiziksel']]:[['T','Teknik'],['M','Zihinsel'],['P','Fiziksel']];
  const key=CMP_KEY[a.pos]||CMP_KEY.OS;const vOf=(X,n)=>{for(const g of ['T','M','P','G']){const f=(X[g]||[]).find(x=>x[0]===n);if(f)return f[1];}return null;};
  const bar=(n,x,y)=>{const sx=ua?'?':x,sy=ub?'?':y,wa=!ua&&!ub&&x>y,wb=!ua&&!ub&&y>x;return `<div class="cpx-r" ${ATTR_DESC[n]?`data-tip="${esc(n+': '+ATTR_DESC[n])}" tabindex="0"`:''}><b class="${wa?'w':''}">${sx}</b><i class="l"><u style="width:${ua?0:x*5}%"></u></i><span>${esc(n)}</span><i class="r"><u style="width:${ub?0:y*5}%"></u></i><b class="${wb?'w':''}">${sy}</b></div>`;};
  const keyH=key.map(n=>{const x=vOf(A,n),y=vOf(B,n);return x!=null&&y!=null?bar(n,x,y):'';}).join('');
  const avg=L=>L.length?Math.round(L.reduce((s,x)=>s+x[1],0)/L.length*10)/10:0;
  const groups=grp.map(([g,n])=>{const L0=A[g]||[],L1=B[g]||[];const names=L0.map(x=>x[0]).filter(x=>L1.some(y=>y[0]===x));if(!names.length)return '';const x=avg(L0.filter(r=>names.includes(r[0]))),y=avg(L1.filter(r=>names.includes(r[0])));
    return `<div class="cpx-g"><p class="fmp-sec">${n} <small>ort. ${ua?'?':x} · ${ub?'?':y}</small></p>${names.map(nm=>bar(nm,L0.find(r=>r[0]===nm)[1],L1.find(r=>r[0]===nm)[1])).join('')}</div>`;}).join('');
  const d=a.ovr-b.ovr,pd=(pa[0]+pa[1])/2-(pb[0]+pb[1])/2;
  const verdict=ua||ub?'Bir oyuncunun özellikleri tam bilinmiyor; daha çok izlenirse karşılaştırma netleşir.':`${esc(ksur(a.name))} ${Math.abs(d)<=1?'güç olarak '+esc(ksur(b.name))+' ile denk':d>0?'şu an '+esc(ksur(b.name))+'\'dan daha güçlü':'şu an '+esc(ksur(b.name))+'\'ın gerisinde'}${Math.abs(pd)>=3?`; potansiyeli ${pd>0?'daha yüksek':'daha düşük'}`:''}${a.age!==b.age?` (${Math.abs(a.age-b.age)} yaş ${a.age<b.age?'daha genç':'daha yaşlı'})`:''}.`;
  return `<div class="cpx-hd">${card(a,C1,Ma,Sa,'l')}<i class="cpx-vs">vs</i>${card(b,C2,Mb,Sb,'r')}</div><p class="cmp-v">${verdict}</p>
   <div class="cpx-cols"><div><p class="fmp-sec">Genel</p><table class="cpx-t"><tbody>${genRows}</tbody></table>${keyH?`<p class="fmp-sec">Mevkiye göre kritik özellikler · ${esc(POS_TR[a.pos]||'')}</p>${keyH}`:''}</div><div class="cpx-gs">${groups}</div></div>`;}
function cpxPicker(p,cid){const mine=G&&G.club?squadOf(G.club).filter(q=>q.k!==p.k):[];const same=mine.filter(q=>q.pos===p.pos).sort((a,b)=>b.ovr-a.ovr),rest=mine.filter(q=>q.pos!==p.pos).sort((a,b)=>b.ovr-a.ovr);
  const chip=(q,id)=>`<button type="button" class="chip cpx-chip${CPX.t===q.k?' on':''}" data-act="cpxPick" data-k="${q.k}" data-id="${id}"><b>${esc(ksur(q.name))}</b> <small>${q.pos} · ${R200(q.ovr)}</small></button>`;
  return `<div class="cpx-pick"><div class="cpx-s"><input id="cpxQ" type="search" autocomplete="off" placeholder="🔎 Herhangi bir oyuncuyu ara (isim)…" value="${esc(CPX.q||'')}"><div id="cpxRes" class="cpx-res"></div></div>
    ${mine.length?`<p class="cpx-l">Kendi oyuncularımız${G.club===cid?'':` · ${esc(myClub().short)}`}</p><div class="cpx-chips">${same.map(q=>chip(q,G.club)).join('')}${rest.length?`<details class="cpx-more"><summary>Diğer mevkiler (${rest.length})</summary>${rest.map(q=>chip(q,G.club)).join('')}</details>`:''}</div>`:''}</div>`;}
function fmCompareHTML(p,c){if(!G||!p||!c)return '';if(CPX.p!==p.k){CPX={p:p.k,cid:c.id,t:null,tid:null,q:''};}CPX.cid=c.id;
  if(!CPX.t){const mine=G.club?squadOf(G.club).filter(q=>q.k!==p.k):[];const d=mine.filter(q=>q.pos===p.pos).sort((a,b)=>b.ovr-a.ovr)[0]||mine.sort((a,b)=>b.ovr-a.ovr)[0];if(d){CPX.t=d.k;CPX.tid=G.club;}}
  const t=CPX.t?cpxGet(CPX.t,CPX.tid):null;
  return `<section class="fmp-cpx cpx"><p class="fmp-sec">Oyuncu karşılaştırma</p>${cpxPicker(p,c.id)}${t?cpxBody(p,c.id,t,CPX.tid||cpxCid(t)):'<p class="muted">Karşılaştırmak için bir oyuncu seç ya da ara.</p>'}</section>`;}
/* sekme: kendi oyuncularımızda da görünsün */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{if(!G||!c||(opt&&opt.acad))return h;if(h.indexOf('data-k="cp"')<0){const cp=fmCompareHTML(p,c);if(!cp)return h;
    h=h.replace('<button data-act="fmpTab" data-k="po">Pozisyonlar</button>','<button data-act="fmpTab" data-k="po">Pozisyonlar</button><button data-act="fmpTab" data-k="cp">Karşılaştır</button>');const i=h.indexOf('<p class="fmp-sec">');h=i<0?h+cp:h.slice(0,i)+cp+h.slice(i);}}catch(e){console.warn('cpx',e);}return h;})(fmProfHTML);
function cpxRedraw(){const s=document.querySelector('#modalCard .fmp-cpx.cpx');if(!s)return;const p=cpxGet(CPX.p,CPX.cid);const c=CLUBS[CPX.cid];if(!p||!c)return;const tmp=document.createElement('div');tmp.innerHTML=fmCompareHTML(p,c);const n=tmp.firstElementChild;if(n)s.replaceWith(n);
  const q=document.getElementById('cpxQ');if(q&&CPX.q){q.focus();q.setSelectionRange(q.value.length,q.value.length);cpxSearch(CPX.q);}}
ACTX.cpxPick=el=>{CPX.t=el.dataset.k;CPX.tid=el.dataset.id||null;CPX.q='';cpxRedraw();};
function cpxSearch(v){const box=document.getElementById('cpxRes');if(!box)return;const q=normTR(v).trim();CPX.q=v;if(q.length<2){box.innerHTML='';return;}
  const I=cpxIndex(),out=[];for(const r of I){if(r[0]===CPX.p)continue;if(r[3].includes(q)){out.push(r);if(out.length>=40)break;}}
  const rows=out.map(([k,nm,id])=>{const b=cpxGet(k);if(!b)return null;const cid=cpxCid(b),c=CLUBS[cid];return [b,c];}).filter(Boolean).sort((x,y)=>y[0].ovr-x[0].ovr).slice(0,12);
  box.innerHTML=rows.length?rows.map(([b,c])=>`<button type="button" class="cpx-ri" data-act="cpxPick" data-k="${b.k}" data-id="${c?c.id:''}">${c?crestSVG(c,16):''}<b>${esc(b.name)}</b><small>${esc(b.pos)} · ${b.age} · ${c?esc(c.short):''} · ${R200(b.ovr)}</small></button>`).join(''):'<p class="muted" style="margin:6px 0">Oyuncu bulunamadı.</p>';}
let CPX_T=null;document.addEventListener('input',e=>{const t=e.target;if(t&&t.id==='cpxQ'){clearTimeout(CPX_T);const v=t.value;CPX_T=setTimeout(()=>cpxSearch(v),160);}});
/* kadro/transfer ekranındaki ⇄ karşılaştırma penceresi: aynı geniş görünüm */
cmpModal=function(){if(CMPL.length<2)return;const P=CMPL.map(x=>{const q=cpxGet(x.k,x.id);return [q,(q&&cpxCid(q))||x.id];});if(!P[0][0]||!P[1][0])return toast('Oyuncu bulunamadı');
  {const t=document.getElementById('cmpTray');if(t)t.hidden=true;}openModal(`<div class="cmp-m cpx"><h3>Oyuncu karşılaştırma</h3>${cpxBody(P[0][0],P[0][1],P[1][0],P[1][1])}<button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:10px">Kapat</button></div>`);
  const mc=$('#modalCard');if(mc)mc.classList.add('wide');};

/* ---------- gerçekçi istenen bonservis ----------
   Piyasa değeri yalnız başlangıç noktasıdır. Satıcı kulüp; oyuncunun takımı için önemini, mevcut yeteneğini (takım seviyesine göre),
   potansiyelini, güncel formunu, sözleşme süresini, yaşını ve alıcının kim olduğunu birlikte tartar. Çarpanın üst sınırı yoktur denecek kadar geniştir (0,6×–15×). */
function askBreak(p,from){const me=myClub(),c=CLUBS[from]||me,R=squadRoles(from)[p.k]||'Yedek',v=pValue(p),F=[];let m=1;const add=(l,x)=>{if(Math.abs(x-1)>=0.03)F.push([l,x]);m*=x;};
  add(`Takımdaki rolü: ${R}`,{Yıldız:1.9,Kaptan:1.75,'Takım lideri':1.6,'İlk 11':1.45,'Genç yetenek':1.6,Rotasyon:1.1,Yedek:0.9}[R]||1);
  const sq=squadOf(from),rk=sq.filter(q=>q.ovr>p.ovr).length;add(rk===0?'Takımın en iyi oyuncusu':rk<=2?'Takımın en iyi 3 oyuncusundan':'Takımdaki sırası',rk===0?1.25:rk<=2?1.12:rk>=18?0.92:1);
  const rel=p.ovr-(c.str||p.ovr);add('Mevcut yeteneği (takım seviyesine göre)',clamp(Math.exp(rel*0.035),0.8,1.6));
  const pp=pPot(p),pg=Math.max(0,(pp[0]+pp[1])/2-p.ovr);if(p.age<=24&&pg>2)add('Potansiyeli',1+Math.min(1.1,pg*0.045)*(p.age<=21?1:0.6));
  let S={};try{S=seasonStats(p,from)||{};}catch(e){}const ap=S.ap||0;if(ap>=4){const rt=S.rt/ap,ga=((S.g||0)+(S.a||0)*0.6)/ap;let f=1+(rt-6.7)*0.5+(['FW','KN','OS'].includes(p.pos)?Math.min(0.5,ga*0.5):0);add(`Güncel formu (${rt.toFixed(2)} ort.${S.g?`, ${S.g} gol`:''})`,clamp(f,0.75,1.8));}
  let yl=1;try{yl=ctEnd(p)-G.s.year;}catch(e){}add(`Sözleşmesi (${yl<=0?'bu sezon bitiyor':yl+' yıl'})`,yl<=0?0.55:yl===1?0.75:yl===2?1:yl===3?1.15:yl===4?1.3:1.4);
  add('Yaşı',p.age<=21?1.2:p.age<=24?1.1:p.age>=34?0.55:p.age>=32?0.7:p.age>=30?0.85:1);
  if(from===G.club){}else if(c.league===me.league)add('Rakip kulübe satış',1.3);else if(c.str>me.str+4)add('Satıcı kulüp daha büyük, satmaya ihtiyacı yok',1.2);else if(c.str<me.str-10)add('Küçük kulüp, yıldızını bırakmak istemiyor',R==='Yıldız'||rk===0?1.15:0.95);
  const mood=0.9+(hash(from+'ask'+(G.s?G.s.year:0))%36)/100;add('Kulübün pazarlık tavrı',mood);
  m=clamp(m,0.6,15);return {m,F,v,a:rnd5(Math.max(v*m,5000),stepOf(v*m)),R,yl};}
askPrice=(old=>function(p,from){const A=old.apply(this,arguments);try{if(G&&G.s&&from!==G.club){const B=askBreak(p,from);A.base=A.a;A.a=B.a;A.mult=B.m;A.why=B.F;A.v=B.v;
    try{if(A.drb){A.a=Math.round(A.a*DRB_MULT(A.drb)/5e4)*5e4;}}catch(e){}}}catch(e){console.warn('askBreak',e);}return A;})(askPrice);
function askWhyHTML(A){if(!A||!A.why)return '';return `<div class="ask-why"><p class="ng-l">İstenen bedelin gerekçesi <small>piyasa değeri ${eur(A.v)} × ${A.mult.toFixed(2)}</small></p>${A.why.map(([l,x])=>`<div class="aw-r"><span>${esc(l)}</span><b class="${x>=1?'up':'dn'}">×${x.toFixed(2)}</b></div>`).join('')}</div>`;}
/* profilde istenen bedel satırına gerekçe ipucu; pazarlık ekranında gerekçe kutusu */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&c&&c.id!==G.club&&!(opt&&opt.acad)){const A=askPrice(p,c.id);if(A&&A.why){const tip=`Piyasa değeri ${eur(A.v)} × ${A.mult.toFixed(2)} — `+A.why.map(([l,x])=>`${l} ×${x.toFixed(2)}`).join(', ');
    h=h.replace(/(<div class="fmi"><span>(İstenen bonservis|İstenen bedel|Satış bedeli)<\/span>)/,`<div class="fmi" tabindex="0" data-tip="${esc(tip)}"><span>$2</span>`);}}}catch(e){}return h;})(fmProfHTML);
negOpen=(old=>function(){const r=old.apply(this,arguments);try{const n=G.m&&G.m.neg;if(n&&n.type==='tr'&&n.st==='club'){const p=negP();const mc=$('#modalCard');if(p&&mc&&!mc.querySelector('.ask-why')){const A=askPrice(p,n.from);const h=askWhyHTML(A).replace('<div class="ask-why">',`<div class="ask-why"><div class="aw-ask">Kulübün istediği bedel <b>${A.nfs?'Satılık değil · ':''}${eur(n.nfs?n.A*1.5:n.A)}</b></div>`);const at=mc.querySelector('.ng-info');if(at)at.insertAdjacentHTML('afterend',h);}}}catch(e){}return r;})(negOpen);
/* gelen tekliflerde (bizim oyuncumuz): karşı kulübün çıkabileceği tavan da önem ve forma göre artar */
bidInit=(old=>function(b,p,c){const had=!!b.max;const r=old.apply(this,arguments);try{if(!had&&b.max&&p){const B=askBreak(p,G.club);const cap=rnd5(b.fee*clamp(B.m*0.7,1.12,6),stepOf(b.fee));if(cap>b.max)b.max=cap;}}catch(e){}return r;})(bidInit);
/* eski “doğrudan satın al” yolu da pazarlıktan geçsin (değerine anında alım yok) */
buyPlayer=function(id,k){try{if(typeof negStart==='function')return negStart(id,k,'tr');}catch(e){}};

