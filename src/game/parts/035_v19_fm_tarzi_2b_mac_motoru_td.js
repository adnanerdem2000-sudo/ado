/* ================= v19: FM tarzı 2B maç motoru (TD) ================= */
let FX=null;const FXL=105,FXW=68;
const FX_SHOUT={cesaret:['Cesaretlendir','Hata korkusu azalır, isabet artar.'],iste:['Daha fazlasını iste','Pres ve tempo artar, oyuncular daha çabuk yorulur.'],odak:['Odaklan','Basit hatalar ve kartlar azalır.'],sakin:['Sakin ol','Faul ve kart azalır, tempo düşer.'],atesle:['Ateşle','Ikili mücadele gücü artar, kart riski de.'],ovgu:['Övgü','Moral yükselir, özgüven artar.']};
function fxTac(ti,tac){const g=(k,d)=>ti&&ti[k]?ti[k]:d;const men=tac==='hucum'?1:tac==='savunma'?-1:tac==='pres'?0.3:0;
  return {men,line:{derin:-7,nor:0,yuksek:7}[g('hat','nor')]+(tac==='pres'?3:0),zone:{dus:38,orta:58,yuk:110}[g('pres','orta')]+(tac==='pres'?20:0),pressN:{az:1,nor:2,cok:3}[g('yog','nor')]+(tac==='pres'?1:0),
    agg:g('mud','nor')==='sert'?1.3:g('mud','nor')==='yum'?0.8:1,width:{dar:0.82,nor:1,gen:1.15}[g('gen','nor')],dec:{dus:4.2,nor:3.4,yuk:2.5}[g('tempo','nor')],
    plen:{kisa:-1,kar:0,direkt:1}[g('pas','kar')],cross:{az:0.4,nor:1,bol:1.9}[g('orta','nor')],srange:{sabir:17,nor:22,uzak:28}[g('sut','nor')],drib:{az:0.5,nor:1,cok:1.7}[g('drip','nor')],
    thr:{hayir:0.4,nor:1,evet:1.9}[g('arka','nor')],lean:{sol:-1,kar:0,mer:0,sag:1}[g('yon','kar')],mer:g('yon','kar')==='mer',cpress:g('kayip','nor')==='karsi',retreat:g('kayip','nor')==='geri',
    counter:g('kazan','nor')==='kontra',keep:g('kazan','nor')==='tut',gk:g('kaleci','kar'),fast:g('set','nor')==='hizli',slow:g('set','nor')==='yavas',mark:g('mark','alan')==='adam',ofs:g('ofs','hayir')==='evet',push:g('yonl','nor')};}
function fxAI(opp,me){const d=(opp.str-me.str);if(d>=4)return {tac:'dengeli',ti:{pas:'kisa',pres:'yuk',kayip:'karsi',hat:'yuksek',gen:'gen'}};if(d<=-5)return {tac:'savunma',ti:{pres:'dus',hat:'derin',kazan:'kontra',pas:'direkt',arka:'evet'}};
  return pick([{tac:'dengeli',ti:{}},{tac:'dengeli',ti:{tempo:'yuk',pres:'yuk'}},{tac:'hucum',ti:{orta:'bol',gen:'gen'}}]);}
function fxPA(p){const a=pAttrs(p).map(x=>x[1]);return p.pos==='KL'?{sh:30,pa:Math.round(a[3]*0.6+30),dr:30,sp:a[4],ph:a[5],df:40,gk:Math.round((a[0]*2+a[1]+a[2])/4)}:{sh:a[0],pa:a[1],dr:a[2],sp:a[3],ph:a[4],df:a[5],gk:20};}
function fxPickXI(sq,form){const S=FMF[form],used=new Set(),xi=Array(11).fill(null);const PO={KL:0,FW:1,KN:2,DF:3,OS:4},ord=[...Array(11).keys()].sort((a,b)=>PO[S[a][0]]-PO[S[b][0]]);
  for(const pass of [0,1])for(const i of ord){if(xi[i])continue;const c=sq.filter(p=>!used.has(p.k)&&(pass||p.pos===S[i][0])).sort((a,b)=>(b.ovr-dpPen(b,S[i]))-(a.ovr-dpPen(a,S[i])))[0];if(c){xi[i]=c;used.add(c.k);}}return xi;}
function fxExtSquad(e){const r=srng(e.id+'ext'),cc=Object.keys(NAMEP)[Math.floor(r()*Object.keys(NAMEP).length)],P=NAMEP[cc];
  return SQ_POS.map((pos,i)=>({k:e.id+'#x'+i,name:P.f[Math.floor(r()*P.f.length)]+' '+P.l[Math.floor(r()*P.l.length)],pos,age:20+Math.floor(r()*14),ovr:Math.round(e.str+(SQ_STARTER[i]?r()*6-2:-3-r()*6)),num:SQ_NUM[i],nat:e.nat||'TUR',k2:1}));}
function fxTeam(side,club,xiPlayers,form,roles,tac,ti,bench,boost){const S=FMF[form],T={side,id:club.id,name:club.name,short:club.short,c1:club.c1,c2:club.c2,form,tacK:tac,ti:Object.assign({},ti),tac:fxTac(ti,tac),dir:side===0?1:-1,bench:bench.slice(),subs:0,P:[],boost:boost||0,sh:null};
  const ds=S.map(s=>s[2]),dmin=Math.min(...ds.filter((d,i)=>S[i][0]!=='KL')),dmax=Math.max(...ds);
  xiPlayers.forEach((p,i)=>{if(!p)return;T.P.push(fxMkP(T,p,i,S,roles,dmin,dmax));});return T;}
function fxMkP(T,p,i,S,roles,dmin,dmax){const s=S[i],kind=slotKind(s),r=roles&&roles[i]?roles[i]:{r:FMR[kind][0][0],d:'des'};const a=fxPA(p),b=T.boost;for(const k in a)a[k]=clamp(65+(a[k]+b-65)*0.55,10,99);
  return {k:p.k,name:p.name,sur:ksur(p.name),num:p.num||i+1,pos:p.pos,slot:i,spos:s[0],kind,d:s[0]==='KL'?0:(s[2]-dmin)/Math.max(0.01,dmax-dmin),l:s[1],role:r.r,duty:r.d||'des',a,ovr:70+(p.ovr+b-70)*0.55,T,x:0,y:0,tx:0,ty:0,st:100,cool:0,run:0,rt:6.3,s:{pa:0,pc:0,sh:0,son:0,g:0,as:0,tk:0,sv:0},yel:0,off:false,pen:dpPen(p,s)};}
function fxStart(o){const m=fmInit(),me=myClub(),opp=o.opp,sqU=squadOf(G.club),xiK=mgrXI(),byK={};sqU.forEach(p=>byK[p.k]=p);
  const xiU=xiK.map(k=>byK[k]),inj=m.inj||{},ban=m.ban||{},benchU=sqU.filter(p=>!xiK.includes(p.k)&&!inj[p.k]&&!ban[p.k]).sort((a,b)=>b.ovr-a.ovr).slice(0,9);
  const raw=xiU.filter(Boolean).reduce((a,p)=>a+p.ovr,0)/Math.max(1,xiU.filter(Boolean).length),bU=clamp(xiStr()-raw,-4,4)+(o.usHome&&!o.neutral?1.5:0);
  const sqO=CLUBS[opp.id]?squadOf(opp.id):fxExtSquad(opp),co=CLUBS[opp.id]?coachOf(opp.id):{f:'4-3-3'},fO=FMF[co.f]?co.f:'4-2-3-1',xiO=fxPickXI(sqO,fO),benchO=sqO.filter(p=>!xiO.includes(p)).sort((a,b)=>b.ovr-a.ovr).slice(0,7);
  const ai=fxAI(opp,me),rawO=xiO.filter(Boolean).reduce((a,p)=>a+p.ovr,0)/11,bO=clamp(opp.str-rawO,-3,3)*0.5+(!o.usHome&&!o.neutral?1.5:0);
  const pcb=(m.pcOpp||0)*0.4;m.pcOpp=0;const U=fxTeam(0,me,xiU,m.fm.f,m.fm.roles,m.tac,m.fm.ti,benchU,bU),O=fxTeam(1,opp,xiO,fO,null,ai.tac,ai.ti,benchO,bO+pcb);
  U.famF=clamp((m.fm.fam||50)/100,0.2,1);O.famF=0.7;
  FX={o,U,O,T:[U,O],t:0,half:1,end:90*60+rint(1,4)*60,ht:45*60+rint(0,2)*60,score:[0,0],ball:{x:52.5,y:34,z:0,own:null,fl:null,last:null},spd:2,run:false,ev:[],scorers:[],stats:[{pos:0,sh:0,son:0,xg:0,pc:0,pa:0,fo:0,co:0,yc:0},{pos:0,sh:0,son:0,xg:0,pc:0,pa:0,fo:0,co:0,yc:0}],
    dec:0,setT:0,tab:'ev',sel:null,shoutT:-999,adv:[],lastAdv:0,phase:'pre',trail:[],flash:null,aiT:0,hl:0};
  fxKick(1);fxEv(0,`Hakem başlama düdüğünü çaldı. ${U.name} ${U.form}, ${O.name} ${O.form} dizilişiyle sahada.`,'');fxOpen();}
