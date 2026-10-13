/* ================= v27: lig kuralları, küme düşme / yükselme, ulusal kupa tarayıcısı ================= */
const ORIG_LG=Object.fromEntries(Object.entries(CLUBS).map(([k,c])=>[k,c.league]));
/* üst lig → alt lig çiftleri: auto = doğrudan, po = play-off sıra aralığı (alt ligden bir takım daha çıkar), rpo = üst ligden düşme play-off'u oynayan sıra */
const LG_PAIRS=[{u:'sl',d:'l1',auto:2,po:[3,6]},{u:'l1',d:'l2',auto:1,po:[2,5]},{u:'l2',d:'l3',auto:1,po:[2,5]},{u:'l3',d:'bal',auto:1},{u:'bal',d:'sal',auto:1},
  {u:'pl',d:'en2',auto:2,po:[3,6]},{u:'en2',d:'en3',auto:2,po:[3,6]},{u:'ll',d:'es2',auto:2,po:[3,6]},{u:'es2',d:'es3',auto:2,po:[3,6]},{u:'it1',d:'it2',auto:2,po:[3,8]},{u:'it2',d:'it3',auto:2,po:[3,6]},
  {u:'de1',d:'de2',auto:2,rpo:3},{u:'de2',d:'de3',auto:2,rpo:3},{u:'fr1',d:'fr2',auto:2,rpo:3},{u:'fr2',d:'fr3',auto:2,rpo:3}];
function lgApply(){const key=G?JSON.stringify(G.lgMove||{}):'';if(lgApply.k===key)return;lgApply.k=key;for(const [k,l] of Object.entries(ORIG_LG))if(CLUBS[k])CLUBS[k].league=l;if(G&&G.lgMove)for(const [k,l] of Object.entries(G.lgMove))if(CLUBS[k]&&LEAGUES[l])CLUBS[k].league=l;}
genSquad=(old=>function(c){const cur=c.league;if(ORIG_LG[c.id])c.league=ORIG_LG[c.id];try{return old(c);}finally{c.league=cur;}})(genSquad);
function lgRule(lid){const L=LEAGUES[lid],n=leagueClubs(lid).length,up=LG_PAIRS.find(p=>p.d===lid),dn=LG_PAIRS.find(p=>p.u===lid),eu=EU_SPOTS[lid];
  return {n,rounds:(n-1)*2,up,dn,eu,cup:DOMC[L.cc]&&DOMC[L.cc].lg[lid]!=null?DOMC[L.cc].name:null};}
function lgZones(lid){const R=lgRule(lid),n=R.n,Z=new Array(n).fill('');if(R.eu){let i=0;R.eu.forEach((c,ix)=>{for(let j=0;j<c;j++,i++)if(i<n)Z[i]=['ucl','uel','uecl'][ix];});}
  if(R.up){for(let i=0;i<R.up.auto;i++)Z[i]='up';if(R.up.po)for(let i=R.up.po[0]-1;i<R.up.po[1];i++)Z[i]=Z[i]||'po';if(R.up.rpo)Z[R.up.rpo-1]='po';}
  if(R.dn){const dn=R.dn.auto+(R.dn.po?1:0);for(let i=n-dn;i<n;i++)Z[i]='dn';if(R.dn.rpo)Z[n-dn-1]='rpo';}return Z;}
tableHTML=(old=>function(tb){let h=old(tb);try{const lid=tb[0]&&CLUBS[tb[0].id]&&CLUBS[tb[0].id].league;if(!lid)return h;const Z=lgZones(lid);let i=0;h=h.replace(/<tr class="([^"]*)"/g,(m,c)=>`<tr class="${c} z-${Z[i++]||'n'}"`);
  const leg=[['up','Yükselme'],['po','Play-off'],['ucl','Şampiyonlar Ligi'],['uel','Avrupa Ligi'],['uecl','Konferans Ligi'],['rpo','Düşme play-off'],['dn','Küme düşme']].filter(([k])=>Z.includes(k));
  if(leg.length)h=h.replace(/<\/section>$/,`<div class="z-leg">${leg.map(([k,l])=>`<span><i class="z-${k}"></i>${l}</span>`).join('')}</div></section>`);}catch(e){}return h;})(tableHTML);
function lgFinalTable(lid,prev){if(lid===prev.league)return tableOf(lid,prev.results);const S=prev;S.ol=S.ol||{};let o=S.ol[lid];if(!o)o=S.ol[lid]={fx:makeFixtures(shuffle(leagueClubs(lid).map(c=>c.id))),res:[],cal:[]};
  while(o.res.length<o.fx.length)o.res.push(o.fx[o.res.length].map(([h,a])=>{const [x,y]=simScore(h,a);return [h,a,x,y];}));return tableOf(lid,o.res);}
