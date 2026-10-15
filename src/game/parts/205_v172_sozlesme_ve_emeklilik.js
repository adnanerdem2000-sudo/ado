/* ================= v172: sözleşme maddeleri (futbolcu · teknik direktör · TD'nin oyuncuları), transfer son günü, emeklilik sonrası aynı kayıtta yeni meslek =================
   1) Sözleşme maddeleri
      - Futbolcu: gelen tekliflerde kulübün koyduğu maddeler (serbest kalma bedeli, maç/gol/şampiyonluk primi, sadakat primi, yıllık artış,
        opsiyon yılı, küme düşme indirimi, oynama süresi garantisi, sonraki satıştan pay) görünür; pazarlıkta her madde istenebilir, kulüp kabul eder,
        reddeder ya da karşı teklif verir. Maddeler oyunda işler: primler ödenir, sezon başında artış/indirim uygulanır, opsiyon yılı kullanılır,
        rol garantisi tutulmazsa yönetime şikayet edilir, serbest kalma bedelini yatıran kulüp seni kulübünün onayı olmadan alır (bedel yoksa kulübün
        sezon içi transferi engelleyebilir), satışta bonservisten payın ödenir.
      - Teknik direktörün kendi sözleşmesi: iş teklifinde süre, imza parası, galibiyet primi, hedef primi, yıllık artış, opsiyon, küme düşme indirimi,
        kovulma tazminatı pazarlığı (kabul/ret/karşı teklif).
      - TD'nin oyuncu sözleşmeleri (v41'deki SK/prim/artış/düşme maddelerine ek): şampiyonluk primi, sadakat primi, opsiyon yılı, rol garantisi,
        oyuncuya satıştan pay; ayrıca sattığımız oyuncunun "sonraki satış payı" (v26 sellRev) artık gerçekten tahsil edilir.
   2) Transfer son günü (v76): düğme yerleşimi düzeltildi, saat kendiliğinden ilerleyebiliyor (canlı), son dakika serbest kalma bedeli olayları,
      futbolcuya son gün pazarlığı, son gün satışında önceki kulübe borçlu olunan satış payı düşülüyor.
   3) Emeklilik → yeni meslek: futbolcu (ya da başka meslekten ayrılan) aynı karakter ve kayıtla teknik direktör, yardımcı antrenör, gözlemci,
      sportif direktör ya da kulüp başkanı olur; itibar ve teklifler geçmişe göre. Kariyer geçmişi, kupalar, zaman çizelgesi ve sayaçlar korunur,
      meslek geçmişi Kariyerim'de ayrı satırlarda görünür. Çevrimiçi odada meslek değişince oda bozulmaz, uyarı ve "farklı meslek" bilgisi gösterilir. */
const SOZ72={td:null,ddT:null};
const soz72E=e=>Math.round((+e||0)*EUR_TL);/* € → iç para birimi */
const soz72R=v=>{v=Math.max(0,+v||0);if(!v)return 0;const s=Math.pow(10,Math.max(3,Math.floor(Math.log10(v))-1));return Math.round(v/s)*s;};
const soz72Pct=n=>{try{return pctS(n);}catch(e){return '%'+n;}};
function soz72MV(){try{return Math.max(1e5,marketValue()||0);}catch(e){return 1e5;}}
function soz72TeamTr(t,yl,club){if(!t||t.year!==yl||t.club!==club)return false;const n=String(t.name||'');if(/Gol Kral|Asist Kral|Haftanın|Sezonun|Genç|Altın Top|Ballon|Oyuncu|terfi|Terfi|Kariyer|Rekor/i.test(n))return false;return /Şampiyon|Kupa|Kupası|Süper Kupa|Lig/i.test(n);}

/* =====================================================================
   1a) FUTBOLCU: sözleşme maddeleri
   ===================================================================== */
const SOZ72_PL={
  rc:{n:'Serbest kalma bedeli',L:null},
  ab:{n:'Maç primi',L:[0,10,20]},
  gb:{n:'Gol primi',L:[0,25,50]},
  tb:{n:'Şampiyonluk primi',L:[0,4,8]},
  sad:{n:'Sadakat primi',L:[0,3,6]},
  raise:{n:'Yıllık maaş artışı',L:[0,5,10]},
  opt:{n:'Opsiyon yılı',L:[0,1,2]},
  relc:{n:'Küme düşerse maaş indirimi',L:[0,25,50]},
  pt:{n:'Oynama süresi garantisi',L:[0,1]},
  sell:{n:'Sonraki satıştan pay',L:[0,10,15]}};
const SOZ72_K=Object.keys(SOZ72_PL);
function soz72ClTxt(k,v){v=+v||0;switch(k){
  case 'rc':return v?eur(v):'Yok';
  case 'ab':return v?`maç başına haftalık maaşın ${soz72Pct(v)}`:'Yok';
  case 'gb':return v?`gol başına haftalık maaşın ${soz72Pct(v)}`:'Yok';
  case 'tb':return v?`kazanılan her kupa için ${v} haftalık maaş`:'Yok';
  case 'sad':return v?`kulüpte geçen her sezon ${v} haftalık maaş`:'Yok';
  case 'raise':return v?`her sezon +%${v}`:'Yok';
  case 'opt':return ['Yok','+1 yıl, kulüp lehine','+1 yıl, senin lehine'][v]||'Yok';
  case 'relc':return v?`maaş −%${v}`:'Yok';
  case 'pt':return v?'rolün sözleşmeyle güvencede':'Yok';
  case 'sell':return v?`sonraki bonservisin %${v}’i sana`:'Yok';}return String(v);}
function soz72ClEmpty(){const o={};SOZ72_K.forEach(k=>o[k]=0);return o;}
/* kulübün teklife koyduğu maddeler (tohumlu: aynı teklif hep aynı) */
function soz72ClDef(o){if(!o||o.cl)return o;const c=CLUBS[o.club];o.cl=soz72ClEmpty();if(!c)return o;const L=LEAGUES[c.league];if(L.youth||o.loan||o.role==='A Takıma Yükselme')return o;
  try{const r=srng(String(o.id)+'cl172');r();const strs=leagueClubs(c.league).map(x=>x.str).sort((a,b)=>b-a),rk=strs.indexOf(c.str)/Math.max(1,strs.length-1),age=(G.p?G.p.age:24)+(o.kind==='end'?1:0);
    if(rk>0.5&&r()<0.75)o.cl.relc=25;
    if(age<=23&&r()<0.55)o.cl.opt=1;
    if(L.cc==='ES'||r()<0.35)o.cl.rc=soz72R(soz72MV()*(2.6+r()*2.4));
    if(r()<0.4)o.cl.ab=10;if(['FW','KN'].includes(G.p&&G.p.pos)&&r()<0.35)o.cl.gb=25;if(rk<0.3&&r()<0.5)o.cl.tb=4;if(age>=29&&r()<0.35)o.cl.sad=3;
    if(o.renew&&G.contract&&G.contract.cl){for(const k of SOZ72_K)if(G.contract.cl[k]&&!o.cl[k])o.cl[k]=G.contract.cl[k];}}catch(e){console.warn('soz72 madde',e);}
  return o;}
makeOffer=(old=>function(){const o=old.apply(this,arguments);try{if(isPl())soz72ClDef(o);}catch(e){}return o;})(makeOffer);
/* oyuncunun bir sonraki talebi */
function soz72Want(o,k){const v=+o.cl[k]||0;
  if(k==='rc'){const mv=soz72MV(),floor=soz72R(mv*1.4);if(!v)return soz72R(mv*2.2);const w=soz72R(v*0.75);return w>=floor?w:(v>floor?floor:null);}
  if(k==='relc')return v>25?25:v>0?0:null;
  if(k==='opt')return v===1?0:v===0?2:null;
  const L=SOZ72_PL[k].L,nx=L.find(x=>x>v);return nx==null?null:nx;}
function soz72AskTxt(k,v,w){if(k==='rc')return v?`${eur(w)}’ya düşür`:`Ekle: ${eur(w)}`;if(k==='relc')return w?`%${w}’e indir`:'Kaldır';if(k==='opt')return w===0?'Opsiyonu kaldır':'Senin lehine +1 yıl';if(k==='pt')return 'Ekle';return k==='raise'?`%${w} iste`:k==='sell'?`%${w} iste`:k==='tb'||k==='sad'?`${w} hafta iste`:`%${w} iste`;}
function soz72Pat(o){if(o.pat==null)o.pat=clamp(2+Math.round(Math.max(0,o.interest||0)/4)+(G.p.up&&G.p.up.menajer?1:0),2,5);return o.pat;}
function soz72Ask(id,k){const o=findOffer(id);if(!o||o.status!=='open'||!SOZ72_PL[k])return;soz72ClDef(o);soz72Pat(o);if(o.pat<=0)return toast('Kulüp daha fazla pazarlık istemiyor');
  const want=soz72Want(o,k);if(want==null)return;o.asks=(o.asks||0)+1;const c=CLUBS[o.club];let avgB=1;try{const bs=leagueClubs(c.league).map(clubBudget);avgB=bs.reduce((a,b)=>a+b,0)/bs.length;}catch(e){}
  const base={rc:0.32,ab:0.62,gb:0.55,tb:0.6,sad:0.5,raise:0.42,opt:0.48,relc:0.45,pt:0.3,sell:0.4}[k];
  const role=o.role==='Yıldız'?0.12:o.role==='İlk 11'?0.04:0;
  const p=clamp(base+(o.interest||0)*0.03+(G.p.up&&G.p.up.menajer?0.12:0)+Math.log(Math.max(0.2,clubBudget(c)/avgB))*0.1-(o.asks-1)*0.06+(k==='pt'?role:0),0.06,0.9),r=Math.random();
  const L=o.clog=o.clog||[];const cur=+o.cl[k]||0;
  if(r<p){o.cl[k]=want;o.cnt=null;L.push(`${SOZ72_PL[k].n}: kabul edildi (${soz72ClTxt(k,want)})`);toast('Kulüp maddeyi kabul etti');}
  else{let cv=null;if(k==='rc')cv=cur?soz72R((cur+want)/2):soz72R(want*1.6);else if(k!=='pt'&&k!=='opt'){const LL=SOZ72_PL[k].L;const mid=(cur+want)/2;const near=LL.filter(x=>k==='relc'?(x<cur&&x>want):(x>cur&&x<want));const nice=['ab','gb','sell','relc'].includes(k)?Math.round(mid/5)*5:Math.round(mid);cv=near.length?near[0]:(nice!==cur&&nice!==want?nice:null);}
    else if(k==='opt'&&cur===1)cv=null;
    if(cv!=null&&cv!==cur&&r<p+(1-p)*0.5){o.cnt={k,v:cv};L.push(`${SOZ72_PL[k].n}: karşı teklif (${soz72ClTxt(k,cv)})`);toast('Kulüp karşı teklif yaptı');}
    else{o.pat--;L.push(`${SOZ72_PL[k].n}: reddedildi`);
      if(Math.random()<0.06*o.asks+(o.pat<=0?0.3:0)){o.status='withdrawn';closeModal();msg('offer',`${c.name} teklifini geri çekti`,`Sözleşme maddelerinde fazla zorlayınca ${c.name} yönetimi masadan kalktı.`);save();render();toast('Teklif geri çekildi!');return;}
      toast('Kulüp bu maddeyi reddetti');}}
  save();render();negoSheet(id);}
