/* ================= TEKNİK DİREKTÖRLÜK ================= */
const TAC={hucum:{n:'Hücum',f:1.2,a:1.15},dengeli:{n:'Dengeli',f:1,a:1},savunma:{n:'Savunma',f:0.8,a:0.76},pres:{n:'Önde pres',f:1.12,a:0.94}};
function autoXI(sq){const by=pos=>sq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr);const att=[...by('KN'),...by('FW')].sort((a,b)=>b.ovr-a.ovr);
  const xi=[...by('KL').slice(0,1),...by('DF').slice(0,4),...by('OS').slice(0,3),...att.slice(0,3)];const rest=sq.filter(p=>!xi.includes(p)).sort((a,b)=>b.ovr-a.ovr);while(xi.length<11&&rest.length)xi.push(rest.shift());return xi.map(p=>p.k);}
function syncStr(id){const sq=squadOf(id).sort((a,b)=>b.ovr-a.ovr).slice(0,11),base=natSquad(id).sort((a,b)=>b.ovr-a.ovr).slice(0,11);
  const d=sq.reduce((a,p)=>a+p.ovr,0)/Math.max(1,sq.length)-base.reduce((a,p)=>a+p.ovr,0)/Math.max(1,base.length);const c=CLUBS[id],cs=G.cs&&G.cs[id];c.str=Math.round(c.str0+(cs&&cs.boost||0)+d);}
function mgrRep(){const t=G.history.reduce((m,h)=>Math.max(m,LEAGUES[h.league].tier),0);return clamp(Math.round(G.p.fame*0.5+t*6+G.trophies.length*1.5),8,92);}
function mgrJobOffers(rep,n){const mt=rep>78?9:rep>64?8:rep>50?7:rep>36?6:5;
  const cands=Object.values(CLUBS).filter(c=>{const L=LEAGUES[c.league];return !L.youth&&L.tier<=mt&&L.tier>=Math.max(3,mt-2)&&c.id!==(G.m&&G.m.club);}).map(c=>({c,w:Math.exp(-Math.abs(LEAGUES[c.league].tier-mt+0.5))*(LEAGUES[c.league].cc==='TR'?2:1)}));
  const out=[];for(let i=0;i<n&&cands.length;i++){const x=wpick(cands.map(q=>[q,q.w]));cands.splice(cands.indexOf(x),1);out.push(x.c.id);}return out;}
function becomeManager(){if(!G.lic)G.lic={lv:G.p.fame>=60?'B':'C',exp:0};const rep=mgrRep(),ids=mgrJobOffers(rep,3);
  openModal(`<h3>Teknik direktörlük</h3><p>${meN()} kramponlarını astı ve teknik direktörlük belgesini aldı. Kariyerine ve şöhretine göre kulüpler kapını çalıyor (itibar ${rep}).</p>
  ${ids.map(id=>{const c=CLUBS[id];return `<div class="offer"><div class="offer-head">${crestSVG(c,40)}<div><b>${esc(c.name)}</b><span>${LEAGUES[c.league].name}</span></div></div>${visLine(c)}<button class="cta sm" data-act="mgrSign" data-id="${id}">Teknik direktör ol</button></div>`;}).join('')}
  <button class="btn ghost" data-act="closeModal">Vazgeç</button>`);}
function mgrObjective(c){const tb=leagueClubs(c.league).sort((a,b)=>b.str-a.str),rk=tb.findIndex(x=>x.id===c.id)+1,v=clubVision(c),n=tb.length;
  const t=v==='sampiyon'?1:clamp(rk+(v==='genc'||v==='tutumlu'?2:1),1,n-3);return {pos:t,txt:t===1?'Şampiyonluk':t<=3?`İlk ${t}`:t<=n/2?`İlk ${t}`:'Ligde kalmak'};}
function mgrSign(id){const c=CLUBS[id],firstTime=G.mode!=='mgr';closeModal();
  G.mode='mgr';G.club=id;G.contract={years:3,wage:Math.round(LEAGUES[c.league].wage*1.4/50)*50,role:'Teknik Direktör'};
  G.m=Object.assign(G.m||{},{club:id,since:(G.s?G.s.year:2026)+1,conf:60,tac:'dengeli',xi:null,budget:Math.round(clubBudget(c)*0.3*VALF/1e4)*1e4,obj:mgrObjective(c),st:{w:0,d:0,l:0,gf:0,ga:0},rep:G.m&&G.m.rep||mgrRep()});
  G.phase='season';newSeason(G.s.year+1);applyBoosts();syncStr(id);licTick();mgrInit();TAB='hub';
  msg('board',`${c.name} ile anlaştın`,`Teknik direktör olarak ${c.name} yönetimiyle 3 yıllık sözleşme imzaladın. Yönetimin hedefi: ${G.m.obj.txt}. Transfer bütçen ${money(G.m.budget)}.`);
  save();render();window.scrollTo(0,0);if(firstTime)toast(('Yeni dönem: teknik direktör '+meN()));}
