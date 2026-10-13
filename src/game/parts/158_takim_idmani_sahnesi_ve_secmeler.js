/* ================= TAKIM İDMANI SAHNESİ ve SEÇMELER ================= */
let TR=null;
const TR_PLAN={kondisyon:['tr_kos','tr_kos','tr_kos'],kamp:['tr_kos','tr_top','savunma'],teknik:['tr_top','tr_top','drill'],taktik:['savunma','dkorner','savunma'],hazirlik:['korner','serbest','penalti'],oyun:['atak','savunma','kontra']};
const TRY_PLAN={FW:['drill','atak','kontra'],KN:['tr_top','atak','kontra'],OS:['atak','serbest','savunma'],DF:['savunma','korner','savunma']};
const TR_NAME={tr_kos:'Koni parkuru',tr_top:'Top sürme parkuru',drill:'Bitiricilik',savunma:'Savunma',dkorner:'Korner savunması',korner:'Korner',serbest:'Serbest vuruş',penalti:'Penaltı',atak:'Hücum',kontra:'Kontra'};
function trScore(type,r){const c=r.code;
  if(r.tr!=null)return r.tr;
  if(type==='tr_top'){const f=r.ng?(r.gates||0)/r.ng:0;return clamp(f*0.6+(c==='goal'?0.4:c==='saved'||c==='post'?0.15:0),0,1);}
  if(type==='tr_kos')return 0.3*((r.gates||0)/(r.ng||6));
  if(['goal','assist','tmGoal','tackle','intercept','shotBlock','clear'].includes(c))return 1;
  if(['saved','post','defOk','gkSave','oppMiss','oppOff','fouled','penWon','tmMiss','gkClaim','cleared'].includes(c))return 0.55;
  return 0.15;}
function startTraining(t,kind){const p=G.p;kind=kind||'team';
  TR={t,kind,plan:kind==='try'?TRY_PLAN[p.pos]:TR_PLAN[t],i:0,sc:[],g0:{...p.a}};
  openMatchView();$('#tabs').hidden=true;$('#mvFeed').innerHTML='';$('#mvDone').hidden=true;$('#mvFast').hidden=true;$('#mvSkip').hidden=false;trBoard();setTimeout(trNext,200);}
function trClubs(){const p=G.p;if(TR.kind==='try')return [{id:'secme',name:'Seçme Grubu',short:'SÇM',c1:'#2a8c4a',c2:'#ffffff',str:40},{id:'secme2',name:'Rakip grup',short:'RKP',c1:'#f2c230',c2:'#1d1d1d',str:40}];
  const club=myClub();return [club,{id:'yedek',name:'Yedekler',short:'YDK',c1:'#f2c230',c2:'#1d1d1d',str:Math.max(20,club.str-3)}];}
function trBoard(){if(!TR)return;const n=TR.sc.length,ok=TR.sc.filter(s=>s>=0.5).length,[us]=trClubs(),tr=TR.kind==='try';
  $('#mvBoard').innerHTML=`<div class="team me">${crestSVG(us,30)}<b>${tr?'Seçme günü':'Takım idmanı'}</b></div><div class="mv-mid"><div class="mv-score">${ok}/${n}</div><div class="mv-comp">${tr?'Gözlemciler tribünde':DT[TR.t].n}</div></div><div class="team"><b>${TR.plan.length-n} deneme</b><small>${tr?'Kulüpler izliyor':'Hoca izliyor'}</small></div>`;}
function trNext(){if(!TR)return;const p=G.p,[us,opp]=trClubs(),type=TR.plan[TR.i];
  const C={cond:TR.kind==='try'?100:p.energy,us,opp,a:p.a,energy:p.energy,morale:p.morale,up:p.up,pos:p.pos,num:p.num,hurt:false,drill:true,
    sub:type==='korner'?((p.pos==='KN'||p.pos==='OS')?'take':'box'):null};
  startMoment(type,C,`${TR.kind==='try'?'Seçme':'İdman'} · ${TR_NAME[type]} ${TR.i+1}/${TR.plan.length}`,res=>{if(!TR)return;TR.sc.push(trScore(type,res));TR.i++;trBoard();
    if(TR.i<TR.plan.length)setTimeout(trNext,350);else trEnd(false);});}
