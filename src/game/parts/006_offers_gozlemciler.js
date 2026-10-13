/* ================= OFFERS & GÖZLEMCİLER ================= */
function effRating(){const avg=seasonAvg();return OVR()+(avg?(avg-6.7)*5:-2)+Math.min(6,G.p.fame*0.05);}
function clubNeed(c){const L=LEAGUES[c.league],strs=leagueClubs(c.league).map(x=>x.str),mn=Math.min(...strs),mx=Math.max(...strs);return L.req+(c.str-mn)/((mx-mn)||1)*8;}
const eligible=(L,age)=>age>=L.minAge&&(!L.youth||age<=L.maxAge);
function makeOffer(c,m,kind,role,renew){
  const L=LEAGUES[c.league],strs=leagueClubs(c.league).map(x=>x.str),avg=strs.reduce((a,b)=>a+b,0)/strs.length;
  role=role||visRole(c,m>10?'Yıldız':m>5?'İlk 11':m>0?'Rotasyon':'Gelişim',G.p.age+(kind==='end'?1:0));
  let wage=L.youth?L.wage*(1+(c.str-avg)*0.02):L.wage*Math.pow(c.str/avg,3)*(1+clamp(m,-5,15)*0.035);
  wage*=VIS_WAGE[clubVision(c)]||1;if(G.p.up.menajer)wage*=1.2;if(renew)wage=Math.max(wage,G.contract.wage*1.1);
  wage=Math.max(50,Math.round(wage/50)*50);
  const age=G.p.age+(kind==='end'?1:0),years=L.youth?clamp(L.maxAge-age+1,1,2):rint(2,4),bonus=L.youth?0:Math.round(wage*rint(3,10)/100)*100;
  return {id:uid(),club:c.id,league:c.league,role,wage,years,bonus,kind,status:'open',haggled:false,interest:m,renew:!!renew};}
function pushOffer(o){const c=CLUBS[o.club],L=LEAGUES[o.league],jump=LEAGUES[o.league].tier-curLeague().tier;
  const body=o.renew?`${c.name} sözleşmeni uzatmak istiyor.`:o.role==='A Takıma Yükselme'?`${c.name} seni A takım kadrosuna almak istiyor. Bu büyük bir fırsat ama forma için savaşman gerekecek.`
    :o.loan?`${c.name} (${L.name}) seni sezon sonuna kadar kiralamak istiyor. Maaşını kulübün ödemeye devam edecek; orada ${o.role==='İlk 11'?'ilk 11 oynaman':'düzenli süre alman'} planlanıyor.`:o.kind==='mid'?`${c.name} (${L.name}) ara transfer döneminde seni kadrosuna katmak istiyor. Teklif ${fmtDate(dateOf(G.s.win.close))} tarihine kadar geçerli.`
    :`${c.name} (${L.name}) gelecek sezon için seni istiyor. Gözlemcileri maçlarını izledi.${jump>=2?' Birkaç basamak birden atlama fırsatı!':''}`;
  msg('offer',(o.renew?'Sözleşme uzatma: ':o.loan?'Kiralık teklifi: ':'Transfer teklifi: ')+c.name,body,{offer:o});}
const WLV=[25,55,80];
function scoutPool(){const age=G.p.age,cur=myClub(),ct=LEAGUES[cur.league].tier;
  return Object.values(CLUBS).filter(c=>{if(c.id===G.club||(cur.parent&&c.id===cur.parent))return false;const L=LEAGUES[c.league];if(age+1<L.minAge||(L.youth&&age>L.maxAge))return false;
    if(L.tier<ct||(L.tier===ct&&c.str<=cur.str+1))return false;return L.tier<=ct+5;});}
/* Her maçtan sonra birkaç kulübün gözlemcisi tribünde: puanın, şöhretin ve ulaşılabilirlik ilgiyi belirler.
   Lig farkı büyüdükçe dikkat çekmek için daha yüksek puan gerekir ama sıralı gitmek zorunlu değildir. */
