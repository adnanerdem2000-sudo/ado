/* ================= v88: sezon içi gelişim + teknik ekipten gelişim raporları ================= */
/* Gelişim artık sezon sonunda tek seferde değil, sezon boyunca adım adım işler: oyuncunun bu yılki ve gelecek yılki
   gücü arasında, sezonun ilerleyişine göre geçiş yapılır. (Takım antrenmanı / bireysel program bonusları ayrıca eklenir.) */
function seasonFrac(){try{if(!G||!G.s)return 0;if(G.phase==='off')return 1;return clamp(G.s.day/310,0,1);}catch(e){return 0;}}
const AGEP0=ageP;
ageP=(old=>function(p){const r=old.apply(this,arguments);try{if(!p||!G||!G.s||G.phase==='tryout')return r;const f=seasonFrac();if(f<=0)return r;
  const n=old.call(this,Object.assign({},p,{start:(p.start||2026)-1}));if(!n||n.ovr===r.ovr)return r;
  return Object.assign({},r,{ovr:Math.round(clamp(r.ovr+(n.ovr-r.ovr)*f,30,96)),ovrS:r.ovr,ovrN:n.ovr});}catch(e){return r;}})(ageP);
/* bir oyuncunun bu sezonki gelişimi: sezon başı → şimdi (antrenman bonusu dahil) */
function devInfo(p){try{const base=AGEP0(p),d=(G&&G.m&&G.m.dev&&G.m.dev[p.k])||0,d0=(G&&G.m&&G.m.dev0&&G.m.dev0[p.k])||0;const now=p.ovr!=null?p.ovr:ageP(p).ovr;
  const st=Math.round(clamp(base.ovr+d0,30,97));return {start:st,now,delta:now-st,pot:potOf(p)};}catch(e){return null;}}
function devWord(di,p){if(!di)return '';const dl=di.delta,young=p.age<=23,gap=di.pot-di.now;
  if(dl>=5)return 'çok hızlı gelişiyor';if(dl>=3)return 'gelişimi çok iyi gidiyor';if(dl>=1)return young?'gelişimi iyi gidiyor':'formunu yukarı taşıdı';
  if(dl<=-2)return 'belirgin düşüşte';if(dl<=-1)return p.age>=30?'yaşla birlikte düşüş gösteriyor':'geriledi';
  return young&&gap>=5?'gelişimi beklenenden yavaş':'durağan';}
/* sezon başında antrenman bonuslarını not al (sezon içi farkı ölçmek için) */
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.m){G.m.dev0=Object.assign({},G.m.dev||{});G.m.dvs={};}if(G&&G.p){G.pdev0=null;G.pdev0Y=null;}}catch(e){}return r;})(newSeason);
/* ---------- aylık gelişim raporu (teknik direktör, sportif direktör, başkan) ---------- */
function devReport(){const m=G.m;if(!m||m.shadow)return;const sq=squadOf(G.club);if(!sq.length)return;m.dvs=m.dvs||{};const prev=m.dvs;
  const rows=sq.map(p=>{const di=devInfo(p);const last=prev[p.k]!=null?prev[p.k]:(di?di.start:p.ovr);let mins=0;try{const M=clubSeasonEst(G.club)[p.k];mins=M?M.ap||0:0;}catch(e){}return {p,di,m1:p.ovr-last,mins};});
  const nR=(G.s.results||[]).length||1;
  const up=rows.filter(x=>x.di&&x.m1>=1&&x.p.age<=27).sort((a,b)=>(b.m1*2+b.di.delta)-(a.m1*2+a.di.delta)).slice(0,4);
  const slow=rows.filter(x=>x.di&&x.p.age<=21&&x.di.pot-x.p.ovr>=6&&x.di.delta<=0&&x.mins<nR*0.3).slice(0,2);
  const down=rows.filter(x=>x.di&&x.p.age>=30&&(x.m1<=-1||x.di.delta<=-2)).sort((a,b)=>a.di.delta-b.di.delta).slice(0,2);
  for(const x of rows)prev[x.p.k]=x.p.ovr;
  if(!up.length&&!slow.length&&!down.length)return;
  let who='Yardımcı antrenörün';try{const y=stfMine().find(s=>s.role==='yrd');if(y&&y.name)who=`Yardımcı antrenör ${y.name}`;}catch(e){}
  const L=[];
  for(const x of up)L.push(`📈 ${x.p.name} (${x.p.age}) ${devWord(x.di,x.p)}: bu ay +${x.m1}, sezon başında ${R200(x.di.start)}, şimdi ${R200(x.p.ovr)}${x.di.pot-x.p.ovr<=1?' — potansiyelinin tavanına yakın':''}.`);
  for(const x of slow)L.push(`⏸ ${x.p.name} (${x.p.age}) yeterince süre alamıyor; gelişimi yavaşladı. Daha fazla dakika ya da kiralık düşünülebilir.`);
  for(const x of down)L.push(`📉 ${x.p.name} (${x.p.age}) ${devWord(x.di,x.p)} (${R200(x.di.start)} → ${R200(x.p.ovr)}). Yükünü azaltmak iyi olabilir.`);
  msg('squad','Gelişim raporu',`${who} aylık gelişim raporunu iletti:\n${L.join('\n')}`);}
