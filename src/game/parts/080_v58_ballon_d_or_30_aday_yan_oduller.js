/* ================= v58: Ballon d'Or — 30 aday, yan ödüller, geçmiş kazananlar ve canlı tören ================= */
const BDO_HIST=[[1956,'Stanley Matthews','Blackpool','ENG'],[1957,'Alfredo Di Stéfano','Real Madrid','ESP'],[1958,'Raymond Kopa','Real Madrid','FRA'],[1959,'Alfredo Di Stéfano','Real Madrid','ESP'],[1960,'Luis Suárez','Barcelona','ESP'],
 [1961,'Omar Sívori','Juventus','ITA'],[1962,'Josef Masopust','Dukla Prag','CZE'],[1963,'Lev Yaşin','Dinamo Moskova','RUS'],[1964,'Denis Law','Manchester United','SCO'],[1965,'Eusébio','Benfica','POR'],[1966,'Bobby Charlton','Manchester United','ENG'],
 [1967,'Flórián Albert','Ferencváros','HUN'],[1968,'George Best','Manchester United','NIR'],[1969,'Gianni Rivera','Milan','ITA'],[1970,'Gerd Müller','Bayern München','GER'],[1971,'Johan Cruyff','Ajax','NED'],[1972,'Franz Beckenbauer','Bayern München','GER'],
 [1973,'Johan Cruyff','Barcelona','NED'],[1974,'Johan Cruyff','Barcelona','NED'],[1975,'Oleg Blokhin','Dinamo Kiev','UKR'],[1976,'Franz Beckenbauer','Bayern München','GER'],[1977,'Allan Simonsen','Gladbach','DEN'],[1978,'Kevin Keegan','Hamburg','ENG'],
 [1979,'Kevin Keegan','Hamburg','ENG'],[1980,'Karl-Heinz Rummenigge','Bayern München','GER'],[1981,'Karl-Heinz Rummenigge','Bayern München','GER'],[1982,'Paolo Rossi','Juventus','ITA'],[1983,'Michel Platini','Juventus','FRA'],[1984,'Michel Platini','Juventus','FRA'],
 [1985,'Michel Platini','Juventus','FRA'],[1986,'Igor Belanov','Dinamo Kiev','UKR'],[1987,'Ruud Gullit','Milan','NED'],[1988,'Marco van Basten','Milan','NED'],[1989,'Marco van Basten','Milan','NED'],[1990,'Lothar Matthäus','Inter','GER'],
 [1991,'Jean-Pierre Papin','Marseille','FRA'],[1992,'Marco van Basten','Milan','NED'],[1993,'Roberto Baggio','Juventus','ITA'],[1994,'Hristo Stoichkov','Barcelona','BUL'],[1995,'George Weah','Milan','LBR'],[1996,'Matthias Sammer','Dortmund','GER'],
 [1997,'Ronaldo Nazário','Inter','BRA'],[1998,'Zinédine Zidane','Juventus','FRA'],[1999,'Rivaldo','Barcelona','BRA'],[2000,'Luís Figo','Real Madrid','POR'],[2001,'Michael Owen','Liverpool','ENG'],[2002,'Ronaldo Nazário','Real Madrid','BRA'],
 [2003,'Pavel Nedvěd','Juventus','CZE'],[2004,'Andriy Shevchenko','Milan','UKR'],[2005,'Ronaldinho','Barcelona','BRA'],[2006,'Fabio Cannavaro','Real Madrid','ITA'],[2007,'Kaká','Milan','BRA'],[2008,'Cristiano Ronaldo','Manchester United','POR'],
 [2009,'Lionel Messi','Barcelona','ARG'],[2010,'Lionel Messi','Barcelona','ARG'],[2011,'Lionel Messi','Barcelona','ARG'],[2012,'Lionel Messi','Barcelona','ARG'],[2013,'Cristiano Ronaldo','Real Madrid','POR'],[2014,'Cristiano Ronaldo','Real Madrid','POR'],
 [2015,'Lionel Messi','Barcelona','ARG'],[2016,'Cristiano Ronaldo','Real Madrid','POR'],[2017,'Cristiano Ronaldo','Real Madrid','POR'],[2018,'Luka Modrić','Real Madrid','CRO'],[2019,'Lionel Messi','Barcelona','ARG'],[2021,'Lionel Messi','PSG','ARG'],
 [2022,'Karim Benzema','Real Madrid','FRA'],[2023,'Lionel Messi','Inter Miami','ARG'],[2024,'Rodri','Manchester City','ESP'],[2025,'Ousmane Dembélé','Paris Saint-Germain','FRA']];
