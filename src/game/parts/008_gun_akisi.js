/* ================= GÜN AKIŞI ================= */
const INT={hafif:{e:6,g:0.6,r:0,n:'Hafif'},normal:{e:11,g:1,r:0.0025,n:'Normal'},yogun:{e:17,g:1.45,r:0.011,n:'Yoğun'}};
function closeSegment(pos){const st=G.s.stats;if(st.apps>0||pos)G.history.push(Object.assign({year:seasonLabel(G.s.year),age:G.p.age,club:G.club,league:G.s.league,pos:pos||null},st));G.s.stats=blankStats();}
function teamSession(t,perf){const p=G.p,D=DT[t],need=TR_PLAN[t]?Math.max(0,curLeague().tier-4):0,skip=perf==null&&t==='hazirlik',m=(perf==null?(skip?Math.max(0.25,1-need*0.16):1):0.7+0.8*perf)*(clubVision(myClub())==='altyapi'?1.2:1)*facMult();
  if(t==='hazirlik'){const v=perf==null?(need?0.4:0.5):perf;p.trf=(p.trf??0.5)*0.7+v*0.3;G.s.prep={w:G.s.week,v};if(perf==null&&need)bump('trust',-need*0.12);}p.energy=clamp(p.energy-D.e*(p.up.diyet?0.9:1),0,100);
  for(const k in D.gain||{})gainAttr(k,0.02*D.gain[k]*m);
  bump('trust',(D.trust||0.25)+(perf==null?0:(perf-0.5)*3));
  if(t==='oyun'){const r=perf==null?gauss()*1.3+(OVR()-myClub().str)*0.08:(perf-0.5)*4+gauss()*0.4;bump('trust',r);
    if(r>1.6)msg('coach','Çift kale maçta parladın','Hoca idman maçındaki performansını not etti: “Böyle devam.”');
    else if(r<-1.6)msg('coach','Hoca memnun değil','İdman maçında sönük kaldın. Hoca daha fazla mücadele bekliyor.');}
  if(Math.random()<0.0015*(p.energy<30?3:1)*(p.age<16?0.5:1)*proneF()){p.injury=rollInjury(0.4,'kas');msg('injury','Antrenmanda sakatlık',`${p.injury.name}. ${injTxt(p.injury)} yoksun.`);}}
function doFree(kind,o,quiet){const p=G.p;if(G.slot){if(!quiet)toast('Bugünün serbest zamanını kullandın');return;}let t='';
  if(kind==='indiv'){if(p.injury){if(!quiet)toast('Sakatken bireysel idman yapamazsın');return;}const k=o.k,I=INT[o.int]||INT.normal;
    const g=gainAttr(k,0.07*I.g*(p.up.antrenor?1.4:1)*(p.energy<30?0.6:1));p.energy=clamp(p.energy-I.e,0,100);G.plan.focus=k;if(!quiet)G.plan.int=o.int;
    t=`${I.n} bireysel idman: ${ATTR[k]} +${dec(g,2)}`;
    if(Math.random()<I.r*(p.energy<35?3:1)*(p.up.diyet?0.7:1)*proneF()){p.injury=rollInjury(0.5,'kas');t=`Çalışırken sakatlandın: ${p.injury.name} (${injTxt(p.injury)})`;msg('injury','Bireysel idmanda sakatlık',`${p.injury.name}. Sağlık ekibi ${injTxt(p.injury)} dinlenmeni istiyor.`);}}
  else if(kind==='rest'){bump('energy',18);bump('morale',2);t='Dinlendin: kondisyon +18';}
  else if(kind==='video'){const v=rnd(2,4);bump('trust',v);t=`Video analiz: hoca güveni +${Math.round(v)}`;}
  else if(kind==='social'){bump('energy',-3);const r=Math.random();
    if(r<0.68){bump('fame',rnd(1,3));bump('morale',4);t='Paylaşımın beğenildi: şöhret ve moral arttı';}
    else if(r<0.88)t='Paylaşımın pek ilgi görmedi';
    else{bump('trust',-6);bump('morale',-5);msg('coach','Hocadan uyarı','Sosyal medyadaki paylaşımın tepki çekti. Hoca: “Konuşmayı sahada yap.”');t='Paylaşımın tepki çekti, hoca kızdı';}}
  else if(kind==='family'){if(p.age<18){bump('morale',6);bump('energy',4);t='Ailenle ve okul arkadaşlarınla vakit geçirdin: moral +6';}
    else{bump('morale',7);bump('energy',-4);t='Arkadaşlarınla dışarı çıktın: moral +7';if(Math.random()<0.1){bump('trust',-3);msg('gundem','Gece hayatı haberi',('Bir magazin sitesi '+meNs('acc')+' gece saatlerinde bir mekânda görüntüledi. Kulüp yönetimi rahatsız.'));t+=' (magazine yakalandın)';}}}
  else if(kind==='rehab'){if(!p.injury)return;const d=p.up.fizyo?rint(1,3):rint(0,2);p.injury.days-=d;bump('energy',4);
    if(p.injury.days<=0){p.injury=null;msg('injury','Erken dönüş','Rehabilitasyon programı işe yaradı, tamamen iyileştin.');t='Rehabilitasyon: tamamen iyileştin!';}
    else t=d?`Rehabilitasyon: iyileşme ${d} gün öne çekildi`:'Bu seans belirgin bir ilerleme sağlamadı';}
  G.slot=true;G.slotText=t;if(!quiet){closeModal();save();render();toast(t);}}
