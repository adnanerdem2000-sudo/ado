/* ================= v45: futbolcu kariyeri derinliği ================= */
const wkKey=()=>Math.floor(absDay()/7);
/* ---------- özel yetenek (perk) ağacı ---------- */
const PK_BR=[['bit','Bitirici','#ef3b36'],['oyn','Oyun kurucu','#39a0ff'],['fiz','Atlet','#4ad27f'],['zih','Zihin ve liderlik','#ffb320']];
const PK={
  sogukkanli:['bit',1,'Soğukkanlı bitirici','Atak ve kontra pozisyonlarında Şut +6.',{sut:6},['atak','kontra']],
  penalti:['bit',1,'Penaltı ustası','Penaltılarda Şut +14.',{sut:14},['penalti']],
  frikik:['bit',2,'Frikik ustası','Serbest vuruşlarda Şut +10, Pas +6.',{sut:10,pas:6},['serbest']],
  golcu:['bit',3,'Golcü içgüdüsü','Her maçta fazladan bir gol pozisyonuna girersin.',null,null],
  vizyon:['oyn',1,'Vizyon','Atak ve kontralarda Pas +6.',{pas:6},['atak','kontra']],
  dripling:['oyn',1,'Top sürme sanatçısı','Tüm hücum pozisyonlarında Dribling +6.',{dri:6},['atak','kontra','korner']],
  korner:['oyn',2,'Duran top uzmanı','Kornerlerde Pas +10, serbest vuruşlarda Pas +5.',{pas:10},['korner','serbest']],
  maestro:['oyn',3,'Maestro','Her maçta fazladan bir kontra/asist fırsatı yaratırsın.',null,null],
  demir:['fiz',1,'Demir adam','Maçlarda sakatlanma riskin %30 azalır.',null,null],
  maraton:['fiz',1,'Maraton koşucusu','Maç sonrası kondisyon kaybın %35 azalır, her gün +2 kondisyon toparlarsın.',null,null],
  patlayici:['fiz',2,'Patlayıcı hız','Kontra ataklarda Hız +8.',{hiz:8},['kontra']],
  hava:['fiz',3,'Hava hakimi','Kornerlerde ve duran top savunmasında Fizik +10.',{fiz:10},['korner','dkorner']],
  savasci:['zih',1,'Savaşçı','Savunma pozisyonlarında Defans +8.',{def:8},['savunma','dkorner']],
  medya:['zih',1,'Medya dostu','Şöhret kazancın %25 artar; skandalların imajına etkisi yarıya iner.',null,null],
  lider:['zih',2,'Soyunma odası lideri','Hoca güveni kazancın %30 artar, takım arkadaşlarınla ilişkilerin hızlı gelişir.',null,null],
  buyuk:['zih',3,'Büyük maç oyuncusu','Senden güçlü rakiplere karşı tüm özelliklerin +5.',null,null]};
const PK_XP=450;
function pkInit(){const p=G.p;p.pk=p.pk||{xp:0,pts:1,own:{}};return p.pk;}
const hasPk=k=>false;/* özel yetenekler kaldırıldı */
function pkCan(k){const P=PK[k],pk=pkInit();if(pk.own[k])return false;if(pk.pts<P[1])return false;if(P[1]===1)return true;
  const mates=Object.entries(PK).filter(([kk,x])=>x[0]===P[0]&&x[1]===P[1]-1).map(x=>x[0]);return mates.some(kk=>pk.own[kk]);}
ACTX.pkBuy=el=>{const k=el.dataset.k;if(!pkCan(k))return toast('Bu yeteneği henüz açamazsın');const pk=pkInit();pk.pts-=PK[k][1];pk.own[k]=1;msg('event',`Yeni özel yetenek: ${PK[k][2]}`,PK[k][3]);save();render();toast(PK[k][2]+' açıldı!');};
function pkBoost(type,C){const b={};for(const [k,P] of Object.entries(PK)){if(!hasPk(k)||!P[4])continue;if(P[5]&&!P[5].includes(type))continue;for(const [a,v] of Object.entries(P[4]))b[a]=(b[a]||0)+v;}
  if(hasPk('buyuk')&&C&&C.opp&&C.us&&C.opp.str>=C.us.str+3)for(const a of Object.keys(ATTR))b[a]=(b[a]||0)+5;return b;}
