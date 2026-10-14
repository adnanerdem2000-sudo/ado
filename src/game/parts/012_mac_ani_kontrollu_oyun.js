/* ================= MAÇ ANI: kontrollü oyun ================= */
const GL=30.34,GR=37.66,GH=2.44,GRAV=9.81,CAM_H=10.5,CAM_B=14.5,CAM_A=Math.atan2(CAM_H,CAM_B),CT=Math.cos(CAM_A),ST=Math.sin(CAM_A);
const SKINS=['#f1c9a5','#e3b48a','#c98d5f','#a8704a','#7d4f31','#5b3823'];
const HAIRC=['#120b07','#2b1a10','#4a2f18','#7a5230','#c9a15a','#1d1d1d'];
const HSTY=['short','short','buzz','side','curly','bald'];
const MG={S:null,ctx:null,dpr:1,W:0,H:0,f:300,cy0:0,cam:{x:34,y:20},raf:0,last:0,acc:0,crowd:[],vig:null,sky:null,shake:0,padK:null,joyOn:false};
const IN={jx:0,jy:0,btn:{a:false,b:false,c:false,d:false},t0:{a:0,b:0,c:0,d:0},q:[],keys:new Set()};
function vib(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(_){}}
function press(b){if(IN.btn[b])return;IN.btn[b]=true;IN.t0[b]=performance.now();IN.q.push({b,type:'d'});vib(8);}
function release(b){if(!IN.btn[b])return;IN.btn[b]=false;IN.q.push({b,type:'u',hold:(performance.now()-IN.t0[b])/1000});}
function resetInput(){IN.jx=IN.jy=0;IN.btn.a=IN.btn.b=IN.btn.c=IN.btn.d=false;IN.q.length=0;IN.keys.clear();document.querySelectorAll('.pbtn.on').forEach(b=>b.classList.remove('on'));}
function colorDist(a,b){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);}
function lum(h){const n=parseInt(h.slice(1),16);return ((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000;}
function shade(h,a){const n=parseInt(h.slice(1),16),f=x=>clamp(Math.round(x*(1+a)),0,255);return '#'+[f(n>>16),f((n>>8)&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function kitOf(c,alt){const pat=alt?0:(c.pat??(hash(c.id)>>2)%5);const shirt=alt?c.c2:c.c1,trim=alt?c.c1:c.c2,L=lum(shirt);
  return {shirt,trim,pat,shorts:L>140?'#1d2128':'#f2f2f2',socks:pat===1?trim:shirt,num:L>150?'#141414':'#ffffff'};}
const iqOf=str=>clamp((str-28)/62,0,1);
/* Kondisyon etkileri: düşük kondisyon hızı, depar süresini ve şut gücünü sınırlar. */
const condSpeed=c=>c>=60?1:0.72+0.28*c/60,condPow=c=>c>=50?1:0.5+0.5*c/50,stamCap=c=>clamp(c/80,0.12,1);

/* ---------- Kurulum ---------- */
let NUMS=[];
function mkP(side,x,y,o){const e=Object.assign({side,x,y,z:0,vx:0,vy:0,fx:0,fy:side==='opp'?1:-1,ph:Math.random()*6.3,stag:0,cd:0,slide:0,down:0,dash:0,cel:0,hold:0,think:0,kickT:0,
  skin:pick(SKINS),hair:pick(HAIRC),hs:pick(HSTY),num:0,hx:x,hy:y,tx:x,ty:y,tsp:4,job:null},lookQ(side,o),o||{});if(!e.num)e.num=NUMS.pop()||rint(2,30);return e;}
function makeChance(type,C){
  NUMS=shuffle(Array.from({length:22},(_,i)=>i+2).filter(n=>n!==C.num));LOOKQ=mkLookQ(C);
  const S={type,C,t:0,live:0,phase:'intro',introT:1.0,mates:[],opps:[],parts:[],stam:1,charge:-1,spin:0,cDown:-9,dn:{},res:null,limit:12,ofs:null,net:null,inNet:false,
    skillCd:0,tkCd:0,pokeT:0,brainOT:0,brainUT:0,lineY:14,defLine:14,kicked:false,kickAt:0,wallT:9,aim:null,mode:'atk',sprint:false,slideHit:false,presser:null,path:null,pathAt:-1,
    iqOpp:iqOf(C.opp.str),iqUs:iqOf(C.us.str),cond:C.cond??C.energy??90,wx:C.wx||'acik',wind:C.wind||0};S.stam=stamCap(S.cond);
  const side=Math.random()<.5?-1:1;
  const kUs=kitOf(C.us);let kOpp=kitOf(C.opp);
  if(colorDist(kUs.shirt,kOpp.shirt)<130){kOpp=kitOf(C.opp,true);if(colorDist(kUs.shirt,kOpp.shirt)<130)kOpp={shirt:'#f3f3f3',trim:C.opp.c1,pat:0,shorts:'#1d2128',socks:'#f3f3f3',num:'#141414'};}
  const gkA={shirt:'#ff8a1f',trim:'#3a1d00',pat:0,shorts:'#2a1505',socks:'#ff8a1f',num:'#2a1505'},gkB={shirt:'#19c2a6',trim:'#03302a',pat:0,shorts:'#06231f',socks:'#19c2a6',num:'#03302a'};
  const U=(x,y,o)=>{const e=mkP('us',x,y,Object.assign({kit:kUs,q:clamp(C.us.str+rnd(-8,8),20,95)},o));S.mates.push(e);return e;};
  const O=(x,y,o)=>{const e=mkP('opp',x,y,Object.assign({kit:kOpp},o));S.opps.push(e);return e;};
  const ce=S.hero=mkP('us',34,30,{kit:kUs,isC:true,skin:PL().sk,hair:PL().hc,hs:PL().hs,bd:G.p.age>=18?PL().bd:null,hgt:clamp(1+((G.p.h||1.74)-1.8)*1.2,0.85,1.15),num:C.num,capt:!!C.capt,boot:G.p.up.kt>=4?'#ffd400':G.p.up.kt>=3?'#ff4f9a':'#f4f4f4'});
  S.ball={x:0,y:0,z:0,vx:0,vy:0,vz:0,om:0,owner:null,held:null,last:null,lastT:-9,kind:null,rot:0,px:0,py:0,pz:0,target:null,gkChecked:false,ign:null};
  if(type==='atak'){
    let cx=34+side*rnd(3,10),cy=rnd(24,29);
    if(C.pos==='KN'){cx=34+side*rnd(15,21);cy=rnd(19,24);}else if(C.pos==='OS'){cy=rnd(27,32);}else if(C.pos==='DF'){cy=rnd(31,35);}
    ce.x=cx;ce.y=cy;const line=rnd(13,16);S.lineY=line;
    [-12,-4,4,12].forEach(dx=>O(34+dx+rnd(-1.5,1.5),line+rnd(-0.8,0.8)));
    O(cx+rnd(-2,2),cy-rnd(3.5,5),{role:'mid'});
    U(34-side*rnd(2,6),line+rnd(0.8,2.5),{role:'striker',rx:34-side*rnd(1,5),ry:rnd(7,10)});
    U(34-side*rnd(16,21),line+rnd(3,7),{role:'wide',rx:34-side*rnd(14,19),ry:rnd(8,12)});
    U(cx-side*rnd(5,8),cy+rnd(4,7),{role:'support',ox:-side*6,oy:6});
    S.limit=13;
  }else if(type==='drill'){
    ce.x=34+side*rnd(2,13);ce.y=rnd(17,25);S.limit=8;
  }else if(type==='kontra'){
    const cx=34+side*rnd(2,10),cy=rnd(40,44);ce.x=cx;ce.y=cy;S.lineY=24;
    O(34+side*rnd(2,7),rnd(22,26));O(34-side*rnd(4,9),rnd(24,28));if(Math.random()<0.6)O(34-side*rnd(0,4),rnd(15,18));O(cx+side*1.5,cy+rnd(3,5),{role:'chaser'});
    U(34-side*rnd(8,14),cy-rnd(1,4),{role:'striker',rx:34-side*rnd(3,7),ry:rnd(8,11)});
    U(cx-side*4,cy+6,{role:'support',ox:-side*6,oy:5});
    S.limit=14;
  }else if(type==='serbest'||type==='penalti'){
    S.mode='set';
    if(type==='penalti'){S.ball.x=34;S.ball.y=11;ce.x=34-side*0.9;ce.y=13.2;
      [-9,-5,5,9].forEach((dx,i)=>(i%2?U:O)(34+dx,rnd(18.5,20.5),{role:'idle'}));
      O(34+side*13,20,{role:'idle'});U(34-side*13,20.5,{role:'idle'});
      S.aim={x:34,z:0.8};
    }else{
      const fx=34+side*rnd(2,12),fy=rnd(20,27);S.ball.x=fx;S.ball.y=fy;
      const dx0=fx-34,dd=Math.hypot(dx0,fy);ce.x=fx+dx0/dd*1.7+(fx<34?-0.7:0.7);ce.y=fy+fy/dd*1.7;
      const npx=fx<34?GL+1:GR-1,wdx=npx-fx,wdy=-fy,wd=Math.hypot(wdx,wdy),ux=wdx/wd,uy=wdy/wd,wx=fx+ux*9.15,wy=fy+uy*9.15,px=-uy,py=ux;
      const n=dd<22?4:3;for(let i=0;i<n;i++){const o=(i-(n-1)/2)*0.7+(fx<34?0.35:-0.35);O(wx+px*o,wy+py*o,{wall:true,role:'idle'});}
      for(let i=0;i<3;i++){const x=34+rnd(-9,9),y=rnd(6,12);U(x,y,{role:'idle'});O(x+rnd(-0.8,0.8),y-rnd(0.6,1),{role:'idle'});}
      S.aim={x:34+(fx<34?1:-1)*2.3,z:1.5};
    }
  }else if(type==='korner'||type==='dkorner'){
    const def=type==='dkorner',cs=side,fx=cs<0?0.5:67.5;S.cs=cs;S.ball.x=fx;S.ball.y=0.5;
    S.ck=def?'def':(C.sub==='take'?'take':'box');
    const spots=[[34-cs*3.5,6.5],[34+cs*1.5,7.5],[34-cs*0.5,11],[34+cs*5.5,10.5],[34-cs*7,9.5]];
    if(!def){const box=S.ck==='box',atk=[];
      if(box){ce.x=34+rnd(-4,4);ce.y=rnd(11,14);ce.fy=-1;U(fx+(cs<0?-0.9:0.9),-0.6,{role:'taker'});}
      else{ce.x=fx+(cs<0?-0.9:0.9);ce.y=-0.6;}
      const n=box?4:5;for(let i=0;i<n;i++){const [x,y]=spots[i];atk.push(U(x+rnd(-1,1),y+rnd(1.5,4),{role:'box',rx:x,ry:y}));}
      if(box)atk.push(ce);
      for(const a of atk)O(a.x+(34-a.x)*0.05,a.y-0.8,{role:'mk',mk:a});
      O(34+cs*3,3.2,{role:'zn',zx:34+cs*3,zy:3.2});O(34-cs*2,5.2,{role:'zn',zx:34-cs*2,zy:5.2});
      U(34+rnd(-6,6),26,{role:'idle'});O(34+rnd(-4,4),21,{role:'idle'});
      S.mode=box?'air':'set';S.aim={x:34+cs*1.5,y:7};S.limit=9;
    }else{S.mode='air';O(fx+(cs<0?-0.9:0.9),-0.6,{role:'taker'});const atk=[];
      for(let i=0;i<5;i++){const [x,y]=spots[i];atk.push(O(x+rnd(-1,1),y+rnd(1.5,4),{role:'box',rx:x,ry:y,fy:-1}));}
      const mine=pick(atk);S.myMan=mine;ce.x=mine.x+(34-mine.x)*0.05;ce.y=mine.y-0.8;ce.fy=1;
      for(const a of atk)if(a!==mine)U(a.x+(34-a.x)*0.05,a.y-0.8,{role:'mk',mk:a});
      U(34+cs*3,3.2,{role:'zn',zx:34+cs*3,zy:3.2});
      U(34+rnd(-6,6),23,{role:'idle'});O(34+rnd(-4,4),25,{role:'idle'});S.limit=9;}
  }else if(type==='tr_kos'||type==='tr_top'){const wb=type==='tr_top';ce.x=34+rnd(-3,3);ce.y=wb?40:44;ce.fy=-1;S.limit=wb?20:13;
    S.gates=[];let y=ce.y;const n=wb?5:6;for(let i=0;i<n;i++){y-=wb?5.2:5.6;S.gates.push({x:clamp(34+(i%2?1:-1)*rnd(3.5,8),10,58),y,w:wb?2.8:2.5,ok:null});}S.gi=0;S.trPts=0;
  }else{
    S.mode='def';const geri=C.sub==='geri';
    const ax=34+side*rnd(4,12),ay=geri?rnd(36,42):rnd(40,45);
    const A=O(ax,ay,{role:'att',fy:-1});
    O(34-side*rnd(8,13),ay+rnd(-2,2),{role:'runner',fy:-1});
    if(Math.random()<0.6)O(34+side*rnd(14,20),ay+rnd(2,6),{role:'runner',fy:-1});
    if(geri){ce.x=ax+rnd(-3,3);ce.y=ay+rnd(4,7);ce.fy=-1;}else{ce.x=34+side*rnd(-2,5);ce.y=rnd(26,31);ce.fy=1;}
    U(34-side*rnd(5,9),rnd(20,26),{role:'cover'});
    U(34+side*rnd(3,8),rnd(15,21),{role:'cover'});
    S.ball.owner=A;S.limit=geri?14:13;
  }
  const ourGK=S.mode==='def'||S.ck==='def';
  S.gk=mkP(ourGK?'us':'opp',34,type==='penalti'?0.3:1.2,{kit:ourGK?gkA:gkB,isGK:true,str:ourGK?C.us.str:C.opp.str,fy:ourGK?-1:1,num:1,hs:pick(['short','buzz','side'])});
  if(type==='serbest')S.gk.x=34+(S.ball.x<34?0.9:-0.9);
  if(S.ck){S.gk.x=34+S.cs*1.0;S.gk.y=0.9;}
  if(type==='atak'||type==='kontra'||type==='drill'||type==='tr_top')S.ball.owner=ce;
  if(type==='tr_kos')S.ball.held=S.gk;
  S.all=[ce,...S.mates,...S.opps,S.gk];
  const o=S.ball.owner;if(o){S.ball.x=o.x+o.fx*0.45;S.ball.y=o.y+o.fy*0.45;}
  S.ball.px=S.ball.x;S.ball.py=S.ball.y;
  return S;
}

/* ---------- Hareket ve fizik ---------- */
function faceAnim(e,dt){const sp=Math.hypot(e.vx,e.vy);
  if(sp>0.5){e.fx=e.vx/sp;e.fy=e.vy/sp;}
  else if(!e.isC&&MG.S){const b=MG.S.ball;if(b.owner!==e){const dx=b.x-e.x,dy=b.y-e.y,d=Math.hypot(dx,dy);if(d>0.3){e.fx+=(dx/d-e.fx)*0.08;e.fy+=(dy/d-e.fy)*0.08;const m=Math.hypot(e.fx,e.fy)||1;e.fx/=m;e.fy/=m;}}}
  e.ph+=sp*dt*2.3;if(e.kickT>0)e.kickT-=dt;}
function steer(e,tx,ty,sp,dt){const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy);let vx=0,vy=0;if(d>0.08){const s=Math.min(sp,d*2.6);vx=dx/d*s;vy=dy/d*s;}
  const k=1-Math.pow(0.006,dt);e.vx+=(vx-e.vx)*k;e.vy+=(vy-e.vy)*k;e.x+=e.vx*dt;e.y+=e.vy*dt;faceAnim(e,dt);}
function drift(e,dt,f){const k=Math.pow(f||0.04,dt);e.vx*=k;e.vy*=k;e.x+=e.vx*dt;e.y+=e.vy*dt;faceAnim(e,dt);}
function busy(e,dt){if(e.slide>0){e.slide-=dt;drift(e,dt,0.3);if(e.slide<=0)e.down=0.55;return true;}if(e.down>0){e.down-=dt;drift(e,dt,0.01);return true;}if(e.stag>0){e.stag-=dt;drift(e,dt,0.2);return true;}return false;}
function separate(){const A=MG.S.all;for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j];if(a.wall||b.wall||a.isGK||b.isGK||a.down>0||b.down>0||a.slide>0||b.slide>0)continue;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0.01&&d<0.7){const p=(0.7-d)/2;a.x-=dx/d*p;a.y-=dy/d*p;b.x+=dx/d*p;b.y+=dy/d*p;}}}
function attach(dt){const S=MG.S,b=S.ball,o=b.owner;if(!o)return;const sp=Math.hypot(o.vx,o.vy);
  const ahead=0.42+Math.min(0.45,sp*0.05)+(o.isC&&S.sprint?0.35:0),jig=Math.sin(o.ph*0.5)*0.1*Math.min(1,sp/4);
  const tx=o.x+o.fx*(ahead+jig),ty=o.y+o.fy*(ahead+jig);const k=Math.min(1,dt*18);
  b.px=b.x;b.py=b.y;b.pz=b.z;b.x+=(tx-b.x)*k;b.y+=(ty-b.y)*k;b.z=0;b.vz=0;b.vx=o.vx;b.vy=o.vy;b.rot+=sp*dt/0.11;}
function ballStep(dt){const S=MG.S,b=S.ball;
  if(b.held){b.px=b.x;b.py=b.y;b.x=b.held.x;b.y=b.held.y+0.15;b.z=1.05;b.vx=b.vy=b.vz=0;return;}
  if(b.owner){attach(dt);return;}
  b.px=b.x;b.py=b.y;b.pz=b.z;const sp=Math.hypot(b.vx,b.vy);
  if(b.om&&sp>2){const a=b.om*dt,c=Math.cos(a),s=Math.sin(a),vx=b.vx*c-b.vy*s;b.vy=b.vx*s+b.vy*c;b.vx=vx;b.om*=Math.pow(0.55,dt);}
  if(b.z>0.001||b.vz>0){b.vz-=GRAV*dt;b.z+=b.vz*dt;const f=1-0.06*dt;b.vx*=f;b.vy*=f;if(S.wind&&b.z>0.4)b.vx+=S.wind*dt*Math.min(1,b.z/3);
    if(b.z<=0){b.z=0;if(b.vz<-1.8){b.vz=-b.vz*0.48;b.vx*=0.82;b.vy*=0.82;b.om*=0.5;}else b.vz=0;}}
  else if(sp>0){const wf=S.wx==='yagmur'?0.72:S.wx==='kar'?1.35:1,ns=Math.max(0,sp-(sp*0.32+2.0)*wf*dt);b.vx*=ns/sp;b.vy*=ns/sp;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=Math.hypot(b.vx,b.vy)*dt/0.11;
  if(S.inNet){if(b.y<-1.9){b.y=-1.9;b.vy=Math.abs(b.vy)*0.12;b.vx*=0.4;}if(b.z>2.15){b.z=2.15;b.vz=-Math.abs(b.vz)*0.3;}
    if(b.x<GL+0.15){b.x=GL+0.15;b.vx=Math.abs(b.vx)*0.3;}if(b.x>GR-0.15){b.x=GR-0.15;b.vx=-Math.abs(b.vx)*0.3;}}}
function simDrift(ang,v,om,d){let vx=Math.cos(ang)*v,vy=Math.sin(ang)*v,px=0,py=0,o=om;const ux=Math.cos(ang),uy=Math.sin(ang),dt=1/120;
  for(let i=0;i<600;i++){const a=o*dt,c=Math.cos(a),s=Math.sin(a),n=vx*c-vy*s;vy=vx*s+vy*c;vx=n;o*=Math.pow(0.55,dt);px+=vx*dt;py+=vy*dt;if(px*ux+py*uy>=d)break;}
  return Math.atan2(-px*uy+py*ux,d);}
function aimCurve(ang,v,om,d){let a=ang;for(let i=0;i<3;i++)a=ang-simDrift(a,v,om,d);return a;}
function kick(by,tx,ty,tz,v,om,sdA,sdZ,kind){const S=MG.S,b=S.ball;b.owner=null;b.held=null;b.hdr=false;b.last=by;b.lastT=S.t;b.kind=kind;b.om=om||0;b.gkChecked=false;b.ign=null;b.target=null;S.ofs=null;
  const d=Math.max(0.5,Math.hypot(tx-b.x,ty-b.y));let ang=Math.atan2(ty-b.y,tx-b.x);
  if(b.om)ang=aimCurve(ang,v,b.om,d);
  ang+=gauss()*sdA;b.vx=Math.cos(ang)*v;b.vy=Math.sin(ang)*v;
  if(tz>0.05){const t=d/(v*0.975),zt=Math.max(0.05,tz+gauss()*sdZ);b.z=Math.max(b.z,0.11);b.vz=(zt-b.z+0.5*GRAV*t*t)/t;}else{b.vz=0;b.z=0;}
  b.px=b.x;b.py=b.y;b.pz=b.z;if(by){by.kickT=0.3;}partsGrass(b.x,b.y,4);}
function deflect(b,f){const a=Math.atan2(b.vy,b.vx)+Math.PI+rnd(-1.2,1.2),ns=Math.hypot(b.vx,b.vy)*f;b.vx=Math.cos(a)*ns;b.vy=Math.sin(a)*ns;b.vz=rnd(0.5,2.5);b.om=0;}

/* ---------- YAPAY ZEKÂ: ortak değerlendirmeler ----------
   Oyuncular her karar anında seçeneklerini puanlar (fayda temelli yapay zekâ):
   gol beklentisi (xG), boş alan, pas koridoru, ofsayt çizgisi, takım dağılımı.
   Rakibin seviyesi (iq) tepki süresini, karar kalitesini ve çizgi disiplinini belirler. */
function xg(x,y,blockers){const dy=Math.max(0.3,y),d=Math.hypot(x-34,dy),ang=Math.abs(Math.atan2(GR-x,dy)-Math.atan2(GL-x,dy));
  let v=1/(1+Math.exp(-(-1.6+3.2*ang-0.085*d)));
  if(blockers)for(const b of blockers){if(b.y>=y-0.3||b.y<0.2)continue;const t=(y-b.y)/dy,xl=x+(GL-x)*t,xr=x+(GR-x)*t;if(b.x>xl-0.5&&b.x<xr+0.5)v*=b.isGK?0.85:0.6;}
  return v;}
function minDist(p,list){let m=99;for(const e of list){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<m)m=d;}return m;}
function laneClear(a,b,foes){let m=99;const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1;for(const e of foes){const u=((e.x-a.x)*dx+(e.y-a.y)*dy)/L2;if(u<0.05||u>1.05)continue;const q=Math.hypot(e.x-(a.x+dx*u),e.y-(a.y+dy*u));if(q<m)m=q;}return m;}
const actOpps=()=>MG.S.opps.filter(d=>!d.wall&&d.role!=='idle');
const actMates=()=>MG.S.mates.filter(t=>t.role!=='idle');
const usField=()=>[MG.S.hero,...actMates()];
function defLineNow(){let m=99;for(const d of actOpps())if(d.y<m)m=d.y;return m;}
const spdOpp=()=>4.9+MG.S.C.opp.str*0.03;
function predictPath(){const S=MG.S,b=S.ball;if(S.pathAt===S.t&&S.path)return S.path;let x=b.x,y=b.y,vx=b.vx,vy=b.vy,z=b.z,vz=b.vz,o=b.om;const out=[],dt=0.05;
  for(let i=1;i<=40;i++){const sp=Math.hypot(vx,vy);if(o&&sp>2){const a=o*dt,cs=Math.cos(a),sn=Math.sin(a),n=vx*cs-vy*sn;vy=vx*sn+vy*cs;vx=n;o*=Math.pow(0.55,dt);}
    if(z>0.01||vz>0){vz-=GRAV*dt;z+=vz*dt;if(z<0){z=0;vz=Math.abs(vz)>1.8?-vz*0.48:0;}}else if(sp>0){const ns=Math.max(0,sp-(sp*0.32+2)*dt);vx*=ns/sp;vy*=ns/sp;}
    x+=vx*dt;y+=vy*dt;out.push({x,y,z,t:i*dt});}
  S.path=out;S.pathAt=S.t;return out;}
function interceptPath(path,e,spd,react){for(const p of path){if(p.z>1.9)continue;const d=Math.hypot(p.x-e.x,p.y-e.y)-0.7;if(d/spd+react<=p.t)return p;}const L=path[path.length-1];return L&&L.z<1.9?L:null;}

/* Rakip savunma beyni: pres, kademe, tehlikeye göre markaj, savunma çizgisi, pas arası */
function brainDefend(){const S=MG.S,b=S.ball,iq=S.iqOpp,D=actOpps();if(!D.length)return;const o=b.owner,spd=spdOpp();
  for(const d of D)d.job=null;
  if(!o&&b.kind!=='shot'){const path=predictPath();let best=null,bt=9;
    for(const d of D){if(d.stag>0||d.down>0)continue;const pl=interceptPath(path,d,spd,0.42-iq*0.2);if(pl&&pl.t<bt){bt=pl.t;best={d,pl};}}
    if(best)best.d.job={k:'int',x:best.pl.x,y:best.pl.y};}
  const car=o&&o.side==='us'?o:null;S.presser=null;
  if(car){let p1=null,t1=99;for(const d of D){if(d.job||d.stag>0||d.down>0)continue;const gs=goalSide(d,car),t=Math.hypot(d.x-car.x,d.y-car.y)*(gs>0?(d.role==='chaser'?0.6:0.85):2.6);if(t<t1){t1=t;p1=d;}}
    if(p1){p1.job={k:'press'};S.presser=p1;}
    if(iq>0.42){let p2=null,t2=99;for(const d of D){if(d.job||d.stag>0||d.down>0)continue;const t=Math.hypot(d.x-car.x,d.y-car.y)+(goalSide(d,car)>0?0:5);if(t<t2){t2=t;p2=d;}}
      const danger=car.y<27&&Math.abs(car.x-34)<22,beaten=p1&&(p1.stag>0||goalSide(p1,car)<0.2);
      if(p2&&t2<(danger?12:9))p2.job={k:danger||beaten?'press2':'cover'};}}
  const pressed=car&&S.presser&&dist(S.presser,car)<2.2;
  let line=clamp(b.y-(pressed?9:12.5),5.5,22);if(!o&&b.vy>4)line+=2.5*iq;
  S.lineY+=clamp(line-S.lineY,-1.6,1.2+iq);
  const threats=usField().filter(t=>t!==car).map(t=>({t,dg:xg(t.x,t.y)*3+(t.y<S.lineY+1?1:0)+Math.max(0,1-dist(t,b)/25)})).sort((p,q)=>q.dg-p.dg);
  for(const th of threats){let m=null,md=99;for(const d of D){if(d.job)continue;const q=dist(d,th.t);if(q<md){md=q;m=d;}}if(m&&md<20)m.job={k:'mark',t:th.t};}
  for(const d of D)if(!d.job)d.job={k:'zone'};
  S.defLine=defLineNow();}
function oppAtkAI(d,dt){const S=MG.S,b=S.ball,iq=S.iqOpp;
  if(d.wall||d.role==='idle'){drift(d,dt);return;}
  if(d.slide>0&&!d.slideHit)oppSlideContact(d);if(S.phase!=='play')return;
  if(busy(d,dt))return;if(d.cd>0)d.cd-=dt;
  const spd=spdOpp()*(S.live<0.55?0.35:1),j=d.job||{k:'zone'},o=b.owner;
  if(j.k==='int'&&!o){steer(d,j.x,j.y,spd,dt);return;}
  if((j.k==='press'||j.k==='press2')&&o&&o.side==='us'){
    const gx=34-o.x,gy=-o.y,gl=Math.hypot(gx,gy)||1,ux=gx/gl,uy=gy/gl,gs=goalSide(d,o),dd=dist(d,o),osp=Math.hypot(o.vx,o.vy);
    const lead=0.22-iq*0.12+(j.k==='press2'?0.15:0),px=o.x+o.vx*lead,py=o.y+o.vy*lead,inX=(34-o.x)/Math.max(5,Math.abs(34-o.x));
    let tx,ty,sp;
    if(gs<0.15&&dd>0.9){tx=px+ux*2.2;ty=py+uy*2.2;sp=spd*(0.98+iq*0.24);}
    else if(j.k==='press2'){tx=px+ux*2.0+inX*1.1;ty=py+uy*2.0;sp=spd*0.95;}
    else{const jd=1.1-iq*0.25;tx=px+ux*jd+inX*0.35*iq;ty=py+uy*jd;sp=spd*(d.role==='chaser'?1.03:0.97);if(dd<2.6)sp=Math.min(sp,osp+1.4+iq*0.8);}
    steer(d,tx,Math.max(0.8,ty),sp,dt);
    if(dd<2.4&&gs>0)d.jt=(d.jt||0)+dt;else d.jt=Math.max(0,(d.jt||0)-dt*2);
    const db=dist(d,b);
    if(d.cd<=0&&db>1.0&&db<2.5&&osp>4.6&&gs<0.8&&d.y<o.y+3&&Math.random()<Math.max(0,iq-0.3)*1.3*dt*6){const t=0.2,qx=b.x+o.vx*t,qy=b.y+o.vy*t,dx=qx-d.x,dy=qy-d.y,dl=Math.hypot(dx,dy)||1,v=8.2+iq;
      d.vx=dx/dl*v;d.vy=dy/dl*v;d.fx=dx/dl;d.fy=dy/dl;d.slide=0.45;d.cd=1.3;d.slideHit=false;partsGrass(d.x,d.y,5);return;}
    if(db<1.12&&d.cd<=0){const gap=dist(b,o),exposed=gap>0.72||db<dd-0.25||osp<1||(o.isC&&S.sprint);
      const danger=o.y<18&&Math.abs(o.x-34)<16,commit=exposed?0.6+iq*0.35:j.k==='press2'?0.5:(d.jt>1.25-iq*0.6||danger)?0.75:0.18+(1-iq)*0.35;
      if(Math.random()<commit)tackleOn(d,o,exposed);else d.cd=0.22;}
    return;}
  if(j.k==='cover'&&o){const gx=34-o.x,gy=-o.y,gl=Math.hypot(gx,gy)||1;steer(d,o.x+gx/gl*4+(34-o.x)*0.08,Math.max(4.5,o.y+gy/gl*4),spd*0.9,dt);return;}
  if(j.k==='mark'&&j.t){const m=j.t,gx=34-m.x,gy=-m.y,gl=Math.hypot(gx,gy)||1,tight=dist(m,b)<14?1.1:1.9;let tx=m.x+gx/gl*tight,ty=m.y+gy/gl*tight;tx+=(b.x-tx)*0.18;
    if(m.y>S.lineY-0.3)ty=Math.max(ty,S.lineY-0.3*(1-iq));
    steer(d,tx,Math.max(4.5,ty),spd*0.9,dt);return;}
  if(!o&&dist(d,b)<4&&b.z<1.5){steer(d,b.x,b.y,spd,dt);return;}
  steer(d,d.hx+(b.x-d.hx)*0.4,Math.max(4.5,S.lineY),spd*0.7,dt);}
function oppSlideContact(d){const S=MG.S,C=S.C,b=S.ball,o=b.owner;if(!o||o.side!=='us'||dist(d,b)>0.95||b.z>0.6)return;d.slideHit=true;
  const behind=goalSide(d,o)<-0.3,skill=o.isC?C.a.dri:C.us.str*0.8,r=Math.random(),pf=behind?0.4:0.12;
  if(r<pf){const inBox=b.y<16.5&&Math.abs(b.x-34)<20.16,hurt=o.isC&&Math.random()<(0.1+(behind?0.08:0))*proneF();o.down=hurt?3:0.6;vib(50);return endChance(inBox?'penWon':'fouled',{fkY:b.y,injured:hurt,injKind:'darbe'});}
  if(r<pf+clamp(0.45+S.iqOpp*0.2-(skill-C.opp.str)*0.004,0.2,0.8)){b.owner=null;b.vx=d.vx*0.55+rnd(-1.5,1.5);b.vy=d.vy*0.55+rnd(-1,1);b.last=d;b.lastT=S.t;b.kind='loose';o.stag=Math.max(o.stag,0.4);partsGrass(b.x,b.y,10);vib(40);mgFlash('KAYARAK MÜDAHALE','bad',600);}}
function tackleOn(d,o,exposed){const S=MG.S,C=S.C,b=S.ball,iq=S.iqOpp;d.cd=0.55;d.kickT=0.3;
  const sprint=o.isC&&S.sprint,still=Math.hypot(o.vx,o.vy)<1.2,skill=o.isC?C.a.dri:C.us.str*0.8;
  let p=0.17+iq*0.26+C.opp.str*0.0042-skill*0.0042+(exposed?0.12+iq*0.08:0)+(sprint?0.05:0)+(d.read?0.25:0)+(still?0.1:0)+(o.isC&&o.dash>0?-0.3:0)+(o.isC&&C.hurt?0.06:0)+(o.isC&&S.cond<30?0.06:0);d.read=false;p=clamp(p,0.08,0.86);
  const inBox0=b.y<16.5&&Math.abs(b.x-34)<20.16,pf=(0.05+(1-iq)*0.05)*(inBox0?0.45:1),r=Math.random();
  if(r<pf){const inBox=b.y<16.5&&Math.abs(b.x-34)<20.16;o.stag=0.7;d.stag=0.6;vib(40);const hurt=o.isC&&Math.random()<(0.12+(1-S.iqOpp)*0.06)*proneF();if(hurt)o.down=3;return endChance(inBox?'penWon':'fouled',{fkY:b.y,injured:hurt,injKind:'darbe'});}
  if(r<pf+p){b.owner=d;partsGrass(b.x,b.y,8);vib(40);if(o.isC)o.stag=Math.max(o.stag,0.3);return lostBall(d);}
  d.stag=0.28+(1-iq)*0.55;if(o.isC)o.stag=Math.max(o.stag,0.1*iq);}

/* Takım arkadaşı beyni: boş alan arama, pas koridoru, ofsayt bilinci, zamanlı derin koşu */
function brainSupport(){const S=MG.S,b=S.ball,ce=S.hero,iq=S.iqUs,foes=[...actOpps(),S.gk],car=b.owner,M=actMates(),line=defLineNow();
  for(const t of M){if(car===t)continue;if(b.target===t&&!car)continue;if((t.runT||0)>S.t)continue;
    if(car===ce&&t.role!=='support'&&ce.fy<-0.4&&minDist(ce,actOpps())>2.2&&S.t>(t.nextRun||0)&&t.y<line+3&&Math.random()<0.3+iq*0.4){
      t.runT=S.t+1.5;t.nextRun=S.t+3.5;t.tx=clamp(t.x+(34-t.x)*0.35,8,60);t.ty=Math.max(4,line-7);t.tsp=7;continue;}
    let best=null,bs=-1e9;const from=car||b;
    for(const r of [0,2.5,5])for(let k=0;k<(r?8:1);k++){const a=k*Math.PI/4,px=clamp(t.x+Math.cos(a)*r,2,66),py=clamp(t.y+Math.sin(a)*r,3,64),p={x:px,y:py};
      let sc=Math.min(6,minDist(p,foes))*0.55;const lane=laneClear(from,p,foes);if(lane<1.4)sc-=2.2*(1.4-lane);
      sc+=xg(px,py)*(t.role==='support'?2:6);if(py<line-0.3)sc-=3.5;
      for(const o2 of [ce,...M]){if(o2===t)continue;const q=Math.hypot(o2.x-px,o2.y-py);if(q<7)sc-=(7-q)*0.35;}
      const ax=t.role==='support'?ce.x+t.ox:t.rx,ay=t.role==='support'?ce.y+t.oy:Math.max(t.ry,line+0.6);sc-=Math.hypot(ax-px,ay-py)*0.12;
      sc+=(from.y-py)*0.03+gauss()*(0.6-iq*0.4);if(sc>bs){bs=sc;best=p;}}
    t.tx=best.x;t.ty=best.y;t.tsp=4+iq*1.6;}}
function mateAtkAI(t,dt){const S=MG.S,b=S.ball;
  if(t.role==='idle'){drift(t,dt);return;}if(busy(t,dt))return;
  if(b.owner===t)return mateWithBall(t,dt);
  if(!b.owner&&!b.held&&b.kind!=='shot'&&(b.target===t||(dist(t,b)<5&&b.z<2))){const sp=5.2+(t.q||S.C.us.str)*0.028;const pl=interceptPath(predictPath(),t,sp,0)||b;steer(t,pl.x,pl.y,sp,dt);return;}
  steer(t,t.tx,t.ty,(t.runT||0)>S.t?7:t.tsp,dt);}
function mateWithBall(t,dt){const S=MG.S,ce=S.hero,O=actOpps(),foes=[...O,S.gk],iq=iqOf(t.q||S.C.us.str);
  t.hold-=dt;t.think-=dt;
  const ahead={x:t.x+(34-t.x)*0.15,y:t.y-3};steer(t,ahead.x,ahead.y,minDist(ahead,O)>2.5?3.8+iq:1.5,dt);
  if(t.hold>0||t.think>0)return;t.think=0.16+(1-iq)*0.14;
  const pressed=minDist(t,O)<1.6,line=defLineNow(),U={};
  U.shoot=xg(t.x,t.y,foes)*(pressed?0.75:1)*(0.85+iq*0.4);
  const lead={x:ce.x+ce.vx*0.6,y:ce.y+ce.vy*0.6},cOn=ce.y>=Math.min(line,t.y)-0.4||Math.random()>iq;
  U.hero=cOn&&laneSlack(t,lead,O,clamp(8+dist(t,lead)*0.7,10,22),false)>0.1?xg(lead.x,lead.y,foes)*1.05+0.015:-1;
  let other=null;U.other=-1;
  for(const m of actMates()){if(m===t||laneSlack(t,m,O,clamp(8+dist(t,m)*0.7,10,22),false)<0.1)continue;if(m.y<Math.min(line,t.y)-0.4&&Math.random()<iq)continue;const v=xg(m.x,m.y,foes)*0.95;if(v>U.other){U.other=v;other=m;}}
  U.keep=pressed||t.hold<-0.9?-1:0.03+(t.y>20?0.02:0);
  for(const k in U)if(U[k]>0)U[k]*=Math.max(0.2,1+gauss()*(0.45-iq*0.35));
  let best='keep';for(const k in U)if(U[k]>U[best])best=k;
  if(best==='shoot')tmShoot(t);else if(best==='hero')tmGive(t);else if(best==='other')tmPassTo(t,other);}
function tmShoot(t){const S=MG.S,q=t.q||S.C.us.str;kick(t,34+(S.gk.x<34?1:-1)*rnd(1.8,3.2),0,rnd(0.25,1.7),rnd(18,24)*(0.85+q*0.0035),0,0.05-q*0.0003,0.35,'shot');}
function tmPassTo(t,m){const S=MG.S,b=S.ball,d=dist(t,m),loft=false,v=loft?clamp(12+d*0.3,15,22):clamp(8+d*0.7,10,22),tt=d/(v*0.8),line=defLineNow();
  kick(t,m.x+m.vx*tt,m.y+m.vy*tt,loft?0.35:0,v,0,0.035-(t.q||S.C.us.str)*0.00015,0,'pass');b.target=m;S.ofs=m.y<Math.min(line,b.y)-0.4?m:null;}
function tmGive(t){const S=MG.S,ce=S.hero,b=S.ball,d=dist(ce,b),loft=false,v=loft?clamp(12+d*0.3,15,22):clamp(8+d*0.7,10,22),tt=d/(v*0.8);
  const tx=ce.x+ce.vx*tt+ce.fx*1.2,ty=ce.y+ce.vy*tt+ce.fy*1.2,line=defLineNow();
  kick(t,tx,ty,loft?0.35:0,v,0,0.03,loft?0.25:0,'pass');b.target=ce;S.ofs=ce.y<Math.min(line,b.y)-0.4?ce:null;}

/* Rakip hücum beyni (savunma anı): şut / pas / sürme kararı, koşucunun boş alan araması */
function brainAttack(){const S=MG.S,b=S.ball,ce=S.hero,iq=S.iqOpp,us=[ce,...actMates(),S.gk];
  const car=b.owner&&b.owner.side==='opp'?b.owner:null,runs=S.opps.filter(o=>o!==car&&o.role!=='idle'&&!o.wall);
  const ourLine=Math.min(...[ce,...actMates()].map(e=>e.y));
  const covers=S.mates.filter(t=>t.role==='cover'),free=runs.slice();for(const t of covers){let m=null,md=99;for(const r of free){const q=dist(t,r);if(q<md){md=q;m=r;}}t.mark=m;if(m)free.splice(free.indexOf(m),1);}
  S.engager=null;if(car&&dist(ce,car)>3.5){let m=null,md=99;for(const t of covers){const q=dist(t,car);if(q<md){md=q;m=t;}}S.engager=m;}
  for(const run of runs){if(b.target===run&&!b.owner)continue;let best=null,bs=-1e9;
    for(const r of [0,3,6])for(let k=0;k<(r?8:1);k++){const a=k*Math.PI/4,px=clamp(run.x+Math.cos(a)*r,3,65),py=clamp(run.y+Math.sin(a)*r,3,60),p={x:px,y:py};
      let sc=Math.min(6,minDist(p,us))*0.5+xg(px,py)*5-(py<ourLine-0.3?3.5:0);const lc=laneClear(car||b,p,us);if(lc<1.4)sc-=2*(1.4-lc);
      if(car){const q=dist(car,p);if(q<7)sc-=(7-q)*0.3;}for(const r2 of runs){if(r2===run)continue;const q=Math.hypot(r2.tx-px,r2.ty-py);if(q<6)sc-=(6-q)*0.3;}sc+=gauss()*(0.6-iq*0.4);if(sc>bs){bs=sc;best=p;}}
    run.tx=best.x;run.ty=best.y;}
  if(car){const myXG=xg(car.x,car.y,us);let passU=-1;car.passTo=null;
    for(const run of runs){const lc=laneClear(car,run,us),u=lc>1.4&&run.y>=ourLine-0.3?xg(run.x,run.y,us)*1.05:-1;if(u>passU){passU=u;car.passTo=run;}}
    const pressed=dist(ce,car)<2;let bestA=-Math.PI/2,bsa=-1e9;const base=Math.atan2(6-car.y,34-car.x);
    for(let k=-4;k<=4;k++){const a=base+k*0.32,px=car.x+Math.cos(a)*3,py=car.y+Math.sin(a)*3;const sc=(car.y-py)*0.6+Math.min(4,minDist({x:px,y:py},us))*0.9-Math.abs(px-34)*0.04;if(sc>bsa){bsa=sc;bestA=a;}}
    car.da=bestA;const shootT=0.1+(1-iq)*0.06-(pressed?0.03:0);
    car.plan=(myXG>shootT||car.y<9)?'shoot':(passU>myXG*1.15&&passU>0.06&&(pressed||Math.random()<0.25+iq*0.3))?'pass':'drive';}}
function attAI(a,dt){const S=MG.S,C=S.C,b=S.ball,ce=S.hero;
  if(a.role==='idle'){drift(a,dt);return;}if(busy(a,dt))return;if(a.cd>0)a.cd-=dt;
  const spd=(5.0+C.opp.str*0.026)*(S.live<0.6?0.45:1);
  if(b.owner===a){
    if(a.plan==='shoot'){a.plan=null;return oppShoot(a);}
    if(a.plan==='pass'){a.plan=null;const r=a.passTo||S.opps.find(o=>o!==a&&o.role!=='idle');if(r)return oppPass(a,r);}
    const da=a.da??-Math.PI/2;steer(a,a.x+Math.cos(da)*3,a.y+Math.sin(da)*3,spd*0.9,dt);
    const dx=a.x-ce.x,dd=Math.hypot(dx,a.y-ce.y);
    if(dd<1.45&&a.cd<=0&&ce.slide<=0&&ce.down<=0&&ce.stag<=0&&ce.y<a.y+0.5){a.cd=0.8;const p=clamp(0.28+C.opp.str*0.0045-C.a.def*0.0045,0.08,0.62);if(Math.random()<p){ce.stag=0.6;a.vx+=(dx>=0?1:-1)*3.5;mgFlash('ÇALIMI YEDİN','bad',650);}}
    if(dist(ce,b)<0.62&&ce.stag<=0&&ce.down<=0&&S.t>S.pokeT&&goalSide(ce,a)>-0.25){S.pokeT=S.t+0.35;if(Math.random()<0.16+C.a.def*0.003){b.owner=ce;return endChance('tackle');}}
    return;}
  if(!b.owner&&!b.held&&b.kind!=='shot'&&(b.target===a||dist(a,b)<6)){const pl=interceptPath(predictPath(),a,spd,0)||b;steer(a,pl.x,pl.y,spd,dt);return;}
  steer(a,a.tx,a.ty,spd*0.85,dt);}
function oppShoot(a){const S=MG.S,C=S.C;kick(a,34+(S.gk.x<34?1:-1)*rnd(1.5,3.3),0,rnd(0.2,1.9),rnd(18,24)+C.opp.str*0.04,0,0.024+(100-C.opp.str)*0.0007,0.4,'shot');}
function oppPass(a,r){const S=MG.S,b=S.ball,d=dist(a,r),v=clamp(9+d*0.7,11,21),tt=d/(v*0.8);
  const ourLine=Math.min(...[S.hero,...actMates()].map(e=>e.y));
  kick(a,r.x+r.vx*tt,r.y+r.vy*tt,0,v,0,0.04,0,'pass');b.target=r;S.ofs=r.y<Math.min(ourLine,b.y)-0.4?r:null;}
function coverAI(t,dt){const S=MG.S,C=S.C,b=S.ball,ce=S.hero,iq=S.iqUs;if(busy(t,dt))return;
  const spd=4.6+C.us.str*0.022,car=b.owner&&b.owner.side==='opp'?b.owner:null,run=t.mark&&t.mark!==car&&t.mark.role!=='idle'?t.mark:null;
  if(!b.owner&&b.kind==='pass'){const pl=interceptPath(predictPath(),t,spd,0.3-iq*0.2);if(pl){steer(t,pl.x,pl.y,spd,dt);return;}}
  if(car&&S.engager===t){steer(t,car.x+(34-car.x)*0.1,car.y-1.2,spd*0.95,dt);
    if(dist(t,b)<1.1&&S.t>(t.tkT||0)){t.tkT=S.t+0.7;if(Math.random()<clamp(0.12+(C.us.str-C.opp.str)*0.004,0.05,0.3))return endChance('defOk');}return;}
  let tx,ty;if(run){const gx=34-run.x,gy=-run.y,gl=Math.hypot(gx,gy)||1;tx=run.x+gx/gl*1.6;ty=run.y+gy/gl*1.6;tx+=(b.x-tx)*0.2;}else{tx=b.x+(34-b.x)*0.4;ty=b.y-6;}
  steer(t,tx,Math.max(3,ty),spd*0.9,dt);}

/* Kaleci: açı kapatma, derinlik, çıkış kararı, tepki süresiyle plonjon */
function gkAI(g,dt){const S=MG.S,b=S.ball,str=g.str;
  if(busy(g,dt))return;if(b.held===g){drift(g,dt);return;}
  const sp=Math.hypot(b.vx,b.vy),shotIn=!b.owner&&b.kind==='shot'&&b.vy<-4&&b.last&&b.last.side!==g.side&&b.y>g.y-0.3;
  if(shotIn||(g.dive&&!b.owner)){
    if(!g.dive){if(g.react==null)g.react=Math.max(0.07,0.3-str*0.0018+rnd(-0.03,0.05)-(S.type==='serbest'?0.06:0));g.react-=dt;
      if(g.react<=0){let px=null;for(const q of predictPath())if(q.y<=g.y){px=q.x;break;}if(px==null){const t=Math.max(0,(b.y-g.y)/Math.max(1,-b.vy));px=b.x+b.vx*t;}
        px+=gauss()*(0.15+(1-iqOf(str))*0.45);g.dive={tx:clamp(px,GL-0.7,GR+0.7),t:0,x0:g.x};}}
    if(g.dive){g.dive.t+=dt;const dsp=3+str*0.042,dx=g.dive.tx-g.x,st=Math.min(Math.abs(dx),dsp*dt);g.x+=Math.sign(dx)*st;g.vx=st>0?Math.sign(dx)*dsp:0;g.vy=0;g.diving=Math.abs(g.dive.tx-g.dive.x0)>0.9;g.ph+=dt*4;
      if(!shotIn&&g.dive.t>1.2){g.dive=null;g.diving=false;}}
    return;}
  g.react=null;g.dive=null;g.diving=false;
  const o=b.owner,dd=Math.hypot(b.x-34,b.y);
  if(o&&o.side!==g.side&&S.mode!=='set'&&dd<9+4*iqOf(str)&&b.y<16.5&&Math.abs(b.x-34)<16){
    steer(g,b.x,b.y,4.4+str*0.026,dt);
    if(dist(g,b)<1.0&&S.t>(g.claimT||0)){g.claimT=S.t+1.6;const skill=o.isC?S.C.a.dri:(o.side==='opp'?S.C.opp.str:S.C.us.str);
      const p=clamp(0.42+str*0.004-skill*0.0035+(o.isC&&o.dash>0?-0.25:0),0.12,0.8);
      if(Math.random()<p){b.owner=null;b.held=g;return endChance(S.mode==='def'?'gkSave':(o.isC?'saved':'lost'));}
      g.down=0.9;}
    return;}
  if(!o&&!b.held&&b.z<2.3&&dist(g,b)<1.15&&b.y<16.5&&(b.kind!=='shot'||sp<11)){b.held=g;
    const code=S.mode==='def'?'defOk':(b.last&&b.last.isC&&(b.kind==='shot'||b.kind==='loose'))?'saved':(b.kind==='shot'&&b.last&&b.last.side==='us'?'tmMiss':'lost');return endChance(code);}
  if(!o&&!b.held&&b.y<7&&Math.abs(b.x-34)<10&&sp<9&&b.kind!=='shot'){steer(g,b.x,b.y,5.5,dt);return;}
  const k=clamp(0.7+dd*0.065,0.7,3.6);steer(g,34+(b.x-34)/(dd||1)*k,Math.max(0.4,b.y/(dd||1)*k),4.2,dt);}

/* ---------- oyuncu kontrolü ---------- */
function moveMe(dt){const S=MG.S,C=S.C,ce=S.hero,b=S.ball;
  if(ce.slide>0){ce.slide-=dt;ce.x+=ce.vx*dt;ce.y+=ce.vy*dt;const k=Math.pow(0.25,dt);ce.vx*=k;ce.vy*=k;if((S.mode==='def'||S.mode==='cp')&&!S.slideHit)slideContact();if(ce.slide<=0)ce.down=0.7;return;}
  if(ce.down>0){ce.down-=dt;drift(ce,dt,0.01);return;}
  if(ce.dash>0){ce.dash-=dt;ce.x+=ce.vx*dt;ce.y+=ce.vy*dt;faceAnim(ce,dt);return;}
  if(S.sprint)S.stam=Math.max(0,S.stam-dt/(2.4+C.a.fiz*0.022));else S.stam=Math.min(stamCap(S.cond),S.stam+dt/4.2);
  if(S.sprint&&S.cond<22&&Math.random()<0.02*dt*proneF()){ce.down=3;return endChance('injury',{injured:true,injKind:'kas'});}
  let max=(5.0+C.a.hiz*0.036)*(C.hurt?0.85:1)*condSpeed(S.cond)*(b.owner===ce?0.88:1)*(S.sprint?(b.owner===ce?1.2:1.32):1)*(S.charge>=0&&b.owner===ce?0.75:1);
  if(ce.stag>0){ce.stag-=dt;max*=0.2;}
  const k=1-Math.pow(Math.pow(b.owner===ce?(S.sprint?0.03:0.005):0.0009,S.wx==='yagmur'||S.wx==='kar'?0.78:1),dt);const [pjx,pjy]=pressDir(max,dt);ce.vx+=(pjx*max-ce.vx)*k;ce.vy+=(pjy*max-ce.vy)*k;
  ce.x=clamp(ce.x+ce.vx*dt,0.3,67.7);ce.y=clamp(ce.y+ce.vy*dt,0.4,66);faceAnim(ce,dt);}
function procInput(){const S=MG.S;while(IN.q.length&&S.phase==='play'){const ev=IN.q.shift();if(ev.type==='d')onDown(ev.b);else onUp(ev.b,ev.hold);}}
function onDown(k){const S=MG.S;S.dn[k]=true;if(k==='c')S.cDown=S.t;
  if(S.mode==='air'){if((k==='a'||k==='b')&&S.ck!=='take'&&S.hero.jumpT==null&&S.hero.down<=0)S.hero.jumpT=S.t;return;}
  if(S.mode==='def'||S.mode==='cp'){if(k==='a')slideTackle();else if(k==='b')standTackle();return;}
  if(S.mode==='set'){if(k==='a'&&!S.kicked)S.charge=0;return;}
  if(k==='a')S.charge=0;}
function onUp(k,hold){const S=MG.S;if(!S.dn[k])return;S.dn[k]=false;
  if(S.mode==='def'||S.mode==='cp'||S.mode==='air')return;
  if(S.mode==='set'){if(k==='a'&&S.charge>=0&&!S.kicked)setKick();return;}
  const b=S.ball,ce=S.hero,o=b.owner;
  if(k==='a'){const p=S.charge;S.charge=-1;if(p<0)return;
    if(o===ce)heroShoot(p,false);else if(!o&&!b.held&&dist(ce,b)<1.6&&b.z<1.7&&ce.stag<=0&&ce.down<=0)heroShoot(p,true);}
  else if(k==='b'){if(o===ce)heroPass(hold>=0.25);}
  else if(k==='c'&&hold<0.2&&o===ce)skillMove();}
function heroShoot(p,volley){const S=MG.S,C=S.C,ce=S.hero;p=clamp(p,0.05,1);
  const ax=Math.abs(IN.jx)>0.25?clamp(IN.jx,-1,1):(S.gk.x<34?0.5:-0.5);
  const press=actOpps().some(d=>d.stag<=0&&dist(d,ce)<1.7);
  const sdA=(0.011+(100-C.a.sut)*0.0006)*(1+p*0.45)*(press?1.35:1)*(volley?1.45:1)*(S.sprint?1.15:1)*(S.cond<40?1+(40-S.cond)/60:1)*(C.morale<35?1.1:1)*(C.up.krampon?1-0.035*(1+(C.up.kt||1)):1)*(C.hurt?1.2:1);S.cond=Math.max(0,S.cond-0.8);
  const g=S.gk,dG=Math.hypot(34-ce.x,ce.y),gOut=g.y>2.4&&Math.abs(g.x-ce.x)<5&&g.y<ce.y-1.5;
  if(!volley&&p<0.3&&gOut&&dG<28&&S.mode==='atk'){const v=8.5+dG*0.32+C.a.sut*0.02;kick(ce,34+ax*2.6,0,1.55,v,0,sdA*0.9,0.28+(100-C.a.sut)/300,'shot');S.lastShot='lob';mgFlash('AŞIRTMA!','',600);vib(15);return;}
  const fin=!volley&&!S.sprint&&p>=0.3&&p<=0.68&&Math.abs(IN.jx)>0.4,dr=S.sprint&&!volley;
  const om=fin?-Math.sign(ax)*(1.1+C.a.sut*0.008):0,v=(12.5+p*(11+C.a.sut*0.13))*(volley?0.9:1)*(fin?0.9:dr?1.08:1);
  kick(ce,34+ax*(fin?3.0:3.3),0,fin?0.35+p*1.2:0.22+p*1.85,v,om,sdA*(fin?0.75:1),(0.22+(100-C.a.sut)/220+p*p*p*0.55)*(fin?0.8:1),'shot');S.lastShot=fin?'fin':dr?'drv':'std';
  if(fin)mgFlash('PLASE','',450);else if(dr&&p>0.6)mgFlash('SERT ŞUT','',450);MG.shake=1.5+p*2*(dr?1.3:1);vib(25);}
/* Pas yapay zekâsı: her aday için topun yola varış süresiyle savunmacının yetişme süresini karşılaştırır. */
function laneSlack(a,t,foes,v,lofted){let m=9;const dx=t.x-a.x,dy=t.y-a.y,L=Math.hypot(dx,dy)||1,sp=spdOpp();
  for(const e of foes){const u=((e.x-a.x)*dx+(e.y-a.y)*dy)/(L*L);if(u<0.05||u>1.05)continue;if(lofted&&u>0.15&&u<0.85)continue;
    const q=Math.hypot(e.x-(a.x+dx*u),e.y-(a.y+dy*u)),tb=u*L/(v*0.85),td=Math.max(0,q-0.9)/sp+0.3;m=Math.min(m,td-tb);}return m;}
function passPick(){const S=MG.S,b=S.ball,ce=S.hero;let dx=IN.jx,dy=IN.jy,m=Math.hypot(dx,dy);if(m<0.3){dx=ce.fx;dy=ce.fy;m=Math.hypot(dx,dy)||1;}dx/=m;dy/=m;
  const foes=actOpps();let best=null,bs=-1e9;
  for(const t of actMates()){const rx=t.x-b.x,ry=t.y-b.y,d=Math.hypot(rx,ry);if(d<2.5||d>42)continue;const cs=(rx*dx+ry*dy)/d;if(cs<0.25)continue;
    const v=clamp(7.5+d*0.72,10,23)*(0.86+S.C.a.pas*0.0045),sl=laneSlack(b,t,foes,v,false);
    const sc=cs*8-d*0.08-(sl<0.15?(0.15-sl)*10:0);if(sc>bs){bs=sc;best=t;}}
  return best;}
function heroPass(through){const S=MG.S,C=S.C,b=S.ball,ce=S.hero,t=passPick(),press=actOpps().some(d=>d.stag<=0&&dist(d,ce)<1.8);let tx,ty,v,d;
  let loft=false;
  if(t){d=dist(t,b);loft=false;v=loft?clamp(12+d*0.3,15,22)*(0.9+C.a.pas*0.002):(clamp(7.5+d*0.72,10,23)+(through?2:0))*(0.86+C.a.pas*0.0045);const tt=d/(v*0.78);tx=t.x+t.vx*tt;ty=t.y+t.vy*tt;
    if(through){const gx=34-t.x,gy=6-t.y,gl=Math.hypot(gx,gy)||1;tx+=gx/gl*5;ty+=gy/gl*5;}}
  else{let dx=IN.jx,dy=IN.jy,m=Math.hypot(dx,dy);if(m<0.3){dx=ce.fx;dy=ce.fy;m=1;}tx=b.x+dx/m*12;ty=b.y+dy/m*12;d=12;v=15;}
  v*=0.85+0.15*Math.min(1,S.cond/50);
  const sdA=(0.006+(100-C.a.pas)*0.00045)*(1+d/28)*(press?1.3:1)*(C.up.krampon?1-0.025*(1+(C.up.kt||1)):1)*(C.hurt?1.15:1)*(S.cond<35?1.15:1);
  const line=defLineNow();kick(ce,tx,ty,through?0.1:loft?0.35:0,v,0,sdA*(loft?1.2:1),through||loft?0.25:0,'pass');
  if(t){b.target=t;S.ofs=t.y<Math.min(line,b.y)-0.4?t:null;}}
function skillMove(){const S=MG.S,C=S.C,ce=S.hero;if(S.t<S.skillCd)return;S.skillCd=S.t+1.3;
  let dx=IN.jx,dy=IN.jy,m=Math.hypot(dx,dy),nd=null,ndd=99;for(const d of actOpps()){const q=dist(d,ce);if(q<ndd){ndd=q;nd=d;}}
  if(m<0.3){if(nd){const s=ce.x<nd.x?-1:1;dx=s*0.8;dy=-0.6;}else{dx=ce.fx;dy=ce.fy;}m=Math.hypot(dx,dy)||1;}
  dx/=m;dy/=m;const v=9+C.a.dri*0.03;ce.vx=dx*v;ce.vy=dy*v;ce.fx=dx;ce.fy=dy;ce.dash=0.24;vib(15);
  if(nd&&ndd<2.6){const p=clamp(0.3+(1-S.iqOpp)*0.18+C.a.dri*0.006-C.opp.str*0.0035-(C.hurt?0.1:0)-(S.cond<30?0.08:0),0.14,0.86);
    if(Math.random()<p){nd.stag=0.4+(1-S.iqOpp)*0.3;nd.cd=0.8;mgFlash('ÇALIM!','ok',600);}else{nd.cd=0;nd.read=true;mgFlash('OKUNDU','bad',500);}}}
function standTackle(){const S=MG.S,C=S.C,ce=S.hero,b=S.ball;if(ce.down>0||ce.slide>0||ce.stag>0||S.t<S.tkCd)return;S.tkCd=S.t+0.6;ce.kickT=0.3;
  const a=b.owner,d=dist(ce,b),cp=S.mode==='cp';
  if(!a){if(d<1.4&&b.z<1.2&&!b.held){if(cp)return regain(ce);return endChance('intercept');}return;}
  if(d>1.65){ce.stag=0.25;return;}
  const behind=cp?((ce.x-a.x)*a.fx+(ce.y-a.y)*a.fy)<-0.4:ce.y>a.y+0.5,p=clamp(0.22+C.a.def*0.006-C.opp.str*0.003+(behind?-0.15:0.05)+(cp?0.1:0)+(S.pressing?0.05:0),0.1,0.84)*(S.cond<30?0.85:1);
  if(Math.random()<p){b.owner=null;vib(30);if(cp)return regain(ce);return endChance('tackle');}
  if(Math.random()<(behind?0.4:0.12))return defFoul(a);
  ce.stag=0.5;a.vx+=(a.x>=ce.x?1:-1)*2.5;mgFlash('BOŞA ÇIKTI','bad',500);}
function slideTackle(){const S=MG.S,C=S.C,ce=S.hero,b=S.ball;if(ce.down>0||ce.slide>0||S.t<S.tkCd)return;S.tkCd=S.t+0.6;
  let dx=IN.jx,dy=IN.jy,m=Math.hypot(dx,dy);if(m<0.3){dx=b.x-ce.x;dy=b.y-ce.y;m=Math.hypot(dx,dy)||1;}dx/=m;dy/=m;
  const v=(8.5+C.a.hiz*0.02)*condSpeed(S.cond);S.cond=Math.max(0,S.cond-1.5);ce.vx=dx*v;ce.vy=dy*v;ce.fx=dx;ce.fy=dy;ce.slide=0.5;S.slideHit=false;partsGrass(ce.x,ce.y,6);vib(20);}
function slideContact(){const S=MG.S,C=S.C,ce=S.hero,b=S.ball,a=b.owner;
  if(dist(ce,b)<0.9&&b.z<0.8&&!b.held){S.slideHit=true;if(Math.random()<clamp(0.5+C.a.def*0.004,0.5,0.9)){b.owner=null;b.vx=ce.vx*0.6;b.vy=ce.vy*0.6;partsGrass(b.x,b.y,10);vib(40);if(S.mode==='cp'){b.last=ce;b.lastT=S.t;b.kind='loose';mgFlash('TOPA KAYDI!','ok',500);return;}return endChance('tackle');}if(a&&Math.random()<0.4)return defFoul(a);mgFlash('KAÇIRDI','bad',500);return;}
  else if(a&&dist(ce,b)>1.1&&dist(ce,a)<0.7){S.slideHit=true;return defFoul(a);}}
function defFoul(a){const S=MG.S,ce=S.hero,behind=ce.y>a.y+0.4,r=Math.random();let card=null;
  if(S.mode==='cp'){a.stag=0.8;vib(50);return endChance('foul',{card:r<0.25?'Y':null});}
  if(behind&&a.y<25&&Math.abs(a.x-34)<12&&r<0.12)card='R';else if(r<(behind?0.5:0.2))card='Y';
  const inBox=a.y<16.5&&Math.abs(a.x-34)<20.16;a.stag=0.8;vib(50);
  return endChance(inBox?(Math.random()<0.76?'penConceded':'penSaved'):'foul',{card});}

/* ---------- Duran top ---------- */
function setParams(p){const S=MG.S,C=S.C,pen=S.type==='penalti';
  const v=pen?(15+p*(10+C.a.sut*0.12)):(14+p*(9+C.a.sut*0.12)),tz=S.aim.z+(p>0.82?(p-0.82)*4:0)-(p<0.3?(0.3-p)*1.5:0);
  return {v,tz:Math.max(0.1,tz),om:pen?0:S.spin*(0.45+C.a.sut*0.004)};}
function setKick(){const S=MG.S,C=S.C,p=clamp(S.charge,0.05,1),pen=S.type==='penalti',g=S.gk;S.charge=-1;S.kicked=true;S.kickAt=S.live;S.wallT=0;
  if(S.type==='korner'){S.hero.kickT=0.3;cornerKick(S.hero,S.aim.x,S.aim.y,p,S.spin,C.a.pas);S.mode='air';S.live=0;S.limit=7;vib(25);MG.padK=null;return;}
  const {v,tz,om}=setParams(p),sdA=((pen?0.006:0.014)+(100-C.a.sut)*(pen?0.00035:0.0006))*(1+p*0.4)*(C.morale<35?1.2:1)*(C.hurt?1.2:1);
  kick(S.hero,S.aim.x,0,tz,v,om,sdA,0.12+(100-C.a.sut)/400,'shot');MG.shake=2;vib(30);
  if(pen){const side=Math.random()<0.28?Math.sign(S.aim.x-34):wpick([[-1,42],[0,16],[1,42]]);g.dive={tx:34+side*2.7,t:0,x0:g.x};}}
function stepSet(dt){const S=MG.S,b=S.ball,g=S.gk;
  if(!S.kicked){S.live+=dt;
    if(S.type==='korner'){if(S.charge>=0&&IN.btn.a){S.charge=Math.min(Math.max(0.75,condPow(S.cond)),S.charge+dt/1.0);S.spin=clamp(S.spin+IN.jx*2.4*dt,-1,1);}
      else{S.aim.x=clamp(S.aim.x+IN.jx*7*dt,GL-9,GR+9);S.aim.y=clamp(S.aim.y+IN.jy*6*dt,2.5,15);}
      const ce=S.hero,dx=S.aim.x-ce.x,dy=S.aim.y-ce.y,dl=Math.hypot(dx,dy)||1;ce.fx=dx/dl;ce.fy=dy/dl;
      for(const e of S.all)if(e!==ce&&!e.isGK)airAI(e,dt);
      if(S.live>16&&S.charge<0){S.charge=0.66;setKick();}return;}
    if(S.charge>=0&&IN.btn.a){S.charge=Math.min(Math.max(0.75,condPow(S.cond)),S.charge+dt/0.9);if(S.type==='serbest')S.spin=clamp(S.spin+IN.jx*2.4*dt,-1,1);}
    else{S.aim.x=clamp(S.aim.x+IN.jx*3.4*dt,GL-1.8,GR+1.8);S.aim.z=clamp(S.aim.z-IN.jy*2.4*dt,0.1,3.2);}
    if(S.type==='penalti')g.x=34+Math.sin(S.t*1.9)*0.45;
    const ce=S.hero,dx=S.aim.x-ce.x,dy=-ce.y,dl=Math.hypot(dx,dy);ce.fx=dx/dl;ce.fy=dy/dl;
    if(S.live>16&&S.charge<0){S.charge=0.55;setKick();}
    return;}
  S.live+=dt;S.wallT+=dt;
  for(const e of S.opps)if(e.wall)e.z=S.wallT<0.6?0.5*Math.sin(Math.PI*S.wallT/0.6):0;
  for(const e of S.all)if(e!==g)drift(e,dt);
  gkAI(g,dt);if(S.phase!=='play')return;
  ballStep(dt);checkBall();
  if(S.phase==='play'&&S.live-S.kickAt>4.5)endChance(shotRes('saved'));}

/* ---------- Savunma yardımcıları ---------- */
function goalSide(d,o){const gx=34-o.x,gy=-o.y,gl=Math.hypot(gx,gy)||1;return ((d.x-o.x)*gx+(d.y-o.y)*gy)/gl;}
function lostBall(d){const S=MG.S;if(S.mode==='atk'&&!S.cpUsed&&!S.ck&&!S.gates&&S.type!=='drill'&&d&&d.side==='opp'&&!d.isGK)return startCP(d);return endChance('lost');}

/* ---------- Top kaybı sonrası karşı pres ---------- */
function startCP(d){const S=MG.S,b=S.ball;S.mode='cp';S.cpUsed=true;S.cpT=0;S.cpLim=2.4+(1-S.iqOpp)*1.0;S.cpY=b.y;b.owner=d;b.kind=null;b.target=null;S.charge=-1;
  const outs=actOpps().filter(e=>e!==d);let best=null,bs=-1e9;for(const e of outs){const s=e.y-d.y-Math.abs(e.x-d.x)*0.2+rnd(0,3);if(s>bs){bs=s;best=e;}}
  d.outlet=best;d.passAt=rnd(0.55,1.1)+(1-S.iqOpp)*0.5;
  mgFlash('TOPU GERİ KAZAN!','bad',900);MG.padK=null;}
function regain(by){const S=MG.S,b=S.ball;S.mode='atk';b.owner=by;b.kind=null;b.target=null;b.om=0;S.ofs=null;S.limit=Math.max(S.limit,S.live+6);S.bonus=(S.bonus||0)+(by.isC?0.25:0.1);
  for(const e of S.opps){e.outlet=null;if(dist(e,by)<2.2)e.stag=Math.max(e.stag,0.45);}if(!by.isC){by.hold=rnd(0.25,0.4);by.think=0;}
  mgFlash(by.isC?'GERİ KAZANDIN!':'TOP GERİ BİZDE','ok',800);MG.padK=null;vib(30);}
function stepCP(dt){const S=MG.S,b=S.ball,ce=S.hero;S.live+=dt;S.cpT+=dt;
  const car=b.owner&&b.owner.side==='opp'?b.owner:null;
  if(S.cpT>S.cpLim||b.y>S.cpY+20)return endChance('lost');
  moveMe(dt);if(S.phase!=='play')return;
  const spd=spdOpp();
  for(const d of S.opps){if(d.wall||d.role==='idle'){drift(d,dt);continue;}if(busy(d,dt))continue;if(d.cd>0)d.cd-=dt;
    if(d===car){const dx=d.x-ce.x,dy=d.y-ce.y,dc=Math.hypot(dx,dy)||1;let vx=dx/dc*0.7,vy=dy/dc*0.7+0.6;const m=Math.hypot(vx,vy)||1;
      steer(d,clamp(d.x+vx/m*3,2,66),d.y+vy/m*3,spd*0.82,dt);
      if(S.cpT>d.passAt&&d.outlet&&d.outlet.stag<=0){const r=d.outlet,dd=dist(d,r),v=clamp(9+dd*0.7,11,20),tt=dd/(v*0.8);kick(d,r.x+r.vx*tt,r.y+r.vy*tt,0,v,0,0.05,0,'pass');b.target=r;d.outlet=null;}
      continue;}
    if(!b.owner&&b.target===d){const pl=interceptPath(predictPath(),d,spd,0)||b;steer(d,pl.x,pl.y,spd,dt);continue;}
    steer(d,d.hx+(d.x-d.hx)*0.5,d.hy+4,spd*0.6,dt);}
  for(const t of S.mates){if(t.role==='idle'){drift(t,dt);continue;}if(busy(t,dt))continue;const tg=car||b,dd=dist(t,tg),sp=5+(t.q||S.C.us.str)*0.025;
    if(dd<9){steer(t,tg.x,tg.y,sp,dt);if(car&&dist(t,b)<1.0&&S.t>(t.tkT||0)){t.tkT=S.t+0.6;if(Math.random()<0.16+S.iqUs*0.12){b.owner=null;return regain(t);}}}
    else steer(t,t.x,t.y+0.5,sp*0.5,dt);}
  drift(S.gk,dt);
  separate();ballStep(dt);checkBallCP();}
function checkBallCP(){const S=MG.S,b=S.ball;if(b.owner||b.held||S.phase!=='play')return;
  if(b.x<-0.4||b.x>68.4||b.y<0)return endChance('lost');
  for(const e of S.all){if(e.isGK||e.down>0||e.wall||e.role==='idle')continue;if(b.last===e&&S.t-b.lastT<0.3)continue;
    if(dist(e,b)>(e.isC?1.0:0.95)||b.z>1.5)continue;
    if(e.side==='us')return regain(e);
    if(b.target===e)return endChance('lost');
    b.owner=e;b.kind=null;e.outlet=null;return;}}

/* ---------- Korner: orta, hava topu, kafa ---------- */
function ckParams(bx,by,tx,ty,p,spin){const err=p-0.68,dx=tx-bx,dy=ty-by,d=Math.hypot(dx,dy),k=1+err*0.6;return {ex:bx+dx*k,ey:by+dy*k,v:clamp(13+d*0.22,16,22)*(0.95+p*0.1),om:spin*1.1};}
function cornerKick(by,tx,ty,p,spin,skill){const S=MG.S,b=S.ball,P=ckParams(b.x,b.y,tx,ty,p,spin);
  kick(by,P.ex,P.ey,1.7,P.v,P.om,(0.02+(100-skill)*0.0005)*(1+Math.abs(p-0.68)*1.5),0.3,'cross');
  b.fromC=!!(by&&by.isC);S.drop=null;S.dropT=0;S.gkGo=null;S.kicked=true;}
function calcDrop(){const S=MG.S,path=predictPath();let prev=S.ball.z;for(const p of path){if(p.z<2.4&&p.z<prev)return p;prev=p.z;}return path[path.length-1]||null;}
function aiCorner(tk){const S=MG.S,def=S.ck==='def',side=def?'opp':'us';
  const cands=S.all.filter(e=>e.side===side&&!e.isGK&&(e.role==='box'||(e.isC&&!def)));
  const foes=S.all.filter(e=>e.side!==side&&!e.isGK&&e.role!=='idle');
  let best=null,bs=-1e9;for(const e of cands){const s=Math.min(3,minDist(e,foes))+rnd(0,1.4)+(e.isC?1.1:0)+(def&&e===S.myMan?0.9:0)-Math.abs(e.y-8)*0.08;if(s>bs){bs=s;best=e;}}
  const q=def?S.C.opp.str:(tk.q||S.C.us.str);S.target=best;tk.kickT=0.3;
  cornerKick(tk,clamp(best.x+best.vx*0.9,GL-8,GR+8),clamp(best.y+best.vy*0.9,2.5,14),0.68+gauss()*(0.04+(100-q)*0.0012),S.cs*rnd(0.2,0.8)*(Math.random()<.5?1:-1),q);
  S.live=0;S.limit=7;MG.padK=null;}
function airAI(e,dt){const S=MG.S,b=S.ball;if(e.role==='idle'||e.role==='taker'){drift(e,dt);return;}if(busy(e,dt))return;
  const atkSide=S.ck==='def'?'opp':'us',iq=e.side==='us'?S.iqUs:S.iqOpp,str=e.side==='us'?(e.q||S.C.us.str):S.C.opp.str,sp=4.4+str*0.028;
  const drop=S.kicked&&b.kind==='cross'?S.drop:null;
  if(e.side===atkSide&&e.role==='box'){
    if(drop){const d=Math.hypot(drop.x-e.x,drop.y-e.y);if(d<5||S.target===e){steer(e,drop.x,drop.y,sp*1.05,dt);return;}}
    const t=S.t*0.8+e.ph;steer(e,e.rx+Math.sin(t)*1.8,e.ry+Math.cos(t*1.3)*1.3-(S.kicked?1.5:0),sp*(S.kicked?0.9:0.55),dt);return;}
  if(e.role==='mk'&&e.mk){const m=e.mk;let tx=m.x+(34-m.x)*0.06+m.vx*(0.1+iq*0.15),ty=m.y-0.75+m.vy*0.1;
    if(drop&&Math.hypot(drop.x-e.x,drop.y-e.y)<2.6){tx=drop.x;ty=drop.y-0.3;}
    steer(e,tx,ty,sp*(m.isC?0.98+iq*0.2:0.86+iq*0.16),dt);return;}
  if(e.role==='zn'){let tx=e.zx,ty=e.zy;if(drop&&Math.hypot(drop.x-e.zx,drop.y-e.zy)<3.8){tx=drop.x;ty=drop.y;}steer(e,tx,ty,sp,dt);return;}
  drift(e,dt);}
function gkAir(g,dt){const S=MG.S,b=S.ball;if(busy(g,dt))return;if(b.held===g){drift(g,dt);return;}
  const drop=S.kicked&&b.kind==='cross'&&!b.owner?S.drop:null;
  if(drop){if(S.gkGo==null)S.gkGo=drop.y<6.3&&Math.abs(drop.x-34)<10.5&&Math.random()<0.25+g.str*0.006;
    if(S.gkGo){steer(g,drop.x,drop.y,4.4+g.str*0.03,dt);
      if(dist(g,b)<1.3&&b.z<2.95&&b.z>0.3){if(g.jumpT==null)g.jumpT=S.t;const crowd=S.all.filter(e=>!e.isGK&&e.role!=='idle'&&Math.hypot(e.x-b.x,e.y-b.y)<1.3).length;
        if(Math.random()<clamp(0.58+g.str*0.004-crowd*0.1,0.3,0.95)){b.held=g;b.owner=null;return endChance(S.ck==='def'?'defOk':'gkClaim');}
        deflect(b,0.35);b.kind='loose';b.last=g;b.lastT=S.t;S.gkGo=false;g.down=0.7;mgFlash('KALECİ KAÇIRDI','',600);}
      return;}}
  steer(g,34+(b.x-34)*0.12+(S.cs||0)*0.4,0.9,3.5,dt);}
function kickClear(e){const S=MG.S,b=S.ball;const dx=e.isC&&Math.abs(IN.jx)>0.3?IN.jx:rnd(-0.7,0.7);b.owner=null;kick(e,clamp(b.x+dx*14,2,66),b.y+rnd(15,22),3,rnd(15,19),0,0.2,0.6,'clear');}
function headerBy(e,tq){const S=MG.S,b=S.ball,C=S.C,def=S.ck==='def',atkSide=def?'opp':'us';e.kickT=0.3;b.owner=null;for(const x of S.all)if(x.role==='taker')x.role='idle';
  const crowd=S.all.filter(o=>o.side!==e.side&&!o.isGK&&o.role!=='idle'&&Math.hypot(o.x-b.x,o.y-b.y)<1.4).length;
  if(e.side===atkSide){let tx,tz,v,sd;
    if(e.isC){tx=Math.abs(IN.jx)>0.25?34+clamp(IN.jx,-1,1)*3.2:(S.gk.x<34?35.6+rnd(0,1.6):32.4-rnd(0,1.6));tz=clamp(0.5-IN.jy*0.9,0.15,2.1);v=11+C.a.fiz*0.04+C.a.sut*0.04;
      sd=(0.035+(100-C.a.sut)*0.0006+(100-C.a.fiz)*0.0003)*(1+crowd*0.35)*(1.6-tq*0.6);mgFlash('KAFA!','',450);}
    else{const q=e.side==='us'?(e.q||C.us.str):C.opp.str;tx=34+(S.gk.x<34?1:-1)*rnd(0.6,3.2);tz=rnd(0.2,1.9);v=11+q*0.06;sd=(0.05+(100-q)*0.0008)*(1+crowd*0.35);}
    if(!e.isC&&e.side==='us')e.fromMe=S.ck==='take';
    kick(e,tx,0,tz,v,0,sd,0.35,'shot');b.hdr=true;S.mode=def?'def':'atk';S.drop=null;S.limit=S.live+4;MG.padK=null;return;}
  kickClear(e);
  if(def)return endChance(e.isC?'clear':'defOk');
  return endChance('cleared');}
function airCheck(){const S=MG.S,b=S.ball,def=S.ck==='def',ce=S.hero;if(b.owner||b.held||S.phase!=='play')return;
  if(b.py>0&&b.y<=0){const f=b.py/((b.py-b.y)||1),cx=b.px+(b.x-b.px)*f,cz=b.pz+(b.z-b.pz)*f;
    if(cx>GL+0.11&&cx<GR-0.11&&cz<GH-0.11){S.inNet=true;S.net={x:cx,z:cz,a:1};vib(60);return endChance(def?'conceded':(b.last&&b.last.isC?'goal':'tmGoal'));}
    return endChance(def?'defOk':'cleared');}
  if(b.x<-0.5||b.x>68.5||b.y>34)return endChance(def?'defOk':'cleared');
  if(!S.dropT||S.t>=S.dropT){S.dropT=S.t+0.1;S.drop=calcDrop();}
  if(S.t-b.lastT<0.25)return;
  if(b.z<0.5&&b.vz<=0.5){S.mode=def?'def':'atk';b.kind='loose';S.drop=null;for(const e of S.all)if(e.role==='taker')e.role='idle';S.limit=S.live+4;MG.padK=null;return;}
  const dc=dist(ce,b);
  if(dc<0.85&&b.z<1.5&&S.ck!=='take'&&ce.jumpT==null&&ce.down<=0){for(const e of S.all)if(e.role==='taker')e.role='idle';
    if(def){kickClear(ce);return endChance('clear');}
    b.owner=ce;b.kind=null;S.mode='atk';S.limit=S.live+5;MG.padK=null;mgFlash('GÖĞÜSLE KONTROL','ok',600);return;}
  if(b.z<0.7||b.z>3.1||b.vz>1.5)return;
  let win=null,ws=-1e9;
  for(const e of S.all){if(e.isGK||e.role==='idle'||e.role==='taker'||e.down>0||e.slide>0||e.wall)continue;const dh=Math.hypot(e.x-b.x,e.y-b.y);
    if(e.isC){if(S.ck==='take')continue;const jt=e.jumpT!=null?S.t-e.jumpT:9;if(!(jt>=0&&jt<0.5))continue;const zr=2.5+0.5*S.C.a.fiz/100;if(dh>1.3||b.z>zr)continue;
      const tq=clamp(1-Math.abs(jt-0.24)/0.3,0,1),s=(1.3-dh)*1.3+S.C.a.fiz*0.012+tq*0.6+rnd(0,0.7);if(s>ws){ws=s;win={e,tq};}}
    else{const str=e.side==='us'?(e.q||S.C.us.str):S.C.opp.str,zr=2.0+0.6*str/100;if(dh>1.0||b.z>zr)continue;if(e.jumpT==null)e.jumpT=S.t;
      const s=(1.0-dh)*1.3+str*0.012+rnd(0,0.7);if(s>ws){ws=s;win={e,tq:0.6};}}}
  if(win)headerBy(win.e,win.tq);}
function stepAir(dt){const S=MG.S,b=S.ball;S.live+=dt;const def=S.ck==='def';
  if(!S.kicked&&S.live>(def?1.5:2.0)){const tk=S.all.find(e=>e.role==='taker');if(tk)aiCorner(tk);}
  if(S.kicked&&S.live>S.limit)return endChance(def?'defOk':'cleared');
  moveMe(dt);if(S.phase!=='play')return;
  for(const e of S.all){if(e===S.hero||e.isGK)continue;airAI(e,dt);}
  gkAir(S.gk,dt);if(S.phase!=='play')return;
  separate();ballStep(dt);if(S.kicked)airCheck();}
function ring(c,x,y,r,col,lw){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();let f=true;for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,P=proj(x+Math.cos(a)*r,y+Math.sin(a)*r,0);if(!P)continue;if(f){c.moveTo(P.x,P.y);f=false;}else c.lineTo(P.x,P.y);}c.stroke();}
function drawCkPreview(c){const S=MG.S,b=S.ball,p=S.charge>=0?S.charge:0.68,P=ckParams(b.x,b.y,S.aim.x,S.aim.y,p,S.spin);
  ring(c,S.aim.x,S.aim.y,1.1,'rgba(255,179,32,.95)',2.4);ring(c,P.ex,P.ey,0.55,'rgba(255,255,255,.85)',1.6);
  if(S.charge>=0){const bx=MG.W/2,by=MG.H*0.52,w=120,x=bx-w/2;c.fillStyle='#4ad27f';c.fillRect(x+w*0.6,by-7,w*0.16,4);c.font='800 11px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.fillStyle='#d9f5e3';c.fillText('İDEAL',x+w*0.68,by-10);}}
function drawGates(c){const S=MG.S;S.gates.forEach((g,i)=>{const col=g.ok===true?'#4ad27f':g.ok===false?'#ef3b36':i===S.gi?'#ffb320':'#ff7a1a';
  if(i===S.gi){const A=proj(g.x-g.w/2,g.y,0.02),B=proj(g.x+g.w/2,g.y,0.02);if(A&&B){c.strokeStyle='rgba(255,179,32,.7)';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.stroke();c.setLineDash([]);}}
  for(const s of [-1,1]){const P=proj(g.x+s*g.w/2,g.y,0),T=proj(g.x+s*g.w/2,g.y,0.5);if(!P||!T)continue;const w=Math.max(2,0.2*P.s);c.fillStyle=col;c.beginPath();c.moveTo(P.x-w,P.y);c.lineTo(P.x+w,P.y);c.lineTo(T.x,T.y);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.75)';c.fillRect(P.x-w*0.55,(P.y+T.y)/2-1,w*1.1,Math.max(1,w*0.3));}});}
function gateCheck(){const S=MG.S,ce=S.hero,g=S.gates[S.gi];const py=S.gpy??ce.y;S.gpy=ce.y;if(!g)return;
  if(py>g.y&&ce.y<=g.y){g.ok=Math.abs(ce.x-g.x)<=g.w/2;S.gi++;if(g.ok){S.trPts++;vib(12);}else mgFlash('KAPIYI KAÇIRDIN','bad',450);
    if(S.gi>=S.gates.length&&S.type==='tr_kos'){const f=S.trPts/S.gates.length,tb=clamp((S.limit-S.live)/S.limit,0,1);return endChance(f>=0.8?'trDone':'trMiss',{tr:clamp(f*0.7+tb*0.6*f,0,1)});}}}

/* ---------- Top kontrolü, kale, sonuç ---------- */
function shotRes(k){const S=MG.S,sh=S.ball.last;
  if(S.mode==='def')return k==='goal'?'conceded':k==='saved'?'gkSave':'oppMiss';
  if(k==='out')return 'lost';
  if(sh&&sh.isC)return k;
  if(sh&&sh.side==='us')return k==='goal'?(sh.fromMe?'assist':'tmGoal'):'tmMiss';
  return k==='goal'?'tmGoal':'lost';}
function checkBall(){const S=MG.S,b=S.ball;if(S.mode==='cp')return checkBallCP();if(b.owner||b.held||S.phase!=='play')return;
  const sp=Math.hypot(b.vx,b.vy),g=S.gk;
  if(b.kind==='shot'&&!b.gkChecked&&b.last&&b.last.side!==g.side&&b.py>g.y&&b.y<=g.y&&g.stag<=0&&g.down<=0){
    b.gkChecked=true;const f=(b.py-g.y)/((b.py-b.y)||1),cx=b.px+(b.x-b.px)*f,cz=b.pz+(b.z-b.pz)*f,dx=Math.abs(cx-g.x),rx=g.diving?1.6:0.85,rz=g.diving?2.4:2.1;
    if(dx<rx&&cz<rz){const p=clamp(0.55+g.str*0.0032-(sp-22)*0.035-(dx>1.0?0.2:0)-(cz>1.85?0.12:0)-(S.type==='penalti'?0.1:0)-(b.hdr?0.14:0),0.06,0.93);
      if(Math.random()<p){const code=shotRes('saved');if(sp<21&&dx<0.7&&Math.random()<0.6){b.held=g;vib(30);return endChance(code);}b.vy=Math.abs(b.vy)*0.3+2;b.vx=(cx<g.x?-1:1)*rnd(3,7);b.vz=rnd(1.5,3.5);b.om=0;vib(30);
        if(S.mode==='atk'&&!S.reb&&S.type!=='penalti'&&Math.random()<0.55){S.reb=code;b.kind='loose';b.last=g;b.lastT=S.t;g.stag=0.9;S.limit=S.live+2.6;mgFlash('KURTARIŞ! TOP SEKTİ','ok',650);return;}return endChance(code);}
      b.vx*=0.85;b.vy*=0.85;}}
  for(const e of S.all){
    if(e.isGK||e.down>0||(e.slide>0&&!e.isC))continue;if(b.last===e&&S.t-b.lastT<0.3)continue;if(b.ign===e)continue;
    const d=Math.hypot(e.x-b.x,e.y-b.y);
    if(e.wall){if(d<0.5&&b.z<1.9+(e.z||0)){const code=shotRes('blocked');deflect(b,0.35);b.last=e;return endChance(code);}continue;}
    if(d>(e.isC?1.0:0.95)||b.z>1.5)continue;
    if(e.side==='us'){
      if(S.mode==='set')continue;
      if(S.mode==='def'){if(b.kind==='shot'&&sp>12){if(Math.random()<(e.isC?0.6:0.4)){deflect(b,0.4);return endChance(e.isC?'shotBlock':'oppMiss');}b.ign=e;continue;}return endChance(e.isC?'intercept':'defOk');}
      if(!e.isC&&b.kind==='shot'&&sp>14)continue;if(sp>26)continue;
      if(S.ofs===e)return endChance('offside');
      if(e.isC&&sp>13&&b.last!==e&&b.kind!=='loose'){const pr=S.opps.some(o=>dist(o,e)<2.2);if(Math.random()<clamp((pr?0.3:0.1)-S.C.a.dri*0.0032,0.02,0.26)){b.vx=b.vx*0.35+rnd(-1.6,1.6);b.vy=b.vy*0.35+rnd(-1.2,1.2);b.last=e;b.lastT=S.t;b.kind='loose';mgFlash('İLK DOKUNUŞ KAÇTI','bad',500);return;}}
      e.fromMe=!e.isC&&b.last===S.hero;b.owner=e;b.kind=null;b.om=0;b.target=null;S.ofs=null;if(!e.isC){e.hold=rnd(0.3,0.45);e.think=0;}return;
    }else{
      if(S.mode==='def'){if(S.ofs===e)return endChance('oppOff');b.owner=e;b.kind=null;b.om=0;b.target=null;S.ofs=null;return;}
      const code=b.kind==='shot'?shotRes('blocked'):'lost';
      const shield=b.kind!=='shot'&&b.target&&dist(b.target,b)<1.7&&Math.random()<0.55;
      if(shield){b.ign=e;continue;}
      if(sp<11||Math.random()<(b.kind==='shot'?0.45:0.22)+S.iqOpp*0.08){deflect(b,0.3);b.last=e;b.lastT=S.t;if(code==='lost'){b.owner=e;return lostBall(e);}return endChance(code);}
      deflect(b,0.45);b.last=e;b.lastT=S.t;b.kind='loose';b.gkChecked=false;return;}}
  if(b.py>0&&b.y<=0){const f=b.py/((b.py-b.y)||1),cx=b.px+(b.x-b.px)*f,cz=b.pz+(b.z-b.pz)*f;
    if(cx>GL+0.11&&cx<GR-0.11&&cz<GH-0.11){S.inNet=true;S.net={x:cx,z:cz,a:1};vib(60);return endChance(shotRes('goal'));}
    const post=((Math.abs(cx-GL)<0.22||Math.abs(cx-GR)<0.22)&&cz<GH+0.1)||(cx>GL&&cx<GR&&Math.abs(cz-GH)<0.2);
    if(post){b.vy=Math.abs(b.vy)*0.55;b.y=0.05;b.vx+=rnd(-3,3);b.vz=Math.abs(b.vz)*0.5+1;vib(40);return endChance(shotRes(b.kind==='shot'?'post':'out'));}
    return outGL(cx,cz);}
  if(b.x<-0.11||b.x>68.11||b.y>70)return outTouch();}
/* Top oyun alanını terk etti (v145 bu iki kancayı taç/korner/aut kurallarıyla değiştirir) */
function outGL(cx,cz){const S=MG.S,b=S.ball;return endChance(shotRes(b.kind==='shot'?(cx>GL-0.6&&cx<GR+0.6&&cz>=GH?'over':'wide'):'out'));}
function outTouch(){const S=MG.S;return endChance(S.mode==='def'?'defOk':'lost');}
let flashT=0;
function mgFlash(txt,cls,ms){const f=$('#mgFlash');f.textContent=txt;f.className='mg-flash show '+(cls||'');clearTimeout(flashT);if(ms)flashT=setTimeout(()=>{f.className='mg-flash';},ms);}
function endChance(code,extra){const S=MG.S;if(!S||S.phase==='end'||S.phase==='replay')return;extra=extra||{};if(S.reb&&['lost','timeout','cleared'].includes(code))code=S.reb;if(S.ck&&code==='lost')code='cleared';if(S.gates){extra.gates=S.trPts;extra.ng=S.gates.length;}if(S.bonus)extra.bonus=S.bonus;if(S.ball&&S.ball.hdr&&S.ball.last&&S.ball.last.isC)extra.hdr=true;S.phase='end';
  const big=['goal','assist','tmGoal'].includes(code);S.endT=big?2.6:extra.injured?2.2:1.6;S.res=Object.assign({code,cond:S.cond},extra);
  const R=RES[code];let t=R.t;if(extra.injured&&code!=='injury')t+='\nSAKATLANDI';if(extra.card==='Y')t+='\nSARI KART';if(extra.card==='R')t+='\nKIRMIZI KART';mgFlash(t,R.cls,0);
  if(code==='goal'){S.hero.cel=2.4;S.hero.celK=pick(['kos','ucak','diz','yumruk']);partsConfetti();MG.shake=6;vib([60,40,90]);}else if(big){partsConfetti();MG.shake=3;}else if(code==='conceded')MG.shake=2;
  resetInput();MG.padK=null;}
function partsGrass(x,y,n){const S=MG.S;if(!S)return;for(let i=0;i<n;i++)S.parts.push({x,y,z:0.05,vx:rnd(-2,2),vy:rnd(-2,2),vz:rnd(1,3),life:rnd(0.3,0.7),col:pick(['#5fae6a','#3f8c4d','#8fd08f']),sz:0.08});}
function partsConfetti(){const S=MG.S,cols=[S.hero.kit.shirt,S.hero.kit.trim,'#ffb320','#ffffff'];for(let i=0;i<150;i++)S.parts.push({x:rnd(20,48),y:rnd(-3,6),z:rnd(3,8),vx:rnd(-3,3),vy:rnd(1,5),vz:rnd(0,3),life:rnd(1.6,2.8),col:pick(cols),sz:rnd(0.22,0.36),conf:true});}
function stepParts(dt){const S=MG.S;for(const p of S.parts){p.life-=dt;p.vz-=(p.conf?2.2:GRAV)*dt;if(p.conf){p.vx*=0.985;p.vy*=0.985;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.z<0){p.z=0;p.vz=0;p.vx*=0.4;p.vy*=0.4;}}if(S.parts.length)S.parts=S.parts.filter(p=>p.life>0);}

/* ---------- Döngü ---------- */
function camTarget(){const S=MG.S,b=S.ball;let fx,fy;
  if(S.ck&&(S.mode==='air'||S.mode==='set')){if(!S.kicked){fx=34+(b.x-34)*0.12;fy=6.5;}else{fx=34+(b.x-34)*0.25;fy=Math.max(6.5,b.y-2);}}
  else if(S.gates&&S.ball.held){fx=S.hero.x*0.7+34*0.3;fy=S.hero.y-5;}
  else if(S.mode==='set'&&!S.kicked){fx=b.x*0.6+34*0.4;fy=b.y-(S.type==='penalti'?2.2:3.2);}else if(S.inNet){fx=34;fy=6;}
  else{fx=b.x*0.75+34*0.25;fy=b.y-(S.mode==='def'?2:2.5);}
  return {x:fx,y:clamp(fy,5,60)};}
function camStep(dt){const t=camTarget(),k=1-Math.pow(0.03,dt);MG.cam.x+=(t.x-MG.cam.x)*k;MG.cam.y+=(t.y-MG.cam.y)*k;MG.shake*=Math.pow(0.02,dt);}
function stepAtk(dt){const S=MG.S,b=S.ball;S.live+=dt;
  if(S.live>S.limit&&!(b.kind==='shot'&&!b.owner))return endChance('timeout');
  if(S.t>=S.brainOT){S.brainOT=S.t+0.32-S.iqOpp*0.17;brainDefend();}
  if(S.t>=S.brainUT){S.brainUT=S.t+0.3-S.iqUs*0.12;brainSupport();}
  moveMe(dt);if(S.gates){gateCheck();if(S.phase!=='play')return;}
  for(const t of S.mates)mateAtkAI(t,dt);if(S.phase!=='play')return;
  for(const d of S.opps)oppAtkAI(d,dt);if(S.phase!=='play')return;
  gkAI(S.gk,dt);if(S.phase!=='play')return;
  separate();ballStep(dt);checkBall();}
function stepDef(dt){const S=MG.S,b=S.ball;S.live+=dt;
  if(S.live>S.limit&&!(b.kind==='shot'&&!b.owner))return endChance('defOk');
  if(S.t>=S.brainOT){S.brainOT=S.t+0.3-S.iqOpp*0.15;brainAttack();}
  moveMe(dt);if(S.phase!=='play')return;
  for(const a of S.opps)attAI(a,dt);if(S.phase!=='play')return;
  for(const t of S.mates)coverAI(t,dt);if(S.phase!=='play')return;
  gkAI(S.gk,dt);if(S.phase!=='play')return;
  separate();ballStep(dt);checkBall();}
function endStep(dt){const S=MG.S,ce=S.hero,goal=S.res&&S.res.code==='goal';
  ballStep(dt);
  for(const e of S.all){
    if(e===ce&&ce.cel>0){ce.cel-=dt;if(ce.celK==='diz'&&ce.cel<1.1){drift(ce,dt,0.5);continue;}steer(ce,ce.x<34?1.5:66.5,1.5,6.2,dt);continue;}
    if(goal&&!e.isGK&&e.side==='us'&&e.role!=='idle'){steer(e,ce.x+(e.x<ce.x?-1.2:1.2),ce.y+1.2,5.5,dt);continue;}
    if(e.slide>0)e.slide-=dt;if(e.down>0)e.down-=dt;if(e.z>0&&!e.wall)e.z=Math.max(0,e.z-dt*2);drift(e,dt,0.15);}
  camStep(dt);stepParts(dt);if(S.net)S.net.a*=Math.pow(0.15,dt);
  S.endT-=dt;if(S.endT<=0&&rpWant(S)){rpStart();return;}
  if(S.endT<=0){const done=S.done,res=S.res;MG.S=null;cancelAnimationFrame(MG.raf);done(res);}}
function mgStep(dt){const S=MG.S;if(S.paused)return;S.t+=dt;
  if(S.phase==='intro'){S.introT-=dt;camStep(dt);stepParts(dt);if(S.introT<=0){S.phase='play';IN.q.length=0;$('#mgFlash').className='mg-flash';}return;}
  if(S.phase==='replay')return rpStep(dt);
  if(S.phase==='end')return endStep(dt);
  procInput();if(S.phase!=='play')return;
  if(S.charge>=0&&IN.btn.a&&S.mode==='atk')S.charge=Math.min(condPow(S.cond),S.charge+dt/0.8);
  S.sprint=S.mode!=='set'&&IN.btn.c&&S.dn.c&&(S.t-S.cDown)>0.18&&S.stam>0.02&&S.cond>18;
  if(S.mode!=='set')S.cond=Math.max(0,S.cond-dt*(0.12+(S.sprint?1.1:0)));
  for(const e of S.all)if(e.jumpT!=null){const jt=S.t-e.jumpT;if(jt>=0&&jt<0.55)e.z=Math.sin(Math.PI*jt/0.55)*(e.isC?0.55:0.45);else{e.z=0;e.jumpT=null;}}
  if(S.mode==='set')stepSet(dt);else if(S.mode==='def')stepDef(dt);else if(S.mode==='cp')stepCP(dt);else if(S.mode==='air')stepAir(dt);else stepAtk(dt);
  if(MG.S===S){camStep(dt);stepParts(dt);recFrame();}}
function mgLoop(ts){if(!MG.S)return;const dt=MG.last?Math.min(0.05,(ts-MG.last)/1000):0;MG.last=ts;MG.acc+=dt;
  while(MG.acc>=1/120&&MG.S){mgStep(1/120);MG.acc-=1/120;}
  if(MG.S){mgDraw();hudUpdate();MG.raf=requestAnimationFrame(mgLoop);}}

/* ---------- Çizim: perspektif kamera ---------- */
function toCam(x,y,z){const c=MG.cam,rx=x-c.x,fw=(c.y+CAM_B)-y,up=z-CAM_H;return {x:rx,d:fw*CT-up*ST,u:fw*ST+up*CT};}
function scr(v){const s=MG.f/v.d;return {x:MG.W/2+v.x*s,y:MG.cy0-v.u*s,s};}
function proj(x,y,z){const v=toCam(x,y,z);return v.d<0.6?null:scr(v);}
function polyW(pts){const cam=pts.map(p=>toCam(p[0],p[1],p[2])),N=0.6,out=[];
  for(let i=0;i<cam.length;i++){const a=cam[i],b=cam[(i+1)%cam.length],ai=a.d>=N,bi=b.d>=N;if(ai)out.push(a);if(ai!==bi){const t=(N-a.d)/(b.d-a.d);out.push({x:a.x+(b.x-a.x)*t,d:N,u:a.u+(b.u-a.u)*t});}}
  return out.map(scr);}
function fillPoly(c,pts,col){const P=polyW(pts);if(P.length<3)return;c.beginPath();c.moveTo(P[0].x,P[0].y);for(let i=1;i<P.length;i++)c.lineTo(P[i].x,P[i].y);c.closePath();c.fillStyle=col;c.fill();}
function clipSeg(x1,y1,z1,x2,y2,z2){let a=toCam(x1,y1,z1),b=toCam(x2,y2,z2);const N=0.6;if(a.d<N&&b.d<N)return null;
  if(a.d<N){const t=(N-a.d)/(b.d-a.d);a={x:a.x+(b.x-a.x)*t,d:N,u:a.u+(b.u-a.u)*t};}else if(b.d<N){const t=(N-b.d)/(a.d-b.d);b={x:b.x+(a.x-b.x)*t,d:N,u:b.u+(a.u-b.u)*t};}
  return [scr(a),scr(b)];}
function segW(c,x1,y1,z1,x2,y2,z2,w){const s=clipSeg(x1,y1,z1,x2,y2,z2);if(!s)return;c.lineWidth=Math.max(1,w*(s[0].s+s[1].s)/2);c.beginPath();c.moveTo(s[0].x,s[0].y);c.lineTo(s[1].x,s[1].y);c.stroke();}
function segP(c,x1,y1,z1,x2,y2,z2){const s=clipSeg(x1,y1,z1,x2,y2,z2);if(!s)return;c.moveTo(s[0].x,s[0].y);c.lineTo(s[1].x,s[1].y);}
function lineW(c,x1,y1,x2,y2){const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/6));for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n;segW(c,x1+(x2-x1)*a,y1+(y2-y1)*a,0,x1+(x2-x1)*b,y1+(y2-y1)*b,0,0.12);}}
function arcW(c,cx,cy,r,a0,a1,n){for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n;segW(c,cx+Math.cos(t0)*r,cy+Math.sin(t0)*r,0,cx+Math.cos(t1)*r,cy+Math.sin(t1)*r,0,0.12);}}
function ln(c,x1,y1,x2,y2,w,col){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function mgSetup(){const cv=$('#pitch'),st=$('#mvStage'),w=Math.max(260,st.clientWidth),h=Math.max(320,st.clientHeight);
  MG.dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*MG.dpr);cv.height=Math.round(h*MG.dpr);cv.style.width=w+'px';cv.style.height=h+'px';
  MG.ctx=cv.getContext('2d');MG.W=w;MG.H=h;MG.f=Math.min(w*0.95,h*0.74);if(MG.S&&MG.S.ck)MG.f=Math.min(MG.f,w/2*20/14);MG.cy0=h*(w>h*1.2?0.44:h>w*1.9?0.39:0.36);
  const g=MG.ctx.createLinearGradient(0,0,0,h*0.45);g.addColorStop(0,'#020604');g.addColorStop(1,'#0d1d15');MG.sky=g;
  const v=document.createElement('canvas');v.width=cv.width;v.height=cv.height;const vc=v.getContext('2d');vc.scale(MG.dpr,MG.dpr);
  const rg=vc.createRadialGradient(w/2,h*0.42,Math.min(w,h)*0.3,w/2,h*0.42,Math.max(w,h)*0.78);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,.55)');vc.fillStyle=rg;vc.fillRect(0,0,w,h);
  for(const x of [w*0.05,w*0.95]){const lg=vc.createRadialGradient(x,-h*0.02,0,x,-h*0.02,w*0.7);lg.addColorStop(0,'rgba(255,246,220,.26)');lg.addColorStop(1,'rgba(255,246,220,0)');vc.fillStyle=lg;vc.fillRect(0,0,w,h);}
  MG.vig=v;}
