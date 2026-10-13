/* ================= v72: geç kariyer hedefleri — rekor kovalamak, kulüp efsanesi statüsü, jübile maçı, emeklilikte hocalığa efsane dönüşü ================= */
function lcInit(){G.lcg=G.lcg||{done:{},leg:{}};return G.lcg;}
function lcCur(){const S=G.s&&G.phase==='season'&&G.s.stats?G.s.stats:null;return S;}
function lcSL(){let g=0,best=0;for(const h of G.history){if(h.league==='sl'&&h.pos!=='TD'){g+=h.goals||0;best=Math.max(best,h.goals||0);}}const S=lcCur();if(S&&G.s.league==='sl'){g+=S.goals;best=Math.max(best,S.goals);}return {g,best};}
function lcClubTot(){const T={};const add=(c,ap,g,y)=>{if(!c)return;const x=T[c]=T[c]||{ap:0,g:0,ys:0};x.ap+=ap||0;x.g+=g||0;x.ys+=y;};for(const h of G.history){if(h.pos==='TD')continue;add(h.club,h.apps,h.goals,1);}const S=lcCur();if(S)add(G.club,S.apps,S.goals,0);
  for(const t of G.trophies||[]){if(T[t.club])T[t.club].tr=(T[t.club].tr||0)+1;}return T;}
function lcBdo(){return Object.values(G.bdo||{}).filter(b=>b&&b.top&&b.top[0]&&b.top[0].me).length;}
function lcGoals(){const p=G.p,T=G.totals||{apps:0,goals:0},sl=lcSL(),S=lcCur(),tg=T.goals||0,ta=T.apps||0,CT=lcClubTot();
  const legC=Object.entries(CT).filter(([c,x])=>x.ap>=200||x.g>=100||x.ys>=7||(x.tr||0)>=4).map(([c])=>c);
  const big=G.history.some(h=>['pl','ll','it1','de1','fr1'].includes(h.league))||(G.s&&['pl','ll','it1','de1','fr1'].includes(G.s.league));
  const home=(G.history[0]||{}).club,homeBack=home&&G.club===home&&p.age>=30;
  return [
   {id:'sl',ic:'🏆',t:'Süper Lig gol rekoru',d:'Hakan Şükür’ün 249 Süper Lig golü',v:sl.g,tg:249,grp:'Rekorlar'},
   {id:'sl1',ic:'🔥',t:'Bir sezonda Süper Lig gol rekoru',d:'Tanju Çolak’ın 1987-88’deki 39 golü',v:sl.best,tg:39,grp:'Rekorlar'},
   {id:'ng',ic:'🇹🇷',t:'Milli takım gol rekoru',d:'Hakan Şükür’ün 51 milli golü',v:p.natGoals||0,tg:51,grp:'Rekorlar'},
   {id:'cap',ic:'🎽',t:'Milli takım forma rekoru',d:'Rüştü Reçber’in 120 milli maçı',v:p.caps||0,tg:120,grp:'Rekorlar'},
   {id:'bdo',ic:'⚽',t:'Ballon d’Or rekoru',d:'Lionel Messi’nin 8 Ballon d’Or’u',v:lcBdo(),tg:8,grp:'Rekorlar'},
   {id:'g100',ic:'💯',t:'100 gol',v:tg,tg:100,grp:'Kilometre taşları'},{id:'g300',ic:'🎯',t:'300 gol',v:tg,tg:300,grp:'Kilometre taşları'},{id:'g500',ic:'👑',t:'500 gol',v:tg,tg:500,grp:'Kilometre taşları'},
   {id:'a500',ic:'🏟',t:'500 resmi maç',v:ta,tg:500,grp:'Kilometre taşları'},{id:'a700',ic:'🏟',t:'700 resmi maç',v:ta,tg:700,grp:'Kilometre taşları'},
   {id:'leg',ic:'🏛',t:'Kulüp efsanesi ol',d:'Bir kulüpte 200 maç, 100 gol, 7 sezon ya da 4 kupa',v:legC.length?1:0,tg:1,grp:'Miras',x:legC.map(c=>CLUBS[c]&&CLUBS[c].name).filter(Boolean).join(', ')},
   {id:'big5',ic:'🌍',t:'Avrupa’nın 5 büyük liginde oyna',v:big?1:0,tg:1,grp:'Miras'},
   {id:'home',ic:'🏠',t:'Eve dönüş',d:`Kariyerinin sonunu ilk kulübün ${home&&CLUBS[home]?CLUBS[home].name:''} formasıyla oyna (30 yaş sonrası)`,v:homeBack?1:0,tg:1,grp:'Miras'}];}