startMoment=(old=>function(type,C,title,done){try{if(isPl()&&C&&C.a&&!C.drill){const b=pkBoost(type,C);if(Object.keys(b).length){const a=Object.assign({},C.a);for(const k in b)a[k]=Math.min(99,(a[k]||0)+b[k]);C=Object.assign({},C,{a});}}}catch(e){console.warn(e);}return old.call(this,type,C,title,done);})(startMoment);
function pkSimQ(cfg){const h=hasPk,big=h('buyuk')&&cfg.opp&&cfg.us&&cfg.opp.str>=cfg.us.str+3?1.15:1;
  return {atak:(1+(h('sogukkanli')?0.25:0)+(h('vizyon')?0.12:0)+(h('dripling')?0.12:0))*big,kontra:(1+(h('sogukkanli')?0.15:0)+(h('patlayici')?0.2:0)+(h('vizyon')?0.1:0)+(h('dripling')?0.08:0))*big,
    serbest:(1+(h('frikik')?0.6:0)+(h('korner')?0.2:0))*big,korner:(1+(h('korner')?0.4:0)+(h('hava')?0.4:0))*big,pen:(h('penalti')?0.12:0)+(big>1?0.03:0),
    savunma:(h('savasci')?0.08:0)+(big>1?0.05:0),dkorner:(h('hava')?0.08:0)+(h('savasci')?0.04:0)+(big>1?0.05:0)};}
simMatch=(old=>function(cfg){if(isPl()&&cfg)cfg.pkq=pkSimQ(cfg);return old.apply(this,arguments);})(simMatch);
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(isPl()){
    const lo=Math.max(4,(cfg.entry||0)+3),add=t=>cfg.chances.push({m:rint(lo,88),type:t});
    if(hasPk('golcu')&&Math.random()<(role==='start'?0.55:0.3))add('atak');
    if(hasPk('maestro')&&Math.random()<(role==='start'?0.45:0.25))add('atak');
    const fr=tmFriendOnPitch();if(fr&&Math.random()<0.25)add('atak');
    cfg.chances.sort((a,b)=>a.m-b.m);
    if(cfg.injMin){let keep=1;if(hasPk('demir'))keep*=0.7;keep/=rtInjF();if(Math.random()>keep)cfg.injMin=0;}
    else if(rtInjF()>1&&Math.random()<0.018*(rtInjF()-1)*2)cfg.injMin=rint(Math.max(5,(cfg.entry||0)+2),88);}}catch(e){console.warn(e);}return cfg;})(buildMatch);
applyPlayed=(old=>function(res,role,win,draw,notes,tier,league){const p=G.p,t0=p.trust,f0=p.fame,e0=p.energy;const r=old.apply(this,arguments);try{if(isPl()){
    if(hasPk('lider')&&p.trust>t0)p.trust=clamp(p.trust+(p.trust-t0)*0.3,0,100);
    if(hasPk('medya')&&p.fame>f0)p.fame=clamp(p.fame+(p.fame-f0)*0.25,0,100);
    if(hasPk('maraton')&&p.energy<e0)p.energy=clamp(p.energy+(e0-p.energy)*0.35,0,100);
    const im=imInit();im.v=clamp(im.v+(res.rating>=7.5?0.35:res.rating<5.8?-0.5:0.05)+(res.goals||0)*0.12-(res.rc?5:0),0,100);
  }}catch(e){console.warn(e);}return r;})(applyPlayed);
seasonEnd=(old=>function(){const r=old.apply(this,arguments);try{if(isPl()&&G.summary){const n=(G.summary.awards||[]).length;const im=imInit();im.v=clamp(im.v+n*3,0,100);}}catch(e){console.warn(e);}return r;})(seasonEnd);
function viewPerk(){const pk=pkInit();
  return `<h2 class="h">Özel yetenekler</h2><div class="fin-kpi"><div><span>Yetenek puanı</span><b>${pk.pts}</b></div><div><span>Sonraki puan</span><b>${Math.round(pk.xp)}/${PK_XP}</b><div class="bar"><i style="width:${pk.xp/PK_XP*100}%"></i></div></div><div><span>Açılan</span><b>${Object.keys(pk.own).length}/${Object.keys(PK).length}</b></div><div><span>Nasıl kazanılır</span><small>İyi maçlar, gol ve asistler, sezon ödülleri</small></div></div>
  <div class="pk-tree">${PK_BR.map(([b,n,c])=>`<section class="panel pk-br" style="--pk:${c}"><p class="sub-h"><span>${n}</span></p>${[1,2,3].map(t=>`<div class="pk-t"><small>Seviye ${t} · ${t} puan</small>${Object.entries(PK).filter(([k,P])=>P[0]===b&&P[1]===t).map(([k,P])=>{const own=pk.own[k],can=pkCan(k);return `<div class="pk ${own?'own':can?'can':'lock'}"><b>${P[2]}</b><p>${P[3]}</p>${own?'<span class="pill good">Açık</span>':`<button class="btn sm" data-act="pkBuy" data-k="${k}" ${can?'':'disabled'}>Aç</button>`}</div>`;}).join('')}</div>`).join('')}</section>`).join('')}</div>
  <p class="muted">Seviye 2 için aynı daldan bir seviye 1, seviye 3 için bir seviye 2 yetenek gerekir. Yetenekler kendi oynadığın pozisyonlarda ve simüle edilen maçlarda etkilidir.</p>`;}

