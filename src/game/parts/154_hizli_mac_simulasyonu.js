/* ================= HIZLI MAÇ SİMÜLASYONU ================= */
function simMatch(cfg){const p=G.p,rel=(OVR()-cfg.opp.str)/20,R={gu:poisson(cfg.lamUs),go:poisson(cfg.lamOpp),adj:0,goals:0,assists:0,tackles:0};
  const start=cfg.role==='start'?0:cfg.entry;let out=90,inj=false;
  for(const c of cfg.chances){if(c.m<start)continue;const t=c.type,r=Math.random(),q=clamp(1+rel*0.8+(p.energy<40?-0.25:0),0.35,1.9)*((cfg.pkq&&cfg.pkq[t])||1);let code;
    if(t==='savunma'||t==='dkorner'){const ok=clamp(0.5+rel*0.25+((cfg.pkq&&cfg.pkq[t])||0),0.2,0.88);code=r<ok?(t==='dkorner'?'clear':'tackle'):r<ok+0.27?'defOk':r<ok+0.35?'foul':'conceded';}
    else if(t==='penalti')code=r<clamp(0.7+rel*0.1+((cfg.pkq&&cfg.pkq.pen)||0),0.5,0.95)?'goal':'saved';
    else{const g=({atak:0.14,kontra:0.28,serbest:0.09,korner:0.1}[t]||0.12)*q,a=0.07*q;code=r<g?'goal':r<g+a?'assist':r<g+a+0.33?'saved':r<g+a+0.62?'lost':'wide';}
    const RR=RES[code];R.adj+=RR.adj;if(RR.us)R.gu++;if(RR.opp)R.go++;if(RR.cg)R.goals++;if(RR.as)R.assists++;if(code==='tackle')R.tackles++;}
  if(cfg.injMin&&cfg.injMin>=start){inj=true;out=cfg.injMin;}
  const mins=Math.max(1,out-start),win=R.gu>R.go,draw=R.gu===R.go;
  const rating=Math.round(clamp(5.9+(win?0.35:draw?0.05:-0.25)+R.adj+gauss()*0.25,3,10)*10)/10,cond=clamp(p.energy-mins*0.42*(1.25-p.a.fiz/200),0,100);
  cfg.onEnd({us:R.gu,opp:R.go,played:true,rating,goals:R.goals,assists:R.assists,yc:0,rc:0,injured:inj,injKind:'darbe',mins,tackles:R.tackles,cond,sim:true});}

