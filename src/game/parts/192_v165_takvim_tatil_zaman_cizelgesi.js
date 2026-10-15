/* ================= v165: aylık takvim (gün ayrıntısı), FM tarzı "tatile çık", kariyer zaman çizelgesi ve sezon özeti ================= */
/* Takvim: kendi maçların (arma, iç saha/deplasman, organizasyon, sonuç), kupa turları ve kuralar, transfer dönemi açılış/kapanış ve son gün,
   FIFA milli maç günleri, milli takım çağrısı, yönetim kararları, sözleşme bitişi, sezon sonu/başı, devre arası. Bir güne dokununca ayrıntı açılır;
   ileri bir günde "Bu tarihe kadar tatile çık" ile görev devredilir ve günler, pencere açmadan ve ekranı çizmeden hızla akar.
   Tatil: maçlar hızlı sonuçla (ya da izlemeden 2B motorda) oynanır, sıradan kararlar güvenli varsayılanla verilir, hakem kararları deneyime göre,
   doktor vakaları asistana devredilir. İş/transfer teklifi gibi kariyeri değiştiren bir şey gelirse tatil durur ve sana sorulur.
   Dönüşte "Tatil dönüşü özeti" (sonuçlar, sıra değişimi, sakatlıklar, transferler, gelen kutusu, para, önemli anlar).
   Zaman çizelgesi: G.ms (mevcut kariyer anları) + G.history + kupalar; bundan sonrası için ilk galibiyet, en farklı galibiyet/ağır yenilgi,
   yükselme/düşme, sezon rekoru gibi anlar da G.ms'e yazılır. Sezon sonunda G.v165.sz[yıl] içine küçük bir sezon özeti kaydedilir. */
function v165(){if(!G)return {sz:{}};const V=G.v165=G.v165||{};V.sz=V.sz||{};return V;}
Object.assign(MS_IC,{win:'✓',big:'⬆',loss:'⬇',up:'▲',down:'▼',rec:'★',ref:'⚖',hol:'☀'});
const V165_MON=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const v165Base=()=>seasonStartTs(G.s.year);
const v165Ts=di=>v165Base()+di*DAY_MS;
const v165DayOfTs=ts=>Math.round((ts-v165Base())/DAY_MS);
function v165Today(){if(!G||!G.s)return 0;if(G.phase==='off'){const c=G.s.cal||[];return Math.max(G.s.day,c.length?c[c.length-1]+1:G.s.day);}return G.s.day;}
const v165Kind=()=>{try{return isPl()?'pl':G.mode==='mgr'?'mgr':'staff';}catch(e){return 'pl';}};
function v165Prof(){return G.prof||(G.mode==='mgr'?((G.m&&G.m.role)||'td'):isStaff()?G.staff:'oyuncu');}
function v165ProfN(){const p=v165Prof();return (PROF[p]&&PROF[p].n)||({td:'Teknik direktör',ref:'Hakem',oyuncu:'Futbolcu'}[p])||'Kariyer';}

/* ---------- takvim olayları ---------- */
function v165Events(d0,d1){const s=G.s,E={},add=(d,e)=>{if(d<d0||d>d1)return;(E[d]=E[d]||[]).push(e);},ref=(()=>{try{return isRef();}catch(e){return false;}})();
  const cal=s.cal||[];
  cal.forEach((d,w)=>{if(d<d0||d>d1)return;
    if(ref){const r=(((G.job||{}).rlog)||[]).find(x=>x.y===seasonLabel(s.year)&&x.d===d);add(d,{k:'mac',ic:'⚖',t:r?`${CLUBS[r.h]?CLUBS[r.h].short:''}–${CLUBS[r.a]?CLUBS[r.a].short:''}`:'Görev günü',d:r?`Yönettiğin maç: ${CLUBS[r.h]?CLUBS[r.h].name:''} – ${CLUBS[r.a]?CLUBS[r.a].name:''} · not ${dec(r.rt,1)}`:`${w+1}. hafta maçları · MHK atama yapar`,res:r?[dec(r.rt,1),r.rt>=8.3?'w':r.rt>=7?'d':'l']:null});return;}
    const f=s.fixtures&&s.fixtures[w]&&s.fixtures[w].find(x=>x.includes(G.club));if(!f){add(d,{k:'bay',ic:'·',t:'Maç yok',d:`${w+1}. hafta: takımın bu hafta maç yapmıyor`});return;}
    const home=f[0]===G.club,opp=CLUBS[home?f[1]:f[0]],r=s.results&&s.results[w]&&s.results[w].find(x=>x[0]===f[0]&&x[1]===f[1]);let res=null;
    if(r){const us=home?r[2]:r[3],th=home?r[3]:r[2];res=[`${us}-${th}`,us>th?'w':us===th?'d':'l'];}
    add(d,{k:'mac',c:opp,h:home,comp:curLeague().short,t:opp?opp.short:'',d:`${curLeague().name} · ${w+1}. hafta · ${home?'İç saha':'Deplasman'}${opp?' · '+opp.name:''}`,res});});
  if(!ref){try{for(const k of cupsOf().list){const eu=k.type==='eu';k.rounds.forEach((r,i)=>{if(r.day==null)return;
      const R=(k.res||[])[i],up=k.alive&&i===k.cur,o=R?clubObj(R.opp):up?clubObj(k.opp):null;
      if(!R&&!up&&(!k.alive||i<k.cur))return;
      let res=null;if(R){res=[`${R.us}-${R.them}`,R.us>R.them?'w':R.us===R.them?'d':'l'];}
      add(r.day,{k:eu?'avr':'kupa',c:o,h:R?R.h:(r.neutral?null:!!r.home),comp:k.short||k.name,t:o?o.short:(r.n||'Kupa'),d:`${k.name} · ${r.n||''}${o?' · '+o.name:i>k.cur?' · rakip kurayla belli olacak':''}${r.neutral?' · tarafsız saha':''}`,res});
      if(!eu&&i+1<k.rounds.length&&(i<k.cur||up))add(r.day+1,{k:'kura',ic:'🎱',t:'Kura',d:`${k.name}: ${k.rounds[i+1].n||'sonraki tur'} kurası${i<k.cur&&k.alive?'':up?' (turu geçersen)':''}`});});}}catch(e){}}
  try{const I=twInfo();add(I.so,{k:'tw',ic:'⇄',t:'Transfer açılır',d:'Yaz transfer dönemi açık'});add(I.sc,{k:'tws',ic:'⏱',t:'Son gün',d:'Yaz transfer döneminin son günü (deadline day)'});add(I.wo,{k:'tw',ic:'⇄',t:'Ara transfer',d:'Kış transfer dönemi açılır'});add(I.wc,{k:'tws',ic:'⏱',t:'Son gün',d:'Kış transfer döneminin son günü (deadline day)'});add(I.nso,{k:'tw',ic:'⇄',t:'Transfer açılır',d:'Yeni sezonun yaz transfer dönemi açılır'});}catch(e){}
  try{for(const Y of [s.year,s.year+1])for(const [mo,dd] of NT_DAYS){const di=Math.round((Date.UTC(Y+(mo<6?1:0),mo,dd)-v165Base())/DAY_MS);const mine=G.m&&G.m.nt;add(di,{k:'fifa',ic:'⚑',t:'Milli maç',d:mine?`FIFA milli maç günü · ${ntOf(G.m.nt.nat)[0]} milli takımının maçı`:'FIFA milli maç günü (milli ara)'});}}catch(e){}
  try{if(s.nat&&s.nat.day!=null)add(s.nat.day,{k:'nat',ic:'⚑',t:s.nat.opp?s.nat.opp.short:'Milli',d:`${s.nat.lv} · ${s.nat.opp?s.nat.opp.name:''} · milli maçın`});}catch(e){}
  try{const cs=G.cs&&G.cs[G.club];if(cs&&cs.pend&&cs.pend.at)add(cs.pend.at-s.year*400,{k:'yon',ic:'▣',t:'Yönetim',d:cs.pend.k==='tesis'?'Yönetim kararı: tesis yenilemesi tamamlanır':'Yönetim kararı: takviye oyuncular gelir'});}catch(e){}
  if(cal.length){const last=cal[cal.length-1];add(last,{k:'sb',ic:'🏁',t:'Sezon biter',d:'Sezonun son lig günü · ardından sezon değerlendirmesi'});
    try{if(G.contract&&G.contract.years!=null&&G.contract.years<=1&&!ref)add(last,{k:'soz',ic:'✎',t:'Sözleşme',d:'Sözleşmen bu sezonun sonunda bitiyor'});}catch(e){}
    const st=cal[0]-4,tb=cal.findIndex((d,i)=>i&&d-cal[i-1]>16);if(tb>0)add(cal[tb-1]+3,{k:'tatil',ic:'☀',t:'Devre arası',d:'Lig devre arasına giriyor; takım izinde, ara transfer dönemi'});void st;}
  const ns=Math.round((seasonStartTs(s.year+1)-v165Base())/DAY_MS);add(ns,{k:'ss',ic:'★',t:'Yeni sezon',d:`${seasonLabel(s.year+1)} sezonu hazırlık kampıyla başlar`});
  if(G.p&&G.p.age)add(ns,{k:'yas',ic:'🎂',t:`${G.p.age+1} yaş`,d:`Yeni sezonda ${G.p.age+1} yaşında olacaksın (oyunda yaş sezon başında artar)`});
  try{if(HOL5.tgt&&HOL5.on)add(v165DayOfTs(HOL5.tgt),{k:'hol',ic:'☀',t:'Dönüş',d:'Tatil dönüşü'});}catch(e){}
  return E;}
