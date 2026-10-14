/* ================= v144: futbolcu maç sonu ekranı — diğer mesleklerdeki gibi iki takımın reytingleri, goller, istatistik; teknik ekip raporu ayrı pencerede =================
   - Pozisyon ve klasik modda maç bitince maç ekranında: kısa özet (notun + gelecek maç durumu), goller, maçın oyuncusu, istatistikler,
     iki takımın ilk 11 reytingleri (stMatchSheet ile aynı görünüm: ms-*). Bizim oyuncu vurgulanır; notu pozisyon/klasik notudur.
   - Diğer 21 oyuncunun reytingi bu maç için tohumlanmış rastgeleyle, skor ve gollere göre üretilir (oyun içi simülasyon; gerçek veri değildir).
   - "📋 Teknik ekip raporu" (Maç sonu düğmesinin yanında, sonuç penceresinde ve hocanın gelen kutusu mesajında) ayrıntılı raporu açar:
     not dairesi, gelecek maç kararı, hocanın yorumu, hedefler, talimat uyumu, an an not dökümü. Son 6 rapor G.p.pzReps'te saklanır. */

/* ---------- gol dakikaları: skor değiştikçe kaydedilir ---------- */
const ftOn=()=>typeof MR!=='undefined'&&MR&&isPl()&&!MR.f3&&!MR.pro&&MR.us&&MR.opp;
renderBoard=(old=>function(){const r=old.apply(this,arguments);try{if(ftOn()){const t=MR._gt||(MR._gt={gu:0,go:0,g:0,a:0,L:[]}),m=clamp(MR.min||1,1,90+(MR.min>90?MR.min-90:0));
    while(t.gu<MR.gu){t.gu++;const me=MR.goals>t.g,as=!me&&MR.assists>t.a;if(me)t.g++;if(as)t.a++;t.L.push({s:0,m,me,as});}
    while(t.go<MR.go){t.go++;t.L.push({s:1,m});}}}catch(e){}return r;})(renderBoard);

/* ---------- klasik modda an kaydı ve not (pozisyon modundaki döküm ile aynı biçim) ---------- */
let FT_CLT=null;
runChance=(old=>function(e){try{if(e&&!PZ.on)FT_CLT=e.type;}catch(x){}return old.apply(this,arguments);})(runChance);
applyChance=(old=>function(res,m){if(!ftOn()||PZ.on||!res)return old.apply(this,arguments);const R=RES[res.code]||{adj:0},yc0=MR.yc,rc0=MR.rc;const r=old.apply(this,arguments);
  try{const ev=[{t:PZ_LBL[res.code]||R.t,v:R.adj}];if(res.bonus)ev.push({t:'Topu geri kazandı',v:res.bonus});if(res.code==='tmMiss'&&res.fromMe)ev.push({t:'Kilit pas',v:0.1});
    if(MR.yc>yc0)ev.push({t:MR.rc>rc0?'İkinci sarıdan kırmızı':'Sarı kart',v:MR.rc>rc0?-1.3:-0.3});else if(MR.rc>rc0)ev.push({t:'Kırmızı kart',v:-1});
    (MR._clog=MR._clog||[]).push({m,n:CH_NAME[FT_CLT]||'An',ev});}catch(e){}return r;})(applyChance);
function ftClassicFinal(){const played=MR.role==='start'||(MR.entry&&MR.events.some(e=>e.k==='in')&&MR.end>=MR.entry&&!(MR.out&&MR.outMin&&MR.outMin<MR.entry));
  const startMin=MR.role==='start'?0:MR.entry,mins=Math.max(1,(MR.outMin||90)-startMin),win=MR.gu>MR.go,draw=MR.gu===MR.go,res=win?0.35:draw?0.05:-0.25;
  const noise=gauss()*0.18+(mins<25?-0.1:0),rt=Math.round(clamp(6.0+res+MR.adj+noise,3,10)*10)/10;
  const comment=!played?'Bugün sana süre veremedim. Antrenmanda kendini göster.':rt>=8?'Bugün fark yarattın. Bravo!':rt>=6.8?'İyi maçtı, böyle devam.':rt>=6?'Ortalama bir maç. Daha fazlasını bekliyorum.':'Bu performans yetmez. Hatalarını videoda konuşacağız.';
  PZ.log=MR._clog||[];PZ.league=!MR.national&&/Hafta/.test(MR.comp||'');PZ.obj=[];
  PZ.fin={rating:rt,played,mins,res,noise:Math.round((rt-6-res-MR.adj)*100)/100,end:[],okN:0,objN:0,obj:[],comp:{ok:0,bad:0},compRate:1,compN:0,trustD:0,comment,grp:pzGrp(),classic:1};
  PZ.fin.next=pzProject(rt,played);
  const onEnd=MR.onEnd;MR.onEnd=r=>{try{if(PZ.fin&&r&&r.played){r.rating=PZ.fin.rating;r.pz=PZ.fin;}}catch(e){}return onEnd(r);};}

