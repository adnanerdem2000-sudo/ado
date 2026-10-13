/* ================= v59: Sezon sonu özeti — en iyi 5 gol tekrarı, istatistik kartı, sezonun oyuncusu ================= */
/* ---------- 2B maçta gol tekrarı kaydı (halka tampon) ---------- */
fxStep=(old=>function(dt){old(dt);try{const S=FX;if(!S||S.phase!=='play'||S.headless)return;const B=S.ball,fr=[Math.round(B.x*5),Math.round(B.y*5),Math.round((B.z||0)*5)];
    for(const T of S.T)for(const p of T.P)fr.push(p.off?-999:Math.round(p.x*5),p.off?-999:Math.round(p.y*5));S.rb=S.rb||[];S.rb.push(fr);if(S.rb.length>95)S.rb.shift();}catch(e){}})(fxStep);
fxShotEnd=(old=>function(f){const S=FX;try{if(S&&f&&f.res==='g'&&S.rb&&S.rb.length>10&&f.from){const c=f.from,T=c.T,last=S.rb[S.rb.length-1].slice();
      const fin=[];for(let i=0;i<8;i++){const fr=last.slice();fr[0]=Math.round(fxX(T,FXL+0.8+i*0.08)*5);fr[2]=Math.max(0,fr[2]-i);fin.push(fr);}
      const meta=S.T.map(T2=>T2.P.map(p=>[p.num,p.spos==='KL'?1:0]));
      let nPass=0,prev=null;for(const fr of S.rb.slice(-70)){}/* pas sayısı ayrı tutulur */
      (S.grec=S.grec||[]).push({side:T.side,n:c.name,num:c.num,m:fxMin(),xg:f.xg||0.1,hdr:!!f.hdr,d:Math.round(Math.hypot(FXL-fxU(T,c.x),fxV(T,c.y)-34)),fr:S.rb.slice(-75).concat(fin),meta,col:[[S.U.c1,S.U.c2],[S.O.c1,S.O.c2]],nm:[S.U.short,S.O.short],sc:S.score.slice()});}}catch(e){console.warn(e);}return old.apply(this,arguments);})(fxShotEnd);
const glBeauty=g=>Math.round(((1-Math.min(0.9,g.xg||0.1))*60+Math.min(30,(g.d||10)*1.1)+(g.hdr?6:0)+(g.t==='serbest'?22:g.t==='kontra'?12:g.t==='penalti'?-25:0)+(g.solo?10:0)+Math.random()*12)*10)/10;
function glAdd(g){const S=G.s;if(!S)return;S.gl=S.gl||[];g.b=glBeauty(g);S.gl.push(g);S.gl.sort((a,b)=>b.b-a.b);if(S.gl.length>8)S.gl.length=8;}
fxClose=(old=>function(){try{const S=FX;if(S&&!S.watch&&G.mode==='mgr'&&S.grec&&S.phase==='end'){const opp=S.O.short;for(const r of S.grec.filter(x=>x.side===0))glAdd(Object.assign({opp,y:G.s.year,wk:G.s.week,t:r.hdr?'kafa':'oyun'},r));}}catch(e){console.warn(e);}return old.apply(this,arguments);})(fxClose);
/* futbolcu modu: Cenk’in golleri (tekrar sahnesi sonradan üretilir) */
let LASTCFG=null;
simMatch=(old=>function(cfg){LASTCFG=cfg;return old.apply(this,arguments);})(simMatch);
startMatch=(old=>function(cfg){LASTCFG=cfg;return old.apply(this,arguments);})(startMatch);
applyPlayed=(old=>function(res,role,win,draw,notes,tier,league){const r=old.apply(this,arguments);try{if(isPl()&&res&&res.goals>0){const C=LASTCFG,types=C&&C.chances?C.chances.map(x=>x.type).filter(t=>!['savunma','dkorner'].includes(t)):[];const opp=C&&C.opp?C.opp.short:'';
      for(let i=0;i<res.goals;i++){const t=types.length?types[Math.floor(Math.random()*types.length)]:pick(['atak','kontra','atak','korner']);const d=t==='penalti'?11:t==='serbest'?20+Math.round(Math.random()*8):t==='korner'?7+Math.round(Math.random()*5):8+Math.round(Math.random()*20);
        glAdd({proc:1,t,n:G.p.name||'Cenk Kuşku',num:G.p.num,opp,oc:C&&C.opp?[C.opp.c1,C.opp.c2]:['#ddd','#222'],uc:[myClub().c1,myClub().c2],xg:t==='penalti'?0.76:Math.max(0.03,0.45-d*0.015),d,hdr:t==='korner',solo:t==='kontra'&&Math.random()<0.4,y:G.s.year,wk:G.s.week,seed:Math.floor(Math.random()*1e9),m:rint(3,90)});}}}catch(e){console.warn(e);}return r;})(applyPlayed);
