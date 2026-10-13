/* ================= v26: gelen tekliflerde FM tarzı derin pazarlık, tıklanabilir isimler ================= */
/* ---------- gelen teklif pazarlığı ---------- */
const BID_INST={pesin:['Peşin',1,1],y2:['2 yılda taksit',0.95,0.5],y3:['3 yılda taksit',0.92,0.34]};
function bidInit(b,p,c){if(b.max)return b;const r=srng(b.id+'bmx');r();r();const me=myClub(),hot=clamp((c.str-me.str)/10,0,1);b.max=rnd5(b.fee*(1.12+r()*0.3+hot*0.15),stepOf(b.fee));b.pat=3+Math.floor(r()*3);
  b.inst=r()<0.5?'pesin':r()<0.5?'y2':'y3';b.sell=r()<0.3?10:0;b.bon=r()<0.4?rnd5(b.fee*0.1,stepOf(b.fee)):0;b.pw=rnd5(pWage(p,c.id)*(1.1+r()*0.4),100);b.log=b.log||[[`${c.name}`,`${p.name} için ${eur(b.fee)} teklif ediyoruz.`]];b.ask={fee:b.fee,inst:b.inst,sell:b.sell,bb:0,lb:0};b.st='open';return b;}
function bidDesire(p,c){const me=myClub(),ps=persOf(p),R=squadRoles(G.club)[p.k];let d=(c.str-me.str)*0.8+(LEAGUES[c.league].tier-curLeague().tier)*4+(relOf(p)<-20?10:relOf(p)>40?-6:0)+(R==='Yedek'||R==='Rotasyon'?6:R==='Yıldız'||R==='Kaptan'?-4:0)+(ps==='Hırslı'?4:ps==='Sadık'||ps==='Profesyonel'?-2:0);
  return d>=8?[2,'Transferi çok istiyor']:d>=2?[1,'Transfere sıcak bakıyor']:d>=-4?[0,'Kararsız, kulübün kararını bekliyor']:[-1,'Kulüpte kalmak istiyor'];}
function bidOpinions(p,c,b){const sq=squadOf(G.club),xi=mgrXI(),key=xi.includes(p.k),top=sq.slice().sort((a,b2)=>b2.ovr-a.ovr).slice(0,5).some(q=>q.k===p.k),v=pValue(p),y=coachOf(G.club),
  ast=key&&top?'Kilit oyuncumuz; yerine aynı kalitede birini bulamazsak satmamalıyız.':key?'İlk 11 oyuncusu ama yerine birini bulabiliriz.':'Kadroda rotasyon oyuncusu; iyi bedel gelirse satılabilir.',
  brd=b.fee>=v*1.2?'Piyasa değerinin çok üstünde, mali açıdan çok iyi bir teklif.':b.fee>=v*0.95?'Değerine yakın, makul bir teklif.':'Piyasa değerinin altında; daha fazlasını isteyin.';return [['Yardımcı antrenör',ast],['Yönetim',brd]];}