function fxLam(){const S=FX,o=S.o,me=myClub(),opp=o.opp,U=S.U,O=S.O,T=tacT(opp),Sx=xiStr(),os=opp.str;const [lh,la]=lambdas(o.usHome?Sx:os,o.usHome?os:Sx);let lu=(o.usHome?lh:la)*T.f,lo=(o.usHome?la:lh)*T.a;
  if(o.neutral){const m=(lu+lo)/2;lu=m+(lu-m)*0.85;lo=m+(lo-m)*0.85;}const om={hucum:[1.15,1.12],savunma:[0.85,0.82],pres:[1.06,1.02],dengeli:[1,1]}[O.tacK]||[1,1];lu*=om[1];lo*=om[0];
  const nu=fxOn(U).length,no=fxOn(O).length;lu*=Math.pow(0.8,11-nu)/Math.pow(0.8,11-no);lo*=Math.pow(0.8,11-no)/Math.pow(0.8,11-nu);S.lam=[clamp(lu,0.15,4.5),clamp(lo,0.15,4.5)];}
function fxFF(side){const S=FX;if(!S.lam)fxLam();const exp=S.lam[side]*Math.min(1,(S.t+300)/5400)+0.12,got=S.stats[side].xgA||0;return clamp(exp/(got+0.12/(S.ck||1)),0.45,2.6*(S.ck||1));}
/* ---------- yardımcılar ---------- */
const fxD=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fxU(T,x){return T.dir>0?x:FXL-x;}function fxV(T,y){return T.dir>0?y:FXW-y;}function fxX(T,u){return T.dir>0?u:FXL-u;}function fxY(T,v){return T.dir>0?v:FXW-v;}
const fxOpp=T=>FX.T[1-T.side];
const fxOn=T=>T.P.filter(p=>!p.off);
function fxEv(min,t,cls){FX.ev.unshift({m:min,t,c:cls||''});if(FX.ev.length>80)FX.ev.length=80;}
const fxMin=()=>Math.min(120,Math.floor(FX.t/60)+1);
function fxKick(toSide){const B=FX.ball;for(const T of FX.T)for(const p of fxOn(T)){fxTarget(p,true);p.x=p.tx;p.y=p.ty;p.cool=0;p.run=0;}
  const T=FX.T[toSide],c=fxOn(T).filter(p=>p.spos!=='KL').sort((a,b)=>Math.abs(a.y-34)+Math.abs(fxU(T,a.x)-50)-(Math.abs(b.y-34)+Math.abs(fxU(T,b.x)-50)))[0];
  B.x=52.5;B.y=34;B.z=0;B.fl=null;B.own=c;c.x=52.5-T.dir*0.5;c.y=34;B.last=c;FX.setT=1.2;}
function fxSet(T,x,y,kind){const B=FX.ball,c=fxOn(T).filter(p=>kind==='gk'?p.spos==='KL':p.spos!=='KL').sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(!c)return;
  B.x=x;B.y=y;B.z=0;B.fl=null;B.own=c;c.x=x;c.y=y;B.last=c;FX.setT=kind==='pen'?1.5:1;FX.setK=kind;}
/* ---------- konumlanma ---------- */
function fxTarget(p,reset){const T=p.T,O=fxOpp(T),B=FX.ball,tc=T.tac,bu=reset?52.5:fxU(T,B.x),bv=reset?34:fxV(T,B.y),own=B.own?B.own.T===T:(B.fl&&B.fl.from&&B.fl.from.T===T);
  let u,v;const sh=T.sh&&T.sh.until>FX.t?T.sh.k:null;
  if(p.spos==='KL'){u=(own?9:4)+(p.role==='sk'?5:0)+(own?Math.max(0,bu-60)*0.1:0);v=34+(bv-34)*0.15;}
  else{const dd=p.d+(p.duty==='huc'?0.08:p.duty==='sav'?-0.08:0)+({wb:0.1,w:0.05,if:0.06,af:0.06,sf:0.06,t10:0.03,dlp:-0.06,bw:-0.02,dm:-0.04,ns:-0.03,f9:-0.06}[p.role]||0);
    if(own||reset&&false){const adv=clamp((bu-45)/40,0,1),dd2=dd+(p.d>0.35&&p.d<0.8?adv*(p.kind==='WM'?0.3:p.kind==='CM'||p.kind==='AM'?0.14:0.06):0)-(p.spos==='FW'&&p.l>0.55&&T.P.filter(q=>q.spos==='FW'&&!q.off).length>1?0.18:0);const line=clamp(bu-32+tc.line+tc.men*5+(T.ctr>FX.pt?6:0),16,58),span=44+tc.men*6;u=line+dd2*span;
      v=34+(p.l-0.5)*62*tc.width+(bv-34)*0.22+tc.lean*4*(1-p.d);if(u>68&&(p.role==='iw'||p.role==='if'||p.role==='ifb'))v=34+(v-34)*0.6;if(p.kind==='WM'&&u>50)v=34+(v-34)*0.82;if(p.spos==='FW'&&p.l>0.55&&p.kind==='ST')v=34+(v-34)*0.5;if(tc.mer&&p.d>0.5)v=34+(v-34)*0.75;}
    else{const ret=T.ret>FX.pt?8:0,line=clamp(bu-24+tc.line-ret-(tc.men<0?3:0),bu<17?5:12,44),span=31+tc.men*3;u=line+dd*span;v=34+(p.l-0.5)*44+(bv-34)*0.45;}
    if(reset){u=Math.min(u,49);}
    if(!own&&!reset&&p.d<0.75){const gx0=fxX(T,0),wx=fxX(T,u),wy=fxY(T,v);let best=null,bd=T.tac.mark?12:8;for(const q of fxOn(O)){if(q===B.own||q.spos==='KL')continue;if(fxU(T,q.x)>40)continue;const dd=Math.hypot(q.x-wx,q.y-wy);if(dd<bd){bd=dd;best=q;}}
      if(best){const w=T.tac.mark?0.85:0.6,gy=34,dx=gx0-best.x,dy=gy-best.y,dl=Math.hypot(dx,dy)||1,mx=best.x+dx/dl*1.2,my=best.y+dy/dl*1.2;p.tx=wx*(1-w)+mx*w;p.ty=wy*(1-w)+my*w;return;}}
    if(own&&!reset){const dl=fxDefLine(O);if(p.run>FX.pt)u=Math.max(u,dl+3);else u=Math.min(u,dl-1);}}
  p.tx=fxX(T,clamp(u,1,FXL-1));p.ty=fxY(T,clamp(v,2,FXW-2));}
function fxDefLine(O){const us=fxOn(O).filter(q=>q.spos!=='KL').map(q=>FXL-fxU(O,q.x));return us.length?Math.max(...us):70;}
/* ---------- ana döngü ---------- */
function fxStep(dt){const S=FX,B=S.ball;if(S.phase!=='play')return;S.t+=dt*(S.ck||1);S.pt=(S.pt||0)+dt;if(S.setT>0)S.setT-=dt;
  if(S.half===1&&S.t>=S.ht){S.phase='ht';fxEv(45,`İlk yarı sona erdi: ${S.U.short} ${S.score[0]}-${S.score[1]} ${S.O.short}.`,'bold');return;}
  if(S.t>=S.end){S.phase='end';fxEv(90,`Maç sona erdi: ${S.U.name} ${S.score[0]}-${S.score[1]} ${S.O.name}.`,'bold');return;}
  const own=B.own?B.own.T:null;if(own)S.stats[own.side].pos+=dt;
  for(const T of S.T){const shk=T.sh&&T.sh.until>S.t?T.sh.k:null;
    for(const p of fxOn(T)){p.st=Math.max(10,p.st-dt*(S.ck||1)*(0.0075+Math.max(0,T.tac.pressN-2)*0.003+(T.tac.zone>100?0.002:0)+(T.tac.cpress?0.0015:0)+(T.tac.dec<1.4?0.0015:0)+(shk==='iste'?0.004:0))*fxStM(p));
      if(B.own===p)continue;fxTarget(p);}
    fxPress(T);}
  fxLoose();
  for(const T of S.T)for(const p of fxOn(T))fxMove(p,dt);
  if(B.fl)fxFlight(dt);else if(B.own){const c=B.own;B.x=c.x+c.T.dir*0.6;B.y=c.y;B.z=0;if(S.setT<=0){fxTackles(c,dt);if(B.own===c){c.dt=(c.dt||0)-dt;if(c.dt<=0)fxDecide(c);}}}
  else if(B.lv){B.x+=B.lv.x*dt;B.y+=B.lv.y*dt;B.lv.x*=0.92;B.lv.y*=0.92;fxBounds();}
  S.aiT-=dt;if(S.aiT<=0){S.aiT=60;fxCoachAI();if(fxMin()-S.lastAdv>=8){S.lastAdv=fxMin();fxAdvice();}}}