/* ---------- işlemsel tekrar üretimi: şablona göre pas zinciri ve vuruş ---------- */
function glProcFrames(g){const r=srng('gl'+g.seed),F=[],A=[],D=[];const R=()=>r();
  /* hücum yönü sağa (x büyür). 6 hücumcu, 6 savunmacı (kaleci dahil) */
  const goalX=FXL,gy=34+(R()-0.5)*5;let scorer=0;
  const base=[[60,34],[66,16],[66,52],[74,26],[74,44],[56,40]];for(const [x,y] of base)A.push({x:x+(R()-0.5)*6,y:y+(R()-0.5)*8});
  const dbase=[[FXL-1.5,34],[FXL-12,22],[FXL-12,46],[FXL-14,32],[FXL-14,38],[FXL-24,34]];for(const [x,y] of dbase)D.push({x,y});
  const ball={x:A[5].x,y:A[5].y,z:0};let holder=5;const pushF=()=>{const fr=[Math.round(ball.x*5),Math.round(ball.y*5),Math.round(ball.z*5)];for(const p of A)fr.push(Math.round(p.x*5),Math.round(p.y*5));for(const p of D)fr.push(Math.round(p.x*5),Math.round(p.y*5));F.push(fr);};
  const step=(n,fn)=>{for(let i=0;i<n;i++){fn(i/n,i);/* savunma topa kayar */for(let j=1;j<D.length;j++){const d=D[j];d.x+=((Math.min(FXL-3,ball.x+6+j*1.5))-d.x)*0.05;d.y+=((ball.y+(j%2?-1:1)*4*(j/2))-d.y)*0.04;}D[0].y+=((ball.y-34)*0.35+34-D[0].y)*0.15;pushF();}};
  const run=(i,tx,ty,k)=>{A[i].x+=(tx-A[i].x)*k;A[i].y+=(ty-A[i].y)*k;};
  const pass=(to,n,lift)=>{const x0=ball.x,y0=ball.y;step(n,(t)=>{const tx=A[to].x,ty=A[to].y;ball.x=x0+(tx-x0)*t;ball.y=y0+(ty-y0)*t;ball.z=lift?Math.sin(t*Math.PI)*4:0;for(let i=0;i<A.length;i++)if(i!==to)run(i,A[i].x+0.25,A[i].y,0.5);});holder=to;};
  const dribble=(n,tx,ty)=>{step(n,()=>{run(holder,tx,ty,0.08);ball.x=A[holder].x+0.6;ball.y=A[holder].y;ball.z=0;for(let i=0;i<A.length;i++)if(i!==holder)run(i,A[i].x+0.3,A[i].y,0.5);});};
  const shoot=(n,curve,lift)=>{const x0=ball.x,y0=ball.y;step(n,(t)=>{ball.x=x0+(goalX+0.6-x0)*t;ball.y=y0+(gy-y0)*t+Math.sin(t*Math.PI)*curve;ball.z=lift?Math.sin(t*Math.PI)*lift*(1-t*0.6):Math.max(0,(1-t)*0.8);D[0].y+=(gy+(R()-0.5)*3-D[0].y)*0.22;D[0].x=FXL-1.5-Math.sin(t*Math.PI)*0.8;});
    for(let i=0;i<8;i++){ball.x=goalX+0.8+i*0.1;ball.z=Math.max(0,ball.z-0.3);pushF();}};
  const t=g.t;
  if(t==='penalti'){for(const p of A){p.x=FXL-20;p.y=20+R()*28;}for(let j=1;j<D.length;j++){D[j].x=FXL-20;D[j].y=18+j*6;}A[0].x=FXL-14;A[0].y=34;ball.x=FXL-11;ball.y=34;holder=0;scorer=0;step(10,()=>{});step(8,(q)=>{A[0].x=FXL-14+q*2.6;});shoot(5,0,0.6);}
  else if(t==='serbest'){scorer=3;ball.x=FXL-g.d;ball.y=34+(R()-0.5)*16;A[3].x=ball.x-2;A[3].y=ball.y;for(let j=1;j<5;j++){D[j].x=ball.x+9.2;D[j].y=ball.y-2+j*1.1;}holder=3;step(12,()=>{});step(6,(q)=>{A[3].x=ball.x-2+q*1.5;});shoot(9,(ball.y<34?2.5:-2.5),2.6);}
  else if(t==='korner'){scorer=3;ball.x=FXL-0.5;ball.y=R()<0.5?0.5:FXW-0.5;A[1].x=ball.x-1;A[1].y=ball.y;for(const i of [0,2,3,4]){A[i].x=FXL-9-R()*6;A[i].y=28+R()*12;}holder=1;step(10,()=>{});
    const x0=ball.x,y0=ball.y;step(12,(q)=>{ball.x=x0+(FXL-7-x0)*q;ball.y=y0+(gy-y0)*q;ball.z=Math.sin(q*Math.PI)*5+q*1.5;run(3,FXL-7,gy,0.25);});holder=3;shoot(4,0,1.8);}
  else if(t==='kontra'){scorer=4;for(const p of A)p.x-=25;ball.x=A[5].x;ball.y=A[5].y;for(let j=1;j<D.length;j++)D[j].x-=10;pass(4,9,1);dribble(14,FXL-22,A[4].y*0.7+34*0.3);pass(0,6,0);holder=0;scorer=0;dribble(7,FXL-14,34+(R()-0.5)*8);shoot(5,0,0.3);}
  else{scorer=0;pass(1,8,0);dribble(6,A[1].x+6,A[1].y+2);pass(3,7,0);pass(R()<0.5?2:1,8,0);dribble(5,FXL-18,A[holder].y<34?12:56);const x0=ball.x,y0=ball.y;
    step(9,(q)=>{ball.x=x0+(FXL-9-x0)*q;ball.y=y0+(gy-y0)*q;ball.z=Math.sin(q*Math.PI)*(g.hdr?4:1.2);run(0,FXL-9,gy,0.3);});holder=0;shoot(4,0,g.hdr?1.5:0.4);}
  const meta=[A.map((p,i)=>[i===scorer?g.num||9:[7,11,10,8,20,6][i],0]),D.map((p,i)=>[i===0?1:[4,5,3,2,6][i-1]||14,i===0?1:0])];
  return {fr:F,meta,col:[g.uc||['#c4202c','#ffd21f'],g.oc||['#eee','#222']],sc:scorer};}