ACTX.soz72Ask=el=>soz72Ask(el.dataset.id,el.dataset.k);
ACTX.soz72Cnt=el=>{const o=findOffer(el.dataset.id);if(!o||!o.cnt)return;if(el.dataset.k==='ok'){o.cl[o.cnt.k]=o.cnt.v;(o.clog=o.clog||[]).push(`${SOZ72_PL[o.cnt.k].n}: karşı teklif kabul edildi`);toast('Karşı teklif kabul edildi');}else{(o.clog=o.clog||[]).push(`${SOZ72_PL[o.cnt.k].n}: karşı teklif reddedildi`);}o.cnt=null;save();render();negoSheet(o.id);};
function soz72ClList(cl,only){if(!cl)return [];return SOZ72_K.filter(k=>cl[k]).map(k=>[SOZ72_PL[k].n,soz72ClTxt(k,cl[k])]);}
negoSheet=(old=>function(id){const r=old.apply(this,arguments);try{const o=findOffer(id),mc=$('#modalCard');if(!o||!mc||o.status!=='open'||o.loan||!isPl()||!CLUBS[o.club]||LEAGUES[o.league].youth||o.role==='A Takıma Yükselme'||mc.querySelector('.soz72-cl'))return r;soz72ClDef(o);soz72Pat(o);
    const rows=SOZ72_K.map(k=>{const w=soz72Want(o,k),v=+o.cl[k]||0;return `<div class="soz72-r${v?' on':''}"><span><b>${SOZ72_PL[k].n}</b><small>${esc(soz72ClTxt(k,v))}</small></span>${w!=null?`<button class="btn sm" data-act="soz72Ask" data-id="${o.id}" data-k="${k}" ${o.pat<=0?'disabled':''}>${esc(soz72AskTxt(k,v,w))}</button>`:'<em>✓</em>'}</div>`;}).join('');
    const cnt=o.cnt?`<div class="soz72-cnt"><span>Karşı teklif · <b>${SOZ72_PL[o.cnt.k].n}: ${esc(soz72ClTxt(o.cnt.k,o.cnt.v))}</b></span><button class="btn sm" data-act="soz72Cnt" data-id="${o.id}" data-k="ok">Kabul et</button><button class="btn sm ghost" data-act="soz72Cnt" data-id="${o.id}" data-k="no">Reddet</button></div>`:'';
    const lg=(o.clog||[]).slice(-3).map(t=>`<li>${esc(t)}</li>`).join('');
    const box=`<div class="soz72-cl"><p class="sub-h"><span>Sözleşme maddeleri</span><span>talep et · kulüp kabul eder, reddeder ya da karşı teklif verir</span></p>${cnt}<div class="soz72-rows">${rows}</div>${lg?`<ul class="soz72-log">${lg}</ul>`:''}</div>`;
    const bs=mc.querySelectorAll(':scope > .offer-btns'),last=bs[bs.length-1];if(last)last.insertAdjacentHTML('beforebegin',box);else mc.insertAdjacentHTML('beforeend',box);}catch(e){console.warn('soz72 pazarlık',e);}return r;})(negoSheet);
/* teklif kartında maddeler */
offerCard=(old=>function(o){let h=old.apply(this,arguments);try{if(o&&isPl()&&!o.loan){soz72ClDef(o);const L=soz72ClList(o.cl);const tag=o.rcPaid?`<p class="soz72-rcb">💣 Serbest kalma bedelin (${eur(o.rcFee||0)}) yatırıldı: kulübün bu transfere engel olamaz.</p>`:'';
    if(L.length||tag)h=h.replace('</dl>',`</dl>${tag}${L.length?`<div class="soz72-ocl"><b>Maddeler</b>${L.map(([n,t])=>`<span>${esc(n)}: <i>${esc(t)}</i></span>`).join('')}</div>`:''}`);}}catch(e){}return h;})(offerCard);
/* kabul: kulüp onayı (serbest kalma maddesi), maddelerin sözleşmeye geçmesi, satıştan pay */
function soz72Blocked(o){if(!isPl()||!o||o.renew||o.loan||o.rcPaid||o.role==='A Takıma Yükselme'||G.phase!=='season'||!G.contract||G.contract.years<=0||G.loan)return false;
  const cur=myClub();if(!cur||(cur.parent&&cur.parent===o.club))return false;const cl=G.contract.cl||{};
  const key=['Yıldız','İlk 11','Kaptan'].includes(G.contract.role);const r=srng(String(o.id)+'blk172');r();return r()<(key?0.35:0.12)*(cl.rc?0.4:1);}
acceptOffer=(old=>function(o){if(!o||!isPl())return old.apply(this,arguments);
  try{if(o.status==='open'&&soz72Blocked(o)){const c=CLUBS[o.club],me=myClub();o.status='rejected';const cl=G.contract.cl||{};
      msg('offer',`${me.name} transfere izin vermedi`,`${me.name} yönetimi, ${c.name} ile bonservis bedelinde anlaşamadı ve seni bırakmadı.${cl.rc?` Sözleşmendeki ${eur(cl.rc)} serbest kalma bedelini ödemeye ${c.name} yanaşmadı.`:' Sözleşmende serbest kalma bedeli olsaydı ve kulüp bu bedeli ödeseydi engel olamazlardı.'}`);
      save();render();closeModal();toast(`${me.short} seni bırakmadı`);return;}}catch(e){console.warn(e);}
  const b={club:G.club,ct:G.contract,yrs:G.contract?G.contract.years:0,mm:!!G.mustMove,ph:G.phase,ln:!!G.loan};const r=old.apply(this,arguments);
  try{if(o.status!=='accepted')return r;soz72ClDef(o);const cl=Object.assign({},o.cl||soz72ClEmpty(),{y0:G.s.year,off:G.phase!=='season'?1:0});
    if(!o.loan){if(o.renew)G.contract.cl=cl;else if(G.next&&G.next.club===o.club&&G.next.contract)G.next.contract.cl=cl;else if(G.club===o.club&&G.contract)G.contract.cl=cl;}
    /* bonservisli ayrılık: önceki sözleşmedeki satıştan pay */
    const oc=b.ct&&b.ct.cl;if(!o.renew&&!o.loan&&!b.ln&&oc&&oc.sell&&!b.mm&&b.yrs>(b.ph==='season'?0:1)&&o.club!==b.club){const fee=o.rcPaid?(o.rcFee||0):soz72MV(),pay=Math.round(fee*oc.sell/100);
      if(pay>0){G.p.money+=soz72E(pay);msg('event','Satıştan payın ödendi',`Sözleşmendeki %${oc.sell} satış payı maddesi sayesinde ${eur(fee)} bonservisten ${eur(pay)} hesabına yattı.`);}}
    if(o.rcPaid)msg('news',`Serbest kalma bedeli ödendi`,`${CLUBS[o.club].name}, sözleşmendeki ${eur(o.rcFee||0)} serbest kalma bedelini ${CLUBS[b.club]?CLUBS[b.club].name:'kulübüne'} ödedi. Transfer pazarlıksız tamamlandı.`);
    save();}catch(e){console.warn('soz72 kabul',e);}return r;})(acceptOffer);
/* serbest kalma bedelini yatıran kulüp (transfer dönemlerinde) */
function soz72RcOffer(src){if(!isPl()||G.phase!=='season'||!G.contract||!G.contract.cl||!G.contract.cl.rc||G.loan||G.contract.years<=0)return null;const rc=G.contract.cl.rc,cur=myClub(),age=G.p.age;
  if(G.inbox.some(m=>m.offer&&m.offer.rcPaid&&m.offer.status==='open'))return null;
  const cs=Object.values(CLUBS).filter(c=>c.id!==G.club&&!(cur.parent&&c.id===cur.parent)&&eligible(LEAGUES[c.league],age)&&c.str>=cur.str&&clubBudget(c)/EUR_TL>=rc*1.1&&LEAGUES[c.league].tier>=LEAGUES[cur.league].tier-1);if(!cs.length)return null;
  const eff=effRating(),fit=cs.filter(c=>clubNeed(c)<=eff+6);if(!fit.length)return null;const c=pick(fit);
  const o=makeOffer(c,Math.max(1,eff-clubNeed(c)+3),'mid',null);o.rcPaid=1;o.rcFee=rc;o.wage=Math.round(o.wage*1.1/50)*50;if(src)o.dd=G.s.day;pushOffer(o);
  const m=G.inbox.find(x=>x.offer===o);if(m){m.title=`Serbest kalma bedelin yatırıldı: ${c.name}`;m.body=`${c.name} (${LEAGUES[c.league].name}) sözleşmendeki ${eur(rc)} serbest kalma bedelini ödemeye hazır. ${cur.name} bu transfere engel olamaz; karar senin.`;}
  return o;}