function trSkip(){if(!TR)return;if(MG.S){MG.S=null;cancelAnimationFrame(MG.raf);}resetInput();$('#mvStage').hidden=true;$('#match').classList.remove('live');trEnd(true);}
function trEnd(skipped){const t=TR.t,kind=TR.kind,sc=TR.sc,avg=sc.length?sc.reduce((a,b)=>a+b,0)/sc.length:null,g0=TR.g0;TR=null;
  $('#mvSkip').hidden=true;closeMatchView();$('#tabs').hidden=false;
  if(kind==='try')return tryoutEnd(avg==null?0.45:avg,skipped&&!sc.length);
  const perf=avg;teamSession(t,perf);
  const p=G.p,gains=Object.keys(ATTR).map(k=>[k,p.a[k]-g0[k]]).filter(x=>x[1]>=0.005).map(([k,v])=>`${ATTR[k]} +${dec(v,2)}`);
  nextDay();save();render();window.scrollTo(0,0);
  if(perf==null){toast('İdman atlandı');return;}
  const gr=perf>=0.75?['Hoca çok memnun','g']:perf>=0.45?['İyi bir idman','m']:['Hoca daha fazlasını bekliyor','b'];
  openModal(`<h3>İdman bitti</h3><div class="res-rate"><b class="${gr[1]}">${Math.round(perf*100)}</b><div><span>${DT[t].n}</span><div>${gr[0]}</div></div></div>${gains.length?`<ul class="notes">${gains.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<button class="cta" data-act="closeModal">Tamam</button>`);}

/* Seçmeler: performansa göre U14 kulüpleri teklif yapar */
function tryoutEnd(avg,skipped){const cl=leagueClubs('u14').sort((a,b)=>b.str-a.str),n=avg>=0.66?3:avg>=0.38?2:1;
  const start=avg>=0.66?0:avg>=0.38?Math.floor(cl.length*0.25):Math.floor(cl.length*0.55);
  const pool=shuffle(cl.slice(start,start+n+2)).slice(0,n).sort((a,b)=>b.str-a.str);
  const offers=pool.map((c,i)=>({club:c.id,role:avg>=0.7&&i>0?'İlk 11':avg>=0.45?'Altyapı':'Gelişim',wage:Math.round(LEAGUES.u14.wage*(0.8+avg*0.6)*(VIS_WAGE[clubVision(c)]||1)/10)*10}));
  G.tryout={avg,offers,skipped:!!skipped};save();render();window.scrollTo(0,0);}
function signTryout(i){const o=G.tryout&&G.tryout.offers[i];if(!o)return;const avg=G.tryout.avg,p=G.p;
  G.club=o.club;G.contract={years:2,wage:o.wage,role:o.role};p.trust=clamp((ROLE_TRUST[o.role]||55)+(avg-0.5)*10,30,85);p.fame=Math.round(avg*4);
  G.inbox=[];G.tryout=null;G.phase='season';newSeason(2026);
  msg('coach',('Hoş geldin '+meF()+'!'),`${CLUBS[o.club].name} altyapısına imza attın. Hocan: “Seçmelerde seni izledim. Burada herkes yerini sahada kazanır. Hazırlık kampı bugün başlıyor, ilk lig maçımız ${fmtDate(dateOf(ROUND_DAY(1)),true)}.”`);
  if(avg>=0.75){const c=pick(leagueClubs('u16'));if(c){G.watch[c.id]={i:22,lv:0};msg('gundem',`${c.name} gözlemcisi seçmelerdeydi`,`Seçmelerdeki performansın ${c.name} gözlemcisinin de dikkatini çekti. İlk sezonunu yakından takip edecekler.`);}}
  save();TAB='hub';render();window.scrollTo(0,0);}
function viewTryout(){const p=G.p,T=G.tryout;
  if(!T||!T.offers){const plan=TRY_PLAN[p.pos].map(t=>TR_NAME[t]);
    return `<section class="today"><div class="td-head"><div><span class="kicker">${fmtLong(today())}</span><h2 class="h">Seçme günü</h2></div><span class="pill warn">${POS[p.pos].name}</span></div>
    <p class="td-desc">İstanbul’un amatör kulüplerinin altyapı hocaları ve gözlemcileri sahada. Üç denemede kendini göster; performansına göre kulüpler sana teklif yapacak. İyi bir seçme daha güçlü kulüplerin kapısını açar.</p>
    <ul class="notes">${plan.map((n,i)=>`<li>${i+1}. deneme: ${n}</li>`).join('')}</ul></section>
    <button class="cta big" data-act="tryStart"><span>Seçmelere çık</span><small>3 deneme · kendin oyna</small></button>
    <button class="btn" data-act="trySkip">Seçmeyi atla (ortalama performans sayılır)</button>${licenseHTML(true)}`;}
  const pct=Math.round(T.avg*100),gr=T.skipped?'Seçmeye katılmadın':T.avg>=0.66?'Herkesin dilinde!':T.avg>=0.38?'Fena değil':'Zor bir gündü';
  return `<section class="panel"><p class="sub-h"><span>Seçme sonucu</span><span>${T.skipped?'—':pct+' puan'}</span></p><div class="res-rate"><b class="${T.avg>=0.66?'g':T.avg>=0.38?'m':'b'}">${T.skipped?'—':pct}</b><div><span>Gözlemci notu</span><div>${gr}</div></div></div></section>
  <p class="sub-h" style="margin:14px 2px 8px"><span>Gelen teklifler</span><span>${T.offers.length} kulüp</span></p>
  ${T.offers.map((o,i)=>{const c=CLUBS[o.club];return `<div class="offer"><div class="offer-head">${crestSVG(c,40)}<div><b>${esc(c.name)}</b><span>${LEAGUES.u14.name}</span></div><span class="pill warn">${o.role}</span></div>${visLine(c)}<p class="muted" style="margin:6px 0 10px">2 yıllık altyapı sözleşmesi · haftalık ${money(o.wage)}</p><button class="cta" data-act="trySign" data-i="${i}">İmzala</button></div>`;}).join('')}`;}