/* ---------- tekrar oynatıcı (canvas) ---------- */
let GLR=null;
function glPlay(cv,g){glStop();const R=g.proc?glProcFrames(g):{fr:g.fr,meta:g.meta,col:g.col,sc:-1};if(!R.fr||!R.fr.length)return;const c=cv.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),W=cv.clientWidth||600,H=Math.round(W*0.6);cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';
  const flip=!g.proc&&g.side===1,m=8,K=(W-m*2)/FXL,X=x=>m+(flip?FXL-x:x)*K,Y=y=>m+(flip?FXW-y:y)*((H-m*2)/FXW);
  GLR={i:0,t:0,spd:(typeof GL_SLOW!=="undefined"&&GL_SLOW)?0.4:1,R,raf:0,last:0,g};const draw=()=>{const S=GLR;if(!S)return;const n=R.fr.length,i=Math.min(n-1,Math.floor(S.i)),j=Math.min(n-1,i+1),a=S.i-i,f0=R.fr[i],f1=R.fr[j];const L=(k)=>(f0[k]+(f1[k]-f0[k])*a)/5;
    c.setTransform(dpr,0,0,dpr,0,0);for(let s=0;s<12;s++){c.fillStyle=s%2?'#1b6a3a':'#1e7440';c.fillRect(m+s*(W-m*2)/12,m,(W-m*2)/12+0.5,H-m*2);}c.fillStyle='#145530';c.fillRect(0,0,W,m);c.fillRect(0,H-m,W,m);c.fillRect(0,0,m,H);c.fillRect(W-m,0,m,H);
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.2;c.strokeRect(m,m,W-m*2,H-m*2);c.beginPath();c.moveTo(X(52.5),Y(0));c.lineTo(X(52.5),Y(FXW));c.stroke();c.beginPath();c.arc(X(52.5),Y(34),9.15*K,0,7);c.stroke();
    for(const e of [0,FXL]){const x1=X(e),x2=X(e===0?16.5:FXL-16.5),x3=X(e===0?5.5:FXL-5.5);c.strokeRect(Math.min(x1,x2),Y(13.84),Math.abs(x2-x1),Y(54.16)-Y(13.84));c.strokeRect(Math.min(x1,x3),Y(24.84),Math.abs(x3-x1),Y(43.16)-Y(24.84));
      const gx=X(e),gw=2.2*K*(X(e)>W/2?1:-1);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(Math.min(gx,gx+gw),Y(30.34),Math.abs(gw),Y(37.66)-Y(30.34));c.strokeStyle='#fff';c.strokeRect(Math.min(gx,gx+gw),Y(30.34),Math.abs(gw),Y(37.66)-Y(30.34));c.strokeStyle='rgba(255,255,255,.75)';}
    let k=3,rr=Math.max(5,K*1.55);c.textAlign='center';c.textBaseline='middle';c.font=`800 ${Math.round(rr*0.95)}px sans-serif`;
    R.meta.forEach((team,ti)=>{const [c1,c2]=R.col[ti]||['#888','#fff'];team.forEach(([num,gk],pi)=>{if(k+1>=f0.length){k+=2;return;}const x0=f0[k],y0=f0[k+1];if(x0===-999){k+=2;return;}const px=X(L(k)),py=Y(L(k+1));k+=2;
      c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(px+1.5,py+2,rr,rr*0.75,0,0,7);c.fill();c.fillStyle=gk?(ti===0?'#2ec4b6':'#f4a261'):c1;c.beginPath();c.arc(px,py,rr,0,7);c.fill();c.lineWidth=1.5;c.strokeStyle=c2;c.stroke();
      const isSc=g.proc?(ti===0&&pi===R.sc):(ti===g.side&&num===g.num);if(isSc){c.strokeStyle='#ffd23f';c.lineWidth=2.5;c.beginPath();c.arc(px,py,rr+3.5,0,7);c.stroke();}c.fillStyle=gk?'#111':fxInk(c1);c.fillText(num,px,py+0.5);});});
    const bx=X(L(0)),by=Y(L(1)),bz=L(2);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(bx+bz,by+2+bz,3,2,0,0,7);c.fill();c.fillStyle='#fff';c.strokeStyle='#111';c.lineWidth=1.2;c.beginPath();c.arc(bx,by-bz*1.6,3.6+bz*0.25,0,7);c.fill();c.stroke();
    if(i>=n-9){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,H/2-26,W,52);c.fillStyle='#ffd23f';c.font='900 30px sans-serif';c.fillText('GOL!',W/2,H/2-4);c.fillStyle='#fff';c.font='700 13px sans-serif';c.fillText(`${g.n} · ${g.m||''}’`,W/2,H/2+17);}
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(8,8,150,20);c.fillStyle='#fff';c.font='700 11px sans-serif';c.textAlign='left';c.fillText(`▶ TEKRAR · ${S.spd<1?'yavaş çekim':'normal'}`,14,18.5);};
  const loop=now=>{const S=GLR;if(!S)return;const dt=Math.min(0.1,(now-(S.last||now))/1000);S.last=now;S.i+=dt*10*S.spd*(S.i>R.fr.length-14?0.55:1);if(S.i>=R.fr.length+12)S.i=0;draw();S.raf=requestAnimationFrame(loop);};GLR.raf=requestAnimationFrame(loop);}