function genCrowd(C){const cols=[C.us.c1,C.us.c2,C.opp.c1,'#d9d4c7','#8a8f99','#3b4250','#c9b49a','#262b33'],pts=[];
  for(let i=0;i<380;i++){const v=Math.random();pts.push({x:rnd(-14,82),y:-6.8-25*v,z:1.5+15.5*v,col:pick(cols),k:Math.random()*6.3});}
  for(const s of [-1,1])for(let i=0;i<240;i++){const v=Math.random();pts.push({x:s<0?-5.8-22*v:73.8+22*v,y:rnd(-6,74),z:1.5+13.3*v,col:pick(cols),k:Math.random()*6.3});}
  return pts;}
function drawStands(c){const S=MG.S;
  fillPoly(c,[[-16,-6.5,1.3],[84,-6.5,1.3],[84,-32,17],[-16,-32,17]],'#0c1712');
  fillPoly(c,[[-5.5,-6.5,1.3],[-5.5,76,1.3],[-28,76,15],[-28,-6.5,15]],'#0a1410');
  fillPoly(c,[[73.5,-6.5,1.3],[73.5,76,1.3],[96,76,15],[96,-6.5,15]],'#0a1410');
  const wave=S.res&&['goal','assist','tmGoal'].includes(S.res.code),t=S.t;
  for(const p of MG.crowd){const z=p.z+(wave?Math.max(0,Math.sin(t*9+p.k))*0.6:Math.sin(t*2+p.k)*0.05);const P=proj(p.x,p.y,z);
    if(!P||P.x<-4||P.x>MG.W+4||P.y<-6||P.y>MG.H)continue;const s=Math.max(1,P.s*0.36);c.fillStyle=p.col;c.fillRect(P.x-s/2,P.y-s,s,s*1.3);}}
