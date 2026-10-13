/* ================= v81: oyuncu profili › Kariyer sekmesi — "Kariyerim" ekranı düzeninde, bütün oyuncular için ================= */
/* ---------- sezon sonu lig şampiyonları kaydı (her ülkenin en üst ligi + oynadığımız lig + simüle edilmiş ligler) ---------- */
function chmTops(){const best={};for(const [id,L] of Object.entries(LEAGUES)){if(L.youth)continue;const cc=L.cc||id;if(!best[cc]||L.tier>LEAGUES[best[cc]].tier)best[cc]=id;}return Object.values(best);}
function chmRecord(prev){try{if(!prev||!prev.year)return;const yl=seasonLabel(prev.year);G.chm=G.chm||{};if(G.chm[yl])return;const ids=new Set(chmTops());if(prev.league&&!LEAGUES[prev.league].youth)ids.add(prev.league);for(const k of Object.keys(prev.ol||{}))ids.add(k);
  const R={};for(const lid of ids){if(!LEAGUES[lid]||LEAGUES[lid].youth)continue;try{if(lid===prev.league&&!(prev.results&&prev.results.length))continue;const T=lgFinalTable(lid,prev);if(T&&T[0]&&T[0].id)R[lid]=T[0].id;}catch(e){}}
  G.chm[yl]=R;const ks=Object.keys(G.chm).sort();while(ks.length>40)delete G.chm[ks.shift()];}catch(e){console.warn(e);}}
newSeason=(old=>function(year){const prev=G&&G.s;try{if(prev&&prev.year===year-1&&G.phase!=='tryout')chmRecord(prev);}catch(e){}return old.apply(this,arguments);})(newSeason);

/* ---------- veri ---------- */
function krData(p){const C=careerOf(p),rows=C.rows.slice().sort((a,b)=>a.y-b.y),now=G.s?G.s.year:2026,ageAt=y=>p.age-(now-y),cl=id=>{const c=clubObj(id);return c?c.name:'?';};
  const tot=rows.reduce((a,x)=>{a.ap+=x.ap||0;a.g+=x.g||0;a.a+=x.a||0;return a;},{ap:0,g:0,a:0});
  /* kulüp yolculuğu: art arda aynı kulüp tek durak */
  const path=[];for(const r of rows){const l=path[path.length-1];if(l&&l.cid===r.cid&&!!l.loan===!!r.loan){l.to=r.y;l.ap+=r.ap||0;l.g+=r.g||0;l.a+=r.a||0;}else path.push({cid:r.cid,from:r.y,to:r.y,ap:r.ap||0,g:r.g||0,a:r.a||0,loan:!!r.loan});}
  /* kupalar ve ödüller */
  const tro=[];
  for(const r of rows){if(!(r.ap>0))continue;const yl=seasonLabel(r.y),M=G.chm&&G.chm[yl];if(M)for(const [lid,cid] of Object.entries(M))if(cid===r.cid&&LEAGUES[lid])tro.push({y:yl,yr:r.y,n:`${LEAGUES[lid].short} şampiyonu`,c:cid,ic:'cup'});}
  for(const A of Object.values(G.awards||{})){const yr=parseInt(A.y,10)||0,cc=x=>x&&x.c;
    if(A.po&&A.po.k===p.k)tro.push({y:A.y,yr,n:`${A.lg} · yılın oyuncusu`,c:cc(A.po),ic:'aw'});if(A.gk&&A.gk.k===p.k)tro.push({y:A.y,yr,n:`${A.lg} · gol kralı (${A.gk.g})`,c:cc(A.gk),ic:'aw'});
    if(A.ak&&A.ak.k===p.k)tro.push({y:A.y,yr,n:`${A.lg} · asist kralı (${A.ak.a})`,c:cc(A.ak),ic:'aw'});if(A.yg&&A.yg.k===p.k)tro.push({y:A.y,yr,n:`${A.lg} · yılın genci`,c:cc(A.yg),ic:'aw'});
    const xi=(A.xi||[]).find(x=>x.k===p.k);if(xi)tro.push({y:A.y,yr,n:`${A.lg} · yılın 11'i`,c:xi.c,ic:'aw'});const b=(A.bdo||[]).findIndex(x=>x.k===p.k);if(b===0)tro.push({y:A.y,yr,n:'Altın Top',c:A.bdo[0].c,ic:'gold'});else if(b>0)tro.push({y:A.y,yr,n:`Altın Top ${b+1}.`,c:A.bdo[b].c,ic:'aw'});}
  tro.sort((a,b)=>b.yr-a.yr);
  /* kariyer anları */
  const ms=[],add=(y,t,ic,o)=>ms.push(Object.assign({y,t,ic,a:ageAt(y)},o||{}));
  if(rows.length){const f=rows.find(r=>r.ap>0)||rows[0];add(f.y,`Profesyonel kariyerine ${cl(f.cid)} formasıyla başladı`,'start');}
  for(const e of C.tx){if(e.loan)add(e.y,`Kiralık: ${cl(e.to)}`,'loan');else if(e.ret)add(e.y,`Kiralık dönüşü: ${cl(e.to)}`,'loan');else add(e.y,`${cl(e.from)} → ${cl(e.to)}${e.free?' · bonservissiz':e.fee&&!e.nd?' · '+eur(e.fee):''}`,'tr');}
  let ca=0,cg=0;const AP=[50,100,150,200,300,400,500,600,700],GL=p.pos==='KL'?[]:p.pos==='DF'?[10,25,50,75,100]:[10,25,50,100,150,200,250,300,400,500];
  for(const r of rows){const a0=ca,g0=cg;ca+=r.ap||0;cg+=r.g||0;for(const m of AP)if(a0<m&&ca>=m)add(r.y,`${m}. resmi maçına çıktı`,'apps');for(const m of GL)if(g0<m&&cg>=m)add(r.y,m===10&&g0===0?'İlk golünü attı':`Kariyerinde ${m}. golünü attı`,'goal');}
  const best=rows.filter(r=>!r.cur&&r.ap>=10).sort((a,b)=>(b.g-a.g)||(b.rt-a.rt))[0];if(best&&best.g>=8&&p.pos!=='KL')add(best.y,`En golcü sezonu: ${best.g} gol · ${cl(best.cid)}`,'goal',{hi:1});
  const caps=fmCaps(p);if(caps){const dy=Math.max(rows.length?rows[0].y:now,now-Math.max(0,Math.round(caps[0]/7)));add(dy,`Milli formayla ilk maçına çıktı`,'nat');}
  for(const t of tro)add(t.yr,`${t.n}${CLUBS[t.c]?' · '+CLUBS[t.c].short:''}`,'cup');
  const o=x=>({start:0,tr:1,loan:1,nat:2,apps:3,goal:4,cup:5})[x.ic]||6;ms.sort((a,b)=>(b.y-a.y)||(o(b)-o(a)));
  let peak=0;try{for(const q of progData(p).pts)peak=Math.max(peak,q[1]);}catch(e){}peak=Math.max(peak,p.ovr||0);
  return {C,rows,tot,path,tro,ms,caps,peak,from:rows.length?rows[0].y:now};}