/* ---------- saha dışı yaşam: uyku, beslenme, aile ---------- */
const RT={uyku:['Uyku',[['e','Erken yat','Kondisyon +2/gün, moral −0,3/gün'],['n','Normal',''],['g','Geç saatlere kadar','Kondisyon −3/gün, moral +0,6/gün, sakatlık ve magazin riski']]],
  bes:['Beslenme',[['s','Sıkı diyet','Kondisyon +1,5/gün, sakatlık −%15, haftalık 150 €'],['n','Dengeli',''],['f','Fast food','Kondisyon −1,5/gün, sakatlık +%25, moral +0,4/gün']]],
  aile:['Aile',[['y','Ailene vakit ayır','Moral +0,6/gün, kondisyon −0,5/gün'],['n','Dengeli',''],['a','Sadece kariyer','Bireysel gelişim +%10, moral −0,5/gün, aile krizleri']]]};
function rtInit(){const p=G.p;p.rt=p.rt||{uyku:'n',bes:'n',aile:'n'};return p.rt;}
function rtInjF(){if(!G||!G.p||!isPl())return 1;const r=rtInit();return (r.uyku==='g'?1.2:1)*(r.bes==='s'?0.85:r.bes==='f'?1.25:1);}
ACTX.rtSet=el=>{rtInit()[el.dataset.g]=el.dataset.v;save();render();};
function rtDay(){const p=G.p,r=rtInit();let e=0,m=0;
  if(r.uyku==='e'){e+=2;m-=0.3;}else if(r.uyku==='g'){e-=3;m+=0.6;if(p.age>=18&&typeof gbHeat==='function'){const g=gbInit();g.heat=clamp(g.heat+0.6,0,100);}}
  if(r.bes==='s'){e+=1.5;m-=0.2;}else if(r.bes==='f'){e-=1.5;m+=0.4;}
  if(r.aile==='y'){m+=0.6;e-=0.5;}else if(r.aile==='a')m-=0.5;
  if(hasPk('maraton'))e+=2;
  p.energy=clamp(p.energy+e,0,100);p.morale=clamp(p.morale+m,0,100);}
gainAttr=(old=>function(k,v){if(G&&G.p&&isPl()&&G.p.rt&&G.p.rt.aile==='a')v*=1.1;return old.call(this,k,v);})(gainAttr);
Object.assign(EVENTS,{
  aileHasta:{c:()=>isPl()&&G.p.age>=17,title:'Annen hastalandı',body:()=>`Annen birkaç gündür hastanede. Ailen yanında olmanı istiyor ama bu hafta önemli antrenmanlar var.`,
    o:[['İzin iste, yanına git',()=>{bump('trust',-3);bump('morale',7);bump('energy',6);return 'Hoca anlayış gösterdi ama yokluğun fark edildi. Annen iyileşiyor.';}],
       ['Antrenmana devam et',()=>{bump('morale',rtInit().aile==='a'?-12:-7);return 'Aklın hep hastanedeydi. Ailen kırgın.';}]]},
  kardes:{c:()=>isPl(),title:'Kardeşin maçına gelmek istiyor',body:()=>`Küçük kardeşin seni tribünden izlemek için yanıp tutuşuyor.`,
    o:[['Bilet ve forma ayarla',()=>{G.p.money=Math.max(0,G.p.money-E2U(150));bump('morale',6);return 'Kardeşin tribünde formanla seni izledi. Moralin yükseldi.';}],
       ['Bu sefer olmaz',()=>{bump('morale',-3);return 'Kardeşin üzüldü.';}]]},
  dugun:{c:()=>isPl()&&G.p.age>=18,title:'Kuzeninin düğünü',body:()=>`Kuzeninin düğünü maç haftasına denk geldi. Tüm aile seni bekliyor.`,
    o:[['Git, erken ayrıl',()=>{bump('energy',-6);bump('morale',6);return 'Aileyle güzel bir gece geçirdin.';}],
       ['Sabaha kadar eğlen',()=>{bump('energy',-16);bump('morale',10);if(Math.random()<0.4){const im=imInit();im.v=clamp(im.v-4,0,100);msg('gundem','Düğünde dans videosu',`${meNs('gen')} düğünde sabaha kadar eğlendiği video sosyal medyada yayıldı.`);return 'Video yayıldı, hoca pek hoş karşılamadı.';}return 'Unutulmaz bir geceydi.';}],
       ['Gitme',()=>{bump('morale',-5);return 'Ailen kırıldı ama dinlenmiş olarak maça çıkacaksın.';}]]},
  aileEv:{c:()=>isPl()&&G.p.age>=19&&G.p.money>E2U(60000),title:'Ailene ev',body:()=>`Ailen daha büyük bir eve taşınmak istiyor. Yardım etmek ister misin? (yaklaşık ${eur(50000)})`,
    o:[['Evi al',()=>{G.p.money-=E2U(50000);bump('morale',10);const im=imInit();im.v=clamp(im.v+3,0,100);return 'Ailen yeni evine taşındı. Basın da bu jesti övdü.';}],
       ['Şimdi değil',()=>{bump('morale',-2);return 'Ailen anlayışla karşıladı.';}]]}});
