/* ================= v94: hakem pozisyonları · tutarlı görüntüler, yardımcı hakem görüşü, yeni pozisyon türleri ================= */
/* Gördüklerin artık hep gerçeğe uyar (çelişen iki ipucu yok); belirsizlik açının kapalı olmasından ve yardımcı hakemin yanılabilmesinden gelir. */
INC.length=0;
INC.push(
 {t:'pen',q:'Ceza sahası içinde {a} yerde! {d} ile temas var mı?',o:[['pen','Penaltı'],['dev','Devam'],['sim','Simülasyon (sarı kart)']],
  c:{pen:['{d} topa değil ayağa gidiyor','temas net, {a} dengesini kaybediyor','{d} topa hiç dokunmuyor','çelme takılıyor, {a} düşüyor'],dev:['iki oyuncu da topa oynuyor','omuz omuza, kurallara uygun mücadele','önce top oynanıyor, temas sonra','temas var ama düşmeye yetecek kadar değil'],sim:['{a} temas olmadan kendini bırakıyor','{d} ayağını çekmiş, temas yok','{a} düşerken hakeme bakıyor, ayağa kalkıp itiraz ediyor']},var:1},
 {t:'kart',q:'{d}, {a} üzerine sert bir müdahalede bulunuyor.',o:[['faul','Sadece faul'],['sari','Sarı kart'],['kirmizi','Kırmızı kart']],
  c:{faul:['müdahale topa yönelik, mesafe kısa','ayak yerde, hız düşük','temas dengesizlikten geliyor'],sari:['taktik faul, kontra atak kesiliyor','müdahale geç kalınmış','pervasız ama kontrollü bir giriş'],kirmizi:['krampon yukarıda, bilek hizasında','iki ayakla, kontrolsüz hızla giriliyor','rakibin güvenliği tehlikeye atılıyor (ciddi faul)']},var:1},
 {t:'ofs',q:'{a} golü attı! Yardımcı hakem tereddütlü.',o:[['gol','Golü ver'],['ofs','Ofsayt']],
  c:{gol:['pas anında son savunmacıyla aynı hizada','pas geriye doğru atılmış','son savunmacının topuğu {a}dan geride'],ofs:['pas anında bir adım önde','ayağı savunma çizgisini geçmiş','topa oynayan oyuncu ofsayt konumundan geliyor']},var:1},
 {t:'el',q:'Ceza sahasında top {d} adlı oyuncunun koluna çarptı.',o:[['pen','Penaltı'],['dev','Devam']],
  c:{pen:['kol vücuttan açık, alanı büyütüyor','kol omuz hizasının üstünde','kol topa doğru hareket ediyor'],dev:['kol vücuda yapışık','top çok yakından sekip geliyor','{d} düşerken destek için eli yere koyuyor']},var:1},
 {t:'itiraz',q:'{a} kararına çok sert itiraz ediyor.',o:[['uyar','Sözlü uyarı'],['sari','Sarı kart (itiraz)']],
  c:{uyar:['ilk itirazı, hemen geri çekiliyor','kaptan araya girip sakinleştiriyor','sesini yükseltiyor ama mesafeyi koruyor'],sari:['üstüne yürüyor, el kol hareketi yapıyor','daha önce de uyarılmıştı','seyirciyi kışkırtıyor']}},
 {t:'avantaj',q:'{d}, {a}ya faul yaptı ama top hücum eden takımda kaldı.',o:[['avantaj','Avantaj ver'],['durdur','Oyunu durdur']],
  c:{avantaj:['hücum hızla kaleye ilerliyor','takım arkadaşı boş alanda topla buluşuyor'],durdur:['top kayboluyor, hücum yavaşladı','faul yiyen oyuncu yerde kalıyor, sakatlık olabilir']}},
 {t:'ikisari',q:'Daha önce sarı kart görmüş olan {d}, {a}yı arkadan durduruyor.',o:[['faul','Sadece faul'],['ikinci','İkinci sarı → kırmızı'],['kirmizi','Doğrudan kırmızı']],
  c:{faul:['topa oynuyor, temas hafif','{a} önde, temas kazara','müdahale zamanında'],ikinci:['taktik faul, hücumu bilerek kesiyor','geç kalınmış, pervasız bir müdahale','formasından çekip durduruyor'],kirmizi:['krampon yukarıda, aşil hizasında','topla ilgisi olmayan sert bir giriş','rakibin güvenliğini tehlikeye atıyor']},var:1},
 {t:'dogso',q:'{a} kaleciyle karşı karşıya kalacakken {d} onu ceza sahası dışında durduruyor.',o:[['sari','Faul + sarı kart'],['kirmizi','Kırmızı (net gol şansını engelleme)'],['dev','Devam']],
  c:{sari:['yanında bir savunmacı daha var, kapatabilirdi','top {a}dan uzaklaşmış, kontrolü zor','pozisyon kenara doğru, kaleye açı dar'],kirmizi:['son adam, arkada kimse yok','top {a}nın ayağında, kaleye doğru gidiyor','kaleye 20 metre, önünde sadece kaleci'],dev:['{d} topa oynuyor, temas yok','{a} kendi ayağına takılıyor','omuz omuza, kurallara uygun']},var:1},
 {t:'siddet',q:'Top oyundan uzaktayken {d} ile {a} arasında arbede çıkıyor.',o:[['uyar','Sözlü uyarı'],['sari','Sarı (sportmenlik dışı)'],['kirmizi','Kırmızı (şiddetli hareket)']],
  c:{uyar:['karşılıklı itişme, kimse vurmuyor','göğüs göğüse geliyorlar, hemen ayrılıyorlar'],sari:['{d} rakibini itiyor, provokatif davranıyor','topa vurup zaman kazanmaya çalışıyor, centilmenliğe aykırı'],kirmizi:['{d} rakibine dirsek atıyor','{d} kafa atıyor','{d} rakibine tokat atıyor']},var:1},
 {t:'dirsek',q:'Hava topu mücadelesinde {d} ile {a} çarpışıyor; {a} yerde.',o:[['dev','Devam'],['faul','Faul'],['sari','Faul + sarı'],['kirmizi','Kırmızı']],
  c:{dev:['iki oyuncu da topa çıkıyor, kafa kafaya','kollar vücuda yakın, kaza'],faul:['{d} kolunu destek için kullanıyor','{d} {a}nın üstüne yükleniyor'],sari:['kol ileri doğru, pervasız','{d} dirseği açık, topa bakmıyor'],kirmizi:['dirsek bilerek yüze savruluyor','{d} rakibine vurmak için zıplıyor']},var:1},
 {t:'oncesi',q:'{a} golü attı, ama öncesinde {d} ile ikili mücadele vardı.',o:[['gol','Golü ver'],['faul','Faul, gol iptal']],
  c:{gol:['mücadele omuz omuza, kurallara uygun','{a} topa önce dokunuyor','{d} kendi dengesini kaybediyor'],faul:['{a} rakibini iki eliyle itiyor','{a} kalecinin önünü kollarıyla kesiyor','{a} {d}nın formasını çekiyor']},var:1},
 {t:'zaman',q:'{a} kenara gitmekte acele etmiyor, oyun uzun süredir durmuş.',o:[['uyar','Sözlü uyarı'],['sari','Sarı kart (zaman geçirme)']],
  c:{uyar:['ilk kez yapıyor, uyarınca hızlanıyor','sakatlık şüphesiyle yavaş çıkıyor'],sari:['daha önce de uyarıldı, yine yavaşlıyor','skor avantajı var, açıkça zaman öldürüyor']}});