/* ---------- 21 oyuncunun reytingi ve maç istatistikleri (bu maça tohumlanmış) ---------- */
const FT_ORD=['KL','DF','OS','KN','FW'];
function ftTeam(club,gf,ga,win,draw,r,goals,side){if(!CLUBS[club.id])return null;const sq=squadOf(club.id),xi=autoXI(sq).map(k=>sq.find(q=>q.k===k)).filter(Boolean);if(!xi.length)return null;
  const avg=xi.reduce((a,p)=>a+p.ovr,0)/xi.length,rows=xi.map(p=>({p,name:p.name,pos:p.pos,cid:club.id,k:p.k,g:0,a:0}));
  if(side===0){const z=PZ.fin,me={me:1,name:meN(),pos:G.p.pos,g:MR.goals,a:MR.assists,rt:z&&z.played?z.rating:null,sub:MR.role!=='start'};
    if(me.rt!=null){if(MR.role==='start'){let i=rows.map((x,j)=>[x,j]).filter(([x])=>x.pos===G.p.pos).sort((a,b)=>a[0].p.ovr-b[0].p.ovr)[0];if(!i)i=[rows[rows.length-1],rows.length-1];rows[i[1]]=me;}else{me.inM=MR.entry;rows.push(me);}}}
  /* goller ve asistler */
  const pool=rows.filter(x=>!x.me&&x.pos!=='KL');for(const g of goals){if(g.s!==side)continue;let sc=null;if(side===0&&g.me)sc=rows.find(x=>x.me);
    if(!sc&&pool.length)sc=wpick(pool.map(x=>[x,(GWP[x.pos]||0.1)*Math.max(0.3,((x.p?x.p.ovr:60)-55)/10)]));if(!sc)continue;sc.g+=sc.me?0:1;g.n=sc.name;g.k=sc.k;g.cid=sc.cid;g.mine=!!sc.me;
    let as=null;if(side===0&&g.as)as=rows.find(x=>x.me);else if(r()<0.7){const c=pool.filter(x=>x!==sc);if(c.length)as=c[Math.floor(r()*c.length)];}if(as){if(!as.me)as.a++;g.an=as.name;}}
  for(const x of rows){if(x.me)continue;let rt=6.4+(win?0.35:draw?0:-0.35)+x.g*0.9+x.a*0.5+((x.p?x.p.ovr:avg)-avg)*0.03+(r()-0.5)*0.9;if(x.pos==='KL')rt+=ga===0?0.6:-ga*0.25;if(x.pos==='DF')rt+=ga===0?0.3:-ga*0.12;x.rt=clamp(Math.round(rt*10)/10,4.5,10);}
  return rows.filter(x=>x.rt!=null).sort((a,b)=>FT_ORD.indexOf(a.pos)-FT_ORD.indexOf(b.pos));}
function ftStats(r,gu,go){const dS=(MR.us.str-MR.opp.str);const pos=clamp(Math.round(50+dS*0.8+(r()-0.5)*12),28,72);
  const sh=s=>{const on=s.g+Math.floor(r()*3)+1;return {on,t:on+2+Math.floor(r()*6)};},su=sh({g:gu}),so=sh({g:go});
  return [['Topa sahip olma',pos+'%',(100-pos)+'%'],['Şut',su.t,so.t],['İsabetli şut',su.on,so.on],['Korner',1+Math.floor(r()*7),1+Math.floor(r()*7)],['Faul',8+Math.floor(r()*9),8+Math.floor(r()*9)],
    ['Sarı kart',(MR.yc?1:0)+Math.floor(r()*3),Math.floor(r()*4)],['Kırmızı kart',MR.rc||0,r()<0.05?1:0]];}

