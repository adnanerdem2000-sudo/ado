/* ================= v147: menajerler — kurgusal menajer ve ajans dünyası, CV profilleri, kapıyı çalan menajerler, iyi ve kötü tavsiyeler =================
   - G.ag: kariyere özel, tohumdan üretilen ~52 hayali menajer (ad, ajans, uyruk, şehir, itibar, gizli dürüstlük, komisyon, uzmanlık, diller, bağlantılar).
   - Müşteriler oyundaki gerçek oyuncu kadrolarından atanır (büyük oyuncu → itibarlı menajer). İlişkiler oyun içi kurgudur; atama bellekte hesaplanır, kayda yazılmaz.
   - Futbolcu kariyerinde menajerler ara sıra kapını çalar: temsil teklifi ya da tavsiye/aracılık (zam, transfer listesi, kulüp ilgisi, sponsorluk, kiralık, serbest kalma).
     İyi menajerin tavsiyesi oyunun gerçek durumuna dayanır ve gerçek teklif/ilgi üretir; kötü menajer ön ödeme alır, sahte ilgi satar, gizli komisyonla zayıf kulübe iter.
   - v45'in menajer altyapısı (G.p.ag, agOf, haftalık komisyon, pazarlık gücü, gizli komisyon skandalı) korunur; yeni menajerler aynı arayüzle ona bağlanır. */
const AG_DISC='Oyun içi kurgu: menajer ve ajanslar hayalidir; müşteri ilişkileri ve aracılık geçmişi kurgudur. Bonservis bedelleri ve kulüpler oyuncuların gerçek kariyer verisinden gelir.';
const AG_SPEC={genc:'Genç yetenekler',tr:'Türkiye pazarı',buyuk:'Büyük transferler',soz:'Sözleşme yenilemeleri'};
const AG_NP={
  TUR:{f:['Selim','Kaan','Murat','Serdar','Tolga','Levent','Cem','Hakan','Volkan','Orhan','Erdal','Taner','Ufuk','Sinan','Gökhan','Bülent','Onur','Yiğit','Tamer','Koray','Ayşe','Zeynep','Defne','Elif','Ece','Barış','Okan','Rıza'],
       l:['Karaduman','Tezcan','Durmaz','Ergün','Kocataş','Soylu','Uysal','Bayrakçı','Ilgaz','Sarıgöl','Ertekin','Gündüz','Altınok','Tekinalp','Yeşilyurt','Önal','Turgut','Demirkol','Ataman','Karaçam','Özyiğit','Sevindik','Kuzucu','Akdoğan','Toprakçı','Erselçuk'],
       c:['İstanbul','İstanbul','İstanbul','Ankara','İzmir','Trabzon','Bursa','Antalya','Samsun','Eskişehir'],lang:['Türkçe'],cont:['sl','l1','l2']},
  POR:{f:['Rui','Nuno','Vasco','Duarte','Tiago','Henrique'],l:['Teixeira Lobo','Carvalhais','Quintela','Arruda','Mourão','Sampaio Reis'],c:['Lizbon','Porto','Braga'],lang:['Portekizce','İspanyolca'],cont:['pt1','ll','br1']},
  ESP:{f:['Iñigo','Álvaro','Gonzalo','Sergio','Nerea'],l:['Larrañaga','Echevarría Soto','Montalbán','Ibarguren','Valcárcel'],c:['Madrid','Barselona','Sevilla','Bilbao'],lang:['İspanyolca'],cont:['ll','es2','ar1']},
  ITA:{f:['Matteo','Lorenzo','Davide','Federico','Chiara'],l:['Bellandi','Cavazzoni','Ferrucci Monti','Zanardelli','Spadaro'],c:['Milano','Roma','Torino','Napoli'],lang:['İtalyanca'],cont:['it1','it2']},
  FRA:{f:['Julien','Mathieu','Thibault','Karim','Élodie'],l:['Marchand-Leroux','Delacourt','Bonnefoy','Hadjadj','Rouvière'],c:['Paris','Lyon','Marsilya','Lille'],lang:['Fransızca'],cont:['fr1','fr2','be1']},
  ENG:{f:['Oliver','Harry','Callum','Graham','Sophie'],l:['Hartwell','Pemberton','Ashcombe','Whitlock','Fairbrother'],c:['Londra','Manchester','Liverpool','Birmingham'],lang:['İngilizce'],cont:['pl','en2','us1']},
  GER:{f:['Tobias','Florian','Matthias','Jonas','Katrin'],l:['Wendland','Brügger','Kaltenbach','Oberhuber','Lindqvist-Haas'],c:['Münih','Berlin','Düsseldorf','Hamburg'],lang:['Almanca'],cont:['de1','de2','at1','ch1']},
  NED:{f:['Joris','Ruud','Sander','Maarten'],l:['van Deyck','Hoogendam','Vreeswijk','ter Brugge'],c:['Amsterdam','Rotterdam','Eindhoven'],lang:['Felemenkçe'],cont:['nl1','be1']},
  BRA:{f:['Thiago','Leandro','Márcio','Renan'],l:['Bortolazzo','Figueiredo Alves','Guimarães Neto','Pimentel'],c:['São Paulo','Rio de Janeiro','Belo Horizonte'],lang:['Portekizce'],cont:['br1','pt1']},
  ARG:{f:['Facundo','Martín','Hernán','Gastón'],l:['Irazoqui','Benedetto Ruiz','Maldonado Paz','Echeverri'],c:['Buenos Aires','Rosario','Córdoba'],lang:['İspanyolca','İtalyanca'],cont:['ar1','ll','mx1']},
  SRB:{f:['Nikola','Dragan','Miloš'],l:['Vujanović','Stanimirović','Radulović'],c:['Belgrad','Novi Sad'],lang:['Sırpça'],cont:['rs1','hr1','gr1']},
  NGA:{f:['Chidi','Emeka','Tunde'],l:['Okonkwo-Bell','Adebayo','Nwachukwu'],c:['Lagos','Abuja'],lang:['İngilizce'],cont:['be1','fr1','pt1']},
  MAR:{f:['Yassine','Hamza','Karim'],l:['El Mansouri','Benjelloun','Tazi'],c:['Kazablanka','Rabat'],lang:['Arapça','Fransızca'],cont:['fr1','be1','sa1']},
  BEL:{f:['Pieter','Arnaud','Wouter'],l:['Vanderstraeten','Dumoulin','Claessens'],c:['Brüksel','Anvers'],lang:['Felemenkçe','Fransızca'],cont:['be1','nl1','fr1']},
};
/* hayali ajans adları (gerçek ajans adlarından kaçınıldı) */
const AG_BIG=['Halcyon Meridyen Football','Northgate Albion Sports','Tejo Azul Futebol Group','Atlas Pusula Global'];
const AG_AGN={TUR:['Anadolu Kartal Futbol Danışmanlık','Boğaz Işığı Spor','Ege Rüzgârı Menajerlik','Kuzey Yıldızı Spor Yönetimi','Altın Krampon Ajans','Mavi Martı Futbol','Kapadokya Yetenek','Haliç Spor Ortaklığı','Toros Futbol Yönetimi','Lale Spor Evi','Karadeniz Dalga Sports','Yıldırım Pas Menajerlik','Gökkuşağı Futbol Ofisi','Marmara Köprü Spor','Çınar Spor Danışmanlık','Kuzguncuk Futbol Ajansı','Pusula Genç Yetenek','Sedef Spor Ortakları','Fener Burnu Danışmanlık','Doruk Futbol Ofisi'],
  POR:['Lusitânia Farol Sports','Douro Prime Futebol'],ESP:['Iberia Faro Deportes','Sierra Alta Fútbol'],ITA:['Laguna Calcio Consulenza','Colle Verde Sport'],FRA:['Seine Lumière Sports','Rhône Avenir Football'],ENG:['Bluewater Crest Football','Kingsmoor Talent'],
  GER:['Rheinbrücke Spielerberatung','Alpenblick Sport'],NED:['Amstelbrug Talent'],BRA:['Copacabana Estrela Futebol'],ARG:['Río de la Plata Pases'],SRB:['Balkan Orbita Sport'],NGA:['Niger Delta Pathway Football'],MAR:['Atlas Sahra Sports'],BEL:['Schelde Brug Sports']};
