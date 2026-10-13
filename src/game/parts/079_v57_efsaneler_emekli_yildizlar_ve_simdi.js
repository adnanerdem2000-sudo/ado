/* ================= v57: Efsaneler — emekli yıldızlar ve şimdi ne yapıyorlar ================= */
/* oyun başında emekli olan gerçek efsaneler (2026 yazı itibarıyla) */
const LEG_SEED=[
 ['Zinédine Zidane','FRA','OS',1972,2006,['Cannes','Bordeaux','Juventus','Real Madrid'],'1998 Dünya Kupası, 1998 Ballon d’Or, 3 kez UEFA en iyi oyuncusu. TD olarak 3 Şampiyonlar Ligi.','td',null],
 ['Xavi Hernández','ESP','OS',1980,2019,['Barcelona','Al Sadd'],'2010 Dünya Kupası, 2 Avrupa Şampiyonası, 4 Şampiyonlar Ligi.','td',null],
 ['Andrea Pirlo','ITA','OS',1979,2017,['Brescia','Inter','Milan','Juventus','New York City'],'2006 Dünya Kupası, 2 Şampiyonlar Ligi.','td',null],
 ['Steven Gerrard','ENG','OS',1980,2016,['Liverpool','LA Galaxy'],'2005 İstanbul mucizesinin kaptanı.','td',null],
 ['Emre Belözoğlu','TUR','OS',1980,2020,['Galatasaray','Inter','Newcastle','Fenerbahçe','Atlético Madrid','Başakşehir'],'2002 Dünya Kupası üçüncülüğü, 2000 UEFA Kupası.','td',null],
 ['Volkan Demirel','TUR','KL',1981,2019,['Kartalspor','Fenerbahçe'],'Fenerbahçe’nin efsanevi kalecisi, 2008 Avrupa Şampiyonası yarı finalisti.','td',null],
 ['Arda Turan','TUR','KN',1987,2022,['Galatasaray','Atlético Madrid','Barcelona','Başakşehir'],'Atlético ile La Liga şampiyonluğu, milli takım kaptanlığı.','tdx','Shakhtar Donetsk teknik direktörü'],
 ['Gheorghe Hagi','ROU','OS',1965,2001,['Steaua','Real Madrid','Barcelona','Galatasaray'],'“Karpatların Maradonası”, 2000 UEFA Kupası.','tdx','Farul Constanța’nın sahibi ve teknik direktörü'],
 ['Fernando Torres','ESP','FW',1984,2019,['Atlético Madrid','Liverpool','Chelsea','Milan','Sagan Tosu'],'2010 Dünya Kupası, 2012 Şampiyonlar Ligi.','tdx','Atlético Madrid B takımının teknik direktörü'],
 ['Andrés Iniesta','ESP','OS',1984,2024,['Barcelona','Vissel Kobe','Emirates Club'],'2010 Dünya Kupası finalinin golcüsü.','yrdx','Antrenörlük eğitimini sürdürüyor, kendi akademisini yönetiyor'],
 ['Arjen Robben','NED','KN',1984,2021,['Groningen','PSV','Chelsea','Real Madrid','Bayern München'],'2013 Şampiyonlar Ligi finalinin golcüsü.','yrdx','Groningen gençlik takımlarında antrenör'],
 ['Thierry Henry','FRA','FW',1977,2014,['Monaco','Juventus','Arsenal','Barcelona','New York Red Bulls'],'Arsenal’in tüm zamanların golcüsü, 1998 Dünya Kupası.','tv',null],
 ['Wayne Rooney','ENG','FW',1985,2021,['Everton','Manchester United','DC United','Derby County'],'Manchester United’ın tüm zamanların golcüsü.','tv',null],
 ['Bastian Schweinsteiger','GER','OS',1984,2019,['Bayern München','Manchester United','Chicago Fire'],'2014 Dünya Kupası, 2013 Şampiyonlar Ligi.','tv',null],
 ['Wesley Sneijder','NED','OS',1984,2019,['Ajax','Real Madrid','Inter','Galatasaray','Nice','Al Gharafa'],'2010’da Inter ile üçleme, Galatasaray’da 2 şampiyonluk.','tv',null],
 ['Rüştü Reçber','TUR','KL',1973,2012,['Antalyaspor','Fenerbahçe','Barcelona','Beşiktaş'],'2002 Dünya Kupası’nda turnuvanın en iyi 11’i.','tv',null],
 ['Gianluigi Buffon','ITA','KL',1978,2023,['Parma','Juventus','PSG'],'2006 Dünya Kupası, 10 Serie A şampiyonluğu.','sdx','İtalya Milli Takımı’nın heyet başkanı'],
 ['Philipp Lahm','GER','DF',1983,2017,['Bayern München','Stuttgart'],'2014 Dünya Kupası’nı kaldıran kaptan.','sdx','Futbol yöneticisi ve organizatör'],
 ['Kaká','BRA','OS',1982,2017,['São Paulo','Milan','Real Madrid','Orlando City'],'2007 Ballon d’Or, 2002 Dünya Kupası.','amb',null],
 ['Ronaldinho','BRA','OS',1980,2015,['Grêmio','PSG','Barcelona','Milan','Flamengo','Atlético Mineiro'],'2005 Ballon d’Or, 2006 Şampiyonlar Ligi.','amb',null],
 ['Francesco Totti','ITA','OS',1976,2017,['Roma'],'Tek forma, 25 sezon: Roma’nın sembolü.','quit',null],
 ['Didier Drogba','CIV','FW',1978,2018,['Le Mans','Guingamp','Marseille','Chelsea','Galatasaray','Montreal Impact','Phoenix Rising'],'2012 Şampiyonlar Ligi finalinin kahramanı.','quitx','Vakıf çalışmalarına ve hayır işlerine odaklandı'],
 ['Iker Casillas','ESP','KL',1981,2020,['Real Madrid','Porto'],'2010 Dünya Kupası’nı kaldıran kaptan.','quitx','Futbolu tamamen bıraktı, iş insanı'],
 ['Hakan Şükür','TUR','FW',1971,2008,['Sakaryaspor','Bursaspor','Galatasaray','Torino','Inter','Parma','Blackburn'],'Türk milli takımının tüm zamanların golcüsü, 2000 UEFA Kupası.','quitx','Futbolu tamamen bıraktı, ABD’de yaşıyor'],
 ['Ronaldo Nazário','BRA','FW',1976,2011,['Cruzeiro','PSV','Barcelona','Inter','Real Madrid','Milan','Corinthians'],'2 Dünya Kupası, 2 Ballon d’Or.','quitx','İş insanı ve futbol yatırımcısı'],
 ['Paolo Maldini','ITA','DF',1968,2009,['Milan'],'5 Şampiyonlar Ligi, tek kulüp efsanesi.','quit',null],
 ['Alex de Souza','BRA','OS',1977,2014,['Coritiba','Palmeiras','Cruzeiro','Fenerbahçe'],'Fenerbahçe’nin “Kral”ı, Kadıköy’de heykeli var.','td',null]];
