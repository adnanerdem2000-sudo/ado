/* ================= v25: Adoball 2B görünüm dinamikleri (gerçek hızda fizik + sıkıştırılmış maç saati, ara kare, yayın tarzı çizim, kamera, hakemler) ================= */
const FX_CK=3;   // maç saati = fiziksel süre × 3 (90 dk = 30 dk fiziksel). Oyuncular ve top gerçek hızla hareket eder.
fxStart=(old=>function(o){old(o);const S=FX;if(!S)return;S.ck=FX_CK;S.pt=0;let sp=4;try{const v=+localStorage.getItem('fxSpd');if(FX_SP.includes(v))sp=v;}catch(_){}S.spd=sp;S.cam={x:52.5,y:34,z:1};
  S.ref={x:48,y:30,fx:1,fy:0};S.ar=[{x:60,y:-0.7},{x:45,y:FXW+0.7}];let z=false;try{z=localStorage.getItem('fxZoom')==='1';}catch(_){}S.zoom=z;if(window.innerWidth<600){S.nmode=0;S.names=false;}
  const ct=document.querySelector('#fx .fx-ctl');if(ct)ct.querySelectorAll('[data-fx=spd]').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.spd));})(fxStart);
fxStep=(old=>function(dt){const S=FX;if(S&&S.phase==='play'){for(const T of S.T)for(const p of T.P){p.px=p.x;p.py=p.y;}const B=S.ball;B.px=B.x;B.py=B.y;B.pz=B.z||0;}old(dt);if(S&&S.phase==='play'){fxRefStep(dt);}})(fxStep);
function fxRefStep(dt){const S=FX,B=S.ball,r=S.ref;if(!r)return;const tx=clamp(B.x-10*Math.sign(B.x-52.5||1)*0.6,12,93),ty=clamp(B.y+(B.y<34?9:-9),6,62),dx=tx-r.x,dy=ty-r.y,d=Math.hypot(dx,dy);
  r.px=r.x;r.py=r.y;if(d>0.3){const v=Math.min(d,dt*(d>12?6.5:3.2));r.x+=dx/d*v;r.y+=dy/d*v;}const fx=B.x-r.x,fy=B.y-r.y,fl=Math.hypot(fx,fy)||1;r.fx=fx/fl;r.fy=fy/fl;
  S.ar.forEach((a,i)=>{a.px=a.x;const tgt=i===0?clamp(Math.max(B.x,60),52.5,FXL-2):clamp(Math.min(B.x,45),2,52.5),ddx=tgt-a.x;a.x+=Math.sign(ddx)*Math.min(Math.abs(ddx),dt*7);});}
let fxAlpha=1;
fxLoop=function(ts){if(!FX||!$('#fx')||$('#fx').hidden)return;const dt=Math.min(0.1,(ts-(fxLast||ts))/1000);fxLast=ts;const S=FX;
  if(S.phase==='play'){if(S.ff){let n=0;while(n<2500&&S.phase==='play'){fxStep(0.1);fxMom(0.1);n++;}S.trail=[];fxAlpha=1;}
    else{fxAcc+=dt*S.spd*FXU*(S.smart?fxSmart():1);let n=0;while(fxAcc>=0.1&&n<300&&S.phase==='play'){fxStep(0.1);fxMom(0.1);fxAcc-=0.1;n++;}fxAlpha=clamp(fxAcc/0.1,0,1);}
    if(S.phase!=='play'){fxAcc=0;fxAlpha=1;S.ff=false;fxUI();}}
  for(const tr of S.trail)tr.t-=dt*1.6;S.trail=S.trail.filter(t=>t.t>0);if(S.flash){S.flash.t-=dt;if(S.flash.t<=0)S.flash=null;}if(S.pop){S.pop.t-=dt;if(S.pop.t<=0){S.pop=null;fxPopUI();}}
  if(S.cam){const c=S.cam,B=S.ball,tz=S.zoom&&S.phase==='play'&&!S.ff?(fxU(S.U,B.x)>70||fxU(S.O,B.x)>70?1.85:1.55):1,kz=1-Math.exp(-dt/.45),kp=1-Math.exp(-dt/.35);c.z+=(tz-c.z)*kz;c.x+=(B.x-c.x)*kp;c.y+=(B.y-c.y)*kp;}
  fxDraw();S.uiT=(S.uiT||0)-dt;if(S.uiT<=0){S.uiT=S.ff?0.15:0.4;fxTopUI();if(S.tab==='ev'||S.tab==='st'||S.tab==='ky'||S.tab==='cm')fxBodyUI();}
  S.raf=requestAnimationFrame(fxLoop);};