const AG_BAD_RUM=['Basında: %n hakkında vergi soruşturması iddiaları','Kulis: %n için, genç bir oyuncunun ailesinden “dosya masrafı” adı altında para aldığı konuşuluyor','İddia: eski bir müşterisi, ödenmeyen bonservis payı yüzünden %n hakkında dava açtı','Bir kulüp yöneticisi %n için: “Her transferde masanın altından pay ister.”','İddia: federasyon, %a hakkında lisans incelemesi başlattı','Sosyal medyada %n hakkında: oyuncularını sürekli kulüp değiştirmeye zorladığı yazılıyor'];
const AG_MID_RUM=['Kulis: %n pazarlıkta çok sert; bazı kulüpler masadan kalkmış','Basında: %a yeni ofis açılışında birkaç ünlü yüzü ağırladı','Bir spor yazarı %n için: “Oyuncularını iyi korur ama komisyonu da yüksektir.”'];
const AG_GOOD_RUM=['Basında: %n, müşterilerine ve ailelerine sunduğu destek programıyla övülüyor','Bir eski milli oyuncu %n için: “Bana her zaman doğruyu söyledi, kariyerimi ona borçluyum.”','Kulüp yöneticileri %a için “sözünün eri” diyor','Kulis: %n genç oyuncularını acele ettirmeden doğru adımlara yönlendiriyor'];
const agSc=v=>clamp(20+25*Math.log10(Math.max(v,1e4)/1e5),1,99);
const agStars=r=>{const n=clamp(Math.round(r/20),1,5);return '★'.repeat(n)+'☆'.repeat(5-n);};
function agGen(seed){const r=srng('agw'+seed),ri=(a,b)=>a+Math.floor(r()*(b-a+1)),pk=a=>a[Math.floor(r()*a.length)];
  const tiers=[].concat(Array(6).fill(0),Array(10).fill(1),Array(14).fill(2),Array(22).fill(3)),usedN=new Set(),usedA={},out=[];
  const INT=['POR','ESP','ITA','FRA','ENG','GER','NED','BRA','ARG','SRB','NGA','MAR','BEL'];
  tiers.forEach((t,i)=>{const nat=t===0?(i===5?'TUR':pk(['POR','ENG','ITA','ESP','GER','FRA','BRA','ARG'])):t===1?(r()<0.45?'TUR':pk(INT)):t===2?(r()<0.6?'TUR':pk(INT)):(r()<0.75?'TUR':pk(INT));
    const P=AG_NP[nat];let n;do{n=pk(P.f)+' '+pk(P.l);}while(usedN.has(n));usedN.add(n);
    let ag;if(t===0)ag=AG_BIG[i%AG_BIG.length];else{const L=AG_AGN[nat]||AG_AGN.TUR,fr=L.filter(x=>!usedA[x]);ag=fr.length?pk(fr):pk(L);}usedA[ag]=(usedA[ag]||0)+1;
    const rep=[ri(86,98),ri(70,85),ri(48,69),ri(14,47)][t];
    const shady=t===3?r()<0.42:t===2?r()<0.3:r()<0.25,hon=shady?ri(t===3?6:22,t===3?38:46):ri(55,96);
    const fee=clamp([ri(8,12),ri(7,11),ri(5,10),ri(3,8)][t]+(shady?ri(3,8):0),3,20);
    const yrs=[ri(16,32),ri(10,24),ri(5,18),ri(1,10)][t],age=clamp(25+yrs+ri(0,9),26,72);
    const spec=t===0?pk(['buyuk','buyuk','soz']):nat==='TUR'&&r()<0.55?'tr':t===3?pk(['genc','genc','tr','soz']):pk(['genc','soz','buyuk','tr']);
    const lang=[...P.lang];if(!lang.includes('İngilizce')&&(t<=2||r()<0.4))lang.push('İngilizce');if(t===0&&!lang.includes('İspanyolca'))lang.push('İspanyolca');if(nat==='TUR'&&t<=1&&r()<0.5)lang.push('Almanca');
    const cont=[...P.cont];if(t===0)cont.push(...['pl','ll','it1','de1','fr1'].filter(x=>!cont.includes(x)));else if(t===1)cont.push(pk(['pl','ll','it1','de1','fr1','pt1','nl1']));if(nat!=='TUR'&&t<=2&&r()<0.4)cont.push('sl');
    out.push({id:'m'+(i+1),n,ag,nat,city:pk(P.c),y0:2026-yrs,age,rep,hon,fee,spec,lang:[...new Set(lang)],cont:[...new Set(cont)].filter(x=>LEAGUES[x]),t,cap:[ri(60,105),ri(32,70),ri(14,40),ri(4,20)][t]});});
  return out;}
function agWorld(){if(!G)return null;if(!G.ag||!Array.isArray(G.ag.list)||!G.ag.list.length){const seed=hash(String(G.cid||'')+'|'+String((G.p&&G.p.lic)||'ado'));G.ag={v:1,seed,list:agGen(seed)};}return G.ag;}
const agById=id=>{const A=agWorld();return A?A.list.find(a=>a.id===id)||null:null;};
/* müşteri ataması: gerçek kadrolar (oyun başı değerleriyle) değere göre sıralanır; yıldızların hepsi, kalanların bir kısmı temsil edilir */
let AGC=null;
function agClients(){const A=agWorld();if(!A)return {by:{},cl:{}};if(AGC&&AGC.seed===A.seed)return AGC;
  const all=[];for(const id of Object.keys(SQ_REAL)){const c=CLUBS[id];if(!c||!LEAGUES[c.league])continue;const L=LEAGUES[c.league],tr=(L.cc||'TR')==='TR';
    for(const p of baseSquad(id))all.push({k:p.k,v:pValue({ovr:p.ovr0,age:p.age0}),nat:p.nat,age:p.age0,tr,lg:c.league});}
  all.sort((a,b)=>b.v-a.v);const r=srng('agc'+A.seed),left={},by={},cl={};for(const a of A.list){left[a.id]=a.cap;cl[a.id]=[];}
  all.forEach((x,i)=>{if(!(i<700||hash(x.k+'ag'+A.seed)%100<6))return;const s=agSc(x.v);let tot=0;
    const ws=A.list.map(a=>{if(left[a.id]<=0)return 0;let w=Math.exp(-Math.max(0,s-a.rep)/7-Math.max(0,a.rep-s-12)/9);
      if(a.spec==='tr')w*=(x.tr||x.nat==='TUR')?3:0.5;else if(x.tr&&a.nat!=='TUR')w*=0.7;if(a.spec==='genc'&&x.age<=21)w*=2.2;if(a.spec==='buyuk'&&x.v>=3e7)w*=2;
      if(x.nat===a.nat)w*=2.5;if(a.cont.includes(x.lg))w*=1.5;tot+=w;return w;});
    if(tot<=0)return;let v=r()*tot;for(let j=0;j<ws.length;j++){if((v-=ws[j])<=0){const a=A.list[j];left[a.id]--;by[x.k]=a.id;cl[a.id].push(x.k);break;}}});
  return AGC={seed:A.seed,by,cl};}
const agBaseKey=k=>String(k||'').replace(/~\d+$/,'');
function agOfPlayer(k){if(!k||k==='ME')return null;const C=agClients();return agById(C.by[k])||null;}
/* müşteri listesi: güncel kulüp, yaş ve değerle (emekli olanlar düşer) */
function agClientList(a){const C=agClients(),out=[];for(const k of C.cl[a.id]||[]){let p=null;try{p=pByKey(k);}catch(e){}if(!p||p.alive===false)continue;const club=(G.tx&&G.tx[k])||p.home;if(!CLUBS[club])continue;out.push({k,name:p.name,age:p.age,ovr:p.ovr,pos:p.pos,nat:p.nat,club,home:p.home,v:pValue(p)});}
  return out.sort((x,y)=>y.v-x.v);}