const V165_EC={mac:'m',kupa:'c',avr:'e',kura:'k',tw:'t',tws:'t',fifa:'n',nat:'n',yon:'b',sb:'s',soz:'s',ss:'s',yas:'s',tatil:'h',hol:'h',bay:'x'};
function v165Chip(e,full){const cls=V165_EC[e.k]||'x';
  if(e.c&&(e.k==='mac'||e.k==='kupa'||e.k==='avr'))return `<span class="v5c ${cls}${e.res?' r'+e.res[1]:''}">${crestSVG(e.c,full?18:13)}<i>${e.h==null?'N':e.h?'İ':'D'}</i><b>${esc(e.t)}</b>${e.res?`<em>${e.res[0]}</em>`:''}</span>`;
  return `<span class="v5c ${cls}${e.res?' r'+e.res[1]:''}"><i class="ic">${e.ic||'•'}</i><b>${esc(e.t)}</b>${e.res?`<em>${e.res[0]}</em>`:''}</span>`;}
let V165M=0;
function v165CalHTML(){const s=G.s,td=v165Today(),base=new Date(v165Ts(td)),mY=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+V165M,1)),y=mY.getUTCFullYear(),mo=mY.getUTCMonth(),dim=new Date(Date.UTC(y,mo+1,0)).getUTCDate(),first=(mY.getUTCDay()+6)%7;
  const di0=v165DayOfTs(Date.UTC(y,mo,1)),E=v165Events(Math.min(di0,td),Math.max(di0+dim+400,td+400)),ns=Math.round((seasonStartTs(s.year+1)-v165Base())/DAY_MS),last=(s.cal||[]).length?s.cal[s.cal.length-1]:0;
  let tw=null;try{tw=twInfo();}catch(e){}
  let cells='';for(let i=0;i<first;i++)cells+='<div class="v5d e"></div>';
  for(let d=1;d<=dim;d++){const di=di0+d-1,ev=(E[di]||[]).filter(e=>e.k!=='bay'),past=di<td,isT=di===td;let typ='';
    if(di>last&&di<ns)typ='yaz';else if(di>=0&&di<ns&&G.phase==='season'){try{typ=dayType(di);}catch(e){}}
    const twc=tw&&di>=0&&di<ns&&((di>=tw.so&&di<=tw.sc)||(di>=tw.wo&&di<=tw.wc))?' tw':'',sel=HOL5.on&&v165DayOfTs(HOL5.tgt)===di?' hol':'';
    const main=ev.filter(e=>e.k==='mac'||e.k==='kupa'||e.k==='avr'||e.k==='nat'),oth=ev.filter(e=>!main.includes(e));
    cells+=`<button class="v5d${isT?' now':''}${past?' past':''} t-${typ}${twc}${sel}${ev.length?' has':''}" data-act="v165Day" data-d="${di}" aria-label="${fmtDate(new Date(v165Ts(di)))}${ev.length?': '+esc(ev.map(e=>e.t).join(', ')):''}"><span class="n">${d}</span>${main.slice(0,2).map(e=>v165Chip(e)).join('')}${oth.length?`<span class="v5i">${oth.slice(0,4).map(e=>`<i class="${V165_EC[e.k]||'x'}" title="${esc(e.t)}">${e.ic||'•'}</i>`).join('')}</span>`:''}</button>`;}
  const tl=(TR_MONTHS_L||[])[mo]||mo+1;
  return `<section class="panel v5cal"><div class="v5hd"><button class="btn sm" data-act="v165M" data-k="-1" aria-label="Önceki ay">‹</button><div><b>${tl} ${y}</b><small>${V165M?`<button class="lnk" data-act="v165M" data-k="0">Bugüne dön</button>`:`Bugün: ${fmtDate(new Date(v165Ts(td)))}`}</small></div><button class="btn sm" data-act="v165M" data-k="1" aria-label="Sonraki ay">›</button></div>
    <div class="v5g">${V165_MON.map(x=>`<div class="v5w">${x}</div>`).join('')}${cells}</div>
    <div class="v5lg"><span><i class="lg m"></i>Maç</span><span><i class="lg c"></i>Kupa/Avrupa</span><span><i class="lg n"></i>Milli</span><span><i class="lg t"></i>Transfer dönemi</span><span><i class="lg s"></i>Sezon/sözleşme</span><span>İ iç saha · D deplasman</span></div>
    <p class="muted v5tip">Bir güne dokun: ayrıntılar ve <b>“Bu tarihe kadar tatile çık”</b>.</p></section>`;}
function v165AgendaHTML(){const td=v165Today(),E=v165Events(td,td+400),days=Object.keys(E).map(Number).filter(d=>d>=td).sort((a,b)=>a-b),out=[];
  for(const d of days){for(const e of E[d]){if(e.k==='bay'||e.k==='yas')continue;out.push([d,e]);}if(out.length>=12)break;}
  return `<section class="panel"><p class="sub-h"><span>Önümüzde neler var</span><span>${out.length} olay</span></p><ul class="v5ag">${out.slice(0,12).map(([d,e])=>`<li><button data-act="v165Day" data-d="${d}"><span class="dt">${fmtDate(new Date(v165Ts(d)))}<small>${d===td?'bugün':d-td+' gün'}</small></span>${v165Chip(e,1)}<em>${esc(e.d||'')}</em></button></li>`).join('')||'<li class="muted">Önümüzde kayıtlı olay yok.</li>'}</ul></section>`;}
function v165ViewCal(){if(!G||!G.s||!G.s.cal)return '<h2 class="h">Takvim</h2><section class="panel"><p class="muted">Takvim kariyer başlayınca açılır.</p></section>';
  const last=v165().last;
  return `<h2 class="h">Takvim</h2>${v165CalHTML()}${v165AgendaHTML()}${last?`<section class="panel"><button class="btn" data-act="tab" data-tab="tatil" style="width:100%">☀ Son tatil dönüşü özeti (${esc(last.from)} → ${esc(last.to)})</button></section>`:''}`;}
viewCal=(old=>function(){try{return v165ViewCal();}catch(e){console.warn('v165 takvim',e);return old.apply(this,arguments);}})(viewCal);
XV.cal=viewCal;
ACTX.v165M=el=>{const k=+el.dataset.k;V165M=k===0?0:clamp(V165M+k,-12,14);render();};
/* gün ayrıntısı */
function v165DayModal(di){const td=v165Today(),E=v165Events(di,di)[di]||[],dt=new Date(v165Ts(di)),ns=Math.round((seasonStartTs(G.s.year+1)-v165Base())/DAY_MS),last=(G.s.cal||[]).length?G.s.cal[G.s.cal.length-1]:0;
  let typ=null;if(di>last&&di<ns)typ={n:'Yaz arası',d:'Sezon bitti; takım yeni sezonu bekliyor.'};else if(di>=0&&di<ns&&G.phase==='season'){try{const t=dayType(di);typ=DT[t];}catch(e){}}
  const canHol=di>td&&G.phase!=='retired'&&G.phase!=='tryout'&&di-td<=400,n=di-td;
  openModal(`<div class="v5day"><p class="kicker">${di===td?'Bugün':di<td?`${td-di} gün önce`:`${n} gün sonra`}</p><h3>${fmtLong(dt)}</h3>${typ?`<p class="muted">${esc(typ.n)}${typ.d?' · '+esc(typ.d):''}</p>`:''}
    ${E.length?`<ul class="v5dl">${E.map(e=>`<li>${v165Chip(e,1)}<span>${esc(e.d||'')}</span></li>`).join('')}</ul>`:'<p class="muted">Bu gün için kayıtlı bir olay yok.</p>'}
    ${canHol?`<button class="cta" data-act="v165Hol" data-d="${di}"><span>☀ Bu tarihe kadar tatile çık</span><small>${n} gün · simülasyon arada durmadan sürer</small></button>`:''}
    <button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Kapat</button></div>`);}
ACTX.v165Day=el=>v165DayModal(+el.dataset.d);