/* ---------- futbolcu modu: antrenörden aylık geri bildirim ---------- */
function plDevReport(){const p=G.p;if(!p||!G.s)return;const now=Math.round(OVR());if(G.pdevM==null){G.pdevM=now;G.pdev0=now;G.pdev0Y=G.s.year;return;}if(G.pdev0==null||G.pdev0Y!==G.s.year){G.pdev0=G.pdevM;G.pdev0Y=G.s.year;}const d=now-G.pdevM,ds=G.pdev0!=null?now-G.pdev0:0;G.pdevM=now;
  let t;if(d>=2)t=`Antrenörün çok memnun: “Bu ay müthiş bir sıçrama yaptın (${now-d} → ${now}). Böyle devam.”`;else if(d>=1)t=`Antrenörün: “Gelişimin iyi gidiyor (genel güç ${R200(now)}). Sezon başından beri +${Math.max(ds,d)}.”`;
  else if(p.age<=23&&ds<=0)t=`Antrenörün: “Bu ay ilerleme göremedim. İdman yoğunluğunu artırmalı, maçlarda daha fazla süre kazanmalısın.”`;else if(p.age>=31&&d<0)t=`Antrenörün: “Fizik değerlerinde hafif düşüş var (${now}). Dinlenme ve bakım programına dikkat et.”`;else return;
  msg('event','Antrenörden geri bildirim',t);}
nextDay=(old=>function(){const d0=G&&G.s?today().getUTCMonth():null;const r=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'&&d0!=null&&today().getUTCMonth()!==d0&&G.s.day>20){if(G.mode==='mgr'&&G.m&&!G.m.shadow)devReport();else if(isPl())plDevReport();}}catch(e){console.warn('gelişim raporu',e);}return r;})(nextDay);
/* ---------- profil: bu sezonki gelişim ---------- */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{if(opt&&opt.acad)return h;const di=devInfo(p);if(!di)return h;const w=devWord(di,p),d2=(typeof R200==='function'?R200(di.now)-R200(di.start):di.delta),sg=d2>0?`+${d2}`:String(d2);
  const row=`<div class="fmi"><span>Bu sezon gelişim</span><b>${di.delta>0?'📈':di.delta<0?'📉':'➖'} ${sg} <small>${esc(w)} · sezon başı ${typeof R200==='function'?R200(di.start):di.start}</small></b></div>`;
  h=h.replace(/(<div class="fmi"><span>Moral<\/span>)/,row+'$1');if(h.indexOf('Bu sezon gelişim')<0)h=h.replace('<div class="fmi two">',row+'<div class="fmi two">');}catch(e){}return h;})(fmProfHTML);