const BDO_HOSTS=[['Kate Scott','Ruud Gullit'],['Didier Drogba','Sandy Heribert']];
const bdoNo=y=>y-1956+1-(y>2020?1:0);
function bdoAll(){return G&&G.bdo?G.bdo:{};}
function bdoLastWinner(){const Y=Object.values(bdoAll()).sort((a,b)=>b.y-a.y)[0];return Y?Y.top[0].n:'Ousmane Dembélé';}
/* aday havuzu */
function bdoPool(){const S=G.s,rows=[],rt=x=>x.ap?x.rt/x.ap:0;let euW=null,euF=null;try{const B=euBoard('ucl');if(B&&B.champ){euW=B.champ;}}catch(e){}
  const lids=Object.keys(LEAGUES).filter(l=>!LEAGUES[l].youth&&LEAGUES[l].tier>=8);const posMap={};
  for(const lid of lids){let tb=null;try{tb=lid===S.league?table():tableOf(lid,olSync(lid).res);}catch(e){}if(!tb||!tb.length)continue;tb.forEach((r,i)=>posMap[r.id]=[i+1,tb.length,lid]);
    const big=['pl','ll','it1','de1','fr1'].includes(lid)?6:lid==='sa1'?-4:0;
    for(const c of leagueClubs(lid)){let M={};try{M=clubSeasonEst(c.id);}catch(e){}const pm=posMap[c.id]||[10,20];const team=pm[0]===1?12:pm[0]===2?6:pm[0]<=4?3:0;const eu=euW===c.id?16:0;
      for(const x of Object.values(M)){if(!x.ap||x.ap<12||!x.p||x.p.ovr<79)continue;const p=x.p,r=rt(x),gk=p.pos==='KL';
        const sc=p.ovr*1.15+(gk?(x.cs||0)*0.9+r*16:x.g*(p.pos==='FW'?0.85:1.05)+x.a*0.6+r*12)+team+eu+big+c.str*0.15;
        rows.push({k:p.k,n:p.name,c:c.id,nat:p.nat,pos:p.pos,age:p.age,g:x.g,a:x.a,ap:x.ap,r:+r.toFixed(2),cs:x.cs||0,ovr:p.ovr,sc});}}}
  if(isPl()&&G.p&&S.stats&&S.stats.apps>=10){const st=S.stats,pm=posMap[G.club]||[10,20],r=st.apps?st.rsum/st.apps:6.5,c=CLUBS[G.club],L=LEAGUES[c.league],big=['pl','ll','it1','de1','fr1'].includes(c.league)?6:L.tier>=8?0:-10;
    const sc=OVR()*1.15+st.goals*(G.p.pos==='FW'?0.85:1.05)+st.assists*0.6+r*12+(pm[0]===1?12:pm[0]===2?6:pm[0]<=4?3:0)+(euW===G.club?16:0)+big+c.str*0.15+(L.tier<8?-12:0);
    if(OVR()>=72||st.goals>=18)rows.push({k:'cenk',n:G.p.name||'Cenk Kuşku',c:G.club,nat:'TUR',pos:G.p.pos,age:G.p.age,g:st.goals,a:st.assists,ap:st.apps,r:+r.toFixed(2),cs:0,ovr:OVR(),sc,me:1});}
  return {rows:rows.sort((a,b)=>b.sc-a.sc),posMap,euW};}