/* günlük/haftalık işleyiş: primler, rol garantisi, serbest kalma */
function soz72PlDaily(){if(!isPl()||G.phase!=='season'||!G.contract)return;const ct=G.contract,cl=ct.cl;if(!cl)return;const st=G.s.stats||{};
  let B=ct.clB;if(!B||B.y!==G.s.year||B.c!==G.club){B=ct.clB={y:G.s.year,c:G.club,ap:st.apps||0,g:st.goals||0};}
  const dAp=Math.max(0,(st.apps||0)-B.ap),dG=Math.max(0,(st.goals||0)-B.g);
  if((dAp||dG)&&wdOf(today())===0){const w=ct.wage||0,pay=Math.round(dAp*w*(cl.ab||0)/100+dG*w*(cl.gb||0)/100);B.ap=st.apps||0;B.g=st.goals||0;
    if(pay>0){G.p.money+=pay;const P=cl.pd=cl.pd&&cl.pd.y===G.s.year?cl.pd:{y:G.s.year,s:0};P.s+=pay;msg('event','Primlerin yattı',`Bu hafta ${dAp?dAp+' maç':''}${dAp&&dG?', ':''}${dG?dG+' gol':''} için sözleşmedeki prim maddelerinden ${money(pay)} ödendi.`);}}
  /* rol garantisi */
  if(cl.pt){const played=Math.max(0,(G.s.week||1)-1),need={Yıldız:0.7,Kaptan:0.7,'İlk 11':0.55,Rotasyon:0.3}[ct.role]||0.25;
    ct.ptBad=played>=8&&(st.apps||0)/played<need?G.s.year:0;
    if(ct.ptBad&&cl.ptM!==G.s.year){cl.ptM=G.s.year;msg('board','Rol garantin tutulmuyor',`Sözleşmende “${ct.role}” rolü güvence altında ama ${played} maçın yalnız ${st.apps||0}’ında oynadın. Yönetim sayfasından şikayet edebilirsin.`);}}
  /* transfer dönemlerinde serbest kalma bedeli */
  if(cl.rc&&twOpen()&&Math.random()<0.012*(1+G.p.fame/60)*(cl.rc<soz72MV()*2?2:1))soz72RcOffer(false);}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s)soz72PlDaily();}catch(e){console.warn('soz72 günlük',e);}return r;})(nextDay);
/* sezon sonu: şampiyonluk primi, sadakat primi, opsiyon yılı */
seasonEnd=(old=>function(){if(!isPl())return old.apply(this,arguments);const c0=G.club,ct0=G.contract,yl=seasonLabel(G.s.year),L0=curLeague(),agedOut=!!L0.youth&&G.p.age+1>L0.maxAge,y0=G.s.year;const r=old.apply(this,arguments);
  try{const cl=ct0&&ct0.cl;if(!cl)return r;const w=ct0.wage||0,out=[];
    if(cl.tb&&cl.tbY!==yl){const n=G.trophies.filter(t=>soz72TeamTr(t,yl,c0)).length;if(n){const pay=Math.round(n*cl.tb*w);G.p.money+=pay;out.push(`Şampiyonluk primi: ${n} kupa × ${cl.tb} haftalık maaş = ${money(pay)}`);}cl.tbY=yl;}
    if(cl.sad&&cl.sadY!==yl&&G.contract===ct0&&(cl.y0!==y0||cl.off)){const pay=Math.round(cl.sad*w);G.p.money+=pay;out.push(`Sadakat primi: ${money(pay)}`);cl.sadY=yl;}
    if(out.length)msg('event','Sözleşme primleri ödendi',out.join(' · ')+'.');
    if(cl.opt&&G.contract===ct0&&ct0.years<=0&&G.mustMove&&!agedOut&&!G.next){const st=G.summary||{};
      if(cl.opt===2){ct0.years=1;cl.opt=0;G.mustMove=false;msg('board','Opsiyon yılını kullandın',`Sözleşmendeki senin lehine opsiyon maddesiyle ${CLUBS[c0].name} ile 1 yıl daha devam ediyorsun. İstersen gelen teklifleri yine de değerlendirebilirsin.`);}
      else{const good=(st.avg||0)>=6.6&&(st.apps||0)>=NR()*0.3;cl.opt=0;if(good){ct0.years=1;G.mustMove=false;msg('board','Kulüp opsiyonu kullandı',`${CLUBS[c0].name}, sözleşmedeki opsiyon yılını kullandı: 1 yıl daha kulüptesin.`);}else msg('board','Opsiyon kullanılmadı',`${CLUBS[c0].name} opsiyon yılını kullanmadı; sözleşmen bitti, yeni kulüp bulmalısın.`);}}
    save();}catch(e){console.warn('soz72 sezon sonu',e);}return r;})(seasonEnd);
/* yeni sezon: yıllık artış, küme düşme indirimi */
startNewSeason=(old=>function(){if(!isPl())return old.apply(this,arguments);const c0=G.club,ct0=G.next?null:G.contract,t0=G.s&&LEAGUES[G.s.league]?LEAGUES[G.s.league].tier:0,y0=G.s.year;const r=old.apply(this,arguments);
  try{if(G.s.year===y0||!ct0||G.contract!==ct0||G.club!==c0||!ct0.cl)return r;const cl=ct0.cl,t1=LEAGUES[myClub().league].tier,out=[];
    if(cl.raise&&G.s.year-1>(cl.y0||0)){const w0=ct0.wage;ct0.wage=Math.round(ct0.wage*(1+cl.raise/100)/50)*50;out.push(`yıllık artış %${cl.raise}: ${money(w0)} → ${money(ct0.wage)}`);}
    if(cl.relc&&t1<t0){const w0=ct0.wage;ct0.wage=Math.round(ct0.wage*(1-cl.relc/100)/50)*50;out.push(`küme düşme maddesi −%${cl.relc}: ${money(w0)} → ${money(ct0.wage)}`);}
    if(out.length){msg('board','Maaşın sözleşmeye göre güncellendi',`Haftalık maaşın ${out.join('; ')}.`);save();}}catch(e){console.warn('soz72 yeni sezon',e);}return r;})(startNewSeason);
/* rol garantisi şikayeti */
ACTX.soz72Sik=()=>{if(!isPl()||!G.contract||!G.contract.cl)return;const ct=G.contract,cl=ct.cl;if(!ct.ptBad)return toast('Şu an şikayet için gerekçe yok');if(cl.ptC===G.s.year)return toast('Bu sezon zaten şikayet ettin');cl.ptC=G.s.year;
  const c=myClub(),r=Math.random(),w=ct.wage||0;let t='';
  if(r<0.45){G.p.trust=clamp((G.p.trust||50)+15,0,100);t=`${coachOf(G.club).n}, yönetimin uyarısı üzerine seni daha çok oynatacağına söz verdi. Hoca güveni +15.`;}
  else if(r<0.75){const pay=w*4;G.p.money+=pay;G.p.trust=clamp((G.p.trust||50)+5,0,100);t=`${c.name} sözleşme maddesini ihlal ettiğini kabul etti ve ${money(pay)} tazminat ödedi.`;}
  else{const mv=soz72MV();cl.rc=soz72R(Math.min(cl.rc||1e12,mv*0.9));G.tl=true;t=`${c.name} seni transfer listesine koydu ve serbest kalma bedelini ${eur(cl.rc)}’ya indirdi. Kulüpler artık seni kolayca alabilir.`;}
  msg('board','Rol garantisi şikayetin',t);save();render();openModal(`<h3>Yönetimle görüşme</h3><p>${esc(t)}</p><button class="cta" data-act="closeModal">Tamam</button>`);};
function soz72MyCtHTML(){const ct=G.contract;if(!ct)return '';const cl=ct.cl,L=soz72ClList(cl);const td=G.mode==='mgr';
  const rows=L.length?L.map(([n,t])=>`<div class="fmi"><span>${esc(n)}</span><b>${esc(t)}</b></div>`).join(''):'<p class="muted">Sözleşmende ek madde yok. Bir sonraki sözleşme görüşmesinde “Pazarlık” ekranından madde isteyebilirsin.</p>';
  const pd=cl&&cl.pd&&cl.pd.y===G.s.year?`<p class="muted" style="margin:6px 0 0">Bu sezon ödenen primler: <b>${money(cl.pd.s)}</b></p>`:'';
  const pt=!td&&cl&&cl.pt?(ct.ptBad?`<div class="soz72-warn">Rol garantin tutulmuyor.${cl.ptC===G.s.year?' Bu sezon şikayet ettin.':''}</div>${cl.ptC===G.s.year?'':'<button class="btn" data-act="soz72Sik">Yönetime şikayet et (rol garantisi)</button>'}`:'<p class="muted" style="margin:6px 0 0">Rol garantin şimdilik tutuluyor.</p>'):'';
  return `<section class="panel soz72-my"><p class="sub-h"><span>Sözleşmem</span><span>${esc(ct.role||'')} · ${ct.years} yıl · haftalık ${money(ct.wage||0)}</span></p>${rows}${pd}${pt}</section>`;}
viewBoard=(old=>function(){const h=old.apply(this,arguments);try{if(isPl()&&G.contract&&G.phase!=='retired')return h.replace(/(<\/section>)/,`$1${soz72MyCtHTML()}`);}catch(e){console.warn(e);}return h;})(viewBoard);

/* =====================================================================
   1b) TEKNİK DİREKTÖRÜN OYUNCU SÖZLEŞMELERİ (v41'e ek maddeler)
   ===================================================================== */
const SOZ72_TD=[['tb','Şampiyonluk primi',[[0,'Yok'],[4,'4 hf'],[8,'8 hf']]],['sad','Sadakat primi (sezonluk)',[[0,'Yok'],[2,'2 hf'],[4,'4 hf']]],['opt','Opsiyon yılı',[[0,'Yok'],[1,'Kulüp lehine'],[2,'Oyuncu lehine']]],['pt','Rol garantisi maddesi',[[0,'Yok'],[1,'Var']]],['sellp','Oyuncuya satıştan pay',[[0,'Yok'],[10,'%10'],[15,'%15']]]];
negPlayerInit=(old=>function(){const r=old.apply(this,arguments);try{const n=G.m.neg,p=negP();if(n&&n.d&&n.c&&p&&n.type!=='loan'){const ps=persOf(p),R=n.R||'';
    n.d.x={pt:(ps==='Hırslı'||R==='Yıldız'||n.d.role>=3)?1:0,sad:p.age>=29?2:0,sellp:p.age<=22&&p.ovr>=myClub().str?10:0,noOpt:p.age>=30?1:0};
    for(const k of ['tb','sad','opt','pt','sellp'])if(n.c[k]==null)n.c[k]=0;
    const w=[n.d.x.pt?'rol garantisi maddesi':null,n.d.x.sad?'sadakat primi':null,n.d.x.sellp?'satıştan pay':null].filter(Boolean);if(w.length)n.log.push(['ag',`Menajer: “Sözleşmede ${w.join(', ')} de görmek istiyoruz.”`]);}}catch(e){console.warn('soz72 menajer',e);}return r;})(negPlayerInit);
