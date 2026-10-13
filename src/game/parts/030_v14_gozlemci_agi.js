/* ================= v14: gözlemci ağı ================= */
const NETL=[{n:'Yerel ağ',d:'Kulübünün ligi ve komşu ligler',srch:2,res:4},{n:'Bölgesel ağ',d:'Ülkendeki tüm profesyonel ligler',srch:3,res:6},
  {n:'Ulusal ağ',d:'Ülken ve Avrupa’nın üçüncü ligleri',srch:4,res:8},{n:'Kıta ağı',d:'Avrupa’nın ikinci ligleri de ağda',srch:5,res:10},{n:'Küresel ağ',d:'Avrupa’nın tüm ligleri, en üst seviye dahil',srch:7,res:12}];
const NET_XP=[0,30,80,160,280],NET_FLT={pos:1,age:2,ovr:3,val:4,pot:4,lg:1},SUB_NM=['Hakan Öz','Murat Kılınç','Serkan Aydın','Levent Ateş','Tolga Yurt','Ozan Er','Diego Ruiz','Marco Bellini','Jonas Weber','Luc Moreau','Tom Harris','Pablo Ortega'];
let SCT='ag';
function scNet(){const j=jobInit();j.net=j.net||{lv:1,xp:0};j.subs=j.subs||[];j.res=j.res||[];j.rq=j.rq||[];j.inbox=j.inbox||[];j.flt=j.flt||{pos:'',age:0,ovr:0,val:0,pot:0,lg:''};return j.net;}
const netCap=()=>Math.min(5,jobInit().lvl+2);
function netXP(n){const N=scNet();N.xp+=n*(UP('sc_rehber')?1.3:1);while(N.lv<5&&N.xp>=NET_XP[N.lv]&&N.lv<netCap()){N.lv++;const L=NETL[N.lv-1];msg('scout','Gözlem ağın büyüdü',`Ağın artık “${L.n}”: ${L.d}. Raporların daha net, haftada ${L.srch} arama yapabilir ve aramada ${L.res} oyuncu görebilirsin.${N.lv>=2?' Ağına bölge gözlemcisi ekleyebilirsin.':''}`);}if(N.lv<5&&N.lv>=netCap())N.xp=Math.min(N.xp,NET_XP[N.lv]);}
function netLeagues(lv){lv=lv||scNet().lv;const L0=curLeague(),cc=L0.cc,t=L0.tier;
  return Object.keys(LEAGUES).filter(l=>{const L=LEAGUES[l];if(L.youth)return false;if(L.cc===cc)return lv>=2||Math.abs(L.tier-t)<=1;return (lv>=3&&L.tier<=7)||(lv>=4&&L.tier<=8)||lv>=5;});}