function drawPitch(c){
  fillPoly(c,[[-5.4,-6.5,0],[73.4,-6.5,0],[73.4,78,0],[-5.4,78,0]],'#21573a');
  for(let i=0;i<14;i++){const y0=i*5.5;fillPoly(c,[[0,y0,0],[68,y0,0],[68,y0+5.5,0],[0,y0+5.5,0]],i%2?'#2c7743':'#358550');}
  c.globalAlpha=0.06;for(let i=1;i<6;i+=2){const x0=i*11.33;fillPoly(c,[[x0,0,0],[x0+11.33,0,0],[x0+11.33,77,0],[x0,77,0]],'#ffffff');}c.globalAlpha=1;
  c.strokeStyle='rgba(255,255,255,.88)';c.lineCap='round';
  lineW(c,0,0,68,0);lineW(c,0,0,0,77);lineW(c,68,0,68,77);
  lineW(c,13.84,0,13.84,16.5);lineW(c,54.16,0,54.16,16.5);lineW(c,13.84,16.5,54.16,16.5);
  lineW(c,24.84,0,24.84,5.5);lineW(c,43.16,0,43.16,5.5);lineW(c,24.84,5.5,43.16,5.5);
  arcW(c,34,11,9.15,0.6448,Math.PI-0.6448,24);lineW(c,0,52.5,68,52.5);arcW(c,34,52.5,9.15,0,Math.PI*2,64);
  arcW(c,0,0,1,0,Math.PI/2,4);arcW(c,68,0,1,Math.PI/2,Math.PI,4);
  for(const [x,y] of [[34,11],[34,52.5]]){const P=proj(x,y,0);if(P){c.fillStyle='#fff';c.beginPath();c.ellipse(P.x,P.y,Math.max(1.5,0.22*P.s),Math.max(1,0.13*P.s),0,0,7);c.fill();}}}