/* ---------- maç sonu ekranı ---------- */
const FT_NEXT={start:'start',sub:'sub',squad:'squad'};
function ftRender(){const z=PZ.fin;if(!z)return;let repBody='';const old=$('#pzFT');if(old){repBody=old.innerHTML;old.remove();}else{pzFT();const o2=$('#pzFT');if(o2){repBody=o2.innerHTML;o2.remove();}}
  if(z.classic)repBody=repBody.replace(/<div class="pz-objs">[\s\S]*?<\/div>/,'');
  FT_REP_CUR={t:`${MR.home.name} ${MR.usHome?MR.gu:MR.go}-${MR.usHome?MR.go:MR.gu} ${MR.away.name}`,html:repBody};z.repHTML=repBody;z.repT=FT_REP_CUR.t;
  const r=srnd(MR.us.id+'|'+MR.opp.id+'|'+(G.s?G.s.year+'.'+G.s.day:'')+'|ft'),goals=((MR._gt&&MR._gt.L)||[]).map(g=>Object.assign({},g));
  const win=MR.gu>MR.go,draw=MR.gu===MR.go,TU=ftTeam(MR.us,MR.gu,MR.go,win,draw,r,goals,0),TO=ftTeam(MR.opp,MR.go,MR.gu,MR.go>MR.gu,draw,r,goals,1),st=ftStats(r,MR.gu,MR.go);
  const H=MR.home,A=MR.away,hu=MR.usHome,all=(TU||[]).concat(TO||[]),motm=all.slice().sort((a,b)=>b.rt-a.rt)[0];
  const gl=goals.sort((a,b)=>a.m-b.m).map(g=>{const right=hu?g.s===1:g.s===0;const nm=g.n||(g.s===0?esc(MR.us.short||MR.us.name):esc(MR.opp.short||MR.opp.name));
    return `<li class="${right?'r':''}${g.mine?' me':''}"><i>${g.m}’</i>⚽ ${g.k&&g.cid?`<span class="plink" data-act="pcard" data-id="${g.cid}" data-k="${g.k}">${esc(nm)}</span>`:`<b>${esc(nm)}</b>`}${g.an?` <small>(asist: ${esc(g.an)})</small>`:''}</li>`;}).join('');
  const col=(T,c)=>T?`<div class="ms-col"><p class="sub-h"><span>${crestSVG(c,16)} ${esc(c.short||c.name)}</span><span>Reyting</span></p>${T.map(x=>`<div class="ms-r${x===motm?' motm':''}${x.me?' me':''}"><span>${x.pos}</span><b${x.k?` class="plink" data-act="pcard" data-id="${x.cid}" data-k="${x.k}"`:''}>${esc(x.name)}${x.inM?` <small>↑${x.inM}’</small>`:''}</b><small>${'⚽'.repeat(x.g)}${x.a?' 🅰'.repeat(x.a):''}</small><em class="${x.rt>=7.5?'hi':x.rt<6?'lo':''}">${x.rt.toFixed(1)}</em></div>`).join('')}</div>`
    :`<div class="ms-col"><p class="sub-h"><span>${esc(c.short||c.name)}</span><span>Reyting</span></p><p class="muted" style="font-size:12.5px">Kadro bilgisi yok.</p></div>`;
  const sH=hu?0:1,stats=`<table class="ft-st"><tbody>${st.map(([n,u,o])=>{const a=hu?u:o,b=hu?o:u;return `<tr><td>${a}</td><th>${n}</th><td>${b}</td></tr>`;}).join('')}</tbody></table>`;
  const nk=z.next&&FT_NEXT[z.next.role]||'',el=document.createElement('section');el.id='ftSheet';el.className='ft-sheet';
  el.innerHTML=`<div class="ft-sum"><span class="ft-rt ${z.played?(z.rating>=7.5?'hi':z.rating>=6.5?'mid':'lo'):'lo'}">${z.played?dec(z.rating):'—'}</span><div><b>${z.played?`Maç notun · ${G.p.pos==='KL'?'Kaleci':esc(pzRolName())}`:'Bu maçta süre almadın'}</b><small>${MR.goals?MR.goals+' gol · ':''}${MR.assists?MR.assists+' asist · ':''}${z.played?z.mins+'’':''}</small></div><span class="pz-chip ${nk}">${esc(z.next?z.next.t:'')}</span></div>
    ${gl?`<ul class="ms-goals">${gl}</ul>`:'<p class="muted" style="text-align:center;margin:6px 0">Golsüz maç</p>'}${motm?`<p class="ms-motm">⭐ Maçın oyuncusu: <b>${esc(motm.name)}</b> · ${motm.rt.toFixed(1)}</p>`:''}
    <p class="sub-h"><span>${crestSVG(H,14)} ${esc(H.short||H.name)}</span><span>İstatistik</span><span>${esc(A.short||A.name)} ${crestSVG(A,14)}</span></p>${stats}
    <div class="ms-cols">${hu?col(TU,MR.us)+col(TO,MR.opp):col(TO,MR.opp)+col(TU,MR.us)}</div>`;
  const bd=$('#mvBoard');if(bd)bd.insertAdjacentElement('afterend',el);
  const c=document.querySelector('#match .mv-ctrl');if(c&&!$('#ftRepBtn')){const b=document.createElement('button');b.id='ftRepBtn';b.type='button';b.className='btn';b.dataset.act='pzRep';b.textContent='📋 Teknik ekip raporu';const d=$('#mvDone');if(d)d.insertAdjacentElement('beforebegin',b);else c.appendChild(b);}
  const b=$('#ftRepBtn');if(b)b.hidden=false;}