const LEG_JOB={td:'Teknik direktör',tdx:'Teknik direktör',yrd:'Yardımcı antrenör',yrdx:'Antrenör',sd:'Sportif direktör',sdx:'Yönetici',tv:'TV yorumcusu',amb:'Kulüp elçisi',quit:'Futbolu bıraktı',quitx:'Futbolu bıraktı'};
const LEG_QUIT=['kendi restoranını işletiyor','memleketinde çiftlik kurdu','gayrimenkul işine girdi','ailesiyle sessiz bir hayat sürüyor','golfe merak sardı, amatör turnuvalara katılıyor','kendi adını taşıyan vakfı yönetiyor','spor giyim markası kurdu','çocuklar için futbol okulu açtı'];
const LEG_TV={TUR:'beIN Sports yorumcusu',ENG:'Sky Sports yorumcusu',ESP:'Movistar+ yorumcusu',ITA:'DAZN yorumcusu',GER:'Sky Deutschland yorumcusu',FRA:'Canal+ yorumcusu',BRA:'TV Globo yorumcusu',NED:'NOS yorumcusu',POR:'Sport TV yorumcusu'};
const FORMS_L=['4-3-3','4-2-3-1','4-4-2','3-5-2','4-1-4-1'];
function legInit(){if(!G)return {};G.leg=G.leg||{};if(!G.legSeed){G.legSeed=1;const Y=G.s?G.s.year:2026;G.coFree=G.coFree||[];
    for(const [n,nat,pos,by,ry,clubs,hl,job,txt] of LEG_SEED){const k='L:'+n;G.leg[k]={k,n,nat,pos,by,ret:ry,clubs,hl,job,txt,seed:1,ev:[[ry,'Futbolu bıraktı.']]};
      if(job==='td'&&!G.coFree.some(c=>c.n===n))G.coFree.push({n,nat,by,f:FORMS_L[hash(n)%FORMS_L.length],since:Y,tr:[],real:true,leg:k});}}
  return G.leg;}
