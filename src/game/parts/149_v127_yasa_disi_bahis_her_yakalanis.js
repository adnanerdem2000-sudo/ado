/* ================= v127: yasa dışı bahis — her yakalanış kovulma değil; çoğu bahis fark edilmez; bahis geçmişi; skandal sicili ve itibar =================
   Yakalanma olasılığı (maç başına): kendi takımının maçı %12, kendi ligi %3,5, diğer ligler %1,2 — bahis tutarıyla ve önceki soruşturmalarla artar.
   Yakalanınca: disiplin uyarısı + para cezası, ya da görevden uzaklaştırma (futbolcuda men), ya da kovulma. Kendi takımına bahis ve tekrar eden
   suçlar kovulma ihtimalini büyütür. Kovulma kariyer geçmişine yazılır; itibar düşer; itibar eski seviyesine dönene kadar kulüpler daha az ve düşük
   maaşlı teklif yapar. */
function betRisk(own,sameL,amt,caught){const base=own?0.12:sameL?0.035:0.012;const fa=clamp(0.6+0.25*Math.log10(Math.max(20,amt)/100),0.5,1.6);return base*fa*(1+(caught||0)*0.35);}
function betRepNow(){try{if(G.mode==='mgr'&&G.m)return G.m.rep||40;if(isStaff()&&G.job)return G.job.rep||30;return G.p.fame||0;}catch(e){return 30;}}
function betRec(e){(G.betRec=G.betRec||[]).unshift(Object.assign({y:G.s?seasonLabel(G.s.year):'',d:G.s?G.s.day:0},e));if(G.betRec.length>30)G.betRec.length=30;}
/* tek maç bahsi (eski kumarhane sekmesi) */
betPlace=function(i,sel,amt){const F=betFixtures()[+i];if(!F)return;const o=betOdds(F.h,F.a)[+sel];if(!gbPay(amt))return toast('Bakiyen yetmiyor');const g=gbInit();gbHeat(6);
  const own=F.h===G.club||F.a===G.club,sameL=F.lid===G.s.league;
  if(Math.random()<betRisk(own,sameL,amt,g.caught)){betRec({k:'el',t:`${CLUBS[F.h].short}–${CLUBS[F.a].short} · ${['1','X','2'][+sel]}`,amt,o,res:'el konuldu'});betCaught(own,amt);return;}
  g.bets.push({lid:F.lid,w:F.w,h:F.h,a:F.a,sel:+sel,o,amt,d:G.s.day});save();toast(`Bahis yatırıldı · oran ${o}`);gbModal();};
betSettle=function(){const g=gbInit(),S=G.s;if(!g.bets.length||!S)return;const keep=[];g.bh=g.bh||[];
  for(const b of g.bets){let res=null;if(b.lid===S.league){const rd=S.results[b.w];if(rd)res=rd.find(x=>x[0]===b.h&&x[1]===b.a);}else{const o=LEAGUES[b.lid]&&olSync(b.lid);const rd=o&&o.res[b.w];if(rd)res=rd.find(x=>x[0]===b.h&&x[1]===b.a);}
    if(!res){if(G.phase==='off'){gbWin(b.amt);g.bh.unshift(Object.assign({},b,{res:'iade'}));continue;}keep.push(b);continue;}const r=res[2]>res[3]?0:res[2]===res[3]?1:2;
    if(r===b.sel){const p=Math.round(b.amt*b.o);gbWin(p);g.won+=p-b.amt;g.bh.unshift(Object.assign({},b,{res:'kazandı',pay:p,sc:res[2]+'-'+res[3]}));msg('event','Bahis kazandı',`${CLUBS[b.h].short} ${res[2]}-${res[3]} ${CLUBS[b.a].short}: ${eur(b.amt)} bahsin ${eur(p)} kazandırdı.`);}
    else{g.lost+=b.amt;g.bh.unshift(Object.assign({},b,{res:'kaybetti',sc:res[2]+'-'+res[3]}));}}
  g.bets=keep;if(g.bh.length>30)g.bh.length=30;};