function bidCost(a,p){const v=pValue(p);return a.fee*BID_INST[a.inst][1]+(a.sell/100)*v*0.35+(a.bb?v*0.12:0)+(a.lb?-v*0.04:0);}
function bidOpen(id){const m=fmInit(),b=(m.bids||[]).find(x=>x.id===+id);if(!b)return;const p=squadOf(G.club).find(x=>x.k===b.k),c=CLUBS[b.club];if(!p||!c){m.bids=m.bids.filter(x=>x!==b);return render();}bidInit(b,p,c);BIDO=b.id;bidModal();}
let BIDO=null;
function bidModal(){const m=G.m,b=(m.bids||[]).find(x=>x.id===BIDO);if(!b){closeModal();return;}const p=squadOf(G.club).find(x=>x.k===b.k),c=CLUBS[b.club],A=b.ask,de=bidDesire(p,c),st=stepOf(b.fee),L=lookOf(p.k,p.nat,p.age),me=myClub();
  const row=(l,v)=>`<div class="fmi"><span>${l}</span><b>${v}</b></div>`;
  const offer=`${row('Bonservis',eur(b.fee))}${row('Ödeme',BID_INST[b.inst][0])}${row('Sonraki satıştan pay',b.sell?'%'+b.sell:'Yok')}${row('Performans bonusları',b.bon?eur(b.bon):'Yok')}${row('Oyuncuya önerilen maaş',eur(b.pw)+'/hf')}`;
  const ops=bidOpinions(p,c,b).map(([w,t])=>`<p class="bo"><b>${w}:</b> ${esc(t)}</p>`).join('');
  const log=b.log.map(([w,t])=>`<p class="${w==='Sen'?'ng-me':'ng-club'}"><i>${esc(w)}</i>${esc(t)}</p>`).join('');
  let body='';
  if(b.st==='agreed')body=`<div class="ng-res ok">✔ ${esc(c.short)} şartlarınızı kabul etti</div><p class="muted">Son karar senin. Onaylarsan ${esc(p.name)} ${esc(c.name)} ile kişisel şartları görüşecek.</p><div class="offer-btns"><button class="cta" data-act="bidX" data-k="sell">Satışı onayla</button><button class="btn ghost" data-act="bidX" data-k="no">Vazgeç</button></div>`;
  else body=`<p class="ng-l">Karşı teklifin</p><div class="ng-stp"><button class="btn" data-act="bidS" data-f="fee" data-k="-1">−</button><b>${eur(A.fee)}</b><button class="btn" data-act="bidS" data-f="fee" data-k="1">+</button><small>Değer ${eur(pValue(p))} · teklif ${eur(b.fee)} (${A.fee>b.fee?'+':''}${Math.round((A.fee/b.fee-1)*100)}%)</small></div>
    <p class="ng-l">Ödeme şekli</p><div class="seg2">${Object.entries(BID_INST).map(([k,v])=>`<button class="chip" data-act="bidS" data-f="inst" data-k="${k}" aria-pressed="${A.inst===k}">${v[0]}</button>`).join('')}</div>
    <p class="ng-l">Sonraki satıştan pay</p><div class="seg2">${[0,10,20,30].map(v=>`<button class="chip" data-act="bidS" data-f="sell" data-k="${v}" aria-pressed="${A.sell===v}">${v?'%'+v:'Yok'}</button>`).join('')}</div>
    <p class="ng-l">Ek maddeler</p><div class="seg2"><button class="chip" data-act="bidS" data-f="bb" data-k="${A.bb?0:1}" aria-pressed="${!!A.bb}">Geri satın alma hakkı</button><button class="chip" data-act="bidS" data-f="lb" data-k="${A.lb?0:1}" aria-pressed="${!!A.lb}">Sezon sonuna kadar kiralık kalsın</button></div>
    <div class="ng-info"><span>Kulübün sabrı <b class="ng-pat">${'●'.repeat(b.pat)}${'○'.repeat(Math.max(0,5-b.pat))}</b></span><span>${b.until-G.s.day} gün süre</span></div>
    <button class="cta" data-act="bidX" data-k="cnt">Karşı teklifi gönder</button>
    <div class="offer-btns" style="margin-top:6px"><button class="btn" data-act="bidX" data-k="ok">Teklifi olduğu gibi kabul et</button><button class="btn" data-act="bidX" data-k="talk">Oyuncuyla konuş</button></div>
    <div class="offer-btns"><button class="btn ghost" data-act="bidX" data-k="nfs">Satılık değil</button><button class="btn ghost" data-act="bidX" data-k="no">Reddet</button></div>`;
  openModal(`<div class="ng"><p class="sub-h"><span>Gelen transfer teklifi</span><span>${crestSVG(me,18)} ${esc(me.short)}</span></p>
   <div class="ng-hd"><div class="ng-face" data-act="pcard" data-id="${G.club}" data-k="${p.k}" title="Profili aç">${faceSVG(L,{c1:me.c1,c2:me.c2,num:p.num})}</div><div class="ng-id"><b><span class="plink" data-act="pcard" data-id="${G.club}" data-k="${p.k}">${esc(p.name)}</span></b><small>${POS_TR[p.pos]} · ${p.age} yaş · ${esc(persOf(p))}</small><small>${crestSVG(c,14)} ${esc(c.name)} · ${LEAGUES[c.league].short}</small></div><div class="ng-ovr"><b>${R200(p.ovr)}</b><small>${eur(pValue(p))}</small></div></div>
   <div class="ng-cols"><div class="fmp-info">${offer}</div><div><p class="ng-l">Görüşler</p><p class="bo"><b>Oyuncu:</b> ${de[1]}.</p>${ops}</div></div>
   <div class="ng-log">${log}</div>${body}<button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:6px">Kapat</button></div>`);$('#modalCard').classList.add('wide');}
