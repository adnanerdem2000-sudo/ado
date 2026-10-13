/* ================= KİRALIK ================= */
function genLoanOffers(){const age=G.p.age,eff=effRating(),cur=myClub(),CL=LEAGUES[cur.league],ct=CL.tier;
  const lo=CL.youth?3:Math.max(3,ct-2),hi=CL.youth?Math.min(6,ct+4):ct;
  const cands=Object.values(CLUBS).filter(c=>{const L=LEAGUES[c.league];return c.id!==G.club&&!(G.loan&&c.id===G.loan.parent)&&!L.youth&&eligible(L,age)&&L.tier>=lo&&L.tier<=hi&&eff-clubNeed(c)>-1;})
    .map(c=>({c,m:eff-clubNeed(c)+rnd(-2,2)})).sort((a,b)=>(LEAGUES[a.c.league].cc===CL.cc?0:1)-(LEAGUES[b.c.league].cc===CL.cc?0:1)||LEAGUES[b.c.league].tier-LEAGUES[a.c.league].tier||b.c.str-a.c.str).slice(0,6);
  const pickN=shuffle(cands).slice(0,Math.min(2,cands.length));
  pickN.forEach(({c,m})=>pushOffer({id:uid(),club:c.id,league:c.league,role:m>4?'İlk 11':'Rotasyon',wage:G.contract.wage,years:0,bonus:0,kind:'loan',loan:true,status:'open',haggled:false,interest:m,renew:false}));
  G.wantLoan=false;return pickN.length;}