/* iddaa kuponu */
CZA.ibPlay=()=>{const I=ibS(),g=czG();if(!I.slip.length)return czMsg('Kupona maç ekle');if(!ibCanBet())return czMsg('Sezon dışında bahis yapılamaz');const amt=Math.max(2,Math.round(I.amt||0));
  const sel=I.slip.map(x=>Object.assign({},x));const o=Math.round(sel.reduce((a,x)=>a*x.o,1)*100)/100;if(!gbPay(amt))return czMsg(`Nakit paran yetmiyor (kupon ${eur(amt)})`);gbHeat(5+sel.length);
  const gc=gbInit();let pc=1,own=false;for(const s of sel){const ow=s.h===G.club||s.a===G.club;own=own||ow;pc*=1-betRisk(ow,s.lid===G.s.league,amt/Math.sqrt(sel.length),gc.caught);}
  I.slip=[];const id=Date.now()%1e9;
  if(Math.random()<1-pc){g.cpH=g.cpH||[];g.cpH.unshift({id,sel,o,amt,d:G.s.day,y:G.s.year,v2:1,res:'kaybetti',conf:1});betRec({k:'el',t:`${sel.length} maçlık kupon`,amt,o,res:'el konuldu'});czClose();betCaught(own,amt);return;}
  g.cps.push({id,sel,o,amt,d:G.s.day,y:G.s.year,v2:1});save();czMsg(`Kupon oynandı · ${sel.length} maç · oran ${o.toFixed(2)} · olası kazanç ${eur(Math.round(amt*o))}`);I.tab='kp';czRender();};