function fxPress(T){const S=FX,B=S.ball,O=fxOpp(T);if(!B.own||B.own.T===T)return;const tc=T.tac,shk=T.sh&&T.sh.until>S.t?T.sh.k:null,bu=fxU(T,B.x),cp=T.cpr>S.pt;
  if(!cp&&bu>tc.zone)return;const n=Math.min(3,tc.pressN+(cp?1:0)+(shk==='iste'||shk==='atesle'?1:0)-(bu<20?0:0));
  const cand=fxOn(T).filter(p=>p.spos!=='KL'&&p.cool<=0).sort((a,b)=>fxD(a,B)-fxD(b,B)).slice(0,n);
  cand.forEach((p,i)=>{const gx=fxX(T,2),gy=34;const k=i===0?0.6:2.2;let tx=B.x+(gx-B.x)/Math.max(1,Math.hypot(gx-B.x,gy-B.y))*k,ty=B.y+(gy-B.y)/Math.max(1,Math.hypot(gx-B.x,gy-B.y))*k;
    if(tc.push==='kenar'&&i===0)ty+=(B.y<34?-1:1)*0.8;p.tx=tx;p.ty=ty;p.pr=1;});
  if(tc.mark)for(const p of fxOn(T)){if(p.spos==='KL'||cand.includes(p)||p.d>0.5)continue;const a=fxOn(O).filter(q=>q!==B.own).sort((x,y)=>Math.hypot(x.x-p.tx,x.y-p.ty)-Math.hypot(y.x-p.tx,y.y-p.ty))[0];if(a&&Math.hypot(a.x-p.tx,a.y-p.ty)<12){p.tx=p.tx*0.4+(a.x+(fxX(T,0)-a.x)*0.08)*0.6;p.ty=p.ty*0.4+a.y*0.6;}}}
function fxMove(p,dt){if(p.cool>0)p.cool-=dt;const S=FX,B=S.ball;let vmax=(5.6+(p.a.sp-50)*0.018+fxSpd(p))*(0.55+0.45*p.st/100);if(B.own===p)vmax*=0.84;else if(!p.pr&&!p.chase)vmax*=0.78;p.pr=0;
  const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);if(d<0.15)return;const s=Math.min(d,vmax*dt);p.x+=dx/d*s;p.y+=dy/d*s;}
function fxLoose(){const S=FX,B=S.ball;for(const T of S.T)for(const p of T.P)p.chase=0;if(B.own||B.fl&&!B.fl.loose)return;
  const tgt=B.fl?{x:B.fl.tx,y:B.fl.ty}:B;for(const T of S.T){const c=fxOn(T).filter(p=>p.cool<=0).sort((a,b)=>fxD(a,tgt)-fxD(b,tgt))[0];if(c){c.tx=tgt.x;c.ty=tgt.y;c.chase=1;}}
  if(!B.fl){const all=S.T.flatMap(fxOn).filter(p=>p.cool<=0&&fxD(p,B)<1.3).sort((a,b)=>fxD(a,B)-fxD(b,B));if(all[0])fxGain(all[0],'loose');}}
function fxGain(p,how){const S=FX,B=S.ball,prev=B.last;B.own=p;B.fl=null;B.lv=null;p.dt=1+Math.random()*0.8;
  if(prev&&prev.T!==p.T){const T=p.T,O=prev.T;if(how==='tackle')p.s.tk++;if(T.tac.counter)T.ctr=S.pt+6;if(O.tac.cpress)O.cpr=S.pt+4;if(O.tac.retreat)O.ret=S.pt+4;
    if(how==='int')p.rt+=0.06;prev.rt-=0.03;}B.last=p;}
/* ---------- karar ---------- */
function fxPressure(c){const O=fxOpp(c.T);let m=99;for(const q of fxOn(O)){const d=fxD(q,c);if(d<m)m=d;}return m;}
function fxXG(T,x,y){const u=FXL-fxU(T,x),v=Math.abs(fxV(T,y)-34),d=Math.hypot(u,v),ang=Math.atan2(7.32*u,u*u+v*v-13.4);return clamp(0.48/(1+Math.exp((d-7.5)/3.1))*clamp(ang*1.25,0.12,1.1),0.005,0.8);}
function fxDecide(c){const S=FX,T=c.T,O=fxOpp(T),tc=T.tac,B=S.ball,u=fxU(T,c.x),v=fxV(T,c.y),pr=fxPressure(c),shk=T.sh&&T.sh.until>S.t?T.sh.k:null;
  const noise=(1.15-c.ovr/100)*(S.U===T?1.2-T.famF:1)*0.9*fxDecM(c,pr),ctr=T.ctr>S.pt,acc=1+(shk==='cesaret'||shk==='ovgu'?0.03:0)+(shk==='odak'?0.02:0);
  c.dt=tc.dec*(1.15-c.a.pa/300)*(pr<3?0.55:1)*(T.tac.slow&&!ctr?1.2:1)*(T.tac.fast||ctr?0.8:1);
  const opts=[];const gd=Math.hypot(FXL-u,v-34);
  const xg0=fxXG(T,c.x,c.y),fr=Math.min(1,S.t/5400),ES=(S.lam?S.lam[T.side]:1.3)*7.5*fr+1,dfc=clamp(ES/(S.stats[T.side].sh+1),0.6,3*Math.sqrt(S.ck||1));if(c.spos!=='KL'&&gd<=tc.srange+(c.a.sh-60)*0.12+(ctr?2:0)&&((dfc>1.7&&u>70&&gd<24)||(xg0>0.3&&pr>1/dfc)||(pr>2.2/dfc&&xg0>0.05/dfc)||(pr>3.5/dfc&&gd<26))){const xg=fxXG(T,c.x,c.y)*(1-clamp((3-pr)*0.12,0,0.3));opts.push({k:'sh',val:xg*9+(dfc-1)*0.35+(S.lam?(S.lam[T.side]-S.lam[1-T.side])*0.12:0)+(gd<16.5?0.2:-0.15)+(c.a.sh-65)*0.01+fxShV(c,gd)-(pr<1.5?0.25:0)-(tc.srange<20&&xg<0.08?0.8:0)});}
  const mates=fxOn(T).filter(p=>p!==c);
  for(const r of mates){if(r.spos==='KL'&&(u>35||pr>4))continue;const ru=fxU(T,r.x),rv=fxV(T,r.y),L=fxD(c,r);if(L<4||L>55)continue;
    let lane=99;for(const q of fxOn(O)){const t=clamp(((q.x-c.x)*(r.x-c.x)+(q.y-c.y)*(r.y-c.y))/(L*L),0,1),px=c.x+(r.x-c.x)*t,py=c.y+(r.y-c.y)*t,dd=Math.hypot(q.x-px,q.y-py);if(dd<lane)lane=dd;}
    let open=99;for(const q of fxOn(O)){const dd=fxD(q,r);if(dd<open)open=dd;}
    const inbx=FXL-ru<17&&Math.abs(rv-34)<20,p=clamp((0.985-L*0.0062*(1.3-c.a.pa/100)-Math.max(0,2.6-lane)*0.15-Math.max(0,2.2-open)*(inbx?0.2:0.09)-(inbx?0.1:0)+(c.a.pa-65)*0.0025+fxPaM(c,L)-(pr<2?0.06:0))*acc,0.2,0.985);
    const gain=ru-u,zone=ru>78&&Math.abs(rv-34)<22?0.55:ru>62?0.18:0;
    let val=p*(1+gain*0.03*(ctr?2:1)*(1+tc.men*0.25)+zone)-(1-p)*(u<35?1.3:0.7)+(tc.plen>0&&L>25?0.12:tc.plen<0&&L>25?-0.25:0)+(tc.plen<0&&L<15?0.08:0);
    if(tc.lean&&Math.sign(rv-34)===tc.lean&&ru>55)val+=0.1;if(tc.keep&&!ctr&&gain<0&&p>0.9)val+=0.08;
    opts.push({k:'pa',r,p,val:val+fxPaV(c,L,gain,p),L});
    if((r.spos==='FW'||r.spos==='KN')&&r.run>S.pt&&ru>u){const dl=fxDefLine(O);if(ru>=dl-1){const tp=clamp(p-0.17-(O.tac.ofs?0.1:0)+(fxF(c,'Vizyon')-12)*0.01,0.15,0.9);opts.push({k:'th',r,p:tp,val:tp*(1.9+0.5*tc.thr)-(1-tp)*0.5,L:L+6});}}}
  if(u>74&&Math.abs(v-34)>17){const inBox=mates.filter(q=>FXL-fxU(T,q.x)<17&&Math.abs(fxV(T,q.y)-34)<12).length;opts.push({k:'cr',val:(0.35+inBox*0.18)*tc.cross});}
  let ahead=99;for(const q of fxOn(O)){const qu=fxU(T,q.x);if(qu>u&&qu<u+10&&Math.abs(fxV(T,q.y)-v)<6){const dd=fxD(q,c);if(dd<ahead)ahead=dd;}}
  const dfc2=typeof dfc!=='undefined'?dfc:1;if(c.spos!=='KL')opts.push({k:'dr',val:(dfc2>1.5&&u>55?0.25:0)+((ahead>8?0.7+(c.a.dr-60)*0.006:0.2+(c.a.dr-c.ovr)*0.01)+(fxF(c,'Özel Yetenek')-12)*0.012+(fxF(c,'Dripling')-12)*0.008)*tc.drib*(u<30?0.5:u>80?0.55:1)+(ctr?0.2:0)});
  if(c.spos==='KL'){opts.push({k:'cl',val:tc.gk==='uzun'?1.1:tc.gk==='kisa'?0.3:0.7});}
  for(const o of opts)o.val+=(Math.random()-0.5)*noise*2.2;opts.sort((a,b)=>b.val-a.val);const ch=opts[0];if(!ch)return;
  if(ch.k==='sh')fxShoot(c,pr);else if(ch.k==='pa'||ch.k==='th')fxPass(c,ch.r,ch.p,ch.k==='th');else if(ch.k==='cr')fxCross(c);else if(ch.k==='cl')fxClear(c);
  else{c.tx=fxX(T,Math.min(FXL-2,u+8));c.ty=fxY(T,v+(34-v)*0.15);c.dt=Math.min(c.dt,0.5);for(const q of mates)if((q.spos==='FW'||q.spos==='KN')&&Math.random()<0.25*tc.thr)q.run=S.pt+2.5;}
  if(Math.random()<0.18*tc.thr)for(const q of mates)if((q.spos==='FW'||q.spos==='KN'||q.role==='wb')&&q.a.sp>60&&Math.random()<0.16+fxF(q,'Topsuz Alan')*0.012)q.run=S.pt+2.2;}
