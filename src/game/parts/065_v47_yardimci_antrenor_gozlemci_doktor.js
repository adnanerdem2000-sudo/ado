/* ================= v47: yardımcı antrenör, gözlemci, doktor derinliği ================= */
const stWk=()=>G.s.year*100+G.s.week;
function stTick(){if(!isStaff()||!G.s||G.phase!=='season')return;const j=stG(),wk=Math.floor(absDay()/7);if(j.v47wk===wk)return;j.v47wk=wk;
  try{if(G.staff==='yrd'){yrMentorWeek();yrIntCheck();}else if(G.staff==='scout'){scRivalWeek();scTeamWeek();}else if(G.staff==='dr'){drTeamWeek();drMedWeek();}}catch(e){console.warn(e);}}
nextDay=(old=>function(){const out=old.apply(this,arguments);try{stTick();}catch(e){console.warn(e);}return out;})(nextDay);