/* yakalanınca: uyarı / uzaklaştırma / kovulma */
betCaught=(old=>function(own,amt){const g=gbInit(),nm=G.p.name,prev=g.caught||0,r=Math.random();amt=amt||100;
  let lvl;if(own)lvl=r<0.55?3:r<0.9?2:1;else if(prev>=2)lvl=r<0.4?3:r<0.85?2:1;else lvl=r<0.12?3:r<0.6?2:1;
  const rep0=betRepNow();
  if(lvl===3){const r2=old.apply(this,arguments);try{betRec({k:'kov',t:own?'Kendi takımının maçına bahis':'Yasa dışı bahis',res:'kovuldu'});if(typeof msAdd==='function')msAdd(`Bahis skandalı: ${own?'kendi takımının maçına bahis nedeniyle ':''}görevden kovuldu`,'inj');
      if(G.stig){G.stig.rep0=Math.max(rep0,G.stig.rep0||0);G.stig.fired=1;}
      if(G.mode==='mgr'&&G.m)G.m.rep=clamp(G.m.rep-5,5,95);else if(isStaff()&&G.job)G.job.rep=clamp(G.job.rep-5,0,100);else G.p.fame=Math.max(0,G.p.fame-5);save();}catch(e){}return r2;}
  g.caught=prev+1;g.bets=[];const fine=Math.round(Math.max(2500,amt*4)/100)*100;try{G.p.money=Math.max(0,G.p.money-E2U(fine));}catch(e){}
  const head=lvl===2?`${nm}, bahis soruşturması nedeniyle görevden uzaklaştırıldı`:`${adEk(nm,'dat')} bahis uyarısı`;
  try{msg('gundem',head,`Federasyon disiplin kurulu, ${gbProfName()} ${adEk(nm,'gen')}${own?' kendi takımının maçına':''} bahis oynadığını tespit etti.`);if(typeof feedAdd==='function')feedAdd({src:'Son Dakika',h:'@sondakikaspor',cat:'gen',txt:head+'.'});}catch(e){}
  if(lvl===2){const w=own?6:3+Math.floor(Math.random()*3);
    if(isPl()){G.p.ban=Math.max(G.p.ban||0,w);G.p.fame=Math.max(0,G.p.fame-8);G.p.trust=clamp((G.p.trust||50)-15,0,100);msg('board','Men cezası ve para cezası',`Federasyon ${w} maç men ve ${eur(fine)} para cezası verdi. Kulüp şimdilik sözleşmeni feshetmiyor ama güven sarsıldı.`);}
    else if(G.mode==='mgr'&&G.m){G.m.rep=clamp((G.m.rep||40)-12,5,95);G.m.conf=clamp((G.m.conf||50)-20,0,100);if(G.susp&&G.susp.w>0){G.susp.w+=w;}else{G.susp={w,why:'bahis',w0:G.contract&&G.contract.wage};if(G.contract)G.contract.wage=Math.round(G.contract.wage/2/50)*50;}msg('board','Görevden uzaklaştırıldın',`Soruşturma süresince ${w} hafta açığa alındın: maaşının yarısı kesiliyor ve yönetimin güveni her hafta biraz daha azalıyor. ${eur(fine)} para cezası kesildi.`);}
    else if(isStaff()&&G.job){G.job.rep=clamp(G.job.rep-12,0,100);if(G.susp&&G.susp.w>0){G.susp.w+=w;}else{G.susp={w,why:'bahis',w0:G.contract&&G.contract.wage};if(G.contract)G.contract.wage=Math.round(G.contract.wage/2/50)*50;}msg('board','Görevden uzaklaştırıldın',`Kulüp, soruşturma süresince ${w} hafta seni açığa aldı; bu sürede maaşının yarısı kesiliyor. ${eur(fine)} para cezası kesildi.`);}
    betRec({k:'uz',t:own?'Kendi takımının maçına bahis':'Yasa dışı bahis',res:isPl()?`${w} maç men`:`${w} hafta uzaklaştırma`,fine});try{msAdd(isPl()?`Bahis soruşturması: ${w} maç men cezası`:`Bahis soruşturması: ${w} hafta görevden uzaklaştırma`,'inj');}catch(e){}}
  else{if(isPl()){G.p.fame=Math.max(0,G.p.fame-4);G.p.trust=clamp((G.p.trust||50)-6,0,100);}else if(G.mode==='mgr'&&G.m){G.m.rep=clamp((G.m.rep||40)-6,5,95);G.m.conf=clamp((G.m.conf||50)-8,0,100);}else if(isStaff()&&G.job)G.job.rep=clamp(G.job.rep-6,0,100);
    msg('board','Disiplin uyarısı',`Disiplin kurulu ilk ve son uyarısını verdi; ${eur(fine)} para cezası kesildi. Bir daha yakalanırsan ceza çok daha ağır olacak.`);betRec({k:'uy',t:own?'Kendi takımının maçına bahis':'Yasa dışı bahis',res:'uyarı + para cezası',fine});}
  try{closeModal();}catch(e){}save();render();toast(lvl===2?'Bahiste yakalandın: görevden uzaklaştırıldın.':'Bahiste yakalandın: uyarı ve para cezası.');})(betCaught);
