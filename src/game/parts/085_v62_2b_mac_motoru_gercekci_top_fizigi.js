/* ================= v62: 2B maç motoru — gerçekçi top fiziği, ivmeli oyuncu hareketi, kaleci, duran top yerleşimi, gol sevinci =================
   Kaynak fikirler: Mat Buckland, "Programming Game AI by Example" SimpleSoccer (steering: seek/arrive/pursuit, sürtünmeli top ve
   pas güvenliği hesabı), Google Research Football fizik parametreleri (yerden pas yavaşlaması, havadan topta yerçekimi). */
const FXG=9.81;const FXDBG={};const _fxMove0=fxMove,_fxFlight0=fxFlight;
/* ---------- oyuncu hareketi: ivme, yavaşlayarak varma, takım arkadaşından kaçınma ---------- */
fxMove=function(p,dt){if(FXDBG.nmv)return _fxMove0(p,dt);if(p.cool>0)p.cool-=dt;const S=FX,B=S.ball;
  let vmax=(5.6+(p.a.sp-50)*0.018+fxSpd(p))*(0.55+0.45*p.st/100);const urgent=p.pr||p.chase||p.run>S.pt||B.own===p;if(B.own===p)vmax*=0.86;else if(!urgent)vmax*=0.78;p.pr=0;
  if(S.cel&&S.cel.t>0)vmax*=0.8;
  const dfd=B.own&&B.own.T!==p.T||B.fl&&B.fl.from&&B.fl.from.T!==p.T;const acc=(FXDBG.acc||2)*(dfd?(FXDBG.dacc||2.2):1)*(3.4+(fxF(p,'Hızlanma')-10)*0.22+(fxF(p,'Çeviklik')-10)*0.06)*(0.7+0.3*p.st/100);
  let dx=p.tx-p.x,dy=p.ty-p.y;const d=Math.hypot(dx,dy);p.vx=p.vx||0;p.vy=p.vy||0;
  let wx=0,wy=0;if(d>0.12){const vd=Math.min(vmax,d*2.6);wx=dx/d*vd;wy=dy/d*vd;}
  /* takım arkadaşından ayrışma */
  if(!FXDBG.nsep&&(!urgent||B.own!==p)){for(const q of p.T.P){if(q===p||q.off)continue;const ex=p.x-q.x,ey=p.y-q.y,e=ex*ex+ey*ey;if(e<1.44&&e>0.0001){const k=(1.2-Math.sqrt(e))*1.6;wx+=ex/Math.sqrt(e)*k;wy+=ey/Math.sqrt(e)*k;}}}
  let sx=wx-p.vx,sy=wy-p.vy;const sl=Math.hypot(sx,sy),lim=acc*dt*(d<0.12?1.6:1);if(sl>lim){sx=sx/sl*lim;sy=sy/sl*lim;}
  p.vx+=sx;p.vy+=sy;const v=Math.hypot(p.vx,p.vy);if(v>vmax*1.05){p.vx*=vmax*1.05/v;p.vy*=vmax*1.05/v;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.x=clamp(p.x,-2,FXL+2);p.y=clamp(p.y,-2,FXW+2);};
/* ---------- kaleci: açıyı kapatma, gerektiğinde çıkma ---------- */
fxTarget=(old=>function(p,reset){old.apply(this,arguments);try{const S=FX,B=S.ball;if(!S||reset)return;const T=p.T;
    if(p.spos==='KL'){const own=B.own?B.own.T===T:false;if(own||S.setT>0&&S.setK==='gk')return;const gx=fxX(T,0),gy=34,bx=B.fl?B.fl.tx:B.x,by=B.fl?B.fl.ty:B.y,dx=bx-gx,dy=by-gy,dist=Math.hypot(dx,dy)||1;
      let st=dist<30?clamp(1.1+(30-dist)*0.1,1.1,4.2):clamp(3+(dist-30)*0.14,3,p.role==='sk'?16:11);if(dist<9)st=Math.min(st,dist*0.55);
      p.tx=gx+dx/dist*st;p.ty=clamp(gy+dy/dist*st,30.5,37.5);if(dist>30)p.ty=34+(p.ty-34)*0.5;return;}
    if(S.setT>0)fxSetPos(p);}catch(e){}})(fxTarget);
/* duran top yerleşimi */
const FX_CKZ=[[5,34],[7.5,30.5],[7.5,37.5],[11.5,34],[10,27],[10,41],[16,34],[17,24]];
function fxSetPos(p){const S=FX,B=S.ball,T=p.T,O=fxOpp(T),tk=B.own;if(!tk||p===tk)return;const att=tk.T;
  if(S.setK==='co'){const sideY=B.y<34?-1:1;if(T===att){if(p.spos==='DF'&&p.d<0.25&&p.l>0.3&&p.l<0.7){p.tx=fxX(T,50);p.ty=34;return;}const mates=fxOn(T).filter(q=>q!==tk&&q.spos!=='KL').sort((a,b)=>b.a.ph+fxF(b,'Kafa Vuruşu')*3-(a.a.ph+fxF(a,'Kafa Vuruşu')*3));const i=mates.indexOf(p);if(i<0)return;
      const z=FX_CKZ[Math.min(i,FX_CKZ.length-1)];p.tx=fxX(T,FXL-z[0]);p.ty=34+(z[1]-34)*(i===1||i===2?-sideY:1);if(i>=7){p.tx=fxX(T,58);p.ty=34+(i%2?-12:12);}return;}
    else{if(p.spos==='KL')return;const atk=fxOn(att).filter(q=>q!==tk&&q.spos!=='KL').filter(q=>FXL-fxU(att,q.x)<20);const mine=fxOn(T).filter(q=>q.spos!=='KL').sort((a,b)=>fxF(b,'Markaj')-fxF(a,'Markaj'));const i=mine.indexOf(p);
      if(i<2){p.tx=fxX(T,1.2);p.ty=34+(i===0?-3.4:3.4)*-sideY;return;}const a=atk[i-2];if(a){p.tx=a.x+(fxX(T,0)-a.x)*0.06;p.ty=a.y+(34-a.y)*0.08;return;}p.tx=fxX(T,14);p.ty=34+(i%2?-8:8);return;}}
  if(S.setK==='fk'&&T!==att){const gx=fxX(T,0),dx=gx-B.x,dy=34-B.y,dist=Math.hypot(dx,dy);if(dist<34&&p.spos!=='KL'){const n=dist<22?5:dist<28?4:3;const ws=fxOn(T).filter(q=>q.spos!=='KL').sort((a,b)=>fxD(a,B)-fxD(b,B)).slice(0,n);const i=ws.indexOf(p);
      if(i>=0){const ux=dx/dist,uy=dy/dist,cx=B.x+ux*9.15,cy=B.y+uy*9.15,ox=-uy,oy=ux,off=(i-(n-1)/2)*0.62;p.tx=cx+ox*off;p.ty=cy+oy*off;}}}
  if(S.setK==='pen'){if(p.spos==='KL')return;const gxA=fxX(att,FXL);p.tx=gxA-att.dir*(19+(p.slot%5));p.ty=34+((p.slot*7)%24-12);}}
/* duran toplarda oyuncular yerleşsin diye biraz daha uzun bekleme */
fxCorner=(old=>function(T){const r=old.apply(this,arguments);try{FX.setT=2.6;}catch(e){}return r;})(fxCorner);
fxSet=(old=>function(T,x,y,kind){const r=old.apply(this,arguments);try{const S=FX;if(kind==='fk'){const d=FXL-fxU(T,x);S.setT=d<34?2.4:1.3;}else if(kind==='gk')S.setT=1.7;else if(kind==='th')S.setT=1.1;else if(kind==='pen')S.setT=2.2;}catch(e){}return r;})(fxSet);
/* ---------- top fiziği: tam varışlı kinematik (yerden pasta sürtünme, havadan topta yerçekimi, şutlarda falso) ---------- */
function fxFlInit(f){const S=FX,L=Math.max(0.5,Math.hypot(f.tx-f.x0,f.ty-f.y0)),ux=(f.tx-f.x0)/L,uy=(f.ty-f.y0)/L;f.L=L;f.ux=ux;f.uy=uy;f.nx=-uy;f.ny=ux;f.ph=1;f.curve=0;const c=f.from;
  if(f.kind==='sh'){const pw=f.hdr?12:clamp(20+((c&&c.a?c.a.sh:65)-50)*0.12+(L>20?3:0)+(fxF(c,'Uzaktan Şut')-10)*(L>20?0.25:0),14,33);f.v0=pw;f.T=Math.max(0.22,L/(pw*0.95));f.mode='sh';
    f.zEnd=f.res==='off'&&Math.random()<0.55?2.5+Math.random()*1.4:f.res==='g'||f.res==='sv'?Math.random()*2.1:Math.random()*1.2;f.zPk=f.hdr?0.6:L>18?0.6+Math.random()*1.4:0.3+Math.random()*0.6;
    if(L>17&&!f.hdr)f.curve=(Math.random()<0.5?-1:1)*(0.3+fxF(c,'Teknik')*0.06)*(L/25);if(f.res==='sv'||f.res==='g')f.curve*=0.5;}
  else if(f.lift||f.kind==='cr'||f.kind==='cl'||L>30){f.mode='air';f.T=clamp(0.7+L/(f.kind==='cl'?26:21),0.6,3.2);if(f.kind==='cr'){f.T=clamp(0.9+L/24,0.8,2.2);}f.apex=FXG*f.T*f.T/8;}
  else{f.mode='gr';const a=2.4,vEnd=f.kind==='th'?6.5:7.5+(c&&c.a?(c.a.pa-60)*0.02:0);f.acc=a;f.v0=Math.sqrt(vEnd*vEnd+2*a*L);f.T=clamp((f.v0-vEnd)/a,0.2,3);f.vEnd=vEnd;}
  f.t=0;}
fxFlight=function(dt){if(FXDBG.nfl)return _fxFlight0(dt);const S=FX,B=S.ball,f=B.fl;if(!f.ph)fxFlInit(f);f.t+=dt;const t=Math.min(f.t,f.T),k=t/f.T;let s;
  if(f.mode==='gr'){s=Math.min(f.L,f.v0*t-f.acc*t*t/2);if(f.t>=f.T)s=f.L;B.z=0;}
  else if(f.mode==='air'){s=f.L*k;B.z=FXG*t*(f.T-t)/2;}
  else{s=f.L*(k*(1.06-0.06*k));B.z=Math.max(0,f.zPk*Math.sin(k*Math.PI)*(1-k)+f.zEnd*k);}
  const off=f.curve?f.curve*Math.sin(k*Math.PI):0;B.x=f.x0+f.ux*s+f.nx*off;B.y=f.y0+f.uy*s+f.ny*off;
  /* kaleci şuta uzanır */
  if(f.kind==='sh'&&f.gk&&!f.gk.off&&k>0.25){const g=f.gk;g.dive=g.dive||{t0:S.pt,y:f.ty};const want=f.res==='g'?f.ty+(f.ty>34?-1.2:1.2)*(0.6+Math.random()*0.2):f.ty;const dy=want-g.y;g.y+=Math.sign(dy)*Math.min(Math.abs(dy),dt*(f.res==='sv'?8.5:6.5));g.tx=g.x;g.ty=g.y;}
  /* pas arası: yavaş ve alçak top daha kolay kesilir */
  if((f.kind==='pa'||f.kind==='th')&&k>0.2&&k<0.92&&!f.chk&&B.z<1.4){const O=fxOpp(f.from.T),sp=f.mode==='gr'?(f.v0-f.acc*t):18;
    for(const q of fxOn(O)){if(Math.hypot(q.x-B.x,q.y-B.y)<0.95){const ch=(0.05+q.a.df*0.0011+(fxF(q,'Önsezi')-10)*0.004)*(sp<9?1.5:sp>15?0.7:1);if(Math.random()<ch){f.chk=1;q.s.tk++;fxGain(q,'int');S.trail.length=0;return;}}}}
  if(f.t<f.T)return;
  if(f.kind==='sh')return fxShotEnd(f);
  if(f.kind==='cr'){if(f.hdr&&f.to&&!f.to.off){const a=f.to;a.x=f.tx;a.y=f.ty;S.stats[a.T.side].pc++;a.s.pc++;B.own=a;B.last=a;B.fl=null;const xg=clamp(0.09+(a.a.ph-65)*0.003,0.04,0.2);fxHeader(a,xg,f.from);return;}
    if(f.def&&Math.random()<0.75){B.fl=null;if(Math.random()<0.4){const AT=f.from.T;S.stats[AT.side].co++;fxEv(fxMin(),`${f.def.sur} ortayı kornere çeldi.`,'');fxCorner(AT);return;}fxGain(f.def,'int');fxClearAfter(f.def);return;}B.fl=null;B.z=0;B.lv={x:f.ux*3+(Math.random()-0.5)*4,y:f.uy*3+(Math.random()-0.5)*4};return;}
  if(f.to&&!f.to.off){const r=f.to,ft=Math.random()<0.04*(1.5-r.a.dr/100)*(fxPressure(r)<2?2:1);if(!ft){if(Math.hypot(r.x-f.tx,r.y-f.ty)<2.2||f.kind==='th'){r.x=r.x+(f.tx-r.x)*0.6;r.y=r.y+(f.ty-r.y)*0.6;}S.stats[r.T.side].pc++;f.from.s.pc++;f.from.rt+=0.004;fxGain(r,'pass');r.lastFrom=f.from;r.lfT=S.pt;if(f.kind==='th')r.dt=0.1;return;}}
  B.fl=null;B.z=0;const ve=f.mode==='gr'?f.vEnd*0.55:4;B.lv={x:f.ux*ve+(Math.random()-0.5)*1.5,y:f.uy*ve+(Math.random()-0.5)*1.5};if(f.from&&f.from.T)f.from.rt-=0.02;fxBounds();};
/* ---------- ilk kontrol: kötü teknikli oyuncuya ağır top kaçar ---------- */
fxGain=(old=>function(p,how){const r=old.apply(this,arguments);try{const S=FX;if(!FXDBG.nft&&how==='pass'&&p&&p.spos!=='KL'&&S.phase==='play'){const pr=fxPressure(p),ic=fxF(p,'İlk Kontrol');const ch=0.11*(1-(ic-1)/19)*(pr<2?1.9:pr<4?1.2:0.6);
      if(Math.random()<ch){const B=S.ball;B.own=null;const dir=p.T.dir;B.lv={x:dir*(2.5+Math.random()*3),y:(Math.random()-0.5)*4};p.cool=0.35;S.badTouch=(S.badTouch||0)+1;if(Math.random()<0.25)try{fxSay(`${p.sur} topu kontrol edemedi, top ayağından açıldı!`);}catch(e){}}}}catch(e){}return r;})(fxGain);
/* ---------- kurtarışta seken top (dönen top fırsatı) ---------- */
fxShotEnd=(old=>function(f){const S=FX;try{if(!FXDBG.np&&f&&f.res==='sv'&&f.gk&&!f.gk.off&&!f.setK&&Math.random()<0.3+(1-fxF(f.gk,'Elle Oyun')/20)*0.2){const c=f.from,T=c.T,st=S.stats[T.side],B=S.ball;B.fl=null;st.son++;c.s.son++;f.gk.s.sv++;f.gk.rt+=0.2;
      B.own=null;B.z=0.3;const back=-T.dir;B.lv={x:back*(5+Math.random()*5),y:(B.y<34?-1:1)*(2+Math.random()*5)};f.gk.cool=0.8;f.gk.dive=null;
      fxEv(fxMin(),`${c.name} vurdu, ${f.gk.sur} çeldi! Top ceza sahasında sahipsiz.`,'');try{fxSay(`${f.gk.sur} çeldi! Dönen top tehlikeli!`,true);}catch(e){}return;}}catch(e){}
  const hl=S?S.hl:null;const isG=f&&f.res==='g';if(isG&&S)S._goalNow=1;const r=old.apply(this,arguments);if(S){S.hl=hl;S._goalNow=0;}for(const T of (S?S.T:[]))for(const p of T.P)if(p.dive)p.dive=null;return r;})(fxShotEnd);
fxFoul=(old=>function(d,c){const S=FX,hl=S?S.hl:null;const r=old.apply(this,arguments);if(S)S.hl=hl;return r;})(fxFoul);
/* ---------- gol sevinci: santraya hemen ışınlanmak yerine kutlama ---------- */
fxKick=(old=>function(toSide){const S=FX;if(S&&S._goalNow&&S.phase==='play'){const sc=S.ball.last;S.cel={t:3.4,side:toSide,sc,T:sc?sc.T:null};S.ball.own=null;S.ball.fl=null;const B=S.ball;B.lv=null;B.z=0;
    if(sc&&sc.T){const T=sc.T;B.x=fxX(T,FXL+0.9);B.y=clamp(B.y,31,37);S.cel.cx=fxX(T,FXL-1);S.cel.cy=sc.y<34?1:FXW-1;}return;}return old.apply(this,arguments);})(fxKick);
fxStep=(old=>function(dt){const S=FX;if(S&&S.phase==='play'&&S.cel&&S.cel.t>0){const C=S.cel;for(const T of S.T)for(const p of T.P){p.px=p.x;p.py=p.y;}const B=S.ball;B.px=B.x;B.py=B.y;B.pz=B.z||0;
    S.t+=dt*(S.ck||1);S.pt=(S.pt||0)+dt;C.t-=dt;
    for(const T of S.T)for(const p of fxOn(T)){if(C.T===T){if(p===C.sc){p.tx=C.cx;p.ty=C.cy;p.pr=1;}else if(p.spos!=='KL'&&C.sc){p.tx=C.sc.x+(p.x-C.sc.x)*0.15;p.ty=C.sc.y+(p.y-C.sc.y)*0.15;p.pr=1;}else{p.tx=p.x;p.ty=p.y;}}else{p.tx=p.x+(fxX(T,30)-p.x)*0.2;p.ty=p.y;}fxMove(p,dt);}
    if(C.t<=0){S.cel=null;fxKickReal(C.side);}return;}
  old.apply(this,arguments);
  try{if(S&&S.phase==='play'){const B=S.ball,c=B.own;
      /* top sürme: top ayakta yapışık değil, adım adım ileri itilir */
      if(c&&!B.fl&&S.setT<=0&&!c.penT&&!c.fkT){const v=Math.hypot(c.vx||0,c.vy||0);if(v>1.2){const ph=(S.pt*(2.2+v*0.55))%1,off=0.45+v*0.11*(0.4+0.6*(1-ph));B.x=c.x+c.vx/v*off;B.y=c.y+c.vy/v*off;}}
      /* taçta top elde */
      if(c&&S.setT>0&&S.setK==='th'){B.z=1.9;}else if(c&&!B.fl)B.z=0;
      for(const T of S.T)for(const p of T.P)if(p.dive&&(!B.fl||B.fl.kind!=='sh'))p.dive=null;}}catch(e){}})(fxStep);
function fxKickReal(side){const S=FX;const g=S._goalNow;S._goalNow=0;fxKick(side);S._goalNow=g;}
fxDanger=(old=>function(S){if(S&&S.cel&&S.cel.t>0)return true;return old.apply(this,arguments);})(fxDanger);
/* ---------- zaman akışı: 1× artık gerçek zamana yakın (önceden 3 kat hızlıydı) ---------- */
fxLoop=(old=>function(ts){const S=FX;if(!S)return old.apply(this,arguments);const sp=S.spd;S.spd=sp*0.5;try{return old.apply(this,arguments);}finally{if(FX===S)S.spd=sp;}})(fxLoop);
/* ---------- çizim: kaleci uzanışı, sevinç, top dokusu, file ---------- */
fxDraw=(old=>function(){old.apply(this,arguments);const S=FX,cv=$('#fxCv');if(!S||!cv)return;try{const c=cv.getContext('2d'),dpr=S.dpr,W=S.cw,H=S.ch,a=S.phase==='play'&&!S.ff?fxAlpha:1,L=(p,q)=>p+(q-p)*a,m=10,pw=W-m*2,ph=H-m*2,K=pw/FXL,X=x=>m+x*K,Y=y=>m+y/FXW*ph,cam=S.cam||{z:1,x:52.5,y:34},z=cam.z>1.001?cam.z:1;
    c.setTransform(dpr,0,0,dpr,0,0);if(z>1){let tx=W/2-X(cam.x)*z,ty=H/2-Y(cam.y)*z;tx=Math.min(0,Math.max(W-W*z,tx));ty=Math.min(0,Math.max(H-H*z,ty));c.setTransform(dpr*z,0,0,dpr*z,dpr*tx,dpr*ty);}
    const u=1/z;
    /* kale fileleri */
    c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=0.7*u;for(const s of [0,1]){const x0=s?X(FXL):X(-2.2),x1=s?X(FXL+2.2):X(0),y0=Y(30.34),y1=Y(37.66);const B=S.ball,rip=S.cel&&S.cel.t>2.4&&((s===1)===(B.x>52.5))?Math.sin(S.cel.t*30)*1.5*u:0;
      for(let i=1;i<6;i++){const yy=y0+(y1-y0)*i/6;c.beginPath();c.moveTo(x0,yy+rip);c.lineTo(x1,yy-rip);c.stroke();}for(let i=1;i<3;i++){const xx=x0+(x1-x0)*i/3;c.beginPath();c.moveTo(xx+rip,y0);c.lineTo(xx-rip,y1);c.stroke();}}
    /* kaleci uzanışı */
    for(const T of S.T)for(const p of fxOn(T)){if(!p.dive)continue;const PX=X(L(p.px??p.x,p.x)),PY=Y(L(p.py??p.y,p.y)),dir=p.dive.y>p.y?1:-1,R=Math.max(7,Math.min(15,1.55*K))*u;c.save();c.globalAlpha=0.55;c.fillStyle=T===S.U?'#2ec4b6':'#f4a261';c.beginPath();c.ellipse(PX,PY+dir*R*0.9,R*0.55,R*1.5,0,0,7);c.fill();c.restore();
      c.strokeStyle='#fff';c.lineWidth=2*u;c.beginPath();c.moveTo(PX-R*0.3,PY+dir*R*2.2);c.lineTo(PX+R*0.3,PY+dir*R*2.2);c.stroke();}
    /* sevinç */
    if(S.cel&&S.cel.t>0&&S.cel.sc){const p=S.cel.sc,PX=X(L(p.px??p.x,p.x)),PY=Y(L(p.py??p.y,p.y)),R=Math.max(7,Math.min(15,1.55*K))*u,t=S.pt;c.strokeStyle='rgba(255,210,63,.9)';c.lineWidth=2*u;for(let i=0;i<3;i++){const rr=R+((t*14+i*6)%18)*u;c.globalAlpha=1-((t*14+i*6)%18)/18;c.beginPath();c.arc(PX,PY,rr,0,7);c.stroke();}c.globalAlpha=1;
      c.font=`900 ${Math.round(R*1.6)}px sans-serif`;c.textAlign='center';c.fillText('🙌',PX,PY-R*2.2);}
    c.setTransform(1,0,0,1,0,0);}catch(e){}})(fxDraw);