negScore=(old=>function(){const S=old.apply(this,arguments);try{const n=G.m.neg,c=n.c,x=(n.d&&n.d.x)||{};if(n.type==='loan')return S;
    if(c.tb)S.parts.push(['Şampiyonluk primi',c.tb*0.6]);
    if(x.sad&&!c.sad)S.parts.push(['Sadakat primi',-5]);else if(c.sad)S.parts.push(['Sadakat primi',c.sad*1.1]);
    if(c.opt===1)S.parts.push(['Opsiyon',x.noOpt?-9:-4]);else if(c.opt===2)S.parts.push(['Opsiyon',3]);
    if(x.pt&&!c.pt)S.parts.push(['Rol garantisi maddesi',-8]);else if(c.pt)S.parts.push(['Rol garantisi maddesi',x.pt?3:2]);
    if(x.sellp&&!c.sellp)S.parts.push(['Satıştan pay',-4]);else if(c.sellp)S.parts.push(['Satıştan pay',c.sellp/4]);
    S.tot=S.parts.reduce((a,q)=>a+q[1],0)+(n.I-50)*0.12+3;}catch(e){}return S;})(negScore);
negPlayer=(old=>function(){const n=G.m&&G.m.neg,L0=n&&n.log?n.log.length:0;const r=old.apply(this,arguments);try{if(n&&n.st==='player'&&n.log.length>L0){const last=n.log[n.log.length-1];
    if(last&&last[0]==='ag'&&/şartlar yetersiz/.test(last[1])){const S=negScore(),worst=S.parts.slice().sort((a,b)=>a[1]-b[1])[0];const H={'Rol garantisi maddesi':'sözleşmeye rol garantisi maddesi konmalı','Sadakat primi':'yaşı gereği sadakat primi istiyoruz','Satıştan pay':'ileride satılırsa bonservisten pay istiyoruz','Opsiyon':'kulüp lehine opsiyon kabul edilemez'}[worst&&worst[0]];if(H)last[1]=last[1].replace('şartlar yetersiz',H);negOpen();}}}catch(e){}return r;})(negPlayer);
negOpen=(old=>function(){old.apply(this,arguments);try{const n=G.m&&G.m.neg;if(!n||!n.c||n.type==='loan'||n.st!=='player')return;const c=n.c,mc=$('#modalCard');if(!mc||mc.querySelector('.soz72-negx'))return;
    const row=(f,L,l)=>`<div class="neg-xr"><span>${l}</span><div class="filt">${L.map(([v,t])=>`<button class="chip sm" data-act="negX" data-f="${f}" data-v="${v}" aria-pressed="${(+c[f]||0)===v}">${t}</button>`).join('')}</div></div>`;
    const html=`<div class="soz72-negx">${SOZ72_TD.map(([f,l,L])=>row(f,L,l)).join('')}<p class="muted" style="margin:4px 0 0">Primler ve sadakat primi transfer bütçesinden ödenir. Rol garantisi verdiğin oyuncu yeterince oynamazsa şikayet eder; ikinci ihlalde tazminat ister.</p></div>`;
    const box=mc.querySelector('.neg-x');if(box)box.insertAdjacentHTML('beforeend',html);else{const btn=mc.querySelector('[data-act=ngPl]');if(btn)btn.insertAdjacentHTML('beforebegin',`<div class="neg-x">${html}</div>`);}}catch(e){console.warn('soz72 negOpen',e);}})(negOpen);
negDone=(old=>function(){const n=G.m.neg,c=n&&n.c?Object.assign({},n.c):null,k=n&&n.k;const r=old.apply(this,arguments);try{const ct=G.m.ct&&G.m.ct[k];if(ct&&c){for(const f of ['tb','sad','opt','pt','sellp'])ct[f]=+c[f]||0;ct.y0=G.s.year;}}catch(e){}return r;})(negDone);
/* sezon sonu: şampiyonluk primi (oyuncular) + TD'nin hedef primi; opsiyonlar */
contractsSeasonEnd=(old=>function(){try{const m=G.m;if(m&&m.ct){const sq=squadOf(G.club),me=myClub(),used=[],no=[];for(const p of sq){const ct=m.ct[p.k];if(!ct||!ct.opt||ct.end>G.s.year+1)continue;
      const ok=ct.opt===2?relOf(p)>=-15:p.ovr>=me.str-6;if(ok){ct.end+=1;used.push(`${p.name} (${ct.opt===2?'oyuncu':'kulüp'} opsiyonu)`);}else no.push(p.name);ct.opt=0;}
      if(used.length||no.length)msg('board','Opsiyon yılları',`${used.length?'Kullanılan opsiyonlar: '+used.join(', ')+'. ':''}${no.length?'Kullanılmayan: '+no.join(', ')+'.':''}`);}}catch(e){console.warn('soz72 opsiyon',e);}
  return old.apply(this,arguments);})(contractsSeasonEnd);
mgrSeasonEnd=(old=>function(){const m=G.m,c0=G.club,yl=seasonLabel(G.s.year),obj=m&&m.obj?m.obj.pos:99,sk0=m&&m.sacked;let pos=99;try{pos=tablePos();}catch(e){}
  /* oyuncu şampiyonluk primleri (sezon sonu, ayrılıklardan önce) */
  try{if(m&&m.ct){const n=G.trophies.filter(t=>soz72TeamTr(t,yl,c0)).length+(pos===1&&!G.trophies.some(t=>t.year===yl&&/Şampiyonluğu/.test(t.name)&&t.club===c0)?1:0);
      if(n){let tot=0;for(const p of squadOf(c0)){const ct=m.ct[p.k];if(ct&&ct.tb)tot+=ct.tb*ct.w*n;}if(tot>0){m.budget-=tot*EUR_TL;msg('board','Şampiyonluk primleri',`${n} kupa için sözleşmesinde şampiyonluk primi olan oyunculara toplam ${eur(tot)} ödendi.`);}}}}catch(e){console.warn(e);}
  const r=old.apply(this,arguments);
  try{const ct=G.contract,cl=ct&&ct.cl;if(G.mode==='mgr'&&cl){const w=ct.wage||0,out=[];const ok=pos<=obj;
      if(cl.tb&&ok&&cl.tbY!==yl){const pay=Math.round(cl.tb*w);G.p.money+=pay;out.push(`hedef primi ${money(pay)}`);cl.tbY=yl;}
      if(G.m.sacked&&!sk0)soz72Comp('sezon sonu');
      else if(cl.opt&&ct.years<=0){if(cl.opt===2||ok){ct.years=1;G.mustMove=false;out.push(cl.opt===2?'opsiyon yılını kullandın (+1 yıl)':'kulüp opsiyon yılını kullandı (+1 yıl)');}else out.push('kulüp opsiyon yılını kullanmadı');cl.opt=0;}
      if(out.length)msg('board','Sözleşmen',`Sezon sonu: ${out.join(' · ')}.`);save();}}catch(e){console.warn('soz72 TD sezon sonu',e);}return r;})(mgrSeasonEnd);
function soz72Comp(why){const ct=G.contract,cl=ct&&ct.cl;if(!cl||!cl.comp||cl.compY===G.s.year)return;cl.compY=G.s.year;const yrs=Math.max(0.5,ct.years||0.5),pay=Math.round((ct.wage||0)*52*yrs*cl.comp/100);if(pay>0){G.p.money+=pay;msg('board','Tazminat ödendi',`Sözleşmendeki kovulma tazminatı maddesi (%${cl.comp}) gereği kalan sözleşmenin karşılığı olarak ${money(pay)} hesabına yattı.`);}}
mgrSacked=(old=>function(){const r=old.apply(this,arguments);try{soz72Comp('sezon içi');save();}catch(e){}return r;})(mgrSacked);
mgrNewSeason=(old=>function(){const m=G.m,c0=G.club,ct0=G.contract,t0=G.s&&LEAGUES[G.s.league]?LEAGUES[G.s.league].tier:0;const r=old.apply(this,arguments);
  try{if(m&&m.ct){let tot=0,n=0;for(const p of squadOf(G.club)){const ct=m.ct[p.k];if(ct)ct.ptN=0;if(ct&&ct.sad&&ct.y0!==G.s.year){tot+=ct.sad*ct.w;n++;}}if(tot>0){m.budget-=tot*EUR_TL;msg('board','Sadakat primleri',`${n} oyuncuya sözleşmelerindeki sadakat primi olarak toplam ${eur(tot)} ödendi.`);}}
    const cl=ct0&&ct0.cl;if(cl&&G.contract===ct0&&G.club===c0){const out=[];if(cl.raise&&G.s.year-1>(cl.y0||0)){const w0=ct0.wage;ct0.wage=Math.round(ct0.wage*(1+cl.raise/100)/50)*50;out.push(`yıllık artış: ${money(w0)} → ${money(ct0.wage)}`);}
      const t1=LEAGUES[myClub().league].tier;if(cl.relc&&t1<t0){const w0=ct0.wage;ct0.wage=Math.round(ct0.wage*(1-cl.relc/100)/50)*50;out.push(`küme düşme indirimi: ${money(w0)} → ${money(ct0.wage)}`);}
      if(out.length)msg('board','Maaşın güncellendi',`Sözleşmene göre haftalık maaşın: ${out.join('; ')}.`);}save();}catch(e){console.warn('soz72 TD yeni sezon',e);}return r;})(mgrNewSeason);
/* galibiyet primi (TD'nin kendi sözleşmesi) */
mgrFinish=(old=>function(gu,go){const r=old.apply(this,arguments);try{const cl=G.mode==='mgr'&&G.contract&&G.contract.cl;if(cl&&cl.wb&&gu>go){const pay=Math.round((G.contract.wage||0)*cl.wb/100);G.p.money+=pay;const P=cl.pd=cl.pd&&cl.pd.y===G.s.year?cl.pd:{y:G.s.year,s:0};P.s+=pay;}}catch(e){}return r;})(mgrFinish);
/* rol garantisi (TD'nin oyuncuları) — haftalık */
function soz72PtWeek(){const m=G.m;if(!m||!m.ct||G.phase!=='season')return;const played=Math.max(0,(G.s.week||1)-1);if(played<8)return;const M=clubSeasonEst(G.club);
  for(const p of squadOf(G.club)){const ct=m.ct[p.k];if(!ct||!ct.pt||(ct.role||0)<1)continue;const x=M[p.k]||{},st=x.st||0,need=ct.role>=3?0.6:ct.role>=2?0.45:0.25;if(m.inj&&m.inj[p.k])continue;if(st/played>=need)continue;
    if(!ct.ptN){ct.ptN=1;ct.ptW=played;relAdd(p,-12);msg('squad',`Rol garantisi: ${p.name} şikayetçi`,`${p.name}: “Sözleşmemde ${roleName(ct.role).toLowerCase()} garantisi var ama ${played} maçın yalnız ${st}’inde ilk 11’deydim.” Menajeri, durum düzelmezse tazminat isteyeceklerini söyledi.`);}
    else if(ct.ptN===1&&played-ct.ptW>=6){ct.ptN=2;const pay=Math.round(ct.w*4);m.budget-=pay*EUR_TL;relAdd(p,-8);msg('board',`Tazminat: ${p.name}`,`${p.name}, rol garantisi maddesinin ihlali nedeniyle ${eur(pay)} tazminat aldı. Oyuncu kulüpten ayrılmak istediğini saklamıyor.`);}}}