const BOARD_TXT=['ALEZ','İSTANBUL','AMATÖR FUTBOL','GOL!','KARİYER','9 NUMARA','MAHALLE SPOR','FUTBOL'];
function drawBoards(c){BOARD_TXT[0]=trUp(PN());const cols=['#c8102e','#173a8a','#ffb320','#0f7b3a'];c.textAlign='center';c.textBaseline='middle';
  for(let i=0;i<8;i++){const x0=-2+i*9,col=cols[i%4];fillPoly(c,[[x0,-4.2,0],[x0+9,-4.2,0],[x0+9,-4.2,0.9],[x0,-4.2,0.9]],col);
    const A=proj(x0+4.5,-4.2,0.45),T=proj(x0+4.5,-4.2,0.9);if(A&&T){const h=A.y-T.y;if(h>3.5){c.font=`800 ${Math.round(h*1.15)}px "Saira Extra Condensed",sans-serif`;c.fillStyle=col==='#ffb320'?'#1d1300':'#ffffff';c.fillText(BOARD_TXT[i],A.x,A.y+1);}}}
  for(const sx of [-3.2,71.2])for(let i=0;i<8;i++){const y0=-4+i*10;fillPoly(c,[[sx,y0,0],[sx,y0+10,0],[sx,y0+10,0.9],[sx,y0,0.9]],cols[(i+(sx<0?1:2))%4]);}}