/* oyun içinde emekli olan yıldızları arşivle */
function legArchive(old,at,o){const L=legInit(),k=old.k;if(L[k])return;const r=srng(k+'job');r();const x=r(),Y=G.s.year;
  let C=null;try{C=careerOf(Object.assign({},old,o));}catch(e){}
  const rows=C?C.rows.filter(z=>!z.cur).map(z=>[z.y,z.cid,z.ap,z.g,z.a,Math.round((z.rt||0)*100)]):[],tx=C?C.tx.map(e=>[e.y,e.from,e.to,e.fee||0,e.loan?1:0,e.free?1:0]):[];
  const peak=Math.max(o.ovr,...Object.values((G.ovh&&G.ovh[k])||{}).map(Number).filter(v=>!isNaN(v)));
  const clubIds=[...new Set(rows.map(z=>z[1]).filter(id=>CLUBS[id]))];if(!clubIds.includes(at)&&CLUBS[at])clubIds.push(at);
  const iq=old.pos==='OS'||old.pos==='KL'?0.12:0;const job=x<0.3+iq?'td':x<0.48+iq?'yrd':x<0.55+iq?'sd':x<0.7?'tv':x<0.77?'amb':'quit';
  const leg={k,n:old.name,nat:old.nat,pos:old.pos,by:Y-(o.age||old.ret||34),ret:Y,clubs:clubIds,club:at,peak,rows,tx,job,txt:null,ev:[[Y,`${CLUBS[at]?CLUBS[at].name:''} formasıyla futbolu bıraktı.`]],ng:!!old.ng};
  if(job==='td'){G.coFree=G.coFree||[];G.coFree.push({n:old.name,nat:old.nat||'TUR',by:leg.by,f:FORMS_L[Math.floor(r()*FORMS_L.length)],since:Y+1,tr:[],real:true,leg:k});leg.ev.push([Y,'Antrenörlük lisansını tamamladı, teknik direktörlük teklifi bekliyor.']);}
  else if(job==='yrd'){leg.jc=at;leg.ev.push([Y,`${CLUBS[at]?CLUBS[at].name:''} teknik ekibine yardımcı antrenör olarak katıldı.`]);}
  else if(job==='sd'){leg.jc=at;leg.ev.push([Y,`${CLUBS[at]?CLUBS[at].name:''} sportif direktörü oldu.`]);}
  else if(job==='amb'){leg.jc=at;leg.ev.push([Y,`${CLUBS[at]?CLUBS[at].name:''} kulüp elçisi oldu.`]);}
  else if(job==='tv'){leg.ev.push([Y,'Televizyonda yorumculuğa başladı.']);}
  else{leg.qt=LEG_QUIT[Math.floor(r()*LEG_QUIT.length)];leg.ev.push([Y,`Futbol dünyasından tamamen uzaklaştı; ${leg.qt}.`]);}
  L[k]=leg;return leg;}
retireNews=(old=>function(){const r=old.apply(this,arguments);try{legInit();const Y=G.s.year,ids=new Set([...Object.keys(SQ_REAL),G.club]),got=[];
    for(const id of ids){const c=CLUBS[id];if(!c||LEAGUES[c.league].youth)continue;baseSquad(id).forEach((b,i)=>{const gs=slotGens(id,i),last=gs[gs.length-1];if(last.g>0&&last.start===Y){const old=gs[gs.length-2],at=(G.tx&&G.tx[old.k])||id;const o=ageP(Object.assign({},old));
      const real=SQ_REAL[id]&&!old.regen&&!old.g;if(o.ovr>=82||(real&&o.ovr>=78)){const L=legArchive(old,at,o);if(L)got.push(L);}}});}
    if(got.length){const top=got.slice().sort((a,b)=>b.peak-a.peak).slice(0,6);msg('gundem','Efsaneler salonuna yeni isimler',`${top.map(x=>`${x.n} (${LEG_JOB[x.job].toLowerCase()})`).join(', ')}… Emekli yıldızların şimdi ne yaptığını Efsaneler sayfasından takip edebilirsin.`);}}catch(e){console.warn(e);}return r;})(retireNews);
