/* ================= v40: finans · taraftar · kiralıklar · ödüller · yapay zekâ transferleri · hızlı arama · ana sayfa düzeni · ısı haritası ================= */
/* ---------- günlük kancalar ---------- */
function ourLastRes(){const R=G.s.results||[];for(let i=R.length-1;i>=0;i--){const r=R[i]&&R[i].find(x=>x[0]===G.club||x[1]===G.club);if(r)return {w:i,r};}return null;}
nextDay=(old=>function(){if(!G||!G.s||G.mode!=='mgr'||!G.m||G.phase!=='season')return old.apply(this,arguments);const S0=G.s,nr0=(G.s.results||[]).length,cr0=(cupsOf().list||[]).reduce((a,k)=>a+k.res.length,0);
  const out=old.apply(this,arguments);
  try{if(G.s!==S0||G.phase!=='season')return out;const m=trInit();trDay();if(wdOf(today())===0)trWeek();
    /* yeni sonuç: taraftar, söz, basın */
    m.rs=m.rs&&m.rs.y===G.s.year?m.rs:{y:G.s.year,n:0,c:0};let res=null;const L=ourLastRes();if(L&&L.w+1>m.rs.n){m.rs.n=L.w+1;const [h,a,hg,ag]=L.r,us=h===G.club?hg:ag,th=h===G.club?ag:hg;res={us,th,opp:CLUBS[h===G.club?a:h],home:h===G.club};}
    const cr1=(cupsOf().list||[]).reduce((a,k)=>a+k.res.length,0);if(cr1>m.rs.c){m.rs.c=cr1;if(!res){for(const k of cupsOf().list){const x=k.res[k.res.length-1];if(x&&x.opp){res={us:x.us,th:x.them,opp:clubObj(x.opp),home:x.h,cup:k.short};}}}}
    if(res){const d=res.us-res.th;m.fans=clamp(m.fans+(d>0?(d>=3?3.5:2):d===0?-0.3:(d<=-3?-4.5:-2.5)),0,100);
      if(m.promise&&G.s.day-m.promise.day<=3){if(d<0){m.fans=clamp(m.fans-3,0,100);m.conf=clamp((m.conf||50)-2,0,100);msg('press','Sözünü tutamadın',`Maç öncesi “kazanacağız” demiştin. Taraftar ve yönetim hayal kırıklığında.`);}else if(d>0)m.fans=clamp(m.fans+1,0,100);m.promise=null;}
      if(Math.random()<0.75)pressNew(d>0?'win':d===0?'draw':'loss',{opp:res.opp?res.opp.name:''});}

    /* taraftar → yönetim */
    if(wdOf(today())===0)m.conf=clamp((m.conf||50)+(m.fans-60)/80,0,100);
    loanWeekTick();}catch(e){console.warn(e);}
  return out;})(nextDay);
/* yapay zekâ transferleri: transfer dönemi açıkken kulüpler kendi aralarında oyuncu alıp satar */
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.s&&G.s.cal&&G.phase==='season'&&twOpen())aiTransfers();}catch(e){console.warn(e);}return out;})(nextDay);
function aiTransfers(){const I=twInfo(),summer=G.s.day<=I.sc,n=summer?(Math.random()<0.5?3:2):(Math.random()<0.4?1:0);const lgs=WORLD.filter(l=>LEAGUES[l]&&!LEAGUES[l].youth&&LEAGUES[l].tier>=7);
  let done=0;for(let i=0;i<n*6&&done<n;i++){const bl=pick(lgs),buyer=pick(leagueClubs(bl));if(!buyer||buyer.id===G.club)continue;const bsq=squadOf(buyer.id);if(bsq.length>=30)continue;
    const pos=pick(['KL','DF','DF','OS','OS','KN','FW','FW']);const need=bsq.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr);const tgt=(need[1]||need[0]||{ovr:buyer.str-4}).ovr+rint(1,5);
    const sl=pick(lgs.filter(l=>Math.abs(LEAGUES[l].tier-LEAGUES[bl].tier)<=1));const seller=pick(leagueClubs(sl));if(!seller||seller.id===buyer.id||seller.id===G.club)continue;const ssq=squadOf(seller.id);if(ssq.length<=20)continue;
    const cand=ssq.filter(p=>p.pos===pos&&Math.abs(p.ovr-tgt)<=4&&p.age<=31&&!(G.twPend||[]).some(x=>x.k===p.k));if(!cand.length)continue;const p=pick(cand),fee=Math.round(pValue(p)*rnd(0.85,1.35)/5e4)*5e4;
    G.tx=G.tx||{};G.tx[p.k]=buyer.id;txNote(p.k,buyer.id,fee);syncStr(buyer.id);syncStr(seller.id);done++;
    if(p.ovr>=76||[buyer.league,seller.league].includes(G.s.league))msg('gundem',`Transfer: ${p.name} → ${buyer.short}`,`${buyer.name}, ${seller.name} forması giyen ${p.name} (${p.age}, ${dpTag(p)}) ile anlaştı. Bonservis: ${eur(fee)}.`);}}