function bdoCompute(){const S=G.s;if(!S||S.bdoDone)return null;S.bdoDone=1;const yl=seasonLabel(S.year),Y=S.year+1;G.bdo=G.bdo||{};const P=bdoPool(),rows=P.rows;if(rows.length<5)return null;
  const top=rows.slice(0,30),hi=top[0].sc,lo=top[top.length-1].sc,span=Math.max(1,hi-lo);
  top.forEach((x,i)=>{x.pts=Math.round(40+1300*Math.pow((x.sc-lo)/span,1.35)*(1-i*0.004));});for(let i=1;i<top.length;i++)if(top[i].pts>=top[i-1].pts)top[i].pts=top[i-1].pts-Math.max(1,Math.round(Math.random()*6));
  const kopa=rows.filter(x=>x.age<=21).sort((a,b)=>b.sc-a.sc).slice(0,3),yashin=rows.filter(x=>x.pos==='KL').sort((a,b)=>b.sc-a.sc).slice(0,3);
  const muller=rows.slice().sort((a,b)=>b.g-a.g||a.ap-b.ap).slice(0,3);
  /* Johan Cruyff: şampiyon kulüplerin hocaları, beklentiyi aşma */
  const coachC=[];for(const [id,[pos,n,lid]] of Object.entries(P.posMap)){if(pos!==1&&P.euW!==id)continue;const c=CLUBS[id];if(!c)continue;const ex=leagueClubs(lid).sort((a,b)=>b.str-a.str).findIndex(x=>x.id===id)+1;const L=LEAGUES[lid];
    const sc=(L.tier>=9?10:4)+(ex-1)*4+(P.euW===id?14:0)+c.str*0.1;const co=coachOf(id);coachC.push({n:co.n,nat:co.nat||'TUR',c:id,sc,me:!!co.me});}
  coachC.sort((a,b)=>b.sc-a.sc);const cruyff=coachC.slice(0,3);
  const clubW=P.euW||(coachC[0]&&coachC[0].c)||top[0].c;
  const pk=x=>x?{k:x.k,n:x.n,c:x.c,nat:x.nat,pos:x.pos,age:x.age,g:x.g,a:x.a,ap:x.ap,r:x.r,cs:x.cs,ovr:x.ovr,pts:x.pts,me:x.me?1:0}:null;
  const R={y:Y,season:yl,no:bdoNo(Y),top:top.map(pk),kopa:kopa.map(pk),yashin:yashin.map(pk),muller:muller.map(pk),cruyff,club:clubW,hosts:BDO_HOSTS[Y%BDO_HOSTS.length],pres:bdoLastWinner(),seen:0};
  G.bdo[yl]=R;
  /* mevcut ödül kaydıyla uyum */
  try{if(G.awards&&G.awards[yl])G.awards[yl].bdo=R.top.slice(0,5);}catch(e){}
  /* oyuncu ödülleri */
  if(isPl()){const i=R.top.findIndex(x=>x.me);if(i>=0){const p=G.p;p.fame=clamp(p.fame+(i===0?14:i<3?7:i<10?3:1),0,100);p.morale=clamp(p.morale+(i===0?15:i<10?5:2),0,100);
      if(i===0){G.trophies=G.trophies||[];G.trophies.push({name:'Ballon d’Or',year:yl});}
      msg('event',i===0?'BALLON D’OR SENİN!':`Ballon d’Or: ${i+1}. sıradasın`,i===0?`${yl} sezonunun en iyi oyuncusu seçildin! Paris’teki törende Altın Top’u kaldıracaksın.`:`${yl} Ballon d’Or oylamasında ${i+1}. oldun (${R.top[i].pts} puan). Törene davetlisin.`);}
    if(R.kopa.some((x,j)=>x.me&&j===0)){G.trophies=G.trophies||[];G.trophies.push({name:'Kopa Trophy',year:yl});}}
  if(G.mode==='mgr'&&R.cruyff[0]&&R.cruyff[0].me){G.trophies=G.trophies||[];G.trophies.push({name:'Johan Cruyff Trophy (TD)',year:yl});if(G.m)G.m.rep=clamp((G.m.rep||40)+6,0,100);}
  msg('gundem',`Ballon d’Or ${Y} adayları açıklandı`,`${R.no}. Ballon d’Or töreni Paris’te Théâtre du Châtelet’de yapılacak. Favoriler: ${R.top.slice(0,3).map(x=>x.n).join(', ')}. Töreni canlı izlemek için Ana sayfa ya da Ballon d’Or sayfasındaki “Törene katıl” düğmesini kullan.`);
  return R;}
seasonAwards=(old=>function(){const r=old.apply(this,arguments);try{bdoCompute();}catch(e){console.warn(e);}return r;})(seasonAwards);
/* ---------- Ballon d'Or sayfası ---------- */
let BDT='son';ACTX.bdTab=el=>{BDT=el.dataset.k;render();};
function bdoFace(x,size){try{if(x.me&&x.k==='cenk'){const age=G.p.age;const lk=Object.assign({},lookOf('cenk','TUR',age,true),{sk:'#a8704a',hs:'curly',hc:'#140d09',bd:age>=19?'stub':null,gl:false});return faceSVG(lk,{coach:true,c1:'#c9a227',c2:'#111',age});}
  const lk=lookOf(x.k||('co:'+x.n),x.nat||'TUR',x.age||30,true);return faceSVG(lk,{coach:true,c1:'#c9a227',c2:'#111',age:x.age||30});}catch(e){return '';}}