function lcCheck(){if(!isPl()||!G.s)return;const L=lcInit(),now=lcGoals();for(const g of now){if(L.done[g.id]||g.v<g.tg)continue;L.done[g.id]=seasonLabel(G.s.year);G.p.fame=clamp(G.p.fame+(g.grp==='Rekorlar'?6:3),0,100);G.p.morale=clamp(G.p.morale+6,0,100);
    if(g.grp==='Rekorlar'){msg('news',`REKOR! ${g.t}`,`${G.p.name}, ${g.d} rekorunu geride bıraktı! Tribünler ayakta, kulüp özel bir forma bastırdı.`);try{feedAdd({src:'Son Dakika',h:'@sondakikaspor',cat:'gen',txt:`TARİHİ AN: ${G.p.name} ${g.t.toLowerCase()}nu kırdı!`});}catch(e){}}
    else msg('event',`Kariyer hedefi: ${g.t}`,g.id==='leg'?`Artık ${g.x} taraftarının gözünde bir efsanesin. Formanı giyen çocuklar senin adını yazdırıyor.`:`${g.t} hedefine ulaştın. Kariyerine bir altın sayfa daha eklendi.`);}
  /* rekora yaklaşınca haber */
  for(const g of now){if(g.grp!=='Rekorlar'||L.done[g.id]||!g.v)continue;const k='near_'+g.id;if(!L.done[k]&&g.v>=g.tg*0.9){L.done[k]=1;msg('news',`Rekora geri sayım: ${g.t}`,`${G.p.name} ${g.d} rekoruna ${g.tg-g.v} uzaklıkta. Her maçında gözler onun üzerinde.`);}}}
applyPlayed=(old=>function(){const r=old.apply(this,arguments);try{lcCheck();}catch(e){console.warn(e);}return r;})(applyPlayed);
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(isPl())lcCheck();}catch(e){}return r;})(newSeason);
function viewLcg(){const L=lcInit(),now=lcGoals(),grp={};for(const g of now)(grp[g.grp]=grp[g.grp]||[]).push(g);const done=now.filter(g=>L.done[g.id]).length;
  return `<h2 class="h">Kariyer hedefleri</h2><section class="panel"><p class="sub-h"><span>İlerleme</span><span>${done}/${now.length}</span></p><p class="muted" style="margin:0">Yaşın ilerledikçe kariyerine anlam katacak hedefler: tarihi rekorlar, kilometre taşları ve geride bırakacağın miras. Bir kulüpte efsaneleşirsen emekliliğinde jübile maçın orada yapılır ve teknik direktör olarak dönmen için kapı hep açık kalır.</p></section>
   ${Object.entries(grp).map(([n,L2])=>`<section class="panel"><p class="sub-h"><span>${n}</span></p><div class="lcg">${L2.map(g=>{const p=Math.min(100,Math.round(g.v/g.tg*100)),ok=!!L.done[g.id];return `<div class="lc ${ok?'ok':''}"><span class="lc-ic">${g.ic}</span><div><b>${esc(g.t)}</b>${g.d?`<small>${esc(g.d)}</small>`:''}${g.x?`<small>${esc(g.x)}</small>`:''}<i class="lc-b"><em style="width:${p}%"></em></i></div><em class="lc-v">${ok?`✓ ${esc(String(L.done[g.id]))}`:g.tg>1?`${g.v}/${g.tg}`:'—'}</em></div>`;}).join('')}</div></section>`).join('')}`;}