/* satışlar: oyuncuya satıştan pay, bizim önceki satış payımız (sellRev) */
txNote=(old=>function(k,to,fee){try{const m=G&&G.mode==='mgr'&&G.m;if(m&&fee>0){const ct=m.ct&&m.ct[k];if(ct&&ct.sellp&&to!==G.club){const pc=ct.sellp,pay=Math.round(fee*pc/100);m.budget-=pay*EUR_TL;ct.sellp=0;let n='Oyuncu';try{n=pByKey(k).name;}catch(e){}msg('board',`Satıştan pay: ${n}`,`${n}, sözleşmesindeki %${pc} satış payı maddesi gereği ${eur(fee)} bonservisten ${eur(pay)} aldı.`);}
      const sr=m.sellRev&&m.sellRev[k];if(sr&&to!==sr.club&&to!==G.club){const pay=Math.round(fee*sr.pct/100);m.budget+=pay*EUR_TL;delete m.sellRev[k];let n='Eski oyuncumuz';try{n=pByKey(k).name;}catch(e){}msg('board',`Sonraki satış payı: ${n}`,`${n}, ${CLUBS[sr.club]?CLUBS[sr.club].name:'kulübü'} tarafından ${eur(fee)} bedelle satıldı (yeni kulübü: ${CLUBS[to]?CLUBS[to].name:'başka bir kulüp'}). Satış sözleşmesindeki %${sr.pct} pay olarak ${eur(pay)} bütçemize eklendi.`);}}}catch(e){console.warn('soz72 satış payı',e);}
  return old.apply(this,arguments);})(txNote);
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&G.m&&G.phase==='season'&&G.s&&G.s.cal&&wdOf(today())===0)soz72PtWeek();}catch(e){console.warn('soz72 rol',e);}return r;})(nextDay);
/* oyuncu profilinde ek maddeler */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const ct=G.m&&G.mode==='mgr'&&G.m.ct&&p&&G.m.ct[p.k];if(ct&&c&&c.id===G.club){const x=[ct.tb?`Şampiyonluk primi: ${ct.tb} hf`:null,ct.sad?`Sadakat primi: ${ct.sad} hf/sezon`:null,ct.opt?`Opsiyon: +1 yıl (${ct.opt===2?'oyuncu':'kulüp'} lehine)`:null,ct.pt?`Rol garantisi: ${roleName(ct.role)}`:null,ct.sellp?`Satıştan pay: %${ct.sellp}`:null].filter(Boolean);
      if(x.length){if(/<span>Sözleşme maddeleri<\/span><b>/.test(h))h=h.replace(/(<span>Sözleşme maddeleri<\/span><b>)/,`$1${x.map(esc).join('<br>')}<br>`);else h=h.replace('<div class="fmi"><span>Uyruk</span>',`<div class="fmi"><span>Sözleşme maddeleri</span><b>${x.map(esc).join('<br>')}</b></div><div class="fmi"><span>Uyruk</span>`);}}}catch(e){}return h;})(fmProfHTML);

/* =====================================================================
   1c) TEKNİK DİREKTÖRÜN KENDİ SÖZLEŞMESİ (iş teklifinde pazarlık)
   ===================================================================== */
const SOZ72_TF=[['y','Süre',[[2,'2 yıl'],[3,'3 yıl'],[4,'4 yıl']]],['bon','İmza parası',[[0,'Yok'],[4,'4 hf'],[8,'8 hf']]],['wb','Galibiyet primi',[[0,'Yok'],[5,'%5'],[10,'%10']]],['tb','Hedef primi',[[0,'Yok'],[4,'4 hf'],[8,'8 hf']]],
  ['raise','Yıllık maaş artışı',[[0,'Yok'],[5,'%5'],[10,'%10']]],['opt','Opsiyon yılı',[[0,'Yok'],[1,'Kulüp lehine'],[2,'Senin lehine']]],['relc','Küme düşerse maaş indirimi',[[0,'Yok'],[25,'−%25'],[50,'−%50']]],['comp','Kovulursa tazminat',[[0,'Yok'],[50,'%50'],[100,'%100']]]];
const SOZ72_TC={bon:v=>v*1.5,wb:v=>v*1.1,tb:v=>v*1.2,raise:v=>v*1.2,opt:v=>v===2?6:v===1?-5:0,comp:v=>v/8,y:v=>v===4?4:v===2?-2:0};
function soz72TdBase(id){const c=CLUBS[id],r=srng(id+'td172'+(G.s?G.s.year:0));r();const strs=leagueClubs(c.league).map(x=>x.str).sort((a,b)=>b-a),rk=strs.indexOf(c.str)/Math.max(1,strs.length-1);
  return {y:3,bon:0,wb:0,tb:rk<0.35?4:0,raise:0,opt:r()<0.4?1:0,relc:rk>0.5?25:0,comp:0};}
function soz72TdWill(id){const c=CLUBS[id],rep=(G.m&&G.m.rep)||30;let avgB=1;try{const bs=leagueClubs(c.league).map(clubBudget);avgB=bs.reduce((a,b)=>a+b,0)/bs.length;}catch(e){}
  const need=clamp((LEAGUES[c.league].tier-3)*9,5,85);return clamp(14+(rep-need)*0.35+Math.log(Math.max(0.2,clubBudget(c)/avgB))*6,4,34);}
function soz72TdCost(T){const b=T.base;let s=0;for(const [f] of SOZ72_TF){const v=T.cl[f];if(f==='relc'){s+=Math.max(0,(b.relc-v)/25)*5;continue;}if(f==='opt'){s+=SOZ72_TC.opt(v)-SOZ72_TC.opt(b.opt);continue;}if(f==='y'){s+=SOZ72_TC.y(v);continue;}s+=SOZ72_TC[f](v)-(f==='tb'?SOZ72_TC.tb(b.tb):0);}return s;}
ACTX.mgrSign=el=>{const id=el.dataset.id;if(!CLUBS[id])return;const role=G.m&&G.m.role;if(role==='bsk'||(typeof mpClubBlocked==='function'&&mpClubBlocked(id)))return mgrSign(id);
  const base=soz72TdBase(id);SOZ72.td={id,base,cl:Object.assign({},base),pat:3,log:[],st:'open'};soz72TdModal();};
function soz72TdModal(){const T=SOZ72.td;if(!T||!CLUBS[T.id])return closeModal();const c=CLUBS[T.id],role=G.m&&G.m.role,un=role==='sd'?'Sportif direktör':'Teknik direktör';
  const chips=(f,L)=>`<div class="filt">${L.map(([v,t])=>`<button class="chip sm" data-act="soz72T" data-f="${f}" data-v="${v}" aria-pressed="${T.cl[f]===v}" ${T.st!=='open'?'disabled':''}>${t}</button>`).join('')}</div>`;
  const cost=soz72TdCost(T),will=soz72TdWill(T.id),mood=clamp(60-(cost-will*0.6)*3,3,100);
  const log=T.log.slice(-4).map(([w,t])=>`<p class="ng-${w}"><i>${w==='me'?'Sen':`${esc(c.name)} yönetimi`}</i>${esc(t)}</p>`).join('');
  openModal(`<div class="ng soz72-td"><p class="sub-h"><span>${un} sözleşmesi</span><span>${crestSVG(c,18)} ${esc(c.short)}</span></p>
    <div class="ng-hd"><div class="ng-face">${crestSVG(c,46)}</div><div class="ng-id"><b>${esc(c.name)}</b><small>${esc(LEAGUES[c.league].name)}</small><small>Kulüp sabrı <span class="ng-pat">${'●'.repeat(Math.max(0,T.pat))}${'○'.repeat(Math.max(0,3-T.pat))}</span></small></div></div>
    ${log?`<div class="ng-log">${log}</div>`:'<p class="muted">Yönetim standart sözleşmesini masaya koydu. İstediğin maddeleri seç ve teklif et; kulüp kabul eder, reddeder ya da karşı teklif verir.</p>'}
    ${T.st==='done'?`<div class="ng-res ok">✔ Anlaşma sağlandı</div><button class="cta" data-act="soz72TSign" data-auto="1">Sözleşmeyi imzala</button>`:T.st==='fail'?`<div class="ng-res bad">✖ ${esc(c.short)} görüşmeden çekildi</div><button class="btn" data-act="closeModal" style="width:100%">Kapat</button>`:
    `<div class="ng-mood"><i><em style="width:${Math.round(mood)}%"></em></i><small>${mood>=60?'Yönetim bu şartlara sıcak bakıyor':mood>=35?'Bir iki maddede zorlanabilirler':'Yönetim için fazla ağır şartlar'}</small></div>
    ${SOZ72_TF.map(([f,l,L])=>`<div class="neg-xr"><span>${l}${f==='relc'&&T.base.relc?' <small class="muted">(kulübün şartı)</small>':''}</span>${chips(f,L)}</div>`).join('')}
    ${T.cnt?`<div class="soz72-cnt"><span>Karşı teklif: <b>${esc(T.cnt.t)}</b></span><button class="btn sm" data-act="soz72TCnt" data-k="ok">Kabul et</button><button class="btn sm ghost" data-act="soz72TCnt" data-k="no">Reddet</button></div>`:''}
    <button class="cta" data-act="soz72TSend">Teklifi gönder</button><button class="btn" data-act="soz72TStd" data-auto="1" style="width:100%;margin-top:6px">Standart sözleşmeyi imzala</button>`}
    <button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:6px">Vazgeç</button></div>`);$('#modalCard').classList.add('wide');}