function fxPass(c,r,p,th){const S=FX,T=c.T,st=S.stats[T.side];st.pa++;c.s.pa++;const dl=fxDefLine(fxOpp(T)),ru=fxU(T,r.x);if(r.spos!=='KL'&&ru>dl+2.5&&ru>fxU(T,c.x)+2&&ru>FXL/2&&(!(th||r.run>S.pt)||(fxOpp(T).tac.ofs&&Math.random()<0.3))&&Math.random()<0.5){fxEv(fxMin(),`${r.name} ofsayta yakalandı.`,'');fxSet(fxOpp(T),r.x,r.y,'fk');return;}const lead=th?6:1.2,tx=r.x+T.dir*lead,ty=r.y;
  let ok=Math.random()<p;let ex=tx,ey=ty;const icp=ok?fxIcp(c,r):null;if(icp){ok=false;ex=icp.x;ey=icp.y;}else if(!ok){const e=4+Math.random()*7,a=Math.random()*6.283;ex+=Math.cos(a)*e;ey+=Math.sin(a)*e;}
  const L=Math.hypot(ex-c.x,ey-c.y),spd=13+c.a.pa*0.09+(L>25?4:0);S.ball.own=null;S.ball.fl={from:c,to:ok?r:null,tx:ex,ty:ey,t:0,T:L/spd,x0:c.x,y0:c.y,lift:L>28?1:0,kind:th?'th':'pa',loose:!ok};
  if(ok&&th)r.run=S.pt+L/spd+0.5;r.tx=tx;r.ty=ty;S.trail.push({x0:c.x,y0:c.y,x1:ex,y1:ey,t:1,c:T.side});}
function fxCross(c){const S=FX,T=c.T,O=fxOpp(T),st=S.stats[T.side];st.pa++;c.s.pa++;const tx=fxX(T,FXL-8-Math.random()*6),ty=34+(Math.random()-0.5)*12;
  const att=fxOn(T).filter(q=>q!==c&&FXL-fxU(T,q.x)<20).sort((a,b)=>Math.hypot(a.x-tx,a.y-ty)-Math.hypot(b.x-tx,b.y-ty))[0];
  const def=fxOn(O).filter(q=>q.spos!=='KL').sort((a,b)=>Math.hypot(a.x-tx,a.y-ty)-Math.hypot(b.x-tx,b.y-ty))[0];
  const aw=att?att.a.ph*0.3+att.a.sh*0.1+fxAirA(att)+Math.random()*30:0,dw=def?def.a.ph*0.22+def.a.df*0.18+fxAirD(def)+Math.random()*30+6:0,ok=att&&Math.random()<clamp(0.55+(c.a.pa-65)*0.004+fxCrQ(c),0.2,0.88);
  const L=Math.hypot(tx-c.x,ty-c.y);S.ball.own=null;S.ball.fl={from:c,to:ok&&aw>dw?att:null,tx,ty,t:0,T:L/20,x0:c.x,y0:c.y,lift:1,kind:'cr',hdr:ok&&aw>dw,loose:!(ok&&aw>dw),def:def};
  if(att){att.tx=tx;att.ty=ty;}S.trail.push({x0:c.x,y0:c.y,x1:tx,y1:ty,t:1,c:T.side});}
function fxClear(c){const S=FX,T=c.T,tx=fxX(T,55+Math.random()*25),ty=10+Math.random()*48,L=Math.hypot(tx-c.x,ty-c.y);S.ball.own=null;S.ball.fl={from:c,to:null,tx,ty,t:0,T:L/24,x0:c.x,y0:c.y,lift:1,kind:'cl',loose:true};}
function fxShoot(c,pr,setK){const S=FX,T=c.T,O=fxOpp(T),st=S.stats[T.side],gk=fxOn(O).find(q=>q.spos==='KL');st.sh++;c.s.sh++;
  let xg=setK==='pen'?0.76:setK==='fk'?0.06:fxXG(T,c.x,c.y)*(1-clamp((3-pr)*0.12,0,0.3));st.xg+=xg;
  const ff=setK?1:fxFF(T.side);const q=clamp(xg*ff*(1+(c.a.sh-68)*0.007+fxShQ(c,pr,setK))*(gk?1-(gk.a.gk-68)*0.006-fxGkQ(gk):1.3),0.004,0.92),onT=Math.min(0.95,q+0.24+c.a.sh*0.0022+(fxF(c,'Teknik')-12)*0.004);
  let blk=0;if(!setK)for(const d of fxOn(O)){if(d.spos==='KL')continue;const gx2=fxX(T,FXL),L2=Math.hypot(gx2-c.x,34-c.y),t2=clamp(((d.x-c.x)*(gx2-c.x)+(d.y-c.y)*(34-c.y))/(L2*L2),0,1),dd=Math.hypot(c.x+(gx2-c.x)*t2-d.x,c.y+(34-c.y)*t2-d.y);if(dd<1.4&&t2>0.05)blk+=0.3;}
  const isB=Math.random()<Math.min(0.6,blk);if(!isB)st.xgA=(st.xgA||0)+xg*(setK==='pen'?0.6:setK?0.5:1);const r=Math.random(),res=isB?'bl':r<q?'g':r<onT?'sv':Math.random()<0.07?'post':'off';
  const gx=fxX(T,FXL),gy=34+(res==='off'?(Math.random()<0.5?-1:1)*(4.5+Math.random()*5):(Math.random()-0.5)*6),L=Math.hypot(gx-c.x,gy-c.y);
  S.ball.own=null;S.ball.fl={from:c,to:null,tx:gx,ty:gy,t:0,T:L/27,x0:c.x,y0:c.y,lift:0,kind:'sh',res,xg,gk,loose:false};c.rt+=0.05;}
