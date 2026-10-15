/* ================= v124: kariyer sekmesi — meslek kariyerleri kendi diliyle; arşivdeki diğer kariyerler ayrı karakter olarak =================
   Sorun: hakem/doktor/gözlemci kariyerlerinde “Seçmelerin ardından … altyapısına imza attı”, maç-gol şeridi ve kulüp yolculuğu gibi futbolcu bilgileri
   görünüyordu; “Geçmiş kariyerler” de oyunun başka karakterlerini bu karakterin geçmişiymiş gibi gösteriyordu. */
function carKind(){try{if(isPl&&isPl())return 'pl';}catch(e){}return G.mode==='mgr'?'mgr':'staff';}
function carProf(){return G.prof||(G.mode==='mgr'?'td':'oyuncu');}
function carProfN(p){return (PROF[p]&&PROF[p].n)||({oyuncu:'Futbolcu',td:'Teknik direktör',ref:'Hakem'}[p])||'Kariyer';}
function carProfIc(p){return (PROF[p]&&PROF[p].ic)||'•';}
/* anlık görüntü: gerçek isim, meslek ve meslek istatistikleri */
careerSnap=(old=>function(){const s=old.apply(this,arguments);try{s.name=(G.p&&G.p.name)||s.name;s.prof=carProf();s.kind=carKind();s.profN=carProfN(s.prof);
  if(s.kind==='staff'){const j=G.job||{};s.st={title:j.title||'',lvl:j.lvl||0,seasons:j.seasons||0,rep:Math.round(j.rep||0),rn:j.rn||0,rg:j.rgood||0,rb:j.rbad||0,ref:G.staff==='ref',avg:(j.rlog&&j.rlog.length)?Math.round(j.rlog.reduce((a,x)=>a+(x.rt||0),0)/j.rlog.length*10)/10:0};
    s.status=G.phase==='retired'?`Emekli ${carProfN(s.prof).toLocaleLowerCase('tr-TR')}`:(j.title||carProfN(s.prof));}}catch(e){}return s;})(careerSnap);
/* kariyer anları: meslek kariyerinde futbolcu altyapısı cümlesi yerine doğru başlangıç; hakemde maç atamaları “yeni görev” sayılmaz; terfiler kaydedilir */
msSync=(old=>function(){try{if(G&&G.p&&G.msS&&carKind()==='staff'&&G.staff==='ref')G.msS.club=G.club;}catch(e){}const r=old.apply(this,arguments);
  try{if(!G||!G.ms||carKind()==='pl')return r;const j=G.job||{},cn=CLUBS[G.club]?CLUBS[G.club].name:'';
    for(let i=0;i<G.ms.length;i++){const m=G.ms[i];if(m.ic==='start'&&/^Seçmelerin ardından/.test(m.t)){m.t=G.staff==='ref'?'Hakemliğe başladı':carKind()==='mgr'?'Teknik direktörlüğe başladı':`${carProfN(carProf())} olarak kariyerine başladı`;m.ic='td';const nx=G.ms[i+1];if(nx&&nx.y)m.y=nx.y;}}
    if(G.staff==='ref')G.ms=G.ms.filter((m,i)=>!(m.ic==='td'&&/^Yeni görev: /.test(m.t)&&i>1));
    if(G.msS)G.msS.title=j.title||'';}catch(e){}return r;})(msSync);