function scoutUpdate(r,played){if(!played)return;const cur=myClub(),ct=LEAGUES[cur.league].tier,eff=effRating();
  const pool=scoutPool().map(c=>{const gap=Math.max(0,LEAGUES[c.league].tier-ct),reach=eff-clubNeed(c),w=G.watch[c.id];return {c,gap,reach,wt:Math.exp(-Math.abs(reach+2)/7)*(gap<=3?1:0.4)*(w&&w.i>10?2.5:1)*(gap>0?1+G.p.fame/45:1)};}).filter(x=>x.reach>(x.gap>=3?-8:-15)-G.p.fame*0.1);
  let n=Math.min(pool.length,3+Math.round(G.p.fame/25)+(r>=7.5?2:0)+(G.tl?2:0));
  while(n-->0&&pool.length){const x=wpick(pool.map(q=>[q,q.wt]));pool.splice(pool.indexOf(x),1);
    const d=((r-6.7)*7/(1+x.gap*0.45)+G.p.fame*(x.gap>0?0.05:0.02)+(x.reach>0?1.5:x.reach*0.12))*(clubVision(cur)==='vitrin'&&r>6.7?1.3:1)*(G.tl?1.6:1);
    const w=G.watch[x.c.id]||(G.watch[x.c.id]={i:0,lv:0});w.i=clamp(w.i+d,0,100);
    while(w.lv<3&&w.i>=WLV[w.lv]){w.lv++;watchNews(x.c,w.lv);}}}
function watchNews(c,lv){const n=Object.values(G.watch).filter(w=>w.lv>=1).length,L=LEAGUES[c.league];
  const T={1:[n>1?`Bir kulüp daha: ${c.name} de ${meNs('acc')} izliyor`:`${c.name} gözlemcileri ${meNs('acc')} izlemeye aldı`,`${L.name} ekibi ${c.name} scout heyetinin son maçlarda tribünde olduğu ve ${meN()} hakkında rapor hazırladığı öğrenildi.${n>1?` Böylece ${meFs('acc')} takip eden kulüp sayısı ${n} oldu.`:''}`],
    2:[`${c.name} ${meN()} takibini sıklaştırdı`,`Kulis bilgisine göre ${c.name} teknik heyeti, ${meN()} raporlarını olumlu buldu ve maçlarını yerinde izlemeyi sürdürecek.`],
    3:[`Kulis: ${c.name} ${meN()} için harekete geçiyor`,`${c.name} yönetiminin transfer döneminde ${meN()} için resmi teklif hazırladığı konuşuluyor.`]}[lv];
  msg('scout',T[0],T[1]);}
function genOffers(kind,agedOut){
  const age=G.p.age+(kind==='end'?1:0),eff=effRating(),cur=myClub(),ct=LEAGUES[cur.league].tier,offers=[];
  if(kind==='end'){
    if(!agedOut&&G.contract.years<=0){const m=eff-clubNeed(cur);if(m>-6)offers.push(makeOffer(cur,m,'end',null,true));}
    if(agedOut&&cur.parent){const pc=CLUBS[cur.parent],m=eff-clubNeed(pc);if(m>-6)offers.push(makeOffer(pc,m,'end','A Takıma Yükselme'));}
  }
  if(cur.parent&&!(kind==='end'&&agedOut)){const pc=CLUBS[cur.parent],m=eff-clubNeed(pc);if(eligible(LEAGUES[pc.league],age)&&m>=-3&&seasonAvg()>=(kind==='mid'?7.5:7.2)&&G.s.stats.apps>=5)offers.push(makeOffer(pc,m,kind,'A Takıma Yükselme'));}
  const maxN=kind==='mid'?(G.tl?2:1):3,thr=kind==='mid'?(G.tl?35:60):(G.tl?30:45),nOff=()=>offers.filter(o=>!o.renew&&o.role!=='A Takıma Yükselme').length;
  const watched=Object.entries(G.watch).map(([id,w])=>({c:CLUBS[id],w})).filter(x=>x.c&&x.c.id!==G.club&&!(cur.parent&&x.c.id===cur.parent)&&eligible(LEAGUES[x.c.league],age)&&x.w.i>=thr).sort((a,b)=>b.w.i-a.w.i);
  for(const {c,w} of watched){if(nOff()>=maxN)break;const m=eff-clubNeed(c)+w.i*0.06+rnd(-2,2);if(m<(LEAGUES[c.league].tier-ct>=3?-3:-8))continue;if(Math.random()>clamp(0.3+w.i/110,0.3,0.95))continue;offers.push(makeOffer(c,m,kind,m<-2?'Gelişim':null));w.i*=0.5;w.lv=WLV.filter(t=>w.i>=t).length;}
  if(kind==='end'&&!nOff()&&seasonAvg()>=6.8&&Math.random()<0.7){
    const cands=Object.values(CLUBS).filter(c=>c.id!==G.club&&eligible(LEAGUES[c.league],age)&&LEAGUES[c.league].tier>=ct&&LEAGUES[c.league].tier<=ct+1&&c.str>cur.str-1).map(c=>({c,m:eff-clubNeed(c)+rnd(-3,3)})).filter(x=>x.m>=-1);
    if(cands.length){const x=pick(cands);offers.push(makeOffer(x.c,x.m,'end'));}}
  if(kind==='end'&&G.mustMove&&offers.length===0){
    const ls=Object.entries(LEAGUES).filter(([,L])=>eligible(L,age)).sort((a,b)=>b[1].req-a[1].req);
    const fit=ls.find(([,L])=>L.req<=eff+2)||ls[ls.length-1];
    if(fit){const cl=leagueClubs(fit[0]).sort((a,b)=>a.str-b.str)[rint(0,2)];offers.push(makeOffer(cl,0,'end','Gelişim'));}}
  offers.forEach(pushOffer);return offers.length;}
