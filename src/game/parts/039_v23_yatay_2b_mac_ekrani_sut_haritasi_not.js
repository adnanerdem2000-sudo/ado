/* ================= v23: yatay 2B maç ekranı, şut haritası, not gösterimi ================= */
fxPx=function(x,y){const m=10,pw=FX.cw-m*2,ph=FX.ch-m*2;return [m+(x/FXL)*pw,m+(y/FXW)*ph];};
fxResize=function(){const cv=$('#fxCv');if(!cv||!FX)return;const pw=cv.parentNode,side=window.innerWidth>=1000||(window.innerWidth>window.innerHeight&&window.innerHeight<560);
  const top=($('#fxTop')||{}).offsetHeight||100,availW=Math.max(260,pw.clientWidth-(side?28:12)),availH=side?window.innerHeight-top-(window.innerWidth>=1000?40:16):window.innerHeight*0.4;
  const w=Math.round(Math.min(availW,availH*FXL/FXW*0.97)),h=Math.round(w*FXW/FXL/0.97);const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';FX.cw=w;FX.ch=h;FX.dpr=dpr;};
fxDraw=function(){const cv=$('#fxCv'),S=FX;if(!cv||!S)return;const c=cv.getContext('2d'),dpr=S.dpr,W=S.cw,H=S.ch;c.setTransform(dpr,0,0,dpr,0,0);
  const m=10,pw=W-m*2,ph=H-m*2,P=(x,y)=>fxPx(x,y),sc=pw/FXL;
  c.fillStyle='#3d9a45';c.fillRect(0,0,W,H);for(let i=0;i<16;i++){if(i%2)continue;c.fillStyle='rgba(255,255,255,.055)';c.fillRect(m+pw*i/16,m,pw/16,ph);}
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.3;c.strokeRect(m,m,pw,ph);
  let [a,b]=P(52.5,0),[a2,b2]=P(52.5,FXW);c.beginPath();c.moveTo(a,b);c.lineTo(a2,b2);c.stroke();const [cx,cy]=P(52.5,34);c.beginPath();c.arc(cx,cy,9.15*sc,0,7);c.stroke();
  c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(cx,cy,1.8,0,7);c.fill();
  const ang=Math.acos(5.5/9.15);
  for(const end of [0,1]){const X=e=>end?FXL-e:e,rc=(x1,y1,x2,y2)=>{const [p1,q1]=P(x1,y1),[p2,q2]=P(x2,y2);return [Math.min(p1,p2),Math.min(q1,q2),Math.abs(p2-p1),Math.abs(q2-q1)];};
    c.strokeRect(...rc(X(16.5),13.85,X(0),54.15));c.strokeRect(...rc(X(5.5),24.85,X(0),43.15));
    c.fillStyle='rgba(255,255,255,.9)';c.fillRect(...rc(X(0),30.34,X(-1.6),37.66));
    const [sx,sy]=P(X(11),34);c.beginPath();c.arc(sx,sy,1.6,0,7);c.fill();const m0=end?Math.PI:0;c.beginPath();c.arc(sx,sy,9.15*sc,m0-ang,m0+ang);c.stroke();
    for(const yy of [0,FXW]){const [kx,ky]=P(X(0),yy);c.beginPath();c.arc(kx,ky,1*sc+2,end?(yy?Math.PI:Math.PI/2):(yy?-Math.PI/2:0),end?(yy?Math.PI*1.5:Math.PI):(yy?0:Math.PI/2));c.stroke();}}
  for(const tr of S.trail){const [x0,y0]=P(tr.x0,tr.y0),[x1,y1]=P(tr.x1,tr.y1);c.strokeStyle=`rgba(255,255,255,${tr.t*0.22})`;c.setLineDash([4,4]);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.setLineDash([]);}
  const col=(T)=>{const u=S.U,o=S.O;if(T===u)return [u.c1,u.c2];const dd=(h1,h2)=>{const f=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=f(h1),B=f(h2);return Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs(A[2]-B[2]);};
    return dd(o.c1,u.c1)<160?(dd(o.c2,u.c1)<160?['#f2f2f2','#222']:[o.c2,o.c1]):[o.c1,o.c2];};
  const B=S.ball,r=Math.max(5.5,Math.min(13,ph/30)),fs=Math.max(8,Math.round(r*1.05)),nm=S.nmode===undefined?(S.names?1:0):S.nmode;c.textAlign='center';c.textBaseline='middle';
  for(const T of S.T){const [f,s]=col(T);for(const p of fxOn(T)){const [x,y]=P(p.x,p.y);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(x+1,y+2,r,r*0.8,0,0,7);c.fill();
      c.fillStyle=p.spos==='KL'?(T===S.U?'#2ec4b6':'#f4a261'):f;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.lineWidth=2;c.strokeStyle=B.own===p?'#fff':s;c.stroke();
      if(B.own===p){c.strokeStyle='rgba(255,230,120,.9)';c.lineWidth=1.5;c.beginPath();c.arc(x,y,r+3.5,0,7);c.stroke();}
      c.font=`800 ${fs}px Barlow Semi Condensed,sans-serif`;c.fillStyle=p.spos==='KL'?'#111':s;c.fillText(p.num,x,y+0.5);
      if(nm){const lab=nm===2?dec(fxR(p),1):p.sur;c.font=`700 ${Math.max(8,Math.round(r*0.95))}px Barlow Semi Condensed,sans-serif`;const w=c.measureText(lab).width+6,lh=Math.max(10,r*1.3);
        c.fillStyle=nm===2?(fxR(p)>=7.2?'rgba(46,170,90,.9)':fxR(p)<6.2?'rgba(200,60,60,.9)':'rgba(0,0,0,.6)'):'rgba(0,0,0,.55)';c.fillRect(x-w/2,y+r+1,w,lh);c.fillStyle='#fff';c.fillText(lab,x,y+r+1+lh/2);}
      if(p.yel){c.fillStyle='#ffd23f';c.fillRect(x+r-2,y-r-2,4,6);}}}
  const [bx,by]=P(B.x,B.y);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(bx+1+B.z,by+2+B.z,3,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(bx,by-B.z*1.5,3.4+B.z*0.25,0,7);c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();
  const o=B.own||(B.fl&&B.fl.to);if(o&&S.phase==='play'&&!S.ff){const T=o.T,txt=`${o.num} ${o.sur}`;c.font='800 13px Barlow Semi Condensed,sans-serif';const w=c.measureText(txt).width+18;
    c.fillStyle='rgba(0,0,0,.6)';c.fillRect(12,12,w,22);c.fillStyle=T===S.U?S.U.c1:'#ff6a5f';c.fillRect(12,12,5,22);c.fillStyle='#fff';c.textAlign='left';c.fillText(txt,22,23.5);c.textAlign='center';}
  if(S.flash){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,H/2-34,W,68);c.font='900 44px Barlow Semi Condensed,sans-serif';c.fillStyle=S.flash.us?'#35d49a':'#ff6a5f';c.fillText(S.flash.txt,W/2,H/2);}
  if(S.ff&&S.phase==='play'){c.fillStyle='rgba(0,0,0,.5)';c.fillRect(0,0,W,H);c.font='800 22px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.fillText(`⏭ ${fxMin()}’`,W/2,H/2-8);c.font='600 13px Barlow Semi Condensed,sans-serif';c.fillText('Devre sonuna ilerleniyor',W/2,H/2+16);}
  else if(S.phase!=='play'){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.font='800 22px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.fillText(S.phase==='pre'?'Başlamak için ▶':S.phase==='ht'?'DEVRE ARASI':S.phase==='end'?'MAÇ SONU':'DURAKLATILDI',W/2,H/2);}};
/* şut kaydı */
fxShoot=(old=>function(c,pr,setK){old(c,pr,setK);const S=FX,f=S&&S.ball.fl;if(S&&f&&f.kind==='sh')(S.shots=S.shots||[]).push({x:c.x,y:c.y,s:c.T.side,r:f.res,xg:f.xg,m:fxMin(),n:c.sur});})(fxShoot);
fxHeader=(old=>function(a,xg,from){const S=FX,g0=S.score[a.T.side];old(a,xg,from);if(!FX)return;const f=S.ball.fl;(S.shots=S.shots||[]).push({x:a.x,y:a.y,s:a.T.side,r:S.score[a.T.side]>g0?'g':f&&f.kind==='sh'?f.res:'hd',xg,m:fxMin(),n:a.sur,h:1});})(fxHeader);
function fxShotMap(){const S=FX,sh=S.shots||[],Wd=210,Hd=136,X=x=>4+x/FXL*(Wd-8),Y=y=>4+y/FXW*(Hd-8);
  const dots=sh.map(s=>{const g=s.r==='g',cl=s.s===0?'#43d17a':'#ff6a5f',rr=3+Math.min(6,s.xg*14);return g?`<text x="${X(s.x)}" y="${Y(s.y)+4}" text-anchor="middle" font-size="12">⚽</text>`:`<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${rr}" fill="${s.r==='sv'?cl:'none'}" stroke="${cl}" stroke-width="1.5" opacity=".9"><title>${s.m}’ ${esc(s.n)} · xG ${dec(s.xg||0,2)}</title></circle>`;}).join('');
  return `<p class="fx-sub">Şut haritası · dolu: isabetli, boş: isabetsiz/blok, ⚽ gol</p><svg class="fx-shm" viewBox="0 0 ${Wd} ${Hd}"><rect x="4" y="4" width="${Wd-8}" height="${Hd-8}" fill="#2f7d38" stroke="rgba(255,255,255,.6)"/><line x1="${Wd/2}" y1="4" x2="${Wd/2}" y2="${Hd-4}" stroke="rgba(255,255,255,.6)"/><circle cx="${Wd/2}" cy="${Hd/2}" r="${9.15/FXL*(Wd-8)}" fill="none" stroke="rgba(255,255,255,.6)"/>
   <rect x="4" y="${Y(13.85)}" width="${16.5/FXL*(Wd-8)}" height="${Y(54.15)-Y(13.85)}" fill="none" stroke="rgba(255,255,255,.6)"/><rect x="${X(FXL-16.5)}" y="${Y(13.85)}" width="${16.5/FXL*(Wd-8)}" height="${Y(54.15)-Y(13.85)}" fill="none" stroke="rgba(255,255,255,.6)"/>${dots}</svg>
   <p class="fx-legend"><span style="color:#43d17a">● ${esc(S.U.short)} → sağa hücum</span><span style="color:#ff6a5f">${esc(S.O.short)} ← sola hücum ●</span></p>`;}
fxBodyUI=(old=>function(){old();const S=FX,el=$('#fxBody');if(!S||!el)return;if(S.tab==='st'&&S.phase!=='ht'&&S.phase!=='end')el.insertAdjacentHTML('beforeend',fxShotMap());})(fxBodyUI);
fxAct=(old=>function(a,k,v){const S=FX;if(S&&a==='names'){S.nmode=((S.nmode===undefined?1:S.nmode)+1)%3;S.names=S.nmode>0;const b=$('#fxNm');if(b)b.textContent=['Etiket yok','İsim','Not'][S.nmode];return;}return old(a,k,v);})(fxAct);