/* sezon sonu: meslek kariyerinde sezonun unvanı ve puanı geçmişe yazılsın */
staffSeasonEnd=(old=>function(){const r=old.apply(this,arguments);try{const h=G.history[G.history.length-1];if(h&&h.pos==='ST'){h.title=(G.job&&G.job.title)||'';h.sc=G.summary&&G.summary.score;if(G.staff==='ref'){h.rn=G.job.rn||0;h.rg=G.job.rgood||0;h.rb=G.job.rbad||0;}}}catch(e){}return r;})(staffSeasonEnd);
function snapKind(s){if(s.kind)return s.kind;const st=String(s.status||'');return /direktör/.test(st)?'mgr':/futbolcu|^Emekli$/.test(st)?'pl':'staff';}
function staffCareerHTML(s,live){const st=s.st||{},c=CLUBS[s.club]||{c1:'#2a8c4a',c2:'#fff'},ref=!!st.ref,pf=s.prof||'',ms=(s.ms||[]).slice().reverse();
  const head=`<section class="panel car-hd"><div class="car-av">${avatarSVG(c.c1,c.c2,ref?'H':'',s.age)}</div><div><span class="kicker">${carProfIc(pf)} ${esc(carProfN(pf))} · ${esc(s.status||'')}</span><h3>${esc(s.name||'')}</h3><small>${s.from}${s.to&&s.to!==s.from?' – '+s.to:''} · ${s.age} yaş</small></div></section>`;
    const strip=ref?`<div><b>${st.rn||0}</b><span>Maç</span></div><div><b>${st.avg?dec(st.avg,1):'—'}</b><span>Ort. maç notu</span></div><div><b>${st.rg||0}</b><span>İyi maç (8,3+)</span></div><div><b>${st.rb||0}</b><span>Zayıf maç (&lt;7)</span></div><div><b>${(s.trophies||[]).length}</b><span>Terfi/ödül</span></div>`
    :`<div><b>${st.seasons||0}</b><span>Sezon</span></div><div><b>${st.rep||0}</b><span>İtibar</span></div><div><b>${(s.trophies||[]).filter(t=>/^Terfi/.test(t.n)).length}</b><span>Terfi</span></div><div><b>${(s.trophies||[]).length}</b><span>Ödül</span></div>`;
  const rows=(s.seasons||[]).slice().reverse();
  const tbl=`<section class="panel"><p class="sub-h"><span>Sezonlar</span><span>${rows.length}</span></p>${rows.length?`<div class="tbl-wrap"><table><thead><tr><th class="l">Sezon</th><th>Yaş</th>${ref?'':'<th class="l">Kulüp</th>'}<th class="l">Görev</th>${ref?'<th>Maç</th><th>İyi/Zayıf</th>':''}<th>Puan</th></tr></thead><tbody>${rows.map(h=>`<tr><td class="l">${esc(h.y)}</td><td>${h.a}</td>${ref?'':`<td class="l club">${CLUBS[h.c]?crestSVG(CLUBS[h.c],16):''}<span>${esc(CLUBS[h.c]?CLUBS[h.c].name:'')}</span></td>`}<td class="l">${esc(h.t||'—')}</td>${ref?`<td>${h.rn||0}</td><td>${h.rg||0}/${h.rb||0}</td>`:''}<td>${h.sc!=null?h.sc:'—'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">İlk sezonun bitince burada görünecek.</p>'}</section>`;
  const tl=`<section class="panel"><p class="sub-h"><span>Kariyer anları</span><span>${ms.length}</span></p>${ms.length?`<ol class="tline">${ms.slice(0,live?60:200).map(m=>`<li class="ms-${m.ic}"><i>${MS_IC[m.ic]||'•'}</i><div><b>${esc(m.t)}</b><small>${esc(m.y)} · ${m.a} yaş</small></div></li>`).join('')}</ol>`:'<p class="muted">Kariyerinin önemli anları burada birikecek.</p>'}</section>`;
  const tr=`<section class="panel"><p class="sub-h"><span>Terfiler ve ödüller</span></p>${(s.trophies||[]).length?`<ul class="trophies">${s.trophies.map(x=>`<li><i>${x.y}</i>${esc(x.n)}${!ref&&CLUBS[x.c]?' · '+esc(CLUBS[x.c].name):''}</li>`).join('')}</ul>`:'<p class="muted">Henüz yok.</p>'}</section>`;
  return head+`<section class="panel"><div class="strip">${strip}</div></section>`+tl+tbl+tr;}
/* geçmiş sezon satırlarına görev/puan ekle (careerSnap seasons alanı) */
careerSnap=(old=>function(){const s=old.apply(this,arguments);try{if(s.kind==='staff')s.seasons=G.history.map((h,i)=>Object.assign(s.seasons[i]||{},{t:h.title||'',sc:h.sc,rn:h.rn,rg:h.rg,rb:h.rb}));}catch(e){}return s;})(careerSnap);
careerHTML=(old=>function(s,live){try{if(s&&snapKind(s)==='staff')return staffCareerHTML(s,live);}catch(e){console.warn('staffCareerHTML',e);}return old.apply(this,arguments);})(careerHTML);
/* sekme: “Diğer kariyerlerim” — her biri ayrı karakter */
viewCareer=(old=>function(){let h=old.apply(this,arguments);try{h=h.replace(/>Geçmiş kariyerler(<em>|<\/button>| <em>)/,'>Diğer kariyerlerim$1');
  if(CTAB==='arc'){const arc=archList().filter(a=>a.id!==G.cid);if(arc.length){const list=`<p class="muted arc-note">Bunlar bu cihazda oynadığın <b>başka kariyerler</b>; her biri ayrı bir karakterdir, ${esc((G.p&&G.p.name)||'bu karakter')}in geçmişi değildir.</p><ul class="arcs">${arc.map(a=>{const k=CLUBS[a.club],kd=snapKind(a),pf=a.prof||(kd==='mgr'?'td':kd==='pl'?'oyuncu':'');const st=a.st||{};
      const line=kd==='staff'?(st.ref?`${st.rn||0} maç · ort. not ${st.avg?dec(st.avg,1):'—'}`:`${st.seasons||0} sezon · itibar ${st.rep||0}`):kd==='mgr'?`${a.totals.apps?`${a.totals.apps} maç · ${a.totals.goals} gol · `:''}${a.mt&&a.mt.s?`${a.mt.s} sezon ${pf==='sd'?'sportif direktör':pf==='bsk'?'kulüp başkanı':'teknik direktör'} · `:''}${a.trophies.length} ödül`:`${a.totals.apps} maç · ${a.totals.goals} gol · ${a.trophies.length} ödül${a.mt&&a.mt.s?` · ${a.mt.s} sezon TD`:''}`;
      return `<li><button class="arc" data-act="arcOpen" data-id="${a.id}">${k&&!st.ref?crestSVG(k,34):`<span class="arc-ic">${carProfIc(pf)}</span>`}<div><b>${esc(a.name||'')} <small class="arc-pf">${carProfIc(pf)} ${esc(carProfN(pf))}</small></b><small>${a.from}${a.to&&a.to!==a.from?' – '+a.to:''} · ${esc(a.status)}</small><span>${line}</span></div></button></li>`;}).join('')}</ul>`;
      h=h.replace(/<ul class="arcs">[\s\S]*<\/ul>/,list);}
    else h=h.replace(/Henüz tamamlanmış bir kariyer yok\.[^<]*/,'Bu cihazda başka bir kariyer yok. Yeni bir kariyere başladığında ya da emekli olduğunda kariyer burada ayrı bir karakter olarak saklanır.');}}catch(e){console.warn('viewCareer',e);}return h;})(viewCareer);