XICON.lcg=NI('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>');NICON.lcg=XICON.lcg;Object.assign(XV,{lcg:()=>viewLcg()});if(typeof UIG_MAP!=='undefined')UIG_MAP.lcg='Ben';
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(isPl()&&G.s&&!L.some(x=>x[0]==='lcg'))L.push(['lcg','Kariyer hedefleri']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(isPl()&&G.s){const g=C.find(x=>x[0]==='Kariyer')||C.find(x=>x[0]==='Oyuncu');if(g&&!g[1].some(x=>x[0]==='lcg'))g[1].push(['lcg','Kariyer hedefleri',{tab:'lcg'}]);}}catch(e){}return C;})(navCats);
/* ana sayfa: rekora yaklaşınca bant */
viewHub=(old=>function(){const h=old.apply(this,arguments);try{if(isPl()&&G.phase==='season'&&G.p.age>=26){const L=lcInit(),n=lcGoals().filter(g=>!L.done[g.id]&&g.v>=g.tg*0.75&&g.tg>1).sort((a,b)=>b.v/b.tg-a.v/a.tg)[0];
    if(n)return h+`<section class="panel lc-band" data-act="navGo" data-tab="lcg"><span>${n.ic}</span><div><b>${esc(n.t)}</b><small>${n.d?esc(n.d)+' · ':''}${n.tg-n.v} kaldı</small></div><i class="lc-b"><em style="width:${Math.round(n.v/n.tg*100)}%"></em></i></section>`;}}catch(e){}return h;})(viewHub);
/* ---------- jübile maçı ---------- */
function jubClub(){const CT=lcClubTot();let best=null,bs=-1;for(const [c,x] of Object.entries(CT)){const s=x.ap+x.g*1.5+x.ys*15+(x.tr||0)*20;if(s>bs&&CLUBS[c]&&!LEAGUES[CLUBS[c].league].youth){bs=s;best=c;}}return best;}
let JUB=null;
function jubOpen(){const cid=jubClub(),c=CLUBS[cid]||myClub(),CT=lcClubTot()[cid]||{ap:0,g:0};const mates=(()=>{try{return squadOf(cid).sort((a,b)=>b.ovr-a.ovr).slice(0,4).map(p=>p.name);}catch(e){return [];}})();
  const legs=Object.values(G.leg||{}).filter(x=>x&&x.n).slice(0,3).map(x=>x.n);const g=1+(Math.random()<0.6?1:0)+(Math.random()<0.2?1:0),num=G.p.num||9;
  const L=[[`🏟 ${c.name} stadyumu tıklım tıklım. Tribünlerde dev bir pankart: “TEŞEKKÜRLER ${(G.p.name||'CENK').toLocaleUpperCase('tr-TR')}”.`,'big'],
   [`Takım arkadaşların ${mates.slice(0,3).join(', ')||'eski dostların'} ve ${legs.length?legs.join(', ')+' gibi efsaneler':'yıllar boyu birlikte oynadığın efsaneler'} seninle aynı sahada.`],
   ['Çocuğun elinden tutarak sahaya çıkıyorsun; tüm stat ayakta alkışlıyor.'],
   [`8’ Gol! İlk golün geliyor — ${c.short} tribünleri yıkılıyor.`,'goal'],
   ...(g>=2?[[`37’ Bir gol daha! Eski takım arkadaşının ortasında kafayla ağları sarsıyorsun.`,'goal']]:[]),
   ...(g>=3?[[`61’ Ve hat-trick! Jübilede bile durdurulamıyorsun.`,'goal']]:[]),
   [`70’ Oyundan alınıyorsun. Kaptanlık bandını genç bir oyuncuya bağlıyorsun; ${CT.ap} maç ve ${CT.g} golün anısına tüm stat dakikalarca seni alkışlıyor.`],
   [`🎽 Kulüp başkanı ${num} numaralı formanı emekliye ayırdığını açıklıyor. Bu numarayı bir daha kimse giymeyecek.`,'big'],
   [`🎤 Mikrofon sende: “Mahalle sahasından buraya kadar… Bu forma, bu taraftar her şeyimdi. Teşekkürler.”`]];
  JUB={L,i:0,cid,g,t:null};const ov=document.createElement('div');ov.id='jub';ov.className='jub';ov.innerHTML=`<div class="jub-c"><p class="jub-k">JÜBİLE MAÇI · ${esc(c.name)}</p><h2>${esc(G.p.name||'Cenk Kuşku')}</h2><div class="jub-l" id="jubL"></div><div class="jub-b"><button class="btn" data-jub="skip">Sona geç</button><button class="cta" data-jub="end" id="jubEnd" hidden>Futbola veda et</button></div></div>`;
  document.body.appendChild(ov);ov.addEventListener('click',e=>{const b=e.target.closest('[data-jub]');if(!b)return;if(b.dataset.jub==='skip'){while(JUB&&JUB.i<JUB.L.length)jubNext(true);}else jubEnd();});jubNext();}
