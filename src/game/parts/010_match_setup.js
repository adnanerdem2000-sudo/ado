/* ================= MATCH SETUP ================= */
function buildMatch(us,opp,usHome,role,comp,national){
  const P=POS[G.p.pos],vis=national?null:clubVision(us),nC=role==='start'?P.n+(Math.random()<.35?1:0)+((vis==='hucum'&&(G.p.pos==='FW'||G.p.pos==='KN'))||(vis==='savunma'&&(G.p.pos==='DF'||G.p.pos==='OS'))?1:0):rint(1,2),entry=role==='sub'?rint(55,72):0;
  const mins=[];let guard=0;while(mins.length<nC&&guard++<200){const m=rint(Math.max(4,entry+3),88);if(!mins.some(x=>Math.abs(x-m)<5))mins.push(m);}mins.sort((a,b)=>a-b);
  let pen=false;const chances=mins.map(m=>{let t=wpick(P.mix);if(t==='penalti'){if(pen)t='atak';pen=true;}return {m,type:t};});
  const nAtk=chances.filter(c=>!['savunma','dkorner'].includes(c.type)).length,nDef=chances.length-nAtk;
  const usStr=us.str+(OVR()-us.str)*0.06;
  const [lh,la]=lambdas(usHome?usStr:opp.str,usHome?opp.str:usStr);
  const lamUs=Math.max(0.15,(usHome?lh:la)-nAtk*0.2),lamOpp=Math.max(0.15,(usHome?la:lh)-nDef*0.22);
  const p=G.p,pInj=0.018*(1.3-p.a.fiz/150)*(p.up.diyet?0.75:1)*(p.up.fizyo?0.85:1)*(p.playHurt&&p.injury?3.2:1)*(role==='sub'?0.5:1)*proneF();
  const injMin=Math.random()<pInj?rint(Math.max(5,entry+2),88):0;
  return {home:usHome?us:opp,away:usHome?opp:us,usHome,comp,role,entry,chances,lamUs,lamOpp,injMin,us,opp,national:!!national};
}
function onPlay(sim){const t=dayType(G.s.day);const go=cfg=>sim?simMatch(cfg):startMatch(cfg);
  if(t==='kupa')return playCup(sim);
  if(t==='milli'&&G.s.nat){const n=G.s.nat,tr=TRnat(n);const r=OVR()>=tr.str-6?'start':'sub';const cfg=buildMatch(tr,n.opp,true,r,`${n.lv} · ${n.comp||'Hazırlık'}`,true);cfg.onEnd=res=>finishNational(res,cfg);return go(cfg);}
  if(t!=='mac')return toast('Bugün maç yok');
  const f=ourFixture(),usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]],me=myClub(),sq=G.s.squad&&G.s.squad.r===G.s.week?G.s.squad.role:null;
  const role=!canPlay()?(G.p.ban?'banned':'injured'):(sq&&['start','sub','squad'].includes(sq)?sq:decideRole());
  if(role!=='start'&&role!=='sub'){const [hg,ag]=simScore(f[0],f[1]);finishLeague({us:usHome?hg:ag,opp:usHome?ag:hg,played:false},f,role);return;}
  const cfg=buildMatch(me,opp,usHome,role,`${curLeague().short} · ${G.s.week}. Hafta`);cfg.onEnd=res=>finishLeague(res,f,role);go(cfg);
}
function applyPlayed(res,role,win,draw,notes,tier,league){
  const p=G.p,st=G.s.stats;
  if(league){st.apps++;if(role==='start')st.starts++;st.goals+=res.goals;st.assists+=res.assists;st.rsum+=res.rating;st.mins+=res.mins;if(res.yc)st.yc++;st.rc+=res.rc;G.totals.apps++;G.totals.goals+=res.goals;G.totals.assists+=res.assists;}
  p.form.push(res.rating);if(p.form.length>5)p.form.shift();
  if(league){const v=clubVision(myClub()),d=(res.rating-6.4)*5;p.trust=clamp(p.trust+d*(v==='genc'&&d>0?1.3:v==='sampiyon'&&d<0?1.4:1),0,100);}
  p.morale=clamp(p.morale+(res.rating-6.5)*4+(win?4:draw?0:-3),0,100);
  p.fame=clamp(p.fame+Math.max(0,res.rating-6.3)*0.5*(1+tier*0.3)+res.goals*0.5*(1+tier*0.25)+(league?0:2),0,100);
  p.energy=res.cond!=null?clamp(Math.min(p.energy,res.cond)-6,0,100):clamp(p.energy-32*res.mins/90*(p.up.diyet?0.85:1),0,100);
  for(const k in p.a)p.a[k]=Math.min(p.pot[k],p.a[k]+0.035*(res.mins/90)*(1+tier*0.06));
  if(league&&res.yc&&!res.rc){p.yellows++;if(p.yellows>=4){p.ban=1;p.yellows=0;notes.push('4. sarı kart: bir maç cezalısın.');}else notes.push(`Sarı kart gördün (${p.yellows}/4).`);}
  if(league&&res.rc){p.ban=tier<=2?1:2;p.trust=clamp(p.trust-6,0,100);notes.push(`Kırmızı kart! ${p.ban} maç ceza aldın.`);}
  if(!res.injured&&res.knock&&!p.injury){const d=rint(3,7);p.injury={name:'Darbe (hafif)',days:d,total:d,serious:false};notes.push(`Hafif sakatlık: yaklaşık ${d} gün dinlenmen gerekiyor.`);}
  if(res.injured){const worse=p.injury&&p.playHurt;const inj=rollInjury(res.injSerious?1.8:worse?1.6:1,res.injKind);p.injury=inj;notes.push(`Sakatlık: ${inj.name}. Tahmini ${injTxt(inj)} sahalardan uzak kalacaksın.`);msg('injury','Sakatlık raporu',`${inj.name}. Sağlık ekibi yaklaşık ${injTxt(inj)} sürecek bir tedavi öngörüyor.${inj.serious?' Uzun ve zorlu bir süreç seni bekliyor.':''}`);}
  if(league&&win&&tier>=3){const b=Math.round(G.contract.wage*0.25);if(b>0){p.money+=b;notes.push(`Galibiyet primi: ${money(b)}`);}}
}
function finishLeague(res,f,role){
  const usHome=f[0]===G.club,hg=usHome?res.us:res.opp,ag=usHome?res.opp:res.us;
  const rd=G.s.fixtures[G.s.week-1].map(([h,a])=>{if(h===f[0]&&a===f[1])return [h,a,hg,ag];const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(rd);
  creditRound(rd,res.played?{g:res.goals||0,a:res.assists||0}:null);if(res.played)(G.s.mrs=G.s.mrs||[]).push(res.rating);
  const notes=[],win=res.us>res.opp,draw=res.us===res.opp,p=G.p;
  if(res.played)applyPlayed(res,role,win,draw,notes,curLeague().tier,true);
  else if(role==='banned'){p.ban=Math.max(0,p.ban-1);notes.push('Cezan nedeniyle maçı tribünden izledin.');}
  else if(role==='injured')notes.push('Sakatlığın nedeniyle maçı tribünden izledin.');
  else{p.trust=clamp(p.trust-1,0,100);p.morale=clamp(p.morale-4,0,100);notes.push('Hoca seni kadroya almadı. Antrenmanlarda ve video analizde kendini göstermelisin.');}
  if(res.played&&res.rating>=8)msg('coach','Hocadan tebrik',`Hoca maç sonrası seni övdü: “${pick(['Bugün fark yarattı.','Böyle devam ederse çok yükselir.','Tam istediğim performans.'])}”`);
  const home=CLUBS[f[0]],away=CLUBS[f[1]];
  afterMatch(res,!!res.played,home,away,hg,ag);
  showResult(home,away,hg,ag,res,notes);
}
function finishNational(res,cfg){
  const notes=[],p=G.p,win=res.us>res.opp,draw=res.us===res.opp;
  if(res.played){p.caps++;p.natGoals+=res.goals;applyPlayed(res,cfg.role,win,draw,notes,8,false);notes.unshift(`${G.s.nat.lv} formasıyla ${p.caps}. maçına çıktın.`);}
  msg('nat',`${cfg.comp.split(' · ')[0]}: Türkiye ${res.us}-${res.opp} ${cfg.opp.name}`,res.played?`Maç puanın ${dec(res.rating)}. ${res.goals?res.goals+' gol attın!':''}`:'Bu maçta süre alamadın.');
  if(G.s.nat&&G.s.nat.comp)natRecord(G.s.nat.comp,G.s.nat.day,res.us,res.opp);
  G.s.nat=null;nextDay();save();
  showResult(cfg.home,cfg.away,res.us,res.opp,res,notes);
}