function scLeagues(){return netLeagues();}
const scCid=p=>(G.tx&&G.tx[p.k])||p.home;
function scAcc(p){if(scCid(p)===G.club)return 5;const j=jobInit();return clamp((j.kn[p.k]||0)+scNet().lv-1,0,5);}
function scRange(p,kind){const acc=scAcc(p),tv=kind==='o'?p.ovr:potOf(p),w=(kind==='o'?[16,12,8,5,2,0]:[20,14,10,6,3,1])[acc],off=Math.floor(srng(p.k+kind+acc)()*(w+1));let lo=tv-off,hi=lo+w;if(hi>99){lo-=hi-99;hi=99;}return [Math.max(25,lo),hi];}
function scKnowRange(p){return scRange(p,'p');}
const scOn=c=>isStaff()&&G.staff==='scout'&&c&&c.id!==G.club;
function scO(p,c){if(!scOn(c))return p.ovr;const [a,b]=scRange(p,'o');return a===b?a:`${a}-${b}`;}
function scAttr(p,c,v,i){if(!scOn(c))return v;const acc=scAcc(p);if(acc<=1)return '??';const w=[0,0,10,6,3,0][acc];if(!w)return v;const off=Math.floor(srng(p.k+'at'+i+acc)()*(w+1));return `${v-off}-${v-off+w}`;}
function knDots(acc){return `<span class="kn" title="Bilgi seviyesi">${'●'.repeat(acc)}${'○'.repeat(5-acc)}</span>`;}
function scVideo(k){const j=jobInit();if(j.vday===G.s.day&&(!UP('sc_tablet')||(j.vn||0)>=2))return toast('Bugün video analiz hakkın doldu');if(j.vday!==G.s.day){j.vday=G.s.day;j.vn=0;}j.vn=(j.vn||0)+1;j.kn[k]=Math.min(4,(j.kn[k]||0)+(UP('sc_veri')?2:1));netXP(1);toast('Rapor netleşti');save();render();}
function scReveal(lid,n){const j=jobInit(),t=j.task,N=scNet();const pool=[];for(const c of leagueClubs(lid))if(c.id!==G.club)for(const p of squadOf(c.id))pool.push(Object.assign({},p,{club:c.id}));
  pool.sort((a,b)=>((t&&a.pos===t.pos?8:0)+potOf(a)-a.age*0.4)<((t&&b.pos===t.pos?8:0)+potOf(b)-b.age*0.4)?1:-1);const got=pool.slice(0,12).sort(()=>Math.random()-0.5).slice(0,n+(N.lv>=3?1:0)+(UP('sc_durbun')?1:0)+(UP('sc_arac')&&LEAGUES[lid].cc===curLeague().cc?1:0));
  for(const p of got){j.kn[p.k]=Math.min(4,(j.kn[p.k]||0)+1+(UP('sc_kamera')?1:0)+(UP('sc_dil')&&LEAGUES[lid].cc!==curLeague().cc?1:0));if(!j.short.includes(p.k))j.short.unshift(p.k);}if(j.short.length>25)j.short.length=25;netXP(5);
  msg('scout','Gözlem dönüşü',`${LEAGUES[lid].short} turunda ${got.map(p=>`${p.name} (${CLUBS[p.club].short}, ${p.age})`).join(', ')} dikkatini çekti. Gözlem listene eklendiler.`);}
/* arama */
function scSearchLeft(){const j=jobInit(),wk=G.s.year*100+G.s.week;if(j.sw!==wk){j.sw=wk;j.su=0;}return NETL[scNet().lv-1].srch+(UP('sc_veri')?1:0)-(j.su||0);}
function scSearch(){const j=jobInit(),N=scNet(),f=j.flt,lv=N.lv;if(scSearchLeft()<=0)return toast('Bu haftaki arama hakkın doldu');
  const all=netLeagues(),lgs=f.lg&&all.includes(f.lg)?[f.lg]:all,nz=[9,7,5,3,1][lv-1],R=srng('srch'+G.s.day+(j.su||0)),pool=[];
  for(const lid of lgs)for(const c of leagueClubs(lid)){if(c.id===G.club)continue;for(const p of squadOf(c.id)){
    if(f.pos&&p.pos!==f.pos)continue;if(lv>=2&&f.age&&p.age>f.age)continue;if(lv>=3&&f.ovr&&p.ovr+(R()*2-1)*nz<f.ovr)continue;
    if(lv>=4&&f.val&&pValue(p)>f.val)continue;const pt=potOf(p);if(lv>=4&&f.pot&&pt+(R()*2-1)*nz<f.pot)continue;
    pool.push({k:p.k,s:(lv/5)*(pt*0.55+p.ovr*0.45)+(1-lv/5)*R()*45+R()*6});}}
  pool.sort((a,b)=>b.s-a.s);j.res=pool.slice(0,NETL[lv-1].res).map(x=>x.k);j.su=(j.su||0)+1;netXP(2);
  toast(j.res.length?`${j.res.length} oyuncu bulundu`:'Kriterlere uyan oyuncu bulunamadı');save();render();}
function scFlt(f,v){const j=jobInit();scNet();if(f==='pos'||f==='lg')j.flt[f]=j.flt[f]===v?'':v;else j.flt[f]=+v;save();render();}
function scShort(k){const j=jobInit();const i=j.short.indexOf(k);if(i>=0){j.short.splice(i,1);toast('Listeden çıkarıldı');}else{if(j.short.length>=25)return toast('Liste dolu (25)');j.short.unshift(k);toast('Gözlem listesine eklendi');}
  j.inbox=(j.inbox||[]).filter(x=>x!==k);save();render();}