function fxRR(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function fxInk(hex){const h=String(hex||'#fff').replace('#',''),n=parseInt(h.length===3?h.replace(/./g,c=>c+c):h,16)||0,L=((n>>16&255)*.3+(n>>8&255)*.59+(n&255)*.11)/255;return L>0.6?'#111':'#fff';}
function fxLight(hex){const h=String(hex||'#9fb8cf').replace('#',''),n=parseInt(h.length===3?h.replace(/./g,c=>c+c):h,16)||0;let r=n>>16&255,g=n>>8&255,b=n&255;const L=(r*.3+g*.59+b*.11)/255,k=L<.55?.5:.15;r=Math.round(r+(255-r)*k);g=Math.round(g+(255-g)*k);b=Math.round(b+(255-b)*k);return `rgb(${r},${g},${b})`;}
const FX_POSL={KL:'KL',DF:'DF',OS:'OS',KN:'KN',FW:'FV'};
fxDraw=function(){const cv=$('#fxCv'),S=FX;if(!cv||!S)return;const c=cv.getContext('2d'),dpr=S.dpr,W=S.cw,H=S.ch,a=S.phase==='play'&&!S.ff?fxAlpha:1,L=(p,q)=>p+(q-p)*a;
  const m=10,pw=W-m*2,ph=H-m*2,K=pw/FXL,X=x=>m+x*K,Y=y=>m+y/FXW*ph,cam=S.cam||{z:1,x:52.5,y:34},z=cam.z>1.001?cam.z:1;
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#0a2416';c.fillRect(0,0,W,H);
  if(z>1){let tx=W/2-X(cam.x)*z,ty=H/2-Y(cam.y)*z;tx=Math.min(0,Math.max(W-W*z,tx));ty=Math.min(0,Math.max(H-H*z,ty));c.setTransform(dpr*z,0,0,dpr*z,dpr*tx,dpr*ty);}
  const u=1/z;
  for(let i=0;i<15;i++){c.fillStyle=i%2?'#14532d':'#175c32';c.fillRect(X(i*FXL/15),Y(0),FXL/15*K+.5,ph);}
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=Math.max(1.2,K*.16);c.strokeRect(X(0),Y(0),FXL*K,ph);
  c.beginPath();c.moveTo(X(52.5),Y(0));c.lineTo(X(52.5),Y(FXW));c.stroke();c.beginPath();c.arc(X(52.5),Y(34),9.15*K,0,7);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(X(52.5),Y(34),.3*K+1,0,7);c.fill();
  for(const s of [0,1]){const R=(x1,y1,x2,y2)=>[Math.min(X(x1),X(x2)),Math.min(Y(y1),Y(y2)),Math.abs(X(x2)-X(x1)),Math.abs(Y(y2)-Y(y1))];
    c.strokeRect(...R(s?FXL-16.5:0,13.84,s?FXL:16.5,54.16));c.strokeRect(...R(s?FXL-5.5:0,24.84,s?FXL:5.5,43.16));const px=s?FXL-11:11;c.beginPath();c.arc(X(px),Y(34),.3*K+1,0,7);c.fill();
    c.beginPath();c.arc(X(px),Y(34),9.15*K,s?Math.PI-.93:-.93,s?Math.PI+.93:.93);c.stroke();
    c.fillStyle='rgba(255,255,255,.14)';c.fillRect(s?X(FXL):X(-2.2),Y(30.34),2.2*K,Y(37.66)-Y(30.34));c.strokeStyle='#fff';c.strokeRect(s?X(FXL):X(-2.2),Y(30.34),2.2*K,Y(37.66)-Y(30.34));c.strokeStyle='rgba(255,255,255,.85)';c.fillStyle='#fff';
    for(const yy of [0,FXW]){c.beginPath();c.arc(X(s?FXL:0),Y(yy),1*K,s?(yy?Math.PI:Math.PI/2):(yy?-Math.PI/2:0),s?(yy?Math.PI*1.5:Math.PI):(yy?0:Math.PI/2));c.stroke();}}
  for(const tr of S.trail){c.strokeStyle=`rgba(255,255,255,${Math.min(.35,tr.t*0.3)})`;c.lineWidth=2*u;c.beginPath();c.moveTo(X(tr.x0),Y(tr.y0));c.lineTo(X(tr.x1),Y(tr.y1));c.stroke();}
  const col=(T)=>{const U=S.U,O=S.O;if(T===U)return [U.c1,U.c2];const dd=(h1,h2)=>{const f=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=f(h1),B2=f(h2);return Math.abs(A[0]-B2[0])+Math.abs(A[1]-B2[1])+Math.abs(A[2]-B2[2]);};return dd(O.c1,U.c1)<160?(dd(O.c2,U.c1)<160?['#f2f2f2','#222']:[O.c2,O.c1]):[O.c1,O.c2];};
  const Rm=Math.max(7,Math.min(15,1.55*K)),R0=Rm*u,B=S.ball,own=B.own,nm=S.nmode===undefined?(S.names?1:0):S.nmode;
  /* hakemler */
  const ref=S.ref;if(ref){const rx=X(L(ref.px??ref.x,ref.x)),ry=Y(L(ref.py??ref.y,ref.y));c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(rx+2*u,ry+3*u,R0*.8,R0*.6,0,0,7);c.fill();c.fillStyle='#16181d';c.beginPath();c.arc(rx,ry,R0*.82,0,7);c.fill();c.strokeStyle='#ffd23f';c.lineWidth=1.4*u;c.stroke();
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1.6*u;c.beginPath();c.moveTo(rx+ref.fx*R0*.85,ry+ref.fy*R0*.85);c.lineTo(rx+ref.fx*(R0*.85+4*u),ry+ref.fy*(R0*.85+4*u));c.stroke();
    for(const ar of S.ar||[]){const ax=X(L(ar.px??ar.x,ar.x)),ay=Y(ar.y);c.fillStyle='#16181d';c.beginPath();c.arc(ax,ay,R0*.6,0,7);c.fill();c.fillStyle='#ffd23f';c.fillRect(ax+R0*.4,ay-R0*.9,R0*.5,R0*.4);}}
  const labels=[];
  for(const T of S.T){const [f,s2]=col(T);for(const p of fxOn(T)){const x=L(p.px??p.x,p.x),y=L(p.py??p.y,p.y),PX=X(x),PY=Y(y),isO=own===p,R=R0;
      let vx=p.x-(p.px??p.x),vy=p.y-(p.py??p.y);const vl=Math.hypot(vx,vy);if(vl>0.04){p.fvx=vx/vl;p.fvy=vy/vl;}else if(p.fvx==null||isO){const bx=B.x-p.x,by=B.y-p.y,bl=Math.hypot(bx,by)||1;p.fvx=bx/bl;p.fvy=by/bl;}
      const fx=p.fvx||1,fy=p.fvy||0,fpx=fx*K,fpy=fy*(ph/FXW),fl=Math.hypot(fpx,fpy)||1,ux=fpx/fl,uy=fpy/fl;
      c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(PX+2*u,PY+3*u,R*.95,R*.75,0,0,7);c.fill();
      if(isO){c.strokeStyle='rgba(255,201,60,.95)';c.lineWidth=2.5*u;c.beginPath();c.arc(PX,PY,R+(4+1.5*Math.sin(performance.now()/120))*u,0,7);c.stroke();}
      c.fillStyle=p.spos==='KL'?(T===S.U?'#2ec4b6':'#f4a261'):f;c.beginPath();c.arc(PX,PY,R,0,7);c.fill();c.strokeStyle=isO?'#fff':'rgba(255,255,255,.55)';c.lineWidth=(isO?2.6:1.3)*u;c.stroke();
      c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=2*u;c.beginPath();c.moveTo(PX+ux*(R+.5*u),PY+uy*(R+.5*u));c.lineTo(PX+ux*(R+4.5*u),PY+uy*(R+4.5*u));c.stroke();
      c.fillStyle=p.spos==='KL'?'#111':fxInk(f);c.font=`800 ${Math.max(8,Math.round(Rm*.8))*u}px Barlow Semi Condensed,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(nm===3?(FX_POSL[p.spos]||p.spos):p.num,PX,PY+.5*u);
      if(p.yel){c.fillStyle='#ffd23f';c.fillRect(PX+R-2*u,PY-R-2*u,4*u,6*u);}
      if(nm||isO)labels.push([nm===2?`${p.sur} ${dec(fxR(p),1)}`:p.sur,p.num,PX,PY+R+2*u,isO?'#ffc93c':'#f2f6fb',f]);}}
  /* yayın tarzı isim kapsülleri */
  const fs=Math.max(9,Math.round(Math.min(13,K*1.05)))*u,fsN=fs*.9;for(const [t,n,x,y,cl,tc] of labels){c.font=`600 ${fs}px Barlow Semi Condensed,sans-serif`;const wt=c.measureText(t).width;c.font=`800 ${fsN}px Barlow Semi Condensed,sans-serif`;const wn=c.measureText(String(n)).width;
    const h=fs+6*u,px=6*u,w=wt+wn+5*u+px*2,x0=x-w/2,y0=y;c.fillStyle='rgba(8,13,23,.72)';fxRR(c,x0,y0,w,h,h/2);c.fill();c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=1*u;c.stroke();
    c.textAlign='left';c.textBaseline='middle';c.fillStyle=fxLight(tc);c.fillText(String(n),x0+px,y0+h/2+.5*u);c.font=`600 ${fs}px Barlow Semi Condensed,sans-serif`;c.fillStyle=cl;c.fillText(t,x0+px+wn+5*u,y0+h/2+.5*u);}
  /* top */
  const bx=L(B.px??B.x,B.x),by=L(B.py??B.y,B.y),bz=L(B.pz??(B.z||0),B.z||0)*K*.7,br=Math.max(3.4,.62*K)*u;
  c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.arc(X(bx),Y(by)-bz,br*2.6,0,7);c.fill();c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(X(bx),Y(by)+2*u,.6*K*u+1,.4*K*u+1,0,0,7);c.fill();
  c.fillStyle='#fff';c.strokeStyle='#111';c.lineWidth=1.6*u;c.beginPath();c.arc(X(bx),Y(by)-bz,br+bz*.05,0,7);c.fill();c.stroke();
  c.setTransform(dpr,0,0,dpr,0,0);c.textAlign='center';c.textBaseline='middle';
  if(own&&S.phase==='play'&&!S.ff){const txt=`${own.num} ${own.sur}`;c.font='800 13px Barlow Semi Condensed,sans-serif';const w=c.measureText(txt).width+18;c.fillStyle='rgba(6,10,20,.82)';c.fillRect(12,12,w,24);c.fillStyle=own.T===S.U?S.U.c1:'#ff6a5f';c.fillRect(12,12,4,24);c.fillStyle='#fff';c.textAlign='left';c.fillText(txt,22,24.5);c.textAlign='center';}
  if(S.flash){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,H/2-34,W,68);c.font='900 44px Barlow Semi Condensed,sans-serif';c.fillStyle=S.flash.us?'#35d49a':'#ff6a5f';c.fillText(S.flash.txt,W/2,H/2);}
  if(S.ff&&S.phase==='play'){const t='İLERİ SARMA',w=150;c.fillStyle='rgba(6,10,20,.88)';c.fillRect(W-w-12,12,w,26);c.fillStyle='#ffc93c';c.fillRect(W-w-12,12,3,26);c.font='800 13px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.fillText(`⏭ ${t} ${fxMin()}’`,W-w/2-12,25.5);}
  else if(S.phase!=='play'){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.font='800 22px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.fillText(S.phase==='pre'?'Başlamak için ▶':S.phase==='ht'?'DEVRE ARASI':S.phase==='end'?'MAÇ SONU':'DURAKLATILDI',W/2,H/2);}};
fxOpen=(old=>function(){old();const S=FX;if(!S)return;const nb=$('#fxNm');if(nb&&!$('#fxZm'))nb.insertAdjacentHTML('beforebegin',`<button data-fx="zoom" id="fxZm" class="${S.zoom?'on':''}" title="Kamera topu takip etsin">🎥 Yakın</button>`);
  document.querySelectorAll('#fx .fx-ctl [data-fx=spd]').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.spd));})(fxOpen);
fxAct=(old=>function(a,k,v){const S=FX;if(!S)return;if(a==='zoom'){S.zoom=!S.zoom;try{localStorage.setItem('fxZoom',S.zoom?'1':'0');}catch(_){}const b=$('#fxZm');if(b)b.classList.toggle('on',S.zoom);return;}
  if(a==='names'){S.nmode=((S.nmode===undefined?1:S.nmode)+1)%4;S.names=S.nmode>0;const b=$('#fxNm');if(b)b.textContent=['Etiket yok','İsim','Not','Mevki'][S.nmode];return;}
  if(a==='spd'){try{localStorage.setItem('fxSpd',k);}catch(_){}}return old(a,k,v);})(fxAct);

