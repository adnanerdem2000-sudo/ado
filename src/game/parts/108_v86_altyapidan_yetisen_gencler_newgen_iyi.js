/* ================= v86: altyapıdan yetişen gençler (newgen) — iyi akademisi olan kulüpler ilerleyen sezonlarda genç oyuncu çıkarır ================= */
/* seviye 1-5: akademi kalitesi. Listede olmayan kulüpler ligin seviyesine göre 1-2 alır. */
const ACQ={
  /* 5: dünyanın en üretken akademileri */
  fcb:5,ajax:5,benfica:5,sporting:5,rma:4,ath:4,rso:4,mci:4,che:4,ars:4,bvb:4,bayern:4,psg:4,ol:4,srfc:4,asm:4,losc:3,atalant:4,inter:3,milan:3,juve:3,roma:3,
  porto:4,braga:3,psv:4,feyenoord:4,azalk:3,genk:4,anderl:4,brugge:3,salzburg:4,hr_dinamo:5,hr_hajduk:3,rs_partizan:4,rs_zvezda:3,kobenhavn:3,midtjyl:3,
  olympiak:3,pao:3,paok:3,ua_shakhtar:4,ua_dynamo:4,liv:3,tot:3,mun:4,bha:3,sou:3,vil:3,val:3,bet:3,sev:3,atm:3,lev:2,
  flamengo:4,palmeir:4,fluminen:4,saopaulo:4,santos:4,gremio:3,intpoa:3,corinth:3,atlmg:3,vasco:3,ar_river:5,ar_boca:4,ar_velez:4,ar_argjun:5,ar_newells:4,ar_lanus:3,ar_estud:3,ar_indep:3,ar_racing:3,
  /* Türkiye */
  galatasaray:3,fenerbahce:3,besiktas:3,trabzonspor:3,basaksehir:3,bursaspor:3,altinordu:4,genclerbirligi:2,goztepe:2,kasimpasa:2};
function acqOf(id){if(ACQ[id]!=null)return ACQ[id];const c=CLUBS[id];if(!c)return 0;const L=LEAGUES[c.league];if(!L||L.youth)return 0;
  const top=(()=>{let t=0;for(const l of Object.values(LEAGUES))if(l.cc===L.cc&&!l.youth)t=Math.max(t,l.tier);return t;})();return L.tier>=top?1:0;}
const NG_P=[0,0.10,0.22,0.38,0.55,0.75];       /* bir sezonda en az bir genç çıkma olasılığı */
const NG_P2=[0,0,0,0.04,0.12,0.22];            /* ikinci genç */
const NG_MAX=4;                                /* bir kulüpte aynı anda en fazla altyapı çıkışlı genç (oyunda kalan) */
function ngName(id){const c=CLUBS[id],L=LEAGUES[c.league];let cc=L.cc||'TR';const ks=Object.keys(NAMEP);if(Math.random()<0.12)cc=ks[Math.floor(Math.random()*ks.length)];const P=NAMEP[cc]||(typeof NAMEP2!=='undefined'&&NAMEP2[cc])||NAMEP.TR;
  return {name:pick(P.f)+' '+pick(P.l),nat:(typeof CC3!=='undefined'&&CC3[cc])||(cc.length===3?cc:'TUR')};}
function ngMake(id,lv){const c=CLUBS[id],Y=G.s.year;G.ng=G.ng||{};const n=Object.keys(G.ng).length;const k='ng'+Y+'_'+id.slice(0,6)+'_'+n;
  const pos=wpick([['KL',0.7],['DF',4],['OS',4],['KN',2.6],['FW',2.6]]),nm=ngName(id),age=rint(16,18);
  const s0=(c.str0||c.str);const base=Math.round(clamp(48+(s0-60)*0.3+lv*1.2+Math.random()*6,42,70));
  const gem=Math.random()<0.012+lv*0.008;                       /* nadir: büyük yetenek */
  const pot=Math.round(clamp(base+8+lv*1.6+Math.random()*10+(gem?6+Math.random()*6:0),base+5,gem?91:85));
  G.ng[k]={k,name:nm.name,pos,age0:age,ovr0:base,nat:nm.nat,home:'akademi',club0:id,num:pickNum(id),start:Y,alive:true,ng:true,pot,gold:gem,ai:1};
  G.tx=G.tx||{};G.tx[k]=id;return G.ng[k];}
function pickNum(id){let used=new Set();try{used=new Set(squadOf(id).map(p=>p.num));}catch(e){}for(const n of [27,28,30,31,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50]){if(!used.has(n))return n;}return 60+rint(0,30);}
/* kulübün altyapı çıkışlı aktif gençleri */
function ngOf(id){const out=[];const tx=G.tx||{};for(const [k,to] of Object.entries(tx)){if(to!==id)continue;const p=G.ng&&G.ng[k];if(p&&p.ai&&p.alive)out.push(p);}return out;}
function ngSeason(){if(!G||!G.s||G.phase==='tryout')return;const Y=G.s.year;if(Y<=2026)return;G.ngY=G.ngY||{};if(G.ngY[Y])return;G.ngY[Y]=1;
  const mine=G.mode==='mgr'&&G.m?G.club:null,news=[];
  for(const id of Object.keys(CLUBS)){if(id===mine)continue;const lv=acqOf(id);if(!lv)continue;
    /* yaşlanan / gelişemeyen gençler ayrılır, kontenjan dolarsa en zayıfı gider */
    const cur=ngOf(id);for(const p of cur){const a=ageP(p);if(a.age>=24&&a.ovr<(CLUBS[id].str0||CLUBS[id].str)-8){p.alive=false;}}
    let act=ngOf(id);
    const got=[];if(Math.random()<NG_P[lv])got.push(ngMake(id,lv));if(Math.random()<NG_P2[lv])got.push(ngMake(id,lv));
    act=ngOf(id);if(act.length>NG_MAX){act.sort((a,b)=>(potOf(a)+ageP(a).ovr)-(potOf(b)+ageP(b).ovr));for(const p of act.slice(0,act.length-NG_MAX))p.alive=false;}
    for(const p of got)if(p.alive&&(p.gold||(lv>=4&&p.pot>=82)||(CLUBS[id].league===curLeague().league)))news.push([id,p]);}
  try{syncStrAll&&syncStrAll();}catch(e){}
  if(news.length){const tr=news.filter(([id])=>LEAGUES[CLUBS[id].league].cc==='TR'||CLUBS[id].league===curLeague().league).slice(0,4),big=news.filter(([id,p])=>p.gold).slice(0,3),L=[...new Map([...tr,...big].map(x=>[x[1].k,x])).values()];
    if(L.length)msg('gundem','Altyapılardan yeni yetenekler',`Yeni sezonda A takıma yükselen dikkat çekici gençler: ${L.map(([id,p])=>`${p.name} (${CLUBS[id].short}, ${p.age0} yaş, ${POS_TR[p.pos]}${p.gold?', büyük yetenek':''})`).join(', ')}.`);}}
newSeason=(old=>function(){const r=old.apply(this,arguments);try{ngSeason();}catch(e){console.warn('newgen',e);}return r;})(newSeason);
/* altyapı gençleri de emekli olur (35+), ölü kayıtlar kadroda görünmez */
ageP=(old=>function(p){const r=old.apply(this,arguments);try{if(p&&p.ng&&p.ai&&r.age>=35&&G.ng&&G.ng[p.k]&&G.ng[p.k].alive){G.ng[p.k].alive=false;}}catch(e){}return r;})(ageP);