/* gerçek bonservisli transferler (FotMob/SofaScore verisi) — müşterinin kariyerinden */
function agDeals(list){const out=[];if(typeof fmkRec!=='function'||!FMK.ready)return out;for(const x of list){let R=null;try{R=fmkRec({k:x.k,name:x.name,home:x.home});}catch(e){}if(!R)continue;
    for(const m of R.mv)if(m.tp==='T'&&m.fee&&m.y>=2019){const f=fmkClub(m.f),t=fmkClub(m.t);out.push({n:x.name,k:x.k,club:x.club,y:m.y,fee:m.fee,from:f,to:t});}}
  return out.sort((a,b)=>b.fee-a.fee);}
const agCName=id=>{const c=(typeof clubObj==='function'&&clubObj(id))||CLUBS[id]||(typeof EXT!=='undefined'&&EXT[id]);return c?c.name:'?';};

/* ---------- oyuncunun menajer kaydı ---------- */
function agx(){const p=G.p;p.agx=p.agx||{next:0,adv:0,h:{},k:{},last:{},n:0};return p.agx;}
function agHist(id,t){const X=agx();(X.h[id]=X.h[id]||[]).unshift({w:when(),t});if(X.h[id].length>12)X.h[id].length=12;}
function agKnow(id,v){const X=agx();X.k[id]=clamp((X.k[id]||0)+v,0,3);}
const agMine=()=>{const p=G&&G.p;return p&&p.ag&&/^m\d+$/.test(p.ag.id)?agById(p.ag.id):null;};
/* v45 arayüzüne bağla: komisyon, pazarlık gücü, bağlantı ve dürüstlük */
agOf=(old=>function(){const a=agMine();if(a){const p=G.p;return {id:a.id,n:a.n,d:a.ag,com:(p.ag.com!=null?p.ag.com:a.fee)/100,pow:0.03+a.rep*0.0028,net:p.ag.gone?0:a.rep/50,hon:a.hon/100,fame:0,mine:1};}return old.apply(this,arguments);})(agOf);
function agMeScore(){let mv=0;try{mv=marketValue();}catch(e){}return clamp(agSc(mv)+G.p.fame*0.12,1,99);}
const agWin=()=>G.phase==='season'&&G.s&&G.s.win&&G.s.day>=G.s.win.open&&G.s.day<G.s.win.close;
function agPen(){const p=G.p;if(!p.ag||p.ag.rev)return 0;if(!/^m\d+$/.test(p.ag.id))return absDay()-p.ag.since<365&&p.ag.id!=='aile'?G.contract.wage*4:0;
  const left=Math.max(0,(p.ag.until||0)-absDay());return Math.round(Math.max(G.contract.wage*4,E2U(1000))*Math.min(3,left/365)/50)*50;}
function agTrustTxt(a){const k=agx().k[a.id]||0,h=a.hon;
  if(k>=3)return [h>=70?'Güvenilir':h>=45?'Kendi çıkarını da kollar':'Güvenilmez',h>=70?'good':h>=45?'warn':'red',`Kendi deneyimin: ${h}/100`];
  const est=clamp(h+((hash(a.id+'e')%31)-15)*(k?0.4:1),0,100);
  return [k?'Fikir oluşuyor':'Bilinmiyor',k?(est>=65?'good':est>=40?'':'red'):'',est>=65?'Söylentiler olumlu':est>=40?'Söylentiler karışık':'Söylentiler olumsuz'];}
function agRumours(a){const L=a.hon<40?AG_BAD_RUM:a.hon<62?AG_MID_RUM:AG_GOOD_RUM,n=a.rep>=60||a.hon<30?2:1,out=[];for(let i=0;i<n;i++){const t=L[(hash(a.id+'r'+i)+i)%L.length];if(!out.includes(t))out.push(t);}
  if(a.hon<40&&a.rep>=70&&!out.includes(AG_BAD_RUM[0]))out[0]=AG_BAD_RUM[0];return out.map(t=>t.replace(/%n/g,a.n).replace(/%a/g,a.ag));}
function agFace(a,sz){let L=null;try{L=lookOf('ag'+a.id,a.nat,a.age,true);}catch(e){}return `<span class="ag-face" style="width:${sz}px;height:${sz}px">${L?faceSVG(L,{coach:true,c1:a.hon<40?'#7a1f1f':'#1f3a68',age:a.age}):''}</span>`;}

/* ---------- CV profili ---------- */
const AGV={q:'',sort:'rep',all:0,cv:null};
function agProfile(id){const a=agById(id);if(!a)return;AGV.cv=id;const cl=agClientList(a),tv=cl.reduce((s,x)=>s+x.v,0),top=cl.slice(0,3),dl=agDeals(cl.slice(0,40)),mine=agMine()&&agMine().id===a.id;
  const [tt,tc,ts]=agTrustTxt(a),h=isPl()&&G.p.agx?(G.p.agx.h[a.id]||[]):[],me=isPl()?agMeScore():0,want=a.rep<=me+22;
  const rows=(AGV.all?cl:cl.slice(0,20)).map(x=>`<button class="ag-cl" data-act="pcard" data-id="${x.club}" data-k="${x.k}"><span>${flagImg(x.nat,'fl-row')}</span><b>${esc(x.name)}</b><small>${esc(POS_TR[x.pos]||x.pos)} · ${x.age} · ${esc((CLUBS[x.club]||{}).short||'')}</small><em>${eur(x.v)}</em></button>`).join('');
  const terms=isPl()&&G.mode!=='mgr'?(mine?`<p class="muted">Sözleşmen: komisyon %${G.p.ag.com!=null?G.p.ag.com:a.fee}${G.p.ag.until?` · bitiş ${Math.max(0,Math.ceil((G.p.ag.until-absDay())/30))} ay sonra`:''} · erken fesih bedeli ${agPen()?money(agPen()):'yok'}</p><div class="offer-btns"><button class="btn" data-act="agFire">Yollarını ayır${agPen()?' · '+money(agPen()):''}</button></div>`
      :`<div class="offer-btns"><button class="btn" data-act="agAsk" data-id="${a.id}" ${want?'':'disabled'}>${want?'Temsil görüşmesi iste':'Seninle henüz ilgilenmiyor'}</button></div>`):'';
  openModal(`<div class="ag-cv"><header class="ag-hd">${agFace(a,84)}<div><span class="kicker">${flagImg(a.nat,'fl-row')} ${esc(a.city)} · ${esc(a.ag)}</span><h3>${esc(a.n)}</h3><div class="ag-st" title="İtibar ${a.rep}/100">${agStars(a.rep)} <small>itibar ${a.rep}</small></div>${mine?'<span class="pill good">Menajerin</span>':''}</div></header>
  <dl class="offer-terms ag-dl"><div><dt>Deneyim</dt><dd>${2026-a.y0+(G.s?G.s.year-2026:0)} yıl (${a.y0}’ten beri)</dd></div><div><dt>Uzmanlık</dt><dd>${AG_SPEC[a.spec]}</dd></div><div><dt>Komisyon</dt><dd>%${a.fee}</dd></div><div><dt>Güven</dt><dd><span class="pill ${tc}">${tt}</span> <small>${esc(ts)}</small></dd></div><div><dt>Diller</dt><dd>${a.lang.map(esc).join(', ')}</dd></div><div><dt>Bağlantılar</dt><dd>${a.cont.map(x=>esc(LEAGUES[x].name)).join(', ')}</dd></div></dl>
  <div class="strip ag-strip"><div><b>${cl.length}</b><span>Müşteri</span></div><div><b>${eur(tv)}</b><span>Toplam değer</span></div><div><b>${dl.length}</b><span>Bonservisli transfer*</span></div><div><b>${dl.length?eur(dl[0].fee):'—'}</b><span>En büyük</span></div></div>
  ${top.length?`<p class="ag-top">Müşterileri arasında: ${top.map(x=>`<button class="lnk" data-act="pcard" data-id="${x.club}" data-k="${x.k}">${esc(x.name)}</button>`).join(', ')}</p>`:''}
  ${dl.length?`<p class="sub-h"><span>Müşterilerinin büyük transferleri*</span></p><ul class="ag-deals">${dl.slice(0,4).map(d=>`<li><b>${esc(d.n)}</b> ${esc(agCName(d.from))} → ${esc(agCName(d.to))} <em>${eur(d.fee)} · ${d.y}</em></li>`).join('')}</ul>`:''}
  <p class="sub-h"><span>Basında ve kulislerde</span></p><ul class="ag-rum">${agRumours(a).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
  ${isPl()?`<p class="sub-h"><span>Seninle geçmişi</span></p>${h.length?`<ul class="ag-his">${h.map(x=>`<li><small>${esc(x.w)}</small> ${esc(x.t)}</li>`).join('')}</ul>`:'<p class="muted">Henüz bir temasınız olmadı.</p>'}`:''}
  ${terms}
  <p class="sub-h"><span>Müşteri listesi</span><span>${cl.length}</span></p><div class="ag-cls">${rows||'<p class="muted">Kayıtlı müşterisi yok.</p>'}</div>${cl.length>20?`<button class="btn ghost" data-act="agAll">${AGV.all?'Daha az göster':'Tümünü göster ('+cl.length+')'}</button>`:''}
  <p class="ag-disc">${esc(AG_DISC)} *Müşterilerin 2019’dan bu yana gerçekleşen bonservisli transferleri.</p>
  <div class="offer-btns"><button class="btn" data-act="agListGo">Menajerler</button><button class="btn ghost" data-act="closeModal">Kapat</button></div></div>`);
  try{$('#modalCard').scrollTop=0;}catch(e){}}