function viewRout(){const r=rtInit(),p=G.p,im=imInit();
  return `<h2 class="h">Saha dışı yaşam</h2><div class="fin-kpi"><div><span>Kondisyon</span><b>${Math.round(p.energy)}</b></div><div><span>Moral</span><b>${Math.round(p.morale)}</b></div><div><span>İmaj</span><b>${Math.round(im.v)}</b><small>${imTxt(im.v)}</small></div><div><span>Sakatlık riski</span><b>${rtInjF()>1?'Yüksek':rtInjF()<1?'Düşük':'Normal'}</b><small>×${dec(rtInjF()*(hasPk('demir')?0.7:1),2)}</small></div></div>
  ${Object.entries(RT).map(([g,[n,opts]])=>`<section class="panel"><p class="sub-h"><span>${n}</span></p><div class="seg">${opts.map(([v,l,d])=>`<button class="chip" data-act="rtSet" data-g="${g}" data-v="${v}" aria-pressed="${r[g]===v}">${l}${d?`<small>${d}</small>`:''}</button>`).join('')}</div></section>`).join('')}
  <section class="panel"><p class="sub-h"><span>Hayır işleri ve imaj</span></p><p class="muted">Bir yardım kampanyasına destek olursan imajın ve şöhretin artar (ayda bir).</p><button class="btn" data-act="charity">Bağış yap (${eur(Math.max(1000,Math.round(U2E(p.money)*0.02/100)*100))})</button></section>`;}
ACTX.charity=()=>{const im=imInit(),p=G.p;if(im.ch&&absDay()-im.ch<30)return toast('Bu ay zaten bağış yaptın');const c=Math.max(1000,Math.round(U2E(p.money)*0.02/100)*100);if(!gbPay(c))return toast('Bakiyen yetmiyor');im.ch=absDay();im.v=clamp(im.v+6,0,100);p.fame=clamp(p.fame+1,0,100);msg('gundem',`${p.name}’den anlamlı bağış`,`${p.name}, bir eğitim kampanyasına ${eur(c)} bağışladı.`);save();render();toast('Bağışın basında olumlu yankı uyandırdı');};

/* ---------- imaj ve sponsorluk ---------- */
function imInit(){const p=G.p;p.im=p.im||{v:55,deals:[],offers:[],ch:0};return p.im;}
const imTxt=v=>v>=80?'Örnek sporcu':v>=60?'Sevilen':v>=40?'Normal':v>=25?'Tartışmalı':'Skandallarla anılıyor';
function imHit(x){const im=imInit();im.v=clamp(im.v-x*(hasPk('medya')?0.5:1),0,100);}
const SPN=[['kartal','Kartal Spor','Krampon ve forma',5,150,40],['lezzet','Lezzet Burger','Fast food',10,300,30],['tempo','Tempo Enerji','Enerji içeceği',15,400,45],['pixel','PixelPlay','Video oyunu',25,800,35],['atlas','Atlas Saat','Lüks saat',30,1200,55],['nova','Nova Telekom','Telekom',40,2500,50],['ruzgar','Rüzgar Otomotiv','Otomobil',55,6000,60],['zirve','Zirve Bank','Banka',65,10000,65]];
function spnPay(s){return Math.round(E2U(s[4]*(1+G.p.fame/25))/50)*50;}
function spnWeek(){const im=imInit(),p=G.p;let pay=0;
  for(const d of im.deals.slice()){const s=SPN.find(x=>x[0]===d.id);if(!s)continue;if(im.v<s[5]-5){im.deals.splice(im.deals.indexOf(d),1);msg('gundem',`${s[1]} sponsorluğu bitirdi`,`${s[1]}, imaj maddesine dayanarak ${p.name} ile yaptığı sözleşmeyi feshetti.`);continue;}
    pay+=d.pay;d.w--;if(d.w<=0){im.deals.splice(im.deals.indexOf(d),1);msg('event',`${s[1]} anlaşması sona erdi`,'Sözleşme süresi doldu; yeni teklifler gelebilir.');}}
  if(pay){p.money+=pay;if(Math.random()<0.25){p.energy=clamp(p.energy-5,0,100);msg('event','Reklam çekimi',`Sponsor yükümlülüğü: bir gün boyunca reklam çekimindeydin (kondisyon −5). Bu hafta sponsor geliri ${money(pay)}.`);}}
  im.offers=im.offers.filter(o=>o.until>absDay());
  if(im.deals.length+im.offers.length<4&&Math.random()<0.22){const el=SPN.filter(s=>p.fame>=s[3]&&im.v>=s[5]&&!im.deals.some(d=>d.id===s[0])&&!im.offers.some(o=>o.id===s[0]));if(el.length){const s=el[Math.floor(Math.random()*Math.min(3,el.length))+Math.max(0,el.length-3)]||pick(el);const o={id:s[0],pay:spnPay(s),w:rint(1,3)*52,until:absDay()+28};im.offers.push(o);msg('offer',`Sponsorluk teklifi: ${s[1]}`,`${s[1]} (${s[2]}) haftalık ${money(o.pay)} karşılığında ${o.w/52} yıllık reklam yüzü olmanı istiyor. Kariyer › Menajer ve sponsorlar ekranından yanıtla.`);}}}
