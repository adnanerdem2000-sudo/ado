/* ================= v79: 3B maç görünümü — Adoball 3B motoru (WebGL2) ile FM tarzı izleme: Yayın ve Taktik kamerası ================= */
const F3={on:false,cam:'bcast',R:null,fail:false,cv:null,key:'',v:null,n:0,map:null,ref:{x:52.5,y:28,fx:0,fy:1},z:1,ST:null,pulse:0,lastCel:null,sz:''};
function f3Sup(){try{return !!(window.Ado3D&&Ado3D.supported());}catch(e){return false;}}
function f3Pref(){try{const v=localStorage.getItem('fx3d');if(v==='1'||v==='0')return v==='1';}catch(e){}try{return f3Sup()&&Ado3D.hw();}catch(e){return false;}}
function f3Cam(){try{return localStorage.getItem('fx3cam')||'bcast';}catch(e){return 'bcast';}}
const f3Hex=h=>{h=String(h||'#888').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
function f3Near(hex,pal){const c=f3Hex(hex);let bi=0,bd=1e9;pal.forEach((p,i)=>{const d=(p[0]-c[0])**2+(p[1]-c[1])**2+(p[2]-c[2])**2;if(d<bd){bd=d;bi=i;}});return bi;}
const F3_HS={long:0,medium:0,short:1,textured:1,crop:1,side:10,quiff:10,buzz:2,fade:2,bald:3,afro:4,dread:5,mohawk:6,bun:7,curly:8,curlytop:8};
function f3Look(p,i){let L=null,src=null;try{src=pByKey(p.k);}catch(e){}try{L=lookOf(p.k,(src&&src.nat)||'TUR',(src&&src.age)||25);}catch(e){}
  const SK=(window.Ado3D&&Ado3D.SKIN)||[[.945,.78,.64]],HR=(window.Ado3D&&Ado3D.HAIR)||[[.11,.08,.06]];
  const h=L&&L.cm?L.cm:Math.round(178+((L&&L.hgt)||1)*0+((hash(p.k+'h')%15)-6)+(p.spos==='KL'?8:p.pos==='DF'?3:p.pos==='KN'?-3:0)),bmi=21.5+(hash(p.k+'w')%30)/10,w=Math.round(bmi*(h/100)*(h/100));
  return {team:p.T===FX.U?0:1,role:p.spos==='KL'?'GK':(p.pos==='DF'?'DEF':p.pos==='FW'?'FWD':'MID'),name:p.name,h,w,sk:L?f3Near(L.sk,SK):null,hs:L?(F3_HS[L.hs]!=null?F3_HS[L.hs]:1):null,hc:L?f3Near(L.hc,HR):null,bd:L?(L.bd==='full'?2:L.bd?1:0):null,ft:hash(p.k+'ft')%5===0?'L':'R'};}
function f3Cols(){const S=FX,d=(a,b)=>{const x=f3Hex(a),y=f3Hex(b);return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2]);};const a=S.U.c1,b=d(S.U.c1,S.O.c1)<0.45?S.O.c2:S.O.c1;return [a,b];}
function f3Ensure(){if(F3.R&&!F3.R.lost)return true;if(F3.fail||!f3Sup())return false;const pw=document.querySelector('#fx .fx-pw');if(!pw)return false;
  let cv=$('#fx3d');if(!cv){cv=document.createElement('canvas');cv.id='fx3d';pw.appendChild(cv);}F3.cv=cv;
  try{F3.R=Ado3D.create(cv,{PW:FXL,PH:FXW,C:{PA_Y0:34-20.16,PA_Y1:34+20.16},quality:(()=>{try{return Ado3D.hw()?(window.innerWidth<700?'mid':'high'):'low';}catch(e){return 'mid';}})()});}catch(e){console.warn('3B',e);F3.R=null;}
  if(!F3.R){F3.fail=true;return false;}F3.key='';F3.sz='';F3.R.onLost=()=>{F3.R=null;F3.on=false;f3Apply();};return true;}