function drawGoalBack(c){const S=MG.S,n=S.net,D=-2,TZ=2.1,bul=(x,z)=>n?n.a*1.1*Math.exp(-((x-n.x)**2+(z-n.z)**2)/0.9):0;
  fillPoly(c,[[GL,D,0],[GR,D,0],[GR,D,TZ],[GL,D,TZ]],'rgba(240,240,240,.08)');
  fillPoly(c,[[GL,0,GH],[GR,0,GH],[GR,D,TZ],[GL,D,TZ]],'rgba(240,240,240,.06)');
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=1;c.beginPath();
  for(let x=GL;x<=GR+0.01;x+=0.46){for(let z=0;z<TZ-0.01;z+=0.35){const z2=Math.min(TZ,z+0.35);segP(c,x,D-bul(x,z),z,x,D-bul(x,z2),z2);}segP(c,x,0,GH,x,D-bul(x,TZ),TZ);}
  for(let z=0;z<=TZ+0.01;z+=0.42)for(let x=GL;x<GR-0.01;x+=0.46){const x2=Math.min(GR,x+0.46);segP(c,x,D-bul(x,z),z,x2,D-bul(x2,z),z);}
  for(const sx of [GL,GR]){for(let y=0;y>=D;y-=0.5)segP(c,sx,y,0,sx,y,GH+(TZ-GH)*(y/D));for(let z=0.42;z<=TZ;z+=0.42)segP(c,sx,0,z,sx,D,z);}
  c.stroke();}