ACTX.agCV=el=>agProfile(el.dataset.id);
ACTX.agAll=()=>{AGV.all=AGV.all?0:1;if(AGV.cv)agProfile(AGV.cv);};
ACTX.agListGo=()=>{closeModal();TAB=isPl()&&G.s?'agent':TAB;if(!isPl())return agListModal();render();window.scrollTo(0,0);};
function agListModal(){openModal(`<h3>Menajerler</h3>${agListPanel()}<button class="btn ghost" data-act="closeModal">Kapat</button>`);}
function agListRows(){const A=agWorld(),C=agClients(),q=AGV.q.trim().toLocaleLowerCase('tr-TR');let L=A.list.slice();
  if(q)L=L.filter(a=>(a.n+' '+a.ag+' '+a.city).toLocaleLowerCase('tr-TR').includes(q)||(C.cl[a.id]||[]).some(k=>{const p=pRaw(k);return p&&String(p.name).toLocaleLowerCase('tr-TR').includes(q);}));
  const n=a=>(C.cl[a.id]||[]).length,S={rep:(x,y)=>y.rep-x.rep,mus:(x,y)=>n(y)-n(x),kom:(x,y)=>x.fee-y.fee,ad:(x,y)=>x.n.localeCompare(y.n,'tr')}[AGV.sort]||((x,y)=>y.rep-x.rep);L.sort(S);const mid=agMine()&&agMine().id;
  return L.map(a=>`<button class="ag-row${a.id===mid?' me':''}" data-act="agCV" data-id="${a.id}">${agFace(a,40)}<div><b>${esc(a.n)}</b><small>${esc(a.ag)} · ${esc(AG_SPEC[a.spec])}</small></div><span class="ag-rs"><i>${agStars(a.rep)}</i><small>${n(a)} müşteri · %${a.fee}</small></span></button>`).join('')||'<p class="muted">Sonuç yok.</p>';}
function agListPanel(){return `<section class="panel ag-list"><p class="sub-h"><span>Menajerler</span><span>${agWorld().list.length}</span></p><input id="agQ" class="ag-q" type="search" placeholder="Menajer, ajans ya da oyuncu ara" value="${esc(AGV.q)}" autocomplete="off">
  <div class="seg ag-sort">${[['rep','İtibar'],['mus','Müşteri'],['kom','Komisyon'],['ad','Ad']].map(([k,l])=>`<button class="chip" data-act="agSort" data-k="${k}" aria-pressed="${AGV.sort===k}">${l}</button>`).join('')}</div><div id="agList" class="ag-rows">${agListRows()}</div><p class="ag-disc">${esc(AG_DISC)}</p></section>`;}
ACTX.agSort=el=>{AGV.sort=el.dataset.k;const b=$('#agList');if(b){b.innerHTML=agListRows();document.querySelectorAll('.ag-sort .chip').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.k===AGV.sort)));}else render();};
document.addEventListener('input',e=>{try{if(e.target&&e.target.id==='agQ'){AGV.q=e.target.value;const b=$('#agList');if(b)b.innerHTML=agListRows();}}catch(_){}});
/* Menajer ve sponsorlar ekranı: eski 6 ajans listesi yerine menajerin + aranabilir menajer rehberi */
viewAgent=(old=>function(){let h=old.apply(this,arguments);try{agWorld();const i=h.indexOf('<section class="panel"><p class="sub-h"><span>Ajanslar</span>'),j=i<0?-1:h.indexOf('</section>',i);
  const a=agMine(),cur=a?`<section class="panel ag-cur"><p class="sub-h"><span>Menajerin</span>${a?`<span>%${G.p.ag.com!=null?G.p.ag.com:a.fee} komisyon</span>`:''}</p><button class="ag-row me" data-act="agCV" data-id="${a.id}">${agFace(a,48)}<div><b>${esc(a.n)}</b><small>${esc(a.ag)}</small></div><span class="ag-rs"><i>${agStars(a.rep)}</i><small>CV’yi aç</small></span></button>${G.p.ag.rev?'<p class="muted"><b>Gizli komisyon ortaya çıktı; bedelsiz ayrılabilirsin.</b></p>':''}<div class="offer-btns"><button class="btn" data-act="agFire">Yollarını ayır${agPen()?' · '+money(agPen()):''}</button></div></section>`
    :`<section class="panel ag-cur"><p class="sub-h"><span>Menajerin</span></p><p class="muted">${G.p.ag&&G.p.ag.id&&G.p.ag.id!=='aile'?esc((agOf()||{}).n||'')+' ile çalışıyorsun. ':'Şu an menajerin yok. '}Şöhretin ve piyasa değerin arttıkça daha itibarlı menajerler kapını çalar. Her teklif iyi niyetli değildir: CV’ye, komisyona ve söylentilere bak.</p>${G.p.ag&&G.p.ag.id&&G.p.ag.id!=='aile'?`<div class="offer-btns"><button class="btn" data-act="agFire">Yollarını ayır${agPen()?' · '+money(agPen()):''}</button></div>`:''}</section>`;
  const blk=cur+agListPanel();h=i>=0&&j>=0?h.slice(0,i)+blk+h.slice(j+10):h+blk;}catch(e){console.warn('menajer',e);}return h;})(viewAgent);

/* oyuncu profili: v41'in "Menajer" satırı ve TD pazarlıklarındaki menajer bu dünyadan gelir; ad CV'ye bağlanır */
agentOf=(old=>function(p){try{const a=p&&agOfPlayer(p.k);if(a){const g=clamp(0.75+(a.fee-3)/17*0.5+(a.hon<40?0.2:0),0.75,1.45);return {n:a.n,a:a.ag,g,gr:g>1.25?'Çok açgözlü':g>1.05?'Pazarlıkçı':'Makul',id:a.id};}}catch(e){}return old.apply(this,arguments);})(agentOf);
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const a=p&&p.k&&!(opt&&opt.acad)&&agOfPlayer(p.k);
  if(a)h=h.replace(`<div class="fmi"><span>Menajer</span><b>${esc(a.n)}`,`<div class="fmi ag-fmi"><span>Menajeri</span><b><button class="lnk" data-act="agCV" data-id="${a.id}">${esc(a.n)}</button> ${agStars(a.rep).replace(/☆/g,'')}`);}catch(e){}return h;})(fmProfHTML);