/* ---------- tatil seçenekleri ---------- */
const V165_OPT={m:'hizli',t:'dondur',k:'oto'};
function v165OptHTML(di){const K=v165Kind(),pr=v165Prof(),td=v165Today(),n=di-td,O=V165_OPT,seg=(k,v,l,sub)=>`<button class="v5o${O[k]===v?' on':''}" data-act="v165Opt" data-k="${k}" data-v="${v}" data-d="${di}" aria-pressed="${O[k]===v}"><b>${l}</b>${sub?`<small>${sub}</small>`:''}</button>`;
  const mgr=K==='mgr',ref=pr==='ref',club=mgr&&!(G.m&&G.m.role&&G.m.role!=='td');
  let mt='';
  if(K==='pl')mt=`<p class="v5oi">⚽ Maçların hızlı simülasyonla oynanır (puanın biraz düşük gelir); idmanlar plana göre otomatik yapılır.</p>`;
  else if(ref)mt=`<p class="v5oi">⚖ Maçlarda pozisyon kararları deneyimine göre otomatik verilir (isabet oranın hakem seviyene bağlı).</p>`;
  else if(club||pr==='yrd')mt=`<div class="v5og"><p>Maçlar</p>${seg('m','hizli',club?'Yardımcım yönetsin':'Yalnız sonucu gör','Hızlı sonuç · en çabuk')}${seg('m','motor','2B motorda oynat','İzlemeden, maç motoru · daha yavaş')}</div>`;
  else mt=`<p class="v5oi">⚽ Maç günleri sonuçla geçer.</p>`;
  const tr=mgr?`<div class="v5og"><p>Transferler</p>${seg('t','dondur','Dondur','Gelen teklifler beklesin, süresi dolanlar düşsün')}${seg('t','dur','Teklif gelince dön','Oyuncuna teklif gelirse tatil biter')}</div>`:'';
  const dc=`<div class="v5og"><p>Kararlar ve olaylar</p>${seg('k','oto','Makul varsayılanla ver',pr==='dr'?'Vakalar asistan hekime devredilir':K==='pl'?'Sıradan olaylar güvenli seçenekle geçer':'Basın, talep ve görevler güvenli seçenekle')}${seg('k','dur','Karar çıkınca dön','Her kararda tatil biter')}</div>`;
  return `<div class="v5hol"><p class="kicker">Tatile çık</p><h3>${fmtLong(new Date(v165Ts(di)))}</h3><p class="muted">${n} gün sonra dönersin. Arada simülasyon durmadan sürer; dönüşte olanların özeti seni bekler.</p>
    ${mt}${tr}${dc}<p class="v5oi warn">✋ İş teklifi, transfer/sözleşme teklifi ya da kariyerini değiştirecek bir karar gelirse tatil kendiliğinden biter ve sana sorulur.</p>
    <button class="cta" data-act="v165Go" data-d="${di}"><span>☀ Tatile çık</span><small>${fmtDate(new Date(v165Ts(td)))} → ${fmtDate(new Date(v165Ts(di)),true)}</small></button><button class="btn ghost" data-act="v165Day" data-d="${di}" style="width:100%;margin-top:8px">Geri</button></div>`;}
ACTX.v165Hol=el=>{openModal(v165OptHTML(+el.dataset.d));};
ACTX.v165Opt=el=>{V165_OPT[el.dataset.k]=el.dataset.v;openModal(v165OptHTML(+el.dataset.d));};
ACTX.v165Go=el=>{const di=+el.dataset.d;closeModal();v165Start(v165Ts(di));};

/* ---------- tatil sürücüsü ---------- */
const HOL5={on:false,tgt:0};
const V165_STOP=new Set(['accept','nego','mgrSign','trySign','intAcc','ntAcc','agSign','loanGo','stSign','trcOffer','plFind']);
const V165_BAD=/\b(sil|ayrıl|istifa|emekli|bırak|kov|jübile|kariyer[ıi] bitir)/i,V165_BADA=new Set(['retire','mgrRetire','resign','slotDel','kvQSil','kvYSil','toMenu']);
const V165_QUICK={play:'simPlay',mgrPlay:'mgrSim',mgrCupW:'mgrCup',yrWatch:'stMatch',stWatch:'stMatch',ref3:'refGo',v155Watch:'stMatch'};
function v165Click(act,ds){const b=document.createElement('button');b.dataset.act=act;if(ds)for(const k in ds)b.dataset[k]=ds[k];b.hidden=true;document.body.appendChild(b);try{b.click();}finally{b.remove();}}
function v165Snap(){const s=G.s,K=v165Kind();let pos=0;try{pos=G.phase==='season'||G.phase==='off'?tablePos():0;}catch(e){}
  let sq=null;try{if(K==='mgr')sq=squadOf(G.club).map(p=>[p.k,p.name]);}catch(e){}
  return {ts:v165Ts(v165Today()),y:s.year,club:G.club,lg:s.league,pos,money:G.p?G.p.money:0,bud:G.m&&G.m.budget!=null?G.m.budget:null,rep:G.m&&G.m.rep!=null?G.m.rep:(G.job&&G.job.rep!=null?Math.round(G.job.rep):null),ovr:K==='pl'?OVR():null,sq,ms:(G.ms||[]).length,tr:(G.trophies||[]).length,inj:G.p&&G.p.injury?G.p.injury.name:null};}
function v165Start(tgt){if(!G||HOL5.on)return;if(G.phase==='tryout'||G.phase==='retired')return toast('Şu an tatile çıkamazsın');
  Object.assign(HOL5,{on:true,tgt,t0:performance.now(),opt:Object.assign({},V165_OPT),cancel:false,stop:null,steps:0,res:[],msgs:[],tst:[],sig:'',sigN:0,same:0,key:'',dirty:false,szY:[],
    seen:new Set(),seenOff:new Set(),d0:v165Today(),y0:G.s.year,snap:v165Snap(),trS:G.trScene,lastUi:0,days:Math.max(1,v165DayOfTs(tgt)-v165Today())});
  v165ResScan(true);v165OfferScan(true);G.trScene=false;
  if(TAB!=='hub'){TAB='hub';}
  v165Ov();setTimeout(v165Loop,30);}
/* sonuç tarama: kendi maçları (lig + kupa) ve hakem görevleri */
function v165ResScan(init){const s=G.s;if(!s)return;const H=HOL5,y=s.year;
  try{if(isRef()){const L=((G.job||{}).rlog)||[];for(const r of L){const k='r'+r.y+':'+r.d+':'+r.h;if(H.seen.has(k))continue;H.seen.add(k);if(!init)H.res.push({d:fmtDate(new Date(v165Ts(r.d))),t:`${CLUBS[r.h]?CLUBS[r.h].short:''} – ${CLUBS[r.a]?CLUBS[r.a].short:''}`,sc:'Not '+dec(r.rt,1),k:r.rt>=8.3?'w':r.rt>=7?'d':'l',comp:'Hakem'});}return;}}catch(e){}
  (s.results||[]).forEach((rd,w)=>{if(!rd)return;const k='l'+y+':'+w;if(H.seen.has(k))return;const r=rd.find(x=>x[0]===G.club||x[1]===G.club);if(!r)return;H.seen.add(k);if(init)return;
    const home=r[0]===G.club,us=home?r[2]:r[3],th=home?r[3]:r[2],o=CLUBS[home?r[1]:r[0]];H.res.push({d:fmtDate(new Date(v165Ts(s.cal[w]))),o:home?r[1]:r[0],h:home,sc:`${us}-${th}`,k:us>th?'w':us===th?'d':'l',comp:curLeague().short,t:o?o.name:''});});
  try{for(const c of cupsOf().list)(c.res||[]).forEach((R,i)=>{const k='c'+y+':'+c.id+':'+i;if(H.seen.has(k))return;H.seen.add(k);if(init)return;const o=clubObj(R.opp),day=c.rounds[i]?c.rounds[i].day:null;
    H.res.push({d:day!=null?fmtDate(new Date(v165Ts(day))):'',o:R.opp,h:R.h,sc:`${R.us}-${R.them}`,k:R.us>R.them?'w':R.us===R.them?'d':'l',comp:(c.short||c.name)+(R.n?' · '+R.n:''),t:o?o.name:''});});}catch(e){}}
/* kariyeri değiştiren teklifler */
function v165OfferScan(init){const H=HOL5,out=[];const chk=(k,txt)=>{if(H.seenOff.has(k))return;H.seenOff.add(k);if(!init)out.push(txt);};
  for(const m of G.inbox||[]){if(m.offer&&m.offer.status==='open'){const c=CLUBS[m.offer.club];chk('o'+(m.offer.id||m.id),`${c?c.name:'Bir kulüp'} ${m.offer.kind==='loan'?'kiralık':m.offer.kind==='renew'?'sözleşme':'transfer'} teklifi yaptı`);}}
  const M=G.m;if(M){(M.offers||[]).forEach(id=>chk('j'+id+':'+G.s.year,`${CLUBS[id]?CLUBS[id].name:'Bir kulüp'} sana iş teklif ediyor`));if(M.ntOff)chk('nt'+M.ntOff.nat,'Milli takım görevi teklifi');
    if(H.opt.t==='dur')(M.bids||[]).forEach(b=>chk('b'+b.id,`${CLUBS[b.club]?CLUBS[b.club].name:'Bir kulüp'} oyuncun için teklif yaptı`));}
  const J=G.job;if(J){if(J.intOff)chk('int'+G.s.year+':'+G.s.week,'Yönetim seni kalıcı teknik direktör yapmak istiyor');(J.offers||[]).forEach(id=>{if(G.phase==='season')chk('so'+id+':'+G.s.year,`${CLUBS[id]?CLUBS[id].name:'Bir kulüp'} iş teklifi`);});}
  return out[0]||null;}