function fxFlight(dt){const S=FX,B=S.ball,f=B.fl;f.t+=dt;const k=Math.min(1,f.t/f.T);B.x=f.x0+(f.tx-f.x0)*k;B.y=f.y0+(f.ty-f.y0)*k;B.z=f.lift?Math.sin(k*Math.PI)*(f.kind==='cr'?4:6):0;
  if(f.kind==='pa'&&k>0.25&&k<0.9&&!f.chk){const O=fxOpp(f.from.T);for(const q of fxOn(O)){if(Math.hypot(q.x-B.x,q.y-B.y)<0.9&&B.z<1.6&&Math.random()<0.06+q.a.df*0.0012){f.chk=1;q.s.tk++;fxGain(q,'int');S.trail.length=0;return;}}}
  if(k<1)return;
  if(f.kind==='sh')return fxShotEnd(f);
  if(f.kind==='cr'){if(f.hdr&&f.to&&!f.to.off){const a=f.to;a.x=f.tx;a.y=f.ty;S.stats[a.T.side].pc++;a.s.pc++;B.own=a;B.last=a;B.fl=null;const xg=clamp(0.09+(a.a.ph-65)*0.003,0.04,0.2);fxHeader(a,xg,f.from);return;}
    if(f.def&&Math.random()<0.75){B.fl=null;fxGain(f.def,'int');fxClearAfter(f.def);return;}B.fl=null;B.lv={x:(Math.random()-0.5)*6,y:(Math.random()-0.5)*6};return;}
  if(f.to&&!f.to.off){const r=f.to,ft=Math.random()<0.04*(1.5-r.a.dr/100)*(fxPressure(r)<2?2:1);if(!ft){r.x=f.tx;r.y=f.ty;S.stats[r.T.side].pc++;f.from.s.pc++;f.from.rt+=0.004;fxGain(r,'pass');r.lastFrom=f.from;r.lfT=S.pt;if(f.kind==='th')r.dt=0.1;return;}}
  B.fl=null;B.lv={x:(Math.random()-0.5)*4,y:(Math.random()-0.5)*4};if(f.from&&f.from.T)f.from.rt-=0.02;fxBounds();}
function fxClearAfter(d){d.dt=0.05;}
function fxHeader(a,xg,from){const S=FX,T=a.T,O=fxOpp(T),gk=fxOn(O).find(q=>q.spos==='KL'),st=S.stats[T.side];st.sh++;st.xg+=xg;a.s.sh++;const ff=fxFF(T.side);st.xgA=(st.xgA||0)+xg;const q=clamp(xg*ff*(1+(fxF(a,'Kafa Vuruşu')-12)*0.03)*(gk?1-(gk.a.gk-68)*0.007-fxGkQ(gk)*0.8:1.2),0.02,0.6),r=Math.random();
  const res=r<q?'g':r<q+0.25?'sv':'off',gx=fxX(T,FXL),gy=34+(res==='off'?(Math.random()<0.5?-1:1)*5.5:(Math.random()-0.5)*5);a.lastFrom=from;a.lfT=S.pt;
  S.ball.own=null;S.ball.fl={from:a,to:null,tx:gx,ty:gy,t:0,T:0.45,x0:a.x,y0:a.y,lift:0,kind:'sh',res,xg,gk,hdr:true};}
function fxShotEnd(f){const S=FX,B=S.ball,c=f.from,T=c.T,O=fxOpp(T),st=S.stats[T.side],mn=fxMin(),nm=c.sur;B.fl=null;
  if(f.res==='g'){st.son++;c.s.son++;c.s.g++;c.rt+=1;S.score[T.side]++;const as=c.lastFrom&&S.pt-c.lfT<6&&c.lastFrom.T===T?c.lastFrom:null;if(as){as.s.as++;as.rt+=0.6;}
    if(f.gk)f.gk.rt-=0.3;for(const d of fxOn(O))if(d.spos==='DF')d.rt-=0.08;if(T===S.U)S.scorers.push(c.k);
    fxEv(mn,`GOL! ${T.name}: ${c.name}${f.hdr?' kafayla':''} ağları buldu${as?` (asist: ${as.sur})`:''}. ${S.score[0]}-${S.score[1]}`,T===S.U?'us':'opp');S.pop={t:3.2,name:c.name,num:c.num,club:clubObj(T.id)||T,short:T.short,us:T===S.U,g:c.s.g,min:mn,as:as?as.sur:null};S.hl=3;fxPopUI();
    fxKick(O.side);return;}
  if(f.res==='sv'){st.son++;c.s.son++;if(f.gk){f.gk.s.sv++;f.gk.rt+=0.22;}if(f.xg>0.2||Math.random()<0.3)fxEv(mn,`${c.name} ${f.hdr?'kafayı vurdu':'şutunu çekti'}, ${f.gk?f.gk.sur:'kaleci'} kurtardı!`,'');
    if(f.gk&&Math.random()<0.6){f.gk.x=B.x;f.gk.y=B.y;fxGain(f.gk,'save');}else{st.co++;fxCorner(T);}return;}
  if(f.res==='bl'){if(Math.random()<0.5){st.co++;fxCorner(T);}else{B.lv={x:-T.dir*(3+Math.random()*4),y:(Math.random()-0.5)*6};B.x-=T.dir*2;}return;}
  if(f.res==='post')fxEv(mn,`${c.name} vurdu… direk! Top oyun alanına döndü.`,'');else if(f.xg>0.25)fxEv(mn,`${c.name} büyük fırsatı kaçırdı.`,'');
  if(f.res==='post'){B.x=fxX(T,FXL-2);B.lv={x:-T.dir*5,y:(Math.random()-0.5)*8};return;}
  const gk=fxOn(O).find(q=>q.spos==='KL');if(gk)fxSet(O,fxX(O,5.5),34,'gk');}
function fxCorner(T){const S=FX,cx=fxX(T,FXL-0.5),cy=Math.random()<0.5?0.5:FXW-0.5;const tk=fxOn(T).filter(q=>q.spos==='KN'||q.spos==='OS')&&false||fxTaker(T,'ck')||fxOn(T)[1];
  for(const q of fxOn(T))if(q.spos==='DF'&&q.a.ph>60&&q.d<0.4&&Math.random()<0.6){q.x=fxX(T,FXL-9-Math.random()*5);q.y=30+Math.random()*8;}
  B_set(tk,cx,cy);FX.setT=1.4;FX.setK='co';setTimeout0(()=>0);}
function B_set(p,x,y){const B=FX.ball;B.x=x;B.y=y;B.z=0;B.fl=null;B.lv=null;B.own=p;p.x=x;p.y=y;B.last=p;p.dt=0.2;p.cornerTake=1;}
function setTimeout0(){}
function fxBounds(){const S=FX,B=S.ball;if(B.y<0||B.y>FXW){const last=B.last,T=last?fxOpp(last.T):S.U;fxSet(T,clamp(B.x,1,FXL-1),B.y<0?0.5:FXW-0.5,'th');return;}
  if(B.x<0||B.x>FXL){const atkSide=B.x>FXL?0:1,last=B.last;const T=S.T[atkSide],D=S.T[1-atkSide];if(last&&last.T===D){S.stats[atkSide].co++;fxCorner(T);}else fxSet(D,fxX(D,5.5),34,'gk');}}
/* ---------- müdahale & faul ---------- */
function fxTackles(c,dt){const S=FX,T=c.T,O=fxOpp(T),shk=O.sh&&O.sh.until>S.t?O.sh.k:null;
  for(const d of fxOn(O)){if(d.cool>0||fxD(d,c)>1.6||d.spos==='KL'&&fxU(O,d.x)>18)continue;const agg=O.tac.agg*(shk==='atesle'?1.2:shk==='sakin'?0.8:1);
    if(Math.random()>dt*1.6*agg*fxTkF(d)*(fxU(O,d.x)<20?1.6:1))continue;const inBox=FXL-fxU(T,c.x)<16.5&&Math.abs(fxV(T,c.y)-34)<20,foulP=0.03*agg*(inBox?0.3:1)*(shk==='odak'||shk==='sakin'?0.7:1)*(1.3-d.st/250)*fxFoulM(d);
    if(Math.random()<foulP)return fxFoul(d,c);
    const win=0.5+(d.a.df-c.a.dr)*0.0045+(d.a.ph-c.a.ph)*0.002+(O.tac.agg-1)*0.1+fxTkW(d,c);
    if(Math.random()<win){if(Math.random()<0.7)fxGain(d,'tackle');else{S.ball.own=null;S.ball.lv={x:(Math.random()-0.5)*7,y:(Math.random()-0.5)*7};d.s.tk++;}d.rt+=0.07;return;}
    d.cool=0.9;c.rt+=0.03;}}