/* ---------- görünüm ---------- */
pCareerHTML=function(p){let D;try{D=krData(p);}catch(e){console.warn(e);return '';}const {C,tot,path,tro,ms,caps}=D;if(!D.rows.length&&!C.tx.length)return '';
  const cid=(G.tx&&G.tx[p.k])||p.club||p.home,c=clubObj(cid)||{c1:'#2a8c4a',c2:'#fff',name:''},now=G.s?G.s.year:2026,dead=p.alive===false;
  const crest=id=>{const k=clubObj(id);return k?crestSVG(k,24):'<i class="kr-dot"></i>';},lg=id=>{const k=CLUBS[id];return k&&LEAGUES[k.league]?esc(LEAGUES[k.league].short):'';};
  let face='';try{face=faceSVG(lookOf(p.k,p.nat,p.age),{c1:c.c1,c2:c.c2,num:p.num});}catch(e){}
  const head=`<div class="kr2-hd"><div class="kr2-av">${face}</div><div><span class="kicker">${dead?'Futbolu bıraktı':'Aktif futbolcu'} · ${esc(POS_TR[p.pos]||'')}</span><h3>${esc(p.name)}</h3><small>${seasonLabel(D.from)} – ${dead?'':'günümüz'}${dead?'':' · '}${p.age} yaş · zirve ${R200(D.peak)} güç${c.name?` · ${esc(c.name)}`:''}</small></div></div>`;
  const strip=`<div class="strip kr2-st"><div><b>${tot.ap}</b><span>Maç</span></div><div><b>${p.pos==='KL'?'–':tot.g}</b><span>Gol</span></div><div><b>${tot.a}</b><span>Asist</span></div><div><b>${caps?caps[0]:0}</b><span>Milli</span></div><div><b>${tro.length}</b><span>Ödül</span></div></div>`;
  const pth=`<section class="panel kr2-p"><p class="sub-h"><span>Kulüp yolculuğu</span><span>${path.length} durak</span></p><ol class="cpath">${path.slice().reverse().map(x=>{const k=clubObj(x.cid);return `<li>${crest(x.cid)}<div><b>${esc(k?k.name:'?')}${x.loan?' <u class="rt r-ln">kiralık</u>':''}</b><small>${x.from===x.to?seasonLabel(x.from):seasonLabel(x.from)+' – '+seasonLabel(x.to)}${lg(x.cid)?' · '+lg(x.cid):''}</small></div><em>${x.ap}M ${p.pos==='KL'?'':x.g+'G'}</em></li>`;}).join('')}</ol></section>`;
  const trp=`<section class="panel kr2-p"><p class="sub-h"><span>Kupalar ve ödüller</span><span>${tro.length||''}</span></p>${tro.length?`<ul class="trophies">${tro.map(t=>`<li><i>${esc(t.y)}</i>${t.ic==='gold'?'🥇 ':''}${esc(t.n)}${CLUBS[t.c]?' · '+esc(CLUBS[t.c].name):''}</li>`).join('')}</ul>`:`<p class="muted">${C.real?'Oyun öncesi kupaları kayıtlı değil; oyun içinde kazandığı lig şampiyonlukları ve sezon ödülleri burada birikir.':'Henüz kupa ya da bireysel ödül yok.'}</p>`}</section>`;
  const tl=`<section class="panel kr2-p"><p class="sub-h"><span>Kariyer anları</span><span>${ms.length}</span></p><ol class="tline">${ms.slice(0,60).map(m=>`<li class="ms-${m.ic}"><i>${MS_IC[m.ic]||'•'}</i><div><b>${esc(m.t)}</b><small>${seasonLabel(m.y)} · ${m.a} yaş</small></div></li>`).join('')}</ol></section>`;
  const sum=D.rows.reduce((a,x)=>{a.rt+=(x.rt||0)*(x.ap||0);return a;},{rt:0});
  const rws=D.rows.slice().reverse().map(x=>`<tr class="${x.cur?'cur':''}"><td class="l">${seasonLabel(x.y)}${x.cur?' <em>sürüyor</em>':''}</td><td>${p.age-(now-x.y)}</td><td class="l club">${clubObj(x.cid)?crestSVG(clubObj(x.cid),14):''}<span>${esc((clubObj(x.cid)||{}).short||'')}</span>${x.loan?'<i class="kr-loan">kiralık</i>':''}</td><td class="l">${lg(x.cid)}</td><td>${x.ap}</td><td>${p.pos==='KL'?'–':x.g}</td><td>${x.a}</td><td>${x.ap&&x.rt?(+x.rt).toFixed(2):'–'}</td></tr>`).join('');
  const tbl=`<section class="panel kr2-p"><p class="sub-h"><span>Sezonlar</span><span>${C.real?'oyun öncesi istatistikler tahmini':D.rows.some(x=>x.pre)?'oyun öncesi sezonlar tahmini':'oyun içi kayıt'}</span></p><div class="tbl-wrap"><table class="kr-t"><thead><tr><th class="l">Sezon</th><th>Yaş</th><th class="l">Kulüp</th><th class="l">Lig</th><th>M</th><th>G</th><th>A</th><th>Ort</th></tr></thead><tbody>${rws}</tbody>
   <tfoot><tr><td class="l" colspan="4">Kariyer toplamı</td><td>${tot.ap}</td><td>${p.pos==='KL'?'–':tot.g}</td><td>${tot.a}</td><td>${tot.ap?(sum.rt/tot.ap).toFixed(2):'–'}</td></tr></tfoot></table></div></section>`;
  const txr=C.tx.map(e=>`<li><span class="kr-y">${seasonLabel(e.y)}</span><span class="kr-c">${clubObj(e.from)?crestSVG(clubObj(e.from),14):''}<span>${esc((clubObj(e.from)||{}).short||'')}</span><b>→</b>${clubObj(e.to)?crestSVG(clubObj(e.to),14):''}<span>${esc((clubObj(e.to)||{}).short||'')}</span></span><em class="${e.loan?'ln':e.ret?'rt':e.free?'fr':'fe'}">${e.loan?'Kiralık':e.ret?'Kiralıktan dönüş':e.free?'Bonservissiz':e.nd||!e.fee?'Bedel açıklanmadı':eur(e.fee)}</em></li>`).join('');
  const txs=`<section class="panel kr2-p"><p class="sub-h"><span>Transferler</span><span>${C.tx.length||''}</span></p>${txr?`<ul class="kr-tx">${txr}</ul>`:'<p class="muted">Kariyeri boyunca tek kulüpte.</p>'}</section>`;
  /* "Kariyer geçmişi" başlığı eski eklemelerin (gelişim grafiği) yerleşmesi için çapa olarak kalıyor */
  return `<section class="fmp-krx kr2">${head}${strip}<div class="kr2-g"><div>${tl}</div><div>${pth}${trp}</div></div><p class="fmp-sec">Kariyer geçmişi <small>· sezon sezon</small></p>${tbl}${txs}</section>`;};
/* eski "Ödüller" etiketleri artık Kupalar ve ödüller panelinde: tekrarı kaldır */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{if(h.indexOf('kr2')>=0)h=h.replace(/<p class="fmp-sec">Ödüller<\/p><div class="aw-tags">[\s\S]*?<\/div>/,'');}catch(e){}return h;})(fmProfHTML);

