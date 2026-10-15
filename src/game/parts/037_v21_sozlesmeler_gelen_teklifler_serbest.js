/* ================= v21: sözleşmeler, gelen teklifler, serbest oyuncular, altyapı, basın, rakip analizi, hazırlık maçları ================= */
const VALF=1;
/* --- sözleşme yenileme --- */
const ctExpiring=p=>ctEnd(p)<=G.s.year+1;
function renewStart(k){const m=fmInit(),p=squadOf(G.club).find(x=>x.k===k);if(!p)return;m.negCd=m.negCd||{};if(m.negCd[k]&&m.negCd[k]>G.s.day)return toast(`${p.name} şu an yeni sözleşme konuşmak istemiyor`);
  const rel=relOf(p),cur=(m.ct&&m.ct[k]&&m.ct[k].role!=null)?m.ct[k].role:Math.min(3,Math.floor(wantRole(p))),I=Math.round(clamp(58+rel*0.45+(m.trq&&m.trq[k]?-30:0)+((G.qual||{}).ucl||[]).includes(G.club)*6,0,100));
  m.neg={k,from:G.club,type:'renew',st:'player',pat:5,ppat:4,A:pValue(p),R:squadRoles(G.club)[k]||'Rotasyon',I,log:[],o:{fee:0,inst:'pesin',sell:0,add:0,dur:'sezon',wp:100,opt:'yok',optP:0},c:{}};
  m.neg.log.push(['club',`${p.name} ile sözleşme yenileme görüşmesi. Mevcut sözleşmesi ${ctEnd(p)} yazında bitiyor.`]);negPlayerInit();if(m.neg.d&&m.neg.st==='player'){m.neg.d.w=rnd5(Math.max(m.neg.d.w,pWage(p,G.club)*(1.08+Math.max(0,p.ovr-myClub().str)*0.02)),100);m.neg.d.y=p.age<=24?5:p.age<=29?4:p.age<=31?3:p.age<=33?2:1;m.neg.c.y=m.neg.d.y;}negOpen();}
function contractsHTML(){const m=fmInit(),sq=squadOf(G.club).slice().sort((a,b)=>ctEnd(a)-ctEnd(b)||b.ovr-a.ovr);
  return `<section class="panel"><p class="sub-h"><span>Sözleşmeler</span><span>${sq.filter(ctExpiring).length} bitiyor</span></p><p class="muted" style="margin:0 0 8px">Sözleşmesi bu sezon biten oyuncularla yenileme yapmazsan yazın bedelsiz ayrılırlar. Maaş bütçesi ${amtFmt(wageBill()*52)} / ${amtFmt(wbudInit()*52)} yıllık. Senin imzaladığın sözleşmeler dışındaki maaşlar${wgEstTag(myClub().league)}.</p>
   ${sq.map(p=>{const e=ctEnd(p),exp=ctExpiring(p);return `<div class="ct-row${exp?' exp':''}"><span class="tp">${dpTag(p)}</span><div><b>${esc(p.name)}</b><small>${p.age} yaş · ${wgH(pWage(p,G.club))} · ${moodOf(relOf(p))[2]}</small></div><em>${e}</em>${exp||e<=G.s.year+2?`<button class="${exp?'cta':'btn'} sm" data-act="renew" data-k="${p.k}">Yenile</button>`:'<span></span>'}</div>`;}).join('')}</section>`;}
function contractsSeasonEnd(){G.tx=G.tx||{};const m=G.m,sq=squadOf(G.club),gone=[];for(const p of sq){if(!ctExpiring(p))continue;if(m.ct&&m.ct[p.k]&&m.ct[p.k].end>G.s.year+1)continue;
    const T=curLeague().tier,cands=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&Math.abs(LEAGUES[c.league].tier-T)<=1&&Math.abs(c.str-p.ovr)<8);const to=pick(cands.length?cands:Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth));
    G.tx[p.k]=to.id;txNote(p.k,to.id,-1);if(m.ct)delete m.ct[p.k];gone.push(`${p.name} → ${to.short}`);syncStr(to.id);}
  if(gone.length){syncStr(G.club);m.xi=null;msg('board','Sözleşmesi biten oyuncular ayrıldı',`Yenilenmeyen sözleşmeler nedeniyle bedelsiz ayrılanlar: ${gone.join(', ')}.`);}
  /* serbest oyuncu havuzu */
  const pool=[];for(const c of Object.values(CLUBS)){if(c.id===G.club||LEAGUES[c.league].youth)continue;const L=LEAGUES[c.league];if(Math.abs(L.tier-curLeague().tier)>2)continue;for(const p of squadOf(c.id))if(p.age>=27&&ctExpiring(p)&&hash(p.k+'fa'+G.s.year)%5===0)pool.push(p.k);}
  m.fa=shuffle(pool).slice(0,18);m.faY=G.s.year+1;}