function drawPosts(c){c.strokeStyle='#f7f7f7';c.lineCap='round';segW(c,GL,0,0,GL,0,GH,0.13);segW(c,GR,0,0,GR,0,GH,0.13);segW(c,GL,0,GH,GR,0,GH,0.13);}
function drawShadow(c,e){const P=proj(e.x,e.y,0);if(!P)return;const s=P.s,S=MG.S;
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(P.x+s*0.12,P.y,s*0.42,s*0.15,0,0,7);c.fill();
  if(e.isC){c.lineWidth=2;c.strokeStyle='rgba(255,179,32,.95)';c.beginPath();c.ellipse(P.x,P.y,s*0.62,s*0.24,0,0,7);c.stroke();
    if(S.stam<0.995){c.strokeStyle='rgba(111,183,255,.95)';c.lineWidth=3;c.beginPath();c.ellipse(P.x,P.y,s*0.8,s*0.32,0,-Math.PI/2,-Math.PI/2+Math.max(0.01,S.stam)*Math.PI*2);c.stroke();}}}
function drawHairBack(c,e,x,y,r){const s=e.hs;if(!s)return;c.fillStyle=e.hair;
  if(s==='afro'){c.beginPath();c.arc(x,y-r*0.28,r*1.36,0,7);c.fill();}
  else if(s==='long'){c.beginPath();c.moveTo(x-r*1.02,y-r*0.3);c.quadraticCurveTo(x-r*1.28,y+r*1.3,x-r*0.7,y+r*1.7);c.lineTo(x+r*0.7,y+r*1.7);c.quadraticCurveTo(x+r*1.28,y+r*1.3,x+r*1.02,y-r*0.3);c.closePath();c.fill();}
  else if(s==='dread'){c.strokeStyle=e.hair;c.lineCap='round';c.lineWidth=Math.max(1,r*0.3);c.beginPath();for(let i=-3;i<=3;i++){const sx=x+i*r*0.3;c.moveTo(sx,y-r*0.5);c.quadraticCurveTo(sx+i*r*0.1,y+r*0.7,sx+i*r*0.18,y+r*(1.35+(i&1)*0.15));}c.stroke();}
  else if(s==='bun'){c.beginPath();c.arc(x,y-r*1.12,r*0.42,0,7);c.fill();}}