/* ---------- kiralığa gönderme (menajer) ---------- */
function loanTargets(p){const T=curLeague().tier;return Object.values(CLUBS).filter(c=>c.id!==G.club&&!LEAGUES[c.league].youth&&Math.abs(LEAGUES[c.league].tier-T)<=2&&c.str<=myClub().str-2&&c.str>=p.ovr-7&&!(c.league===myClub().league&&c.str>=myClub().str-6)&&squadOf(c.id).length<30).sort((a,b)=>b.str-a.str).slice(0,8);}
ACTX.loanOut=el=>{if(!trWin())return toast('Transfer dönemi kapalı · '+twNextTxt());const k=el.dataset.k,p=squadOf(G.club).find(x=>x.k===k);if(!p)return;const T=loanTargets(p);if(!T.length)return toast('Uygun kulüp bulunamadı');
  openModal(`<h3>${esc(p.name)} kiralık</h3><p class="muted">Sezon sonuna kadar kiralık gönder. Düzenli oynarsa gelişimi hızlanır; maaşını kiralayan kulüp öder.</p><ul class="cupres">${T.map(c=>`<li class="clk" data-act="loanGo" data-k="${k}" data-id="${c.id}"><span>${crestSVG(c,16)} ${esc(c.name)}</span><b>${esc(LEAGUES[c.league].short)}</b><em>${p.ovr>=c.str?'İlk 11':'Rotasyon'}</em></li>`).join('')}</ul><button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Vazgeç</button>`);};
ACTX.loanGo=el=>{const m=G.m,k=el.dataset.k,to=el.dataset.id,p=pByKey(k);if(!p)return;m.lout=m.lout||{};m.lout[k]={to,y:G.s.year,d:G.s.day,ovr0:p.ovr};G.tx=G.tx||{};G.tx[k]=to;txNote(k,to);
  const L=G.txh&&G.txh[k];if(L&&L.length){L[L.length-1].loan=1;delete L[L.length-1].fee;}if(m.xi)m.xi=m.xi.filter(x=>x!==k);syncStr(G.club);syncStr(to);closeModal();msg('squad',`Kiralık: ${p.name}`,`${p.name} sezon sonuna kadar ${CLUBS[to].name} takımına kiralandı.`);save();render();};
function loanWeekTick(){const m=G.m;if(!m||!m.lout||wdOf(today())!==0)return;for(const [k,l] of Object.entries(m.lout)){const p=pByKey(k);if(!p)continue;const M=clubSeasonEst(l.to)[k];const ratio=M&&M.ap?M.ap/Math.max(1,(G.s.results||[]).length):0;
    if(p.age<=24){const gap=potOf(p)-p.ovr;if(gap>0)m.dev[k]=(m.dev[k]||0)+0.05*clamp(ratio,0.2,1);}}}