const REF_AMB=['açın kapalı, temas noktasını tam göremedin','önünde iki oyuncu vardı, görüşün kısmen kapandı','pozisyon çok hızlı gelişti','topun arkasında kaldın, mesafe uzak'];
function refAsst(){try{const L=LEAGUES[G.s.league]||{},r=srng('asst'+G.s.year+'-'+G.s.day);r();const A=['Mert Erdem','Kemal Aksoy','Serkan Gül','Hasan Çelik','Onur Kara','Bülent Yazıcı','Tolga Şen','Ercan Usta','Murat Doğan','Selim Aydın'];return [A[Math.floor(r()*A.length)],A[Math.floor(r()*A.length+3)%A.length]];}catch(e){return ['Yardımcı hakem','Dördüncü hakem'];}}
refMkInc=function(F){const n=rint(3,5),out=[],sqH=squadOf(F.h).sort((a,b)=>b.ovr-a.ovr).slice(0,11),sqA=squadOf(F.a).sort((a,b)=>b.ovr-a.ovr).slice(0,11),c=refClarity(),as=refAsst();
  const used=new Set();for(let i=0;i<n;i++){let T,g=0;do{T=pick(INC);}while(used.has(T.t)&&g++<40);used.add(T.t);const homeAtk=Math.random()<0.5,att=pick((homeAtk?sqH:sqA).filter(p=>p.pos!=='KL')),def=pick((homeAtk?sqA:sqH).filter(p=>p.pos==='DF'||p.pos==='OS'))||pick(homeAtk?sqA:sqH);
    const an=att?att.name:'Hücumcu',dn=def?def.name:'Savunmacı',fill=s=>s.replace(/\{a\}/g,an).replace(/\{d\}/g,dn);
    const truth=pick(T.o)[0],pool=T.c[truth].slice().sort(()=>Math.random()-0.5),cues=[];
    /* gördüklerin: netlik kadar gerçek ipucu, gerisi kapalı açı */
    const nTrue=Math.max(1,Math.min(pool.length,Math.round(1+c*2.2-(Math.random()*0.8))));for(let k=0;k<nTrue&&pool.length;k++)cues.push(fill(pool.pop()));
    if(Math.random()>c)cues.push(pick(REF_AMB));
    /* yardımcı hakemin görüşü: çoğunlukla doğru, bazen yanılır */
    const ok=Math.random()<clamp(0.55+c*0.35,0.55,0.9),others=T.o.filter(o=>o[0]!==truth),op=ok?T.o.find(o=>o[0]===truth):pick(others);
    const lines={pen:'bence penaltı',dev:'bence devam, temas yok',sim:'kendini attı hocam',faul:'bence sadece faul',sari:'bence sarı',kirmizi:'hocam bence kırmızı gerekir',gol:'gol geçerli, ofsayt yok',ofs:'ofsayt hocam, bayrağı kaldırdım',uyar:'sözlü uyarı yeter',avantaj:'avantaj verelim, hücum devam ediyor',durdur:'durduralım, oyuncu yerde',ikinci:'ikinci sarı hocam, bu oyuncu daha önce kart gördü'};
    const asst={n:as[(T.t==='ofs'||T.t==='oncesi')?0:Math.floor(Math.random()*2)],t:lines[op[0]]||('bence '+op[1].toLowerCase())};
    out.push({t:T.t,q:fill(T.q),o:T.o,truth,cues:[...new Set(cues)],asst,m:rint(5,88),var:!!T.var,dec:null,att:an,def:dn});}
  return out.sort((a,b)=>a.m-b.m);};
