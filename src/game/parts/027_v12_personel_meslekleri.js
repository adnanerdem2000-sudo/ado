/* ================= v12: personel meslekleri ================= */
const STF={yrd:{n:'Yardımcı antrenör',r:['Altyapı antrenörü','Yardımcı antrenör','Yardımcı hoca','As hoca'],ic:'🧢'},
  scout:{n:'Gözlemci',r:['Bölge gözlemcisi','Gözlemci','Kıdemli gözlemci','Baş gözlemci','Scouting direktörü'],ic:'🔭'},
  dr:{n:'Takım doktoru',r:['Fizyoterapist','Takım doktoru','Sağlık şefi','Sağlık direktörü'],ic:'🩺'}};
const isStaff=()=>!!G&&G.mode==='staff';
function jobInit(){const j=G.job;j.kn=j.kn||{};j.short=j.short||[];j.reps=j.reps||[];j.cases=j.cases||[];j.inj=j.inj||{};j.log=j.log||[];j.task=j.task||null;j.wk=j.wk||{};j.prog=j.prog||'orta';return j;}
function staffOffers(lvl,n){const tmax=Math.min(9,4+lvl*1.4+(G.job.rep>60?1:0)),tmin=Math.max(3,tmax-2.5);
  const cands=Object.values(CLUBS).filter(c=>{const L=LEAGUES[c.league];return !L.youth&&L.tier<=tmax&&L.tier>=tmin&&c.id!==G.club;}).map(c=>({c,w:LEAGUES[c.league].cc==='TR'?2.5:1}));
  const out=[];for(let i=0;i<n&&cands.length;i++){const x=wpick(cands.map(q=>[q,q.w]));cands.splice(cands.indexOf(x),1);out.push(x.c.id);}return out;}
function startStaffCareer(type){G.mode='staff';G.staff=type;G.prof=type;G.s.year=2025;G.phase='off';G.summary=null;G.mustMove=true;
  G.job={lvl:0,title:STF[type].r[0],rep:10,pts:0,tr:60,offers:[],seasons:0};jobInit();if(type==='yrd')G.lic={lv:'C',exp:0};
  G.job.offers=staffOffers(0,3);msg('board',`${STF[type].n} kariyeri başlıyor`,`${PN()} için ilk iş teklifleri geldi. Bir kulüp seç ve ${STF[type].r[0].toLowerCase()} olarak işe başla.`);save();TAB='hub';render();window.scrollTo(0,0);}
function staffSign(id){const c=CLUBS[id],j=jobInit();closeModal();const first=G.club!==id;G.club=id;j.offers=[];G.mustMove=false;
  G.contract={years:2,wage:Math.round(LEAGUES[c.league].wage*(0.35+j.lvl*0.18)/50)*50,role:j.title};G.phase='season';newSeason(G.s.year+1);applyBoosts();j.pts=0;j.tr=Math.max(j.tr,55);j.inj={};j.cases=[];j.task=null;
  if(G.staff==='scout')scTaskNew();msg('board',`${c.name} ile anlaştın`,`${j.title} olarak ${c.name} bünyesine katıldın. Teknik direktör: ${coachOf(id).n}.`);save();TAB='hub';render();window.scrollTo(0,0);}
/* ortak: kulübün maçı otomatik oynanır */
function staffBonus(){const j=jobInit();let b=0;if(G.staff==='yrd'){const w=j.wk[G.s.week]||{};b+=((w.tr?w.trOk?1.6:0.3:0)*(1+(UP('yr_koni')?0.15:0)+(UP('yr_tahta')?0.1:0))+(w.an?w.anOk?2:0.3:0)*(1+(UP('yr_laptop')?0.2:0)))*(UP('yr_drone')?1.25:1);}
  if(G.staff==='dr'){const n=Object.keys(j.inj).length;b-=n*0.7;b+={dusuk:-0.5,orta:0,yuksek:0.4}[j.prog]||0;}return b;}