mgrNewSeason=(old=>function(){const m=G.m;try{if(m&&m.lout){for(const [k,l] of Object.entries(m.lout)){if(G.tx&&G.tx[k]===l.to){G.tx[k]=G.club;txNote(k,G.club);}const p=pByKey(k);if(p)msg('squad',`Kiralıktan dönüş: ${p.name}`,`${p.name} kiralık süresini tamamlayıp kulübe döndü.`);}m.loutH=(m.loutH||[]).concat(Object.entries(m.lout).map(([k,l])=>Object.assign({k},l))).slice(-30);m.lout={};}}catch(e){console.warn(e);}return old.apply(this,arguments);})(mgrNewSeason);
showPCard=(old=>function(id,k){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&id===G.club){const box=$('#modalCard .offer-btns');if(box&&!box.querySelector('[data-act=loanOut]'))box.insertAdjacentHTML('beforeend',`<button class="btn" data-act="loanOut" data-k="${k}">Kiralığa gönder</button>`);}}catch(e){}return r;})(showPCard);
function viewLoans(){const m=G.m||{},L=Object.entries(m.lout||{}),inL=Object.entries(m.loans||{});
  const row=([k,l])=>{const p=pByKey(k);if(!p)return '';const M=clubSeasonEst(l.to)[k]||{ap:0,g:0,a:0,rt:0},c=CLUBS[l.to];return `<tr class="clk" data-act="pcard" data-id="${l.to}" data-k="${k}"><td class="l">${esc(p.name)}</td><td>${dpTag(p)}</td><td>${p.age}</td><td class="l club">${crestSVG(c,14)}<span>${esc(c.short)}</span></td><td>${M.ap}</td><td>${M.g}</td><td>${M.a}</td><td>${M.ap&&M.rt?(M.rt/M.ap).toFixed(2):'–'}</td><td>${R200(p.ovr)}${p.ovr>l.ovr0?` <em class="res-w">+${R200(p.ovr)-R200(l.ovr0)}</em>`:''}</td></tr>`;};
  const inRows=inL.map(([k,l])=>{const p=pByKey(k);if(!p)return '';const c=CLUBS[l.from];return `<li class="clk" data-act="pcard" data-id="${G.club}" data-k="${k}"><span>${dpTag(p)} ${esc(p.name)}</span><b>${c?esc(c.short):''}</b><em>${l.opt?'Opsiyon '+eur(l.opt):'Opsiyonsuz'}</em></li>`;}).join('');
  return `<h2 class="h">Kiralıklar</h2><section class="panel"><p class="sub-h"><span>Kiralık gönderdiklerimiz</span><span>${L.length} oyuncu</span></p>${L.length?`<div class="tbl-wrap"><table class="lgt"><thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th class="l">Kulüp</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th><th>Güç</th></tr></thead><tbody>${L.map(row).join('')}</tbody></table></div>`:'<p class="muted">Kiralık gönderilen oyuncu yok. Kendi oyuncunun kartından “Kiralığa gönder” diyebilirsin (transfer dönemi açıkken).</p>'}</section>
   <section class="panel"><p class="sub-h"><span>Kiralık aldıklarımız</span></p>${inRows?`<ul class="cupres">${inRows}</ul>`:'<p class="muted">Kiralık oyuncumuz yok.</p>'}</section>`;}
/* ---------- finans ---------- */
const TV_REV={pl:160e6,ll:95e6,it1:80e6,de1:75e6,fr1:45e6,sl:24e6,pt1:15e6,nl1:14e6,be1:9e6,sa1:20e6,br1:18e6,sc1:6e6,gr1:5e6,at1:5e6,ch1:5e6,dk1:4e6,en2:9e6};
function finData(){const c=myClub(),L=curLeague(),m=G.m,cs=cstate(G.club),S=G.s,fans=(m&&m.fans!=null?m.fans:60);
  const nPl=(S.results||[]).length,nTot=(S.fixtures||[]).length||1,homeN=(S.results||[]).reduce((a,rd)=>a+(rd.some(x=>x[0]===G.club)?1:0),0)+(cupsOf().list||[]).reduce((a,k)=>a+k.res.filter(x=>x.h).length,0);
  const price=[3,3,4,5,6,8,10,15,30,55][Math.min(9,L.tier)]||10,fill=clamp(0.42+fans/180+(L.tier-6)*0.03,0.25,1),gate=Math.round(cs.cap*fill),tix=homeN*gate*price;
  const tv=(TV_REV[S.league]||(L.tier>=8?6e6:L.tier>=7?1.5e6:0.2e6))*nPl/nTot,spon=clubBudget(c)/EUR_TL*0.3*nPl/nTot,uefa=(cupsOf().list||[]).reduce((a,k)=>a+(k.prize||0),0);
  let tIn=0,tOut=0;for(const [k,L2] of Object.entries(G.txh||{}))for(const e of L2){if(e.y!==S.year||!e.fee)continue;if(e.from===G.club)tIn+=e.fee;else if(e.to===G.club)tOut+=e.fee;}
  const wk=Math.max(1,Math.round((S.day||0)/7)),wages=(G.mode==='mgr'?wageBill():0)*wk,staff=(G.mode==='mgr'&&typeof stfMine==='function'?stfMine().reduce((a,s)=>a+(s?s.w:0),0):0)*wk;
  const ops=clubBudget(c)/EUR_TL*0.06*nPl/nTot;const inc=[['Bilet gelirleri',tix],['Yayın gelirleri',tv],['Sponsor ve ticari',spon],['UEFA ödemeleri',uefa],['Oyuncu satışları',tIn]],exp=[['Oyuncu maaşları',wages],['Teknik ekip maaşları',staff],['Transfer harcamaları',tOut],['İşletme giderleri',ops]];
  return {inc,exp,ti:inc.reduce((a,x)=>a+x[1],0),te:exp.reduce((a,x)=>a+x[1],0),gate,fill,price,cap:cs.cap,homeN,fans};}