/* her sezon: kariyer yolları ilerler */
function legClubOfCoach(n){if(!G||!G.co)return null;for(const [id,c] of Object.entries(G.co))if(c&&c.n===n&&CLUBS[id])return id;return null;}
function legSeason(){const L=legInit(),Y=G.s?G.s.year:2026;if(G.legY===Y)return;G.legY=Y;G.coFree=G.coFree||[];
  for(const x of Object.values(L)){const r=srng(x.k+'yr'+Y);r();const v=r();
    if(x.job==='td'||x.job==='tdx'&&false){const cid=legClubOfCoach(x.n);if(cid&&x.hc!==cid){x.hc=cid;x.ev.push([Y,`${CLUBS[cid].name} teknik direktörlüğüne getirildi.`]);}
      else if(!cid&&x.hc){x.ev.push([Y,`${CLUBS[x.hc]?CLUBS[x.hc].name:''} ile yolları ayrıldı.`]);x.hc=null;if(!G.coFree.some(c=>c.n===x.n))G.coFree.push({n:x.n,nat:x.nat||'TUR',by:x.by,f:FORMS_L[hash(x.n)%FORMS_L.length],since:Y,tr:[],real:true,leg:x.k});}}
    else if(x.job==='yrd'&&v<0.22&&!x.seed){x.job='td';x.ev.push([Y,'Yardımcılıktan sonra ilk teknik direktörlük deneyimine hazır.']);if(!G.coFree.some(c=>c.n===x.n))G.coFree.push({n:x.n,nat:x.nat||'TUR',by:x.by,f:FORMS_L[hash(x.n)%FORMS_L.length],since:Y,tr:[],real:true,leg:x.k});}
    else if(x.job==='tv'&&v<0.08&&!x.seed){x.job='yrd';x.jc=x.club;x.ev.push([Y,`Yorumculuğu bırakıp ${CLUBS[x.club]?CLUBS[x.club].name:'eski kulübünün'} teknik ekibine katıldı.`]);}
    else if(x.job==='quit'&&v<0.04&&!x.seed){x.job='tv';x.ev.push([Y,'Yıllar sonra televizyonda yorumcu olarak futbola döndü.']);}
    if(x.ev.length>12)x.ev.splice(1,x.ev.length-12);}}
coachSeasonEnd=(old=>function(){const r=old.apply(this,arguments);try{legSeason();}catch(e){console.warn(e);}return r;})(coachSeasonEnd);
function legNow(x){const c=id=>CLUBS[id]?CLUBS[id].name:'';
  if(x.job==='td'){const cid=legClubOfCoach(x.n)||x.hc;return cid&&CLUBS[cid]?[`${c(cid)} teknik direktörü`,'td',cid]:['Teknik direktör · şu an boşta, teklif bekliyor','td',null];}
  if(x.job==='tdx')return [x.txt,'td',null];if(x.job==='yrdx'||x.job==='sdx'||x.job==='quitx')return [x.txt,x.job.slice(0,-1),null];
  if(x.job==='yrd')return [`${c(x.jc||x.club)||'Eski kulübünde'} yardımcı antrenörü`,'yrd',x.jc||x.club];
  if(x.job==='sd')return [`${c(x.jc||x.club)} sportif direktörü`,'sd',x.jc||x.club];
  if(x.job==='amb')return [`${x.seed?'Kulüp ve marka elçisi':c(x.jc||x.club)+' kulüp elçisi'}`,'amb',x.seed?null:(x.jc||x.club)];
  if(x.job==='tv')return [LEG_TV[x.nat]||'TV yorumcusu','tv',null];
  return [`Futbolu tamamen bıraktı${x.qt?' · '+x.qt:''}`,'quit',null];}