function squadNews(){const p=G.p,f=ourFixture();if(!f)return;const opp=CLUBS[f[0]===G.club?f[1]:f[0]];let role,txt;
  if(p.ban){role='banned';txt=`Cezan nedeniyle ${opp.name} maçında forma giyemeyeceksin.`;}
  else if(p.injury&&p.injury.days>1){role='injured';txt=`Sakatlığın nedeniyle ${opp.name} maçının kadrosunda yoksun.`;}
  else{role=decideRole();txt=role==='start'?`Hoca ${opp.name} maçı için seni ilk 11’de düşünüyor.`:role==='sub'?`${opp.name} maçında yedek kulübesindesin. Fırsat gelirse hazır ol.`:`${opp.name} maçının kadrosuna alınmadın. Antrenmanlarda kendini göstermelisin.`;}
  G.s.squad={r:G.s.week,role};msg('squad','Kadro açıklandı',txt);}
function nextDay(){const p=G.p,prevT=dayType(G.s.day);G.s.day++;G.slot=false;G.slotText='';
  if(wdOf(today())===0){if(G.mode==='mgr'&&G.m){mgrWeek();scoutWeek();relWeek();bidsWeek();}p.money+=G.contract.wage;for(const w of Object.values(G.watch))w.i=Math.max(0,w.i-0.5);}
  if(p.injury&&p.injury.serious)p.energy=0;else if(p.injury)p.energy=clamp(p.energy-4,0,100);else p.energy=clamp(p.energy+9+(p.up.diyet?3:0)+(prevT==='izin'||prevT==='tatil'?6:0),0,100);
  p.morale=clamp(p.morale+(60-p.morale)*0.02,0,100);if(p.up.psikolog)p.morale=Math.max(p.morale,40);if(p.up.yali)p.morale=Math.max(p.morale,55);if(p.up.mfloor)p.morale=Math.max(p.morale,p.up.mfloor);
  if(p.injury){p.injury.days--;if(p.injury.days<=0){msg('injury','Sahalara dönüş',`${p.injury.name} tamamen iyileşti. Hoca seni yeniden kadroya dahil edebilir.`);p.injury=null;}}
  const mon=today().getUTCMonth();if(G.s.mon==null)G.s.mon=mon;
  if(mon!==G.s.mon){const rs=G.s.mrs||[],pm=G.s.mon;G.s.mon=mon;G.s.mrs=[];
    if(rs.length>=2){const avg=rs.reduce((a,b)=>a+b,0)/rs.length;
      if(avg>=7.6){G.trophies.push({year:seasonLabel(G.s.year),name:`Ayın Oyuncusu (${TR_MONTHS_L[pm]})`,club:G.club});bump('fame',2);msg('news',`Ayın Oyuncusu: ${meN()}!`,`${curLeague().name} ${TR_MONTHS_L[pm]} ayının oyuncusu seçildin. Ortalaman ${dec(avg)}.`);}
      else{const x=pick(Object.values(G.s.ps||{}));if(x)msg('gundem',`${TR_MONTHS_L[pm]} ayının oyuncusu belli oldu`,`${curLeague().name} ${TR_MONTHS_L[pm]} ayının oyuncusu: ${x.n} (${CLUBS[x.c].name}). ${meFs('gen')} ortalaması ${dec(avg)}.`);}}}
  const t=dayType(G.s.day);
  if(t==='hazirlik'&&isPl())squadNews();
  boardTick();cupTick();
  if(G.s.day===G.s.win.open&&isPl()){msg('news','Ara transfer dönemi açıldı',`Kış transfer dönemi ${fmtDate(dateOf(G.s.win.close),true)} tarihine kadar açık. İlgilenen kulüpler bu sürede teklif yapabilir.`);genOffers('mid');const st=G.s.stats;if(G.wantLoan||(!curLeague().youth&&G.p.age<=23&&st.apps<G.s.week*0.35))genLoanOffers();}
  if(G.s.day===G.s.win.close)G.inbox.forEach(m=>{if(m.offer&&(m.offer.kind==='mid'||m.offer.kind==='loan')&&m.offer.status==='open')m.offer.status='expired';});
  if(t!=='mac'&&t!=='milli'&&t!=='kupa'&&isPl()){if(Math.random()<0.2)newsGen();personalEvent();}}