function mgrAdvance(){let g=0;while(g++<120&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac'||t==='kupa')break;nextDay();}save();render();window.scrollTo(0,0);}
function mgrPlay(sim){const f=ourFixture();if(!f)return;if(!sim){const uh=f[0]===G.club;return pressConf(CLUBS[uh?f[1]:f[0]],()=>fxStart({opp:CLUBS[uh?f[1]:f[0]],usHome:uh,neutral:false,onEnd:(gu,go,sc)=>mgrFinish(gu,go,f,sc)}));}const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]],me=myClub(),T=tacT(opp),S=xiStr();
  const tpf=(G.m.tp&&G.m.tp.f)||'denge',[lh,la]=lambdas(usHome?S:opp.str,usHome?opp.str:S),lu=(usHome?lh:la)*T.f*(tpf==='hucum'?1.06:1),lo=(usHome?la:lh)*T.a*(tpf==='savunma'?0.93:1);
  if(sim){const _M=typeof mgrMods==='function'?mgrMods(opp):{u:1,o:1};const gu=poisson(lu*_M.u),go=poisson(lo*_M.o);return mgrFinish(gu,go,f,[]);}
  }
function mgrFinish(gu,go,f,scorers){const usHome=f[0]===G.club,hg=usHome?gu:go,ag=usHome?go:gu,opp=CLUBS[usHome?f[1]:f[0]],m=G.m;
  const rd=G.s.fixtures[G.s.week-1].map(([h,a])=>{if(h===f[0]&&a===f[1])return [h,a,hg,ag];const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(rd);creditRound(rd,null);
  const win=gu>go,draw=gu===go,exp=(xiStr()-opp.str)/20+(usHome?0.1:-0.1);m.st.gf+=gu;m.st.ga+=go;if(win)m.st.w++;else if(draw)m.st.d++;else m.st.l++;
  m.conf=clamp(m.conf+(win?4:draw?0.5:-4)-exp*3,0,100);const cs=cstate(G.club);cs.board=m.conf;
  msg('report',`Maç raporu: ${CLUBS[f[0]].name} ${hg}-${ag} ${CLUBS[f[1]].name}`,`${win?'Galibiyet':draw?'Beraberlik':'Mağlubiyet'}. Yönetim güveni ${Math.round(m.conf)}. Ligde ${tablePos()}. sıradasınız.`);
  const home=CLUBS[f[0]],away=CLUBS[f[1]];
  openModal(`<h3>Maç sonucu</h3><div class="res-board"><div class="team">${crestSVG(home,38)}<b>${esc(home.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(away,38)}<b>${esc(away.name)}</b></div></div>
  <ul class="notes"><li>Lig sırası: ${tablePos()}. · Hedef: ${m.obj.txt}</li><li>Yönetim güveni: ${Math.round(m.conf)}</li></ul><button class="cta" data-act="closeModal">Devam</button>`);
  G.s.week++;G.s.squad=null;if(G.s.week>NR()){mgrSeasonEnd();}else nextDay();
  if(m.conf<15&&G.phase==='season'){mgrSacked();}save();render();}
function mgrSacked(){const c=myClub();msg('board','Görevine son verildi',`${c.name} yönetimi kötü sonuçlar nedeniyle yollarınızı ayırdı. Yeni kulüp teklifleri bekleniyor.`);
  G.m.rep=clamp((G.m.rep||40)-8,5,95);G.phase='off';G.summary=null;G.m.sacked=true;G.m.offers=mgrJobOffers(G.m.rep,2);G.mustMove=true;}
function mgrSeasonEnd(){loansEnd();contractsSeasonEnd();const c=myClub(),pos=tablePos(),m=G.m,yl=seasonLabel(G.s.year),ok=pos<=m.obj.pos;licOf().exp++;G.mt=G.mt||{w:0,d:0,l:0,s:0};G.mt.w+=m.st.w;G.mt.d+=m.st.d;G.mt.l+=m.st.l;G.mt.s++;
  if(pos===1)G.trophies.push({year:yl,name:`${curLeague().short} Şampiyonluğu (TD)`,club:G.club});
  m.conf=clamp(m.conf+(ok?15:-(pos-m.obj.pos)*4),0,100);m.rep=clamp((m.rep||40)+(ok?5:-3)+(pos===1?6:0),5,95);
  G.history.push({year:yl,age:G.p.age,club:G.club,league:G.s.league,pos:'TD',apps:G.s.results.length,goals:m.st.gf,assists:m.st.ga,rsum:0});
  G.contract.years--;G.phase='off';coachSeasonEnd();qualNext();m.sacked=m.conf<20;G.mustMove=m.sacked||G.contract.years<=0;m.offers=mgrJobOffers(m.rep,ok?3:1).filter(id=>LEAGUES[CLUBS[id].league].tier>=curLeague().tier||m.sacked);
  G.summary={yl,pos,league:G.s.league,club:G.club,awards:pos===1?['Şampiyonluk']:[],apps:0,goals:0,assists:0,avg:0,mgr:true};
  msg('news',`${yl} sezonu bitti`,`${c.name} ligi ${pos}. sırada bitirdi. Hedef: ${m.obj.txt} — ${ok?'başarıldı':'tutturulamadı'}. ${m.sacked?'Yönetim yollarınızı ayırdı.':''}`);archSave();}
function viewMgrOff(){const m=G.m,s=G.summary,c=myClub();
  return `<section class="panel"><p class="sub-h"><span>Yaz arası · teknik direktör</span><span>${s?s.yl:''}</span></p>${s?`<div class="strip"><div><b>${s.pos}.</b><span>Sıra</span></div><div><b>${m.st.w}</b><span>G</span></div><div><b>${m.st.d}</b><span>B</span></div><div><b>${m.st.l}</b><span>M</span></div><div><b>${m.rep}</b><span>İtibar</span></div></div>`:''}</section>
  <section class="ticket"><div class="ticket-head"><span>Durum</span><span>${esc(c.name)}</span></div><div class="ticket-foot">${m.sacked?'<span class="pill red">Görevden alındın</span> Yeni bir kulüp seçmelisin':G.contract.years<=0?'<span class="pill red">Sözleşme bitti</span> Yeni kulüp seç':`<span class="pill">Sözleşme</span> ${G.contract.years} yıl daha`}</div></section>
  ${(m.offers||[]).length?`<h2 class="h">Teklif eden kulüpler</h2>${m.offers.map(id=>{const k=CLUBS[id];return `<div class="offer"><div class="offer-head">${crestSVG(k,40)}<div><b>${esc(k.name)}</b><span>${LEAGUES[k.league].name}</span></div></div>${visLine(k)}<button class="cta sm" data-act="mgrSign" data-id="${id}">Anlaş</button></div>`;}).join('')}`:''}
  ${optPanel()}${G.phase==='off'?`<button class="btn" data-act="friendly">Hazırlık maçı oyna · uyum +6 (${3-((G.m.fr&&G.m.fr.y===G.s.year)?G.m.fr.n:0)}/3)</button>`:''}${G.mustMove||G.p.age+1>=72?'':`<button class="cta big" data-act="mgrNew"><span>Yeni sezona başla</span><small>${esc(c.name)} ile devam</small></button>`}${licPanel()}${G.p.age+1>=58?`<button class="btn" data-act="mgrRetire">${G.p.age+1>=72?'Emekli ol':'Teknik direktörlüğü bırak · emekli ol'}</button>`:''}`;}
function mgrNewSeason(){const c=myClub();G.p.age++;G.phase='season';newSeason(G.s.year+1);applyBoosts();syncStr(G.club);retireNews();licTick();mgrInit();const m=G.m;m.st={w:0,d:0,l:0,gf:0,ga:0};m.xi=null;m.offers=[];m.budget=Math.round(clubBudget(c)*0.3*VALF/1e4)*1e4;instPay();stfSeason();youthIntake();m.obj=mgrObjective(c);m.conf=Math.max(m.conf,45);
  msg('board','Yeni sezon hedefi',`Yönetimin bu sezonki hedefi: ${m.obj.txt}. Transfer bütçen ${money(m.budget)}.`);save();TAB='hub';render();}
function viewMgrHub(){const s=G.s,m=G.m,c=myClub(),t=dayType(s.day),f=ourFixture(),nm=nextMatchDay(s.day);
  if(G.phase==='off')return viewMgrOff();
  const usHome=f&&f[0]===G.club,opp=f?CLUBS[usHome?f[1]:f[0]]:null,S=xiStr();
  const tk=f?ticketHTML(`${curLeague().short} · ${s.week}. hafta`,`${t==='mac'?'Bugün':fmtDate(dateOf(nm))} · ${usHome?'İç saha':'Deplasman'}`,CLUBS[f[0]],CLUBS[f[1]],`Rakip: ${esc(opp.name)}`):'';
  const tac=`<section class="panel"><p class="sub-h"><span>Taktik</span><span>${TAC[m.tac].n}</span></p><div class="filt" style="margin:0">${Object.entries(TAC).map(([k,v])=>`<button class="chip" data-act="tac" data-k="${k}" aria-pressed="${m.tac===k}">${v.n}</button>`).join('')}</div></section>`;
  const st=`<section class="panel"><p class="sub-h"><span>${seasonLabel(s.year)} · teknik direktör</span><span>${s.results.length?tablePos()+'. sıra':'Sezon başı'}</span></p><div class="strip"><div><b>${m.st.w}</b><span>G</span></div><div><b>${m.st.d}</b><span>B</span></div><div><b>${m.st.l}</b><span>M</span></div><div><b>${m.st.gf}:${m.st.ga}</b><span>Gol</span></div><div><b>${Math.round(m.conf)}</b><span>Güven</span></div></div><p class="muted" style="margin-top:8px">Hedef: ${m.obj.txt} · Transfer bütçesi ${money(m.budget)}</p></section>`;
  const cta=t==='kupa'?`${cupTicket()}<button class="cta big" data-act="mgrCupW"><span>Kupa maçını yönet</span><small>2B maç · taktik: ${TAC[m.tac].n}</small></button><button class="btn" data-act="mgrCup">Hızlı sonuç</button>`:t==='mac'?`<button class="cta big" data-act="mgrPlay"><span>Maçı yönet</span><small>2B maç · canlı taktik ve kenardan seslenme</small></button><button class="btn" data-act="mgrSim">Hızlı sonuç</button>`:`<button class="cta big" data-act="mgrAdv"><span>Maç gününe ilerle</span><small>${nm!=null?fmtDate(dateOf(nm))+' · '+(nm-s.day)+' gün':''}</small></button>`;
  return `${weekStripHTML()}${tk}${cta}${talkAlert()}${(G.m.bids||[]).filter(b=>b.until>G.s.day).length?`<button class="talk-alert" data-act="goBids"><b>💼 ${(G.m.bids||[]).filter(b=>b.until>G.s.day).length} transfer teklifi bekliyor</b><small>Takım › Transfer › Gelen teklifler</small></button>`:''}${stab('mhub',[['gen','Genel',()=>`${tac}<section class="panel"><p class="sub-h"><span>Takım kurulumu</span><span>${fmInit().fm.f}</span></p><button class="btn" data-act="goTak">Diziliş, roller ve talimatlar</button></section>${oppAnalysis()}${st}`],['ant','Antrenman',tpPanel],['kupa','Kupalar',cupsPanel],['lis','Lisans',licPanel]])}`;}
function buyPlayer(id,k){const p=squadOf(id).find(x=>x.k===k);if(!p)return;const price=Math.round(pValue(p)*EUR_TL*1.15),m=G.m;if(price>m.budget)return toast('Bütçen yetmiyor');
  const myT=LEAGUES[myClub().league].tier,hisT=LEAGUES[CLUBS[id].league].tier,pa=clamp(0.55+(myT-hisT)*0.18+(p.ovr<=myClub().str+2?0.1:-0.15)+(LEAGUES[CLUBS[id].league].cc===curLeague().cc?0.05:-0.05),0.05,0.9);
  if(!inWindow())return toast('Transfer dönemi kapalı · '+twNextTxt());
  const why=buyWhy(p,id);if(!why&&Math.random()<pa){m.budget-=price;G.tx=G.tx||{};G.tx[k]=G.club;txNote(k,G.club,price/EUR_TL);syncStr(G.club);syncStr(id);m.xi=null;msg('board',`Transfer: ${p.name}`,`${p.name} ${money(price)} karşılığında kadromuza katıldı.`);closeModal();toast(`${p.name} transfer edildi!`);}
  else{const w=why||pick(['Ücret beklentisinde anlaşılamadı','Oyuncu başka bir kulübü tercih etti','Ailesi şehir değiştirmek istemedi']);msg('board',`Transfer olmadı: ${p.name}`,`${p.name} ile anlaşamadın. ${w}.`);toast(`${p.name}: ${w}`);closeModal();}save();render();}
function sellPlayer(k){const sq=squadOf(G.club),p=sq.find(x=>x.k===k);if(!p)return;if(sq.length<=14)return toast('Kadro çok dar, satış yapamazsın');if(!inWindow())return toast('Transfer dönemi kapalı · '+twNextTxt());
  const myT=curLeague().tier,buyers=Object.values(CLUBS).filter(c=>!LEAGUES[c.league].youth&&c.id!==G.club&&Math.abs(LEAGUES[c.league].tier-myT)<=1&&c.str>=p.ovr-6);const b=pick(buyers);if(!b)return toast('Alıcı çıkmadı');
  const price=Math.round(pValue(p)*EUR_TL*rnd(0.8,1.15)/1e4)*1e4;G.m.budget+=price*(1-((G.m.sellOn&&G.m.sellOn[k]&&G.m.sellOn[k].pct)||0)/100);if(G.m.ct)delete G.m.ct[k];G.tx=G.tx||{};G.tx[k]=b.id;txNote(k,b.id,price/EUR_TL);syncStr(G.club);syncStr(b.id);G.m.xi=null;
  msg('board',`Satış: ${p.name}`,`${p.name}, ${b.name} kulübüne ${money(price)} karşılığında satıldı.`);closeModal();toast(`${p.name} satıldı: ${money(price)}`);save();render();}
function xiToggle(k){const sq=squadOf(G.club);let xi=mgrXI().slice();const p=sq.find(x=>x.k===k);
  if(xi.includes(k)){const alt=sq.filter(x=>!xi.includes(x.k)&&x.pos===p.pos).sort((a,b)=>b.ovr-a.ovr)[0]||sq.filter(x=>!xi.includes(x.k)).sort((a,b)=>b.ovr-a.ovr)[0];if(!alt)return;xi[xi.indexOf(k)]=alt.k;toast(`${alt.name} ilk 11’e girdi`);}
  else{const same=xi.map(x=>sq.find(q=>q.k===x)).filter(q=>q.pos===p.pos).sort((a,b)=>a.ovr-b.ovr)[0]||xi.map(x=>sq.find(q=>q.k===x)).sort((a,b)=>a.ovr-b.ovr)[0];xi[xi.indexOf(same.k)]=k;toast(`${p.name} ilk 11’de, ${same.name} yedekte`);}
  G.m.xi=xi;save();if(!$('#modal').hidden)closeModal();render();}
function viewMgrBoard(){const c=myClub(),L=curLeague(),cs=cstate(G.club),m=G.m,stars=n=>`${'★'.repeat(n)}<i class="off">${'★'.repeat(5-n)}</i>`;
  return `<h2 class="h">Yönetim</h2><section class="panel"><div class="club-hd">${crestSVG(c,52)}<div><h3>${esc(c.name)}</h3><span>${L.name}</span></div></div>${visLine(c)}
  <div class="meters" style="margin-top:12px">${meter('Yönetim güveni',Math.round(m.conf),lvl(Math.round(m.conf)))}${meter('İtibarın',m.rep,'blue')}</div></section>
  <section class="panel"><p class="sub-h"><span>Kulüp durumu</span></p><div class="fac"><div><span>Hedef</span><b>${m.obj.txt}</b><small>Şu an ${G.s.results.length?tablePos()+'. sıra':'sezon başı'}</small></div><div><span>Transfer bütçesi</span><b>${money(m.budget)}</b><small>Yıllık bütçe ${money(clubBudget(c))}</small></div>
  <div><span>Antrenman tesisi</span><b class="stars">${stars(cs.fac)}</b></div><div class="clk" data-act="ccard" data-id="${G.club}"><span>Teknik direktör</span><b>${esc(coachOf(G.club).n)}</b><small>${flagImg(coachOf(G.club).nat,'fl-row')} ${coachOf(G.club).age} yaş · kart ›</small></div><div><span>Stadyum</span><b>${esc(stadName(c))}</b><small>${cs.cap.toLocaleString('tr-TR')} kişilik</small></div></div></section>
  <section class="panel"><p class="sub-h"><span>Yönetimden talep et</span></p><div class="reqs"><button class="req" data-act="mreq" data-k="budget" ${reqLeft('mbud')?'disabled':''}><b>Ek transfer bütçesi</b><small>${reqLeft('mbud')?reqLeft('mbud')+' gün sonra':'Güven yüksekse kabul edilir'}</small></button><button class="req" data-act="breq" data-k="tesis" ${reqLeft('tesis')?'disabled':''}><b>Tesis yatırımı</b><small>${reqLeft('tesis')?reqLeft('tesis')+' gün sonra':'Antrenman tesislerini geliştir'}</small></button><button class="req" data-act="mreq" data-k="quit"><b>İstifa et</b><small>Sezon sonunda yeni kulüp ararsın</small></button></div></section>`;}
function mgrReq(k){const m=G.m;if(k==='budget'){(G.req=G.req||{}).mbud=absDay()+60;const ok=Math.random()<clamp(0.15+(m.conf-50)/80,0.05,0.8);if(ok){const add=Math.round(clubBudget(myClub())*rnd(0.06,0.14)/1e4)*1e4;m.budget+=add;toast(`Yönetim ${money(add)} ek bütçe verdi`);}else{m.conf=clamp(m.conf-3,0,100);toast('Yönetim ek bütçeyi reddetti');}}
  else if(k==='quit'){m.conf=0;mgrSacked();msg('board','İstifa ettin',`${myClub().name} görevinden istifa ettin.`);}
  save();render();}

const COACH_REAL={
galatasaray:['Okan Buruk','TUR',1973,'4-2-3-1',2022,[['Süper Lig',5],['Türkiye Kupası',2],['Süper Kupa',1]],true],
fenerbahce:['İsmail Kartal','TUR',1961,'4-2-3-1',2026,[['Süper Kupa',1]],true],
besiktas:['Vincenzo Italiano','ITA',1977,'4-3-3',2026,[['İtalya Kupası',1]],true],
trabzonspor:['Thomas Reis','GER',1973,'4-2-3-1',2026,[],true],
basaksehir:['Nuri Şahin','TUR',1988,'4-2-3-1',2025,[],true],
samsunspor:['Thorsten Fink','GER',1967,'4-2-3-1',2026,[['İsviçre Ligi',2],['İsviçre Kupası',1],['Japonya Kupası',1],['Süper Kupa',1]],true],
goztepe:['Stanimir Stoilov','BUL',1967,'3-5-2',2023,[['Bulgaristan Ligi',2],['Bulgaristan Kupası',4],['Kazakistan Ligi',3],['Kazakistan Kupası',1],['Süper Kupa',2]],true],
rizespor:['Recep Uçar','TUR',1975,'4-2-3-1',2025,[],true],
konyaspor:['İlhan Palut','TUR',1976,'4-2-3-1',2026,[],true],
alanyaspor:['João Pereira','POR',1984,'3-4-3',2026,[],true],
kasimpasa:['Emre Belözoğlu','TUR',1980,'4-2-3-1',2025,[],true],
eyupspor:['Mustafa Dalcı','TUR',1973,'4-2-3-1',2026,[],true],
kocaelispor:['Selçuk İnan','TUR',1985,'4-2-3-1',2025,[],true],
gaziantep:['Orhan Ak','TUR',1979,'4-2-3-1',2026,[],true],
genclerbirligi:['Bernd Storck','GER',1963,'4-2-3-1',2026,[],true],
amedspor:['Besnik Hasi','ALB',1971,'4-2-3-1',2026,[['Belçika Ligi',1],['Süper Kupa',1]],true],
erzurumspor:['Serkan Özbalta','TUR',1979,'4-2-3-1',2025,[],true],
corum:['Burak Yılmaz','TUR',1985,'4-2-3-1',2026,[],true],
ars:['Mikel Arteta','ESP',1982,'4-3-3',2019,[['Premier League',1],['FA Cup',1],['Süper Kupa',3]],true],
mci:['Enzo Maresca','ITA',1980,'4-2-3-1',2026,[['Konferans Ligi',1],['Kulüpler Dünya Kupası',1]],true],
liv:['Andoni Iraola','ESP',1982,'4-2-3-1',2026,[['Süper Kupa',1]],true],
che:['Xabi Alonso','ESP',1981,'3-4-2-1',2026,[['Bundesliga',1],['DFB Pokal',1],['Süper Kupa',1]],true],
new:['Matthias Jaissle','GER',1988,'4-2-3-1',2026,[['Avusturya Ligi',2],['Avusturya Kupası',1],['AFC Şampiyonlar Ligi',2],['Süper Kupa',1]],true],
avl:['Unai Emery','ESP',1971,'4-2-3-1',2022,[['Avrupa Ligi',5],['Ligue 1',1],['Fransa Kupası',2],['Fransa Lig Kupası',2],['Süper Kupa',2]],true],
mun:['Michael Carrick','ENG',1981,'4-2-3-1',2026,[],true],
tot:['Roberto De Zerbi','ITA',1979,'4-2-3-1',2026,[['Süper Kupa',1]],true],
bha:['Fabian Hürzeler','GER',1993,'4-2-3-1',2024,[],true],
nfo:['Oliver Glasner','AUT',1974,'3-4-2-1',2026,[['Avrupa Ligi',1],['FA Cup',1],['Konferans Ligi',1],['Süper Kupa',1]],true],
cry:['Pierre Sage','FRA',1979,'3-4-3',2026,[['Fransa Kupası',1]],true],
bou:['Marco Rose','GER',1976,'4-4-2',2026,[['Avusturya Ligi',2],['Avusturya Kupası',1],['DFB Pokal',1],['Süper Kupa',1]],true],
bre:['Keith Andrews','IRL',1980,'4-2-3-1',2025,[],true],
ful:['Álvaro Arbeloa','ESP',1983,'4-3-3',2026,[],true],
eve:['David Moyes','SCO',1963,'4-2-3-1',2025,[['Konferans Ligi',1],['Süper Kupa',1]],true],
lee:['Daniel Farke','GER',1976,'4-3-3',2023,[],true],
sun:['Régis Le Bris','FRA',1975,'4-2-3-1',2024,[],true],
cov:['Frank Lampard','ENG',1978,'4-2-3-1',2024,[],true],
ips:['Gary O\'Neil','ENG',1983,'4-2-3-1',2026,[],true],
hul:['Sergej Jakirović','BIH',1976,'4-2-3-1',2025,[['Bosna Hersek Ligi',1],['Hırvatistan Ligi',1],['Hırvatistan Kupası',1]],true],
rma:['José Mourinho','POR',1963,'4-2-3-1',2026,[['Primeira Liga',2],['Premier League',3],['Serie A',2],['LaLiga',1],['Portekiz Kupası',1],['FA Cup',1],['Lig Kupası',4],['İtalya Kupası',1],['Copa del Rey',1],['Şampiyonlar Ligi',2],['Avrupa Ligi',2],['Konferans Ligi',1],['Süper Kupa',5]],true],
fcb:['Hansi Flick','GER',1965,'4-2-3-1',2024,[['Bundesliga',1],['LaLiga',2],['DFB Pokal',1],['Copa del Rey',1],['Şampiyonlar Ligi',1],['Kulüpler Dünya Kupası',1],['UEFA Süper Kupa',1],['Süper Kupa',3]],true],
atm:['Diego Simeone','ARG',1970,'4-4-2',2011,[['LaLiga',2],['Arjantin Ligi',2],['Copa del Rey',1],['Avrupa Ligi',2],['UEFA Süper Kupa',2],['Süper Kupa',1]],true],
vil:['Iñigo Pérez','ESP',1988,'4-4-2',2026,[],true],
ath:['Edin Terzić','GER',1982,'4-2-3-1',2026,[['DFB Pokal',1]],true],
bet:['Manuel Pellegrini','CHI',1953,'4-2-3-1',2020,[['Premier League',1],['Arjantin Ligi',2],['Ekvador Ligi',1],['Lig Kupası',2],['Copa del Rey',1],['Şili Kupası',1]],true],
rso:['Pellegrino Matarazzo','USA',1977,'4-4-2',2025,[['Copa del Rey',1]],true],
cel:['Claudio Giráldez','ESP',1988,'3-4-3',2024,[],true],
val:['Javier Aguirre','MEX',1958,'4-4-2',2026,[['Meksika Ligi',1],['Altın Kupa',2],['CONCACAF Uluslar Ligi',1]],true],
sev:['Luis García Plaza','ESP',1972,'4-4-2',2026,[],true],
osa:['Luis Miguel Ramis','ESP',1970,'4-2-3-1',2026,[],true],
esp:['Manolo González','ESP',1979,'4-4-2',2023,[],true],
ray:['Beñat San José','ESP',1979,'4-4-2',2026,[['Bolivya Ligi',2],['Şili Ligi',1],['Suudi Arabistan Kupası',1]],true],
get:['José Bordalás','ESP',1964,'4-4-2',2021,[],true],
ala:['Quique Sánchez Flores','ESP',1965,'4-4-2',2026,[['Avrupa Ligi',1],['UEFA Süper Kupa',1]],true],
elc:['Martín Anselmi','ARG',1985,'3-4-3',2026,[['Copa Sudamericana',1],['Recopa Sudamericana',1]],true],
lev:['Luís Castro','POR',1961,'4-3-3',2025,[['Ukrayna Ligi',1]],true],
dep:['Antonio Hidalgo','ESP',1979,'4-2-3-1',2025,[],true],
mal:['Juan Francisco Funes','ESP',1983,'4-2-3-1',2025,[],true],
rac:['José Alberto López','ESP',1982,'4-4-2',2024,[],true],
inter:['Cristian Chivu','ROU',1980,'3-5-2',2025,[['Serie A',1],['İtalya Kupası',1]],true],
napoli:['Massimiliano Allegri','ITA',1967,'3-5-2',2026,[['Serie A',6],['İtalya Kupası',5],['Süper Kupa',3]],true],
juve:['Luciano Spalletti','ITA',1959,'3-4-2-1',2025,[['Serie A',1],['Rusya Ligi',2],['İtalya Kupası',2],['Rusya Kupası',1],['Süper Kupa',2]],true],
milan:['Rúben Amorim','POR',1985,'3-4-3',2026,[['Primeira Liga',2],['Lig Kupası',3],['Süper Kupa',1]],true],
atalant:['Maurizio Sarri','ITA',1959,'4-3-3',2026,[['Serie A',1],['Avrupa Ligi',1]],true],
roma:['Gian Piero Gasperini','ITA',1958,'3-4-2-1',2025,[['Avrupa Ligi',1]],true],
como:['Cesc Fàbregas','ESP',1987,'4-2-3-1',2024,[],true],
lazio:['Gennaro Gattuso','ITA',1978,'4-3-3',2026,[['İtalya Kupası',1]],true],
bologna:['Raffaele Palladino','ITA',1984,'3-4-2-1',2026,[],true],
fiorent:['Paolo Vanoli','ITA',1972,'3-5-2',2026,[],true],
torino:['Ignazio Abate','ITA',1986,'3-5-2',2026,[],true],
udinese:['Kosta Runjaić','GER',1971,'3-5-2',2024,[['Polonya Kupası',1],['Süper Kupa',1]],true],
genoa:['Daniele De Rossi','ITA',1983,'3-5-2',2025,[],true],
sassuol:['Alberto Aquilani','ITA',1984,'4-3-3',2026,[],true],
cagliar:['Fabio Pisacane','ITA',1986,'3-5-2',2025,[],true],
parma:['Alberto Gilardino','ITA',1982,'3-5-2',2026,[],true],
lecce:['Eusebio Di Francesco','ITA',1969,'4-3-3',2025,[],true],
monza:['Ivan Jurić','CRO',1975,'3-4-2-1',2026,[],true],
venezia:['Giovanni Stroppa','ITA',1968,'3-5-2',2025,[],true],
frosino:['Massimiliano Alvini','ITA',1970,'4-3-3',2025,[],true],
bayern:['Vincent Kompany','BEL',1986,'4-2-3-1',2024,[['Bundesliga',2],['DFB Pokal',1],['Süper Kupa',2]],true],
levkus:['Carles Martínez Novell','ESP',1984,'3-4-3',2026,[],true],
bvb:['Niko Kovač','CRO',1971,'3-4-2-1',2025,[['Bundesliga',1],['DFB Pokal',2],['Süper Kupa',1]],true],
leipzig:['Martín Demichelis','ARG',1980,'4-3-3',2026,[['Arjantin Ligi',1],['Süper Kupa',2]],true],
vfbstu:['Sebastian Hoeneß','GER',1982,'4-2-3-1',2023,[['DFB Pokal',1]],true],
frankft:['Adi Hütter','AUT',1970,'3-4-2-1',2026,[['Avusturya Ligi',1],['Avusturya Kupası',1],['İsviçre Ligi',1]],true],
freibg:['Julian Schuster','GER',1985,'4-2-3-1',2024,[],true],
hoffen:['Christian Ilzer','AUT',1977,'4-4-2',2024,[['Avusturya Ligi',1],['Avusturya Kupası',2]],true],
bmg:['Alexander Blessin','GER',1973,'3-4-3',2026,[['Belçika Kupası',1]],true],
bremen:['Daniel Thioune','GER',1974,'4-2-3-1',2026,[],true],
mainz:['Urs Fischer','SUI',1966,'3-5-2',2025,[['İsviçre Ligi',2],['İsviçre Kupası',1]],true],
unionb:['Mauro Lustrinelli','SUI',1976,'4-4-2',2026,[['İsviçre Ligi',1]],true],
augsbg:['Manuel Baum','GER',1979,'3-4-3',2025,[],true],
koeln:['René Wagner','GER',1988,'3-4-3',2026,[],true],
hsv:['Merlin Polzin','GER',1990,'3-4-3',2024,[],true],
schalke:['Miron Muslić','BIH',1982,'4-4-2',2025,[],true],
elversb:['Vincent Wagner','GER',1986,'4-3-3',2025,[],true],
paderb:['Ralf Kettemann','GER',1986,'4-3-3',2025,[],true],
psg:['Luis Enrique','ESP',1970,'4-3-3',2023,[['LaLiga',2],['Copa del Rey',3],['Ligue 1',3],['Fransa Kupası',2],['Şampiyonlar Ligi',3],['UEFA Süper Kupa',3],['Kulüpler Dünya Kupası',2],['Süper Kupa',4]],true],
om:['Bruno Génésio','FRA',1966,'4-2-3-1',2026,[],true],
asm:['Filipe Luís','BRA',1985,'4-3-3',2026,[['Brezilya Ligi',1],['Brezilya Kupası',1],['Copa Libertadores',1],['Süper Kupa',1]],true],
losc:['Davide Ancelotti','ITA',1989,'4-3-3',2026,[],true],
ol:['Paulo Fonseca','POR',1973,'4-2-3-1',2025,[['Ukrayna Ligi',3],['Ukrayna Kupası',3],['Portekiz Kupası',1],['Süper Kupa',2]],true],
rcl:['Dino Toppmöller','GER',1980,'4-2-3-1',2026,[['Lüksemburg Ligi',3],['Lüksemburg Kupası',2],['Süper Kupa',3]],true],
ogcn:['Olivier Pantaloni','FRA',1966,'4-4-2',2026,[],true],
rcs:['Hugo Oliveira','POR',1979,'4-2-3-1',2026,[],true],
srfc:['Franck Haise','FRA',1971,'3-4-3',2026,[],true],
sb29:['Julien Lachuer','FRA',1976,'4-3-3',2026,[],true],
tfc:['Jens Berthel Askou','DEN',1982,'4-3-3',2026,[['Faroe Adaları Ligi',1],['Faroe Adaları Kupası',1]],true],
pfc:['Liam Rosenior','ENG',1984,'4-2-3-1',2026,[],true],
aja:['Will Still','BEL',1992,'4-3-3',2026,[],true],
fcl:['Alexandre Dujeux','FRA',1976,'3-5-2',2026,[],true],
sco:['Stéphane Gilli','FRA',1974,'4-3-3',2026,[],true],
hac:['Didier Digard','FRA',1986,'4-2-3-1',2024,[],true],
est:['Stéphane Dumont','FRA',1982,'4-3-3',2024,[],true],
lms:['Patrick Videira','FRA',1977,'4-3-3',2024,[],true],
};