function fxFoul(d,c){const S=FX,O=d.T,T=c.T,mn=fxMin();S.stats[O.side].fo++;d.rt-=0.05;const u=fxU(T,c.x),v=fxV(T,c.y),box=FXL-u<16.5&&Math.abs(v-34)<20;
  const shk=O.sh&&O.sh.until>S.t?O.sh.k:null,yc=Math.random()<(0.13*O.tac.agg+(box?0.1:0))*(shk==='odak'||shk==='sakin'?0.7:1);
  if(yc){d.yel++;S.stats[O.side].yc++;d.rt-=0.2;if(d.yel>=2||Math.random()<0.04){d.off=true;d.rt-=1;fxEv(mn,`KIRMIZI KART! ${d.name} (${O.short}) oyundan atıldı.`,'red');fxLam();S.hl=2;}else fxEv(mn,`${d.name} (${O.short}) sarı kart gördü.`,'');}
  if(box&&Math.random()<0.65){S.ball.own=c;return;}
  if(box){fxEv(mn,`PENALTI! ${c.name} ceza sahasında düşürüldü.`,'bold');const tk=fxTaker(T,'pen');fxSet(T,fxX(T,FXL-11),34,'pen');S.ball.own=tk;tk.x=fxX(T,FXL-11);tk.y=34;S.ball.x=tk.x;S.ball.y=34;tk.penT=1;tk.dt=1.4;return;}
  fxSet(T,c.x,c.y,'fk');if(FXL-u<30&&Math.abs(v-34)<16){const tk=fxTaker(T,'fk');S.ball.own=tk;tk.x=c.x;tk.y=c.y;tk.fkT=1;tk.dt=1.2;}}
/* serbest vuruş/penaltı kararı */
const _fxDecide=fxDecide;
fxDecide=function(c){if(c.penT){c.penT=0;return fxShoot(c,9,'pen');}if(c.fkT){c.fkT=0;if(Math.random()<0.55)return fxShoot(c,9,'fk');}if(c.cornerTake){c.cornerTake=0;return fxCross(c);}return _fxDecide(c);};
/* ---------- rakip hoca yapay zekası ---------- */
function fxCoachAI(){const S=FX,O=S.O,mn=fxMin(),d=S.score[1]-S.score[0];
  if(mn>=60&&d<0&&O.tacK!=='hucum'&&Math.random()<0.6){O.tacK='hucum';O.ti=Object.assign({},O.ti,{tempo:'yuk',pres:'yuk',orta:'bol'});O.tac=fxTac(O.ti,'hucum');fxEv(mn,`${O.name} hücuma ağırlık verdi: daha fazla oyuncu ileride.`,'tac');fxLam();}
  if(mn>=70&&d>0&&O.tacK!=='savunma'&&Math.random()<0.6){O.tacK='savunma';O.ti=Object.assign({},O.ti,{pres:'dus',hat:'derin',tempo:'dus'});O.tac=fxTac(O.ti,'savunma');fxEv(mn,`${O.name} skoru korumak için geri çekildi.`,'tac');fxLam();}
  if(mn>=58&&O.subs<5){const tired=fxOn(O).filter(p=>p.spos!=='KL'&&(p.st<62||p.yel)).sort((a,b)=>a.st-b.st)[0];if(tired&&O.bench.length&&Math.random()<0.5)fxSub(O,tired,O.bench.find(b=>b.pos===tired.pos)||O.bench[0]);}}
function fxSub(T,out,inP){if(!out||!inP||T.subs>=5)return false;const i=T.P.indexOf(out),S=FMF[T.form];const np=fxMkP(T,inP,out.slot,S,T===FX.U?fmInit().fm.roles:null,0,1);np.d=out.d;np.l=out.l;np.x=out.x;np.y=out.y;
  out.off=true;out.subbed=true;T.P.push(np);T.bench=T.bench.filter(b=>b.k!==inP.k);T.subs++;if(FX.ball.own===out){FX.ball.own=np;}fxEv(fxMin(),`Oyuncu değişikliği (${T.short}): ${out.name} çıktı, ${inP.name} girdi.`,'sub');return true;}
/* ---------- yardımcı antrenör (yapay zeka) ---------- */
function fxAdvice(){const S=FX,U=S.U,O=S.O,su=S.stats[0],so=S.stats[1],out=[],mn=fxMin(),pos=su.pos/Math.max(1,su.pos+so.pos),d=S.score[0]-S.score[1];
  const tired=fxOn(U).filter(p=>p.st<55&&p.spos!=='KL').sort((a,b)=>a.st-b.st)[0];if(tired&&U.subs<5&&U.bench.length)out.push({id:'sub',t:`${tired.sur} çok yoruldu (kondisyon ${Math.round(tired.st)}). Değiştirelim mi?`,a:()=>{const b=U.bench.find(x=>x.pos===tired.pos)||U.bench[0];fxSub(U,tired,b);}});
  if(so.xg>su.xg+0.6&&U.tacK!=='savunma')out.push({id:'def',t:'Rakip bizden net pozisyonlar buluyor. Savunma çizgisini geri çekip daha kompakt olalım.',a:()=>fxSetTi({hat:'derin',pres:'orta'},'dengeli')});
  if(pos<0.4&&U.ti.pres!=='yuk'&&d<=0)out.push({id:'prs',t:'Topa sahip olamıyoruz. Önde pres yapıp topu erken kazanalım.',a:()=>fxSetTi({pres:'yuk',kayip:'karsi'})});
  if(su.pa>30&&su.pc/su.pa<0.72&&U.ti.pas!=='kisa')out.push({id:'pas',t:`Pas isabetimiz düşük (%${Math.round(su.pc/su.pa*100)}). Kısa paslarla oynayalım.`,a:()=>fxSetTi({pas:'kisa',tempo:'nor'})});
  if(mn>=65&&d<0&&U.tacK!=='hucum')out.push({id:'huc',t:'Geriye düştük, süre azalıyor. Hücum yaklaşımına geçelim.',a:()=>fxSetTi({tempo:'yuk',orta:'bol'},'hucum')});
  if(mn>=75&&d>0&&U.tacK==='hucum')out.push({id:'kor',t:'Öndeyiz. Skoru korumak için dengeye dönelim.',a:()=>fxSetTi({tempo:'dus'},'dengeli')});
  if(su.co+su.sh<3&&mn>25&&U.ti.gen!=='gen')out.push({id:'gen',t:'Hücumda üretkenlik yok. Oyunu genişletip kanatları kullanalım.',a:()=>fxSetTi({gen:'gen'})});
  const yel=fxOn(U).find(p=>p.yel===1&&p.spos==='DF');if(yel&&U.ti.mud==='sert')out.push({id:'kart',t:`${yel.sur} sarı kartlı. Müdahalelerde dikkatli olalım.`,a:()=>fxSetTi({mud:'yum'})});
  S.adv=out.slice(0,3);if(S.adv.length&&S.tab!=='as')S.advNew=1;}
function fxSetTi(ti,tac){const U=FX.U,m=fmInit();Object.assign(U.ti,ti);if(tac){U.tacK=tac;m.tac=tac;}Object.assign(m.fm.ti,ti);U.tac=fxTac(U.ti,U.tacK);fxLam();fxEv(fxMin(),`Kenardan talimat: ${Object.entries(ti).map(([k,v])=>{const t=TI.find(x=>x.k===k),o=t&&t.o.find(x=>x[0]===v);return t&&o?t.n+' → '+o[1]:'';}).filter(Boolean).join(', ')}${tac?` · ${TAC[tac].n}`:''}.`,'tac');}
function fxShout(k){const S=FX,U=S.U;if(S.t-S.shoutT<240)return toast('Az önce seslendin; biraz bekle');S.shoutT=S.t;const h=harm(),ok=Math.random()<clamp(0.55+h/150+sF('yrd')*0.15,0.2,0.92);
  U.sh={k:ok?k:null,until:S.t+600};if(ok&&(k==='cesaret'||k==='ovgu'))for(const p of fxOn(U))p.rt+=0.05;
  fxEv(fxMin(),`Kenardan: “${FX_SHOUT[k][0]}!” ${ok?'Oyuncular olumlu tepki verdi.':'Oyuncular pek etkilenmedi.'}`,'tac');fxUI();}