ACTX.bidO=el=>bidOpen(el.dataset.id);
ACTX.bidS=el=>{const b=(G.m.bids||[]).find(x=>x.id===BIDO);if(!b)return;const A=b.ask,f=el.dataset.f,k=el.dataset.k;if(f==='fee')A.fee=Math.max(stepOf(b.fee),rnd5(A.fee+(+k)*stepOf(b.fee),stepOf(b.fee)));else if(f==='inst')A.inst=k;else A[f]=+k;bidModal();};
ACTX.bidX=el=>{const m=G.m,b=(m.bids||[]).find(x=>x.id===BIDO);if(!b)return;const p=squadOf(G.club).find(x=>x.k===b.k),c=CLUBS[b.club],a=el.dataset.k,A=b.ask,de=bidDesire(p,c);
  const done=()=>{save();render();bidModal();};
  if(a==='talk'){const t=de[0]>=2?`“Hocam, bu benim için büyük bir fırsat. Lütfen önümü kesmeyin.”`:de[0]===1?`“${c.name} ilgisi beni mutlu etti ama son kararı size bırakıyorum.”`:de[0]===0?`“Burada mutluyum ama kulüp satmak isterse düşünürüm.”`:`“Ayrılmak istemiyorum, burada kalmak istiyorum.”`;b.log.push([p.name,t.replace(/[“”]/g,'')]);return done();}
  if(a==='no'||a==='nfs'){m.bids=m.bids.filter(x=>x!==b);if(a==='nfs'){m.nfs=m.nfs||{};m.nfs[b.k]=G.s.year;relAdd(p,de[0]>=1?-10:8);toast(`${p.name} satılık değil ilan edildi`);msg('squad','Satılık değil',`${p.name} için gelen teklifleri artık değerlendirmeyeceğiz. ${de[0]>=1?'Oyuncu bu karardan hoşnut değil.':'Oyuncu kulübün ona güvenmesinden memnun.'}`);}
    else{if(de[0]>=2){relAdd(p,-14);msg('squad',`${p.name} kızgın`,`${p.name}, ${c.name} transferinin engellenmesinden hiç memnun değil.`);}toast('Teklif reddedildi');}closeModal();save();render();return;}
  if(a==='ok'){A.fee=b.fee;A.inst=b.inst;A.sell=b.sell;A.bb=0;A.lb=0;b.st='agreed';b.log.push(['Sen','Teklifinizi kabul ediyoruz.']);return done();}
  if(a==='cnt'){const cost=bidCost(A,p),mx=b.max,txt=`${eur(A.fee)}, ${BID_INST[A.inst][0].toLowerCase()}${A.sell?`, %${A.sell} sonraki satış payı`:''}${A.bb?', geri satın alma hakkı':''}${A.lb?', sezon sonuna kadar kiralık':''} istiyoruz.`;b.log.push(['Sen',txt]);
    if(cost<=mx){b.st='agreed';b.fee=A.fee;b.inst=A.inst;b.sell=A.sell;b.log.push([c.short,'Şartlarınızı kabul ediyoruz.']);}
    else if(cost<=mx*1.18&&b.pat>1){b.pat--;const nf=rnd5(Math.min(A.fee,(b.fee+A.fee)/2+(mx-bidCost(Object.assign({},A,{fee:0}),p)-b.fee)*0.3),stepOf(b.fee));b.fee=Math.max(b.fee,Math.min(nf,mx));b.log.push([c.short,`Bu kadarını veremeyiz. Son önerimiz ${eur(b.fee)}${A.sell||A.bb||A.lb?' ve ek maddelerden birini çıkarmanız':''}.`]);}
    else{b.pat-=2;b.log.push([c.short,b.pat<=0?'Görüşmeleri sonlandırıyoruz.':'Talepleriniz gerçekçi değil.']);if(b.pat<=0){m.bids=m.bids.filter(x=>x!==b);msg('board','Teklif geri çekildi',`${c.name}, ${p.name} için yaptığı teklifi geri çekti.`);save();render();openModal(`<div class="ng-res bad">✖ ${esc(c.short)} görüşmeden çekildi</div><button class="btn" data-act="closeModal" style="width:100%">Kapat</button>`);return;}}
    return done();}
  if(a==='sell'){const fail=de[0]<0?0.55:de[0]===0?0.15:0.03;m.bids=m.bids.filter(x=>x.k!==b.k);
    if(Math.random()<fail){closeModal();msg('board','Transfer iptal',`${p.name}, ${c.name} ile kişisel şartlarda anlaşamadı. Oyuncu kadroda kalıyor.`);relAdd(p,-4);save();render();openModal(`<div class="ng-res bad">✖ ${esc(p.name)} kişisel şartlarda anlaşamadı</div><p class="muted">Oyuncu ayrılmak istemediği için transfer gerçekleşmedi.</p><button class="btn" data-act="closeModal" style="width:100%">Kapat</button>`);return;}
    const I=BID_INST[b.inst],now=b.fee*I[2],pr=now*EUR_TL;m.budget+=pr*(1-((m.sellOn&&m.sellOn[b.k]&&m.sellOn[b.k].pct)||0)/100);
    if(I[2]<1){m.instIn=m.instIn||[];m.instIn.push({club:c.id,left:b.fee-now,per:rnd5((b.fee-now)/(b.inst==='y2'?1:2),stepOf(b.fee)),n:b.inst==='y2'?1:2,name:p.name});}
    if(b.sell){m.sellRev=m.sellRev||{};m.sellRev[b.k]={club:c.id,pct:b.sell};}
    if(A.lb&&b.st==='agreed'){m.lbk=m.lbk||{};m.lbk[b.k]={to:c.id,until:G.s.year+1};}else{G.tx=G.tx||{};G.tx[b.k]=c.id;txNote(b.k,c.id,b.fee);}
    if(m.ct&&!A.lb)delete m.ct[b.k];syncStr(G.club);syncStr(c.id);m.xi=null;m.wbud=Math.max(m.wbud||0,wageBill());
    msg('board',`Satış: ${p.name}`,`${p.name}, ${c.name} kulübüne ${eur(b.fee)} (${I[0].toLowerCase()}) karşılığında satıldı.${b.sell?` Sonraki satıştan %${b.sell} pay alacağız.`:''}${A.bb?' Geri satın alma hakkımız var.':''}${A.lb?' Oyuncu sezon sonuna kadar bizde kiralık kalacak.':''}`);toast(`${p.name} satıldı: ${eur(b.fee)}`);closeModal();save();render();}};