/* bölge gözlemcileri */
function subMax(){return Math.max(0,scNet().lv-1);}
function subHire(){const j=jobInit();scNet();if(j.subs.length>=subMax())return toast('Ağ seviyen daha fazla gözlemciye izin vermiyor');const used=j.subs.map(s=>s.n),n=pick(SUB_NM.filter(x=>!used.includes(x)));
  const lg=netLeagues().filter(l=>!j.subs.some(s=>s.lg===l));j.subs.push({n,lg:pick(lg.length?lg:netLeagues()),q:rint(1,3),pos:''});toast(`${n} ağına katıldı`);save();render();}
function subSet(i,f,v){const j=jobInit(),s=j.subs[i];if(!s)return;if(f==='lg')s.lg=v;else if(f==='pos')s.pos=s.pos===v?'':v;else if(f==='del'){j.subs.splice(i,1);toast('Gözlemci ağdan ayrıldı');}save();render();}
function subsWeek(){const j=jobInit(),t=j.task,out=[];scNet();const cov=netLeagues();
  for(const s of j.subs){if(!cov.includes(s.lg))s.lg=pick(cov);const pos=s.pos||(t&&!t.done?t.pos:'');const pool=[];for(const c of leagueClubs(s.lg))if(c.id!==G.club)for(const p of squadOf(c.id))if(!pos||p.pos===pos)pool.push(p);
    if(!pool.length)continue;pool.sort((a,b)=>(potOf(b)+Math.random()*(14-s.q*4))-(potOf(a)+Math.random()*(14-s.q*4)));const p=pool.find(x=>!j.short.includes(x.k)&&!j.inbox.includes(x.k));if(!p)continue;
    j.kn[p.k]=Math.max(j.kn[p.k]||0,s.q>=3?2:1);j.inbox.unshift(p.k);out.push(`${s.n}: ${p.name} (${CLUBS[scCid(p)].short}, ${dpTag(p)}, ${p.age})`);}
  if(j.inbox.length>12)j.inbox.length=12;if(out.length)msg('scout','Bölge gözlemcilerinden rapor',out.join(' · '));}
/* yönetime transfer talebi */
const XI_N={KL:1,DF:4,OS:3,KN:2,FW:2};
function rqLimit(){return 3+jobInit().lvl;}
function scRequest(k){const j=jobInit();scNet();const p=pByKey(k);if(!p)return;if(scCid(p)===G.club)return toast('Oyuncu zaten kadroda');
  if(j.rq.some(r=>r.k===k&&r.st==='bekliyor'))return toast('Bu oyuncu için talebin zaten yönetimde');
  if(j.rq.filter(r=>r.st==='bekliyor').length>=2)return toast('Yönetim aynı anda en fazla iki talebi değerlendiriyor');
  if((j.rqN||0)>=rqLimit())return toast(`Bu sezonki talep hakkın doldu (${rqLimit()})`);
  if(j.rq.some(r=>r.k===k&&r.st==='red'&&r.y===seasonLabel(G.s.year)&&r.acc>=scAcc(p)))return toast('Yönetim bu oyuncuyu reddetti; raporu netleştirmeden yeniden sunamazsın');
  const [lo,hi]=scRange(p,'o'),[pl,ph]=scRange(p,'p');j.rqN=(j.rqN||0)+1;
  j.rq.unshift({k,club:scCid(p),y:seasonLabel(G.s.year),day:G.s.day,due:G.s.day+2,st:'bekliyor',est:(lo+hi)/2,estP:(pl+ph)/2,acc:scAcc(p),price:pValue(p)});if(j.rq.length>20)j.rq.length=20;
  toast('Talep yönetime iletildi · 2 gün içinde yanıt');save();render();}