const trSceneOn=t=>t==='hazirlik'&&DT[t].team&&!G.p.injury&&TR_PLAN[t]&&G.trScene!==false;
function prepAdj(){const p=G.p,s=G.s;return (s.prep&&s.prep.w===s.week?(s.prep.v-0.5)*4:0)+(p.trf!=null?(p.trf-0.5)*2.5:0)+(p.up.analist?0.6:0);}
function finishDay(){const t=dayType(G.s.day);if(t==='mac'||t==='milli'||t==='kupa')return;autoPlan();if(trSceneOn(t))return startTraining(t);if(DT[t].team&&!G.p.injury)teamSession(t);nextDay();save();render();window.scrollTo(0,0);}
function autoFree(){const p=G.p;if(G.slot)return;if(p.injury)return doFree('rehab',null,true);if(p.energy<55)return doFree('rest',null,true);return doFree('indiv',{k:G.plan.focus,int:G.plan.int==='yogun'?'normal':G.plan.int},true);}
function autoAdvance(){const g0={...G.p.a},inj0=!!G.p.injury;let n=0;
  while(n<90&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac'||t==='milli'||t==='kupa')break;autoPlan();if(DT[t].team&&!G.p.injury)teamSession(t);nextDay();n++;}
  const gains=Object.keys(ATTR).map(k=>[k,G.p.a[k]-g0[k]]).filter(x=>x[1]>=0.05).map(([k,v])=>`${ATTR[k]} +${dec(v)}`);
  save();render();window.scrollTo(0,0);
  if(n)openModal(`<h3>${n} gün geçti</h3><p>Bugün ${fmtLong(today())}: ${DT[dayType(G.s.day)].n}.</p>${gains.length?`<ul class="notes">${gains.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<p>${G.p.injury&&!inj0?'Bu sürede sakatlandın, gelen kutuna bak.':'Gelen kutunda yeni mesajlar olabilir.'}</p><button class="cta" data-act="closeModal">Tamam</button>`);}
function natCheck(){
  const p=G.p;if(p.injury)return;const age=p.age,ovr=OVR();
  const lv=NAT_LEVELS.find(l=>age>=l.min&&age<=l.max&&ovr>=l.req);
  if(!lv||formAvg()<6.6||Math.random()>0.85)return;
  const n=pick(NATIONS),day=ROUND_DAY(G.s.week)-3;if(day<=G.s.day+1)return;if(cupAnyDay(day)||cupAnyDay(day-1)||cupAnyDay(day+1))return;
  G.s.nat={day,comp:natCompOf(day,lv.lv),lv:lv.lv,off:lv.off,opp:{id:'n'+n[1],name:n[0],short:n[1],c1:n[2],c2:n[3],str:n[4]-lv.off,shape:1,pat:(hash(n[1])>>2)%5}};
  msg('nat',`${lv.lv} çağrısı!`,`Teknik direktör seni ${lv.lv} kadrosuna çağırdı. ${fmtDate(dateOf(day))} günü ${n[0]} ile ${natCompOf(day,lv.lv)==='Hazırlık'?'hazırlık maçı':natCompOf(day,lv.lv)+' maçı'} oynanacak.`);}
const TRnat=nat=>({id:'tr',name:'Türkiye',short:'TÜR',c1:'#e30a17',c2:'#ffffff',str:82-nat.off,flag:'TR',shape:0});
function afterMatch(res,played,home,away,hg,ag){
  G.p.playHurt=false;scoutUpdate(res.rating||0,played);
  if(played&&res.rating>=8){G.s.totw=(G.s.totw||0)+1;bump('fame',1);msg('gundem','Haftanın 11’i açıklandı',`${curLeague().name} haftanın 11’inde ${meN()} da var. Bu sezon ${G.s.totw}. kez seçildi.`);}
  msg('report',`Maç raporu: ${home.name} ${hg}-${ag} ${away.name}`,played?`Puanın ${dec(res.rating)} · ${res.goals} gol, ${res.assists} asist, ${res.mins} dakika.${res.rating>=7.5?' Tribündeki gözlemciler not aldı.':''}`:'Bu maçta forma giymedin.');
  if(played&&res.rating){const cs=cstate(G.club);cs.board=clamp(cs.board+(res.rating>=7.5?1.5:res.rating<6?-1:0.2),0,100);}
  G.s.week++;G.s.squad=null;
  if(G.s.week===Math.round(NR()*0.3)||G.s.week===Math.round(NR()*0.75))natCheck();
  if(G.s.week>NR()){seasonEnd();return;}
  nextDay();}
function seasonEnd(){
  const L=curLeague(),pos=tablePos(),st=G.s.stats,avg=st.apps?st.rsum/st.apps:0,yl=seasonLabel(G.s.year),awards=[];
  if(pos===1)awards.push(`${L.short} Şampiyonluğu`);
  const lg=leaders('g'),la=leaders('a'),og=Math.max(0,...lg.filter(x=>!x.me).map(x=>x.v)),oa=Math.max(0,...la.filter(x=>!x.me).map(x=>x.v));
  if(st.goals>=3&&st.goals>=og)awards.push(`${L.short} Gol Kralı (${st.goals} gol)`);
  if(st.assists>=3&&st.assists>=oa)awards.push(`${L.short} Asist Kralı (${st.assists} asist)`);
  if(G.s.totw>=3)awards.push(`Haftanın 11’i (${G.s.totw} kez)`);
  if(avg>=7.6&&st.apps>=Math.max(8,NR()*0.35))awards.push('Sezonun Oyuncusu');
  if(pos===1){const cs=cstate(G.club);cs.board=clamp(cs.board+12,0,100);}
  if(L.tier>=8&&G.p.age<=21&&avg>=7.3&&st.apps>=8)awards.push('Yılın Genç Oyuncusu');
  if(L.tier>=9&&avg>=8.0&&st.goals+st.assists>=20)awards.push('Altın Top');
  awards.forEach(a=>G.trophies.push({year:yl,name:a,club:G.club}));
  (G.mvh=G.mvh||[]).push({y:yl,v:marketValue()});
  G.summary={yl,pos,league:G.s.league,club:G.club,awards,apps:st.apps,goals:st.goals,assists:st.assists,avg};
  const agedOut=!!L.youth&&G.p.age+1>L.maxAge;let back=null;
  if(G.loan){back=G.loan;G.loan=null;back.contract.years--;G.contract=back.contract;const PL=LEAGUES[CLUBS[back.parent].league],pOut=!!PL.youth&&G.p.age+1>PL.maxAge;G.mustMove=back.contract.years<=0||pOut;G.next=G.mustMove?null:{club:back.parent,contract:back.contract,ret:true};
    msg('news','Kiralık süren bitti',G.next?`Sezon sonunda ${CLUBS[back.parent].name} kulübüne geri dönüyorsun. İstersen gelen teklifleri de değerlendirebilirsin.`:`${CLUBS[back.parent].name} ile sözleşmen de bitti. Yeni bir kulüp bulmalısın.`);}
  else{G.contract.years--;G.mustMove=G.contract.years<=0||agedOut;G.next=null;}
  G.tl=false;
  const n=genOffers('end',agedOut&&!back);if(!G.mustMove&&G.p.age<=23&&!L.youth&&st.apps<NR()*0.35)genLoanOffers();
  closeSegment(pos);G.phase='off';coachSeasonEnd();qualNext();tourSetup();archSave();
  msg('news',`${yl} sezonu sona erdi`,`${CLUBS[G.club].name} ligi ${pos}. sırada bitirdi.${awards.length?' Ödüller: '+awards.join(', ')+'.':''} ${n?'Gelen kutunda '+n+' teklif var.':'Bu yaz kapını çalan olmadı.'}`);
  afterModal=showSeasonModal;}
function grow(){const p=G.p,age=p.age;for(const k in p.a){let d;
  if(age<=20)d=rnd(0.4,1.6)*clamp((p.pot[k]-p.a[k])/30,0.1,1.2);else if(age<=26)d=rnd(0,0.8);else if(age<=29)d=rnd(-0.3,0.3);
  else if(age<=32)d=(k==='hiz'||k==='fiz')?-rnd(0.5,2):-rnd(0,0.8);else d=(k==='hiz'||k==='fiz')?-rnd(1.5,3.5):-rnd(0.3,1.5);
  p.a[k]=clamp(p.a[k]+d,10,p.pot[k]);}p.fame=clamp(p.fame*0.92,0,100);}
function startNewSeason(){
  if(G.p.age+1>=40)return toast('40 yaşına giriyorsun; kramponları asma zamanı geldi.');
  if(G.tour&&G.tour.alive)return toast('Önce turnuvayı tamamla ya da simüle et.');
  if(G.mustMove&&!G.next)return toast('Sözleşmen bitti. Önce bir teklifi kabul etmelisin.');
  const p=G.p;p.age++;grow();
  if(G.next){if(G.next.loan)G.loan={parent:G.club,contract:G.contract};G.club=G.next.club;G.contract=G.next.contract;p.trust=ROLE_TRUST[G.contract.role]??55;G.next=null;}
  G.inbox.forEach(m=>{if(m.offer&&m.offer.status==='open')m.offer.status='expired';});
  for(const [id,w] of Object.entries(G.watch)){w.i*=0.6;w.lv=WLV.filter(t=>w.i>=t).length;if(w.i<3||id===G.club)delete G.watch[id];}
  p.yellows=0;p.energy=100;p.form=[];G.mustMove=false;G.phase='season';G.summary=null;
  newSeason(G.s.year+1);
  capCheck();retireNews();
  msg('coach',`${seasonLabel(G.s.year)} sezonu başlıyor`,`${myClub().name} teknik direktörü ${coachOf(G.club).n}: “Hazırlık kampı bugün başlıyor. ${curLeague().name} kolay bir lig değil. İlk maçımız ${fmtDate(dateOf(ROUND_DAY(1)))}.”`);
  save();TAB='hub';render();window.scrollTo(0,0);}
function retire(){G.phase='retired';save();archSave();closeModal();TAB='hub';render();}