/* sezon sonu: kiralık geri gönderilenlerin transferi tamamlanır, taksitler ödenir */
mgrNewSeason=(old=>function(){const m=G.m;if(m){if(m.lbk){G.tx=G.tx||{};for(const [k,v] of Object.entries(m.lbk)){G.tx[k]=v.to;txNote(k,v.to,typeof price==='number'&&price<1e10?price:undefined);if(m.ct)delete m.ct[k];}m.lbk={};}
  if(m.instIn&&m.instIn.length){let s=0;for(const x of m.instIn){if(x.n>0&&x.left>0){const pay=Math.min(x.left,x.per);m.budget+=pay*EUR_TL;x.left-=pay;x.n--;s+=pay;}}m.instIn=m.instIn.filter(x=>x.n>0&&x.left>0);if(s)msg('board','Taksit ödemeleri',`Önceki satışlardan ${eur(s)} taksit ödemesi bütçeye eklendi.`);}}return old.apply(this,arguments);})(mgrNewSeason);
bidsWeek=(old=>function(){const m=fmInit(),n0=(m.bids||[]).length;old();const nb=m.bids||[];if(nb.length>n0){const b=nb[nb.length-1];if(m.nfs&&m.nfs[b.k]===G.s.year){nb.pop();}}})(bidsWeek);
bidsHTML=function(){const m=fmInit(),L=(m.bids||[]).filter(b=>b.until>G.s.day);
  return `<section class="panel"><p class="sub-h"><span>Gelen teklifler</span><span>${L.length}</span></p>${L.map(b=>{const p=pByKey(b.k),c=CLUBS[b.club];if(!p||!c)return '';const pp=squadOf(G.club).find(x=>x.k===b.k)||p,de=bidDesire(pp,c);
    return `<div class="bid"><div class="bid-hd">${crestSVG(c,30)}<div><b><span class="plink" data-act="pcard" data-id="${G.club}" data-k="${b.k}">${esc(p.name)}</span></b><small>${esc(c.name)} · ${eur(b.fee)} · değer ${eur(pValue(pp))} · ${b.until-G.s.day} gün</small><small class="bid-de d${de[0]+1}">${de[1]}${b.st==='agreed'?' · <b>anlaşma sağlandı, onayın bekleniyor</b>':''}</small></div></div>
      <div class="offer-btns"><button class="cta sm" data-act="bidO" data-id="${b.id}">Görüş</button><button class="btn" data-act="pcard" data-id="${G.club}" data-k="${b.k}">Profil</button><button class="btn ghost" data-act="bid" data-id="${b.id}" data-k="no">Reddet</button></div></div>`;}).join('')||'<p class="muted">Şu an oyuncuların için teklif yok. Transfer dönemlerinde kulüpler teklif gönderir.</p>'}</section>`;};