function rqResolve(r){const j=jobInit(),p=pByKey(r.k);if(!p){r.st='red';r.why='oyuncu bulunamadı';return;}const cid=scCid(p),my=myClub(),B=Math.max(150000,clubBudget(my)*0.12*VALF/EUR_TL),price=pValue(p);
  if(cid===G.club){r.st='tamam';return;}
  const sq=squadOf(G.club).filter(x=>x.pos===p.pos).sort((a,b)=>b.ovr-a.ovr),nth=(sq[XI_N[p.pos]-1]||sq[sq.length-1]||{ovr:0}).ovr,gain=r.est-nth,young=p.age<=21&&r.estP>=my.str+3;
  const no=why=>{r.st='red';r.why=why;j.rep=clamp(j.rep-1,0,100);msg('board','Transfer talebin reddedildi',`${p.name}: ${why}.`);};
  if(price>B)return no(`bonservis (${eur(price)}) transfer bütçemizi (${eur(Math.round(B/1e4)*1e4)}) aşıyor`);
  if(r.acc<2&&Math.random()<0.65)return no('raporun çok belirsiz, oyuncuyu daha yakından izlemeni istiyoruz');
  if(gain<-3&&!young)return no(`kadroya katkı görünmüyor; bu mevkide ${nth} civarı oyuncularımız var`);
  const ch=clamp(0.45+j.rep/250+gain*0.03+(p.age<=23?0.08:0)-(price/B)*0.25+r.acc*0.03,0.1,0.92);
  if(Math.random()>ch)return no('yönetim kurulu şu an bu transferi öncelikli görmüyor');
  const sc=CLUBS[cid],role=squadRoles(cid)[p.k];
  if(sc.str>my.str+6&&LEAGUES[sc.league].tier>=curLeague().tier&&Math.random()<0.7){r.st='basarisiz';r.why='oyuncu daha küçük bir kulübe gelmek istemedi';msg('board','Transfer gerçekleşmedi',`Yönetim ${p.name} için onay verdi ama ${r.why}.`);return;}
  if((role==='Yıldız'||role==='Kaptan')&&Math.random()<0.5){r.st='basarisiz';r.why=`${sc.short} oyuncuyu satmaya yanaşmadı`;msg('board','Transfer gerçekleşmedi',`Yönetim ${p.name} için onay verdi ama ${r.why}.`);return;}
  G.tx=G.tx||{};G.tx[p.k]=G.club;txNote(p.k,G.club,typeof price==='number'&&price<1e10?price:undefined);syncStr(G.club);syncStr(cid);j.kn[p.k]=4;r.st='tamam';r.real=p.ovr;const diff=p.ovr-r.est;
  j.rqOk=(j.rqOk||0)+1;j.rep=clamp(j.rep+(diff>=-2?5:-3),0,100);netXP(12);
  msg('board','Transfer gerçekleşti',`Talebin kabul edildi: ${p.name} ${eur(price)} bedelle ${sc.short} kulübünden kadromuza katıldı. ${diff>=2?`Raporundan da iyi çıktı (gerçek güç ${R200(p.ovr)}); itibarın arttı.`:diff>=-2?`Raporun isabetliydi (gerçek güç ${R200(p.ovr)}).`:`Ancak raporun abartılıydı (gerçek güç ${R200(p.ovr)}); yönetim biraz hayal kırıklığında.`}`);}
function staffDay(){if(G.staff!=='scout')return;const j=jobInit();scNet();if(j.trip&&j.trip.days>0){j.trip.days--;if(j.trip.days<=0){scReveal(j.trip.lid,3);j.trip=null;}}
  const wk=G.s.year*100+G.s.week;if(j.wt!==wk){j.wt=wk;subsWeek();}for(const r of j.rq)if(r.st==='bekliyor'&&G.s.day>=r.due)rqResolve(r);}
