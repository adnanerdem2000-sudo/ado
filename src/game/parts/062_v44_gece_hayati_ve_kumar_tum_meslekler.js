/* ================= v44: gece hayatı ve kumar (tüm meslekler) ================= */
const GB={bj:null,rl:null,race:null};
function gbInit(){G.gb=G.gb||{heat:0,won:0,lost:0,n:0,lotto:[],bets:[],caught:0,last:-99};return G.gb;}
const pMoney=()=>G.p.money||0;
function gbAdult(){return !isPl()||G.p.age>=18;}
function gbProfName(){return isPl()?'futbolcu':G.mode==='mgr'?'teknik direktör':isStaff()&&G.job?G.job.title.toLowerCase():'profesyonel';}
/* para birimi: oyun içi birim → € gösterimi money() ile; bahisler € girilir */
const E2U=v=>v*EUR_TL,U2E=v=>v/EUR_TL;
function gbPay(eurAmt){const u=E2U(eurAmt);if(G.p.money<u)return false;G.p.money-=u;return true;}
function gbWin(eurAmt){G.p.money+=E2U(eurAmt);}
function gbHeat(x){const g=gbInit();g.heat=clamp(g.heat+x,0,100);g.n++;}
/* basına düşme: sıklıkla oynanırsa */
function gbPressCheck(){const g=gbInit();if(g.heat<25||Math.random()>g.heat/260)return;g.heat=Math.max(0,g.heat-30);const nm=(G.p&&G.p.name)||'Oyuncu';
  const head=pick([`${nm} gece yarısı kumarhanede görüntülendi`,`${adEk(nm,'gen')} kumar tutkusu gündemde`,`Gece hayatı skandalı: ${nm} masadan kalkmıyor`]);
  msg('gundem',head,`Magazin basını, ${gbProfName()} ${adEk(nm,'gen')} sık sık kumarhaneye gittiğini yazdı. Kulüp yönetimi rahatsız.`);if(typeof feedAdd==='function')feedAdd({src:'Magazin Manşet',h:'@magazinmanset',cat:'gen',txt:`${head}. Taraftarlar tepkili.`});
  if(isPl()){G.p.fame=Math.max(0,G.p.fame-4);G.p.trust=clamp(G.p.trust-6,0,100);}else if(G.mode==='mgr'&&G.m){G.m.rep=clamp((G.m.rep||40)-4,5,95);G.m.conf=clamp((G.m.conf||50)-6,0,100);if(G.m.fans!=null)G.m.fans=clamp(G.m.fans-4,0,100);}else if(isStaff()&&G.job){G.job.rep=clamp(G.job.rep-5,0,100);}
  toast('Basına yakalandın! İtibarın düştü.');}