function drawHair(c,e,x,y,r,front){const s=e.hs;
  if(s==='bald'){if(r>4){c.fillStyle='rgba(255,255,255,.16)';c.beginPath();c.ellipse(x-r*0.32,y-r*0.55,r*0.3,r*0.14,-0.5,0,7);c.fill();}return;}
  c.fillStyle=e.hair;
  if(s==='curly'||s==='afro'){const big=s==='afro'?1.15:1;c.beginPath();if(front)c.arc(x,y-r*0.1,r*0.98,Math.PI*1.02,Math.PI*1.98);else c.arc(x,y-r*0.05,r,Math.PI*0.92,Math.PI*2.08);c.fill();
    const n=front?9:12,a0=front?Math.PI*0.95:Math.PI*0.78,a1=front?Math.PI*2.05:Math.PI*2.22;
    for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/(n-1);c.beginPath();c.arc(x+Math.cos(a)*r*0.92,y-r*0.12+Math.sin(a)*r*0.92,r*0.34*big,0,7);c.fill();}
    for(const [dx,dy] of [[-0.38,-0.78],[0.05,-0.95],[0.42,-0.74]]){c.beginPath();c.arc(x+dx*r,y+dy*r,r*0.38*big,0,7);c.fill();}
    if(r>4){c.fillStyle='rgba(255,255,255,.12)';for(const [dx,dy] of [[-0.45,-0.7],[0.1,-1.0],[0.5,-0.6]]){c.beginPath();c.arc(x+dx*r,y+dy*r,r*0.12,0,7);c.fill();}}
    return;}
  if(s==='mohawk'||s==='fade'){c.globalAlpha=0.42;c.beginPath();if(front)c.arc(x,y-r*0.05,r*1.0,Math.PI*1.02,Math.PI*1.98);else c.arc(x,y,r*1.02,Math.PI*0.8,Math.PI*2.2);c.fill();c.globalAlpha=1;
    c.beginPath();if(s==='mohawk')c.ellipse(x,y-r*0.92,r*0.2,r*(front?0.42:0.55),0,0,7);else c.ellipse(x,y-r*0.62,r*0.8,r*0.42,0,0,7);c.fill();return;}
  const lg=s==='long'||s==='dread';
  c.beginPath();if(front)c.arc(x,y-r*(s==='buzz'?0.05:0.15),r*1.02,Math.PI*1.05,Math.PI*1.95);else c.arc(x,y,r*1.03,Math.PI*(lg?0.6:0.85),Math.PI*(lg?2.4:2.15));c.closePath();
  if(s==='buzz')c.globalAlpha=0.85;c.fill();c.globalAlpha=1;
  if(s==='side'&&front){c.beginPath();c.ellipse(x-r*0.3,y-r*0.62,r*0.62,r*0.3,-0.4,0,7);c.fill();}
  if(lg&&front){c.beginPath();c.ellipse(x-r*0.9,y+r*0.25,r*0.22,r*0.72,0.1,0,7);c.fill();c.beginPath();c.ellipse(x+r*0.9,y+r*0.25,r*0.22,r*0.72,-0.1,0,7);c.fill();}}
function drawDown(c,e,H){const k=e.kit,lw=Math.max(1.6,H*0.085),a=Math.atan2(e.fy*0.55,e.fx||0.001);c.rotate(a);c.lineCap='round';
  ln(c,0,-H*0.03,H*0.42,-H*0.05,lw*1.05,k.socks);ln(c,0,H*0.04,H*0.4,H*0.07,lw*1.05,k.socks);
  c.fillStyle=e.boot||'#14161a';c.beginPath();c.ellipse(H*0.44,-H*0.05,lw*0.8,lw*0.5,0,0,7);c.ellipse(H*0.42,H*0.07,lw*0.8,lw*0.5,0,0,7);c.fill();
  c.fillStyle=k.shorts;rr(c,-H*0.08,-H*0.07,H*0.14,H*0.15,H*0.03);c.fill();
  c.fillStyle=k.shirt;rr(c,-H*0.38,-H*0.09,H*0.32,H*0.18,H*0.04);c.fill();
  drawHairBack(c,e,-H*0.46,-H*0.01,H*0.08);c.fillStyle=e.skin;c.beginPath();c.arc(-H*0.46,-H*0.01,H*0.08,0,7);c.fill();drawHair(c,e,-H*0.46,-H*0.01,H*0.08,false);}
function limb(c,x1,y1,x2,y2,w1,w2,col){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;c.fillStyle=col;c.beginPath();c.moveTo(x1+nx*w1/2,y1+ny*w1/2);c.lineTo(x2+nx*w2/2,y2+ny*w2/2);c.lineTo(x2-nx*w2/2,y2-ny*w2/2);c.lineTo(x1-nx*w1/2,y1-ny*w1/2);c.closePath();c.fill();
  c.beginPath();c.arc(x1,y1,w1/2,0,7);c.fill();c.beginPath();c.arc(x2,y2,w2/2,0,7);c.fill();}
function ik2(hx,hy,fx,fy,L1,L2,bend){let dx=fx-hx,dy=fy-hy,d=Math.hypot(dx,dy);const mx=L1+L2-0.01;if(d>mx){dx*=mx/d;dy*=mx/d;d=mx;}if(d<0.001)d=0.001;
  const a=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),base=Math.atan2(dy,dx),k=base+a*bend;return {kx:hx+Math.cos(k)*L1,ky:hy+Math.sin(k)*L1,fx:hx+dx,fy:hy+dy};}
function drawPlayer(c,e){const S=MG.S,P=proj(e.x,e.y,e.z||0);if(!P||P.y<-80||P.y>MG.H+100||P.x<-70||P.x>MG.W+70)return;
  const H=1.8*P.s*1.12*(e.hgt||1);if(H<5){c.fillStyle=e.kit.shirt;c.fillRect(P.x-1.5,P.y-H,3,H);return;}
  const k=e.kit,bw=e.bld||1,boot=e.boot||'#14161a',det=H>18,skin=e.skin,skD=shade(skin,-0.14);c.save();c.translate(P.x,P.y);c.lineCap='round';c.lineJoin='round';
  if(e.slide>0||e.down>0){drawDown(c,e,H);c.restore();return;}
  if(e.isGK&&e.dive&&e.diving){const dir=Math.sign(e.dive.tx-e.dive.x0)||1,pr=Math.min(1,e.dive.t/0.35);c.translate(0,-H*0.22*Math.sin(pr*Math.PI*0.9));c.rotate(dir*pr*1.2);}
  else if(e.stag>0)c.rotate(Math.sin(S.t*28)*0.08);
  const sp=Math.hypot(e.vx,e.vy),mv=Math.min(1,sp/5.5),sprint=sp>6.2,front=e.fy>0.25,side=Math.abs(e.fx)>0.35?Math.sign(e.fx):0;
  const celK=e.cel>0?(e.celK||'kos'):null,kneel=celK==='diz'&&e.cel<1.1,air=(e.z||0)>0.05,gkReady=e.isGK&&!e.diving&&S.ball&&!S.ball.held&&Math.hypot(S.ball.x-e.x,S.ball.y-e.y)<18;
  const lean=clamp(e.fx*mv*0.1+(celK==='ucak'?Math.sin(S.t*3)*0.18:0),-0.22,0.22);c.rotate(lean);
  const bob=-Math.abs(Math.cos(e.ph))*mv*H*0.022;c.translate(0,bob+(kneel?H*0.2:0)+(gkReady?H*0.05:0));
  const hip=-H*0.5,L1=H*0.245,L2=H*0.235,lw=Math.max(1.6,H*0.1*Math.sqrt(bw)),kick=e.kickT>0?(0.3-e.kickT)/0.3:-1;
  /* bacaklar */
  const legs=[];
  for(const i of [-1,1]){const p=e.ph+(i>0?Math.PI:0),s=Math.sin(p)*mv,lift=Math.max(0,Math.cos(p))*mv*H*(sprint?0.15:0.11);
    let fx2=i*H*0.07*bw+side*s*H*0.17,fy2=-lift+(front?1:-1)*s*H*0.04,bend=(side?-side:(i<0?1:-1))*(front?-1:1);
    if(kick>=0&&i===1){const a=kick<0.35?-kick/0.35:(kick-0.35)/0.65*1.6-1,dir=side||(e.fx>=0?1:-1);fx2=i*H*0.05+dir*a*H*0.24;fy2=-Math.max(0,a)*H*0.16-(a<0?-a*H*0.06:0);bend=-dir;}
    if(kick>=0&&i===-1){fx2=i*H*0.08;fy2=0;}
    if(air){fy2=-H*0.12-(i>0?H*0.05:0);fx2=i*H*0.08;}
    if(kneel){fy2=-H*0.0;fx2=i*H*0.14;}
    if(gkReady){fx2=i*H*0.12;}
    const hx=i*H*0.055*bw,j=ik2(hx,hip,fx2,fy2-H*0.035,L1,L2,kneel?(i<0?-1:1)*1.6:gkReady?-i:bend);legs.push({i,hx,j,fx2,fy2});}
  legs.sort((a,b)=>(front?a.fy2-b.fy2:b.fy2-a.fy2));
  for(const L of legs){const {hx,j}=L,sockTop=k.trim===k.socks?shade(k.socks,-0.28):k.trim;
    limb(c,hx,hip,j.kx,j.ky,lw*1.18,lw*0.88,skin);
    if(det){c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse((hx+j.kx)/2+lw*0.18,(hip+j.ky)/2,lw*0.28,Math.abs(j.ky-hip)*0.36+1,0,0,7);c.fill();}
    limb(c,j.kx,j.ky,j.fx,j.fy,lw*0.98,lw*0.7,k.socks);
    if(det){const t=0.2;limb(c,j.kx,j.ky,j.kx+(j.fx-j.kx)*t,j.ky+(j.fy-j.ky)*t,lw*1.02,lw*0.98,sockTop);c.fillStyle='rgba(255,255,255,.13)';c.beginPath();c.ellipse(j.kx+(j.fx-j.kx)*0.45-lw*0.15,j.ky+(j.fy-j.ky)*0.45,lw*0.16,Math.abs(j.fy-j.ky)*0.22+0.5,0,0,7);c.fill();}
    const toe=side||(L.i*0.4),bx=j.fx+toe*lw*0.45,by=j.fy+H*0.028;c.fillStyle=boot;c.beginPath();c.ellipse(bx,by,lw*(side?0.95:0.7),lw*0.42,0,0,7);c.fill();
    if(det){c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(bx-lw*0.2,by-lw*0.12,lw*0.32,lw*0.12,0,0,7);c.fill();c.fillStyle='rgba(0,0,0,.35)';c.fillRect(bx-lw*0.6,by+lw*0.3,lw*1.2,Math.max(0.8,lw*0.12));}}
  /* şort: iki paça */
  const sW=H*0.16*bw,wa=hip-H*0.045,wW=H*0.125*bw;
  c.fillStyle=k.shorts;c.beginPath();c.moveTo(-wW*1.04,hip-H*0.075);c.lineTo(wW*1.04,hip-H*0.075);c.lineTo(wW*1.1,hip+H*0.05);c.lineTo(H*0.012,hip+H*0.035);c.lineTo(-H*0.012,hip+H*0.035);c.lineTo(-wW*1.1,hip+H*0.05);c.closePath();c.fill();
  for(const L of legs){const t=0.32;limb(c,L.hx,hip,L.hx+(L.j.kx-L.hx)*t,hip+(L.j.ky-hip)*t,lw*1.32,lw*1.25,k.shorts);}
  if(det){c.fillStyle='rgba(0,0,0,.13)';c.fillRect(H*0.01,hip-H*0.075,wW*1.05,H*0.11);ln(c,-wW*1.02,hip-H*0.065,-wW*1.08,hip+H*0.045,Math.max(0.8,H*0.013),k.trim);ln(c,wW*1.02,hip-H*0.065,wW*1.08,hip+H*0.045,Math.max(0.8,H*0.013),k.trim);
    if(front&&H>40){c.font=`800 ${Math.round(H*0.055)}px "Saira Extra Condensed",sans-serif`;c.textAlign='center';c.fillStyle=k.trim;c.fillText(e.num,-wW*0.55,hip+H*0.02);}}
  /* gövde */
  const sh=-H*0.795;
  c.beginPath();c.moveTo(-sW,sh+H*0.045);c.quadraticCurveTo(-sW,sh-H*0.008,-sW+H*0.055,sh-H*0.01);c.lineTo(sW-H*0.055,sh-H*0.01);c.quadraticCurveTo(sW,sh-H*0.008,sW,sh+H*0.045);c.quadraticCurveTo(sW*0.92,sh+H*0.16,wW,wa);c.lineTo(-wW,wa);c.quadraticCurveTo(-sW*0.92,sh+H*0.16,-sW,sh+H*0.045);c.closePath();
  c.fillStyle=k.shirt;c.fill();c.save();c.clip();
  if(k.pat){c.fillStyle=k.trim;if(k.pat===1)c.fillRect(0,sh-H*0.02,H*0.25,wa-sh+H*0.03);else if(k.pat===2)for(let i=-2;i<=2;i++)c.fillRect(i*H*0.07-H*0.017,sh-H*0.02,H*0.034,wa-sh+H*0.03);
    else if(k.pat===3){c.beginPath();c.moveTo(-H*0.2,sh+H*0.02);c.lineTo(-H*0.1,sh);c.lineTo(H*0.2,wa-H*0.05);c.lineTo(H*0.1,wa);c.closePath();c.fill();}else if(k.pat===4)c.fillRect(-H*0.2,sh+H*0.08,H*0.4,H*0.07);}
  if(det){const g=c.createLinearGradient(-sW,0,sW,0);g.addColorStop(0,'rgba(255,255,255,.14)');g.addColorStop(0.42,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.24)');c.fillStyle=g;c.fillRect(-sW,sh-H*0.02,sW*2,wa-sh+H*0.04);
    c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=Math.max(0.8,H*0.008);c.beginPath();c.moveTo(-sW*0.4,sh+H*0.1);c.quadraticCurveTo(-sW*0.1,sh+H*0.17,-sW*0.3,wa-H*0.02);c.moveTo(sW*0.45,sh+H*0.08);c.quadraticCurveTo(sW*0.2,sh+H*0.19,sW*0.4,wa-H*0.03);c.stroke();
    if(front&&H>34){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-sW*0.55,sh+H*0.1,sW*1.1,H*0.045);}}
  c.restore();
  if(front){c.strokeStyle=k.trim;c.lineWidth=Math.max(1,H*0.02);c.beginPath();c.moveTo(-H*0.05,sh-H*0.006);c.lineTo(0,sh+H*0.045);c.lineTo(H*0.05,sh-H*0.006);c.stroke();
    if(H>40){c.font=`800 ${Math.round(H*0.07)}px "Saira Extra Condensed",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=k.num;c.fillText(e.num,H*0.075,sh+H*0.075);}}
  else{ln(c,-H*0.05,sh,H*0.05,sh,Math.max(1,H*0.022),k.trim);
    if(H>16){c.font=`800 ${Math.round(H*0.17)}px "Saira Extra Condensed",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=Math.max(1,H*0.025);c.strokeStyle='rgba(0,0,0,.35)';c.strokeText(e.num,0,sh+H*0.15);c.fillStyle=k.num;c.fillText(e.num,0,sh+H*0.15);
      const nm=e.isC?trUp(PF()):e.pname?trUp(String(e.pname).split(' ').slice(-1)[0]):'';if(nm&&H>48){c.font=`800 ${Math.round(H*0.05)}px "Saira Extra Condensed",sans-serif`;c.fillStyle=k.num;c.fillText(nm.slice(0,12),0,sh+H*0.055);}}}
  /* kollar */
  for(const i of [-1,1]){const p=e.ph+(i>0?0:Math.PI),s=Math.sin(p)*mv,shx=i*(sW-H*0.012),shy=sh+H*0.035;let ex,ey,hx,hy;
    if(celK==='ucak'){ex=i*H*0.26;ey=sh+H*0.02;hx=i*H*0.44;hy=sh+H*0.0;}
    else if(celK==='yumruk'&&i===1){const u=Math.sin(S.t*14)>0;ex=i*H*0.2;ey=sh-H*(u?0.02:-0.08);hx=i*H*0.16;hy=sh-H*(u?0.2:0.04);}
    else if(celK||air){ex=i*H*0.22;ey=sh-H*0.08;hx=i*H*0.26;hy=sh-H*0.25;}
    else if(e.isGK&&!e.diving){ex=i*H*(gkReady?0.18:0.22);ey=sh+H*(gkReady?0.14:0.12);hx=i*H*(gkReady?0.12:0.27);hy=sh+H*(gkReady?0.2:0.04);}
    else if(kick>=0){const out=i===(-(side||1))?1:0.4;ex=i*H*0.22*out+i*H*0.04;ey=sh+H*0.12;hx=i*H*0.32*out+i*H*0.03;hy=sh+H*0.16;}
    else{const sw2=side?side*s:0;ex=i*H*0.19*bw+sw2*H*0.07;ey=sh+H*0.15+(front?1:-1)*s*H*0.03;hx=ex+sw2*H*(sprint?0.09:0.05)+i*H*0.012;hy=ey+H*(sprint?0.08:0.13)-(sprint?Math.abs(s)*H*0.04:0);}
    const mx=shx+(ex-shx)*0.6,my=shy+(ey-shy)*0.6,sleeve=e.isGK?k.shirt:k.shirt,fore=e.isGK?k.shirt:skin;
    limb(c,shx,shy,ex,ey,lw*0.92,lw*0.74,e.isGK?k.shirt:skin);limb(c,shx,shy,mx,my,lw*1.08,lw*0.98,sleeve);
    if(det&&!e.isGK)limb(c,mx,my,mx+(ex-shx)*0.06,my+(ey-shy)*0.06,lw*1.0,lw*0.98,k.trim);
    limb(c,ex,ey,hx,hy,lw*0.72,lw*0.6,fore);
    if(e.capt&&i===-1&&H>12)limb(c,shx+(ex-shx)*0.25,shy+(ey-shy)*0.25,shx+(ex-shx)*0.45,shy+(ey-shy)*0.45,lw*1.12,lw*1.08,'#ffd21f');
    c.fillStyle=e.isGK?'#f2f2f2':skD;c.beginPath();c.arc(hx,hy,lw*(e.isGK?0.62:0.4),0,7);c.fill();}
  /* baş */
  const hr=H*0.082,hy=-H*0.9+(air?-H*0.01:0);
  c.fillStyle=shade(skin,-0.18);c.fillRect(-hr*0.42,hy+hr*0.5,hr*0.84,hr*0.8);
  drawHairBack(c,e,0,hy,hr);
  if(det){c.fillStyle=shade(skin,-0.1);c.beginPath();c.arc(-hr*0.97,hy+hr*0.12,hr*0.22,0,7);c.arc(hr*0.97,hy+hr*0.12,hr*0.22,0,7);c.fill();}
  c.fillStyle=skin;c.beginPath();c.ellipse(0,hy,hr*0.94,hr,0,0,7);c.fill();
  if(det){c.save();c.beginPath();c.ellipse(0,hy,hr*0.94,hr,0,0,7);c.clip();c.fillStyle='rgba(0,0,0,.1)';c.beginPath();c.arc(hr*0.55,hy+hr*0.1,hr*0.85,0,7);c.fill();c.restore();}
  if(front&&e.bd&&e.bd!=='mus'&&H>12){c.fillStyle=e.hair;c.globalAlpha=e.bd==='stub'?0.32:0.88;c.beginPath();if(e.bd==='goatee')c.ellipse(0,hy+hr*0.72,hr*0.3,hr*0.26,0,0,7);else c.ellipse(0,hy+hr*0.28,hr*0.9,hr*0.74,0,0.06*Math.PI,0.94*Math.PI);c.fill();c.globalAlpha=1;}
  drawHair(c,e,0,hy,hr,front);
  if(front&&H>14){const er=Math.max(0.7,hr*0.13),lk=side*hr*0.12;c.fillStyle='#fff';if(H>34){c.beginPath();c.ellipse(-hr*0.36+lk,hy+hr*0.1,er*1.6,er*1.15,0,0,7);c.ellipse(hr*0.36+lk,hy+hr*0.1,er*1.6,er*1.15,0,0,7);c.fill();}
    c.fillStyle='#1a120c';c.beginPath();c.arc(-hr*0.36+lk*1.4,hy+hr*0.1,er,0,7);c.fill();c.beginPath();c.arc(hr*0.36+lk*1.4,hy+hr*0.1,er,0,7);c.fill();
    if(H>26){c.strokeStyle=e.hs==='bald'?shade(skin,-0.45):e.hair;c.lineWidth=Math.max(0.8,hr*0.11);c.beginPath();c.moveTo(-hr*0.55+lk,hy-hr*0.14);c.lineTo(-hr*0.18+lk,hy-hr*(celK?0.26:0.18));c.moveTo(hr*0.18+lk,hy-hr*(celK?0.26:0.18));c.lineTo(hr*0.55+lk,hy-hr*0.14);c.stroke();
      c.strokeStyle=shade(skin,-0.3);c.lineWidth=Math.max(0.7,hr*0.07);c.beginPath();c.moveTo(lk,hy+hr*0.15);c.lineTo(lk+hr*0.06,hy+hr*0.38);c.stroke();
      if(e.bd==='mus'||e.bd==='full'||e.bd==='goatee'){c.fillStyle=e.hair;c.beginPath();c.ellipse(lk,hy+hr*0.47,hr*0.3,hr*0.09,0,0,7);c.fill();}
      if(celK){c.fillStyle='#3a1212';c.beginPath();c.ellipse(lk,hy+hr*0.6,hr*0.2,hr*0.17,0,0,7);c.fill();}
      else{c.strokeStyle=shade(skin,-0.4);c.lineWidth=Math.max(0.8,hr*0.09);c.beginPath();c.moveTo(-hr*0.24+lk,hy+hr*0.58);c.quadraticCurveTo(lk,hy+hr*(sprint?0.66:0.64),hr*0.24+lk,hy+hr*0.58);c.stroke();}}}
  c.restore();}

