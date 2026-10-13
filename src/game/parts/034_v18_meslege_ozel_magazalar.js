/* ================= v18: mesleğe özel mağazalar ================= */
const SHOP_TD={
  kenar:{n:'Kenar & teknoloji',items:[
    ['td_tahta','Manyetik taktik tahtası','Soyunma odasında net anlatım: taktik uyumu her hafta +1 daha hızlı artar.',25000,0,2,{g:'tahta'}],
    ['td_tablet','Analiz tableti','Kenarda canlı istatistik: maç gücü +0,2.',60000,0,2,{g:'tablet'}],
    ['td_kulak','Kenar iletişim sistemi','Yardımcılarınla anlık iletişim: maç gücü +0,2.',120000,1,2,{g:'kulak'}],
    ['td_veri','Veri analiz yazılımı','Taktik uyumu her hafta +1,5 daha hızlı artar.',350000,0,2,{g:'veri'}],
    ['td_scout','Gözlem veri platformu aboneliği','Gözlem ağından haftada +1 rapor.',400000,0,1,{g:'yazilim'}]]},
  tesis:{n:'Kulübe yatırım',items:[
    ['td_gps','GPS yelek seti (kulübe)','Yük takibi: idman sakatlık riski %20 azalır.',900000,1,2,{g:'gps'}],
    ['td_kriyo','Kriyoterapi kabini (kulübe)','Sakatlık süreleri 1 hafta kısalır.',2500000,2,3,{g:'kriyo'}]]},
  egitim:{n:'Kişisel gelişim',items:[
    ['td_dil','Yabancı dil kursu','Yabancı oyuncu ve teknik ekip adaylarını ikna etmek kolaylaşır.',80000,0,2,{g:'dil'}],
    ['td_lider','Liderlik ve iletişim koçluğu','Oyuncu görüşmelerinde başarı şansı artar.',200000,1,3,{g:'kitap'}],
    ['td_staj','Avrupa kulübünde staj','İtibar +6, lisans için +1 sezon deneyim.',600000,3,4,{g:'staj'}]]}};
const SHOP_YRD={
  ekipman:{n:'Antrenman ekipmanı',items:[
    ['yr_koni','Antrenman ekipman seti','Koni, ip merdiven, pas duvarı: idman planı katkın %15 artar.',8000,0,2,{g:'koni'}],
    ['yr_tahta','Taktik tahtası','Anlatımın netleşir: katkı %10 artar.',15000,0,2,{g:'tahta'}],
    ['yr_laptop','Analiz bilgisayarı','Rakip analizi katkın %20 artar.',60000,0,2,{g:'laptop'}],
    ['yr_drone','Antrenman drone kamerası','Kuşbakışı idman görüntüsü: tüm katkın %25 artar.',90000,1,3,{g:'drone'}]]},
  egitim:{n:'Eğitim',items:[
    ['yr_kurs','Taktik seminerleri','Sezon değerlendirme puanın %15 artar.',150000,1,2,{g:'kitap'}],
    ['yr_lis','Lisans kursu desteği','Antrenörlük lisansı için +1 sezon deneyim.',300000,0,2,{g:'sertifika'}],
    ['yr_dil','Yabancı dil kursu','Hoca güveni +8, itibar +3.',80000,0,2,{g:'dil'}]]}};