/* ---------- blackjack ---------- */
const BJ_S=['♠','♥','♦','♣'],BJ_R=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function bjDeck(){const d=[];for(let k=0;k<4;k++)for(const s of BJ_S)for(const r of BJ_R)d.push({r,s});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function bjVal(h){let v=0,a=0;for(const c of h){if(c.r==='A'){a++;v+=11;}else v+=['J','Q','K'].includes(c.r)?10:+c.r;}while(v>21&&a){v-=10;a--;}return v;}
const bjCard=(c,hide)=>hide?`<span class="card back"></span>`:`<span class="card ${c.s==='♥'||c.s==='♦'?'red':''}"><b>${c.r}</b><i>${c.s}</i></span>`;
/* ---------- rulet ---------- */
const RL_RED=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
/* ---------- at yarışı ---------- */
const HORSES=['Gülbatur','Rüzgarın Oğlu','Karayel','Bozkurt','Yıldırım Bey','Sultan Hanım','Demirkır','Kara Şimşek','Çılgın Tay','Ege Fırtınası'];
function raceNew(){const r=srng('race'+(G.s?G.s.day:0)+(gbInit().n));const H=HORSES.slice().sort(()=>r()-0.5).slice(0,7).map((n,i)=>({n,f:0.7+r()*0.6}));const tot=H.reduce((a,h)=>a+h.f*h.f,0);H.forEach(h=>{h.p=h.f*h.f/tot;h.o=Math.max(1.3,Math.round((0.88/h.p)*10)/10);});return H;}
/* ---------- sayısal loto ---------- */
function lotoDraw(){const g=gbInit();if(!g.lotto.length)return;const pool=[...Array(49)].map((_,i)=>i+1).sort(()=>Math.random()-0.5),D=pool.slice(0,6).sort((a,b)=>a-b);let tot=0;const lines=[];
  for(const t of g.lotto){const k=t.n.filter(x=>D.includes(x)).length,pr=k===6?2500000:k===5?25000:k===4?250:k===3?12:0;tot+=pr;lines.push(`${t.n.join('-')}: ${k} bilen${pr?` → ${eur(pr)}`:''}`);}
  if(tot)gbWin(tot);if(tot>5)g.won+=tot;g.lostL=(g.lostL||0);g.lotto=[];g.lastDraw={D,lines,tot,d:G.s.day};msg(tot>=25000?'gundem':'event','Sayısal Loto çekilişi',`Çekilen sayılar: ${D.join(' - ')}. ${lines.join(' · ')}${tot?` Toplam ikramiye: ${eur(tot)}.`:' İkramiye çıkmadı.'}`);
  if(tot>=2500000){msg('gundem',`${G.p.name} Sayısal Loto’da büyük ikramiyeyi kazandı!`,'Herkes onu konuşuyor.');if(isPl())G.p.fame+=3;}}
/* ---------- maç bahsi (iddaa) ---------- */
function betFixtures(){const S=G.s;if(!S||!S.cal||G.phase!=='season')return [];const out=[];const lids=[S.league,'pl','ll','it1','de1','sl'].filter((x,i,a)=>a.indexOf(x)===i&&LEAGUES[x]);
  for(const lid of lids){if(lid===S.league){const w=S.results.length;const fx=S.fixtures[w];if(fx)for(const [h,a] of fx)out.push({lid,w,h,a});}else{const o=olSync(lid);const w=o.res.length;const fx=o.fx[w];if(fx)for(const [h,a] of fx.slice(0,5))out.push({lid,w,h,a});}}return out.slice(0,24);}
function betOdds(h,a){const [lh,la]=lambdas(CLUBS[h].str,CLUBS[a].str);let pH=0,pD=0,pA=0;const P=(l,k)=>Math.exp(-l)*Math.pow(l,k)/[1,1,2,6,24,120,720][k];for(let i=0;i<7;i++)for(let j=0;j<7;j++){const p=P(lh,i)*P(la,j);if(i>j)pH+=p;else if(i===j)pD+=p;else pA+=p;}const s=pH+pD+pA,m=0.9;return [pH,pD,pA].map(p=>Math.max(1.05,Math.round(m/(p/s)*100)/100));}
function betSettle(){const g=gbInit(),S=G.s;if(!g.bets.length||!S)return;const keep=[];for(const b of g.bets){let res=null;if(b.lid===S.league){const rd=S.results[b.w];if(rd)res=rd.find(x=>x[0]===b.h&&x[1]===b.a);}else{const o=LEAGUES[b.lid]&&olSync(b.lid);const rd=o&&o.res[b.w];if(rd)res=rd.find(x=>x[0]===b.h&&x[1]===b.a);}
    if(!res){if(G.phase==='off')continue;keep.push(b);continue;}const r=res[2]>res[3]?0:res[2]===res[3]?1:2;if(r===b.sel){const p=b.amt*b.o;gbWin(p);g.won+=p-b.amt;msg('event','Bahis kazandı',`${CLUBS[b.h].short} ${res[2]}-${res[3]} ${CLUBS[b.a].short}: ${eur(b.amt)} bahsin ${eur(p)} kazandırdı.`);}else{g.lost+=b.amt;}}g.bets=keep;}
function betCaught(own){const g=gbInit(),nm=G.p.name;g.caught++;g.bets=[];
  const head=`BAHİS SKANDALI: ${nm} yasa dışı bahiste yakalandı`;msg('gundem',head,`Federasyon soruşturması, ${gbProfName()} ${adEk(nm,'gen')}${own?' kendi takımının maçına':''} bahis oynadığını ortaya çıkardı.`);if(typeof feedAdd==='function')feedAdd({src:'Son Dakika',h:'@sondakikaspor',cat:'gen',txt:head+'. Kariyeri tehlikede!'});
  const W=own?8:5;G.unemp={w:W,why:'bahis'};
  if(isPl()){G.p.ban=Math.max(G.p.ban,own?20:10);G.p.fame=Math.max(0,G.p.fame-15);G.p.trust=clamp(G.p.trust-30,0,100);G.mustMove=true;msg('board','Sözleşmen feshedildi',`Kulüp, bahis skandalı nedeniyle sözleşmeni sezon sonunda feshedecek. Federasyon ${G.p.ban} maç men cezası verdi.`);}
  else if(G.mode==='mgr'&&G.m){G.m.rep=clamp((G.m.rep||40)-25,5,95);if(G.phase==='season'){mgrSacked();}G.m.offers=[];msg('board','Görevden alındın',`Yönetim, bahis skandalı nedeniyle sözleşmeni derhal feshetti. Kimse seninle çalışmak istemiyor.`);}
  else if(isStaff()&&G.job){const j=G.job;j.rep=clamp(j.rep-30,0,100);G.phase='off';G.mustMove=true;j.offers=[];G.summary=null;msg('board','İşine son verildi',`Kulüp, bahis skandalı nedeniyle seninle yollarını ayırdı.`);}
  closeModal();save();render();toast('Bahiste yakalandın! Kovuldun.');}
/* işsizlik dönemi: teklif gelmez */
mgrJobOffers=(old=>function(){if(G&&G.unemp&&G.unemp.w>0)return [];return old.apply(this,arguments);})(mgrJobOffers);
staffOffers=(old=>function(){if(G&&G.unemp&&G.unemp.w>0)return [];return old.apply(this,arguments);})(staffOffers);
if(typeof genOffers==='function')genOffers=(old=>function(){if(G&&G.unemp&&G.unemp.w>0)return 0;return old.apply(this,arguments);})(genOffers);
ACTX.unempWait=()=>{const U=G.unemp;if(!U)return;U.w--;if(U.w>0){msg('board','Henüz teklif yok',pick(['Menajerin aradı: “Kulüpler skandal unutulana kadar beklemek istiyor.”','Telefonun çalmıyor. Henüz hiçbir kulüpten teklif yok.','Bir kulüple görüşme ayarlandı ama yönetim son anda vazgeçti.','Henüz teklif yok. Basında adın hâlâ skandalla anılıyor.']));}
  else{G.unemp=null;if(G.mode==='mgr'&&G.m){G.m.offers=mgrJobOffers(Math.max(5,(G.m.rep||30)-10),2);}else if(isStaff()&&G.job){G.job.offers=staffOffers(Math.max(0,G.job.lvl-1),2);}msg('board','Nihayet bir teklif!','Uzun bir bekleyişin ardından alt liglerden birkaç kulüp seninle ilgilenmeye başladı.');}save();render();};
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.unemp&&G.unemp.w>0&&TAB==='hub'&&G.mode!=='player'&&G.phase==='off'){const v=$('#view');if(v&&!v.querySelector('.unemp')){v.insertAdjacentHTML('afterbegin',`<section class="panel unemp"><p class="sub-h"><span>İşsizsin</span><span>Bahis skandalı</span></p><p class="muted">Skandal sonrası kulüpler seninle çalışmak istemiyor. Bekledikçe gündem değişecek.</p><button class="cta" data-act="unempWait">Bir hafta bekle (${G.unemp.w} hafta kaldı)</button></section>`);}}}catch(e){}return r;})(render);
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'){const g=gbInit();betSettle();const wd=wdOf(today());if(wd===3||wd===6)lotoDraw();if(wd===0){g.heat=Math.max(0,g.heat-6);if(isPl()&&G.unemp&&G.unemp.w>0){G.unemp.w--;msg('board','Henüz teklif yok','Ceza süren devam ediyor; hiçbir kulüp şu an seninle görüşmek istemiyor.');}}}}catch(e){console.warn(e);}return out;})(nextDay);
/* ---------- gece hayatı: diğer etkinlikler ---------- */
const NIGHT=[['kulup','Gece kulübü',600,'Moral yükselir, kondisyon düşer, basın riski',{mor:6,en:-12,heat:10}],['rest','Lüks restoran',300,'Moral yükselir',{mor:4,heat:2}],['dost','Arkadaşlarla buluşma',80,'Moral ve takım uyumu',{mor:3,heat:0}],['ev','Evde dinlenme',0,'Kondisyon toparlanır',{en:8,heat:-3}]];
ACTX.night=el=>{const N=NIGHT.find(x=>x[0]===el.dataset.k);if(!N)return;const g=gbInit();if(g.nightD===G.s.day)return toast('Bu akşam zaten dışarıdaydın');if(N[2]&&!gbPay(N[2]))return toast('Bakiyen yetmiyor');g.nightD=G.s.day;const e=N[4];
  if(isPl()){if(e.mor)G.p.morale=clamp((G.p.morale||70)+e.mor,0,100);if(e.en)G.p.energy=clamp((G.p.energy||100)+e.en,0,100);}else if(G.mode==='mgr'&&G.m&&e.mor){G.m.fans=G.m.fans;}
  if(e.heat)gbHeat(e.heat);gbPressCheck();toast(N[1]+': '+N[3]);save();render();};