refModal=(old=>function(){const R=REF;if(!R||R.varQ)return old.apply(this,arguments);const r=old.apply(this,arguments);try{const I=R.inc[R.i],mc=$('#modalCard');if(I&&I.asst&&mc&&!mc.querySelector('.ref-as')){const ul=mc.querySelector('.ref-c');if(ul)ul.insertAdjacentHTML('afterend',`<p class="ref-as">🎧 <b>${esc(I.asst.n)}:</b> “Hocam, ${esc(I.asst.t)}.”</p>`);}}catch(e){}return r;})(refModal);
const REF_TN={pen:'Penaltı pozisyonu',kart:'Sert müdahale',ofs:'Ofsayt şüphesi',el:'Elle oynama',itiraz:'İtiraz',avantaj:'Avantaj kararı',ikisari:'İkinci sarı',dogso:'Gol şansını engelleme',siddet:'Arbede',dirsek:'Hava topu / dirsek',oncesi:'Gol öncesi faul',zaman:'Zaman geçirme'};
refScore=function(I,ok,viaVar){const R=REF;if(ok){R.rt+=viaVar?-0.15:0.18;R.log.push([I.m,I.t,viaVar?'VAR sonrası doğru':'doğru']);}else{const big=['pen','kart','ofs','el','ikisari','dogso','siddet','dirsek','oncesi'].includes(I.t);R.rt-=big?0.75:0.3;R.log.push([I.m,I.t,'hatalı']);}};
refAfter=function(info){try{staffMatch();}catch(e){console.warn(e);}closeModal();if(!info){save();render();return;}const {F,rt,fee,log}=info;
  openModal(`<div class="refm"><h3>Maç sonu raporu</h3><div class="res-rate"><b class="${rt>=8.3?'g':rt>=7?'m':'b'}">${dec(rt,1)}</b><div><span>${esc(CLUBS[F.h].name)} – ${esc(CLUBS[F.a].name)}</span><div>${F.uefa?'UEFA görevi · ':''}Maç ücreti ${eur(fee)}</div></div></div><ul class="notes">${log.map(([m,t,r])=>`<li>${m}’ ${REF_TN[t]||'Pozisyon'}: <b class="${r==='hatalı'?'neg':'pos'}">${r}</b></li>`).join('')}</ul><button class="cta" data-act="closeModal">Tamam</button></div>`);save();render();};