function viewFin(){const F=finData(),m=G.m||{},c=myClub();const bal=F.ti-F.te,mx=Math.max(F.ti,F.te,1);
  const bars=(arr,col)=>arr.map(([l,v])=>`<div class="fin-r"><span>${l}</span><div class="bar"><i style="width:${v/mx*100}%;background:${col}"></i></div><b>${eur(Math.round(v))}</b></div>`).join('');
  const meter=(l,v,c2)=>`<div class="tr-m"><span>${l}</span><div class="bar"><i style="width:${v}%;background:${c2}"></i></div><b>${Math.round(v)}</b></div>`;
  return `<h2 class="h">Finans</h2><div class="fin-kpi"><div><span>Transfer bütçesi</span><b>${money(m.budget||0)}</b></div><div><span>Maaş bütçesi (hf)</span><b>${eur(m.wbud||wageBill())}</b><small>Kullanılan ${eur(wageBill())}</small></div><div><span>Sezon bilançosu</span><b class="${bal>=0?'pos':'neg'}">${bal>=0?'+':'−'}${eur(Math.abs(Math.round(bal)))}</b></div><div><span>Yıllık kulüp bütçesi</span><b>${money(clubBudget(c))}</b></div></div>
   <div class="tr-grid"><section class="panel"><p class="sub-h"><span>Gelirler · ${seasonLabel(G.s.year)}</span><span>${eur(Math.round(F.ti))}</span></p>${bars(F.inc,'#35d49a')}</section>
   <section class="panel"><p class="sub-h"><span>Giderler</span><span>${eur(Math.round(F.te))}</span></p>${bars(F.exp,'#ff6b6b')}</section></div>
   <div class="tr-grid"><section class="panel"><p class="sub-h"><span>Stadyum</span><span>${esc(stadName(c))}</span></p><div class="fin-kpi sm"><div><span>Kapasite</span><b>${F.cap.toLocaleString('tr-TR')}</b></div><div><span>Ort. seyirci</span><b>${F.gate.toLocaleString('tr-TR')}</b><small>%${Math.round(F.fill*100)} doluluk</small></div><div><span>Bilet (ort.)</span><b>${eur(F.price)}</b></div><div><span>İç saha maçı</span><b>${F.homeN}</b></div></div></section>
   <section class="panel"><p class="sub-h"><span>Taraftar ve medya</span></p>${meter('Taraftar memnuniyeti',m.fans==null?60:m.fans,'#ffd166')}${meter('Medya ilişkisi',m.media==null?50:m.media,'#3fa7ff')}${meter('Yönetim güveni',m.conf||50,'#35d49a')}
   <p class="muted" style="margin:6px 0 0">Taraftar memnuniyeti stadyum doluluğunu ve bilet gelirini belirler; uzun vadede yönetim güvenine yansır. Galibiyetler, iddialı transferler ve basın toplantısı cevapları etkiler.</p></section></div>`;}
/* ---------- sezon ödülleri ---------- */
function seasonAwards(){const S=G.s;if(!S||!S.cal||S.awDone)return;S.awDone=1;const lid=S.league,yl=seasonLabel(S.year);G.awards=G.awards||{};const A={y:yl,lg:LEAGUES[lid].name};
  const all=[];for(const c of leagueClubs(lid)){const M=clubSeasonEst(c.id);for(const x of Object.values(M))if(x.ap)all.push(Object.assign({c:c.id},x));}
  const by=(f,flt)=>all.filter(flt||(()=>true)).sort(f)[0];const rt=x=>x.ap?x.rt/x.ap:0;
  const g=by((a,b)=>b.g-a.g||a.ap-b.ap),a=by((a,b)=>b.a-a.a||a.ap-b.ap),pl=by((a,b)=>rt(b)+b.g*0.01-(rt(a)+a.g*0.01),x=>x.ap>=Math.max(8,(S.results||[]).length*0.5)),yg=by((a,b)=>rt(b)-rt(a),x=>x.p.age<=21&&x.ap>=6);
  const pack=x=>x?{k:x.p.k,n:x.p.name,c:x.c,g:x.g,a:x.a,r:+rt(x).toFixed(2)}:null;A.gk=pack(g);A.ak=pack(a);A.po=pack(pl);A.yg=pack(yg);
  /* yılın 11'i (4-3-3) */
  const grp=x=>{const d=dpMain(x.p);return d==='GK'?'GK':['DC','DL','DR','WBL','WBR'].includes(d)?'DF':['DM','MC','AMC','ML','MR'].includes(d)?'MF':'FW';};const used=new Set(),xi=[];
  for(const [gp,n] of [['GK',1],['DF',4],['MF',3],['FW',3]]){all.filter(x=>grp(x)===gp&&x.ap>=Math.max(6,(S.results||[]).length*0.4)&&!used.has(x.p.k)).sort((a,b)=>rt(b)-rt(a)).slice(0,n).forEach(x=>{used.add(x.p.k);xi.push(Object.assign(pack(x),{gp}));});}A.xi=xi;
  /* Altın Top: büyük liglerden */
  const big=['pl','ll','it1','de1','fr1'];const cands=[];for(const l of big)for(const c of leagueClubs(l)){const M=clubSeasonEst(c.id);for(const x of Object.values(M))if(x.ap>=10&&x.p.ovr>=85)cands.push(Object.assign({c:c.id,sc:x.p.ovr*1.2+x.g*0.9+x.a*0.5+rt(x)*6+c.str*0.3},x));}
  cands.sort((a,b)=>b.sc-a.sc);A.bdo=cands.slice(0,5).map(pack);
  G.awards[yl]=A;const me=[A.gk,A.ak,A.po,A.yg].filter(Boolean).find(x=>x.c===G.club);
  msg('gundem',`${yl} sezon ödülleri`,`${A.lg} yılın oyuncusu: ${A.po?A.po.n:'—'}. Gol kralı: ${A.gk?A.gk.n+' ('+A.gk.g+')':'—'}. Asist kralı: ${A.ak?A.ak.n+' ('+A.ak.a+')':'—'}. Altın Top: ${A.bdo[0]?A.bdo[0].n:'—'}.${me?` Kulübümüzden ${me.n} ödül aldı!`:''}`);}