ACTX.soz72T=el=>{const T=SOZ72.td;if(!T||T.st!=='open')return;T.cl[el.dataset.f]=+el.dataset.v;T.cnt=null;soz72TdModal();};
ACTX.soz72TSend=()=>{const T=SOZ72.td;if(!T||T.st!=='open')return;const c=CLUBS[T.id],cost=soz72TdCost(T),will=soz72TdWill(T.id);
  const desc=SOZ72_TF.filter(([f])=>T.cl[f]!==T.base[f]).map(([f,l,L])=>`${l.toLowerCase()} ${(L.find(x=>x[0]===T.cl[f])||[0,''])[1]}`);T.log.push(['me',desc.length?`Şartlarım: ${desc.join(', ')}.`:'Standart şartları kabul ediyorum.']);
  if(cost<=will*0.55){T.st='done';T.log.push(['club','Şartlarınızı kabul ediyoruz. Hoş geldiniz!']);}
  else if(cost<=will*1.05&&T.pat>1){T.pat--;let best=null;for(const [f,l,L] of SOZ72_TF){const i=L.findIndex(x=>x[0]===T.cl[f]);let j=null;if(f==='relc'){if(T.cl.relc<T.base.relc)j=i+1;}else if(f==='opt'){if(T.cl.opt===2)j=0;}else if(f==='y'){if(T.cl.y===4)j=1;}else if(i>0)j=i-1;if(j==null||!L[j])continue;
      const t2=Object.assign({},T,{cl:Object.assign({},T.cl,{[f]:L[j][0]})}),gain=cost-soz72TdCost(t2);if(gain>0&&(!best||gain>best.g))best={f,v:L[j][0],g:gain,t:`${l.toLowerCase()}: ${L[j][1]}`};}
    if(best){T.cnt=best;T.log.push(['club',`Bu kadarı zor. ${best.t.charAt(0).toUpperCase()+best.t.slice(1)} olursa anlaşırız.`]);}else{T.log.push(['club','Bu şartlar bize ağır geliyor.']);}}
  else{T.pat-=cost>will*1.6?2:1;if(T.pat<=0){T.st='fail';T.log.push(['club','Beklentileriniz bizim için çok yüksek. Başka bir adayla devam edeceğiz.']);if(G.m&&Array.isArray(G.m.offers))G.m.offers=G.m.offers.filter(x=>x!==T.id);msg('board',`${c.name} görüşmeden çekildi`,`${c.name} yönetimi sözleşme şartlarında anlaşamayınca başka bir adaya yöneldi.`);save();}
    else T.log.push(['club','Bu şartları kabul edemeyiz. Biraz daha gerçekçi olun.']);}
  soz72TdModal();};
ACTX.soz72TCnt=el=>{const T=SOZ72.td;if(!T||!T.cnt)return;if(el.dataset.k==='ok'){T.cl[T.cnt.f]=T.cnt.v;T.st='done';T.log.push(['me','Karşı teklifinizi kabul ediyorum.']);T.log.push(['club','Anlaştık!']);}else T.log.push(['me','Karşı teklifinizi kabul etmiyorum.']);T.cnt=null;soz72TdModal();};
ACTX.soz72TStd=()=>{const T=SOZ72.td;if(!T)return;T.cl=Object.assign({},T.base);T.st='done';soz72TSign();};
ACTX.soz72TSign=()=>soz72TSign();
function soz72TSign(){const T=SOZ72.td;if(!T||T.st!=='done')return;const id=T.id,cl=Object.assign({},T.cl);SOZ72.td=null;closeModal();mgrSign(id);
  try{if(G.club===id&&G.mode==='mgr'&&G.contract){G.contract.years=cl.y;const k=Object.assign({},cl);delete k.y;k.y0=G.s.year;G.contract.cl=k;const bon=Math.round((G.contract.wage||0)*(cl.bon||0));if(bon>0)G.p.money+=bon;
      const L=SOZ72_TF.filter(([f])=>f!=='y'&&cl[f]).map(([f,l,LL])=>`${l}: ${(LL.find(x=>x[0]===cl[f])||[0,''])[1]}`);delete G.mesNew;
      msg('board','Sözleşmen imzalandı',`${CLUBS[id].name} ile ${cl.y} yıllık sözleşme. Haftalık ${money(G.contract.wage||0)}.${bon?` İmza parası ${money(bon)} hesabına yattı.`:''}${L.length?' Maddeler: '+L.join(', ')+'.':''}`);save();render();}}catch(e){console.warn('soz72 TD imza',e);}}
viewMgrBoard=(old=>function(){const h=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.contract&&G.contract.cl&&G.m&&G.m.role!=='bsk'){const ct=G.contract,cl=ct.cl;const L=SOZ72_TF.filter(([f])=>f!=='y'&&cl[f]).map(([f,l,LL])=>`<div class="fmi"><span>${l}</span><b>${(LL.find(x=>x[0]===cl[f])||[0,cl[f]])[1]}</b></div>`).join('');
    const pd=cl.pd&&cl.pd.y===G.s.year?`<p class="muted" style="margin:6px 0 0">Bu sezon galibiyet primi: <b>${money(cl.pd.s)}</b></p>`:'';
    return h.replace(/(<\/section>)/,`$1<section class="panel soz72-my"><p class="sub-h"><span>Sözleşmem</span><span>${ct.years} yıl · haftalık ${money(ct.wage||0)}</span></p>${L||'<p class="muted">Ek madde yok.</p>'}${pd}</section>`);}}catch(e){console.warn(e);}return h;})(viewMgrBoard);

/* =====================================================================
   2) TRANSFER SON GÜNÜ (v76) — eksikler
   ===================================================================== */
/* son dakika: serbest kalma bedelleri (TD: kendi oyuncumuz · futbolcu: sen) */
function soz72DdRcMgr(){const m=G.m;if(!m||!m.ct)return false;const ks=Object.keys(m.ct).filter(k=>m.ct[k].rc);if(!ks.length)return false;const k=pick(ks),ct=m.ct[k],p=squadOf(G.club).find(x=>x.k===k);if(!p)return false;
  const buyers=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&c.str>=Math.max(p.ovr-3,myClub().str+1)&&clubBudget(c)/EUR_TL>=ct.rc*1.2);if(!buyers.length)return false;const b=pick(buyers);
  m.budget+=ct.rc*EUR_TL;G.tx=G.tx||{};G.tx[k]=b.id;txNote(k,b.id,ct.rc);delete m.ct[k];m.xi=null;syncStr(G.club);syncStr(b.id);
  ddLog('💣',`${b.name}, ${p.name} için sözleşmedeki ${eur(ct.rc)} serbest kalma bedelini yatırdı! Engel olamadın; oyuncu ayrıldı, bedel bütçeye eklendi.`);
  msg('board',`Son gün: serbest kalma bedeli · ${p.name}`,`${b.name}, ${p.name} için ${eur(ct.rc)} serbest kalma bedelini ödedi. Transfer pazarlıksız gerçekleşti.`);return true;}
ddEvent=(old=>function(){try{if(G.mode==='mgr'&&G.m&&Math.random()<0.1&&soz72DdRcMgr())return;if(isPl()&&Math.random()<0.25){const o=soz72RcOffer(true);if(o){G.dd.it.push({id:o.id,k:'off',c:o.club,until:24});ddLog('💣',`${CLUBS[o.club].name} serbest kalma bedelini (${eur(o.rcFee)}) yatırmaya hazır! Kulübün engel olamaz; gece yarısına kadar karar ver.`);return;}}}catch(e){console.warn('soz72 son gün',e);}
  return old.apply(this,arguments);})(ddEvent);
/* futbolcu: son gün teklifine pazarlık */
ddItem=(old=>function(it){let h=old.apply(this,arguments);try{if(it&&it.k==='off'&&G.dd&&!G.dd.done){const o=findOffer(it.id);if(o&&o.status==='open')h=h.replace(`<button class="cta sm" data-act="accept" data-id="${o.id}">İmzala</button>`,`<span class="soz72-ddb"><button class="btn sm" data-act="soz72DdNego" data-id="${o.id}">Pazarlık</button><button class="cta sm" data-act="accept" data-id="${o.id}">İmzala</button></span>`);
    if(o&&o.rcPaid)h=h.replace('</small></div>',' · 💣 serbest kalma bedeli</small></div>');}}catch(e){}return h;})(ddItem);
ACTX.soz72DdNego=el=>{SOZ72.ddBack=1;negoSheet(el.dataset.id);};
/* pazarlık penceresi kapanınca son gün ekranına dön */
closeModal=(old=>function(){const r=old.apply(this,arguments);try{if(SOZ72.ddBack){SOZ72.ddBack=0;if(G&&G.dd&&ddToday())setTimeout(()=>{try{if($('#modal').hidden)ddModal();}catch(e){}},0);}}catch(e){}return r;})(closeModal);
/* son gün satışı: önceki kulübe borçlu olunan satış payı (v26'daki gibi) */
ACTX.ddDo=(old=>function(el){const D=G.dd,it=D&&D.it.find(x=>x.id===el.dataset.id),r0=it&&it.r;const r=old.apply(this,arguments);try{if(it&&!r0&&it.r==='ok'&&it.k==='sell'){const m=G.m,so=m.sellOn&&m.sellOn[it.p];if(so&&so.pct){const pay=Math.round(it.fee*so.pct/100);m.budget-=pay*EUR_TL;delete m.sellOn[it.p];ddLog('🧾',`${CLUBS[so.c]?CLUBS[so.c].name:'Önceki kulüp'} satış sözleşmesindeki %${so.pct} payını aldı: ${eur(pay)}.`);save();ddModal();}}}catch(e){console.warn(e);}return r;})(ACTX.ddDo);
/* canlı saat: saat kendiliğinden ilerler */
function soz72DdStop(){if(SOZ72.ddT){clearInterval(SOZ72.ddT);SOZ72.ddT=null;}}
ACTX.soz72DdLive=()=>{if(SOZ72.ddT){soz72DdStop();ddModal();return;}const D=G.dd;if(!D||D.done)return;SOZ72.ddT=setInterval(()=>{try{const D2=G&&G.dd;if(!D2||D2.done||$('#modal').hidden||!$('#modalCard .dd')){soz72DdStop();if(D2&&D2.done&&$('#modalCard .dd'))ddModal();return;}ddHour();save();ddModal();}catch(e){soz72DdStop();}},1300);ddModal();};
ddModal=(old=>function(){const r=old.apply(this,arguments);try{const D=G.dd,mc=$('#modalCard');if(!D||!mc)return r;const ob=mc.querySelector('.dd .offer-btns');if(ob&&!D.done&&!ob.querySelector('[data-act=soz72DdLive]'))ob.insertAdjacentHTML('afterbegin',`<button class="btn" data-act="soz72DdLive">${SOZ72.ddT?'⏸ Durdur':'▶ Canlı izle'}</button>`);
    const cl=mc.querySelector('.dd-clock');if(cl&&SOZ72.ddT)cl.classList.add('live');}catch(e){}return r;})(ddModal);

/* =====================================================================
   3) EMEKLİLİK → AYNI KAYITTA YENİ MESLEK
   ===================================================================== */