const SHOP_SC={
  saha:{n:'Saha ekipmanı',items:[
    ['sc_durbun','Profesyonel dürbün','Gözlem turlarında +1 oyuncu fark edersin.',6000,0,2,{g:'durbun'}],
    ['sc_kamera','Kamera ve zoom lens','Turda izlediğin oyuncularda bilgi +1 daha.',40000,0,2,{g:'kamera'}],
    ['sc_tablet','Rapor tableti','Günde iki video analiz yapabilirsin.',25000,0,2,{g:'tablet'}],
    ['sc_veri','Video veri platformu aboneliği','Haftalık arama hakkı +1, video analizi daha net.',250000,1,2,{g:'yazilim'}]]},
  seyahat:{n:'Seyahat',items:[
    ['sc_arac','Gözlemci aracı','Yurt içi turlarda +1 oyuncu daha.',300000,1,3,{t:'sedan',c:'#3c4a5c',car:1}],
    ['sc_ucus','Business class üyeliği','Yurt dışı turlar 3 yerine 2 gün sürer.',400000,1,4,{g:'ucak'}]]},
  ag:{n:'Ağ & eğitim',items:[
    ['sc_rehber','Menajer ağı rehberi','Ağ puanı kazanımın %30 artar.',150000,0,2,{g:'rehber'}],
    ['sc_dil','Yabancı dil kursu','Yabancı ligleri izlerken bilgi +1.',80000,0,2,{g:'dil'}]]}};
const SHOP_DR={
  tibbi:{n:'Tıbbi ekipman',items:[
    ['dr_steto','Profesyonel muayene seti','Doğru teşhiste itibar kazancın artar.',8000,0,2,{g:'steto'}],
    ['dr_ultra','Taşınabilir ultrason','Teşhiste bir yanlış seçenek elenir.',120000,1,2,{g:'ultra'}],
    ['dr_mr','MR merkezi anlaşması','Teşhiste bir yanlış seçenek daha elenir.',500000,1,2,{g:'mr'}],
    ['dr_kriyo','Kriyoterapi ünitesi','Tedavi süreleri 1 hafta kısalır.',700000,1,3,{g:'kriyo'}],
    ['dr_havuz','Rehabilitasyon havuzu','Nüks riski %30 azalır.',1500000,2,3,{g:'havuz'}]]},
  egitim:{n:'Mesleki gelişim',items:[
    ['dr_kongre','Spor hekimliği kongresi','İtibar +4.',90000,1,2,{g:'kongre'}],
    ['dr_ortoped','Ortopedi sertifikası','Nüks riski %15 azalır, yanlış teşhis daha az itibar kaybettirir.',250000,1,2,{g:'sertifika'}]]}};
const SHOP_COMMON=['arac','ev','stil'];
function shopFor(){let base;if(G.mode==='mgr')base=SHOP_TD;else if(isStaff())base=G.staff==='yrd'?SHOP_YRD:G.staff==='scout'?SHOP_SC:SHOP_DR;else return SHOP;
  const o=Object.assign({},base);for(const k of SHOP_COMMON)o[k]=SHOP[k];return o;}
const ALLSHOP=()=>Object.assign({},SHOP,SHOP_TD,SHOP_YRD,SHOP_SC,SHOP_DR);
const UP=k=>!!(G&&G.p&&G.p.up&&G.p.up[k]);
const shopXi=()=>G&&G.mode==='mgr'?(UP('td_tablet')?0.2:0)+(UP('td_kulak')?0.2:0):0;
function shopOnBuy(key){const p=G.p;
  if(key==='td_staj'&&G.m){G.m.rep=clamp((G.m.rep||30)+6,0,100);licOf().exp++;}
  if(key==='yr_lis'&&G.lic)G.lic.exp=(G.lic.exp||0)+1;
  if(key==='yr_dil'&&G.job){G.job.tr=clamp((G.job.tr||50)+8,0,100);G.job.rep=clamp(G.job.rep+3,0,100);}
  if(key==='dr_kongre'&&G.job)G.job.rep=clamp(G.job.rep+4,0,100);}