qualNext=(old=>function(){try{seasonAwards();}catch(e){console.warn(e);}return old.apply(this,arguments);})(qualNext);
function viewAwards(){const Y=Object.keys(G.awards||{}).sort().reverse();if(!Y.length)return `<h2 class="h">Ödüller</h2><section class="panel"><p class="muted">Sezon sonunda yılın oyuncusu, gol ve asist kralı, yılın genci, yılın 11’i ve Altın Top burada açıklanır.</p></section>`;
  const pl=x=>x?`<span class="plink" data-act="pcard" data-id="${(G.tx&&G.tx[x.k])||x.c}" data-k="${x.k}">${esc(x.n)}</span> <small>${CLUBS[x.c]?esc(CLUBS[x.c].short):''}</small>`:'—';
  return `<h2 class="h">Ödüller</h2>`+Y.map(y=>{const A=G.awards[y];return `<section class="panel"><p class="sub-h"><span>${esc(y)} · ${esc(A.lg)}</span></p><div class="aw-grid">
    <div class="aw"><i>🏆</i><span>Yılın oyuncusu</span><b>${pl(A.po)}</b><small>${A.po?A.po.r+' ort.':''}</small></div><div class="aw"><i>⚽</i><span>Gol kralı</span><b>${pl(A.gk)}</b><small>${A.gk?A.gk.g+' gol':''}</small></div>
    <div class="aw"><i>🎯</i><span>Asist kralı</span><b>${pl(A.ak)}</b><small>${A.ak?A.ak.a+' asist':''}</small></div><div class="aw"><i>🌱</i><span>Yılın genci</span><b>${pl(A.yg)}</b><small>${A.yg?A.yg.r+' ort.':''}</small></div></div>
    <p class="sub-h" style="margin-top:10px"><span>Yılın 11'i</span></p><div class="aw-xi">${['FW','MF','DF','GK'].map(gp=>`<div>${A.xi.filter(x=>x.gp===gp).map(x=>`<span class="aw-p" data-act="pcard" data-id="${(G.tx&&G.tx[x.k])||x.c}" data-k="${x.k}">${CLUBS[x.c]?crestSVG(CLUBS[x.c],18):''}<b>${esc(ksur(x.n))}</b><small>${x.r}</small></span>`).join('')}</div>`).join('')}</div>
    <p class="sub-h" style="margin-top:10px"><span>Altın Top</span></p><ol class="aw-bdo">${A.bdo.map(x=>`<li>${pl(x)} <em>${x.g} gol · ${x.a} asist</em></li>`).join('')}</ol></section>`;}).join('');}