function glStop(){if(GLR){cancelAnimationFrame(GLR.raf);GLR=null;}}
closeModal=(old=>function(){glStop();return old.apply(this,arguments);})(closeModal);
/* ---------- sezon özeti verisi ---------- */
function ssumBuild(){const S=G.s;if(!S||S.ssDone)return null;S.ssDone=1;const yl=seasonLabel(S.year),c=myClub();G.ssum=G.ssum||{};let pos=0;try{pos=tablePos();}catch(e){}
  const R={y:yl,club:G.club,lg:curLeague().name,pos,mode:G.mode||'player',seen:0,goals:(S.gl||[]).slice(0,5),tro:(G.trophies||[]).filter(t=>t.year===yl).map(t=>t.name)};
  const est=clubSeasonEst(G.club),rt=x=>x.ap?x.rt/x.ap:0;let pool=Object.values(est).filter(x=>x.ap>=5).map(x=>({k:x.p.k,n:x.p.name,pos:x.p.pos,nat:x.p.nat,age:x.p.age,ap:x.ap,g:x.g,a:x.a,r:+rt(x).toFixed(2)}));
  if(G.mode==='mgr'){pool=squadOf(G.club).map(p=>{let t=null;try{t=seasonStats(p,G.club);}catch(e){}return t&&t.ap>=5?{k:p.k,n:p.name,pos:p.pos,nat:p.nat,age:p.age,ap:t.ap,g:t.g,a:t.a,r:+(t.rt/t.ap).toFixed(2)}:null;}).filter(Boolean);}
  if(isPl()){const st=S.stats;R.me={ap:st.apps,st:st.starts,g:st.goals,a:st.assists,r:st.apps?+(st.rsum/st.apps).toFixed(2):0,mn:st.mins,yc:st.yc||0,rc:st.rc||0,ovr:OVR(),fame:Math.round(G.p.fame)};if(st.apps>=5)pool.push({k:'cenk',n:G.p.name||'Cenk Kuşku',pos:G.p.pos,nat:'TUR',age:G.p.age,ap:st.apps,g:st.goals,a:st.assists,r:R.me.r,me:1});}
  if(G.mode==='mgr'&&G.m){const m=G.m;R.mg={w:m.st.w,d:m.st.d,l:m.st.l,gf:m.st.gf,ga:m.st.ga,conf:Math.round(m.conf)};}
  const sc=x=>x.r*10+x.g*0.55+x.a*0.35+Math.min(x.ap,34)*0.12;pool.sort((a,b)=>sc(b)-sc(a));R.pots=pool.slice(0,3);R.top=pool.slice().sort((a,b)=>b.g-a.g)[0]||null;R.ast=pool.slice().sort((a,b)=>b.a-a.a)[0]||null;
  G.ssum[yl]=R;if(R.pots[0]&&R.pots[0].me){msg('event','Sezonun oyuncusu sensin!',`${c.name} taraftarları ve teknik ekip ${yl} sezonunun en iyi oyuncusu olarak seni seçti.`);G.p.fame=clamp(G.p.fame+3,0,100);}
  msg('gundem',`${yl} sezon özeti hazır`,`Sezonun en iyi 5 golü, istatistik kartı ve sezonun oyuncusu seçimi “Sezon özeti” sayfasında.`);return R;}