function drElim(cs){const n=(UP('dr_ultra')?1:0)+(UP('dr_mr')?1:0);if(!n)return [];return cs.opts.filter(o=>o!==cs.i).slice(0,n);}
/* çizimler */
function gearSVG(o){const g=o.g,S=(b)=>`<svg viewBox="0 0 164 80" class="ill"><ellipse cx="82" cy="74" rx="64" ry="4" fill="rgba(0,0,0,.22)"/>${b}</svg>`;
  switch(g){
  case 'tahta':return S(`<rect x="30" y="8" width="104" height="60" rx="4" fill="#e9edf1" stroke="#8a96a3" stroke-width="3"/><rect x="36" y="14" width="92" height="48" fill="#2f7d45"/><path d="M82 14V62M36 38H128" stroke="#cfe8d4" stroke-width="1.2"/><circle cx="82" cy="38" r="8" fill="none" stroke="#cfe8d4" stroke-width="1.2"/>${[[50,24],[50,52],[66,38],[96,30],[96,46],[114,38]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${i<3?'#e63946':'#1d4ed8'}"/>`).join('')}<path d="M66 38 Q80 26 94 30" stroke="#ffd23f" stroke-width="2" fill="none" stroke-dasharray="3 2"/>`);
  case 'tablet':return S(`<rect x="44" y="6" width="76" height="64" rx="7" fill="#1b1f27"/><rect x="49" y="11" width="66" height="54" rx="3" fill="#0e2a3f"/>${[0,1,2,3,4].map(i=>`<rect x="${56+i*11}" y="${50-[10,22,16,30,24][i]}" width="7" height="${[10,22,16,30,24][i]}" fill="${i===3?'#35d49a':'#4aa3ff'}"/>`).join('')}<path d="M54 24 L70 20 L86 26 L104 16" stroke="#ffd23f" stroke-width="2" fill="none"/>`);
  case 'kulak':return S(`<path d="M52 46 Q52 12 82 12 Q112 12 112 46" stroke="#2a2f38" stroke-width="7" fill="none"/><rect x="40" y="40" width="20" height="26" rx="8" fill="#2a2f38"/><rect x="104" y="40" width="20" height="26" rx="8" fill="#2a2f38"/><path d="M58 60 Q70 70 84 66" stroke="#2a2f38" stroke-width="3" fill="none"/><circle cx="86" cy="66" r="4" fill="#e63946"/><rect x="128" y="28" width="16" height="30" rx="3" fill="#3a4250"/><rect x="134" y="20" width="3" height="10" fill="#3a4250"/>`);
  case 'veri':case 'yazilim':return S(`<rect x="34" y="6" width="96" height="58" rx="4" fill="#20262f"/><rect x="38" y="10" width="88" height="48" fill="#0f1a2a"/><rect x="74" y="64" width="16" height="6" fill="#20262f"/><rect x="62" y="70" width="40" height="3" fill="#20262f"/>${g==='veri'?`<path d="M42 50 L56 38 L68 42 L82 26 L96 32 L110 18 L122 22" stroke="#35d49a" stroke-width="2.4" fill="none"/><circle cx="110" cy="18" r="3" fill="#35d49a"/>`:`${[0,1,2].map(i=>`<rect x="42" y="${14+i*14}" width="34" height="10" rx="2" fill="#2c3e57"/><circle cx="47" cy="${19+i*14}" r="3" fill="#ffd23f"/>`).join('')}<rect x="82" y="14" width="40" height="38" rx="3" fill="#123a2a"/><path d="M90 40 L98 30 L106 36 L116 22" stroke="#35d49a" stroke-width="2" fill="none"/><polygon points="96,24 104,28 96,32" fill="#fff"/>`}`);
  case 'gps':return S(`<path d="M54 10 Q66 18 82 18 Q98 18 110 10 L122 20 L114 70 L50 70 L42 20 Z" fill="#111"/><path d="M66 12 Q82 26 98 12" stroke="#2b2b2b" stroke-width="6" fill="none"/><rect x="74" y="20" width="16" height="22" rx="3" fill="#ff7a00"/><circle cx="82" cy="27" r="3" fill="#fff"/><path d="M50 40 H114" stroke="#262626" stroke-width="2"/>`);
  case 'kriyo':return S(`<rect x="52" y="4" width="60" height="70" rx="26" fill="#dfe8f2" stroke="#9fb3c8" stroke-width="3"/><rect x="62" y="16" width="40" height="46" rx="18" fill="#9fd8ff"/>${[0,1,2,3,4].map(i=>`<path d="M${70+i*6} ${24+i*7} l3 -3 l3 3" stroke="#fff" stroke-width="1.5" fill="none"/>`).join('')}<rect x="114" y="30" width="14" height="22" rx="3" fill="#3a4250"/><circle cx="121" cy="38" r="3" fill="#35d49a"/><path d="M40 20 l4 6 l-4 6 M36 26 h8" stroke="#9fd8ff" stroke-width="2"/>`);
  case 'dil':return S(`<rect x="32" y="12" width="56" height="38" rx="10" fill="#4aa3ff"/><path d="M44 50 L40 62 L56 50" fill="#4aa3ff"/><text x="60" y="38" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="800" font-size="16" fill="#fff">Hello</text><rect x="80" y="26" width="54" height="36" rx="10" fill="#ffb320"/><path d="M122 62 L128 72 L112 62" fill="#ffb320"/><text x="107" y="50" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="800" font-size="15" fill="#1d1300">Hola</text>`);
  case 'kitap':return S(`<rect x="40" y="46" width="84" height="12" rx="2" fill="#7a2f2f"/><rect x="46" y="34" width="74" height="12" rx="2" fill="#1f4f7a"/><rect x="42" y="22" width="80" height="12" rx="2" fill="#2f6b3f"/><rect x="48" y="58" width="72" height="12" rx="2" fill="#a37b2c"/>${[[46,22],[50,34],[44,46],[52,58]].map(([x,y])=>`<rect x="${x+6}" y="${y+4}" width="30" height="3" fill="rgba(255,255,255,.6)"/>`).join('')}`);
  case 'staj':return S(`<rect x="88" y="16" width="44" height="56" fill="#c9d4df"/>${[0,1,2,3].map(r=>[94,106,118].map(x=>`<rect x="${x}" y="${22+r*12}" width="7" height="7" fill="#5b7fa3"/>`).join('')).join('')}<path d="M24 50 L74 30 L80 32 L62 44 L66 52 L60 54 L52 48 L32 56 Z" fill="#fff" stroke="#9aa6b2" stroke-width="1.5"/><path d="M30 60 Q60 52 84 40" stroke="#c8d6e4" stroke-width="2" stroke-dasharray="4 3" fill="none"/>`);
  case 'koni':return S(`${[34,58,82,106].map((x,i)=>`<path d="M${x} 66 L${x+8} 34 L${x+16} 66 Z" fill="#ff7a00"/><path d="M${x+3} 54 H${x+13}" stroke="#fff" stroke-width="3"/><rect x="${x-3}" y="64" width="22" height="5" rx="2" fill="#e06a00"/>`).join('')}<circle cx="136" cy="60" r="10" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M132 55 l4 3 l4 -3 l-1 5 h-6 z" fill="#222"/>`);
  case 'laptop':return S(`<rect x="44" y="10" width="76" height="48" rx="4" fill="#2a2f38"/><rect x="48" y="14" width="68" height="40" fill="#0f2a1f"/><rect x="36" y="58" width="92" height="8" rx="3" fill="#3a4250"/><rect x="54" y="20" width="56" height="28" fill="#2f7d45"/><circle cx="82" cy="34" r="6" fill="none" stroke="#cfe8d4" stroke-width="1"/><path d="M82 20V48" stroke="#cfe8d4" stroke-width="1"/><path d="M62 40 L74 28 L96 36" stroke="#ffd23f" stroke-width="2" fill="none"/>`);
  case 'drone':return S(`<rect x="66" y="30" width="32" height="14" rx="5" fill="#2a2f38"/>${[[44,22],[120,22],[44,52],[120,52]].map(([x,y])=>`<path d="M${x} ${y} L82 37" stroke="#2a2f38" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="16" ry="3" fill="rgba(150,170,190,.7)"/>`).join('')}<circle cx="82" cy="48" r="5" fill="#111"/><circle cx="82" cy="48" r="2" fill="#4aa3ff"/>`);
  case 'sertifika':return S(`<rect x="34" y="10" width="96" height="60" rx="3" fill="#fbf6e9" stroke="#c8a24a" stroke-width="3"/><rect x="50" y="20" width="64" height="5" fill="#8a7a55"/><rect x="58" y="30" width="48" height="3" fill="#b8a982"/><rect x="58" y="37" width="48" height="3" fill="#b8a982"/><circle cx="112" cy="56" r="9" fill="#c8102e"/><path d="M106 63 L104 72 L110 68 L114 72 L114 63" fill="#c8102e"/>`);
  case 'durbun':return S(`<rect x="44" y="24" width="30" height="38" rx="12" fill="#22272f"/><rect x="90" y="24" width="30" height="38" rx="12" fill="#22272f"/><rect x="70" y="34" width="24" height="14" fill="#3a4250"/><circle cx="59" cy="62" r="11" fill="#3a6f9a"/><circle cx="105" cy="62" r="11" fill="#3a6f9a"/><circle cx="56" cy="59" r="3" fill="#bfe3ff"/><circle cx="102" cy="59" r="3" fill="#bfe3ff"/>`);
  case 'kamera':return S(`<rect x="34" y="24" width="56" height="40" rx="6" fill="#23272e"/><rect x="44" y="18" width="18" height="8" rx="2" fill="#23272e"/><rect x="88" y="30" width="46" height="28" rx="4" fill="#30363f"/><circle cx="134" cy="44" r="14" fill="#1a1d22"/><circle cx="134" cy="44" r="8" fill="#355a7a"/><circle cx="131" cy="41" r="2.5" fill="#bfe3ff"/><circle cx="80" cy="30" r="3" fill="#e63946"/>`);
  case 'ucak':return S(`<rect x="0" y="0" width="164" height="70" fill="#cfe6f7" opacity=".5"/><path d="M20 44 L118 36 Q136 36 140 42 Q136 48 118 48 L20 48 Z" fill="#fff" stroke="#9aa6b2" stroke-width="1.5"/><path d="M70 42 L52 16 L62 16 L92 40 Z M70 46 L58 66 L66 66 L90 46 Z M24 44 L16 30 L24 30 L34 42 Z" fill="#1f4f7a"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${80+i*7}" cy="41" r="1.6" fill="#5b7fa3"/>`).join('')}`);
  case 'rehber':return S(`<rect x="46" y="8" width="72" height="62" rx="4" fill="#5a2d1e"/><rect x="52" y="12" width="62" height="54" rx="2" fill="#f7f1e2"/>${[0,1,2,3,4].map(i=>`<circle cx="62" cy="${22+i*10}" r="3" fill="#4aa3ff"/><rect x="70" y="${20+i*10}" width="${36-i*3}" height="3" fill="#9a8f78"/>`).join('')}<rect x="40" y="16" width="8" height="6" rx="2" fill="#c8a24a"/><rect x="40" y="50" width="8" height="6" rx="2" fill="#c8a24a"/>`);
  case 'steto':return S(`<path d="M60 12 Q56 44 78 50 Q100 44 96 12" stroke="#30363f" stroke-width="5" fill="none"/><path d="M78 50 Q78 66 100 66 Q120 66 120 52" stroke="#30363f" stroke-width="5" fill="none"/><circle cx="120" cy="46" r="10" fill="#c0c6ce" stroke="#30363f" stroke-width="3"/><circle cx="60" cy="10" r="4" fill="#30363f"/><circle cx="96" cy="10" r="4" fill="#30363f"/>`);
  case 'ultra':return S(`<rect x="40" y="10" width="64" height="46" rx="5" fill="#e6ebf0" stroke="#9aa6b2" stroke-width="2"/><rect x="46" y="16" width="52" height="34" fill="#0b0f14"/><path d="M58 44 Q72 18 86 44" fill="rgba(200,220,235,.35)" stroke="#9fc3e0" stroke-width="1"/><ellipse cx="72" cy="36" rx="6" ry="4" fill="rgba(220,235,245,.6)"/><path d="M108 40 Q120 40 124 52" stroke="#9aa6b2" stroke-width="3" fill="none"/><rect x="118" y="50" width="14" height="18" rx="6" fill="#4aa3ff"/>`);
  case 'mr':return S(`<rect x="26" y="10" width="112" height="60" rx="30" fill="#eef2f6" stroke="#b5c1cd" stroke-width="3"/><circle cx="82" cy="40" r="20" fill="#1f2a36"/><circle cx="82" cy="40" r="15" fill="#2c3b4c"/><rect x="74" y="46" width="70" height="8" rx="3" fill="#cfd8e2"/><rect x="34" y="20" width="10" height="6" rx="2" fill="#35d49a"/>`);
  case 'havuz':return S(`<rect x="18" y="26" width="128" height="40" rx="8" fill="#d9e4ec"/><rect x="24" y="32" width="116" height="30" rx="5" fill="#3aa0d8"/><path d="M24 40 Q40 36 56 40 T88 40 T120 40 T140 40" stroke="#bfe8ff" stroke-width="2" fill="none"/><path d="M120 12 V34 M132 12 V34 M120 18 H132 M120 26 H132" stroke="#9aa6b2" stroke-width="2.5"/>`);
  case 'kongre':return S(`<rect x="20" y="8" width="124" height="34" rx="3" fill="#1f4f7a"/><text x="82" y="30" text-anchor="middle" font-family="Barlow,sans-serif" font-weight="800" font-size="13" fill="#fff">SPOR HEKİMLİĞİ</text><rect x="64" y="44" width="36" height="26" fill="#5a3a22"/><rect x="78" y="36" width="4" height="10" fill="#30363f"/><circle cx="80" cy="35" r="3" fill="#30363f"/>${[30,44,120,134].map(x=>`<circle cx="${x}" cy="60" r="6" fill="#6b7785"/><rect x="${x-7}" y="64" width="14" height="8" rx="3" fill="#6b7785"/>`).join('')}`);}
  return S('');}
function itemIll(cat,o){if(o.g)return gearSVG(o);if(o.car)return carSVG(o);return cat==='arac'?carSVG(o):cat==='krampon'?bootSVG(o):cat==='ev'?houseSVG(o):cat==='ekip'?staffSVG(o):styleSVG(o);}
function viewLife2(){const p=G.p,SH=shopFor();if(!SH[SHOPC])SHOPC=Object.keys(SH)[0];const cat=SH[SHOPC];
  const who=G.mode==='mgr'?'Teknik direktör':isStaff()?STF[G.staff].n:'Futbolcu',wage=G.contract?G.contract.wage:0;
  return `<h2 class="h">Yaşam</h2><section class="panel wallet"><div><b>${money(p.money)}</b><span>Bakiye · ≈ ${tlOf(p.money)}</span></div><div><b>${money(wage)}</b><span>Haftalık</span></div><div><b>${Math.round(p.fame)}</b><span>Şöhret</span></div></section>
  <p class="muted" style="margin:8px 2px">${esc(who)} mağazası: işine yarayan ekipman ve eğitimler, ayrıca araç, ev ve stil.</p>
  <div class="filt">${Object.entries(SH).map(([k,v])=>`<button class="chip" data-act="shopc" data-k="${k}" aria-pressed="${SHOPC===k}">${v.n}</button>`).join('')}</div>
  <ul class="shop2">${cat.items.map(([k,n,d,c,f,m,o])=>{const own=!!p.up[k];return `<li class="${own?'own':''}">${itemIll(SHOPC,o)}<div class="si"><b>${n}</b><p>${d}</p><small>${f?`Şöhret +${f} · `:''}Moral +${m}</small></div>${own?'<span class="pill good">Sahipsin</span>':`<button class="btn" data-act="buy2" data-c="${SHOPC}" data-k="${k}" ${p.money<c?'disabled':''}>${money(c)}</button>`}</li>`;}).join('')}</ul>`;}