/* ---------- tavsiyelerin gerçek duruma göre doğruluğu ---------- */
function agFitClub(better){const cur=myClub(),ct=LEAGUES[cur.league].tier,eff=effRating(),age=G.p.age;
  const C=Object.values(CLUBS).filter(c=>c.id!==G.club&&!(cur.parent&&c.id===cur.parent)&&LEAGUES[c.league]&&!LEAGUES[c.league].youth&&eligible(LEAGUES[c.league],age)).map(c=>({c,m:eff-clubNeed(c),tier:LEAGUES[c.league].tier}));
  const L=better?C.filter(x=>x.tier>=ct&&x.c.str>cur.str&&x.m>=-3&&x.m<=7):C.filter(x=>x.tier<=ct&&x.c.str<cur.str-3&&x.m>4);
  L.sort((a,b)=>Math.abs(a.m-2)-Math.abs(b.m-2));return L.length?pick(L.slice(0,6)):null;}
function agJust(kind){const p=G.p,st=G.s.stats,L=curLeague(),cur=myClub(),wk=Math.max(1,G.s.week-1),avg=seasonAvg(),eff=effRating(),m=eff-clubNeed(cur);
  const openRenew=G.inbox.some(x=>x.offer&&x.offer.status==='open'&&x.offer.renew);
  switch(kind){
    case 'raise':{if(L.youth||openRenew||G.contract.years<1||(G.p.agx&&G.p.agx.rz&&absDay()-G.p.agx.rz<150))return false;let est=0;try{const o=makeOffer(cur,m,'mid',G.contract.role,false);est=o.wage;}catch(e){}return st.apps>=5&&avg>=7.0&&p.trust>=55&&(est>G.contract.wage*1.05||avg>=7.3);}
    case 'list':return !L.youth&&p.age>=18&&(p.trust<42||(st.apps<wk*0.3&&wk>=5)||m>7);
    case 'club':return !!agFitClub(true);
    case 'spon':{if(typeof SPN==='undefined')return false;const im=imInit();return SPN.some(s=>p.fame>=s[3]&&im.v>=s[5]&&!im.deals.some(d=>d.id===s[0])&&!im.offers.some(o=>o.id===s[0]))&&im.deals.length<3;}
    case 'loan':return !L.youth&&p.age<=23&&!G.loan&&wk>=4&&st.apps<wk*0.35;
    case 'free':return !L.youth&&G.contract.years<=1&&p.age>=19&&m>=4;}
  return false;}
const AG_KINDS=['raise','list','club','spon','loan','free'];
const AG_TXT={
  raise:['Maaşına zam iste','“Sahadaki katkın maaşına yansımıyor. Kulübünle masaya oturup sözleşmeni yenilemeyi istememiz lazım.”'],
  list:['Kulübünü transfer listesine koydur','“Bu kulüpte zamanını harcıyorsun. Yönetime git, transfer listesine konmak istediğini söyle; gerisini ben hallederim.”'],
  club:['Kulüp ilgisi: görüşelim','“%c seninle ilgileniyor. İzin verirsen yöneticileriyle görüşürüm.”'],
  spon:['Sponsorluk anlaşması','“Bir marka seninle reklam anlaşması yapmak istiyor. Masaya ben otururum.”'],
  loan:['Kiralık git, süre al','“Bu yaşta kulübede oturmak gelişimini durdurur. Ara transfer döneminde kiralık gidip düzenli oynamalısın.”'],
  free:['Sözleşmeni uzatma, serbest kal','“Sözleşmen bitiyor. Uzatma; sezon sonunda serbest kalırsan imza parası çok daha yüksek olur, kulüpler sıraya girer.”']};
function agFeeUp(a,mul){return Math.round(Math.max(E2U(400),G.contract.wage*mul)*(1+a.rep/120)/50)*50;}

/* ---------- yaklaşım ve tavsiye üretimi ---------- */
function agOpenMsg(){return G.inbox.some(m=>m.t==='menajer'&&m.ev&&!m.ev.done);}
function agPickApproacher(){const A=agWorld(),me=agMeScore(),X=agx(),mid=agMine()&&agMine().id,inTR=(curLeague().cc||'TR')==='TR',d=absDay();
  const ws=A.list.map(a=>{if(a.id===mid||(X.last[a.id]&&d-X.last[a.id]<150))return 0;let w=Math.exp(-Math.max(0,a.rep-(me+12))/5)*(a.rep<me-35?0.25:1)*(a.hon<45&&me<45?1.7:1)*(a.spec==='genc'&&G.p.age<=20?1.6:1)*(a.spec==='tr'&&inTR?1.5:1)*(a.nat==='TUR'&&inTR?1.3:1);return w;});
  const tot=ws.reduce((s,w)=>s+w,0);if(tot<=0)return null;let v=Math.random()*tot;for(let i=0;i<ws.length;i++)if((v-=ws[i])<=0)return A.list[i];return null;}
function agSend(a,kind,opt){opt=opt||{};const p=G.p,X=agx(),mine=agMine()&&agMine().id===a.id,pitch=!mine&&kind!=='rep',good=a.hon>=50,d={a:a.id,kind,pitch,exp:absDay()+(good?14:3)};X.last[a.id]=absDay();X.n++;
  let title,body;
  if(kind==='rep'){d.fee=clamp(a.fee+(a.hon<40?rint(0,3):0),3,22);d.yrs=a.hon<40?3:rint(1,3);d.up=a.hon<40&&Math.random()<0.75?agFeeUp(a,rint(2,4)):0;d.bonus=a.hon>=60&&a.rep>=75?Math.round(G.contract.wage*2/50)*50:0;
    title=`${a.n} seni temsil etmek istiyor`;
    body=a.hon<40?`${a.n} (${a.ag}) aradı: “Seni ${pick(['Avrupa’nın büyük kulüplerine','Premier Lig’e','Süper Lig’in devlerine'])} götürürüm, bana güven. Ama bu fırsat beklemez: bugün imzalarsan işlemleri hemen başlatırım.” Teklif: %${d.fee} komisyon, ${d.yrs} yıllık temsil sözleşmesi${d.up?`, ${money(d.up)} “dosya ve tanıtım masrafı” ön ödemesi`:''}. Yanıt için 3 gün var.`
      :`${a.n} (${a.ag}, ${a.city}) seninle tanışmak istiyor: “Maçlarını izliyorum. ${AG_SPEC[a.spec]} alanında çalışıyorum; acele etmeden doğru adımları birlikte atabiliriz.” Teklif: %${d.fee} komisyon, ${d.yrs} yıllık temsil${d.bonus?`, imzada ${money(d.bonus)} jest`:''}. Müşteri listesine ve geçmişine bakabilirsin.`;}
  else{const just=agJust(kind);d.just=just;
    if(kind==='club'){let c=null;if(good&&just){c=agFitClub(true);d.real=1;}else if(!good){if(Math.random()<0.5){c=agFitClub(false);d.kick=1;}if(!c){const big=Object.values(CLUBS).filter(x=>LEAGUES[x.league]&&!LEAGUES[x.league].youth&&LEAGUES[x.league].tier>=curLeague().tier+2);c=big.length?{c:pick(big)}:null;d.fake=1;d.kick=0;}}
      if(!c)return false;d.c=c.c.id;}
    if(pitch||(!good&&['club','spon','list'].includes(kind)))d.fee=good?0:agFeeUp(a,kind==='club'?rint(1,3):rint(2,4));
    if(pitch&&good)d.succ=a.fee;
    const [t0,q]=AG_TXT[kind];title=`${mine?'Menajerin':a.n}: ${t0}`;
    body=`${a.n} (${a.ag}) ${mine?'arıyor':'kapını çaldı'}: ${q.replace('%c',d.c?CLUBS[d.c].name:'Bir kulüp')}${d.fee?` İşe başlamak için ${money(d.fee)} ${kind==='club'?'görüşme ve seyahat masrafı':'ön ödeme'} istiyor.`:''}${d.succ?` Karşılığında yalnız iş olursa %${d.succ} başarı ücreti alır.`:''}${good?'':' “Kararını bugün ver, yarın geç olabilir.”'}`;}
  msg('menajer',title,body,{ev:{id:kind==='rep'?'ag_rep':'ag_act',d,done:false,res:''},ag:a.id});agHist(a.id,kind==='rep'?'Temsil teklifi gönderdi':'Tavsiye: '+AG_TXT[kind][0]);return true;}