ACTX.spnAcc=el=>{const im=imInit(),o=im.offers.find(x=>x.id===el.dataset.k);if(!o)return;if(im.deals.length>=3)return toast('En fazla 3 sponsor anlaşması');im.offers.splice(im.offers.indexOf(o),1);im.deals.push({id:o.id,pay:o.pay,w:o.w});const ag=agOf();if(ag){const c=Math.round(o.pay*4*ag.com);G.p.money-=c;}save();render();toast('Sponsorluk anlaşması imzalandı');};
ACTX.spnDec=el=>{const im=imInit();im.offers=im.offers.filter(x=>x.id!==el.dataset.k);save();render();};
/* skandallar imaja yansır */
if(typeof gbPressCheck==='function')gbPressCheck=(old=>function(){const h=G&&G.gb?G.gb.heat:0;const r=old.apply(this,arguments);try{if(G.p&&G.gb&&G.gb.heat<h-20)imHit(8);}catch(e){}return r;})(gbPressCheck);
if(typeof betCaught==='function')betCaught=(old=>function(){try{if(G.p){imHit(35);const im=imInit();for(const d of im.deals){const s=SPN.find(x=>x[0]===d.id);if(s)msg('gundem',`${s[1]} desteğini çekti`,'Bahis skandalının ardından sponsor anlaşmayı feshetti.');}im.deals=[];im.offers=[];}}catch(e){}return old.apply(this,arguments);})(betCaught);

/* ---------- kişisel menajer ---------- */
const AGN=[{id:'aile',n:'Babanın tavsiyeleri',d:'Menajersiz: komisyon yok, pazarlık gücü ve bağlantı yok.',com:0,pow:0,net:0,hon:1,fame:0},
  {id:'kuzen',n:'Kuzen Menajerlik',d:'Kuzenin işi yeni öğreniyor. Ucuz ama etkisiz.',com:0.03,pow:0.04,net:0.5,hon:0.97,fame:0},
  {id:'bogazici',n:'Boğaziçi Sports Management',d:'Dürüst, Türkiye’de güçlü bağlantılar.',com:0.08,pow:0.12,net:1.5,hon:0.95,fame:10},
  {id:'yildiz',n:'Yıldız Futbol Ajansı',d:'Agresif pazarlıkçı, kulüpleri sık arar.',com:0.10,pow:0.18,net:2.5,hon:0.85,fame:20},
  {id:'elite',n:'Elite Football Group',d:'Avrupa’da geniş ağ. Yüksek komisyon, bazen kendi çıkarını kollar.',com:0.14,pow:0.27,net:3.5,hon:0.62,fame:40},
  {id:'global',n:'Global Stars Agency',d:'Yıldızların menajeri. En iyi maaşları alır ama gizli anlaşmalarıyla bilinir.',com:0.15,pow:0.32,net:4,hon:0.45,fame:55}];
function agOf(){const p=G&&G.p;if(!p||!p.ag)return null;return AGN.find(a=>a.id===p.ag.id)||null;}
ACTX.agSign=el=>{const a=AGN.find(x=>x.id===el.dataset.k),p=G.p;if(!a)return;if(p.fame<a.fame)return toast('Bu ajans henüz seninle ilgilenmiyor');const cur=agOf();let fee=0;if(cur&&cur.id!=='aile'&&!(p.ag.rev)&&absDay()-p.ag.since<365)fee=G.contract.wage*4;if(fee&&p.money<fee)return toast('Sözleşme fesih bedeli için paran yetmiyor');p.money-=fee;
  p.ag={id:a.id,since:absDay()};msg('event',`Yeni menajer: ${a.n}`,`${a.n} ile çalışmaya başladın.${fee?` Eski menajerine ${money(fee)} fesih bedeli ödedin.`:''}`);save();render();toast(a.n+' artık menajerin');};