function viewBdo(){const all=Object.values(bdoAll()).sort((a,b)=>b.y-a.y),cur=all[0];
  const tabs=`<div class="stabs">${[['son','Son tören'],['kaz','Kazananlar'],['cok','En çok kazananlar']].map(([k,l])=>`<button data-act="bdTab" data-k="${k}" class="${BDT===k?'on':''}">${l}</button>`).join('')}</div>`;
  let body='';const cl=id=>CLUBS[id]?`${crestSVG(CLUBS[id],16)} ${esc(CLUBS[id].short)}`:'';
  if(BDT==='son'){if(!cur)body=`<section class="panel"><p class="muted">İlk Ballon d’Or oylaması ${seasonLabel(G.s?G.s.year:2026)} sezonunun sonunda yapılacak. Sezon bitince 30 aday açıklanır ve Paris’teki töreni canlı izleyebilirsin.</p></section>`;
    else{const side=(t,L,f)=>`<div class="bd-side"><p class="fmh">${t}</p>${L.map((x,i)=>`<div class="bd-sr ${i===0?'w':''}"><i>${i===0?'🏆':i+1}</i><b>${esc(x.n)}</b><small>${x.c?cl(x.c):''} ${f?f(x):''}</small></div>`).join('')}</div>`;
      body=`<section class="panel bd-hero"><div class="bd-ball">${BDO_BALL}</div><div><p class="sub-h" style="margin:0"><span>${cur.no}. Ballon d’Or · ${cur.y}</span><span>${cur.season} sezonu</span></p><h3 class="bd-win">${esc(cur.top[0].n)}</h3><p class="muted">${cl(cur.top[0].c)} · ${cur.top[0].pts} puan</p>
        <button class="cta" data-act="bdoWatch" data-y="${esc(cur.season)}">${cur.seen?'🎬 Töreni tekrar izle':'🎟 Törene katıl · canlı izle'}</button></div></section>
       <div class="bd-grid"><section class="panel"><p class="sub-h"><span>Sıralama · 30 aday</span><span>puan</span></p><ol class="bd-rank">${cur.top.map((x,i)=>`<li class="${x.me?'me':''} ${i<3?'pod':''}"><i>${i+1}</i><b>${x.me?'⭐ ':''}${x.k&&x.k!=='cenk'?`<span class="plink" data-act="pcard" data-id="${(G.tx&&G.tx[x.k])||x.c}" data-k="${x.k}">${esc(x.n)}</span>`:esc(x.n)}</b><small>${cl(x.c)} · ${x.pos==='KL'?`kaleci · ${x.ap} maç`:`${x.g} gol, ${x.a} asist`} · ${x.r}</small><em>${x.pts}</em></li>`).join('')}</ol></section>
       <section class="panel">${side('Kopa Trophy · en iyi genç',cur.kopa,x=>`${x.age} yaş`)}${side('Yashin Trophy · en iyi kaleci',cur.yashin,x=>`${x.r} ort.`)}${side('Gerd Müller Trophy · gol kralı',cur.muller,x=>`${x.g} gol`)}${side('Johan Cruyff Trophy · teknik direktör',cur.cruyff,null)}
        <div class="bd-side"><p class="fmh">Yılın kulübü</p><div class="bd-sr w"><i>🏆</i><b>${CLUBS[cur.club]?esc(CLUBS[cur.club].name):'—'}</b></div></div></section></div>`;}}
  else if(BDT==='kaz'){const rows=BDO_HIST.map(([y,n,c,nat])=>({y,n,c,nat,real:1})).concat(all.map(x=>({y:x.y,n:x.top[0].n,c:CLUBS[x.top[0].c]?CLUBS[x.top[0].c].name:'',nat:x.top[0].nat,s:x.season}))).sort((a,b)=>b.y-a.y);
    body=`<section class="panel"><p class="muted" style="margin:0 0 8px">1956’dan bugüne Ballon d’Or kazananları. ${all.length?'Oyun içindeki törenler de listeye eklenir.':''} 2020’de pandemi nedeniyle ödül verilmedi.</p><div class="tbl-wrap"><table class="lgt bd-hist"><thead><tr><th>Yıl</th><th class="l">Oyuncu</th><th class="l">Kulüp</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.real?'':'ingame'}"><td>${r.y}</td><td class="l">${flagImg(r.nat,'fl-row')} <b>${esc(r.n)}</b></td><td class="l">${esc(r.c)}</td><td>${r.real?'':`<button class="btn sm" data-act="bdoWatch" data-y="${esc(r.s)}">🎬 Tören</button>`}</td></tr>`).join('')}</tbody></table></div></section>`;}
  else{const cnt={};for(const [y,n,c,nat] of BDO_HIST){cnt[n]=cnt[n]||{n,nat,w:0,ys:[]};cnt[n].w++;cnt[n].ys.push(y);}for(const x of all){const n=x.top[0].n;cnt[n]=cnt[n]||{n,nat:x.top[0].nat,w:0,ys:[]};cnt[n].w++;cnt[n].ys.push(x.y);}
    const L=Object.values(cnt).sort((a,b)=>b.w-a.w||a.ys[0]-b.ys[0]);body=`<section class="panel"><ol class="bd-rank">${L.map((x,i)=>`<li class="${i<3?'pod':''}"><i>${i+1}</i><b>${flagImg(x.nat,'fl-row')} ${esc(x.n)}</b><small>${x.ys.join(', ')}</small><em>${x.w}×</em></li>`).join('')}</ol></section>`;}
  return `<h2 class="h">Ballon d’Or</h2>${tabs}${body}`;}
const BDO_BALL=`<svg viewBox="0 0 100 120"><defs><radialGradient id="bdg" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".35" stop-color="#f3c74a"/><stop offset=".8" stop-color="#a6741a"/><stop offset="1" stop-color="#6d4708"/></radialGradient><linearGradient id="bdb" x1="0" x2="1"><stop offset="0" stop-color="#2b2b2b"/><stop offset=".5" stop-color="#555"/><stop offset="1" stop-color="#1b1b1b"/></linearGradient></defs><circle cx="50" cy="44" r="38" fill="url(#bdg)"/><g fill="none" stroke="rgba(110,70,10,.55)" stroke-width="1.6"><path d="M50 6v76M12 44h76"/><ellipse cx="50" cy="44" rx="18" ry="38"/><ellipse cx="50" cy="44" rx="38" ry="15"/></g><path d="M34 84h32l6 16H28z" fill="url(#bdb)"/><rect x="24" y="100" width="52" height="12" rx="2" fill="#141414"/><text x="50" y="109" text-anchor="middle" font-size="6" fill="#e7c25a" font-weight="700" letter-spacing=".5">BALLON D'OR</text></svg>`;
XICON.bdo=NI('<circle cx="12" cy="10" r="6"/><path d="M9 16l-1 5h8l-1-5"/><path d="M6 10h12M12 4v12"/>');NICON.bdo=XICON.bdo;
Object.assign(XV,{bdo:()=>viewBdo()});
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.s&&!L.some(x=>x[0]==='bdo'))L.push(['bdo','Ballon d’Or']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(G&&G.s){const rk=C.find(x=>x[0]==='Rekabet');if(rk&&!rk[1].some(x=>x[0]==='bdo')){const i=rk[1].findIndex(x=>x[0]==='awards');rk[1].splice(i>=0?i+1:rk[1].length,0,['bdo','Ballon d’Or',{tab:'bdo'}]);}}}catch(e){}return C;})(navCats);
/* ana sayfada davet bandı */
function bdoInvite(){const all=Object.values(bdoAll()).sort((a,b)=>b.y-a.y),cur=all[0];if(!cur||cur.seen||!G||G.phase!=='off')return '';const me=cur.top.findIndex(x=>x.me);
  return `<section class="panel bd-inv"><div class="bd-ball sm">${BDO_BALL}</div><div><b>${cur.no}. Ballon d’Or töreni · Paris</b><small>${me>=0?`Adaysın! Salonda yerini al.`:G.mode==='mgr'&&cur.cruyff.some(x=>x.me)?'Johan Cruyff Trophy için adaysın!':'Théâtre du Châtelet’den canlı yayın. Davetlisin.'}</small></div><button class="cta sm" data-act="bdoWatch" data-y="${esc(cur.season)}">🎟 Törene katıl</button></section>`;}
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const b=bdoInvite();if(b)return b+h;}catch(e){}return h;})(viewHub);