/* oyuncu profili: ödülleri kariyer sekmesine ekle */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const W=[];for(const A of Object.values(G.awards||{})){if(A.po&&A.po.k===p.k)W.push(`${A.y} yılın oyuncusu`);if(A.gk&&A.gk.k===p.k)W.push(`${A.y} gol kralı`);if(A.ak&&A.ak.k===p.k)W.push(`${A.y} asist kralı`);if(A.yg&&A.yg.k===p.k)W.push(`${A.y} yılın genci`);if(A.xi.some(x=>x.k===p.k))W.push(`${A.y} yılın 11'i`);const b=A.bdo.findIndex(x=>x.k===p.k);if(b===0)W.push(`${A.y} Altın Top`);else if(b>0)W.push(`${A.y} Altın Top ${b+1}.`);}
    if(W.length)h=h.replace('<p class="fmp-sec">Kariyer geçmişi',`<p class="fmp-sec">Ödüller</p><div class="aw-tags">${W.map(x=>`<span>🏅 ${esc(x)}</span>`).join('')}</div><p class="fmp-sec">Kariyer geçmişi`);
    /* gelişim grafiği */
    const g=progChart(p);if(g)h=h.replace('<p class="fmp-sec">Kariyer geçmişi',g+'<p class="fmp-sec">Kariyer geçmişi');
    /* ısı haritası */
    const hm=heatHTML(p);if(hm)h=h.replace('<p class="fmp-sec">Özellikler',hm+'<p class="fmp-sec">Özellikler');}catch(e){console.warn(e);}return h;})(fmProfHTML);
/* ---------- gelişim grafiği ---------- */
function progData(p){const Y0=2026,now=G.s?G.s.year:Y0,pts=[],pot=potOf(p);G.ovh=G.ovh||{};const H=G.ovh[p.k]||{};
  for(let y=Math.max(Y0-6,Y0-(p.age-(now-Y0))+17);y<=now;y++){const ago=now-y,ageT=p.age-ago;let o=H[y]!=null?H[y]:y<Y0?Math.round(clamp(p.ovr-Math.max(0,Math.min(27,p.age)-ageT)*1.7-(ageT>30?0:0)+(ageT>31?(ageT-31)*1.2:0),40,99)):null;
    if(y===now)o=p.ovr;if(o!=null)pts.push([y,o]);}return {pts,pot};}
function progChart(p){const D=progData(p);if(D.pts.length<2)return '';const W=520,H=150,pad=28,ys=D.pts.map(x=>x[1]).concat([D.pot]),mn=Math.min(...ys)-3,mx=Math.max(...ys)+3,x0=D.pts[0][0],x1=D.pts[D.pts.length-1][0];
  const X=y=>pad+(y-x0)/Math.max(1,x1-x0)*(W-pad*2),Yp=v=>H-pad+(-(v-mn)/(mx-mn))*(H-pad*1.6);const path=D.pts.map((q,i)=>`${i?'L':'M'}${X(q[0]).toFixed(1)},${Yp(q[1]).toFixed(1)}`).join(' ');
  return `<p class="fmp-sec">Gelişim <small>· güç yıllara göre, kesikli çizgi potansiyel</small></p><svg class="prog" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="${pad}" x2="${W-pad}" y1="${Yp(D.pot)}" y2="${Yp(D.pot)}" stroke="#ffd166" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W-pad}" y="${Yp(D.pot)-5}" text-anchor="end" fill="#ffd166" font-size="10">POT ${D.pot}</text>
    <path d="${path}" fill="none" stroke="#35d49a" stroke-width="2.5"/>${D.pts.map(q=>`<circle cx="${X(q[0])}" cy="${Yp(q[1])}" r="3.5" fill="#35d49a"><title>${seasonLabel(q[0])}: ${q[1]}</title></circle><text x="${X(q[0])}" y="${Yp(q[1])-8}" text-anchor="middle" fill="#fff" font-size="10">${q[1]}</text><text x="${X(q[0])}" y="${H-8}" text-anchor="middle" fill="#a99fc9" font-size="9.5">${String(q[0]).slice(2)}/${String(q[0]+1).slice(2)}</text>`).join('')}</svg>`;}
/* sezon sonunda güçleri arşivle (grafik için) */
newSeason=(old=>function(y){try{if(G&&G.s&&G.s.cal&&G.s.year<y){G.ovh=G.ovh||{};const Y=G.s.year;for(const c of Object.values(CLUBS)){const L=LEAGUES[c.league];if(!L||L.youth||L.tier<7)continue;for(const p of squadOf(c.id)){(G.ovh[p.k]=G.ovh[p.k]||{})[Y]=p.ovr;}}
    for(const k in G.ovh){for(const yy in G.ovh[k])if(+yy<Y-7)delete G.ovh[k][yy];}}}catch(e){console.warn(e);}return old.apply(this,arguments);})(newSeason);