/* --- serbest oyuncular --- */
function faStart(k){const m=fmInit(),p=pByKey(k);if(!p)return;const from=scCidM(p);if(from===G.club)return;
  m.neg={k,from,type:'free',st:'player',pat:5,ppat:4,A:pValue(p),R:'Serbest',I:interestOf(p,from,'tr')+10,log:[['club',`${p.name} sözleşmesi bittiği için serbest; bonservis ödemeden anlaşabilirsin.`]],o:{fee:0,inst:'pesin',sell:0,add:0,dur:'sezon',wp:100,opt:'yok',optP:0},c:{}};
  negPlayerInit();if(m.neg.d)m.neg.d.bon=rnd5(m.neg.d.bon*2,1000);negOpen();}
function faHTML(){const m=fmInit(),L=(m.faY===G.s.year+1||m.faY===G.s.year)?(m.fa||[]):[];
  return `<section class="panel"><p class="sub-h"><span>Serbest oyuncular</span><span>${L.length}</span></p><p class="muted" style="margin:0 0 8px">Sözleşmesi biten oyuncularla bonservis ödemeden anlaşabilirsin; daha yüksek imza parası isterler.</p>
   ${L.map(k=>{const p=pByKey(k);if(!p)return '';const cid=scCidM(p);if(cid===G.club)return '';return `<div class="ct-row"><span class="tp">${dpTag(p)}</span><div><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} yaş · eski kulübü ${CLUBS[cid]?esc(CLUBS[cid].short):''}</small></div><em class="ov">${R200(p.ovr)}</em><button class="btn sm" data-act="faGo" data-k="${k}">Görüş</button></div>`;}).join('')||'<p class="muted">Şu an serbest oyuncu yok. Liste her yaz yenilenir.</p>'}</section>`;}
/* --- gelen teklifler --- */
function bidsWeek(){const m=fmInit();m.bids=(m.bids||[]).filter(b=>b.until>G.s.day);if(!inWindow()||Math.random()>0.38||m.bids.length>=3)return;
  const sq=squadOf(G.club).filter(p=>!(m.loans&&m.loans[p.k])),me=myClub();if(sq.length<=14)return;const p=wpick(sq.map(q=>[q,Math.pow(Math.max(1,q.ovr-55),2)*(q.age<=26?1.4:1)]));
  const cands=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&c.str>=me.str-3&&c.str>=p.ovr-4&&LEAGUES[c.league].tier>=curLeague().tier-1);if(!cands.length)return;const c=pick(cands);
  const fee=rnd5(pValue(p)*rnd(0.85,1.3),stepOf(pValue(p)));m.bids.push({id:Date.now()%1e7+Math.floor(Math.random()*1000),k:p.k,club:c.id,fee,until:G.s.day+7,cnt:0});
  msg('offer',`Teklif: ${p.name}`,`${c.name}, ${p.name} için ${eur(fee)} teklif etti. Takım › Transfer › Gelen teklifler ekranından yanıtla.`);}
function bidAct(id,a){const m=G.m,b=(m.bids||[]).find(x=>x.id===+id);if(!b)return;const p=squadOf(G.club).find(x=>x.k===b.k),c=CLUBS[b.club];if(!p){m.bids=m.bids.filter(x=>x!==b);return render();}
  if(a==='ok'){G.tx=G.tx||{};const pr=b.fee*EUR_TL;m.budget+=pr*(1-((m.sellOn&&m.sellOn[b.k]&&m.sellOn[b.k].pct)||0)/100);G.tx[b.k]=c.id;txNote(b.k,c.id,b.fee);if(m.ct)delete m.ct[b.k];syncStr(G.club);syncStr(c.id);m.xi=null;m.wbud=Math.max(m.wbud||0,wageBill());
    m.bids=m.bids.filter(x=>x.k!==b.k);msg('board',`Satış: ${p.name}`,`${p.name}, ${c.name} kulübüne ${eur(b.fee)} karşılığında satıldı.`);toast(`${p.name} satıldı: ${eur(b.fee)}`);}
  else if(a==='cnt'){if(b.cnt){return toast('Kulüp ikinci karşı teklife yanıt vermiyor');}b.cnt=1;const ask=rnd5(b.fee*1.25,stepOf(b.fee));if(Math.random()<0.5){b.fee=ask;toast(`${c.short} ${eur(ask)} teklifini kabul etti, onayın bekleniyor`);}else{m.bids=m.bids.filter(x=>x!==b);toast(`${c.short} görüşmeden çekildi`);}}
  else{m.bids=m.bids.filter(x=>x!==b);const ps=persOf(p);if((ps==='Hırslı'||ps==='Asi')&&c.str>myClub().str+2){relAdd(p,-14);msg('squad',`${p.name} kızgın`,`${p.name}, ${c.name} transferinin engellenmesinden hiç memnun değil.`);}toast('Teklif reddedildi');}
  save();render();}