/* ---------- isimlere tıklayınca profil ---------- */
let LNK={key:'',re:null,map:null};
function lnkIndex(){if(!G||!G.s||!G.club)return null;const key=[G.s.year,G.s.week,G.s.day,G.club,G.mode,(G.tx?Object.keys(G.tx).length:0)].join('|');if(LNK.key===key)return LNK;const map=new Map();
  const addP=(p,cid)=>{if(p&&p.name&&p.name.includes(' ')&&!map.has(p.name))map.set(p.name,{t:'p',id:cid,k:p.k});};
  try{for(const c of leagueClubs(G.s.league))for(const p of squadOf(c.id))addP(p,c.id);}catch(_){}
  try{const L=stfList(G.club)||[];L.forEach((s,i)=>{if(s&&s.name&&s.name.includes(' ')&&!map.has(s.name))map.set(s.name,{t:'s',id:G.club,i});});}catch(_){}
  try{for(const c of leagueClubs(G.s.league)){const co=coachOf(c.id);if(co&&co.n&&co.n.includes(' ')&&!map.has(co.n))map.set(co.n,{t:'c',id:c.id});}}catch(_){}
  const extra=[...((G.m&&G.m.shortlist)||[]),...((G.job&&G.job.short)||[]),...((G.m&&G.m.fa)||[]).map(x=>x&&x.k||x)];for(const k of extra){const p=typeof k==='string'?pByKey(k):null;if(p){const cid=(G.tx&&G.tx[p.k])||p.home;if(CLUBS[cid])addP(Object.assign({},p),cid);}}
  const names=[...map.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));LNK={key,map,re:names.length?new RegExp(`(${names.join('|')})`,'g'):null};return LNK;}
function linkify(root){const I=lnkIndex();if(!I||!I.re||!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const pe=n.parentElement;if(!pe||!n.nodeValue||n.nodeValue.length<5)return NodeFilter.FILTER_REJECT;
  if(pe.closest('button,a,input,textarea,select,svg,canvas,.fmp-name,.plink,.ng-id,.tab,.top,.cl-m,[data-act=pcard],[data-act=stfCard],[data-act=ccard],.trrow,.fm-cand,.fm-b,.fm-slot,.sqrow'))return NodeFilter.FILTER_REJECT;I.re.lastIndex=0;return I.re.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const ns=[];let n;while((n=w.nextNode()))ns.push(n);
  for(const t of ns){const s=t.nodeValue,frag=document.createDocumentFragment();let last=0;I.re.lastIndex=0;let mm;while((mm=I.re.exec(s))){const r=I.map.get(mm[1]);if(!r)continue;frag.append(s.slice(last,mm.index));const sp=document.createElement('span');sp.className='plink';sp.textContent=mm[1];
      if(r.t==='p'){sp.dataset.act='pcard';sp.dataset.id=r.id;sp.dataset.k=r.k;}else if(r.t==='s'){sp.dataset.act='stfCard';sp.dataset.id=r.id;sp.dataset.i=r.i;}else{sp.dataset.act='ccard';sp.dataset.id=r.id;}frag.append(sp);last=mm.index+mm[1].length;}
    if(last){frag.append(s.slice(last));t.replaceWith(frag);}}}
render=(old=>function(){old();try{if(G&&G.phase!=='tryout')linkify($('#view'));}catch(e){}})(render);
openModal=(old=>function(h){old(h);const mc=$('#modalCard');if(mc){mc.scrollTop=0;try{linkify(mc);}catch(e){}}})(openModal);

