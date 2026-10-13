/* ================= BİREYSEL İDMAN: sahada çalışma ================= */
const DRILL_NAME={sut:'Şut çalışması',serbest:'Serbest vuruş',penalti:'Penaltı'};
function runDrill(kind){if(G.slot)return toast('Bugünün serbest zamanını kullandın');if(G.p.injury)return toast('Sakatken sahada çalışamazsın');
  DR={kind,n:0,goals:0,max:5,type:{sut:'drill',serbest:'serbest',penalti:'penalti'}[kind]};
  openMatchView();$('#tabs').hidden=true;$('#mvFeed').innerHTML='';$('#mvDone').hidden=true;$('#mvFast').hidden=true;drillBoard();drillNext();}
function drillBoard(){$('#mvBoard').innerHTML=`<div class="team me">${crestSVG(myClub(),30)}<b>İdman sahası</b></div><div class="mv-mid"><div class="mv-score">${DR.goals}/${DR.n}</div><div class="mv-comp">${DRILL_NAME[DR.kind]}</div></div><div class="team"><b>${DR.max-DR.n} hak</b><small>Gol = gelişim</small></div>`;}
function drillNext(){const p=G.p,club=myClub();
  const C={cond:p.energy,us:club,opp:{id:'idman',name:'İdman',short:'İDM',c1:'#e8e4d6',c2:'#5c6b61',str:club.str},a:p.a,energy:p.energy,morale:p.morale,up:p.up,pos:p.pos,num:p.num,hurt:false,drill:true};
  startMoment(DR.type,C,`${DRILL_NAME[DR.kind]} · ${DR.n+1}/${DR.max}`,res=>{DR.n++;if(res.code==='goal')DR.goals++;drillBoard();if(DR.n<DR.max)setTimeout(drillNext,250);else drillEnd();});}
function drillEnd(){const p=G.p,k=DR.kind,goals=DR.goals,gs=[];closeMatchView();$('#tabs').hidden=false;
  const base=(0.06+goals*0.03)*(p.up.antrenor?1.4:1);const add=(a,m)=>{const g=gainAttr(a,base*m);gs.push(`${ATTR[a]} +${dec(g,2)}`);};
  add('sut',1);if(k==='serbest')add('pas',0.5);if(k==='sut')add('dri',0.4);
  bump('energy',-10);if(k==='penalti'&&goals>=4)bump('morale',4);
  G.slot=true;G.slotText=`${DRILL_NAME[k]}: ${goals}/5 gol · ${gs.join(', ')}`;DR=null;save();render();
  openModal(`<h3>İdman bitti</h3><div class="res-rate"><b class="${goals>=4?'g':goals>=2?'m':'b'}">${goals}/5</b><div><span>${DRILL_NAME[k]}</span><div>${gs.join(' · ')}</div></div></div><button class="cta" data-act="closeModal">Tamam</button>`);}