function bidsHTML(){const m=fmInit(),L=(m.bids||[]).filter(b=>b.until>G.s.day);
  return `<section class="panel"><p class="sub-h"><span>Gelen teklifler</span><span>${L.length}</span></p>${L.map(b=>{const p=pByKey(b.k),c=CLUBS[b.club];return p&&c?`<div class="bid"><div class="bid-hd">${crestSVG(c,30)}<div><b>${esc(p.name)}</b><small>${esc(c.name)} · ${eur(b.fee)} · değer ${eur(pValue(p))} · ${b.until-G.s.day} gün</small></div></div><div class="offer-btns"><button class="cta sm" data-act="bid" data-id="${b.id}" data-k="ok">Kabul et</button><button class="btn" data-act="bid" data-id="${b.id}" data-k="cnt">Karşı teklif (+%25)</button><button class="btn ghost" data-act="bid" data-id="${b.id}" data-k="no">Reddet</button></div></div>`:'';}).join('')||'<p class="muted">Şu an oyuncuların için teklif yok. Transfer dönemlerinde kulüpler teklif gönderir.</p>'}</section>`;}
function trTabs(){return stab('trf',[['ara','Arama',trHTML],['gel',`Gelen teklifler${(G.m.bids||[]).filter(b=>b.until>G.s.day).length?' · '+(G.m.bids||[]).filter(b=>b.until>G.s.day).length:''}`,bidsHTML],['ser','Serbest',faHTML]]);}
/* --- altyapı --- */
function youthIntake(){G.tx=G.tx||{};const m=G.m,me=myClub(),cc=curLeague().cc;const pool=[];for(const lid of ['u19','u16'])for(const c of leagueClubs(lid))for(const p of squadOf(c.id))if(scCidM(p)===c.id&&p.age>=16&&p.age<=18)pool.push(p);
  if(!pool.length)return;const g=sF('gen'),n=2+Math.round(g*2),q=t=>potOf(t)+Math.random()*(18-g*12);pool.sort((a,b)=>q(b)-q(a));const got=pool.slice(0,n);
  for(const p of got){G.tx[p.k]=G.club;txNote(p.k,G.club,typeof price==='number'&&price<1e10?price:undefined);m.ct=m.ct||{};m.ct[p.k]={w:rnd5(pWage(p,G.club)*0.6,100),end:G.s.year+3,role:0};}syncStr(G.club);m.xi=null;
  msg('squad','Altyapıdan yükselenler',`${cc==='TR'?'Altyapıdan':'Akademi anlaşmasıyla'} A takıma katılan gençler: ${got.map(p=>`${p.name} (${dpTag(p)}, ${p.age}, POT ${(r=>potTxt(r[0],r[1]))(pPot(p))})`).join(', ')}. Altyapı sorumlusunun kalitesi bu gençlerin seviyesini belirler.`);}
/* --- basın toplantısı --- */
const PRESS=[{q:o=>`${o.name} maçı öncesi: Rakibinizi nasıl değerlendiriyorsunuz?`,a:[['Saygı duyuyoruz, zor bir maç olacak',{tm:1,opp:-0.5,b:0}],['Kazanmak için sahaya çıkıyoruz, favori biziz',{tm:2,opp:1,b:1}],['Onlar bizim seviyemizde değil',{tm:3,opp:2.5,b:-1}]]},
  {q:()=>'Son haftalardaki performansınız eleştiriliyor. Ne diyorsunuz?',a:[['Eleştirileri kabul ediyorum, düzelteceğiz',{tm:1,opp:0,b:1}],['Oyuncularıma sonuna kadar güveniyorum',{tm:3,opp:0,b:0}],['Eleştirenler futboldan anlamıyor',{tm:0,opp:0,b:-3}]]},
  {q:()=>'Transfer döneminde yeni takviye yapacak mısınız?',a:[['Kadromdan memnunum',{tm:2,opp:0,b:0}],['Yönetimle görüşüyoruz',{tm:0,opp:0,b:1}],['Bu kadroyla şampiyonluk zor',{tm:-4,opp:0,b:-1}]]}];
function pressConf(opp,next){const m=G.m;if(m.pcDay===G.s.day||Math.random()>0.4){next();return;}m.pcDay=G.s.day;const Q=PRESS[Math.floor(Math.random()*PRESS.length)];
  PCN=next;PCA=Q.a;openModal(`<section class="press"><div class="pr-hd"><span class="kicker">Basın toplantısı</span><h3>Maç öncesi</h3></div><p class="pr-q">“${esc(Q.q(opp))}”</p><div class="pr-a">${Q.a.map(([t],i)=>`<button class="btn" data-act="press" data-k="${i}">${esc(t)}</button>`).join('')}</div><button class="btn ghost" data-act="press" data-k="-1">Toplantıya katılma</button></section>`);}