makeOffer=(old=>function(){const o=old.apply(this,arguments);try{const a=isPl()&&agOf();if(a&&a.pow&&o&&!o.loan){o.wage=Math.round(o.wage*(1+a.pow)/50)*50;o.bonus=Math.round((o.bonus||0)*(1+a.pow*0.8)/100)*100;}}catch(e){}return o;})(makeOffer);
genOffers=(old=>function(kind){const n=old.apply(this,arguments);try{const a=isPl()&&agOf();if(a&&kind==='end'&&Math.random()>a.hon){const open=G.inbox.filter(m=>m.offer&&m.offer.status==='open'&&!m.offer.renew).map(m=>m.offer);if(open.length>=2){const o=open.sort((x,y)=>CLUBS[x.club].str-CLUBS[y.club].str)[0];o.agRec=1;msg('offer','Menajerinin tavsiyesi',`${a.n}: “${CLUBS[o.club].name} teklifini kabul et, kariyerin için en doğru adım bu. Diğerlerini unut.”`);}}}catch(e){}return n;})(genOffers);
acceptOffer=(old=>function(o){const r=old.apply(this,arguments);try{const a=isPl()&&agOf();if(a&&o&&o.status==='accepted'){const c=Math.round(o.wage*4*a.com);G.p.money-=c;if(c>0)msg('event','Menajer komisyonu',`${a.n}, imza için ${money(c)} komisyon aldı.`);if(o.agRec)G.p.ag.kick={club:o.club,at:absDay()+rint(35,80)};}}catch(e){console.warn(e);}return r;})(acceptOffer);
function agWeek(){const a=agOf(),p=G.p;if(!a||a.id==='aile')return;const c=Math.round(G.contract.wage*a.com);p.money-=c;
  if(Math.random()<a.net*0.05){const ct=curLeague().tier,cand=Object.values(CLUBS).filter(c=>c.id!==G.club&&LEAGUES[c.league]&&!LEAGUES[c.league].youth&&Math.abs(LEAGUES[c.league].tier-ct)<=2&&eligible(LEAGUES[c.league],p.age));if(cand.length){const c=pick(cand);const w=G.watch[c.id]=G.watch[c.id]||{i:0,lv:0};w.i=Math.min(100,w.i+rint(6,14));w.lv=WLV.filter(t=>w.i>=t).length;msg('offer','Menajerinden haber',`${a.n}: “${c.name} yöneticileriyle görüştüm, seni yakından takip edecekler.”`);}}
  const K=p.ag.kick;if(K&&!K.done&&absDay()>=K.at){K.done=1;p.ag.rev=1;imHit(4);msg('gundem','Menajer skandalı',`${CLUBS[K.club]?CLUBS[K.club].name:'Bir kulüp'} transferinde menajerin ${a.n} kulüpten gizli komisyon almış. Seni kendi çıkarı için yönlendirmiş. Artık menajerini bedelsiz değiştirebilirsin.`);}}

/* ---------- takım arkadaşları ve rekabet ---------- */
function tmInit(){const p=G.p;p.tm=p.tm||{rel:{}};return p.tm;}
function tmMates(){if(!G||!G.club)return [];return squadOf(G.club).filter(x=>x.name!==G.p.name);}
function tmRel(k){const t=tmInit();if(t.rel[k]==null)t.rel[k]=Math.round(45+(hash(k)%21)-10);return t.rel[k];}
function tmAdd(k,v){const t=tmInit();t.rel[k]=clamp(tmRel(k)+v*(v>0&&hasPk('lider')?1.4:1),0,100);}
function tmRival(){const M=tmMates().filter(x=>x.pos===G.p.pos);if(!M.length)return null;const o=OVR();return M.sort((a,b)=>Math.abs(a.ovr-o)-Math.abs(b.ovr-o))[0];}
function tmFriendOnPitch(){const M=tmMates().filter(x=>x.pos!=='KL'&&x.pos!=='DF');return M.find(x=>tmRel(x.k)>=75)||null;}
const TM_ACT=[['sohbet','Sohbet',0,'Sohbet et: ilişki +3'],['yemek','Yemek',250,'Yemeğe davet et: ilişki +8'],['idman','İdman',0,'Birlikte ekstra idman: ilişki +5, kondisyon −6, gelişim'],['laf','Laf sok',0,'Laf sok: ilişki −15, moral +2']];
ACTX.tmAct=el=>{const k=el.dataset.k,a=el.dataset.a,M=tmMates().find(x=>x.k===k);if(!M)return;if(G.slot)return toast('Bugünün serbest zamanını kullandın');const A=TM_ACT.find(x=>x[0]===a);if(A[2]&&!gbPay(A[2]))return toast('Bakiyen yetmiyor');let t='';
  if(a==='sohbet'){tmAdd(k,3);t=`${M.name} ile sohbet ettin`;}else if(a==='yemek'){tmAdd(k,8);bump('morale',2);t=`${M.name} ile yemekteydiniz`;}
  else if(a==='idman'){tmAdd(k,5);bump('energy',-6);const f=(G.plan&&G.plan.focus)||'sut';const g=gainAttr(f,0.05);t=`${M.name} ile ekstra idman: ${ATTR[f]} +${dec(g,2)}`;}
  else if(a==='laf'){tmAdd(k,-15);bump('morale',2);t=`${M.name} ile aranız bozuldu`;if(Math.random()<0.3){bump('trust',-3);msg('coach','Soyunma odasında gerginlik',`Hoca, ${M.name} ile aranızdaki gerginliği fark etti: “Takımın huzurunu bozmayın.”`);}}
  G.slot=true;G.slotText=t;save();render();toast(t);};