/* ---------- arayüz ---------- */
function fxResize(){const cv=$('#fxCv');if(!cv)return;const desk=window.innerWidth>=1000,tH=(($('#fxTop')||{}).offsetHeight||110)+40,w=Math.round(desk?Math.min(cv.parentNode.clientWidth-28,(window.innerHeight-tH)*FXW/FXL/0.92):Math.min(460,cv.parentNode.clientWidth,window.innerHeight*0.56*FXW/FXL/0.92)),h=Math.round(w*FXL/FXW*0.92);const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';FX.cw=w;FX.ch=h;FX.dpr=dpr;}
let fxLast=0,fxAcc=0;
function fxPx(x,y){const m=10,pw=FX.cw-m*2,ph=FX.ch-m*2;return [m+(y/FXW)*pw,m+(1-x/FXL)*ph];}
function fxDraw(){const cv=$('#fxCv');if(!cv)return;const c=cv.getContext('2d'),S=FX,dpr=S.dpr,W=S.cw,H=S.ch;c.setTransform(dpr,0,0,dpr,0,0);
  c.fillStyle='#3f9b46';c.fillRect(0,0,W,H);const m=10,pw=W-m*2,ph=H-m*2;for(let i=0;i<14;i++)for(let j=0;j<10;j++){if((i+j)%2)continue;c.fillStyle='rgba(255,255,255,.06)';c.fillRect(m+pw*j/10,m+ph*i/14,pw/10,ph/14);}
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.3;c.strokeRect(m,m,pw,ph);const P=(x,y)=>fxPx(x,y);
  let [a,b]=P(52.5,0),[a2]=P(52.5,FXW);c.beginPath();c.moveTo(a,b);c.lineTo(a2,b);c.stroke();const [cx,cy]=P(52.5,34),sc=pw/FXW;c.beginPath();c.arc(cx,cy,9.15*sc,0,7);c.stroke();
  for(const end of [0,1]){const X=e=>end?FXL-e:e;let [x1,y1]=P(X(16.5),13.85),[x2,y2]=P(X(0),54.15);c.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
    [x1,y1]=P(X(5.5),24.85);[x2,y2]=P(X(0),43.15);c.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
    [x1,y1]=P(X(0),30.34);[x2,y2]=P(X(-1.5),37.66);c.fillStyle='rgba(255,255,255,.85)';c.fillRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));}
  for(const tr of S.trail){const [x0,y0]=P(tr.x0,tr.y0),[x1,y1]=P(tr.x1,tr.y1);c.strokeStyle=`rgba(255,255,255,${tr.t*0.22})`;c.setLineDash([4,4]);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.setLineDash([]);}
  const col=(T)=>{const u=S.U,o=S.O;if(T===u)return [u.c1,u.c2];const dd=(h1,h2)=>{const f=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=f(h1),B=f(h2);return Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs(A[2]-B[2]);};
    return dd(o.c1,u.c1)<160?(dd(o.c2,u.c1)<160?['#f2f2f2','#222']:[o.c2,o.c1]):[o.c1,o.c2];};
  const B=S.ball,r=Math.max(7,pw/40);c.font=`800 ${Math.round(r*1.05)}px Barlow Semi Condensed,sans-serif`;c.textAlign='center';c.textBaseline='middle';
  for(const T of S.T){const [f,s]=col(T);for(const p of fxOn(T)){const [x,y]=P(p.x,p.y);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(x+1,y+2,r,r*0.8,0,0,7);c.fill();
      c.fillStyle=p.spos==='KL'?(T===S.U?'#2ec4b6':'#f4a261'):f;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.lineWidth=2;c.strokeStyle=B.own===p?'#fff':s;c.stroke();
      if(B.own===p){c.strokeStyle='rgba(255,230,120,.9)';c.lineWidth=1.5;c.beginPath();c.arc(x,y,r+3.5,0,7);c.stroke();}
      c.fillStyle=p.spos==='KL'?'#111':s;c.fillText(p.num,x,y+0.5);
      if(S.names){c.font=`700 ${Math.round(r*0.95)}px Barlow Semi Condensed,sans-serif`;c.fillStyle='rgba(0,0,0,.55)';const w=c.measureText(p.sur).width+6;c.fillRect(x-w/2,y+r+1,w,r*1.3);c.fillStyle='#fff';c.fillText(p.sur,x,y+r+1+r*0.66);c.font=`800 ${Math.round(r*1.05)}px Barlow Semi Condensed,sans-serif`;}
      if(p.yel){c.fillStyle='#ffd23f';c.fillRect(x+r-2,y-r-2,4,6);}}}
  const [bx,by]=P(B.x,B.y);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(bx+1+B.z,by+2+B.z,3,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(bx,by-B.z*1.5,3.4+B.z*0.25,0,7);c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();
  if(S.flash){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,H/2-34,W,68);c.font='900 44px Barlow Semi Condensed,sans-serif';c.fillStyle=S.flash.us?'#35d49a':'#ff6a5f';c.fillText(S.flash.txt,W/2,H/2);}
  if(S.phase!=='play'){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);c.font='800 22px Barlow Semi Condensed,sans-serif';c.fillStyle='#fff';c.fillText(S.phase==='pre'?'Başlamak için ▶':S.phase==='ht'?'DEVRE ARASI':S.phase==='end'?'MAÇ SONU':'DURAKLATILDI',W/2,H/2);}}
function fxTopUI(){const S=FX,el=$('#fxTop');if(!el)return;const st=S.stats,tp=st[0].pos+st[1].pos||1,pu=Math.round(st[0].pos/tp*100);
  el.innerHTML=`<div class="fx-sb"><div class="fx-tm">${crestSVG(CLUBS[S.U.id]||S.U,26)}<b>${esc(S.U.short)}</b></div><div class="fx-sc"><b>${S.score[0]} - ${S.score[1]}</b><small>${S.phase==='end'?'MS':fxMin()+'’'}</small></div><div class="fx-tm r"><b>${esc(S.O.short)}</b>${crestSVG(clubObj(S.O.id)||S.O,26)}</div></div>
   <div class="fx-pos"><i style="width:${pu}%"></i></div><small class="fx-posl"><span>Topla oynama %${pu}</span><span>xG ${dec(st[0].xg,2)} - ${dec(st[1].xg,2)}</span></small>`;
  const pb=$('#fxPlay');if(pb)pb.textContent=S.phase==='play'?'⏸':'▶';
  const bn=$('#fxBan');if(bn){const e=S.ev[0];bn.textContent=e?`${e.m}’ ${e.t}`:'';bn.className='fx-ban '+(e?e.c:'');}
  const inf=$('#fxInfo');if(inf)inf.textContent=`⇄ ${5-S.U.subs}/5 · ◎ ${TAC[S.U.tacK]?TAC[S.U.tacK].n:''}`;}
const fxR=p=>Math.round(clamp(6.3+(p.rt-6.3)*0.42,3,10)*10)/10;
function fxPopUI(){const el=$('#fxPop');if(!el||!FX)return;const P=FX.pop;if(!P){el.innerHTML='';return;}
  el.innerHTML=`<div class="fx-goal"><div class="gc" style="background:${P.club.c1||'#3157d6'};color:${P.club.c2||'#fff'}">${crestSVG(P.club,40)}<span>${esc(P.short)}</span></div><div class="gt"><b>${P.num} ${esc(P.name)}</b><small>GOL · ${P.min}’${P.g>1?` · maçtaki ${P.g}. golü`:''}${P.as?` · asist ${esc(P.as)}`:''}</small></div></div>`;}