function f3Size(){if(!F3.R||!F3.cv)return;const cv=$('#fxCv');if(!cv)return;const w=FX.cw||cv.clientWidth,h=FX.ch||cv.clientHeight,d=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.5:2),k=w+'x'+h+'@'+d+'|'+cv.offsetLeft+','+cv.offsetTop;if(F3.sz===k)return;F3.sz=k;
  F3.cv.style.left=cv.offsetLeft+'px';F3.cv.style.top=cv.offsetTop+'px';try{F3.R.setSize(w,h,d);}catch(e){console.warn(e);}}
function f3Apply(){const on=!!(F3.on&&F3.R),cv=$('#fxCv'),c3=$('#fx3d');if(cv)cv.style.visibility=on?'hidden':'';if(c3)c3.style.display=on?'block':'none';const fx=$('#fx');if(fx)fx.classList.toggle('fx3on',on);
  const b=$('#fx3b');if(b){b.classList.toggle('on',on);b.textContent=on?'3B':'2B';b.title=on?'3B görünüm açık (2B’ye geçmek için dokun)':'2B görünüm (3B’ye geçmek için dokun)';}
  const c=$('#fx3c');if(c){c.hidden=!on;c.textContent=F3.cam==='full'?'Taktik':'Yayın';}}
function f3Toggle(force){const want=force!=null?force:!F3.on;if(want&&!f3Ensure()){toast(f3Sup()?'3B görünüm başlatılamadı':'Bu cihaz 3B görünümü (WebGL2) desteklemiyor');F3.on=false;f3Apply();return;}F3.on=want;try{localStorage.setItem('fx3d',want?'1':'0');}catch(e){}if(want)f3Size();f3Apply();}
function f3Build(){const S=FX,all=S.U.P.concat(S.O.P),key=all.map(p=>p.k).join(',')+'|'+S.U.id+'|'+S.O.id;if(key===F3.key&&F3.v)return all;F3.key=key;const n=all.length;
  F3.v={x:new Float32Array(n),y:new Float32Array(n),fx:new Float32Array(n),fy:new Float32Array(n),bx:52.5,by:34,bz:0,owner:-1,rx:52.5,ry:28,rfx:0,rfy:1,ar:null,fo:null};F3.n=n;F3.map=new Map(all.map((p,i)=>[p,i]));
  try{F3.R.setMatch({cols:f3Cols(),players:all.map(f3Look),names:[S.U.short||S.U.name,S.O.short||S.O.name]});}catch(e){console.warn('3B setMatch',e);}
  F3.ST={now:0,v:F3.v,cam:{mode:'bcast',zoom:1,replay:false,vs:false,dead:null,style:'std'},rings:[],ringN:0,hasGround:false,tscale:1,celeb:null,refPose:null,refCard:null,refCardT:-1,varOn:false,crowdPulse:0,crowdSide:.5,carry:null,clock:null,ready:null,voff:null,hand:-1,noAct:true};return all;}