function findOffer(id){for(const m of G.inbox)if(m.offer&&m.offer.id===id)return m.offer;return null;}
function acceptOffer(o){
  const c=CLUBS[o.club];
  G.inbox.forEach(m=>{if(m.offer&&m.offer.status==='open'&&m.offer!==o)m.offer.status='declined';});
  o.status='accepted';G.p.money+=o.bonus;delete G.watch[o.club];G.tl=false;
  const contract={years:o.years,wage:o.wage,role:o.role};
  if(o.loan){if(G.phase==='season'){G.loan={parent:G.loan?G.loan.parent:G.club,contract:G.loan?G.loan.contract:G.contract};closeSegment();G.club=o.club;G.contract=contract;G.p.trust=ROLE_TRUST[o.role]??55;if(o.league!==G.s.league)switchLeague(o.league);msg('news',`Kiralık: ${meN()} ${c.name} yolunda`,`Sezon sonuna kadar ${c.name} formasını giyeceksin. Rolün: ${o.role}.`);toast(`${c.name} ile kiralık anlaşma!`);}
    else{G.next={club:o.club,contract,loan:true};msg('news',`Kiralık: ${c.name}`,`Yeni sezonu kiralık olarak ${c.name} formasıyla geçireceksin.`);toast('Kiralık anlaşma imzalandı');}
    save();render();return;}
  if(!o.renew)G.loan=null;
  if(o.renew){G.contract=contract;G.mustMove=false;G.next=null;msg('news','Sözleşme uzatıldı',`${c.name} ile ${o.years} yıllık yeni sözleşme imzaladın.`);toast('Sözleşme uzatıldı');}
  else if(G.phase==='season'){
    closeSegment();G.club=o.club;G.contract=contract;G.p.trust=ROLE_TRUST[o.role]??55;
    if(o.league!==G.s.league)switchLeague(o.league);
    msg('news',`Resmi: ${meN()} artık ${c.name} oyuncusu`,`Ara transfer döneminde ${c.name} ile ${o.years} yıllık sözleşme imzaladın. Rolün: ${o.role}.`);toast(`${c.name} ile imzalandı!`);
  } else {G.next={club:o.club,contract};msg('news',`İmza atıldı: ${c.name}`,`Yeni sezonda ${c.name} formasını giyeceksin. Rolün: ${o.role}.`);toast(`${c.name} ile imzalandı!`);}
  save();render();}
function haggle(o){if(o.haggled||o.status!=='open')return;o.haggled=true;const p=clamp(0.35+o.interest*0.04+(G.p.up.menajer?0.2:0),0.1,0.9),r=Math.random();
  if(r<p){o.wage=Math.round(o.wage*1.25/50)*50;o.bonus=Math.round(o.bonus*1.3/100)*100;toast('Kulüp maaş talebini kabul etti (+%25)');}
  else if(r<p+(1-p)*0.4){o.status='withdrawn';toast('Kulüp teklifini geri çekti');}
  else toast('Kulüp teklifinde ısrar ediyor');save();render();}