const SOZ72_MES={td:{n:'Teknik direktör',ic:'📋',d:'Takım yönet: kadro, taktik, transfer.'},yrd:{n:'Yardımcı antrenör',ic:'🧢',d:'Bir teknik ekibin parçası ol, idman ve rakip analizi yap.'},scout:{n:'Gözlemci',ic:'🔭',d:'Yetenek keşfet, rapor yaz, kulübüne oyuncu öner.'},
  sd:{n:'Sportif direktör',ic:'🗂',d:'Transfer ve kadro planlaması, hocayı sen seçersin.'},bsk:{n:'Kulüp başkanı',ic:'🏛',d:'Bütçe, sponsorlar ve seçimler.'}};
function soz72CurProf(){if(isPl())return 'oyuncu';if(G.mode==='mgr')return (G.m&&G.m.role)||'td';return G.staff||G.prof||'';}
function soz72PlStats(){const t=G.totals||{},tr=(G.trophies||[]).length,hs=(G.history||[]).filter(h=>h.pos&&h.pos!=='TD'&&h.pos!=='ST'),tier=hs.reduce((m,h)=>Math.max(m,LEAGUES[h.league]?LEAGUES[h.league].tier:0),0);return {apps:t.apps||0,goals:t.goals||0,caps:(G.p&&G.p.caps)||0,tr,tier,fame:(G.p&&G.p.fame)||0,pl:hs.length>0};}
/* geçmişe göre başlangıç: itibar, lisans, kademe */
function soz72Start(k){const S=soz72PlStats(),cur=soz72CurProf(),jr=G.job&&G.job.rep||0,mr=G.m&&G.m.rep||0;let rep;
  try{rep=S.pl?mgrRep():Math.max(10,Math.round(Math.max(jr,mr)*0.75));}catch(e){rep=20;}
  rep=clamp(rep+(S.caps>=25?6:S.caps>=5?3:0),8,95);
  const lic0=G.lic&&G.lic.lv||null,order=['C','B','A','P'];let lv='C';if(S.pl){if(S.fame>=70&&S.caps>=20)lv='A';else if(S.fame>=40||S.tier>=7||S.caps>=5)lv='B';}
  if(lic0&&order.indexOf(lic0)>order.indexOf(lv))lv=lic0;
  const lvl=k==='yrd'||k==='scout'?(S.pl?(S.fame>=60||S.tier>=8?2:S.fame>=30||S.tier>=6?1:0):(G.job&&G.job.lvl?Math.min(2,G.job.lvl):cur==='td'||cur==='sd'?1:0)):0;
  return {rep,lv,lvl,S};}
function soz72MesCard(k){const st=soz72Start(k),M=SOZ72_MES[k];let info='';
  if(k==='td'){const nx=LIC[st.lv]&&LIC[st.lv].next;info=`${LIC[st.lv].n} lisansıyla başlarsın (${LIC_LG[st.lv].toLowerCase()}).${nx?` ${LIC[nx].n} kursuna otomatik kaydolursun: 1 sezon sürer, ${(G.s.year+2)} yazında tamamlanır.`:''} Başlangıç itibarı ${st.rep}.`;}
  else if(k==='yrd'||k==='scout')info=`${STF[k].r[st.lvl]} olarak başlarsın · itibar ${Math.min(65,10+Math.round(st.S.fame*0.4)+st.lvl*6)}.${k==='yrd'?` Antrenörlük lisansın: ${LIC[st.lv].n}.`:''}`;
  else info=`Başlangıç itibarı ${clamp(Math.round(st.rep*(k==='bsk'?1.1:1)),8,95)}. ${k==='bsk'?'Kulüpler seni başkan adayı olarak görmek istiyor.':'Kulüpler sportif direktörlük teklif ediyor.'}`;
  return `<button class="req soz72-mes" data-act="soz72Mes" data-k="${k}"><b>${M.ic} ${M.n}</b><small>${esc(M.d)}</small><small class="soz72-mi">${esc(info)}</small></button>`;}
function soz72MesPanel(){const cur=soz72CurProf(),ks=Object.keys(SOZ72_MES).filter(k=>k!==cur);const S=soz72PlStats();
  return `<section class="panel soz72-mesp"><p class="sub-h"><span>Aynı karakterle yeni meslek</span><span>kariyer geçmişin korunur</span></p><p class="muted" style="margin:0 0 8px">${S.pl?`Futbolculuk geçmişin (${S.apps} maç, ${S.goals} gol${S.caps?`, ${S.caps} milli maç`:''}, ${S.tr} kupa/ödül) başlangıç itibarını ve gelen teklifleri belirler.`:'Önceki görevlerindeki itibarın yeni mesleğe taşınır.'} Kupaların, zaman çizelgen ve Kariyerim sayaçların aynı kalır.</p>${soz72MpNote()}<div class="reqs soz72-mesg">${ks.map(soz72MesCard).join('')}</div></section>`;}
function soz72MpNote(){try{if(!mpOn())return '';const P=(G.mp&&G.mp.peer)||null,pp=P&&P.prof;return `<div class="soz72-warn">🌐 Çevrimiçi odadasın${pp?` · arkadaşın ${esc(mpProfN(pp))}`:''}. Meslek değiştirirsen oda kapanmaz ve takvim ortak ilerlemeye devam eder; arkadaşın yeni mesleğini “farklı meslek” olarak görür. Aynı kulüpte aynı meslek kuralı sürer.</div>`;}catch(e){return '';}}
ACTX.soz72Mes=el=>{const k=el.dataset.k,M=SOZ72_MES[k];if(!M)return;let mp='';try{if(mpOn()){const P=G.mp.peer||{};mp=`<div class="soz72-warn">🌐 Odadaki arkadaşın ${P.prof?esc(mpProfN(P.prof)):'farklı bir meslekte'} oynuyor. Oda açık kalır; ${P.prof&&P.prof!==k&&!(k==='td'&&P.prof==='td')?'artık farklı mesleklerde olacaksınız, bu odanın kurulma şartı (aynı meslek) yalnız katılırken aranır ve oda bozulmaz.':'aynı meslekte olacaksınız; aynı kulübü seçemezsiniz.'}</div>`;}}catch(e){}
  openModal(`<h3>${M.ic} ${esc(M.n)} olmak istiyor musun?</h3><p>${esc(PN())} aynı kayıtla yeni mesleğe geçecek. Kariyer geçmişin, kupaların, zaman çizelgen ve Kariyerim sayaçların korunur; ${soz72CurProf()==='oyuncu'?'futbolculuk dönemin Kariyerim’de ayrı satırda':'önceki görevin meslek geçmişinde'} görünür.</p>${mp}<div class="offer-btns"><button class="cta" data-act="soz72MesGo" data-k="${k}">Evet, ${esc(M.n.toLocaleLowerCase('tr-TR'))} ol</button><button class="btn ghost" data-act="closeModal">Vazgeç</button></div>`);};
ACTX.soz72MesGo=el=>{closeModal();soz72Switch(el.dataset.k);};
ACTX.soz72MesAc=()=>{openModal(`<h3>Mesleği bırak</h3><p class="muted">Şu anki görevinden ayrılıp aynı karakterle başka bir mesleğe geçebilirsin.</p>${soz72MesPanel()}<button class="btn ghost" data-act="closeModal" style="width:100%">Vazgeç</button>`);$('#modalCard').classList.add('wide');};
function soz72Switch(k){if(!G||!SOZ72_MES[k])return;const from=soz72CurProf(),y=G.s.year,st=soz72Start(k),yl=seasonLabel(y),S=st.S;
  /* önceki meslek dönemini kaydet */
  try{const H=G.mesl=G.mesl||[];const h=(G.history||[]),pf=from;const mine=h.filter(x=>pf==='oyuncu'?(x.pos!=='TD'&&x.pos!=='ST'):pf==='yrd'||pf==='scout'||pf==='dr'||pf==='ref'?x.pos==='ST':x.pos==='TD');
    const fromY=H.length?H[H.length-1].toY:(h[0]&&h[0].year)||yl;const rec={p:pf,n:pf==='oyuncu'?'Futbolcu':(SOZ72_MES[pf]?SOZ72_MES[pf].n:carProfN(pf)),from:(mine[0]&&mine[0].year)||fromY,to:yl,age:G.p.age,toY:seasonLabel(y+1)};
    if(pf==='oyuncu')Object.assign(rec,{ap:S.apps,g:S.goals,a:(G.totals||{}).assists||0,caps:S.caps,tr:S.tr});
    else if(G.mode==='mgr'){const mt=G.mt||{w:0,d:0,l:0,s:0},p0=H.filter(x=>x.mt).reduce((a,x)=>({w:a.w+x.mt.w,d:a.d+x.mt.d,l:a.l+x.mt.l,s:a.s+x.mt.s}),{w:0,d:0,l:0,s:0});rec.mt={w:mt.w-p0.w,d:mt.d-p0.d,l:mt.l-p0.l,s:mt.s-p0.s};rec.rep=G.m&&G.m.rep;}
    else rec.js={s:(G.job&&G.job.seasons)||mine.length,rep:Math.round((G.job&&G.job.rep)||0),t:(G.job&&G.job.title)||''};
    rec.club=G.club;H.push(rec);}catch(e){console.warn('soz72 meslek geçmişi',e);}
  /* emekli futbolcu için efsane kulüp teklifi (v72) futbolcu durumundayken hesaplanır */
  let tdOff=null;if(k==='td'){try{const ph=G.phase;if(isPl())G.phase='retired';tdOff=mgrJobOffers(st.rep,3);G.phase=ph;}catch(e){tdOff=null;}}
  G.next=null;G.loan=null;G.tour=null;G.dd=null;G.summary=null;if(G.msS){G.msS.ret=false;G.msS.mode=k==='yrd'||k==='scout'?'staff':'mgr';}
  if(k==='td'){const order=['C','B','A','P'];G.lic=G.lic||{lv:st.lv,exp:0};if(order.indexOf(st.lv)>order.indexOf(G.lic.lv))G.lic.lv=st.lv;const nx=LIC[G.lic.lv].next;if(nx&&!G.lic.course)G.lic.course={y:y+2};
    G.mode='mgr';G.prof='td';delete G.staff;G.m={club:null,conf:60,tac:'dengeli',xi:null,budget:0,st:{w:0,d:0,l:0,gf:0,ga:0},rep:st.rep,offers:[],sacked:false,tp:{f:'denge',i:'normal'},form:0,inj:{},dev:{},sc:{},scout:null,shortlist:[]};
    G.m.offers=(tdOff&&tdOff.length?tdOff:mgrJobOffers(st.rep,3));G.phase='off';G.mustMove=true;G.contract={years:0,wage:0,role:'Teknik Direktör'};
    msg('board','Teknik direktörlük başlıyor',`${PN()}, ${LIC[G.lic.lv].n} lisansıyla ilk iş tekliflerini bekliyor.${G.lic.course&&LIC[G.lic.lv].next?` ${LIC[LIC[G.lic.lv].next].n} kursun ${G.lic.course.y} yazında tamamlanacak.`:''} ${S.pl?`Futbolculuk geçmişin itibarını ${st.rep}’e taşıdı.`:''}`);}
  else if(k==='yrd'||k==='scout'){delete G.m;G.mode='staff';G.staff=k;G.prof=k;G.job={lvl:0,title:STF[k].r[0],rep:10,pts:0,tr:60,offers:[],seasons:0};jobInit();
    if(k==='yrd'){const order=['C','B','A','P'];G.lic=G.lic||{lv:'C',exp:0};if(S.pl&&order.indexOf(st.lv)>order.indexOf(G.lic.lv))G.lic.lv=st.lv;}
    const j=G.job;j.lvl=st.lvl;j.title=STF[k].r[st.lvl];j.rep=Math.min(65,10+Math.round(S.fame*0.4)+st.lvl*6);let offs=staffOffers(j.lvl,3);
    try{if(S.pl){const lc=Object.entries(lcClubTot()).filter(([c])=>CLUBS[c]&&!LEAGUES[CLUBS[c].league].youth).sort((a,b)=>b[1].ap-a[1].ap)[0];if(lc&&!offs.includes(lc[0]))offs[offs.length-1]=lc[0];}}catch(e){}
    j.offers=offs;G.contract={years:0,wage:0,role:j.title};msg('board',`${STF[k].n} olarak yeni dönem`,`${PN()} için ilk iş teklifleri geldi. ${S.pl?'Futbolculuk geçmişin sayesinde ':''}${j.title.toLocaleLowerCase('tr-TR')} olarak başlıyorsun.`);}
  else{delete G.staff;retRole(k);try{const L0=G.lic&&G.lic.lv;if(G.lic)G.lic.lv='P';const o=mgrJobOffers(G.m.rep,3);if(G.lic)G.lic.lv=L0;if(o&&o.length)G.m.offers=o;}catch(e){}}/* yönetici rollerinde antrenörlük lisansı teklif seviyesini sınırlamaz */
  G.mesNew=1;G.phase='off';G.mustMove=true;
  try{if(G.msS)G.msS.mode=G.mode||'p';msAdd(`Yeni meslek: ${SOZ72_MES[k].n}${from==='oyuncu'?' (futbolculuktan sonra)':''}`,'td');}catch(e){}
  try{if(mpOn()){if(typeof mpPubState==='function')mpPubState(true);msg('news','🌐 Odaya bilgi gitti',`Arkadaşın artık seni ${SOZ72_MES[k].n.toLocaleLowerCase('tr-TR')} olarak görüyor. Oda açık; günler yine ikiniz de hazır olunca ilerliyor.`);}}catch(e){}
  save();try{archSave();}catch(e){}TAB='hub';render();window.scrollTo(0,0);toast(`Yeni meslek: ${SOZ72_MES[k].n}`);}