function tmWeek(){const M=tmMates();if(!M.length)return;const t=tmInit();let fr=0,en=0;for(const x of M){const r=tmRel(x.k);if(r>=70)fr++;if(r<=25)en++;t.rel[x.k]=r+(50-r)*0.02;}
  bump('morale',Math.min(3,fr*0.6)-Math.min(3,en*0.8));
  if(Math.random()<0.18){const x=pick(M),r=tmRel(x.k);if(r<=30){tmAdd(x.k,-5);bump('morale',-3);msg('event','Soyunma odasında tartışma',`${x.name} ile antrenmanda sert bir tartışma yaşadınız.`);}else if(r>=60){tmAdd(x.k,4);msg('event','Takım arkadaşından jest',`${x.name} seni ailesiyle akşam yemeğine davet etti. Aranız iyice ısındı.`);}}
  const R=tmRival();if(R&&Math.random()<0.25){const o=OVR();if(R.ovr>o+1){bump('trust',-1.5);msg('coach','Forma rekabeti',`Forma rakibin ${R.name} antrenmanlarda parlıyor. Hoca onu daha çok deniyor; sahada fark yaratman lazım.`);}else if(R.ovr<o-1){bump('trust',1);tmAdd(R.k,-3);msg('coach','Forma rekabeti',`${R.name} formayı sana kaptırdığı için huzursuz. Hoca senden yana.`);}}}
function viewMates(){const M=tmMates().sort((a,b)=>tmRel(b.k)-tmRel(a.k)),R=tmRival(),o=OVR();
  return `<h2 class="h">Takım arkadaşları</h2>${R?`<section class="panel rival"><p class="sub-h"><span>Forma rakibin</span><span>${esc(POS_TR[R.pos]||R.pos)}</span></p><div class="rv"><div><b>${esc(G.p.name)}</b><small>Güç ${R200(Math.round(o))} · Form ${dec(formAvg()||0,1)}</small></div><em>vs</em><div><b data-act="pcard" data-id="${G.club}" data-k="${R.k}" class="clk">${esc(R.name)}</b><small>Güç ${R200(R.ovr)} · ${R.age} yaş · ilişki ${Math.round(tmRel(R.k))}</small></div></div><p class="muted">${R.ovr>o+1?'Rakibin şu an önde; iyi maçlar ve antrenmanla formayı kapmalısın.':R.ovr<o-1?'Formada avantaj sende. Rahatlarsan rakibin fırsat kollar.':'Kıyasıya bir rekabet var.'}</p></section>`:''}
  <section class="panel"><p class="sub-h"><span>Soyunma odası</span><span>${M.filter(x=>tmRel(x.k)>=70).length} dost · ${M.filter(x=>tmRel(x.k)<=25).length} küs</span></p><p class="muted">Her gün serbest zamanında bir arkadaşınla vakit geçirebilirsin (Sohbet: ilişki +3 · Yemek: +8 · İdman: +5 ve gelişim · Laf sok: −15). Yakın dostunla aynı hücum hattında oynarsan uyumunuz ekstra pozisyon getirir.</p>
  <div class="tm-l">${M.map(x=>{const r=tmRel(x.k);return `<div class="tm-r"><div class="tm-n"><b>${esc(x.name)}</b><small>${esc(POS_TR[x.pos]||x.pos)} · ${x.age} yaş · güç ${R200(x.ovr)}${R&&R.k===x.k?' · <em class="pill red">rakip</em>':''}</small></div><div class="bar tm-b"><i class="${r>=70?'':r>=40?'mid':'low'}" style="width:${r}%"></i></div><span class="tm-v">${r>=70?'Dost':r<=25?'Küs':Math.round(r)}</span><div class="tm-a">${TM_ACT.map(([a,l,c,d])=>`<button class="btn sm" data-act="tmAct" data-k="${x.k}" data-a="${a}" title="${d}">${l}${c?' · '+eur(c):''}</button>`).join('')}</div></div>`;}).join('')}</div></section>`;}