function f3Render(){const S=FX;if(!F3.R||F3.R.lost)return false;f3Size();const all=f3Build(),v=F3.v,a=S.phase==='play'&&!S.ff?(typeof fxAlpha==='number'?fxAlpha:1):1,L=(p,q)=>(p==null||isNaN(p))?q:p+(q-p)*a,B=S.ball;
  const bx=L(B.px,B.x),by=L(B.py,B.y);
  for(let i=0;i<all.length;i++){const p=all[i];if(p.off){v.x[i]=-100;v.y[i]=-100;continue;}const x=L(p.px,p.x),y=L(p.py,p.y);v.x[i]=x;v.y[i]=y;
    let dx=x-(p._3x==null?x:p._3x),dy=y-(p._3y==null?y:p._3y);p._3x=x;p._3y=y;const sp=Math.hypot(dx,dy);let tx,ty;if(sp>0.02){tx=dx/sp;ty=dy/sp;}else{tx=bx-x;ty=by-y;const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;}
    if(B.own===p){tx=p.T.dir;ty=0;const l=Math.hypot(dx,dy);if(l>0.02){tx=dx/l;ty=dy/l;}}
    const k=sp>0.02?0.35:0.12;p._3fx=(p._3fx==null?tx:p._3fx+(tx-p._3fx)*k);p._3fy=(p._3fy==null?ty:p._3fy+(ty-p._3fy)*k);const ln=Math.hypot(p._3fx,p._3fy)||1;v.fx[i]=p._3fx/ln;v.fy[i]=p._3fy/ln;}
  v.bx=bx;v.by=by;v.bz=Math.max(0,L(B.pz,B.z||0));v.owner=B.own&&F3.map.has(B.own)?F3.map.get(B.own):-1;
  /* hakem: topu 10-12 m geriden ve yandan takip eder */
  const R=F3.ref,gx=clamp(bx-(bx>52.5?9:-9)*0.6,8,97),gy=clamp(by+(by<34?9:-9),4,64),rk=0.035;const ox=R.x,oy=R.y;R.x+=(gx-R.x)*rk;R.y+=(gy-R.y)*rk;let rfx=bx-R.x,rfy=by-R.y;const rl=Math.hypot(rfx,rfy)||1;v.rx=R.x;v.ry=R.y;v.rfx=rfx/rl;v.rfy=rfy/rl;
  const ST=F3.ST;ST.now=performance.now();ST.cam.mode=F3.cam;ST.cam.zoom=F3.z*(S.zoom?1.7:1);ST.tscale=Math.max(.3,(S.spd||1)*FXU*0.5*(S.smart&&typeof fxSmart==='function'?fxSmart():1));
  /* top sürme ve kaleci elde top */
  const own=v.owner;ST.carry=own>=0&&all[own].spos!=='KL'?{id:own,type:'carry'}:null;ST.hand=own>=0&&all[own].spos==='KL'?own:-1;
  /* halkalar: top sahibi ve seçili oyuncu */
  const rings=[];if(own>=0)rings.push({x:v.x[own],z:v.y[own],r:.62,col:[1,1,1],a:.26});const sel=S.sel?all.findIndex(p=>p.k===S.sel):-1;if(sel>=0)rings.push({x:v.x[sel],z:v.y[sel],r:1.3,col:[1,.79,.24],a:.9});ST.rings=rings;ST.ringN=rings.length;
  /* gol sevinci ve tribün */
  ST.celeb=null;if(S.cel&&S.cel.sc&&F3.map.has(S.cel.sc)){const si=F3.map.get(S.cel.sc),ids=[si];for(let i=0;i<all.length;i++)if(i!==si&&!all[i].off&&all[i].T===S.cel.sc.T&&Math.hypot(v.x[i]-v.x[si],v.y[i]-v.y[si])<14)ids.push(i);ST.celeb={ids};if(F3.lastCel!==S.cel){F3.lastCel=S.cel;F3.pulse=1;ST.crowdSide=v.bx<52.5?0:1;}}
  F3.pulse=Math.max(0,F3.pulse-0.004);ST.crowdPulse=F3.pulse;
  try{F3.R.render(ST);}catch(e){F3.err=(F3.err||0)+1;if(F3.err===1)console.warn('3B çizim',e);if(F3.err>60){F3.on=false;f3Apply();toast('3B görüntüde hata oluştu, 2B görünüme geçildi');}return false;}return true;}