/* ---------- ısı haritası (2B maç) ---------- */
let HEAT=null;
fxStep=(old=>function(dt){old(dt);try{const S=FX;if(!S||S.phase!=='play'||S.watch||G.mode!=='mgr')return;S._hc=(S._hc||0)+1;if(S._hc%6)return;HEAT=HEAT&&HEAT.id===S.id0?HEAT:{id:S.id0,g:{}};const T=S.T[0];
  for(const p of fxOn(T)){if(!p.k)continue;const x=T.dir>0?p.x:FXL-p.x,y=T.dir>0?p.y:FXW-p.y,cx=clamp(Math.floor(x/FXL*12),0,11),cy=clamp(Math.floor(y/FXW*8),0,7);const a=HEAT.g[p.k]=HEAT.g[p.k]||new Array(96).fill(0);a[cy*12+cx]++;}}catch(e){}})(fxStep);
fxClose=(old=>function(){try{const S=FX;if(S&&HEAT&&G.mode==='mgr'&&G.m){G.m.heat=G.m.heat||{};for(const [k,a] of Object.entries(HEAT.g)){const mx=Math.max(...a)||1;G.m.heat[k]={a:a.map(v=>Math.round(v/mx*9)).join(''),opp:S.O?S.O.short:'',d:G.s.day};}HEAT=null;}}catch(e){}return old.apply(this,arguments);})(fxClose);
function heatHTML(p){const H=G.m&&G.m.heat&&G.m.heat[p.k];if(!H)return '';const a=H.a.split('').map(Number);
  const cells=a.map((v,i)=>{const x=i%12,y=Math.floor(i/12);return v?`<rect x="${x*10}" y="${y*10}" width="10" height="10" fill="rgba(255,${Math.round(220-v*20)},60,${(v/9*0.85).toFixed(2)})"/>`:'';}).join('');
  return `<p class="fmp-sec">Isı haritası <small>· son maç (${esc(H.opp)}), hücum yönü sağa</small></p><svg class="heat" viewBox="0 0 120 80" preserveAspectRatio="none"><rect width="120" height="80" fill="#2f7d38"/>${cells}<g fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".6"><rect x=".5" y=".5" width="119" height="79"/><line x1="60" y1="0" x2="60" y2="80"/><circle cx="60" cy="40" r="9"/><rect x=".5" y="22" width="16" height="36"/><rect x="103.5" y="22" width="16" height="36"/></g></svg>`;}
/* ---------- hızlı arama ---------- */
let QS_IDX=null,QS_KEY='';
function qsIndex(){const key=Object.keys(G.tx||{}).length+'|'+(G.s?G.s.year:0);if(QS_IDX&&QS_KEY===key)return QS_IDX;QS_KEY=key;QS_IDX=[];
  for(const c of Object.values(CLUBS)){if(LEAGUES[c.league].youth)continue;QS_IDX.push({t:'c',id:c.id,n:c.name,s:c.short,low:(c.name+' '+c.short).toLocaleLowerCase('tr-TR')});for(const p of squadOf(c.id))QS_IDX.push({t:'p',id:c.id,k:p.k,n:p.name,pos:dpTag(p),ovr:p.ovr,age:p.age,low:p.name.toLocaleLowerCase('tr-TR')});}return QS_IDX;}
function qsRun(q){const box=$('#qsRes');if(!box)return;q=q.trim().toLocaleLowerCase('tr-TR');if(q.length<2){box.hidden=true;return;}const I=qsIndex(),R=[];for(const x of I){if(x.low.includes(q)){R.push(x);if(R.length>=14)break;}}
  box.innerHTML=R.length?R.map(x=>x.t==='c'?`<button data-act="club" data-id="${x.id}">${crestSVG(CLUBS[x.id],16)}<b>${esc(x.n)}</b><small>Kulüp · ${esc(LEAGUES[CLUBS[x.id].league].short)}</small></button>`:`<button data-act="pcard" data-id="${x.id}" data-k="${x.k}"><span class="tp">${x.pos}</span><b>${esc(x.n)}</b><small>${x.age} · ${esc(CLUBS[x.id].short)} · ${R200(x.ovr)}</small></button>`).join(''):'<p class="muted" style="padding:8px">Sonuç yok</p>';box.hidden=false;}
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||G.phase==='tryout'||!navWide())return;const meta=$('#top .top-meta');if(meta&&!$('#qs'))meta.insertAdjacentHTML('afterbegin',`<div class="qs-w"><input id="qs" type="search" placeholder="Oyuncu veya kulüp ara…" autocomplete="off"><div id="qsRes" class="qs-res" hidden></div></div>`);}catch(e){}})(renderTop);
document.addEventListener('input',e=>{if(e.target&&e.target.id==='qs')qsRun(e.target.value);});
document.addEventListener('click',e=>{const r=$('#qsRes');if(r&&!r.hidden&&!e.target.closest('.qs-w'))r.hidden=true;else if(r&&e.target.closest('#qsRes [data-act]')){r.hidden=true;const i=$('#qs');if(i)i.value='';}},true);
/* ---------- ana sayfa düzeni ---------- */
function hubSections(){const v=$('#view');if(!v)return [];return [...v.querySelectorAll('section.panel, section.week, section.ticket')].map(s=>{const t=(s.querySelector('.sub-h span')||s.querySelector('h3')||{}).textContent||'';const key=s.classList.contains('week')?'Haftalık takvim':s.classList.contains('ticket')?'Sıradaki maç':t.trim();return {s,key};}).filter(x=>x.key);}
render=(old=>function(){const r=old.apply(this,arguments);try{if(TAB==='hub'&&G&&G.s){const hide=new Set((G.ui&&G.ui.hubHide)||[]);for(const {s,key} of hubSections()){if(hide.has(key))s.style.display='none';}
    const v=$('#view');if(v&&!v.querySelector('.hub-cust')){const host=v.querySelector('.tw-bar')||null;const b=`<button class="hub-cust" data-act="hubCust" title="Ana sayfayı düzenle">⚙ Düzenle</button>`;if(host)host.insertAdjacentHTML('beforeend',b);else v.insertAdjacentHTML('afterbegin',`<div class="tw-bar">${b}</div>`);}}}catch(e){}return r;})(render);