/* ---------- menajer ve sponsor ekranı ---------- */
function viewAgent(){const p=G.p,a=agOf()||AGN[0],im=imInit();
  return `<h2 class="h">Menajer ve sponsorlar</h2><div class="fin-kpi"><div><span>Menajerin</span><b style="font-size:16px">${esc(a.n)}</b><small>Komisyon %${Math.round(a.com*100)}</small></div><div><span>İmaj</span><b>${Math.round(im.v)}</b><small>${imTxt(im.v)}</small></div><div><span>Şöhret</span><b>${Math.round(p.fame)}</b></div><div><span>Haftalık sponsor geliri</span><b>${money(im.deals.reduce((s,d)=>s+d.pay,0))}</b></div></div>
  <div class="tr-grid"><section class="panel"><p class="sub-h"><span>Ajanslar</span></p><ul class="ag-l">${AGN.map(x=>`<li class="${x.id===a.id?'me':''}"><div><b>${esc(x.n)}</b><p>${esc(x.d)}</p><small>Komisyon %${Math.round(x.com*100)} · Pazarlık ${'●'.repeat(Math.round(x.pow*15))||'—'} · Bağlantı ${'●'.repeat(Math.round(x.net))||'—'}${x.fame?` · şöhret ${x.fame}+`:''}</small></div>${x.id===a.id?'<span class="pill good">Menajerin</span>':`<button class="btn sm" data-act="agSign" data-k="${x.id}" ${p.fame<x.fame?'disabled':''}>Anlaş</button>`}</li>`).join('')}</ul>
   <p class="muted">Menajer tekliflerdeki maaşı ve imza parasını artırır, kulüplerle görüşüp ilgiyi büyütür; karşılığında maaşından ve imzalardan komisyon alır. Bazı menajerler seni kendi çıkarı için yanlış kulübe yönlendirebilir. İlk yıl içinde menajer değiştirmek 4 haftalık maaşın kadar fesih bedeli ister.${p.ag&&p.ag.rev?' <b>Menajerinin gizli komisyonu ortaya çıktı; bedelsiz değiştirebilirsin.</b>':''}</p></section>
  <section class="panel"><p class="sub-h"><span>Sponsorluklar</span><span>${im.deals.length}/3</span></p>${im.deals.length?`<ul class="cupres">${im.deals.map(d=>{const s=SPN.find(x=>x[0]===d.id);return `<li><span>${esc(s[2])}</span><b>${esc(s[1])}</b><em>${money(d.pay)}/hf · ${Math.ceil(d.w/52*10)/10} yıl</em></li>`;}).join('')}</ul>`:'<p class="muted">Henüz sponsorun yok. Şöhretin ve imajın arttıkça markalar kapını çalar.</p>'}
   ${im.offers.length?`<p class="sub-h"><span>Teklifler</span></p>${im.offers.map(o=>{const s=SPN.find(x=>x[0]===o.id);return `<div class="spn-o"><div><b>${esc(s[1])}</b><small>${esc(s[2])} · ${money(o.pay)}/hafta · ${o.w/52} yıl · imaj şartı ${s[5]}</small></div><button class="cta sm" data-act="spnAcc" data-k="${o.id}">Kabul</button><button class="btn sm" data-act="spnDec" data-k="${o.id}">Reddet</button></div>`;}).join('')}`:''}
   <p class="muted">Skandallar (kumar, gece hayatı, kırmızı kartlar) imajını düşürür; imaj sponsorun şartının altına inerse anlaşma feshedilir.</p></section></div>`;}

/* ---------- haftalık işleyiş ve kayıt ---------- */
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.p&&isPl()&&G.phase==='season'){rtDay();const wk=wkKey();if(G.p.lastWk!==wk){G.p.lastWk=wk;spnWeek();agWeek();tmWeek();if(rtInit().bes==='s')G.p.money-=E2U(150);if(rtInit().bes==='f'&&G.p.a.fiz>20)G.p.a.fiz-=0.05;}}}catch(e){console.warn(e);}return out;})(nextDay);
Object.assign(XV,{perk:()=>{TAB='hub';return viewHub();},rout:()=>viewRout(),mates:()=>viewMates(),agent:()=>viewAgent()});
XICON.perk=NI('<path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18 22l-6-3.6L6 22l1.5-7.3L2 10l7.1-1.1z"/>');XICON.rout=NI('<path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/>');XICON.mates=NI('<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M15 14c4 0 7 2 7 5"/>');XICON.agent=NI('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3"/>');
for(const k of ['perk','rout','mates','agent'])NICON[k]=XICON[k];
xtabs=(old=>function(){const L=old.apply(this,arguments);if(G&&G.phase!=='tryout'&&isPl()&&G.p&&G.s)L.push(['mates','Arkadaşlar'],['rout','Saha dışı'],['agent','Menajer']);return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(isPl()){const o=C.find(x=>x[0]==='Oyuncu'),k=C.find(x=>x[0]==='Kariyer'),xs=xtabs().map(x=>x[0]);if(o&&xs.includes('mates'))o[1].push(['mates','Takım arkadaşları',{tab:'mates'}],['rout','Saha dışı yaşam',{tab:'rout'}]);if(k&&xs.includes('agent'))k[1].splice(1,0,['agent','Menajer ve sponsorlar',{tab:'agent'}]);}}catch(e){}return C;})(navCats);