const LEG_F=[['','Tümü'],['td','Teknik direktör'],['yrd','Antrenör / yardımcı'],['med','Yorumcu ve yönetici'],['quit','Futbolu bıraktı']];
let LEGF='',LEGQ='';
ACTX.legF=el=>{LEGF=el.dataset.k;render();};
function legFace(x,sz){const age=(G&&G.s?G.s.year:2026)-x.by;const lk=lookOf('leg:'+x.n,x.nat||'TUR',Math.min(age,70),age>=45);return faceSVG(lk,{coach:true,c1:'#c9a227',c2:'#111',age});}
function viewLegends(){const L=Object.values(legInit()),Y=G.s?G.s.year:2026;
  const cat=x=>{const t=legNow(x)[1];return t==='td'?'td':t==='yrd'?'yrd':t==='quit'?'quit':'med';};
  const list=L.filter(x=>!LEGF||cat(x)===LEGF).sort((a,b)=>(b.seed?0:1)-(a.seed?0:1)||b.ret-a.ret||(b.peak||0)-(a.peak||0));
  const cnt=k=>L.filter(x=>!k||cat(x)===k).length;
  return `<h2 class="h">Efsaneler</h2><section class="panel"><p class="muted" style="margin:0 0 8px">Kramponlarını asan yıldızlar burada saklanır. Kimisi teknik direktör, kimisi yardımcı antrenör ya da yorumcu oldu, kimisi futbolu tamamen bıraktı. Oyun ilerledikçe emekli olan ünlü oyuncular da listeye eklenir ve kariyer yolları her sezon değişir.</p>
   <div class="filt">${LEG_F.map(([k,n])=>`<button class="chip" data-act="legF" data-k="${k}" aria-pressed="${LEGF===k}">${n} <em>${cnt(k)}</em></button>`).join('')}</div></section>
   <div class="leg-grid">${list.map(x=>{const [now,t,cid]=legNow(x),age=Y-x.by;return `<button class="leg-card" data-act="legOpen" data-k="${esc(x.k)}"><div class="leg-face">${legFace(x)}</div><div class="leg-tx"><b>${esc(x.n)}</b><small>${flagImg(x.nat,'fl-row')} ${age} yaş · ${POS_TR[x.pos]||x.pos} · ${x.ret}’te bıraktı</small><span class="leg-job j-${t}">${cid&&CLUBS[cid]?crestSVG(CLUBS[cid],14):''}${esc(now)}</span></div></button>`;}).join('')||'<p class="muted">Bu filtrede efsane yok.</p>'}</div>`;}