ACTX.hubCust=()=>{const hide=new Set((G.ui&&G.ui.hubHide)||[]);const keys=[...new Set(hubSections().map(x=>x.key))];
  openModal(`<h3>Ana sayfayı düzenle</h3><p class="muted">Görmek istemediğin kutuları kapat.</p><div class="hc-l">${keys.map(k=>`<button class="chip" data-act="hubTog" data-k="${esc(k)}" aria-pressed="${!hide.has(k)}">${hide.has(k)?'☐':'☑'} ${esc(k)}</button>`).join('')}</div><button class="cta" data-act="closeModal" style="margin-top:10px">Tamam</button>`);};
ACTX.hubTog=el=>{G.ui=G.ui||{};const s=new Set(G.ui.hubHide||[]),k=el.dataset.k;if(s.has(k))s.delete(k);else s.add(k);G.ui.hubHide=[...s];save();render();ACTX.hubCust();};
/* ---------- menü kayıtları ---------- */
XV.train=()=>viewTrain();XV.prep=()=>viewPrep();XV.fin=()=>viewFin();XV.awards=()=>viewAwards();XV.loans=()=>viewLoans();
Object.assign(XICON,{train:NI('<path d="M4 10v4M20 10v4M7 7v10M17 7v10M7 12h10"/>'),prep:NI('<path d="M9 4h6v3H9z"/><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 12h6M9 16h4"/>'),fin:NI('<path d="M4 19h16M6 16V9M11 16V5M16 16v-6"/>'),awards:NI('<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'),loans:NI('<path d="M7 7h11l-3-3M17 17H6l3 3"/><circle cx="12" cy="12" r="2"/>')});
xtabs=(old=>function(){const L=old.apply(this,arguments);if(G&&G.mode==='mgr'&&G.phase!=='tryout')L.push(['train','Antrenman'],['prep','Maç hazırlığı'],['loans','Kiralıklar'],['fin','Finans']);if(G&&G.phase!=='tryout'&&G.s&&G.s.cal)L.push(['awards','Ödüller']);return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{const has=k=>xtabs().some(x=>x[0]===k);const add=(cat,item,after)=>{const c=C.find(x=>x[0]===cat);if(!c)return;const i=after?c[1].findIndex(x=>x[0]===after):-1;if(i>=0)c[1].splice(i+1,0,item);else c[1].push(item);};
    if(has('train')){add('Takım',['train','Antrenman',{tab:'train'}],'taktik');add('Takım',['prep','Maç hazırlığı',{tab:'prep'}],'train');}
    if(has('loans'))add('Transfer',['loans','Kiralıklar',{tab:'loans'}]);if(has('fin'))add('Kulüp',['fin','Finans',{tab:'fin'}]);if(has('awards'))add('Rekabet',['awards','Ödüller',{tab:'awards'}]);
    const k=C.find(x=>x[0]==='Kulüp');if(k)k[1]=k[1].map(x=>x[0]==='board'&&G.mode==='mgr'?['board','Yönetim',x[2]]:x);}catch(e){console.warn(e);}return C;})(navCats);
const NICON2={train:XICON.train,prep:XICON.prep,fin:XICON.fin,awards:XICON.awards,loans:XICON.loans};Object.assign(NICON,NICON2);