/* kadro ihtiyacı */
function needHTML(){const sq=squadOf(G.club);return `<div class="need">${Object.keys(XI_N).map(pos=>{const ps=sq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr),n=XI_N[pos],avg=ps.slice(0,n).reduce((a,p)=>a+p.ovr,0)/Math.max(1,Math.min(n,ps.length)),d=avg-myClub().str;
  return `<div class="${d<-2?'lo':d>2?'hi':''}"><b>${pos}</b><span>${Math.round(avg)}</span><small>${ps.length} oyuncu</small></div>`;}).join('')}</div>`;}
/* oyuncu satırı */
function scRow(k,mode){const p=pByKey(k);if(!p)return '';const j=jobInit(),cid=scCid(p),[lo,hi]=scRange(p,'o'),[pl,ph]=scRange(p,'p'),acc=scAcc(p),inL=j.short.includes(k),t=j.task,pend=j.rq.some(r=>r.k===k&&r.st==='bekliyor');
  return `<div class="scrow"><button class="trrow" data-act="pcard" data-id="${cid}" data-k="${k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} · ${CLUBS[cid]?esc(CLUBS[cid].short):''} · ${eur(pValue(p))}</small></span><span class="to"><b class="${lo!==hi?'rng':''}">${potTxt(lo,hi)}</b><small>POT ${potTxt(pl,ph)}</small></span>${knDots(acc)}</button>
  <div class="sc-b">${cid===G.club?'<span class="pill good">Kadromuzda</span>':`${mode!=='list'?`<button class="btn sm" data-act="scShort" data-k="${k}">${inL?'Listeden çıkar':'Listeye ekle'}</button>`:''}${mode==='list'?`<button class="btn sm" data-act="scVid" data-k="${k}" ${acc>=5?'disabled':''}>Video analiz</button><button class="btn sm ghost" data-act="scShort" data-k="${k}">Çıkar</button>`:''}
  ${mode==='list'?(pend?'<span class="pill warn">Yönetimde</span>':`<button class="cta sm" data-act="scRq" data-k="${k}">Transfer talebi</button>`):''}${mode==='list'&&t&&!t.done&&p.pos===t.pos?`<button class="btn sm" data-act="scRep" data-k="${k}">Göreve öner</button>`:''}`}</div></div>`;}