/* uzaklaştırma süresi: haftalar geçtikçe biter (TD'de bu sürede yönetim güveni maç başına biraz daha düşer) */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{const U=G&&G.susp;if(U&&U.w>0&&G.s&&G.s.day%7===0){U.w--;if(G.mode==='mgr'&&G.m)G.m.conf=clamp((G.m.conf||50)-1,0,100);if(U.w<=0){if(U.w0&&G.contract)G.contract.wage=U.w0;G.susp=null;msg('board','Görevine döndün','Uzaklaştırma süren doldu; görevine geri döndün. Gözler üzerinde.');}}}catch(e){}return r;})(nextDay);
viewHub=(old=>function(){let h=old.apply(this,arguments);try{const U=G&&G.susp;if(U&&U.w>0)h=`<section class="panel bet-susp"><b>⛔ Görevden uzaklaştırıldın</b><span>Bahis soruşturması · ${U.w} hafta kaldı</span></section>`+h;}catch(e){}return h;})(viewHub);
/* skandal damgası: itibar eski seviyeye dönene kadar sürer; az ve düşük maaşlı teklif */
stigNow=(old=>function(){const S=G&&G.stig;if(!S||!G.s)return null;const byYear=old.apply(this,arguments);if(byYear)return byYear;if(S.rep0!=null&&betRepNow()<S.rep0-3&&G.s.year-S.y<=S.lvl+3)return S;return null;})(stigNow);
mgrJobOffers=(old=>function(rep,n){try{if(stigNow()&&n>1)n=Math.max(1,Math.round(n/2));}catch(e){}return old.call(this,rep,n);})(mgrJobOffers);
staffOffers=(old=>function(lvl,n){try{if(stigNow()&&n>1)n=Math.max(1,Math.round(n/2));}catch(e){}return old.call(this,lvl,n);})(staffOffers);
const betLowWage=(old)=>function(id){const r=old.apply(this,arguments);try{if(stigNow()&&G.contract&&!G.contract.stigCut){G.contract.wage=Math.max(50,Math.round(G.contract.wage*0.6/50)*50);G.contract.stigCut=1;msg('board','Düşük maaşlı sözleşme',`Bahis sicilin nedeniyle kulüp ancak düşük bir maaş önerebildi: ${eur(U2E(G.contract.wage))}/hf. İtibarın düzeldikçe teklifler de iyileşecek.`);}}catch(e){}return r;};
mgrSign=betLowWage(mgrSign);staffSign=betLowWage(staffSign);
pushOffer=(old=>function(o){try{if(stigNow()&&isPl()&&o&&!o.renew&&o.wage){o.wage=Math.max(50,Math.round(o.wage*0.75/50)*50);}}catch(e){}return old.apply(this,arguments);})(pushOffer);
/* bahis geçmişi: kumarhane maç bahsi ve iddaa kuponlarım sekmesi */
function betHistHTML(){const g=gbInit(),H=(g.bh||[]).slice(0,15),R=(G.betRec||[]).slice(0,10);
  return `${H.length?`<p class="sub-h"><span>Sonuçlanan bahisler</span><span>${H.length}</span></p><ul class="cupres">${H.map(b=>`<li><span>${esc(CLUBS[b.h]?CLUBS[b.h].short:'')}–${esc(CLUBS[b.a]?CLUBS[b.a].short:'')} · ${['1','X','2'][b.sel]}${b.sc?' · '+b.sc:''}</span><b class="${b.res==='kazandı'?'pos':b.res==='kaybetti'?'neg':''}">${b.res==='kazandı'?'+'+eur(b.pay):b.res==='kaybetti'?'−'+eur(b.amt):'iade'}</b></li>`).join('')}</ul>`:''}
   ${R.length?`<p class="sub-h"><span>Soruşturma sicili</span><span>${R.filter(x=>x.k!=='el').length}</span></p><ul class="cupres">${R.map(x=>`<li><span>${esc(x.y)} · ${esc(x.t)}</span><b class="${x.k==='el'?'':'neg'}">${esc(x.res)}${x.fine?' · '+eur(x.fine):''}</b></li>`).join('')}</ul>`:''}`;}
gbModal=(old=>function(){const r=old.apply(this,arguments);try{if(typeof GBT!=='undefined'&&GBT==='bh'){const b=$('#modalCard .gb-body');if(b&&!b.querySelector('.bet-hist')){b.insertAdjacentHTML('beforeend',`<div class="bet-hist">${betHistHTML()}</div>`);}const w=$('#modalCard .gb-warn');if(w)w.textContent='⚠ Profesyonel futbol çalışanlarının maçlara bahis oynaması yasaktır. Çoğu bahis fark edilmez ama yakalanırsan uyarı ve para cezası, görevden uzaklaştırma ya da kovulma gelebilir. Kendi takımının maçı ve büyük tutarlar en riskli olanlardır.';}}catch(e){}return r;})(gbModal);
ibCouponsHTML=(old=>function(){let h=old.apply(this,arguments);try{const R=(G.betRec||[]).filter(x=>x.k!=='el');if(R.length)h+=`<div class="ib-cps-w"><p class="ib-sh">Soruşturma sicili <span>${R.length}</span></p>${R.slice(0,10).map(x=>`<div class="ib-cp lost"><div class="ib-cph"><b>${esc(x.y)} · ${esc(x.t)}</b><span><b class="neg">${esc(x.res)}</b>${x.fine?' · '+eur(x.fine):''}</span></div></div>`).join('')}</div>`;}catch(e){}return h;})(ibCouponsHTML);