/* maç ekranı: düğmeler, boyut, çizim */
fxOpen=(old=>function(){const r=old.apply(this,arguments);try{F3.key='';F3.sz='';F3.lastCel=null;F3.err=0;F3.ref={x:52.5,y:28};F3.cam=f3Cam();F3.z=1;
    const ctl=document.querySelector('#fx .fx-ctl');if(ctl&&!$('#fx3b')){const nm=$('#fxNm');const h=`<button data-fx="v3" id="fx3b" title="2B / 3B görünüm">2B</button><button data-fx="cam3" id="fx3c" hidden title="Kamera: Yayın / Taktik">Yayın</button>`;if(nm)nm.insertAdjacentHTML('afterend',h);else ctl.insertAdjacentHTML('beforeend',h);}
    const c3=$('#fx3d');if(c3)c3.remove();F3.R=null;F3.cv=null;
    if(f3Sup()&&f3Pref()){F3.on=f3Ensure();}else F3.on=false;setTimeout(()=>{try{f3Size();f3Apply();}catch(e){}},80);f3Apply();}catch(e){console.warn(e);}return r;})(fxOpen);
fxResize=(old=>function(){const r=old.apply(this,arguments);try{F3.sz='';f3Size();}catch(e){}return r;})(fxResize);
fxDraw=(old=>function(){if(F3.on&&F3.R&&FX&&FX.phase!=='replay'&&!(FX.rp&&FX.rp.on)){const ok=f3Render();if(ok){const cv=$('#fxCv');if(cv&&cv.style.visibility!=='hidden')cv.style.visibility='hidden';return;}}
  const cv=$('#fxCv');if(cv&&cv.style.visibility==='hidden'&&!(F3.on&&F3.R&&FX&&FX.phase!=='replay'))cv.style.visibility='';if(F3.on&&FX&&FX.phase==='replay'){if(cv)cv.style.visibility='';const c3=$('#fx3d');if(c3)c3.style.display='none';}else if(F3.on){const c3=$('#fx3d');if(c3&&c3.style.display==='none')c3.style.display='block';}
  {const o3=$('#fx3o');if(o3)o3.style.display='none';}
  return old.apply(this,arguments);})(fxDraw);