/* ---------- arayüz ---------- */
let GBT='bj';
function viewNight(){const g=gbInit(),ad=gbAdult();
  return `<h2 class="h">Gece hayatı</h2><div class="fin-kpi"><div><span>Bakiye</span><b>${money(G.p.money)}</b></div><div><span>Kumar net</span><b class="${g.won-g.lost>=0?'pos':'neg'}">${g.won-g.lost>=0?'+':'−'}${eur(Math.abs(Math.round(g.won-g.lost)))}</b></div><div><span>Basın ilgisi</span><b>${Math.round(g.heat)}</b><small>${g.heat>50?'Magazin peşinde!':g.heat>25?'Dikkat çekiyorsun':'Sakin'}</small></div><div><span>Oynanan</span><b>${g.n}</b></div></div>
   <div class="tr-grid"><section class="panel"><p class="sub-h"><span>Akşam planı</span></p><div class="press-a">${NIGHT.map(([k,n,c,d])=>`<button class="btn" data-act="night" data-k="${k}"><b>${n}${c?' · '+eur(c):''}</b><small style="display:block;color:var(--chalk-3)">${d}</small></button>`).join('')}</div></section>
   <section class="panel gb-entry"><p class="sub-h"><span>Kumarhane</span><span>18+</span></p><p class="muted">Blackjack, rulet, at yarışı, Sayısal Loto ve maç bahsi. Kolay para gibi görünür ama kasa her zaman kazanır; sık görülürsen basına düşer, maç bahsinde yakalanırsan kariyerin biter.</p>${ad?'<button class="cta" data-act="gbOpen">Kumarhaneye gir</button>':'<p class="gb-warn">18 yaşından küçükler giremez.</p>'}</section></div>`;}
XV.night=()=>viewNight();XICON.night=NI('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>');NICON.night=XICON.night;
xtabs=(old=>function(){const L=old.apply(this,arguments);if(G&&G.phase!=='tryout'&&G.s&&G.s.cal)L.push(['night','Gece hayatı']);return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{const k=C.find(x=>x[0]==='Kariyer');if(k&&xtabs().some(x=>x[0]==='night'))k[1].push(['night','Gece hayatı',{tab:'night'}]);}catch(e){}return C;})(navCats);