function agApproach(force){const p=G.p;if(!force&&(agOpenMsg()||p.age<15))return false;const a=force&&force.a?agById(force.a):agPickApproacher();if(!a)return false;
  let kind=force&&force.kind;if(!kind){const hasAg=p.ag&&p.ag.id&&p.ag.id!=='aile';kind=Math.random()<(hasAg?0.35:0.7)?'rep':null;
    if(!kind){const js=AG_KINDS.filter(k=>agJust(k));kind=a.hon>=50?(js.length?pick(js):'rep'):pick(Math.random()<0.6?['raise','list','club','spon']:(js.length?js:['club']));}}
  return agSend(a,kind);}
function agAdvise(){const a=agMine();if(!a||G.p.ag.gone||agOpenMsg())return false;const js=AG_KINDS.filter(k=>agJust(k));let kind;
  if(a.hon>=50){if(!js.length){if(Math.random()<0.5)msg('menajer',`Menajerin ${a.n}: durum değerlendirmesi`,`“Şu an acele edecek bir şey yok. Sahada ortalamanı yükselt, antrenmanda hocanın güvenini kazan; ilgi kendiliğinden gelir. Bir fırsat çıkarsa ilk ben ararım.”`,{ag:a.id});return false;}kind=pick(js);}
  else kind=Math.random()<0.6?pick(['raise','list','club','loan','free']):(js.length?pick(js):'club');
  return agSend(a,kind);}
/* ---------- kararlar ---------- */
function agPay(amt){if(!amt)return true;if(G.p.money<amt)return false;G.p.money-=amt;return true;}
function agRunHire(d){const a=agById(d.a),p=G.p;if(!a)return 'Menajere ulaşılamadı.';
  const pen=p.ag&&p.ag.id&&p.ag.id!=='aile'&&p.ag.id!==a.id?agPen():0;if(pen+(d.up||0)>p.money)return `Paran yetmiyor (gereken ${money(pen+(d.up||0))}).`;
  if(p.ag&&p.ag.id&&p.ag.id!=='aile'){const o=agOf();if(o&&/^m\d+$/.test(o.id))agHist(o.id,'Yollar ayrıldı'+(pen?` · fesih bedeli ${money(pen)}`:''));}
  p.money-=pen+(d.up||0);p.money+=d.bonus||0;p.ag={id:a.id,since:absDay(),until:absDay()+d.yrs*365,com:d.fee};agKnow(a.id,1);
  agHist(a.id,`Temsil sözleşmesi imzalandı (%${d.fee}, ${d.yrs} yıl)${d.up?` · ön ödeme ${money(d.up)}`:''}`);
  if(d.up&&a.hon<40)p.agx.sc={a:a.id,at:absDay()+rint(20,50),amt:d.up};
  return `${a.n} artık menajerin.${pen?` Eski menajerine ${money(pen)} fesih bedeli ödendi.`:''}${d.up?` ${money(d.up)} ön ödeme yapıldı.`:''}${d.bonus?` İmza jesti ${money(d.bonus)} hesabına yattı.`:''}`;}
function agPushOffer(o,a,d){o.agExp=absDay()+14;if(d&&d.succ)o.agf={a:a.id,pct:d.succ};if(d&&d.kick)o.agKick=a.id;pushOffer(o);}
function agRunAct(d){const a=agById(d.a),p=G.p,cur=myClub();if(!a)return 'Menajere ulaşılamadı.';const good=a.hon>=50,just=agJust(d.kind);let fee='';
  if(d.fee){if(!agPay(d.fee))return `${money(d.fee)} ödemeye paran yetmiyor.`;fee=` ${money(d.fee)} ödedin.`;}
  const hist=t=>{agHist(a.id,t);agKnow(a.id,1);};let res='';
  switch(d.kind){
    case 'raise':if(just){const o=makeOffer(cur,effRating()-clubNeed(cur),'mid',G.contract.role,true);o.wage=Math.max(o.wage,Math.round(G.contract.wage*(1.12+clamp(seasonAvg()-7,0,1)*0.25)/50)*50);o.years=Math.max(G.contract.years,rint(2,4));agx().rz=absDay();agPushOffer(o,a,d);res=`${cur.name} yönetimi görüşmeyi kabul etti: masada ${money(o.wage)}/hafta yeni sözleşme teklifi var (gelen kutusu).`;hist('Zam görüşmesi: kulüp yeni sözleşme teklif etti');}
      else{bump('trust',-6);bump('morale',-4);msg('board','Zam talebine ret',`${cur.name} yönetimi: “Bu performansla zam talebi ciddiye alınamaz. Önce sahada göster.” Hocan da talebin zamanlamasından hoşlanmadı.`);agx().rz=absDay();res='Yönetim zam talebini sert karşıladı (güven −6, moral −4).';hist('Zam talebi reddedildi: tavsiye yanlış zamandaydı');agKnow(a.id,1);}break;
    case 'list':if(just){const cs=[agFitClub(true),agFitClub(true)].filter(Boolean);for(const x of cs){const w=G.watch[x.c.id]=G.watch[x.c.id]||{i:0,lv:0};w.i=clamp(w.i+22,0,100);w.lv=WLV.filter(t=>w.i>=t).length;}bump('trust',-3);
        if(agWin()&&cs[0]){const o=makeOffer(cs[0].c,cs[0].m,'mid');agPushOffer(o,a,d);}res=`Transfer listesine kondun. ${cs.length?cs.map(x=>x.c.name).join(' ve ')+' ilgisini artırdı.':''}${agWin()&&cs[0]?' Bir teklif masada.':' Teklifler transfer döneminde gelecek.'}`;hist('Transfer listesi: kulüpler ilgilendi');}
      else{bump('trust',-10);bump('morale',-5);try{imHit(3);}catch(e){}msg('coach','Transfer listesi talebi',`Hoca: “Takımda yerin varken neden gitmek istiyorsun? Bu talep soyunma odasında iyi karşılanmadı.”`);res='Kulüp talebini kabul etmedi; hocanın ve takımın güveni sarsıldı (güven −10).';hist('Transfer listesi talebi ters tepti');}break;
    case 'club':{const c=CLUBS[d.c];if(!c){res='Kulüp bulunamadı.';break;}
      if(d.fake){res=`${c.name} cephesinden hiçbir ses çıkmadı.${fee?' Ödediğin masraf geri gelmeyecek.':''}`;hist(`${c.name} ilgisi asılsız çıktı`+(d.fee?` · ${money(d.fee)} kayıp`:''));agKnow(a.id,2);
        msg('gundem',`Kulis: ${c.name} haberi yalanlandı`,`${c.name} kaynakları, ${meN()} ile ilgili hiçbir temas olmadığını söyledi.`);}
      else{const w=G.watch[c.id]=G.watch[c.id]||{i:0,lv:0};w.i=clamp(w.i+(d.kick?30:25),0,100);w.lv=WLV.filter(t=>w.i>=t).length;const m=effRating()-clubNeed(c);
        if(agWin()&&(m>-3||d.kick)){const o=makeOffer(c,Math.max(m,0),'mid');if(d.kick)o.bonus=Math.round((o.bonus||G.contract.wage*4)*1.6/100)*100;agPushOffer(o,a,d);res=`${c.name} ile görüşüldü: resmi teklif masada (gelen kutusu).`;}
        else res=`${c.name} yöneticileriyle görüşüldü; seni yakın takibe aldılar. Teklif transfer döneminde gelebilir.`;hist(`${c.name} ile görüşme ayarladı`);}
      break;}
    case 'spon':if(good&&just){const im=imInit(),el=SPN.filter(s=>p.fame>=s[3]&&im.v>=s[5]&&!im.deals.some(x=>x.id===s[0])&&!im.offers.some(o=>o.id===s[0]));const s=el[el.length-1];const o={id:s[0],pay:spnPay(s),w:rint(1,3)*52,until:absDay()+28};if(d.succ)o.agf={a:a.id,pct:d.succ};im.offers.push(o);
        msg('offer',`Sponsorluk teklifi: ${s[1]}`,`${a.n} aracılığıyla ${s[1]} (${s[2]}) haftalık ${money(o.pay)} karşılığında ${o.w/52} yıllık reklam yüzü olmanı istiyor. Kariyer › Menajer ve sponsorlar ekranından yanıtla.`);res=`${s[1]} resmi teklif gönderdi (Menajer ve sponsorlar ekranı).`;hist(`${s[1]} sponsorluğunu getirdi`);}
      else{res='Aylar geçti, söz verilen sponsor hiç ortaya çıkmadı.';hist('Sponsorluk vaadi boş çıktı'+(d.fee?` · ${money(d.fee)} kayıp`:''));agKnow(a.id,2);}break;
    case 'loan':if(just){G.wantLoan=true;if(agWin()&&typeof genLoanOffers==='function')genLoanOffers();res=agWin()?'Kiralık teklifleri gelen kutunda.':'Kulübün kiralık gitmene sıcak bakıyor; ara transfer döneminde teklifler gelecek.';hist('Kiralık planı yapıldı');}
      else{bump('trust',-5);bump('morale',-3);res='Hoca: “Seni planlarımda düşünüyorum, neden gitmek istiyorsun?” Kiralık talebin kabul görmedi (güven −5).';hist('Kiralık talebi yersizdi');agKnow(a.id,1);}break;
    case 'free':{const X=agx();if(just){X.bos=G.s.year;const cs=[agFitClub(true),agFitClub(true)].filter(Boolean);for(const x of cs){const w=G.watch[x.c.id]=G.watch[x.c.id]||{i:0,lv:0};w.i=clamp(w.i+18,0,100);w.lv=WLV.filter(t=>w.i>=t).length;}bump('trust',-2);res=`Uzatma görüşmelerini dondurdun. Serbest kalacağın konuşuluyor${cs.length?'; '+cs.map(x=>x.c.name).join(', ')+' ilgileniyor':''}. Sezon sonu tekliflerde imza parası yüksek olacak.`;hist('Serbest kalma planı');}
      else{X.bad=G.s.year;bump('trust',-4);res='Kulübün tavrına kırıldı; sezon sonundaki uzatma teklifi daha düşük olacak (güven −4).';hist('Uzatmayı reddetme tavsiyesi zarar verdi');agKnow(a.id,1);}break;}}
  return res+(fee&&!/geri gelmeyecek|kayıp/.test(res)?fee:'');}