function jubNext(fast){if(!JUB)return;const el=$('#jubL');if(!el)return;const [t,c]=JUB.L[JUB.i++];el.insertAdjacentHTML('beforeend',`<p class="${c||''}">${esc(t)}</p>`);el.scrollTop=el.scrollHeight;
  if(JUB.i<JUB.L.length){if(!fast)JUB.t=setTimeout(jubNext,1700);}else{clearTimeout(JUB.t);const b=$('#jubEnd');if(b)b.hidden=false;}}
function jubEnd(){if(!JUB)return;clearTimeout(JUB.t);const J=JUB;JUB=null;const ov=$('#jub');if(ov)ov.remove();G.jub={c:J.cid,y:G.s?G.s.year:2026,g:J.g,num:G.p.num||9};G.p.fame=clamp(G.p.fame+5,0,100);
  msg('news',`Duygusal veda: ${G.p.name} jübilesini yaptı`,`${CLUBS[J.cid]?CLUBS[J.cid].name:'Kulübü'} taraftarı önünde ${J.g} gol atan ${G.p.name}, gözyaşları içinde futbola veda etti. Forma numarası emekliye ayrıldı.`);jubRetire0();}
let jubRetire0=null;
retire=(old=>{jubRetire0=()=>old();return function(){try{if(isPl()&&G.p.age>=33&&!G.jub&&jubClub()){closeModal();return jubOpen();}}catch(e){console.warn(e);}return old.apply(this,arguments);};})(retire);
/* emeklilikte hocalık: efsanesi olduğun kulüp kapını çalar */
mgrRep=(old=>function(){let r=old.apply(this,arguments);try{const n=lcGoals().find(g=>g.id==='leg');if(n&&n.v)r=Math.min(95,r+6);}catch(e){}return r;})(mgrRep);
mgrJobOffers=(old=>function(rep,n){const ids=old.apply(this,arguments);try{if(G&&G.phase==='retired'&&isPl()&&ids.length){const lc=Object.entries(lcClubTot()).filter(([c,x])=>x.ap>=120||x.ys>=5).sort((a,b)=>b[1].ap-a[1].ap)[0];
    if(lc&&CLUBS[lc[0]]&&!ids.includes(lc[0])){ids[ids.length-1]=lc[0];G.legOffer=lc[0];}}}catch(e){}return ids;})(mgrJobOffers);
becomeManager=(old=>function(){const r=old.apply(this,arguments);try{const id=G.legOffer;if(id){const b=document.querySelector(`#modalCard [data-act=mgrSign][data-id="${id}"]`);if(b){const card=b.closest('.offer');if(card&&!card.querySelector('.lg-tag'))card.insertAdjacentHTML('afterbegin',`<span class="lg-tag">🏛 Efsane dönüyor · taraftar seni bekliyor</span>`);}}}catch(e){}return r;})(becomeManager);