seasonAwards=(old=>function(){const r=old.apply(this,arguments);try{ssumBuild();}catch(e){console.warn(e);}return r;})(seasonAwards);
let SSY=null;ACTX.ssOpen=el=>{SSY=el.dataset.y||null;TAB='ssum';render();window.scrollTo(0,0);};ACTX.ssY=el=>{SSY=el.dataset.y;render();};
ACTX.glPlay=el=>{const R=G.ssum&&G.ssum[el.dataset.y];const g=R&&R.goals[+el.dataset.i];const cv=$('#glCv');if(!g||!cv)return;document.querySelectorAll('.gl-li').forEach(b=>b.classList.toggle('on',b===el));const t=$('#glTit');if(t)t.textContent=`${+el.dataset.i+1}. ${g.n} · ${g.opp?'vs '+g.opp:''} · ${glTypeN(g)}`;glPlay(cv,g);};
ACTX.glSlow=()=>{if(GLR){GLR.spd=GLR.spd<1?1:0.4;}};
const glTypeN=g=>({penalti:'penaltı',serbest:'serbest vuruş',korner:'kornerden kafa',kontra:'kontra atak',atak:'organize atak',kafa:'kafa golü',oyun:'akan oyundan'})[g.t]||'gol';
function viewSsum(){const L=Object.values(G.ssum||{}).sort((a,b)=>b.y<a.y?-1:1);if(!L.length)return `<h2 class="h">Sezon özeti</h2><section class="panel"><p class="muted">Sezon bittiğinde en iyi 5 gol tekrarı, istatistik kartın ve sezonun oyuncusu burada yer alır.</p></section>`;
  const R=L.find(x=>x.y===SSY)||L[0];R.seen=1;const c=CLUBS[R.club];
  const yrs=`<div class="filt">${L.map(x=>`<button class="chip" data-act="ssY" data-y="${esc(x.y)}" aria-pressed="${x===R}">${esc(x.y)}</button>`).join('')}</div>`;
  const cell=(l,v)=>`<div><b>${v}</b><span>${l}</span></div>`;
  const card=R.me?`<section class="panel ss-card"><div class="ss-cd-h">${c?crestSVG(c,40):''}<div><b>${esc(G.p.name||'Cenk Kuşku')}</b><small>${esc(R.y)} · ${c?esc(c.name):''} · ${R.lg}</small></div><em>${R200(R.me.ovr)}</em></div><div class="fmp-ss">${cell('Maç',`${R.me.ap}<small> (${R.me.st})</small>`)}${cell('Gol',R.me.g)}${cell('Asist',R.me.a)}${cell('Ort. reyting',R.me.r||'–')}${cell('Dakika',R.me.mn)}${cell('Sarı / kırmızı',`${R.me.yc}/${R.me.rc}`)}${cell('Lig sırası',R.pos+'.')}${cell('Şöhret',R.me.fame)}</div></section>`
    :R.mg?`<section class="panel ss-card"><div class="ss-cd-h">${c?crestSVG(c,40):''}<div><b>${esc(c?c.name:'')}</b><small>${esc(R.y)} · ${R.lg} · teknik direktör ${esc(PN())}</small></div><em>${R.pos}.</em></div><div class="fmp-ss">${cell('Galibiyet',R.mg.w)}${cell('Beraberlik',R.mg.d)}${cell('Mağlubiyet',R.mg.l)}${cell('Atılan',R.mg.gf)}${cell('Yenilen',R.mg.ga)}${cell('Averaj',(R.mg.gf-R.mg.ga>0?'+':'')+(R.mg.gf-R.mg.ga))}${cell('Lig sırası',R.pos+'.')}${cell('Yönetim güveni',R.mg.conf)}</div></section>`:'';
  const pots=R.pots.length?`<section class="panel"><p class="sub-h"><span>Sezonun oyuncusu</span><span>${c?esc(c.short):''}</span></p><div class="ss-pots">${R.pots.map((x,i)=>`<div class="ss-pot ${i===0?'w':''} ${x.me?'me':''}"><i>${i===0?'🏆':i+1}</i><div class="ss-pf">${bdoFace(x)}</div><b>${esc(x.n)}</b><small>${x.ap} maç · ${x.g} gol · ${x.a} asist</small><em>${x.r||'–'}</em></div>`).join('')}</div></section>`:'';
  const gl=R.goals.length?`<section class="panel"><p class="sub-h"><span>Sezonun en iyi ${R.goals.length} golü</span><span>tekrarı izle</span></p><div class="gl-wrap"><div class="gl-stage"><p id="glTit" class="gl-tit">Bir gole dokun</p><canvas id="glCv"></canvas><div class="gl-ctl"><button class="btn sm" data-act="glSlow">🐢 Yavaş çekim</button></div></div>
     <ol class="gl-list">${R.goals.map((g,i)=>`<li><button class="gl-li" data-act="glPlay" data-y="${esc(R.y)}" data-i="${i}"><i>${i+1}</i><b>${esc(g.n)}</b><small>${g.opp?'vs '+esc(g.opp)+' · ':''}${g.m?g.m+'’ · ':''}${glTypeN(g)}${g.d?` · ${g.d} m`:''}</small><em>★ ${Math.round(g.b)}</em></button></li>`).join('')}</ol></div></section>`
    :`<section class="panel"><p class="sub-h"><span>Sezonun en iyi golleri</span></p><p class="muted">${R.mode==='mgr'?'Gol tekrarları 2B olarak yönettiğin maçlardan kaydedilir.':'Bu sezon gol atmadın; gelecek sezon tekrarlar burada!'}</p></section>`;
  const tro=R.tro.length?`<div class="aw-tags">${R.tro.map(t=>`<span>🏆 ${esc(t)}</span>`).join('')}</div>`:'';
  setTimeout(()=>{const b=document.querySelector('.gl-li');if(b&&!GLR)b.click();},60);
  return `<h2 class="h">Sezon özeti</h2>${yrs}${tro}${card}<div class="ss-grid">${gl}${pots}</div>`;}
XICON.ssum=NI('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>');NICON.ssum=XICON.ssum;Object.assign(XV,{ssum:()=>viewSsum()});
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.s&&!L.some(x=>x[0]==='ssum'))L.push(['ssum','Sezon özeti']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(G&&G.s){const k=C.find(x=>x[0]==='Kariyer');if(k&&!k[1].some(x=>x[0]==='ssum'))k[1].splice(1,0,['ssum','Sezon özeti',{tab:'ssum'}]);}}catch(e){}return C;})(navCats);
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const L=Object.values(G.ssum||{}).filter(x=>!x.seen);if(L.length&&G.phase==='off'){const R=L[0];return `<section class="panel bd-inv ss-inv"><span class="ss-ic">🎬</span><div><b>${esc(R.y)} sezon özeti hazır</b><small>En iyi ${R.goals.length||''} gol tekrarı, istatistik kartı ve sezonun oyuncusu.</small></div><button class="cta sm" data-act="ssOpen" data-y="${esc(R.y)}">İzle</button></section>`+h;}}catch(e){}return h;})(viewHub);
render=(old=>function(){glStop();return old.apply(this,arguments);})(render);