function koWin(a,b,two){const A=CLUBS[a],B=CLUBS[b];let ga=0,gb=0;for(let i=0;i<(two?2:1);i++){const [x,y]=simPair(i?B:A,i?A:B,!two);if(i){ga+=y;gb+=x;}else{ga+=x;gb+=y;}}if(ga===gb){const [p,q]=pens(A.str,B.str);return p>q?[a,`${ga}-${gb} (pen. ${p}-${q})`]:[b,`${ga}-${gb} (pen. ${p}-${q})`];}return [ga>gb?a:b,`${ga}-${gb}`];}
function lgPromote(prev){const out=[],mv=Object.assign({},G.lgMove||{}),tbs={};const T=lid=>tbs[lid]||(tbs[lid]=lgFinalTable(lid,prev));
  for(const P of LG_PAIRS){if(!leagueClubs(P.u).length||!leagueClubs(P.d).length)continue;const U=T(P.u),D=T(P.d),n=U.length;let ups=D.slice(0,P.auto).map(r=>r.id),downs=U.slice(n-P.auto-(P.po?1:0)).map(r=>r.id),notes=[];
    if(P.po){let ids=D.slice(P.po[0]-1,P.po[1]).map(r=>r.id);while(ids.length>1){const nx=[];for(let i=0;i<ids.length/2;i++){const [w,s]=koWin(ids[i],ids[ids.length-1-i],ids.length>2);nx.push(w);notes.push(`${CLUBS[ids[i]].short}–${CLUBS[ids[ids.length-1-i]].short} ${s}`);}ids=nx;}ups.push(ids[0]);notes.unshift(`Play-off kazananı: ${CLUBS[ids[0]].name}`);}
    if(P.rpo){const a=U[n-P.auto-1].id,b=D[P.rpo-1].id,[w,s]=koWin(a,b,true);notes.push(`Düşme play-off'u: ${CLUBS[a].short}–${CLUBS[b].short} ${s}`);if(w===b){ups.push(b);downs.push(a);}}
    for(const id of ups)mv[id]=P.u;for(const id of downs)mv[id]=P.d;out.push({u:P.u,d:P.d,ups,downs,notes});}
  for(const [k,l] of Object.entries(mv))if(ORIG_LG[k]===l)delete mv[k];G.lgMove=mv;return out;}
newSeason=(old=>function(year){const prev=G&&G.s;lgApply();if(prev&&prev.year===year-1&&prev.results&&prev.results.length&&!prev.prDone&&!LEAGUES[prev.league].youth){prev.prDone=1;
    const R=lgPromote(prev);lgApply();const yl=seasonLabel(prev.year);G.lgHist=G.lgHist||[];G.lgHist.unshift({y:yl,R:R.map(x=>({u:x.u,d:x.d,ups:x.ups,downs:x.downs,notes:x.notes}))});if(G.lgHist.length>6)G.lgHist.length=6;
    const me=G.club,my=R.find(x=>x.ups.includes(me)||x.downs.includes(me));
    for(const x of R)if(x.u===prev.league||x.d===prev.league||LEAGUES[x.u].cc===LEAGUES[prev.league].cc)msg('gundem',`${LEAGUES[x.u].short} – ${LEAGUES[x.d].short}: yükselen ve düşenler`,`Yükselen: ${x.ups.map(id=>CLUBS[id].name).join(', ')}. Düşen: ${x.downs.map(id=>CLUBS[id].name).join(', ')}.${x.notes.length?' '+x.notes.join(' · ')+'.':''}`);
    if(my){const up=my.ups.includes(me);msg('board',up?'Şampiyonluk kutlaması: üst lige yükseldik!':'Küme düştük',up?`${myClub().name} gelecek sezon ${LEAGUES[my.u].name}'de mücadele edecek. Tebrikler!`:`${myClub().name} gelecek sezon ${LEAGUES[my.d].name}'de oynayacak. Taraftarlar büyük hayal kırıklığı içinde.`);
      if(G.trophies&&up)G.trophies.push({year:yl,name:`${LEAGUES[my.d].short} → ${LEAGUES[my.u].short} yükselme`,club:me});if(G.m&&!G.m.shadow)G.m.conf=clamp((G.m.conf||50)+(up?18:-25),0,100);}}
  return old(year);})(newSeason);