function drawBall(c,b){const P=proj(b.x,b.y,b.z+0.11);if(!P)return;const r=Math.max(2.4,0.115*P.s*1.25);
  c.save();c.translate(P.x,P.y);c.fillStyle='#fafafa';c.beginPath();c.arc(0,0,r,0,7);c.fill();c.clip();c.fillStyle='#1d1f24';
  for(let i=0;i<3;i++){const a=b.rot*0.6+i*2.094;c.beginPath();c.arc(Math.cos(a)*r*0.62,Math.sin(b.rot+i*2.094)*r*0.55,r*0.3,0,7);c.fill();}
  c.restore();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=1;c.beginPath();c.arc(P.x,P.y,r,0,7);c.stroke();}
function drawBallShadow(c,b){const P=proj(b.x,b.y,0);if(!P)return;const r=Math.max(2.2,0.115*P.s*1.25)*(1+Math.min(1,b.z/4)*0.3);c.fillStyle=`rgba(0,0,0,${(0.38/(1+b.z*0.4)).toFixed(3)})`;c.beginPath();c.ellipse(P.x+b.z*0.5,P.y,r*1.05,r*0.5,0,0,7);c.fill();}
function drawParts(c){for(const p of MG.S.parts){const P=proj(p.x,p.y,p.z);if(!P)continue;const s=Math.max(1.5,p.sz*P.s);c.fillStyle=p.col;c.globalAlpha=Math.min(1,p.life*2);c.fillRect(P.x-s/2,P.y-s/2,s,s*(p.conf?0.6:1));}c.globalAlpha=1;}
function bubble(c,e,txt){const P=proj(e.x,e.y,2.45);if(!P)return;c.font='800 11px "Barlow Semi Condensed",sans-serif';const w=c.measureText(txt).width+12;c.fillStyle='rgba(242,239,228,.95)';rr(c,P.x-w/2,P.y-20,w,17,6);c.fill();c.fillStyle='#17241c';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,P.x,P.y-11.5);}
function drawPreview(c){const S=MG.S,b=S.ball,{v,tz,om}=setParams(S.charge>=0?S.charge:0.6),d=Math.hypot(S.aim.x-b.x,b.y);let ang=Math.atan2(-b.y,S.aim.x-b.x);if(om)ang=aimCurve(ang,v,om,d);
  let x=b.x,y=b.y,vx=Math.cos(ang)*v,vy=Math.sin(ang)*v,o=om,z=0.11,trav=0;const t=d/(v*0.975);let vz=(tz-0.11+0.5*GRAV*t*t)/t;const dt=1/60;c.fillStyle='#ffffff';
  for(let i=0;i<120;i++){const a=o*dt,cs=Math.cos(a),sn=Math.sin(a),n=vx*cs-vy*sn;vy=vx*sn+vy*cs;vx=n;o*=Math.pow(0.55,dt);vz-=GRAV*dt;z+=vz*dt;x+=vx*dt;y+=vy*dt;trav+=v*dt;if(trav>d*0.45)break;
    if(i%3===0){const P=proj(x,y,Math.max(0,z));if(P){c.globalAlpha=Math.max(0,0.9-trav/(d*0.5));c.beginPath();c.arc(P.x,P.y,2.2,0,7);c.fill();}}}c.globalAlpha=1;}
function drawOverlay(c){const S=MG.S,b=S.ball,ce=S.hero,W=MG.W;if(S.phase==='replay')return rpOverlay(c);if(S.pressing&&S.pressT)ring(c,S.pressT.x,S.pressT.y,0.8,'rgba(255,179,32,.9)',2.2);
  for(const t of actMates()){const P=proj(t.x,t.y,1);if(!P||(P.x>=4&&P.x<=W-4))continue;const d=P.x<4?-1:1,x=d<0?11:W-11,y=clamp(P.y,96,MG.H*0.55);
    c.fillStyle=t.kit.shirt;c.strokeStyle='#ffffff';c.lineWidth=1.5;c.beginPath();c.moveTo(x+d*7,y);c.lineTo(x-d*5,y-8);c.lineTo(x-d*5,y+8);c.closePath();c.fill();c.stroke();}
  if(S.mode==='atk'&&S.phase==='play'&&b.owner===ce){const t=passPick();if(t){const P=proj(t.x,t.y,2.35);if(P){const s=Math.max(5,P.s*0.32);c.fillStyle='rgba(255,255,255,.95)';c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.beginPath();c.moveTo(P.x,P.y+s);c.lineTo(P.x-s,P.y-s*0.5);c.lineTo(P.x+s,P.y-s*0.5);c.closePath();c.fill();c.stroke();}}}
  if(S.mode==='air'&&S.kicked&&S.drop&&b.kind==='cross')ring(c,S.drop.x,S.drop.y,0.9,'rgba(255,179,32,.9)',2.2);
  if(S.phase==='play'&&!S.kicked){if(S.ck==='def'&&S.myMan)bubble(c,S.myMan,'ADAMIN');if(S.ck==='box'){const m=S.opps.find(o=>o.mk===ce);if(m)bubble(c,m,'MARKÖRÜN');}}
  if(S.mode==='cp'&&S.phase==='play'&&b.owner&&b.owner.side==='opp')bubble(c,b.owner,'PRES!');
  const P=proj(ce.x,ce.y,2.3+(ce.z||0));
  if(P){c.font='800 12px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.6)';const CNM=trUp(PF());c.strokeText(CNM,P.x,P.y-2);c.fillStyle='#ffb320';c.fillText(CNM,P.x,P.y-2);
    if(S.cond<25){c.font='800 10px "Barlow Semi Condensed",sans-serif';c.strokeText('YORGUN',P.x,P.y+10);c.fillStyle='#ff8a84';c.fillText('YORGUN',P.x,P.y+10);}
    if(S.C.knock){c.font='800 10px "Barlow Semi Condensed",sans-serif';const yy=P.y+(S.cond<25?21:10);c.strokeText('AĞRILI',P.x,yy);c.fillStyle='#ff8a84';c.fillText('AĞRILI',P.x,yy);}
    if(S.charge>=0&&S.mode==='atk'){const w=46,h=6,x=P.x-w/2,y=P.y-22;c.fillStyle='rgba(0,0,0,.65)';c.fillRect(x-1,y-1,w+2,h+2);const cap=condPow(S.cond);if(cap<1){c.fillStyle='rgba(120,30,30,.8)';c.fillRect(x+w*cap,y,w*(1-cap),h);}const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#4ad27f');g.addColorStop(0.65,'#ffb320');g.addColorStop(1,'#ef3b36');c.fillStyle=g;c.fillRect(x,y,w*S.charge,h);}}
  if(S.mode==='set'&&!S.kicked&&S.phase!=='end'){const A=S.type==='korner'?null:proj(S.aim.x,0,S.aim.z);
    if(A){const r=Math.max(7,A.s*0.32);c.strokeStyle='#ffb320';c.lineWidth=2.2;c.beginPath();c.arc(A.x,A.y,r,0,7);c.moveTo(A.x-r*1.6,A.y);c.lineTo(A.x-r*0.5,A.y);c.moveTo(A.x+r*0.5,A.y);c.lineTo(A.x+r*1.6,A.y);c.moveTo(A.x,A.y-r*1.6);c.lineTo(A.x,A.y-r*0.5);c.moveTo(A.x,A.y+r*0.5);c.lineTo(A.x,A.y+r*1.6);c.stroke();}
    if(S.type==='serbest')drawPreview(c);if(S.type==='korner')drawCkPreview(c);
    const bx=W/2,by=MG.H*0.52;
    if(S.charge>=0){const w=120,x=bx-w/2;c.fillStyle='rgba(0,0,0,.65)';c.fillRect(x-2,by-2,w+4,12);const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#4ad27f');g.addColorStop(0.7,'#ffb320');g.addColorStop(0.82,'#ef3b36');g.addColorStop(1,'#ef3b36');c.fillStyle=g;c.fillRect(x,by,w*S.charge,8);c.fillStyle='#fff';c.fillRect(x+w*0.82,by-3,1.5,14);}
    if((S.type==='serbest'||S.type==='korner')&&Math.abs(S.spin)>0.04){c.font='800 15px "Saira Extra Condensed",sans-serif';c.textAlign='center';c.fillStyle='#ffb320';c.fillText(`FALSO ${S.spin>0?'▶'.repeat(1+Math.round(Math.abs(S.spin)*2)):'◀'.repeat(1+Math.round(Math.abs(S.spin)*2))}`,bx,by-10);}}}
function drawWeather(c){const S=MG.S;if(!S||S.wx==='acik'||S.wx==='ruzgar')return;const W=MG.W,H=MG.H,t=performance.now()/1000;
  if(S.wx==='yagmur'){c.strokeStyle='rgba(200,220,255,.35)';c.lineWidth=1;c.beginPath();for(let i=0;i<90;i++){const x=((i*97.3+t*40*(1+i%3))%(W+40))-20,y=((i*53.7+t*620)%(H+40))-20;c.moveTo(x,y);c.lineTo(x-3,y+13);}c.stroke();}
  else{c.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<70;i++){const x=((i*91.7+Math.sin(t+i)*20)%W+W)%W,y=((i*47.3+t*60*(1+i%3))%(H+20))-10;c.fillRect(x,y,2.2,2.2);}}}
function mgDraw(){const S=MG.S,c=MG.ctx,W=MG.W,H=MG.H;if(!S||!c)return;
  c.setTransform(MG.dpr,0,0,MG.dpr,0,0);if(MG.shake>0.2)c.translate(rnd(-MG.shake,MG.shake),rnd(-MG.shake,MG.shake));
  c.fillStyle=MG.sky;c.fillRect(-20,-20,W+40,H+40);
  drawStands(c);drawPitch(c);drawBoards(c);drawGoalBack(c);if(S.gates)drawGates(c);
  const b=S.ball;if(b.y<0)drawBall(c,b);drawPosts(c);
  for(const e of S.all)drawShadow(c,e);drawBallShadow(c,b);
  const list=S.all.map(e=>({e,k:e.y}));if(b.y>=0)list.push({e:b,k:b.y+(b.owner||b.held?0.7:0)});list.sort((p,q)=>p.k-q.k);
  for(const it of list){if(it.e===b)drawBall(c,b);else drawPlayer(c,it.e);}
  drawParts(c);drawWeather(c);drawOverlay(c);
  c.setTransform(MG.dpr,0,0,MG.dpr,0,0);c.drawImage(MG.vig,0,0,W,H);}

/* ---------- Telefon kontrolleri ---------- */
const PADL={own:[['KOŞ','dokun: çalım'],['PAS','tut: ara pas'],['ŞUT','kısa: aşırtma']],mate:[['KOŞ',''],null,['ŞUT','ilk vuruş']],
  free:[['KOŞ',''],['PAS',''],['ŞUT','vole']],def:[['KOŞ',''],['MÜDAHALE','ayakta'],['KAY','kayarak'],['PRES','basılı tut']],
  pen:[null,null,['ŞUT','basılı tut']],fk:[null,null,['ŞUT','basılı: falso']],none:[null,null,null],
  ck:[null,null,['ORTA','basılı tut']],aair:[['KOŞ','sıyrıl'],null,['KAFA','zamanla']],dair:[['KOŞ',''],['KAFA','uzaklaştır'],['KAFA','zıpla']],run:[['KOŞ','depar'],null,null]};
function padCtx(){const S=MG.S;let k='none';
  if(S&&S.phase!=='end'&&S.phase!=='replay'){if(S.mode==='def'||S.mode==='cp')k='def';else if(S.mode==='air')k=S.ck==='take'?'none':S.ck==='def'?'dair':'aair';else if(S.type==='tr_kos')k='run';else if(S.mode==='set')k=S.kicked?'none':(S.type==='penalti'?'pen':S.type==='korner'?'ck':'fk');else{const o=S.ball.owner;k=o===S.hero?'own':(o&&o.side==='us')?'mate':'free';}}
  if(k===MG.padK)return;MG.padK=k;const L=PADL[k];applyLayout(k==='def'||k==='dair'?'def':'atk');
  ['btnC','btnB','btnA','btnD'].forEach((id,i)=>{const el=document.getElementById(id),l=L[i];el.classList.toggle('off',!l);
    el.innerHTML=l?`<span${l[0].length>5?' class="long"':''}>${l[0]}</span>${l[1]?`<small>${l[1]}</small>`:''}`:'';el.setAttribute('aria-label',l?l[0]:'');});
  $('#joyLbl').textContent=k==='pen'||k==='fk'?'NİŞAN':k==='ck'?'HEDEF':'';}
function hudUpdate(){const S=MG.S;if(!S)return;const tl=S.mode==='set'&&!S.kicked?1:clamp(1-S.live/S.limit,0,1),w=Math.round(tl*100),tm=$('#mgTimer');
  if(tm._w!==w){tm._w=w;tm.style.width=w+'%';tm.classList.toggle('low',tl<0.25);}
  const pv=Math.round((S.charge>=0?S.charge:0)*40)/40,ba=$('#btnA');if(ba._p!==pv){ba._p=pv;ba.style.setProperty('--p',pv);}
  const cd=Math.round(S.cond),ce=$('#mgCond');if(ce._c!==cd){ce._c=cd;ce.style.width=cd+'%';ce.className=condCls(cd);$('#mgCondT').textContent=cd<25?`KONDİSYON ${cd} · YORGUN`:`KONDİSYON ${cd}`;}
  padCtx();}
function keyJoy(){if(MG.joyOn)return;const k=IN.keys;let x=(k.has('R')?1:0)-(k.has('L')?1:0),y=(k.has('D')?1:0)-(k.has('U')?1:0);const m=Math.hypot(x,y)||1;ctlSetJ(x/m,y/m);}
function padInit(){
  /* v142: joystick sabit ya da serbest olabilir; dinlenme yeri ve boyutu ctlApply (169) ile ayarlanır */
  const zone=$('#joyZone'),joy=$('#joy'),knob=$('#joyKnob');let R=50,jid=null,ox=0,oy=0,fixed=false;
  const rest=()=>{joy.classList.remove('on');const r=MG.joyRest;joy.style.left=r?r.x+'px':'';joy.style.top=r?r.y+'px':'';knob.style.transform='';ctlSetJ(0,0);MG.joyOn=false;};
  MG.joyRestFn=()=>{if(jid!==null)return;const r=MG.joyRest;joy.style.left=r?r.x+'px':'';joy.style.top=r?r.y+'px':'';};
  zone.addEventListener('pointerdown',e=>{if(jid!==null)return;e.preventDefault();jid=e.pointerId;try{zone.setPointerCapture(jid);}catch(_){}
    const r=zone.getBoundingClientRect();R=50*(MG.joyM||1);fixed=ctlCfg().joy==='fixed'&&!!MG.joyRest;
    if(fixed){ox=r.left+MG.joyRest.x;oy=r.top+MG.joyRest.y;}else{ox=e.clientX;oy=e.clientY;joy.style.left=(e.clientX-r.left)+'px';joy.style.top=(e.clientY-r.top)+'px';}
    joy.classList.add('on');MG.joyOn=true;if(fixed)mv(e);});
  const mv=e=>{let dx=e.clientX-ox,dy=e.clientY-oy,d=Math.hypot(dx,dy);
    if(!fixed&&d>R*1.35){const k=(d-R*1.35)/d;ox+=dx*k;oy+=dy*k;const r=zone.getBoundingClientRect();joy.style.left=(ox-r.left)+'px';joy.style.top=(oy-r.top)+'px';dx=e.clientX-ox;dy=e.clientY-oy;d=Math.hypot(dx,dy);}
    const cl=Math.min(d,R),nx=d?dx/d:0,ny=d?dy/d:0;knob.style.transform=`translate(${nx*cl}px,${ny*cl}px)`;
    const dz=7*(MG.joyM||1),mag=d<dz?0:Math.min(1,(d-dz)/(R-dz));ctlSetJ(nx*mag,ny*mag);};
  zone.addEventListener('pointermove',e=>{if(e.pointerId!==jid)return;e.preventDefault();mv(e);});
  const end=e=>{if(e.pointerId!==jid)return;jid=null;rest();};
  zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
  document.querySelectorAll('.pbtn').forEach(btn=>{const b=btn.dataset.b;let pid=null;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();if(pid!==null||btn.classList.contains('off'))return;pid=e.pointerId;try{btn.setPointerCapture(pid);}catch(_){}press(b);btn.classList.add('on');});
    const up=e=>{if(e.pointerId!==pid)return;pid=null;release(b);btn.classList.remove('on');};
    btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('contextmenu',e=>e.preventDefault());});
  $('#mvStage').addEventListener('contextmenu',e=>e.preventDefault());
  /* v142: klavye tuşları Ayarlar → Kontroller'den değiştirilebilir (ctl_keys_v142) */
  document.addEventListener('keydown',e=>{if(!MG.S||$('#mvStage').hidden||e.ctrlKey||e.metaKey||e.altKey)return;const a=ctlKeyAct(e);if(!a)return;
    if(CTL_MV[a]){IN.keys.add(CTL_MV[a]);keyJoy();e.preventDefault();}else if(CTL_BT[a]){if(!e.repeat)press(CTL_BT[a]);e.preventDefault();}else{if(!e.repeat)ctlCmd(a);e.preventDefault();}});
  document.addEventListener('keyup',e=>{const a=ctlKeyAct(e);if(!a)return;if(CTL_MV[a]){IN.keys.delete(CTL_MV[a]);keyJoy();}else if(CTL_BT[a])release(CTL_BT[a]);});
  window.addEventListener('blur',()=>{if(MG.S){IN.keys.clear();keyJoy();}});
  window.addEventListener('resize',()=>{if(MG.S&&!$('#mvStage').hidden)mgSetup();});
}

