/* ================= TAKVİM: ligin gerçek takım sayısına göre fikstür ================= */
const BREAK={TR:[[11,21],[0,10]],DE:[[11,21],[0,10]],FR:[[11,21],[0,3]],IT:[[11,29],[0,3]],ES:[[11,22],[0,2]],EN:null,PT:[[11,23],[0,2]],NL:[[11,21],[0,9]],BE:[[11,27],[0,14]],SA:[[11,20],[0,3]],BR:null,SC:[[11,30],[0,12]],GR:[[11,23],[0,3]],AT:[[11,14],[1,5]],CH:[[11,20],[0,25]],DK:[[11,8],[1,15]]};
function dayOfDate(y,m,dd){return Math.round((Date.UTC(y+(m<6?1:0),m,dd)-seasonStartTs(y))/DAY_MS);}
function buildCal(lid,y){const L=LEAGUES[lid],n=leagueClubs(lid).length,R=2*(n-1),am=L.tier<=4;
  let first=dayOfDate(y,am?8:7,am?5:8);while(wdOf(new Date(seasonStartTs(y)+first*DAY_MS))!==5)first++;
  const last=dayOfDate(y,4,am?16:24),B=BREAK[L.cc||'TR'],b0=B?dayOfDate(y,B[0][0],B[0][1]):1e9,b1=B?dayOfDate(y,B[1][0],B[1][1]):-1;
  const sats=[];for(let d=first;d<=last;d+=7)if(!(d>=b0&&d<=b1))sats.push(d);
  let days=[];
  if(R<=sats.length){for(let i=0;i<R;i++)days.push(sats[Math.round(i*(sats.length-1)/Math.max(1,R-1))]);}
  else{const extra=R-sats.length,mid=new Set();for(let k=0;k<extra;k++){let i=clamp(Math.floor((k+0.5)*sats.length/extra),1,sats.length-1);while(mid.has(sats[i]-4)&&i<sats.length-1)i++;mid.add(sats[i]-4);}days=[...sats,...mid];}
  days=[...new Set(days)].sort((a,b)=>a-b);while(days.length<R)days.push(days[days.length-1]+4);return days.slice(0,R);}
const NR=()=>G.s.cal.length;
const inWindow=()=>twOpen();