render=(old=>function(){try{lgApply();}catch(e){}return old();})(render);
/* kurallar ekranı */
function rulesHTML(lid){const L=LEAGUES[lid],R=lgRule(lid),cc=L.cc,EUn=['Şampiyonlar Ligi','Avrupa Ligi','Konferans Ligi'];
  const li=[`${R.n} takım, çift devreli lig: her takım ${R.rounds} maç oynar.`,'Galibiyet 3, beraberlik 1, mağlubiyet 0 puan. Eşitlikte averaj, sonra atılan gol.'];
  if(R.up)li.push(`Üst lig (${LEAGUES[R.up.u].name}): ilk ${R.up.auto} takım doğrudan yükselir${R.up.po?`; ${R.up.po[0]}–${R.up.po[1]}. sıradakiler play-off oynar (eleme, kazanan yükselir)`:''}${R.up.rpo?`; ${R.up.rpo}. sıradaki takım üst ligin sondan ${R.up.auto+1}. takımıyla iki maçlık düşme play-off'u oynar`:''}.`);
  else if(L.tier>=8)li.push('Bu ülkenin en üst ligi.');
  if(R.dn)li.push(`Alt lig (${LEAGUES[R.dn.d].name}): son ${R.dn.auto+(R.dn.po?1:0)} takım küme düşer${R.dn.rpo?`; sondan ${R.dn.auto+1}. takım alt ligin ${R.dn.rpo}. takımıyla düşme play-off'u oynar`:''}.`);
  else li.push(L.tier>=8&&!R.up?'Oyunda bu ligin altında lig yok; küme düşme uygulanmaz.':'Oyunda bu ligin altında lig yok; küme düşme uygulanmaz.');
  if(R.eu)li.push(`Avrupa: ${R.eu.map((c,i)=>c?`${c} takım ${EUn[i]}`:'').filter(Boolean).join(', ')}. Kupa şampiyonu da Avrupa bileti alır.`);
  if(R.cup)li.push(`Yerel kupa: ${R.cup} (tek maçlık eleme, beraberlikte penaltılar).`);
  li.push(`Kadroda en çok 34 oyuncu; transfer dönemleri ülkeye göre değişir (aşağıda).`);
  const H=(G.lgHist||[]).slice(0,3).map(h=>{const rs=h.R.filter(x=>LEAGUES[x.u].cc===cc);return rs.length?`<p class="sub-h" style="margin:10px 0 4px"><span>${esc(h.y)}</span></p><ul class="cupres">${rs.map(x=>`<li><span>${esc(LEAGUES[x.d].short)} → ${esc(LEAGUES[x.u].short)}</span><b>⬆ ${x.ups.map(id=>esc(CLUBS[id].short)).join(', ')}<small style="display:block;color:#ff8a84">⬇ ${x.downs.map(id=>esc(CLUBS[id].short)).join(', ')}</small></b></li>`).join('')}</ul>`:'';}).join('');
  return `<section class="panel"><p class="sub-h"><span>${esc(L.name)} kuralları</span><span>${esc(CC[cc]||'')}</span></p><ul class="rules">${li.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${H?`<p class="sub-h" style="margin-top:12px"><span>Yükselen ve düşenler</span></p>${H}`:''}</section>`;}
/* ulusal kupa tarayıcısı */
let NKCC=null;
function srnd(seed){const r=srng(seed);r();r();return r;}
function sPois(l,r){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=r();}while(p>L);return k-1;}
function natCup(cc){const D=DOMC[cc];if(!D||!G||!G.s)return null;const Y=G.s.year,r=srnd(cc+'nc'+Y),N=D.r.length,cal=G.s.cal,d0=cal[0],d1=cal[cal.length-1];
  const clubs=Object.values(CLUBS).filter(c=>ccOf(c)===cc&&D.lg[c.league]!=null&&!LEAGUES[c.league].youth).map(c=>({id:c.id,e:domEntry(c),s:c.str})).filter(x=>x.e!=null);if(clubs.length<2)return null;
  const NE=Math.min(N,Math.ceil(Math.log2(clubs.length))),off=N-NE,my=(cupsOf().list||[]).find(k=>k.id==='dom'&&k.cc===cc);
  const dayOf=i=>{const nm=D.r[off+i];if(my){const R=my.rounds.find(x=>x.n===nm);if(R)return R.day;}return Math.round(d0+(d1-d0)*(0.07+0.88*(off+i)/(N-1)));};
  const myStart=my?Math.max(0,D.r.indexOf(my.rounds[0].n)-off):99,eOf={};clubs.forEach(x=>eOf[x.id]=x);
  let alive=clubs.map(x=>x.id),rounds=[],win=null,run=null,myJ=0;
  for(let i=0;i<NE;i++){const nm=D.r[off+i],day=dayOf(i),played=G.phase==='off'||day<G.s.day||(day===G.s.day&&dayType(G.s.day)!=='kupa');const T1=Math.pow(2,NE-1-i),m=Math.max(0,alive.length-T1);
    const inMy=my&&alive.includes(G.club),myRes=inMy&&i>=myStart?my.res[myJ]:null;let ties=[],nx=[],pool=alive.slice();
    let oppIn=false;if(inMy){pool=pool.filter(x=>x!==G.club);const op=myRes?myRes.opp:(i>=myStart&&my.alive?my.opp:null);if(op&&pool.includes(op)){oppIn=true;pool=pool.filter(x=>x!==op);}}
    const ord=pool.map(id=>[id,(eOf[id]?eOf[id].e:0)*10+(CLUBS[id]?CLUBS[id].str:60)/10+r()*2]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
    let need=m;if(inMy&&i>=myStart&&oppIn)need--;const players=ord.slice(0,Math.max(0,need*2)),byes=ord.slice(Math.max(0,need*2));
    if(inMy&&i<myStart)byes.push(G.club);
    if(inMy&&i>=myStart){if(myRes){const w=myRes.us>myRes.them||(myRes.us===myRes.them&&(my.won||myJ<my.res.length-1||(my.alive&&my.cur>myJ)));ties.push({a:myRes.h?G.club:myRes.opp,b:myRes.h?myRes.opp:G.club,s:(myRes.h?`${myRes.us}-${myRes.them}`:`${myRes.them}-${myRes.us}`)+(myRes.us===myRes.them?' (pen.)':''),w:w?G.club:myRes.opp,me:1});nx.push(w?G.club:myRes.opp);myJ++;}
      else{ties.push({a:G.club,b:my.alive?my.opp:null,s:'',w:null,me:1});}}
    byes.forEach(x=>{ties.push({a:x,bye:1,w:x});nx.push(x);});
    const sh=players.sort(()=>r()-0.5);for(let j=0;j+1<sh.length;j+=2){const a=sh[j],b=sh[j+1];if(!played){ties.push({a,b,s:'',w:null});continue;}const A=clubObj(a),B=clubObj(b),neutral=nm==='Final',[la,lb]=lambdas(A.str+(neutral?0:1.5),B.str);let x=sPois(la,r),y=sPois(lb,r),w=x>y?a:b,s2=`${x}-${y}`;
      if(x===y){let p=0,q=0;for(let t=0;t<5;t++){if(r()<0.76+(A.str-B.str)*0.003)p++;if(r()<0.76+(B.str-A.str)*0.003)q++;}if(p===q){if(r()<0.5)p++;else q++;}w=p>q?a:b;s2+=` (pen. ${p}-${q})`;}ties.push({a,b,s:s2,w});nx.push(w);}
    rounds.push({n:nm,day,ties,played});if(!played)break;alive=nx;if(i===NE-1){const t=ties.find(x=>!x.bye);if(t&&t.w){win=t.w;run=t.a===t.w?t.b:t.a;}}}
  return {cc,name:D.name,rounds,win,run,nRounds:NE,off};}
cupDecide=(old=>function(k){if(k.type!=='eu'&&k.id==='dom'&&!k.decided){const B=natCup(k.cc);if(B&&B.win&&B.win!==G.club){k.decided=true;cupWin(k,B.win,B.run);msg('gundem',`${k.name} şampiyonu: ${clubObj(B.win).name}`,`${k.name} finalinde ${clubObj(B.win).name}, ${clubObj(B.run).name} karşısında kupayı kaldırdı.`);return;}}return old(k);})(cupDecide);
function natCupsHTML(){const ccs=Object.keys(DOMC),cc=NKCC&&DOMC[NKCC]?NKCC:(curLeague().cc||'TR'),B=natCup(cc);
  const chips=`<div class="filt nk-cc">${ccs.map(c=>`<button class="chip" data-act="nkCC" data-k="${c}" aria-pressed="${c===cc}">${flagImg(CC3[c]||'TUR','fl-row')} ${esc(CC[c]||c)}</button>`).join('')}</div>`;
  if(!B)return chips+'<section class="panel"><p class="muted">Bu ülkenin kupası yok.</p></section>';
  const tie=t=>{const A=clubObj(t.a),Bc=t.b?clubObj(t.b):null;if(t.bye)return `<li class="nk-t"><b class="${t.w===t.a?'w':''}">${A?crestSVG(A,14):''} ${A?esc(A.name):''}</b><em>bay</em><b></b></li>`;
    return `<li class="nk-t${t.me?' me':''}"><b class="${t.w===t.a?'w':''}">${A?crestSVG(A,14):''} ${A?esc(A.name):'?'}</b><em>${t.s||'–'}</em><b class="r ${t.w===t.b?'w':''}">${Bc?esc(Bc.name):'Kura bekleniyor'} ${Bc?crestSVG(Bc,14):''}</b></li>`;};
  const past=(G.cupW||[]).filter(x=>x.c===B.name).slice(0,8);
  return `${chips}<section class="panel"><p class="sub-h"><span>${esc(B.name)} · ${seasonLabel(G.s.year)}</span><span>${B.win?'Şampiyon: '+esc(clubObj(B.win).name):B.rounds.length?esc(B.rounds[B.rounds.length-1].n)+' '+(B.rounds[B.rounds.length-1].played?'oynandı':'sırada'):''}</span></p>
   ${B.win?`<div class="nk-champ">🏆 <b>${esc(clubObj(B.win).name)}</b> <small>finalde ${esc(clubObj(B.run).name)}'ı yendi</small></div>`:''}
   ${B.rounds.slice().reverse().map(R=>{const by=R.ties.filter(t=>t.bye),pl=R.ties.filter(t=>!t.bye);return `<p class="sub-h" style="margin:10px 0 4px"><span>${esc(R.n)}</span><span>${fmtDate(dateOf(R.day))}${R.played?'':' · oynanacak'}</span></p><ul class="nk-ties">${pl.map(tie).join('')}</ul>${by.length?`<p class="muted nk-by">Bu turu maç yapmadan geçenler: ${by.map(t=>esc(clubObj(t.a)?clubObj(t.a).short:'')).join(', ')}</p>`:''}`;}).join('')}
   ${B.rounds.length<B.nRounds?`<p class="muted">Sonraki turlar: ${DOMC[cc].r.slice(B.off+B.rounds.length).join(', ')}.</p>`:''}</section>
   ${past.length?`<section class="panel"><p class="sub-h"><span>Geçmiş şampiyonlar</span></p><ul class="cupres">${past.map(x=>{const o=clubObj(x.w);return `<li><span>${esc(x.y)}</span><b>${o?esc(o.name):''}</b></li>`;}).join('')}</ul></section>`:''}`;}
ACTX.nkCC=el=>{NKCC=el.dataset.k;render();};
viewLeague=(old=>function(){if(LTAB==='nk'||LTAB==='kur'){const lt=`<div class="filt">${[['tbl','Puan durumu'],['g','Gol krallığı'],['a','Asist krallığı'],['cup','Kupalar'],['nk','Ulusal kupalar'],['kur','Kurallar']].map(([k,l])=>`<button class="chip" data-act="ltab" data-k="${k}" aria-pressed="${LTAB===k}">${l}</button>`).join('')}</div>`;
    return LTAB==='nk'?`<h2 class="h">Ulusal kupalar</h2>${lt}${natCupsHTML()}`:`<h2 class="h">Kurallar</h2>${worldChips()}${lt}${rulesHTML(VLG||G.s.league)}`;}
  let h=old();return h.replace(`['cup','Kupalar']`,'').replace(/(<button class="chip" data-act="ltab" data-k="cup"[^>]*>Kupalar<\/button>)/,`$1<button class="chip" data-act="ltab" data-k="nk" aria-pressed="false">Ulusal kupalar</button><button class="chip" data-act="ltab" data-k="kur" aria-pressed="false">Kurallar</button>`);})(viewLeague);
viewWorld=(old=>function(lid){let h=old(lid);if(!/data-act="ltab"/.test(h))h=h.replace('<p class="muted" style="margin:0 2px 10px">',`<div class="filt"><button class="chip" data-act="ltab" data-k="tbl" aria-pressed="true">Puan durumu</button><button class="chip" data-act="ltab" data-k="kur" aria-pressed="false">Kurallar</button><button class="chip" data-act="ltab" data-k="nk" aria-pressed="false">Ulusal kupalar</button></div><p class="muted" style="margin:0 2px 10px">`);return h;})(viewWorld);