let FT_REP_CUR=null;
mrFinish=(old=>function(){const pl=ftOn();let ok=pl;if(pl&&!PZ.on){try{ftClassicFinal();}catch(e){console.warn('maç sonu',e);ok=false;}}
  const r=old.apply(this,arguments);if(ok){try{ftRender();}catch(e){console.warn('maç sonu ekranı',e);}}return r;})(mrFinish);
closeMatchView=(old=>function(){const r=old.apply(this,arguments);try{const s=$('#ftSheet');if(s)s.remove();const b=$('#ftRepBtn');if(b)b.hidden=true;}catch(e){}return r;})(closeMatchView);

/* ---------- teknik ekip raporu penceresi ---------- */
function ftRepOpen(id){let R=null;try{if(id)R=(G.p.pzReps||[]).find(x=>x.id===id);if(!R&&FT_REP_CUR&&!id)R=FT_REP_CUR;if(!R){const L=G.p.pzLast;R=(G.p.pzReps||[]).find(x=>L&&x.id===L.rep)||null;}}catch(e){}
  const L=G.p&&G.p.pzLast,body=R&&R.html?R.html:(L?`<p>Maç notun <b>${dec(L.r)}</b>${L.n?` · talimat uyumu %${Math.round((L.c||0)*100)}`:''}. Bu maç için ayrıntılı döküm kaydedilmemiş.</p>`:'<p class="muted">Henüz bir maç raporu yok.</p>');
  openModal(`<h3>Teknik ekibin raporu — ${esc(meN())}</h3>${R&&R.t?`<p class="muted" style="margin:-4px 0 10px">${esc(R.t)}</p>`:''}<div class="pz-ft ft-rep">${body}</div><button class="cta" data-act="closeModal">Kapat</button>`);
  const mc=$('#modalCard');if(mc)mc.classList.add('wide');}
ACTX.pzRep=el=>ftRepOpen(el&&el.dataset?el.dataset.id:null);
applyPlayed=(old=>function(res){const r=old.apply(this,arguments);try{const z=res&&res.pz;if(z&&z.repHTML&&isPl()){const p=G.p,id=uid();p.pzReps=(p.pzReps||[]).concat([{id,t:z.repT||'',html:z.repHTML}]).slice(-6);if(p.pzLast)p.pzLast.rep=id;
    const m=G.inbox&&G.inbox.find(x=>x.title==='Hocanın maç değerlendirmesi'&&!x.pzRep);if(m)m.pzRep=id;}}catch(e){console.warn(e);}return r;})(applyPlayed);
msgHTML=(old=>function(m){let h=old(m);try{if(m&&(m.pzRep||(m.title==='Hocanın maç değerlendirmesi'))&&h.includes('msg-body')&&!h.includes('data-act="pzRep"'))
    h=h.replace('</p>',`</p><button class="btn sm ft-repl" type="button" data-act="pzRep"${m.pzRep?` data-id="${m.pzRep}"`:''}>📋 Teknik ekip raporu</button>`);}catch(e){}return h;})(msgHTML);
showResult=(old=>function(h,a,hg,ag,res){const r=old.apply(this,arguments);try{if(res&&res.pz&&res.played){const c=document.querySelector('#modalCard .cta[data-act=closeModal]');
    if(c&&!document.querySelector('#modalCard [data-act=pzRep]')){const id=G.p.pzLast&&G.p.pzLast.rep;c.insertAdjacentHTML('beforebegin',`<button class="btn ft-repl" type="button" data-act="pzRep"${id?` data-id="${id}"`:''}>📋 Teknik ekip raporu</button>`);}}}catch(e){}return r;})(showResult);
/* ---------- hata düzeltmesi: maç ekranı açıkken Space/Devam yeni maç başlatmasın ----------
   Maç ekranı (ön kart, anlatım, maç sonu) açıkken Space eskiden fmCont → "Maça çık" → aynı fikstür için yeni maç ve yeni "Maça çık" kartı açıyordu.
   Artık: ön kartta maçı başlatır, maç sonunda "Maç sonu"na basar, maç sürerken hiçbir şey yapmaz; oynanmakta olan maç varken yeni maç açılmaz. */
const ftMatchOpen=()=>{const m=$('#match');return !!(m&&!m.hidden);};
fmCont=(old=>function(){try{if(ftMatchOpen()){if(typeof TR!=='undefined'&&TR)return;const d=$('#mvDone');if(d&&!d.hidden){d.click();return;}if(PZ.on&&PZ.pre){pzGoStart();return;}return;}
  if(typeof MR!=='undefined'&&MR)return;}catch(e){}return old.apply(this,arguments);})(fmCont);
onPlay=(old=>function(sim){try{if((typeof MR!=='undefined'&&MR)||ftMatchOpen()){console.warn('Maç zaten açık; yeni maç başlatılmadı');return;}}catch(e){}return old.apply(this,arguments);})(onPlay);