function agDetails(d){const a=agById(d.a);if(!a)return;agKnow(a.id,1);const good=a.hon>=50,st=G.s.stats;let t='';
  if(d.kind==='rep')t=good?`${a.n} sözleşmeyi madde madde anlattı: komisyon yalnız maaş, imza ve sponsorluk gelirinden alınır; ön ödeme yok. ${d.yrs} yıl sonra serbestçe ayrılabilirsin; erken fesih bedeli kalan süreye göre birkaç haftalık maaşın kadar.`
      :`${a.n} sorularını geçiştirdi: “Ayrıntılar sonra, önce imza.” Sözleşmede ${d.yrs} yıllık süre ve yüksek fesih bedeli var${d.up?`; ${money(d.up)} ön ödeme iade edilmiyor`:''}.`;
  else if(good)t=({raise:`${a.n}: “Bu sezon ${st.apps} maçta ${dec(seasonAvg()||0,2)} ortalaman var; benzer oyuncular senden fazla kazanıyor. Görüşme makul.”`,list:`${a.n}: “Son ${Math.max(1,G.s.week-1)} haftada ${st.apps} maç oynadın; burada gelişimin duruyor.”`,club:`${a.n}: “${d.c?CLUBS[d.c].name:'Kulüp'} senin seviyende bir oyuncu arıyor; yöneticileriyle doğrudan tanışıyorum.”`,spon:`${a.n}: “Şöhretin ve imajın bu marka için yeterli. Komisyonum yalnız imza olursa.”`,loan:`${a.n}: “Bu sezon ${st.apps} maç az. Düzenli süre almalısın.”`,free:`${a.n}: “Kulübünün seviyesinin üstündesin; serbest kalırsan pazarlıkta elin güçlenir.”`})[d.kind];
  else t=`${a.n} somut bir bilgi vermedi: “Detayları telefonda konuşamam. Güven bana, bu iş olur.”${d.fee?` Yine de önce ${money(d.fee)} istiyor.`:''}`;
  openModal(`<h3>Ayrıntılar</h3><p>${esc(t)}</p><div class="offer-btns"><button class="btn" data-act="agCV" data-id="${a.id}">CV’sine bak</button><button class="cta sm" data-act="goInbox">Mesaja dön</button></div>`);}
EVENTS.ag_rep={c:()=>false,title:'Menajer',body:()=>'',o:[['Menajerim olsun',d=>agRunHire(d)],['CV’sine bak',d=>agProfile(d.a),'peek'],['Şartları sor',d=>agDetails(d),'peek'],['Reddet',d=>{agHist(d.a,'Temsil teklifini reddettin');const a=agById(d.a);return a&&a.hon<40&&Math.random()<0.5?`${a.n}: “Pişman olacaksın, bu piyasada bensiz iş bulamazsın.” Telefonu yüzüne kapattı.`:'Teklifi kibarca geri çevirdin.';}]]};
EVENTS.ag_act={c:()=>false,title:'Menajer',body:()=>'',o:[['Kabul et',d=>agRunAct(d)],['CV’sine bak',d=>agProfile(d.a),'peek'],['Ayrıntı iste',d=>agDetails(d),'peek'],['Reddet',d=>{agHist(d.a,'Tavsiyeyi geri çevirdin');return 'Tavsiyeyi uygulamadın.';}]]};
resolveEvent=(old=>function(mid,i){try{const m=G.inbox.find(x=>x.id===mid);if(m&&m.ev&&!m.ev.done&&/^ag_/.test(m.ev.id)){const o=EVENTS[m.ev.id].o[i];if(o&&o[2]==='peek'){m.read=true;o[1](m.ev.d);save();return;}
  if(i===0&&m.ev.id==='ag_rep'){const r=agRunHire(m.ev.d);if(/yetmiyor|ulaşılamadı/.test(r))return toast(r);m.ev.done=true;m.ev.choice=o[0];m.ev.res=r;m.read=true;save();render();toast(r);return;}
  if(i===0&&m.ev.d.fee&&G.p.money<m.ev.d.fee)return toast(`${money(m.ev.d.fee)} ödemeye paran yetmiyor`);}}catch(e){console.warn('menajer',e);}return old.apply(this,arguments);})(resolveEvent);
ACTX.agFire=()=>{const p=G.p,pen=agPen(),o=agOf();if(!p.ag||!p.ag.id||p.ag.id==='aile')return toast('Menajerin yok');if(p.money<pen)return toast(`Fesih bedeli ${money(pen)}; paran yetmiyor`);p.money-=pen;if(o&&/^m\d+$/.test(o.id))agHist(o.id,'Yollar ayrıldı'+(pen?` · fesih bedeli ${money(pen)}`:''));
  msg('menajer','Menajerinle yollarını ayırdın',`${o?o.n:'Menajerin'} ile temsil sözleşmesi feshedildi.${pen?` ${money(pen)} fesih bedeli ödedin.`:''}`);p.ag={id:'aile',since:absDay()};closeModal();save();render();toast('Menajerinle yollarını ayırdın');};