function scHTML(){const j=jobInit(),N=scNet(),t=j.task,L=NETL[N.lv-1],nx=N.lv<5?NET_XP[N.lv]:null,cap=netCap(),left=scSearchLeft();
  const task=t?`<section class="panel"><p class="sub-h"><span>Görev</span><span>${t.done?'Tamamlandı':'Son tarih '+fmtDate(dateOf(t.due))}</span></p><div class="task"><b>${SC_POS[t.pos].toLocaleUpperCase('tr-TR')} · en fazla ${t.age} yaş · bütçe ${eur(t.bud)}</b><small>Uygun oyuncuyu bul, raporu netleştir ve gözlem listesinden “Göreve öner”.</small></div></section>`:'';
  const pct=nx?Math.min(100,Math.round((N.xp-NET_XP[N.lv-1])/(nx-NET_XP[N.lv-1])*100)):100;
  const net=`<section class="panel net-card"><div class="net-hd"><span class="net-ic">🛰️</span><div><b>${L.n}</b><small>${L.d}</small></div><em>Sv ${N.lv}/5</em></div>
   <div class="net-bar"><i style="width:${pct}%"></i></div><small class="muted">${nx?`${Math.round(N.xp)}/${nx} ağ puanı${N.lv>=cap&&N.xp>=nx?' · sonraki seviye için terfi gerekiyor':''}`:'Ağ tam kapasite'} · haftalık arama ${Math.max(0,left)}/${L.srch} · rapor netliği ${['çok düşük','düşük','orta','iyi','çok iyi'][N.lv-1]}</small>
   <div class="net-cov">${[...new Set(netLeagues().map(l=>LEAGUES[l].cc))].map(cc=>`<span>${flagImg(CC3[cc]||'TUR','fl-row')} ${netLeagues().filter(l=>LEAGUES[l].cc===cc).length}</span>`).join('')}</div></section>`;
  const tabs=`<div class="filt sc-tabs">${[['ag','Ağ'],['ara','Arama'],['liste',`Liste · ${j.short.length}`],['talep','Talepler'],['trf','Transferlerim']].map(([k,l])=>`<button class="chip" data-act="sct" data-k="${k}" aria-pressed="${SCT===k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(SCT==='ag'){const trip=j.trip?`<p class="pill warn">${LEAGUES[j.trip.lid].short} gözlemindesin · ${j.trip.days} gün</p>`:'';
    const go=`<section class="panel"><p class="sub-h"><span>Gözlem turu</span><span>${trip||'Lig seç'}</span></p><div class="filt">${netLeagues().map(l=>`<button class="chip" data-act="scGo" data-k="${l}">${flagImg(CC3[LEAGUES[l].cc]||'TUR','fl-row')} ${LEAGUES[l].short}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0">Yurt içi tur 1 gün, yurt dışı 3 gün. Döndüğünde gördüğün oyuncular listene eklenir ve ağ puanı kazanırsın.</p></section>`;
    const subs=`<section class="panel"><p class="sub-h"><span>Bölge gözlemcileri</span><span>${j.subs.length}/${subMax()}</span></p>${subMax()?'':'<p class="muted">Ağın “Bölgesel ağ” seviyesine çıkınca bölgelere gözlemci yerleştirebilirsin.</p>'}
      ${j.subs.map((s,i)=>`<div class="sub"><div class="sub-hd"><b>${esc(s.n)}</b><small>${'★'.repeat(s.q)}${'☆'.repeat(3-s.q)} · ${LEAGUES[s.lg]?esc(LEAGUES[s.lg].short):''}${s.pos?' · '+s.pos:''}</small><button class="btn sm ghost" data-act="subDel" data-i="${i}">Ayrıl</button></div>
        <div class="filt">${netLeagues().map(l=>`<button class="chip" data-act="subLg" data-i="${i}" data-k="${l}" aria-pressed="${s.lg===l}">${LEAGUES[l].short}</button>`).join('')}</div>
        <div class="filt" style="margin-top:4px">${Object.keys(SC_POS).map(k=>`<button class="chip" data-act="subPos" data-i="${i}" data-k="${k}" aria-pressed="${s.pos===k}">${k}</button>`).join('')}</div></div>`).join('')}
      ${j.subs.length<subMax()?`<button class="btn" data-act="subHire" style="width:100%;margin-top:6px">+ Gözlemci işe al</button>`:''}<p class="muted" style="margin:6px 0 0">Her gözlemci haftada bir, bölgesindeki bir oyuncuyu raporlar. Yıldızı yüksek olan daha iyi oyuncu bulur ve daha net rapor getirir.</p></section>`;
    const inbox=j.inbox.length?`<section class="panel"><p class="sub-h"><span>Ağdan gelen raporlar</span><span>${j.inbox.length}</span></p>${j.inbox.map(k=>scRow(k,'inbox')).join('')}</section>`:'';
    body=`${inbox}${go}${subs}`;}
  else if(SCT==='ara'){const f=j.flt,lv=N.lv,lock=n=>lv<n?`<small class="lock">🔒 Ağ seviyesi ${n}</small>`:'';
    const row=(lab,fk,opts,n)=>`<div class="sflt"><p class="sub-h" style="margin:8px 0 4px"><span>${lab}</span>${lock(n)}</p>${lv>=n?`<div class="filt">${opts.map(([v,l])=>`<button class="chip" data-act="scF" data-f="${fk}" data-k="${v}" aria-pressed="${String(f[fk])===String(v)}">${l}</button>`).join('')}</div>`:''}</div>`;
    body=`<section class="panel"><p class="sub-h"><span>Oyuncu arama</span><span>Bu hafta ${Math.max(0,left)}/${L.srch} hak</span></p>
      ${row('Mevki','pos',[['','Tümü'],...Object.keys(SC_POS).map(k=>[k,k])],1)}${row('Lig','lg',[['','Tüm ağ'],...netLeagues().map(l=>[l,LEAGUES[l].short])],1)}
      ${row('En fazla yaş','age',[[0,'Farketmez'],[19,'19'],[21,'21'],[23,'23'],[26,'26'],[29,'29']],2)}${row('En az güç (tahmini)','ovr',[[0,'Farketmez'],[55,'55+'],[60,'60+'],[65,'65+'],[70,'70+'],[75,'75+'],[80,'80+']],3)}
      ${row('En fazla bonservis','val',[[0,'Farketmez'],[250000,'250 B€'],[1000000,'1 M€'],[3000000,'3 M€'],[8000000,'8 M€'],[20000000,'20 M€']],4)}${row('En az potansiyel (tahmini)','pot',[[0,'Farketmez'],[70,'70+'],[75,'75+'],[80,'80+'],[85,'85+']],4)}
      <button class="cta" data-act="scSearch" style="width:100%;margin-top:10px" ${left<=0?'disabled':''}>Ağda ara · ${L.res} sonuç</button><p class="muted" style="margin:6px 0 0">Düşük seviyeli ağda sonuçlar dağınık ve güç tahminleri geniş aralıklı gelir. Ağ büyüdükçe arama hedefe yönelir ve filtreler açılır.</p></section>
      ${j.res.length?`<section class="panel"><p class="sub-h"><span>Sonuçlar</span><span>${j.res.length}</span></p>${j.res.map(k=>scRow(k,'res')).join('')}</section>`:''}`;}
  else if(SCT==='liste'){body=`<section class="panel"><p class="sub-h"><span>Kadro ihtiyacı</span><span></span></p>${needHTML()}<p class="muted" style="margin:6px 0 0">Kırmızı mevkiler takım ortalamasının altında; yönetim bu mevkilere yapılan talepleri daha sıcak karşılar.</p></section>
      <section class="panel"><p class="sub-h"><span>Gözlem listesi</span><span>Talep hakkı ${Math.max(0,rqLimit()-(j.rqN||0))}/${rqLimit()}</span></p>${j.short.map(k=>scRow(k,'list')).join('')||'<p class="muted">Liste boş. Arama yap, tura çık ya da ağdan gelen raporları listene ekle.</p>'}</section>`;}
  else{const st={bekliyor:['warn','Yönetimde'],red:['red','Reddedildi'],tamam:['good','Transfer oldu'],basarisiz:['red','Gerçekleşmedi']};
    const rq=j.rq.map(r=>{const p=pByKey(r.k);if(!p)return '';const s=st[r.st];return `<div class="rq"><div><b>${esc(p.name)}</b><small>${r.y} · ${dpTag(p)} · ${p.age} · raporun ${Math.round(r.est)}${r.real?` → gerçek ${r.real}`:''} · ${eur(r.price)}</small>${r.why?`<small class="why">${esc(r.why)}</small>`:''}</div>${r.st==='red'&&!r.push?`<button class="btn sm" data-act="scPush" data-k="${r.k}" title="Reddedilen talep için yönetime baskı yap">Baskı yap</button>`:''}<span class="pill ${s[0]}">${s[1]}</span></div>`;}).join('');
    const reps=j.reps.slice(0,10).map(r=>{const p=pByKey(r.k);return p?`<li><span>${r.y}</span><b>${esc(p.name)}</b><em class="${r.ok?'res-w':'res-l'}">${r.ok?`alındı · şimdi ${R200(p.ovr)}`:'red'}</em></li>`:'';}).join('');
    body=`<section class="panel"><p class="sub-h"><span>Transfer talepleri</span><span>${j.rqOk||0} başarılı</span></p>${rq||'<p class="muted">Henüz talep yok. Gözlem listesinden bir oyuncu için “Transfer talebi” gönder.</p>'}<p class="muted" style="margin:6px 0 0">Yönetim bütçeye, mevki ihtiyacına, raporunun netliğine ve itibarına bakar. Satıcı kulüp ya da oyuncu da hayır diyebilir.</p></section>${reps?`<section class="panel"><p class="sub-h"><span>Görev raporlarım</span></p><ul class="cupres">${reps}</ul></section>`:''}`;}
  return `${task}${net}${tabs}${body}`;}