ACTX.legOpen=el=>{const x=legInit()[el.dataset.k];if(!x)return;const Y=G.s?G.s.year:2026,[now,t,cid]=legNow(x);
  const clubs=(x.clubs||[]).map(c=>CLUBS[c]?`<span class="leg-cl">${crestSVG(CLUBS[c],16)} ${esc(CLUBS[c].short||CLUBS[c].name)}</span>`:`<span class="leg-cl">${esc(c)}</span>`).join('');
  const sum=(x.rows||[]).reduce((a,z)=>{a.ap+=z[2];a.g+=z[3];a.a+=z[4];return a;},{ap:0,g:0,a:0});
  const tbl=x.rows&&x.rows.length?`<div class="tbl-wrap"><table class="kr-t"><thead><tr><th class="l">Sezon</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th></tr></thead><tbody>${x.rows.slice().sort((a,b)=>b[0]-a[0]).map(z=>`<tr><td class="l">${seasonLabel(z[0])}</td><td class="l club">${CLUBS[z[1]]?crestSVG(CLUBS[z[1]],14)+'<span>'+esc(CLUBS[z[1]].short)+'</span>':esc(String(z[1]).replace(/^n:/,''))}</td><td>${z[2]}</td><td>${x.pos==='KL'?'–':z[3]}</td><td>${z[4]}</td><td>${z[2]&&z[5]?(z[5]/100).toFixed(2):'–'}</td></tr>`).join('')}</tbody><tfoot><tr><td class="l" colspan="2">Toplam</td><td>${sum.ap}</td><td>${x.pos==='KL'?'–':sum.g}</td><td>${sum.a}</td><td></td></tr></tfoot></table></div>`:'';
  const txs=(x.tx||[]).filter(e=>e[3]>0).map(e=>`<li><span class="kr-y">${seasonLabel(e[0])}</span><span class="kr-c">${CLUBS[e[1]]?esc(CLUBS[e[1]].short):''} <b>→</b> ${CLUBS[e[2]]?esc(CLUBS[e[2]].short):''}</span><em class="fe">${eur(e[3])}</em></li>`).join('');
  let aw=[];for(const A of Object.values(G.awards||{})){if(A.po&&A.po.n===x.n)aw.push(`${A.y} yılın oyuncusu`);if(A.gk&&A.gk.n===x.n)aw.push(`${A.y} gol kralı`);if(A.bdo&&A.bdo[0]&&A.bdo[0].n===x.n)aw.push(`${A.y} Ballon d’Or`);}
  openModal(`<div class="leg-hd"><div class="leg-face big">${legFace(x)}</div><div><h3>${esc(x.n)}</h3><p class="muted">${flagImg(x.nat,'fl-row')} ${esc(natName(x.nat))} · ${POS_TR[x.pos]||x.pos} · ${Y-x.by} yaş</p><p class="leg-now j-${t}">${cid&&CLUBS[cid]?crestSVG(CLUBS[cid],18):''}<b>Şimdi:</b> ${esc(now)}</p></div></div>
   <dl class="offer-terms"><div><dt>Futbolu bıraktı</dt><dd>${x.ret}</dd></div>${x.peak?`<div><dt>Zirve güç</dt><dd>${x.peak}</dd></div>`:''}${sum.ap?`<div><dt>Kariyer</dt><dd>${sum.ap} maç · ${sum.g} gol</dd></div>`:''}</dl>
   ${x.hl?`<p class="leg-hl">🏅 ${esc(x.hl)}</p>`:''}${aw.length?`<div class="aw-tags">${aw.map(a=>`<span>🏅 ${esc(a)}</span>`).join('')}</div>`:''}
   <p class="sub-h" style="margin:12px 0 6px"><span>Kulüpleri</span></p><div class="leg-cls">${clubs||'<span class="muted">—</span>'}</div>
   ${tbl?`<p class="sub-h" style="margin:12px 0 6px"><span>Kariyer istatistikleri</span></p>${tbl}`:''}${txs?`<p class="sub-h" style="margin:12px 0 6px"><span>Bonservisli transferleri</span></p><ul class="kr-tx">${txs}</ul>`:''}
   <p class="sub-h" style="margin:12px 0 6px"><span>Emeklilik sonrası</span></p><ul class="leg-ev">${x.ev.slice().reverse().map(([y,t])=>`<li><i>${y}</i>${esc(t)}</li>`).join('')}</ul>
   <button class="cta" data-act="closeModal" style="margin-top:12px">Kapat</button>`);};
/* sayfa kaydı: tüm modlarda Rekabet altında */
XICON.leg=NI('<circle cx="12" cy="8" r="4"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6"/><path d="M9 3.5 12 2l3 1.5"/>');NICON.leg=XICON.leg;
Object.assign(XV,{leg:()=>viewLegends()});
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.s&&!L.some(x=>x[0]==='leg'))L.push(['leg','Efsaneler']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(G&&G.s){const rk=C.find(x=>x[0]==='Rekabet');if(rk&&!rk[1].some(x=>x[0]==='leg'))rk[1].push(['leg','Efsaneler',{tab:'leg'}]);}}catch(e){}return C;})(navCats);
/* efsane hocalar kendi çaplarına uygun kulüplere gelsin */
function coStature(x){if(!x||!x.leg)return 60;const L=G.leg&&G.leg[x.leg];if(!L)return 70;return L.seed?88:Math.max(70,(L.peak||76));}
newCoachFor=(old=>function(id){const c=CLUBS[id],all=G.coFree||[];if(!c||!all.length)return old.apply(this,arguments);const fit=all.filter(x=>c.str>=coStature(x)-14),rest=all.filter(x=>!fit.includes(x));
  G.coFree=fit;let r;try{r=old.apply(this,arguments);}finally{G.coFree=G.coFree.concat(rest);}return r;})(newCoachFor);