ACTX.agAsk=el=>{const a=agById(el.dataset.id);if(!a||!isPl())return;const X=agx();if(X.last[a.id]&&absDay()-X.last[a.id]<30)return toast(`${a.n} kısa süre önce görüştü; biraz bekle`);if(a.rep>agMeScore()+22)return toast('Seninle henüz ilgilenmiyor');closeModal();agSend(a,'rep');save();TAB='inbox';render();toast(`${a.n} teklifini gelen kutuna gönderdi`);};
/* komisyon ve başarı ücretleri gerçek teklif kabullerine bağlı */
acceptOffer=(old=>function(o){const w0=G.contract.wage;const r=old.apply(this,arguments);try{if(o&&o.status==='accepted'&&isPl()){if(o.renew)agx().rz=absDay();if(o.agf){const a=agById(o.agf.a),c=Math.round((o.renew?Math.max(0,o.wage-w0)*26:o.wage*4)*o.agf.pct/100/50)*50;if(a&&c>0){G.p.money-=c;agHist(a.id,`Başarı ücreti ${money(c)}`);msg('menajer',`${a.n} başarı ücretini aldı`,`${a.n}, aracılık ettiği anlaşma için ${money(c)} başarı ücreti kesti.`,{ag:a.id});}}
  if(o.agKick){const a=agById(o.agKick);if(a){agx().kick={a:a.id,club:o.club,at:absDay()+rint(30,70)};agHist(a.id,`${CLUBS[o.club].name} transferine yönlendirdi`);}}}}catch(e){console.warn('menajer',e);}return r;})(acceptOffer);
if(ACTX.spnAcc)ACTX.spnAcc=(old=>function(el){const im=imInit(),o=im.offers.find(x=>x.id===el.dataset.k),f=o&&o.agf;const r=old.apply(this,arguments);try{if(f&&im.deals.some(d=>d.id===o.id)){const a=agById(f.a),c=Math.round(o.pay*8*f.pct/100/50)*50;if(a&&c>0){G.p.money-=c;agHist(a.id,`Sponsorluk başarı ücreti ${money(c)}`);save();render();}}}catch(e){}return r;})(ACTX.spnAcc);
/* serbest kalma kararının sezon sonu teklifine etkisi */
makeOffer=(old=>function(c,m,kind,role,renew){const o=old.apply(this,arguments);try{if(isPl()&&G.p.agx&&kind==='end'&&o){const X=G.p.agx;if(X.bos===G.s.year&&!renew){o.bonus=Math.round(Math.max(o.bonus||0,o.wage*4)*1.6/100)*100;}if(X.bad===G.s.year&&renew)o.wage=Math.max(50,Math.round(o.wage*0.88/50)*50);}}catch(e){}return o;})(makeOffer);
/* pazarlık: itibarlı menajer pazarlık masasında güç verir (v45 "Menajer" hizmetiyle aynı etki) */
function agWithPow(fn){return function(){const p=G&&G.p,a=isPl()&&agMine(),tmp=a&&a.rep>=55&&p&&!p.up.menajer;if(tmp)p.up.menajer=true;try{return fn.apply(this,arguments);}finally{if(tmp)delete p.up.menajer;}};}
haggle=agWithPow(haggle);if(typeof askTerm==='function')askTerm=agWithPow(askTerm);if(typeof negoSheet==='function')negoSheet=agWithPow(negoSheet);

/* ---------- günlük/haftalık işleyiş ---------- */
function agTick(){if(!G||!G.p||!isPl()||G.mode==='mgr'||G.phase!=='season'||!G.s||!G.s.cal)return;agWorld();const X=agx(),d=absDay(),p=G.p;
  /* süresi dolan mesajlar ve aracı teklifleri */
  for(const m of G.inbox){if(m.t==='menajer'&&m.ev&&!m.ev.done&&m.ev.d&&m.ev.d.exp<=d){const a=agById(m.ev.d.a);m.ev.done=true;m.ev.choice='Yanıt vermedin';m.ev.res=a&&a.hon<50?`${a?a.n:'Menajer'} başka bir oyuncuya yöneldi.`:'Teklifin süresi doldu.';}
    if(m.offer&&m.offer.agExp&&m.offer.status==='open'&&m.offer.agExp<=d)m.offer.status='expired';}
  if(!X.next)X.next=d+rint(10,30);
  if(d>=X.next){const f=formAvg(),sc=agMeScore();if(agApproach())X.next=d+Math.round(rint(21,56)*(f>=7.2?0.7:1)*(sc>=60?0.85:1)*(agMine()?1.5:1));else X.next=d+7;}
  if(agMine()){if(!X.adv)X.adv=d+rint(25,45);if(d>=X.adv){agAdvise();X.adv=d+rint(30,63);}}
  /* kötü menajerin gizli masrafları, iyi menajerin desteği (haftada bir) */
  const a=agMine();if(a&&!p.ag.gone&&wdOf(today())===0){if(a.hon<45&&Math.random()<0.06){const c=Math.round(G.contract.wage*rnd(0.6,1.6)/50)*50;if(c>0){p.money-=c;agHist(a.id,`Açıklanmayan masraf faturası ${money(c)}`);agKnow(a.id,1);msg('menajer','Menajerinden masraf faturası',`${a.n} “seyahat, temsil ve ağırlama” kalemiyle ${money(c)} fatura kesti. Faturada ayrıntı yok.`,{ag:a.id});}}
    else if(a.hon<45&&Math.random()<(45-a.hon)/900){try{imHit(3);}catch(e){}msg('gundem',`Basında: ${a.n} hakkında iddialar`,`${a.ag} ile ilgili vergi ve komisyon soruşturması iddiaları gündemde. Adının bu haberlerle anılması imajına zarar veriyor.`);agKnow(a.id,1);}
    else if(a.hon>=70&&Math.random()<0.04){bump('morale',3);msg('menajer',`Menajerin ${a.n} aradı`,'“Son haftalarda emeğini görüyorum; sabırlı ol, doğru zamanda doğru adımı atacağız.” (moral +3)',{ag:a.id});}}
  /* kötü menajer: ön ödemeden sonra ortadan kaybolma / gizli komisyon skandalı */
  if(X.sc&&d>=X.sc.at){const s=X.sc,b=agById(s.a);X.sc=null;if(b&&agMine()&&agMine().id===b.id){p.ag.rev=1;p.ag.gone=1;agKnow(b.id,3);agHist(b.id,'Telefonlara çıkmıyor; ön ödeme boşa gitti');msg('menajer',`${b.n} ortadan kayboldu`,`${b.n} haftalardır telefonlarına dönmüyor. Ödediğin ${money(s.amt)} “dosya masrafı” için hiçbir iş yapılmamış. Sözleşmeyi bedelsiz feshedebilirsin.`,{ag:b.id});}}
  const K=X.kick;if(K&&!K.done&&d>=K.at){K.done=1;const b=agById(K.a);if(b){agKnow(b.id,3);agHist(b.id,'Gizli komisyon ortaya çıktı');try{imHit(4);}catch(e){}bump('morale',-4);if(agMine()&&agMine().id===b.id)p.ag.rev=1;
    msg('gundem','Menajer skandalı',`${CLUBS[K.club]?CLUBS[K.club].name:'Bir kulüp'} transferinde menajer ${b.n} (${b.ag}) kulüpten gizli komisyon almış. Seni kendi çıkarı için yönlendirmiş.${agMine()&&agMine().id===b.id?' Artık bedelsiz ayrılabilirsin.':''}`);}}}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{agTick();}catch(e){console.warn('menajer',e);}return r;})(nextDay);
/* gelen kutusu etiketi ve filtre grubu (renklendirme gelen kutusu tasarımına bırakıldı) */
try{TAGS.menajer='MEN';if(INF_GROUPS.offer&&!INF_GROUPS.offer.includes('menajer'))INF_GROUPS.offer.push('menajer');}catch(e){}
/* test yardımcısı: agDebug('rep'|'raise'|..., 'iyi'|'kotu') bir menajer yaklaşımı zorlar */
window.agDebug=function(kind,tone){if(!G||!isPl())return null;const A=agWorld(),mid=agMine()&&agMine().id;const L=A.list.filter(a=>a.id!==mid&&(tone==='kotu'?a.hon<40:tone==='iyi'?a.hon>=70:true)).sort((x,y)=>Math.abs(x.rep-agMeScore()-8)-Math.abs(y.rep-agMeScore()-8));const a=L[0];if(!a)return null;
  const ok=kind&&kind!=='rep'&&mid&&tone==='mine'?agSend(agMine(),kind):agSend(a,kind||'rep');save();render();return ok?a.id:null;};