/* pencere çözümü */
function v165Modal(){const H=HOL5,mc=$('#modalCard'),vis=x=>!x.hidden&&x.offsetParent!==null;const bs=[...mc.querySelectorAll('button[data-act]')].filter(vis);
  const sig=(mc.textContent||'').slice(0,160);if(sig===H.sig)H.sigN++;else{H.sig=sig;H.sigN=0;}
  const ttl=((mc.querySelector('h3')||{}).textContent||'Karar').trim();
  if(bs.some(b=>V165_STOP.has(b.dataset.act)))return v165End('karar',`Önemli karar: ${ttl}`);
  if(H.sigN>6)return v165End('karar',`Takıldı: ${ttl}`);
  if(H.sigN>3){closeModal();return 'kapat';}
  const ok=b=>!V165_BADA.has(b.dataset.act)&&!V165_BAD.test(b.textContent||'')&&!V165_STOP.has(b.dataset.act);
  /* hakem: karar deneyime göre */
  const rd=bs.filter(b=>b.dataset.act==='refDec'||b.dataset.act==='refVar');
  if(rd.length){let pick=null;try{const I=REF&&REF.inc[REF.i];if(I&&Math.random()<refClarity())pick=rd.find(b=>b.dataset.k===I.truth);}catch(e){}(pick||rd[Math.floor(Math.random()*rd.length)]).click();return 'hakem';}
  const real=bs.filter(b=>b.dataset.act!=='closeModal');
  if(H.opt.k==='dur'&&real.length>=2&&!bs.some(b=>b.dataset.act==='closeModal'&&/\bcta\b/.test(b.className)))return v165End('karar',`Karar bekliyor: ${ttl}`);
  const pref=bs.find(b=>b.dataset.act==='drDeleg')||bs.find(b=>b.dataset.auto&&ok(b))||bs.find(b=>/\bcta\b/.test(b.className)&&ok(b))||bs.find(b=>b.dataset.act==='closeModal')||real.find(ok);
  if(pref){pref.click();return 'pencere';}closeModal();return 'kapat';}