function fxBodyUI(){const S=FX,el=$('#fxBody');if(!el)return;const t=S.tab;let h='';
  if(S.phase==='ht'&&!S.htDone){el.innerHTML=fxHTHTML();return;}if(S.phase==='end'){if(!el.querySelector('[data-fx=done]'))el.innerHTML=fxEndHTML();return;}
  if(t==='ev')h=`<ul class="fx-ev">${S.ev.slice(0,30).map(e=>`<li class="${e.c}"><i>${e.m}’</i>${esc(e.t)}</li>`).join('')}</ul>`;
  else if(t==='st'){const a=S.stats[0],b=S.stats[1],tp=a.pos+b.pos||1,row=(l,x,y,f)=>{const s=(x+y)||1;return `<div class="fx-str"><b>${f?f(x):x}</b><span>${l}</span><b>${f?f(y):y}</b><i><em style="width:${x/s*100}%"></em></i></div>`;};
    h=row('Topla oynama',Math.round(a.pos/tp*100),Math.round(b.pos/tp*100),v=>'%'+v)+row('Şut',a.sh,b.sh)+row('İsabetli şut',a.son,b.son)+row('Gol beklentisi (xG)',+a.xg.toFixed(2),+b.xg.toFixed(2))+row('Pas isabeti',a.pa?Math.round(a.pc/a.pa*100):0,b.pa?Math.round(b.pc/b.pa*100):0,v=>'%'+v)+row('Korner',a.co,b.co)+row('Faul',a.fo,b.fo)+row('Sarı kart',a.yc,b.yc);}
  else if(t==='ky'){const U=S.U;h=`<p class="fx-sub">Değişiklik hakkı ${5-U.subs}/5 · ${S.sel?'Oyuna girecek oyuncuyu seç':'Çıkacak oyuncuya dokun'}</p><div class="fx-pl">${fxOn(U).sort((a,b)=>a.slot-b.slot).map(p=>`<button data-fx="selp" data-k="${p.k}" class="${S.sel===p.k?'on':''}"><span>${p.spos}</span><b>${esc(p.name)}${p.yel?' 🟨':''}</b><i class="fx-stb"><em style="width:${p.st}%" class="${p.st<55?'lo':''}"></em></i><em class="rt">${dec(fxR(p),1)}</em></button>`).join('')}</div>
    ${S.sel?`<p class="fx-sub">Yedekler</p><div class="fx-pl">${U.bench.map(b=>`<button data-fx="subin" data-k="${b.k}"><span>${dpTag(b)}</span><b>${esc(b.name)}</b><em class="rt">${R200(b.ovr)}</em></button>`).join('')||'<p class="muted">Yedek kalmadı</p>'}</div>`:''}`;}
  else if(t==='tk'){const U=S.U,rows=['pas','tempo','gen','hat','pres','kayip','kazan','mud'].map(k=>{const T0=TI.find(x=>x.k===k);return `<div class="ti-row"><span>${T0.n}</span><div class="seg2">${T0.o.map(o=>`<button class="chip" data-fx="ti" data-k="${k}" data-v="${o[0]}" aria-pressed="${(U.ti[k]||T0.d)===o[0]}">${o[1]}</button>`).join('')}</div></div>`;}).join('');
    h=`<p class="fx-sub">Kenardan seslen ${S.t-S.shoutT<240?'(bekle)':''}</p><div class="fx-sh">${Object.entries(FX_SHOUT).map(([k,v])=>`<button data-fx="shout" data-k="${k}" class="${U.sh&&U.sh.k===k&&U.sh.until>S.t?'on':''}"><b>${v[0]}</b><small>${v[1]}</small></button>`).join('')}</div>
     <p class="fx-sub">Yaklaşım</p><div class="seg2">${Object.entries(TAC).map(([k,v])=>`<button class="chip" data-fx="tac" data-k="${k}" aria-pressed="${U.tacK===k}">${v.n}</button>`).join('')}</div>${rows}`;}
  else{h=S.adv.length?`<div class="fx-adv">${S.adv.map((a,i)=>`<div><p><b>Yardımcı antrenör:</b> ${esc(a.t)}</p><button class="cta sm" data-fx="advok" data-k="${i}">Uygula</button></div>`).join('')}</div>`:'<p class="muted" style="padding:10px">Şu an bir önerim yok hocam. Maçı izliyorum.</p>';S.advNew=0;}
  el.innerHTML=h;}
function fxUI(){fxTopUI();fxBodyUI();const S=FX;document.querySelectorAll('#fx .fx-tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.k===S.tab);b.classList.toggle('new',b.dataset.k==='as'&&!!S.advNew);});
  document.querySelectorAll('#fx .fx-ctl [data-fx=spd]').forEach(b=>b.classList.toggle('on',+b.dataset.k===S.spd));
  if(false){$('#fxBody').innerHTML=`<div class="fx-ht"><h3>Devre arası · ${S.score[0]}-${S.score[1]}</h3><p>Soyunma odasında oyunculara ne söyleyeceksin?</p>${[['sakin','Sakin ve net ol'],['ovgu','Övgü: “Böyle devam”'],['ofke','Öfke: “Bu kabul edilemez!”'],['beklenti','“Sizden daha fazlasını bekliyorum”']].map(([k,l])=>`<button class="btn" data-fx="htt" data-k="${k}">${l}</button>`).join('')}</div>`;}
}
function fxHTHTML(){const S=FX;return `<div class="fx-ht"><h3>Devre arası · ${S.score[0]}-${S.score[1]}</h3><p>Soyunma odasında oyunculara ne söyleyeceksin?</p>${[['sakin','Sakin ve net ol'],['ovgu','Övgü: “Böyle devam”'],['ofke','Öfke: “Bu kabul edilemez!”'],['beklenti','“Sizden daha fazlasını bekliyorum”']].map(([k,l])=>`<button class="btn" data-fx="htt" data-k="${k}">${l}</button>`).join('')}</div>`;}
function fxEndHTML(){const S=FX,all=S.T.flatMap(T=>T.P.filter(p=>!p.subbed||p.s.pa>0)),motm=all.slice().sort((a,b)=>b.rt-a.rt)[0];
  return `<div class="fx-ht"><h3>Maç sonu · ${S.score[0]}-${S.score[1]}</h3><p>Maçın oyuncusu: <b>${esc(motm.name)}</b> (${esc(motm.T.short)}) · ${dec(fxR(motm),1)}</p>
   <div class="fx-pl">${S.U.P.filter(p=>!p.subbed||p.s.pa>0).sort((a,b)=>b.rt-a.rt).map(p=>`<div class="fx-r"><span>${p.spos}</span><b>${esc(p.name)}</b><small>${p.s.g?'⚽'.repeat(p.s.g):''}${p.s.as?' 🅰'.repeat(p.s.as):''}</small><em class="rt">${dec(fxR(p),1)}</em></div>`).join('')}</div>
   <button class="cta" data-fx="done">Devam</button></div>`;}
function fxAct(a,k,v){const S=FX;if(!S)return;
  if(a==='play'){if(S.phase==='play')S.phase='pause';else if(S.phase==='pause'||S.phase==='pre')S.phase='play';else if(S.phase==='ht'&&S.htDone)fxSecond();fxUI();return;}
  if(a==='spd'){S.spd=+k;if(S.phase==='pre'||S.phase==='pause')S.phase='play';fxUI();return;}
  if(a==='names'){S.names=!S.names;return;}
  if(a==='tab'){S.tab=k;S.sel=null;fxUI();return;}
  if(a==='ti'){fxSetTi({[k]:v});fxUI();return;}
  if(a==='tac'){fxSetTi({},k);fxUI();return;}
  if(a==='shout'){fxShout(k);return;}
  if(a==='selp'){S.sel=S.sel===k?null:k;fxUI();return;}
  if(a==='subin'){const out=S.U.P.find(p=>p.k===S.sel&&!p.off),inP=S.U.bench.find(b=>b.k===k);if(S.U.subs>=5)return toast('Değişiklik hakkın kalmadı');if(fxSub(S.U,out,inP)){S.sel=null;fxUI();}return;}
  if(a==='advok'){const ad=S.adv[+k];if(ad){ad.a();S.adv.splice(+k,1);}fxUI();return;}
  if(a==='htt'){const h=harm(),U=S.U,ok=Math.random()<clamp(0.5+h/120,0.2,0.9),d=S.score[0]-S.score[1];let eff=0,txt='';
    if(k==='sakin'){eff=0.02;txt='Oyuncular sakin bir şekilde ikinci yarıya hazırlanıyor.';}else if(k==='ovgu'){eff=d>=0?0.05:-0.02;txt=d>=0?'Övgü moral verdi.':'Geride olmamıza rağmen övgü pek inandırıcı gelmedi.';}
    else if(k==='ofke'){eff=d<0?(ok?0.06:-0.05):-0.04;txt=eff>0?'Sert sözlerin takımı ateşledi!':'Sert çıkışın oyuncuları gerdi.';}else{eff=ok?0.04:-0.02;txt=ok?'Oyuncular mesajı aldı.':'Mesaj pek karşılık bulmadı.';}
    for(const p of fxOn(U)){p.rt+=eff;for(const q in p.a)p.a[q]=clamp(p.a[q]+eff*40,10,99);}fxEv(45,`Devre arası konuşması: ${txt}`,'tac');S.htDone=true;fxSecond();return;}
  if(a==='done'){fxClose();return;}}
function fxSecond(){const S=FX;S.half=2;S.t=45*60;S.end=90*60+rint(1,5)*60;fxKick(1);S.phase='play';fxEv(46,'İkinci yarı başladı.','');fxUI();}
function fxClose(){const S=FX;cancelAnimationFrame(S.raf);$('#fx').hidden=true;$('#tabs').hidden=false;document.documentElement.classList.remove('playing');const o=S.o,gu=S.score[0],go=S.score[1],sc=S.scorers.slice();
  const ratings={};for(const p of S.U.P)ratings[p.k]=fxR(p);if(G&&G.m)G.m.lastRt=ratings;FX=null;o.onEnd(gu,go,sc);}
/* hızlı simülasyon (test ve "Hızlı sonuç" için başsız) */
function fxHeadless(o){fxStartHeadless(o);let g=0;FX.phase='play';while(FX.phase!=='end'&&g++<80000){fxStep(0.1);if(FX.phase==='ht'){FX.htDone=true;FX.half=2;FX.t=45*60;fxKick(1);FX.phase='play';}}const r=[FX.score[0],FX.score[1],FX.stats];FX=null;return r;}
function fxStartHeadless(o){const _op=fxOpen;fxOpen=function(){};try{fxStart(o);}finally{fxOpen=_op;}FX.U.famF=clamp((fmInit().fm.fam||50)/100,0.2,1);FX.O.famF=0.7;}