/* emekli ekranı: futbolcu dışı meslekte doğru metin; tek "yeni meslek" paneli */
viewRetired=(old=>function(){let h;try{if(!isPl()&&!(isRef()&&G.job&&(G.job.dismissed||(G.job.mhk&&G.job.mhk.marks>=4)))){const pf=soz72CurProf(),pn=SOZ72_MES[pf]?SOZ72_MES[pf].n:carProfN(pf);
      h=`<section class="panel"><p class="sub-h"><span>Kariyer sonu</span><span>${G.p.age} yaşında</span></p><h2 class="h" style="font-size:36px">${esc(PN())}<br><span style="color:var(--led)">${esc(pn.toLocaleLowerCase('tr-TR'))} olarak görevini bıraktı</span></h2><div class="strip"><div><b>${(G.history||[]).length}</b><span>Sezon</span></div><div><b>${(G.trophies||[]).length}</b><span>Kupa/ödül</span></div>${G.mt&&G.mt.s?`<div><b>${G.mt.w}</b><span>Galibiyet</span></div>`:''}</div></section><button class="btn" data-act="tab" data-tab="career">Kariyer sayfasını aç</button>${soz72MesPanel()}<button class="btn" data-act="newCareer">Yeni kariyer başlat (yeni karakter)</button>`;return h;}}catch(e){console.warn(e);}
  h=old.apply(this,arguments);try{if(isPl()){h=h.replace(/<button class="cta big" data-act="beMgr">[\s\S]*?<\/button>/,'').replace(/<section class="panel"><p class="sub-h"><span>Futbolun içinde kal<\/span>[\s\S]*?<\/section>/,'');const i=h.indexOf('<button class="btn" data-act="newCareer"');const P=soz72MesPanel();h=i>=0?h.slice(0,i)+P+h.slice(i):h+P;}}catch(e){console.warn(e);}return h;})(viewRetired);
/* yaz arasında "mesleği bırak" (futbolcu dışı) ve yeni meslekte ilk teklif bekleme durumu */
viewHub=(old=>function(){let h=old.apply(this,arguments);try{if(G&&!isPl()&&G.phase==='off'&&!isRef()){if(G.mesNew&&G.mustMove)h=h.replace(/(<section class="ticket">[\s\S]*?<div class="ticket-foot">)[\s\S]*?(<\/div><\/section>)/,`$1<span class="pill good">Yeni meslek</span> İlk iş teklifini seç$2`);
    if(!G.mesNew)h+=`<div class="soz72-mesb"><button class="btn" data-act="soz72MesAc">Mesleği bırak · başka meslekte devam et</button></div>`;}}catch(e){console.warn(e);}return h;})(viewHub);
staffSign=(old=>function(){const r=old.apply(this,arguments);try{if(G.mode==='staff')delete G.mesNew;}catch(e){}return r;})(staffSign);
mgrSign=(old=>function(){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.club&&G.phase==='season')delete G.mesNew;}catch(e){}return r;})(mgrSign);
/* kariyer anları: futbolculuktan meslek değiştirince ilk an futbolcu metni olarak kalsın (v124 düzeltmesi yalnız meslek başlangıcı içindir) */
msSync=(old=>function(){let keep=null;try{if(G&&G.mesl&&G.mesl.some(x=>x.p==='oyuncu')&&Array.isArray(G.ms)){keep=G.ms.filter(m=>m&&m.ic==='start');keep.forEach(m=>{m.ic='start172';});}}catch(e){}
  const r=old.apply(this,arguments);try{if(keep)keep.forEach(m=>{if(m.ic==='start172')m.ic='start';});
    if(G&&!isPl()&&Array.isArray(G.ms)){const m=G.ms[G.ms.length-1];if(m&&m.ic==='end'&&m.t==='Futbolu bıraktı'&&G.mode==='staff'){const pf=soz72CurProf();m.t=`${SOZ72_MES[pf]?SOZ72_MES[pf].n:carProfN(pf)} olarak görevini bıraktı`;}}}catch(e){}return r;})(msSync);
/* Kariyerim: meslek geçmişi */
careerSnap=(old=>function(){const s=old.apply(this,arguments);try{if(G&&G.mesl&&G.mesl.length)s.mesl=G.mesl.map(x=>Object.assign({},x));}catch(e){}return s;})(careerSnap);
careerHTML=(old=>function(s){let h=old.apply(this,arguments);try{if(s&&s.mesl&&s.mesl.length){const cur={p:s.prof,n:s.profN||carProfN(s.prof)};
    const rows=s.mesl.map(x=>{const st=x.p==='oyuncu'?`${x.ap||0} maç · ${x.g||0} gol · ${x.a||0} asist${x.caps?` · ${x.caps} milli`:''}${x.tr?` · ${x.tr} kupa/ödül`:''}`:x.mt?`${x.mt.s} sezon · ${x.mt.w}G ${x.mt.d}B ${x.mt.l}M`:x.js?`${x.js.s} sezon · itibar ${x.js.rep}${x.js.t?' · '+x.js.t:''}`:'';
      return `<li><b>${esc(x.n)}</b><small>${esc(x.from)}${x.to&&x.to!==x.from?' – '+esc(x.to):''}${CLUBS[x.club]?' · son kulüp '+esc(CLUBS[x.club].name):''}</small><em>${esc(st)}</em></li>`;}).join('');
    const panel=`<section class="panel soz72-mh"><p class="sub-h"><span>Meslek geçmişi</span><span>${s.mesl.length+1} dönem</span></p><ol class="soz72-ml">${rows}<li class="on"><b>${esc(cur.n)}</b><small>${esc(s.mesl[s.mesl.length-1].toY||'')} – bugün</small><em>şu anki meslek</em></li></ol></section>`;
    const kd=snapKind(s);let extra='';if(kd==='staff'){const t=s.totals||{};if(t.apps)extra=`<p class="muted" style="margin:8px 0 0;text-align:center">Futbolculuk dönemi: ${t.apps} maç · ${t.goals||0} gol · ${t.assists||0} asist${s.caps?` · ${s.caps} milli maç`:''}</p>`;}
    const i=h.indexOf('<section class="panel"><p class="sub-h"><span>Kariyer anları');h=i>=0?h.slice(0,i)+panel+h.slice(i):h+panel;if(extra)h=h.replace(/(<div class="strip">[\s\S]*?<\/div><\/section>)/,m=>m.replace(/<\/section>$/,extra+'</section>'));}}catch(e){console.warn('soz72 kariyerim',e);}return h;})(careerHTML);
/* çevrimiçi oda: yeni düğmeler günü ilerletmez; panelde "farklı meslek" bilgisi */
try{['soz72Mes','soz72MesGo','soz72MesAc','soz72Sik','soz72TSign','soz72TStd','soz72TSend'].forEach(a=>MP_NOADV.add(a));}catch(e){}
try{mpPanelBody=(old=>function(){let h=old.apply(this,arguments);try{const P=MP.peer||G.mp.peer;if(P&&P.prof&&G.prof&&P.prof!==G.prof)h=h.replace('<div class="mp-srv">',`<p class="soz72-warn">Farklı meslek: sen ${esc(mpProfN(G.prof))}, arkadaşın ${esc(mpProfN(P.prof))}. Oda ortak takvimle sürüyor.</p><div class="mp-srv">`);}catch(e){}return h;})(mpPanelBody);}catch(e){}