function v165Done(){const H=HOL5;if(G.phase==='retired')return true;if(G.phase==='season')return v165Ts(G.s.day)>=H.tgt;if(G.phase==='off')return seasonStartTs(G.s.year+1)>H.tgt;return false;}
function v165Hub(){const host=document.createElement('div');host.innerHTML=viewHub();return host;}
function v165Step(){const H=HOL5;H.steps++;
  if(typeof FX!=='undefined'&&FX){if(FX.phase==='end'){try{fxClose();}catch(e){console.warn(e);}return 'fx';}if(FX.phase==='pre'){try{fxAct('play');}catch(e){}}if(!FX.__h5||!FX.ab){FX.__h5=1;try{fxToEnd();}catch(e){console.warn(e);}}return 'fx';}
  if(!$('#modal').hidden)return v165Modal();
  const ms=$('#match');if(ms&&!ms.hidden){for(const sel of ['#mgTut:not([hidden]) [data-act="tutGo"]','#mvSkip:not([hidden])','#mvDone:not([hidden])','#mvFast']){const x=document.querySelector(sel);if(x&&x.offsetParent!==null){x.click();return 'sahne';}}try{if(typeof MR!=='undefined'&&MR)MR.fast=true;}catch(e){}return 'sahne-bekle';}
  if(G.phase==='tryout')return v165End('karar','Seçmeler');
  if(G.phase==='retired')return v165End('son','Kariyer sona erdi');
  v165ResScan(false);v165Tick();
  if(v165Done())return v165End('ok');
  const off=v165OfferScan(false);if(off)return v165End('karar',off);
  const host=v165Hub();
  if(G.phase==='off'){/* yaz arası: teklif varsa sor, yoksa yeni sezona geç */
    const offs=[...host.querySelectorAll('[data-act]')].filter(x=>V165_STOP.has(x.dataset.act)&&x.dataset.act!=='nego');
    if(G.mustMove)return v165End('karar',`Sezon bitti: ${offs.length?'yeni kulübünü seçmen gerekiyor':'kariyerinle ilgili bir karar bekliyor'}`);
    if(offs.length)return v165End('karar',`Sezon bitti: yaz arasında ${offs.length} teklif seni bekliyor`);
    const nb=host.querySelector('[data-act=newSeason],[data-act=mgrNew],[data-act=stNew]');
    if(!nb||nb.disabled)return v165End('karar','Sezon bitti; yeni sezon için senin kararın gerekiyor');
    const k0=G.s.year;v165Click(nb.dataset.act);if(G.phase==='off'&&G.s.year===k0)return v165End('karar','Yeni sezon başlatılamadı; ana sayfaya bak');return 'sezon';}
  const b=host.querySelector('.cta[data-act]:not([data-act=closeModal])');
  if(!b)return v165End('karar','Devam edilecek bir adım bulunamadı');
  const a=b.dataset.act;
  if(b.disabled||V165_STOP.has(a))return v165End('karar',`Senin kararın gerekiyor: ${(b.textContent||'').trim().slice(0,60)}`);
  if(V165_BADA.has(a))return v165End('karar','Kariyerinle ilgili bir karar seni bekliyor');
  const q=V165_QUICK[a];
  if(q&&(H.opt.m==='hizli'||a==='play'||a==='ref3'||a==='stWatch'||a==='v155Watch')&&host.querySelector(`[data-act="${q}"]`)){v165Click(q);return 'mac';}
  if(a==='mgrAdv'){/* maç gününe ilerle: hedef tarihi aşmasın */const tg=v165DayOfTs(H.tgt);const nm=nextMatchDay(G.s.day);
    if(nm!=null&&tg<nm){try{if(typeof v155Gate==='function'&&v155Gate())return 'karar-kuyruk';}catch(e){}let g=0;while(g++<120&&G.phase==='season'&&G.s.day<tg&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac'||t==='kupa')break;nextDay();}return 'gun';}}
  if(a==='stAdv'){v165Click('stDay');return 'gun';}
  const k=G.s.year+'/'+G.s.day+'/'+G.phase;if(k===H.key)H.same++;else{H.key=k;H.same=0;}
  if(H.same>40)return v165End('karar','İlerleme durdu; ana sayfaya bak');
  if(H.same>8){v165Click(a);return 'tik';}
  try{fmCont();}catch(e){console.warn('v165 devam',e);v165Click(a);}return 'gun';}
function v165Loop(){const H=HOL5;if(!H.on)return;const t0=performance.now();let n=0;
  try{while(H.on&&performance.now()-t0<38&&n<60){if(H.cancel){v165End('iptal');break;}const r=v165Step();n++;if(r==='sahne-bekle'||r==='fx'&&FX&&FX.ab)break;}}
  catch(e){console.warn('v165 tatil',e);v165End('karar','Beklenmeyen bir durum: '+(e&&e.message||e));}
  if(!H.on)return;v165OvUpd();setTimeout(v165Loop,FX&&FX.ab||($('#match')&&!$('#match').hidden)?120:0);}
/* tatil sırasında çizim, kayıt ve 3B/Adoball/Pro modları devre dışı */
render=(old=>function(){if(HOL5.on){HOL5.rq=1;return;}return old.apply(this,arguments);})(render);
save=(old=>function(){if(HOL5.on){HOL5.dirty=true;return;}const r=old.apply(this,arguments);try{v165Tick();}catch(e){}return r;})(save);
toast=(old=>function(t){if(HOL5.on){if(typeof t==='string'&&HOL5.tst.length<40)HOL5.tst.push(t);return;}return old.apply(this,arguments);})(toast);
msg=(old=>function(t,title,body){const r=old.apply(this,arguments);try{if(HOL5.on&&HOL5.msgs.length<300)HOL5.msgs.push({t,ti:String(title||'').slice(0,90),b:String(body||'').replace(/<[^>]+>/g,'').slice(0,150),y:G.s?G.s.year:0,d:G.s?G.s.day:0});}catch(e){}return r;})(msg);
f3Pref=(old=>function(){return HOL5.on?false:old.apply(this,arguments);})(f3Pref);
abPref=(old=>function(){return HOL5.on?false:old.apply(this,arguments);})(abPref);
if(typeof pl3Pref==='function')pl3Pref=(old=>function(){return HOL5.on?false:old.apply(this,arguments);})(pl3Pref);
plMode=(old=>function(){return HOL5.on?'classic':old.apply(this,arguments);})(plMode);
fmCont=(old=>function(){if(HOL5.on){const ev=window.event;if(ev&&(ev.type==='click'||ev.type==='keydown'))return;}return old.apply(this,arguments);})(fmCont);
fmContTarget=(old=>function(){if(HOL5.on){const h=v165Hub();return h.querySelector('.cta[data-act]:not([data-act=closeModal])');}return old.apply(this,arguments);})(fmContTarget);
document.addEventListener('keydown',e=>{if(!HOL5.on)return;if(e.key==='Escape'){HOL5.cancel=true;}if(e.key===' '||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();}},true);
ACTX.v165Stop=()=>{HOL5.cancel=true;};
/* ilerleme katmanı */
function v165Ov(){let o=$('#v165ov');if(!o){o=document.createElement('div');o.id='v165ov';document.body.appendChild(o);}o.hidden=false;
  o.innerHTML=`<div class="v5ovc" role="dialog" aria-live="polite" aria-label="Tatil sürüyor"><p class="kicker">☀ Tatildesin · ${esc(v165ProfN())}</p><h3 id="v5ovd">${fmtLong(new Date(v165Ts(v165Today())))}</h3><div class="v5bar"><i id="v5ovb" style="width:0%"></i></div><p class="muted" id="v5ovn">Dönüş: ${fmtLong(new Date(HOL5.tgt))}</p><ol class="v5tk" id="v5ovt"></ol><button class="btn" data-act="v165Stop">Tatili bitir</button></div>`;}
function v165OvUpd(){const H=HOL5;const now=performance.now();if(now-H.lastUi<60)return;H.lastUi=now;const o=$('#v165ov');if(!o)return;
  const cur=v165DayOfTs(v165Ts(v165Today())+(G.s.year!==H.y0?seasonStartTs(G.s.year)-seasonStartTs(H.y0):0)),done=clamp(G.s.year===H.y0?v165Today()-H.d0:Math.round((v165Ts(v165Today())-H.snap.ts)/DAY_MS),0,H.days);void cur;
  const d=$('#v5ovd');if(d)d.textContent=G.phase==='off'?`Yaz arası · ${seasonLabel(G.s.year)} bitti`:fmtLong(new Date(v165Ts(v165Today())));
  const b=$('#v5ovb');if(b)b.style.width=Math.round(done/H.days*100)+'%';const n=$('#v5ovn');if(n)n.textContent=`${done} / ${H.days} gün · dönüş ${fmtDate(new Date(H.tgt),true)}`;
  const t=$('#v5ovt');if(t)t.innerHTML=H.res.slice(-6).reverse().map(r=>`<li class="r${r.k}"><span>${esc(r.d)}</span><b>${esc(r.t||'')}</b><em>${esc(r.sc)}</em></li>`).join('');}
/* bitiş ve özet */
function v165End(why,txt){const H=HOL5;if(!H.on)return 'bitti';H.on=false;H.stop=why;try{G.trScene=H.trS;}catch(e){}
  try{v165ResScan(false);v165Tick();}catch(e){}
  const S0=H.snap,S1=v165Snap(),K=v165Kind(),cross=S1.y!==S0.y;let pos0=S0.pos,pos1=S1.pos;
  const sq0=new Map(S0.sq||[]),sq1=new Map(S1.sq||[]),tin=[],tout=[];if(S0.sq&&S1.sq&&S0.club===S1.club){for(const [k,n] of sq1)if(!sq0.has(k))tin.push(n);for(const [k,n] of sq0)if(!sq1.has(k))tout.push(n);}
  const M=H.msgs,reTr=/transfer|satış|kiral|imza|bonservis|takviye|serbest kalma/i;
  const c1=CLUBS[S1.club]||{},c0=CLUBS[S0.club]||{},mine=m=>{const x=m.ti+' '+m.b;return [c1.name,c1.short,c0.name,c0.short,G.p&&G.p.name].some(n=>n&&x.includes(n));};
  const isInj=m=>m.t==='injury'||/sakat/i.test(m.ti),isTr=m=>!isInj(m)&&m.t!=='report'&&reTr.test(m.ti)&&(K==='pl'?mine(m):(m.t==='board'||mine(m)));
  const inj=M.filter(m=>isInj(m)&&(K==='pl'||m.t!=='gundem'||mine(m))).slice(-8).map(m=>m.ti+(m.b?': '+m.b.slice(0,90):''));
  const trm=M.filter(isTr).slice(-8).map(m=>m.ti);
  const hl=M.filter(m=>m.t!=='report'&&!isInj(m)&&!isTr(m)&&!(reTr.test(m.ti)&&!mine(m))&&!/^Maç raporu/.test(m.ti)).slice(-10).reverse().map(m=>({t:m.t,ti:m.ti,b:m.b}));
  const ms=(G.ms||[]).slice(S0.ms).map(m=>({t:m.t,ic:m.ic,y:m.y}));const trs=(G.trophies||[]).slice(S0.tr).map(t=>t.name);
  const w=H.res.filter(r=>r.k==='w').length,d=H.res.filter(r=>r.k==='d').length,l=H.res.filter(r=>r.k==='l').length;
  const why2={ok:'Hedef tarihe ulaşıldı',iptal:'Tatili sen bitirdin',karar:txt||'Senin kararın gerekiyor',son:txt||'Kariyer sona erdi'}[why]||txt||'';
  const days=Math.max(0,Math.round((S1.ts-S0.ts)/DAY_MS));
  const V=v165();V.last={from:fmtDate(new Date(S0.ts),true),to:G.phase==='off'?`Yaz arası ${G.s.year+1}`:fmtDate(new Date(S1.ts),true),days,why,why2,sec:Math.round((performance.now()-H.t0)/100)/10,steps:H.steps,
    res:H.res.slice(-40),w,d,l,ref:(()=>{try{return isRef();}catch(e){return false;}})(),pos0,pos1,cross,lg0:S0.lg,lg1:S1.lg,club0:S0.club,club1:S1.club,money:(S1.money||0)-(S0.money||0),bud:S0.bud!=null&&S1.bud!=null?S1.bud-S0.bud:null,rep:S0.rep!=null&&S1.rep!=null?S1.rep-S0.rep:null,
    ovr:S0.ovr!=null&&S1.ovr!=null?S1.ovr-S0.ovr:null,inj,inj1:S1.inj,trm,tin:tin.slice(0,12),tout:tout.slice(0,12),hl,ms,trs,szY:H.szY.slice(),kind:K,nmsg:M.length};
  if(why!=='iptal'||days>0)msg('news',`Tatil dönüşü: ${days} gün`,`${V.last.from} – ${V.last.to}. ${H.res.length?`${H.res.length} maç: ${w}G ${d}B ${l}M. `:''}${why2}. Ayrıntılar Takvim › Son tatil dönüşü özeti sayfasında.`);
  const o=$('#v165ov');if(o){o.hidden=true;o.innerHTML='';}
  const keepModal=!$('#modal').hidden;
  try{save();}catch(e){}TAB='tatil';try{render();}catch(e){console.warn(e);}window.scrollTo(0,0);
  if(!keepModal&&H.tst.length&&why==='karar')try{toast(H.tst[H.tst.length-1]);}catch(e){}
  return 'bitti';}
function v165ResLi(r){const o=r.o?clubObj(r.o):null;return `<li class="v5r r${r.k}"><span class="dt">${esc(r.d||'')}</span>${o?crestSVG(o,20):'<i class="ic">⚖</i>'}<b>${r.h==null?'':r.h?'<small>İ</small>':'<small>D</small>'}${esc(r.t||'')}<small class="cp">${esc(r.comp||'')}</small></b><em>${esc(r.sc)}</em></li>`;}
const V165_MT={news:'Haber',board:'Yönetim',gundem:'Gündem',coach:'Teknik ekip',nat:'Milli takım',squad:'Kadro',injury:'Sağlık',report:'Maç'};
function v165ViewHol(){const L=v165().last;if(!L)return `<h2 class="h">Tatil dönüşü özeti</h2><section class="panel"><p class="muted">Henüz tatile çıkmadın. Takvimde ileri bir güne dokun ve “Bu tarihe kadar tatile çık”ı seç.</p><button class="cta" data-act="tab" data-tab="cal"><span>Takvimi aç</span></button></section>`;
  const arrow=(a,b)=>!a||!b?'':b<a?`<b class="v5up">▲ ${a-b}</b>`:b>a?`<b class="v5dn">▼ ${b-a}</b>`:'<b>=</b>',sg=v=>v>0?'+':v<0?'−':'',mn=v=>sg(v)+money(Math.abs(v));
  const posTxt=L.ref?'':L.cross?`<div><b>${L.pos1||'—'}.</b><span>Yeni sezon sırası</span></div>`:`<div><b>${L.pos1||'—'}.</b><span>Sıra ${arrow(L.pos0,L.pos1)}${L.pos0&&L.pos0!==L.pos1?` <small>(önce ${L.pos0}.)</small>`:''}</span></div>`;
  const fin=[L.money?`<li><span>Kişisel kasa</span><b class="${L.money>0?'v5up':'v5dn'}">${mn(L.money)}</b></li>`:'',L.bud!=null&&L.bud?`<li><span>Kulüp bütçesi</span><b class="${L.bud>0?'v5up':'v5dn'}">${mn(L.bud)}</b></li>`:'',L.rep?`<li><span>İtibar</span><b class="${L.rep>0?'v5up':'v5dn'}">${L.rep>0?'+':''}${Math.round(L.rep)}</b></li>`:'',L.ovr?`<li><span>Genel güç</span><b class="${L.ovr>0?'v5up':'v5dn'}">${L.ovr>0?'+':''}${L.ovr}</b></li>`:''].join('');
  const box=(t,inner)=>inner?`<section class="panel"><p class="sub-h"><span>${t}</span></p>${inner}</section>`:'';
  return `<h2 class="h">Tatil dönüşü özeti</h2>
  <section class="panel v5ret"><p class="kicker">☀ ${L.days} gün · ${esc(L.from)} → ${esc(L.to)}</p><h3>${L.why==='ok'?'Hoş geldin!':L.why==='iptal'?'Tatilden erken döndün':'Tatil yarıda kaldı'}</h3><p class="muted">${esc(L.why2)}${L.sec!=null?` · ${dec(L.sec,1)} sn sürdü`:''}</p>
   <div class="strip"><div><b>${L.res.length}</b><span>${L.ref?'Görev':'Maç'}</span></div>${L.ref?`<div><b>${L.res.length?dec(L.res.reduce((a,r)=>a+(parseFloat(String(r.sc).replace('Not ','').replace(',','.'))||0),0)/L.res.length,1):'—'}</b><span>Not ort.</span></div>`:`<div><b>${L.w}-${L.d}-${L.l}</b><span>G-B-M</span></div>`}${posTxt}<div><b>${L.nmsg}</b><span>Yeni mesaj</span></div></div>
   ${L.szY&&L.szY.length?L.szY.map(y=>`<button class="cta" data-act="v165Sz" data-y="${y}"><span>📊 ${seasonLabel(y)} sezon özeti</span><small>Tatil sırasında sezon bitti</small></button>`).join(''):''}</section>
  ${box('Maçlar ve sonuçlar',L.res.length?`<ul class="v5rl">${L.res.slice().reverse().map(v165ResLi).join('')}</ul>`:'<p class="muted">Bu sürede maç oynanmadı.</p>')}
  ${box('Önemli anlar',(L.trs.length||L.ms.length)?`<ul class="v5ml">${L.trs.map(t=>`<li><i>🏆</i><b>${esc(t)}</b></li>`).join('')}${L.ms.filter(m=>m.ic!=='cup').map(m=>`<li><i>${MS_IC[m.ic]||'•'}</i><b>${esc(m.t)}</b></li>`).join('')}</ul>`:'')}
  ${box('Sakatlıklar',L.inj.length?`<ul class="v5ml">${L.inj.map(x=>`<li><i>✚</i><span>${esc(x)}</span></li>`).join('')}</ul>${L.inj1?`<p class="muted">Şu an: ${esc(L.inj1)}</p>`:''}`:'<p class="muted">Yeni sakatlık haberi yok.</p>')}
  ${box('Transferler',(L.tin.length||L.tout.length||L.trm.length)?`${L.tin.length?`<p><b class="v5up">Gelenler:</b> ${L.tin.map(esc).join(', ')}</p>`:''}${L.tout.length?`<p><b class="v5dn">Gidenler:</b> ${L.tout.map(esc).join(', ')}</p>`:''}${L.trm.length?`<ul class="v5ml">${L.trm.map(x=>`<li><i>⇄</i><span>${esc(x)}</span></li>`).join('')}</ul>`:''}`:'<p class="muted">Transfer hareketi yok.</p>')}
  ${box('Finans ve gelişim',fin?`<ul class="v5fl">${fin}</ul>`:'')}
  ${box('Gelen kutusundan öne çıkanlar',L.hl.length?`<ul class="v5ml">${L.hl.map(m=>`<li><i>${esc((V165_MT[m.t]||'•').slice(0,1))}</i><div><b>${esc(m.ti)}</b><small>${esc(V165_MT[m.t]||'')}${m.b?' · '+esc(m.b.slice(0,110)):''}</small></div></li>`).join('')}</ul><button class="btn" data-act="tab" data-tab="inbox" style="width:100%">Gelen kutusuna git</button>`:'')}
  <section class="panel"><div class="day-ctas"><button class="cta" data-act="tab" data-tab="hub"><span>Ana sayfa</span></button><button class="btn" data-act="tab" data-tab="cal">Takvim</button></div></section>`;}

/* ---------- kariyer anları (ileriye dönük) ve sezon özeti kaydı ---------- */
function v165Tick(){if(!G||!G.s||!G.p||G.phase==='tryout'||!G.s.cal)return;const V=v165(),s=G.s,K=v165Kind();let ref=false;try{ref=isRef();}catch(e){}
  if(!V.ss0||V.ss0.y!==s.year){if(G.phase==='season')V.ss0={y:s.year,ovr:K==='pl'?OVR():null,mv:K==='pl'?(()=>{try{return marketValue();}catch(e){return null;}})():null,bud:G.m&&G.m.budget!=null?G.m.budget:null,rep:G.m&&G.m.rep!=null?G.m.rep:(G.job&&G.job.rep!=null?Math.round(G.job.rep):null),club:G.club,lg:s.league};}
  /* yükselme / düşme */
  if(V.lg&&V.lg.c===G.club&&V.lg.l!==s.league&&V.lg.y!==s.year&&LEAGUES[V.lg.l]&&LEAGUES[s.league]&&!ref){const a=LEAGUES[V.lg.l].tier||0,b=LEAGUES[s.league].tier||0;if(b>a)msAdd(`${myClub().name} ile ${LEAGUES[s.league].name}’e yükseldi`,'up');else if(b<a)msAdd(`${myClub().name} ile ${LEAGUES[s.league].name}’e düştü`,'down');}
  V.lg={c:G.club,l:s.league,y:s.year};
  /* maç sonuçları */
  const rk=s.year*1000+(s.results||[]).length+(ref?((G.job||{}).rn||0)*7:0);
  if(V.rk!==rk){V.rk=rk;V.rec=V.rec||{bw:0,bl:0,w:0};
    if(ref){const L=((G.job||{}).rlog)||[];if(L.length&&!V.rec.ref1){V.rec.ref1=1;msAdd('İlk maçını yönetti','ref');}const best=L.reduce((m,x)=>Math.max(m,x.rt||0),0);if(best>=9&&!V.rec.ref9){V.rec.ref9=1;msAdd(`Kariyer zirvesi: ${dec(best,1)} gözlemci notu`,'rec');}}
    else{const rd=s.results.length?s.results[s.results.length-1]:null,r=rd&&rd.find(x=>x[0]===G.club||x[1]===G.club),key=s.year+':'+s.results.length;
      if(r&&V.rec.k!==key){V.rec.k=key;const home=r[0]===G.club,us=home?r[2]:r[3],th=home?r[3]:r[2],o=CLUBS[home?r[1]:r[0]],on=o?o.name:'rakip',mg=us-th;
        const played=K!=='pl'||(s.stats&&s.stats.apps>(V.rec.ap||0));if(K==='pl')V.rec.ap=s.stats?s.stats.apps:0;
        if(played&&!V.rec.m1&&K==='mgr'){V.rec.m1=1;msAdd(`${G.m&&G.m.role&&G.m.role!=='td'?'Görevdeki ilk maç':'Teknik direktör olarak ilk maç'}: ${us}-${th} ${on}`,'td');}
        if(played&&mg>0&&!V.rec.w1){V.rec.w1=1;msAdd(`İlk galibiyet: ${us}-${th} ${on}${K==='pl'?' (sahadaydın)':''}`,'win');}
        if(played&&mg>=3&&mg>V.rec.bw){V.rec.bw=mg;msAdd(`Kariyerin en farklı galibiyeti: ${us}-${th} ${on}`,'big');}
        if(played&&mg<=-4&&-mg>V.rec.bl){V.rec.bl=-mg;msAdd(`Ağır yenilgi: ${us}-${th} ${on}`,'loss');}
        if(K==='mgr'&&G.mt){const n=(G.mt.w||0)+(G.mt.d||0)+(G.mt.l||0)+s.results.length;for(const t of [50,100,200,300,500])if(n>=t&&!(V.rec['n'+t])){V.rec['n'+t]=1;if(n===t)msAdd(`${t}. maçına çıktı (${v165ProfN().toLocaleLowerCase('tr-TR')})`,'apps');}}}}}
  /* sezon sonu özeti */
  if(G.phase==='off'&&s.results&&s.results.length&&!V.sz[s.year]){try{V.sz[s.year]=v165Recap();if(HOL5.on&&HOL5.szY)HOL5.szY.push(s.year);V.szNew=s.year;
      const ys=Object.keys(V.sz).map(Number).sort((a,b)=>a-b);while(ys.length>25)delete V.sz[ys.shift()];}catch(e){console.warn('v165 özet',e);}}}
function v165Recap(){const s=G.s,K=v165Kind(),yl=seasonLabel(s.year),T=(()=>{try{return table();}catch(e){return [];}})(),me=T.find(r=>r.id===G.club)||{},pos=T.indexOf(me)+1;let ref=false;try{ref=isRef();}catch(e){}
  const form=[],res=[];(s.results||[]).forEach((rd,w)=>{const r=rd&&rd.find(x=>x[0]===G.club||x[1]===G.club);if(!r)return;const home=r[0]===G.club,us=home?r[2]:r[3],th=home?r[3]:r[2];form.push(us>th?'w':us===th?'d':'l');res.push([us,th,home?r[1]:r[0],w+1]);});
  const bw=res.filter(r=>r[0]>r[1]).sort((a,b)=>(b[0]-b[1])-(a[0]-a[1])||b[0]-a[0])[0],bl=res.filter(r=>r[0]<r[1]).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
  let run=0,best=0;for(const f of form){run=f==='w'?run+1:0;best=Math.max(best,run);}let un=0,bu=0;for(const f of form){un=f!=='l'?un+1:0;bu=Math.max(bu,un);}
  const cups=[];try{for(const c of cupsOf().list){const R=c.res||[];if(!R.length&&c.alive)continue;cups.push({n:c.name,r:c.won?'Şampiyon':c.alive?'Devam':(c.rounds[c.cur]?`${c.rounds[c.cur].n||'tur'}da elendi`:'Elendi'),w:!!c.won});}}catch(e){}
  const trs=(G.trophies||[]).filter(t=>t.year===yl).map(t=>t.name);
  const sc=Object.values(s.ps||{}).filter(p=>p.c===G.club).sort((a,b)=>((b.g||0)*3+(b.a||0)*2)-((a.g||0)*3+(a.a||0)*2)).slice(0,3).map(p=>({n:p.n,g:p.g||0,a:p.a||0}));
  const ms=(G.ms||[]).filter(m=>m.y===yl).slice(-8).map(m=>({t:m.t,ic:m.ic}));
  const V=v165(),s0=V.ss0&&V.ss0.y===s.year?V.ss0:{};const R={y:s.year,yl,prof:v165Prof(),pn:v165ProfN(),kind:K,ref,name:(G.p&&G.p.name)||'',club:G.club,lg:s.league,lgn:curLeague().name,pos,n:T.length,row:{o:me.o||0,g:me.g||0,b:me.b||0,m:me.m||0,a:me.a||0,y:me.y||0,p:me.p||0},form:form.slice(-10).join(''),bw:bw?[bw[0],bw[1],bw[2],bw[3]]:null,bl:bl?[bl[0],bl[1],bl[2],bl[3]]:null,run:best,un:bu,cups,trs,sc,ms,age:G.p?G.p.age:0};
  if(ref){R.bw=R.bl=null;R.run=R.un=0;R.cups=[];R.sc=[];R.form='';}
  if(K==='pl'){const st=s.stats||{},sm=G.summary&&G.summary.yl===yl?G.summary:null;R.me=sm&&(sm.apps||!st.apps)?{ap:sm.apps||0,g:sm.goals||0,as:sm.assists||0,avg:sm.avg?Math.round(sm.avg*100)/100:0}:{ap:st.apps||0,g:st.goals||0,as:st.assists||0,avg:st.apps?Math.round(st.rsum/st.apps*100)/100:0};Object.assign(R.me,{yc:G.p.yellows||0,ovr:OVR(),ovr0:s0.ovr,mv:(()=>{try{return marketValue();}catch(e){return null;}})(),mv0:s0.mv,caps:G.p.caps||0,aw:sm?sm.awards||[]:[]});}
  else if(K==='mgr'){const m=G.m||{},st=m.st||{};R.me={w:st.w||0,d:st.d||0,l:st.l||0,gf:st.gf||0,ga:st.ga||0,rep:m.rep,rep0:s0.rep,conf:m.conf,bud:m.budget,bud0:s0.bud,role:m.role||'td',sacked:!!m.sacked};R.obj=m.obj?{t:m.obj.txt,ok:pos>0&&pos<=m.obj.pos}:null;}
  else{const j=G.job||{};R.me={title:j.title||'',rep:Math.round(j.rep||0),rep0:s0.rep,lvl:j.lvl||0};
    if(ref){const L=(j.rlog||[]).filter(x=>x.y===yl);R.me.rn=L.length;R.me.avg=L.length?Math.round(L.reduce((a,x)=>a+x.rt,0)/L.length*10)/10:0;R.me.best=L.reduce((a,x)=>Math.max(a,x.rt),0);R.me.good=L.filter(x=>x.rt>=8.3).length;R.me.bad=L.filter(x=>x.rt<7).length;}
    else if(G.staff==='yrd'){R.me.pts=j.pts||0;R.me.tr=Math.round(j.tr||0);}else if(G.staff==='scout'){R.me.hits=j.hits||0;R.me.reps=j.repsN||0;R.me.rq=j.rqOk||0;}else{R.me.ok=j.correct||0;R.me.bad=j.wrong||0;R.me.heal=j.healed||0;R.me.re=j.reinj||0;}}
  /* sezon rekoru (futbolcu): kariyerin en golcü sezonu */
  try{if(K==='pl'&&R.me.g>=5){const prev=(G.history||[]).filter(h=>h.year!==yl&&h.pos!=='TD'&&h.pos!=='ST').reduce((a,h)=>Math.max(a,h.goals||0),0);if(R.me.g>prev&&prev>0)msAdd(`Kariyer rekoru: bir sezonda ${R.me.g} gol`,'rec');}}catch(e){}
  R.tgt=v165Targets(R);return R;}
function v165Targets(R){const t=[],p=R.pos,n=R.n||18;
  if(p>1&&!R.ref){const g=p<=3?1:p<=6?Math.max(1,p-2):p>n-4?n-4:Math.max(1,p-3);t.push(g===1?'Şampiyonluk için yarış':`Ligi ilk ${g} içinde bitir`);}else if(p===1&&!R.ref)t.push('Şampiyonluğu koru');
  if(R.cups&&R.cups.length&&!R.cups.some(c=>c.w))t.push('Kupada bir tur daha ileri git');
  if(R.kind==='pl'){const m=R.me;t.push(m.ap<Math.max(8,R.row.o*0.5)?`En az ${Math.max(10,Math.round(R.row.o*0.6))} maçta forma giy`:`${Math.max(m.g+2,Math.round(m.g*1.25))} gole ulaş`);if(m.avg&&m.avg<7)t.push('Sezon ortalamanı 7,0’ın üstüne çıkar');}
  else if(R.kind==='mgr'){if(R.obj&&!R.obj.ok)t.push('Yönetimin sezon hedefini tuttur');if(R.row.y>R.row.o*1.4)t.push('Savunmayı sağlamlaştır: yenilen golü azalt');else t.push('Gol yollarını artır');}
  else if(R.ref)t.push(R.me.avg<8.3?'Gözlemci not ortalamasını 8,3’ün üstüne çıkar':'Üst lig/FIFA kokartı için istikrarı sürdür');
  else t.push('İtibarını artırıp bir üst unvana yüksel');
  return t.slice(0,4);}

/* ---------- sezon özeti ekranı (paylaşılabilir kart) ---------- */
let V165SZ=null;
function v165SzCard(R){const c=CLUBS[R.club]||myClub(),L=LEAGUES[R.lg]||{},st=(v,l,x)=>`<div><b>${v}</b><span>${l}</span>${x?`<em>${x}</em>`:''}</div>`,dl=(a,b,f)=>a==null||b==null?'':(b-a>0?`<i class="v5up">+${f?f(b-a):b-a}</i>`:b-a<0?`<i class="v5dn">−${f?f(a-b):a-b}</i>`:'');
  const m=R.me||{};let big='';
  if(R.kind==='pl')big=st(m.ap,'Maç')+st(m.g,'Gol')+st(m.as,'Asist')+st(m.avg?dec(m.avg,2):'—','Ortalama')+st(m.ovr,'Güç',dl(m.ovr0,m.ovr))+st(m.mv!=null?eur(m.mv):'—','Değer',m.mv0!=null&&m.mv!=null?dl(m.mv0,m.mv,v=>eur(v)):'');
  else if(R.kind==='mgr')big=st(R.pos?R.pos+'.':'—','Sıra')+st(`${m.w}-${m.d}-${m.l}`,'G-B-M')+st(`${m.gf}:${m.ga}`,'Gol')+st(R.row.p,'Puan')+st(m.rep!=null?Math.round(m.rep):'—','İtibar',dl(m.rep0,m.rep))+st(m.conf!=null?Math.round(m.conf):'—','Yönetim güveni');
  else if(R.ref)big=st(m.rn,'Maç')+st(m.avg?dec(m.avg,1):'—','Not ort.')+st(m.best?dec(m.best,1):'—','En iyi')+st(m.good,'Başarılı')+st(m.bad,'Tartışmalı')+st(m.rep,'İtibar',dl(m.rep0,m.rep));
  else big=st(R.pos?R.pos+'.':'—','Takım sırası')+(m.pts!=null?st(m.pts,'Katkı puanı')+st(m.tr,'Hoca güveni'):m.hits!=null?st(m.hits,'İsabetli rapor')+st(m.reps,'Rapor')+st(m.rq,'Talep karşılandı'):st(m.ok,'Doğru teşhis')+st(m.heal,'İyileşen')+st(m.re,'Nüks'))+st(m.rep,'İtibar',dl(m.rep0,m.rep));
  const fm=(R.form||'').split('').map(k=>`<i class="f-${k}">${k==='w'?'G':k==='d'?'B':'M'}</i>`).join('');
  const mom=[R.bw?`<li><i>⬆</i><span>En farklı galibiyet</span><b>${R.bw[0]}-${R.bw[1]} ${esc(CLUBS[R.bw[2]]?CLUBS[R.bw[2]].short:'')}</b></li>`:'',R.bl?`<li><i>⬇</i><span>En ağır yenilgi</span><b>${R.bl[0]}-${R.bl[1]} ${esc(CLUBS[R.bl[2]]?CLUBS[R.bl[2]].short:'')}</b></li>`:'',R.run>=2?`<li><i>🔥</i><span>En uzun galibiyet serisi</span><b>${R.run} maç</b></li>`:'',R.un>=4?`<li><i>🛡</i><span>Yenilgisiz seri</span><b>${R.un} maç</b></li>`:'',...(R.ms||[]).filter(x=>!/^(İlk|Kariyerin en farklı|Ağır)/.test(x.t)||true).slice(0,4).map(x=>`<li><i>${MS_IC[x.ic]||'•'}</i><span>${esc(x.t)}</span></li>`)].join('');
  const aw=[...(R.trs||[]),...(m.aw||[]).filter(a=>!(R.trs||[]).includes(a))];
  return `<article class="v5sz" style="--c1:${c.c1||'#1d5c3a'};--c2:${c.c2||'#fff'}">
    <header><div class="v5szc">${R.ref?'<b style="font-size:30px">⚖</b>':crestSVG(c,54)}</div><div><p class="kicker">Futbol Kariyeri · ${esc(R.yl)} sezon özeti</p><h3>${esc(R.name)}</h3><small>${esc(R.ref?(m.title||'Hakem'):R.kind==='staff'?(m.title||R.pn):R.pn)} · ${esc(R.ref?(L.name||R.lgn):c.name)}${R.ref?'':' · '+esc(R.lgn)} · ${R.age} yaş</small></div></header>
    ${R.ref?'':`<div class="v5szp"><b>${R.pos||'—'}.</b><span>${esc(L.short||'')} sırası${R.n?' / '+R.n:''}</span><span class="r">${R.row.g}G ${R.row.b}B ${R.row.m}M · ${R.row.a}:${R.row.y} · ${R.row.p} puan</span></div><div class="st-form">${fm}</div>`}
    <div class="v5szs">${big}</div>
    ${aw.length?`<div class="v5szt"><p>🏆 Kupalar ve ödüller</p><ul>${aw.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`:''}
    ${R.cups&&R.cups.length?`<div class="v5szk">${R.cups.map(k=>`<span class="${k.w?'w':''}"><b>${esc(k.n)}</b>${esc(k.r)}</span>`).join('')}</div>`:''}
    ${mom?`<div class="v5szm"><p>Sezonun anları</p><ul>${mom}</ul></div>`:''}
    ${R.sc&&R.sc.length&&!R.ref?`<div class="v5szb"><p>Takımın yıldızları</p><ol>${R.sc.map(p=>`<li><b>${esc(p.n)}</b><span>${p.g} gol · ${p.a} asist</span></li>`).join('')}</ol></div>`:''}
    ${R.obj?`<div class="v5szo ${R.obj.ok?'ok':'no'}"><span>Yönetim hedefi</span><b>${esc(R.obj.t)}</b><em>${R.obj.ok?'✓ Başarıldı':'✗ Tutturulamadı'}</em></div>`:''}
    ${R.tgt&&R.tgt.length?`<div class="v5szn"><p>Gelecek sezon hedefleri</p><ul>${R.tgt.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    <footer>${esc(R.name)} · ${esc(R.yl)}</footer></article>`;}
function v165ViewSz(){const V=v165(),ys=Object.keys(V.sz).map(Number).sort((a,b)=>b-a);if(!ys.length)return `<h2 class="h">Sezon özeti</h2><section class="panel"><p class="muted">İlk sezonun bitince özet kartın burada olacak.</p></section>`;
  const y=V165SZ!=null&&V.sz[V165SZ]?V165SZ:ys[0];const R=V.sz[y];
  return `<h2 class="h">Sezon özeti</h2>${ys.length>1?`<div class="v5szy">${ys.map(k=>`<button class="chip${k===y?' on':''}" data-act="v165Sz" data-y="${k}">${seasonLabel(k)}</button>`).join('')}</div>`:''}${v165SzCard(R)}
   <section class="panel"><p class="muted">Kartın ekran görüntüsünü alıp paylaşabilirsin.</p><div class="day-ctas"><button class="btn" data-act="tab" data-tab="zaman">Zaman çizelgesi</button><button class="btn" data-act="tab" data-tab="hub">Ana sayfa</button></div></section>`;}
ACTX.v165Sz=el=>{V165SZ=+el.dataset.y;const m=$('#modal');if(m&&!m.hidden)closeModal();TAB='sezon';const V=v165();if(V.szNew===V165SZ)V.szNew=null;render();window.scrollTo(0,0);};

/* ---------- kariyer zaman çizelgesi ---------- */
const V165_TC={start:'s',td:'s',sign:'s',tr:'t',loan:'t',cup:'c',apps:'a',goal:'g',nat:'n',capt:'a',inj:'i',end:'x',win:'g',big:'g',loss:'i',up:'c',down:'i',rec:'c',ref:'s',hol:'a'};
function v165ViewTl(){const V=v165(),ms=(G.ms||[]).slice(),hs=(G.history||[]).slice(),K=v165Kind(),c=myClub();
  const yrs=[];const addY=y=>{if(y&&!yrs.includes(y))yrs.push(y);};hs.forEach(h=>addY(h.year));ms.forEach(m=>addY(m.y));Object.keys(V.sz).forEach(y=>addY(seasonLabel(+y)));if(G.s)addY(seasonLabel(G.s.year));
  yrs.sort((a,b)=>String(a).localeCompare(String(b),'tr'));
  const tot=G.totals||{},nTr=(G.trophies||[]).length;
  const head=`<section class="panel v5tlh"><div>${crestSVG(c,46)}</div><div><p class="kicker">${esc(v165ProfN())}</p><h3>${esc((G.p&&G.p.name)||'')}</h3><small>${yrs.length} sezon · ${ms.length} an · ${nTr} kupa/ödül${K==='pl'&&tot.apps?` · ${tot.apps} maç, ${tot.goals||0} gol`:''}${K==='mgr'&&G.mt?` · ${G.mt.w}G ${G.mt.d}B ${G.mt.l}M`:''}</small></div></section>`;
  const body=yrs.slice().reverse().map(y=>{const H=hs.filter(h=>h.year===y),M=ms.filter(m=>m.y===y),yr=Object.keys(V.sz).map(Number).find(k=>seasonLabel(k)===y);
    const sc=H.map(h=>{const cl=CLUBS[h.club];return `<div class="v5tls">${cl?crestSVG(cl,22):''}<b>${esc(cl?cl.name:'')}</b><small>${esc(LEAGUES[h.league]?LEAGUES[h.league].short:'')}${h.pos==='TD'?` · ${h.apps} maç · ${h.goals}:${h.assists}`:h.pos==='ST'?'':` · ${h.apps} maç · ${h.goals} gol · ${h.assists} asist${h.pos&&+h.pos?` · ${h.pos}. sıra`:''}`}</small></div>`;}).join('');
    return `<li class="v5tly"><p class="v5tlyl"><b>${esc(y)}</b>${yr!=null?`<button class="btn sm" data-act="v165Sz" data-y="${yr}">📊 Sezon özeti</button>`:''}</p>${sc}${!sc&&!M.length?'<p class="muted" style="margin:0 0 4px;font-size:12px">Sezon sürüyor.</p>':''}${M.length?`<ul>${M.map(m=>`<li class="v5tlm ${V165_TC[m.ic]||'a'}"><i>${MS_IC[m.ic]||'•'}</i><div><b>${esc(m.t)}</b><small>${m.a!=null?m.a+' yaş':''}</small></div></li>`).join('')}</ul>`:''}</li>`;}).join('');
  return `<h2 class="h">Kariyer zaman çizelgesi</h2>${head}<section class="panel"><ol class="v5tl">${body||'<li class="muted">Oynadıkça kariyerinin önemli anları burada birikecek.</li>'}</ol></section>`;}
/* görünümler */
const V165_V={tatil:v165ViewHol,zaman:v165ViewTl,sezon:v165ViewSz};
viewLife2=(old=>function(){if(G&&V165_V[TAB]){try{return V165_V[TAB]();}catch(e){console.warn('v165 görünüm',e);return `<section class="panel"><p class="muted">Sayfa açılamadı.</p></section>`;}}return old.apply(this,arguments);})(viewLife2);
navCats=(old=>function(){const C=old.apply(this,arguments);try{const k=C.find(x=>x[0]==='Kariyer');if(k)k[1].splice(1,0,['zaman','Zaman çizelgesi',{tab:'zaman'}],['sezon','Sezon özetleri',{tab:'sezon'}]);}catch(e){}return C;})(navCats);
Object.assign(NICON,{zaman:NI('<path d="M12 3v18"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M14 7h6M4 17h6"/>'),sezon:NI('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 15v-3M12 15V8M16 15v-5"/>')});
viewCareer=(old=>function(){const h=old.apply(this,arguments);try{if(!G||G.phase==='tryout')return h;const V=v165(),n=Object.keys(V.sz).length;
    return `<section class="panel v5cr"><button class="btn" data-act="tab" data-tab="zaman">🕑 Kariyer zaman çizelgesi</button>${n?`<button class="btn" data-act="tab" data-tab="sezon">📊 Sezon özetleri (${n})</button>`:''}</section>`+h;}catch(e){return h;}})(viewCareer);
/* yaz arasında ana sayfada: sezon özeti hazır */
viewHub=(old=>function(){const h=old.apply(this,arguments);try{if(G&&G.phase==='off'&&!HOL5.on){const V=v165();if(V.sz[G.s.year])return `<button class="v5szban" data-act="v165Sz" data-y="${G.s.year}"><b>📊 ${seasonLabel(G.s.year)} sezon özeti hazır</b><small>İstatistikler, en iyi anlar, kupalar ve gelecek sezon hedefleri</small></button>`+h;}}catch(e){}return h;})(viewHub);