function staffMatch(){const f=ourFixture();if(!f)return;const usHome=f[0]===G.club,me=myClub(),opp=CLUBS[usHome?f[1]:f[0]],b=staffBonus(),S=me.str+b;
  const [lh,la]=lambdas(usHome?S:opp.str,usHome?opp.str:S),gu=poisson(usHome?lh:la),go=poisson(usHome?la:lh),hg=usHome?gu:go,ag=usHome?go:gu;
  const rd=G.s.fixtures[G.s.week-1].map(([h,a])=>{if(h===f[0]&&a===f[1])return [h,a,hg,ag];const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(rd);creditRound(rd,null);
  const j=jobInit(),win=gu>go,draw=gu===go,notes=[];
  if(G.staff==='yrd'){const w=j.wk[G.s.week]||{},hit=(w.trOk?1:0)+(w.anOk?1:0);j.pts+=hit*2+(win?1:0);j.tr=clamp(j.tr+(hit?hit*2.5:-2)+(win?1:draw?0:-1),0,100);
    notes.push(w.tr||w.an?`Hazırlığın: ${w.trOk?'idman planı tuttu':'idman planı etkisiz kaldı'}, ${w.anOk?'rakip analizi isabetliydi':'rakip analizi tutmadı'}.`:'Bu maça hazırlık yapmadın; teknik direktör seni sordu.');if(!w.tr&&!w.an)j.tr=clamp(j.tr-3,0,100);}
  if(G.staff==='dr'){const sq=squadOf(G.club).filter(p=>!j.inj[p.k]);const rate={dusuk:0.55,orta:0.38,yuksek:0.24}[j.prog]||0.38;let k=Math.random()<rate?1:0;if(Math.random()<rate*0.25)k++;
    for(let i=0;i<k&&sq.length;i++){const p=sq.splice(Math.floor(Math.random()*sq.length),1)[0];drCaseNew(p);}if(k)notes.push(`Maçta ${k} oyuncu sakatlandı. Tedavi odasında seni bekliyorlar.`);
    for(const kk in j.inj){j.inj[kk].w--;if(j.inj[kk].w<=0){const p=pByKey(kk);const re=Math.random()<j.inj[kk].risk;if(re){j.inj[kk].w=rint(2,4);j.inj[kk].risk*=0.5;j.reinj=(j.reinj||0)+1;j.rep=clamp(j.rep-3,0,100);msg('injury','Sakatlık nüksetti',`${p?p.name:'Oyuncu'} sahaya dönüş antrenmanında yeniden sakatlandı. Tedavi seçimin sorgulanıyor.`);}else{delete j.inj[kk];j.healed=(j.healed||0)+1;j.pts+=1;msg('injury','Sahalara dönüş',`${p?p.name:'Oyuncu'} tedavisini tamamladı ve takıma döndü.`);}}}}
  msg('report',`Maç sonucu: ${CLUBS[f[0]].name} ${hg}-${ag} ${CLUBS[f[1]].name}`,`${win?'Galibiyet':draw?'Beraberlik':'Mağlubiyet'}. Ligde ${tablePos()}. sıradasınız. ${notes.join(' ')}`);
  G.s.week++;if(G.s.week>NR())staffSeasonEnd();else nextDay();save();render();
  const home=CLUBS[f[0]],away=CLUBS[f[1]];openModal(`<h3>Maç sonucu</h3><div class="res-board"><div class="team">${crestSVG(home,38)}<b>${esc(home.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(away,38)}<b>${esc(away.name)}</b></div></div><ul class="notes"><li>Lig sırası: ${G.phase==='off'?'sezon bitti':tablePos()+'.'}</li>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Devam</button>`);}
function staffCup(){const cu=cupToday();if(!cu)return;const {c:k,r}=cu,me=myClub(),opp=clubObj(k.opp),usHome=r.neutral?true:!!r.home,S=me.str+staffBonus();const [x,y]=simPair(usHome?{str:S}:opp,usHome?opp:{str:S},r.neutral);const gu=usHome?x:y,go=usHome?y:x,notes=[];
  (G.s.cupDays=G.s.cupDays||[]).push(G.s.day);cupApply(k,gu,go,notes);msg('report',`${k.name} · ${r.n}: ${me.name} ${gu}-${go} ${opp.name}`,notes.join(' '));nextDay();save();render();
  openModal(`<h3>${esc(k.name)} · ${esc(r.n)}</h3><div class="res-board"><div class="team">${crestSVG(me,38)}<b>${esc(me.name)}</b></div><div class="res-score">${gu}-${go}</div><div class="team">${crestSVG(opp,38)}<b>${esc(opp.name)}</b></div></div><ul class="notes">${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Devam</button>`);}
function staffAdvance(){let g=0;while(g++<60&&G.phase==='season'){const t=dayType(G.s.day);if(t==='mac'||t==='kupa')break;staffDay();nextDay();}save();render();window.scrollTo(0,0);}
function staffDay(){if(G.staff==='scout'){const j=jobInit();if(j.trip&&j.trip.days>0){j.trip.days--;if(j.trip.days<=0){scReveal(j.trip.lid,3);j.trip=null;}}}}
function staffSeasonEnd(){const j=jobInit(),pos=tablePos(),c=myClub(),yl=seasonLabel(G.s.year);G.phase='off';coachSeasonEnd();qualNext();j.seasons++;if(G.lic)G.lic.exp++;
  let score=0;if(G.staff==='yrd')score=(j.pts*1.4+(j.tr-50)*0.6)*(UP('yr_kurs')?1.15:1);else if(G.staff==='scout')score=(j.hits||0)*14+(j.repsN||0)*3+(j.rqOk||0)*12;else score=(j.correct||0)*5-(j.wrong||0)*4-(j.reinj||0)*6+(j.healed||0)*2;
  const prom=score>=26+j.lvl*8&&j.lvl<STF[G.staff].r.length-1;j.rep=clamp(j.rep+score*0.35,0,100);
  G.history.push({year:yl,age:G.p.age,club:G.club,league:G.s.league,pos:'ST',apps:0,goals:0,assists:0,rsum:0});
  let txt=`${c.name} ligi ${pos}. sırada bitirdi. Sezon değerlendirmen: ${Math.round(score)} puan.`;
  if(prom){j.lvl++;j.title=STF[G.staff].r[j.lvl];G.contract.role=j.title;G.contract.wage=Math.round(G.contract.wage*1.45/50)*50;txt+=` Terfi! Yeni görevin: ${j.title}.`;G.trophies.push({year:yl,name:`Terfi: ${j.title}`,club:G.club});if(G.staff==='yrd'&&G.lic&&G.lic.lv==='C')G.lic.lv='B';}
  j.offers=staffOffers(j.lvl+(prom?0.5:0),score>20?3:1);
  if(G.staff==='yrd'&&j.lvl>=STF.yrd.r.length-1&&score>=30){j.hc=mgrJobOffers(Math.round(j.rep*0.6),2);txt+=' Bazı kulüpler seni teknik direktör olarak istiyor!';}
  if(G.staff==='yrd'&&G.co&&G.co[G.club]&&G.co[G.club].since===G.s.year+1&&Math.random()<0.5){G.mustMove=true;txt+=` Yeni teknik direktör ${G.co[G.club].n} kendi ekibini kuruyor; sözleşmen yenilenmedi.`;}
  G.contract.years--;if(G.contract.years<=0)G.mustMove=true;
  G.summary={yl,pos,league:G.s.league,club:G.club,awards:prom?[j.title]:[],apps:0,goals:0,assists:0,avg:0,staff:true,score:Math.round(score)};
  msg('board',`${yl} sezonu değerlendirmesi`,txt);archSave();}
function staffNew(){if(G.mustMove)return toast('Önce bir teklifi kabul etmelisin');const j=jobInit();G.p.age++;G.phase='season';newSeason(G.s.year+1);applyBoosts();licTick&&G.lic&&licTick();j.pts=0;j.wk={};j.correct=0;j.wrong=0;j.reinj=0;j.healed=0;j.hits=0;j.repsN=0;j.rqOk=0;j.rqN=0;if(G.staff==='scout'){netXP(0);if(!j.task)scTaskNew();}retireNews();save();TAB='hub';render();window.scrollTo(0,0);}
function staffHC(id){const j=jobInit();if(!G.lic)G.lic={lv:'B',exp:0};if(['C','B'].includes(G.lic.lv))G.lic.lv='A';G.mode='mgr';G.prof='td';G.m={club:null,conf:60,tac:'dengeli',xi:null,budget:0,st:{w:0,d:0,l:0,gf:0,ga:0},rep:Math.round(j.rep*0.6),offers:[],sacked:false};mgrInit();G.trophies.push({year:seasonLabel(G.s.year),name:'Teknik direktörlüğe terfi',club:G.club});mgrSign(id);}
/* ---------- yardımcı antrenör ---------- */
const YR_TR={hucum:'Hücum organizasyonu',savunma:'Savunma yerleşimi',duran:'Duran toplar',kondisyon:'Kondisyon ve tempo'},YR_AN={kanat:'Kanat atakları',merkez:'Merkezden oyun',duran:'Duran toplar',kontra:'Kontra ataklar'};
function yrProfile(id,salt){const r=srng(id+salt+G.s.year+'p'+G.s.week),ks=Object.keys(YR_AN),main=ks[Math.floor(r()*4)];const out={};let rest=100;ks.forEach(k=>{out[k]=k===main?40+Math.floor(r()*15):0;});rest-=out[main];const o=ks.filter(k=>k!==main);o.forEach((k,i)=>{const v=i<2?Math.floor(r()*rest*0.6):rest;out[k]=v;rest-=v;});return {main,out};}
function yrTeamNeed(){const r=srng(G.club+G.s.year+'n'+Math.floor(G.s.week/3)),ks=Object.keys(YR_TR);return ks[Math.floor(r()*4)];}
function yrHTML(){const j=jobInit(),f=ourFixture(),w=j.wk[G.s.week]||{};if(!f||G.phase!=='season')return '';const opp=CLUBS[f[0]===G.club?f[1]:f[0]],pr=yrProfile(opp.id,'o'),need=yrTeamNeed();
  const stats={hucum:Math.round(40+srng(G.club+'h'+G.s.week)()*30),savunma:Math.round(40+srng(G.club+'s'+G.s.week)()*30)};
  return `<section class="panel"><p class="sub-h"><span>Haftalık görevler</span><span>${opp.name} maçı</span></p>
  <div class="task ${w.tr?'done':''}"><b>1. İdman planı</b><small>Takım raporu: son maçlarda en çok zorlandığımız alan <u>${YR_TR[need]}</u> (${stats.hucum}% topla oynama verimi, ${stats.savunma}% ikili mücadele).</small>
   ${w.tr?`<p class="task-r">Seçimin: ${YR_TR[w.tr]}</p>`:`<div class="chips">${Object.entries(YR_TR).map(([k,v])=>`<button class="chip" data-act="yrTr" data-k="${k}">${v}</button>`).join('')}</div>`}</div>
  <div class="task ${w.an?'done':''}"><b>2. Rakip analizi · ${esc(opp.name)}</b><small>Rakibin son 5 maçtaki gollerinin dağılımı:</small><div class="bars">${Object.entries(pr.out).map(([k,v])=>`<div><span>${YR_AN[k]}</span><i><em style="width:${v}%"></em></i><b>%${v}</b></div>`).join('')}</div>
   ${w.an?`<p class="task-r">Odak: ${YR_AN[w.an]}</p>`:`<div class="chips">${Object.entries(YR_AN).map(([k,v])=>`<button class="chip" data-act="yrAn" data-k="${k}">${v} kapatılsın</button>`).join('')}</div>`}</div></section>`;}
function yrSet(kind,k){const j=jobInit(),f=ourFixture();if(!f)return;const w=j.wk[G.s.week]=j.wk[G.s.week]||{};const opp=f[0]===G.club?f[1]:f[0];
  if(kind==='tr'){w.tr=k;w.trOk=k===yrTeamNeed();}else{w.an=k;w.anOk=k===yrProfile(opp,'o').main;}
  if(w.tr&&w.an)msg('coach','Teknik direktörden not',`${coachOf(G.club).n}: “Hazırlık raporunu aldım. ${w.trOk&&w.anOk?'Tam istediğim gibi, eline sağlık.':w.trOk||w.anOk?'Fena değil ama bazı noktaları farklı görüyorum.':'Bu hafta farklı bir plan uygulayacağız.'}”`);save();render();}
/* ---------- gözlemci ---------- */
const SC_POS={KL:'kaleci',DF:'defans',OS:'orta saha',KN:'kanat',FW:'forvet'};
function scTaskNew(){const j=jobInit(),c=myClub(),pos=pick(Object.keys(SC_POS)),age=pick([21,23,25,28]),bud=Math.round(clubBudget(c)*rnd(0.04,0.1)*VALF/EUR_TL/1e5)*1e5;
  j.task={pos,age,bud:Math.max(bud,100000),due:Math.min(G.s.day+70,G.s.cal[G.s.cal.length-1]-5),done:false};msg('board','Yeni gözlem görevi',`Yönetim ${SC_POS[pos]} mevkisi için en fazla ${age} yaşında, ${eur(j.task.bud)} bütçeli bir oyuncu istiyor. Son tarih ${fmtDate(dateOf(j.task.due))}.`);}
function scLeagues(){const t=curLeague().tier,j=jobInit();return Object.keys(LEAGUES).filter(l=>!LEAGUES[l].youth&&LEAGUES[l].tier>=Math.max(3,t-2)&&LEAGUES[l].tier<=Math.min(9,t+1+j.lvl));}
function scGo(lid){const j=jobInit();if(j.trip)return toast('Zaten yoldasın');const far=LEAGUES[lid].cc!==curLeague().cc;j.trip={lid,days:far?(UP('sc_ucus')?2:3):1};if(far)G.p.money=Math.max(0,G.p.money-0);toast(`${LEAGUES[lid].short} gözlemine çıktın (${j.trip.days} gün)`);save();render();}
function scReveal(lid,n){const j=jobInit(),t=j.task;const pool=[];for(const c of leagueClubs(lid))if(c.id!==G.club)for(const p of squadOf(c.id))pool.push(Object.assign({},p,{club:c.id}));
  pool.sort((a,b)=>((t&&a.pos===t.pos?8:0)+potOf(a)-a.age*0.4)<((t&&b.pos===t.pos?8:0)+potOf(b)-b.age*0.4)?1:-1);const got=pool.slice(0,12).sort(()=>Math.random()-0.5).slice(0,n);
  for(const p of got){j.kn[p.k]=Math.min(3,(j.kn[p.k]||0)+1);if(!j.short.includes(p.k))j.short.unshift(p.k);}if(j.short.length>18)j.short.length=18;
  msg('scout','Gözlem dönüşü',`${LEAGUES[lid].short} turunda ${got.map(p=>`${p.name} (${CLUBS[p.club].short}, ${p.age})`).join(', ')} dikkatini çekti.`);}
function scKnowRange(p){const j=jobInit(),kv=j.kn[p.k]||0,pt=potOf(p);const w=[8,5,3,1][kv];const r=srng(p.k+'sk'),off=Math.floor(r()*(w+1));return [pt-off,pt-off+w];}
function scVideo(k){const j=jobInit();if(j.vday===G.s.day)return toast('Bugün video analiz yaptın');j.vday=G.s.day;j.kn[k]=Math.min(3,(j.kn[k]||0)+1);toast('Rapor netleşti');save();render();}
function scReport(k){const j=jobInit(),t=j.task,p=pByKey(k);if(!t||t.done||!p)return;const cid=(G.tx&&G.tx[k])||p.home,price=pValue(p);
  let fit=0;const notes=[];if(p.pos===t.pos)fit+=3;else notes.push('mevki uymuyor');if(p.age<=t.age)fit+=2;else notes.push('yaş sınırı aşıldı');if(price<=t.bud)fit+=2;else notes.push('bütçe aşıldı');const pt=potOf(p);fit+=pt>=myClub().str+3?2:pt>=myClub().str-2?1:0;
  j.repsN=(j.repsN||0)+1;t.done=true;const ok=fit>=6;j.reps.unshift({k,y:seasonLabel(G.s.year),ok,ovr:p.ovr,pot:pt,club:cid});
  if(ok){G.tx=G.tx||{};G.tx[k]=G.club;txNote(k,G.club,typeof price==='number'&&price<1e10?price:undefined);syncStr(G.club);syncStr(cid);j.hits=(j.hits||0)+1;j.rep=clamp(j.rep+4,0,100);msg('board','Raporun kabul edildi',`${p.name} için hazırladığın rapor yönetimi ikna etti. Oyuncu ${eur(price)} bedelle kadromuza katıldı.`);}
  else msg('board','Rapor reddedildi',`Yönetim ${p.name} önerisini uygun bulmadı (${notes.join(', ')||'beklenen kalitede değil'}).`);
  setTimeout(()=>{if(G&&G.staff==='scout'&&G.phase==='season')scTaskNew();save();render();},10);save();render();}
function scHTML(){const j=jobInit(),t=j.task;
  const task=t?`<section class="panel"><p class="sub-h"><span>Görev</span><span>${t.done?'Tamamlandı':'Son tarih '+fmtDate(dateOf(t.due))}</span></p><div class="task"><b>${SC_POS[t.pos].toLocaleUpperCase('tr-TR')} · en fazla ${t.age} yaş · bütçe ${eur(t.bud)}</b><small>Uygun oyuncuyu bul, gözlem raporunu netleştir ve yönetime öner.</small></div></section>`:'';
  const trip=j.trip?`<p class="pill warn">${LEAGUES[j.trip.lid].short} gözlemindesin · ${j.trip.days} gün</p>`:'';
  const go=`<section class="panel"><p class="sub-h"><span>Gözlem turu</span><span>${trip||'Lig seç'}</span></p><div class="filt">${scLeagues().map(l=>`<button class="chip" data-act="scGo" data-k="${l}">${flagImg(CC3[LEAGUES[l].cc]||'TUR','fl-row')} ${LEAGUES[l].short}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0">Yurt içi tur 1 gün, yurt dışı 3 gün sürer. Döndüğünde gözlem listen güncellenir.</p></section>`;
  const sl=j.short.map(k=>{const p=pByKey(k);if(!p)return '';const cid=(G.tx&&G.tx[k])||p.home,[lo,hi]=scKnowRange(p),kv=j.kn[k]||0;
    return `<div class="scrow"><button class="trrow" data-act="pcard" data-id="${cid}" data-k="${k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} · ${CLUBS[cid]?esc(CLUBS[cid].short):''} · ${eur(pValue(p))}</small></span><span class="to"><b>${R200(p.ovr)}</b><small>POT ${potTxt(lo,hi)}</small></span><span class="kn">${'●'.repeat(kv)}${'○'.repeat(3-kv)}</span></button><div class="sc-b"><button class="btn sm" data-act="scVid" data-k="${k}">Video analiz</button>${t&&!t.done?`<button class="cta sm" data-act="scRep" data-k="${k}">Yönetime öner</button>`:''}</div></div>`;}).join('');
  const reps=j.reps.slice(0,10).map(r=>{const p=pByKey(r.k);return p?`<li><span>${r.y}</span><b>${esc(p.name)}</b><em class="${r.ok?'res-w':'res-l'}">${r.ok?`alındı · şimdi ${R200(p.ovr)}`:'red'}</em></li>`:'';}).join('');
  return `${task}${go}<section class="panel"><p class="sub-h"><span>Gözlem listesi</span><span>${j.short.length}</span></p>${sl||'<p class="muted">Henüz kimseyi izlemedin. Bir gözlem turuna çık.</p>'}</section>${reps?`<section class="panel"><p class="sub-h"><span>Raporlarım</span></p><ul class="cupres">${reps}</ul></section>`:''}`;}
/* ---------- doktor ---------- */
const DR_INJ=[['Arka adale (hamstring) gerilmesi',['Sprint sırasında uyluk arkasında ani batma','Bacağını bükerken ağrı','Topallayarak oyundan çıktı'],[2,4]],
  ['Ayak bileği burkulması',['Dış bilekte şişlik ve morarma','İçe dönüşte keskin ağrı','Basınca ağrı artıyor'],[1,3]],
  ['Menisküs yırtığı',['Dizde kilitlenme hissi','Dönme hareketinde dizin iç yanında ağrı','Maçtan sonra dizde şişlik'],[4,8]],
  ['Ön çapraz bağ kopması',['Temas sonrası dizde “pop” sesi','Dizde boşalma hissi','Hızla gelen ciddi şişlik'],[24,36]],
  ['Kasık zorlanması',['Ani yön değişiminde kasık ağrısı','Bacakları birleştirirken zorlanma','Uzun pasta sızı'],[2,4]],
  ['Baldır kası yırtığı',['Koşarken baldıra taş çarpmış gibi ağrı','Parmak ucunda yükselemiyor','Baldırda hassasiyet'],[3,6]],
  ['Beyin sarsıntısı',['Kafa kafaya çarpışma','Baş dönmesi ve bulantı','Kısa süreli hafıza boşluğu'],[1,2]],
  ['Kaburga çatlağı',['Derin nefeste batma','Göğüs yanında darbe','Öksürünce şiddetli ağrı'],[3,5]],
  ['Aşil tendiniti',['Sabahları topuk arkasında tutukluk','Isındıkça azalan ağrı','Tendonda kalınlaşma'],[2,5]],
  ['Ön uyluk (quadriceps) zorlanması',['Şut atarken ön uylukta ağrı','Dizi uzatırken zorlanma','Uyluk önünde hassasiyet'],[2,4]]];
const DR_TR={kons:{n:'Konservatif',d:'Uzun dinlenme, nüks riski düşük',w:1.3,r:0.04},std:{n:'Standart',d:'Dengeli program',w:1,r:0.1},agr:{n:'Agresif',d:'Hızlı dönüş, nüks riski yüksek',w:0.65,r:0.26}};
function drCaseNew(p){const j=jobInit(),i=Math.floor(Math.random()*DR_INJ.length),opts=shuffle([i,...shuffle(DR_INJ.map((_,x)=>x).filter(x=>x!==i)).slice(0,3)]);j.cases.unshift({k:p.k,name:p.name,i,opts,step:0});if(j.cases.length>8)j.cases.length=8;}
function drDiag(ci,o){const j=jobInit(),cs=j.cases[ci];if(!cs||cs.step)return;cs.dx=o;cs.ok=o===cs.i;cs.step=1;if(cs.ok){j.correct=(j.correct||0)+1;j.rep=clamp(j.rep+1+(UP('dr_steto')?1:0),0,100);}else{j.wrong=(j.wrong||0)+1;j.rep=clamp(j.rep-(UP('dr_ortoped')?1:2),0,100);}save();render();}
function drTreat(ci,t){const j=jobInit(),cs=j.cases[ci];if(!cs||cs.step!==1)return;const D=DR_INJ[cs.i],T=DR_TR[t],base=rint(D[2][0],D[2][1]);let w=Math.max(1,Math.round(base*T.w*(cs.ok?1:1.5))-(UP('dr_kriyo')?1:0));
  j.inj[cs.k]={w,risk:T.r*(UP('dr_havuz')?0.7:1)*(UP('dr_ortoped')?0.85:1)*(cs.ok?1:2.2)*({dusuk:0.8,orta:1,yuksek:1.25}[j.prog]||1),n:D[0]};j.cases.splice(ci,1);msg('injury','Tedavi başladı',`${cs.name}: ${cs.ok?D[0]:'teşhis yanlış konuldu, süreç uzayabilir'}. Tahmini ${w} hafta.`);save();render();}
function drHTML(){const j=jobInit(),inj=Object.entries(j.inj);
  const cases=j.cases.map((cs,ci)=>{const D=DR_INJ[cs.i];return `<div class="case"><b>${esc(cs.name)}</b>${cs.step===0?`<small>Belirtiler:</small><ul>${D[1].map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p class="sub-h" style="margin:6px 0 4px"><span>Teşhis</span></p><div class="chips">${cs.opts.filter(o=>!drElim(cs).includes(o)).map(o=>`<button class="chip" data-act="drDx" data-c="${ci}" data-k="${o}">${esc(DR_INJ[o][0])}</button>`).join('')}</div>`
    :`<p class="task-r">${cs.ok?'✔ Doğru teşhis: ':'✘ Yanlış teşhis. Gerçek durum: '}${esc(D[0])}</p><p class="sub-h" style="margin:6px 0 4px"><span>Tedavi planı</span></p><div class="chips">${Object.entries(DR_TR).map(([k,v])=>`<button class="chip" data-act="drTx" data-c="${ci}" data-k="${k}">${v.n}<small>${v.d}</small></button>`).join('')}</div>`}</div>`;}).join('');
  return `<section class="panel"><p class="sub-h"><span>Tedavi odası</span><span>${j.cases.length} vaka</span></p>${cases||'<p class="muted">Bekleyen vaka yok. Maç sonrası sakatlıklar burada belirir.</p>'}</section>
  <section class="panel"><p class="sub-h"><span>Sakatlar listesi</span><span>${inj.length}</span></p>${inj.length?`<ul class="cupres">${inj.map(([k,v])=>{const p=pByKey(k);return `<li><span>${p?p.pos:''}</span><b>${p?esc(p.name):''}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${esc(v.n)} · nüks riski %${Math.round(v.risk*100)}</small></b><em class="res-l">${v.w} hf</em></li>`;}).join('')}</ul>`:'<p class="muted">Kadroda sakat oyuncu yok.</p>'}</section>
  <section class="panel"><p class="sub-h"><span>Yük yönetimi</span><span>${{dusuk:'Düşük',orta:'Orta',yuksek:'Yüksek'}[j.prog]}</span></p><div class="filt">${[['dusuk','Düşük'],['orta','Orta'],['yuksek','Yüksek']].map(([k,l])=>`<button class="chip" data-act="drProg" data-k="${k}" aria-pressed="${j.prog===k}">${l}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0">Yüksek yük yönetimi sakatlıkları azaltır ama takımın temposunu biraz düşürür; düşükte tempo artar, sakatlık riski yükselir.</p></section>`;}
/* ---------- personel merkez ekranı ---------- */
function staffCard(){const j=jobInit(),c=myClub(),L=lookNow(G.p.age);return `<section class="staff-card"><div class="sc-face">${faceSVG(L,{coach:true,c1:c.c1,age:G.p.age})}</div><div><span class="kicker">${esc(STF[G.staff].n)}</span><h3>${esc(PN())}</h3><small>${esc(j.title)} · ${esc(c.name)}</small>
  <div class="sc-meters"><div><span>İtibar</span><b>${Math.round(j.rep)}</b></div>${G.staff==='yrd'?`<div><span>Hoca güveni</span><b>${Math.round(j.tr)}</b></div><div><span>Katkı</span><b>${j.pts}</b></div>`:G.staff==='scout'?`<div><span>Başarılı rapor</span><b>${j.hits||0}</b></div><div><span>Rapor</span><b>${j.repsN||0}</b></div>`:`<div><span>Doğru teşhis</span><b>${j.correct||0}</b></div><div><span>Nüks</span><b>${j.reinj||0}</b></div>`}</div></div></section>`;}
function viewStaffHub(){const j=jobInit();if(G.phase==='off')return viewStaffOff();const s=G.s,t=dayType(s.day),f=ourFixture(),nm=nextMatchDay(s.day);
  const usHome=f&&f[0]===G.club,tk=t==='kupa'?cupTicket():f?ticketHTML(`${curLeague().short} · ${s.week}. hafta`,`${t==='mac'?'Bugün':fmtDate(dateOf(nm))} · ${usHome?'İç saha':'Deplasman'}`,CLUBS[f[0]],CLUBS[f[1]],`Teknik direktör: ${esc(coachOf(G.club).n)}`):'';
  const cta=t==='mac'?`<button class="cta big" data-act="stMatch"><span>Maç gününe çık</span><small>Takım sahaya çıkıyor · sonuç</small></button>`:t==='kupa'?`<button class="cta big" data-act="stCup"><span>Kupa maçı</span><small>Sonucu gör</small></button>`
    :`<div class="day-ctas"><button class="cta big" data-act="stDay"><span>Günü bitir</span><small>Yarın: ${fmtDate(dateOf(s.day+1))}</small></button><button class="btn" data-act="stAdv">Maç gününe ilerle${nm!=null?` (${nm-s.day} gün)`:''}</button></div>`;
  const prof=G.staff==='yrd'?yrHTML():G.staff==='scout'?scHTML():drHTML();
  return `${staffCard()}${weekStripHTML()}${tk}${cta}${stab('shub',[['is','Görevler',()=>prof],['kupa','Kupalar',cupsPanel],G.staff==='yrd'?['lis','Lisans',licPanel]:null])}`;}
function viewStaffOff(){const j=jobInit(),s=G.summary,c=myClub();
  const offers=(j.offers||[]).map(id=>{const k=CLUBS[id];return `<div class="offer"><div class="offer-head">${crestSVG(k,40)}<div><b>${esc(k.name)}</b><span>${LEAGUES[k.league].name}</span></div></div>${visLine(k)}<button class="cta sm" data-act="stSign" data-id="${id}">${esc(j.title)} olarak anlaş</button></div>`;}).join('');
  const hc=(j.hc||[]).map(id=>{const k=CLUBS[id];return `<div class="offer"><div class="offer-head">${crestSVG(k,40)}<div><b>${esc(k.name)}</b><span>${LEAGUES[k.league].name} · Teknik direktörlük</span></div><span class="pill good">TD</span></div><button class="cta sm" data-act="stHC" data-id="${id}">Teknik direktör ol</button></div>`;}).join('');
  return `${staffCard()}${s?`<section class="panel"><p class="sub-h"><span>Sezon değerlendirmesi</span><span>${s.yl}</span></p><div class="strip"><div><b>${s.pos}.</b><span>Sıra</span></div><div><b>${s.score}</b><span>Puan</span></div><div><b>${Math.round(j.rep)}</b><span>İtibar</span></div><div><b>${j.lvl+1}</b><span>Kademe</span></div><div><b>${G.contract.years}</b><span>Yıl</span></div></div></section>`:''}
  ${hc?`<h2 class="h">Teknik direktörlük teklifleri</h2>${hc}`:''}${offers?`<h2 class="h">İş teklifleri</h2>${offers}`:''}
  ${G.mustMove?'':`<button class="cta big" data-act="stNew"><span>Yeni sezona başla</span><small>${esc(c.name)} ile devam</small></button>`}${G.staff==='yrd'?licPanel():''}
  ${G.p.age+1>=55?`<button class="btn" data-act="mgrRetire">Emekli ol</button>`:''}`;}
function viewStaffClub(){const c=myClub(),cs=cstate(G.club);return `<h2 class="h">Kulüp</h2><section class="panel"><div class="club-hd">${crestSVG(c,52)}<div><h3>${esc(c.name)}</h3><span>${curLeague().name}</span></div></div>${visLine(c)}</section>
  <button class="btn" data-act="ccard" data-id="${G.club}">Teknik direktör kartı · ${esc(coachOf(G.club).n)}</button><button class="btn" data-act="squad" data-id="${G.club}">Takım kadrosu ve oyuncu kartları</button>
  <section class="panel"><p class="sub-h"><span>Sözleşmen</span></p><dl class="offer-terms"><div><dt>Görev</dt><dd>${esc(G.job.title)}</dd></div><div><dt>Haftalık</dt><dd>${money(G.contract.wage)}</dd></div><div><dt>Süre</dt><dd>${G.contract.years} yıl</dd></div><div><dt>Bütçe</dt><dd>${money(clubBudget(c))}</dd></div></dl></section>`;}

ICON.club=ICON.board;
{const _ov=openMatchView;openMatchView=function(){const c=$('#mpCv');if(c)c.hidden=true;return _ov();};const _mp=mgrPlay;mgrPlay=function(sim){const r=_mp(sim);if(!sim&&MR&&MR.mgr)mpSetup();return r;};const _bp=buyPlayer;buyPlayer=function(id,k){if(!trWin())return toast('Transfer dönemi kapalı · '+twNextTxt());return _bp(id,k);};}
