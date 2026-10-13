/* ================= DECISIONS ================= */
function decideRole(){const c=myClub();let s=(OVR()-c.str)+(G.p.trust-50)/4+(formAvg()-6.5)*5+(G.p.energy<40?-8:0)+(ROLE_BONUS[G.contract.role]||0)+({genc:G.p.age<=21?3:0,sampiyon:-3,tutumlu:2}[clubVision(c)]||0)+prepAdj();if(LEAGUES[c.league].tier===0)s+=5;return s>=-3?'start':s>=-12?'sub':'squad';}
const canPlay=()=>(!G.p.injury||G.p.playHurt)&&G.p.ban===0;
function ageF(age){return age<=15?1.3:age<=18?1.15:age<=21?1:age<=24?0.8:age<=28?0.5:age<=31?0.3:0.15;}
function rollInjury(mult=1,kind){const L=INJ.filter(x=>!kind||x[4]===kind);const x=wpick(L.map(q=>[q,q[3]]));const weeks=Math.max(1,Math.round(rint(x[1],x[2])*mult));
  if(x[1]>=20)G.p.a.hiz=Math.max(10,G.p.a.hiz-rnd(1,3));
  const days=Math.max(3,weeks*7+rint(-2,2)),serious=weeks>=6;
  if(serious)G.p.prone=Math.min(4,(G.p.prone||0)+1);
  (G.injHist=G.injHist||[]).push({d:fmtDate(today(),true),n:x[0],days});
  return {name:x[0],days,total:days,serious};}
const proneF=()=>1+(G.p.prone||0)*0.15;
const injTxt=i=>i.days>=14?`${Math.round(i.days/7)} hafta`:`${i.days} gün`;