let PCN=null,PCA=null;
function pressAns(i){const m=G.m;closeModal();if(i>=0&&PCA){const e=PCA[i][1];for(const p of squadOf(G.club))relAdd(p,e.tm);m.conf=clamp(m.conf+e.b,0,100);m.pcOpp=e.opp;toast(e.opp>1?'Sözlerin rakibi ateşledi':e.tm>1?'Oyuncular sözlerini beğendi':'Basın toplantısı bitti');}else{m.conf=clamp(m.conf-1,0,100);m.pcOpp=0;}
  const f=PCN;PCN=null;if(f)f();}
/* --- rakip analizi --- */
function oppAnalysis(){const f=ourFixture();if(!f)return '';const opp=CLUBS[f[0]===G.club?f[1]:f[0]];if(!opp)return '';const sq=squadOf(opp.id),co=coachOf(opp.id),best=sq.slice().sort((a,b)=>b.ovr-a.ovr)[0];
  const line=pos=>{const L=sq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).slice(0,pos==='DF'?4:pos==='OS'?3:2);return L.length?L.reduce((a,p)=>a+p.ovr,0)/L.length:0;};
  const lines=[['Savunma','DF'],['Orta saha','OS'],['Kanatlar','KN'],['Hücum','FW']].map(([n,k])=>[n,line(k)]),weak=lines.slice().sort((a,b)=>a[1]-b[1])[0],d=opp.str-myClub().str;
  const plan=d>=4?'Topa sahip olup önde pres yapması bekleniyor':d<=-5?'Derinde bekleyip kontra atağa çıkması bekleniyor':'Dengeli bir oyun planı bekleniyor';
  const tip=weak[0]==='Savunma'?'Arkaya koşular ve direkt paslar etkili olabilir.':weak[0]==='Orta saha'?'Orta sahada pres yapıp topu erken kazanalım.':weak[0]==='Kanatlar'?'Hücumları kanatlara yönlendirelim.':'Savunma çizgisini yükseltmekten korkmayalım.';
  return `<section class="panel"><p class="sub-h"><span>Rakip analizi · ${esc(opp.short)}</span><span></span></p><div class="fp-row"><div><small>Diziliş</small><b>${esc(co.f||'4-4-2')}</b></div><div><small>Teknik direktör</small><b>${esc(co.n)}</b></div><div><small>Yıldız</small><b>${best?esc(ksur(best.name))+' '+R200(best.ovr):'—'}</b></div></div>
   <div class="oa-lines">${lines.map(([n,v])=>`<div><span>${n}</span><i><em style="width:${clamp((v-50)*2.2,5,100)}%"></em></i><b>${Math.round(v)||'—'}</b></div>`).join('')}</div><p class="muted" style="margin:6px 0 0">${plan}. En zayıf hattı: <b>${weak[0].toLowerCase()}</b>. ${tip}</p></section>`;}
/* --- hazırlık maçları --- */
function friendly(){const m=fmInit();if(G.phase!=='off')return;m.fr=m.fr||{y:G.s.year,n:0};if(m.fr.y!==G.s.year)m.fr={y:G.s.year,n:0};if(m.fr.n>=3)return toast('Bu yaz 3 hazırlık maçı yaptın');
  const me=myClub(),T=curLeague().tier,cands=Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&Math.abs(LEAGUES[c.league].tier-T)<=1),opp=pick(cands);const [a,b]=simPair({str:xiStr()},opp,true);
  m.fr.n++;m.fm.fam=Math.min(100,(m.fm.fam||50)+6);m.form=clamp((m.form||0)+0.3,-3,4);let inj='';if(Math.random()<0.12){const p=pick(squadOf(G.club)),w=rint(1,3);m.inj=m.inj||{};m.inj[p.k]=w;inj=` ${p.name} hafif sakatlandı (${w} hf).`;}
  msg('report',`Hazırlık maçı: ${me.short} ${a}-${b} ${opp.short}`,`Takım uyumu arttı (%${Math.round(m.fm.fam)}).${inj}`);toast(`Hazırlık maçı: ${a}-${b} ${opp.short} · uyum +6`);save();render();}
/* --- isim değiştirme --- */
function renameMe(){const el=$('#rnIn');if(!el)return;const v=el.value.trim().replace(/\s+/g,' ');if(v.length<3||v.length>28)return toast('İsim 3-28 karakter olmalı');G.p.name=v;save();closeModal();render();toast(`Artık ${v}`);}

const HOMEI='<svg class="hmi" viewBox="0 0 16 16" aria-label="İç saha" role="img"><path d="M8 1.6 1 7.4h2v6.8h3.8V10h2.4v4.2H13V7.4h2z" fill="currentColor"/></svg>';