fxAct=(old=>function(a,k,v){if(a==='v3'){f3Toggle();return;}if(a==='cam3'){F3.cam=F3.cam==='full'?'bcast':'full';try{localStorage.setItem('fx3cam',F3.cam);}catch(e){}try{F3.R&&F3.R.resetCam&&F3.R.resetCam();}catch(e){}f3Apply();toast(F3.cam==='full'?'Taktik kamerası: tüm saha':'Yayın kamerası: topu takip eder');return;}return old.apply(this,arguments);})(fxAct);
fxClose=(old=>function(){try{if(F3.R&&F3.R.dispose)F3.R.dispose();}catch(e){}F3.R=null;F3.cv=null;F3.key='';return old.apply(this,arguments);})(fxClose);
/* klavye: V = 2B/3B, C = kamera */
document.addEventListener('keydown',e=>{try{if(!FX||!$('#fx')||$('#fx').hidden||e.target&&/input|textarea|select/i.test(e.target.tagName))return;if(e.key==='v'||e.key==='V'){f3Toggle();}else if((e.key==='c'||e.key==='C')&&F3.on){fxAct('cam3');}}catch(_){}});
/* tekerlek / iki parmakla yakınlaştırma (3B yayın kamerası) */
document.addEventListener('wheel',e=>{try{if(!F3.on||!F3.cv||e.target!==F3.cv)return;e.preventDefault();F3.z=clamp(F3.z*(e.deltaY>0?0.92:1.08),0.6,2.2);}catch(_){}},{passive:false});
/* vuruş animasyonları: pas, uzun pas/orta, şut, uzaklaştırma */
function f3Kick(c,kind,pw){try{if(!F3.on||!F3.R||!F3.map||!c)return;const i=F3.map.get(c);if(i==null)return;const B=FX.ball;let k=kind;if(k==='pass'&&B.fl&&((B.fl.h||B.fl.vz||0)>2||Math.hypot((B.fl.tx||0)-(B.fl.x0||0),(B.fl.ty||0)-(B.fl.y0||0))>28))k='pass_high';F3.R.kick(i,k,pw);}catch(e){}}
fxPass=(old=>function(c){const r=old.apply(this,arguments);f3Kick(c,'pass',.45);return r;})(fxPass);
fxCross=(old=>function(c){const r=old.apply(this,arguments);f3Kick(c,'pass_high',.6);return r;})(fxCross);
fxClear=(old=>function(c){const r=old.apply(this,arguments);f3Kick(c,'clear',.8);return r;})(fxClear);
fxShoot=(old=>function(c){const r=old.apply(this,arguments);try{const f=FX&&FX.ball.fl;f3Kick(c,f&&f.hdr?'head':'shot',.85);}catch(e){}return r;})(fxShoot);
/* 3B üst katman: oyuncu isimleri, top sahibi etiketi, yağmur/kar */
function f3Overlay(all,v){const S=FX,R=F3.R;let o=$('#fx3o');const c3=F3.cv;if(!c3)return;if(!o){o=document.createElement('canvas');o.id='fx3o';c3.parentNode.appendChild(o);}
  const w=S.cw,h=S.ch,d=Math.min(2,window.devicePixelRatio||1);if(o.width!==Math.round(w*d)||o.height!==Math.round(h*d)){o.width=Math.round(w*d);o.height=Math.round(h*d);o.style.width=w+'px';o.style.height=h+'px';}
  o.style.left=c3.style.left;o.style.top=c3.style.top;o.style.display='block';const g=o.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  const P={x:0,y:0,w:0};g.textAlign='center';g.textBaseline='bottom';
  for(let i=0;i<all.length;i++){if(v.x[i]<-20)continue;const own=i===v.owner;if(!own)continue;/* v191: yalnız top ayağındaki oyuncunun adı (sarı/seçili/tüm adlar etiketi yok) */if(!R.projectTo(P,v.x[i],2.15,v.y[i]))continue;if(P.x<-40||P.x>w+40||P.y<0||P.y>h)continue;
    const p=all[i],t=`${p.num} ${p.sur}`,fs=12;g.font=`700 ${fs}px system-ui,sans-serif`;const tw=g.measureText(t).width+10;
    g.fillStyle='rgba(8,13,23,.68)';g.beginPath();if(g.roundRect)g.roundRect(P.x-tw/2,P.y-fs-5,tw,fs+5,(fs+5)/2);else g.rect(P.x-tw/2,P.y-fs-5,tw,fs+5);g.fill();
    g.fillStyle='#f2f6fb';g.fillText(t,P.x,P.y-1.5);}
  const W2=S.wx;if(W2&&['yagmur','saganak','kar'].includes(W2.k)){const n=W2.k==='saganak'?160:90,Pp=F3.wxp=F3.wxp||[];while(Pp.length<n)Pp.push({x:Math.random()*w,y:Math.random()*h,v:.6+Math.random()*.8});
    if(W2.k==='kar'){g.fillStyle='rgba(255,255,255,.85)';for(const p of Pp){p.y+=0.9*p.v;p.x+=Math.sin((p.y+p.v*50)/20)*.4;if(p.y>h){p.y=-4;p.x=Math.random()*w;}g.beginPath();g.arc(p.x,p.y,1.1+p.v,0,6.283);g.fill();}}
    else{g.strokeStyle='rgba(200,220,255,.4)';g.lineWidth=1;g.beginPath();for(const p of Pp){p.y+=10*p.v;p.x-=2*p.v;if(p.y>h){p.y=-10;p.x=Math.random()*w*1.1;}g.moveTo(p.x,p.y);g.lineTo(p.x+2.5,p.y-11*p.v);}g.stroke();}}}
f3Render=(old=>function(){const r=old.apply(this,arguments);try{if(r&&F3.v)f3Overlay(f3Build(),F3.v);}catch(e){}return r;})(f3Render);
f3Apply=(old=>function(){const r=old.apply(this,arguments);try{const o=$('#fx3o');if(o&&!(F3.on&&F3.R))o.style.display='none';}catch(e){}return r;})(f3Apply);

